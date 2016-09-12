 "use strict";
 var $action = $action || {};
 (function ($action) {
     // Interface for UIs
     class UI {
         constructor() {
             this._organizer = this.OrganizationTypes.Type;
             this.initCanvas();
             this._cellCoordinates = {};
             this._commandItems = {}; // Collection of command Items
             this._parser = new $action.Parser();
             this._labels = {}; // A map between labels and the count of commands that have that label
         }

         get OrganizationTypes() {
             return {
                 Type: $action.CommandOrganizer.organizeCommandsByType,
                 All: $action.CommandOrganizer.organizeAllCommands,
             };
         }

         get Organizer() {
             return this._organizer;
         }

         get CommandItems() {
             return this._commandItems;
         }

         set Root(rootUI) {
             this._rootUI = rootUI;
         }

         get Parser() {
             return this._parser;
         }

         get Labels() {
             return this._labels;
         }

         addCommandsGroup(label, commands) {
             let commandItems = this.createCommands(label, commands);
             if (commandItems) {
                 this.initLabelsMap(commandItems);
                 this._commandItems[label] = commandItems;
                 this.appendCommands(label, commandItems); // Assumes that _commandItems has been initialized              
             }
         }

         createCommands(label, commands) {
             // Groups
             let commandItems = [];
             for (var i = 0; i < commands.length; i++) {
                 var newCommand = new $action.CommandItem(commands[i], this);
                 commands[i].CommandItem = newCommand;
                 commandItems.push(newCommand);
             }
             return commandItems;
         }

         // Creates a map between the labels for each command and the count that have that particular label. This count is used by the // commandLabel function to determine which label is the most unique to identify the command
         initLabelsMap(commandItems) {
             for (var m = 0; m < commandItems.length; m++) {
                 let command = commandItems[m].Command;
                 // Returns all of the label metadata after the first imperative label is found (description)
                 var nodeTypes = ["handlerName", "handlerComments", "expressionComments", "expressionCalls", "elementLabels", "assignments"];
                 var phraseTypes = ["imperativePhrases", "verbs", "nouns", "phrases", "other", "numbers"];
                 var labels = [];
                 for (var i = 0; i < nodeTypes.length; i++) {
                     for (var j = 0; j < phraseTypes.length; j++) {
                         var labelSet = command.LabelMetadata[nodeTypes[i]][phraseTypes[j]];
                         for (var k = 0; k < labelSet.length; k++) {
                             let labelItem = labelSet[k];
                             if (labels.indexOf(labelItem) < 0) {
                                 if (!this._labels[labelItem]) {
                                     this._labels[labelItem] = 0;
                                 }
                                 this._labels[labelItem]++;
                                 labels.push(labelItem);
                             }
                         }
                     }
                 }

                 if (!command.hasArguments()) {
                     var types = ["assignments", "expressionCalls", "expressionComments"];
                     var labelTypes = ["imperativePhrases", "verbs", "nouns", "phrases", "other", "numbers"];
                     for (var i = 0; i < types.length; i++) {
                         var type = command.LabelMetadata.conditionals[types[i]];
                         for (var j = 0; j < type.length; j++) {
                             var obj = type[j];
                             for (var k = 0; k < labelTypes.length; k++) {
                                 var labelNode = obj[labelTypes[k]];
                                 for (var l = 0; l < labelNode.length; l++) {
                                     let labelItem = labelNode[l];
                                     if (labels.indexOf(labelItem) < 0) {
                                         if (!this._labels[labelItem]) {
                                             this._labels[labelItem] = 0;
                                         }
                                         this._labels[labelItem]++;
                                         labels.push(labelItem);
                                     }
                                 }
                             }
                         }
                     }
                 }
             }
         }

         initCanvas() {
             // Canvas
             var canvas = document.createElement("canvas");
             canvas.classList.add("genie-ui-input-canvas");
             $('html').append(canvas);
             this.canvas = canvas;
             this.canvas.style.display = "none";
             this.canvas.setAttribute("tabindex", "1");
         }

         inputHandler(command) {
             this._eventTimeout = null;
             let cellString = "";
             for (var i = 0; i < this._keyCodes.length; i++) {
                 cellString = cellString + $action.KeyCodes[this._keyCodes[i]];
             }
             let cellNumber = parseInt(cellString);
             let mousePosition = this._cellCoordinates[cellNumber];
             if (mousePosition) {
                 console.log(mousePosition);
                 command.execute(0, mousePosition);
                 this.canvas.style.display = "none";
                 this._keyCodes.splice(0, this._keyCodes.length);
                 window.removeEventListener("keydown", this._listener, false);
             }
         }

         inputThrottler(command, evt) {
             if (!this._eventTimeout) {
                 this._keyCodes = [];
                 this._keyCodes.push(evt.which);
                 this._eventTimeout = setTimeout(this.inputHandler.bind(this, command), 500);
             } else {
                 this._keyCodes.push(evt.which);
             }
         }

         show() {
             this._rootUI.style.display = "";
         }

         hide() {
             this._rootUI.style.display = "none";
         }

         appendCommands() {

         }

         removeCommands() {

         }

         removeCommand() {}

         updateCommandEnabledState(command, enabled) {
             // What should happen when the command state changes
             if (command.CommandItem) {
                 var domElement = command.CommandItem.DOM;
                 var disabled = $(domElement).hasClass('genie-ui-disabled');
                 if (disabled && enabled) {
                     $(domElement).removeClass('genie-ui-disabled');
                 }

                 if (!disabled && !enabled) {
                     $(domElement).addClass('genie-ui-disabled');
                 }
             }
         }

         updateCommandVisibleState(command, visible) {
             if (command.CommandItem && command.CommandItem.DOM) {
                 var displayed = command.CommandItem.DOM.style.display;
                 if (displayed == "none" && visible) {
                     command.CommandItem.DOM.style.display = "";
                 }

                 if (displayed != "none" && !visible) {
                     command.CommandItem.DOM.style.display = "none";
                 }
             }
         }

         drawGridAndGetInput(command, width, height, x, y) {
             var bw = width;
             var bh = height;
             var p = 10;

             var canvas = this.canvas;
             var context = canvas.getContext("2d");
             context.clearRect(0, 0, canvas._prevWidth, canvas._prevHeight);
             canvas.style.position = "absolute";
             canvas.style.left = x + "px";
             canvas.style.top = y + "px";
             canvas.width = width;
             canvas.height = height;
             canvas._prevWidth = width;
             canvas._prevHeight = height;

             var cellNumber = 1;
             for (var x = 0; x <= bw; x += 40) {
                 for (var y = 0; y <= bh; y += 40) {
                     context.moveTo(p + x, y + p);
                     context.lineTo(p + x, y + p + 40);
                     context.strokeText(cellNumber.toString(), x + p + 5, y + p + 10);
                     this._cellCoordinates[cellNumber] = {
                         x: (x + p + 20),
                         y: (y + p + 20)
                     };
                     cellNumber++;
                 }
             }

             for (var x = 0; x <= bh; x += 40) {
                 context.moveTo(p, x + p);
                 context.lineTo(bw + p, x + p);
             }

             context.strokeStyle = "black";
             context.lineWidth = 1;
             context.stroke();

             this.canvas.style.display = "";
             this.canvas.fillStyle = "rgba(255, 255, 255, 0.5)";
             this._listener = this.inputThrottler.bind(this, command);
             window.addEventListener("keydown", this._listener, false);
         }
     }

     $action.UI = UI;

     class CommandItem {
         constructor(command, ui) {
             this.command = command;
             this._ui = ui;
         }

         get Command() {
             return this.command;
         }

         get DOM() {
             return this._domElement;
         }

         set Trigger(trigger) {
             this._trigger = trigger;
         }

         get Trigger() {
             return this._trigger;
         }

         init() {};

         perform(argument, input) {
             // Call the execute method to perform the command
             if (this.command.RequiresMousePosition) {
                 // remove. Hack
                 var element = this.command.Element;
                 if (this.command.Element instanceof Document) {
                     element = document.body;
                 }

                 var commandHeight = $(element).outerHeight();
                 var commandWidth = $(element).outerWidth();
                 var commandX = $(element).offset().left;
                 var commandY = $(element).offset().top;
                 this._ui.drawGridAndGetInput(this.command, commandWidth, commandHeight, commandX, commandY);
             } else if (this.command.hasArguments()) {
                 this.command.execute(argument);
             } else if (this.command.RequiresInput) {
                 this.command.execute(input);
             } else {
                 this.command.execute();
             }
         }

         /**
          * A label string to use for the command item
          * @private
          * @property undefined
          */
         label() {
             // Labeling metadata available
             /*this._labelMetadata = {
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
                }, 
                assignments: {
                    phrases: [],
                    imperativePhrases: [],
                    nouns: [],
                    verbs: []
                }
            }*/
             var labels = [];
             var completeLabel = "";
             // Constructs a desired label for the command based on the command metadata available
             var nodeTypes = ["elementLabels", "handlerComments", "expressionComments", "expressionCalls", "assignments", "handlerName"];
             var phraseTypes = ["phrases", "imperativePhrases", "nouns", "verbs", "other", "numbers"];
             for (var i = 0; i < nodeTypes.length; i++) {
                 for (var j = 0; j < phraseTypes.length; j++) {
                     var labelSet = this.command.LabelMetadata[nodeTypes[i]][phraseTypes[j]];
                     for (var k = 0; k < labelSet.length; k++) {
                         if (labels.indexOf(labelSet[k]) < 0) {
                             completeLabel = completeLabel + _.upperFirst(labelSet[k]) + ", ";
                             labels.push(labelSet[k]);
                         }
                     }
                 }
             }

             return completeLabel.substring(0, completeLabel.length - 2);
         }

         generateCommandLabelFromPhrase(label) {
             var tagged = this._ui.Parser.parse(label);
             var split = this._ui.Parser.split(label);
             let phrase = "";
             if (split && split.length > 1) {
                 // Locate the first verb 
                 let verbIndex = 0;
                 for (var i = 0; i < split.length; i++) {
                     let word = split[i];
                     if (tagged.verbs.indexOf(word) > -1) {
                         phrase = phrase + word;
                         verbIndex = i;
                         break;
                     }
                 }

                 // Locate the first noun
                 if (phrase.length && verbIndex < split.length - 1) {
                     for (var j = verbIndex + 1; j < split.length; j++) {
                         let word = split[j];
                         if (tagged.nouns.indexOf(word) > -1) {
                             phrase = phrase + " " + word;
                             return phrase;
                         }
                     }
                 }
             }
             return label;
         }

         commandLabel() {
             var nodeTypes = ["handlerName", "handlerComments", "expressionComments", "expressionCalls", "elementLabels", "assignments"];
             var phraseTypes = ["imperativePhrases", "phrases", "verbs", "nouns", "other", "numbers"];
             for (var i = 0; i < nodeTypes.length; i++) {
                 for (var j = 0; j < phraseTypes.length; j++) {
                     let phraseType = phraseTypes[j];
                     var labelSet = this.command.LabelMetadata[nodeTypes[i]][phraseType];
                     for (var k = 0; k < labelSet.length; k++) {
                         let commandLabel = labelSet[k];
                         if (this._ui.Labels[commandLabel] == 1) {
                             if (phraseType == "imperativePhrases" || phraseType == "phrase") {
                                 commandLabel = this.generateCommandLabelFromPhrase(commandLabel);
                             }
                             let first = _.upperFirst(commandLabel);
                             return first;
                         }
                     }
                 }
             }

             if (!this.command.hasArguments()) {
                 var types = ["assignments", "expressionCalls", "expressionComments"];
                 var labelTypes = ["imperativePhrases", "phrases", "verbs", "nouns", "other", "numbers"];
                 for (var i = 0; i < types.length; i++) {
                     var type = this.command.LabelMetadata.conditionals[types[i]];
                     for (var j = 0; j < type.length; j++) {
                         var obj = type[j];
                         for (var k = 0; k < labelTypes.length; k++) {
                             let labelType = labelTypes[k];
                             var labelNode = obj[labelType];
                             for (var l = 0; l < labelNode.length; l++) {
                                 let commandLabel = labelNode[l];
                                 if (this._ui.Labels[commandLabel] == 1) {
                                     if (labelType == "imperativePhrases" || labelType == "phrases") {
                                         commandLabel = this.generateCommandLabelFromPhrase(commandLabel);
                                     }
                                     let first = _.upperFirst(commandLabel);
                                     return first;
                                 }
                             }
                         }
                     }
                 }
             }
             return this.firstImperativeLabel();
         }

         firstImperativeLabel() {
             var nodeTypes = ["handlerName", "handlerComments", "expressionComments", "expressionCalls", "elementLabels", "assignments"];
             var phraseTypes = ["imperativePhrases", "phrases", "verbs", "nouns", "other", "numbers"];
             for (var i = 0; i < nodeTypes.length; i++) {
                 for (var j = 0; j < phraseTypes.length; j++) {
                     var labelSet = this.command.LabelMetadata[nodeTypes[i]][phraseTypes[j]];
                     for (var k = 0; k < labelSet.length; k++) {
                         let first = _.upperFirst(labelSet[k]);
                         return first;
                     }
                 }
             }

             if (!this.command.hasArguments()) {
                 var types = ["assignments", "expressionCalls", "expressionComments"];
                 var labelTypes = ["imperativePhrases", "verbs", "nouns", "phrases", "other", "numbers"];
                 for (var i = 0; i < types.length; i++) {
                     var type = this.command.LabelMetadata.conditionals[types[i]];
                     for (var j = 0; j < type.length; j++) {
                         var obj = type[j];
                         for (var k = 0; k < labelTypes.length; k++) {
                             var labelNode = obj[labelTypes[k]];
                             for (var l = 0; l < labelNode.length; l++) {
                                 let first = _.upperFirst(labelNode[l]);
                                 return first;
                             }
                         }
                     }
                 }
             }
             return "";
         }

         firstArgument() {
             // Sort by the highest value of the first possible argument
             var argumentKeys = _.sortBy(Object.keys(this.command.ArgumentsMap), function (key) {
                 return key;
             });

             if (argumentKeys.length) {
                 return argumentKeys[0];
             }

             return "";
         }

         descriptionLabel() {
             let commandLabel = this.commandLabel();
             // Returns all of the label metadata after the first imperative label is found (description)
             var nodeTypes = ["handlerName", "handlerComments", "expressionComments", "expressionCalls", "elementLabels", "assignments"];
             var phraseTypes = ["imperativePhrases", "verbs", "nouns", "phrases", "other", "numbers"];
             var label = "";
             var labels = [];

             for (var i = 0; i < nodeTypes.length; i++) {
                 for (var j = 0; j < phraseTypes.length; j++) {
                     var labelSet = this.command.LabelMetadata[nodeTypes[i]][phraseTypes[j]];
                     for (var k = 0; k < labelSet.length; k++) {
                         let labelItem = _.upperFirst(labelSet[k]);
                         if (labels.indexOf(labelItem) < 0 && labelItem !== commandLabel) {
                             label = label + labelItem + ", ";
                             labels.push(labelItem);
                         }
                     }
                 }
             }

             if (!this.command.hasArguments()) {
                 var types = ["assignments", "expressionCalls", "expressionComments"];
                 var labelTypes = ["imperativePhrases", "verbs", "nouns", "phrases", "other", "numbers"];
                 for (var i = 0; i < types.length; i++) {
                     var type = this.command.LabelMetadata.conditionals[types[i]];
                     for (var j = 0; j < type.length; j++) {
                         var obj = type[j];
                         for (var k = 0; k < labelTypes.length; k++) {
                             var labelNode = obj[labelTypes[k]];
                             for (var l = 0; l < labelNode.length; l++) {
                                 let labelItem = _.upperFirst(labelNode[l]);
                                 if (labels.indexOf(labelItem) < 0 && labelItem !== commandLabel) {
                                     label = label + labelItem + ", ";
                                     labels.push(labelItem);
                                 }
                             }
                         }
                     }
                 }
             }

             return label.substring(0, label.length - 2);
         }

         hasLabel() {
             // Returns whether we were able to find any labeling metadata for the command
             let imp = this.commandLabel();
             let desc = this.descriptionLabel();
             let arg = this.firstArgument();
             let hasLabel = imp.length > 1 || desc.length > 1 || arg.length;
             return hasLabel;
         }
     };

     $action.CommandItem = CommandItem;
 })($action);