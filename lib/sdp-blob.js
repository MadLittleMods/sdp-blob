// umd
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['data-blob', 'session-description-utility'], factory);
	} else if (typeof exports === 'object') {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like environments that support module.exports,
		// like Node.
		module.exports = factory(require('./data-blob'), require('./session-description-utility'));
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