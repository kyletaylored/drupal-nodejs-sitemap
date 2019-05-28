const gulp = require("gulp");
const concat = require("gulp-concat");
const sass = require("gulp-sass");
const gls = require("gulp-live-server");

sass.compiler = require("node-sass");

const DEST = "build";
const JS_DEST = `${DEST}/js`;

gulp.task(
  "scripts",
  gulp.series(function(done) {
    return gulp
      .src(["src/js/*.js"])
      .pipe(concat("custom.js"))
      .pipe(gulp.dest(JS_DEST));
    done();
  })
);

gulp.task(
  "sass",
  gulp.series(function(done) {
    return gulp
      .src("src/scss/*.scss")
      .pipe(sass().on("error", sass.logError))
      .pipe(gulp.dest("./build/css"));
    done();
  })
);

gulp.task(
  "sass-min",
  gulp.series(function(done) {
    return gulp
      .src("src/scss/*.scss")
      .pipe(sass({ outputStyle: "compressed" }).on("error", sass.logError))
      .pipe(gulp.dest("./build/css"));
    done();
  })
);

gulp.task(
  "watch",
  gulp.series(function(done) {
    gulp.watch("src/scss/*.scss", gulp.series("sass"));
    gulp.watch("src/js/*.js", gulp.series("scripts"));
    done();
  })
);

// Express server
gulp.task(
  "serve",
  gulp.series(function(done) {
    var server = gls.new("src/app.js");
    server.start();

    // Note: try wrapping in a function if getting an error like `TypeError: Bad argument at TypeError (native) at ChildProcess.spawn`
    gulp.watch("src/app.js", function() {
      server.start.bind(server)();
    });
    done();
  })
);

// Default Task
// gulp.task('default', ['browser-sync', 'watch'])
gulp.task(
  "default",
  gulp.series("watch", "serve", function(done) {
    done();
  })
);

gulp.task(
  "install",
  gulp.series("scripts", "sass", function(done) {
    done();
  })
);
