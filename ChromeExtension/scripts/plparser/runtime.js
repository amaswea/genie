import { Token, Runtime, RuntimeValue, RuntimeError } from "./pl";
import { ERROR_MESSAGES } from "./strings"
import _ from "lodash";

class JavaScriptRuntimeValue extends RuntimeValue {

    constructor(runtime, nativeValue) {

        super(runtime);

        this._value = nativeValue;

    }

    getRuntime() { return this._runtime; }

    getValue() { return this._value; }

    toString() {

        var val = this._value;

        // Array
        if(_.isArray(val))
            return "[" + _.map(val, (item) => { return item.toString(); }) + "];";
        else if(_.isObject(val))
            return "Object";
        // Undefined
        else if(_.isUndefined(val))
            return "undefined";
        // Null
        else if(val === null)
            return "null";
        // Number
        else if(_.isNumber(val))
            return val.toString();
        // String
        else if(_.isString(val))
            return '"' + val + '"';
        // Regexp
        else if(_.isRegExp(val))
            return val.toString();
        // Boolean
        else
            return val.toString();

    }

    isString() { return _.isString(this._value); }

}

class JavaScriptFunction extends JavaScriptRuntimeValue {

    /**
     * @param {Runtime} runtime - The runtime defining this function.
     * @param {Token} nameToken - The token corresponding to this function declaration.
     * @param {Instruction[]} instructions - The instructions for this function.
     * @param {JavaScriptStackFrame} frame - The stack frame in which the function was declared.
     */
    constructor(runtime, nameToken, instructions, frame) {

        super(runtime);

        this._name = nameToken;
        this._instructions = instructions;
        this._frame = frame;

    }

    /**
     * Override and return this function.
     * @returns {JavaScriptFunction}
     */
    getValue() { return this; }

    getName() { return this._name.getType() === "name" ? this._name.getText() : ""; }

    getInstructions() { return this._instructions; }

    getClosureFrame() { return this._frame; }

}

/**
 * Represents a native JavaScript function. The runtime executes these immediately.
 */
class NativeJavaScriptFunction extends JavaScriptFunction {

    /**
     * @param {Runtime} runtime - The runtime making this function.
     * @param {string} name - The name of the function.
     * @param {function} execute
     * @param {boolean} isOutput - True if the function affects output.
     */
    constructor(runtime, name, execute, isOutput) {

        super(runtime, null, null, null);

        this._name = name;
        this._execute = execute;
        this._isOutput = isOutput;

        // A cache of return values indexed by the program's global step count
        this._returnValuesByStep = {};

    }

    /**
     * Execute a native function with wrapped values.
     * @param {JavaScriptRuntimeValue} thisValue
     * @param {JavaScriptRuntime} runtime
     * @param {JavaScriptRuntimeValue[]} values
     * @returns {JavaScriptRuntimeValue}
     */
    execute(thisValue, runtime, values) {

        // Remember which step this executed on.
        if(this._isOutput)
            runtime.markCurrentStepAsOutput();

        // If there's no cache of this step's return value, compute it.
        if(!_.has(this._returnValuesByStep, runtime.getCurrentStepCount())) {

            // Unwrap the values
            values = _.map(values, (val) => {
                return val.getValue();
            });

            this._returnValuesByStep[runtime.getCurrentStepCount()] =
                new JavaScriptRuntimeValue(runtime, this._execute.call(thisValue, runtime, values));

        }

        return this._returnValuesByStep[runtime.getCurrentStepCount()];

    }

    getName() { return this._name; }

}

/**
 * A wrapper for a JavaScript object, allowing us to intercept activity on the object.
 */
class JavaScriptObject extends JavaScriptRuntimeValue {

    constructor(runtime, initialValue) {

        super(runtime);

        this._object = initialValue;

        // A cache of native function wrappers. We don't want to
        // generate these on every access both for performance and for identity checks.
        this._wrappedFunctions = {};

    }

    getValue() { return this._object; }

    memberAffectsOutput(name) { return false; }

    /**
     * Overrides so it can wrap native functions.
     * @param {JavaScriptRuntime} runtime - The runtime asking for this member.
     * @param {string} name - The name of the member to get.
     * @returns {JavaScriptRuntimeValue} The value of this key.
     */
    getMember(runtime, name) {

        var obj = this.getValue();

        // If we couldn't get the native value of this object, return undefined.
        if(!_.isObject(obj))
            return new JavaScriptRuntimeValue(runtime, undefined);

        // Get the native value of this object.
        var value = obj[name];

        // If the value is a function, return it wrapped.
        if(_.isFunction(value)) {

            // Cache the function wrapper.
            if(!_.has(this._wrappedFunctions, name))
                this._wrappedFunctions[name] = new NativeJavaScriptFunction(
                    runtime,
                    name,
                    (runtime, values) => {
                        var object = this.getValue();
                        object[name].apply(object, values);
                    },
                    // This function is not output, since it's user defined.
                    this.memberAffectsOutput(name)
                );

            return this._wrappedFunctions[name];

        }
        // If it's already wrapped, return it.
        else if(value instanceof JavaScriptRuntimeValue)
            return value;
        // Otherwise, wrap the value and return it.
        else
            return runtime.wrapNativeValue(value);

    }


    /**
     * Overrides so it can assign native values to the native object.
     * @param {JavaScriptRuntime} runtime - The runtime modifying this object.
     * @param {Token} token - The token corresponding to this operation.
     * @param {string} name - The name of the key to assign.
     * @param {string} operator - The operation to use.
     * @param {JavaScriptRuntimeValue} value - The value to assign.
     * @returns {JavaScriptRuntimeValue}
     */
    assignMember(runtime, token, name, operator, value) {

        // Assign the value.
        return JavaScriptRuntime.assignValueInNamespace(runtime, token, this._object, name, operator, value);

    }

    getMembers(runtime) {

        return this._object;

    }

}

/**
 * A wrapper for JavaScript arrays, allowing us to intercept activity on the array.
 */
class JavaScriptArray extends JavaScriptObject {

    constructor(runtime, value = []) {

        super(runtime);

        this._object = value;

    }

    insert(value) {

        this._object.unshift(value);

    }

}

/**
 * A wrapper for a native JavaScript object.
 */
class NativeJavaScriptObject extends JavaScriptObject {

    /**
     * @param {JavaScriptRuntime} runtime - The runtime that created this object.
     * @param {string[]|null} names - If null, all keys will be exposed. If a list, only the given keys will be exposed.
     * @param {function} accessor - A function that returns the object being wrapped.
     * @param {function|boolean} isOutput - A function that determines whether a function name affects output, or a boolean.
     */
    constructor(runtime, names, accessor, isOutput) {

        super(runtime, null, null);

        this._names = names;
        this._accessor = accessor;
        this._isOutput = isOutput;

    }

    getValue() { return this._accessor.call(); }

    /**
     * Override to use output affecting function.
     */
    memberAffectsOutput(name) { return _.isBoolean(this._isOutput) ? this._isOutput : this._isOutput.call(undefined, name); }

    /**
     * Overrides so it can assign native values to the native object.
     * @param {JavaScriptRuntime} runtime - The runtime modifying this object.
     * @param {Token} token - The token corresponding to this operation.
     * @param {string} name - The name of the key to assign.
     * @param {string} operator - The operation to use.
     * @param {JavaScriptRuntimeValue} value - The value to assign.
     * @returns {JavaScriptRuntimeValue}
     */
    assignMember(runtime, token, name, operator, value) {

        // Get the native object.
        var obj = this.getValue();

        if(!_.isObject(obj))
            throw new RuntimeError(null, "Unable to access native object");

        // We have to assign a native value, since this is a native object.
        var nativeValue = value.getValue();

        // Perform the assignment.
        switch(operator) {

            case "=":
                obj[name] = nativeValue;
                break;
            case "+=":
                obj[name] += nativeValue;
                break;
            case "-=":
                obj[name] -= nativeValue;
                break;
            case "++":
                obj[name]++;
                break;
            case "--":
                obj[name]--;
                break;
            case "*=":
                obj[name] *= nativeValue;
                break;
            case "/=":
                obj[name] /= nativeValue;
                break;
            case "%=":
                obj[name] %= nativeValue;
                break;
            case "<<=":
                obj[name] <<= nativeValue;
                break;
            case ">>=":
                obj[name] >>= nativeValue;
                break;
            case ">>>=":
                obj[name] >>>= nativeValue;
                break;
            case "&=":
                obj[name] &= nativeValue;
                break;
            case "^=":
                obj[name] ^= nativeValue;
                break;
            case "|=":
                obj[name] |= nativeValue;
                break;
            default:
                throw new RuntimeError(token, ERROR_MESSAGES.UNKNOWN_OPERATOR(operator));

        }

        // Wrap the value and return it.
        return new JavaScriptRuntimeValue(runtime, obj[name]);

    }

    /**
     * Overrides so it can wrap values in this native object.
     * @param {Runtime} runtime - The runtime that is accessing this.
     * @returns {object}
     */
    getMembers(runtime) {

        var namesToRender = this._names;

        // If there was no white list provided, look at all the members.
        if(namesToRender === null)
            namesToRender = Object.getOwnPropertyNames(this.getValue());

        var namespace = {};
        _.each(namesToRender, (name) => {
            namespace[name] = this.getMember(runtime, name);
        });

        return namespace;

    }

}

class JavaScriptStackFrame {

    constructor(runtime, thisValue, func, instructions, values) {

        // The runtime responsible for this frame.
        this._runtime = runtime;

        // The function this frame is executing.
        this._function = func;

        // The current instruction to execute next.
        this._nextInstructionIndex = 0;

        if(!_.isArray(instructions))
            throw new RuntimeError(null, "Expected an array of instructions");

        // The instructions to execute.
        this._instructions = instructions;

        // The stack used to evaluate expressions. Reverse the values to preserve parameter order,
        // since arguments are passed in reverse order.
        this._accumulator = _.reverse(values.slice());

        // The last object accessed, used for setting "this".
        this._object = null;

        // The namespace in which values are stored.
        this._namespace = {};

        // Assign "this". If the value is null (which should only be true
        // for the global frame), then we assign it to this frame's namespace.
        if(thisValue !== null)
            this._namespace["this"] = thisValue;

    }

    getRuntime() { return this._runtime; }
    getFunction() { return this._function; }
    getNextInstructionIndex() { return this._nextInstructionIndex; }
    getInstructions() { return this._instructions; }
    getAccumulator() { return this._accumulator; }
    getNamespace() { return this._namespace; }
    isAccumulatorEmpty() { return this._accumulator.length === 0; }

    setLastObjectAccessed(object) { this._object = object; }

    getAndUnsetLastObjectAccessed() {

        var obj = this._object;
        this._object = null;
        return obj;

    }

    /**
     * @returns {Instruction} The next instruction to execute.
     */
    getNextInstruction() {

        return this._nextInstructionIndex >= this._instructions.length ?
            null :
            this._instructions[this._nextInstructionIndex];

    }

    /**
     * Execute the next instruction.
     */
    stepForward() {

        // Make sure the next instruction index is valid.
        if(this._nextInstructionIndex < 0)
            throw new Error("The current instruction index is negative, which should never happen.");
        else if(this._nextInstructionIndex >= this._instructions.length)
            throw new Error("There are no more instructions to run. Don't call this function without checking if the runtime is halted.");

        // Get the next instruction to execute.
        var instruction = this._instructions[this._nextInstructionIndex];

        // Execute the next instruction.
        var distance = instruction.execute(this._runtime);

        // Increment the runtime's global step count.
        this._runtime.incrementStepCount();

        // If the instruction didn't return a value, move forward one instruction.
        if(_.isUndefined(distance))
            this._nextInstructionIndex += 1;
        // Otherwise, move forward by the distance specified by the instruction.
        else
            this._nextInstructionIndex += distance;

    }

    /**
     * @returns {boolean} True if the program counter is at the end of the instructions.
     */
    isHalted() {

        return this._nextInstructionIndex >= this._instructions.length;

    }

    /**
     * Push a value on top of the accumulator stack.
     * @param value The value to place on top of the accumulator stack.
     */
    pushOntoAccumulator(value) {

        if(!(value instanceof JavaScriptRuntimeValue)) {
            console.error(value);
            throw new Error("Invalid value on stack: " + value);
        }

        this._accumulator.push(value);

    }

    /**
     * Push a value on top of the accumulator stack.
     * @returns {JavaScriptRuntimeValue} the value on the top of the stack or an exception if there is no value.
     */
    popAccumulator(token) {

        if(this._accumulator.length === 0)
            throw new RuntimeError(token, ERROR_MESSAGES.EMPTY_ACCUMULATOR);

        return this._accumulator.pop();

    }

    peekAccumulator(count) {

        if(_.isUndefined(count))
            return this._accumulator[this._accumulator.length - 1];
        else
            return this._accumulator.slice(Math.max(this._accumulator.length - count, 0));

    }

    /**
     * Declare the given name in the frame's namespace.
     * @param {String} name
     * @param value
     */
    declareName(name, value) {

        if(!(value instanceof JavaScriptRuntimeValue)) {
            console.error(value);
            throw new Error("Value sent to declare name should be JavaScriptRuntimeValue");
        }

        this._namespace[name] = value;

    }

    /**
     * Retrieve the value by the given name in the namespace.
     */
    getName(token, name) {

        // Does this namespace have the name? If so, return it's value.
        if(this._namespace.hasOwnProperty(name))
            return this._namespace[name];

        // Does this namespace have a function with a closure frame? If so, see what it returns.
        if(this._function !== null && this._function.getClosureFrame() !== null)
            return this._function.getClosureFrame().getName(token, name);

        // Is this frame the global frame and this global is the global defined in the browser's window object? Bind it.
        if(this === this._runtime.getGlobalFrame() && _.has(window, name))
            return this.getRuntime().wrapNativeValue(window[name]);

        // Otherwise, throw an unresolved name error.
        throw new RuntimeError(token, ERROR_MESSAGES.UNDEFINED_NAME(name));

    }

    /**
     * Set the name in this frame.
     */
    setName(token, name, operator, value) {

        if(!(value instanceof JavaScriptRuntimeValue)) {
            console.error(value);
            throw new Error("Value sent to set name should be JavaScriptRuntimeValue");
        }

        var namespace = this._namespace;

        // If this name is defined, update the name here.
        if(namespace.hasOwnProperty(name)) {

            return JavaScriptRuntime.assignValueInNamespace(this.getRuntime(), token, namespace, name, operator, value);

        }
        // Does this namespace have a function with a closure frame? If so, try to assign in it.
        else if(this._function !== null && this._function.getClosureFrame() !== null) {

            return this._function.getClosureFrame().setName(token, name, operator, value);

        }
        // Otherwise, this is the global frame, in which case we can assign undefined names but not modify them.
        else if(this === this._runtime.getGlobalFrame()) {

            // We can initialize an undefined name...
            if(operator === "=") {

                return JavaScriptRuntime.assignValueInNamespace(this.getRuntime(), token, this._runtime.getGlobalFrame().getNamespace(), name, operator, value);

            }
            // ... but we can't use any other assignment operator on an undefined name.
            else {

                throw new RuntimeError(token, ERROR_MESSAGES.UNDEFINED_NAME(name));

            }

        } else {

            throw new Error("Somehow we're trying to assign a name to a non-global frame with no closure frame.");

        }

    }

}



/**
 * An object that executes a JavaScript runtime.
 */
class JavaScriptRuntime extends Runtime {

    /**
     * @param {SourceFile} file - A File object that can return a list of instructions.
     */
    constructor(file) {

        super(file);

        // The maximum number of milliseconds to allow a program to execute.
        this._maxExecutionTime = 100;

        // The maximum call stack depth.
        this._maxCallStackDepth = 100;

        // Wrapped native values, indexed by step count.
        this._wrapped = {};

        // Start the machine.
        this.reset();

        // Run to the end so we can discover the output and breakpoints.
        this.runToEnd();

        // Then start over.
        this.reset();

    }

    _addDefaultGlobalBindings() {

        var globals = {
            "print": new NativeJavaScriptFunction(this, "print", (runtime, values) => {

                if (values.length !== 1)
                    throw new RuntimeError(runtime.getCurrentFrame().getNextInstruction()._left, "print() requires a single value to print.");

                var string = "" + values[0];

                // Add the string to the console.
                runtime.addToConsole(string);

            }, true),
            "canvas": new NativeJavaScriptObject(
                this,
                [
                    // Properties to reveal
                    "lineWidth",
                    "font",
                    "textAlign",
                    "fillStyle",
                    "strokeStyle",

                    // Functions
                    "clearRect",
                    "fillRect",
                    "strokeRect",
                    "fillText",
                    "strokeText",
                    "fill",
                    "stroke"

                    // Other properties that we don't want to expose, since they add too much complexity.
                    // "textBaseline"
                    // "lineCap"
                    // "lineJoin"
                    // "miterLimit"

                ],
                // This object wraps the context of the canvas.
                () => {

                    // TODO This is a reference to the view and it really shouldn't be here.
                    // The plviz UI should add this global.
                    var canvas = document.getElementById("pltutor-canvas");
                    return canvas ? canvas.getContext("2d") : null;

                },
                (name) => { return /^(stroke|fill).*/.test(name) }
            ),
            "Math": new NativeJavaScriptObject(
                this,
                null,
                () => { return Math; },
                // It's output if it starts with stroke or fill
                false
            )
        };

        // Add the globals to the frame.
        _.forEach(globals, (fun, name) => { this.globalFrame.declareName(name, fun); });

    }

    /**
     * Resets this machine's state.
     */
    reset() {

        // Create a global stack frame to store the global namespace.
        this.globalFrame = new JavaScriptStackFrame(this, null, null, this.getFile().getInstructions(), []);

        // The stack used to represent frames.
        this._frames = [ this.globalFrame ];

        // The last exception thrown, if any.
        this._exception = null;

        // The list of strings printed to the console.
        this._console = [];

        // The global step count, to support reversibility.
        this._stepCount = 0;

        // Add all of the native functions to the global frame.
        this._addDefaultGlobalBindings();

        // Erase the Canvas.
        var canvas = document.getElementById("pltutor-canvas");
        if(canvas)
            canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

    }
    
    /**
     *
     * @returns {boolean} True if there are no active frames in the runtime.
     */
    isHalted() {

        return this._exception !== null ||
                (this.getCurrentFrame() === this.getGlobalFrame() && this.getGlobalFrame().isHalted());

    }

    /**
     * Return the last exception thrown.
     * @returns {String}
     */
    getException() {

        return this._exception;

    }

    /**
     * @returns {Object} The global JavaScriptFrame.
     */
    getGlobalFrame() {

        return this.globalFrame;

    }

    /**
     * Execute the current frame's next instruction.
     */
    stepForward() {

        // If this machine is halted, do nothing.
        if(this.isHalted())
            return;

        // If this machine had an exception, do nothing.
        if(this.getException() !== null)
            return;

        // Try stepping forward.
        try {

            this.getCurrentFrame().stepForward();

            // If the current frame is halted, pop it.
            if(this.getCurrentFrame().isHalted()) {

                // Don't pop the global frame. We need it!
                if(this.getCurrentFrame() !== this.getGlobalFrame())
                    this._frames.pop();

            }

        } catch(ex) {

            if(ex instanceof RuntimeError)
                this._exception = ex;
            else
                throw ex;

        }

    }

    /**
     * Move backwards one step by re-running the program to the previous step.
     */
    stepBackward() {

        // What step should we execute to?
        var stepToExecuteTo = Math.max(0, this._stepCount - 1);

        // Run to the step.
        this.runToStep(stepToExecuteTo);

    }

    /**
     * Run to the end of the program from wherever the current runtime is.
     */
    runToEnd() {

        // Next instruction, to advance past breakpoints.
        this.stepForward();

        // Run to the end and halt on breakpoints.
        this.runToStep(null, false, true);

    }

    /**
     * Reset and run the program to the given step, or until the program halts.
     */
    runToStep(step, reset, haltOnBreakpoint) {

        if(_.isUndefined(step))
            step = null;

        if(_.isUndefined(reset))
            reset = true;

        if(_.isUndefined(haltOnBreakpoint))
            haltOnBreakpoint = true;

        // Reset the runtime.
        if(reset)
            this.reset();

        // Remember what time we started to run so we can prevent infinite loops from hanging the browser.
        var startTime = (new Date()).getTime();

        // Keep running steps until we reach the step to run to, or the program halts.
        while(!this.isHalted() && (step === null || step !== this._stepCount)) {

            // Next instruction.
            this.stepForward();

            // Throw an exception if we've been looping too long.
            // This will indirectly halt the machine.
            if((new Date()).getTime() - startTime > this._maxExecutionTime) {
                this._exception = new RuntimeError(
                    this.getCurrentFrame().getNextInstruction().getFirstToken(),
                    ERROR_MESSAGES.EXECUTION_TIMEOUT
                );
            }

            // We check this in order to record breakpoints, but don't stop.
            if(this.onBreakpoint() && haltOnBreakpoint)
                break;

        }

    }

    /**
     * Invoke the given function.
     */
    callFunction(fun, thisValue, values) {

        this._frames.push(new JavaScriptStackFrame(this, thisValue, fun, fun.getInstructions(), values));

        if(this._frames.length > this._maxCallStackDepth) {
            this._exception = new RuntimeError(
                this.getCurrentFrame().getNextInstruction().getFirstToken(),
                ERROR_MESSAGES.STACK_OVERFLOW
            );
        }

    }

    /**
     * Push a value on top of the accumulator stack.
     * @param value The value to place on top of the accumulator stack.
     */
    pushOntoCurrentAccumulator(value) {

        this.getCurrentFrame().pushOntoAccumulator(value);

    }

    /**
     * Pop a value from top of the current frame's accumulator.
     * @returns {JavaScriptRuntimeValue} the value on the top of the stack or an exception if there is no value.
     */
    popCurrentAccumulator(token) {

        return this.getCurrentFrame().popAccumulator(token);

    }

    /**
     * Pop a value from top of the current frame's accumulator.
     * @returns the value on the top of the stack or an exception if there is no value.
     */
    peekCurrentAccumulator(count) {

        return this.getCurrentFrame().peekAccumulator(count);

    }

    /**
     * @returns {JavaScriptStackFrame} The current stack frame.
     */
    getCurrentFrame() {

        return this._frames[this._frames.length - 1];

    }

    /**
     * @returns {JavaScriptStackFrame[]} Get all frames.
     */
    getFrames() {

        return _.clone(this._frames);

    }

    /**
     * Declare the given name with the given value in the current frame.
     */
    declareInCurrentFrame(name, value) {

        this.getCurrentFrame().declareName(name, value);

    }

    /**
     * Retrieve the value by the given name within the current frame.
     */
    getNameInCurrentFrame(token, name) {

        return this.getCurrentFrame().getName(token, name);

    }

    /**
     * Set the name in the current stack frame.
     * @param {Token} token - The token associated with this operation.
     * @param {String} name
     * @param {String} operator
     * @param value
     */
    setNameInFrame(token, name, operator, value) {

        return this.getCurrentFrame().setName(token, name, operator, value);

    }

    /**
     * Pop the current frame off the frame stack.
     */
    popCurrentFrame() {

        this._frames.pop();

    }

    /**
     * Resolve the given name.
     */
    resolveName(token, name) {

        if(name === "this") {

            // If the current frame is the global namespace, then this refers to the global namespace.
            if(this.getCurrentFrame() === this.getGlobalFrame()) {
                return new JavaScriptObject(this, this.getGlobalFrame().getNamespace());
            }
            // Otherwise, this should refer to the name defined in the current frame,
            // which was set during the function call that produced this frame.
            else {
                return this.getNameInCurrentFrame(token, name);
            }

        } else {
            return this.getNameInCurrentFrame(token, name);
        }

    }

    /**
     * Helper function for performing assignments on different types of objects.
     * @param {JavaScriptRuntime} runtime - The runtime performing this assignment.
     * @param {Token} token - The token that corresponds to this code.
     * @param {Object} namespace
     * @param {String} name
     * @param {String} operator
     * @param value
     */
    static assignValueInNamespace(runtime, token, namespace, name, operator, value) {

        if(!(value instanceof JavaScriptRuntimeValue)) {
            console.error(value);
            throw new Error("Value sent to assignValueInNamespace() should be JavaScriptRuntimeValue");
        }

        var nativeCurrentValue = _.has(namespace, name) ? namespace[name].getValue() : null;

        switch(operator) {

            case "=":
                namespace[name] = value;
                break;
            case "+=":
                namespace[name] = new JavaScriptRuntimeValue(runtime, nativeCurrentValue + value.getValue());
                break;
            case "-=":
                namespace[name] = new JavaScriptRuntimeValue(runtime, nativeCurrentValue - value.getValue());
                break;
            case "++":
                namespace[name] = new JavaScriptRuntimeValue(runtime, nativeCurrentValue + 1);
                break;
            case "--":
                namespace[name] = new JavaScriptRuntimeValue(runtime, nativeCurrentValue - 1);
                break;
            case "*=":
                namespace[name] = new JavaScriptRuntimeValue(runtime, nativeCurrentValue * value.getValue());
                break;
            case "/=":
                namespace[name] = new JavaScriptRuntimeValue(runtime, nativeCurrentValue / value.getValue());
                break;
            case "%=":
                namespace[name] = new JavaScriptRuntimeValue(runtime, nativeCurrentValue % value.getValue());
                break;
            case "<<=":
                namespace[name] = new JavaScriptRuntimeValue(runtime, nativeCurrentValue << value.getValue());
                break;
            case ">>=":
                namespace[name] = new JavaScriptRuntimeValue(runtime, nativeCurrentValue >> value.getValue());
                break;
            case ">>>=":
                namespace[name] = new JavaScriptRuntimeValue(runtime, nativeCurrentValue >>> value.getValue());
                break;
            case "&=":
                namespace[name] = new JavaScriptRuntimeValue(runtime, nativeCurrentValue & value.getValue());
                break;
            case "^=":
                namespace[name] = new JavaScriptRuntimeValue(runtime, nativeCurrentValue ^ value.getValue());
                break;
            case "|=":
                namespace[name] = new JavaScriptRuntimeValue(runtime, nativeCurrentValue | value.getValue());
                break;
            default:
                throw new RuntimeError(token, ERROR_MESSAGES.UNKNOWN_OPERATOR(operator));

        }

        // If we assigned an array a value, wrap all of the new undefined values.
        if(_.isArray(namespace)) {
            for(let i = 0; i < namespace.length; i++)
                if(_.isUndefined(namespace[i]))
                    namespace[i] = new JavaScriptRuntimeValue(runtime, undefined);
        }

        return namespace[name];

    }

    /**
     * Utility for wrapping a native value with the appropriate wrapper.
     */
    wrapNativeValue(value) {

        if(!_.has(this._wrapped, this.getCurrentStepCount())) {

            this._wrapped[this.getCurrentStepCount()] =
                _.isFunction(value) ? new NativeJavaScriptFunction(this, value.name, value, false) :
                    _.isArray(value) ? new JavaScriptArray(this, value) :
                        _.isObject(value) ? new NativeJavaScriptObject(this, null, () => {
                            return value;
                        }, false) :
                            new JavaScriptRuntimeValue(this, value);

        }

        return this._wrapped[this.getCurrentStepCount()];

    }

}

export {
    JavaScriptRuntime,
    JavaScriptStackFrame,
    JavaScriptFunction,
    JavaScriptObject,
    JavaScriptArray,
    JavaScriptRuntimeValue,
    NativeJavaScriptFunction,
    NativeJavaScriptObject
};