const revelation = require('pickering-majority-text-revelation')
const oneToManyZip = require('one-to-many-array-zip')
const withinRange = require('multi-part-range-compare')

const structure = require('./structure')

const verses = revelation.versesNoteReferencesAndHeaders.filter(chunk => chunk.type === 'verse')

const sectionsWithVerses = oneToManyZip(structure, verses, ({ range }, verse) => {
	const [ rangeStart, rangeEnd ] = range

	return withinRange(rangeStart, rangeEnd, verseReference(verse))
}).map(({ one: section, many: verses }) => Object.assign({}, section, { verses }))

// printJson(sectionsWithVerses)
module.exports = sectionsWithVerses

// const next = sectionsWithVerses.map(section => {
// 	return Object.assign({},
// 		section,
// 		forProperty(section, 'introduction', addVerses),
// 		forProperty(section, 'subsections', (subsections, verses) => {
// 			return subsections.map(subsection => addVerses(subsection, verses))
// 		})
// 	)
// })

// function addVerses(child, sectionVerses) {
// 	const [ rangeStart, rangeEnd ] = child.range
// 	const childVerses = sectionVerses.filter(verse => withinRange(rangeStart, rangeEnd, verseReference(verse)))
// 	return Object.assign({}, child, { verses: childVerses })
// }

// function forProperty(section, property, transform) {
// 	if (section[property]) {
// 		return {
// 			[property]: transform(section[property], section.verses)
// 		}
// 	}
// }

// printJson(next)




function verseReference({ chapterNumber, verseNumber, sectionNumber }) {
	return [ chapterNumber, verseNumber, sectionNumber ]
}

// function printJson(value) {
// 	console.log(JSON.stringify(value, null, '\t'))
// }
