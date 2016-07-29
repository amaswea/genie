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

/*
    These should be generic and not need to be implemented by each UI type
        appendCommand(dom, commandCount) {}

        removeCommand(dom, commandCount) {}*/

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

    class KeyboardUICommandItem extends CommandItem {
        constructor(command) {
            super(command);
            this.init();
        }

        get DOM() {
            return this._domElement;
        };

        init() {
            // Initialize the UI for the CommandItem corresponding to each command
        }

        /**
         * Return a suitable label for the command
         */
        label() {
           // Constructs a desired label for the command based on the command metadata available
        };
    };

    $action.KeyboardUICommandItem = KeyboardUICommandItem;

    class KeyboardUI {
        constructor() {
            this.init();
        }

        init() {

        };

        show() {};

        hide() {};

        remove() {
            // Removes the UI container from the DOM

        }

        /**
         * Append a command to the dialog
         */
        appendCommand(command, commandCount) {
            var newCommand = new $action.KeyboardUICommandItem(command)
            command.CommandItem = newCommand;

            if (!command.userInvokeable()) {
                newCommand.DOM.classList.add('action-search-disabled');
            }

            this.list.appendChild(newCommand.DOM);


            this.label.textContent = "There were " + commandCount + " actions found ...";
            return newCommand;
        }

        /**
         * Remove a command from the dialog
         */
        removeCommand(command, commandCount) {
            var cmdItem = command.CommandItem;
            if (cmdItem && cmdItem.DOM) {
                this.list.removeChild(cmdItem.DOM);
                this.label.textContent = "There were " + commandCount + " actions found ...";
            }
        }

        updateCommandState(command, enabled) {
            // What should happen when the command state changes 
        }
    };

    $action.MenuUI = MenuUI;
})($action);