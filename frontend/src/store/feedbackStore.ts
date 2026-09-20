import { create } from 'zustand';

interface FeedbackModalState {
  isOpen: boolean;
  latitude: number | null;
  longitude: number | null;
  category: string;
  description: string;
  recordedAudioBlob: Blob | null;

  openModal: (lat?: number, lng?: number) => void;
  closeModal: () => void;
  setCoordinates: (lat: number, lng: number) => void;
  setCategory: (cat: string) => void;
  setDescription: (desc: string) => void;
  setRecordedAudio: (blob: Blob | null) => void;
  reset: () => void;
}

export const useFeedbackStore = create<FeedbackModalState>((set) => ({
  isOpen: false,
  latitude: 26.2183,
  longitude: 78.1828,
  category: 'road_pothole',
  description: '',
  recordedAudioBlob: null,

  openModal: (lat, lng) =>
    set({
      isOpen: true,
      latitude: lat ?? 26.2183,
      longitude: lng ?? 78.1828,
    }),
  closeModal: () => set({ isOpen: false }),
  setCoordinates: (lat, lng) => set({ latitude: lat, longitude: lng }),
  setCategory: (cat) => set({ category: cat }),
  setDescription: (desc) => set({ description: desc }),
  setRecordedAudio: (blob) => set({ recordedAudioBlob: blob }),
  reset: () =>
    set({
      isOpen: false,
      latitude: 26.2183,
      longitude: 78.1828,
      category: 'road_pothole',
      description: '',
      recordedAudioBlob: null,
    }),
}));
