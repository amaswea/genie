"use strict";
var $action = $action || {};
(function ($action) {
    $action.handlerIDs = 0;

    $action.getElementPath = function (elt) {
        var path, node = $(elt);
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
    };

    $action.getScript = function () {
        var directive = `'use strict';`;
        var windowListener = 'window.addEventListener("message", receiveMessage, null, false, true);';
        var windowObjects = `window.geniePageHandlerMap = {};
                             window.geniePageHandlerIDs = 0;
                             window.genieEventPollingMode = false;`;
        window.geniePageHandlerMap = {};
        window.geniePageHandlerIDs = 0;
        window.genieEventPollingMode = false;

        function updateEventHandlerOnElement(element, type, handler, oldHandler, options, useCapture) {
            // First, construct a new function object from the given handler
            // Find the index of the first open and close parentheses and parse out the arguments
            var firstOpenParen = handler.indexOf("(");
            var firstClosedParen = handler.indexOf(")");
            var argumentString = handler.substring(firstOpenParen + 1, firstClosedParen).trim();
            var args = [];
            if (argumentString.length) {
                args = argumentString.split(",").map(function (elt) {
                    return elt.trim();
                });
            }

            var bodyStart = handler.indexOf("{");
            var bodyEnd = handler.lastIndexOf("}");
            var body = handler.substring(bodyStart + 1, bodyEnd);
            if (body) {
                debugger;
                var newHandlerFunction = new Function(args, body);
                if (oldHandler.name) {
                    // newHandlerFunction.name = oldHandler.name; 
                    // TODO: is there any way to set the name of the function when created via Function object constructor? Does it matter? 
                }

                // Remove the previous listener on the element
                element.removeEventListener(type, oldHandler, options, useCapture, true);

                // Add the new instrumented listener
                element.addEventListener(type, newHandlerFunction, options, useCapture, true); // Need last argument so that the addEventListener override knows to ignore this registration. 
                return newHandlerFunction;
            }
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
                if (event.data.messageType == 'eventInstrumented') {
                    // Get the page handler object associated with this event handler ID
                    var contentObjectID = event.data.id;
                    var pageHandlerObject = window.geniePageHandlerMap[contentObjectID];
                    if (pageHandlerObject) {
                        var element = $(pageHandlerObject.path);
                        if (element && element.length) {
                            var newHandler = updateEventHandlerOnElement(element[0], pageHandlerObject.eventType, event.data.handler, pageHandlerObject.handler, pageHandlerObject.options, pageHandlerObject.useCapture);

                            // Update the page handler map 
                            window.geniePageHandlerMap[contentObjectID].handler = newHandler;
                            window.geniePageHandlerMap[contentObjectID].instrumented = true;
                        }
                    }
                } else if (event.data.messageType == 'getCommandStates') {
                    // Set the polling mode to enabled 
                    console.log("Polling the command states."); 
                    window.genieEventPollingMode = true;
                    var keys = Object.keys(window.geniePageHandlerMap);
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

                            // Call the handler with this evnet as the argument
                            // Is this sufficient ? 
                            // TODO: What about closures on the initial handler? When converting to a string to instrument, these will likely be lost? 
                            debugger;
                            var commandState = pageHandlerObject.handler(event);
                            commandStates[pageHandlerObject.id] = commandState; // Enabled or disabled state
                        }
                    }

                    // Post a message back to the content script to update the command states
                    window.postMessage({
                        messageType: 'updateCommandStates',
                        commandStates: commandStates
                    }, "*");
                    window.genieEventPollingMode = false;
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
            return window.geniePageHandlerIDs;
        }

        function getPageHandlerObject(id, eventType, handler, options, useCapture, element) {
            var pageHandlerObj = {
                eventType: eventType,
                handler: handler,
                options: options,
                useCapture: useCapture,
                path: getElementPath(element),
                id: id
            };

            return pageHandlerObj;
        }

        function getContentObject(id, messageType, eventType, handler, element) {
            var handlerObj = {
                messageType: messageType,
                eventType: eventType,
                handler: handler.toString(),
                path: getElementPath(element),
                id: id
            };

            return handlerObj;
        }

        function getHandlerID(type, handler, element) {
            var keys = Object.keys(window.geniePageHandlerMap);
            for (var i = 0; i < keys.length; i++) {
                var value = window.geniePageHandlerMap[keys[i]];
                var elt = $(value.path);
                if (value && value.eventType == type && value.handler == handler && element == elt) {
                    return keys[i];
                }
            }
        };

        function getElementPath(elt) {
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
        };

        var ignoreJQueryFunction = `function ignoreJQueryFunction(e) {

                // Discard the second event of a jQuery.event.trigger() and
                // when an event is called after a page has unloaded
                return typeof jQuery !== "undefined" && jQuery.event.triggered !== e.type ?
                    jQuery.event.dispatch.apply(elem, arguments) : undefined;
            }`;

        Element.prototype._addEventListener = Element.prototype.addEventListener;
        Element.prototype.addEventListener = function (type, listener, options = null, useCapture = false, ignore = false) {
            // Instrument the handler with a call to retreive the data dependencies
            this._addEventListener(type, listener, options, useCapture);
            var handlerString = listener.toString();
            if (handlerString != ignoreJQueryFunction && !ignore) {
                var id = getUniqueID(); // This unique ID will represent this handler, event, and element combination
                var contentObject = getContentObject(id, 'eventAdded', type, listener, this);
                window.postMessage(contentObject, "*");

                // Get a page handler object to cache so that the handler can be instrumented when polling takes palge
                var pageHandlerObject = getPageHandlerObject(id, type, listener, options, useCapture, this);
                window.geniePageHandlerMap[id] = pageHandlerObject;
            }
        };

        Element.prototype._removeEventListener = Element.prototype.removeEventListener;
        Element.prototype.removeEventListener = function (type, listener, options = null, useCapture = false, ignore) {
            this._removeEventListener(type, listener, options, useCapture);

            // Get the content object
            if (!ignore) {
                var handlerID = getHandlerID(type, listener, this);
                window.postMessage({
                    messageType: 'eventRemoved',
                    id: handlerID
                }, "*");
            }
        };

        /*        jQuery.fn._on = jQuery.fn.on;
                jQuery.fn.on = function (events, selector, handler) { // TODO: handle when selector, data options are used
                    jQuery.fn._on.apply(this, arguments);
                    var handle = handler;
                    if (selector != null && !handle) {
                        handler = selector;
                    }
                    var instrumented = $action.getInstrumentedHandler(b);
                    var eventList = events.split(" ");
                    for (var i = 0; i < eventList.length; i++) {
                        var evt = eventList[i];
                        window.postMessage({
                            messageType: 'eventAdded',
                            eventType: evt,
                            handler: handler.toString(),
                            path: getElementPath(this)
                        }, "*");
                    }
                }

                jQuery.fn._off = jQuery.fn.off;
                jQuery.fn.off = function (events, selector, handler) {
                    jQuery.fn._off.apply(this, arguments);
                    var eventList = events.split(" ");
                    for (var i = 0; i < eventList.length; i++) {
                        var evt = eventList[i];
                        window.postMessage({
                            messageType: 'eventRemoved',
                            eventType: evt,
                            handler: handler ? handler.toString() : undefined,
                            path: getElementPath(this)
                        }, "*");
                    }
                };*/

        var script = document.createElement("script");
        script.appendChild(document.createTextNode(directive + "\n" + windowListener + "\n" + windowObjects + "\n" + updateEventHandlerOnElement + "; \n" + receiveMessage + "; \n" + getHandlerID + "; \n" + getPageHandlerObject + "; \n" + getContentObject + "; \n" + getUniqueID + "; \n" + getElementPath + "; \n" + ignoreJQueryFunction + "; \n" + "Element.prototype._addEventListener = Element.prototype.addEventListener;\n" + "Element.prototype.addEventListener = " + Element.prototype.addEventListener + "; \n" + "Element.prototype._removeEventListener = Element.prototype.removeEventListener; \n" + "Element.prototype.removeEventListener = " + Element.prototype.removeEventListener + "; \n")); //+ "jQuery.fn.off = " + jQuery.fn.off + "; \n" + "jQuery.fn.on = " + jQuery.fn.on + ';'));

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