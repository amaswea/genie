TagEnglishWordMappings = {
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
    "svg": "graphic"
};

window.addEventListener("message", receiveMessage, false);

var injectScript = function (script) {
    // Inject the getActions.js script into the page
    var s = document.createElement('script');
    s.src = chrome.extension.getURL(script);
    s.onload = function () {
      //  this.parentNode.removeChild(this);
    };
    console.log("script injected");
    (document.head || document.documentElement).appendChild(s);
};

function receiveMessage(event) {
    if(event.source != window) {
        return;
    }

    if (event.data.length && event.data[0].selector) {
        var dialog = document.createElement("div");
        dialog.classList.add("action-search");
        var list = document.createElement("ul");
        list.classList.add("action-search-list");


        var label = document.createElement("div");
        label.classList.add("action-search-label");
        label.textContent = "There were " + event.data.length + " actions found ...";

        dialog.appendChild(label);
        dialog.appendChild(list);
        $('html').append(dialog);

        for (var i = 0; i < event.data.length; i++) {
            var elt = event.data[i];
            var selector = elt.selector;
            var listeners = elt.listeners;
            var label = elt.label;
            var tag = elt.tag;
            for (var j = 0; j < listeners.length; j++) {
                var listener = listeners[j];


                var item = document.createElement("li");
                item.classList.add("action-search-list-item");
                item.textContent = listener + " the " + label + " " + TagEnglishWordMappings[tag.toLowerCase()];
                list.appendChild(item);

                var action = function () {
                    // Inject the getActions.js script into the page
                    var s = document.createElement('script');
                    s.src = chrome.extension.getURL("scripts/performAction.js");
                    (document.head || document.documentElement).appendChild(s);

                    var action = {
                        action: listener,
                        selector: selector
                    }

                    window.postMessage(action, "*");

                    // Unload the script
                    (document.head || document.documentElement).removeChild(s);
                }

                Mousetrap.bind('ctrl+shift+' + j, function (e) {
                    action();
                    return false;
                });

                // Send a message to the script to perform the action
                $(item).click(action);
            }
        }

        // ...
    }
} 

// Listen for messages from the background script and return the requested information
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    console.log("message received");
    if (msg.text === 'monitorActions') {
        console.log("injecting monitor script");
        // Inject the event monitoring script into the page
        injectScript("scripts/monitor.js");
    }
});

$(document).ready(function(){
  alert("ready.");  
})