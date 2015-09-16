Torus.ui.activate = function(room) {
	if(Torus.ui.active.id >= 0) {Torus.ui.ids['tab-' + Torus.ui.active.domain].classList.remove('torus-tab-active');}
	else {Torus.ui.ids['tab--1'].classList.remove('torus-tab-active');}

	if(Torus.ui.active.id >= 0) {Torus.ui.active.last_viewed = (new Date()).getTime();}
	for(var i = 0; i < Torus.ui.viewing.length; i++) {Torus.ui.viewing[i].last_viewed = (new Date()).getTime();}

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
			var link = document.createElement('a');
			link.href = 'http://' + room.domain + '.wikia.com/wiki/';
			link.textContent = room.domain;
			link.addEventListener('click', Torus.ui.click_link);

			Torus.ui.ids['info'].appendChild(Torus.i18n.html('info-public', link));
		}
		else {
			var link = document.createElement('a');
			link.href = 'http://' + room.parent.domain + '.wikia.com/wiki/';
			link.textContent = room.parent.domain;
			link.addEventListener('click', Torus.ui.click_link);

			Torus.ui.ids['info'].appendChild(Torus.i18n.html('info-private', link, document.createTextNode(room.priv_users.slice(0, room.priv_users.length - 1).join(', ') + ' ' + Torus.i18n.text('and') + ' ' + room.priv_users[room.priv_users.length - 1])));
		}
	}
	else { //extension
		if(room.id == 0 || room.id == -1) { //status and menu
			var link = document.createElement('a');
			link.href = 'http://' + Torus.local + '.wikia.com/wiki/';
			link.textContent = Torus.local;
			link.addEventListener('click', Torus.ui.click_link);

			Torus.ui.ids['info'].appendChild(Torus.i18n.html('info-menu', document.createTextNode(Torus.pretty_version), link));
		}
		else {
			var link = document.createElement('a');
				link.className = 'torus-fakelink';
				link.textContent = '------- ' + Torus.i18n.text('info-menu-back') + ' -------';
				link.addEventListener('click', Torus.ui.menu.tab_click);
			Torus.ui.ids['info'].appendChild(link);
		}
	}
	if(room.id >= 0) {Torus.ui.render(Torus.ui.ids['window']);}

	Torus.call_listeners(new Torus.classes.UIEvent('activate', room));
}

Torus.ui.show = function(room) {
	if(room.id < 0) {throw new Error('Invalid room ' + room.domain + '. (ui.show)');}

	if(Torus.ui.active.id >= 0) {Torus.ui.active.last_viewed = (new Date()).getTime();}
	for(var i = 0; i < Torus.ui.viewing.length; i++) {Torus.ui.viewing[i].last_viewed = (new Date()).getTime();}

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
