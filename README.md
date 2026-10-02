# Code-Chords

Generador y visor interactivo autónomo (HTML/SVG) para visualizar **conexiones relacionales a escala atómica** en arquitecturas de software, sistemas distribuidos, capas de aplicación y código fuente. Inspirado en la visualización bíblica de referencias cruzadas y en el contrapunto polifónico.

A diferencia de los diagramas UML tradicionales que representan sistemas como cajas opacas conectadas por flechas abstractas, **Code-Chords** desciende al detalle granular: expone las partes internas de cada entidad (atributos, métodos, constructores, funciones, puertos, endpoints o variables de estado) y las vincula con curvas de Bézier fluidas (*Chord flow*) o arcos parabólicos espectrales (*Bible Arc Spectrum*). Permite responder con rigor visual e instantáneo a la pregunta directriz: **«¿Quién llama a quién y qué le entrega?»** en cualquier ámbito de software.

---

## Características principales

- **Tres disposiciones espaciales intercambiables**:
  - **Bloques**: Distribución en tarjetas 2D de clases con puertos en el contorno y curvas de Bézier cúbicas fluidas.
  - **Flujo vertical continuo**: Disposición secuencial centrada con deslizamiento continuo mediante la rueda del ratón, carriles laterales de conexión escalonados (*edge bundling*) y un índice flotante de salto rápido entre clases.
  - **Espectro bíblico**: Eje horizontal lineal continuo con todos los miembros y arcos parabólicos de colores proporcionales a la distancia.
- **Minirradar / Minimapa interactivo de navegación**: Panel flotante en la esquina inferior izquierda con estética de cristal translúcido (*glassmorphism*), silueta miniatura del diagrama y recuadro de cámara activa (*viewport*) interactivo con soporte de clic y arrastre.
- **Partículas de flujo animadas en selección**: Al posar el cursor o seleccionar cualquier cable o miembro, una animación continua de guiones SVG (`chordFlowPulse`) viaja desde el puerto emisor hacia el puerto receptor, explicitando físicamente la dirección de invocación o transmisión de datos.
- **Modo de enfoque contextual**: Permite aislar visualmente la vecindad inmediata del elemento o conexión seleccionada, atenuando nodos desconectados y ocultando cables ajenos para estudiar subgrafos sin ruido.
- **Inspector de traza y visor de código fuente**: Al pulsar sobre cualquier miembro o arco, el panel lateral revela la sentencia ejecutada, los parámetros transmitidos y la implementación receptora con resaltado sintáctico integrado, numeración de líneas y botón de copiado.
- **Editor web interactivo integrado**: Permite modificar la especificación JSON o redactar código Java directamente en el navegador y recompilar el diagrama al instante.
- **Escáner de código Java integrado**: Analiza clases Java reales, extrayendo clases, atributos, métodos, constructores, herencia (`extends`, `implements`, `super()`) e invocaciones sin herramientas pesadas.
- **Archivos autónomos**: La salida generada es un único archivo HTML listo para abrir en cualquier navegador moderno sin requerir servidores web ni dependencias externas.

---

## Semántica cromática de conexiones

| Tipo | Color en visor | Descripción y uso semántico |
|---|---|---|
| `inheritance` | Violeta (`#a855f7`) | Herencia `extends`, contratos `implements`, constructores `super()` y `@Override`. |
| `dataflow` | Azul cian (`#06b6d4`) | Paso de atributos, asignación de variables y parámetros de datos. |
| `call` | Ámbar (`#f59e0b`) | Invocaciones de métodos y mensajes sincrónicos. |
| `instantiation` | Verde esmeralda (`#10b981`) | Operadores `new` y constructores de objetos. |
| `return` | Rosa coral (`#f43f5e`) | Valores de retorno, respuestas o excepciones propagadas. |

---

## Estructura del proyecto

```
code-chords/
├── .gitignore               # Exclusiones de Git
├── LICENSE                  # Licencia de código abierto MIT
├── README.md                # Documentación del proyecto
├── package.json             # Metadatos del paquete y comandos CLI
├── SKILL.md                 # Definición de la habilidad para asistentes de IA
├── bin/
│   └── code-chords.mjs      # Motor CLI ejecutable (Node.js)
├── schemas/
│   └── code-chords.schema.json # Esquema JSON formal de especificación
├── templates/
│   └── viewer-template.html # Plantilla web interactiva con SVG y CSS
└── examples/                # Ejemplos y demostraciones
    ├── java/                # Código Java de muestra (Persona, Empleado, Main)
    ├── layered-architecture.json
    ├── layered-architecture.html
    ├── oop-inheritance-trace.json
    ├── oop-inheritance-trace.html
    ├── scanned-java-trace.json
    └── scanned-java-trace.html
```

---

## Instalación y requisitos

- **Node.js**: Versión 18.0 o superior.

Clona el repositorio o cópialo a tu entorno local:

```bash
git clone https://github.com/<tu-usuario>/code-chords.git
cd code-chords
```

Opcionalmente, enlaza el comando de forma global:

```bash
npm link
```

---

## Guía de uso de la CLI

El motor CLI ofrece tres comandos principales:

### 1. Escanear código Java real existente

Analiza archivos `.java` locales y compila de inmediato el visor interactivo:

```bash
node bin/code-chords.mjs scan-java examples/java/Persona.java examples/java/Empleado.java examples/java/Main.java --out mi_especificacion.json --render mi_diagrama.html
```

### 2. Validar una especificación JSON

Verifica la integridad de identificadores, unicidad de miembros y validez semántica:

```bash
node bin/code-chords.mjs validate examples/layered-architecture.json
```

### 3. Renderizar una especificación a HTML

Genera el visor interactivo autónomo a partir del archivo JSON:

```bash
node bin/code-chords.mjs render examples/layered-architecture.json salida.html
```

---

## Estructura de una especificación JSON

```json
{
  "title": "Jerarquía de herencia y flujo de datos",
  "description": "Traza de atributos y métodos entre Clase P, Clase H y Main.",
  "defaultView": "blocks",
  "nodes": [
    {
      "id": "ClasePadre",
      "label": "ClasePadre",
      "type": "class",
      "members": [
        { "id": "ClasePadre.nombre", "name": "nombre: String", "kind": "attribute", "visibility": "protected" },
        { "id": "ClasePadre.init", "name": "ClasePadre(nombre: String)", "kind": "constructor", "visibility": "public" },
        { "id": "ClasePadre.getNombre", "name": "getNombre(): String", "kind": "method", "visibility": "public" }
      ]
    },
    {
      "id": "ClaseHija",
      "label": "ClaseHija",
      "type": "class",
      "members": [
        { "id": "ClaseHija.init", "name": "ClaseHija(nombre: String)", "kind": "constructor", "visibility": "public" },
        { "id": "ClaseHija.mostrar", "name": "@Override mostrar(): void", "kind": "method", "visibility": "public" }
      ]
    }
  ],
  "connections": [
    {
      "source": "ClaseHija",
      "target": "ClasePadre",
      "type": "inheritance",
      "label": "extends ClasePadre"
    },
    {
      "source": "ClaseHija.init",
      "target": "ClasePadre.init",
      "type": "inheritance",
      "label": "super(nombre)"
    },
    {
      "source": "ClasePadre.nombre",
      "target": "ClaseHija.mostrar",
      "type": "dataflow",
      "label": "consume atributo heredado"
    }
  ]
}
```

---

## Uso como habilidad en Antigravity / Claude Code

Para integrar `code-chords` como habilidad en tu agente de inteligencia artificial:

1. Copia el directorio completo en la ruta de habilidades:
   `~/.gemini/config/plugins/custom-skills/skills/code-chords` (o en `.claude/skills/code-chords`).
2. El agente detectará automáticamente el archivo `SKILL.md` y podrá invocar el comando `node <skill-path>/bin/code-chords.mjs` cada vez que solicites visualizar arquitecturas, jerarquías de herencia o trazas relacionales de software.

---

## Licencia

Distribuido bajo la licencia [MIT](LICENSE).
