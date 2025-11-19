import { useState } from 'react';
import { X, Search, Trash2, ExternalLink, DollarSign } from 'lucide-react';
import { ComparisonSession } from '../types';

interface HistoryModalProps {
  history: ComparisonSession[];
  onLoad: (session: ComparisonSession) => void;
  onClear: () => void;
  onClose: () => void;
}

export default function HistoryModal({
  history,
  onLoad,
  onClear,
  onClose,
}: HistoryModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredHistory = history.filter(session =>
    session.prompt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: Date) => {
    const now = new Date();
    const d = new Date(date);
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return d.toLocaleDateString([], { weekday: 'long' });
    } else {
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const formatCost = (cost: number) => {
    if (cost === 0) return 'Free';
    return `$${cost.toFixed(3)}`;
  };

  const truncatePrompt = (prompt: string, maxLength = 60) => {
    if (prompt.length <= maxLength) return prompt;
    return prompt.substring(0, maxLength) + '...';
  };

  // Group history by date
  const groupedHistory = filteredHistory.reduce((groups, session) => {
    const date = new Date(session.timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    let groupKey: string;
    if (diffDays === 0) {
      groupKey = 'Today';
    } else if (diffDays === 1) {
      groupKey = 'Yesterday';
    } else if (diffDays < 7) {
      groupKey = 'Last 7 Days';
    } else {
      groupKey = 'Older';
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(session);
    return groups;
  }, {} as Record<string, ComparisonSession[]>);

  const totalSpent = history.reduce((sum, s) => sum + s.totalCost, 0);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-primary rounded-card w-full max-w-2xl max-h-[80vh] border border-border-color shadow-xl animate-fadeIn flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border-color">
          <h2 className="text-lg font-semibold">History ({history.length})</h2>
          <button
            onClick={onClose}
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
              placeholder="Search history..."
              className="w-full bg-bg-secondary border border-border-color rounded-input pl-10 pr-4 py-2 text-sm focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filteredHistory.length === 0 ? (
            <p className="text-center text-text-tertiary py-8">
              {history.length === 0 ? 'No history yet' : 'No results found'}
            </p>
          ) : (
            Object.entries(groupedHistory).map(([groupName, sessions]) => (
              <div key={groupName} className="mb-6">
                <h3 className="text-xs font-medium text-text-tertiary mb-2">{groupName}</h3>
                <div className="space-y-2">
                  {sessions.map(session => (
                    <button
                      key={session.id}
                      onClick={() => onLoad(session)}
                      className="w-full flex items-center justify-between p-3 bg-bg-primary border border-border-color rounded-input hover:border-text-tertiary transition-colors text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-text-tertiary">
                            {formatDate(session.timestamp)}
                          </span>
                          <span className="text-xs text-accent-primary">
                            {formatCost(session.totalCost)}
                          </span>
                        </div>
                        <p className="text-sm truncate">{truncatePrompt(session.prompt)}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {session.responses.map(r => {
                            const provider = r.modelId.split('/')[0];
                            const icons: Record<string, string> = {
                              'openai': '🤖',
                              'anthropic': '🧠',
                              'google': '✨',
                              'meta-llama': '🦙',
                            };
                            return (
                              <span key={r.modelId} className="text-xs" title={r.modelName}>
                                {icons[provider] || '🔹'}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      <ExternalLink size={16} className="text-text-tertiary ml-2 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between p-4 border-t border-border-color">
          <div className="text-sm text-text-secondary">
            <DollarSign className="inline w-4 h-4" /> Total spent: {formatCost(totalSpent)}
          </div>
          <div className="flex items-center gap-3">
            {history.length > 0 && (
              <button
                onClick={onClear}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-error hover:bg-error/10 rounded-button transition-colors"
              >
                <Trash2 size={14} />
                <span>Clear All</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-bg-tertiary rounded-button hover:bg-opacity-80 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
