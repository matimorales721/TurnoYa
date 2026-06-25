# TurnoYa

TurnoYa es una app web simple y mobile-first para usar como temporizador de turnos en juegos de mesa. La idea es reemplazar el temporizador del celular cuando hace falta una interfaz de mesa: un boton grande, pocos gestos y avisos claros.

## Como correr

```bash
npm install
npm run dev
```

Para generar una build de produccion:

```bash
npm run build
```

## MVP

- App 100% frontend con React, TypeScript y Vite.
- Pantalla unica responsive.
- Selector de duracion: 15s, 30s, 45s, 60s y opcion configurable en segundos o minutos.
- Modo multijugador con cantidad variable de jugadores.
- Nombres, colores y turno actual guardados en el navegador.
- Boton central gigante.
- Sonidos generados con Web Audio API, sin archivos externos.
- Tres variantes de sonido para fin de turno: tranquilo, medio y estruendoso.
- Vibracion desactivada por ahora; queda como mejora futura.

## Estados

- `READY`: muestra "Iniciar turno". Un toque arranca la cuenta regresiva.
- `RUNNING`: muestra el tiempo restante. En los ultimos 5 segundos cambia el color y emite un pip por segundo si el sonido esta activo. Un toque pasa al siguiente jugador y vuelve a `READY`; doble toque pasa al siguiente jugador y arranca el turno.
- `ALARMING`: al llegar a 0 reproduce alarma y muestra estado finalizado. La alarma se apaga sola a los 3 segundos si nadie toca nada. Un toque avanza al siguiente jugador y vuelve a `READY`; doble toque avanza al siguiente jugador y arranca el turno.

## Multijugador

La cantidad de jugadores puede ajustarse desde el control "Jugadores". Por defecto la partida empieza con 3 jugadores: Mati, Marcos e Ingrid; si se suman mas, aparecen Gabi y Dan como cuarto y quinto jugador. Cada jugador puede cambiar su nombre y color. La rotacion es circular: despues del ultimo jugador vuelve el primero.

Los jugadores y el turno actual se guardan en `localStorage`, asi que al recargar la pagina la partida conserva quien seguia.

El temporizador se mantiene separado de la logica de jugadores. `useTurnTimer` solo controla estados y segundos; `App` decide cuando avanzar al siguiente jugador.

Tambien se puede elegir manualmente el jugador tocando su nombre. Al hacerlo, el temporizador vuelve a `READY` para iniciar ese turno. Para editar nombre y color, hay que mantener presionado el nombre del jugador.
El orden se puede cambiar arrastrando los chips de jugadores.

## Gestos

- Boton principal, 1 toque: si esta listo, inicia; si hay un turno corriendo o sonando, pasa al siguiente jugador y queda listo.
- Boton principal, 2 toques: pasa al siguiente jugador y arranca inmediatamente.
- Boton principal, mantener presionado: cancela el turno actual y vuelve a `READY`.
- Nombre de jugador, 1 toque: elige manualmente ese turno.
- Nombre de jugador, 2 toques: elige ese jugador y arranca su turno.
- Nombre de jugador, arrastrar: cambia el orden de turnos.
- Nombre de jugador, mantener presionado: muestra u oculta la edicion de nombre y color.
- Control de jugadores: abre la cantidad de jugadores disponibles, de 2 a 8.
- Sonido: activa/desactiva avisos y permite elegir una de tres alarmas de fin de turno.

## Proximos pasos

- Ajustar sonidos con pruebas reales en mesa.
- Afinar accesibilidad y textos para lectores de pantalla.
- Agregar modo PWA cuando el MVP este validado.
- Guardar duracion y sonido si hace falta.
- Reincorporar vibracion como opcion configurable.
