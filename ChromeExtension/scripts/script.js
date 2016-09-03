var $action = $action || {};
(function ($action) {
    "use strict";
    class ScriptManager {
        constructor(ui) {
            this._asts = {};
            this._functions = {};
            this._assignments = {};
            this._declarations = {};
        }

        get ASTs() {
            return this._asts;
        }

        get Functions() {
            return this._functions;
        }

        get Declarations() {
            return this._declarations;
        }

        get Assignments() {
            return this._assignments;
        }

        isFramework(url) {
            console.log(url);
            // TODO: Make this more sophisticated later
            // Does the URL contain jQuery? 
            if (url.includes("jquery") || url.includes("lodash")) {
                return true;
            }
            if (url.includes("twitter")) {
                return true;
            }
            if (url.includes("google-analytics")) {
                return true;
            }
            if (url.includes("swfobject")) {
                return true;
            }
            if (url.includes("js.cookie")) {
                return true;
            }
            if (url.includes("keypress")) {
                return true;
            }
            if (url.includes("hammer.min")) {
                return true;
            }
            if (url.includes("jsonfn.min")) {
                return true;
            }
            if (url.includes("d3.min")) {
                return true;
            }
            if (url.includes("cloudflare") && url.includes("rocket")) {
                return true;
            }
            return false;
        }

        addScript(url, data) {
            if (this.isFramework(url)) {
                return;
            }

            if (url == "page" && !this._asts.page) {
                this._asts.page = [];
            }

            var scriptAST = esprima.parse(data, {
                tolerant: true
            });
            if (url == "page") {
                this._asts.page.push(scriptAST);
            } else {
                this._asts[url] = scriptAST;
            }

            this.processScript(scriptAST);
        }

        processScript(ast) {
            // Gather up all the scripts on the page and find all function expressions in them to be resolved by the handlers later                      
            var findFunctionExpressionsInProgram = {
                lookFor: ["FunctionExpression", "FunctionDeclaration", "ArrowExpression"],
                within: ["Program"],
                items: []
            }

            var clone = $.extend(true, {}, ast);
            $action.ASTAnalyzer.searchAST(ast, findFunctionExpressionsInProgram);

            for (var i = 0; i < findFunctionExpressionsInProgram.items.length; i++) {
                let item = findFunctionExpressionsInProgram.items[i];
                if (item.id && item.id.name && item.id.name.length) {
                    if (this._functions[item.id.name]) {
                        if (this._functions[item.id.name] instanceof Array) {
                            this._functions[item.id.name].push(item);
                        } else if (this._functions[item.id.name]) {
                            let oldVal = this._functions[item.id.name];
                            this._functions[item.id.name] = [];
                            this._functions[item.id.name].push(oldVal);
                            this._functions[item.id.name].push(item);
                        } else {
                            this._functions[item.id.name] = item;
                        }
                    } else {
                        this._functions[item.id.name] = item;
                    }
                } else if (item.referenceID && item.referenceID.length) {
                    this._functions[item.referenceID] = item;
                }
            }

            var findVariableDeclarationsInProgram = {
                lookFor: ["VariableDeclarator"],
                within: ["Program"],
                items: []
            }

            $action.ASTAnalyzer.searchAST(ast, findVariableDeclarationsInProgram);
            for (var i = 0; i < findVariableDeclarationsInProgram.items.length; i++) {
                let item = findVariableDeclarationsInProgram.items[i];
                if (item.id) {
                    if (item.id.name) {
                        if (this._declarations[item.id.name] instanceof Array) {
                            this._declarations[item.id.name].push(item);
                        } else if (this._declarations[item.id.name]) {
                            let oldVal = this._declarations[item.id.name];
                            this._declarations[item.id.name] = [];
                            this._declarations[item.id.name].push(oldVal);
                            this._declarations[item.id.name].push(item);
                        } else {
                            this._declarations[item.id.name] = item;
                        }
                    }
                }
            }

            // Look for variables declared on the window object or in the global scope
            var findAssignmentExpressionsInProgram = {
                lookFor: ["AssignmentExpression"],
                within: ["Program"],
                items: []
            }

            $action.ASTAnalyzer.searchAST(ast, findAssignmentExpressionsInProgram);
            for (var j = 0; j < findAssignmentExpressionsInProgram.items.length; j++) {
                let assignment = findAssignmentExpressionsInProgram.items[j];
                if (assignment.left && assignment.left.type == "MemberExpression" && assignment.left.object && assignment.left.object.type == "Identifier" && assignment.left.object.name == "window" && assignment.left.property && assignment.left.property.name) {
                    if (this._declarations[assignment.left.property.name] instanceof Array) {
                        this._declarations[assignment.left.property.name].push(assignment);
                    } else if (this._declarations[assignment.left.property.name]) {
                        let oldVal = this._declarations[assignment.left.property.name];
                        this._declarations[assignment.left.property.name] = [];
                        this._declarations[assignment.left.property.name].push(oldVal);
                        this._declarations[assignment.left.property.name].push(assignment);
                    } else {
                        this._declarations[assignment.left.property.name] = assignment;
                    }
                }
            }
        }
    }

    $action.ScriptManager = ScriptManager;
})($action);