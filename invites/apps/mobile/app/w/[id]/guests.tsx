import { useCallback, useState } from "react";
import { Alert, FlatList, Text, View } from "react-native";
import * as Contacts from "expo-contacts";
import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { api } from "../../../lib/api";
import { Button, Card, Field, Muted, Screen } from "../../../components/ui";

type G = { id: string; salutation: string; phone?: string; sentAt?: string; firstOpenedAt?: string; replied?: boolean };

export default function Guests() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [guests, setGuests] = useState<G[]>([]);
  const [paste, setPaste] = useState("");
  const load = useCallback(() => api(`/api/studio/weddings/${id}/summary`).then((r) => r.ok && setGuests(r.guests)), [id]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const fromContacts = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== "granted") return;
    const { data } = await Contacts.getContactsAsync({ fields: [Contacts.Fields.PhoneNumbers] });
    // A real picker UI lets the couple tick contacts; v1 imports those marked as favourites/starred first.
    const lines = data.filter((c) => c.phoneNumbers?.[0]?.number).slice(0, 50).map((c) => `${c.name}, ${c.phoneNumbers![0]!.number}`).join("\n");
    setPaste(lines);
  };
  return (
    <Screen>
      <Stack.Screen options={{ title: "Guests" }} />
      <Field label='Paste "Name, phone" per line' value={paste} onChangeText={setPaste} multiline style={{ minHeight: 90 }} />
      <View style={{ flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 1 }}><Button title="From contacts" onPress={fromContacts} /></View>
        <View style={{ flex: 1 }}><Button primary title="Add" disabled={!paste.trim()} onPress={async () => { const r = await api(`/api/studio/weddings/${id}/guests`, { method: "POST", body: { paste } }); Alert.alert(r.ok ? `Added ${r.added}` : r.error); setPaste(""); void load(); }} /></View>
      </View>
      <FlatList data={guests} keyExtractor={(g) => g.id} contentContainerStyle={{ gap: 8 }} renderItem={({ item }) => (
        <Card><Text style={{ fontWeight: "700" }}>{item.salutation}</Text><Muted>{[item.phone, item.sentAt ? "sent" : "not sent", item.firstOpenedAt ? "opened" : "", item.replied ? "replied" : ""].filter(Boolean).join(" · ")}</Muted></Card>
      )} />
    </Screen>
  );
}
