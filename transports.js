Torus.io.transports.websocket = function(room, key, server, port, session) {
	if(!room || room <= 0 || !key || !server || !port || !session) {throw new Error('Invalid transport parameters. (io.transports.websocket)');}
	
	var ws = new WebSocket('ws://' + server + ':' + port + '/socket.io/1/websocket/' + session + '/?name=' + encodeURIComponent(wgUserName) + '&key=' + key + '&roomId=' + room + '&client=Torus&version=' + Torus.version);
	ws.onmessage = function(event) {
		if(event.data.substring(0, 3) != '2::') {Torus.logs.socket[room].push({id: (new Date()).getTime(), message: event.data});}
		switch(event.data.substring(0, 3)) {
			case '0::': //disconnect
				Torus.close(room, 'Server closed the connection');
				break;
			case '1::': //connect
				if(!Torus.chats[room]) {throw new Error('Missing room on successful connect');}
				Torus.chats[room].connecting = false;
				Torus.chats[room].connected = true;
				Torus.io.sendCommand(room, 'initquery');
				Torus.alert('Connected.', room);
				Torus.io.getBlockedPrivate();
				Torus.chats[room].callListeners('open');
				Torus.callListeners('open', room);
				break;
			case '2::': //heartbeat
				this.send('2::');
				break;
			case '4::': //json
				Torus.io.receive(room, JSON.parse(event.data.substring(4)));
				break;
			case '7::': //error
				if(event.data.substring(4) == '1+0') {Torus.reopen(room);}
				else {Torus.close(room, 'Protocol error: ' + event.data.substring(4));}
				break;
			case '3::': //message
			case '5::': //event
			case '6::': //ack
			case '8::': //noop
				Torus.close(room, 'Protocol error: Received unimplemented data type ' + event.data);
				break;
		}
	}
	ws.onerror = ws.onclose = function(event) {
		if(!Torus.chats[room].connected) {
			Torus.alert('Websocket rejected, failing over to HTTP...', room);
			Torus.chats[room].transport = 'xhr-polling';
			Torus.chats[room].connecting = false;
			Torus.open(room);
		}
		else if(event.reason) {Torus.close(room, event.reason);}
		else {Torus.close(room, 'Socket error (websocket)');}
	}
	ws.silence = function() {this.onclose = null;}
	ws.send = function(message) {WebSocket.prototype.send.call(this, '3:::' + message);}
	return ws;
}

Torus.io.transports['xhr-polling'] = function(room, key, server, port, session) {
	if(!room || room <= 0 || !key || !server || !port || !session) {throw new Error('Invalid transport parameters. (io.transports.xhr-polling)');}
	
	var sock = {
		xhr: null,
		send: function(message) {
			var xhr = new XMLHttpRequest();
			xhr.open('POST', 'http://' + server + ':' + port + '/socket.io/1/xhr-polling/' + session + '/?name=' + encodeURIComponent(wgUserName) + '&key=' + key + '&roomId=' + room + '&client=Torus&version=' + Torus.version, true);
			xhr.setRequestHeader('Content-Type', 'text/plain');
			xhr.send('5:::' + JSON.stringify({name: 'message', args: [message]}));
		},
		poll: function() {
			this.xhr = new XMLHttpRequest();
			this.xhr.open('GET', 'http://' + server + ':' + port + '/socket.io/1/xhr-polling/' + session + '/?name=' + encodeURIComponent(wgUserName) + '&key=' + key + '&roomId=' + room + '&client=Torus&version=' + Torus.version, true);
			this.xhr.socket = this;
			this.xhr.onreadystatechange = function() {
				if(this.readyState == 4) {
					this.onreadystatechange = null;
					if(this.socket.xhr != this) {console.log(this.socket);}
				if(this.status == 200) {
					if(this.responseText[0] != '\ufffd') {var response = '\ufffd' + this.responseText.length + '\ufffd' + this.responseText;}
					else {var response = this.responseText;}
					while(response[0] == '\ufffd') {
						var ufffd = response.indexOf('\ufffd', 1);
						var len = response.substring(1, ufffd) * 1;
						var text = response.substring(ufffd + 1, len + ufffd + 1);
						response = response.substring(len + ufffd + 1);

						if(text.substring(0, 3) != '8::') {Torus.logs.socket[room].push({id: (new Date()).getTime(), message: text});}
						switch(text.substring(0, 3)) {
							case '0::': //disconnect
								Torus.close(room, 'Server closed the connection');
								return;
							case '1::': //connect
								if(!Torus.chats[room]) {throw new Error('Missing room on successful connect');}
								Torus.chats[room].connecting = false;
								Torus.chats[room].connected = true;
								Torus.io.sendCommand(room, 'initquery');
								Torus.alert('Connected.', room);
								Torus.io.getBlockedPrivate();
								Torus.chats[room].callListeners('open');
								Torus.callListeners('open', room);
								break;
							case '4::': //json
								Torus.io.receive(room, JSON.parse(text.substring(4)));
								break;
							case '7::': //error
								Torus.close(room, 'Protocol error: ' + text.substring(4));
								return;
							case '8::': //noop
								break;
							case '2::': //heartbeat
							case '3::': //message
							case '5::': //event
							case '6::': //ack
								Torus.close(room, 'Protocol error: Received unimplemented data type ' + text);
								break;
						}
					}
					this.socket.poll();
				} //status == 200
				else if(this.status == 404) {this.socket.poll();}
				else if(this.status != 0) {Torus.close(room, 'Socket error (xhr-polling): HTTP status ' + this.status);}
				else if(Torus.chats[room] && this.onabort) {Torus.reopen(room);} //not aborted, just died
				} //readyState == 4
			}
			this.xhr.onabort = function(event) {
				console.log(event);
				Torus.close(room, 'aborted');
			}
			this.xhr.send();
		},
		close: function() {this.xhr.abort();},
		silence: function() {this.xhr.onabort = null;}
	};
	sock.poll();
	return sock;
}