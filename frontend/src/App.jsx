import { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

// --- 1. PANTALLA DE LOGIN ---
function PantallaLogin({ onLogin, tema }) {
  const [esRegistro, setEsRegistro] = useState(false);
  const [formulario, setFormulario] = useState({ nombre: '', email: '', password: '' });
  const [error, setError] = useState('');

  const manejarCambio = (e) => setFormulario({ ...formulario, [e.target.name]: e.target.value });

  const enviarFormulario = async (e) => {
    e.preventDefault();
    setError('');
    const url = esRegistro ? 'https://monedero-qbte.onrender.com/api/auth/registro' : 'https://monedero-qbte.onrender.com/api/auth/login';
    
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formulario) });
      const data = await res.json();
      if (!res.ok) { setError(data.mensaje || 'Error en la petición'); return; }

      if (esRegistro) {
        alert('Registro exitoso. Ahora inicia sesión.');
        setEsRegistro(false);
      } else {
        onLogin(data.token, data.usuario); 
      }
    } catch (err) { setError('Error de conexión con el servidor'); }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: tema.bgPrincipal }}>
      <div style={{ backgroundColor: tema.bgPanel, padding: '40px', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', width: '350px', color: tema.texto }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>{esRegistro ? 'Crear Cuenta' : 'Iniciar Sesión'}</h2>
        {error && <p style={{ color: '#d32f2f', textAlign: 'center', fontSize: '0.9rem', backgroundColor: '#ffebee', padding: '10px', borderRadius: '5px' }}>{error}</p>}
        
        <form onSubmit={enviarFormulario} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
          {esRegistro && <input type="text" name="nombre" placeholder="Tu Nombre" value={formulario.nombre} onChange={manejarCambio} required style={{...inputStyle, backgroundColor: tema.inputBg, color: tema.texto, borderColor: tema.borde}} />}
          <input type="email" name="email" placeholder="Tu Email" value={formulario.email} onChange={manejarCambio} required style={{...inputStyle, backgroundColor: tema.inputBg, color: tema.texto, borderColor: tema.borde}} />
          <input type="password" name="password" placeholder="Contraseña" value={formulario.password} onChange={manejarCambio} required style={{...inputStyle, backgroundColor: tema.inputBg, color: tema.texto, borderColor: tema.borde}} />
          
          <button type="submit" style={{ padding: '12px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }}>
            {esRegistro ? 'Registrarse' : 'Entrar'}
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem', cursor: 'pointer', color: '#2196F3', fontWeight: 'bold' }} onClick={() => setEsRegistro(!esRegistro)}>
          {esRegistro ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
        </p>
      </div>
    </div>
  );
}

// --- 2. APLICACIÓN PRINCIPAL ---
function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [usuario, setUsuario] = useState(JSON.parse(localStorage.getItem('usuario')) || null);

  // ESTADO DEL MODO OSCURO (Guardado en memoria)
  const [modoOscuro, setModoOscuro] = useState(() => localStorage.getItem('modoOscuro') === 'true');

  const [transacciones, setTransacciones] = useState([]);
  const [mostrarModalFormulario, setMostrarModalFormulario] = useState(false);
  const [mostrarModalPerfil, setMostrarModalPerfil] = useState(false); // Modal para editar nombre
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
  const [formulario, setFormulario] = useState({ descripcion: '', cantidad: '', categoria: '', fecha: hoy, tipo: 'gasto' });

  const COLORES = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19A3', '#e91e63', '#9c27b0'];

  // COLORES DINÁMICOS SEGÚN EL TEMA
  const tema = {
    bgPrincipal: modoOscuro ? '#121212' : '#f5f5f5',
    bgPanel: modoOscuro ? '#1e1e1e' : '#ffffff',
    texto: modoOscuro ? '#e0e0e0' : '#333333',
    textoSecundario: modoOscuro ? '#aaa' : '#666',
    borde: modoOscuro ? '#333' : '#eee',
    bgHover: modoOscuro ? '#2c2c2c' : '#fafafa',
    inputBg: modoOscuro ? '#2d2d2d' : '#ffffff',
    diaHoy: modoOscuro ? '#37474f' : '#e2e8f0', // Color del día actual
  };

  useEffect(() => {
    localStorage.setItem('modoOscuro', modoOscuro);
    document.body.style.backgroundColor = tema.bgPrincipal; // Aplica fondo a toda la página
  }, [modoOscuro, tema.bgPrincipal]);

  useEffect(() => {
    if (token) {
      fetch('https://monedero-qbte.onrender.com/api/transacciones', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(datos => { if (Array.isArray(datos)) setTransacciones(datos); })
      .catch(err => console.error('Error:', err));
    }
  }, [token]);

  if (!token) return <PantallaLogin onLogin={(t, u) => { localStorage.setItem('token', t); localStorage.setItem('usuario', JSON.stringify(u)); setToken(t); setUsuario(u); }} tema={tema} />;

  const cerrarSesion = () => { localStorage.removeItem('token'); localStorage.removeItem('usuario'); setToken(null); setUsuario(null); setTransacciones([]); };

  // ACTUALIZAR PERFIL
  const guardarPerfil = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('https://monedero-qbte.onrender.com/api/auth/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nombre: nuevoNombre })
      });
      const data = await res.json();
      setUsuario(data);
      localStorage.setItem('usuario', JSON.stringify(data));
      setMostrarModalPerfil(false);
    } catch (error) { console.error('Error al actualizar perfil'); }
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
        const res = await fetch(`https://monedero-qbte.onrender.com/api/transacciones/${idEnEdicion}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(formulario)
        });
        const actualizada = await res.json();
        setTransacciones(transacciones.map(t => t._id === idEnEdicion ? actualizada : t));
      } else {
        const res = await fetch('https://monedero-qbte.onrender.com/api/transacciones', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(formulario)
        });
        const nueva = await res.json();
        setTransacciones([...transacciones, nueva]); 
      }
      setMostrarModalFormulario(false); setIdEnEdicion(null); setFormulario({ descripcion: '', cantidad: '', categoria: '', fecha: hoy, tipo: 'gasto' }); 
    } catch (error) { console.error('Error:', error); }
  };

  const eliminarTransaccion = async (id) => {
    if (window.confirm('¿Seguro que quieres borrar esto?')) {
      await fetch(`https://monedero-qbte.onrender.com/api/transacciones/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }});
      setTransacciones(transacciones.filter(t => t._id !== id));
    }
  };

  const transaccionesSeguras = Array.isArray(transacciones) ? transacciones : [];
  
  const fechaLimite = new Date();
  if (filtroGrafica === '7') fechaLimite.setDate(fechaLimite.getDate() - 7);
  if (filtroGrafica === '30') fechaLimite.setDate(fechaLimite.getDate() - 30);
  const transFiltradas = filtroGrafica === 'total' ? transaccionesSeguras : transaccionesSeguras.filter(t => new Date(t.fecha) >= fechaLimite);

  const totalIngresos = transFiltradas.filter(t => t.tipo === 'ingreso').reduce((acc, curr) => acc + (Number(curr.cantidad) || 0), 0);
  const totalGastos = transFiltradas.filter(t => t.tipo === 'gasto').reduce((acc, curr) => acc + (Number(curr.cantidad) || 0), 0);
  const balanceTotal = totalIngresos - totalGastos;

  const categoriasConGastos = categorias.map(cat => {
    const totalCat = transFiltradas.filter(t => t.tipo === 'gasto' && t.categoria === cat).reduce((acc, curr) => acc + (Number(curr.cantidad) || 0), 0);
    return { name: cat, value: totalCat };
  }).filter(d => d.value > 0); 
  const dataParaChartJs = { labels: categoriasConGastos.map(c => c.name), datasets: [{ data: categoriasConGastos.map(c => c.value), backgroundColor: COLORES, borderColor: tema.bgPanel, borderWidth: 2 }] };

  const cambiarMes = (inc) => setFechaCalendario(new Date(fechaCalendario.getFullYear(), fechaCalendario.getMonth() + inc, 1));
  const añoActual = fechaCalendario.getFullYear();
  const mesActual = fechaCalendario.getMonth();
  const diasEnMes = new Date(añoActual, mesActual + 1, 0).getDate();
  const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: tema.bgPrincipal, color: tema.texto, minHeight: '100vh', transition: '0.3s' }}>
      
      {/* NAVBAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px', backgroundColor: tema.bgPanel, boxShadow: '0 2px 5px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Mis Finanzas</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={() => setModoOscuro(!modoOscuro)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>
            {modoOscuro ? '☀' : '☾'}
          </button>
          <button onClick={() => { setNuevoNombre(usuario.nombre); setMostrarModalPerfil(true); }} style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>⚙️</button>
          <button onClick={cerrarSesion} style={{ padding: '8px 15px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Salir</button>
        </div>
      </div>

      <div style={{ display: 'flex', padding: '0 20px 20px', gap: '30px', flexWrap: 'wrap' }}>
        {/* CALENDARIO */}
        <div style={{ flex: '2', minWidth: '300px', backgroundColor: tema.bgPanel, padding: '20px', borderRadius: '15px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <button onClick={() => cambiarMes(-1)} style={{...btnCalendario, backgroundColor: tema.inputBg, color: tema.texto}}>⬅</button>
            <h2 style={{ margin: 0 }}>{nombresMeses[mesActual]} {añoActual}</h2>
            <button onClick={() => cambiarMes(1)} style={{...btnCalendario, backgroundColor: tema.inputBg, color: tema.texto}}>➡</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
            {Array.from({ length: diasEnMes }).map((_, i) => {
              const dia = i + 1;
              const fechaString = `${añoActual}-${String(mesActual + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
              const transDelDia = transaccionesSeguras.filter(t => t.fecha && t.fecha.startsWith(fechaString));
              const ingresosDia = transDelDia.filter(t => t.tipo === 'ingreso').reduce((sum, t) => sum + (Number(t.cantidad) || 0), 0);
              const gastosDia = transDelDia.filter(t => t.tipo === 'gasto').reduce((sum, t) => sum + (Number(t.cantidad) || 0), 0);
              const esHoy = fechaString === hoy;

              return (
                <div key={dia} onClick={() => setDiaSeleccionado(fechaString)}
                  style={{ minHeight: '80px', padding: '10px', border: esHoy ? `2px solid #2196F3` : `1px solid ${tema.borde}`, borderRadius: '8px', backgroundColor: esHoy ? tema.diaHoy : tema.bgPanel, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', transition: '0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = tema.bgHover}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = esHoy ? tema.diaHoy : tema.bgPanel}
                >
                  <span style={{ fontWeight: esHoy ? 'bold' : 'normal' }}>{dia}</span>
                  <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {ingresosDia > 0 && <span style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '0.85rem' }}>+{ingresosDia}</span>}
                    {gastosDia > 0 && <span style={{ color: '#F44336', fontWeight: 'bold', fontSize: '0.85rem' }}>-{gastosDia}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RESUMEN */}
        <div style={{ flex: '1', minWidth: '300px', backgroundColor: tema.bgPanel, padding: '20px', borderRadius: '15px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Balance</h2>
            <select value={filtroGrafica} onChange={(e) => setFiltroGrafica(e.target.value)} style={{...inputStyle, backgroundColor: tema.inputBg, color: tema.texto}}>
              <option value="total">Histórico Total</option>
              <option value="30">Últimos 30 días</option>
              <option value="7">Últimos 7 días</option>
            </select>
          </div>
          <h1 style={{ color: balanceTotal >= 0 ? '#4CAF50' : '#F44336', fontSize: '3rem', margin: '10px 0', textAlign: 'center' }}>
            {balanceTotal >= 0 ? '+' : ''}{balanceTotal}€
          </h1>
          <p style={{ textAlign: 'center', color: tema.textoSecundario, marginBottom: '20px' }}>Ingresos: {totalIngresos}€ | Gastos: {totalGastos}€</p>
          <div style={{ flexGrow: 1, minHeight: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {categoriasConGastos.length > 0 ? (
              <div style={{ width: '100%', maxWidth: '300px' }}><Pie data={dataParaChartJs} options={{ plugins: { legend: { position: 'bottom', labels: { color: tema.texto } } } }} /></div>
            ) : <p style={{ color: tema.textoSecundario }}>No hay gastos en este periodo</p>}
          </div>
        </div>
      </div>

      <button onClick={() => { setIdEnEdicion(null); setFormulario({ descripcion: '', cantidad: '', categoria: '', fecha: hoy, tipo: 'gasto' }); setMostrarModalFormulario(true); }}
        style={{ position: 'fixed', bottom: '30px', right: '30px', width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#2196F3', color: 'white', fontSize: '30px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        +
      </button>

      {/* MODAL DETALLE DÍA */}
      {diaSeleccionado && (
        <div style={modalOverlayStyle}>
          <div style={{...modalContentStyle, backgroundColor: tema.bgPanel, color: tema.texto}}>
            <button onClick={() => setDiaSeleccionado(null)} style={{...closeBtnStyle, color: tema.texto}}>✖</button>
            <h2>Movimientos del {diaSeleccionado}</h2>
            <ul style={{ listStyle: 'none', padding: 0, maxHeight: '300px', overflowY: 'auto' }}>
              {transaccionesSeguras.filter(t => t.fecha && t.fecha.startsWith(diaSeleccionado)).length > 0 ? 
                transaccionesSeguras.filter(t => t.fecha && t.fecha.startsWith(diaSeleccionado)).map(t => (
                  <li key={t._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: `1px solid ${tema.borde}` }}>
                    <div><strong>{t.descripcion}</strong> <br/><small style={{ color: tema.textoSecundario }}>{t.categoria}</small></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: t.tipo === 'ingreso' ? '#4CAF50' : '#F44336', fontWeight: 'bold' }}>{t.tipo === 'ingreso' ? '+' : '-'}{t.cantidad}€</span>
                      <button onClick={() => { setFormulario({ descripcion: t.descripcion, cantidad: t.cantidad, categoria: t.categoria, fecha: t.fecha.split('T')[0], tipo: t.tipo }); setIdEnEdicion(t._id); setDiaSeleccionado(null); setMostrarModalFormulario(true); }} style={btnAccion}>✏️</button>
                      <button onClick={() => eliminarTransaccion(t._id)} style={btnAccion}>🗑️</button>
                    </div>
                  </li>
                )) : <p style={{ textAlign: 'center', color: tema.textoSecundario }}>No hay movimientos.</p>
              }
            </ul>
          </div>
        </div>
      )}

      {/* MODAL FORMULARIO TRANSACCIÓN */}
      {mostrarModalFormulario && (
        <div style={modalOverlayStyle}>
          <div style={{...modalContentStyle, backgroundColor: tema.bgPanel, color: tema.texto}}>
            <button onClick={() => setMostrarModalFormulario(false)} style={{...closeBtnStyle, color: tema.texto}}>✖</button>
            <h2>{idEnEdicion ? 'Editar Movimiento' : 'Nuevo Movimiento'}</h2>
            <form onSubmit={guardarTransaccion} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <label><input type="radio" name="tipo" value="gasto" checked={formulario.tipo === 'gasto'} onChange={manejarCambio} /> 🔴 Gasto</label>
                <label><input type="radio" name="tipo" value="ingreso" checked={formulario.tipo === 'ingreso'} onChange={manejarCambio} /> 🟢 Ingreso</label>
              </div>
              <input type="text" name="descripcion" placeholder="Título" value={formulario.descripcion} onChange={manejarCambio} required style={{...inputStyle, backgroundColor: tema.inputBg, color: tema.texto, borderColor: tema.borde}} />
              <input type="number" name="cantidad" placeholder="Cantidad" value={formulario.cantidad} onChange={manejarCambio} required style={{...inputStyle, backgroundColor: tema.inputBg, color: tema.texto, borderColor: tema.borde}} />
              <input type="date" name="fecha" value={formulario.fecha} onChange={manejarCambio} required style={{...inputStyle, backgroundColor: tema.inputBg, color: tema.texto, borderColor: tema.borde}} />
              <select name="categoria" value={formulario.categoria} onChange={manejarCambio} required style={{...inputStyle, backgroundColor: tema.inputBg, color: tema.texto, borderColor: tema.borde}}>
                <option value="" disabled>Categoría...</option>
                {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <div style={{ display: 'flex', gap: '5px' }}>
                <input type="text" placeholder="Nueva..." value={nuevaCategoria} onChange={(e) => setNuevaCategoria(e.target.value)} style={{...inputStyle, flex: 1, backgroundColor: tema.inputBg, color: tema.texto, borderColor: tema.borde}} />
                <button type="button" onClick={agregarCategoria} style={{ padding: '10px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '5px' }}>Añadir</button>
              </div>
              <button type="submit" style={{ padding: '15px', backgroundColor: idEnEdicion ? '#ff9800' : (formulario.tipo === 'ingreso' ? '#4CAF50' : '#F44336'), color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold' }}>
                {idEnEdicion ? 'Actualizar' : 'Guardar'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR PERFIL */}
      {mostrarModalPerfil && (
        <div style={modalOverlayStyle}>
          <div style={{...modalContentStyle, backgroundColor: tema.bgPanel, color: tema.texto}}>
            <button onClick={() => setMostrarModalPerfil(false)} style={{...closeBtnStyle, color: tema.texto}}>✖</button>
            <h2>Editar Perfil</h2>
            <form onSubmit={guardarPerfil} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
              <input type="text" placeholder="Nuevo nombre" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} required style={{...inputStyle, backgroundColor: tema.inputBg, color: tema.texto, borderColor: tema.borde}} />
              <button type="submit" style={{ padding: '12px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>Guardar Nombre</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = { padding: '10px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem', outline: 'none' };
const btnCalendario = { padding: '8px 15px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalContentStyle = { padding: '30px', borderRadius: '15px', width: '90%', maxWidth: '400px', position: 'relative' };
const closeBtnStyle = { position: 'absolute', top: '10px', right: '15px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' };
const btnAccion = { background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' };

export default App;