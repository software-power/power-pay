import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { User, Lock, Mail } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function Settings() {
  const user = useAuthStore((state) => state.user)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChangePassword = async (e) => {
    e.preventDefault()

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      })
      toast.success('Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-primary-100 rounded-lg">
              <User className="w-6 h-6 text-primary-600" />
            </div>
            <h2 className="text-lg font-semibold">Profile Information</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">Username</label>
              <div className="input-field bg-gray-50 cursor-not-allowed">
                {user?.username}
              </div>
              <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
            </div>

            <div>
              <label className="label">Full Name</label>
              <div className="input-field bg-gray-50 cursor-not-allowed">
                {user?.full_name}
              </div>
            </div>

            <div>
              <label className="label">Email</label>
              <div className="flex items-center gap-2 input-field bg-gray-50 cursor-not-allowed">
                <Mail className="w-4 h-4 text-gray-400" />
                {user?.email}
              </div>
            </div>

            <div>
              <label className="label">Role</label>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                {user?.role}
              </div>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Lock className="w-6 h-6 text-orange-600" />
            </div>
            <h2 className="text-lg font-semibold">Change Password</h2>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="label">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input-field"
                placeholder="Enter current password"
                required
              />
            </div>

            <div>
              <label className="label">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field"
                placeholder="Enter new password"
                required
                minLength="6"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            </div>

            <div>
              <label className="label">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
                placeholder="Confirm new password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Changing Password...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>

      {/* Security Notice */}
      <div className="card bg-yellow-50 border border-yellow-200 mt-6">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <Lock className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h3 className="font-semibold text-yellow-900 mb-1">Security Best Practices</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Use a strong password with at least 8 characters</li>
              <li>• Include uppercase, lowercase, numbers, and symbols</li>
              <li>• Don't share your password with anyone</li>
              <li>• Change your password regularly</li>
              <li>• Log out when not using the system</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
