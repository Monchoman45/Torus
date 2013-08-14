Torus.ui.addRoom = function(room, name) {
	if(isNaN(room * 1)) {room = Torus.data.domains[room];}
	if(!room) {throw new Error('Invalid room ' + room + '. (ui.addRoom)');}
	if(room > 0) {name = (Torus.data.ids[room] ? Torus.data.ids[room] : room);}
	else if(!name) {throw new Error('Special rooms must be named');}
	
	if(Torus.chats[room]) {return;}
	Torus.ui.window.tabs.innerHTML += '<span id="torus-tab-' + room + '" class="torus-tab" onclick="event.preventDefault(); if(event.shiftKey && Torus.ui.active != ' + room + ') {Torus.ui.show(' + room + ');} else {Torus.ui.activate(' + room + ');}">' + name + (room > 0 ? '<span class="torus-tab-close" onclick="event.stopPropagation(); Torus.close(' + room + ', \'closed\');">x</span>' : '') + '</span>';
	if(room > 0) {
		if(!Torus.options.pings[name]) {
			Torus.options.pings[name] = {};
			Torus.options.pings[name].enabled = true;
			Torus.options.pings[name].case_sensitive = {type: 'text', value: ''};
			Torus.options.pings[name].case_insensitive = {type: 'text', value: ''};
		}
		Torus.chats[room] = {
			id: room,
			parent: false, //the source of a PM
			name: name,
			awayTimeout: 0,
			transport: 'xhr-polling',
			connected: false,
			connecting: true,
			reconnecting: false,
			userlist: {length: 0},
			listeners: {
				open: [],
				close: [],
				reopen: [],
				logout: [],
				render: [],
				activate: [],
				show: [],
				unshow: [],
				ping: [],
				initial: [],
				message: [],
				me: [],
				alert: [],
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
			},
			addListener: Torus.addListener,
			removeListener: Torus.removeListener,
			callListeners: Torus.callListeners
		};
		for(var i in Torus.logs) {
			if(!Torus.logs[i][room]) {Torus.logs[i][room] = [];}
		}
	}
	else {
		Torus.chats[room] = {
			name: name,
			listeners: {
				render: [],
				activate: []
			},
			addListener: Torus.addListener,
			removeListener: Torus.removeListener,
			callListeners: Torus.callListeners
		};
	}
}

Torus.ui.removeRoom = function(room) {
	if(isNaN(room * 1)) {room = Torus.data.domains[room];}
	if(!Torus.chats[room]) {throw new Error('Invalid room ' + room + '. (ui.removeRoom)');}
	
	if(room > 0 && Torus.chats[room].connected) {return Torus.close(room);} //function was called when the room is still open
	
	if(Torus.ui.active == room) {
		if(Torus.chats[room].parent) {Torus.ui.activate(Torus.chats[room].parent);}
		else {Torus.ui.activate(0);}
	}
	if(Torus.chats[room].viewing) {Torus.ui.show(room);}
	var tabs = Torus.ui.window.tabs;
	for(var i = 0; i < tabs.children.length; i++) {
		if(tabs.children[i].id == 'torus-tab-' + room) {tabs.removeChild(tabs.children[i]); break;}
	}
	delete Torus.chats[room];
}

Torus.ui.render = function() {
	var rooms = [];
	var indexes = [];
	var active = false;
	for(var i = 0; i < Torus.ui.viewing.length; i++) {
		if(Torus.ui.viewing[i] == Torus.ui.active) {active = true;}
		if(Torus.logs.messages[Torus.ui.viewing[i]].length > 0) {
			rooms.push(Torus.logs.messages[Torus.ui.viewing[i]]);
			indexes.push(Torus.logs.messages[Torus.ui.viewing[i]].length - 1);
		}
	}
	if(!active && Torus.logs.messages[Torus.ui.active].length > 0) {
		rooms.push(Torus.logs.messages[Torus.ui.active]);
		indexes.push(Torus.logs.messages[Torus.ui.active].length - 1);
	}
	
	Torus.ui.window.window.innerHTML = '';
	for(var i = 0; i < Torus.options.messages.general.max.value && rooms.length > 0; i++) {
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
		if(i == 0) {Torus.ui.window.window.appendChild(Torus.ui.renderLine(message));}
		else {Torus.ui.window.window.insertBefore(Torus.ui.renderLine(message), Torus.ui.window.window.firstChild);}
	}
	
	Torus.ui.window.sidebar.innerHTML = '';
	for(var i in Torus.chats[Torus.ui.active].userlist) {
		if(i == 'length') {continue;}
		Torus.ui.updateUser(Torus.ui.active, i);
	}
	
	if(Torus.ui.active > 0) {Torus.chats[Torus.ui.active].callListeners('render');}
	for(var i = 0; i < Torus.ui.viewing.length; i++) {
		if(Torus.ui.viewing[i] > 0) {Torus.chats[Torus.ui.viewing[i]].callListeners('render');}
	}
	Torus.ui.callListeners('render');
}

Torus.ui.activate = function(room) {
	if(isNaN(room * 1)) {room = Torus.data.domains[room];}
	if(!Torus.chats[room]) {throw new Error('Invalid room ' + room + '. (ui.activate)');}
	
	var tabs = Torus.ui.window.tabs.children;
	for(var i = 0; i < tabs.length; i++) {
		if(tabs[i].id == 'torus-tab-' + Torus.ui.active) {
			var classes = tabs[i].className.split(' ');
			for(var j = 0; j < classes.length; j++) {
				if(classes[j] == 'torus-tab-active') {classes.splice(j, 1); break;}
			}
			tabs[i].className = classes.join(' ');
			break;
		}
	}
	
	if(Torus.ui.active == -1) {Torus.options.save();}
	
	Torus.ui.active = room;
	for(var i = 0; i < tabs.length; i++) {
		if(tabs[i].id == 'torus-tab-' + room) {tabs[i].className += ' torus-tab-active'; break;}
	}
	
	Torus.ui.window.sidebar.innerHTML = '';
	if(room > 0) {Torus.ui.updateUser(room, wgUserName);}
	
	if(room > 0) {
		if(!Torus.chats[room].parent) {Torus.ui.window.info.innerHTML = 'Public room' + (Torus.data.ids[room] ? ' of <a href="http://' + Torus.data.ids[room] + '.wikia.com" onclick="event.preventDefault(); window.open(this.href, \'torus\');">' + Torus.data.ids[room] + '</a>' : '') + '. (' + room + ')';}
		else {Torus.ui.window.info.innerHTML = 'Private room of ' + (Torus.data.ids[Torus.chats[room].parent] ? '<a href="http://' + Torus.data.ids[Torus.chats[room].parent] + '.wikia.com" onclick="event.preventDefault(); window.open(this.href, \'torus\');">' + Torus.data.ids[Torus.chats[room].parent] + '</a>' : Torus.chats[room].parent) + ', between ' + Torus.chats[room].users.slice(0, Torus.chats[room].users.length - 1).join(', ') + ' and ' + Torus.chats[room].users[Torus.chats[room].users.length - 1] + '. (' + room + ')';}
	}
	else {Torus.ui.window.info.innerHTML = '';}

	if(room >= 0) {Torus.ui.render();}
	
	Torus.ui.window.window.scrollTop = Torus.ui.window.window.scrollHeight;
	if(room > 0) {Torus.chats[room].callListeners('activate');}
	Torus.ui.callListeners('activate', room);
}

Torus.ui.show = function(room) {
	if(isNaN(room * 1)) {room = Torus.data.domains[room];}
	if(room < 0 || !Torus.chats[room]) {throw new Error('Invalid room ' + room + '. (ui.show)');}

	var tabs = Torus.ui.window.tabs.children;
	if(Torus.chats[room].viewing) {
		Torus.chats[room].viewing = false;
		for(var i = 0; i < Torus.ui.viewing.length; i++) {
			if(Torus.ui.viewing[i] == room) {Torus.ui.viewing.splice(i, 1);}
		}
		for(var i = 0; i < tabs.length; i++) {
			if(tabs[i].id == 'torus-tab-' + room) {
				var classes = tabs[i].className.split(' ');
				for(var j = 0; j < classes.length; j++) {
					if(classes[j] == 'torus-tab-viewing') {classes.splice(j, 1); break;}
				}
				tabs[i].className = classes.join(' ');
				break;
			}
		}
		Torus.ui.render();
		if(room > 0) {Torus.chats[room].callListeners('unshow');}
		Torus.ui.callListeners('unshow', room);
		return;
	}
	Torus.ui.viewing.push(room);
	Torus.chats[room].viewing = true;
	for(var i = 0; i < tabs.length; i++) {
		if(tabs[i].id == 'torus-tab-' + room) {tabs[i].className += ' torus-tab-viewing'; break;}
	}
	
	Torus.ui.render();
	Torus.ui.window.window.scrollTop = Torus.ui.window.window.scrollHeight;
	
	if(room > 0) {Torus.chats[room].callListeners('show');}
	Torus.ui.callListeners('show', room);
}

Torus.ui.addLine = function(message) {
	if(isNaN(message.room * 1)) {message.room = Torus.data.domains[message.room];}
	if(!Torus.chats[message.room]) {throw new Error('Invalid room ' + message.room + '. (ui.addLine)');}
	if(message.room < 0) {throw new Error('Cannot add lines to special rooms. (ui.addLine)');}
	
	Torus.logs.messages[message.room].push(message);
	//Torus.logs.plain[message.room].push(message);
	
	if(message.room == Torus.ui.active || (Torus.chats[message.room].viewing && Torus.ui.active >= 0)) {
		var scroll = false;
		if(Torus.ui.window.window.offsetHeight + Torus.ui.window.window.scrollTop >= Torus.ui.window.window.scrollHeight) {scroll = true;}
		Torus.ui.window.window.appendChild(Torus.ui.renderLine(message));
		if(scroll) {Torus.ui.window.window.scrollTop = Torus.ui.window.window.scrollHeight;}
		
		if(Torus.ui.window.window.children.length > Torus.options.messages.general.max.value) {Torus.ui.window.window.removeChild(Torus.ui.window.window.children[0]);}
	}
}

Torus.ui.renderLine = function(message) {
	if(message.type != 'io') {throw new Error('Event type must be io. (ui.renderLine)');}
	var line = document.createElement('div');
	line.className = 'torus-message torus-room-' + message.room;
	if(message.room != Torus.ui.active) {line.className += ' torus-message-inactive';}
	line.innerHTML = '<span class="torus-message-timestamp">[' + Torus.util.timestamp(message.time) + ']</span> <span class="torus-message-room">(' + (Torus.data.ids[message.room] ? Torus.data.ids[message.room] : message.room) + ')</span> ';
	switch(message.event) {
		case 'message':
			line.innerHTML += '&lt;<span class="torus-message-usercolor" style="color:' + Torus.util.colorHash(message.user) + ';">' + message.user + '</span>&gt; ' + message.text;
			break;
		case 'me':
			line.innerHTML += '* <span class="torus-message-usercolor" style="color:' + Torus.util.colorHash(message.user) + ';">' + message.user + '</span> ' + message.text;
			break;
		case 'alert':
			line.innerHTML += '== ' + message.text;
			break;
		case 'join':
		case 'rejoin':
		case 'ghost':
			line.innerHTML += '== <span class="torus-message-usercolor" style="color:' + Torus.util.colorHash(message.user) + ';">' + message.user + '</span> ' + message.event + 'ed ' + (Torus.data.ids[message.room] ? Torus.data.ids[message.room] : message.room);
			break;
		case 'part':
			line.innerHTML += '== <span class="torus-message-usercolor" style="color:' + Torus.util.colorHash(message.user) + ';">' + message.user + '</span> left ' + (Torus.data.ids[message.room] ? Torus.data.ids[message.room] : message.room);
			break;
		case 'logout':
			line.innerHTML += '== <span class="torus-message-usercolor" style="color:' + Torus.util.colorHash(message.user) + ';">' + message.user + '</span> logged out';
			break;
		case 'mod':
			line.innerHTML += '== <span class="torus-usercolor" style="color:' + Torus.util.colorHash(message.performer) + '">' + message.performer + '</span> promoted <span class="torus-usercolor" style="color:' + Torus.util.colorHash(message.target) + '">' + message.target + '</span> to chatmod';
			break;
		case 'kick':
		case 'ban':
		case 'unban':
			if(message.event != 'kick') {var tense = 'ned';} //curse you, english language
			else {var tense = 'ed'}
			line.innerHTML += '== <span class="torus-message-usercolor" style="color:' + Torus.util.colorHash(message.performer) + ';">' + message.performer + '</span> ' + message.event + tense + ' <span class="torus-message-usercolor" style="color:' + Torus.util.colorHash(message.target) + ';">' + message.target + '</span> from ' + (Torus.data.ids[message.room] ? Torus.data.ids[message.room] : message.room);
			if(message.event == 'ban') {line.innerHTML += ' for ' + message.expiry;}
			break;
		default: throw new Error('Message type ' + message.event + ' is not rendered. (ui.renderLine)');
	}
	return line;
}

Torus.ui.updateUser = function(room, name, props) {
	if(isNaN(room * 1)) {room = Torus.data.domains[room];}
	if(!Torus.chats[room] || room <= 0) {throw new Error('Invalid room ' + room + '. (ui.updateUser)');}

	if(!Torus.chats[room].userlist[name] && !props) {return;}
	else if(!Torus.chats[room].userlist[name] && props) {Torus.chats[room].userlist.length++;}
	if(props) {
		if(!Torus.chats[room].userlist[name]) {Torus.chats[room].userlist[name] = props;}
		else {
			for(var i in props) {Torus.chats[room].userlist[name][i] = props[i];}
		}
	}
	props = Torus.chats[room].userlist[name];
	
	if(Torus.ui.active == room) {
		var userlist = Torus.ui.window.sidebar.getElementsByTagName('li');
		var changed = false;
		for(var i = 0; i < userlist.length; i++) {
			if(userlist[i].className.indexOf('torus-user-' + encodeURIComponent(name)) != -1) { //is encodeURIComponent sufficient for this?
				var li = userlist[i];
				changed = true;
				break;
			}
		}
		if(!changed) {
			var li = document.createElement('li');
			li.onmouseover = function(event) {Torus.ui.renderPopup(name);}
			var sidebar = Torus.ui.window.sidebar;
			var added = false;
			for(var i = 0; i < sidebar.children.length; i++) {
				var child = sidebar.children[i].children[sidebar.children[i].children.length - 1].textContent;
				var before = true;
				for(var j = 0; j < child.length; j++) {
					if(child.charCodeAt(j) > name.charCodeAt(j)) {break;}
					else if(child.charCodeAt(j) != name.charCodeAt(j)) {before = false; break;}
				}
				if(before) {
					sidebar.insertBefore(li, sidebar.children[i]);
					added = true;
					break;
				}
			}
			if(!added) {sidebar.appendChild(li);} //is at the end of the alphabet
		}
		
		li.className = 'torus-user ' + (props.mod || props.staff ? 'torus-user-' + (props.staff ? 'staff' : 'mod') + ' ' : '') + 'torus-user-' + encodeURIComponent(name);
		li.innerHTML = (props.mod || props.staff ? '<img class="torus-user-icon-' + (props.staff ? 'staff' : 'mod') + '" src="http://images2.wikia.nocookie.net/monchbox/images/' + (props.staff ? 'f/f3/Icon-staff' : '6/6b/Icon-chatmod') + '.png">' : '') + '&nbsp;<span class="torus-user-name' + (props.statusState.toLowerCase() == 'away' ? ' torus-user-away' : '') + '">' + name + '</span>';
	}
}

Torus.ui.removeUser = function(room, name) {
	if(isNaN(room * 1)) {room = Torus.data.domains[room];}
	if(!Torus.chats[room] || room <= 0) {throw new Error('Invalid room ' + room + '. (ui.removeUser)');}

	delete Torus.chats[room].userlist[name];
	Torus.chats[room].userlist.length--;
	if(Torus.ui.active == room) {
		var users = Torus.ui.window.sidebar.getElementsByTagName('li');
		for(var i = 0; i < users.length; i++) {
			if(users[i].className.indexOf('torus-user-' + encodeURIComponent(name)) != -1) {
				users[i].parentNode.removeChild(users[i]);
				break;
			}
		}
	}
}

Torus.ui.renderPopup = function(name, room, coords) {
	if(!room || room <= 0) {room = Torus.ui.active;}
	if(!name || !Torus.chats[room].userlist[name]) {throw new Error('Invalid user ' + name + '. (ui.renderPopup)');}
	
	var target = Torus.chats[room].userlist[name];
	var user = Torus.chats[room].userlist[wgUserName];
	var html = '<img id="torus-popup-avatar" src="' + target.avatar + '"><div id="torus-popup-info"><div><span id="torus-popup-name">' + name + '</span>';
	if(target.mod || target.staff) {html += ' <span id="torus-popup-access"><img class="torus-user-icon-' + (target.staff ? 'staff' : 'mod') + '" src="http://images2.wikia.nocookie.net/monchbox/images/' + (target.staff ? 'f/f3/Icon-staff' : '6/6b/Icon-chatmod') + '.png">' + (!target.staff && target.givemod ? '+' : '') + '</span>';}
	html += '</div><div id="torus-popup-status-state">' + target.statusState + '</div><div id="torus-popup-status-message">' + target.statusMessage + '</div></div>';
	if(Torus.data.ids[room]) {html += '<div id="torus-popup-userlinks"><div><a class="torus-popup-userlink" href="http://' + Torus.data.ids[room] + '.wikia.com/wiki/User_talk:' + name + '" onclick="event.preventDefault(); window.open(this.href, \'torus\');">talk</a><a class="torus-popup-userlink" href="http://' + Torus.data.ids[room] + '.wikia.com/wiki/Special:Contributions/' + name + '" onclick="event.preventDefault(); window.open(this.href, \'torus\');">contribs</a></div><div><a class="torus-popup-userlink" href="http://' + Torus.data.ids[room] + '.wikia.com/wiki/Special:Log/chatban?page=User:' + name + '" onclick="event.preventDefault(); window.open(this.href, \'torus\');">ban history</a><a class="torus-popup-userlink" href="http://' + Torus.data.ids[room] + '.wikia.com/wiki/Special:Log/chatconnect?user=' + name + '" onclick="event.preventDefault(); window.open(this.href, \'torus\');">chatconnect</a></div></div>';}
	else if(Torus.data.ids[Torus.chats[room].parent]) {html += '<div id="torus-popup-userlinks"><div><a class="torus-popup-userlink" href="http://' + Torus.data.ids[Torus.chats[room].parent] + '.wikia.com/wiki/User_talk:' + name + '" onclick="event.preventDefault(); window.open(this.href, \'torus\');">talk</a><a class="torus-popup-userlink" href="http://' + Torus.data.ids[Torus.chats[room].parent] + '.wikia.com/wiki/Special:Contributions/' + name + '" onclick="event.preventDefault(); window.open(this.href, \'torus\');">contribs</a></div><div><a class="torus-popup-userlink" href="http://' + Torus.data.ids[Torus.chats[room].parent] + '.wikia.com/wiki/Special:Log/chatban?page=User:' + name + '" onclick="event.preventDefault(); window.open(this.href, \'torus\');">ban history</a><a class="torus-popup-userlink" href="http://' + Torus.data.ids[Torus.chats[room].parent] + '.wikia.com/wiki/Special:Log/chatconnect?user=' + name + '" onclick="event.preventDefault(); window.open(this.href, \'torus\');">chatconnect</a></div></div>';}
	html += '<div id="torus-popup-actions"><a class="torus-popup-action" onclick="Torus.io.openPrivate(' + room + ', [\'' + name + '\']);">Private message</a>';
	var blocked = false;
	for(var i = 0; i < Torus.data.blocked.length; i++) {
		if(Torus.data.blocked[i] == name) {blocked = true; break;}
	}
	if(blocked) {html += '<a class="torus-popup-action" onclick="Torus.io.unblock(\'' + name + '\');">Unblock PMs</a>';}
	else {html += '<a class="torus-popup-action" onclick="Torus.io.block(\'' + name +  '\');">Block PMs</a>';}
	if((user.givemod || user.staff) && !target.mod && !target.staff) {html += '<a class="torus-popup-action" onclick="this.children[0].style.display = \'block\';"><div id="torus-popup-modconfirm"><input id="torus-popup-modconfirm-yes" type="button" value="Yes" onclick="Torus.io.giveMod(' + room + ', \'' + name + '\');"> Are you sure? <input id="torus-popup-modconfirm-no" type="button" value="No" onclick="this.parentNode.style.display = \'\'"></div>Promote to mod</a>';}
	else {html += '<a class="torus-popup-action torus-popup-action-disabled">Promote to mod</a>';}
	if(user.staff || user.givemod || (user.mod && !target.givemod && !target.staff)) {html += '<a class="torus-popup-action" onclick="Torus.io.kick(' + room + ', \'' + name + '\');">Kick</a><a class="torus-popup-action"><div id="torus-popup-banmodal"><div><label>Expiry:</label> <input type="text" id="torus-popup-banexpiry" placeholder="1 day" onkeyup="if(event.keyCode == 13) {if(this.value) {Torus.io.ban(' + room + ', \'' + name + '\', Torus.util.expiryToSeconds(this.value), this.parentNode.nextSibling.lastChild.value);} else {Torus.io.ban(' + room + ', \'' + name + '\', 60 * 60 * 24, this.parentNode.nextSibling.lastChild.value);}}"></input></div><div>Reason: <input type="text" id="torus-popup-banreason" placeholder="Misbehaving in chat" onkeyup="if(event.keyCode == 13) {var expiry = this.parentNode.previousSibling.lastChild.value; if(expiry) {Torus.io.ban(' + room + ', \'' + name + '\', Torus.util.expiryToSeconds(expiry), this.value);} else {Torus.io.ban(' + room + ', \'' + name + '\', 60 * 60 * 24, this.value);}}"></div><div><input type="submit" id="torus-popup-banbutton" value="Ban" onclick="Torus.io.ban(' + room + ', \'' + name + '\', Torus.util.expiryToSeconds(this.parentNode.previousSibling.previousSibling.lastChild.value), this.parentNode.previousSibling.lastChild.value);"></div></div>Ban</a>';}
	else {html += '<a class="torus-popup-action torus-popup-action-disabled">Kick</a><a class="torus-popup-action torus-popup-action-disabled">Ban</a>';}
	html += '</div>';
	Torus.ui.window.popup.innerHTML = html;
	
	Torus.ui.window.popup.style.display = 'block';
	if(coords) {
		Torus.ui.window.popup.style.right = 'auto';
		Torus.ui.window.popup.style.left = coords.x + 'px';
		Torus.ui.window.popup.style.top = coords.y + 'px';
	}
	else {
		var userlist = Torus.ui.window.sidebar.children;
		for(var i = 0; i < userlist.length; i++) {
			if(userlist[i].lastChild.innerHTML == name) {
				Torus.ui.window.popup.style.top = userlist[i].offsetTop - Torus.ui.window.sidebar.scrollTop + 'px';
				break;
			}
		}
	}
	Torus.ui.callListeners('renderPopup');
}

Torus.ui.unrenderPopup = function() {
	Torus.ui.window.popup.style.top = '';
	Torus.ui.window.popup.style.right = '';
	Torus.ui.window.popup.style.left = '';
	Torus.ui.window.popup.innerHTML = '';
	Torus.ui.window.popup.style.display = 'none';
	Torus.ui.callListeners('unrenderPopup');
}

Torus.ui.ping = function(room) {
	if(isNaN(room * 1)) {room = Torus.data.domains[room];}
	
	if(Torus.options.pings.general.enabled && Torus.ui.window.window.parentNode && Torus.data.pinginterval == 0) {
		Torus.data.titleflash = document.title;
		document.title = Torus.options.pings.general.alert.value;
		Torus.data.pinginterval = setInterval('if(document.title != Torus.options.pings.general.alert.value) {document.title = Torus.options.pings.general.alert.value;} else {document.title = Torus.data.titleflash;}', Torus.options.pings.general.interval.value);
		if(Torus.options.pings.general.beep.value) {
			var beep = document.createElement('audio');
			beep.src = Torus.options.pings.general.sound.value;
			beep.play();
		}
	}
	if(Torus.chats[room]) {Torus.chats[room].callListeners('ping');}
	Torus.ui.callListeners('ping');
}

Torus.ui.fullscreen = function() {
	if(Torus.data.fullscreen) {return;}
	if(Torus.ui.window.parentNode) {Torus.ui.window.parentNode.removeChild(Torus.ui.window);}
	document.body.innerHTML = ''; //bad. bad bad bad
	document.body.appendChild(Torus.ui.window);
	Torus.ui.window.style.height = document.getElementsByTagName('html')[0].clientHeight - 25 + 'px';
	//todo: change height with resize
	Torus.data.fullscreen = true;
	Torus.ui.callListeners('fullscreen');
}

Torus.ui.inputListener = function(event) {
	if(event.keyCode == 13 && !event.shiftKey) {
		event.preventDefault();
		if(Torus.data.history[1] != this.value) {
			Torus.data.history[0] = this.value;
			Torus.data.history.unshift('');
		}
		Torus.data.histindex = 0;
		
		while(this.value.charAt(0) == '/') {
			if(this.value.indexOf('\n') != -1) {
				var result = Torus.commands.eval(this.value.substring(1, this.value.indexOf('\n')));
				if(result != undefined) {Torus.alert(result);}
				this.value = this.value.substring(this.value.indexOf('\n') + 1);
			}
			else {
				var result = Torus.commands.eval(this.value.substring(1));
				if(result != undefined) {Torus.alert(result);}
				this.value = '';
			}
		}
		if(this.value) {
			if(this.value.indexOf('./') == 0) {Torus.io.sendMessage(Torus.ui.active, this.value.substring(1), false);}
			else {Torus.io.sendMessage(Torus.ui.active, this.value, false);}
			this.value = '';
		}
	}
	else if(event.keyCode == 9) {
		event.preventDefault();
		if(!Torus.data.tabtext) {
			str = this.value;
			while(str[str - 1] == ' ') {str = str.substring(0, str.length - 1);}
			Torus.data.tabpos = str.lastIndexOf(' ') + 1;
			Torus.data.tabtext = str.substring(Torus.data.tabpos);
		}
		var matches = 0;
		for(var user in Torus.chats[Torus.ui.active].userlist) {
			if(user == 'length') {continue;}
			if(user.indexOf(Torus.data.tabtext) == 0) {matches++;}
			if(matches > Torus.data.tabindex) {break;}
		}
		if(matches <= Torus.data.tabindex) {
			user = Torus.data.tabtext;
			Torus.data.tabindex = 0;
		}
		else {Torus.data.tabindex++;}
		if(Torus.data.tabpos == 0) {this.value = user + (Torus.data.tabindex == 0 ? '' : ': ');}
		else {this.value = this.value.substring(0, Torus.data.tabpos) + user;}
	}
	else if(event.keyCode == 38 && Torus.data.histindex + 1 < Torus.data.history.length) {
		Torus.data.histindex++;
		this.value = Torus.data.history[Torus.data.histindex];
	}
	else if(event.keyCode == 40 && Torus.data.histindex > 0) {
		Torus.data.histindex--;
		this.value = Torus.data.history[Torus.data.histindex];
	}
	else if(event.keyCode != 39 && event.keyCode != 41) {
		Torus.data.tabtext = '';
		Torus.data.tabindex = 0;
		Torus.data.tabpos = 0;
	}
}