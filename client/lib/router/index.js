const Link = require('./link.html')
const EventEmitter = require('eventemitter3')

function defaultPushState(state, title, url) {
	history.pushState(state, title, url)
}

function defaultCurrentQuerystring() {
	const querystring = location.search
	const keyValuePairs = querystring.length > 1
		?	querystring.slice(1).split('&').map(keyValuePairString => keyValuePairString.split('='))
		: []

	const parameters = keyValuePairs.reduce((map, [ key, value ]) => {
		map[key] = value
		return map
	}, Object.create(null))

	return {
		querystring,
		parameters
	}
}

function defaultOnPopState(listener) {
	window.addEventListener('popstate', listener)
}

module.exports = function createRouterInstance(
		pushState = defaultPushState,
		currentQuerystring = defaultCurrentQuerystring,
		onPopState = defaultOnPopState) {

	const emitter = new EventEmitter()
	let current = currentQuerystring()

	onPopState(() => {
		const { querystring, parameters } = currentQuerystring()
		emitter.emit('navigate', { querystring, parameters })
	})

	return {
		Link: function linkProxy(options) {
			const linkComponent = new Link(options)

			linkComponent.on('navigate', ({ querystring, parameters }) => {
				current = { querystring, parameters }

				emitter.emit('navigate', { querystring, parameters })

				pushState(parameters, '', querystring)

				emitter.emit('after navigate', {
					querystring,
					parameters,
					element: linkComponent.refs.link
				})
			})

			return linkComponent
		},
		attachQuerystringData(component) {
			function navigateListener({ parameters }) {
				component.set({
					querystringParameters: parameters
				})
			}
			emitter.on('navigate', navigateListener)
			component.on('teardown', () => emitter.removeListener('navigate', navigateListener))
			component.set({
				querystringParameters: current.parameters
			})
		},
		on(event, listener) {
			emitter.on(event, listener)
			return () => emitter.removeListener(event, listener)
		},
		once(event, listener) {
			emitter.once(event, listener)
			return () => emitter.removeListener(event, listener)
		}
	}
}
