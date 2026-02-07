import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Search, Clock, User, Calendar, AlertCircle, CheckCircle, Activity } from 'lucide-react';
import api from '../api/axios';

const ProductDetails = () => {
  const { productName } = useParams();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  // Client-side pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Decode product name from URL
  const decodedProductName = decodeURIComponent(productName);

  useEffect(() => {
    const fetchAssets = async () => {
      setLoading(true);
      try {
        // Fetch assets for this product name
        const res = await api.get('/assets', {
          params: {
            product_name: decodedProductName,
            limit: 1000 // Fetch all for this view to calculate stats
          }
        });
        setAssets(res.data.items || []);
      } catch (err) {
        console.error('Failed to fetch product assets:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [decodedProductName]);

  // Filter assets based on search term
  const filteredAssets = assets.filter(asset => 
    asset.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.ticket_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.assigned_to?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const paginatedAssets = filteredAssets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Calculate stats
  const stats = {
    total: assets.length,
    inUse: assets.filter(a => a.status === 'Used').length,
    inStore: assets.filter(a => a.status === 'New').length,
    faulty: assets.filter(a => a.status === 'Faulty').length,
    disposed: assets.filter(a => a.status === 'Disposed').length,
    underRepair: assets.filter(a => a.status === 'Under Repair').length
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'New': return 'bg-green-100 text-green-800';
      case 'Used': return 'bg-blue-100 text-blue-800';
      case 'Faulty': return 'bg-red-100 text-red-800';
      case 'Under Repair': return 'bg-orange-100 text-orange-800';
      case 'Disposed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInstallationDate = (asset) => {
    // Find the last "Collected" or "Assigned" event
    if (!asset.history || asset.history.length === 0) return 'N/A';
    
    // Reverse history to find latest relevant event
    const reversedHistory = [...asset.history].reverse();
    const installEvent = reversedHistory.find(h => 
      h.action.includes('Collected') || 
      h.action.includes('Assigned') ||
      h.action.includes('Used')
    );
    
    if (installEvent) {
      return new Date(installEvent.date || installEvent.createdAt || new Date()).toLocaleString();
    }
    
    return 'Not Installed';
  };

  const openHistory = (asset) => {
    setSelectedAsset(asset);
    setShowHistoryModal(true);
  };

  const HistoryModal = () => {
    if (!selectedAsset) return null;
    
    const sortedHistory = [...(selectedAsset.history || [])].sort((a, b) => 
      new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
    );

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Asset History</h2>
              <p className="text-sm text-gray-500">Serial: {selectedAsset.serial_number}</p>
            </div>
            <button 
              onClick={() => setShowHistoryModal(false)}
              className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full"
            >
              ✕
            </button>
          </div>
          
          <div className="overflow-y-auto p-6 space-y-6">
            {sortedHistory.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No history records found.</p>
            ) : (
              sortedHistory.map((event, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 z-10">
                      <Activity size={14} />
                    </div>
                    {index < sortedHistory.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-100 -my-1"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-gray-900">{event.action}</span>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {new Date(event.date || event.createdAt || Date.now()).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div className="grid grid-cols-2 gap-2">
                        {event.user && (
                          <div className="flex items-center gap-2">
                            <User size={12} className="text-gray-400" />
                            <span>By: {event.user}</span>
                          </div>
                        )}
                        {event.ticket_number && (
                          <div className="flex items-center gap-2">
                            <AlertCircle size={12} className="text-gray-400" />
                            <span>Ticket: {event.ticket_number}</span>
                          </div>
                        )}
                      </div>
                      {event.details && (
                        <div className="mt-2 pt-2 border-t border-gray-200/50 text-gray-500 italic">
                          {event.details}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-6 mb-8">
        <Link 
          to="/products" 
          className="inline-flex items-center text-gray-500 hover:text-blue-600 transition-colors gap-2 self-start"
        >
          <ArrowLeft size={20} />
          <span>Back to Products</span>
        </Link>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{decodedProductName}</h1>
            <p className="text-gray-500 mt-1">Product History & Inventory Status</p>
          </div>
          
          {/* Stats Cards */}
          <div className="flex flex-wrap gap-2">
            <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Total</span>
              <span className="text-xl font-bold text-gray-900">{stats.total}</span>
            </div>
            <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 shadow-sm">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">In Use</span>
              <span className="text-xl font-bold text-blue-700">{stats.inUse}</span>
            </div>
            <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-100 shadow-sm">
              <span className="text-xs font-bold text-green-400 uppercase tracking-wider block">In Store</span>
              <span className="text-xl font-bold text-green-700">{stats.inStore}</span>
            </div>
            <div className="bg-red-50 px-4 py-2 rounded-lg border border-red-100 shadow-sm">
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider block">Faulty</span>
              <span className="text-xl font-bold text-red-700">{stats.faulty}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search by Serial Number, Ticket, Status, or Assigned User..."
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm text-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Assets Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading assets...</div>
      ) : filteredAssets.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="text-gray-400 mb-2">
            <Search size={48} className="mx-auto opacity-20" />
          </div>
          <p className="text-gray-500 text-lg">No assets found matching your search.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset Info</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To / Location</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Installation Date</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedAssets.map((asset) => (
                  <tr key={asset._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900">{asset.serial_number}</span>
                        <span className="text-xs text-gray-500">Last 4: {asset.serial_last_4}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(asset.status)}`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {asset.assigned_to ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                            {asset.assigned_to.name.charAt(0)}
                          </div>
                          <span className="text-sm text-gray-900">{asset.assigned_to.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 italic">Unassigned</span>
                      )}
                      {asset.location && (
                         <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                           <span className="uppercase tracking-wide">Loc:</span> {asset.location}
                         </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={14} className="text-gray-400" />
                        {getInstallationDate(asset)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => openHistory(asset)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1 ml-auto hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Clock size={16} />
                        View History
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="text-sm text-gray-500">
                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredAssets.length)}</span> of <span className="font-medium">{filteredAssets.length}</span> results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showHistoryModal && <HistoryModal />}
    </div>
  );
};

export default ProductDetails;
