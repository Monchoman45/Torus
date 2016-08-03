Torus.classes.AFToken = function(line, line_start, index) {
	if(!(this instanceof Torus.classes.AFToken)) {throw new Error('Torus.classes.AFToken must be called with `new`.');}

	if(!line) {line = 1;}
	if(!line_start) {line_start = 0;}
	if(!index) {index = 0;}

	this.type = 'end';
	this.value = '<end of input>';

	this.line = line;
	this.line_start = line_start;
	this.index = index;
}

Torus.classes.AFLexer = function(text) {
	if(!(this instanceof Torus.classes.AFLexer)) {throw new Error('Torus.classes.AFLexer must be called with `new`.');}

	this.line = 1;
	this.line_start = 0;
	this.index = 0;
	this.text = text;
	this.ungot = new Torus.classes.AFToken();
	this.error = false;
	this.error_message = '';
}
Torus.classes.AFLexer.prototype.next_token = function() {
	if(this.error) {return new Torus.classes.AFToken();}

	if(this.ungot.type != 'end') { //hopefully if you unget an end token, you got an end token in the first place anyway
		var token = this.ungot;
		this.ungot = new Torus.classes.AFToken();
		return token;
	}


	for(var p = this.peek(); this.index < this.text.length; p = this.peek()) {
		if(p == ' ' || p == '\t') {
			this.get();
			continue;
		}
		else if(p == '\n' || p == '\r') {
			this.get();
			this.line++;
			this.line_start = this.index;
			continue;
		}
		else {break;}
	}

	var c = this.peek();
	var x = this.getCode();

	if(this.index > this.text.length) {return new Torus.classes.AFToken();}

	var token = new Torus.classes.AFToken(this.line, this.line_start, this.index);

	if((x >= 97 && x <= 122) || (x >= 65 && x <= 90) || x == 95) { //(c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_'
		token.type = 'identifier';
		var start = this.index - 1;
		for(x = this.getCode(); (x >= 97 && x <= 122) || (x >= 65 && x <= 90) || (x >= 48 && x <= 57) || x == 95; x = this.getCode()) {}
		this.index--;
		token.value = this.text.substring(start, this.index);
		return token;
	}
	else if(x == 46 || (x >= 48 && x <= 57)) { // c == '.' || (c >= '0' && c <= '9')
		token.type = 'number';

		var start = this.index - 1;
		for(x = this.getCode(); x >= 48 && x <= 57; x = this.getCode()) {}
		if(x == 46) { //this specifically makes sure there is only one .
			for(x = this.getCode(); x >= 48 && x <= 57; x = this.getCode()) {}
		}
		this.index--;
		token.value = this.text.substring(start, this.index) * 1;
		return token;
	}
	switch(c) {
		//Strings
		case '\'':
		case '"':
			token.type = 'string';
			token.value = '';

			var start_i = this.index;
			var delim = c;
			for(c = this.get(); c != delim && c != '\n' && c != '\r' && this.index < this.text.length; c = this.get()) {
				if(c == '\\') {
					c = this.get();
					switch(c) {
						case 'n':
							token.value += '\n';
							break;
						case 'r':
							token.value += '\r';
							break;
						case 't':
							token.value += '\t';
							break;
						default:
							token.value += c;
							break;
					}
				}
				else {token.value += c;}
			}
			if(c == '\n' || c == '\r' || (this.index >= this.text.length && c != delim)) {
				this.index = start_i; //set this back so the error points to the starting quote mark
				this.parse_error('syntax', 'This string runs off the end of the line.');
			}
			return token;

		//Math operators
		case '+':
		case '-':
		case '/':
		case '%':
			token.type = 'math';
			token.value = c;
			return token;
		case '*':
			if(this.peek() == '*') {
				this.get();
				token.type = 'math';
				token.value = '**';
				return token;
			}
			else {
				token.type = 'math';
				token.value = '*';
				return token;
			}

		//Assignment
		case ':':
			if(this.peek() == '=') {
				this.get();
				token.type = 'assign';
				token.value = ':=';
				return token;
			}
			else {this.parse_error('syntax', 'Can\'t figure out what this `:` is for.');}

		//Boolean operators
		case '!':
			if(this.peek() == '=') {
				this.get();
				token.type = 'comparison';
				token.value = '!=';
				return token;
			}
			else {
				token.type = 'math'; //because this is unary
				token.value = '!';
				return token;
			}
		case '=':
			if(this.peek() == '=') {
				this.get();
				token.type = 'comparison';
				token.value = '==';
				return token;
			}
			else {this.parse_error('syntax', 'Can\'t figure out what this `=` is for.');}
		case '<':
		case '>':
			token.type = 'comparison';
			token.value = c;
			if(this.peek() == '=') {
				this.get();
				token.value += '=';
			}
			return token;
		case '|':
		case '&':
		case '^':
			token.type = 'comparison';
			token.value = c;
			return token;

		//Syntax
		case '(':
		case ')':
		case ',':
		case ';':
			token.type = 'syntax';
			token.value = c;
			return token;
	}

	//Error
	this.parse_error('syntax', 'Can\'t figure out what this `' + c + '` is for.');
}

Torus.classes.AFLexer.prototype.get = function() {
	var ret = this.text.charAt(this.index);
	this.index++;
	return ret;
}
Torus.classes.AFLexer.prototype.getCode = function() {
	var ret = this.text.charCodeAt(this.index);
	this.index++;
	return ret;
}
Torus.classes.AFLexer.prototype.peek = function() {return this.text.charAt(this.index);}
Torus.classes.AFLexer.prototype.peekCode = function() {return this.text.charCodeAt(this.index);}
Torus.classes.AFLexer.prototype.unget = function(token) {this.ungot = token;}
Torus.classes.AFLexer.prototype.parse_error = function(error, message) {
	this.error = error;
	this.error_message = Torus.util.cap(error) + ' error on line ' + this.line + ': ' + message + '\n\n' + this.trace();
	throw new Error(this.error_message);
}
Torus.classes.AFLexer.prototype.trace = function() {
	var end = this.text.indexOf('\n', this.line_start);
	if(end == -1) {end = this.text.length;}
	var line = this.text.substring(this.line_start, end);
	line += '\n';
	for(var i = 0; i < this.index - this.line_start - 1; i++) {
		if(line.charAt(i) == '\t') {line += '\t';}
		else {line += ' ';}
	}
	line += '^';
	return line;
}
