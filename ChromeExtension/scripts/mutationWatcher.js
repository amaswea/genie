"use strict";
var $action = $action || {};
(function ($action) {
    class MutationWatcher {
        constructor() {
            this._pageHandlerIDs = 0;
            this._elementIDs = 0;
            this._pageCommands = {};
        }

        /**
         * Description for undefined
         * @private
         * @property undefined
         */
        init() {
            this.observeMutations();

            // Extract all of the non-event commands from the page
            var allElements = document.querySelectorAll("*:not(.genie-ui-component)");
            for (var i = 0; i < allElements.length; i++) {
                var element = allElements[i];
                this.addCommandsFromElement(element);
            }
        };

        getHandlerID() {
            this._pageHandlerIDs++;
            // Page commands are identified by the prefix 'p' to distinguish them from event handler commands
            return "p" + this._pageHandlerIDs;
        }

        detectOrAssignElementID(element) {
            var id = "";
            if (element instanceof Window) {
                id = "window";
            } else if (element instanceof Document) {
                id = "document";
            } else {
                id = element.getAttribute("data-genie-element-id");
                if (id && id.length) {
                    return id;
                } else {
                    this._elementIDs++;
                    id = "p" + this._elementIDs;
                    element.setAttribute("data-genie-element-id", id);
                }
            }

            return id;
        }

        getPageCommandID(type, element) {
            var keys = Object.keys(this._pageCommands);
            for (var i = 0; i < keys.length; i++) {
                var value = this._pageCommands[keys[i]];
                var elt = $action.getElementFromID(value.elementID);
                if (value && value.eventType == type && element == elt) {
                    return keys[i];
                }
            }
        };

        addPageCommands() {
            var allElements = document.querySelectorAll("*");
            for (var i = 0; i < allElements.length; i++) {
                var element = allElements[i];
                self.addCommandsFromElement(element);
            }
        }

        /**
         * Description for addCommandsFromElement
         * @private
         * @method addCommandFromElement
         * @param {Object} element
         */
        addCommandsFromElement(element) {
            var tagAdded = element.tagName;
            var hasAction = $action.ActionableElements[tagAdded] != undefined;
            if (hasAction && element.parentNode) {
                var isActionable = $action.ActionableElements[tagAdded](element);
                if (isActionable) {
                    var commandData = {
                        id: this.getHandlerID(),
                        eventType: 'default',
                        elementID: this.detectOrAssignElementID(element)
                    }

                    this._pageCommands[commandData.id] = commandData;
                    $action.commandManager.addCommand(commandData);
                }
            }

            var $element = $(element);
            for (var i = 0; i < $action.GlobalEventHandlers.length; i++) {
                var eventHandler = $action.GlobalEventHandlers[i];
                var attributeValue = $element.attr(eventHandler);
                if (attributeValue && attributeValue.length > 0) {
                    var commandData = {
                        id: this.getHandlerID(),
                        eventType: eventHandler,
                        handler: attributeValue,
                        elementID: this.detectOrAssignElementID(element)
                    }


                    this._pageCommands[commandData.id] = commandData;
                    var added = $action.commandManager.addCommand(commandData);
                    var dataDependencies = {};
                    if (added) {
                        // Returns a new object with the computed expression string representing the data dependencies. 
                        dataDependencies = $action.getDataDependencies(commandData);
                        if (dataDependencies) {
                            commandData.dependencies = dataDependencies;
                            window.postMessage({
                                messageType: 'pageCommandFound',
                                commandData: commandData
                            }, "*");
                        }
                    } 
                }
            }
        };

        /**
         * Description for removeCommandsFromElement
         * @private
         * @method removeCommandFromElement
         * @param {Object} element
         */
        removeCommandsFromElement(element) {
            var tagRemoved = element.tagName;
            var hasAction = $action.ActionableElements[tagRemoved] != undefined;
            if (hasAction) {
                var isActionable = $action.ActionableElements[tagRemoved](element);
                if (isActionable) {
                    var commandData = {
                        eventType: 'default'
                    }

                    $action.commandManager.removeCommand(element, commandData);
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

                    $action.commandManager.removeCommand(element, commandData);
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
                    if (mutation.type === 'childList') {
                        var addedNodes = mutation.addedNodes;
                        if (addedNodes && addedNodes.length) {
                            for (var i = 0; i < addedNodes.length; i++) {
                                var added = addedNodes[i];
                                if (added.tagName) {
                                    self.addCommandsFromElement(added);
                                }
                            }
                        }

                        var removedNodes = mutation.removedNodes;
                        if (removedNodes && removedNodes.length) {
                            for (var i = 0; i < removedNodes.length; i++) {
                                var removed = removedNodes[i];
                                if (removed.tagName) {
                                    self.removeCommandsFromElement(removed);
                                }
                            }
                        }
                    } else if (mutation.type == "attributes") {
                        // If any updates were made to the element attributes, remove the command associated with the old 
                        // value if there was one. Add the new command associated with the new value, if it is set to any // value
                        var attribute = mutation.attributeName;
                        if (attribute && attribute.length && $action.GlobalEventHandlers.indexOf(attribute) > -1) {
                            var newValue = mutation.target.attributes[attribute].value;
                            var oldValue = mutation.oldValue;
                            if (oldValue) {
                                var oldCommandData = {
                                    eventType: attribute,
                                    handler: oldValue
                                }

                                // remove old command
                                $action.commandManager.removeCommand(mutation.target, oldCommandData);
                            }

                            if (newValue) {
                                var newCommandData = {
                                    eventType: attribute,
                                    handler: newValue
                                };

                                $action.commandManager.addCommand(mutation.target, newCommandData);
                            }
                        }
                    }
                });
            });

            // configuration of the observer:
            var config = {
                childList: true,
                subtree: true,
                attributes: true,
                attributeOldValue: true,
                // characterData: true 
            };

            // pass in the target node, as well as the observer options
            observer.observe(target, config);
        };
    };

    $action.MutationWatcher = MutationWatcher;
})($action);