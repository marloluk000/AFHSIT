import React, { useState, useMemo } from 'react';
import { Player, InventoryItem } from '../types';
import Modal from './common/Modal';

const AssignItemModal: React.FC<{
    isOpen: boolean;
    item: InventoryItem;
    onClose: () => void;
    onAssign: (playerId: string, quantity: number) => void;
    availablePlayers: Player[];
}> = ({ isOpen, item, onClose, onAssign, availablePlayers }) => {
    const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
    const [quantity, setQuantity] = useState(1);
    
    // Reset state when modal opens for a new item
    React.useEffect(() => {
        if(isOpen) {
            setSelectedPlayerId('');
            setQuantity(1);
        }
    }, [isOpen]);

    const handleAssign = () => {
        if (!selectedPlayerId || quantity <= 0) {
            alert("Please select a player and enter a valid quantity.");
            return;
        }
        if(item && quantity > item.quantity) {
            alert(`Cannot assign more than the available quantity of ${item.quantity}.`);
            return;
        }
        onAssign(selectedPlayerId, quantity);
    };
    
    if (!isOpen) return null;

    return (
        <Modal 
          title={`Assign "${item.productName}"`} 
          onClose={onClose} 
          onConfirm={handleAssign} 
          confirmText="Assign"
        >
            <div className="space-y-4">
                <div>
                    <label htmlFor="player" className="block text-sm font-medium text-gray-300 mb-2">Player</label>
                    <select
                        id="player"
                        value={selectedPlayerId}
                        onChange={(e) => setSelectedPlayerId(e.target.value)}
                        className="w-full bg-gray-800 border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-white"
                    >
                        <option value="">Select a player...</option>
                        {availablePlayers.map(player => (
                            <option key={player.id} value={player.id}>
                                {player.name}
                            </option>
                        ))}
                    </select>
                </div>
                {item && (
                    <div>
                        <label htmlFor="quantity" className="block text-sm font-medium text-gray-300 mb-2">
                            Quantity (In Stock: {item.quantity})
                        </label>
                        <input
                            id="quantity"
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            min="1"
                            max={item.quantity}
                            className="w-full bg-gray-800 border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-white"
                        />
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default AssignItemModal;