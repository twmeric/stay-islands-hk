import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { client } from '../api/client';
import { useAuthStore } from '../store/authStore';
import DashboardSection from '../components/admin/DashboardSection';
import CustomersSection from '../components/admin/CustomersSection';
import LeadsSection from '../components/admin/LeadsSection';
import PaymentsSection from '../components/admin/PaymentsSection';
import {
  Anchor,
  Compass,
  Fish,
  Heart,
  MapPin,
  Mountain,
  Palmtree,
  Sailboat,
  Shell,
  Ship,
  Star,
  Sun,
  Sunset,
  TreePine,
  Users,
  Waves,
  Zap,
} from 'lucide-react';

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

interface AdminAccount {
  id: number;
  userId: string;
  email: string;
  role: string;
  createdAt: number;
}

interface Experience {
  id: number;
  name: string;
  nameZh: string;
  slug: string;
  description: string | null;
  descriptionZh: string | null;
  duration: string | null;
  groupSize: string | null;
  includes: string | null;
  priceNote: string | null;
  imageUrl: string | null;
  iconName: string | null;
  sortOrder: number;
  status: 'active' | 'inactive';
  createdAt: number;
  updatedAt: number;
}

interface Retreat {
  id: number;
  name: string;
  nameZh: string;
  slug: string;
  description: string | null;
  descriptionZh: string | null;
  duration: string | null;
  location: string | null;
  audience: string | null;
  itinerary: string | null;
  priceNote: string | null;
  imageUrl: string | null;
  iconName: string | null;
  sortOrder: number;
  status: 'active' | 'inactive';
  createdAt: number;
  updatedAt: number;
}

interface Property {
  id: number;
  name: string;
  nameZh: string;
  description: string | null;
  descriptionZh: string | null;
  location: string | null;
  pricePerNight: number;
  maxGuests: number | null;
  imageUrl: string | null;
  gallery: string | null;
  facilities: string | null;
  locationDetails: string | null;
  story: string | null;
  status: 'active' | 'inactive' | 'draft';
  createdAt: number;
  updatedAt: number;
}

interface RoomType {
  id: number;
  propertyId: number;
  name: string;
  nameZh: string;
  description: string | null;
  descriptionZh: string | null;
  pricePerNight: number;
  maxGuests: number | null;
  inventory: number;
  imageUrl: string | null;
  amenities: string | null;
  bedType: string | null;
  view: string | null;
  sizeSqm: number | null;
  occupancy: string | null;
  gallery: string | null;
  features: string | null;
  status: 'available' | 'unavailable' | 'hidden';
  createdAt: number;
  updatedAt: number;
}

interface ExperienceFormState {
  name: string;
  nameZh: string;
  slug: string;
  description: string;
  descriptionZh: string;
  duration: string;
  groupSize: string;
  includesText: string;
  priceNote: string;
  imageUrl: string;
  iconName: string;
  sortOrder: string;
  status: 'active' | 'inactive';
}

interface RetreatFormState {
  name: string;
  nameZh: string;
  slug: string;
  description: string;
  descriptionZh: string;
  duration: string;
  location: string;
  audience: string;
  itinerary: { day: string; title: string; desc: string }[];
  priceNote: string;
  imageUrl: string;
  iconName: string;
  sortOrder: string;
  status: 'active' | 'inactive';
}

interface FacilityItem {
  icon: string;
  label: string;
}

interface LocationDetailsShape {
  description: string;
  mapImage: string;
  nearby: string[];
}

interface StoryShape {
  title: string;
  content: string;
}

interface PropertyFormState {
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  location: string;
  pricePerNight: string;
  maxGuests: string;
  imageUrl: string;
  status: 'active' | 'inactive' | 'draft';
  gallery: string[];
  facilities: FacilityItem[];
  locationDetails: LocationDetailsShape;
  story: StoryShape;
}

interface RoomTypeFormState {
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  pricePerNight: string;
  maxGuests: string;
  inventory: string;
  imageUrl: string;
  amenitiesText: string;
  bedType: string;
  view: string;
  sizeSqm: string;
  occupancy: string;
  gallery: string[];
  featuresText: string;
  status: 'available' | 'unavailable' | 'hidden';
}

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
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

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Anchor,
  Compass,
  Fish,
  Heart,
  MapPin,
  Mountain,
  Palmtree,
  Sailboat,
  Shell,
  Ship,
  Star,
  Sun,
  Sunset,
  TreePine,
  Users,
  Waves,
  Zap,
};

const ICON_NAMES = Object.keys(ICONS);

function IconPreview({ name }: { name: string | null | undefined }) {
  const Comp = ICONS[name || ''] || Compass;
  return <Comp className="w-5 h-5" />;
}

function statusBadgeClass(status: string) {
  switch (status) {
    case 'active':
    case 'available':
      return 'bg-green-100 text-green-700';
    case 'inactive':
    case 'unavailable':
      return 'bg-red-100 text-red-700';
    case 'draft':
    case 'hidden':
      return 'bg-gray-100 text-gray-700';
    default:
      return 'bg-yellow-100 text-yellow-700';
  }
}

// ============================================================================
// Experiences Section
// ============================================================================

function ExperiencesSection() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const emptyForm = (): ExperienceFormState => ({
    name: '',
    nameZh: '',
    slug: '',
    description: '',
    descriptionZh: '',
    duration: '',
    groupSize: '',
    includesText: '',
    priceNote: '',
    imageUrl: '',
    iconName: 'Compass',
    sortOrder: '0',
    status: 'active',
  });

  const [form, setForm] = useState<ExperienceFormState>(emptyForm());

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await client.api.fetch('/api/admin/experiences');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '載入失敗');
      setExperiences(data.data || []);
    } catch (err: any) {
      setError(err.message || '載入體驗時發生錯誤');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setEditingId(null);
    setForm(emptyForm());
    setIsFormOpen(true);
    setError('');
    setSuccess('');
    setDeleteConfirmId(null);
  }

  function startEdit(item: Experience) {
    setEditingId(item.id);
    setForm({
      name: item.name || '',
      nameZh: item.nameZh || '',
      slug: item.slug || '',
      description: item.description || '',
      descriptionZh: item.descriptionZh || '',
      duration: item.duration || '',
      groupSize: item.groupSize || '',
      includesText: arrayToLines(safeJsonParse<string[]>(item.includes, [])),
      priceNote: item.priceNote || '',
      imageUrl: item.imageUrl || '',
      iconName: item.iconName || 'Compass',
      sortOrder: String(item.sortOrder ?? 0),
      status: item.status,
    });
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

  async function save() {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const body = {
        name: form.name.trim(),
        nameZh: form.nameZh.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || null,
        descriptionZh: form.descriptionZh.trim() || null,
        duration: form.duration.trim() || null,
        groupSize: form.groupSize.trim() || null,
        includes: linesToArray(form.includesText),
        priceNote: form.priceNote.trim() || null,
        imageUrl: form.imageUrl.trim() || null,
        iconName: form.iconName.trim() || null,
        sortOrder: Number(form.sortOrder) || 0,
        status: form.status,
      };

      if (!body.name || !body.nameZh || !body.slug) {
        throw new Error('請填寫名稱、中文名稱與 slug');
      }

      let res: Response;
      if (editingId) {
        res = await client.api.fetch(`/api/admin/experiences/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        res = await client.api.fetch('/api/admin/experiences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '儲存失敗');

      setSuccess(editingId ? '體驗已更新' : '體驗已新增');
      closeForm();
      await load();
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
      const res = await client.api.fetch(`/api/admin/experiences/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '刪除失敗');
      setSuccess('體驗已刪除');
      await load();
    } catch (err: any) {
      setError(err.message || '刪除時發生錯誤');
    } finally {
      setLoading(false);
      setDeleteConfirmId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg text-[#0d1b2a]">海島體驗管理</h3>
        <button
          onClick={openNew}
          className="bg-[#0a4c6b] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#083d56] transition"
        >
          新增體驗
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>
      )}
      {success && (
        <p className="text-sm text-green-600 bg-green-50 px-4 py-3 rounded-lg">{success}</p>
      )}

      {isFormOpen && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h4 className="font-semibold text-[#0d1b2a] mb-4">
            {editingId ? '編輯體驗' : '新增體驗'}
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
                placeholder="例如：3 小時"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">團體人數</label>
              <input
                type="text"
                value={form.groupSize}
                onChange={(e) => setForm({ ...form, groupSize: e.target.value })}
                placeholder="例如：2-6 人"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">價格備註</label>
              <input
                type="text"
                value={form.priceNote}
                onChange={(e) => setForm({ ...form, priceNote: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">圖片網址</label>
              <input
                type="text"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
              />
              <ImagePreview url={form.imageUrl} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">圖示</label>
              <div className="flex items-center gap-2">
                <select
                  value={form.iconName}
                  onChange={(e) => setForm({ ...form, iconName: e.target.value })}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                >
                  {ICON_NAMES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <div className="text-[#0a4c6b]">
                  <IconPreview name={form.iconName} />
                </div>
              </div>
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
              <label className="block text-xs text-gray-500 mb-1">
                包含項目（每行一項，提交後轉為陣列）
              </label>
              <textarea
                value={form.includesText}
                onChange={(e) => setForm({ ...form, includesText: e.target.value })}
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={save}
              disabled={loading}
              className="bg-[#0a4c6b] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#083d56] transition disabled:opacity-60"
            >
              {loading ? '儲存中…' : editingId ? '更新體驗' : '新增體驗'}
            </button>
            <button
              onClick={closeForm}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2"
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">中文名稱</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">時長</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">狀態</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">排序</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {experiences.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                    暫無體驗
                  </td>
                </tr>
              ) : (
                experiences.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-[#0d1b2a]">
                      <div className="flex items-center gap-2">
                        <span className="text-[#0a4c6b]">
                          <IconPreview name={item.iconName} />
                        </span>
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
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(item)}
                          className="text-xs text-[#0a4c6b] hover:underline"
                        >
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
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="text-xs text-gray-500 hover:text-gray-700"
                            >
                              取消
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(item.id)}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
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
    </div>
  );
}

// ============================================================================
// Retreats Section
// ============================================================================

function RetreatsSection() {
  const [retreats, setRetreats] = useState<Retreat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const emptyForm = (): RetreatFormState => ({
    name: '',
    nameZh: '',
    slug: '',
    description: '',
    descriptionZh: '',
    duration: '',
    location: '',
    audience: '',
    itinerary: [],
    priceNote: '',
    imageUrl: '',
    iconName: 'Compass',
    sortOrder: '0',
    status: 'active',
  });

  const [form, setForm] = useState<RetreatFormState>(emptyForm());

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await client.api.fetch('/api/admin/retreats');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '載入失敗');
      setRetreats(data.data || []);
    } catch (err: any) {
      setError(err.message || '載入靜修時發生錯誤');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setEditingId(null);
    setForm(emptyForm());
    setIsFormOpen(true);
    setError('');
    setSuccess('');
    setDeleteConfirmId(null);
  }

  function startEdit(item: Retreat) {
    setEditingId(item.id);
    setForm({
      name: item.name || '',
      nameZh: item.nameZh || '',
      slug: item.slug || '',
      description: item.description || '',
      descriptionZh: item.descriptionZh || '',
      duration: item.duration || '',
      location: item.location || '',
      audience: item.audience || '',
      itinerary: safeJsonParse<{ day: string; title: string; desc: string }[]>(item.itinerary, []),
      priceNote: item.priceNote || '',
      imageUrl: item.imageUrl || '',
      iconName: item.iconName || 'Compass',
      sortOrder: String(item.sortOrder ?? 0),
      status: item.status,
    });
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
    setForm({
      ...form,
      itinerary: [...form.itinerary, { day: '', title: '', desc: '' }],
    });
  }

  function updateItinerary(index: number, field: 'day' | 'title' | 'desc', value: string) {
    const next = form.itinerary.map((it, i) => (i === index ? { ...it, [field]: value } : it));
    setForm({ ...form, itinerary: next });
  }

  function removeItinerary(index: number) {
    setForm({ ...form, itinerary: form.itinerary.filter((_, i) => i !== index) });
  }

  async function save() {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const body = {
        name: form.name.trim(),
        nameZh: form.nameZh.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || null,
        descriptionZh: form.descriptionZh.trim() || null,
        duration: form.duration.trim() || null,
        location: form.location.trim() || null,
        audience: form.audience.trim() || null,
        itinerary: form.itinerary.filter((it) => it.day || it.title || it.desc),
        priceNote: form.priceNote.trim() || null,
        imageUrl: form.imageUrl.trim() || null,
        iconName: form.iconName.trim() || null,
        sortOrder: Number(form.sortOrder) || 0,
        status: form.status,
      };

      if (!body.name || !body.nameZh || !body.slug) {
        throw new Error('請填寫名稱、中文名稱與 slug');
      }

      let res: Response;
      if (editingId) {
        res = await client.api.fetch(`/api/admin/retreats/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        res = await client.api.fetch('/api/admin/retreats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '儲存失敗');

      setSuccess(editingId ? '靜修已更新' : '靜修已新增');
      closeForm();
      await load();
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
      const res = await client.api.fetch(`/api/admin/retreats/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '刪除失敗');
      setSuccess('靜修已刪除');
      await load();
    } catch (err: any) {
      setError(err.message || '刪除時發生錯誤');
    } finally {
      setLoading(false);
      setDeleteConfirmId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg text-[#0d1b2a]">主題靜修管理</h3>
        <button
          onClick={openNew}
          className="bg-[#0a4c6b] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#083d56] transition"
        >
          新增靜修
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>
      )}
      {success && (
        <p className="text-sm text-green-600 bg-green-50 px-4 py-3 rounded-lg">{success}</p>
      )}

      {isFormOpen && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h4 className="font-semibold text-[#0d1b2a] mb-4">
            {editingId ? '編輯靜修' : '新增靜修'}
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
                placeholder="例如：5 天 4 夜"
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
              <label className="block text-xs text-gray-500 mb-1">價格備註</label>
              <input
                type="text"
                value={form.priceNote}
                onChange={(e) => setForm({ ...form, priceNote: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">圖片網址</label>
              <input
                type="text"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
              />
              <ImagePreview url={form.imageUrl} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">圖示</label>
              <div className="flex items-center gap-2">
                <select
                  value={form.iconName}
                  onChange={(e) => setForm({ ...form, iconName: e.target.value })}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                >
                  {ICON_NAMES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <div className="text-[#0a4c6b]">
                  <IconPreview name={form.iconName} />
                </div>
              </div>
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
          </div>

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
              {form.itinerary.length === 0 && (
                <p className="text-sm text-gray-400">尚未設定行程</p>
              )}
              {form.itinerary.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-3 items-start border rounded-lg p-3 bg-gray-50">
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={it.day}
                      onChange={(e) => updateItinerary(idx, 'day', e.target.value)}
                      placeholder="Day"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                    />
                  </div>
                  <div className="col-span-4">
                    <input
                      type="text"
                      value={it.title}
                      onChange={(e) => updateItinerary(idx, 'title', e.target.value)}
                      placeholder="標題"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                    />
                  </div>
                  <div className="col-span-5">
                    <textarea
                      value={it.desc}
                      onChange={(e) => updateItinerary(idx, 'desc', e.target.value)}
                      placeholder="描述"
                      rows={2}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                    />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      onClick={() => removeItinerary(idx)}
                      className="text-xs text-red-500 hover:text-red-700 px-2 py-2"
                    >
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
              {loading ? '儲存中…' : editingId ? '更新靜修' : '新增靜修'}
            </button>
            <button
              onClick={closeForm}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2"
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">中文名稱</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">時長</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">地點</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">狀態</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {retreats.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                    暫無靜修
                  </td>
                </tr>
              ) : (
                retreats.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-[#0d1b2a]">
                      <div className="flex items-center gap-2">
                        <span className="text-[#0a4c6b]">
                          <IconPreview name={item.iconName} />
                        </span>
                        {item.nameZh}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.duration || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{item.location || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(item.status)}`}>
                        {item.status === 'active' ? '上架' : '下架'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(item)}
                          className="text-xs text-[#0a4c6b] hover:underline"
                        >
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
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="text-xs text-gray-500 hover:text-gray-700"
                            >
                              取消
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(item.id)}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
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
    </div>
  );
}

// ============================================================================
// Properties Section
// ============================================================================

function PropertiesSection() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | 'new' | null>(null);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirmPropertyId, setDeleteConfirmPropertyId] = useState<number | null>(null);
  const [deleteConfirmRoomTypeId, setDeleteConfirmRoomTypeId] = useState<number | null>(null);

  const [editingRoomTypeId, setEditingRoomTypeId] = useState<number | 'new' | null>(null);

  const emptyPropertyForm = (): PropertyFormState => ({
    name: '',
    nameZh: '',
    description: '',
    descriptionZh: '',
    location: '',
    pricePerNight: '',
    maxGuests: '',
    imageUrl: '',
    status: 'draft',
    gallery: [],
    facilities: [],
    locationDetails: { description: '', mapImage: '', nearby: [] },
    story: { title: '', content: '' },
  });

  const [propertyForm, setPropertyForm] = useState<PropertyFormState>(emptyPropertyForm());
  const [allExperiences, setAllExperiences] = useState<Experience[]>([]);
  const [allRetreats, setAllRetreats] = useState<Retreat[]>([]);
  const [selectedExperienceIds, setSelectedExperienceIds] = useState<number[]>([]);
  const [selectedRetreatIds, setSelectedRetreatIds] = useState<number[]>([]);

  const emptyRoomTypeForm = (): RoomTypeFormState => ({
    name: '',
    nameZh: '',
    description: '',
    descriptionZh: '',
    pricePerNight: '',
    maxGuests: '',
    inventory: '1',
    imageUrl: '',
    amenitiesText: '',
    bedType: '',
    view: '',
    sizeSqm: '',
    occupancy: '',
    gallery: [],
    featuresText: '',
    status: 'available',
  });

  const [roomTypeForm, setRoomTypeForm] = useState<RoomTypeFormState>(emptyRoomTypeForm());

  async function loadProperties() {
    setLoading(true);
    setError('');
    try {
      const res = await client.api.fetch('/api/admin/properties');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '載入失敗');
      setProperties(data.data || []);
    } catch (err: any) {
      setError(err.message || '載入住宿時發生錯誤');
    } finally {
      setLoading(false);
    }
  }

  async function loadAllExperiencesAndRetreats() {
    try {
      const [expRes, retRes] = await Promise.all([
        client.api.fetch('/api/admin/experiences'),
        client.api.fetch('/api/admin/retreats'),
      ]);
      const expData = await expRes.json();
      const retData = await retRes.json();
      setAllExperiences(expData.data || []);
      setAllRetreats(retData.data || []);
    } catch (err: any) {
      console.error(err);
    }
  }

  async function loadPropertyDetail(id: number) {
    setLoading(true);
    setError('');
    try {
      const [propertyRes, roomTypesRes] = await Promise.all([
        client.api.fetch(`/api/admin/properties/${id}`),
        client.api.fetch(`/api/admin/properties/${id}/room-types`),
      ]);
      const propertyData = await propertyRes.json();
      const roomTypesData = await roomTypesRes.json();
      if (!propertyRes.ok) throw new Error(propertyData.error || '載入失敗');

      const p: Property & { roomTypes?: RoomType[]; experiences?: Experience[]; retreats?: Retreat[] } = propertyData.data;
      setPropertyForm({
        name: p.name || '',
        nameZh: p.nameZh || '',
        description: p.description || '',
        descriptionZh: p.descriptionZh || '',
        location: p.location || '',
        pricePerNight: String(p.pricePerNight ?? ''),
        maxGuests: p.maxGuests != null ? String(p.maxGuests) : '',
        imageUrl: p.imageUrl || '',
        status: p.status,
        gallery: safeJsonParse<string[]>(p.gallery, []),
        facilities: safeJsonParse<FacilityItem[]>(p.facilities, []),
        locationDetails: safeJsonParse<LocationDetailsShape>(p.locationDetails, {
          description: '',
          mapImage: '',
          nearby: [],
        }),
        story: safeJsonParse<StoryShape>(p.story, { title: '', content: '' }),
      });
      setRoomTypes(roomTypesData.data || p.roomTypes || []);
      setSelectedExperienceIds((p.experiences || []).map((e) => e.id));
      setSelectedRetreatIds((p.retreats || []).map((r) => r.id));
    } catch (err: any) {
      setError(err.message || '載入住宿詳情時發生錯誤');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    if (selectedPropertyId === 'new') {
      setPropertyForm(emptyPropertyForm());
      setRoomTypes([]);
      setEditingRoomTypeId(null);
      setRoomTypeForm(emptyRoomTypeForm());
      setSelectedExperienceIds([]);
      setSelectedRetreatIds([]);
      loadAllExperiencesAndRetreats();
    } else if (typeof selectedPropertyId === 'number') {
      loadPropertyDetail(selectedPropertyId);
      setEditingRoomTypeId(null);
      setRoomTypeForm(emptyRoomTypeForm());
      loadAllExperiencesAndRetreats();
    }
  }, [selectedPropertyId]);

  function openNewProperty() {
    setSelectedPropertyId('new');
    setError('');
    setSuccess('');
    setDeleteConfirmPropertyId(null);
  }

  function closePropertyEditor() {
    setSelectedPropertyId(null);
    setPropertyForm(emptyPropertyForm());
    setRoomTypes([]);
    setEditingRoomTypeId(null);
  }

  async function saveProperty() {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const body = {
        name: propertyForm.name.trim(),
        nameZh: propertyForm.nameZh.trim(),
        description: propertyForm.description.trim() || null,
        descriptionZh: propertyForm.descriptionZh.trim() || null,
        location: propertyForm.location.trim() || null,
        pricePerNight: Number(propertyForm.pricePerNight) || 0,
        maxGuests: propertyForm.maxGuests === '' ? null : Number(propertyForm.maxGuests),
        imageUrl: propertyForm.imageUrl.trim() || null,
        status: propertyForm.status,
        gallery: propertyForm.gallery.filter(Boolean),
        facilities: propertyForm.facilities.filter((f) => f.label.trim()),
        locationDetails: propertyForm.locationDetails,
        story: propertyForm.story,
      };

      if (!body.name || !body.nameZh) {
        throw new Error('請填寫英文名稱與中文名稱');
      }

      let res: Response;
      let savedPropertyId: number | null = null;
      if (selectedPropertyId === 'new') {
        res = await client.api.fetch('/api/admin/properties', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else if (typeof selectedPropertyId === 'number') {
        res = await client.api.fetch(`/api/admin/properties/${selectedPropertyId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        throw new Error('未選擇住宿');
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '儲存失敗');
      savedPropertyId = data.data?.id ?? null;

      // Save linked experiences & retreats
      const propertyIdToLink = savedPropertyId ?? (typeof selectedPropertyId === 'number' ? selectedPropertyId : null);
      if (propertyIdToLink != null) {
        await Promise.all([
          client.api.fetch(`/api/admin/properties/${propertyIdToLink}/experiences`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ experienceIds: selectedExperienceIds }),
          }),
          client.api.fetch(`/api/admin/properties/${propertyIdToLink}/retreats`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ retreatIds: selectedRetreatIds }),
          }),
        ]);
      }

      setSuccess(selectedPropertyId === 'new' ? '住宿已新增' : '住宿已更新');
      closePropertyEditor();
      await loadProperties();
    } catch (err: any) {
      setError(err.message || '儲存時發生錯誤');
    } finally {
      setLoading(false);
    }
  }

  async function confirmDeleteProperty(id: number) {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await client.api.fetch(`/api/admin/properties/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '刪除失敗');
      setSuccess('住宿已刪除');
      if (selectedPropertyId === id) closePropertyEditor();
      await loadProperties();
    } catch (err: any) {
      setError(err.message || '刪除時發生錯誤');
    } finally {
      setLoading(false);
      setDeleteConfirmPropertyId(null);
    }
  }

  // Room type helpers
  function startNewRoomType() {
    setEditingRoomTypeId('new');
    setRoomTypeForm(emptyRoomTypeForm());
  }

  function startEditRoomType(rt: RoomType) {
    setEditingRoomTypeId(rt.id);
    setRoomTypeForm({
      name: rt.name || '',
      nameZh: rt.nameZh || '',
      description: rt.description || '',
      descriptionZh: rt.descriptionZh || '',
      pricePerNight: String(rt.pricePerNight ?? ''),
      maxGuests: rt.maxGuests != null ? String(rt.maxGuests) : '',
      inventory: String(rt.inventory ?? 1),
      imageUrl: rt.imageUrl || '',
      amenitiesText: arrayToLines(safeJsonParse<string[]>(rt.amenities, [])),
      bedType: rt.bedType || '',
      view: rt.view || '',
      sizeSqm: rt.sizeSqm != null ? String(rt.sizeSqm) : '',
      occupancy: rt.occupancy || '',
      gallery: safeJsonParse<string[]>(rt.gallery, []),
      featuresText: arrayToLines(safeJsonParse<string[]>(rt.features, [])),
      status: rt.status,
    });
  }

  function closeRoomTypeForm() {
    setEditingRoomTypeId(null);
    setRoomTypeForm(emptyRoomTypeForm());
  }

  async function saveRoomType() {
    if (selectedPropertyId == null || selectedPropertyId === 'new') {
      setError('請先儲存住宿後再新增房型');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const body = {
        name: roomTypeForm.name.trim(),
        nameZh: roomTypeForm.nameZh.trim(),
        description: roomTypeForm.description.trim() || null,
        descriptionZh: roomTypeForm.descriptionZh.trim() || null,
        pricePerNight: Number(roomTypeForm.pricePerNight) || 0,
        maxGuests: roomTypeForm.maxGuests === '' ? null : Number(roomTypeForm.maxGuests),
        inventory: Number(roomTypeForm.inventory) || 1,
        imageUrl: roomTypeForm.imageUrl.trim() || null,
        amenities: linesToArray(roomTypeForm.amenitiesText),
        bedType: roomTypeForm.bedType.trim() || null,
        view: roomTypeForm.view.trim() || null,
        sizeSqm: roomTypeForm.sizeSqm === '' ? null : Number(roomTypeForm.sizeSqm),
        occupancy: roomTypeForm.occupancy.trim() || null,
        gallery: roomTypeForm.gallery.filter(Boolean),
        features: linesToArray(roomTypeForm.featuresText),
        status: roomTypeForm.status,
      };

      if (!body.name || !body.nameZh) {
        throw new Error('請填寫房型名稱');
      }

      let res: Response;
      if (editingRoomTypeId === 'new') {
        res = await client.api.fetch(`/api/admin/properties/${selectedPropertyId}/room-types`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else if (typeof editingRoomTypeId === 'number') {
        res = await client.api.fetch(`/api/admin/room-types/${editingRoomTypeId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        throw new Error('未選擇房型');
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '儲存失敗');

      setSuccess(editingRoomTypeId === 'new' ? '房型已新增' : '房型已更新');
      closeRoomTypeForm();
      await loadPropertyDetail(selectedPropertyId);
    } catch (err: any) {
      setError(err.message || '儲存房型時發生錯誤');
    } finally {
      setLoading(false);
    }
  }

  async function confirmDeleteRoomType(id: number) {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await client.api.fetch(`/api/admin/room-types/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '刪除失敗');
      setSuccess('房型已刪除');
      if (typeof selectedPropertyId === 'number') {
        await loadPropertyDetail(selectedPropertyId);
      }
    } catch (err: any) {
      setError(err.message || '刪除房型時發生錯誤');
    } finally {
      setLoading(false);
      setDeleteConfirmRoomTypeId(null);
    }
  }

  // JSON field helpers for property form
  function addGalleryImage() {
    setPropertyForm({ ...propertyForm, gallery: [...propertyForm.gallery, ''] });
  }

  function updateGalleryImage(index: number, value: string) {
    const next = propertyForm.gallery.map((url, i) => (i === index ? value : url));
    setPropertyForm({ ...propertyForm, gallery: next });
  }

  function removeGalleryImage(index: number) {
    setPropertyForm({ ...propertyForm, gallery: propertyForm.gallery.filter((_, i) => i !== index) });
  }

  function addFacility() {
    setPropertyForm({ ...propertyForm, facilities: [...propertyForm.facilities, { icon: '', label: '' }] });
  }

  function updateFacility(index: number, field: 'icon' | 'label', value: string) {
    const next = propertyForm.facilities.map((f, i) => (i === index ? { ...f, [field]: value } : f));
    setPropertyForm({ ...propertyForm, facilities: next });
  }

  function removeFacility(index: number) {
    setPropertyForm({ ...propertyForm, facilities: propertyForm.facilities.filter((_, i) => i !== index) });
  }

  function toggleExperience(id: number) {
    setSelectedExperienceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleRetreat(id: number) {
    setSelectedRetreatIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function addNearby() {
    setPropertyForm({
      ...propertyForm,
      locationDetails: {
        ...propertyForm.locationDetails,
        nearby: [...propertyForm.locationDetails.nearby, ''],
      },
    });
  }

  function updateNearby(index: number, value: string) {
    const next = propertyForm.locationDetails.nearby.map((n, i) => (i === index ? value : n));
    setPropertyForm({ ...propertyForm, locationDetails: { ...propertyForm.locationDetails, nearby: next } });
  }

  function removeNearby(index: number) {
    setPropertyForm({
      ...propertyForm,
      locationDetails: {
        ...propertyForm.locationDetails,
        nearby: propertyForm.locationDetails.nearby.filter((_, i) => i !== index),
      },
    });
  }

  function updateStory(field: 'title' | 'content', value: string) {
    setPropertyForm({ ...propertyForm, story: { ...propertyForm.story, [field]: value } });
  }

  // Room type gallery helpers
  function addRoomTypeGallery() {
    setRoomTypeForm({ ...roomTypeForm, gallery: [...roomTypeForm.gallery, ''] });
  }

  function updateRoomTypeGallery(index: number, value: string) {
    const next = roomTypeForm.gallery.map((url, i) => (i === index ? value : url));
    setRoomTypeForm({ ...roomTypeForm, gallery: next });
  }

  function removeRoomTypeGallery(index: number) {
    setRoomTypeForm({ ...roomTypeForm, gallery: roomTypeForm.gallery.filter((_, i) => i !== index) });
  }

  function propertyStatusLabel(status: string) {
    switch (status) {
      case 'active':
        return '上架';
      case 'inactive':
        return '下架';
      case 'draft':
        return '草稿';
      default:
        return status;
    }
  }

  function roomTypeStatusLabel(status: string) {
    switch (status) {
      case 'available':
        return '可預訂';
      case 'unavailable':
        return '不可預訂';
      case 'hidden':
        return '隱藏';
      default:
        return status;
    }
  }

  if (selectedPropertyId != null) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={closePropertyEditor}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← 返回住宿列表
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>
        )}
        {success && (
          <p className="text-sm text-green-600 bg-green-50 px-4 py-3 rounded-lg">{success}</p>
        )}

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative">
          {loading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10 rounded-2xl">
              <div className="animate-spin w-8 h-8 border-2 border-[#0a4c6b] border-t-transparent rounded-full" />
            </div>
          )}
          <h3 className="font-bold text-lg text-[#0d1b2a] mb-4">
            {selectedPropertyId === 'new' ? '新增住宿' : '編輯住宿'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs text-gray-500 mb-1">英文名稱</label>
              <input
                type="text"
                value={propertyForm.name}
                onChange={(e) => setPropertyForm({ ...propertyForm, name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">中文名稱</label>
              <input
                type="text"
                value={propertyForm.nameZh}
                onChange={(e) => setPropertyForm({ ...propertyForm, nameZh: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">地點</label>
              <input
                type="text"
                value={propertyForm.location}
                onChange={(e) => setPropertyForm({ ...propertyForm, location: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">狀態</label>
              <select
                value={propertyForm.status}
                onChange={(e) =>
                  setPropertyForm({ ...propertyForm, status: e.target.value as 'active' | 'inactive' | 'draft' })
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
              >
                <option value="active">上架</option>
                <option value="inactive">下架</option>
                <option value="draft">草稿</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">每晚價格（HKD）</label>
              <input
                type="number"
                value={propertyForm.pricePerNight}
                onChange={(e) => setPropertyForm({ ...propertyForm, pricePerNight: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">最多入住人數</label>
              <input
                type="number"
                value={propertyForm.maxGuests}
                onChange={(e) => setPropertyForm({ ...propertyForm, maxGuests: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">主圖網址</label>
              <input
                type="text"
                value={propertyForm.imageUrl}
                onChange={(e) => setPropertyForm({ ...propertyForm, imageUrl: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
              />
              <ImagePreview url={propertyForm.imageUrl} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">英文描述</label>
              <textarea
                value={propertyForm.description}
                onChange={(e) => setPropertyForm({ ...propertyForm, description: e.target.value })}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">中文描述</label>
              <textarea
                value={propertyForm.descriptionZh}
                onChange={(e) => setPropertyForm({ ...propertyForm, descriptionZh: e.target.value })}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
              />
            </div>
          </div>

          {/* Gallery */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-[#0d1b2a]">圖片集（Gallery）</label>
              <button
                onClick={addGalleryImage}
                className="text-xs bg-[#B8902F]/10 text-[#B8902F] px-3 py-1 rounded-lg hover:bg-[#B8902F]/20 transition"
              >
                + 新增圖片
              </button>
            </div>
            <div className="space-y-2">
              {propertyForm.gallery.length === 0 && (
                <p className="text-sm text-gray-400">尚未設定圖片</p>
              )}
              {propertyForm.gallery.map((url, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <ImagePreview url={url} />
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => updateGalleryImage(idx, e.target.value)}
                    placeholder="圖片 URL"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                  />
                  <button
                    onClick={() => removeGalleryImage(idx)}
                    className="text-xs text-red-500 hover:text-red-700 px-2 py-2"
                  >
                    刪除
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Facilities */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-[#0d1b2a]">設施（Facilities）</label>
              <button
                onClick={addFacility}
                className="text-xs bg-[#B8902F]/10 text-[#B8902F] px-3 py-1 rounded-lg hover:bg-[#B8902F]/20 transition"
              >
                + 新增設施
              </button>
            </div>
            <div className="space-y-2">
              {propertyForm.facilities.length === 0 && (
                <p className="text-sm text-gray-400">尚未設定設施</p>
              )}
              {propertyForm.facilities.map((f, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={f.icon}
                    onChange={(e) => updateFacility(idx, 'icon', e.target.value)}
                    placeholder="圖示 emoji"
                    className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                  />
                  <input
                    type="text"
                    value={f.label}
                    onChange={(e) => updateFacility(idx, 'label', e.target.value)}
                    placeholder="設施名稱"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                  />
                  <button
                    onClick={() => removeFacility(idx)}
                    className="text-xs text-red-500 hover:text-red-700 px-2 py-2"
                  >
                    刪除
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Linked Experiences & Retreats */}
          <div className="mb-6">
            <label className="text-sm font-medium text-[#0d1b2a] mb-2 block">該住宿可加購的海島體驗</label>
            <p className="text-xs text-gray-500 mb-3">勾選後，客人會在住宿頁面看到這些體驗選項並可加入預約。</p>

            <div className="mb-4">
              <p className="text-xs font-medium text-gray-600 mb-2">單日體驗</p>
              {allExperiences.length === 0 ? (
                <p className="text-sm text-gray-400">尚未建立任何體驗</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {allExperiences.map((e) => {
                    const checked = selectedExperienceIds.includes(e.id);
                    return (
                      <label
                        key={e.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                          checked ? 'border-[#0a4c6b] bg-[#0a4c6b]/5' : 'border-gray-200 hover:border-[#2ec4b6]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleExperience(e.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm text-[#0d1b2a]">{e.nameZh}</p>
                          <p className="text-xs text-gray-500">{e.name} · {e.duration}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">主題靜修</p>
              {allRetreats.length === 0 ? (
                <p className="text-sm text-gray-400">尚未建立任何主題靜修</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {allRetreats.map((r) => {
                    const checked = selectedRetreatIds.includes(r.id);
                    return (
                      <label
                        key={r.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                          checked ? 'border-[#0a4c6b] bg-[#0a4c6b]/5' : 'border-gray-200 hover:border-[#2ec4b6]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleRetreat(r.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm text-[#0d1b2a]">{r.nameZh}</p>
                          <p className="text-xs text-gray-500">{r.name} · {r.duration}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Location details -->
          <div className="mb-6">
            <label className="text-sm font-medium text-[#0d1b2a] mb-2 block">位置詳情（Location Details）</label>
            <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
              <div>
                <label className="block text-xs text-gray-500 mb-1">位置描述</label>
                <textarea
                  value={propertyForm.locationDetails.description}
                  onChange={(e) =>
                    setPropertyForm({
                      ...propertyForm,
                      locationDetails: { ...propertyForm.locationDetails, description: e.target.value },
                    })
                  }
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">地圖圖片網址</label>
                <input
                  type="text"
                  value={propertyForm.locationDetails.mapImage}
                  onChange={(e) =>
                    setPropertyForm({
                      ...propertyForm,
                      locationDetails: { ...propertyForm.locationDetails, mapImage: e.target.value },
                    })
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                />
                <ImagePreview url={propertyForm.locationDetails.mapImage} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-500">附近景點</label>
                  <button
                    onClick={addNearby}
                    className="text-xs bg-[#B8902F]/10 text-[#B8902F] px-3 py-1 rounded-lg hover:bg-[#B8902F]/20 transition"
                  >
                    + 新增
                  </button>
                </div>
                <div className="space-y-2">
                  {propertyForm.locationDetails.nearby.length === 0 && (
                    <p className="text-sm text-gray-400">尚未設定附近景點</p>
                  )}
                  {propertyForm.locationDetails.nearby.map((n, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={n}
                        onChange={(e) => updateNearby(idx, e.target.value)}
                        placeholder="附近景點"
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                      />
                      <button
                        onClick={() => removeNearby(idx)}
                        className="text-xs text-red-500 hover:text-red-700 px-2 py-2"
                      >
                        刪除
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Story */}
          <div className="mb-6">
            <label className="text-sm font-medium text-[#0d1b2a] mb-2 block">品牌故事（Story）</label>
            <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
              <div>
                <label className="block text-xs text-gray-500 mb-1">標題</label>
                <input
                  type="text"
                  value={propertyForm.story.title}
                  onChange={(e) => updateStory('title', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">內容</label>
                <textarea
                  value={propertyForm.story.content}
                  onChange={(e) => updateStory('content', e.target.value)}
                  rows={4}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={saveProperty}
              disabled={loading}
              className="bg-[#0a4c6b] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#083d56] transition disabled:opacity-60"
            >
              {loading ? '儲存中…' : '儲存住宿'}
            </button>
            <button
              onClick={closePropertyEditor}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2"
            >
              取消
            </button>
            {selectedPropertyId !== 'new' && (
              <>
                {deleteConfirmPropertyId === selectedPropertyId ? (
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      onClick={() => confirmDeleteProperty(selectedPropertyId)}
                      className="text-xs bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600"
                    >
                      確認刪除住宿
                    </button>
                    <button
                      onClick={() => setDeleteConfirmPropertyId(null)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirmPropertyId(selectedPropertyId)}
                    className="text-xs text-red-500 hover:text-red-700 ml-auto px-3 py-2 rounded-lg hover:bg-red-50 transition"
                  >
                    刪除住宿
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Room types editor */}
        {selectedPropertyId !== 'new' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-[#0d1b2a]">房型管理</h3>
              <button
                onClick={startNewRoomType}
                className="bg-[#B8902F] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#a07f29] transition"
              >
                新增房型
              </button>
            </div>

            {editingRoomTypeId != null && (
              <div className="border rounded-xl p-4 mb-6 bg-gray-50">
                <h4 className="font-semibold text-[#0d1b2a] mb-3">
                  {editingRoomTypeId === 'new' ? '新增房型' : '編輯房型'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">英文名稱</label>
                    <input
                      type="text"
                      value={roomTypeForm.name}
                      onChange={(e) => setRoomTypeForm({ ...roomTypeForm, name: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">中文名稱</label>
                    <input
                      type="text"
                      value={roomTypeForm.nameZh}
                      onChange={(e) => setRoomTypeForm({ ...roomTypeForm, nameZh: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">狀態</label>
                    <select
                      value={roomTypeForm.status}
                      onChange={(e) =>
                        setRoomTypeForm({
                          ...roomTypeForm,
                          status: e.target.value as 'available' | 'unavailable' | 'hidden',
                        })
                      }
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                    >
                      <option value="available">可預訂</option>
                      <option value="unavailable">不可預訂</option>
                      <option value="hidden">隱藏</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">每晚價格</label>
                    <input
                      type="number"
                      value={roomTypeForm.pricePerNight}
                      onChange={(e) => setRoomTypeForm({ ...roomTypeForm, pricePerNight: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">最多入住人數</label>
                    <input
                      type="number"
                      value={roomTypeForm.maxGuests}
                      onChange={(e) => setRoomTypeForm({ ...roomTypeForm, maxGuests: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">庫存數量</label>
                    <input
                      type="number"
                      value={roomTypeForm.inventory}
                      onChange={(e) => setRoomTypeForm({ ...roomTypeForm, inventory: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">床型</label>
                    <input
                      type="text"
                      value={roomTypeForm.bedType}
                      onChange={(e) => setRoomTypeForm({ ...roomTypeForm, bedType: e.target.value })}
                      placeholder="例如：King Size"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">景觀</label>
                    <input
                      type="text"
                      value={roomTypeForm.view}
                      onChange={(e) => setRoomTypeForm({ ...roomTypeForm, view: e.target.value })}
                      placeholder="例如：海景"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">面積（平方米）</label>
                    <input
                      type="number"
                      value={roomTypeForm.sizeSqm}
                      onChange={(e) => setRoomTypeForm({ ...roomTypeForm, sizeSqm: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">入住人數說明</label>
                    <input
                      type="text"
                      value={roomTypeForm.occupancy}
                      onChange={(e) => setRoomTypeForm({ ...roomTypeForm, occupancy: e.target.value })}
                      placeholder="例如：2 成人 1 小孩"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">主圖網址</label>
                    <input
                      type="text"
                      value={roomTypeForm.imageUrl}
                      onChange={(e) => setRoomTypeForm({ ...roomTypeForm, imageUrl: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                    />
                    <ImagePreview url={roomTypeForm.imageUrl} />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs text-gray-500 mb-1">英文描述</label>
                    <textarea
                      value={roomTypeForm.description}
                      onChange={(e) => setRoomTypeForm({ ...roomTypeForm, description: e.target.value })}
                      rows={2}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs text-gray-500 mb-1">中文描述</label>
                    <textarea
                      value={roomTypeForm.descriptionZh}
                      onChange={(e) => setRoomTypeForm({ ...roomTypeForm, descriptionZh: e.target.value })}
                      rows={2}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs text-gray-500 mb-1">設施（每行一項）</label>
                    <textarea
                      value={roomTypeForm.amenitiesText}
                      onChange={(e) => setRoomTypeForm({ ...roomTypeForm, amenitiesText: e.target.value })}
                      rows={3}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs text-gray-500 mb-1">特色（每行一項）</label>
                    <textarea
                      value={roomTypeForm.featuresText}
                      onChange={(e) => setRoomTypeForm({ ...roomTypeForm, featuresText: e.target.value })}
                      rows={3}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-gray-500">房型圖片集</label>
                    <button
                      onClick={addRoomTypeGallery}
                      className="text-xs bg-[#B8902F]/10 text-[#B8902F] px-3 py-1 rounded-lg hover:bg-[#B8902F]/20 transition"
                    >
                      + 新增圖片
                    </button>
                  </div>
                  <div className="space-y-2">
                    {roomTypeForm.gallery.length === 0 && (
                      <p className="text-sm text-gray-400">尚未設定圖片</p>
                    )}
                    {roomTypeForm.gallery.map((url, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <ImagePreview url={url} />
                        <input
                          type="text"
                          value={url}
                          onChange={(e) => updateRoomTypeGallery(idx, e.target.value)}
                          placeholder="圖片 URL"
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                        />
                        <button
                          onClick={() => removeRoomTypeGallery(idx)}
                          className="text-xs text-red-500 hover:text-red-700 px-2 py-2"
                        >
                          刪除
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={saveRoomType}
                    disabled={loading}
                    className="bg-[#0a4c6b] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#083d56] transition disabled:opacity-60"
                  >
                    {loading ? '儲存中…' : editingRoomTypeId === 'new' ? '新增房型' : '更新房型'}
                  </button>
                  <button
                    onClick={closeRoomTypeForm}
                    className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">中文名稱</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">每晚價格</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">庫存</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">狀態</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {roomTypes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                        暫無房型
                      </td>
                    </tr>
                  ) : (
                    roomTypes.map((rt) => (
                      <tr key={rt.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-[#0d1b2a]">{rt.nameZh}</td>
                        <td className="px-4 py-3 text-gray-600">
                          HK${Number(rt.pricePerNight).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{rt.inventory}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(rt.status)}`}>
                            {roomTypeStatusLabel(rt.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startEditRoomType(rt)}
                              className="text-xs text-[#0a4c6b] hover:underline"
                            >
                              編輯
                            </button>
                            {deleteConfirmRoomTypeId === rt.id ? (
                              <>
                                <button
                                  onClick={() => confirmDeleteRoomType(rt.id)}
                                  className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                                >
                                  確認
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmRoomTypeId(null)}
                                  className="text-xs text-gray-500 hover:text-gray-700"
                                >
                                  取消
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmRoomTypeId(rt.id)}
                                className="text-xs text-red-500 hover:text-red-700"
                              >
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
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg text-[#0d1b2a]">住宿管理</h3>
        <button
          onClick={openNewProperty}
          className="bg-[#0a4c6b] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#083d56] transition"
        >
          新增住宿
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>
      )}
      {success && (
        <p className="text-sm text-green-600 bg-green-50 px-4 py-3 rounded-lg">{success}</p>
      )}

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">中文名稱</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">地點</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">狀態</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {properties.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-gray-500">
                    暫無住宿
                  </td>
                </tr>
              ) : (
                properties.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-[#0d1b2a]">{p.nameZh}</td>
                    <td className="px-4 py-3 text-gray-600">{p.location || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(p.status)}`}>
                        {propertyStatusLabel(p.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedPropertyId(p.id);
                            setError('');
                            setSuccess('');
                            setDeleteConfirmPropertyId(null);
                          }}
                          className="text-xs text-[#0a4c6b] hover:underline"
                        >
                          編輯 / 房型
                        </button>
                        {deleteConfirmPropertyId === p.id ? (
                          <>
                            <button
                              onClick={() => confirmDeleteProperty(p.id)}
                              className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                            >
                              確認
                            </button>
                            <button
                              onClick={() => setDeleteConfirmPropertyId(null)}
                              className="text-xs text-gray-500 hover:text-gray-700"
                            >
                              取消
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmPropertyId(p.id)}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
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
    </div>
  );
}

// ============================================================================
// Referral Section
// ============================================================================

interface ReferrerItem {
  id: number;
  name: string;
  phone: string | null;
  referralCode: string;
  token: string;
  status: 'active' | 'inactive';
  totalReferrals: number;
  totalCommission: number;
  paidCommission: number;
  referralLink: string;
  dashboardLink: string;
  whatsappDeeplink: string;
  qrCodeUrl: string;
}

interface ReferralOrderItem {
  id: number;
  booking_id: number;
  booking_token: string | null;
  referrer_id: number;
  referrer_name: string;
  order_amount: number;
  commission_amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  created_at: number;
}

interface ReferralRules {
  mode: 'percentage' | 'fixed';
  percentage: number;
  fixed_amount: number;
  currency: string;
}

function ReferralSection() {
  const [subTab, setSubTab] = useState<'partners' | 'orders' | 'settings'>('partners');
  const [referrers, setReferrers] = useState<ReferrerItem[]>([]);
  const [orders, setOrders] = useState<ReferralOrderItem[]>([]);
  const [rules, setRules] = useState<ReferralRules>({ mode: 'percentage', percentage: 5, fixed_amount: 0, currency: 'HKD' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (subTab === 'partners') loadReferrers();
    else if (subTab === 'orders') loadOrders();
    else if (subTab === 'settings') loadSettings();
  }, [subTab]);

  async function loadReferrers() {
    setLoading(true);
    setError('');
    try {
      const res = await client.api.fetch('/api/admin/referral/referrals');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '載入失敗');
      setReferrers(data.data || []);
    } catch (err: any) {
      setError(err.message || '載入夥伴失敗');
    } finally {
      setLoading(false);
    }
  }

  async function loadOrders() {
    setLoading(true);
    setError('');
    try {
      const res = await client.api.fetch('/api/admin/referral/referral-orders');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '載入失敗');
      setOrders(data.data || []);
    } catch (err: any) {
      setError(err.message || '載入佣金紀錄失敗');
    } finally {
      setLoading(false);
    }
  }

  async function loadSettings() {
    setLoading(true);
    setError('');
    try {
      const res = await client.api.fetch('/api/admin/referral/referral-settings');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '載入失敗');
      setRules(data.data || { mode: 'percentage', percentage: 5, fixed_amount: 0, currency: 'HKD' });
    } catch (err: any) {
      setError(err.message || '載入規則失敗');
    } finally {
      setLoading(false);
    }
  }

  async function createReferrer(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!newName.trim()) {
      setError('請輸入夥伴名稱');
      return;
    }
    try {
      const res = await client.api.fetch('/api/admin/referral/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), phone: newPhone.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '建立失敗');
      setNewName('');
      setNewPhone('');
      setSuccess('夥伴已建立，請複製 QR Code 或 deeplink 發送');
      await loadReferrers();
    } catch (err: any) {
      setError(err.message || '建立失敗');
    }
  }

  async function toggleStatus(id: number, current: 'active' | 'inactive') {
    const next = current === 'active' ? 'inactive' : 'active';
    try {
      const res = await client.api.fetch(`/api/admin/referral/referrals/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '更新失敗');
      }
      await loadReferrers();
    } catch (err: any) {
      setError(err.message || '更新失敗');
    }
  }

  async function resendWelcome(id: number) {
    setError('');
    setSuccess('');
    try {
      const res = await client.api.fetch(`/api/admin/referral/referrals/${id}/resend`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '發送失敗');
      setSuccess('歡迎訊息已重新發送');
    } catch (err: any) {
      setError(err.message || '發送失敗');
    }
  }

  async function updateOrderStatus(id: number, status: ReferralOrderItem['status']) {
    try {
      const res = await client.api.fetch(`/api/admin/referral/referral-orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '更新失敗');
      }
      await loadOrders();
    } catch (err: any) {
      setError(err.message || '更新失敗');
    }
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await client.api.fetch('/api/admin/referral/referral-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rules),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '儲存失敗');
      setRules(data.data);
      setSuccess('佣金規則已更新');
    } catch (err: any) {
      setError(err.message || '儲存失敗');
    }
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    });
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-blue-100 text-blue-700',
      paid: 'bg-green-100 text-green-700',
      cancelled: 'bg-gray-100 text-gray-600',
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-600',
    };
    const label: Record<string, string> = {
      pending: '待核准', approved: '已核准', paid: '已付款', cancelled: '已取消',
      active: '啟用', inactive: '停用',
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || 'bg-gray-100'}`}>{label[status] || status}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-[#0d1b2a] mb-4">分享夥伴管理</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'partners', label: '夥伴管理' },
            { key: 'orders', label: '佣金紀錄' },
            { key: 'settings', label: '佣金規則' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setSubTab(t.key as typeof subTab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                subTab === t.key
                  ? 'bg-[#0a4c6b] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}
      {success && <div className="bg-green-50 text-green-700 rounded-xl px-4 py-3 text-sm">{success}</div>}

      {subTab === 'partners' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-[#0d1b2a] mb-4">新增夥伴</h3>
            <form onSubmit={createReferrer} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="夥伴名稱"
                className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
              />
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="WhatsApp 電話（選填）"
                className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-[#0a4c6b] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#083d56] transition disabled:opacity-60"
              >
                建立
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-bold text-[#0d1b2a]">夥伴列表</h3>
            </div>
            {loading ? (
              <div className="p-8 text-center text-gray-500">載入中…</div>
            ) : referrers.length === 0 ? (
              <div className="p-8 text-center text-gray-400">尚未建立任何夥伴</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">名稱</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Code</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">狀態</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">成交 / 佣金</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">連結</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {referrers.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-[#0d1b2a]">{r.name}</p>
                          {r.phone && <p className="text-xs text-gray-500">{r.phone}</p>}
                        </td>
                        <td className="px-4 py-3 font-mono text-[#0a4c6b]">{r.referralCode}</td>
                        <td className="px-4 py-3">{statusBadge(r.status)}</td>
                        <td className="px-4 py-3">
                          <p>{r.totalReferrals} 單</p>
                          <p className="text-xs text-gray-500">HK${r.totalCommission.toLocaleString()} / HK${r.paidCommission.toLocaleString()}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => copy(r.referralLink, `link-${r.id}`)}
                              className="text-xs bg-[#f0f9f7] text-[#0a4c6b] px-2 py-1 rounded hover:bg-[#e0f3ef] transition"
                            >
                              {copiedKey === `link-${r.id}` ? '已複製' : '分享連結'}
                            </button>
                            <button
                              onClick={() => copy(r.dashboardLink, `dash-${r.id}`)}
                              className="text-xs bg-[#f0f9f7] text-[#0a4c6b] px-2 py-1 rounded hover:bg-[#e0f3ef] transition"
                            >
                              {copiedKey === `dash-${r.id}` ? '已複製' : 'Dashboard'}
                            </button>
                            <button
                              onClick={() => copy(r.whatsappDeeplink, `wa-${r.id}`)}
                              className="text-xs bg-[#f0f9f7] text-[#0a4c6b] px-2 py-1 rounded hover:bg-[#e0f3ef] transition"
                            >
                              {copiedKey === `wa-${r.id}` ? '已複製' : 'WhatsApp'}
                            </button>
                            <a
                              href={r.qrCodeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs bg-[#f8f5ed] text-[#B8902F] px-2 py-1 rounded hover:bg-[#f0e9db] transition"
                            >
                              QR Code
                            </a>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleStatus(r.id, r.status)}
                              className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-100 transition"
                            >
                              {r.status === 'active' ? '停用' : '啟用'}
                            </button>
                            {r.phone && (
                              <button
                                onClick={() => resendWelcome(r.id)}
                                className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-100 transition"
                              >
                                重發訊息
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {subTab === 'orders' && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-bold text-[#0d1b2a]">佣金紀錄</h3>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-500">載入中…</div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-gray-400">暫無佣金紀錄</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">訂單</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">夥伴</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">金額</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">佣金</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">狀態</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">更新</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono">#{o.booking_token || o.booking_id}</td>
                      <td className="px-4 py-3">{o.referrer_name}</td>
                      <td className="px-4 py-3">HK${o.order_amount.toLocaleString()}</td>
                      <td className="px-4 py-3 font-medium text-[#0a4c6b]">HK${o.commission_amount.toLocaleString()}</td>
                      <td className="px-4 py-3">{statusBadge(o.status)}</td>
                      <td className="px-4 py-3">
                        <select
                          value={o.status}
                          onChange={(e) => updateOrderStatus(o.id, e.target.value as ReferralOrderItem['status'])}
                          className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                        >
                          <option value="pending">待核准</option>
                          <option value="approved">已核准</option>
                          <option value="paid">已付款</option>
                          <option value="cancelled">已取消</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {subTab === 'settings' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm max-w-xl">
          <h3 className="font-bold text-[#0d1b2a] mb-4">佣金規則</h3>
          <form onSubmit={saveSettings} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">計算模式</label>
              <select
                value={rules.mode}
                onChange={(e) => setRules({ ...rules, mode: e.target.value as 'percentage' | 'fixed' })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
              >
                <option value="percentage">百分比 (%)</option>
                <option value="fixed">固定金額</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {rules.mode === 'percentage' ? '百分比 (%)' : '固定金額 (HKD)'}
              </label>
              <input
                type="number"
                min={0}
                step={rules.mode === 'percentage' ? 0.1 : 1}
                value={rules.mode === 'percentage' ? rules.percentage : rules.fixed_amount}
                onChange={(e) =>
                  setRules({
                    ...rules,
                    [rules.mode === 'percentage' ? 'percentage' : 'fixed_amount']: Number(e.target.value),
                  })
                }
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">貨幣</label>
              <input
                type="text"
                value={rules.currency}
                onChange={(e) => setRules({ ...rules, currency: e.target.value.toUpperCase() })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#0a4c6b] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#083d56] transition disabled:opacity-60"
            >
              儲存規則
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Admin Page
// ============================================================================

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, isAdmin, isChecking, adminRole } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bookings' | 'properties' | 'experiences' | 'customers' | 'leads' | 'payments' | 'referral' | 'accounts'>('dashboard');

  // Guard: redirect to login if not authenticated as admin
  useEffect(() => {
    if (!isChecking && (!user || !isAdmin)) {
      navigate('/auth');
    }
  }, [isChecking, user, isAdmin, navigate]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Booking management state
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('');
  const [bookingPaymentFilter, setBookingPaymentFilter] = useState<string>('');
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingDateFrom, setBookingDateFrom] = useState('');
  const [bookingDateTo, setBookingDateTo] = useState('');
  const [bookingPage, setBookingPage] = useState(1);
  const [bookingTotal, setBookingTotal] = useState(0);
  const [cancelReason, setCancelReason] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('payme');
  const [paymentReference, setPaymentReference] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [bookingActionLoading, setBookingActionLoading] = useState(false);
  const [editingBooking, setEditingBooking] = useState(false);
  const [editBookingForm, setEditBookingForm] = useState<{ checkIn: string; checkOut: string; roomTypeId: number; guests: number; totalAmount: number } | null>(null);
  const [voucherPreview, setVoucherPreview] = useState(false);
  const [bookingLinkedExperiences, setBookingLinkedExperiences] = useState<Experience[]>([]);
  const [bookingLinkedRetreats, setBookingLinkedRetreats] = useState<Retreat[]>([]);
  const [bookingAddonsDraft, setBookingAddonsDraft] = useState<Array<{ type: 'experience' | 'retreat'; id: number; name: string; nameZh: string }>>([]);
  const bookingLimit = 20;

  // Account management state
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'superadmin'>('admin');
  const [accountError, setAccountError] = useState('');
  const [accountSuccess, setAccountSuccess] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (activeTab === 'bookings') fetchBookings();
    else if (activeTab === 'accounts') fetchAccounts();
    else setLoading(false);
  }, [activeTab, bookingStatusFilter, bookingPaymentFilter, bookingSearch, bookingDateFrom, bookingDateTo, bookingPage]);

  async function fetchBookings() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', String(bookingLimit));
      params.append('offset', String((bookingPage - 1) * bookingLimit));
      if (bookingStatusFilter) params.append('status', bookingStatusFilter);
      if (bookingPaymentFilter) params.append('payment_status', bookingPaymentFilter);
      if (bookingSearch.trim()) params.append('search', bookingSearch.trim());
      if (bookingDateFrom) params.append('check_in_from', String(new Date(bookingDateFrom).getTime() / 1000));
      if (bookingDateTo) params.append('check_in_to', String(new Date(bookingDateTo).getTime() / 1000 + 24 * 60 * 60 - 1));
      const res = await client.api.fetch(`/api/admin/bookings?${params.toString()}`);
      const data = await res.json();
      setBookings(data.data || []);
      setBookingTotal(data.total || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function fetchAccounts() {
    setLoading(true);
    try {
      const res = await client.api.fetch('/api/admin/accounts');
      const data = await res.json();
      setAccounts(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function confirmBooking(id: number) {
    setBookingActionLoading(true);
    try {
      await client.api.fetch(`/api/admin/bookings/${id}/confirm`, { method: 'PATCH' });
      await fetchBookings();
      await refreshSelectedBooking(id);
    } catch (err) { console.error(err); }
    finally { setBookingActionLoading(false); }
  }

  async function markBookingPaid(id: number) {
    setBookingActionLoading(true);
    try {
      await client.api.fetch(`/api/admin/bookings/${id}/mark-paid`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod, paymentReference }),
      });
      setPaymentReference('');
      await fetchBookings();
      await refreshSelectedBooking(id);
    } catch (err) { console.error(err); }
    finally { setBookingActionLoading(false); }
  }

  async function cancelBooking(id: number) {
    setBookingActionLoading(true);
    try {
      const res = await client.api.fetch(`/api/admin/bookings/${id}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const data = await res.json();
      setCancelReason('');
      await fetchBookings();
      await refreshSelectedBooking(id);
      alert(`訂單已取消。依退改政策，應退金額：HK$${data.refund?.amount?.toLocaleString() ?? 0}（${data.refund?.percent ?? 0}%）`);
    } catch (err) { console.error(err); }
    finally { setBookingActionLoading(false); }
  }

  async function saveBookingNotes(id: number) {
    setBookingActionLoading(true);
    try {
      await client.api.fetch(`/api/admin/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes }),
      });
      await fetchBookings();
      await refreshSelectedBooking(id);
    } catch (err) { console.error(err); }
    finally { setBookingActionLoading(false); }
  }

  async function refreshSelectedBooking(id: number) {
    if (selectedBooking?.id !== id) return;
    try {
      const res = await client.api.fetch(`/api/admin/bookings/${id}`);
      const data = await res.json();
      if (data.data) setSelectedBooking(data.data);
    } catch (err) { console.error(err); }
  }

  function parseBookingAddons(addons: any) {
    try {
      const arr = JSON.parse(addons || '[]');
      if (!Array.isArray(arr)) return [];
      return arr
        .filter((a: any) => a && (a.type === 'experience' || a.type === 'retreat') && a.id)
        .map((a: any) => ({
          type: a.type as 'experience' | 'retreat',
          id: Number(a.id),
          name: String(a.name || ''),
          nameZh: String(a.nameZh || ''),
        }));
    } catch { return []; }
  }

  async function loadBookingLinkedItems(propertyId: number) {
    try {
      const res = await client.api.fetch(`/api/admin/properties/${propertyId}`);
      const data = await res.json();
      if (data.data) {
        setBookingLinkedExperiences(data.data.experiences || []);
        setBookingLinkedRetreats(data.data.retreats || []);
      }
    } catch (err) { console.error(err); }
  }

  function toggleBookingAddon(item: Experience | Retreat, type: 'experience' | 'retreat') {
    setBookingAddonsDraft((prev) => {
      const exists = prev.some((a) => a.id === item.id && a.type === type);
      if (exists) return prev.filter((a) => !(a.id === item.id && a.type === type));
      return [...prev, { type, id: item.id, name: item.name, nameZh: item.nameZh }];
    });
  }

  async function saveBookingAddons(id: number) {
    setBookingActionLoading(true);
    try {
      const res = await client.api.fetch(`/api/admin/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addons: bookingAddonsDraft }),
      });
      if (!res.ok) throw new Error('更新失敗');
      await fetchBookings();
      await refreshSelectedBooking(id);
    } catch (err) { console.error(err); }
    finally { setBookingActionLoading(false); }
  }

  useEffect(() => {
    if (selectedBooking?.propertyId) {
      loadBookingLinkedItems(selectedBooking.propertyId);
    } else {
      setBookingLinkedExperiences([]);
      setBookingLinkedRetreats([]);
    }
    setBookingAddonsDraft(parseBookingAddons(selectedBooking?.addons));
  }, [selectedBooking?.id]);

  async function updateSupplierStatus(id: number, supplierStatus: string) {
    setBookingActionLoading(true);
    try {
      await client.api.fetch(`/api/admin/bookings/${id}/supplier-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierStatus }),
      });
      await fetchBookings();
      await refreshSelectedBooking(id);
    } catch (err) { console.error(err); }
    finally { setBookingActionLoading(false); }
  }

  function startEditBooking() {
    if (!selectedBooking) return;
    setEditBookingForm({
      checkIn: new Date(selectedBooking.checkIn * 1000).toISOString().split('T')[0],
      checkOut: new Date(selectedBooking.checkOut * 1000).toISOString().split('T')[0],
      roomTypeId: selectedBooking.roomTypeId,
      guests: selectedBooking.guests,
      totalAmount: selectedBooking.totalAmount,
    });
    setEditingBooking(true);
  }

  async function saveBookingEdit(id: number) {
    if (!editBookingForm) return;
    setBookingActionLoading(true);
    try {
      await client.api.fetch(`/api/admin/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkIn: new Date(editBookingForm.checkIn).getTime() / 1000,
          checkOut: new Date(editBookingForm.checkOut).getTime() / 1000,
          roomTypeId: Number(editBookingForm.roomTypeId),
          guests: Number(editBookingForm.guests),
          totalAmount: Number(editBookingForm.totalAmount),
        }),
      });
      setEditingBooking(false);
      await fetchBookings();
      await refreshSelectedBooking(id);
    } catch (err) { console.error(err); }
    finally { setBookingActionLoading(false); }
  }

  async function generateVoucher(id: number) {
    setBookingActionLoading(true);
    try {
      await client.api.fetch(`/api/admin/bookings/${id}/voucher`, { method: 'PATCH' });
      await fetchBookings();
      await refreshSelectedBooking(id);
      setVoucherPreview(true);
    } catch (err) { console.error(err); }
    finally { setBookingActionLoading(false); }
  }

  function exportBookingsCSV() {
    const headers = ['編號', '狀態', '付款狀態', '供應商狀態', '客戶姓名', '客戶電郵', '客戶電話', '入住', '退房', '人數', '金額', '憑證', '建立時間'];
    const rows = bookings.map((b) => [
      b.id,
      b.status,
      b.paymentStatus,
      b.supplierStatus,
      b.customer?.name || '',
      b.customer?.email || '',
      b.customer?.phone || '',
      new Date(b.checkIn * 1000).toLocaleDateString('zh-HK'),
      new Date(b.checkOut * 1000).toLocaleDateString('zh-HK'),
      b.guests,
      b.totalAmount,
      b.voucherCode || '',
      new Date(b.createdAt * 1000).toLocaleString('zh-HK'),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function printBookingSummary() {
    if (!selectedBooking) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html><head><title>訂單 #${selectedBooking.id}</title>
      <style>body{font-family:sans-serif;padding:40px;max-width:700px;margin:0 auto;color:#333} h1{font-size:24px} .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee}</style>
      </head><body>
      <h1>HK Maldivers 訂單摘要</h1>
      <h2>訂單 #${selectedBooking.id}</h2>
      <div class="row"><span>狀態</span><span>${selectedBooking.status}</span></div>
      <div class="row"><span>付款狀態</span><span>${selectedBooking.paymentStatus}</span></div>
      <div class="row"><span>供應商狀態</span><span>${selectedBooking.supplierStatus}</span></div>
      <div class="row"><span>客戶</span><span>${selectedBooking.customer?.name || '—'} (${selectedBooking.customer?.email || '—'})</span></div>
      <div class="row"><span>電話</span><span>${selectedBooking.customer?.phone || '—'}</span></div>
      <div class="row"><span>入住 / 退房</span><span>${new Date(selectedBooking.checkIn * 1000).toLocaleDateString('zh-HK')} → ${new Date(selectedBooking.checkOut * 1000).toLocaleDateString('zh-HK')}</span></div>
      <div class="row"><span>人數</span><span>${selectedBooking.guests}</span></div>
      <div class="row"><span>總金額</span><span>HK$${selectedBooking.totalAmount?.toLocaleString()}</span></div>
      <div class="row"><span>憑證</span><span>${selectedBooking.voucherCode || '—'}</span></div>
      <div class="row"><span>備註</span><span>${selectedBooking.adminNotes || '—'}</span></div>
      <script>window.print()</script>
      </body></html>
    `);
    w.document.close();
  }

  async function ensureAndCopyOrderLink() {
    if (!selectedBooking) return;
    let token = selectedBooking.token;
    if (!token) {
      try {
        const res = await client.api.fetch(`/api/admin/bookings/${selectedBooking.id}/token`, { method: 'PATCH' });
        if (!res.ok) throw new Error('Failed to generate token');
        const json = await res.json();
        token = json.data?.token;
        setSelectedBooking({ ...selectedBooking, token });
      } catch (err) {
        alert('無法產生訂單連結，請稍後再試');
        return;
      }
    }
    const link = `${window.location.origin}/order/${token}`;
    try {
      await navigator.clipboard.writeText(link);
      alert(`已複製訂單連結：${link}`);
    } catch {
      alert(`訂單連結：${link}`);
    }
  }

  async function addAdmin() {
    setAccountError('');
    setAccountSuccess('');
    if (!newEmail || !newEmail.includes('@')) {
      setAccountError('請輸入有效的電郵地址');
      return;
    }
    try {
      const res = await client.api.fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAccountError(data.error || '新增失敗');
        return;
      }
      setAccountSuccess(`已成功新增管理員：${newEmail}`);
      setNewEmail('');
      setNewRole('admin');
      fetchAccounts();
    } catch (err) {
      setAccountError('新增管理員時發生錯誤');
    }
  }

  async function deleteAdmin(id: number) {
    setAccountError('');
    setAccountSuccess('');
    try {
      const res = await client.api.fetch(`/api/admin/accounts/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        setAccountError(data.error || '刪除失敗');
        setDeletingId(null);
        return;
      }
      setAccountSuccess('已成功移除管理員');
      setDeletingId(null);
      fetchAccounts();
    } catch (err) {
      setAccountError('刪除管理員時發生錯誤');
      setDeletingId(null);
    }
  }

  async function updateAdminRole(id: number, role: string) {
    setAccountError('');
    setAccountSuccess('');
    try {
      const res = await client.api.fetch(`/api/admin/accounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAccountError(data.error || '更新失敗');
        return;
      }
      setAccountSuccess('角色已更新');
      fetchAccounts();
    } catch (err) {
      setAccountError('更新角色時發生錯誤');
    }
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    completed: 'bg-blue-100 text-blue-700',
  };

  const tabs = [
    { key: 'dashboard', label: '總覽' },
    { key: 'bookings', label: '訂單管理' },
    { key: 'leads', label: '潛在客' },
    { key: 'customers', label: '客戶管理' },
    { key: 'properties', label: '住宿管理' },
    { key: 'experiences', label: '海島體驗' },
    { key: 'payments', label: '付款記錄' },
    { key: 'referral', label: '分享夥伴' },
    ...(adminRole === 'superadmin' ? [{ key: 'accounts', label: '帳戶管理' }] : []),
  ];

  // Show spinner while auth state is being restored or if not admin
  if (isChecking || !user || !isAdmin) {
    return (
      <div className="pt-20 pb-16 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#0a4c6b] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="pt-20 pb-16 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-[#0d1b2a] mb-2">後台管理</h1>
        <p className="text-sm text-gray-500 mb-6">角色：{adminRole === 'superadmin' ? '超級管理員' : '管理員'}</p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${activeTab === tab.key ? 'bg-[#0a4c6b] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-[#0a4c6b] border-t-transparent rounded-full" /></div>
        ) : activeTab === 'bookings' ? (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">訂單狀態</label>
                <select
                  value={bookingStatusFilter}
                  onChange={(e) => { setBookingStatusFilter(e.target.value); setBookingPage(1); }}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
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
                  onChange={(e) => { setBookingPaymentFilter(e.target.value); setBookingPage(1); }}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                >
                  <option value="">全部</option>
                  <option value="unpaid">未付款</option>
                  <option value="partial">部分付款</option>
                  <option value="paid">已付款</option>
                  <option value="refunded">已退款</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">搜尋</label>
                <input
                  type="text"
                  value={bookingSearch}
                  onChange={(e) => { setBookingSearch(e.target.value); setBookingPage(1); }}
                  placeholder="訂單編號 / 客戶 Email / 姓名"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none w-56"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">入住日期</label>
                <input
                  type="date"
                  value={bookingDateFrom}
                  onChange={(e) => { setBookingDateFrom(e.target.value); setBookingPage(1); }}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="date"
                  value={bookingDateTo}
                  onChange={(e) => { setBookingDateTo(e.target.value); setBookingPage(1); }}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <button
                onClick={exportBookingsCSV}
                className="ml-auto text-sm bg-[#B8902F]/10 text-[#B8902F] px-3 py-2 rounded-lg hover:bg-[#B8902F]/20 transition"
              >
                匯出 CSV
              </button>
              <div className="text-sm text-gray-500">
                共 {bookingTotal} 筆訂單
              </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">編號</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">客戶</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">入住/退房</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">人數</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">金額</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">付款</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">狀態</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">供應商</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">推薦碼</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {bookings.length === 0 ? (
                      <tr><td colSpan={10} className="px-4 py-12 text-center text-gray-500">暫無訂單</td></tr>
                    ) : (
                      bookings.map((b) => (
                        <tr key={b.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono">#{b.id}</td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-[#0d1b2a]">{b.customerName || '—'}</p>
                            <p className="text-xs text-gray-500">{b.customerEmail || ''}</p>
                            <p className="text-xs text-gray-400">{b.customerPhone || ''}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span>{new Date(b.checkIn * 1000).toLocaleDateString('zh-HK')}</span>
                            <span className="text-gray-400 mx-1">→</span>
                            <span>{new Date(b.checkOut * 1000).toLocaleDateString('zh-HK')}</span>
                          </td>
                          <td className="px-4 py-3">{b.guests}</td>
                          <td className="px-4 py-3 font-medium">HK${b.totalAmount?.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              b.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                              b.paymentStatus === 'refunded' ? 'bg-blue-100 text-blue-700' :
                              b.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {b.paymentStatus === 'paid' ? '已付款' : b.paymentStatus === 'refunded' ? '已退款' : b.paymentStatus === 'partial' ? '部分付款' : '未付款'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[b.status] || 'bg-gray-100'}`}>
                              {b.status === 'pending' ? '待處理' : b.status === 'confirmed' ? '已確認' : b.status === 'cancelled' ? '已取消' : '已完成'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              b.supplierStatus === 'confirmed' ? 'bg-green-100 text-green-700' :
                              b.supplierStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {b.supplierStatus === 'confirmed' ? '已確認' : b.supplierStatus === 'rejected' ? '已拒絕' : '待確認'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {b.referralCode ? (
                              <span className="font-mono text-[#0a4c6b] text-xs">{b.referralCode}</span>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => {
                                setSelectedBooking(b);
                                setAdminNotes(b.adminNotes || '');
                              }}
                              className="text-xs bg-[#0a4c6b] text-white px-3 py-1.5 rounded hover:bg-[#083d56] transition"
                            >
                              查看詳情
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {Math.ceil(bookingTotal / bookingLimit) > 1 && (
                <div className="px-4 py-3 border-t flex items-center justify-between">
                  <button
                    onClick={() => setBookingPage((p) => Math.max(1, p - 1))}
                    disabled={bookingPage === 1}
                    className="text-xs bg-gray-100 px-3 py-1.5 rounded disabled:opacity-50"
                  >上一頁</button>
                  <span className="text-sm text-gray-600">第 {bookingPage} / {Math.ceil(bookingTotal / bookingLimit)} 頁</span>
                  <button
                    onClick={() => setBookingPage((p) => Math.min(Math.ceil(bookingTotal / bookingLimit), p + 1))}
                    disabled={bookingPage === Math.ceil(bookingTotal / bookingLimit)}
                    className="text-xs bg-gray-100 px-3 py-1.5 rounded disabled:opacity-50"
                  >下一頁</button>
                </div>
              )}
            </div>

            {/* Booking Detail Modal */}
            {selectedBooking && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[#0d1b2a]">訂單 #{selectedBooking.id}</h3>
                    <button
                      onClick={() => setSelectedBooking(null)}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                      aria-label="關閉"
                    >
                      ×
                    </button>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Status overview */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-xl p-4 text-center">
                        <p className="text-xs text-gray-500 mb-1">訂單狀態</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[selectedBooking.status] || 'bg-gray-100'}`}>
                          {selectedBooking.status === 'pending' ? '待處理' : selectedBooking.status === 'confirmed' ? '已確認' : selectedBooking.status === 'cancelled' ? '已取消' : '已完成'}
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 text-center">
                        <p className="text-xs text-gray-500 mb-1">付款狀態</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          selectedBooking.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                          selectedBooking.paymentStatus === 'refunded' ? 'bg-blue-100 text-blue-700' :
                          selectedBooking.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {selectedBooking.paymentStatus === 'paid' ? '已付款' : selectedBooking.paymentStatus === 'refunded' ? '已退款' : selectedBooking.paymentStatus === 'partial' ? '部分付款' : '未付款'}
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 text-center">
                        <p className="text-xs text-gray-500 mb-1">供應商狀態</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          selectedBooking.supplierStatus === 'confirmed' ? 'bg-green-100 text-green-700' :
                          selectedBooking.supplierStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {selectedBooking.supplierStatus === 'confirmed' ? '已確認' : selectedBooking.supplierStatus === 'rejected' ? '已拒絕' : '待確認'}
                        </span>
                      </div>
                    </div>

                    {/* Management actions */}
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={startEditBooking}
                        disabled={bookingActionLoading}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition disabled:opacity-60"
                      >編輯訂單</button>
                      <button
                        onClick={() => generateVoucher(selectedBooking.id)}
                        disabled={bookingActionLoading || !!selectedBooking.voucherCode}
                        className="text-xs bg-[#B8902F]/10 hover:bg-[#B8902F]/20 text-[#B8902F] px-3 py-2 rounded-lg transition disabled:opacity-60"
                      >{selectedBooking.voucherCode ? '已產生憑證' : '產生電子憑證'}</button>
                      {selectedBooking.voucherCode && (
                        <button
                          onClick={() => setVoucherPreview(true)}
                          className="text-xs bg-[#0a4c6b]/10 hover:bg-[#0a4c6b]/20 text-[#0a4c6b] px-3 py-2 rounded-lg transition"
                        >預覽憑證</button>
                      )}
                      <button
                        onClick={printBookingSummary}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition"
                      >列印摘要</button>
                      <button
                        onClick={ensureAndCopyOrderLink}
                        className="text-xs bg-[#0a4c6b]/10 hover:bg-[#0a4c6b]/20 text-[#0a4c6b] px-3 py-2 rounded-lg transition"
                      >複製訂單連結</button>
                      <div className="flex items-center gap-2 ml-auto">
                        <span className="text-sm text-gray-600">供應商狀態</span>
                        <select
                          value={selectedBooking.supplierStatus || 'pending'}
                          onChange={(e) => updateSupplierStatus(selectedBooking.id, e.target.value)}
                          disabled={bookingActionLoading}
                          className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm disabled:opacity-60"
                        >
                          <option value="pending">待確認</option>
                          <option value="confirmed">已確認</option>
                          <option value="rejected">已拒絕</option>
                        </select>
                      </div>
                    </div>

                    {/* Customer info */}
                    {selectedBooking.customer && (
                      <div className="bg-[#f0f9f7] rounded-xl p-4 space-y-2">
                        <h4 className="font-semibold text-[#0a4c6b]">客戶資料</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">姓名</p>
                            <p className="font-medium">{selectedBooking.customer.name || '—'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">電郵</p>
                            <p className="font-medium">{selectedBooking.customer.email || '—'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">電話</p>
                            <p className="font-medium">{selectedBooking.customer.phone || '—'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Referral source */}
                    {selectedBooking.referralCode && (
                      <div className="bg-[#fff8e6] rounded-xl p-4 space-y-2">
                        <h4 className="font-semibold text-[#B8902F]">轉介來源</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">推薦碼</p>
                            <p className="font-mono font-medium text-[#0a4c6b]">{selectedBooking.referralCode}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Customer & trip info */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-[#0d1b2a]">行程資訊</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">入住日期</p>
                          <p className="font-medium">{new Date(selectedBooking.checkIn * 1000).toLocaleDateString('zh-HK')}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">退房日期</p>
                          <p className="font-medium">{new Date(selectedBooking.checkOut * 1000).toLocaleDateString('zh-HK')}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">人數</p>
                          <p className="font-medium">{selectedBooking.guests} 人</p>
                        </div>
                        <div>
                          <p className="text-gray-500">總金額</p>
                          <p className="font-medium">HK${selectedBooking.totalAmount?.toLocaleString()}</p>
                        </div>
                        {selectedBooking.paymentDeadline && (
                          <div>
                            <p className="text-gray-500">付款截止</p>
                            <p className="font-medium">{new Date(selectedBooking.paymentDeadline * 1000).toLocaleString('zh-HK')}</p>
                          </div>
                        )}
                        {selectedBooking.paidAt && (
                          <div>
                            <p className="text-gray-500">付款時間</p>
                            <p className="font-medium">{new Date(selectedBooking.paidAt * 1000).toLocaleString('zh-HK')}</p>
                          </div>
                        )}
                        {selectedBooking.paymentMethod && (
                          <div>
                            <p className="text-gray-500">付款方式</p>
                            <p className="font-medium">
                              {selectedBooking.paymentMethod === 'payme' ? 'PayMe' :
                               selectedBooking.paymentMethod === 'fps' ? 'FPS 轉數快' :
                               selectedBooking.paymentMethod === 'bank_transfer' ? '銀行轉帳' : selectedBooking.paymentMethod}
                            </p>
                          </div>
                        )}
                        {selectedBooking.paymentReference && (
                          <div>
                            <p className="text-gray-500">參考編號</p>
                            <p className="font-medium">{selectedBooking.paymentReference}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Addons */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-[#0d1b2a]">加購體驗 / 靜修</h4>
                        {bookingAddonsDraft.length > 0 && (
                          <span className="text-xs text-gray-500">{bookingAddonsDraft.length} 項已選</span>
                        )}
                      </div>

                      {bookingLinkedExperiences.length === 0 && bookingLinkedRetreats.length === 0 && !(() => {
                        try { return JSON.parse(selectedBooking.addons || '[]').length; }
                        catch { return 0; }
                      })() && (
                        <p className="text-sm text-gray-400">該住宿尚未設定可加購項目</p>
                      )}

                      {bookingLinkedExperiences.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-medium text-gray-600 mb-2">單日體驗</p>
                          <div className="grid grid-cols-1 gap-2">
                            {bookingLinkedExperiences.map((e) => {
                              const checked = bookingAddonsDraft.some((a) => a.type === 'experience' && a.id === e.id);
                              return (
                                <label
                                  key={`exp-${e.id}`}
                                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                                    checked ? 'border-[#0a4c6b] bg-[#0a4c6b]/5' : 'border-gray-200 hover:border-[#2ec4b6]'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleBookingAddon(e, 'experience')}
                                    className="mt-1"
                                  />
                                  <div className="flex-1">
                                    <p className="font-medium text-sm text-[#0d1b2a]">{e.nameZh}</p>
                                    <p className="text-xs text-gray-500">{e.name} · {e.duration}</p>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {bookingLinkedRetreats.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-medium text-gray-600 mb-2">主題靜修</p>
                          <div className="grid grid-cols-1 gap-2">
                            {bookingLinkedRetreats.map((r) => {
                              const checked = bookingAddonsDraft.some((a) => a.type === 'retreat' && a.id === r.id);
                              return (
                                <label
                                  key={`ret-${r.id}`}
                                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                                    checked ? 'border-[#0a4c6b] bg-[#0a4c6b]/5' : 'border-gray-200 hover:border-[#2ec4b6]'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleBookingAddon(r, 'retreat')}
                                    className="mt-1"
                                  />
                                  <div className="flex-1">
                                    <p className="font-medium text-sm text-[#0d1b2a]">{r.nameZh}</p>
                                    <p className="text-xs text-gray-500">{r.name} · {r.duration}</p>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {(() => {
                        const legacyAddons = (() => {
                          try { return JSON.parse(selectedBooking.addons || '[]').filter((a: any) => !a.type || !a.id); }
                          catch { return []; }
                        })();
                        if (!legacyAddons.length) return null;
                        return (
                          <div className="mb-4">
                            <p className="text-xs font-medium text-gray-600 mb-2">舊版加購紀錄（唯讀）</p>
                            <div className="space-y-2">
                              {legacyAddons.map((a: any, i: number) => (
                                <div key={i} className="bg-gray-100 rounded-lg px-3 py-2 text-sm">
                                  <p className="font-medium text-[#0a4c6b]">{a.name}</p>
                                  {a.description && <p className="text-gray-600 text-xs mt-0.5">{a.description}</p>}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {(bookingLinkedExperiences.length > 0 || bookingLinkedRetreats.length > 0) && (
                        <button
                          onClick={() => saveBookingAddons(selectedBooking.id)}
                          disabled={bookingActionLoading}
                          className="text-xs bg-[#0a4c6b] text-white px-3 py-1.5 rounded hover:bg-[#083d56] transition disabled:opacity-60"
                        >
                          {bookingActionLoading ? '儲存中…' : '儲存加購項目'}
                        </button>
                      )}
                    </div>

                    {/* Admin notes */}
                    <div>
                      <h4 className="font-semibold text-[#0d1b2a] mb-2">內部備註</h4>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        rows={3}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                        placeholder="記錄與客戶或供應商的溝通內容..."
                      />
                      <button
                        onClick={() => saveBookingNotes(selectedBooking.id)}
                        disabled={bookingActionLoading}
                        className="mt-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded transition disabled:opacity-60"
                      >
                        儲存備註
                      </button>
                    </div>

                    {/* Actions */}
                    {selectedBooking.status !== 'cancelled' && (
                      <div className="border-t pt-6 space-y-6">
                        {selectedBooking.status === 'pending' && (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => confirmBooking(selectedBooking.id)}
                              disabled={bookingActionLoading}
                              className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-60"
                            >
                              確認訂單
                            </button>
                            <p className="text-xs text-gray-500">確認後訂單狀態與供應商狀態會變為「已確認」</p>
                          </div>
                        )}

                        {selectedBooking.paymentStatus !== 'paid' && selectedBooking.paymentStatus !== 'refunded' && (
                          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                            <h4 className="font-semibold text-[#0d1b2a]">標記付款</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                              >
                                <option value="payme">PayMe</option>
                                <option value="fps">FPS 轉數快</option>
                                <option value="bank_transfer">銀行轉帳</option>
                                <option value="manual">人工記錄</option>
                              </select>
                              <input
                                type="text"
                                value={paymentReference}
                                onChange={(e) => setPaymentReference(e.target.value)}
                                placeholder="參考編號（選填）"
                                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                              />
                            </div>
                            <button
                              onClick={() => markBookingPaid(selectedBooking.id)}
                              disabled={bookingActionLoading}
                              className="bg-[#0a4c6b] hover:bg-[#083d56] text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-60"
                            >
                              標記為已付款
                            </button>
                          </div>
                        )}

                        <div className="bg-red-50 rounded-xl p-4 space-y-3">
                          <h4 className="font-semibold text-red-700">取消訂單</h4>
                          <p className="text-xs text-red-600">
                            系統將根據住宿的退改政策自動計算應退金額。
                          </p>
                          <input
                            type="text"
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="取消原因"
                            className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm"
                          />
                          <button
                            onClick={() => cancelBooking(selectedBooking.id)}
                            disabled={bookingActionLoading}
                            className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-60"
                          >
                            取消訂單並計算退款
                          </button>
                        </div>
                      </div>
                    )}

                    {selectedBooking.status === 'cancelled' && (
                      <div className="bg-red-50 rounded-xl p-4">
                        <h4 className="font-semibold text-red-700 mb-2">取消資訊</h4>
                        <p className="text-sm"><span className="text-gray-600">取消原因：</span>{selectedBooking.cancellationReason || '—'}</p>
                        <p className="text-sm mt-1"><span className="text-gray-600">應退金額：</span>HK${selectedBooking.refundAmount?.toLocaleString()}</p>
                        {selectedBooking.cancelledAt && (
                          <p className="text-sm mt-1"><span className="text-gray-600">取消時間：</span>{new Date(selectedBooking.cancelledAt * 1000).toLocaleString('zh-HK')}</p>
                        )}
                      </div>
                    )}

                    {/* Edit booking modal (inline) */}
                    {editingBooking && editBookingForm && (
                      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
                        <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-[#0d1b2a]">編輯訂單 #{selectedBooking.id}</h4>
                            <button onClick={() => setEditingBooking(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">入住日期</label>
                              <input
                                type="date"
                                value={editBookingForm.checkIn}
                                onChange={(e) => setEditBookingForm({ ...editBookingForm, checkIn: e.target.value })}
                                className="w-full border rounded-lg px-3 py-2 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">退房日期</label>
                              <input
                                type="date"
                                value={editBookingForm.checkOut}
                                onChange={(e) => setEditBookingForm({ ...editBookingForm, checkOut: e.target.value })}
                                className="w-full border rounded-lg px-3 py-2 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">房型 ID</label>
                              <select
                                value={editBookingForm.roomTypeId}
                                onChange={(e) => setEditBookingForm({ ...editBookingForm, roomTypeId: Number(e.target.value) })}
                                className="w-full border rounded-lg px-3 py-2 text-sm"
                              >
                                {selectedBooking.property?.roomTypes?.map((rt: any) => (
                                  <option key={rt.id} value={rt.id}>{rt.nameZh} (#{rt.id})</option>
                                )) || <option value={editBookingForm.roomTypeId}>房型 #{editBookingForm.roomTypeId}</option>}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">人數</label>
                              <input
                                type="number"
                                value={editBookingForm.guests}
                                onChange={(e) => setEditBookingForm({ ...editBookingForm, guests: Number(e.target.value) })}
                                className="w-full border rounded-lg px-3 py-2 text-sm"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-xs text-gray-500 mb-1">總金額（HKD）</label>
                              <input
                                type="number"
                                value={editBookingForm.totalAmount}
                                onChange={(e) => setEditBookingForm({ ...editBookingForm, totalAmount: Number(e.target.value) })}
                                className="w-full border rounded-lg px-3 py-2 text-sm"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-3">
                            <button onClick={() => setEditingBooking(false)} className="text-sm text-gray-500 px-3 py-2">取消</button>
                            <button
                              onClick={() => saveBookingEdit(selectedBooking.id)}
                              disabled={bookingActionLoading}
                              className="bg-[#0a4c6b] text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
                            >儲存變更</button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Voucher preview modal */}
                    {voucherPreview && selectedBooking.voucherCode && (
                      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
                        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center space-y-4">
                          <h4 className="font-bold text-[#0d1b2a]">電子憑證預覽</h4>
                          <div className="bg-gradient-to-r from-[#0a4c6b] to-[#2ec4b6] rounded-2xl p-6 text-white">
                            <p className="text-white/70 text-sm">HK Maldivers Voucher</p>
                            <p className="text-3xl font-mono font-bold mt-2">{selectedBooking.voucherCode}</p>
                            <p className="text-white/90 text-sm mt-4">
                              {new Date(selectedBooking.checkIn * 1000).toLocaleDateString('zh-HK')} - {new Date(selectedBooking.checkOut * 1000).toLocaleDateString('zh-HK')}
                            </p>
                            <p className="text-white/90 text-sm">{selectedBooking.customer?.name || 'Guest'}</p>
                            <p className="text-2xl font-bold mt-3">HK${selectedBooking.totalAmount?.toLocaleString()}</p>
                            <p className="text-white/70 text-xs mt-1">預訂 #{selectedBooking.id}</p>
                          </div>
                          <button
                            onClick={() => setVoucherPreview(false)}
                            className="text-sm text-gray-500 px-4 py-2"
                          >關閉</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'dashboard' ? (
          <DashboardSection />
        ) : activeTab === 'customers' ? (
          <CustomersSection />
        ) : activeTab === 'leads' ? (
          <LeadsSection />
        ) : activeTab === 'payments' ? (
          <PaymentsSection />
        ) : activeTab === 'referral' ? (
          <ReferralSection />
        ) : activeTab === 'accounts' ? (
          <div className="space-y-6">
            {/* Add new admin form */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-lg text-[#0d1b2a] mb-4">新增管理員</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="輸入管理員電郵地址"
                  className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                />
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'admin' | 'superadmin')}
                  className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                >
                  <option value="admin">管理員</option>
                  <option value="superadmin">超級管理員</option>
                </select>
                <button
                  onClick={addAdmin}
                  className="bg-[#0a4c6b] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#083d56] transition whitespace-nowrap"
                >
                  新增
                </button>
              </div>
              {accountError && (
                <p className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{accountError}</p>
              )}
              {accountSuccess && (
                <p className="mt-3 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">{accountSuccess}</p>
              )}
            </div>

            {/* Admin accounts list */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h3 className="font-bold text-[#0d1b2a]">管理員帳戶列表</h3>
                <p className="text-xs text-gray-500 mt-1">共 {accounts.length} 個管理員帳戶</p>
              </div>
              <div className="divide-y">
                {accounts.length === 0 ? (
                  <div className="px-6 py-12 text-center text-gray-500">暫無管理員帳戶</div>
                ) : (
                  accounts.map((account) => (
                    <div key={account.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#0a4c6b]/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-[#0a4c6b]">
                              {account.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#0d1b2a] truncate">{account.email}</p>
                            <p className="text-xs text-gray-500">
                              新增於 {new Date(account.createdAt * 1000).toLocaleDateString('zh-HK')}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <select
                          value={account.role}
                          onChange={(e) => updateAdminRole(account.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                        >
                          <option value="admin">管理員</option>
                          <option value="superadmin">超級管理員</option>
                        </select>
                        {deletingId === account.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => deleteAdmin(account.id)}
                              className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition"
                            >
                              確認刪除
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="text-xs text-gray-500 hover:text-gray-700"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeletingId(account.id)}
                            className="text-xs text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
                          >
                            移除
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : activeTab === 'experiences' ? (
          <div className="space-y-12">
            <ExperiencesSection />
            <RetreatsSection />
          </div>
        ) : (
          <PropertiesSection />
        )}
      </div>
    </div>
  );
}
