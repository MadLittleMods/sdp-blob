!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.SDPBlob=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
var sdpBlob = _dereq_('./lib/sdp-blob');

module.exports = sdpBlob;
},{"./lib/sdp-blob":5}],2:[function(_dereq_,module,exports){
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['big-integer'], factory);
	} else if (typeof exports === 'object') {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like environments that support module.exports,
		// like Node.
		module.exports = factory(_dereq_('big-integer'));
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
},{"big-integer":7}],3:[function(_dereq_,module,exports){
// umd
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['extend'], factory);
	} else if (typeof exports === 'object') {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like environments that support module.exports,
		// like Node.
		module.exports = factory(_dereq_('extend'));
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
},{"extend":8}],4:[function(_dereq_,module,exports){
// umd
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['lz-string'], factory);
	} else if (typeof exports === 'object') {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like environments that support module.exports,
		// like Node.
		module.exports = factory(_dereq_('lz-string'));
	} else {
		// Browser globals (root is window)
		root.DataBlob = factory(root.LZString);
	}
}(this, function (LZString) {
	"use strict";


	var DataBlob = {
		// `data`: js object to blobify(string)
		// `encoding`: *Optional* `base64`(default) or `utf16`
		assembleBlob: function(data, /*optional*/encoding) {
			var compressMethod = encoding == 'utf16' ? LZString.compressToUTF16 : LZString.compressToBase64;

			var escapedStringifiedData = JSON.stringify(data);
			//console.log("esc", escaped_stringified_data.length, escaped_stringified_data);

			var compressedBlob = compressMethod(escapedStringifiedData);

			return compressedBlob;
		},

		// `blob`: A string blob from `DataBlob.assembleBlob`
		// `encoding`: *Optional* `base64`(default) or `utf16`
		parseBlob: function(blob, /*optional*/encoding) {
			var decompressMethod = encoding == 'utf16' ? LZString.decompressFromUTF16 : LZString.decompressFromBase64;

			var uncompressed = decompressMethod(blob);
			var parsedResult = JSON.parse(uncompressed);

			return parsedResult;
		}
	};


	return DataBlob;


}));
},{"lz-string":9}],5:[function(_dereq_,module,exports){
// umd
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['data-blob', 'session-description-utility'], factory);
	} else if (typeof exports === 'object') {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like environments that support module.exports,
		// like Node.
		module.exports = factory(_dereq_('./data-blob'), _dereq_('./session-description-utility'));
	} else {
		// Browser globals (root is window)
		root.SDPBlob = factory(root.DataBlob, root.SDPUtility);
	}
}(this, function (DataBlob, SDPUtility) {
	"use strict";

	var SessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;

	var SDPBlob = {
		// Prints out some debug messages if true
		debug: false,

		// You can pass in just a sdp description string
		// or an options object that has a `description` and `encoding` keys
		// `description`: SDP string
		// `encoding`: *Optional* `base64`(default) or `utf16`
		assembleBlob: function(options) {
			SDPUtility.debug = this.debug;
			DataBlob.debug = this.debug;

			var description = options;
			var encoding = "base64";
			if(typeof options == "object")
			{
				// Since the description iteself is an object with `sdp` and `type` 
				// we have to check for the `description` key to see if they put it in there or just put the keys on the options object itself
				description = options.description || options;
				encoding = options.encoding || "base64";
			}

			var blobContents = SDPUtility.generateBlobContentsFromDescription(description, true);

			var blob = DataBlob.assembleBlob(blobContents, encoding);

			if(this.debug)
			{
				console.groupCollapsed("Lengths:", JSON.stringify(description).length, JSON.stringify(blobContents).length, blob.length);
					console.log("Description length:", JSON.stringify(description).length);
					console.log("DataBlob of description length :", DataBlob.assembleBlob(description).length);
					console.log("SDPBlob length:", blob.length);
				console.groupEnd();
			}

			return blob;
		},

		// Pass in the blob and type
		// or an options object that has a `blob` and `type` keys
		// `blob`: A string provided from `SDPBlob.assembleBlob()`
		// `type`: A string. Most likely `offer` or `answer`
		// `encoding`: *Optional* `base64`(default) or `utf16`
		parseBlob: function(options, type) {
			SDPUtility.debug = this.debug;
			DataBlob.debug = this.debug;

			var blob = options;
			var encoding = "base64";
			if(typeof options == "object")
			{
				blob = options.blob;
				type = options.type || type || "offer";
				encoding = options.encoding || "base64";
			}

			var parsedBlob = DataBlob.parseBlob(blob, encoding);

			var sessionDescription = SDPUtility.restoreSessionDescription(parsedBlob, type);

			return new SessionDescription(sessionDescription);
		}
	};


	return SDPBlob;


}));
},{"./data-blob":4,"./session-description-utility":6}],6:[function(_dereq_,module,exports){
// umd
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['extend', 'sdp-transform', 'convert-keys', 'base-number-convert'], factory);
	} else if (typeof exports === 'object') {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like environments that support module.exports,
		// like Node.
		module.exports = factory(_dereq_('extend'), _dereq_('sdp-transform'), _dereq_('./convert-keys'), _dereq_('./base-number-convert'));
	} else {
		// Browser globals (root is window)
		var extend = root.$ ? root.extend : root.extend;
		root.SDPUtility = factory(extend, root.transform, root.convertKeys, root.baseConversion);
	}
}(this, function (extend, transform, convertKeys, baseConversion) {
	"use strict";

	var SessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;



	var contextNameConversionLookup = {
		payloads: 'l',
		ip: 'i',
		port: 'p',
		icePwd: 'w',
		iceUfrag: 'u',
		fingerprint: 'f',
		candidates: {
			'_short': 'c',

			'_array_item': {
				component: 'c',
				foundation: 'f',
				generation: 'g',
				ip: 'i',
				port: 'p',
				priority: 'r',
				transport: 't',
				type: 'y'
			}
		}
	};


	var SDPUtility = {
		// Prints out some debug messages if true
		debug: false,

		// Pass in a sdp description string and get an object that represents only the necessary parts
		// `description`: SDP string
		// `shouldShortenKeys`: *Optional* boolean to shorten keys to single characters
		generateBlobContentsFromDescription: function(description, /*optional*/shouldShortenKeys)
		{
			var default_context = {
				payloads: -1,
				ip: "",
				port: -1,
				icePwd: "",
				iceUfrag: "",
				fingerprint: "", // probably sha-256
				candidates: []
			};

			
			var parsedSDP = transform.parse(description.sdp);
			if(this.debug)
			{
				console.log("Generating blob contents from parsed sdp:", parsedSDP);
			}

			// This is the context we will overwrite and extend with the default
			var context = {};

			// The application media description is the main data channel info
			var applicationMediaDesc;
			var has_audio_media_desc = false;
			for(var i = 0; i < parsedSDP.media.length; i++)
			{
				if(parsedSDP.media[i].type == "application")
				{
					applicationMediaDesc = parsedSDP.media[i];

					break;
				}
			}

			if(applicationMediaDesc)
			{
				// media description attributes override session description attributes
				context.payloads = applicationMediaDesc.payloads;
				context.ip = (applicationMediaDesc.connection ? applicationMediaDesc.connection.ip : null);
				context.port = applicationMediaDesc.port;
				context.icePwd = applicationMediaDesc.icePwd || parsedSDP.icePwd;
				context.iceUfrag = applicationMediaDesc.iceUfrag || parsedSDP.iceUfrag;

				var fingerprint = (applicationMediaDesc.fingerprint ? applicationMediaDesc.fingerprint.hash : null) || parsedSDP.fingerprint.hash;
				// Remove the separating colons that make up each byte
				fingerprint = fingerprint.replace(/:/g, '');
				// Conver it to base 185
				fingerprint = baseConversion.baseConvert(fingerprint, 16, 64);
				context.fingerprint = fingerprint;

				context.candidates = (function() {
					var new_candidate_array = [];


					// Sort by the priority so below in the next loop,
					// we can reduce the priority number by using the index since the priority is 1-(2**31 - 1)
					applicationMediaDesc.candidates.sort(function(a, b) {
						if(a.priority > b.priority)
							return -1;
						else
							return 1;
					});

					applicationMediaDesc.candidates.forEach(function(candidate, index, array) {
						// We restore with a random number for foundation
						delete candidate.foundation;

						// http://tools.ietf.org/html/rfc5245#section-4.1.2
						candidate.priority = index+1;

						new_candidate_array.push(candidate);
					});

					return new_candidate_array;
				})();
			}


			var fullKeyContext = extend({}, default_context, context);

			var resultantContext = extend(true, {}, fullKeyContext);
			if(shouldShortenKeys)
			{
				convertKeys(resultantContext, contextNameConversionLookup, false);
			}

			return resultantContext;
		},

		

		// Pass in a blob contents and get a SessionDescription object back
		// `contextFromBlob`: Object from `SDPUtility.generateBlobContentsFromDescription`
		// `type`: A string. Most likely `offer` or `answer`
		restoreSessionDescription: function(contextFromBlob, type)
		{
			/* */
			// SDP: https://en.wikipedia.org/wiki/Session_Description_Protocol
			var template_sdp = function(context) {
				var sdpTransformData = {
					// protocol version number
					// v=
					version: 0,
					// originator and session identifier
					// o=
					origin: {
						address: "127.0.0.1",
						ipVer: 4,
						netType: "IN",
						sessionId: Math.round(Math.random()*5000)+500,
						sessionVersion: 0,
						username: "-"
					},
					// Session name
					// s=
					name: "-",
					
					// Time description (mandatory)
					// t=
					timing: {
						start: 0,
						stop: 0
					},

					/* */
					groups: [
						{
							mids: "data",
							type: "BUNDLE"
						}
					],
					/* */

					// Security Descriptions
					// a=
					icePwd: context.icePwd,
					iceUfrag: context.iceUfrag,
					fingerprint: {
						hash: (function() {
							// Convert it back
							var hash_base16 = baseConversion.baseConvert(context.fingerprint, 64, 16);
							// Separate each hex byte by a colon
							var hashByteColonSep = hash_base16.replace(/([0-9A-F]{2})(?=.)/g, '$1:');
							return hashByteColonSep;
						})(),
						type: 'sha-256'
					},

					// Media descriptions
					// Each one starts with m=
					media: [
						// This is the media description we care about because it is the data channel
						{
							type: "application",
							payloads: context.payloads,
							protocol: "DTLS/SCTP",
							port: context.port,
							connection: {
								ip: context.ip,
								version: 4
							},
							invalid: [
								{
									value: "sctpmap:5000 webrtc-datachannel 1024" // last thing could be 1024(chrome) or 16(firefox)
								}
							],
							setup: type == 'offer' ? 'actpass' : 'active',
							mid: "data",
							candidates: (function() {
								var newCandidateArray = [];
								context.candidates.forEach(function(candidate, index, array) {
									// Random number for foundation
									candidate.foundation = Math.round(Math.random()*50000)+50000;

									newCandidateArray.push(candidate);
								});

								return newCandidateArray;
							})()
						}
					]
				};



				// We only need a fake audio description for Chrome 38
				// You can actually avoid this if you add the following option as the third argument of `pc.createOffer(..., ..., options)`
				// Note: with Chrome 39 you don't need the mandatory thing there (and Mozilla deprecated it even and spits out nice warnings), so be prepared to remove it
				// Options: `{ mandatory: { OfferToReceiveAudio: false, OfferToReceiveVideo: false }}` 
				var browserInfo = window.navigator.appVersion.match(/(Chrom[e|ium])\/(\d*)/);
				var isChrome = false;
				var browserVersion = -1;
				if(browserInfo)
				{
					isChrome = browserInfo[1].length > 0;
					browserVersion = parseInt(browserInfo[2], 10);
				}

				if(isChrome && browserVersion == 38)
				{
					/* */
					// This extra audio media description is needed for chrome 38
					var chromeFakeAudioDesc = extend(true, {}, sdpTransformData.media[0]);
					chromeFakeAudioDesc.type = "audio";
					chromeFakeAudioDesc.mid = "audio";

					// Add to front of media array
					sdpTransformData.media.unshift(chromeFakeAudioDesc);
					/* */
				}

				return sdpTransformData;
			};
			/* */


			// Warn them if no type (`offer` or `answer`) is provided
			if(type == null)
			{
				console.warn('No type provided when restoring SDP from blob. This will most likely cause a failure to open a datachannel');
			}

			if(this.debug)
			{
				console.log('Restoring sdp from context', contextFromBlob);
			}

			// Convert the keys back to their full names
			var context = extend(true, {}, contextFromBlob);
			convertKeys(context, contextNameConversionLookup, true);

			// Compile the template given our context
			var compiledTransformSDPDescData = template_sdp(context);
			if(this.debug)
			{
				console.log("Restored compiled sdp context", compiledTransformSDPDescData);
			}

			var raw_description = {
				sdp: transform.write(compiledTransformSDPDescData),
				type: type
			};

			return new SessionDescription(raw_description);
		}

	};






	return SDPUtility;


}));
},{"./base-number-convert":2,"./convert-keys":3,"extend":8,"sdp-transform":11}],7:[function(_dereq_,module,exports){
"use strict";
var bigInt = (function () {
    var base = 10000000, logBase = 7;
    var sign = {
        positive: false,
        negative: true
    };

    function BigInteger(value, sign) {
        this.value = value;
        this.sign = sign;
    }

    function trim(value) {
        var i = value.length - 1;
        while (value[i] === 0 && i > 0) i--;
        return value.slice(0, i + 1);
    }

    function fastAdd(a, b) {
        var sign = b < 0;
        if (a.sign !== sign) {
            if(sign) return fastSubtract(a.abs(), -b);
            return fastSubtract(a.abs(), b).negate();
        }
        if (sign) b = -b;
        var value = a.value,
            result = [],
            carry = 0;
        for (var i = 0; i < value.length || carry > 0; i++) {
            var sum = (value[i] || 0) + (i > 0 ? 0 : b) + carry;
            carry = sum >= base ? 1 : 0;
            result.push(sum % base);
        }
        return new BigInteger(result, a.sign);
    }

    function fastSubtract(a, b) {
        if (a.sign !== (b < 0)) return fastAdd(a, -b);
        var sign = false;
        if (a.sign) sign = true;
        var value = a.value;
        if (value.length === 1 && value[0] < b) return new BigInteger([b - value[0]], !sign);
        if (sign) b = -b;
        var result = [],
            borrow = 0;
        for (var i = 0; i < value.length; i++) {
            var tmp = value[i] - borrow - (i > 0 ? 0 : b);
            borrow = tmp < 0 ? 1 : 0;
            result.push((borrow * base) + tmp);
        }

        return new BigInteger(result, sign);
    }

    function fastMultiply(a, b) {
        var value = a.value,
            sign = b < 0,
            result = [],
            carry = 0;
        if (sign) b = -b;
        for (var i = 0; i < value.length || carry > 0; i++) {
            var product = (value[i] || 0) * b + carry;
            carry = (product / base) | 0;
            result.push(product % base);
        }
        return new BigInteger(result, sign ? !a.sign : a.sign);
    }

    function fastDivMod(a, b) {
        if (b === 0) throw new Error("Cannot divide by zero.");
        var value = a.value,
            sign = b < 0,
            result = [],
            remainder = 0;
        if (sign) b = -b;
        for (var i = value.length - 1; i >= 0; i--) {
            var divisor = remainder * base + value[i];
            remainder = divisor % b;
            result.push(divisor / b | 0);
        }
        return {
            quotient: new BigInteger(trim(result.reverse()), sign ? !a.sign : a.sign),
            remainder: new BigInteger([remainder], a.sign)
        };
    }

    function isSmall(n) {
        return ((typeof n === "number" || typeof n === "string") && +n <= base) ||
            (n instanceof BigInteger && n.value.length <= 1);
    }

    BigInteger.prototype.negate = function () {
        return new BigInteger(this.value, !this.sign);
    };
    BigInteger.prototype.abs = function () {
        return new BigInteger(this.value, sign.positive);
    };
    BigInteger.prototype.add = function (n) {
        if(isSmall(n)) return fastAdd(this, +n);
        n = parseInput(n);
        if (this.sign !== n.sign) {
            if (this.sign === sign.positive) return this.abs().subtract(n.abs());
            return n.abs().subtract(this.abs());
        }
        var a = this.value, b = n.value;
        var result = [],
            carry = 0,
            length = Math.max(a.length, b.length);
        for (var i = 0; i < length || carry > 0; i++) {
            var sum = (a[i] || 0) + (b[i] || 0) + carry;
            carry = sum >= base ? 1 : 0;
            result.push(sum % base);
        }
        return new BigInteger(trim(result), this.sign);
    };
    BigInteger.prototype.plus = function (n) {
        return this.add(n);
    };
    BigInteger.prototype.subtract = function (n) {
        if (isSmall(n)) return fastSubtract(this, +n);
        n = parseInput(n);
        if (this.sign !== n.sign) return this.add(n.negate());
        if (this.sign === sign.negative) return n.negate().subtract(this.negate());
        if (this.compare(n) < 0) return n.subtract(this).negate();
        var a = this.value, b = n.value;
        var result = [],
            borrow = 0,
            length = Math.max(a.length, b.length);
        for (var i = 0; i < length; i++) {
            var ai = a[i] || 0, bi = b[i] || 0;
            var tmp = ai - borrow;
            borrow = tmp < bi ? 1 : 0;
            result.push((borrow * base) + tmp - bi);
        }
        return new BigInteger(trim(result), sign.positive);
    };
    BigInteger.prototype.minus = function (n) {
        return this.subtract(n);
    };
    BigInteger.prototype.multiply = function (n) {
        if (isSmall(n)) return fastMultiply(this, +n);
        n = parseInput(n);
        var sign = this.sign !== n.sign;

        var a = this.value, b = n.value;
        var length = Math.max(a.length, b.length);
        var resultSum = [];
        for (var i = 0; i < length; i++) {
            resultSum[i] = [];
            var j = i;
            while (j--) {
                resultSum[i].push(0);
            }
        }
        var carry = 0;
        for (var i = 0; i < a.length; i++) {
            var x = a[i];
            for (var j = 0; j < b.length || carry > 0; j++) {
                var y = b[j];
                var product = y ? (x * y) + carry : carry;
                carry = Math.floor(product / base);
                resultSum[i].push(product % base);
            }
        }
        var max = -1;
        for (var i = 0; i < resultSum.length; i++) {
            var len = resultSum[i].length;
            if (len > max) max = len;
        }
        var result = [], carry = 0;
        for (var i = 0; i < max || carry > 0; i++) {
            var sum = carry;
            for (var j = 0; j < resultSum.length; j++) {
                sum += resultSum[j][i] || 0;
            }
            carry = sum > base ? Math.floor(sum / base) : 0;
            sum -= carry * base;
            result.push(sum);
        }
        return new BigInteger(trim(result), sign);
    };
    BigInteger.prototype.times = function (n) {
        return this.multiply(n);
    };
    BigInteger.prototype.divmod = function (n) {
        if (isSmall(n)) return fastDivMod(this, +n);
        n = parseInput(n);
        var quotientSign = this.sign !== n.sign;
        if (this.equals(0)) return {
            quotient: new BigInteger([0], sign.positive),
            remainder: new BigInteger([0], sign.positive)
        };
        if (n.equals(0)) throw new Error("Cannot divide by zero");
        var a = this.value, b = n.value;
        var result = [], remainder = [];
        for (var i = a.length - 1; i >= 0; i--) {
            var m = [a[i]].concat(remainder);
            var quotient = goesInto(b, m);
            result.push(quotient.result);
            remainder = quotient.remainder;
        }
        result.reverse();
        return {
            quotient: new BigInteger(trim(result), quotientSign),
            remainder: new BigInteger(trim(remainder), this.sign)
        };
    };
    BigInteger.prototype.divide = function (n) {
        return this.divmod(n).quotient;
    };
    BigInteger.prototype.over = function (n) {
        return this.divide(n);
    };
    BigInteger.prototype.mod = function (n) {
        return this.divmod(n).remainder;
    };
    BigInteger.prototype.remainder = function (n) {
        return this.mod(n);
    };
    BigInteger.prototype.pow = function (n) {
        n = parseInput(n);
        var a = this, b = n, r = ONE;
        if (b.equals(ZERO)) return r;
        if (a.equals(ZERO) || b.lesser(ZERO)) return ZERO;
        while (true) {
            if (b.isOdd()) {
                r = r.times(a);
            }
            b = b.divide(2);
            if (b.equals(ZERO)) break;
            a = a.times(a);
        }
        return r;
    };
    BigInteger.prototype.modPow = function (exp, mod) {
        exp = parseInput(exp);
        mod = parseInput(mod);
        if (mod.equals(ZERO)) throw new Error("Cannot take modPow with modulus 0");
        var r = ONE,
            base = this.mod(mod);
        if (base.equals(ZERO)) return ZERO;
        while (exp.greater(0)) {
            if (exp.isOdd()) r = r.multiply(base).mod(mod);
            exp = exp.divide(2);
            base = base.square().mod(mod);
        }
        return r;
    };
    BigInteger.prototype.square = function () {
        return this.multiply(this);
    };
    function gcd(a, b) {
        a = parseInput(a).abs();
        b = parseInput(b).abs();
        if (a.equals(b)) return a;
        if (a.equals(ZERO)) return b;
        if (b.equals(ZERO)) return a;
        if (a.isEven()) {
            if (b.isOdd()) {
                return gcd(a.divide(2), b);
            }
            return gcd(a.divide(2), b.divide(2)).multiply(2);
        }
        if (b.isEven()) {
            return gcd(a, b.divide(2));
        }
        if (a.greater(b)) {
            return gcd(a.subtract(b).divide(2), b);
        }
        return gcd(b.subtract(a).divide(2), a);
    }
    function lcm(a, b) {
        a = parseInput(a).abs();
        b = parseInput(b).abs();
        return a.multiply(b).divide(gcd(a, b));
    }
    BigInteger.prototype.next = function () {
        return fastAdd(this, 1);
    };
    BigInteger.prototype.prev = function () {
        return fastSubtract(this, 1);
    };
    BigInteger.prototype.compare = function (n) {
        var first = this, second = parseInput(n);
        if (first.value.length === 1 && second.value.length === 1 && first.value[0] === 0 && second.value[0] === 0) return 0;
        if (second.sign !== first.sign) return first.sign === sign.positive ? 1 : -1;
        var multiplier = first.sign === sign.positive ? 1 : -1;
        var a = first.value, b = second.value,
            length = Math.max(a.length, b.length) - 1;
        for (var i = length; i >= 0; i--) {
            var ai = (a[i] || 0), bi = (b[i] || 0);
            if (ai > bi) return 1 * multiplier;
            if (bi > ai) return -1 * multiplier;
        }
        return 0;
    };
    BigInteger.prototype.compareTo = function (n) {
        return this.compare(n);
    };
    BigInteger.prototype.compareAbs = function (n) {
        return this.abs().compare(n.abs());
    };
    BigInteger.prototype.equals = function (n) {
        return this.compare(n) === 0;
    };
    BigInteger.prototype.notEquals = function (n) {
        return !this.equals(n);
    };
    BigInteger.prototype.lesser = function (n) {
        return this.compare(n) < 0;
    };
    BigInteger.prototype.greater = function (n) {
        return this.compare(n) > 0;
    };
    BigInteger.prototype.greaterOrEquals = function (n) {
        return this.compare(n) >= 0;
    };
    BigInteger.prototype.lesserOrEquals = function (n) {
        return this.compare(n) <= 0;
    };

    BigInteger.prototype.lt = BigInteger.prototype.lesser;
    BigInteger.prototype.leq = BigInteger.prototype.lesserOrEquals;
    BigInteger.prototype.gt = BigInteger.prototype.greater;
    BigInteger.prototype.geq = BigInteger.prototype.greaterOrEquals;
    BigInteger.prototype.eq = BigInteger.prototype.equals;
    BigInteger.prototype.neq = BigInteger.prototype.notEquals;

    function max (a, b) {
        a = parseInput(a);
        b = parseInput(b);
        return a.greater(b) ? a : b;
    }
    function min (a, b) {
        a = parseInput(a);
        b = parseInput(b);
        return a.lesser(b) ? a : b;
    }
    BigInteger.prototype.isPositive = function () {
        return this.sign === sign.positive;
    };
    BigInteger.prototype.isNegative = function () {
        return this.sign === sign.negative;
    };
    BigInteger.prototype.isEven = function () {
        return this.value[0] % 2 === 0;
    };
    BigInteger.prototype.isOdd = function () {
        return this.value[0] % 2 === 1;
    };
    BigInteger.prototype.isUnit = function () {
        return this.value.length === 1 && this.value[0] === 1;
    };
    BigInteger.prototype.isDivisibleBy = function (n) {
        return this.mod(n).equals(ZERO);
    };
    BigInteger.prototype.isPrime = function () {
        var n = this.abs(),
            nPrev = n.prev();
        if (n.isUnit()) return false;
        if (n.equals(2) || n.equals(3) || n.equals(5)) return true;
        if (n.isEven() || n.isDivisibleBy(3) || n.isDivisibleBy(5)) return false;
        if (n.lesser(25)) return true;
        var a = [2, 3, 5, 7, 11, 13, 17, 19],
            b = nPrev,
            d, t, i, x;
        while (b.isEven()) b = b.divide(2);
        for (i = 0; i < a.length; i++) {
            x = bigInt(a[i]).modPow(b, n);
            if (x.equals(ONE) || x.equals(nPrev)) continue;
            for (t = true, d = b; t && d.lesser(nPrev); d = d.multiply(2)) {
                x = x.square().mod(n);
                if (x.equals(nPrev)) t = false;
            }
            if (t) return false;
        }
        return true;
    };
    function randBetween (a, b) {
        a = parseInput(a);
        b = parseInput(b);
        var low = min(a, b), high = max(a, b);
        var range = high.subtract(low);
        var length = range.value.length - 1;
        var result = [], restricted = true;
        for (var i = length; i >= 0; i--) {
            var top = restricted ? range.value[i] : base;
            var digit = Math.floor(Math.random() * top);
            result.unshift(digit);
            if (digit < top) restricted = false;
        }
        return low.add(new BigInteger(result, false));
    }

    var powersOfTwo = [1];
    while (powersOfTwo[powersOfTwo.length - 1] <= base) powersOfTwo.push(2 * powersOfTwo[powersOfTwo.length - 1]);
    var powers2Length = powersOfTwo.length, highestPower2 = powersOfTwo[powers2Length - 1];

    BigInteger.prototype.shiftLeft = function (n) {
        if (!isSmall(n)) {
            if (n.isNegative()) return this.shiftRight(n.abs());
            return this.times(bigInt(2).pow(n));
        }
        n = +n;
        if (n < 0) return this.shiftRight(-n);
        var result = this;
        while (n >= powers2Length) {
            result = fastMultiply(result, highestPower2);
            n -= powers2Length - 1;
        }
        return fastMultiply(result, powersOfTwo[n]);
    };

    BigInteger.prototype.shiftRight = function (n) {
        if (!isSmall(n)) {
            if (n.isNegative()) return this.shiftLeft(n.abs());
            return this.over(bigInt(2).pow(n));
        }
        n = +n;
        if (n < 0) return this.shiftLeft(-n);
        var result = this;
        while (n >= powers2Length) {
            if (result.equals(ZERO)) return result;
            result = fastDivMod(result, highestPower2).quotient;
            n -= powers2Length - 1;
        }
        return fastDivMod(result, powersOfTwo[n]).quotient;
    };

    // Reference: http://en.wikipedia.org/wiki/Bitwise_operation#Mathematical_equivalents
    function bitwise(x, y, fn) {
        var sum = ZERO;
        var limit = max(x.abs(), y.abs());
        var n = 0, _2n = ONE;
        while (_2n.lesserOrEquals(limit)) {
            var xMod, yMod;
            xMod = x.over(_2n).isEven() ? 0 : 1;
            yMod = y.over(_2n).isEven() ? 0 : 1;

            sum = sum.add(_2n.times(fn(xMod, yMod)));

            _2n = fastMultiply(_2n, 2);
        }
        return sum;
    }

    BigInteger.prototype.not = function () {
        var body = bitwise(this, this, function (xMod) { return (xMod + 1) % 2; });
        return !this.sign ? body.negate() : body;
    };

    BigInteger.prototype.and = function (n) {
        n = parseInput(n);
        var body = bitwise(this, n, function (xMod, yMod) { return xMod * yMod; });
        return this.sign && n.sign ? body.negate() : body;
    };

    BigInteger.prototype.or = function (n) {
        n = parseInput(n);
        var body = bitwise(this, n, function (xMod, yMod) { return (xMod + yMod + xMod * yMod) % 2 });
        return this.sign || n.sign ? body.negate() : body;
    };

    BigInteger.prototype.xor = function (n) {
        n = parseInput(n);
        var body = bitwise(this, n, function (xMod, yMod) { return (xMod + yMod) % 2; });
        return this.sign ^ n.sign ? body.negate() : body;
    };

    BigInteger.prototype.toString = function (radix) {
        if (radix === undefined) {
            radix = 10;
        }
        if (radix !== 10) return toBase(this, radix);
        var first = this;
        var str = "", len = first.value.length;
        if (len === 0) {
            return "0";
        }
        while (len--) {
            if (first.value[len].toString().length === 8) str += first.value[len];
            else str += (base.toString() + first.value[len]).slice(-logBase);
        }
        while (str[0] === "0") {
            str = str.slice(1);
        }
        if (!str.length) str = "0";
        if (str === "0") return str;
        var s = first.sign === sign.positive ? "" : "-";
        return s + str;
    };
    BigInteger.prototype.toJSNumber = function () {
        return this.valueOf();
    };
    BigInteger.prototype.valueOf = function () {
        if (this.value.length === 1) return this.sign ? -this.value[0] : this.value[0];
        return +this.toString();
    };

    var goesInto = function (a, b) {
        var a = new BigInteger(a, sign.positive), b = new BigInteger(b, sign.positive);
        if (a.equals(0)) throw new Error("Cannot divide by 0");
        var n = 0;
        do {
            var inc = 1;
            var c = a, t = c.times(10);
            while (t.lesser(b)) {
                c = t;
                inc *= 10;
                t = t.times(10);
            }
            while (c.lesserOrEquals(b)) {
                b = b.minus(c);
                n += inc;
            }
        } while (a.lesserOrEquals(b));

        return {
            remainder: b.value,
            result: n
        };
    };

    var ZERO = new BigInteger([0], sign.positive);
    var ONE = new BigInteger([1], sign.positive);
    var MINUS_ONE = new BigInteger([1], sign.negative);


    function parseInput(text) {
        if (text instanceof BigInteger) return text;
        if (Math.abs(+text) < base && +text === (+text | 0)) {
            var value = +text;
            return new BigInteger([Math.abs(value)], (value < 0 || (1 / value) === -Infinity));
        }
        text += "";
        var s = sign.positive, value = [];
        if (text[0] === "-") {
            s = sign.negative;
            text = text.slice(1);
        }
        var text = text.split(/e/i);
        if (text.length > 2) throw new Error("Invalid integer: " + text.join("e"));
        if (text[1]) {
            var exp = text[1];
            if (exp[0] === "+") exp = exp.slice(1);
            exp = parseInput(exp);
            if (exp.lesser(0)) throw new Error("Cannot include negative exponent part for integers");
            while (exp.notEquals(0)) {
                text[0] += "0";
                exp = exp.prev();
            }
        }
        text = text[0];
        if (text === "-0") text = "0";
        var isValid = /^([0-9][0-9]*)$/.test(text);
        if (!isValid) throw new Error("Invalid integer: " + text);
        while (text.length) {
            var divider = text.length > logBase ? text.length - logBase : 0;
            value.push(+text.slice(divider));
            text = text.slice(0, divider);
        }
        return new BigInteger(value, s);
    }

    var parseBase = function (text, base) {
        base = parseInput(base);
        var val = ZERO;
        var digits = [];
        var i;
        var isNegative = false;
        function parseToken(text) {
            var c = text[i].toLowerCase();
            if (i === 0 && text[i] === "-") {
                isNegative = true;
                return;
            }
            if (/[0-9]/.test(c)) digits.push(parseInput(c));
            else if (/[a-z]/.test(c)) digits.push(parseInput(c.charCodeAt(0) - 87));
            else if (c === "<") {
                var start = i;
                do { i++; } while (text[i] !== ">");
                digits.push(parseInput(text.slice(start + 1, i)));
            }
            else throw new Error(c + " is not a valid character");
        }
        for (i = 0; i < text.length; i++) {
            parseToken(text);
        }
        digits.reverse();
        for (i = 0; i < digits.length; i++) {
            val = val.add(digits[i].times(base.pow(i)));
        }
        return isNegative ? val.negate() : val;
    };

    function stringify(digit) {
        var v = digit.value;
        if (v.length === 1 && v[0] <= 36) {
            return "0123456789abcdefghijklmnopqrstuvwxyz".charAt(v[0]);
        }
        return "<" + v + ">";
    }

    function toBase(n, base) {
        base = bigInt(base);
        if (base.equals(0)) {
            if (n.equals(0)) return "0";
            throw new Error("Cannot convert nonzero numbers to base 0.");
        }
        if (base.equals(-1)) {
            if (n.equals(0)) return "0";
            if (n.lesser(0)) return Array(1 - n).join("10");
            return "1" + Array(+n).join("01");
        }
        var minusSign = "";
        if (n.isNegative() && base.isPositive()) {
            minusSign = "-";
            n = n.abs();
        }
        if (base.equals(1)) {
            if (n.equals(0)) return "0";
            return minusSign + Array(+n + 1).join(1);
        }
        var out = [];
        var left = n, divmod;
        while (left.lesser(0) || left.compareAbs(base) >= 0) {
            divmod = left.divmod(base);
            left = divmod.quotient;
            var digit = divmod.remainder;
            if (digit.lesser(0)) {
                digit = base.minus(digit).abs();
                left = left.next();
            }
            out.push(stringify(digit));
        }
        out.push(stringify(left));
        return minusSign + out.reverse().join("");
    }

    var fnReturn = function (a, b) {
        if (typeof a === "undefined") return ZERO;
        if (typeof b !== "undefined") return parseBase(a, b);
        return parseInput(a);
    };
    fnReturn.zero = ZERO;
    fnReturn.one = ONE;
    fnReturn.minusOne = MINUS_ONE;
    fnReturn.randBetween = randBetween;
    fnReturn.min = min;
    fnReturn.max = max;
    fnReturn.gcd = gcd;
    fnReturn.lcm = lcm;
    return fnReturn;
})();

if (typeof module !== "undefined") {
    module.exports = bigInt;
}

},{}],8:[function(_dereq_,module,exports){
var hasOwn = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;
var undefined;

var isPlainObject = function isPlainObject(obj) {
	'use strict';
	if (!obj || toString.call(obj) !== '[object Object]') {
		return false;
	}

	var has_own_constructor = hasOwn.call(obj, 'constructor');
	var has_is_property_of_method = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
	// Not own constructor property must be Object
	if (obj.constructor && !has_own_constructor && !has_is_property_of_method) {
		return false;
	}

	// Own properties are enumerated firstly, so to speed up,
	// if last one is own, then all properties are own.
	var key;
	for (key in obj) {}

	return key === undefined || hasOwn.call(obj, key);
};

module.exports = function extend() {
	'use strict';
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[0],
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if (typeof target === 'boolean') {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	} else if ((typeof target !== 'object' && typeof target !== 'function') || target == null) {
		target = {};
	}

	for (; i < length; ++i) {
		options = arguments[i];
		// Only deal with non-null/undefined values
		if (options != null) {
			// Extend the base object
			for (name in options) {
				src = target[name];
				copy = options[name];

				// Prevent never-ending loop
				if (target === copy) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if (deep && copy && (isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))) {
					if (copyIsArray) {
						copyIsArray = false;
						clone = src && Array.isArray(src) ? src : [];
					} else {
						clone = src && isPlainObject(src) ? src : {};
					}

					// Never move original objects, clone them
					target[name] = extend(deep, clone, copy);

				// Don't bring in undefined values
				} else if (copy !== undefined) {
					target[name] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};


},{}],9:[function(_dereq_,module,exports){
// Copyright (c) 2013 Pieroxy <pieroxy@pieroxy.net>
// This work is free. You can redistribute it and/or modify it
// under the terms of the WTFPL, Version 2
// For more information see LICENSE.txt or http://www.wtfpl.net/
//
// For more information, the home page:
// http://pieroxy.net/blog/pages/lz-string/testing.html
//
// LZ-based compression algorithm, version 1.3.3
var LZString = {
  
  
  // private property
  _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
  _f : String.fromCharCode,
  
  compressToBase64 : function (input) {
    if (input == null) return "";
    var output = "";
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    var i = 0;
    
    input = LZString.compress(input);
    
    while (i < input.length*2) {
      
      if (i%2==0) {
        chr1 = input.charCodeAt(i/2) >> 8;
        chr2 = input.charCodeAt(i/2) & 255;
        if (i/2+1 < input.length) 
          chr3 = input.charCodeAt(i/2+1) >> 8;
        else 
          chr3 = NaN;
      } else {
        chr1 = input.charCodeAt((i-1)/2) & 255;
        if ((i+1)/2 < input.length) {
          chr2 = input.charCodeAt((i+1)/2) >> 8;
          chr3 = input.charCodeAt((i+1)/2) & 255;
        } else 
          chr2=chr3=NaN;
      }
      i+=3;
      
      enc1 = chr1 >> 2;
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      enc4 = chr3 & 63;
      
      if (isNaN(chr2)) {
        enc3 = enc4 = 64;
      } else if (isNaN(chr3)) {
        enc4 = 64;
      }
      
      output = output +
        LZString._keyStr.charAt(enc1) + LZString._keyStr.charAt(enc2) +
          LZString._keyStr.charAt(enc3) + LZString._keyStr.charAt(enc4);
      
    }
    
    return output;
  },
  
  decompressFromBase64 : function (input) {
    if (input == null) return "";
    var output = "",
        ol = 0, 
        output_,
        chr1, chr2, chr3,
        enc1, enc2, enc3, enc4,
        i = 0, f=LZString._f;
    
    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
    
    while (i < input.length) {
      
      enc1 = LZString._keyStr.indexOf(input.charAt(i++));
      enc2 = LZString._keyStr.indexOf(input.charAt(i++));
      enc3 = LZString._keyStr.indexOf(input.charAt(i++));
      enc4 = LZString._keyStr.indexOf(input.charAt(i++));
      
      chr1 = (enc1 << 2) | (enc2 >> 4);
      chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      chr3 = ((enc3 & 3) << 6) | enc4;
      
      if (ol%2==0) {
        output_ = chr1 << 8;
        
        if (enc3 != 64) {
          output += f(output_ | chr2);
        }
        if (enc4 != 64) {
          output_ = chr3 << 8;
        }
      } else {
        output = output + f(output_ | chr1);
        
        if (enc3 != 64) {
          output_ = chr2 << 8;
        }
        if (enc4 != 64) {
          output += f(output_ | chr3);
        }
      }
      ol+=3;
    }
    
    return LZString.decompress(output);
    
  },

  compressToUTF16 : function (input) {
    if (input == null) return "";
    var output = "",
        i,c,
        current,
        status = 0,
        f = LZString._f;
    
    input = LZString.compress(input);
    
    for (i=0 ; i<input.length ; i++) {
      c = input.charCodeAt(i);
      switch (status++) {
        case 0:
          output += f((c >> 1)+32);
          current = (c & 1) << 14;
          break;
        case 1:
          output += f((current + (c >> 2))+32);
          current = (c & 3) << 13;
          break;
        case 2:
          output += f((current + (c >> 3))+32);
          current = (c & 7) << 12;
          break;
        case 3:
          output += f((current + (c >> 4))+32);
          current = (c & 15) << 11;
          break;
        case 4:
          output += f((current + (c >> 5))+32);
          current = (c & 31) << 10;
          break;
        case 5:
          output += f((current + (c >> 6))+32);
          current = (c & 63) << 9;
          break;
        case 6:
          output += f((current + (c >> 7))+32);
          current = (c & 127) << 8;
          break;
        case 7:
          output += f((current + (c >> 8))+32);
          current = (c & 255) << 7;
          break;
        case 8:
          output += f((current + (c >> 9))+32);
          current = (c & 511) << 6;
          break;
        case 9:
          output += f((current + (c >> 10))+32);
          current = (c & 1023) << 5;
          break;
        case 10:
          output += f((current + (c >> 11))+32);
          current = (c & 2047) << 4;
          break;
        case 11:
          output += f((current + (c >> 12))+32);
          current = (c & 4095) << 3;
          break;
        case 12:
          output += f((current + (c >> 13))+32);
          current = (c & 8191) << 2;
          break;
        case 13:
          output += f((current + (c >> 14))+32);
          current = (c & 16383) << 1;
          break;
        case 14:
          output += f((current + (c >> 15))+32, (c & 32767)+32);
          status = 0;
          break;
      }
    }
    
    return output + f(current + 32);
  },
  

  decompressFromUTF16 : function (input) {
    if (input == null) return "";
    var output = "",
        current,c,
        status=0,
        i = 0,
        f = LZString._f;
    
    while (i < input.length) {
      c = input.charCodeAt(i) - 32;
      
      switch (status++) {
        case 0:
          current = c << 1;
          break;
        case 1:
          output += f(current | (c >> 14));
          current = (c&16383) << 2;
          break;
        case 2:
          output += f(current | (c >> 13));
          current = (c&8191) << 3;
          break;
        case 3:
          output += f(current | (c >> 12));
          current = (c&4095) << 4;
          break;
        case 4:
          output += f(current | (c >> 11));
          current = (c&2047) << 5;
          break;
        case 5:
          output += f(current | (c >> 10));
          current = (c&1023) << 6;
          break;
        case 6:
          output += f(current | (c >> 9));
          current = (c&511) << 7;
          break;
        case 7:
          output += f(current | (c >> 8));
          current = (c&255) << 8;
          break;
        case 8:
          output += f(current | (c >> 7));
          current = (c&127) << 9;
          break;
        case 9:
          output += f(current | (c >> 6));
          current = (c&63) << 10;
          break;
        case 10:
          output += f(current | (c >> 5));
          current = (c&31) << 11;
          break;
        case 11:
          output += f(current | (c >> 4));
          current = (c&15) << 12;
          break;
        case 12:
          output += f(current | (c >> 3));
          current = (c&7) << 13;
          break;
        case 13:
          output += f(current | (c >> 2));
          current = (c&3) << 14;
          break;
        case 14:
          output += f(current | (c >> 1));
          current = (c&1) << 15;
          break;
        case 15:
          output += f(current | c);
          status=0;
          break;
      }
      
      
      i++;
    }
    
    return LZString.decompress(output);
    //return output;
    
  },


  
  compress: function (uncompressed) {
    if (uncompressed == null) return "";
    var i, value,
        context_dictionary= {},
        context_dictionaryToCreate= {},
        context_c="",
        context_wc="",
        context_w="",
        context_enlargeIn= 2, // Compensate for the first entry which should not count
        context_dictSize= 3,
        context_numBits= 2,
        context_data_string="", 
        context_data_val=0, 
        context_data_position=0,
        ii,
        f=LZString._f;
    
    for (ii = 0; ii < uncompressed.length; ii += 1) {
      context_c = uncompressed.charAt(ii);
      if (!Object.prototype.hasOwnProperty.call(context_dictionary,context_c)) {
        context_dictionary[context_c] = context_dictSize++;
        context_dictionaryToCreate[context_c] = true;
      }
      
      context_wc = context_w + context_c;
      if (Object.prototype.hasOwnProperty.call(context_dictionary,context_wc)) {
        context_w = context_wc;
      } else {
        if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate,context_w)) {
          if (context_w.charCodeAt(0)<256) {
            for (i=0 ; i<context_numBits ; i++) {
              context_data_val = (context_data_val << 1);
              if (context_data_position == 15) {
                context_data_position = 0;
                context_data_string += f(context_data_val);
                context_data_val = 0;
              } else {
                context_data_position++;
              }
            }
            value = context_w.charCodeAt(0);
            for (i=0 ; i<8 ; i++) {
              context_data_val = (context_data_val << 1) | (value&1);
              if (context_data_position == 15) {
                context_data_position = 0;
                context_data_string += f(context_data_val);
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = value >> 1;
            }
          } else {
            value = 1;
            for (i=0 ; i<context_numBits ; i++) {
              context_data_val = (context_data_val << 1) | value;
              if (context_data_position == 15) {
                context_data_position = 0;
                context_data_string += f(context_data_val);
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = 0;
            }
            value = context_w.charCodeAt(0);
            for (i=0 ; i<16 ; i++) {
              context_data_val = (context_data_val << 1) | (value&1);
              if (context_data_position == 15) {
                context_data_position = 0;
                context_data_string += f(context_data_val);
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = value >> 1;
            }
          }
          context_enlargeIn--;
          if (context_enlargeIn == 0) {
            context_enlargeIn = Math.pow(2, context_numBits);
            context_numBits++;
          }
          delete context_dictionaryToCreate[context_w];
        } else {
          value = context_dictionary[context_w];
          for (i=0 ; i<context_numBits ; i++) {
            context_data_val = (context_data_val << 1) | (value&1);
            if (context_data_position == 15) {
              context_data_position = 0;
              context_data_string += f(context_data_val);
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }
          
          
        }
        context_enlargeIn--;
        if (context_enlargeIn == 0) {
          context_enlargeIn = Math.pow(2, context_numBits);
          context_numBits++;
        }
        // Add wc to the dictionary.
        context_dictionary[context_wc] = context_dictSize++;
        context_w = String(context_c);
      }
    }
    
    // Output the code for w.
    if (context_w !== "") {
      if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate,context_w)) {
        if (context_w.charCodeAt(0)<256) {
          for (i=0 ; i<context_numBits ; i++) {
            context_data_val = (context_data_val << 1);
            if (context_data_position == 15) {
              context_data_position = 0;
              context_data_string += f(context_data_val);
              context_data_val = 0;
            } else {
              context_data_position++;
            }
          }
          value = context_w.charCodeAt(0);
          for (i=0 ; i<8 ; i++) {
            context_data_val = (context_data_val << 1) | (value&1);
            if (context_data_position == 15) {
              context_data_position = 0;
              context_data_string += f(context_data_val);
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }
        } else {
          value = 1;
          for (i=0 ; i<context_numBits ; i++) {
            context_data_val = (context_data_val << 1) | value;
            if (context_data_position == 15) {
              context_data_position = 0;
              context_data_string += f(context_data_val);
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = 0;
          }
          value = context_w.charCodeAt(0);
          for (i=0 ; i<16 ; i++) {
            context_data_val = (context_data_val << 1) | (value&1);
            if (context_data_position == 15) {
              context_data_position = 0;
              context_data_string += f(context_data_val);
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }
        }
        context_enlargeIn--;
        if (context_enlargeIn == 0) {
          context_enlargeIn = Math.pow(2, context_numBits);
          context_numBits++;
        }
        delete context_dictionaryToCreate[context_w];
      } else {
        value = context_dictionary[context_w];
        for (i=0 ; i<context_numBits ; i++) {
          context_data_val = (context_data_val << 1) | (value&1);
          if (context_data_position == 15) {
            context_data_position = 0;
            context_data_string += f(context_data_val);
            context_data_val = 0;
          } else {
            context_data_position++;
          }
          value = value >> 1;
        }
        
        
      }
      context_enlargeIn--;
      if (context_enlargeIn == 0) {
        context_enlargeIn = Math.pow(2, context_numBits);
        context_numBits++;
      }
    }
    
    // Mark the end of the stream
    value = 2;
    for (i=0 ; i<context_numBits ; i++) {
      context_data_val = (context_data_val << 1) | (value&1);
      if (context_data_position == 15) {
        context_data_position = 0;
        context_data_string += f(context_data_val);
        context_data_val = 0;
      } else {
        context_data_position++;
      }
      value = value >> 1;
    }
    
    // Flush the last char
    while (true) {
      context_data_val = (context_data_val << 1);
      if (context_data_position == 15) {
        context_data_string += f(context_data_val);
        break;
      }
      else context_data_position++;
    }
    return context_data_string;
  },
  
  decompress: function (compressed) {
    if (compressed == null) return "";
    if (compressed == "") return null;
    var dictionary = [],
        next,
        enlargeIn = 4,
        dictSize = 4,
        numBits = 3,
        entry = "",
        result = "",
        i,
        w,
        bits, resb, maxpower, power,
        c,
        f = LZString._f,
        data = {string:compressed, val:compressed.charCodeAt(0), position:32768, index:1};
    
    for (i = 0; i < 3; i += 1) {
      dictionary[i] = i;
    }
    
    bits = 0;
    maxpower = Math.pow(2,2);
    power=1;
    while (power!=maxpower) {
      resb = data.val & data.position;
      data.position >>= 1;
      if (data.position == 0) {
        data.position = 32768;
        data.val = data.string.charCodeAt(data.index++);
      }
      bits |= (resb>0 ? 1 : 0) * power;
      power <<= 1;
    }
    
    switch (next = bits) {
      case 0: 
          bits = 0;
          maxpower = Math.pow(2,8);
          power=1;
          while (power!=maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = 32768;
              data.val = data.string.charCodeAt(data.index++);
            }
            bits |= (resb>0 ? 1 : 0) * power;
            power <<= 1;
          }
        c = f(bits);
        break;
      case 1: 
          bits = 0;
          maxpower = Math.pow(2,16);
          power=1;
          while (power!=maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = 32768;
              data.val = data.string.charCodeAt(data.index++);
            }
            bits |= (resb>0 ? 1 : 0) * power;
            power <<= 1;
          }
        c = f(bits);
        break;
      case 2: 
        return "";
    }
    dictionary[3] = c;
    w = result = c;
    while (true) {
      if (data.index > data.string.length) {
        return "";
      }
      
      bits = 0;
      maxpower = Math.pow(2,numBits);
      power=1;
      while (power!=maxpower) {
        resb = data.val & data.position;
        data.position >>= 1;
        if (data.position == 0) {
          data.position = 32768;
          data.val = data.string.charCodeAt(data.index++);
        }
        bits |= (resb>0 ? 1 : 0) * power;
        power <<= 1;
      }

      switch (c = bits) {
        case 0: 
          bits = 0;
          maxpower = Math.pow(2,8);
          power=1;
          while (power!=maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = 32768;
              data.val = data.string.charCodeAt(data.index++);
            }
            bits |= (resb>0 ? 1 : 0) * power;
            power <<= 1;
          }

          dictionary[dictSize++] = f(bits);
          c = dictSize-1;
          enlargeIn--;
          break;
        case 1: 
          bits = 0;
          maxpower = Math.pow(2,16);
          power=1;
          while (power!=maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = 32768;
              data.val = data.string.charCodeAt(data.index++);
            }
            bits |= (resb>0 ? 1 : 0) * power;
            power <<= 1;
          }
          dictionary[dictSize++] = f(bits);
          c = dictSize-1;
          enlargeIn--;
          break;
        case 2: 
          return result;
      }
      
      if (enlargeIn == 0) {
        enlargeIn = Math.pow(2, numBits);
        numBits++;
      }
      
      if (dictionary[c]) {
        entry = dictionary[c];
      } else {
        if (c === dictSize) {
          entry = w + w.charAt(0);
        } else {
          return null;
        }
      }
      result += entry;
      
      // Add w+entry[0] to the dictionary.
      dictionary[dictSize++] = w + entry.charAt(0);
      enlargeIn--;
      
      w = entry;
      
      if (enlargeIn == 0) {
        enlargeIn = Math.pow(2, numBits);
        numBits++;
      }
      
    }
  }
};

if( typeof module !== 'undefined' && module != null ) {
  module.exports = LZString
}

},{}],10:[function(_dereq_,module,exports){
var grammar = module.exports = {
  v: [{
      name: 'version',
      reg: /^(\d*)$/
  }],
  o: [{ //o=- 20518 0 IN IP4 203.0.113.1
    // NB: sessionId will be a String in most cases because it is huge
    name: 'origin',
    reg: /^(\S*) (\d*) (\d*) (\S*) IP(\d) (\S*)/,
    names: ['username', 'sessionId', 'sessionVersion', 'netType', 'ipVer', 'address'],
    format: "%s %s %d %s IP%d %s"
  }],
  // default parsing of these only (though some of these feel outdated)
  s: [{ name: 'name' }],
  i: [{ name: 'description' }],
  u: [{ name: 'uri' }],
  e: [{ name: 'email' }],
  p: [{ name: 'phone' }],
  z: [{ name: 'timezones' }], // TODO: this one can actually be parsed properly..
  r: [{ name: 'repeats' }],   // TODO: this one can also be parsed properly
  //k: [{}], // outdated thing ignored
  t: [{ //t=0 0
    name: 'timing',
    reg: /^(\d*) (\d*)/,
    names: ['start', 'stop'],
    format: "%d %d"
  }],
  c: [{ //c=IN IP4 10.47.197.26
      name: 'connection',
      reg: /^IN IP(\d) (\S*)/,
      names: ['version', 'ip'],
      format: "IN IP%d %s"
  }],
  b: [{ //b=AS:4000
      push: 'bandwidth',
      reg: /^(TIAS|AS|CT|RR|RS):(\d*)/,
      names: ['type', 'limit'],
      format: "%s:%s"
  }],
  m: [{ //m=video 51744 RTP/AVP 126 97 98 34 31
      // NB: special - pushes to session
      // TODO: rtp/fmtp should be filtered by the payloads found here?
      reg: /^(\w*) (\d*) ([\w\/]*)(?: (.*))?/,
      names: ['type', 'port', 'protocol', 'payloads'],
      format: "%s %d %s %s"
  }],
  a: [
    { //a=rtpmap:110 opus/48000/2
      push: 'rtp',
      reg: /^rtpmap:(\d*) ([\w\-]*)\/(\d*)(?:\s*\/(\S*))?/,
      names: ['payload', 'codec', 'rate', 'encoding'],
      format: function (o) {
        return (o.encoding) ?
          "rtpmap:%d %s/%s/%s":
          "rtpmap:%d %s/%s";
      }
    },
    { //a=fmtp:108 profile-level-id=24;object=23;bitrate=64000
      push: 'fmtp',
      reg: /^fmtp:(\d*) (\S*)/,
      names: ['payload', 'config'],
      format: "fmtp:%d %s"
    },
    { //a=control:streamid=0
        name: 'control',
        reg: /^control:(.*)/,
        format: "control:%s"
    },
    { //a=rtcp:65179 IN IP4 193.84.77.194
      name: 'rtcp',
      reg: /^rtcp:(\d*)(?: (\S*) IP(\d) (\S*))?/,
      names: ['port', 'netType', 'ipVer', 'address'],
      format: function (o) {
        return (o.address != null) ?
          "rtcp:%d %s IP%d %s":
          "rtcp:%d";
      }
    },
    { //a=rtcp-fb:98 trr-int 100
      push: 'rtcpFbTrrInt',
      reg: /^rtcp-fb:(\*|\d*) trr-int (\d*)/,
      names: ['payload', 'value'],
      format: "rtcp-fb:%d trr-int %d"
    },
    { //a=rtcp-fb:98 nack rpsi
      push: 'rtcpFb',
      reg: /^rtcp-fb:(\*|\d*) ([\w-_]*)(?: ([\w-_]*))?/,
      names: ['payload', 'type', 'subtype'],
      format: function (o) {
        return (o.subtype != null) ?
          "rtcp-fb:%s %s %s":
          "rtcp-fb:%s %s";
      }
    },
    { //a=extmap:2 urn:ietf:params:rtp-hdrext:toffset
      //a=extmap:1/recvonly URI-gps-string
      push: 'ext',
      reg: /^extmap:([\w_\/]*) (\S*)(?: (\S*))?/,
      names: ['value', 'uri', 'config'], // value may include "/direction" suffix
      format: function (o) {
        return (o.config != null) ?
          "extmap:%s %s %s":
          "extmap:%s %s";
      }
    },
    {
      //a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:PS1uQCVeeCFCanVmcjkpPywjNWhcYD0mXXtxaVBR|2^20|1:32
      push: 'crypto',
      reg: /^crypto:(\d*) ([\w_]*) (\S*)(?: (\S*))?/,
      names: ['id', 'suite', 'config', 'sessionConfig'],
      format: function (o) {
        return (o.sessionConfig != null) ?
          "crypto:%d %s %s %s":
          "crypto:%d %s %s";
      }
    },
    { //a=setup:actpass
      name: 'setup',
      reg: /^setup:(\w*)/,
      format: "setup:%s"
    },
    { //a=mid:1
      name: 'mid',
      reg: /^mid:(\w*)/,
      format: "mid:%s"
    },
    { //a=ptime:20
      name: 'ptime',
      reg: /^ptime:(\d*)/,
      format: "ptime:%d"
    },
    { //a=maxptime:60
      name: 'maxptime',
      reg: /^maxptime:(\d*)/,
      format: "maxptime:%d"
    },
    { //a=sendrecv
      name: 'direction',
      reg: /^(sendrecv|recvonly|sendonly|inactive)/
    },
    { //a=ice-lite
      name: 'icelite',
      reg: /^(ice-lite)/
    },
    { //a=ice-ufrag:F7gI
      name: 'iceUfrag',
      reg: /^ice-ufrag:(\S*)/,
      format: "ice-ufrag:%s"
    },
    { //a=ice-pwd:x9cml/YzichV2+XlhiMu8g
      name: 'icePwd',
      reg: /^ice-pwd:(\S*)/,
      format: "ice-pwd:%s"
    },
    { //a=fingerprint:SHA-1 00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33
      name: 'fingerprint',
      reg: /^fingerprint:(\S*) (\S*)/,
      names: ['type', 'hash'],
      format: "fingerprint:%s %s"
    },
    {
      //a=candidate:0 1 UDP 2113667327 203.0.113.1 54400 typ host
      //a=candidate:1162875081 1 udp 2113937151 192.168.34.75 60017 typ host generation 0
      //a=candidate:3289912957 2 udp 1845501695 193.84.77.194 60017 typ srflx raddr 192.168.34.75 rport 60017 generation 0
      push:'candidates',
      reg: /^candidate:(\S*) (\d*) (\S*) (\d*) (\S*) (\d*) typ (\S*)(?: raddr (\S*) rport (\d*))?(?: generation (\d*))?/,
      names: ['foundation', 'component', 'transport', 'priority', 'ip', 'port', 'type', 'raddr', 'rport', 'generation'],
      format: function (o) {
        var str = "candidate:%s %d %s %d %s %d typ %s";
        // NB: candidate has two optional chunks, so %void middle one if it's missing
        str += (o.raddr != null) ? " raddr %s rport %d" : "%v%v";
        if (o.generation != null) {
          str += " generation %d";
        }
        return str;
      }
    },
    { //a=remote-candidates:1 203.0.113.1 54400 2 203.0.113.1 54401 ...
      name: 'remoteCandidates',
      reg: /^remote-candidates:(.*)/,
      format: "remote-candidates:%s"
    },
    { //a=ice-options:google-ice
      name: 'iceOptions',
      reg: /^ice-options:(\S*)/,
      format: "ice-options:%s"
    },
    { //a=ssrc:2566107569 cname:t9YU8M1UxTF8Y1A1
      push: "ssrcs",
      reg: /^ssrc:(\d*) ([\w_]*):(.*)/,
      names: ['id', 'attribute', 'value'],
      format: "ssrc:%d %s:%s"
    },
    { //a=msid-semantic: WMS Jvlam5X3SX1OP6pn20zWogvaKJz5Hjf9OnlV
      name: "msidSemantic",
      reg: /^msid-semantic: (\w*) (\S*)/,
      names: ['semantic', 'token'],
      format: "msid-semantic: %s %s" // space after ":" is not accidental
    },
    { //a=group:BUNDLE audio video
      push: 'groups',
      reg: /^group:(\w*) (.*)/,
      names: ['type', 'mids'],
      format: "group:%s %s"
    },
    { //a=rtcp-mux
      name: 'rtcpMux',
      reg: /^(rtcp-mux)/
    },
    { // any a= that we don't understand is kepts verbatim on media.invalid
      push: 'invalid',
      names: ["value"]
    }
  ]
};

// set sensible defaults to avoid polluting the grammar with boring details
Object.keys(grammar).forEach(function (key) {
  var objs = grammar[key];
  objs.forEach(function (obj) {
    if (!obj.reg) {
      obj.reg = /(.*)/;
    }
    if (!obj.format) {
      obj.format = "%s";
    }
  });
}); 

},{}],11:[function(_dereq_,module,exports){
var parser = _dereq_('./parser');
var writer = _dereq_('./writer');

exports.write = writer;
exports.parse = parser.parse;
exports.parseFmtpConfig = parser.parseFmtpConfig;
exports.parsePayloads = parser.parsePayloads;
exports.parseRemoteCandidates = parser.parseRemoteCandidates;

},{"./parser":12,"./writer":13}],12:[function(_dereq_,module,exports){
var toIntIfInt = function (v) {
  return String(Number(v)) === v ? Number(v) : v;
};

var attachProperties = function (match, location, names, rawName) {
  if (rawName && !names) {
    location[rawName] = toIntIfInt(match[1]);
  }
  else {
    for (var i = 0; i < names.length; i += 1) {
      if (match[i+1] != null) {
        location[names[i]] = toIntIfInt(match[i+1]);
      }
    }
  }
};

var parseReg = function (obj, location, content) {
  var needsBlank = obj.name && obj.names;
  if (obj.push && !location[obj.push]) {
    location[obj.push] = [];
  }
  else if (needsBlank && !location[obj.name]) {
    location[obj.name] = {};
  }
  var keyLocation = obj.push ?
    {} :  // blank object that will be pushed
    needsBlank ? location[obj.name] : location; // otherwise, named location or root

  attachProperties(content.match(obj.reg), keyLocation, obj.names, obj.name);

  if (obj.push) {
    location[obj.push].push(keyLocation);
  }
};

var grammar = _dereq_('./grammar');
var validLine = RegExp.prototype.test.bind(/^([a-z])=(.*)/);

exports.parse = function (sdp) {
  var session = {}
    , media = []
    , location = session; // points at where properties go under (one of the above)

  // parse lines we understand
  sdp.split(/(\r\n|\r|\n)/).filter(validLine).forEach(function (l) {
    var type = l[0];
    var content = l.slice(2);
    if (type === 'm') {
      media.push({rtp: [], fmtp: []});
      location = media[media.length-1]; // point at latest media line
    }

    for (var j = 0; j < (grammar[type] || []).length; j += 1) {
      var obj = grammar[type][j];
      if (obj.reg.test(content)) {
        return parseReg(obj, location, content);
      }
    }
  });

  session.media = media; // link it up
  return session;
};

var fmtpReducer = function (acc, expr) {
  var s = expr.split('=');
  if (s.length === 2) {
    acc[s[0]] = toIntIfInt(s[1]);
  }
  return acc;
};

exports.parseFmtpConfig = function (str) {
  return str.split(';').reduce(fmtpReducer, {});
};

exports.parsePayloads = function (str) {
  return str.split(' ').map(Number);
};

exports.parseRemoteCandidates = function (str) {
  var candidates = [];
  var parts = str.split(' ').map(toIntIfInt);
  for (var i = 0; i < parts.length; i += 3) {
    candidates.push({
      component: parts[i],
      ip: parts[i + 1],
      port: parts[i + 2]
    });
  }
  return candidates;
};

},{"./grammar":10}],13:[function(_dereq_,module,exports){
var grammar = _dereq_('./grammar');

// customized util.format - discards excess arguments and can void middle ones
var formatRegExp = /%[sdv%]/g;
var format = function (formatStr) {
  var i = 1;
  var args = arguments;
  var len = args.length;
  return formatStr.replace(formatRegExp, function (x) {
    if (i >= len) {
      return x; // missing argument
    }
    var arg = args[i];
    i += 1;
    switch (x) {
      case '%%':
        return '%';
      case '%s':
        return String(arg);
      case '%d':
        return Number(arg);
      case '%v':
        return '';
    }
  });
  // NB: we discard excess arguments - they are typically undefined from makeLine
};

var makeLine = function (type, obj, location) {
  var str = obj.format instanceof Function ?
    (obj.format(obj.push ? location : location[obj.name])) :
    obj.format;

  var args = [type + '=' + str];
  if (obj.names) {
    for (var i = 0; i < obj.names.length; i += 1) {
      var n = obj.names[i];
      if (obj.name) {
        args.push(location[obj.name][n]);
      }
      else { // for mLine and push attributes
        args.push(location[obj.names[i]]);
      }
    }
  }
  else {
    args.push(location[obj.name]);
  }
  return format.apply(null, args);
};

// RFC specified order
// TODO: extend this with all the rest
var defaultOuterOrder = [
  'v', 'o', 's', 'i',
  'u', 'e', 'p', 'c',
  'b', 't', 'r', 'z', 'a'
];
var defaultInnerOrder = ['i', 'c', 'b', 'a'];


module.exports = function (session, opts) {
  opts = opts || {};
  // ensure certain properties exist
  if (session.version == null) {
    session.version = 0; // "v=0" must be there (only defined version atm)
  }
  if (session.name == null) {
    session.name = " "; // "s= " must be there if no meaningful name set
  }
  session.media.forEach(function (mLine) {
    if (mLine.payloads == null) {
      mLine.payloads = "";
    }
  });

  var outerOrder = opts.outerOrder || defaultOuterOrder;
  var innerOrder = opts.innerOrder || defaultInnerOrder;
  var sdp = [];

  // loop through outerOrder for matching properties on session
  outerOrder.forEach(function (type) {
    grammar[type].forEach(function (obj) {
      if (obj.name in session) {
        sdp.push(makeLine(type, obj, session));
      }
      else if (obj.push in session) {
        session[obj.push].forEach(function (el) {
          sdp.push(makeLine(type, obj, el));
        });
      }
    });
  });

  // then for each media line, follow the innerOrder
  session.media.forEach(function (mLine) {
    sdp.push(makeLine('m', grammar.m[0], mLine));

    innerOrder.forEach(function (type) {
      grammar[type].forEach(function (obj) {
        if (obj.name in mLine) {
          sdp.push(makeLine(type, obj, mLine));
        }
        else if (obj.push in mLine) {
          mLine[obj.push].forEach(function (el) {
            sdp.push(makeLine(type, obj, el));
          });
        }
      });
    });
  });

  return sdp.join('\r\n') + '\r\n';
};

},{"./grammar":10}]},{},[1])
(1)
});