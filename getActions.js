        var getEventHandlersOnPage = function () {
            var items = Array.prototype.slice.call(
                document.querySelectorAll('*')
            ).map(function (element) {
                var listeners = jQuery._data(element, "events");
                return {
                    element: element,
                    listeners: listeners != undefined ? Object.keys(listeners).map(function (k) {
                        return {
                            event: k,
                            listeners: listeners[k]
                        }
                    }) : undefined
                };
            }).filter(function (item) {
                return item.listeners ? items.listeners.length : undefined;
            });

            return items;
        };

        $(document).ready(function () {
            var items = getEventHandlersOnPage();
            alert("hey");
        });