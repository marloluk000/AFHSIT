import React, { useState, useEffect } from 'react';
import { ProductInfo, InventoryItem, ItemCondition } from '../types';
import Card from './common/Card';
import { PlusIcon } from './icons/PlusIcon';
import { MinusIcon } from './icons/MinusIcon';
import { suggestItemDetails } from '../services/geminiService';

interface AddInventoryFormProps {
    productInfo?: ProductInfo;
    existingItem?: InventoryItem;
    onSave: (itemData: any) => void;
    onCancel: () => void;
    inventory: InventoryItem[];
}

const AddInventoryForm: React.FC<AddInventoryFormProps> = ({ productInfo, existingItem, onSave, onCancel, inventory }) => {
    const [formData, setFormData] = useState({
        quantity: 1,
        condition: 'New' as ItemCondition,
        location: '',
        notes: '',
        reorderPoint: '',
    });
    const [isSuggesting, setIsSuggesting] = useState(false);

    const itemDetails = existingItem || productInfo;
    const isEditing = !!existingItem;

    useEffect(() => {
        if (existingItem) {
            setFormData({
                quantity: existingItem.quantity,
                condition: existingItem.condition,
                location: existingItem.location,
                notes: existingItem.notes || '',
                reorderPoint: existingItem.reorderPoint?.toString() || '',
            });
        } else if (productInfo) {
            // Set initial state from product info
            setFormData(prev => ({ ...prev, condition: productInfo.suggestedCondition || 'New' }));

            // Trigger AI suggestions
            const getSuggestions = async () => {
                setIsSuggesting(true);
                const suggestions = await suggestItemDetails(productInfo.productName, productInfo.description, inventory);
                setFormData(prev => ({
                    ...prev,
                    location: suggestions.location || prev.location,
                    notes: suggestions.notes || prev.notes,
                    reorderPoint: suggestions.reorderPoint?.toString() || prev.reorderPoint,
                }));
                setIsSuggesting(false);
            };
            getSuggestions();
        }
    }, [existingItem, productInfo, inventory]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleQuantityChange = (amount: number) => {
        setFormData(prev => ({ ...prev, quantity: Math.max(1, prev.quantity + amount) }));
    };

    const handleSave = () => {
        if (!formData.location) {
            alert('Please enter a location for the item.');
            return;
        }
        
        const saveData = {
            ...itemDetails,
            quantity: Number(formData.quantity),
            condition: formData.condition,
            location: formData.location,
            notes: formData.notes,
            reorderPoint: formData.reorderPoint ? Number(formData.reorderPoint) : undefined,
        };
        
        if (isEditing) {
            onSave(saveData);
        } else {
            // remove id and dateAdded for new items
            const { id, dateAdded, ...newItemData } = saveData;
            onSave(newItemData);
        }
    };

    const conditions: ItemCondition[] = ['New', 'Good', 'Fair', 'Poor'];

    if (!itemDetails) return null;

    return (
        <div className="w-full h-full flex flex-col justify-center animate-fade-in">
            <Card>
                <div className="p-6">
                    <h3 className="text-2xl font-bold text-white mb-2">{itemDetails.productName}</h3>
                    <p className="text-gray-400 mb-6">{itemDetails.description}</p>

                    <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
                        {/* Quantity */}
                        <div>
                            <label htmlFor="quantity" className="block text-sm font-medium text-gray-300 mb-2">Quantity</label>
                            <div className="flex items-center gap-4">
                                <button type="button" onClick={() => handleQuantityChange(-1)} className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"><MinusIcon className="w-5 h-5" /></button>
                                <input id="quantity" type="number" value={formData.quantity} onChange={e => setFormData(f => ({...f, quantity: Math.max(1, parseInt(e.target.value) || 1)}))} className="w-20 text-center bg-gray-800 border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-white" />
                                <button type="button" onClick={() => handleQuantityChange(1)} className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"><PlusIcon className="w-5 h-5" /></button>
                            </div>
                        </div>

                        {/* Condition */}
                        <div>
                             <label htmlFor="condition" className="block text-sm font-medium text-gray-300 mb-2">Condition</label>
                             <select id="condition" value={formData.condition} onChange={handleChange} className="w-full bg-gray-800 border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-white">
                                {conditions.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        
                        {/* Location */}
                        <div>
                            <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-2">
                                Location {isSuggesting && !isEditing && <span className="text-xs text-gray-400 animate-pulse"> (AI suggesting...)</span>}
                            </label>
                            <input id="location" type="text" value={formData.location} onChange={handleChange} placeholder="e.g. Storage Shed B" className="w-full bg-gray-800 border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-white" required />
                        </div>

                         {/* Re-order Point */}
                        <div>
                            <label htmlFor="reorderPoint" className="block text-sm font-medium text-gray-300 mb-2">Re-order Point (Optional)</label>
                            <input id="reorderPoint" type="number" value={formData.reorderPoint} onChange={handleChange} placeholder="e.g., 5" className="w-full bg-gray-800 border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-white" />
                             <p className="text-xs text-gray-500 mt-1">Get a warning when quantity falls to this number.</p>
                        </div>
                        
                        {/* Notes */}
                        <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-2">
                                Notes (Optional) {isSuggesting && !isEditing && <span className="text-xs text-gray-400 animate-pulse"> (AI suggesting...)</span>}
                            </label>
                            <textarea id="notes" value={formData.notes} onChange={handleChange} rows={3} placeholder="e.g. For varsity team only" className="w-full bg-gray-800 border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-white" />
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <button type="submit" className="w-full text-center bg-white hover:bg-gray-200 text-black font-bold py-3 px-4 rounded-lg transition-colors flex-1">
                                {isEditing ? 'Save Changes' : 'Save Item'}
                            </button>
                             <button type="button" onClick={onCancel} className="w-full text-center bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors flex-1">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </Card>
        </div>
    );
};

export default AddInventoryForm;