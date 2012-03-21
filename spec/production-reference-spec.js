describe('ProductionReference', function () {

	it('should compile to itself and resolve the named production', function () {
		var production = new Iambic.Production('A', new Iambic.LiteralPattern('a')),
			parser = new Iambic.Parser(production),
			expr = new Iambic.ProductionReference('A');

		expect(expr.compile(parser)).toBe(expr);
		expect(expr.production).toBe(production);
	});

	it('should evaluate to the named production', function () {
		var result = {},
			production = { 'evaluate': function () { return result; } },
			parser = { 'productionsByName': { 'A': production }},
			ctx = {},
			expr = new Iambic.ProductionReference('A');

		spyOn(production, 'evaluate').andCallThrough();

		expr.compile(parser);

		expect(expr.evaluate(ctx)).toBe(result);
		expect(production.evaluate).toHaveBeenCalledWith(ctx);
	});

	it('should throw an exception when compiled if the referenced production can\'t be found', function () {
		var production = new Iambic.Production('A', new Iambic.LiteralPattern('a')),
			parser = new Iambic.Parser(production),
			expr = new Iambic.ProductionReference('B');

		expect(function () { expr.compile(parser) }).toThrow(new Error("Unresolvable reference to 'B'"));
	});

	it('should serialise to a standard grammar form', function () {
		var expr = new Iambic.ProductionReference('A');

		expect(expr.toString()).toEqual("A");
	});

	it('should delegate to the referenced production\'s subexpression when checking for well-formedness', function () {
		var child = { 'checkWellFormed': function (b,p) { return 'childReturnValue'; } },
			childProduction = { 'expression': child },
			expr = new Iambic.ProductionReference('Child');

		spyOn(child, 'checkWellFormed').andCallThrough();

		expr.compile({ 'productionsByName': { 'Child': childProduction } });

		expect(expr.checkWellFormed('baseProductionName', 'productionNames')).toEqual('childReturnValue');
		expect(child.checkWellFormed).toHaveBeenCalledWith('baseProductionName', 'productionNames');
	});

	it('should throw an exception when checking for well-formedness if the referenced production is already in the production set', function () {
		var expr = new Iambic.ProductionReference('A');

		expect(function () { expr.checkWellFormed('Base', { 'A': true }) }).toThrow(new Error("'Base' circularly references 'A'"));
	});
});