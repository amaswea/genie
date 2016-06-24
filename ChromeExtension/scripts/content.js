window.addEventListener("message", receiveMessage, false);
var $action = $action || {};

/**
 * Description for injectScript
 * @private
 * @method injectScript
 * @param {Object} script
 */
function injectScript(script) {
    var s = document.createElement('script');
    s.src = chrome.extension.getURL(script);
    s.type = "text/javascript";

    s.onload = function () {
        this.parentNode.removeChild(this);
    };

    var header = document.head || document.documentElement;
    header.appendChild(s);
};

/**
 * Description for injectMonitorScript
 * @private
 * @method injectMonitorScript
 */
function injectMonitorScript() {
    // Inject the getActions.js script into the page
    var s = document.createElement('script');
    s.type = "text/javascript";
    s.text = `function getElementPath(elt) {
                        var path, node = $(elt);
                        while (node.length) {
                            var realNode = node[0],
                                name = realNode.localName;
                            if (!name) break;
                            name = name.toLowerCase();

                            var parent = node.parent();

                            var sameTagSiblings = parent.children(name);
                            if (sameTagSiblings.length > 1) {
                                var allSiblings = parent.children();
                                var index = allSiblings.index(realNode) + 1;
                                name += ':nth-child(' + index + ')';
                            }

                            path = name + (path ? '>' + path : '');
                            node = parent;
                        }

                    return path;
                }

                Element.prototype._addEventListener = Element.prototype.addEventListener; 
                Element.prototype.addEventListener = function (a, b, c) {
                    this._addEventListener(a, b, c);
                    window.postMessage({ messageType: 'eventAdded', eventType: a, handler: b.toString(), path: getElementPath(this)}, "*");
                };

                Element.prototype._removeEventListener = Element.prototype.removeEventListener;
                Element.prototype.removeEventListener = function (a, b, c) {
                    this._removeEventListener(a, b, c); 
                    window.postMessage({ messageType: 'eventRemoved', eventType: a, handler: b.toString(), path: getElementPath(this)}, "*");
                };`;

    var header = document.head || document.documentElement;
    var script = $(header).children("script").first();
    header.insertBefore(s, script[0]);
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

    // Check the type of the message returned, and add or remove the command from the dialog accordingly
    if (event.data) {
        if (!$action.commands) {
            $action.commands = [];
        }

        if (event.data.messageType == 'eventAdded') {
            $action.commands.push(event.data);
            $action.dialogManager.addCommand(event.data);
            console.log("command found " + event.data.eventType);
            console.log("command path " + event.data.path);
        }

        if (event.data.messageType == 'eventRemoved') {
            var index = $action.commands.indexOf(event.data);
            $action.commands.splice(index, 1);
            $action.dialogManager.removeCommand(event.data);
        }
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
    if (msg.text === 'openDialog') {
        $action.dialogManager.showDialog();
    }

    if (msg.text === 'closeDialog') {
        $action.dialogManager.hideDialog();
    }
});

$(document).ready(function () {
    $action.dialogManager = new $action.DialogManager();
    $action.dialogManager.initializeDialog();
    injectMonitorScript();
});