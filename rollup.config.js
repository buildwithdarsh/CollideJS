import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import dts from 'rollup-plugin-dts';

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/collide.umd.js',
        format: 'umd',
        name: 'Collide',
        sourcemap: true,
        exports: 'default',
      },
      {
        file: 'dist/collide.esm.js',
        format: 'es',
        sourcemap: true,
      },
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        noEmit: false,
        declaration: false,
        outDir: 'dist',
      }),
      terser({
        compress: { passes: 2, pure_getters: true, unsafe_arrows: true },
        mangle: { properties: { regex: /^_/ } },
        format: { comments: false },
      }),
    ],
  },
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/collide.d.ts',
      format: 'es',
    },
    plugins: [dts()],
  },
];
