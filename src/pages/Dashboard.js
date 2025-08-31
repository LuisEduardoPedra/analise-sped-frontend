import React, { useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import AnaliseIcms from '../components/features/AnaliseIcms';
import AnaliseIpiSt from '../components/features/AnaliseIpiSt';
import ConversorFrancesinha from '../components/features/ConversorFrancesinha';

function Dashboard() {
  const [activeComponentKey, setActiveComponentKey] = useState('analise-icms');

  const renderActiveComponent = () => {
    switch (activeComponentKey) {
      case 'analise-icms':
        return <AnaliseIcms />;
      case 'analise-ipi-st':
        return <AnaliseIpiSt />;
      case 'converter-francesinha':
        return <ConversorFrancesinha />;
      default:
        return <AnaliseIcms />;
    }
  };

  return (
    <MainLayout onMenuClick={(key) => setActiveComponentKey(key)}>
      {renderActiveComponent()}
    </MainLayout>
  );
}

export default Dashboard;