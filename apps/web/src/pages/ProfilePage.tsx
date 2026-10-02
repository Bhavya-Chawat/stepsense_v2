import { useState, useEffect } from 'react';
import { User, Mail, Phone, Lock, Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createSupabaseClient } from '@stepsense/supabase-client';
import { encryptData, decryptData } from '../lib/encryption';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createSupabaseClient(supabaseUrl, supabaseKey) : null;

export default function ProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [profile, setProfile] = useState({
    id: 'user_demo', // hardcoded for demo
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
      if (!supabase) return;
      setLoading(true);
      const { data, error } = await supabase
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
    if (!supabase) return;
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
      alert('Profile securely saved with End-to-End Encryption!');
    } else {
      alert('Error saving profile');
      console.error(error);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Loading Profile...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 md:p-12 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button 
              onClick={() => navigate('/sessions')}
              className="text-xs font-semibold text-accent-blue hover:text-slate-900 transition-colors flex items-center space-x-1 mb-2"
            >
              <ArrowLeft size={14} />
              <span>Back to Sessions</span>
            </button>
            <h1 className="text-3xl font-bold font-sans text-accent-teal tracking-tight">Patient Profile</h1>
            <p className="text-xs text-slate-500 mt-1 flex items-center space-x-1">
              <Lock size={12} className="text-green-600" />
              <span className="text-green-600 font-semibold">AES-256 Encrypted Storage Active</span>
            </p>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-accent-blue text-white rounded-lg font-bold shadow-none hover:bg-opacity-90 flex items-center space-x-2 transition-all"
          >
            <Save size={16} />
            <span>{saving ? 'Encrypting & Saving...' : 'Save Profile'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Biometrics */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-none-none space-y-5">
            <h3 className="text-base font-bold font-sans text-slate-800 flex items-center space-x-2 border-b border-slate-100 pb-3">
              <User size={18} className="text-accent-teal" />
              <span>Biometrics</span>
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Height (cm)</label>
                <input 
                  type="number" 
                  value={profile.height_cm}
                  onChange={(e) => setProfile({...profile, height_cm: e.target.value})}
                  className="w-full border border-slate-200 rounded-md p-2 text-sm focus:border-accent-blue focus:ring-1 focus:ring-accent-blue"
                  placeholder="175"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Weight (kg)</label>
                <input 
                  type="number" 
                  value={profile.weight_kg}
                  onChange={(e) => setProfile({...profile, weight_kg: e.target.value})}
                  className="w-full border border-slate-200 rounded-md p-2 text-sm focus:border-accent-blue focus:ring-1 focus:ring-accent-blue"
                  placeholder="70"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Shoe Size (US)</label>
                <input 
                  type="number" 
                  value={profile.shoe_size}
                  onChange={(e) => setProfile({...profile, shoe_size: e.target.value})}
                  className="w-full border border-slate-200 rounded-md p-2 text-sm focus:border-accent-blue focus:ring-1 focus:ring-accent-blue"
                  placeholder="10"
                />
              </div>
            </div>
          </div>

          {/* Clinical Contacts */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-none-none space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-green-100 text-green-700 text-[10px] font-bold px-3 py-1 rounded-bl-lg flex items-center space-x-1">
              <Lock size={10} />
              <span>ENCRYPTED</span>
            </div>
            <h3 className="text-base font-bold font-sans text-slate-800 flex items-center space-x-2 border-b border-slate-100 pb-3">
              <User size={18} className="text-accent-teal" />
              <span>Clinical Contacts</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              This data is encrypted locally before being stored in the database. Only your device can decrypt it.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Doctor Name</label>
                <input 
                  type="text" 
                  value={profile.doctor_name}
                  onChange={(e) => setProfile({...profile, doctor_name: e.target.value})}
                  className="w-full border border-slate-200 rounded-md p-2 text-sm focus:border-accent-blue focus:ring-1 focus:ring-accent-blue bg-green-50/30"
                  placeholder="Dr. Smith"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Clinic Name</label>
                <input 
                  type="text" 
                  value={profile.clinic_name}
                  onChange={(e) => setProfile({...profile, clinic_name: e.target.value})}
                  className="w-full border border-slate-200 rounded-md p-2 text-sm focus:border-accent-blue focus:ring-1 focus:ring-accent-blue bg-green-50/30"
                  placeholder="City Podiatry"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider flex items-center space-x-1">
                  <Mail size={12} />
                  <span>Email</span>
                </label>
                <input 
                  type="email" 
                  value={profile.doctor_email}
                  onChange={(e) => setProfile({...profile, doctor_email: e.target.value})}
                  className="w-full border border-slate-200 rounded-md p-2 text-sm focus:border-accent-blue focus:ring-1 focus:ring-accent-blue bg-green-50/30"
                  placeholder="doctor@clinic.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider flex items-center space-x-1">
                  <Phone size={12} />
                  <span>WhatsApp Number</span>
                </label>
                <input 
                  type="tel" 
                  value={profile.doctor_whatsapp}
                  onChange={(e) => setProfile({...profile, doctor_whatsapp: e.target.value})}
                  className="w-full border border-slate-200 rounded-md p-2 text-sm focus:border-accent-blue focus:ring-1 focus:ring-accent-blue bg-green-50/30"
                  placeholder="+1234567890"
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
