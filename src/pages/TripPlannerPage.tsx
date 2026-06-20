import { useState, useEffect } from 'react';
import { client } from '../api/client';

interface TripPlan {
  id: number;
  name: string;
  destination: string | null;
  startDate: number | null;
  endDate: number | null;
  items: string | null;
  notes: string | null;
  status: string;
  createdAt: number;
}

const defaultItems = [
  { id: 1, text: '預訂機票 (香港直飛馬累)', done: false },
  { id: 2, text: '準備護照及旅遊保險', done: false },
  { id: 3, text: '預訂水上飛機/快艇接駁', done: false },
  { id: 4, text: '選擇度假村及房型', done: false },
  { id: 5, text: '安排浮潛/潛水活動', done: false },
  { id: 6, text: '準備防曬及泳衣', done: false },
  { id: 7, text: '兌換美元現金', done: false },
  { id: 8, text: '下載離線地圖', done: false },
];

export default function TripPlannerPage() {
  const [plans, setPlans] = useState<TripPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newPlan, setNewPlan] = useState({ name: '', destination: '馬爾代夫', startDate: '', endDate: '' });
  const [selectedPlan, setSelectedPlan] = useState<TripPlan | null>(null);
  const [items, setItems] = useState<{ id: number; text: string; done: boolean }[]>([]);
  const [newItem, setNewItem] = useState('');

  useEffect(() => { fetchPlans(); }, []);

  async function fetchPlans() {
    try {
      const res = await client.api.fetch('/api/trip-plans');
      const data = await res.json();
      setPlans(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function createPlan() {
    if (!newPlan.name) return;
    try {
      await client.api.fetch('/api/trip-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPlan.name,
          destination: newPlan.destination,
          startDate: newPlan.startDate ? Math.floor(new Date(newPlan.startDate).getTime() / 1000) : null,
          endDate: newPlan.endDate ? Math.floor(new Date(newPlan.endDate).getTime() / 1000) : null,
          items: defaultItems,
        }),
      });
      setShowCreate(false);
      setNewPlan({ name: '', destination: '馬爾代夫', startDate: '', endDate: '' });
      fetchPlans();
    } catch (err) { console.error(err); }
  }

  function selectPlan(plan: TripPlan) {
    setSelectedPlan(plan);
    try {
      const parsed = plan.items ? JSON.parse(plan.items) : defaultItems;
      setItems(parsed);
    } catch {
      setItems(defaultItems);
    }
  }

  async function updateItems(updatedItems: typeof items) {
    setItems(updatedItems);
    if (!selectedPlan) return;
    try {
      await client.api.fetch(`/api/trip-plans/${selectedPlan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedItems }),
      });
    } catch (err) { console.error(err); }
  }

  function toggleItem(id: number) {
    const updated = items.map(i => i.id === id ? { ...i, done: !i.done } : i);
    updateItems(updated);
  }

  function addItem() {
    if (!newItem.trim()) return;
    const updated = [...items, { id: Date.now(), text: newItem, done: false }];
    updateItems(updated);
    setNewItem('');
  }

  function removeItem(id: number) {
    const updated = items.filter(i => i.id !== id);
    updateItems(updated);
  }

  async function deletePlan(id: number) {
    if (!confirm('確定刪除此行程計劃？')) return;
    try {
      await client.api.fetch(`/api/trip-plans/${id}`, { method: 'DELETE' });
      if (selectedPlan?.id === id) setSelectedPlan(null);
      fetchPlans();
    } catch (err) { console.error(err); }
  }

  const completedCount = items.filter(i => i.done).length;
  const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <div className="pt-20 pb-16 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#0d1b2a]">行程規劃</h1>
            <p className="text-gray-500 text-sm mt-1">一鍵生成個人化度假清單</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="bg-[#0a4c6b] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#083d56] transition">
            + 新行程
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Plans list */}
          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-10"><div className="animate-spin w-6 h-6 border-2 border-[#0a4c6b] border-t-transparent rounded-full" /></div>
            ) : plans.length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-center">
                <p className="text-gray-500">建立您的第一個行程計劃</p>
              </div>
            ) : (
              plans.map(plan => (
                <div
                  key={plan.id}
                  onClick={() => selectPlan(plan)}
                  className={`bg-white rounded-xl p-4 cursor-pointer transition border ${selectedPlan?.id === plan.id ? 'border-[#0a4c6b] ring-1 ring-[#0a4c6b]' : 'border-gray-100 hover:border-[#2ec4b6]'}`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-[#0d1b2a]">{plan.name}</h3>
                    <button onClick={(e) => { e.stopPropagation(); deletePlan(plan.id); }} className="text-red-400 hover:text-red-600 text-xs">刪除</button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{plan.destination || '未設目的地'}</p>
                  {plan.startDate && (
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(plan.startDate * 1000).toLocaleDateString('zh-HK')}
                      {plan.endDate && ` - ${new Date(plan.endDate * 1000).toLocaleDateString('zh-HK')}`}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Plan detail */}
          <div className="lg:col-span-2">
            {selectedPlan ? (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-[#0d1b2a]">{selectedPlan.name}</h2>
                  <span className="text-sm text-[#2ec4b6] font-medium">{progress}% 完成</span>
                </div>
                
                {/* Progress bar */}
                <div className="w-full h-2 bg-gray-100 rounded-full mb-6 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#0a4c6b] to-[#2ec4b6] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>

                {/* Items */}
                <div className="space-y-2 mb-4">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 group">
                      <button onClick={() => toggleItem(item.id)} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${item.done ? 'bg-[#2ec4b6] border-[#2ec4b6]' : 'border-gray-300'}`}>
                        {item.done && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                      </button>
                      <span className={`flex-1 text-sm ${item.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>{item.text}</span>
                      <button onClick={() => removeItem(item.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-xs transition">移除</button>
                    </div>
                  ))}
                </div>

                {/* Add item */}
                <div className="flex gap-2">
                  <input
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addItem()}
                    placeholder="新增項目..."
                    className="flex-1 border rounded-lg px-3 py-2 text-sm"
                  />
                  <button onClick={addItem} className="bg-[#0a4c6b] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#083d56] transition">新增</button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                <div className="text-4xl mb-4">🏝️</div>
                <h3 className="text-lg font-semibold text-[#0d1b2a] mb-2">選擇或建立行程計劃</h3>
                <p className="text-gray-500 text-sm">從左側選擇一個行程，或點擊「新行程」開始規劃您的完美假期。</p>
              </div>
            )}
          </div>
        </div>

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">建立新行程</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">行程名稱</label>
                  <input value={newPlan.name} onChange={(e) => setNewPlan({...newPlan, name: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="例如：2026 馬爾代夫蜜月之旅" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">目的地</label>
                  <input value={newPlan.destination} onChange={(e) => setNewPlan({...newPlan, destination: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">出發日期</label>
                    <input type="date" value={newPlan.startDate} onChange={(e) => setNewPlan({...newPlan, startDate: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">回程日期</label>
                    <input type="date" value={newPlan.endDate} onChange={(e) => setNewPlan({...newPlan, endDate: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowCreate(false)} className="flex-1 border border-gray-300 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">取消</button>
                <button onClick={createPlan} className="flex-1 bg-[#0a4c6b] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-[#083d56]">建立</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
