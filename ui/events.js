Torus.classes.UIEvent = function(event, room) {
	if(!(this instanceof Torus.classes.UIEvent)) {throw new Error('Must call Torus.classes.UIEvent with `new`.');}
	Torus.classes.Event.call(this, 'ui', event, room);
}
Torus.classes.UIEvent.prototype = Object.create(Torus.classes.Event.prototype);
