// HTML added to document.head for testing
var testHeadHtml = (
	// Not in groups
	'<style id="lone-style"></style>' +
	'<link id="lone-link" rel="stylesheet" href="tests.css">' +
	
	// Not stylesheets
	'<link id="icon-link" rel="icon" title="Icon" class="group-a group-b group-c">' +
	'<meta id="meta-element" class="group-a group-b group-c">' +
	
	// Group of standard links
	// Note: On Firefox links to inexistent stylesheets can NOT be disabled and
	// their .disabled property always returns false.
	'<link id="standard-link" rel="stylesheet" title="Default" href="tests.css">' +
	'<link id="alternate-link" rel="alternate stylesheet" title="Alternate" href="tests.css">' +
	
	// Group of styles
	'<style id="style-a-1" class="group-a 1"></style>' + 
	'<style id="style-a-2" class="group-a 2"></style>' +
	
	// Mixed group
	'<style id="style-b-1" class="group-b 1"></style>' + 
	'<link id="link-b-2" class="group-b 2" rel="stylesheet" href="tests.css">' + 
	
	// Group of two non-standard links
	'<link id="link-c-1" class="group-c 1" rel="stylesheet" href="tests.css">' + 
	'<link id="link-c-2" class="group-c 2" rel="stylesheet" href="tests.css">'
);

QUnit.test("Export test", function( assert ) {
	assert.expect(1)
	assert.equal(typeof Armoire, 'object', 'Armoire is defined');
});

QUnit.module("Utilities");

QUnit.test('hasClass', function(assert) {
	var testEl;
	
	testEl = $('<div>').get(0);
	assert.equal(Armoire.hasClass(testEl, 'test'), false);
	
	testEl = $('<div class="test">').get(0);
	assert.equal(Armoire.hasClass(testEl, 'test'), true);
	
	testEl = $('<div class="testing">').get(0);
	assert.equal(Armoire.hasClass(testEl, 'test'), false);
	
	testEl = $('<div class="another test">').get(0);
	assert.equal(Armoire.hasClass(testEl, 'test'), true);
});

QUnit.test('removeClass', function(assert) {
	var testEl;
	
	testEl = $('<div class="foo bar baz">').get(0);
	Armoire.removeClass(testEl, 'foo')
	assert.equal(Armoire.hasClass(testEl, 'foo'), false);
	assert.equal(Armoire.hasClass(testEl, 'bar'), true);
	assert.equal(Armoire.hasClass(testEl, 'baz'), true);
	
	testEl = $('<div class="foo bar baz">').get(0);
	Armoire.removeClass(testEl, 'bar')
	assert.equal(Armoire.hasClass(testEl, 'foo'), true);
	assert.equal(Armoire.hasClass(testEl, 'bar'), false);
	assert.equal(Armoire.hasClass(testEl, 'baz'), true);
	
	testEl = $('<div class="foo bar baz">').get(0);
	Armoire.removeClass(testEl, 'baz')
	assert.equal(Armoire.hasClass(testEl, 'foo'), true);
	assert.equal(Armoire.hasClass(testEl, 'bar'), true);
	assert.equal(Armoire.hasClass(testEl, 'baz'), false);
});

QUnit.test('findAncestor', function(assert) {
	var findAncestor = Armoire.findAncestor;
	var filter = function(el) { return Armoire.clickElementFilter(el) };
	
	var firstInvalidEl = $('<div class="1">').get(0);
	var firstValidEl = $('<a class="1 ' + Armoire.setStyleClass + '">').get(0);
	var secondInvalidEl = $('<div class="2">').get(0);
	var secondValidEl = $('<a class="2 ' + Armoire.setStyleClass + '">').get(0);
	var thirdInvalidEl = $('<div class="3">').get(0);
	
	firstValidEl.appendChild(firstInvalidEl);
	secondInvalidEl.appendChild(firstValidEl);
	secondValidEl.appendChild(secondInvalidEl);
	thirdInvalidEl.appendChild(secondValidEl);
	
	assert.equal(findAncestor(null, filter), null);
	assert.equal(findAncestor(firstInvalidEl, filter), firstValidEl);
	assert.equal(findAncestor(firstValidEl, filter), secondValidEl);
	assert.equal(findAncestor(secondInvalidEl, filter), secondValidEl);
	assert.equal(findAncestor(secondValidEl, filter), null);
	assert.equal(findAncestor(thirdInvalidEl, filter), null);
});

QUnit.test('wrapMethod', function(assert) {
	var testObj = {
		attribute: 'value',
		firstMethod: function() { return this.attribute; },
		secondMethod: function(x) { return x; }
	};
	
	assert.equal(testObj.firstMethod(), 'value', "Testing the unit test code");
	assert.equal(testObj.secondMethod(42), 42, "Testing the unit test code");
	
	var firstMethod = Armoire.wrapMethod(testObj, testObj.firstMethod);
	var secondMethod = Armoire.wrapMethod(testObj, testObj.secondMethod);
	
	assert.equal(firstMethod(), 'value');
	assert.equal(secondMethod(42), 42);
});

QUnit.test('isStylesheetLink', function(assert) {
	var isStylesheetLink = Armoire.isStylesheetLink;
	
	assert.equal(
		isStylesheetLink($('<div rel="stylesheet">')[0]), false,
		"Testing against div"
	);
	
	assert.equal(
		isStylesheetLink($('<link>')[0]), false,
		"A link without rel"
	);
	
	assert.equal(
		isStylesheetLink($('<link rel="stylesheet">')[0]), true,
		"Simple stylesheet link"
	);
	
	assert.equal(
		isStylesheetLink($('<link rel="alternate stylesheet">')[0]), true,
		"Alternate stylesheet link"
	);
	
	assert.equal(
		isStylesheetLink($('<link rel="notstylesheet">')[0]), false,
		"notstylesheet link"
	);
	
	assert.equal(
		isStylesheetLink($('<link rel="stylesheetish">')[0]), false,
		"stylesheetish link"
	);
});

QUnit.module("Fundamental methods", {
	beforeEach: function(assert) {
		this.addedElements = $(testHeadHtml);
		$(document.head).append(this.addedElements);
	},
	afterEach: function(assert) {
		this.addedElements.remove();
	}
});

QUnit.test('isValidStyleElement', function(assert) {
	var testEl;
	var isValidStyleElement = Armoire.wrapMethod(
		Armoire, Armoire.isValidStyleElement
	);
	
	testEl = $('<div>').get(0);
	assert.equal(
		isValidStyleElement(testEl), false,
		"<div> is NOT valid"
	);
	
	testEl = $('<style>').get(0);
	assert.equal(
		isValidStyleElement(testEl), true,
		"<style> is valid"
	);
	
	testEl = $('<link>').get(0);
	assert.equal(
		isValidStyleElement(testEl), false,
		"<link> s NOT valid"
	);
	
	testEl = $('<link rel="stylesheet">').get(0);
	assert.equal(
		isValidStyleElement(testEl), true,
		'<link rel="stylesheet"> is valid'
	);
	
	testEl = $('<link rel="alternate stylesheet">').get(0);
	assert.equal(
		isValidStyleElement(testEl), true,
		'<link rel="alternate stylesheet"> is valid'
	);
	
	testEl = $('<link rel="icon">').get(0);
	assert.equal(
		isValidStyleElement(testEl), false,
		'<link rel="icon"> is NOT valid'
	);
});

QUnit.test('isStyleEnabled', function(assert) {
	var styleEl = $('#style-a-1')[0];
	
	styleEl.disabled = true;
	assert.equal(
		Armoire.isStyleEnabled(styleEl), false,
		"<style> NOT enabled"
	);
	
	styleEl.disabled = false;
	assert.equal(
		Armoire.isStyleEnabled(styleEl), true,
		"<style> enabled"
	);
	
	var linkEl = $('#link-b-2')[0];
	linkEl.disabled = true;
	assert.equal(
		Armoire.isStyleEnabled(linkEl), false,
		"<link> NOT enabled"
	);
	
	linkEl.disabled = false;
	assert.equal(
		Armoire.isStyleEnabled(linkEl), true,
		"<link> enabled"
	);
});

QUnit.test('enableStyle', function(assert) {
	var styleEl = $('#style-a-1')[0];
	
	Armoire.enableStyle(styleEl, false);
	assert.equal(
		Armoire.isStyleEnabled(styleEl), false,
		"<style> was disabled"
	);
	
	Armoire.enableStyle(styleEl, true);
	assert.equal(
		Armoire.isStyleEnabled(styleEl), true,
		"<style> was enabled"
	);
	
	var linkEl = $('#link-b-2')[0];
	Armoire.enableStyle(linkEl, false);
	assert.equal(
		Armoire.isStyleEnabled(linkEl), false,
		"<link> was disabled"
	);
	
	Armoire.enableStyle(linkEl, true);
	assert.equal(
		Armoire.isStyleEnabled(linkEl), true,
		"<link> was enabled"
	);
});

QUnit.module("Style group related", {
	beforeEach: function(assert) {
		this.addedElements = $(testHeadHtml);
		$(document.head).append(this.addedElements);
	},
	afterEach: function(assert) {
		this.addedElements.remove();
	}
});

QUnit.test('getGroupId', function(assert) {
	var getGroupId = Armoire.wrapMethod(Armoire, Armoire.getGroupId);
	
	assert.equal(
		getGroupId($('#lone-style')[0]), undefined,
		"Style element without a group"
	);
	assert.equal(
		getGroupId($('#lone-link')[0]), undefined,
		"Link element without a group"
	);
	
	assert.equal(
		getGroupId($('#icon-link')[0]), 'group-a',
		"Invalid style element with classes"
	);
	
	assert.equal(
		getGroupId($('#style-b-1')[0]), 'group-b',
		"First class from style element"
	);
	assert.equal(
		getGroupId($('#link-b-2')[0]), 'group-b',
		"First class from link element"
	);
	
	assert.equal(
		getGroupId($('#standard-link')[0]), Armoire.standardGroupId,
		"HTML standard, default stylesheet link"
	);
	assert.equal(
		getGroupId($('#alternate-link')[0]), Armoire.standardGroupId,
		"HTML standard, alternate stylesheet link"
	);
});

QUnit.test('getGroupFromClass', function(assert) {
	var getGroupFromClass = Armoire.wrapMethod(
		Armoire, Armoire.getGroupFromClass
	);
	
	assert.deepEqual(
		getGroupFromClass('group-a'),
		[$('#style-a-1')[0], $('#style-a-2')[0]],
		"Group A: Style-only group"
	);
	
	assert.deepEqual(
		getGroupFromClass('group-b'),
		[$('#style-b-1')[0], $('#link-b-2')[0]],
		"Group B: Style-only group"
	);
	
	assert.deepEqual(
		getGroupFromClass('group-c'),
		[$('#link-c-1')[0], $('#link-c-2')[0]],
		"Group C: Link-only group"
	);
	
	assert.deepEqual(
		getGroupFromClass('random gibberish here'),
		[],
		"Inexistent group"
	);
});

QUnit.test('getStandardGroup', function(assert) {
	assert.deepEqual(
		Armoire.getStandardGroup(),
		[$('#standard-link')[0], $('#alternate-link')[0]],
		"Correct output"
	);
});

QUnit.test('getGroupFromId', function(assert) {
	assert.deepEqual(
		Armoire.getGroupFromId('group-a'),
		Armoire.getGroupFromClass('group-a'),
		"Non-standard group"
	);
	
	assert.deepEqual(
		Armoire.getGroupFromId(Armoire.standardGroupId),
		Armoire.getStandardGroup(),
		"Standard group"
	);
});

QUnit.test('getGroupFromMember', function(assert) {
	var getGroupFromMember = Armoire.wrapMethod(
		Armoire, Armoire.getGroupFromMember
	);
	
	assert.deepEqual(
		getGroupFromMember($('#style-b-1')[0]),
		Armoire.getGroupFromClass('group-b'),
		"With a member from a group"
	);
	
	assert.deepEqual(
		getGroupFromMember($('#lone-style')[0]),
		[$('#lone-style')[0]],
		"With an ungrouped lone element"
	);
});

QUnit.test('setActiveStyle', function(assert) {
	var setActiveStyle = Armoire.wrapMethod(Armoire, Armoire.setActiveStyle);
	
	var groupB = Armoire.getGroupFromId('group-b');
	var styleB1 = groupB[0];
	var linkB2 = groupB[1];
	
	setActiveStyle(groupB, styleB1);
	assert.equal(
		styleB1.disabled, false,
		"Setting StyleB1. StyleB1 is enabled"
	);
	assert.equal(
		linkB2.disabled, true,
		"Setting StyleB1. LinkB2 is disabled"
	);
	
	setActiveStyle(groupB, linkB2);
	assert.equal(
		styleB1.disabled, true,
		"Setting LinkB2. StyleB1 is disabled"
	);
	assert.equal(
		linkB2.disabled, false,
		"Setting LinkB2. LinkB2 is enabled"
	);
	
	setActiveStyle(groupB, null);
	assert.equal(
		styleB1.disabled, true,
		"Setting null. StyleB1 is disabled"
	);
	assert.equal(
		linkB2.disabled, true,
		"Setting null. LinkB2 is disabled"
	);
});

QUnit.test('getActiveStyle', function(assert) {
	var getActiveStyle = Armoire.wrapMethod(Armoire, Armoire.getActiveStyle);
	var setActiveStyle = Armoire.wrapMethod(Armoire, Armoire.setActiveStyle);
	
	var groupB = Armoire.getGroupFromId('group-b');
	var styleB1 = groupB[0];
	var linkB2 = groupB[1];
	
	setActiveStyle(groupB, styleB1);
	assert.equal(
		getActiveStyle(groupB), styleB1,
		"Set StyleB1. Checking output"
	);
	
	setActiveStyle(groupB, linkB2);
	assert.equal(
		getActiveStyle(groupB), linkB2,
		"Set LinkB2. Checking output"
	);
	
	setActiveStyle(groupB, null);
	assert.equal(
		getActiveStyle(groupB), null,
		"Set null. Checking output"
	);
});

QUnit.test('setPageStyle', function(assert) {
	var setPageStyle = Armoire.wrapMethod(Armoire, Armoire.setPageStyle);
	
	var groupB = Armoire.getGroupFromId('group-b');
	var styleB1 = groupB[0];
	var linkB2 = groupB[1];
	
	setPageStyle('group-b', 'style-b-1');
	assert.equal(
		styleB1.disabled, false,
		"Setting StyleB1. StyleB1 is enabled"
	);
	assert.equal(
		linkB2.disabled, true,
		"Setting StyleB1. LinkB2 is disabled"
	);
	
	setPageStyle('group-b', 'link-b-2');
	assert.equal(
		styleB1.disabled, true,
		"Setting LinkB2. StyleB1 is disabled"
	);
	assert.equal(
		linkB2.disabled, false,
		"Setting LinkB2. LinkB2 is enabled"
	);
	
	setPageStyle('group-b', null);
	assert.equal(
		styleB1.disabled, true,
		"Setting null. StyleB1 is disabled"
	);
	assert.equal(
		linkB2.disabled, true,
		"Setting null. LinkB2 is disabled"
	);
});

QUnit.test('getPageStyle', function(assert) {
	var getPageStyle = Armoire.wrapMethod(Armoire, Armoire.getPageStyle);
	var setPageStyle = Armoire.wrapMethod(Armoire, Armoire.setPageStyle);
	
	setPageStyle('group-b', 'style-b-1');
	assert.equal(
		getPageStyle('group-b'), 'style-b-1',
		"Set StyleB1. Checking output"
	);
	
	setPageStyle('group-b', 'link-b-2');
	assert.equal(
		getPageStyle('group-b'), 'link-b-2',
		"Set LinkB2. Checking output"
	);
	
	setPageStyle('group-b', null);
	assert.equal(
		getPageStyle('group-b'), null,
		"Set null. Checking output"
	);
});

QUnit.test('setPageStyles', function(assert) {
	var stylePreferences = {
		'group-a': 'style-a-1',
		'group-b': null,
		'group-c': 'link-c-2'
	};
	
	stylePreferences[Armoire.standardGroupId] = 'alternate-link';
	Armoire.setPageStyles(stylePreferences);
	
	assert.equal(
		$('#style-a-1')[0].disabled, false,
		"Group A: #style-a-1 has NOT been disabled"
	);
	assert.equal(
		$('#style-a-2')[0].disabled, true,
		"Group A: #style-a21 has been disabled"
	);
	
	assert.equal(
		$('#style-b-1')[0].disabled, true,
		"Group B: #style-b-1 has been disabled"
	);
	assert.equal(
		$('#link-b-2')[0].disabled, true,
		"Group B: #link-b-2 has been disabled"
	);
	
	assert.equal(
		$('#link-c-1')[0].disabled, true,
		"Group C: #link-c-1 has been disabled"
	);
	assert.equal(
		$('#link-c-2')[0].disabled, false,
		"Group C: #link-c-2 has NOT been disabled"
	);
	
	assert.equal(
		$('#standard-link')[0].disabled, true,
		"Standard Group: #standard-link has been disabled"
	);
	assert.equal(
		$('#alternate-link')[0].disabled, false,
		"Standard Group: #alternate-link has NOT been disabled"
	);
});

QUnit.test('getPageStyles', function(assert) {
	var expectedValues = {
		'group-a': 'style-a-2',
		'group-b': null,
		'group-c': 'link-c-2'
	}
	expectedValues[Armoire.standardGroupId] = 'alternate-link';
	Armoire.setPageStyles(expectedValues);
	var receivedValues = Armoire.getPageStyles(expectedValues);
	
	assert.deepEqual(
		receivedValues, expectedValues,
		"Correct result."
	);
});

QUnit.module('Click handling');

QUnit.test('clickElementFilter', function(assert) {
	var testEl;
	
	testEl = $('<div>')[0];
	assert.equal(
		Armoire.clickElementFilter(testEl), false,
		"<div> excluded"
	);
	
	testEl = $('<div class="' + Armoire.setStyleClass  + '">')[0];
	assert.equal(
		Armoire.clickElementFilter(testEl), false,
		"<div> with Armoire.setStyleClass class excluded"
	);
	
	testEl = $('<a>')[0];
	assert.equal(
		Armoire.clickElementFilter(testEl), false,
		"<a> without a class attribute excluded"
	);
	
	testEl = $('<a class="test">')[0]
	assert.equal(
		Armoire.clickElementFilter(testEl), false,
		"<a> with random class attribute excluded"
	);
	
	testEl = $('<a class="' + Armoire.setStyleClass  + '">')[0];
	assert.equal(
		Armoire.clickElementFilter(testEl), true,
		"<a> with proper class attribute included"
	);
});

QUnit.test('getClickElementTargetId', function(assert) {
	var testEl;
	var getTargetId = Armoire.wrapMethod(
		Armoire,
		Armoire.getClickElementTargetId
	);
	
	testEl = $('<a>')[0];
	assert.equal(
		getTargetId(testEl), null,
		"Anchor without href"
	);
	
	testEl = $('<a href="">')[0];
	assert.equal(
		getTargetId(testEl), null,
		"Link with empty string as href"
	);
	
	testEl = $('<a href="#">')[0];
	assert.equal(
		getTargetId(testEl), null,
		'Link with href="#"'
	);
	
	testEl = $('<a href="webpage.html">')[0];
	assert.equal(
		getTargetId(testEl), null,
		"Link to some random resource"
	);
	
	testEl = $('<a href="#target">')[0];
	assert.equal(
		getTargetId(testEl), 'target',
		"Link with only a fragment identifier"
	);
	
	testEl = $('<a href="webpage.html#target">')[0];
	assert.equal(
		getTargetId(testEl), null,
		"Link with fragment identifier for a random resource"
	);
});

QUnit.module();

QUnit.test('setupDefaultStylePreferences', function(assert) {
	var setupDefaultStylePreferences = Armoire.wrapMethod(
		Armoire,
		Armoire.setupDefaultStylePreferences
	);
	
	// defaultStyleClass tests
	var style1a = $(
		'<style class="group-a 1 ' + Armoire.defaultStyleClass + '">'
	).get(0);
	var style2a = $('<style class="group-a 2">').get(0);
	
	$(document.head)
	.append(style1a)
	.append(style2a);
	
	setupDefaultStylePreferences();
	
	assert.ok(
		!style1a.disabled && style2a.disabled,
		"Default style class, enabled / disabled effect test"
	);
	
	assert.ok(
		Armoire.hasClass(style1a, Armoire.defaultStyleClass) === false,
		"Default style class, class deletion test"
	);
	
	// disabledStyleClass tests
	var style1b = $(
		'<style class="group-b 1 ' + Armoire.disabledStyleClass + '">'
	).get(0);
	var style2b = $('<style class="group-b 2">').get(0);
	
	$(document.head)
	.append(style1b)
	.append(style2b);
	
	setupDefaultStylePreferences();
	
	assert.ok(
		style1b.disabled && !style2b.disabled,
		"Disabled style class, disabled / enabled effect test"
	);
	
	assert.equal(
		Armoire.hasClass(style1b, Armoire.disabledStyleClass), false,
		"Disabled style class, class deletion test"
	);
	
	document.head.removeChild(style1a);
	document.head.removeChild(style2a);
	document.head.removeChild(style1b);
	document.head.removeChild(style2b);
});

QUnit.module("Storage", {
	beforeEach: function() {
		// Removing localStorage items
		if(window.localStorage) {
			window.localStorage.removeItem('test-a-1');
			window.localStorage.removeItem('test-a-2');
			window.localStorage.removeItem('test-b-1');
			window.localStorage.removeItem('test-b-2');
		};
		
		// Removing test cookies
		document.cookie = "test-a-1=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
		document.cookie = "test-a-2=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
		document.cookie = "test-b-1=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
		document.cookie = "test-b-2=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
		
		this.addedElements = $(testHeadHtml);
		$(document.head).append(this.addedElements);
	},
	afterEach: function(assert) {
		this.addedElements.remove();
	}
});

QUnit.test('loadString', function(assert) {
	if(window.localStorage) {
		Armoire.useLocalStorage = true;
		window.localStorage['test-a-1'] = 'test-a-2;';
		assert.equal(
			Armoire.loadString('test-a-1'), 'test-a-2;',
			"Test with localStorage"
		);
	} else {
		assert.ok(true, "No localStorage. Can't fail the tests");
	}
	
	// Note: the ';' character is used here to test whether the thing is
	// properly percent-encoding stuff.
	Armoire.useLocalStorage = false;
	document.cookie = 'test-b-1=' + encodeURIComponent('test-b-2;');
	assert.equal(
		Armoire.loadString('test-b-1'), 'test-b-2;',
		"Test with cookies"
	);
});

QUnit.test('saveString', function(assert) {
	if(window.localStorage) {
		Armoire.useLocalStorage = true;
		Armoire.saveString('test-a-1', 'test-a-2;');
		assert.equal(
			Armoire.loadString('test-a-1'), 'test-a-2;',
			"Test with localStorage"
		);
	} else {
		assert.ok(true, "No localStorage. Can't fail the tests");
	}
	
	Armoire.useLocalStorage = false;
	Armoire.saveString('test-b-1', 'test-b-2;');
	assert.equal(
		Armoire.loadString('test-b-1'), 'test-b-2;',
		"Test with cookies"
	);
});

QUnit.test('saveStyles & loadStyles', function(assert) {
	var stylePreferences = {
		'group-a': 'style-a-1',
		'group-b': null,
		'group-c': 'link-c-2'
	};
	stylePreferences[Armoire.standardGroupId] = 'alternate-link';
	Armoire.setPageStyles(stylePreferences);
	
	// First we save
	Armoire.saveStyles();
	
	var otherPreferences = {
		'group-a': 'style-a-1',
		'group-b': 'style-b-1',
		'group-c': 'link-c-1'
	}
	otherPreferences[Armoire.standardGroupId] = 'standard-link';
	Armoire.setPageStyles(otherPreferences);
	
	// Then we load
	Armoire.loadStyles();
	
	assert.deepEqual(
		Armoire.getPageStyles(), stylePreferences,
		"Save & load test"
	)
});