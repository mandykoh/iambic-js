describe('Match', function () {

	it('should produce a non-error token without consuming input when its subexpression matches', function () {
		var ctx = new Iambic.ParseContext('apple'),
			expr = new Iambic.Match(new Iambic.LiteralPattern('apple'));
		
		ctx.beginParse();

		expect(expr.evaluate(ctx)).toEqual(new Iambic.Token());
		expect(ctx.offset).toEqual(0);
	});

	it('should produce an error token when its subexpression doesn\'t match', function () {
		var ctx = new Iambic.ParseContext('pear'),
			expr = new Iambic.Match(new Iambic.LiteralPattern('apple'));
		
		ctx.beginParse();

		expect(expr.evaluate(ctx).error).toBeTruthy();
	});

	it('should compile to itself', function () {
		var expr = new Iambic.Match(new Iambic.LiteralPattern('a'));

		expect(expr.compile()).toBe(expr);
	});

	it('should compile its subexpression when compiled', function () {
		var replacement = {},
			child = { 'compile': function () { return replacement; } },
			expr = new Iambic.Match(child),
			parser = {};

		spyOn(child, 'compile').andCallThrough();

		expr.compile(parser);

		expect(child.compile).toHaveBeenCalledWith(parser);
		expect(expr.expression).toBe(replacement);
	});

	it('should serialise to a standard grammar form', function () {
		var expr = new Iambic.Match(new Iambic.LiteralPattern('apple'));
		expect(expr.toString()).toEqual("&'apple'");
	});

	it('should delegate to its subexpression when checking for well-formedness', function () {
		var child = { 'checkWellFormed': function (b,p) { return 'childReturnValue'; } },
			expr = new Iambic.Match(child);

		spyOn(child, 'checkWellFormed').andCallThrough();

		expect(expr.checkWellFormed('baseProductionName', 'productionNames')).toEqual('childReturnValue');
		expect(child.checkWellFormed).toHaveBeenCalledWith('baseProductionName', 'productionNames');
	});
});