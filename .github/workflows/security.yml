name: Security Scan

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * 1'  # Weekly Monday 2am UTC

jobs:
  trisecure:
    name: TriSecure Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: npm

      - name: Install dependencies
        run: npm ci --ignore-scripts

      - name: Run TriSecure scan
        run: npm run security
        continue-on-error: true

      - name: Upload security report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: security-report
          path: core/security/reports/

  # Gitleaks — pin to specific commit SHA in production
  # gitleaks:
  #   name: Gitleaks Secret Scan
  #   runs-on: ubuntu-latest
  #   steps:
  #     - uses: actions/checkout@v4
  #     - name: Run Gitleaks
  #       # uses: gitleaks/gitleaks-action@v2  # Pin to commit SHA
  #       run: echo "Install gitleaks for production secret scanning"

  # Trivy — pin to specific commit SHA in production
  # trivy:
  #   name: Trivy Vulnerability Scan
  #   runs-on: ubuntu-latest
  #   steps:
  #     - uses: actions/checkout@v4
  #     - name: Run Trivy
  #       # uses: aquasecurity/trivy-action@0.20.0  # Pin to commit SHA
  #       run: echo "Install trivy for container and dependency scanning"

  # Checkov — pin to specific commit SHA in production
  # checkov:
  #   name: Checkov IaC Scan
  #   runs-on: ubuntu-latest
  #   steps:
  #     - uses: actions/checkout@v4
  #     - name: Run Checkov
  #       # uses: bridgecrewio/checkov-action@v12  # Pin to commit SHA
  #       run: echo "Install checkov for IaC policy-as-code scanning"

  # Semgrep — pin to specific commit SHA in production
  # semgrep:
  #   name: Semgrep SAST
  #   runs-on: ubuntu-latest
  #   steps:
  #     - uses: actions/checkout@v4
  #     - name: Run Semgrep
  #       # uses: returntocorp/semgrep-action@v1  # Pin to commit SHA
  #       run: echo "Install semgrep for advanced SAST analysis"
