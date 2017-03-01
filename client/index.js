const revelation = require('pickering-majority-text-revelation')

const combineStructureAndVerses = require('lib/combine-structure-and-verses')
const structure = require('lib/structure')

const makeMainView = require('./view')

const { mountComponent } = require('lib/router-instance')

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

const structuredText = combineStructureAndVerses(structure, verses)

console.log(structuredText)

const component = makeMainView({ targetSelector: '#verses', structuredText })

mountComponent(component)
