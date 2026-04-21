import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Loader, Badge } from '../../components/common/UI';
import { toast } from 'react-toastify';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');

  const fetchUsers = () => {
    setLoading(true);
    const params = { limit: 50, ...(search && { search }), ...(role && { role }) };
    api.get('/admin/users', { params })
      .then(res => setUsers(res.data.data.users || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [search, role]);

  const toggleUser = async (userId) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/toggle`);
      setUsers(prev => prev.map(u => (u._id || u.id) === userId ? { ...u, is_active: res.data.data.is_active } : u));
      toast.success('User status updated.');
    } catch { toast.error('Failed to update user.'); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">User Management</h1>
      <div className="flex gap-3 mb-5 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        <select value={role} onChange={e => setRole(e.target.value)} className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white outline-none">
          <option value="">All Roles</option>
          <option value="student">Students</option>
          <option value="instructor">Instructors</option>
          <option value="admin">Admins</option>
        </select>
      </div>
      {loading ? <Loader /> : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">User</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Role</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Joined</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">{user.name?.charAt(0)?.toUpperCase()}</div>
                      <div><p className="font-medium text-gray-800">{user.name}</p><p className="text-xs text-gray-400">{user.email}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge label={user.role} color={user.role === 'admin' ? 'purple' : user.role === 'instructor' ? 'blue' : 'gray'} /></td>
                  <td className="px-4 py-3 text-xs text-gray-400">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><Badge label={user.is_active ? 'Active' : 'Inactive'} color={user.is_active ? 'green' : 'red'} /></td>
                  <td className="px-4 py-3">
                    {user.role !== 'admin' && (
                      <button onClick={() => toggleUser(user._id || user.id)} className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${user.is_active ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-green-600 bg-green-50 hover:bg-green-100'}`}>
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
