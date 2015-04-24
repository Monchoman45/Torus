Torus.classes.Chat = function(domain, parent, users) {
	if(!(this instanceof Torus.classes.Chat)) {throw new Error('Must call Torus.classes.Chat with `new`.');}
	if(!domain && domain !== 0) {throw new Error('Torus.classes.Chat: Tried to create room with no domain.');}
	if(Torus.chats[domain]) {throw new Error('Torus.classes.Chat: Tried to create room `' + name + '` but it already exists.');}


	this.domain = domain;
	Torus.chats[domain] = this;
	if(domain) { //this is a normal room
		if(parent) { //PM
			this.id = domain * 1;
			this.parent = parent;
			this.priv_users = users;

			if(this.priv_users.length == 2) {
				for(var i = 0; i < this.priv_users.length; i++) {
					if(this.priv_users[i] != wgUserName) {this.name = 'PM: ' + this.priv_users[i]; break;}
				}
			}
			else {this.name = this.domain;}
		}
		else { //public
			this.id = 1; //this'll get overwriten later
			this.parent = false;

			this.name = this.domain;
		}
		//this.away_timeout = 0;
		this.connected = false;
		this.connecting = false;
		this.socket = false;
		this.users = 0;
		this.userlist = {};
		this.listeners = {
			chat: {},
			io: {},
		};
	}
	else { //this is the status room
		this.id = 0;
		this.name = '#status'
		this.listeners = {
			chat: {},
			io: {},
		};
	}

	var event = new Torus.classes.ChatEvent('new', this);
	Torus.call_listeners(event);
}

Torus.classes.Chat.socket_connect = function(event) {
	event.sock.chat.connecting = false;
	event.sock.chat.connected = true;
	event.sock.chat.send_command('initquery');
	Torus.alert('Connected.', event.sock.chat);
	Torus.io.getBlockedPrivate();
	Torus.call_listeners(new Torus.classes.ChatEvent('connected', event.sock.chat));
}
Torus.classes.Chat.socket_disconnect = function(event) {event.sock.chat.disconnect(event.message);}
Torus.classes.Chat.socket_message = function(event) {
	if(event.message.data) {data = JSON.parse(event.message.data);}
	else {data = {};} //disableReconnect and probably forceReconnect do this

	var e = event.sock.chat['event_' + event.message.event](data);
	Torus.call_listeners(e);
}

Torus.classes.Chat.prototype.connect = function(transport) {
	if(this.connected || this.connecting) {throw new Error('Tried to open ' + this.domain + ' which is already open. (Chat.connect)');}
	if(!transport) {transport = 'polling';}

	this.connecting = true;
	if(this.parent) {
		var info = {
			host: this.parent.socket.host,
			port: this.parent.socket.port,
			server: this.parent.socket.server,
			room: this.id,
			key: this.parent.socket.key,
		};
	}
	else {var info = {};}

	Torus.alert('Connecting to {' + this.name + '}...');

	this.socket = new Torus.io.transports[transport](this.domain, info);
	this.socket.chat = this;
	this.socket.add_listener('io', 'connect', Torus.classes.Chat.socket_connect);
	this.socket.add_listener('io', 'disconnect', Torus.classes.Chat.socket_disconnect);
	this.socket.add_listener('io', 'message', Torus.classes.Chat.socket_message);

	Torus.call_listeners(new Torus.classes.ChatEvent('open', this));
}
Torus.classes.Chat.prototype.reconnect = function() {
	this.socket.close();
	this.connected = false;
	this.connecting = false;
	this.connect(this.socket.transport);
	Torus.call_listeners(new Torus.classes.ChatEvent('reopen', this));
}
Torus.classes.Chat.prototype.disconnect = function(message) {
	this.socket.close();
	this.socket = false;

	Torus.alert('Disconnected from {' + this.name + '}: ' + message);
	this.connecting = false;
	this.connected = false;
	var event = new Torus.classes.ChatEvent('close', this);
	event.message = message;
	Torus.call_listeners(event);

	this.users = 0;
	this.userlist = {};
}

Torus.classes.Chat.prototype.send_message = function(text) {
	if(!this.connected) {throw new Error('Tried to send a message to room ' + this.domain + ' before it finished connecting. (Chat.send_message)');}

	text += '';
	message = {attrs: {msgType: 'chat', text: text, name: wgUserName}};

	if(text.indexOf('/me') == 0) {var event = new Torus.classes.ChatEvent('send_me', this);}
	else {var event = new Torus.classes.ChatEvent('send_message', this);}
	event.message = message;
	Torus.call_listeners(event);

	if(this.parent) {this.parent.send_command('openprivate', {roomId: this.id, users: this.users});}
	this.socket.send(JSON.stringify(message));
}

Torus.classes.Chat.prototype.send_command = function(command, args) {
	if(!this.connected) {throw new Error('Tried to send a command to room ' + this.domain + ' before it finished connecting. (Chat.send_command)');}
	if(!args) {args = {};}

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
	if(typeof expiry == 'string') {expiry = Torus.util.expiry_to_seconds(expiry);}
	if(!reason) {reason = 'Misbehaving in chat';} //is a ban //FIXME: ?action=query&meta=allmessages

	this.send_command('ban', {userToBan: user, reason: reason, time: expiry});
}
Torus.classes.Chat.prototype.unban = function(user, reason) {
	if(!reason) {reason = 'undo';} //FIXME: ?action=query&meta=allmessages
	return this.ban(user, 0, reason);
}

Torus.classes.Chat.prototype.open_private = function(users, callback, id) {
	if(users.indexOf(wgUserName) == -1) {users.push(wgUserName);}

	if(!id) {
		var c = this; //FIXME: this forces a closure scope
		Torus.io.getPrivateId(users, function(id) {return c.open_private(users, callback, id);});
		return;
	}

	var pm = Torus.open(id * 1, this, users);
	if(typeof callback == 'function') {callback.call(pm, new Torus.classes.ChatEvent('open', pm));}
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
	}
	//this.awayTimeout = setTimeout('Torus.io.setStatus(' + Torus.ui.active + ', \'away\', \'\'); Torus.chats[' + Torus.ui.active + '].autoAway = true;', 5 * 60 * 1000);

	return event;
}
Torus.classes.Chat.prototype['event_chat:add'] = function(data) {
	var event = new Torus.classes.IOEvent('chat:add', this);

	if(!data.attrs.isInlineAlert) {
		if(data.attrs.text.indexOf('/me') == 0) {
			event.event = 'me';
			event.text = data.attrs.text.substring(3).trim();
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
				event.text = 'You are connected to ' + this.name + ' from another window.'; //FIXME: i18n
				break;
			case 'chat-kick-cant-kick-moderator':
				//TODO: figure out who we tried to kick
				event.event = 'alert';
				event.text = 'Can\'t kick moderators.'; //FIXME: i18n
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

	if(!this.userlist[data.attrs.name]) {
		this.users++;
		this.userlist[data.attrs.name] = event.data;
	}
	else {
		for(var i in event.data) {this.userlist[data.attrs.name][i] = event.data[i];}
	}
	return event;
}
Torus.classes.Chat.prototype.event_part = function(data) {
	var event = new Torus.classes.IOEvent('part', this);

	event.user = data.attrs.name;
	if(this.userlist[data.attrs.name]) {
		this.users--;
		delete this.userlist[data.attrs.name];
	}
	else {event.event = 'ghost';} //ghost part
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
		event.expiry = Torus.util.seconds_to_expiry(data.attrs.time);
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


	var blocked = false;
	for(var i = 0; i < data.attrs.users.length; i++) {
		if(Torus.data.blocked.indexOf(data.attrs.users[i]) != -1) {blocked = true; break;}
	}
	if(blocked) {event.private = false;}
	else {event.private = Torus.open(data.attrs.roomId * 1, this, data.attrs.users);}

	event.users = data.attrs.users;

	return event;
}
Torus.classes.Chat.prototype.event_forceReconnect = function(data) {
	this.reconnect();
	return new Torus.classes.IOEvent('force_reconnect', this);
}
Torus.classes.Chat.prototype.event_disableReconnect = function(data) {
	var event = new Torus.classes.IOEvent('force_disconnect', this);
	Torus.call_listeners(event);
	return event;
}

Torus.classes.Chat.prototype.add_listener = Torus.add_listener;
Torus.classes.Chat.prototype.remove_listener = Torus.remove_listener;
Torus.classes.Chat.prototype.call_listeners = Torus.call_listeners;
