import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import type { SessionSummary } from '@stepsense/types';
import { useTheme, getTheme } from '../utils/ThemeContext';
import { generateAIReport } from '../utils/groq';
import { createSupabaseClient } from '@stepsense/supabase-client';
import { Share as ShareIcon } from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createSupabaseClient(supabaseUrl, supabaseKey) : null;

interface ExportReportButtonProps {
  summary: SessionSummary | null;
  mode?: 'consumer' | 'doctor';
}

export function ExportReportButton({ summary, mode = 'consumer' }: ExportReportButtonProps) {
  const { dark } = useTheme();
  const t = getTheme(dark);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExport = async () => {
    if (!summary || !supabase) return;
    setIsGenerating(true);
    try {
      const s = summary as any;
      const isUser = mode === 'consumer';
      const reportField = isUser ? 'ai_report_consumer' : 'ai_report_doctor';
      
      let reportText = s[reportField];

      // 1. Generate AI if missing
      if (!reportText) {
        reportText = await generateAIReport(summary, mode);
        const { error } = await supabase
          .from('session_summaries')
          .update({ [reportField]: reportText })
          .eq('session_id', summary.session_id);
        if (error) throw error;
        s[reportField] = reportText;
      }

      // 2. Generate PDF HTML
      const mainTitle = isUser ? 'Personal Health & Gait Analysis' : 'Clinical Gait & Plantar Load Analysis';
      const subTitle = isUser ? 'Personal Biomechanical Metrics Report' : 'Full Biomechanical Metrics Report';
      const brandName = isUser ? 'StepSense Health' : 'StepSense Medical';
      const thresholdTitle = isUser ? 'Normal Ranges' : 'Clinical Reference Threshold';
      const narrativeTitle = isUser ? 'Health Narrative & Insights' : 'Clinical Narrative & Biomechanical Assessment';

      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #26241F; }
              .header-border { border-bottom: 4px solid #1e293b; padding-bottom: 24px; margin-bottom: 32px; display: flex; justify-content: space-between; align-items: flex-end; }
              h1 { font-size: 24px; margin: 0 0 8px 0; color: #1e293b; display: flex; align-items: center; }
              h2.main-title { font-size: 18px; color: #147B85; margin: 0 0 4px 0; font-weight: bold; }
              p.sub-title { font-size: 11px; color: #64748b; margin: 0; font-weight: 500; }
              .meta { text-align: right; font-size: 10px; color: #64748b; line-height: 1.4; }
              .meta code { background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; color: #1e293b; font-weight: bold; }
              
              h3 { font-size: 14px; color: #26241F; margin: 24px 0 12px 0; font-weight: bold; }
              table { width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #E8E2D6; }
              th, td { text-align: left; padding: 10px; border-bottom: 1px solid #E8E2D6; border-right: 1px solid #E8E2D6; }
              th { background-color: #FAF6F0; color: #6B6558; font-weight: normal; }
              td.metric { font-weight: 600; width: 30%; }
              td.value { width: 25%; }
              td.notes { color: #6B6558; width: 45%; }
              
              .narrative { background-color: #FAF6F0; padding: 16px; border-radius: 4px; border: 1px solid #E8E2D6; font-size: 11px; line-height: 1.6; white-space: pre-line; }
              .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E8E2D6; text-align: center; font-size: 9px; color: #6B6558; }
            </style>
          </head>
          <body>
            <div class="header-border">
              <div style="float: left;">
                <h1>👟 ${brandName}</h1>
                <h2 class="main-title">${mainTitle}</h2>
                <p class="sub-title">${subTitle}</p>
              </div>
              <div class="meta" style="float: right;">
                <p style="text-transform: uppercase; font-weight: 600; margin-bottom: 2px;">Patient Session</p>
                <p><code>${summary.session_id}</code></p>
                <p>Generated: ${new Date().toLocaleString()}</p>
              </div>
              <div style="clear: both;"></div>
            </div>
            
            <h3>1. Gait & Biomechanical Metrics</h3>
            <table>
              <tr><th>Metric</th><th>Value</th><th>${thresholdTitle}</th></tr>
              <tr><td class="metric">Cadence</td><td class="value">${summary.cadence ?? '-'} spm</td><td class="notes">Normal range: 100 – 130 spm</td></tr>
              <tr><td class="metric">Avg Stride Time</td><td class="value">${summary.avg_stride_time ?? '-'} s</td><td class="notes">Normal range: 1.0 – 1.3 s</td></tr>
              <tr><td class="metric">Stride Length</td><td class="value">${s.stride_length ?? '-'} m</td><td class="notes">Normal range: 0.65 – 0.85 m</td></tr>
              <tr><td class="metric">Gait Score</td><td class="value" style="font-weight: bold;">${s.gait_score ?? '-'} / 100</td><td class="notes">Good: ≥ 70, Fair: 40–70, Poor: &lt; 40</td></tr>
              <tr><td class="metric">Gait Asymmetry</td><td class="value">${summary.asymmetry_percent ?? 0}%</td><td class="notes">Asymmetry threshold: &gt; 15%</td></tr>
            </table>

            <h3>2. Diabetic & Plantar Loading Analysis</h3>
            <table>
              <tr><th>Metric</th><th>Value</th><th>Clinical Notes</th></tr>
              <tr><td class="metric">Fatigue Index</td><td class="value">${summary.fatigue_index ?? 0} (${summary.fatigue_bucket ?? 'Normal'})</td><td class="notes">Mild: ≥ 0.10, Severe: ≥ 0.40</td></tr>
              <tr><td class="metric">Gait Speed</td><td class="value">${s.gait_speed ?? '-'} m/s</td><td class="notes">Reduced speed indicates impairment</td></tr>
              <tr><td class="metric">Swing / Stance Ratio</td><td class="value">${s.swing_time && s.stance_time ? (s.swing_time / s.stance_time).toFixed(2) : '-'}</td><td class="notes">Normal ratio is ~0.6</td></tr>
              <tr><td class="metric">Max Env. Temp</td><td class="value">${s.max_temperature ?? '-'}°C</td><td class="notes">High temp increases maceration risk</td></tr>
              <tr><td class="metric">Fungal Risk</td><td class="value">${s.fungal_risk_score ?? 0} / 100</td><td class="notes">Humidity + temperature + duration</td></tr>
            </table>
            
            <h3>3. ${narrativeTitle}</h3>
            <div class="narrative">
              ${reportText.replace(/\n/g, '<br/>')}
            </div>
            
            <div class="footer">
              <p style="font-weight: bold; margin-bottom: 4px;">* INDICATORS ARE ESTIMATED AND NOT A MEDICAL DIAGNOSIS.</p>
              <p style="margin: 0;">This report is generated automatically by StepSense platform algorithm models for clinical decision support.</p>
              <p style="margin: 4px 0 0 0;">StepSense © ${new Date().getFullYear()} — Samsung Solve for Tomorrow</p>
            </div>
          </body>
        </html>
      `;

      // 3. Print / Share
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        const { base64 } = await Print.printToFileAsync({ html: htmlContent, base64: true });
        const newUri = FileSystem.documentDirectory + `StepSense_Report_${summary.session_id}.pdf`;
        await FileSystem.writeAsStringAsync(newUri, base64!, { encoding: FileSystem.EncodingType.Base64 });
        await Sharing.shareAsync(newUri, { UTI: 'com.adobe.pdf', mimeType: 'application/pdf', dialogTitle: 'Share Clinical Report' });
      } else {
        await Print.printAsync({ html: htmlContent });
      }
    } catch (e: any) {
      Alert.alert('Export Failed', e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!summary) return null;

  return (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: isGenerating ? t.border : t.accent.teal }]}
      onPress={handleExport}
      disabled={isGenerating}
    >
      {isGenerating ? (
        <ActivityIndicator size="small" color="#FFF" style={{ marginRight: 8 }} />
      ) : (
        <ShareIcon color="#FFF" size={18} style={{ marginRight: 8 }} />
      )}
      <Text style={styles.btnText}>{isGenerating ? 'Generating Report...' : 'Generate & Share PDF Report'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginVertical: 10,
    
    elevation: 3,
  },
  btnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
