# Interface: AwsSigV4Config

[oidc](../modules/oidc.md).AwsSigV4Config

AWS Signature Version 4 signing configuration

## Table of contents

### Properties

- [accessKeyId](oidc.AwsSigV4Config.md#accesskeyid)
- [region](oidc.AwsSigV4Config.md#region)
- [secretAccessKey](oidc.AwsSigV4Config.md#secretaccesskey)
- [service](oidc.AwsSigV4Config.md#service)
- [sessionToken](oidc.AwsSigV4Config.md#sessiontoken)

## Properties

### accessKeyId

• **accessKeyId**: `string`

AWS access key ID

#### Defined in

[packages/functions/src/oidc/aws-sigv4.ts:10](https://github.com/JohnDaWalka/vercel/blob/main/packages/functions/src/oidc/aws-sigv4.ts#L10)

---

### region

• **region**: `string`

AWS region (e.g., 'us-east-1')

#### Defined in

[packages/functions/src/oidc/aws-sigv4.ts:22](https://github.com/JohnDaWalka/vercel/blob/main/packages/functions/src/oidc/aws-sigv4.ts#L22)

---

### secretAccessKey

• **secretAccessKey**: `string`

AWS secret access key

#### Defined in

[packages/functions/src/oidc/aws-sigv4.ts:14](https://github.com/JohnDaWalka/vercel/blob/main/packages/functions/src/oidc/aws-sigv4.ts#L14)

---

### service

• **service**: `string`

AWS service name (e.g., 's3', 'sts', 'dynamodb')

#### Defined in

[packages/functions/src/oidc/aws-sigv4.ts:26](https://github.com/JohnDaWalka/vercel/blob/main/packages/functions/src/oidc/aws-sigv4.ts#L26)

---

### sessionToken

• `Optional` **sessionToken**: `string`

AWS session token (optional, for temporary credentials)

#### Defined in

[packages/functions/src/oidc/aws-sigv4.ts:18](https://github.com/JohnDaWalka/vercel/blob/main/packages/functions/src/oidc/aws-sigv4.ts#L18)
