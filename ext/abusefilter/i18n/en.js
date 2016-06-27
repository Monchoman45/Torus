if(!Torus.i18n['en']) {Torus.i18n['en'] = {};}

Torus.util.softmerge(Torus.i18n['en'], {
	'ext-abusefilter-name': 'Abusefilter',

	'ext-abusefilter-text': 'Filter text',
	'ext-abusefilter-actions': 'Filter actions',

	'ext-abusefilter-sidebar-filter': 'Filter',
	'ext-abusefilter-sidebar-examine': 'Examine',
	'ext-abusefilter-sidebar-help': 'Help',

	'ext-abusefilter-label-enabled': 'Enabled',
	'ext-abusefilter-label-ping': 'Ping me',
	'ext-abusefilter-label-warn': 'Send message',
	'ext-abusefilter-label-warn-message': 'Message: ',
	'ext-abusefilter-label-kick': 'Kick',
	'ext-abusefilter-label-ban': 'Ban',
	'ext-abusefilter-label-ban-expiry': 'Expiry: ',
	'ext-abusefilter-label-ban-summary': 'Summary: ',
	'ext-abusefilter-label-block': 'Block',
	'ext-abusefilter-label-block-expiry': 'Expiry: ',
	'ext-abusefilter-label-block-reason': 'Summary: ',
	'ext-abusefilter-label-block-autoblock': 'Autoblock',
	'ext-abusefilter-label-block-noemail': 'Prevent email',
	'ext-abusefilter-label-block-allowusertalk': 'Allow user to edit their own talk page',
	'ext-abusefilter-label-block-nocreate': 'Prevent account creation',

	'ext-abusefilter-label-examine': 'Examine actions by user: ',



	'ext-abusefilter-table-variables': 'Variables',
	'ext-abusefilter-table-functions': 'Functions',
	'ext-abusefilter-table-name': 'Name',
	'ext-abusefilter-table-type': 'Type',
	'ext-abusefilter-table-description': 'Description',

	'ext-abusefilter-help-event': 'Event name. Can be "join", "message", or "me".',

	'ext-abusefilter-help-message_text': 'Unparsed message text. Empty for join events.',
	'ext-abusefilter-help-message_html': 'Parsed HTML of message text. Empty for join events.',
	'ext-abusefilter-help-message_ping': 'Whether or not the message pinged you. This is based on your normal pings, not the ping on filter match function.',
	'ext-abusefilter-help-message_time': 'Unix timestamp.',

	'ext-abusefilter-help-user_name': 'Name of user who sent the message.',
	'ext-abusefilter-help-user_mod': 'Whether the user is a mod.',
	'ext-abusefilter-help-user_givemod': 'Whether the user is an admin (or helper).',
	'ext-abusefilter-help-user_staff': 'Whether the user is staff.',
	'ext-abusefilter-help-user_edits': 'Number of edits.',
	'ext-abusefilter-help-user_avatar': 'URL of user\'s avatar.',
	'ext-abusefilter-help-user_status': 'User\'s status state. Commonly either "here" or "away".',
	'ext-abusefilter-help-user_status_message': 'User\'s status message. Generally only people who use Torus can change this.',

	'ext-abusefilter-help-room_name': 'Room\'s display name. This is usually more useful for PMs.',
	'ext-abusefilter-help-room_domain': 'Wiki domain (eg. community for community.wikia.com)',
	'ext-abusefilter-help-room_size': 'Number of users in the room.',
	'ext-abusefilter-help-room_id': 'Room ID.',

	'ext-abusefilter-help-lcase': 'Returns the argument converted to lower case.',
	'ext-abusefilter-help-ucase': 'Returns the argument converted to upper case.',
	'ext-abusefilter-help-length': 'Returns the length of the string given as the argument.',
	'ext-abusefilter-help-strlen': 'Same as length.',
	'ext-abusefilter-help-substr': 'Returns the portion of the first string, by offset from the second argument (starts at 0) and maximum length from the third argument (optional).',
	'ext-abusefilter-help-strpos': 'Returns the numeric position of the first occurrence of needle (second string) in the haystack (first string). This function may return 0 when the needle is found at the begining of the haystack, so it might be misinterpreted as false value by another comparative operator. The better way is to use === or !== for testing whether it is found.',
	'ext-abusefilter-help-str_replace': 'Replaces all occurrences of the search string with the replacement string. The function takes 3 arguments in the following order: text to perform the search, text to find, replacement text.',

	//'ext-abusefilter-help-norm': 'Equivalent to rmwhitespace(rmspecials(rmdoubles(ccnorm(arg1)))).',
	//'ext-abusefilter-help-ccnorm': 'Normalises confusable/similar characters in the argument, and returns a canonical form. A list of characters and their replacements can be found on git, eg. ccnorm( "Eeèéëēĕėęě3ƐƷ" ) === "EEEEEEEEEEEEE".',
	'ext-abusefilter-help-specialratio': 'Returns the number of non-alphanumeric characters divided by the total number of characters in the argument.',
	'ext-abusefilter-help-rmspecials': 'Removes any special characters in the argument, and returns the result. (Equivalent to s/[^\p{L}\p{N}]//g.)',
	'ext-abusefilter-help-rmdoubles': 'Removes repeated characters in the argument, and returns the result.',
	'ext-abusefilter-help-rmwhitespace': 'Removes whitespace (spaces, tabs, newlines).',

	'ext-abusefilter-help-count': 'Returns the number of times the needle (first string) appears in the haystack (second string).',
	//'ext-abusefilter-help-rcount': 'Similar to count but the needle uses a regular expression instead. Can be made case-insensitive by letting the regular expression start with "(?i)".',

	'ext-abusefilter-help-contains_any': 'Returns true if the first string contains any strings from the following arguments (unlimited number of arguments).',
	//'ext-abusefilter-help-rescape': 'Returns the argument with some characters preceded with the escape character "\", so that the string can be used in a regular expression without those characters having a special meaning.',
	'ext-abusefilter-help-set': 'Sets a variable (first string) with a given value (second argument) for further use in the filter. Another syntax: name := value.',
	'ext-abusefilter-help-set_var': 'Same as set.',

	'ext-abusefilter-help-string': 'Casts to string data type.',
	'ext-abusefilter-help-int': 'Casts to integer data type.',
	'ext-abusefilter-help-bool': 'Casts to boolean data type.',

	'ext-abusefilter-help-url_encode': 'URL encodes the input string (encodeURIComponent).',
	'ext-abusefilter-help-strip_unicode': 'Strips unicode characters from the input, eg. "T҉̴͞͏" -> "T".',
	'ext-abusefilter-help-vowel_ratio': 'Returns number of vowels / number of consonants (does not count numbers or special characters). English averages around .61.',
});
