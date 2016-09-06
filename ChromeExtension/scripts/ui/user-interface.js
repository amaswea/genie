 "use strict";
 var $action = $action || {};
 (function ($action) {
     // Interface for UIs
     class UI {
         constructor() {
             this._organizer = this.OrganizationTypes.Type;
             this.initCanvas();
             this._cellCoordinates = {};
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

         set Root(rootUI) {
             this._rootUI = rootUI;
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

         perform(argument) {
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
             var phraseTypes = ["phrases", "imperativePhrases", "nouns", "verbs", "other"];
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

         firstImperativeLabel() {
             var nodeTypes = ["handlerName", "handlerComments", "expressionComments", "expressionCalls", "elementLabels", "assignments"];
             var phraseTypes = ["imperativePhrases", "verbs", "nouns", "phrases", "other"];
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
                 var labelTypes = ["imperativePhrases", "verbs", "nouns", "phrases", "other"];
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

         descriptionLabel() {
             // Returns all of the label metadata after the first imperative label is found (description)
             var nodeTypes = ["handlerName", "handlerComments", "expressionComments", "expressionCalls", "elementLabels", "assignments"];
             var phraseTypes = ["imperativePhrases", "verbs", "nouns", "phrases", "other"];
             var foundOne = false;
             var label = "";
             var labels = [];

             for (var i = 0; i < nodeTypes.length; i++) {
                 for (var j = 0; j < phraseTypes.length; j++) {
                     var labelSet = this.command.LabelMetadata[nodeTypes[i]][phraseTypes[j]];
                     for (var k = 0; k < labelSet.length; k++) {
                         if (foundOne && labels.indexOf(labelSet[k]) < 0) {
                             label = label + _.upperFirst(labelSet[k]) + ", ";
                             labels.push(labelSet[k]);
                         }
                         foundOne = true;
                     }
                 }
             }

             if (!this.command.hasArguments()) {
                 var types = ["assignments", "expressionCalls", "expressionComments"];
                 var labelTypes = ["imperativePhrases", "verbs", "nouns", "phrases", "other"];
                 for (var i = 0; i < types.length; i++) {
                     var type = this.command.LabelMetadata.conditionals[types[i]];
                     for (var j = 0; j < type.length; j++) {
                         var obj = type[j];
                         for (var k = 0; k < labelTypes.length; k++) {
                             var labelNode = obj[labelTypes[k]];
                             for (var l = 0; l < labelNode.length; l++) {
                                 if (foundOne && labels.indexOf(labelNode[l]) < 0) {
                                     label = label + labelNode[l] + ", ";
                                     labels.push(labelNode[l]);
                                 }
                                 foundOne = true;
                             }
                         }
                     }
                 }
             }

             return label.substring(0, label.length - 2);
         }
     };

     $action.CommandItem = CommandItem;
 })($action);