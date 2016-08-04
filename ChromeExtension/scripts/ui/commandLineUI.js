"use strict";
var $action = $action || {};
(function ($action) {
    class CommandLineUI extends $action.UI {
        constructor() {
            // Keep a map between the command labels and their execute() calls so that we can map audio commands to call commands
            super();
            this._commandsMap = {};
            this.init();
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
            this._textarea.value = this._textarea.value + "Type commands to see the list of available commands...";

            $('html').append(commandLine);

            this.hide();
            $(window).scroll(_.throttle(this.repositionCommandLineArea, 1));
            this.repositionCommandLineArea();
        };

        appendCommandGroup(label, commands) {
            // Groups
            for (var i = 0; i < commands.length; i++) {
                var newCommand = new $action.CommandItem(commands[i]);
                commands[i].CommandItem = newCommand;

                /*                if (!commands[i].userInvokeable()) {
                                    newCommand.DOM.classList.add('genie-audio-ui-disabled');
                                }*/

                let commandLabel = newCommand.label().toLowerCase();
                this._commandsMap[commandLabel] = newCommand.Command;
            }
        }

        attachListeners(element) {
            var self = this;
            element.addEventListener("keypress", function handlerInput(evt) {
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
            }, null, false, true);
        }

        repositionCommandLineArea() {
            var commandLine = $('#genie-command-line-ui');

            var scrollTop = $(window).scrollTop();
            var top = $(window).height() + scrollTop - commandLine.height() - 20;
            commandLine[0].style.top = top + "px";
        };

        mapTextToCommand(text) {
            if (text == "commands") {
                var commandLabels = Object.keys(this._commandsMap);
                var labelString = "";
                for (var i = 0; i < commandLabels.length; i++) {
                    labelString = labelString + commandLabels[i];
                    if (i < commandLabels.length - 1) {
                        labelString = labelString + ",";
                    }
                }
                this._textarea.value = this._textarea.value + "\n" + labelString; 
            } else {
                // Find the commands corresponding execute() method in the commandsMap
                let command = this._commandsMap[text];
                if (command) {
                    // Call the execute method to perform the command
                    command.execute();
                } else {
                    // No command found
                    this._textarea.value = this._textarea.value + "\nSorry. No command found.";
                }
            }
        }
    };

    $action.CommandLineUI = CommandLineUI;
})($action);