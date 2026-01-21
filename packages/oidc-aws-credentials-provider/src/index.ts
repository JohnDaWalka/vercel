export type { AwsCredentialsProviderInit } from './aws-credentials-provider';
export { awsCredentialsProvider } from './aws-credentials-provider';

export type {
  AwsSigV4Config,
  AwsSigV4Request,
  AwsSigV4SignedRequest,
} from './aws-sigv4';
export { signAwsRequest, signAwsRequestWithProvider } from './aws-sigv4';
