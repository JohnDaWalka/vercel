import * as path from 'path';
import * as fs from 'fs';
import { VercelOidcTokenError } from './token-error';
import { findRootDir, getUserDataDir } from './token-io';
<<<<<<< HEAD
=======
import {
  readAuthConfig,
  writeAuthConfig,
  isValidAccessToken,
  type AuthConfig,
} from './auth-config';
import { refreshTokenRequest, processTokenResponse } from './oauth';
>>>>>>> upstream/main

export function getVercelDataDir(): string | null {
  const vercelFolder = 'com.vercel.cli';
  const dataDir = getUserDataDir();
  if (!dataDir) {
    return null;
  }
  return path.join(dataDir, vercelFolder);
}

<<<<<<< HEAD
export function getVercelCliToken(): string | null {
  const dataDir = getVercelDataDir();
  if (!dataDir) {
    return null;
  }
  const tokenPath = path.join(dataDir, 'auth.json');
  if (!fs.existsSync(tokenPath)) {
    return null;
  }
  const token = fs.readFileSync(tokenPath, 'utf8');
  if (!token) {
    return null;
  }
  return JSON.parse(token).token;
=======
export async function getVercelCliToken(): Promise<string | null> {
  const authConfig = readAuthConfig();
  if (!authConfig) {
    return null;
  }

  if (isValidAccessToken(authConfig)) {
    return authConfig.token || null;
  }

  if (!authConfig.refreshToken) {
    // No refresh token available, clear auth and return null
    writeAuthConfig({});
    return null;
  }

  try {
    const tokenResponse = await refreshTokenRequest({
      refresh_token: authConfig.refreshToken,
    });

    const [tokensError, tokens] = await processTokenResponse(tokenResponse);

    if (tokensError || !tokens) {
      // Refresh failed - clear auth
      writeAuthConfig({});
      return null;
    }

    // Update auth config with new tokens
    const updatedConfig: AuthConfig = {
      token: tokens.access_token,
      expiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
    };

    if (tokens.refresh_token) {
      updatedConfig.refreshToken = tokens.refresh_token;
    }

    writeAuthConfig(updatedConfig);
    return updatedConfig.token ?? null;
  } catch (error) {
    // Network error or other failure - clear auth
    writeAuthConfig({});
    return null;
  }
>>>>>>> upstream/main
}

interface VercelTokenResponse {
  token: string;
}

export async function getVercelOidcToken(
  authToken: string,
  projectId: string,
  teamId?: string
): Promise<VercelTokenResponse | null> {
<<<<<<< HEAD
  try {
    const url = `https://api.vercel.com/v1/projects/${projectId}/token?source=vercel-oidc-refresh${teamId ? `&teamId=${teamId}` : ''}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    if (!res.ok) {
      throw new VercelOidcTokenError(
        `Failed to refresh OIDC token: ${res.statusText}`
      );
    }
    const tokenRes = await res.json();
    assertVercelOidcTokenResponse(tokenRes);
    return tokenRes;
  } catch (e) {
    throw new VercelOidcTokenError(`Failed to refresh OIDC token`, e);
  }
=======
  const url = `https://api.vercel.com/v1/projects/${projectId}/token?source=vercel-oidc-refresh${teamId ? `&teamId=${teamId}` : ''}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  if (!res.ok) {
    throw new VercelOidcTokenError(
      `Failed to refresh OIDC token: ${res.statusText}`
    );
  }
  const tokenRes = await res.json();
  assertVercelOidcTokenResponse(tokenRes);
  return tokenRes;
>>>>>>> upstream/main
}

export function assertVercelOidcTokenResponse(
  res: unknown
): asserts res is VercelTokenResponse {
  if (!res || typeof res !== 'object') {
<<<<<<< HEAD
    throw new TypeError('Expected an object');
  }
  if (!('token' in res) || typeof res.token !== 'string') {
    throw new TypeError('Expected a string-valued token property');
=======
    throw new TypeError(
      'Vercel OIDC token is malformed. Expected an object. Please run `vc env pull` and try again'
    );
  }
  if (!('token' in res) || typeof res.token !== 'string') {
    throw new TypeError(
      'Vercel OIDC token is malformed. Expected a string-valued token property. Please run `vc env pull` and try again'
    );
>>>>>>> upstream/main
  }
}

export function findProjectInfo(): { projectId: string; teamId: string } {
  const dir = findRootDir();
  if (!dir) {
<<<<<<< HEAD
    throw new VercelOidcTokenError('Unable to find root directory');
  }
  try {
    const prjPath = path.join(dir, '.vercel', 'project.json');
    if (!fs.existsSync(prjPath)) {
      throw new VercelOidcTokenError('project.json not found');
    }
    const prj = JSON.parse(fs.readFileSync(prjPath, 'utf8'));
    if (typeof prj.projectId !== 'string' && typeof prj.orgId !== 'string') {
      throw new TypeError('Expected a string-valued projectId property');
    }
    return { projectId: prj.projectId, teamId: prj.orgId };
  } catch (e) {
    throw new VercelOidcTokenError(`Unable to find project ID`, e);
  }
}

export function saveToken(token: VercelTokenResponse, projectId: string): void {
  try {
    const dir = getUserDataDir();
    if (!dir) {
      throw new VercelOidcTokenError('Unable to find user data directory');
    }
    const tokenPath = path.join(dir, 'com.vercel.token', `${projectId}.json`);
    const tokenJson = JSON.stringify(token);
    fs.mkdirSync(path.dirname(tokenPath), { mode: 0o770, recursive: true }); // read/write/exec perms for owner/group only, x required for dir ops
    fs.writeFileSync(tokenPath, tokenJson);
    fs.chmodSync(tokenPath, 0o660); // read/write perms for owner only
    return;
  } catch (e) {
    throw new VercelOidcTokenError(`Failed to save token`, e);
  }
}

export function loadToken(projectId: string): VercelTokenResponse | null {
  try {
    const dir = getUserDataDir();
    if (!dir) {
      return null;
    }
    const tokenPath = path.join(dir, 'com.vercel.token', `${projectId}.json`);
    if (!fs.existsSync(tokenPath)) {
      return null;
    }
    const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
    assertVercelOidcTokenResponse(token);
    return token;
  } catch (e) {
    throw new VercelOidcTokenError(`Failed to load token`, e);
  }
=======
    throw new VercelOidcTokenError(
      'Unable to find project root directory. Have you linked your project with `vc link?`'
    );
  }
  const prjPath = path.join(dir, '.vercel', 'project.json');
  if (!fs.existsSync(prjPath)) {
    throw new VercelOidcTokenError(
      'project.json not found, have you linked your project with `vc link?`'
    );
  }
  const prj = JSON.parse(fs.readFileSync(prjPath, 'utf8'));
  if (typeof prj.projectId !== 'string' && typeof prj.orgId !== 'string') {
    throw new TypeError(
      'Expected a string-valued projectId property. Try running `vc link` to re-link your project.'
    );
  }
  return { projectId: prj.projectId, teamId: prj.orgId };
}

export function saveToken(token: VercelTokenResponse, projectId: string): void {
  const dir = getUserDataDir();
  if (!dir) {
    throw new VercelOidcTokenError(
      'Unable to find user data directory. Please reach out to Vercel support.'
    );
  }
  const tokenPath = path.join(dir, 'com.vercel.token', `${projectId}.json`);
  const tokenJson = JSON.stringify(token);
  fs.mkdirSync(path.dirname(tokenPath), { mode: 0o770, recursive: true }); // read/write/exec perms for owner/group only, x required for dir ops
  fs.writeFileSync(tokenPath, tokenJson);
  fs.chmodSync(tokenPath, 0o660); // read/write perms for owner only
  return;
}

export function loadToken(projectId: string): VercelTokenResponse | null {
  const dir = getUserDataDir();
  if (!dir) {
    throw new VercelOidcTokenError(
      'Unable to find user data directory. Please reach out to Vercel support.'
    );
  }
  const tokenPath = path.join(dir, 'com.vercel.token', `${projectId}.json`);
  if (!fs.existsSync(tokenPath)) {
    return null;
  }
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  assertVercelOidcTokenResponse(token);
  return token;
>>>>>>> upstream/main
}

interface TokenPayload {
  sub: string;
  name: string;
  exp: number;
}

export function getTokenPayload(token: string): TokenPayload {
  const tokenParts = token.split('.');
  if (tokenParts.length !== 3) {
<<<<<<< HEAD
    throw new VercelOidcTokenError('Invalid token');
=======
    throw new VercelOidcTokenError(
      'Invalid token. Please run `vc env pull` and try again'
    );
>>>>>>> upstream/main
  }

  const base64 = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    '='
  );
  return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
}

export function isExpired(token: TokenPayload): boolean {
  return token.exp * 1000 < Date.now();
}
