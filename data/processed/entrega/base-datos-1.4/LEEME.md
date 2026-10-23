# Base de datos · Hackathon INE 2026, Reto 2

Riesgo de abstención por municipio para la elección federal intermedia del 6 de junio de 2027.
**Información agregada por municipio; no contiene datos personales.**

| Archivo | Filas | Contenido |
| --- | ---: | --- |
| `historia_municipal.csv` | 14,862 | Participación de cada municipio en las seis elecciones federales de 2009 a 2024 |
| `municipios_2027.csv` | 2,477 | Semáforo 2027, probabilidad de rojo, personas en juego, alertas y contexto, un municipio por fila |
| `escenarios_2027.csv` | 12,385 | Participación prevista 2027 por municipio, nivel nacional (bajo, medio, alto) y sin o con intervención |
| `diccionario.csv` | 82 | Descripción y unidad de cada columna |

**Cómo leerla**

- `cvegeo` es texto de cinco caracteres con ceros a la izquierda (por ejemplo `01001`). Al abrir en Excel,
  importarla como texto.
- Celda vacía = sin dato o no aplica. Nunca equivale a cero.
- Participación = votaron / (votaron + no votaron). En `historia_municipal.csv` va de 0 a 100; en los archivos
  de 2027 va de 0 a 1, como en el mapa.
- Los escenarios con intervención (`retener_primerizos`, `jovenes_20_29`, `credencializacion` y `combinada`) son
  cuentas con supuestos explícitos, **no efectos medidos** de una campaña.
- El nivel nacional de 2027 (51.4 %) se estima con el calendario local, con una recta ajustada a las
  intermedias de 2009, 2015 y 2021 de los Conteos Censales tal como vienen (44.06 %, 47.07 % y 51.84 %). Su
  error de prueba es de unos 3 puntos y está incluido en el rango de cada municipio. `participacion_nacional`
  de la historia usa la participación ya corregida con las actas (44.09 %, 47.06 % y 51.85 %).

**Fuentes:** INE (Conteos Censales de Participación Ciudadana 2009-2024 y cómputos distritales por casilla),
INEGI, CONAPO, CONEVAL, Banxico, SESNSP, IEEPCO y calendarios de los organismos públicos locales.

**Versión:** resultados-1.4, generada el 2026-10-22. Las cifras salen de los notebooks 03 a 05 del repositorio.
