# Otras bases de datos: ¿podrían ayudar a pronosticar?

Búsqueda del 22 de octubre de 2026. Para que una base sirva al modelo debe existir **por municipio** y
tener un valor **antes de 2015, antes de 2021 y antes de 2027**: sin eso no se puede aprender, validar
y predecir. Las URL se comprobaron; lo que no se pudo verificar se dice.

## Probada: elecciones de ayuntamiento (Magar)

**Fuente:** Eric Magar (ITAM), repositorio público `elecRetrns`, archivo `aymu1970-on.coalAgg.csv`:
resultados de ayuntamientos de 1970 a 2025 con votos totales y lista nominal
(https://github.com/emagar/elecRetrns). Es una base académica, no oficial. Se usaron solo las
elecciones ordinarias con estado `ok` desde 2000; se descartaron 288 con participación fuera de 5 a 100 %.

| Variable | Construcción (solo elecciones anteriores a cada intermedia) | ρ 2015 | ρ 2021 | Estable | Mejora del modelo final |
| --- | --- | ---: | ---: | --- | --- |
| `part_local_ultima_vs_estado` | Participación en la última elección de ayuntamiento menos la mediana de su estado en esa elección | 0.14 | 0.13 | sí | sí: −0.084 y −0.076 pp |
| `brecha_local_federal_hist` | Promedio de (participación local − participación federal anterior más cercana) en elecciones de ayuntamiento no concurrentes. Solo existe para unos 1,360 municipios | 0.31 | 0.16 | sí, la más fuerte | no |
| `margen_local_ultimo` | Margen de victoria en la última elección municipal | −0.00 | −0.02 | no | no |

**Juntas con las dos de CONEVAL que también mejoraban, ya no mejoran en las dos validaciones**
(−0.040 y −0.005, intervalo con el cero), ni mejoran el acierto en el 20 % de mayor riesgo. Ver la
recomendación en [cambios-y-pruebas.md](cambios-y-pruebas.md).

**Dato útil de paso:** la base incluye las elecciones de ayuntamiento de 2025 de Veracruz (211
municipios) y de Durango (39). Es consistente con que esos dos estados no elijan ayuntamiento en 2027,
que está verificado con el mapa de elecciones 2027 del INE.

## Solo sirven como diagnóstico o contexto (no existen antes de 2015)

| Base | Institución | Nivel | Año | Por qué no entra al modelo | Uso posible |
| --- | --- | --- | --- | --- | --- |
| Consulta Popular | INE (cómputos) | Mesa por unidad territorial | 1 de agosto de 2021 | Un solo año, posterior a la intermedia de 2021 | Ver si la participación "fuera de ciclo" explica el error del modelo en 2021 |
| Revocación de Mandato | INE (cómputos) | Casilla por unidad territorial | 2022 | Un solo año | Ídem |
| Elección del Poder Judicial | INE (cómputos) | Casilla con sección | 2025 | Un solo año; no se puede validar | Señal reciente de disposición a votar, como contexto para 2027 |
| Votar Entre Balas (violencia político-criminal) | Data Cívica | Municipal | 2018 en adelante | No existe antes de 2015 | Contexto de seguridad. Su informe estima que la participación baja 1.3 % por cada agresión a candidaturas (2018-2021) |
| ACLED | ACLED | Evento georreferenciado | 2018 en adelante | No existe antes de 2015 | Contexto |

Descargas comprobadas por el agente (participación nacional que dan los archivos):
- Consulta 2021: 57,077 mesas, 7.11 %;
- Revocación 2022: 57,449 actas, 17.78 %;
- elección judicial 2025: 84,266 casillas, 13.02 %.

Para pasarlas a municipio hay que repartir las unidades territoriales que abarcan más de un municipio
(1,701 de 23,961 en 2021).

## Existen por municipio con serie histórica, pero se espera poco aporte

| Base | Institución | Años | Por qué se espera poco |
| --- | --- | --- | --- |
| Base de casillas de elecciones municipales (Calderón-Hernández et al., *Scientific Data*, 2025) | Académica | 1994–2019 | Casi lo mismo que Magar y no llega a 2024 |
| Asegurados del IMSS | IMSS | Mensual, 1997–2026 | Clave municipal propia del IMSS, sin tabla de equivalencias verificada; se parece a la participación económica que ya se probó |
| Censo Nacional de Gobiernos Municipales, módulo de participación ciudadana | INEGI | Bienal, 2011–2025 | Los cuestionarios cambian entre ediciones |
| Accesos de internet fijo | IFT / CRT | 2013–2025 | Incompleta antes de 2015; dice lo mismo que internet del censo |
| Lluvia diaria (CHIRPS) | UCSB | 1981 en adelante | El dato del 6 de junio de 2027 no se conoce antes; solo serviría para limpiar el entrenamiento |
| Personas desaparecidas (RNPDNO) | SEGOB | Histórico | Tablero sin descarga directa; registro retroactivo |

## No sirven por municipio

- Padrón Único de Beneficiarios de programas sociales: estatal, de 2019 en adelante.
- ENDUTIH (uso de internet y redes sociales): estatal.
- Afiliados a partidos: sin serie municipal pública.
- Desplazamiento forzado (CMDPDH): solo informes.

## Recomendación

- **Ninguna base nueva cambia el panorama.** La mejor, la participación en elecciones de ayuntamiento,
  mejora alrededor de 1.5 %, y la mejora desaparece al combinarla con otras.
- **Para una versión posterior:** integrar Magar con más cuidado (más elecciones por municipio y
  participación local relativa a la federal) y usar la elección judicial 2025 como contexto.
- **Para la entrega:** mencionar en el reporte que se buscaron y probaron estas fuentes, como evidencia
  de que la historia del municipio y el calendario local ya capturan lo principal.
