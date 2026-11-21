import { Stack, useLocalSearchParams } from "expo-router";
import { WebView } from "react-native-webview";
import { API } from "../../../lib/api";

/** The shared renderer and studio inside a WebView (same session cookie as the native screens). */
export default function Web() {
  const { path, title } = useLocalSearchParams<{ path: string; title?: string }>();
  return (
    <>
      <Stack.Screen options={{ title: title ?? "" }} />
      <WebView source={{ uri: `${API}${path}` }} sharedCookiesEnabled thirdPartyCookiesEnabled allowsInlineMediaPlayback mediaPlaybackRequiresUserAction style={{ flex: 1 }} />
    </>
  );
}
