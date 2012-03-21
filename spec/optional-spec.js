describe('Optional', function () {

	it('should produce a token with the matched text when its subexpression matches', function () {
		var ctx = new Iambic.ParseContext('apple'),
			expr = new Iambic.Optional(new Iambic.LiteralPattern('apple'));

		ctx.beginParse();

		expect(expr.evaluate(ctx)).toEqual(new Iambic.Token().adoptChild('apple'));
	});

	it('should produce an empty token without consuming input when its subexpression doesn\'t match', function () {
		var ctx = new Iambic.ParseContext('pear'),
			expr = new Iambic.Optional(new Iambic.LiteralPattern('apple'));

		ctx.beginParse();

		expect(expr.evaluate(ctx)).toEqual(new Iambic.Token());
		expect(ctx.offset).toEqual(0);
	});

	it('should compile to itself', function () {
		var expr = new Iambic.Optional(new Iambic.LiteralPattern('a'));
		expect(expr.compile()).toBe(expr);
	});

	it('should compile its subexpression when compiled', function () {
		var replacement = {},
			child = { 'compile': function () { return replacement; } },
			expr = new Iambic.Optional(child),
			parser = {};

		spyOn(child, 'compile').andCallThrough();

		expr.compile(parser);

		expect(child.compile).toHaveBeenCalledWith(parser);
		expect(expr.expression).toBe(replacement);
	});

	it('should serialise to a standard grammar form', function () {
		var expr = new Iambic.Optional(new Iambic.LiteralPattern('apple'));
		expect(expr.toString()).toEqual("'apple'?");
	});

	it('should invoke its subexpression when checking for well-formedness but always return true for optionality', function () {
		var child = { 'checkWellFormed': function (b,p) { return false; } },
			expr = new Iambic.Optional(child);

		spyOn(child, 'checkWellFormed').andCallThrough();

		expect(expr.checkWellFormed('baseProductionName', 'productionNames')).toBeTruthy();
		expect(child.checkWellFormed).toHaveBeenCalledWith('baseProductionName', 'productionNames');
	});
});