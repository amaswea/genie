/**
* Observe and watch for DOM mutation events
*/
"use strict";
var $genie = $genie || {};
(function ($genie) {
    class MutationWatcher {
        constructor() {
            this._pageHandlerIDs = 0;
            this._elementIDs = 0;
            this._pageCommands = {};
        }

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

        /**
         * Assign or retrieve a unique ID for the element
         * @param The DOM element
         */
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
                var elt = $genie.getElementFromID(value.elementID);
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
         * When element is added to the DOM, add a command for it to the command manager if one should be created
         * @param the DOM element
         */
        addCommandsFromElement(element) {
            var tagAdded = element.tagName;
            var hasAction = $genie.ActionableElements[tagAdded] != undefined;
            if (hasAction && element.parentNode) {
                var isActionable = $genie.ActionableElements[tagAdded](element);
                if (isActionable) {
                    var commandData = {
                        id: this.getHandlerID(),
                        eventType: 'default',
                        elementID: this.detectOrAssignElementID(element)
                    }

                    this._pageCommands[commandData.id] = commandData;
                    $genie.commandManager.addCommand(commandData);
                }
            }

            var $element = $(element);
            for (var i = 0; i < $genie.GlobalEventHandlers.length; i++) {
                var eventHandler = $genie.GlobalEventHandlers[i];
                var attributeValue = $element.attr(eventHandler);
                if (attributeValue && attributeValue.length > 0) {
                    var commandData = {
                        id: this.getHandlerID(),
                        eventType: $genie.GlobalEventHandlerMappings[eventHandler],
                        handler: attributeValue,
                        elementID: this.detectOrAssignElementID(element)
                    }


                    this._pageCommands[commandData.id] = commandData;
                    var added = $genie.commandManager.addCommand(commandData);
                    var dataDependencies = {};
                    if (added) {
                        // Returns a new object with the computed expression string representing the data dependencies. 
                        dataDependencies = $genie.getDataDependencies(commandData);
                        if (dataDependencies) {
                            commandData.dependencies = dataDependencies;
                            window.postMessage({
                                messageType: 'pageCommandFound',
                                commandData: commandData
                            }, "*");
                        } else {
                            window.postMessage({
                                messageType: 'pageDependenciesNotFound',
                                commandData: commandData
                            }, "*");
                        }
                    }
                }

                // Check for object global event handler
            }
        };

        /**
         * When element is removed from DOM, remove its commands from the command manager
         * @param DOM element
         */
        removeCommandsFromElement(element) {
            var tagRemoved = element.tagName;
            var hasAction = $genie.ActionableElements[tagRemoved] != undefined;
            if (hasAction) {
                var isActionable = $genie.ActionableElements[tagRemoved](element);
                if (isActionable) {
                    var commandData = {
                        eventType: 'default'
                    }

                    $genie.commandManager.removeCommand(element, commandData);
                }
            }

            var $element = $(element);
            for (var i = 0; i < $genie.GlobalEventHandlers.length; i++) {
                var eventHandler = $genie.GlobalEventHandlers[i];
                var attributeValue = $element.attr(eventHandler);
                if (attributeValue && attributeValue.length > 0) {
                    var commandData = {
                        eventType: $genie.GlobalEventHandlerMappings[eventHandler],
                        handler: attributeValue
                    }

                    $genie.commandManager.removeCommand(element, commandData);
                }
            }
        };

        /**
         * Observe DOM mutation events using MutationObserver
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
                        if (attribute && attribute.length && $genie.GlobalEventHandlers.indexOf(attribute) > -1) {
                            var newValue = mutation.target.attributes[attribute].value;
                            var oldValue = mutation.oldValue;
                            if (oldValue) {
                                var oldCommandData = {
                                    eventType: $genie.GlobalEventHandlerMappings[attribute],
                                    handler: oldValue
                                }

                                // remove old command
                                $genie.commandManager.removeCommand(mutation.target, oldCommandData);
                            }

                            if (newValue) {
                                var newCommandData = {
                                    eventType: $genie.GlobalEventHandlerMappings[attribute],
                                    handler: newValue
                                };

                                $genie.commandManager.addCommand(mutation.target, newCommandData);
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

    $genie.MutationWatcher = MutationWatcher;
})($genie);