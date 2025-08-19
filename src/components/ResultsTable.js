import { Table, Tag } from 'antd';

function ResultsTable({ data }) {
  const getStatusTag = (statusCode) => {
    switch (statusCode) {
      case 1: return <Tag color="error">Discrepância de ICMS</Tag>;
      case 2: return <Tag color="warning">Não encontrada no SPED</Tag>;
      case 3: return <Tag color="default">XML Inválido</Tag>;
      default: return <Tag>Desconhecido</Tag>;
    }
  };

  const columns = [
    {
      title: 'Nº Nota',
      dataIndex: 'num_nota',
      key: 'num_nota',
    },
    {
      title: 'Chave NF-e',
      dataIndex: 'chave_nfe',
      key: 'chave_nfe',
    },
    {
      title: 'ICMS XML',
      dataIndex: 'icms_xml',
      key: 'icms_xml',
      render: (value) => `R$ ${value.toFixed(2)}`,
    },
    {
      title: 'ICMS SPED',
      dataIndex: 'icms_sped',
      key: 'icms_sped',
      render: (value) => `R$ ${value.toFixed(2)}`,
    },
    {
      title: 'CFOPs SPED',
      dataIndex: 'cfops_sped',
      key: 'cfops_sped',
      render: (cfops) => (Array.isArray(cfops) ? cfops.join(', ') : '-'),
    },
    {
      title: 'Status',
      dataIndex: 'status_code',
      key: 'status_code',
      render: (code) => getStatusTag(code),
    },
  ];
  
  if (data.length === 0) {
      return <p>Nenhuma inconsistência encontrada nos arquivos analisados.</p>
  }

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="chave_nfe"
      scroll={{ x: 1000 }} // Habilita scroll horizontal em telas menores
    />
  );
}

export default ResultsTable;