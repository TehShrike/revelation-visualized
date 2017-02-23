const Ractive = require('ractive')
const template = require('./revelation.html')
const revelation = require('pickering-majority-text-revelation')


const transformedVerses = revelation.versesNoteReferencesAndHeaders.map(function(verseChunk) {
	if (verseChunk.type === 'verse' && !/^\u2014/.test(verseChunk.text)) {
		verseChunk.text = ' ' + verseChunk.text
	}
	return verseChunk
})

const allStuff = []
let currentParagraph = []
let inParagraph = false

transformedVerses.forEach(function(chunk) {
	if (inParagraph) {
		if (chunk.type === 'end paragraph') {
			allStuff.push({
				type: 'paragraph',
				contents: currentParagraph
			})
			inParagraph = false
			currentParagraph = null
		} else {
			currentParagraph.push(chunk)
		}
	} else if (chunk.type === 'start paragraph') {
		currentParagraph = []
		inParagraph = true
	} else {
		allStuff.push(chunk)
	}
})

console.log(allStuff)

new Ractive({
	el: '#verses',
	template: template,
	data: {
		versesNoteReferencesAndHeaders: allStuff,
		notes: revelation.notes
	}
})
