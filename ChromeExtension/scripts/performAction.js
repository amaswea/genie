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
window.addEventListener("message", receiveMessage, false, false, true);

/**
 * Receive a message from the content script to perform the given action
 * @private
 * @method receiveMessage
 * @param {Object} event
 */

// REMINDER: Don't add dependencies on JQuery in here because the webpage may not be using it
function receiveMessage(event) {
    var origin = event.origin || event.originalEvent.origin; // For Chrome, the origin property is in the event.originalEvent object.
    if (event.source != window) {
        return;
    }

    // Handle triggering the evnet
    var data = event.data;
    if (data && data.elementID && data.messageType == "performAction") {
        debugger;
        var element = document.querySelector("[data-genie-element-id='" + data.elementID + "']");
        if (element) {
            // Execute the action using the trigger or the associated action function
            if (data.event != 'default') {
                var event = data.event;

                // TODO: Verify that all UIEvent types are cancelable and bubble
                var eventObj = new Event(event, {
                    "bubbles": true,
                    "cancelable": false
                });

                element.dispatchEvent(eventObj);
            } else {
                var actionFunction = $action.ActionableElementsActionFunction[element.tagName];
                if (actionFunction) {
                    if (actionFunction) {
                        actionFunction(element);
                    }
                }
            }
        }
        
        window.removeEventListener("message", receiveMessage, null, false, true);
    }
};