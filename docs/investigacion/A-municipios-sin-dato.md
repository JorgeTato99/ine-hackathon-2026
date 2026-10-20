# Reporte A · Municipios con más de la mitad de su lista en "no sabemos"

Investigación del 19 de octubre de 2026. Se cruzaron los conteos censales (CCPC) con los cómputos oficiales por casilla del INE, con prensa y con sentencias del Tribunal Electoral.

## Archivos

- **Cómputos por casilla:** 2024, https://computos2024.ine.mx/20240608_2030_COMPUTOS.zip ; 2021, https://computos2021.ine.mx/20210611_1000_CW.zip ; 2009 a 2018, https://github.com/emagar/elecRetrns/tree/master/data/casillas
- Los scripts de trabajo de esta investigación no están en el repositorio; las cifras que verificamos se reproducen en `notebooks/02_investigacion_datos_raros.ipynb`; las demás son de este reporte y están marcadas como no verificadas por nosotros donde corresponde.

## El "no sabemos" tiene tres orígenes

| Mecanismo | Qué pasó | Ejemplos | ¿Es señal de riesgo? |
| --- | --- | --- | --- |
| **A. No hubo casilla** | No se instaló o se dio de baja antes de la jornada: autogobierno, asamblea, conflicto agrario, violencia o boicot | Cherán (2015 a 2024); Bolaños (2018 y 2021); Nahuatzen (2018 y 2024); San Mateo del Mar (2012, 2021 y 2024); Oxchuc, Venustiano Carranza, Honduras de la Sierra y Siltepec (2021); Chicomuselo y Pantelhó (2024); Mazateca e Istmo de Oaxaca (2015) | **Sí, fuerte.** La participación real es casi 0 en esas secciones y se repite |
| **B. Se votó, pero el paquete se destruyó o no llegó** | Quema, robo o paquete no entregado. El cuadernillo viaja dentro del paquete | Istmo de Oaxaca (2021); Yaxkukul, Uayma, Huehuetlán y Chiconcuautla (2021); Xocchel y Sanahcat (2018); Rincón Chamula (2018 y 2024); Juchitán (2015) | **Sí**, como señal de conflicto |
| **C. Se votó normal, pero el cuadernillo no se capturó** | Las actas se computaron completas y la participación fue normal (40 % a 85 %) | Higueras, Atil, Cucurpe, Oquitoa, Tubutama, San Miguel Tenango y Santa Ana Tavela (2024); distrito 04 de Hidalgo y distrito 17 de Veracruz (2018) | **No.** Es dato perdido |

## Verificado por nosotros con las actas de 2024

| Municipio | Participación según la fórmula del CCPC | Votos del acta / toda la lista | Detalle |
| --- | ---: | ---: | --- |
| Cherán | 47.1 % | **7.1 %** | 4 casillas, para 2,271 de 15,001 electores; 1,067 votos |
| San Mateo del Mar | 20.3 % | **13.9 %** | 11 casillas, para 6,722 de 10,676 electores; 1,479 votos |
| Nahuatzen | 65.5 % | **49.0 %** | 27 casillas, para 16,279 de 22,965 electores; 11,251 votos |

## Casos documentados (fuentes citadas por el agente)

### Cherán (Michoacán)

- **2015:** el Concejo Mayor no permitió urnas.
  Quadratín, 6 de mayo de 2015: https://mexico.quadratin.com.mx/Cheran-no-permitira-instalacion-de-casillas/
- **2018:** no se instalaron 18 casillas.
  Excélsior, 1 de julio de 2018: https://www.excelsior.com.mx/nacional/cierran-casillas-en-michoacan/1249448
- **2021:** entra en las 92 casillas suspendidas en Michoacán.
  Zócalo, 6 de junio de 2021: https://www.zocalo.com.mx/pobladores-votaron-por-expulsar-a-partidos-ine-suspende-votaciones-en-92-casillas-de-michoacan/
- **2024:** negativa de concejos municipales y autoridades comunitarias.
  Animal Político, 2 de junio de 2024: https://grupoanimal.mx/politica/2-de-junio-apertura-casillas

### San Mateo del Mar (Oaxaca)

- **2012:** la asamblea ikoots se opuso y el consejo distrital eliminó 14 casillas. Tribunal Electoral, SUP-RRV-10/2012 y SUP-RRV-11/2012 (la segunda la verificamos en el texto de la sentencia).
- **2024:** la asamblea no permitió 6 casillas.
  Excélsior, 30 de mayo de 2024: https://www.excelsior.com.mx/nacional/cerradas-ocho-casillas-istmo-oaxaca-determinacion-asambleas-de-pueblos/1654913

### Bolaños (Jalisco)

- **2018:** el pueblo wixárika acordó no votar por un conflicto agrario; se dieron de baja 6 de 9 casillas. Tribunal Electoral, SUP-REC-1401/2018: https://te.gob.mx/media/SentenciasN/pdf/Superior/SUP-REC-1401-2018.pdf
- **2021:** volvieron a impedir las casillas.
  Zeta, 6 de junio de 2021: https://zetatijuana.com/2021/06/violencia-obligo-a-no-instalar-casillas-en-algunos-municipios-de-jalisco/

### Nahuatzen (Michoacán)

- **2018:** se dieron de baja 12 casillas. Tribunal Electoral, SUP-REC-1061/2018.
- **2024:** negativa comunitaria.

### Chicomuselo y Pantelhó (Chiapas), 2024

- Se dieron de baja 45 y 28 casillas por violencia. Acuerdo INE/CG844/2024: https://repositoriodocumental.ine.mx/xmlui/bitstream/handle/123456789/173483/CGex202407-18-ap-1.pdf

### Chiapas, 2021

- **Oxchuc:** el gobierno comunitario no permitió 70 casillas.
- **Venustiano Carranza:** no se instalaron 80 casillas por un conflicto agrario.
- **Honduras de la Sierra:** no se instalaron 16 casillas.
- **Siltepec:** la elección se canceló por grupos armados.

Fuentes: El Universal, 3 y 6 de junio de 2021; Expansión, 4 de junio de 2021.

### Quema o pérdida de paquetes

- **Rincón Chamula San Pedro, 2018:** tiroteo y quema de casillas. Tribunal Electoral, SX-JDC-848/2018.
- **Rincón Chamula San Pedro, 2024:** ataque armado durante el conteo. Milenio, 3 de junio de 2024.
- **Xocchel, 2018:** quemaron toda la paquetería. Diario de Yucatán, 4 de julio de 2018.
- **Santiago Laollaga, 2021:** quemaron una casilla y 5 de 6 paquetes no llegaron. Sopitas, 6 de junio de 2021.
- **2021, quema de paquetes en otros municipios:** Yaxkukul (acuerdo IEPAC C.G.-109/2021), Uayma (INE/CG1547/2021), Huehuetlán el Grande, Chiconcuautla, Santa María Xadani, Reforma de Pineda y Mixtequilla.

### 2015 en Oaxaca

- En los cómputos hay 187 casillas no instaladas y 338 sin paquete recibido, concentradas en los distritos 02 (Teotitlán), 07 (Juchitán), 11 (Pinotepa) y 05 (Tehuantepec).
- En la Mazateca, el 100 % de las casillas no se instaló.
- En Huautla, Tenango y Chilchotla, el porcentaje de la lista en casillas no instaladas es igual al "no sabemos": 94, 84 y 56 %.
- **Tixtla (Guerrero):** "en Tixtla perdemos 14 casillas". Quadratín, 7 de junio de 2015.

### Pérdida administrativa por distrito (mecanismo C)

- **2018:** distrito 04 de Hidalgo (69 % "no sabemos") y distrito 17 de Veracruz (58 %).
- **2024:** distrito 07 de Coahuila (69 %), distrito 05 de Oaxaca (43 %) y distrito 01 de Sonora (27 %).
- En todos hubo votación normal.

## Fuentes oficiales sobre el origen del "no sabemos"

- **INE, *Estudio muestral 2018*:** reconoce listas "destruidas por error" o "requeridas por el TEPJF". https://centralelectoral.ine.mx/wp-content/uploads/2019/08/EMPC-2018.pdf
- **INE, *Informe del SIJE 2024*, p. 33:** 23 casillas no instaladas el día de la jornada. https://repositoriodocumental.ine.mx/xmlui/bitstream/handle/123456789/173338/ccoe-8se-28-06-2024-p06.pdf
- **Sopitas, 1 de junio de 2024:** 222 casillas canceladas antes de la jornada (Chiapas 108, Michoacán 84).

## Implicaciones

1. **Clasificar cada municipio-elección con los cómputos por casilla:**
   - porcentaje de la lista sin casilla (mecanismo A);
   - porcentaje de la lista con paquete perdido (mecanismo B).
2. **Mecanismo A:** la participación del CCPC está inflada. Debe contar como abstención o como una categoría propia, "no participación comunitaria o por conflicto", no como dato perdido.
3. **Mecanismo B:** usar la participación de las actas y una marca de conflicto.
4. **Mecanismo C:** usar la participación de las actas o tratarlo como "sin dato".
5. **Candidatos a riesgo alto en 2027:**
   - Mecanismo A recurrente: Cherán, Nahuatzen, Charapan, San Mateo del Mar, Bolaños/Mezquitic, Oxchuc, Pantelhó, Chicomuselo, Venustiano Carranza y Honduras de la Sierra.
   - Mecanismo B recurrente: Rincón Chamula, Laollaga y Xocchel.

## Límites

- Algunas citas de prensa vienen de resúmenes de búsqueda.
- **Sin causa encontrada:** San Mateo del Mar 2021; Eloxochitlán, Mazatlán, Ixtayutla, Tepetlapa, Chichicápam e Ixil (2015); todos los casos del mecanismo C.
- **Solicitudes de transparencia sugeridas:** a la DECEyEC, un inventario de cuadernillos no capturados por causa.
