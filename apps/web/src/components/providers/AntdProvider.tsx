'use client';

import React from 'react';
import { ConfigProvider, App } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import theme from '@/theme/themeConfig';

interface AntdProviderProps {
  children: React.ReactNode;
}

export function AntdProvider({ children }: AntdProviderProps) {
  return (
    <AntdRegistry>
      <ConfigProvider theme={theme} locale={viVN}>
        <App>{children}</App>
      </ConfigProvider>
    </AntdRegistry>
  );
}
