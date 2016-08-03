Torus.classes.AFEvaluator = function(ast) {
	if(!(this instanceof Torus.classes.AFEvaluator)) {throw new Error('Torus.classes.AFEvaluator must be called with `new`.');}

	this.vars = {};
	this.ast = ast;
}

Torus.classes.AFEvaluator.func_lcase = function(str) {return str.toLowerCase();}
Torus.classes.AFEvaluator.func_ucase = function(str) {return str.toUpperCase();}
Torus.classes.AFEvaluator.func_length = function(str) {return str.length;}

Torus.classes.AFEvaluator.func_specialratio = function(str) {
	var specials = 0;
	for(var i = 0; i < str.length; i++) {
		var c = str.charAt(i);
		var x = str.charCodeAt(i);
		if((x < 97 || x > 122) && (x < 65 || x > 90) && (x < 48 || x > 57) && c != ' ' && c != '\n' && c != '\t') {specials++;}
	}
	return specials / str.length;
}
Torus.classes.AFEvaluator.func_rmspecials = function(str) {
	var ret = '';
	for(var i = 0; i < str.length; i++) {
		var x = str.charCodeAt(i);
		if((x >= 97 && x <= 122) || (x >= 65 && x <= 90) || (x >= 48 && x <= 57)) {ret += str.charAt(i);}
	}
	return ret;
}
Torus.classes.AFEvaluator.func_rmdoubles = function(str) {
	var ret = '';
	var last = '';
	for(var i = 0; i < str.length; i++) {
		var c = str.charAt(i);
		if(c != last) {ret += c;}
		last = c;
	}
	return ret;
}
Torus.classes.AFEvaluator.func_rmwhitespace = function(str) {
	var ret = '';
	for(var i = 0; i < str.length; i++) {
		var c = str.charAt(i);
		if(c != ' ' && c != '\n' && c != '\t') {ret += c;}
	}
	return ret;
}

Torus.classes.AFEvaluator.func_count = function(needle, haystack) {
	var ret = 0;
	for(var i = haystack.indexOf(needle); i != -1; i = haystack.indexOf(needle, i + needle.length)) {ret++;}
	return ret;
}
//Torus.classes.AFEvaluator.func_rcount = function(regex, str) {}

Torus.classes.AFEvaluator.func_contains_any = function(haystack) {
	var needles = Array.prototype.slice.call(arguments, 1);
	for(var i = 0; i < needles.length; i++) {
		if(haystack.indexOf(needles[i]) != -1) {return true;}
	}
	return false;
}
Torus.classes.AFEvaluator.func_substr = function(str, start, end) {return str.substring(start, end);}
Torus.classes.AFEvaluator.func_strpos = function(str, find) {return str.indexOf(find);}
Torus.classes.AFEvaluator.func_str_replace = function(str, find, replace) {
	while(str.indexOf(find) != -1) {str = str.replace(find, replace);}
	return str;
}

Torus.classes.AFEvaluator.func_set = function(name, val) {this.vars[name] = val;}

Torus.classes.AFEvaluator.func_string = function(val) {return '' + val;}
Torus.classes.AFEvaluator.func_int = function(val) {return val * 1;}
Torus.classes.AFEvaluator.func_bool = function(val) {
	if(val) {return true;}
	else {return false;}
}

Torus.classes.AFEvaluator.func_url_encode = function(str) {return encodeURIComponent(str);}
Torus.classes.AFEvaluator.func_strip_unicode = function(str) {
	var ret = '';
	for(var i = 0; i < str.length; i++) {
		if(str.charCodeAt(i) < 128) {ret += str.charAt(i);}
	}
	return ret;
}
Torus.classes.AFEvaluator.func_vowel_ratio = function(str) {
	str = str.toLowerCase();
	var vowels = 0;
	var consonants = 0;
	for(var i = 0; i < str.length; i++) {
		var c = str.charAt(i);
		var x = str.charCodeAt(i);
		if(c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u') {vowels++;}
		else if(x >= 97 && x <= 122) {consonants++;} // c >= 'a' && c <= 'z'
	}
	return vowels / consonants;
}

Torus.classes.AFEvaluator.default_vars = {
	//vars
	'event': '',

	'message_text': '',
	'message_html': '',
	'message_ping': false,
	'message_time': 0,

	'user_name': '',
	'user_mod': false,
	'user_givemod': false,
	'user_staff': false,
	'user_edits': 0,
	'user_avatar': '',
	'user_status': 'here',
	'user_status_message': '',

	'room_name': '',
	'room_domain': '',
	'room_size': 0,
	'room_id': 0,

	//functions
	'lcase': Torus.classes.AFEvaluator.func_lcase,
	'ucase': Torus.classes.AFEvaluator.func_ucase,
	'length': Torus.classes.AFEvaluator.func_length,
	'strlen': Torus.classes.AFEvaluator.func_length,
	'substr': Torus.classes.AFEvaluator.func_substr,
	'strpos': Torus.classes.AFEvaluator.func_strpos,
	'str_replace': Torus.classes.AFEvaluator.func_str_replace,

	//'norm': Torus.classes.AFEvaluator.func_norm, //TODO:
	//'ccnorm': Torus.classes.AFEvaluator.func_ccnorm, //TODO:
	'specialratio': Torus.classes.AFEvaluator.func_specialratio,
	'rmspecials': Torus.classes.AFEvaluator.func_rmspecials,
	'rmdoubles': Torus.classes.AFEvaluator.func_rmdoubles,
	'rmwhitespace': Torus.classes.AFEvaluator.func_rmwhitespace,

	'count': Torus.classes.AFEvaluator.func_count,
	//'rcount': Torus.classes.AFEvaluator.func_rcount, //TODO:

	//'rescape': Torus.classes.AFEvaluator.func_rescape, //TODO:
	'contains_any': Torus.classes.AFEvaluator.func_contains_any,
	'set': Torus.classes.AFEvaluator.func_set,
	'set_var': Torus.classes.AFEvaluator.func_set,

	'string': Torus.classes.AFEvaluator.func_string,
	'int': Torus.classes.AFEvaluator.func_int,
	'bool': Torus.classes.AFEvaluator.func_bool,


	//stuff i added
	'url_encode': Torus.classes.AFEvaluator.func_url_encode,
	'strip_unicode': Torus.classes.AFEvaluator.func_strip_unicode,
	'vowel_ratio': Torus.classes.AFEvaluator.func_vowel_ratio,
};

Torus.classes.AFEvaluator.prototype.eval = function(vars) {
	this.vars = {};
	Torus.util.hardmerge(this.vars, Torus.classes.AFEvaluator.default_vars);
	if(vars) {Torus.util.hardmerge(this.vars, vars);}

	try {return this.ast.eval(this);}
	catch(err) {return undefined;}
}

Torus.classes.AFAST.Filter.prototype.eval = function(state) {
	var ret = false;
	for(var i = 0; i < this.statements.length; i++) {ret = this.statements[i].eval(state);}
	if(ret) {return true;}
	else {return false;}
}

Torus.classes.AFAST.Assignment.prototype.eval = function(state) {
	state.vars[this.name] = this.expr.eval(state);
	return state.vars[this.name];
}
Torus.classes.AFAST.Unary.prototype.eval = function(state) {
	var op = this.operand.eval(state);
	switch(this.operator) {
		case '!': return !op;
		case '+': return op;
		case '-': return -op;
		default: state.interp_error(this, 'syntax', 'Unknown unary operator `' + this.operator + '`.');
	}
}
Torus.classes.AFAST.Math.prototype.eval = function(state) {
	var left = this.left.eval(state);
	var right = this.right.eval(state);

	switch(this.operator) {
		case '+': return left + right;
		case '-': return left - right;
		case '*': return left * right;
		case '/': return left / right;
		case '%': return left % right;
		case '**': return Math.pow(left, right);
		default: state.interp_error(this, 'syntax', 'Unknown math operator `' + this.operator + '`.');
	}
}
Torus.classes.AFAST.Comparison.prototype.eval = function(state) {
	//short circuits first
	switch(this.operator) {
		case '&': return this.left.eval(state) && this.right.eval(state);
		case '|': return this.left.eval(state) || this.right.eval(state);
	}

	//everything else needs both anyway
	var left = this.left.eval(state);
	var right = this.right.eval(state);
	switch(this.operator) {
		case '>': return left > right;
		case '>=': return left >= right;
		case '<': return left < right;
		case '<=': return left <= right;
		case '==': return left == right;
		case '^':
			if(left && !right || !left && right) {return true;}
			else {return false;}
		case '!=': return left != right;
		case 'in': return right.indexOf(left) != -1;
		case 'like': //FIXME: this is supposed to support glob patterns (eg * and ? wildcards)
		case 'contains': return left.indexOf(right) != -1;
		case 'rlike': return Torus.util.parse_regex(right).test(left);
		case 'irlike': 
			var regex = Torus.util.parse_regex(right);
			regex.ignoreCase = true;
			return regex.text(left);
		default: state.interp_error(this, 'syntax', 'Unknown comparison operator `' + this.operator + '`.');
	}
}
Torus.classes.AFAST.Call.prototype.eval = function(state) {
	var func = this.operand.eval(state);
	var args = [];
	for(var i = 0; i < this.args.length; i++) {args.push(this.args[i].eval(state));}
	return func.apply(state, args);
}
Torus.classes.AFAST.Constant.prototype.eval = function(state) {return this.value;}
Torus.classes.AFAST.Variable.prototype.eval = function(state) {
	if(state.vars[this.name] === undefined) {state.interp_error(this, 'reference', 'Variable `' + this.name + '` is undefined.');}
	return state.vars[this.name];
}

Torus.classes.AFEvaluator.prototype.interp_error = function(node, error, message) {
	this.error = error;
	this.error_message = Torus.util.cap(error) + ' error on line ' + node.line + ': ' + message + '\n\n' + this.trace(node);
	throw new Error(this.error_message);
}
Torus.classes.AFEvaluator.prototype.trace = function(node) {
	var end = this.ast.full_text.indexOf('\n', node.line_start);
	if(end == -1) {end = this.ast.full_text.length;}
	var line = this.ast.full_text.substring(node.line_start, end);
	line += '\n';
	for(var i = 0; i < node.index - node.line_start - 1; i++) {
		if(line.charAt(i) == '\t') {line += '\t';}
		else {line += ' ';}
	}
	line += '^';
	return line;
}
