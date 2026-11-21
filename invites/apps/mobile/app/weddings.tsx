import { useCallback, useState } from "react";
import { FlatList, Pressable, Text } from "react-native";
import { router, Stack, useFocusEffect } from "expo-router";
import { api, flushQueue } from "../lib/api";
import { registerPush } from "../lib/push";
import { Button, Card, Muted, Screen } from "../components/ui";

type W = { id: string; names: string; templateId: string; status: string; tier: string };

export default function Weddings() {
  const [ws, setWs] = useState<W[]>([]);
  useFocusEffect(useCallback(() => { void flushQueue(); void registerPush(); api("/api/studio/weddings").then((r) => r.ok && setWs(r.weddings)); }, []));
  return (
    <Screen>
      <Stack.Screen options={{ title: "Your invites" }} />
      <Button primary title="+ Create your invite" onPress={() => router.push({ pathname: "/w/[id]/web", params: { id: "new", path: "/studio/new" } })} />
      <FlatList data={ws} keyExtractor={(w) => w.id} contentContainerStyle={{ gap: 10 }} renderItem={({ item }) => (
        <Pressable onPress={() => router.push({ pathname: "/w/[id]", params: { id: item.id } })}><Card><Text style={{ fontSize: 17, fontWeight: "700" }}>{item.names}</Text><Muted>{item.templateId} · {item.status} · {item.tier}</Muted></Card></Pressable>
      )} />
    </Screen>
  );
}
