"use strict";

var $action = $action || {};
(function ($action) {

    $action.ActionableElementsActionLabel = {
        "A": "Open",
        "BUTTON": "Click",
        "INPUT": "Fill out"
    }


    $action.CommandGroups = {
        "A": "link",
        "LINK": "link",
        "INPUT": "field",
        "BUTTON": "action",
        "SELECT": "action",
        "TEXTAREA": "field"
    }

    $action.ActionableElements = {
        "A": function (element) {
            var href = jQuery(element).attr("href");
            return href && href.length > 0;
        },
        "BUTTON": function (element) {
            return $(element).attr("type") == "submit";
        },
        "INPUT": function (element) {
            var type = jQuery(element).attr("type");
            if (type && type == "button") {
                return false;
            } else {
                return type && type != "hidden";
            }
        },
        "TEXTAREA": function (element) {
            return true;
        },
        "SELECT": function (element) {
            // Has to have at least on option tag
            if (jQuery(element).find('option').length > 0) {
                return true;
            }
        }
    }

    $action.GlobalEventHandlerMappings = { // TODO: Add the rest
        "onclick": "click",
        "onmouseover": "mouseover"
    };

    /* $action.CommandInputs = {
         "cut": ["ctrl", "x", "" "", "ctrl", "x"]
     };*/

    class Command {
        constructor(id, elementID, eventType, handler) {
            this._id = id;
            this._elementID = elementID;
            this._eventType = eventType;
            this._domElement = $action.getElementFromID(elementID);

            this._handler = handler;
            this._dependencies = [ /* { keyCode: "", dependencyString: "" } */ ];
            this._dataDependent = false;
            this._computedStyles = {};

            // Collection of possible command arguments (inputs)
            this._arguments = [];

            // Label metadata collection structure
            this._labelMetadata = {
                elementLabels: {
                    phrases: [],
                    imperativePhrases: [],
                    nouns: [],
                    verbs: [],
                    other: []
                },
                handlerName: {
                    phrases: [],
                    imperativePhrases: [],
                    nouns: [],
                    verbs: [],
                    other: []
                },
                handlerComments: {
                    phrases: [],
                    imperativePhrases: [],
                    nouns: [],
                    verbs: [],
                    other: []
                },
                expressionCalls: {
                    phrases: [],
                    imperativePhrases: [],
                    nouns: [],
                    verbs: [],
                    other: []
                },
                expressionComments: {
                    phrases: [],
                    imperativePhrases: [],
                    nouns: [],
                    verbs: [], 
                    other: []
                },
                assignments: {
                    phrases: [],
                    imperativePhrases: [],
                    nouns: [],
                    verbs: [], 
                    other: []
                },
                conditionals: {
                    assignments: [], 
                    expressionComments: [], 
                    expressionCalls: []
/*                    { // For each conditional expression
                        keyCodeValues: "",
                        pathCondition: "",
                        phrases: [],
                        imperativePhrases: [],
                        nouns: [],
                        verbs: [],
                        other: []
                    }*/
                }
            }

            this.postCommands = [];
        }

        // Getters & Setters
        get ID() {
            return this._id;
        }

        get ElementID() {
            return this._elementID;
        }

        get Element() {
            return this._domElement;
        }

        get EventType() {
            return this._eventType;
        };

        get CommandItem() {
            return this._commandItem;
        }

        set CommandItem(item) {
            this._commandItem = item;
        }

        get PostCommands() {
            return this._postCommands;
        };

        get DataDependent() {
            return this._dataDependent;
        }

        set DataDependent(state) {
            this._dataDependent = state;
        }

        set ComputedStyles(styles) {
            this._computedStyles = styles;
        }

        get ComputedStyles() {
            return this._computedStyles;
        }

        get LabelMetadata() {
                return this._labelMetadata;
            }
            /**
             * Returns a string representing the source code of the associated event handler
             * @private
             * @property Handler
             */
        get Handler() {
            return this._handler;
        }

        get Arguments() {
            return this._arguments;
        }

        get ElementSelector() {
            if (this._domElement instanceof Window) {
                return "body";
            } else if (this._domElement instanceof Document) {
                return "body";
            } else {
                return "[data-genie-element-id='" + this._domElement.getAttribute("data-genie-element-id") + "']";
            }
        }

        /**
         * Adds a command to the list of post commands that must be executed directly after this command
         * @private
         * @property undefined
         * @param {Object} command
         */
        addPostCommand(command) {
            this._postCommands.push(command);
        }

        /**
         * Return whether the command can be invoked by a user 
         * @private
         * @property undefined
         */
        userInvokeable() {
            // Ways that a command can not be available
            // 1. Command is not visible
            //    - Display set to None
            //    - Visibility set to hidden
            //    - Height or width too small
            //    - Opaque (opacity)
            //    - Offscreen
            //    - Hidden attribute
            //    - Z-index is hiding it behind something else
            if (!this.visible()) {
                return false;
            }

            // 2. Command is disabled 
            if (!this.enabled()) {
                return false;
            }

            // 3. Command results in no effect because of input guards or conditions in the code
            if (this.DataDependent) {
                return false;
            }

            // 4. Command is not yet in the DOM (Hovering over a menu adds menu items with commands to DOM)
            // If it isn't in the DOM yet, we shouldn't find any event handlers for it in which case it won't make it here??

            // 5. Command is not clickable (there is a transparent div or element above it preventing it from being clicked)

            // If the command cannot be invoked, it should still remain in the list of commands, but not be shown in the UI


            // 6. Command is not available yet because other commands need to be executed first based on the nature of the device
            /*if (this.commandDependencies()) {
                return false;
            }
            */
            return true;
        }

        /**
         * The set of data dependencies that the command has (control dependencies)
         * Example: enabled state of another element, etc. 
         */
        dataDependencies() {

        };

        /**
         * Returns whether the command is currently enabled (can be performed)
         */
        enabled() {
            // Look for disabled attribute on the element
            if (this._domElement instanceof Window || this._domElement instanceof Document) {
                return true;
            }

            if (this._domElement) {
                var tagName = this._domElement.tagName;
                var hasDisabled = $action.DisabledAttributeElements[tagName.toLowerCase()];
                if (hasDisabled) {
                    let disabled = this._domElement.attributes.disabled;
                    if (disabled && disabled.value == "disabled") {
                        return false;
                    }
                }

                return true;
            }
        };


        /**
         * Returns whether the command is currently visible on the screen
         * @private
         * @property undefined
         */
        visible() {

            if (this._domElement instanceof Window || this._domElement instanceof Document) {
                return true;
            }

            var element = $(this._domElement);
            var displayed = element.css('display') != "none";
            var visibility = element.css('visibility') != "hidden";
            var heightBigEnough = element.outerHeight() > 10;
            var widthBigEnough = element.outerWidth() > 10;
            var notClear = element.css('opacity') != "0" && element.css('opacity') != "0.0";
            var offLeftRight = (element.offset().left >= window.innerWidth) || ((element.offset().left + element.offsetWidth) <= 0);
            var hidden = element.attr('type') == 'hidden';
            var visible = element.is(':visible');

            if (heightBigEnough && widthBigEnough && visible && displayed && visibility && notClear && !offLeftRight && !hidden) {
                return true;
            }

            return false;
        }

        /**
         * Command or set of commands that the command is dependent on being executed before it can be executed
         */
        commandDependencies() {
            // Not show the command 
            var preDep = this.preDeviceDependencies();
            if (preDep && preDep.length) {
                return true;
            }

            var dataDep = this.dataDependencies();
            if (dataDep && dataDep.length) {
                return true;
            }
        };

        /**
         * The set of commands that must be executed based on the nature of the device
         * @private
         * @property undefined
         */
        preDeviceDependencies() {
            if (!this._cachedPreDeviceDependences) {
                // If this command were executed, which commands would need to be executed first
                var mouseOrder = $action.MouseOrders[this.EventType];
                if (mouseOrder) {
                    var index = mouseOrder.indexOf(this.EventType);
                    if (index > -1) {
                        this._cachedPreDeviceDependencies = _.slice(mouseOrder, 0, index);
                    }
                }
            }

            return this._cachedPreDeviceDependencies;
        };

        /**
         * The set of events that need to be executed directly after this command
         * @private
         * @property undefined
         */
        postDeviceDependencies() {
            if (!this._cachedPostDeviceDependencies) {
                // If this command were executed, which commands would need to be executed first
                var mouseOrder = $action.MouseOrders[this.EventType];
                if (mouseOrder) {
                    var index = mouseOrder.indexOf(this.EventType);
                    if (index > -1) {
                        this._cachedPostDeviceDependencies = _.slice(mouseOrder, index + 1, mouseOrder.length);
                    }
                }
            }

            return this._cachedPostDeviceDependencies;
        };

        /**
         * Attach this callback to the keystrokes or action that you want to execute the command
         * Injects a script into the page in question to perform the action.. This is necessary becauuse
         * content scripts do not have access to any events nor can trigger events in the associated page. 
         */
        executeCallback() {
            var self = this;
            return function (evt) {
                evt.preventDefault();
                evt.stopPropagation();

                self.execute();
            };
        };

        execute() {
            var s = document.createElement('script');
            s.src = chrome.extension.getURL("scripts/performAction.js");
            (document.head || document.documentElement).appendChild(s);

            // Perform the action
            var action = {
                messageType: 'performAction',
                event: this.EventType,
                elementID: this.Element.getAttribute("data-genie-element-id")
            }

            window.postMessage(action, "*");

            // Perform any of the post dependency commands that are set for this command; 
            // TODO

            // Unload the script
            (document.head || document.documentElement).removeChild(s);
        }
    };

    $action.Command = Command;
})($action);