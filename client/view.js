const slugify = require('slugify')

const Revelation = require('component/revelation.html')


function headerToSlug(header) {
	return `header-${slugify(header.toLowerCase())}`
}


module.exports = function makeMainView({ targetSelector, structuredText }) {
	return new Revelation({
		target: document.querySelector(targetSelector),
		data: {
			structuredText,
			currentChiasm: null
		}
	})
}
