import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 shadow-lg overflow-hidden ${className}`}>
      {children}
    </div>
  );
};

export default Card;