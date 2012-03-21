describe('NotMatch', function () {

	it('should produce a token for text which doesn\'t match its subexpression', function () {
		var ctx = new Iambic.ParseContext('pear'),
			expr = new Iambic.NotMatch(new Iambic.LiteralPattern('apple'));

		ctx.beginParse();

		expect(expr.evaluate(ctx)).toEqual(new Iambic.Token());
	});

	it('should produce an error token without consuming input when its subexpression matches', function () {
		var ctx = new Iambic.ParseContext('apple'),
			expr = new Iambic.NotMatch(new Iambic.LiteralPattern('apple'));

		ctx.beginParse();

		expect(expr.evaluate(ctx).error).toBeTruthy();
		expect(ctx.offset).toEqual(0);
	});

	it('should compile to itself', function () {
		var expr = new Iambic.NotMatch(new Iambic.LiteralPattern('a'));

		expect(expr.compile()).toBe(expr);
	});

	it('should compile its subexpression when compiled', function () {
		var replacement = {},
			child = { 'compile': function () { return replacement; } },
			expr = new Iambic.NotMatch(child),
			parser = {};

		spyOn(child, 'compile').andCallThrough();

		expr.compile(parser);

		expect(child.compile).toHaveBeenCalledWith(parser);
		expect(expr.exprToNegate).toBe(replacement);
	});

	it('should serialise to a standard grammar form', function () {
		var expr = new Iambic.NotMatch(new Iambic.LiteralPattern('apple'));
		expect(expr.toString()).toEqual("!'apple'");
	});

	it('should delegate to its subexpression when checking for well-formedness', function () {
		var child = { 'checkWellFormed': function (b,p) { return 'childReturnValue'; } },
			expr = new Iambic.NotMatch(child);

		spyOn(child, 'checkWellFormed').andCallThrough();

		expect(expr.checkWellFormed('baseProductionName', 'productionNames')).toEqual('childReturnValue');
		expect(child.checkWellFormed).toHaveBeenCalledWith('baseProductionName', 'productionNames');
	});
});