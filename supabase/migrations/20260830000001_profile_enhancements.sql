-- Add doctor and clinic details to user_profiles table

ALTER TABLE public.user_profiles 
ADD COLUMN doctor_name TEXT,
ADD COLUMN clinic_name TEXT,
ADD COLUMN doctor_email TEXT,
ADD COLUMN doctor_whatsapp TEXT;

-- These fields will store AES encrypted strings from the application side.
-- Therefore, their type is TEXT.
