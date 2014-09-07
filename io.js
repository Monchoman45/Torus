Torus.io.ajax = function(method, post, callback) {
	var str = '';
	for(var i in post) {str += '&' + i + '=' + encodeURIComponent(post[i]);}
	str = str.substring(1);
	var xhr = new XMLHttpRequest();
	xhr.open('POST', '/index.php?action=ajax&rs=ChatAjax&method=' + method + '&client=Torus&version=' + Torus.version, true);
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xhr.responseType = 'json';
	xhr.onreadystatechange = function() {
		if(this.readyState == 4) {
			this.onreadystatechange = null;
			if(this.status == 200) {
				if(typeof callback == 'function') {callback.call(Torus, this.response);}
			}
			else {throw new Error('Request returned response ' + this.status + '. (io.ajax)');}
		}
	}
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

Torus.io.spider = function(callback) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', '/wikia.php?controller=Chat&format=json&client=Torus&version=' + Torus.version, true);
	xhr.responseType = 'json';
	xhr.onreadystatechange = function() {
		if(this.readyState == 4) {
			if(this.status == 200) {
				if(typeof callback == 'function') {callback.call(Torus, this.response);}
			}
			else if(this.status == 404) { //wiki doesn't have chat
				if(typeof callback == 'function') {callback.call(Torus, null);}
			}
			else {throw new Error('io.spider request returned HTTP ' + this.status + '.');}
		}
	};
	xhr.send();
}

Torus.io.session = function(transport, room, key, server, port, callback) {
	if(!transport || !room || !key || !server || !port) {throw new Error('Bad call to io.session');}

	var xhr = new XMLHttpRequest();
	xhr.open('GET', 'http://chat.wikia-services.com:' + port + '/socket.io/?EIO=2&transport=' + transport + '&name=' + encodeURIComponent(wgUserName) + '&key=' + key + '&roomId=' + room + '&serverId=' + server + '&client=Torus&version=' + Torus.version, true);
	xhr.onreadystatechange = function() {
		if(this.readyState == 4) {
			this.onreadystatechange = null;
			if(this.status == 200) {
				if(typeof callback == 'function') {callback.call(Torus, JSON.parse(this.responseText.substring(5)).sid);}
			}
			else {throw new Error('Request returned response ' + this.status + '. (io.session)');}
		}
	}
	xhr.send();
}

Torus.io.transports.websocket = function(room, key, server, port, session) {
	if(!(this instanceof Torus.io.transports.websocket)) {throw new Error('Must create transport with `new`.');}
	if(!room || room <= 0 || !key || !server || !port || !session) {throw new Error('Invalid transport parameters. (io.transports.websocket)');}

	this.ws = new WebSocket('ws://chat.wikia-services.com:' + port + '/socket.io/?EIO=2&transport=websocket&name=' + encodeURIComponent(wgUserName) + '&key=' + key + '&roomId=' + room + '&sid=' + session + '&serverId=' + server + '&client=Torus&version=' + Torus.version);
	this.ws.onmessage = function(event) { //FIXME: closure scope
		if(event.data.substring(0, 3) != '2::') {Torus.logs.socket[room].push({id: (new Date()).getTime(), message: event.data});}
		switch(event.data.substring(0, 3)) {
			case '0::': //disconnect
				Torus.chats[room].disconnect('Server closed the connection');
				break;
			case '1::': //connect
				if(!Torus.chats[room]) {throw new Error('Missing room on successful connect');}
				Torus.chats[room].connecting = false;
				Torus.chats[room].connected = true;
				Torus.chats[room].send_command('initquery');
				Torus.alert('Connected.', room);
				Torus.io.getBlockedPrivate();
				Torus.call_listeners(new Torus.classes.IOEvent('open', room));
				break;
			case '2::': //heartbeat
				this.send('2::');
				break;
			case '4::': //json
				Torus.chats[room].receive(JSON.parse(event.data.substring(4)));
				break;
			case '7::': //error
				if(event.data.substring(4) == '1+0') {Torus.chats[room].reconnect();}
				else {Torus.chats[room].disconnect('Protocol error: ' + event.data.substring(4));}
				break;
			case '3::': //message
			case '5::': //event
			case '6::': //ack
			case '8::': //noop
				Torus.chats[room].disconnect('Protocol error: Received unimplemented data type ' + event.data);
				break;
		}
	}
	this.ws.onerror = this.ws.onclose = function(event) {
		if(!Torus.chats[room].connected) {
			//Torus.alert('Websocket rejected, failing over to HTTP...', room);
			Torus.chats[room].transport = 'polling';
			Torus.chats[room].connecting = false;
			Torus.open(room); //FIXME: Torus.open
		}
		else if(event.reason) {Torus.chats[room].disconnect(event.reason);}
		else {Torus.chats[room].disconnect('Socket error (websocket)');}
	}
}
Torus.io.transports.websocket.prototype.send = function(message) {this.ws.send('3:::' + message);}
Torus.io.transports.websocket.prototype.close = function(silence) {
	if(silence) {this.ws.onclose = null;}
	this.ws.close();
}

Torus.io.transports.polling = function(room, key, server, port, session) {
	if(!(this instanceof Torus.io.transports.polling)) {throw new Error('Must create transport with `new`.');}
	if(!room || room <= 0 || !key || !server || !port || !session) {throw new Error('Invalid transport parameters. (io.transports.polling)');}

	this.xhr = null;
	this.url = 'http://chat.wikia-services.com:' + port + '/socket.io/?EIO=2&transport=polling&name=' + encodeURIComponent(wgUserName) + '&key=' + key + '&roomId=' + room + '&sid=' + session + '&serverId=' + server + '&client=Torus&version=' + Torus.version;
	this.poll = function() {
		this.xhr = new XMLHttpRequest();
		this.xhr.open('GET', this.url, true);
		this.xhr.socket = this;
		this.xhr.onreadystatechange = function() {
			if(this.readyState == 4) {
				this.onreadystatechange = null;
				if(this.socket.xhr != this) {console.log('xhr returned and found itself orphaned:', this.socket);}
			if(this.status == 200) {
				//As far as I know all messages begin with a null byte (to tell socket.io that they are strings)
				//after this is the length, encoded in the single most ridiculously stupid format ever created
				//the decimal representation of the length is encoded in binary, terminated by \ufffd: for example,
				//if the message length is 30 bytes, then the length is encoded as \x03\x00\ufffd
				//yes that's right, rather than use the actual number, they decided to take the same amount of space
				//to write the number in a format that provides no advantages and is literally always harder to parse
				//following the asinine length is the number 4 (which means message)
				//following that is the message type, and then immediately thereafter is the actual message content
				//I swear to god they must have been high when they designed this

				for(var ufffd = this.responseText.indexOf('\ufffd'); ufffd != -1; ufffd = this.responseText.indexOf('\ufffd', ufffd + 1)) {
					var text = this.responseText.substring(ufffd + 1, ufffd + 1 + Torus.util.stupid_to_int(this.responseText.slice(1, ufffd)));
					var packet_type = this.responseText.charAt(ufffd + 1) * 1;

					switch(packet_type) {
						case 0: //connect
							//sid
							break;
						case 1: //disconnect
							Torus.chats[room].disconnect('Server closed the connection');
							break;
						case 2: //ping
							this.socket.ping();
							break;
						case 4: //message
							var message_type = this.responseText.charAt(ufffd + 2) * 1;
							Torus.logs.socket[room].push({id: (new Date()).getTime(), type: message_type, message: text});
							switch(message_type) { //yep, there are two of these
								case 0: //connect
									if(!Torus.chats[room]) {throw new Error('Missing room on successful connect');}
									Torus.chats[room].connecting = false;
									Torus.chats[room].connected = true;
									Torus.chats[room].send_command('initquery');
									Torus.alert('Connected.', room);
									Torus.io.getBlockedPrivate();
									Torus.call_listeners(new Torus.classes.ChatEvent('open', room));
									break;
								case 1: //disconnect
									Torus.chats[room].disconnect('Server closed the connection');
									return;
								case 2: //event
									Torus.chats[room].receive(JSON.parse(text.substring(2))[1]);
									break;
								case 4: //error
									Torus.chats[room].disconnect('Protocol error: ' + text);
									return;
								case 3: //ack
								case 5: //binary event
								case 6: //binary ack
									Torus.chats[room].disconnect('Protocol error: Received unimplemented data type ' + text);
									break;
							}
							break;
						case 3: //pong
						case 6: //noop
							break;
						case 5: //upgrade
						default:
							Torus.chats[room].disconnect('Protocol error: Received unimplemented data type ' + text);
							break;
					}
				}
				this.socket.poll();
			} //status == 200
			else if(this.status == 404) {this.socket.poll();} //this apparently happens a lot
			else if(this.status != 0) {Torus.chats[room].disconnect('Socket error (polling): HTTP status ' + this.status);}
			else if(Torus.chats[room] && this.onabort) {Torus.chats[room].reconnect();} //not aborted, just died
			} //readyState == 4
		}
		this.xhr.onabort = function(event) {
			console.log(event);
			Torus.chats[room].disconnect('aborted');
		}
		this.xhr.send();
	};
	var sock = this; //FIXME: this forces a closure scope
	this.ping_interval = setInterval(function() {sock.ping();}, 20000);
	this.poll();
}
Torus.io.transports.polling.prototype.send = function(message) {
	var xhr = new XMLHttpRequest();
	xhr.open('POST', this.url, true);
	xhr.setRequestHeader('Content-Type', 'application/octet-stream'); //socket.io is literally the worst
	var data = '42["message",' + JSON.stringify(message) + ']';
	xhr.send(new Blob(['\0', Torus.util.int_to_stupid(data.length), Torus.util.xFF, data])); //no actually though
}
Torus.io.transports.polling.prototype.ping = function() {
	var xhr = new XMLHttpRequest();
	xhr.open('POST', this.url, true);
	xhr.setRequestHeader('Content-Type', 'application/octet-stream');
	xhr.send(new Blob(['\0', Torus.util.int_to_stupid(1), Torus.util.xFF, '2']));
}
Torus.io.transports.polling.prototype.close = function(silence) {
	clearInterval(this.ping_interval);
	if(silence) {this.xhr.onabort = null;}
	this.xhr.abort();
}

