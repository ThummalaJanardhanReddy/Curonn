#!/bin/bash
# Builds and runs the app on an iOS Simulator, bypassing `expo run:ios`.
# Needed on Xcode 27+, which replaced Simulator.app with DeviceHub.app and
# broke Expo CLI's hardcoded lookup for an app literally named "Simulator".
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IOS_DIR="$ROOT_DIR/ios"
SCHEME="curonn"
BUNDLE_ID="com.curonn.health"
DEVICE_NAME="${1:-iPhone 17 Pro}"

echo "› Resolving simulator UDID for \"$DEVICE_NAME\"..."
SIM_ID="$(xcrun simctl list devices available | grep -F "$DEVICE_NAME (" | grep -v "Max" | head -1 | sed -E 's/.*\(([0-9A-F-]+)\).*/\1/')"
if [ -z "$SIM_ID" ]; then
  echo "Could not find a simulator named \"$DEVICE_NAME\". Run: xcrun simctl list devices available"
  exit 1
fi
echo "  -> $SIM_ID"

echo "› Ensuring Metro is running..."
if ! curl -s -m 2 http://localhost:8081/status > /dev/null 2>&1; then
  (cd "$ROOT_DIR" && nohup npx expo start --dev-client > /tmp/metro.log 2>&1 &)
  for i in $(seq 1 30); do
    curl -s -m 2 http://localhost:8081/status > /dev/null 2>&1 && break
    sleep 1
  done
fi

echo "› Booting simulator (if needed)..."
xcrun simctl boot "$SIM_ID" 2>/dev/null || true
open -a "DeviceHub" --args -CurrentDeviceUDID "$SIM_ID" 2>/dev/null || open -a "Simulator" --args -CurrentDeviceUDID "$SIM_ID" 2>/dev/null || true

echo "› Building ($SCHEME, Debug) for simulator..."
xcodebuild -workspace "$IOS_DIR/$SCHEME.xcworkspace" -scheme "$SCHEME" -configuration Debug \
  -destination "id=$SIM_ID" \
  -derivedDataPath "$IOS_DIR/build" \
  build

APP_PATH="$IOS_DIR/build/Build/Products/Debug-iphonesimulator/$SCHEME.app"

echo "› Installing..."
xcrun simctl install "$SIM_ID" "$APP_PATH"

echo "› Launching..."
xcrun simctl launch "$SIM_ID" "$BUNDLE_ID"

echo "✓ Done. Metro log: /tmp/metro.log"
