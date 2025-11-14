import { InventoryItem, Player, PlayerInventoryAssignment } from '../types';

const INVENTORY_STORAGE_KEY = 'team-inventory-assistant-data';
const PLAYERS_STORAGE_KEY = 'team-inventory-players-data';
const PLAYER_INVENTORY_STORAGE_KEY = 'team-inventory-assignments-data';

export const saveInventory = (inventory: InventoryItem[]): void => {
    try {
        const data = JSON.stringify(inventory);
        localStorage.setItem(INVENTORY_STORAGE_KEY, data);
    } catch (error) {
        console.error("Failed to save inventory to localStorage", error);
    }
};

export const loadInventory = (): InventoryItem[] => {
    try {
        const data = localStorage.getItem(INVENTORY_STORAGE_KEY);
        if (data) {
            return JSON.parse(data);
        }
    } catch (error) {
        console.error("Failed to load inventory from localStorage", error);
    }
    return []; // Return empty array if no data or on error
};

// New Player functions
export const savePlayers = (players: Player[]): void => {
    try {
        const data = JSON.stringify(players);
        localStorage.setItem(PLAYERS_STORAGE_KEY, data);
    } catch (error) {
        console.error("Failed to save players to localStorage", error);
    }
}

export const loadPlayers = (): Player[] => {
    try {
        const data = localStorage.getItem(PLAYERS_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error("Failed to load players from localStorage", error);
        return [];
    }
}

// New Player Inventory functions
export const savePlayerInventory = (assignments: PlayerInventoryAssignment[]): void => {
    try {
        const data = JSON.stringify(assignments);
        localStorage.setItem(PLAYER_INVENTORY_STORAGE_KEY, data);
    } catch (error) {
        console.error("Failed to save player inventory to localStorage", error);
    }
}

export const loadPlayerInventory = (): PlayerInventoryAssignment[] => {
    try {
        const data = localStorage.getItem(PLAYER_INVENTORY_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error("Failed to load player inventory from localStorage", error);
        return [];
    }
}
