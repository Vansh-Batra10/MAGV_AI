import { Stack } from "expo-router";
import { ui } from "../lib/theme";

export default function Layout() {
  return <Stack screenOptions={{ headerTintColor: ui.ink, headerStyle: { backgroundColor: "#fff" }, contentStyle: { backgroundColor: ui.paper } }} />;
}
