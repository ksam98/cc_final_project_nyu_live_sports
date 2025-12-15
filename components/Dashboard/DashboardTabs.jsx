export default function DashboardTabs({ activeTab, setActiveTab }) {
  const tabs = ['Live', 'Categories', 'Schedule', 'Favorites'];

  return (
    <div className="flex gap-6 border-b border-border mb-6">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`pb-3 font-semibold transition-colors
            ${activeTab === tab
              ? 'text-nyu-primary-600 border-b-2 border-nyu-primary-600'
              : 'text-nyu-neutral-600 hover:text-nyu-primary-500'
            }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
