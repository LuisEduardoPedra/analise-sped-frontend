import React from 'react';
import Papa from 'papaparse';
import { Card, Button, Upload, Input, Tag, Space, Typography, Alert, Spin, Row, Col, Divider } from 'antd';
import { UploadOutlined, PlusOutlined, DeleteOutlined, FileExcelOutlined } from '@ant-design/icons';
import ResultsTable from '../ResultsTable';

const { Title, Paragraph, Text } = Typography;

function AnaliseIcms({ state, setState, handleAnalyze, error, isLoading }) {
  const { spedFile, xmlFiles, cfops, currentCfop, results, resultsRef } = state;

  const handleAddCfop = () => {
    if (!currentCfop.trim()) return;
    const separators = /[\s,;]+/;
    const potentialCfops = currentCfop.split(separators);
    const newCfops = potentialCfops
      .map(cfop => cfop.trim())
      .filter(cfop => cfop && /^\d+$/.test(cfop))
      .filter(cfop => !cfops.includes(cfop));

    if (newCfops.length > 0) {
      const updatedCfops = [...cfops, ...newCfops];
      setState({ cfops: updatedCfops, currentCfop: '' });
      localStorage.setItem('savedCfops', JSON.stringify(updatedCfops));
    } else {
      setState({ currentCfop: '' });
    }
  };

  const handleExportCSV = () => {
    if (!results || results.length === 0) return;
    const formattedData = results.map(item => ({
      'Chave NFe': `'${item.nfe_key}`,
      'Status': item.alerts.join('; '),
      'ICMS XML (R$)': item.data.icms_xml.toFixed(2).replace('.', ','),
      'ICMS SPED (R$)': item.data.icms_sped.toFixed(2).replace('.', ','),
      'CFOPs SPED': item.data.cfops_sped.join(', '),
      'Numero da Nota': item.data.doc_number,
    }));
    const csv = Papa.unparse(formattedData, { delimiter: ';' });
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'analise_icms.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Spin spinning={isLoading} tip="Analisando arquivos de ICMS..." size="large">
      <Title level={2}>Análise de Créditos de ICMS</Title>
      <Paragraph>Esta ferramenta cruza as informações de arquivos SPED Fiscal com as NF-es em XML para identificar divergências nos valores de ICMS creditados.</Paragraph>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="1. Upload de Arquivos">
            <Paragraph type="secondary">Selecione o arquivo SPED.</Paragraph>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Upload
                accept=".txt"
                beforeUpload={file => { setState({ spedFile: file }); return false; }}
                onRemove={() => setState({ spedFile: null })} maxCount={1} fileList={spedFile ? [spedFile] : []}
              >
                <Button icon={<UploadOutlined />}>Selecionar Arquivo SPED (.txt)</Button>
              </Upload>
              <Divider />
              <Paragraph type="secondary">Selecione um ou mais arquivos XML de NF-e.</Paragraph>
              <Upload
                accept=".xml"
                multiple
                showUploadList={false} // não renderiza a lista do AntD
                beforeUpload={(file) => {
                  setState(prev => {
                    const prevFiles = Array.isArray(prev.xmlFiles) ? prev.xmlFiles : [];
                    const exists = prevFiles.some(
                      f => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified
                    );
                    return { xmlFiles: exists ? prevFiles : [...prevFiles, file] };
                  });
                  return Upload.LIST_IGNORE; // impede o AntD de gerenciar a lista (sem UI pesada)
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
        </Col>
        <Col xs={24} lg={12}>
          <Card title="2. Gerenciar CFOPs Ignorados">
            <Paragraph type="secondary">Sua lista será salva automaticamente para futuras sessões.</Paragraph>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="Digite CFOPs e pressione Enter"
                value={currentCfop}
                onChange={e => setState({ currentCfop: e.target.value })}
                onPressEnter={handleAddCfop}
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddCfop} />
            </Space.Compact>
            <div style={{ marginTop: 16, maxHeight: '150px', overflowY: 'auto' }}>
              {cfops.map(tag => (
                <Tag
                  closable
                  onClose={() => {
                    const updatedCfops = cfops.filter(t => t !== tag);
                    setState({ cfops: updatedCfops });
                    localStorage.setItem('savedCfops', JSON.stringify(updatedCfops));
                  }}
                  key={tag}
                  style={{ marginBottom: 8, padding: '4px 8px', fontSize: '14px' }}
                >
                  {tag}
                </Tag>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <Button type="primary" size="large" onClick={handleAnalyze} disabled={!spedFile || xmlFiles.length === 0} block style={{ marginTop: 24, height: '50px', fontSize: '18px' }}>
        Analisar Arquivos de ICMS
      </Button>

      {error && <Alert message={error} type="error" showIcon style={{ marginTop: 24 }} />}

      {results && (
        <div ref={resultsRef}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Resultados da Análise de ICMS
                <Button icon={<FileExcelOutlined />} onClick={handleExportCSV}>Exportar para CSV</Button>
              </div>
            }
            style={{ marginTop: 24 }}
          >
            <ResultsTable data={results} type="icms" />
          </Card>
        </div>
      )}
    </Spin>
  );
}

export default AnaliseIcms;