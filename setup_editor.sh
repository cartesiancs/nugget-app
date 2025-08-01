#!/usr/bin/env bash
set -euo pipefail

# ───────────────────────────────────────────────
#  Usuals.ai one-shot installer for macOS
# ───────────────────────────────────────────────

# 1. Where the repo will be cloned
REPO_DIR="${HOME}/Downloads/editor"

# 2. Install Homebrew if missing
if ! command -v brew >/dev/null 2>&1; then
  echo "Homebrew not found – installing..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  eval "$(/opt/homebrew/bin/brew shellenv)" || true   # add Brew to PATH for current session
else
  echo "Homebrew found ✔︎"
fi

# 3. Install Git if missing
if ! command -v git >/dev/null 2>&1; then
  echo "Git not found – installing..."
  brew install git
else
  echo "Git found ✔︎"
fi

# 4. Install Node.js if missing
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found – installing..."
  brew install node
else
  echo "Node.js $(node -v) found ✔︎"
fi

# 5. Clone the repository (uiImporvement branch)
if [ -d "$REPO_DIR" ]; then
  echo "Directory ${REPO_DIR} already exists – skipping clone."
else
  echo "Cloning repository into ${REPO_DIR} ..."
  git clone --branch uiImporvement --depth 1 --filter=blob:none https://github.com/Vibe-Editor/editor.git "$REPO_DIR"
fi
cd "$REPO_DIR"

# 6. Install root dependencies
echo "Installing root npm dependencies..."
npm install

# 7. Download ffmpeg & ffprobe for macOS and place in bin/
echo "Fetching ffmpeg & ffprobe..."
mkdir -p bin
pushd bin >/dev/null
curl -L https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip  -o ffmpeg.zip
curl -L https://evermeet.cx/ffmpeg/getrelease/ffprobe/zip -o ffprobe.zip
unzip -qo ffmpeg.zip
unzip -qo ffprobe.zip
rm ffmpeg.zip ffprobe.zip
chmod -R 777 .
popd >/dev/null
echo "ffmpeg & ffprobe ready ✔︎"

# 8. Build frontend widgets
echo "Building widgets in ./frontend ..."
npm --prefix frontend install
npm --prefix frontend run build:widget
npm --prefix frontend run build:flow-widget
echo "Widgets built ✔︎"

# 9. Build Electron app (creates DMG in ./dist)
echo "Building Electron app – this may take a while..."
# Compile TypeScript for Electron
npx tsc -p ./.tsconfig
# Ensure expected entry point exists
if [ -f main/electron/main.js ]; then
  mkdir -p main
  cp main/electron/main.js main/main.js
fi
# Build Electron DMG for macOS
npm run build:mac
echo "Build complete! Find the DMG in ${REPO_DIR}/dist/"

echo "───────────────────────────────────────────────"
echo " All done 🎉  Enjoy Usuals.ai!"
echo "───────────────────────────────────────────────"