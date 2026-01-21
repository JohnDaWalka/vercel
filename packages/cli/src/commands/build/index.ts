import chalk from 'chalk';
import dotenv from 'dotenv';
import fs, { existsSync } from 'fs-extra';
import minimatch from 'minimatch';
import { join, normalize, relative, resolve, sep } from 'path';
import semver from 'semver';

import {
  download,
  FileFsRef,
  getDiscontinuedNodeVersions,
  getInstalledPackageVersion,
  normalizePath,
  NowBuildError,
  runNpmInstall,
  runCustomInstallCommand,
import { validateCronSecret } from '../../util/validate-cron-secret';
import {
  compileVercelConfig,
  findSourceVercelConfigFile,
  DEFAULT_VERCEL_CONFIG_FILENAME,
} from '../../util/compile-vercel-config';
import { help } from '../help';
import { pullCommandLogic } from '../pull';
import { buildCommand } from './command';
import { mkdir, writeFile } from 'fs/promises';

type BuildResult = BuildResultV2 | BuildResultV3;

interface SerializedBuilder extends Builder {
  error?: any;
  require?: string;
  requirePath?: string;
  apiVersion: number;
}

/**
 *  Build Output API `config.json` file interface.
 */
interface BuildOutputConfig {
  version?: 3;
  wildcard?: BuildResultV2Typical['wildcard'];
  images?: BuildResultV2Typical['images'];
  routes?: BuildResultV2Typical['routes'];
  overrides?: Record<string, PathOverride>;
  framework?: {
    version: string;
  };
  crons?: Cron[];

    // Clean up VERCEL_INSTALL_COMPLETED to allow subsequent builds in the same process
    delete process.env.VERCEL_INSTALL_COMPLETED;

    // Reset customInstallCommandSet to allow subsequent builds in the same process
    resetCustomInstallCommandSet();
  }
}

/**
 * Execute the Project's builders. If this function throws an error,
 * then it will be serialized into the `builds.json` manifest file.
 */
async function doBuild(
  client: Client,
  project: ProjectLinkAndSettings,
  buildsJson: BuildsManifest,
  cwd: string,
  outputDir: string,
  span: Span,
  standalone: boolean = false
): Promise<void> {
  const { localConfigPath } = client;

    process.env.VERCEL_INSTALL_COMPLETED = '1';
  }

  const compileResult = await compileVercelConfig(workPath);

  const vercelConfigPath =
    localConfigPath ||
    compileResult.configPath ||
    join(workPath, 'vercel.json');

  const [pkg, vercelConfig, nowConfig, hasInstrumentation] = await Promise.all([
    readJSONFile<PackageJson>(join(workPath, 'package.json')),
    readJSONFile<VercelConfig>(vercelConfigPath),
    readJSONFile<VercelConfig>(join(workPath, 'now.json')),
    detectInstrumentation(new LocalFileSystemDetector(workPath)),
  ]);

  if (pkg instanceof CantParseJSONFile) throw pkg;
  if (vercelConfig instanceof CantParseJSONFile) throw vercelConfig;
  if (nowConfig instanceof CantParseJSONFile) throw nowConfig;

  if (hasInstrumentation) {
    output.debug(
      'OpenTelemetry instrumentation detected. Automatic fetch instrumentation will be disabled.'
    );
    process.env.VERCEL_TRACING_DISABLE_AUTOMATIC_FETCH_INSTRUMENTATION = '1';
  }

  if (vercelConfig) {
    vercelConfig[fileNameSymbol] = compileResult.wasCompiled
      ? compileResult.sourceFile || DEFAULT_VERCEL_CONFIG_FILENAME
      : 'vercel.json';
  } else if (nowConfig) {
    nowConfig[fileNameSymbol] = 'now.json';
  }

  const localConfig = vercelConfig || nowConfig || {};
  const validateError = validateConfig(localConfig);

  if (validateError) {
    throw validateError;
  }

              builderPkg.name !== '@vercel/static' &&
              isBackendBuilder(build)
            ) {
              const experimentalBackendBuilder = await import(
                '@vercel/backends'
              );
              return experimentalBackendBuilder.build(buildOptions);
            }
            return builder.build(buildOptions);
          }
        );

        // If the build result has no routes and the framework has default routes,
        // then add the default routes to the build result
        if (
          buildConfig.zeroConfig &&
          isFrontendBuilder &&
          'output' in buildResult &&
          !buildResult.routes
        ) {
          const framework = frameworkList.find(
            f => f.slug === buildConfig.framework
          );
          if (framework) {
            const defaultRoutes = await getFrameworkRoutes(framework, workPath);
            buildResult.routes = defaultRoutes;
          }
        }
      } finally {
        // Make sure we don't fail the build
        try {
          const builderDiagnostics = await builderSpan
            .child('vc.builder.diagnostics')
            .trace(async () => {
              return await builder.diagnostics?.(buildOptions);
            });
          Object.assign(diagnostics, builderDiagnostics);
        } catch (error) {
          output.error('Collecting diagnostics failed');
          output.debug(error);
        }
      }

      if (
        buildResult &&
        'output' in buildResult &&
        'runtime' in buildResult.output &&
        'type' in buildResult.output &&
        buildResult.output.type === 'Lambda'
      ) {
        const lambdaRuntime = buildResult.output.runtime;
        if (
          getDiscontinuedNodeVersions().some(o => o.runtime === lambdaRuntime)
        ) {
          throw new NowBuildError({
            code: 'NODEJS_DISCONTINUED_VERSION',
            message: `The Runtime "${build.use}" is using "${lambdaRuntime}", which is discontinued. Please upgrade your Runtime to a more recent version or consult the author for more details.`,
            link: 'https://vercel.link/function-runtimes',
          });
        }
      }

      if (
        'output' in buildResult &&
        buildResult.output &&
        (isBackendBuilder(build) || build.use === '@vercel/python')
      ) {
        const routesJsonPath = join(workPath, '.vercel', 'routes.json');
        if (existsSync(routesJsonPath)) {
          try {
            const routesJson = await readJSONFile(routesJsonPath);
            if (
              routesJson &&
              typeof routesJson === 'object' &&
              'routes' in routesJson &&
              Array.isArray(routesJson.routes)
            ) {
              // This is a v2 build output, so only remap the outputs
              // if we have an index lambda
              const indexLambda =
                'index' in buildResult.output
                  ? (buildResult.output['index'] as Lambda)
                  : undefined;
              // Convert routes from introspection format to Vercel routing format
              const convertedRoutes = [];
              const convertedOutputs: Record<string, Lambda> = indexLambda
                ? { index: indexLambda }
                : {};
              for (const route of routesJson.routes) {
                if (typeof route.source !== 'string') {
                  continue;
                }
                const { src } = sourceToRegex(route.source);
                const newRoute: Route = {
                  src,
                  dest: route.source,
                };
                if (route.methods) {
                  newRoute.methods = route.methods;
                }
                if (route.source === '/') {
                  continue;
                }
                if (indexLambda) {
                  convertedOutputs[route.source] = indexLambda;
                }
                convertedRoutes.push(newRoute);
              }
              // Wrap routes with filesystem handler and catch-all
              (buildResult as BuildResultV2Typical).routes = [
                { handle: 'filesystem' },
                ...convertedRoutes,
                { src: '/(.*)', dest: '/' },
              ];
              if (indexLambda) {
                (buildResult as BuildResultV2Typical).output = convertedOutputs;
              }
            }
          } catch (error) {
            output.error(`Failed to read routes.json: ${error}`);
          }
        }
      }

      // Store the build result to generate the final `config.json` after
      // all builds have completed
      buildResults.set(build, buildResult);

      let buildOutputLength = 0;
      if ('output' in buildResult) {
        buildOutputLength = Array.isArray(buildResult.output)
          ? buildResult.output.length
          : 1;
      }

      // Start flushing the file outputs to the filesystem asynchronously
      ops.push(
        builderSpan
          .child('vc.builder.writeBuildResult', {
            buildOutputLength: String(buildOutputLength),
          })
          .trace<Record<string, PathOverride> | undefined | void>(() =>
            writeBuildResult({
              repoRootPath,
              outputDir,
              buildResult,
              build,
              builder,
              builderPkg,
              vercelConfig: localConfig,
              standalone,
              workPath,
            })
          )
          .then(
            (override: Record<string, PathOverride> | undefined | void) => {
              if (override) overrides.push(override);
            },
            (err: Error) => err
          )
      );
    } catch (err: any) {
      const buildJsonBuild = buildsJsonBuilds.get(build);
      if (buildJsonBuild) {
        buildJsonBuild.error = toEnumerableError(err);
      }
      throw err;
    } finally {
      ops.push(
        download(diagnostics, join(outputDir, 'diagnostics')).then(
          () => undefined,
          err => err
        )
      );
    }
  }

  if (corepackShimDir) {
    cleanupCorepack(corepackShimDir);
  }

  // Wait for filesystem operations to complete
  // TODO render progress bar?
  const errors = await Promise.all(ops);
  for (const error of errors) {
    if (error) {
      throw error;
    }
  }

  let needBuildsJsonOverride = false;
  const speedInsightsVersion = await getInstalledPackageVersion(
    '@vercel/speed-insights'
  );
  if (speedInsightsVersion) {
    buildsJson.features = {
      ...(buildsJson.features ?? {}),
      speedInsightsVersion,
    };
    needBuildsJsonOverride = true;
  }
  const webAnalyticsVersion =
    await getInstalledPackageVersion('@vercel/analytics');
  if (webAnalyticsVersion) {
    buildsJson.features = {
      ...(buildsJson.features ?? {}),
      webAnalyticsVersion,
    };
    needBuildsJsonOverride = true;
  }
  if (needBuildsJsonOverride) {
    await writeBuildJson(buildsJson, outputDir);
  }

  // Merge existing `config.json` file into the one that will be produced
  const configPath = join(outputDir, 'config.json');
  const existingConfig = await readJSONFile<BuildOutputConfig>(configPath);
  if (existingConfig instanceof CantParseJSONFile) {
    throw existingConfig;
  }
  if (existingConfig) {
  const mergedDeploymentId = await mergeDeploymentId(
    existingConfig?.deploymentId,
    buildResults.values(),
    workPath
  );

  // Validate merged deploymentId if present (from build results)
  if (mergedDeploymentId) {
    if (mergedDeploymentId.startsWith('dpl_')) {
      throw new NowBuildError({
        code: 'INVALID_DEPLOYMENT_ID',
        message: `The deploymentId "${mergedDeploymentId}" cannot start with the "dpl_" prefix. Please choose a different deploymentId in your config.`,
        link: 'https://vercel.com/docs/skew-protection#custom-skew-protection-deployment-id',
      });
    }
    if (mergedDeploymentId.length > 32) {
      throw new NowBuildError({
        code: 'INVALID_DEPLOYMENT_ID',
        message: `The deploymentId "${mergedDeploymentId}" must be 32 characters or less. Please choose a shorter deploymentId in your config.`,
        link: 'https://vercel.com/docs/skew-protection#custom-skew-protection-deployment-id',
      });
    }
    // Validate character set: only base62 (a-z, A-Z, 0-9) plus hyphen and underscore
    if (!VALID_DEPLOYMENT_ID_PATTERN.test(mergedDeploymentId)) {
      throw new NowBuildError({
        code: 'INVALID_DEPLOYMENT_ID',
        message: `The deploymentId "${mergedDeploymentId}" contains invalid characters. Only alphanumeric characters (a-z, A-Z, 0-9), hyphens (-), and underscores (_) are allowed.`,
        link: 'https://vercel.com/docs/skew-protection#custom-skew-protection-deployment-id',
      });
    }
  }

  const mergedOverrides: Record<string, PathOverride> =
    overrides.length > 0 ? Object.assign({}, ...overrides) : undefined;

  const framework = await getFramework(workPath, buildResults);

  // Write out the final `config.json` file based on the
  // user configuration and Builder build results
  const config: BuildOutputConfig = {
    version: 3,
    routes: mergedRoutes,
    images: mergedImages,
    wildcard: mergedWildcard,
    overrides: mergedOverrides,
    framework,
    crons: mergedCrons,
async function mergeDeploymentId(
  existingDeploymentId: string | undefined,
  buildResults: Iterable<BuildResult | BuildOutputConfig>,
  workPath: string
): Promise<string | undefined> {
  // Prefer existing deploymentId from config.json if present
  if (existingDeploymentId) {
    return existingDeploymentId;
  }
  // Otherwise, take the first deploymentId from build results
  for (const result of buildResults) {
    if ('deploymentId' in result && result.deploymentId) {
      return result.deploymentId;
    }
  }
  // For prebuilt Next.js deployments, try reading from routes-manifest.json
  // where Next.js writes the deploymentId during build
  try {
    const routesManifestPath = join(workPath, '.next', 'routes-manifest.json');
    if (await fs.pathExists(routesManifestPath)) {
      const routesManifest = await readJSONFile<{ deploymentId?: string }>(
        routesManifestPath
      );
      if (routesManifest && !(routesManifest instanceof CantParseJSONFile)) {
        if (routesManifest.deploymentId) {
          return routesManifest.deploymentId;
        }
      }
    }
  } catch {
    // Ignore errors reading routes-manifest.json
  }
  return undefined;
}

/**
 * Takes the build output and writes all the flags into the `flags.json`
 * file. It'll skip flags that already exist.
 */
async function writeFlagsJSON(
  buildResults: Iterable<BuildResult | BuildOutputConfig>,
  outputDir: string
): Promise<void> {
  const flagsFilePath = join(outputDir, 'flags.json');

  let hasFlags = true;

  const flags = (await fs.readJSON(flagsFilePath).catch(error => {
    if (error.code === 'ENOENT') {
      hasFlags = false;
      return { definitions: {} };
    }

    throw error;
  })) as { definitions: FlagDefinitions };

  for (const result of buildResults) {
    if (!('flags' in result) || !result.flags || !result.flags.definitions)
      continue;

    for (const [key, definition] of Object.entries(result.flags.definitions)) {
      if (result.flags.definitions[key]) {
        output.warn(
          `The flag "${key}" was found multiple times. Only its first occurrence will be considered.`
        );
        continue;
      }

      hasFlags = true;
      flags.definitions[key] = definition;
    }
  }

  // Only create the file when there are flags to write,
  // or when the file already exists.
  // Checking `definitions` alone won't be enough in case there
  // are other properties set.
  if (hasFlags) {
    await fs.writeJSON(flagsFilePath, flags, { spaces: 2 });
  }
}

async function writeBuildJson(buildsJson: BuildsManifest, outputDir: string) {
  await fs.writeJSON(join(outputDir, 'builds.json'), buildsJson, { spaces: 2 });
}

async function getFrameworkRoutes(
  framework: Framework,
  dirPrefix: string
): Promise<Route[]> {
  let routes: Route[] = [];
  if (typeof framework.defaultRoutes === 'function') {
    routes = await framework.defaultRoutes(dirPrefix);
  } else if (Array.isArray(framework.defaultRoutes)) {
    routes = framework.defaultRoutes;
  }
  return routes;
}
