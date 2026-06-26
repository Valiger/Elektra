import React, { useState, useEffect } from 'react';

const DEFAULT_APPLIANCES = [
  { id: 'ac_window', name: 'Window AC (1.0 HP)', watts: 1000, icon: 'ac_unit' },
  { id: 'ref', name: 'Refrigerator', watts: 150, icon: 'kitchen' },
  { id: 'tv', name: 'LED TV', watts: 50, icon: 'tv' },
  { id: 'fan', name: 'Electric Fan', watts: 65, icon: 'mode_fan' },
  { id: 'laptop', name: 'Laptop', watts: 50, icon: 'laptop_mac' },
  { id: 'rice', name: 'Rice Cooker', watts: 500, icon: 'rice_bowl' },
];

export default function ApplianceLibrary({ latestRate = 12.00 }) {
  const [appliances, setAppliances] = useState(() => {
    try {
      const saved = localStorage.getItem('elektra_appliances');
      return saved ? JSON.parse(saved) : DEFAULT_APPLIANCES;
    } catch {
      return DEFAULT_APPLIANCES;
    }
  });
  
  const [selected, setSelected] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', watts: '' });

  useEffect(() => {
    localStorage.setItem('elektra_appliances', JSON.stringify(appliances));
  }, [appliances]);

  const handleUpdateHours = (id, hours) => {
    setSelected(prev => ({ ...prev, [id]: hours }));
  };

  const calculateCost = (watts, hours) => {
    return ((watts * hours) / 1000) * 30 * latestRate;
  };

  const totalMonthlyCost = Object.entries(selected).reduce((sum, [id, hours]) => {
    const app = appliances.find(a => a.id === id);
    if (!app || !hours) return sum;
    return sum + calculateCost(app.watts, hours);
  }, 0);

  const startEdit = (app) => {
    setEditingId(app.id);
    setEditForm({ name: app.name, watts: app.watts });
  };

  const saveEdit = () => {
    if (!editForm.name || !editForm.watts) return;
    setAppliances(prev => prev.map(a => 
      a.id === editingId ? { ...a, name: editForm.name, watts: Number(editForm.watts) } : a
    ));
    setEditingId(null);
  };

  const deleteAppliance = (id) => {
    setAppliances(prev => prev.filter(a => a.id !== id));
    setSelected(prev => {
      const newSel = { ...prev };
      delete newSel[id];
      return newSel;
    });
    setEditingId(null);
  };

  const startAdd = () => {
    setEditingId('new');
    setEditForm({ name: '', watts: '' });
  };

  const saveAdd = () => {
    if (!editForm.name || !editForm.watts) return;
    const newApp = {
      id: 'custom_' + Date.now(),
      name: editForm.name,
      watts: Number(editForm.watts),
      icon: 'electrical_services'
    };
    setAppliances(prev => [...prev, newApp]);
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  return (
    <section className="flex flex-col gap-4 mb-8">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-secondary opacity-60">Virtual Home</p>
        <h2 className="font-headline font-bold text-on-surface text-lg leading-tight">Appliance Library</h2>
      </div>

      <div className="glass-panel rounded-2xl p-5" style={{ background: 'rgba(180,150,230,0.11)' }}>
        <p className="text-sm text-secondary mb-4">
          Estimate your monthly cost based on your current rate of <strong className="text-primary">₱{latestRate.toFixed(2)}/kWh</strong>.
        </p>

        <div className="flex flex-col gap-3">
          {appliances.map(app => {
            if (editingId === app.id) {
              return (
                <div key={app.id} className="flex flex-col gap-3 p-4 rounded-xl bg-white/10 border border-primary/30">
                  <input 
                    className="bg-transparent border-b border-white/20 text-sm font-bold text-white outline-none pb-1 placeholder:opacity-50"
                    value={editForm.name}
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                    placeholder="Appliance Name"
                  />
                  <div className="flex items-center gap-2">
                    <input 
                      type="number"
                      className="bg-transparent border-b border-white/20 text-sm text-white outline-none pb-1 placeholder:opacity-50 flex-1"
                      value={editForm.watts}
                      onChange={e => setEditForm({...editForm, watts: e.target.value})}
                      placeholder="Watts"
                    />
                    <span className="text-xs text-secondary opacity-70">Watts</span>
                  </div>
                  <div className="flex justify-end items-center gap-3 mt-2">
                    <button onClick={() => deleteAppliance(app.id)} className="text-xs text-red-400 font-bold mr-auto hover:text-red-300">Delete</button>
                    <button onClick={cancelEdit} className="text-xs text-secondary font-bold hover:text-white">Cancel</button>
                    <button onClick={saveEdit} className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg font-bold hover:bg-primary/80">Save</button>
                  </div>
                </div>
              );
            }

            const hours = selected[app.id] || '';
            const cost = hours ? calculateCost(app.watts, hours) : 0;
            return (
              <div key={app.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 transition-colors hover:bg-white/10">
                <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL' 1"}}>{app.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white truncate">{app.name}</p>
                    <button 
                      onClick={() => startEdit(app)} 
                      className="text-secondary opacity-40 hover:opacity-100 transition-opacity flex-shrink-0 flex items-center justify-center"
                      title="Edit Appliance"
                    >
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-secondary opacity-70">{app.watts} Watts</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <input 
                    type="number" 
                    placeholder="hrs/day" 
                    value={hours}
                    onChange={(e) => handleUpdateHours(app.id, parseFloat(e.target.value) || '')}
                    className="w-16 bg-transparent border-b border-white/20 text-center text-sm outline-none placeholder:opacity-30 text-white pb-1"
                  />
                  <div className="w-16 text-right">
                    <p className="text-xs font-bold text-[#E9C400]">₱{cost ? cost.toFixed(0) : '0'}</p>
                  </div>
                </div>
              </div>
            );
          })}

          {editingId === 'new' && (
            <div className="flex flex-col gap-3 p-4 rounded-xl bg-white/10 border border-primary/30 mt-2 animate-in fade-in slide-in-from-top-2">
              <input 
                className="bg-transparent border-b border-white/20 text-sm font-bold text-white outline-none pb-1 placeholder:opacity-50"
                value={editForm.name}
                onChange={e => setEditForm({...editForm, name: e.target.value})}
                placeholder="Appliance Name (e.g. Inverter AC)"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <input 
                  type="number"
                  className="bg-transparent border-b border-white/20 text-sm text-white outline-none pb-1 placeholder:opacity-50 flex-1"
                  value={editForm.watts}
                  onChange={e => setEditForm({...editForm, watts: e.target.value})}
                  placeholder="Watts (e.g. 800)"
                />
                <span className="text-xs text-secondary opacity-70">Watts</span>
              </div>
              <div className="flex justify-end items-center gap-3 mt-2">
                <button onClick={cancelEdit} className="text-xs text-secondary font-bold hover:text-white">Cancel</button>
                <button onClick={saveAdd} className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg font-bold hover:bg-primary/80">Add</button>
              </div>
            </div>
          )}

          {!editingId && (
            <button 
              onClick={startAdd}
              className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-white/20 text-secondary hover:bg-white/10 hover:border-white/40 hover:text-white transition-all mt-2"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span className="text-[11px] font-bold tracking-wider uppercase">Add Custom Appliance</span>
            </button>
          )}
        </div>

        <div className="mt-5 pt-4 border-t border-white/10 flex justify-between items-center">
          <p className="text-sm font-bold text-secondary">Estimated Total</p>
          <p className="text-xl font-headline font-black text-primary">₱{totalMonthlyCost.toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits:2})}</p>
        </div>
      </div>
    </section>
  );
}

