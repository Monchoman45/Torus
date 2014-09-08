/************** Torus chat client **************
 * A Wikia chat client that isn't Special:Chat *
 * ------------------------------------------- *
 *    Written and maintained by Monchoman45    *
 *    https://github.com/Monchoman45/Torus     *
 ***********************************************/

window.Torus = {
	init: false,
	local: 0,
	version: 220, //2.2.0
	chats: {},
	listeners: {
		window: {
			load: [],
			unload: []
		},
		chat: {
			'new': [],

			open: [],
			close: [],
			reopen: [],

			update_user: [],
			remove_user: [],

			initial: [],
			send_message: [],
			send_me: [], //FIXME: never called
			setstatus: [],
			logout: [],
			givechatmod: [],
			kick: [],
			ban: [],
			unban: [], //FIXME: never called
			openprivate: []
		},
		io: {
			initial: [],
			message: [],
			alert: [],
			me: [],
			join: [],
			rejoin: [],
			part: [],
			ghost: [],
			logout: [],
			update_user: [],
			mod: [],
			kick: [],
			ban: [],
			unban: [],
			open_private: [],
			force_reconnect: [],
			force_disconnect: []
		}
	},
	io: {
		transports: {},
	},
	classes: {},
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
	},
	ext: {}
}

//Function for adding an event listener
//Accepts the event name and the listener function
Torus.add_listener = function(type, event, func) {
	if(!this.listeners[type]) {throw new Error('Event type `' + type + '` doesn\'t exist');}

	if(!this.listeners[type][event]) {this.listeners[type][event] = [];}
	this.listeners[type][event].push(func);
	return true;
}
//Function for removing an event listener
//Accepts the event name and the listener function
//Returns true if the listener is removed, otherwise false
Torus.remove_listener = function(type, event, func) {
	if(!this.listeners[type]) {throw new Error('Event type `' + type + '` doesn\'t exist');}
	if(!this.listeners[type][event]) {return false;}

	for(var i = 0; i < this.listeners[type][event].length; i++) {
		if(this.listeners[type][event][i] == func) {this.listeners[type][event].splice(i, 1); return true;}
	}
	return false;
}
//Function for calling listeners for an event
//Accepts the event name
//Returns false if the type is invalid, otherwise true
Torus.call_listeners = function(event) {
	if(!event.type || !event.event) {throw new Error('Event doesn\'t have `.type` or `.event`: ' + JSON.stringify(event));}
	if(!this.listeners[event.type]) {throw new Error('Event type `' + event.type + '` doesn\'t exist');}

	if(this.listeners[event.type][event.event]) {
		for(var i = 0; i < this.listeners[event.type][event.event].length; i++) {
			this.listeners[event.type][event.event][i].call(this, event);
		}
	}

	if(event.room && Torus.chats[event.room] && !(this instanceof Torus.classes.Chat)) {Torus.chats[event.room].call_listeners(event);}

	return true;
}

Torus.open = function(room, key, server, port, session, transport) {
	if(isNaN(room * 1)) {room = Torus.data.domains[room];}
	if(room <= 0) {throw new Error('Invalid room ' + room + '. (open)');}

	if(Torus.chats[room] && (Torus.chats[room].connected || Torus.chats[room].connecting)) {throw new Error('Room ' + room + ' is already open. (open)');}

	if(!Torus.chats[room]) {new Torus.classes.Chat(room);}

	Torus.chats[room].connect(key, server, port, session, transport);
	Torus.alert('Connecting to ' + Torus.chats[room].name + '...');
}

Torus.reopen = function(room) {
	Torus.alert('Reconnecting...', room);
	Torus.chats[room].reconnect();
}

Torus.logout = function() {
	for(var i in Torus.chats) {
		if(i > 0) {
			Torus.chats[i].send_command('logout');
			Torus.call_listeners(new Torus.classes.ChatEvent('logout', i * 1));
			Torus.chats[i * 1].disconnect('logout');
		}
	}
}

Torus.alert = function(text, room) {
	if(!room) {room = 0;}

	var event = new Torus.classes.IOEvent('alert', room);
	if(text.indexOf('\n') != -1) {
		var spl = text.split('\n');
		for(var i = 0; i < spl.length; i++) {
			event.text = spl[i];
			Torus.ui.add_line(event); //FIXME: ui
		}
	}
	else {
		event.text = text;
		Torus.ui.add_line(event); //FIXME: ui
	}
}

Torus.onload = function() {
	Torus.call_listeners(new Torus.classes.WindowEvent('load'));
	//Torus.alert('Initialized.');
	Torus.init = true;
}

Torus.unload = function() {
	Torus.logout();
	Torus.call_listeners(new Torus.classes.WindowEvent('unload'));
}

window.addEventListener('load', Torus.onload);
window.addEventListener('beforeunload', Torus.unload);

{{MediaWiki:Torus.js/io.js}}

{{MediaWiki:Torus.js/classes.js}}

{{MediaWiki:Torus.js/util.js}}

new Torus.classes.Chat(0, 'status');

Torus.data.domains = {
/*{{MediaWiki:Torus.js/database.json}}*/
};
/*for(var i in Torus.data.domains) {
	if(!Torus.data.ids[Torus.data.domains]) {Torus.data.ids[Torus.data.domains[i]] = i;}
}*/



{{MediaWiki:Torus.js/ui.js}}
