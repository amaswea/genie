"use strict";

var $action = $action || {};
(function ($action) {

    $action.ActionableElementsActionLabel = {
        "A": "Click",
        "INPUT": "Fill out"
    }

    $action.ActionableElements = {
        "A": function (element) {
            var href = jQuery(element).attr("href");
            return href && href.length > 0;
        },
        "INPUT": function (element) {
            var type = jQuery(element).attr("type");
            return type && type != "hidden";
        }
    }

    $action.CommandLabels = {
        "INPUT": function (element) { // Get the label from the placeholder attribute
            var placeholder = jQuery(element).attr("placeholder");
            return placeholder;
        },
        "A": function (element) {
            var title = jQuery(element).attr("title");
            if (title && title.length) {
                return title;
            }

            var innerText = jQuery(element).contents().first().text().trim();
            return innerText;
        },
        "TEXTAREA": function (element) {
            var title = jQuery(element).attr("title");
            if (title && title.length) {
                return title;
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
        constructor(eventType, domElement, handler) {
            this._eventType = eventType;
            this._domElement = domElement; // The DOM element the command is associated with
            this._handler = handler;

            if (this._handler) {
                this._ast = esprima.parse(this._handler);
                this._domElement.parsedAST = this._ast;
            }

            this.postCommands = [];
        }

        get EventType() {
            return this._eventType;
        };

        get Element() {
            return this._domElement;
        }

        get CommandItem() {
            return this._commandItem;
        }

        set CommandItem(item) {
            this._commandItem = item;
        }

        get PostCommands() {
            return this._postCommands;
        };

        get AST() {
            return this._ast;
        }

        /**
         * Returns a string representing the source code of the associated event handler
         * @private
         * @property Handler
         */
        get Handler() {
            return this._handler;
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
            var element = this.Element;
            var tagName = element.tagName;
            var hasDisabled = $action.DisabledAttributeElements[tagName.toLowerCase()];
            if (hasDisabled) {
                let disabled = element.attributes.disabled;
                if (disabled && disabled.value == "disabled") {
                    return false;
                }
            }

            return true;
        };


        /**
         * Returns whether the command is currently visible on the screen
         * @private
         * @property undefined
         */
        visible() {
            var element = $(this.Element);
            var displayed = element.css('display') != "none";
            var visibility = element.css('visibility') != "hidden";
            var heightBigEnough = element.height() > 10;
            var widthBigEnough = element.width() > 10;
            var notClear = element.css('opacity') != "0" && element.css('opacity') != "0.0";
            var offLeftRight = (element.offset().left >= window.innerWidth) || ((element.offset().left + element.offsetWidth) <= 0);
            var hidden = element.attr('type') == 'hidden';
            var visible = element.is(':visible');

            if (visible && displayed && visibility && heightBigEnough && widthBigEnough && notClear && !offLeftRight && !hidden) {
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
         * content scripts to not have access to any events nor can trigger events in the associated page. 
         */
        execute() {
            var self = this;
            return function (evt) {
                evt.preventDefault();
                evt.stopPropagation();

                var s = document.createElement('script');
                s.src = chrome.extension.getURL("scripts/performAction.js");
                (document.head || document.documentElement).appendChild(s);

                // Perform the action
                var action = {
                    event: self.EventType,
                    selector: $action.getElementPath(self.Element)
                }

                window.postMessage(action, "*");

                // Perform any of the post dependency commands that are set for this command; 


                // Unload the script
                (document.head || document.documentElement).removeChild(s);
            };
        };
    };


    class CommandManager {
        constructor(ui, scripts) {
            this.commands = [];
            this.elements = [];
            this.commandCount = 0;
            this.ui = ui; // The instance of UI that is creating this instance
            this._scripts = scripts;
        }

        addCommand(element, command) {
            if (command.eventType == 'default' || $action.UserInvokeableEvents.indexOf(command.eventType) > -1 || $action.GlobalEventHandlers.indexOf(command.eventType) > -1) {
                var newCommand = new $action.Command(command.eventType, element, command.handler)

                if (newCommand.userInvokeable()) {
                    this.commandCount++;
                    this.ui.appendCommand(newCommand, this.commandCount);
                }

                var index = this.elements.indexOf(element);
                if (index == -1) {
                    this.elements.push(element);
                    index = this.elements.length - 1;
                }

                if (!this.commands[index])
                    this.commands[index] = [];

                this.commands[index].push(newCommand);
                
                this.analyzeCommandHandler(newCommand.AST); 
            }
        };


        removeCommand(element, command) {
            var index = this.elements.indexOf(element);
            if (index > -1) {
                var cmds = this.commands[index];
                var remove = -1;
                for (var i = 0; i < cmds.length; i++) {
                    var cmd = cmds[i];
                    if (cmd.EventType == command.eventType) {
                        remove = i;
                        this.commandCount--;
                        this.ui.removeCommand(cmd, this.commandCount);
                        break;
                    }
                }

                if (remove != -1) {
                    this.commands[index].splice(remove, 1);
                }
            }
        };


        analyzeCommandHandler(handlerAST) {
            // Look for identifiers that are contained within IfStatements
            var findIdentifiersWithinConditionals = {
                lookFor: "Identifier",
                within: [
                    "IfStatement",
                    "ConditionalExpression",
                    "WhileStatement",
                    "DoWhileStatement",
                    "ForStatement",
                    "ForInStatement",
                    "ForOfStatement"],
                property: "test", // The property within the 'within' statements to search 
                items: [] // Will contain the collection of requested elements you are lookign for
            }

            $action.ASTAnalyzer.searchAST(handlerAST, findIdentifiersWithinConditionals);

            // Look for identifiers that are contained within SwitchStatements (uses the discriminant property instead of 'test')
            var findIdentifiersWithinSwitch = {
                lookFor: "Identifier",
                within: ["SwitchStatement"],
                property: "discriminant",
                items: []
            }

            $action.ASTAnalyzer.searchAST(handlerAST, findIdentifiersWithinSwitch);

            /*// Find call expressions within if statements and search for those we can resolve to jQuery expressions
            var findJQueryCallExpressionsWithinIfs = {
                lookFor: "CallExpression", 
                within: ["IfStatement", "ConditionalExpression"], 
                property: "test", 
            }*/

            // Global variables will be those Identifiers that do not have the LastDeclared property set

            // Finding value of Expression statement referenced by the assignment or delcarator
            // - Is this statement referring to any element on the page? (selector or document.getElementById)
            // - Is this statement referring to any global variable (outside the function)


            // Look for any function calls (side-effects)
            var findFunctionCallsAnywhere = {
                lookFor: "CallExpression",
                within: "Program",
                items: []
            }

            $action.ASTAnalyzer.searchAST(handlerAST, findFunctionCallsAnywhere);

            // Find all function expressions within each script AST
            var scriptASTs = this._scripts.ASTs;
            var findFunctionExpressionsInProgram = {
                lookFor: ["FunctionExpression", "FunctionDeclaration", "ArrowExpression"],
                within: ["Program"],
                items: []
            }
            
            // TODO: reconsider how this works because the commands are added one at a time so this requires calling again and again on all scripts. 
            for (var i = 0; i < scriptASTs; i++) {
              $action.ASTAnalyzer.searchAST(scriptASTs[i], findFunctionExpressionsInProgram);
            }
        }
    };

    $action.Command = Command;
    $action.CommandManager = CommandManager;
})($action);