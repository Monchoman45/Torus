Torus.commands = {
	join: {
		help: 'Join a room. Accepts either the id of the room, or the domain name (for example, community will take you to the room for [[w:|community.wikia.com]]). Specifying 0 will part all rooms.',
		func: function(room) {
			if(isNaN(room * 1)) {
				if(!Torus.data.domains[room]) {return 'Unable to look up ' + room + ' in database. Try [[w:c:' + room + ':Special:Torus]].';}
				else {room = Torus.data.domains[room];}
			}

			if(room <= 0) {
				for(var i in Torus.chats) {
					Torus.close(i);
				}
				return true;
			}
			else {Torus.open(room);}
		}
	},
	part: {
		help: 'Leave a room. If no room is specified, the current room is left.',
		func: function(room) {
			if(!room) {Torus.close(Torus.ui.active, 'closed');}
			else {
				if(isNaN(room * 1) && !Torus.chats[Torus.data.domains[room]]) {return 'Invalid room ' + room + '.';}
				else {Torus.close(room, 'closed');}
			}
		}
	},
	quit: '/logout',
	logout: {
		help: 'Leave every room.',
		func: Torus.logout
	},
	kick: {
		help: 'Kicks a user from the current room.',
		func: function() {
			var user = '';
			for(var i = 0; i < arguments.length; i++) {user += ' ' + arguments[i];}
			user = user.substring(1);
			Torus.io.kick(Torus.ui.active, user);
		}
	},
	ban: {
		help: 'Bans or rebans a user from the current room.',
		func: function(expiry) {
			var user = '';
			for(var i = 1; i < arguments.length; i++) {user += ' ' + arguments[i];}
			user = user.substring(1);
			Torus.io.ban(Torus.ui.active, user, expiry, 'Misbehaving in chat');
		}
	},
	unban: {
		help: 'Unbans a user from the current room.',
		func: function() {
			var user = '';
			for(var i = 0; i < arguments.length; i++) {user += ' ' + arguments[i];}
			user = user.substring(1);
			Torus.io.ban(Torus.ui.active, user, 0, 'undo');
		}
	},
	mod: '/givemod',
	givemod: {
		help: 'Promotes a user to chatmod in the current room.',
		func: function() {
			var user = '';
			for(var i = 0; i < arguments.length; i++) {user += ' ' + arguments[i];}
			user = user.substring(1);
			Torus.io.giveMod(Torus.ui.active, user);
		}
	},
	query: '/private',
	priv: '/private',
	private: {
		help: 'Opens a private room. Users can be specified in a comma-separated list.',
		func: function() {
			var users = '';
			for(var i = 0; i < arguments.length; i++) {users += ' ' + arguments[i];}
			users = users.substring(1).split(', ');
			Torus.io.openPrivate(Torus.ui.active, users);
		}
	},
	away: {
		help: 'Toggles your away status for the current room.',
		func: function() {
			var message = '';
			for(var i = 0; i < arguments.length; i++) {message += ' ' + arguments[i];}
			message = message.substring(1);
			var user = Torus.chats[Torus.ui.active].userlist[wgUserName];

			if(user.statusState == 'away') {
				if(user.oldState == 'away') {Torus.io.setStatus(Torus.ui.active, 'here', '');}
				else {Torus.io.setStatus(Torus.ui.active, user.oldState, user.oldMessage);}
			}
			else {Torus.io.setStatus(Torus.ui.active, 'away', message);}
		}
	},
	back: {
		help: 'Sets your status as present for the current room.',
		func: function(message) {
			if(!message) {message = '';}
			Torus.io.setStatus(Torus.ui.active, 'here', message);
		}
	},
	status: {
		help: 'Changes your status state or message for the current room.',
		func: function(state) {
			var message = '';
			for(var i = 1; i < arguments.length; i++) {message += ' ' + arguments[i];}
			Torus.io.setStatus(Torus.ui.active, state, message);
		}
	},
	me: {
		help: 'Emote yourself.',
		func: function() {
			var str = '';
			for(var i = 0; i < arguments.length; i++) {str += ' ' + arguments[i];}
			Torus.io.sendMessage(Torus.ui.active, '* ' + wgUserName + str, false);
		}
	},
	db: '/database',
	database: {
		help: 'Look up domains and room ids in the database.',
		func: function(room) {
			if(!room) { //print everything
				var str = '';
				for(var i in Torus.data.domains) {
					str += '\n[[w:c:' + i + '|' + i + ']]: ' + Torus.data.domains[i];
				}
				return str.substring(1);
			}
			else if(isNaN(room * 1)) {return '[[w:c:' + room + '|' + room + ']]: ' + Torus.data.domains[room];}
			else {return '[[w:c:' + Torus.data.ids[room] + '|' + Torus.data.ids[room] + ']]: ' + room;}
		}
	},
	options: {
		help: 'View options.',
		func: function() {
			Torus.ui.activate(-1);
		}
	},
	fullscreen: {
		help: 'Make Torus fullscreen.',
		func: Torus.ui.fullscreen
	},
	help: {
		help: 'Displays help data.',
		func: function() {
			var str = '';
			for(var i = 0; i < arguments.length; i++) {str += ' ' + arguments[i];}
			str = str.substring(1);

			if(str) {
				var help = Torus.commands.eval(str, 'help');
				if(!help) {Torus.alert('No help data for ' + str);}
				else {return 'Help: ' + str + ': ' + help;}
			}
			else {
				var coms = '';
				for(var i in Torus.commands) {
					if(typeof Torus.commands[i] != 'function') {coms += ', ' + i;}
				}
				coms = coms.substring(2);
				return 'Commands:\n' + coms;
			}
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
}
