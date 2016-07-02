import _ from "lodash";

/**
 * An abstract class for representing a tokenized and parsed source file.
 */
class SourceFile {

    /**
     * Construct an instance with the source tokenized and parsed into tokens and an AST.
     * @param {String} name The name of the file.
     * @param {String} source The text of the file.
     */
    constructor(language, name, source) {

        if (!_.isString(source)) throw new Error("Source code must be a string.");

        this._language = language;

        // The name of this source file.
        this._name = name;

        // The entire text of this source file in string form.
        this._source = source;

        // Transform the source file into a list of tokens.
        var tokenizer = this._createTokenizer();

        // Store the tokens.
        this._tokens = tokenizer.getTokens();

        // No AST and no instructions unless we succeed.
        this._ast = null;
        this._instructions = [];
        this._parsingErrors = [];

        // If there are no tokenization errors, parse and compile the file.
        if (tokenizer.getErrors().length === 0) {

            // Get a parser.
            var parser = this._createParser(this._tokens);

            // If there aren't any errors, transform the tokens into an abstract syntax tree.
            this._ast = parser.getAST();

            // If there's an AST, transform it into instructions.
            if (parser.getErrors().length === 0) this._instructions = this._ast.serialize();
            // Otherwise, grab the errors from the parser.
            else this._parsingErrors = parser.getErrors();
        }
    }

    getLanguage() {
        return this._language;
    }

    getName() {
        return this._name;
    }

    /**
     * Tokenize the given source file. Abstract method to be implemented by subclasses.
     * @private
     * @returns {Array} list of Token instances.
     */
    _createTokenizer() {}

    /**
     * Parse the tokens. Subclasses must override.
     * @private
     * @returns {Parser} Abstract syntax tree for the source file.
     */
    _createParser(tokens) {}

    /**
     * @returns {String} The original source code.
     */
    getSource() {
        return this._source;
    }

    /**
     * @returns {Array} The list of tokens in this source file.
     */
    getTokens() {
        return this._tokens;
    }

    /**
     * @returns {AST} The list of error ASTs generated during parsing.
     */
    getParsingErrors() {
        return this._parsingErrors;
    }

    /**
     * @returns {Object} The abstract syntax tree parsed for this file.
     */
    getAST() {
        return this._ast;
    }

    /**
     * @returns {Object} The instructions in this file.
     */
    getInstructions() {

        return this._instructions;
    }

    /**
     * @returns {String} Text within the given range inclusive.
     */
    getText(startIndex, stopIndex) {

        // Some error checking.
        if (startIndex < 0 || startIndex >= this._source.length || stopIndex < 0 || stopIndex >= this._source.length) {

            var givenRange = "[" + startIndex + "," + stopIndex + "]";
            var validRange = "[0," + (this._source.length - 1) + "]";
            var context = this._source.substring(Math.max(0, startIndex - 100), startIndex);

            throw new Error("Invalid range for source file " + this._name + ": given " + givenRange + ", valid range is " + validRange + ", context is '" + context + "'");
        } else return this._source.substring(startIndex, stopIndex + 1);
    }

}

/**
 * A base class for tokenizing a string.
 */
class Tokenizer {

    /**
     * @param {SourceFile} sourceFile
     * @param {String} endOfFileErrorMessage The error message to use when unexpectedly reaching the end of the file.
     */
    constructor(sourceFile, invalidCharacterMessage, endOfFileErrorMessage) {

        this._file = sourceFile;
        this._source = sourceFile.getSource();
        this._currentIndex = 0;
        this._tokens = [];
        this._errors = [];
        this._invalidCharError = invalidCharacterMessage;
        this._eofError = endOfFileErrorMessage;
    }

    setCurrentIndex(index) {
        this._currentIndex = index;
    }

    getCurrentIndex() {
        return this._currentIndex;
    }

    getSourceFile() {
        return this._file;
    }

    getSource() {
        return this._source;
    }

    getErrors() {
        return this._errors;
    }

    getTokens() {
        return this._tokens;
    }

    /**
     * @param {Token} token The token to append to the list of tokens in this tokenizer.
     */
    addToken(token) {
        this._tokens.push(token);
    }

    getLastToken() {

        return this._tokens.length === 0 ? null : this._tokens[this._tokens.length - 1];
    }

    /**
     * Look ahead to the next character.
     * @param {int=} numberAhead Optional number of characters to peek ahead of current index.
     * @returns {String} The current character.
     */
    peek(numberAhead) {

        if (!numberAhead) numberAhead = 0;

        var peekIndex = this.getCurrentIndex() + numberAhead;

        if (peekIndex >= this._source.length) return null;else return this._source[peekIndex];
    }

    /**
     * Search for the given string starting from the current index.
     * @param needle
     * @returns {int}
     */
    find(needle) {

        return this._source.indexOf(needle, this.getCurrentIndex());
    }

    /**
     * Move to the next character and return the one we just moved past.
     * @returns {String} The current character.
     */
    next() {

        var ch = this.peek();

        if (ch === null) throw new ParsingError(this.getLastToken(), this._eofError);

        this._currentIndex++;

        return ch;
    }

    addErrorToken(token) {

        this._errors.push(token);
    }

    /**
     * Must be defined by subclasses.
     * @private
     */
    _handleNextIndex() {}

    /**
     * Must be defined by subclasses.
     * @param {String} type
     * @param {int} index
     * @param {String} error
     */
    makeToken(type, index, error) {}

    /**
     * Utility function for looping through characters while a predicate is true.
     * @param predicate
     * @returns {string}
     */
    readWhile(predicate) {

        var ret = "",
            ch = this.peek(),
            i = 0;
        while (ch && predicate(ch, i++)) {
            ret += this.next();
            ch = this.peek();
        }
        return ret;
    }

    /**
     * Lexically analyze the source file generating a list of tokens.
     */
    tokenize() {

        // This is for error detection.
        var previousIndex = this.getCurrentIndex() - 1;

        // Keep going until we reach the end of the source file.
        while (this.getCurrentIndex() < this.getSource().length) {

            var startIndex = this.getCurrentIndex();

            try {

                // We should never do an iteration of this loop and be in the same place.
                if (previousIndex === this.getCurrentIndex()) throw "Defect in tokenizer; index didn't advance past character " + this.getCurrentIndex() + " '" + this.peek() + "'";else previousIndex = this.getCurrentIndex();

                // The subclass decides how to handle the next character.
                if (!this._handleNextIndex())
                    // Unrecognized token
                    throw new ParsingError(this.getLastToken(), this._invalidCharError);
            } catch (ex) {

                if (ex instanceof ParsingError) {

                    // Catch any tokenization errors and bundle them into an error token that goes to the end of the line.
                    while (this.getCurrentIndex() < this.getSource().length && this.peek() !== '\n') this.next();

                    // Make an error token from where we started this loop to the current character.
                    this.addErrorToken(this.makeToken("error", startIndex, ex._message));
                } else {

                    throw ex;
                }
            }
        }
    }

}

/**
 * A convenience class for storing and accessing a list of tokens.
 */
class Tokens {

    /**
     * @param {Array} tokens A list of Tokens.
     */
    constructor(tokens) {

        this._tokens = _.clone(tokens);
        this._index = 0;
    }

    getCurrentIndex() {
        return this._index;
    }

    setCurrentIndex(index) {
        this._index = index;
    }

    getNext() {

        if (this._index >= this._tokens.length) return null;else return this._tokens[this._index];
    }

    hasNext() {
        return this._index < this._tokens.length;
    }

    nextIs(type, text) {

        var next = this.getNext();

        if (next === null) {
            return false;
        }

        var matchingType = next.getType() === type;
        var matchingText = _.isUndefined(text) || next.getText() === text;

        return matchingType && matchingText;
    }

    consume(type, text) {

        var next = this.getNext();

        if (next === null) {
            if (text) throw new ParsingError(this.peek(), "Expected " + type + " '" + text + "'");else throw new ParsingError(this.peek(), "Expected " + type);
        }

        var matchingType = _.isUndefined(type) || this.getNext().getType() === type;
        var matchingText = _.isUndefined(text) || this.getNext().getText() === text;

        // Bail if the text or type didn't match.
        if (!matchingType || !matchingText) throw new ParsingError(this.peek(), "Expected " + type + " '" + text + "'");

        // Bail if the text or type didn't match.
        if (!matchingType) throw new ParsingError(this.peek(), "Expected " + type);

        // Next token!
        this._index++;

        return next;
    }

    peek() {

        return this._tokens[this._index];
    }

    previous() {

        return this._index === 0 ? this._tokens[0] : this._tokens[this._index - 1];
    }

}

/**
 * An abstract base class for representing a node in an abstract syntax tree.
 */
class AST {

    constructor() {}

    /**
     * @returns {Array} a list of Instructions for execution.
     */
    serialize() {}

}

class ErrorAST {

    /**
     * @param {string} message A description of the parsing error.
     * @param {Token} problematicToken The token that the parser halted on.
     * @param {Token[]} tokens The sequence of tokens that couldn't be successfully parsed.
     */
    constructor(message, problematicToken, tokens) {

        this._message = message;
        this._problematicToken = problematicToken;
        this._tokens = tokens;
    }

    getProblematicToken() {
        return this._problematicToken;
    }

    getMessage() {
        return this._message;
    }

    /**
     * An empty list of instructions.
     * @returns {Instruction[]}
     */
    serialize() {
        return [];
    }

}

/**
 * An abstract class for representing a token inside of a source file.
 * Represented via a link to the source file and the text range of the token.
 */
class Token extends AST {

    constructor(sourceFile, type, startIndex, stopIndex, error) {

        super();

        // The text of the
        this._file = sourceFile;
        this._type = type;
        this._startIndex = startIndex;
        this._stopIndex = stopIndex;
        this._error = error;

        // Cache this token's text for speed.
        this._text = this._file.getText(this._startIndex, this._stopIndex);
    }

    /**
     * @returns {string} The text of this token.
     */
    getText() {
        return this._text;
    }

    /**
     * @returns {string} The type of the token.
     */
    getType() {
        return this._type;
    }

    /**
     * @returns {string} The tokenization or parsing error associated with this token.
     */
    getError() {
        return this._error;
    }

    /**
     * @returns {Boolean} True if the token is just whitespace.
     */
    isWhitespace() {
        return this._type === "whitespace";
    }

    isComment() {
        return this._type === "comment";
    }

    isError() {
        return this._type === "error";
    }

    /**
     * @returns {Object} The SourceFile this token was derived from.
     */
    getFile() {
        return this._file;
    }

    /**
     * @returns {int} The start index of this token in the source file from which it was derived.
     */
    getStartIndex() {
        return this._startIndex;
    }

    /**
     * @returns {int} The stop index of this token in the source file from which it was derived.
     */
    getStopIndex() {
        return this._stopIndex;
    }

}

class Parser {

    constructor(tokens) {

        this._tokens = tokens;
        this._parsingErrors = [];
    }

    /**
     * Must be overriden by subclasses.
     * @returns {AST} The AST representing the whole program.
     */
    getAST() {}

    getTokens() {
        return this._tokens;
    }

    getErrors() {
        return this._parsingErrors;
    }

}

/**
 * An abstract base class for representing an executable instruction.
 */
class Instruction {

    constructor(ast, explanation) {

        // This is the AST from which this instruction was derived.
        this._ast = ast;

        // This is the explanation of how the instruction will execute.
        // It's provided by the compiler in order for instructions to be contextualized.
        this._explanation = explanation;
    }

    /**
     *
     * @param {Runtime} runtime - A Runtime in which to execute this instruction.
     * @returns {number} The number of instructions to advance the runtime's program counter.
     */
    execute(runtime) {}

    /**
     * @returns {AST} The abstract syntax tree from which this Instruction was generated.
     */
    getAST() {

        return this._ast;
    }

    /**
     * @returns {Token} The first token in this AST.
     */
    getFirstToken() {

        var sortedTokens = _.sortBy(_.filter(Object.getOwnPropertyNames(this), name => {
            return this[name] instanceof Token;
        }), name => {
            return this[name].getStartIndex();
        });

        return this[sortedTokens[0]];
    }

    /**
     * Should be overridden by subclasses.
     * @returns {RuntimeValue[]} All of the runtime values that this instruction depends on for its execution.
     */
    getValueDependencies(runtime) {
        return [];
    }

    /**
     * Should be overridden by subclasses.
     * @returns An explanation of how the instruction executes.
     */
    getExplanation() {

        return this._explanation;
    }

    toString() {

        return this.constructor.name;
    }

}

/**
 * An abstract base class for representing a runtime environment for executing instructions.
 */
class Runtime {

    constructor(file) {

        this._file = file;
        this._listeners = [];

        // The global step count, to support reversibility.
        this._stepCount = 0;

        // The maximum step count, allowing us to keep track of how many steps we've seen.
        // We don't reset this.
        this._maxStepCount = 0;

        // The step numbers on which output occurred.
        this._outputSteps = {};

        // The step numbers on which breakpoints occurred.
        this._breakpointSteps = {};

        // No breakpoints to start.
        this._breakpoints = {};

        // The list of strings printed to the console.
        this._console = [];
    }

    /**
     * Add a line to the console.
     * @param {string} line - The line of text to add to the console.
     */
    addToConsole(line) {

        // Add the line to the console.
        this._console.push({
            line: line,
            step: this.getCurrentStepCount()
        });
    }

    /**
     * @returns {string[]} The array of console lines.
     */
    getConsole() {
        return this._console;
    }

    /**
     * @returns {{}} The steps on which output occurred.
     */
    getBreakpointSteps() {
        return this._breakpointSteps;
    }

    /**
     * @returns {number} Number of the current step.
     */
    getCurrentStepCount() {
        return this._stepCount;
    }

    /**
     * Add one to the step count.
     */
    incrementStepCount() {

        this._stepCount++;
        if (this._stepCount > this._maxStepCount) this._maxStepCount = this._stepCount;
    }

    /**
     * Remember that this step is output.
     */
    markCurrentStepAsOutput() {

        this._outputSteps[this.getCurrentStepCount()] = true;
    }

    /**
     * @returns {boolean} True if the next instruction is associated with a token that has a breakpoint.
     */
    onBreakpoint() {

        // If the machine is halted, no.
        if (this.isHalted()) return false;

        var frame = this.getCurrentFrame();

        // If there's no frame, no.
        if (frame === null) return false;

        var instruction = frame.getNextInstruction();

        // If there's no instruction, then no.
        if (instruction === null) return false;

        // Return true if one of the instruction's tokens has a breakpoint.
        var onBreakpoint = _.some(Object.getOwnPropertyNames(instruction), prop => {
            return instruction[prop] instanceof Token && _.has(this._breakpoints, instruction[prop].getStartIndex());
        });

        // Remember that there was a breakpoint at this step.
        if (onBreakpoint) this._breakpointSteps[this.getCurrentStepCount()] = true;

        return onBreakpoint;
    }

    /**
     * @param {Token} token - The token to break on.
     */
    toggleBreakpoint(token) {

        if (this.tokenHasBreakpoint(token)) {
            delete this._breakpoints[token.getStartIndex()];
        } else {
            this._breakpoints[token.getStartIndex()] = token;
        }

        // Update the breakpoint steps.
        this._breakpointSteps = {};

        // Remember the current step
        var currentStep = this.getCurrentStepCount();

        // Re-run to the max step to determine breakpoint locations.
        this.runToStep(this.getMaxStepCount(), true, false);

        // Go back to the current step
        this.runToStep(currentStep, true, false);
    }

    /**
     * @param {Token} token - The token to break on.
     */
    tokenHasBreakpoint(token) {

        return _.has(this._breakpoints, token.getStartIndex());
    }

    /**
     * @returns {number} The highest step index we've observed for this program.
     */
    getMaxStepCount() {
        return this._maxStepCount;
    }

    /**
     * @returns {{}} The steps on which output occurred.
     */
    getOutputSteps() {
        return this._outputSteps;
    }

    getFile() {
        return this._file;
    }

    addListener(listener) {

        this._listeners.push(listener);
    }

    notifyListeners() {

        _.each(this._listeners, listener => {
            listener.changed();
        });
    }

    /**
     * Execute the next instruction.
     */
    stepForward() {}

    /**
     * Undo the previous instruction, restoring the runtime and it's state as if the instruction
     * had never executed.
     */
    stepBackward() {

        // TODO Build the reversibility into the base class by having a generic state model.

    }

}

/**
 * Generated during parsing to represent a parsing error.
 */
class ParsingError {

    /**
     * @param {Token} token - The token that the parser halted on.
     * @param {string} message - The error message.
     */
    constructor(token, message) {

        this._message = message;
        this._token = token;
    }

    getMessage() {
        return this._message;
    }

    getMessageAndContext() {

        var context = this._token == null ? "Beginning of file" : this._token.getFile().getText(Math.max(0, this._token.getStopIndex() - 100), this._token.getStopIndex());

        return context + " <<<<<< " + this._message;
    }

}

/**
 * Generated during execution of an Instruction.
 */
class RuntimeError {

    /**
     * @param {Token} token - The token associated with this error.
     * @param {string} message - The error message.
     */
    constructor(token, message) {

        this._token = token;
        this._message = message;
    }

    getToken() {
        return this._token;
    }
    getMessage() {
        return this._message;
    }

    toString() {

        return this._message;
    }

}

/**
 * A subclass for all values allowing us to capture dependencies.
 */
class RuntimeValue {

    constructor(runtime) {

        // Remember what step this value was computed on.
        this._step = runtime.getCurrentStepCount();
    }

    getStep() {
        return this._step;
    }

}

export { SourceFile, Token, Tokens, Tokenizer, Parser, AST, ErrorAST, Instruction, Runtime, ParsingError, RuntimeError, RuntimeValue };

