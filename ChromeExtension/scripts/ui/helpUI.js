"use strict";
var $action = $action || {};
(function ($action) {
    class HelpUI extends $action.UI {
        constructor() {
            // Keep a map between the command labels and their execute() calls so that we can map audio commands to call commands
            super();
            this.init();
            this._tooltips = {};
            this._positions = ["bottom left", "bottom right", "top right", "top left"];
        }

        init() {

        };
        
        show() {}
        
        hide() {}

        appendCommandGroup(label, commands) {
            for (var i = 0; i < commands.length; i++) {
                var newCommand = new $action.CommandItem(commands[i]);
                commands[i].CommandItem = newCommand;

                // When a command gets added, add a glowing border around the command element
                var commandElement = commands[i].Element;

                if (commandElement instanceof Window || commandElement instanceof Document) {
                    commandElement = document.body;
                }

                // Attach a tooltip to the command
                // Look for a tooltip already
                var tooltipSelector = "#genie-help-ui-tooltip-" + commands[i].ElementID;
                var tooltip = $(tooltipSelector);
                if (tooltip.length) {
                    // Update the text
                } else {
                    this.createTooltip(commands[i], newCommand.firstImperativeLabel(), newCommand.descriptionLabel());
                }

                // How to handle when element has multiple commands? 
            }
        }

        getTooltip(command) {
            return this._tooltips[command.ElementID];
        }

        arguments(argumentsMap) {
            var keys = Object.keys(argumentsMap);
            var argString = "";
            for (var i = 0; i < keys.length; i++) {
                argString = argString + keys[i] + ": " + argumentsMap[keys[i]];
                if (i < keys.length - 1) {
                    argString = argString + ",";
                }
            }

            return argString;
        }
        
        getRandomPosition(){
            var randomNumber = Math.floor(Math.random() * 4);
            return this._positions[randomNumber];
        }

        createTooltip(command, commandLabel, description) {
            // Initialize the tooltip
            // Look for a tooltip already attached
            var existingTooltip = this.getTooltip(command);
            if (!existingTooltip) {
                var $element = $(command.Element);
                
                var tooltip = new Opentip($element, {
                    background: '#f5f5f5',
                    borderColor: '#f5f5f5',
                    showOn: null,
                    target: $element,
                    tipJoint: "bottom left",
                    hideTriggers: [],
                    className: "genie-help-ui-tooltip",
                    removeElementsOnHide: true
                });

                var labelSpan = document.createElement("span");
                labelSpan.classList.add("genie-help-ui-tooltip-label");
                labelSpan.textContent = commandLabel + ": ";

                var descriptionSpan = document.createElement("span");
                descriptionSpan.classList.add("genie-help-ui-tooltip-description");
                descriptionSpan.textContent = description;

                var commandArguments = this.arguments(command.ArgumentsMap);
                if (commandArguments && commandArguments.length) {
                    descriptionSpan.textContent = descriptionSpan.textContent + ", " + commandArguments;
                }
                
                var tooltipContainer = document.createElement('div');
                tooltipContainer.classList.add("genie-help-ui-tooltip-container");
                tooltipContainer.appendChild(labelSpan);
                tooltipContainer.appendChild(descriptionSpan);
                tooltip.setContent(tooltipContainer);
                tooltip.show();
                // tooltip.setAttribute("id", "genie-help-ui-tooltip-" + command.ElementID);
                // tooltip.classList.add("genie-help-ui-tooltip");
                this._tooltips[command.ElementID] = tooltip;
            }
        }
    };

    $action.HelpUI = HelpUI;
})($action);