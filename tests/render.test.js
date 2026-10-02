import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { renderDiagram } from '../bin/code-chords.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Compilador y generador HTML autónomo', () => {
  const tmpOut = path.join(os.tmpdir(), `test-code-chords-${Date.now()}.html`);

  after(() => {
    if (fs.existsSync(tmpOut)) {
      fs.unlinkSync(tmpOut);
    }
  });

  it('debe generar un archivo HTML autónomo con SVG, minimapa y datos inyectados', () => {
    const sampleSpec = {
      title: 'Sistema de Prueba Render',
      description: 'Verificación de compilación a HTML.',
      defaultView: 'blocks',
      nodes: [
        {
          id: 'Servicio',
          label: 'Servicio',
          members: [
            { id: 'Servicio.ejecutar', name: 'ejecutar()', kind: 'method' }
          ]
        },
        {
          id: 'Repositorio',
          label: 'Repositorio',
          members: [
            { id: 'Repositorio.guardar', name: 'guardar()', kind: 'method' }
          ]
        }
      ],
      connections: [
        {
          source: 'Servicio.ejecutar',
          target: 'Repositorio.guardar',
          type: 'call',
          label: 'persiste datos'
        }
      ]
    };

    renderDiagram(sampleSpec, tmpOut);

    assert.ok(fs.existsSync(tmpOut), 'El archivo HTML de salida debe existir');
    const htmlContent = fs.readFileSync(tmpOut, 'utf-8');

    // Verificaciones estructurales
    assert.ok(htmlContent.includes('Sistema de Prueba Render'), 'Debe contener el título inyectado');
    assert.ok(htmlContent.includes('<svg id="chords-canvas"'), 'Debe contener el elemento SVG chords-canvas');
    assert.ok(htmlContent.includes('id="minimap-svg"'), 'Debe contener el SVG del minimapa');
    assert.ok(htmlContent.includes('chordFlowPulse'), 'Debe contener la animación de partículas');
    assert.ok(htmlContent.includes('let DIAGRAM ='), 'Debe contener la especificación inyectada');
  });
});
