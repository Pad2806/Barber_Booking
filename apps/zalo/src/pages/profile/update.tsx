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
    <Page style={{ background: 'var(--zaui-light-body-background-color, #e9ebed)' }}>
      <Header title="Cập nhật thông tin" showBackIcon onBackClick={() => navigate(-1)} />
      <Box style={{ height: 44 }} />

      {/* Avatar Section */}
      <Box p={4} flex flexDirection="column" alignItems="center" style={{ background: '#fff', paddingBottom: 24 }}>
        <Box style={{ position: 'relative' }}>
          <Avatar size={96} src={avatarUrl || ''}>
            {user?.name?.charAt(0) || '?'}
          </Avatar>
          <Box
            flex
            alignItems="center"
            justifyContent="center"
            onClick={() => !uploading && fileInputRef.current?.click()}
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 32,
              height: 32,
              borderRadius: 999,
              background: 'var(--zaui-light-color-primary, var(--brand-accent))',
              border: '2px solid #fff',
              cursor: 'pointer',
            }}
          >
            {uploading ? (
              <Box
                style={{
                  width: 14,
                  height: 14,
                  border: '2px solid #fff',
                  borderTopColor: 'transparent',
                  borderRadius: 999,
                  animation: 'spin 0.8s linear infinite',
                }}
              />
            ) : (
              <Icon icon="zi-camera" style={{ color: '#fff', fontSize: 16 }} />
            )}
          </Box>
        </Box>
        <Text size="xSmall" style={{ marginTop: 8, opacity: 0.6 }}>
          Nhấn vào biểu tượng máy ảnh để đổi avatar
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
      <Box p={4} mt={3} style={{ background: '#fff' }}>
        <Text.Title size="small" style={{ marginBottom: 12 }}>Thông tin cá nhân</Text.Title>
        <Box mb={4}>
          <Text size="xSmall" style={{ marginBottom: 4, opacity: 0.7 }}>Họ và tên</Text>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nhập họ và tên của bạn"
          />
        </Box>
        <Box mb={4}>
          <Text size="xSmall" style={{ marginBottom: 4, opacity: 0.7 }}>Số điện thoại</Text>
          <Input
            value={user?.phone || ''}
            disabled
            placeholder="Số điện thoại"
          />
          <Text size="xxSmall" style={{ marginTop: 4, opacity: 0.5, fontStyle: 'italic' }}>
            Không thể thay đổi số điện thoại đăng ký
          </Text>
        </Box>
      </Box>

      <Box p={4} mt={4}>
        <Button fullWidth onClick={handleUpdate} loading={loading} disabled={uploading}>
          Lưu thay đổi
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
