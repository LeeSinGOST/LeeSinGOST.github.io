const gulp = require('gulp');
const replace = require('gulp-replace');
gulp.task('templates', async() => {
gulp.src('public/**/*.html')
.pipe(replace('src="/../', 'src="https://fastly.jsdelivr.net/gh/LeeSinGOST/LeeSinGOST.github.io/'))
.pipe(gulp.dest('public/')), { overwrite: true };
});
gulp.task("default", gulp.parallel('templates'));