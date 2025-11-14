import React, { useState, useMemo } from 'react';
import { Player, InventoryItem, PlayerInventoryAssignment } from '../types';
import Card from './common/Card';
import Modal from './common/Modal';
import { InventoryIcon } from './icons/InventoryIcon';

interface PlayerInventoryDetailProps {
    player: Player;
    assignedItems: { assignment: PlayerInventoryAssignment; item: InventoryItem }[];
    availableInventory: InventoryItem[];
    onAssignItem: (playerId: string, inventoryId: string, quantity: number) => void;
    onCheckInItem: (assignment: PlayerInventoryAssignment) => void;
    onCheckInAll: (playerId: string) => void;
}

const AssignItemModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onAssign: (inventoryId: string, quantity: number) => void;
    availableInventory: InventoryItem[];
}> = ({ isOpen, onClose, onAssign, availableInventory }) => {
    const [selectedItemId, setSelectedItemId] = useState<string>('');
    const [quantity, setQuantity] = useState(1);

    const selectedItem = useMemo(() => availableInventory.find(i => i.id === selectedItemId), [selectedItemId, availableInventory]);

    const handleAssign = () => {
        if (!selectedItemId || quantity <= 0) {
            alert("Please select an item and enter a valid quantity.");
            return;
        }
        if(selectedItem && quantity > selectedItem.quantity) {
            alert(`Cannot assign more than the available quantity of ${selectedItem.quantity}.`);
            return;
        }
        onAssign(selectedItemId, quantity);
        onClose();
    };
    
    if (!isOpen) return null;

    return (
        <Modal title="Assign Item" onClose={onClose} onConfirm={handleAssign} confirmText="Assign">
            <div className="space-y-4">
                <div>
                    <label htmlFor="item" className="block text-sm font-medium text-gray-300 mb-2">Item</label>
                    <select
                        id="item"
                        value={selectedItemId}
                        onChange={(e) => { setSelectedItemId(e.target.value); setQuantity(1); }}
                        className="w-full bg-gray-800 border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-white"
                    >
                        <option value="">Select an item...</option>
                        {availableInventory.map(item => (
                            <option key={item.id} value={item.id}>
                                {item.productName} (In Stock: {item.quantity})
                            </option>
                        ))}
                    </select>
                </div>
                {selectedItem && (
                    <div>
                        <label htmlFor="quantity" className="block text-sm font-medium text-gray-300 mb-2">Quantity</label>
                        <input
                            id="quantity"
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            min="1"
                            max={selectedItem.quantity}
                            className="w-full bg-gray-800 border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-white"
                        />
                    </div>
                )}
            </div>
        </Modal>
    );
};


const PlayerInventoryDetail: React.FC<PlayerInventoryDetailProps> = ({ player, assignedItems, availableInventory, onAssignItem, onCheckInItem, onCheckInAll }) => {
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

    const handleAssign = (inventoryId: string, quantity: number) => {
        onAssignItem(player.id, inventoryId, quantity);
    };

    return (
        <div className="w-full h-full flex flex-col animate-fade-in">
            <div className="mb-4 flex flex-col sm:flex-row gap-2">
                <button
                    onClick={() => setIsAssignModalOpen(true)}
                    className="flex-1 bg-white hover:bg-gray-200 text-black font-bold py-2 px-4 rounded-full transition-colors"
                >
                    Assign New Item
                </button>
                <button
                    onClick={() => onCheckInAll(player.id)}
                    disabled={assignedItems.length === 0}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-full transition-colors disabled:bg-gray-800 disabled:cursor-not-allowed"
                >
                    Check-in All Items
                </button>
            </div>
            
            {assignedItems.length === 0 ? (
                <div className="text-center flex flex-col items-center justify-center flex-1 p-8 border-2 border-dashed border-gray-700 rounded-2xl">
                     <InventoryIcon className="w-16 h-16 text-gray-600 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Items Assigned</h3>
                    <p className="text-gray-400">Assign an item to this player to see it here.</p>
                </div>
            ) : (
                 <div className="flex-1 space-y-4 overflow-y-auto pr-2 -mr-2">
                    {assignedItems.map(({ assignment, item }) => (
                         <Card key={assignment.id} className="p-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1">
                                {item.imageBase64 && <img src={`data:image/png;base64,${item.imageBase64}`} alt={item.productName} className="w-12 h-12 object-cover rounded-lg bg-gray-700" />}
                                <div className="flex-1">
                                    <h3 className="font-bold text-white">{item.productName}</h3>
                                    <p className="text-sm text-gray-400">
                                        Qty: <span className="font-semibold text-gray-200">{assignment.quantity}</span>
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => onCheckInItem(assignment)}
                                className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold py-1.5 px-3 rounded-full transition-colors"
                            >
                                Check-in
                            </button>
                        </Card>
                    ))}
                 </div>
            )}

            <AssignItemModal 
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                onAssign={handleAssign}
                availableInventory={availableInventory}
            />
        </div>
    );
};

export default PlayerInventoryDetail;
