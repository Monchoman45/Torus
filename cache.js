Torus.cache = {
{{MediaWiki:Torus.js/cache.json}}
};

Torus.cache.save = function() {
	window.localStorage.setItem('torus-cache', JSON.stringify(Torus.cache));
}

Torus.cache.load = function() {
	var cache = window.localStorage.getItem('torus-cache');
	if(!cache) {return;}
	cache = JSON.parse(cache);

	if(cache.cid < Torus.cache.cid) {
		window.localStorage.removeItem('torus-cache');
		return;
	}
	for(var i in cache) {
		if(i == 'data') {
			for(var j in cache[i]) {Torus.cache[i][j] = cache[i][j];}
		}
		else {Torus.cache[i] = cache[i];}
	}
}

Torus.cache.update = function(domain, entry) {
	if(entry._cid > Torus.cache.cid) {
		for(var i in Torus.cache.data) {delete Torus.cache.data[i];} //TODO: some kind of "clear your browser cache" message
	}
	Torus.cache.data[domain] = entry;
	Torus.cache.save();
}

Torus.add_listener('window', 'load', Torus.cache.load);
Torus.add_listener('window', 'unload', Torus.cache.save);
