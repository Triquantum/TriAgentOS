{
  "scanDate": "2026-05-04T03:18:03.242Z",
  "dir": ".",
  "summary": {
    "total": 8,
    "critical": 2,
    "high": 4,
    "medium": 2,
    "passed": false
  },
  "results": {
    "secrets": {
      "scanner": "secrets",
      "dir": ".",
      "filesScanned": 49,
      "findings": [],
      "passed": true
    },
    "sast": {
      "scanner": "sast",
      "dir": ".",
      "filesScanned": 34,
      "findings": [
        {
          "id": "child-process",
          "severity": "high",
          "label": "child_process exec — command injection risk",
          "cwe": "CWE-78",
          "file": "core/process/index.js",
          "line": 24,
          "occurrences": 1
        },
        {
          "id": "eval-usage",
          "severity": "critical",
          "label": "eval() usage — code injection risk",
          "cwe": "CWE-95",
          "file": "core/security/index.js",
          "line": 27,
          "occurrences": 1
        },
        {
          "id": "child-process",
          "severity": "high",
          "label": "child_process exec — command injection risk",
          "cwe": "CWE-78",
          "file": "core/security/index.js",
          "line": 129,
          "occurrences": 2
        },
        {
          "id": "sql-concat",
          "severity": "critical",
          "label": "SQL string concatenation — injection risk",
          "cwe": "CWE-89",
          "file": "core/security/index.js",
          "line": 29,
          "occurrences": 1
        },
        {
          "id": "insecure-random",
          "severity": "medium",
          "label": "Math.random() — not cryptographically secure",
          "cwe": "CWE-338",
          "file": "core/security/index.js",
          "line": 33,
          "occurrences": 1
        },
        {
          "id": "insecure-random",
          "severity": "medium",
          "label": "Math.random() — not cryptographically secure",
          "cwe": "CWE-338",
          "file": "core/stream.js",
          "line": 24,
          "occurrences": 1
        },
        {
          "id": "child-process",
          "severity": "high",
          "label": "child_process exec — command injection risk",
          "cwe": "CWE-78",
          "file": "core/tools/index.js",
          "line": 36,
          "occurrences": 1
        },
        {
          "id": "child-process",
          "severity": "high",
          "label": "child_process exec — command injection risk",
          "cwe": "CWE-78",
          "file": "tools/code-tools.js",
          "line": 51,
          "occurrences": 2
        }
      ],
      "passed": false
    },
    "iac": {
      "scanner": "iac",
      "dir": ".",
      "filesScanned": 0,
      "findings": [],
      "passed": true
    },
    "deps": {
      "scanner": "deps",
      "dir": ".",
      "totalDeps": 14,
      "findings": [],
      "passed": true
    },
    "container": {
      "scanner": "container",
      "error": "basename is not defined",
      "findings": [],
      "passed": false
    }
  }
}