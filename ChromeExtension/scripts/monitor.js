jQuery.fn.extend({
    getPath: function () {
        var path, node = this;
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
});

(function () {
    Element.prototype._addEventListener = Element.prototype.addEventListener;
    Element.prototype.addEventListener = function (a, b, c) {
        this._addEventListener(a, b, c);
        window.postMessage({ messageType: 'eventAdded', commandType: a, handler: b, path: jQuery(this).getPath()}, "*");
    };
})();

(function () {
    Element.prototype._removeEventListener = Element.prototype.removeEventListener;
    Element.prototype.removeEventListener = function (a, b, c) {
        this._removeEventListener(a, b, c);
        window.postMessage({ messageType: 'eventRemoved', commandType: a, handler: b, path: jQuery(this).getPath()}, "*")
    };
})();



