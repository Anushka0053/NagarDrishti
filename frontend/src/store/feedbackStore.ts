import { create } from 'zustand';

interface FeedbackModalState {
  isOpen: boolean;
  latitude: number | null;
  longitude: number | null;
  category: string;
  title: string;
  description: string;
  severity: string;
  recordedAudioBlob: Blob | null;
  mediaPreviewUrl: string | null;
  hasDraft: boolean;

  openModal: (lat?: number, lng?: number) => void;
  closeModal: () => void;
  setCoordinates: (lat: number, lng: number) => void;
  setCategory: (cat: string) => void;
  setTitle: (title: string) => void;
  setDescription: (desc: string) => void;
  setSeverity: (sev: string) => void;
  setRecordedAudio: (blob: Blob | null) => void;
  setMediaPreviewUrl: (url: string | null) => void;
  saveDraft: () => void;
  restoreDraft: () => boolean;
  clearDraft: () => void;
  reset: () => void;
}

const DRAFT_KEY = 'nagardrishti_citizen_report_draft';

export const useFeedbackStore = create<FeedbackModalState>((set, get) => ({
  isOpen: false,
  latitude: 26.2183,
  longitude: 78.1828,
  category: 'road_pothole',
  title: '',
  description: '',
  severity: 'medium',
  recordedAudioBlob: null,
  mediaPreviewUrl: null,
  hasDraft: typeof window !== 'undefined' && !!localStorage.getItem(DRAFT_KEY),

  openModal: (lat, lng) => {
    const hasSaved = typeof window !== 'undefined' && !!localStorage.getItem(DRAFT_KEY);
    set({
      isOpen: true,
      latitude: lat ?? 26.2183,
      longitude: lng ?? 78.1828,
      hasDraft: hasSaved,
    });
  },
  closeModal: () => set({ isOpen: false }),
  setCoordinates: (lat, lng) => set({ latitude: lat, longitude: lng }),
  setCategory: (cat) => set({ category: cat }),
  setTitle: (title) => set({ title }),
  setDescription: (desc) => set({ description: desc }),
  setSeverity: (severity) => set({ severity }),
  setRecordedAudio: (blob) => set({ recordedAudioBlob: blob }),
  setMediaPreviewUrl: (url) => set({ mediaPreviewUrl: url }),

  saveDraft: () => {
    if (typeof window === 'undefined') return;
    const state = get();
    const draftData = {
      category: state.category,
      title: state.title,
      description: state.description,
      severity: state.severity,
      latitude: state.latitude,
      longitude: state.longitude,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
    set({ hasDraft: true });
  },

  restoreDraft: () => {
    if (typeof window === 'undefined') return false;
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return false;
    try {
      const data = JSON.parse(raw);
      set({
        category: data.category || 'road_pothole',
        title: data.title || '',
        description: data.description || '',
        severity: data.severity || 'medium',
        latitude: data.latitude || 26.2183,
        longitude: data.longitude || 78.1828,
        hasDraft: true,
      });
      return true;
    } catch {
      return false;
    }
  },

  clearDraft: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(DRAFT_KEY);
    }
    set({ hasDraft: false });
  },

  reset: () =>
    set({
      isOpen: false,
      latitude: 26.2183,
      longitude: 78.1828,
      category: 'road_pothole',
      title: '',
      description: '',
      severity: 'medium',
      recordedAudioBlob: null,
      mediaPreviewUrl: null,
    }),
}));
