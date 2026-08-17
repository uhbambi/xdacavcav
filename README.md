# El Ídolo Copero — Bot de Discord

Simulador de carrera de futbolista para Discord, al estilo "El Ídolo" / "El Copero": creas tu jugador, jugai partido a partido con eventos random (goles, asistencias, tarjetas, lesiones), subís tus **atributos tipo FIFA**, jugás **minijuegos de botones** en los partidos importantes, peleás ascensos y descensos, la **Libertadores desde la fase de grupos** y el **Mundial** con tu selección.

**392 clubes** repartidos en **33 ligas de 24 países** (con **segunda división** en Chile, Argentina, Brasil, México, España, Inglaterra, Italia, Alemania y Francia), cada uno con su **media real** (45-91) — nunca te va a ofertar un grande de media 88 si tenés 53.

Toda la carrera se juega con **botones** — después de crear tu jugador casi no necesitas volver a escribir comandos: cada partido trae un botón "▶️ Siguiente partido" (y accesos rápidos a Tabla/Perfil/Atributos), y el mercado de pases muestra un botón por cada oferta de club.

## Comandos

| Comando | Qué hace |
|---|---|
| `/crear-jugador` | Crea tu jugador (nombre, posición, nacionalidad) |
| `/simular` | Juega el próximo partido de liga o copa, minuto a minuto |
| `/tabla` | Tabla de posiciones de tu liga esta temporada |
| `/perfil` | Ficha de tu jugador, stats, atributos y vitrina |
| `/atributos` | Tus atributos tipo FIFA (ritmo, tiro, pase, regate, defensa, físico) |
| `/transferir` | En el mercado de pases: revisa ofertas y elige club |
| `/vitrina` | Tu vitrina de trofeos: títulos colectivos y premios individuales |
| `/estadio` | Estadio de tu club (capacidad, asistencia, ambiente, taquilla, remodelaciones) |
| `/hinchada` | Relación con la hinchada (ídolo, amado, cuestionado o silbado) |
| `/dna` | ADN futbolístico (clutch, presión, regularidad, liderazgo…) |
| `/objetivos` | Objetivos personales de temporada y su progreso |
| `/records` | Récords históricos mundiales del servidor y del universo |
| `/goat` | Ranking GOAT: índice histórico de los mejores de todos los tiempos |
| `/mercado` | Mercado de fichajes global (traspasos, rumores, agentes libres) |
| `/promesas` | Generación de promesas y wonderkids del mundo NPC |
| `/retirar` | Termina tu carrera y recibe el veredicto final |
| `/ayuda` | Resumen de cómo jugar |

## Cómo se juega

1. `/crear-jugador` — eliges nombre, posición y nacionalidad (24 países). **Arrancas en la segunda división** de tu país si existe, en un club chico, con un botón para jugar tu primer partido de una. Tu media sale de tus **atributos** (ritmo, tiro, pase, regate, defensa, físico) ponderados por tu puesto: un delantero vive del tiro, un volante del pase, un defensa de la marca.
2. Antes de cada partido elegís **táctica**: ⚔️ Ofensivo, ⚖️ Equilibrado o 🛡️ Defensivo — afecta de verdad el resultado (ofensivo mete más goles pero te expone atrás, defensivo achica al rival pero te cuesta más atacar).
3. Cada partido tira goles, asistencias, tarjetas amarillas/rojas y (con poca probabilidad) lesiones, todo minuto a minuto. La tabla de posiciones es una liga real: **todos los clubes juegan cada fecha** entre ellos, no solo contra vos, así que el campeonato se pelea de verdad.
4. De tanto en tanto aparece un **momento decisivo** después de un partido (una entrevista, un llamado del DT, la hinchada esperándote) con 2 opciones que afectan tu moral y progresión — pura decisión random de las tuyas.
5. En los **partidos importantes** (clásicos, definiciones de liga, copa y Mundial) el partido se frena y aparece un **minijuego de 3 botones**: penal, mano a mano, tiro libre, centro al área, cabezazo o atajada. Solo uno de los tres termina en gol y no se puede adivinar mirando el mensaje; tu atributo relevante te da una segunda chance (con mucho tiro la metés igual aunque el arquero adivine).
6. Si te **lesionás**, la carrera NO se frena: tu equipo juega igual esas fechas sin vos, se simulan todos los partidos, la tabla avanza y volvés cuando se te acaba la baja.
7. Si terminas la liga entre los **4 primeros** de primera división, clasificas a la copa continental — **Copa Libertadores**, **Champions League**, **Concachampions** o **AFC Champions League** — que **arranca en fase de grupos** (6 fechas, ida y vuelta) y sigue con octavos, cuartos, semi y final, con penales si hay empate.
8. Los **ascensos y descensos** son reales: si salís 1° o 2° en la B subís a primera con tu club; si terminás en los últimos dos de primera, te vas a la B.
9. Cada 4 temporadas hay **Mundial**: si tu media alcanza, te convocan a tu selección y jugás fase de grupos + eliminatorias con ella (los partidos suman a tu historial de selección).
10. Al terminar la temporada salta una **decisión de carrera** con peso real (elegir el foco de entrenamiento del año, operarte o infiltrarte, cambiar de representante, escuchar a Arabia, comprometerte con la selección): tocan atributos, potencial, lesiones y las ofertas que te llegan. Después aparece un botón por cada club que te ofertó **según tu media y tu reputación**, más "Quedarme".
11. Repite temporada tras temporada. Tu jugador reparte puntos de crecimiento entre sus atributos según su rendimiento, edad, moral, el nivel del club donde entrena y su foco de entrenamiento.
12. Cuando quieras parar, `/retirar` te da un veredicto final: desde "Nombre Olvidado" hasta "Leyenda Absoluta", según goles, asistencias y títulos.

Los botones son personales: si otra persona del servidor toca el botón de tu partido, el bot le avisa que use su propio `/crear-jugador` en vez de mover tu carrera.

Los datos de cada jugador se guardan en `data/players.json` (uno por usuario de Discord), así que la carrera sigue donde quedó aunque se reinicie el bot.

## Instalación

### 1. Requisitos
- [Node.js](https://nodejs.org) 18 o superior.
- Una cuenta de Discord y permisos para crear una aplicación/bot.

### 2. Crear la aplicación en Discord
1. Ve a https://discord.com/developers/applications → **New Application**.
2. En la pestaña **Bot**, click en **Reset Token** y copia el token (lo vas a pegar en `.env`).
3. Activa el bot en el servidor: pestaña **OAuth2 → URL Generator**, marca `bot` y `applications.commands` en Scopes, y en Bot Permissions marca `Send Messages` y `Use Slash Commands`. Copia la URL generada, ábrela en el navegador y agrega el bot a tu servidor.
4. En **General Information** copia el **Application ID** (es el `CLIENT_ID`).
5. Si quieres que los comandos aparezcan al tiro (en vez de esperar ~1 hora), activa el modo desarrollador en Discord (Configuración → Avanzado → Modo desarrollador), click derecho sobre tu servidor → **Copiar ID del servidor** (ese es el `GUILD_ID`).

### 3. Configurar el proyecto
```bash
npm install
cp .env.example .env
```
Edita `.env` y completa:
```
DISCORD_TOKEN=el_token_del_bot
CLIENT_ID=el_application_id
GUILD_ID=el_id_de_tu_servidor   # opcional, pero recomendado mientras pruebas
```

### 4. Registrar los comandos y prender el bot

**Ya no hace falta correr dos comandos por separado** — `index.js` registra los slash commands automáticamente cada vez que arranca, y después conecta el bot. Esto es útil en hostings (como KataBump y similares) donde solo podís configurar **un** Startup Command:

```bash
npm start
```

o directamente:

```bash
node index.js
```

En la consola vas a ver primero `Registrando 7 slash commands...` y después `✅ Bot conectado como TuBot#1234`. Los comandos van a estar disponibles en tu servidor al tiro si pusiste `GUILD_ID`, o en ~1 hora si no lo pusiste (quedan globales).

Si preferís registrar los comandos por separado (por ejemplo, para no pegarle a la API de Discord en cada reinicio), también podís correr `npm run deploy` una vez y listo — `index.js` funciona igual sin eso, pero re-registra los comandos cada vez que arranca por las dudas.

## Estructura del proyecto
```
idolo-bot/
├── index.js              # arranca el bot, despacha slash commands y botones
├── deploy-commands.js    # registra los slash commands en Discord
├── data/
│   ├── clubs.js          # 392 clubes, 33 ligas (A y B), medias, confederaciones y banderas
│   ├── nations.js        # selecciones nacionales para el Mundial
│   ├── storage.js        # guardado/lectura en players.json
│   └── players.json      # se crea solo al primer uso
├── commands/              # un archivo por slash command (delgados, delegan a game/engine.js)
├── game/
│   └── engine.js          # logica central compartida por comandos y botones (partidos, copas, mercado, decisiones)
└── utils/
    ├── simulation.js      # motor de partidos (goles, eventos, rating, tacticas, lesiones)
    ├── attributes.js      # atributos tipo FIFA y calculo de la media por posicion
    ├── minigames.js       # minijuegos de 3 botones (penal, mano a mano, tiro libre, ...)
    ├── cups.js            # copas continentales y Mundial (grupos + mata-mata + penales)
    ├── season.js          # calendario, tabla, fechas jugadas lesionado, ascensos/descensos
    ├── decisions.js       # banco de momentos decisivos y eventos de carrera
    └── player.js          # creación, progresión, ofertas y veredicto del jugador
```

## Probar sin Discord

```bash
npm run smoke          # simula 12 temporadas completas apretando los botones por consola
npm run smoke -- 20 --stay   # 20 temporadas quedandote siempre en el mismo club
```

## Personalizar

- **Agregar/editar clubes**: edita `data/clubs.js`. Cada club tiene `name` y `media` (45-91); el `tier` se deriva solo de la media.
- **Agregar minijuegos**: en `utils/minigames.js`, cada entrada define título, atributo que lo resuelve, recompensa y sus **3 opciones**.
- **Editar decisiones**: en `utils/decisions.js`, cada opción tiene un `effect` (`morale`, `attr`, `potential`, `trainingFocus`, `injuryRisk`, `extraOffers`).
- **Ajustar dificultad de la simulación**: en `utils/simulation.js`, la función `rollGoals` controla cuántos goles se hacen según la diferencia de fuerza; `playerTeamStrength` controla cuánto pesa el overall del jugador en el equipo.
- **Ajustar el mercado de pases**: en `utils/player.js`, `generateOffers` decide qué clubes te ofertan según tu overall y tu tier actual.

## Notas
- Es un juego de un jugador por cuenta de Discord: cada usuario tiene su propia carrera guardada por su ID.
- No requiere base de datos externa ni hosting especial: corre en cualquier VPS, Raspberry Pi, o servicios tipo Railway/Render con `npm start`.
