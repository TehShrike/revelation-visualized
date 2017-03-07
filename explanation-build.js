(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

function applyComputations ( state, newState, oldState, isInitial ) {
	if ( isInitial || ( 'range' in newState && typeof state.range === 'object' || state.range !== oldState.range ) ) {
		state.rangeStart = newState.rangeStart = template.computed.rangeStart( state.range );
	}
	
	if ( isInitial || ( 'range' in newState && typeof state.range === 'object' || state.range !== oldState.range ) ) {
		state.rangeEnd = newState.rangeEnd = template.computed.rangeEnd( state.range );
	}
	
	if ( isInitial || ( 'rangeStart' in newState && typeof state.rangeStart === 'object' || state.rangeStart !== oldState.rangeStart ) || ( 'rangeEnd' in newState && typeof state.rangeEnd === 'object' || state.rangeEnd !== oldState.rangeEnd ) ) {
		state.readableRange = newState.readableRange = template.computed.readableRange( state.rangeStart, state.rangeEnd );
	}
}

var template = (function () {

// copied from structure.js.  Shame, shame...
const VERSE_SECTION_RANGE_MIN = 1
const VERSE_SECTION_RANGE_MAX = 9999

const verseSectionFriendlyNames = ['a', 'b', 'c', 'd', 'e']
function friendlyName(sectionNumber) {
	return verseSectionFriendlyNames[sectionNumber - 1]
}

return {
	computed: {
		rangeStart: range => range[0],
		rangeEnd: range => range[1],
		readableRange: (rangeStart, rangeEnd) => {
			const [ startChapter, startVerse, startSection ] = rangeStart
			const [ endChapter, endVerse, endSection ] = rangeEnd

			if (startChapter === endChapter && startVerse === endVerse) {
				const chapterVerse = `${startChapter}:${startVerse}`
				const subVerseRange = startSection > VERSE_SECTION_RANGE_MIN
					|| endSection < VERSE_SECTION_RANGE_MAX

				if (subVerseRange) {
					const verseWithStartRangeName = `${chapterVerse}${friendlyName(startSection)}`
					if (startSection === endSection) {
						return verseWithStartRangeName
					} else if (endSection === VERSE_SECTION_RANGE_MAX) {
						return verseWithStartRangeName
					} else {
						const verseWithEndRangeName = `${chapterVerse}${friendlyName(endSection)}`
						return `${verseWithStartRangeName}-${verseWithEndRangeName}`
					}
				} else {
					return chapterVerse
				}
			} else {
				const start = startSection > VERSE_SECTION_RANGE_MIN
					? `${startChapter}:${startVerse}${friendlyName(startSection)}`
					: `${startChapter}:${startVerse}`
				const end = endSection < VERSE_SECTION_RANGE_MAX
					? `${endChapter}:${endVerse}${friendlyName(endSection)}`
					: `${endChapter}:${endVerse}`

				return `${start}-${end}`
			}

		}
	}
}
}());

let addedCss = false;
function addCss () {
	var style = createElement( 'style' );
	style.textContent = "\n[svelte-3020860973].verse-range, [svelte-3020860973] .verse-range {\n\twhite-space: nowrap;\n}\n";
	appendNode( style, document.head );

	addedCss = true;
}

function renderMainFragment ( root, component ) {
	var span = createElement( 'span' );
	setAttribute( span, 'svelte-3020860973', '' );
	span.className = "verse-range";
	
	var last_text = root.readableRange
	var text = createText( last_text );
	appendNode( text, span );

	return {
		mount: function ( target, anchor ) {
			insertNode( span, target, anchor );
		},
		
		update: function ( changed, root ) {
			var __tmp;
		
			if ( ( __tmp = root.readableRange ) !== last_text ) {
				text.data = last_text = __tmp;
			}
		},
		
		teardown: function ( detach ) {
			if ( detach ) {
				detachNode( span );
			}
		}
	};
}

function verserange ( options ) {
	options = options || {};
	this._state = options.data || {};
	applyComputations( this._state, this._state, {}, true );
	
	this._observers = {
		pre: Object.create( null ),
		post: Object.create( null )
	};
	
	this._handlers = Object.create( null );
	
	this._root = options._root;
	this._yield = options._yield;
	
	this._torndown = false;
	if ( !addedCss ) addCss();
	
	this._fragment = renderMainFragment( this._state, this );
	if ( options.target ) this._fragment.mount( options.target, null );
}

verserange.prototype.get = function get( key ) {
 	return key ? this._state[ key ] : this._state;
 };

verserange.prototype.fire = function fire( eventName, data ) {
 	var handlers = eventName in this._handlers && this._handlers[ eventName ].slice();
 	if ( !handlers ) return;
 
 	for ( var i = 0; i < handlers.length; i += 1 ) {
 		handlers[i].call( this, data );
 	}
 };

verserange.prototype.observe = function observe( key, callback, options ) {
 	var group = ( options && options.defer ) ? this._observers.pre : this._observers.post;
 
 	( group[ key ] || ( group[ key ] = [] ) ).push( callback );
 
 	if ( !options || options.init !== false ) {
 		callback.__calling = true;
 		callback.call( this, this._state[ key ] );
 		callback.__calling = false;
 	}
 
 	return {
 		cancel: function () {
 			var index = group[ key ].indexOf( callback );
 			if ( ~index ) group[ key ].splice( index, 1 );
 		}
 	};
 };

verserange.prototype.on = function on( eventName, handler ) {
 	var handlers = this._handlers[ eventName ] || ( this._handlers[ eventName ] = [] );
 	handlers.push( handler );
 
 	return {
 		cancel: function () {
 			var index = handlers.indexOf( handler );
 			if ( ~index ) handlers.splice( index, 1 );
 		}
 	};
 };

verserange.prototype.set = function set( newState ) {
 	this._set( newState );
 	( this._root || this )._flush();
 };

verserange.prototype._flush = function _flush() {
 	if ( !this._renderHooks ) return;
 
 	while ( this._renderHooks.length ) {
 		var hook = this._renderHooks.pop();
 		hook.fn.call( hook.context );
 	}
 };

verserange.prototype._set = function _set ( newState ) {
	var oldState = this._state;
	this._state = Object.assign( {}, oldState, newState );
	applyComputations( this._state, newState, oldState, false )
	
	dispatchObservers( this, this._observers.pre, newState, oldState );
	if ( this._fragment ) this._fragment.update( newState, this._state );
	dispatchObservers( this, this._observers.post, newState, oldState );
};

verserange.prototype.teardown = verserange.prototype.destroy = function destroy ( detach ) {
	this.fire( 'teardown' );

	this._fragment.teardown( detach !== false );
	this._fragment = null;

	this._state = {};
	this._torndown = true;
};

function createElement( name ) {
	return document.createElement( name );
}

function setAttribute( node, attribute, value ) {
	node.setAttribute ( attribute, value );
}

function detachNode( node ) {
	node.parentNode.removeChild( node );
}

function insertNode( node, target, anchor ) {
	target.insertBefore( node, anchor );
}

function createText( data ) {
	return document.createTextNode( data );
}

function appendNode( node, target ) {
	target.appendChild( node );
}

function dispatchObservers( component, group, newState, oldState ) {
	for ( var key in group ) {
		if ( !( key in newState ) ) continue;

		var newValue = newState[ key ];
		var oldValue = oldState[ key ];

		if ( newValue === oldValue && typeof newValue !== 'object' ) continue;

		var callbacks = group[ key ];
		if ( !callbacks ) continue;

		for ( var i = 0; i < callbacks.length; i += 1 ) {
			var callback = callbacks[i];
			if ( callback.__calling ) continue;

			callback.__calling = true;
			callback.call( component, newValue, oldValue );
			callback.__calling = false;
		}
	}
}

module.exports = verserange;

},{}],2:[function(require,module,exports){
'use strict';

var Outline = require('./explanation/outline.html');

new Outline({
	target: document.querySelector('Outline')
});

},{"./explanation/outline.html":3}],3:[function(require,module,exports){
'use strict';

var template = (function () {
const structure = require('lib/structure')
const getColor = require('lib/identifier-color')

return {
	data() {
		return {
			structure
		}
	},
	components: {
		VerseRange: require('component/verse-range.html')
	},
	helpers: {
		sectionLabel(section) {
			return section.prime ? `${section.identifier}′` : section.identifier
		},
		getColor,
		indentLevel(identifier) {
			return {
				A: 0,
				B: 1,
				C: 2,
				D: 3,
				E: 4
			}[identifier]
		}
	}
}

}());

let addedCss = false;
function addCss () {
	var style = createElement( 'style' );
	style.textContent = "\nol[svelte-1119393891], [svelte-1119393891] ol {\n\tlist-style-type: none;\n\tpadding: 0;\n}\n[svelte-1119393891].tiny-color-bar, [svelte-1119393891] .tiny-color-bar {\n\twidth: 1em;\n}\n[svelte-1119393891].tiny-color-bar::before, [svelte-1119393891] .tiny-color-bar::before {\n\tcontent: \"   \";\n}\n";
	appendNode( style, document.head );

	addedCss = true;
}

function renderMainFragment ( root, component ) {
	var ol = createElement( 'ol' );
	setAttribute( ol, 'svelte-1119393891', '' );
	
	var eachBlock_anchor = createComment();
	appendNode( eachBlock_anchor, ol );
	var eachBlock_value = root.structure;
	var eachBlock_iterations = [];
	
	for ( var i = 0; i < eachBlock_value.length; i += 1 ) {
		eachBlock_iterations[i] = renderEachBlock( root, eachBlock_value, eachBlock_value[i], i, component );
		eachBlock_iterations[i].mount( eachBlock_anchor.parentNode, eachBlock_anchor );
	}

	return {
		mount: function ( target, anchor ) {
			insertNode( ol, target, anchor );
		},
		
		update: function ( changed, root ) {
			var __tmp;
		
			var eachBlock_value = root.structure;
			
			for ( var i = 0; i < eachBlock_value.length; i += 1 ) {
				if ( !eachBlock_iterations[i] ) {
					eachBlock_iterations[i] = renderEachBlock( root, eachBlock_value, eachBlock_value[i], i, component );
					eachBlock_iterations[i].mount( eachBlock_anchor.parentNode, eachBlock_anchor );
				} else {
					eachBlock_iterations[i].update( changed, root, eachBlock_value, eachBlock_value[i], i );
				}
			}
			
			teardownEach( eachBlock_iterations, true, eachBlock_value.length );
			
			eachBlock_iterations.length = eachBlock_value.length;
		},
		
		teardown: function ( detach ) {
			teardownEach( eachBlock_iterations, false );
			
			if ( detach ) {
				detachNode( ol );
			}
		}
	};
}

function renderEachBlock ( root, eachBlock_value, section, section__index, component ) {
	var li = createElement( 'li' );
	setAttribute( li, 'svelte-1119393891', '' );
	li.style.cssText = "padding-left: " + ( template.helpers.indentLevel(section.identifier) ) + "em";
	
	var span = createElement( 'span' );
	setAttribute( span, 'svelte-1119393891', '' );
	span.className = "tiny-color-bar";
	span.style.cssText = "background-color: " + ( template.helpers.getColor(section.identifier) );
	
	appendNode( span, li );
	appendNode( createText( "\n\t\t" ), li );
	
	var strong = createElement( 'strong' );
	setAttribute( strong, 'svelte-1119393891', '' );
	
	appendNode( strong, li );
	var last_text1 = template.helpers.sectionLabel(section)
	var text1 = createText( last_text1 );
	appendNode( text1, strong );
	appendNode( createText( ":" ), strong );
	appendNode( createText( " " ), li );
	var last_text4 = section.title
	var text4 = createText( last_text4 );
	appendNode( text4, li );
	appendNode( createText( " " ), li );
	
	var small = createElement( 'small' );
	setAttribute( small, 'svelte-1119393891', '' );
	
	appendNode( small, li );
	
	var verseRange_initialData = {
		range: section.range
	};
	var verseRange = new template.components.VerseRange({
		target: small,
		_root: component._root || component,
		data: verseRange_initialData
	});

	return {
		mount: function ( target, anchor ) {
			insertNode( li, target, anchor );
		},
		
		update: function ( changed, root, eachBlock_value, section, section__index ) {
			var __tmp;
		
			li.style.cssText = "padding-left: " + ( template.helpers.indentLevel(section.identifier) ) + "em";
			
			span.style.cssText = "background-color: " + ( template.helpers.getColor(section.identifier) );
			
			if ( ( __tmp = template.helpers.sectionLabel(section) ) !== last_text1 ) {
				text1.data = last_text1 = __tmp;
			}
			
			if ( ( __tmp = section.title ) !== last_text4 ) {
				text4.data = last_text4 = __tmp;
			}
			
			var verseRange_changes = {};
			
			if ( 'structure' in changed ) verseRange_changes.range = section.range;
			
			if ( Object.keys( verseRange_changes ).length ) verseRange.set( verseRange_changes );
		},
		
		teardown: function ( detach ) {
			verseRange.destroy( false );
			
			if ( detach ) {
				detachNode( li );
			}
		}
	};
}

function outline ( options ) {
	options = options || {};
	this._state = Object.assign( template.data(), options.data );
	
	this._observers = {
		pre: Object.create( null ),
		post: Object.create( null )
	};
	
	this._handlers = Object.create( null );
	
	this._root = options._root;
	this._yield = options._yield;
	
	this._torndown = false;
	if ( !addedCss ) addCss();
	this._renderHooks = [];
	
	this._fragment = renderMainFragment( this._state, this );
	if ( options.target ) this._fragment.mount( options.target, null );
	
	this._flush();
}

outline.prototype.get = function get( key ) {
 	return key ? this._state[ key ] : this._state;
 };

outline.prototype.fire = function fire( eventName, data ) {
 	var handlers = eventName in this._handlers && this._handlers[ eventName ].slice();
 	if ( !handlers ) return;
 
 	for ( var i = 0; i < handlers.length; i += 1 ) {
 		handlers[i].call( this, data );
 	}
 };

outline.prototype.observe = function observe( key, callback, options ) {
 	var group = ( options && options.defer ) ? this._observers.pre : this._observers.post;
 
 	( group[ key ] || ( group[ key ] = [] ) ).push( callback );
 
 	if ( !options || options.init !== false ) {
 		callback.__calling = true;
 		callback.call( this, this._state[ key ] );
 		callback.__calling = false;
 	}
 
 	return {
 		cancel: function () {
 			var index = group[ key ].indexOf( callback );
 			if ( ~index ) group[ key ].splice( index, 1 );
 		}
 	};
 };

outline.prototype.on = function on( eventName, handler ) {
 	var handlers = this._handlers[ eventName ] || ( this._handlers[ eventName ] = [] );
 	handlers.push( handler );
 
 	return {
 		cancel: function () {
 			var index = handlers.indexOf( handler );
 			if ( ~index ) handlers.splice( index, 1 );
 		}
 	};
 };

outline.prototype.set = function set( newState ) {
 	this._set( newState );
 	( this._root || this )._flush();
 };

outline.prototype._flush = function _flush() {
 	if ( !this._renderHooks ) return;
 
 	while ( this._renderHooks.length ) {
 		var hook = this._renderHooks.pop();
 		hook.fn.call( hook.context );
 	}
 };

outline.prototype._set = function _set ( newState ) {
	var oldState = this._state;
	this._state = Object.assign( {}, oldState, newState );
	
	dispatchObservers( this, this._observers.pre, newState, oldState );
	if ( this._fragment ) this._fragment.update( newState, this._state );
	dispatchObservers( this, this._observers.post, newState, oldState );
	
	this._flush();
};

outline.prototype.teardown = outline.prototype.destroy = function destroy ( detach ) {
	this.fire( 'teardown' );

	this._fragment.teardown( detach !== false );
	this._fragment = null;

	this._state = {};
	this._torndown = true;
};

function createElement( name ) {
	return document.createElement( name );
}

function setAttribute( node, attribute, value ) {
	node.setAttribute ( attribute, value );
}

function detachNode( node ) {
	node.parentNode.removeChild( node );
}

function insertNode( node, target, anchor ) {
	target.insertBefore( node, anchor );
}

function createComment() {
	return document.createComment( '' );
}

function appendNode( node, target ) {
	target.appendChild( node );
}

function teardownEach( iterations, detach, start ) {
	for ( var i = ( start || 0 ); i < iterations.length; i += 1 ) {
		iterations[i].teardown( detach );
	}
}

function createText( data ) {
	return document.createTextNode( data );
}

function dispatchObservers( component, group, newState, oldState ) {
	for ( var key in group ) {
		if ( !( key in newState ) ) continue;

		var newValue = newState[ key ];
		var oldValue = oldState[ key ];

		if ( newValue === oldValue && typeof newValue !== 'object' ) continue;

		var callbacks = group[ key ];
		if ( !callbacks ) continue;

		for ( var i = 0; i < callbacks.length; i += 1 ) {
			var callback = callbacks[i];
			if ( callback.__calling ) continue;

			callback.__calling = true;
			callback.call( component, newValue, oldValue );
			callback.__calling = false;
		}
	}
}

module.exports = outline;

},{"component/verse-range.html":1,"lib/identifier-color":4,"lib/structure":5}],4:[function(require,module,exports){
const chiasmColors = {
	a: '#018d5d',
	b: '#ba4460',
	c: '#9ea946',
	d: '#00479f',
	e: '#c26939',
	f: '#8188df',
	g: '#ee6bd4',
	introduction: '#7d7d7d'
}

const minimumMeaningfulIdentifierLength = 3

module.exports = function getChiasmColor(identifier) {
	if (identifier.length < minimumMeaningfulIdentifierLength) {
		const key = identifier[identifier.length - 1].toLowerCase()
		return chiasmColors[key]
	} else {
		return chiasmColors[identifier]
	}
}

},{}],5:[function(require,module,exports){
const identifiers = [ 'a', 'b', 'c', 'd', 'e', 'f', 'g' ]
const VERSE_SECTION_RANGE_MIN = 1
const VERSE_SECTION_RANGE_MAX = 9999

function pipe(input, ...fns) {
	return fns.reduce((lastResult, fn) => fn(lastResult), input)
}

module.exports = pipe([
	{
		identifier: 'A',
		title: 'Prologue',
		description: 'How to Read This Book',
		range: r([ 1, 1 ], [ 1, 11 ])
	}, {
		identifier: 'B',
		title: 'First Septet – Seven Churches',
		description: 'A Look at the Beginnings of the Church that Christ is Building',
		range: r([ 2, 1 ], [ 3, 22 ]),
		introduction: {
			title: 'Introduction to the seven churches – Christ is present with His church',
			range: r([ 1, 12 ], [ 1, 20 ])
		},
		subsections: makeSubsections(
			s('Ephesus', r([ 2, 1 ], [ 2, 7 ])),
			s('Smyrna', r([ 2, 8 ], [ 2, 11 ])),
			s('Pergamos', r([ 2, 12 ], [ 2, 17 ])),
			s('Thyatira', r([ 2, 18 ], [ 2, 29 ])),
			s('Sardis', r([ 3, 1 ], [ 3, 6 ])),
			s('Philadelphia', r([ 3, 7 ], [ 3, 13 ])),
			s('Laodicea', r([ 3, 14 ], [ 3, 22 ]))
		)
	}, {
		identifier: 'C',
		title: 'Second Septet – Seven Seals',
		description: 'Legal Judgments to be Executed Against Church’s Persecutors',
		range: r([ 6, 1 ], [ 8, 1 ]),
		introduction: {
			title: 'Introduction to the seven seals – Christ is on His throne and is governing all of history',
			range: r([ 4, 1 ], [ 5, 14 ])
		},
		subsections: [
			s('Seal 1 - the white horse', r([ 6, 1 ], [ 6, 2 ]), 'a'),
			s('Seal 2 - the red horse', r([ 6, 3 ], [ 6, 4 ]), 'b'),
			s('Seal 3 - the black horse', r([ 6, 5 ], [ 6, 6 ]), 'c'),
			s('Seal 4 - the yellowish-green horse', r([ 6, 7 ], [ 6, 8 ]), 'd'),
			s('Seal 5 - the souls under the altar', r([ 6, 9 ], [ 6, 11 ]), 'e'),
			s('Seal 6 - the earthquake', r([ 6, 12 ], [ 6, 17 ]), 'f'),
			s('Interlude before the 7th seal: the 144,000 of the Jewish remnant and the innumerable multitude', r([ 7, 1 ], [ 7, 17 ])),
			s('Seal 7 - introduces the seven trumpets and seems to comprise all of the third septet', r([ 8, 1 ], [ 8, 1 ]), 'g')
		]
	}, {
		identifier: 'D',
		title: 'Third Septet – Seven Trumpets',
		description: 'The War Against the Church’s Persecutors',
		range: r([ 8, 7 ], [ 11, 19 ]),
		introduction: {
			title: 'Introduction to the seven trumpets – God ordains victory for the church through prayer',
			range: r([ 8, 2 ], [ 8, 6 ])
		},
		subsections: [
			s('Trumpet 1 - The land is set on fire', r([ 8, 7 ], [ 8, 7 ]), 'a'),
			s('Trumpet 2 - The sea is turned to blood', r([ 8, 8 ], [ 8, 9 ]), 'b'),
			s('Trumpet 3 - The rivers and springs become bitter', r([ 8, 10 ], [ 8, 12 ]), 'c'),
			s('Trumpet 4 - The heavenly bodies are dimmed', r([ 8, 12 ], [ 8, 13 ]), 'd'),
			s('Trumpet 5 - Demons released from the pit', r([ 9, 1 ], [ 9, 12 ]), 'e'),
			s('Trumpet 6 - Demons released from Euphrates', r([ 9, 13 ], [ 9, 21 ]), 'f'),
			s('Interlude before 7th trumpet: The closing off of prophecy & the nature of prophecy', r([ 10, 1 ], [ 11, 14 ])),
			s('Trumpet 7 - The seventh trumpet seems to comprise all of the fourth septet', r([ 11, 15 ], [ 11, 19 ]), 'g'),
		]
	}, {
		identifier: 'E',
		title: 'Fourth Septet – Seven Visions',
		description: 'From Total Defeat to Victory',
		range: r([ 13, 1 ], [ 15, 1 ]),
		introduction: {
			title: 'Introduction to the seven visions – The invisible battles are the key to the earthly ones',
			range: r([ 12, 1 ], [ 12, 17 ]),
			subsections: pipe([
				s('The Bride reflecting the glory of her husband', r([ 12, 1 ], [ 12, 1 ]), 'Ea'),
				s('The Child of the woman', r([ 12, 2 ], [ 12, 2 ]), 'Eb'),
				s('The Dragon tries to devour the Child', r([ 12, 3 ], [ 12, 5 ]), 'Ec'),
				s('The woman flees to the wilderness', r([ 12, 6 ], [ 12, 6 ]), 'Ed'),
				s('Dragon war in heaven', r([ 12, 7 ], [ 12, 9 ]), 'Ee'),
				s('Victory of Christ & His people over the dragon', r([ 12, 10 ], [ 12, 11 ]), 'Ef'),
				s('Dragon war on earth', r([ 12, 12 ], [ 12, 13 ]), 'Ee'),
				s('The woman flees to the wilderness', r([ 12, 14 ], [ 12, 14 ]), 'Ed'),
				s(`The Dragon's mouth & the earth swallows the serpents flood`, r([ 12, 15 ], [ 12, 16 ]), 'Ec'),
				s('The rest of the offspring of the woman', r([ 12, 17, 1 ], [ 12, 17, 1 ]), 'Eb'),
				s('The church reflecting the word of Christ', r([ 12, 17, 2 ], [ 12, 17 ]), 'Ea'),
			],
			addPrimeBooleanToChiasmSections,
			giveSectionsChiasmAnchors)
		},
		subsections: [
			s('The beast rising out of the sea', r([ 13, 1 ], [ 13, 10 ])),
			s('The beast rising out of the land', r([ 13, 11 ], [ 13, 18 ])),
			s('The 144,000 virgin (warriors) and the Lamb', r([ 14, 1 ], [ 14, 5 ])),
			s('The seven angels', r([ 14, 6 ], [ 14, 13 ])),
			s('The positive reaping of wheat', r([ 14, 14 ], [ 14, 16 ])),
			s('The negative reaping of grapes', r([ 14, 17 ], [ 14, 20 ])),
			s('The final "sign in heaven" seems to comprise everything in the fifth septet and guarantees the eventual conversion of all nations', r([ 15, 1 ], [ 15, 1 ])),
		]
	}, {
		identifier: 'D',
		title: 'Fifth Septet – Seven Bowls of Wrath Containing the Seven Plagues',
		range: r([ 16, 2 ], [ 16, 17 ]),
		introduction: {
			title: 'Introduction to the seven plagues – angels preparing for warfare; temple filled with God’s glory',
			range: r([ 15, 2 ], [ 16, 1 ])
		},
		subsections: makeSubsections(
			s('Bowl 1 - On the land', r([ 16, 2 ], [ 16, 2 ])),
			s('Bowl 2 - On the sea', r([ 16, 3 ], [ 16, 3 ])),
			s('Bowl 3 - On the waters', r([ 16, 4 ], [ 16, 7 ])),
			s('Bowl 4 - On the sun', r([ 16, 8 ], [ 16, 9 ])),
			s('Bowl 5 - On the throne of the beast', r([ 16, 10 ], [ 16, 11 ])),
			s('Bowl 6 - On the Euphrates', r([ 16, 12 ], [ 16, 16 ])),
			s('Bowl 7 - On the air – note that this 7th bowl seems to introduce all of the next septet', r([ 16, 17 ], [ 16, 17 ]))
		)
	}, {
		identifier: 'C',
		title: 'Sixth Septet – Seven Condemnations of Babylon',
		range: r([ 17, 1 ], [ 19, 10 ]),
		introduction: {
			title: 'Introduction to the seven condemnations – Even with Roman support, Jerusalem is no match for Christ',
			range: r([ 16, 18 ], [ 16, 21 ])
		},
		subsections: makeSubsections(
			s('Blasphemy of the Harlot', r([ 17, 1 ], [ 17, 6 ])),
			s('Harlots Pagan Alliance with Rome', r([ 17, 7 ], [ 17, 18 ])),
			s('Spiritual fornications', r([ 18, 1 ], [ 18, 8 ])),
			s('Ungodly statist/commercial alliance', r([ 18, 9 ], [ 18, 20 ])),
			s('The finality of Babylon’s fall', r([ 18, 21 ], [ 18, 24 ])),
			s('All heaven agreeing with her judgment', r([ 19, 1 ], [ 19, 4 ])),
			s('The death of the harlot is followed by the marriage of the Lamb', r([ 19, 5 ], [ 19, 10 ]))
		)
	}, {
		identifier: 'B',
		title: 'Seventh Septet – Seven visions of the victory of Christ’s Kingdom – The Church Militant & Triumphant',
		range: r([ 20, 1 ], [ 22, 17 ]),
		introduction: {
			title: 'Introduction to the seven New Covenant visions – Jesus proves that He is King of kings and Lord of lords',
			range: r([ 19, 11 ], [ 19, 21 ])
		},
		subsections: makeSubsections(
			s('Satan’s power bound', r([ 20, 1 ], [ 20, 3 ])),
			s('Victory over death guaranteed – reign in life and in death', r([ 20, 4 ], [ 20, 6 ])),
			s('Final judgment', r([ 20, 7 ], [ 20, 15 ])),
			s('All things made new', r([ 21, 1 ], [ 21, 8 ])),
			s('The New Jerusalem as the spotless bride', r([ 21, 9 ], [ 21, 27 ])),
			s('The river of life', r([ 22, 1 ], [ 22, 5 ])),
			s('Reiteration that Christ will come soon to finish the old and to continue the renewal of all things', r([ 22, 6 ], [ 22, 17 ]))
		)
	}, {
		identifier: 'A',
		title: 'Epilogue: How to Read This Book',
		range: r([ 22, 18 ], [ 22, 21 ])
	}
],
addPrimeBooleanToChiasmSections,
giveSectionsChiasmAnchors,
giveSubsectionsAnchors,
giveIntroductionsAnchors)

function makeSubsections(...subsections) {
	return subsections.map(({ title, range }, i) => {
		const identifier = identifiers[i]
		return {
			title,
			range,
			identifier
		}
	})
}

function s(title, range, identifier) {
	return { title, range, identifier }
}

function r(rangeStart, randeEnd) {
	return [
		guaranteeRangeSection(rangeStart, VERSE_SECTION_RANGE_MIN),
		guaranteeRangeSection(randeEnd, VERSE_SECTION_RANGE_MAX),
	]
}

function guaranteeRangeSection(range, defaultSection) {
	if (range.length === 3) {
		return range
	} else {
		return [ ...range, defaultSection ]
	}
}

function addPrimeBooleanToChiasmSections(sections) {
	const pivotIndex = Math.floor(sections.length / 2)

	return sections.map((section, index) => Object.assign({ prime: index > pivotIndex }, section))
}

function giveSectionsChiasmAnchors(sections) {
	const pivotIndex = Math.floor(sections.length / 2)

	return sections.map((section, index) => {
		if (index === pivotIndex) {
			return section
		}

		const primeAnchor = `${section.identifier}prime`

		return Object.assign({
			anchor: index < pivotIndex ? section.identifier : primeAnchor,
			siblingAnchor: index < pivotIndex ? primeAnchor : section.identifier,
			siblingIsDown: index < pivotIndex
		}, section)
	})
}

function giveSubsectionsAnchors(sections) {
	return sections.map(section => {
		if (!section.subsections) {
			return section
		}

		return Object.assign({}, section, {
			subsections: section.subsections.map(subsection => {
				if (!subsection.identifier) {
					return subsection
				}

				return Object.assign({
					anchor: `${section.anchor}-${subsection.identifier}`,
					siblingAnchor: `${section.siblingAnchor}-${subsection.identifier}`,
					siblingIsDown: section.siblingIsDown
				}, subsection)
			})
		})
	})
}

function giveIntroductionsAnchors(sections) {
	return sections.map(section => {
		if (!section.introduction) {
			return section
		}

		return Object.assign({}, section, {
			introduction: Object.assign({
				anchor: `${section.anchor}-introduction`,
				siblingAnchor: `${section.siblingAnchor}-introduction`,
				siblingIsDown: section.siblingIsDown
			}, section.introduction)
		})
	})
}

},{}]},{},[2]);
