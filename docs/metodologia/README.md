# Metodología · Riesgo de abstención por municipio, intermedia 2027

Hackathon INE 2026, Reto 2 ("Predicción y escenarios de riesgo de abstención"). Equipo Kipustec.
Documento de referencia de cómo se hizo todo el análisis, de los datos crudos a los archivos que lee el
mapa. Cada cifra sale de los notebooks del repositorio; las decisiones están en [`docs/bitacora.md`](../bitacora.md).

## La pregunta

> "¿Qué zonas podrían presentar mayor abstención en el futuro si no se interviene?"

- **Para qué le sirve al INE:** planeación anticipada y priorización de recursos.
- **Unidad:** municipio (2,477 con datos; la clave de unión es `cvegeo` del INEGI).
- **Objetivo:** la elección federal intermedia del 6 de junio de 2027.
- **Qué se predice:** la participación de cada municipio en 2027, en dos partes:
  - un modelo municipal predice su **desviación** frente al país;
  - un modelo nacional por calendario estima el nivel del país: **51.4 %** (D27).

## El camino, de principio a fin

```text
Datos del INE (CCPC 2009–2024, actas por casilla)  +  INEGI, CONAPO, CONEVAL, Banxico, SESNSP, IEEPCO, OPLE
      │
      ▼
01 · Calidad de los datos  ──  02 · Datos raros (falta de casillas, paquetes, cuadernillos)
      │
      ▼
03 · Historia de cada municipio con el territorio de 2024  →  panel_municipal.parquet (14,862 filas)
      │
      ▼
03b · Variables externas, patrones e indicadores  →  variables_transiciones.parquet, indicadores_mapa.parquet
      │
      ▼
04 · Modelo y validación  →  riesgo_2027.parquet       04b · Pruebas finales (14 modelos, 18 variables más)
      │
      ▼
04c · Por qué de cada predicción (aportes por grupo de variables)  →  aportes_2027.parquet
      │
      ▼
05 · Nivel nacional, semáforo, personas en juego, intervención  →  data/processed/mapa/resultados-1.5/ (lo que lee el mapa)
      │
      ▼
scripts/entrega_base_datos.py  →  data/processed/entrega/base-datos-1.5/ (base de la entrega)
```

## Índice

| # | Documento | Contenido |
| --- | --- | --- |
| 1 | [01-datos-y-calidad.md](01-datos-y-calidad.md) | Fuentes del INE, fórmula de participación, reglas de "sin dato", actas, territorio de 2024, falta de casillas, correcciones |
| 2 | [02-variables.md](02-variables.md) | Resumen de las 101 variables y enlace al catálogo completo |
| 3 | [03-modelo-y-validacion.md](03-modelo-y-validacion.md) | Qué se predice, cómo se valida, regla simple, métricas, 14 modelos, modelo final, importancia, estructura del error |
| 4 | [04-pronostico-2027.md](04-pronostico-2027.md) | Modelo nacional por calendario, predicción única, rango, probabilidad de rojo, semáforo, por qué de cada predicción, cómo leer casos como Xalapa o Mapimí |
| 5 | [05-intervencion-y-personas.md](05-intervencion-y-personas.md) | Personas en juego y tipos de intervención |
| 6 | [06-alertas-y-contexto.md](06-alertas-y-contexto.md) | Alerta "sin casilla", zonas frías, rezago persistente, seguridad |
| 7 | [07-limites.md](07-limites.md) | Lo que el modelo no puede decir y cómo usarlo con responsabilidad |
| 8 | [08-decisiones.md](08-decisiones.md) | Las 30 decisiones (D1 a D30), en una tabla |
| 9 | [09-reproducir.md](09-reproducir.md) | Cómo volver a generar todo y qué prueba la reproducibilidad |

Documentos relacionados:
- [`docs/variables/`](../variables/): catálogo de variables;
- [`docs/vistas-mapa.md`](../vistas-mapa.md): vistas del mapa y cifras de control;
- [`docs/contrato-datos.md`](../contrato-datos.md): contrato de los archivos;
- [`docs/fuentes-externas.md`](../fuentes-externas.md): fuentes y verificaciones.

## Resultados en una página

| | |
| --- | --- |
| Registros del INE analizados | 54,872,712 (Conteos Censales de Participación Ciudadana, 2009–2024) |
| Municipios | 2,477 con historia de 2009 a 2024 (más Villa de Pozos, que tiene geometría y no tiene datos) |
| Variables probadas | 101, de las que 34 están en el modelo |
| Modelo | Ensamble: promedio de una regresión robusta (Huber) y un random forest |
| Validación (aprende de 2015, predice 2021) | Error al ordenar municipios: 5.32 pp, contra 6.03 de la regla simple. Ponderado por personas: 4.30 contra 6.80. Acierto en el 20 % de mayor riesgo: 70 % contra 67 % |
| Validación al revés (aprende de 2021, predice 2015) | 6.16 contra 9.43 de la regla simple |
| Nivel nacional estimado para 2027 | 51.4 %, con un modelo por calendario (error de prueba de unos 3 puntos) |
| Semáforo 2027 | 495 municipios en rojo (23.8 millones de personas en la lista), 496 en amarillo y 1,486 en verde |
| Dos historias del rojo | 413 sin elección municipal ese día (6.3 millones de personas) y 82 que la tienen pero votan poco siempre (17.5 millones) |
| Intervención por tipo | Retener primerizos: salen 20 rojos. Jóvenes de 20 a 29: 66. Credencialización: 5. Las tres juntas (505,007 votos): 87, con 4.7 millones de personas; 408 siguen en rojo |

**Lo que más anticipa la abstención** es la historia del municipio y si elige ayuntamiento el mismo día.
Las variables sociales y económicas se relacionan con votar menos, pero casi no agregan información que la
historia no tenga ya. Son relaciones, no causas probadas.
