# Fuente de la página de Rucalhue Arquitectura

- `inicio.dc.html` y `cotizar.dc.html`: el diseño editable (plantilla + lógica).
- `construir.py`: genera `index.html`, `cotizar.html` y `mini.js` en la raíz.
- `predibujar.js`: deja el contenido ya dibujado dentro de las páginas (necesita Node y Playwright).
- Las imágenes están en `img/`.

Para cambiar algo: editar el `.dc.html`, correr `python3 fuente/construir.py` y `node fuente/predibujar.js`, y subir a `main`.
GitHub Pages publica `main` en https://rucalhuearquitectura.cl en uno o dos minutos.

## Cubica tu Obra

- `cubica.html` es la herramienta para clientes; es un archivo generado aparte.
- `fuente/cubica-worker.js` es el servicio opcional del Modo automático. Su clave y la API de Anthropic van como secretos del Worker, nunca en este repositorio.
