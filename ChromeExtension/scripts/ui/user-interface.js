 "use strict";
 var $action = $action || {};
 (function ($action) {
     // Interface for UIs
     class UI {
         constructor() {
             this._organizer = this.OrganizationTypes.Type;
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

         init() {}

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
     }

     $action.UI = UI;

     class CommandItem {
         constructor(command) {
             this.command = command;
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
             var nodeTypes = ["handlerName", "handlerComments", "expressionComments", "expressionCalls", "elementLabels","assignments"];
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
             var nodeTypes = ["handlerName", "handlerComments", "expressionComments", "expressionCalls", "elementLabels","assignments"];
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