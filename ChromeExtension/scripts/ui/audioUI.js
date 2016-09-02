"use strict";
var $action = $action || {};
(function ($action) {
    class AudioUICommandItem extends $action.CommandItem {
        constructor(command) {
            super(command);
            this.init();
        }

        get DOM() {
            return this._domElement;
        };

        init() {
            // Initialize the UI for the CommandItem corresponding to each command
            this._tagName = this.Command.Element.tagName;
            var listItem = document.createElement("li");
            listItem.classList.add("genie-audio-ui-list-item");

            var commandLabelSpan = document.createElement("span");
            commandLabelSpan.classList.add("genie-audio-ui-list-item-command");

            var label = this.label().split(",");
            commandLabelSpan.textContent = label;

            listItem.appendChild(commandLabelSpan);

            // Command arguments (if there are any)
            var argumentsDiv = document.createElement("div");
            argumentsDiv.classList.add("genie-audio-ui-arguments");
            if (this.Command.ArgumentsMap) {
                var keys = Object.keys(this.Command.ArgumentsMap);
                for (var i = 0; i < keys.length; i++) {
                    var argDiv = document.createElement("div");
                    argDiv.classList.add("genie-audio-ui-arguments-item");
                    var argSpan = document.createElement("span");
                    argSpan.classList.add("genie-audio-ui-arguments-span");
                    argSpan.textContent = _.upperFirst(keys[i]) + ": ";
                    var valueSpan = document.createElement("span");
                    valueSpan.classList.add("genie-audio-ui-value-span");
                    valueSpan.textContent = this.Command.ArgumentsMap[keys[i]];
                    argDiv.appendChild(argSpan);
                    argDiv.appendChild(valueSpan);
                    argumentsDiv.appendChild(argDiv);
                }
            }

            listItem.appendChild(argumentsDiv);
            this._domElement = listItem;
        }
    };

    $action.AudioUICommandItem = AudioUICommandItem;

    class AudioUI extends $action.UI {
        constructor() {
            super();
            this.init();

            // Keep a map between the command labels and their execute() calls so that we can map audio commands to call commands
            this._audioCommands = {};
            this.Root = this.dialog;
        }

        init() {
            var dialog = document.createElement("div");
            $(dialog).attr("id", "genie-audio-ui");
            var list = document.createElement("ul");
            list.classList.add("genie-audio-ui-list");

            var label = document.createElement("div");
            label.classList.add("genie-audio-ui-header");


            dialog.appendChild(label);
            dialog.appendChild(list);
            $('html').append(dialog);

            this.dialog = dialog;
            this.list = list;
            this.label = label;

            this.label.textContent = "Speak a command... ";

            // Attach the sidebar to the span link
            /* $('body').sidr({
                side: 'right',
                name: 'genie-audio-ui-sidebar',
                displace: true,
                renaming: false
            });
*/
            // Canvas
            var canvas = document.createElement("canvas");
            canvas.classList.add("genie-audio-ui-input-canvas");
            this.canvas = canvas;
            this.canvas.style.display = "none";
        };

        findFinalResult(speechResults) {
            var highest;
            for (var i = 0; i < speechResults.length; i++) {
                if (speechResults[i].isFinal) {
                    for (var j = 0; j < speechResults[i].length; j++) {
                        let alternative = speechResults[i][j];
                        if (!highest) {
                            highest = alternative;
                        } else if (alternative.confidence > highest.confidence) {
                            highest = alternative;
                        }
                    }
                }
            }

            if (highest) {
                return highest;
            }

            // Otherwise return the result with the highest confidence value
            for (var i = 0; i < speechResults.length; i++) {
                for (var j = 0; j < speechResults[i].length; j++) {
                    let alternative = speechResults[i][j];
                    if (!highest) {
                        highest = alternative;
                    } else if (alternative.confidence > highest.confidence) {
                        highest = alternative;
                    }
                }
            }
            return highest;
        }

        drawGridAndGetInput(width, height, x, y) {
            var bw = width;
            var bh = height;
            var p = 10;

            var canvas = this.canvas;
            var context = canvas.getContext("2d");
            canvas.style.position = "absolute";
            canvas.style.left = x + "px";
            canvas.style.top = y + "px";

            function drawBoard() {
                for (var x = 0; x <= bw; x += 40) {
                    context.moveTo(0.5 + x + p, p);
                    context.lineTo(0.5 + x + p, bh + p);
                }


                for (var x = 0; x <= bh; x += 40) {
                    context.moveTo(p, 0.5 + x + p);
                    context.lineTo(bw + p, 0.5 + x + p);
                }

                context.strokeStyle = "black";
                context.stroke();
            }

            drawBoard();
        }

        mapResultsToCommand(speechResults, resultIndex) {
            // Speech results are are in the results property
            let result = this.findFinalResult(speechResults);
            // Result will have a set of SpeechRecognitionAlternative objects. Find the first one with > .90 confidence rate. 

            // Execute the command
            let commandText = result.transcript.trim().toLowerCase();
            console.log(commandText);

            // Find the commands corresponding execute() method in the commandsMap
            let command = this._audioCommands[commandText];
            if (command) {
                if (command.hasArguments()) {
                    if (command.RequiresMousePosition) {
                        var commandHeight = $(command.Element).outerHeight();
                        var commandWidth = $(command.Element).outerWidth();
                        var commandX = $(command.Element).offset().left;
                        var commandY = $(command.Element).offset().top;
                        var mousePosition = this.drawGridAndGetInput(commandHeight, commandWidth, commandX, commandY);
                        command.execute(commandText, mousePosition);
                    } else {
                        command.execute(commandText);
                    }
                }
            }

        }

        appendCommandGroup(label, commands) {
            if (label == "commands") { // Don't display any other types of commands (links, etc.)
                var group = document.createElement('li');
                group.classList.add('genie-audio-ui-group');

/*
                var menulabel = document.createElement('span');
                menulabel.classList.add('genie-audio-ui-group-label');

                var label = pluralize.plural(label);
                menulabel.textContent = label[0].toUpperCase() + label.substring(1, label.length);
                group.appendChild(menulabel);
*/

                var list = document.createElement('ul');
                list.classList.add('genie-audio-ui-list');

                // Groups
                var commandItems = [];
                for (var i = 0; i < commands.length; i++) {
                    var newCommand = new $action.AudioUICommandItem(commands[i]);
                    commands[i].CommandItem = newCommand;

                    if (!commands[i].userInvokeable()) {
                        newCommand.DOM.classList.add('genie-audio-ui-disabled');
                    }


                    // Command could have multiple arguments
                    if (commands[i].hasArguments()) {
                        var commandArgumentKeys = Object.keys(commands[i].ArgumentsMap);
                        for (var j = 0; j < commandArgumentKeys.length; j++) {
                            this._audioCommands[commandArgumentKeys[j]] = newCommand.Command;

                        }
                    } else {
                        let commandLabel = newCommand.label().toLowerCase();
                        this._audioCommands[commandLabel] = newCommand.Command;
                    }

                    commandItems.push(newCommand);
                }

                // Sort the list of commands alphabetically
                commandItems.sort(function (a, b) {
                    var nameA = a.firstImperativeLabel().toLowerCase(),
                        nameB = b.firstImperativeLabel().toLowerCase()
                    if (nameA < nameB) //sort string ascending
                        return -1
                    if (nameA > nameB)
                        return 1
                    return 0 //default return value (no sorting)
                })

                for (var i = 0; i < commandItems.length; i++) {
                    list.appendChild(commandItems[i].DOM);
                }

                group.appendChild(list);

                this.list.appendChild(group);
            }

            // Initialze speech recognition
            /*            this._recognition = new webkitSpeechRecognition();
                        this._recognition.continuous = true;
                        this._recognition.interimResults = true;
                        this._recognition.lang = "en-US";
                        var self = this;
                        this._recognition.onresult = function (event) {
                            self.mapResultsToCommand(event.results, event.resultIndex);
                        }
                        this._recognition.start();*/
        }

        /**
         * Remove a command from the dialog
         */
        removeCommand(command, commandCount) {
            var cmdItem = command.CommandItem;
            if (cmdItem && cmdItem.DOM) {
                this.list.removeChild(cmdItem.DOM);
            }
        }
    };

    $action.AudioUI = AudioUI;
})($action);