# Guía de contribución a Code-Chords

¡Gracias por tu interés en contribuir a **Code-Chords**! Este proyecto es de código abierto bajo la licencia MIT y acoge aportes de desarrolladores, diseñadores y arquitectos de software que deseen mejorar la visualización de sistemas a escala atómica.

---

## Principios del proyecto

1. **Atómico y granular**: Visualizar las partes internas de los componentes (atributos, métodos, constructores, puertos, endpoints) y no solo cajas abstractas.
2. **Cero dependencias pesadas en tiempo de ejecución**: El visor generado debe ser un único archivo HTML/SVG autónomo, ligero y funcional sin requerir servidores web ni bibliotecas externas pesadas.
3. **Multiplataforma y estándar**: Compatible con entornos Node.js 18+ y navegadores web modernos.

---

## Cómo empezar

### Requisitos previos

- Node.js (versión 18.0.0 o superior).
- Git.

### Configuración local

1. Clona tu bifurcación (*fork*) del repositorio:
   ```bash
   git clone https://github.com/tu-usuario/code-chords.git
   cd code-chords
   ```
2. No se requieren dependencias de terceros; el proyecto utiliza las API nativas de Node.js.
3. Ejecuta la suite de pruebas unitarias para comprobar el entorno:
   ```bash
   npm test
   ```

---

## Cómo proponer mejoras

### 1. Nuevos analizadores de código fuente (*parsers*)

Actualmente el motor cuenta con un escáner nativo para Java (`scanJavaSource`). Nos entusiasma recibir aportes para admitir otros lenguajes:
- TypeScript / JavaScript (extraer clases, interfaces, tipos y métodos).
- Python (extraer clases, métodos `__init__`, decoradores e invocaciones).
- C# / Rust / Go.

Para incorporar un nuevo escáner:
1. Implementa la función en `bin/code-chords.mjs` (o en un módulo auxiliar bajo `src/`).
2. Diseña la función para que retorne una estructura compatible con `schemas/code-chords.schema.json`.
3. Añade los archivos de prueba correspondientes en `tests/`.
4. Documenta su invocación en `README.md` y `SKILL.md`.

### 2. Mejoras en el visor interactivo

Las plantillas del visor residen en `templates/viewer-template.html`:
- Procura mantener el CSS organizado por variables temáticas.
- Asegúrate de que las tres disposiciones espaciales (bloques, flujo vertical continuo y espectro bíblico) conserven su responsividad y fluidez de animación.

---

## Flujo de trabajo de desarrollo

1. Crea una rama descriptiva para tu trabajo:
   ```bash
   git checkout -b feature/analizador-python
   ```
2. Realiza tus cambios asegurando la consistencia del código.
3. Ejecuta las pruebas automatizadas:
   ```bash
   npm test
   ```
4. Valida los esquemas de ejemplo:
   ```bash
   npm run validate examples/layered-architecture.json
   npm run validate examples/oop-inheritance-trace.json
   npm run validate examples/scanned-java-trace.json
   ```
5. Realiza tus confirmaciones (*commits*) siguiendo el estándar de confirmaciones convencionales (*Conventional Commits*):
   - `feat: añade escáner para clases TypeScript`
   - `fix: corrige cálculo de alturas en diseño vertical`
   - `docs: actualiza guía de instalación rápida`
6. Abre una solicitud de extracción (*Pull Request*) describiendo claramente el problema que resuelves y los cambios efectuados.

---

## Código de conducta

Este proyecto se rige por el [Código de conducta](CODE_OF_CONDUCT.md). Al participar, se espera que mantengas un trato respetuoso, constructivo e inclusivo.
