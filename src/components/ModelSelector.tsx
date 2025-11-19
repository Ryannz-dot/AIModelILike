import { useState, useMemo } from 'react';
import { X, Play, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { AIModel } from '../types';
import { BUILT_IN_PRESETS } from '../services/storage';

interface ModelSelectorProps {
  models: AIModel[];
  selectedModels: string[];
  onModelsChange: (models: string[]) => void;
  onRunTests: () => void;
  isLoading: boolean;
  disabled: boolean;
}

export default function ModelSelector({
  models,
  selectedModels,
  onModelsChange,
  onRunTests,
  isLoading,
  disabled,
}: ModelSelectorProps) {
  const [showBrowser, setShowBrowser] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(new Set(['OpenAI', 'Anthropic', 'Google']));

  // Group models by provider
  const modelsByProvider = useMemo(() => {
    const grouped: Record<string, AIModel[]> = {};
    models.forEach(model => {
      if (!grouped[model.provider]) {
        grouped[model.provider] = [];
      }
      grouped[model.provider].push(model);
    });
    return grouped;
  }, [models]);

  // Filter models by search
  const filteredModels = useMemo(() => {
    if (!searchQuery) return modelsByProvider;

    const query = searchQuery.toLowerCase();
    const filtered: Record<string, AIModel[]> = {};

    Object.entries(modelsByProvider).forEach(([provider, providerModels]) => {
      const matches = providerModels.filter(
        m => m.name.toLowerCase().includes(query) || m.id.toLowerCase().includes(query)
      );
      if (matches.length > 0) {
        filtered[provider] = matches;
      }
    });

    return filtered;
  }, [modelsByProvider, searchQuery]);

  const removeModel = (modelId: string) => {
    onModelsChange(selectedModels.filter(id => id !== modelId));
  };

  const toggleModel = (modelId: string) => {
    if (selectedModels.includes(modelId)) {
      onModelsChange(selectedModels.filter(id => id !== modelId));
    } else {
      onModelsChange([...selectedModels, modelId]);
    }
  };

  const applyPreset = (modelIds: string[]) => {
    onModelsChange(modelIds);
  };

  const toggleProvider = (provider: string) => {
    const newExpanded = new Set(expandedProviders);
    if (newExpanded.has(provider)) {
      newExpanded.delete(provider);
    } else {
      newExpanded.add(provider);
    }
    setExpandedProviders(newExpanded);
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free';
    if (price < 0.001) return `$${(price * 1000).toFixed(4)}/1K`;
    return `$${price.toFixed(4)}/1K`;
  };

  const getModelById = (id: string) => models.find(m => m.id === id);

  return (
    <section className="bg-bg-secondary border border-border-color rounded-card p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold">Models</h2>
        <button
          onClick={() => setShowBrowser(true)}
          className="text-sm text-accent-primary hover:text-accent-secondary transition-colors"
        >
          Browse Models
        </button>
      </div>
      <p className="text-sm text-text-secondary mb-4">
        Add models to test (e.g., openai/gpt-4, anthropic/claude)
      </p>

      {/* Selected models */}
      <div className="space-y-2 mb-4">
        {selectedModels.length === 0 ? (
          <p className="text-sm text-text-tertiary py-4 text-center">
            No models selected. Click "Browse Models" or use a preset below.
          </p>
        ) : (
          selectedModels.map(modelId => {
            const model = getModelById(modelId);
            return (
              <div
                key={modelId}
                className="flex items-center justify-between bg-bg-primary border border-border-color rounded-input px-4 py-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span>{model?.icon || '🔹'}</span>
                    <span className="text-sm font-medium">{model?.name || modelId}</span>
                  </div>
                  {model && (
                    <p className="text-xs text-text-tertiary mt-1">
                      {formatPrice(model.pricing.prompt)} / {formatPrice(model.pricing.completion)} per 1K tokens
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeModel(modelId)}
                  className="p-1 text-text-tertiary hover:text-error transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Quick presets */}
      <div className="mb-6">
        <p className="text-xs text-text-tertiary mb-2">Quick Presets:</p>
        <div className="flex flex-wrap gap-2">
          {BUILT_IN_PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.modelIds)}
              className="px-3 py-1.5 text-xs bg-bg-tertiary rounded-small hover:bg-opacity-80 transition-colors"
              title={preset.description}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Run button */}
      <button
        onClick={onRunTests}
        disabled={disabled || selectedModels.length === 0 || isLoading}
        className="w-full flex items-center justify-center gap-2 py-3 bg-accent-primary text-white font-medium rounded-button hover:bg-accent-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Running Tests...</span>
          </>
        ) : (
          <>
            <Play size={18} />
            <span>Run Tests</span>
          </>
        )}
      </button>

      {/* Model browser modal */}
      {showBrowser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-secondary rounded-card w-full max-w-2xl max-h-[80vh] border border-border-color animate-fadeIn flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border-color">
              <h2 className="text-lg font-semibold">Browse Models</h2>
              <button
                onClick={() => setShowBrowser(false)}
                className="p-1 hover:bg-bg-tertiary rounded transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 border-b border-border-color">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search models..."
                  className="w-full bg-bg-primary border border-border-color rounded-input pl-10 pr-4 py-2 text-sm focus:border-accent-primary transition-colors"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {Object.entries(filteredModels).map(([provider, providerModels]) => (
                <div key={provider} className="mb-4">
                  <button
                    onClick={() => toggleProvider(provider)}
                    className="flex items-center gap-2 w-full text-left font-medium mb-2 hover:text-accent-primary transition-colors"
                  >
                    {expandedProviders.has(provider) ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                    <span>{provider} ({providerModels.length} models)</span>
                  </button>

                  {expandedProviders.has(provider) && (
                    <div className="space-y-2 ml-6">
                      {providerModels.map(model => (
                        <button
                          key={model.id}
                          onClick={() => toggleModel(model.id)}
                          className={`w-full flex items-center justify-between p-3 rounded-input border transition-colors ${
                            selectedModels.includes(model.id)
                              ? 'bg-accent-primary/10 border-accent-primary'
                              : 'bg-bg-primary border-border-color hover:border-text-tertiary'
                          }`}
                        >
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <span>{model.icon}</span>
                              <span className="text-sm font-medium">{model.name}</span>
                            </div>
                            <p className="text-xs text-text-tertiary mt-1">
                              {model.context_length.toLocaleString()} context • {formatPrice(model.pricing.prompt)}/{formatPrice(model.pricing.completion)}
                            </p>
                          </div>
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selectedModels.includes(model.id)
                              ? 'bg-accent-primary border-accent-primary text-white'
                              : 'border-border-color'
                          }`}>
                            {selectedModels.includes(model.id) && (
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {Object.keys(filteredModels).length === 0 && (
                <p className="text-center text-text-tertiary py-8">
                  {models.length === 0 ? 'Loading models...' : 'No models found'}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between p-4 border-t border-border-color">
              <span className="text-sm text-text-secondary">
                {selectedModels.length} model{selectedModels.length !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setShowBrowser(false)}
                className="px-4 py-2 text-sm bg-accent-primary text-white rounded-button hover:bg-accent-secondary transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
