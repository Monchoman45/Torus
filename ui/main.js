new Torus.classes.Extension('ui', -1);

Torus.ui = {
	window: document.createElement('div'),
	ids: {},
	active: Torus.chats[0],
	viewing: [],
	popup_timeout: 0,
}
Torus.listeners.ui = {
	render: [],
	activate: [],
	deactivate: [],
	show: [],
	unshow: [],
	render_popup: [],
	unrender_popup: [],
	ping: [],
	fullscreen: [],
};
Torus.logs = {
	messages: {},
	plain: {},
	socket: {},
};

Torus.ui.fullscreen = function() { //FIXME: move
	if(Torus.data.fullscreen) {
		document.body.removeChild(Torus.ui.window);
		Torus.data.old_parent.appendChild(Torus.ui.window);
		Torus.data.old_parent = null;

		Torus.ui.window.classList.remove('fullscreen');
		Torus.data.fullscreen = false;
		Torus.call_listeners(new Torus.classes.UIEvent('fullscreen')); //FIXME: unfullscreen
	}
	else {
		Torus.data.old_parent = Torus.ui.window.parentNode;
		Torus.ui.window.parentNode.removeChild(Torus.ui.window);
		document.body.appendChild(Torus.ui.window);

		Torus.ui.window.classList.add('fullscreen');
		Torus.data.fullscreen = true;
		Torus.call_listeners(new Torus.classes.UIEvent('fullscreen'));
	}
}

Torus.ui.onload = function() {
	Torus.ext.options.load();

	var domain = window.location.hostname.substring(0, document.location.hostname.indexOf('.wikia.com'));
	if(domain.indexOf('preview.') == 0) {domain = domain.substring(8);}
	if(!domain) {domain = 'localhost';}
	Torus.local = domain;

	if(wgCanonicalNamespace == 'Special' && wgTitle == 'Torus') {
		document.title = Torus.i18n.text('title', wgSiteName);
		if(window.skin == 'oasis') {
			var body = 'WikiaArticle';
			if(document.getElementById('WikiaPageHeader')) {
				document.getElementById('WikiaPageHeader').getElementsByTagName('h1')[0].textContent = Torus.i18n.text('firstheading');
				document.getElementById('WikiaPageHeader').getElementsByTagName('h2')[0].textContent = Torus.i18n.text('secondheading');
			}
		}
		else {
			var body = 'bodyContent';
			document.getElementById('firstHeading').textContent = Torus.i18n.text('firstheading');
		}
		Torus.util.empty(document.getElementById(body));
		if(document.getElementById('AdminDashboardHeader')) {
			var div = document.createElement('div');
				div.classList.add('AdminDashboardGeneralHeader');
				div.classList.add('AdminDashboardArticleHeader');
				var h1 = document.createElement('h1');
					h1.textContent = Torus.i18n.text('firstheading');
				div.appendChild(h1);
			document.getElementById(body).appendChild(div);
		}
		document.getElementById(body).appendChild(Torus.ui.window);

		if(wgUserName == null) {
			Torus.alert(Torus.i18n.text('error-login'));
			return;
		}

		if(Torus.options.ui_joinlocal) {Torus.open(Torus.local);}
		if(Torus.options.ui_defaultrooms) {
			for(var i = 0; i < Torus.options.ui_defaultrooms.length; i++) {
				if(!Torus.chats[Torus.options.ui_defaultrooms[i]]) {Torus.open(Torus.options.ui_defaultrooms[i]);} //could be Torus.local
			}
		}
	}
}

{{ui/i18n.js}}

{{ui/i18n/en.js}}

{{ui/events.js}}

{{ui/activate.js}}

{{ui/render.js}}

{{ui/popup.js}}

{{ui/menu.js}}

{{ui/pings.js}}

{{ui/themes.js}}

{{ui/chat_listeners.js}}

{{ui/dom_listeners.js}}

{{ui/parser.js}}

{{ui/constructors.js}}

{{ui/util.js}}

//(function() { //I really hate these but it's better then leaking temp variables everywhere //FIXME: iffy causes load order problems
	Torus.util.load_css('http://@DOMAIN@/wiki/MediaWiki:Torus.js/modules/ui.css?action=raw&ctype=text/css');

	Torus.ui.window.id = 'torus';
	Torus.ui.ids['torus'] = Torus.ui.window;

	var tabs = document.createElement('div');
		tabs.id = 'torus-tabs';
		Torus.ui.ids['tabs'] = tabs;
		var menu = document.createElement('span');
			menu.id = 'torus-tab--1';
			Torus.ui.ids['tab--1'] = menu;
			menu.setAttribute('data-id', '-1');
			menu.className = 'torus-tab';
			menu.addEventListener('click', Torus.ui.menu.tab_click);
			var img = document.createElement('img');
				img.src = 'http://images2.wikia.nocookie.net/__cb20110812214252/monchbox/images/a/a1/Gear_icon.png';
				img.width = '18';
			menu.appendChild(img);
			menu.appendChild(document.createTextNode(String.fromCharCode(160) + Torus.i18n.text('menu-menu')));
		tabs.appendChild(menu);
	Torus.ui.window.appendChild(tabs);

	var sidebar = document.createElement('ul');
		sidebar.id = 'torus-sidebar';
		Torus.ui.ids['sidebar'] = sidebar;
		sidebar.addEventListener('mouseover', Torus.ui.sidebar_mouseover);
		sidebar.addEventListener('mouseout', Torus.ui.sidebar_mouseout);
	Torus.ui.window.appendChild(sidebar);

	var popup = document.createElement('div');
		popup.id = 'torus-popup';
		Torus.ui.ids['popup'] = popup;
		popup.style.display = 'none';
		popup.addEventListener('mouseover', Torus.ui.sidebar_mouseover);
		popup.addEventListener('mouseout', Torus.ui.sidebar_mouseout);
	Torus.ui.window.appendChild(popup);

	var info = document.createElement('div');
		info.id = 'torus-info';
		Torus.ui.ids['info'] = info;
	Torus.ui.window.appendChild(info);

	var wind = document.createElement('div');
		wind.id = 'torus-window';
		Torus.ui.ids['window'] = wind;
	Torus.ui.window.appendChild(wind);

	var input = document.createElement('div');
		input.id = 'torus-input';
		Torus.ui.ids['input'] = input;
		var inputbox = document.createElement('textarea');
			inputbox.id = 'torus-input-box';
			Torus.ui.ids['input-box'] = inputbox;
			inputbox.onkeydown = Torus.ui.input;
		input.appendChild(inputbox);
	Torus.ui.window.appendChild(input);
//})();

Torus.ui.window.addEventListener('mouseover', Torus.ui.window_mouseover);

Torus.add_listener('io', 'initial', Torus.ui.initial);

Torus.add_listener('io', 'join', Torus.ui.update_user);
Torus.add_listener('io', 'update_user', Torus.ui.update_user);
Torus.add_listener('io', 'part', Torus.ui.remove_user);
Torus.add_listener('io', 'logout', Torus.ui.remove_user);
Torus.add_listener('io', 'ghost', Torus.ui.remove_user);

Torus.add_listener('io', 'alert', Torus.ui.add_line);
Torus.add_listener('io', 'message', Torus.ui.add_line);
Torus.add_listener('io', 'me', Torus.ui.add_line);
Torus.add_listener('io', 'join', Torus.ui.add_line);
Torus.add_listener('io', 'part', Torus.ui.add_line);
Torus.add_listener('io', 'logout', Torus.ui.add_line);
Torus.add_listener('io', 'ghost', Torus.ui.add_line);
Torus.add_listener('io', 'ctcp', Torus.ui.add_line);
Torus.add_listener('io', 'mod', Torus.ui.add_line);
Torus.add_listener('io', 'kick', Torus.ui.add_line);
Torus.add_listener('io', 'ban', Torus.ui.add_line);
Torus.add_listener('io', 'unban', Torus.ui.add_line);
Torus.add_listener('io', 'error', Torus.ui.add_line);

for(var i in Torus.logs) {Torus.logs[i][0] = [];}
Torus.chats[0].listeners.ui = {};
Torus.ui.add_room({room: Torus.chats[0]});
Torus.ui.show(Torus.chats[0]);


{{ui/commands.js}}

{{ui/options.js}}


if(document.readyState == 'complete') {Torus.ui.onload();}
else {Torus.addEventListener('window', 'load', Torus.ui.onload);}
