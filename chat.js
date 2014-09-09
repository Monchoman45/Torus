Torus.classes.Chat = function(room, name) {
	if(!(this instanceof Torus.classes.Chat)) {throw new Error('Must call Torus.classes.Chat with `new`.');}
	if(room < 0) {throw new Error('Invalid negative room id. (Chat constructor)');}
	if(Torus.chats[room]) {throw new Error('Tried to create room ' + room + ' (' + name + ') but it already exists. (Chat constructor)');}

	Torus.chats[room] = this;

	if(room > 0) {
		if(!name && Torus.data.ids[room]) {name = Torus.data.ids[room];}
		if(name) {
			Torus.chats[name] = this;

			if(!Torus.options.pings[name]) {
				Torus.options.pings[name] = {};
				Torus.options.pings[name].enabled = true;
				Torus.options.pings[name].case_sensitive = {type: 'text', value: ''};
				Torus.options.pings[name].case_insensitive = {type: 'text', value: ''};
			}
		}
		else {name = '' + room;}

		this.room = room; //FIXME: use id instead
		this.id = room;
		this.parent = false; //the source of a PM
		this.name = name;
		this.away_timeout = 0;
		this.transport = 'polling';
		this.connected = false;
		this.connecting = false;
		this.users = 0;
		this.userlist = {};
		this.listeners = {
			chat: {},
			io: {}
		};

		for(var i in Torus.logs) {
			if(!Torus.logs[i][room]) {Torus.logs[i][room] = [];}
		}
	}
	else { //this is the status room
		this.room = room; //FIXME: do we use this?
		this.id = room;
		this.name = name;
		this.listeners = {
			chat: {},
		};
	}

	var event = new Torus.classes.ChatEvent('new', this);
	Torus.call_listeners(event);
}

Torus.classes.Chat.prototype.connect = function(key, server, port, session, transport) {
	if(this.connected || this.connecting) {throw new Error('Tried to open ' + this.room + ' (' + this.name + ') which is already open.');}

	this.connecting = true;
	//FIXME: this is probably a bad idea
	if(!Torus.chats[this.room]) {Torus.chats[this.room] = this;}
	if(this.room != this.name && !Torus.chats[this.name]) {Torus.chats[this.name] = this;}

	if(!key || !server) {
		var c = this; //FIXME: this forces a closure scope
		Torus.io.spider(function(data) { //FIXME: shouldn't we close this room before throwing an error
			if(!data) {
				this.disconnect('Wiki does not have chat');
				//throw new Error('Can\'t spider: wiki does not have chat. (Chat.connect)');
			}

			if(data.chatkey.key === false) {throw new Error('Not logged in');} //FIXME: this is dumb, do something better
			if(!key) {key = data.chatkey;}
			if(!server) {server = data.nodeInstance;}
			if(!port) {port = data.nodePort;}
			c.connecting = false;
			return c.connect(key, server, port, session, transport);
		});
		return;
	}
	if(!port) {port = '80';}

	if(!transport) {transport = 'polling';}
	this.transport = transport;

	if(!session) {
		var c = this; //FIXME: this forces a closure scope
		Torus.io.session(transport, this.room, key, server, port, function(data) {
			c.connecting = false;
			if(typeof data == 'string') {return c.connect(key, server, port, data, transport);}
			else {c.disconnect('Unable to retrieve session id: ' + data.message);}
		});
		return;
	}
	
	this.socket = new Torus.io.transports[transport](this.id, key, server, port, session);
}
Torus.classes.Chat.prototype.reconnect = function() {
	this.socket.close(true);
	this.connected = false;
	this.connecting = false;
	this.connect();
	Torus.call_listeners(new Torus.classes.ChatEvent('reopen', this));
}
Torus.classes.Chat.prototype.disconnect = function(message) {
	if(this.socket) {this.socket.close(true);} //socket won't exist if we close trying to get key or session

	Torus.alert('Disconnected from ' + this.name + ': ' + message);
	this.connecting = false;
	this.connected = false;
	var event = new Torus.classes.ChatEvent('close', this);
	event.message = message;
	Torus.call_listeners(event);

	//FIXME: this is probably bad
	this.users = 0;
	this.userlist = {};
	delete Torus.chats[this.room];
	if(this.room != this.name) {delete Torus.chats[this.name];}
}

Torus.classes.Chat.prototype.update_user = function(name, data) {
	if(data) {
		if(!this.userlist[name]) {
			this.users++;
			this.userlist[name] = data;
		}
		else {
			for(var i in data) {this.userlist[name][i] = data[i];}
		}
	}
	var event = new Torus.classes.ChatEvent('update_user', this);
	event.user = name;
	Torus.call_listeners(event);
}
Torus.classes.Chat.prototype.remove_user = function(name) {
	if(this.userlist[name]) {
		this.users--;
		delete this.userlist[name];
	}
	var event = new Torus.classes.ChatEvent('remove_user', this);
	event.user = name;
	Torus.call_listeners(event);
}

Torus.classes.Chat.prototype.send_message = function(message, hist) {
	if(!this.connected) {throw new Error('Tried to send a message to room ' + this.id + ' before it finished connecting. (Chat.send_message)');}

	message += '';
	if((hist || hist == undefined) && Torus.data.history[1] != message) {
		Torus.data.history[0] = message;
		Torus.data.history.unshift('');
	}
	Torus.data.histindex = 0;

	message = {attrs: {msgType: 'chat', 'text': message}};

	var event = new Torus.classes.ChatEvent('send_message', this); //FIXME: does not call `me` events
	event.message = message;
	Torus.call_listeners(event);

	if(this.parent) {Torus.chats[this.parent].send_command('openprivate', {roomId: this.room, users: this.users});}
	this.socket.send(JSON.stringify(message));
}

Torus.classes.Chat.prototype.send_command = function(command, args) {
	if(!this.connected) {throw new Error('Tried to send a command to room ' + this.id + ' before it finished connecting. (Chat.send_command)');}

	var message = {attrs: {msgType: 'command', command: command}};
	for(var i in args) {message.attrs[i] = args[i];}

	var event = new Torus.classes.ChatEvent(command, this);
	event.message = message;
	Torus.call_listeners(event);

	this.socket.send(JSON.stringify(message));
}

Torus.classes.Chat.prototype.set_status = function(state, message) {
	var user = this.userlist[wgUserName];
	if(!state) {state = user.status_state;}
	if(!message) {message = user.status_message;}
	user.old_state = user.status_state;
	user.old_message = user.status_message;
	this.send_command('setstatus', {statusState: state, statusMessage: message});
}

Torus.classes.Chat.prototype.mod = function(user) {this.send_command('givechatmod', {userToPromote: user});}

Torus.classes.Chat.prototype.kick = function(user) {this.send_command('kick', {userToKick: user});}
Torus.classes.Chat.prototype.ban = function(user, expiry, reason) {
	if(!expiry) {expiry = 0;} //this is also an unban
	else if(typeof expiry == 'string') {expiry = Torus.util.expiryToSeconds(expiry);}
	if(!reason) {
		if(expiry) {reason = 'Misbehaving in chat';} //is a ban
		else {reason = 'undo';} //is an unban
	}
	this.send_command('ban', {userToBan: user, reason: reason, time: expiry});
}

Torus.classes.Chat.prototype.open_private = function(users, callback, id) {
	var username = false;
	for(var i = 0; i < users.length; i++) {
		if(users[i] == wgUserName) {username = true; break;}
	}
	if(!username) {users.push(wgUserName);}

	if(!id) {
		var c = this;
		Torus.io.getPrivateId(users, function(id) { //FIXME: this forces a closure scope
			return c.open_private(users, callback, id);
		});
	}
	else {
		if(!Torus.chats[id]) {
			Torus.open(id); //FIXME: Torus.open
			Torus.chats[id].parent = this.room;
			Torus.chats[id].priv_users = users;
			if(typeof callback == 'function') {Torus.chats[id].add_listener('chat', 'open', callback);}
		}
		else {
			//Torus.ui.activate(id); FIXME: ui
			if(typeof callback == 'function') {callback.call(Torus.chats[id]);}
		}
	}
}

Torus.classes.Chat.prototype.event_initial = function(data) {
	var event = new Torus.classes.IOEvent('initial', this);

	this.users = 0;
	this.userlist = {}; //clear current userlist, this list is 100% accurate and ours might not be

	event.users = [];
	for(var i = 0; i < data.collections.users.models.length; i++) {event.users.push(this.event_updateUser(data.collections.users.models[i]));}
	event.messages = [];
	for(var i = 0; i < data.collections.chats.models.length; i++) {event.messages.push(this['event_chat:add'](data.collections.chats.models[i]));}

	if(this.parent) {
		event.parent = this.parent;
		//Torus.ui.ping(this.parent); //FIXME: ui
	}
	//this.awayTimeout = setTimeout('Torus.io.setStatus(' + Torus.ui.active + ', \'away\', \'\'); Torus.chats[' + Torus.ui.active + '].autoAway = true;', 5 * 60 * 1000);

	return event;
}
Torus.classes.Chat.prototype['event_chat:add'] = function(data) {
	var event = new Torus.classes.IOEvent('chat:add', this);

	if(!data.attrs.isInlineAlert) {
		if(data.attrs.text.indexOf('/me') == 0) {
			event.event = 'me';
			event.text = data.attrs.text.substring(4);
		}
		else {
			event.event = 'message';
			event.text = data.attrs.text;
		}
		event.user = data.attrs.name;
		event.id = data.attrs.timeStamp;
		event.time = data.attrs.timeStamp;
	}
	else if(data.attrs.wfMsg) {
		switch(data.attrs.wfMsg) {
			case 'chat-inlinealert-a-made-b-chatmod':
				event.event = 'mod';
				event.performer = data.attrs.msgParams[0];
				event.target = data.attrs.msgParams[1];
				break;
			case 'chat-err-connected-from-another-browser':
				//TODO: make this its own event
				event.event = 'alert';
				event.text = 'You are connected to ' + this.name + ' from another window.';
				break;
			default:
				console.log(event);
				break;
		}
	}
	else {
		event.event = 'alert';
		event.text = data.attrs.text;
	}
	return event;
}
Torus.classes.Chat.prototype.event_join = function(data) {
	if(this.userlist[data.attrs.name]) {var rejoin = true;}
	else {var rejoin = false;}

	var event = this.event_updateUser(data);

	if(rejoin) {event.event = 'rejoin';}
	else {event.event = 'join';}
	return event;
}
Torus.classes.Chat.prototype.event_updateUser = function(data) {
	var event = new Torus.classes.IOEvent('update_user', this);

	event.user = data.attrs.name;
	event.data = {
		avatar: data.attrs.avatarSrc.replace('28px', '100px'),
		mod: data.attrs.isModerator,
		staff: data.attrs.isStaff,
		givemod: data.attrs.isCanGiveChatMod,
		status_state: data.attrs.statusState,
		status_message: data.attrs.statusMessage,
		edits: data.attrs.editCount
	};

	this.update_user(data.attrs.name, event.data);
	return event;
}
Torus.classes.Chat.prototype.event_part = function(data) {
	var event = new Torus.classes.IOEvent('part', this);

	event.user = data.attrs.name;
	if(this.userlist[data.attrs.name]) {this.remove_user(data.attrs.name);}
	else {event.event = 'ghost';} //ghost part (or logout)
	return event;
}
Torus.classes.Chat.prototype.event_logout = function(data) {
	var event = this.event_part(data);
	event.event = 'logout';
	return event;
}
Torus.classes.Chat.prototype.event_ban = function(data) {
	var event = this.event_kick(data);
	if(data.attrs.time == 0) {event.event = 'unban';}
	else {
		event.event = 'ban';
		event.seconds = data.attrs.time;
		event.expiry = Torus.util.secondsToExpiry(data.attrs.time);
	}
	return event;
}
Torus.classes.Chat.prototype.event_kick = function(data) {
	var event = new Torus.classes.IOEvent('kick', this);
	event.target = data.attrs.kickedUserName;
	event.performer = data.attrs.moderatorName;
	return event;
}
Torus.classes.Chat.prototype.event_openPrivateRoom = function(data) {
	var event = new Torus.classes.IOEvent('open_private', this);

	if(!Torus.chats[data.attrs.roomId]) {
		Torus.open(data.attrs.roomId);
		Torus.chats[data.attrs.roomId].parent = this.room;
		Torus.chats[data.attrs.roomId].priv_users = data.attrs.users;
	}
	event.private = data.attrs.roomId;
	event.users = data.attrs.users;

	return event;
}
Torus.classes.Chat.prototype.event_forceReconnect = function(data) {
	this.reconnect();
	return new Torus.classes.IOEvent('force_reconnect', this);
}
Torus.classes.Chat.prototype.event_disableReconnect = function(data) {
	var event = new Torus.classes.IOEvent('force_disconnect', this);
	Torus.call_listeners(event); //FIXME: this will occur twice
	this.disconnect('Server closed the connection');
	return event;
}

Torus.classes.Chat.prototype.receive = function(message) {
	if(message.data) {data = JSON.parse(message.data);}
	else {data = {};} //disableReconnect and probably forceReconnect do this

	var event = this['event_' + message.event](data);
	Torus.call_listeners(event);
}

Torus.classes.Chat.prototype.add_listener = Torus.add_listener;
Torus.classes.Chat.prototype.remove_listener = Torus.remove_listener;
Torus.classes.Chat.prototype.call_listeners = Torus.call_listeners;
