describe('Token', function () {

	it('should record the production if specified', function () {
		var production = new Iambic.Production('A');
		expect(new Iambic.Token(production).production).toBe(production);
		expect(new Iambic.Token().production).toBeUndefined();
	});

	it('should record matched text when adopted as children', function () {
		var token = new Iambic.Token();

		token.adoptChild('a');
		token.adoptChild('b');

		expect(token.children).toEqual([ 'a', 'b' ]);
	});

	it('should record child tokens with productions', function () {
		var production = new Iambic.Production('A'),
			token = new Iambic.Token(),
			child1 = new Iambic.Token(production).adoptChild('a'),
			child2 = new Iambic.Token(production).adoptChild('b');

		token.adoptChild(child1).adoptChild(child2);

		expect(token.children).toEqual([ child1, child2 ]);
	});

	it('should record children of child tokens that do not have a production', function () {
		var token = new Iambic.Token(),
			child1 = new Iambic.Token().adoptChild('a'),
			child2 = new Iambic.Token().adoptChild('b');

		token.adoptChild(child1).adoptChild(child2);

		expect(token.children).toEqual([ 'a', 'b' ]);
	});

	it('should serialise to JSON', function () {
		var production1 = new Iambic.Production('A'),
			production2 = new Iambic.Production('B'),
			token = new Iambic.Token(production1).adoptChild('a').adoptChild(
				new Iambic.Token(production2).adoptChild('b'));

		expect(token.toString()).toEqual('{ "type": "A", "children": [ "a", { "type": "B", "children": [ "b" ] } ] }');
	});
});