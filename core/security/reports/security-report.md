# TriAgentOS Security Report

**Scan Date:** 2026-05-04T03:18:03.242Z
**Status:** ❌ FAILED

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 2 |
| 🟠 High | 4 |
| 🟡 Medium | 2 |
| **Total** | **8** |

## SECRETS Scanner

✅ No issues found

## SAST Scanner

- **HIGH** [child-process] child_process exec — command injection risk
  - File: `core/process/index.js` line 24
- **CRITICAL** [eval-usage] eval() usage — code injection risk
  - File: `core/security/index.js` line 27
- **HIGH** [child-process] child_process exec — command injection risk
  - File: `core/security/index.js` line 129
- **CRITICAL** [sql-concat] SQL string concatenation — injection risk
  - File: `core/security/index.js` line 29
- **MEDIUM** [insecure-random] Math.random() — not cryptographically secure
  - File: `core/security/index.js` line 33
- **MEDIUM** [insecure-random] Math.random() — not cryptographically secure
  - File: `core/stream.js` line 24
- **HIGH** [child-process] child_process exec — command injection risk
  - File: `core/tools/index.js` line 36
- **HIGH** [child-process] child_process exec — command injection risk
  - File: `tools/code-tools.js` line 51

## IAC Scanner

✅ No issues found

## DEPS Scanner

✅ No issues found

## CONTAINER Scanner

✅ No issues found

