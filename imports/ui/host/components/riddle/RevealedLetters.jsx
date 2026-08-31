import React from 'react';

const RevealedLetters = ({ letters }) => {
  return (
    <div className="flex flex-wrap justify-center gap-2 mt-10 mb-16">
      {letters.map((letter, index) => (

      
        <div key={index}  className="hover-3d">
        {/* content */}
        <div className="w-28 h-28 flex items-center justify-center border-b-2 border-red-600 bg-gray-600 text-white font-bold text-2xl uppercase tracking-widest">
          {letter} 
        </div>
        {/* 8 empty divs needed for the 3D effect */}
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        </div>

      ))}
    </div>
  );
};

export default RevealedLetters;
