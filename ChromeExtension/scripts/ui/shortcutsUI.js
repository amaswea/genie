"use strict";
var $action = $action || {};
(function ($action) {
    class ShortcutsUICommandItem extends $action.CommandItem {
        constructor(command) {
            super(command);
            this.init();
        }

        get DOM() {
            return this._domElement;
        };

        init() {
            var command = document.createElement("div");
            command.classList.add("genie-shortcuts-ui-command");

            var label = document.createElement("span");
            label.classList.add("genie-shortcuts-ui-command-label");
            label.textContent = this.label();

            command.appendChild(label);
            this._domElement = command;
        }
    };

    $action.ShortcutsUICommandItem = ShortcutsUICommandItem;

    class ShortcutsUI extends $action.UI {
        constructor() {
            // Keep a map between the command labels and their execute() calls so that we can map audio commands to call commands
            super();
            this.init();
        }

        init() {
            var shortcutUI = document.createElement("div");
            shortcutUI.classList.add("genie-shortcut-ui");

            var header = document.createElement("div");
            header.classList.add("genie-shortcut-ui-header");

            var label = document.createElement("span");
            label.classList.add("genie-shortcut-ui-header-label");
            label.textContent = "Keyboard shortcuts";
            header.appendChild(label);

            var close = document.createElement("span");
            close.classList.add("genie-shortcut-ui-header-close");
            close.textContent = "Close";

            var self = this;
            close.addEventListener("click", function (evt) {
                self.hide();
            }, null, false, true);

            header.appendChild(close);
            shortcutUI.appendChild(header);

            var content = document.createElement("div");
            content.classList.add("genie-shortcut-ui-content");
            shortcutUI.appendChild(content);


            this.commandContainer = content;
            shortcutUI.style.display = "none";
            $('html').append(shortcutUI);
            this.Root = shortcutUI;
        };

        appendCommandGroup(label, commands) {
            var commandGroup = document.createElement("div");
            commandGroup.classList.add("genie-shortcut-ui-group");
            var commandGroupLabel = document.createElement("span");
            commandGroupLabel.classList.add("genie-shortcut-ui-group-label");
            commandGroupLabel.textContent = label;
            commandGroup.appendChild(commandGroupLabel);

            var commandsContainer = document.createElement("div");
            commandsContainer.classList.add("genie-shortcut-ui-group-content");
            commandGroup.appendChild(commandsContainer);
            for (var i = 0; i < commands.length; i++) {
                var newCommand = new $action.ShortcutsUICommandItem(commands[i]);
                commands[i].CommandItem = newCommand;

                // When a command gets added, add a glowing border around the command element
                var commandElement = commands[i].Element;
                if (!(commandElement instanceof Window) && !(commandElement instanceof Document)) { // TODO: make this generic
                    commandsContainer.append(newCommand.DOM);
                }
            }
            this.commandContainer.appendChild(commandGroup);
        }
    };

    $action.ShortcutsUI = ShortcutsUI;
})($action);