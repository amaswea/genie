"use strict";

var $action = $action || {};
(function ($action) {

    class CommandManager {
        constructor(ui, scriptManager) {
            this._commands = {};
            this._commandCount = 0;
            this._ui = ui; // The instance of UI that is creating this instance
            this._scriptManager = scriptManager;
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
        }

        hasCommand(commandID) {
            return this._commands[commandID] != undefined;
        }

        findDuplicate(command) {
            // Filter duplicates by comparing whether two handlers are the same
            // TODO: Make smarter
            if (command.eventType != 'default') {
                var keys = Object.keys(this._commands);
                for (var i = 0; i < keys.length; i++) {
                    let cmd = this._commands[keys[i]];
                    if (cmd.Handler == command.handler) {
                        return true;
                    }
                }
            }
        }

        addCommand(command) {
            let duplicate = this.findDuplicate(command); // Look for duplicate commands
            if (!duplicate && command.eventType == 'default' || $action.UserInvokeableEvents.indexOf(command.eventType) > -1 || $action.GlobalEventHandlers.indexOf(command.eventType) > -1) {
                var element = $action.getElementFromID(command.elementID);
                var newCommand = new $action.Command(command.id, command.elementID, command.eventType, command.handler)
                this.initMetadata(newCommand);
                //  console.log("adding new command " + command.eventType + " " + command.handler + " " + command.elementID);

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

        linkFunctionCalls(ast) {
            // Look for any function calls (side-effects)
            var callList = {
                lookFor: "CallExpression",
                within: "Program",
                items: []
            }

            $action.ASTAnalyzer.searchAST(ast, callList);

            // Go through the returned list of function expressions and link them to those with the same name in the script cache
            for (var i = 0; i < callList.items.length; i++) {
                var call = callList.items[i];
                var name = this.getCallReference(call);
                // Search through the stored list of functions
                if (name && name.length) {
                    var referencedFunc = this._scriptManager.Functions[name];
                    if (referencedFunc) {
                        call.referencedFunction = referencedFunc;
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
                if (tagged.nonEnglish.length < split.length) { // Phrase should contain at least one enlish word.  
                    if (tagged.verbs.indexOf(first) > -1) {
                        labelMetadata.imperativePhrases.push(sentence);
                    } else {
                        labelMetadata.phrases.push(sentence);
                    }
                }
            } else {
                // Not a phrase
                // Find verbs and nouns
                // Convert 
                labelMetadata.verbs = labelMetadata.verbs.concat(tagged.verbs);
                labelMetadata.nouns = labelMetadata.nouns.concat(tagged.nouns);
            }
        }

        parseURL(labelMetadata, labelString) {
            var chunks = labelString.split(/\//);
            if (chunks && chunks.length) {
                for (var i = 0; i < chunks.length; i++) {
                    this.parsePhrase(labelMetadata, chunks[i]);
                }
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
                            if ($action.LabelURLAttributes.indexOf(nonGlobalAttrs[j]) > -1) {
                                this.parseURL(command.LabelMetadata.elementLabels, nonGlobalVal);
                            } else {
                                this.parseLabel(command.LabelMetadata.elementLabels, nonGlobalVal);
                            }
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
            if (element && !(element instanceof Window) && !(element instanceof Document) &&
                !(element.tagName == "BODY")) {
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
            }

            if (command.EventType != 'default') {
                this.parseHandler(command);
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
            if (ast.body.length == 1) { // Handler should have at least one statement
                this.linkFunctionCalls(ast);

                // Comments before handler function
                // Need to link with function call in script first

                // Function name
                let identifier = ast.body[0].id;
                if (identifier) {
                    this.parseLabel(command.LabelMetadata.handlerName, identifier.name);
                }

                // Find comments on the handler function

                // Find function/state change identifiers. 


                // Find all function call expressions inside conditionals
                var findFunctionCallExpressionsInsideConditionals = {
                    within: ["IfStatement", "ConditionalExpression", "WhileStatement", "DoWhileStatement", "ForStatement", "ForInStatement", "ForOfStatement", "SwitchStatement"],
                    lookFor: ["CallExpression"],
                    property: ["consequent", "alternate"],
                    items: []
                }

                $action.ASTAnalyzer.searchAST(ast, findFunctionCallExpressionsInsideConditionals);

                // Visitor for searching identifiers within a node
                var findIdentifiersInNode = {
                    lookFor: ["Identifier"],
                    items: []
                }

                // Within the call expressions that have a referenced function, find and parse the identifiers
                for (var i = 0; i < findFunctionCallExpressionsInsideConditionals.items.length; i++) {
                    let item = findFunctionCallExpressionsInsideConditionals.items[i];
                    if (item && item.referencedFunction) {
                        $action.ASTAnalyzer.searchAST(item, findIdentifiersInNode);
                    }
                }

                var findFunctionCallExpressionsOutsideConditionals = {
                    outside: ["IfStatement", "ConditionalExpression", "WhileStatement", "DoWhileStatement", "ForStatement", "ForInStatement", "ForOfStatement", "SwitchStatement"],
                    lookFor: ["CallExpression"],
                    items: []
                }

                $action.ASTAnalyzer.searchAST(ast, findFunctionCallExpressionsOutsideConditionals);

                // Within the call expressions that have a referenced function, find and parse the identifiers
                for (var i = 0; i < findFunctionCallExpressionsOutsideConditionals.items.length; i++) {
                    let item = findFunctionCallExpressionsOutsideConditionals.items[i];
                    if (item && item.referencedFunction) {
                        $action.ASTAnalyzer.searchAST(item, findIdentifiersInNode);
                    }
                }

                // Parse the located identifiers
                this.parseIdentifiers(command.LabelMetadata.expressionCalls, findIdentifiersInNode.items);

                // Find all expression statements for their leading and trailing comments
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

    $action.CommandManager = CommandManager;
})($action);