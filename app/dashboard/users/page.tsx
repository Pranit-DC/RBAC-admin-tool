'use client';

import { useEffect, useState } from 'react';
import { TableSkeleton } from '@/components/skeleton-loader';

interface Role {
  id: string;
  name: string;
}

interface User {
  id: string;
  email: string;
  created_at: string;
  user_roles: { role: Role }[];
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) {
        setCurrentUserId(data.user.id);
      }
    } catch (err) {
      console.error('Failed to load current user');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/roles');
      const data = await res.json();
      setRoles(data);
    } catch (err) {
      console.error('Failed to load roles');
    }
  };

  const openRolesModal = (user: User) => {
    setSelectedUser(user.id);
    setSelectedRoles(
  user.user_roles.map((ur: { role: Role }) => ur.role.id)
);
    // setSelectedRoles(user.user_roles.map(ur => ur.role.id));
    setShowModal(true);
    setError('');
  };

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoles(prev =>
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleSaveRoles = async () => {
    if (!selectedUser) return;
    setError('');

    // Frontend validation: prevent saving with no roles
    if (selectedRoles.length === 0) {
      setError('Please select at least one role');
      return;
    }

    // Frontend validation: prevent removing own admin role
    if (currentUserId === selectedUser) {
      const currentUser = users.find((u: User) => u.id === selectedUser);
    //   const currentUser = users.find(u => u.id === selectedUser);
        const hadAdminRole = currentUser?.user_roles.some(
    (ur: { role: Role }) => ur.role.name.toLowerCase() === 'admin'
    );

      
        const adminRole = roles.find(
    (r: Role) => r.name.toLowerCase() === 'admin'
    );

      //   const adminRole = roles.find(r => r.name.toLowerCase() === 'admin');
      const hasAdminRoleInSelection = adminRole && selectedRoles.includes(adminRole.id);
      
      if (hadAdminRole && !hasAdminRoleInSelection) {
        setError('You cannot remove your own Admin role');
        return;
      }
    }

    try {
      const res = await fetch(`/api/users/${selectedUser}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleIds: selectedRoles }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save roles');
        return;
      }

      setShowModal(false);
      fetchUsers();
    } catch (err) {
      setError('Network error');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const res = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || data.message || 'Failed to delete user');
        setShowDeleteModal(false);
        return;
      }

      setShowDeleteModal(false);
      setUserToDelete(null);
      setError('');
      fetchUsers(); // Refresh the user list
    } catch (err) {
      setError('Network error');
      setShowDeleteModal(false);
    }
  };

  const openDeleteModal = (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
    setError('');
  };

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-600 mt-1">Manage users and assign roles</p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <div className="shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
          <button
            onClick={() => setError('')}
            className="ml-3 shrink-0 text-red-400 hover:text-red-500"
          >
            <span className="sr-only">Dismiss</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Roles
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50:bg-gray-800/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900">{user.email}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {user.user_roles.length > 0 ? (
                      user.user_roles.map((ur: { role: { id: string; name: string } }) => (
                        <span
                          key={ur.role.id}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700"
                        >
                          {ur.role.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">No roles</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-600">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openRolesModal(user)}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Assign Roles
                    </button>
                    {currentUserId !== user.id && (
                      <button
                        onClick={() => openDeleteModal(user)}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No users found.</p>
          </div>
        )}
      </div>

      {/* Assign Roles Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Assign Roles</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {roles.map((role) => {
                const isAdminRole = role.name.toLowerCase() === 'admin';
                const isEditingSelf = currentUserId === selectedUser;
                const isOwnAdminRole = isAdminRole && isEditingSelf;
                
                return (
                  <label
                    key={role.id}
                    className={`flex items-center p-3 border border-gray-200 rounded-lg ${
                      isOwnAdminRole ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'
                    }`}
                    title={isOwnAdminRole ? 'You cannot remove your own Admin role' : ''}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role.id)}
                      onChange={() => handleRoleToggle(role.id)}
                      disabled={isOwnAdminRole}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className={`ml-3 text-sm font-medium ${
                      isOwnAdminRole ? 'text-gray-500' : 'text-gray-900'
                    }`}>
                      {role.name}
                      {isOwnAdminRole && (
                        <span className="ml-2 text-xs text-blue-600">Protected</span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>

            {roles.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No roles available. Create roles first!</p>
              </div>
            )}

            {selectedRoles.length === 0 && roles.length > 0 && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-700">Please select at least one role</p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRoles}
                disabled={selectedRoles.length === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Delete User</h2>
            
            <div className="mb-6">
              <p className="text-sm text-gray-700 mb-2">
                Are you sure you want to delete the following user?
              </p>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm font-medium text-gray-900">{userToDelete.email}</p>
                <p className="text-xs text-gray-600 mt-1">
                  Roles: {userToDelete.user_roles.map(ur => ur.role.name).join(', ') || 'None'}
                </p>
              </div>
            </div>

            <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
              <p className="text-sm text-red-800 font-medium">WARNING: This action cannot be undone</p>
              <p className="text-xs text-red-600 mt-1">
                All role assignments will be permanently removed.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

