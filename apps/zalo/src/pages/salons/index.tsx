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
    <Page style={{ background: 'var(--zaui-light-body-background-color, #e9ebed)' }}>
      <Header title="Salon" showBackIcon={false} />
      {/* Search */}
      <Box
        p={4}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'var(--zaui-light-header-background-color, #fff)',
        }}
      >
        <Input
          placeholder="Tìm kiếm salon..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onBlur={handleSearch}
        />
      </Box>

      {/* Salon List */}
      <Box p={4}>
        {loading ? (
          <PageLoading />
        ) : salons.length === 0 ? (
          <EmptyState
            icon="zi-search"
            title="Không tìm thấy salon"
            description="Thử tìm kiếm với từ khóa khác"
          />
        ) : (
          salons.map((salon, index) => (
            <Box
              key={salon.id}
              className="animate-slide-up"
              p={0}
              mt={index === 0 ? 0 : 3}
              style={{
                animationDelay: `${index * 0.05}s`,
                background: 'var(--zaui-light-header-background-color, #fff)',
                borderRadius: 16,
                border: '1px solid var(--zaui-light-header-divider, #e9ebed)',
                overflow: 'hidden',
              }}
              onClick={() => navigate(`/salon-detail?id=${salon.id}`)}
            >
              {/* Cover Image */}
              <Box style={{ position: 'relative', height: 140 }}>
                <img
                  src={salon.coverImage || '/assets/images/default-salon.jpg'}
                  alt={salon.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {salon.logo && (
                  <Box
                    style={{
                      position: 'absolute',
                      left: 16,
                      bottom: -24,
                      width: 56,
                      height: 56,
                      borderRadius: 12,
                      overflow: 'hidden',
                      border: '2px solid #fff',
                      background: '#fff',
                    }}
                  >
                    <img
                      src={salon.logo}
                      alt={salon.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Box>
                )}
              </Box>

              {/* Salon Info */}
              <Box p={4} pt={salon.logo ? 8 : 4}>
                <Text.Title size="normal">{salon.name}</Text.Title>
                <Box mt={1}>
                  <Box flex alignItems="center" style={{ gap: 8 }}>
                    <Icon icon="zi-location" />
                    <Text size="small" style={{ opacity: 0.75 }}>
                      {salon.address}, {salon.district}, {salon.city}
                    </Text>
                  </Box>
                </Box>

                <Box flex alignItems="center" justifyContent="space-between" mt={3}>
                  <Box flex alignItems="center" style={{ gap: 8 }}>
                    <Box
                      flex
                      alignItems="center"
                      style={{
                        gap: 4,
                        padding: '4px 8px',
                        borderRadius: 10,
                        background:
                          'var(--zaui-light-button-secondary-neutral-background, #e9ebed)',
                      }}
                    >
                      <Icon icon="zi-star" />
                      <Text size="xSmall" bold>
                        {salon.rating?.toFixed(1) || '5.0'}
                      </Text>
                    </Box>
                    <Text size="xxSmall" style={{ opacity: 0.6 }}>
                      ({salon.totalReviews || 0} đánh giá)
                    </Text>
                  </Box>

                  <Box
                    flex
                    alignItems="center"
                    style={{
                      gap: 6,
                      padding: '4px 8px',
                      borderRadius: 10,
                      background: 'var(--zaui-light-button-secondary-neutral-background, #e9ebed)',
                    }}
                  >
                    <Icon icon="zi-clock-1" />
                    <Text size="xxSmall" bold>
                      {salon.openTime} - {salon.closeTime}
                    </Text>
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
