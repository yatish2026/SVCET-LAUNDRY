import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import THEME from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useLaundry } from '../context/LaundryContext';

const TICKET_CATEGORIES = [
  { id: 'app_server', label: 'App Crash / Server Error', icon: 'server-outline', color: '#DC2626' },
  { id: 'laundry_delay', label: 'Laundry Order Delay', icon: 'time-outline', color: '#D97706' },
  { id: 'missing_clothes', label: 'Missing / Mixed Clothes', icon: 'shirt-outline', color: '#7C3AED' },
  { id: 'qr_token', label: 'QR Token & Room Issue', icon: 'qr-code-outline', color: '#2563EB' },
  { id: 'other', label: 'Other Feedback & Help', icon: 'chatbubble-ellipses-outline', color: '#059669' },
];

export const RaiseTicketModal = ({ visible, onClose }) => {
  const { profile } = useAuth();
  const { createTicket } = useLaundry();

  const [category, setCategory] = useState(TICKET_CATEGORIES[0].id);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Compress image before saving
  const compressImage = async (uri) => {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 700 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      return manipResult.base64 ? `data:image/jpeg;base64,${manipResult.base64}` : manipResult.uri;
    } catch (e) {
      return uri;
    }
  };

  const handlePickPhoto = async () => {
    try {
      if (Platform.OS !== 'web') {
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.6,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const compressed = await compressImage(result.assets[0].uri);
        setPhotoUri(compressed);
      }
    } catch (error) {
      Alert.alert('Photo Picker', 'Unable to choose photo.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission', 'Camera access is required.');
          return;
        }
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.6,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const compressed = await compressImage(result.assets[0].uri);
        setPhotoUri(compressed);
      }
    } catch (error) {
      Alert.alert('Camera', 'Unable to capture photo.');
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a short title for your complaint.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Description Required', 'Please explain the issue you are facing.');
      return;
    }

    try {
      setSubmitting(true);
      const selectedCatObj = TICKET_CATEGORIES.find((c) => c.id === category) || TICKET_CATEGORIES[0];

      await createTicket({
        student_name: profile?.full_name || 'Student',
        student_email: profile?.email || '',
        student_id: profile?.student_id || '',
        room_number: profile?.room_number || '',
        hostel_block: profile?.hostel_block || '',
        phone_number: profile?.phone_number || '',
        category: selectedCatObj.label,
        category_id: category,
        title: title.trim(),
        description: description.trim(),
        photo_uri: photoUri,
      });

      setSubmitting(false);
      setTitle('');
      setDescription('');
      setPhotoUri(null);

      if (Platform.OS === 'web') {
        window.alert('✅ Issue Ticket Submitted! The laundry management and tech team have been notified.');
      } else {
        Alert.alert(
          'Ticket Raised Successfully',
          'Your complaint has been submitted to the admin team and logged into the portal.'
        );
      }
      onClose();
    } catch (err) {
      setSubmitting(false);
      Alert.alert('Submission Error', 'Failed to submit ticket. Please try again.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={24} color="#0F172A" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.headerTitle}>Raise an Issue / Ticket</Text>
            <Text style={styles.headerSub}>Report app crashes, server issues, or laundry problems</Text>
          </View>
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          {/* Student Info Card */}
          <View style={styles.studentInfoCard}>
            <Ionicons name="person-circle" size={32} color="#4338CA" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.studentName}>{profile?.full_name || 'Student'}</Text>
              <Text style={styles.studentSub}>
                Roll: {profile?.student_id || 'N/A'} • Room: {profile?.room_number || 'N/A'} ({profile?.hostel_block || 'Hostel'})
              </Text>
            </View>
          </View>

          {/* 1. Category Selector */}
          <Text style={styles.sectionLabel}>Select Issue Category *</Text>
          <View style={styles.categoryList}>
            {TICKET_CATEGORIES.map((cat) => {
              const isSelected = category === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryBtn, isSelected && { borderColor: cat.color, backgroundColor: '#F8FAFC' }]}
                  onPress={() => setCategory(cat.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.catIconWrap, { backgroundColor: cat.color + '18' }]}>
                    <Ionicons name={cat.icon} size={18} color={cat.color} />
                  </View>
                  <Text style={[styles.catText, isSelected && { fontWeight: '800', color: cat.color }]}>
                    {cat.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={18} color={cat.color} style={{ marginLeft: 'auto' }} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 2. Issue Title */}
          <Text style={styles.sectionLabel}>Issue Summary / Subject *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Server crash when booking, or missing blue jacket"
            placeholderTextColor="#94A3B8"
            value={title}
            onChangeText={setTitle}
          />

          {/* 3. Detailed Description */}
          <Text style={styles.sectionLabel}>Detailed Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe what happened with as much detail as possible so the admin team can resolve it quickly..."
            placeholderTextColor="#94A3B8"
            value={description}
            onChangeText={setDescription}
            multiline={true}
            numberOfLines={5}
            textAlignVertical="top"
          />

          {/* 4. Screenshot / Photo Attachment */}
          <Text style={styles.sectionLabel}>Attach Screenshot or Photo Proof (Optional)</Text>
          {photoUri ? (
            <View style={styles.photoPreviewWrap}>
              <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" />
              <TouchableOpacity
                style={styles.removePhotoBtn}
                onPress={() => setPhotoUri(null)}
                activeOpacity={0.8}
              >
                <Ionicons name="trash" size={16} color="#FFF" />
                <Text style={styles.removePhotoText}>Remove Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoActionRow}>
              <TouchableOpacity style={styles.photoBtn} onPress={handlePickPhoto} activeOpacity={0.7}>
                <Ionicons name="images-outline" size={20} color="#4338CA" />
                <Text style={styles.photoBtnText}>Gallery Screenshot</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.photoBtn} onPress={handleTakePhoto} activeOpacity={0.7}>
                <Ionicons name="camera-outline" size={20} color="#4338CA" />
                <Text style={styles.photoBtnText}>Take Camera Photo</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Ionicons name="send" size={18} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.submitBtnText}>Submit Issue Ticket</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  body: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  studentInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    marginBottom: 16,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  studentSub: {
    fontSize: 11.5,
    color: '#4338CA',
    marginTop: 2,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 8,
    marginTop: 10,
  },
  categoryList: {
    gap: 8,
    marginBottom: 8,
  },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  catIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13.5,
    color: '#0F172A',
    marginBottom: 8,
  },
  textArea: {
    minHeight: 110,
    paddingTop: 12,
  },
  photoActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  photoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 6,
  },
  photoBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4338CA',
  },
  photoPreviewWrap: {
    position: 'relative',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  photoPreview: {
    width: '100%',
    height: 180,
  },
  removePhotoBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DC2626',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  removePhotoText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4338CA',
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 10,
    boxShadow: '0 4px 16px rgba(67, 56, 202, 0.3)',
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default RaiseTicketModal;
