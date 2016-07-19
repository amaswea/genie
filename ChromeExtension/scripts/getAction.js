function getElementPath(elt) {
                var path, node = jQuery(elt);
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
            };

            $_IGNOREJQUERYFUNCTION = function ( e ) {

				// Discard the second event of a jQuery.event.trigger() and
				// when an event is called after a page has unloaded
				return typeof jQuery !== "undefined" && jQuery.event.triggered !== e.type ?
					jQuery.event.dispatch.apply( elem, arguments ) : undefined;
			};

            Element.prototype._addEventListener = Element.prototype.addEventListener;
            Element.prototype.addEventListener = function (a, b, c) {
                // Instrument the handler with a call to retreive the data dependencies
                var instrumented = $action.getInstrumentedHandler(b);
                this._addEventListener(a, instrumented, c);
                var handlerString = b.toString();
                if (handlerString != $_IGNOREJQUERYFUNCTION) {
                    window.postMessage({
                        messageType: 'eventAdded',
                        eventType: a,
                        handler: instrumented.toString(),
                        path: getElementPath(this)
                    }, "*");
                }
            };

            Element.prototype._removeEventListener = Element.prototype.removeEventListener;
            Element.prototype.removeEventListener = function (a, b, c) {
                this._removeEventListener(a, b, c);
                window.postMessage({
                    messageType: 'eventRemoved',
                    eventType: a,
                    handler: b.toString(),
                    path: getElementPath(this)
                }, "*");
            };

            jQuery.fn._on = jQuery.fn.on;
            jQuery.fn.on = function (events, selector, handler) { // TODO: handle when selector, data options are used
                jQuery.fn._on.apply(this, arguments);
                var handle = handler;
                if(selector != null && !handle){
                    handler = selector;
                }
                var instrumented = $action.getInstrumentedHandler(b);
                var eventList = events.split(" ");
                for (var i = 0; i < eventList.length; i++) {
                    var evt = eventList[i];
                    window.postMessage({
                        messageType: 'eventAdded',
                        eventType: evt,
                        handler: handler.toString(),
                        path: getElementPath(this)
                    }, "*");
                }
            }

            jQuery.fn._off = jQuery.fn.off;
            jQuery.fn.off = function (events, selector, handler) {
                jQuery.fn._off.apply(this, arguments);
                var eventList = events.split(" ");
                for (var i = 0; i < eventList.length; i++) {
                    var evt = eventList[i];
                    window.postMessage({
                        messageType: 'eventRemoved',
                        eventType: evt,
                        handler: handler ? handler.toString() : undefined, 
                        path: getElementPath(this)
                    }, "*");
                }
            };