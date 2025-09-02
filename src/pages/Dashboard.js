import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

import MainLayout from '../components/layout/MainLayout';
import ServiceSelection from '../components/features/ServiceSelection';
import AnaliseIcms from '../components/features/AnaliseIcms';
import AnaliseIpiSt from '../components/features/AnaliseIpiSt';
import ConversorFrancesinha from '../components/features/ConversorFrancesinha';
import ConversorReceitasAcisa from '../components/features/ConversorReceitasAcisa'; // 1. Importar o novo componente

const initialFeatureState = {
  spedFile: null,
  xmlFiles: [],
  lancamentosFile: null, // Para Francesinha
  excelFile: null,       // Para Receitas Acisa
  contasFile: null,
  classPrefixes: '',     // Estado para os prefixos
  results: null,
  error: '',
};

const getInitialCfops = () => {
  try {
    const savedCfops = localStorage.getItem('savedCfops');
    return savedCfops ? JSON.parse(savedCfops) : ['1403', '1407', '2551'];
  } catch (error) {
    return ['1403', '1407', '2551'];
  }
};

function Dashboard() {
  const { hasPermission } = useAuth();
  
  const availableServices = useMemo(() => [
    { key: 'analise-icms', permission: 'analise-icms' },
    { key: 'analise-ipi-st', permission: 'analise-ipi-st' },
    { key: 'converter-francesinha', permission: 'converter-francesinha' },
    // 2. Adicionar o novo serviço na lista
    { key: 'converter-receitas-acisa', permission: 'converter-receitas-acisa' },
  ].filter(s => hasPermission(s.permission)), [hasPermission]);

  const [view, setView] = useState('selection');
  const [activeFeature, setActiveFeature] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [featureStates, setFeatureStates] = useState({
    'analise-icms': { ...initialFeatureState, cfops: getInitialCfops(), currentCfop: '' },
    'analise-ipi-st': { ...initialFeatureState },
    'converter-francesinha': { ...initialFeatureState },
    // 3. Adicionar o estado inicial para a nova feature
    'converter-receitas-acisa': { ...initialFeatureState },
  });

  const resultsRef = useRef(null);

  useEffect(() => {
    if (availableServices.length === 1) {
      handleSelectService(availableServices[0].key);
    } else {
      setView('selection');
      setActiveFeature(null);
    }
  }, [availableServices]);

  useEffect(() => {
    if (featureStates[activeFeature]?.results && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [featureStates, activeFeature]);

  const setFeatureState = (featureKey, newState) => {
    setFeatureStates(prev => ({
      ...prev,
      [featureKey]: {
        ...prev[featureKey],
        ...newState,
      },
    }));
  };

  const handleSelectService = (key) => {
    setActiveFeature(key);
    setView('feature');
  };

  const handleGoHome = () => {
    if (availableServices.length > 1) {
      setView('selection');
      setActiveFeature(null);
    }
  };

  const handleAnalyze = async (type) => {
    const state = featureStates[type];
    if ((type.startsWith('analise') && (!state.spedFile || state.xmlFiles.length === 0))) return;

    setFeatureState(type, { error: '' });
    setIsLoading(true);
    setFeatureState(type, { results: null });
    
    const formData = new FormData();
    formData.append('spedFile', state.spedFile);
    state.xmlFiles.forEach(file => formData.append('xmlFiles', file));
    
    if (type === 'icms') {
      formData.append('cfopsIgnorados', state.cfops.join(','));
    }

    try {
      const response = await api.post(`/analyze/${type}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFeatureState(type, { results: response.data.data || [] });
    } catch (err) {
      setFeatureState(type, { error: `Ocorreu um erro na análise. Verifique os arquivos ou a conexão.` });
    } finally {
      setIsLoading(false);
    }
  };

  // Renomeado para maior clareza
  const handleFrancesinhaConvert = async () => {
    const state = featureStates['converter-francesinha'];
    if (!state.lancamentosFile || !state.contasFile) {
        setFeatureState('converter-francesinha', { error: 'Por favor, selecione ambos os arquivos.' });
        return;
    }
    setFeatureState('converter-francesinha', { error: '' });
    setIsLoading(true);

    const formData = new FormData();
    formData.append('lancamentosFile', state.lancamentosFile);
    formData.append('contasFile', state.contasFile);
    if (state.classPrefixes) {
      formData.append('classPrefixes', state.classPrefixes);
    }

    try {
        const response = await api.post('/convert/francesinha', formData, {
            responseType: 'blob',
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        const contentDisposition = response.headers['content-disposition'];
        let fileName = 'francesinha_sicredi.csv';
        if (contentDisposition) {
            const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
            if (fileNameMatch && fileNameMatch.length === 2) fileName = fileNameMatch[1];
        }
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (err) {
        setFeatureState('converter-francesinha', { error: 'Ocorreu um erro na conversão.' });
    } finally {
        setIsLoading(false);
    }
  };

  // 4. Nova função para o conversor de receitas
  const handleReceitasAcisaConvert = async () => {
    const state = featureStates['converter-receitas-acisa'];
    if (!state.excelFile || !state.contasFile) {
      setFeatureState('converter-receitas-acisa', { error: 'Por favor, selecione ambos os arquivos.' });
      return;
    }
    setFeatureState('converter-receitas-acisa', { error: '' });
    setIsLoading(true);

    const formData = new FormData();
    formData.append('excelFile', state.excelFile);
    formData.append('contasFile', state.contasFile);
    if (state.classPrefixes) {
      formData.append('classPrefixes', state.classPrefixes);
    }

    try {
      const response = await api.post('/convert/receitas-acisa', formData, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const contentDisposition = response.headers['content-disposition'];
      let fileName = 'mensalidades_acisa.csv';
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch && fileNameMatch.length === 2) fileName = fileNameMatch[1];
      }
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setFeatureState('converter-receitas-acisa', { error: 'Ocorreu um erro na conversão.' });
    } finally {
      setIsLoading(false);
    }
  };

  const renderActiveComponent = () => {
    const currentState = { ...featureStates[activeFeature], resultsRef };
    
    const commonProps = {
      state: currentState,
      setState: (newState) => setFeatureState(activeFeature, newState),
      isLoading: isLoading,
      error: currentState.error,
    };

    switch (activeFeature) {
      case 'analise-icms':
        return <AnaliseIcms {...commonProps} handleAnalyze={handleAnalyze} />;
      case 'analise-ipi-st':
        return <AnaliseIpiSt {...commonProps} handleAnalyze={handleAnalyze} />;
      case 'converter-francesinha':
        return <ConversorFrancesinha {...commonProps} handleConvert={handleFrancesinhaConvert} />;
      // 5. Case para renderizar o novo componente
      case 'converter-receitas-acisa':
        return <ConversorReceitasAcisa {...commonProps} handleConvert={handleReceitasAcisaConvert} />;
      default:
        if (availableServices.length > 1) setView('selection');
        return null;
    }
  };
  
  if (view === 'selection' && availableServices.length > 1) {
    return (
        <MainLayout showSider={false} onHomeClick={handleGoHome}>
            <ServiceSelection onSelectService={handleSelectService} />
        </MainLayout>
    )
  }

  return (
    <MainLayout
      onMenuClick={handleSelectService}
      onHomeClick={handleGoHome}
      activeKey={activeFeature}
      showSider={availableServices.length > 1}
    >
      {activeFeature ? renderActiveComponent() : <div />}
    </MainLayout>
  );
}

export default Dashboard;