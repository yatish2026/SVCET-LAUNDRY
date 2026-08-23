-- ====================================================================
-- College Hostel Laundry Booking & Slot Management System
-- Supabase SQL Schema Setup Script (Year-wise Schedule Model)
-- ====================================================================

-- 1. Profiles Table (Students & Staff)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'staff', 'admin')),
  academic_year TEXT NOT NULL DEFAULT '1st Year' CHECK (academic_year IN ('1st Year', '2nd Year', '3rd Year', '4th Year')),
  hostel_block TEXT NOT NULL,
  room_number TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  student_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Laundry Bookings Table (Direct Confirmation & Automatic +2 Days Pickup)
CREATE TABLE IF NOT EXISTS public.laundry_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name TEXT NOT NULL,
  student_id TEXT,
  academic_year TEXT NOT NULL DEFAULT '1st Year',
  hostel_block TEXT NOT NULL,
  room_number TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_items INT NOT NULL DEFAULT 0,
  special_instructions TEXT,
  status TEXT NOT NULL DEFAULT 'dropoff_scheduled' CHECK (
    status IN (
      'dropoff_scheduled',
      'in_wash',
      'drying_ironing',
      'ready_for_pickup',
      'completed',
      'cancelled'
    )
  ),
  dropoff_slot_time TEXT,
  pickup_slot_time TEXT,
  pickup_token TEXT,
  counter_number TEXT DEFAULT 'Counter 1',
  notes_by_staff TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.laundry_bookings(id) ON DELETE CASCADE,
  recipient_role TEXT NOT NULL CHECK (recipient_role IN ('student', 'staff', 'all')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'reminder')),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Realtime Replication
ALTER PUBLICATION supabase_realtime ADD TABLE public.laundry_bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
