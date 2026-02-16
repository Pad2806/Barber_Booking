import React, { useState, useEffect } from 'react';
import { Page, Box, Text, Header, List, Icon, Button, Spinner, useSnackbar } from 'zmp-ui';
import { useNavigate } from 'react-router-dom';
import { getFavorites, removeFromFavorites, type FavoriteSalon } from '../../services/favorites.service';
import { type Salon } from '../../services/salon.service';

const FavoritesPage: React.FC = () => {
    const navigate = useNavigate();
    const { openSnackbar } = useSnackbar();
    const [favorites, setFavorites] = useState<Salon[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchFavorites = async () => {
        setLoading(true);
        try {
            const res = await getFavorites();
            setFavorites(res.data.data);
        } catch (error) {
            console.error('Failed to fetch favorites', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFavorites();
    }, []);

    const handleRemove = async (e: React.MouseEvent, salonId: string) => {
        e.stopPropagation();
        try {
            await removeFromFavorites(salonId);
            setFavorites(prev => prev.filter(s => s.id !== salonId));
            openSnackbar({
                text: 'Đã xóa khỏi danh sách yêu thích',
                type: 'success',
            });
        } catch (error) {
            openSnackbar({
                text: 'Xóa thất bại',
                type: 'error',
            });
        }
    };

    return (
        <Page style={{ background: '#f5f5f5' }}>
            <Header title="Salon yêu thích" showBackIcon onBackClick={() => navigate(-1)} />
            <Box style={{ height: 44 }} />
            
            {loading ? (
                <Box p={4} flex justifyContent="center" alignItems="center" style={{ height: '80vh' }}>
                    <Spinner visible />
                </Box>
            ) : favorites.length > 0 ? (
                <Box p={4}>
                    <List>
                        {favorites.map((salon) => (
                            <List.Item
                                key={salon.id}
                                prefix={
                                    <Box style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', marginRight: 12 }}>
                                        <img 
                                            src={salon.coverImage || salon.images?.[0] || 'https://images.unsplash.com/photo-1585747860019-8e2e0c35c0e1?w=100&h=100&fit=crop'} 
                                            alt={salon.name} 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                        />
                                    </Box>
                                }
                                title={salon.name}
                                subTitle={salon.address}
                                suffix={
                                    <Box onClick={(e: any) => handleRemove(e, salon.id)}>
                                        <Icon icon="zi-heart-solid" style={{ color: '#e94560' }} />
                                    </Box>
                                }
                                onClick={() => navigate(`/salon-detail?id=${salon.id}`)}
                            />
                        ))}
                    </List>
                </Box>
            ) : (
                <Box p={6} flex flexDirection="column" alignItems="center" justifyContent="center" style={{ minHeight: '60vh' }}>
                    <Icon icon="zi-heart" size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                    <Text size="small" style={{ opacity: 0.5 }}>Chưa có salon yêu thích</Text>
                    <Box mt={4}>
                        <Button size="small" onClick={() => navigate('/salons')}>Khám phá ngay</Button>
                    </Box>
                </Box>
            )}
        </Page>
    );
};

export default FavoritesPage;
