import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Stores = () => {
  const { activeStore } = useAuth();
  const [stores, setStores] = useState([]);
  const [newName, setNewName] = useState('');
  const [newOpeningTime, setNewOpeningTime] = useState('09:00');
  const [newClosingTime, setNewClosingTime] = useState('17:00');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [editingId, setEditingId] = useState('');
  const [editingName, setEditingName] = useState('');
  const [editingOpeningTime, setEditingOpeningTime] = useState('');
  const [editingClosingTime, setEditingClosingTime] = useState('');

  // Update time every minute to refresh status
  const [, setCurrentTime] = useState(new Date());

  const fetchStores = useCallback(async () => {
    try {
      const res = await api.get(`/stores?parent=${activeStore._id}`);
      setStores(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [activeStore]);

  useEffect(() => {
    if (activeStore) {
      fetchStores();
    }
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, [activeStore, fetchStores]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/stores', { 
        name: newName,
        openingTime: newOpeningTime,
        closingTime: newClosingTime
      });
      setNewName('');
      setNewOpeningTime('09:00');
      setNewClosingTime('17:00');
      fetchStores();
    } catch {
      alert('Error adding store');
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Are you sure?')) return;
    try {
      await api.delete(`/stores/${id}`);
      fetchStores();
    } catch {
      alert('Error deleting store');
    }
  };
  
  const startEdit = (store) => {
    setEditingId(store._id);
    setEditingName(store.name);
    setEditingOpeningTime(store.openingTime || '09:00');
    setEditingClosingTime(store.closingTime || '17:00');
  };
  
  const cancelEdit = () => {
    setEditingId('');
    setEditingName('');
    setEditingOpeningTime('');
    setEditingClosingTime('');
  };
  
  const saveEdit = async () => {
    try {
      await api.put(`/stores/${editingId}`, { 
        name: editingName,
        openingTime: editingOpeningTime,
        closingTime: editingClosingTime
      });
      cancelEdit();
      fetchStores();
    } catch {
      alert('Error updating store');
    }
  };

  const isStoreOpen = (open, close) => {
    if (!open || !close) return false;
    const now = new Date();
    const current = now.getHours() * 60 + now.getMinutes();
    
    const [openH, openM] = open.split(':').map(Number);
    const openMin = openH * 60 + openM;
    
    const [closeH, closeM] = close.split(':').map(Number);
    const closeMin = closeH * 60 + closeM;
    
    // Handle overnight hours if needed (e.g. 22:00 to 02:00)
    if (closeMin < openMin) {
        return current >= openMin || current < closeMin;
    }
    
    return current >= openMin && current < closeMin;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Locations</h1>
      
      <div className="bg-white p-4 rounded shadow mb-6">
        <input
          type="text"
          placeholder="Search locations"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-2 rounded w-full"
        />
      </div>
      
      <form onSubmit={handleAdd} className="mb-8 flex flex-wrap gap-4 items-end bg-white p-4 rounded shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700">Location Name</label>
          <input 
            type="text" 
            value={newName} 
            onChange={(e) => setNewName(e.target.value)} 
            placeholder="Location Name" 
            className="border p-2 rounded w-64"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Opening Time</label>
          <input 
            type="time" 
            value={newOpeningTime} 
            onChange={(e) => setNewOpeningTime(e.target.value)} 
            className="border p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Closing Time</label>
          <input 
            type="time" 
            value={newClosingTime} 
            onChange={(e) => setNewClosingTime(e.target.value)} 
            className="border p-2 rounded"
            required
          />
        </div>
        <button type="submit" className="bg-amber-600 hover:bg-amber-700 text-black px-4 py-2 rounded h-10">Add Location</button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stores.filter(s => {
          if (!searchTerm.trim()) return true;
          return (s.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        }).map(store => {
          const open = isStoreOpen(store.openingTime || '09:00', store.closingTime || '17:00');
          return (
            <div key={store._id} className="bg-white p-4 rounded shadow">
              {editingId === store._id ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="border p-2 rounded"
                  />
                  <div className="flex gap-2">
                    <input
                      type="time"
                      value={editingOpeningTime}
                      onChange={(e) => setEditingOpeningTime(e.target.value)}
                      className="border p-2 rounded w-full"
                    />
                    <input
                      type="time"
                      value={editingClosingTime}
                      onChange={(e) => setEditingClosingTime(e.target.value)}
                      className="border p-2 rounded w-full"
                    />
                  </div>
                  <div className="flex gap-2 justify-end mt-2">
                    <button onClick={saveEdit} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Save</button>
                    <button onClick={cancelEdit} className="bg-gray-500 text-white px-3 py-1 rounded text-sm">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-lg">{store.name}</span>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${open ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {open ? 'OPEN' : 'CLOSED'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    Hours: {store.openingTime || '09:00'} - {store.closingTime || '17:00'}
                  </div>
                  <div className="flex gap-2 justify-end border-t pt-2">
                    <button onClick={() => startEdit(store)} className="text-amber-600 text-sm hover:underline">Edit</button>
                    <button onClick={() => handleDelete(store._id)} className="text-red-500 text-sm hover:underline">Delete</button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Stores;
