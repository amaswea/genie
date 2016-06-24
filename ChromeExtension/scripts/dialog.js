"use strict";
var $action = $action || {};
(function ($action) {
    class DialogManager {
        constructor() {
            this.dialog = undefined;
            this.commands = {};
            this.commandManager = new $action.CommandManager();
            this.actionCount = 0;
        }

        initializeDialog() {
            var dialog = document.createElement("div");
            dialog.classList.add("action-search");
            var list = document.createElement("ul");
            list.classList.add("action-search-list");

            var label = document.createElement("div");
            label.classList.add("action-search-label");

            dialog.appendChild(label);
            dialog.appendChild(list);
            $('html').append(dialog);

            this.dialog = dialog;
            this.list = list;
            this.label = label;

            this.hideDialog();
            $(window).scroll(_.throttle(this.repositionDialog, 1));
            this.repositionDialog();
        };

        addCommand(command) {
            var item = this.createDialogCommand(command, this.actionCount, command.eventType);
            if (item) {
                this.commands[command.path] = item;
                this.actionCount++;
                this.list.appendChild(item);
                this.label.textContent = "There were " + this.actionCount + " actions found ...";
            }
        };


        removeCommand(command) {
            var commandItem = this.commands[command.path];
            if (commandItem) {
                this.actionCount--;
                delete this.commands[command.selector];
                this.list.removeChild(commandItem);
                this.label.textContent = "There were " + this.actionCount + " actions found ...";
            }
        };

        repositionDialog() {
            var dialog = $('.action-search');

            var scrollTop = $(window).scrollTop();
            var top = $(window).height() + scrollTop - dialog.height();
            dialog[0].style.top = top + "px";
        };

        showDialog() {
            this.dialog.style.display = "";
        };

        hideDialog() {
            this.dialog.style.display = "none";
        };

        disposeDialog() {
            $('.action-search').remove();
            $(window).unbind("scroll", this.repositionDialog);
        }

        createDialogCommand(command, modifier, listener) {
            var element = jQuery(command.path);
            if (element.length && this.commandIsVisible(element[0])) {
                var newAction = this.commandManager.createCommand(element[0], command, modifier, listener);
                return newAction;
            }
        };

        commandIsVisible(domNode) {
            //  var visible = $(domNode).is(':visible');
            var element = $(domNode);
            var displayed = element.css('display') != "none";
            var visibility = element.css('visibility') != "hidden";
            var heightBigEnough = element.height() > 10;
            var widthBigEnough = element.width() > 10;
            var notClear = element.css('opacity') != "0" && element.css('opacity') != "0.0";
            var offLeftRight = (element.offset().left >= window.innerWidth) || ((element.offset().left + element.offsetWidth) <= 0);
            var hidden = $(domNode).attr('type') == 'hidden';
            var visible = $(domNode).is(':visible');

            if (visible && displayed && visibility && heightBigEnough && widthBigEnough && notClear && !offLeftRight && !hidden) {
                return true;
            }

            return false;
        };

        commandIsAvailable(domNode) {
            // Ways that a command can not be available
            // 1. Command is not visible
            //    - Display set to None
            //    - Visibility set to hidden
            //    - Height or width too small
            //    - Opaque (opacity)
            //    - Offscreen
            //    - Hidden attribute
            //    - Z-index is hiding it behind something else
            // 2. Command is disabled 
            // 3. Command results in no effect because of input guards or conditions in the code
            // 4. Command is not yet in the DOM (Hovering over a menu adds menu items with commands to DOM)
        };
    };

    $action.DialogManager = DialogManager;
})($action);