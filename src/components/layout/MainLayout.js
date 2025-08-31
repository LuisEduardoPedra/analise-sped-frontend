import React from 'react';
import { Layout, Menu, Button, Space, Typography } from 'antd';
import {
  LogoutOutlined,
  CalculatorOutlined,
  SwapOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import favicon from '../../assets/icon.png';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

const MainLayout = ({ children, onMenuClick }) => {
  const { logout, hasPermission } = useAuth();

  // Define os itens do menu e suas permissões necessárias
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
  ].filter(Boolean); // Filtra itens falsos (caso não tenha permissão)

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px', background: '#001529' }}>
        <Space>
          <img src={favicon} alt="icon active" style={{ height: '50px', marginRight: '8px' }} />
          <Title level={4} style={{ color: 'white', margin: 0 }}>
            Web-Services Contábeis
          </Title>
        </Space>
        <Button icon={<LogoutOutlined />} onClick={logout}>
          Sair
        </Button>
      </Header>
      <Layout>
        <Sider width={250} theme="dark">
          <Menu
            mode="inline"
            theme="dark"
            defaultSelectedKeys={['analise-icms']}
            onClick={({ key }) => onMenuClick(key)}
            items={menuItems}
          />
        </Sider>
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