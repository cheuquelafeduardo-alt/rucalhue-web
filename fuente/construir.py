"""Reconstruye index.html y cotizar.html desde fuente/*.dc.html.

Uso (desde la raíz del repositorio, rama main):
    python3 fuente/construir.py          # escribe index.html, cotizar.html y mini.js
    node fuente/predibujar.js            # pre-dibuja el contenido (SEO y carga rápida)
Las imágenes viven en img/ (rama main). Para agregar una foto: copiarla a img/
y referenciarla como "img/nombre.jpg" en el .dc.html.
"""
import os, re, shutil, urllib.parse

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FUENTE = os.path.join(RAIZ, 'fuente')
DOMINIO = 'rucalhuearquitectura.cl'
SITIO = 'https://' + DOMINIO
DESC = ('Rucalhue Arquitectura, Futaleufú: diseño de casas, ampliaciones, regularizaciones, '
        'subdivisiones y proyectos de agua en la Patagonia norte. Cotiza en 2 minutos.')


def leer(nombre):
    t = open(os.path.join(FUENTE, nombre), encoding='utf-8').read()
    helmet = re.search(r'<helmet>(.*?)</helmet>', t, re.S).group(1)
    cuerpo = re.search(r'</helmet>(.*?)</x-dc>', t, re.S).group(1).strip()
    script = re.search(r'<script type="text/x-dc"[^>]*>(.*?)</script>', t, re.S).group(1)
    return helmet, cuerpo, script


def pagina(nombre, salida, titulo, desc, arreglo=None):
    helmet, cuerpo, script = leer(nombre)
    if arreglo:
        cuerpo = arreglo(cuerpo)
    url = SITIO + ('/' if salida == 'index.html' else '/' + salida)
    html = f'''<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{titulo}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#2E4539">
<link rel="icon" type="image/png" href="img/favicon.png">
<link rel="apple-touch-icon" href="img/favicon.png">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta property="og:locale" content="es_CL">
<meta property="og:title" content="{titulo}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="{SITIO}/img/compartir.jpg">
<meta property="og:url" content="{url}">
<meta name="twitter:card" content="summary_large_image">
{helmet.strip()}
<style>html{{scroll-behavior:smooth}}@media (prefers-reduced-motion:reduce){{html{{scroll-behavior:auto}}}}</style>
</head>
<body>
<div id="app">@@PRERENDER@@</div>
<template id="tpl">{cuerpo}</template>
<script src="mini.js"></script>
<script>
{script.strip()}
dcMount(document.getElementById('app'), document.getElementById('tpl'), Component);
</script>
</body>
</html>
'''
    open(os.path.join(RAIZ, salida), 'w', encoding='utf-8').write(html)


def arreglo_inicio(c):
    c = c.replace('href="Cotizar.dc.html"', 'href="cotizar.html"')
    compartir = 'Mira esto si vas a construir en el sur: Rucalhue Arquitectura ' + SITIO
    return re.sub(r'https://wa\.me/\?text=[^"]*', 'https://wa.me/?text=' + urllib.parse.quote(compartir), c)


def arreglo_cotizar(c):
    return re.sub(r'(<img src="img/logo-rucalhue\.png" alt="Rucalhue Arquitectura"[^>]*>)',
                  r'<a href="./" aria-label="Volver al inicio">\1</a>', c, count=1)


pagina('inicio.dc.html', 'index.html', 'Rucalhue Arquitectura · Construye en Futaleufú', DESC, arreglo_inicio)
pagina('cotizar.dc.html', 'cotizar.html', 'Cotiza tu proyecto · Rucalhue Arquitectura',
       'Ficha de cotización de Rucalhue Arquitectura: elige el servicio, completa los datos y envíala por WhatsApp o correo.',
       arreglo_cotizar)
shutil.copy(os.path.join(FUENTE, 'mini.js'), os.path.join(RAIZ, 'mini.js'))
print('ok')
