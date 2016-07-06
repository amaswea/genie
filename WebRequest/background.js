chrome.webRequest.onCompleted.addListener(function (details) {
    var tabID = details.tabId;
 //   if (tabID !== -1) {
        chrome.tabs.sendMessage(tabID, {
            text: "Sending a message. Hello!", 
            url: details.url, 
            type: details.type
        });
 //   }
}, {
    urls: ["<all_urls>"]
});