$(document).ready(function () {
    /**
     * Save the current active state of the interface
     * @private
     * @method saveInterfaceState
     * @param {Object} open
     */
    var saveInterfaceState = function (open) {
        // Save the current state of the interface in Chrome extension storage API
        chrome.storage.sync.set({
            'interfaceState': open
        }, function () {
            console.log("interface state saved to " + open);
        });
    };

    /**
     * Restore the saved state of the interface
     * @private
     * @method restoreInterfaceState
     * @param {Object} tab
     */
    var restoreInterfaceState = function (tab) {
        chrome.storage.sync.get('interfaceState', function (object) {
            if (!chrome.runtime.lastError && object && object.interfaceState) {
                chrome.tabs.sendMessage(tab.id, {
                    text: 'open'
                });
            } else {
                chrome.tabs.sendMessage(tab.id, {
                    text: 'close'
                })
            }
        });
    }

    /**
     * Persist the current open or close staste of the interface
     * @private
     * @method updateState
     * @param {Object} tab
     */
    var updateInterfaceState = function (tab) {
        chrome.storage.sync.get('interfaceState', function (object) { // TODO: is this going to clash? 
            if (!chrome.runtime.lastError && object && !object.interfaceState) {
                chrome.tabs.sendMessage(tab.id, {
                    text: 'open'
                });

                saveInterfaceState(true);
            } else {
                chrome.tabs.sendMessage(tab.id, {
                    text: 'close'
                })

                saveInterfaceState(false);
            }
        });
    }

    /**
     * Open a connection to the popup script to listen for update snapshot and analyze requests
     * @param  {int} The port number
     */
    chrome.browserAction.onClicked.addListener(function (tab) {
        updateInterfaceState(tab);
    });

    chrome.tabs.onUpdated.addListener(function (tabID, changeInfo, tab) {
        if (changeInfo.status == "complete") {
            restoreInterfaceState(tab);
        }
    });

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.updateInterfaceState) {
            var interfaceState = request.interfaceState;
            restoreInterfaceState(interfaceState);
        }
    });

    /**
     * Intercept completed script requests and notify the content script to update its script cache
     * @private
     * @method undefined
     * @param {Object} function (details)
     */
    // Potentially cache scripts later if performance becomes an issue
    chrome.webRequest.onCompleted.addListener(function (details) {
        var tabID = details.tabId;
        if (tabID !== -1 && details.type == "script") {
            $.get(details.url)
                .done(function (data) {
                    chrome.tabs.sendMessage(tabID, {
                        text: 'scriptReceived',
                        data: data
                    });
                })
                .fail(function () {
                    console.log("error");
                })
                .always(function () {
                    console.log("complete");
                });
        }

    }, {
        urls: ["<all_urls>"]
    });
});