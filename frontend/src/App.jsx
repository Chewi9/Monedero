import { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

function App() {
  const [gastos, setGastos] = useState([]);
  
  // Estados para los modales y edición
  const [mostrarModalFormulario, setMostrarModalFormulario] = useState(false);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null); // Guarda la fecha del día que pulsamos
  const [idEnEdicion, setIdEnEdicion] = useState(null); // Si tiene un ID, estamos editando, si no, creando

  // Estado para el filtro de la gráfica
  const [filtroGrafica, setFiltroGrafica] = useState('total'); // 'total', '7', '30'
  const [fechaCalendario, setFechaCalendario] = useState(new Date());

  const [categorias, setCategorias] = useState(() => {
    const guardadas = localStorage.getItem('categorias');
    return guardadas ? JSON.parse(guardadas) : ['Comida', 'Ocio', 'Transporte', 'Hogar', 'Otros'];
  });
  const [nuevaCategoria, setNuevaCategoria] = useState('');

  const hoy = new Date().toISOString().split('T')[0];
  const [formulario, setFormulario] = useState({ descripcion: '', cantidad: '', categoria: '', fecha: hoy });

  const COLORES = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19A3', '#e91e63', '#9c27b0'];

  // Cargar datos
  useEffect(() => {
    fetch('http://localhost:5000/api/gastos')
      .then(res => res.json())
      .then(datos => { if (Array.isArray(datos)) setGastos(datos); })
      .catch(err => console.error('Error:', err));
  }, []);

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

  // Guardar (Crear NUEVO o EDITAR existente)
  const guardarGasto = async (e) => {
    e.preventDefault();
    try {
      if (idEnEdicion) {
        // MODO EDICIÓN (PUT)
        const respuesta = await fetch(`http://localhost:5000/api/gastos/${idEnEdicion}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formulario)
        });
        const gastoActualizado = await respuesta.json();
        setGastos(gastos.map(g => g._id === idEnEdicion ? gastoActualizado : g));
      } else {
        // MODO CREACIÓN (POST)
        const respuesta = await fetch('http://localhost:5000/api/gastos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formulario)
        });
        const nuevoGasto = await respuesta.json();
        setGastos([...gastos, nuevoGasto]); 
      }
      
      setMostrarModalFormulario(false); 
      setIdEnEdicion(null); // Reseteamos
      setFormulario({ descripcion: '', cantidad: '', categoria: '', fecha: hoy }); 
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // ELIMINAR GASTO
  const eliminarGasto = async (id) => {
    if (window.confirm('¿Seguro que quieres borrar este gasto?')) {
      try {
        await fetch(`http://localhost:5000/api/gastos/${id}`, { method: 'DELETE' });
        setGastos(gastos.filter(g => g._id !== id));
      } catch (error) {
        console.error('Error al borrar:', error);
      }
    }
  };

  // PREPARAR EDICIÓN
  const abrirEdicion = (gasto) => {
    setFormulario({ 
      descripcion: gasto.descripcion, 
      cantidad: gasto.cantidad, 
      categoria: gasto.categoria, 
      fecha: gasto.fecha.split('T')[0] // Cortar la hora de MongoDB
    });
    setIdEnEdicion(gasto._id);
    setDiaSeleccionado(null); // Cerramos el detalle del día
    setMostrarModalFormulario(true); // Abrimos el formulario
  };

  const gastosSeguros = Array.isArray(gastos) ? gastos : [];
  
  // LÓGICA DE FILTRADO PARA LA GRÁFICA
  const fechaLimite = new Date();
  if (filtroGrafica === '7') fechaLimite.setDate(fechaLimite.getDate() - 7);
  if (filtroGrafica === '30') fechaLimite.setDate(fechaLimite.getDate() - 30);

  const gastosFiltrados = filtroGrafica === 'total' 
    ? gastosSeguros 
    : gastosSeguros.filter(g => new Date(g.fecha) >= fechaLimite);

  const gastoTotalGrafica = gastosFiltrados.reduce((total, gasto) => total + (Number(gasto.cantidad) || 0), 0);

  const categoriasConGastos = categorias.map(cat => {
    const totalCat = gastosFiltrados
      .filter(g => g.categoria === cat)
      .reduce((acc, curr) => acc + (Number(curr.cantidad) || 0), 0);
    return { name: cat, value: totalCat };
  }).filter(d => d.value > 0); 

  const dataParaChartJs = {
    labels: categoriasConGastos.map(c => c.name),
    datasets: [{
      data: categoriasConGastos.map(c => c.value),
      backgroundColor: COLORES,
      borderColor: '#ffffff',
      borderWidth: 2,
      hoverOffset: 10
    }]
  };

  // CALENDARIO
  const cambiarMes = (incremento) => setFechaCalendario(new Date(fechaCalendario.getFullYear(), fechaCalendario.getMonth() + incremento, 1));
  const añoActual = fechaCalendario.getFullYear();
  const mesActual = fechaCalendario.getMonth();
  const diasEnMes = new Date(añoActual, mesActual + 1, 0).getDate();
  const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  return (
    <div style={{ display: 'flex', fontFamily: 'Arial, sans-serif', padding: '20px', gap: '30px', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      
      {/* PANEL IZQUIERDO: Calendario */}
      <div style={{ flex: '2', backgroundColor: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button onClick={() => cambiarMes(-1)} style={btnCalendario}>⬅ Anterior</button>
          <h2 style={{ margin: 0 }}>📅 {nombresMeses[mesActual]} {añoActual}</h2>
          <button onClick={() => cambiarMes(1)} style={btnCalendario}>Siguiente ➡</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
          {Array.from({ length: diasEnMes }).map((_, i) => {
            const dia = i + 1;
            const fechaString = `${añoActual}-${String(mesActual + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
            const gastosDelDia = gastosSeguros.filter(g => g.fecha && g.fecha.startsWith(fechaString));
            const totalDia = gastosDelDia.reduce((sum, g) => sum + (Number(g.cantidad) || 0), 0);

            const esHoy = fechaString === hoy;

            return (
              <div 
                key={dia} 
                onClick={() => setDiaSeleccionado(fechaString)} // Al hacer clic, guardamos el día
                style={{ minHeight: '80px', padding: '10px', border: esHoy ? '2px solid #94a3b8' : '1px solid #eee', borderRadius: '8px', backgroundColor: esHoy ? '#e2e8f0': '#fafafa', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e0f7fa'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = esHoy ? '#e2e8f0' : '#fafafa'}
              >
                <span style={{ fontWeight: 'bold', color: '#555' }}>{dia}</span>
                {totalDia > 0 && (
                  <span style={{ marginTop: 'auto', color: '#d32f2f', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    -{totalDia}€
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* PANEL DERECHO: Resumen y Gráfica */}
      <div style={{ flex: '1', backgroundColor: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Resumen</h2>
          <select value={filtroGrafica} onChange={(e) => setFiltroGrafica(e.target.value)} style={inputStyle}>
            <option value="total">Histórico Total</option>
            <option value="30">Últimos 30 días</option>
            <option value="7">Últimos 7 días</option>
          </select>
        </div>

        <h1 style={{ color: '#d32f2f', fontSize: '3rem', margin: '10px 0', textAlign: 'center' }}>-{gastoTotalGrafica}€</h1>
        
        <div style={{ flexGrow: 1, minHeight: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {categoriasConGastos.length > 0 ? (
            <div style={{ width: '100%', maxWidth: '350px' }}>
              <Pie data={dataParaChartJs} options={{ plugins: { legend: { position: 'bottom' } } }} />
            </div>
          ) : (
            <p style={{ color: '#777', textAlign: 'center' }}>No hay gastos en este periodo</p>
          )}
        </div>
      </div>

      {/* BOTÓN FLOTANTE (FAB) PARA CREAR NUEVO */}
      <button 
        onClick={() => {
          setIdEnEdicion(null); // Nos aseguramos de que no esté editando
          setFormulario({ descripcion: '', cantidad: '', categoria: '', fecha: hoy });
          setMostrarModalFormulario(true);
        }}
        style={{ position: 'fixed', bottom: '30px', right: '30px', width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#4CAF50', color: 'white', fontSize: '30px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        +
      </button>

      {/* MODAL 1: DETALLE DE LOS GASTOS DE UN DÍA */}
      {diaSeleccionado && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <button onClick={() => setDiaSeleccionado(null)} style={closeBtnStyle}>✖</button>
            <h2>Gastos del {diaSeleccionado}</h2>
            
            <ul style={{ listStyle: 'none', padding: 0, maxHeight: '300px', overflowY: 'auto' }}>
              {gastosSeguros.filter(g => g.fecha && g.fecha.startsWith(diaSeleccionado)).length > 0 
                ? gastosSeguros.filter(g => g.fecha && g.fecha.startsWith(diaSeleccionado)).map(gasto => (
                  <li key={gasto._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #ddd' }}>
                    <div>
                      <strong>{gasto.descripcion}</strong> <br/>
                      <small style={{ color: '#666' }}>{gasto.categoria}</small>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>-{gasto.cantidad}€</span>
                      <button onClick={() => abrirEdicion(gasto)} style={btnAccion}>✏️</button>
                      <button onClick={() => eliminarGasto(gasto._id)} style={{...btnAccion, color: 'red'}}>🗑️</button>
                    </div>
                  </li>
                ))
                : <p style={{ textAlign: 'center', color: '#888' }}>No hay gastos este día.</p>
              }
            </ul>
          </div>
        </div>
      )}

      {/* MODAL 2: FORMULARIO CREAR / EDITAR */}
      {mostrarModalFormulario && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <button onClick={() => setMostrarModalFormulario(false)} style={closeBtnStyle}>✖</button>
            
            <h2>{idEnEdicion ? 'Editar Gasto' : 'Añadir Nuevo Gasto'}</h2>
            <form onSubmit={guardarGasto} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input type="text" name="descripcion" placeholder="Título (ej. Supermercado)" value={formulario.descripcion} onChange={manejarCambio} required style={inputStyle} />
              <input type="number" name="cantidad" placeholder="Cantidad (ej. 45.50)" value={formulario.cantidad} onChange={manejarCambio} required style={inputStyle} />
              <input type="date" name="fecha" value={formulario.fecha} onChange={manejarCambio} required style={inputStyle} />
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <select name="categoria" value={formulario.categoria} onChange={manejarCambio} required style={{ ...inputStyle, flex: 1 }}>
                  <option value="" disabled>Selecciona categoría...</option>
                  {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '5px', marginTop: '-5px', marginBottom: '10px' }}>
                <input type="text" placeholder="Nueva categoría..." value={nuevaCategoria} onChange={(e) => setNuevaCategoria(e.target.value)} style={{ ...inputStyle, padding: '5px', flex: 1, fontSize: '0.9rem' }} />
                <button type="button" onClick={agregarCategoria} style={{ padding: '5px 10px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Añadir</button>
              </div>

              <button type="submit" style={{ padding: '15px', backgroundColor: idEnEdicion ? '#ff9800' : '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1rem', cursor: 'pointer', fontWeight: 'bold' }}>
                {idEnEdicion ? 'Actualizar Gasto' : 'Guardar Gasto'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Estilos reutilizables (Los he sacado aquí abajo para no ensuciar el código)
const inputStyle = { padding: '10px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem' };
const btnCalendario = { padding: '8px 15px', border: 'none', borderRadius: '8px', backgroundColor: '#eee', cursor: 'pointer', fontWeight: 'bold', color: '#333' };
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalContentStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '15px', width: '400px', position: 'relative' };
const closeBtnStyle = { position: 'absolute', top: '10px', right: '15px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' };
const btnAccion = { background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' };

export default App;