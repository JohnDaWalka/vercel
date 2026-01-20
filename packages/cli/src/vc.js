#!/usr/bin/env node
<<<<<<< HEAD
'use strict';
// This shim defers loading the real module until the compile cache is enabled.
// https://nodejs.org/api/module.html#moduleenablecompilecachecachedir
try {
  const { enableCompileCache } = require('node:module');
=======
// This shim defers loading the real module until the compile cache is enabled.
// https://nodejs.org/api/module.html#moduleenablecompilecachecachedir
// enableCompileCache was added in Node.js 22.8.0, so we need to handle older versions.
try {
  const { enableCompileCache } = await import('node:module');
>>>>>>> upstream/main
  if (enableCompileCache) {
    enableCompileCache();
  }
} catch {}
<<<<<<< HEAD
require('./index.js');
=======

await import('./index.js');
>>>>>>> upstream/main
