import React, { useRef, useState } from 'react';
import { 
  Download, 
  FileText, 
  Shield, 
  Monitor, 
  User, 
  Clock, 
  Network,
  Server,
  Cpu,
  AlertTriangle,
  Terminal,
  HardDrive,
  Activity,
  Camera,
  Loader2
} from 'lucide-react';

const PDFGenerator = ({ report, onGeneratePDF }) => {
  const printRef = useRef();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    
    try {
      let date;
      if (dateString.includes('T')) {
        date = new Date(dateString);
      } else if (dateString.includes(' ')) {
        const mainPart = dateString.split(' ').slice(0, 2).join(' ');
        const cleanPart = mainPart.replace(/\.\d+/, '');
        date = new Date(cleanPart);
      } else {
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      
      return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      return 'Error en fecha';
    }
  };

  // Función helper para dividir texto largo
  const splitText = (text, maxWidth, pdf) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const textWidth = pdf.getTextWidth(testLine);
      
      if (textWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  };

  // Función para agregar sección de datos al PDF
  const addDataSection = (pdf, title, data, yPos) => {
    if (!data || data.length === 0) return yPos;

    const pageHeight = pdf.internal.pageSize.getHeight();
    const maxWidth = 170; // Ancho máximo para el texto
    let currentY = yPos;

    // Título de la sección
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text(title, 20, currentY);
    currentY += 10;

    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');

    // Mostrar todos los elementos
    data.forEach((item, index) => {
      // Verificar si necesitamos nueva página
      if (currentY > pageHeight - 40) {
        pdf.addPage();
        currentY = 20;
      }

      let itemText = '';
      
      if (typeof item === 'string') {
        try {
          const parsed = JSON.parse(item);
          // Si es un objeto parseado, mostrar sus propiedades principales
          if (typeof parsed === 'object' && parsed !== null) {
            const keys = Object.keys(parsed).slice(0, 5); // Primeras 5 propiedades
            itemText = keys.map(key => `${key}: ${parsed[key]}`).join(', ');
          } else {
            itemText = String(parsed);
          }
        } catch {
          itemText = item;
        }
      } else if (typeof item === 'object' && item !== null) {
        const keys = Object.keys(item).slice(0, 5); // Primeras 5 propiedades
        itemText = keys.map(key => `${key}: ${item[key]}`).join(', ');
      } else {
        itemText = String(item);
      }

      // Número del elemento
      pdf.setFont(undefined, 'bold');
      pdf.text(`${index + 1}.`, 20, currentY);
      
      // Contenido del elemento (dividido en líneas si es necesario)
      pdf.setFont(undefined, 'normal');
      const lines = splitText(itemText, maxWidth, pdf);
      
      lines.forEach((line, lineIndex) => {
        if (currentY > pageHeight - 20) {
          pdf.addPage();
          currentY = 20;
        }
        
        const xPos = lineIndex === 0 ? 28 : 25; // Indentación para líneas adicionales
        pdf.text(line, xPos, currentY);
        currentY += 5;
      });
      
      currentY += 3; // Espacio entre elementos
    });

    return currentY + 5;
  };

  // PDF completo con jsPDF solamente
  const generatePDFWithJsPDFOnly = async () => {
    try {
      const jsPDF = (await import('jspdf')).default;
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      let yPosition = 20;
      const lineHeight = 8;

      // === PORTADA ===
      pdf.setFontSize(24);
      pdf.setFont(undefined, 'bold');
      pdf.text('REPORTE DE SEGURIDAD', 20, yPosition);
      yPosition += 15;

      pdf.setFontSize(16);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Sistema: ${report.hostname}`, 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(12);
      pdf.text(`Generado: ${formatDate(new Date().toISOString())}`, 20, yPosition);
      yPosition += 20;

      // === INFORMACIÓN DEL SISTEMA ===
      pdf.setFontSize(18);
      pdf.setFont(undefined, 'bold');
      pdf.text('INFORMACIÓN DEL SISTEMA', 20, yPosition);
      yPosition += 12;

      pdf.setFontSize(12);
      pdf.setFont(undefined, 'normal');
      
      const systemInfo = [
        `Hostname: ${report.hostname}`,
        `Sistema Operativo: ${report.os} ${report.arch}`,
        `Usuario: ${report.user || 'N/A'}`,
        `Privilegios: ${report.elevated ? 'Elevado' : 'Estándar'}`,
        `Gateway: ${report.gateway || 'N/A'}`,
        `Primera conexión: ${formatDate(report.firstseen)}`,
        `Última actividad: ${formatDate(report.last_seen)}`,
        `IPs detectadas: ${report.ips?.length || 0}`,
        `Servidores DNS: ${report.dns?.length || 0}`,
        `ID del agente: ${report.agent_id || report.id || 'N/A'}`
      ];

      systemInfo.forEach(info => {
        pdf.text(info, 20, yPosition);
        yPosition += lineHeight;
      });

      yPosition += 10;

      // === RESUMEN EJECUTIVO ===
      pdf.setFontSize(18);
      pdf.setFont(undefined, 'bold');
      pdf.text('RESUMEN EJECUTIVO', 20, yPosition);
      yPosition += 12;

      pdf.setFontSize(12);
      pdf.setFont(undefined, 'normal');
      
      const summary = [
        `Total de procesos detectados: ${report.processes?.length || 0}`,
        `Total de conexiones de red: ${report.connections?.length || 0}`,
        `Total de comandos ejecutados: ${(report.commands_executed || report.commandsrun)?.length || 0}`,
        `Total de archivos exfiltrados: ${report.files_exfiltrated?.length || 0}`,
        `Total de archivos accedidos: ${report.filesaccessed?.length || 0}`,
        `Mecanismos de persistencia: ${report.persistence?.length || 0}`,
        `Detección anti-debug: ${report.antidebug ? 'SÍ' : 'NO'}`
      ];

      summary.forEach(item => {
        pdf.text(item, 20, yPosition);
        yPosition += lineHeight;
      });

      yPosition += 15;

      // === ALERTA DE SEGURIDAD ===
      if (report.antidebug) {
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(255, 0, 0); // Rojo
        pdf.text('⚠️ ALERTA DE SEGURIDAD ⚠️', 20, yPosition);
        yPosition += 8;
        
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'normal');
        pdf.text('Se detectó actividad anti-debug en este sistema', 20, yPosition);
        pdf.setTextColor(0, 0, 0); // Volver a negro
        yPosition += 15;
      }

      // Nueva página para secciones detalladas
      pdf.addPage();
      yPosition = 20;

      // === DIRECCIONES IP ===
      if (report.ips && report.ips.length > 0) {
        pdf.setFontSize(16);
        pdf.setFont(undefined, 'bold');
        pdf.text(`DIRECCIONES IP (${report.ips.length})`, 20, yPosition);
        yPosition += 10;

        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        
        report.ips.forEach((ip, index) => {
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(`${index + 1}. ${ip}`, 25, yPosition);
          yPosition += 6;
        });
        yPosition += 10;
      }

      // === SERVIDORES DNS ===
      if (report.dns && report.dns.length > 0) {
        if (yPosition > 240) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFontSize(16);
        pdf.setFont(undefined, 'bold');
        pdf.text(`SERVIDORES DNS (${report.dns.length})`, 20, yPosition);
        yPosition += 10;

        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        
        report.dns.forEach((dns, index) => {
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(`${index + 1}. ${dns}`, 25, yPosition);
          yPosition += 6;
        });
        yPosition += 10;
      }

      // === SECCIONES DE DATOS DETALLADAS ===
      
      // Procesos
      if (report.processes && report.processes.length > 0) {
        pdf.addPage();
        yPosition = addDataSection(pdf, `PROCESOS ACTIVOS (${report.processes.length})`, report.processes, 20);
      }

      // Conexiones
      if (report.connections && report.connections.length > 0) {
        if (yPosition > 200) {
          pdf.addPage();
          yPosition = 20;
        }
        yPosition = addDataSection(pdf, `CONEXIONES DE RED (${report.connections.length})`, report.connections, yPosition);
      }

      // Persistencia
      if (report.persistence && report.persistence.length > 0) {
        if (yPosition > 200) {
          pdf.addPage();
          yPosition = 20;
        }
        yPosition = addDataSection(pdf, `MECANISMOS DE PERSISTENCIA (${report.persistence.length})`, report.persistence, yPosition);
      }

      // Comandos ejecutados
      if ((report.commands_executed || report.commandsrun) && (report.commands_executed || report.commandsrun).length > 0) {
        const commands = report.commands_executed || report.commandsrun;
        if (yPosition > 200) {
          pdf.addPage();
          yPosition = 20;
        }
        yPosition = addDataSection(pdf, `COMANDOS EJECUTADOS (${commands.length})`, commands, yPosition);
      }

      // Archivos exfiltrados
      if (report.files_exfiltrated && report.files_exfiltrated.length > 0) {
        if (yPosition > 200) {
          pdf.addPage();
          yPosition = 20;
        }
        yPosition = addDataSection(pdf, `ARCHIVOS EXFILTRADOS (${report.files_exfiltrated.length})`, report.files_exfiltrated, yPosition);
      }

      // Archivos accedidos
      if (report.filesaccessed && report.filesaccessed.length > 0) {
        if (yPosition > 200) {
          pdf.addPage();
          yPosition = 20;
        }
        yPosition = addDataSection(pdf, `ARCHIVOS ACCEDIDOS (${report.filesaccessed.length})`, report.filesaccessed, yPosition);
      }

      // === FOOTER EN ÚLTIMA PÁGINA ===
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(128, 128, 128);
        pdf.text(`Página ${i} de ${pageCount}`, 20, 285);
        pdf.text(`Reporte generado: ${formatDate(new Date().toISOString())}`, 120, 285);
      }

      const fileName = `reporte_completo_${report.hostname}_${new Date().getTime()}.pdf`;
      pdf.save(fileName);
      
      return fileName;
    } catch (error) {
      console.error('Error con jsPDF completo:', error);
      throw error;
    }
  };

  const generatePDF = async () => {
    if (!report) return;

    setIsGenerating(true);
    setError(null);

    try {
      const fileName = await generatePDFWithJsPDFOnly();
      
      if (onGeneratePDF) {
        onGeneratePDF(fileName);
      }
    } catch (error) {
      console.error('Error generando PDF:', error);
      setError(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!report) {
    return (
      <div className="text-center p-4">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600">No hay reporte disponible para generar PDF</p>
      </div>
    );
  }

  // Calcular estadísticas para mostrar en preview
  const stats = {
    processes: report.processes?.length || 0,
    connections: report.connections?.length || 0,
    commands: (report.commands_executed || report.commandsrun)?.length || 0,
    exfiltrated: report.files_exfiltrated?.length || 0,
    accessed: report.filesaccessed?.length || 0,
    persistence: report.persistence?.length || 0,
    ips: report.ips?.length || 0,
    dns: report.dns?.length || 0
  };

  const totalElements = Object.values(stats).reduce((sum, count) => sum + count, 0);

  return (
    <div className="w-full">
      {/* Información del PDF que se generará */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Generador de PDF Completo</h3>
          <p className="text-sm text-blue-700">
            Se incluirán TODOS los datos del reporte ({totalElements} elementos en total)
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600 mx-auto mb-2" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Vista previa de lo que se incluirá */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-center">
          <div className="bg-white rounded p-3 border">
            <div className="text-lg font-bold text-blue-600">{stats.processes}</div>
            <div className="text-xs text-gray-600">Procesos</div>
          </div>
          <div className="bg-white rounded p-3 border">
            <div className="text-lg font-bold text-green-600">{stats.connections}</div>
            <div className="text-xs text-gray-600">Conexiones</div>
          </div>
          <div className="bg-white rounded p-3 border">
            <div className="text-lg font-bold text-orange-600">{stats.commands}</div>
            <div className="text-xs text-gray-600">Comandos</div>
          </div>
          <div className="bg-white rounded p-3 border">
            <div className="text-lg font-bold text-red-600">{stats.exfiltrated}</div>
            <div className="text-xs text-gray-600">Exfiltrados</div>
          </div>
          <div className="bg-white rounded p-3 border">
            <div className="text-lg font-bold text-purple-600">{stats.accessed}</div>
            <div className="text-xs text-gray-600">Accedidos</div>
          </div>
          <div className="bg-white rounded p-3 border">
            <div className="text-lg font-bold text-yellow-600">{stats.persistence}</div>
            <div className="text-xs text-gray-600">Persistencia</div>
          </div>
          <div className="bg-white rounded p-3 border">
            <div className="text-lg font-bold text-indigo-600">{stats.ips}</div>
            <div className="text-xs text-gray-600">IPs</div>
          </div>
          <div className="bg-white rounded p-3 border">
            <div className="text-lg font-bold text-pink-600">{stats.dns}</div>
            <div className="text-xs text-gray-600">DNS</div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={generatePDF}
            disabled={isGenerating}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 mx-auto font-semibold"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            {isGenerating ? 'Generando PDF...' : 'Generar PDF Completo'}
          </button>
          <p className="text-xs text-gray-600 mt-2">
            El PDF incluirá múltiples páginas con todos los datos del reporte
          </p>
        </div>
      </div>

      {/* Vista previa básica del sistema */}
      <div className="bg-white p-4 rounded-lg border">
        <h4 className="font-semibold text-gray-900 mb-3">Vista previa del sistema:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div><span className="font-medium">Hostname:</span> {report.hostname}</div>
          <div><span className="font-medium">SO:</span> {report.os} {report.arch}</div>
          <div><span className="font-medium">Usuario:</span> {report.user || 'N/A'}</div>
          <div><span className="font-medium">Privilegios:</span> {report.elevated ? 'Elevado' : 'Estándar'}</div>
          <div><span className="font-medium">Última actividad:</span> {formatDate(report.last_seen)}</div>
          <div><span className="font-medium">Anti-debug:</span> {report.antidebug ? 'Detectado' : 'No detectado'}</div>
        </div>
      </div>
    </div>
  );
};

export default PDFGenerator;