import { useState, useEffect } from 'react';
import { Key, Trash2, Plus, Clock } from 'lucide-react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { getApiKeys, upsertApiKey, deleteApiKey, getServiceConfigs, ApiKey, ServiceConfig } from '@/lib/api';

interface FlatKeyOption {
  keyName: string;
  label: string;
  serviceLabel: string;
  description: string;
  url: string;
}

function buildKnownKeyOptions(configs: ServiceConfig[]): FlatKeyOption[] {
  const options: FlatKeyOption[] = [];
  for (const config of configs) {
    for (const key of config.keys) {
      options.push({
        keyName: key.name,
        label: `${key.name} — ${config.label} ${key.label}`,
        serviceLabel: config.label,
        description: config.description,
        url: config.url,
      });
    }
  }
  return options;
}

function getServiceLabel(keyName: string, configs: ServiceConfig[]): string | null {
  for (const config of configs) {
    for (const key of config.keys) {
      if (key.name === keyName) return config.label;
    }
  }
  return null;
}

function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return ts;
  }
}

export default function ApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [serviceConfigs, setServiceConfigs] = useState<ServiceConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedOption, setSelectedOption] = useState(''); // key name or '__custom__'
  const [customKeyName, setCustomKeyName] = useState('');
  const [keyValue, setKeyValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [keysData, configsData] = await Promise.all([
        getApiKeys(),
        getServiceConfigs(),
      ]);
      setKeys(keysData);
      setServiceConfigs(configsData);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load API keys' });
    } finally {
      setIsLoading(false);
    }
  };

  const loadKeys = async () => {
    try {
      const data = await getApiKeys();
      setKeys(data);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load API keys' });
    }
  };

  const knownOptions = buildKnownKeyOptions(serviceConfigs);
  const selectedKnown = knownOptions.find(o => o.keyName === selectedOption);
  const isCustom = selectedOption === '__custom__';

  const resolvedKeyName = isCustom ? customKeyName.trim().toUpperCase() : selectedOption;

  const resetForm = () => {
    setShowAddForm(false);
    setSelectedOption('');
    setCustomKeyName('');
    setKeyValue('');
  };

  const handleSave = async () => {
    if (!resolvedKeyName) {
      setMessage({ type: 'error', text: 'Please select or enter a key name' });
      return;
    }
    if (!keyValue.trim()) {
      setMessage({ type: 'error', text: 'Please enter a key value' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      await upsertApiKey(resolvedKeyName, keyValue.trim());
      setMessage({ type: 'success', text: `${resolvedKeyName} saved successfully` });
      resetForm();
      await loadKeys();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save API key';
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (keyName: string) => {
    setDeletingKey(keyName);
    setMessage(null);

    try {
      await deleteApiKey(keyName);
      setMessage({ type: 'success', text: `${keyName} deleted` });
      await loadKeys();
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete API key' });
    } finally {
      setDeletingKey(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-stark-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400">Loading API keys...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">API Keys</h1>
          <p className="text-slate-400">
            Manage API keys for external services.
          </p>
        </div>
        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add API Key
          </Button>
        )}
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-6 px-4 py-3 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-500/20 border border-green-500/50 text-green-400'
              : 'bg-red-500/20 border border-red-500/50 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Add API Key</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-w-lg">
                {/* Service / key selector */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Service
                  </label>
                  <select
                    value={selectedOption}
                    onChange={(e) => {
                      setSelectedOption(e.target.value);
                      setCustomKeyName('');
                    }}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-stark-500 focus:border-transparent"
                  >
                    <option value="">Select a service...</option>
                    {knownOptions.map((opt) => (
                      <option key={opt.keyName} value={opt.keyName}>
                        {opt.label}
                      </option>
                    ))}
                    <option value="__custom__">Custom...</option>
                  </select>
                </div>

                {/* Custom key name input */}
                {isCustom && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Key Name
                    </label>
                    <Input
                      value={customKeyName}
                      onChange={(e) => setCustomKeyName(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                      placeholder="e.g. VERCEL_TOKEN"
                      className="font-mono"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Uppercase letters, digits, and underscores only
                    </p>
                  </div>
                )}

                {/* Description for known services */}
                {selectedKnown && (
                  <div className="text-sm text-slate-400 bg-slate-800/50 rounded-lg p-3">
                    <p>{selectedKnown.description}</p>
                    {selectedKnown.url && (
                      <a
                        href={selectedKnown.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-stark-400 hover:text-stark-300 mt-1 inline-block"
                      >
                        Get key &rarr;
                      </a>
                    )}
                  </div>
                )}

                {/* Key value input */}
                {(selectedOption !== '') && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Key Value
                    </label>
                    <Input
                      type="password"
                      value={keyValue}
                      onChange={(e) => setKeyValue(e.target.value)}
                      placeholder="Enter key value"
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleSave}
                    isLoading={isSaving}
                    disabled={!resolvedKeyName || !keyValue.trim()}
                  >
                    Save
                  </Button>
                  <Button variant="secondary" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Installed Keys List */}
      <Card>
        <CardHeader>
          <CardTitle>Installed Keys</CardTitle>
        </CardHeader>
        <CardContent>
          {keys.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Key className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg">No API keys configured yet</p>
              <p className="text-sm mt-1">Click "Add API Key" above to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {keys.map((key) => {
                const serviceLabel = getServiceLabel(key.key_name, serviceConfigs);
                const isDeleting = deletingKey === key.key_name;

                return (
                  <div
                    key={key.key_name}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-slate-600/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-white font-medium">
                            {key.key_name}
                          </span>
                          {serviceLabel && (
                            <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded">
                              {serviceLabel}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="font-mono text-xs text-slate-500">
                            {key.key_preview}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-slate-600">
                            <Clock className="w-3 h-3" />
                            {formatTimestamp(key.updated_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Delete ${key.key_name}?`)) {
                          handleDelete(key.key_name);
                        }
                      }}
                      disabled={isDeleting}
                      className="text-slate-500 hover:text-red-400 p-2 rounded transition-colors disabled:opacity-50"
                      title="Delete key"
                    >
                      {isDeleting ? (
                        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
