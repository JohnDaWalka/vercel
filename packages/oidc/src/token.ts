import { VercelOidcTokenError } from './token-error';
import {
  findProjectInfo,
  getTokenPayload,
  getVercelCliToken,
  getVercelOidcToken,
  isExpired,
  loadToken,
  saveToken,
} from './token-util';

export async function refreshToken(): Promise<void> {
  const { projectId, teamId } = findProjectInfo();
  let maybeToken = loadToken(projectId);

  if (!maybeToken || isExpired(getTokenPayload(maybeToken.token))) {
<<<<<<< HEAD
    const authToken = getVercelCliToken();
    if (!authToken) {
      throw new VercelOidcTokenError(
        'Failed to refresh OIDC token: login to vercel cli'
=======
    const authToken = await getVercelCliToken();
    if (!authToken) {
      throw new VercelOidcTokenError(
        'Failed to refresh OIDC token: Log in to Vercel CLI and link your project with `vc link`'
>>>>>>> upstream/main
      );
    }
    if (!projectId) {
      throw new VercelOidcTokenError(
<<<<<<< HEAD
        'Failed to refresh OIDC token: project id not found'
=======
        'Failed to refresh OIDC token: Try re-linking your project with `vc link`'
>>>>>>> upstream/main
      );
    }
    maybeToken = await getVercelOidcToken(authToken, projectId, teamId);
    if (!maybeToken) {
      throw new VercelOidcTokenError('Failed to refresh OIDC token');
    }
    saveToken(maybeToken, projectId);
  }
  process.env.VERCEL_OIDC_TOKEN = maybeToken.token;
  return;
}
