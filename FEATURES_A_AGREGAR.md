# Features a Agregar — El Ídolo Copero

## Sistema de Reconocimientos y Competencia

### 1. **Balón de Oro Real (Votación del Server)**
- Al final de cada temporada, se abre una **votación de 24h** en el servidor
- Los jugadores votan con **reacciones** (🥇 🥈 🥉) en un embed del bot
- El ganador recibe:
  - +15 de moral
  - +2 a atributo principal
  - Badge "🏆 Balón de Oro [Temporada N]" en `/perfil`
  - Mención especial en `/tabla` de temporada
- Transparencia: el bot publica votos totales por cada candidato

### 2. **Rivalidad Entre Jugadores (Carrera Activa)**
- Cuando dos usuarios tienen carrera activa en el mismo servidor:
  - El bot **detecta** automáticamente si están en el mismo equipo, liga, país, o posición
  - Muestra un **"Clásico" automático** en las confrontaciones directas
  - Si juegan en ligas diferentes pero en la misma confederación, hay un **bonus de tensión**:
    - Goles valen 1.5x en la "puntuación de rivalidad"
    - Tarjetas tienen efecto psicológico (morale -1 o +1 según resultado)
  - Sistema de "head-to-head" en `/perfil`:
    - Muestra enfrentamientos directos (PJ, PG, PP, GF, GC)
    - Historial de goles y asistencias en clásicos

### 3. **Clásicos y Rivalidades Históricas**
- **Clásicos mundiales** con tensión extra:
  - Boca vs River, Real Madrid vs Barca, Flamengo vs Fluminense, Milan vs Inter, etc.
  - En estos partidos:
    - Intensidad 1.5x (más goles, tarjetas, drama)
    - Premios de moral +5 si ganas, -5 si pierdes
    - Paga aumentada 30% (bonus en sueldos esa temporada)
  - Lista configurable en `data/clubs.js` con el campo `rivals: [id_rival]`

### 4. **Objetivos de Temporada (Dirección del Club)**
- Al inicio de cada temporada, tu club te da 1-2 **objetivos concretos**:
  - "Top 4" → clasificación a copa continental
  - "Ganar la liga"
  - "No descender"
  - "Llegar a semis de copa"
  - "Ganar el torneo local" (si hay playoffs)
- Rewards según cumplimiento:
  - Cumplido: +3 moral, +10% bonus salarial esa temporada
  - Incumplido: -2 moral, club puede pedir refuerzo/cambio en mercado de pases
  - Muy cumplido (ej: ganas la liga + Copa): +6 moral, +20% bonus

### 5. **Racha de Partidos (Moral y Rendimiento)**
- **Sistema de Racha**:
  - Ganas 3+ partidos seguidos: "En racha" → +0.2 al rating de cada partido
  - Pierdes 3+ partidos seguidos: "Pánico" → -0.2 al rating, -2 moral
  - En racha de 5+: Tu equipo gana más (tabla sube más rápido)
  - En pánico de 5+: Posibilidad de que otros jugadores pidan traspaso, hinchada tensa
- Visual: emoji 🔥 (racha) o 📉 (pánico) en `/perfil` e `/simular`

---

## Eventos de Carrera y Decisiones

### 6. **Ofertas de Clubes de Arabia**
- Ocasionalmente aparece una **"oferta millonaria"** de Arabia Saudí:
  - Club ofrece 2-5x tu sueldo actual
  - Si tienes >28 años: oferta es más probable
  - Decisión tipo "momento decisivo" con 3 opciones:
    - ✅ **Aceptar**: +50% sueldo, club con media más baja (pero dinero), moral -1 por "exilio", pero +5 si llegas a top scorer
    - ⚖️ **Negociar**: pide aumento a tu club actual
    - ❌ **Rechazar**: club actual +2 moral por lealtad, potencial salarial sube

### 7. **Importancia de Edad — El Retiro (42 Años)**
- **A los 41 años**:
  - El bot advierte: "Te quedan ~2 temporadas de elite"
  - Cada partido que ganas suma para el "legado"
  
- **A los 42 años**, aparece la decisión **"Elegí tu Retiro"**:
  - 🏆 **Último Partido de Retiro**: eliges un partido importante (clásico, playoff, fecha simbólica) y jugas tu último partido de carrera
    - Rating máximo posible (95-99)
    - El bot simula una ceremonia post-partido con emoticones y mensajes especiales
    - Veredicto especial: "Leyenda que se fue en la cancha"
  - 🏃 **Retiro Inmediato**: termina la carrera ya
    - Veredicto normal según stats

---

## Eventos Dinámicos y Drama

### 8. **Cambios Político/Institucionales del Club**
- Ocasionalmente pasa lo siguiente:
  - **Cambio de DT**: nuevo técnico te pide cambiar de puesto/táctica, -1 moral o +1 si aceptas
  - **Cambio de presidente/dueño**: nuevo proyecto, posibles ofertas de otros clubes
  - **Crisis financiera**: club baja sueldos -20%, decisión de irte o quedarte

### 9. **Injury Complications (Lesiones Serias)**
- Si te lesionas varias veces en una temporada:
  - Aparece oferta de "operación costosa": +dinero de bolsillo vs riesgo de recaída
  - Fisioterapeuta nuevo: cambio de dinero vs confianza

### 10. **Conflictos con la Hinchada**
- Si tienes rendimiento malo + moral baja:
  - Hinchada pide tu traspaso en un partido
  - Dos opciones: irte del club o hacer un partido "revancha"
- Si tienes rendimiento bueno + moral alta:
  - Hinchada organiza "Banderazo" → +3 moral, +0.5 rating próximo partido

---

## Sistema de Hitos y Legado

### 11. **Récords Personales y Históricos**
- El bot guarda "Récords del Servidor":
  - Máximo goles en una temporada
  - Máximo rating en carrera
  - Más partidos jugados
  - Más títulos ganados
  - Más assists
- En `/perfil`, si batiste un récord: se muestra con ⭐

### 12. **Torneo Inter-Temporadas (Amistosos)**
- A mitad de temporada (cuando hay poca actividad):
  - Torneo exprés de 4-6 partidos vs otros jugadores del servidor
  - Si ganas: +2 moral, bonus de dinero
  - Presencia en tabla global del servidor

---

## Personalización de Decisiones

### 13. **Banco Expandido de Decisiones Importantes**
Agregar a `decisions.js`:

- **Fichar por Arabia**: (visto arriba)
- **Cambio de representante**: costo de dinero, pero mejores ofertas futuras
- **Infiltración o Operación**: elegir método de recuperación ante lesión
- **Matrimonio/Vida Personal**: -2 moral inicial pero +1 permanente (equilibrio vida-carrera)
- **Escándalo mediático**: tu club te defiende (+moral) o te castiga (-dinero)
- **Oferta de Entrenador Amistoso**: enseña nuevo minijuego o técnica especial
- **Paso a la Directiva**: post-retiro, opción de ser DT/comentarista del servidor

---

## Mejoras a Minijuegos

### 14. **Minijuegos Contextuales**
- **Clásicos**: minijuego 5 botones en vez de 3 (tiro libre, penal, mano a mano, centro, regate)
- **Último partido antes de retiro**: minijuego garantizado (no depende de azar)
- **Partidos contra Arabia**: minijuego con opciones de "Soborno / Juego Limpio" (tono divertido)

---

## Persistencia de Datos

### 15. **Historial de Carrera Completo**
- Guardar en `data/players.json`:
  - Temporadas jugadas
  - Equipos donde jugaste
  - Goles y asistencias por temporada y club
  - Títulos y trofeos
  - Injury records
  - Deciciones importantes tomadas
- `/historial-completo` comando: muestra timeline de toda la carrera

---

## Configuración de Dificultad

### 16. **Modos de Juego**
- Agregar configuración en `.env`:
  ```
  GAME_MODE=classic        # actual
  GAME_MODE=hard           # más lesiones, más competencia
  GAME_MODE=story          # más decisiones, menos simulación pura
  ```
- Cada modo ajusta probabilidades en `simulation.js`

---

## Resumen de Prioridades

| Feature | Impacto | Dificultad | Prioridad |
|---------|---------|-----------|-----------|
| Balón de Oro Votación | Alto | Media | ⭐⭐⭐ |
| Rivalidades de Jugadores | Alto | Media | ⭐⭐⭐ |
| Clásicos Históricos | Medio | Baja | ⭐⭐⭐ |
| Objetivos de Temporada | Medio | Media | ⭐⭐ |
| Racha de Partidos | Medio | Baja | ⭐⭐⭐ |
| Retiro a los 42 + Último Partido | Alto | Baja | ⭐⭐⭐ |
| Ofertas de Arabia | Bajo | Baja | ⭐⭐ |
| Minijuegos Contextuales | Medio | Media | ⭐⭐ |
| Historial Completo | Bajo | Media | ⭐ |

---

## Próximos Pasos

1. **Fase 1**: Votar las 3 features más importantes del servidor
2. **Fase 2**: Implementar Balón de Oro, Rivalidades y Clásicos
3. **Fase 3**: Sistema de Retiro y Último Partido
4. **Fase 4**: Eventos dinámicos y Drama
