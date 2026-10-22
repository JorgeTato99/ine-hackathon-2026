# 6 · Alertas y contexto

Notebooks `03b` (secciones 3, 4, 8 y 9) y `05` (sección 4). Decisiones D12 y D17. Reportes K y L.

Estas capas **no entran al semáforo**. Ayudan a entender un municipio y a planear la intervención.

## 6.1 Alerta "sin casilla" (D12)

- **Qué es:** municipios donde 10 % o más de la lista se quedó sin casilla en alguna elección de 2009 a 2024
  (decisión comunitaria, conflicto o violencia).
- **Categorías:**
  - **recurrente**, 2 o más elecciones: 16 municipios;
  - **antecedente**, 1 elección: 59;
  - **sin antecedente:** 2,402.
- **Por qué va aparte:**
  - una campaña no resuelve que no haya dónde votar;
  - **el mejor predictor de que vuelva a pasar es el propio antecedente:** el 33 % de los municipios con
    antecedente repitió en 2024, contra 0.7 % de los demás;
  - la violencia medida por municipio no lo anticipa: acierta como adivinar al azar (reporte J).
- **Relación con el semáforo:** en estos municipios el semáforo refleja la participación observada. Si en
  la elección de entrada faltaron casillas, esa participación baja entra al modelo (D24, ver
  [07-limites.md](07-limites.md)). Los dos se leen juntos.
- **Columnas:** `alerta_sin_casilla`, `ultima_eleccion_sin_casilla`.

## 6.2 Rezago persistente

- **Qué es:** número de elecciones de 2009 a 2024 en que el municipio votó menos que el país
  (`elecciones_por_debajo_del_pais`, de 0 a 6).
- **Dato clave:** 285 municipios quedaron por debajo en las seis.

## 6.3 Zonas frías y calientes

- **Método:** agrupamiento territorial de la participación de 2024, con el indicador LISA (vecindad Queen,
  p < 0.05).
- **Resultado:**
  - 371 zonas frías (baja participación rodeada de baja participación);
  - 337 calientes;
  - 21 "bajo rodeado de alto";
  - 43 "alto rodeado de bajo".
- **Uso:** campañas regionales. Columna `zona_participacion_2024`.

## 6.4 Contexto de seguridad (D17)

| Dato | Fuente | Detalle |
| --- | --- | --- |
| Tasa de homicidios 2022–2024 | INEGI, defunciones por homicidio, por municipio de ocurrencia; población CONAPO 2023 | Por 100 mil habitantes al año, con su percentil. 2024 está un poco subestimado (2 % a 4 %) por registros tardíos |
| Qué fuente cuenta más homicidios en el estado | INEGI frente a SESNSP, 2019–2024 | Una fuente "cuenta más" si la supera por más de 5 % en al menos 5 de 6 años: en 22 estados coinciden, en 5 el SESNSP cuenta más y en 5 el INEGI |
| Quién ejerce la seguridad, policías por 10 mil habitantes, justicia cívica | Censo Nacional de Gobiernos Municipales 2025 (situación al 31 de diciembre de 2024) | 517 municipios sin policía municipal |
| Cifra oculta estatal | ENVIPE 2026 | Delitos no denunciados o sin carpeta: 93.4 % nacional (88.4 % a 96.3 % por estado) |

- **No entra al semáforo:** la violencia no mejoró la predicción.
- **El rojo no coincide con lo más violento:** el 20 % de los rojos está en el 20 % con más homicidios,
  igual que los verdes.
- **El 56 % de los rojos no tiene policía municipal.** Son sobre todo municipios de usos y costumbres de
  Oaxaca con policía comunitaria; no tener policía no va con votar menos.
- **Rojo y violento a la vez:** la intervención debe considerar la seguridad de quienes la hacen.

## 6.5 Datos de jóvenes

- **`brecha_jovenes_2024`:** participación de 20 a 29 años menos la del municipio, en puntos (mediana:
  −12.1).
- **`credencializacion_18_19_2021`:** proporción de la generación de 18 y 19 años que estaba en la lista en
  2021. Puede pasar de 1, porque el censo y la lista no cuentan igual.
- **Uso:** dicen **a quién** dirigirse. La edad y el sexo explican menos del 1 % de las diferencias entre
  municipios: no dicen **dónde**.
