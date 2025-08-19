import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, Alert, Layout } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import api from '../services/api';

const { Title } = Typography;
const { Content } = Layout;

function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/login', {
        username: values.username,
        password: values.password,
      });
      const { token } = response.data;
      if (token) {
        localStorage.setItem('authToken', token);
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Usuário ou senha inválidos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // ESTILO CORRIGIDO AQUI para garantir a centralização vertical e horizontal
    <Layout style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <Content>
        <Card style={{ width: 400, textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <Title level={2}>Análise Fiscal</Title>
          <Typography.Paragraph type="secondary">
            Faça login para continuar
          </Typography.Paragraph>

          <Form name="login" onFinish={onFinish} layout="vertical" requiredMark={false}>
            <Form.Item
              name="username"
              rules={[{ required: true, message: 'Por favor, insira seu usuário!' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Usuário" size="large" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Por favor, insira sua senha!' }]}
            >
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