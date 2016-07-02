import _ from "lodash";
import { SourceFile, Tokens } from "./pl";
import { JavaScriptTokenizer } from "./tokenizer";
import { JavaScriptParser } from "./parser";

/**
 * An object representing a JavaScript source file.
 */
class JavaScriptFile extends SourceFile {

    constructor(name, source) {

        super("javascript", name, source);
    }

    _createTokenizer() {

        return new JavaScriptTokenizer(this);
    }

    /**
     * @private
     * @param tokens A list of Token objects to parse.
     * @returns {Object} An abstract syntax tree or null if there is no tree.
     */
    _createParser(tokens) {

        // Exclude whitespace and comments that appear in the middle of a line, then parse.
        var parsableTokens = [];
        for (let i = 0; i < tokens.length; i++) {

            let token = tokens[i];
            let nextParsableTokens = _.filter(tokens.slice(i), token => {
                return !token.isComment() && !token.isWhitespace();
            });
            let lastParsableToken = parsableTokens.length === 0 ? null : parsableTokens[parsableTokens.length - 1];
            let nextParsableToken = nextParsableTokens.length === 0 ? null : nextParsableTokens[0];

            // Exclude whitespace tokens.
            // Exclude comments unless they appear before "function" or after "}" or ";"
            if (!token.isWhitespace() && (!token.isComment() ||
            // Appears at top of file
            lastParsableToken === null ||
            // Appears at end of file
            nextParsableToken === null ||
            // Appears after a block, function, or control statement
            lastParsableToken.getText() === "}" ||
            // Appears after a statement
            lastParsableToken.getText() === ";" ||
            // Appears before a function
            nextParsableToken.getText() === "function")) parsableTokens.push(token);
        }

        // Parse the tokens.
        return new JavaScriptParser(new Tokens(parsableTokens));
    }

}

export { JavaScriptFile };
