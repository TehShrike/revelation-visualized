module.exports = function pipe(input, ...fns) {
	return fns.reduce((lastResult, fn) => fn(lastResult), input)
}
