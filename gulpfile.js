'use strict';

var gulp = require('gulp'),
        debug = require('gulp-debug'),
        inject = require('gulp-inject'),
        tsc = require('gulp-typescript'),
        tslint = require('gulp-tslint'),
        sourcemaps = require('gulp-sourcemaps'),
        del = require('del'),
        Config = require('./gulpfile.config'),
        tsProject = tsc.createProject('tsconfig.json'),
        browserSync = require('browser-sync'),
        superstatic = require('superstatic'),
        rt = require('gulp-react-templates');
        var rjs = require('gulp-requirejs');

var config = new Config();

/**
 * Generates the app.d.ts references file dynamically from all application *.ts files.
 */
// gulp.task('gen-ts-refs', function () {
//     var target = gulp.src(config.appTypeScriptReferences);
//     var sources = gulp.src([config.allTypeScript], {read: false});
//     return target.pipe(inject(sources, {
//         starttag: '//{',
//         endtag: '//}',
//         transform: function (filepath) {
//             return '/// <reference path="../..' + filepath + '" />';
//         }
//     })).pipe(gulp.dest(config.typings));
// });

/**
 * Lint all custom TypeScript files.
 */
gulp.task('ts-lint', function () {
    return gulp.src(config.allTypeScript).pipe(tslint()).pipe(tslint.report('prose'));
});

/**
 * Compile TypeScript and include references to library and app .d.ts files.
 */
gulp.task('compile-ts', function () {
    var sourceTsFiles = [config.allTypeScript, //path to typescript files
        config.libraryTypeScriptDefinitions]; //reference to library .d.ts files


    var tsResult = gulp.src(sourceTsFiles)
            .pipe(sourcemaps.init())
            .pipe(tsProject());
    tsResult.dts.pipe(gulp.dest(config.tsOutputPath));
    return tsResult.js
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest(config.tsOutputPath));
});

/**
 * Remove all generated JavaScript files from TypeScript compilation.
 */

//gulp.task('clean-ts', function (cb) {
//    var typeScriptGenFiles = [
//        config.tsOutputPath + '/**/*.js', // path to all JS files auto gen'd by editor
//        config.tsOutputPath + '/**/*.js.map', // path to all sourcemap files auto gen'd by editor
//        '!' + config.tsOutputPath + '/lib'
//    ];
//    // delete the files
//    del(typeScriptGenFiles, cb);
//});

gulp.task('watch', function () {
    gulp.watch([config.allTypeScript], ['ts-lint', 'compile-ts']);
});
gulp.task('serve', ['compile-ts', 'watch'], function () {
    process.stdout.write('Starting browserSync and superstatic...\n');
    browserSync({
        port: 3000,
        files: ['index.html', '**/*.js'],
        injectChanges: true,
        logFileChanges: false,
        logLevel: 'silent',
        logPrefix: 'angularin20typescript',
        notify: true,
        reloadDelay: 0,
        server: {
            baseDir: './src',
            middleware: superstatic({debug: false})
        }
    });
});
gulp.task('requirejsBuild', function () {
    rjs({
        name: "main",
        baseUrl: './src/',
        out: 'bundle.js',
        shim: {
            // standard require.js shim options 
        },
        // ... more require.js options 
    }).pipe(gulp.dest('./deploy/')); // pipe it to the output DIR 
});


gulp.task('rt', function () {
    gulp.src('src/rt/**/*.rt')
            .pipe(rt({modules: 'amd'}))
            .pipe(gulp.dest('src/templates/'));
});

var concat = require('gulp-concat');
gulp.task('scripts1', function () {
    return gulp.src(['./lib/*.js', './src/js/*.js', './src/js/*/*.js', './src/js/*/*/*.js', './src/js/*/*/*/*.js'])
            .pipe(concat('sdmx.js'))
            .pipe(gulp.dest('./dist/'));
});
gulp.task('default', ['ts-lint', 'compile-ts']);


