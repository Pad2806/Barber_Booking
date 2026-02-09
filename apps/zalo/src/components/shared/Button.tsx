import React from 'react';
import { Button as ZauiButton } from 'zmp-ui';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  className = '',
  type = 'button',
}) => {
  return (
    <ZauiButton
      className={className}
      fullWidth={fullWidth}
      disabled={disabled}
      loading={loading}
      onClick={onClick}
      htmlType={type}
      variant={variant === 'ghost' || variant === 'outline' ? 'tertiary' : 'primary'}
      type={variant === 'danger' ? 'danger' : variant === 'secondary' ? 'neutral' : 'highlight'}
      size={size === 'lg' ? 'large' : size === 'sm' ? 'small' : 'medium'}
    >
      {children}
    </ZauiButton>
  );
};
