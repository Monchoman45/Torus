Torus.ui.parser = {};

Torus.ui.parser.parse_plainlink = function(state) {
	var space = state.text.indexOf(' ');
	var line = state.text.indexOf('\n');
	if(space != -1 && line != -1) {
		if(space < line) {var end = space;}
		else {var end = line;}
	}
	else if(space != -1) {var end = space;}
	else if(line != -1) {var end = line;}
	else {var end = state.text.length;}

	var url = state.text.substring(0, end);
	while(url.charAt(url.length - 1) == '.' || url.charAt(url.length - 1) == ',' || url.charAt(url.length - 1) == '!' || url.charAt(url.length - 1) == '?') {url = url.substring(0, url.length - 1); end--;}

	state.text = state.text.substring(end);
	var link = document.createElement('a');
		link.className = 'torus-message-link';
		link.href = url;
		link.addEventListener('click', Torus.ui.click_link);
		link.textContent = url;
	return link;
}

Torus.ui.parser.parse_extlink = function(state) {
	var space = state.text.indexOf(' ');
	var end = state.text.indexOf(']', space);
	var url = state.text.substring(1, space);
	var display = state.text.substring(space + 1, end);

	if(end == -1 || space == -1 || display.trim() == '' || space + 1 >= end || (state.text.indexOf('\n') != -1 && state.text.indexOf('\n') < end)) {
		var node = document.createTextNode(state.text.substring(0, 3));
		state.text = state.text.substring(3);
		return node;
	}

	state.text = state.text.substring(end + 1);
	var link = document.createElement('a');
		link.className = 'torus-message-link';
		link.href = url;
		link.addEventListener('click', Torus.ui.click_link);
		link.textContent = display;
	return link;
}

Torus.ui.parser.parse_locallink = function(state) {
	var pipe = state.text.indexOf('|');
	var close = state.text.indexOf(']]');

	if(close == -1 || (state.text.indexOf('\n') != -1 && state.text.indexOf('\n') < close)) {
		state.text = state.text.substring(2);
		return document.createTextNode('[[');
	}

	if(pipe != -1 && pipe < close) { //there is a pipe in the link
		if(pipe == close - 1) { //is [[page|]], pipe trick
			var title = state.text.substring(2, pipe);
			var display = title.substring(title.indexOf(':') + 1); //strip everything up to first :
			if(display[display.length - 1] == ')' && display.lastIndexOf('(') != -1) {display = display.substring(0, display.lastIndexOf('('));} //strip trailing parens
		}
		else { //is [[page|display]]
			var title = state.text.substring(2, pipe);
			var display = state.text.substring(pipe + 1, close);
		}
	}
	else { //is [[page]]
		var title = state.text.substring(2, close);
		var display = title;
	}
	if(!title) { //skip [[]] and [[|anything]]
		state.text = state.text.substring(2);
		return document.createTextNode('[[');
	}

	if(title.indexOf('c:') == 0) {title = 'w:' + title;} //c: on central is w:c: everywhere else
	if(title.indexOf('w:c:') == 0) { //w:c:domain link
		if(title == 'w:c:') { //this link goes nowhere
			state.text = state.text.substring(2);
			return document.createTextNode('[[');
		}

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
	else if(state.wiki) { //local link
		var domain = state.wiki;
		var page = Torus.util.normalize_pagename(title);
		title = page;
	}
	else { //no domain was specified and we don't know the local domain
		state.text = state.text.substring(2);
		return document.createTextNode('[[');
	}

	state.text = state.text.substring(close + 2);
	var link = document.createElement('a');
		link.className = 'torus-message-link';
		link.href = 'http://' + domain + '.wikia.com/wiki/' + encodeURIComponent(page).replace(/%3A/g, ':').replace(/%20/g, '_').replace(/%2F/g, '/');
		link.title = title;
		link.addEventListener('click', Torus.ui.click_link);
		link.textContent = display;
	return link;
}
Torus.ui.parser.parse_newline = function(state) {return document.createElement('br');}

Torus.ui.parser.hooks = {
	'http://': Torus.ui.parser.parse_plainlink,
	'https://': Torus.ui.parser.parse_plainlink,
	'news://': Torus.ui.parser.parse_plainlink,
	'ftp://': Torus.ui.parser.parse_plainlink,
	'irc://': Torus.ui.parser.parse_plainlink,

	'[http://': Torus.ui.parser.parse_extlink,
	'[https://': Torus.ui.parser.parse_extlink,
	'[news://': Torus.ui.parser.parse_extlink,
	'[ftp://': Torus.ui.parser.parse_extlink,
	'[irc://': Torus.ui.parser.parse_extlink,
	'[//': Torus.ui.parser.parse_extlink,

	'[[': Torus.ui.parser.parse_locallink,
	'\n': Torus.ui.parser.parse_newline,
};

Torus.ui.parse_links = function(text, wiki) {
	if(!text) {return '';}

	var state = {
		text: text,
		wiki: wiki,
	};

	var html = document.createElement('span');
	html.className = 'torus-message-text';
	var min = '';
	var ref = -1
	do {
		ref = -1;
		for(var i in Torus.ui.parser.hooks) {
			var index = state.text.indexOf(i);
			if(ref == -1 || (index != -1 && index < ref)) {
				min = i;
				ref = index;
			}
		}
		if(ref == -1) {break;}

		if(ref > 0) {
			html.appendChild(document.createTextNode(state.text.substring(0, ref)));
			state.text = state.text.substring(ref);
		}
		html.appendChild(Torus.ui.parser.hooks[min](state));
	}
	while(ref != -1);
	html.appendChild(document.createTextNode(state.text));

	//FIXME: combine adjacent text nodes

	return html;
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
