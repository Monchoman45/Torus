Torus.commands = {};
Torus.commands.join = {
	help: 'commands-help-join',
	func: function(room) {
		if(room == '0') {
			Torus.logout();
			return;
		}

		Torus.open(room);
	}
};
Torus.commands.part = {
	help: 'commands-help-part',
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
	help: 'commands-help-logout',
	func: Torus.logout
};
Torus.commands.kick = {
	help: 'commands-help-kick',
	func: function() {
		var user = '';
		for(var i = 0; i < arguments.length; i++) {user += ' ' + arguments[i];}
		user = user.substring(1);
		Torus.ui.active.kick(user);
	}
};
Torus.commands.ban = {
	help: 'commands-help-ban',
	func: function(user, expiry, summary) {
		if(!summary) {summary = 'Misbehaving in chat';} //FIXME: ?action=query&meta=allmessages
		Torus.ui.active.ban(user, expiry, summary);
	}
};
Torus.commands.unban = {
	help: 'commands-help-unban',
	func: function(user) {Torus.ui.active.ban(user, 0, 'undo');} //FIXME: ?action=query&meta=allmessages
};
Torus.commands.mod = '/givemod';
Torus.commands.givemod = {
	help: 'commands-help-givemod',
	func: function(user) {Torus.ui.active.mod(user);}
};
Torus.commands.pm = '/private';
Torus.commands.query = '/private';
Torus.commands.priv = '/private';
Torus.commands.private = {
	help: 'commands-help-private',
	func: function() {Torus.ui.active.open_private(Array.prototype.slice.call(arguments));}
};
Torus.commands.away = {
	help: 'commands-help-away',
	func: function(message) {
		var user = Torus.ui.active.userlist[wgUserName];

		if(user.status_state == 'away') {
			if(user.old_state == 'away') {Torus.ui.active.set_status('here', '');}
			else {Torus.ui.active.set_status(user.old_state, user.old_message);}
		}
		else {Torus.ui.active.set_status('away', message);}
	}
};
Torus.commands.back = {
	help: 'commands-help-back',
	func: function(message) {
		if(!message) {message = '';}
		Torus.ui.active.set_status('here', message);
	}
};
Torus.commands.status = {
	help: 'commands-help-status',
	func: function(state, message) {Torus.ui.active.set_status(state, message);}
};
Torus.commands.ctcp = {
	help: 'commands-help-ctcp',
	func: function(target, proto, message) {Torus.ui.active.ctcp(target, proto, message);}
};
/*Torus.commands.me = { //XXX: right now /me is implemented by literally sending /me
	help: 'commands-help-me',
	func: function() {
		var str = '';
		for(var i = 0; i < arguments.length; i++) {str += ' ' + arguments[i];}
		Torus.ui.active.send_message('* ' + wgUserName + str, false);
	}
};*/
Torus.commands.options = {
	help: 'commands-help-options',
	func: function() {Torus.ui.activate(Torus.ext.options);}
};
Torus.commands.fullscreen = {
	help: 'commands-help-fullscreen',
	func: Torus.ui.fullscreen
};
Torus.commands.help = {
	help: 'commands-help-help',
	func: function() {
		var str = '';
		for(var i = 0; i < arguments.length; i++) {str += ' ' + arguments[i];}
		str = str.substring(1);

		if(str) {
			var help = Torus.commands.eval(str, 'help');
			if(!help) {Torus.alert(Torus.i18n.text('commands-nohelp', str));}
			else {return Torus.i18n.text('commands-help', str, Torus.i18n.text(help));}
		}
		else {
			var coms = '';
			for(var i in Torus.commands) {
				if(typeof Torus.commands[i] != 'function' && typeof Torus.commands[i] != 'string') {coms += ', ' + i;}
			}
			coms = coms.substring(2);
			return Torus.i18n.text('commands-dir', coms);
		}
	}
};

Torus.commands.eval = function(str, prop) {
	if(typeof str != 'string') {return false;}
	var com = str.split(' ');
	for(var i = 0; i < com.length; i++) {
		if(com[i].charAt(0) == '"') {
			com[i] = com[i].substring(1);
			if(com[i].charAt(com[i].length - 1) == '"') {com[i] = com[i].substring(0, com[i].length - 1);}
			else {
				var j = i + 1;
				for(j; j < com.length && com[j].charAt(com[j].length - 1) != '"'; j++) {com[i] += ' ' + com[j];}
				com[i] += ' ' + com[j].substring(0, com[j].length - 1);
				com.splice(i + 1, j - i);
			}
		}
	}
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
