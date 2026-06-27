import { useEffect, useState } from 'react';
import { client } from '../../api/client';

interface Customer {
  id: number;
  name: string | null;
  email: string;
  phone: string | null;
  whatsappConsent: number;
  membershipTierId: number | null;
  tags: string | null;
  notes: string | null;
  assignedAdminId: number | null;
  createdAt: number;
  updatedAt: number;
}

export default function CustomersSection() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editTags, setEditTags] = useState('');
  const limit = 20;

  useEffect(() => {
    fetchCustomers();
  }, [search, page]);

  async function fetchCustomers() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', String(limit));
      params.append('offset', String((page - 1) * limit));
      if (search.trim()) params.append('search', search.trim());
      const res = await client.api.fetch(`/api/admin/customers?${params.toString()}`);
      const json = await res.json();
      setCustomers(json.data || []);
      setTotal(json.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function saveCustomer(id: number) {
    try {
      const res = await client.api.fetch(`/api/admin/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: editNotes, tags: editTags.split(',').map((t) => t.trim()).filter(Boolean) }),
      });
      if (!res.ok) throw new Error('update failed');
      setEditingId(null);
      fetchCustomers();
    } catch (err) {
      console.error(err);
    }
  }

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-wrap items-center gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="搜尋姓名、電郵、電話"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0a4c6b]/20 focus:border-[#0a4c6b] outline-none flex-1 min-w-[200px]"
        />
        <span className="text-sm text-gray-500">共 {total} 位客戶</span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">姓名</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">電郵</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">電話</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">標籤 / 備註</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">新增時間</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">載入中…</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">暫無客戶</td></tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-[#0d1b2a]">{c.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{c.email}</td>
                    <td className="px-4 py-3 text-gray-600">{c.phone || '—'}</td>
                    <td className="px-4 py-3">
                      {editingId === c.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editTags}
                            onChange={(e) => setEditTags(e.target.value)}
                            placeholder="標籤以逗號分隔"
                            className="w-full border rounded-lg px-2 py-1 text-xs"
                          />
                          <textarea
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="備註"
                            rows={2}
                            className="w-full border rounded-lg px-2 py-1 text-xs"
                          />
                        </div>
                      ) : (
                        <div>
                          {c.tags && (
                            <div className="flex flex-wrap gap-1 mb-1">
                              {(JSON.parse(c.tags) as string[]).map((t, i) => (
                                <span key={i} className="text-xs bg-[#f0f9f7] text-[#0a4c6b] px-2 py-0.5 rounded-full">{t}</span>
                              ))}
                            </div>
                          )}
                          {c.notes && <p className="text-xs text-gray-500 line-clamp-2">{c.notes}</p>}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(c.createdAt * 1000).toLocaleDateString('zh-HK')}</td>
                    <td className="px-4 py-3">
                      {editingId === c.id ? (
                        <div className="flex gap-2">
                          <button onClick={() => saveCustomer(c.id)} className="text-xs bg-[#0a4c6b] text-white px-2 py-1 rounded">儲存</button>
                          <button onClick={() => setEditingId(null)} className="text-xs text-gray-500">取消</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingId(c.id); setEditTags(c.tags ? (JSON.parse(c.tags) as string[]).join(', ') : ''); setEditNotes(c.notes || ''); }}
                          className="text-xs text-[#0a4c6b] hover:underline"
                        >編輯</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="text-xs bg-gray-100 px-3 py-1.5 rounded disabled:opacity-50">上一頁</button>
            <span className="text-sm text-gray-600">第 {page} / {totalPages} 頁</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="text-xs bg-gray-100 px-3 py-1.5 rounded disabled:opacity-50">下一頁</button>
          </div>
        )}
      </div>
    </div>
  );
}
