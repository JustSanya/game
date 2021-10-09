import { src, dest, watch, series, parallel } from 'gulp';
import yargs from 'yargs';
import sass from 'gulp-sass';
import cleanCss from 'gulp-clean-css';
import gulpif from 'gulp-if';
import postcss from 'gulp-postcss';
import sourcemaps from 'gulp-sourcemaps';
import autoprefixer from 'autoprefixer';
import imagemin from 'gulp-imagemin';
// import del from 'del';
import webpack from 'webpack-stream';
import named from 'vinyl-named';
import browserSync from "browser-sync";

const PRODUCTION = yargs.argv.prod;

export const styles = () => {
  return src(['src/scss/app.scss'])
    .pipe(gulpif(!PRODUCTION, sourcemaps.init()))
    .pipe(sass().on('error', sass.logError))
    .pipe(gulpif(PRODUCTION, postcss([ autoprefixer ])))
    .pipe(gulpif(PRODUCTION, cleanCss({compatibility:'ie8'})))
    .pipe(gulpif(!PRODUCTION, sourcemaps.write()))
    .pipe(dest('dist/css'))
    .pipe(server.stream());
}

export const images = () => {
  return src('src/img/**/*.{jpg,jpeg,png,svg,gif}')
    .pipe(gulpif(PRODUCTION, imagemin()))
    .pipe(dest('dist/img'));
}

export const watchForChanges = () => {
  watch('src/scss/**/*.scss', styles);
  watch('src/images/**/*.{jpg,jpeg,png,svg,gif}', series(images, reload));
  watch('src/js/**/*.js', series(scripts, reload));
  watch("**/*.php", reload);
}

// export const clean = () => del(['dist']);



export const scripts = () => {
  return src('src/js/common.js')
  .pipe(named())
  .pipe(webpack({
    module: {
      rules: [
        {
          test: /\.js$/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          }
        }
      ]
    },
    mode: PRODUCTION ? 'production' : 'development',
    devtool: !PRODUCTION ? 'inline-source-map' : false,
    output: {
      filename: '[name].js'
    },
  }))
  .pipe(dest('dist/js'));
}

const server = browserSync.create();
export const serve = done => {
  server.init({
    server: {
      baseDir: "./dist/"
    } 
  });
  done();
};
export const reload = done => {
  server.reload();
  done();
};

export const dev = series(parallel(styles, images, scripts), serve, watchForChanges)
export const build = series(parallel(styles, images, scripts))
export default dev;