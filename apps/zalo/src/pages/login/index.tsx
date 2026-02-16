import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Page, Box, Text, Button, Icon, Header, Spinner } from 'zmp-ui';
import { useAuth } from '../../providers/AuthProvider';
import { BRAND } from '../../config';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading, login, loginWithPassword } = useAuth();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const returnTo = useMemo(() => {
    const raw = searchParams.get('returnTo');
    if (!raw) return '/';
    // only allow internal navigation
    if (raw.startsWith('/')) return raw;
    return '/';
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(returnTo, { replace: true });
    }
  }, [isAuthenticated, navigate, returnTo]);

  const handleZaloLogin = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await login();
      navigate(returnTo, { replace: true });
    } catch (e: any) {
      const message =
        e?.response?.data?.message || e?.message || 'Đăng nhập Zalo thất bại.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordLogin = async () => {
    if (!phone || !password) {
      setError('Vui lòng nhập số điện thoại và mật khẩu');
      return;
    }
    
    setError(null);
    setSubmitting(true);
    try {
      await loginWithPassword({ phone, password });
      navigate(returnTo, { replace: true });
    } catch (e: any) {
      const message =
        e?.response?.data?.message || e?.message || 'Đăng nhập thất bại.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const busy = submitting || isLoading;

  return (
    <Page style={{ background: 'var(--zaui-light-body-background-color, #e9ebed)' }}>
      <Header
        title="Đăng nhập"
        showBackIcon={location.key !== 'default'}
        onBackClick={() => navigate(-1)}
      />
      <Box style={{ height: 44 }} />

      <Box
        flex
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        p={4}
        style={{ minHeight: '80vh' }}
      >
        <Box
          flex
          alignItems="center"
          justifyContent="center"
          style={{
            width: 80,
            height: 80,
            borderRadius: 999,
            background: 'var(--zaui-light-button-secondary-neutral-background, #e9ebed)',
            marginBottom: 24,
          }}
        >
          <Icon icon="zi-user" size={32} />
        </Box>

        <Text.Title size="large">Chào mừng quay lại</Text.Title>
        <Box mt={2} mb={6}>
          <Text size="small" style={{ opacity: 0.75 }}>
            Quản lý lịch hẹn và nhận ưu đãi
          </Text>
        </Box>

        {error && (
          <Box mb={4} p={3} style={{ background: '#fee2e2', borderRadius: 8, width: '100%' }}>
            <Text size="xSmall" style={{ color: '#ef4444' }}>{error}</Text>
          </Box>
        )}

        <Box style={{ width: '100%', maxWidth: 360 }}>
          <div className="zaui-input-group" style={{ marginBottom: 16 }}>
            <input 
              type="tel"
              className="zaui-input"
              placeholder="Số điện thoại"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={busy}
              style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid #ddd' }}
            />
          </div>
          
          <div className="zaui-input-group" style={{ marginBottom: 24 }}>
            <input 
              type="password"
              className="zaui-input"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
              style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid #ddd' }}
            />
          </div>

          <Button fullWidth onClick={handlePasswordLogin} disabled={busy} size="large">
            {busy ? <Spinner visible /> : 'Đăng nhập'}
          </Button>
        </Box>
        
        <Box mt={6} flex alignItems="center" style={{ width: '100%', gap: 16 }}>
          <div style={{ height: 1, flex: 1, background: '#e0e0e0' }} />
          <Text size="xxSmall" style={{ color: '#888' }}>HOẶC</Text>
          <div style={{ height: 1, flex: 1, background: '#e0e0e0' }} />
        </Box>

        <Box mt={6} style={{ width: '100%', maxWidth: 360 }}>
          <Button 
            fullWidth 
            variant="secondary" 
            onClick={handleZaloLogin} 
            disabled={busy}
            prefixIcon={<Icon icon="zi-chat" />}
          >
            Đăng nhập với Zalo
          </Button>
        </Box>

        <Box mt={8} flex flexDirection="column" alignItems="center" style={{ gap: 12 }}>
          <Box flex alignItems="center" style={{ gap: 4 }}>
            <Text size="small">Chưa có tài khoản?</Text>
            <Text 
              size="small" 
              className="color-primary" 
              style={{ fontWeight: 600, color: 'var(--zaui-light-button-primary-background)' }}
              onClick={() => navigate('/register')}
            >
              Đăng ký ngay
            </Text>
          </Box>
          
          <Text 
            size="small" 
            style={{ color: '#666' }}
            onClick={() => navigate('/', { replace: true })}
          >
            Để sau, xem trang chủ
          </Text>
        </Box>
      </Box>
    </Page>
  );
};

export default LoginPage;
