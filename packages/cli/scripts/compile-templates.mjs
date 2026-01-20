<<<<<<< HEAD
import { readFile, writeFile, readdir, unlink } from 'node:fs/promises';
=======
import { readFile, writeFile, readdir, unlink, rename } from 'node:fs/promises';
>>>>>>> upstream/main
import doT from 'dot';
import { fileURLToPath } from 'node:url';

export async function compileDevTemplates() {
  const dirRoot = new URL('../', import.meta.url);

  // Compile the `doT.js` template files for `vercel dev`
  const templatesDirURL = new URL('src/util/dev/templates/', dirRoot);
  doT.process({ path: fileURLToPath(templatesDirURL) });

  const files = await readdir(templatesDirURL);
  const compiledFiles = files.filter(f => f.endsWith('.js'));

  for (const file of compiledFiles) {
    const fnPath = new URL(file, templatesDirURL);
<<<<<<< HEAD
=======
    const cjsPath = new URL(file.replace(/\.js$/, '.cjs'), templatesDirURL);
>>>>>>> upstream/main
    const tsPath = fnPath.href.replace(/\.js$/, '.ts');
    const def = await readFile(
      new URL(fnPath.href.replace(/\.js$/, '.tsdef')),
      'utf8'
    );
    const interfaceName = def.match(/interface (\w+)/)[1];

<<<<<<< HEAD
    const { default: fn } = await import(fnPath);
=======
    // doT generates CommonJS code, but since this is an ESM package (.js files
    // are treated as ESM), we rename to .cjs so Node.js treats it as CommonJS.
    // After extracting the function, we delete the temp .cjs file since we're
    // generating a TypeScript version instead.
    await rename(fnPath, cjsPath);
    const mod = await import(cjsPath.href);
    const fn = mod.default;
    await unlink(cjsPath);
>>>>>>> upstream/main

    const contents = `import encodeHTML from 'escape-html';

${def}
export default ${fn
      .toString()
      .replace(/var encodeHTML.+\(\)\);/s, '')
      .replace(/\bvar\b/g, 'let')
      .replace(/\(it\s*\)/s, `(it: ${interfaceName}): string`)}`;

<<<<<<< HEAD
    await Promise.all([writeFile(new URL(tsPath), contents), unlink(fnPath)]);
=======
    await writeFile(new URL(tsPath), contents);
>>>>>>> upstream/main
  }
}
