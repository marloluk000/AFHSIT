import React, { useState, useMemo } from 'react';
import HomeScreen from './components/HomeScreen';
import ProductScanner from './components/ProductScanner';
import Chatbot from './components/Chatbot';
import Header from './components/common/Header';
import AddInventoryForm from './components/AddInventoryForm';
import InventoryList from './components/InventoryList';
import PlayerRoster from './components/PlayerRoster';
import PlayerInventoryDetail from './components/PlayerInventoryDetail';
import { BackIcon } from './components/icons/BackIcon';
import { ProductInfo, InventoryItem, Player, PlayerInventoryAssignment } from './types';
import { useInventory } from './hooks/useInventory';
import { usePlayers } from './hooks/usePlayers';
import { usePlayerInventory } from './hooks/usePlayerInventory';
import Modal from './components/common/Modal';
import { ParsedRoster } from './services/geminiService';
import AssignItemModal from './components/AssignItemModal';

export type View = 'home' | 'scanner' | 'chatbot' | 'addInventory' | 'inventoryList' | 'editInventory' | 'playerRoster' | 'playerDetail';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [productToAdd, setProductToAdd] = useState<ProductInfo | null>(null);
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [reportModalContent, setReportModalContent] = useState<string | null>(null);
  const [itemToAssign, setItemToAssign] = useState<InventoryItem | null>(null);

  const { inventory, addItem, updateItem, deleteItem } = useInventory();
  const { players, addPlayer, deletePlayer: deletePlayerFromStore, clearPlayers } = usePlayers();
  const { assignments, addAssignment, removeAssignment, clearAssignments } = usePlayerInventory();

  // Derived state for player inventory
  const playerInventoryMap = useMemo(() => {
    const map = new Map<string, { assignment: PlayerInventoryAssignment, item: InventoryItem }[]>();
    for (const assignment of assignments) {
      const item = inventory.find(i => i.id === assignment.inventoryId);
      if (item) {
        if (!map.has(assignment.playerId)) {
          map.set(assignment.playerId, []);
        }
        map.get(assignment.playerId)!.push({ assignment, item });
      }
    }
    return map;
  }, [assignments, inventory]);

  const handleNavigate = (view: View) => {
    setCurrentView(view);
  };

  const handleStartAddToInventory = (product: ProductInfo) => {
    setProductToAdd(product);
    setCurrentView('addInventory');
  };

  const handleStartEditInventory = (item: InventoryItem) => {
    setItemToEdit(item);
    setCurrentView('editInventory');
  }

  const handleSaveInventoryItem = (itemData: Omit<InventoryItem, 'id' | 'dateAdded'>) => {
    const newItem = addItem(itemData);
    setCurrentView('inventoryList');
    setProductToAdd(null);
    setItemToAssign(newItem); // Trigger assign modal
  };

  const handleUpdateInventoryItem = (itemData: InventoryItem) => {
    updateItem(itemData.id, itemData);
    setCurrentView('inventoryList');
    setItemToEdit(null);
  };

  const confirmDeleteItem = (item: InventoryItem) => {
    setItemToDelete(item);
  };

  const handleDeleteInventoryItem = () => {
    if (itemToDelete) {
      // Also remove any player assignments for this item
      assignments
        .filter(a => a.inventoryId === itemToDelete.id)
        .forEach(a => removeAssignment(a.id));
      deleteItem(itemToDelete.id);
      setItemToDelete(null);
    }
  };
  
  // --- Player and Player Inventory Logic ---

  const handleSelectPlayer = (player: Player) => {
    setSelectedPlayer(player);
    setCurrentView('playerDetail');
  };

  const confirmDeletePlayer = (player: Player) => {
    setPlayerToDelete(player);
  };

  const handleDeletePlayer = () => {
    if (playerToDelete) {
      // Check in all items before deleting player
      const playerItems = playerInventoryMap.get(playerToDelete.id) || [];
      playerItems.forEach(({ assignment }) => handleCheckInItem(assignment));
      
      deletePlayerFromStore(playerToDelete.id);
      setPlayerToDelete(null);
    }
  };
  
  const handleAssignItemToPlayer = (playerId: string, inventoryId: string, quantity: number) => {
    const item = inventory.find(i => i.id === inventoryId);
    if (!item || item.quantity < quantity) {
      alert("Not enough items in stock.");
      return false;
    }
    addAssignment(playerId, inventoryId, quantity);
    updateItem(inventoryId, { quantity: item.quantity - quantity });
    return true;
  };
  
  const handleCheckInItem = (assignment: PlayerInventoryAssignment) => {
    const item = inventory.find(i => i.id === assignment.inventoryId);
    if (item) {
      updateItem(item.id, { quantity: item.quantity + assignment.quantity });
    }
    removeAssignment(assignment.id);
  };

  const handleCheckInAllForPlayer = (playerId: string) => {
      const playerItems = playerInventoryMap.get(playerId) || [];
      playerItems.forEach(({ assignment }) => handleCheckInItem(assignment));
  };

  const handleRosterUpload = async (data: ParsedRoster) => {
    // 1. Check in all currently assigned items to reset inventory counts
    handleCheckInAllForPlayer('*'); // A special handler might be cleaner, but this works
    assignments.forEach(handleCheckInItem);

    // 2. Clear all existing players and assignments
    clearPlayers();
    clearAssignments();

    const errors: string[] = [];

    // 3. Process new roster data
    for (const parsedPlayer of data.players) {
        const newPlayer = addPlayer(parsedPlayer.name, parsedPlayer.jerseyNumber);
        
        for (const assignedItem of parsedPlayer.assignedItems) {
            const inventoryItem = inventory.find(i => i.productName.toLowerCase() === assignedItem.productName.toLowerCase());
            
            if (!inventoryItem) {
                errors.push(`Item "${assignedItem.productName}" for player ${newPlayer.name} not found in inventory.`);
                continue;
            }

            if (inventoryItem.quantity < assignedItem.quantity) {
                errors.push(`Not enough stock for "${assignedItem.productName}" for player ${newPlayer.name}. Available: ${inventoryItem.quantity}, Needed: ${assignedItem.quantity}.`);
                continue;
            }

            handleAssignItemToPlayer(newPlayer.id, inventoryItem.id, assignedItem.quantity);
        }
    }

    if (errors.length > 0) {
        alert(`Roster uploaded with some issues:\n- ${errors.join('\n- ')}`);
    } else {
        alert("Roster uploaded successfully!");
    }
  };

  const getHeaderInfo = (): { title: string; showBack: boolean; backView?: View } => {
    switch (currentView) {
      case 'scanner':
        return { title: 'Scan Product', showBack: true };
      case 'chatbot':
        return { title: 'Team Assistant', showBack: true };
      case 'inventoryList':
        return { title: 'Team Inventory', showBack: true };
      case 'addInventory':
        return { title: 'Add to Inventory', showBack: true, backView: 'scanner' };
      case 'editInventory':
        return { title: 'Edit Item', showBack: true, backView: 'inventoryList' };
      case 'playerRoster':
        return { title: 'Player Roster', showBack: true };
      case 'playerDetail':
        return { title: selectedPlayer?.name || 'Player Inventory', showBack: true, backView: 'playerRoster' };
      case 'home':
      default:
        return { title: 'Inventory Dashboard', showBack: false };
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'scanner':
        return <ProductScanner onAddToInventory={handleStartAddToInventory} />;
      case 'chatbot':
        return <Chatbot inventory={inventory} />;
      case 'inventoryList':
        return <InventoryList 
                  inventory={inventory} 
                  onEditItem={handleStartEditInventory}
                  onDeleteItem={confirmDeleteItem} 
                  onShowReport={setReportModalContent}
                />;
      case 'addInventory':
        if (!productToAdd) {
            setCurrentView('scanner'); 
            return null;
        }
        return <AddInventoryForm 
                  productInfo={productToAdd} 
                  onSave={handleSaveInventoryItem}
                  onCancel={() => setCurrentView('scanner')}
                  inventory={inventory}
               />;
      case 'editInventory':
        if (!itemToEdit) {
            setCurrentView('inventoryList');
            return null;
        }
        return <AddInventoryForm 
                  existingItem={itemToEdit}
                  onSave={handleUpdateInventoryItem}
                  onCancel={() => setCurrentView('inventoryList')}
                  inventory={inventory}
               />;
      case 'playerRoster':
          return <PlayerRoster 
                    players={players} 
                    onAddPlayer={(name) => addPlayer(name)}
                    onSelectPlayer={handleSelectPlayer}
                    onDeletePlayer={confirmDeletePlayer}
                    onRosterUpload={handleRosterUpload}
                 />;
      case 'playerDetail':
          if (!selectedPlayer) {
              setCurrentView('playerRoster');
              return null;
          }
          return <PlayerInventoryDetail
                    player={selectedPlayer}
                    assignedItems={playerInventoryMap.get(selectedPlayer.id) || []}
                    availableInventory={inventory.filter(i => i.quantity > 0)}
                    onAssignItem={handleAssignItemToPlayer}
                    onCheckInItem={handleCheckInItem}
                    onCheckInAll={handleCheckInAllForPlayer}
                  />;
      case 'home':
      default:
        return <HomeScreen 
                  onNavigate={handleNavigate} 
                  inventory={inventory}
                  playersWithGearCount={playerInventoryMap.size} 
                />;
    }
  };

  const { title, showBack, backView } = getHeaderInfo();

  return (
    <div className="min-h-screen bg-black font-sans flex flex-col">
      <Header>
        {showBack && (
          <button
            onClick={() => setCurrentView(backView || 'home')}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-2 rounded-full"
            aria-label="Go back"
          >
            <BackIcon className="w-6 h-6" />
          </button>
        )}
        <h1 className="text-xl font-bold text-white">{title}</h1>
      </Header>

      <main className="flex-grow flex flex-col items-center p-4 md:p-6">
        <div className="w-full max-w-2xl h-full">
          {renderView()}
        </div>
      </main>

      {itemToDelete && (
        <Modal
          title="Confirm Deletion"
          onClose={() => setItemToDelete(null)}
          onConfirm={handleDeleteInventoryItem}
          confirmText="Delete"
          isDestructive
        >
          <p>Are you sure you want to delete "{itemToDelete.productName}"? This action cannot be undone.</p>
        </Modal>
      )}

      {playerToDelete && (
         <Modal
          title="Confirm Deletion"
          onClose={() => setPlayerToDelete(null)}
          onConfirm={handleDeletePlayer}
          confirmText="Delete"
          isDestructive
        >
          <p>Are you sure you want to delete "{playerToDelete.name}"? All their assigned inventory will be checked in. This action cannot be undone.</p>
        </Modal>
      )}

      {reportModalContent && (
        <Modal
          title="AI Reorder Report"
          onClose={() => setReportModalContent(null)}
        >
          <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: reportModalContent }} />
        </Modal>
      )}

      {itemToAssign && (
        <AssignItemModal
          isOpen={!!itemToAssign}
          item={itemToAssign}
          onClose={() => setItemToAssign(null)}
          onAssign={(playerId, quantity) => {
            const success = handleAssignItemToPlayer(playerId, itemToAssign.id, quantity);
            if (success) {
              setItemToAssign(null);
            }
          }}
          availablePlayers={players}
        />
      )}
    </div>
  );
};

export default App;