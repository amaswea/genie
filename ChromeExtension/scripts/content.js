$actionhandler = {};

$actionhandler.TagEnglishWordMappings = {
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
    "html": "html"
};

$actionhandler.ActionableElementsActionLabel = {
    "A": "Click", 
    "INPUT": "Fill out"
};

window.addEventListener("message", receiveMessage, false);

var injectScript = function (script) {
    // Inject the getActions.js script into the page
    var s = document.createElement('script');
    s.src = chrome.extension.getURL(script);
    s.onload = function () {
        //  this.parentNode.removeChild(this);
    };
    (document.head || document.documentElement).appendChild(s);
};

var isVisible = function (domNode) {
    //  var visible = $(domNode).is(':visible');
    var element = $(domNode);
    var displayed = element.css('display') != "none";
    var visibility = element.css('visibility') != "hidden";
    var heightBigEnough = element.height() > 10;
    var widthBigEnough = element.width() > 10;
    var notClear = element.css('opacity') != "0" && element.css('opacity') != "0.0";
    var offLeftRight = (element.offset().left >= window.innerWidth) || ((element.offset().left + element.offsetWidth) <= 0);
    var hidden = $(domNode).attr('type') == 'hidden';

    if (displayed && visibility && heightBigEnough && widthBigEnough && notClear && !offLeftRight && !hidden) {
        return true;
    }

    return false;
}

var createActionItem = function (item, modifier, listener) {
    var selector = item.selector;

    var element = jQuery(selector);

    if (element.length && isVisible(element[0])) {
        var label = item.label;
        var tag = item.tag;
        var item = document.createElement("li");
        var action = listener ? listener : $actionhandler.ActionableElementsActionLabel[tag];
        item.classList.add("action-search-list-item");
        item.textContent = action + " the " + label + " " + $actionhandler.TagEnglishWordMappings[tag.toLowerCase()];

        var modifierLabel = document.createElement("span");
        modifierLabel.classList.add("action-search-modifier");
        modifierLabel.textContent = 'ctrl+shift+' + modifier;
        item.appendChild(modifierLabel);

        var action = function () {
            // Inject the getActions.js script into the page
            var s = document.createElement('script');
            s.src = chrome.extension.getURL("scripts/performAction.js");
            (document.head || document.documentElement).appendChild(s);

            var action = {
                action: listener ? listener : undefined,
                selector: selector,
                tag: tag
            }

            window.postMessage(action, "*");

            // Unload the script
            (document.head || document.documentElement).removeChild(s);
        }

        $actionhandler.listener.simple_combo("shift 0", function () {
            console.log("you pressed shift 0");
        });

        // Send a message to the script to perform the action
        $(item).click(action);

        return item;
    }
}

function receiveMessage(event) {
    if (event.source != window) {
        return;
    }

    if (event.data.length && event.data[0].selector) {
        var dialog = document.createElement("div");
        dialog.classList.add("action-search");
        var list = document.createElement("ul");
        list.classList.add("action-search-list");

        var label = document.createElement("div");
        label.classList.add("action-search-label");

        dialog.appendChild(label);
        dialog.appendChild(list);
        $('html').append(dialog);

        var keyActionModifier = 0;
        var visibleElements = 0;
        for (var i = 0; i < event.data.length; i++) {
            var elt = event.data[i];
            var listeners = elt.listeners;
            if (listeners) {
                for (var j = 0; j < listeners.length; j++) {
                    var listener = listeners[j];
                    var item = createActionItem(elt, keyActionModifier, listener);
                    if (item) {
                        visibleElements++;
                        list.appendChild(item);
                    }

                    keyActionModifier++;
                }
            } else {
                var item = createActionItem(elt, keyActionModifier);
                if (item) {
                    visibleElements++;
                    list.appendChild(item);
                }

                keyActionModifier++;
            }
        }

        label.textContent = "There were " + visibleElements + " actions found ...";
    }
}

// Listen for messages from the background script and return the requested information
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.text === 'monitorActions') {
        // Inject the event monitoring script into the page
        injectScript("scripts/monitor.js");
    }

    if (msg.text === 'getActions') {
        injectScript("scripts/getActions.js");
    }
});

$(document).ready(function () {
    $actionhandler.listener = new window.keypress.Listener();
})