#!/bin/bash
# One-time macOS bootstrap. Run from a downloaded file, not a curl-to-shell pipe.
set -euo pipefail

if [ "$(uname -s)" != "Darwin" ]; then
  printf '%s\n' 'Bu betik macOS içindir. Windows: npm run setup:device.' >&2
  exit 1
fi

desktop_dir="$(cd "$HOME/Desktop" && pwd -P)"
project_parent="$desktop_dir/Projeler"
mkdir -p "$project_parent"

if ! command -v git >/dev/null 2>&1 || ! command -v node >/dev/null 2>&1 || ! command -v gh >/dev/null 2>&1; then
  if command -v brew >/dev/null 2>&1; then
    command -v git >/dev/null 2>&1 || brew install git
    command -v node >/dev/null 2>&1 || brew install node@24
    if ! command -v node >/dev/null 2>&1 && [ -d "$(brew --prefix node@24)/bin" ]; then
      node_prefix="$(brew --prefix node@24)"
      export PATH="$node_prefix/bin:$PATH"
      case "${SHELL:-}" in
        */zsh) shell_profile="$HOME/.zprofile" ;;
        */bash) shell_profile="$HOME/.bash_profile" ;;
        *) shell_profile='' ;;
      esac
      if [ -n "$shell_profile" ] && ! grep -q 'wordverse-node-path' "$shell_profile" 2>/dev/null; then
        if [ -f "$shell_profile" ] && [ ! -e "$shell_profile.wordverse-backup" ]; then
          cp "$shell_profile" "$shell_profile.wordverse-backup"
        fi
        printf '\n# wordverse-node-path\nexport PATH="%s/bin:$PATH"\n' "$node_prefix" >> "$shell_profile"
      fi
    fi
    command -v gh >/dev/null 2>&1 || brew install gh
  else
    printf '%s\n' 'İlk araç kurulumu: resmî Node 24/Git/GitHub CLI kurulumunu mevcut ajanla tamamla; ardından bu betiği tekrar çalıştır.' >&2
    exit 1
  fi
fi

node -e 'const [major,minor]=process.versions.node.split(".").map(Number); if (!(major>=24 || (major===22 && minor>=13))) { console.error("Node 24 kur ve yeni terminal aç."); process.exit(1); }'
command -v codex >/dev/null 2>&1 || npm install -g @openai/codex
command -v claude >/dev/null 2>&1 || npm install -g @anthropic-ai/claude-code

project_dir="$project_parent/wordverse-galaxy"
found_project=''
for candidate in "$project_parent"/*; do
  [ -d "$candidate" ] || continue
  remote="$(git -C "$candidate" remote get-url origin 2>/dev/null || true)"
  case "$remote" in
    https://github.com/GhostFelina/wordverse-galaxy|https://github.com/GhostFelina/wordverse-galaxy.git|git@github.com:GhostFelina/wordverse-galaxy.git)
      found_project="$candidate"
      break
      ;;
  esac
done
if [ -n "$found_project" ]; then
  project_dir="$found_project"
elif [ -e "$project_dir" ]; then
  printf '%s\n' 'Hedef klasör başka içerik barındırıyor; korunuyor. Mevcut ajanla ayrı bir proje klasörü seç.' >&2
  exit 1
else
  git clone --branch phase/2-auth-sync https://github.com/GhostFelina/wordverse-galaxy.git "$project_dir"
fi

cd "$project_dir"
if [ -n "$(git status --porcelain)" ]; then
  printf '%s\n' 'Mevcut yerel değişiklikler korundu. Ajanla HANDOFF dalını kontrol edip commit/push veya birleştirmeyi tamamla; ardından kurulumu tekrar çalıştır.' >&2
  exit 1
fi
git fetch origin
# Existing old main clones need the current handoff branch on this first setup.
if [ ! -f docs/handoff/STATE.json ]; then
  git switch phase/2-auth-sync
fi
git pull --ff-only
active_branch="$(node -e 'const s=require("./docs/handoff/STATE.json"); if(!/^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(s.activeBranch)) process.exit(1); console.log(s.activeBranch)')"
git switch "$active_branch"
git pull --ff-only
npm run setup:device

if ! gh auth status --hostname github.com >/dev/null 2>&1; then
  printf '%s\n' 'Bir kez GitHub hesabına giriş: GhostFelina. Tarayıcıdaki girişi/2FA adımını tamamla.'
  gh auth login --hostname github.com --web --git-protocol https --scopes workflow
fi
gh auth setup-git --hostname github.com
codex login status >/dev/null 2>&1 || codex login
claude auth status >/dev/null 2>&1 || claude auth login
npm run doctor -- --push-check

printf '\n%s\n' "Proje: $project_dir" 'Kurulum kontrolü geçti. Yeni Codex veya Claude oturumunda: wordverse projemize kaldığımız yerden devam et' 'Doğrudan alternatif: bu klasörde npm run resume:codex veya npm run resume:claude.'
