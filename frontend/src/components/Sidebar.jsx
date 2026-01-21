import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CreditCard, Users, Settings, Zap } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export default function Sidebar() {
  const user = useAuthStore((state) => state.user)

  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER'] },
    { to: '/transactions', icon: CreditCard, label: 'Transactions', roles: ['ADMIN', 'MANAGER', 'OPERATOR'] },
    { to: '/users', icon: Users, label: 'Users', roles: ['ADMIN', 'MANAGER'] },
    { to: '/settings', icon: Settings, label: 'Settings', roles: ['ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER'] },
  ]

  const filteredLinks = links.filter((link) => link.roles.includes(user?.role))

  return (
    <aside className="w-64 bg-primary-800 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-primary-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-600 rounded-lg">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Power-Pay</h1>
            <p className="text-xs text-primary-200">Payment Gateway</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6">
        {filteredLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-700 border-l-4 border-white text-white'
                  : 'text-primary-100 hover:bg-primary-700 hover:text-white border-l-4 border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <link.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-primary-300'}`} />
                {link.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Info */}
      <div className="p-6 border-t border-primary-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center font-bold">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.username}</p>
            <p className="text-xs text-primary-300">{user?.role}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
