Torus.ui.activate = function(room) {
	if(Torus.ui.active.id >= 0) {Torus.ui.ids['tab-' + Torus.ui.active.domain].classList.remove('torus-tab-active');}
	else {Torus.ui.ids['tab--1'].classList.remove('torus-tab-active');}

	Torus.util.empty(Torus.ui.ids['info']);
	var event = new Torus.classes.UIEvent('deactivate', Torus.ui.active);
	event.old_window = Torus.util.empty(Torus.ui.ids['window']);
	event.old_sidebar = Torus.util.empty(Torus.ui.ids['sidebar']);
	Torus.call_listeners(event);

	Torus.ui.active = room;

	if(room.id >= 0) {
		Torus.ui.ids['tab-' + room.domain].classList.add('torus-tab-active');
		Torus.ui.ids['tab-' + room.domain].classList.remove('torus-tab-ping');
		Torus.ui.ids['tab-' + room.domain].classList.remove('torus-tab-message');
		Torus.ui.ids['tab-' + room.domain].classList.remove('torus-tab-alert');
	}
	else {Torus.ui.ids['tab--1'].classList.add('torus-tab-active');}

	if(room.id > 0) { //chat
		if(!room.parent) {
			Torus.ui.ids['info'].textContent = 'Public room of '; //FIXME: i18n
			var a = document.createElement('a');
				a.href = 'http://' + room.domain + '.wikia.com';
				a.textContent = room.domain;
				a.addEventListener('click', Torus.ui.click_link);
			Torus.ui.ids['info'].appendChild(a);
			Torus.ui.ids['info'].appendChild(document.createTextNode('.'));
		}
		else {
			Torus.ui.ids['info'].textContent = 'Private room of '; //FIXME: i18n
			var a = document.createElement('a');
				a.href = 'http://' + room.parent.domain + '.wikia.com';
				a.textContent = room.parent.domain;
				a.addEventListener('click', Torus.ui.click_link);
			Torus.ui.ids['info'].appendChild(a);
			Torus.ui.ids['info'].appendChild(document.createTextNode(', between ' + room.priv_users.slice(0, room.priv_users.length - 1).join(', ') + ' and ' + room.priv_users[room.priv_users.length - 1] + '.')); //FIXME: i18n
		}
	}
	else { //extension
		if(room.id == 0 || room.id == -1) { //status and menu
			Torus.ui.ids['info'].textContent = 'Torus v' + Torus.pretty_version + ', running on '; //FIXME: i18n
			var a = document.createElement('a');
				a.href = 'http://' + Torus.local + '.wikia.com/wiki/';
				a.textContent = Torus.local;
				a.addEventListener('click', Torus.ui.click_link);
			Torus.ui.ids['info'].appendChild(a);
		}
		else {
			var a = document.createElement('a');
				a.className = 'torus-fakelink';
				a.textContent = '------- Back to menu -------'; //FIXME: i18n
				a.addEventListener('click', Torus.ui.menu.tab_click);
			Torus.ui.ids['info'].appendChild(a);
		}
	}
	if(room.id >= 0) {Torus.ui.render(Torus.ui.ids['window']);}

	Torus.call_listeners(new Torus.classes.UIEvent('activate', room));
}

Torus.ui.show = function(room) {
	if(room.id < 0) {throw new Error('Invalid room ' + room.domain + '. (ui.show)');}

	if(room.viewing) { //unshow
		room.viewing = false;
		for(var i = 0; i < Torus.ui.viewing.length; i++) {
			if(Torus.ui.viewing[i] == room) {Torus.ui.viewing.splice(i, 1);}
		}

		var tab = Torus.ui.ids['tab-' + room.domain];
		tab.classList.remove('torus-tab-viewing');

		Torus.util.empty(Torus.ui.ids['window']);
		Torus.ui.render(Torus.ui.ids['window']);
		Torus.call_listeners(new Torus.classes.UIEvent('unshow', room));
	}
	else { //show
		room.viewing = true;
		Torus.ui.viewing.push(room);

		Torus.ui.ids['tab-' + room.domain].classList.add('torus-tab-viewing');

		Torus.util.empty(Torus.ui.ids['window']);
		Torus.ui.render(Torus.ui.ids['window']);
		Torus.call_listeners(new Torus.classes.UIEvent('show', room));
	}
}
