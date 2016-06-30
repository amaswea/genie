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
            if (title && title.length) {
                return title;
            }

            var innerText = jQuery(element).contents().first().text().trim();
            return innerText;
        }
    };

    $action.GlobalEventHandlers = [
        "onclick", "onmouseover"
    ];

    $action.GlobalEventHandlerMappings = { // TODO: Add the rest
        "onclick": "click",
        "onmouseover": "mouseover"
    };

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

    /*    $action.MouseOrders = {
            "click": ["mousedown", "mouseup", "click"], // TODO: right click 
            "dblclick": ["mousedown", "mouseup", "click", "mousedown", "mouseup", "click"],
            "cut": ["mousedown", "mouseup", "select", "copy"],
            "copy": ["mousedown", "mouseup", "select", "cut", "input"],
            "paste": ["mousedown", "mouseup", "paste", "input"]
        }

        $action.KeyboardOrders = {
            "click": ["keydown", "keypress", "click", "keyup"], // TODO: right click 
            //"dblclick":  Cannot be executed by a seqence of two enter keys.. Might be different in other browsers? Need to test
            "cut": ["keydown", "keydown", "cut", "input", "keyup", "keyup"], // TOOD: Need to pass in the right keycodes for input
            "paste": ["keydown", "keydown", "paste", "input", "keyup", "keyup"],
            "copy": ["keydown", "keydown", "copy", "input", "keyup", "keyup"],
            "input": ["keydown", "keypress", "input", "keyup"]
        }*/

    /* $action.CommandInputs = {
         "cut": ["ctrl", "x", "" "", "ctrl", "x"]
     };*/

    class Command {
        constructor(eventType, domElement, handler) {
            this._eventType = eventType;
            this._domElement = domElement; // The DOM element the command is associated with
            this._handler = handler;
            this.init();
        }

        init() {
            this.createCommand()
        };

        /**
         * Return whether the command can be invoked by a user 
         * @private
         * @property undefined
         */
        userInvokable() {

        };

        /**
         * The set of data dependencies that the command has (control dependencies)
         * Example: enabled state of another element, etc. 
         */
        dataDependencies() {

        };

        /**
         * Returns whether the command is currently enabled (can be performed)
         */
        enabled() {

        };

        /**
         * Command or set of commands that the command is dependent on being executed before it can be executed
         */
        eventDependencies() {

        };

        /**
         * The set of commands that must be executed based on the nature of the device
         * @private
         * @property undefined
         */
        deviceDependencies() {

        };

        /**
         * Executes the command (need to figure out what the inputs should be)
         */
        execute() {

        };

        createCommand(element, command, modifier) {


            // Send a message to the script to perform the action
            var handleAction = function (evt) {
                evt.preventDefault();
                evt.stopPropagation();

                var s = document.createElement('script');
                s.src = chrome.extension.getURL("scripts/performAction.js");
                (document.head || document.documentElement).appendChild(s);

                var events = $action.CommandOrders[command.commandType];
                var action = {
                    events: events ? events : [command.commandType],
                    inputs: $action.CommandInputs[command.commandType],
                    selector: $action.getElementPath(element)
                }

                window.postMessage(action, "*");

                // Unload the script
                (document.head || document.documentElement).removeChild(s);
            }

            $(listItem).click(handleAction);

            var command = new Command(command.commandType, element, listItem);
            return command;
        };
    };

    $action.Command = Command;
})($action);