var $action = $action || {};
(function ($action) {
    "use strict";

    $action.NUM_COMPUTED_STYLES = 615;
    class CommandOrganizer {
        constructor() {}

        static organizeCommandsByVisualContainer(commands) {
            var getCommandElements = function (commands) {
                var commandKeys = Object.keys(commands);
                var commandElements = {};
                for (var i = 0; i < commandKeys.length; i++) {
                    var command = commands[commandKeys[i]];
                    var commandElement = command.Element;
                    if (commandElement) {
                        commandElements[commandKeys[i]] = commandElement;
                    }
                }

                return commandElements;
            }

            // Clone the node and strip all text nodes and attributes for structural comparison
            var getStrippedElement = function (commandElement) {
                var clonedElement = commandElement.cloneNode(true);

                // Clear out text node values
                var walker = document.createTreeWalker(clonedElement, NodeFilter.SHOW_TEXT, null, false);
                var node = walker.nextNode();
                while (node) {
                    node.textContent = "";
                    node = walker.nextNode();
                }

                return clonedElement.outerHTML.replace(/<(\w+)[^>]+>/ig, '<$1>'); // Strips all attributes
            }

            // Treat the list of commands as a queue and remove commands once they have been grouped 
            var commandElementsMap = getCommandElements(commands);
            var commandQueue = Object.keys(commandElementsMap);
            var commandKeys = Object.keys(commandElementsMap);
            var commandElements = Object.values(commandElementsMap); // Object.values only works with Experimental
            // JavaScript features chrome flag.
            var groups = [];
            while (commandQueue.length) {
                var commandKey = commandQueue.shift();
                var commandElement = commandElementsMap[commandKey];
                var commandGroup = {
                    container: commandElement,
                    commands: [commandKey]
                };
                // Find the parent node. Find structurally similar sets of commands within the parent, otherwise, continue going up a level. 
                var parentNode = commandElement.parentNode;
                while (parentNode) {
                    var topLevelParent = $(commandElement).parentsUntil(parentNode).last();
                    var parentHTML = topLevelParent.length ? getStrippedElement(topLevelParent[0]) : getStrippedElement(commandElement);

                    // Find which elements are contained inside of this parent node
                    var children = jQuery(parentNode).find(jQuery(commandElements)).not(commandElement);
                    if (children.length) {
                        for (var i = 0; i < children.length; i++) {
                            // These child commands are contained within the parent node
                            // Find the top level parent node of this command not including the current parent
                            if (children[i] !== commandElement) {
                                var highestParent = $(children[i]).parentsUntil(parentNode).last();
                                if (highestParent.length) {
                                    var parentToCheck = getStrippedElement(highestParent[0]);
                                    if (parentToCheck == parentHTML) { // InnerHTML of the two elements is the same 
                                        // Remove the command key from the queue 
                                        let index = commandElements.indexOf(children[i]);
                                        let currentKey = commandKeys[index];

                                        // Add the command to the group 
                                        commandGroup.container = parentNode;
                                        commandGroup.commands.push(currentKey);

                                        // Removing item from queue
                                        let currentIndex = commandQueue.indexOf(currentKey);
                                        commandQueue.splice(currentIndex, 1);
                                    }
                                } else {
                                    var selfHTML = getStrippedElement(children[i]);
                                    if (selfHTML == parentHTML) {
                                        // Remove the command key from the queue 
                                        let index = commandElements.indexOf(children[i]);
                                        let currentKey = commandKeys[index];

                                        // Add the command to the current gorup
                                        commandGroup.container = parentNode;
                                        commandGroup.commands.push(currentKey);

                                        let currentIndex = commandQueue.indexOf(currentKey);
                                        commandQueue.splice(currentIndex, 1);
                                    }
                                }
                            }
                        }

                        break; //Exit the while loop once we have found some other commands in the same hierarchy. 
                    }


                    parentNode = parentNode.parentNode;
                }

                // Add the current group to the list of collected groups
                groups.push(commandGroup);
            }

            return groups;
        }

        static organizeCommandsByType(commands) {
            var commandsMap = {};
            var commandKeys = Object.keys(commands);
            for (var i = 0; i < commandKeys.length; i++) {
                var cmd = commands[commandKeys[i]];
                if (cmd.EventType == 'default') {
                    // Get the command group category (field, link, action)
                    var tagName = cmd.Element.tagName;
                    if (tagName) {
                        let category = $action.CommandGroups[tagName];
                        if (!commandsMap[category]) {
                            commandsMap[category] = [];
                        }
                        commandsMap[category].push(cmd);
                    }
                } else {
                    if (!commandsMap['commands']) {
                        commandsMap['commands'] = [];
                    }
                    commandsMap['commands'].push(cmd);
                }
            }

            var result = [];
            var keys = Object.keys(commandsMap).sort();
            for (var j = 0; j < keys.length; j++) {
                let cmds = commandsMap[keys[j]];
                result.push({
                    "container": keys[j],
                    "commands": cmds
                });
            }

            return result;
        }

        /**
         * Returns a list of command IDs, organized by visual attributes (computed styles)
         * @private
         * @property undefined
         * @param {Object} commands
         */
        static organizeCommandsVisually(commands) {
            // Returns similarity of two commands based on difference in their computed styles
            function visualMetric(command1Styles, command2Styles) {
                var command1Keys = Object.keys(command1Styles).sort();
                var command2Keys = Object.keys(command2Styles).sort();
                var onlyCommand1 = 0;
                var onlyCommand2 = 0;
                var both = $action.NUM_COMPUTED_STYLES; //  Start by assuming all styles are in common
                for (var i = 0; i < command1Keys.length; i++) {
                    var command1Val = command1Styles[command1Keys[i]];
                    var command2Val = command1Styles[command1Keys[i]];
                    if (command2Val == undefined || command2Val != command1Val) {
                        both--;
                        onlyCommand1++;
                        onlyCommand2++;
                    }
                }

                for (var i = 0; i < command2Keys.length; i++) {
                    var command1Val = command2Styles[command1Keys[i]];
                    var command2Val = command2Styles[command2Keys[i]];
                    if (command1Val == undefined) {
                        both--;
                        onlyCommand1++;
                        onlyCommand2++;
                    }
                }

                // Use the Jaccard index method to compute the similarity
                return both / ((onlyCommand1 + onlyCommand2) - both);
            }


            // Compute the correspondence between the commands pairwise
            function computeCorrespondanceMatrix(visualData) {
                var results = []; // Results will be an array of objects. Each object will take the form of { id: <commandID>, 1: <percentage>, 2: <perc>} where the numbered keys are the remaining commands and their corespondence values
                var commandKeys = Object.keys(visualData);
                for (var i = 0; i < commandKeys.length; i++) {
                    var command1VisualData = visualData[commandKeys[i]];
                    var result = {
                        id: commandKeys[i]
                    };

                    for (var j = 0; j < commandKeys.length; j++) {
                        if (i != j) {
                            var command2VisualData = visualData[commandKeys[j]];
                            var correspondence = visualMetric(command1VisualData, command2VisualData);
                            result[commandKeys[j]] = correspondence;
                        }
                    }
                    results.push(result);
                }

                return results;
            }

            // Group commands with corresponding values
            var matrix = computeCorrespondanceMatrix(commands);


            var grouped = []; // Command IDs that already have a group
            var groups = [];
            for (var i = 0; i < matrix.length; i++) {
                var commandID = matrix[i].id;
                if (grouped.indexOf(commandID) < 0) {
                    var commandKeys = Object.keys(matrix[i]);
                    grouped.push(commandID);
                    var newGroup = [];
                    newGroup.push(commandID);
                    for (var j = 1; j < commandKeys.length; j++) {
                        if (grouped.indexOf(commandKeys[j]) < 0) {
                            var value = matrix[i][commandKeys[j]];
                            if (value == -1) {
                                grouped.push(commandKeys[j]);
                                newGroup.push(commandKeys[j]);
                            }
                        }
                    }
                    groups.push(newGroup);
                }
            }

            return groups;
        }
        
        static organizeAllCommands(commands) {
            return {
                container: "all",
                commands: commands
            };
        }
    }

    $action.CommandOrganizer = CommandOrganizer;
})($action);