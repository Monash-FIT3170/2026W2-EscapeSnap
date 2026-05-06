import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { HARDCODED_RIDDLES } from '/imports/lib/riddles';

const MobileRiddlePage = ({ gameId, playerId = 'player1', onCorrect }) => {
  const [photo, setPhoto] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const riddle = HARDCODED_RIDDLES.find(r => r.playerId === playerId);

  const handlePhoto = e => {
    setPhoto(e.target.files[0]);
    setStatus(null);
  };

  const handleSubmit = async () => {
    if (!photo) return setStatus('NO IMAGE');

    setLoading(true);

    try {
      const revealed = await Meteor.callAsync(
        'games.submitRiddle',
        gameId,
        playerId
      );

      setStatus('CORRECT ✓');

      if (onCorrect) {
        onCorrect(revealed);
      }
    } catch (err) {
      setStatus(err.reason || 'ERROR');
    }

    setLoading(false);
  };

  if (!riddle) {
    return <div className="text-red-500">RIDDLE NOT FOUND</div>;
  }

  return (
    <div className="flex flex-col gap-4 pt-5">

      <div className="border border-slate-800 bg-slate-950/60 px-4 py-4">
        <p className="font-mono text-xs text-slate-400">{riddle.id}</p>
        <p className="mt-3 text-sm text-slate-200">"{riddle.riddle}"</p>
      </div>

      <div className="flex items-center justify-center border border-slate-800 min-h-[250px]">
        {photo ? (
          <img
            src={URL.createObjectURL(photo)}
            className="max-h-[200px]"
          />
        ) : (
          <p className="text-slate-500">NO IMAGE</p>
        )}
      </div>

      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhoto}
        className="hidden"
        id="camera"
      />

      <label htmlFor="camera" className="bg-red-700 py-4 text-center text-white cursor-pointer">
        TAKE PHOTO
      </label>

      <button
        onClick={handleSubmit}
        className="border border-red-500 py-4 text-red-400"
      >
        {loading ? 'ANALYSING...' : 'SUBMIT'}
      </button>

      {status && (
        <p className="text-center text-red-400">{status}</p>
      )}
    </div>
  );
};

export default MobileRiddlePage;