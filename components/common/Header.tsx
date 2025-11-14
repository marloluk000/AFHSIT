import React from 'react';

interface HeaderProps {
    children: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ children }) => {
    return (
        <header className="relative w-full text-center p-4 bg-black/80 backdrop-blur-sm border-b border-gray-800 shadow-md">
           {children}
        </header>
    );
};

export default Header;