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
			{
				type : 'Sentence',
				children : [
					'The ',
					{
						type : 'DescribedThing',
						children : [
							{ type : 'Noun', children : [ { type : 'Word', children : [ '', 'fox' ] } ] }
						]
					},
					' jumps over the ',
					{
						type : 'DescribedThing',
						children : [
							{ type : 'Noun', children : [ { type : 'Word', children : [ '', 'dog' ] } ] }
						]
					},
					'.'
				]
			}
		);

		expect(eval('(' + parser.parse('The quick brown fox jumps over the lazy dog.').toString() + ')')).toEqual(
			{
				type : 'Sentence',
				children : [
					'The ',
					{
						type : 'DescribedThing',
						children : [
							{ type : 'Adjective', children : [ { type : 'Word', children : [ '', 'quick' ] } ] },
							{ type : 'Adjective', children : [ { type : 'Word', children : [ ' ', 'brown' ] } ] },
							{ type : 'Noun', children : [ { type : 'Word', children : [ ' ', 'fox' ] } ] }
						]
					},
					' jumps over the ',
					{
						type : 'DescribedThing',
						children : [
							{ type : 'Adjective', children : [ { type : 'Word', children : [ '', 'lazy' ] } ] },
							{ type : 'Noun', children : [ { type : 'Word', children : [ ' ', 'dog' ] } ] }
						]
					},
					'.'
				]
			}
		);
	});
});