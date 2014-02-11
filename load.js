Torus.onload = function() {
	var css = document.createElement('link');
	css.id  = 'torus-css';
	css.rel = 'stylesheet';
	css.href = 'http://monchbox.wikia.com/index.php?title=MediaWiki:Torus.js/main.css&action=raw&ctype=text/css&t=' + (new Date()).getTime();
	css.type = 'text/css';
	css.media = 'screen';
	document.head.appendChild(css);
	Torus.ui.window.id = 'torus';
	Torus.ui.window.innerHTML = '<div id="torus-tabs"><span id="torus-tab--1" class="torus-tab" onclick="Torus.ui.activate(-1); Torus.options.render(Torus.options.selected);"><img width="18" src="http://images2.wikia.nocookie.net/__cb20110812214252/monchbox/images/a/a1/Gear_icon.png" style="vertical-align:top;"> Options</span><span id="torus-tab-0" class="torus-tab" onclick="event.preventDefault(); if(event.shiftKey && Torus.ui.active != 0) {Torus.ui.show(0);} else {Torus.ui.activate(0);}">Status</span></div><ul id="torus-sidebar"></ul><div id="torus-popup" style="display:none;"></div><div id="torus-info"></div><div id="torus-window"></div><div id="torus-input"><textarea id="torus-input-box"></textarea></div>';
	Torus.ui.ids['tabs'] = Torus.ui.window.children[0];
	Torus.ui.ids['sidebar'] = Torus.ui.window.children[1];
	Torus.ui.ids['popup'] = Torus.ui.window.children[2];
	Torus.ui.ids['info'] = Torus.ui.window.children[3];
	Torus.ui.ids['window'] = Torus.ui.window.children[4];
	Torus.ui.ids['input'] = Torus.ui.window.children[5];
	Torus.ui.window.onmouseover = function() {
		if(Torus.data.pinginterval != 0) {
			clearInterval(Torus.data.pinginterval);
			Torus.data.pinginterval = 0;
			document.title = Torus.data.titleflash;
		}
		//if(Torus.ui.active > 0) {
		//	clearTimeout(Torus.chats[Torus.ui.active].awayTimeout);
		//	setTimeout('Torus.io.setStatus(' + Torus.ui.active + ', \'away\', \'\'); Torus.chats[' + Torus.ui.active + '].autoAway = true;', 5 * 60 * 1000);
		//}
	}
	Torus.ui.ids['sidebar'].onmouseover = Torus.ui.ids['popup'].onmouseover = function(event) {
		clearTimeout(Torus.ui.popupTimeout);
		Torus.ui.popupTimeout = 0;
	}
	Torus.ui.ids['sidebar'].onmouseout = Torus.ui.ids['popup'].onmouseout = function(event) {
		Torus.ui.popupTimeout = setTimeout(Torus.ui.unrenderPopup, 500);
	}
	Torus.ui.ids['input'].getElementsByTagName('textarea')[0].onkeydown = Torus.ui.inputListener;
	
	Torus.chats[0] = Torus.chats[-1] = true;
	Torus.logs.messages[0] = [];
	Torus.ui.activate(0);
	Torus.ui.show(0);
	
	window.addEventListener('beforeunload', function() {Torus.options.save(); Torus.logout();});
	Torus.options.load();

	Torus.data.domains = {
{{MediaWiki:Torus.js/Database-3}}
	};
	for(var i in Torus.data.domains) {
		if(!Torus.data.ids[Torus.data.domains]) {Torus.data.ids[Torus.data.domains[i]] = i;}
	}
	
	var domain = document.location.host.substring(0, document.location.host.indexOf('.wikia.com'));
	if(domain.indexOf('preview.') == 0) {domain = domain.substring(8);}
	if(Torus.data.domains[domain]) {Torus.local = Torus.data.domains[domain];}
	else {
		Torus.io.spider(function(data) {
			if(!data) {
				Torus.alert('This wiki doesn\'t have chat enabled. The local room has been set to Community Central.');
				Torus.local = 2087;
			}
			else {
				if(Torus.data.domains) {
					Torus.data.domains[domain] = data.roomId;
					Torus.data.ids[data.roomId] = domain;
				}
				Torus.local = data.roomId;
			}
			if(data.chatkey.key === false) {Torus.alert('You don\'t appear to be logged in - you must have an account to use chat on Wikia. Please [[Special:UserSignup|register]] or [[Special:UserLogin|log in]].');}
			else if(wgCanonicalNamespace == 'Special' && wgTitle == 'Torus' && Torus.options.misc.connection.local.value) {Torus.open(Torus.local, data.chatkey, data.nodeHostname, data.nodePort);}
		});
	}
	
	if(wgCanonicalNamespace == 'Special' && wgTitle == 'Torus') {
		document.title = 'Torus - It\'s a donut - ' + wgSiteName;
		if(skin == 'oasis') {
			var body = 'WikiaArticle';
			if(document.getElementById('WikiaPageHeader')) {
				document.getElementById('WikiaPageHeader').getElementsByTagName('h1')[0].innerHTML = 'Torus';
				document.getElementById('WikiaPageHeader').getElementsByTagName('h2')[0].innerHTML = 'It\'s a donut';
			}
		}
		else {
			var body = 'bodyContent';
			document.getElementById('firstHeading').innerHTML = 'Torus';
		}
		document.getElementById(body).innerHTML = (document.getElementById('AdminDashboardHeader') ? '<div class="AdminDashboardGeneralHeader AdminDashboardArticleHeader"><h1>Torus</h1></div>' : '');
		document.getElementById(body).appendChild(Torus.ui.window);
		if(Torus.local && Torus.options.misc.connection.local.value) {Torus.open(Torus.local);}
		if(Torus.options.misc.connection.default_rooms.value) {
			var rooms = Torus.options.misc.connection.default_rooms.value.split('\n');
			for(var i = 0; i < rooms.length; i++) {
				if(isNaN(rooms[i] * 1)) {var room = Torus.data.domains[rooms[i]];}
				else {var room = rooms[i];}
				if(!Torus.chats[room]) {Torus.open(rooms[i]);} //could be Torus.local
			}
		}
	}
	Torus.alert('Initialized.');
	Torus.init = true;
}

$(Torus.onload);
