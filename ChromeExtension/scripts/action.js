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

    class ActionManager {
        constructor() {}

        create(item, modifier, listener) {
            var listItem = document.createElement("li");
            var action = listener ? listener : $action.ActionableElementsActionLabel[item.tag];
            listItem.classList.add("action-search-list-item");

            var label = action + " the " + item.label + " " + $action.TagEnglishWordMappings[item.tag.toLowerCase()];
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
                    selector: item.selector,
                    tag: item.tag,
                    handler: item.handler
                }

                window.postMessage(action, "*");

                // Unload the script
                (document.head || document.documentElement).removeChild(s);
            }

            $(listItem).click(handleAction);
            return listItem;
        };

        dispose() {};

        handleAction() {
            // Inject the performActions.js script into the page
        }
    }

    $action.ActionManager = ActionManager;
})($action);