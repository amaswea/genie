chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    console.log("a message received: " + msg.text);
    console.log("The url of the resource is: " + msg.url);
    console.log("The type of the resource is: " + msg.type);
});