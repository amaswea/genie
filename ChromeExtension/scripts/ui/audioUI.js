"use strict";
var $action = $action || {};
(function ($action) {
    class AudioUICommandItem extends $action.CommandItem {
        constructor(command, ui, id) {
            super(command, ui);
            this._id = id;
            this._init = false;
        }

        get DOM() {
            if (!this._init) {
                this.init();
                this._init = true;
            }
            return this._domElement;
        };

        init() {
            // Initialize the UI for the CommandItem corresponding to each command
            this._tagName = this.Command.Element.tagName;
            var listItem = document.createElement("li");
            listItem.classList.add("genie-audio-ui-command");

            var commandLabels = document.createElement("div");
            commandLabels.classList.add("genie-audio-ui-label");

            var label = this.commandLabel();
            var description = this.descriptionLabel();
            var labelSpan = document.createElement("span");
            labelSpan.classList.add("genie-audio-ui-label-text");
            var descriptionSpan = document.createElement("span");
            descriptionSpan.classList.add("genie-audio-ui-label-description");

            if (label.length) {
                labelSpan.textContent = label;
                commandLabels.appendChild(labelSpan);
                listItem.appendChild(commandLabels);
            }

            if (description.length) {
                descriptionSpan.textContent = description;
                commandLabels.appendChild(descriptionSpan);
            }

            if (label.length && description.length) {
                labelSpan.textContent = labelSpan.textContent + ": ";
            }

            // Command arguments (if there are any)
            var argumentKeys = _.sortBy(Object.keys(this.Command.ArgumentsMap), function (key) {
                return key;
            });

            if (argumentKeys.length) {
                var argumentsDiv = document.createElement("div");
                argumentsDiv.classList.add("genie-audio-ui-arguments");
                for (var i = 0; i < argumentKeys.length; i++) {
                    var argDiv = document.createElement("div");
                    argDiv.classList.add("genie-audio-ui-arguments-item");
                    var argSpan = document.createElement("span");
                    argSpan.classList.add("genie-audio-ui-arguments-span");
                    argSpan.textContent = _.upperFirst(argumentKeys[i]) + ": ";
                    var valueSpan = document.createElement("span");
                    valueSpan.classList.add("genie-audio-ui-value-span");
                    valueSpan.textContent = this.Command.ArgumentsMap[argumentKeys[i]];
                    argDiv.appendChild(argSpan);
                    argDiv.appendChild(valueSpan);
                    argumentsDiv.appendChild(argDiv);
                }
                listItem.appendChild(argumentsDiv);
            }

            if (!this.hasLabel()) {
                // No label meta could be found.  Give the command an auto-generated name
                labelSpan.textContent = "Command " + this._id + ": ";
                descriptionSpan.textContent = "Auto-generated command label.";
                commandLabels.appendChild(labelSpan);
                commandLabels.appendChild(descriptionSpan);
                listItem.appendChild(commandLabels);
            }

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
            this._speechResults = {};
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

        findLikeliestResult(speechResults) {
            // TODO: Figure out why previous results are not cleared when the next one is sent
            // Otherwise return the result with the highest confidence value
            var highest;
            for (var i = 0; i < speechResults.length; i++) {
                for (var j = 0; j < speechResults[i].length; j++) {
                    let alternative = speechResults[i][j];
                    console.log(alternative.transcript);
                    if (!this._speechResults[alternative.confidence]) {
                        if (!highest) {
                            highest = alternative;
                        } else if (alternative.confidence > highest.confidence) {
                            highest = alternative;
                        }
                    }
                }
            }

            if (!highest && speechResults.length && speechResults[0].length) {
                highest = this._speechResults[0][0];
            }

            this._speechResults[highest.confidence] = highest.transcript;
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
            let result = this.findLikeliestResult(speechResults);
            // Result will have a set of SpeechRecognitionAlternative objects. Find the first one with > .90 confidence rate. 

            // Execute the command
            if (result) {
                console.log(result.transcript);
                let commandText = result.transcript.trim().toLowerCase();
                if(commandText == "paws"){
                    commandText = "pause";
                }
                
                // Find the commands corresponding execute() method in the commandsMap
                let command = this._audioCommands[commandText];
                if (command) {
                    console.log("performing " + commandText);
                    command.perform(commandText);
                }
            }
        }

        createCommands(label, commands) {
            if (label == "commands") { // Don't display any other types of commands (links, etc.)
                var commandItems = [];
                for (var i = 0; i < commands.length; i++) {
                    var newCommand = new $action.AudioUICommandItem(commands[i], this, i);
                    commands[i].CommandItem = newCommand;
                    commandItems.push(newCommand);
                }
                return commandItems;
            }
        }

        /**
         * Sort the commands according to the desired sorting strategy, and append the commands into the container 
         * @private
         * @property undefined
         */
        appendCommands(label, commandItems) {
            if (label == "commands") { // Don't display any other types of commands (links, etc.)
                var group = document.createElement('li');
                group.classList.add('genie-audio-ui-group');

                var list = document.createElement('ul');
                list.classList.add('genie-audio-ui-list');

                var unlabeledContainer = document.createElement('li');
                unlabeledContainer.classList.add('genie-audio-ui-unlabeled');
                var unlabeledSpan = document.createElement("span");
                unlabeledContainer.appendChild(unlabeledSpan);
                var unlabeled = document.createElement('ul');
                unlabeledContainer.appendChild(unlabeled);

                unlabeledContainer.addEventListener("click", function () {
                    if (unlabeled.style.display == "block" || unlabeled.style.display == "") {
                        unlabeled.style.display = "none";
                        unlabeledContainer.classList.remove("expanded");
                    } else {
                        unlabeled.style.display = "block";
                        unlabeledContainer.classList.add("expanded");
                    }
                });

                // Sort the list of commands alphabetically
                commandItems.sort(function (a, b) {
                    var nameA = a.commandLabel().toLowerCase(),
                        nameB = b.commandLabel().toLowerCase();
                    nameA = nameA.length ? nameA : (a.command.hasArguments() ? a.firstArgument() : "");
                    nameB = nameB.length ? nameB : (b.command.hasArguments() ? b.firstArgument() : "");
                    let enabledA = a.command.IsEnabled;
                    let enabledB = b.command.IsEnabled;
                    if (enabledA && !enabledB) {
                        return -1;
                    }

                    if (!enabledA && enabledB) {
                        return 1;
                    }

                    if (!nameA.length && !nameB.length) {
                        return -1;
                    }

                    if (!nameA.length && nameB.length) {
                        return 1;
                    }

                    if (nameA.length && !nameB.length) {
                        return -1;
                    }

                    if (nameA < nameB) //sort string ascending
                        return -1
                    if (nameA > nameB)
                        return 1
                    return 0 //default return value (no sorting)
                });

                var unlabeledCounter = 0;
                for (var i = 0; i < commandItems.length; i++) {
                    this.createAudioMapEntry(commandItems[i]);
                    if (commandItems[i].hasLabel()) {
                        list.appendChild(commandItems[i].DOM);
                    } else {
                        unlabeledCounter++;
                        unlabeled.appendChild(commandItems[i].DOM);
                    }
                }

                if (unlabeledCounter) {
                    unlabeledSpan.textContent = unlabeledCounter + " more commands... ";
                    list.appendChild(unlabeledContainer);
                }

                group.appendChild(list);

                this.list.appendChild(group);
            }

            // Initialze speech recognition
            if (!this._recognition) {
                this._recognition = new webkitSpeechRecognition();
                this._recognition.continuous = true;
                this._recognition.interimResults = false;
                this._recognition.lang = "en-US";
                var self = this;
                this._recognition.onresult = function (event) {
                    self.mapResultsToCommand(event.results, event.resultIndex);
                }
                this._recognition.start();
            }
        }

        createAudioMapEntry(commandItem) {
            // Command could have multiple arguments
            // Create a map that we can use later between the audio commands and the command objects. 
            if (commandItem.Command.hasArguments()) {
                var commandArgumentKeys = Object.keys(commandItem.Command.ArgumentsMap);
                for (var j = 0; j < commandArgumentKeys.length; j++) {
                    this._audioCommands[commandArgumentKeys[j]] = commandItem;
                }
            } else {
                let commandLabel = commandItem.commandLabel().toLowerCase();
                this._audioCommands[commandLabel] = commandItem;
            }
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

        removeCommands() {
            var list = this.list;
            while (list.firstChild) {
                list.removeChild(list.firstChild);
            }
        }
    };

    $action.AudioUI = AudioUI;
})($action);