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

with open('cache.json', 'w') as file: file.write(text)
