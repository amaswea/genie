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
                        this.createTooltip(commands[i], newCommand.label());
                    }

                    // How to handle when element has multiple commands? 

                }
            }
        }

        getTooltip(command) {
            var tooltipSelector = "[id='genie-help-ui-tooltip-" + command.ElementID + "']";
            var tooltip = $(tooltipSelector);
            if (tooltip.length) {
                return tooltip[0];
            }
        }

        createTooltip(command, label) {
            // Initialize the tooltip
            // Look for a tooltip already attached
            var existingTooltip = this.getTooltip(command);
            if (command.visible()) {
                if (!existingTooltip) {
                    var tooltip = document.createElement("div");
                    tooltip.setAttribute("id", "genie-help-ui-tooltip-" + command.ElementID);
                    tooltip.classList.add("genie-help-ui-tooltip");

                    var header = document.createElement("span");
                    header.textContent = label;
                    tooltip.appendChild(header);
                    header.classList.add("genie-help-ui-tooltip-header");

                    var purpose = document.createElement("span");
                    purpose.textContent = "This command does ... ";
                    tooltip.appendChild(purpose);

                    $('html').append(tooltip);

                    $(command.Element).qtip({
                        content: {
                            text: $("#genie-help-ui-tooltip-" + command.ElementID)
                        },
                        position: {
                            my: 'top left',
                            at: 'top left',
                            target: $(command.ElementSelector), 
                            adjust: {
                                method: 'shift shift'
                            }
                        },
                        show: {
                            target: $("body"),
                            ready: true
                        },
                        style: {
                            tip: {
                                corner: true
                            }
                        }
                    });
                } else {
                    var header = document.createElement("span");
                    header.textContent = label;
                    existingTooltip.appendChild(header);
                    header.classList.add("genie-help-ui-tooltip-header");

                    var purpose = document.createElement("span");
                    purpose.textContent = "This command does ... ";
                    existingTooltip.appendChild(purpose);
                }
            }
        }
    };

    $action.HelpUI = HelpUI;
})($action);