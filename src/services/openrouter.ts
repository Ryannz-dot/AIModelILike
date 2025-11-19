import { AIModel, ModelResponse, CompletionOptions } from '../types';
import { storageService } from './storage';

const BASE_URL = 'https://openrouter.ai/api/v1';

// Transform OpenRouter model data to our format
function transformModel(model: Record<string, unknown>): AIModel {
  const pricing = model.pricing as Record<string, string> | undefined;
  const id = model.id as string;
  const provider = id.split('/')[0];

  // Map provider to display name and icon
  const providerMap: Record<string, { name: string; icon: string }> = {
    'openai': { name: 'OpenAI', icon: '🤖' },
    'anthropic': { name: 'Anthropic', icon: '🧠' },
    'google': { name: 'Google', icon: '✨' },
    'meta-llama': { name: 'Meta', icon: '🦙' },
    'mistralai': { name: 'Mistral', icon: '🌬️' },
    'cohere': { name: 'Cohere', icon: '🔷' },
    'deepseek': { name: 'DeepSeek', icon: '🔍' },
    'perplexity': { name: 'Perplexity', icon: '🔮' },
  };

  const providerInfo = providerMap[provider] || { name: provider, icon: '🔹' };

  return {
    id: id,
    name: model.name as string || id,
    provider: providerInfo.name,
    description: model.description as string | undefined,
    pricing: {
      prompt: parseFloat(pricing?.prompt || '0'),
      completion: parseFloat(pricing?.completion || '0'),
      currency: 'USD',
    },
    context_length: (model.context_length as number) || 4096,
    capabilities: {
      streaming: true,
      vision: (model.architecture as Record<string, unknown>)?.modality === 'multimodal',
      functionCalling: false,
      jsonMode: true,
    },
    icon: providerInfo.icon,
    tags: [],
  };
}

// Calculate cost based on usage
function calculateCost(
  usage: { prompt_tokens?: number; completion_tokens?: number } | null,
  model: AIModel
): number {
  if (!usage) return 0;
  const promptCost = ((usage.prompt_tokens || 0) / 1000) * model.pricing.prompt;
  const completionCost = ((usage.completion_tokens || 0) / 1000) * model.pricing.completion;
  return promptCost + completionCost;
}

export class OpenRouterService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Fetch available models
  async getModels(forceRefresh = false): Promise<AIModel[]> {
    const cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

    if (!forceRefresh) {
      const cached = storageService.getModelsCache();
      if (cached && Date.now() - cached.timestamp < cacheExpiry) {
        return (cached.data as Record<string, unknown>[]).map(transformModel);
      }
    }

    const response = await fetch(`${BASE_URL}/models`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'AI Model I Like',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data = await response.json();
    storageService.setModelsCache(data.data);
    return data.data.map(transformModel);
  }

  // Chat completion (non-streaming)
  async chatCompletion(
    modelId: string,
    prompt: string,
    options?: CompletionOptions
  ): Promise<ModelResponse> {
    const startTime = Date.now();

    const requestBody: Record<string, unknown> = {
      model: modelId,
      messages: [{ role: 'user', content: prompt }],
    };

    if (options?.temperature !== undefined) {
      requestBody.temperature = options.temperature;
    }

    if (options?.maxTokens !== undefined) {
      requestBody.max_tokens = options.maxTokens;
    }

    if (options?.jsonMode) {
      requestBody.response_format = { type: 'json_object' };
    }

    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'AI Model I Like',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API error: ${response.statusText}`);
    }

    const data = await response.json();
    const responseTime = Date.now() - startTime;

    // Get model info for cost calculation
    const models = await this.getModels();
    const model = models.find(m => m.id === modelId);

    const usage = data.usage || {};
    const cost = model ? calculateCost(usage, model) : 0;

    return {
      modelId,
      modelName: model?.name || modelId,
      content: data.choices[0]?.message?.content || '',
      rawResponse: data,
      metadata: {
        responseTime,
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0,
        cost,
      },
    };
  }

  // Streaming chat completion
  async chatCompletionStream(
    modelId: string,
    prompt: string,
    onChunk: (chunk: string) => void,
    options?: CompletionOptions
  ): Promise<ModelResponse> {
    const startTime = Date.now();

    const requestBody: Record<string, unknown> = {
      model: modelId,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    };

    if (options?.temperature !== undefined) {
      requestBody.temperature = options.temperature;
    }

    if (options?.maxTokens !== undefined) {
      requestBody.max_tokens = options.maxTokens;
    }

    if (options?.jsonMode) {
      requestBody.response_format = { type: 'json_object' };
    }

    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'AI Model I Like',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let fullContent = '';
    let usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content || '';
            if (content) {
              fullContent += content;
              onChunk(content);
            }
            if (parsed.usage) {
              usage = parsed.usage;
            }
          } catch {
            // Skip parse errors for incomplete chunks
          }
        }
      }
    }

    const responseTime = Date.now() - startTime;

    // Get model info for cost calculation
    const models = await this.getModels();
    const model = models.find(m => m.id === modelId);
    const cost = model && usage ? calculateCost(usage, model) : 0;

    return {
      modelId,
      modelName: model?.name || modelId,
      content: fullContent,
      rawResponse: { fullContent, usage },
      metadata: {
        responseTime,
        promptTokens: usage?.prompt_tokens || 0,
        completionTokens: usage?.completion_tokens || 0,
        totalTokens: usage?.total_tokens || 0,
        cost,
      },
    };
  }

  // Compare multiple models
  async compareModels(
    modelIds: string[],
    prompt: string,
    options: CompletionOptions,
    onProgress?: (modelId: string, status: 'loading' | 'complete' | 'error') => void,
    onChunk?: (modelId: string, chunk: string) => void
  ): Promise<ModelResponse[]> {
    const promises = modelIds.map(async (modelId) => {
      try {
        onProgress?.(modelId, 'loading');

        const response = options.streaming && onChunk
          ? await this.chatCompletionStream(
              modelId,
              prompt,
              (chunk) => onChunk(modelId, chunk),
              options
            )
          : await this.chatCompletion(modelId, prompt, options);

        onProgress?.(modelId, 'complete');
        return response;
      } catch (error) {
        onProgress?.(modelId, 'error');

        return {
          modelId,
          modelName: modelId,
          content: '',
          rawResponse: null,
          metadata: {
            responseTime: 0,
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            cost: 0,
          },
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    return Promise.all(promises);
  }

  // Validate API key
  async validateKey(): Promise<boolean> {
    try {
      await this.getModels(true);
      return true;
    } catch {
      return false;
    }
  }
}
