/** Backend API base URL. Must match backend PORT and CORS_ORIGIN. */
export const API_URL =
  (typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000')
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

function getHeaders(includeAuth = true): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (includeAuth && token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  if (res.status === 204 || res.headers.get('content-length') === '0') return undefined as T;
  return res.json();
}

export const api = {
  async get<T>(path: string, auth = true): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
      headers: getHeaders(auth),
      credentials: 'omit', // use Bearer token only; omit avoids cookie issues cross-origin
    });
    return handleResponse<T>(res);
  },
  async post<T>(path: string, body?: object, auth = true): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: getHeaders(auth),
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'omit',
    });
    return handleResponse<T>(res);
  },
  async put<T>(path: string, body?: object): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'omit',
    });
    return handleResponse<T>(res);
  },
  async delete(path: string): Promise<void> {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'DELETE',
      headers: getHeaders(true),
      credentials: 'omit',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || res.statusText);
    }
  },
};

/** Ping backend health. Use to verify connectivity. */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/health`, { credentials: 'omit' });
    return res.ok;
  } catch {
    return false;
  }
}

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'tourist' | 'boat_owner' | 'admin';
  approved?: boolean;
  created_at?: string;
};

export type Trip = {
  id: string;
  boat_id: string;
  trip_type: string;
  duration_hours: number;
  schedule?: Record<string, unknown>;
  price: number;
  is_active: boolean;
  boat_name?: string;
  capacity?: number;
  description?: string;
  photos?: string[];
  boat_location?: string;
  owner_name?: string;
  avg_rating?: number;
  review_count?: number;
  reviews?: Review[];
};

export type Review = {
  id: string;
  user_id: string;
  trip_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  user_name?: string;
};

export type Booking = {
  id: string;
  trip_id: string;
  user_id: string;
  booking_date: string;
  passenger_count: number;
  status: string;
  payment_status: string;
  total_price: number;
  platform_commission: number;
  trip_type?: string;
  boat_name?: string;
  owner_name?: string;
  tourist_name?: string;
  tourist_email?: string;
  tourist_phone?: string;
};

export type Boat = {
  id: string;
  owner_id: string;
  boat_name: string;
  capacity: number;
  description?: string;
  photos?: string[];
  location?: string;
  price_per_person?: number;
  is_active: boolean;
};
