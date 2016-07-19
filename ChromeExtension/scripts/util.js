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

    $action.instrumentEventHandler = function (handler) {
        // Analyze the handler AST to retrieve the data dependency string
        var ast = esprima.parse(this._handler);

        // Search the AST for any statements are are contained in any conditional statement
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

        $action.ASTAnalyzer.searchAST(handlerAST, findConditionals);

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

        $action.ASTAnalyzer.searchAST(handlerAST, findIdentifiersWithinSwitch);
        command.addDependencies(findIdentifiersWithinSwitch.items);

        for (var j = 0; j < findIdentifiersWithinSwitch.items.length; j++) {
            let expr = findIdentifiersWithinSwitch.items[j].sideEffectFreeExpression;
            if (expr) {
                sideEffectFreeExpressions.push(expr);
            }
        }

        var handlerString = handler.toString();
    };

    $action.getScript = function () {
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
        Element.prototype.addEventListener = function (a, b, c) {
            // Instrument the handler with a call to retreive the data dependencies
            var instrumented = $action.getInstrumentedHandler(b);
            this._addEventListener(a, instrumented, c);
            var handlerString = b.toString();
            if (handlerString != ignoreJQueryFunction) {
                window.postMessage({
                    messageType: 'eventAdded',
                    eventType: a,
                    handler: instrumented.toString(),
                    path: getElementPath(this)
                }, "*");
            }
        };

        Element.prototype._removeEventListener = Element.prototype.removeEventListener;
        Element.prototype.removeEventListener = function (a, b, c) {
            this._removeEventListener(a, b, c);
            window.postMessage({
                messageType: 'eventRemoved',
                eventType: a,
                handler: b.toString(),
                path: getElementPath(this)
            }, "*");
        };

        jQuery.fn._on = jQuery.fn.on;
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
        };

        var script = document.createElement("script");
        script.appendChild(document.createTextNode(getElementPath + "; \n" + ignoreJQueryFunction + "; \n" + "Element.prototype.addEventListener = " + Element.prototype.addEventListener + "; \n" + "Element.prototype.removeEventListener = " + Element.prototype.removeEventListener + "; \n" + "jQuery.fn.off = " + jQuery.fn.off + "; \n" + "jQuery.fn.on = " + jQuery.fn.on + ';'));

        script.id = "genie_monitor_script";

        return script;
    };
})($action);