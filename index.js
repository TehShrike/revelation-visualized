const Ractive = require('ractive')
const template = require('./revelation.html')
const revelation = require('pickering-majority-text-revelation')
const slugify = require('slugify')

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

// console.log(allStuff)

const colors = [
	"#018d5d",
	"#ba4460",
	"#9ea946",
	"#00479f",
	"#c26939",
	"#8188df",
	"#ee6bd4"
]

function headerToSlug(header) {
	return `header-${slugify(header.toLowerCase())}`
}

new Ractive({
	el: '#verses',
	template: template,
	data: {
		versesNoteReferencesAndHeaders: allStuff,
		notes: revelation.notes,
		colors,
		headerToSlug
	}
})

