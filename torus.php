<?php
/*
 * https://github.com/Monchoman45/Torus/blob/master/torus.php
 *
 * Usage: http://cis-linxu2.temple.edu/~tuf23151/torus.php?domain=X
 *     for connection info for X.wikia.com
 * 
 * Possible errors:
 *     nodomain: ?domain was not set
 *     nochat: wiki doesn't have chat
 *     missing: couldn't find a data value that is usually available
 *         prop: the data value that was missing
 * 
 * Easy test url: http://cis-linux2.temple.edu/~tuf23151/torus.php?domain=c
 */

define(CACHE_MAX, 128);

//CORS
$headers = getallheaders();
if(array_key_exists('Origin', $headers)) {
	header('Access-Control-Allow-Origin: ' . $headers['Origin']);
	header('Access-Control-Allow-Headers: ' . $headers['Access-Control-Request-Headers']);
}

//load cache
$cache = json_decode(file_get_contents('cache.json'), true);
if(!$cache) {$cache = array('_cid' => time(), '_misses' => 0);} //this should only happen when bad things happen

//validate
if(array_key_exists('cacheinfo', $_GET)) {
	$size = count($cache);
	$average = 0;
	$min = '';
	$max = '';
	foreach($cache as $key => $val) {
		if($key[0] == '_') {continue;}
		$average += $val['_hits'];
		if(!$min || $val['_hits'] < $cache[$min]['_hits']) {$min = $key;}
		if(!$max || $val['_hits'] > $cache[$max]['_hits']) {$max = $key;}
	}
	$average /= $size;
	echo json_encode(array(
		'cid' => $cache['_cid'],
		'misses' => $cache['_misses'],
		'size' => $size,
		'hit_average' => $average,
		'max_key' => $max,
		'max_val' => $cache[$max]['_hits'],
		'min_key' => $min,
		'min_val' => $cache[$min]['_hits'],
	));
	exit();
}
else if(!array_key_exists('domain', $_GET) || !$_GET['domain']) {
	echo json_encode(array('error' => 'nodomain'));
	exit();
}
$domain = $_GET['domain'];

//check cache
if(array_key_exists($domain, $cache)) {
	//cache hit
	//echo "cache hit\n";
	$cache[$domain]['_hits']++;
	file_put_contents('cache.json', json_encode($cache));
	$cache[$domain]['_cid'] = $cache['_cid'];
	echo json_encode($cache[$domain]);
	exit();
}

//not in cache, gotta do it the hard way
//echo "cache miss\n";
$cache['_misses']++;

//get data
$response = json_decode(file_get_contents('http://' . $_GET['domain'] . '.wikia.com/wikia.php?controller=Chat&format=json'), true);
if(!$response) {
	echo json_encode(array('error' => 'nochat'));
	exit();
}

//fill $data
$props = array(
	'roomId' => 'room',
	'nodeHostname' => 'host',
	'nodeInstance' => 'server',
	'nodePort' => 'port',
);
$data = array('_hits' => 1);
foreach($props as $key => $val) {
	if(!array_key_exists($key, $response)) {
		echo json_encode(array('error' => 'missing', 'prop' => $key));
		exit();
	}

	$data[$val] = $response[$key];
}

//check cache size
if(count($cache) > CACHE_MAX) {
	//cache is getting big, drop least used entry
	$min = '';
	foreach($cache as $key => $val) {
		if($key[0] == '_') {continue;}
		if(!$min || $val['_hits'] < $cache[$min]['_hits']) {$min = $key;}
	}
	unset($cache[$min]);
}

//we done yo
$cache[$domain] = $data;
file_put_contents('cache.json', json_encode($cache));
$data['_cid'] = $cache['_cid'];
echo json_encode($data);
?>
