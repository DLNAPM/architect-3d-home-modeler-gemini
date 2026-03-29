import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { cloudService } from '../services/cloudService';
import { ShieldAlert, Users, Check, X, Search } from 'lucide-react';
import LoadingOverlay from './LoadingOverlay';

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

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
        <div className="bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 px-4 py-2 rounded-lg flex items-center gap-2 font-medium">
          <Users className="h-5 w-5" />
          {users.length} Total Users
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
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map(u => (
                <tr key={u.email} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={u.picture || `https://ui-avatars.com/api/?name=${u.name || 'U'}`} alt={u.name} className="w-10 h-10 rounded-full bg-gray-200" />
                      <span className="font-medium text-gray-900 dark:text-white">{u.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">{u.email}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                      u.subscriptionLevel === 'premium' 
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {u.subscriptionLevel || 'basic'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleUpdateSubscription(u.email, 'basic')}
                        disabled={u.subscriptionLevel === 'basic' || !u.subscriptionLevel}
                        className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Set Basic
                      </button>
                      <button
                        onClick={() => handleUpdateSubscription(u.email, 'premium')}
                        disabled={u.subscriptionLevel === 'premium'}
                        className="px-3 py-1.5 text-sm font-medium rounded-md bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Set Premium
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
