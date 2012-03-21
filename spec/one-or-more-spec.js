describe('OneOrMore', function () {

	it('should produce a token with a child for each time its subexpression matches', function () {
		var ctx = new Iambic.ParseContext('appapple'),
			expr = new Iambic.OneOrMore(new Iambic.LiteralPattern('app'));
		
		ctx.beginParse();

		expect(expr.evaluate(ctx)).toEqual(new Iambic.Token().adoptChild('app').adoptChild('app'));
	});

	it('should produce an error token when its subexpression doesn\'t match', function () {
		var ctx = new Iambic.ParseContext('snapple'),
			expr = new Iambic.OneOrMore(new Iambic.LiteralPattern('app'));

		ctx.beginParse();

		expect(expr.evaluate(ctx).error).toBeTruthy();
		expect(ctx.offset).toEqual(0);
	});

	it('should produce a non-empty token when its subexpression makes a zero length match', function () {
		var ctx = new Iambic.ParseContext('apple'),
			expr = new Iambic.OneOrMore(new Iambic.LiteralPattern(''));
		
		ctx.beginParse();

		expect(expr.evaluate(ctx)).toEqual(new Iambic.Token().adoptChild(''));
	});

	it('should compile to itself', function () {
		var expr = new Iambic.OneOrMore(new Iambic.LiteralPattern('a'));
		expect(expr.compile()).toBe(expr);
	});

	it('should compile its subexpression when compiled', function () {
		var replacement = {},
			child = { 'compile': function () { return replacement; } },
			expr = new Iambic.OneOrMore(child),
			parser = {};

		spyOn(child, 'compile').andCallThrough();

		expr.compile(parser);

		expect(child.compile).toHaveBeenCalledWith(parser);
		expect(expr.expression).toBe(replacement);
	});

	it('should serialise to a standard grammar form', function () {
		var expr = new Iambic.OneOrMore(new Iambic.LiteralPattern('apple'));
		expect(expr.toString()).toEqual("'apple'+");
	});

	it('should delegate to its subexpression when checking for well-formedness', function () {
		var child = { 'checkWellFormed': function (b,p) { return 'childReturnValue'; } },
			expr = new Iambic.OneOrMore(child);

		spyOn(child, 'checkWellFormed').andCallThrough();

		expect(expr.checkWellFormed('baseProductionName', 'productionNames')).toEqual('childReturnValue');
		expect(child.checkWellFormed).toHaveBeenCalledWith('baseProductionName', 'productionNames');
	});
});