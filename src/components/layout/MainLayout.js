import React from 'react';
import { Layout, Menu, Button, Space, Typography } from 'antd';
import {
  LogoutOutlined,
  CalculatorOutlined,
  SwapOutlined,
  FileTextOutlined,
  HomeOutlined,
  DollarCircleOutlined, // Novo ícone
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import favicon from '../../assets/icon.png';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

const MainLayout = ({ children, onMenuClick, onHomeClick, activeKey, showSider }) => {
  const { logout, hasPermission } = useAuth();

  const menuItems = [
    hasPermission('analise-icms') && {
      key: 'analise-icms',
      icon: <CalculatorOutlined />,
      label: 'Análise de ICMS',
    },
    hasPermission('analise-ipi-st') && {
      key: 'analise-ipi-st',
      icon: <FileTextOutlined />,
      label: 'Análise IPI/ST',
    },
    hasPermission('converter-francesinha') && {
      key: 'converter-francesinha',
      icon: <SwapOutlined />,
      label: 'Conversor Francesinha',
    },
    // NOVO ITEM DE MENU
    hasPermission('converter-receitas-acisa') && {
      key: 'converter-receitas-acisa',
      icon: <DollarCircleOutlined />,
      label: 'Conversor Receitas Acisa',
    },
  ].filter(Boolean);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px', background: '#001529' }}>
        <Space>
          <img src={favicon} alt="icon active" style={{ height: '50px', marginRight: '8px', cursor: 'pointer' }} onClick={onHomeClick} />
          <Title level={4} style={{ color: 'white', margin: 0 }}>
            Web-Services Contábeis
          </Title>
        </Space>
        <Space>
          {showSider && (
            <Button icon={<HomeOutlined />} onClick={onHomeClick}>
              Início
            </Button>
          )}
          <Button icon={<LogoutOutlined />} onClick={logout}>
            Sair
          </Button>
        </Space>
      </Header>
      <Layout>
        {showSider && (
          <Sider width={250} theme="dark">
            <Menu
              mode="inline"
              theme="dark"
              selectedKeys={[activeKey]}
              onClick={({ key }) => onMenuClick(key)}
              items={menuItems}
            />
          </Sider>
        )}
        <Layout>
          <Content style={{ padding: '24px', margin: 0, minHeight: 280, background: '#f0f2f5' }}>
            {children}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default MainLayout;