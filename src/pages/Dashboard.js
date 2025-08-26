import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import {
  Layout,
  Card,
  Button,
  Upload,
  Input,
  Tag,
  Space,
  Typography,
  Alert,
  Spin,
  Row,
  Col,
  Divider,
} from 'antd';
import {
  UploadOutlined,
  PlusOutlined,
  LogoutOutlined,
  ExperimentOutlined,
  DeleteOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';
import api from '../services/api';
import ResultsTable from '../components/ResultsTable';
import favicon from '../assets/icon.png';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

function Dashboard() {
  const [spedFile, setSpedFile] = useState(null);
  const [xmlFiles, setXmlFiles] = useState([]);
  const [cfops, setCfops] = useState(() => {
    try {
      const savedCfops = localStorage.getItem('savedCfops');
      if (savedCfops) return JSON.parse(savedCfops);
    } catch (error) { console.error("Falha ao ler CFOPs", error); }
    return ['1403', '1407', '2551'];
  });
  const [currentCfop, setCurrentCfop] = useState('');
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const resultsRef = useRef(null);

  useEffect(() => {
    try { localStorage.setItem('savedCfops', JSON.stringify(cfops)); } 
    catch (error) { console.error("Falha ao salvar CFOPs", error); }
  }, [cfops]);

  useEffect(() => {
    if (results && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [results]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/');
  };

  const handleAddCfop = () => {
    if (!currentCfop.trim()) return;
    const separators = /[\s,;]+/;
    const potentialCfops = currentCfop.split(separators);
    const newCfops = potentialCfops
      .map(cfop => cfop.trim())
      .filter(cfop => cfop && /^\d+$/.test(cfop))
      .filter(cfop => !cfops.includes(cfop));
    if (newCfops.length > 0) setCfops([...cfops, ...newCfops]);
    setCurrentCfop('');
  };

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
      const response = await api.post('/analyze', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResults(response.data || []);
    } catch (err) {
      setError('Ocorreu um erro na análise. Verifique os arquivos ou a conexão com a API.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!results || results.length === 0) return;

    const formattedData = results.map(item => {
      let statusText;
      switch (item.status_code) {
        case 1: statusText = 'Discrepância de ICMS'; break;
        case 2: statusText = 'Não encontrada no SPED'; break;
        case 3: statusText = 'XML Inválido'; break;
        default: statusText = 'Desconhecido';
      }
      return {
        'Numero da Nota': item.num_nota,
        'Chave NFe': `'${item.chave_nfe}`,
        'ICMS XML (R$)': item.icms_xml.toFixed(2),
        'ICMS SPED (R$)': item.icms_sped.toFixed(2),
        'CFOPs SPED': Array.isArray(item.cfops_sped) ? item.cfops_sped.join(', ') : '-',
        'Status': statusText,
      };
    });

    const csv = Papa.unparse(formattedData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'analise_fiscal.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layout>
      <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px' }}>
          <Space>
            <img src={favicon} alt="icon active" style={{ height: '70px', marginRight:'8px' }} />
            <Title level={4} style={{ color: 'white', margin: 0 }}>Análise Créditos ICMS</Title>
          </Space>
        <Button icon={<LogoutOutlined />} onClick={handleLogout}>Sair</Button>
      </Header>
      <Content className="main-content">
        <Spin spinning={isLoading} tip="Analisando arquivos... Isso pode levar um momento." size="large">
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Card title="1. Upload de Arquivos">
                <Paragraph type="secondary">Selecione o arquivo SPED e um ou mais arquivos XML de NF-e.</Paragraph>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Upload
                    accept=".txt"
                    beforeUpload={file => { setSpedFile(file); return false; }}
                    onRemove={() => setSpedFile(null)} maxCount={1} fileList={spedFile ? [spedFile] : []}
                  >
                    <Button icon={<UploadOutlined />}>Selecionar Arquivo SPED (.txt)</Button>
                  </Upload>
                  <Divider />
                  <Upload
                    accept=".xml"
                    beforeUpload={file => { setXmlFiles(prev => [...prev, file]); return false; }}
                    onRemove={file => setXmlFiles(prev => prev.filter(f => f.uid !== file.uid))}
                    multiple showUploadList={false}
                  >
                    <Button icon={<UploadOutlined />}>Selecionar Arquivos NF-e (.xml)</Button>
                  </Upload>
                  {xmlFiles.length > 0 && (
                    <Space style={{ marginTop: '10px', width: '100%', justifyContent: 'space-between' }}>
                      <Text type="success">{xmlFiles.length} arquivos XML selecionados.</Text>
                      <Button size="small" type="link" danger icon={<DeleteOutlined />} onClick={() => setXmlFiles([])}>Limpar</Button>
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
                    placeholder="Digite CFOPs separados por espaço ou vírgula"
                    value={currentCfop} onChange={e => setCurrentCfop(e.target.value)}
                    onPressEnter={handleAddCfop}
                  />
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleAddCfop} />
                </Space.Compact>
                <div style={{ marginTop: 16 }}>
                  {cfops.map(tag => (
                    <Tag closable onClose={() => setCfops(cfops.filter(t => t !== tag))} key={tag} style={{ marginBottom: 8, padding: '4px 8px', fontSize: '14px' }}>
                      {tag}
                    </Tag>
                  ))}
                </div>
              </Card>
            </Col>
          </Row>

          <Button type="primary" size="large" onClick={handleAnalyze} disabled={!spedFile || xmlFiles.length === 0} block style={{ marginTop: 24, height: '50px', fontSize: '18px' }}>
            Analisar Arquivos
          </Button>

          {error && <Alert message={error} type="error" showIcon style={{ marginTop: 24 }} />}
          
          {results && (
            <div ref={resultsRef}>
              <Card
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Resultados da Análise
                    <Button icon={<FileExcelOutlined />} onClick={handleExportCSV} disabled={!results || results.length === 0}>
                      Exportar para CSV
                    </Button>
                  </div>
                }
                style={{ marginTop: 24 }}
              >
                <ResultsTable data={results} />
              </Card>
            </div>
          )}
        </Spin>
      </Content>
    </Layout>
  );
}

export default Dashboard;