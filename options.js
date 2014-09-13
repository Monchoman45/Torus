new Torus.classes.Extension('options', -2);
Torus.ext.options.text = 'Options';

Torus.ext.options.ui = {
	sidebar: document.createDocumentFragment()
};
//FIXME: fill ext.options.ui with elements from a for i in Torus.options
Torus.ext.options.selected = 'pings';
Torus.ext.options.dir = {};

Torus.ext.options.dir.pings = {
	general: {
		enabled: {
			type: 'boolean',
		},
		alert: {
			type: 'string',
			help: '', //TODO:
		},
		interval: {
			type: 'number',
			help: '', //TODO:
		},
		beep: {
			type: 'boolean',
			help: '', //TODO:
		},
		sound: {
			type: 'string',
			help: '', //TODO:
		},
	},
	global: {
		case_sensitive: {
			type: 'text',
			help: '', //TODO:
		},
		case_insensitive: {
			type: 'text',
			help: '', //TODO:
		},
	},
};
Torus.ext.options.dir.messages = {
	general: {
		max: {
			type: 'number',
			help: '', //TODO:
		},
		rejoins: {
			type: 'boolean',
			help: '', //TODO:
		},
		timezone: {
			type: 'number',
			help: '', //TODO:
		},
	},
};
Torus.ext.options.dir.misc = {
	connection: {
		default_rooms: {
			type: 'text',
			help: '', //TODO:
		},
		local: {
			type: 'boolean',
			help: '', //TODO:
		},
	},
	user_colors: {
		enabled: {
			type: 'boolean',
		},
		hue: {
			type: 'number',
			help: '', //TODO:
		},
		sat: {
			type: 'number',
			help: '', //TODO:
		},
		val: {
			type: 'number',
			help: '', //TODO:
		},
	},
};

Torus.ext.options.rebuild = function() {
	Torus.ext.options.ui.sidebar = document.createDocumentFragment();
	for(var i in Torus.ext.options.dir) {
		var li = document.createElement('li');
			li.className = 'torus-option-group';
			if(i == Torus.ext.options.selected) {li.classList.add('torus-option-group-selected');}
			li.setAttribute('data-id', i);
			li.textContent = Torus.util.cap(i);
			li.addEventListener('click', Torus.ext.options.click_sidebar);
		Torus.ext.options.ui.sidebar.appendChild(li); //FIXME: what if the sidebar is rendered?
	}

	//TODO: also do each group somewhere
}

Torus.ext.options.render = function(group) { //FIXME: innerHTML += 
	var html = '';

	for(var i = 0; i < Torus.ui.ids['sidebar'].children.length; i++) { //FIXME: what if the sidebar isn't rendered?
		if(Torus.ui.ids['sidebar'].children[i].getAttribute('data-id') == group) {Torus.ui.ids['sidebar'].children[i].classList.add('torus-option-group-selected');}
		else {Torus.ui.ids['sidebar'].children[i].classList.remove('torus-option-group-selected');}
	}

	for(var i in Torus.ext.options.dir[group]) {
		html += '<fieldset id="torus-option-set-' + group.toLowerCase() + '-' + i.toLowerCase() + '"><legend>';
		if(typeof Torus.ext.options.dir[group][i].enabled == 'boolean') {html += '<label for="torus-option-value-' + group.toLowerCase() + '-' + i.toLowerCase() + '-enabled">' + Torus.util.cap(i) + '</label> <input id="torus-option-value-' + group.toLowerCase() + '-' + i.toLowerCase() + '-enabled" type="checkbox" checked="' + Torus.options[group][i].enabled + '" onchange="Torus.options[\'' + group + '\'][\'' + i + '\'].enabled = this.checked;">'}
		else {html += Torus.util.cap(i);}
		html += '</legend>';
		for(var j in Torus.ext.options.dir[group][i]) {
			if(typeof Torus.ext.options.dir[group][i][j] != 'object' || Torus.options[group][i][j] == undefined || !Torus.ext.options.dir[group][i][j].type) {console.log(group, i, j, Torus.options[group][i][j]); continue;} //FIXME: do we need this?

			if(Torus.ext.options.dir[group][i][j].name) {var name = Torus.ext.options.dir[group][i][j].name;}
			else {var name = Torus.util.cap(j);}
			while(name.indexOf('_') != -1) {name = name.replace('_', ' ');}
			html += '<div id="torus-option-value-' + group.toLowerCase() + '-' + i.toLowerCase() + '-' + j.toLowerCase() + '">';
			switch(Torus.ext.options.dir[group][i][j].type) {
				case 'text':
					html += '<label for="torus-option-value-' + group.toLowerCase() + '-' + i.toLowerCase() + '-' + j.toLowerCase() + '-input">' + name + '</label>: <textarea id="torus-option-value-' + group.toLowerCase() + '-' + i.toLowerCase() + '-' + j.toLowerCase() + '-input" class="torus-option-text" rows="6" onblur="Torus.options[\'' + group + '\'][\'' + i + '\'][\'' + j + '\'] = this.value;">' + Torus.options[group][i][j] + '</textarea>';
					break;
				case 'boolean':
					html += '<label for="torus-option-value-' + group.toLowerCase() + '-' + i.toLowerCase() + '-' + j.toLowerCase() + '-input">' + name + '</label>: <input id="torus-option-value-' + group.toLowerCase() + '-' + i.toLowerCase() + '-' + j.toLowerCase() + '-input" class="torus-option-boolean" type="checkbox" checked="' + Torus.options[group][i][j] + ' onchange="Torus.options[\'' + group + '\'][\'' + i + '\'][\'' + j + '\'] = this.checked;">';
					break;
				case 'string':
					html += '<label for="torus-option-value-' + group.toLowerCase() + '-' + i.toLowerCase() + '-' + j.toLowerCase() + '-input">' + name + '</label>: <input id="torus-option-value-' + group.toLowerCase() + '-' + i.toLowerCase() + '-' + j.toLowerCase() + '-input" class="torus-option-string" type="text" value="' + Torus.options[group][i][j] + '" onblur="Torus.options[\'' + group + '\'][\'' + i + '\'][\'' + j + '\'] = this.value;">';
					break;
				case 'number':
					html += '<label for="torus-option-value-' + group.toLowerCase() + '-' + i.toLowerCase() + '-' + j.toLowerCase() + '-input">' + name + '</label>: <input id="torus-option-value-' + group.toLowerCase() + '-' + i.toLowerCase() + '-' + j.toLowerCase() + '-input" class="torus-option-number" type="number" value="' + Torus.options[group][i][j] + '" onblur="if(!isNaN(this.value * 1)) {Torus.options[\'' + group + '\'][\'' + i + '\'][\'' + j + '\'] = this.value * 1;} else {Torus.options[\'' + group + '\'][\'' + i + '\'][\'' + j + '\'] = 0;}">';
					break;
			}
			html += '</div>';
		}
		html += '</fieldset>';
	}
	Torus.ui.ids['window'].innerHTML = '<div id="torus-options-window">' + html + '</div>';
	Torus.ui.ids['sidebar'].appendChild(Torus.ext.options.ui.sidebar);

	if(!group) {Torus.ext.options.save();}
	else {Torus.ext.options.selected = group;}
	//Torus.call_listeners('options_render', group);
}

Torus.ext.options.unrender = function(event) {
	Torus.ext.options.ui.sidebar = event.old_sidebar;
	Torus.ext.options.ui['group_' + Torus.ext.options.selected] = event.old_window;
}

Torus.ext.options.save = function() {
	var save = {};
	for(var i in Torus.options) {
		if(i == 'sidebar') {continue;}
		if(typeof Torus.options[i] == 'object') {
			save[i] = {};
			for(var j in Torus.options[i]) {
				if(typeof Torus.options[i][j] == 'object') {
					for(var k in Torus.options[i][j]) {
						if(Torus.options[i][j][k]) {
							//if just one has a value, include all of them
							save[i][j] = Torus.options[i][j];
							break;
						}
					}
				}
			}
		}
	}
	save.version = Torus.ext.options.version;
	window.localStorage.setItem('torus-options', JSON.stringify(save));
	return save;
}

Torus.ext.options.load = function() {
	var load = JSON.parse(window.localStorage.getItem('torus-options'));
	if(!load) {return;}
	else if(load.version != Torus.ext.options.version) {
		window.localStorage.removeItem('torus-options');
		return;
	}

	for(var i in load) {
		if(typeof load[i] == 'object') {
			if(!Torus.options[i]) {
				Torus.options[i] = load[i];
				continue;
			}
			for(var j in load[i]) {
				if(typeof load[i][j] == 'object') {
					if(!Torus.options[i][j]) {
						Torus.options[i][j] = load[i][j];
						continue;
					}
					for(var k in load[i][j]) {
						if(typeof load[i][j][k] == 'object' || (k == 'enabled' && typeof Torus.options[i][j][k] == 'boolean')) {
							Torus.options[i][j][k] = load[i][j][k];
						}
					}
				}
			}
		}
	}
}

Torus.ext.options.click_sidebar = function() {Torus.ext.options.render(this.getAttribute('data-id'));}

Torus.add_listener('window', 'load', Torus.ext.options.load);
Torus.add_listener('window', 'unload', Torus.ext.options.save);

Torus.ext.options.add_listener('ui', 'activate', function() {Torus.ext.options.render(Torus.ext.options.selected);});
Torus.ext.options.add_listener('ui', 'deactivate', function(event) {
	Torus.ext.options.unrender(event);
	Torus.ext.options.save();
});

Torus.ext.options.rebuild();
