describe('Parser', function () {

	it('should compile all productions upon creation', function () {
		var production1 = new Iambic.Production('A', new Iambic.LiteralPattern('a')),
			production2 = new Iambic.Production('B', new Iambic.LiteralPattern('b')),
			parser;

		spyOn(production1, 'compile').andCallThrough();
		spyOn(production2, 'compile').andCallThrough();

		parser = new Iambic.Parser(production1, production2);

		expect(production1.compile).toHaveBeenCalledWith(parser);
		expect(production2.compile).toHaveBeenCalledWith(parser);
	});

	it('should register productions by name', function () {
		var production1 = new Iambic.Production('A', new Iambic.LiteralPattern('a')),
			production2 = new Iambic.Production('B', new Iambic.LiteralPattern('b')),
			parser = new Iambic.Parser(production1, production2);

		expect(parser.productionsByName['A']).toBe(production1);
		expect(parser.productionsByName['B']).toBe(production2);
	});

	it('should throw an exception if a production is already registered to the same name', function () {
		var production1 = new Iambic.Production('A', new Iambic.LiteralPattern('a')),
			production2 = new Iambic.Production('A', new Iambic.LiteralPattern('b'));

		expect(function () { new Iambic.Parser(production1, production2) }).toThrow(new Error("Duplicate definition of 'A'"));
	});

	it('should produce a token using the root production', function () {
		var rootProduction = new Iambic.Production('A',
				new Iambic.Sequence(
					new Iambic.LiteralPattern('a'),
					new Iambic.LiteralPattern('b'),
					new Iambic.ProductionReference('C')
				)
			),
			childProduction = new Iambic.Production('C', new Iambic.LiteralPattern('c')),
			parser = new Iambic.Parser(rootProduction, childProduction),
			result = parser.parse('abc');

		expect(result).toEqual(
			new Iambic.Token(rootProduction).adoptChild('a').adoptChild('b').adoptChild(
				new Iambic.Token(childProduction).adoptChild('c')
		));
	});

	it('should serialise to a standard grammar form', function () {
		var production1 = new Iambic.Production('A', new Iambic.LiteralPattern('a')),
			production2 = new Iambic.Production('B', new Iambic.LiteralPattern('b')),
			parser = new Iambic.Parser(production1, production2);

		expect(parser.toString()).toEqual("A := 'a'\nB := 'b'\n");
	});

	it('should check productions for well-formedness', function () {
		var production1 = new Iambic.Production('A', new Iambic.LiteralPattern('a')),
			production2 = new Iambic.Production('B', new Iambic.LiteralPattern('b'));

		spyOn(production1, 'checkWellFormed').andCallThrough();
		spyOn(production2, 'checkWellFormed').andCallThrough();

		new Iambic.Parser(production1, production2);

		expect(production1.checkWellFormed).toHaveBeenCalled();
		expect(production2.checkWellFormed).toHaveBeenCalled();
	});

	describe('Syntax error handling', function () {

		it('should throw an exception if parsing fails', function () {
			var production = new Iambic.Production('A', new Iambic.LiteralPattern('a')),
				parser = new Iambic.Parser(production),
				actualError;

			try {
				parser.parse('b');

				fail(new Error('Expected exception was not thrown'));
			}
			catch (e) {
				expect(e.message).toEqual('Parse error');
				expect(e.bestParse.toString()).toEqual('{ "type": "A", "children": [ { "missing": true, "children": [ "" ] } ] }');
			}
		});

		it('should retry with error recovery then throw an exception', function () {
			var parser = new Iambic.Parser(
					new Iambic.Production('A',
						new Iambic.Sequence(
							new Iambic.ProductionReference('B'),
							new Iambic.ProductionReference('C')
						)
					),
					new Iambic.Production('B', new Iambic.LiteralPattern('b')),
					new Iambic.Production('C', new Iambic.LiteralPattern('c'))
				),
				actualError;

			try {
				parser.parse('dc');

				fail(new Error('Expected exception was not thrown'));
			}
			catch (e) {
				expect(e.message).toEqual('Parse error');
				expect(e.bestParse.toString()).toEqual('{ "type": "A", "children": [ { "type": "B", "children": [ { "missing": true, "children": [ "" ] } ] }, { "type": "C", "children": [ { "lenient": true, "children": [ "d", "c" ] } ] } ] }');
			}
		});

		it('should retry with error recovery until the error limit is reached then throw an exception', function () {
			var parser = new Iambic.Parser(
					new Iambic.Production('A',
						new Iambic.Sequence(
							new Iambic.ProductionReference('B'),
							new Iambic.ProductionReference('B'),
							new Iambic.ProductionReference('B'),
							new Iambic.ProductionReference('C')
						)
					),
					new Iambic.Production('B', new Iambic.LiteralPattern('b')),
					new Iambic.Production('C', new Iambic.LiteralPattern('c'))
				),
				actualError;

			try {
				parser.maxErrors = 2;
				parser.parse('dc');

				fail(new Error('Expected exception was not thrown'));
			}
			catch (e) {
				expect(e.message).toEqual('Parse error');
				expect(e.bestParse.toString()).toEqual('{ "type": "A", "error": true }');
			}
		});
	});
});