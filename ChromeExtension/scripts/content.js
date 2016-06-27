window.addEventListener("message", receiveMessage, false);
var $action = $action || {};

/**
* Description for addCommandFromElement
* @private
* @method addCommandFromElement
* @param {Object} element
*/
function addCommandFromElement(element) {
    var tagAdded = element.tagName;
    var hasAction = $action.ActionableElements[tagAdded] != undefined;
    if (hasAction) {
        var isActionable = $action.ActionableElements[tagAdded](element);
        if (isActionable) {
            var commandData = {
                path: $action.getElementPath(element)
            }

            if (!$action.commands) {
                $action.commands = [];
            }

            $action.dialogManager.addCommand(commandData);
            $action.commands.push(commandData);
        }
    }
};

/**
 * Description for observeMutations
 * @private
 * @method observeMutations
 */
function observeMutations() {
    // select the target node
    var target = document.body;

    // create an observer instance
    var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            var addedNodes = mutation.addedNodes;
            if (addedNodes && addedNodes.length) {
                for (var i = 0; i < addedNodes.length; i++) {
                    var added = addedNodes[i];
                    if (added.tagName) {
                        addCommandFromElement(added);
                    }
                }
            }
        });
    });

    // configuration of the observer:
    var config = {
        childList: true,
        subtree: true
    };

    // pass in the target node, as well as the observer options
    observer.observe(target, config);
};

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

    // Add an observer to watch when new elements are added to the page
    observeMutations();

    // Extract all of the non-event commands from the page
    var allElements = document.querySelectorAll("*");
    for (var i = 0; i < allElements.length; i++) {
        var element = allElements[i];
        addCommandFromElement(element);
    }
});