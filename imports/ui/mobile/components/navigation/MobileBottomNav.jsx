const navItems = [
  { key: 'clues', label: 'Clues', icon: '🧩' },
  { key: 'scanner', label: 'Scanner', icon: '📷' },
  { key: 'status', label: 'Status', icon: '📡' },
];

export function MobileBottomNav({ active, onChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-700 bg-slate-950/95 backdrop-blur-lg px-4 py-3">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-2">
        {navItems.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={`flex h-14 w-full flex-col items-center justify-center rounded-3xl border px-2 text-sm transition ${
              active === item.key
                ? 'border-cyan-400 bg-cyan-500/10 text-cyan-300 shadow-inner shadow-cyan-500/10'
                : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-slate-100'
            }`}
          >
            <span className="text-lg leading-none">{item.icon}</span>
            <span className="mt-1 font-semibold">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
