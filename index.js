const Ractive = require('ractive')
const template = require('./revelation.html')
const addVersesToStructure = require('./structured-text')
const revelation = require('pickering-majority-text-revelation')
const slugify = require('slugify')

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

const colors = [
	'#018d5d',
	'#ba4460',
	'#9ea946',
	'#00479f',
	'#c26939',
	'#8188df',
	'#ee6bd4'
]

const chiasmColors = {
	a: 0,
	b: 1,
	c: 2,
	d: 3,
	e: 4,
	f: 5,
	g: 6,
	h: 7
}

function getChiasmColor(identifier) {
	const key = identifier[identifier.length - 1].toLowerCase()
	const colorIndex = chiasmColors[key]
	return colors[colorIndex]
}

function headerToSlug(header) {
	return `header-${slugify(header.toLowerCase())}`
}

function splitIntoParagraphs(chunks) {
	const paragraphs = []
	let currentParagraph = []

	function finishParagraph() {
		paragraphs.push(currentParagraph)
		currentParagraph = []
	}

	chunks.forEach(chunk => {
		if (chunk.type === 'paragraph break') {
			finishParagraph()
		} else {
			currentParagraph.push(chunk)
		}
	})

	if (currentParagraph.length > 0) {
		finishParagraph()
	}

	return paragraphs
}

const Paragraphs = Ractive.extend({
	template: require('./paragraphs.html'),
	twoway: false,
	data: () => ({
		headerToSlug,
		colors
	}),
	computed: {
		paragraphs() {
			return splitIntoParagraphs(this.get('verses'))
		}
	}
})

new Ractive({
	el: '#verses',
	template: template,
	data: {
		structuredText,
		getChiasmColor,
		currentChiasm: null
	},
	components: {
		Paragraphs
	},
	setChiasm(identifier) {
		const currentChiasm = this.get('currentChiasm')

		const newChiasm = currentChiasm === identifier ? null : identifier

		this.set('currentChiasm', newChiasm)
	}
})

