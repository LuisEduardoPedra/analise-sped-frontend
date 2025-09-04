import React from 'react';
import Papa from 'papaparse';
import { Card, Button, Upload, Space, Typography, Alert, Spin, Divider } from 'antd';
import { UploadOutlined, DeleteOutlined, FileExcelOutlined } from '@ant-design/icons';
import ResultsTable from '../ResultsTable';

const { Title, Paragraph, Text } = Typography;

function AnaliseIpiSt({ state, setState, handleAnalyze, error, isLoading }) {
  const { spedFile, xmlFiles, results, resultsRef } = state;

  const handleExportCSV = () => {
    if (!results || results.length === 0) return;
    const formattedData = results.map(item => ({
      'Chave NFe': `'${item.nfe_key}`,
      'Alertas': item.alerts.join('; '),
      'IPI XML (R$)': item.data.ipi_value_xml.toFixed(2).replace('.', ','),
      'IPI SPED (R$)': item.data.ipi_value_sped.toFixed(2).replace('.', ','),
      'ST XML (R$)': item.data.st_value_xml.toFixed(2).replace('.', ','),
      'ST SPED (R$)': item.data.st_value_sped.toFixed(2).replace('.', ','),
    }));
    const csv = Papa.unparse(formattedData, { delimiter: ';' });
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'analise_ipi_st.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Spin spinning={isLoading} tip="Analisando IPI/ST..." size="large">
      <Title level={2}>Análise de IPI e ST</Title>
      <Paragraph>Esta ferramenta compara os valores de IPI e Substituição Tributária (ST) entre os arquivos SPED e as NF-es em XML.</Paragraph>
      <Card title="Upload de Arquivos">
        <Paragraph type="secondary">Selecione o arquivo SPED e os arquivos XML de NF-e para a análise.</Paragraph>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Upload
            accept=".txt"
            beforeUpload={file => { setState({ spedFile: file }); return false; }}
            onRemove={() => setState({ spedFile: null })} maxCount={1} fileList={spedFile ? [spedFile] : []}
          >
            <Button icon={<UploadOutlined />}>Selecionar Arquivo SPED (.txt)</Button>
          </Upload>
          <Divider />
          <Upload
            accept=".xml"
            multiple
            showUploadList={false}
            beforeUpload={(file) => {
              setState(prev => {
                const prevFiles = Array.isArray(prev.xmlFiles) ? prev.xmlFiles : [];
                const exists = prevFiles.some(
                  f => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified
                );
                return { xmlFiles: exists ? prevFiles : [...prevFiles, file] };
              });
              return Upload.LIST_IGNORE;
            }}
          >
            <Button icon={<UploadOutlined />}>Selecionar Arquivos NF-e (.xml)</Button>
          </Upload>

          {Array.isArray(xmlFiles) && xmlFiles.length > 0 && (
            <Space style={{ marginTop: '10px', width: '100%', justifyContent: 'space-between' }}>
              <Text type="success">{xmlFiles.length} arquivos XML selecionados.</Text>
              <Button
                size="small"
                type="link"
                danger
                icon={<DeleteOutlined />}
                onClick={() => setState({ xmlFiles: [] })}
              >
                Limpar
              </Button>
            </Space>
          )}


        </Space>
      </Card>

      <Button type="primary" size="large" onClick={handleAnalyze} disabled={!spedFile || xmlFiles.length === 0} block style={{ marginTop: 24, height: '50px', fontSize: '18px' }}>
        Analisar IPI/ST
      </Button>

      {error && <Alert message={error} type="error" showIcon style={{ marginTop: 24 }} />}

      {results && (
        <div ref={resultsRef}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Resultados da Análise de IPI/ST
                <Button icon={<FileExcelOutlined />} onClick={handleExportCSV}>Exportar para CSV</Button>
              </div>
            }
            style={{ marginTop: 24 }}
          >
            <ResultsTable data={results} type="ipi-st" />
          </Card>
        </div>
      )}
    </Spin>
  );
}

export default AnaliseIpiSt;