<p align="center">
  <a href="https://vercel.com">
    <img src="https://assets.vercel.com/image/upload/v1588805858/repositories/vercel/logo.png" height="96">
    <h3 align="center">Vercel</h3>
  </a>
</p>

<p align="center">
  Develop. Preview. Ship.
</p>

<p align="center">
  <a href="https://vercel.com/docs"><strong>Documentation</strong></a> ·
  <a href="https://vercel.com/changelog"><strong>Changelog</strong></a> ·
  <a href="https://vercel.com/templates"><strong>Templates</strong></a> ·
  <a href="https://vercel.com/docs/cli"><strong>CLI</strong></a>
</p>
<br/>

## Vercel

Vercel's AI Cloud is a unified platform for building modern applications, giving teams the tools to be flexible, move fast, and stay secure while focusing on their products instead of infrastructure.

## Deploy

Get started by [importing a project](https://vercel.com/new), [choosing a template](https://vercel.com/templates), or using the [Vercel CLI](https://vercel.com/docs/cli). Then, `git push` to deploy.

## Documentation

For details on how to use Vercel, check out our [documentation](https://vercel.com/docs).

## Contributing

This project uses [pnpm](https://pnpm.io/) to install dependencies and run scripts.

You can use the `vercel` script to run local changes as if you were invoking Vercel CLI. For example, `vercel deploy --cwd=/path/to/project` could be run with local changes with `pnpm vercel deploy --cwd=/path/to/project`.

When contributing to this repository, please first discuss the change you wish to make via [Vercel Community](https://community.vercel.com/tags/c/community/4/cli) with the owners of this repository before submitting a Pull Request.

Please read our [Code of Conduct](./.github/CODE_OF_CONDUCT.md) and follow it in all your interactions with the project.

### Local development

This project is configured in a monorepo, where one repository contains multiple npm packages. Dependencies are installed and managed with `pnpm`, not `npm` CLI.

To get started, execute the following:

```
git clone https://github.com/vercel/vercel
cd vercel
corepack enable
pnpm install
pnpm build
pnpm lint
pnpm test-unit
```

Make sure all the tests pass before making changes.

#### Running Vercel CLI Changes

You can use `pnpm vercel` from the `cli` package to invoke Vercel CLI with local changes:

```
cd ./packages/cli
pnpm vercel 
```
