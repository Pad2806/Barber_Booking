import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const AuthEventListener: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handler = () => {
      const returnTo = `${location.pathname}${location.search}`;
      navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`, { replace: true });
    };

    window.addEventListener('auth:required', handler);
    return () => window.removeEventListener('auth:required', handler);
  }, [location.pathname, location.search, navigate]);

  return null;
};

export default AuthEventListener;
