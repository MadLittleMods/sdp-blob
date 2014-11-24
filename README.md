# sdp-blob

Turn a WebRTC Offer/Answer into a compact blob/token.

Only works with datachannel's.


# 37.42% reduction *(average)*

The goal of this library is to reduce the number of characters that represent enough data in the offer/answer to establish a WebRTC datachannel.

The reason I made this library is because I wanted a server-less WebRTC experience. This means you still need to transfer the offer/blob to a friend and have the friend send back the answer, but in as little characters as possible bringing it down to almost a small token.

To expand on that, I did not want to have to deal with a signaling server. Yes, the signaling server(*means of which you transfer the offer/answer back and forth*) is replaced by an IM client or email. Yes, it is more work on the user.

This library was developed when Chrome 38 was the latest version where you could see a 72% reduction by using SDP-Blob. At the moment it only reduces 30% for latest versions of Chrome and Firefox. *(see table below)*

# Version: 1.0.0

---

## Example blob:

Here is an example offer blob created by [`SDPBlob.assembleBlob(description)`](#sdpblobassembleblobdescription-or-options). It can sent to someone else and parsed by [`SDPBlob.parseBlob(blob, type)`](#sdpblobparsebloboptions-or-blob-type)

```
N4IgDghgngNg9hAJgZxALgKwAYcBoQCWY6IAjAJwBMAdKQGwActtWlI+YcATgC7p1Y6GcvgIBjAKYAFAO6ISAIQgBJLgAsA8gFUAZgC8CANQD0esACkA6noAqYLgC1lMBe0KTdXCAHMS3gOIA0gQAVgAyYGAhyKQAtoGUPMZuOgQAdt4SXPbpfGggGGoYlhAAwlgyWCFqAMQAmgSkABoAcgBuyABKsVoYdOalNjY6GADWbXB1WG3KGGKBTeRSbmIQaYgEiBA8EqhoANqgYnCxnGkSaXmk+DxeacicvCQArojEHFwE3AQ8UOjXhGI+QoNHoTFILDYHG4eQEQhEIF+YAkJDUcGQfHwmXOXh4XzS6CwAF9cEcTmcLlcbncHjCXm83Dlvr90JRRECyFRaIxmJQcIy6Wg4QIblBkaj0ZiQNistt8YSSWTTnBzpd/tS1rSnvkeGJ3uBPsy/mgAMzskgg7ngyEC7VYUXi/JojEgRUgY7K1VUxE0x55RF6xmGz4stAAFnNwK5YN5/OhdodKKdktdAF0iUAAA
```

# Usage:

### CommonJS:
`var sdpBlob = require('sdp-blob')`

### AMD:
`require(['sdp-blob'], function(sdpBlob) {});`

### Browser standalone:

There is also a standalone build that can be directly used in a browser. `sdp-blob-standalone.js`

```
<script src="sdp-blob-standalone.js"></script>
<script>
// `SDPBlob` is a global to use now
</script>
```

# API

## `SDPBlob.assembleBlob(description or options)`

You can pass in just a sdp description string or an options object that has a `description` and `encoding` keys.

 - `description`: SDP string
 - `encoding`: *Optional* `base64`(default) or `utf16`

## `SDPBlob.parseBlob(options or blob, type)`

Pass in the blob and type or an options object that has a `blob` and `type` keys

 - `blob`: A string provided from `SDPBlob.assembleBlob()`
 - `type`: A string. Most likely `offer` or `answer`
 - `encoding`: *Optional* `base64`(default) or `utf16`
		

# Stats

These tables try to show you how `SDPBlob` compares to other methods for a given offer SDP description.

Browser | **% reduced** | **`SDPBlob.assembleBlob(...)`** | `DataBlob.assembleBlob(...)` | `JSON.stringify(description)` 
------- | ------------- | ------------------------------- | ---------------------------- | -----------------------------
Chrome 41.0.2229.1 | 33.97% reduced | 552 | 594 | 836 
Chrome 39.0.2171.65 | 34.45% reduced | 548 | 594 | 836 
Chrome 38.0.2125.122 | 72.97% reduced | 552 | 594 | 2042 
Firefox 35.0a2 | 24.30% reduced | 788 | 1094 | 1041 
Firefox 33.1.1 | 21.42% reduced | 576 | 647 | 733 


# How the blob is made:

 - No need for audio media description. Chrome 38 seems to add it in when trying to create a data channel so we strip it out and regenerate a fake one on the client from the blob. This problem seems to be gone in Chrome Canary(40) so hopefully this part can get removed entirely.
 - Shorten all blob content keys before `JSON.stringify`. We restore the full key names on the client later on.
 - Compress with LZString using the Base64 encoding for easy copy/paste-able characters.
 - Session ID does not matter so we just set it to a multi-digit random number
 - Reduce candidate priority number to single digit
 - Delete the candidate foundation and recreate it with a multi-digit random number
 - Remove colons from the fingerprint and convert from hex(base 16) to base 64. We can use a higher base but it results in more characters when compressed because of all of the specialty characters. 64 seems to be the sweet spot.



# Building the standalone version

Here are multiple ways to build the browser standalone version youself.

Since we have a Gulp task to build the script you can simply run: `gulp` or `npm run build-standalone`

If you want to do it completely manually with browserify:
`browserify ./index.js --standalone SDPBlob > sdp-blob-standalone.js`

