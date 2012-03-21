describe('ZeroOrMore', function () {

	it('should produce a token for each time its subexpression matches', function () {
		var ctx = new Iambic.ParseContext('appapple'),
			expr = new Iambic.ZeroOrMore(new Iambic.LiteralPattern('app'));

		ctx.beginParse();

		expect(expr.evaluate(ctx)).toEqual(new Iambic.Token().adoptChild('app').adoptChild('app'));
	});

	it('should produce a non-error token without consuming input when its subexpression doesn\'t match', function () {
		var ctx = new Iambic.ParseContext('snapple'),
			expr = new Iambic.ZeroOrMore(new Iambic.LiteralPattern('app'));

		ctx.beginParse();

		expect(expr.evaluate(ctx)).toEqual(new Iambic.Token());
		expect(ctx.offset).toEqual(0);
	});

	it('should produce a non-error token when its subexpression makes a zero length match', function () {
		var ctx = new Iambic.ParseContext('apple'),
			expr = new Iambic.ZeroOrMore(new Iambic.LiteralPattern(''));

		ctx.beginParse();

		expect(expr.evaluate(ctx)).toEqual(new Iambic.Token());
	});

	it('should compile to itself', function () {
		var expr = new Iambic.ZeroOrMore(new Iambic.LiteralPattern('a'));
		expect(expr.compile()).toBe(expr);
	});

	it('should compile its subexpression when compiled', function () {
		var replacement = {},
			child = { 'compile': function () { return replacement; } },
			expr = new Iambic.ZeroOrMore(child),
			parser = {};

		spyOn(child, 'compile').andCallThrough();

		expr.compile(parser);

		expect(child.compile).toHaveBeenCalledWith(parser);
		expect(expr.expression).toBe(replacement);
	});

	it('should serialise to a standard grammar form', function () {
		var expr = new Iambic.ZeroOrMore(new Iambic.LiteralPattern('apple'));
		expect(expr.toString()).toEqual("'apple'*");
	});

	it('should invoke its subexpression when checking for well-formedness but always return true for optionality', function () {
		var child = { 'checkWellFormed': function (b,p) { return false; } },
			expr = new Iambic.ZeroOrMore(child);

		spyOn(child, 'checkWellFormed').andCallThrough();

		expect(expr.checkWellFormed('baseProductionName', 'productionNames')).toBeTruthy();
		expect(child.checkWellFormed).toHaveBeenCalledWith('baseProductionName', 'productionNames');
	});
});