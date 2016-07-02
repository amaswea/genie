import { ERROR_MESSAGES } from "./strings";
import { Parser, ParsingError, Token, ErrorAST } from "./../pl";
import {
    JavaScriptProgramAST,
    JavaScriptFunctionAST,
    JavaScriptCommentAST,
    JavaScriptEmptyStatementAST,
    JavaScriptIfStatementAST,
    JavaScriptWhileStatementAST,
    JavaScriptDoWhileStatementAST,
    JavaScriptBreakStatementAST,
    JavaScriptContinueStatementAST,
    JavaScriptVariablesAST,
    JavascriptVariableAST,
    JavaScriptExpressionsAST,
    JavaScriptAssignmentAST,
    JavaScriptBinaryOperatorAST,
    JavaScriptConditionalExpressionAST,
    JavaScriptUnaryOperatorAST,
    JavaScriptNewExpressionAST,
    JavaScriptDeleteExpressionAST,
    JavaScriptDotExpressionAST,
    JavaScriptArrayExpressionAST,
    JavaScriptFunctionCallAST,
    JavaScriptArgumentsAST,
    JavaScriptParametersAST,
    JavaScriptBlockAST,
    JavaScriptReturnStatementAST,
    JavaScriptForLoopStatementAST,
    JavaScriptListIteratorStatementAST,
    JavaScriptTryStatementAST,
    JavaScriptSwitchStatementAST,
    JavaScriptIncrementAST,
    JavaScriptExpressionStatementAST,
    JavaScriptArrayLiteralAST,
    JavaScriptObjectLiteralAST
} from './ast';

/**
 * Parses a sequence of JavaScript tokens into a single abstract syntax tree.
 */
class JavaScriptParser extends Parser {

    constructor(tokens) {

        super(tokens);

        this._ast = this.parseProgram(tokens);

    }

    getAST() { return this._ast; }

    // Program:
    //      empty
    //      Element Program
    parseProgram(tokens) {

        var elements = [];

        // Parse elements until we run out of tokens.
        while(tokens.hasNext())
            elements.push(this.parseElement(tokens));

        return new JavaScriptProgramAST(elements);

    }

    // Comments can appear anywhere. We just convert them into a simple AST.
    // that can appear in any AST with a list of ASTs.
    parseComment(tokens) {

        return new JavaScriptCommentAST(tokens.consume("comment"));

    }

    // Element:
    //      FunctionDeclaration
    //      Statement
    parseElement(tokens) {

        // Remember the index of the token we were on.
        var indexOfStatement = tokens.getCurrentIndex();

        try {

            if(tokens.nextIs("comment"))
                return this.parseComment(tokens);
            else if (tokens.nextIs("keyword", "function"))
                return this.parseFunctionDeclaration(tokens);
            else
                return this.parseStatement(tokens);

        } catch(ex) {

            if(ex instanceof ParsingError) {

                // Remember the token we got stuck on.
                var problematicToken = tokens.previous();

                // Reset the token list to the start of the statement, then
                // read tokens until we reach a semicolon or the last token.
                tokens.setCurrentIndex(indexOfStatement);

                var errorTokens = [];

                while (tokens.hasNext())
                    errorTokens.push(tokens.consume());

                // Create an AST to store all of the bad tokens.
                var error = new ErrorAST(ex.getMessage(), problematicToken, errorTokens);

                // Remember the error.
                this._parsingErrors.push(error);

                return error;

            } else {

                throw ex;

            }

        }

    }

    // FunctionDeclaration:
    //      function Identifier ( OptionalParameterList ) CompoundStatement
    parseFunctionDeclaration(tokens) {

        if(tokens.nextIs("keyword", "function")) {
            return new JavaScriptFunctionAST(
                false,
                tokens.consume(),
                tokens.consume("name"),
                tokens.consume("punctuation", "("),
                this.parseOptionalParameterList(tokens),
                tokens.consume("punctuation", ")"),
                this.parseCompoundStatement(tokens)
            );
        }

    }

    // OptionalParameterList
    //      empty
    //      ParameterList:
    parseOptionalParameterList(tokens) {

        var parameters = [];

        var first = true;
        // Have we hit a paren yet? If not, read another name.
        while(!tokens.nextIs("punctuation", ")")) {
            // Require commas after the first name.
            if(!first)
                tokens.consume("punctuation", ",");
            // Read the next name.
            parameters.push(tokens.consume("name"));
            first = false;
        }

        return new JavaScriptParametersAST(parameters);

    }

    // CompoundStatement:
    //      { Statements }
    parseCompoundStatement(tokens) {

        var statements = [];

        tokens.consume("punctuation", "{");

        while(tokens.hasNext() && !tokens.nextIs("punctuation", "}")) {

            if(tokens.nextIs("comment"))
                statements.push(this.parseComment(tokens));
            else if(tokens.nextIs("keyword", "function"))
                statements.push(this.parseFunctionDeclaration(tokens));
            else
                statements.push(this.parseStatement(tokens));

        }

        tokens.consume("punctuation", "}");

        return new JavaScriptBlockAST(statements);

    }

    // Statement:
    //      ;
    //      if Condition Statement
    //      if Condition Statement else Statement
    //      while Condition Statement
    //      do Statement while Condition ;
    //      ForStatement
    //      break ;
    //      continue ;
    //      with ( Expression ) Statement
    //      return ExpressionOpt ;
    //      CompoundStatement
    //      VariablesOrExpression ;
    //      TryStatement
    //      SwitchStatement
    parseStatement(tokens) {

        // Remember the index of the token we were on.
        var indexOfStatement = tokens.getCurrentIndex();

        // Catch any parsing errors and put them in an error AST.
        try {

            if (tokens.nextIs("punctuation", ";")) {
                return new JavaScriptEmptyStatementAST(tokens.consume("punctuation", ";"));
            }
            else if (tokens.nextIs("keyword", "if")) {

                var keywordIf = tokens.consume("keyword", "if");
                var condition = this.parseCondition(tokens);
                var then = this.parseStatement(tokens);

                var keywordElse = null;
                var otherwise = null;

                if (tokens.nextIs("keyword", "else")) {
                    keywordElse = tokens.consume("keyword", "else");
                    otherwise = this.parseStatement(tokens);
                }

                return new JavaScriptIfStatementAST(
                    keywordIf,
                    condition,
                    then,
                    keywordElse,
                    otherwise
                );

            }
            else if (tokens.nextIs("keyword", "while")) {
                return new JavaScriptWhileStatementAST(
                    tokens.consume("keyword", "while"),
                    this.parseCondition(tokens),
                    this.parseStatement(tokens)
                );
            }
            else if (tokens.nextIs("keyword", "do")) {
                return new JavaScriptDoWhileStatementAST(
                    tokens.consume("keyword", "do"),
                    this.parseStatement(tokens),
                    tokens.consume("keyword", "while"),
                    this.parseCondition(tokens),
                    tokens.consume("punctuation", ";")
                );
            }
            else if (tokens.nextIs("keyword", "break")) {
                return new JavaScriptBreakStatementAST(
                    tokens.consume("keyword", "break"),
                    tokens.consume("punctuation", ";")
                )
            }
            else if (tokens.nextIs("keyword", "continue")) {
                return new JavaScriptContinueStatementAST(
                    tokens.consume("keyword", "continue"),
                    tokens.consume("punctuation", ";")
                )
            }
            else if (tokens.nextIs("keyword", "return")) {
                return new JavaScriptReturnStatementAST(
                    tokens.consume("keyword", "return"),
                    tokens.nextIs("punctuation", ";") ?
                        null :
                        this.parseExpression(tokens),
                    tokens.consume("punctuation", ";")
                )
            }
            else if (tokens.nextIs("punctuation", "{")) {
                return this.parseCompoundStatement(tokens);
            }
            else if (tokens.nextIs("keyword", "try")) {
                return this.parseTryStatement(tokens);
            }
            else if (tokens.nextIs("keyword", "for")) {
                return this.parseForStatement(tokens);
            }
            else if (tokens.nextIs("keyword", "switch")) {
                return this.parseSwitchStatement(tokens);
            }
            else if (tokens.nextIs("keyword", "with")) {
                throw new ParsingError(tokens.peek(), ERROR_MESSAGES.UNSUPPORTED_WITH);
            }
            // If none of the above matched, parse a variable declaration or expression.
            else {

                return new JavaScriptExpressionStatementAST(
                    this.parseVariablesOrExpression(tokens),
                    tokens.consume("punctuation", ";")
                );

            }

        } catch(ex) {

            if(ex instanceof ParsingError) {

                // Remember the token we got stuck on.
                var problematicToken = tokens.previous();

                // Reset the token list to the start of the statement, then
                // read tokens until we reach a semicolon or the last token.
                tokens.setCurrentIndex(indexOfStatement);

                var errorTokens = [];

                while (tokens.hasNext() && !tokens.nextIs("punctuation", ";"))
                    errorTokens.push(tokens.consume());

                if (tokens.hasNext() && tokens.nextIs("punctuation", ";"))
                    errorTokens.push(tokens.consume());

                // Create an AST to store all of the bad tokens.
                var error = new ErrorAST(ex.getMessage(), problematicToken, errorTokens);

                // Remember the error.
                this._parsingErrors.push(error);

                return error;

            } else {

                throw ex;

            }

        }

    }

    // SwitchStatement:
    //      switch ( Expression ) { ( ( case Expression : | default : )+ [StatementList])+ )* }
    parseSwitchStatement(tokens) {

        var keyword = tokens.consume("keyword", "switch");
        tokens.consume("punctuation", "(");
        var expression = this.parseExpression(tokens);
        tokens.consume("punctuation", ")");
        var left = tokens.consume("punctuation", "{");

        var cases = [];

        // Read all of the cases
        while(tokens.nextIs("keyword", "case") || tokens.nextIs("keyword", "default")) {

            var data = {
                keyword: tokens.consume("keyword"),
                expression: null,
                colon: null,
                statements: []
            };

            if(data.keyword.getText() === "case")
                data.expression = this.parseExpression(tokens);

            data.colon = tokens.consume("punctuation", ":");

            while(!tokens.nextIs("punctuation", "}") && !tokens.nextIs("keyword", "case") && !tokens.nextIs("keyword", "default"))
                data.statements.push(this.parseStatement(tokens));

            cases.push(data);

        }

        var right = tokens.consume("punctuation", "}");

        return new JavaScriptSwitchStatementAST(keyword, expression, left, cases, right);

    }

    // TryStatement:
    //  try CompoundStatement catch ( name ) CompoundStatement finally CompoundStatement ]
    parseTryStatement(tokens) {

        var tryKeyword = tokens.consume("keyword", "try");
        var statements = this.parseCompoundStatement(tokens);
        var finallyStatements = null;

        tokens.consume("keyword", "catch");
        tokens.consume("punctuation", "(");
        var name = tokens.consume("name");
        tokens.consume("punctuation", ")");
        var catchStatements = this.parseCompoundStatement(tokens);

        if(tokens.nextIs("keyword", "finally")) {

            tokens.consume("keyword", "finally");
            finallyStatements = this.parseCompoundStatement(tokens);

        }

        return new JavaScriptTryStatementAST(tryKeyword, statements, name, catchStatements, finallyStatements);


    }

    // ForStatement:
    //     for ( [VariablesOrExpression] ; Expression ; Expression ) Statement
    //     for ( VariablesOrExpression in Expression ) Statement
    parseForStatement(tokens) {

        var variablesOrExpression = null;
        var statement = null;
        var keyword = tokens.consume("keyword", "for");

        tokens.consume("punctuation", "(");

        if(!tokens.nextIs("punctuation", ";") && !tokens.nextIs("operator", "in")) {
            variablesOrExpression = this.parseVariablesOrExpression(tokens);
        }

        // Loop with condition
        if(tokens.nextIs("punctuation", ";")) {

            var firstSemi = tokens.consume("punctuation", ";");

            var condition = null;
            if(!tokens.nextIs("punctuation", ";"))
                condition = this.parseExpression(tokens);

            var secondSemi = tokens.consume("punctuation", ";");

            var incrementor = null;
            if(!tokens.nextIs("punctuation", ")"))
                incrementor = this.parseExpression(tokens);

            tokens.consume("punctuation", ")");

            statement = this.parseStatement(tokens);

            return new JavaScriptForLoopStatementAST(keyword, variablesOrExpression, firstSemi, condition, secondSemi, incrementor, statement);

        }
        // List loop
        else if(tokens.nextIs("operator", "in")) {

            tokens.consume("operator", "in");

            var list = this.parseExpression(tokens);

            tokens.consume("punctuation", ")");

            statement = this.parseStatement(tokens);

            return new JavaScriptListIteratorStatementAST(variablesOrExpression, list, statement);

        }
        else {

            throw new ParsingError(tokens.peek(), ERROR_MESSAGES.INVALID_FOR);

        }


    }

    // Condition:
    //      ( Expression )
    parseCondition(tokens) {

        tokens.consume("punctuation", "(");
        var condition = this.parseExpression(tokens);
        tokens.consume("punctuation", ")");

        return condition;

    }

    // VariablesOrExpression:
    //      var Variables
    //      Expression
    parseVariablesOrExpression(tokens) {

        if(tokens.nextIs("keyword", "var"))
            return this.parseVariables(tokens);
        else
            return this.parseExpression(tokens);

    }

    // Variables:
    //      Variable
    //      Variable , Variables
    parseVariables(tokens) {

        var variables = [];

        var keyword = tokens.consume("keyword", "var");

        variables.push(this.parseVariable(tokens));

        while(tokens.nextIs("punctuation", ",")) {
            tokens.consume("punctuation", ",");
            variables.push(this.parseVariable(tokens));
        }

        return new JavaScriptVariablesAST(keyword, variables);

    }

    // Variable:
    //      Identifier
    //      Identifier = AssignmentExpression
    parseVariable(tokens) {

        var identifier = tokens.consume("name");
        var assignment = null;
        var expression = null;

        if(tokens.nextIs("operator", "=")) {
            assignment = tokens.consume("operator", "=");
            expression = this.parseAssignmentExpression(tokens);
        }

        return new JavascriptVariableAST(identifier, assignment, expression);

    }

    // Expression:
    //      AssignmentExpression
    //      AssignmentExpression , Expression
    parseExpression(tokens) {

        var expressions = [];
        var commas = [];

        expressions.push(this.parseAssignmentExpression(tokens));

        while(tokens.nextIs("punctuation", ",")) {
            commas.push(tokens.consume("punctuation", ","));
            expressions.push(this.parseAssignmentExpression(tokens));
        }

        // Don't bother returning a list if it's just one.
        if(expressions.length === 1)
            return expressions[0];
        else
            return new JavaScriptExpressionsAST(expressions, commas);

    }

    // AssignmentExpression:
    //      ConditionalExpression
    //      ConditionalExpression AssignmentOperator AssignmentExpression
    parseAssignmentExpression(tokens) {

        var left = this.parseConditionalExpression(tokens);
        if(tokens.nextIs("operator", "=") ||
            tokens.nextIs("operator", "+=") ||
            tokens.nextIs("operator", "-=") ||
            tokens.nextIs("operator", "*=") ||
            tokens.nextIs("operator", "/=") ||
            tokens.nextIs("operator", "%=") ||
            tokens.nextIs("operator", "<<=") ||
            tokens.nextIs("operator", ">>=") ||
            tokens.nextIs("operator", ">>>=") ||
            tokens.nextIs("operator", "&=") ||
            tokens.nextIs("operator", "^=") ||
            tokens.nextIs("operator", "|=")) {

            if( (left instanceof Token && left.getType() === "name") ||
                (left instanceof JavaScriptDotExpressionAST && left.getMember().getType() === "name") ||
                (left instanceof JavaScriptArrayExpressionAST))
                return new JavaScriptAssignmentAST(left, tokens.consume("operator"), this.parseAssignmentExpression(tokens));
            else
                throw new ParsingError(tokens.peek(), ERROR_MESSAGES.INVALID_ASSIGNMENT);

        } else {
            return left;
        }

    }

    // ConditionalExpression:
    //      OrExpression
    //      OrExpression ? AssignmentExpression : AssignmentExpression
    parseConditionalExpression(tokens) {

        var left = this.parseOrExpression(tokens);

        if(tokens.nextIs("operator", "?")) {
            return new JavaScriptConditionalExpressionAST(
                left,
                tokens.consume("operator", "?"),
                this.parseAssignmentExpression(tokens),
                tokens.consume("punctuation", ":"),
                this.parseAssignmentExpression(tokens)
            );
        } else {
            return left;
        }

    }

    // OrExpression:
    //      AndExpression
    //      AndExpression || OrExpression
    parseOrExpression(tokens) {

        var left = this.parseAndExpression(tokens);
        if(tokens.nextIs("operator", "||")) {
            return new JavaScriptBinaryOperatorAST(left, tokens.consume("operator"), this.parseOrExpression(tokens));
        } else {
            return left;
        }

    }

    // AndExpression:
    //      BitwiseOrExpression
    //      BitwiseOrExpression && AndExpression
    parseAndExpression(tokens) {

        var left = this.parseBitwiseOrExpression(tokens);
        if(tokens.nextIs("operator", "&&")) {
            return new JavaScriptBinaryOperatorAST(left, tokens.consume("operator"), this.parseAndExpression(tokens));
        } else {
            return left;
        }

    }

    // BitwiseOrExpression:
    //      BitwiseXorExpression
    //      BitwiseXorExpression | BitwiseOrExpression
    parseBitwiseOrExpression(tokens) {

        var left = this.parseBitwiseXorExpression(tokens);
        if(tokens.nextIs("operator", "|")) {
            return new JavaScriptBinaryOperatorAST(left, tokens.consume("operator"), this.parseBitwiseOrExpression(tokens));
        } else {
            return left;
        }

    }

    // BitwiseXorExpression:
    //      BitwiseAndExpression
    //      BitwiseAndExpression ^ BitwiseXorExpression
    parseBitwiseXorExpression(tokens) {

        var left = this.parseBitwiseAndExpression(tokens);
        if(tokens.nextIs("operator", "^")) {
            return new JavaScriptBinaryOperatorAST(left, tokens.consume("operator"), this.parseBitwiseXorExpression(tokens));
        } else {
            return left;
        }

    }

    // BitwiseAndExpression:
    //      EqualityExpression
    //      EqualityExpression & BitwiseAndExpression
    parseBitwiseAndExpression(tokens) {

        var left = this.parseEqualityExpression(tokens);
        if(tokens.nextIs("operator", "&")) {
            return new JavaScriptBinaryOperatorAST(left, tokens.consume("operator"), this.parseBitwiseAndExpression(tokens));
        } else {
            return left;
        }

    }

    // EqualityExpression:
    //      RelationalExpression
    //      RelationalExpression EqualityOperator EqualityExpression
    parseEqualityExpression(tokens) {

        var left = this.parseRelationalExpression(tokens);
        if(tokens.nextIs("operator", "==") || tokens.nextIs("operator", "===") || tokens.nextIs("operator", "!=") || tokens.nextIs("operator", "!==")) {
            return new JavaScriptBinaryOperatorAST(left, tokens.consume("operator"), this.parseEqualityExpression(tokens));
        } else {
            return left;
        }

    }

    // RelationalExpression:
    //      ShiftExpression
    //      RelationalExpression RelationalOperator ShiftExpression
    parseRelationalExpression(tokens) {

        var left = this.parseShiftExpression(tokens);
        if(tokens.nextIs("operator", ">") || tokens.nextIs("operator", ">=") || tokens.nextIs("operator", "<") || tokens.nextIs("operator", "<=")) {
            return new JavaScriptBinaryOperatorAST(left, tokens.consume("operator"), this.parseShiftExpression(tokens));
        } else {
            return left;
        }

    }

    // ShiftExpression:
    //      AdditiveExpression
    //      AdditiveExpression ShiftOperator ShiftExpression
    parseShiftExpression(tokens) {

        var left = this.parseAdditiveExpression(tokens);
        if(tokens.nextIs("operator", "<<") || tokens.nextIs("operator", ">>") || tokens.nextIs("operator", ">>>")) {
            return new JavaScriptBinaryOperatorAST(left, tokens.consume("operator"), this.parseShiftExpression(tokens));
        } else {
            return left;
        }

    }

    // AdditiveExpression:
    //      MultiplicativeExpression
    //      MultiplicativeExpression + AdditiveExpression
    //      MultiplicativeExpression - AdditiveExpression
    parseAdditiveExpression(tokens) {

        var left = this.parseMultiplicativeExpression(tokens);
        if(tokens.nextIs("operator", "+") || tokens.nextIs("operator", "-")) {
            return new JavaScriptBinaryOperatorAST(left, tokens.consume("operator"), this.parseAdditiveExpression(tokens));
        } else {
            return left;
        }

    }

    // MultiplicativeExpression:
    //      UnaryExpression
    //      UnaryExpression MultiplicativeOperator MultiplicativeExpression
    parseMultiplicativeExpression(tokens) {

        var left = this.parseUnaryExpression(tokens);
        if(tokens.nextIs("operator", "*") || tokens.nextIs("operator", "/") || tokens.nextIs("operator", "%")) {
            return new JavaScriptBinaryOperatorAST(left, tokens.consume("operator"), this.parseMultiplicativeExpression(tokens));
        } else {
            return left;
        }

    }

    // UnaryExpression:
    //      MemberExpression
    //      IncrementOperator MemberExpression
    //      MemberExpression IncrementOperator
    //      UnaryOperator UnaryExpression
    //      - UnaryExpression
    //      new Constructor
    //      delete MemberExpression
    parseUnaryExpression(tokens) {

        // If next is primary...
        if(tokens.nextIs("punctuation", "(") ||
            tokens.nextIs("punctuation", "[") ||
            tokens.nextIs("punctuation", "{") ||
            tokens.nextIs("keyword", "function") ||
            tokens.nextIs("name") ||
            tokens.nextIs("string") ||
            tokens.nextIs("number") ||
            tokens.nextIs("regexp") ||
            tokens.nextIs("atom")) {

            var member = this.parseMemberExpression(tokens);

            if(tokens.nextIs("operator", "--") || tokens.nextIs("operator", "++"))
                return new JavaScriptIncrementAST(tokens.consume("operator"), member, false);
            else
                return member;

        }
        // If next is unary operator
        else if(
            tokens.nextIs("operator", "typeof") ||
            tokens.nextIs("operator", "void") ||
            tokens.nextIs("operator", "!") ||
            tokens.nextIs("operator", "~") ||
            tokens.nextIs("operator", "-") ||
            tokens.nextIs("operator", "+")
        ) {
            return new JavaScriptUnaryOperatorAST(tokens.consume("operator"), this.parseUnaryExpression(tokens));
        }
        else if(tokens.nextIs("operator", "--") ||
            tokens.nextIs("operator", "++")) {
            return new JavaScriptIncrementAST(tokens.consume("operator"), this.parseMemberExpression(tokens), true);
        }
        else if(tokens.nextIs("operator", "new")) {
            return this.parseNewExpression(tokens);
        }
        else if(tokens.nextIs("operator", "delete")) {
            return new JavaScriptDeleteExpressionAST(tokens.consume("operator", "delete"), this.parseMemberExpression(tokens));
        }
        else {
            throw new ParsingError(tokens.peek(), ERROR_MESSAGES.INVALID_EXPRESSION);
        }

    }

    // Constructor:
    //      [this . ] Identifier [ . Identifier ]* ( Arguments )
    parseNewExpression(tokens) {

        var keyword = tokens.consume("operator", "new");

        // Read one or more . separated identifiers.
        var identifiers = [ tokens.consume("name") ];
        while(tokens.nextIs("punctuation", ".")) {

            tokens.consume("punctuation", ".");
            identifiers.push(tokens.consume("name"));

        }

        // Read the arguments if there are any.
        var args = null;
        if(tokens.nextIs("punctuation", "(")) {
            tokens.consume("punctuation", "(");
            args = this.parseArgumentList(tokens);
            tokens.consume("punctuation", ")");
        }

        return new JavaScriptNewExpressionAST(keyword, identifiers, args);

    }

    // MemberExpression:
    //      PrimaryExpression ( . Identifier | [ Expression ] | ( ArgumentList ) )*
    parseMemberExpression(tokens) {

        var primary = this.parsePrimaryExpression(tokens);

        // Chain member expressions until we run out.
        while(tokens.nextIs("punctuation", ".") || tokens.nextIs("punctuation", "[") || tokens.nextIs("punctuation", "(")) {

            if (tokens.nextIs("punctuation", ".")) {
                primary = new JavaScriptDotExpressionAST(
                    primary,
                    tokens.consume("punctuation", "."),
                    tokens.consume("name")
                );
            }
            else if (tokens.nextIs("punctuation", "[")) {
                primary = new JavaScriptArrayExpressionAST(
                    primary,
                    tokens.consume("punctuation", "["),
                    this.parseExpression(tokens),
                    tokens.consume("punctuation", "]")
                );
            }
            else if (tokens.nextIs("punctuation", "(")) {
                primary = new JavaScriptFunctionCallAST(
                    primary,
                    tokens.consume("punctuation", "("),
                    this.parseArgumentList(tokens),
                    tokens.consume("punctuation", ")")
                );
            }

        }

        return primary;

    }

    // ArgumentListOptional:
    //      empty
    //      AssignmentExpression
    //      AssignmentExpression , ArgumentList
    parseArgumentList(tokens) {

        var args = [];
        var first = true;

        while(!tokens.nextIs("punctuation", ")")) {
            if(!first) {
                tokens.consume("punctuation", ",");
            }
            args.push(this.parseAssignmentExpression(tokens));
            first = false;
        }

        return new JavaScriptArgumentsAST(args);

    }

    // PrimaryExpression:
    //      ( Expression )
    //      Identifier
    //      IntegerLiteral
    //      FloatingPointLiteral
    //      StringLiteral
    //      RegExp
    //      false
    //      true
    //      null
    //      this
    //      undefined
    //      function [name] ( Params ) CompoundStatement
    parsePrimaryExpression(tokens) {

        if(tokens.nextIs("punctuation", "(")) {

            tokens.consume("punctuation", "(");
            var expression = this.parseExpression(tokens);
            tokens.consume("punctuation", ")");
            return expression;

        }
        else if(tokens.nextIs("name")) {
            return tokens.consume("name");
        }
        else if(tokens.nextIs("number")) {
            return tokens.consume("number");
        }
        else if(tokens.nextIs("string")) {
            return tokens.consume("string");
        }
        else if(tokens.nextIs("atom")) {
            return tokens.consume("atom");
        }
        else if(tokens.nextIs("regexp")) {
            return tokens.consume("regexp");
        }
        // Array literal
        else if(tokens.nextIs("punctuation", "[")) {
            return this.parseArrayLiteral(tokens);
        }
        // Object literal
        else if(tokens.nextIs("punctuation", "{")) {
            return this.parseObjectLiteral(tokens);
        }
        // Function
        else if(tokens.nextIs("keyword", "function")) {
            return new JavaScriptFunctionAST(
                true,
                tokens.consume(),
                tokens.nextIs("name") ? tokens.consume("name") : null,
                tokens.consume("punctuation", "("),
                this.parseOptionalParameterList(tokens),
                tokens.consume("punctuation", ")"),
                this.parseCompoundStatement(tokens)
            );
        }

        // Oh noes!
        throw new ParsingError(tokens.peek(), ERROR_MESSAGES.INVALID_EXPRESSION);

    }

    parseArrayLiteral(tokens) {

        var left = tokens.consume("punctuation", "[");
        var expressions = [];
        var first = true;

        while(!tokens.nextIs("punctuation", "]")) {

            if(!first)
                tokens.consume("punctuation", ",");
            first = false;
            expressions.push(this.parseAssignmentExpression(tokens));

        }

        var right = tokens.consume("punctuation", "]");

        return new JavaScriptArrayLiteralAST(left, expressions, right);

    }

    parseObjectLiteral(tokens) {

        var left = tokens.consume("punctuation", "{");
        var keys = [];
        var values = [];
        var first = true;

        while(!tokens.nextIs("punctuation", "}")) {

            if(!first)
                tokens.consume("punctuation", ",");
            first = false;

            if(!tokens.nextIs("name") && !tokens.nextIs("number") && !tokens.nextIs("string") && !tokens.nextIs("atom"))
                throw new ParsingError(tokens.peek(), ERROR_MESSAGES.INVALID_OBJECT_KEY);

            keys.push(tokens.consume());

            tokens.consume("punctuation", ":");

            values.push(this.parseAssignmentExpression(tokens));

        }

        var right = tokens.consume("punctuation", "}");

        return new JavaScriptObjectLiteralAST(left, keys, values, right);

    }


}

export { JavaScriptParser }