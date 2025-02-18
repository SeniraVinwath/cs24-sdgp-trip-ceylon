import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import QRScanner from "../components/QRScanner";

const QRScanScreen = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan your QR code</Text>

      {/* QR Scanner Component */}
      <QRScanner onScanSuccess={(data) => router.push(`/ProcessingScreen?id=${data}`)} />

      <Text style={styles.orText}>Scanning...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center" },
  title: { color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 20 },
  orText: { color: "#fff", fontSize: 18, marginTop: 20 },
});

export default QRScanScreen;