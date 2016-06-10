/**
 * Override addEventListener to keep a list of currently registered listeners that use this method
 */
(function () {
    Element.prototype._addEventListener = Element.prototype.addEventListener;
    Element.prototype.addEventListener = function (a, b, c) {
        this._addEventListener(a, b, c);
        if (!this.eventListenerList) this.eventListenerList = {};
        if (!this.eventListenerList[a]) this.eventListenerList[a] = [];
        this.eventListenerList[a].push(b);

        // Send the updated list back to the content script 
        // TODO: Send one at a time or send the whole set of events at once? 
     //   window.postMessage(this.eventListenerList);
    };
})();

/**
 * Override removeEventListener to intercept calls and remove them from the list
 */
(function () {
    Element.prototype._removeEventListener = Element.prototype.removeEventListener;
    Element.prototype.removeEventListener = function (a, b, c) {
        this._removeEventListener(a, b, c);
        if (!this.eventListenerList) return;
        if (!this.eventListenerList[a]) return;
        var index = this.eventListenerList[a].indexOf(b);
        this.eventListenerList[a].splice(index);
    };


    // Send the updated list back to the content script 
    // TODO: Send one at a time or send the whole set of events at once? 
   // window.postMessage(this.eventListenerList);
})();