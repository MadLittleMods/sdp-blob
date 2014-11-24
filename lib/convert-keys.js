// umd
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['extend'], factory);
	} else if (typeof exports === 'object') {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like environments that support module.exports,
		// like Node.
		module.exports = factory(require('extend'));
	} else {
		// Browser globals (root is window)
		var extend = root.$ ? root.$.extend : root.extend;
		root.convertKeys = factory(extend);
	}
}(this, function (extend) {
	"use strict";


	// These are used to determine the map/table format
	var const_objectKeyPropertyName = '_short';
	var const_objectValuePropertyName = '_object';
	var const_arrayKeyPropertyName = '_array_item';

	function convertKeys(object, map, reverseMap)
	{
		if (typeof object != "object" || map == null) {
			return object;
		}

		// Clone the object so we don't modify the original
		var resultantObject = extend(true, {}, object);

		// Iterate over the object
		Object.keys(resultantObject).forEach(function(key) {
			var mapKey = reverseMap ? findKeyFromValue(map, key) : key;

			var newKeyName = reverseMap ? mapKey : map[mapKey];
			if(typeof newKeyName == "object") {
				newKeyName = newKeyName[const_objectKeyPropertyName];
			}

			if(!newKeyName) {
				return resultantObject;
			}

			renameProperty(resultantObject, key, newKeyName);


			var value = resultantObject[newKeyName];

			if (value instanceof Array) {
				for (var i = 0, length = value.length; i < length; i++) {
					resultantObject[newKeyName][i] = convertKeys(value[i], map[mapKey][const_arrayKeyPropertyName], reverseMap);
				}
			}
			else if(typeof value == "object") {
				resultantObject[newKeyName] = convertKeys(value, map[mapKey][const_objectValuePropertyName], reverseMap);
			}

		});

		return resultantObject;
	}

	function renameProperty(object, oldName, newName)
	{
		// from: http://stackoverflow.com/a/4648411/796832

		// Check for the old property name to avoid a ReferenceError in strict mode.
		if (object.hasOwnProperty(oldName)) {
			object[newName] = object[oldName];
			delete object[oldName];
		}
		return object;
	}

	function findKeyFromValue(object, searchValue)
	{
		var keys = Object.keys(object);
		var resultantKey = false;
		for(var i = 0; i < keys.length; i++) {
			var key = keys[i];
			var value = object[key];
			if(typeof value == "object") {
				value = value[const_objectKeyPropertyName];
			}

			if(value == searchValue) {
				resultantKey = key;
				break;
			}
		}

		return resultantKey;
	}

	return convertKeys;
	
}));