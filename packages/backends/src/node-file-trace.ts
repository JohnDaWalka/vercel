import {
  isBunVersion,
<<<<<<< HEAD
  BuildOptions,
  FileBlob,
  FileFsRef,
  Files,
=======
  FileBlob,
  FileFsRef,
  type BuildOptions,
  type Files,
  type NodeVersion,
>>>>>>> upstream/main
} from '@vercel/build-utils';
import { nodeFileTrace as nft } from '@vercel/nft';
import { existsSync, lstatSync, readFileSync } from 'fs';
import { join, relative } from 'path';
<<<<<<< HEAD
import { type downloadInstallAndBundle } from './utils.js';

export const nodeFileTrace = async (
  args: BuildOptions,
  downloadResult: Awaited<ReturnType<typeof downloadInstallAndBundle>>,
=======

export const nodeFileTrace = async (
  args: BuildOptions,
  nodeVersion: NodeVersion,
>>>>>>> upstream/main
  output: {
    dir: string;
    handler: string;
  }
) => {
  const { dir: outputDir, handler } = output;
  const entry = join(outputDir, handler);
  const files: Files = {};
<<<<<<< HEAD
  const isBun = isBunVersion(downloadResult.nodeVersion);
=======
  const isBun = isBunVersion(nodeVersion);
>>>>>>> upstream/main
  const conditions = isBun ? ['bun'] : undefined;
  const nftResult = await nft([entry], {
    base: args.repoRootPath,
    ignore: args.config.excludeFiles,
    conditions,
    mixedModules: true,
  });

  const packageJsonPath = join(args.workPath, 'package.json');

  if (existsSync(packageJsonPath)) {
    const { mode } = lstatSync(packageJsonPath);
    const source = readFileSync(packageJsonPath);
    const relPath = relative(args.repoRootPath, packageJsonPath);
    files[relPath] = new FileBlob({ data: source, mode });
  }

  for (const file of nftResult.fileList) {
    const fullPath = join(args.repoRootPath, file);
    const stats = lstatSync(fullPath, {});
    files[file] = new FileFsRef({ fsPath: fullPath, mode: stats.mode });
  }

  return { files };
};
