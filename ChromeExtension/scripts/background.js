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

    /**
     * Open a connection to the popup script to listen for update snapshot and analyze requests
     * @param  {int} The port number
     */
    chrome.browserAction.onClicked.addListener(function (tab) {
        // TBD 
        chrome.tabs.sendMessage(tab.id, {
            text: 'getActions'
        });
    });


    /**
     * Listen for tab update events and send a message when the page is loading to inject the event monitoring script
     */
    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
        if (changeInfo.status == "loading") {
            chrome.tabs.sendMessage(tab.id, {
                text: 'monitorActions'
            });
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