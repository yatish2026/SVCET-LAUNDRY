import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../../constants/theme';
import { CLOTHES_CATEGORIES, MAX_ITEMS_PER_LOAD } from '../../constants/categories';
import { getYearConfig } from '../../constants/schedule';
import { useAuth } from '../../context/AuthContext';
import { useLaundry } from '../../context/LaundryContext';
import ClothesCounter from '../../components/ClothesCounter';
import PhotoUploader from '../../components/PhotoUploader';
import OrderConfirmedModal from '../../components/OrderConfirmedModal';

export const NewBookingScreen = ({ onBack, onBookingCreated }) => {
  const { profile } = useAuth();
  const { createBooking, isLoading } = useLaundry();

  const studentName = profile?.full_name || profile?.email?.split('@')[0] || 'Student';
  const studentPhone = profile?.phone_number || '+91 99999 00000';
  const studentBlock = profile?.hostel_block || 'Block A (Boys Hostel)';
  const studentRoom = profile?.room_number || 'TBD';
  const studentRollNo = profile?.student_id || '';
  const studentYear = profile?.academic_year || '1st Year';

  const yearConfig = getYearConfig(studentYear);

  const [activeCategory, setActiveCategory] = useState(CLOTHES_CATEGORIES[0].id);
  const [selectedItems, setSelectedItems] = useState({});
  const [photos, setPhotos] = useState([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Calculate total items selected
  const totalItemsCount = Object.values(selectedItems).reduce((sum, val) => sum + (val || 0), 0);

  const handleIncrement = (itemId) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }));
  };

  const handleDecrement = (itemId) => {
    setSelectedItems((prev) => {
      const current = prev[itemId] || 0;
      if (current <= 1) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: current - 1 };
    });
  };

  const currentCategoryObj =
    CLOTHES_CATEGORIES.find((c) => c.id === activeCategory) || CLOTHES_CATEGORIES[0];

  const handleSubmit = async () => {
    if (totalItemsCount === 0) {
      Alert.alert('No Items Selected', 'Please add at least 1 clothing item to your laundry bag.');
      return;
    }

    try {
      const newBooking = await createBooking({
        user_id: profile?.id || '',
        student_email: profile?.email || '',
        student_name: studentName,
        student_id: studentRollNo || 'SVCET-STD',
        academic_year: studentYear,
        hostel_block: studentBlock,
        room_number: studentRoom,
        phone_number: studentPhone,
        items: selectedItems,
        total_items: totalItemsCount,
        photos: photos.map((p) => p.base64 || p.uri),
        dropoff_slot_time: `${yearConfig.dropoffDay} (${yearConfig.dropoffSlot})`,
        pickup_slot_time: `${yearConfig.pickupDay} (Guaranteed Pickup after 2 days)`,
        counter_number: 'Counter 1',
        special_instructions: specialInstructions.trim(),
      });

      setConfirmedBooking(newBooking);
      setShowConfirmModal(true);
    } catch (e) {
      console.error('Submission Error:', e);
      const errMsg = e?.message || 'Failed to save your booking. Please check your connection.';
      if (Platform.OS === 'web') {
        window.alert(`Submission Error: ${errMsg}`);
      } else {
        Alert.alert('Submission Error', errMsg);
      }
    }
  };

  const handleModalClose = () => {
    setShowConfirmModal(false);
    onBookingCreated(confirmedBooking?.id);
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color={THEME.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>New Laundry Request</Text>
          <Text style={styles.headerSub}>{studentYear} • Drop-off on {yearConfig.dropoffDay}</Text>
        </View>
        <View style={styles.headerYearBadge}>
          <Text style={styles.headerYearBadgeText}>{studentYear}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Year-Based Schedule Confirmation Box */}
        <View style={styles.scheduleCard}>
          <View style={styles.scheduleCardHeader}>
            <Ionicons name="calendar" size={18} color="#1D4ED8" />
            <Text style={styles.scheduleCardTitle}>Assigned College Schedule</Text>
          </View>

          <View style={styles.scheduleTimeline}>
            <View style={styles.timelinePoint}>
              <Text style={styles.timelineLabel}>DROP-OFF DAY</Text>
              <Text style={styles.timelineDay}>Every {yearConfig.dropoffDay}</Text>
              <Text style={styles.timelineDesc}>Desk Counter 1</Text>
            </View>

            <View style={styles.timelineConnector}>
              <Text style={styles.timelineDaysTag}>+ 2 DAYS</Text>
              <View style={styles.timelineLine} />
              <Ionicons name="chevron-forward" size={14} color="#60A5FA" />
            </View>

            <View style={styles.timelinePoint}>
              <Text style={[styles.timelineLabel, { color: '#059669' }]}>COLLECT PICKUP</Text>
              <Text style={[styles.timelineDay, { color: '#059669' }]}>
                Every {yearConfig.pickupDay}
              </Text>
              <Text style={styles.timelineDesc}>Clean & Pressed</Text>
            </View>
          </View>
        </View>

        {/* Section 1: Clothes Builder */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>1. Select Clothes</Text>
            <View style={styles.itemCounterBadge}>
              <Text style={styles.itemCounterText}>
                {totalItemsCount} pieces selected
              </Text>
            </View>
          </View>

          {/* Category Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryTabs}
          >
            {CLOTHES_CATEGORIES.map((cat) => {
              const isActive = cat.id === activeCategory;
              const catCount = cat.items.reduce(
                (sum, item) => sum + (selectedItems[item.id] || 0),
                0
              );
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catTab, isActive && styles.catTabActive]}
                  onPress={() => setActiveCategory(cat.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.catTabEmoji}>{cat.emoji}</Text>
                  <Text
                    style={[styles.catTabLabel, isActive && styles.catTabLabelActive]}
                  >
                    {cat.name}
                  </Text>
                  {catCount > 0 && (
                    <View style={styles.catBadge}>
                      <Text style={styles.catBadgeText}>{catCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Items Counter List */}
          <View style={styles.itemsList}>
            {currentCategoryObj.items.map((item) => (
              <ClothesCounter
                key={item.id}
                item={item}
                count={selectedItems[item.id] || 0}
                onIncrement={() => handleIncrement(item.id)}
                onDecrement={() => handleDecrement(item.id)}
                canIncrement={true}
              />
            ))}
          </View>
        </View>

        {/* Section 2: Photo Uploader with Quantity Match */}
        <PhotoUploader
          photos={photos}
          onPhotosChange={setPhotos}
          requiredCount={totalItemsCount}
        />

        {/* Section 3: Special Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Wash Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="e.g. Cold wash formal shirt, delicate spin..."
            placeholderTextColor={THEME.colors.textMuted}
            multiline
            numberOfLines={2}
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
          />
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Submission Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Student & Year:</Text>
            <Text style={styles.summaryValue}>{studentName} ({studentYear})</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Hostel & Room:</Text>
            <Text style={styles.summaryValue}>
              {studentBlock?.split(' ')[0]} • Rm {studentRoom}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Clothes:</Text>
            <Text style={[styles.summaryValue, { fontWeight: '800', color: '#1D4ED8' }]}>
              {totalItemsCount} pieces
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Attached Photos:</Text>
            <Text
              style={[
                styles.summaryValue,
                {
                  fontWeight: '800',
                  color: photos.length === totalItemsCount && totalItemsCount > 0 ? '#059669' : '#D97706',
                },
              ]}
            >
              {photos.length} photos {photos.length === totalItemsCount && totalItemsCount > 0 ? '✅' : '⚠️'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarInfo}>
          <Text style={styles.bottomTotalLabel}>Total Bag Items</Text>
          <Text style={styles.bottomTotalCount}>
            {totalItemsCount} <Text style={{ fontSize: 11, fontWeight: '500' }}>pieces</Text>
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.submitBtn,
            (totalItemsCount === 0 || photos.length !== totalItemsCount || isLoading) &&
              styles.submitBtnDisabled,
          ]}
          onPress={handleSubmit}
          disabled={totalItemsCount === 0 || photos.length !== totalItemsCount || isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.submitBtnText}>Submit for Approval</Text>
              <Ionicons name="cloud-upload" size={18} color="#FFF" style={{ marginLeft: 6 }} />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Success Popup Modal */}
      <OrderConfirmedModal
        visible={showConfirmModal}
        booking={confirmedBooking}
        onClose={handleModalClose}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 10,
    paddingHorizontal: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  headerSub: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
  },
  headerYearBadge: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  headerYearBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: THEME.spacing.md,
    paddingBottom: 90,
  },
  scheduleCard: {
    backgroundColor: '#FFF',
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...THEME.shadows.sm,
  },
  scheduleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scheduleCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginLeft: 6,
  },
  scheduleTimeline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: THEME.radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timelinePoint: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  timelineDay: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginTop: 1,
  },
  timelineDesc: {
    fontSize: 10,
    color: THEME.colors.textSecondary,
    marginTop: 1,
  },
  timelineConnector: {
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  timelineDaysTag: {
    fontSize: 8,
    fontWeight: '800',
    color: '#60A5FA',
    marginBottom: 2,
  },
  timelineLine: {
    width: 20,
    height: 1,
    backgroundColor: '#BFDBFE',
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...THEME.shadows.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  itemCounterBadge: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  itemCounterBadgeFull: {
    backgroundColor: '#FFE4E6',
    borderColor: '#FECDD3',
  },
  itemCounterText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  itemCounterTextFull: {
    color: '#E11D48',
  },
  categoryTabs: {
    paddingVertical: 4,
    gap: 8,
    marginBottom: 12,
  },
  catTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: THEME.radius.full,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catTabActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  catTabEmoji: {
    fontSize: 13,
    marginRight: 4,
  },
  catTabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  catTabLabelActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  catBadge: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    paddingHorizontal: 4,
  },
  catBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  itemsList: {
    gap: 8,
  },
  notesInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: THEME.radius.md,
    padding: 10,
    fontSize: 12,
    color: THEME.colors.textPrimary,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 6,
    minHeight: 50,
  },
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  summaryLabel: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
  },
  summaryValue: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    ...THEME.shadows.md,
  },
  bottomBarInfo: {
    flex: 1,
  },
  bottomTotalLabel: {
    fontSize: 10,
    color: THEME.colors.textSecondary,
  },
  bottomTotalCount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E40AF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: THEME.radius.lg,
    ...THEME.shadows.sm,
  },
  submitBtnDisabled: {
    opacity: 0.5,
    backgroundColor: '#64748B',
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
});

export default NewBookingScreen;
