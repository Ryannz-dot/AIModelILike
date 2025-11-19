import { useState } from 'react';
import { Copy, Trash2, Zap, DollarSign, Hash, CheckCircle, XCircle, Loader } from 'lucide-react';
import { ModelResponse } from '../types';
import ReactMarkdown from 'react-markdown';

interface ResultsSectionProps {
  results: ModelResponse[];
  loadingModels: Record<string, 'loading' | 'complete' | 'error'>;
  streamingContent: Record<string, string>;
  isLoading: boolean;
  onClear: () => void;
}

export default function ResultsSection({
  results,
  loadingModels,
  streamingContent,
  isLoading,
  onClear,
}: ResultsSectionProps) {
  const [viewModes, setViewModes] = useState<Record<string, 'formatted' | 'raw'>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const totalCost = results.reduce((sum, r) => sum + r.metadata.cost, 0);

  const copyToClipboard = async (text: string, modelId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(modelId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyAll = async () => {
    const text = results
      .map(r => `## ${r.modelName}\n\n${r.content}`)
      .join('\n\n---\n\n');
    await navigator.clipboard.writeText(text);
    setCopiedId('all');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleViewMode = (modelId: string) => {
    setViewModes(prev => ({
      ...prev,
      [modelId]: prev[modelId] === 'raw' ? 'formatted' : 'raw',
    }));
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatCost = (cost: number) => {
    if (cost === 0) return 'Free';
    if (cost < 0.001) return `$${cost.toFixed(6)}`;
    return `$${cost.toFixed(4)}`;
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toString();
  };

  // Show loading states during test run
  const showLoadingCards = isLoading && results.length === 0;

  return (
    <section className="bg-bg-secondary border border-border-color rounded-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Results</h2>
        {results.length > 0 && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-secondary">
              <DollarSign className="inline w-4 h-4" /> Total: {formatCost(totalCost)}
            </span>
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={copyAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-bg-tertiary rounded-small hover:bg-opacity-80 transition-colors"
          >
            <Copy size={14} />
            <span>{copiedId === 'all' ? 'Copied!' : 'Copy All'}</span>
          </button>
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-bg-tertiary rounded-small hover:bg-opacity-80 transition-colors text-error"
          >
            <Trash2 size={14} />
            <span>Clear</span>
          </button>
        </div>
      )}

      {results.length === 0 && !showLoadingCards ? (
        <div className="text-center py-12">
          <p className="text-text-tertiary">
            No results yet. Configure your prompt and models, then click "Run Tests".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {showLoadingCards
            ? Object.entries(loadingModels).map(([modelId, status]) => (
                <div
                  key={modelId}
                  className="bg-bg-primary border border-border-color rounded-card p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-sm">{modelId.split('/').pop()}</span>
                    {status === 'loading' && (
                      <Loader className="w-4 h-4 animate-spin text-accent-primary" />
                    )}
                    {status === 'complete' && (
                      <CheckCircle className="w-4 h-4 text-success" />
                    )}
                    {status === 'error' && (
                      <XCircle className="w-4 h-4 text-error" />
                    )}
                  </div>
                  {streamingContent[modelId] ? (
                    <div className="text-sm text-text-secondary max-h-48 overflow-y-auto">
                      <ReactMarkdown className="markdown-content">
                        {streamingContent[modelId]}
                      </ReactMarkdown>
                    </div>
                  ) : status === 'loading' ? (
                    <div className="animate-pulse space-y-2">
                      <div className="h-3 bg-bg-tertiary rounded w-3/4" />
                      <div className="h-3 bg-bg-tertiary rounded w-1/2" />
                      <div className="h-3 bg-bg-tertiary rounded w-5/6" />
                    </div>
                  ) : null}
                </div>
              ))
            : results.map(result => (
                <div
                  key={result.modelId}
                  className={`bg-bg-primary border rounded-card p-4 ${
                    result.error ? 'border-error' : 'border-border-color'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-sm">{result.modelName}</span>
                    {result.error ? (
                      <XCircle className="w-4 h-4 text-error" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-success" />
                    )}
                  </div>

                  {/* Metrics */}
                  <div className="flex flex-wrap gap-3 text-xs text-text-tertiary mb-3">
                    <span className="flex items-center gap-1">
                      <Zap size={12} /> {formatTime(result.metadata.responseTime)}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign size={12} /> {formatCost(result.metadata.cost)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Hash size={12} /> {formatTokens(result.metadata.totalTokens)} tok
                    </span>
                  </div>

                  {/* View mode toggle */}
                  {!result.error && (
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => toggleViewMode(result.modelId)}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          viewModes[result.modelId] !== 'raw'
                            ? 'bg-bg-tertiary text-text-primary'
                            : 'text-text-tertiary hover:text-text-secondary'
                        }`}
                      >
                        Formatted
                      </button>
                      <button
                        onClick={() => toggleViewMode(result.modelId)}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          viewModes[result.modelId] === 'raw'
                            ? 'bg-bg-tertiary text-text-primary'
                            : 'text-text-tertiary hover:text-text-secondary'
                        }`}
                      >
                        Raw
                      </button>
                    </div>
                  )}

                  {/* Content */}
                  <div className="text-sm max-h-64 overflow-y-auto mb-3">
                    {result.error ? (
                      <p className="text-error">{result.error}</p>
                    ) : viewModes[result.modelId] === 'raw' ? (
                      <pre className="whitespace-pre-wrap font-mono text-xs text-text-secondary">
                        {result.content}
                      </pre>
                    ) : (
                      <ReactMarkdown className="markdown-content text-text-secondary">
                        {result.content}
                      </ReactMarkdown>
                    )}
                  </div>

                  {/* Actions */}
                  {!result.error && (
                    <button
                      onClick={() => copyToClipboard(result.content, result.modelId)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-bg-tertiary rounded-small hover:bg-opacity-80 transition-colors"
                    >
                      <Copy size={12} />
                      <span>{copiedId === result.modelId ? 'Copied!' : 'Copy'}</span>
                    </button>
                  )}
                </div>
              ))}
        </div>
      )}
    </section>
  );
}
