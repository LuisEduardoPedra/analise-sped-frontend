import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

import MainLayout from '../components/layout/MainLayout';
import ServiceSelection from '../components/features/ServiceSelection';
import AnaliseIcms from '../components/features/AnaliseIcms';
import AnaliseIpiSt from '../components/features/AnaliseIpiSt';
import ConversorFrancesinha from '../components/features/ConversorFrancesinha';
import ConversorReceitasAcisa from '../components/features/ConversorReceitasAcisa';
import ConversorAtoliniPagamentos from '../components/features/ConversorAtoliniPagamentos';
import ConversorAtoliniRecebimentos from '../components/features/ConversorAtoliniRecebimentos';

const initialFeatureState = {
  spedFile: null,
  xmlFiles: [],
  lancamentosFile: null,
  excelFile: null,
  contasFile: null,
  classPrefixes: '',
  creditPrefixes: '',
  debitPrefixes: '',
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
    { key: 'converter-atolini-recebimentos', permission: 'converter-atolini-recebimentos' },
    { key: 'converter-atolini-pagamentos', permission: 'converter-atolini-pagamentos' },
  ].filter(s => hasPermission(s.permission)), [hasPermission]);

  const [view, setView] = useState('selection');
  const [activeFeature, setActiveFeature] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [featureStates, setFeatureStates] = useState({
    'analise-icms': { ...initialFeatureState, cfops: getInitialCfops(), currentCfop: '' },
    'analise-ipi-st': { ...initialFeatureState },
    'converter-francesinha': { ...initialFeatureState },
    'converter-receitas-acisa': { ...initialFeatureState },
    'converter-atolini-recebimentos': { ...initialFeatureState },
    'converter-atolini-pagamentos': { ...initialFeatureState },
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
  if (!state || !state.spedFile || !Array.isArray(state.xmlFiles) || state.xmlFiles.length === 0) {
    setFeatureState(activeFeature, { error: 'Por favor, selecione SPED e pelo menos um XML.' });
    return;
  }

  const analyzeType = activeFeature.replace('analise-', '');

  setFeatureState(activeFeature, { error: '' });
  setFeatureState(activeFeature, { results: null });
  setIsLoading(true);

  try {
    const formData = new FormData();

    // Normaliza SPED
    const spedFileObj = state.spedFile?.originFileObj ?? state.spedFile;
    if (!spedFileObj) throw new Error('Arquivo SPED inválido.');
    formData.append('spedFile', spedFileObj, spedFileObj.name ?? 'sped.txt');

    // Normaliza XMLs
    const xmlFilesToUpload = state.xmlFiles
      .map(f => f?.originFileObj ?? f)
      .filter(Boolean);

    if (xmlFilesToUpload.length === 0) {
      setFeatureState(activeFeature, { error: 'Nenhum arquivo XML válido para envio.' });
      setIsLoading(false);
      return;
    }

    // Append dos arquivos - adicionamos duas chaves para compatibilidade:
    // 1) xmlFiles (append repetido)  2) xmlFiles[] (alguns backends esperam esse formato)
    xmlFilesToUpload.forEach((file, idx) => {
      const filename = file.name ?? `xml_${idx}.xml`;
      formData.append('xmlFiles', file, filename);
      formData.append('xmlFiles[]', file, filename);
    });

    if (analyzeType === 'icms' && Array.isArray(state.cfops)) {
      formData.append('cfopsIgnorados', state.cfops.join(','));
    }

    // Não forçar Content-Type — axios/browsers cuidam do boundary automaticamente
    const response = await api.post(`/analyze/${analyzeType}`, formData);

    setFeatureState(activeFeature, { results: response.data?.data || [] });
  } catch (err) {
    console.error(err);
    // Se o backend retornar JSON com uma mensagem, mostramos
    const message =
      err?.response?.data?.message ||
      err?.message ||
      'Ocorreu um erro na análise. Verifique os arquivos ou a conexão.';
    setFeatureState(activeFeature, { error: message });
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

  const handleAtoliniRecebimentosConvert = async () => {
    const state = featureStates['converter-atolini-recebimentos'];
    if (!state.lancamentosFile || !state.contasFile) {
      setFeatureState('converter-atolini-recebimentos', { error: 'Por favor, selecione ambos os arquivos.' });
      return;
    }
    setFeatureState('converter-atolini-recebimentos', { error: '' });
    setIsLoading(true);

    const formData = new FormData();
    const lanc = state.lancamentosFile.originFileObj ?? state.lancamentosFile;
    const contas = state.contasFile.originFileObj ?? state.contasFile;
    formData.append('lancamentosFile', lanc, lanc.name);
    formData.append('contasFile', contas, contas.name);
    if (state.creditPrefixes) {
      formData.append('creditPrefixes', state.creditPrefixes);
    }
    if (state.debitPrefixes) {
      formData.append('debitPrefixes', state.debitPrefixes);
    }

    try {
      const response = await api.post('/convert/atolini-recebimentos', formData, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const contentDisposition = response.headers['content-disposition'];
      let fileName = 'atolini_recebimentos.txt';
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
      setFeatureState('converter-atolini-recebimentos', { error: 'Ocorreu um erro na conversão.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAtoliniPagamentosConvert = async () => {
    const state = featureStates['converter-atolini-pagamentos'];
    if (!state.lancamentosFile || !state.contasFile) {
      setFeatureState('converter-atolini-pagamentos', { error: 'Por favor, selecione ambos os arquivos.' });
      return;
    }
    setFeatureState('converter-atolini-pagamentos', { error: '' });
    setIsLoading(true);

    const formData = new FormData();
    const lanc = state.lancamentosFile.originFileObj ?? state.lancamentosFile;
    const contas = state.contasFile.originFileObj ?? state.contasFile;
    formData.append('lancamentosFile', lanc, lanc.name);
    formData.append('contasFile', contas, contas.name);
    if (state.creditPrefixes) {
      formData.append('creditPrefixes', state.creditPrefixes);
    }
    if (state.debitPrefixes) {
      formData.append('debitPrefixes', state.debitPrefixes);
    }

    try {
      const response = await api.post('/convert/atolini-pagamentos', formData, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const contentDisposition = response.headers['content-disposition'];
      let fileName = 'atolini_pagamentos.txt';
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
      setFeatureState('converter-atolini-pagamentos', { error: 'Ocorreu um erro na conversão.' });
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
      case 'converter-atolini-recebimentos':
        return <ConversorAtoliniRecebimentos {...commonProps} handleConvert={handleAtoliniRecebimentosConvert} />;
      case 'converter-atolini-pagamentos':
        return <ConversorAtoliniPagamentos {...commonProps} handleConvert={handleAtoliniPagamentosConvert} />;
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
