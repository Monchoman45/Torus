new Torus.classes.Extension('logs', -12);

Torus.ext.logs.sidebar = null;

Torus.ext.logs.show = function(id) {
	//FIXME: this will also display anything you're viewing
	Torus.util.empty(Torus.ui.ids['ext-logs-window']);
	Torus.ui.render(Torus.ui.ids['ext-logs-window'], Torus.chats[id]);
}

Torus.ext.logs.rebuild_sidebar = function() {
	Torus.ext.logs.sidebar = document.createDocumentFragment();

	for(var i in Torus.logs.messages) { //TODO: also socket
		var li = document.createElement('li');
			li.id = 'torus-ext-logs-room-' + i;
			Torus.ui.ids['ext-logs-room-' + i] = li;
			li.className = 'torus-sidebar-li-link';
			li.setAttribute('data-id', i);
			li.addEventListener('click', Torus.ext.logs.click_sidebar);
			li.textContent = Torus.chats[i].name;
		Torus.ext.logs.sidebar.appendChild(li);
	}

	if(Torus.ui.active == Torus.ext.logs) {
		Torus.util.empty(Torus.ui.ids['sidebar']);
		Torus.ui.ids['sidebar'].appendChild(Torus.ext.logs.sidebar);
	}
}

Torus.ext.logs.render = function(event) {
	Torus.ui.ids['sidebar'].appendChild(Torus.ext.logs.sidebar);
	var header = document.createElement('div');
		header.id = 'torus-ext-logs-header';
		Torus.ui.ids['ext-logs-header'] = header;
		//TODO: information and buttons and stuff
	Torus.ui.ids['window'].appendChild(header);
	var wind = document.createElement('div');
		wind.id = 'torus-ext-logs-window';
		Torus.ui.ids['ext-logs-window'] = wind;
	Torus.ui.ids['window'].appendChild(wind);
}

Torus.ext.logs.unrender = function(event) {Torus.ext.logs.sidebar = event.old_sidebar;}

Torus.ext.logs.click_sidebar = function(event) {
	for(var i = 0; i < Torus.ui.ids['sidebar'].children.length; i++) {Torus.ui.ids['sidebar'].children[i].classList.remove('torus-sidebar-li-link-selected');}
	this.classList.add('torus-sidebar-li-link-selected');
	Torus.ext.logs.show(this.getAttribute('data-id'));
}

Torus.util.download = function(name, file) { //you'd think they'd have a better way of doing this
	var a = document.createElement('a');
	a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(file);
	a.setAttribute('download', name);
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
}

Torus.add_listener('chat', 'new', Torus.ext.logs.rebuild_sidebar); //this is what ui hooks into, we might want to hook something else but i'm too lazy to care

Torus.ext.logs.add_listener('ui', 'activate', Torus.ext.logs.render);
Torus.ext.logs.add_listener('ui', 'deactivate', Torus.ext.logs.unrender);

Torus.ext.logs.rebuild_sidebar();
