"use strict";
var $action = $action || {};
(function ($action) {
    class HelpUI extends $action.UI {
        constructor() {
            // Keep a map between the command labels and their execute() calls so that we can map audio commands to call commands
            super();
            this.init();
        }

        init() {

        };

        hide() {}

        show() {} // Override show and hide methods to do nothing since this help interface has no special UI. 

        appendCommandGroup(label, commands) {
            for (var i = 0; i < commands.length; i++) {
                var newCommand = new $action.CommandItem(commands[i]);
                commands[i].CommandItem = newCommand;

                // When a command gets added, add a glowing border around the command element
                var commandElement = commands[i].Element;
                if (!(commandElement instanceof Window) && !(commandElement instanceof Document)) { // TODO: make this generic
                   // Attach a tooltip to the command
                }
            }
        }
    };

    $action.HelpUI = HelpUI;
})($action);