# Interface: AwsSigV4SignedRequest

Signed HTTP request

## Table of contents

### Properties

- [body](AwsSigV4SignedRequest.md#body)
- [headers](AwsSigV4SignedRequest.md#headers)
- [method](AwsSigV4SignedRequest.md#method)
- [url](AwsSigV4SignedRequest.md#url)

## Properties

### body

• `Optional` **body**: `string` \| `Buffer`

Request body

#### Defined in

[packages/oidc-aws-credentials-provider/src/aws-sigv4.ts:70](https://github.com/JohnDaWalka/vercel/blob/main/packages/oidc-aws-credentials-provider/src/aws-sigv4.ts#L70)

---

### headers

• **headers**: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)<`string`, `string`\>

Signed headers including Authorization header

#### Defined in

[packages/oidc-aws-credentials-provider/src/aws-sigv4.ts:66](https://github.com/JohnDaWalka/vercel/blob/main/packages/oidc-aws-credentials-provider/src/aws-sigv4.ts#L66)

---

### method

• **method**: `string`

HTTP method

#### Defined in

[packages/oidc-aws-credentials-provider/src/aws-sigv4.ts:58](https://github.com/JohnDaWalka/vercel/blob/main/packages/oidc-aws-credentials-provider/src/aws-sigv4.ts#L58)

---

### url

• **url**: `string`

Request URL

#### Defined in

[packages/oidc-aws-credentials-provider/src/aws-sigv4.ts:62](https://github.com/JohnDaWalka/vercel/blob/main/packages/oidc-aws-credentials-provider/src/aws-sigv4.ts#L62)
