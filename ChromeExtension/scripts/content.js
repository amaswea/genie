
window.addEventListener("message", receiveMessage, false);
var $action = $action || {};

/**
* Description for undefined
* @private
* @property undefined
* @param {Object} script
*/
function injectScript(script) {
    // Inject the getActions.js script into the page
    var s = document.createElement('script');
    s.src = chrome.extension.getURL(script);
    s.onload = function () {
      this.parentNode.removeChild(this);
    };
    (document.head || document.documentElement).appendChild(s);
};

/**
* Receive the message from the getActions script and update the dialog with the new actions
* @private
* @property undefined
* @param {Object} event
*/
function receiveMessage(event) {
    if (event.source != window) {
        return;
    }

    if (event.data.length && event.data[0].selector) {
        $action.dialogManager.initializeDialog();
        $action.dialogManager.populateDialog(event.data);
    }
}

/**
* Listen for messages from the background script and return the requested information
* @private
* @method undefined
* @param {Object} function (msg
* @param {Object} sender
* @param {Object} sendResponse
*/
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
    $action.dialogManager = new $action.DialogManager();
})