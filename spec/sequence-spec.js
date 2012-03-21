describe('Sequence', function () {

	it('should accept text when all its subexpressions match in sequence', function () {
		var expr = new Iambic.Sequence(
				new Iambic.LiteralPattern('a'),
				new Iambic.LiteralPattern('b'),
				new Iambic.LiteralPattern('c')
			),
			ctx = new Iambic.ParseContext('abcd'),
			token = new Iambic.Token().adoptChild('a').adoptChild('b').adoptChild('c');

		ctx.beginParse();

		expect(expr.evaluate(ctx)).toEqual(token);
		expect(ctx.offset).toEqual(3);
	});

	it('should reject text when one of its subexpressions fail to match in sequence', function () {
		var expr = new Iambic.Sequence(
				new Iambic.LiteralPattern('a'),
				new Iambic.LiteralPattern('b'),
				new Iambic.LiteralPattern('c')
			),
			ctx = new Iambic.ParseContext('adc');

		ctx.beginParse();

		expect(expr.evaluate(ctx).error).toBeTruthy();
		expect(ctx.offset).toEqual(0);
	});

	it('should compile to itself', function () {
		var expr = new Iambic.Sequence();
		expect(expr.compile()).toBe(expr);
	});

	it('should compile its subexpressions when compiled', function () {
		var child1 = {},
			child2 = {},
			child3 = { 'compile': function () { return child1; } },
			child4 = { 'compile': function () { return child2; } },
			expr = new Iambic.Sequence(child3, child4),
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
		var expr = new Iambic.Sequence(
			new Iambic.LiteralPattern('a'),
			new Iambic.LiteralPattern('b'),
			new Iambic.LiteralPattern('c')
		);
		expect(expr.toString()).toEqual("('a' 'b' 'c')");
	});

	describe('Grammar checking', function () {

		it('should return true to indicate optionality for well-formedness check when all subexpressions are optional', function () {
			var child1 = { 'checkWellFormed': function () { return true; } },
				child2 = { 'checkWellFormed': function () { return true; } },
				expr = new Iambic.Sequence(child1, child2);

			expect(expr.checkWellFormed()).toBeTruthy();
		});

		it('should return false to indicate non-optionality for well-formedness check when a subexpression is not optional', function () {
			var child1 = { 'checkWellFormed': function () { return true; } },
				child2 = { 'checkWellFormed': function () { return false; } },
				expr = new Iambic.Sequence(child1, child2);

			expect(expr.checkWellFormed()).toBeFalsy();
		});

		it('should add all production names registered by the first non-optional subexpression when checking well-formedness', function () {
			var child1 = { 'checkWellFormed': function (b, p) { p['A'] = true; return true; } },
				child2 = { 'checkWellFormed': function (b, p) { p['B'] = true; return false; } },
				child3 = { 'checkWellFormed': function (b, p) { p['C'] = true; return false; } },
				expr = new Iambic.Sequence(child1, child2),
				productionNames = {};

			expr.checkWellFormed('', productionNames);

			expect(productionNames['A']).toBeFalsy();
			expect(productionNames['B']).toBeTruthy();
			expect(productionNames['C']).toBeFalsy();
		});
	});

	describe('Parse error recovery', function () {

		it('should continue from the point of failure', function () {
			var expr = new Iambic.Sequence(
					new Iambic.LiteralPattern('a'),
					new Iambic.LiteralPattern('b'),
					new Iambic.LiteralPattern('c')
				),
				ctx = new Iambic.ParseContext('adc');

			expr.evaluate(ctx);

			expect(expr.evaluate(ctx)).toEqual(
				new Iambic.Token()
					.adoptChild('a')
					.adoptChild(new Iambic.Token().adoptChild('').setMissing())
					.adoptChild(new Iambic.Token().adoptChild('d').adoptChild('c').setLenient())
				);
		});
	});
});