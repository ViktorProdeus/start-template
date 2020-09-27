const { src, dest, parallel, series, watch } = require(`gulp`);
const plumber = require(`gulp-plumber`);
const sourcemap = require(`gulp-sourcemaps`);
const sass = require(`gulp-sass`);
const postcss = require(`gulp-postcss`);
const autoprefixer = require(`autoprefixer`);
const server = require(`browser-sync`).create();
const csso = require(`gulp-csso`);
const rename = require(`gulp-rename`);
const imagemin = require(`gulp-imagemin`);
const webp = require(`gulp-webp`);
const svgstore = require(`gulp-svgstore`)
const posthtml = require(`gulp-posthtml`);
const include = require(`posthtml-include`);
const del = require(`del`);
const webpack = require(`webpack-stream`);
const webpackConfig = require(`./webpack.config.js`);

function openserver() {
  server.init({
    server: `build/`,
    notify: false,
    open: true,
    cors: true,
    ui: false
  });
};

function js() {
  return src([`source/js/main.js`])
    .pipe(webpack(webpackConfig))
    .pipe(dest(`build/js`));
};

function css() {
  return src(`source/sass/style.scss`)
    .pipe(plumber())
    .pipe(sourcemap.init())
    .pipe(sass())
    .pipe(postcss([autoprefixer({
      grid: true, overrideBrowserslist: [`Ie >= 11, IOS >= 12, > 0.2%, Safari >= 10`]
    })]))
    .pipe(dest(`build/css`))
    .pipe(csso())
    .pipe(rename(`style.min.css`))
    .pipe(sourcemap.write(`.`))
    .pipe(dest(`build/css`))
    .pipe(server.stream());
};

function images() {
  return src(`source/img/**/*.{png,jpg,svg}`)
    .pipe(imagemin([
      imagemin.optipng({
        optimizationLevel: 3
      }),
      imagemin.mozjpeg({
        quality: 75, progressive: true
      }),
      imagemin.svgo({
        plugins: [
          {removeViewBox: false},
          {removeRasterImages: true},
          {removeUselessStrokeAndFill: false},
        ]
      })
    ]))

    .pipe(dest(`source/img`));
};

function clean() {
  return del(`build`);
};



function refresh(done) {
  server.reload();
  done();
};



function webpic() {
  return src(`source/img/**/*.{png,jpg}`)
    .pipe(webp({
      quality: 90
    }))
    .pipe(dest(`source/img`));
};

function sprite() {
  return src(`source/img/sprite/*.svg`)
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(rename(`sprite_auto.svg`))
    .pipe(dest(`build/img`));
};

function html() {
  return src(`source/*.html`)
    .pipe(posthtml([
      include()
    ]))
    .pipe(dest(`build`));
};

function copy() {
  return src([
      `source/fonts/**/*.{woff,woff2}`,
      `source/img/**`,
      `source//*.ico`
    ], {
      base: `source`
    })
    .pipe(dest(`build`));
};

function startwatch() {
  watch(`source/sass/**/*.{scss,sass}`, css);
  watch(`source/img/**/*.svg`, series(sprite, html, refresh));
  watch(`source/*.html`, series(html, refresh));
  watch(`source/js/**/*.js`, series(js, refresh));
};


exports.openserver = openserver;
exports.images = images;
exports.webpic = webpic;
exports.clean = clean;

exports.build = series(clean, copy, css, sprite, js, html);
exports.start = series([clean, copy, css, sprite, js, html], parallel(startwatch, openserver, refresh));