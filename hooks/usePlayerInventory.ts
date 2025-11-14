import { useState, useEffect } from 'react';
import { PlayerInventoryAssignment } from '../types';
import * as storage from '../services/storageService';

export const usePlayerInventory = () => {
    const [assignments, setAssignments] = useState<PlayerInventoryAssignment[]>([]);

    useEffect(() => {
        setAssignments(storage.loadPlayerInventory());
    }, []);

    const updateAndSave = (newAssignments: PlayerInventoryAssignment[]) => {
        const sorted = newAssignments.sort((a, b) => new Date(b.dateAssigned).getTime() - new Date(a.dateAssigned).getTime());
        setAssignments(sorted);
        storage.savePlayerInventory(sorted);
    };

    const addAssignment = (playerId: string, inventoryId: string, quantity: number) => {
        const newAssignment: PlayerInventoryAssignment = {
            id: `${Date.now()}-${Math.random()}`,
            playerId,
            inventoryId,
            quantity,
            dateAssigned: new Date().toISOString(),
        };
        updateAndSave([newAssignment, ...assignments]);
    };

    const removeAssignment = (id: string) => {
        const newAssignments = assignments.filter(a => a.id !== id);
        updateAndSave(newAssignments);
    };
    
    const clearAssignments = () => {
        updateAndSave([]);
    };

    return { assignments, addAssignment, removeAssignment, clearAssignments };
};