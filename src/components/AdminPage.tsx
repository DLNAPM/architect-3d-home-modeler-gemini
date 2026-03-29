import React, { useState, useEffect, useMemo } from 'react';
import { User } from '../types';
import { cloudService } from '../services/cloudService';
import { ShieldAlert, Users, Check, X, Search, PieChart as PieChartIcon, Trash2, Snowflake, Lock, Unlock } from 'lucide-react';
import LoadingOverlay from './LoadingOverlay';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface AdminPageProps {
  user: User;
}

const AdminPage: React.FC<AdminPageProps> = ({ user }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user.email !== 'dlaniger.napm.consulting@gmail.com') {
      setError('Unauthorized access.');
      setIsLoading(false);
      return;
    }

    const fetchUsers = async () => {
      try {
        const allUsers = await cloudService.getAllUsers();
        setUsers(allUsers);
      } catch (err) {
        console.error("Failed to fetch users", err);
        setError("Failed to load users. Please check your permissions.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [user]);

  const handleUpdateSubscription = async (email: string, level: 'basic' | 'premium') => {
    try {
      await cloudService.updateUserSubscription(email, level);
      setUsers(users.map(u => u.email === email ? { ...u, subscriptionLevel: level } : u));
    } catch (err) {
      console.error("Failed to update subscription", err);
      alert("Failed to update subscription.");
    }
  };

  const handleDeleteUser = async (email: string) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete user ${email}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await cloudService.deleteUser(email);
      setUsers(users.filter(u => u.email !== email));
    } catch (err) {
      console.error("Failed to delete user", err);
      alert("Failed to delete user.");
    }
  };

  const handleToggleFreeze = async (email: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    try {
      await cloudService.toggleUserFreeze(email, newStatus);
      setUsers(users.map(u => u.email === email ? { ...u, isFrozen: newStatus } : u));
    } catch (err) {
      console.error("Failed to toggle freeze status", err);
      alert("Failed to toggle freeze status.");
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const chartData = useMemo(() => {
    const basicCount = users.filter(u => !u.subscriptionLevel || u.subscriptionLevel === 'basic').length;
    const premiumCount = users.filter(u => u.subscriptionLevel === 'premium').length;
    
    return [
      { name: 'Basic', value: basicCount, color: '#6b7280' }, // gray-500
      { name: 'Premium', value: premiumCount, color: '#9333ea' } // purple-600
    ];
  }, [users]);

  if (isLoading) {
    return <LoadingOverlay message="Loading Admin Dashboard..." />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 p-6 rounded-lg max-w-md text-center">
          <ShieldAlert className="h-12 w-12 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-brand-600" />
            Admin Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Manage user accounts and subscription levels.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 px-4 py-2 rounded-lg flex items-center gap-2 font-medium">
            <Users className="h-5 w-5" />
            {users.length} Total Users
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-brand-600" />
            Subscription Distribution
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#fff' 
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {chartData.map(item => (
              <div key={item.name} className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">{item.name}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{item.value}</p>
                <p className="text-xs text-gray-400">
                  {users.length > 0 ? ((item.value / users.length) * 100).toFixed(1) : 0}%
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <ShieldAlert className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Admin Quick Stats</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Overview of system health and user status.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Active Premium</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{chartData[1].value}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Basic Users</p>
              <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{chartData[0].value}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Conversion Rate</p>
              <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                {users.length > 0 ? ((chartData[1].value / users.length) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </div>
            <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold">User</th>
                <th className="p-4 font-semibold">Email</th>
                <th className="p-4 font-semibold">Joined</th>
                <th className="p-4 font-semibold">Subscription</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map(u => (
                <tr key={u.email} className={`hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${u.isFrozen ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={u.picture || `https://ui-avatars.com/api/?name=${u.name || 'U'}`} alt={u.name} className="w-10 h-10 rounded-full bg-gray-200" />
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-white">{u.name || 'Unknown'}</span>
                        {u.isFrozen && <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase">Account Frozen</span>}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-gray-600 dark:text-gray-400 text-sm">{u.email}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-400 text-sm">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                      u.subscriptionLevel === 'premium' 
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {u.subscriptionLevel || 'basic'}
                    </span>
                  </td>
                  <td className="p-4">
                    {u.isFrozen ? (
                      <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase">
                        <Snowflake className="h-3 w-3" /> Frozen
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase">
                        <Check className="h-3 w-3" /> Active
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <div className="flex bg-gray-100 dark:bg-gray-700 rounded-md p-0.5">
                        <button
                          onClick={() => handleUpdateSubscription(u.email, 'basic')}
                          disabled={u.subscriptionLevel === 'basic' || !u.subscriptionLevel || u.email === user.email}
                          className={`px-2 py-1 text-[10px] font-bold rounded ${u.subscriptionLevel === 'basic' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                          title="Set to Basic"
                        >
                          BASIC
                        </button>
                        <button
                          onClick={() => handleUpdateSubscription(u.email, 'premium')}
                          disabled={u.subscriptionLevel === 'premium' || u.email === user.email}
                          className={`px-2 py-1 text-[10px] font-bold rounded ${u.subscriptionLevel === 'premium' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                          title="Set to Premium"
                        >
                          PREMIUM
                        </button>
                      </div>

                      <button
                        onClick={() => handleToggleFreeze(u.email, !!u.isFrozen)}
                        disabled={u.email === user.email}
                        className={`p-1.5 rounded-md border transition-colors ${
                          u.isFrozen 
                            ? 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400' 
                            : 'border-gray-300 dark:border-gray-600 text-gray-500 hover:text-blue-600 hover:border-blue-300 dark:text-gray-400 dark:hover:text-blue-400'
                        }`}
                        title={u.isFrozen ? "Unfreeze Account" : "Freeze Account"}
                      >
                        {u.isFrozen ? <Unlock className="h-4 w-4" /> : <Snowflake className="h-4 w-4" />}
                      </button>

                      <button
                        onClick={() => handleDeleteUser(u.email)}
                        disabled={u.email === user.email}
                        className="p-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-500 hover:text-red-600 hover:border-red-300 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500 dark:text-gray-400">
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
