Torus.util = {
	xFF: new Uint8Array(1),
}

Torus.util.xFF[0] = 255; //don't ask

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

Torus.util.parse_links = function (text, wiki) {
	if(!text) {return '';}
	if(!isNaN(wiki * 1)) {wiki = '';}
 
	var ref = 0;
	while(text.indexOf('http', ref) != -1) { //search for plain links
		if(
			text.charAt(text.indexOf('http', ref) - 1) != '[' &&
			(text.indexOf('http://', ref) == text.indexOf('http', ref) || text.indexOf('https://', ref) == text.indexOf('http', ref))
		) {
			var start = text.indexOf('http', ref);
			var space = text.indexOf(' ', start);
			var line = text.indexOf('\n', start);
			if(space != -1 && line != -1) {
				if(space < line) {var end = space;}
				else {var end = line;}
			}
			else if(space != -1) {var end = space;}
			else if(line != -1) {var end = line;}
			else {var end = text.length;}
			var url = text.substring(start, end);
			while(url.charAt(url.length - 1) == '.' || url.charAt(url.length - 1) == ',' || url.charAt(url.length - 1) == '!' || url.charAt(url.length - 1) == '?') {url = url.substring(0, url.length - 1); end--;}
			var link = '<a href="' + url + '" onclick="Torus.ui.click_link.call(this, event);">' + url + '</a>';
			text = text.substring(0, start) + link + text.substring(end);
		}
		ref = text.indexOf('http', ref) + (link ? link.length - 9 : 1); //FIXME: ternary
	}

	ref = 0;
	while(text.indexOf('[[', ref) != -1) { //search for wikilinks
		var open = text.indexOf('[[', ref);
		var pipe = text.indexOf('|', open);
		var close = text.indexOf(']]', open);

		if(close == -1) {break;} //no closing ]] for this opening [[
		if(text.indexOf('\n', open) != -1 && text.indexOf('\n', open) < close) {ref = open + 1; continue;} //there is a newline between the opening [[ and the closing ]], this link is bad

		if(pipe != -1 && pipe < close) { //there is a pipe in the link
			if(pipe == close - 1) { //is [[page|]], pipe trick
				var title = text.substring(open + 2, pipe);
				var display = title.substring(title.indexOf(':') + 1); //strip everything up to first :
				if(display[display.length - 1] == ')' && display.lastIndexOf('(') != -1) {display = display.substring(0, display.lastIndexOf('('));} //strip trailing parens
			}
			else { //is [[page|display]]
				var title = text.substring(open + 2, pipe);
				var display = text.substring(pipe + 1, close);
			}
		}
		else { //is [[page]]
			var title = text.substring(open + 2, close);
			var display = title;
		}
		if(!title) {ref = open + 1; continue;} //skip [[]] and [[|anything]]

		if(title.indexOf('c:') == 0) {title = 'w:' + title;} //c: on central is w:c: everywhere else
		if(title.indexOf('w:c:') == 0) { //w:c:domain link
			if(title == 'w:c:') {ref = open + 1; continue;} //this link goes nowhere

			if(title.indexOf(':', 4) != -1) { //is [[w:c:domain:page]]
				var domain = title.substring(4, title.indexOf(':', 4));
				var page = Torus.util.normalize_pagename(title.substring(title.indexOf(':', 4) + 1));
				title = title.substring(0, title.indexOf(':', 4)) + ':' + page;
			}
			else { //is [[w:c:domain]]
				var domain = title.substring(4);
				var page = '';
			}
		}
		else if(title.indexOf('w:') == 0) { //w: central link
			var domain = 'c';
			if(title == 'w:') {var page = '';}
			else {
				var page = Torus.util.normalize_pagename(title.substring(2));
				title = 'w:' + page;
			}
		}
		else if(wiki) { //local link
			var domain = wiki;
			var page = Torus.util.normalize_pagename(title);
			title = page;
		}
		else {ref = open + 1; continue;} //no domain was specified and we don't know the local domain

		var link = '<a href="http://' + domain + '.wikia.com/wiki/' + encodeURIComponent(page).replace(/%3A/g, ':').replace(/%20/g, '_').replace(/%2F/g, '/') + '" title="' + title + '" onclick="Torus.ui.click_link.call(this, event);">' + display + '</a>';
		text = text.substring(0, open) + link + text.substring(close + 2);
		ref = open + link.length;
	}

	ref = 0;
	while(text.indexOf('[http', ref) != -1) { //search for external wikilinks
		if(text.indexOf('[http://', ref) == text.indexOf('[http', ref) || text.indexOf('[https://', ref) == text.indexOf('[http', ref)) {
			var start = text.indexOf('[http', ref);
			var space = text.indexOf(' ', start);
			var end = text.indexOf(']', space);
			if(end == -1) {break;}
			if(space + 1 >= text.indexOf(']', start) || (text.indexOf('\n', start) != -1 && text.indexOf('\n', start) < end)) {ref = text.indexOf('[http', ref) + 1; continue;}
			var url = text.substring(start + 1, space);
			var link = '<a href="' + encodeURIComponent(url).replace(/%3A/g, ':').replace(/%20/g, '_').replace(/%2F/g, '/') + '" onclick="Torus.ui.click_link.call(this, event);">' + text.substring(space + 1, end) + '</a>';
			text = text.substring(0, start) + link + text.substring(end + 1);
		}
		ref = start + link.length;
	}
	return text;
}

Torus.util.normalize_pagename = function(page) {
	if(!page) {return '';}
	if(page.indexOf(':') != -1) { //Namespace:Title
		var namespace = page.substring(0, page.indexOf(':'));
		var title = page.substring(page.indexOf(':') + 1);
		page = Torus.util.cap(namespace) + ':' + Torus.util.cap(title);
	}
	else {page = Torus.util.cap(page);} //Title (mainspace)
	while(page.indexOf('_') != -1) {page = page.replace('_', ' ');}
	return page;
}

Torus.util.timestamp = function(time) {
	var date = new Date();
	if(time) {date.setTime(time);}
	date.setUTCHours(date.getUTCHours() + Torus.options['messages-general-timezone']);
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

	var split = expiry.split(',');
	for(var i = 0; i < split.length; i++) {
		var ex = split[i].trim();
		var quant = ex.substring(0, ex.indexOf(' '));
		var unit = ex.substring(ex.indexOf(' ') + 1);

		if(quant == 'a' || quant == 'an') {quant = 1;}
		else if(isNaN(quant * 1)) {return false;}
		if(unit.charAt(unit.length - 1) == 's') {unit = unit.substring(0, unit.length - 1);}

		switch(unit) {
			case 'second': return quant * 1;
			case 'minute': return quant * 60;
			case 'hour': return quant * 60 * 60;
			case 'day': return quant * 60 * 60 * 24;
			case 'week': return quant * 60 * 60 * 24 * 7;
			case 'month': return quant * 60 * 60 * 24 * 30;
			case 'year': return quant * 60 * 60 * 24 * 365;
		}
	}
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
