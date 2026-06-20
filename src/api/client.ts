const BASE_URL =
  import.meta.env.VITE_WORKER_URL ||
  'https://stay-islands-hk-worker.jimsbond007.workers.dev';

function createJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function getAdminToken(): string | null {
  return localStorage.getItem('admin_access_token');
}

async function fetchWithAuth(input: string, init?: RequestInit): Promise<Response> {
  const token = getAdminToken();
  const headers = new Headers(init?.headers);
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && init?.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  const url = input.startsWith('http') ? input : `${BASE_URL}${input}`;
  return fetch(url, { ...init, headers });
}

// ---------------------------------------------------------------------------
// Trip-plans local mock (kept on the browser so the planner keeps working)
// ---------------------------------------------------------------------------

const TRIP_PLANS_KEY = 'stayislands-trip-plans';

interface TripPlan {
  id: number;
  name: string;
  destination: string | null;
  startDate: number | null;
  endDate: number | null;
  items: unknown;
  notes: string | null;
  status: string;
  createdAt: number;
}

function getTripPlans(): TripPlan[] {
  const raw = localStorage.getItem(TRIP_PLANS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveTripPlans(plans: TripPlan[]): void {
  localStorage.setItem(TRIP_PLANS_KEY, JSON.stringify(plans));
}

async function handleTripPlans(
  input: string,
  method: string,
  body?: BodyInit | null
): Promise<Response> {
  if (input === '/api/trip-plans' && method === 'GET') {
    return createJsonResponse({ data: getTripPlans() });
  }

  if (input === '/api/trip-plans' && method === 'POST') {
    const parsed = body ? JSON.parse(body as string) : {};
    const plan: TripPlan = {
      id: Date.now(),
      name: parsed.name || '新行程',
      destination: parsed.destination || null,
      startDate: parsed.startDate || null,
      endDate: parsed.endDate || null,
      items: parsed.items || null,
      notes: parsed.notes || null,
      status: parsed.status || 'active',
      createdAt: Math.floor(Date.now() / 1000),
    };
    const plans = [...getTripPlans(), plan];
    saveTripPlans(plans);
    return createJsonResponse({ data: plan }, 201);
  }

  const detailMatch = input.match(/^\/api\/trip-plans\/(\d+)$/);
  if (detailMatch) {
    const id = Number(detailMatch[1]);
    if (method === 'DELETE') {
      const plans = getTripPlans().filter((p) => p.id !== id);
      saveTripPlans(plans);
      return createJsonResponse({ data: { ok: true } });
    }
    if (method === 'PUT' || method === 'PATCH') {
      const parsed = body ? JSON.parse(body as string) : {};
      let updated: TripPlan | undefined;
      const plans = getTripPlans().map((p) => {
        if (p.id !== id) return p;
        updated = { ...p, ...parsed };
        return updated;
      });
      saveTripPlans(plans);
      return createJsonResponse({ data: updated ?? null });
    }
  }

  return createJsonResponse({ error: 'Trip plan action not supported' }, 405);
}

// ---------------------------------------------------------------------------
// Main API client
// ---------------------------------------------------------------------------

async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const method = (init?.method || 'GET').toUpperCase();
  let targetUrl = input;
  let body = init?.body;

  // Legacy endpoint remapping for the new Cloudflare Worker backend
  if (input === '/api/admin/check') {
    const res = await fetchWithAuth('/api/admin/auth/me', { ...init, method: 'GET', body: undefined });
    if (!res.ok) {
      return createJsonResponse({ isAdmin: false });
    }
    const json = await res.json().catch(() => ({}));
    const admin = json?.data;
    return createJsonResponse({
      isAdmin: true,
      role: admin?.role || null,
    });
  }

  if (input === '/api/admin/accounts') {
    targetUrl = '/api/admin/admins';
    if (method === 'POST' && typeof body === 'string') {
      const parsed = JSON.parse(body);
      parsed.password = parsed.password || 'stay1234';
      parsed.name = parsed.name || parsed.email?.split('@')[0] || 'Admin';
      body = JSON.stringify(parsed);
    }
    return fetchWithAuth(targetUrl, { ...init, method, body });
  }

  const accountsMatch = input.match(/^\/api\/admin\/accounts\/(\d+)$/);
  if (accountsMatch) {
    const id = accountsMatch[1];
    if (method === 'PATCH' || method === 'PUT') {
      targetUrl = `/api/admin/admins/${id}`;
      return fetchWithAuth(targetUrl, { ...init, method: 'PUT', body });
    }
    if (method === 'DELETE') {
      targetUrl = `/api/admin/admins/${id}`;
      return fetchWithAuth(targetUrl, { ...init, method: 'DELETE', body });
    }
  }

  const adminBookingMatch = input.match(/^\/api\/admin\/bookings\/(\d+)$/);
  if (adminBookingMatch && method === 'PATCH') {
    targetUrl = `/api/admin/bookings/${adminBookingMatch[1]}`;
    return fetchWithAuth(targetUrl, { ...init, method: 'PUT', body });
  }

  const adminInquiryMatch = input.match(/^\/api\/admin\/inquiries\/(\d+)$/);
  if (adminInquiryMatch && method === 'PATCH') {
    targetUrl = `/api/admin/inquiries/${adminInquiryMatch[1]}/status`;
    const parsed = typeof body === 'string' ? JSON.parse(body) : {};
    const newBody = JSON.stringify({
      status: parsed.status === 'replied' ? 'contacted' : parsed.status || 'contacted',
    });
    return fetchWithAuth(targetUrl, { ...init, method: 'PATCH', body: newBody });
  }

  if (input === '/api/bookings' && method === 'GET') {
    targetUrl = '/api/public/bookings';
    return fetchWithAuth(targetUrl, { ...init, method, body });
  }

  const bookingCancelMatch = input.match(/^\/api\/bookings\/(\d+)\/cancel$/);
  if (bookingCancelMatch && method === 'PATCH') {
    targetUrl = `/api/public/bookings/${bookingCancelMatch[1]}/cancel`;
    return fetchWithAuth(targetUrl, { ...init, method, body });
  }

  if (input.startsWith('/api/trip-plans')) {
    return handleTripPlans(input, method, body);
  }

  return fetchWithAuth(input, init);
}

// ---------------------------------------------------------------------------
// Auth helpers for the custom JWT login flow
// ---------------------------------------------------------------------------

async function getSession() {
  const raw = localStorage.getItem('stayislands_user');
  if (!raw) return { data: null };
  try {
    const user = JSON.parse(raw);
    return { data: { user } };
  } catch {
    return { data: null };
  }
}

async function signOut() {
  const token = getAdminToken();
  if (token) {
    try {
      await fetchWithAuth('/api/admin/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
  }
  localStorage.removeItem('admin_access_token');
  localStorage.removeItem('admin_refresh_token');
  localStorage.removeItem('stayislands_user');
}

export const client = {
  api: {
    fetch: apiFetch,
  },
  auth: {
    getSession,
    signOut,
  },
};
