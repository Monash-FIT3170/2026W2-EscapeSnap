import { useEffect, useState } from 'react';

export function PlayerAvatar({
  photoUrl,
  playerName = 'Player',
  size = 48,
  className = '',
}) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [photoUrl]);

  const initials = playerName.trim().slice(0, 2).toUpperCase() || '??';

  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center overflow-hidden bg-slate-900 font-mono font-bold text-slate-200 ${className}`}
      style={{ width: size, height: size }}
    >
      {photoUrl && !imageFailed ? (
        <img
          src={photoUrl}
          alt={`${playerName} profile`}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span aria-label={`${playerName} profile placeholder`}>{initials}</span>
      )}
    </div>
  );
}
