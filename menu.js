Torus.menu = new Torus.classes.Chat(-1, 'menu');

//FIXME: global variable
var img = document.createElement('img');
img.src = 'http://images2.wikia.nocookie.net/__cb20110812214252/monchbox/images/a/a1/Gear_icon.png';
img.width = '18';
Torus.ui.ids['tab--1'].insertBefore(document.createTextNode(String.fromCharCode(160)), Torus.ui.ids['tab--1'].firstChild); //160 is &nbsp;
Torus.ui.ids['tab--1'].insertBefore(img, Torus.ui.ids['tab--1'].firstChild);

Torus.menu.render = function() {
	Torus.ui.ids['info'].textContent = 'Torus client version ' + Torus.version + ', operating on `' + Torus.local + '`'; //FIXME: Torus.local
	for(var i in Torus.ext) {
		//do things
	}
}

Torus.menu.add_listener('ui', 'activate', function() {Torus.options.render(Torus.options.selected);});
Torus.menu.add_listener('ui', 'deactivate', function() {Torus.options.save();});
