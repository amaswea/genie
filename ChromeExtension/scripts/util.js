"use strict";
var $action = $action || {};
(function ($action) {
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
        window.pageHandlers = [];

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
        Element.prototype.addEventListener = function (type, listener, options = null, useCapture = false) {
            // Instrument the handler with a call to retreive the data dependencies
            this._addEventListener(type, listener, options, useCapture);
            debugger;
            var handlerString = listener.toString();
            if (handlerString != ignoreJQueryFunction) {
                window.postMessage({
                    messageType: 'eventAdded',
                    eventType: type,
                    handler: handlerString,
                    options: options,
                    useCapture: useCapture,
                    path: getElementPath(this)
                }, "*");
            }
        };

        Element.prototype._removeEventListener = Element.prototype.removeEventListener;
        Element.prototype.removeEventListener = function (type, listener, options = null, useCapture = false) {
            this._removeEventListener(type, listener, options, useCapture);
            window.postMessage({
                messageType: 'eventRemoved',
                eventType: type,
                handler: listener.toString(),
                options: options,
                useCapture: useCapture,
                path: getElementPath(this)
            }, "*");
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
        script.appendChild(document.createTextNode("'use strict'; \n" + getElementPath + "; \n" + ignoreJQueryFunction + "; \n" + "Element.prototype._addEventListener = Element.prototype.addEventListener;\n" + "Element.prototype.addEventListener = " + Element.prototype.addEventListener + "; \n" + "Element.prototype._removeEventListener = Element.prototype.removeEventListener; \n" + "Element.prototype.removeEventListener = " + Element.prototype.removeEventListener + "; \n")); //+ "jQuery.fn.off = " + jQuery.fn.off + "; \n" + "jQuery.fn.on = " + jQuery.fn.on + ';'));

        script.id = "genie_monitor_script";

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

        var sideEffectFreeExpressions = [];
        for (var i = 0; i < findConditionals.items.length; i++) {
            let expr = findConditionals.items[i].sideEffectFreeExpression;
            if (expr) {
                sideEffectFreeExpressions.push(expr);
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
            let expr = findIdentifiersWithinSwitch.items[j].sideEffectFreeExpression;
            if (expr) {
                sideEffectFreeExpressions.push(expr);
            }
        }
        return sideEffectFreeExpressions;
    };

    $action.getInstrumentedHandler = function (handlerString) {
        var index = handlerString.indexOf("{") + 1; // Insert after the first bracket in the handler which should be just inside of the function definition. Add 1 to the index so it inserts after that position        
        var ast = esprima.parse(handlerString);
        var expressions = $action.computeSideEffectFreeExpressions(ast);
        var expressionsBody = "\nif(window.genieEventPollingMode) \n{\n";
        var expressionsResult = "";
        for (var i = 0; i < expressions.length; i++) {
            expressionsBody = expressionsBody + "var " + i + " = " + expressions[i] + ";";
            expressionsResult = expressionsResult + i;
            if (i < expressions.length - 1) {
                expressionsResult = epxressionsResult + " && ";
            }
        }

        expressionsBody = expressionsBody + "window.genieUpdateCommand(" + expressionsResult + ");\n";
        expressionsBody = expressionsBody + "} else {\n";

        var newHandler = [handlerString.slice(0, index), expressionsBody, handlerString.slice(index)].join('');

        // Insert a closing brack for the else statement
        var lastIndex = newHandler.lastIndexOf("}");
        newHandler = [newHandler.slice(0, lastIndex), "\n}", newHandler.slice(lastIndex)].join('');
        return newHandler;
    };
})($action);