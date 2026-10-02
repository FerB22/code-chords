import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateSpecification } from '../bin/code-chords.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Validación de especificaciones Code-Chords', () => {
  it('debe validar exitosamente los ejemplos oficiales del repositorio', () => {
    const examples = [
      '../examples/layered-architecture.json',
      '../examples/oop-inheritance-trace.json',
      '../examples/scanned-java-trace.json'
    ];

    for (const relPath of examples) {
      const fullPath = path.resolve(__dirname, relPath);
      const content = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
      const result = validateSpecification(content);

      assert.strictEqual(
        result.valid,
        true,
        `El archivo ${relPath} falló la validación: ${result.errors.join(', ')}`
      );
      assert.strictEqual(result.errors.length, 0);
      assert.ok(result.stats.nodesCount > 0);
      assert.ok(result.stats.connectionsCount > 0);
    }
  });

  it('debe rechazar especificaciones sin título o con título inválido', () => {
    const invalidSpec = {
      nodes: [{ id: 'A', label: 'A', members: [] }],
      connections: []
    };
    const result = validateSpecification(invalidSpec);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('title')));
  });

  it('debe detectar identificadores de nodo duplicados', () => {
    const duplicateSpec = {
      title: 'Prueba de duplicado',
      nodes: [
        { id: 'ClaseA', label: 'ClaseA', members: [] },
        { id: 'ClaseA', label: 'ClaseA Repetida', members: [] }
      ],
      connections: []
    };
    const result = validateSpecification(duplicateSpec);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('duplicado')));
  });

  it('debe detectar miembros duplicados con el mismo ID', () => {
    const duplicateMemberSpec = {
      title: 'Prueba miembro duplicado',
      nodes: [
        {
          id: 'ClaseA',
          label: 'ClaseA',
          members: [
            { id: 'ClaseA.attr', name: 'attr: int', kind: 'attribute' },
            { id: 'ClaseA.attr', name: 'attr: int', kind: 'attribute' }
          ]
        }
      ],
      connections: []
    };
    const result = validateSpecification(duplicateMemberSpec);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('ID de miembro duplicado')));
  });

  it('debe rechazar conexiones con nodos o miembros destino inexistentes', () => {
    const orphanSpec = {
      title: 'Prueba referencia huérfana',
      nodes: [
        {
          id: 'ClaseA',
          label: 'ClaseA',
          members: [{ id: 'ClaseA.m1', name: 'm1()', kind: 'method' }]
        }
      ],
      connections: [
        {
          source: 'ClaseA.m1',
          target: 'ClaseInexistente.m2',
          type: 'call'
        }
      ]
    };
    const result = validateSpecification(orphanSpec);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('no existe') || e.includes('ClaseInexistente.m2')));
  });

  it('debe advertir o rechazar tipos de conexión desconocidos', () => {
    const invalidTypeSpec = {
      title: 'Tipo inválido',
      nodes: [
        { id: 'A', label: 'A', members: [{ id: 'A.m', name: 'm()', kind: 'method' }] },
        { id: 'B', label: 'B', members: [{ id: 'B.m', name: 'm()', kind: 'method' }] }
      ],
      connections: [
        { source: 'A.m', target: 'B.m', type: 'tipo_desconocido_inventado' }
      ]
    };
    const result = validateSpecification(invalidTypeSpec);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('tipo no reconocido') || e.includes('tipo_desconocido_inventado')));
  });
});
