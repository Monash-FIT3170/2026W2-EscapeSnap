import React from 'react';

const FinalRiddle = ({ finalRiddle }) => {
  return (
    <div className="bg-gray-900 py-6 px-12 mx-8 my-8">
      <div className='flex justify-content items-center mt-6 mb-6'>
        <h2 className="text-white font-extrabold text-7xl uppercase tracking-widest mb-1 mx-2">
            THE FINAL
        </h2>
        <h2 className='text-red-600 font-extrabold text-7xl uppercase tracking-widest mb-1 px-4'> 
            Riddle 
        </h2>
      </div>
      <div className="bg-gray-800 border-l-8 border-red-600 p-2 mb-1">
        <p className="text-white font-extrabold text-2xl tracking-wide">{"\"" + finalRiddle + "\""}</p>
      </div>
    </div>
  );
};

export default FinalRiddle;
