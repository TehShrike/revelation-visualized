const Outline = require('./explanation/Outline.html')
const Subsections = require('./explanation/Subsections.html')
const InnerChiasm = require('./explanation/InnerChiasm.html')

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
