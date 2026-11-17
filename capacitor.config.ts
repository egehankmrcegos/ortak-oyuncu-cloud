import type { CapacitorConfig } from "@capacitor/cli";

// Development shell only; server functions remain hosted.
const developmentServer = process.env["NATIVE_DEV_SERVER_URL"];
if (developmentServer && new URL(developmentServer).protocol !== "https:") {
  throw new Error("Native development server must use HTTPS.");
}
const config: CapacitorConfig = {
  appId: "com.egehankomurcu.omubumu",
  appName: "O mu Bu mu?",
  webDir: "native/www",
  loggingBehavior: "none",
  zoomEnabled: true,
  ios: { contentInset: "never", preferredContentMode: "mobile", webContentsDebuggingEnabled: false, zoomEnabled: true },
  server: { ...(developmentServer ? { url: developmentServer } : {}), cleartext: false },
  plugins: { SplashScreen: { launchShowDuration: 1200, showSpinner: false } },
};
export default config;