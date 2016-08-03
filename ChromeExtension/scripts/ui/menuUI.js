"use strict";
var $action = $action || {};
(function ($action) {
    class MenuUICommandItem extends CommandItem {
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
            listItem.addEventListener("click", this.command.executeCallback(), null, false, true); // Must pass in these arguments so that the addEventListener override knows to ignore this registration. 

            this._domElement = listItem;
        }
    };

    $action.MenuUICommandItem = MenuUICommandItem;

    class MenuUI {
        constructor() {
            this.init();
            super(this.menu);
        }

        init() {
            var menu = document.createElement("div");
            menu.classList.add("genie-menu-ui");
            $('html').append(menu);

            this.menu = menu;
            this.hide();
        };

        show() {
            this.menu.style.display = "";
            $('body').addClass('genie-move-body-left');
        };

        appendCommandGroup(label, commands) {
            var group = document.createElement('div');
            group.classList.add('genie-menu-ui-group');

            var menulabel = document.createElement('span');
            menulabel.classList.add('genie-menu-ui-group-label');
            menulabel.textContent = label;
            group.appendChild(menulabel);

            var list = document.createElement('ui');
            list.classList.add('genie-menu-ui-list');

            // Groups
            for (var i = 0; i < commands.length; i++) {
                var newCommand = new $action.MenuUICommandItem(commands[i]);
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