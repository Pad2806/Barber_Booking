import React, { useState } from 'react';
import { Page, Box, Text, Button, Input, Header, useSnackbar, Avatar } from 'zmp-ui';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';

const UpdateProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Assuming updateProfile exists in AuthContext, if not need to add it or use API directly.
  const { openSnackbar } = useSnackbar();

  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!name.trim()) {
      openSnackbar({
        text: 'Vui lòng nhập họ tên',
        type: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement update profile logic here
      // const updatedUser = await updateProfile({ name });
      // For now, simulate success
      openSnackbar({
        text: 'Cập nhật thông tin thành công',
        type: 'success',
      });
      navigate(-1);
    } catch (error) {
      console.error('Update failed:', error);
      openSnackbar({
        text: 'Cập nhật thất bại. Vui lòng thử lại.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page style={{ background: 'var(--zaui-light-body-background-color, #e9ebed)' }}>
      <Header title="Cập nhật thông tin" showBackIcon onBackClick={() => navigate(-1)} />
      <Box style={{ height: 44 }} />
      
      <Box p={4} flex justifyContent="center" style={{ background: '#fff', paddingBottom: 24 }}>
        <Box style={{ position: 'relative' }}>
          <Avatar size={96} src={user?.avatar || ''}>
            {user?.name?.charAt(0) || '?'}
          </Avatar>
          {/* Edit avatar button could go here */}
        </Box>
      </Box>

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
        <Button fullWidth onClick={handleUpdate} loading={loading}>
          Lưu thay đổi
        </Button>
      </Box>
    </Page>
  );
};

export default UpdateProfilePage;
