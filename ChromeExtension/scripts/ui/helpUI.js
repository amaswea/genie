"use strict";
var $action = $action || {};
(function ($action) {
    class HelpUI extends $action.UI {
        constructor() {
            // Keep a map between the command labels and their execute() calls so that we can map audio commands to call commands
            super();
            this.init();
        }

        init() {

        };

        hide() {}

        show() {} // Override show and hide methods to do nothing since this help interface has no special UI. 

        appendCommandGroup(label, commands) {
            for (var i = 0; i < commands.length; i++) {
                var newCommand = new $action.CommandItem(commands[i]);
                commands[i].CommandItem = newCommand;

                // When a command gets added, add a glowing border around the command element
                var commandElement = commands[i].Element;
                if (!(commandElement instanceof Window) && !(commandElement instanceof Document)) { // TODO: make this generic
                    var x1 = commandElement.getBoundingClientRect().left;
                    var y1 = commandElement.getBoundingClientRect().top;
                    var x2 = commandElement.getBoundingClientRect().right;
                    var y2 = commandElement.getBoundingClientRect().bottom;

                    var canvas = document.createElement('canvas');
                    canvas.classList.add('genie-help-ui-highlighter');
                    canvas.height = Math.abs(y2 - y1);
                    canvas.width = Math.abs(x2 - x1);
                    canvas.style.position = 'absolute';

                    canvas.style.left = x1 + 'px';
                    canvas.style.top = y1 + 'px';

                    var context = canvas.getContext('2d');
                    context.beginPath();
                    context.fillStyle = "rgba(65,105,225,0.5)";
                    context.rect(0, 0, Math.abs(x2 - x1), Math.abs(y2 - y1));
                    context.fill();
                    $('html').append(canvas);
                }
            }
        }
    };

    $action.HelpUI = HelpUI;
})($action);