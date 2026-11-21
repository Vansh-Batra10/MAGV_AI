import { router, Stack, useLocalSearchParams } from "expo-router";
import { Button, Screen } from "../../../components/ui";

/** Wedding hub: native screens for the daily jobs, the shared studio (WebView) for rich editing and preview. */
export default function Hub() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const web = (path: string, title: string) => router.push({ pathname: "/w/[id]/web", params: { id, path, title } });
  return (
    <Screen>
      <Stack.Screen options={{ title: "Invite" }} />
      <Button primary title="Preview" onPress={() => web(`/studio/${id}?tab=preview`, "Preview")} />
      <Button title="Edit details" onPress={() => web(`/studio/${id}?tab=details`, "Edit")} />
      <Button title="Guests" onPress={() => router.push({ pathname: "/w/[id]/guests", params: { id } })} />
      <Button title="Send queue" onPress={() => router.push({ pathname: "/w/[id]/send", params: { id } })} />
      <Button title="Dashboard" onPress={() => router.push({ pathname: "/w/[id]/dashboard", params: { id } })} />
      <Button title="Shagun ledger" onPress={() => web(`/studio/${id}?tab=shagun`, "Shagun")} />
      <Button title="Exports" onPress={() => web(`/studio/${id}?tab=exports`, "Exports")} />
      <Button title="Plan" onPress={() => web(`/studio/${id}?tab=plan`, "Plan")} />
    </Screen>
  );
}
