#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATE_PATH = path.resolve(__dirname, '../templates/viewer-template.html');

function printUsage() {
  console.log(`
Uso de Code-Chords CLI:
  node code-chords.mjs validate <diagrama.json>
  node code-chords.mjs render <diagrama.json> <salida.html>
  node code-chords.mjs scan-java <archivo1.java> [archivo2.java...] [--out <spec.json>] [--render <salida.html>]

Comandos:
  validate   Verifica la sintaxis, unicidad de IDs y resolución de todas las referencias.
  render     Compila la especificación JSON en un visor interactivo HTML/SVG autónomo.
  scan-java  Analiza clases Java reales, extrae clases, atributos, métodos, herencia,
             constructores, invocaciones y genera automáticamente el diagrama.
`);
}

// -------------------------------------------------------------
// VALIDACIÓN DE ESPECIFICACIONES
// -------------------------------------------------------------
function validateSpecification(data) {
  const errors = [];
  const warnings = [];

  if (!data.title || typeof data.title !== 'string') {
    errors.push('El campo "title" es obligatorio y debe ser una cadena.');
  }

  if (!Array.isArray(data.nodes) || data.nodes.length === 0) {
    errors.push('El campo "nodes" debe ser un arreglo con al menos un nodo.');
  }

  if (!Array.isArray(data.connections)) {
    errors.push('El campo "connections" debe ser un arreglo.');
  }

  const knownIds = new Set();
  const nodeIds = new Set();
  const memberToNode = new Map();

  if (Array.isArray(data.nodes)) {
    data.nodes.forEach((node, nIdx) => {
      if (!node.id) errors.push(`El nodo en el índice ${nIdx} carece de "id".`);
      if (!node.label) errors.push(`El nodo "${node.id || nIdx}" carece de "label".`);
      
      if (node.id) {
        if (knownIds.has(node.id)) {
          errors.push(`ID de nodo duplicado: "${node.id}".`);
        }
        knownIds.add(node.id);
        nodeIds.add(node.id);
      }

      if (Array.isArray(node.members)) {
        node.members.forEach((m, mIdx) => {
          if (!m.id) errors.push(`Miembro en índice ${mIdx} del nodo "${node.id}" carece de "id".`);
          if (!m.name) errors.push(`Miembro "${m.id || mIdx}" del nodo "${node.id}" carece de "name".`);
          if (!m.kind) errors.push(`Miembro "${m.id || mIdx}" del nodo "${node.id}" carece de "kind".`);

          if (m.id) {
            if (knownIds.has(m.id)) {
              errors.push(`ID de miembro duplicado: "${m.id}".`);
            }
            knownIds.add(m.id);
            memberToNode.set(m.id, node.id);
          }
        });
      }
    });
  }

  const validTypes = new Set(['inheritance', 'dataflow', 'call', 'instantiation', 'return']);

  if (Array.isArray(data.connections)) {
    data.connections.forEach((conn, cIdx) => {
      if (!conn.source) errors.push(`La conexión en el índice ${cIdx} no tiene "source".`);
      if (!conn.target) errors.push(`La conexión en el índice ${cIdx} no tiene "target".`);
      if (!conn.type || !validTypes.has(conn.type)) {
        errors.push(`La conexión "${conn.source} -> ${conn.target}" tiene un tipo inválido: "${conn.type}". Tipos admitidos: ${Array.from(validTypes).join(', ')}.`);
      }

      if (conn.source && !knownIds.has(conn.source)) {
        errors.push(`Referencia "source" no encontrada en nodos ni miembros: "${conn.source}".`);
      }
      if (conn.target && !knownIds.has(conn.target)) {
        errors.push(`Referencia "target" no encontrada en nodos ni miembros: "${conn.target}".`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      nodesCount: (data.nodes || []).length,
      membersCount: memberToNode.size,
      connectionsCount: (data.connections || []).length
    }
  };
}

// -------------------------------------------------------------
// COMPILACIÓN A HTML AUTÓNOMO
// -------------------------------------------------------------
function renderDiagram(specData, outputPath) {
  const validation = validateSpecification(specData);
  if (!validation.valid) {
    console.error('Error de validación antes de renderizar:');
    validation.errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }

  if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error(`Plantilla no encontrada en: ${TEMPLATE_PATH}`);
    process.exit(1);
  }

  let template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
  template = template.replace(/__DIAGRAM_TITLE__/g, escapeHtml(specData.title));
  template = template.replace('__DIAGRAM_DATA__', JSON.stringify(specData, null, 2));

  const resolvedOut = path.resolve(process.cwd(), outputPath);
  fs.mkdirSync(path.dirname(resolvedOut), { recursive: true });
  fs.writeFileSync(resolvedOut, template, 'utf-8');

  console.log(`Diagrama generado con éxito: ${resolvedOut}`);
  console.log(`Resumen: ${validation.stats.nodesCount} nodos, ${validation.stats.membersCount} miembros, ${validation.stats.connectionsCount} arcos de conexión.`);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

// -------------------------------------------------------------
// ANALIZADOR LÉXICO/SINTÁCTICO DE CÓDIGO JAVA
// -------------------------------------------------------------
function scanJavaSource(filePaths) {
  const nodes = [];
  const connections = [];

  const classMap = new Map(); // className -> node

  // Primera pasada: recolectar clases, interfaces, atributos y métodos
  for (const filePath of filePaths) {
    if (!fs.existsSync(filePath)) {
      console.warn(`Archivo Java no encontrado: ${filePath}`);
      continue;
    }

    const code = fs.readFileSync(filePath, 'utf-8');
    const baseName = path.basename(filePath, '.java');

    // Limpiar comentarios multilínea y de una línea
    const cleanCode = code
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*/g, '');

    // Detectar declaración de clase o interfaz
    const classMatch = cleanCode.match(/(public\s+|abstract\s+|final\s+)*(class|interface|record)\s+([A-Za-z0-9_]+)(?:\s+extends\s+([A-Za-z0-9_]+))?(?:\s+implements\s+([A-Za-z0-9_,\s]+))?/);
    if (!classMatch) continue;

    const classKind = classMatch[2]; // class | interface | record
    const className = classMatch[3];
    const superClassName = classMatch[4] || null;
    const implementedInterfaces = classMatch[5] ? classMatch[5].split(',').map(s => s.trim()) : [];

    const isMainClass = cleanCode.includes('public static void main(');

    const node = {
      id: className,
      label: className,
      type: isMainClass && className.toLowerCase().includes('main') ? 'main' : (classKind === 'interface' ? 'interface' : 'class'),
      superClass: superClassName,
      interfaces: implementedInterfaces,
      rawCode: cleanCode,
      members: []
    };

    // Extraer campos/atributos
    // Patrón: (private|protected|public)? [static]? [final]? Type name [= value];
    const fieldRegex = /(?:(private|protected|public)\s+)?(?:(static|final)\s+)*([A-Za-z0-9_<>]+)\s+([A-Za-z0-9_]+)\s*(?:=\s*[^;]+)?;/g;
    let fieldMatch;
    while ((fieldMatch = fieldRegex.exec(cleanCode)) !== null) {
      const visibility = fieldMatch[1] || 'package';
      const fieldType = fieldMatch[3];
      const fieldName = fieldMatch[4];

      // Ignorar keywords que puedan dar falsos positivos
      if (['return', 'throw', 'import', 'package', 'new'].includes(fieldType)) continue;

      node.members.push({
        id: `${className}.${fieldName}`,
        name: `${fieldName}: ${fieldType}`,
        kind: 'attribute',
        visibility: visibility,
        snippet: fieldMatch[0].trim(),
        rawName: fieldName,
        type: fieldType
      });
    }

    // Extraer constructores
    const constructorRegex = new RegExp(`(?:(public|protected|private)\\s+)?${className}\\s*\\(([^)]*)\\)\\s*\\{([^}]*)\\}`, 'g');
    let ctorMatch;
    while ((ctorMatch = constructorRegex.exec(cleanCode)) !== null) {
      const visibility = ctorMatch[1] || 'public';
      const params = ctorMatch[2].trim();
      const body = ctorMatch[3];

      const ctorId = `${className}.<init>`;
      node.members.push({
        id: ctorId,
        name: `${className}(${params})`,
        kind: 'constructor',
        visibility: visibility,
        snippet: ctorMatch[0].trim(),
        body: body,
        params: params
      });
    }

    // Extraer métodos
    // Patrón: (public|protected|private)? [static]? [abstract]? ReturnType methodName(params)
    const methodRegex = /(?:(public|protected|private)\s+)?(?:(static|abstract|final|synchronized)\s+)*([A-Za-z0-9_<>\[\]]+)\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)\s*(?:\{([^}]*)\}|;)/g;
    let methodMatch;
    while ((methodMatch = methodRegex.exec(cleanCode)) !== null) {
      const visibility = methodMatch[1] || 'public';
      const returnType = methodMatch[3];
      const methodName = methodMatch[4];
      const params = methodMatch[5].trim();
      const body = methodMatch[6] || '';

      if (methodName === className) continue; // ya capturado como constructor
      if (['if', 'while', 'for', 'switch', 'catch'].includes(methodName)) continue;

      const isOverride = cleanCode.includes(`@Override`) && cleanCode.indexOf(methodName) > cleanCode.indexOf(`@Override`);
      const methodSnippet = (isOverride ? '@Override\n' : '') + methodMatch[0].trim();

      node.members.push({
        id: `${className}.${methodName}`,
        name: `${methodName}(${params}): ${returnType}`,
        kind: 'method',
        visibility: visibility,
        snippet: methodSnippet,
        body: body,
        isOverride: isOverride,
        rawName: methodName
      });
    }

    classMap.set(className, node);
    nodes.push(node);
  }

  // Segunda pasada: inferir conexiones relacionales miembro a miembro
  nodes.forEach(node => {
    // 1. Herencia de clase (`extends`)
    if (node.superClass && classMap.has(node.superClass)) {
      const superNode = classMap.get(node.superClass);

      // Conexión a nivel de clase
      connections.push({
        source: node.id,
        target: superNode.id,
        type: 'inheritance',
        label: `extends ${superNode.label || superNode.id}`,
        snippet: `class ${node.id} extends ${superNode.id}`
      });

      const childCtor = node.members.find(m => m.kind === 'constructor');
      const superCtor = superNode.members.find(m => m.kind === 'constructor');

      // Conexión del constructor super(...)
      if (childCtor && superCtor) {
        connections.push({
          source: childCtor.id,
          target: superCtor.id,
          type: 'inheritance',
          label: 'invoca constructor super(...)',
          snippet: `super(${childCtor.params ? childCtor.params.split(',').map(p => p.trim().split(/\s+/).pop()).slice(0, 2).join(', ') : ''});`
        });
      }

      // Métodos sobrescritos (@Override)
      node.members.filter(m => m.kind === 'method' && m.isOverride).forEach(childMethod => {
        const superMethod = superNode.members.find(sm => sm.rawName === childMethod.rawName);
        if (superMethod) {
          connections.push({
            source: childMethod.id,
            target: superMethod.id,
            type: 'inheritance',
            label: `@Override sobreescribe ${superMethod.rawName}()`,
            snippet: childMethod.snippet
          });
        }
      });

      // Atributos heredados consumidos en miembros concretos del hijo
      superNode.members.filter(m => m.kind === 'attribute').forEach(superAttr => {
        const consumingMembers = node.members.filter(m => m.body && m.body.includes(superAttr.rawName));
        if (consumingMembers.length > 0) {
          consumingMembers.forEach(cm => {
            const targetName = cm.rawName ? `${cm.rawName}()` : (cm.name.includes('(') ? cm.name.split('(')[0] : cm.name);
            connections.push({
              source: superAttr.id,
              target: cm.id,
              type: 'dataflow',
              label: `atributo heredado consumido en ${targetName}`,
              snippet: `${superAttr.snippet || superAttr.name} -> usado en ${targetName}`
            });
          });
        } else if (childCtor && childCtor.params && childCtor.params.includes(superAttr.rawName)) {
          connections.push({
            source: superAttr.id,
            target: childCtor.id,
            type: 'dataflow',
            label: `parámetro heredado recibido en constructor`,
            snippet: `${childCtor.name} recibe ${superAttr.name}`
          });
        }
      });
    }

    // 2. Interfaces implementadas (`implements`)
    (node.interfaces || []).forEach(iface => {
      if (classMap.has(iface)) {
        const ifaceNode = classMap.get(iface);
        ifaceNode.members.filter(m => m.kind === 'method').forEach(ifaceMethod => {
          const implementingMethod = node.members.find(m => m.rawName === ifaceMethod.rawName);
          if (implementingMethod) {
            connections.push({
              source: implementingMethod.id,
              target: ifaceMethod.id,
              type: 'inheritance',
              label: `implementa contrato ${ifaceMethod.rawName}()`,
              snippet: implementingMethod.snippet
            });
          }
        });
      }
    });

    // 3. Instanciaciones y llamadas a nivel de miembros y variables
    // Rastreo de asignaciones: Type varName = new TargetClass(...)
    const newAssignRegex = /(?:([A-Za-z0-9_<>]+)\s+)?([A-Za-z0-9_]+)\s*=\s*new\s+([A-Za-z0-9_]+)\s*\([^)]*\);?/g;
    let newMatch;
    const handledCalls = new Set();

    while ((newMatch = newAssignRegex.exec(node.rawCode)) !== null) {
      const varName = newMatch[2];
      const targetClassName = newMatch[3];
      const targetNode = classMap.get(targetClassName);

      if (targetNode) {
        const targetCtor = targetNode.members.find(m => m.kind === 'constructor') || targetNode.members[0];
        const varMember = node.members.find(m => m.rawName === varName);

        if (targetCtor && varMember) {
          connections.push({
            source: targetCtor.id,
            target: varMember.id,
            type: 'instantiation',
            label: `new ${targetClassName}() entrega instancia a '${varName}'`,
            snippet: newMatch[0].trim()
          });
        }
      }
    }

    function resolveMethodForVar(varType, methodName) {
      if (!varType) return null;
      let curr = classMap.get(varType);
      while (curr) {
        const m = curr.members.find(x => x.kind === 'method' && x.rawName === methodName);
        if (m) return { targetNode: curr, targetMethod: m };
        if (curr.superClass && classMap.has(curr.superClass)) {
          curr = classMap.get(curr.superClass);
        } else {
          break;
        }
      }
      return null;
    }

    // Rastreo de llamadas con asignación: Type resultVar = varName.methodName(...)
    const callAssignRegex = /(?:([A-Za-z0-9_<>]+)\s+)?([A-Za-z0-9_]+)\s*=\s*([A-Za-z0-9_]+)\.([A-Za-z0-9_]+)\s*\([^)]*\);?/g;
    let callAssignMatch;
    while ((callAssignMatch = callAssignRegex.exec(node.rawCode)) !== null) {
      const resultVarName = callAssignMatch[2];
      const varName = callAssignMatch[3];
      const methodName = callAssignMatch[4];

      const varMember = node.members.find(m => m.rawName === varName);
      const resultMember = node.members.find(m => m.rawName === resultVarName);

      if (varMember && varMember.type) {
        const resolved = resolveMethodForVar(varMember.type, methodName);
        if (resolved) {
          handledCalls.add(`${varName}.${methodName}`);

          connections.push({
            source: varMember.id,
            target: resolved.targetMethod.id,
            type: 'call',
            label: `'${varName}' invoca ${methodName}()`,
            snippet: callAssignMatch[0].trim()
          });

          if (resultMember) {
            connections.push({
              source: resolved.targetMethod.id,
              target: resultMember.id,
              type: 'return',
              label: `retorna valor a '${resultVarName}'`,
              snippet: `${resultVarName} = ${varName}.${methodName}(...);`
            });
          }
        }
      }
    }

    // Rastreo de llamadas directas: varName.methodName(...) no asignadas
    const directCallRegex = /([A-Za-z0-9_]+)\.([A-Za-z0-9_]+)\s*\([^)]*\);?/g;
    let directCallMatch;
    while ((directCallMatch = directCallRegex.exec(node.rawCode)) !== null) {
      const varName = directCallMatch[1];
      const methodName = directCallMatch[2];

      if (handledCalls.has(`${varName}.${methodName}`)) continue;
      if (['System', 'out', 'this'].includes(varName)) continue;

      const varMember = node.members.find(m => m.rawName === varName);
      if (varMember && varMember.type) {
        const resolved = resolveMethodForVar(varMember.type, methodName);
        if (resolved) {
          handledCalls.add(`${varName}.${methodName}`);
          connections.push({
            source: varMember.id,
            target: resolved.targetMethod.id,
            type: 'call',
            label: `'${varName}' invoca ${methodName}()`,
            snippet: directCallMatch[0].trim()
          });
        }
      }
    }
  });

  // Limpiar campos auxiliares de parsing y preservar snippets de código
  const cleanNodes = nodes.map(n => ({
    id: n.id,
    label: n.label,
    type: n.type,
    snippet: n.rawCode || undefined,
    members: n.members.map(m => ({
      id: m.id,
      name: m.name,
      kind: m.kind,
      visibility: m.visibility,
      snippet: m.snippet || undefined
    }))
  }));

  return {
    title: `Diagrama relacional de código Java (${filePaths.map(p => path.basename(p)).join(', ')})`,
    description: `Generado automáticamente por el escáner de Code-Chords para las clases: ${nodes.map(n => n.id).join(', ')}.`,
    defaultView: 'blocks',
    nodes: cleanNodes,
    connections: connections
  };
}

function runCli(args = process.argv.slice(2)) {
  if (args.length === 0) {
    printUsage();
    process.exit(0);
  }

  const command = args[0];

  if (command === 'validate') {
    const jsonPath = args[1];
    if (!jsonPath) {
      console.error('Debes especificar la ruta del archivo JSON que validar.');
      process.exit(1);
    }
    const raw = fs.readFileSync(path.resolve(process.cwd(), jsonPath), 'utf-8');
    const data = JSON.parse(raw);
    const result = validateSpecification(data);

    if (result.valid) {
      console.log('Validación exitosa: la especificación es correcta.');
      console.log(`Nodos: ${result.stats.nodesCount} | Miembros: ${result.stats.membersCount} | Conexiones: ${result.stats.connectionsCount}`);
    } else {
      console.error('Se encontraron errores en la especificación:');
      result.errors.forEach(e => console.error(`  - ${e}`));
      process.exit(1);
    }
  } else if (command === 'render') {
    const jsonPath = args[1];
    const outPath = args[2] || 'diagrama.html';
    if (!jsonPath) {
      console.error('Debes indicar el archivo JSON de entrada.');
      process.exit(1);
    }
    const raw = fs.readFileSync(path.resolve(process.cwd(), jsonPath), 'utf-8');
    const data = JSON.parse(raw);
    renderDiagram(data, outPath);
  } else if (command === 'scan-java') {
    const javaFiles = [];
    let outJson = null;
    let renderHtml = null;

    for (let i = 1; i < args.length; i++) {
      if (args[i] === '--out' && args[i + 1]) {
        outJson = args[i + 1];
        i++;
      } else if (args[i] === '--render' && args[i + 1]) {
        renderHtml = args[i + 1];
        i++;
      } else if (args[i].endsWith('.java')) {
        javaFiles.push(path.resolve(process.cwd(), args[i]));
      }
    }

    if (javaFiles.length === 0) {
      console.error('Debes proporcionar al menos un archivo .java para escanear.');
      process.exit(1);
    }

    const spec = scanJavaSource(javaFiles);

    if (outJson) {
      fs.writeFileSync(path.resolve(process.cwd(), outJson), JSON.stringify(spec, null, 2), 'utf-8');
      console.log(`Especificación JSON guardada en: ${outJson}`);
    }

    if (renderHtml) {
      renderDiagram(spec, renderHtml);
    }

    if (!outJson && !renderHtml) {
      console.log(JSON.stringify(spec, null, 2));
    }
  } else {
    console.error(`Comando desconocido: ${command}`);
    printUsage();
    process.exit(1);
  }
}

export {
  validateSpecification,
  renderDiagram,
  scanJavaSource,
  printUsage,
  runCli
};

const isDirectExecution = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectExecution) {
  runCli();
}

