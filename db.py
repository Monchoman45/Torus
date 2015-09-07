#!/usr/local/bin/python3

#This is a script for spidering a bunch of wikis and updating /database.json

import sys
import os
import http.client
from urllib.parse import quote
import json
from getpass import getpass

wikis = [
	'callofduty',
	'camphalfbloodroleplay',
	'c',
	'clubpenguin',
	'cod',
	'community',
	'creepypasta',
	'elderscrolls',
	'gta',
	'mlp',
	'monchbox',
	'rappy',
	'runescape',
	'sactage',
	'tes',
	'thehungergames',
	'ttte',
	'wlb',
]

if len(sys.argv) < 2:
	print('Usage: db.py domain [summary]')
	sys.exit(1)
elif len(sys.argv) < 3:
	sys.argv.append('') #fun

sock = http.client.HTTPConnection('cis-linux2.temple.edu', timeout=60)

cid = 0
text = ''

for wiki in wikis:
	print('Spidering ' + wiki + ' ... ', end='\r')
	sock.request(
		'GET',
		'/~tuf23151/torus.php?domain=' + wiki,
		'',
		{'Connection': 'Keep-Alive'}
	)
	data = json.loads(sock.getresponse().read().decode('utf-8'))
	print('Spidering ' + wiki + ' ... ' + json.dumps(data))
	if 'error' in data: continue
	del data['_hits']
	cid = data['_cid']
	text += '\t\t\'' + wiki + '\': ' + json.dumps(data) + ',\n'

sock.close()

text = '\t//auto generated, see client: https://github.com/Monchoman45/Torus/blob/master/db.py\n\t//                and server: https://github.com/Monchoman45/Torus/blob/master/torus.php\n\n\tcid: ' + str(cid) + ',\n\tdata: {\n' + text + '\t},'

print('Connecting...')
sock = http.client.HTTPConnection(sys.argv[1], timeout=60)

session = '';
while not session:
	user = quote(input('Username: '))
	password = quote(getpass('Password: '))
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
	result = json.loads(sock.getresponse().read().decode('utf-8'))['login']['result']
	if result == 'WrongPass':
		print('Wrong password')
		session = ''
	elif result == 'NotExists':
		print('Wrong account')
		session = ''
	elif result == 'Success': break
	else: print('DEBUG: ' + result)

print('Fetching token...')
sock.request(
	'GET',
	'/api.php?action=query&prop=info&titles=MediaWiki:Torus.js/cache.json&indexpageids=1&intoken=edit&format=json',
	'',
	{'Connection': 'Keep alive', 'Cookie': session}
)
result = json.loads(sock.getresponse().read().decode('utf-8'))

print('Publishing: MediaWiki:Torus.js/cache.json ... ', end='')
sock.request(
	'POST',
	'/api.php',
	'action=edit&title=MediaWiki:Torus.js/cache.json&text=' + text + '&summary=' + quote(sys.argv[2]) + '&token=' + quote(result['query']['pages'][result['query']['pageids'][0]]['edittoken']) + '&format=json',
	{'Content-Type': 'application/x-www-form-urlencoded', 'Connection': 'Keep alive', 'Cookie': session}
)
response = json.loads(sock.getresponse().read().decode('utf-8'))
if 'edit' in response: print(response['edit']['result'])
else: print('Error ' + response['error']['code'] + ': ' + response['error']['info'])

print('Logging out...')
sock.request('GET', '/api.php?action=logout', '', {'Cookie': session})
sock.close()
