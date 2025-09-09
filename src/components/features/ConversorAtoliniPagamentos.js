import React from 'react';
import { Card, Button, Upload, Typography, Alert, Spin, Row, Col, Input } from 'antd';
import { UploadOutlined, SwapOutlined, TagOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

function ConversorAtoliniPagamentos({ state, setState, handleConvert, error, isLoading }) {
  const { lancamentosFile, contasFile, creditPrefixes, debitPrefixes } = state;

  const handleCreditChange = (e) => {
    const validValue = e.target.value.replace(/[^0-9,.\s]/g, '');
    setState({ creditPrefixes: validValue });
  };

  const handleDebitChange = (e) => {
    const validValue = e.target.value.replace(/[^0-9,.\s]/g, '');
    setState({ debitPrefixes: validValue });
  };

  return (
    <Spin spinning={isLoading} tip="Convertendo arquivos..." size="large">
      <Title level={2}>Conversor Atolini Pagamentos</Title>
      <Paragraph>
        Esta ferramenta converte um arquivo de lançamentos e um plano de contas para o formato de importação Atolini Pagamentos.
      </Paragraph>
      <Card title="Upload de Arquivos e Filtros">
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Paragraph type="secondary">1. Arquivo de Lançamentos (.xls, .xlsx)</Paragraph>
            <Upload
              accept=".xls,.xlsx"
              beforeUpload={file => { setState({ lancamentosFile: file }); return false; }}
              onRemove={() => setState({ lancamentosFile: null })}
              maxCount={1}
              fileList={lancamentosFile ? [lancamentosFile] : []}
            >
              <Button icon={<UploadOutlined />}>Selecionar Lançamentos</Button>
            </Upload>
          </Col>
          <Col xs={24} md={12}>
            <Paragraph type="secondary">2. Arquivo do Plano de Contas (.csv)</Paragraph>
            <Upload
              accept=".csv"
              beforeUpload={file => { setState({ contasFile: file }); return false; }}
              onRemove={() => setState({ contasFile: null })}
              maxCount={1}
              fileList={contasFile ? [contasFile] : []}
            >
              <Button icon={<UploadOutlined />}>Selecionar Plano de Contas</Button>
            </Upload>
          </Col>
          <Col xs={24} md={12}>
            <Paragraph type="secondary" style={{ marginTop: 16 }}>3. Filtro para contas Passivo</Paragraph>
            <Input
              prefix={<TagOutlined />}
              placeholder="Ex: 2.1.1, 2.1.1.01"
              value={creditPrefixes}
              onChange={handleCreditChange}
              allowClear
            />
          </Col>
          <Col xs={24} md={12}>
            <Paragraph type="secondary" style={{ marginTop: 16 }}>4. Filtro para contas Ativo</Paragraph>
            <Input
              prefix={<TagOutlined />}
              placeholder="Ex: 1.1.1, 1.1.1.02"
              value={debitPrefixes}
              onChange={handleDebitChange}
              allowClear
            />
          </Col>
        </Row>
      </Card>

      <Button
        type="primary"
        size="large"
        icon={<SwapOutlined />}
        onClick={handleConvert}
        disabled={!lancamentosFile || !contasFile}
        block
        style={{ marginTop: 24, height: '50px', fontSize: '18px' }}
      >
        Converter e Baixar Arquivo
      </Button>

      {error && <Alert message={error} type="error" showIcon style={{ marginTop: 24 }} />}
    </Spin>
  );
}

export default ConversorAtoliniPagamentos;
