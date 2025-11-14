import { useState, useEffect } from 'react';
import { InventoryItem } from '../types';
import * as storage from '../services/storageService';

export const useInventory = () => {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);

    useEffect(() => {
        // Load inventory from storage on initial render
        setInventory(storage.loadInventory());
    }, []);

    const updateAndSave = (newInventory: InventoryItem[]) => {
        // Sort by dateAdded descending so new items are always on top
        const sortedInventory = newInventory.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
        setInventory(sortedInventory);
        storage.saveInventory(sortedInventory);
    };

    const addItem = (itemData: Omit<InventoryItem, 'id' | 'dateAdded'>): InventoryItem => {
        const newItem: InventoryItem = {
            ...itemData,
            id: `${Date.now()}-${Math.random()}`, // simple unique ID
            dateAdded: new Date().toISOString(),
        };
        updateAndSave([newItem, ...inventory]);
        return newItem;
    };

    const updateItem = (id: string, updatedData: Partial<InventoryItem>) => {
        const newInventory = inventory.map(item =>
            item.id === id ? { ...item, ...updatedData } : item
        );
        updateAndSave(newInventory);
    };

    const deleteItem = (id: string) => {
        const newInventory = inventory.filter(item => item.id !== id);
        updateAndSave(newInventory);
    };

    return { inventory, addItem, updateItem, deleteItem };
};