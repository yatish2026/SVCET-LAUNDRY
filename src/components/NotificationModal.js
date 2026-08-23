import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../constants/theme';
import { useLaundry } from '../context/LaundryContext';
import { useAuth } from '../context/AuthContext';

export const NotificationModal = ({ visible, onClose, onSelectBooking }) => {
  const { notifications, bookings, markNotificationRead, clearAllNotifications } = useLaundry();
  const { role, profile, isStaff } = useAuth();

  const studentName = profile?.full_name || profile?.email?.split('@')[0] || '';
  const studentPhone = profile?.phone_number || '';
  const myBookingIds = (bookings || [])
    .filter(
      (b) =>
        (studentPhone && b.phone_number === studentPhone) ||
        (studentName && b.student_name && b.student_name.toLowerCase() === studentName.toLowerCase()) ||
        b.student_id === profile?.student_id
    )
    .map((b) => b.id);

  const roleNotifs = notifications.filter((n) => {
    if (isStaff) {
      return n.recipient_role === 'staff' || n.recipient_role === 'all';
    }
    if (n.booking_id) {
      return myBookingIds.includes(n.booking_id);
    }
    return n.recipient_role === 'student' && (!n.target_user_phone || n.target_user_phone === studentPhone);
  });

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return { name: 'checkmark-circle', color: THEME.colors.secondary };
      case 'reminder':
        return { name: 'alarm', color: '#D97706' };
      case 'warning':
        return { name: 'alert-circle', color: THEME.colors.accent };
      default:
        return { name: 'information-circle', color: THEME.colors.primary };
    }
  };

  const handlePressNotif = (notif) => {
    markNotificationRead(notif.id);
    if (notif.booking_id && onSelectBooking) {
      onSelectBooking(notif.booking_id);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <Ionicons name="notifications" size={22} color={THEME.colors.primary} />
              <Text style={styles.headerTitle}>Notifications</Text>
              {roleNotifs.length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{roleNotifs.length}</Text>
                </View>
              )}
            </View>

            <View style={styles.headerActions}>
              {roleNotifs.length > 0 && (
                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={() => clearAllNotifications(role)}
                >
                  <Text style={styles.clearBtnText}>Clear All</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Ionicons name="close" size={22} color={THEME.colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {roleNotifs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={48} color={THEME.colors.textMuted} />
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptySubtitle}>You are all caught up!</Text>
            </View>
          ) : (
            <FlatList
              data={roleNotifs}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const icon = getIcon(item.type);
                return (
                  <TouchableOpacity
                    style={[styles.notifCard, !item.is_read && styles.notifCardUnread]}
                    onPress={() => handlePressNotif(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.notifIconWrap}>
                      <Ionicons name={icon.name} size={22} color={icon.color} />
                    </View>
                    <View style={styles.notifBody}>
                      <View style={styles.notifTop}>
                        <Text style={[styles.notifTitle, !item.is_read && styles.unreadTitle]}>
                          {item.title}
                        </Text>
                        {!item.is_read && <View style={styles.unreadDot} />}
                      </View>
                      <Text style={styles.notifMessage}>{item.message}</Text>
                      <Text style={styles.notifTime}>
                        {new Date(item.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: THEME.colors.surface,
    borderTopLeftRadius: THEME.radius.xl,
    borderTopRightRadius: THEME.radius.xl,
    maxHeight: '80%',
    minHeight: 350,
    paddingTop: THEME.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.xl,
    paddingBottom: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.divider,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: THEME.typography.sizes.lg,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginLeft: 8,
  },
  countBadge: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  countText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearBtn: {
    marginRight: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearBtnText: {
    fontSize: THEME.typography.sizes.xs,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: THEME.spacing.md,
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.md,
    borderRadius: THEME.radius.md,
    marginBottom: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  notifCardUnread: {
    backgroundColor: THEME.colors.primarySoft,
    borderColor: THEME.colors.primaryLight,
  },
  notifIconWrap: {
    marginRight: THEME.spacing.md,
    marginTop: 2,
  },
  notifBody: {
    flex: 1,
  },
  notifTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifTitle: {
    fontSize: THEME.typography.sizes.sm,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '700',
    color: THEME.colors.primaryDark,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.primary,
    marginLeft: 6,
  },
  notifMessage: {
    fontSize: THEME.typography.sizes.xs,
    color: THEME.colors.textSecondary,
    marginTop: 3,
    lineHeight: 18,
  },
  notifTime: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    marginTop: 6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: THEME.typography.sizes.md,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: THEME.typography.sizes.xs,
    color: THEME.colors.textMuted,
    marginTop: 4,
  },
});

export default NotificationModal;
