import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanJavaSource, validateSpecification } from '../bin/code-chords.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Escáner de código fuente Java', () => {
  const javaFiles = [
    path.resolve(__dirname, '../examples/java/Persona.java'),
    path.resolve(__dirname, '../examples/java/Empleado.java'),
    path.resolve(__dirname, '../examples/java/Main.java')
  ];

  it('debe extraer correctamente las clases, miembros y relaciones', () => {
    const spec = scanJavaSource(javaFiles);

    assert.ok(spec, 'La especificación generada no debe ser nula');
    assert.strictEqual(typeof spec.title, 'string');
    assert.ok(spec.nodes.length >= 3, 'Debe haber extraído al menos 3 clases');

    const nodeIds = spec.nodes.map(n => n.id);
    assert.ok(nodeIds.includes('Persona'), 'Debe contener la clase Persona');
    assert.ok(nodeIds.includes('Empleado'), 'Debe contener la clase Empleado');
    assert.ok(nodeIds.includes('Main'), 'Debe contener la clase Main');

    // Verificar herencia Empleado -> Persona
    const inheritanceConn = spec.connections.find(
      c => c.source === 'Empleado' && c.target === 'Persona' && c.type === 'inheritance'
    );
    assert.ok(inheritanceConn, 'Debe haber detectado la herencia entre Empleado y Persona');

    // Verificar llamada super() en constructor
    const superConn = spec.connections.find(
      c => c.source === 'Empleado.<init>' && c.target === 'Persona.<init>' && c.type === 'inheritance'
    );
    assert.ok(superConn, 'Debe haber detectado la invocación super() en el constructor de Empleado');

    // Comprobar que la especificación generada es válida formalmente
    const validationResult = validateSpecification(spec);
    assert.strictEqual(
      validationResult.valid,
      true,
      `La especificación autogenerada tiene errores: ${validationResult.errors.join(', ')}`
    );
  });
});
