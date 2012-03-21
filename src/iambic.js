var Iambic = {};

(function () {

	Iambic.LiteralPattern = function (valueToMatch) {
		this.valueToMatch = valueToMatch;
	};

	Iambic.LiteralPattern.prototype.checkWellFormed = function (baseProductionName, productionNames) {
		return false;
	};

	Iambic.LiteralPattern.prototype.compile = function (parser) {
		return this;
	};

	Iambic.LiteralPattern.prototype.evaluate = function (context) {
		var index;

		switch (context.matchMode) {

			case Iambic.ParseContext.MATCH_EXACT:
				if (context.text.substring(context.offset, context.offset + this.valueToMatch.length) === this.valueToMatch)
					return context.accept(this.valueToMatch.length);

				return context.reject();

			case Iambic.ParseContext.MATCH_MISSING:
				return context.accept(0);

			case Iambic.ParseContext.MATCH_LENIENT:
				index = context.text.indexOf(this.valueToMatch, context.offset);
				if (index !== -1)
					return context.accept(this.valueToMatch.length, index - context.offset);

				return context.reject();

			default:
				return context.reject();
		}
	};

	Iambic.LiteralPattern.prototype.toString = function () {
		return "'" + this.valueToMatch.replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
	};



	Iambic.Match = function (expression) {
		this.expression = expression;
	};

	Iambic.Match.prototype.checkWellFormed = function (baseProductionName, productionNames) {
		return this.expression.checkWellFormed(baseProductionName, productionNames);
	};

	Iambic.Match.prototype.compile = function (parser) {
		this.expression = this.expression.compile(parser);
		return this;
	};

	Iambic.Match.prototype.evaluate = function (context) {
		var result;

		context.beginParse();
		result = this.expression.evaluate(context);

		return context.endParse(!result.error);
	};

	Iambic.Match.prototype.toString = function () {
		return '&' + this.expression;
	};



	Iambic.NotMatch = function (exprToNegate) {
		this.exprToNegate = exprToNegate;
	};

	Iambic.NotMatch.prototype.checkWellFormed = function (baseProductionName, productionNames) {
		return this.exprToNegate.checkWellFormed(baseProductionName, productionNames);
	};

	Iambic.NotMatch.prototype.compile = function (parser) {
		this.exprToNegate = this.exprToNegate.compile(parser);
		return this;
	};

	Iambic.NotMatch.prototype.evaluate = function (context) {
		var result;

		context.beginParse();
		result = this.exprToNegate.evaluate(context);

		return context.endParse(result.error);
	};

	Iambic.NotMatch.prototype.toString = function () {
		return '!' + this.exprToNegate;
	};



	Iambic.OneOrMore = function (expression) {
		this.expression = expression;
	};

	Iambic.OneOrMore.prototype.checkWellFormed = function (baseProductionName, productionNames) {
		return this.expression.checkWellFormed(baseProductionName, productionNames);
	};

	Iambic.OneOrMore.prototype.compile = function (parser) {
		this.expression = this.expression.compile(parser);
		return this;
	};

	Iambic.OneOrMore.prototype.evaluate = function (context) {
		var result,
			offset;

		context.beginParse();

		result = this.expression.evaluate(context);
		if (result.error)
			return context.endParse(false);

		do {
			context.acceptChild(result);
			offset = context.offset;
			result = this.expression.evaluate(context);
		} while (!result.error && offset !== context.offset);

		return context.endParse(true);
	};

	Iambic.OneOrMore.prototype.toString = function () {
		return this.expression + '+';
	};



	Iambic.Optional = function (expression) {
		this.expression = expression;
	};

	Iambic.Optional.prototype.checkWellFormed = function (baseProductionName, productionNames) {
		this.expression.checkWellFormed(baseProductionName, productionNames);
		return true;
	};

	Iambic.Optional.prototype.compile = function (parser) {
		this.expression = this.expression.compile(parser);
		return this;
	};

	Iambic.Optional.prototype.evaluate = function (context) {
		var result = this.expression.evaluate(context);
		return result.error ? context.accept() : result;
	};

	Iambic.Optional.prototype.toString = function () {
		return this.expression + '?';
	};



	Iambic.OrderedChoice = function (expressions) {
		if (expressions instanceof Array)
			this.expressions = expressions;
		else
			this.expressions = Array.prototype.slice.call(arguments);
	};

	Iambic.OrderedChoice.prototype.checkWellFormed = function (baseProductionName, productionNames) {
		var optional = true,
			i,
			expression,
			newProductionNames = {},
			name;

		for (i = 0; i < this.expressions.length; ++i) {
			expression = this.expressions[i];

			// Create a clean set from the original production names for the subexpression
			exprProductionNames = {};
			for (name in productionNames)
				exprProductionNames[name] = true;

			if (!expression.checkWellFormed(baseProductionName, exprProductionNames))
				optional = false;

			// Collect all (potentially new) production names from the subexpression
			for (name in exprProductionNames)
				newProductionNames[name] = true;
		}

		// Add all collected production names to the original set
		for (name in newProductionNames)
			productionNames[name] = true;

		return optional;
	};

	Iambic.OrderedChoice.prototype.compile = function (parser) {
		var i;

		for (i = 0; i < this.expressions.length; ++i)
			this.expressions[i] = this.expressions[i].compile(parser);

		return this;
	};

	Iambic.OrderedChoice.prototype.evaluate = function (context) {
		var state = { 'i': 0 },
			errorState,
			result;

		errorState = context.beginParse(null, state);
		if (errorState)
			state = errorState;

		for (; state.i < this.expressions.length; ++state.i) {
			context.beginParse();

			result = this.expressions[state.i].evaluate(context);
			if (!result.error) {
				context.acceptChild(result);
				context.acceptChild(context.endParse(true));
				return context.endParse(true);
			}

			context.endParse(false);
		}

		return context.endParse(false);
	};

	Iambic.OrderedChoice.prototype.toString = function () {
		return '(' + this.expressions.join(' || ') + ')';
	};



	Iambic.ParseContext = function (text) {
		this.text = text;
		this.offset = 0;
		this.parseResult = null;
		this.stateStack = [];
		this.errorOffset = -1;
		this.errorStateStack;
		this.recoveryIndex = null;
		this.matchMode = Iambic.ParseContext.MATCH_EXACT;
		this.cachedResults = {};
	};

	Iambic.ParseContext.MATCH_EXACT = 0;
	Iambic.ParseContext.MATCH_MISSING = 1;
	Iambic.ParseContext.MATCH_LENIENT = 2;

	Iambic.ParseContext.prototype.accept = function (matchedLength, skipOffset) {
		var token = new Iambic.Token();

		if (typeof matchedLength !== 'undefined') {

			if (skipOffset) {
				token.adoptChild(this.text.substring(this.offset, this.offset + skipOffset));
				this.offset += skipOffset;
			}

			token.adoptChild(this.text.substring(this.offset, this.offset + matchedLength));
			this.offset += matchedLength;
		}

		// Switch to lenient matching for the next parse
		if (this.matchMode === Iambic.ParseContext.MATCH_MISSING) {
			this.matchMode = Iambic.ParseContext.MATCH_LENIENT;
			token.setMissing();
		}

		// Turn off lenient matching
		else if (this.matchMode === Iambic.ParseContext.MATCH_LENIENT) {
			this.matchMode = Iambic.ParseContext.MATCH_EXACT;
			token.setLenient();
		}

		return token;
	};

	Iambic.ParseContext.prototype.acceptChild = function (parseResult) {
		this.parseResult.adoptChild(parseResult);
	};

	Iambic.ParseContext.prototype.beginParse = function (production, memento) {
		var state;

		// Error recovery is active - restore states from the error stack
		if (this.recoveryIndex !== null) {
			state = this.errorStateStack[this.recoveryIndex];
			this.stateStack.push(state);
			this.offset = state.offset;
			this.parseResult = state.parseResult;

			// Turn off error recovery once we reach the top of the error stack
			// and switch to missing matching for the next parse.
			if (++this.recoveryIndex >= this.errorStateStack.length) {
				this.recoveryIndex = null;
				this.matchMode = Iambic.ParseContext.MATCH_MISSING;
			}

			return state.memento;
		}

		// Not in error recovery - create and push a fresh parse state
		else {
			this.parseResult = new Iambic.Token(production);

			this.stateStack.push({
				'offset': this.offset,
				'parseResult': this.parseResult,
				'memento': memento,
			});
		}

		return null;
	};

	Iambic.ParseContext.prototype.cacheResult = function (production, offset, parseResult) {
		var cachedEntries = this.cachedResults[production.name];

		if (!cachedEntries) {
			cachedEntries = {};
			this.cachedResults[production.name] = cachedEntries;
		}

		cachedEntries[offset] = {
			'endOffset': this.offset,
			'parseResult': parseResult,
		};
	};

	Iambic.ParseContext.prototype.clearCachedResults = function () {
		this.cachedResults = {};
	};

	Iambic.ParseContext.prototype.endParse = function (accept) {
		var state = this.stateStack.pop(),
			result = state.parseResult,
			i,
			memento,
			property;

		if (this.stateStack.length > 0)
			this.parseResult = this.stateStack[this.stateStack.length - 1].parseResult;
		else
			this.parseResult = null;

		if (accept) {
			if (!result.children)
				this.offset = state.offset;

			return result;
		}

		// Start error recovery if the stack is empty
		if (this.stateStack.length === 0)
			this.recoveryIndex = 0;

		// Record the state stack at the furthest error encountered
		if (this.offset > this.errorOffset) {
			this.errorOffset = this.offset;
			this.errorStateStack = this.stateStack.slice(0);
			this.errorStateStack.push(state);

			// Clone state entries and any mementos
			for (i = 0; i < this.errorStateStack.length; ++i) {
				this.errorStateStack[i] = {
					'offset': this.errorStateStack[i].offset,
					'parseResult': this.errorStateStack[i].parseResult,
					'memento': this.errorStateStack[i].memento,
				};

				if (this.errorStateStack[i].memento) {
					memento = {};
					for (property in this.errorStateStack[i].memento)
						memento[property] = this.errorStateStack[i].memento[property];
					this.errorStateStack[i].memento = memento;
				}
			}
		}

		this.offset = state.offset;

		return new Iambic.Token(result.production).setError();
	};

	Iambic.ParseContext.prototype.reject = function () {
		return new Iambic.Token().setError();
	};

	Iambic.ParseContext.prototype.useCachedResult = function (production) {
		var cachedEntries,
			entry;

		if (this.matchMode !== Iambic.ParseContext.MATCH_EXACT)
			return null;

		cachedEntries = this.cachedResults[production.name];
		if (!cachedEntries)
			return null;

		entry = cachedEntries[this.offset];
		if (!entry)
			return null;

		this.offset = entry.endOffset;
		return entry.parseResult;
	};



	Iambic.Parser = function (productions) {
		var i,
			production;

		if (productions instanceof Array)
			this.productions = productions;
		else
			this.productions = Array.prototype.slice.call(arguments);

		this.productionsByName = {};
		this.maxErrors = -1;

		for (i = 0; i < this.productions.length; ++i) {
			production = this.productions[i];

			if (this.productionsByName[production.name])
				throw new Error("Duplicate definition of '" + production.name + "'");

			this.productionsByName[production.name] = production;
		}

		for (i = 0; i < this.productions.length; ++i)
			this.productions[i].compile(this);

		for (i = 0; i < this.productions.length; ++i)
			this.productions[i].checkWellFormed();
	};

	Iambic.Parser.prototype.parse = function (text) {
		var context = new Iambic.ParseContext(text),
			result = this.productions[0].evaluate(context),
			parseError,
			errorCount = 0,
			errorOffset;

		if (result.error) {
			errorOffset = context.errorOffset - 1;

			while (result.error && (++errorCount <= this.maxErrors || this.maxErrors < 0) && context.errorOffset > errorOffset) {
				errorOffset = context.errorOffset;
				context.clearCachedResults();
				result = this.productions[0].evaluate(context);
			}

			parseError = new Error('Parse error');
			parseError.bestParse = result;
			throw parseError;
		}

		return result;
	};

	Iambic.Parser.prototype.toString = function () {
		var i,
			result = '';

		for (i = 0; i < this.productions.length; ++i) {
			result += this.productions[i].toString();
			result += '\n';
		}

		return result;
	};



	Iambic.Production = function (name, expression) {
		this.name = name;
		this.expression = expression;
	};

	Iambic.Production.prototype.checkWellFormed = function () {
		var productionNames = {};
		productionNames[this.name] = true;

		this.expression.checkWellFormed(this.name, productionNames);
	};

	Iambic.Production.prototype.compile = function (parser) {
		this.expression = this.expression.compile(parser);
		return this;
	};

	Iambic.Production.prototype.evaluate = function (context) {
		var resultOffset = context.offset,
			result;

		result = context.useCachedResult(this);

		if (!result) {
			context.beginParse(this);

			result = this.expression.evaluate(context);
			if (result.error)
				result = context.endParse(false);
			else {
				context.acceptChild(result);
				result = context.endParse(true);
			}

			context.cacheResult(this, resultOffset, result);
		}

		return result;
	};

	Iambic.Production.prototype.toString = function () {
		return this.name + ' := ' + this.expression;
	};



	Iambic.ProductionReference = function (productionName) {
		this.productionName = productionName;
	};

	Iambic.ProductionReference.prototype.checkWellFormed = function (baseProductionName, productionNames) {
		if (productionNames[this.productionName])
			throw new Error("'" + baseProductionName + "' circularly references '" + this.productionName + "'");

		return this.production.expression.checkWellFormed(baseProductionName, productionNames);
	};

	Iambic.ProductionReference.prototype.compile = function (parser) {
		var production = parser.productionsByName[this.productionName];
		if (!production)
			throw new Error("Unresolvable reference to '" + this.productionName + "'");

		this.production = production;
		return this;
	};

	Iambic.ProductionReference.prototype.evaluate = function (context) {
		return this.production.evaluate(context);
	};

	Iambic.ProductionReference.prototype.toString = function (context) {
		return this.productionName;
	}



	Iambic.RegexPattern = function (regexToMatch) {

		if (typeof regexToMatch === 'string') {
			this.regexToMatch = regexToMatch;
			this.lenientRegex = new RegExp(regexToMatch);
		}
		else {
			this.regexToMatch = regexToMatch.toString().slice(1, -1);
			this.lenientRegex = regexToMatch;
		}

		// Force the regex to anchor at the start of the input
		if (this.regexToMatch.charAt(0) !== '^')
			this.regexToMatch = '^' + this.regexToMatch;

		// Force global so we can use .lastIndex
		this.regexToMatch = new RegExp(this.regexToMatch, 'g');
	};

	Iambic.RegexPattern.prototype.checkWellFormed = function (baseProductionName, productionNames) {
		return false;
	};

	Iambic.RegexPattern.prototype.compile = function (parser) {
		return this;
	};

	Iambic.RegexPattern.prototype.evaluate = function (context) {
		var match;

		switch (context.matchMode) {

			case Iambic.ParseContext.MATCH_EXACT:
				this.regexToMatch.lastIndex = 0;

				if (this.regexToMatch.test(context.text.substring(context.offset)))
					return context.accept(this.regexToMatch.lastIndex);

				return context.reject();

			case Iambic.ParseContext.MATCH_MISSING:
				return context.accept(0);

			case Iambic.ParseContext.MATCH_LENIENT:
				match = this.lenientRegex.exec(context.text.substring(context.offset));
				if (match)
					return context.accept(match[0].length, match.index);

				return context.reject();

			default:
				return context.reject();
		}
	};

	Iambic.RegexPattern.prototype.toString = function () {
		return '/' + this.regexToMatch.toString().slice(2, -1);
	};



	Iambic.Sequence = function (expressions) {
		if (expressions instanceof Array)
			this.expressions = expressions;
		else
			this.expressions = Array.prototype.slice.call(arguments);
	};

	Iambic.Sequence.prototype.checkWellFormed = function (baseProductionName, productionNames) {
		var i,
			expression,
			exprProductionNames,
			name;

		for (i = 0; i < this.expressions.length; ++i) {
			expression = this.expressions[i];

			// Create a clean copy of the production names set for the expression
			exprProductionNames = {};
			for (name in productionNames)
				exprProductionNames[name] = true;

			if (!expression.checkWellFormed(baseProductionName, exprProductionNames)) {

				// Collect new production names from expression
				for (name in exprProductionNames)
					productionNames[name] = true;

				return false;
			}
		}

		return true;
	};

	Iambic.Sequence.prototype.compile = function (parser) {
		var i;

		for (i = 0; i < this.expressions.length; ++i)
			this.expressions[i] = this.expressions[i].compile(parser);

		return this;
	};

	Iambic.Sequence.prototype.evaluate = function (context) {
		var state = { 'i': 0, 'offset': context.offset },
			errorState,
			result;

		errorState = context.beginParse(null, state);
		if (errorState) {
			state = errorState;
			context.offset = state.offset;
		}

		for (; state.i < this.expressions.length; ++state.i) {
			state.offset = context.offset;

			result = this.expressions[state.i].evaluate(context);
			if (result.error)
				return context.endParse(false);

			context.acceptChild(result);
		}

		return context.endParse(true);
	};

	Iambic.Sequence.prototype.toString = function () {
		return '(' + this.expressions.join(' ') + ')';
	};



	Iambic.Token = function (production) {
		if (production) {
			this.production = production;
			this.type = this.production.name;
		}
	};

	Iambic.Token.prototype.adoptChild = function (tokenOrText) {
		if (!this.children)
			this.children = [];

		// Un-nest children if the token doesn't have a production
		if (tokenOrText.children && !(tokenOrText.production || tokenOrText.missing || tokenOrText.lenient))
			this.children = this.children.concat(tokenOrText.children);
		else if (typeof tokenOrText === 'string' || tokenOrText.children)
			this.children.push(tokenOrText);

		return this;
	};

	Iambic.Token.prototype.setError = function () {
		this.error = true;
		return this;
	};

	Iambic.Token.prototype.setLenient = function () {
		this.lenient = true;
		return this;
	};

	Iambic.Token.prototype.setMissing = function () {
		this.missing = true;
		return this;
	};

	Iambic.Token.prototype.toString = function () {
		var result = '{',
			comma = false,
			i,
			child;

		if (this.production) {
			result += ' "type": "' + this.type + '"';
			comma = true;
		}

		if (this.error) {
			result += (comma ? ',' : '') + ' "error": true';
			comma = true;
		}

		if (this.lenient) {
			result += (comma ? ',' : '') + ' "lenient": true';
			comma = true;
		}

		if (this.missing) {
			result += (comma ? ',' : '') + ' "missing": true';
			comma = true;
		}

		if (this.children) {
			if (comma)
				result += ',';

			result += ' "children": [';

			for (i = 0; i < this.children.length; ++i) {
				child = this.children[i];

				if (i > 0)
					result += ',';

				if (typeof child === 'string')
					result += ' "' + child + '"';
				else
					result += ' ' + child;
			}

			result += ' ]';
		}

		result += ' }';

		return result;
	};



	Iambic.ZeroOrMore = function (expression) {
		this.expression = expression;
	};

	Iambic.ZeroOrMore.prototype.checkWellFormed = function (baseProductionName, productionNames) {
		this.expression.checkWellFormed(baseProductionName, productionNames);
		return true;
	};

	Iambic.ZeroOrMore.prototype.compile = function (parser) {
		this.expression = this.expression.compile(parser);
		return this;
	};

	Iambic.ZeroOrMore.prototype.evaluate = function (context) {
		var result,
			offset;

		context.beginParse();

		while (true) {
			offset = context.offset;
			
			result = this.expression.evaluate(context);
			if (result.error || offset === context.offset)
				break;

			context.acceptChild(result);
		}

		return context.endParse(true);
	};

	Iambic.ZeroOrMore.prototype.toString = function () {
		return this.expression + '*';
	};



	(function () {

		function compileBasicLiteral(token) {
			var value = token.children[0];
			value = value.substring(1, value.length - 1);
			value = value.replace(/\\\\/g, '\\');
			value = value.replace(/\\'/g, "'");

			return new Iambic.LiteralPattern(value);
		};

		function compileDefinition(token) {
			var name,
				expression;

			name = token.children[0].children[0];
			expression = compileExpression(token.children[2]);

			return new Iambic.Production(name, expression);
		};

		function compileExpression(token) {
			if (token.children[0].type === 'OrderedChoice')
				return compileOrderedChoice(token.children[0]);

			return compileSequence(token.children[0]);
		};

		function compileGrammar(token) {
			var i,
				productions = [];

			for (i = 0; i < token.children.length; ++i) {
				if (token.children[i].type === 'Definition')
					productions.push(compileDefinition(token.children[i]));
			}

			return new Iambic.Parser(productions);
		};

		function compileLiteral(token) {
			if (token.children[0].type === 'BasicLiteral')
				return compileBasicLiteral(token.children[0]);

			return compileRegexLiteral(token.children[0]);
		};

		function compileOrderedChoice(token) {
			var i,
				expressions = [];

			for (i = 0; i < token.children.length; ++i) {
				if (token.children[i].type === 'Sequence')
					expressions.push(compileSequence(token.children[i]));
			}

			return new Iambic.OrderedChoice(expressions);
		};

		function compilePrefix(token) {
			var first = token.children[0];

			if (first.type === 'AND')
				return new Iambic.Match(compileSuffix(token.children[1]));
			else if (first.type === 'NOT')
				return new Iambic.NotMatch(compileSuffix(token.children[1]));

			return compileSuffix(first);
		};

		function compilePrimary(token) {
			var first = token.children[0];

			if (first.type === 'Identifier')
				return new Iambic.ProductionReference(first.children[0]);
			else if (first.type === 'OPEN')
				return compileExpression(token.children[1]);

			return compileLiteral(first);
		};

		function compileRegexLiteral(token) {
			var value = token.children[0];
			value = value.substring(1, value.length - 1);

			return new Iambic.RegexPattern(value);
		};

		function compileSequence(token) {
			var i,
				prefixes = [];

			for (i = 0; i < token.children.length; ++i)
				prefixes.push(compilePrefix(token.children[i]));

			return new Iambic.Sequence(prefixes);
		};

		function compileSuffix(token) {
			var primary = compilePrimary(token.children[0]),
				op = token.children[1];

			if (op) {
				if (op.type === 'QUESTION')
					return new Iambic.Optional(primary);
				else if (op.type === 'STAR')
					return new Iambic.ZeroOrMore(primary);

				return new Iambic.OneOrMore(primary);
			}

			return primary;
		};

		Iambic.compileParser = function (grammar) {
			var standardParser = Iambic.standardGrammarParser(),
				grammarTree = standardParser.parse(grammar);

			return compileGrammar(grammarTree);
		};
	})();


	Iambic.standardGrammarParser = function () {

		return new Iambic.Parser(
			new Iambic.Production('Grammar',
				new Iambic.Sequence(
					new Iambic.Optional(new Iambic.ProductionReference('Ignorable')),
					new Iambic.OneOrMore(new Iambic.ProductionReference('Definition')),
					new Iambic.ProductionReference('EndOfInput')
				)
			),

			new Iambic.Production('Definition',
				new Iambic.Sequence(
					new Iambic.ProductionReference('Identifier'),
					new Iambic.ProductionReference('ASSIGN'),
					new Iambic.ProductionReference('Expression')
				)
			),

			new Iambic.Production('Primary',
				new Iambic.OrderedChoice(
					new Iambic.Sequence(
						new Iambic.ProductionReference('Identifier'),
						new Iambic.NotMatch(new Iambic.ProductionReference('ASSIGN'))
					),
					new Iambic.Sequence(
						new Iambic.ProductionReference('OPEN'),
						new Iambic.ProductionReference('Expression'),
						new Iambic.ProductionReference('CLOSE')
					),
					new Iambic.ProductionReference('Literal')
				)
			),

			new Iambic.Production('Expression',
				new Iambic.OrderedChoice(
					new Iambic.ProductionReference('OrderedChoice'),
					new Iambic.ProductionReference('Sequence')
				)
			),

			new Iambic.Production('OrderedChoice',
				new Iambic.Sequence(
					new Iambic.ProductionReference('Sequence'),
					new Iambic.OneOrMore(
						new Iambic.Sequence(
							new Iambic.ProductionReference('OR'),
							new Iambic.ProductionReference('Sequence')
						)
					)
				)
			),

			new Iambic.Production('Sequence',
				new Iambic.OneOrMore(new Iambic.ProductionReference('Prefix'))
			),

			new Iambic.Production('Prefix',
				new Iambic.Sequence(
					new Iambic.Optional(
						new Iambic.OrderedChoice(
							new Iambic.ProductionReference('AND'),
							new Iambic.ProductionReference('NOT')
						)
					),
					new Iambic.ProductionReference('Suffix')
				)
			),

			new Iambic.Production('Suffix',
				new Iambic.Sequence(
					new Iambic.ProductionReference('Primary'),
					new Iambic.Optional(
						new Iambic.OrderedChoice(
							new Iambic.ProductionReference('QUESTION'),
							new Iambic.ProductionReference('STAR'),
							new Iambic.ProductionReference('PLUS')
						)
					)
				)
			),

			new Iambic.Production('Identifier',
				new Iambic.Sequence(
					new Iambic.RegexPattern(/\w+/),
					new Iambic.Optional(new Iambic.ProductionReference('Ignorable'))
				)
			),

			new Iambic.Production('Literal',
				new Iambic.OrderedChoice(
					new Iambic.ProductionReference('BasicLiteral'),
					new Iambic.ProductionReference('RegexLiteral')
				)
			),

			new Iambic.Production('BasicLiteral',
				new Iambic.Sequence(
					new Iambic.RegexPattern(/'(\\\\|\\'|[^'])*'/),
					new Iambic.Optional(new Iambic.ProductionReference('Ignorable'))
				)
			),

			new Iambic.Production('RegexLiteral',
				new Iambic.Sequence(
					new Iambic.RegexPattern(/\/(\\\\|\\\/|[^\/])*\//),
					new Iambic.Optional(new Iambic.ProductionReference('Ignorable'))
				)
			),

			new Iambic.Production('ASSIGN',
				new Iambic.Sequence(
					new Iambic.LiteralPattern(':='),
					new Iambic.Optional(new Iambic.ProductionReference('Ignorable'))
				)
			),

			new Iambic.Production('OR',
				new Iambic.Sequence(
					new Iambic.LiteralPattern('||'),
					new Iambic.Optional(new Iambic.ProductionReference('Ignorable'))
				)
			),

			new Iambic.Production('AND',
				new Iambic.Sequence(
					new Iambic.LiteralPattern('&'),
					new Iambic.Optional(new Iambic.ProductionReference('Ignorable'))
				)
			),

			new Iambic.Production('NOT',
				new Iambic.Sequence(
					new Iambic.LiteralPattern('!'),
					new Iambic.Optional(new Iambic.ProductionReference('Ignorable'))
				)
			),

			new Iambic.Production('QUESTION',
				new Iambic.Sequence(
					new Iambic.LiteralPattern('?'),
					new Iambic.Optional(new Iambic.ProductionReference('Ignorable'))
				)
			),

			new Iambic.Production('STAR',
				new Iambic.Sequence(
					new Iambic.LiteralPattern('*'),
					new Iambic.Optional(new Iambic.ProductionReference('Ignorable'))
				)
			),

			new Iambic.Production('PLUS',
				new Iambic.Sequence(
					new Iambic.LiteralPattern('+'),
					new Iambic.Optional(new Iambic.ProductionReference('Ignorable'))
				)
			),

			new Iambic.Production('OPEN',
				new Iambic.Sequence(
					new Iambic.LiteralPattern('('),
					new Iambic.Optional(new Iambic.ProductionReference('Ignorable'))
				)
			),

			new Iambic.Production('CLOSE',
				new Iambic.Sequence(
					new Iambic.LiteralPattern(')'),
					new Iambic.Optional(new Iambic.ProductionReference('Ignorable'))
				)
			),

			new Iambic.Production('Ignorable',
				new Iambic.OneOrMore(
					new Iambic.OrderedChoice(
						new Iambic.ProductionReference('Spacing'),
						new Iambic.ProductionReference('LineComment'),
						new Iambic.ProductionReference('BlockComment')
					)
				)
			),

			new Iambic.Production('Spacing', new Iambic.RegexPattern(/\s+/)),

			new Iambic.Production('LineComment',
				new Iambic.Sequence(
					new Iambic.LiteralPattern('//'),
					new Iambic.ZeroOrMore(
						new Iambic.Sequence(
							new Iambic.NotMatch(new Iambic.ProductionReference('EndOfLine')),
							new Iambic.RegexPattern(/[\s\S]/)
						)
					),
					new Iambic.ProductionReference('EndOfLine')
				)
			),

			new Iambic.Production('BlockComment',
				new Iambic.Sequence(
					new Iambic.LiteralPattern('/*'),
					new Iambic.ZeroOrMore(
						new Iambic.Sequence(
							new Iambic.NotMatch(new Iambic.LiteralPattern('*/')),
							new Iambic.RegexPattern(/[\s\S]/)
						)
					),
					new Iambic.LiteralPattern('*/')
				)
			),

			new Iambic.Production('EndOfLine',
				new Iambic.OrderedChoice(
					new Iambic.RegexPattern(/\r?\n/),
					new Iambic.ProductionReference('EndOfInput')
				)
			),

			new Iambic.Production('EndOfInput', new Iambic.RegexPattern(/$/))
		);
	};

})();