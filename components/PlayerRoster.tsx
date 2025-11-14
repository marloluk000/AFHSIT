
import React, { useState, useRef } from 'react';
import { Player } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { UsersIcon } from './icons/UsersIcon';
// FIX: import parsePlayerInventoryFile from geminiService
import { ParsedRoster, parsePlayerInventoryFile } from '../services/geminiService';

interface PlayerRosterProps {
    players: Player[];
    onAddPlayer: (name: string) => void;
    onSelectPlayer: (player: Player) => void;
    onDeletePlayer: (player: Player) => void;
    onRosterUpload: (data: ParsedRoster) => Promise<void>;
}

const PlayerRoster: React.FC<PlayerRosterProps> = ({ players, onAddPlayer, onSelectPlayer, onDeletePlayer, onRosterUpload }) => {
    const [newPlayerName, setNewPlayerName] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAddPlayer = (e: React.FormEvent) => {
        e.preventDefault();
        onAddPlayer(newPlayerName);
        setNewPlayerName('');
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setUploadError(null);

        try {
            const text = await file.text();
            // We can do client-side validation here if needed, e.g., check if file is empty
            if (!text.trim()) {
                throw new Error("File is empty.");
            }
            // FIX: Call parsePlayerInventoryFile directly and pass result to onRosterUpload
            const rosterData = await parsePlayerInventoryFile(text);
            await onRosterUpload(rosterData);
        } catch (e: any) {
            setUploadError(e.message || "An error occurred during upload.");
        } finally {
            setIsUploading(false);
        }

        // Reset file input
        if(fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="w-full h-full flex flex-col animate-fade-in">
            <form onSubmit={handleAddPlayer} className="mb-4 flex gap-2">
                <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="Add new player name"
                    className="flex-1 bg-gray-800 border-gray-700 rounded-full py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white"
                />
                <button type="submit" className="bg-white text-black font-bold rounded-full px-5 py-2 hover:bg-gray-200 disabled:bg-gray-700 transition-colors" disabled={!newPlayerName.trim()}>
                    Add
                </button>
            </form>
             <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".txt,.csv"
                className="hidden"
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full text-center bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-full transition-colors mb-4 disabled:bg-gray-800 disabled:cursor-wait"
            >
                {isUploading ? 'Analyzing Roster with AI...' : 'Upload Roster (.txt, .csv)'}
            </button>
            {uploadError && <p className="text-red-400 text-sm text-center mb-4">{uploadError}</p>}


            {players.length === 0 && !isUploading ? (
                <div className="text-center flex flex-col items-center justify-center flex-1 p-8 border-2 border-dashed border-gray-700 rounded-2xl">
                    <UsersIcon className="w-16 h-16 text-gray-600 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Players Found</h3>
                    <p className="text-gray-400">Add a player or upload a roster to begin.</p>
                </div>
            ) : (
                <div className="flex-1 space-y-3 overflow-y-auto pr-2 -mr-2">
                    {players.map(player => (
                        <div key={player.id} className="bg-gray-900/50 p-4 rounded-2xl border border-gray-800 flex items-center justify-between group">
                           <button onClick={() => onSelectPlayer(player)} className="flex-1 text-left flex items-center gap-4">
                             <p className="text-lg font-semibold text-white group-hover:underline">{player.name}</p>
                             {player.jerseyNumber && <span className="text-sm text-gray-400 font-mono">#{player.jerseyNumber}</span>}
                           </button>
                           <button 
                                onClick={() => onDeletePlayer(player)} 
                                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                                aria-label={`Delete ${player.name}`}
                           >
                                <TrashIcon className="w-5 h-5" />
                           </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PlayerRoster;
