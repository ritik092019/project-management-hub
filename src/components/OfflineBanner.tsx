import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, Wifi, X } from 'lucide-react';

interface OfflineBannerProps {
  /** Optional className for custom positioning */
  className?: string;
}

/**
 * OfflineBanner — detects network connectivity changes and displays a
 * dismissible banner when the user goes offline. Automatically hides
 * (with a brief "back online" confirmation) when connectivity is restored.
 */
export const OfflineBanner: React.FC<OfflineBannerProps> = ({ className = '' }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [showBackOnline, setShowBackOnline] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setDismissed(false);
      setShowBackOnline(true);
      // Hide the "back online" confirmation after 3 seconds
      const timer = setTimeout(() => setShowBackOnline(false), 3000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBackOnline(false);
      setDismissed(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showOfflineBanner = !isOnline && !dismissed;
  const showOnlineBanner = isOnline && showBackOnline;
  const visible = showOfflineBanner || showOnlineBanner;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={showOfflineBanner ? 'offline' : 'online'}
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`offline-banner ${showOfflineBanner ? 'offline-banner--offline' : 'offline-banner--online'} ${className}`}
          role="status"
          aria-live="polite"
          id="offline-banner"
        >
          <div className="offline-banner__content">
            {showOfflineBanner ? (
              <WifiOff size={16} className="offline-banner__icon" aria-hidden="true" />
            ) : (
              <Wifi size={16} className="offline-banner__icon" aria-hidden="true" />
            )}
            <span className="offline-banner__text">
              {showOfflineBanner
                ? 'You are offline. Some features may be unavailable.'
                : 'Connection restored! You are back online.'}
            </span>
          </div>
          {showOfflineBanner && (
            <button
              id="offline-banner-dismiss"
              className="offline-banner__dismiss"
              onClick={() => setDismissed(true)}
              aria-label="Dismiss offline notification"
              title="Dismiss"
            >
              <X size={14} />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineBanner;
