import { useState } from "react";
import { Text } from "react-native";
import { router, Stack } from "expo-router";
import { api } from "../lib/api";
import { Button, Field, H1, Muted, Screen } from "../components/ui";

/** Welcome → phone OTP. */
export default function Login() {
  const [phone, setPhone] = useState("+91");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [mock, setMock] = useState<string | null>(null);
  const [err, setErr] = useState("");
  return (
    <Screen style={{ justifyContent: "center" }}>
      <Stack.Screen options={{ headerShown: false }} />
      <H1>Your wedding, one beautiful link</H1>
      <Muted>Log in with your phone. No password.</Muted>
      <Field label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" editable={!sent} testID="phone" />
      {sent && <Field label="6-digit code" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} testID="code" />}
      {mock && <Muted>Mock mode code: {mock}</Muted>}
      {!!err && <Text style={{ color: "#b3261e" }}>{err}</Text>}
      <Button primary testID="submit" title={sent ? "Verify" : "Send code"} onPress={async () => {
        setErr("");
        if (!sent) { const r = await api("/api/auth/otp", { method: "POST", body: { phone } }); if (!r.ok) return setErr(r.error ?? "Could not send"); setSent(true); setMock(r.mockCode ?? null); }
        else { const r = await api("/api/auth/verify", { method: "POST", body: { phone, code } }); if (!r.ok) return setErr("That code didn't match"); router.replace("/weddings"); }
      }} />
    </Screen>
  );
}
