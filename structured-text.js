const oneToManyZip = require('one-to-many-array-zip')
const withinRange = require('multi-part-range-compare')

const structure = require('./structure')

module.exports = function addVersesToStructure(verses) {
	return oneToManyZip(structure, verses, ({ range }, verse) => {
		const [ rangeStart, rangeEnd ] = range

		return verse.type !== 'verse' || withinRange(rangeStart, rangeEnd, verseReference(verse))
	}).map(({ one: section, many: verses }) => Object.assign({}, section, { verses }))
}

function verseReference({ chapterNumber, verseNumber, sectionNumber }) {
	return [ chapterNumber, verseNumber, sectionNumber ]
}
