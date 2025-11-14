import React, { useMemo } from 'react';
import { View } from '../App';
import { CameraIcon } from './icons/CameraIcon';
import { ChatIcon } from './icons/ChatIcon';
import { InventoryIcon } from './icons/InventoryIcon';
import { UsersIcon } from './icons/UsersIcon';
import { InventoryItem } from '../types';
import { AlertIcon } from './icons/AlertIcon';

interface HomeScreenProps {
  onNavigate: (view: View) => void;
  inventory: InventoryItem[];
  playersWithGearCount: number;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate, inventory, playersWithGearCount }) => {

  const stats = useMemo(() => {
    const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const lowStockItems = inventory.filter(item => item.reorderPoint !== undefined && item.quantity <= item.reorderPoint).length;
    return { totalItems, lowStockItems };
  }, [inventory]);

  const recentItems = useMemo(() => {
    return [...inventory]
      .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
      .slice(0, 3);
  }, [inventory]);

  return (
    <div className="flex flex-col h-full w-full space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Total Items" value={stats.totalItems} icon={<InventoryIcon className="w-6 h-6" />} />
          <StatCard title="Players with Gear" value={playersWithGearCount} icon={<UsersIcon className="w-6 h-6" />} />
          <StatCard title="Low Stock Alerts" value={stats.lowStockItems} icon={<AlertIcon className="w-6 h-6" />} isWarning={stats.lowStockItems > 0} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <HomeCard
          title="Scan Product"
          description="Identify and log new equipment."
          icon={<CameraIcon className="w-8 h-8" />}
          onClick={() => onNavigate('scanner')}
        />
        <HomeCard
          title="Ask Assistant"
          description="Chat with an AI for help."
          icon={<ChatIcon className="w-8 h-8" />}
          onClick={() => onNavigate('chatbot')}
        />
      </div>

       <div className="flex flex-col space-y-3">
        <h3 className="text-lg font-semibold text-white mb-1">Manage Inventory</h3>
         <button
          onClick={() => onNavigate('inventoryList')}
          className="w-full text-left bg-gray-900/50 backdrop-blur-sm p-4 rounded-2xl border border-gray-800 hover:border-white transition-all duration-300 transform hover:-translate-y-1 group"
        >
          <div className="flex items-center gap-4">
            <div className="text-gray-300 group-hover:text-white transition-colors"><InventoryIcon className="w-8 h-8" /></div>
            <div>
              <h3 className="text-lg font-semibold text-white">View Full Inventory</h3>
              <p className="text-sm text-gray-400">Browse, search, and manage all items.</p>
            </div>
          </div>
        </button>
         <button
          onClick={() => onNavigate('playerRoster')}
          className="w-full text-left bg-gray-900/50 backdrop-blur-sm p-4 rounded-2xl border border-gray-800 hover:border-white transition-all duration-300 transform hover:-translate-y-1 group"
        >
          <div className="flex items-center gap-4">
            <div className="text-gray-300 group-hover:text-white transition-colors"><UsersIcon className="w-8 h-8" /></div>
            <div>
              <h3 className="text-lg font-semibold text-white">Player Inventory</h3>
              <p className="text-sm text-gray-400">Assign and track items for each player.</p>
            </div>
          </div>
        </button>
      </div>

      {recentItems.length > 0 && (
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-3">Recently Added</h3>
          <div className="space-y-3">
            {recentItems.map(item => (
              <div key={item.id} className="bg-gray-900/50 p-3 rounded-lg border border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {item.imageBase64 && <img src={`data:image/png;base64,${item.imageBase64}`} alt={item.productName} className="w-10 h-10 object-cover rounded-md bg-gray-700" />}
                  <div>
                    <p className="font-semibold text-white">{item.productName}</p>
                    <p className="text-xs text-gray-400">{item.location}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-300">Qty: <span className="font-bold text-white">{item.quantity}</span></p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface HomeCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const HomeCard: React.FC<HomeCardProps> = ({ title, description, icon, onClick }) => (
  <button
    onClick={onClick}
    className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-800 hover:border-white focus:border-white focus:ring-2 focus:ring-white/50 transition-all duration-300 transform hover:-translate-y-1 group"
  >
    <div className="flex flex-col items-center text-center">
      <div className="mb-4 text-gray-300 group-hover:text-white transition-colors">{icon}</div>
      <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  </button>
);

const StatCard: React.FC<{title: string; value: number | string; icon: React.ReactNode; isWarning?: boolean}> = ({ title, value, icon, isWarning }) => (
    <div className={`bg-gray-900/50 p-4 rounded-2xl border border-gray-800 flex items-center gap-4 ${isWarning ? 'text-yellow-300' : 'text-gray-300'}`}>
        {icon}
        <div>
            <p className="text-sm">{title}</p>
            <p className={`text-2xl font-bold ${isWarning ? 'text-yellow-200' : 'text-white'}`}>{value}</p>
        </div>
    </div>
);


export default HomeScreen;