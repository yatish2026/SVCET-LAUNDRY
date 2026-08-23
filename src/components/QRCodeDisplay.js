import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

/**
 * Universal High-Resolution QR Code Display Component
 * Works seamlessly across Web, iOS, Android, and standalone APKs
 */
export const QRCodeDisplay = ({
  value,
  size = 170,
  token = '',
  studentName = '',
  showTokenLabel = true,
}) => {
  const qrPayload = typeof value === 'string' ? value : JSON.stringify(value);

  // Fast, high-contrast QR code image URI with error correction level M
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size * 2}x${size * 2}&data=${encodeURIComponent(
    qrPayload
  )}&margin=2&color=1E1B4B&bgcolor=FFFFFF&format=png`;

  return (
    <View style={styles.container}>
      <View style={[styles.qrBox, { width: size + 24, height: size + 24 }]}>
        <Image
          source={{ uri: qrImageUrl }}
          style={{ width: size, height: size, borderRadius: 10 }}
          resizeMode="contain"
        />
      </View>

      {showTokenLabel && token ? (
        <View style={styles.tokenTag}>
          <Text style={styles.tokenTagLabel}>PICKUP PASS TOKEN</Text>
          <Text style={styles.tokenTagValue}>#{token}</Text>
          {studentName ? (
            <Text style={styles.studentNameSub}>{studentName}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  qrBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  tokenTag: {
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#EEF2FF',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  tokenTagLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4338CA',
    letterSpacing: 0.8,
  },
  tokenTagValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1E1B4B',
    marginTop: 1,
    letterSpacing: 1,
  },
  studentNameSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
});

export default QRCodeDisplay;
