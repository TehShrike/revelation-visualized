const addVersesToStructure = require('./structured-text')
const revelation = require('pickering-majority-text-revelation')
const makeMainView = require('./view')

const verses = revelation.versesNoteReferencesAndHeaders
.map(chunk => {
	return chunk.type === 'end paragraph' ? { type: 'paragraph break' } : chunk
})
.filter(chunk => chunk.type !== 'start paragraph')
.map(verseChunk => {
	if (verseChunk.type !== 'verse' || /^\u2014/.test(verseChunk.text)) {
		return verseChunk
	}

	return Object.assign({}, verseChunk, { text: ' ' + verseChunk.text })
})

const structuredText = addVersesToStructure(verses)

console.log(structuredText)

const component = makeMainView({ targetSelector: '#verses', structuredText })
