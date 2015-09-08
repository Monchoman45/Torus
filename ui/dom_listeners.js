Torus.ui.input = function(event) {
	if(event.keyCode == 13 && !event.shiftKey) { //enter
		event.preventDefault();
		if(Torus.data.history[1] != this.value) {
			Torus.data.history[0] = this.value;
			Torus.data.history.unshift('');
		}
		Torus.data.histindex = 0;

		if(Torus.ui.active.id >= 0) {
			while(this.value.charAt(0) == '/') {
				if(this.value.charAt(1) == '/') {
					this.value = this.value.substring(1);
					break;
				}
				if(this.value.indexOf('/me') == 0) {break;}
				if(this.value.indexOf('\n') != -1) {
					var command = this.value.substring(1, this.value.indexOf('\n'));
					this.value = this.value.substring(this.value.indexOf('\n') + 1);
				}
				else {
					var command = this.value.substring(1);
					this.value = '';
				}

				var result = Torus.commands.eval(command);
				if(result === false) {Torus.alert('Can\'t find command `' + command.substring(0, command.indexOf(' ')) + '`.');}
				else if(result != undefined) {Torus.alert('' + result);}
			}
		}
		if(this.value && Torus.ui.active.id > 0) {
			if(this.value.indexOf('./') == 0) {Torus.ui.active.send_message(this.value.substring(1));}
			else {Torus.ui.active.send_message(this.value);}
			this.value = '';
		}
	}
	else if(event.keyCode == 9 && Torus.ui.active.id > 0) { //tab
		event.preventDefault();
		if(!Torus.data.tabtext) {
			str = this.value;
			while(str[str - 1] == ' ') {str = str.substring(0, str.length - 1);}
			Torus.data.tabpos = str.lastIndexOf(' ') + 1;
			Torus.data.tabtext = str.substring(Torus.data.tabpos);
		}
		var matches = 0;
		for(var user in Torus.ui.active.userlist) {
			if(user == 'length') {continue;}
			if(user.indexOf(Torus.data.tabtext) == 0) {matches++;}
			if(matches > Torus.data.tabindex) {break;}
		}
		if(matches <= Torus.data.tabindex) {
			user = Torus.data.tabtext;
			Torus.data.tabindex = 0;
		}
		else {Torus.data.tabindex++;}
		if(Torus.data.tabpos == 0) {this.value = user + (Torus.data.tabindex == 0 ? '' : ': ');}
		else {this.value = this.value.substring(0, Torus.data.tabpos) + user;}
	}
	else if(event.keyCode == 38 && Torus.data.histindex + 1 < Torus.data.history.length && Torus.ui.active.id > 0) { //up
		Torus.data.histindex++;
		this.value = Torus.data.history[Torus.data.histindex];
	}
	else if(event.keyCode == 40 && Torus.data.histindex > 0 && Torus.ui.active.id > 0) { //down
		Torus.data.histindex--;
		this.value = Torus.data.history[Torus.data.histindex];
	}
	else if(event.keyCode != 39 && event.keyCode != 41 && Torus.ui.active.id > 0) { //anything other than left or right
		Torus.data.tabtext = '';
		Torus.data.tabindex = 0;
		Torus.data.tabpos = 0;
	}
}

Torus.ui.click_link = function(event) {
	if(!this.href) {
		console.log('Torus.ui.click_link called on something with no href: ', this);
		return;
	}
	event.preventDefault();

	if(this.href.indexOf('.wikia.com/wiki/Special:Chat') != -1 && Torus.options['misc-links-chat']) {Torus.open(this.href.substring(this.href.indexOf('://') + 3, this.href.indexOf('.wikia.com/wiki/Special:Chat')));}
	else {window.open(this.href, Torus.options['misc-links-target']);}
}

Torus.ui.tab_click = function(event) {
	event.preventDefault();
	var room = Torus.chats[this.getAttribute('data-id')];
	if(event.shiftKey) {
		document.getSelection().removeAllRanges();
		if(Torus.ui.active.domain != room) {Torus.ui.show(room);}
	}
	else {Torus.ui.activate(room);}
}

Torus.ui.sidebar_mouseover = function(event) {
	clearTimeout(Torus.ui.popup_timeout);
	Torus.ui.popup_timeout = 0;
}

Torus.ui.sidebar_mouseout = function(event) {
	Torus.ui.popup_timeout = setTimeout(Torus.ui.unrender_popup, 500);
}

Torus.ui.window_mouseover = function(event) {
	if(Torus.data.pinginterval != 0) {
		clearInterval(Torus.data.pinginterval);
		Torus.data.pinginterval = 0;
		document.title = Torus.data.titleflash;
	}
}

Torus.ui.clear_away_timeout = function() {
	clearTimeout(Torus.ui.away_timeout);
	Torus.ui.away_timeout = setTimeout(Torus.ui.auto_away, 5 * 60 * 1000);
	for(var i in Torus.chats) {
		if(i == 0 || !Torus.chats[i].connected) {continue;}
		var user = Torus.chats[i].userlist[wgUserName];
		if(user.status_state == 'away') {Torus.chats[i].set_status(user.old_state);}
	}
}

Torus.ui.auto_away = function() {
	for(var i in Torus.chats) {
		if(i == 0 || !Torus.chats[i].connected) {continue;}
		Torus.chats[i].set_status('away');
	}
}
