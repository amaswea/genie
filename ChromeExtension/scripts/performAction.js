ActionableElementsActionFunction = {
    "A": function (element) {
        element.click();
    }, 
    "INPUT": function(element){
        element.focus();
    }
}

// Sending and receiving messages from the window object
window.addEventListener("message", receiveMessage, false);

function receiveMessage(event) {
    var origin = event.origin || event.originalEvent.origin; // For Chrome, the origin property is in the event.originalEvent object.
    if (event.source != window) {
        return;
    }

    var data = event.data;
    if (data && data.selector && data.tag) {
        var element = jQuery(data.selector);
        if (element.length) {
            // Execute the action
            if (data.action) {
                element.trigger(data.action);
            } 
            
            var actionFunction = ActionableElementsActionFunction[data.tag];
            if(actionFunction){
                if (actionFunction) {
                    actionFunction(element[0]);
                }
            }
        }
    }
    
    window.removeEventListener("message", receiveMessage);
}