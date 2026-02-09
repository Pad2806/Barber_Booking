import type { ThemeConfig } from 'antd';

// Theme config inspired by 30Shine style
const theme: ThemeConfig = {
  token: {
    // Primary colors - Dark blue like 30Shine
    colorPrimary: '#1a3c6e',
    colorPrimaryHover: '#2a5090',
    colorPrimaryActive: '#0f2847',
    
    // Link colors
    colorLink: '#1a3c6e',
    colorLinkHover: '#f5a623',
    
    // Success/Warning/Error
    colorSuccess: '#52c41a',
    colorWarning: '#f5a623',
    colorError: '#ff4d4f',
    
    // Background
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f5f5f5',
    
    // Border radius
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
    
    // Font
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontSize: 14,
    
    // Sizing
    controlHeight: 40,
    controlHeightLG: 48,
    controlHeightSM: 32,
  },
  components: {
    Button: {
      colorPrimary: '#f5a623',
      colorPrimaryHover: '#d4910e',
      colorPrimaryActive: '#b37a0a',
      algorithm: true,
      primaryShadow: '0 2px 8px rgba(245, 166, 35, 0.35)',
    },
    Menu: {
      itemColor: '#333333',
      itemHoverColor: '#1a3c6e',
      itemSelectedColor: '#1a3c6e',
    },
    Card: {
      borderRadiusLG: 12,
    },
    Input: {
      borderRadius: 8,
    },
    Select: {
      borderRadius: 8,
    },
  },
};

export default theme;
