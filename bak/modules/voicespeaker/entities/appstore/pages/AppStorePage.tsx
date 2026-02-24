
import React, { useEffect, useState } from 'react';
import { 
    AppWindow, Briefcase, Code2, PenTool, Layout, Box, Calculator
} from 'lucide-react';
import { MarketLayout } from '../../../../../components/Market/MarketLayout';
import { MarketCard } from '../../../../../components/Market/MarketCard';
import { appStoreService } from '../services/appStoreService';
import { installedAppService } from '../services/installedAppService';
import { AppStoreItem } from '../entities/appstore.entity';
import { platform } from '../../../../../platform';

const CATEGORIES = ['All', 'Productivity', 'Development', 'Utilities', 'Creative', 'Business'];

const getIcon = (category: string) => {
    switch (category) {
        case 'Productivity': return <Layout size={20} className="text-green-400" />;
        case 'Development': return <Code2 size={20} className="text-blue-400" />;
        case 'Creative': return <PenTool size={20} className="text-purple-400" />;
        case 'Business': return <Briefcase size={20} className="text-orange-400" />;
        case 'Utilities': return <Calculator size={20} className="text-gray-400" />;
        default: return <Box size={20} className="text-gray-400" />;
    }
};

const AppStorePage: React.FC = () => {
  const [items, setItems] = useState<AppStoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [installing, setInstalling] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
        // Fetch remote items
        const result = await appStoreService.getApps();
        
        if (result.success && result.data) {
            // Merge with local install state
            const merged = await Promise.all(result.data.map(async (app) => {
                const isInstalled = await installedAppService.isInstalled(app.id);
                return { ...app, isInstalled };
            }));
            setItems(merged);
        }
        
        setLoading(false);
    };
    load();
  }, []);

  const handleInstall = async (id: string) => {
    setInstalling(id);
    try {
      const app = items.find(i => i.id === id);
      if (app) {
          // Perform fake remote install
          const res = await appStoreService.installApp(id);
          
          if (res.success) {
              // Persist local state
              await installedAppService.install(app);
              setItems(prev => prev.map(s => s.id === id ? { ...s, isInstalled: true } : s));
              await platform.notify('App Installed', `${app.name} has been successfully installed.`);
          } else {
              alert(`Failed to install: ${res.message}`);
          }
      }
    } catch (e) {
        console.error(e);
        alert('An error occurred during installation.');
    } finally {
      setInstalling(null);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <MarketLayout
      title="App Store"
      icon={<AppWindow size={18} className="text-indigo-400" />}
      categories={CATEGORIES}
      activeCategory={activeCategory}
      onSelectCategory={setActiveCategory}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
    >
      {loading ? (
        <div className="w-full h-full flex items-center justify-center text-gray-500">Loading Applications...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map(item => (
            <MarketCard
              key={item.id}
              item={{
                id: item.id,
                name: item.name,
                description: item.description,
                author: item.author,
                downloads: item.downloads,
                isInstalled: item.isInstalled,
                version: item.version,
                icon: getIcon(item.category)
              }}
              onInstall={handleInstall}
              isInstalling={installing === item.id}
            />
          ))}
        </div>
      )}
    </MarketLayout>
  );
};

export default AppStorePage;
