const sermons = require('lib/data/sermons.json')
const guaranteeRangeSection = require('lib/guarantee-range-section')

module.exports = sermons.map(sermon => {
	return Object.assign(sermon, {
		range: [
			guaranteeRangeSection(sermon.range[0]),
			guaranteeRangeSection(sermon.range[1])
		]
	})
})
