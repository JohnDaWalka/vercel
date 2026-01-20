import { delimiter } from 'path';
import { dirname, join } from 'path';
import {
  download,
  runNpmInstall,
  runPackageJsonScript,
<<<<<<< HEAD
  getNodeVersion,
  getSpawnOptions,
=======
>>>>>>> upstream/main
  execCommand,
  getEnvForPackageManager,
  scanParentDirs,
  getNodeBinPaths,
} from '@vercel/build-utils';
import type { BuildV2 } from '@vercel/build-utils';

<<<<<<< HEAD
export async function downloadInstallAndBundle(args: Parameters<BuildV2>[0]) {
=======
export async function downloadInstallAndBundle(
  args: Parameters<BuildV2>[0]
): Promise<{
  spawnEnv: {
    [x: string]: string | undefined;
  };
  entrypointFsDirname: string;
}> {
>>>>>>> upstream/main
  const { entrypoint, files, workPath, meta, config, repoRootPath } = args;
  await download(files, workPath, meta);

  const entrypointFsDirname = join(workPath, dirname(entrypoint));
<<<<<<< HEAD
  const nodeVersion = await getNodeVersion(
    entrypointFsDirname,
    undefined,
    config,
    meta
  );

  const spawnOpts = getSpawnOptions(meta || {}, nodeVersion);
=======
>>>>>>> upstream/main

  const {
    cliType,
    lockfileVersion,
    packageJsonPackageManager,
    turboSupportsCorepackHome,
  } = await scanParentDirs(entrypointFsDirname, true, repoRootPath);

<<<<<<< HEAD
  spawnOpts.env = getEnvForPackageManager({
    cliType,
    lockfileVersion,
    packageJsonPackageManager,
    env: spawnOpts.env || {},
=======
  const spawnEnv = getEnvForPackageManager({
    cliType,
    lockfileVersion,
    packageJsonPackageManager,
    env: process.env,
>>>>>>> upstream/main
    turboSupportsCorepackHome,
    projectCreatedAt: config.projectSettings?.createdAt,
  });

  const installCommand = config.projectSettings?.installCommand;
  if (typeof installCommand === 'string') {
    if (installCommand.trim()) {
      console.log(`Running "install" command: \`${installCommand}\`...`);
      await execCommand(installCommand, {
<<<<<<< HEAD
        ...spawnOpts,
=======
        env: spawnEnv,
>>>>>>> upstream/main
        cwd: entrypointFsDirname,
      });
    } else {
      console.log(`Skipping "install" command...`);
    }
  } else {
    await runNpmInstall(
      entrypointFsDirname,
      [],
<<<<<<< HEAD
      spawnOpts,
=======
      {
        env: spawnEnv,
      },
>>>>>>> upstream/main
      meta,
      config.projectSettings?.createdAt
    );
  }
<<<<<<< HEAD
  return { entrypointFsDirname, nodeVersion, spawnOpts };
=======
  return { entrypointFsDirname, spawnEnv };
>>>>>>> upstream/main
}

export async function maybeExecBuildCommand(
  args: Parameters<BuildV2>[0],
<<<<<<< HEAD
  options: Awaited<ReturnType<typeof downloadInstallAndBundle>>
=======
  {
    spawnEnv,
    entrypointFsDirname,
  }: {
    spawnEnv: {
      [x: string]: string | undefined;
    };
    entrypointFsDirname: string;
  }
>>>>>>> upstream/main
) {
  const projectBuildCommand = args.config.projectSettings?.buildCommand;
  if (projectBuildCommand) {
    // Add node_modules/.bin to PATH so commands like 'cervel' can be found
    const repoRoot = args.repoRootPath || args.workPath;
    const nodeBinPaths = getNodeBinPaths({
      base: repoRoot,
      start: args.workPath,
    });
    const nodeBinPath = nodeBinPaths.join(delimiter);
    const env = {
<<<<<<< HEAD
      ...options.spawnOpts.env,
      PATH: `${nodeBinPath}${delimiter}${options.spawnOpts.env?.PATH || process.env.PATH}`,
    };

    return execCommand(projectBuildCommand, {
      ...options.spawnOpts,
=======
      ...spawnEnv,
      PATH: `${nodeBinPath}${delimiter}${spawnEnv?.PATH || process.env.PATH}`,
    };

    return execCommand(projectBuildCommand, {
>>>>>>> upstream/main
      env,
      cwd: args.workPath,
    });
  }

  // I don't think we actually want to support vercel-build or now-build because those are hacks for controlling api folder builds
  const possibleScripts = ['build'];

  return runPackageJsonScript(
<<<<<<< HEAD
    options.entrypointFsDirname,
    possibleScripts,
    options.spawnOpts,
=======
    entrypointFsDirname,
    possibleScripts,
    { env: spawnEnv },
>>>>>>> upstream/main
    args.config.projectSettings?.createdAt
  );
}
