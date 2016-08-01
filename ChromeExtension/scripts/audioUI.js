"use strict";
var $action = $action || {};
(function ($action) {
    // Interface for UIs
    class UI {
        constructor() {

        }

        init() {}

        show() {}

        hide() {}

        remove() {}

        appendCommand(dom, commandCount) {}

        removeCommand(dom, commandCount) {}

        updateCommandState(state) {}
    }

    class CommandItem {
        constructor(command) {
            this.command = command;
        }

        get Command() {
            return this.command;
        }

        get DOM() {}

        init() {};

        /**
         * A label string to use for the command item
         * @private
         * @property undefined
         */
        label() {}
    };

    class AudioUI extends CommandItem {
        constructor(command) {
            super(command);
            this.init();
        }

        get DOM() {
            return this._domElement;
        };

        init() {
            // Initialize the UI for the CommandItem corresponding to each command
            this._tagName = this.command.Element.tagName;
            var listItem = document.createElement("li");
            listItem.classList.add("genie-menu-ui-list-item");

            var labelSpan = document.createElement("span");
            labelSpan.classList.add("genie-menu-ui-list-item-label");
            labelSpan.textContent = this.label();

            listItem.appendChild(labelSpan);
            listItem.addEventListener("click", this.command.execute(), null, false, true); // Must pass in these arguments so that the addEventListener override knows to ignore this registration. 

            this._domElement = listItem;
        }

        /**
         * Return a suitable label for the command
         */
        label() {
            // Constructs a desired label for the command based on the command metadata available
            var labelString = "";
            // If the command has an imperative label, return it. 
            if (this.command.ImperativeLabels.length) {
                labelString = labelString + this.command.ImperativeLabels[0];
            }

            // Otherwise, return the first text node found
            else if (this.command.Labels.length) {
                var tagName = this._tagName;
                // Return the first text node lable
                labelString = labelString + this.command.Labels[0];
            }

            return labelString;
        };
    };

    $action.AudioUICommandItem = AudioUICommandItem;

    class AudioUI {
        constructor() {
            this.init();
        }

        init() {
            var menu = document.createElement("div");
            menu.classList.add("genie-audio-ui");
            $('html').append(menu);

            this.menu = menu;
            this.hide();
        };

        show() {
            this.menu.style.display = "";
        };

        hide() {
            this.menu.style.display = "none";
        };

        remove() {
            // Removes the UI container from the DOM

        }

        /**
         * Append a command to the dialog
         */
        appendCommand(command, commandCount) {
            var newCommand = new $action.MenuUICommandItem(command)
            command.CommandItem = newCommand;

            if (!command.userInvokeable()) {
                newCommand.DOM.classList.add('genie-audio-ui-disabled');
            }

            this.list.appendChild(newCommand.DOM);

            return newCommand;
        }

        appendCommandGroup(label, commands) {
            var group = document.createElement('div');
            group.classList.add('genie-audio-ui-group');

            var menulabel = document.createElement('span');
            menulabel.classList.add('genie-audio-ui-group-label');
            menulabel.textContent = label;
            group.appendChild(menulabel);

            var list = document.createElement('ui');
            list.classList.add('genie-audio-ui-list');

            // Groups
            for (var i = 0; i < commands.length; i++) {
                var newCommand = new $action.AudioUICommandItem(commands[i]);
                commands[i].CommandItem = newCommand;

                if (!commands[i].userInvokeable()) {
                    newCommand.DOM.classList.add('genie-menu-ui-disabled');
                }

                list.appendChild(newCommand.DOM);
            }

            group.appendChild(list);
            this.menu.appendChild(group);
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

        updateCommandState(command, enabled) {
            // What should happen when the command state changes 
            var domElement = command.CommandItem.DOM;
            var disabled = $(domElement).hasClass('genie-menu-ui-disabled');
            if (disabled && enabled) {
                $(domElement).removeClass('genie-menu-ui-disabled');
            }

            if (!disabled && !enabled) {
                $(domElement).addClass('genie-menu-ui-disabled');
            }
        }
    };

    $action.MenuUI = MenuUI;
})($action);