Torus.cmd = {};

Torus.cmd.new_room = function(event) {
	event.room.add_listener('io', 'alert', Torus.cmd.print_message);
	event.room.add_listener('io', 'message', Torus.cmd.print_message);
	event.room.add_listener('io', 'me', Torus.cmd.print_message);
	event.room.add_listener('io', 'join', Torus.cmd.print_message);
	event.room.add_listener('io', 'update_user', Torus.cmd.print_message);
	event.room.add_listener('io', 'part', Torus.cmd.print_message);
	event.room.add_listener('io', 'logout', Torus.cmd.print_message);
	event.room.add_listener('io', 'ghost', Torus.cmd.print_message);
	event.room.add_listener('io', 'ctcp', Torus.cmd.print_message);
	event.room.add_listener('io', 'mod', Torus.cmd.print_message);
	event.room.add_listener('io', 'kick', Torus.cmd.print_message);
	event.room.add_listener('io', 'ban', Torus.cmd.print_message);
	event.room.add_listener('io', 'unban', Torus.cmd_print_message);
	event.room.add_listener('io', 'error', Torus.cmd.print_message);
}

Torus.cmd.print_message = function(message) {
	if(message.type != 'io') {throw new Error('Torus.cmd.print_message: Event type must be `io`.');}

	var line = '[' + Torus.util.timestamp(message.time) + '] {' + message.room.name + '} ';

	switch(message.event) {
		case 'me':
			line += '*  ' + message.user + ' ' + message.text;
			break;
		case 'message':
			line += '  <' + message.user + '> ' + message.text;
			break;
		case 'alert':
			line += '== ' + message.text;
			break;
		case 'update_user':
			line += '== ' + message.user + ' {state: \'' + message.room.userlist[message.user].status_state + '\', message: \'' + message.room.userlist[message.user].status_message + '\'}';
			break;
		case 'join':
		case 'rejoin':
		case 'ghost':
		case 'part':
			line += '== ' + message.user + ' ' + message.event + 'ed {' + message.room.name + '}';
			break;
		case 'logout':
			line += '== ' + message.user + ' logged out';
			break;
		case 'ctcp':
			if(message.user == wgUserName) {line += ' >';}
			else {line += ' <';}
			line += '  ' + message.user + ' CTCP|' + message.target + '|' + message.proto;
			if(message.data) {line += ': ' + message.data;}
			break;
		case 'mod':
			line += '== ' + message.performer + ' modded ' + message.target;
			break;
		case 'kick':
		case 'ban':
		case 'unban':
			if(message.room.parent) {var domain = message.room.parent.domain;}
			else {var domain = message.room.domain;}

			if(message.event != 'kick') {var tense = 'ned';}
			else {var tense = 'ed';}
			
			line += '== ' + message.performer + ' ' + message.event + tense + ' ' + message.target;
			if(message.expiry) {line += ' for ' + message.expiry;}
			break;
		case 'error':
			line += '== Error: ' + message.error + ' ' + JSON.stringify(message.args);
			break;
		default: throw new Error('Message type ' + message.event + ' can\'t be printed. (cmd.parse_message)');
	}
	console.log(line);
}

Torus.add_listener('chat', 'new', Torus.cmd.new_room);

Torus.cmd.onload = function() {console.log('Torus v' + Torus.pretty_version + ', command line');}

if(document.readyState == 'complete') {Torus.cmd.onload();}
else {Torus.add_listener('load', Torus.cmd.onload);}
