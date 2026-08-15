'use strict';

/**
 * Base de datos de ligas y clubes.
 *
 * Cada club tiene una `media` (rating global del plantel, 45-91) que define su fuerza real
 * y que tan exigente es para fichar ahi: un club de media 84 no te va a ofertar si tenis 53.
 * El `tier` (1-5) se deriva de la media, para no tener dos numeros que se contradigan.
 *
 * Cada liga tiene `level` (1 = primera division, 2 = segunda) y enlaces de ascenso/descenso.
 * `confed` decide la copa continental: CONMEBOL -> Libertadores, UEFA -> Champions,
 * CONCACAF -> Concachampions, AFC -> AFC Champions League.
 */

const FLAGS = {
  Chile: '🇨🇱',
  Argentina: '🇦🇷',
  Brasil: '🇧🇷',
  Uruguay: '🇺🇾',
  Colombia: '🇨🇴',
  Peru: '🇵🇪',
  Ecuador: '🇪🇨',
  Paraguay: '🇵🇾',
  Bolivia: '🇧🇴',
  Venezuela: '🇻🇪',
  Mexico: '🇲🇽',
  'Estados Unidos': '🇺🇸',
  Espana: '🇪🇸',
  Inglaterra: '🏴',
  Italia: '🇮🇹',
  Alemania: '🇩🇪',
  Francia: '🇫🇷',
  Portugal: '🇵🇹',
  'Paises Bajos': '🇳🇱',
  Turquia: '🇹🇷',
  Belgica: '🇧🇪',
  Escocia: '🏴',
  Grecia: '🇬🇷',
  'Arabia Saudita': '🇸🇦',
  Japon: '🇯🇵',
  Suiza: '🇨🇭',
  Austria: '🇦🇹'
};

/** media -> tier (1 chico ... 5 elite mundial) */
function tierFromMedia(media) {
  if (media >= 84) return 5;
  if (media >= 78) return 4;
  if (media >= 71) return 3;
  if (media >= 63) return 2;
  return 1;
}

const RAW_LEAGUES = {
  // ───────────────────────── CONMEBOL ─────────────────────────
  CHILE_A: {
    name: 'Primera Division de Chile', country: 'Chile', confed: 'CONMEBOL', level: 1,
    relegatesTo: 'CHILE_B',
    cupName: 'Copa Chile',
    libertadoresSpots: 4,
    sudamericanaSpots: 4,
    clubs: [
      ['Colo-Colo', 72], ['Universidad de Chile', 71], ['Universidad Catolica', 71],
      ['Palestino', 66], ['Cobresal', 65], ['Huachipato', 65], ["O'Higgins", 64],
      ['Audax Italiano', 64], ['Union Espanola', 63], ['Nublense', 63],
      ['Coquimbo Unido', 62], ['Everton de Vina del Mar', 61], ['Deportes Iquique', 60],
      ['Deportes La Serena', 59], ['Deportes Limache', 58], ['Union La Calera', 60]
    ]
  },
  CHILE_B: {
    name: 'Primera B de Chile', country: 'Chile', confed: 'CONMEBOL', level: 2,
    promotesTo: 'CHILE_A',
    cupName: 'Copa Chile',
    clubs: [
      ['Santiago Wanderers', 58], ['Magallanes', 57], ['Rangers de Talca', 56],
      ['Cobreloa', 57], ['San Marcos de Arica', 54], ['Deportes Temuco', 55],
      ['Curico Unido', 56], ['Deportes Copiapo', 54], ['Deportes Antofagasta', 57],
      ['San Luis de Quillota', 52], ['Santiago Morning', 51], ['Barnechea', 50],
      ['Deportes Concepcion', 53], ['Deportes Recoleta', 52], ['Deportes Santa Cruz', 51],
      ['Universidad de Concepcion', 54]
    ]
  },
  ARGENTINA_A: {
    name: 'Liga Profesional de Argentina', country: 'Argentina', confed: 'CONMEBOL', level: 1,
    relegatesTo: 'ARGENTINA_B',
    cupName: 'Copa Argentina',
    libertadoresSpots: 6,
    sudamericanaSpots: 6,
    clubs: [
      ['River Plate', 79], ['Boca Juniors', 78], ['Racing Club', 75], ['Independiente', 72],
      ['Estudiantes de La Plata', 73], ['Velez Sarsfield', 72], ['Talleres', 72],
      ['San Lorenzo', 69], ['Argentinos Juniors', 69], ["Newell's Old Boys", 68],
      ['Rosario Central', 69], ['Lanus', 69], ['Huracan', 67], ['Defensa y Justicia', 67],
      ['Banfield', 65], ['Gimnasia de Mendoza', 61], ['Estudiantes de Rio Cuarto', 60]
    ]
  },
  ARGENTINA_B: {
    name: 'Primera Nacional (Argentina)', country: 'Argentina', confed: 'CONMEBOL', level: 2,
    promotesTo: 'ARGENTINA_A',
    cupName: 'Copa Argentina',
    clubs: [
      ['Ferro Carril Oeste', 59], ['Chacarita Juniors', 58],
      ['All Boys', 57], ['Nueva Chicago', 56], ['Deportivo Moron', 56],
      ['Atlanta', 55], ['Almagro', 55], ['Godoy Cruz', 68],
      ['San Martin de Tucuman', 57], ['Quilmes', 56], ['Temperley', 54], ['San Martin de San Juan', 60]
    ]
  },
  BRASIL_A: {
    name: 'Brasileirao Serie A', country: 'Brasil', confed: 'CONMEBOL', level: 1,
    relegatesTo: 'BRASIL_B',
    cupName: 'Copa do Brasil',
    libertadoresSpots: 6,
    sudamericanaSpots: 6,
    clubs: [
      ['Flamengo', 81], ['Palmeiras', 80], ['Atletico Mineiro', 76], ['Sao Paulo', 75],
      ['Fluminense', 74], ['Botafogo', 76], ['Corinthians', 73], ['Gremio', 73],
      ['Internacional', 73], ['Cruzeiro', 71], ['Santos', 70], ['Vasco da Gama', 69],
      ['Bahia', 70], ['Fortaleza', 70], ['Red Bull Bragantino', 69], ['Vitoria', 65],
      ['Juventude', 64], ['Mirassol', 66], ['Ceara', 65], ['Sport Recife', 62]
    ]
  },
  BRASIL_B: {
    name: 'Brasileirao Serie B', country: 'Brasil', confed: 'CONMEBOL', level: 2,
    promotesTo: 'BRASIL_A',
    cupName: 'Copa do Brasil',
    clubs: [
      ['Coritiba', 64], ['Goias', 63], ['America Mineiro', 63], ['Athletico Paranaense', 68],
      ['Vila Nova', 60], ['Novorizontino', 60], ['Guarani', 59],
      ['Ponte Preta', 59], ['Chapecoense', 58], ['Avai', 58], ['Botafogo-SP', 57]
    ]
  },
  URUGUAY_A: {
    name: 'Primera Division de Uruguay', country: 'Uruguay', confed: 'CONMEBOL', level: 1,
    relegatesTo: 'URUGUAY_B',
    cupName: 'Copa AUF Uruguay',
    libertadoresSpots: 4,
    sudamericanaSpots: 4,
    clubs: [
      ['Penarol', 70], ['Nacional', 70], ['Defensor Sporting', 63], ['Liverpool FC Uruguay', 63],
      ['Danubio', 61], ['Montevideo Wanderers', 59], ['Cerro Largo', 58], ['Racing de Montevideo', 57],
      ['Boston River', 57], ['Progreso', 56], ['River Plate de Montevideo', 56], ['Fenix', 55]
    ]
  },
  URUGUAY_B: {
    name: 'Segunda Division de Uruguay', country: 'Uruguay', confed: 'CONMEBOL', level: 2,
    promotesTo: 'URUGUAY_A',
    cupName: 'Copa AUF Uruguay',
    clubs: [
      ['Plaza Colonia', 57], ['Juventud de Las Piedras', 56], ['Rentistas', 56], ['Miramar Misiones', 55],
      ['Bella Vista', 54], ['Albion FC', 54], ['Atenas de San Carlos', 53], ['Tacuarembo', 53],
      ['Cerrito', 53], ['Oriental de La Paz', 52], ['La Luz', 53], ['Sud America', 52]
    ]
  },
  COLOMBIA_A: {
    name: 'Categoria Primera A', country: 'Colombia', confed: 'CONMEBOL', level: 1,
    relegatesTo: 'COLOMBIA_B',
    cupName: 'Copa Colombia',
    libertadoresSpots: 4,
    sudamericanaSpots: 4,
    clubs: [
      ['Atletico Nacional', 71], ['Millonarios', 69], ['America de Cali', 67],
      ['Junior de Barranquilla', 68], ['Deportivo Cali', 65], ['Independiente Medellin', 66],
      ['Santa Fe', 66], ['Once Caldas', 62], ['Deportes Tolima', 65], ['Aguilas Doradas', 61],
      ['Envigado', 58], ['La Equidad', 59], ['Atletico Bucaramanga', 63], ['Deportivo Pasto', 60],
      ['Boyaca Chico', 58], ['Alianza FC', 58], ['Deportivo Pereira', 60], ['Fortaleza CEIF', 55]
    ]
  },
  COLOMBIA_B: {
    name: 'Torneo BetPlay Dimayor', country: 'Colombia', confed: 'CONMEBOL', level: 2,
    promotesTo: 'COLOMBIA_A',
    cupName: 'Copa Colombia',
    clubs: [
      ['Real Cartagena', 58], ['Cucuta Deportivo', 59], ['Deportes Quindio', 57],
      ['Union Magdalena', 58], ['Atletico Huila', 57], ['Llaneros FC', 56],
      ['Leones FC', 55], ['Cortulua Yumbo', 54], ['Orsomarso', 53], ['Real Santander', 52]
    ]
  },
  PERU_A: {
    name: 'Liga 1 de Peru', country: 'Peru', confed: 'CONMEBOL', level: 1,
    relegatesTo: 'PERU_B',
    cupName: 'Copa Bicentenario',
    libertadoresSpots: 4,
    sudamericanaSpots: 4,
    clubs: [
      ['Universitario', 65], ['Alianza Lima', 65], ['Sporting Cristal', 65],
      ['Melgar', 62], ['Cienciano', 59], ['Sport Huancayo', 58],
      ['Cesar Vallejo', 58], ['Alianza Atletico', 55], ['Sport Boys', 54], ['Cusco FC', 57]
    ]
  },
  PERU_B: {
    name: 'Liga 2 de Peru', country: 'Peru', confed: 'CONMEBOL', level: 2,
    promotesTo: 'PERU_A',
    cupName: 'Copa Bicentenario',
    clubs: [
      ['Deportivo Municipal', 56], ['Academia Cantolao', 55], ['Juan Aurich', 55],
      ['Universidad San Martin', 54], ['Ayacucho FC', 55], ['Santos FC', 53],
      ['Carlos Stein', 52], ['Pirata FC', 51], ['Comerciantes FC', 53], ['Coopsol', 52]
    ]
  },
  ECUADOR_A: {
    name: 'Liga Pro de Ecuador', country: 'Ecuador', confed: 'CONMEBOL', level: 1,
    relegatesTo: 'ECUADOR_B',
    cupName: 'Copa Ecuador',
    libertadoresSpots: 4,
    sudamericanaSpots: 4,
    clubs: [
      ['Independiente del Valle', 71], ['Barcelona SC', 68], ['Liga de Quito', 68],
      ['Emelec', 64], ['Aucas', 62], ['Universidad Catolica de Quito', 60],
      ['Delfin', 58], ['El Nacional', 57], ['Orense', 56], ['Macara', 55]
    ]
  },
  ECUADOR_B: {
    name: 'LigaPro Serie B', country: 'Ecuador', confed: 'CONMEBOL', level: 2,
    promotesTo: 'ECUADOR_A',
    cupName: 'Copa Ecuador',
    clubs: [
      ['Guayaquil City', 57], ['Manta FC', 56], ['9 de Octubre', 56],
      ['Gualaceo', 55], ['Cuniburo', 54], ['Chacaritas', 53],
      ['Leones del Norte', 52], ['San Antonio FC', 52]
    ]
  },
  PARAGUAY_A: {
    name: 'Division Profesional de Paraguay', country: 'Paraguay', confed: 'CONMEBOL', level: 1,
    cupName: 'Copa Paraguay',
    libertadoresSpots: 4,
    sudamericanaSpots: 4,
    clubs: [
      ['Olimpia', 67], ['Cerro Porteno', 67], ['Libertad', 66], ['Guarani de Asuncion', 62],
      ['Nacional de Asuncion', 58], ['Sportivo Luqueno', 56], ['Tacuary', 55], ['General Caballero', 54]
    ]
  },
  BOLIVIA_A: {
    name: 'Division Profesional de Bolivia', country: 'Bolivia', confed: 'CONMEBOL', level: 1,
    cupName: 'Copa Bolivia',
    libertadoresSpots: 4,
    sudamericanaSpots: 4,
    clubs: [
      ['The Strongest', 62], ['Bolivar', 63], ['Always Ready', 60], ['Oriente Petrolero', 57],
      ['Blooming', 55], ['Wilstermann', 56], ['Nacional Potosi', 54], ['Aurora', 52]
    ]
  },
  VENEZUELA_A: {
    name: 'Liga FUTVE', country: 'Venezuela', confed: 'CONMEBOL', level: 1,
    cupName: 'Copa Venezuela',
    libertadoresSpots: 4,
    sudamericanaSpots: 4,
    clubs: [
      ['Caracas FC', 60], ['Deportivo Tachira', 60], ['Carabobo FC', 58], ['Metropolitanos', 56],
      ['Zamora FC', 56], ['Monagas SC', 55], ['Estudiantes de Merida', 53], ['Portuguesa FC', 52]
    ]
  },

  // ───────────────────────── CONCACAF ─────────────────────────
  MEXICO_A: {
    name: 'Liga MX', country: 'Mexico', confed: 'CONCACAF', level: 1,
    relegatesTo: 'MEXICO_B',
    cupName: 'Copa MX',
    championsSpots: 4,
    clubs: [
      ['America', 75], ['Tigres UANL', 74], ['Monterrey', 74], ['Cruz Azul', 72],
      ['Chivas Guadalajara', 71], ['Toluca', 71], ['Pumas UNAM', 69], ['Leon', 70],
      ['Santos Laguna', 68], ['Pachuca', 70], ['Atlas', 67], ['Necaxa', 65],
      ['Tijuana', 66], ['Puebla', 64], ['Queretaro', 63], ['Mazatlan FC', 63],
      ['Atletico San Luis', 65], ['FC Juarez', 62]
    ]
  },
  MEXICO_B: {
    name: 'Liga de Expansion MX', country: 'Mexico', confed: 'CONCACAF', level: 2,
    promotesTo: 'MEXICO_A',
    cupName: 'Copa MX',
    clubs: [
      ['Atlante', 59], ['Leones Negros', 58], ['Correcaminos', 56], ['Dorados de Sinaloa', 57],
      ['Venados FC', 55], ['Tepatitlan', 54], ['Cancun FC', 55], ['Celaya', 56],
      ['Tlaxcala FC', 53], ['Mineros de Zacatecas', 54]
    ]
  },
  USA_A: {
    name: 'Major League Soccer', country: 'Estados Unidos', confed: 'CONCACAF', level: 1,
    cupName: 'US Open Cup',
    championsSpots: 4,
    clubs: [
      ['Inter Miami', 74], ['LAFC', 73], ['LA Galaxy', 71], ['Seattle Sounders', 70],
      ['Atlanta United', 69], ['Columbus Crew', 71], ['Philadelphia Union', 69],
      ['Portland Timbers', 67], ['New York City FC', 68], ['New York Red Bulls', 68],
      ['Austin FC', 66], ['FC Cincinnati', 70], ['Chicago Fire', 65], ['Toronto FC', 65]
    ]
  },

  // ───────────────────────── UEFA ─────────────────────────
  ESPANA_A: {
    name: 'LaLiga', country: 'Espana', confed: 'UEFA', level: 1,
    relegatesTo: 'ESPANA_B',
    cupName: 'Copa del Rey',
    championsSpots: 4,
    europaSpots: 2,
    conferenceSpots: 1,
    clubs: [
      ['Real Madrid', 88], ['Barcelona', 86], ['Atletico de Madrid', 84], ['Athletic Club', 79],
      ['Real Sociedad', 78], ['Villarreal', 78], ['Real Betis', 77], ['Sevilla', 76],
      ['Valencia', 75], ['Girona', 76], ['Celta de Vigo', 74], ['Osasuna', 73],
      ['Rayo Vallecano', 73], ['Getafe', 73], ['Mallorca', 72], ['Alaves', 71],
      ['Espanyol', 70], ['Elche', 68], ['Levante', 67], ['Real Oviedo', 65]
    ]
  },
  ESPANA_B: {
    name: 'LaLiga Hypermotion', country: 'Espana', confed: 'UEFA', level: 2,
    promotesTo: 'ESPANA_A',
    cupName: 'Copa del Rey',
    clubs: [
      ['Racing de Santander', 69], ['Burgos', 63], ['Sporting de Gijon', 68], ['Real Zaragoza', 67],
      ['Deportivo de La Coruna', 68], ['Malaga', 66], ['Almeria', 70], ['Granada', 70],
      ['Cadiz', 69], ['Eibar', 67], ['Huesca', 65], ['Albacete', 64]
    ]
  },
  INGLATERRA_A: {
    name: 'Premier League', country: 'Inglaterra', confed: 'UEFA', level: 1,
    relegatesTo: 'INGLATERRA_B',
    cupName: 'FA Cup',
    championsSpots: 4,
    europaSpots: 2,
    conferenceSpots: 1,
    clubs: [
      ['Manchester City', 88], ['Liverpool', 86], ['Arsenal', 85], ['Chelsea', 82],
      ['Manchester United', 81], ['Tottenham Hotspur', 80], ['Newcastle United', 79],
      ['Aston Villa', 79], ['Brighton', 77], ['West Ham', 76], ['Crystal Palace', 75],
      ['Everton', 74], ['Fulham', 75], ['Brentford', 74], ['Nottingham Forest', 74], ['Wolves', 74],
      ['Bournemouth', 76], ['Leeds United', 71], ['Burnley', 68], ['Sunderland', 68]
    ]
  },
  INGLATERRA_B: {
    name: 'EFL Championship', country: 'Inglaterra', confed: 'UEFA', level: 2,
    promotesTo: 'INGLATERRA_A',
    cupName: 'FA Cup',
    clubs: [
      ['Leicester City', 72], ['Southampton', 71], ['Norwich City', 70], ['Ipswich Town', 70],
      ['West Bromwich Albion', 69], ['Middlesbrough', 69], ['Sheffield United', 70],
      ['Coventry City', 68], ['Watford', 68], ['Stoke City', 66], ['Preston North End', 65]
    ]
  },
  ITALIA_A: {
    name: 'Serie A', country: 'Italia', confed: 'UEFA', level: 1,
    relegatesTo: 'ITALIA_B',
    cupName: 'Coppa Italia',
    championsSpots: 4,
    europaSpots: 2,
    conferenceSpots: 1,
    clubs: [
      ['Inter de Milan', 85], ['Juventus', 83], ['AC Milan', 83], ['Napoli', 82],
      ['Atalanta', 81], ['AS Roma', 79], ['Lazio', 78], ['Fiorentina', 77],
      ['Bologna', 76], ['Torino', 74], ['Udinese', 73], ['Genoa', 72],
      ['Como', 72], ['Cagliari', 71], ['Parma', 71], ['Lecce', 70],
      ['Sassuolo', 69], ['Cremonese', 68], ['Hellas Verona', 65], ['Pisa', 65]
    ]
  },
  ITALIA_B: {
    name: 'Serie B', country: 'Italia', confed: 'UEFA', level: 2,
    promotesTo: 'ITALIA_A',
    cupName: 'Coppa Italia',
    clubs: [
      ['Sampdoria', 68], ['Palermo', 67], ['Empoli', 68], ['Monza', 67],
      ['Spezia', 66], ['Brescia', 65], ['Bari', 65], ['Catanzaro', 64],
      ['Modena', 63], ['Cesena', 63]
    ]
  },
  ALEMANIA_A: {
    name: 'Bundesliga', country: 'Alemania', confed: 'UEFA', level: 1,
    relegatesTo: 'ALEMANIA_B',
    cupName: 'DFB-Pokal',
    championsSpots: 4,
    europaSpots: 2,
    conferenceSpots: 1,
    clubs: [
      ['Bayern Munich', 87], ['Bayer Leverkusen', 84], ['Borussia Dortmund', 82], ['RB Leipzig', 81],
      ['Eintracht Frankfurt', 78], ['VfB Stuttgart', 77], ['Werder Bremen', 74], ['Union Berlin', 73],
      ['Wolfsburgo', 74], ['Friburgo', 74], ['Borussia Monchengladbach', 74], ['Mainz 05', 72],
      ['Hoffenheim', 73], ['Augsburgo', 71], ['Colonia', 70], ['Hamburgo SV', 68],
      ['Heidenheim', 68], ['St. Pauli', 67]
    ]
  },
  ALEMANIA_B: {
    name: '2. Bundesliga', country: 'Alemania', confed: 'UEFA', level: 2,
    promotesTo: 'ALEMANIA_A',
    cupName: 'DFB-Pokal',
    clubs: [
      ['Schalke 04', 69], ['Hertha Berlin', 69], ['VfL Bochum', 67],
      ['Fortuna Dusseldorf', 68], ['Hannover 96', 67], ['Kaiserslautern', 66], ['Nurnberg', 66],
      ['Karlsruher SC', 65], ['Paderborn', 64], ['Holstein Kiel', 65]
    ]
  },
  FRANCIA_A: {
    name: 'Ligue 1', country: 'Francia', confed: 'UEFA', level: 1,
    relegatesTo: 'FRANCIA_B',
    cupName: 'Coupe de France',
    championsSpots: 3,
    europaSpots: 2,
    conferenceSpots: 1,
    clubs: [
      ['Paris Saint-Germain', 86], ['Marsella', 79], ['Monaco', 79], ['Lille', 77],
      ['Lyon', 76], ['Niza', 75], ['Rennes', 75], ['Lens', 75],
      ['Estrasburgo', 72], ['Brest', 72], ['Nantes', 71], ['Toulouse', 71],
      ['Auxerre', 69], ['Angers', 68], ['Le Havre', 67], ['Lorient', 67],
      ['Paris FC', 66], ['Metz', 66]
    ]
  },
  FRANCIA_B: {
    name: 'Ligue 2', country: 'Francia', confed: 'UEFA', level: 2,
    promotesTo: 'FRANCIA_A',
    cupName: 'Coupe de France',
    clubs: [
      ['Saint-Etienne', 67], ['Girondins de Burdeos', 66], ['Montpellier', 68], ['Caen', 64],
      ['Guingamp', 63], ['Ajaccio', 63], ['Troyes', 64], ['Grenoble', 62],
      ['Amiens', 62], ['Pau FC', 60], ['Reims', 65]
    ]
  },
  PORTUGAL_A: {
    name: 'Primeira Liga', country: 'Portugal', confed: 'UEFA', level: 1,
    cupName: 'Taca de Portugal',
    championsSpots: 2,
    europaSpots: 2,
    conferenceSpots: 1,
    clubs: [
      ['Benfica', 82], ['Porto', 81], ['Sporting CP', 82], ['Braga', 76],
      ['Vitoria de Guimaraes', 72], ['Boavista', 68], ['Famalicao', 68], ['Rio Ave', 67],
      ['Estoril', 66], ['Moreirense', 66], ['Arouca', 65], ['Casa Pia', 64]
    ]
  },
  HOLANDA_A: {
    name: 'Eredivisie', country: 'Paises Bajos', confed: 'UEFA', level: 1,
    cupName: 'KNVB Beker',
    championsSpots: 2,
    europaSpots: 2,
    conferenceSpots: 1,
    clubs: [
      ['PSV Eindhoven', 79], ['Feyenoord', 78], ['Ajax', 78], ['AZ Alkmaar', 74],
      ['Twente', 73], ['Utrecht', 71], ['Heerenveen', 68], ['Sparta Rotterdam', 66],
      ['Go Ahead Eagles', 66], ['NEC Nijmegen', 67], ['Fortuna Sittard', 64], ['Heracles', 63]
    ]
  },
  TURQUIA_A: {
    name: 'Super Lig', country: 'Turquia', confed: 'UEFA', level: 1,
    cupName: 'Turkiye Kupasi',
    championsSpots: 2,
    europaSpots: 2,
    conferenceSpots: 1,
    clubs: [
      ['Galatasaray', 79], ['Fenerbahce', 79], ['Besiktas', 76], ['Trabzonspor', 74],
      ['Basaksehir', 72], ['Adana Demirspor', 69], ['Konyaspor', 67], ['Antalyaspor', 66],
      ['Alanyaspor', 66], ['Kasimpasa', 65]
    ]
  },
  BELGICA_A: {
    name: 'Jupiler Pro League', country: 'Belgica', confed: 'UEFA', level: 1,
    cupName: 'Copa de Belgica',
    championsSpots: 2,
    europaSpots: 1,
    conferenceSpots: 1,
    clubs: [
      ['Club Brujas', 76], ['Anderlecht', 74], ['Royal Antwerp', 72], ['Gante', 71],
      ['Genk', 72], ['Standard de Lieja', 69], ['Union Saint-Gilloise', 72], ['Cercle Brugge', 67],
      ['Charleroi', 65], ['Mechelen', 64]
    ]
  },
  ESCOCIA_A: {
    name: 'Scottish Premiership', country: 'Escocia', confed: 'UEFA', level: 1,
    cupName: 'Scottish Cup',
    championsSpots: 2,
    europaSpots: 1,
    conferenceSpots: 1,
    clubs: [
      ['Celtic', 75], ['Rangers', 74], ['Aberdeen', 67], ['Hearts', 66],
      ['Hibernian', 65], ['Dundee United', 63], ['Motherwell', 62], ['Kilmarnock', 61]
    ]
  },
  GRECIA_A: {
    name: 'Superliga de Grecia', country: 'Grecia', confed: 'UEFA', level: 1,
    cupName: 'Copa de Grecia',
    championsSpots: 2,
    europaSpots: 1,
    conferenceSpots: 1,
    clubs: [
      ['Olympiacos', 74], ['Panathinaikos', 72], ['AEK Atenas', 71], ['PAOK', 72],
      ['Aris', 67], ['OFI Creta', 63], ['Volos', 61], ['Atromitos', 62]
    ]
  },
  SUIZA_A: {
    name: 'Superliga Suiza', country: 'Suiza', confed: 'UEFA', level: 1,
    cupName: 'Copa Suiza',
    championsSpots: 2,
    europaSpots: 1,
    conferenceSpots: 1,
    clubs: [
      ['BSC Young Boys', 74], ['FC Basel', 73], ['Servette FC', 71], ['FC Zurich', 71],
      ['FC Lugano', 70], ['FC Luzern', 69], ['FC St. Gallen', 69], ['Grasshopper', 68]
    ]
  },
  AUSTRIA_A: {
    name: 'Bundesliga Austriaca', country: 'Austria', confed: 'UEFA', level: 1,
    cupName: 'Copa de Austria',
    championsSpots: 2,
    europaSpots: 1,
    conferenceSpots: 1,
    clubs: [
      ['Red Bull Salzburg', 77], ['Sturm Graz', 74], ['LASK Linz', 72], ['Rapid Viena', 71],
      ['Austria Viena', 70], ['Wolfsberger AC', 68], ['TSV Hartberg', 67], ['Austria Klagenfurt', 66]
    ]
  },

  // ───────────────────────── AFC ─────────────────────────
  ARABIA_A: {
    name: 'Saudi Pro League', country: 'Arabia Saudita', confed: 'AFC', level: 1,
    cupName: "King's Cup",
    championsSpots: 3,
    clubs: [
      ['Al-Hilal', 80], ['Al-Nassr', 79], ['Al-Ittihad', 78], ['Al-Ahli', 77],
      ['Al-Shabab', 72], ['Al-Ettifaq', 71], ['Al-Taawoun', 68], ['Al-Fateh', 67],
      ['Al-Khaleej', 65], ['Damac', 64]
    ]
  },
  JAPON_A: {
    name: 'J1 League', country: 'Japon', confed: 'AFC', level: 1,
    cupName: "Emperor's Cup",
    championsSpots: 3,
    clubs: [
      ['Vissel Kobe', 73], ['Yokohama F. Marinos', 72], ['Kawasaki Frontale', 72],
      ['Urawa Red Diamonds', 72], ['Sanfrecce Hiroshima', 71], ['Kashima Antlers', 71],
      ['Gamba Osaka', 70], ['FC Tokyo', 69], ['Nagoya Grampus', 69], ['Cerezo Osaka', 69],
      ['Albirex Niigata', 67], ['Kashiwa Reysol', 67]
    ]
  }
};

/** Normaliza RAW_LEAGUES a objetos con clubes {name, media, tier} */
const LEAGUES = {};
for (const [key, league] of Object.entries(RAW_LEAGUES)) {
  LEAGUES[key] = {
    ...league,
    key,
    clubs: league.clubs.map(([name, media]) => ({ name, media, tier: tierFromMedia(media) }))
  };
}

const CLUB_INDEX = new Map();
for (const [leagueKey, league] of Object.entries(LEAGUES)) {
  for (const club of league.clubs) {
    CLUB_INDEX.set(club.name.toLowerCase(), {
      ...club,
      leagueKey,
      leagueName: league.name,
      country: league.country,
      confed: league.confed,
      level: league.level
    });
  }
}

function getAllClubs() {
  return [...CLUB_INDEX.values()].map(c => ({ ...c }));
}

function findClub(name) {
  const found = CLUB_INDEX.get(String(name).toLowerCase());
  return found ? { ...found } : null;
}

/** Liga a la que pertenece un club (por su nombre) */
function getLeagueOf(clubName) {
  const club = findClub(clubName);
  return club ? { ...LEAGUES[club.leagueKey] } : null;
}

function getLeague(leagueKey) {
  return LEAGUES[leagueKey] ? { ...LEAGUES[leagueKey] } : null;
}

/** Todas las ligas de primera division de una confederacion */
function topLeaguesOf(confed) {
  return Object.values(LEAGUES).filter(l => l.confed === confed && l.level === 1);
}

/** Obtiene todos los clubes de un país (1ra y 2da división) para la Copa Nacional */
function getNationalClubsForCup(country) {
  const countryLeagues = Object.values(LEAGUES).filter(l => l.country === country);
  const clubs = [];
  for (const l of countryLeagues) {
    for (const c of l.clubs) {
      clubs.push({
        ...c,
        leagueKey: l.key,
        leagueName: l.name,
        country: l.country,
        confed: l.confed,
        level: l.level
      });
    }
  }
  return clubs;
}

/** Determina a qué torneo continental clasifica según la liga y la posición en la tabla */
function getContinentalQualification(leagueKey, position) {
  const league = getLeague(leagueKey);
  if (!league || league.level !== 1) return null;

  if (league.confed === 'CONMEBOL') {
    const libSpots = league.libertadoresSpots || 2;
    const sudSpots = league.sudamericanaSpots || 2;
    if (position <= libSpots) {
      return { type: 'libertadores', name: 'Copa Libertadores' };
    }
    if (position <= libSpots + sudSpots) {
      return { type: 'sudamericana', name: 'Copa Sudamericana' };
    }
    return null;
  }

  if (league.confed === 'UEFA') {
    const champSpots = league.championsSpots || 2;
    const europaSpots = league.europaSpots || 0;
    const confSpots = league.conferenceSpots || 0;
    if (position <= champSpots) {
      return { type: 'champions', name: 'UEFA Champions League' };
    }
    if (position <= champSpots + europaSpots) {
      return { type: 'europa', name: 'UEFA Europa League' };
    }
    if (position <= champSpots + europaSpots + confSpots) {
      return { type: 'conference', name: 'UEFA Conference League' };
    }
    return null;
  }

  if (league.confed === 'CONCACAF') {
    const spots = league.championsSpots || 4;
    if (position <= spots) {
      return { type: 'concachampions', name: 'Copa de Campeones CONCACAF' };
    }
    return null;
  }

  if (league.confed === 'AFC') {
    const spots = league.championsSpots || 3;
    if (position <= spots) {
      return { type: 'afc_champions', name: 'AFC Champions League Elite' };
    }
    return null;
  }

  return null;
}

/** Ligas jugables al crear jugador, agrupadas por pais (se arranca en la B si existe) */
function startingLeagueKeyFor(countryKey) {
  if (!countryKey) return 'CHILE_B';
  const cleanKey = countryKey.toUpperCase().trim();
  const second = `${cleanKey}_B`;
  if (LEAGUES[second]) return second;
  const first = `${cleanKey}_A`;
  if (LEAGUES[first]) return first;
  if (LEAGUES[cleanKey]) return cleanKey;
  return 'CHILE_B';
}

module.exports = {
  LEAGUES,
  FLAGS,
  getAllClubs,
  findClub,
  getLeagueOf,
  getLeague,
  topLeaguesOf,
  getNationalClubsForCup,
  getContinentalQualification,
  tierFromMedia,
  startingLeagueKeyFor
};
