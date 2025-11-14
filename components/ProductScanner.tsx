import React, { useState, useRef, useCallback } from 'react';
import { identifyProductsFromImage } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import { ProductInfo } from '../types';
import Card from './common/Card';
import { CameraIcon } from './icons/CameraIcon';

interface ProductScannerProps {
  onAddToInventory: (productInfo: ProductInfo) => void;
}

const ProductScanner: React.FC<ProductScannerProps> = ({ onAddToInventory }) => {
    const [identifiedProducts, setIdentifiedProducts] = useState<ProductInfo[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setError(null);
        setIdentifiedProducts(null);
        setImagePreview(URL.createObjectURL(file));

        try {
            const base64Image = await fileToBase64(file);
            const results = await identifyProductsFromImage(base64Image, file.type);
            if (results.length === 0) {
                throw new Error("Could not identify any products in the image. Please try a clearer picture.");
            }
            setIdentifiedProducts(results);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleScanClick = () => {
        fileInputRef.current?.click();
    };
    
    const handleReset = () => {
        setIdentifiedProducts(null);
        setError(null);
        setIsLoading(false);
        setImagePreview(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="text-center">
                    {imagePreview && <img src={imagePreview} alt="Selected product" className="max-h-60 mx-auto rounded-lg mb-4" />}
                    <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 rounded-full bg-gray-500 animate-pulse"></div>
                        <div className="w-4 h-4 rounded-full bg-gray-500 animate-pulse [animation-delay:0.2s]"></div>
                        <div className="w-4 h-4 rounded-full bg-gray-500 animate-pulse [animation-delay:0.4s]"></div>
                    </div>
                    <p className="mt-2 text-gray-300">Identifying product(s)...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="text-center">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button onClick={handleReset} className="bg-gray-200 hover:bg-gray-300 text-black font-bold py-2 px-4 rounded-lg transition-colors">
                        Try Again
                    </button>
                </div>
            );
        }

        if (identifiedProducts) {
            // Single item view
            if (identifiedProducts.length === 1) {
                const productInfo = identifiedProducts[0];
                 return (
                    <Card className="animate-fade-in">
                        {imagePreview && <img src={imagePreview} alt={productInfo.productName} className="w-full h-48 object-contain rounded-t-lg mb-4 bg-black" />}
                        <div className="p-4">
                            <h3 className="text-2xl font-bold text-white mb-2">{productInfo.productName}</h3>
                            <p className="text-gray-300 mb-6">{productInfo.description}</p>
                            <div className="flex flex-col gap-3">
                            <button 
                                onClick={() => onAddToInventory(productInfo)}
                                className="w-full text-center bg-white hover:bg-gray-200 text-black font-bold py-3 px-4 rounded-lg transition-colors"
                            >
                                Add to Inventory
                            </button>
                            <a
                                href={`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(productInfo.searchQuery)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full text-center bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                            >
                                Find to Purchase
                            </a>
                            <button onClick={handleReset} className="w-full text-center bg-transparent hover:bg-gray-800 text-gray-300 font-bold py-3 px-4 rounded-lg transition-colors border border-gray-700">
                                Scan Another
                            </button>
                            </div>
                        </div>
                    </Card>
                );
            }
            // Multi-item selection view
            return (
                <div className="text-center animate-fade-in">
                    {imagePreview && <img src={imagePreview} alt="Scanned products" className="max-h-48 mx-auto rounded-lg mb-4" />}
                    <h3 className="text-2xl font-bold text-white mb-2">Multiple Items Detected</h3>
                    <p className="text-gray-300 mb-6">Please select the item you want to add to inventory.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {identifiedProducts.map((product, index) => (
                           <button 
                                key={index} 
                                onClick={() => onAddToInventory(product)} 
                                className="text-left bg-gray-900/50 backdrop-blur-sm p-4 rounded-2xl border border-gray-800 hover:border-white transition-all duration-300 transform hover:-translate-y-1 group"
                            >
                                <h4 className="font-semibold text-white">{product.productName}</h4>
                                <p className="text-sm text-gray-400">{product.description}</p>
                           </button>
                        ))}
                    </div>
                    <button onClick={handleReset} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-5 rounded-lg transition-colors">
                        Scan Another Image
                    </button>
                </div>
            )
        }

        return (
            <div className="text-center flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-700 rounded-2xl">
                <CameraIcon className="w-16 h-16 text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Scan Your Product</h3>
                <p className="text-gray-400 mb-6">Take a picture or upload an image to identify equipment.</p>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                />
                <button
                    onClick={handleScanClick}
                    className="bg-white hover:bg-gray-200 text-black font-bold py-3 px-6 rounded-lg transition-colors"
                >
                    Upload Image
                </button>
            </div>
        );
    };

    return <div className="w-full h-full flex flex-col justify-center">{renderContent()}</div>;
};

export default ProductScanner;