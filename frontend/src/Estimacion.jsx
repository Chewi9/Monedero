import { useState } from 'react';

const NOMBRES_MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const redondear2 = (valor) => {
  const num = Number(valor);
  return Number.isNaN(num) ? 0 : Number(num.toFixed(2));
};

export function Estimacion({ transacciones }) {
  const [filtroMeses, setFiltroMeses] = useState('todos');

  // 1. Saldo total disponible actual (ingresos - gastos)
  const totalIngresos = transacciones
    .filter((t) => t.tipo === 'ingreso')
    .reduce((acc, t) => acc + (Number(t.cantidad) || 0), 0);

  const totalGastos = transacciones
    .filter((t) => t.tipo === 'gasto')
    .reduce((acc, t) => acc + (Number(t.cantidad) || 0), 0);

  const saldoActual = redondear2(totalIngresos - totalGastos);

  // 2. Agrupar gastos por mes (AAAA-MM)
  const hoy = new Date();
  const claveMesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  const mapaMeses = {};

  transacciones.forEach((t) => {
    if (!t.fecha) return;
    const dt = new Date(t.fecha);
    if (Number.isNaN(dt.getTime())) return;

    const clave = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    if (!mapaMeses[clave]) {
      mapaMeses[clave] = {
        clave,
        anio: dt.getFullYear(),
        mes: dt.getMonth(),
        gastos: 0,
        tarjeta: 0,
        efectivo: 0,
      };
    }

    if (t.tipo === 'gasto') {
      const cant = Number(t.cantidad) || 0;
      mapaMeses[clave].gastos += cant;
      if (t.metodoPago === 'tarjeta') mapaMeses[clave].tarjeta += cant;
      if (t.metodoPago === 'efectivo') mapaMeses[clave].efectivo += cant;
    }
  });

  // 3. Filtrar meses anteriores cerrados (del más reciente al más antiguo)
  let mesesHistoricos = Object.values(mapaMeses)
    .filter((m) => m.clave < claveMesActual)
    .sort((a, b) => b.clave.localeCompare(a.clave));

  if (filtroMeses !== 'todos') {
    mesesHistoricos = mesesHistoricos.slice(0, Number(filtroMeses));
  }

  let esProvisional = false;
  if (mesesHistoricos.length === 0 && mapaMeses[claveMesActual]) {
    mesesHistoricos = [mapaMeses[claveMesActual]];
    esProvisional = true;
  }

  // 4. Medias y cálculo de meses restantes
  const numMeses = mesesHistoricos.length;
  const sumaGastosHistoricos = mesesHistoricos.reduce((acc, m) => acc + m.gastos, 0);
  const gastoMedioMensual = numMeses > 0 ? redondear2(sumaGastosHistoricos / numMeses) : 0;
  const gastoMedioDiario = gastoMedioMensual > 0 ? redondear2(gastoMedioMensual / 30) : 0;

  // 5. Generar lista de todos los meses restantes hasta que el saldo sea 0€
  const proyeccionMeses = [];
  let superaLimite = false;

  if (saldoActual > 0 && gastoMedioMensual > 0) {
    let saldoRestante = saldoActual;
    let i = 0;
    const maxMeses = 120; // Límite de seguridad de 10 años

    while (saldoRestante > 0 && i < maxMeses) {
      const fechaMes = new Date(hoy.getFullYear(), hoy.getMonth() + i, 1);
      const gastoEsteMes = redondear2(Math.min(saldoRestante, gastoMedioMensual));
      saldoRestante = redondear2(saldoRestante - gastoEsteMes);

      proyeccionMeses.push({
        id: i,
        nombreMes: `${NOMBRES_MESES[fechaMes.getMonth()]} ${fechaMes.getFullYear()}`,
        gastoEstimado: gastoEsteMes,
        saldoTrasMes: saldoRestante,
        esUltimo: saldoRestante === 0,
      });

      i++;
    }

    if (saldoRestante > 0) {
      superaLimite = true;
    }
  }

  let tituloDuracion = 'Sin datos suficientes';
  let subtituloDuracion = 'Registra gastos de meses anteriores para calcular una estimación.';
  let colorResultado = '#2196F3';

  if (numMeses > 0) {
    if (saldoActual <= 0) {
      tituloDuracion = '0 meses (0€)';
      subtituloDuracion = 'Tu saldo actual disponible es 0€ o negativo.';
      colorResultado = '#F44336';
    } else if (gastoMedioMensual <= 0) {
      tituloDuracion = 'Indefinido';
      subtituloDuracion = 'No registraste gastos en los meses anteriores seleccionados.';
      colorResultado = '#4CAF50';
    } else {
      const mesesExactos = saldoActual / gastoMedioMensual;
      const mesesEnteros = Math.floor(mesesExactos);
      const diasRestantes = Math.round((mesesExactos - mesesEnteros) * 30);
      const diasTotales = Math.floor(saldoActual / (gastoMedioMensual / 30));

      if (mesesEnteros > 0) {
        tituloDuracion = `${mesesEnteros} ${mesesEnteros === 1 ? 'mes' : 'meses'}`;
        if (diasRestantes > 0) tituloDuracion += ` y ${diasRestantes} días`;
      } else {
        tituloDuracion = `${diasTotales} ${diasTotales === 1 ? 'día' : 'días'}`;
      }

      const mesFinal = proyeccionMeses[proyeccionMeses.length - 1];
      subtituloDuracion = superaLimite
        ? 'A este ritmo, tu saldo dura más de 10 años.'
        : `Tu dinero se agotaría en ${mesFinal.nombreMes} (${proyeccionMeses.length} ${proyeccionMeses.length === 1 ? 'mes' : 'meses'} en el calendario).`;

      if (diasTotales < 30) colorResultado = '#F44336';
      else if (diasTotales < 90) colorResultado = '#FF9800';
      else colorResultado = '#4CAF50';
    }
  }

  return (
    <div className="balance-view">
      <div className="balance-toolbar">
        <h2 style={{ margin: 0 }}>Estimación de Duración</h2>
        <select
          value={filtroMeses}
          onChange={(e) => setFiltroMeses(e.target.value)}
          className="input-style"
        >
          <option value="todos">Media de todos los meses anteriores</option>
          <option value="3">Media de últimos 3 meses</option>
          <option value="6">Media de últimos 6 meses</option>
          <option value="12">Media de últimos 12 meses</option>
        </select>
      </div>

      <div className="estimacion-aviso">
        ℹ️ <strong>Cálculo orientativo:</strong> Esta proyección es una <strong>estimación</strong> basada en tu gasto medio mensual de los meses anteriores{esProvisional ? ' (usando el mes actual de forma provisional por falta de historial previo)' : ''}. No incluye ingresos futuros ni imprevistos.
      </div>

      <div className="estimacion-hero">
        <span className="estimacion-label">Con tu saldo actual, el dinero te durará aproximadamente</span>
        <h1 className="estimacion-tiempo" style={{ color: colorResultado }}>
          {tituloDuracion}
        </h1>
        <p className="estimacion-subtitulo">{subtituloDuracion}</p>
      </div>

      <div className="estimacion-kpis">
        <div className="month-card estimacion-kpi-card">
          <small className="payment-label">💰 Saldo actual disponible</small>
          <div className="estimacion-kpi-valor" style={{ color: saldoActual >= 0 ? '#4CAF50' : '#F44336' }}>
            {saldoActual >= 0 ? '+' : ''}{saldoActual}€
          </div>
        </div>

        <div className="month-card estimacion-kpi-card">
          <small className="payment-label">📉 Gasto estimado por mes</small>
          <div className="estimacion-kpi-valor text-gasto">
            -{gastoMedioMensual}€
          </div>
        </div>

        <div className="month-card estimacion-kpi-card">
          <small className="payment-label">📆 Gasto estimado por día</small>
          <div className="estimacion-kpi-valor text-gasto">
            -{gastoMedioDiario}€
          </div>
        </div>
      </div>

      {/* PROYECCIÓN DE TODOS LOS MESES RESTANTES HASTA LLEGAR A 0€ */}
      {proyeccionMeses.length > 0 && (
        <div className="month-card" style={{ marginBottom: '20px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px' }}>
            📅 Meses restantes hasta llegar a 0€ ({proyeccionMeses.length} {proyeccionMeses.length === 1 ? 'mes' : 'meses'})
          </h3>

          <ul className="modal-list" style={{ maxHeight: 'none' }}>
            {proyeccionMeses.map((item) => (
              <li
                key={item.id}
                className="modal-list-item"
                style={item.esUltimo ? { borderLeft: '4px solid #F44336', paddingLeft: '12px' } : {}}
              >
                <div>
                  <strong>{item.nombreMes}</strong>
                  <div style={{ fontSize: '0.85rem', color: 'var(--texto-secundario)', marginTop: '4px' }}>
                    {item.esUltimo
                      ? '⚠️ Aquí se agotaría el saldo disponible'
                      : `Saldo al acabar el mes: ${item.saldoTrasMes}€`}
                  </div>
                </div>

                <div style={{ textAlign: 'right', alignSelf: 'center' }}>
                  <div className="text-gasto" style={{ fontSize: '1.05rem' }}>
                    -{item.gastoEstimado}€
                  </div>
                  <small style={{ color: item.esUltimo ? '#F44336' : 'var(--texto-secundario)', fontWeight: 'bold' }}>
                    Quedan: {item.saldoTrasMes}€
                  </small>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* HISTORIAL USADO PARA CALCULAR LA MEDIA */}
      <div className="month-card">
        <h3 style={{ marginTop: 0, marginBottom: '15px' }}>
          📊 Meses anteriores usados para calcular la media ({numMeses})
        </h3>

        {mesesHistoricos.length > 0 ? (
          <ul className="modal-list" style={{ maxHeight: 'none' }}>
            {mesesHistoricos.map((m) => (
              <li key={m.clave} className="modal-list-item">
                <div>
                  <strong>
                    {NOMBRES_MESES[m.mes]} {m.anio} {m.clave === claveMesActual ? '(En curso)' : ''}
                  </strong>
                  <div style={{ fontSize: '0.85rem', color: 'var(--texto-secundario)', marginTop: '4px' }}>
                    💳 {redondear2(m.tarjeta)}€ &nbsp;|&nbsp; 💵 {redondear2(m.efectivo)}€
                  </div>
                </div>
                <span className="text-gasto" style={{ fontSize: '1.05rem', alignSelf: 'center' }}>
                  -{redondear2(m.gastos)}€
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-msg">No hay gastos registrados todavía.</p>
        )}
      </div>
    </div>
  );
}