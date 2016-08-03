Torus.classes.AFParser = function(text) {
	if(!(this instanceof Torus.classes.AFParser)) {throw new Error('Torus.classes.AFParser must be called with `new`.');}

	Torus.classes.AFLexer.call(this, text);

	this.vars = {};
}
Torus.classes.AFParser.prototype = Object.create(Torus.classes.AFLexer.prototype);
Torus.classes.AFParser.prototype.parse = function() {
	var filter = new Torus.classes.AFAST.Filter();
	try {
		for(var token = this.next_token(); token.type != 'end'; token = this.next_token()) {
			filter.statements.push(this.parse_expression(token));
			token = this.next_token();
			if(token.type == 'end') {break;}
			else {this.require_syntax(';', token);}
		}
	}
	catch(err) {return false;} //the only errors we should get are parse errors
	return filter;
}
Torus.classes.AFParser.pemdas = [
	{
		type: 'comparison',
		ast: Torus.classes.AFAST.Comparison,
		values: ['&', '|', '^'],
	},
	{
		type: 'comparison',
		ast: Torus.classes.AFAST.Comparison,
		values: ['>', '>=', '<', '<=', '==', '!='],
	},
	{
		type: 'identifier',
		ast: Torus.classes.AFAST.Comparison,
		values: ['in', 'contains', 'like', 'rlike', 'irlike'],
	},
	{
		type: 'math',
		ast: Torus.classes.AFAST.Math,
		values: ['+', '-'],
	},
	{
		type: 'math',
		ast: Torus.classes.AFAST.Math,
		values: ['*', '/', '%'],
	},
	{
		type: 'math',
		ast: Torus.classes.AFAST.Math,
		values: ['**'],
	},
];

Torus.classes.AFParser.reserved_error = function(parser, token) {
	parser.parse_error('syntax', 'Unexpected reserved word `' + token.value + '`.');
}
Torus.classes.AFParser.reserved_bool = function(parser, token) {
	var constant = new Torus.classes.AFAST.Constant(token);
	if(token.value == 'true') {constant.value = true;}
	else {constant.value = false;}
	return constant;
}
Torus.classes.AFParser.reserved_words = {
	'in': Torus.classes.AFParser.reserved_error,
	'contains': Torus.classes.AFParser.reserved_error,
	'like': Torus.classes.AFParser.reserved_error,
	'rlike': Torus.classes.AFParser.reserved_error,
	'irlike': Torus.classes.AFParser.reserved_error,

	'true': Torus.classes.AFParser.reserved_bool,
	'false': Torus.classes.AFParser.reserved_bool,
	'null': Torus.classes.AFParser.reserved_error,
};

Torus.classes.AFParser.prototype.parse_expression = function(token, depth) {
	if(!token) {token = this.next_token();}
	if(depth === undefined) {depth = 0;}

	if(depth == 0 && token.type == 'identifier') {
		var peek = this.next_token();
		this.unget(peek);
		if(peek.type == 'assign') {return this.parse_assignment(token);}
	}
	else if(depth >= Torus.classes.AFParser.pemdas.length) {return this.parse_atom(token);}

	var expr = this.parse_expression(token, depth + 1);
	for(token = this.next_token(); token.type == Torus.classes.AFParser.pemdas[depth].type && Torus.classes.AFParser.pemdas[depth].values.indexOf(token.value) != -1; token = this.next_token()) {
		var op = new Torus.classes.AFParser.pemdas[depth].ast(token);
		op.left = expr;
		op.right = this.parse_expression(this.next_token(), depth + 1);
		expr = op;
	}
	this.unget(token);
	return expr;
}
Torus.classes.AFParser.prototype.parse_atom = function(token) {
	if(!token) {token = this.next_token();}

	switch(token.type) {
		case 'identifier':
			if(Torus.classes.AFParser.reserved_words[token.value]) {return Torus.classes.AFParser.reserved_words[token.value](this, token);}
			else {
				if(Torus.classes.AFEvaluator.default_vars[token.value] === undefined && !this.vars[token.value]) {this.parse_error('reference', 'Variable `' + token.value + '` doesn\'t exist.');}
				var expr = new Torus.classes.AFAST.Variable(token);

				token = this.next_token();
				if(token.value == '(') {
					var swap = new Torus.classes.AFAST.Call(token);
					swap.operand = expr;

					for(token = this.next_token(); token.type != 'syntax' || token.value != ')'; token = this.next_token()) {
						swap.args.push(this.parse_expression(token));

						token = this.next_token();
						if(token.type == 'syntax') {
							if(token.value == ')') {break;}
							if(token.value == ',') {continue;}
						}
						this.require_syntax(')', token); //this just sets the error, it can't be true
					}
					expr = swap;
				}
				else {this.unget(token);}
				return expr;
			}

		case 'number':
		case 'string':
			return new Torus.classes.AFAST.Constant(token);

		case 'math':
			if(token.value == '!' || token.value == '+' || token.value == '-') {
				var op = new Torus.classes.AFAST.Unary(token);
				op.operand = this.parse_atom();
				return op;
			}
			else {this.parse_error('syntax', 'Can\'t figure out what this `' + token.value + '` is for.');}

		case 'syntax':
			if(token.value == '(') {
				var expr = this.parse_expression();
				this.require_syntax(')');
				return expr;
			}
			else {this.parse_error('syntax', 'Can\'t figure out what this `' + token.value + '` is for.');}

		case 'end':
			this.parse_error('syntax', 'Unexpected end of expression.');

		default:
			this.parse_error('syntax', 'Expected identifier, constant, or unary operator, but got `' + token.value + '`.');
	}
}
Torus.classes.AFParser.prototype.parse_assignment = function(token) {
	if(!token) {token = this.next_token();} //this should never happen because we need lookahead to get here

	var assign = new Torus.classes.AFAST.Assignment(token);
	token = this.next_token();
	if(token.type != 'assign' || token.value != ':=') {this.parse_error('syntax', 'Expected `:=`, found `' + token.value + '`.');}
	assign.expr = this.parse_expression();
	this.vars[assign.name] = true;
	return assign;
}

Torus.classes.AFParser.prototype.require_syntax = function(val, token) {
	if(!token) {token = this.next_token();}
	if(token.type == 'syntax' && token.value == val) {return true;}
	else {this.parse_error('syntax', 'Expected `' + val + '`, not `' + token.value + '`.');}
}
