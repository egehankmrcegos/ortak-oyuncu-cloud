// Native plugins are loaded only after hydration; the web game needs none of them.
export async function shareInvitation(url: string): Promise<"shared" | "copied" | "cancelled"> {
  const { Capacitor } = await import("@capacitor/core");
  if (Capacitor.isNativePlatform()) {
    const { Share } = await import("@capacitor/share");
    try { await Share.share({ title: "O mu Bu mu?", url }); return "shared"; }
    catch { return "cancelled"; }
  }
  if (navigator.share) {
    try { await navigator.share({ title: "O mu Bu mu?", url }); return "shared"; }
    catch { return "cancelled"; }
  }
  await navigator.clipboard.writeText(url);
  return "copied";
}

export async function observeNativeConnection(onChange: (connected: boolean) => void): Promise<() => void> {
  const { Capacitor } = await import("@capacitor/core");
  if (!Capacitor.isNativePlatform()) return () => {};
  const { Network } = await import("@capacitor/network");
  const listener = await Network.addListener("networkStatusChange", status => onChange(status.connected));
  onChange((await Network.getStatus()).connected);
  return () => { void listener.remove(); };
}