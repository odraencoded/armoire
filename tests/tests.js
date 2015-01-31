QUnit.test("Export test", function( assert ) {
	assert.expect(1)
	assert.equal(typeof Armoire, 'object', 'Armoire is defined');
});

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

QUnit.test('clickElementFilter', function(assert) {
	var testEl;
	
	testEl = $('<div>').get(0);
	assert.equal(Armoire.clickElementFilter(testEl), false);
	
	testEl = $('<div class="' + Armoire.setStyleClass  + '">').get(0);
	assert.equal(Armoire.clickElementFilter(testEl), false);
	
	testEl = $('<a>').get(0);
	assert.equal(Armoire.clickElementFilter(testEl), false);

	testEl = $('<a class="' + Armoire.setStyleClass  + '">').get(0);
	assert.equal(Armoire.clickElementFilter(testEl), true);
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

QUnit.test('getClickElementTargetId', function(assert) {
	var testEl;
	var getTargetId = Armoire.wrapMethod(
		Armoire,
		Armoire.getClickElementTargetId
	);
	
	testEl = $('<a href="">').get(0);
	assert.equal(getTargetId(testEl), null);
	
	testEl = $('<a href="#">').get(0);
	assert.equal(getTargetId(testEl), null);
	
	testEl = $('<a href="webpage.html">').get(0);
	assert.equal(getTargetId(testEl), null);
	
	testEl = $('<a href="#target">').get(0);
	assert.equal(getTargetId(testEl), 'target');
	
	testEl = $('<a href="webpage.html#target">').get(0);
	assert.equal(getTargetId(testEl), null);
});

QUnit.test('isValidStyleElement', function(assert) {
	var testEl;
	var isValid = Armoire.wrapMethod(Armoire, Armoire.isValidStyleElement);
	
	testEl = $('<div>').get(0);
	assert.equal(isValid(testEl), false);
	
	testEl = $('<style>').get(0);
	assert.equal(isValid(testEl), true);
	
	testEl = $('<link>').get(0);
	assert.equal(isValid(testEl), false);
	
	testEl = $('<link rel="stylesheet">').get(0);
	assert.equal(isValid(testEl), true);
	
	testEl = $('<link rel="alternate stylesheet">').get(0);
	assert.equal(isValid(testEl), true);
	
	testEl = $('<link rel="icon">').get(0);
	assert.equal(isValid(testEl), false);
});

QUnit.test('getStyleGroup', function(assert) {
	var getStyleGroup = Armoire.wrapMethod(Armoire, Armoire.getStyleGroup);
	
	var loneStyleEl = $('<style>').get(0);
	var loneLinkEl = $('<link rel="stylesheet">').get(0);
	
	var groupA1 = $('<style class="group-a">').get(0);
	var groupA2 = $('<style class="group-a">').get(0);
	
	var groupB1 = $('<link rel="stylesheet" class="group-b">').get(0);
	var groupB2 = $('<link rel="stylesheet" class="group-b">').get(0);
	
	var groupC1 = $('<style class="group-c">').get(0);
	var groupC2 = $('<link rel="stylesheet" class="group-c">').get(0);
	
	var groupD1 = $('<link rel="stylesheet" title="primary">').get(0);
	var groupD2 = $('<link rel="alternate stylesheet" title="secondary">').get(0);
	
	$(document.head)
	.append(loneStyleEl)
	.append(loneLinkEl)
	.append(groupA1)
	.append(groupA2)
	.append(groupB1)
	.append(groupB2)
	.append(groupC1)
	.append(groupC2)
	.append(groupD1)
	.append(groupD2);
	
	assert.deepEqual(getStyleGroup(loneStyleEl), [loneStyleEl]);
	assert.deepEqual(getStyleGroup(loneLinkEl), [loneLinkEl]);
	assert.deepEqual(getStyleGroup(groupA1), [groupA1, groupA2]);
	assert.deepEqual(getStyleGroup(groupA2), [groupA1, groupA2]);
	assert.deepEqual(getStyleGroup(groupB1), [groupB1, groupB2]);
	assert.deepEqual(getStyleGroup(groupB2), [groupB1, groupB2]);
	assert.deepEqual(getStyleGroup(groupC1), [groupC1, groupC2]);
	assert.deepEqual(getStyleGroup(groupC2), [groupC1, groupC2]);
	assert.deepEqual(getStyleGroup(groupD1), [groupD1, groupD2]);
	assert.deepEqual(getStyleGroup(groupD2), [groupD1, groupD2]);
	
	document.head.removeChild(loneStyleEl);
	document.head.removeChild(loneLinkEl);
	document.head.removeChild(groupA1);
	document.head.removeChild(groupA2);
	document.head.removeChild(groupB1);
	document.head.removeChild(groupB2);
	document.head.removeChild(groupC1);
	document.head.removeChild(groupC2);
	document.head.removeChild(groupD1);
	document.head.removeChild(groupD2);
});

QUnit.test('setGroupStyle', function(assert) {
	var setGroupStyle = Armoire.wrapMethod(Armoire, Armoire.setGroupStyle);
	
	var style1 = $('<style class="1 group-a">').get(0);
	var style2 = $('<style class="2 group-a">').get(0);
	
	$(document.head)
	.append(style1)
	.append(style2);
	
	var styleGroup = [style1, style2];
	
	setGroupStyle(styleGroup, style1);
	assert.ok(!style1.disabled && style2.disabled);
	
	setGroupStyle(styleGroup, style2);
	assert.ok(style1.disabled && !style2.disabled);
	
	setGroupStyle(styleGroup, null);
	assert.ok(style1.disabled && style2.disabled);
	
	document.head.removeChild(style1);
	document.head.removeChild(style2);
});