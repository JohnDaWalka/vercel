# Interface: AwsSigV4Request

[oidc](../modules/oidc.md).AwsSigV4Request

HTTP request to be signed

## Table of contents

### Properties

- [body](oidc.AwsSigV4Request.md#body)
- [headers](oidc.AwsSigV4Request.md#headers)
- [method](oidc.AwsSigV4Request.md#method)
- [url](oidc.AwsSigV4Request.md#url)

## Properties

### body

• `Optional` **body**: `string` \| `Buffer`

Request body (optional)

#### Defined in

[packages/functions/src/oidc/aws-sigv4.ts:48](https://github.com/JohnDaWalka/vercel/blob/main/packages/functions/src/oidc/aws-sigv4.ts#L48)

---

### headers

• `Optional` **headers**: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)<`string`, `string`\>

Request headers

#### Defined in

[packages/functions/src/oidc/aws-sigv4.ts:44](https://github.com/JohnDaWalka/vercel/blob/main/packages/functions/src/oidc/aws-sigv4.ts#L44)

---

### method

• **method**: `string`

HTTP method (e.g., 'GET', 'POST')

#### Defined in

[packages/functions/src/oidc/aws-sigv4.ts:36](https://github.com/JohnDaWalka/vercel/blob/main/packages/functions/src/oidc/aws-sigv4.ts#L36)

---

### url

• **url**: `string`

Request URL

#### Defined in

[packages/functions/src/oidc/aws-sigv4.ts:40](https://github.com/JohnDaWalka/vercel/blob/main/packages/functions/src/oidc/aws-sigv4.ts#L40)
