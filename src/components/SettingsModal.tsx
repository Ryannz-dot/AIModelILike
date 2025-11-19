import { useState, useEffect } from 'react';
import { X, Download, Upload, Trash2 } from 'lucide-react';
import { UserSettings } from '../types';
import { storageService } from '../services/storage';

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<UserSettings>(storageService.getSettings());
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    storageService.saveSettings(settings);
  }, [settings]);

  const handleExport = () => {
    const data = storageService.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aimodellike-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = storageService.importData(content);
      setImportStatus(success ? 'Import successful!' : 'Import failed. Invalid file format.');
      setTimeout(() => setImportStatus(null), 3000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      storageService.clearAll();
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-secondary rounded-card w-full max-w-md border border-border-color animate-fadeIn">
        <div className="flex items-center justify-between p-4 border-b border-border-color">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-bg-tertiary rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Default options */}
          <div>
            <h3 className="text-sm font-medium mb-3">Default Options</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableStreaming}
                  onChange={(e) => setSettings({ ...settings, enableStreaming: e.target.checked })}
                  className="w-4 h-4 rounded border-border-color bg-bg-primary text-accent-primary"
                />
                <span className="text-sm text-text-secondary">Enable streaming by default</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableJsonMode}
                  onChange={(e) => setSettings({ ...settings, enableJsonMode: e.target.checked })}
                  className="w-4 h-4 rounded border-border-color bg-bg-primary text-accent-primary"
                />
                <span className="text-sm text-text-secondary">Enable JSON mode by default</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoSaveHistory}
                  onChange={(e) => setSettings({ ...settings, autoSaveHistory: e.target.checked })}
                  className="w-4 h-4 rounded border-border-color bg-bg-primary text-accent-primary"
                />
                <span className="text-sm text-text-secondary">Auto-save to history</span>
              </label>
            </div>
          </div>

          {/* Cost alerts */}
          <div>
            <h3 className="text-sm font-medium mb-3">Cost Alerts</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.costAlerts.enabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    costAlerts: { ...settings.costAlerts, enabled: e.target.checked }
                  })}
                  className="w-4 h-4 rounded border-border-color bg-bg-primary text-accent-primary"
                />
                <span className="text-sm text-text-secondary">Enable cost alerts</span>
              </label>

              {settings.costAlerts.enabled && (
                <div className="ml-6 space-y-2">
                  <div>
                    <label className="text-xs text-text-tertiary">Alert threshold per request ($)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={settings.costAlerts.threshold}
                      onChange={(e) => setSettings({
                        ...settings,
                        costAlerts: { ...settings.costAlerts, threshold: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full mt-1 bg-bg-primary border border-border-color rounded-input px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-tertiary">Monthly budget ($)</label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={settings.costAlerts.monthlyBudget}
                      onChange={(e) => setSettings({
                        ...settings,
                        costAlerts: { ...settings.costAlerts, monthlyBudget: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full mt-1 bg-bg-primary border border-border-color rounded-input px-3 py-1.5 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Data management */}
          <div>
            <h3 className="text-sm font-medium mb-3">Data Management</h3>
            <div className="space-y-2">
              <button
                onClick={handleExport}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-bg-tertiary rounded-button hover:bg-opacity-80 transition-colors"
              >
                <Download size={16} />
                <span>Export Data</span>
              </button>

              <label className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-bg-tertiary rounded-button hover:bg-opacity-80 transition-colors cursor-pointer">
                <Upload size={16} />
                <span>Import Data</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>

              {importStatus && (
                <p className={`text-xs text-center ${importStatus.includes('successful') ? 'text-success' : 'text-error'}`}>
                  {importStatus}
                </p>
              )}

              <button
                onClick={handleClearAll}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm border border-error text-error rounded-button hover:bg-error/10 transition-colors"
              >
                <Trash2 size={16} />
                <span>Clear All Data</span>
              </button>
            </div>
          </div>

          {/* Privacy notice */}
          <div className="p-3 bg-bg-primary rounded-input">
            <p className="text-xs text-text-tertiary">
              All data is stored locally in your browser. Nothing is sent to any server except your API requests to OpenRouter.
            </p>
          </div>
        </div>

        <div className="flex justify-end p-4 border-t border-border-color">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-accent-primary text-white rounded-button hover:bg-accent-secondary transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
