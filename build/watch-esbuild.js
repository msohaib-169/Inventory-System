const esbuild = require('esbuild');
const livereload = require('livereload');
const fs = require('fs');
const path = require('path');

const outdir = path.resolve(__dirname, '..', 'public', 'build');
if (!fs.existsSync(outdir)) fs.mkdirSync(outdir, { recursive: true });

// Start livereload server watching public/build
const lrserver = livereload.createServer({ exts: ['js', 'css', 'html'], delay: 100 });
lrserver.watch(outdir);

console.log('Starting esbuild in watch mode, output ->', outdir);

esbuild.build({
  entryPoints: [path.resolve(__dirname, '..', 'resources', 'js', 'main.tsx')],
  bundle: true,
  sourcemap: true,
  outfile: path.join(outdir, 'main.js'),
  loader: { '.ts': 'ts', '.tsx': 'tsx', '.js': 'js', '.jsx': 'jsx', '.css': 'css' },
  define: { 'process.env.NODE_ENV': '"development"' },
  watch: {
    onRebuild(error, result) {
      if (error) console.error('esbuild: rebuild failed:', error);
      else {
        console.log('esbuild: rebuild succeeded');
        try {
          lrserver.refresh('/');
        } catch (e) {}
      }
    },
  },
}).then(() => console.log('esbuild: initial build finished')).catch(() => process.exit(1));
