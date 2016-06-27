new Torus.classes.Extension('abusefilter', -12);
Torus.ext.abusefilter.name = 'ext-abusefilter-name';

Torus.ext.abusefilter.ui = {};
Torus.ext.abusefilter.selected = 'filter';
Torus.ext.abusefilter.actions = {};
Torus.ext.abusefilter.params = {
	enabled: {enabled: false},
	ping: {enabled: false},
	warn: {
		enabled: false,
		message: '',
	},
	kick: {enabled: false},
	ban: {
		enabled: false,
		expiry: 'infinite',
		summary: '',
	},
	block: {
		enabled: false,
		expiry: 'infinite',
		reason: '',
		autoblock: true,
		noemail: true,
		allowusertalk: false,
		nocreate: true,
	}
}
Torus.ext.abusefilter.examine = wgUserName;
Torus.ext.abusefilter.filter = false;
Torus.ext.abusefilter.filter_text = '';

Torus.ext.abusefilter.message_vars = function(message) {
	var ret = {
		event: message.event,

		message_time: message.time,

		user_name: message.user,
		user_mod: message.room.userlist[message.user].mod,
		user_givemod: message.room.userlist[message.user].givemod,
		user_staff: message.room.userlist[message.user].staff,
		user_edits: message.room.userlist[message.user].edits,
		user_avatar: message.room.userlist[message.user].avatar,
		user_status: message.room.userlist[message.user].status_state,
		user_status_message: message.room.userlist[message.user].status_message,

		room_name: message.room.name,
		room_domain: message.room.domain,
		room_size: message.room.users,
		room_id: message.room.id,
	};
	if(message.text) {ret.message_text = message.text;}
	else {ret.message_text = '';}
	if(message.html) {ret.message_html = message.html.innerHTML;}
	else {ret.message_html = '';}
	if(message.ping) {ret.message_ping = true;}
	else {ret.message_ping = false;}
	return ret;
}

{{ext/abusefilter/html.js}}

{{ext/abusefilter/actions.js}}

{{ext/abusefilter/listeners.js}}

{{ext/abusefilter/lexer.js}}

{{ext/abusefilter/ast.js}}

{{ext/abusefilter/parser.js}}

{{ext/abusefilter/eval.js}}

{{ext/abusefilter/i18n/en.js}}

Torus.ext.abusefilter.onload = function() {
	Torus.util.load_css('http://@DOMAIN@/wiki/MediaWiki:Torus.js/modules/ext/abusefilter.css?action=raw&ctype=text/css');
	Torus.ext.abusefilter.rebuild();
}

Torus.add_listener('io', 'me', Torus.ext.abusefilter.eval);
Torus.add_listener('io', 'message', Torus.ext.abusefilter.eval);
Torus.add_listener('io', 'join', Torus.ext.abusefilter.eval);

if(Torus.ui) {
	Torus.ext.abusefilter.add_listener('ui', 'activate', Torus.ext.abusefilter.render);
	Torus.ext.abusefilter.add_listener('ui', 'deactivate', Torus.ext.abusefilter.unrender);

	if(Torus.init) {Torus.ext.abusefilter.onload();}
	else {Torus.add_listener('window', 'load', Torus.ext.abusefilter.onload);}
}
