Torus.ui.render_popup = function(name, room, coords) {
	var target = room.userlist[name];
	var user = room.userlist[wgUserName];

	Torus.util.empty(Torus.ui.ids['popup']);

	var avatar = document.createElement('img');
	avatar.id = 'torus-popup-avatar';
	avatar.src = target.avatar;
	Torus.ui.ids['popup'].appendChild(avatar);

	var info = document.createElement('div');
	info.id = 'torus-popup-info';
	var div = document.createElement('div');
		var info_name = document.createElement('span');
		info_name.id = 'torus-popup-name';
		var userpage = document.createElement('a');
			userpage.href = 'http://' + room.domain + '.wikia.com/wiki/User:' + encodeURIComponent(name);
			userpage.textContent = name;
			userpage.addEventListener('click', Torus.ui.click_link);
		info_name.appendChild(userpage);
		div.appendChild(info_name);

		if(target.mod || target.staff) { //star
			div.appendChild(document.createTextNode(' '));
			var info_access = document.createElement('span');
			info_access.id = 'torus-popup-access';
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
		state.textContent = target.status_state;
		info.appendChild(state);

		var message = document.createElement('div');
		message.id = 'torus-popup-status-message';
		message.textContent = target.status_message;
		info.appendChild(message);
	Torus.ui.ids['popup'].appendChild(info);

	var userlinks = document.createElement('div');
	userlinks.id = 'torus-popup-userlinks';
	var div = document.createElement('div');
		var talk = document.createElement('a');
		talk.className = 'torus-popup-userlink';
		talk.href = 'http://' + room.domain + '.wikia.com/wiki/User_talk:' + encodeURIComponent(name);
		talk.addEventListener('click', Torus.ui.click_link);
		talk.textContent = 'talk'; //FIXME: i18n
		div.appendChild(talk);

		var contribs = document.createElement('a');
		contribs.className = 'torus-popup-userlink';
		contribs.href = 'http://' + room.domain + '.wikia.com/wiki/Special:Contributions/' + encodeURIComponent(name);
		contribs.addEventListener('click', Torus.ui.click_link);
		contribs.textContent = 'contribs'; //FIXME: i18n
		div.appendChild(contribs);
	userlinks.appendChild(div);
	div = document.createElement('div');
		var chatban = document.createElement('a');
		chatban.className = 'torus-popup-userlink';
		chatban.href = 'http://' + room.domain + '.wikia.com/wiki/Special:Log/chatban?page=User:' + encodeURIComponent(name);
		chatban.addEventListener('click', Torus.ui.click_link);
		chatban.textContent = 'ban history'; //FIXME: i18n
		div.appendChild(chatban);

		var chatconnect = document.createElement('a');
		chatconnect.className = 'torus-popup-userlink';
		chatconnect.href = 'http://' + room.domain + '.wikia.com/wiki/Special:Log/chatconnect?user=' + encodeURIComponent(name);
		//chatconnect.addEventListener('click', Torus.ui.click_link);
		chatconnect.className += ' torus-fakelink';
		chatconnect.addEventListener('click', function(event) { //FIXME: closure, also ccui is not required
			event.preventDefault();
			Torus.ui.activate(Torus.ext.ccui);
			Torus.ext.ccui.query(name);
		});
		chatconnect.textContent = 'chatconnect'; //FIXME: i18n
		div.appendChild(chatconnect);
	userlinks.appendChild(div);
	Torus.ui.ids['popup'].appendChild(userlinks);

	var actions = document.createElement('div');
	actions.id = 'torus-popup-actions';
		var priv = document.createElement('a');
			if(Torus.data.blockedBy.indexOf(name) != -1) {priv.className = 'torus-popup-action-disabled';}
			else {
				priv.className = 'torus-popup-action';
				priv.setAttribute('data-user', name);
				priv.addEventListener('click', function() {room.open_private([this.getAttribute('data-user')]);}); //FIXME: closure
			}
			priv.textContent = 'Private message'; //FIXME: i18n
		actions.appendChild(priv);

		var block = document.createElement('a');
			block.className = 'torus-popup-action';
			block.setAttribute('data-user', name);
			if(Torus.data.blocked.indexOf(name) != -1) {
				block.addEventListener('click', Torus.ui.popup_unblock);
				block.textContent = 'Unblock PMs'; //FIXME: i18n
			}
			else {
				block.addEventListener('click', Torus.ui.popup_block);
				block.textContent = 'Block PMs'; //FIXME: i18n
			}
		actions.appendChild(block);

		if((user.givemod || user.staff) && !target.mod && !target.staff) {
			var mod = document.createElement('a');
			mod.className = 'torus-popup-action';
			mod.addEventListener('click', function() {this.children[0].style.display = 'block';});
			var confirm = document.createElement('div');
			confirm.id = 'torus-popup-modconfirm';
				var yes = document.createElement('input');
				yes.id = 'torus-popup-modconfirm-yes';
				yes.type = 'button';
				yes.value = 'Yes'; //FIXME: i18n
				yes.addEventListener('click', function() {room.mod(this.getAttribute('data-user'));}); //FIXME: closure
				yes.setAttribute('data-user', name);
				confirm.appendChild(yes);

				confirm.appendChild(document.createTextNode(' Are you sure? ')); //FIXME: i18n

				var no = document.createElement('input');
				no.id = 'torus-popup-modconfirm-no';
				no.type = 'button';
				no.value = 'No'; //FIXME: i18n
				no.addEventListener('click', function() {this.parentNode.style.display = 'none';});
				confirm.appendChild(no);
			mod.appendChild(confirm);
			mod.appendChild(document.createTextNode('Promote to mod')); //FIXME: i18n
			actions.appendChild(mod);
		}
		else {
			var mod = document.createElement('a');
			mod.className = 'torus-popup-action-disabled';
			mod.textContent = 'Promote to mod'; //FIXME: i18n
			actions.appendChild(mod);
		}

		if((user.staff || user.givemod || (user.mod && !target.mod)) && !target.staff && !target.givemod) {
			var kick = document.createElement('a');
			kick.className = 'torus-popup-action';
			kick.addEventListener('click', function() {room.kick(name);}); //FIXME: closure scope
			kick.textContent = 'Kick'; //FIXME: i18n
			actions.appendChild(kick);

			var ban = document.createElement('a');
			ban.className = 'torus-popup-action';
			var modal = document.createElement('div');
				modal.id = 'torus-popup-banmodal';
				var div = document.createElement('div');
					var expiry_label = document.createElement('label');
					expiry_label.for = 'torus-popup-banexpiry';
					expiry_label.textContent = 'Expiry:'; //FIXME: i18n
					div.appendChild(expiry_label);

					div.appendChild(document.createTextNode(' '));

					var expiry = document.createElement('input');
					expiry.id = 'torus-popup-banexpiry';
					expiry.type = 'text';
					expiry.placeholder = '1 day'; //FIXME: i18n
					expiry.addEventListener('keyup', function(event) { //FIXME: closure
						if(event.keyCode == 13) {
							if(this.value) {room.ban(name, Torus.util.expiry_to_seconds(this.value), this.parentNode.nextSibling.lastChild.value);}
							else {room.ban(name, 60 * 60 * 24, this.parentNode.nextSibling.lastChild.value);}
						}
					});
					div.appendChild(expiry);
				modal.appendChild(div);
				div = document.createElement('div');
					var reason_label = document.createElement('label');
					reason_label.for = 'torus-popup-banexpiry';
					reason_label.textContent = 'Reason:'; //FIXME: i18n
					div.appendChild(reason_label);

					div.appendChild(document.createTextNode(' '));

					var reason = document.createElement('input');
					reason.id = 'torus-popup-banreason';
					reason.placeholder = 'Misbehaving in chat'; //FIXME: i18n
					reason.addEventListener('keyup', function(event) { //FIXME: closure
						if(event.keyCode == 13) {
							var expiry = this.parentNode.previousSibling.lastChild.value;
							if(expiry) {room.ban(name, Torus.util.expiry_to_seconds(expiry), this.value);}
							else {room.ban(name, 60 * 60 * 24, this.value);}
						}
					});
					div.appendChild(reason);
				modal.appendChild(div);
				div = document.createElement('div');
					var submit = document.createElement('input');
					submit.id = 'torus-popup-banbutton';
					submit.type = 'submit'
					submit.value = 'Ban'; //FIXME: i18n
					submit.addEventListener('click', function(event) { //FIXME: closure
						var expiry = this.parentNode.previousSibling.previousSibling.lastChild.value;
						if(expiry) {room.ban(name, Torus.util.expiry_to_seconds(expiry), this.parentNode.previousSibling.lastChild.value);}
						else {room.ban(name, 60 * 60 * 24, this.parentNode.previousSibling.previousSibling.lastChild.value);}
					});
				modal.appendChild(div);
			ban.appendChild(modal);
			ban.appendChild(document.createTextNode('Ban')); //FIXME: i18n
			actions.appendChild(ban);
		}
		else {
			var kick = document.createElement('a');
			kick.className = 'torus-popup-action-disabled';
			kick.textContent = 'Kick'; //FIXME: i18n
			actions.appendChild(kick);

			var ban = document.createElement('a');
			ban.className = 'torus-popup-action-disabled';
			ban.textContent = 'Ban'; //FIXME: i18n
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
		el.removeEventListener(Torus.ui.popup_block);
		el.addEventListener(Torus.ui.popup_unblock);
		el.textContent = 'Unblock PMs';
	});
}

Torus.ui.popup_unblock = function() {
	this.appendChild(Torus.ui.img_loader());
	var el = this;
	Torus.io.unblock(this.getAttribute('data-user'), function() { //FIXME: closure
		Torus.util.empty(el);
		el.removeEventListener(Torus.ui.popup_unblock);
		el.addEventListener(Torus.ui.popup_block);
		el.textContent = 'Block PMs';
	});
}
