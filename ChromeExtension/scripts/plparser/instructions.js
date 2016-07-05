import _ from 'lodash';
import {
    Instruction,
    ParsingError,
    RuntimeError,
    Token
} from "./pl";

import { ERROR_MESSAGES } from "./strings";
import {
    JavaScriptFunction,
    JavaScriptObject,
    JavaScriptArray,
    NativeJavaScriptFunction,
    JavaScriptRuntime,
    JavaScriptRuntimeValue
} from "./runtime";

class JavaScriptNoOpInstruction extends Instruction {

    constructor(ast, explanation, token, token2) {

        super(ast, explanation);

        this._token = token;
        this._token2 = token2;

    }

    /**
     * @override
     * @param {JavaScriptRuntime} runtime - The runtime that is executing this instruction.
     */
    execute(runtime) {

        // Do nothing!

    }

    toString() { return "noop"; }

}

class JavaScriptClearInstruction extends Instruction {

    constructor(ast, explanation, semicolon) {

        super(ast, explanation);

        this._token = semicolon;

    }

    getValueDependencies(runtime) {

        return runtime.getCurrentFrame().getAccumulator();

    }

    /**
     * @param {JavaScriptRuntime} runtime - The runtime that is executing this instruction.
     */
    execute(runtime) {

        if(!runtime.getCurrentFrame().isAccumulatorEmpty())
            runtime.popCurrentAccumulator(this._token);

    }

    toString() { return "clear"; }

}

class JavaScriptPushInstruction extends Instruction {

    constructor(ast, explanation, token) {

        super(ast, explanation);

        if(_.isUndefined(token)) throw new Error(null, "Received undefined token for push instruction");

        this._token = token;

    }

    getToken() { return this._token; }

    toString() { return "push " + (this._token === null ? "undefined" : this._token.getText()) + ""; }

    getValueDependencies(runtime) {

        if(this._token !== null && this._token.getType() === "name")
            return [ runtime.resolveName(this._token, this._token.getText()) ];
        else
            return [];

    }

    /**
     * @param {JavaScriptRuntime} runtime - The runtime that is executing this instruction.
     */
    execute(runtime) {

        var value = null;

        // We use the null token to represent that we're pushing undefined on the stack.
        if(this._token === null) {

            value = new JavaScriptRuntimeValue(runtime, undefined);

        } else {

            var text = this._token.getText();

            // Convert the text into a RuntimeValue to be placed onto the accumulator.
            switch (this._token.getType()) {

                case "number":

                    if(!_.isNaN(parseFloat(text)))
                        value = new JavaScriptRuntimeValue(runtime, parseFloat(text));
                    // TODO Handle hex
                    // TODO Handle octal
                    else
                        throw new RuntimeError(this._token, "Unimplemented number format.");

                    break;

                case "atom":

                    if (text === "false")
                        value = new JavaScriptRuntimeValue(runtime, false);
                    else if (text === "true")
                        value = new JavaScriptRuntimeValue(runtime, true);
                    else if (text === "null")
                        value = new JavaScriptRuntimeValue(runtime, null);
                    else if (text === "undefined")
                        value = new JavaScriptRuntimeValue(runtime, undefined);
                    else
                        throw new RuntimeError(this._token, ERROR_MESSAGES.UNKNOWN_PRIMITIVE(text));

                    break;

                case "string":

                    // Strip the quotes.
                    value = new JavaScriptRuntimeValue(runtime, text.substr(1, text.length - 2));
                    break;

                case "regexp":

                    // TODO Should we be parsing regular expressions into actual regular expressions, so we can execute methods on them?
                    value = new JavaScriptRuntimeValue(runtime, text);
                    break;

                case "name":

                    value = runtime.resolveName(this._token, text);
                    break;

                default:
                    throw new RuntimeError(this._token, ERROR_MESSAGES.UNKNOWN_PRIMITIVE(text));

            }

        }

        // Push the token's value onto the accumulator stack. If there is no value, push undefined.
        runtime.pushOntoCurrentAccumulator(value);

    }

}

class JavaScriptParameterInstruction extends Instruction {

    constructor(ast, explanation, name) {

        super(ast, explanation);

        this._name = name;

    }

    toString() { return "param " + this._name.getText(); }

    getValueDependencies(runtime) {

        var val = runtime.peekCurrentAccumulator();
        return val ? [ val ] : [];

    }

    /**
     * @override
     * @param {JavaScriptRuntime} runtime - The runtime that is executing this instruction.
     */
    execute(runtime) {

        // Associate the name with the corresponding value on the accumulator.
        // If the accumulator is empty, then no value was passed for this variable
        // and we assign "undefined".
        runtime.declareInCurrentFrame(this._name.getText(),
            runtime.getCurrentFrame().isAccumulatorEmpty() ?
                new JavaScriptRuntimeValue(runtime, undefined) :
                runtime.popCurrentAccumulator(this._name)
        );

    }

}

class JavaScriptVariableAssignmentInstruction extends Instruction {

    constructor(ast, explanation, name, operator, push) {

        super(ast, explanation);

        if(!(name instanceof Token)) throw new Error("Expected a Token for name in variable assignment");
        if(!(operator instanceof Token)) throw new Error("Expected a Token for operator in variable assignment");

        this._name = name;
        this._operator = operator;
        this._push = push;

    }

    getName() { return this._name; }

    toString() { return "var " + this._name.getText() + " " + this._operator.getText(); }

    getValueDependencies(runtime) {

        var currentValue = runtime.resolveName(this._name, this._name.getText());

        // Depends on the current value of the variable
        if(this._operator.getText() === "++" || this._operator.getText() === "--")
            return [ currentValue ];
        else
            return [ currentValue, runtime.peekCurrentAccumulator() ];

    }

    /**
     * @param {JavaScriptRuntime} runtime - The runtime that is executing this instruction.
     */
    execute(runtime) {

        var op = this._operator.getText();

        // If this is increment or a decrement, use the hard coded value of '1'. Otherwise, pop the value.
        var value = (op === "++" || op === "--") ?
            new JavaScriptRuntimeValue(runtime, 1) :
            runtime.popCurrentAccumulator(this._operator);

        // Assign the name.
        value = runtime.setNameInFrame(this._name, this._name.getText(), op, value);

        // Leave the result on the accumulator.
        if(this._push)
            runtime.pushOntoCurrentAccumulator(value);

    }


}

class JavaScriptMemberAssignmentInstruction extends Instruction {

    constructor(ast, expression, name, operator, push) {

        super(ast, expression);

        this._name = name;
        this._operator = operator;
        this._push = push;

    }

    toString() { return "member " + this._name.getText() + " " + this._operator.getText(); }

    getValueDependencies(runtime) {

        return runtime.peekCurrentAccumulator(2);

    }

    /**
     * @override
     * @param {JavaScriptRuntime} runtime - The runtime that is executing this instruction.
     */
    execute(runtime) {

        var op = this._operator.getText();

        // Pop the value to assign (unless its an incrementor.
        var value = (op === "++" || op === "--") ?
            new JavaScriptRuntimeValue(runtime, 1) :
            runtime.popCurrentAccumulator(this._operator);

        // Pop the object whose member to assign.
        var object = runtime.popCurrentAccumulator(this._operator);

        // Get the name to assign.
        var name = this._name.getText();

        // Make sure the object is an object.
        if(!(object instanceof JavaScriptObject))
            throw new RuntimeError(this._operator, ERROR_MESSAGES.EXPECTED_OBJECT);

        // Assign the member of the object.
        value = object.assignMember(runtime, this._operator, name, op, value);

        // Leave the result on the accumulator.
        if(this._push)
            runtime.pushOntoCurrentAccumulator(value);

    }

}

class JavaScriptArrayAssignmentInstruction extends Instruction {

    constructor(ast, expression, operator, push) {

        super(ast, expression);

        this._operator = operator;
        this._push = push;

    }

    toString() { return "array " + this._operator.getText(); }

    getValueDependencies(runtime) {

        return runtime.peekCurrentAccumulator(3);

    }

    /**
     * @param {JavaScriptRuntime} runtime - The runtime that is executing this instruction.
     */
    execute(runtime) {

        var op = this._operator.getText();

        // Pop the value to assign (unless its an incrementor.
        var value = (op === "++" || op === "--") ?
            new JavaScriptRuntimeValue(runtime, 1) :
            runtime.popCurrentAccumulator(this._operator);

        // Pop the object
        var index = runtime.popCurrentAccumulator(this._operator).getValue();
        var array = runtime.popCurrentAccumulator(this._operator).getValue();

        // Ensure the value is an array.
        if(!_.isObject(array)) throw new RuntimeError(this._operator, ERROR_MESSAGES.EXPECTED_OBJECT);

        // Assign the value.
        value = JavaScriptRuntime.assignValueInNamespace(runtime, this._operator, array, index, op, value);

        // Leave the result on the accumulator.
        if(this._push)
            runtime.pushOntoCurrentAccumulator(value);

    }

}

class JavaScriptBinaryOperatorInstruction extends Instruction {

    constructor(ast, expression, operator) {

        super(ast, expression);

        this._operator = operator;

    }

    toString() { return this._operator.getText(); }

    getOperator() { return this._operator.getText(); }

    getValueDependencies(runtime) {

        return runtime.peekCurrentAccumulator(2);

    }

    /**
     * @param {JavaScriptRuntime} runtime - The runtime that is executing this instruction.
     */
    execute(runtime) {

        // Pop the two values and push the new one.
        var right = runtime.popCurrentAccumulator(this._operator).getValue();
        var left = runtime.popCurrentAccumulator(this._operator).getValue();
        var value = null;

        switch(this._operator.getText()) {

            case "||":
                value = left || right;
                break;
            case "&&":
                value = left && right;
                break;
            case "|":
                value = left | right;
                break;
            case "&":
                value = left & right;
                break;
            case "^":
                value = left ^ right;
                break;
            case "==":
                value = left == right;
                break;
            case "===":
                value = left === right;
                break;
            case "!=":
                value = left != right;
                break;
            case "!==":
                value = left !== right;
                break;
            case "<":
                value = left < right;
                break;
            case "<=":
                value = left <= right;
                break;
            case ">=":
                value = left >= right;
                break;
            case ">":
                value = left > right;
                break;
            case "<<":
                value = left << right;
                break;
            case ">>":
                value = left >> right;
                break;
            case ">>>":
                value = left >>> right;
                break;
            case "+":
                value = left + right;
                break;
            case "-":
                value = left - right;
                break;
            case "*":
                value = left * right;
                break;
            case "/":
                value = left / right;
                break;
            case "%":
                value = left % right;
                break;
            default:
                throw new RuntimeError(this._operator, ERROR_MESSAGES.UNKNOWN_OPERATOR(this._operator.getText()));
        }

        // Push the computed value onto the accumulator.
        runtime.pushOntoCurrentAccumulator(new JavaScriptRuntimeValue(runtime, value));

    }

}

class JavaScriptUnaryOperatorInstruction extends Instruction {

    constructor(ast, expression, operator) {

        super(ast, expression);

        this._operator = operator;

    }

    toString() { return this._operator.getText(); }

    getOperator() { return this._operator.getText(); }

    getValueDependencies(runtime) {

        return runtime.peekCurrentAccumulator(1);

    }

    /**
     * @override
     * @param {JavaScriptRuntime} runtime - The runtime that is executing this instruction.
     */
    execute(runtime) {

        // Pop one value
        var value = runtime.popCurrentAccumulator(this._operator).getValue();

        // Compute the new value.
        switch(this._operator.getText()) {
            case "typeof":
                value = typeof value;
                break;
            case "void":
                value = undefined;
                break;
            case "!":
                value = !value;
                break;
            case "~":
                value = ~value;
                break;
            case "-":
                value = -value;
                break;
            case "+":
                value = +value;
                break;
            default:
                throw new RuntimeError(this._operator, ERROR_MESSAGES.UNKNOWN_OPERATOR(this._operator.getText()));

        }

        // Push the new value.
        runtime.pushOntoCurrentAccumulator(new JavaScriptRuntimeValue(runtime, value));

    }

}

class JavaScriptJumpIfFalseInstruction extends Instruction {

    constructor(ast, explanation, distance, keyword) {

        super(ast, explanation);

        if(!_.isInteger(distance))
            throw new ParsingError(null, "Required an integer but received " + distance);

        this._offset = distance;
        this._keyword = keyword;

    }

    getValueDependencies(runtime) {

        return runtime.peekCurrentAccumulator(1);

    }

    toString() { return "jumpiffalse " + this._offset; }

    /**
     * @param {JavaScriptRuntime} runtime - The runtime that is executing this instruction.
     */
    execute(runtime) {

        // Increment the program counter by distance if the value on the stack is false.
        var value = runtime.popCurrentAccumulator(this._keyword).getValue();

        // If the value is "falsy", move the program counter by this number of instructions.
        if(!value)
            return this._offset;

    }

}

class JavaScriptJumpInstruction extends Instruction {

    constructor(ast, explanation, offset, keyword) {

        super(ast, explanation);

        if(!_.isInteger(offset)) throw new ParsingError(null, "Required an integer but received " + offset);

        this._offset = offset;
        this._keyword = keyword;

    }

    toString() { return "jump " + this._offset; }

    updateOffset(offset) { this._offset = offset; }

    execute(runtime) {

        // Tell the runtime to move by this number of instructions.
        return this._offset;

    }

}

class JavaScriptDeclareFunctionInstruction extends Instruction {

    constructor(ast, explanation, keyword) {

        super(ast, explanation);

        this._keyword = keyword;

    }

    toString() { return "declarefunction " + this._ast.getName().getText(); }

    /**
     * @param {JavaScriptRuntime} runtime - The runtime that is executing this instruction.
     */
    execute(runtime) {

        // Construct a function full of instructions and then declare it in the current frame.
        runtime.declareInCurrentFrame(
            this._ast.getName().getText(),
            new JavaScriptFunction(
                runtime,
                this._ast.getName(),
                _.concat(
                    this._ast.getParameters().serialize(),
                    this._ast.getBlock().serialize()
                ),
                runtime.getCurrentFrame()
            )
        )

    }

}

class JavaScriptPushFunctionInstruction extends Instruction {

    constructor(ast, explanation, keyword) {

        super(ast, explanation);

        this._keyword = keyword;

    }

    toString() { return "pushfunction"; }

    execute(runtime) {

        // Construct a function full of instructions and then declare it in the current frame.
        runtime.pushOntoCurrentAccumulator(
            new JavaScriptFunction(
                runtime,
                this._keyword,
                _.concat(
                    this._ast.getParameters().serialize(),
                    this._ast.getBlock().serialize()
                ),
                runtime.getCurrentFrame()
            )
        );

    }

}

class JavaScriptDeclareInstruction extends Instruction {

    constructor(ast, explanation, operator, nameToken) {

        super(ast, explanation);

        this._operator = operator;
        this._name = nameToken;

    }

    getName() { return this._name; }

    toString() { return "var " + this._name.getText(); }

    getValueDependencies(runtime) {

        return runtime.peekCurrentAccumulator(1);

    }

    /**
     * @param {JavaScriptRuntime} runtime - The runtime that is executing this instruction.
     */
    execute(runtime) {

        // Pop the value on the accumulator
        var value = runtime.popCurrentAccumulator(this._operator);

        // Declare a name in the current namespace with the value.
        runtime.declareInCurrentFrame(this._name.getText(), value);

    }

}

class JavaScriptNewInstruction extends Instruction {

    constructor(ast, explanation, keyword) {

        super(ast, explanation);

        this._new = keyword;

    }

    toString() { return "new"; }

    getValueDependencies(runtime) {

        var args = this.getAST().getArguments();
        var argumentCount = args ? args.getCount() : 0;

        return runtime.peekCurrentAccumulator(argumentCount + 2);

    }

    /**
     * @param {JavaScriptRuntime} runtime - The runtime that is executing this instruction.
     */
    execute(runtime) {

        // The arguments and constructor on the stack in reverse order.
        var args = this.getAST().getArguments();
        var argumentCount = args ? args.getCount() : 0;

        // Pop all of the arguments.
        var values = [];
        for(var i = 0; i < argumentCount; i++)
            values.push(runtime.popCurrentAccumulator(this._new));

        // Pop the constructor.
        var constructor = runtime.popCurrentAccumulator(this._new);

        // Create the new object.
        var newObject = new JavaScriptObject(runtime, {});

        // Verify that the value is a function.
        if(!(constructor instanceof JavaScriptFunction)) throw new RuntimeError(this._new, ERROR_MESSAGES.EXPECTED_FUNCTION);

        // If this is a native function, just execute it and push the return value.
        if(constructor instanceof NativeJavaScriptFunction) {

            runtime.pushOntoCurrentAccumulator(constructor.execute(newObject.getValue(), runtime, values));

        }
        // Otherwise, call the function using this runtime.
        else {

            // Push the object on the stack.
            runtime.pushOntoCurrentAccumulator(newObject);

            // Invoke the constructor.
            runtime.callFunction(constructor, newObject, values);

        }

    }

}

class JavaScriptCallInstruction extends Instruction {

    constructor(ast, explanation, left, right) {

        super(ast, explanation);

        this._left = left;
        this._right = right;

    }

    toString() { return "call"; }

    getArgumentCount() { return this.getAST().getArgumentCount(); }

    getValueDependencies(runtime) {

        var args = this.getAST().getArgumentCount();
        return runtime.peekCurrentAccumulator(args + 1);

    }

    /**
     * @param {JavaScriptRuntime} runtime - The runtime that is executing this instruction.
     */
    execute(runtime) {

        // Pop all of the arguments.
        var values = [];
        for(var i = 0; i < this.getArgumentCount(); i++)
            values.unshift(runtime.popCurrentAccumulator(this._left));

        // Pop the function.
        var fun = runtime.popCurrentAccumulator(this._left);

        // Get the last object accessed.
        var thisValue = runtime.getCurrentFrame().getAndUnsetLastObjectAccessed();

        // If there was no object accessed, then this is the global namespace.
        if(thisValue === null)
            thisValue = new JavaScriptObject(runtime, runtime.getGlobalFrame().getNamespace());

        // Verify that the value is a function.
        if (!(fun instanceof JavaScriptFunction)) throw new RuntimeError(this._left, ERROR_MESSAGES.EXPECTED_FUNCTION);

        // If this is a native function, just execute it and push the return value.
        if(fun instanceof NativeJavaScriptFunction) {

            runtime.pushOntoCurrentAccumulator(fun.execute(thisValue.getValue(), runtime, values));

        }
        // Otherwise, invoke the non-native function.
        else {

            // Invoke the function.
            runtime.callFunction(fun, thisValue, values);

        }

    }

}

class JavaScriptMemberAccessInstruction extends Instruction {

    constructor(ast, explanation, dotToken, nameToken) {

        super(ast, explanation);

        this._dot = dotToken;
        this._name = nameToken;

    }

    toString() { return "member '" + this._name.getText() + "'"; }

    getValueDependencies(runtime) {

        return runtime.peekCurrentAccumulator(1);

    }

    /**
     * @param {JavaScriptRuntime} runtime - The runtime that is executing this instruction.
     */
    execute(runtime) {

        // Get the name
        var name = this._name.getText();

        // Pop the object
        var object = runtime.popCurrentAccumulator(this._dot);

        // If the object isn't an object, bail.
        if(!(object instanceof JavaScriptObject))
            throw new RuntimeError(this._dot, ERROR_MESSAGES.EXPECTED_OBJECT);

        // Remember the object accessed.
        runtime.getCurrentFrame().setLastObjectAccessed(object);

        // Get the member and push it onto the stack.
        runtime.pushOntoCurrentAccumulator(object.getMember(runtime, name));

    }

}

class JavaScriptArrayAccessInstruction extends Instruction {

    constructor(ast, explanation, left, right) {

        super(ast, explanation);

        this._left = left;
        this._right = right;

    }

    toString() { return "arrayindex"; }

    getValueDependencies(runtime) {

        return runtime.peekCurrentAccumulator(2);

    }

    /**
     * @param {JavaScriptRuntime} runtime - The runtime that is executing this instruction.
     */
    execute(runtime) {

        // Pop the array
        var index = runtime.popCurrentAccumulator(this._right);

        // Pop the index
        var array = runtime.popCurrentAccumulator(this._right);

        // If the object isn't an object, bail.
        if(!(array instanceof JavaScriptObject))
            throw new RuntimeError(this._right, ERROR_MESSAGES.EXPECTED_OBJECT);

        // Remember the object accessed.
        runtime.getCurrentFrame().setLastObjectAccessed(array);

        // Get the value of the member and push it onto the accumulator.
        runtime.pushOntoCurrentAccumulator(array.getMember(runtime, index.getValue()));

    }

}

class JavaScriptReturnInstruction extends Instruction {

    constructor(ast, explanation, keyword) {

        super(ast, explanation);

        this._keyword = keyword;

    }

    toString() { return "return"; }

    getValueDependencies(runtime) {

        return runtime.peekCurrentAccumulator(1);

    }

    /**
     * @param {JavaScriptRuntime} runtime - The runtime that is executing this instruction.
     */
    execute(runtime) {

        // Get the return value from the accumulator.
        var value = runtime.popCurrentAccumulator(this._keyword);

        // Pop the frame.
        runtime.popCurrentFrame();

        // Push the return value onto the accumulator of the frame we're returning to.
        runtime.pushOntoCurrentAccumulator(value);

    }

}

class JavaScriptCreateArrayInstruction extends Instruction {

    constructor(ast, explanation, count, left, right) {

        super(ast, explanation);

        this._count = count;
        this._left = left;
        this._right = right;

    }

    toString() { return "arrayliteral " + this._count; }

    getValueDependencies(runtime) {

        return runtime.peekCurrentAccumulator(this._count);

    }

    /**
     * @param {JavaScriptRuntime} runtime - The runtime that is executing this instruction.
     */
    execute(runtime) {

        // Create an empty list.
        var array = new JavaScriptArray(runtime);

        // Pop 'count' values into an array.
        for(var i = 0; i < this._count; i++) {
            array.insert(runtime.popCurrentAccumulator(this._right));
        }

        // Push the new array onto the accumulator.
        runtime.pushOntoCurrentAccumulator(array);

    }

}

class JavaScriptCreateObjectInstruction extends Instruction {

    constructor(ast, explanation, keys, left, right) {

        super(ast, explanation);

        this._left = left;
        this._keys = keys;
        this._right = right;

    }

    toString() { return "objectliteral " + this._keys.length; }

    getValueDependencies(runtime) {

        return runtime.peekCurrentAccumulator(this._keys.length);

    }

    /**
     * @param {JavaScriptRuntime} runtime - The runtime that is executing this instruction.
     */
    execute(runtime) {

        // Create new object wrapper.
        var obj = new JavaScriptObject(runtime, {});

        // Assign the values on the stack to the corresponding keys. Need to reverse
        // the keys because stack order is reversed.
        var keys = _.reverse(_.clone(this._keys));
        for(var i = 0; i < keys.length; i++) {
            obj.assignMember(runtime, keys[i], keys[i].getText(), "=", runtime.popCurrentAccumulator(this._right));
        }

        // Push the new object onto the accumulator.
        runtime.pushOntoCurrentAccumulator(obj);

    }

}

class JavaScriptCaseInstruction extends Instruction {

    constructor(ast, explanation, offset, keyword) {

        super(ast, explanation);

        this._offset = offset;
        this._case = keyword;

    }

    toString() { return "jumpcase " + this._offset; }

    getValueDependencies(runtime) {

        return runtime.peekCurrentAccumulator(1);

    }

    /**
     * @param {JavaScriptRuntime} runtime - The runtime that is executing this instruction.
     */
    execute(runtime) {

        // Pop the value to compare.
        var caseValue = runtime.popCurrentAccumulator(this._case);

        // Peek at the switch value.
        var switchValue = runtime.getCurrentFrame().peekAccumulator();

        // If they aren't equal, return the offset. Otherwise, return 1 to run the case statements.
        return switchValue.getValue() === caseValue.getValue() ? 1 : this._offset;

    }

}

export {
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
};