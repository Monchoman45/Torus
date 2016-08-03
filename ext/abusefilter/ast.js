Torus.classes.AFAST = {};
Torus.classes.AFAST.Node = function(token, type) {
	if(!(this instanceof Torus.classes.AFAST.Node)) {throw new Error('Torus.classes.AFAST.Node must be called with `new`.');}

	this.type = type;

	this.line = token.line;
	this.line_start = token.line_start;
	this.index = token.index;
}

Torus.classes.AFAST.Filter = function() {
	if(!(this instanceof Torus.classes.AFAST.Filter)) {throw new Error('Torus.classes.AFAST.Filter must be called with `new`.');}

	this.type = 'filter';
	this.full_text = '';
	this.statements = [];
}

Torus.classes.AFAST.Assignment = function(token) {
	if(!(this instanceof Torus.classes.AFAST.Assignment)) {throw new Error('Torus.classes.AFAST.Assignment must be called with `new`.');}

	Torus.classes.AFAST.Node.call(this, token, 'assignment');
	this.name = token.value;
	this.expr = false;
}
Torus.classes.AFAST.Assignment.prototype = Object.create(Torus.classes.AFAST.Node.prototype);

Torus.classes.AFAST.Unary = function(token) {
	if(!(this instanceof Torus.classes.AFAST.Unary)) {throw new Error('Torus.classes.AFAST.Unary must be called with `new`.');}

	Torus.classes.AFAST.Node.call(this, token, 'unary');
	this.operator = token.value;
	this.operand = false;
}
Torus.classes.AFAST.Unary.prototype = Object.create(Torus.classes.AFAST.Node.prototype);

Torus.classes.AFAST.Math = function(token) {
	if(!(this instanceof Torus.classes.AFAST.Math)) {throw new Error('Torus.classes.AFAST.Math must be called with `new`.');}

	Torus.classes.AFAST.Node.call(this, token, 'math');
	this.operator = token.value;
	this.left = false;
	this.right = false;
}
Torus.classes.AFAST.Math.prototype = Object.create(Torus.classes.AFAST.Node.prototype);

Torus.classes.AFAST.Comparison = function(token) {
	if(!(this instanceof Torus.classes.AFAST.Comparison)) {throw new Error('Torus.classes.AFAST.Comparison must be called with `new`.');}

	Torus.classes.AFAST.Node.call(this, token, 'comparison');
	this.operator = token.value;
	this.left = false;
	this.right = false;
}
Torus.classes.AFAST.Comparison.prototype = Object.create(Torus.classes.AFAST.Node.prototype);

Torus.classes.AFAST.Call = function(token) {
	if(!(this instanceof Torus.classes.AFAST.Call)) {throw new Error('Torus.classes.AFAST.Call must be called with `new`.');}

	Torus.classes.AFAST.Node.call(this, token, 'call');
	this.operand = false;
	this.args = [];
}
Torus.classes.AFAST.Call.prototype = Object.create(Torus.classes.AFAST.Node.prototype);

Torus.classes.AFAST.Constant = function(token) {
	if(!(this instanceof Torus.classes.AFAST.Constant)) {throw new Error('Torus.classes.AFAST.Constant must be called with `new`.');}

	Torus.classes.AFAST.Node.call(this, token, 'constant');
	this.value = token.value;
}
Torus.classes.AFAST.Constant.prototype = Object.create(Torus.classes.AFAST.Node.prototype);

Torus.classes.AFAST.Variable = function(token) {
	if(!(this instanceof Torus.classes.AFAST.Variable)) {throw new Error('Torus.classes.AFAST.Variable must be called with `new`.');}

	Torus.classes.AFAST.Node.call(this, token, 'variable');
	this.name = token.value;
}
Torus.classes.AFAST.Variable.prototype = Object.create(Torus.classes.AFAST.Node.prototype);
