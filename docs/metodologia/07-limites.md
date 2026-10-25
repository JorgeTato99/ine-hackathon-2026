# 7 · Límites y uso responsable

## Lo que el modelo no puede decir

1. **Son relaciones, no causas probadas.** La evidencia más cercana a una causa es Oaxaca, al comparar antes
   y después:
   - **antes de 2018**, la brecha entre los municipios de partidos y los de usos y costumbres era de 1.8 a
     7.5 puntos;
   - **desde 2018**, cuando los de partidos empezaron a elegir ayuntamiento el mismo día que la elección
     federal, la brecha fue de 12.1 a 20.7 puntos.

   No es un experimento.
2. **Solo hay dos intermedias para aprender** (2015 y 2021), y son distintas entre sí.
3. **El nivel nacional es una estimación débil.** Se estima con el calendario (51.4 %), pero con solo tres
   intermedias y un error de prueba de unos 3 puntos (D27). El rango de cada municipio lo incluye; el semáforo
   no depende de él.
4. **La cifra exacta de cada municipio es incierta:** su error propio va de unos ±7 a ±15 puntos según el tamaño
   y, sumado al del nivel nacional, el rango mide de 18 a 29 puntos de ancho. El rango es una aproximación: probado
   de una elección a otra cubrió 93 % y 79 %, y menos en los municipios de usos y costumbres. Lo confiable es la
   posición frente a los demás.
5. **Parte del error es de cada elección:** 28 % se agrupa por estado y más de 40 % por distrito, pero no se
   repite de una elección a otra.
6. **La probabilidad de rojo es una frecuencia de simulación, optimista en los extremos:** 80 % o más se lee
   como "probable".
7. **La validación es retrospectiva con datos revisados:** algunas fuentes se publicaron después de la elección
   que se predice, y los modelos candidatos se propusieron con las dos validaciones a la vista. La ventaja del
   modelo final (D33) no está garantizada para 2027.
8. **El calendario local de 2027 puede cambiar.** Es la variable que más pesa después de la historia. Si un
   estado cambia sus elecciones, hay que correr de nuevo los notebooks 03b, 04, 04c y 05.
9. **Los datos sociales de 2027 son de 2020:** censo, CONEVAL y CONAPO son los últimos publicados por
   municipio.

## Advertencias sobre los datos

- **Los CCPC no son los resultados oficiales:**
  - no incluyen casillas especiales ni el voto desde el extranjero;
  - la sección es la del domicilio de la credencial;
  - cuando no se sabe qué hizo una persona, se supone que votó como las personas con dato de su municipio.
- **En 2012 faltan partes de la lista sin aviso** (cuadernillos no capturados). Se recuperaron con las actas
  (D16).
- **Falta de casillas como dato de entrada (D24):**
  - si en la presidencial de 2024 o en la intermedia de 2021 faltaron casillas, el modelo recibe la
    participación observada, que puede ser muy baja o 0 %;
  - se probó tratarla como "sin dato": mejoró una validación y empeoró la otra, y sacaba del rojo a
    municipios con participación muy baja y repetida, como Cherán (8 %, 7 % y 7 % en 2018, 2021 y 2024);
  - se conserva como variable de entrada;
  - con Delta con guardia (D33), en los 18 municipios con falta de casillas en 2024 el modelo no parte de esa
    participación: usa el ensamble de nivel. Aun así, el semáforo se lee junto con la alerta "sin casilla"; la
    guardia evita arrastrar el dato, pero no es una estimación validada de cuánto habrían votado con casillas.
- **Personas en juego sin dato en 15 municipios:** sus conteos de 2024 no tienen a nadie con dato, así que
  los totales en rojo quedan un poco por debajo.
- **Villa de Pozos (24059)** tiene geometría pero no datos electorales.

## Uso responsable

- **El color orienta, no decide.** Para asignar recursos hacen falta objetivos y criterios explícitos.
- **No usar lenguaje acusatorio** ni atribuir causas a un municipio: el rojo dice "riesgo de menor
  participación".
- **Información agregada y sin datos personales.**
- **El escenario con intervención es un supuesto, no un efecto medido.**
- **Actualizar en la primavera de 2027:** con el calendario local definitivo y, si se desea, los delitos de
  enero a mayo de 2027.
