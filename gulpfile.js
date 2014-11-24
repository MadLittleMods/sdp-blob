var gulp = require('gulp');

var rename = require("gulp-rename");
var uglify = require('gulp-uglify');
var header = require('gulp-header');
var browserify = require('gulp-browserify');

var pkg = require('./package.json');
var banner = [
	'/**',
	' * <%= pkg.name %> - <%= pkg.description %>',
	' * @version v<%= pkg.version %>',
	' * @link <%= pkg.homepage %>',
	' */',
	''
].join('\n');


// Build a browser compatible build of SDPBlob
gulp.task('build-standalone', function() {
	// Single entry point to browserify
	gulp.src('./index.js')
		// same as: `browserify ./index.js --standalone SDPBlob > sdp-blob-standalone.js`
		.pipe(browserify({
			standalone: 'SDPBlob'
		}))
		.pipe(uglify())
		.pipe(header(banner, { pkg : pkg }))
		.pipe(rename(function (path) {
			path.basename = "sdp-blob-standalone";
		}))
		.pipe(gulp.dest('./'));
});

// Build a browser compatible build of DataBlob
// This will probably will only be used for developing/testing
// Run: `gulp build-data-blob-standalone`
gulp.task('build-data-blob-standalone', function() {
	// Single entry point to browserify
	gulp.src('./lib/data-blob.js')
		// same as: `browserify ./lib/data-blob.js --standalone DataBlob > data-blob-standalone.js`
		.pipe(browserify({
			standalone: 'DataBlob'
		}))
		.pipe(uglify())
		.pipe(rename(function (path) {
			path.basename = "data-blob-standalone";
		}))
		.pipe(gulp.dest('./'));
});


// Default Task
gulp.task('default', ['build-standalone']);