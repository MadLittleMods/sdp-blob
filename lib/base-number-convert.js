(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['big-integer'], factory);
	} else if (typeof exports === 'object') {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like environments that support module.exports,
		// like Node.
		module.exports = factory(require('big-integer'));
	} else {
		// Browser globals (root is window)
		root.baseConversion = factory(root.bigInt);
	}
}(this, function(bigInt) {

	"use strict";

	// The reasoning behind capital first is because it comes first in a ASCII/Unicode character map
	// 96 symbols support up to base 96
	//var baseSymbols = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~`!@#$%^&*()-_=+[{]}|;:,<.>/?žŸ¡¢¿";

	var characterRangeMap = [
		// 0-9
		{
			start: 48,
			end: 57
		},
		// A-Z
		{
			start: 65,
			end: 90
		},
		// a-z
		{
			start: 97,
			end: 122
		},

		// Skip the space at 32
		33,
		// Skip the double quote at 34
		{
			start: 35,
			end: 38
		},
		// Skip the single quote at 39
		{
			start: 40,
			end: 47
		},
		// Already included (48-57)0-9 above
		{
			start: 58,
			end: 64
		},
		// Already included (65-90)A-Z above
		91,
		// Skip the backslash at 92 (it tends to escape things we don't want)
		{
			start: 93,
			end: 96
		},
		// Already included (97-122)a-z above
		{
			start: 123,
			end: 126
		},
		// Avoid all of the non-printing characters
		{
			start: 161,
			end: 172
		},
		// Skip the soft hyphen at 173 (it doesn't seem to show up)
		{
			start: 174,
			end: 255
		}
	];
	var characterMap = [];
	characterRangeMap.forEach(function(range) {
		if(typeof range == "object")
		{
			for(var i = range.start; i < range.start+(range.end-range.start+1); i++)
			{
				characterMap.push(i);
			}
		}
		else
		{
			// Otherwise it is just a single number so just add it
			characterMap.push(range);
		}
	});

	var baseSymbols2 = String.fromCharCode.apply(String, characterMap);
	//console.log(baseSymbols2.length + ":", baseSymbols2);


	function baseConvert(src, fromBase, toBase, srcSymbolTable, destSymbolTable)
	{
		// From: convert.js: http://rot47.net/_js/convert.js
		//	http://rot47.net
		//	http://helloacm.com
		//	http://codingforspeed.com  
		//	Dr Zhihua Lai
		//
		// Modified by MLM to work with BigInteger: https://github.com/peterolson/BigInteger.js
		// This is able to convert extremely large numbers; At any base equal to or less than the symbol table length

		// Default the symbol table to a nice default table that supports up to base 185
		srcSymbolTable = srcSymbolTable ? srcSymbolTable : baseSymbols2;
		// Default the desttable equal to the srctable if it isn't defined
		destSymbolTable = destSymbolTable ? destSymbolTable : srcSymbolTable;
		
		// Make sure we are not trying to convert out of the symbol table range
		if(fromBase > srcSymbolTable.length || toBase > destSymbolTable.length)
		{
			console.warn("Can't convert", src, "to base", toBase, "greater than symbol table length. src-table:", srcSymbolTable.length, "dest-table:", destSymbolTable.length);
			return false;
		}
		
		// First convert to base 10
		var val = bigInt(0);
		for (var i = 0; i < src.length; i ++)
		{
			val = val.multiply(fromBase).add(srcSymbolTable.indexOf(src.charAt(i)));
		}
		if (val.lesser(0))
		{
			return 0;
		}
		
		// Then covert to any base
		var r = val.mod(toBase);
		var res = destSymbolTable.charAt(r);
		var q = val.divide(toBase);
		while(!q.equals(0))
		{
			r = q.mod(toBase);
			q = q.divide(toBase);
			res = destSymbolTable.charAt(r) + res;
		}
		
		return res;
	}


	return {
		baseSymbols: baseSymbols2,
		baseConvert: baseConvert
	};

}));