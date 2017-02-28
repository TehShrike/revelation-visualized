const Ractive = require('ractive')
const slugify = require('slugify')

const template = require('./template/revelation.html')

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


module.exports = function makeMainView({ el, structuredText }) {
	function splitIntoParagraphs(chunks) {
		const paragraphs = []
		let currentParagraph = []

		function finishParagraph() {
			if (currentParagraph.length > 0) {
				paragraphs.push(currentParagraph)
				currentParagraph = []
			}
		}

		chunks.forEach(chunk => {
			if (chunk.type === 'paragraph break') {
				finishParagraph()
			} else {
				currentParagraph.push(chunk)
			}
		})

		finishParagraph()

		return paragraphs
	}

	const Paragraphs = Ractive.extend({
		template: require('./template/paragraphs.html'),
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

	return new Ractive({
		el,
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
}
