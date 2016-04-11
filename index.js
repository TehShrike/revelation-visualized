var Ractive = require('ractive')
var template = require('./revelation.html')
var revelation = require('pickering-majority-text-revelation')



new Ractive({
	el: 'body',
	template: template,
	data: {
		versesNoteReferencesAndHeaders: revelation.versesNoteReferencesAndHeaders,
		notes: revelation.notes
	}
})
