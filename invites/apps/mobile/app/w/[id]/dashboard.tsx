import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { api } from "../../../lib/api";
import { Card, Muted } from "../../../components/ui";
import { ui } from "../../../lib/theme";

type D = { totals: Record<string, number>; fns: { id: string; title: string; yes: number; pending: number; adults: number; kids: number; food: Record<string, number> }[] };

export default function Dashboard() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [d, setD] = useState<D | null>(null);
  useFocusEffect(useCallback(() => { void api(`/api/studio/weddings/${id}/summary`).then((r) => r.ok && setD(r.dashboard)); }, [id]));
  return (
    <ScrollView style={{ backgroundColor: ui.paper }} contentContainerStyle={{ padding: 16, gap: 10 }}>
      <Stack.Screen options={{ title: "Dashboard" }} />
      {d && <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{Object.entries(d.totals).map(([k, v]) => <View key={k} style={{ width: "48%" }}><Card><Muted>{k}</Muted><Text style={{ fontSize: 26, fontWeight: "800" }}>{v}</Text></Card></View>)}</View>}
      {d?.fns.map((f) => <Card key={f.id}><Text style={{ fontWeight: "700", fontSize: 16 }}>{f.title}</Text><Muted>{f.yes} coming · {f.pending} pending</Muted><Text>{f.adults} adults · {f.kids} kids · veg {f.food.veg} · jain {f.food.jain} · non-veg {f.food["non-veg"]}</Text></Card>)}
    </ScrollView>
  );
}
