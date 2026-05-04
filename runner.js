name: Validate

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x, 22.x]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: npm

      - name: Install dependencies
        run: npm ci --ignore-scripts

      - name: Validate registries
        run: npm run validate

      - name: Smoke test CLI
        run: node cli/bin/tri.js --version

      - name: Test boot command
        run: node cli/bin/tri.js boot --json
        env:
          CI: true
