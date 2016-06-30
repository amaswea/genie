"use strict";
var $action = $action || {};
(function ($action) {
    class MutationWatcher {
        constructor() {

        }

        /**
         * Description for undefined
         * @private
         * @property undefined
         */
        init() {
            this.observeMutations();

            // Extract all of the non-event commands from the page
            var allElements = document.querySelectorAll("*");
            for (var i = 0; i < allElements.length; i++) {
                var element = allElements[i];
                this.addCommandFromElement(element);
            }
        };

        /**
         * Description for addCommandFromElement
         * @private
         * @method addCommandFromElement
         * @param {Object} element
         */
        addCommandFromElement(element) {
            var tagAdded = element.tagName;
            var hasAction = $action.ActionableElements[tagAdded] != undefined;
            if (hasAction) {
                var isActionable = $action.ActionableElements[tagAdded](element);
                if (isActionable) {
                    var commandData = {
                        eventType: 'default'
                    }

                    $action.interface.addCommand(element, commandData);
                }
            }

            var $element = $(element);
            for (var i = 0; i < $action.GlobalEventHandlers.length; i++) {
                var eventHandler = $action.GlobalEventHandlers[i];
                var attributeValue = $element.attr(eventHandler);
                if (attributeValue && attributeValue.length > 0) {
                    var commandData = {
                        eventType: eventHandler, 
                        handler: attributeValue
                    }

                    $action.interface.addCommand(element, commandData);
                }
            }
        };

        /**
         * Description for removeCommandFromElement
         * @private
         * @method removeCommandFromElement
         * @param {Object} element
         */
        removeCommandFromElement(element) {
            var tagRemoved = element.tagName;
            var hasAction = $action.ActionableElements[tagRemoved] != undefined;
            if (hasAction) {
                var isActionable = $action.ActionableElements[tagRemoved](element);
                if (isActionable) {
                    var commandData = {
                        eventType: 'default'
                    }

                    $action.interface.removeCommand(element, commandData);
                }
            }

            var $element = $(element);
            for (var i = 0; i < $action.GlobalEventHandlers.length; i++) {
                var eventHandler = $action.GlobalEventHandlers[i];
                var attributeValue = $element.attr(eventHandler);
                if (attributeValue && attributeValue.length > 0) {
                    var commandData = {
                        eventType: eventHandler,
                        handler: attributeValue
                    }

                    $action.interface.removeCommand(element, commandData);
                }
            }
        };

        /**
         * Description for observeMutations
         * @private
         * @method observeMutations
         */
        observeMutations() {
            // select the target node
            var target = document.body;
            var self = this;

            // create an observer instance
            var observer = new MutationObserver(function (mutations) {
                mutations.forEach(function (mutation) {
                    var addedNodes = mutation.addedNodes;
                    if (addedNodes && addedNodes.length) {
                        for (var i = 0; i < addedNodes.length; i++) {
                            var added = addedNodes[i];
                            if (added.tagName) {
                                self.addCommandFromElement(added);
                            }
                        }
                    }

                    var removedNodes = mutation.removedNodes;
                    if (removedNodes && removedNodes.length) {
                        for (var i = 0; i < removedNodes.length; i++) {
                            var removed = removedNodes[i];
                            if (removed.tagName) {
                                self.removeCommandFromElement(removed);
                            }
                        }
                    }
                });
            });

            // configuration of the observer:
            var config = {
                attributes: true, 
                characterData: true
            };

            // pass in the target node, as well as the observer options
            observer.observe(target, config);
        };
    };

    $action.MutationWatcher = MutationWatcher;
})($action);