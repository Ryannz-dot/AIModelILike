import { ComparisonSession, UserSettings, ModelPreset } from '../types';

const STORAGE_KEYS = {
  API_KEY: 'aimodellike_api_key',
  HISTORY: 'aimodellike_history',
  SETTINGS: 'aimodellike_settings',
  PRESETS: 'aimodellike_presets',
  MODELS_CACHE: 'aimodellike_models_cache',
  SELECTED_MODELS: 'aimodellike_selected_models',
};

// Default settings
const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  defaultModels: [],
  enableStreaming: false,
  enableJsonMode: false,
  autoSaveHistory: true,
  costAlerts: {
    enabled: true,
    threshold: 1.0, // $1 per request alert
    monthlyBudget: 50.0,
  },
  privacyMode: false,
};

// Built-in presets
export const BUILT_IN_PRESETS: ModelPreset[] = [
  {
    id: 'best-performance',
    name: 'Best Performance',
    description: 'Top-tier models for highest quality responses',
    modelIds: ['openai/gpt-4-turbo', 'anthropic/claude-3.5-sonnet', 'google/gemini-1.5-pro'],
    isBuiltIn: true,
    createdAt: new Date(),
  },
  {
    id: 'budget-friendly',
    name: 'Budget-Friendly',
    description: 'Cost-effective models with good performance',
    modelIds: ['openai/gpt-4o-mini', 'anthropic/claude-3-haiku', 'google/gemini-2.0-flash-exp:free'],
    isBuiltIn: true,
    createdAt: new Date(),
  },
  {
    id: 'fastest',
    name: 'Fastest',
    description: 'Models optimized for speed',
    modelIds: ['google/gemini-2.0-flash-exp:free', 'openai/gpt-4o-mini', 'anthropic/claude-3-haiku'],
    isBuiltIn: true,
    createdAt: new Date(),
  },
  {
    id: 'code-experts',
    name: 'Code Experts',
    description: 'Best models for coding tasks',
    modelIds: ['openai/gpt-4-turbo', 'anthropic/claude-3.5-sonnet', 'deepseek/deepseek-coder'],
    isBuiltIn: true,
    createdAt: new Date(),
  },
];

// Simple encryption for API key (not truly secure, but better than plaintext)
function encryptKey(key: string): string {
  return btoa(key.split('').reverse().join(''));
}

function decryptKey(encrypted: string): string {
  try {
    return atob(encrypted).split('').reverse().join('');
  } catch {
    return '';
  }
}

// Storage service
export const storageService = {
  // API Key
  getApiKey(): string | null {
    const encrypted = localStorage.getItem(STORAGE_KEYS.API_KEY);
    if (!encrypted) return null;
    return decryptKey(encrypted);
  },

  setApiKey(key: string): void {
    const encrypted = encryptKey(key);
    localStorage.setItem(STORAGE_KEYS.API_KEY, encrypted);
  },

  clearApiKey(): void {
    localStorage.removeItem(STORAGE_KEYS.API_KEY);
  },

  // History
  getHistory(): ComparisonSession[] {
    const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!data) return [];
    try {
      const parsed = JSON.parse(data);
      return parsed.map((session: ComparisonSession) => ({
        ...session,
        timestamp: new Date(session.timestamp),
      }));
    } catch {
      return [];
    }
  },

  saveHistory(history: ComparisonSession[]): void {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  },

  addToHistory(session: ComparisonSession): void {
    const history = this.getHistory();
    history.unshift(session);
    // Keep only last 100 sessions
    if (history.length > 100) {
      history.pop();
    }
    this.saveHistory(history);
  },

  clearHistory(): void {
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
  },

  // Settings
  getSettings(): UserSettings {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!data) return DEFAULT_SETTINGS;
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: UserSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  // Presets
  getPresets(): ModelPreset[] {
    const data = localStorage.getItem(STORAGE_KEYS.PRESETS);
    const customPresets: ModelPreset[] = data ? JSON.parse(data) : [];
    return [...BUILT_IN_PRESETS, ...customPresets];
  },

  saveCustomPreset(preset: ModelPreset): void {
    const data = localStorage.getItem(STORAGE_KEYS.PRESETS);
    const customPresets: ModelPreset[] = data ? JSON.parse(data) : [];
    customPresets.push(preset);
    localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(customPresets));
  },

  deleteCustomPreset(id: string): void {
    const data = localStorage.getItem(STORAGE_KEYS.PRESETS);
    if (!data) return;
    const customPresets: ModelPreset[] = JSON.parse(data);
    const filtered = customPresets.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(filtered));
  },

  // Models cache
  getModelsCache(): { data: unknown; timestamp: number } | null {
    const data = localStorage.getItem(STORAGE_KEYS.MODELS_CACHE);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  setModelsCache(models: unknown): void {
    const cacheData = {
      data: models,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEYS.MODELS_CACHE, JSON.stringify(cacheData));
  },

  // Selected models
  getSelectedModels(): string[] {
    const data = localStorage.getItem(STORAGE_KEYS.SELECTED_MODELS);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  setSelectedModels(models: string[]): void {
    localStorage.setItem(STORAGE_KEYS.SELECTED_MODELS, JSON.stringify(models));
  },

  // Clear all data
  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  },

  // Export all data
  exportData(): string {
    const data = {
      history: this.getHistory(),
      settings: this.getSettings(),
      presets: this.getPresets().filter(p => !p.isBuiltIn),
      selectedModels: this.getSelectedModels(),
      exportDate: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  },

  // Import data
  importData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.history) {
        this.saveHistory(data.history);
      }
      if (data.settings) {
        this.saveSettings(data.settings);
      }
      if (data.presets) {
        localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(data.presets));
      }
      if (data.selectedModels) {
        this.setSelectedModels(data.selectedModels);
      }
      return true;
    } catch {
      return false;
    }
  },
};
