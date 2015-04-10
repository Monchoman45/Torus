Torus.io.ajax = function(method, post, callback) {
	var str = '';
	for(var i in post) {str += '&' + i + '=' + encodeURIComponent(post[i]);}
	str = str.substring(1);
	var xhr = new XMLHttpRequest();
	xhr.addEventListener('loadend', function() {
		if(this.status == 200) {
			if(typeof callback == 'function') {callback.call(Torus, this.response);}
		}
		else {throw new Error('Request returned response ' + this.status + '. (io.ajax)');}
	});
	xhr.open('POST', '/index.php?action=ajax&rs=ChatAjax&method=' + method, true);
	xhr.responseType = 'json';
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xhr.setRequestHeader('Api-Client', 'Torus/' + Torus.version);
	xhr.send(str);
}

Torus.io.getPrivateId = function(users, callback) {
	Torus.io.ajax('getPrivateRoomId', {users: JSON.stringify(users)}, function(data) {
		if(typeof callback == 'function') {callback.call(Torus, data.id);}
	});
}

Torus.io.getBlockedPrivate = function(callback) {
	Torus.io.ajax('getListOfBlockedPrivate', {}, function(data) {
		Torus.data.blockedBy = data.blockedByChatUsers;
		Torus.data.blocked = data.blockedChatUsers;
		if(typeof callback == 'function') {callback.call(Torus, data);}
	});
}

Torus.io.block = function(user, callback) {
	Torus.io.ajax('blockOrBanChat', {userToBan: user, dir: 'add'}, function(data) {
		Torus.data.blocked.push(user);
		if(typeof callback == 'function') {callback.call(Torus, data);}
	});
}

Torus.io.unblock = function(user, callback) {
	Torus.io.ajax('blockOrBanChat', {userToBan: user, dir: 'remove'}, function(data) {
		for(var i = 0; i < Torus.data.blocked.length; i++) {
			if(Torus.data.blocked[i] == user) {Torus.data.blocked.splice(i, 1); break;}
		}
		if(typeof callback == 'function') {callback.call(Torus, data);}
	});
}

Torus.io.key = function(callback) {
	var xhr = new XMLHttpRequest();
	xhr.addEventListener('loadend', function() {
		if(this.status == 200) {
			if(typeof callback == 'function') {
				if(typeof this.response.chatkey == 'string') {callback.call(Torus, this.response.chatkey);}
				else {callback.call(Torus, false);}
			}
		}
		else if(this.status == 404) { //wiki doesn't have chat
			if(typeof callback == 'function') {callback.call(Torus, false);}
		}
		else {
			if(typeof callback == 'function') {callback.call(Torus, {error: 'http', code: this.status});}
			throw new Error('io.key: request returned HTTP ' + this.status + '.');
		}
	});
	xhr.open('GET', '/wikia.php?controller=Chat&format=json', true);
	xhr.responseType = 'json';
	xhr.setRequestHeader('Api-Client', 'Torus/' + Torus.version);
	xhr.send();
}

Torus.io.spider = function(domain, callback) {
	if(Torus.cache.data[domain]) {
		if(typeof callback == 'function') {callback.call(Torus, Torus.cache.data[domain]);}
		return;
	}

	var xhr = new XMLHttpRequest();
	xhr.addEventListener('loadend', function() {
		if(this.status == 200) {
			if(!this.response.error) {Torus.cache.update(domain, this.response);}
			if(typeof callback == 'function') {callback.call(Torus, this.response);}
		}
		else {
			if(typeof callback == 'function') {callback.call(Torus, {error: 'http', code: this.status});}
			throw new Error('io.spider: CORS proxy returned HTTP ' + this.status + '.');
		}
	});
	xhr.open('GET', 'http://cis-linux2.temple.edu/~tuf23151/torus.php?domain=' + domain, true);
	xhr.responseType = 'json';
	xhr.setRequestHeader('Api-Client', 'Torus/' + Torus.version);
	xhr.send();
}

Torus.io.transports.polling = function(domain, info) {
	if(!(this instanceof Torus.io.transports.polling)) {throw new Error('Must create transport with `new`.');}

	this.open = false;
	this.domain = domain;
	this.host = info.host;
	this.port = info.port;
	this.server = info.server;
	this.room = info.room;
	this.key = info.key;
	this.session = '';
	this.url = '';
	this.xhr = null;
	this.ping_interval = 0;
	this.iid = 0;
	this.listeners = {
		'io': {},
	};

	this.add_listener('io', 'disconnect', this.close);

	if(!this.host || !this.port || !this.server || !this.room) {
		var sock = this; //FIXME: this forces a closure scope
		Torus.io.spider(this.domain, function(data) {
			if(data.error == 'nochat') {
				sock.call_listeners({
					type: 'io',
					event: 'disconnect',
					message: 'no chat',
					sock: sock
				});
				return;
			}
			else if(data.error) {throw new Error('transport: CORS proxy returned error `' + data.error + '`');}

			if(!sock.host) {sock.host = data.host;}
			if(!sock.port) {sock.port = data.port;}
			if(!sock.server) {sock.server = data.server;}
			if(!sock.room) {sock.room = data.room;}

			if(sock.host && sock.port && sock.server && sock.room && sock.key && !sock.open) {sock.poll();} //FIXME: long
		});
	}

	if(!this.key) {
		var sock = this; //FIXME: this forces a closure scope
		Torus.io.key(function(key) {
			if(!key) {throw new Error('transport: not logged in');}
			sock.key = key;
			if(sock.host && sock.port && sock.server && sock.room && sock.key && !sock.open) {sock.poll();} //FIXME: long
		});
	}

	if(this.host && this.port && this.server && this.room && this.key && !this.open) {this.poll();} //FIXME: long
}
Torus.io.transports.polling.prototype.poll = function() {
	this.url = 'http://' + this.host + ':' + this.port + '/socket.io/?EIO=2&transport=polling&name=' + encodeURIComponent(wgUserName) + '&key=' + this.key + '&roomId=' + this.room + '&serverId=' + this.server;
	if(this.session) {this.url += '&sid=' + this.session;}
	this.open = true;

	this.xhr = new XMLHttpRequest();
	this.xhr.sock = this;
	this.xhr.addEventListener('loadend', function() { //FIXME: hardcoded function
		if(this.sock.xhr != this) {console.log('xhr returned and found itself orphaned:', this.sock);}
		if(this.status == 200) {
			//As far as I know all messages begin with a null byte (to tell socket.io that they are strings)
			//after this is the length, encoded in the single most ridiculously stupid format ever created
			//the decimal representation of the length is encoded in binary, terminated by \ufffd: for example,
			//if the message length is 30 bytes, then the length is encoded as \x03\x00\ufffd
			//yes that's right, rather than use the actual number, they decided to take the same amount of space
			//to write the number in a format that provides no advantages and is literally always harder to parse
			//following the asinine length is the number 4 (which means message)
			//following that is the message type, and then immediately thereafter is the actual message content
			//I swear to god socket.io must have been high when they designed this

			var data = this.responseText;
			while(data.length > 0) {
			//for(var ufffd = this.responseText.indexOf('\ufffd'); ufffd != -1; ufffd = this.responseText.indexOf('\ufffd', ufffd + 1)) {
				var ufffd = data.indexOf('\ufffd');
				var end = 1 + ufffd + Torus.util.stupid_to_int(data.substring(1, ufffd));
				var text = data.substring(1 + ufffd, end);
				data = data.substring(end);
				var packet_type = text.charAt(0) * 1;
				text = text.substring(1);
				

				var sock = this.sock;

				switch(packet_type) {
					case 0: //connect
						//we should only reach this once, hopefully
						var data = JSON.parse(text);
						sock.session = data.sid;
						sock.ping_interval = Math.floor(data.pingTimeout * 3 / 4); //pingTimeout is the longest we can go without disconnecting
						if(sock.iid) {clearInterval(sock.iid);}
						sock.iid = setInterval(function() {sock.ping();}, sock.ping_interval); //FIXME: this forces a closure scope
						break;
					case 1: //disconnect
						sock.call_listeners({
							type: 'io',
							event: 'disconnect',
							message: 'Server closed the connection',
							sock: sock
						});
						return;
					case 2: //ping
						sock.ping();
						break;
					case 4: //message
						var message_type = text.charAt(0) * 1;
						text = text.substring(1);
						//Torus.logs.socket[sock.room].push({id: (new Date()).getTime(), type: message_type, message: text}); //FIXME: ui
						switch(message_type) { //yep, there are two of these
							case 0: //connect
								sock.call_listeners({
									type: 'io',
									event: 'connect',
									sock: sock
								});
								break;
							case 1: //disconnect
								sock.call_listeners({
									type: 'io',
									event: 'disconnect',
									message: 'Server closed the connection',
									sock: sock
								});
								return;
							case 2: //event
								sock.call_listeners({
									type: 'io',
									event: 'message',
									message: JSON.parse(text)[1],
									sock: sock
								});
								break;
							case 4: //error
								sock.call_listeners({
									type: 'io',
									event: 'disconnect',
									message: 'Protocol error: ' + JSON.parse(text)[1],
									sock: sock
								});
								return;
							case 3: //ack
							case 5: //binary event
							case 6: //binary ack
								console.log('Unimplemented data type: ' + this.responseText);
								sock.call_listeners({
									type: 'io',
									event: 'disconnect',
									message: 'Protocol error: Received unimplemented data type `' + message_type + '`',
									sock: sock
								});
								return;
						}
						break;
					case 3: //pong
					case 6: //noop
						break;
					case 5: //upgrade
					default:
						console.log('Unimplemented data type: ' + this.responseText);
						sock.call_listeners({
							type: 'io',
							event: 'disconnect',
							message: 'Protocol error: Received unimplemented data type `' + packet_type + '`',
							sock: sock
						});
						return;
				}
			}
			this.sock.poll();
		} //status == 200
		else if(this.status == 400 || this.status == 404) {
			this.sock.session = '';
			this.sock.poll();
		}
		else if(this.status != 0) {
			this.sock.call_listeners({
				type: 'io',
				event: 'disconnect',
				message: 'Socket error (polling): HTTP status ' + this.status,
				sock: this.sock
			});
		}
		else {console.log('HTTP status 0: ', this.sock);}
	});
	this.xhr.open('GET', this.url, true);
	//this.xhr.setRequestHeader('Api-Client', 'Torus/' + Torus.version);
	this.xhr.send();
}
Torus.io.transports.polling.prototype.send = function(message) {
	var data = '42["message",' + JSON.stringify(message) + ']';

	var xhr = new XMLHttpRequest();
	xhr.open('POST', this.url, true);
	xhr.setRequestHeader('Content-Type', 'application/octet-stream'); //socket.io is literally the worst
	//xhr.setRequestHeader('Api-Client', 'Torus/' + Torus.version);
	xhr.send(new Blob(['\0', Torus.util.int_to_stupid(data.length), Torus.util.xFF, data])); //no actually though
}
Torus.io.transports.polling.prototype.ping = function() {
	var xhr = new XMLHttpRequest();
	xhr.open('POST', this.url, true);
	xhr.setRequestHeader('Content-Type', 'application/octet-stream');
	//xhr.setRequestHeader('Api-Client', 'Torus/' + Torus.version);
	xhr.send(new Blob(['\0', Torus.util.int_to_stupid(1), Torus.util.xFF, '2']));
}
Torus.io.transports.polling.prototype.close = function() {
	this.open = false;
	if(this.xhr) {
		this.xhr.abort();
		this.xhr = null;
	}
	if(this.iid) {
		clearInterval(this.iid);
		this.iid = 0;
	}
}
Torus.io.transports.polling.prototype.add_listener = Torus.add_listener;
Torus.io.transports.polling.prototype.remove_listener = Torus.remove_listener;
Torus.io.transports.polling.prototype.call_listeners = Torus.call_listeners;
