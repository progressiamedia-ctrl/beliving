'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';

type AdminTab = 'overview' | 'users' | 'properties' | 'bookings' | 'agents';
type UserFilter = 'all' | 'host' | 'guest' | 'unverified' | 'banned';
type PropertyFilter = 'all' | 'verified' | 'pending' | 'hidden';
type BookingFilter = 'all' | 'confirmed' | 'pending' | 'cancelled';

interface AdminStats {
  totalUsers: number;
  totalProperties: number;
  totalBookings: number;
  totalRevenue: number;
}

interface User {
  id: string;
  email: string;
  user_type: string;
  verified: boolean;
  is_banned: boolean;
  first_name: string;
  last_name: string;
  created_at: string;
}

interface Property {
  id: string;
  title: string;
  city: string;
  price: number;
  verified: boolean;
  available: boolean;
  rating: number;
  host_id: string;
  images: string[];
  created_at: string;
}

interface Booking {
  id: string;
  property_id: string;
  guest_id: string;
  host_id: string;
  guest_name: string;
  guest_email: string;
  check_in: string;
  check_out: string;
  total_price: number;
  status: string;
  created_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalProperties: 0,
    totalBookings: 0,
    totalRevenue: 0
  });
  const [users, setUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [userFilter, setUserFilter] = useState<UserFilter>('all');
  const [propertyFilter, setPropertyFilter] = useState<PropertyFilter>('all');
  const [bookingFilter, setBookingFilter] = useState<BookingFilter>('all');

  // Auth guard
  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role !== 'admin') {
      router.push('/');
    }
  }, [router]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, usersRes, propsRes, bookingsRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/users'),
          fetch('/api/admin/properties'),
          fetch('/api/admin/bookings')
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData);
        }
        if (propsRes.ok) {
          const propsData = await propsRes.json();
          setProperties(propsData);
        }
        if (bookingsRes.ok) {
          const bookingsData = await bookingsRes.json();
          setBookings(bookingsData);
        }
      } catch (error) {
        console.error('Failed to load admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleVerifyUser = async (userId: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, verified: true })
      });

      if (response.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, verified: true } : u));
      }
    } catch (error) {
      console.error('Failed to verify user:', error);
    }
  };

  const handleToggleBan = async (userId: string, isBanned: boolean) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, is_banned: !isBanned })
      });

      if (response.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, is_banned: !isBanned } : u));
      }
    } catch (error) {
      console.error('Failed to ban/unban user:', error);
    }
  };

  const handleVerifyProperty = async (propertyId: string) => {
    try {
      const response = await fetch('/api/admin/properties', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, verified: true })
      });

      if (response.ok) {
        setProperties(properties.map(p => p.id === propertyId ? { ...p, verified: true } : p));
      }
    } catch (error) {
      console.error('Failed to verify property:', error);
    }
  };

  const handleToggleAvailable = async (propertyId: string, available: boolean) => {
    try {
      const response = await fetch('/api/admin/properties', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, available: !available })
      });

      if (response.ok) {
        setProperties(properties.map(p => p.id === propertyId ? { ...p, available: !available } : p));
      }
    } catch (error) {
      console.error('Failed to toggle property availability:', error);
    }
  };

  // Filter functions
  const filteredUsers = users.filter(u => {
    if (userFilter === 'host') return u.user_type === 'host';
    if (userFilter === 'guest') return u.user_type === 'guest';
    if (userFilter === 'unverified') return !u.verified;
    if (userFilter === 'banned') return u.is_banned;
    return true;
  });

  const filteredProperties = properties.filter(p => {
    if (propertyFilter === 'verified') return p.verified;
    if (propertyFilter === 'pending') return !p.verified;
    if (propertyFilter === 'hidden') return !p.available;
    return true;
  });

  const filteredBookings = bookings.filter(b => {
    if (bookingFilter === 'confirmed') return b.status === 'confirmed';
    if (bookingFilter === 'pending') return b.status === 'pending';
    if (bookingFilter === 'cancelled') return b.status === 'cancelled';
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Cargando admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header title="Admin Dashboard - Be Living" />

      {/* Tab Navigation */}
      <div className="sticky top-16 z-40 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex gap-6">
          {[
            { id: 'overview' as AdminTab, label: 'Resumen' },
            { id: 'users' as AdminTab, label: 'Usuarios' },
            { id: 'properties' as AdminTab, label: 'Propiedades' },
            { id: 'bookings' as AdminTab, label: 'Reservas' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              className={`pb-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-gray-900 dark:text-white border-b-2 border-yellow-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-12">
            <h1 className="text-4xl font-light text-gray-900 dark:text-white">Resumen</h1>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Total Usuarios</p>
                <p className="text-3xl font-light text-gray-900 dark:text-white">{stats.totalUsers}</p>
              </div>
              <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Total Propiedades</p>
                <p className="text-3xl font-light text-gray-900 dark:text-white">{stats.totalProperties}</p>
              </div>
              <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Total Reservas</p>
                <p className="text-3xl font-light text-gray-900 dark:text-white">{stats.totalBookings}</p>
              </div>
              <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Ingresos Totales</p>
                <p className="text-3xl font-light text-gray-900 dark:text-white">${stats.totalRevenue.toFixed(2)}</p>
              </div>
            </div>

            {/* Recent Bookings */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Reservas Recientes</h2>
              <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 dark:text-gray-400">Propiedad</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 dark:text-gray-400">Huésped</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 dark:text-gray-400">Fechas</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 dark:text-gray-400">Precio</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 dark:text-gray-400">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.slice(0, 10).map(booking => (
                      <tr key={booking.id} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition">
                        <td className="px-6 py-3 text-sm text-gray-900 dark:text-white">{booking.property_id}</td>
                        <td className="px-6 py-3 text-sm text-gray-900 dark:text-white">{booking.guest_name}</td>
                        <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-900 dark:text-white">${booking.total_price.toFixed(2)}</td>
                        <td className="px-6 py-3 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            booking.status === 'confirmed' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                            booking.status === 'pending' ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                            'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <h1 className="text-4xl font-light text-gray-900 dark:text-white">Usuarios</h1>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              {['all', 'host', 'guest', 'unverified', 'banned'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setUserFilter(filter as UserFilter)}
                  className={`px-4 py-2 text-sm rounded-lg transition ${
                    userFilter === filter
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-black'
                      : 'border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-400'
                  }`}
                >
                  {filter === 'all' ? 'Todos' : filter === 'host' ? 'Hosts' : filter === 'guest' ? 'Guests' : filter === 'unverified' ? 'Sin verificar' : 'Baneados'}
                </button>
              ))}
            </div>

            {/* Users Table */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 dark:text-gray-400">Email</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 dark:text-gray-400">Tipo</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 dark:text-gray-400">Verificado</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 dark:text-gray-400">Baneado</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 dark:text-gray-400">Registro</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 dark:text-gray-400">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition">
                      <td className="px-6 py-3 text-sm text-gray-900 dark:text-white">{user.email}</td>
                      <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400 capitalize">{user.user_type}</td>
                      <td className="px-6 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${user.verified ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                          {user.verified ? '✓ Verificado' : 'Sin verificar'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${user.is_banned ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                          {user.is_banned ? 'Baneado' : 'Activo'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">{new Date(user.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-3 text-sm flex gap-2">
                        {!user.verified && (
                          <button
                            onClick={() => handleVerifyUser(user.id)}
                            className="px-3 py-1 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded hover:bg-green-100 dark:hover:bg-green-900/30 text-xs font-medium transition"
                          >
                            Verificar
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleBan(user.id, user.is_banned)}
                          className={`px-3 py-1 rounded text-xs font-medium transition ${
                            user.is_banned
                              ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                              : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-100'
                          }`}
                        >
                          {user.is_banned ? 'Desbanear' : 'Banear'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Properties Tab */}
        {activeTab === 'properties' && (
          <div className="space-y-6">
            <h1 className="text-4xl font-light text-gray-900 dark:text-white">Propiedades</h1>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              {['all', 'verified', 'pending', 'hidden'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setPropertyFilter(filter as PropertyFilter)}
                  className={`px-4 py-2 text-sm rounded-lg transition ${
                    propertyFilter === filter
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-black'
                      : 'border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-400'
                  }`}
                >
                  {filter === 'all' ? 'Todas' : filter === 'verified' ? 'Verificadas' : filter === 'pending' ? 'Pendientes' : 'Ocultas'}
                </button>
              ))}
            </div>

            {/* Properties Table */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 dark:text-gray-400">Título</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 dark:text-gray-400">Ciudad</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 dark:text-gray-400">Precio</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 dark:text-gray-400">Verificada</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 dark:text-gray-400">Disponible</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 dark:text-gray-400">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProperties.map(property => (
                    <tr key={property.id} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition">
                      <td className="px-6 py-3 text-sm text-gray-900 dark:text-white line-clamp-1">{property.title}</td>
                      <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">{property.city}</td>
                      <td className="px-6 py-3 text-sm text-gray-900 dark:text-white">${property.price.toFixed(2)}</td>
                      <td className="px-6 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${property.verified ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                          {property.verified ? '✓ Verificada' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${property.available ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
                          {property.available ? 'Visible' : 'Oculta'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm flex gap-2">
                        {!property.verified && (
                          <button
                            onClick={() => handleVerifyProperty(property.id)}
                            className="px-3 py-1 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded hover:bg-green-100 dark:hover:bg-green-900/30 text-xs font-medium transition"
                          >
                            Verificar
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleAvailable(property.id, property.available)}
                          className={`px-3 py-1 rounded text-xs font-medium transition ${
                            property.available
                              ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 hover:bg-orange-100'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                          }`}
                        >
                          {property.available ? 'Ocultar' : 'Mostrar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <h1 className="text-4xl font-light text-gray-900 dark:text-white">Reservas</h1>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              {['all', 'confirmed', 'pending', 'cancelled'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setBookingFilter(filter as BookingFilter)}
                  className={`px-4 py-2 text-sm rounded-lg transition ${
                    bookingFilter === filter
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-black'
                      : 'border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-400'
                  }`}
                >
                  {filter === 'all' ? 'Todas' : filter === 'confirmed' ? 'Confirmadas' : filter === 'pending' ? 'Pendientes' : 'Canceladas'}
                </button>
              ))}
            </div>

            {/* Bookings Table */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 dark:text-gray-400">Propiedad</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 dark:text-gray-400">Huésped</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 dark:text-gray-400">Check-in</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 dark:text-gray-400">Check-out</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 dark:text-gray-400">Precio</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 dark:text-gray-400">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map(booking => (
                    <tr key={booking.id} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition">
                      <td className="px-6 py-3 text-sm text-gray-900 dark:text-white">{booking.property_id}</td>
                      <td className="px-6 py-3 text-sm text-gray-900 dark:text-white">{booking.guest_name}</td>
                      <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">{new Date(booking.check_in).toLocaleDateString()}</td>
                      <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">{new Date(booking.check_out).toLocaleDateString()}</td>
                      <td className="px-6 py-3 text-sm text-gray-900 dark:text-white">${booking.total_price.toFixed(2)}</td>
                      <td className="px-6 py-3 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          booking.status === 'confirmed' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                          booking.status === 'pending' ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                          'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
