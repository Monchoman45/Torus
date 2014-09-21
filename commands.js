Torus.commands = {};
Torus.commands.join = {
	help: 'Join a room. Accepts either the id of the room, or the domain name (for example, community will take you to the room for [[w:|community.wikia.com]]). Specifying 0 will part all rooms.', //FIXME: i18n
	func: function(room) {
		if(room == '0') {
			Torus.logout();
			return;
		}
		if(!Torus.database[room]) {return 'Unable to look up ' + room + ' in database. Try [[w:c:' + room + ':Special:Torus]], or [https://github.com/Monchoman45/Torus/issues/new?labels=database-addition ask to get it added to the database].\n';} //FIXME: i18n

		(new Torus.classes.Chat(Torus.database[room].room, room)).connect();
	}
};
Torus.commands.part = {
	help: 'Leave a room. If no room is specified, the current room is left.', //FIXME: i18n
	func: function(room) {
		if(!room) {Torus.ui.active.disconnect('closed');}
		else {
			if(!Torus.chats[room]) {return 'Invalid room ' + room + '.';} //FIXME: i18n
			else {Torus.chats[room].disconnect('closed');}
		}
	}
};
Torus.commands.quit = '/logout';
Torus.commands.logout = {
	help: 'Leave every room.', //FIXME: i18n
	func: Torus.logout
};
Torus.commands.kick = {
	help: 'Kicks a user from the current room.', //FIXME: i18n
	func: function() {
		var user = '';
		for(var i = 0; i < arguments.length; i++) {user += ' ' + arguments[i];}
		user = user.substring(1);
		Torus.ui.active.kick(user);
	}
};
Torus.commands.ban = {
	help: 'Bans or rebans a user from the current room.', //FIXME: i18n
	func: function(expiry) {
		var user = '';
		for(var i = 1; i < arguments.length; i++) {user += ' ' + arguments[i];}
		user = user.substring(1);
		Torus.ui.active.ban(user, expiry * 1, 'Misbehaving in chat'); //FIXME: ?action=query&meta=allmessages
	}
};
Torus.commands.unban = {
	help: 'Unbans a user from the current room.', //FIXME: i18n
	func: function() {
		var user = '';
		for(var i = 0; i < arguments.length; i++) {user += ' ' + arguments[i];}
		user = user.substring(1);
		Torus.ui.active.ban(user, 0, 'undo'); //FIXME: ?action=query&meta=allmessages
	}
};
Torus.commands.mod = '/givemod';
Torus.commands.givemod = {
	help: 'Promotes a user to chatmod in the current room.', //FIXME: i18n
	func: function() {
		var user = '';
		for(var i = 0; i < arguments.length; i++) {user += ' ' + arguments[i];}
		user = user.substring(1);
		Torus.ui.active.mod(user);
	}
};
Torus.commands.query = '/private';
Torus.commands.priv = '/private';
Torus.commands.private = {
	help: 'Opens a private room. Users can be specified in a comma-separated list.', //FIXME: i18n
	func: function() {
		var users = '';
		for(var i = 0; i < arguments.length; i++) {users += ' ' + arguments[i];}
		users = users.substring(1).split(', ');
		Torus.ui.active.open_private(users);
	}
};
Torus.commands.away = {
	help: 'Toggles your away status for the current room.', //FIXME: i18n
	func: function() {
		var message = '';
		for(var i = 0; i < arguments.length; i++) {message += ' ' + arguments[i];}
		message = message.substring(1);
		var user = Torus.ui.active.userlist[wgUserName];

		if(user.status_state == 'away') {
			if(user.old_state == 'away') {Torus.ui.active.set_status('here', '');}
			else {Torus.ui.active.set_status(user.old_state, user.old_message);}
		}
		else {Torus.ui.active.set_status('away', message);}
	}
};
Torus.commands.back = {
	help: 'Sets your status as present for the current room.', //FIXME: i18n
	func: function(message) {
		if(!message) {message = '';}
		Torus.ui.active.set_status('here', message);
	}
};
Torus.commands.status = {
	help: 'Changes your status state or message for the current room.', //FIXME: i18n
	func: function(state) {
		var message = '';
		for(var i = 1; i < arguments.length; i++) {message += ' ' + arguments[i];}
		Torus.ui.active.set_status(state, message);
	}
};
/*Torus.commands.me = { //XXX: right now /me is implemented by literally sending /me
	help: 'Emote yourself.',
	func: function() {
		var str = '';
		for(var i = 0; i < arguments.length; i++) {str += ' ' + arguments[i];}
		Torus.ui.active.send_message('* ' + wgUserName + str, false);
	}
};*/
Torus.commands.db = '/database';
Torus.commands.database = {
	help: 'Look up domains and room ids in the database.', //FIXME: i18n
	func: function(room) {
		if(!room) { //print everything
			var str = '';
			for(var i in Torus.database) {
				str += '\n[[w:c:' + i + '|' + i + ']]: ' + Torus.database[i].room;
			}
			return str.substring(1);
		}
		else {return '[[w:c:' + room + '|' + room + ']]: ' + Torus.database[room].room;}
	}
};
Torus.commands.options = {
	help: 'View options.', //FIXME: i18n
	func: function() {Torus.ui.activate(Torus.ext.options);}
};
Torus.commands.fullscreen = {
	help: 'Make Torus fullscreen.', //FIXME: i18n
	func: Torus.ui.fullscreen
};
Torus.commands.help = {
	help: 'Displays help data.', //FIXME: i18n
	func: function() {
		var str = '';
		for(var i = 0; i < arguments.length; i++) {str += ' ' + arguments[i];}
		str = str.substring(1);

		if(str) {
			var help = Torus.commands.eval(str, 'help');
			if(!help) {Torus.alert('No help data for ' + str);} //FIXME: i18n
			else {return 'Help: ' + str + ': ' + help;} //FIXME: i18n
		}
		else {
			var coms = '';
			for(var i in Torus.commands) {
				if(typeof Torus.commands[i] != 'function' && typeof Torus.commands[i] != 'string') {coms += ', ' + i;}
			}
			coms = coms.substring(2);
			return 'Commands:\n' + coms; //FIXME: i18n
		}
	}
};

Torus.commands.eval = function(str, prop) {
	if(typeof str != 'string') {return false;}
	var com = str.split(' ');
	var ref = Torus.commands;
	var i = 0;
	var cont = true;
	while(ref[com[i]]) {
		switch(typeof ref[com[i]]) {
			case 'string':
				if(ref[com[i]].charAt(0) == '/') {var line = ref[com[i]].substring(1) + ' ' + com.slice(i + 1).join(' ');}
				else {var line = com.slice(0, i).join(' ') + ' ' + ref[com[i]] + ' ' + com.slice(i + 1).join(' ');}
				return Torus.commands.eval(line, prop);
			case 'object':
				if(typeof ref[com[i]].func == 'function') {var command = ref[com[i]];} //is a command
				else {
					ref = ref[com[i]];
					i++;
					if(!ref[com[i]] && ref.default && ref.default.func) {var command = ref.default;}
				}
				if(command) {cont = false;}
				break;
			default:
				cont = false;
				break;
		}
		if(cont == false) {break;}
	}
	if(command) {
		if(prop == '*') {return ref;}
		else if(prop) {return command[prop];}
		else {return command.func.apply(ref, com.slice(i + 1));}
	}
	else {return false;}
}
