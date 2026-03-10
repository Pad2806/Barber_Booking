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
      p={8}
      style={{ textAlign: 'center', minHeight: 280 }}
    >
      <Box 
        mb={6}
        flex
        alignItems="center"
        justifyContent="center"
        style={{ 
            width: 80, 
            height: 80, 
            borderRadius: 24, 
            background: 'var(--brand-secondary)',
            border: '2px solid var(--brand-primary)',
            boxShadow: '0 16px 32px rgba(165, 124, 82, 0.2)'
        }}
      >
        <Icon icon={icon as any} style={{ color: 'var(--brand-primary)', fontSize: 32 }} />
      </Box>
      <Text style={{ fontSize: 18, fontWeight: 900, color: 'var(--brand-secondary)', textTransform: 'uppercase' }}>{title}</Text>
      {description && (
        <Box mt={3} style={{ maxWidth: 280 }}>
          <Text
            style={{ fontSize: 11, fontWeight: 700, opacity: 0.5, textTransform: 'uppercase', letterSpacing: 1 }}
          >
            {description}
          </Text>
        </Box>
      )}
      {action && <Box mt={6}>{action}</Box>}
    </Box>
  );
};

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'ĐÃ CÓ LỖI XẢY RA',
  message = 'VUI LÒNG THỬ LẠI SAU',
  onRetry,
}) => {
  return (
    <Box
      flex
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      p={8}
      style={{ textAlign: 'center', minHeight: 300 }}
    >
      <Box 
        mb={6}
        flex
        alignItems="center"
        justifyContent="center"
        style={{ 
            width: 80, 
            height: 80, 
            borderRadius: 24, 
            background: 'rgba(239, 68, 68, 0.1)',
            border: '2px solid #ef4444',
            boxShadow: '0 16px 32px rgba(239, 68, 68, 0.1)'
        }}
      >
        <Icon icon="zi-warning" style={{ color: '#ef4444', fontSize: 32 }} />
      </Box>
      <Text style={{ fontSize: 18, fontWeight: 900, color: 'var(--brand-secondary)', textTransform: 'uppercase' }}>{title}</Text>
      <Box mt={3} style={{ maxWidth: 320 }}>
        <Text style={{ fontSize: 11, fontWeight: 700, opacity: 0.5, textTransform: 'uppercase' }}>
          {message}
        </Text>
      </Box>
      {onRetry && (
        <Box mt={8} style={{ width: '100%', maxWidth: 240 }}>
          <Button 
            fullWidth 
            onClick={onRetry}
            style={{ height: 56, borderRadius: 28, background: 'var(--brand-primary)', color: 'var(--brand-background)', fontWeight: 900, letterSpacing: 1 }}
          >
            THỬ LẠI
          </Button>
        </Box>
      )}
    </Box>
  );
};
