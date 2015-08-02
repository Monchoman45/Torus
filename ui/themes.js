Torus.ui.themes = new Torus.classes.Extension('themes', -4);
Torus.ui.themes.text = 'Themes';

Torus.ui.themes.dir = {
	'default': {
		url: 'http://monchbox.wikia.com/wiki/MediaWiki:Torus.js/ui/themes/default.css?action=raw&ctype=text/css',
		name: 'Default',
		loaded: true,
	},
};

Torus.ui.themes.selected = 'default';

Torus.ui.themes.html = document.createDocumentFragment();

Torus.ui.themes.rebuild = function() {
	for(var i in Torus.ui.themes.dir) {
		if(!Torus.ui.themes.dir[i].loaded) {
			Torus.util.load_css(Torus.ui.themes.dir[i].url);
			Torus.ui.themes.dir[i].loaded = true;
		}

		var theme = document.createElement('div');
			var radio = document.createElement('input');
				radio.id = 'torus-theme-' + i;
				Torus.ui.ids['theme-' + i] = radio;
				radio.type = 'radio';
				radio.name = 'torus-theme';
				radio.value = i;
				radio.addEventListener('click', Torus.ui.themes.click_theme);
			theme.appendChild(radio);
			var label = document.createElement('label');
				label.for = 'torus-theme-' + i;
				label.textContent = Torus.ui.themes.dir[i].name;
			theme.appendChild(label);
			var preview = document.createElement('table');
				for(var j = 1; j <= 5; j++) {
					var cell = document.createElement('td');
						cell.className = 'torus-theme-cell bg' + j;
						if(j <= 3) {cell.className += ' border1';}
						else {cell.className += ' border2';}
						var text1 = document.createElement('div');
							text1.className = 'text1';
							text1.textContent = 'text'; //FIXME: i18n
						cell.appendChild(text1);
						var text2 = document.createElement('div');
							text2.className = 'text2';
							text2.textContent = 'away'; //FIXME: i18n
						cell.appendChild(text2);
						var text3 = document.createElement('div');
							text3.className = 'text3';
							text3.textContent = 'ping'; //FIXME: i18n
						cell.appendChild(text3);
					preview.appendChild(cell);
				}
			theme.appendChild(preview);
		Torus.ui.themes.html.appendChild(theme);
	}
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
