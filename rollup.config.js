import resolve from 'rollup-plugin-node-resolve';
import manifest from './package.json';

export default {
  input: 'dist/index.js',
  output: [
    {
      file: manifest.main,
      format: 'cjs',
      sourcemap: false,
    },
    {
      file: manifest.module,
      format: 'es',
      sourcemap: false,
    }

  ],
  watch: {
    clearScreen: false,
  },
  plugins: [resolve()],
};
