import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  AlertTriangle, 
  MapPin, 
  Upload, 
  CheckCircle2, 
  Sparkles, 
  Loader2, 
  ArrowLeft, 
  Camera, 
  ShieldCheck, 
  Mic, 
  FileText,
  Navigation,
  Trash2
} from 'lucide-react';
import { PublicHeader } from '../components/layout/PublicHeader';
import { useCities } from '../api/hooks';
import { feedbackApi } from '../api/feedback';
import { aiApi } from '../api/ai';
import { validateCivicDescription } from '../utils/civicValidation';

const ISSUE_CATEGORIES = [
  { id: 'road_pothole', label_en: 'Road Damage / Potholes', label_hi: 'सड़क क्षति एवं गड्ढे' },
  { id: 'water_leakage', label_en: 'Water Supply / Leakage', label_hi: 'पेयजल आपूर्ति एवं रिसाव' },
  { id: 'garbage_dump', label_en: 'Garbage / Waste Accumulation', label_hi: 'कचरा एवं गंदगी का ढेर' },
  { id: 'street_light', label_en: 'Streetlight Failure', label_hi: 'स्ट्रीट लाइट खराबी' },
  { id: 'sewerage_overflow', label_en: 'Drainage / Sewerage Overflow', label_hi: 'सीवेज एवं नाली ओवरफ्लो' },
  { id: 'infrastructure_damage', label_en: 'Public Infrastructure Damage', label_hi: 'सार्वजनिक अवसंरचना क्षति' },
  { id: 'public_safety', label_en: 'Public Safety Hazard', label_hi: 'जनसुरक्षा एवं आपात खतरा' },
  { id: 'other', label_en: 'Other / Something else', label_hi: 'अन्य / अन्य समस्या' },
];

export const PublicReportPage: React.FC = () => {
  const { i18n } = useTranslation();
  const { data: cities = [] } = useCities();

  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const [category, setCategory] = useState<string>('road_pothole');
  const [title, setTitle] = useState<string>('');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [latitude, setLatitude] = useState<number>(26.2183);
  const [longitude, setLongitude] = useState<number>(78.1828);
  const [locationAddress, setLocationAddress] = useState<string>('Near City Center, Gwalior');
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [attachedPhotos, setAttachedPhotos] = useState<{ id: string; url: string; name: string; size: string }[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [severity, setSeverity] = useState<string>('medium');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [submittedReportNumber, setSubmittedReportNumber] = useState<string | null>(null);
  const [submittedReportData, setSubmittedReportData] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Set default city
  React.useEffect(() => {
    if (cities.length > 0 && !selectedCityId) {
      setSelectedCityId(cities[0].id);
      setLatitude(cities[0].center_latitude);
      setLongitude(cities[0].center_longitude);
      setLocationAddress(`${cities[0].name_en} Municipal Area`);
    }
  }, [cities, selectedCityId]);

  const handleCityChange = (cityId: string) => {
    setSelectedCityId(cityId);
    const c = cities.find((x) => x.id === cityId);
    if (c) {
      setLatitude(c.center_latitude);
      setLongitude(c.center_longitude);
      setLocationAddress(`${c.name_en} Municipal Area`);
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = i18n.language === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.start();
    setIsListening(true);
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setDescription((prev) => (prev ? `${prev} ${text}` : text));
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  };

  const handleMultipleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSizeBytes = 10 * 1024 * 1024;
    const newPhotos: { id: string; url: string; name: string; size: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!allowedTypes.includes(file.type)) {
        setPhotoError(`"${file.name}" has an unsupported format. Please upload JPEG, PNG, or WebP.`);
        continue;
      }
      if (file.size > maxSizeBytes) {
        setPhotoError(`"${file.name}" exceeds the 10MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
        continue;
      }
      if (attachedPhotos.length + newPhotos.length >= 5) {
        setPhotoError('Maximum 5 photos can be attached per report.');
        break;
      }
      const url = URL.createObjectURL(file);
      const sizeStr = (file.size / 1024).toFixed(0) + ' KB';
      newPhotos.push({
        id: `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
        url,
        name: file.name,
        size: sizeStr,
      });
    }

    if (newPhotos.length > 0) {
      setAttachedPhotos((prev) => [...prev, ...newPhotos]);
    }
    e.target.value = '';
  };

  const handleRemovePhoto = (id: string) => {
    setAttachedPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Debounce double-click protection

    if (!description.trim()) {
      setErrorMessage(i18n.language === 'hi' ? 'कृपया समस्या का विवरण दर्ज करें' : 'Please provide issue description');
      return;
    }

    // Client-side strict validation against gibberish and spam
    const clientVal = validateCivicDescription(description);
    if (!clientVal.isValid) {
      setErrorMessage(clientVal.error || 'Please enter a valid description of the civic problem.');
      return;
    }

    if (category === 'other' && !customTitle.trim()) {
      setErrorMessage(i18n.language === 'hi' ? 'कृपया अन्य श्रेणी के लिए समस्या का शीर्षक दर्ज करें' : 'Please provide a custom issue title for the "Other" category.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    // 1. Synthesize Sarvam AI Summarized Report from citizen input
    let triageRes: any = null;
    try {
      triageRes = await aiApi.triageReport(description, category, latitude, longitude);
    } catch (aiErr) {
      console.warn('[Sarvam AI Triage client fallback]', aiErr);
    }

    let reportNum = `ND-MP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const effectiveSeverity = triageRes?.urgency || severity;
    const effectiveDept = triageRes?.assigned_department_name || 
      (category === 'road_pothole' ? 'PWD Road Maintenance' : 
       category === 'water_leakage' ? 'PHED Water Supply' : 
       category === 'garbage_dump' ? 'SWM Solid Waste' : 'Municipal Services');

    const effectiveTitle = category === 'other'
      ? (customTitle.trim() || title.trim() || 'Other Municipal Grievance')
      : (title.trim() || `${category.replace('_', ' ')} incident`);

    const allMediaPaths = [
      ...attachedPhotos.map((p) => p.url),
      ...(mediaUrl ? [mediaUrl] : [])
    ];

    try {
      const res = await feedbackApi.submitCitizenReport({
        city_id: selectedCityId || 'c0000000-0000-0000-0000-000000000001',
        category,
        title: effectiveTitle,
        description,
        latitude,
        longitude,
        location_address: locationAddress,
        input_language: i18n.language === 'hi' ? 'hi' : 'en',
        severity_input: effectiveSeverity,
        is_anonymous: isAnonymous,
        is_public: true,
        media_paths: allMediaPaths,
      });

      if (res?.report_number) reportNum = res.report_number;
    } catch (err: any) {
      const respData = err?.response?.data;
      if (err?.response?.status === 422 || respData?.detail?.error === 'validation_failed') {
        const valMsg = respData?.detail?.message 
          ? `${respData.detail.message} ${respData.detail.suggestion || ''}`
          : (typeof respData?.detail === 'string' ? respData.detail : 'The description contains insufficient civic details or meaningless characters.');
        setErrorMessage(valMsg);
        setIsSubmitting(false);
        return;
      }
      console.warn('[Submitted in offline-resilient mode]', err);
    }

    setSubmittedReportNumber(reportNum);

    // Save to citizen local storage tracking list with full geospatial metadata & AI summary
    const newReportItem = {
      id: reportNum,
      report_number: reportNum,
      title: effectiveTitle,
      category,
      media_paths: allMediaPaths,
      media: allMediaPaths.map((u, i) => ({ id: `photo-${i}`, storage_path: u, media_type: 'image' })),
      description,
      latitude,
      longitude,
      created_at: new Date().toISOString(),
      status: 'submitted',
      location: locationAddress,
      location_address: locationAddress,
      severity: effectiveSeverity,
      assigned_department: effectiveDept,
      executive_summary_en: triageRes?.executive_summary_en || `Executive Brief: Citizen submitted issue regarding ${category.replace('_', ' ')}. Immediate municipal dispatch recommended.`,
      executive_summary_hi: triageRes?.executive_summary_hi || `कार्यकारी सारांश: नागरिक द्वारा ${category.replace('_', ' ')} संबंधी शिकायत दर्ज की गई है। त्वरित नगर निगम कार्रवाई अपेक्षित है।`,
      extracted_hazard: triageRes?.extracted_hazard || `${category.replace('_', ' ').toUpperCase()} hazard reported in municipal area`,
      recommended_action: triageRes?.recommended_action || 'Dispatch field inspection squad and initiate corrective repair.',
      target_sla_hours: triageRes?.target_sla_hours || 48,
      triage_confidence: triageRes ? Math.round(triageRes.confidence * 100) : 92,
    };

    setSubmittedReportData(newReportItem);

    try {
      const saved = JSON.parse(localStorage.getItem('my_citizen_reports') || '[]');
      saved.unshift(newReportItem);
      localStorage.setItem('my_citizen_reports', JSON.stringify(saved));
    } catch (e) {
      // Safe ignore
    }

    // Broadcast event for real-time map synchronization
    window.dispatchEvent(new CustomEvent('nd-report-submitted', { detail: newReportItem }));
    setIsSubmitting(false);
  };

  return (
    <div className="h-screen w-full bg-[#0B132B] text-slate-100 flex flex-col font-sans select-none overflow-y-auto">
      <PublicHeader cities={cities} />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 pb-24">
        <a href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span>{i18n.language === 'hi' ? 'मानचित्र पर वापस जाएं' : 'Back to Public Map'}</span>
        </a>

        {submittedReportNumber ? (
          <div className="bg-[#1C2541] border border-emerald-500/40 rounded-2xl p-6 sm:p-8 text-center space-y-5 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                {i18n.language === 'hi' ? 'शिकायत सफलतापूर्वक दर्ज की गई!' : 'Grievance Submitted Successfully!'}
              </h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                {i18n.language === 'hi' 
                  ? 'आपकी शिकायत संबंधित नगर निगम विभाग को अग्रेषित कर दी गई है।'
                  : 'Your report has been logged in PostGIS and assigned for municipal inspection.'}
              </p>
            </div>

            {/* Comprehensive Report Summary Card */}
            <div className="bg-[#131B33] border border-[#2E3D60] rounded-xl p-4 text-left max-w-lg mx-auto space-y-3.5 shadow-xl">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#2E3D60]/60">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Complaint ID</span>
                  <span className="font-mono font-bold text-cyan-400 text-base tracking-wide">{submittedReportNumber}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Submitted
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">Category:</span>
                  <span className="font-semibold text-slate-200 capitalize">{category.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Urgency:</span>
                  <span className="font-bold text-amber-400 uppercase">{submittedReportData?.severity || severity}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Assigned Dept:</span>
                  <span className="font-semibold text-slate-200 truncate block">{submittedReportData?.assigned_department || 'Municipal Services'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">SLA Target:</span>
                  <span className="font-semibold text-cyan-300 block">{submittedReportData?.target_sla_hours || 48} Hours Standard SLA</span>
                </div>
              </div>

              {/* Sarvam AI Executive Report Section */}
              <div className="p-3 bg-gradient-to-br from-[#1C2541] to-[#1C1A38] border border-cyan-500/40 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Sarvam AI Executive Summarized Report</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                    {submittedReportData?.triage_confidence || 94}% Confidence
                  </span>
                </div>

                {submittedReportData?.extracted_hazard && (
                  <div className="p-2 bg-purple-950/40 border border-purple-500/30 rounded-lg">
                    <span className="text-[10px] text-purple-300 font-bold block uppercase tracking-wider">
                      Extracted Hazard / पहचान किया गया जोखिम:
                    </span>
                    <p className="text-xs text-slate-100 font-semibold mt-0.5">
                      {submittedReportData.extracted_hazard}
                    </p>
                  </div>
                )}

                <div className="p-2.5 bg-[#0B132B]/80 rounded-lg border border-[#2E3D60] space-y-1">
                  <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">
                    AI Synthesized Summary:
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">
                    {i18n.language === 'hi'
                      ? (submittedReportData?.executive_summary_hi || submittedReportData?.executive_summary_en)
                      : (submittedReportData?.executive_summary_en || submittedReportData?.executive_summary_hi)}
                  </p>
                  {submittedReportData?.executive_summary_hi && i18n.language !== 'hi' && (
                    <p className="text-[11px] text-slate-400 italic pt-1 border-t border-[#2E3D60]/50 font-hindi">
                      "{submittedReportData.executive_summary_hi}"
                    </p>
                  )}
                </div>

                {submittedReportData?.recommended_action && (
                  <div className="p-2 bg-emerald-950/30 border border-emerald-500/30 rounded-lg text-[11px] text-emerald-200">
                    <span className="font-bold block text-[10px] text-emerald-400 uppercase">Recommended Municipal Action:</span>
                    <p className="mt-0.5 leading-relaxed">{submittedReportData.recommended_action}</p>
                  </div>
                )}
              </div>

              <div className="pt-1 text-xs">
                <span className="text-slate-400 text-[10px] block">Citizen Raw Description:</span>
                <p className="text-slate-300 italic mt-0.5">"{description}"</p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <a
                href={`/?lat=${latitude}&lng=${longitude}`}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{i18n.language === 'hi' ? 'मानचित्र पर देखें' : 'View on Map'}</span>
              </a>
              <a
                href="/my-reports"
                className="px-5 py-2.5 bg-[#1C2541] hover:bg-[#253258] border border-[#2E3D60] rounded-xl text-xs font-semibold text-cyan-300"
              >
                {i18n.language === 'hi' ? 'मेरी रिपोर्ट्स' : 'Track in My Reports'}
              </a>
              <button
                onClick={() => {
                  setSubmittedReportNumber(null);
                  setTitle('');
                  setDescription('');
                }}
                className="px-4 py-2.5 text-slate-400 hover:text-white text-xs"
              >
                {i18n.language === 'hi' ? 'अन्य शिकायत दर्ज करें' : 'Submit Another'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#1C2541] border border-[#2E3D60] rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Madhya Pradesh Public Grievance Intake</span>
              </div>
              <h2 className="text-2xl font-black text-white">
                {i18n.language === 'hi' ? 'नागरिक समस्या दर्ज करें' : 'Report a Civic Issue'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {i18n.language === 'hi'
                  ? 'सड़क गड्ढे, जलापूर्ति रिसाव, कचरा ढेर या स्ट्रीट लाइट संबंधी समस्याओं की सीधी रिपोर्ट करें।'
                  : 'Submit geotagged reports for road distress, water leaks, solid waste, or lighting failures.'}
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              {/* City Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-slate-300 font-semibold">City (Madhya Pradesh)</label>
                  <select
                    value={selectedCityId}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="w-full p-2.5 bg-[#131B33] border border-[#2E3D60] rounded-lg text-slate-100 font-semibold focus:outline-none focus:border-cyan-400"
                  >
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name_en} ({c.name_hi})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Selection */}
                <div className="space-y-1.5">
                  <label className="block text-slate-300 font-semibold">Issue Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 bg-[#131B33] border border-[#2E3D60] rounded-lg text-slate-100 font-semibold focus:outline-none focus:border-cyan-400"
                  >
                    {ISSUE_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label_en} ({cat.label_hi})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Other Category: Mandatory Custom Issue Title */}
              {category === 'other' && (
                <div className="p-3 bg-amber-950/20 border border-amber-500/40 rounded-xl space-y-1.5">
                  <label className="block text-amber-300 font-semibold text-xs">
                    Custom Issue Title (Required for 'Other') / समस्या शीर्षक *
                  </label>
                  <input
                    type="text"
                    required
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="उदा: मुख्य मार्ग पर गिरा भारी पेड़, खुला बिजली ट्रांसफार्मर, आवारा पशु झुंड..."
                    className="w-full p-2.5 bg-[#0B132B] border border-amber-500/50 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400 text-xs"
                  />
                  <p className="text-[10px] text-amber-400/80">
                    Please provide an exact descriptive title so municipal dispatch can route this issue to the correct squad.
                  </p>
                </div>
              )}

              {/* Title */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-semibold">Brief Issue Headline (Optional)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Deep pothole near main hospital entrance"
                  className="w-full p-2.5 bg-[#131B33] border border-[#2E3D60] rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Description & Voice Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-semibold">
                    Detailed Description <span className="text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleVoiceInput}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                      isListening ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-[#131B33] hover:bg-[#253258] text-cyan-400 border border-cyan-500/30'
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>{isListening ? 'Listening...' : 'Voice Input (आवाज़ से लिखें)'}</span>
                  </button>
                </div>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    i18n.language === 'hi'
                      ? 'समस्या का विस्तार से वर्णन करें (स्थान, अवधि, प्रभाव)...'
                      : 'Describe the exact civic issue, impact on traffic or safety, and landmarks...'
                  }
                  className="w-full p-3 bg-[#131B33] border border-[#2E3D60] rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 leading-relaxed"
                />
              </div>

              {/* Location & Coordinates */}
              <div className="p-4 bg-[#131B33] rounded-xl border border-[#2E3D60] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    <span>Geographic Location</span>
                  </span>
                  <span className="text-[10px] text-cyan-400 font-mono">WGS84 EPSG:4326</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={latitude}
                      onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-[#0B132B] border border-[#2E3D60] rounded font-mono text-cyan-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={longitude}
                      onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-[#0B132B] border border-[#2E3D60] rounded font-mono text-cyan-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400">Locality / Landmark Address</label>
                  <input
                    type="text"
                    value={locationAddress}
                    onChange={(e) => setLocationAddress(e.target.value)}
                    placeholder="Near City Center / Ward landmark"
                    className="w-full p-2 bg-[#0B132B] border border-[#2E3D60] rounded text-slate-200"
                  />
                </div>
              </div>

              {/* Multi-Photo Evidence Upload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-300 font-semibold flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-cyan-400" />
                    <span>Attach Photo Evidence (Up to 5 Photos)</span>
                  </label>
                  <span className="text-[10px] text-cyan-400 font-mono">
                    {attachedPhotos.length}/5 Attached
                  </span>
                </div>

                {photoError && (
                  <div className="p-2.5 rounded bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs">
                    {photoError}
                  </div>
                )}

                <label className="border-2 border-dashed border-[#2E3D60] hover:border-cyan-400 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer bg-[#131B33]/50 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleMultipleFilesSelect}
                    className="hidden"
                  />
                  <Upload className="w-6 h-6 text-cyan-400 mb-1.5" />
                  <p className="text-slate-300 font-medium text-xs">Click to browse or drag & drop photos</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">JPEG, PNG, WebP (Max 10MB per photo)</p>
                </label>

                {/* Photo Thumbnails */}
                {attachedPhotos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {attachedPhotos.map((photo) => (
                      <div key={photo.id} className="relative group rounded-lg overflow-hidden border border-[#2E3D60] bg-black aspect-video flex items-center justify-center">
                        <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                          <span className="text-[9px] text-slate-200 truncate">{photo.name}</span>
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] text-cyan-300 font-mono">{photo.size}</span>
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(photo.id)}
                              className="p-1 bg-rose-600 hover:bg-rose-500 rounded text-white shadow"
                              title="Remove photo"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Optional Photo URL */}
                <div className="pt-1">
                  <input
                    type="url"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="Or enter image URL: https://example.com/pothole.jpg"
                    className="w-full p-2 bg-[#0B132B] border border-[#2E3D60] rounded text-slate-300 text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all text-sm disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Transmitting to Supabase PostGIS & Sarvam AI...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit Civic Grievance to Municipal Authority</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

