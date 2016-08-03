"use strict";
var $action = $action || {};
(function ($action) {
    class CommandLineUI extends $action.UI {
        constructor() {
            super();
            // Keep a map between the command labels and their execute() calls so that we can map audio commands to call commands
            this._commandsMap = {};
            this.init();
        }

        init() {
            var commandLine = document.createElement("div");
            $(commandLine).attr("id", "genie-command-line-ui");

            $('html').append(commandLine);
        };

        mapTextToCommand(text) {
            // Find the commands corresponding execute() method in the commandsMap
            let command = this._commandsMap[commandText];
            if (command) {
                // Call the execute method to perform the command
                command.execute();
            }
        }
    };

    $action.CommandLineUI = CommandLineUI;
})($action);