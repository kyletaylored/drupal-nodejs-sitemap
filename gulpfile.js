var gulp = require("gulp"),
  concat = require("gulp-concat"),
  rename = require("gulp-rename"),
  sass = require('gulp-sass'),
  gls = require("gulp-live-server"),
  autoprefixer = require("gulp-autoprefixer");

sass.compiler = require('node-sass');

var DEST = "build";
var JS_DEST = `${DEST}/js`;

gulp.task('scripts', function() {
  return gulp.src(["src/js/*.js"])
    .pipe(concat('custom.js'))
    .pipe(gulp.dest(JS_DEST))
});

gulp.task('sass', function () {
  return gulp.src('src/scss/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./build/css'));
});

gulp.task('sass-min', function () {
  return gulp.src('src/scss/*.scss')
    .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(gulp.dest('./build/css'));
});

gulp.task("watch", function() {
  gulp.watch("src/scss/*.scss", ["sass"]);
  gulp.watch("src/js/*.js", ["scripts"]);
});

// Express server
gulp.task("serve", function() {
  var server = gls.new("src/app.js");
  server.start();

  // Note: try wrapping in a function if getting an error like `TypeError: Bad argument at TypeError (native) at ChildProcess.spawn`
  gulp.watch("src/app.js", function() {
    server.start.bind(server)();
  });
});

gulp.task("install", ["scripts", "sass", "default"]);

// Default Task
// gulp.task('default', ['browser-sync', 'watch'])
gulp.task("default", ["watch", "serve"]);
