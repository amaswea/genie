"use strict";
var $action = $action || {};
(function ($action) {
    class CommandLineUI extends $action.UI {
        constructor() {
            // Keep a map between the command labels and their execute() calls so that we can map audio commands to call commands
            super();
            this._commandsMap = {};
            this.init();
            this._macros = {};
        }

        init() {
            var commandLine = document.createElement("div");
            $(commandLine).attr("id", "genie-command-line-ui");
            var label = document.createElement("div");
            label.classList.add("genie-command-line-label");
            label.textContent = "Enter a command.";

            var textarea = document.createElement("textarea");
            textarea.classList.add("genie-command-line-text");
            textarea.classList.add("genie-ui-component")
            commandLine.appendChild(label);
            commandLine.appendChild(textarea);
            this.Root = commandLine;
            this._textarea = textarea;
            this.attachListeners(textarea);
            this._textarea.value = this._textarea.value + "Type commands to see the list of available commands...\n";

            $('html').append(commandLine);

            this.hide();
            $(window).scroll(_.throttle(this.repositionCommandLineArea, 1));

            // Canvas
            var canvas = document.createElement("canvas");
            canvas.classList.add("genie-audio-ui-input-canvas");
            $('html').append(canvas);
            this.canvas = canvas;
            this.canvas.style.display = "none";
        };

        appendCommandGroup(label, commands) {
            // Groups
            for (var i = 0; i < commands.length; i++) {
                var newCommand = new $action.CommandItem(commands[i]);
                commands[i].CommandItem = newCommand;

                /*                if (!commands[i].userInvokeable()) {
                                    newCommand.DOM.classList.add('genie-audio-ui-disabled');
                                }*/

                if (commands[i].hasArguments()) {
                    var commandArgumentKeys = Object.keys(commands[i].ArgumentsMap);
                    for (var j = 0; j < commandArgumentKeys.length; j++) {
                        this._commandsMap[commandArgumentKeys[j]] = newCommand;

                    }
                } else {
                    let commandLabel = newCommand.firstImperativeLabel().toLowerCase();
                    this._commandsMap[commandLabel] = newCommand;
                }
            }
        }

        attachListeners(element) {
            var self = this;
            element.addEventListener("keydown", function handlerInput(evt) {
                var keyCode = evt.keyCode || evt.which;
                if (keyCode == '13') {
                    // Get the text entered on the previous line of the text area to use as the command
                    var textAreaValue = element.value.split(/\n/);
                    if (textAreaValue && textAreaValue.length) {
                        var lastCommand = _(textAreaValue).last().trim();
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

        calculateMousePosition(column, width, height, x, y) {
            var mousePosition = x;
            var lineWidth = 20;
            mousePosition = mousePosition + column * lineWidth + 10;
            console.log(mousePosition);
            return mousePosition;
        }

        mapTextToCommand(text) {
            var hasEqual = text.split("=");
            if (text == "commands") {
                var commandLabels = Object.keys(this._commandsMap);
                var labelString = "";
                for (var i = 0; i < commandLabels.length; i++) {
                    if (this._commandsMap[commandLabels[i]].Command.IsEnabled) {
                        labelString = labelString + commandLabels[i];
                        if (i < commandLabels.length - 1) {
                            labelString = labelString + ",";
                        }
                    }
                }
                this._textarea.value = this._textarea.value + "\n" + labelString;
            } else if (text == "help") {
                var commandKeys = Object.keys(this._commandsMap);
                for (var i = 0; i < commandKeys.length; i++) {
                    let commandItem = this._commandsMap[commandKeys[i]];
                    this._textarea.value = this._textarea.value + "\n" + commandKeys[i] + ": ";
                    if (commandItem.label().length) {
                        this._textarea.value = this._textarea.value + commandItem.label();
                    } else {
                        this._textarea.value = this._textarea.value + commandItem.Command.ArgumentsMap[commandKeys[i]];
                    }
                }
            } else if (text.split("=").length == 2) {
                // Define a macro
                var split = text.split("=");
                var commandName = split[0].trim().toLowerCase();
                var commands = split[1].trim().split(",");
                this._macros[commandName] = commands;
                this._textarea.value = this._textarea.value + "\n" + "Macro saved.";
            } else {
                // Find the commands corresponding execute() method in the commandsMap
                text = text.toLowerCase().split(" ");
                if (text.length > 2) {
                    let commandItem = this._commandsMap[text[0]];
                    let macro = this._macros[text];
                    if (commandItem) {
                        commandItem.perform(text);
                    } else if (macro) {
                        for (var i = 0; i < macro.length; i++) {
                            // Execute each command listed in the macro
                            var macroCommand = this._commandsMap[macro[i]];
                            if (macroCommand) {
                                macroCommand.perform(macro[i]);
                            }
                        }
                    } else {
                        // No command found
                        this._textarea.value = this._textarea.value + "\nSorry. No command found.";
                    }
                }
            }
        }
    };

    $action.CommandLineUI = CommandLineUI;
})($action);