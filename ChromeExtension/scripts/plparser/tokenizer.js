import { ParsingError, Token, Tokenizer } from "./../pl";
import { JavaScriptPushInstruction } from "./instructions";
import { ERROR_MESSAGES, EXPLANATIONS } from "./strings.js";
import _ from "lodash";

/**
 * Reserved JavaScript keywords, for use in lexing and parsing.
 */
var KEYWORDS = _.keyBy([
    "break", "case", "catch", "const",
    "continue", "debugger", "default", "delete",
    "do", "else", "finally", "for", "function",
    "if", "in", "instanceof", "new", "return",
    "switch", "throw", "try", "typeof", "var",
    "void", "while", "with"
]);

/**
 * Reserved JavaScript keyword literals.
 */
var KEYWORDS_ATOM = _.keyBy([
    "false",
    "null",
    "true",
    "undefined"
]);

/**
 * JavaScript operator characters.
 */
var OPERATOR_CHARS = _.keyBy("+-*&/%=<>!?|~^".split(""));

/**
 * JavaScript hexadecimal format in regular expression form.
 */
var RE_HEX_NUMBER = /^0x[0-9a-f]+$/i;

/**
 * JavaScript octal format in regular expression form.
 */
var RE_OCT_NUMBER = /^0[0-7]+$/;

/**
 * JavaScript decimal format in regular expression form.
 */
var RE_DEC_NUMBER = /^\d*\.?\d*(?:e[+-]?\d*(?:\d\.?|\.?\d)\d*)?$/i;

/**
 * JavaScript operator sequences.
 */
var OPERATORS = _.keyBy([
    "in",  "instanceof", "typeof", "new", "void", "delete",
    "++", "--", "+", "-", "!", "~", "&", "|", "^", "*",
    "/", "%", ">>", "<<", ">>>", "<", ">", "<=", ">=",
    "==", "===", "!=", "!==", "?", "=", "+=", "-=", "/=", "*=", "%=",
    ">>=", "<<=", ">>>=", "|=", "^=", "&=", "&&", "||"
]);

/**
 * JavaScript legal whitespace characters.
 */
var WHITESPACE_CHARS = _.keyBy(" \u00a0\n\r\t\f\u000b\u200b\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\uFEFF".split(""));

/**
 * JavaScript punctuation characters.
 */
var PUNCTUATION_CHARS = _.keyBy("[]{}(),;:".split(""));

/**
 * JavaScript punctuation that can appear before expressions.
 */
var PUNC_BEFORE_EXPRESSION = _.keyBy("[{(,.;:".split(""));

/**
 * JavaScript keywords that can appear before expressions.
 */
var KEYWORDS_BEFORE_EXPRESSION = _.keyBy(["return", "new", "delete", "throw", "else", "case"]);

/**
 * JavaScript operators that can appear after unary expressions.
 */
var UNARY_POSTFIX = _.keyBy([ "--", "++" ]);

/**
 * JavaScript unicode character classes.
 */
var UNICODE = {  // Unicode 6.1
    letter: new RegExp("[\\u0041-\\u005A\\u0061-\\u007A\\u00AA\\u00B5\\u00BA\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02C1\\u02C6-\\u02D1\\u02E0-\\u02E4\\u02EC\\u02EE\\u0370-\\u0374\\u0376\\u0377\\u037A-\\u037D\\u0386\\u0388-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03F5\\u03F7-\\u0481\\u048A-\\u0527\\u0531-\\u0556\\u0559\\u0561-\\u0587\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0620-\\u064A\\u066E\\u066F\\u0671-\\u06D3\\u06D5\\u06E5\\u06E6\\u06EE\\u06EF\\u06FA-\\u06FC\\u06FF\\u0710\\u0712-\\u072F\\u074D-\\u07A5\\u07B1\\u07CA-\\u07EA\\u07F4\\u07F5\\u07FA\\u0800-\\u0815\\u081A\\u0824\\u0828\\u0840-\\u0858\\u08A0\\u08A2-\\u08AC\\u0904-\\u0939\\u093D\\u0950\\u0958-\\u0961\\u0971-\\u0977\\u0979-\\u097F\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09BD\\u09CE\\u09DC\\u09DD\\u09DF-\\u09E1\\u09F0\\u09F1\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A59-\\u0A5C\\u0A5E\\u0A72-\\u0A74\\u0A85-\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABD\\u0AD0\\u0AE0\\u0AE1\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B35-\\u0B39\\u0B3D\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B71\\u0B83\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB9\\u0BD0\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C33\\u0C35-\\u0C39\\u0C3D\\u0C58\\u0C59\\u0C60\\u0C61\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CBD\\u0CDE\\u0CE0\\u0CE1\\u0CF1\\u0CF2\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D3A\\u0D3D\\u0D4E\\u0D60\\u0D61\\u0D7A-\\u0D7F\\u0D85-\\u0D96\\u0D9A-\\u0DB1\\u0DB3-\\u0DBB\\u0DBD\\u0DC0-\\u0DC6\\u0E01-\\u0E30\\u0E32\\u0E33\\u0E40-\\u0E46\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD-\\u0EB0\\u0EB2\\u0EB3\\u0EBD\\u0EC0-\\u0EC4\\u0EC6\\u0EDC-\\u0EDF\\u0F00\\u0F40-\\u0F47\\u0F49-\\u0F6C\\u0F88-\\u0F8C\\u1000-\\u102A\\u103F\\u1050-\\u1055\\u105A-\\u105D\\u1061\\u1065\\u1066\\u106E-\\u1070\\u1075-\\u1081\\u108E\\u10A0-\\u10C5\\u10C7\\u10CD\\u10D0-\\u10FA\\u10FC-\\u1248\\u124A-\\u124D\\u1250-\\u1256\\u1258\\u125A-\\u125D\\u1260-\\u1288\\u128A-\\u128D\\u1290-\\u12B0\\u12B2-\\u12B5\\u12B8-\\u12BE\\u12C0\\u12C2-\\u12C5\\u12C8-\\u12D6\\u12D8-\\u1310\\u1312-\\u1315\\u1318-\\u135A\\u1380-\\u138F\\u13A0-\\u13F4\\u1401-\\u166C\\u166F-\\u167F\\u1681-\\u169A\\u16A0-\\u16EA\\u16EE-\\u16F0\\u1700-\\u170C\\u170E-\\u1711\\u1720-\\u1731\\u1740-\\u1751\\u1760-\\u176C\\u176E-\\u1770\\u1780-\\u17B3\\u17D7\\u17DC\\u1820-\\u1877\\u1880-\\u18A8\\u18AA\\u18B0-\\u18F5\\u1900-\\u191C\\u1950-\\u196D\\u1970-\\u1974\\u1980-\\u19AB\\u19C1-\\u19C7\\u1A00-\\u1A16\\u1A20-\\u1A54\\u1AA7\\u1B05-\\u1B33\\u1B45-\\u1B4B\\u1B83-\\u1BA0\\u1BAE\\u1BAF\\u1BBA-\\u1BE5\\u1C00-\\u1C23\\u1C4D-\\u1C4F\\u1C5A-\\u1C7D\\u1CE9-\\u1CEC\\u1CEE-\\u1CF1\\u1CF5\\u1CF6\\u1D00-\\u1DBF\\u1E00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u2071\\u207F\\u2090-\\u209C\\u2102\\u2107\\u210A-\\u2113\\u2115\\u2119-\\u211D\\u2124\\u2126\\u2128\\u212A-\\u212D\\u212F-\\u2139\\u213C-\\u213F\\u2145-\\u2149\\u214E\\u2160-\\u2188\\u2C00-\\u2C2E\\u2C30-\\u2C5E\\u2C60-\\u2CE4\\u2CEB-\\u2CEE\\u2CF2\\u2CF3\\u2D00-\\u2D25\\u2D27\\u2D2D\\u2D30-\\u2D67\\u2D6F\\u2D80-\\u2D96\\u2DA0-\\u2DA6\\u2DA8-\\u2DAE\\u2DB0-\\u2DB6\\u2DB8-\\u2DBE\\u2DC0-\\u2DC6\\u2DC8-\\u2DCE\\u2DD0-\\u2DD6\\u2DD8-\\u2DDE\\u2E2F\\u3005-\\u3007\\u3021-\\u3029\\u3031-\\u3035\\u3038-\\u303C\\u3041-\\u3096\\u309D-\\u309F\\u30A1-\\u30FA\\u30FC-\\u30FF\\u3105-\\u312D\\u3131-\\u318E\\u31A0-\\u31BA\\u31F0-\\u31FF\\u3400-\\u4DB5\\u4E00-\\u9FCC\\uA000-\\uA48C\\uA4D0-\\uA4FD\\uA500-\\uA60C\\uA610-\\uA61F\\uA62A\\uA62B\\uA640-\\uA66E\\uA67F-\\uA697\\uA6A0-\\uA6EF\\uA717-\\uA71F\\uA722-\\uA788\\uA78B-\\uA78E\\uA790-\\uA793\\uA7A0-\\uA7AA\\uA7F8-\\uA801\\uA803-\\uA805\\uA807-\\uA80A\\uA80C-\\uA822\\uA840-\\uA873\\uA882-\\uA8B3\\uA8F2-\\uA8F7\\uA8FB\\uA90A-\\uA925\\uA930-\\uA946\\uA960-\\uA97C\\uA984-\\uA9B2\\uA9CF\\uAA00-\\uAA28\\uAA40-\\uAA42\\uAA44-\\uAA4B\\uAA60-\\uAA76\\uAA7A\\uAA80-\\uAAAF\\uAAB1\\uAAB5\\uAAB6\\uAAB9-\\uAABD\\uAAC0\\uAAC2\\uAADB-\\uAADD\\uAAE0-\\uAAEA\\uAAF2-\\uAAF4\\uAB01-\\uAB06\\uAB09-\\uAB0E\\uAB11-\\uAB16\\uAB20-\\uAB26\\uAB28-\\uAB2E\\uABC0-\\uABE2\\uAC00-\\uD7A3\\uD7B0-\\uD7C6\\uD7CB-\\uD7FB\\uF900-\\uFA6D\\uFA70-\\uFAD9\\uFB00-\\uFB06\\uFB13-\\uFB17\\uFB1D\\uFB1F-\\uFB28\\uFB2A-\\uFB36\\uFB38-\\uFB3C\\uFB3E\\uFB40\\uFB41\\uFB43\\uFB44\\uFB46-\\uFBB1\\uFBD3-\\uFD3D\\uFD50-\\uFD8F\\uFD92-\\uFDC7\\uFDF0-\\uFDFB\\uFE70-\\uFE74\\uFE76-\\uFEFC\\uFF21-\\uFF3A\\uFF41-\\uFF5A\\uFF66-\\uFFBE\\uFFC2-\\uFFC7\\uFFCA-\\uFFCF\\uFFD2-\\uFFD7\\uFFDA-\\uFFDC]"),
    combining_mark: new RegExp("[\\u0300-\\u036F\\u0483-\\u0487\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0610-\\u061A\\u064B-\\u065F\\u0670\\u06D6-\\u06DC\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0859-\\u085B\\u08E4-\\u08FE\\u0900-\\u0903\\u093A-\\u093C\\u093E-\\u094F\\u0951-\\u0957\\u0962\\u0963\\u0981-\\u0983\\u09BC\\u09BE-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CD\\u09D7\\u09E2\\u09E3\\u0A01-\\u0A03\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81-\\u0A83\\u0ABC\\u0ABE-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AE2\\u0AE3\\u0B01-\\u0B03\\u0B3C\\u0B3E-\\u0B44\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B56\\u0B57\\u0B62\\u0B63\\u0B82\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD7\\u0C01-\\u0C03\\u0C3E-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0C82\\u0C83\\u0CBC\\u0CBE-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CE2\\u0CE3\\u0D02\\u0D03\\u0D3E-\\u0D44\\u0D46-\\u0D48\\u0D4A-\\u0D4D\\u0D57\\u0D62\\u0D63\\u0D82\\u0D83\\u0DCA\\u0DCF-\\u0DD4\\u0DD6\\u0DD8-\\u0DDF\\u0DF2\\u0DF3\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EB9\\u0EBB\\u0EBC\\u0EC8-\\u0ECD\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F3E\\u0F3F\\u0F71-\\u0F84\\u0F86\\u0F87\\u0F8D-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102B-\\u103E\\u1056-\\u1059\\u105E-\\u1060\\u1062-\\u1064\\u1067-\\u106D\\u1071-\\u1074\\u1082-\\u108D\\u108F\\u109A-\\u109D\\u135D-\\u135F\\u1712-\\u1714\\u1732-\\u1734\\u1752\\u1753\\u1772\\u1773\\u17B4-\\u17D3\\u17DD\\u180B-\\u180D\\u18A9\\u1920-\\u192B\\u1930-\\u193B\\u19B0-\\u19C0\\u19C8\\u19C9\\u1A17-\\u1A1B\\u1A55-\\u1A5E\\u1A60-\\u1A7C\\u1A7F\\u1B00-\\u1B04\\u1B34-\\u1B44\\u1B6B-\\u1B73\\u1B80-\\u1B82\\u1BA1-\\u1BAD\\u1BE6-\\u1BF3\\u1C24-\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE8\\u1CED\\u1CF2-\\u1CF4\\u1DC0-\\u1DE6\\u1DFC-\\u1DFF\\u20D0-\\u20DC\\u20E1\\u20E5-\\u20F0\\u2CEF-\\u2CF1\\u2D7F\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F\\uA674-\\uA67D\\uA69F\\uA6F0\\uA6F1\\uA802\\uA806\\uA80B\\uA823-\\uA827\\uA880\\uA881\\uA8B4-\\uA8C4\\uA8E0-\\uA8F1\\uA926-\\uA92D\\uA947-\\uA953\\uA980-\\uA983\\uA9B3-\\uA9C0\\uAA29-\\uAA36\\uAA43\\uAA4C\\uAA4D\\uAA7B\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uAAEB-\\uAAEF\\uAAF5\\uAAF6\\uABE3-\\uABEA\\uABEC\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE26]"),
    connector_punctuation: new RegExp("[\\u005F\\u203F\\u2040\\u2054\\uFE33\\uFE34\\uFE4D-\\uFE4F\\uFF3F]"),
    digit: new RegExp("[\\u0030-\\u0039\\u0660-\\u0669\\u06F0-\\u06F9\\u07C0-\\u07C9\\u0966-\\u096F\\u09E6-\\u09EF\\u0A66-\\u0A6F\\u0AE6-\\u0AEF\\u0B66-\\u0B6F\\u0BE6-\\u0BEF\\u0C66-\\u0C6F\\u0CE6-\\u0CEF\\u0D66-\\u0D6F\\u0E50-\\u0E59\\u0ED0-\\u0ED9\\u0F20-\\u0F29\\u1040-\\u1049\\u1090-\\u1099\\u17E0-\\u17E9\\u1810-\\u1819\\u1946-\\u194F\\u19D0-\\u19D9\\u1A80-\\u1A89\\u1A90-\\u1A99\\u1B50-\\u1B59\\u1BB0-\\u1BB9\\u1C40-\\u1C49\\u1C50-\\u1C59\\uA620-\\uA629\\uA8D0-\\uA8D9\\uA900-\\uA909\\uA9D0-\\uA9D9\\uAA50-\\uAA59\\uABF0-\\uABF9\\uFF10-\\uFF19]")
};

class JavaScriptToken extends Token {

    /**
     * All JavaScript tokens are serialized as a push of the token's literal value onto the stack.
     * @returns {Array} of instructions.
     */
    serialize() {

        return [new JavaScriptPushInstruction(this, EXPLANATIONS.PUSH_VALUE(this.getText()), this)];

    }

}

/**
 * Tokenizes a string into JavaScript tokens of the following type:
 *  - number
 *  - name
 *  - atom
 *  - string
 *  - punctuation
 *  - regexp
 *  - operator
 *  - keyword
 *  - comment
 *  - whitespace
 */
class JavaScriptTokenizer extends Tokenizer {

    constructor(sourceFile) {

        super(sourceFile, ERROR_MESSAGES.UNEXPECTED_END_OF_FILE);

        this.regexAllowed = false;

        this.tokenize();

    }

    _handleNextIndex() {

        this.readWhitespace();

        // If we're out of characters, break.
        if (this.peek() === null)
            return true;

        // If the next character is a digit, read a digit.
        if (JavaScriptTokenizer.isDigit(this.peek())) {
            this.readNumber();
            return true;
        }
        // If the next character is the beginning of a string literal...
        else if (this.peek() === "'" || this.peek() === '"') {
            this.readString();
            return true;
        }
        // If the next character is punctuation
        else if (_.has(PUNCTUATION_CHARS, this.peek())) {
            this.next();
            this.makeToken("punctuation", this.getCurrentIndex() - 1);
            return true;
        }
        // If the next character is a period...
        else if (this.peek() === ".") {
            this.readDot();
            return true;
        }
        // If the next character is a slash...
        else if (this.peek() === "/") {
            this.readSlash();
            return true;
        }

        // If the next character is an operator character...
        else if (_.has(OPERATOR_CHARS, this.peek())) {
            this.readOperator();
            return true;
        }

        // If the next character is an identifier...
        else if (JavaScriptTokenizer.isIdentifierStart(this.peek())) {
            this.readWord();
            return true;
        }
        // Unknown type, tell the base class we didn't recognize anything.
        else
            return false;

    }

    static isLetter(ch) {
        return ch !== null && UNICODE.letter.test(ch);
    }

    static isDigit(ch) {

        if(ch === null)
            return false;

        ch = ch.charCodeAt(0);
        return ch >= 48 && ch <= 57;

    }

    static isUnicodeDigit(ch) {
        return ch !== null && UNICODE.digit.test(ch);
    }

    static isAlphanumeric(ch) {
        return JavaScriptTokenizer.isDigit(ch) || JavaScriptTokenizer.isLetter(ch);
    }

    static isUnicodeCombiningMark(ch) {
        return ch !== null && UNICODE.combining_mark.test(ch);
    }

    static isUnicodeConnectorPunctuation(ch) {
        return ch !== null && UNICODE.connector_punctuation.test(ch);
    }

    static isIdentifierStart(ch) {
        return ch !== null && (ch === "$" || ch === "_" || JavaScriptTokenizer.isLetter(ch));
    }

    static isIdentifierChar(ch) {
        return JavaScriptTokenizer.isIdentifierStart(ch)
            || JavaScriptTokenizer.isUnicodeCombiningMark(ch)
            || JavaScriptTokenizer.isUnicodeDigit(ch)
            || JavaScriptTokenizer.isUnicodeConnectorPunctuation(ch)
            || ch === "\u200c" // zero-width non-joiner
            || ch === "\u200d" // zero-width joiner
            ;
    }

    static parseNumber(num) {

        if (RE_HEX_NUMBER.test(num)) {
            return parseInt(num.substr(2), 16);
        } else if (RE_OCT_NUMBER.test(num)) {
            return parseInt(num.substr(1), 8);
        } else if (RE_DEC_NUMBER.test(num)) {
            return parseFloat(num);
        }

    }

    /**
     * Constructs a Token based on the given start index, ending at the current index.
     *
     * @param type - A string representing the type of token, used in parsing.
     * @param start - The start index of the token
     * @param error - The error message associated with this token.
     *
     * @returns {JavaScriptToken}
     */
    makeToken(type, start, error) {

        var token = new JavaScriptToken(this.getSourceFile(), type, start, this.getCurrentIndex() - 1, error);

        var text = token.getText();

        // If this token is not a comment and not whitespace, update the regex allowed flag.
        // Regular expressions are allowed after non-unary operators,
        // after keywords before expressions, and after punctuation before expressions.
        if(type !== "comment" && type !== "whitespace")
            this.regexAllowed =
                ((type === "operator" && !_.has(UNARY_POSTFIX, text)) ||
                (type === "keyword" && _.has(KEYWORDS_BEFORE_EXPRESSION, text)) ||
                (type === "punctuation" && _.has(PUNC_BEFORE_EXPRESSION, text)));

        // Add the token to the list of tokens.
        this.addToken(token);

        return token;

    }

    hex_bytes(n) {
        var num = 0;
        for (; n > 0; --n) {
            var digit = parseInt(this.next(), 16);
            if (isNaN(digit))
                throw new ParsingError(this.getLastToken(), ERROR_MESSAGES.INVALID_HEX);
            num = (num << 4) | digit;
        }
        return num;
    }

    readEscapedChar() {

        var ch = this.next();
        switch (ch) {
            case "n" : return "\n";
            case "r" : return "\r";
            case "t" : return "\t";
            case "b" : return "\b";
            case "v" : return "\u000b";
            case "f" : return "\f";
            case "0" : return "\0";
            case "x" : return String.fromCharCode(this.hex_bytes(2));
            case "u" : return String.fromCharCode(this.hex_bytes(4));
            case "\n": return "";
            default  : return ch;
        }

    }

    readNumber(prefix) {

        var start = this.getCurrentIndex();
        var has_e = false, after_e = false, has_x = false, has_dot = prefix === ".";

        var num = this.readWhile(function(ch, i){
            if (ch === "x" || ch === "X") {
                if (has_x) return false;
                return has_x = true;
            }
            if (!has_x && (ch === "E" || ch === "e")) {
                if (has_e) return false;
                return has_e = after_e = true;
            }
            if (ch === "-") {
                return after_e || (i === 0 && !prefix);
            }
            if (ch === "+") return after_e;
            after_e = false;
            if (ch === ".") {
                if (!has_dot && !has_x && !has_e)
                    return has_dot = true;
                return false;
            }
            return JavaScriptTokenizer.isAlphanumeric(ch);
        });
        if (prefix)
            num = prefix + num;
        var valid = JavaScriptTokenizer.parseNumber(num);
        if (!isNaN(valid)) {
            return this.makeToken("number", start - (prefix ? prefix.length : 0));
        } else {
            throw new ParsingError(this.getLastToken(), ERROR_MESSAGES.INVALID_NUMBER);
        }

    }

    readName() {

        var backslash = false, name = "", ch, escaped = false, hex;
        while ((ch = this.peek()) !== null) {
            if (!backslash) {
                if (ch === "\\") {
                    escaped = backslash = true;
                    this.next();
                }
                else if (JavaScriptTokenizer.isIdentifierChar(ch)) name += this.next();
                else break;
            }
            else {
                if (ch !== "u") throw new ParsingError(this.getLastToken(), ERROR_MESSAGES.EXPECTED_UNICODE);
                ch = this.readEscapedChar();
                if (!JavaScriptTokenizer.isIdentifierChar(ch)) throw new ParsingError(this.getLastToken(), ERROR_MESSAGES.INVALID_IDENTIFIER_CHARACTER);
                name += ch;
                backslash = false;
            }
        }
        if (_.has(KEYWORDS, name) && escaped) {
            hex = name.charCodeAt(0).toString(16).toUpperCase();
            name = "\\u" + "0000".substr(hex.length) + hex + name.slice(1);
        }
        return name;

    }

    readWord() {

        var start = this.getCurrentIndex();
        var word = this.readName();

        // Select names last after checking for other types of tokens.
        return  this.makeToken(
            _.has(KEYWORDS_ATOM, word) ? "atom" :
            _.has(OPERATORS, word) ? "operator" :
            _.has(KEYWORDS, word) ? "keyword" :
            "name",
            start
        );

    }

    readLineComment() {

        var start = this.getCurrentIndex();

        // Read the two forward slashes.
        this.next();
        this.next();

        var i = this.find("\n");

        // If there is no new line, go to end of file.
        if (i === -1) {
            this.setCurrentIndex(this.getSource().length);
        }
        // Otherwise, go to next line.
        else {
            this.setCurrentIndex(i);
        }

        return this.makeToken("comment", start);

    }

    readMultipleLineComment() {

        var start = this.getCurrentIndex();

        // Read the forward slash and star.
        this.next();
        this.next();

        // Find the end of the comment.
        var i = this.find("*/");

        // If we didn't find it, bail.
        if(i < 0)
            throw new ParsingError(this.getLastToken(), ERROR_MESSAGES.UNTERMINATED_COMMENT);

        this.setCurrentIndex(i + 2);

        return this.makeToken("comment", start);

    }

    readOperator() {

        var start = this.getCurrentIndex();
        var self = this;

        function grow(op) {
            if (!self.peek()) return op;
            var bigger = op + self.peek();
            if (_.has(OPERATORS, bigger)) {
                self.next();
                return grow(bigger);
            } else {
                return op;
            }
        }

        grow(this.next());

        return this.makeToken("operator", start);

    }

    readSlash() {

        // Remember the status before the comment, so we can restore
        // it after reading the comment.
        var regexAllowedBefore = this.regexAllowed;

        // See if it's a comment.
        switch (this.peek(1)) {
            // If it's another slash, read a line comment.
            case "/":
                this.readLineComment();
                this.readWhitespace();
                this.regexAllowed = regexAllowedBefore;
                return;
            // If it's a star, read a multiline comment.
            case "*":
                this.readMultipleLineComment();
                this.readWhitespace();
                this.regexAllowed = regexAllowedBefore;
                return;
            // Otherwise...
            default:

                // If a regex is allowed, read a regex.
                if(this.regexAllowed)
                    this.readRegexp("");
                // Otherwise, read an operator.
                else
                    this.readOperator();

                return;

        }

    }

    readRegexp(regexp) {

        var start = this.getCurrentIndex();

        // Read slash.
        this.next();

        var prev_backslash = false, ch, in_class = false;
        while ((ch = this.next())) if (prev_backslash) {
            regexp += "\\" + ch;
            prev_backslash = false;
        } else if (ch === "[") {
            in_class = true;
            regexp += ch;
        } else if (ch === "]" && in_class) {
            in_class = false;
            regexp += ch;
        } else if (ch === "/" && !in_class) {
            break;
        } else if (ch === "\\") {
            prev_backslash = true;
        } else {
            regexp += ch;
        }
        this.readName();
        return this.makeToken("regexp", start);

    }

    readDot() {
        this.next();
        if(JavaScriptTokenizer.isDigit(this.peek())) {
            this.readNumber(".");
        }
        else {
            this.makeToken("punctuation", this.getCurrentIndex() - 1);
        }
    }

    readString() {

        var start = this.getCurrentIndex();
        var quote = this.next(), ret = "";
        for (;;) {
            var ch = this.next();
            if (ch === "\\") {
                var octal_len = 0, first = null;
                ch = this.readWhile(function(ch){
                    if (ch >= "0" && ch <= "7") {
                        if (!first) {
                            first = ch;
                            return ++octal_len;
                        }
                        else if (first <= "3" && octal_len <= 2) return ++octal_len;
                        else if (first >= "4" && octal_len <= 1) return ++octal_len;
                    }
                    return false;
                });
                if (octal_len > 0) ch = String.fromCharCode(parseInt(ch, 8));
                else ch = this.readEscapedChar();
            }
            else if (ch === quote) break;
            else if (ch === "\n") throw new ParsingError(this.getLastToken(), ERROR_MESSAGES.UNEXPECTED_END_OF_STRING);
            ret += ch;
        }
        return this.makeToken("string", start);

    }

    readWhitespace() {

        var start = this.getCurrentIndex();

        // Read whitespace.
        while (this.getCurrentIndex() < this.getSource().length && _.has(WHITESPACE_CHARS, this.peek())) {

            // If this is a newline, generate a newline token.
            if(this.peek() === "\n") {

                // If there was some whitespace, make a whitespace token out of the text that came before this
                // newline, then start the over. This way, we segment whitespace tokens at line boundaries,
                // which makes file rendering easier.
                if(start < this.getCurrentIndex()) {
                    this.makeToken("whitespace", start);
                }

                // Move past the newline.
                this.next();

                // Make a newline token.
                this.makeToken("whitespace", start);

                // Move the start of the next token to after the newline.
                start = this.getCurrentIndex();

            }
            else
                this.next();

        }

        // If we found a bunch of whitespace before the final chunk of whitespace, make a token out the leftovers.
        if(start < this.getCurrentIndex())
            this.makeToken("whitespace", start);

    }

}

export { JavaScriptTokenizer }