import React, { useEffect } from "react";

interface SubscriptionGuardProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: (tier: string, licenseKey: string | null) => void;
  themeColor?: string;
}

export function SubscriptionGuard({
  isOpen,
  onClose,
  onUnlock,
  themeColor
}: SubscriptionGuardProps) {
  // Automatically unlock lifetime on mount to guarantee completely free & unlocked features
  useEffect(() => {
    if (isOpen) {
      onUnlock("lifetime", "OWNER_LIFETIME");
      onClose();
    }
  }, [isOpen, onUnlock, onClose]);

  return null;
}
