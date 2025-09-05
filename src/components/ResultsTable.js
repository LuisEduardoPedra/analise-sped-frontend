import React from 'react';
import { Table, Tag } from 'antd';

const getStatusTag = (statusCode) => {
    switch (statusCode) {
        case 1: return <Tag color="error">Discrepância de ICMS</Tag>;
        case 2: return <Tag color="warning">Não encontrada no SPED</Tag>;
        case 3: return <Tag color="default">XML Inválido</Tag>;
        case 4: return <Tag color="error">Discrepância IPI/ST</Tag>;
        default: return <Tag>OK</Tag>;
    }
};

const columnsIcms = [
    {
        title: 'Chave NF-e', dataIndex: 'nfe_key', key: 'nfe_key', width: 380,
        render: text => <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>{text}</div>
    },
    { title: 'Nº Nota', dataIndex: ['data', 'doc_number'], key: 'doc_number' },
    {
        title: 'ICMS XML', dataIndex: ['data', 'icms_xml'], key: 'icms_xml',
        render: (value) => `R$ ${value.toFixed(2).replace('.', ',')}`,
    },
    {
        title: 'ICMS SPED', dataIndex: ['data', 'icms_sped'], key: 'icms_sped',
        render: (value) => `R$ ${value.toFixed(2).replace('.', ',')}`,
    },
    {
        title: 'CFOPs SPED', dataIndex: ['data', 'cfops_sped'], key: 'cfops_sped',
        render: (cfops) => (Array.isArray(cfops) ? cfops.join(', ') : '-'),
    },
    {
        title: 'Status', dataIndex: 'status_code', key: 'status_code',
        render: (code) => getStatusTag(code),
    },
];

const columnsIpiSt = [
    {
        title: 'Chave NF-e', dataIndex: 'nfe_key', key: 'nfe_key', width: 380,
        render: text => <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>{text}</div>
    },
    {
        title: 'IPI XML', dataIndex: ['data', 'ipi_value_xml'], key: 'ipi_xml',
        render: (value) => `R$ ${value.toFixed(2).replace('.', ',')}`,
    },
    {
        title: 'IPI SPED', dataIndex: ['data', 'ipi_value_sped'], key: 'ipi_sped',
        render: (value) => `R$ ${value.toFixed(2).replace('.', ',')}`,
    },
    {
        title: 'ST XML', dataIndex: ['data', 'st_value_xml'], key: 'st_xml',
        render: (value) => `R$ ${value.toFixed(2).replace('.', ',')}`,
    },
    {
        title: 'ST SPED', dataIndex: ['data', 'st_value_sped'], key: 'st_sped',
        render: (value) => `R$ ${value.toFixed(2).replace('.', ',')}`,
    },
    {
        title: 'Status', dataIndex: 'status_code', key: 'status_code',
        render: (code) => getStatusTag(code),
    },
    {
        title: 'Alertas', dataIndex: 'alerts', key: 'alerts',
        render: (alerts) => (Array.isArray(alerts) ? alerts.join(', ') : '-'),
    },
];

function ResultsTable({ data, type }) {
    if (!data || data.length === 0) {
        return <p>Nenhuma inconsistência encontrada nos arquivos analisados.</p>;
    }

    const columns = type === 'icms' ? columnsIcms : columnsIpiSt;

    return (
        <Table
            columns={columns}
            dataSource={data}
            rowKey="nfe_key"
            scroll={{ x: 1200 }}
            size="small"
        />
    );
}

export default ResultsTable;