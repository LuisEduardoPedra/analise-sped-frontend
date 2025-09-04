import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

import MainLayout from '../components/layout/MainLayout';
import ServiceSelection from '../components/features/ServiceSelection';
import AnaliseIcms from '../components/features/AnaliseIcms';
import AnaliseIpiSt from '../components/features/AnaliseIpiSt';
import ConversorFrancesinha from '../components/features/ConversorFrancesinha';
import ConversorReceitasAcisa from '../components/features/ConversorReceitasAcisa';

const initialFeatureState = {
  spedFile: null,
  xmlFiles: [],
  lancamentosFile: null,
  excelFile: null,
  contasFile: null,
  classPrefixes: '',
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
    { key: 'converter-receitas-acisa', permission: 'converter-receitas-acisa' },
  ].filter(s => hasPermission(s.permission)), [hasPermission]);

  const [view, setView] = useState('selection');
  const [activeFeature, setActiveFeature] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [featureStates, setFeatureStates] = useState({
    'analise-icms': { ...initialFeatureState, cfops: getInitialCfops(), currentCfop: '' },
    'analise-ipi-st': { ...initialFeatureState },
    'converter-francesinha': { ...initialFeatureState },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableServices]);

  useEffect(() => {
    if (featureStates[activeFeature]?.results && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [featureStates, activeFeature]);

  /**
   * setFeatureState agora aceita:
   * - objeto simples: setFeatureState('analise-icms', { xmlFiles: [] })
   * - função updater: setFeatureState('analise-icms', prev => ({ xmlFiles: [...prev.xmlFiles, f] }))
   */
  const setFeatureState = (featureKey, updater) => {
    setFeatureStates(prevAll => {
      const prevFeature = prevAll[featureKey] || {};
      const nextPartial = (typeof updater === 'function') ? updater(prevFeature) : updater || {};
      return {
        ...prevAll,
        [featureKey]: {
          ...prevFeature,
          ...nextPartial,
        },
      };
    });
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

  const handleAnalyze = async () => {
    const state = featureStates[activeFeature];
    if (!state || !state.spedFile || !Array.isArray(state.xmlFiles) || state.xmlFiles.length === 0) return;

    const analyzeType = activeFeature.replace('analise-', '');

    // reset erros/resultados
    setFeatureState(activeFeature, { error: '' });
    setFeatureState(activeFeature, { results: null });
    setIsLoading(true);

    try {
      const formData = new FormData();

      // Normaliza spedFile (pode ser um File direto ou objeto AntD com originFileObj)
      const spedFileObj = state.spedFile && state.spedFile.originFileObj ? state.spedFile.originFileObj : state.spedFile;
      if (!spedFileObj) throw new Error('Arquivo SPED inválido.');
      // terceiro parâmetro para garantir nome do arquivo
      formData.append('spedFile', spedFileObj, spedFileObj.name || 'sped.txt');

      // Normaliza xmlFiles (cada item pode ser File nativo ou objeto AntD)
      const xmlFilesToUpload = state.xmlFiles.map(f => (f && f.originFileObj) ? f.originFileObj : f).filter(Boolean);

      if (xmlFilesToUpload.length === 0) {
        setFeatureState(activeFeature, { error: 'Nenhum arquivo XML válido para envio.' });
        setIsLoading(false);
        return;
      }

      // Appendando cada XML como xmlFiles[] (compatível com backends que esperam array)
      xmlFilesToUpload.forEach((file, idx) => {
        formData.append('xmlFiles[]', file, file.name || `xml_${idx}.xml`);
      });

      if (analyzeType === 'icms' && Array.isArray(state.cfops)) {
        formData.append('cfopsIgnorados', state.cfops.join(','));
      }

      // Não forçar Content-Type; deixe o browser/axios setar o boundary automaticamente
      const response = await api.post(`/analyze/${analyzeType}`, formData, {
        // headers: { 'Content-Type': 'multipart/form-data' }, // REMOVIDO propositalmente
      });

      setFeatureState(activeFeature, { results: response.data?.data || [] });
    } catch (err) {
      console.error(err);
      setFeatureState(activeFeature, { error: 'Ocorreu um erro na análise. Verifique os arquivos ou a conexão.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFrancesinhaConvert = async () => {
    const state = featureStates['converter-francesinha'];
    if (!state.lancamentosFile || !state.contasFile) {
        setFeatureState('converter-francesinha', { error: 'Por favor, selecione ambos os arquivos.' });
        return;
    }
    setFeatureState('converter-francesinha', { error: '' });
    setIsLoading(true);

    const formData = new FormData();
    const lanc = state.lancamentosFile.originFileObj ?? state.lancamentosFile;
    const contas = state.contasFile.originFileObj ?? state.contasFile;
    formData.append('lancamentosFile', lanc, lanc.name);
    formData.append('contasFile', contas, contas.name);
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
        console.error(err);
        setFeatureState('converter-francesinha', { error: 'Ocorreu um erro na conversão.' });
    } finally {
        setIsLoading(false);
    }
  };

  const handleReceitasAcisaConvert = async () => {
    const state = featureStates['converter-receitas-acisa'];
    if (!state.excelFile || !state.contasFile) {
      setFeatureState('converter-receitas-acisa', { error: 'Por favor, selecione ambos os arquivos.' });
      return;
    }
    setFeatureState('converter-receitas-acisa', { error: '' });
    setIsLoading(true);

    const formData = new FormData();
    const excel = state.excelFile.originFileObj ?? state.excelFile;
    const contas = state.contasFile.originFileObj ?? state.contasFile;
    formData.append('excelFile', excel, excel.name);
    formData.append('contasFile', contas, contas.name);
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
      console.error(err);
      setFeatureState('converter-receitas-acisa', { error: 'Ocorreu um erro na conversão.' });
    } finally {
      setIsLoading(false);
    }
  };

  const renderActiveComponent = () => {
    const currentState = { ...featureStates[activeFeature], resultsRef };

    const commonProps = {
      state: currentState,
      // setState pode receber objeto ou função; passamos direto para o setFeatureState que lida com ambos
      setState: (newStateOrUpdater) => setFeatureState(activeFeature, newStateOrUpdater),
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
