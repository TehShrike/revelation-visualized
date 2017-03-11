// Heavily inspired by https://github.com/vvo/in-viewport/blob/f1bd60ba41bbaccff22ea7e9232dacbef260340b/in-viewport.js#L132-L173

module.exports = function positionPreserver(router, options = defaultOptions()) {
	onNavigateByElement(router, element => {
		const originalViewport = getViewport(options)
		const originalRelationshipToViewport = originalViewport.top - element.getBoundingClientRect().top + 1

		router.once('after navigate', ({ element }) => {
			const destination = element.offsetTop + originalRelationshipToViewport
			window.scrollTo(originalViewport.left, destination)
		})
	})
}

function onNavigateByElement(router, callback) {
	router.on('before navigate', ({ element }) => {
		if (element) {
			callback(element)
		}
	})
}

function getViewport({ container, offset }) {
	if (container === global.document.body) {
		return {
			top: -offset,
			left: -offset,
			right: global.document.documentElement.clientWidth + offset,
			bottom: global.document.documentElement.clientHeight + offset
		}
	} else {
		var containerRect = container.getBoundingClientRect()
		return {
			top: containerRect.top - offset,
			left: containerRect.left - offset,
			right: containerRect.right + offset,
			bottom: containerRect.bottom + offset
		}
	}
}

function defaultOptions() {
	return {
		container: global.document.body,
		offset: 0
	}
}
