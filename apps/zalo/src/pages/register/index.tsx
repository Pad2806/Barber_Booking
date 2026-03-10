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
    <Page style={{ background: 'var(--brand-background)' }}>
      <Header
        title="ĐĂNG KÝ"
        showBackIcon
        onBackClick={() => navigate(-1)}
      />
      <Box style={{ height: 44 }} />

      <Box
        flex
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        p={8}
        style={{ minHeight: '80vh' }}
      >
        <Box
          flex
          alignItems="center"
          justifyContent="center"
          style={{
            width: 96,
            height: 96,
            borderRadius: 32,
            background: 'var(--brand-secondary)',
            marginBottom: 32,
            border: '2px solid var(--brand-primary)',
            boxShadow: '0 16px 32px -8px rgba(0,0,0,0.2)'
          }}
        >
          <Icon icon="zi-add-user" size={32} style={{ color: 'var(--brand-primary)' }} />
        </Box>

        <Text style={{ fontSize: 24, fontWeight: 900, color: 'var(--brand-secondary)', textTransform: 'uppercase', letterSpacing: -1 }}>TẠO TÀI KHOẢN MỚI</Text>
        <Box mt={2} mb={10}>
          <Text style={{ fontSize: 10, fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: 2, fontStyle: 'italic', opacity: 0.6 }}>
            ĐIỀN THÔNG TIN ĐỂ BẮT ĐẦU TRẢI NGHIỆM
          </Text>
        </Box>

        {error && (
          <Box mb={6} p={4} style={{ background: 'rgba(239, 68, 68, 0.1)', borderRadius: 20, width: '100%', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', textAlign: 'center' }}>{error}</Text>
          </Box>
        )}

        <Box style={{ width: '100%', maxWidth: 360 }}>
          <div className="zaui-input-group" style={{ marginBottom: 12 }}>
            <input 
              type="text"
              className="zaui-input"
              placeholder="HỌ VÀ TÊN"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={busy}
              style={{ 
                width: '100%', 
                padding: '16px 20px', 
                borderRadius: 24, 
                border: '1px solid var(--brand-border)', 
                background: 'var(--brand-muted)',
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: 1,
                color: 'var(--brand-secondary)'
              }}
            />
          </div>

          <div className="zaui-input-group" style={{ marginBottom: 12 }}>
            <input 
              type="tel"
              className="zaui-input"
              placeholder="SỐ ĐIỆN THOẠI"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={busy}
              style={{ 
                width: '100%', 
                padding: '16px 20px', 
                borderRadius: 24, 
                border: '1px solid var(--brand-border)', 
                background: 'var(--brand-muted)',
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: 1,
                color: 'var(--brand-secondary)'
              }}
            />
          </div>
          
          <div className="zaui-input-group" style={{ marginBottom: 12 }}>
            <input 
              type="password"
              className="zaui-input"
              placeholder="MẬT KHẨU"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
              style={{ 
                width: '100%', 
                padding: '16px 20px', 
                borderRadius: 24, 
                border: '1px solid var(--brand-border)', 
                background: 'var(--brand-muted)',
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: 1,
                color: 'var(--brand-secondary)'
              }}
            />
          </div>

          <div className="zaui-input-group" style={{ marginBottom: 24 }}>
            <input 
              type="password"
              className="zaui-input"
              placeholder="NHẬP LẠI MẬT KHẨU"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={busy}
              style={{ 
                width: '100%', 
                padding: '16px 20px', 
                borderRadius: 24, 
                border: '1px solid var(--brand-border)', 
                background: 'var(--brand-muted)',
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: 1,
                color: 'var(--brand-secondary)'
              }}
            />
          </div>

          <Button 
            fullWidth 
            onClick={handleRegister} 
            disabled={busy} 
            size="large"
            style={{ height: 60, borderRadius: 30, fontWeight: 900, letterSpacing: 2, background: 'var(--brand-primary)', color: 'var(--brand-background)' }}
          >
            {busy ? <Spinner visible /> : 'ĐĂNG KÝ'}
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
