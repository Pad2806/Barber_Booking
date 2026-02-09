import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Page, Box, Text, Button, Icon, Header, Spinner } from 'zmp-ui';
import { useAuth } from '../../providers/AuthProvider';
import { BRAND } from '../../config';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading, login } = useAuth();

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

  const handleLogin = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await login();
      navigate(returnTo, { replace: true });
    } catch (e: any) {
      const message = e?.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
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
        onBackClick={() => {
          // if user came from another page, go back; otherwise go home
          if (location.key !== 'default') navigate(-1);
          else navigate('/', { replace: true });
        }}
      />

      <Box
        flex
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        p={6}
        style={{ minHeight: '65vh', textAlign: 'center' }}
      >
        <Box
          flex
          alignItems="center"
          justifyContent="center"
          style={{
            width: 96,
            height: 96,
            borderRadius: 999,
            background: 'var(--zaui-light-button-secondary-neutral-background, #e9ebed)',
            marginBottom: 16,
          }}
        >
          <Icon icon="zi-user" />
        </Box>

        <Text.Title size="large">Chào mừng đến {BRAND.name}</Text.Title>
        <Box mt={2}>
          <Text size="small" style={{ opacity: 0.75 }}>
            Đăng nhập để quản lý lịch hẹn và nhận ưu đãi
          </Text>
        </Box>

        {error && (
          <Box mt={3} style={{ maxWidth: 360 }}>
            <Text size="xxSmall" style={{ color: 'var(--zaui-light-color-danger, #ef4444)' }}>
              {error}
            </Text>
          </Box>
        )}

        <Box mt={4} style={{ width: '100%', maxWidth: 320 }}>
          <Button fullWidth onClick={handleLogin} disabled={busy}>
            {busy ? (
              <Box flex alignItems="center" justifyContent="center" style={{ gap: 8 }}>
                <Spinner visible />
                <Text style={{ color: '#fff' }}>Đang đăng nhập…</Text>
              </Box>
            ) : (
              'Đăng nhập với Zalo'
            )}
          </Button>
        </Box>

        <Box mt={3} style={{ width: '100%', maxWidth: 320 }}>
          <Button
            fullWidth
            variant="secondary"
            type="neutral"
            onClick={() => navigate('/', { replace: true })}
            disabled={busy}
          >
            Để sau
          </Button>
        </Box>
      </Box>
    </Page>
  );
};

export default LoginPage;
