Torus.io.sendMessage = function(room, message, hist) {
	if(isNaN(room * 1)) {room = Torus.data.domains[room];}
	if(!Torus.chats[room] || room < 0) {throw new Error('Invalid room ' + room + '. (io.sendMessage)');}

	message += '';
	if(room == 0) {Torus.alert(message);}
	else {
		if((hist || hist == undefined) && Torus.data.history[1] != message) {
			Torus.data.history[0] = message;
			Torus.data.history.unshift('');
		}
		Torus.data.histindex = 0;

		if(Torus.chats[room].parent) {Torus.io.sendCommand(Torus.chats[room].parent, 'openprivate', {roomId: room, users: Torus.chats[room].users});}

		message = {attrs: {msgType: 'chat', 'text': message}};
		Torus.chats[room].socket.send(JSON.stringify(message));
	}
}

Torus.io.sendCommand = function(room, command, args) {
	if(isNaN(room * 1)) {room = Torus.data.domains[room];}
	if(!Torus.chats[room] || room < 0) {throw new Error('Invalid room ' + room + '. (io.sendCommand)');}

	var command = {attrs: {msgType: 'command', command: command}};
	for(var i in args) {command.attrs[i] = args[i];}
	Torus.chats[room].socket.send(JSON.stringify(command));
}

Torus.io.setStatus = function(room, state, message) {
	if(isNaN(room * 1)) {room = Torus.data.domains[room];}
	if(!Torus.chats[room] || room <= 0) {throw new Error('Invalid room ' + room + '. (io.setStatus)');}

	var user = Torus.chats[room].userlist[wgUserName];
	if(!state) {state = user.statusState;}
	if(!message) {message = user.statusMessage;}
	user.oldState = user.statusState;
	user.oldMessage = user.statusMessage;
	Torus.io.sendCommand(room, 'setstatus', {statusState: state, statusMessage: message});
}

Torus.io.giveMod = function(room, user) {
	if(isNaN(room * 1)) {room = Torus.data.domains[room];}
	if(!Torus.chats[room] || room <= 0) {throw new Error('Invalid room ' + room + '. (io.giveMod)');}

	Torus.io.sendCommand(room, 'givechatmod', {userToPromote: user});
}

Torus.io.kick = function(room, user) {
	if(isNaN(room * 1)) {room = Torus.data.domains[room];}
	if(!Torus.chats[room] || room <= 0) {throw new Error('Invalid room ' + room + '. (io.kick)');}

	Torus.io.sendCommand(room, 'kick', {userToKick: user});
}

Torus.io.ban = function(room, user, expiry, reason) {
	if(isNaN(room * 1)) {room = Torus.data.domains[room];}
	if(!Torus.chats[room] || room <= 0) {throw new Error('Invalid room ' + room + '. (io.ban)');}

	if(!expiry) {expiry = 0;} //this is also an unban
	else if(typeof expiry == 'string') {expiry = Torus.util.expiryToSeconds(expiry);}
	if(!reason) {
		if(expiry) {reason = 'Misbehaving in chat';} //is a ban
		else {reason = 'undo';} //is an unban
	}
	Torus.io.sendCommand(room, 'ban', {userToBan: user, reason: reason, time: expiry});
}

Torus.io.openPrivate = function(room, users, callback, id) {
	if(isNaN(room * 1)) {room = Torus.data.domains[room];}
	if(!Torus.chats[room] || room <= 0) {throw new Error('Invalid room ' + room + '. (io.openPrivate)');}	

	var username = false;
	for(var i in users) {
		if(users[i] == wgUserName) {username = true; break;}
	}
	if(!username) {users.push(wgUserName);}

	if(!id) {
		Torus.io.getPrivateId(users, function(id) {
			return Torus.io.openPrivate(room, users, callback, id);
		});
	}
	else {
		if(!Torus.chats[id]) {
			Torus.open(id);
			Torus.chats[id].parent = room;
			Torus.chats[id].users = users;
			if(typeof callback == 'function') {Torus.chats[id].addListener('open', callback);}
		}
		else {
			Torus.ui.activate(id);
			if(typeof callback == 'function') {callback.call(Torus.chats[id]);}
		}
	}
}

Torus.io.ajax = function(method, post, callback) {
	var str = '';
	for(var i in post) {
		str += '&' + i + '=' + encodeURIComponent(post[i]);
	}
	str = str.substring(1);
	var xhr = new XMLHttpRequest();
	xhr.open('POST', '/index.php?action=ajax&rs=ChatAjax&method=' + method + '&client=Torus&version=' + Torus.version, true);
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xhr.onreadystatechange = function() {
		if(this.readyState == 4) {
			if(this.status == 200) {
				if(typeof callback == 'function') {callback.call(Torus, this.responseText);}
			}
			else {throw new Error('Request returned response ' + this.status + '. (io.ajax)');}
		}
	}
	xhr.send(str);
}

Torus.io.getPrivateId = function(users, callback) {
	Torus.io.ajax('getPrivateRoomId', {users: JSON.stringify(users)}, function(data) {
		if(typeof callback == 'function') {callback.call(Torus, JSON.parse(data).id);}
	});
}

Torus.io.getBlockedPrivate = function(callback) {
	Torus.io.ajax('getListOfBlockedPrivate', {}, function(data) {
		data = JSON.parse(data);
		Torus.data.blockedBy = data.blockedByChatUsers;
		Torus.data.blocked = data.blockedChatUsers;
		if(typeof callback == 'function') {callback.call(Torus, data);}
	});
}

Torus.io.block = function(user, callback) {
	Torus.io.ajax('blockOrBanChat', {userToBan: user, dir: 'add'}, function(data) {
		Torus.data.blocked.push(user);
		if(typeof callback == 'function') {callback.call(Torus, JSON.parse(data));}
	});
}

Torus.io.unblock = function(user, callback) {
	Torus.io.ajax('blockOrBanChat', {userToBan: user, dir: 'remove'}, function(data) {
		for(var i = 0; i < Torus.data.blocked.length; i++) {
			if(Torus.data.blocked[i] == user) {Torus.data.blocked.splice(i, 1); break;}
		}
		if(typeof callback == 'function') {callback.call(Torus, JSON.parse(data));}
	});
}

Torus.io.spider = function(callback) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', '/wikia.php?controller=Chat&format=json&client=Torus&version=' + Torus.version, true);
	xhr.onreadystatechange = function() {
		if(this.readyState == 4) {
			if(this.status == 200) {
				if(typeof callback == 'function') {callback.call(Torus, JSON.parse(this.responseText));}
			}
			else if(this.status == 404) { //wiki doesn't have chat
				if(typeof callback == 'function') {callback.call(Torus, null);}
			}
			else {throw new Error('Request returned response ' + this.status + '. (io.spider)');}
		}
	};
	xhr.send();
}

Torus.io.session = function(room, key, server, port, callback) {
	if(isNaN(room * 1)) {room = Torus.data.domains[room];}
	if(!Torus.chats[room] || room <= 0) {throw new Error('Invalid room ' + room + '. (io.session)');}

	if(key === false) {throw new Error('\'key\' is false. (io.session)');}
	else if(!key || typeof key == 'function') { //key is callback
		Torus.io.spider(function(data) {
			if(!data) {throw new Error('Can\'t spider: wiki does not have chat. (io.session)');}

			if(data.chatkey.key === false) {var realkey = false;}
			else {var realkey = data.chatkey;}
			Torus.io.session(room, realkey, data.nodeHostname, data.nodePort, key);
		});
	}
	else {
		var index = io.j.length;
		var script = document.createElement('script');
		script.src = 'http://' + server + ':' + port + '/socket.io/1/?name=' + encodeURIComponent(wgUserName) + '&key=' + key + '&roomId=' + room + '&jsonp=' + index + '&client=Torus&version=' + Torus.version;
		script.onload = function() {document.head.removeChild(this);}
		document.head.appendChild(script);
		Torus.io.polling++;
		io.j.push(function(data) {
			Torus.io.polling--;
			if(Torus.io.polling == 0) {io.j = [];}
			if(typeof data == 'string') {data = data.substring(0, data.indexOf(':'));} //otherwise it's an Error
			if(typeof callback == 'function') {callback.call(Torus, data);}
		});
	}
}

Torus.io.receive = function(room, message) {
	if(isNaN(room * 1)) {room = Torus.data.domains[room];}
	if(!Torus.chats[room] || room <= 0) {throw new Error('Invalid room ' + room + '. (io.receive)');}

	data = JSON.parse(message.data);

	var event = {
		event: message.event,
		type: 'io',
		id: (new Date()).getTime(),
		room: room,
		time: (new Date()).getTime()
	};
	switch(message.event) {
		case 'initial':
			event.users = [];
			for(var i = 0; i < data.collections.users.models.length; i++) {
				var attrs = data.collections.users.models[i].attrs;
				var props = {
					avatar: attrs.avatarSrc.replace('28px', '100px'), //enlarge the avatar
					mod: attrs.isModerator,
					staff: attrs.isStaff,
					givemod: attrs.isCanGiveChatMod,
					statusState: attrs.statusState,
					statusMessage: attrs.statusMessage,
					edits: attrs.editCount
				};
				Torus.ui.updateUser(room, attrs.name, props);
				event.users.push({
					event: 'updateUser',
					type: 'io',
					id: (new Date()).getTime(),
					room: room,
					time: (new Date()).getTime(),
					user: attrs.name,
					props: props
				});
			}
			event.messages = [];
			for(var i = 0; i < data.collections.chats.models.length; i++) {
				var attrs = data.collections.chats.models[i].attrs;
				var e = {
					type: 'io',
					id: attrs.timeStamp,
					room: room,
					time: attrs.timeStamp,
					user: attrs.name
				};
				if(attrs.text.indexOf('* ' + attrs.name) == 0) {
					e.event = 'me';
					e.rawtext = e.text = attrs.text.substring(attrs.name.length + 3);
				}
				else if(attrs.text.indexOf('/me') == 0) {
					event.event = 'me';
					event.rawtext = event.text = data.attrs.text.substring(4);
				}
				else {
					e.event = 'message';
					e.rawtext = e.text = attrs.text;
				}
				while(e.text.indexOf('<') != -1) {e.text = e.text.replace('<', '&lt;');}
				while(e.text.indexOf('>') != -1) {e.text = e.text.replace('>', '&gt;');}
				e.text = Torus.util.parseLinks(e.text, (Torus.chats[room].parent ? Torus.chats[room].parent : room));
				event.messages.push(e);
				var log = Torus.logs.messages[room];
				if(log.length == 0) {log.push(e);}
				else {
					var added = false;
					for(var j = log.length - 1; j >= 0; j--) {
						if(e.id > log[j].id) {
							log.splice(j + 1, 0, e);
							added = true;
							break;
						}
						else if(e.id == log[j].id) {
							log[j] = e;
							added = true;
							break;
						}
					}
					if(!added) {log.unshift(e);}
				}
			}
			Torus.ui.render();

			if(Torus.chats[room].parent) {
				event.parent = Torus.chats[room].parent;
				Torus.ui.ping(Torus.chats[room].parent);
			}
			//Torus.chats[room].awayTimeout = setTimeout('Torus.io.setStatus(' + Torus.ui.active + ', \'away\', \'\'); Torus.chats[' + Torus.ui.active + '].autoAway = true;', 5 * 60 * 1000);
			break;
		case 'chat:add':
			if(!data.attrs.isInlineAlert) {
				if(data.attrs.text.indexOf('* ' + data.attrs.name) == 0) {
					event.event = 'me';
					event.rawtext = event.text = data.attrs.text.substring(data.attrs.name.length + 3);
				}
				else if(data.attrs.text.indexOf('/me') == 0) {
					event.event = 'me';
					event.rawtext = event.text = data.attrs.text.substring(4);
				}
				else {
					event.event = 'message';
					event.rawtext = event.text = data.attrs.text;
				}
				event.user = data.attrs.name;
				event.id = data.attrs.timeStamp;
				event.time = data.attrs.timeStamp;

				while(event.text.indexOf('<') != -1) {event.text = event.text.replace('<', '&lt;');}
				while(event.text.indexOf('>') != -1) {event.text = event.text.replace('>', '&gt;');}
				event.text = Torus.util.parseLinks(event.text, (Torus.chats[room].parent ? Torus.chats[room].parent : room));
				while(event.text.indexOf('\n') != -1) {event.text = event.text.replace('\n', '<br />');}
				if(data.attrs.name != wgUserName) {
					var pings = (Torus.options.pings.global.case_sensitive.value + '\n' + Torus.options.pings[(Torus.data.ids[room] ? Torus.data.ids[room] : room)].case_sensitive.value).split('\n');
					for(var i = 0; i < pings.length; i++) {
						var ping = pings[i];
						if(!ping) {continue;}
						while(ping.indexOf('<') != -1) {ping = ping.replace('<', '&lt;');} //this is a horrible solution
						while(ping.indexOf('>') != -1) {ping = ping.replace('>', '&gt;');}
						var index = Torus.util.textIndex(event.text, pings[i]);
						if(index != -1) {
							Torus.ui.ping(room);
							event.text = event.text.substring(0, index) + '<span class="torus-message-ping">' + event.text.substring(index, index + ping.length) + '</span>' + event.text.substring(index + ping.length);
							break;
						}
					}
					pings = (Torus.options.pings.global.case_insensitive.value + '\n' + Torus.options.pings[(Torus.data.ids[room] ? Torus.data.ids[room] : room)].case_insensitive.value).toLowerCase().split('\n');
					for(var i = 0; i < pings.length; i++) {
						var ping = pings[i];
						if(!ping) {continue;}
						while(ping.indexOf('<') != -1) {ping = ping.replace('<', '&lt;');} //this is a horrible solution
						while(ping.indexOf('>') != -1) {ping = ping.replace('>', '&gt;');}
						var index = Torus.util.textIndex(event.text.toLowerCase(), pings[i]);
						if(index != -1) {
							Torus.ui.ping(room);
							event.text = event.text.substring(0, index) + '<span class="torus-message-ping">' + event.text.substring(index, index + ping.length) + '</span>' + event.text.substring(index + ping.length);
							break;
						}
					}
				}
			}
			else if(data.attrs.wfMsg) {
				switch(data.attrs.wfMsg) {
					case 'chat-inlinealert-a-made-b-chatmod':
						event.event = 'mod';
						event.performer = data.attrs.msgParams[0];
						event.target = data.attrs.msgParams[1];
						break;
					case 'chat-err-connected-from-another-browser':
						//todo: make this its own event
						event.event = 'alert';
						event.rawtext = event.text = 'You are connected to ' + (Torus.data.ids[room] ? Torus.data.ids[room] : room) + ' from another window.';
						break;
					default:
						console.log(event);
						break;
				}
			}
			else {
				event.event = 'alert';
				event.rawtext = data.attrs.text;
				event.text = Torus.util.parseLinks(data.attrs.text, (Torus.chats[room].parent ? Torus.chats[room].parent : room));
			}
			Torus.ui.addLine(event);

			if(Torus.chats[room].parent && data.attrs.name != wgUserName) {Torus.ui.ping(room);}
			break;
		case 'join':
			if(Torus.chats[room].userlist[data.attrs.name]) {event.event = 'rejoin';}
		case 'updateUser':
			event.user = data.attrs.name;
			event.data = {
				avatar: data.attrs.avatarSrc.replace('28px', '100px'),
				mod: data.attrs.isModerator,
				staff: data.attrs.isStaff,
				givemod: data.attrs.isCanGiveChatMod,
				statusState: data.attrs.statusState,
				statusMessage: data.attrs.statusMessage,
				edits: data.attrs.editCount
			};
			Torus.ui.updateUser(room, data.attrs.name, event.data);
			if(event.event == 'join') {Torus.ui.addLine(event);}
			break;
		case 'part':
		case 'logout':
			event.user = data.attrs.name;
			if(Torus.chats[room].userlist[event.user]) {Torus.ui.removeUser(room, event.user);}
			else {event.event = 'ghost';} //ghost part (or logout)
			Torus.ui.addLine(event);
			break;
		case 'ban':
			if(data.attrs.time == 0) {event.event = 'unban';}
			else {
				event.seconds = data.attrs.time;
				event.expiry = Torus.util.secondsToExpiry(data.attrs.time);
			}
		case 'kick':
			event.target = data.attrs.kickedUserName;
			event.performer = data.attrs.moderatorName;
			Torus.ui.addLine(event);
			break;
		case 'openPrivateRoom':
			if(!Torus.chats[data.attrs.roomId]) {
				Torus.open(data.attrs.roomId);
				Torus.chats[data.attrs.roomId].parent = room;
				Torus.chats[data.attrs.roomId].users = data.attrs.users;
			}
			event.private = data.attrs.roomId;
			event.users = data.attrs.users;
			break;
		case 'forceReconnect':
			Torus.reopen(room);
			break;
		case 'disableReconnect': //this would be more accurately described as force disconnect
			Torus.chats[room].callListeners('disableReconnect', event);
			Torus.io.callListeners('disableReconnect', event);
			Torus.close(room, 'Server closed the connection');
			return;
		default: console.log(event); break;
	}

	Torus.chats[room].callListeners(event.event, event);
	Torus.io.callListeners(event.event, event);
}
