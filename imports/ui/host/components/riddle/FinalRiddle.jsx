import React from 'react';

const FinalRiddle = ({ finalRiddle }) => {
  return (
    <div className="bg-gray-900 py-6 px-12 mx-8 my-8">
      <div className='flex justify-content items-center mt-6 mb-6'>
        <h2 className="text-white-600 font-extraitalic text-7xl uppercase mb-6 mx-2">
            The Final
        </h2> 
        <h2 className='text-red-600 font-extrabold text-7xl uppercase tracking-widest mb-6 px-4'> 
            Riddle 
        </h2>
      </div>
      <div className="bg-gray-800 border-l-8 border-red-600 p-12 mb-20">
        <p className="text-white font-extrabold text-2xl tracking-wide">{"\"" + finalRiddle + "\""}</p>
      </div>
    </div>
  );
};

export default FinalRiddle;
