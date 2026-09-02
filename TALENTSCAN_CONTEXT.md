# TalentScan — Contexto del Proyecto

> Archivo de contexto para continuar el desarrollo en sesiones futuras de Claude.
> Última actualización: septiembre 2026

---

## Qué es TalentScan

Plataforma de reclutamiento HR construida como **un solo archivo HTML** sin backend ni base de datos. Todo corre en el navegador usando JavaScript puro. Se despliega en Netlify como sitio estático.

**URL de producción:** `https://talentscann.netlify.app`  
**Archivos del proyecto:**
- `index.html` → versión para subir a Netlify (debe llamarse exactamente así)
- `talentscan.html` → copia local de respaldo (idéntica)

---

## Arquitectura General

### Sin backend — todo viaja en la URL

No hay servidor, base de datos ni sesiones. Los datos se pasan entre reclutador y candidato mediante **URL hash con JSON codificado en base64**:

```
#eval=BASE64   → abre el test para el candidato
#report=BASE64 → abre el reporte para el reclutador
```

Codificación:
```javascript
btoa(encodeURIComponent(JSON.stringify(payload)))
```

Decodificación:
```javascript
JSON.parse(decodeURIComponent(atob(hashValue)))
```

### Dos modos de uso

| Modo | Quién lo usa | Cómo se activa |
|------|-------------|----------------|
| Reclutador | HR / Recruiter | Abre la URL normal sin hash |
| Candidato | Postulante | Abre el link con `#eval=...` |

---

## Flujo Completo

```
1. Reclutador define cargo (título, área, experiencia, educación, habilidades)
2. Reclutador sube CVs → app analiza compatibilidad automáticamente
3. Reclutador selecciona candidatos → genera links de evaluación
4. Candidato abre link → completa test (datos personales + preguntas)
5. Candidato recibe link de resultados → lo envía al reclutador
6. Reclutador abre link de resultados → ve reporte completo automáticamente
```

---

## Estructura del Estado Global (JavaScript)

```javascript
const S = {
  job: {
    title: '',   // título del cargo
    dept: '',    // área/departamento
    exp: 0,      // años de experiencia requeridos
    edu: '',     // nivel educativo requerido
    skills: []   // array de habilidades clave
  },
  candidates: [
    {
      name: '',
      file: File,     // objeto File del CV
      text: '',       // texto extraído del CV
      compat: 0,      // % compatibilidad (0-100)
      quality: 0,     // % calidad del CV (0-100)
      selected: false
    }
  ],
  reports: [],        // reportes recibidos de candidatos
  cand: {             // estado del candidato durante el test
    name: '',
    email: '',
    phone: '',
    jobData: null,    // payload decodificado del link #eval=
    scores: {},       // resultados del test
    step: 0
  }
};
```

---

## Pantallas del Reclutador (Sidebar de 4 pasos)

```
nav-job      → Paso 1: Definir cargo
nav-ranking  → Paso 2: Subir CVs y ver ranking
nav-links    → Paso 3: Generar links para candidatos seleccionados
nav-reports  → Paso 4: Ver reportes de resultados
```

Las pantallas se desbloquean secuencialmente (`locked` class en el nav).

---

## Funciones Clave

### `getBaseUrl()`
Detecta la URL base para construir links compartibles:
```javascript
const NETLIFY_URL = 'https://talentscann.netlify.app';
let S_baseUrl = null;

function getBaseUrl() {
  if (S_baseUrl) return S_baseUrl;
  const href = window.location.href.replace(/#.*/, '').replace(/\?.*/, '');
  if (window.location.protocol !== 'file:') return href;
  return NETLIFY_URL; // fallback cuando se abre como archivo local
}
```

> ⚠️ Si cambia la URL de Netlify, actualizar `NETLIFY_URL` aquí.

### `generateEvalLink(cand)` — Link para el candidato

Payload compacto (llaves cortas para minimizar URL):
```javascript
const payload = {
  j: { t: S.job.title, d: S.job.dept, e: S.job.exp, u: S.job.edu, s: S.job.skills },
  n: cand.name,
  c: cand.compat,
  q: cand.quality
};
return base + '#eval=' + btoa(encodeURIComponent(JSON.stringify(payload)));
```

### `buildResultsLink()` — Link de resultados del candidato

```javascript
const payload = {
  v: 1, name: S.cand.name, email: S.cand.email,
  job: S.cand.jobData?.job || {},
  cv:  S.cand.jobData?.cv  || {},
  scores: S.cand.scores, ts: Date.now()
};
return base + '#report=' + btoa(encodeURIComponent(JSON.stringify(payload)));
```

### Detección de hash al cargar la página

```javascript
window.addEventListener('load', () => {
  const hash = window.location.hash;
  if (hash.startsWith('#eval=')) {
    // Soporta formato compacto (raw.j) y formato legacy (raw.job)
    const raw = JSON.parse(decodeURIComponent(atob(hash.slice(6))));
    const payload = raw.j ? {
      job: { title: raw.j.t, dept: raw.j.d, exp: raw.j.e, edu: raw.j.u, skills: raw.j.s },
      name: raw.n,
      cv: { compat: raw.c, quality: raw.q, found: [], missing: [] }
    } : raw;
    enterCandidateMode();
  } else if (hash.startsWith('#report=')) {
    // Carga reporte automáticamente en Step 4
    const data = JSON.parse(decodeURIComponent(atob(hash.slice(8))));
    goScreen('reports');
    renderReportsScreen();
  }
});
```

---

## Algoritmo de Análisis de CV (`analyzeCV`)

### Calidad del CV (0–100)
Evalúa la completitud estructural:
```
Sección contacto   → +15 pts
Sección educación  → +20 pts
Sección experiencia→ +25 pts
Sección habilidades→ +20 pts
Sección perfil     → +10 pts
Palabras 150-1200  → +10 pts
```

### Compatibilidad con el cargo (0–100)
```
Habilidades (60%): % de skills del cargo encontradas en el CV
Educación   (20%): nivel detectado vs requerido
Experiencia (20%): años detectados vs requeridos
```

Fórmula:
```javascript
const compat = Math.round(skillPct * 60 + eduScore + expScore);
```

Niveles educativos:
```javascript
const EDU_LEVELS = {
  'ninguna': 0, 'basica': 1, 'media': 2, 'tecnico': 3,
  'tecnologo': 4, 'universitario': 5, 'postgrado': 6, 'master': 7, 'doctorado': 8
};
```

---

## Puntuación Final del Reporte

```javascript
const overall = Math.round(
  compat          * 0.30 +   // Compatibilidad CV con cargo
  quality         * 0.10 +   // Calidad del CV
  sc.general      * 0.15 +   // Preguntas generales
  sc.tech         * 0.25 +   // Preguntas técnicas
  sc.sit          * 0.20     // Preguntas situacionales
);
```

---

## Librerías Usadas (CDN)

```html
<!-- Fuentes -->
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque&family=Inter&display=swap">

<!-- Lectura de archivos -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js">
<script src="https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js">
```

Formatos de CV soportados: PDF, DOCX, TXT

---

## Decisiones de Diseño Importantes

| Decisión | Por qué |
|----------|---------|
| `<a href target="_blank">` en lugar de `window.open()` | Los popups son bloqueados por navegadores y runtimes |
| Payload con llaves de 1 caracter (`j`, `n`, `c`, `q`) | Minimizar longitud de URL del link |
| `file://` → fallback a NETLIFY_URL | Los links locales no son compartibles entre dispositivos |
| Soportar formato compacto y legacy en el parser | Compatibilidad con links generados en versiones anteriores |
| Un solo archivo HTML | Sin backend, deploy instantáneo, cero mantenimiento de servidor |

---

## Deploy en Netlify

**Proyecto:** `talentscann` (https://app.netlify.com/projects/talentscann)  
**Badge ID:** `9a47667b-7410-46c3-8eaa-65ef24dce8d6`

Para actualizar el sitio:
1. Ir a [app.netlify.com](https://app.netlify.com) → proyecto `talentscann`
2. Arrastrar `index.html` al área de deploy
3. Esperar ~30 segundos → sitio actualizado

> ⚠️ El archivo debe llamarse exactamente `index.html` para que la URL raíz funcione.

---

## Temas Pendientes / Ideas a Futuro

- [ ] Exportar reporte como PDF
- [ ] Personalizar las preguntas del test por tipo de cargo
- [ ] Agregar más tipos de preguntas (competencias, idiomas)
- [ ] Permitir múltiples cargos simultáneos
- [ ] Panel de historial de evaluaciones (localStorage)
- [ ] Envío automático de resultados por email (requeriría un backend mínimo)

---

## Cómo Continuar en una Nueva Sesión

1. Subir el archivo `talentscan.html` a Claude
2. Decirle: *"Este es TalentScan, mi app de reclutamiento HR en un solo HTML. Aquí está el contexto del proyecto"* y adjuntar este archivo `TALENTSCAN_CONTEXT.md`
3. Describir el cambio que quieres hacer

Claude tendrá todo el contexto para continuar sin empezar desde cero.
