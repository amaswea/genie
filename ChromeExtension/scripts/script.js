var $action = $action || {};
(function ($action) {
    "use strict";
    class ScriptManager {
        constructor(ui) {
            this._asts = {};
        }
        
        get ASTs() {
            return this._asts; 
        }

        addScript(url, data) {
            /*if (url == "page" && !this._asts.page) {
                this._asts.page= [];
            }

            var scriptAST = esprima.parse(data, {tolerant: true});
            if (url == "page") {
                this._asts.page.push(scriptAST);
            } else {
                this._asts[url] = scriptAST;
            }*/

        }

        // removeScript ? 
    }

    $action.ScriptManager = ScriptManager;
})($action);