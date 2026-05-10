import { asyncHandler } from '../utils/async-handler.js';
import { HttpError } from '../utils/errors.js';
import { AI_FEATURES } from '@excalidrow/shared/constants';

/**
 * Placeholder AI service. The real implementation will plug in a model
 * (local Ollama / cloud LLM) and translate prompts into Excalidraw element
 * arrays. For now we surface a deterministic stub so the front-end can
 * wire up the UX flow without a server change later.
 */
export const aiCapabilities = asyncHandler(async (_req, res) => {
  res.json({ features: AI_FEATURES, status: 'placeholder' });
});

export const aiGenerate = asyncHandler(async (req, res) => {
  const { feature, prompt } = req.body;
  if (!feature || !prompt) throw HttpError.badRequest('feature and prompt are required');
  res.status(202).json({
    status: 'not-implemented',
    feature,
    promptPreview: prompt.slice(0, 200),
    message:
      'AI generation is wired but not yet connected to a model. The front-end can call this endpoint and degrade gracefully until a provider is configured.',
  });
});
