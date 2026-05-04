# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | ✅ Yes    |
| < 1.0   | ❌ No     |

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities via public GitHub issues.**

Email: security@triquantum.ai (or open a [private advisory](https://github.com/Triquantum/TriAgentOS/security/advisories/new))

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (optional)

We respond within 48 hours and aim to patch critical issues within 7 days.

## Security Notes

- TriAgentOS stores API keys in `~/.triagentos/config.json` — keep this file private
- API keys are never logged or sent anywhere other than the configured provider
- For production use, prefer environment variables over stored config
- The `tri` CLI never sends telemetry (telemetry defaults to `false`)
