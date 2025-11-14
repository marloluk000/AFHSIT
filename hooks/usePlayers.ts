import { useState, useEffect } from 'react';
import { Player } from '../types';
import * as storage from '../services/storageService';

export const usePlayers = () => {
    const [players, setPlayers] = useState<Player[]>([]);

    useEffect(() => {
        setPlayers(storage.loadPlayers());
    }, []);

    const updateAndSave = (newPlayers: Player[]) => {
        const sortedPlayers = newPlayers.sort((a, b) => a.name.localeCompare(b.name));
        setPlayers(sortedPlayers);
        storage.savePlayers(sortedPlayers);
    };

    const addPlayer = (name: string, jerseyNumber?: number): Player => {
        const trimmedName = name.trim();
        if (!trimmedName || players.some(p => p.name.toLowerCase() === trimmedName.toLowerCase())) {
            // If duplicate, return the existing player
            return players.find(p => p.name.toLowerCase() === trimmedName.toLowerCase())!;
        }
        const newPlayer: Player = {
            name: trimmedName,
            id: `${Date.now()}-${Math.random()}`,
            jerseyNumber,
        };
        updateAndSave([newPlayer, ...players]);
        return newPlayer;
    };
    
    const clearPlayers = () => {
        updateAndSave([]);
    };

    const deletePlayer = (id: string) => {
        // Here we should also handle removing player inventory assignments.
        // This will be handled in the App.tsx component for better state orchestration.
        const newPlayers = players.filter(p => p.id !== id);
        updateAndSave(newPlayers);
    };

    return { players, addPlayer, deletePlayer, clearPlayers };
};