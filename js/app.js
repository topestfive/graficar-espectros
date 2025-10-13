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
              <input type="number" id="p_${i + 1}" name="p_${i + 1}" required/>
            </div>
            <div>
              <label for="bw_${i + 1}">Ancho de banda (Bw)</label>
              <input type="number" id="bw_${i + 1}" name="bw_${i + 1}" required/>
            </div>
            <div>
              <label for="fc_${i + 1}">Frecuencia (MHz)</label>
              <input type="number" id="fc_${i + 1}" name="fc_${i + 1}" required/>
            </div>
          </div>
        `;
      }
};
crearSenal();

const calcularRuido = (tem, bw) => {
    const wRuido = ((1.38e-23) * tem * bw);
    let ruidoTermico = (10 * (Math.log10((wRuido)/1e-3)));
    return ruidoTermico.toFixed(2);
};

const crearGrafica = () => {

    const numSenales = parseInt(document.getElementById('numSenales').value);

    // RUIDO

    const temperatura = parseInt(document.getElementById('temperatura').value);
    const anchoDeBanda = parseFloat(document.getElementById('anchoDeBanda').value);
    let ruido = -110;

    if( !isNaN(anchoDeBanda) && !isNaN(temperatura)){
        ruido = calcularRuido(temperatura, anchoDeBanda);
    }

    console.log(ruido, temperatura);

    //SEÑALES

    let senales = [] //Array que tiene todos las datos de la señales

    for(let i = 0; i < numSenales; i++){ // Aqui se guardan los datos de las señales
        const p = parseFloat(document.getElementById(`p_${i+1}`).value);
        const bw = parseFloat(document.getElementById(`bw_${i+1}`).value);
        const fc = parseFloat(document.getElementById(`fc_${i+1}`).value);

        if(isNaN(p) || isNaN(bw) || isNaN(fc)){
            alert('Complete todo los campos de las señales');
            senales = [];
            return;
        }

        senales.push({
            potencia: p,
            anchoBanda: bw,
            frecuencia: fc
        });
    }

    console.log(senales);

    // De aqui pa abajo muestra una tabla con los datos lo que es la potencia, la fecuancia y el snr
    const contDatos = document.getElementById('datosIngresados');
    let tablaDatos = `
        <div>
            <h4>Datos ingresados</h4>
            <table>
                <tr>
                    <td colspan="3">Ruido Total: ${ruido} dBm</td>
                </tr>
    `;

    senales.forEach((s, i) => {
        tablaDatos += `
            <tr>
                <td>Señal ${i + 1}</td>
                <td>Potencia: ${s.potencia} dBm</td>
                <td>Freciancia: ${s.frecuencia} MHz</td>
                <td>SNR: ${s.potencia - ruido} dB</td>
            </tr>
        `;
    });

    tablaDatos += `</table></div>`;
    contDatos.innerHTML = tablaDatos;
};
