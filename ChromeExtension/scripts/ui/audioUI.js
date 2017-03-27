"use strict";
var $genie = $genie || {};
(function ($genie) {
    class ArgumentCommandItem {
        constructor(){
            this.RootViewModel = function(params) {
                var self = this; 
                ko.components.register("argumentItem", {
                    viewModel: function(params) {
                        self.argument = ko.observable('');
                        self.value = ko.observable('');
                    },
                    template: { require: 'audio-command-item.html'}
                }); 
            };
        }
        init() {
            ko.applyBindings(new this.RootViewModel())
        }
    }

    class AudioUICommandItem extends $genie.CommandItem {
        constructor(command, ui, id) {
            super(command, ui);
            this._id = id;
            this._init = false;
            this.RootViewModel = function(params) {
                var self = this; 
                ko.components.register("commandItem", {
                    viewModel: function(params) {
                        self.arguments = ko.observableArray([]);
                        self.label = ko.observable('');
                        self.description = ko.observable('');
                        self.isEnabled = ko.observable(true);
                        self.isVisible = ko.observable(false);
                    },
                    template: { require: 'audio-command-item.html'}
                }); 
            };

        }

        init() {
            ko.applyBindings(new this.RootViewModel())

            // Initialize the UI for the CommandItem corresponding to each command
            this._tagName = this.Command.Element.tagName;
            this.label(this.commandLabel())
            this.description(this.descriptionLabel())

            // Command arguments (if there are any)
            var argumentKeys = _.sortBy(Object.keys(this.Command.ArgumentsMap), function (key) {
                return key;
            });

            if (argumentKeys.length) {
                for (var i = 0; i < argumentKeys.length; i++) {
                    let argumentObj = new ArgumentCommandItem().RootViewModel(); 
                    argumentObj.argument(argumentKeys[i]); 
                    argumentObj.value(this.Command.ArgumentsMap[argumentKeys[i]])
                    self.arguments.add(argumentObj);
                }
            }

            if (!this.hasLabel()) {
                // No label meta could be found.  Give the command an auto-generated name
                this.label("Command " + this._id + ": ");
                this.description("Auto-generated command label.");
            }

        }
    };

    $genie.AudioUICommandItem = AudioUICommandItem;

    class AudioUI extends $genie.UI {
        constructor() {
            super();

            // Keep a map between the command labels and their execute() calls so that we can map audio commands to call commands
            this._audioCommands = {};
            this._speechResults = {};
            this.RootViewModel = function(params) {
                var self = this; 
                ko.components.register("dialog", {
                    viewModel: function(params) {
                        self.isVisible = ko.observable(false);
                        self.childCommands = ko.observableArray([]);
                    },
                    template: { require: 'audio-dialog.html'}
                }); 
            };
            this.init(); 
        }

        init() {
           ko.applyBindings(new this.RootViewModel())
        };

        /**
         * Find the most likely speech API result 
         */
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
                    var newCommand = new $genie.AudioUICommandItem(commands[i], this, i);
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
        sortCommands(label, commandItems) {
            if (label == "commands") { // Don't display any other types of commands (links, etc.)
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

                for(var i=0; i<commandItems.length; i++){
                    this.childCommands.push(new commandItems[i].RootViewModel())
                }
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
        removeCommand(command) {
            // TODO: Remove command from the dialog
        }

        removeCommands() {
            // TODO: REmove a list of commands
        }
    };

    $genie.AudioUI = AudioUI;
})($genie);