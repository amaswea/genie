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