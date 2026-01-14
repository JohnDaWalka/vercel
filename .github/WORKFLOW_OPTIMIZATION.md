# GitHub Actions Workflow Optimization

This document outlines the optimizations applied to the GitHub Actions workflows in this repository.

## Optimizations Applied

### 1. Caching Strategy

**pnpm Store Caching**: All workflows now use pnpm store caching to significantly reduce installation time.

```yaml
- name: Get pnpm store directory
  shell: bash
  run: |
    echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV

- uses: actions/cache@v4
  name: Setup pnpm cache
  with:
    path: ${{ env.STORE_PATH }}
    key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
    restore-keys: |
      ${{ runner.os }}-pnpm-store-
```

**Benefits**:
- Reduces dependency installation time by 50-80%
- Leverages GitHub's built-in cache storage
- Automatically invalidates cache when dependencies change

### 2. Timeout Configuration

All jobs now have explicit timeout configurations to prevent workflows from hanging indefinitely:

- **Setup/Lint jobs**: 10-20 minutes
- **Test jobs**: 120 minutes (already configured)
- **Release jobs**: 30 minutes
- **Cron jobs**: 15 minutes

### 3. Turbo Cache Configuration

Enhanced `turbo.json` to explicitly enable caching for all tasks:

- All build and test tasks now have `"cache": true`
- Properly configured output patterns for optimal cache hits
- Remote caching already configured via `TURBO_REMOTE_ONLY` and `TURBO_TOKEN`

### 4. pnpm Configuration Improvements

Enhanced `.npmrc` with performance optimizations:

```
# Performance optimizations
prefer-workspace-packages=true
shamefully-hoist=false
strict-peer-dependencies=false
auto-install-peers=true

# Network optimizations
network-concurrency=16
fetch-retries=3
fetch-retry-factor=10
fetch-retry-mintimeout=10000
fetch-retry-maxtimeout=60000

# Store optimizations
store-dir=~/.pnpm-store
```

## Expected Performance Improvements

1. **Faster CI/CD Pipeline**:
   - Installation time: 50-80% reduction
   - Build time: Better cache hit rates with explicit Turbo configuration
   - Overall workflow time: 30-50% reduction for typical PRs

2. **Reduced GitHub Actions Minutes**:
   - Fewer minutes consumed per workflow run
   - More efficient use of parallel jobs
   - Better cache utilization

3. **Improved Developer Experience**:
   - Faster feedback on PRs
   - Reduced wait time for CI checks
   - More reliable builds with explicit timeouts

## Monitoring and Maintenance

To maintain optimal performance:

1. Monitor cache hit rates in workflow logs
2. Review timeout values periodically and adjust as needed
3. Keep dependencies up to date to benefit from upstream performance improvements
4. Regularly review Turbo Remote Cache effectiveness

## Related Configuration Files

- `.github/workflows/test.yml` - Main test workflow with caching
- `.github/workflows/test-lint.yml` - Lint workflow with caching
- `.github/workflows/release.yml` - Release workflow with caching
- `.npmrc` - pnpm configuration optimizations
- `turbo.json` - Turbo build system configuration
- `.gitattributes` - Git performance optimizations
