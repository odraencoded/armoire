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
				The name used for saving and loading styles.
				
				This is the key used in localStorage and the name part of the
				name/value pair when saving to cookies.
				
				@type {boolean}
				@defaultvalue
			**/
			saveName: "armoire",
			
			/**
				Whether to use local storage instead of cookies when available.
				
				@type {boolean}
				@defaultvalue
			**/
			useLocalStorage: true,
			
			/**
				The value on the right of "path=" when  saving to cookies.
				
				@type {string}
				@defaultvalue
			**/
			cookiePath: null,
			
			/**
				The value on the right of "expires=" when  saving to cookies.
				
				@type {string}
				@defaultvalue
			**/
			cookieExpires: null,
			
			/**
				When a link with this class is clicked on, the style element which
				it links to is enabled.
				
				@type {string}
				@defaultvalue
			**/
			setStyleClass: 'set-style',
			
			/**
				When {@link Armoire.setupDefaultStylePreferences} is called,
				style elements with this class are enabled, disabling all other styles
				in their group.
				
				@type {string}
				@defaultvalue
			**/
			defaultStyleClass: 'default-style',
			
			
			/**
				When {@link Armoire.setupDefaultStylePreferences} is called,
				style elements with this class are disabled.
				
				@type {string}
				@defaultvalue
			**/
			disabledStyleClass: 'disabled-style',
			
			/**
				The group identifier used for ref="alternate stylesheet" links (aka
				standard alternate stylesheets).
				
				Change this member to avoid conflict with non-standard style groups
				that use the 'standard-styles' class for some reason.
				
				@type {string}
				@defaultvalue
			**/
			standardGroupId: 'standard-styles',
			
			// Exporting utility functions for testing
			hasClass: hasClass,
			removeClass: removeClass,
			findAncestor: findAncestor,
			wrapMethod: wrapMethod,
			isStylesheetLink: isStylesheetLink,
		}
		
		/**
			Armoire's click event handler.
			
			First it filters out middle/right click events and alt/shift/ctrl clicks.
			Then it searches from the clicked element up for an element that passes
			the {@link Armoire.clickElementFilter}. If an element is found,
			{@link Armoire.handleValidElementClick} is called with that element.
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
			
			@param {HTMLElement} el - The element that was clicked.
		**/
		library.handleValidElementClick = function(el) {
			var styleId = this.getClickElementTargetId(el);
			if(!styleId) return;
			
			var styleEl = document.getElementById(styleId);
			if(!styleEl) return;
			
			if(!this.isValidStyleElement(styleEl)) return;
			
			styleGroup = this.getGroupFromMember(styleEl);
			this.setActiveStyle(styleGroup, styleEl);
			this.saveStyles();
		}
		
		/**
			Check whether an element's click events should be handled by
			{@link Armoire.handleValidElementClick}.
			
			By default, tests whether an element is an anchor with the class
			{@link Armoire.setStyleClass}.
			
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
			
			@param {HTMLElement} el - Element to extract the id from
			@returns {String} The id of a style element or null if none is found
		**/
		library.getClickElementTargetId = function(el) {
			var href = el.getAttribute('href');
			if(href !== null && href[0] === "#" && href.length > "#".length) {
				return href.substr("#".length);
			} else {
				return null;
			}
		}
		
		/**
			Tests whether an element is a valid style element.
			By default, this means that el is either a LINK element with
			a stylesheet REL or that el is a STYLE element.
			
			@param {HTMLElement} el - The element to test
			@returns {Boolean} Whether el is a valid style element
		**/
		library.isValidStyleElement = function(el) {
			if(isStylesheetLink(el)) {
				return true;
			} else if(el.tagName.toLowerCase() === 'style') {
				// <style> are valid style elements.
				return true;
			} else {
				// Everything else is not a valid style element.
				return false;
			}
		}
		
		/* Style groups
			
			Armoire uses the concept of style groups to associate style preferences
			and stylesheets. A style group is an array of one or more stylesheets.
			
			Each group has a single active style, which is the first non-disabled
			stylesheet in the group. Ideally there should be no more than one
			stylesheet enabled at a time in a group and Armoire isn't designed to
			handle that.
			
			Null is used as the active style to mean all styles in the group are
			turned off. The planned application of this is to allow groups with a 
			single stylesheet that can be toggled on and off.
			
			Armoire recognizes two types of style groups in HTML code. First is the
			HTML standard for alternate stylesheets. <link> elements with a
			rel="stylesheet" attribute and a title attribute are considered to be a
			group. Second type of group is regonized by <link> and <style> elements
			with a class attribute. The first class of the element becomes the
			group identifier. e.g. class="a b", "a" will be the group and "b" won't
			be considered.
			
			Note: Armoire doesn't have a way to indicate that a stylesheet shouldn't
			be handled by the library. <style> and <link> elements that have
			classes will be considered as members of style groups during
			Armoire.saveStyles which means they might get disabled during
			Armoire.loadStyles since only one stylesheet is enabled per group during
			loading even if multiple were enabled during saving.
			
			To make up for the fact that browsers automatically disable
			rel="alternate stylesheet" links, stylesheets with the
			Armoire.defaultStyleClass class become the active style of their group
			on start up (disabling all others in the group) and stylesheets with the
			Armoire.disabledStyleClass class are automatically disabled.
		*/
		
		/**
			Gets whether a style element is enabled. By default this is the opposite
			of the disabled property.
			
			@param {HTMLElement} styleEl - The style to disable.
		**/
		library.isStyleEnabled = function(styleEl) {
			return !styleEl.disabled;
		}
		
		/**
			Turns a style on and off. By default this sets the disabled property to
			the opposite of enabled.
			
			@param {HTMLElement} styleEl - The style to disable.
			@param {boolean} enabled - Whether the style is enabled.
		**/
		library.enableStyle = function(styleEl, enabled) {
			styleEl.disabled = !enabled;
		}
		
		/**
			Gets the group id of the style group a style element belongs to.
			
			If styleEl has classes its first class is returned.
			(e.g. class="a b" then "a" is returned).
			
			If styleEl doesn't have a class but is a stylesheet link element with a
			title, then its assumed then to be following the standard alternate
			stylesheets spec and {@link Armoire.getStandardGroup} will be
			returned.
			
			Undefined is returned if the element doesn't match any of the above
			conditions. This method doesn't check if styleEl
			{@link Armoire.isValidStyleElement}.
			
			@param {HTMLElement} styleEl - A style element.
			@returns {string} The id of the group styleEL belongs to.
		**/
		library.getGroupId = function(styleEl) {
			// If the element has classes, return the first class of the element
			var className = styleEl.className;
			if(className !== "") {
				var firstClassName = className.split(' ')[0];
				return firstClassName;
			}
			
			// If the element is a stylesheet link with a title, return
			// standardGroupId
			if(isStylesheetLink(styleEl)) {
				var titleAttr = styleEl.getAttribute('title');
				if(titleAttr) {
					return this.standardGroupId;
				}
				
			}
			
			// This isn't even a valid style element!
			return undefined;
		}
		
		/**
			Convenience method to get a style group based on its id.
			
			If groupId is equal to {@link Armoire.standardGroupId}, then
			{@link Armoire.getStandardGroup} is called, otherwise
			{@link Armoire.getGroupFromClass} is called with groupId as the
			class name.
			
			@param {string} groupId - The id of the group.
			@returns {HTMLElement[]} A style group with matching id.
		**/
		library.getGroupFromId = function(groupId) {
			if(groupId === this.standardGroupId) {
				return this.getStandardGroup();
			} else {
				return this.getGroupFromClass(groupId);
			}
		}
		
		/**
			Gets a style group of elements grouped by a class.
			
			@returns {HTMLElement[]} - An array of style elements.
		**/
		library.getGroupFromClass = function(className) {
			var result = [];
			
			var allElements = document.getElementsByClassName(className);
			for(var i = 0; i < allElements.length; i++) {
				var iEl = allElements[i];
				if(this.isValidStyleElement(iEl)) {
					result.push(iEl);
				}
			}
			
			return result;
		}
		
		/**
			Gets the style group of link elements with rel="alternate stylesheet"
			and title attributes as specified by the HTML spec.
			
			@returns {HTMLElement[]} - An array of style elements.
		**/
		library.getStandardGroup = function() {
			var result = [];
			
			var allLinks = document.getElementsByTagName('link');
			for(var i = 0; i < allLinks.length; i++) {
				var iEl = allLinks[i];
				
				// Skip non-stylesheets
				var rel = ' ' + iEl.getAttribute('rel') + ' ';
				if(rel.indexOf('stylesheet') === -1) continue;
				
				// Skip stylesheet links without titles
				titleAttr = iEl.getAttribute('title');
				if(!titleAttr) continue;
				
				result.push(iEl);
			}
			
			return result;
		}
		
		/**
			Convenience method to get the group of style elements one style element
			is part of.
			
			This essentially calls {@link Armoire.getGroupFromId} after getting
			the group id with {@link Armoire.getGroupId}. If the group
			id is undefined, an array containing only styleEl is returned.
			
			@param {HTMLElement} styleEl - A style element part of the group
			@returns {HTMLElement[]} An array of style elements including styleEl.
		**/
		library.getGroupFromMember = function(styleEl) {
			var groupId = this.getGroupId(styleEl);
			
			if(groupId === undefined) {
				// Return the element by itself
				return [styleEl];
			} else {
				return this.getGroupFromId(groupId);
			}
		}
		
		/**
			Gets the active style of a style group. This is the first non-disabled
			style in the group or null if all are disabled.
			
			@param {HTMLElement[]} styleGroup - A group of style elements
			@returns {boolean} The active style of the group.
		**/
		library.getActiveStyle = function(styleGroup) {
			for(var i = 0; i < styleGroup.length; i++) {
				var iEl = styleGroup[i];
				if(this.isStyleEnabled(iEl)) {
					return iEl;
				}
			}
			
			return null;
		}
		
		/**
			Sets the active style of a style group. This will disable all styles
			in the group except for styleEl. Null can be passed to simply disable
			all styles.
			
			@see Armoire.setPageStyle for a more convenient version that takes
			string ids instead of elements for the parameters.
			
			@param {HTMLElement[]} styleGroup - A group of style elements
			@param {HTMLElement} styleEl - The active style element or null
		**/
		library.setActiveStyle = function(styleGroup, styleEl) {
			for(var i = 0; i < styleGroup.length; i++) {
				var iEl = styleGroup[i];
				this.enableStyle(iEl, false);
			}
			
			if(styleEl) {
				this.enableStyle(styleEl, true);
			}
		}
		
		/**
			Convenience function to set the active style of a style group from their
			respective ids.
			
			@param {string} groupId - The id of the style group
			@param {string} activeStyleId - The id of the active style
		**/
		library.setPageStyle = function(groupId, activeStyleId) {
			var group = this.getGroupFromId(groupId);
			// This group is empty, therefore it can't possibly contain a style with
			// the same id as activeStyleId.
			if(group.length === 0) return;
			
			if(activeStyleId === null) {
				this.setActiveStyle(group, null);
			} else {
				// If activeStyleId is not null then we have to check if that id
				// exists within that group and then call setActiveStyle.
				// This roundabout way makes sure that an styles with the same id in
				// different pages that are part of different groups don't get mixed
				// even though that is a terrible idea to begin with.
				var activeStyle = null;
				for(var i = 0; i < group.length; i++) {
					if(group[i].id === activeStyleId) {
						activeStyle = group[i];
						break;
					}
				}
				
				// This is done instead of directly setting the .disabled property
				// to allow setActiveStyle to be overriden for whatever reason.
				if(activeStyle !== null) {
					this.setActiveStyle(group, activeStyle);
				}
			}
		}
		
		/**
			Convenience method to call {@link Armoire.setPageStyle} for multiple
			style groups at once using a dictionary of group id/active style id
			pairs. E.g. { groupA: 'redStyle' }
			
			@see Armoire.setPageStyle for setting a single page style.
			@see Armoire.getPageStyles for the reverse process.
			
			@param {object} styleData - A dictionary containing styles to set.
		**/
		library.setPageStyles = function(styleData) {
			for(var groupId in styleData) {
				var activeStyleId = styleData[groupId];
				this.setPageStyle(groupId, activeStyleId);
			}
		}
		
		/**
			Convenience method to get the active style id of a group by its group id.
			
			@param {string} groupId - The id of the group
			@returns {string} The id of its active style
		**/
		library.getPageStyle = function(groupId) {
			var group = this.getGroupFromId(groupId);
			var activeStyle = this.getActiveStyle(group);
			
			if(activeStyle) {
				return activeStyle.id;
			} else {
				return null;
			}
		}
		
		/**
			Gathers the style information of the page to construct a dictionary where
			the keys are style group identifiers and the values are the groups'
			active styles' ids.
			
			@returns {object} A dictionary that can be used in
			{Armoire.setPageStyles}
		**/
		library.getPageStyles = function() {
			var result = {};
			
			// Get all group ids first then query each group's active style.
			// This roundabout way ensures that intermixed style/link elements
			// Have their order preserved when getting the first enabled style
			// of the group.
			var styleEls = document.getElementsByTagName('style');
			for(var i = 0; i < styleEls.length; i++) {
				var groupId = this.getGroupId(styleEls[i]);
				if(groupId !== undefined) {
					result[groupId] = null;
				}
			}
			
			var linkEls = document.getElementsByTagName('link');
			for(var i = 0; i < linkEls.length; i++) {
				var iEl = linkEls[i];
				if(isStylesheetLink(iEl)) {
					var groupId = this.getGroupId(iEl);
					if(groupId !== undefined) {
						result[groupId] = null;
					}
				}
			}
			
			for(var groupId in result) {
				var group = this.getGroupFromId(groupId);
				var activeStyle = this.getActiveStyle(group);
				if(activeStyle !== null) {
					result[groupId] = activeStyle.id;
				}
			}
			
			return result;
		}
		
		/* Saving & loading
			
			Armoire is designed to allow persistence of style preferences for the
			user but also flexibility for designers. Its save format save format is a
			mere group id/active style's id dictionary converted to JSON for storage.
			
			Some notes about Armoire's style preferences storage:
			
			1. As long as the group id and the element id attribute match the stored
			values, different URLs can be used for the same style in different pages.
			e.g. id="red-style" could be "red-a.css" in one page and "red-b.css" in
			another page.
			
			2. A group that exists in one page but doesn't exist in another page will
			persist in storage. You can have a style group that only exists in one
			area of your website and it will not be erased when the preferences are
			saved in another area where that style group doesn't exist.
			
			3. If the group is found but none of its stylesheets match the stored
			style id, nothing is done and (presumably) the group's default style
			will be active instead (it'll later overwrite missing style id, maybe)
			
			Armoire will preferably save to localStorage, under the key
			Armoire.saveName unless Armoire.useLocalStorage is set to false.
		*/
		
		/**
			Saves the page current style so it can be loaded later with
			{@link Armoire.loadStyles}.
			
			Armoire saves style preferences as a JSON dictionary. The keys are group
			style identifiers (the first class by default, with exception of
			standard alternate stylesheets that use
			{@link Armoire.standardGroupId} as the key instead) and the values
			are the id attribute of the first non-disabled stylesheet in the group.
			If all stylesheets in the group are disabled null is used as the value
			instead.
			
			Before saving, this method will merge previously saved preferences so
			that style groups not found in the current page persist in storage.
		**/
		library.saveStyles = function() {
			var storedDataString = this.loadString(this.saveName);
			var storedStylesObject = JSON.parse(storedDataString);
			
			var currentStylesObject = this.getPageStyles();
			
			// Copy keys found in storedStylesObject but not found in
			// currentStylesObject, this is like overwriting storedStylesObject with
			// currentStylesObject but only the matching keys.
			for(var key in storedStylesObject) {
				var storedValue = storedStylesObject[key]
				if(!(key in currentStylesObject)) {
					currentStylesObject[key] = storedValue;
				}
			}
			
			var currentDataString = JSON.stringify(currentStylesObject);
			this.saveString(this.saveName, currentDataString);
		}
		
		/**
			Loads the page style previously saved with {@link Armoire.saveStyles}.
			
			@see Armoire.saveStyles for details.
		**/
		library.loadStyles = function() {
			var dataString = this.loadString(this.saveName);
			var styleData = JSON.parse(dataString);
			this.setPageStyles(styleData);
		}
		
		/**
			Saves a string to browser storage so it can be retrieved later with
			{@link Armoire.loadString}.
			
			@param {string} keyName - An identifier
			@param {string} dataString - The data to save
		**/
		library.saveString = function(keyName, dataString) {
			if(this.useLocalStorage && typeof window.localStorage !== 'undefined') {
				// Save the string into localStorage
				window.localStorage[keyName] = dataString;
			} else {
				// Save the string into cookies
				cookieString = keyName + "=" + encodeURIComponent(dataString);
				
				if(this.cookiePath) {
					cookieString += '; path=' + cookiePath;
				}
				
				if(this.cookieExpires) {
					cookieString += '; expires=' + this.cookieExpires;
				}
				
				document.cookie = cookieString;
			}
		}
		
		/**
			Loads a string from browser storage that was previously saved with
			{@link Armoire.saveString}.
			
			@param {string} keyName - The identifier used in
			{@link Armoire.saveString}
			@returns {string} The data that was previously saved
		**/
		library.loadString = function(keyName) {
			var dataString;
			
			if(this.useLocalStorage && typeof window.localStorage !== 'undefined') {
				// Get string from localStorage
				dataString = window.localStorage[keyName];
			} else {
				// Get string from cookie
				var cookies = document.cookie.split('; ');
				for(var i = 0; i < cookies.length; i++) {
					var cookie = cookies[i];
					var parts = cookie.split('=');
					if(parts[0] === keyName) {
						dataString = decodeURIComponent(parts[1]);
						break;
					}
				}
			}
			
			if(typeof dataString === 'undefined') {
				dataString = null;
			}
			
			return dataString;
		}
		
		// Utility
		
		/**
			Tests whether an element has a given class.
			
			@param {HTMLElement} el - An element
			@param {String} cls - A CSS/HTML class
			@returns {Boolean} Whether el has class cls
		**/
		function hasClass(el, cls) {
			return (" " + el.className + " ").indexOf(" " + cls + " ") !== -1;
		}
		
		/**
			Removes a class from an element.
			
			@param {HTMLElement} el - An element
			@param {String} cls - A CSS/HTML class
		**/
		function removeClass(el, cls) {
			var regex = new RegExp('(^|\\s)' + cls + '(\\s|$)');
			el.className = el.className.replace(regex, ' ');
		}
		
		/**
			Searches for an ancestor of an element that matches a given criteria.
			
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
			Checks whether el is a link element with rel="stylesheet"
			
			@param {HTMLElement} el - The element to check
			@returns {boolean} Whether el is a stylesheet link.
		**/
		function isStylesheetLink(el) {
			// This isn't even a link!
			if(el.tagName.toLowerCase() !== 'link') return false;
			
			var relAttr = ' ' + el.getAttribute('rel') + ' ';
			return (relAttr.indexOf(' stylesheet ') !== -1);
		}
		
		/**
			Initializes Armoire. This is called automatically is sets up event
			handlers and other stuff.
			
		**/
		library.initialize = function() {
			document.addEventListener(
				'click',
				wrapMethod(this, this.clickEventHandler)
			);
			
			this.setupDefaultStylePreferences();
			this.loadStyles();
		}
		
		/**
			Enables style elements with the {@link Armoire.defaultStyleClass} class
			and disables the ones with the {@link Armoire.disabledStyleClass} class,
			also removes those classes from the elements.
			
		**/
		library.setupDefaultStylePreferences = function() {
			var styleEls;
			styleEls = document.getElementsByClassName(this.defaultStyleClass);
			for(var i = 0; i < styleEls.length; i++) {
				var iEl = styleEls[i];
				if(this.isValidStyleElement(iEl)) {
					removeClass(iEl, this.defaultStyleClass);
					var styleGroup = this.getGroupFromMember(iEl);
					this.setActiveStyle(styleGroup, iEl);
				}
			}
			
			styleEls = document.getElementsByClassName(this.disabledStyleClass);
			for(var i = 0; i < styleEls.length; i++) {
				var iEl = styleEls[i];
				if(this.isValidStyleElement(iEl)) {
					removeClass(iEl, this.disabledStyleClass);
					this.enableStyle(iEl, false);
				}
			}
		}
		
		Armoire = library;
		Armoire.initialize();
	})();
}
