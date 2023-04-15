import React from 'react';
import ReactDOM from 'react-dom/client';
import Layout from './pages/layout';
import './styles/main.css';
// antd样式
import 'antd/dist/antd';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <Layout />
  </React.StrictMode>
);