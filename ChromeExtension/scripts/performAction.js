"use strict";
var $action = $action || {};

$action.ActionableElementsActionFunction = {
    "A": function (element) {
        element.click();
    },
    "INPUT": function (element) {
        element.focus();
    }
}

// Sending and receiving messages from the window object
window.addEventListener("message", receiveMessage, false);

/**
 * Receive a message from the content script to perform the given action
 * @private
 * @method receiveMessage
 * @param {Object} event
 */
function receiveMessage(event) {
    var origin = event.origin || event.originalEvent.origin; // For Chrome, the origin property is in the event.originalEvent object.
    if (event.source != window) {
        return;
    }

    var data = event.data;
    if (data && data.selector) {
        var element = jQuery(data.selector);
        if (element.length) {
            // Execute the action using the trigger or the associated action function
            if (data.events.length > 1) {
                for (var i = 0; i < data.events.length; i++) {
                    var event = data.events[i];

                    // TODO: Verify that all UIEvent types are cancelable and bubble
                    var eventObj = new Event(event, {"bubbles":true, "cancelable":false});
                    if(data.inputs) {
                        var input = data.inputs[i]; // Assume data.inputs is same length as data.events
                        
                    }
                    element[0].dispatchEvent(eventObj);
                }
            } else if (data.events.length == 1 && data.events[0] == 'default') {
                var actionFunction = $action.ActionableElementsActionFunction[element[0].tagName];
                if (actionFunction) {
                    if (actionFunction) {
                        actionFunction(element[0]);
                    }
                }
            }
        }
    }

    window.removeEventListener("message", receiveMessage);
};