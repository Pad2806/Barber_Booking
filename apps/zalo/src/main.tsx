import React from 'react';
import { createRoot } from 'react-dom/client';
import 'zmp-ui/zaui.css';
import './styles/global.css';
import App from './app';

const container = document.getElementById('app');

if (container) {
  const root = createRoot(container);
  root.render(<App />);
} else {
  console.error('Root element #app not found');
}
