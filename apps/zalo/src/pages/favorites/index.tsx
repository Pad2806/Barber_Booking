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
        <Page style={{ background: 'var(--brand-background)' }}>
            <Header title="SALON YÊU THÍCH" showBackIcon onBackClick={() => navigate(-1)} />
            <Box style={{ height: 44 }} />
            
            {loading ? (
                <Box p={4} flex justifyContent="center" alignItems="center" style={{ height: '80vh' }}>
                    <Spinner visible />
                </Box>
            ) : favorites.length > 0 ? (
                <Box p={4}>
                    {favorites.map((salon) => (
                        <Box
                           key={salon.id}
                           p={4}
                           mb={4}
                           onClick={() => navigate(`/salon-detail?id=${salon.id}`)}
                           style={{
                               background: 'var(--brand-background)',
                               borderRadius: 32,
                               border: '1px solid var(--brand-border)',
                               boxShadow: '0 8px 16px rgba(0,0,0,0.03)',
                               display: 'flex',
                               alignItems: 'center',
                               gap: 16
                           }}
                        >
                            <Box style={{ width: 64, height: 64, borderRadius: 24, overflow: 'hidden', border: '1px solid var(--brand-border)' }}>
                                <img 
                                    src={salon.coverImage || salon.images?.[0] || 'https://images.unsplash.com/photo-1585747860019-8e2e0c35c0e1?w=100&h=100&fit=crop'} 
                                    alt={salon.name} 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(0.3)' }} 
                                />
                            </Box>
                            <Box style={{ flex: 1 }}>
                                <Text style={{ fontSize: 16, fontWeight: 900, color: 'var(--brand-secondary)', textTransform: 'uppercase' }}>{salon.name}</Text>
                                <Text style={{ fontSize: 11, fontWeight: 700, opacity: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>{salon.address}</Text>
                            </Box>
                            <Box onClick={(e: any) => handleRemove(e, salon.id)} p={2}>
                                <Icon icon="zi-heart-solid" style={{ color: '#e94560', fontSize: 24 }} />
                            </Box>
                        </Box>
                    ))}
                </Box>
            ) : (
                <Box p={8} flex flexDirection="column" alignItems="center" justifyContent="center" style={{ minHeight: '70vh', textAlign: 'center' }}>
                    <Box 
                        flex 
                        alignItems="center" 
                        justifyContent="center" 
                        style={{ 
                            width: 100, 
                            height: 100, 
                            borderRadius: 32, 
                            background: 'var(--brand-muted)',
                            marginBottom: 24
                        }}
                    >
                        <Icon icon="zi-heart" style={{ opacity: 0.2, fontSize: 48, color: 'var(--brand-secondary)' }} />
                    </Box>
                    <Text style={{ fontSize: 18, fontWeight: 900, color: 'var(--brand-secondary)', textTransform: 'uppercase' }}>DANH SÁCH TRỐNG</Text>
                    <Text style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', opacity: 0.4, marginTop: 8 }}>QUÝ KHÁCH CHƯA CÓ SALON YÊU THÍCH NÀO</Text>
                    <Box mt={8} style={{ width: '100%', maxWidth: 240 }}>
                        <Button 
                            fullWidth 
                            onClick={() => navigate('/salons')}
                            style={{
                                height: 56,
                                borderRadius: 28,
                                background: 'var(--brand-primary)',
                                color: 'var(--brand-background)',
                                fontWeight: 900,
                                fontSize: 13,
                                letterSpacing: 1
                            }}
                        >
                            KHÁM PHÁ NGAY
                        </Button>
                    </Box>
                </Box>
            )}
        </Page>
    );
};

export default FavoritesPage;
