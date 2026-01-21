/**
 * @deprecated Use @vercel/oidc-aws-credentials-provider instead
 * AWS authentication for Vercel Functions
 */
export type { AwsCredentialsProviderInit } from './aws-credentials-provider';

/**
 * @deprecated Use @vercel/oidc-aws-credentials-provider instead
 * AWS authentication for Vercel Functions
 */
export { awsCredentialsProvider } from './aws-credentials-provider';

/**
 * AWS Signature Version 4 signing for Vercel Functions
 */
export type {
  AwsSigV4Config,
  AwsSigV4Request,
  AwsSigV4SignedRequest,
} from './aws-sigv4';

/**
 * AWS Signature Version 4 signing for Vercel Functions
 */
export { signAwsRequest, signAwsRequestWithProvider } from './aws-sigv4';

/**
 * @deprecated Use @vercel/oidc instead
 * OIDC authentication for Vercel Functions
 */
export { getVercelOidcToken, getVercelOidcTokenSync } from '@vercel/oidc';
