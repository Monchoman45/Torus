/************** Torus chat client **************
 * A Wikia chat client that isn't Special:Chat *
 * ------------------------------------------- *
 *    Written and maintained by Monchoman45    *
 *    https://github.com/Monchoman45/Torus     *
 ***********************************************/

if(window.Torus) {throw new Error('Torus already loaded');}

window.Torus = {
	init: false,
	local: '',
	version: 232,
	pretty_version: '2.4.0',
	chats: {},
	listeners: {
		window: {
			load: [],
			unload: [],
		},
		chat: {
			'new': [],

			open: [],
			connected: [],
			close: [],
			reopen: [],

			update_user: [],
			remove_user: [],

			initial: [],
			send_message: [],
			send_me: [],
			setstatus: [],
			logout: [],
			givechatmod: [],
			kick: [],
			ban: [],
			unban: [], //FIXME: never called
			openprivate: [],
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
			force_disconnect: [],
		},
		ext: {
			'new': [],
			load_options: [], //FIXME: find a better place for this
			after_load_options: [], //FIXME: find a better place for this
			save_options: [], //FIXME: find a better place for this
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
		blocked: [],
		blockedBy: [],
		titleflash: document.title,
		pinginterval: 0,
		history: [],
		histindex: 0,
		tabtext: '',
		tabindex: 0,
		tabpos: 0,
		fullscreen: false,
	},
	options: {},
}

//Function for adding an event listener
//Accepts the event name and the listener function
Torus.add_listener = function(type, event, func) {
	if(!this.listeners[type]) { //FIXME: the error is probably better but it causes problems with ui events
		//throw new Error('Event type `' + type + '` doesn\'t exist');
		this.listeners[type] = {};
	}

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

	if(event.room && !(this instanceof Torus.classes.Chat) && !(this instanceof Torus.classes.Extension)) {event.room.call_listeners(event);}

	return true;
}

Torus.open = function(domain, parent, users) {
	if(Torus.chats[domain]) {var chat = Torus.chats[domain];}
	else {var chat = new Torus.classes.Chat(domain, parent, users);}
	if(!chat.connecting && !chat.connected) {chat.connect();}
	return chat;
}

Torus.logout = function() {
	for(var i in Torus.chats) {
		if(i > 0) {
			var chat = Torus.chats[i];
			chat.send_command('logout');
			Torus.call_listeners(new Torus.classes.ChatEvent('logout', chat));
			chat.disconnect('logout');
		}
	}
}

Torus.alert = function(text, room) {
	if(!room) {room = Torus.chats[0];}

	if(text.indexOf('\n') != -1) {
		var spl = text.split('\n');
		for(var i = 0; i < spl.length; i++) {
			var event = new Torus.classes.IOEvent('alert', room);
			event.text = spl[i];
			Torus.call_listeners(event);
			//Torus.ui.add_line(event); //FIXME: ui
		}
	}
	else {
		var event = new Torus.classes.IOEvent('alert', room);
		event.text = text;
		Torus.call_listeners(event);
		//Torus.ui.add_line(event); //FIXME: ui
	}
}

Torus.onload = function() {
	Torus.load_options();
	Torus.call_listeners(new Torus.classes.WindowEvent('load'));
	//Torus.alert('Initialized.');
	Torus.init = true;
}

Torus.unload = function() {
	Torus.logout();
	Torus.save_options();
	Torus.call_listeners(new Torus.classes.WindowEvent('unload'));
}

Torus.save_options = function() {
	var save = {version: Torus.version, data: Torus.options};
	var event = new Torus.classes.ExtEvent('save_options');
	event.options = save;
	Torus.call_listeners(event);
	window.localStorage.setItem('torus-options', JSON.stringify(save));
	
	return save;
}

Torus.load_options = function() {
	var load = JSON.parse(window.localStorage.getItem('torus-options'));
	if(!load) {
		if(load.version < 231) {
			window.localStorage.removeItem('torus-options');
			load.data = {};
		}

		for(var i in load.data) {Torus.options[i] = load.data[i];}
	}
	Torus.call_listeners(new Torus.classes.ExtEvent('load_options'));
	return Torus.options;
}

window.addEventListener('load', Torus.onload);
window.addEventListener('beforeunload', Torus.unload);

{{MediaWiki:Torus.js/io.js}}

{{MediaWiki:Torus.js/chat.js}}

{{MediaWiki:Torus.js/events.js}}

{{MediaWiki:Torus.js/ext.js}}

{{MediaWiki:Torus.js/util.js}}

{{MediaWiki:Torus.js/cache.js}}

new Torus.classes.Chat(0);



{{MediaWiki:Torus.js/ui/main.js}}
