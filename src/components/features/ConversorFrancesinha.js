import React from 'react';
import { Card, Button, Upload, Typography, Alert, Spin, Row, Col, Input } from 'antd';
import { UploadOutlined, SwapOutlined, TagOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

function ConversorFrancesinha({ state, setState, handleConvert, error, isLoading }) {
  const { lancamentosFile, contasFile, classPrefixes } = state;

  // Handler para validar a entrada de prefixos
  const handlePrefixesChange = (e) => {
    const { value } = e.target;
    // Permite apenas números, vírgulas, pontos e espaços
    const validValue = value.replace(/[^0-9,.\s]/g, '');
    setState({ classPrefixes: validValue });
  };

  return (
    <Spin spinning={isLoading} tip="Convertendo arquivos..." size="large">
      <Title level={2}>Conversor de Arquivos (Francesinha Sicredi)</Title>
      <Paragraph>
        Esta ferramenta converte um arquivo de lançamentos e um plano de contas para o formato de importação "francesinha".
      </Paragraph>
      <Card title="Upload de Arquivos e Filtros">
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Paragraph type="secondary">1. Arquivo de Lançamentos (.xls, .xlsx)</Paragraph>
            <Upload
              accept=".xls,.xlsx"
              beforeUpload={file => { setState({ lancamentosFile: file }); return false; }}
              onRemove={() => setState({ lancamentosFile: null })} maxCount={1} fileList={lancamentosFile ? [lancamentosFile] : []}
            >
              <Button icon={<UploadOutlined />}>Selecionar Lançamentos</Button>
            </Upload>
          </Col>
          <Col xs={24} md={12}>
            <Paragraph type="secondary">2. Arquivo do Plano de Contas (.csv)</Paragraph>
            <Upload
              accept=".csv"
              beforeUpload={file => { setState({ contasFile: file }); return false; }}
              onRemove={() => setState({ contasFile: null })} maxCount={1} fileList={contasFile ? [contasFile] : []}
            >
              <Button icon={<UploadOutlined />}>Selecionar Plano de Contas</Button>
            </Upload>
          </Col>
          {/* NOVO CAMPO DE FILTRO */}
          <Col xs={24}>
            <Paragraph type="secondary" style={{ marginTop: 16 }}>3. Classificação de Conta Sintética para Lançamentos (Opcional)</Paragraph>
            <Input
              prefix={<TagOutlined />}
              placeholder="Filtre por conta sintética. Ex: 1.1.2, 1.1.3"
              value={classPrefixes}
              onChange={handlePrefixesChange}
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

export default ConversorFrancesinha;