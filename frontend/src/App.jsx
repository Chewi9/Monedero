import { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import './App.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const API_URL = import.meta.env.VITE_API_URL || 'https://monedero-qbte.onrender.com/api';

const leerUsuarioGuardado = () => {
  try {
    return JSON.parse(localStorage.getItem('usuario')) || null;
  } catch {
    localStorage.removeItem('usuario');
    return null;
  }
};

const redondear = (valor) => {
  const numero = Number(valor);
  return Number.isNaN(numero) ? 0 : Number(numero.toFixed(4));
};

const pedir = async (ruta, opciones = {}) => {
  const respuesta = await fetch(`${API_URL}${ruta}`, opciones);
  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new Error(datos.mensaje || 'No se pudo completar la petición');
  }

  return datos;
};

function PantallaLogin({ onLogin }) {
  const [esRegistro, setEsRegistro] = useState(false);
  const [formulario, setFormulario] = useState({ nombre: '', email: '', password: '' });
  const [error, setError] = useState('');

  const manejarCambio = (e) => setFormulario({ ...formulario, [e.target.name]: e.target.value });

  const enviarFormulario = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await pedir(esRegistro ? '/auth/registro' : '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formulario)
      });
      if (esRegistro) {
        alert('Registro exitoso. Ahora inicia sesión.');
        setEsRegistro(false);
      } else {
        onLogin(data.token, data.usuario); 
      }
    } catch (error) { setError(error.message); }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">{esRegistro ? 'Crear Cuenta' : 'Iniciar Sesión'}</h2>
        {error && <p className="error-msg">{error}</p>}
        
        <form onSubmit={enviarFormulario} className="login-form">
          {esRegistro && <input type="text" name="nombre" placeholder="Tu Nombre" value={formulario.nombre} onChange={manejarCambio} required className="input-style" />}
          <input type="email" name="email" placeholder="Tu Email" value={formulario.email} onChange={manejarCambio} required className="input-style" />
          <input type="password" name="password" placeholder="Contraseña" value={formulario.password} onChange={manejarCambio} required className="input-style" />
          
          <button type="submit" className="btn-submit">
            {esRegistro ? 'Registrarse' : 'Entrar'}
          </button>
        </form>
        
        <p className="toggle-text" onClick={() => setEsRegistro(!esRegistro)}>
          {esRegistro ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
        </p>
      </div>
    </div>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [usuario, setUsuario] = useState(leerUsuarioGuardado);
  const [modoOscuro, setModoOscuro] = useState(() => localStorage.getItem('modoOscuro') === 'true');

  const [vista, setVista] = useState('calendario'); 
  const [mesesBalance, setMesesBalance] = useState('1'); 

  const [transacciones, setTransacciones] = useState([]);
  const [mostrarModalFormulario, setMostrarModalFormulario] = useState(false);
  const [mostrarModalPerfil, setMostrarModalPerfil] = useState(false); 
  const [nuevoNombre, setNuevoNombre] = useState('');
  
  const [diaSeleccionado, setDiaSeleccionado] = useState(null); 
  const [idEnEdicion, setIdEnEdicion] = useState(null); 
  const [filtroGrafica, setFiltroGrafica] = useState('total'); 
  const [fechaCalendario, setFechaCalendario] = useState(new Date());

  const [categorias, setCategorias] = useState(() => {
    const guardadas = localStorage.getItem('categorias');
    return guardadas ? JSON.parse(guardadas) : ['Comida', 'Ocio', 'Transporte', 'Hogar', 'Salario', 'Otros'];
  });
  const [nuevaCategoria, setNuevaCategoria] = useState('');

  const hoy = new Date().toISOString().split('T')[0];
  const [formulario, setFormulario] = useState({ descripcion: '', cantidad: '', categoria: '', fecha: hoy, tipo: 'gasto', metodoPago: 'tarjeta' });

  const COLORES = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19A3', '#e91e63', '#9c27b0'];

  const chartBorder = modoOscuro ? '#1e1e1e' : '#ffffff'; 

  useEffect(() => {
    localStorage.setItem('modoOscuro', modoOscuro);
    if (modoOscuro) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [modoOscuro]);

  useEffect(() => {
    if (token) {
      fetch(`${API_URL}/transacciones`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(datos => { if (Array.isArray(datos)) setTransacciones(datos); })
      .catch(err => console.error('Error:', err));
    }
  }, [token]);

  if (!token) return <PantallaLogin onLogin={(t, u) => { localStorage.setItem('token', t); localStorage.setItem('usuario', JSON.stringify(u)); setToken(t); setUsuario(u); }} />;

  const cerrarSesion = () => { localStorage.removeItem('token'); localStorage.removeItem('usuario'); setToken(null); setUsuario(null); setTransacciones([]); };

  const guardarPerfil = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/auth/perfil`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ nombre: nuevoNombre })
      });
      const data = await res.json();
      setUsuario(data);
      localStorage.setItem('usuario', JSON.stringify(data));
      setMostrarModalPerfil(false);
    } catch (error) { console.error('No se pudo actualizar el perfil:', error); }
  };

  const manejarCambio = (e) => setFormulario({ ...formulario, [e.target.name]: e.target.value });

  const agregarCategoria = (e) => {
    e.preventDefault();
    if (nuevaCategoria && !categorias.includes(nuevaCategoria)) {
      const actualizadas = [...categorias, nuevaCategoria];
      setCategorias(actualizadas);
      localStorage.setItem('categorias', JSON.stringify(actualizadas));
      setNuevaCategoria('');
    }
  };

  const guardarTransaccion = async (e) => {
    e.preventDefault();
    try {
      if (idEnEdicion) {
        const res = await fetch(`${API_URL}/transacciones/${idEnEdicion}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(formulario)
        });
        const actualizada = await res.json();
        setTransacciones(transacciones.map(t => t._id === idEnEdicion ? actualizada : t));
      } else {
        const res = await fetch(`${API_URL}/transacciones`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(formulario)
        });
        const nueva = await res.json();
        setTransacciones([...transacciones, nueva]); 
      }
      setMostrarModalFormulario(false); setIdEnEdicion(null); setFormulario({ descripcion: '', cantidad: '', categoria: '', fecha: hoy, tipo: 'gasto', metodoPago: 'tarjeta' }); 
    } catch (error) { console.error('Error:', error); }
  };

  const eliminarTransaccion = async (id) => {
    if (window.confirm('¿Seguro que quieres borrar esto?')) {
      await fetch(`${API_URL}/transacciones/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` }});
      setTransacciones(transacciones.filter(t => t._id !== id));
    }
  };

  const transaccionesSeguras = Array.isArray(transacciones) ? transacciones : [];
  
  const fechaLimite = new Date();
  if (filtroGrafica === '7') fechaLimite.setDate(fechaLimite.getDate() - 7);
  if (filtroGrafica === '30') fechaLimite.setDate(fechaLimite.getDate() - 30);
  const transFiltradas = filtroGrafica === 'total' ? transaccionesSeguras : transaccionesSeguras.filter(t => new Date(t.fecha) >= fechaLimite);

  const totalIngresos = redondear(transFiltradas.filter(t => t.tipo === 'ingreso').reduce((acc, curr) => acc + (Number(curr.cantidad) || 0), 0));
  const totalGastos = redondear(transFiltradas.filter(t => t.tipo === 'gasto').reduce((acc, curr) => acc + (Number(curr.cantidad) || 0), 0));
  const balanceTotal = redondear(totalIngresos - totalGastos);

  const categoriasConGastos = categorias.map(cat => {
    const totalCat = transFiltradas.filter(t => t.tipo === 'gasto' && t.categoria === cat).reduce((acc, curr) => acc + (Number(curr.cantidad) || 0), 0);
    return { name: cat, value: redondear(totalCat) };
  }).filter(d => d.value > 0); 
  const dataParaChartJs = { labels: categoriasConGastos.map(c => c.name), datasets: [{ data: categoriasConGastos.map(c => c.value), backgroundColor: COLORES, borderColor: chartBorder, borderWidth: 2 }] };

  const cambiarMes = (inc) => setFechaCalendario(new Date(fechaCalendario.getFullYear(), fechaCalendario.getMonth() + inc, 1));
  const añoActual = fechaCalendario.getFullYear();
  const mesActual = fechaCalendario.getMonth();
  const diasEnMes = new Date(añoActual, mesActual + 1, 0).getDate();
  const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const primerDiaDelMes = new Date(añoActual, mesActual, 1).getDay();
  const espaciosVacios = primerDiaDelMes === 0 ? 6 : primerDiaDelMes - 1;
  const nombresDias = ['Lun', 'Mar', 'Mier', 'Jue', 'Vie', 'Sab', 'Dom'];

  return (
    <div className="app-wrapper">
      
      <div className="navbar">
        <h2 style={{ margin: 0 }}>Mis Finanzas</h2>
        <div className="navbar-actions">
          <button onClick={() => setModoOscuro(!modoOscuro)} className="icon-btn">{modoOscuro ? '☀' : '☾'}</button>
          <button onClick={() => { setNuevoNombre(usuario.nombre); setMostrarModalPerfil(true); }} className="icon-btn">⚙️</button>
          <button onClick={cerrarSesion} className="btn-logout">Salir</button>
        </div>
      </div>

      <div className="view-toggles">
        <button onClick={() => setVista('calendario')} className={`btn-navegacion ${vista === 'calendario' ? 'activo' : ''}`}>📅 Calendario</button>
        <button onClick={() => setVista('balance')} className={`btn-navegacion ${vista === 'balance' ? 'activo' : ''}`}>📊 Balance Detallado</button>
      </div>

      {vista === 'calendario' ? (
        <div className="calendario-view">
          <div className="calendario-card">
            <div className="calendario-header">
              <button onClick={() => cambiarMes(-1)} className="btn-calendario">⬅</button>
              <h2 style={{ margin: 0 }}>{nombresMeses[mesActual]} {añoActual}</h2>
              <button onClick={() => cambiarMes(1)} className="btn-calendario">➡</button>
            </div>

            <div className="calendario-grid">
              {nombresDias.map(nombreDia => (
                <div key={nombreDia} style={{ textAlign: 'center', fontWeight: 'bold', padding: '5px', color: 'var(--texto-secundario)' }}>{nombreDia}</div>
              ))}

              {Array.from({ length: espaciosVacios }).map((_, i) => (
                <div key={`vacio-${i}`} style={{ minHeight: '70px' }}></div>
              ))}

              {Array.from({ length: diasEnMes }).map((_, i) => {
                const dia = i + 1;
                const fechaString = `${añoActual}-${String(mesActual + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
                const transDelDia = transaccionesSeguras.filter(t => t.fecha && t.fecha.startsWith(fechaString));
                const ingresosDia = redondear(transDelDia.filter(t => t.tipo === 'ingreso').reduce((sum, t) => sum + (Number(t.cantidad) || 0), 0));
                const gastosDia = redondear(transDelDia.filter(t => t.tipo === 'gasto').reduce((sum, t) => sum + (Number(t.cantidad) || 0), 0));
                const esHoy = fechaString === hoy;

                return (
                  <div key={dia} onClick={() => setDiaSeleccionado(fechaString)} className={`dia-cell ${esHoy ? 'hoy' : ''}`}>
                    <span className={`dia-numero ${esHoy ? 'hoy' : ''}`}>{dia}</span>
                    <div className="dia-cantidades">
                      {ingresosDia > 0 && <span className="text-ingreso">+{ingresosDia}</span>}
                      {gastosDia > 0 && <span className="text-gasto">-{gastosDia}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="resumen-card">
            <div className="resumen-header">
              <h2>Resumen</h2>
              <select value={filtroGrafica} onChange={(e) => setFiltroGrafica(e.target.value)} className="input-style" style={{ padding: '5px' }}>
                <option value="total">Total</option>
                <option value="30">30 días</option>
                <option value="7">7 días</option>
              </select>
            </div>
            <h1 className={`balance-total ${balanceTotal >= 0 ? 'balance-positivo' : 'balance-negativo'}`}>
              {balanceTotal >= 0 ? '+' : ''}{balanceTotal}€
            </h1>
            <div className="chart-container">
              {categoriasConGastos.length > 0 ? (
                <div className="chart-wrapper">
                  <Pie data={dataParaChartJs} options={{ plugins: { legend: { position: 'bottom', labels: { color: modoOscuro ? '#e0e0e0' : '#333333' } } } }} />
                </div>
              ) : <p className="empty-msg">No hay gastos en este periodo</p>}
            </div>
          </div>
        </div>
      ) : (
        
        <div className="balance-view">
          
          <div className="balance-toolbar">
            <h2 style={{ margin: 0 }}>Análisis Mensual</h2>
            <select value={mesesBalance} onChange={(e) => setMesesBalance(e.target.value)} className="input-style">
              <option value="1">Mes actual</option>
              <option value="2">Últimos 2 meses</option>
              <option value="3">Últimos 3 meses</option>
              <option value="6">Últimos 6 meses</option>
              <option value="12">Últimos 12 meses</option>
            </select>
          </div>

          <div className="months-grid">
            
            {Array.from({ length: parseInt(mesesBalance) }).map((_, i) => {
              const fechaBucle = new Date();
              fechaBucle.setMonth(fechaBucle.getMonth() - i);
              const mesLoop = fechaBucle.getMonth();
              const añoLoop = fechaBucle.getFullYear();
              
              const transDelMes = transaccionesSeguras.filter(t => {
                if(!t.fecha) return false;
                const dt = new Date(t.fecha);
                return dt.getFullYear() === añoLoop && dt.getMonth() === mesLoop;
              });

              const gastosTarjeta = redondear(transDelMes.filter(t => t.tipo === 'gasto' && t.metodoPago === 'tarjeta').reduce((acc, curr) => acc + (Number(curr.cantidad) || 0), 0));
              const gastosEfectivo = redondear(transDelMes.filter(t => t.tipo === 'gasto' && t.metodoPago === 'efectivo').reduce((acc, curr) => acc + (Number(curr.cantidad) || 0), 0));
              const ingresosMes = redondear(transDelMes.filter(t => t.tipo === 'ingreso').reduce((acc, curr) => acc + (Number(curr.cantidad) || 0), 0));
              const gastosMes = redondear(transDelMes.filter(t => t.tipo === 'gasto').reduce((acc, curr) => acc + (Number(curr.cantidad) || 0), 0));
              const balanceMes = redondear(ingresosMes - gastosMes);

              const catGastos = categorias.map(cat => {
                const totalCat = transDelMes.filter(t => t.tipo === 'gasto' && t.categoria === cat).reduce((acc, curr) => acc + (Number(curr.cantidad) || 0), 0);
                return { name: cat, value: redondear(totalCat) };
              }).filter(data => data.value > 0); 
              
              const dataChart = { labels: catGastos.map(c => c.name), datasets: [{ data: catGastos.map(c => c.value), backgroundColor: COLORES, borderColor: chartBorder, borderWidth: 2 }] };

              return (
                <div key={i} className="month-card">
                  <h3 className="month-title">{nombresMeses[mesLoop]} {añoLoop}</h3>
                  <p className={`month-balance ${balanceMes >= 0 ? 'balance-positivo' : 'balance-negativo'}`}>
                    Balance: {balanceMes >= 0 ? '+' : ''}{balanceMes}€
                  </p>
                  
                  <div className="payment-methods">
                    <div className="payment-col">
                      <small className="payment-label">💳 Tarjeta</small>
                      <div className="payment-amount">-{gastosTarjeta}€</div>
                    </div>
                    <div className="payment-divider"></div>
                    <div className="payment-col">
                      <small className="payment-label">💵 Efectivo</small>
                      <div className="payment-amount">-{gastosEfectivo}€</div>
                    </div>
                  </div>

                  <div className="month-chart">
                    {catGastos.length > 0 ? (
                       <Pie data={dataChart} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: modoOscuro ? '#e0e0e0' : '#333333', boxWidth: 12, font: {size: 11} } } } }} />
                    ) : (
                      <div className="empty-msg" style={{ display: 'flex', alignItems: 'center' }}>Sin gastos registrados</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <button onClick={() => { setIdEnEdicion(null); setFormulario({ descripcion: '', cantidad: '', categoria: '', fecha: hoy, tipo: 'gasto', metodoPago: 'tarjeta' }); setMostrarModalFormulario(true); }} className="fab-btn">
        +
      </button>

      {diaSeleccionado && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button onClick={() => setDiaSeleccionado(null)} className="close-btn">✖</button>
            <h2>Movimientos del {diaSeleccionado}</h2>
            <ul className="modal-list">
              {transaccionesSeguras.filter(t => t.fecha && t.fecha.startsWith(diaSeleccionado)).length > 0 ? 
                transaccionesSeguras.filter(t => t.fecha && t.fecha.startsWith(diaSeleccionado)).map(t => (
                  <li key={t._id} className="modal-list-item">
                    <div className="item-details">
                      <span><strong>{t.descripcion}</strong> <small>({t.metodoPago === 'efectivo' ? '💵' : '💳'})</small></span>
                      <small style={{ color: 'var(--texto-secundario)' }}>{t.categoria}</small>
                    </div>
                    <div className="item-actions">
                      <span className={t.tipo === 'ingreso' ? 'text-ingreso' : 'text-gasto'} style={{ fontSize: '1rem' }}>
                        {t.tipo === 'ingreso' ? '+' : '-'}{redondear(t.cantidad)}€
                      </span>
                      <button onClick={() => { setFormulario({ descripcion: t.descripcion, cantidad: t.cantidad, categoria: t.categoria, fecha: t.fecha.split('T')[0], tipo: t.tipo, metodoPago: t.metodoPago || 'tarjeta' }); setIdEnEdicion(t._id); setDiaSeleccionado(null); setMostrarModalFormulario(true); }} className="btn-accion">✏️️</button>
                      <button onClick={() => eliminarTransaccion(t._id)} className="btn-accion">🗑️</button>
                    </div>
                  </li>
                )) : <p className="empty-msg">No hay movimientos.</p>
              }
            </ul>
          </div>
        </div>
      )}

      {mostrarModalFormulario && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button onClick={() => setMostrarModalFormulario(false)} className="close-btn">✖</button>
            <h2>{idEnEdicion ? 'Editar Movimiento' : 'Nuevo Movimiento'}</h2>
            <form onSubmit={guardarTransaccion} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              <div className="form-group-inline">
                <label><input type="radio" name="tipo" value="gasto" checked={formulario.tipo === 'gasto'} onChange={manejarCambio} /> 🔴 Gasto</label>
                <label><input type="radio" name="tipo" value="ingreso" checked={formulario.tipo === 'ingreso'} onChange={manejarCambio} /> 🟢 Ingreso</label>
              </div>

              <input type="text" name="descripcion" placeholder="Título" value={formulario.descripcion} onChange={manejarCambio} required className="input-style" />
              
              <div className="form-row">
                <input type="number" step="0.0001" name="cantidad" placeholder="Cantidad" value={formulario.cantidad} onChange={manejarCambio} required className="input-style flex-1" />
                <input type="date" name="fecha" value={formulario.fecha} onChange={manejarCambio} required className="input-style flex-1" />
              </div>

              {formulario.tipo === 'gasto' && (
                <div className="radio-group">
                  <label style={{ cursor: 'pointer' }}><input type="radio" name="metodoPago" value="tarjeta" checked={formulario.metodoPago === 'tarjeta'} onChange={manejarCambio} /> 💳 Tarjeta</label>
                  <label style={{ cursor: 'pointer' }}><input type="radio" name="metodoPago" value="efectivo" checked={formulario.metodoPago === 'efectivo'} onChange={manejarCambio} /> 💵 Efectivo</label>
                </div>
              )}

              <select name="categoria" value={formulario.categoria} onChange={manejarCambio} required className="input-style">
                <option value="" disabled>Categoría...</option>
                {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>

              <div className="form-row">
                <input type="text" placeholder="Nueva categoría..." value={nuevaCategoria} onChange={(e) => setNuevaCategoria(e.target.value)} className="input-style flex-1" />
                <button type="button" onClick={agregarCategoria} className="btn-add">Añadir</button>
              </div>

              <button type="submit" className={`btn-guardar ${idEnEdicion ? 'actualizar' : (formulario.tipo === 'ingreso' ? 'ingreso' : 'gasto')}`}>
                {idEnEdicion ? 'Actualizar' : 'Guardar'}
              </button>
            </form>
          </div>
        </div>
      )}
      
      {mostrarModalPerfil && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button onClick={() => setMostrarModalPerfil(false)} className="close-btn">✖</button>
            <h2>Editar Perfil</h2>
            <form onSubmit={guardarPerfil} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
              <input type="text" placeholder="Nuevo nombre" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} required className="input-style" />
              <button type="submit" className="btn-submit" style={{ backgroundColor: '#2196F3' }}>Guardar Nombre</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;