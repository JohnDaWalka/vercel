# @vercel/oidc-aws-credentials-provider

## Table of contents

### Interfaces

- [AwsCredentialsProviderInit](interfaces/AwsCredentialsProviderInit.md)
- [AwsSigV4Config](interfaces/AwsSigV4Config.md)
- [AwsSigV4Request](interfaces/AwsSigV4Request.md)
- [AwsSigV4SignedRequest](interfaces/AwsSigV4SignedRequest.md)

### Functions

- [awsCredentialsProvider](README.md#awscredentialsprovider)
- [signAwsRequest](README.md#signawsrequest)
- [signAwsRequestWithProvider](README.md#signawsrequestwithprovider)

## Functions

### awsCredentialsProvider

▸ **awsCredentialsProvider**(`init`): `AwsCredentialIdentityProvider`

Obtains the Vercel OIDC token and creates an AWS credential provider function
that gets AWS credentials by calling STS AssumeRoleWithWebIdentity API.

**`Example`**

```js
import * as s3 from '@aws-sdk/client-s3';
import { awsCredentialsProvider } from '@vercel/functions/oidc';

const s3Client = new s3.S3Client({
  credentials: awsCredentialsProvider({
    roleArn: 'arn:aws:iam::1234567890:role/RoleA',
    clientConfig: { region: 'us-west-2' },
    clientPlugins: [addFooHeadersPlugin],
    roleAssumerWithWebIdentity: customRoleAssumer,
    roleSessionName: 'session_123',
    providerId: 'graph.facebook.com',
    policyArns: [{ arn: 'arn:aws:iam::1234567890:policy/SomePolicy' }],
    policy:
      '{"Statement": [{"Effect": "Allow", "Action": "s3:ListBucket", "Resource": "*"}]}',
    durationSeconds: 7200,
  }),
});
```

#### Parameters

| Name   | Type                                                                     | Description                |
| :----- | :----------------------------------------------------------------------- | :------------------------- |
| `init` | [`AwsCredentialsProviderInit`](interfaces/AwsCredentialsProviderInit.md) | The initialization object. |

#### Returns

`AwsCredentialIdentityProvider`

A function that provides AWS credentials.

#### Defined in

[packages/oidc-aws-credentials-provider/src/aws-credentials-provider.ts:61](https://github.com/JohnDaWalka/vercel/blob/main/packages/oidc-aws-credentials-provider/src/aws-credentials-provider.ts#L61)

---

### signAwsRequest

▸ **signAwsRequest**(`config`, `request`): [`AwsSigV4SignedRequest`](interfaces/AwsSigV4SignedRequest.md)

Signs an HTTP request using AWS Signature Version 4

**`Example`**

```js
import { signAwsRequest } from '@vercel/functions/oidc';

const signedRequest = signAwsRequest(
  {
    accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
    secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    region: 'us-east-1',
    service: 's3',
  },
  {
    method: 'GET',
    url: 'https://mybucket.s3.amazonaws.com/myobject',
  }
);

// Use signedRequest to make HTTP call
const response = await fetch(signedRequest.url, {
  method: signedRequest.method,
  headers: signedRequest.headers,
});
```

#### Parameters

| Name      | Type                                               | Description                                        |
| :-------- | :------------------------------------------------- | :------------------------------------------------- |
| `config`  | [`AwsSigV4Config`](interfaces/AwsSigV4Config.md)   | AWS configuration including credentials and region |
| `request` | [`AwsSigV4Request`](interfaces/AwsSigV4Request.md) | HTTP request to sign                               |

#### Returns

[`AwsSigV4SignedRequest`](interfaces/AwsSigV4SignedRequest.md)

Signed request with Authorization header

#### Defined in

[packages/oidc-aws-credentials-provider/src/aws-sigv4.ts:193](https://github.com/JohnDaWalka/vercel/blob/main/packages/oidc-aws-credentials-provider/src/aws-sigv4.ts#L193)

---

### signAwsRequestWithProvider

▸ **signAwsRequestWithProvider**(`credentialsProvider`, `region`, `service`, `request`): [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[`AwsSigV4SignedRequest`](interfaces/AwsSigV4SignedRequest.md)\>

Signs an HTTP request using AWS Signature Version 4 with credentials from awsCredentialsProvider

**`Example`**

```js
import {
  signAwsRequestWithProvider,
  awsCredentialsProvider,
} from '@vercel/functions/oidc';

const credentialsProvider = awsCredentialsProvider({
  roleArn: 'arn:aws:iam::123456789012:role/MyRole',
});

const signedRequest = await signAwsRequestWithProvider(
  credentialsProvider,
  'us-east-1',
  's3',
  {
    method: 'GET',
    url: 'https://mybucket.s3.amazonaws.com/myobject',
  }
);
```

#### Parameters

| Name                  | Type                                                                                                                                                                                                | Description                                          |
| :-------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------- |
| `credentialsProvider` | () => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<{ `accessKeyId`: `string` ; `secretAccessKey`: `string` ; `sessionToken?`: `string` }\> | AWS credentials provider from awsCredentialsProvider |
| `region`              | `string`                                                                                                                                                                                            | AWS region                                           |
| `service`             | `string`                                                                                                                                                                                            | AWS service name                                     |
| `request`             | [`AwsSigV4Request`](interfaces/AwsSigV4Request.md)                                                                                                                                                  | HTTP request to sign                                 |

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[`AwsSigV4SignedRequest`](interfaces/AwsSigV4SignedRequest.md)\>

Signed request with Authorization header

#### Defined in

[packages/oidc-aws-credentials-provider/src/aws-sigv4.ts:299](https://github.com/JohnDaWalka/vercel/blob/main/packages/oidc-aws-credentials-provider/src/aws-sigv4.ts#L299)
