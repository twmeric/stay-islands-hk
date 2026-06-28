import { useEffect, useState } from 'react';
import { client } from '../../api/client';

interface Lead {
  id: number;
  name: string | null;
  email: string;
  phone: string | null;
  leadType: string;
  source: string | null;
  status: string;
  assignedAdminId: number | null;
  notes: string | null;
  referralCode: string | null;
  createdAt: number;
}

const statusOptions = ['new', 'contacted', 'qualified', 'converted', 'archived'];
const typeOptions = ['experience_inquiry', 'island_owner_talk', 'inspiration_guide'];

const statusLabelMap: Record<string, string> = {
  new: '新線索',
  contacted: '已聯繫',
  qualified: '已篩選',
  converted: '已轉化',
  archived: '已封存',
};

const typeLabelMap: Record<string, string> = {
  experience_inquiry: '體驗諮詢',
  island_owner_talk: '海島假期諮詢',
  inspiration_guide: '靈感指南',
};

const sourceLabelMap: Record<string, string> = {
  plan_page: '諮詢頁',
  invest_page: '諮詢頁',
  homepage: '首頁',
  experiences_page: '體驗頁',
  properties_page: '住宿頁',
  retreats_page: '靜修頁',
};

export default function LeadsSection() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [notesId, setNotesId] = useState<number | null>(null);
  const [notesText, setNotesText] = useState('');
  const limit = 20;

  useEffect(() => {
    fetchLeads();
  }, [statusFilter, typeFilter, page]);

  async function fetchLeads() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', String(limit));
      params.append('offset', String((page - 1) * limit));
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('lead_type', typeFilter);
      const res = await client.api.fetch(`/api/admin/leads?${params.toString()}`);
      const json = await res.json();
      setLeads(json.data || []);
      setTotal(json.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: number, status: string) {
    try {
      await client.api.fetch(`/api/admin/leads/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchLeads();
    } catch (err) {
      console.error(err);
    }
  }

  async function saveNotes(id: number) {
    try {
      await client.api.fetch(`/api/admin/leads/${id}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notesText }),
      });
      setNotesId(null);
      fetchLeads();
    } catch (err) {
      console.error(err);
    }
  }

  async function convertLead(id: number) {
    if (!confirm('確定將此潛在客轉為正式客戶？')) return;
    try {
      const res = await client.api.fetch(`/api/admin/leads/${id}/convert`, { method: 'POST' });
      if (!res.ok) throw new Error('Convert failed');
      fetchLeads();
    } catch (err) {
      console.error(err);
      alert('轉換失敗，請稍後再試');
    }
  }

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-wrap items-center gap-4">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="">全部狀態</option>
          {statusOptions.map((s) => <option key={s} value={s}>{statusLabelMap[s] || s}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="">全部類型</option>
          {typeOptions.map((t) => <option key={t} value={t}>{typeLabelMap[t] || t}</option>)}
        </select>
        <span className="text-sm text-gray-500">共 {total} 筆</span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">姓名/Email</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">電話</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">類型</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">來源</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">推薦碼</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">狀態</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">備註</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">建立時間</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-500">載入中…</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-500">暫無潛在客</td></tr>
              ) : (
                leads.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#0d1b2a]">{l.name || '—'}</p>
                      <p className="text-xs text-gray-500">{l.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{l.phone || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{typeLabelMap[l.leadType] || l.leadType}</td>
                    <td className="px-4 py-3 text-gray-600">{(l.source && sourceLabelMap[l.source]) || l.source || '—'}</td>
                    <td className="px-4 py-3">
                      {l.referralCode ? (
                        <span className="font-mono text-xs text-[#0a4c6b]">{l.referralCode}</span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={l.status}
                        onChange={(e) => updateStatus(l.id, e.target.value)}
                        className="border border-gray-200 rounded-lg px-2 py-1 text-xs"
                      >
                        {statusOptions.map((s) => <option key={s} value={s}>{statusLabelMap[s] || s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {notesId === l.id ? (
                        <div className="flex gap-2">
                          <textarea
                            value={notesText}
                            onChange={(e) => setNotesText(e.target.value)}
                            rows={2}
                            className="border rounded-lg px-2 py-1 text-xs flex-1"
                          />
                          <div className="flex flex-col gap-1">
                            <button onClick={() => saveNotes(l.id)} className="text-xs bg-[#0a4c6b] text-white px-2 py-1 rounded">儲存</button>
                            <button onClick={() => setNotesId(null)} className="text-xs text-gray-500">取消</button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setNotesId(l.id); setNotesText(l.notes || ''); }}
                          className="text-left text-xs text-gray-600 hover:text-[#0a4c6b] line-clamp-2"
                        >
                          {l.notes || <span className="text-gray-400">點擊新增備註</span>}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(l.createdAt * 1000).toLocaleDateString('zh-HK')}</td>
                    <td className="px-4 py-3">
                      {l.status === 'converted' ? (
                        <span className="text-xs text-green-600 font-medium">已轉為客戶</span>
                      ) : (
                        <button
                          onClick={() => convertLead(l.id)}
                          className="text-xs bg-[#0a4c6b] text-white px-2 py-1 rounded hover:bg-[#083d56] transition"
                        >
                          轉為客戶
                        </button>
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
