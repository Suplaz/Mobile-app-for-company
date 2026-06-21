import { create } from 'zustand';
import { Lang } from '@/constants/data';

export interface UserProfile {
  id: string;
  email: string;
  role: 'worker' | 'admin' | 'manager';
}

export interface AssetRecord {
  id: string;
  name: string;
  kind: string;
  access: 'public' | 'restricted';
  status_key: string;
  tone: 'ok' | 'info' | 'attention' | 'issue';
  stage?: string;
  zone?: string;
  material?: { k: string; v: string }[];
  process?: { k: string; v: string }[];
  history?: { what: string; who: string; created_at: string }[];
  work_orders?: { id: string; title: string; status_key: string; tone: string }[];
  documents?: { id: string; name: string; category: string; storage_path: string; file_size?: string }[];
}

export interface AdminForm {
  name: string;
  id: string;
  type: 'Pallet' | 'Machine' | 'Location';
  access: 'public' | 'restricted';
  zone: string;
  stage: string;
}

export interface RegState {
  material: string | null;
  location: string | null;
  done: boolean;
}

interface AppState {
  // Auth
  user: UserProfile | null;
  setUser: (u: UserProfile | null) => void;

  // Language
  lang: Lang;
  setLang: (l: Lang) => void;

  // Navigation — managed by React Navigation, but we track some modal state
  currentAssetId: string | null;
  setCurrentAssetId: (id: string | null) => void;

  // Recent scans
  recentIds: string[];
  addRecent: (id: string) => void;

  // Admin form
  adminForm: AdminForm;
  setAdminForm: (p: Partial<AdminForm>) => void;
  resetAdminForm: () => void;

  // Batch
  jobInput: string;
  setJobInput: (v: string) => void;
  jobLoaded: string | null;
  setJobLoaded: (v: string | null) => void;
  partType: 'scafo' | 'gambetto';
  setPartType: (v: 'scafo' | 'gambetto') => void;
  cageCapacity: number;
  setCageCapacity: (v: number) => void;

  // Register
  reg: RegState;
  setReg: (p: Partial<RegState>) => void;
  resetReg: () => void;

  // Lancio / Bolla
  lancioIdx: number | null;
  setLancioIdx: (i: number | null) => void;
  bollaPer: number;
  setBollaPer: (v: number) => void;
  bollaBox: string;
  setBollaBox: (v: string) => void;
  fromScan: boolean;
  setFromScan: (v: boolean) => void;

  // Toast
  toast: string;
  showToast: (msg: string) => void;
  clearToast: () => void;

  // Action sheet
  actionOpen: boolean;
  setActionOpen: (v: boolean) => void;

  // Scan mode (view | reg-material | reg-location)
  scanMode: string;
  setScanMode: (v: string) => void;
}

const DEFAULT_FORM: AdminForm = {
  name: '', id: '', type: 'Pallet', access: 'public', zone: '', stage: 'injection',
};

export const useStore = create<AppState>((set) => ({
  user: null,
  setUser: (u) => set({ user: u }),

  lang: 'hu',
  setLang: (l) => set({ lang: l }),

  currentAssetId: null,
  setCurrentAssetId: (id) => set({ currentAssetId: id }),

  recentIds: [],
  addRecent: (id) =>
    set((s) => ({
      recentIds: [id, ...s.recentIds.filter((x) => x !== id)].slice(0, 6),
    })),

  adminForm: { ...DEFAULT_FORM },
  setAdminForm: (p) => set((s) => ({ adminForm: { ...s.adminForm, ...p } })),
  resetAdminForm: () => set({ adminForm: { ...DEFAULT_FORM } }),

  jobInput: '',
  setJobInput: (v) => set({ jobInput: v }),
  jobLoaded: null,
  setJobLoaded: (v) => set({ jobLoaded: v }),
  partType: 'scafo',
  setPartType: (v) => set({ partType: v }),
  cageCapacity: 48,
  setCageCapacity: (v) => set({ cageCapacity: v }),

  reg: { material: null, location: null, done: false },
  setReg: (p) => set((s) => ({ reg: { ...s.reg, ...p } })),
  resetReg: () => set({ reg: { material: null, location: null, done: false } }),

  lancioIdx: null,
  setLancioIdx: (i) => set({ lancioIdx: i }),
  bollaPer: 64,
  setBollaPer: (v) => set({ bollaPer: v }),
  bollaBox: '050',
  setBollaBox: (v) => set({ bollaBox: v }),
  fromScan: false,
  setFromScan: (v) => set({ fromScan: v }),

  toast: '',
  showToast: (msg) => set({ toast: msg }),
  clearToast: () => set({ toast: '' }),

  actionOpen: false,
  setActionOpen: (v) => set({ actionOpen: v }),

  scanMode: 'view',
  setScanMode: (v) => set({ scanMode: v }),
}));
