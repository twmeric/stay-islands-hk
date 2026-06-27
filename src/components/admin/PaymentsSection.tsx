import { useEffect, useState } from 'react';
import { client } from '../../api/client';

interface Payment {
  id: number;
  bookingId: number;
  gateway: string;
  gatewayTransactionId: string | null;
  amount: number;
  currency: string;
  status: string;
  createdAt: number;
}

const statusOptions = ['pending', 'succeeded', 'failed', 'refunded'];
const gatewayOptions = ['stripe', 'paypal', 'payme', 'fps', 'alipayhk', 'wechatpay', 'manual'];

export default function PaymentsSection() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [gatewayFilter, setGatewayFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, gatewayFilter, page]);

  async function fetchPayments() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', String(limit));
      params.append('offset', String((page - 1) * limit));
      if (statusFilter) params.append('status', statusFilter);
      if (gatewayFilter) params.append('gateway', gatewayFilter);
      const res = await client.api.fetch(`/api/admin/payments?${params.toString()}`);
      const json = await res.json();
      setPayments(json.data || []);
      setTotal(json.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: number, status: string) {
    try {
      await client.api.fetch(`/api/admin/payments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchPayments();
    } catch (err) {
      console.error(err);
    }
  }

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-wrap items-center gap-4">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="">全部狀態</option>
          {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={gatewayFilter} onChange={(e) => { setGatewayFilter(e.target.value); setPage(1); }} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="">全部通道</option>
          {gatewayOptions.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <span className="text-sm text-gray-500">共 {total} 筆</span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">編號</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">訂單 #</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">通道</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">交易編號</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">金額</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">狀態</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">時間</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">載入中…</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">暫無付款記錄</td></tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono">#{p.id}</td>
                    <td className="px-4 py-3 text-gray-600">#{p.bookingId}</td>
                    <td className="px-4 py-3 text-gray-600 uppercase">{p.gateway}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{p.gatewayTransactionId || '—'}</td>
                    <td className="px-4 py-3 font-medium">{p.currency} {p.amount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <select
                        value={p.status}
                        onChange={(e) => updateStatus(p.id, e.target.value)}
                        className="border border-gray-200 rounded-lg px-2 py-1 text-xs"
                      >
                        {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(p.createdAt * 1000).toLocaleString('zh-HK')}</td>
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
