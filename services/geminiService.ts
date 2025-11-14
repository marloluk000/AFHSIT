import { GoogleGenAI, Type, Chat } from "@google/genai";
import { ProductInfo, InventoryItem, Player } from "../types";
import { marked } from "marked";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const productInfoSchema = {
    type: Type.OBJECT,
    properties: {
        productName: {
            type: Type.STRING,
            description: "A concise, descriptive name for the product."
        },
        description: {
            type: Type.STRING,
            description: "A brief, one-sentence summary of the product's features or purpose."
        },
        searchQuery: {
            type: Type.STRING,
            description: "An effective search query term to find this exact product for purchase on Google Shopping."
        },
        suggestedCondition: {
            type: Type.STRING,
            description: "Based on visual wear and tear in the image, estimate the item's condition. Valid options are 'New', 'Good', 'Fair', or 'Poor'."
        }
    },
    required: ["productName", "description", "searchQuery", "suggestedCondition"]
};

export const identifyProductsFromImage = async (base64Image: string, mimeType: string): Promise<ProductInfo[]> => {
    const imagePart = {
        inlineData: {
            data: base64Image,
            mimeType,
        },
    };

    const textPart = {
        text: `Identify all distinct, relevant inventory items in this image suitable for a football team. For each item, provide a short name, a brief description, a concise search query term, and suggest its condition. If only one item is present, return an array with a single object. Respond in the requested JSON format.`,
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: productInfoSchema
                },
            },
        });
        
        const resultText = response.text;
        const parsedResult: Omit<ProductInfo, 'imageBase64'>[] = JSON.parse(resultText);
        // Add the imageBase64 to each identified product
        return parsedResult.map(p => ({ ...p, imageBase64: base64Image }));

    } catch (error) {
        console.error("Error identifying product:", error);
        throw new Error("Failed to identify any products. Please try a clearer image.");
    }
};

export const createChat = (): Chat => {
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: 'You are a helpful assistant for a high school football team\'s inventory manager. You can answer questions about sports equipment, inventory management best practices, or general topics. Keep your answers concise and helpful.',
        },
    });
};

export const searchInventoryWithAI = async (query: string, inventory: InventoryItem[]): Promise<string[]> => {
    if (inventory.length === 0) return [];
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Based on the following user query, return a JSON array containing only the 'id' strings of the matching items from the provided inventory data. Query: "${query}". Inventory Data: ${JSON.stringify(inventory)}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.STRING
                    }
                },
            },
        });

        const resultText = response.text;
        return JSON.parse(resultText);
    } catch (error) {
        console.error("Error with AI search:", error);
        throw new Error("AI search failed. Please try a different query.");
    }
};

export const answerInventoryQuestion = async (query: string, inventory: InventoryItem[]): Promise<string> => {
    if (inventory.length === 0) {
        return "The inventory is currently empty, so I can't answer questions about it.";
    }

    try {
        const prompt = `You are an inventory assistant. Based ONLY on the following JSON data, answer the user's question. If the data doesn't contain the answer, say that you cannot find the information in the current inventory. Be friendly and conversational. \n\nInventory Data: ${JSON.stringify(inventory, null, 2)}\n\nUser Question: "${query}"`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error answering inventory question:", error);
        throw new Error("Sorry, I had trouble analyzing the inventory data.");
    }
}

export const generateReorderReport = async (items: InventoryItem[]): Promise<string> => {
    if (items.length === 0) {
        return "<h2>All items are well-stocked!</h2><p>There are currently no items at or below their re-order point.</p>";
    }

    const prompt = `Generate a concise re-order report for a football team manager based on this list of low-stock items. 
    The report should be in Markdown format. 
    - Start with a brief, encouraging summary.
    - Create a priority-ordered list of items to re-order. Use bold for item names.
    - For each item, mention the current quantity and its location.
    - Include the Google Shopping search query for each item as a clickable link.
    
    Low-stock items: ${JSON.stringify(items)}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        const markdownText = response.text;
        const htmlText = marked.parse(markdownText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="https://www.google.com/search?tbm=shop&q=$2" target="_blank" rel="noopener noreferrer">$1</a>'));
        return htmlText;
    } catch (error) {
        console.error("Error generating reorder report:", error);
        throw new Error("Failed to generate the reorder report.");
    }
}

export const suggestItemDetails = async (
    productName: string, 
    description: string, 
    existingItems: InventoryItem[]
): Promise<Partial<Pick<InventoryItem, 'location' | 'notes' | 'reorderPoint'>>> => {
    if (existingItems.length === 0) return {};

    const prompt = `Given a new inventory item "${productName}" (${description}), and a list of existing inventory, suggest a likely storage 'location', 'notes', and a 'reorderPoint'. Base your suggestions on the most similar items in the list. Respond in JSON format.
    
    Existing Inventory: ${JSON.stringify(existingItems.map(({productName, location, notes, reorderPoint}) => ({productName, location, notes, reorderPoint})))}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        location: { type: Type.STRING },
                        notes: { type: Type.STRING },
                        reorderPoint: { type: Type.NUMBER }
                    }
                },
            },
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error suggesting item details:", error);
        return {}; // Return empty on error, not a critical failure
    }
};


export interface ParsedRoster {
    players: (Omit<Player, 'id'> & {
        assignedItems: {
            productName: string;
            quantity: number;
        }[];
    })[];
}

export const parsePlayerInventoryFile = async (fileContent: string): Promise<ParsedRoster> => {
    const prompt = `
    Analyze the following text, which contains a list of football players, their jersey numbers, and the equipment currently assigned to them.
    Extract the information for each player and return it as a JSON object.
    The structure should contain a single key "players". This key should hold an array of player objects.
    Each player object must have:
    1.  A 'name' (string).
    2.  A 'jerseyNumber' (number). If no jersey number is found for a player, omit this field.
    3.  An 'assignedItems' (array of objects), where each object has a 'productName' (string) and a 'quantity' (number).

    Text to parse:
    ---
    ${fileContent}
    ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        players: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    jerseyNumber: { type: Type.NUMBER },
                                    assignedItems: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                productName: { type: Type.STRING },
                                                quantity: { type: Type.NUMBER }
                                            },
                                            required: ['productName', 'quantity']
                                        }
                                    }
                                },
                                required: ['name', 'assignedItems']
                            }
                        }
                    },
                    required: ['players']
                },
            },
        });
        return JSON.parse(response.text) as ParsedRoster;
    } catch (error) {
        console.error("Error parsing player inventory file:", error);
        throw new Error("The AI failed to understand the file format. Please ensure the file clearly lists players and their equipment.");
    }
};