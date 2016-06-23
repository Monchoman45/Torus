Torus.ext = {};

Torus.classes.Extension = function(name, id) {
	if(!(this instanceof Torus.classes.Extension)) {throw new Error('Must call Torus.classes.Extension with `new`.');}
	if(!name) {throw new Error('Extensions must be named.');}
	if(Torus.ext[name]) {throw new Error('Tried to register new extension `' + name + '` but it already exists.');}

	Torus.ext[name] = this;

	this.id = id;
	this.name = name;
	this.listeners = {
		chat: {},
		ext: {}
	};

	Torus.call_listeners(new Torus.classes.ExtEvent('new', this));
}

Torus.classes.Extension.prototype.add_listener = Torus.add_listener;
Torus.classes.Extension.prototype.remove_listener = Torus.remove_listener;
Torus.classes.Extension.prototype.call_listeners = Torus.call_listeners;

Torus.classes.ExtEvent = function(event, ext) {
	if(!(this instanceof Torus.classes.ExtEvent)) {throw new Error('Must call Torus.classes.ExtEvent with `new`.');}
	Torus.classes.Event.call(this, 'ext', event, ext);
}
Torus.classes.ExtEvent.prototype = Object.create(Torus.classes.Event.prototype);
