const inViewport = require('lib/in-viewport')

const keyCodes = {
	g: 71
}

// window.getSelection()
module.exports = function startKeypressWatcher(router) {
	document.addEventListener('keydown', event => {
		if (event.keyCode === keyCodes.g) {
			event.preventDefault()

			const parameters = getParametersWithTranslationToggled(router.getCurrentParameters())

			router.navigate({
				parameters,
				element: getFirstAnchorInViewport()
			})
		}
	})
}

function getParametersWithTranslationToggled(parameters) {
	const isCurrentlyGreek = parameters.translation === 'greek'
	const toggledTranslation = isCurrentlyGreek ? 'english' : 'greek'

	const newParameters = Object.assign({}, parameters, {
		translation: toggledTranslation
	})

	if (toggledTranslation === 'english') {
		delete newParameters.translation
	}

	return newParameters
}

function getFirstAnchorInViewport() {
	const [ firstAnchorInViewport ] = [...document.querySelectorAll('a')]
		.filter(element => element.id)
		.filter(element => inViewport(element))

	return firstAnchorInViewport
}
