"use strict";
var $genie = $genie || {};
(function ($genie) {
    class CommandLineUI extends $genie.UI {
        constructor() {
            // Keep a map between the command labels and their execute() calls so that we can map audio commands to call commands
            super();
            this._commandsMap = {};
            this._init = false;
            this.RootViewModel = function(params) {
                var self = this; 
                ko.components.register("dialog", {
                    viewModel: function(params) {
                        self.childCommands = ko.observableArray([]);
                        self.label = ko.observable('');
                    },
                    template: { require: 'audio-dialog.html'}
                }); 
            };
            this.init();
            this._macros = {};
        }

        init() {
            ko.applyBindings();
            this.label("Enter a command.");
            this.attachListeners(textarea);
            this.appendResponse("Type commands to see the list of available commands...\n");
            $(window).scroll(_.throttle(this.repositionCommandLineArea, 1));
        };

        sortCommands(label, commandItems) {
            for (var i = 0; i < commandItems.length; i++) {
                if (commandItems[i].Command.hasArguments()) {
                    var commandArgumentKeys = Object.keys(commandItems[i].Command.ArgumentsMap);
                    for (var j = 0; j < commandArgumentKeys.length; j++) {
                        this._commandsMap[commandArgumentKeys[j]] = commandItems[i];
                    }
                } else {
                    let commandLabel = commandItems[i].commandLabel().toLowerCase();
                    if (commandLabel.length) {
                        this._commandsMap[commandLabel] = commandItems[i];
                    }
                }
            }
        }

        /** 
         * Attach event listeners to listen for commands in the command line area 
         */
        attachListeners(element) {
            var self = this;
            element.addEventListener("keydown", function handlerInput(evt) {
                var keyCode = evt.keyCode || evt.which;
                if (keyCode == '13') {
                    // Get the text entered on the previous line of the text area to use as the command
                    var walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
                    var node = walker.nextNode();
                    var lastNode;
                    while (node) {
                        lastNode = node;
                        node = walker.nextNode();
                    }

                    if (lastNode && lastNode.textContent.length) {
                        var lastCommand = lastNode.textContent.trim();
                        if (lastCommand && lastCommand.length) {
                            self.mapTextToCommand(lastCommand.toLowerCase());
                        }
                    }
                }
                evt.stopPropagation();
            }, null, false, true);
        }

        repositionCommandLineArea() {
            var commandLine = $('#genie-command-line-ui');
            var scrollTop = $(window).scrollTop();
            var top = $(window).height() + scrollTop - commandLine.height() - 20;
            commandLine[0].style.top = top + "px";
        };

        mapTextToCommand(text) {
            var hasEqual = text.split("=");
            if (text == "commands") {
                var commandLabels = Object.keys(this._commandsMap);
                var labelString = "";
                for (var i = 0; i < commandLabels.length; i++) {
                    if (this._commandsMap[commandLabels[i]].Command.IsEnabled) {
                        labelString = labelString + commandLabels[i] + ", ";
                    }
                }

                if (labelString.length) {
                    labelString = labelString.substring(0, labelString.length - 2);
                }
                this.appendResponse(labelString);
            } else if (text == "help") {
                var commandKeys = Object.keys(this._commandsMap);
                let text = "";
                for (var i = 0; i < commandKeys.length; i++) {
                    let commandItem = this._commandsMap[commandKeys[i]];
                    let key = commandKeys[i] + ": ";
                    let text = "";
                    if (commandItem.label().length) {
                        text = text + commandItem.descriptionLabel();
                    } else {
                        text = text + commandItem.Command.ArgumentsMap[commandKeys[i]];
                    }
                    this.appendResponse(text, false, key);
                }
            } else if (text.split("=").length == 2) {
                // Define a macro
                var split = text.split("=");
                var macroName = split[0].trim().toLowerCase();
                var commands = split[1].trim().split(",");
                this._macros[macroName] = commands;
                this.appendResponse("Macro saved.");
            } else {
                // Find the commands corresponding execute() method in the commandsMap
                text = text.toLowerCase().split(" ");
                if (text.length == 1) {
                    let commandItem = this._commandsMap[text[0]];
                    let macro = this._macros[text[0]];
                    if (commandItem) {
                        // TODO: Commands that require input
                        commandItem.perform(text[0]);
                    } else if (macro) {
                        for (var i = 0; i < macro.length; i++) {
                            // Execute each command listed in the macro
                            // Parse out input strings
                            var split = macro[i].replace(/'/g, "").replace(/"/g, "").split(":");
                            let macroCommand = macro[i];
                            let input = "";
                            let argument = "";
                            if (split.length == 2) { // TODO: Fix parsing later
                                argument = split[0];
                                macroCommand = this._commandsMap[argument];
                                input = split[1];
                            } else if (split.length == 1) {
                                argument = split[0];
                                macroCommand = this._commandsMap[argument];
                            }

                            if (macroCommand) {
                                macroCommand.perform(argument, input);
                            }
                        }
                    } else {
                        // No command found
                        this.appendResponse("Sorry. No command found.");
                    }
                }
            }
        }

        appendResponse(text, lineBreak = true, key = "") {
            // TODO: Create template
            let response = document.createElement('div');
            response.classList.add("genie-command-line-ui-response");

            if (!key.length) {
                response.textContent = text;
            } else {
                let keySpan = document.createElement("span");
                keySpan.classList.add("genie-command-line-ui-response-key");
                keySpan.textContent = key;
                let descSpan = document.createElement("span");
                descSpan.textContent = text;
                response.appendChild(keySpan);
                response.appendChild(descSpan);
            }
            
            this._textarea.appendChild(response);

            if (lineBreak) {
                let lineBreak = document.createElement('br');
                this._textarea.appendChild(lineBreak);
            }
        }
    };

    $genie.CommandLineUI = CommandLineUI;
})($genie);