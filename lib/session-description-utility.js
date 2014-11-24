// umd
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['extend', 'sdp-transform', 'convert-keys', 'base-number-convert'], factory);
	} else if (typeof exports === 'object') {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like environments that support module.exports,
		// like Node.
		module.exports = factory(require('extend'), require('sdp-transform'), require('./convert-keys'), require('./base-number-convert'));
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