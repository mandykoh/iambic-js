describe('Production', function () {

	it('should produce a token which remembers the production', function () {
		var ctx = new Iambic.ParseContext('abc'),
			production = new Iambic.Production('A', new Iambic.LiteralPattern('a')),
			result;

		ctx.beginParse();
		result = production.evaluate(ctx);

		expect(result.production).toEqual(production);
	});

	it('should produce a token when its subexpression matches', function () {
		var ctx = new Iambic.ParseContext('abc'),
			production = new Iambic.Production('A', new Iambic.LiteralPattern('a'));

		ctx.beginParse();

		expect(production.evaluate(ctx)).toEqual(new Iambic.Token(production).adoptChild('a'));
	});

	it('should produce an error token when its subexpression doesn\'t match', function () {
		var ctx = new Iambic.ParseContext('bcd'),
			production = new Iambic.Production('A', new Iambic.LiteralPattern('a'));

		ctx.beginParse();

		expect(production.evaluate(ctx).error).toBeTruthy();
	});

	it('should compile to itself', function () {
		var production = new Iambic.Production('A', new Iambic.LiteralPattern('a')),
			parser = { 'productions': {} };

		expect(production.compile(parser)).toBe(production);
	});

	it('should compile its subexpression when compiled', function () {
		var replacement = {},
			expression = { 'compile': function () { return replacement; }},
			production = new Iambic.Production('A', expression),
			parser = { 'productions': {} };

		spyOn(expression, 'compile').andCallThrough();

		production.compile(parser);

		expect(expression.compile).toHaveBeenCalledWith(parser);
		expect(production.expression).toBe(replacement);
	});

	it('should serialise to a standard grammar form', function () {
		var production = new Iambic.Production('A', new Iambic.LiteralPattern('a'));

		expect(production.toString()).toEqual("A := 'a'");
	});

	it('should invoke its subexpression to check for well-formedness', function () {
		var child = { 'checkWellFormed': function (b,p) { return 'childReturnValue'; } },
			production = new Iambic.Production('A', child);

		spyOn(child, 'checkWellFormed').andCallThrough();

		production.checkWellFormed();

		expect(child.checkWellFormed).toHaveBeenCalledWith('A', { 'A': true });
	});
});