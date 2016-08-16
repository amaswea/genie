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

         remove() {}

         appendCommand(dom, commandCount) {}

         removeCommand(dom, commandCount) {}

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
             var completeLabel = "";
             // Constructs a desired label for the command based on the command metadata available
             var nodeTypes = ["elementLabels", "handlerComments", "expressionComments", "expressionCalls", "assignments"];
             var phraseTypes = ["phrases", "imperativePhrases", "nouns", "verbs"];
             for (var i = 0; i < nodeTypes.length; i++) {
                 for (var j = 0; j < phraseTypes.length; j++) {
                     var labelSet = this.command.LabelMetadata[nodeTypes[i]][phraseTypes[j]];
                     for (var k = 0; k < labelSet.length; k++) {
                         completeLabel = completeLabel + labelSet[k] + ", ";
                     }
                 }
             }

             return completeLabel.substring(0, completeLabel.length - 2);
         }
     };

     $action.CommandItem = CommandItem;
 })($action);