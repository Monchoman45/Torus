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

Torus.ui.fullscreen = function() {
	if(Torus.data.fullscreen) {
		document.body.removeChild(Torus.ui.window);
		Torus.data.old_parent.appendChild(Torus.ui.window);
		Torus.data.old_parent = null;

		Torus.ui.window.classList.remove('fullscreen');
		Torus.data.fullscreen = false;
		Torus.call_listeners(new Torus.classes.UIEvent('fullscreen')); //FIXME:
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
	var domain = window.location.hostname.substring(0, document.location.hostname.indexOf('.wikia.com'));
	if(domain.indexOf('preview.') == 0) {domain = domain.substring(8);}
	if(!domain) {domain = 'localhost';}
	Torus.local = domain;

	if(wgCanonicalNamespace == 'Special' && wgTitle == 'Torus') {
		document.title = 'Torus - It\'s a donut - ' + wgSiteName;
		if(window.skin == 'oasis') {
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

		if(wgUserName == null) {
			Torus.alert('You don\'t appear to be logged in - you must have an account to use chat on Wikia. Please [[Special:UserSignup|register]] or [[Special:UserLogin|log in]].'); //FIXME: i18n
			return;
		}

		if(Torus.options['misc-connection-local']) {Torus.open(Torus.local);}
		if(Torus.options['misc-connection-default_rooms']) {
			var rooms = Torus.options['misc-connection-default_rooms'].split('\n');
			for(var i = 0; i < rooms.length; i++) {
				if(!Torus.chats[rooms[i]]) {Torus.open(rooms[i]);} //could be Torus.local
			}
		}
	}
}

{{MediaWiki:Torus.js/ui/events.js}}

{{MediaWiki:Torus.js/ui/activate.js}}

{{MediaWiki:Torus.js/ui/render.js}}

{{MediaWiki:Torus.js/ui/popup.js}}

{{MediaWiki:Torus.js/ui/menu.js}}

{{MediaWiki:Torus.js/ui/pings.js}}

{{MediaWiki:Torus.js/ui/chat_listeners.js}}

{{MediaWiki:Torus.js/ui/dom_listeners.js}}

{{MediaWiki:Torus.js/ui/constructors.js}}

{{MediaWiki:Torus.js/ui/util.js}}

//(function() { //I really hate these but it's better then leaking temp variables everywhere //FIXME: iffy causes load order problems
	Torus.util.load_css('http://monchbox.wikia.com/wiki/MediaWiki:Torus.js/ui/main.css?action=raw&ctype=text/css&templates=expand&t=' + (new Date()).getTime());

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
			menu.appendChild(document.createTextNode(String.fromCharCode(160))); //&nbsp;
			menu.appendChild(document.createTextNode('menu'));
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

Torus.add_listener('window', 'load', Torus.ui.onload);

Torus.chats[0].add_listener('io', 'alert', Torus.ui.add_line);
for(var i in Torus.logs) {Torus.logs[i][0] = [];}
Torus.chats[0].listeners.ui = {};
Torus.ui.add_room({room: Torus.chats[0]});
Torus.ui.show(Torus.chats[0]);



{{MediaWiki:Torus.js/ui/commands.js}}

{{MediaWiki:Torus.js/ui/options.js}}

{{MediaWiki:Torus.js/ext/ccui.js}}
