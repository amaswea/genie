"use strict";
var $action = $action || {};
(function ($action) {
    $action.dependencies = {};

    $action.dependencies.Keyboard

    // List of English word strings mapped to tag names
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

    /**
     * List of HTML element types that support the disabled attribute
     */
    $action.DisabledAttributeElements = [
        "button", "command", "fieldset", "input", "keygen", "optgroup", "option", "select", "textarea"
    ];

    /**
     * The list of events that are invokeable by the user through mouse or keyboard
     * @private
     * @property undefined
     */
    $action.UserInvokeableEvents = [
        "cut",
        "copy",
        "paste",
        "blur",
        "click",
        "compositionend",
        "compositionstart",
        "compositionupdate",
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
        "submit", 
        "touchmove", 
        "touchstart", 
        "touchend"
        // TOOD: rest of HTML DOM events, Drag & Drop events, Touch events
    ];

    /**
     * Orders for mouse related events
     * @private
     * @property undefined
     */
    $action.MouseOrders = {
        "mouseup": ["mousedown", "mouseup"],
        "click": ["mousedown", "mouseup", "click"],
        "dblclick": ["mousedown", "mouseup", "click", "mousedown", "mouseup", "click"],
        "copy": ["mousedown", "mouseup", "select", "copy"],
        "cut": ["mousedown", "mouseup", "select", "cut", "input"],
        "paste": ["mousedown", "mouseup", "paste", "input"]
            // compositionStart
            // compositionEnd
            // compositionUpdate
            // mouseenter
            // mouseleave
            // mouseout
            // mouseover
            // mouseup
            // resize
            // scroll
            // select
            // wheel
            // change
            // contextmenu
            // show
            // submit
    }

    $action.KeyboardOrders = {
        "click": ["keydown", "keypress", "click", "keyup"], // TODO: right click 
        //"dblclick":  Cannot be executed by a seqence of two enter keys.. Might be different in other browsers? Need to test
        "cut": ["keydown", "keydown", "cut", "input", "keyup", "keyup"], // TOOD: Need to pass in the right keycodes for input
        "paste": ["keydown", "keydown", "paste", "input", "keyup", "keyup"],
        "copy": ["keydown", "keydown", "copy", "input", "keyup", "keyup"],
        "input": ["keydown", "keypress", "input", "keyup"]
    }

    // List of W3C inline GlobalEventHandlers that are supported
    $action.GlobalEventHandlers = [
        "onclick", "onmouseover", "onchange"
    ];
})($action);