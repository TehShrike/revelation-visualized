const Outline = require('./explanation/outline.html')
const Subsections = require('./explanation/subsections.html')
const InnerChiasm = require('./explanation/inner-chiasm.html')

new Outline({
	target: document.querySelector('Outline')
})

new Subsections({
	target: document.querySelector('Subsections')
})

new InnerChiasm({
	target: document.querySelector('InnerChiasm')
})
