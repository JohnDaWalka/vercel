import { describe, expect, it } from 'vitest';
import {
  signAwsRequest,
  signAwsRequestWithProvider,
  type AwsSigV4Config,
  type AwsSigV4Request,
} from '../../../src/oidc/aws-sigv4';

describe('AWS SigV4 Signing', () => {
  const testConfig: AwsSigV4Config = {
    accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
    secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    region: 'us-east-1',
    service: 's3',
  };

  describe('signAwsRequest', () => {
    it('should sign a basic GET request', () => {
      const request: AwsSigV4Request = {
        method: 'GET',
        url: 'https://s3.amazonaws.com/mybucket/myobject',
      };

      const signedRequest = signAwsRequest(testConfig, request);

      expect(signedRequest.method).toBe('GET');
      expect(signedRequest.url).toBe(
        'https://s3.amazonaws.com/mybucket/myobject'
      );
      expect(signedRequest.headers).toHaveProperty('Authorization');
      expect(signedRequest.headers.Authorization).toContain('AWS4-HMAC-SHA256');
      expect(signedRequest.headers.Authorization).toContain('Credential=');
      expect(signedRequest.headers.Authorization).toContain('SignedHeaders=');
      expect(signedRequest.headers.Authorization).toContain('Signature=');
    });

    it('should include host and x-amz-date headers', () => {
      const request: AwsSigV4Request = {
        method: 'GET',
        url: 'https://s3.amazonaws.com/mybucket/myobject',
      };

      const signedRequest = signAwsRequest(testConfig, request);

      expect(signedRequest.headers).toHaveProperty('host');
      expect(signedRequest.headers.host).toBe('s3.amazonaws.com');
      expect(signedRequest.headers).toHaveProperty('x-amz-date');
      expect(signedRequest.headers['x-amz-date']).toMatch(/^\d{8}T\d{6}Z$/);
    });

    it('should include session token when provided', () => {
      const configWithToken: AwsSigV4Config = {
        ...testConfig,
        sessionToken: 'test-session-token',
      };

      const request: AwsSigV4Request = {
        method: 'GET',
        url: 'https://s3.amazonaws.com/mybucket/myobject',
      };

      const signedRequest = signAwsRequest(configWithToken, request);

      expect(signedRequest.headers).toHaveProperty('x-amz-security-token');
      expect(signedRequest.headers['x-amz-security-token']).toBe(
        'test-session-token'
      );
    });

    it('should sign a POST request with body', () => {
      const request: AwsSigV4Request = {
        method: 'POST',
        url: 'https://s3.amazonaws.com/mybucket/myobject',
        body: JSON.stringify({ key: 'value' }),
      };

      const signedRequest = signAwsRequest(testConfig, request);

      expect(signedRequest.method).toBe('POST');
      expect(signedRequest.body).toBe(JSON.stringify({ key: 'value' }));
      expect(signedRequest.headers).toHaveProperty('x-amz-content-sha256');
      expect(signedRequest.headers['x-amz-content-sha256']).toMatch(
        /^[a-f0-9]{64}$/
      );
    });

    it('should handle query parameters correctly', () => {
      const request: AwsSigV4Request = {
        method: 'GET',
        url: 'https://s3.amazonaws.com/mybucket/myobject?prefix=test&max-keys=10',
      };

      const signedRequest = signAwsRequest(testConfig, request);

      expect(signedRequest.headers).toHaveProperty('Authorization');
      expect(signedRequest.headers.Authorization).toContain('Signature=');
    });

    it('should preserve custom headers', () => {
      const request: AwsSigV4Request = {
        method: 'GET',
        url: 'https://s3.amazonaws.com/mybucket/myobject',
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Header': 'custom-value',
        },
      };

      const signedRequest = signAwsRequest(testConfig, request);

      expect(signedRequest.headers).toHaveProperty('Content-Type');
      expect(signedRequest.headers['Content-Type']).toBe('application/json');
      expect(signedRequest.headers).toHaveProperty('X-Custom-Header');
      expect(signedRequest.headers['X-Custom-Header']).toBe('custom-value');
    });

    it('should handle different services', () => {
      const stsConfig: AwsSigV4Config = {
        ...testConfig,
        service: 'sts',
      };

      const request: AwsSigV4Request = {
        method: 'POST',
        url: 'https://sts.amazonaws.com/',
        body: 'Action=GetCallerIdentity&Version=2011-06-15',
      };

      const signedRequest = signAwsRequest(stsConfig, request);

      expect(signedRequest.headers.Authorization).toContain(
        '/sts/aws4_request'
      );
    });

    it('should handle different regions', () => {
      const euConfig: AwsSigV4Config = {
        ...testConfig,
        region: 'eu-west-1',
      };

      const request: AwsSigV4Request = {
        method: 'GET',
        url: 'https://s3-eu-west-1.amazonaws.com/mybucket/myobject',
      };

      const signedRequest = signAwsRequest(euConfig, request);

      expect(signedRequest.headers.Authorization).toContain('/eu-west-1/');
    });

    it('should handle empty body', () => {
      const request: AwsSigV4Request = {
        method: 'GET',
        url: 'https://s3.amazonaws.com/mybucket/myobject',
      };

      const signedRequest = signAwsRequest(testConfig, request);

      expect(signedRequest.headers['x-amz-content-sha256']).toBe(
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      ); // SHA256 of empty string
    });

    it('should handle Buffer body', () => {
      const request: AwsSigV4Request = {
        method: 'PUT',
        url: 'https://s3.amazonaws.com/mybucket/myobject',
        body: Buffer.from('test data'),
      };

      const signedRequest = signAwsRequest(testConfig, request);

      expect(signedRequest.body).toBeInstanceOf(Buffer);
      expect(signedRequest.headers).toHaveProperty('x-amz-content-sha256');
      expect(signedRequest.headers['x-amz-content-sha256']).toMatch(
        /^[a-f0-9]{64}$/
      );
    });

    it('should handle paths with special characters', () => {
      const request: AwsSigV4Request = {
        method: 'GET',
        url: 'https://s3.amazonaws.com/mybucket/my%20object%20%28test%29.txt',
      };

      const signedRequest = signAwsRequest(testConfig, request);

      expect(signedRequest.headers).toHaveProperty('Authorization');
    });

    it('should create correct credential scope', () => {
      const request: AwsSigV4Request = {
        method: 'GET',
        url: 'https://s3.amazonaws.com/mybucket/myobject',
      };

      const signedRequest = signAwsRequest(testConfig, request);

      // Credential scope format: YYYYMMDD/region/service/aws4_request
      expect(signedRequest.headers.Authorization).toMatch(
        /Credential=AKIAIOSFODNN7EXAMPLE\/\d{8}\/us-east-1\/s3\/aws4_request/
      );
    });

    it('should include signed headers in correct order', () => {
      const request: AwsSigV4Request = {
        method: 'GET',
        url: 'https://s3.amazonaws.com/mybucket/myobject',
        headers: {
          'z-header': 'last',
          'a-header': 'first',
          'm-header': 'middle',
        },
      };

      const signedRequest = signAwsRequest(testConfig, request);

      // SignedHeaders should be alphabetically sorted
      expect(signedRequest.headers.Authorization).toMatch(
        /SignedHeaders=a-header;host;m-header;x-amz-content-sha256;x-amz-date;z-header/
      );
    });
  });

  describe('signAwsRequestWithProvider', () => {
    it('should sign request with credentials from provider', async () => {
      const credentialsProvider = async () => ({
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      });

      const request: AwsSigV4Request = {
        method: 'GET',
        url: 'https://s3.amazonaws.com/mybucket/myobject',
      };

      const signedRequest = await signAwsRequestWithProvider(
        credentialsProvider,
        'us-east-1',
        's3',
        request
      );

      expect(signedRequest.headers).toHaveProperty('Authorization');
      expect(signedRequest.headers.Authorization).toContain('AWS4-HMAC-SHA256');
    });

    it('should include session token from provider', async () => {
      const credentialsProvider = async () => ({
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        sessionToken: 'provider-session-token',
      });

      const request: AwsSigV4Request = {
        method: 'GET',
        url: 'https://s3.amazonaws.com/mybucket/myobject',
      };

      const signedRequest = await signAwsRequestWithProvider(
        credentialsProvider,
        'us-east-1',
        's3',
        request
      );

      expect(signedRequest.headers).toHaveProperty('x-amz-security-token');
      expect(signedRequest.headers['x-amz-security-token']).toBe(
        'provider-session-token'
      );
    });

    it('should work with different regions and services', async () => {
      const credentialsProvider = async () => ({
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      });

      const request: AwsSigV4Request = {
        method: 'POST',
        url: 'https://dynamodb.eu-west-1.amazonaws.com/',
        body: JSON.stringify({ TableName: 'MyTable' }),
      };

      const signedRequest = await signAwsRequestWithProvider(
        credentialsProvider,
        'eu-west-1',
        'dynamodb',
        request
      );

      expect(signedRequest.headers.Authorization).toContain('/eu-west-1/');
      expect(signedRequest.headers.Authorization).toContain('/dynamodb/');
    });
  });
});
