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
                    window.postMessage({ messageType: 'eventAdded', commandType: a, handler: b.toString(), path: getElementPath(this)}, "*");
                };

                Element.prototype._removeEventListener = Element.prototype.removeEventListener;
                Element.prototype.removeEventListener = function (a, b, c) {
                    this._removeEventListener(a, b, c); 
                    window.postMessage({ messageType: 'eventRemoved', commandType: a, handler: b.toString(), path: getElementPath(this)}, "*");
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
        if (event.data.messageType == 'eventAdded') {
            var elementPath = event.data.path;
            if (elementPath && elementPath.length) {
                var element = $(elementPath);
                if (element && element.length) {
                    $action.dialogManager.addCommand(element[0], event.data);
                }
            }
        }

        if (event.data.messageType == 'eventRemoved') {
            var elementPath = event.data.path;
            if (elementPath && elementPath.length) {
                var element = $(elementPath);
                if (element && element.length) {
                    $action.dialogManager.removeCommand(element[0], event.data);
                }
            }
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
    if (msg.text === 'open') {
        $action.interface.show();
    }

    if (msg.text === 'close') {
        $action.interface.hide();
    }
});

$(document).ready(function () {
    injectMonitorScript();

    // Add an observer to watch when new elements are added to the page
    var mutationObserver = new $action.MutationWatcher();
    mutationObserver.init();
    
    $action.interface = new $action.KeyboardUI(); // Instantiate a new type of interface 
    // For other types of interfaces, they could be instantiated here or through a setting? 
});