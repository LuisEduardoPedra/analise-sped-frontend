import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, Alert, Layout } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

const { Title } = Typography;
const { Content } = Layout;

function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/'); // Navega para a rota raiz protegida
    }
  }, [isAuthenticated, navigate]);

  const onFinish = async (values) => {
    setError('');
    setLoading(true);
    try {
      await login(values.username, values.password);
      // A navegação agora é controlada pelo AuthContext e pela lógica do Dashboard
    } catch (err) {
      setError('Usuário ou senha inválidos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f0f2f5' }}>
      <Content>
        <Card style={{ width: 400, textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <img src={logo} alt="Logo da Active" style={{ maxWidth: '150px', marginBottom: '0px', filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.4))' }} />
          <Title level={2} style={{ marginTop: '10px' }}>Web-Services Contábeis</Title>
          <Typography.Paragraph type="secondary">
            Faça login para continuar
          </Typography.Paragraph>

          <Form name="login" onFinish={onFinish} layout="vertical" requiredMark={false}>
            <Form.Item name="username" rules={[{ required: true, message: 'Por favor, insira seu usuário!' }]}>
              <Input prefix={<UserOutlined />} placeholder="Usuário" size="large" />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: 'Por favor, insira sua senha!' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="Senha" size="large" />
            </Form.Item>
            {error && (
              <Form.Item>
                <Alert message={error} type="error" showIcon />
              </Form.Item>
            )}
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block size="large">
                Entrar
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Content>
    </Layout>
  );
}

export default Login;