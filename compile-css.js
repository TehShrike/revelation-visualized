const path = require('path')
const fs = require('fs')

const postcss = require('postcss')
const precss = require('precss')
const autoprefixer = require('autoprefixer')

const denodeify = require('then-denodeify')
const chokidar = require('chokidar')

const readFile = denodeify(fs.readFile)
const writeFile = denodeify(fs.writeFile)

async function build(filePath) {
	const basename = path.basename(filePath)
	const destination = `./public/${basename}`
	const contents = await readFile(filePath, { encoding: 'utf8' })
	const reasonablePrecss = precss({
		import: {
			prefix: ''
		}
	})

	console.log('building', basename)
	const result = await postcss([ reasonablePrecss, autoprefixer ]).process(contents, {
		from: filePath,
		to: destination
	})

	await Promise.all([
		writeFile(destination, result),
		writeFile(`${destination}.map`, result.map)
	])
}

async function regularBuild() {
	await Promise.all([
		build('./client/index-style.css'),
		build('./client/shared-style.css'),
		build('./client/explanation/explanation-style.css')
	])
}

function startIfItsNotRunningAlready(asyncFunction) {
	let queued = false
	let running = false

	async function singleRun() {
		running = true
		await asyncFunction()
		running = false
	}

	return async function run() {
		if (running) {
			queued = true
		} else {
			queued = false
			await singleRun()
			if (queued) {
				run()
			}
		}
	}
}

function watch() {
	const watcher = chokidar.watch('client/**/*.css')
	const buildButOnlyOneAtATime = startIfItsNotRunningAlready(regularBuild)

	watcher.on('add', buildButOnlyOneAtATime).on('change', buildButOnlyOneAtATime)
	// watcher.on('add', path => console.log('add:', path)).on('change', path => console.log('change:', path))
}

async function main(debug) {
	await regularBuild()

	if (debug) {
		watch()
	}
}

main(process.argv[2] === 'watch')
