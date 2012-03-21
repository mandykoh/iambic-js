describe('Compiler', function () {

	var standardGrammar =
		"Grammar := (Ignorable? Definition+ EndOfInput)\n" +
		"Definition := (Identifier ASSIGN Expression)\n" +
		"Primary := ((Identifier !ASSIGN) || (OPEN Expression CLOSE) || Literal)\n" +
		"Expression := (OrderedChoice || Sequence)\n" +
		"OrderedChoice := (Sequence (OR Sequence)+)\n" +
		"Sequence := Prefix+\n" +
		"Prefix := ((AND || NOT)? Suffix)\n" +
		"Suffix := (Primary (QUESTION || STAR || PLUS)?)\n" +
		"Identifier := (/\\w+/ Ignorable?)\n" +
		"Literal := (BasicLiteral || RegexLiteral)\n" +
		"BasicLiteral := (/'(\\\\\\\\|\\\\'|[^'])*'/ Ignorable?)\n" +
		"RegexLiteral := (/\\/(\\\\\\\\|\\\\\\/|[^\\/])*\\// Ignorable?)\n" +
		"ASSIGN := (':=' Ignorable?)\n" +
		"OR := ('||' Ignorable?)\n" +
		"AND := ('&' Ignorable?)\n" +
		"NOT := ('!' Ignorable?)\n" +
		"QUESTION := ('?' Ignorable?)\n" +
		"STAR := ('*' Ignorable?)\n" +
		"PLUS := ('+' Ignorable?)\n" +
		"OPEN := ('(' Ignorable?)\n" +
		"CLOSE := (')' Ignorable?)\n" +
		"Ignorable := (Spacing || LineComment || BlockComment)+\n" +
		"Spacing := /\\s+/\n" +
		"LineComment := ('//' (!EndOfLine /[\\s\\S]/)* EndOfLine)\n" +
		"BlockComment := ('/*' (!'*/' /[\\s\\S]/)* '*/')\n" +
		"EndOfLine := (/\\r?\\n/ || EndOfInput)\n" +
		"EndOfInput := /$/\n";


	describe('Standard grammar parser', function () {

		it('should serialise to the standard grammar', function () {
			var parser = Iambic.standardGrammarParser();
			expect(parser.toString()).toEqual(standardGrammar);
		});

		it('should compile the standard grammar', function () {
			var parser = Iambic.standardGrammarParser(),
				result = parser.parse(standardGrammar);

			expect(result.error).toBeFalsy();
		});
	});

	it('should create a parser which can parse the standard grammar', function () {
		var parser = Iambic.compileParser(standardGrammar);
		expect(function () { parser.parse(standardGrammar) }).not.toThrow();
	});

	it('should create a parser which parses a specified grammar', function () {
		var parser = Iambic.compileParser(
				"A := B C " +
				"B := 'b' " +
				"C := 'c'"
			);

		expect(parser.parse('bc').toString()).toEqual('{ "type": "A", "children": [ { "type": "B", "children": [ "b" ] }, { "type": "C", "children": [ "c" ] } ] }');
		expect(function () { parser.parse('d') }).toThrow();
	});

	it('should parse deeply recursive patterns without taking too long', function () {
		var parser = Iambic.compileParser(
				"A := B C D || B C || B " +
				"B := E F G || E F || E " +
				"C := 'c' " +
				"D := 'd' " +
				"E := 'e' A? " +
				"F := 'f' " +
				"G := 'g'"
			),
			startTime,
			endTime;

		startTime = new Date().getTime();
		parser.parse('eeeeee');
		endTime = new Date().getTime();

		expect(endTime - startTime).toBeLessThan(1000.0);
	});
});