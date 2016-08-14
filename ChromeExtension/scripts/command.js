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

    $action.LabelAttributes = {
        "GLOBAL": ["class", "id", "title"],
        "INPUT": ["name", "placeholder", "alt", "value"],
        "BUTTON": ["name"],
        "FIELDSET": ["name"],
        "TEXTAREA": ["name"],
        "SELECT": ["name"],
        "A": ["href"]
            // TODO: Later fill in the complete set. 
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
            this._dependencies = [];
            this._dataDependent = false;
            this._computedStyles = {};

            // Label metadata collection structure
            this._labelMetadata = {
                elementLabels: {
                    phrases: [],
                    imperativePhrases: [],
                    nouns: [],
                    verbs: []
                },
                handlerName: "",
                handlerComments: {
                    phrases: [],
                    imperativePhrases: [],
                    nouns: [],
                    verbs: []
                },
                expressionComments: {
                    phrases: [],
                    imperativePhrases: [],
                    nouns: [],
                    verbs: []
                },
                expressionCalls: {
                    phrases: [],
                    imperativePhrases: [],
                    nouns: [],
                    verbs: []
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
            var heightBigEnough = element.height() > 10;
            var widthBigEnough = element.width() > 10;
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


    class CommandManager {
        constructor(ui, scripts) {
            this._commands = {};
            this._commandCount = 0;
            this._ui = ui; // The instance of UI that is creating this instance
            this._scripts = scripts;
            this.init();

            this._posTagger = new POSTagger();
            this._parser = new $action.Parser();
        }

        get Commands() {
            return this._commands;
        }

        init() {
            // Initialize a static list of all default computed style values so that command computed styles can be filtered to only non-default values for comparison later
            var element = document.createElement("div");
            $('html').append(element);
            var computed = window.getComputedStyle(element);
            this._defaultComputedStyles = JSON.parse(JSON.stringify(computed)); // Clone computed styles list
            $(element).remove();

            // Gather up all the scripts on the page and find all function expressions in them to be resolved by the handlers later
            /*            var scriptASTs = this._scripts.ASTs;
                        var findFunctionExpressionsInProgram = {
                            lookFor: ["FunctionExpression", "FunctionDeclaration", "ArrowExpression"],
                            within: ["Program"],
                            items: []
                        }

                        var scripts = Object.keys(scriptASTs);
                        for (var i = 0; i < scripts.length; i++) {
                            var clone = $.extend(true, {}, scriptASTs[scripts[i]]);

                            if (scripts[i] !== 'http://localhost:3000/ChromeExtension/scripts/ext/jquery-3.0.0.js') {
                                $action.ASTAnalyzer.searchAST(scriptASTs[scripts[i]], findFunctionExpressionsInProgram);
                            }
                        }

                        this._functions = findFunctionExpressionsInProgram.items;*/
        }

        hasCommand(commandID) {
            return this._commands[commandID] != undefined;
        }

        addCommand(command) {
            if (command.eventType == 'default' || $action.UserInvokeableEvents.indexOf(command.eventType) > -1 || $action.GlobalEventHandlers.indexOf(command.eventType) > -1) {
                var element = $action.getElementFromID(command.elementID);
                var newCommand = new $action.Command(command.id, command.elementID, command.eventType, command.handler)
                this.initMetadata(newCommand);
                console.log("adding new command " + command.eventType + " " + command.handler + " " + command.elementID);

                this._commandCount++;

                // Add the command to the command map
                this._commands[command.id] = newCommand;
                return true;
            }
            return false; // Returns whether the command was successfully added
        };


        removeCommand(command) {
            var storedCommand = this._commands[command.id];
            if (storedCommand) {
                this._commandCount--;
                this._ui.removeCommand(storedCommand, this._commandCount);
            }
        };

        organizeCommands() {
            var organizer = this._ui.Organizer;
            if (organizer) {
                var commandOrder = organizer(this._commands);
                for (var i = 0; i < commandOrder.length; i++) {
                    let containerLabel = commandOrder[i].container;
                    let cmds = commandOrder[i].commands;
                    this._ui.appendCommandGroup(containerLabel, cmds);
                }
            }
        };

        updateCommandEnabledStates(commandStates) {
            var keys = Object.keys(commandStates);
            for (var i = 0; i < keys.length; i++) {
                let commandState = commandStates[keys[i]];
                let command = this._commands[keys[i]];
                if (command.DataDependent != commandState) {
                    command.DataDependent = commandState;
                    this._ui.updateCommandEnabledState(command, commandState);
                }
            }
        }

        updateVisibleCommands() {
            var keys = Object.keys(this._commands);
            for (var i = 0; i < keys.length; i++) {
                let command = this._commands[keys[i]];
                this._ui.updateCommandVisibleState(command, command.visible());
            }
        }

        linkFunctionCalls(callList) {;
            // Look for any function calls (side-effects)
            var callList = {
                lookFor: "CallExpression",
                within: "Program",
                items: []
            }

            $action.ASTAnalyzer.searchAST(handlerAST, callList);

            // Go through the returned list of function expressions and link them to those with the same name in the script cache
            for (var i = 0; i < callList.length; i++) {
                var call = callList[i];
                var name = this.getCallReference(call);
                // Search through the stored list of functions
                for (var j = 0; j < this._functions.length; j++) {
                    var storedFunction = this._functions[j];
                    var storedName = this.getFunctionName(storedFunction);
                    if (name.length && storedName.length && storedName == name) {
                        call.referencedFunction = storedFunction;
                        break;
                    }
                }
            }
        };

        // Can be FunctionExpression, FunctionDefinition, or ArrowExpression
        getFunctionName(functionExpr) {
            var fnName = "";
            if (functionExpr.id && functionExpr.id.type == "Identifier") {
                fnName = functionExpr.id.name;
            } else if (functionExpr.id) {
                fnName = functionExpr.id;
            }
            return fnName;
        }

        // Can be FunctionExpression, FunctionDefinition, or ArrowExpression
        getCallReference(callExpr) {
            var callRef = "";
            if (callExpr.callee.type == "Identifier") {
                callRef = callExpr.callee.name;
            }
            // TODO: more advanced calls later
            return callRef;
        }

        filterTagNodes(text) {
            // Look for opening and closing brackets. Assume this is a text node that is also a tag
            var first = text.substring(0, 1);
            var last = text.substring(text.length - 1, text.length);
            if (first == "<" && last == ">") {
                return false;
            }

            return true;
        }

        parsePhrase(labelMetadata, phrase) {
            var toLower = phrase.toLowerCase();
            var tagged = this._parser.parse(phrase);
            var split = this._parser.split(phrase);
            if (split && split.length > 1) {
                let first = split[0].toLowerCase();
                var sentence = split.toString().replace(/\,/g, " ").toLowerCase();
                sentence = _.upperFirst(sentence);
                if (tagged.verbs.indexOf(first) > -1) {
                    labelMetadata.imperativePhrases.push(sentence);
                } else {
                    labelMetadata.phrases.push(sentence);
                }
            } else {
                // Not a phrase
                // Find verbs and nouns
                // Convert 
                labelMetadata.verbs = labelMetadata.verbs.concat(tagged.verbs);
                labelMetadata.nouns = labelMetadata.nouns.concat(tagged.nouns);
            }
        }

        parseLabel(labelMetadata, labelString) {
            var sentences = labelString.split(/\.|\?|!/);
            var split = [];

            if (sentences.length > 1) {
                for (var i = 0; i < sentences.length; i++) {
                    this.parsePhrase(labelMetadata, sentences[i]);
                }
            } else {
                let sentence = sentences[0].trim();
                this.parsePhrase(labelMetadata, sentence);
            }
        }

        parseLabelFor(command, element) {
            // Check if the element has an ID 
            if (!element.attrributes) {
                return;
            }

            var id = element.attributes.id;
            if (id) {
                // Look for a label element with for attribute matching this ID
                var label = $("[for='" + id.value + "']");
                if (label && label.length && label[0].textContent.length) {
                    this.parseLabel(command.LabelMetadata.elementLabels, label[0].textContent);
                }
            }
        }

        parseElement(command, element) {
            // Find all of the tags
            // After searching text nodes, search attributes for imperative labels
            // First, look in global attributes 
            // Then look in attributes specific to that tag name
            // Should we search in any particular order? 
            if (!element.attributes) {
                return; // Document & Window do not have inline attributes
            }

            var globalAttrs = $action.LabelAttributes.GLOBAL;
            if (globalAttrs.length) {
                for (var i = 0; i < globalAttrs.length; i++) {
                    let globalAttr = globalAttrs[i];
                    let attr = element.attributes[globalAttr];
                    if (attr) {
                        let attrValue = attr.value;
                        if (attrValue && attrValue.length) {
                            this.parseLabel(command.LabelMetadata.elementLabels, attrValue);
                        }
                    }
                }
            }


            var nonGlobalAttrs = $action.LabelAttributes[element.tagName];
            if (nonGlobalAttrs) {
                for (var j = 0; j < nonGlobalAttrs.length; j++) {
                    let nonGlobalAttr = element.attributes[nonGlobalAttrs[j]];
                    if (nonGlobalAttr) {
                        let nonGlobalVal = nonGlobalAttr.value;
                        if (nonGlobalVal && nonGlobalVal.length) {
                            this.parseLabel(command.LabelMetadata.elementLabels, nonGlobalVal);
                        }
                    }
                }
            }
        }

        initComputedStyles(command, element) {
            var computedStyles = window.getComputedStyle(element);
            var keys = Object.keys(computedStyles);
            var result = {};
            for (var i = 0; i < keys.length; i++) {
                // If the computed style is not equal to the default value, store it
                var style = computedStyles[keys[i]];
                var defaultStyle = this._defaultComputedStyles[keys[i]];
                if (style != defaultStyle) {
                    result[keys[i]] = style;
                }
            }

            command.ComputedStyles = result;
        }

        /**
         * Initialize all of the command  metadata
         * @private
         * @property undefined
         */
        initMetadata(command) {
            // Get labels
            // Retrieve all of the Text nodes on the element
            // Tag them with the parts of speech. 
            var element = command.Element;
            if (element && !(element instanceof Window)) {
                var walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
                var node = walker.nextNode();
                while (node) {
                    if (node.parentNode && node.parentNode.tagName != "SCRIPT") {
                        // split the string by space separators
                        var trimmed = node.textContent.replace(/\s/g, ' ').trim();
                        if (trimmed && trimmed.length && this.filterTagNodes(trimmed)) {
                            this.parseLabel(command.LabelMetadata.elementLabels, trimmed);
                        }
                    }

                    node = walker.nextNode();
                }

                this.parseElement(command, element);
                this.parseLabelFor(command, element);

                // Search descendants for potential tags
                var desc = $(element).find("*");
                for (var k = 0; k < desc.length; k++) {
                    this.parseElement(command, desc[k]);
                }

                // Computed styles
                //  this.initComputedStyles(command, element);
                if (command.EventType != 'default') {
                    this.parseHandler(command);
                }
            }
        };


        parseHandler(command) {
            // Parse the handler and get function names
            var ast = esprima.parse(command.Handler, {
                tolerant: true,
                comment: true,
                attachComment: true
            });

            // Function name
            if (ast.body.length == 1) {
                // Comments before handler function
                // Need to link with function call in script first

                // Function name
                let identifier = ast.body[0].id;
                if (identifier) {
                    command.LabelMetadata.handlerName = identifier.name;
                }

                // Find comments on the handler function

                // Find function/state change identifiers. 

                // First look for all identifiers within expressions but outside conditionals
                var findIdentifersWithinExpressionStatementsOutsideConditionals = {
                    lookFor: ["Identifier"],
                    outside: ["IfStatement", "ConditionalExpression", "WhileStatement", "DoWhileStatement", "ForStatement", "ForInStatement", "ForOfStatement", "SwitchStatement"],
                    items: []
                }

                $action.ASTAnalyzer.searchAST(ast, findIdentifersWithinExpressionStatementsOutsideConditionals);
                this.parseIdentifiers(command.LabelMetadata.expressionCalls, findIdentifersWithinExpressionStatementsOutsideConditionals.items);

                // Find all identifiers within expressions inside of conditionals
                var findIdentifiersInsideConditionals = {
                    within: ["IfStatement", "ConditionalExpression", "WhileStatement", "DoWhileStatement", "ForStatement", "ForInStatement", "ForOfStatement", "SwitchStatement"],
                    lookFor: ["Identifier"],
                    property: ["consequent", "alternate"],
                    items: []
                }

                $action.ASTAnalyzer.searchAST(ast, findIdentifiersInsideConditionals);
                this.parseIdentifiers(command.LabelMetadata.expressionCalls, findIdentifiersInsideConditionals.items);

                // Find all expression statements for their leading comments
                var findExpressionStatementsOutsideConditionals = {
                    lookFor: ["ExpressionStatement"],
                    outside: ["IfStatement", "ConditionalExpression", "WhileStatement", "DoWhileStatement", "ForStatement", "ForInStatement", "ForOfStatement", "SwitchStatement"],
                    items: []
                }

                $action.ASTAnalyzer.searchAST(ast, findExpressionStatementsOutsideConditionals);
                this.parseComments(command.LabelMetadata.expressionComments, findExpressionStatementsOutsideConditionals.items);

                var findExpressionStatementsInsideConditionals = {
                    lookFor: ["ExpressionStatement"],
                    within: ["IfStatement", "ConditionalExpression", "WhileStatement", "DoWhileStatement", "ForStatement", "ForInStatement", "ForOfStatement", "SwitchStatement"],
                    property: ["consequent", "alternate"],
                    items: []
                }

                $action.ASTAnalyzer.searchAST(ast, findExpressionStatementsInsideConditionals);
                this.parseComments(command.LabelMetadata.expressionComments, findExpressionStatementsInsideConditionals.items);

                // State changes (statements)


                // DOM APIs
                // Later
                // Differentiate between statements & function calls?
            }

            // 
            /*            var find = {
                            within: "Program",
                            lookFor: [
                                "IfStatement", "ConditionalExpression", "WhileStatement", "DoWhileStatement", "ForStatement", "ForInStatement", "ForOfStatement"],
                            items: [] // Will contain the collection of requested elements you are looking for
                        }*/
        };

        parseComments(labelMetadata, expressionStatements) {
            for (let i = 0; i < expressionStatements.length; i++) {
                let comments = expressionStatements[i].leadingComments;
                if (comments) {
                    for (let j = 0; j < comments.length; j++) {
                        this.parseLabel(labelMetadata, comments[j].value);
                    }
                }
            }
        }

        parseIdentifiers(labelMetadata, identifiers) {
            for (let i = 0; i < identifiers.length; i++) {
                this.parseLabel(labelMetadata, identifiers[i].name);
            }
        }

        /**
         * Get all of the commands metadata to use for visual clustering organization
         * @private
         * @property undefined
         */
        getVisualMetadata() {
            var visualData = {};
            var commandKeys = Object.keys(this._commands);
            for (var i = 0; i < commandKeys.length; i++) {
                visualData[commandKeys[i]] = this._commands[commandKeys[i]].ComputedStyles;
            }

            return visualData;
        }

        getCommandsByID(commandIDs) {
            var cmds = [];
            for (var i = 0; i < commandIDs.length; i++) {
                cmds.push(this._commands[commandIDs[i]]);
            }

            return cmds;
        }

        updateVisualCommandGroups(groups) {
            for (var i = 0; i < groups.length; i++) {
                let container = groups[i].container;
                let cmds = groups[i].commands;
                let labels = $(container).siblings('h1,h2,h3,h4,h5,h6').first();
                let label = "";

                try {
                    if (labels.length) {
                        label = labels[0].innerHTML;
                    } else {
                        // Search the parent elements for the first header that we can find
                        labels = $(container).parents().first().siblings('h1,h2,h3,h4,h5,h6').first();
                        if (labels.length) {
                            label = labels[0].innerHTML;
                        } else {

                            // Search for any text nodes above the element
                            var textNodes = $(container).siblings().contents().filter(function () {
                                return this.nodeType == 3;
                            });

                            if (textNodes.length) {
                                label = textNodes[0].textContent;
                            } else {
                                // Search for any text nodes above the element
                                var parentTextNodes = $(container).parents().first().siblings().contents().filter(function () {
                                    return this.nodeType == 3;
                                });

                                if (parentTextNodes.length) {
                                    label = parentTextNodes[0].textContent;
                                }

                            }
                        }
                    }
                } catch (e) {
                    label = "";
                }


                let cmdObjects = this.getCommandsByID(cmds);
                this._ui.appendCommandGroup(label, cmdObjects);
            }
        }
    };

    $action.Command = Command;
    $action.CommandManager = CommandManager;
})($action);