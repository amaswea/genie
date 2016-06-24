"use strict";
var $action = $action || {};

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
    "A": function(element) {
        var title = jQuery(element).attr("title");
        return title;
    }
}

$action.GlobalEventHandlers = [
  "onclick", "onmouseover"
];

$action.GlobalEventHandlerMappings = { // TODO: Add the rest
    "onclick": "click",
    "onmouseover": "mouseover"
}

/**
 * Extended the getPath function to return a selector for the current element
 */


// May one day be more complex process
// Include title if no text is found
var getElementLabel = function (element) {
    var tagname = element.tagName;
    if (tagname != "IFRAME") { // Cannot request contents of iframe due to cross origin frame error
        var label = "";
        if ($action.ElementLabels[tagname]) {
            label = ElementLabels[tagname](element);
        } else {
            label = jQuery(element).contents().first().text().trim();
        }

        if (label && label.length > 0) {
            return label;
        }
    }
    return "";
}

// Get all the listeners attached to an element
var getListeners = function (element) {
    var data = jQuery._data ? jQuery._data(element, "events") : undefined;
    data = getAttributeListeners(element, data);
    return data;
};

var getAttributeListeners = function (element, data) {
    var $element = jQuery(element);
    for (var i = 0; i < $action.GlobalEventHandlers.length; i++) {
        var eventHandler = $action.GlobalEventHandlers[i];
        var attributeValue = $element.attr(eventHandler);
        if (attributeValue && attributeValue.length > 0) {
            if(!data){
                data = {};   
            }
            data[eventHandler] = attributeValue;
        }
    }

    return data;
}

var isActionable = function (element) {
    var tagName = element.tagName;
    return tagName && $action.ActionableElements[tagName] && $ction.ActionableElements[tagName](element);
}

var getEventHandlersOnPage = function () {
    var items = Array.prototype.slice.call(
        document.querySelectorAll('*')
    ).map(function (element) {
        var listeners = getListeners(element);
        return {
            selector: jQuery(element).getPath(),
            label: getElementLabel(element),
            tag: element.tagName,
            listeners: listeners ? Object.keys(listeners) : undefined
        };
    }).filter(function (item) {
        var element = jQuery(item.selector);
        return item && ((item.listeners && item.listeners.length > 0) || (element.length && element[0] && isActionable(element[0])));
    });

    return items;
};

jQuery(document).ready(function () {
    var items = getEventHandlersOnPage();
    window.postMessage(items, "*");
});