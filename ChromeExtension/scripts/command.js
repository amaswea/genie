"use strict";
var $action = $action || {};
(function ($action) {
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

    $action.ActionableElementsActionLabel = {
        "A": "Click",
        "INPUT": "Fill out"
    };

    $action.ActionableElements = {
        "A": function (element) {
            var href = jQuery(element).attr("href");
            return href && href.length > 0;
        },
        "INPUT": function (element) {
            var type = jQuery(element).attr("type");
            return type && type != "hidden";
        }
    };

    $action.ElementLabels = {
        "INPUT": function (element) { // Get the label from the placeholder attribute
            var placeholder = jQuery(element).attr("placeholder");
            return placeholder;
        },
        "A": function (element) {
            var title = jQuery(element).attr("title");
            return title;
        }
    };

    $action.GlobalEventHandlers = [
        "onclick", "onmouseover"
    ];

    $action.GlobalEventHandlerMappings = { // TODO: Add the rest
        "onclick": "click",
        "onmouseover": "mouseover"
    };

    class CommandManager {
        constructor() {}

        createCommand(element, command, modifier, listener) {
            var listItem = document.createElement("li");
            var action = listener ? listener : $action.ActionableElementsActionLabel[element.tagName];
            listItem.classList.add("action-search-list-item");

            var label = action + " the " + this.getCommandLabel(element) + " " + $action.TagEnglishWordMappings[element.tagName.toLowerCase()];
            listItem.textContent = label;

            var modifierLabel = document.createElement("span");
            modifierLabel.classList.add("action-search-modifier");
            modifierLabel.textContent = 'ctrl+shift+' + modifier;
            listItem.appendChild(modifierLabel);

            // Send a message to the script to perform the action
            var handleAction = function (evt) {
                evt.preventDefault();
                evt.stopPropagation();

                var s = document.createElement('script');
                s.src = chrome.extension.getURL("scripts/performAction.js");
                (document.head || document.documentElement).appendChild(s);

                var action = {
                    action: listener ? listener : undefined,
                    selector: command.path,
                    tag: element.tagName,
                    handler: command.handler
                }

                window.postMessage(action, "*");

                // Unload the script
                (document.head || document.documentElement).removeChild(s);
            }

            $(listItem).click(handleAction);
            return listItem;
        };

        dispose() {};

        handleCommand() {
            // Inject the performActions.js script into the page
        }

        getCommandLabel(element) {
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
    };

    $action.CommandManager = CommandManager;
})($action);