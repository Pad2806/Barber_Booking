import React from 'react';
import { Box, Text, Button, Icon } from 'zmp-ui';

interface EmptyStateProps {
  icon?: React.ComponentProps<typeof Icon>['icon'];
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'zi-inbox',
  title,
  description,
  action,
}) => {
  return (
    <Box
      flex
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      p={6}
      style={{ textAlign: 'center', minHeight: 220 }}
    >
      <Box mb={4}>
        <Icon icon={icon} />
      </Box>
      <Text.Title size="normal">{title}</Text.Title>
      {description && (
        <Box mt={2} style={{ maxWidth: 280 }}>
          <Text
            size="small"
            style={{ color: 'var(--zaui-light-text-color, #141415)', opacity: 0.7 }}
          >
            {description}
          </Text>
        </Box>
      )}
      {action && <Box mt={3}>{action}</Box>}
    </Box>
  );
};

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Đã có lỗi xảy ra',
  message = 'Vui lòng thử lại sau',
  onRetry,
}) => {
  return (
    <Box
      flex
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      p={6}
      style={{ textAlign: 'center', minHeight: 240 }}
    >
      <Box mb={4}>
        <Icon icon="zi-warning" />
      </Box>
      <Text.Title size="normal">{title}</Text.Title>
      <Box mt={2} style={{ maxWidth: 320 }}>
        <Text size="small" style={{ opacity: 0.75 }}>
          {message}
        </Text>
      </Box>
      {onRetry && (
        <Box mt={4} style={{ width: '100%' }}>
          <Button fullWidth onClick={onRetry}>
            Thử lại
          </Button>
        </Box>
      )}
    </Box>
  );
};
