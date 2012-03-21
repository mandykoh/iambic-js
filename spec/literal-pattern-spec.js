describe('LiteralPattern', function () {

	it('should produce a token with the matching text when the text begins with its value', function () {
		var ctx = new Iambic.ParseContext('appleton');
		ctx.beginParse();

		expect(new Iambic.LiteralPattern('apple').evaluate(ctx)).toEqual(new Iambic.Token().adoptChild('apple'));
		expect(new Iambic.LiteralPattern('ton').evaluate(ctx)).toEqual(new Iambic.Token().adoptChild('ton'));
	});

	it('should produce an error token for text which doesn\'t begin with its value', function () {
		var ctx = new Iambic.ParseContext('application'),
			expr = new Iambic.LiteralPattern('apple');

		ctx.beginParse();

		expect(expr.evaluate(ctx).error).toBeTruthy();
	});

	it('should produce a non-error token when compensating for a missing symbol', function () {
		var ctx = new Iambic.ParseContext('abc'),
			expr = new Iambic.LiteralPattern('d');

		ctx.beginParse();
		ctx.matchMode = Iambic.ParseContext.MATCH_MISSING;

		expect(expr.evaluate(ctx)).toEqual(new Iambic.Token().adoptChild('').setMissing());
	});

	it('should produce a token with the matching text even when the match is not at the current offset when matching leniently', function () {
		var ctx = new Iambic.ParseContext('abcdeeed'),
			expr = new Iambic.LiteralPattern('d');

		ctx.beginParse();
		ctx.matchMode = Iambic.ParseContext.MATCH_LENIENT;

		expect(expr.evaluate(ctx)).toEqual(new Iambic.Token().adoptChild('abc').adoptChild('d').setLenient());
		expect(ctx.offset).toEqual(4);

		ctx.matchMode = Iambic.ParseContext.MATCH_LENIENT;

		expect(expr.evaluate(ctx)).toEqual(new Iambic.Token().adoptChild('eee').adoptChild('d').setLenient());
		expect(ctx.offset).toEqual(8);
	});

	it('should produce an error token when no match is found while matching leniently', function () {
		var ctx = new Iambic.ParseContext('abc'),
			expr = new Iambic.LiteralPattern('d');

		ctx.beginParse();
		ctx.matchMode = Iambic.ParseContext.MATCH_LENIENT;

		expect(expr.evaluate(ctx).error).toBeTruthy();
		expect(ctx.offset).toEqual(0);
	});

	it('should compile to itself', function () {
		var expr = new Iambic.LiteralPattern('a');
		expect(expr.compile()).toBe(expr);
	});

	it('should serialise to a standard grammar form', function () {
		var expr = new Iambic.LiteralPattern('apple');
		expect(expr.toString()).toEqual("'apple'");
	});

	it('should return false for optionality when checking for well-formedness', function () {
		var expr = new Iambic.LiteralPattern('a');
		expect(expr.checkWellFormed()).toBeFalsy();
	});
});