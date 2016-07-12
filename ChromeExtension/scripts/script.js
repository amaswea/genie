var $action = $action || {};
(function ($action) {
    "use strict";
    class ScriptManager {
        constructor(ui) {
            this.asts = {};
        }

        addScript(url, data) {
            if (url == "page" && !this.asts.page) {
                this.asts.page= [];
            }

            var scriptAST = esprima.parse(data);
          //  var cfg = cfg.buildCFG(scriptAST);

            if (url == "page") {
                this.asts.page.push(scriptAST);
            } else {
                this.asts[url] = scriptAST;
            }
        }

        // removeScript ? 
    }

    $action.ScriptManager = ScriptManager;
})($action);