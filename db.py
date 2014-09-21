#!/usr/local/bin/python3

#This is a script for spidering a bunch of wikis and updating /database.json

import sys
import os
import http.client
from urllib.parse import quote
import json

wikis = [
	'callofduty',
	'camphalfbloodroleplay',
	'clubpenguin',
	'community',
	'creepypasta',
	'elderscrolls',
	'gta',
	'mlp',
	'monchbox',
	'runescape',
	'sactage',
	'thehungergames',
	'ttte',
]

props = {
	'roomId': 'room',
	'nodeHostname': 'domain',
	'nodeInstance': 'server',
	'nodePort': 'port',
}

text = '\t//See https://github.com/Monchoman45/Torus/blob/master/db.py\n\n'

if len(sys.argv) < 4:
	print('Usage: db.py domain username password [summary]')
	sys.exit(1)
elif len(sys.argv) < 5:
	sys.argv.append('') #fun

print('Connecting...')
sock = http.client.HTTPConnection(sys.argv[1], timeout=300)

print('Logging in as ' + sys.argv[2] + '...')
user = quote(sys.argv[2])
password = quote(sys.argv[3])
sock.request(
	'POST',
	'/api.php',
	'action=login&lgname=' + user + '&lgpassword=' + password + '&format=json',
	{'Connection': 'Keep alive', 'Content-Type': 'application/x-www-form-urlencoded'}
)
response = sock.getresponse()
session = response.getheader('Set-Cookie')
session = session[:session.find(';') + 1]
token = quote(json.loads(response.read().decode('utf-8'))['login']['token'])
sock.request(
	'POST',
	'/api.php',
	'action=login&lgname=' + user +'&lgpassword=' + password + '&lgtoken=' + token + '&format=json',
	{'Connection': 'Keep alive', 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': session}
)
sock.getresponse().read()

for wiki in wikis:
	print('Spidering ' + wiki + ' ... ', end='\r')
	d_sock = http.client.HTTPConnection(wiki + '.wikia.com', timeout=300)
	d_sock.request(
		'GET',
		'/wikia.php?controller=Chat&format=json',
		'',
		{'Connection': 'close', 'Cookie': session}
	)
	result = json.loads(d_sock.getresponse().read().decode('utf-8'))
	d_sock.close()
	if 'exception' in result:
		print('Spidering ' + wiki + ' ... ' + json.dumps(result))
		continue
	data = '{'
	for i in props: data += props[i] + ': ' + json.dumps(result[i]) + ', '
	data = data[:-2] + '}'
	print('Spidering ' + wiki + ' ... ' + data)
	text += '\t' + wiki + ': ' + data + ',\n'

print('Fetching token...')
sock.request(
	'GET',
	'/api.php?action=query&prop=info&titles=MediaWiki:Torus.js/database.json&indexpageids=1&intoken=edit&format=json',
	'',
	{'Connection': 'Keep alive', 'Cookie': session}
)
result = json.loads(sock.getresponse().read().decode('utf-8'))

print('Publishing: MediaWiki:Torus.js/database.json ... ', end='')
sock.request(
	'POST',
	'/api.php',
	'action=edit&title=MediaWiki:Torus.js/database.json&text=' + text + '&summary=' + quote(sys.argv[4]) + '&token=' + quote(result['query']['pages'][result['query']['pageids'][0]]['edittoken']) + '&format=json',
	{'Content-Type': 'application/x-www-form-urlencoded', 'Connection': 'Keep alive', 'Cookie': session}
)
response = json.loads(sock.getresponse().read().decode('utf-8'))
if 'edit' in response: print(response['edit']['result'])
else: print('Error ' + response['error']['code'] + ': ' + response['error']['info'])

print('Logging out...')
sock.request('GET', '/api.php?action=logout', '', {'Cookie': session})
sock.close()
