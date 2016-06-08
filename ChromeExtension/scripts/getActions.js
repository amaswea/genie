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
                allSiblings = parent.children();
                var index = allSiblings.index(realNode) + 1;
                if (index > 1) {
                    name += ':nth-child(' + index + ')';
                }
            }

            path = name + (path ? '>' + path : '');
            node = parent;
        }

        return path;
    }
});

// May one day be more complex process
var getElementLabel = function (element) {
    var label = element.textContent;
    return label;
}

// Get all the listeners attached to an element
var getListeners = function(element) {
  var listeners = [];
  var data = jQuery._data ? jQuery._data(element, "events") : undefined;
  if(data){
    listeners.push(data); 
  }
};
  
var getEventHandlersOnPage = function () {
    var items = Array.prototype.slice.call(
        document.querySelectorAll('*')
    ).map(function (element) {
        var listeners = getListeners(element);
        return {
            selector: $(element).getPath(),
            label: getElementLabel(element),
            tag: element.tagName,
            listeners: listeners != undefined ? Object.keys(listeners) : undefined
        };
    }).filter(function (item) {
        return (item && item.listeners) ? item.listeners.length : undefined;
    });

    return items;
};

$(document).ready(function () {
    var items = getEventHandlersOnPage();
    window.postMessage(items, "*");
});