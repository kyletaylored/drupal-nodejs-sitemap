var gulp = require('gulp'),
  concat = require('gulp-concat'),
  uglify = require('gulp-uglify'),
  rename = require('gulp-rename'),
  sass = require('gulp-ruby-sass'),
  gls = require('gulp-live-server'),
  autoprefixer = require('gulp-autoprefixer'),
  browserSync = require('browser-sync').create()

var DEST = 'production/build/'

gulp.task('scripts', function() {
  return gulp
    .src(['src/js/helpers/*.js', 'src/js/*.js'])
    .pipe(concat('custom.js'))
    .pipe(gulp.dest(DEST + '/js'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(uglify())
    .pipe(gulp.dest(DEST + '/js'))
    .pipe(browserSync.stream())
})

// TODO: Maybe we can simplify how sass compile the minify and unminify version
var compileSASS = function(filename, options) {
  return sass('src/scss/*.scss', options)
    .pipe(autoprefixer('last 2 versions', '> 5%'))
    .pipe(concat(filename))
    .pipe(gulp.dest(DEST + '/css'))
    .pipe(browserSync.stream())
}

gulp.task('sass', function() {
  return compileSASS('custom.css', {})
})

gulp.task('sass-minify', function() {
  return compileSASS('custom.min.css', { style: 'compressed' })
})

gulp.task('browser-sync', function() {
  browserSync.init({
    server: {
      baseDir: './'
    },
    startPath: './production/index.html'
  })
})

gulp.task('watch', function() {
  // Watch .html files
  // gulp.watch('production/*.html', browserSync.reload)
  // Watch .js files
  // gulp.watch('src/js/*.js', ['scripts'])
  // Watch .scss files
  gulp.watch('src/scss/*.scss', ['sass', 'sass-minify'])
})

// Express server
gulp.task('serve', function() {
  var server = gls.new('app.js')
  server.start()

  // Note: try wrapping in a function if getting an error like `TypeError: Bad argument at TypeError (native) at ChildProcess.spawn`
  gulp.watch('app.js', function() {
    server.start.bind(server)()
  })
})

gulp.task('dev', ['scripts', 'sass', 'sass-minify'])

// Default Task
// gulp.task('default', ['browser-sync', 'watch'])
gulp.task('default', ['watch', 'serve'])
