#!/usr/bin/env bash
#
#       |\      _,,,---,,_
# ZZZzz /,`.-'`'    -.  ;-;;,_
#      |,4-  ) )-,_. ,\ (  `'-'
#     '---''(_/--'  `-'\_)
#
# REMINDER, this script uses relative paths, don't move it around lightly.
#
# Fetches the godot-cef native binaries (CEF/Chromium, ~0.4-0.6 GB per platform) into
# addons/godot_cef/bin/. They are gitignored: committing them would put gigabytes into
# history on every version bump. Only the .gdextension, its .uid and the icons are tracked.
#
# Usage:
#   fetch_godot_cef.sh                 # all platforms in the release
#   fetch_godot_cef.sh <platform>...   # only these, e.g. x86_64-unknown-linux-gnu
#   fetch_godot_cef.sh --force ...     # re-extract even if the pinned version is present
#
# Platforms: x86_64-unknown-linux-gnu, aarch64-unknown-linux-gnu, x86_64-pc-windows-msvc,
#            aarch64-pc-windows-msvc, universal-apple-darwin
#
# To upgrade: bump VERSION, take the new SHA256 from
#   gh api repos/dsh0416/godot-cef/releases/tags/<VERSION> -q '.assets[].digest'
# then run with --force, and commit the release's godot_cef.gdextension if it changed
# (the script warns when it differs from the tracked one).

set -euo pipefail

VERSION="v1.15.3"
SHA256="37420fb0929987faf3d349194c68a9ba13a60fbf4075a5c5e4d5cf20ddcf1c8f"
ZIP_NAME="godot_cef-${VERSION}.zip"
URL="https://github.com/dsh0416/godot-cef/releases/download/${VERSION}/${ZIP_NAME}"
ZIP_PREFIX="dist/addons/godot_cef"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ADDON_DIR="$(cd "${SCRIPT_DIR}/../../addons/godot_cef" && pwd)"
BIN_DIR="${ADDON_DIR}/bin"
STAMP="${BIN_DIR}/.version"
CACHE_DIR="${XDG_CACHE_HOME:-${HOME}/.cache}/sanctuary"
ZIP_PATH="${CACHE_DIR}/${ZIP_NAME}"

force=false
platforms=()
for arg in "$@"; do
    case "${arg}" in
        --force) force=true ;;
        -h|--help) sed -n '8,25p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
        *) platforms+=("${arg}") ;;
    esac
done

wanted="${VERSION} ${platforms[*]:-all}"
if ! ${force} && [[ -f "${STAMP}" ]] && [[ "$(cat "${STAMP}")" == "${wanted}" ]]; then
    echo "godot-cef ${VERSION} (${platforms[*]:-all}) already present, use --force to re-fetch."
    exit 0
fi

# Download once into the user cache; a verified zip is reused across clones and re-runs.
mkdir -p "${CACHE_DIR}"
if [[ ! -f "${ZIP_PATH}" ]] || ! echo "${SHA256}  ${ZIP_PATH}" | sha256sum --check --status; then
    echo "Downloading ${URL}"
    # GitHub's CDN resets ~1 GB transfers now and then; retry and resume the .part file.
    curl --fail --location --progress-bar --retry 5 --retry-all-errors --continue-at - \
        --output "${ZIP_PATH}.part" "${URL}"
    mv "${ZIP_PATH}.part" "${ZIP_PATH}"
fi
echo "${SHA256}  ${ZIP_PATH}" | sha256sum --check --status \
    || { echo "SHA256 mismatch for ${ZIP_PATH}, deleting it." >&2; rm -f "${ZIP_PATH}"; exit 1; }

# Extract into a temp dir first and only swap bin/ once that succeeded, so a failed run
# never leaves a half-populated addon behind.
tmp="$(mktemp -d)"
trap 'rm -rf "${tmp}"' EXIT

for p in "${platforms[@]}"; do
    zipinfo -1 "${ZIP_PATH}" "${ZIP_PREFIX}/bin/${p}/*" &> /dev/null \
        || { echo "Unknown platform: ${p}" >&2; exit 1; }
done

patterns=()
if (( ${#platforms[@]} == 0 )); then
    patterns+=("${ZIP_PREFIX}/bin/*")
else
    for p in "${platforms[@]}"; do patterns+=("${ZIP_PREFIX}/bin/${p}/*"); done
fi
patterns+=("${ZIP_PREFIX}/godot_cef.gdextension")

unzip -q "${ZIP_PATH}" "${patterns[@]}" -d "${tmp}"

# The release zip stores the CEF helper executables without their exec bit, and CEF
# cannot spawn its subprocesses without it.
find "${tmp}/${ZIP_PREFIX}/bin" -type f \( -name gdcef_helper -o -path '*/Contents/MacOS/*' \) \
    -exec chmod +x {} +

rm -rf "${BIN_DIR}"
mv "${tmp}/${ZIP_PREFIX}/bin" "${BIN_DIR}"
echo "${wanted}" > "${STAMP}"

if ! cmp -s "${tmp}/${ZIP_PREFIX}/godot_cef.gdextension" "${ADDON_DIR}/godot_cef.gdextension"; then
    echo "Warning: the tracked godot_cef.gdextension differs from the ${VERSION} release's:" >&2
    diff "${tmp}/${ZIP_PREFIX}/godot_cef.gdextension" "${ADDON_DIR}/godot_cef.gdextension" >&2 || true
fi

echo "godot-cef ${VERSION} installed into ${BIN_DIR} ($(du -sh "${BIN_DIR}" | cut -f1))."

# created at 2026-10-09, Fri, 23:44 🌊
# dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤
