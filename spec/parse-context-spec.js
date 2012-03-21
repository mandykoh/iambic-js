describe('ParseContext', function () {

	it('should produce a token with the matched text when text is accepted', function () {
		var ctx = new Iambic.ParseContext('dummy');

		ctx.beginParse();

		expect(ctx.accept(0)).toEqual((new Iambic.Token()).adoptChild(''));
		expect(ctx.accept(1)).toEqual((new Iambic.Token()).adoptChild('d'));
		expect(ctx.accept(2)).toEqual((new Iambic.Token()).adoptChild('um'));
	});

	it('should produce a token with the matched text when text is accepted with a skip offset', function () {
		var ctx = new Iambic.ParseContext('dummy');

		ctx.beginParse();

		expect(ctx.accept(0, 1)).toEqual((new Iambic.Token()).adoptChild('d').adoptChild(''));
		expect(ctx.accept(2, 1)).toEqual((new Iambic.Token()).adoptChild('u').adoptChild('mm'));
	});

	it('should produce an error token its state is rejected', function () {
		var ctx = new Iambic.ParseContext('dummy');

		ctx.beginParse();
		expect(ctx.reject().error).toBeTruthy();
	});

	it('should produce a token with the production recorded at the end of a parse', function () {
		var production = new Iambic.Production('A'),
			ctx = new Iambic.ParseContext('abc');

		ctx.beginParse(production);
		expect(ctx.endParse(true).production).toBe(production);

		ctx.beginParse(production);
		expect(ctx.endParse(false).production).toBe(production);
	});

	it('should produce a token with accepted children at the end of a parse', function () {
		var ctx = new Iambic.ParseContext('abc'),
			token;

		ctx.beginParse();
		ctx.acceptChild(ctx.accept(2));
		token = ctx.endParse(true);

		expect(token.children).toEqual([ 'ab' ]);
	});

	it('should produce a non-error token at the end of a parse when accepted without children', function () {
		var ctx = new Iambic.ParseContext('abc');

		ctx.beginParse();
		expect(ctx.endParse(true).error).toBeFalsy();
	});

	it('should produce an error token at the end of a parse when the parse is rejected', function () {
		var ctx = new Iambic.ParseContext('abc');

		ctx.beginParse();
		expect(ctx.endParse(false).error).toBeTruthy();
	});

	it('should advance its offset at the end of a parse when accepted and advanced', function () {
		var ctx = new Iambic.ParseContext('abc');

		ctx.beginParse();
		ctx.acceptChild(ctx.accept(1));
		ctx.endParse(true);
		expect(ctx.offset).toEqual(1);
	});

	it('should reset its offset at the end of a parse when rejected or accepted without children', function () {
		var ctx = new Iambic.ParseContext('abc');

		ctx.beginParse();
		ctx.accept(1);
		ctx.endParse(true);
		expect(ctx.offset).toEqual(0);

		ctx.beginParse();
		ctx.acceptChild(ctx.accept(1));
		ctx.endParse(false);
		expect(ctx.offset).toEqual(0);
	});

	it('should advance its offset when its state is accepted', function () {
		var ctx = new Iambic.ParseContext('dummy');

		ctx.beginParse();
		ctx.accept(0);
		expect(ctx.offset).toEqual(0);
		ctx.accept(1);
		expect(ctx.offset).toEqual(1);
		ctx.accept(2);
		expect(ctx.offset).toEqual(3);
	});

	it('should save its state when pushed and restore it when popped', function () {
		var ctx = new Iambic.ParseContext('dummy');

		ctx.beginParse();
		ctx.acceptChild(ctx.accept(1));
		ctx.beginParse();
		ctx.acceptChild(ctx.accept(2));
		ctx.beginParse();
		ctx.acceptChild(ctx.accept(1));

		expect(ctx.offset).toEqual(4);
		expect(ctx.parseResult.children).toEqual([ 'm' ]);
		ctx.endParse();
		expect(ctx.offset).toEqual(3);
		expect(ctx.parseResult.children).toEqual([ 'um' ]);
		ctx.endParse();
		expect(ctx.offset).toEqual(1);
		expect(ctx.parseResult.children).toEqual([ 'd' ]);
		ctx.endParse();
		expect(ctx.offset).toEqual(0);
		expect(ctx.parseResult).toBeNull();
	});

	it('should return null when beginning a parse', function () {
		var ctx = new Iambic.ParseContext('a');

		expect(ctx.beginParse()).toBeNull();
	});

	describe('Parse error recovery', function () {

		it('should save a copy of the state stack and mementos the first time a parse ends without being accepted', function () {
			var ctx = new Iambic.ParseContext('a'),
				memento = { 'value': 1 };

			ctx.beginParse();

			ctx.beginParse(null, memento);
			expect(ctx.errorStateStack).toBeUndefined();

			ctx.endParse(false);

			expect(ctx.errorStateStack[0]).not.toBe(ctx.stateStack[0]);

			memento.value = 2;

			expect(ctx.errorStateStack[1]).toEqual({ 'offset': 0, 'parseResult': new Iambic.Token(), 'memento': { 'value': 1 } });
		});

		it('should save a new copy of the state stack when a parse ends at a further offset without being accepted', function () {
			var ctx = new Iambic.ParseContext('a'),
				errorStateStack;

			ctx.beginParse();

			ctx.beginParse();
			ctx.endParse(false);

			errorStateStack = ctx.errorStateStack;

			ctx.beginParse();
			ctx.acceptChild(ctx.accept(1));
			ctx.endParse(true);
			ctx.beginParse();
			ctx.endParse(false);

			expect(ctx.errorStateStack).not.toBe(errorStateStack);
			expect(ctx.errorStateStack.length).toEqual(2);
			expect(ctx.errorStateStack[0]).toEqual({ 'offset': 0, 'parseResult': new Iambic.Token() });
			expect(ctx.errorStateStack[1]).toEqual({ 'offset': 1, 'parseResult': new Iambic.Token() });
		});

		it('should not save a new copy of the state stack when a parse ends without being accepted and without getting further', function () {
			var ctx = new Iambic.ParseContext('a'),
				errorStateStack;

			ctx.beginParse();

			ctx.beginParse();
			ctx.endParse(false);

			errorStateStack = ctx.errorStateStack;

			expect(errorStateStack).not.toBe(ctx.stateStack);

			ctx.beginParse();
			ctx.endParse(false);

			expect(ctx.errorStateStack).toBe(errorStateStack);
		});

		it('should begin error recovery when a parse ends without being accepted and with an empty stack', function () {
			var ctx = new Iambic.ParseContext('a');

			ctx.beginParse();

			expect(ctx.recoveryIndex).toBeNull();

			ctx.endParse(false);

			expect(ctx.recoveryIndex).toEqual(0);
		});

		it('should save a memento when a parse begins', function () {
			var ctx = new Iambic.ParseContext('a'),
				memento = { 'key': 'value' };

			ctx.beginParse(null, memento);

			expect(ctx.stateStack[0].memento).toBe(memento);
		});

		it('should restore state from the error state stack when a parse begins after error recovery starts', function () {
			var ctx = new Iambic.ParseContext('ab');

			ctx.beginParse();
			ctx.beginParse();
			ctx.acceptChild(ctx.accept(1));
			ctx.endParse(true);
			ctx.beginParse();
			ctx.acceptChild(ctx.accept(1));
			ctx.endParse(false);
			ctx.endParse(false);

			expect(ctx.offset).toEqual(0);
			expect(ctx.recoveryIndex).toEqual(0);

			ctx.beginParse();

			expect(ctx.offset).toEqual(0);
			expect(ctx.recoveryIndex).toEqual(1);

			ctx.beginParse();

			expect(ctx.offset).toEqual(1);
			expect(ctx.recoveryIndex).toBeNull();
			expect(ctx.parseResult).toEqual(new Iambic.Token().adoptChild('b'));
		});

		it('should return saved mementos from the error state stack when a parse begins after error recovery starts', function () {
			var ctx = new Iambic.ParseContext('a'),
				memento1 = { 'key1': 'value1' },
				memento2 = { 'key2': 'value2' },
				memento3,
				memento4;

			ctx.beginParse(null, memento1);
			ctx.beginParse();
			ctx.acceptChild(ctx.accept(1));
			ctx.endParse(true);
			ctx.beginParse(null, memento2);
			ctx.endParse(false);
			ctx.endParse(false);

			memento3 = ctx.beginParse(null, 'some other memento');
			memento4 = ctx.beginParse(null, 'some other memento');

			expect(memento3).not.toBe(memento1);
			expect(memento3).toEqual(memento1);
			expect(memento4).not.toBe(memento2);
			expect(memento4).toEqual(memento2);
		});

		it('should return undefined after error recovery starts when no memento was saved', function () {
			var ctx = new Iambic.ParseContext('a');

			ctx.beginParse();
			ctx.endParse(false);

			expect(ctx.beginParse()).toBeUndefined();
		});

		it('should indicate that missing matching is enabled when the error state stack is exhausted', function () {
			var ctx = new Iambic.ParseContext('a');

			ctx.beginParse();
			ctx.endParse(false);

			expect(ctx.matchMode).toEqual(Iambic.ParseContext.MATCH_EXACT);

			ctx.beginParse();

			expect(ctx.matchMode).toEqual(Iambic.ParseContext.MATCH_MISSING);
		});

		it('should indicate that lenient matching is enabled after missing matching is successful', function () {
			var ctx = new Iambic.ParseContext('a');

			ctx.beginParse();
			ctx.endParse(false);
			ctx.beginParse();

			expect(ctx.matchMode).toEqual(Iambic.ParseContext.MATCH_MISSING);

			ctx.accept(0);

			expect(ctx.matchMode).toEqual(Iambic.ParseContext.MATCH_LENIENT);
		});

		it('should indicate that exact matching is enabled when the second parse ends with success after lenient matching', function () {
			var ctx = new Iambic.ParseContext('a');

			ctx.beginParse();
			ctx.endParse(false);
			ctx.beginParse();
			ctx.accept(0);

			expect(ctx.matchMode).toEqual(Iambic.ParseContext.MATCH_LENIENT);

			ctx.accept(0);

			expect(ctx.matchMode).toEqual(Iambic.ParseContext.MATCH_EXACT);
		});
	});
});