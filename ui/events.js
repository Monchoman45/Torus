Torus.classes.UIEvent = function(event, room) {
	if(!(this instanceof Torus.classes.UIEvent)) {throw new Error('Must call Torus.classes.UIEvent with `new`.');}
	Torus.classes.Event.call(this, 'ui', event, room);
}
Torus.classes.UIEvent.prototype = Object.create(Torus.classes.Event.prototype);

Torus.ui.new_extension = function(event) {
	event.room.listeners.ui = {};
}

Torus.add_listener('ext', 'new', Torus.ui.new_extension);
