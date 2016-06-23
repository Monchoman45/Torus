Torus.classes.Event = function(type, event, room) { //this is really just so you can this instanceof Torus.classes.Event
	if(!(this instanceof Torus.classes.Event)) {throw new Error('Must call Torus.classes.Event with `new`.');}

	this.type = type;
	this.event = event;
	if(room !== undefined) {this.room = room;}
}

Torus.classes.WindowEvent = function(event) {
	if(!(this instanceof Torus.classes.WindowEvent)) {throw new Error('Must call Torus.classes.WindowEvent with `new`.');}
	Torus.classes.Event.call(this, 'window', event);
}
Torus.classes.WindowEvent.prototype = Object.create(Torus.classes.Event.prototype);

Torus.classes.ChatEvent = function(event, room) {
	if(!(this instanceof Torus.classes.ChatEvent)) {throw new Error('Must call Torus.classes.ChatEvent with `new`.');}
	Torus.classes.Event.call(this, 'chat', event, room);
}
Torus.classes.ChatEvent.prototype = Object.create(Torus.classes.Event.prototype);

Torus.classes.IOEvent = function(event, room) {
	if(!(this instanceof Torus.classes.IOEvent)) {throw new Error('Must call Torus.classes.IOEvent with `new`.');}
	Torus.classes.Event.call(this, 'io', event, room);

	var t = (new Date()).getTime();
	this.id = t;
	this.time = t;
}
Torus.classes.IOEvent.prototype = Object.create(Torus.classes.Event.prototype);
