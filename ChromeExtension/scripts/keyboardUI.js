"use strict";
var $action = $action || {};
(function ($action) {
    class UI {
        constructor() {
            
        }
        
        show() {}
        
        hide() {}
        
        dom() {}
    }
    
    class KeyboardUI {
        constructor() {
            this.dialog = undefined;
            this.commandItems = [];
            this.elements = [];
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

        addCommand(element, command) {
            var allowed = command.commandType == 'default' || $action.AllowedCommands.indexOf(command.commandType) > -1;
            if (this.commandIsVisible(element) && allowed) {
                var newCommand = this.commandManager.createCommand(element, command, this.actionCount);

                var index = this.elements.indexOf(element);
                if (index == -1) {
                    // What happens when an element is removed to this object? 
                    this.elements.push(element);
                    index = this.elements.length - 1;
                }

                if (!this.commandItems[index])
                    this.commandItems[index] = [];

                this.commandItems[index].push(newCommand);
                this.actionCount++;
                this.list.appendChild(newCommand.commandItem);
                this.label.textContent = "There were " + this.actionCount + " actions found ...";
            }
        };


        removeCommand(element, command) {
            var index = this.elements.indexOf(element);
            if (index > -1) {
                var commands = this.commandItems[index];
                var remove = -1;
                for (var i = 0; i < commands.length; i++) {
                    var cmd = commands[i];
                    if (cmd.commandType == command.commandType) {
                        remove = i;
                        this.actionCount--;
                        this.list.removeChild(cmd.commandItem);
                        this.label.textContent = "There were " + this.actionCount + " actions found ...";
                        break;
                    }
                }

                if (remove != -1) {
                    this.commandItems[index].splice(remove, 1);
                }
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

    class CommandItem {
        constructor() {

        }

        /**
         * Return a suitable label for the command
         */
        label() {
            var tagname = element.tagName;
            if (tagname != "IFRAME") { // Cannot request contents of iframe due to cross origin frame error
                var label = "";
                if ($action.ElementLabels[tagname]) {
                    label = $action.ElementLabels[tagname](element);
                } else {
                    label = jQuery(element).contents().first().text().trim();
                }

                if (label && label.length > 0) {
                    return label;
                }
            }
            return "";
        };

        
        dom() {
            var listItem = document.createElement("li");
            var action = command.commandType != 'default' ? command.commandType : $action.ActionableElementsActionLabel[element.tagName];
            listItem.classList.add("action-search-list-item");

            var label = action + " the " + this.label(element) + " " + $action.TagEnglishWordMappings[element.tagName.toLowerCase()];
            listItem.textContent = label;

            var modifierLabel = document.createElement("span");
            modifierLabel.classList.add("action-search-modifier");
            modifierLabel.textContent = 'ctrl+shift+' + modifier;
            listItem.appendChild(modifierLabel);
        };
    };
})($action);