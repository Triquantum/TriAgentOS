name: Daily AI Ecosystem Discovery

on:
  schedule:
    - cron: '0 6 * * *'  # Every day at 6am UTC
  workflow_dispatch:       # Allow manual trigger

jobs:
  discover:
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci --ignore-scripts

      - name: Run discovery scan
        run: node tools/github-scanner/discover.js
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Rebuild README
        run: node tools/readme-generator/build-readme.js

      - name: Commit and push if changed
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "TriAgentOS Bot"
          git add registry/ README.md
          git diff --staged --quiet || git commit -m "🤖 Daily AI ecosystem update $(date +'%Y-%m-%d')"
          git push
