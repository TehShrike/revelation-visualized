const Outline = require('./explanation/outline.html')
const Subsections = require('./explanation/subsections.html')
const InnerChiasm = require('./explanation/inner-chiasm.html')

const createKeyboardListener = require('lib/keyboard-shortcut')

new Outline({
	target: document.querySelector('Outline')
})

new Subsections({
	target: document.querySelector('Subsections')
})

new InnerChiasm({
	target: document.querySelector('InnerChiasm')
})


let easterEggActivated = false
createKeyboardListener({
	71: () => {
		if (!easterEggActivated) {
			easterEggActivated = true
			document.getElementById('tldr').append(` lol, not on this page, I don't have a greek translation of this explanation text.`)
		}
	}
})
