Torus.commands = {};
Torus.commands.join = {
	help: 'Usage: /join <domain>\n' //FIXME: i18n
	    + 'Join the chat room associated with <domain>. `/join 0` is special, it is the same as `/logout`.\n'
	    + 'For example, `/join community` will take you to the room for [[w:|community.wikia.com]].',
	func: function(room) {
		if(room == '0') {
			Torus.logout();
			return;
		}

		Torus.open(room);
	}
};
Torus.commands.part = {
	help: 'Usage: /part <domain>\n' //FIXME: i18n
	    + 'Leave the room associated with <domain>. If <domain> is unspecified, you will leave the room you are currently viewing.',
	func: function(room) {
		if(!room) {Torus.ui.active.disconnect('closed');}
		else {
			var chat = Torus.chats[room];
			if(!chat || (!chat.connecting && !chat.connected)) {return 'Invalid room ' + room + '.';} //FIXME: i18n
			else {chat.disconnect('closed');}
		}
	}
};
Torus.commands.quit = '/logout';
Torus.commands.logout = {
	help: 'Usage: /logout\n' //FIXME: i18n
	    + 'Leave every room.',
	func: Torus.logout
};
Torus.commands.kick = {
	help: 'Usage: /kick <user>\n' //FIXME: i18n
	    + 'Kick <user> from the current room.',
	func: function() {
		var user = '';
		for(var i = 0; i < arguments.length; i++) {user += ' ' + arguments[i];}
		user = user.substring(1);
		Torus.ui.active.kick(user);
	}
};
Torus.commands.ban = {
	help: 'Usage: /ban <user> <expiry>\n' //FIXME: i18n
	    + 'Ban or reban <user> from the current room. If <user>\'s name includes spaces, you must put quotes around their name. If <user>\'s name includes quotes, you must precede them with a backslash (\\).\n'
	    + 'For example:\n'
	    + '`/ban Troll 1 day`: Bans the user `Troll` for 1 day.\n'
	    + '`/ban "A big troll" 3 years`: Bans the user `A big troll` for 3 years.\n'
	    + '`/ban "A \\"big\\" troll" infinite`: Bans the user `A "big" troll` forever.',
	func: function(expiry) {
		var user = '';
		for(var i = 1; i < arguments.length; i++) {user += ' ' + arguments[i];}
		user = user.substring(1);
		Torus.ui.active.ban(user, expiry * 1, 'Misbehaving in chat'); //FIXME: ?action=query&meta=allmessages
	}
};
Torus.commands.unban = {
	help: 'Usage: /unban <user>\n' //FIXME: i18n
	    + 'Unban <user> from the current room.',
	func: function() {
		var user = '';
		for(var i = 0; i < arguments.length; i++) {user += ' ' + arguments[i];}
		user = user.substring(1);
		Torus.ui.active.ban(user, 0, 'undo'); //FIXME: ?action=query&meta=allmessages
	}
};
Torus.commands.mod = '/givemod';
Torus.commands.givemod = {
	help: 'Usage: /givemod <user>\n' //FIXME: i18n
	    + 'Promote <user> to chatmod in the current room.',
	func: function() {
		var user = '';
		for(var i = 0; i < arguments.length; i++) {user += ' ' + arguments[i];}
		user = user.substring(1);
		Torus.ui.active.mod(user);
	}
};
Torus.commands.pm = '/private';
Torus.commands.query = '/private';
Torus.commands.priv = '/private';
Torus.commands.private = {
	help: 'Usage: /private <user1> <user2> <user3>...\n' //FIXME: i18n
	    + 'Open a private room with each of the specified users. If a user\'s name includes spaces, you must put quotes around their name. If a user\'s name includes quotes, you must precede them with a backslash (\\).\n'
	    + 'For example:\n'
	    + '`/private Coolguy`: PM the user `Coolguy`.\n'
	    + '`/private "Cool guy"`: PM the user `Cool guy`.\n'
	    + '`/private "\\"Cool\\" guy"`: PM the user `"Cool" guy`.\n'
	    + '`/private "\\"Cool\\" guy" "Some mod" Admin`: Open a multi-user private room with `"Cool" guy`, `Some mod`, and `Admin`.',
	func: function() {
		var users = '';
		for(var i = 0; i < arguments.length; i++) {users += ' ' + arguments[i];}
		users = users.substring(1).split(', ');
		Torus.ui.active.open_private(users);
	}
};
Torus.commands.away = {
	help: 'Usage: /away <message>\n' //FIXME: i18n
	    + 'Toggle your away status for the current room. If <message> is specified, your status message will be set to that.',
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
	help: 'Usage: /back <message>\n' //FIXME: i18n
	    + 'Set your status state to `here` for the current room. If <message> is specified, your status message will be set to that.',
	func: function(message) {
		if(!message) {message = '';}
		Torus.ui.active.set_status('here', message);
	}
};
Torus.commands.status = {
	help: 'Usage: /status <state> <message>\n' //FIXME: i18n
	    + 'Change your status state and/or message for the current room. Your status state can only be one word (no spaces), but your status message can be as long as you want. Users on Special:Chat won\'t be able to see either.\n'
	    + 'Two status states are special:\n'
	    + '`here`: used to denote active users. `/back` will set your status state to this.\n'
	    + '`away`: user to denote inactive users. `/away` will set your status state to this.',
	func: function(state) {
		var message = '';
		for(var i = 1; i < arguments.length; i++) {message += ' ' + arguments[i];}
		Torus.ui.active.set_status(state, message);
	}
};
/*Torus.commands.me = { //XXX: right now /me is implemented by literally sending /me
	help: 'Usage: /me <message>\n' //FIXME: i18n
	    + 'Emote yourself.',
	func: function() {
		var str = '';
		for(var i = 0; i < arguments.length; i++) {str += ' ' + arguments[i];}
		Torus.ui.active.send_message('* ' + wgUserName + str, false);
	}
};*/
Torus.commands.options = {
	help: 'Usage: /options\n' //FIXME: i18n
	    + 'View options.',
	func: function() {Torus.ui.activate(Torus.ext.options);}
};
Torus.commands.fullscreen = {
	help: 'Usage: /fullscreen\n' //FIXME: i18n
	    + 'Make Torus fullscreen.',
	func: Torus.ui.fullscreen
};
Torus.commands.help = {
	help: 'Usage: /help <command>\n' //FIXME: i18n
	    + 'Displays help data.',
	func: function() {
		var str = '';
		for(var i = 0; i < arguments.length; i++) {str += ' ' + arguments[i];}
		str = str.substring(1);

		if(str) {
			var help = Torus.commands.eval(str, 'help');
			if(!help) {Torus.alert('No help data for ' + str);} //FIXME: i18n
			else {return 'Help: ' + str + ':\n' + help;} //FIXME: i18n
		}
		else {
			var coms = '';
			for(var i in Torus.commands) {
				if(typeof Torus.commands[i] != 'function' && typeof Torus.commands[i] != 'string') {coms += ', ' + i;}
			}
			coms = coms.substring(2);
			return 'Commands:\n' + coms + '\nFull documentation: [[w:c:monchbox:Torus]]'; //FIXME: i18n
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
