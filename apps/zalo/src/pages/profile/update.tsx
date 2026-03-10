import React, { useRef, useState } from 'react';
import { Page, Box, Text, Button, Input, Header, useSnackbar, Avatar, Icon } from 'zmp-ui';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import { uploadImage } from '../../services/upload.service';
import apiClient from '../../services/api';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const UpdateProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openSnackbar } = useSnackbar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      openSnackbar({ text: 'Chỉ hỗ trợ JPEG, PNG, WebP, GIF', type: 'error' });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      openSnackbar({ text: 'Dung lượng tối đa 10MB', type: 'error' });
      return;
    }

    try {
      setUploading(true);
      const result = await uploadImage(file, 'avatars');
      setAvatarUrl(result.url);
      openSnackbar({ text: 'Tải ảnh thành công!', type: 'success' });
    } catch (error) {
      console.error('Upload failed:', error);
      openSnackbar({ text: 'Tải ảnh thất bại', type: 'error' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUpdate = async () => {
    if (!name.trim()) {
      openSnackbar({ text: 'Vui lòng nhập họ tên', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      await apiClient.patch('/users/me', {
        name: name.trim(),
        ...(avatarUrl !== user?.avatar ? { avatar: avatarUrl || null } : {}),
      });
      openSnackbar({ text: 'Cập nhật thông tin thành công', type: 'success' });
      navigate(-1);
    } catch (error) {
      console.error('Update failed:', error);
      openSnackbar({ text: 'Cập nhật thất bại. Vui lòng thử lại.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page style={{ background: 'var(--brand-background)' }}>
      <Header title="CẬP NHẬT THÔNG TIN" showBackIcon onBackClick={() => navigate(-1)} />
      <Box style={{ height: 44 }} />

      {/* Avatar Section */}
      <Box p={8} flex flexDirection="column" alignItems="center" style={{ background: 'var(--brand-background)', borderBottom: '1px solid var(--brand-border)' }}>
        <Box style={{ position: 'relative' }}>
          <Box
            style={{
                width: 120,
                height: 120,
                borderRadius: 40,
                padding: 4,
                border: '2px solid var(--brand-primary)',
                background: 'var(--brand-background)',
                boxShadow: '0 16px 32px rgba(165, 124, 82, 0.2)'
            }}
          >
            <Avatar size={112} src={avatarUrl || ''} style={{ borderRadius: 36 }}>
                {user?.name?.charAt(0) || '?'}
            </Avatar>
          </Box>
          <Box
            flex
            alignItems="center"
            justifyContent="center"
            onClick={() => !uploading && fileInputRef.current?.click()}
            style={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              width: 40,
              height: 40,
              borderRadius: 14,
              background: 'var(--brand-secondary)',
              border: '2px solid var(--brand-background)',
              boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
              cursor: 'pointer',
              zIndex: 10
            }}
          >
            {uploading ? (
              <Box
                style={{
                  width: 18,
                  height: 18,
                  border: '2px solid var(--brand-primary)',
                  borderTopColor: 'transparent',
                  borderRadius: 999,
                  animation: 'spin 0.8s linear infinite',
                }}
              />
            ) : (
              <Icon icon="zi-camera" style={{ color: 'var(--brand-primary)', fontSize: 20 }} />
            )}
          </Box>
        </Box>
        <Text style={{ marginTop: 16, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', opacity: 0.4, letterSpacing: 1 }}>
          NHẤN VÀO MÁY ẢNH ĐỂ ĐỔI ẢNH ĐẠI DIỆN
        </Text>
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          onChange={handleAvatarUpload}
          style={{ display: 'none' }}
        />
      </Box>

      {/* Form  */}
      <Box p={6} mt={2}>
        <Text style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', color: 'var(--brand-secondary)', marginBottom: 20, letterSpacing: 1 }}>HỒ SƠ CÁ NHÂN</Text>
        
        <Box mb={6}>
          <Text style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', marginBottom: 8, opacity: 0.5 }}>HỌ VÀ TÊN</Text>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="NHẬP HỌ VÀ TÊN..."
            style={{
                height: 56,
                borderRadius: 24,
                background: 'var(--brand-background)',
                border: '1px solid var(--brand-border)',
                fontWeight: 700,
                fontSize: 14,
                color: 'var(--brand-secondary)'
            }}
          />
        </Box>

        <Box mb={6}>
          <Text style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', marginBottom: 8, opacity: 0.5 }}>SỐ ĐIỆN THOẠI</Text>
          <Input
            value={user?.phone || ''}
            disabled
            placeholder="SỐ ĐIỆN THOẠI"
            style={{
                height: 56,
                borderRadius: 24,
                background: 'var(--brand-muted)',
                border: '1px solid var(--brand-border)',
                fontWeight: 700,
                fontSize: 14,
                color: 'var(--brand-secondary)',
                opacity: 0.6
            }}
          />
          <Text style={{ marginTop: 8, fontSize: 9, fontWeight: 700, fontStyle: 'italic', opacity: 0.3, textTransform: 'uppercase' }}>
            KHÔNG THỂ THAY ĐỔI SỐ ĐIỆN THOẠI ĐÃ ĐĂNG KÝ
          </Text>
        </Box>
      </Box>

      <Box p={6} style={{ marginTop: 'auto' }}>
        <Button 
            fullWidth 
            onClick={handleUpdate} 
            loading={loading} 
            disabled={uploading}
            style={{
                height: 64,
                borderRadius: 32,
                background: 'var(--brand-primary)',
                color: 'var(--brand-background)',
                fontWeight: 900,
                fontSize: 15,
                letterSpacing: 2,
                boxShadow: '0 16px 32px rgba(165, 124, 82, 0.2)'
            }}
        >
          LƯU THAY ĐỔI
        </Button>
      </Box>

      {/* Spin animation for uploading indicator */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Page>
  );
};

export default UpdateProfilePage;
