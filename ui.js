new Torus.classes.Extension('ui', -1);

Torus.ui = {
	window: document.createElement('div'),
	ids: {},
	active: Torus.chats[0],
	viewing: [],
	popup_timeout: 0,
}
Torus.listeners.ui = {
	render: [],
	activate: [],
	deactivate: [],
	show: [],
	unshow: [],
	render_popup: [],
	unrender_popup: [],
	ping: [],
	fullscreen: []
};
Torus.logs = {
	messages: {},
	plain: {},
	socket: {}
};

Torus.ui.add_room = function(event) {
	event.room.listeners.ui = {};

	var tab = document.createElement('span');
	tab.id = 'torus-tab-' + event.room.domain;
	Torus.ui.ids['tab-' + event.room.domain] = tab;
	tab.setAttribute('data-id', event.room.domain);
	tab.className = 'torus-tab';
	tab.addEventListener('click', Torus.ui.tab_click);
	tab.textContent = event.room.name;
	if(event.room.id > 0) {
		var x = document.createElement('span');
		x.className = 'torus-tab-close';
		x.addEventListener('click', function(event) {
			event.stopPropagation();
			Torus.chats[this.parentNode.getAttribute('data-id')].disconnect('closed');
		});
		x.textContent = 'x';
		tab.appendChild(x);
	}
	Torus.ui.ids['tabs'].appendChild(tab);

	if(event.room.id > 0) {
		event.room.add_listener('io', 'join', Torus.ui.update_user);
		event.room.add_listener('io', 'update_user', Torus.ui.update_user);
		event.room.add_listener('io', 'part', Torus.ui.remove_user);
		event.room.add_listener('io', 'logout', Torus.ui.remove_user);
		event.room.add_listener('io', 'ghost', Torus.ui.remove_user);

		event.room.add_listener('io', 'message', Torus.ui.add_line);
		event.room.add_listener('io', 'me', Torus.ui.add_line);
		event.room.add_listener('io', 'join', Torus.ui.add_line);
		event.room.add_listener('io', 'part', Torus.ui.add_line);
		event.room.add_listener('io', 'logout', Torus.ui.add_line);
		event.room.add_listener('io', 'ghost', Torus.ui.add_line);
		event.room.add_listener('io', 'mod', Torus.ui.add_line);
		event.room.add_listener('io', 'kick', Torus.ui.add_line);
		event.room.add_listener('io', 'ban', Torus.ui.add_line);
		event.room.add_listener('io', 'unban', Torus.ui.add_line);

		event.room.add_listener('io', 'initial', Torus.ui.initial);

		if(!event.room.parent && !Torus.options['pings-' + event.room.domain + '-enabled']) {
			Torus.options['pings-' + event.room.domain + '-enabled'] = true;
			Torus.options['pings-' + event.room.domain + '-literal'] = '';
			Torus.options['pings-' + event.room.domain + '-regex'] = '';

			Torus.ext.options.dir.pings[event.room.domain] = {
				enabled: {type: 'boolean'},
				literal: {type: 'text', help: ''}, //FIXME: i18n something
				regex: {type: 'text', help: ''}, //FIXME: i18n something
			};
		}

		for(var i in Torus.logs) {
			if(!Torus.logs[i][event.room.domain]) {Torus.logs[i][event.room.domain] = [];}
		}

		Torus.ui.activate(event.room);
	}
}

Torus.ui.remove_room = function(event) {
	if(event.room == Torus.ui.active) {
		if(event.room.parent) {Torus.ui.activate(event.room.parent);}
		else {Torus.ui.activate(Torus.chats[0]);}
	}
	if(event.room.viewing) {Torus.ui.show(event.room);}

	Torus.ui.ids['tabs'].removeChild(Torus.ui.ids['tab-' + event.room.domain]);
	delete Torus.ui.ids['tab-' + event.room.domain];
}

Torus.ui.render = function(el) {
	if(!el) {el = Torus.ui.ids['window'];}
	var rooms = [];
	var indexes = [];
	var active = false;
	for(var i = 0; i < Torus.ui.viewing.length; i++) {
		if(Torus.ui.viewing[i] == Torus.ui.active) {active = true;}
		if(Torus.logs.messages[Torus.ui.viewing[i].domain].length > 0) {
			rooms.push(Torus.logs.messages[Torus.ui.viewing[i].domain]);
			indexes.push(Torus.logs.messages[Torus.ui.viewing[i].domain].length - 1);
		}
	}
	if(!active && Torus.logs.messages[Torus.ui.active.domain].length > 0) {
		rooms.push(Torus.logs.messages[Torus.ui.active.domain]);
		indexes.push(Torus.logs.messages[Torus.ui.active.domain].length - 1);
	}

	var frag = document.createDocumentFragment(); //yo these things are so cool
	for(var i = 0; i < Torus.options['messages-general-max'] && rooms.length > 0; i++) {
		var message = rooms[0][indexes[0]];
		var source = 0;
		for(var j = 1; j < rooms.length; j++) {
			if(rooms[j][indexes[j]].id > message.id) {
				message = rooms[j][indexes[j]];
				source = j;
			}
		}
		indexes[source]--;
		if(indexes[source] == -1) { //no more messages
			rooms.splice(source, 1);
			indexes.splice(source, 1);
		}
		if(i == 0) {frag.appendChild(Torus.ui.render_line(message));}
		else {frag.insertBefore(Torus.ui.render_line(message), frag.firstChild);}
	}
	el.appendChild(frag);

	//rerender userlist
	//FIXME: now that this is a generalized function, should we still do this or move it somewhere else?
	if(Torus.ui.active.id > 0) {
		//FIXME: this is really hacky
		var e = {room: Torus.ui.active};
		for(var i in Torus.ui.active.userlist) {
			e.user = i;
			Torus.ui.update_user(e);
		}
	}

	el.scrollTop = el.scrollHeight;

	var event = new Torus.classes.UIEvent('render');
	event.target = el;
	Torus.call_listeners(event);
}

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

Torus.ui.parse_message = function(event) {
	event.html = event.text;

	var pinged = false;
	if(event.user != wgUserName) {
		var pings = Torus.options['pings-global-literal'];
		pings += '\n' + Torus.options['pings-' + event.room.domain + '-literal'];

		pings = pings.toLowerCase().split('\n');
		for(var i = 0; i < pings.length; i++) {
			if(!pings[i]) {continue;}
			if(event.text.toLowerCase().indexOf(pings[i]) != -1) {
				Torus.ui.ping(event.room);
				pinged = true;
				break;
			}
		}

		if(!pinged) {
			//FIXME: precompile these instead of recompiling them every time a message is received
			pings = Torus.options['pings-global-regex'];
			pings += '\n' + Torus.options['pings-' + event.room.domain + '-regex'];

			pings = pings.split('\n');
			for(var i = 0; i < pings.length; i++) {
				if(!pings[i]) {continue;}
				var ping = new RegExp(pings[i], 'ig');
				if(ping.test(event.text)) {
					Torus.ui.ping(event.room);
					pinged = true;
					break;
				}
			}
		}
	}

	while(event.html.indexOf('<') != -1) {event.html = event.html.replace('<', '&lt;');}
	while(event.html.indexOf('>') != -1) {event.html = event.html.replace('>', '&gt;');}

	if(pinged) {event.html = '<span class="torus-message-ping">' + event.html + '</span>';} //FIXME: set something on the li instead

	if(event.room.parent) {event.html = Torus.util.parse_links(event.html, event.room.parent.domain);}
	else {event.html = Torus.util.parse_links(event.html, event.room.domain);}

	while(event.html.indexOf('\n') != -1) {event.html = event.html.replace('\n', '<br />');}
}

Torus.ui.add_line = function(event) {
	if(event.text && !event.html) {Torus.ui.parse_message(event);}

	Torus.logs.messages[event.room.domain].push(event);
	//Torus.logs.plain[event.room.domain].push(event); //TODO: this is supposed to be like just text right?

	if(event.room == Torus.ui.active || (event.room.viewing && Torus.ui.active.id >= 0)) {
		var scroll = false;
		if(Torus.ui.ids['window'].offsetHeight + Torus.ui.ids['window'].scrollTop >= Torus.ui.ids['window'].scrollHeight) {scroll = true;}
		Torus.ui.ids['window'].appendChild(Torus.ui.render_line(event));
		if(scroll) {Torus.ui.ids['window'].scrollTop = Torus.ui.ids['window'].scrollHeight;}

		if(Torus.ui.ids['window'].children.length > Torus.options['messages-general-max']) {Torus.ui.ids['window'].removeChild(Torus.ui.ids['window'].children[0]);}
	}
}

Torus.ui.render_line = function(message) {
	if(message.type != 'io') {throw new Error('Event type must be `io`. (ui.render_line)');}

	var line = document.createElement('div');
		line.className = 'torus-message torus-room-' + message.room.domain;
		if(message.room != Torus.ui.active) {line.classList.add('torus-message-inactive');}
		var time = document.createElement('span');
			time.className = 'torus-message-timestamp';
			time.textContent = '[' + Torus.util.timestamp(message.time) + ']';
		line.appendChild(time);
		var viewing = Torus.ui.viewing.length;
		if(Torus.ui.viewing.indexOf(Torus.chats[0]) != -1) {viewing--;}
		if(viewing > 0 || message.room.id == 0) {
			line.appendChild(document.createTextNode(' '));
			var room = document.createElement('span');
				room.className = 'torus-message-room';
				if(message.room.id != 0) {room.textContent = '(' + message.room.name + ')';}
				else {room.textContent = '(status)';}
			line.appendChild(room);
		}
		line.appendChild(document.createTextNode(' '));

		switch(message.event) {
			case 'me':
			case 'message':
				if(message.event == 'message') {line.appendChild(document.createTextNode('  <'));}
				else {line.appendChild(document.createTextNode('*  '));}
				var user = document.createElement('span');
					user.className = 'torus-message-usercolor';
					user.style.color = Torus.util.color_hash(message.user);
					user.textContent = message.user;
				line.appendChild(user);
				if(message.event == 'message') {line.appendChild(document.createTextNode('> '));}
				else {line.appendChild(document.createTextNode(' '));}
				line.innerHTML += message.html; //FIXME: innerHTML +=
				break;
			case 'alert':
				line.appendChild(document.createTextNode('== '));
				line.innerHTML += message.html; //FIXME: innerHTML +=
				break;
			case 'join':
			case 'rejoin':
			case 'ghost':
				//FIXME: i18n - this shows up as "user joined room"
				//FIXME: and ghost is only here because message.event + 'ed' is the correct tense
				line.appendChild(document.createTextNode('== '));
				var user = document.createElement('span');
					user.className = 'torus-message-usercolor';
					user.style.color = Torus.util.color_hash(message.user);
					user.textContent = message.user;
				line.appendChild(user);
				line.appendChild(document.createTextNode(' ' + message.event + 'ed ' + message.room.name));
				break;
			case 'part':
				//FIXME: i18n
				line.appendChild(document.createTextNode('== '));
				var user = document.createElement('span');
					user.className = 'torus-message-usercolor';
					user.style.color = Torus.util.color_hash(message.user);
					user.textContent = message.user;
				line.appendChild(user);
				line.appendChild(document.createTextNode(' left ' + message.room.name));
				break;
			case 'logout':
				//FIXME: i18n
				line.appendChild(document.createTextNode('== '));
				var user = document.createElement('span');
					user.className = 'torus-message-usercolor';
					user.style.color = Torus.util.color_hash(message.user);
					user.textContent = message.user;
				line.appendChild(user);
				line.appendChild(document.createTextNode(' logged out'));
				break;
			case 'mod':
				//FIXME: i18n
				line.appendChild(document.createTextNode('== '));
				var performer = document.createElement('span');
					performer.className = 'torus-message-usercolor';
					performer.style.color = Torus.util.color_hash(message.performer);
					performer.textContent = message.performer;
				line.appendChild(performer);
				line.appendChild(document.createTextNode(' promoted '));
				var target = document.createElement('span');
					target.className = 'torus-message-usercolor';
					target.style.color = Torus.util.color_hash(message.target);
					target.textContent = message.target;
				line.appendChild(target);
				line.appendChild(document.createTextNode(' to chatmod'));
				break;
			case 'kick':
			case 'ban':
			case 'unban':
				//FIXME: i18n
				if(message.event != 'kick') {var tense = 'ned';} //curse you, english language
				else {var tense = 'ed'}
				if(message.room.parent) {var domain = message.room.parent.domain;}
				else {var domain = message.room.domain;}

				line.appendChild(document.createTextNode('== '));
				var performer = document.createElement('span');
					performer.className = 'torus-message-usercolor';
					performer.style.color = Torus.util.color_hash(message.performer);
					performer.textContent = message.performer;
				line.appendChild(performer);
				line.appendChild(document.createTextNode(' ' + message.event + tense + ' '));
				var target = document.createElement('a');
					target.className = 'torus-message-usercolor';
					target.href = 'http://' + domain + '.wikia.com/wiki/User:' + message.target;
					target.style.color = Torus.util.color_hash(message.target);
					target.textContent = message.target;
					target.addEventListener('click', Torus.ui.click_link);
				line.appendChild(target);
				line.appendChild(document.createTextNode(' ('));
				var talk = document.createElement('a');
					talk.href = 'http://' + domain + '.wikia.com/wiki/User_talk:' + message.target;
					talk.textContent = 't';
					talk.addEventListener('click', Torus.ui.click_link);
				line.appendChild(talk);
				line.appendChild(document.createTextNode('|'));
				var talk = document.createElement('a');
					talk.href = 'http://' + domain + '.wikia.com/wiki/Special:Contributions/' + message.target;
					talk.textContent = 'c';
					talk.addEventListener('click', Torus.ui.click_link);
				line.appendChild(talk);
				line.appendChild(document.createTextNode('|'));
				var talk = document.createElement('a');
					talk.href = 'http://' + domain + '.wikia.com/wiki/Special:Log/chatban?page=User:' + message.target;
					talk.textContent = 'log';
					talk.addEventListener('click', Torus.ui.click_link);
				line.appendChild(talk);
				line.appendChild(document.createTextNode('|'));
				var talk = document.createElement('a');
					talk.href = 'http://' + domain + '.wikia.com/wiki/Special:Log/chatconnect?user=' + message.target;
					talk.className = 'torus-fakelink';
					talk.textContent = 'ccon';
					//talk.addEventListener('click', Torus.ui.click_link);
					talk.addEventListener('click', function() { //FIXME: closure, also ccui is not required
						event.preventDefault();
						Torus.ui.activate(Torus.ext.ccui);
						Torus.ext.ccui.query(message.target);
					});
				line.appendChild(talk);
				line.appendChild(document.createTextNode(') from ' + message.room.name));
				if(message.event == 'ban') {line.appendChild(document.createTextNode(' for ' + message.expiry));}
				break;
			default: throw new Error('Message type ' + message.event + ' is not rendered. (ui.render_line)');
		}
	return line;
}

Torus.ui.update_user = function(event) {
	if(event.room != Torus.ui.active) {return;}

	var props = event.room.userlist[event.user];
	var userlist = Torus.ui.ids['sidebar'].getElementsByTagName('li');

	var li = false;
	for(var i = 0; i < userlist.length; i++) { //check if we're adding a new li or modifying an existing one
		if(userlist[i].className.indexOf('torus-user-' + encodeURIComponent(event.user)) != -1) {
			var li = userlist[i];
			break;
		}
	}
	if(!li) {
		var li = document.createElement('li');
		li.setAttribute('data-user', event.user);
		li.addEventListener('mouseover', function(event) {Torus.ui.render_popup(this.getAttribute('data-user'), Torus.ui.active);}); //FIXME: hardcoded function
		var sidebar = Torus.ui.ids['sidebar'];
		var added = false;
		for(var i = 0; i < sidebar.children.length; i++) {
			var child = event.room.userlist[sidebar.children[i].getAttribute('data-user')];
			if((!props.staff && child.staff) || (!props.mod && child.mod)) {continue;}

			if((props.staff && !child.staff) || (props.mod && !child.mod) || Torus.util.compare_strings(event.user, sidebar.children[i].getAttribute('data-user')) < 0) {
				sidebar.insertBefore(li, sidebar.children[i]);
				added = true;
				break;
			}
		}
		if(!added) {sidebar.appendChild(li);} //is at the end of the alphabet
	}

	while(li.firstChild) {li.removeChild(li.firstChild);}

	li.className = 'torus-user torus-user-' + encodeURIComponent(event.user);
	if(props.staff) {
		li.classList.add('torus-user-staff');

		var icon = document.createElement('img');
		icon.className = 'torus-user-icon-staff';
		icon.src = 'http://images2.wikia.nocookie.net/monchbox/images/f/f3/Icon-staff.png';
		li.appendChild(icon);
	}
	else if(props.mod) {
		li.classList.add('torus-user-mod');

		var icon = document.createElement('img');
		icon.className = 'torus-user-icon-mod';
		icon.src = 'http://images2.wikia.nocookie.net/monchbox/images/6/6b/Icon-chatmod.png';
		li.appendChild(icon);
	}

	li.appendChild(document.createTextNode(String.fromCharCode(160))); //&nbsp;

	var span = document.createElement('span');
	span.className = 'torus-user-name';
	if(props.status_state.toLowerCase() == 'away') {span.classList.add('torus-user-away');}
	span.textContent = event.user;
	li.appendChild(span);
}

Torus.ui.remove_user = function(event) {
	if(event.room != Torus.ui.active) {return;}

	var userlist = Torus.ui.ids['sidebar'].getElementsByTagName('li');
	for(var i = 0; i < userlist.length; i++) {
		if(userlist[i].className.indexOf('torus-user-' + encodeURIComponent(event.user)) != -1) {
			userlist[i].parentNode.removeChild(userlist[i]);
			break;
		}
	}
}

Torus.ui.render_popup = function(name, room, coords) {
	var target = room.userlist[name];
	var user = room.userlist[wgUserName];

	while(Torus.ui.ids['popup'].firstChild) {Torus.ui.ids['popup'].removeChild(Torus.ui.ids['popup'].firstChild);}

	var avatar = document.createElement('img');
	avatar.id = 'torus-popup-avatar';
	avatar.src = target.avatar;
	Torus.ui.ids['popup'].appendChild(avatar);

	var info = document.createElement('div');
	info.id = 'torus-popup-info';
	var div = document.createElement('div');
		var info_name = document.createElement('span');
		info_name.id = 'torus-popup-name';
		var userpage = document.createElement('a');
			userpage.href = 'http://' + room.domain + '.wikia.com/wiki/User:' + encodeURIComponent(name);
			userpage.textContent = name;
			userpage.addEventListener('click', Torus.ui.click_link);
		info_name.appendChild(userpage);
		div.appendChild(info_name);

		if(target.mod || target.staff) { //star
			div.appendChild(document.createTextNode(' '));
			var info_access = document.createElement('span');
			info_access.id = 'torus-popup-access';
			var icon = document.createElement('img');
			if(target.staff) {
				icon.className = 'torus-user-icon-staff';
				icon.src = 'http://images2.wikia.nocookie.net/monchbox/images/f/f3/Icon-staff.png';
			}
			else { //target.mod
				icon.className = 'torus-user-icon-mod';
				icon.src = 'http://images2.wikia.nocookie.net/monchbox/images/6/6b/Icon-chatmod.png';
			}
			info_access.appendChild(icon);
			if(!target.staff && target.givemod) {info_access.appendChild(document.createTextNode('+'));}
			div.appendChild(info_access);
		}
		info.appendChild(div);

		var state = document.createElement('div');
		state.id = 'torus-popup-status-state';
		state.textContent = target.status_state;
		info.appendChild(state);

		var message = document.createElement('div');
		message.id = 'torus-popup-status-message';
		message.textContent = target.status_message;
		info.appendChild(message);
	Torus.ui.ids['popup'].appendChild(info);

	var userlinks = document.createElement('div');
	userlinks.id = 'torus-popup-userlinks';
	var div = document.createElement('div');
		var talk = document.createElement('a');
		talk.className = 'torus-popup-userlink';
		talk.href = 'http://' + room.domain + '.wikia.com/wiki/User_talk:' + encodeURIComponent(name);
		talk.addEventListener('click', Torus.ui.click_link);
		talk.textContent = 'talk'; //FIXME: i18n
		div.appendChild(talk);

		var contribs = document.createElement('a');
		contribs.className = 'torus-popup-userlink';
		contribs.href = 'http://' + room.domain + '.wikia.com/wiki/Special:Contributions/' + encodeURIComponent(name);
		contribs.addEventListener('click', Torus.ui.click_link);
		contribs.textContent = 'contribs'; //FIXME: i18n
		div.appendChild(contribs);
	userlinks.appendChild(div);
	div = document.createElement('div');
		var chatban = document.createElement('a');
		chatban.className = 'torus-popup-userlink';
		chatban.href = 'http://' + room.domain + '.wikia.com/wiki/Special:Log/chatban?page=User:' + encodeURIComponent(name);
		chatban.addEventListener('click', Torus.ui.click_link);
		chatban.textContent = 'ban history'; //FIXME: i18n
		div.appendChild(chatban);

		var chatconnect = document.createElement('a');
		chatconnect.className = 'torus-popup-userlink';
		chatconnect.href = 'http://' + room.domain + '.wikia.com/wiki/Special:Log/chatconnect?user=' + encodeURIComponent(name);
		chatconnect.addEventListener('click', Torus.ui.click_link);
		chatconnect.textContent = 'chatconnect'; //FIXME: i18n
		div.appendChild(chatconnect);
	userlinks.appendChild(div);
	Torus.ui.ids['popup'].appendChild(userlinks);

	var actions = document.createElement('div');
	actions.id = 'torus-popup-actions';
		var priv = document.createElement('a');
		priv.className = 'torus-popup-action';
		priv.addEventListener('click', function() {room.open_private([this.getAttribute('data-user')]);}); //FIXME: closure scope
		priv.setAttribute('data-user', name);
		priv.textContent = 'Private message'; //FIXME: i18n
		actions.appendChild(priv);

		var blocked = false;
		for(var i = 0; i < Torus.data.blocked.length; i++) {
			if(Torus.data.blocked[i] == name) {blocked = true; break;}
		}
		var block = document.createElement('a');
		block.className = 'torus-popup-action';
		block.setAttribute('data-user', name);
		if(blocked) {
			block.addEventListener('click', function() {Torus.io.unblock(this.getAttribute('data-user'));});
			block.textContent = 'Unblock PMs'; //FIXME: i18n
		}
		else {
			block.addEventListener('click', function() {Torus.io.block(this.getAttribute('data-user'));});
			block.textContent = 'Block PMs'; //FIXME: i18n
		}
		actions.appendChild(block);

		if((user.givemod || user.staff) && !target.mod && !target.staff) {
			var mod = document.createElement('a');
			mod.className = 'torus-popup-action';
			mod.addEventListener('click', function() {this.children[0].style.display = 'block';});
			var confirm = document.createElement('div');
			confirm.id = 'torus-popup-modconfirm';
				var yes = document.createElement('input');
				yes.id = 'torus-popup-modconfirm-yes';
				yes.type = 'button';
				yes.value = 'Yes'; //FIXME: i18n
				yes.addEventListener('click', function() {room.mod(this.getAttribute('data-user'));}); //FIXME: closure scope
				yes.setAttribute('data-user', name);
				confirm.appendChild(yes);

				confirm.appendChild(document.createTextNode(' Are you sure? ')); //FIXME: i18n

				var no = document.createElement('input');
				no.id = 'torus-popup-modconfirm-no';
				no.type = 'button';
				no.value = 'No'; //FIXME: i18n
				no.addEventListener('click', function() {this.parentNode.style.display = '';});
				confirm.appendChild(no);
			mod.appendChild(confirm);
			mod.appendChild(document.createTextNode('Promote to mod')); //FIXME: i18n
			actions.appendChild(mod);
		}
		else {
			var mod = document.createElement('a');
			mod.className = 'torus-popup-action-disabled';
			mod.textContent = 'Promote to mod'; //FIXME: i18n
			actions.appendChild(mod);
		}

		if(user.staff || user.givemod || (user.mod && !target.givemod && !target.staff)) {
			var kick = document.createElement('a');
			kick.className = 'torus-popup-action';
			kick.addEventListener('click', function() {room.kick(name);}); //FIXME: closure scope
			kick.textContent = 'Kick'; //FIXME: i18n
			actions.appendChild(kick);

			var ban = document.createElement('a');
			ban.className = 'torus-popup-action';
			var modal = document.createElement('div');
				modal.id = 'torus-popup-banmodal';
				var div = document.createElement('div');
					var expiry_label = document.createElement('label');
					expiry_label.for = 'torus-popup-banexpiry';
					expiry_label.textContent = 'Expiry:'; //FIXME: i18n
					div.appendChild(expiry_label);

					div.appendChild(document.createTextNode(' '));

					var expiry = document.createElement('input');
					expiry.id = 'torus-popup-banexpiry';
					expiry.type = 'text';
					expiry.placeholder = '1 day'; //FIXME: i18n
					expiry.addEventListener('keyup', function(event) { //FIXME: closure scope
						if(event.keyCode == 13) {
							if(this.value) {room.ban(name, Torus.util.expiry_to_seconds(this.value), this.parentNode.nextSibling.lastChild.value);}
							else {room.ban(name, 60 * 60 * 24, this.parentNode.nextSibling.lastChild.value);}
						}
					});
					div.appendChild(expiry);
				modal.appendChild(div);
				div = document.createElement('div');
					var reason_label = document.createElement('label');
					reason_label.for = 'torus-popup-banexpiry';
					reason_label.textContent = 'Reason:'; //FIXME: i18n
					div.appendChild(reason_label);

					div.appendChild(document.createTextNode(' '));

					var reason = document.createElement('input');
					reason.id = 'torus-popup-banreason';
					reason.placeholder = 'Misbehaving in chat'; //FIXME: i18n
					reason.addEventListener('keyup', function(event) { //FIXME: closure scope
						if(event.keyCode == 13) {
							var expiry = this.parentNode.previousSibling.lastChild.value;
							if(expiry) {room.ban(name, Torus.util.expiry_to_seconds(expiry), this.value);}
							else {room.ban(name, 60 * 60 * 24, this.value);}
						}
					});
					div.appendChild(reason);
				modal.appendChild(div);
				div = document.createElement('div');
					var submit = document.createElement('input');
					submit.id = 'torus-popup-banbutton';
					submit.type = 'submit'
					submit.value = 'Ban'; //FIXME: i18n
					submit.addEventListener('click', function(event) { //FIXME: closure scope
						var expiry = this.parentNode.previousSibling.previousSibling.lastChild.value;
						if(expiry) {room.ban(name, Torus.util.expiry_to_seconds(expiry), this.parentNode.previousSibling.lastChild.value);}
						else {room.ban(name, 60 * 60 * 24, this.parentNode.previousSibling.previousSibling.lastChild.value);}
					});
				modal.appendChild(div);
			ban.appendChild(modal);
			ban.appendChild(document.createTextNode('Ban')); //FIXME: i18n
			actions.appendChild(ban);
		}
		else {
			var kick = document.createElement('a');
			kick.className = 'torus-popup-action-disabled';
			kick.textContent = 'Kick'; //FIXME: i18n
			actions.appendChild(kick);

			var ban = document.createElement('a');
			ban.className = 'torus-popup-action-disabled';
			ban.textContent = 'Ban'; //FIXME: i18n
			actions.appendChild(ban);
		}
	Torus.ui.ids['popup'].appendChild(actions);

	Torus.ui.ids['popup'].style.display = 'block';
	if(coords) {
		Torus.ui.ids['popup'].style.right = 'auto';
		Torus.ui.ids['popup'].style.left = coords.x + 'px';
		Torus.ui.ids['popup'].style.top = coords.y + 'px';
	}
	else {
		var userlist = Torus.ui.ids['sidebar'].children;
		for(var i = 0; i < userlist.length; i++) {
			if(userlist[i].lastChild.innerHTML == name) {
				if(userlist[i].offsetTop - Torus.ui.ids['sidebar'].scrollTop + Torus.ui.ids['popup'].offsetHeight > Torus.ui.window.offsetHeight) {Torus.ui.ids['popup'].style.top = Torus.ui.window.offsetHeight - Torus.ui.ids['popup'].offsetHeight + 'px';}
				else {Torus.ui.ids['popup'].style.top = userlist[i].offsetTop - Torus.ui.ids['sidebar'].scrollTop + 'px';}
				break;
			}
		}
	}
	var event = new Torus.classes.UIEvent('render_popup');
	event.user = name;
	Torus.call_listeners(event);
}

Torus.ui.unrender_popup = function() {
	Torus.ui.ids['popup'].style.top = '';
	Torus.ui.ids['popup'].style.right = '';
	Torus.ui.ids['popup'].style.left = '';
	Torus.ui.ids['popup'].innerHTML = '';
	Torus.ui.ids['popup'].style.display = 'none';
	Torus.call_listeners(new Torus.classes.UIEvent('unrender_popup'));
}

Torus.ui.ping = function(room) { //FIXME: highlight room name in red or something
	if(room != Torus.ui.active) {Torus.ui.ids['tab-' + room.domain].classList.add('torus-tab-ping');}

	if(Torus.options['pings-general-enabled'] && Torus.ui.window.parentNode && Torus.data.pinginterval == 0) {
		Torus.data.titleflash = document.title;
		document.title = Torus.options['pings-general-alert'];
		Torus.data.pinginterval = setInterval(function() {
			if(document.title != Torus.options['pings-general-alert']) {document.title = Torus.options['pings-general-alert'];}
			else {document.title = Torus.data.titleflash;}
		}, Torus.options['pings-general-interval']);
		if(Torus.options['pings-general-beep']) {
			var beep = document.createElement('audio');
			beep.src = Torus.options['pings-general-sound'];
			beep.play();
		}
	}
	Torus.call_listeners(new Torus.classes.UIEvent('ping', room));
}

Torus.ui.fullscreen = function() {
	if(Torus.data.fullscreen) {
		document.body.removeChild(Torus.ui.window);
		Torus.data.old_parent.appendChild(Torus.ui.window);
		Torus.data.old_parent = null;

		Torus.ui.window.classList.remove('fullscreen');
		Torus.data.fullscreen = false;
		Torus.call_listeners(new Torus.classes.UIEvent('fullscreen')); //FIXME:
	}
	else {
		Torus.data.old_parent = Torus.ui.window.parentNode;
		Torus.ui.window.parentNode.removeChild(Torus.ui.window);
		document.body.appendChild(Torus.ui.window);

		Torus.ui.window.classList.add('fullscreen');
		Torus.data.fullscreen = true;
		Torus.call_listeners(new Torus.classes.UIEvent('fullscreen'));
	}
}

Torus.ui.initial = function(event) {
	for(var i = 0; i < event.messages.length; i++) {
		Torus.ui.parse_message(event.messages[i]);

		var log = Torus.logs.messages[event.room.domain];
		if(log.length == 0) {log.push(event.messages[i]);}
		else {
			var added = false;
			for(var j = log.length - 1; j >= 0; j--) {
				if(event.messages[i].id > log[j].id) {
					log.splice(j + 1, 0, event.messages[i]);
					added = true;
					break;
				}
				else if(event.messages[i].id == log[j].id) {
					log[j] = event.messages[i];
					added = true;
					break;
				}
			}
			if(!added) {log.unshift(event.messages[i]);}
		}
	}
	for(var i = 0; i < event.users.length; i++) {Torus.ui.update_user(event.users[i]);}
	if(event.room == Torus.ui.active) {
		Torus.util.empty(Torus.ui.ids['window']);
		Torus.ui.render(Torus.ui.ids['window']);
	}

	if(event.room.parent) {Torus.ui.ping(event.room);}
}

Torus.ui.input = function(event) {
	if(event.keyCode == 13 && !event.shiftKey) { //enter
		event.preventDefault();
		if(Torus.data.history[1] != this.value) {
			Torus.data.history[0] = this.value;
			Torus.data.history.unshift('');
		}
		Torus.data.histindex = 0;

		if(Torus.ui.active.id >= 0) {
			while(this.value.charAt(0) == '/') {
				if(this.value.charAt(1) == '/') {
					this.value = this.value.substring(1);
					break;
				}
				if(this.value.indexOf('/me') == 0) {break;}
				if(this.value.indexOf('\n') != -1) {
					var command = this.value.substring(1, this.value.indexOf('\n'));
					this.value = this.value.substring(this.value.indexOf('\n') + 1);
				}
				else {
					var command = this.value.substring(1);
					this.value = '';
				}

				var result = Torus.commands.eval(command);
				if(result === false) {Torus.alert('Can\'t find command `' + command.substring(0, command.indexOf(' ')) + '`.');}
				else if(result != undefined) {Torus.alert('' + result);}
			}
		}
		if(this.value) {
			if(this.value.indexOf('./') == 0) {Torus.ui.active.send_message(this.value.substring(1), false);}
			else {Torus.ui.active.send_message(this.value, false);}
			this.value = '';
		}
	}
	else if(event.keyCode == 9 && Torus.ui.active.id > 0) { //tab
		event.preventDefault();
		if(!Torus.data.tabtext) {
			str = this.value;
			while(str[str - 1] == ' ') {str = str.substring(0, str.length - 1);}
			Torus.data.tabpos = str.lastIndexOf(' ') + 1;
			Torus.data.tabtext = str.substring(Torus.data.tabpos);
		}
		var matches = 0;
		for(var user in Torus.ui.active.userlist) {
			if(user == 'length') {continue;}
			if(user.indexOf(Torus.data.tabtext) == 0) {matches++;}
			if(matches > Torus.data.tabindex) {break;}
		}
		if(matches <= Torus.data.tabindex) {
			user = Torus.data.tabtext;
			Torus.data.tabindex = 0;
		}
		else {Torus.data.tabindex++;}
		if(Torus.data.tabpos == 0) {this.value = user + (Torus.data.tabindex == 0 ? '' : ': ');}
		else {this.value = this.value.substring(0, Torus.data.tabpos) + user;}
	}
	else if(event.keyCode == 38 && Torus.data.histindex + 1 < Torus.data.history.length && Torus.ui.active.id > 0) { //up
		Torus.data.histindex++;
		this.value = Torus.data.history[Torus.data.histindex];
	}
	else if(event.keyCode == 40 && Torus.data.histindex > 0 && Torus.ui.active.id > 0) { //down
		Torus.data.histindex--;
		this.value = Torus.data.history[Torus.data.histindex];
	}
	else if(event.keyCode != 39 && event.keyCode != 41 && Torus.ui.active.id > 0) { //anything other than left or right
		Torus.data.tabtext = '';
		Torus.data.tabindex = 0;
		Torus.data.tabpos = 0;
	}
}

Torus.ui.click_link = function(event) {
	if(!this.href) {
		console.log('Torus.ui.click_link called on something with no href: ', this);
		return;
	}
	event.preventDefault();

	if(this.href.indexOf('.wikia.com/wiki/Special:Chat') != -1 && Torus.options['misc-links-chat']) {(new Torus.classes.Chat(this.href.substring(this.href.indexOf('://') + 3, this.href.indexOf('.wikia.com/wiki/Special:Chat')))).connect();}
	else {window.open(this.href, Torus.options['misc-links-target']);}
}

Torus.ui.tab_click = function(event) {
	event.preventDefault();
	var room = Torus.chats[this.getAttribute('data-id')];
	if(event.shiftKey) {
		document.getSelection().removeAllRanges();
		if(Torus.ui.active.domain != room) {Torus.ui.show(room);}
	}
	else {Torus.ui.activate(room);}
}

Torus.ui.onload = function() {
	var domain = window.location.hostname.substring(0, document.location.hostname.indexOf('.wikia.com'));
	if(domain.indexOf('preview.') == 0) {domain = domain.substring(8);}
	if(!domain) {domain = 'localhost';}
	Torus.local = domain;

	Torus.logs.messages[0] = [];
	Torus.ui.activate(Torus.chats[0]);
	Torus.ui.show(Torus.chats[0]);

	if(wgCanonicalNamespace == 'Special' && wgTitle == 'Torus') {
		document.title = 'Torus - It\'s a donut - ' + wgSiteName;
		if(window.skin == 'oasis') {
			var body = 'WikiaArticle';
			if(document.getElementById('WikiaPageHeader')) {
				document.getElementById('WikiaPageHeader').getElementsByTagName('h1')[0].innerHTML = 'Torus';
				document.getElementById('WikiaPageHeader').getElementsByTagName('h2')[0].innerHTML = 'It\'s a donut';
			}
		}
		else {
			var body = 'bodyContent';
			document.getElementById('firstHeading').innerHTML = 'Torus';
		}
		document.getElementById(body).innerHTML = (document.getElementById('AdminDashboardHeader') ? '<div class="AdminDashboardGeneralHeader AdminDashboardArticleHeader"><h1>Torus</h1></div>' : '');
		document.getElementById(body).appendChild(Torus.ui.window);

		if(wgUserName == null) {
			Torus.alert('You don\'t appear to be logged in - you must have an account to use chat on Wikia. Please [[Special:UserSignup|register]] or [[Special:UserLogin|log in]].'); //FIXME: i18n
			return;
		}

		if(Torus.options['misc-connection-local']) {(new Torus.classes.Chat(Torus.local)).connect();}
		if(Torus.options['misc-connection-default_rooms']) {
			var rooms = Torus.options['misc-connection-default_rooms'].split('\n');
			for(var i = 0; i < rooms.length; i++) {
				if(!Torus.chats[rooms[i]]) {(new Torus.classes.Chat(rooms[i])).connect();} //could be Torus.local
			}
		}
	}
}

Torus.ui.sidebar_mouseover = function(event) {
	clearTimeout(Torus.ui.popup_timeout);
	Torus.ui.popup_timeout = 0;
}
Torus.ui.sidebar_mouseout = function(event) {
	Torus.ui.popup_timeout = setTimeout(Torus.ui.unrender_popup, 500);
}
Torus.ui.window_mouseover = function(event) {
	if(Torus.data.pinginterval != 0) {
		clearInterval(Torus.data.pinginterval);
		Torus.data.pinginterval = 0;
		document.title = Torus.data.titleflash;
	}
	//if(Torus.ui.active.id > 0) {
	//	clearTimeout(Torus.ui.active.away_timeout);
	//	setTimeout(function() {Torus.ui.active.set_status('away', ''); Torus.ui.active.auto_away = true;}, 5 * 60 * 1000);
	//}
}

Torus.classes.UIEvent = function(event, room) {
	if(!(this instanceof Torus.classes.UIEvent)) {throw new Error('Must call Torus.classes.UIEvent with `new`.');}
	Torus.classes.Event.call(this, 'ui', event, room);
}
Torus.classes.UIEvent.prototype = Object.create(Torus.classes.Event.prototype);

Torus.util.empty = function(el) {
	var frag = document.createDocumentFragment();
	while(el.firstChild) {frag.appendChild(el.firstChild);}
	return frag;
}

Torus.util.color_hash = function(str) {
	if(str === undefined) {throw new Error('Not enough parameters. (util.color_hash)');}
	str += ''; //cast to string
	var hue = 0;
	var val = Torus.options['misc-user_colors-val'];
	var sat = Torus.options['misc-user_colors-sat'];
	for(var i = 0; i < str.length; i++) {
		hue = 31 * hue + str.charCodeAt(i); //same hash algorithm as webchat, except this is case sensitive
	}
	hue = (hue + Torus.options['misc-user_colors-hue']) % 360;

	//1 letter variables are fun don't you love mathematicians
	var c = val * sat;
	var m = val - c;
	var C = Math.floor((c + m) * 255).toString(16);
	var X = Math.floor((c * (1 - Math.abs((hue / 60) % 2 - 1)) + m) * 255).toString(16);
	var O = Math.floor(m * 255).toString(16);
	if(C.length == 1) {C = '0' + C;}
	if(X.length == 1) {X = '0' + X;}
	if(O.length == 1) {O = '0' + O;}
	switch(Math.floor(hue / 60)) {
		case 0: return '#' + C + X + O;
		case 1: return '#' + X + C + O;
		case 2: return '#' + O + C + X;
		case 3: return '#' + O + X + C;
		case 4: return '#' + X + O + C;
		case 5: return '#' + C + O + X;
	}
}

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

{{MediaWiki:Torus.js/menu.js}}

//(function() { //I really hate these but it's better then leaking temp variables everywhere //FIXME: iffy causes load order problems
	Torus.util.load_css('http://monchbox.wikia.com/wiki/MediaWiki:Torus.js/ui.css?action=raw&ctype=text/css&templates=expand&t=' + (new Date()).getTime());

	Torus.ui.window.id = 'torus';
	Torus.ui.ids['torus'] = Torus.ui.window;

	var tabs = document.createElement('div');
		tabs.id = 'torus-tabs';
		Torus.ui.ids['tabs'] = tabs;
		var menu = document.createElement('span');
			menu.id = 'torus-tab--1';
			Torus.ui.ids['tab--1'] = menu;
			menu.setAttribute('data-id', '-1');
			menu.className = 'torus-tab';
			menu.addEventListener('click', Torus.ui.menu.tab_click);
			var img = document.createElement('img');
				img.src = 'http://images2.wikia.nocookie.net/__cb20110812214252/monchbox/images/a/a1/Gear_icon.png';
				img.width = '18';
			menu.appendChild(img);
			menu.appendChild(document.createTextNode(String.fromCharCode(160))); //&nbsp;
			menu.appendChild(document.createTextNode('menu'));
		tabs.appendChild(menu);
	Torus.ui.window.appendChild(tabs);

	var sidebar = document.createElement('ul');
		sidebar.id = 'torus-sidebar';
		Torus.ui.ids['sidebar'] = sidebar;
		sidebar.addEventListener('mouseover', Torus.ui.sidebar_mouseover);
		sidebar.addEventListener('mouseout', Torus.ui.sidebar_mouseout);
	Torus.ui.window.appendChild(sidebar);

	var popup = document.createElement('div');
		popup.id = 'torus-popup';
		Torus.ui.ids['popup'] = popup;
		popup.style.display = 'none';
		popup.addEventListener('mouseover', Torus.ui.sidebar_mouseover);
		popup.addEventListener('mouseout', Torus.ui.sidebar_mouseout);
	Torus.ui.window.appendChild(popup);

	var info = document.createElement('div');
		info.id = 'torus-info';
		Torus.ui.ids['info'] = info;
	Torus.ui.window.appendChild(info);

	var wind = document.createElement('div');
		wind.id = 'torus-window';
		Torus.ui.ids['window'] = wind;
	Torus.ui.window.appendChild(wind);

	var input = document.createElement('div');
		input.id = 'torus-input';
		Torus.ui.ids['input'] = input;
		var inputbox = document.createElement('textarea');
			inputbox.id = 'torus-input-box';
			Torus.ui.ids['input-box'] = inputbox;
			inputbox.onkeydown = Torus.ui.input;
		input.appendChild(inputbox);
	Torus.ui.window.appendChild(input);
//})();

Torus.ui.window.addEventListener('mouseover', Torus.ui.window_mouseover);

Torus.add_listener('chat', 'new', Torus.ui.add_room);
Torus.add_listener('chat', 'close', Torus.ui.remove_room);

Torus.ui.add_room({room: Torus.chats[0]}); //the status room already exists

Torus.add_listener('window', 'load', Torus.ui.onload);

{{MediaWiki:Torus.js/commands.js}}

{{MediaWiki:Torus.js/options.js}}

{{MediaWiki:Torus.js/ext/ccui.js}}
