if(typeof Armoire === "undefined"){
	(function() {
		/**
			Where all the library functions are.
			
			@namespace
			@alias Armoire
			@global
		**/
		var library = {
			/**
				When a link with this class is clicked on, the style element which
				it links to is enabled.
				
				@type {String}
				@defaultvalue
			**/
			setStyleClass: 'set-style',
			
			// Exporting utility functions for testing
			hasClass: hasClass,
			findAncestor: findAncestor,
			wrapMethod: wrapMethod,
		}
		
		/**
			Armoire's click event handler.
			
			First it filters out middle/right click events and alt/shift/ctrl clicks.
			Then it searches from the clicked element up for an element that passes
			the {@link Armoire.clickElementFilter}. If an element is found,
			{@link Armoire.handleValidElementClick} is called with that element.
			
			@method
		**/
		library.clickEventHandler = function(event) {
			var targetEl = event.target;
			
			// Check if the click was a simple left click
			var simpleLeftClick = true;
			simpleLeftClick &= event.button === 0;
			simpleLeftClick &= !(event.altKey || event.shiftKey || event.ctrlKey);
			
			// Skip, middle click or control click was used instead
			if(!simpleLeftClick) return;
			
			// Get the link element which was clicked
			var linkEl;
			if(this.clickElementFilter(targetEl)) {
				linkEl = targetEl;
			} else {
				linkEl = findAncestor(
					targetEl,
					wrapMethod(this, this.clickElementFilter)
				)
			}
			
			// Skip, a valid element wasn't clicked
			if(!linkEl) return;
			
			// Prevent click default behavior
			event.preventDefault();
			
			this.handleValidElementClick(linkEl, event)
		}
		
		/**
			Handles a click on a valid element.
			By default, this will turn on the stylesheet linked by an anchor element.
			
			@method
			@param {HTMLElement} el - The element that was clicked.
		**/
		library.handleValidElementClick = function(el) {
			var styleId = this.getClickElementTargetId(el);
			if(!styleId) return;
			
			var styleEl = document.getElementById(styleId);
			if(!styleEl) return;
			
			if(!this.isValidStyleElement(styleEl)) return;
			
			styleGroup = this.getStyleGroup(styleEl);
			this.setGroupStyle(styleGroup, styleEl);
		}
		
		/**
			Tests whether an element is a valid style element.
			By default, this means that el is either a LINK element with
			a stylesheet REL or that el is a STYLE element.
			
			@method
			@param {HTMLElement} el - The element to test
			@returns {Boolean} Whether el is a valid style element
		**/
		library.isValidStyleElement = function(el) {
			var tagName = el.tagName.toLowerCase();
			
			if(tagName === 'link') {
				// <link rel="stylesheet"> are valid style elements.
				var rel = ' ' + el.getAttribute('rel') + ' ';
				return (rel.indexOf(' stylesheet ') !== -1);
			} else if(tagName === 'style') {
				// <style> are valid style elements.
				return true;
			} else {
				// By default, everything else is not a valid style element.
				return false;
			}
		}
		
		/**
			Gets the group of style elements one style element is part of.
			
			@method
			@param {HTMLElement} styleEl - A style element part of the group
			@returns {HTMLElement[]} An array of style elements including styleEl.
		**/
		library.getStyleGroup = function(styleEl) {
			// First check whether the element has a class
			var className = styleEl.className;
			if(className !== "") {
				var allElements = document.getElementsByClassName(className);
				var filteredElements = [];
				for(var i = 0; i < allElements.length; i++) {
					var iEl = allElements[i];
					if(this.isValidStyleElement(iEl)) {
						filteredElements.push(iEl);
					}
				}
				
				return filteredElements;
			}
			
			// If the element is a stylesheet link return the group of alternate 
			// stylesheets (the ones with titles)
			var tagName = styleEl.tagName.toLowerCase();
			var titleAttr = styleEl.getAttribute('title');
			if(tagName === 'link' && titleAttr) {
				var allLinks = document.getElementsByTagName('link');
				var filteredLinks = [];
				for(var i = 0; i < allLinks.length; i++) {
					var iEl = allLinks[i];
					
					// Skip non-stylesheets
					var rel = ' ' + iEl.getAttribute('rel') + ' ';
					if(rel.indexOf('stylesheet') === -1) continue;
					
					// Skip stylesheet links without titles
					titleAttr = iEl.getAttribute('title');
					if(!titleAttr) continue;
					
					filteredLinks.push(iEl);
				}
				
				return filteredLinks;
			}
			
			// Return the element by itself
			return [styleEl];
		}
		
		
		/**
			Sets the active style of a style group.
			
			@method
			@param {HTMLElement[]} styleGroup - A group of style elements
			@param {HTMLElement} styleEl - The active style
		**/
		library.setGroupStyle = function(styleGroup, styleEl) {
			for(var i = 0; i < styleGroup.length; i++) {
				var iEl = styleGroup[i];
				var isActiveStyle = iEl === styleEl;
				iEl.disabled = !isActiveStyle;
			}
		}
		
		/**
			Check whether an element's click events should be handled by
			{@link Armoire.handleValidElementClick}.
			
			By default, tests whether an element is an anchor with the class
			{@link Armoire.setStyleClass}.
			
			@method
			@param {HTMLElement} el - An element to test.
			@returns {Boolean} Whether the element should be handled by
			{Armoire.handleValidElementClick}.
		**/
		library.clickElementFilter = function(el) {
			return el.tagName.toLowerCase() === "a" &&
			       hasClass(el, this.setStyleClass);
		}
		
		/**
			Returns the id of the style element that a clicked element is linked to.
			
			By default, returns the fragment identifier (href="#fragment-identifier")
			of an anchor element that was clicked on.
			
			@method
			@param {HTMLElement} el - Element to extract the id from
			@returns {String} The id of a style element or null if none is found.
		**/
		library.getClickElementTargetId = function(el) {
			var href = el.getAttribute('href');
			if(href[0] === "#" && href.length > "#".length) {
				return href.substr("#".length);
			} else {
				return null;
			}
		}
		
		/**
			Tests whether an element has a given class.
			
			@method
			@param {HTMLElement} el - An element
			@param {String} cls - A CSS/HTML class
			@returns {Boolean} Whether el has class cls
		**/
		function hasClass(el, cls) {
			return (" " + el.className + " ").indexOf(" " + cls + " ") !== -1;
		}
		
		/**
			Searches for an ancestor of an element that matches a given criteria.
			
			@method
			@param {HTMLElement} el - The search starts with this element's parent
			@param {Function} filter - A callback that returns true when a valid
			ancestor is found.
			@param {HTMLElement} filter.el - The element for the filter to test
			against.
			@returns {HTMLElement} The first ancestor coming from el to pass the
			filter or null if none is found.
		**/
		function findAncestor(el, filter) {
			if(el) {
				el = el.parentElement;
				while(el) {
					if(filter(el)) return el;
					
					el = el.parentElement;
				}
			}
			return null;
		}
		
		/**
			Wraps a "this" object into a closure so it can be passed as a callback.
			
			@method
			@param {Object} thisObj - An object to be "this"
			@param {Function} method - A function to be called with thisObj
			@returns {Function} A closure that calls "apply" on method with thisObj
			plus any arguments.
		**/
		function wrapMethod(thisObj, method) {
			return function() {
				return method.apply(thisObj, arguments);
			};
		}
		
		/**
			Initializes Armoire. This is called automatically is sets up event
			handlers and other stuff.
			
			@method
		**/
		library.initialize = function() {
			var that = this;
			document.addEventListener(
				'click',
				wrapMethod(this, this.clickEventHandler)
			);
		}
		
		Armoire = library;
		Armoire.initialize();
	})();
}
