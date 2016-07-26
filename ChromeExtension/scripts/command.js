"use strict";

var $action = $action || {};
(function ($action) {

    $action.ActionableElementsActionLabel = {
        "A": "Open",
        "BUTTON": "Click",
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

    // This ste of attributes typically follow a structure of camel cased, or dash separated names that are separate descriptors of the element
    $action.NonSentenceLabels = {
        "GLOBAL": ["class", "id"], // Class is not included because it is the only one that should be considered as separate tokens. 
        "INPUT": ["name"],
        "BUTTON": ["name"],
        "FIELDSET": ["name"],
        "TEXTAREA": ["name"],
        "SELECT": ["name"],
        "A": ["href"]
            // TODO: Later fill in the complete set. 
    }

    // This set of attributes typically follow a sentence structure. 
    $action.SentenceLabels = {
        "GLOBAL": ["title"],
        "INPUT": ["placeholder", "alt", "value"]
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
            this._dependencies = [];
            this._dataDependent = false;
            this._imperativeLabels = [];
            this._labels = [];
            this._nounTags = [];
            this._tags = [];
            this._computedStyles = {};

            if (this._handler) {
                // this._ast = esprima.parse(this._handler);
                console.log(domElement);
                console.log(this._handler);
            }

            /*            this.initMetadata();*/
            this.postCommands = [];
        }

        // Getters & Setters
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

        get DataDependent() {
            return this._dataDependent;
        }

        set DataDependent(state) {
            this._dataDependent = state;
        }

        get ImperativeLabels() {
            return this._imperativeLabels;
        }

        set ImperativeLabels(labels) {
            this._imperativeLabels = labels;
        }

        // The first text node found in the hierarcy
        get Labels() {
            return this._labels;
        }

        set Labels(labels) {
            this._labels = labels;
        }

        get NounTags() {
            return this._nounTags;
        }

        set NounTags(tags) {
            this._nounTags = tags;
        }

        get Tags() {
            return this._tags;
        }

        set Tags(tags) {
            this._tags = tags;
        }
        
        set ComputedStyles(styles){
            this._computedStyles = styles;
        }
        
        get ComputedStyles(){
            return this._computedStyles;
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
            this.commands = {};
            this.commandCount = 0;
            this.ui = ui; // The instance of UI that is creating this instance
            this._scripts = scripts;
            this.init();

            this._posTagger = new POSTagger();
            this._parser = new $action.Parser();
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

        addCommand(command) {
            if (command.eventType == 'default' || $action.UserInvokeableEvents.indexOf(command.eventType) > -1 || $action.GlobalEventHandlers.indexOf(command.eventType) > -1) {
                var element = $(command.path);
                if (element && element.length) {
                    var newCommand = new $action.Command(command.eventType, element[0], command.handler)
                        // this.analyzeCommandHandler(newCommand.AST, newCommand);
                    this.initMetadata(newCommand);

                    this.commandCount++;
                    this.ui.appendCommand(newCommand, this.commandCount);

                    // Add the command to the command map
                    this.commands[command.id] = newCommand;
                    return true;
                }
            }
            return false; // Returns whether the command was successfully added
        };


        removeCommand(command) {
            var storedCommand = this.commands[command.id];
            if (storedCommand) {
                this.commandCount--;
                this.ui.removeCommand(storedCommand);
            }
        };

        updateCommandStates(commandStates) {
            var keys = Object.keys(commandStates);
            for (var i = 0; i < keys.length; i++) {
                let commandState = commandStates[keys[i]];
                let command = this.commands[keys[i]];
                if (command.DataDependent != commandState) {
                    command.DataDependent = commandState;
                    this.ui.updateCommandState(command, commandState);
                }
            }
        }

        analyzeCommandHandler(handlerAST, command) {
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

            for (var j = 0; j < findIdentifiersWithinSwitch.items.length; j++) {
                let expr = findIdentifiersWithinSwitch.items[j].sideEffectFreeExpression;
                if (expr) {
                    sideEffectFreeExpressions.push(expr);
                }
            }

            return sideEffectFreeExpressions;
        };

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

        findImperativeSentence(sentence) {
            var split = sentence.split(" ");
            var tagged = this._posTagger.tag(split);
            if (tagged.length) {
                // First word in the sentence should be a verb
                var first = tagged[0];
                var firstType = first[1];
                if (["VB", "VBP"].indexOf(firstType) > -1 && !this._imperativeLabel) {
                    return sentence;
                }
            }
        }

        parseSentenceLabel(command, labelString) {
            var sentences = labelString.split(/\.|\?|!/);
            var split = [];
            if (sentences.length > 1) {
                for (var i = 0; i < sentences.length; i++) {
                    let impSentence = this.findImperativeSentence(sentences[i].trim());
                    if (impSentence && impSentence.length) {
                        command.ImperativeLabels.push(impSentence);
                    } else {
                        command.Labels.push(sentences[i]);
                    }
                }
            } else {
                let impSentence = this.findImperativeSentence(sentences[0]);
                if (impSentence && impSentence.length) {
                    command.ImperativeLabels.push(impSentence);
                } else {
                    command.Labels.push(labelString);
                }
            }
        }

        parseLabelFor(command) {
            // Check if the element has an ID 
            var id = command.Element.attributes.id;
            if (id) {
                // Look for a label element with for attribute matching this ID
                var label = $("[for='" + id.value + "']");
                if (label && label.length && label[0].textContent.length) {
                    let impSentence = this.findImperativeSentence(label[0].textContent);
                    if (impSentence && impSentence.length) {
                        command.ImperativeLabels.push(impSentence);
                    } else {
                        command.Labels.push(label[0].textContent);
                    }
                }
            }
        }

        parseTags(command, labelString) {
            // First split by spaces to get individual words
            var tokens = labelString.split(/\s|\/|:|\./);

            // Then go through each token and split by comming separation conventions
            for (var i = 0; i < tokens.length; i++) {
                let parsedToken = this._parser.parse(tokens[i]);
                if (parsedToken.nouns.length) {
                    command.NounTags = command.NounTags.concat(parsedToken.nouns);
                }

                if (parsedToken.words.length) {
                    command.Tags = command.Tags.concat(parsedToken.words);
                }
            }
        }

        parseElement(command, element) {
            // Find all of the tags
            // After searching text nodes, search attributes for imperative labels
            // First, look in global attributes 
            // Then look in attributes specific to that tag name
            // Should we search in any particular order? 
            var globalAttrs = $action.SentenceLabels.GLOBAL;
            if (globalAttrs.length) {
                for (var i = 0; i < globalAttrs.length; i++) {
                    let globalAttr = globalAttrs[i];
                    let attr = element.attributes[globalAttr];
                    if (attr) {
                        let attrValue = attr.value;
                        if (attrValue && attrValue.length) {
                            this.parseSentenceLabel(command, attrValue);
                        }
                    }
                }
            }


            var nonGlobalAttrs = $action.SentenceLabels[element.tagName];
            if (nonGlobalAttrs) {
                for (var j = 0; j < nonGlobalAttrs.length; j++) {
                    let nonGlobalAttr = element.attributes[nonGlobalAttrs[j]];
                    if (nonGlobalAttr) {
                        let nonGlobalVal = nonGlobalAttr.value;
                        if (nonGlobalVal && nonGlobalVal.length) {
                            this.parseSentenceLabel(command, nonGlobalVal);
                        }
                    }
                }
            }

            // Now, look for tags in the non-sentence containing attributes. 
            var nonSentenceGlobals = $action.NonSentenceLabels.GLOBAL;
            for (var i = 0; i < nonSentenceGlobals.length; i++) {
                let nonSentence = nonSentenceGlobals[i];
                let value = element.attributes[nonSentence];
                if (value) {
                    let attrValue = value.value;
                    if (attrValue && attrValue.length) {
                        this.parseTags(command, attrValue);
                    }
                }
            }

            // Now, do the same for non-sentence globals
            var nonSentenceAttrs = $action.NonSentenceLabels[command.Element.tagName];
            if (nonSentenceAttrs) {
                for (var j = 0; j < nonSentenceAttrs.length; j++) {
                    let nonSentenceAttr = element.attributes[nonSentenceAttrs[j]];
                    if (nonSentenceAttr) {
                        let nonSentenceVal = nonSentenceAttr.value;
                        if (nonSentenceVal && nonSentenceVal.length) {
                            this.parseTags(command, nonSentenceVal);
                        }
                    }
                }
            }
        }

        initComputedStyles(command) {
            var computedStyles = window.getComputedStyle(command.Element);
            var keys = Object.keys(computedStyles);
            var result = {}; 
            for (var i = 0; i < keys.length; i++) {
                // If the computed style is not equal to the default value, store it
                var style = computedStyles[keys[i]];
                var defaultStyle = this._defaultComputedStyles[keys[i]]; 
                if(style != defaultStyle){
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
            var walker = document.createTreeWalker(command.Element, NodeFilter.SHOW_TEXT, null, false);
            var node = walker.nextNode();
            while (node) {
                // split the string by space separators
                var trimmed = node.textContent.replace(/\s/g, ' ').trim();
                if (trimmed && trimmed.length && this.filterTagNodes(trimmed)) {
                    this.parseSentenceLabel(command, trimmed);
                }

                node = walker.nextNode();
            }

            this.parseElement(command, command.Element);
            this.parseLabelFor(command);

            // Search descendants for potential tags
            var desc = $(command.Element).find("*");
            for (var k = 0; k < desc.length; k++) {
                this.parseElement(command, desc[k]);
            }

            // Filter duplicate tags
            command.NounTags = _.uniq(command.NounTags);
            command.Tags = _.uniq(command.Tags);
            command.Labels = _.uniq(command.Labels);
            command.ImperativeLabels = _.uniq(command.ImperativeLabels);

            // Computed styles
            this.initComputedStyles(command);
        };
    };

    $action.Command = Command;
    $action.CommandManager = CommandManager;
})($action);