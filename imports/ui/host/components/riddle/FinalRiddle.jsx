import React from 'react';

const FinalRiddle = ({ finalRiddle }) => {
  return (
    <div className="mb-8">
      <h1 
        className="text-white uppercase mb-6" 
        style={{ 
          fontSize: '4.5rem', 
          letterSpacing: '0.0em', 
          lineHeight: 1 
        }}
      >
        THE FINAL <span style={{ color: '#991b1b' }}>RIDDLE</span>
      </h1>
      <div className="border-l-4 border-red-600 p-8" style={{ backgroundColor: '#1a1a1a' }}>
        <p className="text-white font-bold text-xl leading-relaxed tracking-wide">
          "{finalRiddle}"
        </p>
      </div>
    </div>
  );
};

export default FinalRiddle;