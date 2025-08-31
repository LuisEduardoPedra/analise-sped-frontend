import React, { useState } from 'react';
import { Card, Button, Upload, Space, Typography, Alert, Spin, Row, Col, Divider } from 'antd';
import { UploadOutlined, SwapOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { Title, Paragraph, Text } = Typography;

function ConversorFrancesinha() {
  const [lancamentosFile, setLancamentosFile] = useState(null);
  const [contasFile, setContasFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConvert = async () => {
    if (!lancamentosFile || !contasFile) {
      setError('Por favor, selecione ambos os arquivos para a conversão.');
      return;
    }
    setError('');
    setIsLoading(true);

    const formData = new FormData();
    formData.append('lancamentosFile', lancamentosFile);
    formData.append('contasFile', contasFile);

    try {
      const response = await api.post('/convert/francesinha', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob', // Importante para receber o arquivo como resposta
      });

      // Cria um link para download do arquivo CSV retornado
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const contentDisposition = response.headers['content-disposition'];
      let fileName = 'conversao.csv';
      if (contentDisposition) {
          const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
          if (fileNameMatch.length === 2)
              fileName = fileNameMatch[1];
      }
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
    } catch (err) {
      setError('Ocorreu um erro na conversão. Verifique os arquivos ou a conexão.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Spin spinning={isLoading} tip="Convertendo arquivos..." size="large">
      <Title level={2}>Conversor de Arquivos (Francesinha)</Title>
      <Paragraph>
        Esta ferramenta converte um arquivo de lançamentos e um plano de contas para o formato de importação "francesinha".
      </Paragraph>
      <Card title="Upload de Arquivos">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Paragraph type="secondary">1. Arquivo de Lançamentos (.csv)</Paragraph>
            <Upload
              accept=".csv"
              beforeUpload={file => { setLancamentosFile(file); return false; }}
              onRemove={() => setLancamentosFile(null)} maxCount={1} fileList={lancamentosFile ? [lancamentosFile] : []}
            >
              <Button icon={<UploadOutlined />}>Selecionar Lançamentos</Button>
            </Upload>
          </Col>
          <Col xs={24} md={12}>
            <Paragraph type="secondary">2. Arquivo do Plano de Contas (.csv)</Paragraph>
            <Upload
              accept=".csv"
              beforeUpload={file => { setContasFile(file); return false; }}
              onRemove={() => setContasFile(null)} maxCount={1} fileList={contasFile ? [contasFile] : []}
            >
              <Button icon={<UploadOutlined />}>Selecionar Plano de Contas</Button>
            </Upload>
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