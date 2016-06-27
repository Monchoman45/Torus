Torus.classes.AFAST = {};
Torus.classes.AFAST.Node = function(token, type) {
	this.type = type;

	this.line = token.line;
	this.line_start = token.line_start;
	this.index = token.index;
}

Torus.classes.AFAST.Filter = function() {
	this.type = 'filter';
	this.statements = [];
}

Torus.classes.AFAST.Assignment = function(token) {
	Torus.classes.AFAST.Node.call(this, token, 'assignment');
	this.name = token.value;
	this.expr = false;
}
Torus.classes.AFAST.Assignment.prototype = Object.create(Torus.classes.AFAST.Node.prototype);

Torus.classes.AFAST.Unary = function(token) {
	Torus.classes.AFAST.Node.call(this, token, 'unary');
	this.operator = token.value;
	this.operand = false;
}
Torus.classes.AFAST.Unary.prototype = Object.create(Torus.classes.AFAST.Node.prototype);

Torus.classes.AFAST.Math = function(token) {
	Torus.classes.AFAST.Node.call(this, token, 'math');
	this.operator = token.value;
	this.left = false;
	this.right = false;
}
Torus.classes.AFAST.Math.prototype = Object.create(Torus.classes.AFAST.Node.prototype);

Torus.classes.AFAST.Comparison = function(token) {
	Torus.classes.AFAST.Node.call(this, token, 'comparison');
	this.operator = token.value;
	this.left = false;
	this.right = false;
}
Torus.classes.AFAST.Comparison.prototype = Object.create(Torus.classes.AFAST.Node.prototype);

Torus.classes.AFAST.Call = function(token) {
	Torus.classes.AFAST.Node.call(this, token, 'call');
	this.operand = false;
	this.args = [];
}
Torus.classes.AFAST.Call.prototype = Object.create(Torus.classes.AFAST.Node.prototype);

Torus.classes.AFAST.Constant = function(token) {
	Torus.classes.AFAST.Node.call(this, token, 'constant');
	this.value = token.value;
}
Torus.classes.AFAST.Constant.prototype = Object.create(Torus.classes.AFAST.Node.prototype);

Torus.classes.AFAST.Variable = function(token) {
	Torus.classes.AFAST.Node.call(this, token, 'variable');
	this.name = token.value;
}
Torus.classes.AFAST.Variable.prototype = Object.create(Torus.classes.AFAST.Node.prototype);
