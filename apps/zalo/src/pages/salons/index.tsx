import React, { useEffect, useState } from 'react';
import { Page, Box, Text, Input, Icon, Header } from 'zmp-ui';
import { useNavigate } from 'react-router-dom';
import { getSalons, type Salon } from '../../services/salon.service';
import { PageLoading, ErrorState, EmptyState } from '../../components/shared';

const SalonListPage: React.FC = () => {
  const navigate = useNavigate();
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchSalons();
  }, []);

  const fetchSalons = async () => {
    try {
      setLoading(true);
      const response = await getSalons({ search });
      setSalons(response.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchSalons();
  };

  if (error) {
    return <ErrorState message={error} onRetry={fetchSalons} />;
  }

  return (
    <Page style={{ background: 'var(--brand-background)' }}>
      <Header title="HỆ THỐNG SALON" showBackIcon={false} />
      <Box style={{ height: 44 }} />
      {/* Search Header - Vintage Styled */}
      <Box
        p={4}
        style={{
          position: 'sticky',
          top: 44,
          zIndex: 10,
          background: 'var(--brand-secondary)',
          borderBottom: '1px solid rgba(165, 124, 82, 0.2)',
          paddingBottom: 20
        }}
      >
        <Box style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: 24, padding: '4px 16px', display: 'flex', alignItems: 'center', gap: 12, border: '1px solid rgba(255, 255, 255, 0.1)' }}>
           <Icon icon="zi-search" style={{ color: 'var(--brand-primary)', opacity: 0.5 }} />
           <Input
            placeholder="TÌM KIẾM SALON..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onBlur={handleSearch}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--brand-background)', 
              fontWeight: 700, 
              fontSize: 13,
              letterSpacing: 1,
              width: '100%'
            }}
          />
        </Box>
      </Box>

      {/* Salon List - Vintage Cards */}
      <Box p={4} pb={10}>
        {loading ? (
          <PageLoading />
        ) : salons.length === 0 ? (
          <EmptyState
            icon="zi-search"
            title="KHÔNG TÌM THẤY"
            description="THỬ TÌM KIẾM VỚI TỪ KHÓA KHÁC"
          />
        ) : (
          salons.map((salon, index) => (
            <Box
              key={salon.id}
              className="animate-slide-up"
              p={0}
              mt={index === 0 ? 0 : 4}
              style={{
                animationDelay: `${index * 0.05}s`,
                background: 'var(--brand-background)',
                borderRadius: 40,
                border: '1px solid var(--brand-border)',
                overflow: 'hidden',
                boxShadow: '0 16px 32px -8px rgba(0,0,0,0.05)'
              }}
              onClick={() => navigate(`/salon-detail?id=${salon.id}`)}
            >
              {/* Cover Image with Filter */}
              <Box style={{ position: 'relative', height: 160 }}>
                <img
                  src={salon.coverImage || salon.images?.[0] || 'https://images.unsplash.com/photo-1585747860019-8e2e0c35c0e1?w=600&h=300&fit=crop'}
                  alt={salon.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(0.4) brightness(0.9)' }}
                />
                <Box style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(37, 24, 18, 0.6))' }} />
                
                {salon.logo && (
                  <Box
                    style={{
                      position: 'absolute',
                      left: 20,
                      bottom: -28,
                      width: 64,
                      height: 64,
                      borderRadius: 20,
                      overflow: 'hidden',
                      border: '3px solid var(--brand-background)',
                      background: 'var(--brand-background)',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                    }}
                  >
                    <img
                      src={salon.logo}
                      alt={salon.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(0.8)' }}
                    />
                  </Box>
                )}
              </Box>

              {/* Salon Info - Deep Mahogany & Gold */}
              <Box p={6} pt={10}>
                 <Text style={{ fontSize: 10, fontWeight: 800, color: 'var(--brand-primary)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>REETRO SALON NO.{index + 1}</Text>
                <Text style={{ fontSize: 22, color: 'var(--brand-secondary)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: -0.5, lineHeight: 1.2 }}>{salon.name}</Text>
                
                <Box mt={2}>
                  <Box flex alignItems="center" style={{ gap: 8 }}>
                    <Icon icon="zi-location" style={{ color: 'var(--brand-primary)', fontSize: 16 }} />
                    <Text style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.6 }}>
                      {salon.address}, {salon.district}, {salon.city}
                    </Text>
                  </Box>
                </Box>

                <Box flex alignItems="center" justifyContent="space-between" mt={4} pt={4} style={{ borderTop: '1px dashed var(--brand-border)' }}>
                  <Box flex alignItems="center" style={{ gap: 12 }}>
                    <Box
                      flex
                      alignItems="center"
                      style={{
                        gap: 4,
                        padding: '4px 10px',
                        borderRadius: 12,
                        background: 'var(--brand-primary)',
                        color: 'var(--brand-background)'
                      }}
                    >
                      <Icon icon="zi-star" style={{ fontSize: 12 }} />
                      <span style={{ fontSize: 11, fontWeight: 900 }}>
                        {salon.rating?.toFixed(1) || '5.0'}
                      </span>
                    </Box>
                    <Text style={{ fontSize: 9, opacity: 0.4, fontWeight: 800, textTransform: 'uppercase' }}>
                      ({salon.totalReviews || 0} REVIEWS)
                    </Text>
                  </Box>

                  <Box
                    flex
                    alignItems="center"
                    style={{
                      gap: 6,
                      padding: '4px 12px',
                      borderRadius: 12,
                      background: 'var(--brand-muted)',
                      border: '1px solid var(--brand-border)'
                    }}
                  >
                    <Icon icon="zi-clock-1" style={{ color: 'var(--brand-primary)', fontSize: 12 }} />
                    <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--brand-secondary)' }}>
                      {salon.openTime} - {salon.closeTime}
                    </span>
                  </Box>
                </Box>
              </Box>
            </Box>
          ))
        )}
      </Box>
    </Page>
  );
};

export default SalonListPage;
