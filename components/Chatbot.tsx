import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Chat } from '@google/genai';
import { createChat, answerInventoryQuestion } from '../services/geminiService';
import { ChatMessage, InventoryItem } from '../types';
import { SendIcon } from './icons/SendIcon';

interface ChatbotProps {
    inventory: InventoryItem[];
}

const Chatbot: React.FC<ChatbotProps> = ({ inventory }) => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        setChat(createChat());
        setMessages([{
            role: 'model',
            text: "Hello! Ask me about inventory management, or ask questions about your current inventory like 'How many helmets do we have?'"
        }])
    }, []);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = useCallback(async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        try {
            let modelResponse = '';
            setMessages(prev => [...prev, { role: 'model', text: '' }]);

            const inventoryKeywords = ['how many', 'what', 'where', 'list', 'show me', 'do we have', 'inventory'];
            const isInventoryQuery = inventoryKeywords.some(kw => currentInput.toLowerCase().includes(kw));

            if (isInventoryQuery) {
                modelResponse = await answerInventoryQuestion(currentInput, inventory);
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = { role: 'model', text: modelResponse };
                    return newMessages;
                });
            } else if (chat) {
                const responseStream = await chat.sendMessageStream({ message: currentInput });
                for await (const chunk of responseStream) {
                    modelResponse += chunk.text;
                    setMessages(prev => {
                        const newMessages = [...prev];
                        newMessages[newMessages.length - 1] = { role: 'model', text: modelResponse };
                        return newMessages;
                    });
                }
            } else {
                throw new Error("Chat not initialized.");
            }
        } catch (error) {
            console.error('Chat error:', error);
            const errorText = error instanceof Error ? error.message : "Sorry, I'm having trouble connecting. Please try again later.";
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { role: 'model', text: errorText };
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    }, [input, chat, isLoading, inventory]);

    return (
        <div className="flex flex-col h-full w-full bg-black/50 rounded-2xl border border-gray-800 shadow-lg overflow-hidden animate-fade-in">
            <div ref={chatContainerRef} className="flex-1 p-6 space-y-4 overflow-y-auto">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0"></div>}
                        <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl ${msg.role === 'user' ? 'bg-white text-black rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none'}`}>
                           <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isLoading && messages.length > 0 && messages[messages.length-1].role === 'model' && messages[messages.length-1].text === '' && (
                     <div className="flex items-end gap-3 justify-start">
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0"></div>
                        <div className="px-4 py-3 rounded-2xl bg-gray-800">
                           <div className="flex items-center justify-center space-x-1">
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="p-4 border-t border-gray-800 bg-black/50">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask about your inventory..."
                        className="flex-1 bg-gray-800 border-gray-700 rounded-full py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white"
                        disabled={isLoading}
                    />
                    <button onClick={handleSend} disabled={isLoading || !input.trim()} className="bg-white text-black rounded-full p-3 hover:bg-gray-200 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors">
                       <SendIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chatbot;
