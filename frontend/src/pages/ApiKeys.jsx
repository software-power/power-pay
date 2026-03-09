import { useState, useEffect } from 'react'
import { Key, Copy, Trash2, Plus, AlertCircle } from 'lucide-react'
import api from '../services/api'

export default function ApiKeys() {
  const [keys, setKeys] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newSecret, setNewSecret] = useState(null)
  const [formData, setFormData] = useState({
    key_name: '',
    organization: '',
    permissions: [],
    rate_limit: 1000,
  })

  useEffect(() => {
    loadKeys()
  }, [])

  const loadKeys = async () => {
    try {
      const response = await api.get('api-keys')
      const data = await response.json()
      setKeys(data.data || [])
    } catch (error) {
      console.error('Error loading API keys:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('http://localhost:3000/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      })
      const data = await response.json()
      if (data.success) {
        setNewSecret(data.data.apiSecret)
        setShowForm(false)
        setFormData({ key_name: '', organization: '', permissions: [], rate_limit: 1000 })
        loadKeys()
      } else {
        alert(data.message || 'Failed to create API key')
      }
    } catch (error) {
      alert('Failed to create API key')
    }
  }

  const handleRevoke = async (id) => {
    if (!confirm('Revoke this API key? This cannot be undone.')) return
    try {
      const response = await fetch(`http://localhost:3000/api/api-keys/${id}/revoke`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        alert('API key revoked successfully')
        loadKeys()
      }
    } catch (error) {
      alert('Failed to revoke API key')
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  const maskKey = (key) => {
    if (!key || key.length < 10) return key
    return key.substring(0, 8) + '****' + key.substring(key.length - 4)
  }

  const togglePermission = (perm) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm]
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
          <p className="text-gray-600 mt-1">Manage API keys for integrations</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          {showForm ? 'Cancel' : <><Plus className="w-5 h-5" />Generate Key</>}
        </button>
      </div>

      {newSecret && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-400 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800">Save This Secret!</h3>
              <p className="text-sm text-yellow-700 mt-1">This will only be shown once.</p>
              <div className="mt-3 flex gap-2">
                <code className="flex-1 bg-white p-3 rounded border text-sm break-all font-mono">
                  {newSecret}
                </code>
                <button onClick={() => copyToClipboard(newSecret)} className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <button onClick={() => setNewSecret(null)} className="mt-3 text-sm text-yellow-700 underline">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Generate New API Key</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Key Name *</label>
              <input type="text" value={formData.key_name} onChange={(e) => setFormData({...formData, key_name: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization *</label>
              <input type="text" value={formData.organization} onChange={(e) => setFormData({...formData, organization: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
              {['stanbic:lookup', 'stanbic:callback', 'selcom:lookup', 'selcom:callback'].map(perm => (
                <label key={perm} className="flex items-center mb-2">
                  <input type="checkbox" checked={formData.permissions.includes(perm)} onChange={() => togglePermission(perm)} className="rounded mr-2" />
                  <span className="text-sm">{perm}</span>
                </label>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rate Limit</label>
              <input type="number" value={formData.rate_limit} onChange={(e) => setFormData({...formData, rate_limit: parseInt(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" min="100" />
            </div>
            <button type="submit" className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700">Generate</button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">API Key</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organization</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {keys.map(key => (
              <tr key={key.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium">{key.key_name}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <code className="text-xs">{maskKey(key.api_key)}</code>
                    <button onClick={() => copyToClipboard(key.api_key)} className="text-primary-600">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">{key.organization}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${key.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                    {key.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {key.status === 'ACTIVE' && (
                    <button onClick={() => handleRevoke(key.id)} className="text-red-600 hover:text-red-800 flex items-center gap-1">
                      <Trash2 className="w-4 h-4" />
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {keys.length === 0 && (
          <div className="text-center py-12">
            <Key className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No API keys found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
