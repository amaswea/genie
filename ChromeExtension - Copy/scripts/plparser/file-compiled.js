"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.JavaScriptFile = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _pl = require("./pl");

var _tokenizer = require("./tokenizer");

var _parser = require("./parser");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * An object representing a JavaScript source file.
 */

var JavaScriptFile = function (_SourceFile) {
    _inherits(JavaScriptFile, _SourceFile);

    function JavaScriptFile(name, source) {
        _classCallCheck(this, JavaScriptFile);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(JavaScriptFile).call(this, "javascript", name, source));
    }

    _createClass(JavaScriptFile, [{
        key: "_createTokenizer",
        value: function _createTokenizer() {

            return new _tokenizer.JavaScriptTokenizer(this);
        }

        /**
         * @private
         * @param tokens A list of Token objects to parse.
         * @returns {Object} An abstract syntax tree or null if there is no tree.
         */

    }, {
        key: "_createParser",
        value: function _createParser(tokens) {

            // Exclude whitespace and comments that appear in the middle of a line, then parse.
            var parsableTokens = [];
            for (var i = 0; i < tokens.length; i++) {

                var token = tokens[i];
                var nextParsableTokens = _lodash2.default.filter(tokens.slice(i), function (token) {
                    return !token.isComment() && !token.isWhitespace();
                });
                var lastParsableToken = parsableTokens.length === 0 ? null : parsableTokens[parsableTokens.length - 1];
                var nextParsableToken = nextParsableTokens.length === 0 ? null : nextParsableTokens[0];

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
            return new _parser.JavaScriptParser(new _pl.Tokens(parsableTokens));
        }
    }]);

    return JavaScriptFile;
}(_pl.SourceFile);

exports.JavaScriptFile = JavaScriptFile;
