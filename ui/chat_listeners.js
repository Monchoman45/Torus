Torus.ui.new_room = function(event) {
	/*event.room.add_listener('io', 'initial', Torus.ui.initial);

	event.room.add_listener('io', 'join', Torus.ui.update_user);
	event.room.add_listener('io', 'update_user', Torus.ui.update_user);
	event.room.add_listener('io', 'part', Torus.ui.remove_user);
	event.room.add_listener('io', 'logout', Torus.ui.remove_user);
	event.room.add_listener('io', 'ghost', Torus.ui.remove_user);

	event.room.add_listener('io', 'alert', Torus.ui.add_line);
	event.room.add_listener('io', 'message', Torus.ui.add_line);
	event.room.add_listener('io', 'me', Torus.ui.add_line);
	event.room.add_listener('io', 'join', Torus.ui.add_line);
	event.room.add_listener('io', 'part', Torus.ui.add_line);
	event.room.add_listener('io', 'logout', Torus.ui.add_line);
	event.room.add_listener('io', 'ghost', Torus.ui.add_line);
	event.room.add_listener('io', 'ctcp', Torus.ui.add_line);
	event.room.add_listener('io', 'mod', Torus.ui.add_line);
	event.room.add_listener('io', 'kick', Torus.ui.add_line);
	event.room.add_listener('io', 'ban', Torus.ui.add_line);
	event.room.add_listener('io', 'unban', Torus.ui.add_line);
	event.room.add_listener('io', 'error', Torus.ui.add_line);*/

	if(!event.room.parent && !Torus.ui.pings.dir[event.room.domain]) {
		Torus.ui.pings.dir[event.room.domain] = {};
		for(var i in Torus.ui.pings.dir['#global']) {Torus.ui.pings.dir[event.room.domain][i] = Torus.ui.pings.dir['#global'][i];}
		Torus.ui.pings.dir[event.room.domain].enabled = true;
		Torus.ui.pings.dir[event.room.domain].literal = [];
		Torus.ui.pings.dir[event.room.domain].regex = [];
		Torus.ui.pings.rebuild();
	}

	for(var i in Torus.logs) {
		if(!Torus.logs[i][event.room.domain]) {Torus.logs[i][event.room.domain] = [];}
	}

	event.room.listeners.ui = {};

	event.room.last_viewed = 0;

	if(isNaN(event.room.domain * 1)) {
		event.room.emotes = {};
		Torus.io.jsonp('http://' + event.room.domain + '.wikia.com/api.php?action=query&meta=allmessages&ammessages=Emoticons&format=json', function(result) {
			event.room.emotes = Torus.util.parse_emotes(result.query.allmessages[0]['*']); //FIXME: closure
		});

		event.room.checkuser = false;
		Torus.io.jsonp('http://' + event.room.domain + '.wikia.com/api.php?action=query&list=users&ususers=' + encodeURIComponent(wgUserName) + '&usprop=rights|groups&format=json', function(result) {
			var rights = result.query.users[0].rights;
			var groups = result.query.users[0].groups;
			if(rights.indexOf('checkuser') != -1) {
				event.room.checkuser = true; //FIXME: closure
				if(event.room.domain == Torus.local && !Torus.ext.ccui) {
					Torus.util.load_js('http://@DOMAIN@/wiki/MediaWiki:Torus.js/modules/ext/ccui.js?action=raw&ctype=text/javascript');
				}
			}
			if((rights.indexOf('abusefilter-modify') != -1 || ((event.room.domain == 'community' || event.room.domain == 'c') && rights.indexOf('chatmoderator') != -1)) && !Torus.ext.abusefilter) {
				Torus.util.load_js('http://@DOMAIN@/wiki/MediaWiki:Torus.js/modules/ext/abusefilter.js?action=raw&ctype=text/javascript');
			}
		});
	}
}

Torus.ui.add_room = function(event) {
	if(event.room.id != 0) {Torus.alert(Torus.i18n.text('connecting', '{' + event.room.name + '}'));}

	for(var i = 0; i < Torus.ui.ids['tabs'].children.length; i++) {
		if(Torus.ui.ids['tabs'].children[i].getAttribute('data-id') == event.room.domain) {return;}
	}

	var tab = document.createElement('span');
	tab.id = 'torus-tab-' + event.room.domain;
	Torus.ui.ids['tab-' + event.room.domain] = tab;
	tab.setAttribute('data-id', event.room.domain);
	tab.className = 'torus-tab';
	tab.addEventListener('click', Torus.ui.tab_click);
	if(event.room.id != 0) {tab.textContent = event.room.name;}
	else {tab.textContent = Torus.i18n.text('status');}
	if(event.room.id > 0) {
		var x = document.createElement('span');
		x.className = 'torus-tab-close';
		x.addEventListener('click', function(event) {
			event.stopPropagation();
			Torus.ui.remove_room(Torus.chats[this.parentNode.getAttribute('data-id')]);
		});
		x.textContent = 'x';
		tab.appendChild(x);
	}
	Torus.ui.ids['tabs'].appendChild(tab);

	if(!event.room.parent) {Torus.ui.activate(event.room);}
}

Torus.ui.remove_room = function(room) {
	if(room.connecting || room.connected) {room.disconnect('closed');}

	if(room == Torus.ui.active) {
		if(room.parent) {Torus.ui.activate(room.parent);}
		else {Torus.ui.activate(Torus.chats[0]);} //FIXME: activate the next chat tab to the left
	}
	if(room.viewing) {Torus.ui.show(room);}

	Torus.ui.ids['tabs'].removeChild(Torus.ui.ids['tab-' + room.domain]);
	delete Torus.ui.ids['tab-' + room.domain];
}

Torus.ui.add_line = function(event) {
	if(typeof event.text == 'string' && !event.html) {Torus.ui.parse_message(event);}

	Torus.logs.messages[event.room.domain].push(event);
	//Torus.logs.plain[event.room.domain].push(event); //TODO: this is supposed to be like just text right?

	if(event.room == Torus.ui.active || (event.room.viewing && Torus.ui.active.id > 0)) {
		var scroll = false;
		if(Torus.ui.ids['window'].offsetHeight + Torus.ui.ids['window'].scrollTop >= Torus.ui.ids['window'].scrollHeight) {scroll = true;}
		Torus.ui.ids['window'].appendChild(Torus.ui.render_line(event));
		if(scroll) {Torus.ui.ids['window'].scrollTop = Torus.ui.ids['window'].scrollHeight;}

		if(Torus.options.ui_maxmessages != 0 && Torus.ui.ids['window'].children.length > Torus.options.ui_maxmessages) {Torus.ui.ids['window'].removeChild(Torus.ui.ids['window'].children[0]);}
	}
	else {
		if(event.event == 'message' || event.event == 'me') {
			Torus.ui.ids['tab-' + event.room.domain].classList.add('torus-tab-message');
			if(event.room.parent) {Torus.ui.ping(event.room);}
		}
		else {Torus.ui.ids['tab-' + event.room.domain].classList.add('torus-tab-alert');}

	}
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

	if(event.room.parent && event.room != Torus.ui.active) {Torus.ui.ping(event.room);}
}

Torus.ui.parse_message = function(event) {
	if(!event.ping && event.user != wgUserName && !event.room.parent && event.room != Torus.chats[0] && Torus.ui.pings.dir['#global'].enabled) {
		event.ping = false;
		var text = event.text.toLowerCase();
		var global = Torus.ui.pings.dir['#global'];
		var local = Torus.ui.pings.dir[event.room.domain];

		for(var i = 0; i < global.literal.length; i++) {
			if(text.indexOf(global.literal[i]) != -1) {event.ping = true; break;}
		}
		if(!event.ping && local.enabled) {
			for(var i = 0; i < local.literal.length; i++) {
				if(text.indexOf(local.literal[i]) != -1) {event.ping = true; break;}
			}
		}
		if(!event.ping) {
			for(var i = 0; i < global.regex.length; i++) {
				var test = global.regex[i].test(text)
				global.regex[i].lastIndex = 0;
				if(test) {event.ping = true; break;}
			}
		}
		if(!event.ping && local.enabled) {
			for(var i = 0; i < local.regex.length; i++) {
				var test = local.regex[i].test(text);
				local.regex[i].lastIndex = 0;
				if(test) {event.ping = true; break;}
			}
		}
	}

	if(event.ping) {Torus.ui.ping(event.room);}

	var hooks = {};
	if(Torus.options.ui_showemotes) {
		if(event.room.parent) {var emotes = event.room.parent.emotes;}
		else {var emotes = event.room.emotes;}
		for(var i in emotes) {hooks[i] = Torus.ui.parser.parse_emote;}
	}

	if(event.room.parent) {event.html = Torus.ui.parse_links(event.text, event.room.parent.domain, hooks);}
	else {event.html = Torus.ui.parse_links(event.text, event.room.domain, hooks);}
}

Torus.add_listener('chat', 'new', Torus.ui.new_room);
Torus.add_listener('chat', 'open', Torus.ui.add_room);
