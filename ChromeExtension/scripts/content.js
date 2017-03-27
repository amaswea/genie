window.addEventListener("message", receiveMessage, false);
var $genie = $genie || {};

$(document).ready(function () {
    // For other types of interfaces, they could be instantiated here or through a setting?

    // Add an observer to watch when new elements are added to the page
    $genie.mutationObserver = new $genie.MutationWatcher();
    $genie.mutationObserver.init();

    injectScript("scripts/performAction.js");

    // Parse all script tags in the page and add them as scripts
    var scripts = $('script').not('#genie_monitor_script');
    for (var i = 0; i < scripts.length; i++) {
        var script = scripts[i];
        if (!script.attributes.src) {
            var innerHTML = script.innerHTML;
            $genie.scriptManager.addScript("page", innerHTML);
        }
    }

    // Begin polling to update command states
    setTimeout(injectGlobalEventHandlerOverrides, 0); // ACK -- - Fix this in the future
    setTimeout(updateCommandEnabledStates, 2000);
    setTimeout(updateVisibleCommands, 2000);
});

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
    var header = document.head || document.documentElement;
    var monitorScript = $genie.getScript();
    var hasScript = document.querySelector("[id='genie_monitor_script]");
    if (hasScript) {
        hasScript.remove();
    }

    var script = $(header).children("script").first();
    header.insertBefore(monitorScript, script[0]);
};


/**
 * Description for injectGlobalEventHandlerOverrides
 * @private
 * @method injectGlobalEventHandlerOverrides
 */
function injectGlobalEventHandlerOverrides() {
    // Inject the getActions.js script into the page
    var header = document.head || document.documentElement;
    var monitorScript = $genie.getGlobalEventHandlerScript();
    var hasScript = document.querySelector("[id='genie_global_handlers_script']");
    if (hasScript) {
        hasScript.remove();
    }

    var script = $(header).children("script").first();
    header.insertBefore(monitorScript, script[0]);
};

/**
 * Description for injectMonitorScript
 * @private
 * @method injectMonitorScript
 */
function injectJQueryD3OverrideScript() {
    // Inject the getActions.js script into the page
    var header = document.head || document.documentElement;
    var overrideScript = $genie.getJQueryD3OverrideScript();
    var hasScript = document.querySelector("[id='genie_jquery_d3_override_script']");
    if (hasScript) {
        hasScript.remove();
    }

    var script = $(header).children("script").first();
    header.insertBefore(overrideScript, script[0]);
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
            $genie.commandsChanged = true;
            var element = $genie.getElementFromID(event.data.elementID);
            if (element) {
                if (!$genie.commandManager.hasCommand(event.data.id)) {
                    //console.log("adding new command " + event.data.id + " " + event.data.eventType + " " + //event.data.elementID);
                    var added = $genie.commandManager.addCommand(event.data);

                    var dataDependencies = {};
                    if (added) {
                        // Returns a new object with the computed expression string representing the data dependencies. 
                        var ast = $genie.getAST(event.data);
                        if (!$genie.hasSideEffectsOutsideConditionals(ast)) {
                            dataDependencies = $genie.getDataDependencies(ast);
                            event.data.dependencies = dataDependencies;
                            event.data.messageType = 'eventDependenciesFound';
                            window.postMessage(event.data, "*")
                        }
                    } else {
                        event.data.messageType = 'eventDependenciesNotFound';
                        window.postMessage(event.data, "*")
                    }
                };
            }
        }

        if (event.data.messageType == 'eventRemoved') {
            $genie.commandsChanged = true;
            var element = $genie.getElementFromID(event.data.elementID);
            if (element) {
                $genie.commandManager.removeCommand(element, event.data);
            }

        }

        if (event.data.messageType == 'updateCommandEnabledStates') {
            var newStates = event.data.commandStates;

            var keys = Object.keys(newStates);
            for (var i = 0; i < keys.length; i++) {
                var value = newStates[keys[i]];
                //  console.log("id: " + keys[i] + " state: " + value);
            }

            $genie.commandManager.updateCommandEnabledStates(newStates);
            $genie.commandManager.organizeCommands();
        }
    }
};

/**
 * Post a message to the window object to get the updated command states
 * @private
 * @method getCommandStates
 */
function updateCommandEnabledStates() {
    window.postMessage({
        messageType: 'getCommandStates'
    }, "*");

    $genie.commandsChanged = false;
  //  setTimeout(updateCommandEnabledStates, 5000);
}

function updateVisibleCommands() {
    $genie.commandManager.updateVisibleCommands();
    setTimeout(updateVisibleCommands, 2000);
}

function organizeCommands() {
    //  setTimeout(organizeCommands, 5000);
}

/**
 * Detect origin and check that the url is from the same origin
 * @private
 * @method isFromSameOrigin
 * @param {Object} url
 */
function isFromSameOrigin(url) {
    var origin = window.location.origin;
    return url.includes(origin);
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
        $genie.interface.show();
    }

    if (msg.text === 'close') {
        $genie.interface.hide();
    }

    if (msg.text === 'scriptReceived') {
        var data = msg.data;
        var url = msg.url;
        if (data && data.length) {
            var orig = window.location.origin;
            if (!$genie.scriptManager) {
                $genie.scriptManager = new $genie.ScriptManager();
            }

            if (isFromSameOrigin(url)) {
                $genie.scriptManager.addScript(url, data);
            }
        }
    }
});

(function initializeCommandManager() {
    document.addEventListener("DOMContentLoaded", function (event) {
        // Can only override any jQuery or D3 event registrations that occur during or after document.ready
        injectJQueryD3OverrideScript();

        // Override page and element GlobalEvent
        // injectGlobalEventHandlerOverrides();
    });

    // Initialize the script manager if not already initialized
    if (!$genie.scriptManager) {
        $genie.scriptManager = new $genie.ScriptManager();
    }

    $genie.interface = new $genie.AudioUI();

    // Create a new instance of the command manager with this instance of the UI
    $genie.commandManager = new $genie.CommandManager($genie.interface, $genie.scriptManager);

    // injectJQueryD3OverrideScript();

    // Must be injected before document intialization to intercept all addEventListener calls
    injectMonitorScript();
})();