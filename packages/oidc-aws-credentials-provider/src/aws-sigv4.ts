import { createHash, createHmac } from 'crypto';

/**
 * AWS Signature Version 4 signing configuration
 */
export interface AwsSigV4Config {
  /**
   * AWS access key ID
   */
  accessKeyId: string;
  /**
   * AWS secret access key
   */
  secretAccessKey: string;
  /**
   * AWS session token (optional, for temporary credentials)
   */
  sessionToken?: string;
  /**
   * AWS region (e.g., 'us-east-1')
   */
  region: string;
  /**
   * AWS service name (e.g., 's3', 'sts', 'dynamodb')
   */
  service: string;
}

/**
 * HTTP request to be signed
 */
export interface AwsSigV4Request {
  /**
   * HTTP method (e.g., 'GET', 'POST')
   */
  method: string;
  /**
   * Request URL
   */
  url: string;
  /**
   * Request headers
   */
  headers?: Record<string, string>;
  /**
   * Request body (optional)
   */
  body?: string | Buffer;
}

/**
 * Signed HTTP request
 */
export interface AwsSigV4SignedRequest {
  /**
   * HTTP method
   */
  method: string;
  /**
   * Request URL
   */
  url: string;
  /**
   * Signed headers including Authorization header
   */
  headers: Record<string, string>;
  /**
   * Request body
   */
  body?: string | Buffer;
}

/**
 * Creates a SHA256 hash of the given data
 */
function sha256(data: string | Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Creates an HMAC-SHA256 signature
 */
function hmacSha256(key: Buffer | string, data: string): Buffer {
  return createHmac('sha256', key).update(data).digest();
}

/**
 * URI encodes a string according to AWS requirements
 */
function uriEncode(str: string, encodeSlash = true): string {
  const encoded = encodeURIComponent(str);
  if (!encodeSlash) {
    return encoded.replace(/%2F/g, '/');
  }
  return encoded
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}

/**
 * Builds a canonical request string
 */
function buildCanonicalRequest(
  method: string,
  pathname: string,
  query: string,
  headers: Record<string, string>,
  signedHeaders: string,
  payloadHash: string
): string {
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map(key => `${key.toLowerCase()}:${headers[key].trim()}\n`)
    .join('');

  return [
    method,
    pathname,
    query,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');
}

/**
 * Builds the string to sign
 */
function buildStringToSign(
  algorithm: string,
  requestDateTime: string,
  credentialScope: string,
  hashedCanonicalRequest: string
): string {
  return [
    algorithm,
    requestDateTime,
    credentialScope,
    hashedCanonicalRequest,
  ].join('\n');
}

/**
 * Derives the signing key
 */
function getSigningKey(
  secretAccessKey: string,
  dateStamp: string,
  region: string,
  service: string
): Buffer {
  const kDate = hmacSha256('AWS4' + secretAccessKey, dateStamp);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  const kSigning = hmacSha256(kService, 'aws4_request');
  return kSigning;
}

/**
 * Signs an HTTP request using AWS Signature Version 4
 *
 * @param config - AWS configuration including credentials and region
 * @param request - HTTP request to sign
 * @returns Signed request with Authorization header
 *
 * @example
 * ```js
 * import { signAwsRequest } from '@vercel/functions/oidc';
 *
 * const signedRequest = signAwsRequest(
 *   {
 *     accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
 *     secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
 *     region: 'us-east-1',
 *     service: 's3',
 *   },
 *   {
 *     method: 'GET',
 *     url: 'https://mybucket.s3.amazonaws.com/myobject',
 *   }
 * );
 *
 * // Use signedRequest to make HTTP call
 * const response = await fetch(signedRequest.url, {
 *   method: signedRequest.method,
 *   headers: signedRequest.headers,
 * });
 * ```
 */
export function signAwsRequest(
  config: AwsSigV4Config,
  request: AwsSigV4Request
): AwsSigV4SignedRequest {
  const { accessKeyId, secretAccessKey, sessionToken, region, service } =
    config;
  const { method, url, headers = {}, body } = request;

  // Parse URL
  const urlObj = new URL(url);
  const host = urlObj.hostname;
  const pathname = urlObj.pathname || '/';
  const query = Array.from(urlObj.searchParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${uriEncode(key)}=${uriEncode(value)}`)
    .join('&');

  // Generate timestamp
  const now = new Date();
  const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '');
  const requestDateTime = now.toISOString().replace(/[:-]|\.\d{3}/g, '');

  // Prepare headers
  const requestHeaders: Record<string, string> = {
    host,
    'x-amz-date': requestDateTime,
    ...headers,
  };

  if (sessionToken) {
    requestHeaders['x-amz-security-token'] = sessionToken;
  }

  // Hash payload
  const payloadHash = body ? sha256(body) : sha256('');
  requestHeaders['x-amz-content-sha256'] = payloadHash;

  // Build canonical request
  const signedHeaders = Object.keys(requestHeaders)
    .map(key => key.toLowerCase())
    .sort()
    .join(';');

  const canonicalRequest = buildCanonicalRequest(
    method,
    pathname,
    query,
    requestHeaders,
    signedHeaders,
    payloadHash
  );

  // Build string to sign
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = buildStringToSign(
    algorithm,
    requestDateTime,
    credentialScope,
    sha256(canonicalRequest)
  );

  // Calculate signature
  const signingKey = getSigningKey(secretAccessKey, dateStamp, region, service);
  const signature = hmacSha256(signingKey, stringToSign).toString('hex');

  // Build authorization header
  requestHeaders['Authorization'] =
    `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    method,
    url,
    headers: requestHeaders,
    body,
  };
}

/**
 * Signs an HTTP request using AWS Signature Version 4 with credentials from awsCredentialsProvider
 *
 * @param credentialsProvider - AWS credentials provider from awsCredentialsProvider
 * @param region - AWS region
 * @param service - AWS service name
 * @param request - HTTP request to sign
 * @returns Signed request with Authorization header
 *
 * @example
 * ```js
 * import { signAwsRequestWithProvider, awsCredentialsProvider } from '@vercel/functions/oidc';
 *
 * const credentialsProvider = awsCredentialsProvider({
 *   roleArn: 'arn:aws:iam::123456789012:role/MyRole',
 * });
 *
 * const signedRequest = await signAwsRequestWithProvider(
 *   credentialsProvider,
 *   'us-east-1',
 *   's3',
 *   {
 *     method: 'GET',
 *     url: 'https://mybucket.s3.amazonaws.com/myobject',
 *   }
 * );
 * ```
 */
export async function signAwsRequestWithProvider(
  credentialsProvider: () => Promise<{
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
  }>,
  region: string,
  service: string,
  request: AwsSigV4Request
): Promise<AwsSigV4SignedRequest> {
  const credentials = await credentialsProvider();

  return signAwsRequest(
    {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
      region,
      service,
    },
    request
  );
}
