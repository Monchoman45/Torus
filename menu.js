Torus.ui.menu = {};

Torus.ui.menu.render = function() {
	var name = document.createElement('div');
		name.id = 'torus-menu-name';
		Torus.ui.ids['menu-name'] = name;
		name.textContent = 'Torus v' + Torus.pretty_version;
	Torus.ui.ids['window'].appendChild(name);
	var links = document.createElement('div');
		links.id = 'torus-menu-links';
		Torus.ui.ids['menu-links'] = links;
		var github = document.createElement('a');
			github.href = 'https://github.com/Monchoman45/Torus';
			github.textContent = 'fork me';
			github.addEventListener('click', Torus.ui.click_link);
		links.appendChild(github);
		links.appendChild(document.createTextNode(' | '));
		var report = document.createElement('a');
			report.href = 'https://github.com/Monchoman45/Torus/issues/new';
			report.textContent = 'report a bug';
			report.addEventListener('click', Torus.ui.click_link);
		links.appendChild(report);
		links.appendChild(document.createTextNode(' | '));
		var doc = document.createElement('a');
			doc.href = 'http://monchbox.wikia.com/wiki/Torus';
			doc.textContent = '"documentation"';
			doc.addEventListener('click', Torus.ui.click_link);
		links.appendChild(doc);
	Torus.ui.ids['window'].appendChild(links);

	var extensions = document.createElement('div');
		extensions.id = 'torus-menu-extensions';
		Torus.ui.ids['menu-extensions'] = extensions;
		for(var i in Torus.ext) {
			if(i == 'ui') {continue;}
			var ext = document.createElement('a');
				ext.id = 'torus-menu-ext-' + i;
				Torus.ui.ids['menu-ext-' + i] = ext;
				ext.setAttribute('data-id', i);
				if(Torus.ext[i].text) {ext.textContent = Torus.ext[i].text;}
				else {ext.textContent = i;}
				ext.addEventListener('click', Torus.ui.menu.click_extension);
			extensions.appendChild(ext);
		}
	Torus.ui.ids['window'].appendChild(extensions);
}

Torus.ui.menu.click_extension = function() {Torus.ui.activate(Torus.ext[this.getAttribute('data-id')]);}

Torus.ui.menu.tab_click = function() {Torus.ui.activate(Torus.ext.ui);}

//activating the ui extension gives you the menu
Torus.ext.ui.add_listener('ui', 'activate', Torus.ui.menu.render);
Torus.ext.ui.add_listener('ui', 'deactivate', Torus.util.null); //FIXME: i'm sure something important is supposed to go here
