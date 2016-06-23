Torus.options.ui_maxmessages = 200;
Torus.options.ui_showrejoins = false;
Torus.options.ui_timezone = 0;
Torus.options.ui_showemotes = false;
Torus.options.ui_maxemotes = 25;

Torus.options.ui_defaultrooms = [];
Torus.options.ui_joinlocal = true;
Torus.options.ui_showcolors = true;
Torus.options.ui_colorhue = 0;
Torus.options.ui_colorsat = .7;
Torus.options.ui_colorval = .6;
Torus.options.ui_joinchatlinks = true;
Torus.options.ui_linktarget = '_blank';

new Torus.classes.Extension('options', -2);
Torus.ext.options.name = 'options-name';

Torus.ext.options.ui = {
	sidebar: document.createDocumentFragment()
};
//FIXME: fill ext.options.dir with elements from a for i in Torus.options
Torus.ext.options.selected = 'messages';
Torus.ext.options.dir = {};
Torus.ext.options.types = {};

Torus.ext.options.dir.messages = {
	label: 'options-messages',
	general: {
		label: 'options-messages-general',
		max: {
			type: 'number',
			label: 'options-ui_maxmessages',
			target: 'ui_maxmessages',
			default: 200,
			help: 'options-help-ui_maxmessages',
		},
		rejoins: {
			type: 'boolean',
			label: 'options-ui_showrejoins',
			target: 'ui_showrejoins',
			default: false,
			help: 'options-help-ui_showrejoins',
		},
		timezone: {
			type: 'number',
			label: 'options-ui_timezone',
			target: 'ui_timezone',
			default: 0,
			help: 'options-help-ui_timezone',
		},
	},
	emotes: {
		label: 'options-messages-emotes',
		enabled: {
			type: 'boolean',
			target: 'ui_showemotes',
			default: true,
		},
		max: {
			type: 'number',
			label: 'options-ui_maxemotes',
			target: 'ui_maxemotes',
			default: 25,
			help: 'options-help-ui_maxemotes',
		},
	},
};
Torus.ext.options.dir.misc = {
	label: 'options-misc',
	connection: {
		label: 'options-misc-connection',
		local: {
			type: 'boolean',
			label: 'options-ui_joinlocal',
			target: 'ui_joinlocal',
			default: true,
			help: 'options-help-ui_joinlocal',
		},
		default_rooms: {
			type: 'array',
			label: 'options-ui_defaultrooms',
			target: 'ui_defaultrooms',
			default: [],
			help: 'options-help-ui_defaultrooms',
		},
	},
	user_colors: {
		label: 'options-misc-user_colors',
		enabled: {
			type: 'boolean',
			target: 'ui_showcolors',
			default: true,
		},
		hue: {
			type: 'number',
			label: 'options-ui_colorhue',
			target: 'ui_colorhue',
			default: 0,
			help: 'options-help-ui_colorhue',
		},
		sat: {
			type: 'number',
			label: 'options-ui_colorsat',
			target: 'ui_colorsat',
			default: .7,
			help: 'options-help-ui_colorsat',
		},
		val: {
			type: 'number',
			label: 'options-ui_colorval',
			target: 'ui_colorval',
			default: .6,
			help: 'options-help-ui_colorval',
		},
	},
	links: {
		label: 'options-misc-links',
		chat: {
			type: 'boolean',
			label: 'options-ui_joinchatlinks',
			target: 'ui_joinchatlinks',
			default: true,
			help: 'options-help-ui_joinchatlinks',
		},
		target: {
			type: 'string',
			label: 'options-ui_linktarget',
			target: 'ui_linktarget',
			default: '_blank',
			help: 'options-help-ui_linktarget',
		},
	},
};

Torus.ext.options.save = function() {
	var save = {version: Torus.version, data: Torus.options};
	var event = new Torus.classes.ExtEvent('save_options');
	event.options = save;
	Torus.call_listeners(event);
	window.localStorage.setItem('torus-options', JSON.stringify(save));
	
	return save;
}

Torus.ext.options.load = function() {
	var load = JSON.parse(window.localStorage.getItem('torus-options'));
	if(load) {
		if(load.version < 2500) {
			window.localStorage.removeItem('torus-options');
			load.data = {};
		}

		for(var i in load.data) {Torus.options[i] = load.data[i];}
	}
	Torus.call_listeners(new Torus.classes.ExtEvent('load_options'));
	return Torus.options;
}

Torus.ext.options.rebuild = function() {
	Torus.ext.options.ui = {};
	Torus.ext.options.ui.sidebar = document.createDocumentFragment();
	for(var i in Torus.ext.options.dir) {
		var li = document.createElement('li');
			li.className = 'torus-sidebar-button';
			if(i == Torus.ext.options.selected) {li.classList.add('torus-sidebar-button-selected');}
			li.setAttribute('data-id', i);
			li.textContent = Torus.i18n.text(Torus.ext.options.dir[i].label);
			li.addEventListener('click', Torus.ext.options.click_sidebar);
		Torus.ext.options.ui.sidebar.appendChild(li);

		var frag = document.createDocumentFragment();
		for(var j in Torus.ext.options.dir[i]) {
			if(j == 'label') {continue;}
			var fieldset = document.createElement('fieldset');
				fieldset.id = 'torus-option-set-' + i + '-' + j;
				Torus.ui.ids['option-set-' + i + '-' + j] = fieldset;
				var legend = document.createElement('legend');
					if(Torus.ext.options.dir[i][j].enabled && Torus.ext.options.dir[i][j].enabled.type == 'boolean') { //FIXME: target
						var label = document.createElement('label');
							label.setAttribute('for', 'torus-option-value-' + i + '-' + j + '-enabled');
							label.textContent = Torus.i18n.text(Torus.ext.options.dir[i][j].label);
						legend.appendChild(label);
						legend.appendChild(document.createTextNode(' '));
						legend.appendChild(Torus.ext.options.types['boolean'](i + '-' + j + '-enabled'));
					}
					else {legend.textContent = Torus.i18n.text(Torus.ext.options.dir[i][j].label);}
				fieldset.appendChild(legend);

				for(var k in Torus.ext.options.dir[i][j]) {
					if(k == 'label' || k == 'enabled') {continue;}
					var option = Torus.ext.options.dir[i][j][k].target;

					var div = document.createElement('div');
						div.id = 'torus-option-value-' + option;
						Torus.ui.ids['option-value-' + option];
						var label = document.createElement('label');
							label.setAttribute('for', 'torus-option-value-' + option + '-input');
							label.title = Torus.i18n.text(Torus.ext.options.dir[i][j][k].help);
							label.textContent = Torus.i18n.text(Torus.ext.options.dir[i][j][k].label);
						div.appendChild(label);
						div.appendChild(document.createTextNode(': '));
						div.appendChild(Torus.ext.options.types[Torus.ext.options.dir[i][j][k].type](option));
					fieldset.appendChild(div);
				}
			frag.appendChild(fieldset);
		}
		Torus.ext.options.ui['group_' + i] = frag;
	}

	if(Torus.ui.active == Torus.ext.options) {
		Torus.util.empty(Torus.ui.ids['sidebar']);
		Torus.util.empty(Torus.ui.ids['window']);
		Torus.ext.options.render(Torus.ext.options.selected);
	}
}

Torus.ext.options.render = function(group) {
	if(!group || typeof group == 'object') {group = Torus.ext.options.selected;} //group == object when ui.activate fires

	if(Torus.ui.ids['window'].firstChild) { //an options group is already rendered, put it back
		Torus.ext.options.ui['group_' + Torus.ext.options.selected] = Torus.util.empty(Torus.ui.ids['window']);
	}

	for(var i = 0; i < Torus.ui.ids['sidebar'].children.length; i++) {
		if(Torus.ui.ids['sidebar'].children[i].getAttribute('data-id') == group) {Torus.ui.ids['sidebar'].children[i].classList.add('torus-sidebar-button-selected');}
		else {Torus.ui.ids['sidebar'].children[i].classList.remove('torus-sidebar-button-selected');}
	}

	Torus.ui.ids['window'].appendChild(Torus.ext.options.ui['group_' + group]);
	Torus.ui.ids['sidebar'].appendChild(Torus.ext.options.ui.sidebar);

	if(!group) {Torus.ext.options.save();} //FIXME: when does this happen?
	else {Torus.ext.options.selected = group;}
}

Torus.ext.options.unrender = function(event) {
	Torus.ext.options.ui.sidebar = event.old_sidebar;
	Torus.ext.options.ui['group_' + Torus.ext.options.selected] = event.old_window;
	Torus.ext.options.save();
}

Torus.ext.options.types['array'] = function(option) {
	var thing = document.createElement('div');
	return thing;
}
Torus.ext.options.types['text'] = function(option) {
	var textarea = document.createElement('textarea');
		textarea.id = 'torus-option-value-' + option + '-input';
		Torus.ui.ids['option-value-' + option + '-input'] = textarea;
		textarea.classList.add('torus-option-text');
		textarea.rows = 6;
		textarea.value = Torus.options[option];
		textarea.setAttribute('data-id', option);
		textarea.addEventListener('blur', Torus.ext.options.blur_textarea);
	return textarea;
}
Torus.ext.options.types['string'] = function(option) {
	var input = document.createElement('input');
		input.id = 'torus-option-value-' + option + '-input';
		Torus.ui.ids['option-value-' + option + '-input'] = input;
		input.classList.add('torus-option-string');
		input.type = 'text';
		input.value = Torus.options[option];
		input.setAttribute('data-id', option);
		input.addEventListener('blur', Torus.ext.options.blur_string);
	return input;
}
Torus.ext.options.types['number'] = function(option) {
	var input = document.createElement('input');
		input.id = 'torus-option-value-' + option + '-input';
		Torus.ui.ids['option-value-' + option + '-input'] = input;
		input.classList.add('torus-option-number');
		input.type = 'number';
		input.value = Torus.options[option];
		input.setAttribute('data-id', option);
		input.addEventListener('blur', Torus.ext.options.blur_number);
	return input;
}
Torus.ext.options.types['boolean'] = function(option) {
	var checkbox = document.createElement('input');
		checkbox.id = 'torus-option-value-' + option + '-input';
		Torus.ui.ids['option-value-' + option + '-input'] = checkbox;
		checkbox.classList.add('torus-option-boolean');
		checkbox.type = 'checkbox';
		checkbox.checked = Torus.options[option];
		checkbox.setAttribute('data-id', option);
		checkbox.addEventListener('change', Torus.ext.options.click_boolean);
	return checkbox;
}
Torus.ext.options.types['array'] = function(option) {
	var target = Torus.options[option];
	var div = document.createElement('div');
		div.classList.add('torus-option-array');
		var ul = document.createElement('ul');
			for(var i = 0; i < target.length; i++) {ul.appendChild(Torus.ext.options.types['li'](option, i, target[i]));}
		div.appendChild(ul);
		var input = document.createElement('input');
			input.id = 'torus-option-value-' + option + '-input';
			Torus.ui.ids['option-value-' + option + '-input'] = input;
			input.type = 'text';
			input.setAttribute('data-option', option);
			input.addEventListener('keyup', Torus.ext.options.keyup_array_input);
		div.appendChild(input);
	return div;
}
Torus.ext.options.types['li'] = function(option, i, val) {
	var li = document.createElement('li');
		li.textContent = val;
		li.setAttribute('data-i', i);
		li.setAttribute('data-val', val);
		li.setAttribute('data-option', option);
		var span = document.createElement('span');
			span.classList.add('torus-option-array-remove');
			span.textContent = 'X';
			span.addEventListener('click', Torus.ext.options.click_array_remove);
		li.appendChild(span);
	return li;
}

Torus.ext.options.blur_textarea = function() {Torus.options[this.getAttribute('data-id')] = this.value;}
Torus.ext.options.blur_string = function() {Torus.options[this.getAttribute('data-id')] = this.value;}
Torus.ext.options.blur_number = function() {Torus.options[this.getAttribute('data-id')] = this.value * 1;}
Torus.ext.options.click_boolean = function() {Torus.options[this.getAttribute('data-id')] = this.checked;}
Torus.ext.options.keyup_array_input = function() {	
	if(event.keyCode == 13) {
		event.preventDefault();
		var target = Torus.options[this.getAttribute('data-option')];
		this.previousSibling.appendChild(Torus.ext.options.types['li'](this.getAttribute('data-option'), target.length, this.value));
		target.push(this.value);
		this.value = '';
	}
}
Torus.ext.options.click_array_remove = function() {
	for(var el = this.nextSibling; el != null; el = el.nextSibling) {el.setAttribute(el.getAttribute('data-i') * 1 + 1);}
	this.parentNode.parentNode.removeChild(this.parentNode);
	Torus.options[this.parentNode.getAttribute('data-option')].splice(this.parentNode.getAttribute('data-i') * 1, 1);
}

Torus.ext.options.click_sidebar = function() {Torus.ext.options.render(this.getAttribute('data-id'));}

Torus.ext.options.add_listener('ui', 'activate', Torus.ext.options.render);
Torus.ext.options.add_listener('ui', 'deactivate', Torus.ext.options.unrender);

Torus.add_listener('ext', 'load_options', Torus.ext.options.rebuild);
