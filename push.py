#!/usr/local/bin/python3

#This is a script for gathering everything together and putting it on a MediaWiki installation
#Which is important because you kind of really need &templates=expand to test
#You can invoke it with python3 push.py domain username password [summary]
#domain is any valid hostname, eg. monchbox.wikia.com or localhost
#It's not terribly smart so if you happen to have any files that don't end in .js or .css
#and don't start with . it'll think it's a directory and try to open it and explode
#so don't do that

import sys
import os
import http.client
from urllib.parse import quote
import json
from getpass import getpass

if len(sys.argv) < 3:
	print('Usage: python3 push.py <domain> <summary>')
	sys.exit(1)

targets = {
	'core/main.js': 'MediaWiki:Torus.js/modules/core.js',
	'ui/main.js': 'MediaWiki:Torus.js/modules/ui.js',
	'ui/main.css': 'MediaWiki:Torus.js/modules/ui.css',
	'cmd/main.js': 'MediaWiki:Torus.js/modules/cmd.js',
	'ext/ccui/main.js': 'MediaWiki:Torus.js/modules/ext/ccui.js',
	'ext/ccui/main.css': 'MediaWiki:Torus.js/modules/ext/ccui.css',
	'ext/abusefilter/main.js': 'MediaWiki:Torus.js/modules/ext/abusefilter.js',
	'ext/abusefilter/main.css': 'MediaWiki:Torus.js/modules/ext/abusefilter.css',

	'packages/ui.js': 'MediaWiki:Torus.js/ui.js',
	'packages/cmd.js': 'MediaWiki:Torus.js/cmd.js',
	'packages/everything.js': 'MediaWiki:Torus.js/everything.js',
}

variables = {
	'DOMAIN': sys.argv[1],
}

print('Collecting files...')
files = {}
dirs = [os.listdir('.')]
dirnames = ['']
while len(dirs):
	dir = dirs[0]
	dirname = dirnames[0]
	if len(dirname) != 0 and not dirname.endswith('\\'): dirname += '/'
	dirs = dirs[1:]
	dirnames = dirnames[1:]
	for file in dir:
		if file[0] == '.': continue
		elif file == '*':
			if len(dirname) != 0: 
				dirs.append(os.listdir(dirname))
				dirnames.append(dirname)
			else:
				dirs.append(os.listdir('.'))
				dirnames.append('')
		elif file.endswith('.js') or file.endswith('.css') or file.endswith('.json'):
			name = dirname.replace('\\', '/') + file
			with open(dirname + file, 'r') as f: files[name] = f.read()
		elif file.find('.') == -1: #is a directory
			dirs.append(os.listdir(dirname + file))
			dirnames.append(dirname + file)

def transclude(text):
	if text.find('{{') == -1: return text

	for i in files:
		if text.find('{{' + i + '}}') != -1:
			files[i] = transclude(files[i])
			text = text.replace('{{' + i + '}}', files[i])

	for i in variables:
		if text.find('@' + i.upper() + '@') != -1: text = text.replace('@' + i.upper() + '@', variables[i])
	return text

for i in targets:
	files[i] = transclude(files[i])
	print('\t' + targets[i] + ': ' + str(len(files[i])))

#for i in targets: print(files[i])

print('Connecting...')

session = ''
while not session:
	sock = http.client.HTTPConnection(sys.argv[1], timeout=300)
	try:
		user = quote(input('Username: '))
		password = quote(getpass('Password: '))
	except KeyboardInterrupt:
		print()
		sys.exit(1)
	sock.request(
		'POST',
		'/api.php',
		'action=login&lgname=' + user + '&lgpassword=' + password + '&format=json',
		{'Connection': 'Keep alive', 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'push.py'}
	)
	response = sock.getresponse()
	cookie = response.getheader('Set-Cookie')
	session = cookie[:cookie.find(';') + 1]
	token = quote(json.loads(response.read().decode('utf-8'))['login']['token'])
	sock.request(
		'POST',
		'/api.php',
		'action=login&lgname=' + user + '&lgpassword=' + password + '&lgtoken=' + token + '&format=json',
		{'Connection': 'Keep alive', 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': session, 'User-Agent': 'push.py'}
	)
	response = sock.getresponse()
	if sys.argv[1].find('.wikia.com') != -1:
		cookie = response.getheader('Set-Cookie')
		session += ' ' + cookie[:cookie.find(';') + 1]
	result = json.loads(response.read().decode('utf-8'))
	result = result['login']['result']
	if result == 'WrongPass':
		print('Wrong password')
		session = ''
	elif result == 'NotExists':
		print('Wrong account')
		session = ''
	elif result == 'Success': break
	else: print('DEBUG: ' + result)

print('Fetching tokens...')
sock.request(
	'GET',
	'/api.php?action=query&prop=info&titles=' + quote('|'.join(list(targets.values()))) + '&intoken=edit&format=json',
	'',
	{'Connection': 'Keep alive', 'Cookie': session, 'User-Agent': 'push.py'}
)
result = json.loads(sock.getresponse().read().decode('utf-8'))
pages = result['query']['pages']

for i in pages:
	print('Publishing: ' + pages[i]['title'] + ' ... ', end='\r')
	for j in targets:
		if targets[j] == pages[i]['title']:
			text = files[j]
			break

	sock.request(
		'POST',
		'/api.php',
		'action=edit&title=' + quote(pages[i]['title']) + '&text=' + quote(text) + '&summary=' + quote(sys.argv[2]) + '&token=' + quote(pages[i]['edittoken']) + '&format=json',
		{'Content-Type': 'application/x-www-form-urlencoded', 'Connection': 'Keep alive', 'Cookie': session, 'User-Agent': 'push.py'}
	)
	result = json.loads(sock.getresponse().read().decode('utf-8'))
	print('Publishing: ' + pages[i]['title'] + ' ... ', end='')
	if 'error' in result:
		print('Error ' + result['error']['code'] + ': ' + result['error']['info'] + '\n', result)
		continue
	print(result['edit']['result'])

	if sys.argv[1].find('.wikia.com') != -1:
		print('Submitting for review ... ', end='\r');
		sock.request(
			'POST',
			'/wikia.php?controller=ContentReviewApi&method=submitPageForReview&format=json',
			'pageName=' + quote(pages[i]['title']) + '&editToken=' + quote(pages[i]['edittoken']),
			{'Content-Type': 'application/x-www-form-urlencoded', 'Connection': 'Keep alive', 'Cookie': session, 'User-Agent': 'push.py'}
		)
		print('Submitting for review ... Done')

print('Logging out...')
sock.request('GET', '/api.php?action=logout', '', {'Connection': 'close', 'Cookie': session, 'User-Agent': 'push.py'})
sock.getresponse().read()
sock.close()
