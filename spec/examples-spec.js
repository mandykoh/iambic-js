describe('Parsing examples', function () {

	it('should support the Quick Brown Fox example', function () {
		var parser = Iambic.compileParser(
				"Sentence := 'The ' DescribedThing ' jumps over the ' DescribedThing '.' " +
				"DescribedThing := Adjective* Noun " +
				"Adjective := Word !(' jumps' || '.') " +
				"Noun := Word &(' jumps' || '.') " +
				"Word := /\\s*/ /[^\\s.]+/"
			);

		expect(eval('(' + parser.parse('The fox jumps over the dog.').toString() + ')')).toEqual(
			{ type : 'Sentence', children : [
				'The ',
				{ type : 'DescribedThing', children : [
					{ type : 'Noun', children : [ { type : 'Word', children : [ '', 'fox' ] } ] }
				] },
				' jumps over the ',
				{ type : 'DescribedThing', children : [
					{ type : 'Noun', children : [ { type : 'Word', children : [ '', 'dog' ] } ] }
				] },
				'.'
			] }
		);

		expect(eval('(' + parser.parse('The quick brown duck jumps over the lazy oyster.').toString() + ')')).toEqual(
			{ type : 'Sentence', children : [
				'The ',
				{ type : 'DescribedThing', children : [
					{ type : 'Adjective', children : [ { type : 'Word', children : [ '', 'quick' ] } ] },
					{ type : 'Adjective', children : [ { type : 'Word', children : [ ' ', 'brown' ] } ] },
					{ type : 'Noun', children : [ { type : 'Word', children : [ ' ', 'duck' ] } ] }
				] },
				' jumps over the ',
				{ type : 'DescribedThing', children : [
					{ type : 'Adjective', children : [ { type : 'Word', children : [ '', 'lazy' ] } ] },
					{ type : 'Noun', children : [ { type : 'Word', children : [ ' ', 'oyster' ] } ] }
				] },
				'.'
			] }
		);
	});

	it('should support the arithmetic expressions example', function () {
		var parser = Iambic.compileParser(
				"Expression := Sum " +
				"Sum := Product (('+' || '-') Product)* " +
				"Product := Value (('*' || '/') Value)* " +
				"Value := /[0-9]+/ || '(' Expression ')'"
			);

		expect(eval('(' + parser.parse('3+5').toString() + ')')).toEqual(
			{ type : 'Expression', children : [
				{ type : 'Sum', children : [
					{ type : 'Product', children : [ { type : 'Value', children : [ '3' ] } ] },
					'+',
					{ type : 'Product', children : [ { type : 'Value', children : [ '5' ] } ] }
				] }
			] }
		);

		expect(eval('(' + parser.parse('4-2*2').toString() + ')')).toEqual(
			{ type : 'Expression', children : [
				{ type : 'Sum', children : [
					{ type : 'Product', children : [ { type : 'Value', children : [ '4' ] } ] },
					'-',
					{ type : 'Product', children : [
						{ type : 'Value', children : [ '2' ] },
						'*',
						{ type : 'Value', children : [ '2' ] }
					] }
				] }
			] }
		);

		expect(eval('(' + parser.parse('3/(1+1)').toString() + ')')).toEqual(
			{ type : 'Expression', children : [
				{ type : 'Sum', children : [
					{ type : 'Product', children : [
						{ type : 'Value', children : [ '3' ] },
						'/',
						{ type : 'Value', children : [
							'(',
							{ type : 'Expression', children : [
								{ type : 'Sum', children : [
									{ type : 'Product', children : [ { type : 'Value', children : [ '1' ] } ] },
									'+',
									{ type : 'Product', children : [ { type : 'Value', children : [ '1' ] } ] }
								] }
							] },
							')'
						] }
					] }
				] }
			] }
		);
	});

	it('should support the error handling example', function () {
		var parser = Iambic.compileParser(
				"A := B C " +
				"B := 'b' " +
				"C := 'c'"
			),
			that = this;

		try {
			parser.parse('dc');

			that.fail(new Error('Expected exception was not thrown'));
		}
		catch (e) {
			expect(eval('(' + e.bestParse.toString() + ')')).toEqual(
				{ type: 'A', children: [
					{ type: 'B', children: [ { missing: true, children: [ '' ] } ] },
					{ type: 'C', children: [ { lenient: true, children: [ 'd', 'c' ] } ] }
				] }
			);
		}
	});
});