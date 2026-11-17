import { readFileSync, existsSync } from "node:fs";
const status = JSON.parse(readFileSync("native/release-status.json", "utf8"));
const failures: string[] = [];
if (process.env["NATIVE_DEV_SERVER_URL"]) failures.push("Remote server configuration is development-only.");
if (!status.bundledGameClient) failures.push("Bundled native game client is not implemented; do not submit the website wrapper.");
if (!status.realDeviceVerified) failures.push("Real iPhone and TestFlight verification required.");
if (!status.privacyAnswersReviewed) failures.push("App Store privacy answers and SDK privacy report require final review.");
if (!status.assetRightsConfirmed) failures.push("Confirm rights to remaining stadium and store artwork; official club crests are no longer used.");
if (!existsSync("native/www/index.html")) failures.push("Bundled native game assets missing; run ios:bundle.");
if (!existsSync("ios/App/App.xcodeproj/project.pbxproj")) failures.push("iOS Xcode project missing.");
if (failures.length) { console.error(failures.map(f => `BLOCKED: ${f}`).join("\n")); process.exit(1); }
console.log("Preparation checks passed. Apple approval is not guaranteed.");