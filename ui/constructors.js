Torus.ui.img_loader = function() {
	var loader = document.createElement('img');
		loader.className = 'torus-loader';
		loader.src = 'http://slot1.images.wikia.nocookie.net/__cb1410215834/common/skins/common/images/ajax.gif';
	return loader;
}

Torus.ui.span_user = function(user) {
	var color = Torus.util.color_hash(user, Torus.options.ui_colorhue, Torus.options.ui_colorval, Torus.options.ui_colorsat);
	var span = document.createElement('span');
		span.className = 'torus-message-usercolor';
		span.style.color = color;
		span.textContent = user;
	return span;
}
