import React from 'react';
import { Box, Text } from 'zmp-ui';
import { BOOKING_STATUS } from '../../config';

interface StatusBadgeProps {
  status: keyof typeof BOOKING_STATUS;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const { label, color } = BOOKING_STATUS[status] || { label: status, color: 'gray' };

  const palette: Record<string, { bg: string; fg: string }> = {
    yellow: {
      bg: 'var(--zaui-light-button-secondary-background, #d6e9ff)',
      fg: 'var(--zaui-light-text-color, #141415)',
    },
    blue: {
      bg: 'var(--zaui-light-button-secondary-background, #d6e9ff)',
      fg: 'var(--zaui-light-button-secondary-text, #006af5)',
    },
    indigo: {
      bg: 'var(--zaui-light-button-secondary-neutral-background, #e9ebed)',
      fg: 'var(--zaui-light-text-color, #141415)',
    },
    green: {
      bg: 'var(--zaui-light-button-secondary-background, #d6e9ff)',
      fg: 'var(--zaui-light-input-status-success-icon-color, #34b764)',
    },
    red: {
      bg: 'var(--zaui-light-button-secondary-danger-background, #fed8d7)',
      fg: 'var(--zaui-light-button-secondary-danger-text, #dc1f18)',
    },
    gray: {
      bg: 'var(--zaui-light-button-secondary-neutral-background, #e9ebed)',
      fg: 'var(--zaui-light-button-secondary-neutral-text, #141415)',
    },
  };

  const sizes = {
    sm: { px: 2, py: 1, text: 'xxSmall' as const },
    md: { px: 3, py: 1, text: 'xSmall' as const },
  };

  const chosen = palette[color] || palette.gray;
  const chosenSize = sizes[size];

  return (
    <Box
      inline
      px={chosenSize.px}
      py={chosenSize.py}
      style={{
        borderRadius: 999,
        background: chosen.bg,
      }}
    >
      <Text size={chosenSize.text} bold style={{ color: chosen.fg }}>
        {label}
      </Text>
    </Box>
  );
};
