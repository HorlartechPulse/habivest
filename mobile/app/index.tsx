import { View, Text, StyleSheet } from "react-native";

export default function Home() {
  return (
    <View style={s.c}>
      <Text style={s.logo}>Habivest</Text>
      <Text style={s.tag}>Find a place. Build a life.</Text>
      <Text style={s.body}>
        Mobile shell for property search, applications, leases, and rent payments
        against the Habivest API. Fictional data · not a licensed broker.
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, padding: 24, justifyContent: "center", backgroundColor: "#f8fafc" },
  logo: { fontSize: 28, fontWeight: "800", color: "#14532d" },
  tag: { marginTop: 8, color: "#16a34a", fontSize: 15 },
  body: { marginTop: 16, color: "#64748b", lineHeight: 22, fontSize: 14 },
});
