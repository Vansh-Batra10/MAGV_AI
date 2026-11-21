import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from "react-native";
import { ui } from "../lib/theme";

export const Screen = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => <View style={[s.screen, style]}>{children}</View>;
export const H1 = ({ children }: { children: React.ReactNode }) => <Text style={s.h1}>{children}</Text>;
export const Muted = ({ children }: { children: React.ReactNode }) => <Text style={s.muted}>{children}</Text>;
export const Card = ({ children }: { children: React.ReactNode }) => <View style={s.card}>{children}</View>;
export function Button({ title, onPress, primary, disabled, testID }: { title: string; onPress: () => void; primary?: boolean; disabled?: boolean; testID?: string }) {
  return <Pressable testID={testID} accessibilityRole="button" onPress={onPress} disabled={disabled} style={[s.btn, primary && s.primary, disabled && { opacity: 0.5 }]}><Text style={[s.btnText, primary && { color: "#fff" }]}>{title}</Text></Pressable>;
}
export const Field = (p: TextInputProps & { label: string }) => <View style={{ gap: 4 }}><Text style={s.label}>{p.label}</Text><TextInput {...p} style={s.input} placeholderTextColor={ui.inkSoft} /></View>;

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: ui.paper, padding: 16, gap: 12 },
  h1: { fontSize: 24, fontWeight: "700", color: ui.ink },
  muted: { color: ui.inkSoft, fontSize: 14 },
  card: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: ui.line, padding: 14, gap: 6 },
  btn: { minHeight: 46, borderRadius: 12, borderWidth: 1, borderColor: ui.line, alignItems: "center", justifyContent: "center", paddingHorizontal: 14, backgroundColor: "#fff" },
  primary: { backgroundColor: ui.accent, borderColor: ui.accent },
  btnText: { fontWeight: "700", color: ui.ink, fontSize: 15 },
  label: { fontWeight: "600", color: ui.ink },
  input: { minHeight: 46, borderWidth: 1, borderColor: ui.line, borderRadius: 12, paddingHorizontal: 12, fontSize: 16, backgroundColor: "#fff", color: ui.ink },
});
