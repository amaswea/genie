"use strict";
var $genie = $genie || {};
(function ($genie) {
    class ShortcutArgumentCommandItem {
        constructor(){
            this.RootViewModel = function(params) {
                var self = this; 
                ko.components.register("argumentItem", {
                    viewModel: function(params) {
                        self.argument = ko.observable('');
                        self.value = ko.observable('');
                    },
                    template: { require: 'shortcuts-command-item.html'}
                }); 
            };
        }

        init(){
            ko.applyBindings();
        }
    }

    class ShortcutsUICommandItem extends $genie.CommandItem {
        constructor(command, ui) {
            super(command, ui);
            this._hasLabel = true;
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
            init();
        }

        init() {
            ko.applyBindings(new this.RootViewModel());

            var argumentKeys = Object.keys(this.Command.ArgumentsMap);

            var descriptionLabel = this.descriptionLabel();
            var imperativeLabel = this.commandLabel();
            if (imperativeLabel.length) {
                this.label(imperativeLabel); 
            }

            if (descriptionLabel.length) {
               this.description(descriptionLabel); 
            }

            if (descriptionLabel.length && imperativeLabel.length) {
                this.label(this.label + ": ");
            } else if (imperativeLabel.length && argumentKeys.length) {
                this.label(this.label + " ,");
            }

            if (argumentKeys.length) {
                for (var i = 0; i < argumentKeys.length; i++) {
                    let argumentObj = new ArgumentCommandItem().RootViewModel(); 
                    argumentObj.argument = _.upperFirst(argumentKeys[i]) + ": ";
                    argumentObj.value = this.Command.ArgumentsMap[argumentKeys[i]];
                    this.arguments.add(argumentObj);
                }
            }
        }
    };

    $genie.ShortcutsUICommandItem = ShortcutsUICommandItem;

    class ShortcutsUI extends $genie.UI {
        constructor() {
            // Keep a map between the command labels and their execute() calls so that we can map audio commands to call commands
            super();
            this._shortcuts = {};
            this.RootViewModel = function(params) {
                var self = this; 
                ko.components.register("dialog", {
                    viewModel: function(params) {
                        self.isVisible = ko.observable(false);
                        self.label = ko.observable('Keyboard shortcuts');
                        self.childCommands = ko.observableArray([]); 
                    },
                    template: { require: 'shortcuts-dialog.html'}
                }); 
            };
            this.init();
        }

        init() {
            ko.applyBindings(); 
        };

        /**
         * Generate a unique shortcut for each command
         */
        getUniqueShortcut(label, description, command) {
            if (label.length) {
                for (var i = 0; i < label.length; i++) {
                    var letter = label[i].toLowerCase();
                    if (!this._shortcuts[letter] && letter != " ") {
                        this._shortcuts[letter] = command;
                        return letter;
                    }
                }
            }

            if (description && description.length) {
                for (var j = 0; j < description.length; j++) {
                    var letter = description[j].toLowerCase();
                    if (!this._shortcuts[letter] && letter != " " && letter != ",") {
                        this._shortcuts[letter] = command;
                        return letter;
                    }
                }
            }

            // Assign first letter of alphabet not already used
            var alphabet = "abcdefghijklmnopqrstuvwxyz";
            for (var j = 0; j < alphabet.length; j++) {
                var alphabetLetter = alphabet[j];
                if (!this._shortcuts[alphabetLetter]) {
                    this._shortcuts[alphabetLetter] = command;
                    return alphabetLetter;
                }
            }

            var numbers = "1234567890";
            for (var k = 0; k < numbers.length; k++) {
                var number = numbers[k];
                if (!this._shortcuts[number]) {
                    this._shortcuts[number] = command;
                    return number;
                }
            }

            return "";
        }

        createShortcuts(command, commandItem) {
            var shortcuts = [];
            if (command.hasArguments()) {
                var argumentKeys = Object.keys(command.ArgumentsMap);
                for (var i = 0; i < argumentKeys.length; i++) {
                    let argument = argumentKeys[i];
                    var argumentShortcut = this.getUniqueShortcut(argument, undefined, commandItem);
                    if (argumentShortcut.length) {
                        shortcuts.push(argumentShortcut);
                        this._keypressListener.simple_combo("ctrl " + argumentShortcut, commandItem.perform.bind(commandItem, argument));
                    }
                }
            } else {
                let label = commandItem.commandLabel();
                let descriptionText = commandItem.descriptionLabel();
                let shortcut = this.getUniqueShortcut(label, descriptionText, commandItem);
                shortcuts.push(shortcut);
                this._keypressListener.simple_combo("ctrl " + shortcut, commandItem.perform.bind(commandItem));
            }

            return shortcuts;
        }

        createCommands(label, commands) {
            if (!this._keypressListener) {
                this._keypressListener = new window.keypress.Listener();
            }

            if (label == "commands") {
                var commandItems = [];
                for (var i = 0; i < commands.length; i++) {
                    var newCommand = new $genie.ShortcutsUICommandItem(commands[i], this);
                    if (newCommand.HasLabel) {
                        commandItems.push(newCommand);
                    }
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
        }
    }

    $genie.ShortcutsUI = ShortcutsUI;
})($genie);