const gulp = require('gulp');
const replace = require('gulp-replace');
gulp.task('templates', async() => {
gulp.src('public/**/*.html')
.pipe(replace('cdn.jsdelivr.net', 'fastly.jsdelivr.net'))
.pipe(gulp.dest('public/')), { overwrite: true };
});
gulp.task("default", gulp.parallel('templates'));