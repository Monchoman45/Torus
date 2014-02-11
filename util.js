Torus.util.colorHash = function(str) {
	if(str == undefined) {throw new Error('Not enough parameters. (util.colorHash)');}
	str += ''; //cast to string
	var hue = 0;
	var val = Torus.options.misc.user_colors.val.value;
	var sat = Torus.options.misc.user_colors.sat.value;
	for(var i = 0; i < str.length; i++) {
		hue = 31 * hue + str.charCodeAt(i); //same hash algorithm as webchat, except this is case sensitive
	}
	hue = (hue % 360 + Torus.options.misc.user_colors.hue.value) % 360;

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

Torus.util.parseLinks = function (text, wiki) {
	if(!text) {throw new Error('Not enough parameters. (util.parseLinks)');}
	if(wiki && !isNaN(wiki * 1)) {wiki = Torus.data.ids[wiki];}
 
	var ref = 0;
	while(text.indexOf('http', ref) != -1) {
		if(text.charAt(text.indexOf('http', ref) - 1) != '[' && (text.indexOf('http://', ref) == text.indexOf('http', ref) || text.indexOf('https://', ref) == text.indexOf('http', ref))) {
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
			var link = '<a href="' + url + '" onclick="event.preventDefault(); window.open(this.href, \'torus\');">' + url + '</a>';
			text = text.substring(0, start) + link + text.substring(end);
		}
		ref = text.indexOf('http', ref) + (link ? link.length - 9 : 1);
	}
	ref = 0;
	while(text.indexOf('[[', ref) != -1) {
		if(text.indexOf(']]', text.indexOf('[[', ref)) != -1) {
			var open = text.indexOf('[[', ref);
			var pipe = text.indexOf('|', open);
			var close = text.indexOf(']]', open);
			if(text.indexOf('\n', open) != -1 && text.indexOf('\n', open) < close) {ref = open + 1; continue;}
			if(pipe != -1 && pipe < close) { //is [[page|display]]
				if(pipe == close - 1) { //is [[page|page]], pipe trick
					var title = text.substring(open + 2, pipe);
					var display = title.substring(title.indexOf(':') + 1);
				}
				else {
					var title = text.substring(open + 2, pipe);
					var display = text.substring(pipe + 1, close);
				}
			}
			else { //is [[page]]
				var title = text.substring(open + 2, close);
				var display = title;
			}
			if(!title) {ref = open + 1; continue;} //skip [[]] and [[|<anything>]]
 
			var page = title;
			if(title.indexOf('w:c:') == 0) {
				if(title.indexOf(':', 5) != -1) {var domain = title.substring(4, title.indexOf(':', 5));}
				else {var domain = title.substring(4);}
				if(page == 'w:c:' + domain) {page = '';}
				else if(page == 'w:c:') {ref = open + 1; continue;}
				else {
					page = page.substring(page.indexOf(':', 4) + 1);
					title = title.substring(0, title.indexOf(':', 4)) + ':' + page.charAt(0).toUpperCase() + page.substring(1);
				}
			}
			else if(title.indexOf('w:') == 0) {
				var domain = 'c';
				if(page == 'w:') {page = '';}
				else {
					page = page.substring(page.indexOf(':', 2) + 1);
					title = 'w:' + page.charAt(0).toUpperCase() + page.substring(1);
				}
			}
			else if(title.indexOf('c:') == 0) {
				if(title.indexOf(':', 3) != -1) {var domain = title.substring(2, title.indexOf(':', 3));}
				else {var domain = title.substring(2);}
				if(page == 'c:' + domain) {page = '';}
				else if(page == 'c:') {ref = open + 1; continue;}
				else {
					page = page.substring(page.indexOf(':', 2) + 1);
					title = title.substring(0, title.indexOf(':', 2)) + ':' + page.charAt(0).toUpperCase() + page.substring(1);
				}
			}
			else if(wiki) {
				var domain = wiki;
				title = page.charAt(0).toUpperCase() + page.substring(1);
			}
			else {ref = open + 1; continue;} //no domain was specified and we don't know the local domain
			if(pipe + 1 == close) {var link = '<a href="http://' + domain + '.wikia.com/wiki/' + encodeURIComponent(page.charAt(0).toUpperCase() + page.substring(1)).replace(/%3A/g, ':').replace(/%20/g, '_').replace(/%2F/g, '/') + '" title="' + title + '" onclick="event.preventDefault(); window.open(this.href, \'torus\');">' + display.substring(display.indexOf(':') + 1) + '</a>'} //pipe trick
			else {var link = '<a href="http://' + domain + '.wikia.com/wiki/' + encodeURIComponent(page.charAt(0).toUpperCase() + page.substring(1)).replace(/%3A/g, ':').replace(/%20/g, '_').replace(/%2F/g, '/') + '" title="' + title + '" onclick="event.preventDefault(); window.open(this.href, \'torus\');">' + display + '</a>';}
			text = text.substring(0, open) + link + text.substring(close + 2);
			ref = open + link.length;
		}
		else {break;}
	}
	ref = 0;
	while(text.indexOf('[http', ref) != -1) {
		if(text.indexOf('[http://', ref) == text.indexOf('[http', ref) || text.indexOf('[https://', ref) == text.indexOf('[http', ref)) {
			var start = text.indexOf('[http', ref);
			var space = text.indexOf(' ', start);
			var end = text.indexOf(']', space);
			if(end == -1) {break;}
			if(space + 1 >= text.indexOf(']', start) || (text.indexOf('\n', start) != -1 && text.indexOf('\n', start) < end)) {ref = text.indexOf('[http', ref) + 1; continue;}
			var url = text.substring(start + 1, space);
			var link = '<a href="' + encodeURIComponent(url).replace(/%3A/g, ':').replace(/%20/g, '_').replace(/%2F/g, '/') + '" onclick="event.preventDefault(); window.open(this.href, \'torus\');">' + text.substring(space + 1, end) + '</a>';
			text = text.substring(0, start) + link + text.substring(end + 1);
		}
		ref = start + link.length;
	}
	return text;
}

Torus.util.textIndex = function(text, find) { //indexOf, but ignore stuff like the href="" attribute of links
	var ref = 0;
	var index = 0;
	while((index = text.indexOf(find, ref)) != -1) {
		if(text.lastIndexOf('<a href="', index) <= text.lastIndexOf('">', index)) {return index;}
		else {ref = index + 1;}
	}
	return -1;
}

Torus.util.timestamp = function(time) {
	var date = new Date();
	if(time) {date.setTime(time);}
	date.setUTCHours(date.getUTCHours() + Torus.options.messages.general.timezone.value);
	var hours = date.getUTCHours();
	if(hours < 10) {hours = '0' + hours;}
	var minutes = date.getUTCMinutes();
	if(minutes < 10) {minutes = '0' + minutes;}
	var seconds = date.getUTCSeconds();
	if(seconds < 10) {seconds = '0' + seconds;}
	return hours + ':' + minutes + ':' + seconds;
}

Torus.util.expiryToSeconds = function(expiry) {
	if(!expiry) {throw new Error('Not enough parameters. (util.expiryToSeconds)');}
	if(expiry == 'infinite' || expiry == 'indefinite') {return 60 * 60 * 24 * 365 * 1000;} //the server recognizes 1000 years as infinite
	else if(expiry == 'unban' || expiry == 'undo') {return 0;}
	else {
		var quant = expiry.split(' ')[0];
		var unit = expiry.split(' ')[1];
		if(quant == 'a' || quant == 'an') {quant = 1;}
		else if(isNaN(quant * 1)) {return false;}
		if(unit.charAt(unit.length - 1) == 's') {unit = unit.substring(0, unit.length - 1);}
		switch(unit) {
			case 'second': return quant;
			case 'minute': return quant * 60;
			case 'hour': return quant * 60 * 60;
			case 'day': return quant * 60 * 60 * 24;
			case 'week': return quant * 60 * 60 * 24 * 7;
			case 'month': return quant * 60 * 60 * 24 * 30;
			case 'year': return quant * 60 * 60 * 24 * 365;
		}
	}
}

Torus.util.secondsToExpiry = function(seconds) {
	if(!seconds && seconds !== 0) {throw new Error('Not enough parameters. (util.secondsToExpiry)');}
	if(seconds == 60 * 60 * 24 * 365 * 1000) {return 'infinite';}
	else if(seconds >= 60 * 60 * 24 * 365) { var quant = seconds / (60 * 60 * 24 * 365); //year
		if(quant == 1) {return '1 year';} else {return quant + ' years';}
	}
	else if(seconds >= 60 * 60 * 24 * 30) { var quant = seconds / (60 * 60 * 24 * 30); //month
		if(quant == 1) {return '1 month';} else {return quant + ' months';}
	}
	else if(seconds >= 60 * 60 * 24 * 7) { var quant = seconds / (60 * 60 * 24 * 7); //week
		if(quant == 1) {return '1 week';} else {return quant + ' weeks';}
	}
	else if(seconds >= 60 * 60 * 24) { var quant = seconds / (60 * 60 * 24); //day
		if(quant == 1) {return '1 day';} else {return quant + ' days';}
	}
	else if(seconds >= 60 * 60) { var quant = seconds / (60 * 60); //hour
		if(quant == 1) {return '1 hour';} else {return quant + ' hours';}
	}
	else if(seconds >= 60) { var quant = seconds / 60; //minute
		if(quant == 1) {return '1 minute';} else {return quant + ' minutes';}
	}
	else if(seconds == 1) {return '1 second';} //second
	else if(seconds == 0) {return 'unban';}
	else {return seconds + ' seconds';}
}
