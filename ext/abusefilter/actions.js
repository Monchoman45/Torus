Torus.ext.abusefilter.actions.enabled = Torus.util.null;

Torus.ext.abusefilter.actions.ping = function(event, params) {
	event.ping = true;
	if(event.html && event.html.parentNode) {event.html.parentNode.classList.add('torus-message-ping');}
	Torus.ui.ping(event.room);
}

Torus.ext.abusefilter.actions.warn = function(event, params) {
	if(params.message) {event.room.send_message(params.message);}
}

Torus.ext.abusefilter.actions.kick = function(event, params) {event.room.kick(event.user);}

Torus.ext.abusefilter.actions.ban = function(event, params) {event.room.ban(event.user, params.expiry, params.reason);}

Torus.ext.abusefilter.actions.block = function(event, params) {
	var xhr = new XMLHttpRequest();
	xhr.addEventListener('loadend', function() {
		event.room.kick(event.user); //FIXME: closure
	});
	xhr.open('POST', '/api.php', true);
	xhr.responseType = 'json';
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xhr.setRequestHeader('Api-Client', 'Torus/' + Torus.version);
	var str = 'action=block&user=' + encodeURIComponent(event.user);
	for(var i in params) {
		if(i == 'enabled') {continue;}
		str += '&' + i + '=' + encodeURIComponent(params[i]);
	}
	str += '&token=' + encodeURIComponent(Torus.io.token);
	xhr.send(str);
}
