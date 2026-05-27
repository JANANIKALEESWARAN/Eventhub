import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { UserCheck, UserMinus, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { userAPI } from '../api/api';

const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await userAPI.getUsers();
        setUsers(response.data);
      } catch (error) {
        console.error('Failed to fetch users', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleRoleChange = async (id, currentRole) => {
    const newRole = currentRole === 'user' ? 'coordinator' : 'user';
    try {
      await userAPI.updateUser(id, { role: newRole });
      alert(`Role updated to ${newRole}`);
      const response = await userAPI.getUsers();
      setUsers(response.data);
    } catch (error) {
      alert('Failed to update role');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this user?')) {
      try {
        await userAPI.deleteUser(id);
        alert('User removed');
        const response = await userAPI.getUsers();
        setUsers(response.data);
      } catch (error) {
        alert('Failed to remove user');
      }
    }
  };

  if (loading) return <AdminLayout><div style={{ padding: '2rem', textAlign: 'center' }}>Loading user management...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontWeight: 800 }}>User Management</h1>
      </div>

      <div className="premium-card">
        <div style={{ padding: '1.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <th style={{ paddingBottom: '1.2rem' }}>USER PROFILE</th>
                <th style={{ paddingBottom: '1.2rem' }}>ACCOUNT ROLE</th>
                <th style={{ paddingBottom: '1.2rem' }}>STATUS</th>
                <th style={{ paddingBottom: '1.2rem' }}>JOINED</th>
                <th style={{ paddingBottom: '1.2rem' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <UserRow 
                  key={user._id}
                  id={user._id}
                  name={user.name} 
                  email={user.email} 
                  role={user.role} 
                  status="Active" 
                  date={new Date(user.createdAt).toLocaleDateString()} 
                  onRoleChange={() => handleRoleChange(user._id, user.role)}
                  onDelete={() => handleDelete(user._id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

const UserRow = ({ id, name, email, role, status, date, onRoleChange, onDelete }) => (
  <tr style={{ borderBottom: '1px solid #f8fafc' }}>
    <td style={{ padding: '1.5rem 0' }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{name?.[0]}</div>
        <div>
          <h4 style={{ margin: 0, fontWeight: 700 }}>{name}</h4>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{email}</p>
        </div>
      </div>
    </td>
    <td style={{ padding: '1.5rem 0' }}>
      <span className="badge" style={{ background: role === 'coordinator' ? 'var(--primary-light)' : '#f1f5f9', color: role === 'coordinator' ? 'var(--primary-color)' : '#64748b' }}>{role}</span>
    </td>
    <td style={{ padding: '1.5rem 0' }}>
      <span style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: 700 }}>{status}</span>
    </td>
    <td style={{ padding: '1.5rem 0', fontSize: '0.85rem', color: '#888' }}>{date}</td>
    <td style={{ padding: '1.5rem 0' }}>
      <button onClick={onRoleChange} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: 700, cursor: 'pointer', marginRight: '1rem' }}>Edit Role</button>
      <button onClick={onDelete} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 700, cursor: 'pointer' }}>Suspend</button>
    </td>
  </tr>
);

export default AdminUserManagement;
