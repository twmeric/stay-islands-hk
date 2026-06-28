import { useEffect, useState } from 'react';
import { client } from '../../api/client';

interface PricingOption {
  type: 'shared' | 'single';
  label: string;
  price: number;
  currency: string;
}

interface Package {
  id: number;
  name: string;
  nameZh: string;
  slug: string;
  description: string | null;
  descriptionZh: string | null;
  duration: string | null;
  location: string | null;
  audience: string | null;
  inclusions: string[];
  itinerary: { day: string; title: string; desc: string }[];
  pricingOptions: PricingOption[];
  terms: string | null;
  imageUrl: string | null;
  gallery: string[];
  sortOrder: number;
  status: 'active' | 'inactive';
  createdAt?: number;
  updatedAt?: number;
}

interface PackageBooking {
  id: number;
  packageId: number;
  package?: Package;
  customerName: string | null;
  customerEmail: string;
  customerPhone: string | null;
  checkIn: number;
  occupancy: 'shared' | 'single';
  guests: number;
  totalAmount: number;
  currency: string;
  status: string;
  paymentStatus: string;
  referralCode: string | null;
  token: string;
  createdAt: number;
}

interface PackageFormState {
  name: string;
  nameZh: string;
  slug: string;
  description: string;
  descriptionZh: string;
  duration: string;
  location: string;
  audience: string;
  inclusionsText: string;
  itinerary: { day: string; title: string; desc: string }[];
  sharedLabel: string;
  sharedPrice: string;
  singleLabel: string;
  singlePrice: string;
  currency: string;
  terms: string;
  imageUrl: string;
  galleryText: string;
  sortOrder: string;
  status: 'active' | 'inactive';
}

function ImagePreview({ url, className = '' }: { url: string | null | undefined; className?: string }) {
  if (!url || !url.trim()) return null;
  return (
    <div className={`mt-1 ${className}`}>
      <img
        src={url}
        alt="預覽"
        className="w-16 h-16 object-cover rounded-lg border border-gray-200 bg-gray-50"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    </div>
  );
}

function linesToArray(text: string): string[] {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

function arrayToLines(arr: string[] | null | undefined): string {
  return (arr || []).join('\n');
}

function statusBadgeClass(status: string) {
  return status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
}

function emptyForm(): PackageFormState {
  return {
    name: '',
    nameZh: '',
    slug: '',
    description: '',
    descriptionZh: '',
    duration: '',
    location: '',
    audience: '',
    inclusionsText: '',
    itinerary: [],
    sharedLabel: '二人同房',
    sharedPrice: '',
    singleLabel: '單人房',
    singlePrice: '',
    currency: 'HKD',
    terms: '',
    imageUrl: '',
    galleryText: '',
    sortOrder: '0',
    status: 'active',
  };
}

function formFromItem(item: Package): PackageFormState {
  const shared = item.pricingOptions?.find((o) => o.type === 'shared');
  const single = item.pricingOptions?.find((o) => o.type === 'single');
  return {
    name: item.name || '',
    nameZh: item.nameZh || '',
    slug: item.slug || '',
    description: item.description || '',
    descriptionZh: item.descriptionZh || '',
    duration: item.duration || '',
    location: item.location || '',
    audience: item.audience || '',
    inclusionsText: arrayToLines(item.inclusions),
    itinerary: item.itinerary || [],
    sharedLabel: shared?.label || '二人同房',
    sharedPrice: shared ? String(shared.price) : '',
    singleLabel: single?.label || '單人房',
    singlePrice: single ? String(single.price) : '',
    currency: shared?.currency || single?.currency || 'HKD',
    terms: item.terms || '',
    imageUrl: item.imageUrl || '',
    galleryText: arrayToLines(item.gallery),
    sortOrder: String(item.sortOrder ?? 0),
    status: item.status,
  };
}

export default function PackagesSection() {
  const [activeSubTab, setActiveSubTab] = useState<'packages' | 'bookings'>('packages');

  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<PackageFormState>(emptyForm());

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const [bookings, setBookings] = useState<PackageBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('');
  const [bookingPaymentFilter, setBookingPaymentFilter] = useState<string>('');

  async function loadPackages() {
    setLoading(true);
    setError('');
    try {
      const res = await client.api.fetch('/api/admin/packages');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '載入失敗');
      setPackages(data.data || []);
    } catch (err: any) {
      setError(err.message || '載入度假套餐時發生錯誤');
    } finally {
      setLoading(false);
    }
  }

  async function loadBookings() {
    setBookingsLoading(true);
    setBookingsError('');
    try {
      const params = new URLSearchParams();
      if (bookingStatusFilter) params.append('status', bookingStatusFilter);
      if (bookingPaymentFilter) params.append('payment_status', bookingPaymentFilter);
      const res = await client.api.fetch(`/api/admin/package-bookings?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '載入失敗');
      setBookings(data.data || []);
    } catch (err: any) {
      setBookingsError(err.message || '載入套餐訂單時發生錯誤');
    } finally {
      setBookingsLoading(false);
    }
  }

  useEffect(() => {
    loadPackages();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'bookings') {
      loadBookings();
    }
  }, [activeSubTab, bookingStatusFilter, bookingPaymentFilter]);

  function openNew() {
    setEditingId(null);
    setForm(emptyForm());
    setIsFormOpen(true);
    setError('');
    setSuccess('');
    setDeleteConfirmId(null);
  }

  function startEdit(item: Package) {
    setEditingId(item.id);
    setForm(formFromItem(item));
    setIsFormOpen(true);
    setError('');
    setSuccess('');
    setDeleteConfirmId(null);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  function addItinerary() {
    setForm({ ...form, itinerary: [...form.itinerary, { day: '', title: '', desc: '' }] });
  }

  function updateItinerary(index: number, field: 'day' | 'title' | 'desc', value: string) {
    const next = form.itinerary.map((it, i) => (i === index ? { ...it, [field]: value } : it));
    setForm({ ...form, itinerary: next });
  }

  function removeItinerary(index: number) {
    setForm({ ...form, itinerary: form.itinerary.filter((_, i) => i !== index) });
  }

  function buildBody(): Partial<Package> {
    const pricingOptions: PricingOption[] = [];
    if (form.sharedPrice.trim()) {
      pricingOptions.push({
        type: 'shared',
        label: form.sharedLabel.trim() || '二人同房',
        price: Number(form.sharedPrice) || 0,
        currency: form.currency.trim() || 'HKD',
      });
    }
    if (form.singlePrice.trim()) {
      pricingOptions.push({
        type: 'single',
        label: form.singleLabel.trim() || '單人房',
        price: Number(form.singlePrice) || 0,
        currency: form.currency.trim() || 'HKD',
      });
    }

    return {
      name: form.name.trim(),
      nameZh: form.nameZh.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || null,
      descriptionZh: form.descriptionZh.trim() || null,
      duration: form.duration.trim() || null,
      location: form.location.trim() || null,
      audience: form.audience.trim() || null,
      inclusions: linesToArray(form.inclusionsText),
      itinerary: form.itinerary.filter((it) => it.day || it.title || it.desc),
      pricingOptions,
      terms: form.terms.trim() || null,
      imageUrl: form.imageUrl.trim() || null,
      gallery: linesToArray(form.galleryText),
      sortOrder: Number(form.sortOrder) || 0,
      status: form.status,
    };
  }

  async function save() {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const body = buildBody();
      if (!body.name || !body.nameZh || !body.slug) {
        throw new Error('請填寫名稱、中文名稱與 slug');
      }
      if (!body.pricingOptions || body.pricingOptions.length === 0) {
        throw new Error('請至少填寫一個價格選項');
      }

      let res: Response;
      if (editingId) {
        res = await client.api.fetch(`/api/admin/packages/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        res = await client.api.fetch('/api/admin/packages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '儲存失敗');

      setSuccess(editingId ? '度假套餐已更新' : '度假套餐已新增');
      closeForm();
      await loadPackages();
    } catch (err: any) {
      setError(err.message || '儲存時發生錯誤');
    } finally {
      setLoading(false);
    }
  }

  async function confirmDelete(id: number) {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await client.api.fetch(`/api/admin/packages/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '刪除失敗');
      setSuccess('度假套餐已刪除');
      await loadPackages();
    } catch (err: any) {
      setError(err.message || '刪除時發生錯誤');
    } finally {
      setLoading(false);
      setDeleteConfirmId(null);
    }
  }

  async function updateBookingStatus(id: number, status: string) {
    try {
      const res = await client.api.fetch(`/api/admin/package-bookings/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('更新失敗');
      await loadBookings();
    } catch (err: any) {
      setBookingsError(err.message || '更新狀態時發生錯誤');
    }
  }

  async function markBookingPaid(id: number) {
    try {
      const res = await client.api.fetch(`/api/admin/package-bookings/${id}/mark-paid`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('標記付款失敗');
      await loadBookings();
    } catch (err: any) {
      setBookingsError(err.message || '標記付款時發生錯誤');
    }
  }

  async function printPackageBookingConfirmation(id: number) {
    try {
      const res = await client.api.fetch(`/api/admin/package-bookings/${id}`);
      if (!res.ok) throw new Error('載入失敗');
      const json = await res.json();
      const b = json.data;
      if (!b) return;

      const pkg = b.package || {};
      const customer = b.customer || {};
      const statusMap: Record<string, string> = {
        pending: 'Pending',
        confirmed: 'Confirmed',
        cancelled: 'Cancelled',
        completed: 'Completed',
      };
      const paymentStatusMap: Record<string, string> = {
        unpaid: 'Unpaid',
        partial: 'Partial',
        paid: 'Paid',
        refunded: 'Refunded',
      };
      const occupancyMap: Record<string, string> = {
        shared: 'Twin Share',
        single: 'Single Room',
      };

      const inclusions = Array.isArray(pkg.inclusions)
        ? pkg.inclusions.map((inc: string) => `<li>${inc}</li>`).join('')
        : '<li>—</li>';

      const w = window.open('', '_blank');
      if (!w) return;
      w.document.write(`
        <html>
          <head>
            <title>Package Booking Confirmation #${b.id}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #222; line-height: 1.5; }
              h1 { font-size: 26px; margin-bottom: 6px; }
              h2 { font-size: 18px; margin: 28px 0 12px; border-bottom: 2px solid #0a4c6b; padding-bottom: 6px; color: #0a4c6b; }
              .subtitle { color: #666; margin-bottom: 24px; }
              .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 32px; }
              .row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid #eee; }
              .row span:first-child { color: #555; }
              ul { margin: 0; padding-left: 20px; }
              li { margin-bottom: 4px; }
              .total { font-size: 18px; font-weight: 700; color: #0a4c6b; }
              .footer { margin-top: 40px; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 12px; }
              @media print { body { padding: 24px; } }
            </style>
          </head>
          <body>
            <h1>HK Maldivers</h1>
            <p class="subtitle">Package Booking Confirmation / Supplier Copy</p>

            <h2>Order Reference</h2>
            <div class="grid">
              <div class="row"><span>Booking ID</span><span>#${b.id}</span></div>
              <div class="row"><span>Booking Status</span><span>${statusMap[b.status] || b.status}</span></div>
              <div class="row"><span>Payment Status</span><span>${paymentStatusMap[b.paymentStatus] || b.paymentStatus}</span></div>
            </div>

            <h2>Guest Information</h2>
            <div class="grid">
              <div class="row"><span>Name</span><span>${customer.name || '—'}</span></div>
              <div class="row"><span>Email</span><span>${customer.email || '—'}</span></div>
              <div class="row"><span>Phone</span><span>${customer.phone || '—'}</span></div>
            </div>

            <h2>Package Details</h2>
            <div class="grid">
              <div class="row"><span>Package</span><span>${pkg.name || '—'} ${pkg.nameZh ? `(${pkg.nameZh})` : ''}</span></div>
              <div class="row"><span>Duration</span><span>${pkg.duration || '—'}</span></div>
              <div class="row"><span>Location</span><span>${pkg.location || '—'}</span></div>
              <div class="row"><span>Departure Date</span><span>${new Date(b.checkIn * 1000).toLocaleDateString('en-GB')}</span></div>
              <div class="row"><span>Occupancy</span><span>${occupancyMap[b.occupancy] || b.occupancy}</span></div>
              <div class="row"><span>Guests</span><span>${b.guests}</span></div>
            </div>

            <h2>Inclusions</h2>
            <ul>${inclusions}</ul>

            <h2>Payment Summary</h2>
            <div class="grid">
              <div class="row"><span>Total Amount</span><span class="total">${b.currency === 'HKD' ? 'HK$' : b.currency}${(Number(b.totalAmount) || 0).toLocaleString()}</span></div>
            </div>

            <div class="footer">
              Generated on ${new Date().toLocaleString('en-GB')} · HK Maldivers · For internal and supplier use.
            </div>
            <script>window.print()</script>
          </body>
        </html>
      `);
      w.document.close();
    } catch (err: any) {
      setBookingsError(err.message || '列印時發生錯誤');
    }
  }

  const filteredPackages = packages.filter((p) => {
    const matchesSearch =
      p.nameZh.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? p.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Sub tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSubTab('packages')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeSubTab === 'packages' ? 'bg-[#0a4c6b] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            套餐管理
          </button>
          <button
            onClick={() => setActiveSubTab('bookings')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeSubTab === 'bookings' ? 'bg-[#0a4c6b] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            套餐訂單
          </button>
        </div>
        {activeSubTab === 'packages' && (
          <button
            onClick={openNew}
            className="bg-[#0a4c6b] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#083d56] transition"
          >
            新增套餐
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>}
      {success && <p className="text-sm text-green-600 bg-green-50 px-4 py-3 rounded-lg">{success}</p>}

      {activeSubTab === 'packages' && (
        <>
          {isFormOpen && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h4 className="font-semibold text-[#0d1b2a] mb-4">
                {editingId ? '編輯度假套餐' : '新增度假套餐'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">英文名稱</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">中文名稱</label>
                  <input
                    type="text"
                    value={form.nameZh}
                    onChange={(e) => setForm({ ...form, nameZh: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Slug</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">時長</label>
                  <input
                    type="text"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    placeholder="例如：5 天 4 晚"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">地點</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">適合對象</label>
                  <input
                    type="text"
                    value={form.audience}
                    onChange={(e) => setForm({ ...form, audience: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">排序</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">狀態</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                  >
                    <option value="active">上架</option>
                    <option value="inactive">下架</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">主圖網址</label>
                  <input
                    type="text"
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                  />
                  <ImagePreview url={form.imageUrl} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">幣別</label>
                  <input
                    type="text"
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">英文描述</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">中文描述</label>
                  <textarea
                    value={form.descriptionZh}
                    onChange={(e) => setForm({ ...form, descriptionZh: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">包含項目（每行一項）</label>
                  <textarea
                    value={form.inclusionsText}
                    onChange={(e) => setForm({ ...form, inclusionsText: e.target.value })}
                    rows={4}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">圖片集網址（每行一個）</label>
                  <textarea
                    value={form.galleryText}
                    onChange={(e) => setForm({ ...form, galleryText: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">條款與細則</label>
                  <textarea
                    value={form.terms}
                    onChange={(e) => setForm({ ...form, terms: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                  />
                </div>
              </div>

              {/* Pricing options */}
              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-2">價格選項</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <p className="text-sm font-medium text-[#0d1b2a] mb-2">二人同房</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">標籤</label>
                        <input
                          type="text"
                          value={form.sharedLabel}
                          onChange={(e) => setForm({ ...form, sharedLabel: e.target.value })}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">價格</label>
                        <input
                          type="number"
                          value={form.sharedPrice}
                          onChange={(e) => setForm({ ...form, sharedPrice: e.target.value })}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <p className="text-sm font-medium text-[#0d1b2a] mb-2">單人房</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">標籤</label>
                        <input
                          type="text"
                          value={form.singleLabel}
                          onChange={(e) => setForm({ ...form, singleLabel: e.target.value })}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">價格</label>
                        <input
                          type="number"
                          value={form.singlePrice}
                          onChange={(e) => setForm({ ...form, singlePrice: e.target.value })}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Itinerary */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-500">行程表（day / title / desc）</label>
                  <button
                    onClick={addItinerary}
                    className="text-xs bg-[#B8902F]/10 text-[#B8902F] px-3 py-1 rounded-lg hover:bg-[#B8902F]/20 transition"
                  >
                    + 新增行程
                  </button>
                </div>
                <div className="space-y-3">
                  {form.itinerary.length === 0 && <p className="text-sm text-gray-400">尚未設定行程</p>}
                  {form.itinerary.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-3 items-start border rounded-lg p-3 bg-gray-50">
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={it.day}
                          onChange={(e) => updateItinerary(idx, 'day', e.target.value)}
                          placeholder="Day"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          type="text"
                          value={it.title}
                          onChange={(e) => updateItinerary(idx, 'title', e.target.value)}
                          placeholder="標題"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="col-span-5">
                        <textarea
                          value={it.desc}
                          onChange={(e) => updateItinerary(idx, 'desc', e.target.value)}
                          placeholder="描述"
                          rows={2}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button onClick={() => removeItinerary(idx)} className="text-xs text-red-500 hover:text-red-700 px-2 py-2">
                          刪除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={save}
                  disabled={loading}
                  className="bg-[#0a4c6b] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#083d56] transition disabled:opacity-60"
                >
                  {loading ? '儲存中…' : editingId ? '更新套餐' : '新增套餐'}
                </button>
                <button onClick={closeForm} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2">
                  取消
                </button>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">搜尋</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="名稱 / slug"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none w-56"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">狀態</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
              >
                <option value="">全部</option>
                <option value="active">上架</option>
                <option value="inactive">下架</option>
              </select>
            </div>
          </div>

          {/* Packages list */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">中文名稱</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">時長</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">狀態</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">排序</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">價格選項</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredPackages.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                        暫無度假套餐
                      </td>
                    </tr>
                  ) : (
                    filteredPackages.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-[#0d1b2a]">
                          <div className="flex items-center gap-2">
                            {item.imageUrl && (
                              <img src={item.imageUrl} alt="" className="w-8 h-8 rounded object-cover" />
                            )}
                            {item.nameZh}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{item.duration || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(item.status)}`}>
                            {item.status === 'active' ? '上架' : '下架'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{item.sortOrder}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {item.pricingOptions?.map((o) => `${o.label}: ${o.currency === 'HKD' ? 'HK$' : o.currency}${o.price}`).join(' / ') || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => startEdit(item)} className="text-xs text-[#0a4c6b] hover:underline">
                              編輯
                            </button>
                            {deleteConfirmId === item.id ? (
                              <>
                                <button
                                  onClick={() => confirmDelete(item.id)}
                                  className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                                >
                                  確認
                                </button>
                                <button onClick={() => setDeleteConfirmId(null)} className="text-xs text-gray-500 hover:text-gray-700">
                                  取消
                                </button>
                              </>
                            ) : (
                              <button onClick={() => setDeleteConfirmId(item.id)} className="text-xs text-red-500 hover:text-red-700">
                                刪除
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeSubTab === 'bookings' && (
        <>
          {bookingsError && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{bookingsError}</p>}
          <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">訂單狀態</label>
              <select
                value={bookingStatusFilter}
                onChange={(e) => setBookingStatusFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">全部</option>
                <option value="pending">待處理</option>
                <option value="confirmed">已確認</option>
                <option value="cancelled">已取消</option>
                <option value="completed">已完成</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">付款狀態</label>
              <select
                value={bookingPaymentFilter}
                onChange={(e) => setBookingPaymentFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">全部</option>
                <option value="unpaid">未付款</option>
                <option value="partial">部分付款</option>
                <option value="paid">已付款</option>
                <option value="refunded">已退款</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">編號</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">套餐</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">客戶</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">出發日期</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">房型</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">金額</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">付款</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">狀態</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {bookingsLoading ? (
                    <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-500">載入中…</td></tr>
                  ) : bookings.length === 0 ? (
                    <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-500">暫無套餐訂單</td></tr>
                  ) : (
                    bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono">#{b.id}</td>
                        <td className="px-4 py-3 text-[#0d1b2a] font-medium">{b.package?.nameZh || `套餐 #${b.packageId}`}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-[#0d1b2a]">{b.customerName || '—'}</p>
                          <p className="text-xs text-gray-500">{b.customerEmail}</p>
                          <p className="text-xs text-gray-400">{b.customerPhone || ''}</p>
                        </td>
                        <td className="px-4 py-3">{new Date(b.checkIn * 1000).toLocaleDateString('zh-HK')}</td>
                        <td className="px-4 py-3">{b.occupancy === 'shared' ? '二人同房' : '單人房'}</td>
                        <td className="px-4 py-3 font-medium">
                          {b.currency === 'HKD' ? 'HK$' : b.currency}{b.totalAmount?.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            b.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                            b.paymentStatus === 'refunded' ? 'bg-blue-100 text-blue-700' :
                            b.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {paymentStatusMap[b.paymentStatus] || b.paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            b.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            b.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {statusMap[b.status] || b.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <select
                              value={b.status}
                              onChange={(e) => updateBookingStatus(b.id, e.target.value)}
                              className="text-xs border border-gray-200 rounded-lg px-2 py-1"
                            >
                              <option value="pending">待處理</option>
                              <option value="confirmed">已確認</option>
                              <option value="cancelled">已取消</option>
                              <option value="completed">已完成</option>
                            </select>
                            {b.paymentStatus !== 'paid' && b.paymentStatus !== 'refunded' && (
                              <button
                                onClick={() => markBookingPaid(b.id)}
                                className="text-xs bg-[#0a4c6b] text-white px-2 py-1 rounded hover:bg-[#083d56]"
                              >
                                標記付款
                              </button>
                            )}
                            <button
                              onClick={() => printPackageBookingConfirmation(b.id)}
                              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded"
                            >
                              列印確認單
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
