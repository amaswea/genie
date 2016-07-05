"use strict";
import _ from "lodash";
import { Token, AST } from "./pl";
import {
    JavaScriptNoOpInstruction,
    JavaScriptClearInstruction,
    JavaScriptPushInstruction,
    JavaScriptParameterInstruction,
    JavaScriptVariableAssignmentInstruction,
    JavaScriptMemberAssignmentInstruction,
    JavaScriptArrayAssignmentInstruction,
    JavaScriptBinaryOperatorInstruction,
    JavaScriptUnaryOperatorInstruction,
    JavaScriptJumpIfFalseInstruction,
    JavaScriptJumpInstruction,
    JavaScriptDeclareFunctionInstruction,
    JavaScriptPushFunctionInstruction,
    JavaScriptDeclareInstruction,
    JavaScriptNewInstruction,
    JavaScriptCallInstruction,
    JavaScriptMemberAccessInstruction,
    JavaScriptArrayAccessInstruction,
    JavaScriptReturnInstruction,
    JavaScriptCreateArrayInstruction,
    JavaScriptCreateObjectInstruction,
    JavaScriptCaseInstruction
} from "./instructions"

import { EXPLANATIONS } from "./strings";

class JavaScriptProgramAST extends AST {

    constructor(elements) {

        super();

        this._elements = elements;

    }

    serialize() {

        // Serialize all elements into instruction lists and concatenate them together.
        return _.flatMap(this._elements, (el) => { return el.serialize(); });

    }

}

class JavaScriptFunctionAST extends AST {

    constructor(isExpression, keyword, name, leftParen, parameters, rightParen, block) {

        super();

        this._isExpression = isExpression;
        this._keyword = keyword;
        this._name = name; // Can be null.
        this._left = leftParen;
        this._parameters = parameters;
        this._right = rightParen;
        this._block = block;

    }

    getName() { return this._name; }
    getParameters() { return this._parameters; }
    getBlock() { return this._block; }

    serialize() {

        return [
            this._isExpression ?
                new JavaScriptPushFunctionInstruction(
                    this,
                    EXPLANATIONS.PUSH_FUNCTION,
                    this._keyword
                )
                :
                new JavaScriptDeclareFunctionInstruction(
                    this,
                    EXPLANATIONS.DECLARE_FUNCTION,
                    this._keyword
                )
        ];

    }

}

class JavaScriptCommentAST extends AST {

    constructor(token) {

        super();

        this._whitespace = token;

    }

    serialize() {

        return [
            new JavaScriptNoOpInstruction(
                this,
                this._whitespace.getText().replace("//", "").replace("/*", "").replace("*/", "").replace("\n", " ").trim(),
                this._whitespace
            )
        ];

    }

}

class JavaScriptEmptyStatementAST extends AST {

    constructor(semicolon) {

        super();

        this._token = semicolon;

    }

    serialize() {

        return [
            new JavaScriptNoOpInstruction(
                this,
                EXPLANATIONS.EMPTY_STATEMENT,
                this._token
            )
        ];

    }

}

class JavaScriptIfStatementAST extends AST {

    constructor(keyword1, condition, statement1, keyword2, statement2) {

        super();

        this._ifKeyword = keyword1;
        this._condition = condition;
        this._thenStatement = statement1;
        this._elseKeyword = keyword2;
        this._elseStatement = statement2;

    }

    serialize() {

        var conditionStatements = this._condition.serialize();
        var thenStatements = this._thenStatement.serialize();

        if(this._elseStatement === null) {

            return _.concat(
                [ new JavaScriptNoOpInstruction(this, EXPLANATIONS.IF_START, this._ifKeyword) ],
                conditionStatements,
                new JavaScriptJumpIfFalseInstruction(
                    this,
                    EXPLANATIONS.IF_TRUE,
                    thenStatements.length + 1,
                    this._ifKeyword
                ),
                thenStatements
            );

        }
        else {

            var elseStatements = this._elseStatement.serialize();

            return _.concat(
                [ new JavaScriptNoOpInstruction(this, EXPLANATIONS.IF_START, this._ifKeyword) ],
                conditionStatements,
                new JavaScriptJumpIfFalseInstruction(
                    this,
                    EXPLANATIONS.IF_FALSE_ELSE,
                    thenStatements.length + 2,
                    this._ifKeyword
                ),
                thenStatements,
                new JavaScriptJumpInstruction(
                    this,
                    EXPLANATIONS.SKIP_ELSE,
                    elseStatements.length,
                    this._elseKeyword
                ),
                elseStatements
            );

        }

    }

}

class JavaScriptWhileStatementAST extends AST {

    constructor(keyword, condition, statement) {

        super();

        this._while = keyword;
        this._condition = condition;
        this._statement = statement;

    }

    serialize() {

        var condition = this._condition.serialize();
        var statements = this._statement.serialize();

        // Update the break and continue offsets now that the loop is calculated.
        _.forEach(statements, (instruction, index) => {
            // If it's a break, jump past the loop's jump.
            if(instruction.getAST() instanceof JavaScriptBreakStatementAST)
                instruction.updateOffset((statements.length - index) + 1);
            // If it's a continue, jump past the incrementor.
            else if(instruction.getAST() instanceof JavaScriptContinueStatementAST)
                instruction.updateOffset(-(index + condition.length + 1));
        });

        return _.concat(
            [ new JavaScriptNoOpInstruction(this, EXPLANATIONS.WHILE_START, this._while) ],
            condition,
            new JavaScriptJumpIfFalseInstruction(
                this,
                EXPLANATIONS.EXIT_WHILE,
                statements.length + 2,
                this._while
            ),
            statements,
            // Jump back to the beginning of the condition.
            new JavaScriptJumpInstruction(
                this,
                EXPLANATIONS.CONTINUE_WHILE,
                -(statements.length + condition.length +  1),
                this._while
            )
        );

    }

}

class JavaScriptDoWhileStatementAST extends AST {

    constructor(doKeyword, statement, whileKeyword, condition) {

        super();

        this._do = doKeyword;
        this._statement = statement;
        this._while = whileKeyword;
        this._condition = condition;

    }

    serialize() {

        var condition = this._condition.serialize();
        var statements = this._statement.serialize();

        // Update the break and continue offsets now that the loop is calculated.
        _.forEach(statements, (instruction, index) => {
            // If it's a break, jump past the loop's jump.
            if(instruction.getAST() instanceof JavaScriptBreakStatementAST)
                instruction.updateOffset((statements.length - index) + condition.length + 2);
            // If it's a continue, jump past the incrementor.
            else if(instruction.getAST() instanceof JavaScriptContinueStatementAST)
                instruction.updateOffset(statements.length - index);
        });

        return _.concat(
            [ new JavaScriptNoOpInstruction(this, EXPLANATIONS.DO_WHILE_START, this._do) ],
            // Run the statements
            statements,
            // Compute the condition expression
            condition,
            // If its false, quit the loop.
            new JavaScriptJumpIfFalseInstruction(
                this,
                EXPLANATIONS.EXIT_DO_WHILE,
                2,
                this._while
            ),
            // Jump back to the beginning of the condition.
            new JavaScriptJumpInstruction(
                this,
                EXPLANATIONS.CONTINUE_WHILE,
                -(statements.length + condition.length +  1),
                this._do
            )
        );

    }

}

class JavaScriptBreakStatementAST extends AST {

    constructor(keyword, semicolon) {

        super();

        this._break = keyword;
        this._token = semicolon;

    }

    serialize() {

        // Note that we rely on the enclosing loop to update the offset for this jump instruction.
        // once it's done serializing its loop body.
        return [ new JavaScriptJumpInstruction(
            this,
            EXPLANATIONS.BREAK,
            0,
            this._break
        )];

    }

}

class JavaScriptContinueStatementAST extends AST {

    constructor(keyword, semicolon) {

        super();

        this._continue = keyword;
        this._token = semicolon;

    }

    serialize() {

        // Note that we rely on the enclosing loop to update the offset for this jump instruction.
        // once it's done serializing its loop body.
        return [ new JavaScriptJumpInstruction(
            this,
            EXPLANATIONS.CONTINUE,
            0,
            this._continue
        )];

    }

}

class JavaScriptVariablesAST extends AST {

    constructor(keyword, variables) {

        super();

        this._var = keyword;
        this._variables = variables;

    }

    serialize() {

        // Serialize all variable declarations into instruction lists and concatenate them together.
        return _.concat(
            [ new JavaScriptNoOpInstruction(this, EXPLANATIONS.DECLARATION_START, this._var) ],
            _.flatMap(this._variables, (el) => { return el.serialize(); })
        );

    }

}

class JavascriptVariableAST extends AST {

    constructor(identifier, assignment, expression) {

        super();
        this._identifier = identifier;
        this._assignment = assignment;
        this._expression = expression;

    }

    serialize() {

        return _.concat(
            [ new JavaScriptNoOpInstruction(this, EXPLANATIONS.VARIABLE_START(this._identifier.getText()), this._identifier) ],
            this._expression === null ?
                // If there's no value, push "undefined" by default.
                [ new JavaScriptPushInstruction(
                    this,
                    EXPLANATIONS.NO_INITIALIZATION,
                    null
                ) ] :
                // Otherwise, compute the value to push.
                this._expression.serialize(),
            // Declare the variable with the value we computed.
            new JavaScriptDeclareInstruction(
                this,
                EXPLANATIONS.DECLARE(this._identifier.getText()),
                this._assignment,
                this._identifier
            )
        );

    }

}

class JavaScriptExpressionsAST extends AST {

    constructor(expressions, commas) {

        super();

        this._expressions = expressions;
        this._commas = commas;

    }

    serialize() {

        // Serialize all expressions, append a stack clear after each, and concat each list together.
        return _.flatMap(
            this._expressions,
            (expression, index) => {
                return _.concat(
                    expression.serialize(),
                    index === this._expressions.length - 1 ?
                        [] :
                        [ new JavaScriptClearInstruction(
                            this,
                            EXPLANATIONS.CLEAR_EXPRESSIONS,
                            this._commas[index])
                        ]
                );
            }
        );

    }

}

class JavaScriptAssignmentAST extends AST {

    constructor(left, operator, right) {

        super();

        this._left = left;
        this._operator = operator;
        this._right = right;

    }

    serialize() {

        // Grab the left hand side AST.
        var left = this._left;

        // Get the instructions for the expression.
        var expression = this._right.serialize();

        // If it's just a name, compute the value then assignment the name the value.
        if(left instanceof Token) {
            return _.concat(
                expression,
                [
                    new JavaScriptVariableAssignmentInstruction(
                        this,
                        EXPLANATIONS.ASSIGNMENT(this._operator.getText(), left.getText()),
                        left,
                        this._operator,
                        true
                    )
                ]
            );
        }
        // If it's a member assignment, compute the value then assign the name.
        else if(left instanceof JavaScriptDotExpressionAST) {
            return _.concat(
                left.getPrimary().serialize(),
                expression,
                [
                    new JavaScriptMemberAssignmentInstruction(
                        this,
                        EXPLANATIONS.MEMBER_ASSIGNMENT(left.getMember().getText()),
                        left.getMember(),
                        this._operator,
                        true
                    )
                ]
            );
        }
        else if(left instanceof JavaScriptArrayExpressionAST) {
            return _.concat(
                left.getPrimary().serialize(),
                left.getIndex().serialize(),
                expression,
                [ new JavaScriptArrayAssignmentInstruction(
                    this,
                    EXPLANATIONS.ARRAY_ASSIGNMENT,
                    this._operator,
                    true
                )]
            );
        }

        throw new Error("How did this invalid left hand assignment make it in here?");

    }

}

class JavaScriptBinaryOperatorAST extends AST {

    constructor(left, operator, right) {

        super();

        this._left = left;
        this._operator = operator;
        this._right = right;

    }

    getOperator() { return this._operator.getText(); }

    serialize() {

        return _.concat(
            this._left.serialize(),
            this._right.serialize(),
            new JavaScriptBinaryOperatorInstruction(
                this,
                EXPLANATIONS.BINARY_OPERATOR,
                this._operator
            )
        );

    }

}


class JavaScriptConditionalExpressionAST extends AST {

    constructor(condition, questionMark, trueExpression, colon, falseExpression) {

        super();
        this._condition = condition;
        this._questionMark = questionMark;
        this._true = trueExpression;
        this._colon = colon;
        this._false = falseExpression;

    }

    serialize() {

        var conditionStatements = this._condition.serialize();
        var trueStatements = this._true.serialize();
        var falseStatements = this._false.serialize();

        return _.concat(
            conditionStatements,
            [ new JavaScriptJumpIfFalseInstruction(
                this,
                EXPLANATIONS.CONDITIONAL_EXPRESSION_TRUE,
                trueStatements.length + 1,
                this._questionMark
            )],
            trueStatements,
            [new JavaScriptJumpInstruction(
                this,
                EXPLANATIONS.CONDITIONAL_EXPRESSION_SKIP,
                falseStatements.length + 1,
                this._colon
            )],
            falseStatements
        );

    }

}

class JavaScriptUnaryOperatorAST extends AST {

    constructor(operator, expression) {

        super();
        this._operator = operator;
        this._expression = expression;

    }

    serialize() {

        return _.concat(
            this._expression.serialize(),
            new JavaScriptUnaryOperatorInstruction(
                this,
                EXPLANATIONS.UNARY_OPERATOR,
                this._operator
            )
        );

    }

}

class JavaScriptNewExpressionAST extends AST {

    /**
     *
     * @param { Token } keyword
     * @param { Token[] } identifiers
     * @param { ?AST[] } args
     */
    constructor(keyword, identifiers, args) {

        super();

        this._keyword = keyword;
        this._identifiers = identifiers;
        this._arguments = args; // Could be null.

    }

    getArguments() { return this._arguments; }

    serialize() {

        return _.concat(
            [ new JavaScriptNoOpInstruction(this, EXPLANATIONS.NEW_START, this._keyword) ],
            // Resolve the first identifier
            new JavaScriptPushInstruction(
                this,
                EXPLANATIONS.RESOLVE_NAME(this._identifiers[0].getText()),
                this._identifiers[0]
            ),
            // Generate member accessors for the rest of the identifiers
            _.map(this._identifiers.slice(1), (id) => {
                return new JavaScriptMemberAccessInstruction(
                    this,
                    EXPLANATIONS.RESOLVE_NAME(id.getText()),
                    id,
                    id
                ); }),
            // Compute the arguments
            this._arguments ? this._arguments.serialize() : [],
            // Call the constructor
            new JavaScriptNewInstruction(
                this,
                EXPLANATIONS.NEW,
                this._keyword
            )
        );

    }

}

class JavaScriptDeleteExpressionAST extends AST {

    constructor(keyword, member) {

        super();
        this._delete = keyword;
        this._member = member;

    }

    // TODO Delete
    serialize() {

        return [
            new JavaScriptNoOpInstruction(
                this,
                EXPLANATIONS.NOT_IMPLEMENTED
            )
        ];

    }

}

class JavaScriptDotExpressionAST extends AST {

    constructor(primary, dot, member) {

        super();
        this._primary = primary;
        this._dot = dot;
        this._member = member;

    }

    getPrimary() { return this._primary; }
    getDot() { return this._dot; }
    getMember() { return this._member; }

    serialize() {

        return _.concat(
            this._primary.serialize(),
            [ new JavaScriptMemberAccessInstruction(
                this,
                EXPLANATIONS.MEMBER_ACCESS(this._member.getText()),
                this._dot,
                this._member
            )]
        );

    }

}

class JavaScriptArrayExpressionAST extends AST {

    constructor(primary, left, index, right) {

        super();

        this._primary = primary;
        this._index = index;
        this._left = left;
        this._right = right;

    }

    getPrimary() { return this._primary; }
    getIndex() { return this._index; }
    getLeft() { return this._left; }
    getRight() { return this._right; }

    serialize() {

        return _.concat(
            this._primary.serialize(),
            this._index.serialize(),
            [ new JavaScriptArrayAccessInstruction(
                this,
                EXPLANATIONS.ARRAY_ACCESS,
                this._left,
                this._right
            )]
        );

    }

}

class JavaScriptFunctionCallAST extends AST {

    constructor(primary, left, args, right) {

        super();

        this._primary = primary;
        this._left = left;
        this._arguments = args;
        this._right = right;

    }

    getArgumentCount() {

        return this._arguments.getCount();

    }

    serialize() {

        return _.concat(
            [ new JavaScriptNoOpInstruction(this, EXPLANATIONS.CALL_START, this._left, this._right) ],
            this._primary.serialize(),
            this._arguments.serialize(),
            [ new JavaScriptCallInstruction(
                this,
                EXPLANATIONS.CALL,
                this._left,
                this._right
            )]
        );

    }

}

class JavaScriptArgumentsAST extends AST {

    constructor(args) {

        super();
        this._arguments = args;

    }

    getCount() {

        return this._arguments.length;

    }

    serialize() {

        // Serialize all argument expressions into instruction lists and concatenate them together.
        return _.flatMap(this._arguments, (el) => { return el.serialize(); });

    }

}

class JavaScriptParametersAST extends AST {

    constructor(parameters) {

        super();
        this._parameters = parameters;

    }

    serialize() {

        return _.map(this._parameters, (param) => {
            return new JavaScriptParameterInstruction(
                this,
                EXPLANATIONS.PARAM(param.getText()),
                param
            );
        });

    }

}

class JavaScriptBlockAST extends AST {

    constructor(statements) {

        super();
        this._statements = statements;

    }

    serialize() {

        // Serialize all argument expressions into instruction lists and concatenate them together.
        return _.flatMap(this._statements, (el) => { return el.serialize(); });

    }

}

class JavaScriptReturnStatementAST extends AST {

    constructor(keyword, expression, semicolon) {

        super();
        this._return = keyword;
        this._expression = expression;
        this._token = semicolon;

    }

    serialize() {

        return _.concat(
            [ new JavaScriptNoOpInstruction(this, EXPLANATIONS.RETURN_START, this._return) ],
            this._expression === null ?
                [ new JavaScriptPushInstruction(
                    this,
                    EXPLANATIONS.NO_RETURN,
                    null
                ) ] :
                this._expression.serialize(),
            new JavaScriptReturnInstruction(
                this,
                EXPLANATIONS.RETURN,
                this._return
            )
        );

    }

}

class JavaScriptForLoopStatementAST extends AST {

    constructor(keyword, init, firstSemi, condition, secondSemi, incrementor, statement) {

        super();

        this._for = keyword;
        this._initialization = init;
        this._firstSemi = firstSemi;
        this._condition = condition;
        this._secondSemi = secondSemi;
        this._incrementor = incrementor;
        this._statement = statement;

    }

    serialize() {

        var initialization = this._initialization ? this._initialization.serialize() : [];

        // The incrementor runs after the loop.
        var incrementor = this._incrementor ?
            _.concat(
                // Explain the increment step.
                [ new JavaScriptNoOpInstruction(this, EXPLANATIONS.FOR_INCREMENT, this._secondSemi) ],
                // Do the increment.
                this._incrementor.serialize(),
                // Clear the stack.
                new JavaScriptClearInstruction(
                    this,
                    EXPLANATIONS.CLEAR_INCREMENT,
                    this._for
                )
            ) :
            [];

        var statement = this._statement.serialize();

        // The loop includes the statement and the incrementor.
        var loop = _.concat(
            [ new JavaScriptNoOpInstruction(this, EXPLANATIONS.LOOP_START, this._secondSemi) ],
            statement,
            incrementor
        );

        // The condition evaluates an expression and then jumps out of the loop if it's false.
        var condition =
            this._condition ?
                _.concat(
                    [ new JavaScriptNoOpInstruction(this, EXPLANATIONS.FOR_CONDITION, this._firstSemi) ],
                    this._condition.serialize(),
                    // If false, jump out of this loop (past the statement, increment, and loop jump)
                    new JavaScriptJumpIfFalseInstruction(
                        this,
                        EXPLANATIONS.EXIT_FOR,
                        loop.length + 1 + 1,
                        this._secondSemi
                    )
                ) :
                [];

        // Update the break and continue offsets now that the loop is calculated.
        _.forEach(loop, (instruction, index) => {
            // If it's a break, jump past the remaining statement instructions, incrementor instructions, and jump, out of the loop.
            if(instruction.getAST() instanceof JavaScriptBreakStatementAST)
                instruction.updateOffset((loop.length - index) + 1);
            // If it's a continue, jump past the remaining statement instructions.
            else if(instruction.getAST() instanceof JavaScriptContinueStatementAST)
                instruction.updateOffset(statement.length - index);
        });

        return _.concat(
            // Explain the start of the for loop.
            [ new JavaScriptNoOpInstruction(this, EXPLANATIONS.FOR_START, this._for) ],
            // Run the initialization code.
            initialization,
            // Check the condition
            condition,
            // Do the statement, increment
            loop,
            // Jump back to the condition.
            new JavaScriptJumpInstruction(
                this,
                EXPLANATIONS.CONTINUE_FOR,
                -(loop.length + condition.length),
                this._for
            )

        );

    }

}

class JavaScriptListIteratorStatementAST extends AST {

    constructor(variable, list, statement) {

        super();

        this._variable = variable;
        this._list = list;
        this._statement = statement;

    }

    // TODO Iterator
    serialize() {

        return [
            new JavaScriptNoOpInstruction(
                this,
                EXPLANATIONS.NOT_IMPLEMENTED
            )
        ];

    }

}

class JavaScriptTryStatementAST extends AST {

    constructor(tryKeyword, statements, name, catchStatements, finallyStatements) {

        super();

        this._try = tryKeyword;
        this._statements = statements;
        this._name = name;
        this._catchStatements = catchStatements;
        this._finallyStatements = finallyStatements;

    }

    // TODO Try/catch
    serialize() {

        return [
            new JavaScriptNoOpInstruction(
                this,
                EXPLANATIONS.NOT_IMPLEMENTED
            )
        ];

    }

}

class JavaScriptSwitchStatementAST extends AST {

    constructor(keyword, expression, left, cases, right) {

        super();

        this._switch = keyword;
        this._expression = expression;
        this._left = left;
        this._cases = cases;
        this._right = right;

    }

    serialize() {

        // Each case has {
        //   keyword: tokens.consume("keyword"),
        //   expression: null,
        //   colon: null,
        //   statements: []
        // }

        var instructions = [];

        instructions.push(new JavaScriptNoOpInstruction(this, EXPLANATIONS.SWITCH_START, this._switch));

        // Compute the value for comparison.
        instructions = _.concat(instructions, this._expression.serialize());

        // For each case, compute the value for comparison and === it
        // to the value on the accumulator. If it's not equal, then jump to the next case.
        // Ignore the breaks until after we're done.
        _.forEach(this._cases, (check, index) => {

            // Compile the statements into a big list.
            var statements = _.flatMap(check.statements, (statement) => { return statement.serialize() });

            // Handle this case
            if(check.keyword.getText() === "case") {

                // Compute the value.
                instructions = _.concat(instructions, check.expression.serialize());

                // We add a fall through unless we're on the last instruction, or the next
                // case is a default.
                var addFallThrough = index < this._cases.length - 1 && this._cases[index + 1].expression !== null;

                // Pop the value off the stack and compare it to the value below. Jump past them if.
                instructions.push(new JavaScriptCaseInstruction(
                    this,
                    EXPLANATIONS.CASE,
                    statements.length + 1 + (addFallThrough ? 1 : 0), 
                    check.keyword
                ));

                // Append the case's statements.
                instructions = _.concat(instructions, statements);

                // After executing this case, jump past the next case check. This implements
                // the fall-through behavior that is prevented by break statements.
                if(addFallThrough) {
                    // Serialize the next case's expression so we know how far to jump.
                    var nextCaseValueInstructions = this._cases[index + 1].expression.serialize();
                    // Jump past the expression and the case.
                    instructions.push(new JavaScriptJumpInstruction(
                        this,
                        EXPLANATIONS.NEXT_CASE,
                        nextCaseValueInstructions.length + 1 + 1,
                        this._cases[index + 1].keyword
                    ))
                }

            }
            // For the default case, just serialize the instructions.
            else {

                instructions = _.concat(instructions, statements);

            }

       });

        // Clear the switch value off the accumulator.
        instructions.push(new JavaScriptClearInstruction(
            this,
            EXPLANATIONS.CLEAR_SWITCH,
            this._right
        ));

        // Set jump offsets for the breaks to the end of the switch.
        _.forEach(instructions, (instruction, index) => {

            if(instruction.getAST() instanceof JavaScriptBreakStatementAST)
                instruction.updateOffset(instructions.length - index - 1);

        });

        return instructions;

    }

}

class JavaScriptIncrementAST extends AST {

    constructor(operator, expression, prefix) {

        super();

        this._operator = operator;
        this._expression = expression;
        this._prefix = prefix;

    }

    serialize() {

        var left = this._expression;

        var operator = this._operator.getText();
        var increment = operator === "++";

        // If it's just a name, increment the name.
        if(left instanceof Token) {

            // ++a
            if(this._prefix)
                // Update the value then push it onto the accumulator.
                return [
                    new JavaScriptVariableAssignmentInstruction(
                        this,
                        EXPLANATIONS.INCREMENT(increment, left.getText(), true),
                        left,
                        this._operator,
                        true
                    )
                ];
            // a++
            else
                // Push it onto the accumulator then update the value.
                return [
                    new JavaScriptPushInstruction(
                        this,
                        EXPLANATIONS.PUSH_VALUE(left.getText()),
                        left
                    ),
                    new JavaScriptVariableAssignmentInstruction(
                        this,
                        EXPLANATIONS.INCREMENT(increment, left.getText(), false),
                        left,
                        this._operator,
                        false
                    )
                ]
        }
        // If it's a member assignment, serialize the member.
        else if(left instanceof JavaScriptDotExpressionAST) {

            // ++a.b
            if(this._prefix)
                return _.concat(
                    left.getPrimary().serialize(),
                    [new JavaScriptMemberAssignmentInstruction(
                        this,
                        EXPLANATIONS.INCREMENT(increment, left.getMember().getText(), true),
                        left.getMember(),
                        this._operator,
                        true
                    )]
                );
            // a.b++
            else
                return _.concat(
                    left.getPrimary().serialize(),
                    [new JavaScriptMemberAccessInstruction(
                        this,
                        EXPLANATIONS.PUSH_VALUE(left.getMember().getText()),
                        left.getDot(),
                        left.getMember()
                    )],
                    left.getPrimary().serialize(),
                    [new JavaScriptMemberAssignmentInstruction(
                        this,
                        EXPLANATIONS.INCREMENT(increment, left.getMember().getText(), false),
                        left.getMember(),
                        this._operator,
                        false
                    )]
                );
        }
        else if(left instanceof JavaScriptArrayExpressionAST) {

            // ++a[b]
            if(this._prefix)
                return _.concat(
                    left.getPrimary().serialize(),
                    left.getIndex().serialize(),
                    [new JavaScriptArrayAssignmentInstruction(
                        this,
                        EXPLANATIONS.ARRAY_INCREMENT(increment, true),
                        this._operator,
                        true
                    )]
                );
            // a[b]++
            else
                return _.concat(
                    left.getPrimary().serialize(),
                    left.getIndex().serialize(),
                    [new JavaScriptArrayAccessInstruction(
                        this,
                        EXPLANATIONS.ARRAY_ACCESS,
                        left.getLeft(),
                        left.getRight()
                    )],
                    left.getPrimary().serialize(),
                    left.getIndex().serialize(),
                    [new JavaScriptArrayAssignmentInstruction(
                        this,
                        EXPLANATIONS.ARRAY_INCREMENT(increment, false),
                        this._operator,
                        false
                    )]
                );
        }

        throw new Error("Invalid increment AST");

    }

}

class JavaScriptExpressionStatementAST extends AST {

    constructor(expression, semicolon) {

        super();

        this._expression = expression;
        this._semicolon = semicolon;

    }

    serialize() {

        var instructions = this._expression.serialize();

        instructions.push(new JavaScriptClearInstruction(
            this,
            EXPLANATIONS.CLEAR_EXPRESSION,
            this._semicolon
        ));

        return instructions;

    }

}

class JavaScriptArrayLiteralAST extends AST {

    constructor(left, expressions, right) {

        super();

        this._left = left;
        this._expressions = expressions;
        this._right = right;

    }

    serialize() {

        // Serialize all of the expressions into a list
        var instructions = _.concat(
            [ new JavaScriptNoOpInstruction(this, EXPLANATIONS.ARRAY_START, this._left, this._right)],
            _.flatMap(this._expressions, (el) => { return el.serialize(); })
        );

        // Create a list of all of the values.
        instructions.push(new JavaScriptCreateArrayInstruction(
            this,
            EXPLANATIONS.ARRAY,
            this._expressions.length,
            this._left,
            this._right
        ));

        return instructions;

    }

}

class JavaScriptObjectLiteralAST extends AST {

    constructor(left, keys, values, right) {

        super();

        this._left = left;
        this._keys = keys;
        this._values = values;
        this._right = right;

    }

    serialize() {

        // Serialize all of the expressions into a list
        var instructions = _.concat(
            [ new JavaScriptNoOpInstruction(this, EXPLANATIONS.OBJECT_START, this._left, this._right)],
            _.flatMap(this._values, (value) => { return value.serialize(); })
        );

        // Create a list of all of the values.
        instructions.push(new JavaScriptCreateObjectInstruction(
            this,
            EXPLANATIONS.OBJECT,
            this._keys,
            this._left,
            this._right
        ));

        return instructions;

    }

}

export {
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
}