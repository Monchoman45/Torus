Torus.i18n = {};

if(window.mw && mw.config && mw.config.values) {Torus.i18n.lang = wgUserLanguage;}
else {Torus.i18n.lang = 'en';}

Torus.i18n.text = function(message) {
	if(Torus.i18n.lang == 'qqx' || typeof Torus.i18n[Torus.i18n.lang] == 'object') {var lang = Torus.i18n.lang;}
	else {var lang = 'en';}
	if(Torus.i18n[lang] && Torus.i18n[lang][message]) {message = Torus.i18n[lang][message];}
	else {lang = 'qqx';}

	if(lang == 'qqx') {
		for(var i = 1; i < arguments.length; i++) {message += ' $' + i + ' = ' + arguments[i];}
	}
	else {
		for(var i = 1; i < arguments.length; i++) {
			for(var ref = message.indexOf('$' + i); ref != -1; ref = message.indexOf('$' + i, ref + 1)) {
				if(message.charAt(ref - 1) == '\\') {continue;}
				message = message.substring(0, ref) + arguments[i] + message.substring(ref + ('' + i).length + 1);
			}
			while(message.indexOf('\\$') != -1) {message = message.replace('\\$', '$');}
		}
	}
	return message;
}

Torus.i18n.html = function(name) {
	if(Torus.i18n.lang == 'qqx' || typeof Torus.i18n[Torus.i18n.lang] == 'object') {var lang = Torus.i18n.lang;}
	else {var lang = 'en';}
	if(Torus.i18n[lang] && Torus.i18n[lang][name]) {var message = Torus.i18n[lang][name];}
	else {
		var message = name;
		lang = 'qqx';
	}

	var frag = document.createDocumentFragment();
	if(lang == 'qqx') {
		frag.appendChild(document.createTextNode(name));
		for(var i = 1; i < arguments.length; i++) {
			frag.appendChild(document.createTextNode(' $' + i + ' = '));
			frag.appendChild(arguments[i]);
		}
	}
	else {
		for(var ref = message.indexOf('$'); ref != -1; ref = message.indexOf('$')) {
			if(message.charAt(ref - 1) == '\\') {
				frag.appendChild(document.createTextNode('$'));
				message = message.substring(2);
			}
			else {
				frag.appendChild(document.createTextNode(message.substring(0, ref)));

				var index = '';
				do {
					var c = message.charAt(ref + index.length + 1);
					if(c) {index += c;}
					else {index += '.';}
				}
				while(arguments[index * 1]);
				index = index.substring(0, index.length - 1) * 1;
				if(isNaN(index)) {return document.createTextNode('I18N ERROR: ' + name);}

				frag.appendChild(arguments[index]);
				message = message.substring(ref + ('' + index).length + 1);
			}
		}
		frag.appendChild(document.createTextNode(message));
	}
	return frag;
}
