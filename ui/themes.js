Torus.ui.themes = new Torus.classes.Extension('themes', -4);
Torus.ui.themes.text = 'Themes';

Torus.ui.themes.dir = {
	'creampuff': {
		url: 'http://monchbox.wikia.com/wiki/MediaWiki:Torus.js/ui/themes/creampuff.css?action=raw&ctype=text/css',
		name: 'Creampuff',
		loaded: true,
	},
	'default': {
		url: 'http://monchbox.wikia.com/wiki/MediaWiki:Torus.js/ui/themes/default.css?action=raw&ctype=text/css',
		name: 'Default',
		loaded: true,
	},
	'plain': {
		url: 'http://monchbox.wikia.com/wiki/MediaWiki:Torus.js/ui/themes/plain.css?action=raw&ctype=text/css',
		name: 'Plain',
		loaded: true,
	},
};

Torus.ui.themes.selected = 'default';

Torus.ui.themes.html = document.createDocumentFragment();

Torus.ui.themes.rebuild = function() {
	var table = document.createElement('table');
	table.id = 'torus-themes-table';
	Torus.ui.ids['themes-table'] = table;
	for(var i in Torus.ui.themes.dir) {
		if(!Torus.ui.themes.dir[i].loaded) {
			Torus.util.load_css(Torus.ui.themes.dir[i].url);
			Torus.ui.themes.dir[i].loaded = true;
		}

		var tr = document.createElement('tr');
			var td = document.createElement('td');
				td.className = 'border2';
				var radio = document.createElement('input');
					radio.id = 'torus-theme-' + i;
					Torus.ui.ids['theme-' + i] = radio;
					radio.className = 'torus-theme-radio';
					radio.type = 'radio';
					radio.name = 'torus-theme';
					radio.value = i;
					radio.addEventListener('click', Torus.ui.themes.click_theme);
					if(i == Torus.ui.themes.selected) {radio.checked = true;}
				td.appendChild(radio);
				var label = document.createElement('label');
					label.setAttribute('for', 'torus-theme-' + i);
					label.className = 'torus-theme-label';
					label.textContent = Torus.ui.themes.dir[i].name;
				td.appendChild(label);
			tr.appendChild(td);
			var td = document.createElement('td');
				td.className = 'border2';
				var preview = document.createElement('table');
					preview.id = 'torus-preview-' + i;
					Torus.ui.ids['preview-' + i];
					preview.className = 'torus-theme-preview';
					for(var j = 1; j <= 5; j++) {
						var cell = document.createElement('td');
							cell.className = 'torus-theme-cell bg' + j;
							if(j <= 2) {cell.className += ' border1';}
							else if(j == 3) {cell.className += ' border2';}
							else {cell.className += ' border3';}
							if(j >= 2 && j <= 4) {
								var text1 = document.createElement('div');
									text1.className = 'text1';
									text1.textContent = 'text'; //FIXME: i18n
								cell.appendChild(text1);
								var text2 = document.createElement('div');
									text2.className = 'text2';
									text2.textContent = 'link'; //FIXME: i18n
								cell.appendChild(text2);
								var text3 = document.createElement('div');
									text3.className = 'text3';
									text3.textContent = 'away'; //FIXME: i18n
								cell.appendChild(text3);
								var text4 = document.createElement('div');
									text4.className = 'text4';
									text4.textContent = 'ping'; //FIXME: i18n
								cell.appendChild(text4);
							}
						preview.appendChild(cell);
					}
				td.appendChild(preview);
			tr.appendChild(td);
		table.appendChild(tr);
	}
	Torus.ui.themes.html.appendChild(table);
};

Torus.ui.themes.select = function(theme) {
	Torus.ui.window.classList.remove('theme-' + Torus.ui.themes.selected);
	Torus.ui.themes.selected = theme;
	Torus.ui.window.classList.add('theme-' + theme);
	//Torus.ui.themes.rebuild(); //FIXME: this is a dumb way of making sure the radio button is in the right place
};

Torus.ui.themes.click_theme = function(event) {Torus.ui.themes.select(this.value);};

Torus.ui.themes.render = function(event) {
	Torus.ui.ids['window'].appendChild(Torus.ui.themes.html);
};
Torus.ui.themes.unrender = function(event) {
	Torus.ui.themes.html = event.old_window;
};

Torus.ui.themes.load = function(event) {
	Torus.ui.themes.select('default');
	Torus.ui.themes.rebuild();
};

Torus.ui.themes.add_listener('ui', 'activate', Torus.ui.themes.render);
Torus.ui.themes.add_listener('ui', 'deactivate', Torus.ui.themes.unrender);
Torus.add_listener('window', 'load', Torus.ui.themes.load);
