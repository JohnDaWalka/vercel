import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import fs from 'fs-extra';
import { join } from 'path';
import { getWriteableDirectory } from '@vercel/build-utils';
import build from '../../../../src/commands/build';
import { client } from '../../../mocks/client';
import { defaultProject, useProject } from '../../../mocks/project';
import { useTeams } from '../../../mocks/team';
import { useUser } from '../../../mocks/user';
import { execSync } from 'child_process';
import { vi } from 'vitest';
import { REGEX_NON_VERCEL_PLATFORM_FILES } from '@vercel/fs-detectors';

vi.setConfig({ testTimeout: 6 * 60 * 1000 });

const fixture = (name: string) =>
  join(__dirname, '../../../fixtures/unit/commands/build', name);

const flakey =
  process.platform === 'win32' && process.version.startsWith('v22');

describe.skipIf(flakey)('build', () => {
  beforeEach(() => {
    delete process.env.__VERCEL_BUILD_RUNNING;
    delete process.env.VERCEL_TRACING_DISABLE_AUTOMATIC_FETCH_INSTRUMENTATION;
  });

  describe('--help', () => {
    it('tracks telemetry', async () => {
      const command = 'build';

      client.setArgv(command, '--help');
      const exitCodePromise = build(client);
      await expect(exitCodePromise).resolves.toEqual(2);

      expect(client.telemetryEventStore).toHaveTelemetryEvents([
        {
          key: 'flag:help',
          value: command,
        },
      ]);
    });
  });

  it('should build with `@vercel/static`', async () => {
    const cwd = fixture('static');
    const output = join(cwd, '.vercel/output');

    client.cwd = cwd;
    const exitCode = await build(client);
    expect(exitCode).toEqual(0);

    // `builds.json` says that "@vercel/static" was run
    const builds = await fs.readJSON(join(output, 'builds.json'));
    expect(builds).toMatchObject({
      target: 'preview',
      builds: [
        {
          require: '@vercel/static',
          apiVersion: 2,
          src: '**',
          use: '@vercel/static',
        },
      ],
    });

    // "static" directory contains static files
    const files = await fs.readdir(join(output, 'static'));
    expect(files.sort()).toEqual(['index.html']);
  });

  it('should build with `@now/static`', async () => {
    const cwd = fixture('now-static');
    const output = join(cwd, '.vercel/output');
    client.cwd = cwd;
    const exitCode = await build(client);
    expect(exitCode).toEqual(0);

    const builds = await fs.readJSON(join(output, 'builds.json'));
    expect(builds).toMatchObject({
      target: 'preview',
      builds: [
        {
          require: '@now/static',
          apiVersion: 2,
          src: 'www/index.html',
          use: '@now/static',
        },
      ],
    });

    const files = await fs.readdir(join(output, 'static'));
    expect(files).toEqual(['www']);
    const www = await fs.readdir(join(output, 'static', 'www'));
    expect(www).toEqual(['index.html']);
  });

  it('should build with `@vercel/node`', async () => {
    const cwd = fixture('node');
    const output = join(cwd, '.vercel/output');
    client.cwd = cwd;
    const exitCode = await build(client);
    expect(exitCode).toEqual(0);

    // `builds.json` says that "@vercel/node" was run
    const builds = await fs.readJSON(join(output, 'builds.json'));
    expect(builds).toMatchObject({
      target: 'preview',
      builds: [
        {
          require: '@vercel/node',
          apiVersion: 3,
          use: '@vercel/node',
          src: 'api/es6.js',
          config: { zeroConfig: true },
        },
        {
          require: '@vercel/node',
          apiVersion: 3,
          use: '@vercel/node',
          src: 'api/index.js',
          config: { zeroConfig: true },
        },
        {
          require: '@vercel/node',
          apiVersion: 3,
          use: '@vercel/node',
          src: 'api/mjs.mjs',
          config: { zeroConfig: true },
        },
        {
          require: '@vercel/node',
          apiVersion: 3,
          use: '@vercel/node',
          src: 'api/typescript.ts',
          config: { zeroConfig: true },
        },
      ],
    });

    // "static" directory is empty
    const hasStaticFiles = await fs.pathExists(join(output, 'static'));
    expect(
      hasStaticFiles,
      'Expected ".vercel/output/static" to not exist'
    ).toEqual(false);

    // "functions/api" directory has output Functions
    const functions = await fs.readdir(join(output, 'functions/api'));
    expect(functions.sort()).toEqual([
      'es6.func',
      'index.func',
      'mjs.func',
      'typescript.func',
    ]);
  });

  it('should handle symlinked static files', async () => {
    const cwd = fixture('static-symlink');
    const output = join(cwd, '.vercel/output');

    // try to create the symlink, if it fails (e.g. Windows), skip the test
    try {
      await fs.unlink(join(cwd, 'foo.html'));
      await fs.symlink(join(cwd, 'index.html'), join(cwd, 'foo.html'));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('Symlinks not available, skipping test');
      return;
    }

    client.cwd = cwd;
    const exitCode = await build(client);
    expect(exitCode).toEqual(0);

    // `builds.json` says that "@vercel/static" was run
    const builds = await fs.readJSON(join(output, 'builds.json'));
    expect(builds).toMatchObject({
      target: 'preview',
      builds: [
        {
          require: '@vercel/static',
          apiVersion: 2,
          src: '**',
          use: '@vercel/static',
        },
      ],
    });

    // "static" directory contains static files
    const files = await fs.readdir(join(output, 'static'));
    expect(files.sort()).toEqual(['foo.html', 'index.html']);
    expect(
      (await fs.lstat(join(output, 'static', 'foo.html'))).isSymbolicLink()
    ).toEqual(true);
    expect(
      (await fs.lstat(join(output, 'static', 'index.html'))).isSymbolicLink()
    ).toEqual(false);
  });

  it('should normalize "src" path in `vercel.json`', async () => {
    const cwd = fixture('normalize-src');
    const output = join(cwd, '.vercel/output');
    client.cwd = cwd;
    const exitCode = await build(client);
    expect(exitCode).toEqual(0);

    // `builds.json` says that "@vercel/node" was run
    const builds = await fs.readJSON(join(output, 'builds.json'));
    expect(builds).toMatchObject({
      target: 'preview',
      builds: [
        {
          require: '@vercel/node',
          apiVersion: 3,
          use: '@vercel/node',
          src: 'server.js',
        },
      ],
    });

    // `config.json` includes "route" from `vercel.json`
    const config = await fs.readJSON(join(output, 'config.json'));
    expect(config).toMatchObject({
      version: 3,
      routes: [
        {
          src: '^/(.*)$',
          dest: '/server.js',
        },
      ],
    });

    // "static" directory is empty
    const hasStaticFiles = await fs.pathExists(join(output, 'static'));
    expect(
      hasStaticFiles,
      'Expected ".vercel/output/static" to not exist'
    ).toEqual(false);

    // "functions" directory has output Function
    const functions = await fs.readdir(join(output, 'functions'));
    expect(functions.sort()).toEqual(['server.js.func']);
  });

  it('should build with 3rd party Builder', async () => {
    const cwd = fixture('third-party-builder');
    const output = join(cwd, '.vercel/output');
    client.cwd = cwd;
    const exitCode = await build(client);
    expect(exitCode).toEqual(0);

    // `builds.json` says that "txt-builder" was run
    const builds = await fs.readJSON(join(output, 'builds.json'));
    expect(builds).toMatchObject({
      target: 'preview',
      builds: [
        {
          require: 'txt-builder',
          apiVersion: 3,
          use: 'txt-builder@0.0.0',
          src: 'api/foo.txt',
          config: {
            zeroConfig: true,
            functions: {
              'api/*.txt': {
                runtime: 'txt-builder@0.0.0',
              },
            },
          },
        },
        {
          require: '@vercel/static',
          apiVersion: 2,
          use: '@vercel/static',
          src: REGEX_NON_VERCEL_PLATFORM_FILES,
          config: {
            zeroConfig: true,
          },
        },
      ],
    });

    // "static" directory is empty
    const hasStaticFiles = await fs.pathExists(join(output, 'static'));
    expect(
      hasStaticFiles,
      'Expected ".vercel/output/static" to not exist'
    ).toEqual(false);

    // "functions/api" directory has output Functions
    const functions = await fs.readdir(join(output, 'functions/api'));
    expect(functions.sort()).toEqual(['foo.func']);

    const vcConfig = await fs.readJSON(
      join(output, 'functions/api/foo.func/.vc-config.json')
    );
    expect(vcConfig).toMatchObject({
      handler: 'api/foo.txt',
      runtime: 'provided',
      environment: {},
    });
  });

  it('should serialize `EdgeFunction` output in version 3 Builder', async () => {
    const cwd = fixture('edge-function');
    const output = join(cwd, '.vercel/output');
    client.cwd = cwd;
    client.setArgv('build', '--prod');
    const exitCode = await build(client);
    expect(exitCode).toEqual(0);

    // `builds.json` says that "edge-function" Builder was run
    const builds = await fs.readJSON(join(output, 'builds.json'));
    expect(builds).toMatchObject({
      target: 'production',
      builds: [
        {
          require: 'edge-function',
          apiVersion: 3,
          use: 'edge-function@0.0.0',
          src: 'api/edge.js',
          config: {
            zeroConfig: true,
            functions: {
              'api/*.js': {
                runtime: 'edge-function@0.0.0',
              },
            },
          },
        },
        {
          require: '@vercel/static',
          apiVersion: 2,
          use: '@vercel/static',
          src: REGEX_NON_VERCEL_PLATFORM_FILES,
          config: {
            zeroConfig: true,
          },
        },
      ],
    });

    // "static" directory is empty
    const hasStaticFiles = await fs.pathExists(join(output, 'static'));
    expect(
      hasStaticFiles,
      'Expected ".vercel/output/static" to not exist'
    ).toEqual(false);

    // "functions/api" directory has output Functions
    const functions = await fs.readdir(join(output, 'functions/api'));
    expect(functions.sort()).toEqual(['edge.func']);

    const vcConfig = await fs.readJSON(
      join(output, 'functions/api/edge.func/.vc-config.json')
    );
    expect(vcConfig).toMatchObject({
      runtime: 'edge',
      name: 'api/edge.js',
      deploymentTarget: 'v8-worker',
      entrypoint: 'api/edge.js',
    });
    expect(client.telemetryEventStore).toHaveTelemetryEvents([
      { key: 'flag:prod', value: 'TRUE' },
    ]);
  });

  it('should pull "preview" env vars by default', async () => {
    const cwd = fixture('static-pull');
    useUser();
    useTeams('team_dummy');
    useProject({
      ...defaultProject,
      id: 'vercel-pull-next',
      name: 'vercel-pull-next',
    });
    const envFilePath = join(cwd, '.vercel', '.env.preview.local');
    const projectJsonPath = join(cwd, '.vercel', 'project.json');
    const originalProjectJson = await fs.readJSON(
      join(cwd, '.vercel/project.json')
    );
    try {
      client.cwd = cwd;
      client.setArgv('build', '--yes');
      const exitCode = await build(client);
      expect(exitCode).toEqual(0);

      const previewEnv = await fs.readFile(envFilePath, 'utf8');
      const envFileHasPreviewEnv = previewEnv.includes(
        'REDIS_CONNECTION_STRING'
      );
      expect(envFileHasPreviewEnv).toBeTruthy();
    } finally {
      await fs.remove(envFilePath);
      await fs.writeJSON(projectJsonPath, originalProjectJson, { spaces: 2 });
    }
    expect(client.telemetryEventStore).toHaveTelemetryEvents([
      { key: 'flag:yes', value: 'TRUE' },
    ]);
  });

  it('should pull "production" env vars with `--prod`', async () => {
    const cwd = fixture('static-pull');
    useUser();
    useTeams('team_dummy');
    useProject({
      ...defaultProject,
      id: 'vercel-pull-next',
      name: 'vercel-pull-next',
    });
    const envFilePath = join(cwd, '.vercel', '.env.production.local');
    const projectJsonPath = join(cwd, '.vercel', 'project.json');
    const originalProjectJson = await fs.readJSON(
      join(cwd, '.vercel/project.json')
    );
    try {
      client.cwd = cwd;
      client.setArgv('build', '--yes', '--prod');
      const exitCode = await build(client);
      expect(exitCode).toEqual(0);

      const prodEnv = await fs.readFile(envFilePath, 'utf8');
      const envFileHasProductionEnv1 = prodEnv.includes(
        'REDIS_CONNECTION_STRING'
      );
      expect(envFileHasProductionEnv1).toBeTruthy();
      const envFileHasProductionEnv2 = prodEnv.includes(
        'SQL_CONNECTION_STRING'
      );
      expect(envFileHasProductionEnv2).toBeTruthy();
    } finally {
      await fs.remove(envFilePath);
      await fs.writeJSON(projectJsonPath, originalProjectJson, { spaces: 2 });
    }
    expect(client.telemetryEventStore).toHaveTelemetryEvents([
      { key: 'flag:prod', value: 'TRUE' },
      { key: 'flag:yes', value: 'TRUE' },
    ]);
  });

  it('should pull "production" env vars with `--target production`', async () => {
    const cwd = fixture('static-pull');
    useUser();
    useTeams('team_dummy');
    useProject({
      ...defaultProject,
      id: 'vercel-pull-next',
      name: 'vercel-pull-next',
    });
    const envFilePath = join(cwd, '.vercel', '.env.production.local');
    const projectJsonPath = join(cwd, '.vercel', 'project.json');
    const originalProjectJson = await fs.readJSON(
      join(cwd, '.vercel/project.json')
    );
    try {
      client.cwd = cwd;
      client.setArgv('build', '--yes', '--target', 'production');
      const exitCode = await build(client);
      expect(exitCode).toEqual(0);

      const prodEnv = await fs.readFile(envFilePath, 'utf8');
      const envFileHasProductionEnv1 = prodEnv.includes(
        'REDIS_CONNECTION_STRING'
      );
      expect(envFileHasProductionEnv1).toBeTruthy();
      const envFileHasProductionEnv2 = prodEnv.includes(
        'SQL_CONNECTION_STRING'
      );
      expect(envFileHasProductionEnv2).toBeTruthy();
    } finally {
      await fs.remove(envFilePath);
      await fs.writeJSON(projectJsonPath, originalProjectJson, { spaces: 2 });
    }
    expect(client.telemetryEventStore).toHaveTelemetryEvents([
      { key: 'option:target', value: 'production' },
      { key: 'flag:yes', value: 'TRUE' },
    ]);
  });

  it('should build root-level `middleware.js` and exclude from static files', async () => {
    const cwd = fixture('middleware');
    const output = join(cwd, '.vercel/output');
    client.cwd = cwd;
    const exitCode = await build(client);
    expect(exitCode).toEqual(0);

    // `builds.json` says that "@vercel/node" was run
    const builds = await fs.readJSON(join(output, 'builds.json'));
    expect(builds).toMatchObject({
      target: 'preview',
      builds: [
        {
          require: '@vercel/node',
          apiVersion: 3,
          use: '@vercel/node',
          src: 'middleware.js',
          config: {
            zeroConfig: true,
            middleware: true,
          },
        },
        {
          require: '@vercel/static',
          apiVersion: 2,
          use: '@vercel/static',
          src: REGEX_NON_VERCEL_PLATFORM_FILES,
          config: {
            zeroConfig: true,
          },
        },
      ],
    });

    // `config.json` includes the "middlewarePath" route
    const config = await fs.readJSON(join(output, 'config.json'));
    expect(config).toMatchObject({
      version: 3,
      routes: [
        {
          src: '^/.*$',
          middlewarePath: 'middleware',
          middlewareRawSrc: [],
          override: true,
          continue: true,
        },
        { handle: 'error' },
        { status: 404, src: '^(?!/api).*$', dest: '/404.html' },
      ],
    });

    // "static" directory contains `index.html`, but *not* `middleware.js`
    const staticFiles = await fs.readdir(join(output, 'static'));
    expect(staticFiles.sort()).toEqual(['index.html']);

    // "functions" directory contains `middleware.func`
    const functions = await fs.readdir(join(output, 'functions'));
    expect(functions.sort()).toEqual(['middleware.func']);
  });

  it('should build root-level `middleware.js` with "Root Directory" setting', async () => {
    const cwd = fixture('middleware-root-directory');
    const output = join(cwd, '.vercel/output');
    client.cwd = cwd;
    const exitCode = await build(client);
    expect(exitCode).toEqual(0);

    // `builds.json` says that "@vercel/static" was run
    const builds = await fs.readJSON(join(output, 'builds.json'));
    expect(builds).toMatchObject({
      target: 'preview',
      builds: [
        {
          require: '@vercel/node',
          apiVersion: 3,
          use: '@vercel/node',
          src: 'middleware.js',
          config: {
            zeroConfig: true,
            middleware: true,
          },
        },
        {
          require: '@vercel/static',
          apiVersion: 2,
          use: '@vercel/static',
          src: REGEX_NON_VERCEL_PLATFORM_FILES,
          config: {
            zeroConfig: true,
          },
        },
      ],
    });

    // `config.json` includes the "middlewarePath" route
    const config = await fs.readJSON(join(output, 'config.json'));
    expect(config).toMatchObject({
      version: 3,
      routes: [
        {
          src: '^/.*$',
          middlewarePath: 'middleware',
          middlewareRawSrc: [],
          override: true,
          continue: true,
        },
        { handle: 'error' },
        { status: 404, src: '^(?!/api).*$', dest: '/404.html' },
      ],
    });

    // "static" directory contains `index.html`, but *not* `middleware.js`
    const staticFiles = await fs.readdir(join(output, 'static'));
    expect(staticFiles.sort()).toEqual(['index.html']);

    // "functions" directory contains `middleware.func`
    const functions = await fs.readdir(join(output, 'functions'));
    expect(functions.sort()).toEqual(['middleware.func']);
  });

  it('should build root-level `middleware.js` with "matcher" config', async () => {
    const cwd = fixture('middleware-with-matcher');
    const output = join(cwd, '.vercel/output');
    client.cwd = cwd;
    const exitCode = await build(client);
    expect(exitCode).toEqual(0);

    // `builds.json` says that "@vercel/node" was run
    const builds = await fs.readJSON(join(output, 'builds.json'));
    expect(builds).toMatchObject({
      target: 'preview',
      builds: [
        {
          require: '@vercel/node',
          apiVersion: 3,
          use: '@vercel/node',
          src: 'middleware.js',
          config: {
            zeroConfig: true,
            middleware: true,
          },
        },
        {
          require: '@vercel/static',
          apiVersion: 2,
          use: '@vercel/static',
          src: REGEX_NON_VERCEL_PLATFORM_FILES,
          config: {
            zeroConfig: true,
          },
        },
      ],
    });

    // `config.json` includes the "middlewarePath" route
    const config = await fs.readJSON(join(output, 'config.json'));
    expect(config).toMatchObject({
      version: 3,
      routes: [
        {
          src: '^\\/about(?:\\/((?:[^\\/#\\?]+?)(?:\\/(?:[^\\/#\\?]+?))*))?[\\/#\\?]?$|^\\/dashboard(?:\\/((?:[^\\/#\\?]+?)(?:\\/(?:[^\\/#\\?]+?))*))?[\\/#\\?]?$',
          middlewarePath: 'middleware',
          middlewareRawSrc: ['/about/:path*', '/dashboard/:path*'],
          override: true,
          continue: true,
        },
        { handle: 'error' },
        { status: 404, src: '^(?!/api).*$', dest: '/404.html' },
      ],
    });

    // "static" directory contains `index.html`, but *not* `middleware.js`
    const staticFiles = await fs.readdir(join(output, 'static'));
    expect(staticFiles.sort()).toEqual(['index.html']);

    // "functions" directory contains `middleware.func`
    const functions = await fs.readdir(join(output, 'functions'));
    expect(functions.sort()).toEqual(['middleware.func']);
  });

  it('should support `--output` parameter', async () => {
    const cwd = fixture('static');
    const output = await getWriteableDirectory();
    try {
      client.cwd = cwd;
      client.setArgv('build', '--output', output);
      const exitCode = await build(client);
      expect(exitCode).toEqual(0);

      // `builds.json` says that "@vercel/static" was run
      const builds = await fs.readJSON(join(output, 'builds.json'));
      expect(builds).toMatchObject({
        target: 'preview',
        builds: [
          {
            require: '@vercel/static',
            apiVersion: 2,
            src: '**',
            use: '@vercel/static',
          },
        ],
      });

      // "static" directory contains static files
      const files = await fs.readdir(join(output, 'static'));
      expect(files.sort()).toEqual(['index.html']);
    } finally {
      await fs.remove(output);
    }
  });

  // This test is for `vercel-sapper` which doesn't export `version` property,
  // but returns a structure that's compatible with `version: 2`
  it("should support Builder that doesn't export `version`", async () => {
    const cwd = fixture('versionless-builder');
    const output = join(cwd, '.vercel/output');
    client.cwd = cwd;
    const exitCode = await build(client);
    expect(exitCode).toEqual(0);

    // `builds.json` says that "versionless-builder" was run
    const builds = await fs.readJSON(join(output, 'builds.json'));
    expect(builds).toMatchObject({
      target: 'preview',
      builds: [
        {
          require: 'versionless-builder',
          src: 'package.json',
          use: 'versionless-builder@0.0.0',
        },
      ],
    });

    // "static" directory contains static files
    const files = await fs.readdir(join(output, 'static'));
    expect(files.sort()).toEqual(['file']);

    expect(await fs.readFile(join(output, 'static/file'), 'utf8')).toEqual(
      'file contents'
    );

    // "functions" directory has output Functions
    const functions = await fs.readdir(join(output, 'functions'));
    expect(functions.sort()).toEqual(['withTrailingSlash.func']);
  });

  it('should store `detectBuilders()` error in `builds.json`', async () => {
    const cwd = fixture('error-vercel-json-validation');
    const output = join(cwd, '.vercel/output');
    client.cwd = cwd;
    const exitCode = await build(client);
    expect(exitCode).toEqual(1);

    // Error gets printed to the terminal
    await expect(client.stderr).toOutput(
      'Error: Function must contain at least one property.'
    );

    // `builds.json` contains top-level "error" property
    const builds = await fs.readJSON(join(output, 'builds.json'));
    expect(builds.builds).toBeUndefined();

    expect(builds.error.code).toEqual('invalid_function');
    expect(builds.error.message).toEqual(
      'Function must contain at least one property.'
    );

    // `config.json` contains `version`
    const configJson = await fs.readJSON(join(output, 'config.json'));
    expect(configJson.version).toBe(3);
  });

  it('should store Builder error in `builds.json`', async () => {
    const cwd = fixture('node-error');
    const output = join(cwd, '.vercel/output');
    client.cwd = cwd;
    const exitCode = await build(client);
    expect(exitCode).toEqual(1);

    // Error gets printed to the terminal
    await expect(client.stderr).toOutput("Duplicate identifier 'res'.");

    // `builds.json` contains "error" build
    const builds = await fs.readJSON(join(output, 'builds.json'));
    expect(builds.builds).toHaveLength(4);

    const errorBuilds = builds.builds.filter((b: any) => 'error' in b);
    expect(errorBuilds).toHaveLength(1);

    expect(errorBuilds[0].error).toEqual({
      name: 'Error',
      message: expect.stringContaining('TS1005'),
      stack: expect.stringContaining('api/typescript.ts'),
      hideStackTrace: true,
      code: 'NODE_TYPESCRIPT_ERROR',
    });

    // top level "error" also contains the same error
    expect(builds.error).toEqual({
      name: 'Error',
      message: expect.stringContaining('TS1005'),
      stack: expect.stringContaining('api/typescript.ts'),
      hideStackTrace: true,
      code: 'NODE_TYPESCRIPT_ERROR',
    });

    // `config.json` contains `version`
    const configJson = await fs.readJSON(join(output, 'config.json'));
    expect(configJson.version).toBe(3);
  });

  it('should error when "functions" has runtime that emits discontinued "nodejs12.x"', async () => {
    if (process.platform === 'win32') {
      // eslint-disable-next-line no-console
      console.log('Skipping test on Windows');
      return;
    }
    const cwd = fixture('discontinued-nodejs12.x');
    const output = join(cwd, '.vercel/output');
    client.cwd = cwd;
    const exitCode = await build(client);
    expect(exitCode).toEqual(1);

    // Error gets printed to the terminal
    await expect(client.stderr).toOutput(
      'The Runtime "vercel-php@0.1.0" is using "nodejs12.x", which is discontinued. Please upgrade your Runtime to a more recent version or consult the author for more details.'
    );

    // `builds.json` contains "error" build
    const builds = await fs.readJSON(join(output, 'builds.json'));
    const errorBuilds = builds.builds.filter((b: any) => 'error' in b);
    expect(errorBuilds).toHaveLength(1);
    expect(errorBuilds[0].error).toEqual({
      name: 'Error',
      message: expect.stringContaining('Please upgrade your Runtime'),
      stack: expect.stringContaining('Please upgrade your Runtime'),
      hideStackTrace: true,
      code: 'NODEJS_DISCONTINUED_VERSION',
      link: 'https://vercel.link/function-runtimes',
    });

    // top level "error" also contains the same error
    expect(builds.error).toEqual({
      name: 'Error',
      message: expect.stringContaining('Please upgrade your Runtime'),
      stack: expect.stringContaining('Please upgrade your Runtime'),
      hideStackTrace: true,
      code: 'NODEJS_DISCONTINUED_VERSION',
      link: 'https://vercel.link/function-runtimes',
    });

    // `config.json` contains `version`
    const configJson = await fs.readJSON(join(output, 'config.json'));
    expect(configJson.version).toBe(3);
  });

  it('should allow for missing "build" script', async () => {
    const cwd = fixture('static-with-pkg');
    const output = join(cwd, '.vercel/output');
    client.cwd = cwd;
    const exitCode = await build(client);
    expect(exitCode).toEqual(0);

    // `builds.json` says that "@vercel/static" was run
    const builds = await fs.readJSON(join(output, 'builds.json'));
    expect(builds).toMatchObject({
      target: 'preview',
      builds: [
        {
          require: '@vercel/static',
          apiVersion: 2,
          src: '**',
          use: '@vercel/static',
        },
      ],
    });

    // "static" directory contains static files
    const files = await fs.readdir(join(output, 'static'));
    expect(files.sort()).toEqual(['index.html', 'package.json']);
  });

  it('should set `VERCEL_ANALYTICS_ID` environment variable if Vercel Speed Insights is enabled', async () => {
    const cwd = fixture('vercel-analytics-id');
    const output = join(cwd, '.vercel/output');
    client.cwd = cwd;
    const exitCode = await build(client);
    expect(exitCode).toEqual(0);

    const env = await fs.readJSON(join(output, 'static', 'env.json'));
    expect(Object.keys(env).includes('VERCEL_ANALYTICS_ID')).toEqual(true);
  });

  describe.each([
    {
      fixtureName: 'with-valid-vercel-otel',
      dependency: '@vercel/otel',
      version: '1.11.0',
      expected: true,
    },
    {
      fixtureName: 'with-invalid-vercel-otel',
      dependency: '@vercel/otel',
      version: '1.10.0',
      expected: false,
    },
    {
      fixtureName: 'with-valid-opentelemetry-sdk',
      dependency: '@opentelemetry/sdk-trace-node',
      version: '1.19.0',
      expected: true,
    },
    {
      fixtureName: 'with-invalid-opentelemetry-sdk',
      dependency: '@opentelemetry/sdk-trace-node',
      version: '1.18.0',
      expected: false,
    },
    {
      fixtureName: 'with-valid-opentelemetry-api',
      dependency: '@opentelemetry/api',
      version: '1.7.0',
      expected: true,
    },
    {
      fixtureName: 'with-invalid-opentelemetry-api',
      dependency: '@opentelemetry/api',
      version: '1.6.0',
      expected: false,
    },
  ])(
    'with instrumentation $dependency',
    ({ fixtureName, dependency, version, expected }) => {
      it(`should ${expected ? 'set' : 'not set'} VERCEL_TRACING_DISABLE_AUTOMATIC_FETCH_INSTRUMENTATION if ${dependency} version ${version} or higher is detected`, async () => {
        const cwd = fixture(fixtureName);
        const output = join(cwd, '.vercel/output');
        client.cwd = cwd;
        const exitCode = await build(client);
        expect(exitCode).toEqual(0);

        const env = await fs.readJSON(join(output, 'static', 'env.json'));
        expect(
          Object.keys(env).includes(
            'VERCEL_TRACING_DISABLE_AUTOMATIC_FETCH_INSTRUMENTATION'
          )
        ).toEqual(expected);

        // "functions/api" directory has output Functions
        const functions = await fs.readdir(join(output, 'functions/api'));
        expect(functions.sort()).toEqual(['index.func']);

        const vcConfig = await fs.readJSON(
          join(output, 'functions/api/index.func/.vc-config.json')
        );
        expect(vcConfig.shouldDisableAutomaticFetchInstrumentation).toBe(
          expected
        );
      });
    }
  );

  it('should load environment variables from `.vercel/.env.preview.local`', async () => {
    const cwd = fixture('env-from-vc-pull');
    const output = join(cwd, '.vercel/output');
    client.cwd = cwd;
    const exitCode = await build(client);
    expect(exitCode).toEqual(0);

    const env = await fs.readJSON(join(output, 'static', 'env.json'));
    expect(env['ENV_FILE']).toEqual('preview');
  });

  it('should load environment variables from `.vercel/.env.production.local`', async () => {
    const cwd = fixture('env-from-vc-pull');
    const output = join(cwd, '.vercel/output');
    client.cwd = cwd;
    client.setArgv('build', '--prod');
    const exitCode = await build(client);
    expect(exitCode).toEqual(0);

    const env = await fs.readJSON(join(output, 'static', 'env.json'));
    expect(env['ENV_FILE']).toEqual('production');
  });

  it('should NOT load environment variables from `.env`', async () => {
    const cwd = fixture('env-root-level');
    const output = join(cwd, '.vercel/output');
    client.cwd = cwd;
    const exitCode = await build(client);
    expect(exitCode).toEqual(0);

    const env = await fs.readJSON(join(output, 'static', 'env.json'));
    // The `.env` in this fixture has `ENV_FILE=root"`,
    // so if that's not defined then we're good
    expect(env['ENV_FILE']).toBeUndefined();
  });

  it('should apply function configuration from "vercel.json" to Serverless Functions', async () => {
    const cwd = fixture('lambda-with-128-memory');
    const output = join(cwd, '.vercel/output');
    client.cwd = cwd;
    const exitCode = await build(client);
    expect(exitCode).toEqual(0);

    // "functions/api" directory has output Functions
    const functions = await fs.readdir(join(output, 'functions/api'));
    expect(functions.sort()).toEqual(['memory.func']);

    const vcConfig = await fs.readJSON(
      join(output, 'functions/api/memory.func/.vc-config.json')
    );
    expect(vcConfig).toMatchObject({
      handler: 'api/memory.js',
      memory: 128,
      environment: {},
      launcherType: 'Nodejs',
      shouldAddHelpers: true,
      shouldAddSourcemapSupport: false,
      awsLambdaHandler: '',
    });
  });

  it('should apply project settings overrides from "vercel.json"', async () => {
    if (process.platform === 'win32') {
      // this test runs a build command with `mkdir -p` which is unsupported on Windows
      // eslint-disable-next-line no-console
      console.log('Skipping test on Windows');
      return;
    }

    const cwd = fixture('project-settings-override');
    const output = join(cwd, '.vercel/output');
    client.cwd = cwd;
    const exitCode = await build(client);
    expect(exitCode).toEqual(0);

    // The `buildCommand` override in "vercel.json" outputs "3" to the
    // index.txt file, so verify that that was produced in the build output
    const contents = await fs.readFile(
      join(output, 'static/index.txt'),
      'utf8'
    );
    expect(contents.trim()).toEqual('3');
  });

  it('should set VERCEL_PROJECT_SETTINGS_ environment variables', async () => {
    const cwd = fixture('project-settings-env-vars');
    const output = join(cwd, '.vercel/output');
    client.cwd = cwd;
    const exitCode = await build(client);
    expect(exitCode).toEqual(0);

    const contents = await fs.readJSON(join(output, 'static/env.json'));
    expect(contents).toMatchObject({
      VERCEL_PROJECT_SETTINGS_BUILD_COMMAND: `node build.cjs`,
      VERCEL_PROJECT_SETTINGS_INSTALL_COMMAND: '',
      VERCEL_PROJECT_SETTINGS_OUTPUT_DIRECTORY: 'out',
      VERCEL_PROJECT_SETTINGS_NODE_VERSION: '22.x',
    });
  });

  it('should apply "images" configuration from `vercel.json`', async () => {
    const cwd = fixture('images');
    const output = join(cwd, '.vercel/output');
    client.cwd = cwd;
    const exitCode = await build(client);
    expect(exitCode).toEqual(0);

    // `config.json` includes "images" from `vercel.json`
    const configJson = await fs.readJSON(join(output, 'config.json'));
    expect(configJson).toMatchObject({
      images: {
        sizes: [256, 384, 600, 1000],
        qualities: [25, 50, 75],
        domains: [],
        minimumCacheTTL: 60,
        localPatterns: [{ search: '' }],
        formats: ['image/avif', 'image/webp'],
        contentDispositionType: 'attachment',
      },
    });
  });

  it('should fail with invalid "rewrites" configuration from `vercel.json`', async () => {
    const cwd = fixture('invalid-rewrites');
    const output = join(cwd, '.vercel/output');
    client.cwd = cwd;
    const exitCode = await build(client);
    expect(exitCode).toEqual(1);
    await expect(client.stderr).toOutput(
      'Error: Invalid vercel.json - `rewrites[2]` should NOT have additional property `src`. Did you mean `source`?' +
        '\n' +
        'View Documentation: https://vercel.com/docs/concepts/projects/project-configuration#rewrites'
    );
    const builds = await fs.readJSON(join(output, 'builds.json'));
    expect(builds.builds).toBeUndefined();
    expect(builds.error).toEqual({
      name: 'Error',
      message:
        'Invalid vercel.json - `rewrites[2]` should NOT have additional property `src`. Did you mean `source`?',
      stack: expect.stringContaining('at Module.validateConfig'),
      hideStackTrace: true,
      code: 'INVALID_VERCEL_CONFIG',
      link: 'https://vercel.com/docs/concepts/projects/project-configuration#rewrites',
      action: 'View Documentation',
    });
    const configJson = await fs.readJSON(join(output, 'config.json'));
    expect(configJson.version).toBe(3);
  });

  it('should include crons property in build output', async () => {
    const cwd = fixture('with-cron');
    const output = join(cwd, '.vercel', 'output');
    client.cwd = cwd;
    const exitCode = await build(client);
    expect(exitCode).toBe(0);

    const config = await fs.readJSON(join(output, 'config.json'));
    expect(config).toHaveProperty('crons', [
      {
        path: '/api/cron-job',
        schedule: '0 0 * * *',
      },
    ]);
  });

  describe('deploymentId validation', () => {
    const staticFixture = fixture('static');
    const generatedFiles = ['build.mjs', 'package.json', 'vercel.json'];

    afterEach(async () => {
      // Clean up generated files from the static fixture
      await Promise.all(
        generatedFiles.map(file =>
          fs.remove(join(staticFixture, file)).catch(() => {})
        )
      );
    });

    it('should reject deploymentId with dpl_ prefix in config.json', async () => {
      const cwd = fixture('static');
      const output = join(cwd, '.vercel/output');

      // Create a build script that creates config.json with invalid deploymentId
      // This simulates a builder using Build Output API that creates an invalid config.json
      const buildScript = join(cwd, 'build.mjs');
      await fs.writeFile(
        buildScript,
        `import fs from 'fs';
import { join } from 'path';

const outputDir = join(process.cwd(), '.vercel', 'output');
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  join(outputDir, 'config.json'),
  JSON.stringify({
    version: 3,
    deploymentId: 'dpl_invalid123',
  }, null, 2)
);
`
      );

      // Create package.json with build script
      await fs.writeJSON(join(cwd, 'package.json'), {
        scripts: {
          build: 'node build.mjs',
        },
      });

      // Create vercel.json to use the build script
      await fs.writeJSON(join(cwd, 'vercel.json'), {
        builds: [
          {
            src: 'package.json',
            use: '@vercel/static-build',
          },
        ],
      });

      client.cwd = cwd;
      const exitCode = await build(client);
      expect(exitCode).toEqual(1);

      await expect(client.stderr).toOutput(
        'cannot start with the "dpl_" prefix. Please choose a different deploymentId in your config'
      );

      const builds = await fs.readJSON(join(output, 'builds.json'));
      expect(builds.error).toMatchObject({
        code: 'INVALID_DEPLOYMENT_ID',
        message: expect.stringContaining('cannot start with the "dpl_" prefix'),
      });
    });

    it('should allow deploymentId without dpl_ prefix in config.json', async () => {
      const cwd = fixture('static');

      // Create a build script that creates config.json with valid deploymentId
      // This simulates a builder using Build Output API that creates a valid config.json
      const buildScript = join(cwd, 'build.mjs');
      await fs.writeFile(
        buildScript,
        `import fs from 'fs';
import { join } from 'path';

const outputDir = join(process.cwd(), '.vercel', 'output');
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  join(outputDir, 'config.json'),
  JSON.stringify({
    version: 3,
    deploymentId: 'my-deployment-123',
  }, null, 2)
);
`
      );

      // Create package.json with build script
      await fs.writeJSON(join(cwd, 'package.json'), {
        scripts: {
          build: 'node build.mjs',
        },
      });

      // Create vercel.json to use the build script
      await fs.writeJSON(join(cwd, 'vercel.json'), {
        builds: [
          {
            src: 'package.json',
            use: '@vercel/static-build',
          },
        ],
      });

      client.cwd = cwd;
      const exitCode = await build(client);
      expect(exitCode).toEqual(0);
    });

    it('should reject deploymentId with invalid characters (spaces) in config.json', async () => {
      const cwd = fixture('static');
      const output = join(cwd, '.vercel/output');

      const buildScript = join(cwd, 'build.mjs');
      await fs.writeFile(
        buildScript,
        `import fs from 'fs';
import { join } from 'path';

const outputDir = join(process.cwd(), '.vercel', 'output');
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  join(outputDir, 'config.json'),
  JSON.stringify({
    version: 3,
    deploymentId: 'my deployment id',
  }, null, 2)
);
`
      );

      await fs.writeJSON(join(cwd, 'package.json'), {
        scripts: {
          build: 'node build.mjs',
        },
      });

      await fs.writeJSON(join(cwd, 'vercel.json'), {
        builds: [
          {
            src: 'package.json',
            use: '@vercel/static-build',
          },
        ],
      });

      client.cwd = cwd;
      const exitCode = await build(client);
      expect(exitCode).toEqual(1);

      await expect(client.stderr).toOutput(
        'contains invalid characters. Only alphanumeric characters'
      );

      const builds = await fs.readJSON(join(output, 'builds.json'));
      expect(builds.error).toMatchObject({
        code: 'INVALID_DEPLOYMENT_ID',
        message: expect.stringContaining('contains invalid characters'),
      });
    });

    it('should reject deploymentId with invalid characters (question mark) in config.json', async () => {
      const cwd = fixture('static');
      const output = join(cwd, '.vercel/output');

      const buildScript = join(cwd, 'build.mjs');
      await fs.writeFile(
        buildScript,
        `import fs from 'fs';
import { join } from 'path';

const outputDir = join(process.cwd(), '.vercel', 'output');
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  join(outputDir, 'config.json'),
  JSON.stringify({
    version: 3,
    deploymentId: 'my-deployment?id=123',
  }, null, 2)
);
`
      );

      await fs.writeJSON(join(cwd, 'package.json'), {
        scripts: {
          build: 'node build.mjs',
        },
      });

      await fs.writeJSON(join(cwd, 'vercel.json'), {
        builds: [
          {
            src: 'package.json',
            use: '@vercel/static-build',
          },
        ],
      });

      client.cwd = cwd;
      const exitCode = await build(client);
      expect(exitCode).toEqual(1);

      const builds = await fs.readJSON(join(output, 'builds.json'));
      expect(builds.error).toMatchObject({
        code: 'INVALID_DEPLOYMENT_ID',
        message: expect.stringContaining('contains invalid characters'),
      });
    });

    it('should allow deploymentId with valid characters (base62 + hyphen + underscore) in config.json', async () => {
      const cwd = fixture('static');

      const buildScript = join(cwd, 'build.mjs');
      await fs.writeFile(
        buildScript,
        `import fs from 'fs';
import { join } from 'path';

const outputDir = join(process.cwd(), '.vercel', 'output');
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  join(outputDir, 'config.json'),
  JSON.stringify({
    version: 3,
    deploymentId: 'my-deployment_v2-abc123XYZ',
  }, null, 2)
);
`
      );

      await fs.writeJSON(join(cwd, 'package.json'), {
        scripts: {
          build: 'node build.mjs',
        },
      });

      await fs.writeJSON(join(cwd, 'vercel.json'), {
        builds: [
          {
            src: 'package.json',
            use: '@vercel/static-build',
          },
        ],
      });

      client.cwd = cwd;
      const exitCode = await build(client);
      expect(exitCode).toEqual(0);
    });

    it('should reject deploymentId longer than 32 characters in config.json', async () => {
      const cwd = fixture('static');
      const output = join(cwd, '.vercel/output');

      // Create a build script that creates config.json with deploymentId > 32 chars
      const buildScript = join(cwd, 'build.mjs');
      await fs.writeFile(
        buildScript,
        `import fs from 'fs';
import { join } from 'path';

const outputDir = join(process.cwd(), '.vercel', 'output');
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  join(outputDir, 'config.json'),
  JSON.stringify({
    version: 3,
    deploymentId: 'this-is-a-very-long-deployment-id-that-exceeds-32-chars',
  }, null, 2)
);
`
      );

      // Create package.json with build script
      await fs.writeJSON(join(cwd, 'package.json'), {
        scripts: {
          build: 'node build.mjs',
        },
      });

      // Create vercel.json to use the build script
      await fs.writeJSON(join(cwd, 'vercel.json'), {
        builds: [
          {
            src: 'package.json',
            use: '@vercel/static-build',
          },
        ],
      });

      client.cwd = cwd;
      const exitCode = await build(client);
      expect(exitCode).toEqual(1);

      await expect(client.stderr).toOutput(
        'must be 32 characters or less. Please choose a shorter deploymentId in your config'
      );

      const builds = await fs.readJSON(join(output, 'builds.json'));
      expect(builds.error).toMatchObject({
        code: 'INVALID_DEPLOYMENT_ID',
        message: expect.stringContaining('must be 32 characters or less'),
      });
    });

    it('should allow deploymentId with exactly 32 characters in config.json', async () => {
      const cwd = fixture('static');

      // Create a build script that creates config.json with exactly 32 character deploymentId
      const buildScript = join(cwd, 'build.mjs');
      await fs.writeFile(
        buildScript,
        `import fs from 'fs';
import { join } from 'path';

const outputDir = join(process.cwd(), '.vercel', 'output');
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  join(outputDir, 'config.json'),
  JSON.stringify({
    version: 3,
    deploymentId: '12345678901234567890123456789012',
  }, null, 2)
);
`
      );

      // Create package.json with build script
      await fs.writeJSON(join(cwd, 'package.json'), {
        scripts: {
          build: 'node build.mjs',
        },
      });

      // Create vercel.json to use the build script
      await fs.writeJSON(join(cwd, 'vercel.json'), {
        builds: [
          {
            src: 'package.json',
            use: '@vercel/static-build',
          },
        ],
      });

      client.cwd = cwd;
      const exitCode = await build(client);
      expect(exitCode).toEqual(0);
    });
  });
});
