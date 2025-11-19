// Model with enhanced metadata
export interface AIModel {
  id: string; // "anthropic/claude-3.5-sonnet"
  name: string; // "Claude 3.5 Sonnet"
  provider: string; // "Anthropic"
  description?: string;
  pricing: {
    prompt: number;
    completion: number;
    currency: string;
  };
  context_length: number;
  capabilities?: {
    streaming: boolean;
    vision: boolean;
    functionCalling: boolean;
    jsonMode: boolean;
  };
  icon?: string; // Emoji or icon identifier
  tags?: string[]; // ["coding", "creative", "analysis"]
}

// Model response from API
export interface ModelResponse {
  modelId: string;
  modelName: string;
  content: string;
  rawResponse: unknown;
  metadata: {
    responseTime: number;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
  };
  error?: string;
}

// Comparison session
export interface ComparisonSession {
  id: string;
  timestamp: Date;
  prompt: string;
  options: {
    jsonMode: boolean;
    streaming: boolean;
    temperature?: number;
    maxTokens?: number;
  };
  selectedModels: string[];
  responses: ModelResponse[];
  totalCost: number;
  analysis?: AnalysisResult;
  userRatings?: Record<string, number>; // modelId -> rating (1-10)
  favorite?: string; // modelId of user's favorite response
}

// Analysis result from meta-LLM
export interface AnalysisResult {
  analyzerId: string; // Model used for analysis
  timestamp: Date;
  summary: string;
  recommendations: {
    best: string; // modelId
    reason: string;
    qualityScores: Record<string, number>; // modelId -> score
    strengths: Record<string, string[]>; // modelId -> strengths
    weaknesses: Record<string, string[]>; // modelId -> weaknesses
  };
  cost: number;
}

// User preset
export interface ModelPreset {
  id: string;
  name: string;
  description: string;
  modelIds: string[];
  isBuiltIn: boolean;
  createdAt: Date;
}

// Global settings
export interface UserSettings {
  theme: 'dark' | 'light' | 'auto';
  defaultModels: string[];
  defaultPreset?: string;
  enableStreaming: boolean;
  enableJsonMode: boolean;
  autoSaveHistory: boolean;
  costAlerts: {
    enabled: boolean;
    threshold: number; // Alert if single request exceeds this
    monthlyBudget: number;
  };
  privacyMode: boolean; // Extra confirmation before external calls
}

// Completion options
export interface CompletionOptions {
  jsonMode?: boolean;
  streaming?: boolean;
  temperature?: number;
  maxTokens?: number;
}

// App state
export interface AppState {
  apiKey: string | null;
  models: AIModel[];
  selectedModels: string[];
  prompt: string;
  options: CompletionOptions;
  isLoading: boolean;
  results: ModelResponse[];
  history: ComparisonSession[];
  settings: UserSettings;
}

// Progress callback
export type ProgressCallback = (progress: number, modelId: string, status: 'pending' | 'loading' | 'complete' | 'error') => void;

// Provider info for grouping
export interface ProviderInfo {
  name: string;
  icon: string;
  models: AIModel[];
}
