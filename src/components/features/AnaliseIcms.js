import React, { useState, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import { Card, Button, Upload, Input, Tag, Space, Typography, Alert, Spin, Row, Col, Divider } from 'antd';
import { UploadOutlined, PlusOutlined, DeleteOutlined, FileExcelOutlined } from '@ant-design/icons';
import api from '../../services/api';
import ResultsTable from '../ResultsTable'; // Reutilizando a tabela de resultados

const { Title, Paragraph } = Typography;

function AnaliseIcms() {
  // ... (todo o estado e lógica que estava em Dashboard.js foi movido para cá)
  const [spedFile, setSpedFile] = useState(null);
  const [xmlFiles, setXmlFiles] = useState([]);
  const [cfops, setCfops] = useState(() => {
    try {
      const savedCfops = localStorage.getItem('savedCfops');
      return savedCfops ? JSON.parse(savedCfops) : ['1403', '1407', '2551'];
    } catch (error) { return ['1403', '1407', '2551']; }
  });
  const [currentCfop, setCurrentCfop] = useState('');
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const resultsRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('savedCfops', JSON.stringify(cfops));
  }, [cfops]);

  useEffect(() => {
    if (results && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [results]);

  const handleAddCfop = () => { /* ... mesma lógica ... */ };
  
  const handleAnalyze = async () => {
    if (!spedFile || xmlFiles.length === 0) {
      setError('Por favor, selecione o arquivo SPED e ao menos um arquivo XML.');
      return;
    }
    setError('');
    setIsLoading(true);
    setResults(null);
    const formData = new FormData();
    formData.append('spedFile', spedFile);
    xmlFiles.forEach(file => formData.append('xmlFiles', file));
    formData.append('cfopsIgnorados', cfops.join(','));
    try {
      // Endpoint correto para ICMS
      const response = await api.post('/analyze/icms', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResults(response.data.data || []);
    } catch (err) {
      setError('Ocorreu um erro na análise. Verifique os arquivos ou a conexão com a API.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => { /* ... mesma lógica ... */ };

  return (
    <Spin spinning={isLoading} tip="Analisando arquivos de ICMS..." size="large">
      <Title level={2}>Análise de Créditos de ICMS</Title>
      <Paragraph>Esta ferramenta cruza as informações de arquivos SPED Fiscal com as NF-es em XML para identificar divergências nos valores de ICMS creditados.</Paragraph>
      <Row gutter={[24, 24]}>
        {/* ... Colunas com os componentes de Upload e CFOPs, exatamente como estavam ... */}
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

// Lógicas de handleAddCfop e handleExportCSV completas omitidas por brevidade, mas são idênticas às originais
AnaliseIcms.prototype.handleAddCfop = function() {
  if (!this.state.currentCfop.trim()) return;
  const separators = /[\s,;]+/;
  const potentialCfops = this.state.currentCfop.split(separators);
  const newCfops = potentialCfops
    .map(cfop => cfop.trim())
    .filter(cfop => cfop && /^\d+$/.test(cfop))
    .filter(cfop => !this.state.cfops.includes(cfop));
  if (newCfops.length > 0) this.setState(prevState => ({ cfops: [...prevState.cfops, ...newCfops] }));
  this.setState({ currentCfop: '' });
};

AnaliseIcms.prototype.handleExportCSV = function() {
  if (!this.state.results || this.state.results.length === 0) return;
  const formattedData = this.state.results.map(item => ({
    'Chave NFe': `'${item.nfe_key}`,
    'Status': item.alerts.join('; '),
    'ICMS XML (R$)': item.data.icms_xml.toFixed(2).replace('.',','),
    'ICMS SPED (R$)': item.data.icms_sped.toFixed(2).replace('.',','),
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


export default AnaliseIcms;