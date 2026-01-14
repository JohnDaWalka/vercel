# CI/CD Optimization Guide

This guide provides best practices and recommendations for maintaining optimal CI/CD performance in the Vercel repository.

## Table of Contents

1. [Performance Monitoring](#performance-monitoring)
2. [Cache Management](#cache-management)
3. [Workflow Optimization](#workflow-optimization)
4. [Dependency Management](#dependency-management)
5. [Troubleshooting](#troubleshooting)

## Performance Monitoring

### Key Metrics to Track

1. **Workflow Execution Time**
   - Monitor average run time for test and lint workflows
   - Track trends over time
   - Target: <30 minutes for most PRs with affected testing

2. **Cache Hit Rates**
   - Check pnpm store cache hit rates in workflow logs
   - Look for "Cache restored successfully" messages
   - Target: >80% cache hit rate

3. **GitHub Actions Minutes**
   - Monitor monthly Actions minutes consumption
   - Track by workflow type
   - Optimize high-consumption workflows first

### Monitoring Commands

```bash
# Analyze performance locally
node scripts/analyze-performance.js

# Check for duplicate dependencies
pnpm list --depth=0

# View Turbo cache status
pnpm turbo run build --dry-run --summarize
```

## Cache Management

### GitHub Actions Caching

**pnpm Store Cache:**
- Cache key: `${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}`
- Automatically invalidates when dependencies change
- Located at: `~/.pnpm-store`

**Turbo Remote Cache:**
- Configured via `TURBO_TOKEN` and `TURBO_TEAM`
- Provides cross-machine caching
- Check hit rates in workflow logs

### Cache Cleanup

A weekly cleanup workflow runs to delete:
- Caches older than 7 days
- Caches from closed PRs
- Caches from deleted branches

Manual cleanup:
```bash
# Via GitHub CLI
gh workflow run cleanup-caches.yml
```

### Best Practices

1. **Don't Cache Generated Files:**
   - `dist/` directories are rebuilt on each run
   - `node_modules/` should not be cached (use pnpm store instead)
   - `.turbo/` local cache should not be cached

2. **Cache Invalidation:**
   - Cache keys automatically update when `pnpm-lock.yaml` changes
   - Use restore-keys for partial cache hits

3. **Cache Size:**
   - GitHub Actions cache limit: 10GB per repository
   - Monitor cache usage in repository settings
   - Old caches are automatically evicted

## Workflow Optimization

### Affected Testing Strategy

The repository uses an intelligent affected testing strategy:

1. **No Changes:** Skip tests entirely
2. **Affected Only:** Run tests only for changed packages
3. **Config Changes:** Run all tests (safety first)

To see what will be tested in a PR:
```bash
export TURBO_BASE_SHA="main"
node utils/test-affected.js $(git rev-parse main)
```

### Timeout Configuration

All workflows have explicit timeouts to prevent hanging:
- Setup/Lint: 10-20 minutes
- Tests: 120 minutes
- Release: 30 minutes
- Cron jobs: 15 minutes

### Concurrency Control

Workflows use concurrency groups to cancel redundant runs:
```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}
```

## Dependency Management

### pnpm Configuration

The repository uses optimized pnpm settings:

```
# Performance
network-concurrency=16      # Parallel downloads
fetch-retries=3             # Retry failed downloads
prefer-workspace-packages=true  # Use local packages

# Hoisting
shamefully-hoist=false      # Strict node_modules structure
auto-install-peers=true     # Automatic peer deps
```

### Regular Maintenance

Run these commands periodically:

```bash
# Deduplicate dependencies
pnpm dedupe

# Update dependencies (with caution)
pnpm update --interactive

# Check for outdated packages
pnpm outdated

# Audit for security issues
pnpm audit
```

### Workspace Management

The repository uses pnpm workspaces:
- `packages/*` - Main packages
- `api` - API endpoints
- `examples` - Example projects
- `internals/*` - Internal tooling

## Troubleshooting

### Slow CI Runs

1. **Check Cache Hit Rate:**
   ```
   Look for "Cache hit: true/false" in workflow logs
   ```

2. **Review Affected Packages:**
   ```
   Check the "Test Strategy" comment on your PR
   ```

3. **Check Turbo Remote Cache:**
   ```
   Look for "Remote caching enabled" in logs
   Verify TURBO_TOKEN is configured
   ```

### Cache Issues

**Problem:** Cache misses even when dependencies haven't changed
- **Solution:** Check if `pnpm-lock.yaml` has unexpected changes
- **Solution:** Verify cache key matches in workflow

**Problem:** Old or stale caches
- **Solution:** Run the cleanup workflow manually
- **Solution:** Caches automatically expire after 7 days

### Workflow Timeout

**Problem:** Workflow times out
- **Solution:** Check if tests are hanging (not the timeout itself)
- **Solution:** Increase timeout if legitimately needed
- **Solution:** Review affected testing scope

### Memory Issues

**Problem:** Out of memory during builds
- **Solution:** Check for memory leaks in tests
- **Solution:** Reduce test parallelism with `--concurrency` flag
- **Solution:** Review large fixture files

## Performance Tips

### Local Development

1. **Use Turbo for builds:**
   ```bash
   pnpm build  # Uses Turbo caching
   ```

2. **Run affected tests only:**
   ```bash
   pnpm test-unit --filter=@vercel/[package]
   ```

3. **Enable local Turbo cache:**
   ```bash
   # Cache is enabled by default in .turbo/
   ```

### CI/CD

1. **Leverage Affected Testing:**
   - Small changes = faster CI
   - Only tests affected packages

2. **Use Remote Cache:**
   - Share build artifacts across machines
   - Configured via `TURBO_TOKEN`

3. **Monitor Cache Hit Rates:**
   - Check workflow logs regularly
   - Target >80% cache hit rate

## Additional Resources

- [Turbo Documentation](https://turbo.build/repo/docs)
- [pnpm Documentation](https://pnpm.io)
- [GitHub Actions Cache](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)
- [Workflow Optimization Guide](.github/WORKFLOW_OPTIMIZATION.md)

---

**Last Updated:** December 2024
**Maintained By:** Repository Maintainers
