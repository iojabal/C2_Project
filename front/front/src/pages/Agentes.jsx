import { useState } from "react";

const agentsData = [
  {
    name: "Desktop /asdf asd",
    status: "Activo",
    os: "Windows",
    lastSeen: "------",
    ip: "xxx.xx.xx.xx",
    id: "39842-231",
  },
  {
    name: "Linux-Rocky",
    status: "Activo",
    os: "Linux",
    lastSeen: "------",
    ip: "xx.xx.xxx.xx",
    id: "39842-231",
  },
];

const Agentes = () => {
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const paginatedAgents = agentsData.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <div style={{minHeight: '100vh', padding: '32px', backgroundColor: '#f3f4f6', color: '#111827'}}>
      <h1 style={{fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '24px'}}>Agentes</h1>

      <div style={{backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '24px'}}>
        {/* Controles */}
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '16px'}}>
          <button style={{backgroundColor: '#e5e7eb', padding: '4px 16px', borderRadius: '6px', fontSize: '14px'}}>
            Export data
          </button>
          <select style={{backgroundColor: '#e5e7eb', padding: '4px 16px', borderRadius: '6px', fontSize: '14px'}}>
            <option>Sort by: ID</option>
            <option>Nombre</option>
          </select>
        </div>

        {/* Tabla con estilos inline */}
        <div style={{overflowX: 'auto'}}>
          <table style={{width: '100%', textAlign: 'left', fontSize: '14px', border: '1px solid #d1d5db', borderCollapse: 'collapse'}}>
            <thead style={{backgroundColor: '#f3f4f6', color: '#374151'}}>
              <tr>
                <th style={{padding: '8px 16px', border: '1px solid #d1d5db'}}>Nombre Agente</th>
                <th style={{padding: '8px 16px', border: '1px solid #d1d5db'}}>Estado</th>
                <th style={{padding: '8px 16px', border: '1px solid #d1d5db'}}>Sistema Operativo</th>
                <th style={{padding: '8px 16px', border: '1px solid #d1d5db'}}>Última conexión</th>
                <th style={{padding: '8px 16px', border: '1px solid #d1d5db'}}>IP - Agente</th>
                <th style={{padding: '8px 16px', border: '1px solid #d1d5db'}}>ID</th>
                <th style={{padding: '8px 16px', border: '1px solid #d1d5db'}}>...</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAgents.map((agent, idx) => (
                <tr key={idx} style={{borderTop: '1px solid #d1d5db'}}>
                  <td style={{padding: '8px 16px', border: '1px solid #d1d5db'}}>{agent.name}</td>
                  <td style={{padding: '8px 16px', border: '1px solid #d1d5db'}}>{agent.status}</td>
                  <td style={{padding: '8px 16px', border: '1px solid #d1d5db'}}>{agent.os}</td>
                  <td style={{padding: '8px 16px', border: '1px solid #d1d5db'}}>{agent.lastSeen}</td>
                  <td style={{padding: '8px 16px', border: '1px solid #d1d5db'}}>{agent.ip}</td>
                  <td style={{padding: '8px 16px', border: '1px solid #d1d5db'}}>{agent.id}</td>
                  <td style={{padding: '8px 16px', border: '1px solid #d1d5db', color: '#6b7280'}}>⋯</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div style={{display: 'flex', justifyContent: 'center', marginTop: '24px', gap: '8px'}}>
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              style={{
                padding: '4px 12px',
                borderRadius: '4px',
                backgroundColor: page === n ? '#1f2937' : '#d1d5db',
                color: page === n ? 'white' : '#374151',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Agentes;