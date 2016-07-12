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
                //  this.analyzeHandler(this._ast);
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

        // Go through the AST & traverse it to find the conditions
        analyzeHandler(astNode) {
            var body = astNode.body;
            if (body instanceof Array) {
                for (var i = 0; i < body.length; i++) {
                    var statement = body[i];
                    if (statement.type == "IfStatement") {
                        var test = statement.test;
                        if (test.type == "Identifier") {
                            console.log("Dependency: " + test.name)
                        } else if (test.type == "BinaryExpression") {
                            searchBinaryExpression(test);

                        } else if (test.type == "ConditionalExpression") {

                        } else {
                            console.log("Unexpected expression inside of an IF statement");
                        }
                    }

                    if (statement.body) {
                        this.analyzeHandler(astNode);
                    }
                }
            } else {

            }
        }

        searchStatement(statement) {
            if (statement.type == "BlockStatement") {
                this.searchBlockStatement(statement);
            } else if (statement.type == "ExpressionStatement") {
                this.searchExpression(statement.expression);
            } else if (statement.type == "IfStatement") {
                this.searchIfStatement(statement);
            } else if (statement.type == "LabeledStatement") {
                // TBD 
            } else if (statement.type == "BreakStatement") {
                // TBD
            } else if (statement.type == "ContinueStatement") {
                // TBD
            } else if (statement.type == "WithStatement") {
                // Deprecated
            } else if (statement.type == "SwitchStatement") {
                // TBD
            } else if (statement.type == "ReturnStatement" || expression.type == "ThrowStatement") {
                this.searchExpression(expression.argument);
            } else if (statement.type == "TryStatement") {
                this.searchTryStatement(statement);
            } else if (statement.type == "WhileStatement" || statement.type == "DoWhileStatement") {
                this.searchWhileStatement(statement);
            } else if (statement.type == "ForStatement") {
                this.searchForStatement(statement);
            } else if (statement.type == "ForInStatement" || statement.type == "ForOfStatement") {
                this.searchForInStatement(statement);
            } else if (statement.type == "LeftStatement") {
                this.searchLetStatement(statement);
            } else if (statement.type == "DebuggerStatement") {
                this.searchDebuggerStatement(statement)
            }
        }

        // Statements 
        searchForStatement(statement) {
            if (statement.init) {
                if (statement.init.type == "Expression") {
                    this.searchExpression(statement.init);
                } else {
                    // Variable Declaration
                    if (statement.init.type == "VariableDeclaration") {
                        this.searchVariableDeclaration(statement.init);
                    }
                }
            }

            if (statement.test) {
                this.searchExpression(statement.test);
            }

            if (statement.update) {
                this.searchExpression(statement.update);
            }

            this.searchStatement(statement.body);
        }

        searchForInStatement(statement) {
            // if statement.each is true, it is a for each/in instead of a for/in
            // If statement.each is undefined, it is a for/of statement
            if (this.left.type == "VariableDeclaration") {
                this.searchVariableDeclaration(this.left);
            } else {
                this.searchExpression(this.left);
            }

            this.searchExpression(this.right);
            this.searchStatement(this.body);
        }

        searchWhileStatement(statement) {
            this.searchExpression(statement.test);
            this.searchStatement(statement.body);
        }

        searchTryStatement(statement) {
            // TBD
        }

        searchBlockStatement(statement) {
            var statements = expression.body;
            for (var i = 0; i < statements.length; i++) {
                var statement = statements[i];
                this.searchStatement(statement);
            }
        }

        searchIfStatement(statement) {
            if (statement.alternate.type == "Identifier") {
                this.searchIdentifier(statement.alternate);
            } else {
                this.searchExpression(statement.alternate);
            }

            if (statement.consequent.type == "Identifier") {
                this.searchIdentifier(statement.consequent);
            } else {
                this.searchExpression(statement.consequent);
            }

            if (statement.test.type == "Identifier") {
                this.searchIdentifier(statement.test);
            } else {
                this.searchExpression(statement.test);
            }
        }

        searchLetStatement(statement) {
            for (var i = 0; i < statement.head.length; i++) {
                this.searchVariableDeclarator(statement.head);
            }
            this.searchStatement(statement.body);
        }

        searchDebuggerStatement(statement) {
            // Do nothing? 
        }

        // Expressions
        searchExpression(expression) {
            switch (expression) {
            case "Identifier":
                this.searchIdentifier(expression);
                break;
            case "ThisExpression":
                console.log("Found a this expression!");
                break;
            case "ArrayExpression":
                this.searchArrayExpression(expression);
                break;
            case "ObjectExpression":
                this.searchObjectExpression(expression);
                break;
            case "FunctionExpression" || "ArrowExpression":
                this.searchFunctionExpression(expression)
                break;
            case "SequenceExpression":
                this.searchSequenceExpression(expression);
                break;
            case "UnaryExpression":
                this.searchUnaryExpression(expression);
                break;
            case "BinaryExpression":
                this.searchBinaryExpression(expression);
                break;
            case "AssignmentExpression":
                this.searchAssignmentExpression(expression);
                break;
            case "UpdateExpression":
                this.searchUpdateExpression(expression);
                break;
            case "LogicalExpression":
                this.searchLogicalExpression(expression);
                break;
            case "ConditionalExpression":
                this.searchConditionalExpression(expression);
                break;
            case "NewExpression":
                this.searchNewExpression(expression);
                break;
            case "CallExpression":
                this.searchCallExpression(expression);
                break;
            case "MemberExpression":
                this.searchMemberExpression(expression);
                break;
            case "YieldExpression":
                this.searchYieldExpression(expression);
                break;
            case "ComprehensionExpression":
                this.searchComprehensionExpression(expression);
                break;
            case "LetExpression":
                this.searchLetExpression(expression);
                break;

                // Not supported in ECMAScript
                // ComprehensionExpression
                // GEneratorExpression
                // GraphExpression
                // GraphIndexExpression
                // 
            }
        };

        searchBinaryExpression(expression) {
            // Parse left and right hand sides
            this.searchExpression(expression.left);
            this.searchOperator(expression.operator);
            this.searchExpression(expression.right);
        }

        searchAssignmentExpression(expression) {
            this.searchPattern(expression.left);
            this.searchOperator(expression.operator);
            this.searchExpression(expression.right);
        }

        searchUpdateExpression(expression) {
            this.searchOperator(expression.operator);
            this.searchExpression(expression.argument);
        }

        searchLogicalExpression(expression) {
            // Parse left and right hand sides
            this.searchExpression(expression.left);
            this.searchOperator(expression.operator);
            this.searchExpression(expression.right);
        }

        searchConditionalExpression(expression) {
            this.searchExpression(expression.test);
            this.searchExpression(expression.alternate);
            this.searchExpression(expression.consequent);
        }

        searchNewExpression(expression) {
            this.searchExpression(expression);
            for (var i = 0; i < expression.arguments.length; i++) {
                this.searchExpression(expression.arguments[i]);
            }
        }

        searchCallExpression(expression) {
            this.searchExpression(expression);
            for (var i = 0; i < expression.arguments.length; i++) {
                this.searchExpression(expression.arguments[i]);
            }
        }

        searchMemberExpression(expression) {
            this.searchExpression(expression.object);
            this.searchExpression(expression.property);
        }

        searchYieldExpression(expression) {
            if (expression.argument) {
                this.searchExpression(expression.argument);
            }
        }

        searchComprehensionExpression(expression) {
            // Not supported in ECMAScript standard
        }

        searchLetExpression(expression) {
            for (var i = 0; i < expression.head.length; i++) {
                this.searchVariableDeclarator(expression.head[i]);
            }

            this.searchExpression(expression.body);
        }

        searchArrayExpression(expression) {
            if (expression.elements && expression.elements.length) {
                for (var i = 0; i < expression.elements.length; i++) {
                    var expr = expression.elements[i];
                    if (expr) {
                        this.searchExpression(expr);
                    }
                }
            }
        }

        searchObjectExpression(expression) {
            for (var i = 0; i < expression.properties.length; i++) {
                this.searchProperty(expression.properties[i]);
            }
        }

        searchFunctionExpression(expression) {
            if (expression.id) {
                this.searchIdentifier(expression.id);
            }

            for (var i = 0; i < expression.params.length; i++) {
                this.searchPattern(expression.params[i]);
            }

            for (var j = 0; j < expression.defaults.length; j++) {
                this.searchExpression(expression.defaults[j]);
            }

            // rest
            if (expression.rest) {
                this.searchIdentifier(expression.rest);
            }

            // BlockStatement or Expression
            if (epxression.body.type == "BlockStatement") {
                this.searchBlockStatement(expression.body);
            } else {
                this.searchExpression(expression.body);
            }

            // generator
            // expression
        }

        searchSequenceExpression(expression) {
            for (var i = 0; i < expression.expressions.length; i++) {
                this.searchExpression(expression.expressions[i]);
            }
        }

        searchUnaryExpression(expression) {
            this.searchOperator(expression.operator);
            this.searchExpression(expression.argument);
        }

        // Patterns
        searchPattern(pattern) {
            // TODO
        }

        searchIdentifier(identifier) {
            console.log("Identifier found: " + identifier.name);
        }

        searchOperator(operator) {
            /// I don't really care what the operator is right now so leaving this empty!
        }

        searchProperty(property) {
            // Only supported by object expressions
            if (property.key.type == "Literal") {
                this.searchLiteral(property.key);
            } else {
                this.searchIdentifier(property.key);
            }

            this.searchExpression(property.value);

            //property.kind contains the kind "init" for ordinary property initializers. 
            // "get" and "set" are the kind values for getters and setters
        }

        searchVariableDeclarator(declarator) {

        }
    };


    class CommandManager {
        constructor(ui) {
            this.commands = [];
            this.elements = [];
            this.commandCount = 0;
            this.ui = ui; // The instance of UI that is creating this instance
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
    };

    $action.Command = Command;
    $action.CommandManager = CommandManager;
})($action);