import { useState, useEffect } from 'react';
import { client } from '../api/client';
import { useAuthStore } from '../store/authStore';
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
  activities: string | null;
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

interface ActivityItem {
  image: string;
  name: string;
  description: string;
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
  activities: ActivityItem[];
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
    activities: [],
    locationDetails: { description: '', mapImage: '', nearby: [] },
    story: { title: '', content: '' },
  });

  const [propertyForm, setPropertyForm] = useState<PropertyFormState>(emptyPropertyForm());

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

      const p: Property & { roomTypes?: RoomType[] } = propertyData.data;
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
        activities: safeJsonParse<ActivityItem[]>(p.activities, []),
        locationDetails: safeJsonParse<LocationDetailsShape>(p.locationDetails, {
          description: '',
          mapImage: '',
          nearby: [],
        }),
        story: safeJsonParse<StoryShape>(p.story, { title: '', content: '' }),
      });
      setRoomTypes(roomTypesData.data || p.roomTypes || []);
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
    } else if (typeof selectedPropertyId === 'number') {
      loadPropertyDetail(selectedPropertyId);
      setEditingRoomTypeId(null);
      setRoomTypeForm(emptyRoomTypeForm());
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
        activities: propertyForm.activities.filter((a) => a.name.trim()),
        locationDetails: propertyForm.locationDetails,
        story: propertyForm.story,
      };

      if (!body.name || !body.nameZh) {
        throw new Error('請填寫英文名稱與中文名稱');
      }

      let res: Response;
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

  function addActivity() {
    setPropertyForm({
      ...propertyForm,
      activities: [...propertyForm.activities, { image: '', name: '', description: '' }],
    });
  }

  function updateActivity(index: number, field: 'image' | 'name' | 'description', value: string) {
    const next = propertyForm.activities.map((a, i) => (i === index ? { ...a, [field]: value } : a));
    setPropertyForm({ ...propertyForm, activities: next });
  }

  function removeActivity(index: number) {
    setPropertyForm({ ...propertyForm, activities: propertyForm.activities.filter((_, i) => i !== index) });
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

          {/* Activities */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-[#0d1b2a]">活動（Activities）</label>
              <button
                onClick={addActivity}
                className="text-xs bg-[#B8902F]/10 text-[#B8902F] px-3 py-1 rounded-lg hover:bg-[#B8902F]/20 transition"
              >
                + 新增活動
              </button>
            </div>
            <div className="space-y-3">
              {propertyForm.activities.length === 0 && (
                <p className="text-sm text-gray-400">尚未設定活動</p>
              )}
              {propertyForm.activities.map((a, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-start border rounded-lg p-3 bg-gray-50">
                  <div className="col-span-12 md:col-span-4">
                    <input
                      type="text"
                      value={a.image}
                      onChange={(e) => updateActivity(idx, 'image', e.target.value)}
                      placeholder="圖片 URL"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                    />
                  </div>
                  <div className="col-span-12 md:col-span-3">
                    <input
                      type="text"
                      value={a.name}
                      onChange={(e) => updateActivity(idx, 'name', e.target.value)}
                      placeholder="活動名稱"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                    />
                  </div>
                  <div className="col-span-12 md:col-span-4">
                    <input
                      type="text"
                      value={a.description}
                      onChange={(e) => updateActivity(idx, 'description', e.target.value)}
                      placeholder="活動描述"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none"
                    />
                  </div>
                  <div className="col-span-12 md:col-span-1 flex md:justify-end">
                    <button
                      onClick={() => removeActivity(idx)}
                      className="text-xs text-red-500 hover:text-red-700 px-2 py-2"
                    >
                      刪除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Location details */}
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
// Main Admin Page
// ============================================================================

export default function AdminPage() {
  const { adminRole } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'bookings' | 'inquiries' | 'properties' | 'experiences' | 'retreats' | 'accounts'>('bookings');
  const [bookings, setBookings] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [replyId, setReplyId] = useState<number | null>(null);

  // Account management state
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'superadmin'>('admin');
  const [accountError, setAccountError] = useState('');
  const [accountSuccess, setAccountSuccess] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (activeTab === 'bookings') fetchBookings();
    else if (activeTab === 'inquiries') fetchInquiries();
    else if (activeTab === 'accounts') fetchAccounts();
  }, [activeTab]);

  async function fetchBookings() {
    setLoading(true);
    try {
      const res = await client.api.fetch('/api/admin/bookings');
      const data = await res.json();
      setBookings(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function fetchInquiries() {
    setLoading(true);
    try {
      const res = await client.api.fetch('/api/admin/inquiries');
      const data = await res.json();
      setInquiries(data.data || []);
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

  async function updateBookingStatus(id: number, status: string, paymentStatus: string) {
    try {
      await client.api.fetch(`/api/admin/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, paymentStatus }),
      });
      fetchBookings();
    } catch (err) { console.error(err); }
  }

  async function replyInquiry(id: number) {
    if (!replyText) return;
    try {
      await client.api.fetch(`/api/admin/inquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminReply: replyText, status: 'replied' }),
      });
      setReplyText('');
      setReplyId(null);
      fetchInquiries();
    } catch (err) { console.error(err); }
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
    { key: 'bookings', label: '訂單管理' },
    { key: 'inquiries', label: '旅客諮詢' },
    { key: 'properties', label: '住宿管理' },
    { key: 'experiences', label: '海島體驗' },
    { key: 'retreats', label: '主題靜修' },
    ...(adminRole === 'superadmin' ? [{ key: 'accounts', label: '帳戶管理' }] : []),
  ];

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
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">編號</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">入住/退房</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">人數</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">金額</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">狀態</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {bookings.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">暫無訂單</td></tr>
                  ) : (
                    bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono">#{b.id}</td>
                        <td className="px-4 py-3">
                          <span>{new Date(b.checkIn * 1000).toLocaleDateString('zh-HK')}</span>
                          <span className="text-gray-400 mx-1">→</span>
                          <span>{new Date(b.checkOut * 1000).toLocaleDateString('zh-HK')}</span>
                        </td>
                        <td className="px-4 py-3">{b.guests}</td>
                        <td className="px-4 py-3 font-medium">HK${b.totalPrice?.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[b.status] || 'bg-gray-100'}`}>
                            {b.status === 'pending' ? '待處理' : b.status === 'confirmed' ? '已確認' : b.status === 'cancelled' ? '已取消' : '已完成'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {b.status === 'pending' && (
                            <div className="flex gap-2">
                              <button onClick={() => updateBookingStatus(b.id, 'confirmed', 'paid')} className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">確認</button>
                              <button onClick={() => updateBookingStatus(b.id, 'cancelled', 'refunded')} className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">拒絕</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'inquiries' ? (
          <div className="space-y-4">
            {inquiries.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center text-gray-500">暫無諮詢訊息</div>
            ) : (
              inquiries.map((inq) => (
                <div key={inq.id} className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-[#0d1b2a]">{inq.subject}</h3>
                      <p className="text-sm text-gray-500">{inq.name} · {inq.email} {inq.phone && `· ${inq.phone}`}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${inq.status === 'new' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {inq.status === 'new' ? '新訊息' : '已回覆'}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm mb-3">{inq.message}</p>
                  {inq.adminReply && (
                    <div className="bg-[#f0f9f7] rounded-lg p-3 mt-3">
                      <p className="text-xs text-gray-500 mb-1">管理員回覆：</p>
                      <p className="text-sm text-gray-700">{inq.adminReply}</p>
                    </div>
                  )}
                  {inq.status === 'new' && (
                    <div className="mt-3">
                      {replyId === inq.id ? (
                        <div className="space-y-2">
                          <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="輸入回覆..." />
                          <div className="flex gap-2">
                            <button onClick={() => replyInquiry(inq.id)} className="text-xs bg-[#0a4c6b] text-white px-3 py-1.5 rounded-lg hover:bg-[#083d56]">發送回覆</button>
                            <button onClick={() => { setReplyId(null); setReplyText(''); }} className="text-xs text-gray-500 hover:text-gray-700">取消</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setReplyId(inq.id)} className="text-xs text-[#0a4c6b] hover:underline">回覆</button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
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
          <ExperiencesSection />
        ) : activeTab === 'retreats' ? (
          <RetreatsSection />
        ) : (
          <PropertiesSection />
        )}
      </div>
    </div>
  );
}
