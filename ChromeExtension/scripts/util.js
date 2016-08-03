"use strict";
var $action = $action || {};
(function ($action) {
    $action.handlerIDs = 0;

    var treeWalkFast = (function () {
        // create closure for constants
        var skipTags = {
            "SCRIPT": true,
            "IFRAME": true,
            "OBJECT": true,
            "EMBED": true
        };
        return function (parent, fn, allNodes) {
            var node = parent.firstChild,
                nextNode;
            var level = 1;
            while (node && node != parent) {
                if (allNodes || node.nodeType === 1) {
                    if (fn(node, level) === false) {
                        return (false);
                    }
                }
                // if it's an element &&
                //    has children &&
                //    has a tagname && is not in the skipTags list
                //  then, we can enumerate children
                if (node.nodeType === 1 && node.firstChild && !(node.tagName && skipTags[node.tagName])) {
                    node = node.firstChild;
                    ++level;
                } else if (node.nextSibling) {
                    node = node.nextSibling;
                } else {
                    // no child and no nextsibling
                    // find parent that has a nextSibling
                    --level;
                    while ((node = node.parentNode) != parent) {
                        if (node.nextSibling) {
                            node = node.nextSibling;
                            break;
                        }
                        --level;
                    }
                }
            }
        }
    })();

    jQuery.fn.findDeepest = function () {
        var results = [];
        this.each(function () {
            var deepLevel = 0;
            var deepNode = this;
            treeWalkFast(this, function (node, level) {
                if (level > deepLevel) {
                    deepLevel = level;
                    deepNode = node;
                }
            });
            results.push(deepNode);
        });
        return this.pushStack(results);
    };


    /**
     * Takes the data object passed in and returns a new object with the instrumented handler
     * @private
     * @method instrumentHandler
     * @param {Object} data
     */
    $action.getDataDependencies = function (data) {
        try {
            var ast = esprima.parse(data.handler, {
                tolerant: true
            });
            var expressions = $action.computeSideEffectFreeExpressions(ast);
            data.dependencies = expressions;
            data.messageType = 'eventDependenciesFound';
        } catch (e) {
            // console.log("Could not parse this handler into an AST: " + data.handler);
            // console.log("Error message from parser: " + e.toString());
        }

        return data;
    }

    $action.getElementPath = function (elt) {
        var path = "";
        var node = elt;
        while (node) {
            var realNode = node,
                name = realNode.localName;
            if (!name) break;
            name = name.toLowerCase();

            var parent = node.parentNode;

            if (parent) {
                var siblings = parent.childNodes;
                if (siblings.length > 1) {
                    var index = 0;
                    var sameTagSiblings = false;
                    for (var i = 0; i < siblings.length; i++) {
                        var currNode = siblings.item(i);
                        if (currNode == node) {
                            index = i;
                            break;
                        }

                        if (currNode.tagName == node.tagName) {
                            sameTagSiblings = true;
                        }
                    }

                    if (sameTagSiblings) {
                        name += ':nth-child(' + index + ')';
                    }
                }

                path = name + (path ? '>' + path : '');
                node = parent;
            }
        }

        return path;
    };

    $action.jQueryGetElementPath = function (elt) {
        var path, node = jQuery(elt);
        while (node.length) {
            var realNode = node[0],
                name = realNode.localName;
            if (!name) break;
            name = name.toLowerCase();

            var parent = node.parent();

            var sameTagSiblings = parent.children(name);
            if (sameTagSiblings.length > 1) {
                var allSiblings = parent.children();
                var index = allSiblings.index(realNode) + 1;
                name += ':nth-child(' + index + ')';
            }

            path = name + (path ? '>' + path : '');
            node = parent;
        }

        return path;
    }

    $action.getScript = function () {
        var directive = `'use strict';`;
        var windowListener = 'window.addEventListener("message", receiveMessage, null, false, true);';
        var windowObjects = `window.geniePageHandlerMap = {};
                             window.geniePageHandlerIDs = 0;`;
        window.geniePageHandlerMap = {};
        window.geniePageHandlerIDs = 0;

        function updateEventHandlerOnElement(element, type, dependencies, oldHandler, options, useCapture) {
            // Create a wrapper around the old handler with the instrumentation
            var wrapper = function (evt) {
                if (evt.geniePollingState) {
                    // Call expressions
                    let result = true;
                    for (var i = 0; i < dependencies.length; i++) {
                        try {
                            result = eval(dependencies[i]);
                        } catch (e) {
                            console.error("Handler dependencies could not be retrieved: " + e.toString());
                        }

                        if (!result) {
                            break;
                        }
                    }

                    return result;
                } else {
                    oldHandler.apply(this, [evt]);
                }
            };

            // First, construct a new function object from the given handler

            // Remove the previous listener on the element
            element.removeEventListener(type, oldHandler, options, useCapture, true);

            // Add the new instrumented listener
            element.addEventListener(type, wrapper, options, useCapture, true); // Need last argument so that the addEventListener override knows to ignore this registration. 

            return wrapper;
        }

        /**
         * Receive messages from the content script to update the page handler map with the instrumented handlers
         * @private
         * @method receiveMessage
         */
        function receiveMessage(event) {

            if (event.source != window) {
                return;
            }

            if (event.data) {
                if (event.data.messageType == 'eventDependenciesFound') {
                    // Get the page handler object associated with this event handler ID
                    var contentObjectID = event.data.id;
                    var pageHandlerObject = window.geniePageHandlerMap[contentObjectID];
                    if (pageHandlerObject) {
                        var element = document.querySelector(pageHandlerObject.path);
                        if (element) {
                            var newHandler = updateEventHandlerOnElement(element, pageHandlerObject.eventType, event.data.dependencies, pageHandlerObject.handler, pageHandlerObject.options, pageHandlerObject.useCapture);

                            // Update the page handler map 
                            window.geniePageHandlerMap[contentObjectID].handler = newHandler;
                            window.geniePageHandlerMap[contentObjectID].instrumented = true;
                        }
                    }
                } else if (event.data.messageType == 'eventDependenciesNotFound') {
                    // If the command could not be added, remove it from the map
                    var contentObjectID = event.data.id;
                    delete window.geniePageHandlerMap[contentObjectID];
                } else if (event.data.messageType == 'getCommandStates') {
                    // Set the polling mode to enabled 
                    var keys = Object.keys(window.geniePageHandlerMap);
                    if (keys.length) {
                        console.log("Polling the command states.");
                        var commandStates = {};
                        for (var i = 0; i < keys.length; i++) {
                            var pageHandlerObject = window.geniePageHandlerMap[keys[i]];
                            if (pageHandlerObject.instrumented) {
                                // Only call the handler if it is already instrumented
                                // TODO: figure out how to set up this event so that it mimics the original dependencies
                                var event = new Event(pageHandlerObject.eventType, {
                                    "bubbles": true,
                                    "cancelable": false
                                });

                                event.geniePollingState = true;

                                // Call the handler with this evnet as the argument
                                // Is this sufficient ? 
                                // TODO: What about closures on the initial handler? When converting to a string to instrument, these will likely be lost? 
                                var element = document.querySelector(pageHandlerObject.path);
                                if (element) {
                                    var commandState = pageHandlerObject.handler.apply(element, [event]); // The element should be the 'this' context when the handler gets applied
                                    commandStates[pageHandlerObject.id] = commandState; // Enabled or disabled state   
                                }
                            }
                        }

                        // Post a message back to the content script to update the command states
                        console.log("posting message updateCommandStates");
                        window.postMessage({
                            messageType: 'updateCommandStates',
                            commandStates: commandStates
                        }, "*");
                    }
                }
            }
        }

        /**
         * Returns a unique ID to represent the handler object
         * @private
         * @method getUniqueID
         */
        function getUniqueID() {
            window.geniePageHandlerIDs++;
            // IDs for event handler commands are identified by the prefix 'h' to distinguish them from page handlers
            return "h" + window.geniePageHandlerIDs;
        }

        function getPageHandlerObject(id, eventType, handler, element, options = null, useCapture = false) {
            var pageHandlerObj = {
                eventType: eventType,
                handler: handler,
                options: options,
                useCapture: useCapture,
                path: typeof (jQuery) == 'function' ? jQueryGetElementPath(element) : getElementPath(element),
                id: id
            };

            return pageHandlerObj;
        }

        function getContentObject(id, messageType, eventType, handler, element) {
            if (handler) { // TODO: Handler arguments for jQuery on override better  s
                var handlerObj = {
                    messageType: messageType,
                    eventType: eventType,
                    handler: handler.toString(),
                    path: typeof (jQuery) == 'function' ? jQueryGetElementPath(element) : getElementPath(element),
                    id: id
                };
            }

            return handlerObj;
        }

        function getHandlerID(type, handler, element) {
            var keys = Object.keys(window.geniePageHandlerMap);
            for (var i = 0; i < keys.length; i++) {
                var value = window.geniePageHandlerMap[keys[i]];
                var elt = document.querySelector(value.path);
                if (value && value.eventType == type && value.handler == handler && element == elt) {
                    return keys[i];
                }
            }
        };

        function getElementPath(elt) {
            var path = "";
            var node = elt;
            while (node) {
                var realNode = node,
                    name = realNode.localName;
                if (!name) break;
                name = name.toLowerCase();

                var parent = node.parentNode;

                if (parent) {
                    var siblings = parent.childNodes;
                    if (siblings.length > 1) {
                        var index = 0;
                        var sameTagSiblings = false;
                        for (var i = 0; i < siblings.length; i++) {
                            var currNode = siblings.item(i);
                            if (currNode == node) {
                                index = i;
                                break;
                            }

                            if (currNode.tagName == node.tagName) {
                                sameTagSiblings = true;
                            }
                        }

                        if (sameTagSiblings) {
                            name += ':nth-child(' + index + ')';
                        }
                    }

                    path = name + (path ? '>' + path : '');
                    node = parent;
                }
            }

            return path;
        };

        function jQueryGetElementPath(elt) {
            var path, node = jQuery(elt);
            while (node.length) {
                var realNode = node[0],
                    name = realNode.localName;
                if (!name) break;
                name = name.toLowerCase();

                var parent = node.parent();

                var sameTagSiblings = parent.children(name);
                if (sameTagSiblings.length > 1) {
                    var allSiblings = parent.children();
                    var index = allSiblings.index(realNode) + 1;
                    name += ':nth-child(' + index + ')';
                }

                path = name + (path ? '>' + path : '');
                node = parent;
            }

            return path;
        }

        var ignoreJQueryFunction = `function ignoreJQueryFunction(e) {

                // Discard the second event of a jQuery.event.trigger() and
                // when an event is called after a page has unloaded
                return typeof jQuery !== "undefined" && jQuery.event.triggered !== e.type ?
                    jQuery.event.dispatch.apply(elem, arguments) : undefined;
            }`;


        var newAddEventListener = function (type, listener, options = null, useCapture = false, ignore = false) {
            // Instrument the handler with a call to retreive the data dependencies
            this._addEventListener(type, listener, options, useCapture);
           console.log("addEventListener " + type + " " + this.tagName + " " + listener.toString());
            var handlerString = listener.toString();
            var handlerID = getHandlerID(type, listener, this); // If the handler already exists in the map, ignore it. 
          //  console.log("addEventListener " + type + " " + listener.toString() + " " + this.tagName);
            if (handlerString != ignoreJQueryFunction && !ignore && !handlerID) {
                var path = typeof (jQuery) == 'function' ? jQueryGetElementPath(this) : getElementPath(this);
                var id = getUniqueID(); // This unique ID will represent this handler, event, and element combination
                var contentObject = getContentObject(id, 'eventAdded', type, listener, this);
                window.postMessage(contentObject, "*");

                // Get a page handler object to cache so that the handler can be instrumented when polling takes palge
                var pageHandlerObject = getPageHandlerObject(id, type, listener, this);
                window.geniePageHandlerMap[id] = pageHandlerObject;
            }
        };

        var newRemoveEventListener = function (type, listener, options = null, useCapture = false, ignore) {
            this._removeEventListener(type, listener, options, useCapture);

            // Get the content object
            if (!ignore) {
                var handlerID = getHandlerID(type, listener, this);
                delete window.geniePageHandlerMap[handlerID];
                window.postMessage({
                    messageType: 'eventRemoved',
                    id: handlerID
                }, "*");
            }
        };

        var newJQueryOn = function (events, selector, handler) { // TODO: handle when selector, data options are used
            console.log('Calling jQuery on');
            jQuery.fn._on.apply(this, arguments);
            var handle = handler;

            if (selector != null && !handle) {
                handler = selector;
            }

            console.log("addEventListener " + type + " " + this.tagName + " " + listener.toString());


            var eventList = typeof (events) == "string" ? events.split(" ") : (typeof (events) == "object" ? [events.type] : []);
            for (var i = 0; i < eventList.length; i++) {
                var evt = eventList[i];
                var id = getUniqueID(); // This unique ID will represent this handler, event, and element combination
                var contentObject = getContentObject(id, 'eventAdded', evt, handler, this);
                window.postMessage(contentObject, "*");

                // Get a page handler object to cache so that the handler can be instrumented when polling takes palge
                var pageHandlerObject = getPageHandlerObject(id, evt, handler, this, null, null);
                window.geniePageHandlerMap[id] = pageHandlerObject;
            }
        }

        var newJQueryOff = function (events, selector, handler) {
            jQuery.fn._off.apply(this, arguments);
            var eventList = typeof (events) == "string" ? events.split(" ") : (typeof (events) == "object" ? [events.type] : []);
            for (var i = 0; i < eventList.length; i++) {
                var evt = eventList[i];
                var handlerID = getHandlerID(evt, handler, this);
                delete window.geniePageHandlerMap[handlerID];
                window.postMessage({
                    messageType: 'eventRemoved',
                    id: handlerID
                }, "*");
            }
        }

        var newD3 = function (type, listener, useCapture) {
            function sendEventAddedMessage(eventType, element) {
                var handlerString = listener.toString();
                var handlerID = getHandlerID(eventType, listener, element); // If the handler already exists in the map, ignore it. 
                if (!handlerID) {
                    var path = typeof (jQuery) == 'function' ? jQueryGetElementPath(element) : getElementPath(element);
                    var id = getUniqueID(); // This unique ID will represent this handler, event, and element combination
                    var contentObject = getContentObject(id, 'eventAdded', eventType, listener, element);
                    window.postMessage(contentObject, "*");

                    // Get a page handler object to cache so that the handler can be instrumented when polling takes place
                    var pageHandlerObject = getPageHandlerObject(id, eventType, listener, element);
                    window.geniePageHandlerMap[id] = pageHandlerObject;
                }
            }

            function sendEventRemovedMessage(eventType, element) {
                // Remove the handler from the element
                var handlerID = getHandlerID(eventType, listener, element);
                delete window.geniePageHandlerMap[handlerID];
                window.postMessage({
                    messageType: 'eventRemoved',
                    id: handlerID
                }, "*");
            }

            var types = type.split(" ");
            if (listener) {
                if (types.length) {
                    for (var i = 0; i < types.length; i++) {
                        for (var j = 0; j < this.length; j++) {
                            for (var k = 0; k < this[j].length; k++) {
                                sendEventAddedMessage(types[i], this[j][k]);
                            }
                        }
                    }
                }
            } else {
                if (types.length) {
                    for (var i = 0; i < types.length; i++) {
                        for (var j = 0; j < this.length; j++) {
                            for (var k = 0; k < this[j].length; k++) {
                                sendEventRemovedMessage(types[i], this[j][k]);
                            }
                        }
                    }
                }
            }

            // Call the original on function
            d3.selection.prototype._on.apply(this, arguments);
        }


        var script = document.createElement("script");
        script.appendChild(document.createTextNode(directive + "\n" + windowListener + "\n" + windowObjects + "\n" + updateEventHandlerOnElement + "; \n" + receiveMessage + "; \n" + getHandlerID + "; \n" + getPageHandlerObject + "; \n" + getContentObject + "; \n" + getUniqueID + "; \n" + getElementPath + "; \n" + jQueryGetElementPath + "; \n" + ignoreJQueryFunction + "; \n" + "Element.prototype._addEventListener = Element.prototype.addEventListener;\n" + "Element.prototype.addEventListener = " + newAddEventListener + "; \n" + "Element.prototype._removeEventListener = Element.prototype.removeEventListener; \n" + "Element.prototype.removeEventListener = " + newRemoveEventListener + "; \n" + "if(typeof(jQuery) == 'function') { \n jQuery.fn._off = jQuery.fn.off; \n" + "jQuery.fn.off = " + newJQueryOff + "; \n" + "jQuery.fn._on = jQuery.fn.on; \n" + "jQuery.fn.on = " + newJQueryOn + ';} \n' + " if(typeof(d3) == 'object') { d3.selection.prototype._on = d3.selection.prototype.on; \n" + "d3.selection.prototype.on =" + newD3 + '}; \n'));

        script.id = "genie_monitor_script";

        // TODO: should minify this before inserting into the page. 
        return script;
    };

    /**
     * Returns a side effect free expression representing the dependencies of the command
     * @private
     * @property undefined
     * @param {Object} ast
     */
    $action.computeSideEffectFreeExpressions = function (ast) {
        // First, search for any function calls that are outside of conditionals. 
        // Consider these to have side effects    
        var findFunctionCallsOutsideOfConditionals = {
            outside: [
                    "IfStatement",
                    "ConditionalExpression",
                    "WhileStatement",
                    "DoWhileStatement",
                    "ForStatement",
                    "ForInStatement",
                    "ForOfStatement"],
            lookFor: [
                "CallExpression"
            ],
            items: []
        }

        $action.ASTAnalyzer.searchAST(ast, findFunctionCallsOutsideOfConditionals);

        var findConditionals = {
            within: "Program",
            lookFor: [
                    "IfStatement",
                    "ConditionalExpression",
                    "WhileStatement",
                    "DoWhileStatement",
                    "ForStatement",
                    "ForInStatement",
                    "ForOfStatement"],
            items: [] // Will contain the collection of requested elements you are looking for
        }

        $action.ASTAnalyzer.searchAST(ast, findConditionals);

        var testExpressions = [];
        for (var i = 0; i < findConditionals.items.length; i++) {
            let expr = findConditionals.items[i].testExpression;
            if (expr) {
                testExpressions.push(expr);
            }
        }

        // Look for identifiers that are contained within SwitchStatements (uses the discriminant property instead of 'test')
        var findIdentifiersWithinSwitch = {
            lookFor: "Identifier",
            within: ["SwitchStatement"],
            property: "discriminant",
            items: []
        }

        $action.ASTAnalyzer.searchAST(ast, findIdentifiersWithinSwitch);

        for (var j = 0; j < findIdentifiersWithinSwitch.items.length; j++) {
            let expr = findIdentifiersWithinSwitch.items[j].testExpression;
            if (expr) {
                testExpressions.push(expr);
            }
        }
        return testExpressions;
    };

    $action.getInstrumentedHandler = function (handlerString) {
        var index = handlerString.indexOf("{") + 1; // Insert after the first bracket in the handler which should be just inside of the function definition. Add 1 to the index so it inserts after that position        
        var ast = esprima.parse(handlerString);
        var expressions = $action.computeSideEffectFreeExpressions(ast);
        var expressionsBody = "\n\tif(window.genieEventPollingMode) \n\t{\n";
        var expressionsResult = "";
        for (var i = 0; i < expressions.length; i++) {
            expressionsBody = expressionsBody + "\t\tlet v" + i + " = " + expressions[i] + ";\n";
            expressionsResult = expressionsResult + "v" + i;
            if (i < expressions.length - 1) {
                expressionsResult = expressionsResult + " && ";
            }
        }

        expressionsBody = expressionsBody + "\t\treturn " + expressionsResult + ";\n";
        expressionsBody = expressionsBody + "\t} \n\telse {\n";

        var newHandler = [handlerString.slice(0, index), expressionsBody, handlerString.slice(index)].join('');

        // Insert a closing brack for the else statement
        var lastIndex = newHandler.lastIndexOf("}");
        newHandler = [newHandler.slice(0, lastIndex), "}\n", newHandler.slice(lastIndex)].join('');
        return newHandler;
    };
})($action);