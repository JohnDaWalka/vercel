---
'@vercel/functions': minor
'@vercel/oidc-aws-credentials-provider': minor
---

Implement AWS Signature Version 4 (SigV4) authentication protocol

This change adds low-level AWS SigV4 request signing capabilities to enable direct AWS API calls without requiring the full AWS SDK. The implementation includes:

- `signAwsRequest()` - Sign HTTP requests using AWS SigV4 with explicit credentials
- `signAwsRequestWithProvider()` - Sign requests using credentials from a provider
- Full support for query parameters, custom headers, and request bodies
- Session token support for temporary credentials
- Comprehensive test coverage

These new functions allow users to manually sign AWS API requests for maximum flexibility and control over authentication.
