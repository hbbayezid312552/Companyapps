import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface Props {
  isBangla?: boolean;
}

export const OfflineIndicator: React.FC<Props> = ({ isBangla = true }) => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-600/95 text-white px-3.5 py-2 text-xs md:text-sm font-medium shadow-xl backdrop-blur-xs animate-pulse no-print">
      <WifiOff className="w-4 h-4 shrink-0 text-amber-200" />
      <span>
        {isBangla
          ? 'অফলাইন মোড সক্রিয় — স্থানীয় ডাটাবেজ ব্যবহার হচ্ছে।'
          : 'Offline Mode Active — Using local database.'}
      </span>
    </div>
  );
};
