Torus.ui.ping = function(room) {
	if(!Torus.ui.pings.dir['#global'].enabled || !Torus.ui.window.parentNode) {return;}

	if((room != Torus.ui.active && !room.viewing) || Torus.ui.active.id <= 0) {Torus.ui.ids['tab-' + room.domain].classList.add('torus-tab-ping');}

	if(room.parent) {var domain = room.parent.domain;}
	else {var domain = room.domain;}

	if(Torus.data.pinginterval == 0) {
		Torus.data.titleflash = document.title;
		document.title = Torus.ui.pings.dir[domain].alert;
		Torus.data.pinginterval = setInterval(function() {
			if(document.title != Torus.ui.pings.dir[domain].alert) {document.title = Torus.ui.pings.dir[domain].alert;}
			else {document.title = Torus.data.titleflash;}
		}, Torus.ui.pings.dir[domain].interval);
		if(Torus.ui.pings.dir[domain].beep) {
			var beep = document.createElement('audio');
			beep.src = Torus.ui.pings.dir[domain].sound;
			beep.play();
		}
	}
	Torus.call_listeners(new Torus.classes.UIEvent('ping', room));
}

//basically a more specific version of options.js

Torus.ui.pings = new Torus.classes.Extension('pings', -3);
Torus.ui.pings.text = 'Pings';

Torus.ui.pings.dir = {
	'#global': {
		enabled: true,
		alert: 'Activity!',
		interval: 500,
		beep: true,
		sound: 'http://images.wikia.com/monchbox/images/0/01/Beep-sound.ogg',
		regex: [],
		literal: [wgUserName],
	},
}

Torus.ui.pings.selected = '#global';

Torus.ui.pings.ui = {
	sidebar: document.createDocumentFragment(),
};

Torus.ui.pings.rebuild = function() {
	Torus.ui.pings.ui = {};
	Torus.ui.pings.ui.sidebar = document.createDocumentFragment();
	for(var i in Torus.ui.pings.dir) {
		var li = document.createElement('li');
			li.className = 'torus-sidebar-button';
			if(i == Torus.ui.pings.selected) {li.classList.add('torus-sidebar-button-selected');}
			li.setAttribute('data-id', i);
			li.textContent = i;
			li.addEventListener('click', Torus.ui.pings.click_sidebar);
		Torus.ui.pings.ui.sidebar.appendChild(li);

		var frag = document.createDocumentFragment();
		Torus.ui.pings.ui['group_' + i] = frag;
		var fieldset = document.createElement('fieldset');
			fieldset.id = 'torus-pings-' + i + '-fieldset';
			Torus.ui.ids['torus-pings-' + i + '-fieldset'] = fieldset;
			fieldset.className = 'torus-pings-fieldset';
			var legend = document.createElement('legend');
			legend.textContent = i;
			fieldset.appendChild(legend);

			var enabled = document.createElement('div');
				var label = document.createElement('label');
					label.setAttribute('for', 'torus-pings-' + i + '-enabled');
					label.textContent = 'Enabled:'; //FIXME: i18n
				enabled.appendChild(label);
				enabled.appendChild(document.createTextNode(' '));
				var input = document.createElement('input');
					input.id = 'torus-pings-' + i + '-enabled';
					Torus.ui.ids['torus-pings-' + i + '-enabled'] = input;
					input.className = 'torus-option-boolean';
					input.type = 'checkbox';
					input.checked = Torus.ui.pings.dir[i].enabled;
					input.setAttribute('data-id', i);
					input.addEventListener('blur', Torus.ui.pings.blur_enabled);
				enabled.appendChild(input);
			fieldset.appendChild(enabled);

			var alert = document.createElement('div');
				var label = document.createElement('label');
					label.setAttribute('for', 'torus-pings-' + i + '-alert');
					label.textContent = 'Alert:'; //FIXME: i18n
				alert.appendChild(label);
				alert.appendChild(document.createTextNode(' '));
				var input = document.createElement('input');
					input.id = 'torus-pings-' + i + '-alert';
					Torus.ui.ids['torus-pings-' + i + '-alert'] = input;
					input.className = 'torus-option-string';
					input.type = 'text';
					input.value = Torus.ui.pings.dir[i].alert;
					input.setAttribute('data-id', i);
					input.addEventListener('blur', Torus.ui.pings.blur_alert);
				alert.appendChild(input);
			fieldset.appendChild(alert);

			var interval = document.createElement('div');
				var label = document.createElement('label');
					label.setAttribute('for', 'torus-pings-' + i + '-alert');
					label.textContent = 'Interval:'; //FIXME: i18n
				interval.appendChild(label);
				interval.appendChild(document.createTextNode(' '));
				var input = document.createElement('input');
					input.id = 'torus-pings-' + i + '-input';
					Torus.ui.ids['torus-pings-' + i + '-input'] = input;
					input.className = 'torus-option-number';
					input.type = 'number';
					input.value = Torus.ui.pings.dir[i].interval;
					input.setAttribute('data-id', i);
					input.addEventListener('blur', Torus.ui.pings.blur_interval);
				interval.appendChild(input);
			fieldset.appendChild(interval);

			var beep = document.createElement('div');
				var label = document.createElement('label');
					label.setAttribute('for', 'torus-pings-' + i + '-beep');
					label.textContent = 'Enabled:'; //FIXME: i18n
				beep.appendChild(label);
				beep.appendChild(document.createTextNode(' '));
				var input = document.createElement('input');
					input.id = 'torus-pings-' + i + '-beep';
					Torus.ui.ids['torus-pings-' + i + '-beep'] = input;
					input.className = 'torus-option-boolean';
					input.type = 'checkbox';
					input.checked = Torus.ui.pings.dir[i].beep;
					input.setAttribute('data-id', i);
					input.addEventListener('blur', Torus.ui.pings.blur_beep);
				beep.appendChild(input);
			fieldset.appendChild(beep);

			var sound = document.createElement('div');
				var label = document.createElement('label');
					label.setAttribute('for', 'torus-pings-' + i + '-sound');
					label.textContent = 'Sound:'; //FIXME: i18n
				sound.appendChild(label);
				sound.appendChild(document.createTextNode(' '));
				var input = document.createElement('input');
					input.id = 'torus-pings-' + i + '-sound';
					Torus.ui.ids['torus-pings-' + i + '-sound'] = input;
					input.className = 'torus-option-string';
					input.type = 'text';
					input.value = Torus.ui.pings.dir[i].sound;
					input.setAttribute('data-id', i);
					input.addEventListener('blur', Torus.ui.pings.blur_sound);
				sound.appendChild(input);
			fieldset.appendChild(sound);

			var literal = document.createElement('div');
				var label = document.createElement('label');
					label.setAttribute('for', 'torus-pings-' + i + '-literal');
					label.textContent = 'Literal:\n'; //FIXME: i18n
				literal.appendChild(label);
				literal.appendChild(document.createTextNode(' '));
				var textarea = document.createElement('textarea');
					textarea.id = 'torus-pings-' + i + '-literal';
					Torus.ui.ids['torus-pings-' + i + '-literal'] = textarea;
					fieldset.className = 'torus-pings-literal';
					textarea.rows = 5
					textarea.value = Torus.ui.pings.dir[i].literal.join('\n');
					textarea.setAttribute('data-id', i);
					textarea.addEventListener('blur', Torus.ui.pings.blur_literal);
				literal.appendChild(textarea);
			fieldset.appendChild(literal);

			var regex = document.createElement('div');
				var label = document.createElement('label');
					label.setAttribute('for', 'torus-pings-' + i + '-regex');
					label.textContent = 'Regex:\n'; //FIXME: i18n
				regex.appendChild(label);
				regex.appendChild(document.createTextNode(' '));
				var textarea = document.createElement('textarea');
					textarea.id = 'torus-pings-' + i + '-regex';
					Torus.ui.ids['torus-pings-' + i + '-regex'] = textarea;
					fieldset.className = 'torus-pings-regex';
					textarea.rows = 10;
					textarea.value = '';
					for(var j = 0; j < Torus.ui.pings.dir[i].regex.length; j++) {textarea.value += Torus.ui.pings.dir[i].regex[j].toString() + '\n';}
					textarea.setAttribute('data-id', i);
					textarea.addEventListener('blur', Torus.ui.pings.blur_regex);
				regex.appendChild(textarea);
			fieldset.appendChild(regex);
		frag.appendChild(fieldset);
	}

	var add = document.createElement('li');
		add.id = 'torus-pings-add';
		Torus.ui.ids['torus-pings-add'] = add;
		add.className = 'torus-sidebar-button';
		add.textContent = '+ Add';
		add.addEventListener('click', Torus.ui.pings.click_add);
	Torus.ui.pings.ui.sidebar.appendChild(add);

	if(Torus.ui.active == Torus.ui.pings) {
		Torus.util.empty(Torus.ui.ids['sidebar']);
		Torus.util.empty(Torus.ui.ids['window']);
		Torus.ui.pings.render(Torus.ui.pings.selected);
	}
}

Torus.ui.pings.render = function(group) {
	if(!group || typeof group == 'object') {group = Torus.ui.pings.selected;} //group == object when ui.activate fires
	if(group === '') {group = '#global';} //this happens if someone clicks "add", then goes away and comes back

	if(Torus.ui.ids['window'].firstChild) { //a group is already rendered, put it back
		Torus.ui.pings.ui['group_' + Torus.ui.pings.selected] = Torus.util.empty(Torus.ui.ids['window']);
	}

	for(var i = 0; i < Torus.ui.ids['sidebar'].children.length; i++) {
		if(Torus.ui.ids['sidebar'].children[i].getAttribute('data-id') == group) {Torus.ui.ids['sidebar'].children[i].classList.add('torus-sidebar-button-selected');}
		else {Torus.ui.ids['sidebar'].children[i].classList.remove('torus-sidebar-button-selected');}
	}

	Torus.ui.ids['window'].appendChild(Torus.ui.pings.ui['group_' + group]);
	Torus.ui.ids['sidebar'].appendChild(Torus.ui.pings.ui.sidebar);

	if(!group) {Torus.ui.pings.save();} //FIXME: when does this happen?
	else {Torus.ui.pings.selected = group;}
}

Torus.ui.pings.unrender = function(event) {
	Torus.ui.pings.ui.sidebar = event.old_sidebar;
	Torus.ui.pings.ui['group_' + Torus.ui.pings.selected] = event.old_window;
	Torus.ui.pings.save();
}

Torus.ui.pings.click_sidebar = function() {Torus.ui.pings.render(this.getAttribute('data-id'));}

Torus.ui.pings.click_add = function() { //FIXME: this works, but is stupid
	if(!Torus.ui.pings.selected) {return;}

	Torus.ui.pings.ui['group_' + Torus.ui.pings.selected] = Torus.util.empty(Torus.ui.ids['window']);
	for(var i = 0; i < Torus.ui.ids['sidebar'].children.length; i++) {
		Torus.ui.ids['sidebar'].children[i].classList.remove('torus-sidebar-button-selected');
	}
	this.classList.add('torus-sidebar-button-selected');

	Torus.ui.pings.selected = '';
	var add = document.createElement('div');
		var label = document.createElement('label');
			label.setAttribute('for', 'torus-pings-add-input');
			label.textContent = 'Add:'; //FIXME: i18n
		add.appendChild(label);
		add.appendChild(document.createTextNode(' '));
		var input = document.createElement('input');
			input.id = 'torus-pings-add-input';
			Torus.ui.ids['torus-pings-add-input'] = input;
			input.addEventListener('keyup', function() {
				if(event.keyCode == 13) {
					if(!Torus.ui.pings.dir[this.value]) {
						Torus.ui.pings.dir[this.value] = Torus.ui.pings.dir['#global'];
						Torus.ui.pings.dir[this.value].enabled = true;
						Torus.ui.pings.dir[this.value].literal = [];
						Torus.ui.pings.dir[this.value].regex = [];
					}
					Torus.ui.pings.selected = this.value;
					Torus.ui.pings.rebuild();
				}
			});
		add.appendChild(input);
	Torus.ui.ids['window'].appendChild(add);
	input.focus();
}

Torus.ui.pings.blur_enabled = function() {Torus.ui.pings.dir[this.getAttribute('data-id')].enabled = this.checked;}
Torus.ui.pings.blur_alert = function() {Torus.ui.pings.dir[this.getAttribute('data-id')].alert = this.value;}
Torus.ui.pings.blur_interval = function() {Torus.ui.pings.dir[this.getAttribute('data-id')].interval = this.value;}
Torus.ui.pings.blur_beep = function() {Torus.ui.pings.dir[this.getAttribute('data-id')].beep = this.checked;}
Torus.ui.pings.blur_sound = function() {Torus.ui.pings.dir[this.getAttribute('data-id')].sound = this.value;}

Torus.ui.pings.blur_literal = function() {
	var arr = [];
	var pings = this.value.toLowerCase().split('\n');
	for(var i = 0; i < pings.length; i++) {
		if(!pings[i]) {continue;}
		arr.push(pings[i]);
	}
	Torus.ui.pings.dir[this.getAttribute('data-id')].literal = arr;
}
Torus.ui.pings.blur_regex = function() {
	var arr = [];
	var pings = this.value.split('\n');
	for(var i = 0; i < pings.length; i++) {
		var regex = Torus.util.parse_regex(pings[i]);
		if(!regex) {continue;}
		arr.push(regex);
	}
	Torus.ui.pings.dir[this.getAttribute('data-id')].regex = arr;
}

Torus.ui.pings.save = function() {
	var save = {};
	var pings = Torus.ui.pings.dir;
	for(var i in pings) {
		save[i] = {};
		for(var j in pings[i]) {save[i][j] = pings[i][j];}
		save[i].regex = [];
		for(var j = 0; j < pings[i].regex.length; j++) {save[i].regex.push(pings[i].regex[j].toString());}
	}
	window.localStorage.setItem('torus-pings', JSON.stringify(save));
}

Torus.ui.pings.load = function() {
	var load = JSON.parse(window.localStorage.getItem('torus-pings'));
	if(load) {
		for(var i in load) {
			for(var j = 0; j < load[i].regex.length; j++) {
				var regex = Torus.util.parse_regex(load[i].regex[j]);
				if(!regex) {load[i].regex.splice(j, 1); j--;}
				load[i].regex[j] = regex;
			}
			Torus.ui.pings.dir[i] = load[i];
		}
	}
	Torus.ui.pings.rebuild();
}

Torus.ui.pings.add_listener('ui', 'activate', Torus.ui.pings.render);
Torus.ui.pings.add_listener('ui', 'deactivate', Torus.ui.pings.unrender);
Torus.add_listener('window', 'load', Torus.ui.pings.load);
Torus.add_listener('window', 'unload', Torus.ui.pings.save);
