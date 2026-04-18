import * as Network from "expo-network";

type WindowEventListener = (event?: { type: string }) => void;

/**
 * React Native polyfill for browser-like `window.addEventListener("online")` / `removeEventListener`.
 *
 * Convex's React client registers an `"online"` listener to reconnect websockets when connectivity returns.
 * In React Native, `window` exists but `window.addEventListener` is typically undefined, causing a crash.
 */
export function installWindowOnlineOfflineEventPolyfill(): void {
  const g = globalThis as any;
  if (!g) return;

  if (g.window == null) g.window = g;
  const win = g.window as any;

  const hasAdd = typeof win.addEventListener === "function";
  const hasRemove = typeof win.removeEventListener === "function";
  if (hasAdd && hasRemove) return;

  const listenersByType = new Map<string, Set<WindowEventListener>>();
  let networkSubscription: { remove(): void } | null = null;
  let lastOnline: boolean | undefined;

  const computeOnline = (state?: Network.NetworkState): boolean | undefined => {
    if (!state) return undefined;
    if (state.isConnected === false) return false;
    if (state.isConnected === true) return state.isInternetReachable !== false;
    if (state.type === Network.NetworkStateType.NONE) return false;
    return undefined;
  };

  const ensureNavigatorOnLine = () => {
    const nav = (win.navigator ??= {});
    if (!nav || typeof nav !== "object") return;
    try {
      const existing = Object.getOwnPropertyDescriptor(nav, "onLine");
      if (existing?.get) return;
      Object.defineProperty(nav, "onLine", {
        configurable: true,
        enumerable: true,
        get: () => lastOnline ?? true,
      });
    } catch {
      // Best-effort only.
    }
  };

  const fire = (type: string) => {
    const listeners = listenersByType.get(type);
    if (!listeners || listeners.size === 0) return;
    const event = { type };
    for (const listener of Array.from(listeners)) {
      try {
        listener(event);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[window-online-offline] "${type}" listener threw`, err);
      }
    }
  };

  const handleOnlineState = (online: boolean | undefined) => {
    if (online == null) return;
    if (lastOnline === undefined) {
      lastOnline = online;
      ensureNavigatorOnLine();
      return;
    }
    if (lastOnline === online) return;

    lastOnline = online;
    ensureNavigatorOnLine();
    fire(online ? "online" : "offline");
  };

  const ensureNetworkSubscription = () => {
    if (networkSubscription) return;
    try {
      networkSubscription = Network.addNetworkStateListener((state) => {
        handleOnlineState(computeOnline(state));
      });
      Network.getNetworkStateAsync()
        .then((state) => handleOnlineState(computeOnline(state)))
        .catch(() => {});
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[window-online-offline] failed to subscribe to network state", err);
    }
  };

  const maybeCleanupNetworkSubscription = () => {
    if (!networkSubscription) return;
    const onlineCount = listenersByType.get("online")?.size ?? 0;
    const offlineCount = listenersByType.get("offline")?.size ?? 0;
    if (onlineCount !== 0 || offlineCount !== 0) return;
    try {
      networkSubscription.remove();
    } finally {
      networkSubscription = null;
    }
  };

  win.addEventListener = (type: string, listener: WindowEventListener) => {
    if (typeof listener !== "function") return;
    const set = listenersByType.get(type) ?? new Set<WindowEventListener>();
    set.add(listener);
    listenersByType.set(type, set);

    if (type === "online" || type === "offline") ensureNetworkSubscription();
  };

  win.removeEventListener = (type: string, listener: WindowEventListener) => {
    const set = listenersByType.get(type);
    if (!set) return;
    set.delete(listener);
    if (set.size === 0) listenersByType.delete(type);

    if (type === "online" || type === "offline") maybeCleanupNetworkSubscription();
  };

  if (typeof win.dispatchEvent !== "function") {
    win.dispatchEvent = (event: { type?: string }) => {
      const type = event?.type;
      if (typeof type === "string") fire(type);
      return true;
    };
  }

  ensureNavigatorOnLine();
}

