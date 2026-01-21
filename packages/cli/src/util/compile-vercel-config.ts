import { mkdir, writeFile, unlink, access } from 'fs/promises';
import { join, basename } from 'path';
import { fork } from 'child_process';
import { config as dotenvConfig } from 'dotenv';
import output from '../output-manager';
import { NowBuildError } from '@vercel/build-utils';
import { VERCEL_DIR } from './projects/link';
import { ConflictingConfigFiles } from './errors-ts';

    const normalizedConfig = normalizeConfig(config);
    await writeFile(
      compiledConfigPath,
      JSON.stringify(normalizedConfig, null, 2),
      'utf-8'
    );

    output.debug(`Compiled ${vercelConfigPath} -> ${compiledConfigPath}`);

    return {
      configPath: compiledConfigPath,
      wasCompiled: true,
      sourceFile: (await findSourceVercelConfigFile(workPath)) ?? undefined,
    };
  } catch (error: any) {
    throw new NowBuildError({
      code: 'vercel_ts_compilation_failed',
      message: `Failed to compile ${vercelConfigPath}: ${error.message}`,
      link: 'https://vercel.com/docs/projects/project-configuration',
    });
  } finally {
    await Promise.all([
      unlink(tempOutPath).catch(err => {
        if (err.code !== 'ENOENT') {
          output.debug(`Failed to cleanup temp file: ${err}`);
        }
      }),
      unlink(loaderPath).catch(err => {
        if (err.code !== 'ENOENT') {
          output.debug(`Failed to cleanup loader file: ${err}`);
        }
      }),
    ]);
  }
}

export async function getVercelConfigPath(workPath: string): Promise<string> {
  const vercelJsonPath = join(workPath, 'vercel.json');
  const nowJsonPath = join(workPath, 'now.json');
  const compiledConfigPath = join(workPath, VERCEL_DIR, 'vercel.json');

  if (await fileExists(vercelJsonPath)) {
    return vercelJsonPath;
  }

  if (await fileExists(nowJsonPath)) {
    return nowJsonPath;
  }

  if (await fileExists(compiledConfigPath)) {
    return compiledConfigPath;
  }

  return nowJsonPath;
}
