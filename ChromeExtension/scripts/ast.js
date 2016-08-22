var $action = $action || {};
(function ($action) {
    "use strict";
    class ASTAnalyzer {
        // Format of abstract syntax tree follows: https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/Parser_API
        constructor() {}

        static searchAST(ast, visitor) {
            if (visitor.outside && !visitor.within) {
                visitor.collect = true;
            } else if (visitor.within && !visitor.outside) {
                if (visitor.within == "Program") {
                    visitor.collect = true;
                }
            } else if (!visitor.within && !visitor.outside) {
                visitor.collect = true;
            }

            if (!visitor.scopes) {
                visitor.scopes = [];
            }

            if (ast.type == "Program") {
                visitor.scopes.push(new Scope(ast.body));

                for (var i = 0; i < ast.body.length; i++) {
                    this.searchNode(ast.body[i], visitor);
                }

                visitor.collect = false;
                delete visitor.scopes;
            } else {

                this.searchNode(ast, visitor);
            }

            // Searching for any identifiers referenced within the If statement conditional and return their names as dependencies
            // Search for any function calls found within the handlers and return their names 
        }

        static searchNode(node, visitor) {
            var collect = visitor.collect;
            var hasProp = visitor.property !== undefined;
            if (visitor.within && visitor.within.length && visitor.within.indexOf(node.type) > -1 && !hasProp && !visitor.inside) {
                visitor.collect = true;
            }

            if (visitor.outside && visitor.outside.length && visitor.outside.indexOf(node.type) > -1) {
                visitor.inside = true;
                visitor.collect = false;
            }

            if (visitor.collect && !visitor.inside && visitor.lookFor && visitor.lookFor.length && visitor.lookFor.indexOf(node.type) > -1) {
                visitor.items.push(node);
            }

            switch (node.type) {
            case "Identifier":
                this.searchIdentifier(node, visitor);
                break;
            case "BlockStatement":
                this.searchBlockStatement(node, visitor);
                break;
            case "ExpressionStatement":
                this.searchExpressionStatement(node, visitor);
                break;
            case "IfStatement":
            case "ConditionalExpression":
            case "WhileStatement":
            case "DoWhileStatement":
            case "ForStatement":
                this.searchConditional(node, visitor);
                break;
            case "ForInStatement":
            case "ForOfStatement":
                this.searchForInStatement(node, visitor);
                break;
            case "LabeledStatement":
                this.searchLabeledStatement(node, visitor);
                break;
            case "BreakStatement":
            case "ContinueStatement":
                this.searchBreakStatement(node, visitor);
                break;
            case "WithStatement":
                this.searchWithStatement(node, visitor);
                break;
            case "SwitchStatement":
                this.searchSwitchStatement(node, visitor);
                break;
            case "ReturnStatement":
            case "ThrowStatement":
                this.searchReturnStatement(node, visitor);
                break;
            case "TryStatement":
                this.searchTryStatement(node, visitor);
                break;
            case "LetStatement":
                this.searchLetStatement(node, visitor);
                break;
            case "DebuggerStatement":
                this.searchDebuggerStatement(node, visitor);
                break;
            case "EmptyStatement":
                // TBD 
                break;
            case "FunctionDeclaration":
                this.searchFunctionDeclaration(node, visitor);
                break;
            case "VariableDeclaration":
                this.searchVariableDeclaration(node, visitor);
                break;
            case "ThisExpression":
                this.searchThisExpression(node, visitor);
                break;
            case "ArrayExpression":
                this.searchArrayExpression(node, visitor);
                break;
            case "ObjectExpression":
                this.searchObjectExpression(node, visitor);
                break;
            case "FunctionExpression":
            case "ArrowExpression":
                this.searchFunctionExpression(node, visitor);
                break;
            case "SequenceExpression":
                this.searchSequenceExpression(node, visitor);
                break;
            case "UnaryExpression":
                this.searchUnaryExpression(node, visitor);
                break;
            case "BinaryExpression":
                this.searchBinaryExpression(node, visitor);
                break;
            case "AssignmentExpression":
                this.searchAssignmentExpression(node, visitor);
                break;
            case "UpdateExpression":
                this.searchUpdateExpression(node, visitor);
                break;
            case "LogicalExpression":
                this.searchLogicalExpression(node, visitor);
                break;
            case "NewExpression":
                this.searchNewExpression(node, visitor);
                break;
            case "CallExpression":
                this.searchCallExpression(node, visitor);
                break;
            case "MemberExpression":
            case "StaticMemberExpression":
            case "ComputedMemberExpression":
                this.searchMemberExpression(node, visitor);
                break;
            case "YieldExpression":
                this.searchYieldExpression(node, visitor);
                break;
            case "ComprehensionExpression":
                this.searchComprehensionExpression(node, visitor);
                break;
            case "LetExpression":
                this.searchLetExpression(node, visitor);
                break;
            case "VariableDeclaration":
                this.searchVariableDeclaration(node, visitor);
                break;
            case "VariableDeclarator":
                this.searchVariableDeclarator(node, visitor);
                break;
                // Clauses
            case "CatchClause":
                this.searchCatchClause(node, visitor);
                break;
            case "SwitchCase":
                this.searchSwitchCase(node, visitor);
                break;
                // Operators
            case "BinaryOperator":
            case "UnaryOperator":
                this.searchOperator(node, visitor);
                break;
                // Patterns
            case "ObjectPattern":
                this.searchObjectPattern(node, visitor);
                break;
            case "ArrayPattern":
                this.searchArrayPattern(node, visitor);
                break;
            case "AssignmentPattern":
                this.searchAssignmentPattern(node, visitor);
                break;
            case "Property":
                this.searchProperty(node, visitor);
                break;
            case "RestElement":
                this.searchRestElement(node, visitor);
                break;
            default:
                break;
                // Not supported in ECMAScript
                // ComprehensionExpression
                // GEneratorExpression
                // GraphExpression
                // GraphIndexExpression
                // ComprehensionBlock
                // ComprehensionIf
            }

            if (typeof (node) == "object" && !node.stringRepresentation) {
                node.stringRepresentation = this.convertNodeToString(node);
            }


            if (visitor.inside && visitor.outside.length && visitor.outside.indexOf(node.type) > -1) {
                visitor.inside = false;
            }

            if (collect && visitor.outside) {
                visitor.collect = true;
            } else if (!collect && visitor.within) {
                visitor.collect = false;
            }
        }

        // Statements 
        static searchForStatement(statement, visitor) {
            if (statement.init) {
                this.searchNode(statement.init, visitor);
            }

            if (statement.test) {
                this.searchNode(statement.test, visitor);
            }

            if (statement.update) {
                this.searchNode(statement.update, visitor);
            }

            this.searchNode(statement.body, visitor);
        }

        static searchForInStatement(statement, visitor) {
            // if statement.each is true, it is a for each/in instead of a for/in
            // If statement.each is undefined, it is a for/of statement
            this.searchNode(statement.left, visitor);
            this.searchNode(statement.right, visitor);
            this.searchNode(statement.body, visitor);
        }

        static searchWhileStatement(statement, visitor) {
            this.searchNode(statement.test, visitor);
            this.searchNode(statement.body, visitor);
        }

        static searchTryStatement(statement, visitor) {
            this.searchNode(statement.block, visitor);
            if (statement.handler) {
                this.searchNode(statement.handler, visitor);
            }

            if (statement.guardedHandlers) {
                for (var i = 0; i < statement.guardedHandlers.length; i++) {
                    this.searchNode(statement.handler, visitor);
                }
            }

            if (statement.finalizer) {
                this.searchNode(statement.finalizer, visitor);
            }
        }

        static searchBreakStatement(statement, visitor) {
            if (statement.label) {
                this.searchNode(statement.label, visitor);
            }
        }

        static searchWithStatement(statement, visitor) {
            // Not handling this case for scoping
            // With statement use is not recommended
            this.searchNode(statement.object, visitor);
            this.searchNode(statement.body, visitor);
        }

        static searchConditional(statement, visitor) {
            switch (statement.type) {
            case "WhileStatement":
            case "DoWhileStatement":
                this.searchWhileStatement(statement, visitor);
                break;
            case "IfStatement":
            case "ConditionalExpression":
                this.searchIfStatement(statement, visitor);
                break;
            case "ForStatement":
                this.searchForStatement(statement, visitor);
                break;
            default:
                break;
            }

            if (!statement.testExpression) {
                var clonedStatement = $.extend(true, {}, statement.test);
                if (clonedStatement.type == "Identifier") {
                    if (clonedStatement.lastAssigned) {
                        this.searchIdentifiersInPath(clonedStatement.lastAssigned);
                        clonedStatement = clonedStatement.lastAssigned;
                    } else if (clonedStatement.lastDeclared) {
                        this.searchIdentifiersInPath(clonedStatement.lastDeclared);
                        clonedStatement = clonedStatement.lastDeclared;
                    }
                } else {
                    this.searchIdentifiersInPath(clonedStatement);
                }

                statement.testExpression = this.convertNodeToString(clonedStatement);
            }
        }

        static searchSwitchStatement(statement, visitor) {
            var collect = visitor.collect;
            if (visitor.property == "discriminant") {
                visitor.collect = true;
            }

            this.searchNode(statement.discriminant, visitor);

            if (!collect) {
                visitor.collect = false;
            }

            for (var i = 0; i < statement.cases.length; i++) {
                this.searchNode(statement.cases[i], visitor);
            }

            // lexical - does it contain any unnested let declarations
        }

        static searchReturnStatement(statement, visitor) {
            if (statement.argument) {
                this.searchNode(statement.argument, visitor);
            }
        }


        static searchBlockStatement(statement, visitor) {
            // Push the node onto the scope whenever a new block statement is reached
            // Consider only new block statements as new scopes
            visitor.scopes.push(new Scope(statement));

            var statements = statement.body;
            for (var i = 0; i < statements.length; i++) {
                var stmt = statements[i];
                this.searchNode(stmt, visitor);
            }

            visitor.scopes.pop();
        }

        static searchExpressionStatement(statement, visitor) {
            if (!statement.expressionString) {
                statement.expressionString = this.convertNodeToString(statement);
            }

            if (statement.expression) {
                this.searchNode(statement.expression, visitor);
            }
        }

        static searchIfStatement(statement, visitor) {
            // scope
            //   Identifier -> AssignmentExpression
            //   Identifier -> VariableDeclaration 
            var props = ["test", "consequent", "alternate"];
            var hasProp = visitor.property !== undefined;
            var collect = visitor.collect;
            for (var i = 0; i < props.length; i++) {
                visitor.collect = (hasProp && (visitor.property.indexOf(props[i]) > -1)) ? true : collect;

                if (statement[props[i]]) {
                    this.searchNode(statement[props[i]], visitor);
                }

                if (!collect) {
                    visitor.collect = false;
                }
            }
        }

        static searchLetStatement(statement, visitor) {
            for (var i = 0; i < statement.head.length; i++) {
                this.searchNode(statement.head, visitor);
            }
            this.searchNode(statement.body, visitor);
        }

        static searchDebuggerStatement(statement, visitor) {
            // Do nothing? 
        }

        static searchLabeledStatement(statement, visitor) {
            this.searchNode(statement.label, visitor);
            this.searchNode(statement.body, visitor);
        }

        static searchFunctionDeclaration(statement, visitor) {
            if (statement.id) {
                this.searchNode(statement.id, visitor);
            }

            for (var i = 0; i < statement.params.length; i++) {
                this.searchNode(statement.params[i], visitor);
            }

            if (statement.defaults) {
                for (var j = 0; j < statement.defaults.length; j++) {
                    this.searchNode(statement.defaults[j], visitor);
                }
            }

            if (statement.rest) {
                this.searchNode(statement.rest, visitor);
            }

            this.searchNode(statement.body, visitor);

            //  generator
            // expression
        }

        static searchThisExpression(expression, visitor) {
            // Do nothing!
        }

        static searchBinaryExpression(expression, visitor) {
            // Parse left and right hand sides
            this.searchNode(expression.left, visitor);
            this.searchNode(expression.operator, visitor);
            this.searchNode(expression.right, visitor);
        }

        static searchAssignmentExpression(expression, visitor) {
            // Search from left to right so that identifiers on the right will be resolved to their mapped nodes in the scope before the assigned variable gets resolved. 
            this.searchNode(expression.right, visitor);

            // TODO: Is this too specific?
            if (expression.right && expression.left && expression.right.type == "FunctionExpression" && expression.left.type == "Identifier") {
                expression.right.referenceID = expression.left.name;
                // TODO: This won't work for ObjectPattern or ArrayPattern node types. decorator.id is a Pattern node.
            }

            // The left property contains a Pattern node. 
            // Currently, just look for Identifier types. Other options are ArrayPattern & ObjectPattern
            if (expression.left.type == "Identifier" && visitor.scopes && visitor.scopes.length) {
                var scope = visitor.scopes[visitor.scopes.length - 1]; // The closest scope is the last on the stack
                scope.addAssignment(expression.left.name, expression.right);
            }

            this.searchNode(expression.operator, visitor);
            this.searchNode(expression.left, visitor);
        }

        static searchUpdateExpression(expression, visitor) {
            this.searchNode(expression.operator, visitor);
            this.searchNode(expression.argument, visitor);
        }

        static searchLogicalExpression(expression, visitor) {
            // Parse left and right hand sides
            this.searchNode(expression.left, visitor);
            this.searchNode(expression.operator, visitor);
            this.searchNode(expression.right, visitor);
        }

        static searchNewExpression(expression, visitor) {
            this.searchNode(expression.callee, visitor);
            for (var i = 0; i < expression.arguments.length; i++) {
                this.searchNode(expression.arguments[i], visitor);
            }
        }

        static searchCallExpression(expression, visitor) {
            this.searchNode(expression.callee, visitor);
            for (var i = 0; i < expression.arguments.length; i++) {
                this.searchNode(expression.arguments[i], visitor);
            }
        }

        static searchMemberExpression(expression, visitor) {
            this.searchNode(expression.object, visitor);
            this.searchNode(expression.property, visitor);
        }

        static searchYieldExpression(expression, visitor) {
            if (expression.argument) {
                this.searchNode(expression.argument, visitor);
            }
        }

        static searchComprehensionExpression(expression, visitor) {
            // Not supported in ECMAScript standard
        }

        static searchLetExpression(expression, visitor) {
            for (var i = 0; i < expression.head.length; i++) {
                this.searchNode(expression.head[i], visitor);
            }

            this.searchNode(expression.body, visitor);
        }

        static searchArrayExpression(expression, visitor) {
            if (expression.elements && expression.elements.length) {
                for (var i = 0; i < expression.elements.length; i++) {
                    var expr = expression.elements[i];
                    if (expr) {
                        this.searchNode(expr, visitor);
                    }
                }
            }
        }

        static searchObjectExpression(expression, visitor) {
            for (var i = 0; i < expression.properties.length; i++) {
                this.searchNode(expression.properties[i], visitor);
            }
        }

        static searchFunctionExpression(expression, visitor) {
            if (expression.id) {
                this.searchNode(expression.id, visitor);
            }

            if (expression.params) {
                for (var i = 0; i < expression.params.length; i++) {
                    this.searchNode(expression.params[i], visitor);
                }
            }

            if (expression.defaults) {
                for (var j = 0; j < expression.defaults.length; j++) {
                    this.searchNode(expression.defaults[j], visitor);
                }
            }

            // rest
            if (expression.rest) {
                this.searchNode(expression.rest, visitor);
            }

            // BlockStatement or Expression
            this.searchNode(expression.body, visitor);

            // generator
            // expression
        }

        static searchSequenceExpression(expression, visitor) {
            for (var i = 0; i < expression.expressions.length; i++) {
                this.searchNode(expression.expressions[i], visitor);
            }
        }

        static searchUnaryExpression(expression, visitor) {
            this.searchNode(expression.operator, visitor);
            this.searchNode(expression.argument, visitor);
        }

        // Clauses
        static searchSwitchCase(switchCase, visitor) {
            if (switchCase.test) {
                this.searchNode(switchCase.test, visitor);
            }

            for (var i = 0; i < switchCase.consequent.length; i++) {
                this.searchNode(switchCase.consequent[i], visitor);
            }
        }

        static searchCatchClause(catchClause, visitor) {
            this.searchNode(catchClause.param, visitor);
            if (catchClause.guard) {
                this.searchNode(catchClause.guard, visitor);
            }

            this.searchNode(catchClause.body, visitor);
        }

        static searchObjectPattern(pattern, visitor) {
            for (var i = 0; i < pattern.properties; i++) {
                var p = pattern.properties[i];
                var key = p.key;
                var value = p.value;
                this.searchNode(key, visitor);
                this.searchNode(value, visitor);
            }
        }

        static searchArrayPattern(pattern, visitor) {
            for (var i = 0; i < pattern.elements.length; i++) {
                if (pattern.elements[i]) {
                    this.searchNode(pattern.elements[i], visitor);
                }
            }
        }

        static searchAssignmentPattern(pattern, visitor) {
            // TODO 
        }

        static searchRestElement(pattern, visitor) {
            // TODO
        }

        // Miscellaneous
        static searchIdentifier(identifier, visitor) {
            if (!identifier.lastAssigned) {
                // Locate the reference where the identifier was last assigned, either a AssignmentExpression
                // or a VariableDeclaration node
                identifier.lastAssigned = this.findLastAssigned(identifier, visitor);
            }

            if (!identifier.lastDeclared) {
                identifier.lastDeclared = this.findLastDeclared(identifier, visitor);
            }

            if (!identifier.sideEffectFreeExpression) {
                var exprNode = this.constructSideEffectFreeExpression(identifier);
                identifier.sideEffectFreeExpression = this.convertNodeToString(exprNode);
            }
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
            this.searchNode(property.key, visitor);
            this.searchNode(property.value, visitor);

            //property.kind contains the kind "init" for ordinary property initializers. 
            // "get" and "set" are the kind values for getters and setters
        }

        static searchVariableDeclarator(declarator, visitor) {
            // Search from left to right so that identifiers on the right will be resolved to their mapped nodes in the scope before the assigned variable gets resolved. 
            if (declarator.init) {
                // If the init is a function expression, assign the referenceID on the node to the 
                // identifier of the VariableDeclarator that the function is being assigned to
                if (declarator.init.type == "FunctionExpression") {
                    declarator.init.referenceID = declarator.id.name;
                    // TODO: This won't work for ObjectPattern or ArrayPattern node types. decorator.id is a Pattern node.
                }

                this.searchNode(declarator.init, visitor);
            }

            // The left property contains a Pattern node. 
            // Currently, just look for Identifier types. Other options are ArrayPattern & ObjectPattern
            if (declarator.id.type == "Identifier" && visitor.scopes && visitor.scopes.length) {
                var scope = visitor.scopes[visitor.scopes.length - 1]; // The closest scope is the last on the stack
                scope.addDeclaration(declarator.id.name, declarator.init);
            }

            this.searchNode(declarator.id, visitor);
        }

        static searchVariableDeclaration(declaration, visitor) {
            for (var i = 0; i < declaration.declarations.length; i++) {
                this.searchNode(declaration.declarations[i], visitor);
            }

            // kind "var" | "let" | "const"
        }

        static findLastAssigned(identifier, visitor) {
            if (visitor.scopes) {
                for (var i = visitor.scopes.length - 1; i >= 0; i--) {
                    var scope = visitor.scopes[i]; // The last element is the closest scope to the reference
                    var assignment = scope.Assignments[identifier.name];
                    if (assignment) {
                        return assignment;
                    }
                }
            }
        }

        static findLastDeclared(identifier, visitor) {
            if (visitor.scopes)
                for (var i = visitor.scopes.length - 1; i >= 0; i--) {
                    var scope = visitor.scopes[i]; // The last element is the closest scope to the reference
                    var declaration = scope.Declarations[identifier.name];
                    if (declaration) {
                        return declaration;
                    }
                }
        }

        static constructSideEffectFreeExpression(identifier) {
            // Just construct expression now. Worry about side-effects later
            // Clone the lastAssigned node first so modifications to it do not alter the original tree
            if (identifier.lastAssigned) {
                let previous = identifier.lastAssigned;
                identifier.lastAssigned = $.extend(true, {}, identifier.lastAssigned);

                if (identifier.lastAssigned.type == "Identifier") {
                    return this.getLastAssigned(identifier.lastAssigned);
                } else {
                    this.searchIdentifiersInPath(identifier.lastAssigned);
                    return identifier.lastAssigned;
                }

            } else if (identifier.lastDeclared) {
                let previous = identifier.lastDeclared;
                identifier.lastDeclared = $.extend(true, {}, identifier.lastDeclared);

                if (identifier.lastDeclared.type == "Identifier") {
                    return this.getLastAssigned(identifier.lastDeclared);
                } else {
                    this.searchIdentifiersInPath(identifier.lastDeclared);
                    return identifier.lastDeclared;
                }
            }
        }

        static getLastAssigned(identifier) {
            return identifier.lastAssigned ? identifier.lastAssigned : identifier.lastDeclared;
        }

        static searchIdentifiersInPath(node) {
            if (node && typeof (node) == "object" && !node.searched) {
                node.searched = true;
                var propertyKeys = Object.keys(node);
                for (var i = 0; i < propertyKeys.length; i++) {
                    var key = propertyKeys[i];
                    var propNode = node[key];
                    if (propNode) {
                        if (propNode.type == "Identifier") {
                            if (propNode.lastAssigned) {
                                node[key] = propNode.lastAssigned;
                                this.searchIdentifiersInPath(node[key]);
                            } else if (propNode.lastDeclared) {
                                node[key] = propNode.lastDeclared;
                                this.searchIdentifiersInPath(node[key]);
                            }
                        } else if (Array.isArray(propNode)) {
                            for (var j = 0; j < propNode.length; j++) {
                                var item = propNode[j];
                                this.searchIdentifiersInPath(item);
                            }
                        } else if (propNode.type) {
                            this.searchIdentifiersInPath(propNode);
                        }
                    }
                }
            }
        }

        static getStringForNode(node) {
            switch (node.type) {
            case "Identifier":
                return node.name;
            case "BlockStatement":
                {
                    let toStringValue = "{ ";
                    for (var i = 0; i < node.body.length; i++) {
                        toStringValue = toStringValue + this.convertNodeToString(node.body[i]) + "; ";
                    }
                    return toStringValue + " }";
                }
            case "ExpressionStatement":
                return this.convertNodeToString(node.expression);
            case "IfStatement":
            case "ConditionalExpression":
                {
                    let toStringValue = "if(" + this.convertNodeToString(node.test) + ") { " + this.convertNodeToString(node.consequent) + " } ";
                    if (node.alternate) {
                        if (node.alternate.type == "IfStatement") {
                            toStringValue = toStringValue + "else " + this.convertNodeToString(node.alternate);
                        } else {
                            toStringValue = toStringValue + "else { " + this.convertNodeToString(node.alternate) + "}";
                        }
                    }
                    return toStringValue;
                }
            case "LabeledStatement":
                {
                    return node.label.name + ": " + this.convertNodeToString(node.body);
                }
            case "BreakStatement":
                {
                    return "break" + node.label ? " " + this.convertNodeToString(node.label) : ";";
                }
            case "ContinueStatement":
                {
                    return "continue" + (node.label ? " " + this.convertNodeToString(node.label) : "") + ";";
                }
            case "WithStatement":
                // TODO
                return "";
            case "SwitchStatement":
                {
                    var toStringValue = "switch(" + this.convertNodeToString(node.discriminant) + ") {";
                    for (let i = 0; i < node.cases.length; i++) {
                        toStringValue = " " + this.convertNodeToString(node.cases[i]);
                    }
                    return toStringValue + "}";
                }
            case "ReturnStatement":
                {
                    return "return" + (node.argument ? " " + this.convertNodeToString(node.argument) : ";");
                }
            case "ThrowStatement":
                {
                    return "throw" + (node.argument ? " " + this.convertNodeToString(node.argument) : ";");
                }
            case "TryStatement":
                {
                    let toStringValue = "try { " + this.convertNodeToString(node.block) + " } ";
                    if (node.handler) {
                        toStringValue = toStringValue + this.convertNodeToString(node.handler);
                    }
                    //  guardedHandlers - what are these? 
                    if (node.finalizer) {
                        toStringValue = toStringValue + "finally { " + this.convertNodeToString(node.finalizer); + " }";
                    }
                    return toStringValue;
                }
            case "WhileStatement":
                {
                    return "while (" + this.convertNodeToString(node.test) + ") { " + this.convertNodeToString(node.body) + " }";
                }
            case "DoWhileStatement":
                {
                    return "do { " + this.convertNodeToString(node.body) + " } while(" + this.convertNodeToString(node.test) + ")";
                }
            case "ForStatement":
                {
                    return "for (" + this.convertNodeToString(node.init) + "; " + this.convertNodeToString(node.test)
                    "; " + this.convertNodeToString(node.update) + ") { " + this.convertNodeToString(node.body) + " }";
                }
            case "ForInStatement":
                {
                    return "for " + (node.each ? "each " : "") + "( " + this.convertNodeToString(node.left) + " in " + this.convertNodeToString(node.right) + ") { " + this.convertNodeToString(node.body) + " }";
                }
            case "ForOfStatement":
                {
                    return "for ( " + this.convertNodeToString(node.left) + " of " + this.convertNodeToString(node.right) + ") { " + this.convertNodeToString(node.body) + " }";
                }
            case "LetStatement":
                {
                    // TODO -- Not sure how this is different than a 'let' declaration
                    return "";
                }
            case "DebuggerStatement":
                return "debugger;";
            case "EmptyStatement":
                return ";";
            case "FunctionDeclaration":
            case "FunctionExpression":
                {
                    var toStringValue = "function " + (node.id ? this.convertNodeToString(node.id) : "") + "(";
                    for (var i = 0; i < node.params.length; i++) {
                        toStringValue = toStringValue + this.convertNodeToString(node.params[i]);
                        if (i < node.params.length - 1) {
                            toStringValue = toStringValue + ", ";
                        }
                    }
                    toStringValue = toStringValue + ") { " + this.convertNodeToString(node.body) + " }";
                    return toStringValue;
                }
            case "VariableDeclaration":
                {
                    var toStringValue = node.kind;
                    for (var i = 0; i < node.declarations.length; i++) {
                        var declarator = node.declarations[i];
                        toStringValue = toStringValue + " " + this.convertNodeToString(declarator);
                        if(i < node.declarations.length - 1){
                            toStringValue = toStringValue + ", ";
                        }
                    }
                    toStringValue = toStringValue + ";";
                    return toStringValue;
                }
            case "ThisExpression":
                return "this"; // Semicolon? 
            case "ArrayExpression":
                {
                    var toStringValue = "[";
                    for (var i = 0; i < node.elements.length; i++) {
                        var element = node.elements[i];
                        if (element) {
                            toStringValue = toStringValue + " " + this.convertNodeToString(element);
                            if (i < node.elements.length - 1) {
                                toStringValue = toStringValue + ",";
                            }
                        }
                    }
                    toStringValue = toStringValue + ";";
                    return toStringValue;
                }
            case "ObjectExpression":
                {
                    var toStringValue = "{ ";
                    for (var i = 0; i < node.properties.length; i++) {
                        toStringValue = toStringValue + this.convertNodeToString(node.properties[i]);
                        if (i < node.properties.length - 1) {
                            toStringValue = toStringValue + ",";
                        }
                    }
                    toStringValue = toStringValue + " }";
                    return toStringValue;
                }
            case "ArrowExpression":
                {
                    var toStringValue = "(";
                    for (var i = 0; i < node.params.length; i++) {
                        toStringValue = toStringValue + this.convertNodeToString(node.params[i]);
                        if (i < node.params.length - 1) {
                            toStringValue = toStringValue + ", ";
                        }
                    }
                    toStringValue = toStringValue + ") => { " + this.convertNodeToString(node.body) + " }";
                    return toStringValue;
                }
            case "SequenceExpression":
                {
                    var toStringValue = "";
                    for (var i = 0; i < node.expressions.length; i++) {
                        toStringValue = toStringValue + this.convertNodeToString(node.expressions[i]);
                        if (i < node.expressions.length - 1) {
                            toStringValue = toStringValue + ",";
                        }
                    }
                    return toStringValue;
                }
            case "UnaryExpression":
                {
                    return node.operator + "(" + this.convertNodeToString(node.argument) + ")";
                }
            case "BinaryExpression":
                {
                    return "(" + this.convertNodeToString(node.left) + " " + node.operator + this.convertNodeToString(node.right) + ")";
                }
            case "AssignmentExpression":
                {
                    return "(" + this.convertNodeToString(node.left) + " " + node.operator + " " + this.convertNodeToString(node.right) + ")";
                }
            case "UpdateExpression":
                {
                    var toStringValue = "";
                    if (node.prefix) {
                        toStringValue = toStringValue + node.operator + "(" + this.convertNodeToString(node.argument) + ")";
                    } else {
                        toStringValue = toStringValue + "(" + this.convertNodeToString(node.argument) + ")" + node.operator;
                    }
                    return toStringValue;
                }
            case "LogicalExpression":
                {
                    /*  console.log(node.left.type); 
                      console.log(node.right.type);*/
                    return this.convertNodeToString(node.left) + " " + node.operator + " " + this.convertNodeToString(node.right);

                }
            case "NewExpression":
                {
                    var toStringValue = "new " + this.convertNodeToString(node.callee) + "(";
                    for (var i = 0; i < node.arguments.length; i++) {
                        toStringValue = toStringValue + this.convertNodeToString(node.arguments[i]);
                        if (i < node.arguments.length - 1) {
                            toStringValue = toStringValue + ",";
                        }
                    }
                    toStringValue = toStringValue + ")";
                    return toStringValue;
                }
            case "CallExpression":
                {
                    var toStringValue = this.convertNodeToString(node.callee) + "(";
                    for (var i = 0; i < node.arguments.length; i++) {
                        toStringValue = toStringValue + this.convertNodeToString(node.arguments[i]);
                        if (i < node.arguments.length - 1) {
                            toStringValue = toStringValue + ",";
                        }
                    }
                    toStringValue = toStringValue + ")";
                    return toStringValue;
                }
            case "MemberExpression":
                {
                    if (node.computed) {

                        return this.convertNodeToString(node.object) + "[" + this.convertNodeToString(node.property) + "]";

                    } else {
                        return this.convertNodeToString(node.object) + "." + this.convertNodeToString(node.property);
                    }
                }
            case "YieldExpression":
                {
                    return "yield" + (node.argument ? " " + this.convertNodeToString(node.argument) : "");
                }
            case "ComprehensionExpression":
                // TODO: Not supported in ECMAscript standard
                return "";
            case "LetExpression":
                // TODO
                return "";
            case "VariableDeclaration":
                {
                    var toStringValue = node.kind;
                    for (var i = 0; i < node.declarations.length; i++) {
                        toStringValue = " " + this.convertNodeToString(node.declarations[i]);
                        if (i < node.declarations.length - 1) {
                            toStringValue = toStringValue + ",";
                        }
                    }
                    return toStringValue + ";";
                }
            case "VariableDeclarator":
                {
                    return this.convertNodeToString(node.id) + (node.init ? " = " + this.convertNodeToString(node.init) : "");
                }
                // Clauses
            case "CatchClause":
                {
                    return "catch (" + this.convertNodeToString(node.param) + ") { " + this.convertNodeToString(node.body) + " }";
                    // There is a 'guard' property we aren't handling currently
                }
            case "SwitchCase":
                {
                    var toStringValue = "case " + this.convertNodeToString(node.test) + ":";
                    for (var i = 0; i < node.consequent.length; i++) {
                        toStringValue = toStringValue + " " + this.convertNodeToString(node.consequent[i]);
                    }
                    return toStringValue;
                }
                // Patterns
            case "ObjectPattern":
                {
                    var toStringValue = "{ ";
                    for (var i = 0; i < node.elements.length; i++) {
                        toStringValue = toStringValue + this.convertNodeToString(node.elements[i]);
                        if (i == node.elements.length - 1) {
                            toStringValue = toStringValue + ", ";
                        }
                    }
                    return toStringValue + " }";
                }
            case "ArrayPattern":
                {
                    var toStringValue = "[ ";
                    for (var i = 0; i < node.elements.length; i++) {
                        toStringValue = toStringValue + this.convertNodeToString(node.elements[i]);
                        if (i == node.elements.length - 1) {
                            toStringValue = toStringValue + ", ";
                        }
                    }
                    return toStringValue + " ]";
                }
            case "AssignmentPattern":
                {
                    return this.convertNodeToString(node.left) + " = " + this.convertNodeToString(node.right);
                }
            case "RestElement":
                {
                    return "..." + this.convertNodeToString(node.argument);
                }
            case "Property":
                // TODO
                {
                    return this.convertNodeToString(node.key) + ": " + this.convertNodeToString(node.value);
                }
            case "Literal":
                return node.raw;
            default:
                break;
                // Not supported in ECMAScript
                // ComprehensionExpression
                // GEneratorExpression
                // GraphExpression
                // GraphIndexExpression
                // ComprehensionBlock
                // ComprehensionIf
            }
        }

        static convertNodeToString(node) {
            if (!node) {
                return "";
            }

            if (node.stringRepresentation) {
                return node.stringRepresentation;
            }
            else {
                node.stringRepresentation = this.getStringForNode(node);
                return node.stringRepresentation;
            }
        }
    }

    // Represents the information held by the current scope
    // - Which variables are assigned and defined
    // - With function definiteions are in scope // TODO later
    class Scope {
        constructor(statement) {
            this._statement = statement;
            this._assignments = {}; // A map between identifiers & AssignmentExpression/VariableDeclaration nodes
            this._declarations = {};
        }

        get Assignments() {
            return this._assignments;
        }

        get Declarations() {
            return this._declarations;
        }

        addAssignment(identifierName, expression) {
            // Only keep the most recent assignment or variable declaration for this identifer
            this._assignments[identifierName] = expression;
        }

        addDeclaration(identifierName, expression) {
            this._declarations[identifierName] = expression;
        }
    }

    $action.ASTAnalyzer = ASTAnalyzer;
})($action);