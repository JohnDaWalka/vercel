import yaml from 'js-yaml';
import toml from '@iarna/toml';
import { readFile } from 'fs-extra';
import { isErrnoException } from '@vercel/error-utils';

/**
 * Reads and parses the package.json file from a directory.
 * Returns an empty object if the file doesn't exist or can't be parsed.
 */
export async function getPackageJson(dir: string): Promise<PackageJson> {
  const packagePath = join(dir, 'package.json');

  try {
    return JSON.parse(await readFile(packagePath, 'utf8'));
  } catch (err) {
    return {};
  }
}
