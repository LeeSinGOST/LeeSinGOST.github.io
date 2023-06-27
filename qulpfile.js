const gulp = require('gulp');
const replace = require('gulp-replace');
gulp.task('ts', async() => {
gulp.src('public/**/*.html')
.pipe(replace('src="/../', 'src="https://raw.githubusercontent.com/LeeSinGOST/LeeSinGOST.github.io/master/'))
.pipe(gulp.dest('public/')), { overwrite: true };
});
gulp.task("default", gulp.parallel('templates'));