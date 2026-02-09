/**
 * Follow Official Account Prompt Component
 *
 * Prompts user to follow the salon's Zalo Official Account
 * to receive booking notifications
 */

import React, { useState } from 'react';
import { Box, Text, Button, Icon } from 'zmp-ui';
import { promptFollowOA } from '../../services/notification.service';

interface FollowOAPromptProps {
  onClose?: () => void;
  onFollowed?: () => void;
  variant?: 'card' | 'banner' | 'modal';
}

export const FollowOAPrompt: React.FC<FollowOAPromptProps> = ({
  onClose,
  onFollowed,
  variant = 'card',
}) => {
  const [loading, setLoading] = useState(false);
  const [followed, setFollowed] = useState(false);

  const handleFollow = async () => {
    setLoading(true);
    try {
      const success = await promptFollowOA();
      if (success) {
        setFollowed(true);
        onFollowed?.();
      }
    } finally {
      setLoading(false);
    }
  };

  if (followed) {
    return (
      <Box
        p={variant === 'card' ? 4 : 3}
        style={{
          background: 'var(--zaui-light-button-secondary-background, #d6e9ff)',
          borderRadius: variant === 'card' ? 16 : 0,
        }}
      >
        <Box flex alignItems="center" style={{ gap: 12 }}>
          <Icon icon="zi-check" />
          <Box style={{ flex: 1 }}>
            <Text bold>Đã theo dõi!</Text>
            <Text size="small" style={{ opacity: 0.75 }}>
              Bạn sẽ nhận thông báo về lịch hẹn qua Zalo
            </Text>
          </Box>
        </Box>
      </Box>
    );
  }

  if (variant === 'banner') {
    return (
      <Box
        p={3}
        style={{
          background:
            'linear-gradient(90deg, var(--brand-secondary) 0%, var(--brand-primary) 100%)',
        }}
      >
        <Box flex alignItems="center" style={{ gap: 12 }}>
          <Icon icon="zi-notif" />
          <Box style={{ flex: 1 }}>
            <Text size="small" style={{ color: '#fff', opacity: 0.9 }}>
              Theo dõi để nhận thông báo lịch hẹn
            </Text>
          </Box>
          <Button size="small" variant="secondary" onClick={handleFollow} loading={loading}>
            Theo dõi
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      p={4}
      style={{
        background: 'var(--zaui-light-header-background-color, #ffffff)',
        borderRadius: 16,
        border: '1px solid var(--zaui-light-header-divider, #e9ebed)',
      }}
    >
      <Box flex alignItems="flex-start" style={{ gap: 12 }}>
        <Box
          flex
          alignItems="center"
          justifyContent="center"
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            background: 'var(--zaui-light-button-secondary-background, #d6e9ff)',
            flexShrink: 0,
          }}
        >
          <Icon icon="zi-notif" />
        </Box>
        <Box style={{ flex: 1 }}>
          <Text bold>Nhận thông báo qua Zalo</Text>
          <Box mt={1}>
            <Text size="small" style={{ opacity: 0.75 }}>
              Theo dõi Official Account để nhận nhắc lịch, cập nhật đặt lịch và ưu đãi độc quyền
            </Text>
          </Box>
          <Box flex mt={3} style={{ gap: 8 }}>
            <Button onClick={handleFollow} loading={loading}>
              Theo dõi ngay
            </Button>
            {onClose && (
              <Button variant="tertiary" type="neutral" onClick={onClose}>
                Để sau
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default FollowOAPrompt;
