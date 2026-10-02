---
name: code-chords
description: Genera diagramas de arcos de conexión relacional interactivos y autónomos (HTML/SVG) inspirados en la visualización bíblica de referencias cruzadas y en el contrapunto polifónico. Modela granularmente atributos, métodos, herencia, llamadas e instanciaciones entre clases, componentes o capas arquitectónicas.
license: MIT
metadata:
  version: "1.0.0"
  author: Antigravity
---

# Code-Chords

Genera diagramas interactivos y autónomos en formato HTML/SVG para visualizar **conexiones relacionales a nivel atómico** en código y arquitectura de software.

A diferencia de los diagramas UML tradicionales que solo muestran bloques opacos y flechas abstractas, **Code-Chords** desciende al detalle: expone cada atributo, constructor, método y parámetro, y los enlaza mediante curvas de Bézier fluidas (*Chord flow*) o arcos parabólicos espectrales (*Bible Arc Spectrum*), permitiendo responder con precisión visual a la pregunta cardinal: **«¿Quién llama a quién y qué le entrega?»**.

---

## Cuándo activar esta habilidad

Activa `code-chords` cuando el usuario:
- Solicite un **diagrama de conexiones**, «diagrama de arcos», «diagrama relacional» o mencione «como las conexiones de la Biblia».
- Desee entender la **traza profunda** de una jerarquía de herencia (dónde nace un atributo en la clase padre, cómo viaja por `super()` en la hija y dónde se invoca en el `Main`).
- Necesite mapear el **flujo de datos en capas arquitectónicas** (Controlador $\rightarrow$ Servicio $\rightarrow$ DAO $\rightarrow$ Base de Datos $\rightarrow$ Entidad).
- Manifieste necesidad de **comprensión estructural y relacional** antes de una evaluación técnica o defensa de código.

---

## Flujo de trabajo rápido

El proceso de creación consta de 3 pasos:

### 1. Generar la especificación relacional
Puedes redactar directamente el archivo JSON (por ejemplo, `diagrama.json`) o escanear automáticamente clases Java existentes:

```bash
# Opción A: Escanear código Java real existente
node "<skill-path>/bin/code-chords.mjs" scan-java Archivo1.java Archivo2.java Main.java --out spec.json --render salida.html

# Opción B: Autoría directa de especificación JSON (ver estructura abajo)
```

### 2. Validar la especificación
Comprueba que todos los identificadores de nodos y miembros existan, que no haya duplicados y que los tipos de conexión sean semánticamente correctos:

```bash
node "<skill-path>/bin/code-chords.mjs" validate spec.json
```

### 3. Renderizar el visor HTML interactivo
Genera el archivo HTML autónomo listo para abrir en cualquier navegador:

```bash
node "<skill-path>/bin/code-chords.mjs" render spec.json salida.html
```

---

## Estructura de la especificación JSON

```json
{
  "title": "Jerarquía de herencia y flujo de datos",
  "description": "Traza de atributos y métodos entre Clase P, Clase H y Main.",
  "defaultView": "blocks",
  "nodes": [
    {
      "id": "ClasePadre",
      "label": "Clase P (Padre)",
      "type": "class",
      "members": [
        { "id": "ClasePadre.nombre", "name": "nombre: String", "kind": "attribute", "visibility": "protected" },
        { "id": "ClasePadre.init", "name": "ClasePadre(nombre: String)", "kind": "constructor", "visibility": "public" },
        { "id": "ClasePadre.getNombre", "name": "getNombre(): String", "kind": "method", "visibility": "public" }
      ]
    },
    {
      "id": "ClaseHija",
      "label": "Clase H (Hija)",
      "type": "class",
      "members": [
        { "id": "ClaseHija.init", "name": "ClaseHija(nombre: String)", "kind": "constructor", "visibility": "public" },
        { "id": "ClaseHija.mostrar", "name": "@Override mostrar(): void", "kind": "method", "visibility": "public" }
      ]
    },
    {
      "id": "Main",
      "label": "Main",
      "type": "main",
      "members": [
        { "id": "Main.main", "name": "main(args: String[]): void", "kind": "method", "visibility": "public" }
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
    },
    {
      "source": "Main.main",
      "target": "ClaseHija.init",
      "type": "instantiation",
      "label": "new ClaseHija(\"Carlos\")"
    },
    {
      "source": "Main.main",
      "target": "ClaseHija.mostrar",
      "type": "call",
      "label": "hija.mostrar()"
    }
  ]
}
```

---

## Tipos de conexión y paleta de colores semántica

| Tipo | Color en visor | Descripción y uso semántico |
|---|---|---|
| `inheritance` | Violeta / Púrpura (`#a855f7`) | Relaciones `extends`, `implements`, constructores `super()` y `@Override`. |
| `dataflow` | Azul cian (`#06b6d4`) | Paso de atributos, asignación de variables, parámetros de datos. |
| `call` | Ámbar / Dorado (`#f59e0b`) | Invocaciones de métodos y mensajes sincrónicos. |
| `instantiation` | Verde esmeralda (`#10b981`) | Operadores `new` y constructores de objetos. |
| `return` | Rosa / Coral (`#f43f5e`) | Valores devueltos, respuestas HTTP o excepciones propagadas. |

---

## Características interactivas del visor entregable

1. **Vistas triples intercambiables**:
   - **Vista de bloques**: Distribución espacial 2D de tarjetas de clases con puertos en el contorno exterior y curvas de Bézier cúbicas fluidas.
   - **Flujo vertical continuo (*Vertical Flow*)**: Columna vertical centralizada con navegación secuencial paso a paso, deslizamiento continuo con la rueda del ratón, carriles laterales de conexión despejados y un índice flotante de salto rápido entre clases.
   - **Espectro bíblico (*Arc Spectrum*)**: Eje horizontal lineal continuo con todos los miembros y arcos parabólicos de colores proporcionales a la distancia.
2. **Efecto de enfoque selectivo (*Focus trail*)**: Al pasar el cursor sobre un elemento o arco, todos los demás componentes se atenúan al 10 %, haciendo brillar únicamente la ruta relacional completa.
3. **Inspector de traza y visor de código («¿Quién llama a quién y qué le entrega?»)**: Al hacer clic en un elemento o arco, el panel lateral despliega el fragmento de código fuente Java con resaltado sintáctico autónomo, numeración de líneas y botón de copiado.
4. **Filtros por tipo**: Permite encender y apagar familias de conexiones (ej. ocultar llamadas y ver solo herencia y flujo de datos).
5. **Pan & Zoom**: Navegación libre mediante arrastre y rueda del ratón con botón de centrado.
6. **Selector de tema**: Modo oscuro grafito relajado y modo claro.
7. **Exportación vectorial**: Botón para descargar el diagrama directamente como archivo SVG vectorial sin pérdida.
