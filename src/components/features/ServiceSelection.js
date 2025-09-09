import React from 'react';
import { Card, Col, Row, Typography } from 'antd';
import { CalculatorOutlined, FileTextOutlined, SwapOutlined, DollarCircleOutlined, CreditCardOutlined, WalletOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';

const { Title, Paragraph } = Typography;

const services = [
  {
    key: 'analise-icms',
    permission: 'analise-icms',
    title: 'Análise de ICMS',
    description: 'Cruza dados de arquivos SPED e XML para encontrar divergências de ICMS.',
    icon: <CalculatorOutlined style={{ fontSize: '36px', color: '#1890ff' }} />,
  },
  {
    key: 'analise-ipi-st',
    permission: 'analise-ipi-st',
    title: 'Análise de IPI/ST',
    description: 'Compara valores de IPI e Substituição Tributária entre SPED e XML.',
    icon: <FileTextOutlined style={{ fontSize: '36px', color: '#52c41a' }} />,
  },
  {
    key: 'converter-francesinha',
    permission: 'converter-francesinha',
    title: 'Conversor Francesinha',
    description: 'Converte arquivos de lançamento para o formato de importação contábil.',
    icon: <SwapOutlined style={{ fontSize: '36px', color: '#faad14' }} />,
  },
  // NOVO SERVIÇO ADICIONADO
  {
    key: 'converter-receitas-acisa',
    permission: 'converter-receitas-acisa',
    title: 'Conversor Receitas Acisa',
    description: 'Converte planilhas de receita para o formato de importação contábil.',
    icon: <DollarCircleOutlined style={{ fontSize: '36px', color: '#13c2c2' }} />,
  },
  {
    key: 'converter-atolini-recebimentos',
    permission: 'converter-atolini-recebimentos',
    title: 'Atolini Recebimentos',
    description: 'Gera arquivo para importação no Atolini Recebimentos.',
    icon: <WalletOutlined style={{ fontSize: '36px', color: '#722ed1' }} />,
  },
  {
    key: 'converter-atolini-pagamentos',
    permission: 'converter-atolini-pagamentos',
    title: 'Atolini Pagamentos',
    description: 'Gera arquivo para importação no Atolini Pagamentos.',
    icon: <CreditCardOutlined style={{ fontSize: '36px', color: '#eb2f96' }} />,
  },
];

const ServiceSelection = ({ onSelectService }) => {
  const { hasPermission } = useAuth();
  const availableServices = services.filter(service => hasPermission(service.permission));

  return (
    <div style={{ padding: '50px', background: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: '40px' }}>
        Selecione um Serviço
      </Title>
      <Row gutter={[24, 24]} justify="center">
        {availableServices.map(service => (
          <Col key={service.key} xs={24} sm={12} md={8}>
            <Card
              hoverable
              onClick={() => onSelectService(service.key)}
              style={{ textAlign: 'center', borderRadius: '8px' }}
            >
              <div style={{ marginBottom: '20px' }}>{service.icon}</div>
              <Title level={4}>{service.title}</Title>
              <Paragraph type="secondary">{service.description}</Paragraph>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default ServiceSelection;