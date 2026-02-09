import React from 'react';
import { Box, Text, Spinner } from 'zmp-ui';

interface LoadingSpinnerProps {
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ className = '' }) => {
  return (
    <Box
      className={className}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Spinner />
    </Box>
  );
};

export const PageLoading: React.FC = () => {
  return (
    <Box
      flex
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      style={{ minHeight: 220, gap: 12 }}
    >
      <Spinner />
      <Text size="small" style={{ opacity: 0.7 }}>
        Đang tải...
      </Text>
    </Box>
  );
};

export const FullPageLoading: React.FC = () => {
  return (
    <Box
      flex
      alignItems="center"
      justifyContent="center"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--zaui-light-header-background-color, #fff)',
        zIndex: 50,
      }}
    >
      <Box flex flexDirection="column" alignItems="center" style={{ gap: 16 }}>
        <Spinner />
        <Text size="small" style={{ opacity: 0.8 }}>
          Đang tải...
        </Text>
      </Box>
    </Box>
  );
};
