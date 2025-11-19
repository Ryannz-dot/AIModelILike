import { CompletionOptions } from '../types';

interface PromptSectionProps {
  prompt: string;
  options: CompletionOptions;
  onPromptChange: (prompt: string) => void;
  onOptionsChange: (options: CompletionOptions) => void;
}

export default function PromptSection({
  prompt,
  options,
  onPromptChange,
  onOptionsChange,
}: PromptSectionProps) {
  return (
    <section className="bg-bg-secondary border border-border-color rounded-card p-6">
      <h2 className="text-lg font-semibold mb-1">Prompt</h2>
      <p className="text-sm text-text-secondary mb-4">
        Enter the prompt to test across models
      </p>

      <textarea
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        placeholder="Enter your prompt here..."
        className="w-full h-32 bg-bg-primary border border-border-color rounded-input px-4 py-3 text-sm resize-y focus:border-accent-primary transition-colors placeholder:text-text-tertiary"
      />

      <div className="flex flex-wrap gap-4 mt-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={options.jsonMode}
            onChange={(e) => onOptionsChange({ ...options, jsonMode: e.target.checked })}
            className="w-4 h-4 rounded border-border-color bg-bg-primary text-accent-primary focus:ring-accent-primary focus:ring-offset-bg-secondary"
          />
          <span className="text-sm text-text-secondary">Enable JSON output format</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={options.streaming}
            onChange={(e) => onOptionsChange({ ...options, streaming: e.target.checked })}
            className="w-4 h-4 rounded border-border-color bg-bg-primary text-accent-primary focus:ring-accent-primary focus:ring-offset-bg-secondary"
          />
          <span className="text-sm text-text-secondary">Enable streaming responses</span>
        </label>
      </div>
    </section>
  );
}
