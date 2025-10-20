// === Función para crear dinámicamente los formularios ===
const crearSenal = () => {
  const numSenales = parseInt(document.getElementById('numSenales').value);
  const contSenales = document.getElementById('contSenales');
  contSenales.innerHTML = '';

  for (let i = 0; i < numSenales; i++) {
    contSenales.innerHTML += `
      <div class="contSenal">
        <h4>Señal ${i + 1}</h4>
        <div>
          <label for="p_${i + 1}">Potencia (dBm)</label>
          <input type="number" id="p_${i + 1}" required/>
        </div>
        <div>
          <label for="bw_${i + 1}">Ancho de banda (MHz)</label>
          <input type="number" id="bw_${i + 1}" required/>
        </div>
        <div>
          <label for="fc_${i + 1}">Frecuencia Central (MHz)</label>
          <input type="number" id="fc_${i + 1}" required/>
        </div>
      </div>
    `;
  }
};
crearSenal();

// === FUNCIONES DE CONVERSIÓN Y FÍSICA ===
const K = 1.38e-23;
const FREQ_POINTS = 600;
const SIGNAL_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f39c12', '#1abc9c'];

function W_to_dBm(W) {
  if (W <= 0) return -Infinity;
  return 10 * Math.log10(W * 1000);
}

function calcularRuido(T, B_mhz) {
  const B_hz = B_mhz * 1e6;
  const N_watts = K * T * B_hz;
  return W_to_dBm(N_watts).toFixed(2);
}

function calculateSigma(Bw_mhz) {
  const CONSTANT = 2 * Math.sqrt(2 * Math.log(2));
  return Bw_mhz / CONSTANT;
}

function gaussian_signal(f, Fc, Pico, sigma) {
  const power_ratio = Math.exp(-Math.pow(f - Fc, 2) / (2 * Math.pow(sigma, 2)));
  return 10 * Math.log10(power_ratio) + Pico;
}

// === CREAR GRÁFICO RF ===
const crearGrafica = () => {
  const numSenales = parseInt(document.getElementById('numSenales').value);
  const temperatura = parseFloat(document.getElementById('temperatura').value);
  const anchoDeBanda = parseFloat(document.getElementById('anchoDeBanda').value);

  let ruido = -110;
  if (!isNaN(temperatura) && !isNaN(anchoDeBanda)) {
    ruido = parseFloat(calcularRuido(temperatura, anchoDeBanda));
  }

  const senales = [];
  for (let i = 0; i < numSenales; i++) {
    const p = parseFloat(document.getElementById(`p_${i + 1}`).value);
    const bw = parseFloat(document.getElementById(`bw_${i + 1}`).value);
    const fc = parseFloat(document.getElementById(`fc_${i + 1}`).value);

    if (isNaN(p) || isNaN(bw) || isNaN(fc)) {
      alert(`Complete todos los campos de la señal ${i + 1}`);
      return;
    }

    senales.push({ potencia: p, anchoBanda: bw, frecuencia: fc });
  }

  const contDatos = document.getElementById('datosIngresados'); 
  let tablaDatos = `
    <div>
      <h4>Datos ingresados</h4>
      <table> 
        <tr>
          <td colspan="3">Ruido Total: ${ruido} dBm</td>
        </tr>`; 
  
  senales.forEach((s, i) => {
    tablaDatos += `
        <tr> 
          <td>Señal ${i + 1}</td>
          <td>Potencia: ${s.potencia} dBm</td>
          <td>Frecuencia: ${s.frecuencia} MHz</td>
          <td>SNR: ${s.potencia - ruido} dB</td>
        </tr>`; 
  }); 
  tablaDatos += `</table></div>`;
  contDatos.innerHTML = tablaDatos;

  // === Calcular rango de frecuencias total ===
  const minFc = Math.min(...senales.map(s => s.frecuencia));
  const maxFc = Math.max(...senales.map(s => s.frecuencia));
  const span = (maxFc - minFc) + 3 * Math.max(...senales.map(s => s.anchoBanda));
  const xMin = minFc - span / 2;
  const xMax = maxFc + span / 2;

  // Crear eje X
  const x = [];
  for (let i = 0; i < FREQ_POINTS; i++) {
    x.push(xMin + (xMax - xMin) * (i / (FREQ_POINTS - 1)));
  }

  const traces = [];

  // === Piso de ruido (relleno y variación leve) ===
  const noiseY = x.map(() => ruido + (Math.random() * 0.9 - 0.9));
  traces.push({
    x: x,
    y: noiseY,
    mode: 'lines',
    name: 'Piso de Ruido',
    line: { color: '#95a5a6', width: 1 },
    fill: 'tozeroy',
    fillcolor: 'rgba(149,165,166,0.1)'
  });

  // === Señales ===
  senales.forEach((sig, i) => {
    const sigma = calculateSigma(sig.anchoBanda);
    const color = SIGNAL_COLORS[i % SIGNAL_COLORS.length];

    const ySignal = x.map(f => {
      const signalPower = gaussian_signal(f, sig.frecuencia, sig.potencia, sigma);
      return Math.max(signalPower, ruido);
    });

    // Curva principal
    traces.push({
      x: x,
      y: ySignal,
      mode: 'lines',
      name: `Señal ${i + 1}`,
      line: { color: color, width: 3 }
    });

    // Línea punteada -3 dB
    const db3 = sig.potencia - 3;
    traces.push({
      x: [xMin, xMax],
      y: [db3, db3],
      mode: 'lines',
      name: `-3dB Señal ${i + 1}`,
      showlegend: false,
      line: { color: color, width: 1, dash: 'dot' }
    });

    // Frecuencias límite (ancho de banda)
    const fIzq = sig.frecuencia - sig.anchoBanda / 2;
    const fDer = sig.frecuencia + sig.anchoBanda / 2;

    // Marcadores con etiquetas y flechas
    traces.push({
      x: [fIzq, fDer],
      y: [db3, db3],
      mode: 'markers+text',
      text: [`${fIzq.toFixed(2)} MHz`, `${fDer.toFixed(2)} MHz`],
      textposition: ['bottom center', 'bottom center'],
      marker: { color: color, size: 8, symbol: 'circle-open', line: { width: 2 } },
      textfont: { color: color, size: 11 },
      showlegend: false
    });
  });

  // === Graficar ===
  const layout = {
    title: {
      text: 'Espectro de Frecuencia RF',
      font: { size: 18, color: '#2c3e50' }
    },
    xaxis: {
      title: 'Frecuencia (MHz)',
      zeroline: false,
      linecolor: '#636363',
      linewidth: 1
    },
    yaxis: {
      title: 'Potencia (dBm)',
      zeroline: false,
      linecolor: '#636363',
      linewidth: 1
    },
    margin: { l: 60, r: 20, t: 40, b: 60 },
    plot_bgcolor: '#fcfcfc',
    paper_bgcolor: '#ffffff',
    hovermode: 'closest',
    height: 600
  };

  Plotly.newPlot('graficaRF', traces, layout, { responsive: true });
};
