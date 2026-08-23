import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import THEME from '../constants/theme';

// Helper function to compress ANY image to a tiny thumbnail (~20KB)
const compressImageUri = (uri) => {
  return new Promise((resolve) => {
    if (typeof document !== 'undefined') {
      try {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 380; // Crisp, perfectly clear on mobile yet only ~20KB!
          let width = img.width || maxDim;
          let height = img.height || maxDim;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.45);
          resolve(compressedDataUrl);
        };
        img.onerror = () => resolve(uri);
        img.src = uri;
      } catch (e) {
        resolve(uri);
      }
    } else {
      resolve(uri);
    }
  });
};

export const PhotoUploader = ({
  photos = [],
  onPhotosChange,
  requiredCount = 0,
}) => {
  const pickImagesFromGallery = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Needed',
            'Please allow access to your photo gallery to upload clothes photos.'
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.3,
        base64: false, // Don't create huge raw base64; we compress via canvas
      });

      if (!result.canceled && result.assets) {
        const processedList = await Promise.all(
          result.assets.map(async (asset) => {
            const compressed = await compressImageUri(asset.uri);
            return {
              uri: asset.uri,
              base64: compressed, // Always use the lightweight 20KB compressed version
            };
          })
        );

        onPhotosChange([...photos, ...processedList]);
      }
    } catch (error) {
      console.log('Error picking images:', error);
      Alert.alert('Image Picker', 'Unable to open gallery.');
    }
  };

  const takePhotoWithCamera = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Needed',
            'Please allow access to your camera to take clothes photos.'
          );
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.3,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const compressed = await compressImageUri(asset.uri);
        const newPhoto = {
          uri: asset.uri,
          base64: compressed,
        };

        onPhotosChange([...photos, newPhoto]);
      }
    } catch (error) {
      console.log('Error taking photo:', error);
    }
  };

  const removePhoto = (indexToRemove) => {
    const updated = photos.filter((_, idx) => idx !== indexToRemove);
    onPhotosChange(updated);
  };

  const isCountMatched = requiredCount > 0 && photos.length === requiredCount;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Upload Clothes Photos *</Text>
          <Text style={styles.subtitle}>
            Select multiple photos from gallery showing all {requiredCount} items
          </Text>
        </View>

        {/* Live Match Indicator */}
        <View
          style={[
            styles.countBadge,
            isCountMatched ? styles.countBadgeMatch : styles.countBadgeMismatch,
          ]}
        >
          <Ionicons
            name={isCountMatched ? 'checkmark-circle' : 'alert-circle'}
            size={13}
            color={isCountMatched ? '#059669' : '#D97706'}
          />
          <Text
            style={[
              styles.countBadgeText,
              { color: isCountMatched ? '#065F46' : '#92400E' },
            ]}
          >
            {photos.length} / {requiredCount} Photos
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={styles.actionBtnPrimary}
          onPress={pickImagesFromGallery}
          activeOpacity={0.8}
        >
          <Ionicons name="images" size={18} color="#FFF" />
          <Text style={styles.actionBtnTextPrimary}>Select Multiple from Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtnSecondary}
          onPress={takePhotoWithCamera}
          activeOpacity={0.8}
        >
          <Ionicons name="camera" size={18} color="#1E40AF" />
          <Text style={styles.actionBtnTextSecondary}>Camera</Text>
        </TouchableOpacity>
      </View>

      {/* Thumbnails Grid */}
      {photos.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbnailsScroll}
        >
          {photos.map((photo, index) => (
            <View key={index} style={styles.thumbnailWrap}>
              <Image source={{ uri: photo.uri }} style={styles.thumbnail} resizeMode="cover" />
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => removePhoto(index)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={14} color="#FFF" />
              </TouchableOpacity>
              <View style={styles.indexTag}>
                <Text style={styles.indexTagText}>#{index + 1}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Helper validation note */}
      {requiredCount > 0 && photos.length !== requiredCount && (
        <Text style={styles.hintText}>
          💡 Please add {Math.abs(requiredCount - photos.length)} more photo(s) to match the {requiredCount} clothes entered.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    ...THEME.shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  countBadgeMatch: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  countBadgeMismatch: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  actionBtnPrimary: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    paddingVertical: 10,
    gap: 6,
  },
  actionBtnTextPrimary: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 4,
  },
  actionBtnTextSecondary: {
    color: '#1E40AF',
    fontSize: 11,
    fontWeight: '700',
  },
  thumbnailsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  thumbnailWrap: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexTag: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  indexTagText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '800',
  },
  hintText: {
    fontSize: 10,
    color: '#D97706',
    marginTop: 6,
    fontWeight: '600',
  },
});

export default PhotoUploader;
