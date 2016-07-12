"use strict";
var $action = $action || {};
(function ($action) {
    class ASTAnalyzer {
        // Format of abstract syntax tree follows: https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/Parser_API
        constructor(ast) {
            this._ast = ast;
        }


        searchStatement(statement) {
            switch (statement.type) {
            case "Identifier":
                this.searchIdentifier(statement);
                break;
            case "BlockStatement":
                this.searchBlockStatement(statement);
                break;
            case "ExpressionStatement":
                this.searchExpression(statement.expression);
                break;
            case "IfStatement":
                this.searchIfStatement(statement);
                break;
            case "LabeledStatement":
                this.searchLabeledStatement(statement);
                break;
            case "BreakStatement" || "ContinueStatement":
                this.searchBreakStatement(statement);
                break;
            case "WithStatement":
                this.searchWithStatement(statement);
                break;
            case "SwitchStatement":
                this.searchSwitchStatement(statement);
                break;
            case "ReturnSatement" || "ThrowStatement":
                this.searchExpression(statement.argument);
                break;
            case "TryStatement":
                this.searchTryStatement(statement);
                break;
            case "WhileStatement" || "DoWhileStatement":
                this.searchWhileStatement(statement);
                break;
            case "ForStatement":
                this.searchForStatement(statement);
                break;
            case "ForInStatement" || "ForOfStatement":
                this.searchForInStatement(statement);
                break;
            case "LetStatement":
                this.searchLetStatement(statement);
                break;
            case "DebuggerStatement":
                this.searchDebuggerStatement(statement);
                break;
            case "EmptyStatement":
                // TBD 
                break;
            case "FunctionDeclaration":
                this.searchFunctionDeclaration(statement);
                break;
            default:
                break;
            }
        }

        // Statements 
        searchForStatement(statement) {
            if (statement.init) {
                if (statement.init.type == "Expression") {
                    this.searchExpression(statement.init);
                } else {
                    this.searchVariableDeclaration(statement.init);
                }
            }

            if (statement.test) {
                this.searchExpression(statement.test);
            }

            if (statement.update) {
                this.searchExpression(statement.update);
            }

            this.searchStatement(statement.body);
        }

        searchForInStatement(statement) {
            // if statement.each is true, it is a for each/in instead of a for/in
            // If statement.each is undefined, it is a for/of statement
            if (this.left.type == "VariableDeclaration") {
                this.searchVariableDeclaration(this.left);
            } else {
                this.searchExpression(this.left);
            }

            this.searchExpression(this.right);
            this.searchStatement(this.body);
        }

        searchWhileStatement(statement) {
            this.searchExpression(statement.test);
            this.searchStatement(statement.body);
        }

        searchTryStatement(statement) {
            this.searchBlockStatement(statement.block);
            if (statement.handler) {
                this.searchCatchClause(statement.handler);
            }

            for (var i = 0; i < statement.guardedHandlers.length; i++) {
                this.searchCatchClause(statement.handler);
            }

            if (statement.finalizer) {
                this.searchBlockStatement(statement.finalizer);
            }
        }

        searchBreakStatement(statement) {
            this.searchStatement(statement.label);
        }

        searchWithStatement(statement) {
            this.searchExpression(statement.object);
            this.searchStatement(statement.body);
        }

        searchSwitchStatement(statement) {
            this.searchExpression(statement.discriminant);
            for (var i = 0; i < statement.cases.length; i++) {
                this.searchSwitchCase(statement.cases[i]);
            }
            // lexical - does it contain any unnested let declarations
        }

        searchBlockStatement(statement) {
            var statements = expression.body;
            for (var i = 0; i < statements.length; i++) {
                var statement = statements[i];
                this.searchStatement(statement);
            }
        }

        searchIfStatement(statement) {
            this.searchExpression(statement.test);
            this.searchStatement(statement.consequent);
            if (statement.alternate) {
                this.searchStatement(statement.alternate);
            }
        }

        searchLetStatement(statement) {
            for (var i = 0; i < statement.head.length; i++) {
                this.searchVariableDeclarator(statement.head);
            }
            this.searchStatement(statement.body);
        }

        searchDebuggerStatement(statement) {
            // Do nothing? 
        }

        searchLabeledStatement(statement) {
            this.searchStatement(statement.label);
            this.searchStatement(statement.body);
        }

        searchFunctionDeclaration(statement) {
            this.searchStatement(statement.id);

            for (var i = 0; i < params.length; i++) {
                this.searchPattern(statement.params[i]);
            }

            for (var j = 0; j < statement.params.length; j++) {
                this.searchExpression(statement.params.length);
            }

            if (statement.rest) {
                this.searchStatement(statement.rest);
            }

            if (statement.body.type == "BlockStatement") {
                this.searchBlockStatement(statement.body);
            } else {
                this.searchExpression(statement.body);
            }

            //  generator
            // expression
        }

        // Expressions
        searchExpression(expression) {
            switch (expression) {
            case "Identifier":
                this.searchIdentifier(expression);
                break;
            case "ThisExpression":
                this.searchThisExpression(expression);
                break;
            case "ArrayExpression":
                this.searchArrayExpression(expression);
                break;
            case "ObjectExpression":
                this.searchObjectExpression(expression);
                break;
            case "FunctionExpression" || "ArrowExpression":
                this.searchFunctionExpression(expression)
                break;
            case "SequenceExpression":
                this.searchSequenceExpression(expression);
                break;
            case "UnaryExpression":
                this.searchUnaryExpression(expression);
                break;
            case "BinaryExpression":
                this.searchBinaryExpression(expression);
                break;
            case "AssignmentExpression":
                this.searchAssignmentExpression(expression);
                break;
            case "UpdateExpression":
                this.searchUpdateExpression(expression);
                break;
            case "LogicalExpression":
                this.searchLogicalExpression(expression);
                break;
            case "ConditionalExpression":
                this.searchConditionalExpression(expression);
                break;
            case "NewExpression":
                this.searchNewExpression(expression);
                break;
            case "CallExpression":
                this.searchCallExpression(expression);
                break;
            case "MemberExpression":
                this.searchMemberExpression(expression);
                break;
            case "YieldExpression":
                this.searchYieldExpression(expression);
                break;
            case "ComprehensionExpression":
                this.searchComprehensionExpression(expression);
                break;
            case "LetExpression":
                this.searchLetExpression(expression);
                break;

                // Not supported in ECMAScript
                // ComprehensionExpression
                // GEneratorExpression
                // GraphExpression
                // GraphIndexExpression
                // ComprehensionBlock
                // ComprehensionIf
            }
        };

        searchThisExpression(expression) {
            // Do nothing!
        }

        searchBinaryExpression(expression) {
            // Parse left and right hand sides
            this.searchExpression(expression.left);
            this.searchOperator(expression.operator);
            this.searchExpression(expression.right);
        }

        searchAssignmentExpression(expression) {
            this.searchPattern(expression.left);
            this.searchOperator(expression.operator);
            this.searchExpression(expression.right);
        }

        searchUpdateExpression(expression) {
            this.searchOperator(expression.operator);
            this.searchExpression(expression.argument);
        }

        searchLogicalExpression(expression) {
            // Parse left and right hand sides
            this.searchExpression(expression.left);
            this.searchOperator(expression.operator);
            this.searchExpression(expression.right);
        }

        searchConditionalExpression(expression) {
            this.searchExpression(expression.test);
            this.searchExpression(expression.alternate);
            this.searchExpression(expression.consequent);
        }

        searchNewExpression(expression) {
            this.searchExpression(expression.callee);
            for (var i = 0; i < expression.arguments.length; i++) {
                this.searchExpression(expression.arguments[i]);
            }
        }

        searchCallExpression(expression) {
            this.searchExpression(expression.callee);
            for (var i = 0; i < expression.arguments.length; i++) {
                this.searchExpression(expression.arguments[i]);
            }
        }

        searchMemberExpression(expression) {
            this.searchExpression(expression.object);
            this.searchExpression(expression.property);
        }

        searchYieldExpression(expression) {
            if (expression.argument) {
                this.searchExpression(expression.argument);
            }
        }

        searchComprehensionExpression(expression) {
            // Not supported in ECMAScript standard
        }

        searchLetExpression(expression) {
            for (var i = 0; i < expression.head.length; i++) {
                this.searchVariableDeclarator(expression.head[i]);
            }

            this.searchExpression(expression.body);
        }

        searchArrayExpression(expression) {
            if (expression.elements && expression.elements.length) {
                for (var i = 0; i < expression.elements.length; i++) {
                    var expr = expression.elements[i];
                    if (expr) {
                        this.searchExpression(expr);
                    }
                }
            }
        }

        searchObjectExpression(expression) {
            for (var i = 0; i < expression.properties.length; i++) {
                this.searchProperty(expression.properties[i]);
            }
        }

        searchFunctionExpression(expression) {
            if (expression.id) {
                this.searchIdentifier(expression.id);
            }

            for (var i = 0; i < expression.params.length; i++) {
                this.searchPattern(expression.params[i]);
            }

            for (var j = 0; j < expression.defaults.length; j++) {
                this.searchExpression(expression.defaults[j]);
            }

            // rest
            if (expression.rest) {
                this.searchIdentifier(expression.rest);
            }

            // BlockStatement or Expression
            if (epxression.body.type == "BlockStatement") {
                this.searchBlockStatement(expression.body);
            } else {
                this.searchExpression(expression.body);
            }

            // generator
            // expression
        }

        searchSequenceExpression(expression) {
            for (var i = 0; i < expression.expressions.length; i++) {
                this.searchExpression(expression.expressions[i]);
            }
        }

        searchUnaryExpression(expression) {
            this.searchOperator(expression.operator);
            this.searchExpression(expression.argument);
        }
        
        // Clauses
        searchSwitchCase(switchCase){
            if(switchCase.test){
                this.searchExpression(switchCase.test); 
            }
            
            for(var i=0; i<switchCase.consequent.length; i++){
                this.searchStatement(switchCase.consequent[i]);
            }
        }
        
        searchCatchClause(catchClause){
            this.searchPattern(catchClause.param);
            if(catchClause.guard){
                this.searchExpression(catchClause.guard);
            }
            
            this.searchBlockStatement(catchClause.body);
        }

        // Patterns
        searchPattern(pattern) {
            switch (pattern.type) {
            case "ObjectPattern":
                this.searchObjectPattern(pattern);
                break;
            case "ArrayPattern":
                this.searchArrayPattern(pattern);
                break;
            default:
                break;
            }
        }

        searchObjectPattern(pattern) {
            for (var i = 0; i < pattern.properties; i++) {
                var p = patterns.properties[i];
                var key = p.key;
                var value = p.value;
                if (key.type == "Literal") {
                    this.searchLiteral(key);
                } else {
                    this.searchIdentifier(key);
                }
                
                this.searchPattern(value);
            }
        }
        
        searchArrayPattern(pattern){
            for(var i=0; i<pattern.elements.length; i++){
                if(pattern.elements[i]){
                    this.searchPattern(pattern.elements[i]);
                }
            }
        }

        // Miscellaneous
        searchIdentifier(identifier) {
            console.log("Identifier found: " + identifier.name);
        }
        
        searchLiteral(literal){
            // value : string | boolean | null | number | RegExp
        }

        searchOperator(operator) {
            /// I don't really care what the operator is right now so leaving this empty!
            // UnaryOperator
            // "-" | "+" | "!" | "~" | "typeof" | "void" | "delete"
            // BinaryOperator
            // "==" | "!=" | "===" | "!=="
            // | "<" | "<=" | ">" | ">="
            // | "<<" | ">>" | ">>>"
            // | "+" | "-" | "*" | "/" | "%"
            // | "|" | "^" | "&" | "in"
            // | "instanceof" | ".."
            // LogicalOperator
            // "||" | "&&"
            // AssignmentOperator
            //  "=" | "+=" | "-=" | "*=" | "/=" | "%="
            // | "<<=" | ">>=" | ">>>="
            // | "|=" | "^=" | "&="
            // UpdateOperator
            //  "++" | "--"
        }

        searchProperty(property) {
            // Only supported by object expressions
            if (property.key.type == "Literal") {
                this.searchLiteral(property.key);
            } else {
                this.searchIdentifier(property.key);
            }

            this.searchExpression(property.value);

            //property.kind contains the kind "init" for ordinary property initializers. 
            // "get" and "set" are the kind values for getters and setters
        }

        searchVariableDeclarator(declarator) {
            this.searchPattern(declarator.id);
            if (declarator.init) {
                this.searchExpression(declarator.init);
            }
        }

        searchVariableDeclaration(declaration) {
            for (var i = 0; i < declaration.declarations.length; i++) {
                this.searchVariableDeclarator(declaration.declarations[i]);
            }

            // kind "var" | "let" | "const"
        }
    }
})($action);