"use strict";
var $action = $action || {};
(function ($action) {
    class DialogManager {
        constructor() {
            this.dialog = undefined;
            this.actionItems = [];
            this.actionManager = new $action.ActionManager();
        }

        initializeDialog() {
            var dialog = document.createElement("div");
            dialog.classList.add("action-search");
            var list = document.createElement("ul");
            list.classList.add("action-search-list");

            var label = document.createElement("div");
            label.classList.add("action-search-label");

            dialog.appendChild(label);
            dialog.appendChild(list);
            $('html').append(dialog);

            this.dialog = dialog;
            this.list = list;
            this.label = label;
            
            $('body').click(this.disposeDialog);
        };

        populateDialog(items) {
            var keyActionModifier = 0;
            var visibleElements = 0;
            for (var i = 0; i < items.length; i++) {
                var elt = items[i];
                var listeners = elt.listeners;
                if (listeners) {
                    for (var j = 0; j < listeners.length; j++) {
                        var listener = listeners[j];
                        var item = this.createDialogCommand(elt, keyActionModifier, listener);
                        if (item) {
                            visibleElements++;
                            this.list.appendChild(item);
                        }

                        keyActionModifier++;
                    }
                } else {
                    var item = this.createDialogCommand(elt, keyActionModifier);
                    if (item) {
                        visibleElements++;
                        this.list.appendChild(item);
                    }

                    keyActionModifier++;
                }
            }

            this.label.textContent = "There were " + visibleElements + " actions found ...";

            $(window).scroll(_.throttle(this.repositionDialog, 1));
            this.repositionDialog();
        };

        repositionDialog() {
            var dialog = $('.action-search');

            var scrollTop = $(window).scrollTop();
            var top = $(window).height() + scrollTop - dialog.height();
            dialog[0].style.top = top + "px";            
        };

        disposeDialog() {
            $('.action-search').remove();
            $(window).unbind("scroll", this.repositionDialog);
        }

        createDialogCommand(item, modifier, listener) {
            var selector = item.selector;
            var element = jQuery(selector);
            if (element.length && this.commandIsVisible(element[0])) {
                var newAction = this.actionManager.create(item, modifier, listener);
                this.actionItems.push(newAction);
                return newAction;
            }
        }

        commandIsVisible(domNode) {
            //  var visible = $(domNode).is(':visible');
            var element = $(domNode);
            var displayed = element.css('display') != "none";
            var visibility = element.css('visibility') != "hidden";
            var heightBigEnough = element.height() > 10;
            var widthBigEnough = element.width() > 10;
            var notClear = element.css('opacity') != "0" && element.css('opacity') != "0.0";
            var offLeftRight = (element.offset().left >= window.innerWidth) || ((element.offset().left + element.offsetWidth) <= 0);
            var hidden = $(domNode).attr('type') == 'hidden';
            var visible = $(domNode).is(':visible');

            if (visible && displayed && visibility && heightBigEnough && widthBigEnough && notClear && !offLeftRight && !hidden) {
                return true;
            }

            return false;
        };
        
        commandIsAvailable(domNode){
            // Ways that a command can not be available
            // 1. Command is not visible
            //    - Display set to None
            //    - Visibility set to hidden
            //    - Height or width too small
            //    - Opaque (opacity)
            //    - Offscreen
            //    - Hidden attribute
            //    - Z-index is hiding it behind something else
            // 2. Command is disabled 
            // 3. Command results in no effect because of input guards or conditions in the code
            // 4. Command is not yet in the DOM (Hovering over a menu adds menu items with commands to DOM)
        };
    };

    $action.DialogManager = DialogManager;
})($action);