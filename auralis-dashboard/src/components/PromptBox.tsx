import { ChevronDown, Mic, SendHorizontal } from 'lucide-react';
import { useState } from 'react';
import { MODELS } from '../data';

export function PromptBox({ onSubmit }: { onSubmit: (prompt: string, model: string) => void }) {
  const [value, setValue] = useState('');
  const [model, setModel] = useState<string>(MODELS[0]);

  const submit = () => {
    const text = value.trim();
    if (!text) return;
    onSubmit(text, model);
    setValue('');
  };

  return (
    <form
      className="prompt"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <textarea
        value={value}
        rows={2}
        placeholder="Describe your AI content or event…"
        aria-label="Describe your AI content or event"
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
      />
      <div className="prompt-row">
        <label className="model-select">
          <span className="sr-only">Model</span>
          <select value={model} onChange={(e) => setModel(e.target.value)}>
            {MODELS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          <ChevronDown size={14} aria-hidden />
        </label>
        <button type="button" className="icon-btn small" aria-label="Voice input">
          <Mic size={16} strokeWidth={1.75} />
        </button>
        <button type="submit" className="send-btn" aria-label="Run" disabled={!value.trim()}>
          <SendHorizontal size={18} strokeWidth={2} />
        </button>
      </div>
    </form>
  );
}
