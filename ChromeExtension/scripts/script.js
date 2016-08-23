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

        isJQuery(url) {
            console.log(url);
            // Does the URL contain jQuery? 
            if (url.includes("jquery") || url.includes("lodash")) {
                return true;
            }
            return false;
        }

        addScript(url, data) {
            if (this.isJQuery(url)) {
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
                        } else  if (this._functions[item.id.name]){
                            let oldVal = this._functions[item.id.name];
                            this._functions[item.id.name] = [];
                            this._functions[item.id.name].push(oldVal);
                            this._functions[item.id.name].push(item);
                        }else {
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
                        } else if(this._declarations[item.id.name]) {
                            let oldVal = this._declarations[item.id.name];
                            this._declarations[item.id.name] = [];
                            this._declarations[item.id.name].push(oldVal);
                            this._declarations[item.id.name].push(item);
                        }else {
                            this._declarations[item.id.name] = item;
                        }
                    }
                }
            }
        }


    }

    $action.ScriptManager = ScriptManager;
})($action);