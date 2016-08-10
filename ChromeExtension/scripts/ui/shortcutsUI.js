"use strict";
var $action = $action || {};
(function ($action) {
    class ShortcutsUI extends $action.UI {
        constructor() {
            // Keep a map between the command labels and their execute() calls so that we can map audio commands to call commands
            super();
            this.init();
        }

        init() {

        };

        hide() {
            // Remove all of the tooltips
        }

        show() {
                // Show all of the tooltips
            } // Override show and hide methods to do nothing since this help interface has no special UI. 

        appendCommandGroup(label, commands) {
            for (var i = 0; i < commands.length; i++) {
                var newCommand = new $action.CommandItem(commands[i]);
                commands[i].CommandItem = newCommand;

                // When a command gets added, add a glowing border around the command element
                var commandElement = commands[i].Element;
                if (!(commandElement instanceof Window) && !(commandElement instanceof Document)) { // TODO: make this generic
                    // Attach a tooltip to the command
                    // Look for a tooltip already
                    var tooltipSelector = "#genie-help-ui-tooltip-" + commands[i].ElementID;
                    var tooltip = $(tooltipSelector);
                    if (tooltip.length) {
                        // Update the text
                    } else {
                        this.createTooltip(commands[i], newCommand.label());
                    }

                    // How to handle when element has multiple commands? 

                }
            }
        }
    };

    $action.ShortcutsUI = ShortcutsUI;
})($action);