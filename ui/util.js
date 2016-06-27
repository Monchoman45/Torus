Torus.util.empty = function(el) {
	var frag = document.createDocumentFragment();
	while(el.firstChild) {frag.appendChild(el.firstChild);}
	return frag;
}

Torus.util.color_hash = function(str, hue, sat, val) {
	if(str === undefined) {throw new Error('Not enough parameters. (util.color_hash)');}
	str += '';
	if(!hue) {hue = 0;}
	if(!sat) {sat = .7;}
	if(!val) {val = .6;}
	for(var i = 0; i < str.length; i++) {hue = 31 * hue + str.charCodeAt(i);} //same hash algorithm as webchat, except this is case sensitive
	hue %= 360;

	//1 letter variables are fun don't you love mathematicians
	var c = val * sat;
	var m = val - c;
	var C = Math.floor((c + m) * 255).toString(16);
	var X = Math.floor((c * (1 - Math.abs((hue / 60) % 2 - 1)) + m) * 255).toString(16);
	var O = Math.floor(m * 255).toString(16);
	if(C.length == 1) {C = '0' + C;}
	if(X.length == 1) {X = '0' + X;}
	if(O.length == 1) {O = '0' + O;}
	switch(Math.floor(hue / 60)) {
		case 0: return '#' + C + X + O;
		case 1: return '#' + X + C + O;
		case 2: return '#' + O + C + X;
		case 3: return '#' + O + X + C;
		case 4: return '#' + X + O + C;
		case 5: return '#' + C + O + X;
	}
}

Torus.util.parse_regex = function(regex) {
	if(!regex) {return false;}

	if(regex.charAt(0) == '/') {
		var pattern = regex.substring(1, regex.lastIndexOf('/'));
		var mode = regex.substring(regex.lastIndexOf('/') + 1);
	}
	else {
		var pattern = regex;
		var mode = '';
	}
	try {return new RegExp(pattern, mode);}
	catch(err) {return false;}
}
