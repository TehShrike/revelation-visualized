const Outline = require('./explanation/outline.html')
const Subsections = require('./explanation/subsections.html')

new Outline({
	target: document.querySelector('Outline')
})

new Subsections({
	target: document.querySelector('Subsections')
})
