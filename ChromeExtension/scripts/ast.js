"use strict";
var $action = $action || {};
(function ($action) {
    class ASTAnalyzer {
        // Format of abstract syntax tree follows: https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/Parser_API
        constructor() {}

        static searchAST(ast, visitor) {
            if (ast.type == "Program") {
                if (visitor.within == "Program") {
                    visitor.collect = true;
                }

                for (var i = 0; i < ast.body.length; i++) {
                    this.searchStatement(ast.body[i], visitor);
                }

                visitor.collect = false;
            } else {
                console.log("Not a valid AST");
            }

            // Searching for any identifiers referenced within the If statement conditional and return their names as dependencies
            // Search for any function calls found within the handlers and return their names 
        }

        static searchStatement(statement, visitor) {
            if (visitor.collect && visitor.lookFor.indexOf(statement.type) > -1) {
                // TODO: Not all statement nodes go through this
                // Shoudl refactor so that there is a base method with a switch for all Node objects and everything gets
                // called from there
                visitor.items.push(expression);
            }

            switch (statement.type) {
            case "Identifier":
                this.searchIdentifier(statement, visitor);
                break;
            case "BlockStatement":
                this.searchBlockStatement(statement, visitor);
                break;
            case "ExpressionStatement":
                this.searchExpression(statement.expression, visitor);
                break;
            case "IfStatement":
                this.searchIfStatement(statement, visitor);
                break;
            case "LabeledStatement":
                this.searchLabeledStatement(statement, visitor);
                break;
            case "BreakStatement" || "ContinueStatement":
                this.searchBreakStatement(statement, visitor);
                break;
            case "WithStatement":
                this.searchWithStatement(statement, visitor);
                break;
            case "SwitchStatement":
                this.searchSwitchStatement(statement, visitor);
                break;
            case "ReturnStatement" || "ThrowStatement":
                this.searchExpression(statement.argument, visitor);
                break;
            case "TryStatement":
                this.searchTryStatement(statement);
                break;
            case "WhileStatement" || "DoWhileStatement":
                this.searchWhileStatement(statement, visitor);
                break;
            case "ForStatement":
                this.searchForStatement(statement, visitor);
                break;
            case "ForInStatement" || "ForOfStatement":
                this.searchForInStatement(statement, visitor);
                break;
            case "LetStatement":
                this.searchLetStatement(statement, visitor);
                break;
            case "DebuggerStatement":
                this.searchDebuggerStatement(statement, visitor);
                break;
            case "EmptyStatement":
                // TBD 
                break;
            case "FunctionDeclaration":
                this.searchFunctionDeclaration(statement, visitor);
                break;
            case "VariableDeclaration":
                this.searchVariableDeclaration(statement, visitor);
            default:
                break;
            }
        }

        // Statements 
        static searchForStatement(statement, visitor) {
            if (statement.init) {
                if (statement.init.type == "Expression") {
                    this.searchExpression(statement.init, visitor);
                } else {
                    this.searchVariableDeclaration(statement.init, visitor);
                }
            }

            if (statement.test) {
                this.searchExpression(statement.test, visitor);
            }

            if (statement.update) {
                this.searchExpression(statement.update, visitor);
            }

            this.searchStatement(statement.body, visitor);
        }

        static searchForInStatement(statement) {
            // if statement.each is true, it is a for each/in instead of a for/in
            // If statement.each is undefined, it is a for/of statement
            if (this.left.type == "VariableDeclaration") {
                this.searchVariableDeclaration(this.left, visitor);
            } else {
                this.searchExpression(this.left, visitor);
            }

            this.searchExpression(this.right, visitor);
            this.searchStatement(this.body, visitor);
        }

        static searchWhileStatement(statement, visitor) {
            this.searchExpression(statement.test, visitor);
            this.searchStatement(statement.body, visitor);
        }

        static searchTryStatement(statement, visitor) {
            this.searchBlockStatement(statement.block, visitor);
            if (statement.handler) {
                this.searchCatchClause(statement.handler, visitor);
            }

            for (var i = 0; i < statement.guardedHandlers.length; i++) {
                this.searchCatchClause(statement.handler, visitor);
            }

            if (statement.finalizer) {
                this.searchBlockStatement(statement.finalizer, visitor);
            }
        }

        static searchBreakStatement(statement, visitor) {
            if (statement.label) {
                this.searchStatement(statement.label, visitor);
            }
        }

        static searchWithStatement(statement, visitor) {
            this.searchExpression(statement.object, visitor);
            this.searchStatement(statement.body, visitor);
        }

        static searchSwitchStatement(statement, visitor) {
            this.searchExpression(statement.discriminant, visitor);
            for (var i = 0; i < statement.cases.length; i++) {
                this.searchSwitchCase(statement.cases[i], visitor);
            }
            // lexical - does it contain any unnested let declarations
        }

        static searchBlockStatement(statement, visitor) {
            var statements = statement.body;
            for (var i = 0; i < statements.length; i++) {
                var stmt = statements[i];
                this.searchStatement(stmt, visitor);
            }
        }

        static searchIfStatement(statement, visitor) {
            var collect = visitor.collect;
            if (visitor.within.indexOf("IfStatement") > -1 && visitor.property == "test" && !collect) {
                visitor.collect = true;
            }
            
            this.searchExpression(statement.test, visitor);
            
            if(!collect){
                visitor.collect = false;
            }

            this.searchStatement(statement.consequent, visitor);
            if (statement.alternate) {
                this.searchStatement(statement.alternate, visitor);
            }
        }

        static searchLetStatement(statement) {
            for (var i = 0; i < statement.head.length; i++) {
                this.searchVariableDeclarator(statement.head, visitor);
            }
            this.searchStatement(statement.body, visitor);
        }

        static searchDebuggerStatement(statement, visitor) {
            // Do nothing? 
        }

        static searchLabeledStatement(statement, visitor) {
            this.searchStatement(statement.label, visitor);
            this.searchStatement(statement.body, visitor);
        }

        static searchFunctionDeclaration(statement, visitor) {
            if (statement.id) {
                this.searchStatement(statement.id, visitor);
            }

            for (var i = 0; i < statement.params.length; i++) {
                this.searchPattern(statement.params[i], visitor);
            }

            if (statement.defaults) {
                for (var j = 0; j < statement.defaults.length; j++) {
                    this.searchExpression(statement.defaults[j], visitor);
                }
            }

            if (statement.rest) {
                this.searchStatement(statement.rest, visitor);
            }

            if (statement.body.type == "BlockStatement") {
                this.searchBlockStatement(statement.body, visitor);
            } else {
                this.searchExpression(statement.body, visitor);
            }

            //  generator
            // expression
        }

        // Expressions
        static searchExpression(expression, visitor) {
            if (visitor.collect && visitor.lookFor.indexOf(expression.type) > -1) {
                visitor.items.push(expression);
            }

            switch (expression.type) {
            case "Identifier":
                this.searchIdentifier(expression, visitor);
                break;
            case "ThisExpression":
                this.searchThisExpression(expression, visitor);
                break;
            case "ArrayExpression":
                this.searchArrayExpression(expression, visitor);
                break;
            case "ObjectExpression":
                this.searchObjectExpression(expression, visitor);
                break;
            case "FunctionExpression" || "ArrowExpression":
                this.searchFunctionExpression(expression, visitor)
                break;
            case "SequenceExpression":
                this.searchSequenceExpression(expression, visitor);
                break;
            case "UnaryExpression":
                this.searchUnaryExpression(expression, visitor);
                break;
            case "BinaryExpression":
                this.searchBinaryExpression(expression, visitor);
                break;
            case "AssignmentExpression":
                this.searchAssignmentExpression(expression, visitor);
                break;
            case "UpdateExpression":
                this.searchUpdateExpression(expression, visitor);
                break;
            case "LogicalExpression":
                this.searchLogicalExpression(expression, visitor);
                break;
            case "ConditionalExpression":
                this.searchConditionalExpression(expression, visitor);
                break;
            case "NewExpression":
                this.searchNewExpression(expression, visitor);
                break;
            case "CallExpression":
                this.searchCallExpression(expression, visitor);
                break;
            case "MemberExpression" || "StaticMemberExpression" || "ComputedMemberExpression":
                this.searchMemberExpression(expression, visitor);
                break;
            case "YieldExpression":
                this.searchYieldExpression(expression, visitor);
                break;
            case "ComprehensionExpression":
                this.searchComprehensionExpression(expression, visitor);
                break;
            case "LetExpression":
                this.searchLetExpression(expression, visitor);
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

        static searchThisExpression(expression, visitor) {
            // Do nothing!
        }

        static searchBinaryExpression(expression, visitor) {
            // Parse left and right hand sides
            this.searchExpression(expression.left, visitor);
            this.searchOperator(expression.operator, visitor);
            this.searchExpression(expression.right, visitor);
        }

        static searchAssignmentExpression(expression, visitor) {
            this.searchPattern(expression.left, visitor);
            this.searchOperator(expression.operator, visitor);
            this.searchExpression(expression.right, visitor);
        }

        static searchUpdateExpression(expression, visitor) {
            this.searchOperator(expression.operator, visitor);
            this.searchExpression(expression.argument, visitor);
        }

        static searchLogicalExpression(expression, visitor) {
            // Parse left and right hand sides
            this.searchExpression(expression.left, visitor);
            this.searchOperator(expression.operator, visitor);
            this.searchExpression(expression.right, visitor);
        }

        static searchConditionalExpression(expression, visitor) {
            var collect = visitor.collect;
            if (visitor.within.indexOf("ConditionalExpression") > -1 && visitor.property == "test" && !collect) {
                visitor.collect = true;
            }
            
            this.searchExpression(expression.test, visitor);
            
            if(!collect){
                visitor.collect = false;
            }
            
            this.searchExpression(expression.alternate, visitor);
            this.searchExpression(expression.consequent, visitor);
        }

        static searchNewExpression(expression, visitor) {
            this.searchExpression(expression.callee, visitor);
            for (var i = 0; i < expression.arguments.length; i++) {
                this.searchExpression(expression.arguments[i], visitor);
            }
        }

        static searchCallExpression(expression, visitor) {
            this.searchExpression(expression.callee, visitor);
            for (var i = 0; i < expression.arguments.length; i++) {
                this.searchExpression(expression.arguments[i], visitor);
            }
        }

        static searchMemberExpression(expression, visitor) {
            this.searchExpression(expression.object, visitor);
            this.searchExpression(expression.property, visitor);
        }

        static searchYieldExpression(expression, visitor) {
            if (expression.argument) {
                this.searchExpression(expression.argument, visitor);
            }
        }

        static searchComprehensionExpression(expression, visitor) {
            // Not supported in ECMAScript standard
        }

        static searchLetExpression(expression, visitor) {
            for (var i = 0; i < expression.head.length; i++) {
                this.searchVariableDeclarator(expression.head[i], visitor);
            }

            this.searchExpression(expression.body, visitor);
        }

        static searchArrayExpression(expression, visitor) {
            if (expression.elements && expression.elements.length) {
                for (var i = 0; i < expression.elements.length; i++) {
                    var expr = expression.elements[i];
                    if (expr) {
                        this.searchExpression(expr, visitor);
                    }
                }
            }
        }

        static searchObjectExpression(expression, visitor) {
            for (var i = 0; i < expression.properties.length; i++) {
                this.searchProperty(expression.properties[i], visitor);
            }
        }

        static searchFunctionExpression(expression, visitor) {
            if (expression.id) {
                this.searchIdentifier(expression.id, visitor);
            }

            for (var i = 0; i < expression.params.length; i++) {
                this.searchPattern(expression.params[i], visitor);
            }

            for (var j = 0; j < expression.defaults.length; j++) {
                this.searchExpression(expression.defaults[j], visitor);
            }

            // rest
            if (expression.rest) {
                this.searchIdentifier(expression.rest, visitor);
            }

            // BlockStatement or Expression
            if (epxression.body.type == "BlockStatement") {
                this.searchBlockStatement(expression.body, visitor);
            } else {
                this.searchExpression(expression.body, visitor);
            }

            // generator
            // expression
        }

        static searchSequenceExpression(expression, visitor) {
            for (var i = 0; i < expression.expressions.length; i++) {
                this.searchExpression(expression.expressions[i], visitor);
            }
        }

        static searchUnaryExpression(expression, visitor) {
            this.searchOperator(expression.operator, visitor);
            this.searchExpression(expression.argument, visitor);
        }

        // Clauses
        static searchSwitchCase(switchCase, visitor) {
            if (switchCase.test) {
                this.searchExpression(switchCase.test, visitor);
            }

            for (var i = 0; i < switchCase.consequent.length; i++) {
                this.searchStatement(switchCase.consequent[i], visitor);
            }
        }

        static searchCatchClause(catchClause, visitor) {
            this.searchPattern(catchClause.param, visitor);
            if (catchClause.guard) {
                this.searchExpression(catchClause.guard, visitor);
            }

            this.searchBlockStatement(catchClause.body, visitor);
        }

        // Patterns
        static searchPattern(pattern, visitor) {
            switch (pattern.type) {
            case "ObjectPattern":
                this.searchObjectPattern(pattern, visitor);
                break;
            case "ArrayPattern":
                this.searchArrayPattern(pattern, visitor);
                break;
            case "Identifier":
                this.searchIdentifier(pattern, visitor);
            default:
                break;
            }
        }

        static searchObjectPattern(pattern, visitor) {
            for (var i = 0; i < pattern.properties; i++) {
                var p = patterns.properties[i];
                var key = p.key;
                var value = p.value;
                if (key.type == "Literal") {
                    this.searchLiteral(key, visitor);
                } else {
                    this.searchIdentifier(key, visitor);
                }

                this.searchPattern(value, visitor);
            }
        }

        static searchArrayPattern(pattern, visitor) {
            for (var i = 0; i < pattern.elements.length; i++) {
                if (pattern.elements[i]) {
                    this.searchPattern(pattern.elements[i], visitor);
                }
            }
        }

        // Miscellaneous
        static searchIdentifier(identifier, visitor) {
            // Do nothing
        }

        static searchLiteral(literal, visitor) {
            // value : string | boolean | null | number | RegExp
        }

        static searchOperator(operator, visitor) {
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

        static searchProperty(property, visitor) {
            // Only supported by object expressions
            if (property.key.type == "Literal") {
                this.searchLiteral(property.key, visitor);
            } else {
                this.searchIdentifier(property.key, visitor);
            }

            this.searchExpression(property.value, visitor);

            //property.kind contains the kind "init" for ordinary property initializers. 
            // "get" and "set" are the kind values for getters and setters
        }

        static searchVariableDeclarator(declarator, visitor) {
            this.searchPattern(declarator.id, visitor);
            if (declarator.init) {
                this.searchExpression(declarator.init, visitor);
            }
        }

        static searchVariableDeclaration(declaration, visitor) {
            for (var i = 0; i < declaration.declarations.length; i++) {
                this.searchVariableDeclarator(declaration.declarations[i], visitor);
            }

            // kind "var" | "let" | "const"
        }
    }

    $action.ASTAnalyzer = ASTAnalyzer;
})($action);