import { Key, History, Settings } from 'lucide-react';

interface HeaderProps {
  apiKey: string | null;
  historyCount: number;
  onApiKeyClick: () => void;
  onHistoryClick: () => void;
  onSettingsClick: () => void;
}

export default function Header({
  apiKey,
  historyCount,
  onApiKeyClick,
  onHistoryClick,
  onSettingsClick,
}: HeaderProps) {
  return (
    <header className="border-b border-border-color bg-bg-primary shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎯</span>
          <h1 className="text-xl font-semibold text-text-primary">AI Model I Like</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onApiKeyClick}
            className={`flex items-center gap-2 px-3 py-2 rounded-button text-sm font-medium transition-colors ${
              apiKey
                ? 'bg-bg-tertiary hover:bg-border-color text-text-secondary'
                : 'bg-accent-primary text-white hover:bg-accent-secondary'
            }`}
          >
            <Key size={16} />
            <span>{apiKey ? 'API Key' : 'Set API Key'}</span>
          </button>

          <button
            onClick={onHistoryClick}
            className="flex items-center gap-2 px-3 py-2 rounded-button text-sm font-medium bg-bg-tertiary hover:bg-border-color text-text-secondary transition-colors"
          >
            <History size={16} />
            <span>History ({historyCount})</span>
          </button>

          <button
            onClick={onSettingsClick}
            className="flex items-center gap-2 px-3 py-2 rounded-button text-sm font-medium bg-bg-tertiary hover:bg-border-color text-text-secondary transition-colors"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
