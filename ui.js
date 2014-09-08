Torus.ui = {
	window: document.createElement('div'),
	ids: {},
	active: 0,
	viewing: [],

	popup_timeout: 0
};
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
	event.chat.listeners.ui = {};

	var tab = document.createElement('span');
	tab.id = 'torus-tab-' + event.room;
	Torus.ui.ids['tab-' + event.room] = tab;
	tab.setAttribute('data-id', event.room);
	tab.className = 'torus-tab';
	tab.addEventListener('click', function(event) {
		event.preventDefault();
		if(event.shiftKey) {
			document.getSelection().removeAllRanges();
			if(Torus.ui.active != this.getAttribute('data-id')) {Torus.ui.show(this.getAttribute('data-id'));}
		}
		else {Torus.ui.activate(this.getAttribute('data-id'));}
	});
	tab.textContent = Torus.chats[event.room].name;
	if(event.room > 0) {
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

	if(event.room > 0) {
		if(!Torus.options.pings[Torus.chats[event.room].name]) {
			Torus.options.pings[Torus.chats[event.room].name] = {};
			Torus.options.pings[Torus.chats[event.room].name].enabled = true;
			Torus.options.pings[Torus.chats[event.room].name].case_sensitive = {type: 'text', value: ''};
			Torus.options.pings[Torus.chats[event.room].name].case_insensitive = {type: 'text', value: ''};
		}

		Torus.ui.activate(event.room);
	}
}

Torus.ui.remove_room = function(event) {
	if(Torus.ui.active == event.room) {
		if(Torus.chats[event.room].parent) {Torus.ui.activate(Torus.chats[event.room].parent);}
		else {Torus.ui.activate(0);}
	}
	if(Torus.chats[event.room].viewing) {Torus.ui.show(event.room);}

	Torus.ui.ids['tabs'].removeChild(Torus.ui.ids['tab-' + event.room]);
	delete Torus.ui.ids['tab-' + event.room];
}

Torus.ui.render = function() {
	var rooms = [];
	var indexes = [];
	var active = false;
	for(var i = 0; i < Torus.ui.viewing.length; i++) {
		if(Torus.ui.viewing[i] == Torus.ui.active) {active = true;}
		if(Torus.logs.messages[Torus.ui.viewing[i]].length > 0) {
			rooms.push(Torus.logs.messages[Torus.ui.viewing[i]]);
			indexes.push(Torus.logs.messages[Torus.ui.viewing[i]].length - 1);
		}
	}
	if(!active && Torus.logs.messages[Torus.ui.active].length > 0) {
		rooms.push(Torus.logs.messages[Torus.ui.active]);
		indexes.push(Torus.logs.messages[Torus.ui.active].length - 1);
	}

	var frag = document.createDocumentFragment(); //yo these things are so cool
	for(var i = 0; i < Torus.options.messages.general.max.value && rooms.length > 0; i++) {
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
	while(Torus.ui.ids['window'].firstChild) {Torus.ui.ids['window'].removeChild(Torus.ui.ids['window'].firstChild);}
	Torus.ui.ids['window'].appendChild(frag);

	while(Torus.ui.ids['sidebar'].firstChild) {Torus.ui.ids['sidebar'].removeChild(Torus.ui.ids['sidebar'].firstChild);}
	if(Torus.ui.active > 0) {Torus.ui.update_user({room: Torus.ui.active, user: wgUserName});} //FIXME: this is supposed to rerender the userlist

	//FIXME: are these listeners important?
	/*if(Torus.ui.active != 0) {Torus.chats[Torus.ui.active].call_listeners('render');}
	for(var i = 0; i < Torus.ui.viewing.length; i++) {
		if(Torus.ui.viewing[i] > 0) {Torus.chats[Torus.ui.viewing[i]].call_listeners('render');}
	}*/
	Torus.call_listeners(new Torus.classes.UIEvent('render'));
}

Torus.ui.activate = function(room) {
	if(isNaN(room * 1)) {room = Torus.data.domains[room];}
	if(!Torus.chats[room]) {throw new Error('Invalid room ' + room + '. (ui.activate)');}

	var tabs = Torus.ui.ids['tabs'].children;
	for(var i = 0; i < tabs.length; i++) {
		if(tabs[i].id == 'torus-tab-' + Torus.ui.active) {
			var classes = tabs[i].className.split(' ');
			for(var j = 0; j < classes.length; j++) {
				if(classes[j] == 'torus-tab-active') {classes.splice(j, 1); break;}
			}
			tabs[i].className = classes.join(' ');
			break;
		}
	}

	Torus.call_listeners(new Torus.classes.UIEvent('deactivate', Torus.ui.active));

	Torus.ui.active = room;
	for(var i = 0; i < tabs.length; i++) {
		if(tabs[i].id == 'torus-tab-' + room) {tabs[i].className += ' torus-tab-active'; break;}
	}

	while(Torus.ui.ids['info'].firstChild) {Torus.ui.ids['info'].removeChild(Torus.ui.ids['info'].firstChild);}
	while(Torus.ui.ids['window'].firstChild) {Torus.ui.ids['window'].removeChild(Torus.ui.ids['window'].firstChild);}
	while(Torus.ui.ids['sidebar'].firstChild) {Torus.ui.ids['sidebar'].removeChild(Torus.ui.ids['sidebar'].firstChild);}

	if(room > 0) {
		if(!Torus.chats[room].parent) {
			Torus.ui.ids['info'].textContent = 'Public room';
			if(Torus.data.ids[room]) {
				Torus.ui.ids['info'].textContent += ' of ';
				var a = document.createElement('a');
				a.href = 'http://' + Torus.data.ids[room] + '.wikia.com';
				a.addEventListener('click', Torus.ui.click_link);
				a.textContent = Torus.data.ids[room];
				Torus.ui.ids['info'].appendChild(a);
			}
			Torus.ui.ids['info'].appendChild(document.createTextNode('. (' + room + ')'));
		}
		else {
			Torus.ui.ids['info'].textContent = 'Private room of ';
			if(Torus.data.ids[Torus.chats[room].parent]) {
				var a = document.createElement('a');
				a.href = 'http://' + Torus.data.ids[Torus.chats[room].parent] + '.wikia.com';
				a.addEventListener('click', Torus.ui.click_link);
				a.textContent = Torus.data.ids[Torus.chats[room].parent];
				Torus.ui.ids['info'].appendChild(a);
			}
			else {Torus.ui.ids['info'].textContent += Torus.data.ids[Torus.chats[room].parent];}
			Torus.ui.ids['info'].appendChild(document.createTextNode(', between ' + Torus.chats[room].priv_users.slice(0, Torus.chats[room].priv_users.length - 1).join(', ') + ' and ' + Torus.chats[room].priv_users[Torus.chats[room].priv_users.length - 1] + '. (' + room + ')'));
		}
	}
	if(room >= 0) {Torus.ui.render();}

	Torus.ui.ids['window'].scrollTop = Torus.ui.ids['window'].scrollHeight;
	Torus.call_listeners(new Torus.classes.UIEvent('activate', room));
}

Torus.ui.show = function(room) {
	if(isNaN(room * 1)) {room = Torus.data.domains[room];}
	if(room < 0 || !Torus.chats[room]) {throw new Error('Invalid room ' + room + '. (ui.show)');}

	var tabs = Torus.ui.ids['tabs'].children;
	if(Torus.chats[room].viewing) {
		Torus.chats[room].viewing = false;
		for(var i = 0; i < Torus.ui.viewing.length; i++) {
			if(Torus.ui.viewing[i] == room) {Torus.ui.viewing.splice(i, 1);}
		}
		for(var i = 0; i < tabs.length; i++) {
			if(tabs[i].id == 'torus-tab-' + room) {
				var classes = tabs[i].className.split(' ');
				for(var j = 0; j < classes.length; j++) {
					if(classes[j] == 'torus-tab-viewing') {classes.splice(j, 1); break;}
				}
				tabs[i].className = classes.join(' ');
				break;
			}
		}
		Torus.ui.render();
		Torus.call_listeners(new Torus.classes.UIEvent('unshow', room));
		return;
	}
	Torus.ui.viewing.push(room);
	Torus.chats[room].viewing = true;
	for(var i = 0; i < tabs.length; i++) {
		if(tabs[i].id == 'torus-tab-' + room) {tabs[i].className += ' torus-tab-viewing'; break;}
	}

	Torus.ui.render();
	Torus.ui.ids['window'].scrollTop = Torus.ui.ids['window'].scrollHeight;

	Torus.call_listeners(new Torus.classes.UIEvent('show', room));
}

Torus.ui.parse_message = function(event) {
	event.html = event.text;

	while(event.html.indexOf('<') != -1) {event.html = event.html.replace('<', '&lt;');}
	while(event.html.indexOf('>') != -1) {event.html = event.html.replace('>', '&gt;');}

	if(Torus.chats[event.room].parent) {event.html = Torus.util.parse_links(event.html, Torus.chats[Torus.chats[event.room].parent].name);}
	else {event.html = Torus.util.parse_links(event.html, Torus.chats[event.room].name);}

	while(event.html.indexOf('\n') != -1) {event.html = event.html.replace('\n', '<br />');}

	if(data.attrs.name != wgUserName) {
		var pings = (Torus.options.pings.global.case_sensitive.value + '\n' + Torus.options.pings[Torus.chats[event.room].name].case_sensitive.value).split('\n');
		for(var i = 0; i < pings.length; i++) {
			var ping = pings[i];
			if(!ping) {continue;}
			while(ping.indexOf('<') != -1) {ping = ping.replace('<', '&lt;');} //this is a horrible solution
			while(ping.indexOf('>') != -1) {ping = ping.replace('>', '&gt;');}
			var index = Torus.util.text_index(event.html, pings[i]);
			if(index != -1) {
				Torus.ui.ping(event.room);
				event.html = event.html.substring(0, index) + '<span class="torus-message-ping">' + event.html.substring(index, index + ping.length) + '</span>' + event.html.substring(index + ping.length);
				break;
			}
		}
		pings = (Torus.options.pings.global.case_insensitive.value + '\n' + Torus.options.pings[Torus.chats[event.room].name].case_insensitive.value).toLowerCase().split('\n');
		for(var i = 0; i < pings.length; i++) {
			var ping = pings[i];
			if(!ping) {continue;}
			while(ping.indexOf('<') != -1) {ping = ping.replace('<', '&lt;');} //this is a horrible solution
			while(ping.indexOf('>') != -1) {ping = ping.replace('>', '&gt;');}
			var index = Torus.util.text_index(event.html.toLowerCase(), pings[i]);
			if(index != -1) {
				Torus.ui.ping(event.room);
				event.html = event.html.substring(0, index) + '<span class="torus-message-ping">' + event.html.substring(index, index + ping.length) + '</span>' + event.html.substring(index + ping.length);
				break;
			}
		}
	}
}

Torus.ui.add_line = function(event) {
	if(event.text && !event.html) {
		if(Torus.chats[event.room].parent) {event.html = Torus.util.parse_links(event.text, Torus.chats[Torus.chats[event.room].parent].name);}
		else {event.html = Torus.util.parse_links(event.text, Torus.chats[event.room].name);}
	}

	Torus.logs.messages[event.room].push(event);
	//Torus.logs.plain[event.room].push(event); //TODO: this is supposed to be like just text right?

	if(event.room == Torus.ui.active || (Torus.chats[event.room].viewing && Torus.ui.active >= 0)) {
		var scroll = false;
		if(Torus.ui.ids['window'].offsetHeight + Torus.ui.ids['window'].scrollTop >= Torus.ui.ids['window'].scrollHeight) {scroll = true;}
		Torus.ui.ids['window'].appendChild(Torus.ui.render_line(event));
		if(scroll) {Torus.ui.ids['window'].scrollTop = Torus.ui.ids['window'].scrollHeight;}

		if(Torus.ui.ids['window'].children.length > Torus.options.messages.general.max.value) {Torus.ui.ids['window'].removeChild(Torus.ui.ids['window'].children[0]);}
	}
}

Torus.ui.render_line = function(message) { //FIXME: innerHTML +=
	if(message.type != 'io') {throw new Error('Event type must be `io`. (ui.render_line)');}
	var line = document.createElement('div');
	line.className = 'torus-message torus-room-' + message.room;
	if(message.room != Torus.ui.active) {line.className += ' torus-message-inactive';}
	line.innerHTML = '<span class="torus-message-timestamp">[' + Torus.util.timestamp(message.time) + ']</span> <span class="torus-message-room">(' + Torus.chats[message.room].name + ')</span> ';
	switch(message.event) {
		case 'message':
			line.innerHTML += '&lt;<span class="torus-message-usercolor" style="color:' + Torus.util.color_hash(message.user) + ';">' + message.user + '</span>&gt; ' + message.html;
			break;
		case 'me':
			line.innerHTML += '* <span class="torus-message-usercolor" style="color:' + Torus.util.color_hash(message.user) + ';">' + message.user + '</span> ' + message.html;
			break;
		case 'alert':
			line.innerHTML += '== ' + message.html;
			break;
		case 'join':
		case 'rejoin':
		case 'ghost':
			line.innerHTML += '== <span class="torus-message-usercolor" style="color:' + Torus.util.color_hash(message.user) + ';">' + message.user + '</span> ' + message.event + 'ed ' + Torus.chats[message.room].name;
			break;
		case 'part':
			line.innerHTML += '== <span class="torus-message-usercolor" style="color:' + Torus.util.color_hash(message.user) + ';">' + message.user + '</span> left ' + Torus.chats[message.room].name;
			break;
		case 'logout':
			line.innerHTML += '== <span class="torus-message-usercolor" style="color:' + Torus.util.color_hash(message.user) + ';">' + message.user + '</span> logged out';
			break;
		case 'mod':
			line.innerHTML += '== <span class="torus-usercolor" style="color:' + Torus.util.color_hash(message.performer) + '">' + message.performer + '</span> promoted <span class="torus-usercolor" style="color:' + Torus.util.color_hash(message.target) + '">' + message.target + '</span> to chatmod';
			break;
		case 'kick':
		case 'ban':
		case 'unban':
			if(message.event != 'kick') {var tense = 'ned';} //curse you, english language
			else {var tense = 'ed'}
			line.innerHTML += '== <span class="torus-message-usercolor" style="color:' + Torus.util.color_hash(message.performer) + ';">' + message.performer + '</span> ' + message.event + tense + ' <a href="/wiki/User:' + message.target + '" class="torus-message-usercolor" style="color:' + Torus.util.color_hash(message.target) + ';">' + message.target + '</a> (<a href="/wiki/User_talk:' + message.target + '">t</a>|<a href="/wiki/Special:Contributions/' + message.target + '">c</a>|<a href="/wiki/Special:Log/chatban?user=User:' + message.target + '">log</a>|<a href="/wiki/Special:Log/chatconnect?user=' + message.target + '">ccon</a>) from ' + Torus.chats[message.room].name;
			if(message.event == 'ban') {line.innerHTML += ' for ' + message.expiry;}
			break;
		default: throw new Error('Message type ' + message.event + ' is not rendered. (ui.render_line)');
	}
	return line;
}

Torus.ui.update_user = function(event) {
	if(event.room != Torus.ui.active) {return;}

	if(event.user == wgUserName) { //FIXME: this is not actually necessary
		if(!Torus.chats[event.room].userlist[event.user]) {return;} //FIXME: ui.active will call this when there are no users yet

		while(Torus.ui.ids['sidebar'].childNodes.length > 0) {Torus.ui.ids['sidebar'].removeChild(Torus.ui.ids['sidebar'].firstChild);}

		//FIXME: this is really hacky
		var e = {room: event.room};
		for(var i in Torus.chats[event.room].userlist) {
			if(i == wgUserName) {continue;} //otherwise infinite loop
			e.user = i;
			Torus.ui.update_user(e);
		}
	}

	var props = Torus.chats[event.room].userlist[event.user];
	var userlist = Torus.ui.ids['sidebar'].getElementsByTagName('li');

	var li = false;
	for(var i = 0; i < userlist.length; i++) { //check if we're adding a new li or modifying an existing one
		if(userlist[i].className.indexOf('torus-user-' + encodeURIComponent(event.user)) != -1) {
			var li = userlist[i];
			break;
		}
	}
	if(!li) { //TODO: sort staff at top, then mods, then normal users
		var li = document.createElement('li');
		li.setAttribute('data-user', event.user);
		li.addEventListener('mouseover', function(event) {Torus.ui.render_popup(this.getAttribute('data-user'), Torus.ui.active);});
		var sidebar = Torus.ui.ids['sidebar'];
		var added = false;
		for(var i = 0; i < sidebar.children.length; i++) {
			var child = Torus.chats[event.room].userlist[sidebar.children[i].getAttribute('data-user')];
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
		li.className += ' torus-user-staff';

		var icon = document.createElement('img');
		icon.className = 'torus-user-icon-staff';
		icon.src = 'http://images2.wikia.nocookie.net/monchbox/images/f/f3/Icon-staff.png';
		li.appendChild(icon);
	}
	else if(props.mod) {
		li.className += ' torus-user-mod';

		var icon = document.createElement('img');
		icon.className = 'torus-user-icon-mod';
		icon.src = 'http://images2.wikia.nocookie.net/monchbox/images/6/6b/Icon-chatmod.png';
		li.appendChild(icon);
	}

	li.appendChild(document.createTextNode(String.fromCharCode(160))); //&nbsp;

	var span = document.createElement('span');
	span.className = 'torus-user-name';
	if(props.status_state.toLowerCase() == 'away') {span.className += ' torus-user-away';}
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
	var target = Torus.chats[room].userlist[name];
	var user = Torus.chats[room].userlist[wgUserName];

	if(Torus.data.ids[room]) {var domain = Torus.data.ids[room];}
	else if(Torus.data.ids[Torus.chats[room].parent]) {var domain = Torus.data.ids[Torus.chats[room].parent];}
	else {var domain = '';} //anything false is fine

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
		if(domain) {
			var userpage = document.createElement('a');
			userpage.href = 'http://' + domain + '.wikia.com/wiki/User:' + encodeURIComponent(name);
			userpage.textContent = name;
			userpage.addEventListener('click', Torus.ui.click_link);
			info_name.appendChild(userpage);
		}
		else {info_name.textContent = name;}
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

	if(domain) {
		var userlinks = document.createElement('div');
		userlinks.id = 'torus-popup-userlinks';
		var div = document.createElement('div');
			var talk = document.createElement('a');
			talk.className = 'torus-popup-userlink';
			talk.href = 'http://' + domain + '.wikia.com/wiki/User_talk:' + encodeURIComponent(name);
			talk.addEventListener('click', Torus.ui.click_link);
			talk.textContent = 'talk'; //FIXME: i18n
			div.appendChild(talk);

			var contribs = document.createElement('a');
			contribs.className = 'torus-popup-userlink';
			contribs.href = 'http://' + domain + '.wikia.com/wiki/Special:Contributions/' + encodeURIComponent(name);
			contribs.addEventListener('click', Torus.ui.click_link);
			contribs.textContent = 'contribs'; //FIXME: i18n
			div.appendChild(contribs);
		userlinks.appendChild(div);
		div = document.createElement('div');
			var chatban = document.createElement('a');
			chatban.className = 'torus-popup-userlink';
			chatban.href = 'http://' + domain + '.wikia.com/wiki/Special:Log/chatban?page=User:' + encodeURIComponent(name);
			chatban.addEventListener('click', Torus.ui.click_link);
			chatban.textContent = 'ban history'; //FIXME: i18n
			div.appendChild(chatban);

			var chatconnect = document.createElement('a');
			chatconnect.className = 'torus-popup-userlink';
			chatconnect.href = 'http://' + domain + '.wikia.com/wiki/Special:Log/chatconnect?user=' + encodeURIComponent(name);
			chatconnect.addEventListener('click', Torus.ui.click_link);
			chatconnect.textContent = 'chatconnect'; //FIXME: i18n
			div.appendChild(chatconnect);
		userlinks.appendChild(div);
		Torus.ui.ids['popup'].appendChild(userlinks);
	}

	var actions = document.createElement('div');
	actions.id = 'torus-popup-actions';
		var priv = document.createElement('a');
		priv.className = 'torus-popup-action';
		priv.addEventListener('click', function() {Torus.chats[room].open_private([name]);}); //FIXME: closure scope
		priv.textContent = 'Private message'; //FIXME: i18n
		actions.appendChild(priv);

		var blocked = false;
		for(var i = 0; i < Torus.data.blocked.length; i++) {
			if(Torus.data.blocked[i] == name) {blocked = true; break;}
		}
		if(blocked) {
			var block = document.createElement('a');
			block.className = 'torus-popup-action';
			block.addEventListener('click', function() {Torus.io.unblock(name);}); //FIXME: closure scope
			block.textContent = 'Unblock PMs'; //FIXME: i18n
			actions.appendChild(block);
		}
		else {
			var block = document.createElement('a');
			block.className = 'torus-popup-action';
			block.addEventListener('click', function() {Torus.io.block(name);}); //FIXME: closure scope
			block.textContent = 'Block PMs'; //FIXME: i18n
			actions.appendChild(block);
		}

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
				yes.addEventListener('click', function() {Torus.chats[room].mod(name);}); //FIXME: closure scope
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
			kick.addEventListener('click', function() {Torus.chats[room].kick(name);}); //FIXME: closure scope
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
							if(this.value) {Torus.chats[room].ban(name, Torus.util.expiry_to_seconds(this.value), this.parentNode.nextSibling.lastChild.value);}
							else {Torus.chats[room].ban(name, 60 * 60 * 24, this.parentNode.nextSibling.lastChild.value);}
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
							if(expiry) {Torus.chats[room].ban(name, Torus.util.expiry_to_seconds(expiry), this.value);}
							else {Torus.chats[room].ban(name, 60 * 60 * 24, this.value);}
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
						if(expiry) {Torus.chats[room].ban(name, Torus.util.expiry_to_seconds(expiry), this.parentNode.previousSibling.lastChild.value);}
						else {Torus.chats[room].ban(name, 60 * 60 * 24, this.parentNode.previousSibling.previousSibling.lastChild.value);}
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

Torus.ui.ping = function(room) {
	if(isNaN(room * 1)) {room = Torus.data.domains[room];}

	if(Torus.options.pings.general.enabled && Torus.ui.window.parentNode && Torus.data.pinginterval == 0) {
		Torus.data.titleflash = document.title;
		document.title = Torus.options.pings.general.alert.value;
		Torus.data.pinginterval = setInterval(function() {
			if(document.title != Torus.options.pings.general.alert.value) {document.title = Torus.options.pings.general.alert.value;}
			else {document.title = Torus.data.titleflash;}
		}, Torus.options.pings.general.interval.value);
		if(Torus.options.pings.general.beep.value) {
			var beep = document.createElement('audio');
			beep.src = Torus.options.pings.general.sound.value;
			beep.play();
		}
	}
	Torus.call_listeners(new Torus.classes.UIEvent('ping', room));
}

Torus.ui.fullscreen = function() { //FIXME: some kind of position:fixed thing
	if(Torus.data.fullscreen) {return;}
	if(Torus.ui.window.parentNode) {Torus.ui.window.parentNode.removeChild(Torus.ui.window);}
	while(document.body.firstChild) {document.body.removeChild(document.body.firstChild);} //FIXME: bad. bad bad bad
	document.body.appendChild(Torus.ui.window);
	Torus.ui.window.style.height = document.getElementsByTagName('html')[0].clientHeight - 25 + 'px';
	//TODO: change height with resize
	Torus.data.fullscreen = true;
	Torus.call_listeners(new Torus.classes.UIEvent('fullscreen'));
}

Torus.ui.initial = function(event) {
	for(var i = 0; i < event.messages.length; i++) {
		Torus.ui.parse_message(event.messages[i]);

		var log = Torus.logs.messages[event.room];
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
	//userlist is already taken care of because Chat.event_updateUser calls Chat.update_user which ui.update_user listens to
	if(event.room == Torus.ui.active) {Torus.ui.render();}
}

Torus.ui.input = function(event) {
	if(event.keyCode == 13 && !event.shiftKey) {
		event.preventDefault();
		if(Torus.data.history[1] != this.value) {
			Torus.data.history[0] = this.value;
			Torus.data.history.unshift('');
		}
		Torus.data.histindex = 0;

		while(this.value.charAt(0) == '/') {
			if(this.value.indexOf('\n') != -1) {
				var result = Torus.commands.eval(this.value.substring(1, this.value.indexOf('\n')));
				if(result !== undefined) {Torus.alert(result);}
				this.value = this.value.substring(this.value.indexOf('\n') + 1);
			}
			else {
				var result = Torus.commands.eval(this.value.substring(1));
				if(result !== undefined) {Torus.alert(result);}
				this.value = '';
			}
		}
		if(this.value) {
			if(this.value.indexOf('./') == 0) {Torus.chats[Torus.ui.active].send_message(this.value.substring(1), false);}
			else {Torus.chats[Torus.ui.active].send_message(this.value, false);}
			this.value = '';
		}
	}
	else if(event.keyCode == 9) {
		event.preventDefault();
		if(!Torus.data.tabtext) {
			str = this.value;
			while(str[str - 1] == ' ') {str = str.substring(0, str.length - 1);}
			Torus.data.tabpos = str.lastIndexOf(' ') + 1;
			Torus.data.tabtext = str.substring(Torus.data.tabpos);
		}
		var matches = 0;
		for(var user in Torus.chats[Torus.ui.active].userlist) {
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
	else if(event.keyCode == 38 && Torus.data.histindex + 1 < Torus.data.history.length) {
		Torus.data.histindex++;
		this.value = Torus.data.history[Torus.data.histindex];
	}
	else if(event.keyCode == 40 && Torus.data.histindex > 0) {
		Torus.data.histindex--;
		this.value = Torus.data.history[Torus.data.histindex];
	}
	else if(event.keyCode != 39 && event.keyCode != 41) {
		Torus.data.tabtext = '';
		Torus.data.tabindex = 0;
		Torus.data.tabpos = 0;
	}
}

Torus.ui.click_link = function(event) {
	if(!this.href) {return;}
	event.preventDefault();
	window.open(this.href, 'torus');
}

Torus.ui.onload = function() {
	Torus.logs.messages[0] = [];
	Torus.ui.activate(0);
	Torus.ui.show(0);

	var domain = window.location.hostname.substring(0, document.location.hostname.indexOf('.wikia.com'));
	if(domain.indexOf('preview.') == 0) {domain = domain.substring(8);}
	if(Torus.data.domains[domain]) {Torus.local = Torus.data.domains[domain];}
	else {
		Torus.io.spider(function(data) {
			if(!data) {
				//FIXME: if we get here, can we even fetch keys to connect to any chat?
				Torus.alert('This wiki doesn\'t have chat enabled. The local room has been set to Community Central.');
				Torus.local = Torus.data.domains['community'];
			}
			else {
				if(Torus.data.domains) {
					Torus.data.domains[domain] = data.roomId;
					Torus.data.ids[data.roomId] = domain;
				}
				Torus.local = data.roomId;
			}
			if(data.chatkey.key === false) {Torus.alert('You don\'t appear to be logged in - you must have an account to use chat on Wikia. Please [[Special:UserSignup|register]] or [[Special:UserLogin|log in]].');}
			else if(wgCanonicalNamespace == 'Special' && wgTitle == 'Torus' && Torus.options.misc.connection.local.value) {Torus.open(Torus.local, data.chatkey, data.nodeInstance, data.nodePort);} //FIXME: Torus.open
		});
	}

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

		if(Torus.local && Torus.options.misc.connection.local.value) {Torus.open(Torus.local);}
		if(Torus.options.misc.connection.default_rooms.value) {
			var rooms = Torus.options.misc.connection.default_rooms.value.split('\n');
			for(var i = 0; i < rooms.length; i++) {
				if(isNaN(rooms[i] * 1)) {var room = Torus.data.domains[rooms[i]];}
				else {var room = rooms[i];}
				if(!Torus.chats[room]) {Torus.open(rooms[i]);} //could be Torus.local //FIXME: Torus.open
			}
		}
	}
}

//(function() { //I really hate these but it's better then leaking temp variables everywhere
	var css = document.createElement('link');
	css.id  = 'torus-css';
	css.rel = 'stylesheet';
	css.href = 'http://monchbox.wikia.com/wiki/MediaWiki:Torus.js/ui.css?action=raw&ctype=text/css&templates=expand&t=' + (new Date()).getTime();
	css.type = 'text/css';
	css.media = 'screen';
	document.head.appendChild(css);

	Torus.ui.window.id = 'torus';
	Torus.ui.ids['torus'] = Torus.ui.window;

	var tabs = document.createElement('div');
	tabs.id = 'torus-tabs';
	Torus.ui.ids['tabs'] = tabs;
	Torus.ui.window.appendChild(tabs);

	var sidebar = document.createElement('ul');
	sidebar.id = 'torus-sidebar';
	Torus.ui.ids['sidebar'] = sidebar;
	Torus.ui.window.appendChild(sidebar);

	var popup = document.createElement('div');
	popup.id = 'torus-popup';
	Torus.ui.ids['popup'] = popup;
	popup.style.display = 'none';
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

Torus.ui.window.addEventListener('mouseover', function(event) {
	if(Torus.data.pinginterval != 0) {
		clearInterval(Torus.data.pinginterval);
		Torus.data.pinginterval = 0;
		document.title = Torus.data.titleflash;
	}
	//if(Torus.ui.active > 0) {
	//	clearTimeout(Torus.chats[Torus.ui.active].away_timeout);
	//	setTimeout(function() {Torus.chats[Torus.ui.active].set_status('away', ''); Torus.chats[Torus.ui.active].auto_away = true;}, 5 * 60 * 1000);
	//}
});
Torus.ui.ids['sidebar'].onmouseover = Torus.ui.ids['popup'].onmouseover = function(event) {
	clearTimeout(Torus.ui.popup_timeout);
	Torus.ui.popup_timeout = 0;
}
Torus.ui.ids['sidebar'].onmouseout = Torus.ui.ids['popup'].onmouseout = function(event) {
	Torus.ui.popup_timeout = setTimeout(Torus.ui.unrender_popup, 500);
}

Torus.classes.UIEvent = function(event, room) {
	if(!(this instanceof Torus.classes.UIEvent)) {throw new Error('Must call Torus.classes.UIEvent with `new`.');}
	Torus.classes.Event.call(this, 'ui', event, room);
}
Torus.classes.UIEvent.prototype = Object.create(Torus.classes.Event.prototype);

Torus.add_listener('chat', 'new', Torus.ui.add_room);
Torus.add_listener('chat', 'close', Torus.ui.remove_room);

Torus.add_listener('io', 'join', Torus.ui.update_user);
Torus.add_listener('io', 'update_user', Torus.ui.update_user);
Torus.add_listener('io', 'part', Torus.ui.remove_user);
Torus.add_listener('io', 'logout', Torus.ui.remove_user);
Torus.add_listener('io', 'ghost', Torus.ui.remove_user);

Torus.add_listener('io', 'message', Torus.ui.parse_message); //I think it's really important that this goes before add_line
Torus.add_listener('io', 'me', Torus.ui.parse_message); //ditto

Torus.add_listener('io', 'message', Torus.ui.add_line);
Torus.add_listener('io', 'me', Torus.ui.add_line);
Torus.add_listener('io', 'join', Torus.ui.add_line);
Torus.add_listener('io', 'part', Torus.ui.add_line);
Torus.add_listener('io', 'logout', Torus.ui.add_line);
Torus.add_listener('io', 'ghost', Torus.ui.add_line);
Torus.add_listener('io', 'mod', Torus.ui.add_line);
Torus.add_listener('io', 'kick', Torus.ui.add_line);
Torus.add_listener('io', 'ban', Torus.ui.add_line);
Torus.add_listener('io', 'unban', Torus.ui.add_line);

Torus.add_listener('io', 'initial', Torus.ui.initial);

Torus.ui.add_room({room: 0, chat: Torus.chats[0]}); //the status room already exists

{{MediaWiki:Torus.js/commands.js}}

{{MediaWiki:Torus.js/menu.js}}

{{MediaWiki:Torus.js/options.js}}

{{MediaWiki:Torus.js/ccui.js}}

Torus.add_listener('window', 'load', Torus.ui.onload);
