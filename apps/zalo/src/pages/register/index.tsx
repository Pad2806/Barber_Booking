import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page, Box, Text, Button, Icon, Header, Spinner } from 'zmp-ui';
import { useAuth } from '../../providers/AuthProvider';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!name || !phone || !password || !confirmPassword) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu không khớp');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await register({
        name,
        phone,
        password,
      });
      navigate('/', { replace: true });
    } catch (e: any) {
      const message =
        e?.response?.data?.message || e?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const busy = submitting || isLoading;

  return (
    <Page style={{ background: 'var(--zaui-light-body-background-color, #e9ebed)' }}>
      <Header
        title="Đăng ký tài khoản"
        showBackIcon
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
          <Icon icon="zi-add-user" size={32} />
        </Box>

        <Text.Title size="large">Tạo tài khoản mới</Text.Title>
        <Box mt={2} mb={6}>
          <Text size="small" style={{ opacity: 0.75 }}>
            Điền thông tin để bắt đầu
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
              type="text"
              className="zaui-input"
              placeholder="Họ và tên"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={busy}
              style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid #ddd' }}
            />
          </div>

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
          
          <div className="zaui-input-group" style={{ marginBottom: 16 }}>
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

          <div className="zaui-input-group" style={{ marginBottom: 24 }}>
            <input 
              type="password"
              className="zaui-input"
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={busy}
              style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid #ddd' }}
            />
          </div>

          <Button fullWidth onClick={handleRegister} disabled={busy} size="large">
            {busy ? <Spinner visible /> : 'Đăng ký'}
          </Button>
        </Box>

        <Box mt={6} flex flexDirection="column" alignItems="center" style={{ gap: 12 }}>
          <Box flex alignItems="center" style={{ gap: 4 }}>
            <Text size="small">Đã có tài khoản?</Text>
            <Text 
              size="small" 
              className="color-primary" 
              style={{ fontWeight: 600, color: 'var(--zaui-light-button-primary-background)' }}
              onClick={() => navigate('/login')}
            >
              Đăng nhập ngay
            </Text>
          </Box>
        </Box>
      </Box>
    </Page>
  );
};

export default RegisterPage;
