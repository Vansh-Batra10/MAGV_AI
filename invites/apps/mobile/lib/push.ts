import * as Notifications from "expo-notifications";
import { api } from "./api";

/** Push: new RSVP, song request, shagun pledge, daily digest in sending week. The server stores the Expo push token. */
export async function registerPush(): Promise<void> {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    await api("/api/push/register", { method: "POST", body: { token } });
  } catch { /* simulators without push */ }
}
