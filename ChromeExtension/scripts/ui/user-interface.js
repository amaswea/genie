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

         updateCommandState(state) {}
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
             // Constructs a desired label for the command based on the command metadata available
             var labelString = "";
             // If the command has an imperative label, return it. 
             if (this.command.ImperativeLabels.length) {
                 labelString = labelString + this.command.ImperativeLabels[0];
             }

             // Otherwise, return the first text node found
             else if (this.command.Labels.length) {
                 var tagName = this._tagName;
                 // Return the first text node lable
                 labelString = labelString + this.command.Labels[0];
             }

             return labelString;
         }
     };

     $action.CommandItem = CommandItem;
 })($action);