//FIXME: some kind of defaults, with option to restore defaults
Torus.options['pings-general-enabled'] = true;
Torus.options['pings-general-alert'] = 'Activity!';
Torus.options['pings-general-interval'] = 500;
Torus.options['pings-general-beep'] = true;
Torus.options['pings-general-sound'] = 'http://images.wikia.com/monchbox/images/0/01/Beep-sound.ogg'; 
Torus.options['pings-global-regex'] = '';
Torus.options['pings-global-literal'] = wgUserName;

Torus.options['messages-general-max'] = 200;
Torus.options['messages-general-rejoins'] = false;
Torus.options['messages-general-timezone'] = 0;

Torus.options['misc-connection-default_rooms'] = '';
Torus.options['misc-connection-local'] = true;
Torus.options['misc-user_colors-enabled'] = true;
Torus.options['misc-user_colors-hue'] = 0;
Torus.options['misc-user_colors-sat'] = .7;
Torus.options['misc-user_colors-val'] = .6;
Torus.options['misc-links-chat'] = true;
Torus.options['misc-links-target'] = '_blank';

new Torus.classes.Extension('options', -2);
Torus.ext.options.text = 'Options';

Torus.ext.options.ui = {
	sidebar: document.createDocumentFragment()
};
//FIXME: fill ext.options.ui with elements from a for i in Torus.options
Torus.ext.options.selected = 'pings';
Torus.ext.options.dir = {};
Torus.ext.options.types = {};

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
		literal: {
			type: 'text',
			help: '', //TODO:
		},
		regex: {
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
	links: {
		chat: {
			type: 'boolean',
			help: '', //TODO:
		},
		target: {
			type: 'string',
			help: '', //TODO:
		},
	},
};

Torus.ext.options.rebuild = function() { //FIXME: what if options is active?
	Torus.ext.options.ui.sidebar = document.createDocumentFragment();
	for(var i in Torus.ext.options.dir) {
		var li = document.createElement('li');
			li.className = 'torus-option-group';
			if(i == Torus.ext.options.selected) {li.classList.add('torus-option-group-selected');}
			li.setAttribute('data-id', i);
			li.textContent = Torus.util.cap(i);
			li.addEventListener('click', Torus.ext.options.click_sidebar);
		Torus.ext.options.ui.sidebar.appendChild(li);

		var frag = document.createDocumentFragment();
		for(var j in Torus.ext.options.dir[i]) {
			var fieldset = document.createElement('fieldset');
				fieldset.id = 'torus-option-set-' + i + '-' + j;
				Torus.ui.ids['torus-option-set-' + i + '-' + j] = fieldset;
				var name = Torus.util.cap(j);
				while(name.indexOf('_') != -1) {name = name.replace('_', ' ');}
				var legend = document.createElement('legend');
					if(Torus.ext.options.dir[i][j].enabled && Torus.ext.options.dir[i][j].enabled.type == 'boolean') { //FIXME: target
						var label = document.createElement('label');
							label.setAttribute('for', 'torus-option-value-' + i + '-' + j + '-enabled');
							label.textContent = name;
						legend.appendChild(label);
						legend.appendChild(document.createTextNode(' '));
						legend.appendChild(Torus.ext.options.types['boolean'](i + '-' + j + '-enabled'));
					}
					else {legend.textContent = name;}
				fieldset.appendChild(legend);

				for(var k in Torus.ext.options.dir[i][j]) {
					if(Torus.ext.options.dir[i][j][k].name) {var name = Torus.ext.options.dir[i][j][k].name;}
					else {var name = Torus.util.cap(k);}
					while(name.indexOf('_') != -1) {name = name.replace('_', ' ');}
					if(Torus.ext.options.dir[i][j][k].target) {var option = Torus.ext.options.dir[i][j][k].target;} 
					else {var option = i + '-' + j + '-' + k;}

					var div = document.createElement('div');
						div.id = 'torus-option-value-' + option;
						Torus.ui.ids['torus-option-value-' + option];
						var label = document.createElement('label');
							label.setAttribute('for', 'torus-option-value-' + option + '-input');
							label.textContent = name;
						div.appendChild(label);
						div.appendChild(document.createTextNode(': '));
						div.appendChild(Torus.ext.options.types[Torus.ext.options.dir[i][j][k].type](option));
					fieldset.appendChild(div);
				}
			frag.appendChild(fieldset);
		}
		Torus.ext.options.ui['group_' + i] = frag;
	}
}

Torus.ext.options.render = function(group) {
	if(Torus.ui.ids['window'].firstChild) { //an options group is already rendered, put it back
		Torus.ext.options.ui['group_' + Torus.ext.options.selected] = Torus.util.empty(Torus.ui.ids['window']);
	}

	for(var i = 0; i < Torus.ui.ids['sidebar'].children.length; i++) { //FIXME: what if options isn't active?
		if(Torus.ui.ids['sidebar'].children[i].getAttribute('data-id') == group) {Torus.ui.ids['sidebar'].children[i].classList.add('torus-option-group-selected');}
		else {Torus.ui.ids['sidebar'].children[i].classList.remove('torus-option-group-selected');}
	}

	Torus.ui.ids['window'].appendChild(Torus.ext.options.ui['group_' + group]);
	Torus.ui.ids['sidebar'].appendChild(Torus.ext.options.ui.sidebar);

	if(!group) {Torus.save_options();} //FIXME: when does this happen?
	else {Torus.ext.options.selected = group;}
}

Torus.ext.options.unrender = function(event) {
	Torus.ext.options.ui.sidebar = event.old_sidebar;
	Torus.ext.options.ui['group_' + Torus.ext.options.selected] = event.old_window;
}

Torus.ext.options.types['text'] = function(option) {
	var textarea = document.createElement('textarea');
		textarea.id = 'torus-option-value-' + option + '-input';
		Torus.ui.ids['torus-option-value-' + option + '-input'] = textarea;
		textarea.className = 'torus-option-text';
		textarea.rows = 6;
		textarea.value = Torus.options[option];
		textarea.setAttribute('data-id', option);
		textarea.addEventListener('blur', Torus.ext.options.blur_textarea);
	return textarea;
}
Torus.ext.options.types['string'] = function(option) {
	var input = document.createElement('input');
		input.id = 'torus-option-value-' + option + '-input';
		Torus.ui.ids['torus-option-value-' + option + '-input'] = input;
		input.className = 'torus-option-string';
		input.type = 'text';
		input.value = Torus.options[option];
		input.setAttribute('data-id', option);
		input.addEventListener('blur', Torus.ext.options.blur_string);
	return input;
}
Torus.ext.options.types['number'] = function(option) {
	var input = document.createElement('input');
		input.id = 'torus-option-value-' + option + '-input';
		Torus.ui.ids['torus-option-value-' + option + '-input'] = input;
		input.className = 'torus-option-number';
		input.type = 'number';
		input.value = Torus.options[option];
		input.setAttribute('data-id', option);
		input.addEventListener('blur', Torus.ext.options.blur_number);
	return input;
}
Torus.ext.options.types['boolean'] = function(option) {
	var checkbox = document.createElement('input');
		checkbox.id = 'torus-option-value-' + option + '-input';
		Torus.ui.ids['torus-option-value-' + option + '-input'] = checkbox;
		checkbox.className = 'torus-option-boolean';
		checkbox.type = 'checkbox';
		checkbox.checked = Torus.options[option];
		checkbox.setAttribute('data-id', option);
		checkbox.addEventListener('change', Torus.ext.options.click_boolean);
	return checkbox;
}

Torus.ext.options.blur_textarea = function () {Torus.options[this.getAttribute('data-id')] = this.value;}
Torus.ext.options.blur_string = function () {Torus.options[this.getAttribute('data-id')] = this.value;}
Torus.ext.options.blur_number = function () {Torus.options[this.getAttribute('data-id')] = this.value * 1;}
Torus.ext.options.click_boolean = function () {Torus.options[this.getAttribute('data-id')] = this.checked;}

Torus.ext.options.click_sidebar = function() {Torus.ext.options.render(this.getAttribute('data-id'));}

Torus.ext.options.add_listener('ui', 'activate', function() {Torus.ext.options.render(Torus.ext.options.selected);});
Torus.ext.options.add_listener('ui', 'deactivate', function(event) {
	Torus.ext.options.unrender(event);
	Torus.save_options();
});

Torus.add_listener('ext', 'after_load_options', Torus.ext.options.rebuild);
