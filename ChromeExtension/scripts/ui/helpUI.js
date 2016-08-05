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
                        this.createTooltip(commandElement, commands[i].ElementID);
                    }

                    // How to handle when element has multiple commands? 

                }
            }
        }

        createTooltip(element, id) {
            // Initialize the tooltip
            // Look for a tooltip already attached
            var tooltip = document.createElement("div");
            tooltip.setAttribute("id", "genie-help-ui-tooltip-" + id);
            tooltip.textContent = "This is what this command does";
            $('html').append(tooltip);
            
            $("body").qtip({
                overwrite: false, 
                content: {
                    text: $("#genie-help-ui-tooltip-" + id)
                }, 
                position: {
                    my: 'top left', 
                    at: 'center', 
                    target: $("#genie-help-ui-tooltip-" + id)
                }
            });
        }
    };

    $action.HelpUI = HelpUI;
})($action);