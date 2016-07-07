"use strict";

var $action = $action || {};
(function ($action) {
    class ScriptManager {
        constructor(ui) {
            this.asts = []; 
        }

        addScript(data){
            var scriptAST = esprima.parse(data);
            this.asts.push(scriptAST);
        }
        
        // removeScript ? 
    };

    $action.ScriptManager = ScriptManager;
})($action);