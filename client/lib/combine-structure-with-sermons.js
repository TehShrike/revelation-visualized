const oneToManyZip = require('one-to-many-array-zip')
const withinRange = require('multi-part-range-compare')

const getSectionRange = require('lib/get-section-range')

module.exports = function combineStructureWithSermons(structure, sermons) {
	return oneToManyZip(structure, sortSermons(sermons), (section, sermon) => {
		const { rangeStart, rangeEnd } = getSectionRange(section)

		return withinRange(rangeStart, rangeEnd, sermon.range[0])
	}).map(({ one: section, many: sermons }) => Object.assign({}, section, { sermons }))
}

function sortSermons(sermons) {
	return [ ...sermons ].sort((a, b) => {
		return withinRange.relative(b.range[0], b.range[0], a.range[0])
	})
}

