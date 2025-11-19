import { useState } from 'react';
import { X, Eye, EyeOff, ExternalLink, Shield } from 'lucide-react';

interface ApiKeyModalProps {
  currentKey: string | null;
  onSave: (key: string) => void;
  onClose: () => void;
}

export default function ApiKeyModal({ currentKey, onSave, onClose }: ApiKeyModalProps) {
  const [key, setKey] = useState(currentKey || '');
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const handleSave = async () => {
    if (!key.trim()) return;

    setIsValidating(true);
    // Simple validation - just check if it looks like an API key
    if (key.startsWith('sk-')) {
      onSave(key.trim());
    } else {
      alert('Please enter a valid OpenRouter API key (starts with sk-)');
    }
    setIsValidating(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-primary rounded-card w-full max-w-md border border-border-color shadow-xl animate-fadeIn">
        <div className="flex items-center justify-between p-4 border-b border-border-color">
          <h2 className="text-lg font-semibold">OpenRouter API Key</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-bg-tertiary rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-start gap-3 p-3 bg-bg-tertiary rounded-input">
            <Shield className="text-accent-primary mt-0.5" size={18} />
            <p className="text-sm text-text-secondary">
              Your API key is stored locally in your browser and never sent to any server except OpenRouter.
            </p>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">
              API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="sk-or-v1-..."
                className="w-full bg-bg-secondary border border-border-color rounded-input px-3 py-2 pr-10 text-sm focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-tertiary hover:text-text-secondary"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-accent-primary hover:text-accent-secondary transition-colors"
          >
            <span>Get an API key from OpenRouter</span>
            <ExternalLink size={14} />
          </a>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-border-color">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!key.trim() || isValidating}
            className="px-4 py-2 text-sm bg-accent-primary text-white rounded-button hover:bg-accent-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isValidating ? 'Validating...' : 'Save Key'}
          </button>
        </div>
      </div>
    </div>
  );
}
