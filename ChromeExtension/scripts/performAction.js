// Sending and receiving messages from the window object
window.addEventListener("message", receiveMessage, false);

function receiveMessage(event) {
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
});