/**
 * Share Button Component
 *
 * A reusable button for sharing booking or salon information
 */

import React, { useState } from 'react';
import { Box, Text, Button, Icon, useSnackbar } from 'zmp-ui';
import {
  shareBooking,
  shareSalon,
  type ShareBookingData,
  type ShareSalonData,
} from '../../services/notification.service';

type ShareType = 'booking' | 'salon';

interface ShareButtonProps {
  type: ShareType;
  data: ShareBookingData | ShareSalonData;
  variant?: 'button' | 'icon' | 'fab';
  label?: string;
  className?: string;
  onShareSuccess?: () => void;
  onShareError?: (error: Error) => void;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  type,
  data,
  variant = 'button',
  label = 'Chia sẻ',
  className = '',
  onShareSuccess,
  onShareError,
}) => {
  const [loading, setLoading] = useState(false);
  const { openSnackbar } = useSnackbar();

  const handleShare = async () => {
    setLoading(true);
    try {
      let success = false;

      if (type === 'booking') {
        success = await shareBooking(data as ShareBookingData);
      } else {
        success = await shareSalon(data as ShareSalonData);
      }

      if (success) {
        openSnackbar({
          text: 'Chia sẻ thành công!',
          type: 'success',
        });
        onShareSuccess?.();
      }
    } catch (error) {
      openSnackbar({
        text: 'Không thể chia sẻ. Vui lòng thử lại.',
        type: 'error',
      });
      onShareError?.(error as Error);
    } finally {
      setLoading(false);
    }
  };

  // Floating Action Button variant
  if (variant === 'fab') {
    return (
      <Box
        className={className}
        flex
        alignItems="center"
        justifyContent="center"
        onClick={handleShare}
        style={{
          position: 'fixed',
          bottom: 80,
          right: 16,
          width: 56,
          height: 56,
          borderRadius: 999,
          background: 'var(--zaui-light-button-primary-background, var(--brand-accent))',
        }}
      >
        {loading ? <Icon icon="zi-retry" /> : <Icon icon="zi-share" />}
      </Box>
    );
  }

  // Icon-only variant
  if (variant === 'icon') {
    return (
      <Box
        className={className}
        flex
        alignItems="center"
        justifyContent="center"
        onClick={handleShare}
        style={{
          width: 40,
          height: 40,
          borderRadius: 999,
          background: 'var(--zaui-light-button-secondary-neutral-background, #e9ebed)',
        }}
      >
        {loading ? <Icon icon="zi-retry" /> : <Icon icon="zi-share" />}
      </Box>
    );
  }

  // Default button variant
  return (
    <Button className={className} variant="secondary" onClick={handleShare} loading={loading}>
      <Box flex alignItems="center" style={{ gap: 8 }}>
        <Icon icon="zi-share" />
        <Text>{label}</Text>
      </Box>
    </Button>
  );
};

export default ShareButton;
