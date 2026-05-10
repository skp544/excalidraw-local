import { useState } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Wand2, X } from 'lucide-react';

import { Button } from '@/components/ui/Button.jsx';
import { Textarea } from '@/components/ui/Input.jsx';
import { api, apiError } from '@/lib/api.js';
import { AI_FEATURES } from '@excalidrow/shared/constants';

/**
 * Minimal AI panel that hits the placeholder /ai/generate endpoint. The
 * server currently returns a 202 with `status: not-implemented`, which we
 * surface as a friendly hint. When a model is wired in, the only change
 * needed here is to render the returned elements via excalidrawAPI.
 */
export function AISidebar({ open, onClose, excalidrawApi }) {
  const [feature, setFeature] = useState(AI_FEATURES[0].id);
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [response, setResponse] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || !excalidrawApi) return;
    setBusy(true);
    setResponse(null);
    try {
      const { data } = await api.post('/ai/generate', { feature, prompt });
      setResponse(data);
      if (data?.status === 'ok' && Array.isArray(data?.elements)) {
        excalidrawApi.updateScene({ elements: data.elements });
      } else {
        toast('AI is wired but no model is connected yet.', { icon: '🪄' });
      }
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          key="ai"
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.21, 1.02, 0.73, 1] }}
          className="absolute right-3 top-3 z-30 flex h-[calc(100%-1.5rem)] w-[320px] flex-col overflow-hidden rounded-2xl border border-ink-200/70 bg-white/90 shadow-ring backdrop-blur-xl dark:border-ink-700/60 dark:bg-ink-900/85"
        >
          <header className="flex items-center justify-between border-b border-ink-100 px-4 py-3 dark:border-ink-800">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-violetx-500 to-indigo-500 text-white">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <h3 className="font-display text-sm font-semibold tracking-tight">AI assist</h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <form onSubmit={submit} className="flex flex-1 flex-col gap-3 p-4">
            <div>
              <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">
                Feature
              </span>
              <select
                className="field-input"
                value={feature}
                onChange={(e) => setFeature(e.target.value)}
              >
                {AI_FEATURES.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">
                Prompt
              </span>
              <Textarea
                rows={6}
                placeholder="Describe the diagram you'd like to generate."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={busy || !prompt.trim()}>
              <Wand2 className="h-4 w-4" />
              {busy ? 'Thinking…' : 'Generate'}
            </Button>

            {response && (
              <div className="rounded-xl border border-ink-200/70 bg-ink-50 p-3 text-xs text-ink-600 dark:border-ink-700/60 dark:bg-ink-800/40 dark:text-ink-300">
                {response.message ?? 'Response received.'}
              </div>
            )}
            <p className="text-[10.5px] leading-relaxed text-ink-400">
              The AI endpoint is plumbed end-to-end. Wire a local Ollama or cloud model into
              <code className="ml-1 rounded bg-ink-100 px-1 py-0.5 text-[10px] dark:bg-ink-800">apps/api/src/controllers/ai.controller.js</code>
              to enable real generation.
            </p>
          </form>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
