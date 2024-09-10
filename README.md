# Generate Code Snippets from an OpenAPI specification

TODO: Synopsis

## Prerequisites / Inputs

- `github_sha` - the commit hash to put into the post as reference, can be
  obtained using `$GITHUB_SHA` when running in an action or with
  `git rev-parse --short HEAD`
- `spec_file` - the specification file to be uploaded, relative to the
  repositories root

## Instructions

1. ...

## Development

- You can run the action locally using `npm run test:run`, providing the
  configuration parameters through the environment. See
  [test.ts](./src/test.ts).
- See [package.json](./package.json) for linting, testing and formatting
  scripts.
