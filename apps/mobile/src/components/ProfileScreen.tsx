import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { User, Mail, Phone, Lock, Save } from 'lucide-react-native';
import { useTheme, getTheme } from '../utils/ThemeContext';
import { encryptData, decryptData } from '../utils/encryption';
import type { SupabaseClient } from '@supabase/supabase-js';
import { COLORS, SHADOWS } from '../utils/theme';

interface ProfileScreenProps {
  supabase: SupabaseClient;
  userId: string | undefined;
  userEmail: string | undefined;
  onSignOut: () => void;
}

export function ProfileScreen({ supabase, userId, userEmail, onSignOut }: ProfileScreenProps) {
  const { dark } = useTheme();
  const t = getTheme(dark);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [profile, setProfile] = useState({
    id: 'user_demo', // Using demo ID for continuity
    height_cm: '',
    weight_kg: '',
    shoe_size: '',
    doctor_name: '',
    clinic_name: '',
    doctor_email: '',
    doctor_whatsapp: '',
  });

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', profile.id)
        .single();
      
      if (data) {
        setProfile({
          id: data.id,
          height_cm: data.height_cm?.toString() || '',
          weight_kg: data.weight_kg?.toString() || '',
          shoe_size: data.shoe_size?.toString() || '',
          doctor_name: decryptData(data.doctor_name || ''),
          clinic_name: decryptData(data.clinic_name || ''),
          doctor_email: decryptData(data.doctor_email || ''),
          doctor_whatsapp: decryptData(data.doctor_whatsapp || ''),
        });
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        id: profile.id,
        height_cm: profile.height_cm ? Number(profile.height_cm) : null,
        weight_kg: profile.weight_kg ? Number(profile.weight_kg) : null,
        shoe_size: profile.shoe_size ? Number(profile.shoe_size) : null,
        doctor_name: encryptData(profile.doctor_name),
        clinic_name: encryptData(profile.clinic_name),
        doctor_email: encryptData(profile.doctor_email),
        doctor_whatsapp: encryptData(profile.doctor_whatsapp),
      });

    setSaving(false);
    if (!error) {
      Alert.alert('Success', 'Profile securely saved with End-to-End Encryption!');
    } else {
      Alert.alert('Error', 'Failed to save profile.');
    }
  };

  if (loading) {
    return <Text style={styles.emptyText}>Loading Profile...</Text>;
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: t.page }]} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={[styles.header, { borderBottomColor: t.border }]}>
        <View>
          <Text style={[styles.title, { color: t.ink.primary }]}>Patient Profile</Text>
          <View style={[styles.encryptedBadge, { backgroundColor: t.status.goodBg }]}>
            <Lock color={t.status.good} size={12} style={{ marginRight: 4 }} />
            <Text style={[styles.encryptedText, { color: t.status.good }]}>AES-256 Encrypted</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: t.accent.teal }]} onPress={handleSave} disabled={saving}>
          <Save color="#FFF" size={16} style={{ marginRight: 6 }} />
          <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>
        <View style={styles.cardHeader}>
          <User color={t.accent.teal} size={18} style={{ marginRight: 8 }} />
          <Text style={[styles.cardTitle, { color: t.ink.primary }]}>Biometrics</Text>
        </View>
        <Text style={[styles.label, { color: t.ink.secondary }]}>Height (cm)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: t.cardSubtle, borderColor: t.border, color: t.ink.primary }]}
          value={profile.height_cm}
          onChangeText={(val) => setProfile({ ...profile, height_cm: val })}
          keyboardType="numeric"
          placeholder="175"
          placeholderTextColor={t.ink.tertiary}
        />
        <Text style={[styles.label, { color: t.ink.secondary }]}>Weight (kg)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: t.cardSubtle, borderColor: t.border, color: t.ink.primary }]}
          value={profile.weight_kg}
          onChangeText={(val) => setProfile({ ...profile, weight_kg: val })}
          keyboardType="numeric"
          placeholder="70"
          placeholderTextColor={t.ink.tertiary}
        />
      </View>

      <View style={[styles.card, { marginTop: 20, backgroundColor: t.status.goodBg, borderColor: t.status.good + '44' }]}>
        <View style={styles.cardHeader}>
          <Lock color={t.status.good} size={18} style={{ marginRight: 8 }} />
          <Text style={[styles.cardTitle, { color: t.ink.primary }]}>Clinical Contacts (Encrypted)</Text>
        </View>
        <Text style={[styles.subtext, { color: t.ink.secondary }]}>Data is encrypted locally on this device before being saved to the database.</Text>
        
        <Text style={[styles.label, { color: t.ink.secondary }]}>Doctor Name</Text>
        <TextInput 
          style={[styles.input, { backgroundColor: t.page, borderColor: t.status.good, color: t.ink.primary }]}
          value={profile.doctor_name}
          onChangeText={(val) => setProfile({ ...profile, doctor_name: val })}
          placeholder="Dr. Smith"
          placeholderTextColor={t.ink.tertiary}
        />

        <Text style={[styles.label, { color: t.ink.secondary }]}>Doctor Email</Text>
        <TextInput 
          style={[styles.input, { backgroundColor: t.page, borderColor: t.status.good, color: t.ink.primary }]}
          value={profile.doctor_email}
          onChangeText={(val) => setProfile({ ...profile, doctor_email: val })}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="doctor@clinic.com"
          placeholderTextColor={t.ink.tertiary}
        />

        <Text style={[styles.label, { color: t.ink.secondary }]}>WhatsApp Number</Text>
        <TextInput 
          style={[styles.input, { backgroundColor: t.page, borderColor: t.status.good, color: t.ink.primary }]}
          value={profile.doctor_whatsapp}
          onChangeText={(val) => setProfile({ ...profile, doctor_whatsapp: val })}
          keyboardType="phone-pad"
          placeholder="+1234567890"
          placeholderTextColor={t.ink.tertiary}
        />
      </View>

      <View style={[styles.card, { marginTop: 24, backgroundColor: t.card, borderColor: t.border }]}>
        <Text style={[styles.cardTitle, { color: t.ink.primary }]}>Account Settings</Text>
        <Text style={[styles.label, { marginTop: 12, color: t.ink.secondary }]}>Email: {userEmail}</Text>
        
        <TouchableOpacity style={styles.signOutBtn} onPress={onSignOut}>
          <Text style={styles.signOutBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.page,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.ink.primary,
  },
  encryptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  encryptedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent.clay,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.ink.primary,
  },
  subtext: {
    fontSize: 12,
    color: COLORS.ink.secondary,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink.secondary,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: COLORS.page,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.ink.primary,
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    color: COLORS.ink.secondary,
  },
  signOutBtn: {
    backgroundColor: COLORS.status.critical,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  signOutBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  }
});
