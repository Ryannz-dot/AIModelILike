import { useState, useEffect, useCallback } from 'react';
import { AIModel, ModelResponse, CompletionOptions, ComparisonSession } from './types';
import { storageService } from './services/storage';
import { OpenRouterService } from './services/openrouter';
import Header from './components/Header';
import ApiKeyModal from './components/ApiKeyModal';
import PromptSection from './components/PromptSection';
import ModelSelector from './components/ModelSelector';
import ResultsSection from './components/ResultsSection';
import HistoryModal from './components/HistoryModal';
import SettingsModal from './components/SettingsModal';

function App() {
  // State
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [options, setOptions] = useState<CompletionOptions>({
    jsonMode: false,
    streaming: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loadingModels, setLoadingModels] = useState<Record<string, 'loading' | 'complete' | 'error'>>({});
  const [results, setResults] = useState<ModelResponse[]>([]);
  const [streamingContent, setStreamingContent] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<ComparisonSession[]>([]);

  // Modal states
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Load initial data
  useEffect(() => {
    const savedKey = storageService.getApiKey();
    const savedModels = storageService.getSelectedModels();
    const savedHistory = storageService.getHistory();
    const settings = storageService.getSettings();

    setApiKey(savedKey);
    setSelectedModels(savedModels);
    setHistory(savedHistory);
    setOptions({
      jsonMode: settings.enableJsonMode,
      streaming: settings.enableStreaming,
    });

    if (!savedKey) {
      setShowApiKeyModal(true);
    }
  }, []);

  // Fetch models when API key changes
  useEffect(() => {
    if (apiKey) {
      const service = new OpenRouterService(apiKey);
      service.getModels()
        .then(setModels)
        .catch(console.error);
    }
  }, [apiKey]);

  // Handle API key save
  const handleSaveApiKey = useCallback((key: string) => {
    storageService.setApiKey(key);
    setApiKey(key);
    setShowApiKeyModal(false);
  }, []);

  // Handle model selection change
  const handleModelsChange = useCallback((newModels: string[]) => {
    setSelectedModels(newModels);
    storageService.setSelectedModels(newModels);
  }, []);

  // Handle running tests
  const handleRunTests = useCallback(async () => {
    if (!apiKey || selectedModels.length === 0 || !prompt.trim()) {
      return;
    }

    setIsLoading(true);
    setResults([]);
    setStreamingContent({});
    setLoadingModels(
      selectedModels.reduce((acc, id) => ({ ...acc, [id]: 'loading' as const }), {})
    );

    const service = new OpenRouterService(apiKey);

    try {
      const responses = await service.compareModels(
        selectedModels,
        prompt,
        options,
        (modelId, status) => {
          setLoadingModels(prev => ({ ...prev, [modelId]: status }));
        },
        options.streaming
          ? (modelId, chunk) => {
              setStreamingContent(prev => ({
                ...prev,
                [modelId]: (prev[modelId] || '') + chunk,
              }));
            }
          : undefined
      );

      setResults(responses);

      // Save to history
      const session: ComparisonSession = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        prompt,
        options: {
          jsonMode: options.jsonMode ?? false,
          streaming: options.streaming ?? false,
          temperature: options.temperature,
          maxTokens: options.maxTokens,
        },
        selectedModels,
        responses,
        totalCost: responses.reduce((sum, r) => sum + r.metadata.cost, 0),
      };

      storageService.addToHistory(session);
      setHistory(storageService.getHistory());
    } catch (error) {
      console.error('Error running tests:', error);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, selectedModels, prompt, options]);

  // Handle loading from history
  const handleLoadFromHistory = useCallback((session: ComparisonSession) => {
    setPrompt(session.prompt);
    setSelectedModels(session.selectedModels);
    setOptions(session.options);
    setResults(session.responses);
    setShowHistoryModal(false);
  }, []);

  // Clear results
  const handleClearResults = useCallback(() => {
    setResults([]);
    setStreamingContent({});
    setLoadingModels({});
  }, []);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <Header
        apiKey={apiKey}
        historyCount={history.length}
        onApiKeyClick={() => setShowApiKeyModal(true)}
        onHistoryClick={() => setShowHistoryModal(true)}
        onSettingsClick={() => setShowSettingsModal(true)}
      />

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <PromptSection
          prompt={prompt}
          options={options}
          onPromptChange={setPrompt}
          onOptionsChange={setOptions}
        />

        <ModelSelector
          models={models}
          selectedModels={selectedModels}
          onModelsChange={handleModelsChange}
          onRunTests={handleRunTests}
          isLoading={isLoading}
          disabled={!apiKey || !prompt.trim()}
        />

        <ResultsSection
          results={results}
          loadingModels={loadingModels}
          streamingContent={streamingContent}
          isLoading={isLoading}
          onClear={handleClearResults}
        />
      </main>

      {/* Modals */}
      {showApiKeyModal && (
        <ApiKeyModal
          currentKey={apiKey}
          onSave={handleSaveApiKey}
          onClose={() => setShowApiKeyModal(false)}
        />
      )}

      {showHistoryModal && (
        <HistoryModal
          history={history}
          onLoad={handleLoadFromHistory}
          onClear={() => {
            storageService.clearHistory();
            setHistory([]);
          }}
          onClose={() => setShowHistoryModal(false)}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </div>
  );
}

export default App;
