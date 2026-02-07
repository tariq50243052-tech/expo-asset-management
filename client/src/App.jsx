import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import PropTypes from 'prop-types';

const Login = lazy(() => import('./pages/Login'));
const Portal = lazy(() => import('./pages/Portal'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Assets = lazy(() => import('./pages/Assets'));
const TechScanner = lazy(() => import('./pages/TechScanner'));
const Technicians = lazy(() => import('./pages/Technicians'));
const Stores = lazy(() => import('./pages/Stores'));
const TechAssets = lazy(() => import('./pages/TechAssets'));
const AdminTechnicianAssets = lazy(() => import('./pages/AdminTechnicianAssets'));
const TechRequest = lazy(() => import('./pages/TechRequest'));
const AdminRequests = lazy(() => import('./pages/AdminRequests'));
const AddMembers = lazy(() => import('./pages/AddMembers'));
const Vendors = lazy(() => import('./pages/Vendors'));
const PurchaseOrders = lazy(() => import('./pages/PurchaseOrders'));
const ReceiveProcess = lazy(() => import('./pages/ReceiveProcess'));
const DisposalProcess = lazy(() => import('./pages/DisposalProcess'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Setup = lazy(() => import('./pages/Setup'));
const AssetCategories = lazy(() => import('./pages/AssetCategories'));
const Permits = lazy(() => import('./pages/Permits'));
const Passes = lazy(() => import('./pages/Passes'));
const RecentActivity = lazy(() => import('./pages/RecentActivity'));
const SystemLogs = lazy(() => import('./pages/SystemLogs'));

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, activeStore } = useAuth();
  const location = useLocation();

  if (loading) return <div>Loading...</div>;
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Super Admin Logic: Must have active store selected, unless on /portal
  if (user.role === 'Super Admin' && !activeStore && location.pathname !== '/portal') {
    return <Navigate to="/portal" />;
  }

  if (allowedRoles) {
    // Super Admin has access to everything if store is selected (or if specific role logic allows)
    // But we might want to restrict Super Admin from Technician pages? 
    // "SUPER ADMIN HAVE ALL PERMISSIONS" -> implying they can access Admin pages.
    // Technician pages might be irrelevant but accessible.
    // If allowedRoles doesn't include Super Admin explicitly, we assume they have access unless restricted.
    // However, existing routes use ['Admin'] or ['Technician'].
    // Let's allow Super Admin if 'Admin' is allowed.
    // const effectiveRole = user.role === 'Super Admin' ? 'Admin' : user.role;
    
    // Check if user.role is in allowedRoles OR if user is Super Admin and 'Admin' is in allowedRoles
    const isAllowed = allowedRoles.includes(user.role) || (user.role === 'Super Admin' && allowedRoles.includes('Admin'));
    
    if (!isAllowed) {
      // Allow Super Admin to access everything? User said "SUPER ADMIN HAVE ALL PERMISSIONS".
      // So if user is Super Admin, just return children.
      if (user.role === 'Super Admin') return children;
      return <Navigate to="/" />;
    }
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.string)
};

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 font-medium">Loading Expo Stores...</p>
          </div>
        </div>
      }>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/portal" element={
            <ProtectedRoute allowedRoles={['Super Admin']}>
              <Portal />
            </ProtectedRoute>
          } />
        
        <Route element={<Layout />}>
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardWrapper />
            </ProtectedRoute>
          } />

          <Route path="/events/recent-activity" element={
            <ProtectedRoute allowedRoles={['Admin', 'Technician']}>
              <RecentActivity />
            </ProtectedRoute>
          } />

          <Route path="/events/system-logs" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <SystemLogs />
            </ProtectedRoute>
          } />
          
          <Route path="/assets" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Assets />
            </ProtectedRoute>
          } />

          <Route path="/technicians" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Technicians />
            </ProtectedRoute>
          } />

          <Route path="/add-members" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AddMembers />
            </ProtectedRoute>
          } />
          
          <Route path="/admin-tech-assets" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminTechnicianAssets />
            </ProtectedRoute>
          } />

          <Route path="/stores" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Stores />
            </ProtectedRoute>
          } />

          <Route path="/scanner" element={
            <ProtectedRoute allowedRoles={['Technician', 'Admin']}>
              <TechScanner />
            </ProtectedRoute>
          } />
          
          <Route path="/my-assets" element={
            <ProtectedRoute allowedRoles={['Technician']}>
              <TechAssets />
            </ProtectedRoute>
          } />
          
          <Route path="/tech-request" element={
            <ProtectedRoute allowedRoles={['Technician']}>
              <TechRequest />
            </ProtectedRoute>
          } />
          
          <Route path="/admin-requests" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminRequests />
            </ProtectedRoute>
          } />

          <Route path="/setup" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Setup />
            </ProtectedRoute>
          } />

          <Route path="/vendors" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Vendors />
            </ProtectedRoute>
          } />

          <Route path="/purchase-orders" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <PurchaseOrders />
            </ProtectedRoute>
          } />

          <Route path="/receive-process" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <ReceiveProcess />
            </ProtectedRoute>
          } />

          <Route path="/disposal-process" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <DisposalProcess />
            </ProtectedRoute>
          } />

          <Route path="/setup/products" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Products />
            </ProtectedRoute>
          } />

          <Route path="/products" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Products readOnly={true} />
            </ProtectedRoute>
          } />

          <Route path="/products/:productName" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <ProductDetails />
            </ProtectedRoute>
          } />

          <Route path="/setup/asset-categories" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AssetCategories />
            </ProtectedRoute>
          } />

          <Route path="/permits" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Permits />
            </ProtectedRoute>
          } />

          <Route path="/passes" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Passes />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
      </Suspense>
    </AuthProvider>
  );
}

// Wrapper to redirect based on role for the index route
const DashboardWrapper = () => {
  const { user } = useAuth();
  if (user?.role === 'Technician') {
    return <Navigate to="/scanner" />;
  }
  return <Dashboard />;
};

export default App;
