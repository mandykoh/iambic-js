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

		expect(eval('(' + parser.parse('The quick brown fox jumps over the lazy dog.').toString() + ')')).toEqual(
			{ type : 'Sentence', children : [
				'The ',
				{ type : 'DescribedThing', children : [
					{ type : 'Adjective', children : [ { type : 'Word', children : [ '', 'quick' ] } ] },
					{ type : 'Adjective', children : [ { type : 'Word', children : [ ' ', 'brown' ] } ] },
					{ type : 'Noun', children : [ { type : 'Word', children : [ ' ', 'fox' ] } ] }
				] },
				' jumps over the ',
				{ type : 'DescribedThing', children : [
					{ type : 'Adjective', children : [ { type : 'Word', children : [ '', 'lazy' ] } ] },
					{ type : 'Noun', children : [ { type : 'Word', children : [ ' ', 'dog' ] } ] }
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
});