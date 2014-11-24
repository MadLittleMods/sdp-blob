// umd
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['lz-string'], factory);
	} else if (typeof exports === 'object') {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like environments that support module.exports,
		// like Node.
		module.exports = factory(require('lz-string'));
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