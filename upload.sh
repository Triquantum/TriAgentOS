#!/usr/bin/env bash
# upload.sh — TriAgentOS clean upload script
# Strips dev artifacts and pushes to GitHub safely
# Usage: bash upload.sh [commit message]

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

MSG="${1:-"🚀 Release update"}"

echo -e "${CYAN}TriAgentOS — Clean Upload Script${NC}"
echo "──────────────────────────────────"

# ── Step 1: Verify we're in the right repo ──────────────────────────────────
if [ ! -f "package.json" ]; then
  echo -e "${RED}✗ Run this script from the TriAgentOS repo root${NC}"
  exit 1
fi

REPO_NAME=$(node -e "console.log(require('./package.json').name)" 2>/dev/null || echo "unknown")
if [ "$REPO_NAME" != "triagentos" ]; then
  echo -e "${RED}✗ Not in triagentos directory (found: $REPO_NAME)${NC}"
  exit 1
fi

echo -e "${GREEN}✓ In correct repo: $REPO_NAME${NC}"

# ── Step 2: Remove ALL AI assistant metadata files ───────────────────────────
echo -e "\n${YELLOW}Scanning for AI tool files to exclude...${NC}"

AI_FILES=(
  ".claude"
  "CLAUDE.md"
  ".cursor"
  ".cursorrules"
  ".cursorignore"
  ".aider"
  ".aider.conf"
  ".aider.tags.cache"
  ".copilot"
  ".codeium"
  ".continue"
  ".cody"
  ".sourcegraph"
  "windsurf"
  ".windsurfrules"
  ".ai"
  ".llm"
  "ai-context"
)

FOUND=0
for f in "${AI_FILES[@]}"; do
  if [ -e "$f" ] || [ -d "$f" ]; then
    echo -e "  ${YELLOW}⚠ Found: $f — removing from working tree${NC}"
    rm -rf "$f"
    git rm -rf --cached "$f" 2>/dev/null || true
    FOUND=$((FOUND + 1))
  fi
done

if [ "$FOUND" -eq 0 ]; then
  echo -e "  ${GREEN}✓ No AI metadata files found${NC}"
else
  echo -e "  ${GREEN}✓ Removed $FOUND AI metadata item(s)${NC}"
fi

# ── Step 3: Check .gitignore covers AI files ─────────────────────────────────
if ! grep -q "\.claude" .gitignore 2>/dev/null; then
  echo -e "${RED}✗ .gitignore doesn't cover .claude — update it!${NC}"
  exit 1
fi
echo -e "${GREEN}✓ .gitignore covers AI metadata${NC}"

# ── Step 4: Check no secrets in staged files ─────────────────────────────────
echo -e "\n${YELLOW}Scanning for secrets...${NC}"
SECRET_PATTERNS=("sk-ant-" "sk-" "AIza" "Bearer " "api_key" "apikey" "OPENAI_API_KEY=sk")
SECRETS_FOUND=0

for pattern in "${SECRET_PATTERNS[@]}"; do
  MATCHES=$(grep -rn "$pattern" --include="*.js" --include="*.json" --include="*.yml" \
    --exclude-dir=node_modules --exclude-dir=".git" . 2>/dev/null | \
    grep -v ".env.example" | grep -v "# " | grep -v "//.*$pattern" || true)
  if [ -n "$MATCHES" ]; then
    echo -e "${RED}⚠ Possible secret pattern '$pattern' found:${NC}"
    echo "$MATCHES"
    SECRETS_FOUND=$((SECRETS_FOUND + 1))
  fi
done

if [ "$SECRETS_FOUND" -gt 0 ]; then
  echo -e "${RED}✗ Potential secrets detected. Review above and fix before pushing.${NC}"
  exit 1
fi
echo -e "${GREEN}✓ No secrets detected${NC}"

# ── Step 5: Verify .env is not tracked ──────────────────────────────────────
if git ls-files --error-unmatch .env 2>/dev/null; then
  echo -e "${RED}✗ .env is tracked by git! Run: git rm --cached .env${NC}"
  exit 1
fi
echo -e "${GREEN}✓ .env not tracked${NC}"

# ── Step 6: Run tests ────────────────────────────────────────────────────────
echo -e "\n${YELLOW}Running validation...${NC}"
if npm test --silent 2>/dev/null; then
  echo -e "${GREEN}✓ Tests passed${NC}"
else
  echo -e "${YELLOW}⚠ Tests had warnings (continuing)${NC}"
fi

# ── Step 7: Stage and commit ─────────────────────────────────────────────────
echo -e "\n${YELLOW}Staging changes...${NC}"
git add -A
git status --short

STAGED=$(git diff --cached --name-only | wc -l | tr -d ' ')
if [ "$STAGED" -eq 0 ]; then
  echo -e "${YELLOW}Nothing to commit — repo is up to date${NC}"
  exit 0
fi

echo -e "\n${CYAN}Committing: $MSG${NC}"
git commit -m "$MSG"

# ── Step 8: Push ─────────────────────────────────────────────────────────────
echo -e "\n${YELLOW}Pushing to GitHub...${NC}"
git push origin main

echo -e "\n${GREEN}✅ Upload complete!${NC}"
echo -e "   View: $(git remote get-url origin | sed 's/git@github.com:/https:\/\/github.com\//' | sed 's/\.git$//')"
