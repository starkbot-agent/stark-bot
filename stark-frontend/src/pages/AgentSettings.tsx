import { useState, useEffect, FormEvent } from 'react';
import { Save } from 'lucide-react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { getAgentSettings, updateAgentSettings } from '@/lib/api';

const ENDPOINTS = {
  kimi: 'https://kimi.defirelay.com/api/v1/chat/completions',
  llama: 'https://llama.defirelay.com/api/v1/chat/completions',
};

type EndpointOption = 'kimi' | 'llama' | 'custom';
type ModelArchetype = 'kimi' | 'llama' | 'claude' | 'openai';

interface Settings {
  endpoint?: string;
  model_archetype?: string;
  max_tokens?: number;
  has_secret_key?: boolean;
}

export default function AgentSettings() {
  const [endpointOption, setEndpointOption] = useState<EndpointOption>('kimi');
  const [customEndpoint, setCustomEndpoint] = useState('');
  const [modelArchetype, setModelArchetype] = useState<ModelArchetype>('kimi');
  const [maxTokens, setMaxTokens] = useState(40000);
  const [secretKey, setSecretKey] = useState('');
  const [hasExistingSecretKey, setHasExistingSecretKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  // Lock archetype for known endpoints
  useEffect(() => {
    if (endpointOption === 'kimi') {
      setModelArchetype('kimi');
    } else if (endpointOption === 'llama') {
      setModelArchetype('llama');
    }
  }, [endpointOption]);

  // Archetype is only selectable for custom endpoints
  const isArchetypeLocked = endpointOption !== 'custom';

  const loadSettings = async () => {
    try {
      const data = await getAgentSettings() as Settings;

      // Determine which endpoint option is being used
      if (data.endpoint === ENDPOINTS.kimi) {
        setEndpointOption('kimi');
      } else if (data.endpoint === ENDPOINTS.llama) {
        setEndpointOption('llama');
      } else if (data.endpoint) {
        setEndpointOption('custom');
        setCustomEndpoint(data.endpoint);
      } else {
        setEndpointOption('kimi');
      }

      // Set secret key indicator
      setHasExistingSecretKey(data.has_secret_key ?? false);

      // Set model archetype
      if (data.model_archetype && ['kimi', 'llama', 'claude', 'openai'].includes(data.model_archetype)) {
        setModelArchetype(data.model_archetype as ModelArchetype);
      }

      // Set max tokens
      if (data.max_tokens && data.max_tokens > 0) {
        setMaxTokens(data.max_tokens);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    let endpoint: string;
    if (endpointOption === 'kimi') {
      endpoint = ENDPOINTS.kimi;
    } else if (endpointOption === 'llama') {
      endpoint = ENDPOINTS.llama;
    } else {
      endpoint = customEndpoint;
    }

    if (endpointOption === 'custom' && !customEndpoint.trim()) {
      setMessage({ type: 'error', text: 'Please enter a custom endpoint URL' });
      setIsSaving(false);
      return;
    }

    try {
      // Enforce archetype for known endpoints
      const archetype = endpointOption === 'kimi' ? 'kimi'
        : endpointOption === 'llama' ? 'llama'
        : modelArchetype;

      // Only include secret_key for custom endpoints, and only if provided
      const payload: {
        endpoint: string;
        model_archetype: string;
        max_tokens: number;
        secret_key?: string;
      } = {
        endpoint,
        model_archetype: archetype,
        max_tokens: maxTokens,
      };

      if (endpointOption === 'custom' && secretKey.trim()) {
        payload.secret_key = secretKey;
      }

      await updateAgentSettings(payload);
      setMessage({ type: 'success', text: 'Settings saved successfully' });

      // Update the indicator if we saved a new key
      if (endpointOption === 'custom' && secretKey.trim()) {
        setHasExistingSecretKey(true);
        setSecretKey(''); // Clear the input after saving
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-stark-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Agent Settings</h1>
        <p className="text-slate-400">Configure your AI agent endpoint and model type</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Endpoint Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Agent Endpoint
                </label>
                <select
                  value={endpointOption}
                  onChange={(e) => setEndpointOption(e.target.value as EndpointOption)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-stark-500 focus:border-transparent"
                >
                  <option value="kimi">kimi.defirelay.com</option>
                  <option value="llama">llama.defirelay.com</option>
                  <option value="custom">Custom Endpoint</option>
                </select>
              </div>

              {endpointOption === 'custom' && (
                <>
                  <Input
                    label="Custom Endpoint URL"
                    value={customEndpoint}
                    onChange={(e) => setCustomEndpoint(e.target.value)}
                    placeholder="https://your-endpoint.com/v1/chat/completions"
                  />
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      API Secret Key
                      {hasExistingSecretKey && (
                        <span className="ml-2 text-xs text-green-400">(configured)</span>
                      )}
                    </label>
                    <input
                      type="password"
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                      placeholder={hasExistingSecretKey ? "Leave empty to keep existing key" : "Leave empty if using x402 endpoint (defirelay.com)"}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-stark-500 focus:border-transparent"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Required for standard OpenAI-compatible endpoints. Not needed for x402 endpoints (defirelay.com).
                    </p>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Model Archetype
                </label>
                <select
                  value={modelArchetype}
                  onChange={(e) => setModelArchetype(e.target.value as ModelArchetype)}
                  disabled={isArchetypeLocked}
                  className={`w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-stark-500 focus:border-transparent ${isArchetypeLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <option value="kimi">Kimi</option>
                  <option value="llama">Llama</option>
                  <option value="claude">Claude</option>
                  <option value="openai">OpenAI</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  {isArchetypeLocked
                    ? `Locked to ${modelArchetype} for this endpoint`
                    : 'Select the model family to optimize prompt formatting'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Max Tokens
                </label>
                <input
                  type="number"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value) || 40000)}
                  min={1000}
                  max={200000}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-stark-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Maximum tokens for AI response (default: 40,000)
                </p>
              </div>
            </CardContent>
          </Card>

          {message && (
            <div
              className={`px-4 py-3 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                  : 'bg-red-500/20 border border-red-500/50 text-red-400'
              }`}
            >
              {message.text}
            </div>
          )}

          <Button type="submit" isLoading={isSaving} className="w-fit">
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
