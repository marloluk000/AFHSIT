import React, { useState, useMemo } from 'react';
import { InventoryItem } from '../types';
import Card from './common/Card';
import { TrashIcon } from './icons/TrashIcon';
import { EditIcon } from './icons/EditIcon';
import { AlertIcon } from './icons/AlertIcon';
import { ReportIcon } from './icons/ReportIcon';
import { InventoryIcon } from './icons/InventoryIcon';
import { searchInventoryWithAI, generateReorderReport } from '../services/geminiService';

interface InventoryListProps {
    inventory: InventoryItem[];
    onEditItem: (item: InventoryItem) => void;
    onDeleteItem: (item: InventoryItem) => void;
    onShowReport: (content: string) => void;
}

const InventoryList: React.FC<InventoryListProps> = ({ inventory, onEditItem, onDeleteItem, onShowReport }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [aiSearchResults, setAiSearchResults] = useState<string[] | null>(null);
    const [isAiSearching, setIsAiSearching] = useState(false);
    const [isReportGenerating, setIsReportGenerating] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    const handleAiSearch = async () => {
        if (!searchQuery.trim()) {
            setAiSearchResults(null);
            return;
        }
        setIsAiSearching(true);
        setSearchError(null);
        try {
            const resultIds = await searchInventoryWithAI(searchQuery, inventory);
            setAiSearchResults(resultIds);
        } catch (error: any) {
            setSearchError(error.message || "Failed to perform AI search.");
            setAiSearchResults(null);
        } finally {
            setIsAiSearching(false);
        }
    };

    const handleGenerateReport = async () => {
        setIsReportGenerating(true);
        setSearchError(null);
        try {
            const lowStockItems = inventory.filter(item => item.reorderPoint !== undefined && item.quantity <= item.reorderPoint);
            const reportContent = await generateReorderReport(lowStockItems);
            onShowReport(reportContent);
        } catch (error: any) {
             setSearchError(error.message || "Failed to generate report.");
        } finally {
            setIsReportGenerating(false);
        }
    };
    
    const displayedInventory = useMemo(() => {
        if (aiSearchResults !== null) {
            const resultMap = new Set(aiSearchResults);
            return inventory.filter(item => resultMap.has(item.id));
        }
        if (!searchQuery.trim()) {
            return inventory;
        }
        // Simple text search as fallback/default
        const lowercasedQuery = searchQuery.toLowerCase();
        return inventory.filter(item => 
            item.productName.toLowerCase().includes(lowercasedQuery) ||
            item.location.toLowerCase().includes(lowercasedQuery) ||
            item.notes?.toLowerCase().includes(lowercasedQuery)
        );
    }, [inventory, searchQuery, aiSearchResults]);
    
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        if (aiSearchResults !== null) {
            setAiSearchResults(null); // Reset AI results when typing
        }
    };

    if (inventory.length === 0) {
        return (
            <div className="text-center flex flex-col items-center justify-center h-full animate-fade-in p-8 border-2 border-dashed border-gray-700 rounded-2xl">
                <InventoryIcon className="w-16 h-16 text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Inventory is Empty</h3>
                <p className="text-gray-400">Scan a product to add your first item.</p>
            </div>
        );
    }

    const getConditionClass = (condition: string) => {
        switch (condition) {
            case 'New': return 'bg-green-500/20 text-green-300';
            case 'Good': return 'bg-blue-500/20 text-blue-300';
            case 'Fair': return 'bg-yellow-500/20 text-yellow-300';
            case 'Poor': return 'bg-red-500/20 text-red-300';
            default: return 'bg-gray-500/20 text-gray-300';
        }
    };

    return (
        <div className="w-full h-full flex flex-col animate-fade-in">
            <div className="mb-4 space-y-3">
                <div className="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
                        placeholder="Search, or ask AI a question..."
                        className="w-full bg-gray-800 border-gray-700 rounded-full py-3 pl-5 pr-28 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white"
                    />
                    <button 
                        onClick={handleAiSearch}
                        disabled={isAiSearching}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white text-black font-bold text-sm rounded-full px-4 py-1.5 hover:bg-gray-200 disabled:bg-gray-500 transition-colors"
                    >
                        {isAiSearching ? '...' : 'AI Search'}
                    </button>
                </div>
                 <button onClick={handleGenerateReport} disabled={isReportGenerating} className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-bold text-sm rounded-full px-4 py-2 disabled:bg-gray-800 transition-colors">
                    <ReportIcon className="w-4 h-4" />
                    {isReportGenerating ? 'Generating...' : 'Generate Reorder Report'}
                </button>
                {searchError && <p className="text-red-400 text-sm mt-2 text-center">{searchError}</p>}
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pr-2 -mr-2">
                 {displayedInventory.length === 0 && (
                    <div className="text-center text-gray-400 pt-10">
                        <h3 className="text-lg font-semibold">No items found</h3>
                        <p>Try a different search query or clear your search.</p>
                    </div>
                 )}
                {displayedInventory.map(item => {
                    const isLowStock = item.reorderPoint !== undefined && item.quantity <= item.reorderPoint;
                    return (
                    <Card key={item.id} className={`p-4 flex items-start justify-between gap-4 transition-colors ${isLowStock ? 'border-yellow-500/50' : ''}`}>
                        <div className="flex items-start gap-4 flex-1">
                            {item.imageBase64 && <img src={`data:image/png;base64,${item.imageBase64}`} alt={item.productName} className="w-16 h-16 object-cover rounded-lg bg-gray-700" />}
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-white">{item.productName}</h3>
                                <p className="text-sm text-gray-400 mb-3">{item.location}</p>
                                <div className="flex items-center gap-4 text-sm flex-wrap">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConditionClass(item.condition)}`}>
                                        {item.condition}
                                    </span>
                                    <span className="text-gray-300">
                                        Qty: <span className="font-bold text-white">{item.quantity}</span>
                                    </span>
                                    {isLowStock && (
                                        <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300">
                                            <AlertIcon className="w-3 h-3"/> Low Stock
                                        </span>
                                    )}
                                </div>
                                {item.notes && <p className="text-sm text-gray-500 mt-2 pt-2 border-t border-gray-800">Notes: {item.notes}</p>}
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                             <button 
                                onClick={() => onEditItem(item)} 
                                className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-full transition-colors"
                                aria-label={`Edit ${item.productName}`}
                            >
                                <EditIcon className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={() => onDeleteItem(item)} 
                                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                                aria-label={`Delete ${item.productName}`}
                            >
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </Card>
                )})}
            </div>
        </div>
    );
};

export default InventoryList;
