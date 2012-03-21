describe('OrderedChoice', function () {

	it('should produce a token with the matching text when one of its subexpressions matches', function () {
		var expr = new Iambic.OrderedChoice(
				new Iambic.LiteralPattern('a'),
				new Iambic.LiteralPattern('b'),
				new Iambic.LiteralPattern('c')
			),
			ctx = new Iambic.ParseContext('abcd');

		ctx.beginParse();

		expect(expr.evaluate(ctx)).toEqual(new Iambic.Token().adoptChild('a'));
		expect(ctx.offset).toEqual(1);
		expect(expr.evaluate(ctx)).toEqual(new Iambic.Token().adoptChild('b'));
		expect(ctx.offset).toEqual(2);
		expect(expr.evaluate(ctx)).toEqual(new Iambic.Token().adoptChild('c'));
		expect(ctx.offset).toEqual(3);
	});

	it('should produce an error token when all of its subexpressions fail to match', function () {
		var expr = new Iambic.OrderedChoice(
				new Iambic.LiteralPattern('a'),
				new Iambic.LiteralPattern('b'),
				new Iambic.LiteralPattern('c')
			),
			ctx = new Iambic.ParseContext('dabc');

		ctx.beginParse();

		expect(expr.evaluate(ctx).error).toBeTruthy();
		expect(ctx.offset).toEqual(0);
	});

	it('should compile to itself', function () {
		var expr = new Iambic.OrderedChoice();
		expect(expr.compile()).toBe(expr);
	});

	it('should compile its subexpressions when compiled', function () {
		var child1 = {},
			child2 = {},
			child3 = { 'compile': function () { return child1; } },
			child4 = { 'compile': function () { return child2; } },
			expr = new Iambic.OrderedChoice(child3, child4),
			parser = {};

		spyOn(child3, 'compile').andCallThrough();
		spyOn(child4, 'compile').andCallThrough();
		expr.compile(parser);

		expect(child3.compile).toHaveBeenCalledWith(parser);
		expect(child4.compile).toHaveBeenCalledWith(parser);
		expect(expr.expressions[0]).toBe(child1);
		expect(expr.expressions[1]).toBe(child2);
	});

	it('should serialise to a standard grammar form', function () {
		var expr = new Iambic.OrderedChoice(
			new Iambic.LiteralPattern('a'),
			new Iambic.LiteralPattern('b'),
			new Iambic.LiteralPattern('c')
		);
		expect(expr.toString()).toEqual("('a' || 'b' || 'c')");
	});

	describe('Grammar checking', function () {

		it('should return true to indicate optionality for well-formedness check when all subexpressions are optional', function () {
			var child1 = { 'checkWellFormed': function () { return true; } },
				child2 = { 'checkWellFormed': function () { return true; } },
				expr = new Iambic.OrderedChoice(child1, child2);

			expect(expr.checkWellFormed()).toBeTruthy();
		});

		it('should return false to indicate non-optionality for well-formedness check when a subexpression is not optional', function () {
			var child1 = { 'checkWellFormed': function () { return true; } },
				child2 = { 'checkWellFormed': function () { return false; } },
				expr = new Iambic.OrderedChoice(child1, child2);

			expect(expr.checkWellFormed()).toBeFalsy();
		});

		it('should add all production names registered by the subexpressions when checking well-formedness', function () {
			var child1 = { 'checkWellFormed': function (b, p) { p['A'] = true; return true; } },
				child2 = { 'checkWellFormed': function (b, p) { p['B'] = true; return false; } },
				expr = new Iambic.OrderedChoice(child1, child2),
				productionNames = {};

			expr.checkWellFormed('', productionNames);

			expect(productionNames['A']).toBeTruthy();
			expect(productionNames['B']).toBeTruthy();
		});

		it('should pass the original set of production names to subexpressions when checking well-formedness', function () {
			var child1 = { 'checkWellFormed': function (b, p) { p['B'] = true; return true; } },
				child2 = { 'checkWellFormed': function (b, p) { p['C'] = true; return true; } },
				expr = new Iambic.OrderedChoice(child1, child2),
				productionNames = { 'A': true };

			spyOn(child1, 'checkWellFormed').andCallThrough();
			spyOn(child2, 'checkWellFormed').andCallThrough();

			expr.checkWellFormed('BaseProductionName', productionNames);

			expect(child1.checkWellFormed).toHaveBeenCalledWith('BaseProductionName', { 'A': true, 'B': true });
			expect(child2.checkWellFormed).toHaveBeenCalledWith('BaseProductionName', { 'A': true, 'C': true });
		});
	});

	describe('Parse error recovery', function () {

		it('should continue from the point of failure', function () {
			var expr = new Iambic.OrderedChoice(
					new Iambic.LiteralPattern('a'),
					new Iambic.Sequence(new Iambic.LiteralPattern('b'), new Iambic.LiteralPattern('c'), new Iambic.LiteralPattern('d')),
					new Iambic.LiteralPattern('e')
				),
				ctx = new Iambic.ParseContext('bfd');

			expr.evaluate(ctx);

			expect(expr.evaluate(ctx)).toEqual(
				new Iambic.Token()
					.adoptChild('b')
					.adoptChild(new Iambic.Token().adoptChild('').setMissing())
					.adoptChild(new Iambic.Token().adoptChild('f').adoptChild('d').setLenient())
			);
		});
	});
});