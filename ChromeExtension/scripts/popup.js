$(document).ready(function () {
    var port = chrome.extension.connect({
        name: "TriggerSnapshot"
    });

    port.onMessage.addListener(function (msg) {
        if (msg.result = "Complete") {
            window.close();
        }
    });

    $('#snapshot').click(function () {

        //  Query for the current tab ID
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function (tabs) {
            if (tabs.length > 0) {
                // Send a message to the background script to udpate the snapshot
                var activeTab = tabs[0];
                port.postMessage({
                    action: "UpdateSnapshot",
                    id: activeTab.id
                });
            }
        });

    });

    $('#openAnalysis').click(function () {

        //  Query for the current tab ID
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function (tabs) {
            if (tabs.length > 0) {
                // Send a message to the background script to udpate the snapshot
                var activeTab = tabs[0];
                port.postMessage({
                    action: "OpenAnalysis",
                    id: activeTab.id
                });
            }
        });

    });


    $('#analyze').click(function () {
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function (tabs) {
            if (tabs.length > 0) {
                // Send a message to the background script to udpate the snapshot
                var activeTab = tabs[0];
                port.postMessage({
                    action: "AnalyzeSnapshot",
                    id: activeTab.id
                });
            }
        });
    });

    $('#closePopup').click(function () {
        window.close();
    });
});