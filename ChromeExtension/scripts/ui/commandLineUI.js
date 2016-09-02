"use strict";
var $action = $action || {};
(function ($action) {
    class CommandLineUI extends $action.UI {
        constructor() {
            // Keep a map between the command labels and their execute() calls so that we can map audio commands to call commands
            super();
            this._commandsMap = {};
            this.init();
        }

        init() {
            var commandLine = document.createElement("div");
            $(commandLine).attr("id", "genie-command-line-ui");
            var label = document.createElement("div");
            label.classList.add("genie-command-line-label");
            label.textContent = "Enter a command.";

            var textarea = document.createElement("textarea");
            textarea.classList.add("genie-command-line-text");
            textarea.classList.add("genie-ui-component")
            commandLine.appendChild(label);
            commandLine.appendChild(textarea);
            this.Root = commandLine;
            this._textarea = textarea;
            this.attachListeners(textarea);
            this._textarea.value = this._textarea.value + "Type commands to see the list of available commands...\n";

            $('html').append(commandLine);

            this.hide();
            $(window).scroll(_.throttle(this.repositionCommandLineArea, 1));

            // Canvas
            var canvas = document.createElement("canvas");
            canvas.classList.add("genie-audio-ui-input-canvas");
            $('html').append(canvas);
            this.canvas = canvas;
            this.canvas.style.display = "none";
        };

        appendCommandGroup(label, commands) {
            // Groups
            for (var i = 0; i < commands.length; i++) {
                if(label == "")
                var newCommand = new $action.CommandItem(commands[i]);
                commands[i].CommandItem = newCommand;

                /*                if (!commands[i].userInvokeable()) {
                                    newCommand.DOM.classList.add('genie-audio-ui-disabled');
                                }*/

                if (commands[i].hasArguments()) {
                    var commandArgumentKeys = Object.keys(commands[i].ArgumentsMap);
                    for (var j = 0; j < commandArgumentKeys.length; j++) {
                        this._commandsMap[commandArgumentKeys[j]] = newCommand.Command;

                    }
                } else {
                    let commandLabel = newCommand.firstImperativeLabel().toLowerCase();
                    this._commandsMap[commandLabel] = newCommand.Command;
                }
            }
        }

        attachListeners(element) {
            var self = this;
            element.addEventListener("keydown", function handlerInput(evt) {
                var keyCode = evt.keyCode || evt.which;
                if (keyCode == '13') {
                    // Get the text entered on the previous line of the text area to use as the command
                    var textAreaValue = element.value.split(/\n/);
                    if (textAreaValue && textAreaValue.length) {
                        var lastCommand = _(textAreaValue).last().trim();
                        if (lastCommand && lastCommand.length) {
                            self.mapTextToCommand(lastCommand.toLowerCase());
                        }
                    }
                }
                evt.stopPropagation();
            }, null, false, true);
        }

        repositionCommandLineArea() {
            var commandLine = $('#genie-command-line-ui');

            var scrollTop = $(window).scrollTop();
            var top = $(window).height() + scrollTop - commandLine.height() - 20;
            commandLine[0].style.top = top + "px";
        };

        drawGridAndGetInput(width, height, x, y) {
            var bw = width;
            var bh = height;
            var p = 10;

            var canvas = this.canvas;
            var context = canvas.getContext("2d");
            canvas.style.position = "absolute";
            canvas.style.left = x + "px";
            canvas.style.top = y + "px";
            canvas.style.width = width + "px";
            canvas.style.height = height + "px";

            function drawBoard() {
                var cellNumber = 1;
                for (var x = 0; x <= bw; x += 20) {
                    context.moveTo(0.5 + x + p, p);
                    context.lineTo(0.5 + x + p, bh + p);

                    var x = 0.5 + x + p;
                    var y = p;
                    context.strokeText(cellNumber.toString(), x, y, 10);
                    cellNumber++;
                }


                cellNumber = 1;
                for (var x = 0; x <= bh; x += 20) {
                    context.moveTo(p, 0.5 + x + p);
                    context.lineTo(bw + p, 0.5 + x + p);
                }

                context.strokeStyle = "black";
                context.lineWidth = 1; 
                context.stroke();
            }

            drawBoard();
            this.canvas.style.display = "";
            
            return prompt("Please enter a column.");
        }
        
        calculateMousePosition(column, width, height, x, y){
            var mousePosition = x; 
            var lineWidth = 20; 
            mousePosition = mousePosition + column * lineWidth + 10; 
            console.log(mousePosition);
            return mousePosition;
        }

        mapTextToCommand(text) {
            if (text == "commands") {
                var commandLabels = Object.keys(this._commandsMap);
                var labelString = "";
                for (var i = 0; i < commandLabels.length; i++) {
                    labelString = labelString + commandLabels[i];
                    if (i < commandLabels.length - 1) {
                        labelString = labelString + ",";
                    }
                }
                this._textarea.value = this._textarea.value + "\n" + labelString;
            } else if (text == "help") {
                var commandKeys = Object.keys(this._commandsMap);
                for (var i = 0; i < commandKeys.length; i++) {
                    let command = this._commandsMap[commandKeys[i]];
                    this._textarea.value = this._textarea.value + "\n" + commandKeys[i] + ": ";
                    if (command.CommandItem.label().length) {
                        this._textarea.value = this._textarea.value + command.CommandItem.label();
                    } else {
                        this._textarea.value = this._textarea.value + command.ArgumentsMap[commandKeys[i]];
                    }
                }
            } else {
                // Find the commands corresponding execute() method in the commandsMap
                let command = this._commandsMap[text];
                if (command) {
                    // Call the execute method to perform the command
                    if (command.RequiresMousePosition) {
                        // remove. Hack
                        var element = command.Element;
                        if (command.Element instanceof Document) {
                            element = document.body;
                        }

                        var commandHeight = $(element).outerHeight();
                        var commandWidth = $(element).outerWidth();
                        var commandX = $(element).offset().left;
                        var commandY = $(element).offset().top;
                        var colNumber = this.drawGridAndGetInput(commandWidth, commandHeight, commandX, commandY);
                        var mousePosition = this.calculateMousePosition(colNumber, commandWidth, commandHeight, commandX, commandY);
                        
                        command.execute(0, {x: mousePosition, y: 10 });
                    } else if (command.hasArguments()) {
                        command.execute(text);
                    } else {
                        command.execute();
                    }
                } else {
                    // No command found
                    this._textarea.value = this._textarea.value + "\nSorry. No command found.";
                }
            }
        }
    };

    $action.CommandLineUI = CommandLineUI;
})($action);