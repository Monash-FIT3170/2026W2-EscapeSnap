import React from 'react';

const RevealedLetters = ({ letters }) => {
  return (
    <div className="flex flex-wrap justify-center gap-2 my-100">
      {letters.map((letter, index) => (

      
        <div className="hover-3d">
        {/* content */}
        <div key={index} className="w-24 h-24 flex items-center justify-center border-b-2 border-red-600 bg-gray-600 text-white font-bold text-2xl uppercase tracking-widest">
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
