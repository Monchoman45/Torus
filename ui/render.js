Torus.ui.render = function(el) {
	if(!el) {el = Torus.ui.ids['window'];}
	var rooms = [];
	var indexes = [];
	var active = false;
	if(Torus.ui.active != Torus.chats[0]) {
		for(var i = 0; i < Torus.ui.viewing.length; i++) {
			if(Torus.ui.viewing[i] == Torus.ui.active) {active = true;}
			if(Torus.logs.messages[Torus.ui.viewing[i].domain].length > 0) {
				rooms.push(Torus.logs.messages[Torus.ui.viewing[i].domain]);
				indexes.push(Torus.logs.messages[Torus.ui.viewing[i].domain].length - 1);
			}
		}
	}
	if(!active && Torus.logs.messages[Torus.ui.active.domain].length > 0) {
		rooms.push(Torus.logs.messages[Torus.ui.active.domain]);
		indexes.push(Torus.logs.messages[Torus.ui.active.domain].length - 1);
	}

	var frag = document.createDocumentFragment(); //yo these things are so cool
	for(var i = 0; i < Torus.options['messages-general-max'] && rooms.length > 0; i++) {
		var message = rooms[0][indexes[0]];
		var source = 0;
		for(var j = 1; j < rooms.length; j++) {
			if(rooms[j][indexes[j]].id > message.id) {
				message = rooms[j][indexes[j]];
				source = j;
			}
		}
		indexes[source]--;
		if(indexes[source] == -1) { //no more messages
			rooms.splice(source, 1);
			indexes.splice(source, 1);
		}
		if(i == 0) {frag.appendChild(Torus.ui.render_line(message));}
		else {frag.insertBefore(Torus.ui.render_line(message), frag.firstChild);}
	}
	el.appendChild(frag);

	//rerender userlist
	//FIXME: now that this is a generalized function, should we still do this or move it somewhere else?
	if(Torus.ui.active.id > 0) {
		//FIXME: this is really hacky
		var e = {room: Torus.ui.active};
		for(var i in Torus.ui.active.userlist) {
			e.user = i;
			Torus.ui.update_user(e);
		}
	}

	el.scrollTop = el.scrollHeight;

	var event = new Torus.classes.UIEvent('render');
	event.target = el;
	Torus.call_listeners(event);
}

Torus.ui.render_line = function(message) {
	if(message.type != 'io') {throw new Error('Torus.ui.render_line: Event type must be `io`.');}

	var line = document.createElement('div');
		line.className = 'torus-message torus-room-' + message.room.domain;
		if(message.room != Torus.ui.active) {line.classList.add('torus-message-inactive');}
		var time = document.createElement('span');
			time.className = 'torus-message-timestamp';
			time.textContent = '[' + Torus.util.timestamp(message.time) + ']';
		line.appendChild(time);
		var viewing = Torus.ui.viewing.length;
		if(Torus.ui.viewing.indexOf(Torus.chats[0]) != -1) {viewing--;}
		if(Torus.ui.viewing.indexOf(Torus.ui.active) != -1) {viewing--;}
		if(viewing > 0) {
			var max = message.room.name.length;
			for(var i = 0; i < Torus.ui.viewing.length; i++) {
				if(max < Torus.ui.viewing[i].name.length) {max = Torus.ui.viewing[i].name.length;}
			}
			if(max < Torus.ui.active.name.length) {max = Torus.ui.active.name.length;}
			max -= message.room.name.length;
			var indent = '';
			for(var i = 0; i < max; i++) {indent += ' ';}

			line.appendChild(document.createTextNode(' '));
			var room = document.createElement('span');
				room.className = 'torus-message-room';
				room.textContent = '{' + message.room.name + '}' + indent;
			line.appendChild(room);
		}
		line.appendChild(document.createTextNode(' '));

		switch(message.event) {
			case 'me':
			case 'message':
				if(message.event == 'message') {
					var span = document.createElement('span'); //this is arguably one of the dumber things i've ever done
					span.className = 'torus-whitespace'; //it works though
					span.textContent = '  '; //#yolo
					line.appendChild(span);
					line.appendChild(document.createTextNode('<'));
					line.appendChild(Torus.ui.span_user(message.user));
					line.appendChild(document.createTextNode('> '));
				}
				else {
					line.appendChild(document.createTextNode('*'));
					var span = document.createElement('span'); //this is arguably one of the dumber things i've ever done
					span.className = 'torus-whitespace'; //it works though
					span.textContent = '  '; //#yolo
					line.appendChild(span);
					line.appendChild(Torus.ui.span_user(message.user));
					line.appendChild(document.createTextNode(' '));
				}
				line.innerHTML += message.html; //FIXME: innerHTML +=
				break;
			case 'alert':
				line.appendChild(document.createTextNode('== '));
				line.innerHTML += message.html; //FIXME: innerHTML +=
				break;
			case 'join':
			case 'rejoin':
			case 'ghost':
				//FIXME: i18n - this shows up as "user joined room"
				//FIXME: and ghost is only here because message.event + 'ed' is the correct tense
				line.appendChild(document.createTextNode('== '));
				line.appendChild(Torus.ui.span_user(message.user));
				line.appendChild(document.createTextNode(' ' + message.event + 'ed {' + message.room.name + '}'));
				break;
			case 'part':
				//FIXME: i18n
				line.appendChild(document.createTextNode('== '));
				line.appendChild(Torus.ui.span_user(message.user));
				line.appendChild(document.createTextNode(' left {' + message.room.name + '}'));
				break;
			case 'logout':
				//FIXME: i18n
				line.appendChild(document.createTextNode('== '));
				line.appendChild(Torus.ui.span_user(message.user));
				line.appendChild(document.createTextNode(' logged out'));
				break;
			case 'mod':
				//FIXME: i18n
				line.appendChild(document.createTextNode('== '));
				line.appendChild(Torus.ui.span_user(message.performer));
				line.appendChild(document.createTextNode(' promoted '));
				line.appendChild(Torus.ui.span_user(message.target));
				line.appendChild(document.createTextNode(' to chatmod of {' + message.room.name + '}'));
				break;
			case 'kick':
			case 'ban':
			case 'unban':
				//FIXME: i18n
				if(message.event != 'kick') {var tense = 'ned';} //curse you, english language
				else {var tense = 'ed'}
				if(message.room.parent) {var domain = message.room.parent.domain;}
				else {var domain = message.room.domain;}

				line.appendChild(document.createTextNode('== '));
				line.appendChild(Torus.ui.span_user(message.performer));
				line.appendChild(document.createTextNode(' ' + message.event + tense + ' '));
				line.appendChild(Torus.ui.span_user(message.target));
				line.appendChild(document.createTextNode(' ('));
				var talk = document.createElement('a');
					talk.href = 'http://' + domain + '.wikia.com/wiki/User_talk:' + message.target;
					talk.textContent = 't';
					talk.addEventListener('click', Torus.ui.click_link);
				line.appendChild(talk);
				line.appendChild(document.createTextNode('|'));
				var contribs = document.createElement('a');
					contribs.href = 'http://' + domain + '.wikia.com/wiki/Special:Contributions/' + message.target;
					contribs.textContent = 'c';
					contribs.addEventListener('click', Torus.ui.click_link);
				line.appendChild(contribs);
				line.appendChild(document.createTextNode('|'));
				var ban = document.createElement('a');
					ban.href = 'http://' + domain + '.wikia.com/wiki/Special:Log/chatban?page=User:' + message.target;
					ban.textContent = 'log';
					ban.addEventListener('click', Torus.ui.click_link);
				line.appendChild(ban);
				line.appendChild(document.createTextNode('|'));
				var ccon = document.createElement('a');
					ccon.href = 'http://' + domain + '.wikia.com/wiki/Special:Log/chatconnect?user=' + message.target;
					ccon.textContent = 'ccon';
					//ccon.addEventListener('click', Torus.ui.click_link);
					ccon.className = 'torus-fakelink';
					ccon.setAttribute('data-user', message.target);
					ccon.addEventListener('click', function(event) { //FIXME: ccui is not required
						event.preventDefault();
						Torus.ui.activate(Torus.ext.ccui);
						Torus.ui.ids['window'].scrollTop = 0;
						Torus.ext.ccui.query(this.getAttribute('data-user'));
					});
				line.appendChild(ccon);
				line.appendChild(document.createTextNode(') from {' + message.room.name + '}'));
				if(message.event == 'ban') {line.appendChild(document.createTextNode(' for ' + message.expiry));}
				break;
			default: throw new Error('Message type ' + message.event + ' is not rendered. (ui.render_line)');
		}
	return line;
}
