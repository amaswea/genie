import { NativeJavaScriptFunction } from "./runtime";
import _ from "lodash";

/**
 * These are lexing and parsing errors for display to the user. Note that
 * we use personal pronouns and a more conversational style in order to redirect
 * blame this dumb translator and away from the learner.
 */
var ERROR_MESSAGES = {

    // Tokenization errors
    INVALID_HEX: "I thought this was a hexadecimal character, but it doesn't follow the hexadecimal number format.",
    INVALID_NUMBER: "I thought this was a number, but it doesn't follow the number format.",
    EXPECTED_UNICODE: "I thought this was a unicode escape sequence, but didn't see a 'u' after the slash.",
    INVALID_IDENTIFIER_CHARACTER: "This character isn't allowed in identifiers.",
    UNTERMINATED_COMMENT: "Multi-line comments have to be terminated with a '*/'.",
    UNEXPECTED_END_OF_STRING: "I was looking for the end of this string on this line but couldn't find it.",
    UNEXPECTED_END_OF_FILE: "I expected more characters, but reached the end of the file.",
    INVALID_CHARACTER: "This isn't a character I know how to handle.",
    INVALID_OBJECT_KEY: "Object keys can only be strings, numbers, and other names.",

    // Parsing errors
    UNSUPPORTED_WITH: "The 'with' construct is risky business, so we don't parse it yet.",
    INVALID_FOR: "I don't know how to interpret this 'for' loop. I expected either a 'for(a;b;c)' or 'for(a in b)' syntax.",
    INVALID_EXPRESSION: "I expected an expression, but I couldn't determine what kind this was. Maybe it's not an expression?",
    INVALID_ASSIGNMENT: "I only know how to assign values to variables, object properties, and arrays.",

    // Runtime errors
    EMPTY_ACCUMULATOR: "The accumulator is empty, there's nothing to pop.",
    UNKNOWN_OPERATOR: function(operator) { return "Unknown operator '" + operator + "'"; },
    UNKNOWN_PRIMITIVE: function(text) { return "Unknown primitive value '" + text + "'"; },
    UNDEFINED_NAME: function(name) { return "Unknown name '" + name + "'"; },
    EXPECTED_BOOLEAN: "Expected a Boolean value",
    EXPECTED_OBJECT: "Expected an array, object, function, or regex",
    EXPECTED_FUNCTION: "Expected a function",
    EXECUTION_TIMEOUT: "The program seems to be in an infinite loop; stopping execution.",
    STACK_OVERFLOW: "The program exceeded the maximum number of active function calls; stopping execution."

};

// {} = format as highlighted
// [] = format as code
// @ = refers to named entity
var EXPLANATIONS = {
    PUSH_VALUE: (value) => { return "Push [" + value + "] onto the @stack." },
    PUSH_FUNCTION: "Push {this function} onto the top of the @stack.",
    DECLARE_FUNCTION:
        "This is a {function declaration}. Functions take zero or more values, perform some action, and then optionally return a value. " +
        "This step declares a function in the current @namespace so that future steps can call using that name.",
    EMPTY_STATEMENT: "{This} is called an empty statement. It does nothing.",
    IF_START:
        "This is an {if statement}. It is used to perform some steps conditionally. " +
        "The first step of an [if] statement is to evaluate its condition, to see whether the steps should be performed.",
    IF_TRUE: "If the [if] statement's condition is [true], execute the true statements. Otherwise, skip it.",
    IF_FALSE_ELSE: "If the condition is [true], execute the true statements. Otherwise, execute the [else] statements.",
    SKIP_ELSE: "Done with the true statements, so we skip the [else] statements.",
    WHILE_START:
        "This is a {while statement}. It is used to perform steps multiple times until it's condition is no longer true. " +
        "The first step of a while loop is to check its condition.",
    EXIT_WHILE: "If the [while] loop's condition is [false], exit the loop. Otherwise, loop again.",
    CONTINUE_WHILE: "Return to check the [while] condition again.",
    DO_WHILE_START:
        "This is a {do-while loop}. It is used to perform some steps multiple times until it's condition is no longer true. " +
        "They first execute one pass of the loop, then check the condition.",
    EXIT_DO_WHILE: "If the loop's condition is [false], exit the loop. Otherwise, loop again.",
    BREAK: "Exit the enclosing loop or switch statement.",
    CONTINUE: "Skip the rest of this loop and return to the condition.",
    NO_INITIALIZATION: "There was no initialization value, so we push [undefined] onto the @stack.",
    DECLARATION_START: "This is a {variable declaration} statement. It declares one or more names and can optionally assign them values.",
    VARIABLE_START: (name) => { return "The first step of declaring [" + name + "] is computing its initial value." },
    DECLARE: (name) => { return "Declare the variable [" + name + "] and set it's value to the value on top of the @stack." },
    CLEAR_EXPRESSIONS: "Before moving to the next expression, we remove the value this expression left on the @stack.",
    CLEAR_EXPRESSION: "Before moving to the next statement, we remove the value this expression left on the @stack.",
    ASSIGNMENT: (operator, name) => {

        return {
            "=": "Assign the value on top of the @stack to @name",
            "+=": "Add the value on top of the @stack to @name",
            "-=": "Subtract the value on top of/**/ the @stack from @name",
            "*=": "Multiply @name by the value on top of the @stack",
            "/=": "Divide @name by the value on top of the @stack",
            "%=": "Get the remainder of the quotient of @name and the value on top of the @stack",
            "<<=": "Left shift @name by the value on top of the @stack",
            ">>=": "Right shift @name (sign preserving) by the value on top of the @stack",
            ">>>=": "Right shift @name (zero-fill) by the value on top of the @stack",
            "&=": "Bitwise-and @name by the value on top of the @stack",
            "^=": "Bitwise-xor @name by the value on top of the @stack",
            "|=": "Bitwise-or @name by the value on top of the @stack"
        }[operator].replace("@name", "[" + name + "]") + " Then, push the new value onto the @stack";

    },
    MEMBER_ASSIGNMENT: (name) => {
        return "Get the value on the top of the @stack and assign it to {" +
        name + "} in the object on the @stack, then push the value onto the @stack."
    },
    ARRAY_ASSIGNMENT: "Assign the value on the top of the @stack to the array on the @stack, then, push the value back onto the @stack.",
    BINARY_OPERATOR: (instruction, runtime) => {

        var operator = instruction.getOperator();
        var [left, right] = runtime.peekCurrentAccumulator(2);

        var op = "Pop [" + left + "] and [" + right + "] off the @stack, compute [" + left + operator + right + "], and push the result onto the @stack.";

        if(left.isString() && right.isString())
            return op + " Because both values are strings, they will be concatenated together to form a new string.";
        else if(left.isString() && !right.isString())
            return op + " Because [" + left + "] is a string, [" + right + "] will be converted into a string and they will be concatenated together.";
        else if(!left.isString() && right.isString())
            return op + " Because [" + right + "] is a string, [" + left + "] will be converted into a string and they will be concatenated together.";
        else
            return op;

    },
    CONDITIONAL_EXPRESSION_TRUE: "If the value on the top of the @stack is [true], evaluate the true expression. " +
        "Otherwise, evaluate the false expression.",
    CONDITIONAL_EXPRESSION_SKIP: "Skip the else expression.",
    UNARY_OPERATOR: (instruction, runtime) => {

        var operator = instruction.getOperator();
        var value = runtime.peekCurrentAccumulator();
        return "Pop [" + value.getValue() + "] off the @stack, compute [" + operator + (/[a-z]+/.test(operator) ? " " : "") + value.getValue() + "], and push the result onto the @stack.";

    },
    RESOLVE_NAME: (name) => {
        return "Find the value of [" + name + "] in the current @namespace, then push it onto the @stack."
    },
    NEW_START:
        "[new] {expressions} create a new object and then call a constructor function on the object to initialize it. " +
        "The first step of a [new] expression is finding the constructor function.",
    NEW: "Make a new object and call the constructor on the @stack with the arguments on the @stack.",
    NOT_IMPLEMENTED: "The PL Tutor team hasn't implemented this step yet.",
    MEMBER_ACCESS: (name) => {
        return "Get the property named [" + name + "] from the object on the top of the @stack.";
    },
    ARRAY_ACCESS: "These brackets access the value in an array at the index on the top of the @stack.",
    CALL_START:
        "This is a {function call}. It will pass a set of values to a function, and then receive whatever the function returns. " +
        "The first step of calling a function is determining the function to call.",
    CALL: (instruction, runtime) => {

        var values = runtime.peekCurrentAccumulator(instruction.getArgumentCount() + 1);
        var fun = values.shift();
        var name = fun ? fun.getName() || "function" : "unknown";
        values = _.map(values, (val) => { return val.toString(); }).join(", ");
        return "Call the function [" + name + "] with the values [" + values + "]" +
            (fun instanceof NativeJavaScriptFunction ?
                ". This call will not be stepped through since the function is native." :
                ", creating a new call stack frame."
            );

    },
    PARAM: (name) => {
        return "This is a {parameter} called [" + name + "]. When this parameter's function is called, it recieves the value sent in the function call."
    },
    RETURN_START:
        "{Return statements} send a value back to the place where the function was called. " +
        "Before returning from the function, we compute the value to return.",
    NO_RETURN: "There was no return value, so push [undefined] onto the @stack for return.",
    RETURN: "Return the value on the top of the @stack.",
    FOR_START: "This is a {for loop}. It is used to repeat steps until a condition is no longer true. The first step of a [for] loop is the initialization step.",
    FOR_CONDITION: "Next, we check the [for] loop's condition.",
    FOR_INCREMENT: "Next, we need to run the increment step of the [for] loop.",
    CLEAR_INCREMENT: "The loop is done incrementing, so we discard the value on top of the @stack.",
    EXIT_FOR: "If the [for] loop's condition is [false], exit the loop.",
    LOOP_START: "The condition was true, so we'll execute the [for] loop's body.",
    CONTINUE_FOR: "Now that we're done with the [for] loop's statement, return to check it's condition again.",
    SWITCH_START:
        "This is a {switch statement}. It is used to perform different steps based on a particular value. " +
        "The first step of a [switch] is to compute the value to check against.",
    CASE:
        "This is a [case], which is part of a [switch] statement. If the value of this [case] matches the [switch] value on the @stack, " +
        "we evaluate the steps in this [case]. Otherwise, check the next [case].",
    NEXT_CASE: "Execute the next [case] since there was no [break] statement. (Isn't that confusing?)",
    CLEAR_SWITCH: "We're done with the [switch] value, so we remove it from the @stack.",
    ARRAY_START: "{Arrays} are lists of items that are accessed by index. Before we make this array, we need to compute all of the item to put into it.",
    ARRAY: "Create a new array with the values on the @stack.",
    OBJECT_START: "{Objects are sets of key/value pairs}. Before we make this object, we need to compute all of the values for its keys.",
    OBJECT: "Create a new object with the values on the @stack.",
    INCREMENT: (increment, name, push) => {
        return (increment ? "Increment" : "Decrement") + " [" + name + "]" +
            (push ? ", then push the new value onto the @stack." : ".");
    },
    ARRAY_INCREMENT: (increment, push) => {
        return (increment ? "Increment" : "Decrement") + " the array value at the index on the @stack" +
            (push ? ", then push the new value onto the @stack." : ".");
    }
};

export { ERROR_MESSAGES, EXPLANATIONS }