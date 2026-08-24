import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image as RNImage,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import THEME from '../constants/theme';

/**
 * High-performance image compressor
 * Guarantees every image is tiny (~15KB to 25KB) so Apache/PHP never throw 413 Content Too Large
 */
const compressImage = async (uri) => {
  if (Platform.OS === 'web') {
    return new Promise((resolve) => {
      if (typeof document !== 'undefined' && document.createElement) {
        try {
          const img = document.createElement('img');
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxDim = 360; // Ultra lightweight ~15KB
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
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.35);
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
  } else {
    // Native (Android/iOS) ultra-fast hardware compression via ImageManipulator
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 360 } }],
        {
          compress: 0.35,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );
      if (manipResult.base64) {
        return `data:image/jpeg;base64,${manipResult.base64}`;
      }
      return manipResult.uri;
    } catch (err) {
      console.log('Image manipulation error:', err);
      return uri;
    }
  }
};

export const PhotoUploader = ({
  photos = [],
  onPhotosChange,
  requiredCount = 0,
}) => {
  const pickImagesFromGallery = async () => {
    try {
      if (Platform.OS !== 'web') {
        try {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            console.log('Media library permission status:', status);
          }
        } catch (permErr) {
          console.log('Permission request warning:', permErr);
        }
      }

      let result;
      try {
        // Attempt launch with multiple selection support
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsMultipleSelection: true,
          quality: 0.35,
          base64: false,
        });
      } catch (multiErr) {
        console.log('Multi-selection fallback triggered:', multiErr);
        // Fallback for custom Android OEM ROMs (MIUI, ColorOS, FunTouch)
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsMultipleSelection: false,
          quality: 0.35,
          base64: false,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const processedList = await Promise.all(
          result.assets.map(async (asset) => {
            const compressedDataUri = await compressImage(asset.uri);
            return {
              uri: compressedDataUri,
              base64: compressedDataUri,
            };
          })
        );

        onPhotosChange([...photos, ...processedList]);
      }
    } catch (error) {
      console.log('Error picking images:', error);
      Alert.alert(
        'Gallery Permission',
        'Please allow Photo & Storage permissions for DhobiX in Phone Settings -> Apps -> DhobiX -> Permissions.'
      );
    }
  };

  const takePhotoWithCamera = async () => {
    try {
      if (Platform.OS !== 'web') {
        try {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert(
              'Camera Permission Needed',
              'Please allow Camera permission for DhobiX in Phone Settings -> Apps -> DhobiX -> Permissions to take clothes photos.'
            );
            return;
          }
        } catch (permErr) {
          console.log('Camera permission warning:', permErr);
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.35,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const compressedDataUri = await compressImage(asset.uri);
        const newPhoto = {
          uri: compressedDataUri,
          base64: compressedDataUri,
        };

        onPhotosChange([...photos, newPhoto]);
      }
    } catch (error) {
      console.log('Error taking photo:', error);
      Alert.alert(
        'Camera Permission',
        'Please allow Camera permission for DhobiX in Phone Settings -> Apps -> DhobiX -> Permissions.'
      );
    }
  };

  const removePhoto = (indexToRemove) => {
    const updated = photos.filter((_, idx) => idx !== indexToRemove);
    onPhotosChange(updated);
  };

  const isCountMatched = requiredCount > 0 && photos.length === requiredCount;

  return (
    <View style={styles.container}>
      {/* Action Buttons Row */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionBtnPrimary}
          onPress={pickImagesFromGallery}
          activeOpacity={0.85}
        >
          <Ionicons name="images" size={18} color="#FFF" />
          <Text style={styles.actionBtnTextPrimary}>Upload from Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtnSecondary}
          onPress={takePhotoWithCamera}
          activeOpacity={0.85}
        >
          <Ionicons name="camera" size={18} color="#4338CA" />
          <Text style={styles.actionBtnTextSecondary}>Take Photo</Text>
        </TouchableOpacity>
      </View>

      {/* Thumbnails Strip */}
      {photos.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbnailsScroll}
        >
          {photos.map((photo, index) => (
            <View key={index} style={styles.thumbnailWrap}>
              <RNImage source={{ uri: photo.uri }} style={styles.thumbnail} resizeMode="cover" />
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

      {/* Friendly photo helper note */}
      <Text style={styles.hintText}>
        📸 Upload photos of your clothes bag for instant counter verification (Unlimited).
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  actionBtnPrimary: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4338CA',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
  },
  actionBtnTextPrimary: {
    color: '#FFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  actionBtnSecondary: {
    flex: 0.9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    gap: 6,
  },
  actionBtnTextSecondary: {
    color: '#4338CA',
    fontSize: 12.5,
    fontWeight: '800',
  },
  thumbnailsScroll: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 6,
  },
  thumbnailWrap: {
    width: 76,
    height: 76,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F1F5F9',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexTag: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: 5,
  },
  indexTagText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  hintText: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '600',
    marginTop: 6,
  },
});

export default PhotoUploader;
