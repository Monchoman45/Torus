Torus.options = new Torus.classes.Extension('options', -2);
Torus.ext.options.text = 'Options';

Torus.options.sidebar = [];
Torus.options.version = 1;
Torus.options.selected = 'pings';
Torus.options.pings = {
	general: {
		enabled: true,
		alert: {
			type: 'string',
			value: 'Activity!'
		},
		interval: {
			type: 'number',
			value: 500
		},
		beep: {
			type: 'boolean',
			value: true
		},
		sound: {
			type: 'string',
			value: 'http://images.wikia.com/monchbox/images/0/01/Beep-sound.ogg'
		}
	},
	global: {
		case_sensitive: {
			type: 'text',
			value: ''
		},
		case_insensitive: {
			type: 'text',
			value: wgUserName
		}
	}
};
Torus.options.messages = {
	general: {
		max: {
			type: 'number',
			value: 200
		},
		rejoins: {
			type: 'boolean',
			value: false
		},
		timezone: {
			type: 'number',
			value: 0
		}
	}
};
Torus.options.misc = {
	connection: {
		default_rooms: {
			type: 'text',
			value: ''
		},
		local: {
			type: 'boolean',
			value: true
		}
	},
	user_colors: {
		enabled: true,
		hue: {
			type: 'number',
			value: 0
		},
		sat: {
			type: 'number',
			value: .7
		},
		val: {
			type: 'number',
			value: .6
		}
	}
};

Torus.options.rebuild = function() {
	Torus.options.sidebar = [];
	for(var i in Torus.options) {
		if(typeof Torus.options[i] != 'object' || i == 'listeners' || i == 'sidebar') {continue;}
		var li = document.createElement('li');
			li.className = 'torus-option-group';
			li.textContent = i.charAt(0).toUpperCase() + i.substring(1);
			li.addEventListener('click', Torus.options.click_sidebar);
		Torus.options.sidebar.push(li);
	}

	//TODO: also do each group somewhere
}

Torus.options.render = function(group) {
	var html = '';

	for(var i in Torus.options.sidebar) {
		if(i == group) {Torus.options.sidebar[i].classList.add('torus-option-group-selected');}
		else {Torus.options.sidebar[i].classList.remove('torus-option-group-selected');}
	}
	for(var i in Torus.options) {
		if(typeof Torus.options[i] != 'object' || i == 'listeners' || i == 'sidebar') {continue;}

		if(i != group) {continue;}
		for(var j in Torus.options[i]) {
			if(typeof Torus.options[i][j] != 'object') {console.log(i, j, Torus.options[i][j]); continue;}

			html += '<fieldset id="torus-option-set-' + i.toLowerCase() + '-' + j.toLowerCase() + '"><legend>';
			if(typeof Torus.options[i][j].enabled == 'boolean') {html += '<label for="torus-option-value-' + i.toLowerCase() + '-' + j.toLowerCase() + '-enabled">' + j.charAt(0).toUpperCase() + j.substring(1) + '</label> <input id="torus-option-value-' + i.toLowerCase() + '-' + j.toLowerCase() + '-enabled" type="checkbox" checked="' + Torus.options[i][j].enabled + '" onchange="Torus.options[\'' + i + '\'][\'' + j + '\'].enabled = this.checked;">'}
			else {html += j.charAt(0).toUpperCase() + j.substring(1);}
			html += '</legend>';
			for(var k in Torus.options[i][j]) {
				if(typeof Torus.options[i][j][k] != 'object' || Torus.options[i][j][k].value == undefined || !Torus.options[i][j][k].type) {console.log(i, j, k, Torus.options[i][j][k]); continue;}

				if(Torus.options[i][j][k].name) {var name = Torus.options[i][j][k].name;}
				else {var name = k.charAt(0).toUpperCase() + k.substring(1);}
				while(name.indexOf('_') != -1) {name = name.replace('_', ' ');}
				html += '<div id="torus-option-value-' + i.toLowerCase() + '-' + j.toLowerCase() + '-' + k.toLowerCase() + '">';
				switch(Torus.options[i][j][k].type) {
					case 'text':
						html += '<label for="torus-option-value-' + i.toLowerCase() + '-' + j.toLowerCase() + '-' + k.toLowerCase() + '-input">' + name + '</label>: <textarea id="torus-option-value-' + i.toLowerCase() + '-' + j.toLowerCase() + '-' + k.toLowerCase() + '-input" class="torus-option-text" rows="6" onblur="Torus.options[\'' + i + '\'][\'' + j + '\'][\'' + k + '\'].value = this.value;">' + Torus.options[i][j][k].value + '</textarea>';
						break;
					case 'boolean':
						html += '<label for="torus-option-value-' + i.toLowerCase() + '-' + j.toLowerCase() + '-' + k.toLowerCase() + '-input">' + name + '</label>: <input id="torus-option-value-' + i.toLowerCase() + '-' + j.toLowerCase() + '-' + k.toLowerCase() + '-input" class="torus-option-boolean" type="checkbox" checked="' + Torus.options[i][j][k].value + ' onchange="Torus.options[\'' + i + '\'][\'' + j + '\'][\'' + k + '\'].value = this.checked;">';
						break;
					case 'string':
						html += '<label for="torus-option-value-' + i.toLowerCase() + '-' + j.toLowerCase() + '-' + k.toLowerCase() + '-input">' + name + '</label>: <input id="torus-option-value-' + i.toLowerCase() + '-' + j.toLowerCase() + '-' + k.toLowerCase() + '-input" class="torus-option-string" type="text" value="' + Torus.options[i][j][k].value + '" onblur="Torus.options[\'' + i + '\'][\'' + j + '\'][\'' + k + '\'].value = this.value;">';
						break;
					case 'number':
						html += '<label for="torus-option-value-' + i.toLowerCase() + '-' + j.toLowerCase() + '-' + k.toLowerCase() + '-input">' + name + '</label>: <input id="torus-option-value-' + i.toLowerCase() + '-' + j.toLowerCase() + '-' + k.toLowerCase() + '-input" class="torus-option-number" type="number" value="' + Torus.options[i][j][k].value + '" onblur="if(!isNaN(this.value * 1)) {Torus.options[\'' + i + '\'][\'' + j + '\'][\'' + k + '\'].value = this.value * 1;} else {Torus.options[\'' + i + '\'][\'' + j + '\'][\'' + k + '\'].value = undefined;}">';
						break;
				}
				html += '</div>';
			}
			html += '</fieldset>';
		}
	}
	Torus.ui.ids['window'].innerHTML = '<div id="torus-options-window">' + html + '</div>';
	Torus.util.fill_el(Torus.ui.ids['sidebar'], Torus.options.sidebar);

	if(!group) {Torus.options.save();}
	else {Torus.options.selected = group;}
	//Torus.call_listeners('options_render', group);
}

Torus.options.save = function() {
	var save = {};
	for(var i in Torus.options) {
		if(i == 'sidebar') {continue;}
		if(typeof Torus.options[i] == 'object') {
			save[i] = {};
			for(var j in Torus.options[i]) {
				if(typeof Torus.options[i][j] == 'object') {
					for(var k in Torus.options[i][j]) {
						if(Torus.options[i][j][k].value) {
							//if just one has a value, include all of them
							save[i][j] = Torus.options[i][j];
							break;
						}
					}
				}
			}
		}
	}
	save.version = Torus.options.version;
	window.localStorage.setItem('torus-options', JSON.stringify(save));
	return save;
}

Torus.options.load = function() {
	var load = JSON.parse(window.localStorage.getItem('torus-options'));
	if(!load) {return;}
	else if(load.version != Torus.options.version) {
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

Torus.options.click_sidebar = function() {Torus.options.render(this.getAttribute('data-id'));}

Torus.add_listener('window', 'load', Torus.options.load);
Torus.add_listener('window', 'unload', Torus.options.save);

Torus.options.add_listener('ui', 'activate', function() {Torus.options.render(Torus.options.selected);});
Torus.options.add_listener('ui', 'deactivate', Torus.options.save);

Torus.options.rebuild();
