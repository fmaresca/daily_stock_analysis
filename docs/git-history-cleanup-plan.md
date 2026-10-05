# Git History Sanitization & Repository Bloat Cleanup Plan

> **STATUS: PENDING HUMAN REVIEW & APPROVAL**  
> **DO NOT EXECUTE WITHOUT EXPLICIT WRITTEN AUTHORIZATION.**  
> Rewriting git history modifies commit hashes across all branches and tags. It requires a coordinated force-push (`git push --force`) and impacts all clones and forks.

---

## 1. Problem Statement

A repository audit of `daily_stock_analysis` identified two hygiene and security issues residing in historical git objects:

1. **Historical Hardcoded Credential:** Prior to commit `8109aa8b` (`fix(security): remove tradier fallback token and stop sending token in url parameters`), a development Tradier API key was present in source files. While removed in modern HEAD (`sessionStorage` and server-side provisioning live), the string remains retrievable from git object history.
2. **Repository Object Bloat (.git ~92 MB):** Historical commits contain large graphic assets in `docs/assets/` (`.gif` demo animations, `.psd` Photoshop sources, `.ai` Illustrator files) and repeated large JSON snapshots (`apps/dsa-web/public/stocks.index.json`).

---

## 2. Prerequisites & Pre-Execution Safeguards

Before running any history rewriting:

1. **Rotate Credentials First:**
   - Log into the [Tradier Developer Portal](https://developer.tradier.com) and invalidate/rotate any production or sandbox tokens that were ever committed.
   - History rewriting removes the string from Git, but cannot revoke a token that may have already been indexed by external scanners while the repo was public.
2. **Coordinate with Collaborators:**
   - Merge or close all open Pull Requests.
   - Notify collaborators that a force-push will occur.
3. **Take a Complete Backup (Mirror Clone):**
   ```bash
   git clone --mirror git@github.com:fmaresca/daily_stock_analysis.git dsa-backup-pre-cleanup.git
   ```

---

## 3. Recommended Tool: `git-filter-repo`

[`git-filter-repo`](https://github.com/newren/git-filter-repo) is the official recommendation of the Git project (replacing deprecated `git filter-branch` and outperforming BFG in edge cases).

### Installation
```bash
pip install git-filter-repo
```

---

## 4. Execution Procedure

### Step 1: Clone a Clean Working Mirror
```bash
git clone git@github.com:fmaresca/daily_stock_analysis.git dsa-clean-run
cd dsa-clean-run
```

### Step 2: Strip Large Binaries (> 1 MB)
Remove historical `.psd`, `.ai`, and large `.gif` recordings from git history:
```bash
# Strip large media files from entire history
git filter-repo --path-glob 'docs/assets/*.gif' --invert-paths
git filter-repo --path-glob 'docs/assets/dsa_vi/*.psd' --invert-paths
git filter-repo --path-glob 'docs/assets/dsa_vi/*.ai' --invert-paths

# Strip any stray object larger than 1 MB across all commits
git filter-repo --strip-bloat-bigger 1M
```

### Step 3: Redact the Historical Tradier Token
Create an `expressions.txt` replacement file mapping the legacy token string to a sanitized placeholder:
```text
# Replace the leaked Tradier token string wherever it appears in history
REPLACE_ME_OLD_TRADIER_TOKEN==>REDACTED_TRADIER_KEY
```

Run text replacement across all remaining commits:
```bash
git filter-repo --replace-text expressions.txt
```

### Step 4: Re-pack and Prune Unreachable Objects
```bash
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### Step 5: Verify Results Locally
Verify repository size and verify zero hits for the token:
```bash
# Check repository size (expected reduction from ~92 MB to ~15-20 MB)
git count-objects -vH

# Search all git commits/trees for the old token
git rev-list --all | xargs git grep "OLD_TOKEN_STRING"
# Expected output: (empty / 0 hits)
```

---

## 5. Force-Push & Collaborator Reconciliation

Once local verification is approved by maintainers:

### Step 6: Force-Push to GitHub
```bash
git remote add origin git@github.com:fmaresca/daily_stock_analysis.git
git push origin --force --all
git push origin --force --tags
```

### Step 7: Collaborator Impact Instructions
All contributors must re-base or re-clone:
```bash
# Recommended for all contributors:
cd ..
rm -rf daily_stock_analysis
git clone git@github.com:fmaresca/daily_stock_analysis.git
```
If an active feature branch has unmerged work:
```bash
git fetch origin
git rebase --onto origin/main <old-base-commit> <feature-branch>
```

---

## 6. Forward-Looking Hygiene Controls
- **.gitignore Rule Added:** Automatically blocks new `*.psd`, `*.ai`, `*.mp4`, `*.mov`, `docs/assets/*.gif`, and archives (`*.zip`, `*.tar.gz`).
- **Release Hosting for Media:** High-resolution product demos and screencasts will be attached to GitHub Releases rather than committed to repo tree.
- **Client-Side Secret Prevention:** Strict rule in `AGENTS.md` and CI gate preventing credentials and API tokens in source code.
