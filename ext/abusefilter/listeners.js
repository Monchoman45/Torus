Torus.ext.abusefilter.eval = function(event) {
	var vars = Torus.ext.abusefilter.message_vars(event);

	if(Torus.ext.abusefilter.examine == event.user) {
		for(var i in vars) {
			if(typeof(vars[i]) == 'function') {continue;}
			Torus.ui.ids['ext-abusefilter-examine-' + i].textContent = '' + vars[i];
		}
	}

	if(!Torus.ext.abusefilter.filter || !Torus.ext.abusefilter.params.enabled.enabled) {return;}

	if(Torus.ext.abusefilter.filter.eval(vars)) {
		//match
		for(var i in Torus.ext.abusefilter.params) {
			if(Torus.ext.abusefilter.params[i].enabled) {Torus.ext.abusefilter.actions[i](event, Torus.ext.abusefilter.params[i]);}
		}
	}
}

Torus.ext.abusefilter.update_action = function() {
	var action = this.getAttribute('data-action');
	var param = this.getAttribute('data-param');
	var extra = Torus.ui.ids['ext-abusefilter-' + action + '-params'];
	if(param == 'enabled' && extra) {
		if(this.checked) {extra.classList.remove('torus-hide');}
		else {extra.classList.add('torus-hide');}
	}
	if(this.type == 'checkbox') {Torus.ext.abusefilter.params[action][param] = this.checked;}
	else {Torus.ext.abusefilter.params[action][param] = this.value;}
}
Torus.ext.abusefilter.click_sidebar = function() {Torus.ext.abusefilter.render(this.getAttribute('data-id'));}
Torus.ext.abusefilter.click_enabled = function() {Torus.ext.abusefilter.enabled = this.checked;}
Torus.ext.abusefilter.blur_examine = function() {Torus.ext.abusefilter.examine = this.value;}
Torus.ext.abusefilter.blur_input = function() {
	Torus.ext.abusefilter.filter_text = this.value;
	var parser = new Torus.classes.AFParser(this.value);
	var ast = parser.parse();
	if(ast) {
		Torus.ext.abusefilter.filter = new Torus.classes.AFEvaluator(ast);
		Torus.ui.ids['ext-abusefilter-error'].classList.add('torus-hide');
		Torus.ui.ids['ext-abusefilter-error'].textContent = '';
	}
	else {
		Torus.ext.abusefilter.filter = false;
		Torus.ui.ids['ext-abusefilter-error'].classList.remove('torus-hide');
		Torus.ui.ids['ext-abusefilter-error'].textContent = parser.error_message;
	}
}
