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

if len(sys.argv) < 4:
	print('Usage: push.py domain summary file1 file2 file3 ...\nOr: push.py domain summary *')
	sys.exit(1)

print('Collecting files...')
files = {}
dirs = [sys.argv[3:]]
dirnames = ['']
while len(dirs):
	dir = dirs[0]
	dirname = dirnames[0]
	if len(dirname): dirname += '/'
	dirs = dirs[1:]
	dirnames = dirnames[1:]
	for file in dir:
		if file[0] == '.': continue
		if file.endswith('.js') or file.endswith('.css'):
			with open(dirname + file, 'r') as f: files['MediaWiki:Torus.js/' + dirname + file] = f.read()
			print('\t' + dirname + file + ': ' + str(len(files['MediaWiki:Torus.js/' + dirname + file])))
		elif not file.endswith('.py'):
			dirs.append(os.listdir(dirname + file))
			dirnames.append(dirname + file)

print('Connecting...')
sock = http.client.HTTPConnection(sys.argv[1], timeout=300)

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

print('Fetching tokens...')
sock.request(
	'GET',
	'/api.php?action=query&prop=info&titles=' + '|'.join(list(files.keys())) + '&intoken=edit&format=json',
	'',
	{'Connection': 'Keep alive', 'Cookie': session}
)
pages = json.loads(sock.getresponse().read().decode('utf-8'))['query']['pages']

for page in pages:
	print('Publishing: ' + pages[page]['title'] + ' ... ', end='\r')
	sock.request(
		'POST',
		'/api.php',
		'action=edit&title=' + pages[page]['title'] + '&text=' + quote(files[pages[page]['title']]) + '&summary=' + quote(sys.argv[2]) + '&token=' + quote(pages[page]['edittoken']) + '&format=json',
		{'Content-Type': 'application/x-www-form-urlencoded', 'Connection': 'Keep alive', 'Cookie': session}
	)
	response = json.loads(sock.getresponse().read().decode('utf-8'))
	print('Publishing: ' + pages[page]['title'] + ' ... ', end='')
	if 'edit' in response:  print(response['edit']['result'])
	else: print('Error ' + response['error']['code'] + ': ' + response['error']['info'])

print('Logging out...')
sock.request('GET', '/api.php?action=logout', '', {'Cookie': session})
sock.getresponse().read()
sock.close()
