Torus.util = {};

Torus.util.debug = function() {console.log.apply(console, arguments);}
Torus.util.null = function() {}

Torus.util.compare_strings = function(str1, str2) {
	for(var i = 0; i < str1.length && i < str2.length; i++) {
		if(str1.charAt(i) == str2.charAt(i)) {continue;}
		else {return str1.charCodeAt(i) - str2.charCodeAt(i);}
	}
	return str1.length - str2.length;
}

Torus.util.cap = function(str) {return str.charAt(0).toUpperCase() + str.substring(1);}

Torus.util.softmerge = function(dest, source, prefix) {
	if(!prefix) {prefix = '';}

	for(var i in source) {
		if(!dest[prefix + i]) {dest[prefix + i] = source[i];}
	}
}
Torus.util.hardmerge = function(dest, source, prefix) {
	if(!prefix) {prefix = '';}

	for(var i in source) {dest[prefix + i] = source[i];}
}

Torus.util.timestamp = function(time, timezone) {
	if(!timezone) {timezone = 0;}
	var date = new Date();
	if(time) {date.setTime(time);}
	date.setUTCHours(date.getUTCHours() + timezone);
	var hours = date.getUTCHours();
	if(hours < 10) {hours = '0' + hours;}
	var minutes = date.getUTCMinutes();
	if(minutes < 10) {minutes = '0' + minutes;}
	var seconds = date.getUTCSeconds();
	if(seconds < 10) {seconds = '0' + seconds;}
	return hours + ':' + minutes + ':' + seconds;
}

Torus.util.expiry_to_seconds = function(expiry) {
	if(!expiry) {throw new Error('Not enough parameters. (util.expiry_to_seconds)');}
	expiry = expiry.trim();
	if(expiry == 'infinite' || expiry == 'indefinite') {return 60 * 60 * 24 * 365 * 1000;} //the server recognizes 1000 years as infinite
	if(expiry == 'unban' || expiry == 'undo') {return 0;}

	var ret = 0;
	var split = expiry.split(',');
	for(var i = 0; i < split.length; i++) {
		var ex = split[i].trim();
		var quant = ex.substring(0, ex.indexOf(' '));
		var unit = ex.substring(ex.indexOf(' ') + 1);

		if(quant == 'a' || quant == 'an') {quant = 1;}
		else if(isNaN(quant * 1)) {return false;}
		if(unit.charAt(unit.length - 1) == 's') {unit = unit.substring(0, unit.length - 1);}

		switch(unit) {
			case 'second': ret += quant * 1; break;
			case 'minute': ret += quant * 60; break;
			case 'hour': ret += quant * 60 * 60; break;
			case 'day': ret += quant * 60 * 60 * 24; break;
			case 'week': ret += quant * 60 * 60 * 24 * 7; break;
			case 'month': ret += quant * 60 * 60 * 24 * 30; break;
			case 'year': ret += quant * 60 * 60 * 24 * 365; break;
		}
	}
	return ret;
}

Torus.util.seconds_to_expiry = function(seconds) {
	if(!seconds && seconds !== 0) {throw new Error('Not enough parameters. (util.seconds_to_expiry)');}
	if(seconds == 60 * 60 * 24 * 365 * 1000 || seconds == Infinity) {return 'infinite';}

	var time = [60 * 60 * 24 * 365 , 60 * 60 * 24 * 30 , 60 * 60 * 24 * 7 , 60 * 60 * 24 , 60 * 60 ,    60    ,     1   ];
	var unit = [     'year'        ,      'month'      ,      'week'      ,    'day'     , 'hour'  , 'minute' , 'second'];

	var str = '';
	for(var i = 0; i < time.length; i++) { //long division is fun
		var num = Math.floor(seconds / time[i]);
		if(num > 0) {
			if(num == 1) {str += '1 ' + unit[i] + ', ';}
			else {str += num + ' ' + unit[i] + 's, ';}
			seconds -= num * time[i];
		}
	}
	return str.substring(0, str.length - 2);
}

Torus.util.parse_regex = function(regex) {
	if(!regex || regex.charAt(0) != '/') {return false;}
	var pattern = regex.substring(1, regex.lastIndexOf('/'));
	var mode = regex.substring(regex.lastIndexOf('/') + 1);
	try {return new RegExp(pattern, mode);}
	catch(err) {return false;}
}

Torus.util.int_to_stupid = function(num) { //i still cannot believe they thought this was a good idea
	var b_stupid = ''; //build backwards
	for(num; num != 0; num = Math.floor(num / 10)) {b_stupid += String.fromCharCode(num % 10);}
	var stupid = '';
	for(var i = b_stupid.length - 1; i >= 0; i--) {stupid += b_stupid.charAt(i);} //reverse
	return stupid;
}

Torus.util.stupid_to_int = function(stupid) {
	var num = 0;
	for(var i = 0; i < stupid.length; i++) {num += stupid.charCodeAt(stupid.length - i - 1) * Math.pow(10, i);}
	return num;
}

Torus.util.utf8ify = function(str) {
	str = encodeURIComponent(str);
	for(var i = str.indexOf('%'); i != -1; i = str.indexOf('%', i + 1)) {
		str = str.substring(0, i) + String.fromCharCode(parseInt(str.substring(i + 1, i + 3), 16)) + str.substring(i + 3);
	}
	return str;
}

Torus.util.load_js = function(url) {
	var js = document.createElement('script');
		js.className = 'torus-js';
		js.src = url;
		js.type = 'text/javascript';
	document.head.appendChild(js);
	return js;
}

Torus.util.load_css = function(url) {
	var css = document.createElement('link');
		css.className = 'torus-css';
		css.href = url;
		css.rel = 'stylesheet';
		css.type = 'text/css';
		css.media = 'screen';
	document.head.appendChild(css);
	return css;
}
