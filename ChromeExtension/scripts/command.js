"use strict";
var $action = $action || {};
(function ($action) {


    $action.ActionableElementsActionLabel = {
        "A": "Click",
        "INPUT": "Fill out"
    };

    $action.ActionableElements = {
        "A": function (element) {
            var href = jQuery(element).attr("href");
            return href && href.length > 0;
        },
        "INPUT": function (element) {
            var type = jQuery(element).attr("type");
            return type && type != "hidden";
        }
    };

    $action.CommandLabels = {
        "INPUT": function (element) { // Get the label from the placeholder attribute
            var placeholder = jQuery(element).attr("placeholder");
            return placeholder;
        },
        "A": function (element) {
            var title = jQuery(element).attr("title");
            if (title && title.length) {
                return title;
            }

            var innerText = jQuery(element).contents().first().text().trim();
            return innerText;
        }
    };

    $action.GlobalEventHandlers = [
        "onclick", "onmouseover"
    ];

    $action.GlobalEventHandlerMappings = { // TODO: Add the rest
        "onclick": "click",
        "onmouseover": "mouseover"
    };

    /*    $action.MouseOrders = {
            "click": ["mousedown", "mouseup", "click"], // TODO: right click 
            "dblclick": ["mousedown", "mouseup", "click", "mousedown", "mouseup", "click"],
            "cut": ["mousedown", "mouseup", "select", "copy"],
            "copy": ["mousedown", "mouseup", "select", "cut", "input"],
            "paste": ["mousedown", "mouseup", "paste", "input"]
        }

        $action.KeyboardOrders = {
            "click": ["keydown", "keypress", "click", "keyup"], // TODO: right click 
            //"dblclick":  Cannot be executed by a seqence of two enter keys.. Might be different in other browsers? Need to test
            "cut": ["keydown", "keydown", "cut", "input", "keyup", "keyup"], // TOOD: Need to pass in the right keycodes for input
            "paste": ["keydown", "keydown", "paste", "input", "keyup", "keyup"],
            "copy": ["keydown", "keydown", "copy", "input", "keyup", "keyup"],
            "input": ["keydown", "keypress", "input", "keyup"]
        }*/

    /* $action.CommandInputs = {
         "cut": ["ctrl", "x", "" "", "ctrl", "x"]
     };*/

    class Command {
        constructor(eventType, domElement, handler) {
            this._eventType = eventType;
            this._domElement = domElement; // The DOM element the command is associated with
            this._handler = handler;
        }

        get EventType() {
            return this._eventType;
        };

        get Element() {
            return this._domElement;
        }

        /**
         * Return whether the command can be invoked by a user 
         * @private
         * @property undefined
         */
        userInvokable() {
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

        /**
         * The set of data dependencies that the command has (control dependencies)
         * Example: enabled state of another element, etc. 
         */
        dataDependencies() {

        };

        /**
         * Returns whether the command is currently enabled (can be performed)
         */
        enabled() {

        };


        visible() {
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
        }

        /**
         * Command or set of commands that the command is dependent on being executed before it can be executed
         */
        eventDependencies() {

        };

        /**
         * The set of commands that must be executed based on the nature of the device
         * @private
         * @property undefined
         */
        deviceDependencies() {

        };

        /**
         * Attach this callback to the keystrokes or action that you want to execute the command
         */
        execute() {
            var self = this;
            return function (evt) {
                evt.preventDefault();
                evt.stopPropagation();

                var s = document.createElement('script');
                s.src = chrome.extension.getURL("scripts/performAction.js");
                (document.head || document.documentElement).appendChild(s);

                var action = {
                    event: self.EventType,
                    selector: $action.getElementPath(self.Element)
                }

                window.postMessage(action, "*");

                // Unload the script
                (document.head || document.documentElement).removeChild(s);
            };
        };
    };

    $action.Command = Command;
})($action);