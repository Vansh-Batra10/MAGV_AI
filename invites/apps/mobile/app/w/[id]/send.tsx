import { useCallback, useState } from "react";
import { Linking, Share, Text } from "react-native";
import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { api, API } from "../../../lib/api";
import { Button, Card, Muted, Screen } from "../../../components/ui";

type G = { id: string; salutation: string; phone?: string; guestCode: string; locale: string; tone: string; sentAt?: string };

/** v1 send queue: one guest at a time, opens WhatsApp with their personal link, marks sent on return. */
export default function Send() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<{ guests: G[]; wedding: { inviteCode: string; content: { bride: { name: string }; groom: { name: string } } }; appUrl: string } | null>(null);
  const load = useCallback(() => api(`/api/studio/weddings/${id}/summary`).then((r) => r.ok && setData(r)), [id]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  if (!data) return <Screen><Muted>Loading…</Muted></Screen>;
  const g = data.guests.find((x) => !x.sentAt);
  if (!g) return <Screen><Text style={{ fontSize: 18 }}>Everyone has their invite. 🎉</Text></Screen>;
  const link = `${data.appUrl || API}/${data.wedding.inviteCode}/${g.guestCode}`;
  const names = `${data.wedding.content.bride.name} & ${data.wedding.content.groom.name}`;
  const text = g.locale === "en" ? `Dear ${g.salutation},\nWe warmly invite you to the wedding of ${names}.\nYour invitation:\n${link}` : `${g.salutation}, aapko saadar nimantran 🙏\n${names} ki shaadi mein aapka intezaar rahega.\n${link}`;
  const done = async () => { await api(`/api/studio/weddings/${id}/sent/${g.id}`, { method: "POST" }); void load(); };
  return (
    <Screen>
      <Stack.Screen options={{ title: "Send queue" }} />
      <Muted>{data.guests.filter((x) => !x.sentAt).length} left</Muted>
      <Card><Text style={{ fontSize: 18, fontWeight: "700" }}>{g.salutation}</Text><Text>{text}</Text></Card>
      <Button primary title="Send on WhatsApp" onPress={async () => { await Linking.openURL(`https://wa.me/${(g.phone ?? "").replace(/\D/g, "")}?text=${encodeURIComponent(text)}`); await done(); }} />
      <Button title="Share…" onPress={async () => { await Share.share({ message: text }); await done(); }} />
      <Button title="SMS" onPress={async () => { await Linking.openURL(`sms:${g.phone ?? ""}?body=${encodeURIComponent(text)}`); await done(); }} />
    </Screen>
  );
}
