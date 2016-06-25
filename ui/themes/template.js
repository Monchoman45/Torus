/* 
 * TEMPLATE THEME
 * 
 * This JS file can be used to load your custom theme.
 * 
 * Use a find/replace tool to replace $name with your unique
 * identifier and $url with the url your CSS file can be found at.
 * Then find the i18n section and name your theme - instructions
 * can be found in the comment block below.
 * 
 * As with the CSS, you can use this file to do anything you'd like
 * as long as it works and looks good, although if you want your
 * theme included as a default option in Torus, none of your extra
 * JS will be included.
 */

function Torus_theme_$name() {
	if(Torus.ui.themes.dir['$name']) {throw new Error('Tried to load theme `$name`, but it already exists');}
	Torus.ui.themes.dir['$name'] = {
		url: '$url',
		name: 'themes-name-$name',
		loaded: false,
	};
	Torus.i18n['en']['themes-name-$name'] = 'English name here';
	//Torus.i18n['es']['themes-name-$name'] = 'Spanish name here';
	//Torus.i18n['de']['themes-name-$name'] = 'German name here';
	//Torus.i18n['nl']['themes-name-$name'] = 'Dutch name here';
	//
	// and so on. You need an english name, but others are optional
	// if you don't speak english, don't know how to translate your
	// name, or can't translate your name, just use it as the 
	// english name without translating it
	// eg. if your theme name is "mi gato" (spanish for "my cat"),
	// but you can't translate that for some reason, just make the
	// english name "mi gato". i promise us en-Ns don't really care
	Torus.ui.themes.rebuild();
}

if(!Torus) {
	if(document.readyState != 'complete') {window.addEventListener('load', function() {setTimeout(Torus_theme_$name, 1);});}
	else {throw new Error('Tried to load theme `$name`, but page has loaded and Torus doesn\'t exist');}
}
else if(!Torus.init) {Torus.add_listener('window', 'load', function() {setTimeout(Torus_theme_$name, 1);});}
else {Torus_theme_$name();}
