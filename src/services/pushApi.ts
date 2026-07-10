import api from "./api";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;

// VAPID application server keys are URL-safe base64; the Push API wants a Uint8Array.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

export function isPushSupported(): boolean {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Ask for notification permission and register a push subscription, then send
 * it to the backend. Must be called from a user gesture (e.g. a toggle click)
 * — required by iOS. Returns true if a subscription was created and saved.
 */
export async function subscribeToPush(): Promise<boolean> {
  if (!isPushSupported()) {
    throw new Error("Push notifications aren't supported in this browser.");
  }
  if (!VAPID_PUBLIC_KEY) {
    throw new Error("Push isn't configured (missing VAPID key).");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return false;
  }

  const registration = await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    });
  }

  await api.post("/api/v1/push/subscribe", subscription.toJSON());
  return true;
}