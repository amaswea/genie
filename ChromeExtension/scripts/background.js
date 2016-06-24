$(document).ready(function () {
    /** 
     * What do I need? 
     *  - Find all interactive elements on a page
     *  - What is an interactive element? 
     *       - Has an event handler attached to it. 
     *       - Is a link or button? Are there any others that are interactive by default? 
     *           - button - Needs to be submit or reset and inside of a form element or associated with some event handler
     *           - link - Only if it has href and other certain attributes that cause some action
     *           - Interactive content - https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Content_categories
     * jQuery._data($0, "events")
     * getEventListeners - Chrome dev tools - Is this in JS? 
     * 
     */

    var saveDialogState = function (open) {
        // Save the current state of the dialog in Chrome extension storage API
        chrome.storage.sync.set({
            'dialogState': open
        }, function () {
            console.log("dialog state saved to " + open);
        });
    };


    var restoreDialogState = function (tab) {
        chrome.storage.sync.get('dialogState', function (object) {
            if (!chrome.runtime.lastError && object && object.dialogState) {
                chrome.tabs.sendMessage(tab.id, {
                    text: 'openDialog'
                });
            } else {
                chrome.tabs.sendMessage(tab.id, {
                    text: 'closeDialog'
                })
            }
        });
    }

    var updateDialogState = function (tab) {
        chrome.storage.sync.get('dialogState', function (object) {
            if (!chrome.runtime.lastError && object && !object.dialogState) {
                chrome.tabs.sendMessage(tab.id, {
                    text: 'openDialog'
                });

                saveDialogState(true);
            } else {
                chrome.tabs.sendMessage(tab.id, {
                    text: 'closeDialog'
                })

                saveDialogState(false);
            }
        });
    }

    /**
     * Open a connection to the popup script to listen for update snapshot and analyze requests
     * @param  {int} The port number
     */
    chrome.browserAction.onClicked.addListener(function (tab) {
        updateDialogState(tab);
    });

    chrome.tabs.onUpdated.addListener(function (tabID, changeInfo, tab) {
        if (changeInfo.status == "complete") {
            restoreDialogState(tab);
        }
    });

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.updateDialogState) {
            var dialogState = request.dialogState;
            saveDialogState(dialogState);
        }
    });

    /**
     * Description for undefined
     * @private
     * @method undefined
     * @param {Object} function (command
     */
    chrome.commands.onCommand.addListener(function (command) {
        console.log('Command:', command);
    });
});