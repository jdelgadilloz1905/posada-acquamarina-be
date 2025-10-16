# Integración con Frontend

## 🔌 Conexión desde React/Vue/Angular

### Configuración de Axios (Recomendado)

```javascript
// src/api/axios.js (o api.js)
import axios from 'axios';

const API_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token en todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

## 📋 Servicios de API

### Servicio de Autenticación

```javascript
// src/services/authService.js
import api from '../api/axios';

export const authService = {
  // Registro
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Login
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Obtener perfil
  async getProfile() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Logout
  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  },

  // Verificar si está autenticado
  isAuthenticated() {
    return !!localStorage.getItem('access_token');
  },

  // Obtener usuario actual
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};
```

### Servicio de Habitaciones

```javascript
// src/services/roomService.js
import api from '../api/axios';

export const roomService = {
  // Obtener todas las habitaciones
  async getAllRooms() {
    const response = await api.get('/rooms');
    return response.data;
  },

  // Obtener habitación por ID
  async getRoomById(id) {
    const response = await api.get(`/rooms/${id}`);
    return response.data;
  },

  // Buscar habitaciones disponibles
  async getAvailableRooms(checkIn, checkOut) {
    const response = await api.get('/rooms/available', {
      params: { checkIn, checkOut },
    });
    return response.data;
  },

  // Crear habitación (Admin)
  async createRoom(roomData) {
    const response = await api.post('/rooms', roomData);
    return response.data;
  },

  // Actualizar habitación (Admin)
  async updateRoom(id, roomData) {
    const response = await api.patch(`/rooms/${id}`, roomData);
    return response.data;
  },

  // Eliminar habitación (Admin)
  async deleteRoom(id) {
    await api.delete(`/rooms/${id}`);
  },
};
```

### Servicio de Reservas

```javascript
// src/services/reservationService.js
import api from '../api/axios';

export const reservationService = {
  // Crear reserva
  async createReservation(reservationData) {
    const response = await api.post('/reservations', reservationData);
    return response.data;
  },

  // Obtener todas las reservas (filtradas según rol)
  async getAllReservations() {
    const response = await api.get('/reservations');
    return response.data;
  },

  // Obtener mis reservas
  async getMyReservations() {
    const response = await api.get('/reservations/my-reservations');
    return response.data;
  },

  // Obtener reserva por ID
  async getReservationById(id) {
    const response = await api.get(`/reservations/${id}`);
    return response.data;
  },

  // Actualizar reserva
  async updateReservation(id, reservationData) {
    const response = await api.patch(`/reservations/${id}`, reservationData);
    return response.data;
  },

  // Confirmar reserva (Admin)
  async confirmReservation(id) {
    const response = await api.patch(`/reservations/${id}/confirm`);
    return response.data;
  },

  // Cancelar reserva
  async cancelReservation(id) {
    const response = await api.patch(`/reservations/${id}/cancel`);
    return response.data;
  },

  // Eliminar reserva
  async deleteReservation(id) {
    await api.delete(`/reservations/${id}`);
  },
};
```

## 🎨 Ejemplos de Componentes

### Componente de Login (React)

```jsx
// src/components/Login.jsx
import { useState } from 'react';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await authService.login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="login-container">
      <h2>Iniciar Sesión</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <div className="error">{error}</div>}
        <button type="submit">Ingresar</button>
      </form>
    </div>
  );
}

export default Login;
```

### Componente de Formulario de Reserva (React)

```jsx
// src/components/ReservationForm.jsx
import { useState } from 'react';
import { reservationService } from '../services/reservationService';

function ReservationForm({ roomId, onSuccess }) {
  const [formData, setFormData] = useState({
    checkInDate: '',
    checkOutDate: '',
    numberOfAdults: 1,
    numberOfChildren: 0,
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    specialRequests: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const reservation = await reservationService.createReservation({
        ...formData,
        roomId,
        numberOfAdults: parseInt(formData.numberOfAdults),
        numberOfChildren: parseInt(formData.numberOfChildren),
      });

      alert('¡Reserva creada exitosamente!');
      onSuccess(reservation);
    } catch (err) {
      alert(err.response?.data?.message || 'Error al crear la reserva');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="reservation-form">
      <h3>Información de Reserva</h3>

      <div className="form-group">
        <label>Fecha de llegada *</label>
        <input
          type="date"
          name="checkInDate"
          value={formData.checkInDate}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Fecha de salida *</label>
        <input
          type="date"
          name="checkOutDate"
          value={formData.checkOutDate}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Adultos *</label>
          <select
            name="numberOfAdults"
            value={formData.numberOfAdults}
            onChange={handleChange}
            required
          >
            <option value="1">1 Adulto</option>
            <option value="2">2 Adultos</option>
            <option value="3">3 Adultos</option>
            <option value="4">4 Adultos</option>
          </select>
        </div>

        <div className="form-group">
          <label>Niños</label>
          <select
            name="numberOfChildren"
            value={formData.numberOfChildren}
            onChange={handleChange}
          >
            <option value="0">Sin niños</option>
            <option value="1">1 Niño</option>
            <option value="2">2 Niños</option>
            <option value="3">3 Niños</option>
          </select>
        </div>
      </div>

      <h3>Información del Huésped</h3>

      <div className="form-group">
        <label>Nombre completo *</label>
        <input
          type="text"
          name="guestName"
          placeholder="Ingresa tu nombre completo"
          value={formData.guestName}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Correo electrónico *</label>
        <input
          type="email"
          name="guestEmail"
          placeholder="tu@email.com"
          value={formData.guestEmail}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Teléfono *</label>
        <input
          type="tel"
          name="guestPhone"
          placeholder="+58 414 123 4567"
          value={formData.guestPhone}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Solicitudes especiales</label>
        <textarea
          name="specialRequests"
          placeholder="Dietas especiales, cama extra, aniversario, etc."
          value={formData.specialRequests}
          onChange={handleChange}
          rows="4"
        ></textarea>
      </div>

      <button type="submit" className="btn-submit">
        Crear Reserva
      </button>
    </form>
  );
}

export default ReservationForm;
```

### Componente de Lista de Habitaciones (React)

```jsx
// src/components/RoomList.jsx
import { useState, useEffect } from 'react';
import { roomService } from '../services/roomService';

function RoomList() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const data = await roomService.getAllRooms();
      setRooms(data);
    } catch (err) {
      console.error('Error al cargar habitaciones:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Cargando habitaciones...</div>;

  return (
    <div className="room-list">
      <h2>Nuestras Habitaciones</h2>
      <div className="rooms-grid">
        {rooms.map((room) => (
          <div key={room.id} className="room-card">
            <h3>{room.type.toUpperCase()} - Habitación {room.roomNumber}</h3>
            <p className="price">${room.pricePerNight} / noche</p>
            <p className="description">{room.description}</p>
            <div className="amenities">
              {room.amenities?.map((amenity, idx) => (
                <span key={idx} className="amenity-tag">{amenity}</span>
              ))}
            </div>
            <p className="capacity">
              Capacidad: {room.capacity} adultos, {room.maxChildren} niños
            </p>
            <button className="btn-reserve">
              Reservar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RoomList;
```

## 🎯 Context API para Estado Global (React)

```jsx
// src/context/AuthContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay sesión activa
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data.user);
    return data;
  };

  const register = async (userData) => {
    const data = await authService.register(userData);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };

  if (loading) return <div>Cargando...</div>;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};
```

## 🛡️ Rutas Protegidas (React Router)

```jsx
// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;

// Uso:
// <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminPanel /></ProtectedRoute>} />
```

## ⚠️ Manejo de Errores

```javascript
// src/utils/errorHandler.js
export const handleApiError = (error) => {
  if (error.response) {
    // Error de respuesta del servidor
    const status = error.response.status;
    const message = error.response.data?.message || 'Error del servidor';

    switch (status) {
      case 400:
        return 'Datos inválidos. Por favor verifica la información.';
      case 401:
        return 'No autorizado. Por favor inicia sesión.';
      case 403:
        return 'No tienes permisos para realizar esta acción.';
      case 404:
        return 'Recurso no encontrado.';
      case 409:
        return message; // Ej: "Email already exists"
      case 500:
        return 'Error del servidor. Intenta de nuevo más tarde.';
      default:
        return message;
    }
  } else if (error.request) {
    // Error de red
    return 'No se pudo conectar al servidor. Verifica tu conexión.';
  } else {
    return 'Error inesperado. Intenta de nuevo.';
  }
};
```

## 📝 Notas Importantes

1. **CORS**: Asegúrate de que el backend tenga configurado el `FRONTEND_URL` correcto en el `.env`
2. **Token**: El token JWT se guarda en `localStorage` - considera usar httpOnly cookies en producción
3. **Fechas**: Las fechas deben enviarse en formato ISO (YYYY-MM-DD)
4. **Validación**: Implementa validación en el frontend antes de enviar al backend
5. **Loading States**: Siempre maneja estados de carga para mejor UX
6. **Error Handling**: Implementa manejo de errores consistente en toda la app
