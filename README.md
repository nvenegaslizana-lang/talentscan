# TalentScan

Plataforma de reclutamiento HR construida como **un solo archivo HTML**, sin backend ni base de datos. Todo corre en el navegador con JavaScript puro.

🔗 **Demo en vivo:** https://talentscann.netlify.app

## Qué hace

1. El reclutador define el cargo (título, área, experiencia, educación, habilidades).
2. Sube los CVs de los candidatos (PDF / Word / texto) → la app analiza compatibilidad automáticamente.
3. Genera un link de evaluación por candidato seleccionado.
4. El candidato abre su link, completa el test y genera un link de resultados que envía de vuelta.
5. El reclutador abre ese link y ve el informe completo (DISC, conocimientos, situacional, match de skills).

No hay servidor: los datos viajan codificados en base64 dentro del hash de la URL (`#eval=...` / `#report=...`).

## Archivos

- `index.html` — versión para desplegar (Netlify/GitHub Pages la sirven a partir de este nombre).
- `talentscan.html` — copia idéntica de respaldo.
- `TALENTSCAN_CONTEXT.md` — documentación técnica del proyecto (arquitectura, algoritmos, decisiones de diseño).

## Desarrollo local

Es un archivo estático — basta con abrirlo en el navegador o servirlo con cualquier servidor estático:

```bash
npx serve .
```

## Despliegue

Ya está desplegado en Netlify (`https://talentscann.netlify.app`). Para actualizar, sube `index.html` en [app.netlify.com](https://app.netlify.com) al proyecto `talentscann`, o conecta este repositorio para despliegue automático en cada push.

## Stack

- HTML/CSS/JS puro (sin frameworks ni build step)
- [pdf.js](https://mozilla.github.io/pdf.js/) y [mammoth.js](https://github.com/mwilliamson/mammoth.js) (CDN) para leer CVs en PDF/Word
