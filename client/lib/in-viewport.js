var contains = function() {
	if (!global.document) {
		return true;
	}
	return global.document.documentElement.compareDocumentPosition ?
		function (a, b) {
			return !!(a.compareDocumentPosition(b) & 16);
		} :
		global.document.documentElement.contains ?
			function (a, b) {
				return a !== b && ( a.contains ? a.contains(b) : false );
			} :
			function (a, b) {
				while (b = b.parentNode) {
					if (b === a) {
						return true;
					}
				}
				return false;
			};
}

module.exports = function isVisible(elt, offset = 0) {
	if (!contains(global.document.documentElement, elt)) {
		return false;
	}

	// Check if the element is visible
	// https://github.com/jquery/jquery/blob/740e190223d19a114d5373758127285d14d6b71e/src/css/hiddenVisibleSelectors.js
	// if (!elt.offsetWidth || !elt.offsetHeight) {
	// 	return false;
	// }

	var eltRect = elt.getBoundingClientRect();
	var viewport = {
		top: -offset,
		left: -offset,
		right: global.document.documentElement.clientWidth + offset,
		bottom: global.document.documentElement.clientHeight + offset
	};

	// The element must overlap with the visible part of the viewport
	var visible =
		(
			eltRect.right >= viewport.left &&
			eltRect.left <= viewport.right &&
			eltRect.bottom >= viewport.top &&
			eltRect.top <= viewport.bottom
		);

	return visible;
}
