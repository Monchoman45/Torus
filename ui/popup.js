Torus.ui.render_popup = function(name, room, coords) {
	var target = room.userlist[name];
	var user = room.userlist[wgUserName];

	var domain = room.domain;
	if(room.parent) {domain = room.parent.domain;}

	Torus.util.empty(Torus.ui.ids['popup']);

	var avatar = document.createElement('img');
	avatar.id = 'torus-popup-avatar';
	avatar.src = target.avatar;
	Torus.ui.ids['popup'].appendChild(avatar);

	var info = document.createElement('div');
	info.id = 'torus-popup-info';
	Torus.ui.ids['popup-info'] = info;
	var div = document.createElement('div');
		var info_name = document.createElement('span');
		info_name.id = 'torus-popup-name';
		Torus.ui.ids['popup-name'] = info_name;
		var userpage = document.createElement('a');
			userpage.href = 'http://' + domain + '.wikia.com/wiki/User:' + encodeURIComponent(name);
			userpage.textContent = name;
			userpage.addEventListener('click', Torus.ui.click_link);
		info_name.appendChild(userpage);
		div.appendChild(info_name);

		if(target.mod || target.staff) { //star
			div.appendChild(document.createTextNode(' '));
			var info_access = document.createElement('span');
			info_access.id = 'torus-popup-access';
			Torus.ui.ids['popup-access'] = info_access;
			var icon = document.createElement('img');
			if(target.staff) {
				icon.className = 'torus-user-icon-staff';
				icon.src = 'http://images2.wikia.nocookie.net/monchbox/images/f/f3/Icon-staff.png';
			}
			else { //target.mod
				icon.className = 'torus-user-icon-mod';
				icon.src = 'http://images2.wikia.nocookie.net/monchbox/images/6/6b/Icon-chatmod.png';
			}
			info_access.appendChild(icon);
			if(!target.staff && target.givemod) {info_access.appendChild(document.createTextNode('+'));}
			div.appendChild(info_access);
		}
		info.appendChild(div);

		var state = document.createElement('div');
		state.id = 'torus-popup-status-state';
		Torus.ui.ids['popup-status-state'] = state;
		state.textContent = target.status_state;
		info.appendChild(state);

		var message = document.createElement('div');
		message.id = 'torus-popup-status-message';
		Torus.ui.ids['popup-status-message'] = message;
		message.textContent = target.status_message;
		info.appendChild(message);
	Torus.ui.ids['popup'].appendChild(info);

	var userlinks = document.createElement('div');
	userlinks.id = 'torus-popup-userlinks';
	Torus.ui.ids['popup-userlinks'] = userlinks;
	var div = document.createElement('div');
		var talk = document.createElement('a');
		talk.className = 'torus-popup-userlink';
		talk.href = 'http://' + domain + '.wikia.com/wiki/User_talk:' + encodeURIComponent(name);
		talk.addEventListener('click', Torus.ui.click_link);
		talk.textContent = Torus.i18n.text('popup-talk');
		div.appendChild(talk);

		var contribs = document.createElement('a');
		contribs.className = 'torus-popup-userlink';
		contribs.href = 'http://' + domain + '.wikia.com/wiki/Special:Contributions/' + encodeURIComponent(name);
		contribs.addEventListener('click', Torus.ui.click_link);
		contribs.textContent = Torus.i18n.text('popup-contribs');
		div.appendChild(contribs);
	userlinks.appendChild(div);
	div = document.createElement('div');
		var chatban = document.createElement('a');
		chatban.className = 'torus-popup-userlink';
		chatban.href = 'http://' + domain + '.wikia.com/wiki/Special:Log/chatban?page=User:' + encodeURIComponent(name);
		chatban.addEventListener('click', Torus.ui.click_link);
		chatban.textContent = Torus.i18n.text('popup-history');
		div.appendChild(chatban);

		var chatconnect = document.createElement('a');
		chatconnect.className = 'torus-popup-userlink';
		if(room.checkuser) {
			chatconnect.href = 'http://' + domain + '.wikia.com/wiki/Special:Log/chatconnect?user=' + encodeURIComponent(name);
			chatconnect.addEventListener('click', Torus.ui.click_link);
		}
		else {chatconnect.classList.add('torus-popup-userlink-disabled');}
		chatconnect.textContent = Torus.i18n.text('popup-chatconnect');
		div.appendChild(chatconnect);
	userlinks.appendChild(div);
	Torus.ui.ids['popup'].appendChild(userlinks);

	var actions = document.createElement('div');
		actions.id = 'torus-popup-actions';
		Torus.ui.ids['popup-actions'] = actions;
		var priv = document.createElement('a');
			if(Torus.data.blockedBy.indexOf(name) != -1) {priv.className = 'torus-popup-action-disabled';}
			else {
				priv.className = 'torus-popup-action';
				priv.setAttribute('data-user', name);
				priv.addEventListener('click', function() {
					Torus.ui.active.open_private([this.getAttribute('data-user')], function(event) {Torus.ui.activate(event.room);});
				});
			}
			priv.textContent = Torus.i18n.text('popup-pm');
		actions.appendChild(priv);

		var block = document.createElement('a');
			block.className = 'torus-popup-action';
			block.setAttribute('data-user', name);
			if(Torus.data.blocked.indexOf(name) != -1) {
				block.addEventListener('click', Torus.ui.popup_unblock);
				block.textContent = Torus.i18n.text('popup-unblock');
			}
			else {
				block.addEventListener('click', Torus.ui.popup_block);
				block.textContent = Torus.i18n.text('popup-block');
			}
		actions.appendChild(block);

		if((user.givemod || user.staff) && !target.mod && !target.staff) {
			var mod = document.createElement('a');
			mod.className = 'torus-popup-action';
			mod.addEventListener('click', function() {this.children[0].style.display = 'block';});
			var confirm = document.createElement('div');
				confirm.id = 'torus-popup-modconfirm';
				Torus.ui.ids['popup-modconfirm'] = confirm;
				var yes = document.createElement('input');
				yes.id = 'torus-popup-modconfirm-yes';
				Torus.ui.ids['popup-modconfirm-yes'] = yes;
				yes.type = 'button';
				yes.value = Torus.util.cap(Torus.i18n.text('yes'));
				yes.addEventListener('click', function(event) {
					event.stopPropagation();
					this.parentNode.style.display = 'none';
					Torus.ui.active.mod(this.getAttribute('data-user'));
				});
				yes.setAttribute('data-user', name);
				confirm.appendChild(yes);

				confirm.appendChild(document.createTextNode(' ' + Torus.i18n.text('popup-mod-areyousure') + ' '));

				var no = document.createElement('input');
				no.id = 'torus-popup-modconfirm-no';
				Torus.ui.ids['popup-modconfirm-no'] = no;
				no.type = 'button';
				no.value = Torus.util.cap(Torus.i18n.text('no'));
				no.addEventListener('click', function(event) {
					event.stopPropagation();
					this.parentNode.style.display = 'none';
				});
				confirm.appendChild(no);
			mod.appendChild(confirm);
			mod.appendChild(document.createTextNode(Torus.i18n.text('popup-mod')));
			actions.appendChild(mod);
		}
		else {
			var mod = document.createElement('a');
			mod.className = 'torus-popup-action-disabled';
			mod.textContent = Torus.i18n.text('popup-mod');
			actions.appendChild(mod);
		}

		if((user.staff || user.givemod || (user.mod && !target.mod)) && !target.staff && !target.givemod) {
			var kick = document.createElement('a');
			kick.className = 'torus-popup-action';
			kick.setAttribute('data-user', name);
			kick.addEventListener('click', function() {Torus.ui.active.kick(this.getAttribute('data-user'));});
			kick.textContent = Torus.i18n.text('popup-kick');
			actions.appendChild(kick);

			var ban = document.createElement('a');
			ban.className = 'torus-popup-action';
			var modal = document.createElement('div');
				modal.id = 'torus-popup-banmodal';
				Torus.ui.ids['popup-banmodal'] = modal;
				modal.setAttribute('data-user', name);
				var div = document.createElement('div');
					var expiry_label = document.createElement('label');
					expiry_label.for = 'torus-popup-banexpiry';
					expiry_label.textContent = Torus.i18n.text('popup-ban-expiry') + ':';
					div.appendChild(expiry_label);

					div.appendChild(document.createTextNode(' '));

					var expiry = document.createElement('input');
					expiry.id = 'torus-popup-banexpiry';
					Torus.ui.ids['popup-banexpiry'] = expiry;
					expiry.type = 'text';
					expiry.placeholder = '1 day'; //FIXME: i18n
					expiry.addEventListener('keyup', function(event) {
						if(event.keyCode == 13) {
							var target = this.parentNode.parentNode.getAttribute('data-user');
							var summary = this.parentNode.nextSibling.lastChild.value;
							if(this.value) {var expiry = Torus.util.expiry_to_seconds(this.value);}
							else {var expiry = 60 * 60 * 24;}
							Torus.ui.active.ban(target, expiry, summary);
						}
					});
					div.appendChild(expiry);
				modal.appendChild(div);
				div = document.createElement('div');
					var reason_label = document.createElement('label');
					reason_label.for = 'torus-popup-banexpiry';
					reason_label.textContent = Torus.i18n.text('popup-ban-reason') + ':';
					div.appendChild(reason_label);

					div.appendChild(document.createTextNode(' '));

					var reason = document.createElement('input');
					reason.id = 'torus-popup-banreason';
					Torus.ui.ids['popup-banreason'] = reason;
					reason.placeholder = 'Misbehaving in chat'; //FIXME: i18n
					reason.addEventListener('keyup', function(event) {
						if(event.keyCode == 13) {
							var target = this.parentNode.parentNode.getAttribute('data-user');
							var expiry = this.parentNode.previousSibling.lastChild.value;
							var summary = this.value;
							if(expiry) {expiry = Torus.util.expiry_to_seconds(expiry);}
							else {expiry = 60 * 60 * 24;}
							Torus.ui.active.ban(target, expiry, summary);
						}
					});
					div.appendChild(reason);
				modal.appendChild(div);
				div = document.createElement('div');
					var submit = document.createElement('input');
					submit.id = 'torus-popup-banbutton';
					Torus.ui.ids['popup-banbutton'] = submit;
					submit.type = 'submit'
					submit.value = Torus.i18n.text('popup-ban');
					submit.addEventListener('click', function(event) {
						var target = this.parentNode.parentNode.getAttribute('data-user');
						var expiry = this.parentNode.previousSibling.previousSibling.lastChild.value;
						var summary = this.parentNode.previousSibling.lastChild.value;
						if(expiry) {expiry = Torus.util.expiry_to_seconds(expiry);}
						else {expiry = 60 * 60 * 24;}
						Torus.ui.active.ban(target, expiry, summary);
					});
				modal.appendChild(div);
			ban.appendChild(modal);
			ban.appendChild(document.createTextNode(Torus.i18n.text('popup-ban')));
			actions.appendChild(ban);
		}
		else {
			var kick = document.createElement('a');
			kick.className = 'torus-popup-action-disabled';
			kick.textContent = Torus.i18n.text('popup-kick');
			actions.appendChild(kick);

			var ban = document.createElement('a');
			ban.className = 'torus-popup-action-disabled';
			ban.textContent = Torus.i18n.text('popup-ban');
			actions.appendChild(ban);
		}
	Torus.ui.ids['popup'].appendChild(actions);

	Torus.ui.ids['popup'].style.display = 'block';
	if(coords) {
		Torus.ui.ids['popup'].style.right = 'auto';
		Torus.ui.ids['popup'].style.left = coords.x + 'px';
		Torus.ui.ids['popup'].style.top = coords.y + 'px';
	}
	else {
		var userlist = Torus.ui.ids['sidebar'].children;
		for(var i = 0; i < userlist.length; i++) {
			if(userlist[i].lastChild.innerHTML == name) {
				if(userlist[i].offsetTop - Torus.ui.ids['sidebar'].scrollTop + Torus.ui.ids['popup'].offsetHeight > Torus.ui.window.offsetHeight) {Torus.ui.ids['popup'].style.top = Torus.ui.window.offsetHeight - Torus.ui.ids['popup'].offsetHeight + 'px';}
				else {Torus.ui.ids['popup'].style.top = userlist[i].offsetTop - Torus.ui.ids['sidebar'].scrollTop + 'px';}
				break;
			}
		}
	}
	var event = new Torus.classes.UIEvent('render_popup');
	event.user = name;
	Torus.call_listeners(event);
}

Torus.ui.unrender_popup = function() {
	Torus.ui.ids['popup'].style.top = '';
	Torus.ui.ids['popup'].style.right = '';
	Torus.ui.ids['popup'].style.left = '';
	Torus.ui.ids['popup'].style.display = 'none';
	Torus.util.empty(Torus.ui.ids['popup']);
	Torus.call_listeners(new Torus.classes.UIEvent('unrender_popup'));
}

Torus.ui.popup_block = function() {
	this.appendChild(Torus.ui.img_loader());
	var el = this;
	Torus.io.block(this.getAttribute('data-user'), function() { //FIXME: closure
		Torus.util.empty(el);
		el.removeEventListener('click', Torus.ui.popup_block);
		el.addEventListener('click', Torus.ui.popup_unblock);
		el.textContent = Torus.i18n.text('popup-unblock');
	});
}

Torus.ui.popup_unblock = function() {
	this.appendChild(Torus.ui.img_loader());
	var el = this;
	Torus.io.unblock(this.getAttribute('data-user'), function() { //FIXME: closure
		Torus.util.empty(el);
		el.removeEventListener('click', Torus.ui.popup_unblock);
		el.addEventListener('click', Torus.ui.popup_block);
		el.textContent = Torus.i18n.text('popup-block');
	});
}
