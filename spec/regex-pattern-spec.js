describe('RegexPattern', function () {

	it('should produce a token for text which matches its regex', function () {
		var ctx = new Iambic.ParseContext('appleton');

		ctx.beginParse();

		expect(new Iambic.RegexPattern(/apple/).evaluate(ctx)).toEqual(new Iambic.Token().adoptChild('apple'));
		expect(new Iambic.RegexPattern(/ton/).evaluate(ctx)).toEqual(new Iambic.Token().adoptChild('ton'));
	});

	it('should reset the regexp after each match', function () {
		var ctx = new Iambic.ParseContext('aa'),
			expr = new Iambic.RegexPattern(/a/);

		ctx.beginParse();

		expr.evaluate(ctx);
		expect(ctx.offset).toEqual(1);
		expr.evaluate(ctx);
		expect(ctx.offset).toEqual(2);
	});

	it('should produce a token text which matches a regex specified as a string', function () {
		var ctx = new Iambic.ParseContext('appleton');

		ctx.beginParse();

		expect(new Iambic.RegexPattern('apple').evaluate(ctx)).toEqual(new Iambic.Token().adoptChild('apple'));
		expect(new Iambic.RegexPattern('ton').evaluate(ctx)).toEqual(new Iambic.Token().adoptChild('ton'));
	});

	it('should produce an error token for text which doesn\'t match its regex at the start of the string', function () {
		var ctx = new Iambic.ParseContext('application');

		ctx.beginParse();

		expect(new Iambic.RegexPattern(/apple/).evaluate(ctx).error).toBeTruthy();
		expect(new Iambic.RegexPattern(/cat/).evaluate(ctx).error).toBeTruthy();
	});

	it('should produce a non-error token when compensating for a missing symbol', function () {
		var ctx = new Iambic.ParseContext('abc'),
			expr = new Iambic.RegexPattern(/d/);

		ctx.beginParse();
		ctx.matchMode = Iambic.ParseContext.MATCH_MISSING;

		expect(expr.evaluate(ctx)).toEqual(new Iambic.Token().adoptChild('').setMissing());
	});

	it('should produce a token with the matching text even when the match is not at the current offset when matching leniently', function () {
		var ctx = new Iambic.ParseContext('abcdeeed'),
			expr = new Iambic.RegexPattern(/d/);

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
			expr = new Iambic.RegexPattern(/d/);

		ctx.beginParse();
		ctx.matchMode = Iambic.ParseContext.MATCH_LENIENT;

		expect(expr.evaluate(ctx).error).toBeTruthy();
		expect(ctx.offset).toEqual(0);
	});

	it('should compile to itself', function () {
		var expr = new Iambic.RegexPattern(/a/);
		expect(expr.compile()).toBe(expr);
	});

	it('should serialise to a standard grammar form', function () {
		expect(new Iambic.RegexPattern(/apple/).toString()).toEqual("/apple/");
		expect(new Iambic.RegexPattern(/ap\\ple/).toString()).toEqual("/ap\\\\ple/");
		expect(new Iambic.RegexPattern(/ap\/ple/).toString()).toEqual("/ap\\/ple/");
	});

	it('should return false for optionality when checking for well-formedness', function () {
		var expr = new Iambic.RegexPattern('a');
		expect(expr.checkWellFormed()).toBeFalsy();
	});
});