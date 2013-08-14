/************** Torus chat client **************
 * A Wikia chat client that isn't Special:Chat *
 * ------------------------------------------- *
 * Written and maintained by Monchoman45       *
 ***********************************************/

window.Torus = {
	init: false,
	local: 0,
	version: 201.7, //2.0.1r7
	chats: {},
	listeners: {
		open: [],
		close: [],
		reopen: [],
		logout: []
	},
	io: {
		polling: 0,
		transports: {},
		listeners: {
			initial: [],
			message: [],
			alert: [],
			me: [],
			join: [],
			rejoin: [],
			part: [],
			ghost: [],
			logout: [],
			updateUser: [],
			mod: [],
			kick: [],
			ban: [],
			unban: [],
			openPrivateRoom: [],
			forceReconnect: [],
			disableReconnect: [],
		}
	},
	ui: {
		window: document.createElement('div'),
		active: 0,
		viewing: [],
		listeners: {
			render: [],
			activate: [],
			show: [],
			unshow: [],
			renderPopup: [],
			unrenderPopup: [],
			ping: [],
			fullscreen: []
		}
	},
	logs: {
		messages: {},
		plain: {},
		socket: {}
	},
	options: {},
	commands: {},
	util: {},
	data: {
		domains: {},
		ids: {},
		titleflash: document.title,
		pinginterval: 0,
		history: [],
		histindex: 0,
		tabtext: '',
		tabindex: 0,
		tabpos: 0,
		fullscreen: false
	}
}

window.io = {j: []};

//Function for adding an event listener
//Accepts the event name and the listener function
Torus.addListener = Torus.ui.addListener = Torus.io.addListener = function(type, func) {
	if(!this.listeners[type]) {this.listeners[type] = [];}
	this.listeners[type].push(func);
	return true;
}
//Function for removing an event listener
//Accepts the event name and the listener function
//Returns true if the listener is removed, otherwise false
Torus.removeListener = Torus.ui.removeListener = Torus.io.removeListener = function(type, func) {
	if(!this.listeners[type]) {return false;}
	for(var i = 0; i < this.listeners[type].length; i++) {
		if(this.listeners[type][i] == func) {this.listeners[type].splice(i, 1); return true;}
	}
	return false;
}
//Function for calling listeners for an event
//Accepts the event name
//Returns false if the type is invalid, otherwise true
Torus.callListeners = Torus.ui.callListeners = Torus.io.callListeners = function(type) {
	if(!this.listeners[type]) {return false;}
	if(this.listeners[type].length == 0) {return true;}
	var args = [];
	for(var i = 1; i < arguments.length; i++) {args.push(arguments[i]);}
	for(var i = 0; i < this.listeners[type].length; i++) {
		this.listeners[type][i].apply(this, args);
	}
	return true;
}

Torus.open = function(room, key, server, port, session, transport) {
	if(isNaN(room * 1)) {room = Torus.data.domains[room];}
	if(room <= 0) {throw new Error('Invalid room ' + room + '. (open)');}
	
	if(!Torus.chats[room] || (Torus.chats[room].connected == false && Torus.chats[room].connecting == false)) {
		if(!Torus.chats[room]) {
			Torus.ui.addRoom(room);
			Torus.ui.activate(room);
		}
		Torus.chats[room].connecting = true;
		
		if(key === false) {throw new Error('\'key\' is false. (open)');}
		else if(!key) {
			Torus.io.spider(function(data) {
				if(!data) {throw new Error('Can\'t spider: wiki does not have chat. (open)');}
				
				if(!server) {server = data.nodeHostname;}
				if(!port) {port = data.nodePort;}
				Torus.chats[room].connecting = false;
				if(data.chatkey.key === false) {key = false;} //why can't chatkey just be false?
				else {key = data.chatkey}
				return Torus.open(room, key, server, port, session);
			});
			return;
		}
		if(!server) {server = 'chat2-2.wikia.com';}
		if(!port) {port = '80';}
		if(!session) {
			Torus.io.session(room, key, server, port, function(data) {
				Torus.chats[room].connecting = false;
				if(typeof data == 'string') {return Torus.open(room, key, server, port, data);}
				else {Torus.close(room, 'Unable to retrieve session id: ' + data.message);}
			});
			return;
		}
		
		if(transport) {Torus.chats[room].transport = transport;}
		Torus.chats[room].socket = Torus.io.transports[Torus.chats[room].transport](room, key, server, port, session);
		Torus.alert('Connecting to ' + (Torus.data.ids[room] ? Torus.data.ids[room] : room) + '...');
	}
	else {throw new Error('Room ' + room + ' is already open. (open)');}
}

Torus.close = function(room, message) {
	if(isNaN(room * 1)) {room = Torus.data.domains[room];}
	if(!Torus.chats[room] || room <= 0) {throw new Error('Invalid room ' + room + '. (close)');}
	
	if(Torus.chats[room].socket) {
		Torus.chats[room].socket.silence();
		Torus.chats[room].socket.close();
	}
	Torus.alert('Disconnected from ' + (Torus.data.ids[room] ? Torus.data.ids[room] : room) + ': ' + message);
	Torus.chats[room].connected = false;
	Torus.chats[room].callListeners('close');
	Torus.callListeners('close', room);
	Torus.ui.removeRoom(room);
}

Torus.reopen = function(room) {
	if(isNaN(room * 1)) {room = Torus.data.domains[room];}
	if(!Torus.chats[room] || room <= 0) {throw new Error('Invalid room ' + room + '. (reopen)');}
	
	Torus.alert('Reconnecting...', room);
	Torus.chats[room].socket.silence();
	Torus.chats[room].socket.close();
	Torus.chats[room].connected = false;
	Torus.open(room);
	Torus.chats[room].callListeners('reopen');
	Torus.callListeners('reopen', room);
}

Torus.logout = function() {
	for(var i in Torus.chats) {
		if(i > 0) {
			Torus.io.sendCommand(i, 'logout');
			Torus.chats[i].callListeners('logout');
			Torus.close(i, 'logout');
		}
	}
	Torus.callListeners('logout');
}

Torus.alert = function(text, room) {
	if(!room) {room = 0;}
	
	if(text.indexOf('\n') != -1) {
		var spl = text.split('\n');
		for(var i = 0; i < spl.length; i++) {
			Torus.ui.addLine({
				event: 'alert',
				type: 'io',
				id: (new Date()).getTime(),
				room: room,
				time: (new Date()).getTime(),
				rawtext: spl[i],
				text: Torus.util.parseLinks(spl[i])
			});
		}
	}
	else {Torus.ui.addLine({
		event: 'alert',
		type: 'io',
		id: (new Date()).getTime(),
		room: room,
		time: (new Date()).getTime(),
		rawtext: text,
		text: Torus.util.parseLinks(text)
	});}
}

{{MediaWiki:Torus.js/ui.js}}

{{MediaWiki:Torus.js/io.js}}

{{MediaWiki:Torus.js/transports.js}}

{{MediaWiki:Torus.js/options.js}}

{{MediaWiki:Torus.js/commands.js}}

{{MediaWiki:Torus.js/util.js}}

{{MediaWiki:Torus.js/load.js}}