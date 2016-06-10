// Sending and receiving messages from the window object
window.addEventListener("message", receiveMessage, false);

function receiveMessage(event) {
    var origin = event.origin || event.originalEvent.origin; // For Chrome, the origin property is in the event.originalEvent object.
    if (origin !== "http://example.org:8080")
        return;

    var data = event.data;
    if (data && data.action && data.selector) {
        var element = $(data.selector);
        if (element.length) {
            // Execute the action
            $(element).trigger(data.action);
        }
    }
}

$(document).ready(function () {
    var items = getEventHandlersOnPage();
    window.postMessage(items, "*");
});