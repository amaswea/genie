"use strict";
var $action = $action || {};
(function ($action) {
    class KeyboardListCommandItem extends $action.CommandItem {
        constructor(command) {
            super(command);
            this.init();
            this._tagName = "";
        }

        get DOM() {
            return this._domElement;
        };

        init() {
            var element = this.command.Element;
            if (element) {
                this._tagName = element.tagName;
                var listItem = document.createElement("li");
                var action = this.command.EventType != 'default' ? this.command.EventType : $action.ActionableElementsActionLabel[this._tagName];
                listItem.classList.add("action-search-list-item");

                var labelSpan = document.createElement("span");
                labelSpan.classList.add("action-search-label");
                labelSpan.textContent = this.label().toString().replace(/,/g, ", ");

                var tagSpan = document.createElement("span");
                tagSpan.classList.add("action-search-tags");

                var addComma = this.command.NounTags.length > 0 && this.command.VerbTags.length > 0;
                tagSpan.textContent = this.command.NounTags.toString().replace(/,/g, ", ") + (addComma ? ", " : "") + this.command.VerbTags.toString().replace(/,/g, ", ");

                listItem.appendChild(labelSpan);
                listItem.appendChild(tagSpan)
                listItem.addEventListener("click", this.command.executeCallback(), null, false, true); // Must pass in these arguments so that the addEventListener override knows to ignore this registration. 

                this._domElement = listItem;
            }
        }
    };

    $action.KeyboardListCommandItem = KeyboardListCommandItem;

    class KeyboardList extends $action.UI {
        constructor() {
            super();
            this.dialog = undefined;
            this.init();
        }

        init() {
            var dialog = document.createElement("div");
            dialog.classList.add("action-search");
            var list = document.createElement("ul");
            list.classList.add("action-search-list");

            var label = document.createElement("div");
            label.classList.add("action-search-header");
            label.textContent = "Commands";

            dialog.appendChild(label);
            dialog.appendChild(list);
            $('html').append(dialog);

            this.dialog = dialog;
            this.list = list;
            this.label = label;

            this.hide();
            $(window).scroll(_.throttle(this.repositionDialog, 1));
            this.repositionDialog();
        };

        repositionDialog() {
            var dialog = $('.action-search');

            var scrollTop = $(window).scrollTop();
            var top = $(window).height() + scrollTop - dialog.height();
            dialog[0].style.top = top + "px";
        };

        show() {
            this.dialog.style.display = "";
        };

        hide() {
            this.dialog.style.display = "none";
        };

        remove() {
            $('.action-search').remove();
            $(window).unbind("scroll", this.repositionDialog);
        }

        /**
         * Append a command to the dialog
         */
        appendCommandGroup(label, commands) {
            // Groups
            for (var i = 0; i < commands.length; i++) {
                var newCommand = new $action.KeyboardListCommandItem(commands[i]);
                commands[i].CommandItem = newCommand;

                if (!commands[i].userInvokeable()) {
                    newCommand.DOM.classList.add('genie-keyboard-list-disabled');
                }

                this.list.appendChild(newCommand.DOM);
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
    };

    $action.KeyboardList = KeyboardList;
})($action);