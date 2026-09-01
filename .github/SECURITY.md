# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| `main`  | Yes    |

## Reporting a Vulnerability

**Do NOT open a public GitHub Issue for security vulnerabilities.**

Please report security issues privately via:
- **GitHub private vulnerability reporting:** Repository -> Security tab -> "Report a vulnerability"
- Or contact the maintainer directly via GitHub profile

We will acknowledge receipt within 48 hours and aim to resolve critical issues within 14 days.

## Credential and Key Management

This repository is public. The following data is **never stored in the repository**:

| Data | Storage |
|------|---------|
| Schwab App Key / App Secret | Browser localStorage or local .env file |
| LLM API keys (Gemini, OpenAI, Anthropic, etc.) | GitHub Actions Secrets only |
| Notification tokens (Telegram, Email password, etc.) | GitHub Actions Secrets only |
| Stock watchlist / STOCK_LIST | GitHub Actions Secrets / Variables only |
| Analysis reports, databases (.db, .sqlite) | Local disk only -- gitignored |
| .env files | Local disk only -- gitignored via *.env rule |

If you believe a credential has been accidentally committed to this repository's history,
please report it privately so it can be immediately revoked and purged.
