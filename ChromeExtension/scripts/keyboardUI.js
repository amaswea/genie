"use strict";
var $action = $action || {};
(function ($action) {
    $action.UserInvokeableEvents = [
        "cut",
        "copy",
        "paste",
        "blur",
        "click",
        "compositionend",
        "compisitionstart",
        "compisitionupdate",
        "dblclick",
        "focus",
        "focusin",
        "focusout",
        "input",
        "keydown",
        "keyup",
        "mousedown",
        "mouseenter",
        "mouseleave",
        "mousemove",
        "mouseout",
        "mouseover",
        "mouseup",
        "resize",
        "scroll",
        "select",
        "wheel",
        "change",
        "contextmenu",
        "show",
        "submit"
        // TOOD: rest of HTML DOM events, Drag & Drop events, Touch events
    ];

    $action.TagEnglishWordMappings = {
        "div": "container",
        "h1": "header",
        "h2": "header",
        "h3": "header",
        "h4": "header",
        "h5": "header",
        "h6": "header",
        "img": "image",
        "button": "button",
        "ul": "bulleted list",
        "li": "list item",
        "header": "header",
        "footer": "footer",
        "nav": "navigation element",
        "hr": "horizontal rule",
        "ol": "numbered list",
        "input": "field",
        "p": "paragraph",
        "iframe": "inline frame element",
        "a": "link",
        "u": "underline element",
        "span": "inline container",
        "cite": "citation",
        "code": "code block",
        "abbr": "abbreviation",
        "main": "main content",
        "figcaption": "figure caption",
        "hgroup": "headings group",
        "var": "variable",
        "select": "selectable menu",
        "meta": "metadata element",
        "tbody": "table body",
        "tr": "table row",
        "td": "table cell",
        "th": "table header cell",
        "tfoot": "table footer",
        "thead": "table header",
        "col": "column",
        "fieldset": "form group",
        "svg": "graphic",
        "body": "body",
        "form": "form",
        "html": "html",
        "dd": "description element",
        "section": "section",
        "article": "article"
    };

    class UI {
        constructor() {

        }

        init() {}

        show() {}

        hide() {}

        remove() {}

        addCommand() {}

        removeCommand() {}
    }

    class KeyboardUI {
        constructor() {
            this.dialog = undefined;
            this.commandItems = [];
            this.elements = [];
            this.actionCount = 0;
            this.init();
        }

        init() {
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

            this.hide();
            $(window).scroll(_.throttle(this.repositionDialog, 1));
            this.repositionDialog();
        };

        addCommand(element, command) {
            if (command.eventType == 'default' || $action.UserInvokeableEvents.indexOf(command.eventType) > -1) {
                var newCommand = new $action.KeyboardUICommandItem(command.eventType, element, command.handler)

                var index = this.elements.indexOf(element);
                if (index == -1) {
                    this.elements.push(element);
                    index = this.elements.length - 1;
                }

                if (!this.commandItems[index])
                    this.commandItems[index] = [];

                this.commandItems[index].push(newCommand);
                this.actionCount++;
                this.list.appendChild(newCommand.dom());
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
                    if (cmd.eventType == command.eventType) {
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
    };

    $action.KeyboardUI = KeyboardUI;

    class CommandItem {
        constructor(eventType, element, handler) {
            this.command = new $action.Command(eventType, element, handler);
        }

        get Command() {
            return this.command;
        }

        /**
         * A label string to use for the command item
         * @private
         * @property undefined
         */
        label() {

        }

        dom() {

        }
    };

    class KeyboardUICommandItem extends CommandItem {
        constructor(eventType, element, handler) {
            super(eventType, element, handler);
        }

        /**
         * Return a suitable label for the command
         */
        label() {
            var tagname = this.command.Element.tagName;
            if (tagname != "IFRAME") { // Cannot request contents of iframe due to cross origin frame error
                var label = "";
                if ($action.CommandLabels[tagname]) {
                    label = $action.CommandLabels[tagname](this.command.Element);
                } else {
                    label = jQuery(this.command.Element).contents().first().text().trim();
                }

                if (label && label.length > 0) {
                    return label;
                }
            }
            return "";
        };


        dom() {
            var listItem = document.createElement("li");
            var action = this.command.EventType != 'default' ? this.command.EventType : $action.ActionableElementsActionLabel[this.command.Element.tagName];
            listItem.classList.add("action-search-list-item");

            var label = action + " the " + this.label(this.command.Element) + " " + $action.TagEnglishWordMappings[this.command.Element.tagName.toLowerCase()];
            listItem.textContent = label;      
            listItem.addEventListener("click", this.command.execute()); 
            
            return listItem;

            /*
                        var modifierLabel = document.createElement("span");
                        modifierLabel.classList.add("action-search-modifier");
                        modifierLabel.textContent = 'ctrl+shift+' + modifier;
                        listItem.appendChild(modifierLabel);
            */
        };
    };

    $action.KeyboardUICommandItem = KeyboardUICommandItem;
})($action);