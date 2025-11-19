import { ComparisonSession, UserSettings, ModelPreset } from '../types';

const STORAGE_KEYS = {
  API_KEY: 'aimodellike_api_key',
  HISTORY: 'aimodellike_history',
  SETTINGS: 'aimodellike_settings',
  PRESETS: 'aimodellike_presets',
  MODELS_CACHE: 'aimodellike_models_cache',
  SELECTED_MODELS: 'aimodellike_selected_models',
};

// Encryption key derivation (uses device-specific entropy)
const ENCRYPTION_SALT = 'aimodellike_v1';

async function deriveKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(ENCRYPTION_SALT + navigator.userAgent),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(ENCRYPTION_SALT),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Secure encryption for API key using AES-GCM
async function encryptKey(key: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const cryptoKey = await deriveKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      encoder.encode(key)
    );

    // Combine IV + encrypted data and encode as base64
    const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  } catch {
    // Fallback to basic obfuscation if crypto fails
    return btoa(key.split('').reverse().join(''));
  }
}

async function decryptKey(encrypted: string): Promise<string> {
  try {
    const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));

    // Check if this is legacy format (short length = old btoa encoding)
    if (combined.length < 28) {
      // Legacy decryption
      return atob(encrypted).split('').reverse().join('');
    }

    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const cryptoKey = await deriveKey();
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      data
    );

    return new TextDecoder().decode(decrypted);
  } catch {
    // Try legacy decryption as fallback
    try {
      return atob(encrypted).split('').reverse().join('');
    } catch {
      return '';
    }
  }
}

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

// Input validation helpers
function isValidString(value: unknown): value is string {
  return typeof value === 'string';
}

function isValidArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function isValidObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Storage service
export const storageService = {
  // API Key
  async getApiKey(): Promise<string | null> {
    const encrypted = localStorage.getItem(STORAGE_KEYS.API_KEY);
    if (!encrypted) return null;
    return await decryptKey(encrypted);
  },

  async setApiKey(key: string): Promise<void> {
    // Validate API key format
    if (!key || typeof key !== 'string' || !key.startsWith('sk-')) {
      throw new Error('Invalid API key format');
    }
    const encrypted = await encryptKey(key);
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

  // Import data with validation
  importData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);

      // Validate the imported data structure
      if (!isValidObject(data)) {
        console.error('Import failed: Invalid data format');
        return false;
      }

      // Validate and import history
      if (data.history !== undefined) {
        if (!isValidArray(data.history)) {
          console.error('Import failed: Invalid history format');
          return false;
        }
        // Validate each history session has required fields
        const validHistory = (data.history as unknown[]).filter(session => {
          if (!isValidObject(session)) return false;
          return isValidString(session.id) &&
                 isValidString(session.prompt) &&
                 isValidArray(session.selectedModels);
        });
        this.saveHistory(validHistory as ComparisonSession[]);
      }

      // Validate and import settings
      if (data.settings !== undefined) {
        if (!isValidObject(data.settings)) {
          console.error('Import failed: Invalid settings format');
          return false;
        }
        // Merge with defaults to ensure all required fields exist
        const safeSettings = { ...DEFAULT_SETTINGS, ...data.settings };
        this.saveSettings(safeSettings);
      }

      // Validate and import presets
      if (data.presets !== undefined) {
        if (!isValidArray(data.presets)) {
          console.error('Import failed: Invalid presets format');
          return false;
        }
        // Validate each preset has required fields
        const validPresets = (data.presets as unknown[]).filter(preset => {
          if (!isValidObject(preset)) return false;
          return isValidString(preset.id) &&
                 isValidString(preset.name) &&
                 isValidArray(preset.modelIds);
        });
        localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(validPresets));
      }

      // Validate and import selected models
      if (data.selectedModels !== undefined) {
        if (!isValidArray(data.selectedModels)) {
          console.error('Import failed: Invalid selectedModels format');
          return false;
        }
        // Ensure all items are strings
        const validModels = (data.selectedModels as unknown[]).filter(isValidString);
        this.setSelectedModels(validModels);
      }
      return true;
    } catch {
      return false;
    }
  },
};
