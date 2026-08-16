'use strict';

/**
 * Base de Datos Exhaustiva de Clásicos, Derbis y Rivalidades Históricas del Fútbol
 * 
 * Contiene rivalidades reales entre los 392 clubes del juego y Selecciones Nacionales,
 * con metadatos de tensión, historia, cánticos y multiplicadores de partido.
 */

const EXPLICIT_CLASSICS = [
  // ═══════════════════════════════════════════════════════════════════
  // 🇨🇱 CHILE (Primera División A & Primera B)
  // ═══════════════════════════════════════════════════════════════════
  {
    home: 'Colo-Colo', away: 'Universidad de Chile',
    name: 'Superclásico del Fútbol Chileno',
    category: 'superclasico', country: 'Chile',
    desc: 'El choque más apasionante y multitudinario de Chile entre el Cacique y el Romántico Viajero.',
    chant: '¡Vamos Cacique / Vamos la U, este partido no se puede perder!',
    intensity: 5, ratingBonus: 0.35, salaryBonus: 1.35, moraleWinBonus: 6, moraleLossBonus: -6
  },
  {
    home: 'Universidad de Chile', away: 'Universidad Catolica',
    name: 'Clásico Universitario',
    category: 'superclasico', country: 'Chile',
    desc: 'La rivalidad más antigua del fútbol chileno, nacida de los clásicos estudiantiles y la fiesta en las tribunas.',
    chant: '¡La fiesta de las dos universidades más grandes!',
    intensity: 4, ratingBonus: 0.30, salaryBonus: 1.30, moraleWinBonus: 5, moraleLossBonus: -5
  },
  {
    home: 'Colo-Colo', away: 'Universidad Catolica',
    name: 'Clásico Albo-Cruzado',
    category: 'superclasico', country: 'Chile',
    desc: 'Duelo de constantes títulos y definiciones en el fútbol chileno contemporáneo.',
    chant: '¡Rivalidad moderna de alta tensión!',
    intensity: 4, ratingBonus: 0.28, salaryBonus: 1.25, moraleWinBonus: 5, moraleLossBonus: -4
  },
  {
    home: 'Colo-Colo', away: 'Cobreloa',
    name: 'Clásico de las Décadas',
    category: 'historico', country: 'Chile',
    desc: 'Una de las rivalidades más intensas de los años 80 y 90 entre Santiago y Calama.',
    chant: '¡El Zorro del Desierto contra el Albo!',
    intensity: 4, ratingBonus: 0.28, salaryBonus: 1.25, moraleWinBonus: 5, moraleLossBonus: -5
  },
  {
    home: 'Colo-Colo', away: 'Magallanes',
    name: 'Clásico Fundacional',
    category: 'historico', country: 'Chile',
    desc: 'El duelo del origen: David Arellano y la escisión de 1925 que fundó a Colo-Colo desde Magallanes.',
    chant: '¡El primer choque histórico del fútbol chileno!',
    intensity: 3, ratingBonus: 0.25, salaryBonus: 1.20, moraleWinBonus: 4, moraleLossBonus: -3
  },
  {
    home: 'Santiago Wanderers', away: 'Everton de Vina del Mar',
    name: 'Clásico Porteño',
    category: 'derby_local', country: 'Chile',
    desc: 'El derbi regional más antiguo del país: Valparaíso contra Viña del Mar en la Quinta Región.',
    chant: '¡El Puerto contra la Ciudad Jardín!',
    intensity: 5, ratingBonus: 0.32, salaryBonus: 1.30, moraleWinBonus: 6, moraleLossBonus: -6
  },
  {
    home: 'Coquimbo Unido', away: 'Deportes La Serena',
    name: 'Clásico de la Cuarta Región',
    category: 'derby_local', country: 'Chile',
    desc: 'El choque apasionado entre los Piratas del Puerto y los Papayeros granates.',
    chant: '¡El clásico de la Cuarta Región se juega a muerte!',
    intensity: 4, ratingBonus: 0.28, salaryBonus: 1.25, moraleWinBonus: 5, moraleLossBonus: -5
  },
  {
    home: 'Union Espanola', away: 'Palestino',
    name: 'Clásico de Colonias',
    category: 'derby_local', country: 'Chile',
    desc: 'Enfrentamiento tradicional entre dos históricas colectividades de Santiago.',
    chant: '¡Duelo de orgullo e historia colectiva!',
    intensity: 3, ratingBonus: 0.22, salaryBonus: 1.20, moraleWinBonus: 4, moraleLossBonus: -3
  },
  {
    home: 'Union Espanola', away: 'Audax Italiano',
    name: 'Clásico de Colonias Hispano-Itálico',
    category: 'derby_local', country: 'Chile',
    desc: 'La Furia Roja de Santa Laura contra los Itálicos de La Florida.',
    chant: '¡Duelo centenario en la capital!',
    intensity: 3, ratingBonus: 0.22, salaryBonus: 1.20, moraleWinBonus: 4, moraleLossBonus: -3
  },
  {
    home: 'Palestino', away: 'Audax Italiano',
    name: 'Clásico de Colonias Árabe-Itálico',
    category: 'derby_local', country: 'Chile',
    desc: 'El Tino Tino frente a los Tanos de La Florida en Santiago.',
    chant: '¡Rivalidad tradicional de colonias!',
    intensity: 3, ratingBonus: 0.20, salaryBonus: 1.20, moraleWinBonus: 4, moraleLossBonus: -3
  },
  {
    home: 'Deportes Concepcion', away: 'Huachipato',
    name: 'Clásico Penquista',
    category: 'derby_local', country: 'Chile',
    desc: 'El León de Collao contra los Acereros en la Región del Biobío.',
    chant: '¡Todo el Biobío paralizado por el clásico!',
    intensity: 4, ratingBonus: 0.28, salaryBonus: 1.25, moraleWinBonus: 5, moraleLossBonus: -4
  },
  {
    home: 'Deportes Concepcion', away: 'Universidad de Concepcion',
    name: 'Clásico del Campanil',
    category: 'derby_local', country: 'Chile',
    desc: 'Duelo urbano en el Estadio Ester Roa Rebolledo de Concepción.',
    chant: '¡El poder penquista en disputa!',
    intensity: 3, ratingBonus: 0.24, salaryBonus: 1.20, moraleWinBonus: 4, moraleLossBonus: -3
  },
  {
    home: 'Huachipato', away: 'Universidad de Concepcion',
    name: 'Derbi del Biobío',
    category: 'derby_local', country: 'Chile',
    desc: 'Acereros contra Universitarios en la provincia de Concepción.',
    chant: '¡Poder industrial contra academia!',
    intensity: 3, ratingBonus: 0.22, salaryBonus: 1.18, moraleWinBonus: 4, moraleLossBonus: -3
  },
  {
    home: 'Rangers de Talca', away: 'Curico Unido',
    name: 'Clásico del Maule',
    category: 'regional', country: 'Chile',
    desc: 'Rojinegros talquinos contra albirrojos curicanos en el corazón del Maule.',
    chant: '¡El honor del Maule está en juego!',
    intensity: 4, ratingBonus: 0.26, salaryBonus: 1.22, moraleWinBonus: 5, moraleLossBonus: -5
  },
  {
    home: 'Deportes Iquique', away: 'San Marcos de Arica',
    name: 'Clásico del Norte Grande',
    category: 'regional', country: 'Chile',
    desc: 'Los Dragones Celestes de Iquique contra el Santo de Arica en el extremo norte.',
    chant: '¡El clásico más septentrional de Chile!',
    intensity: 4, ratingBonus: 0.26, salaryBonus: 1.22, moraleWinBonus: 5, moraleLossBonus: -4
  },
  {
    home: 'Deportes Antofagasta', away: 'Cobreloa',
    name: 'Clásico de la Región de Antofagasta',
    category: 'regional', country: 'Chile',
    desc: 'Pumas de la costa contra Mineros del desierto de Calama.',
    chant: '¡Duelo ardiente en el norte minero!',
    intensity: 3, ratingBonus: 0.24, salaryBonus: 1.20, moraleWinBonus: 4, moraleLossBonus: -3
  },
  {
    home: 'Cobresal', away: 'Cobreloa',
    name: 'Clásico del Cobre',
    category: 'regional', country: 'Chile',
    desc: 'El Salvador contra Calama, los dos gigantes mineros del desierto de Atacama.',
    chant: '¡La fuerza de la minería chilena en la cancha!',
    intensity: 3, ratingBonus: 0.24, salaryBonus: 1.20, moraleWinBonus: 4, moraleLossBonus: -3
  },
  {
    home: 'Union La Calera', away: 'San Luis de Quillota',
    name: 'Clásico Provincial de Quillota',
    category: 'derby_local', country: 'Chile',
    desc: 'Cementeros contra Canarios en el valle de Quillota.',
    chant: '¡El clásico de la provincia no se negocia!',
    intensity: 4, ratingBonus: 0.26, salaryBonus: 1.20, moraleWinBonus: 5, moraleLossBonus: -4
  },
  {
    home: 'Santiago Morning', away: 'Magallanes',
    name: 'Clásico de la Vieja Guardia Santiaguina',
    category: 'historico', country: 'Chile',
    desc: 'Dos de los clubes fundadores con más tradición del fútbol capitalino.',
    chant: '¡Historia pura en la capital!',
    intensity: 3, ratingBonus: 0.20, salaryBonus: 1.15, moraleWinBonus: 4, moraleLossBonus: -3
  },
  {
    home: 'Deportes Copiapo', away: 'Cobresal',
    name: 'Clásico de Atacama',
    category: 'regional', country: 'Chile',
    desc: 'El León de Atacama contra los Mineros de El Salvador en la Tercera Región.',
    chant: '¡La supremacía de Atacama!',
    intensity: 3, ratingBonus: 0.22, salaryBonus: 1.18, moraleWinBonus: 4, moraleLossBonus: -3
  },

  // ═══════════════════════════════════════════════════════════════════
  // 🇦🇷 ARGENTINA (Liga Profesional & Primera Nacional)
  // ═══════════════════════════════════════════════════════════════════
  {
    home: 'River Plate', away: 'Boca Juniors',
    name: 'Superclásico del Fútbol Argentino',
    category: 'superclasico', country: 'Argentina',
    desc: 'El partido más pasional e icónico del planeta fútbol. Millonarios contra Xeneizes.',
    chant: '¡El Monumental y La Bombonera vibran con el partido que para al país!',
    intensity: 5, ratingBonus: 0.40, salaryBonus: 1.40, moraleWinBonus: 7, moraleLossBonus: -7
  },
  {
    home: 'Racing Club', away: 'Independiente',
    name: 'Clásico de Avellaneda',
    category: 'superclasico', country: 'Argentina',
    desc: 'Separados por solo dos cuadras: La Academia contra El Rojo de Avellaneda.',
    chant: '¡Avellaneda dividida en dos estadios vecinos!',
    intensity: 5, ratingBonus: 0.35, salaryBonus: 1.35, moraleWinBonus: 6, moraleLossBonus: -6
  },
  {
    home: 'Rosario Central', away: "Newell's Old Boys",
    name: 'Clásico Rosarino',
    category: 'superclasico', country: 'Argentina',
    desc: 'El derbi más caliente y fanático del interior argentino. Canallas contra Leprosos.',
    chant: '¡Rosario no duerme cuando rueda la pelota!',
    intensity: 5, ratingBonus: 0.35, salaryBonus: 1.35, moraleWinBonus: 6, moraleLossBonus: -6
  },
  {
    home: 'San Lorenzo', away: 'Huracan',
    name: 'Clásico Porteño de Boedo y Parque Patricios',
    category: 'derby_local', country: 'Argentina',
    desc: 'El Ciclón contra El Globo en uno de los barrios más tangueros de Buenos Aires.',
    chant: '¡Rivalidad barrial de más de un siglo!',
    intensity: 5, ratingBonus: 0.32, salaryBonus: 1.30, moraleWinBonus: 6, moraleLossBonus: -5
  },
  {
    home: 'Estudiantes de La Plata', away: 'Gimnasia de Mendoza',
    name: 'Duelo Estudiantil y Federal',
    category: 'regional', country: 'Argentina',
    desc: 'El Pincha platense contra el Lobo mendocino.',
    chant: '¡Batalla táctica y corazón!',
    intensity: 3, ratingBonus: 0.22, salaryBonus: 1.18, moraleWinBonus: 4, moraleLossBonus: -3
  },
  {
    home: 'Lanus', away: 'Banfield',
    name: 'Clásico del Sur',
    category: 'derby_local', country: 'Argentina',
    desc: 'Granates contra Taladros en la zona sur del Gran Buenos Aires.',
    chant: '¡La fiesta grande del sur bonaerense!',
    intensity: 4, ratingBonus: 0.30, salaryBonus: 1.25, moraleWinBonus: 5, moraleLossBonus: -5
  },
  {
    home: 'Ferro Carril Oeste', away: 'Velez Sarsfield',
    name: 'Clásico del Oeste Porteño',
    category: 'derby_local', country: 'Argentina',
    desc: 'Caballito contra Liniers, una de las rivalidades con más historia de la capital.',
    chant: '¡Verdolagas y Fortineros en el duelo del oeste!',
    intensity: 4, ratingBonus: 0.28, salaryBonus: 1.25, moraleWinBonus: 5, moraleLossBonus: -4
  },
  {
    home: 'Chacarita Juniors', away: 'Atlanta',
    name: 'Clásico de Villa Crespo / San Martín',
    category: 'derby_local', country: 'Argentina',
    desc: 'El Funebrero contra el Bohemio en un choque de altísima temperatura.',
    chant: '¡Uno de los clásicos más calientes del ascenso argentino!',
    intensity: 4, ratingBonus: 0.28, salaryBonus: 1.22, moraleWinBonus: 5, moraleLossBonus: -5
  },
  {
    home: 'Nueva Chicago', away: 'All Boys',
    name: 'Clásico de Mataderos y Floresta',
    category: 'derby_local', country: 'Argentina',
    desc: 'El Torito de Mataderos contra el Albo de Floresta.',
    chant: '¡Barrio contra barrio a pura pasión!',
    intensity: 4, ratingBonus: 0.28, salaryBonus: 1.22, moraleWinBonus: 5, moraleLossBonus: -5
  },
  {
    home: 'Deportivo Moron', away: 'Almagro',
    name: 'Clásico del Oeste del Conurbano',
    category: 'derby_local', country: 'Argentina',
    desc: 'El Gallito de Morón contra el Tricolor de José Ingenieros.',
    chant: '¡Tensión pura en el conurbano oeste!',
    intensity: 3, ratingBonus: 0.24, salaryBonus: 1.20, moraleWinBonus: 4, moraleLossBonus: -4
  },
  {
    home: 'San Martin de Tucuman', away: 'Talleres',
    name: 'Duelo de Gigantes del Interior Argentino',
    category: 'regional', country: 'Argentina',
    desc: 'El Santo tucumano contra la T cordobesa.',
    chant: '¡Las dos hinchadas más multitudinarias del interior!',
    intensity: 3, ratingBonus: 0.25, salaryBonus: 1.20, moraleWinBonus: 4, moraleLossBonus: -4
  },
  {
    home: 'Godoy Cruz', away: 'San Martin de San Juan',
    name: 'Clásico de Cuyo',
    category: 'regional', country: 'Argentina',
    desc: 'El Tomba mendocino contra el Verdinegro sanjuanino.',
    chant: '¡La supremacía cuyana en juego!',
    intensity: 4, ratingBonus: 0.28, salaryBonus: 1.25, moraleWinBonus: 5, moraleLossBonus: -5
  },
  {
    home: 'Quilmes', away: 'Argentinos Juniors',
    name: 'Duelo Histórico Metropolitano',
    category: 'historico', country: 'Argentina',
    desc: 'El Cervecero del sur contra el Semillero del Mundo de La Paternal.',
    chant: '¡Duelo tradicional con rica historia de fútbol!',
    intensity: 3, ratingBonus: 0.22, salaryBonus: 1.18, moraleWinBonus: 4, moraleLossBonus: -3
  },
  {
    home: 'Temperley', away: 'Banfield',
    name: 'Clásico del Sur Menor',
    category: 'derby_local', country: 'Argentina',
    desc: 'El Gasolero de Turdera contra el Taladro de Banfield.',
    chant: '¡Rivalidad vecinal apasionada!',
    intensity: 3, ratingBonus: 0.24, salaryBonus: 1.20, moraleWinBonus: 4, moraleLossBonus: -4
  },
  {
    home: 'River Plate', away: 'Independiente',
    name: 'Clásico de Copas y Paladares Negros',
    category: 'historico', country: 'Argentina',
    desc: 'Duelo de dos de los cinco grandes más ganadores del país.',
    chant: '¡Choque de linaje y grandeza!',
    intensity: 4, ratingBonus: 0.30, salaryBonus: 1.30, moraleWinBonus: 5, moraleLossBonus: -5
  },
  {
    home: 'Boca Juniors', away: 'San Lorenzo',
    name: 'Clásico Boca-San Lorenzo',
    category: 'historico', country: 'Argentina',
    desc: 'Histórico duelo donde el Ciclón ostenta un récord envidiable ante el Xeneize.',
    chant: '¡Uno de los clásicos más picantes de los 5 grandes!',
    intensity: 4, ratingBonus: 0.30, salaryBonus: 1.30, moraleWinBonus: 5, moraleLossBonus: -5
  },
  {
    home: 'River Plate', away: 'Racing Club',
    name: 'Clásico Más Antiguo del Profesionalismo',
    category: 'historico', country: 'Argentina',
    desc: 'El primer gran clásico disputado en la era profesional de Argentina.',
    chant: '¡Tradición y gloria centenaria!',
    intensity: 4, ratingBonus: 0.30, salaryBonus: 1.30, moraleWinBonus: 5, moraleLossBonus: -4
  },
  {
    home: 'Boca Juniors', away: 'Racing Club',
    name: 'Clásico Boca-Racing',
    category: 'historico', country: 'Argentina',
    desc: 'Rivalidad de máxima tensión contemporánea, definiciones de copas y títulos.',
    chant: '¡Duelo eléctrico de 5 grandes!',
    intensity: 4, ratingBonus: 0.32, salaryBonus: 1.30, moraleWinBonus: 5, moraleLossBonus: -5
  },
  {
    home: 'San Lorenzo', away: 'River Plate',
    name: 'Clásico San Lorenzo-River',
    category: 'historico', country: 'Argentina',
    desc: 'Duelo de alto vuelo y recuerdos coperos inolvidables.',
    chant: '¡Choque de fiesta y tribunas llenas!',
    intensity: 4, ratingBonus: 0.28, salaryBonus: 1.25, moraleWinBonus: 5, moraleLossBonus: -4
  },
  {
    home: 'Independiente', away: 'Boca Juniors',
    name: 'Clásico de Reyes de Copas',
    category: 'historico', country: 'Argentina',
    desc: 'Los dos máximos ganadores históricos de la Copa Libertadores cara a cara.',
    chant: '¡El trono de América en juego!',
    intensity: 4, ratingBonus: 0.32, salaryBonus: 1.30, moraleWinBonus: 6, moraleLossBonus: -5
  },

  // ═══════════════════════════════════════════════════════════════════
  // 🇧🇷 BRASIL (Brasileirão Serie A & Serie B)
  // ═══════════════════════════════════════════════════════════════════
  {
    home: 'Flamengo', away: 'Fluminense',
    name: 'Fla-Flu · O Clássico das Multidões',
    category: 'superclasico', country: 'Brasil',
    desc: 'El derbi carioca más legendario en el Maracanã.',
    chant: '¡O Fla-Flu começou 40 minutos antes do nada!',
    intensity: 5, ratingBonus: 0.35, salaryBonus: 1.35, moraleWinBonus: 6, moraleLossBonus: -6
  },
  {
    home: 'Flamengo', away: 'Vasco da Gama',
    name: 'Clássico dos Milhões',
    category: 'superclasico', country: 'Brasil',
    desc: 'El choque con mayor número de hinchas de todo Río de Janeiro.',
    chant: '¡Rubro-Negro contra Cruzmaltino na raça!',
    intensity: 5, ratingBonus: 0.35, salaryBonus: 1.35, moraleWinBonus: 6, moraleLossBonus: -6
  },
  {
    home: 'Palmeiras', away: 'Corinthians',
    name: 'Derby Paulista',
    category: 'superclasico', country: 'Brasil',
    desc: 'Una de las mayores rivalidades del fútbol mundial en el corazón de São Paulo.',
    chant: '¡Verdão contra Timão, guerra de gigantes!',
    intensity: 5, ratingBonus: 0.38, salaryBonus: 1.38, moraleWinBonus: 7, moraleLossBonus: -7
  },
  {
    home: 'Sao Paulo', away: 'Palmeiras',
    name: 'Choque-Rei',
    category: 'superclasico', country: 'Brasil',
    desc: 'El Tricolor del Morumbí contra el Verdão del Allianz Parque.',
    chant: '¡Rivalidad paulista de títulos y finales históricas!',
    intensity: 5, ratingBonus: 0.34, salaryBonus: 1.32, moraleWinBonus: 6, moraleLossBonus: -6
  },
  {
    home: 'Sao Paulo', away: 'Corinthians',
    name: 'O Majestoso',
    category: 'superclasico', country: 'Brasil',
    desc: 'Tricolor contra Coringão en un clásico majestuoso.',
    chant: '¡São Paulo ferve no Majestoso!',
    intensity: 5, ratingBonus: 0.34, salaryBonus: 1.32, moraleWinBonus: 6, moraleLossBonus: -6
  },
  {
    home: 'Santos', away: 'Palmeiras',
    name: 'Clássico da Saudade',
    category: 'historico', country: 'Brasil',
    desc: 'El Peixe de Pelé contra la Academia de Palmeiras.',
    chant: '¡Arte pura y fútbol brasileño!',
    intensity: 4, ratingBonus: 0.30, salaryBonus: 1.25, moraleWinBonus: 5, moraleLossBonus: -5
  },
  {
    home: 'Gremio', away: 'Internacional',
    name: 'Gre-Nal',
    category: 'superclasico', country: 'Brasil',
    desc: 'El clásico gaucho de Porto Alegre, considerado por muchos el más feroz de América.',
    chant: '¡O Rio Grande do Sul dividido entre Tricolor e Colorado!',
    intensity: 5, ratingBonus: 0.40, salaryBonus: 1.40, moraleWinBonus: 7, moraleLossBonus: -7
  },
  {
    home: 'Atletico Mineiro', away: 'Cruzeiro',
    name: 'Clássico Mineiro',
    category: 'superclasico', country: 'Brasil',
    desc: 'Galo contra Raposa en el Mineirão de Belo Horizonte.',
    chant: '¡Minas Gerais para pelo clássico!',
    intensity: 5, ratingBonus: 0.36, salaryBonus: 1.35, moraleWinBonus: 6, moraleLossBonus: -6
  },
  {
    home: 'Bahia', away: 'Vitoria',
    name: 'Clássico Ba-Vi',
    category: 'superclasico', country: 'Brasil',
    desc: 'Tricolor Baiano contra Leão da Barra en Salvador de Bahía.',
    chant: '¡Axé e paixão no maior clássico do Nordeste!',
    intensity: 5, ratingBonus: 0.32, salaryBonus: 1.30, moraleWinBonus: 6, moraleLossBonus: -5
  },
  {
    home: 'Ceara', away: 'Fortaleza',
    name: 'Clássico-Rei Cearense',
    category: 'superclasico', country: 'Brasil',
    desc: 'Vozão contra Leão do Pici en el Estadio Castelão.',
    chant: '¡O clássico que incendeia Fortaleza!',
    intensity: 5, ratingBonus: 0.32, salaryBonus: 1.30, moraleWinBonus: 6, moraleLossBonus: -5
  },
  {
    home: 'Athletico Paranaense', away: 'Coritiba',
    name: 'Atletiba',
    category: 'superclasico', country: 'Brasil',
    desc: 'Furacão contra Coxa en Curitiba.',
    chant: '¡O maior clássico do Paraná!',
    intensity: 4, ratingBonus: 0.30, salaryBonus: 1.25, moraleWinBonus: 5, moraleLossBonus: -5
  },
  {
    home: 'Botafogo', away: 'Flamengo',
    name: 'Clássico da Rivalidade',
    category: 'derby_local', country: 'Brasil',
    desc: 'Fogão contra Mengão en el fútbol carioca.',
    chant: '¡Rivalidade centenaria no Rio!',
    intensity: 4, ratingBonus: 0.30, salaryBonus: 1.25, moraleWinBonus: 5, moraleLossBonus: -5
  },
  {
    home: 'Botafogo', away: 'Fluminense',
    name: 'Clássico Vovô',
    category: 'derby_local', country: 'Brasil',
    desc: 'El clásico de fútbol más antiguo de todo Brasil (desde 1905).',
    chant: '¡O clássico mais antigo do país!',
    intensity: 4, ratingBonus: 0.28, salaryBonus: 1.25, moraleWinBonus: 5, moraleLossBonus: -4
  },
  {
    home: 'Guarani', away: 'Ponte Preta',
    name: 'Derby Campineiro',
    category: 'derby_local', country: 'Brasil',
    desc: 'Bugre contra Macaca en Campinas, São Paulo.',
    chant: '¡O clássico mais quente do interior paulista!',
    intensity: 4, ratingBonus: 0.28, salaryBonus: 1.22, moraleWinBonus: 5, moraleLossBonus: -5
  },
  {
    home: 'Goias', away: 'Vila Nova',
    name: 'Derby do Cerrado',
    category: 'derby_local', country: 'Brasil',
    desc: 'Esmeraldino contra Tigre en Goiânia.',
    chant: '¡A paixão do Centro-Oeste brasileiro!',
    intensity: 4, ratingBonus: 0.28, salaryBonus: 1.22, moraleWinBonus: 5, moraleLossBonus: -5
  },
  {
    home: 'Flamengo', away: 'Palmeiras',
    name: 'Duelo dos Titãs Contemporâneos',
    category: 'historico', country: 'Brasil',
    desc: 'Los dos clubes dominadores de la Copa Libertadores y el Brasileirão en los últimos años.',
    chant: '¡O confronto pelo trono do futebol sul-americano!',
    intensity: 5, ratingBonus: 0.35, salaryBonus: 1.35, moraleWinBonus: 6, moraleLossBonus: -6
  },
  {
    home: 'Flamengo', away: 'Atletico Mineiro',
    name: 'Rivalidade Interestadual Histórica',
    category: 'historico', country: 'Brasil',
    desc: 'Rivalidad histórica encendida desde las polémicas semifinales de Libertadores de 1981.',
    chant: '¡Um dos confrontos mais tensos do Brasil!',
    intensity: 4, ratingBonus: 0.30, salaryBonus: 1.28, moraleWinBonus: 5, moraleLossBonus: -5
  },

  // ═══════════════════════════════════════════════════════════════════
  // 🇺🇾 URUGUAY
  // ═══════════════════════════════════════════════════════════════════
  {
    home: 'Penarol', away: 'Nacional',
    name: 'Superclásico del Fútbol Uruguayo',
    category: 'superclasico', country: 'Uruguay',
    desc: 'El clásico no británico más antiguo del mundo. Aurinegros contra Tricolores en el Centenario.',
    chant: '¡La garra charrúa y la gloria eterna de dos gigantes mundiales!',
    intensity: 5, ratingBonus: 0.38, salaryBonus: 1.35, moraleWinBonus: 7, moraleLossBonus: -7
  },
  {
    home: 'Defensor Sporting', away: 'Danubio',
    name: 'Clásico de los Medianos',
    category: 'derby_local', country: 'Uruguay',
    desc: 'Violetas contra Franjeados, las dos canteras de oro más prolíficas de Montevideo.',
    chant: '¡El tercer grande de Uruguay en disputa!',
    intensity: 4, ratingBonus: 0.28, salaryBonus: 1.25, moraleWinBonus: 5, moraleLossBonus: -4
  },
  {
    home: 'Montevideo Wanderers', away: 'River Plate de Montevideo',
    name: 'Clásico del Prado',
    category: 'derby_local', country: 'Uruguay',
    desc: 'El Bohemio contra el Darsenero en el histórico barrio Prado de Montevideo.',
    chant: '¡El orgullo del barrio Prado!',
    intensity: 3, ratingBonus: 0.24, salaryBonus: 1.20, moraleWinBonus: 4, moraleLossBonus: -3
  },
  {
    home: 'Racing de Montevideo', away: 'Fenix',
    name: 'Clásico del Oeste de Montevideo',
    category: 'derby_local', country: 'Uruguay',
    desc: 'La Escuelita de Sayago contra los Albivioletas de Capurro.',
    chant: '¡Duelo barrial tradicional montevideano!',
    intensity: 3, ratingBonus: 0.22, salaryBonus: 1.18, moraleWinBonus: 4, moraleLossBonus: -3
  },
  {
    home: 'Progreso', away: 'Cerro Largo',
    name: 'Duelo Gaucho e Interior',
    category: 'regional', country: 'Uruguay',
    desc: 'Los Gauchos del Pantanoso contra los Arachanes de Cerro Largo.',
    chant: '¡Fuerza y corazón uruguayo!',
    intensity: 3, ratingBonus: 0.20, salaryBonus: 1.15, moraleWinBonus: 4, moraleLossBonus: -3
  },

  // ═══════════════════════════════════════════════════════════════════
  // 🇨🇴 COLOMBIA
  // ═══════════════════════════════════════════════════════════════════
  {
    home: 'Millonarios', away: 'Santa Fe',
    name: 'Clásico Capitalino / Bogotano',
    category: 'superclasico', country: 'Colombia',
    desc: 'Embajadores contra Cardenales en El Campín de Bogotá.',
    chant: '¡Bogotá dividida en azul y rojo!',
    intensity: 5, ratingBonus: 0.35, salaryBonus: 1.30, moraleWinBonus: 6, moraleLossBonus: -6
  },
  {
    home: 'Atletico Nacional', away: 'Independiente Medellin',
    name: 'Clásico Paisa',
    category: 'superclasico', country: 'Colombia',
    desc: 'Verdolagas contra el Poderoso de la Montaña en el Atanasio Girardot.',
    chant: '¡Medellín es una fiesta verde y roja!',
    intensity: 5, ratingBonus: 0.35, salaryBonus: 1.30, moraleWinBonus: 6, moraleLossBonus: -6
  },
  {
    home: 'America de Cali', away: 'Deportivo Cali',
    name: 'Clásico Vallecaucano',
    category: 'superclasico', country: 'Colombia',
    desc: 'Los Diablos Rojos contra los Azucareros en el Valle del Cauca.',
    chant: '¡El Pascual Guerrero y Palmaseca vibran de pasión!',
    intensity: 5, ratingBonus: 0.35, salaryBonus: 1.30, moraleWinBonus: 6, moraleLossBonus: -6
  },
  {
    home: 'Atletico Nacional', away: 'Millonarios',
    name: 'Superclásico del Fútbol Colombiano',
    category: 'superclasico', country: 'Colombia',
    desc: 'El duelo de mayor rivalidad nacional y más títulos del país cafetero.',
    chant: '¡El clásico más grande de toda Colombia!',
    intensity: 5, ratingBonus: 0.38, salaryBonus: 1.35, moraleWinBonus: 7, moraleLossBonus: -6
  },
  {
    home: 'Atletico Nacional', away: 'America de Cali',
    name: 'Clásico de las Estrellas',
    category: 'superclasico', country: 'Colombia',
    desc: 'Histórica rivalidad nacida en los años 80 y 90 por la corona de América y Colombia.',
    chant: '¡Verdes contra Rojos por la hegemonía!',
    intensity: 5, ratingBonus: 0.35, salaryBonus: 1.32, moraleWinBonus: 6, moraleLossBonus: -6
  },
  {
    home: 'Junior de Barranquilla', away: 'Union Magdalena',
    name: 'Clásico Costeño / del Caribe',
    category: 'superclasico', country: 'Colombia',
    desc: 'El Tiburón de Barranquilla contra el Ciclón Bananero de Santa Marta.',
    chant: '¡La Costa Caribe en su máxima ebullición!',
    intensity: 4, ratingBonus: 0.30, salaryBonus: 1.25, moraleWinBonus: 5, moraleLossBonus: -5
  },
  {
    home: 'Once Caldas', away: 'Deportivo Pereira',
    name: 'Clásico del Eje Cafetero',
    category: 'regional', country: 'Colombia',
    desc: 'El Blanco Blanco de Manizales contra el Matecaña de Pereira.',
    chant: '¡El aroma del café y la gloria en disputa!',
    intensity: 4, ratingBonus: 0.28, salaryBonus: 1.25, moraleWinBonus: 5, moraleLossBonus: -5
  },
  {
    home: 'Deportes Tolima', away: 'Atletico Huila',
    name: 'Clásico del Tolima Grande',
    category: 'regional', country: 'Colombia',
    desc: 'El Vinotinto y Oro de Ibagué contra los Opitas de Neiva.',
    chant: '¡La supremacía del Alto Magdalena!',
    intensity: 3, ratingBonus: 0.24, salaryBonus: 1.20, moraleWinBonus: 4, moraleLossBonus: -4
  },
  {
    home: 'Cucuta Deportivo', away: 'Atletico Bucaramanga',
    name: 'Clásico del Oriente Colombiano',
    category: 'regional', country: 'Colombia',
    desc: 'Motilones de Cúcuta contra Leopardos de Bucaramanga.',
    chant: '¡El gran clásico de los Santanderes!',
    intensity: 4, ratingBonus: 0.28, salaryBonus: 1.22, moraleWinBonus: 5, moraleLossBonus: -5
  },

  // ═══════════════════════════════════════════════════════════════════
  // 🇵🇪 PERÚ
  // ═══════════════════════════════════════════════════════════════════
  {
    home: 'Universitario', away: 'Alianza Lima',
    name: 'Superclásico del Fútbol Peruano',
    category: 'superclasico', country: 'Peru',
    desc: 'La rivalidad más trascendente del Perú: Cremas contra Blanquiazules.',
    chant: '¡El Monumental y Matute rugen en el clásico de los clásicos!',
    intensity: 5, ratingBonus: 0.38, salaryBonus: 1.35, moraleWinBonus: 7, moraleLossBonus: -7
  },
  {
    home: 'Sporting Cristal', away: 'Universitario',
    name: 'Clásico Moderno Peruano',
    category: 'superclasico', country: 'Peru',
    desc: 'Celestes cerveceros contra la Garra Crema.',
    chant: '¡Duelo estelar de las últimas décadas en Lima!',
    intensity: 4, ratingBonus: 0.32, salaryBonus: 1.28, moraleWinBonus: 6, moraleLossBonus: -5
  },
  {
    home: 'Sporting Cristal', away: 'Alianza Lima',
    name: 'Clásico Lima Contemporáneo',
    category: 'superclasico', country: 'Peru',
    desc: 'El club más copero moderno contra el club más popular del país.',
    chant: '¡Emoción y goles en el Nacional!',
    intensity: 4, ratingBonus: 0.32, salaryBonus: 1.28, moraleWinBonus: 6, moraleLossBonus: -5
  },
  {
    home: 'Sport Boys', away: 'Alianza Lima',
    name: 'Clásico Lima-Callao',
    category: 'derby_local', country: 'Peru',
    desc: 'La Misilera Rosada del Callao contra la tradición de La Victoria.',
    chant: '¡El sabor y la salsa del primer puerto en la cancha!',
    intensity: 4, ratingBonus: 0.28, salaryBonus: 1.22, moraleWinBonus: 5, moraleLossBonus: -4
  },
  {
    home: 'Melgar', away: 'Cienciano',
    name: 'Clásico del Sur Peruano',
    category: 'regional', country: 'Peru',
    desc: 'El Dominó de Arequipa contra el Papá de Cusco.',
    chant: '¡El Misti contra el Imperio Incaico!',
    intensity: 4, ratingBonus: 0.28, salaryBonus: 1.22, moraleWinBonus: 5, moraleLossBonus: -5
  },
  {
    home: 'Cienciano', away: 'Cusco FC',
    name: 'Clásico Imperial Cusqueño',
    category: 'derby_local', country: 'Peru',
    desc: 'Duelo directo en la altura de Cusco en el Estadio Garcilaso de la Vega.',
    chant: '¡La capital arqueológica de América vibra con su derbi!',
    intensity: 3, ratingBonus: 0.24, salaryBonus: 1.20, moraleWinBonus: 4, moraleLossBonus: -3
  },

  // ═══════════════════════════════════════════════════════════════════
  // 🇪🇨 ECUADOR
  // ═══════════════════════════════════════════════════════════════════
  {
    home: 'Barcelona SC', away: 'Emelec',
    name: 'Clásico del Astillero',
    category: 'superclasico', country: 'Ecuador',
    desc: 'El partido inmortal de Guayaquil y el derbi más caliente de Ecuador.',
    chant: '¡El Ídolo del Ecuador contra el Bombillo azul!',
    intensity: 5, ratingBonus: 0.38, salaryBonus: 1.35, moraleWinBonus: 7, moraleLossBonus: -7
  },
  {
    home: 'Liga de Quito', away: 'Barcelona SC',
    name: 'Clásico Nacional Ecuatoriano',
    category: 'superclasico', country: 'Ecuador',
    desc: 'Quito contra Guayaquil: el Rey de Copas frente al Ídolo del Astillero.',
    chant: '¡Sierra contra Costa en una rivalidad implacable!',
    intensity: 5, ratingBonus: 0.35, salaryBonus: 1.32, moraleWinBonus: 6, moraleLossBonus: -6
  },
  {
    home: 'Liga de Quito', away: 'Aucas',
    name: 'Superclásico Capitalino / Quiteño',
    category: 'derby_local', country: 'Ecuador',
    desc: 'La U blanca de Ponciano contra el Papá Aucas del sur de Quito.',
    chant: '¡La tradición histórica de la capital ecuatoriana!',
    intensity: 4, ratingBonus: 0.30, salaryBonus: 1.25, moraleWinBonus: 5, moraleLossBonus: -5
  },
  {
    home: 'Liga de Quito', away: 'El Nacional',
    name: 'Clásico de los Títulos Quiteños',
    category: 'derby_local', country: 'Ecuador',
    desc: 'Los Albos contra los Puros Criollos de las Fuerzas Armadas.',
    chant: '¡Duelo de campeones en Quito!',
    intensity: 4, ratingBonus: 0.28, salaryBonus: 1.25, moraleWinBonus: 5, moraleLossBonus: -4
  },
  {
    home: 'Independiente del Valle', away: 'Liga de Quito',
    name: 'Clásico de la Sierra Moderna',
    category: 'superclasico', country: 'Ecuador',
    desc: 'El Matagigantes del Valle contra la historia de la U.',
    chant: '¡Fútbol moderno, cantera e intensidad!',
    intensity: 4, ratingBonus: 0.32, salaryBonus: 1.30, moraleWinBonus: 6, moraleLossBonus: -5
  },
  {
    home: 'Delfin', away: 'Manta FC',
    name: 'Clásico Manabita',
    category: 'derby_local', country: 'Ecuador',
    desc: 'El Cetáceo contra el Manta en el Estadio Jocay.',
    chant: '¡Todo Manabí pendiente de la costa!',
    intensity: 3, ratingBonus: 0.24, salaryBonus: 1.20, moraleWinBonus: 4, moraleLossBonus: -3
  },

  // ═══════════════════════════════════════════════════════════════════
  // 🇵🇾 PARAGUAY & 🇧🇴 BOLIVIA & 🇻🇪 VENEZUELA
  // ═══════════════════════════════════════════════════════════════════
  {
    home: 'Olimpia', away: 'Cerro Porteno',
    name: 'Superclásico del Fútbol Paraguayo',
    category: 'superclasico', country: 'Paraguay',
    desc: 'El Decano contra el Ciclón de Barrio Obrero en Asunción.',
    chant: '¡Paraguay se paraliza por completo en el Defensores del Chaco!',
    intensity: 5, ratingBonus: 0.38, salaryBonus: 1.35, moraleWinBonus: 7, moraleLossBonus: -7
  },
  {
    home: 'Olimpia', away: 'Libertad',
    name: 'Clásico Blanco y Negro',
    category: 'superclasico', country: 'Paraguay',
    desc: 'Duelo de dos de los clubes más laureados del fútbol paraguayo.',
    chant: '¡Poderío y jerarquía asuncena!',
    intensity: 4, ratingBonus: 0.30, salaryBonus: 1.25, moraleWinBonus: 5, moraleLossBonus: -5
  },
  {
    home: 'Olimpia', away: 'Guarani de Asuncion',
    name: 'Clásico Más Añejo de Paraguay',
    category: 'historico', country: 'Paraguay',
    desc: 'El primer clásico registrado en la historia del fútbol paraguayo.',
    chant: '¡Más de cien años de tradición futbolera!',
    intensity: 3, ratingBonus: 0.26, salaryBonus: 1.20, moraleWinBonus: 4, moraleLossBonus: -4
  },
  {
    home: 'Bolivar', away: 'The Strongest',
    name: 'Superclásico Paceño / Boliviano',
    category: 'superclasico', country: 'Bolivia',
    desc: 'La Academia Celeste contra el Tigre Atigrado en el Hernando Siles de La Paz.',
    chant: '¡El clásico más alto del mundo a 3.600 metros de altura!',
    intensity: 5, ratingBonus: 0.35, salaryBonus: 1.30, moraleWinBonus: 6, moraleLossBonus: -6
  },
  {
    home: 'Oriente Petrolero', away: 'Blooming',
    name: 'Clásico Cruceño',
    category: 'superclasico', country: 'Bolivia',
    desc: 'Refineros verdes contra la Academia celeste en el Tahuichi de Santa Cruz.',
    chant: '¡El oriente boliviano arde de pasión en el Tahuichi!',
    intensity: 5, ratingBonus: 0.32, salaryBonus: 1.25, moraleWinBonus: 6, moraleLossBonus: -5
  },
  {
    home: 'Wilstermann', away: 'Aurora',
    name: 'Clásico Cochabambino',
    category: 'derby_local', country: 'Bolivia',
    desc: 'El Aviador rojo contra el Equipo del Pueblo celeste en Cochabamba.',
    chant: '¡Duelo valluno en el Félix Capriles!',
    intensity: 4, ratingBonus: 0.28, salaryBonus: 1.22, moraleWinBonus: 5, moraleLossBonus: -4
  },
  {
    home: 'Caracas FC', away: 'Deportivo Tachira',
    name: 'Clásico del Fútbol Venezolano',
    category: 'superclasico', country: 'Venezuela',
    desc: 'Los Rojos del Ávila de la capital contra el Carrusel Aurinegro de San Cristóbal.',
    chant: '¡La mayor rivalidad de la Liga FUTVE!',
    intensity: 5, ratingBonus: 0.35, salaryBonus: 1.30, moraleWinBonus: 6, moraleLossBonus: -6
  },
  {
    home: 'Deportivo Tachira', away: 'Estudiantes de Merida',
    name: 'Clásico Andino Venezolano',
    category: 'regional', country: 'Venezuela',
    desc: 'San Cristóbal contra Mérida en el corazón de los Andes venezolanos.',
    chant: '¡El honor de la cordillera andina!',
    intensity: 4, ratingBonus: 0.28, salaryBonus: 1.22, moraleWinBonus: 5, moraleLossBonus: -4
  },
  {
    home: 'Zamora FC', away: 'Portuguesa FC',
    name: 'Clásico de los Llanos',
    category: 'regional', country: 'Venezuela',
    desc: 'La Furia Llanera contra el histórico Penta de Acarigua.',
    chant: '¡Fuerza y garra en el llano venezolano!',
    intensity: 3, ratingBonus: 0.24, salaryBonus: 1.18, moraleWinBonus: 4, moraleLossBonus: -3
  },

  // ═══════════════════════════════════════════════════════════════════
  // 🇲🇽 MÉXICO (Liga MX & Liga de Expansión)
  // ═══════════════════════════════════════════════════════════════════
  {
    home: 'America', away: 'Chivas Guadalajara',
    name: 'El Clásico Nacional / Clásico de Clásicos',
    category: 'superclasico', country: 'Mexico',
    desc: 'Águilas contra el Rebaño Sagrado. El partido más visto e histórico de México.',
    chant: '¡El Azteca y el Akron arden con el Clásico de Clásicos!',
    intensity: 5, ratingBonus: 0.40, salaryBonus: 1.40, moraleWinBonus: 7, moraleLossBonus: -7
  },
  {
    home: 'America', away: 'Cruz Azul',
    name: 'Clásico Joven',
    category: 'superclasico', country: 'Mexico',
    desc: 'Águilas contra La Máquina Celeste en la capital mexicana.',
    chant: '¡Finales de infarto y tensión capitalina!',
    intensity: 5, ratingBonus: 0.35, salaryBonus: 1.32, moraleWinBonus: 6, moraleLossBonus: -6
  },
  {
    home: 'America', away: 'Pumas UNAM',
    name: 'Clásico Capitalino',
    category: 'superclasico', country: 'Mexico',
    desc: 'Águilas contra los Universitarios del Pedregal en C.U.',
    chant: '¡¡Goooya!! vs ¡¡Águilas!!, choque de tribunas calientes!',
    intensity: 5, ratingBonus: 0.35, salaryBonus: 1.32, moraleWinBonus: 6, moraleLossBonus: -6
  },
  {
    home: 'Tigres UANL', away: 'Monterrey',
    name: 'Clásico Regiomontano / Regio',
    category: 'superclasico', country: 'Mexico',
    desc: 'Felinos contra Rayados en Monterrey: la ciudad más futbolera de México paralizada.',
    chant: '¡La Sultana del Norte no duerme en la semana del Clásico Regio!',
    intensity: 5, ratingBonus: 0.38, salaryBonus: 1.35, moraleWinBonus: 7, moraleLossBonus: -6
  },
  {
    home: 'Chivas Guadalajara', away: 'Atlas',
    name: 'Clásico Tapatío',
    category: 'superclasico', country: 'Mexico',
    desc: 'El clásico más antiguo de México: Rojiblancos contra Rojinegros en Guadalajara.',
    chant: '¡Jalisco se viste de fiesta en el clásico más añejo!',
    intensity: 5, ratingBonus: 0.34, salaryBonus: 1.30, moraleWinBonus: 6, moraleLossBonus: -6
  },
  {
    home: 'Pachuca', away: 'Leon',
    name: 'Clásico de Hermanos / Grupo Pachuca',
    category: 'historico', country: 'Mexico',
    desc: 'Los Tuzos de Hidalgo frente a La Fiera de Guanajuato.',
    chant: '¡Duelo de garra, fútbol dinámico y títulos!',
    intensity: 3, ratingBonus: 0.25, salaryBonus: 1.20, moraleWinBonus: 4, moraleLossBonus: -4
  },
  {
    home: 'Santos Laguna', away: 'Monterrey',
    name: 'Clásico del Norte / Rivalidad Norteña',
    category: 'regional', country: 'Mexico',
    desc: 'Guerreros de La Laguna contra Rayados en el norte de México.',
    chant: '¡El calor de la Comarca Lagunera contra el Cerro de la Silla!',
    intensity: 4, ratingBonus: 0.28, salaryBonus: 1.25, moraleWinBonus: 5, moraleLossBonus: -4
  },
  {
    home: 'Puebla', away: 'Toluca',
    name: 'Duelo Tradicional del Centro',
    category: 'regional', country: 'Mexico',
    desc: 'La Franja del Cuauhtémoc contra los Diablos Rojos del Nemesio Díez.',
    chant: '¡Fútbol clásico y bravura en el centro del país!',
    intensity: 3, ratingBonus: 0.24, salaryBonus: 1.18, moraleWinBonus: 4, moraleLossBonus: -3
  },
  {
    home: 'Tijuana', away: 'FC Juarez',
    name: 'Clásico de la Frontera',
    category: 'regional', country: 'Mexico',
    desc: 'Xolos de Tijuana contra Bravos de Juárez en la frontera norte.',
    chant: '¡La frontera mexicana en pie de guerra futbolística!',
    intensity: 3, ratingBonus: 0.22, salaryBonus: 1.18, moraleWinBonus: 4, moraleLossBonus: -3
  },
  {
    home: 'Atlante', away: 'Celaya',
    name: 'Clásico de la División de Plata',
    category: 'regional', country: 'Mexico',
    desc: 'Los Potros de Hierro contra los Toros del Celaya.',
    chant: '¡Historia viva y lucha por el ascenso!',
    intensity: 3, ratingBonus: 0.22, salaryBonus: 1.18, moraleWinBonus: 4, moraleLossBonus: -3
  },

  // ═══════════════════════════════════════════════════════════════════
  // 🇺🇸 ESTADOS UNIDOS (Major League Soccer)
  // ═══════════════════════════════════════════════════════════════════
  {
    home: 'LA Galaxy', away: 'LAFC',
    name: 'El Tráfico · Los Angeles Derby',
    category: 'superclasico', country: 'Estados Unidos',
    desc: 'La rivalidad angelina más eléctrica y repleta de estrellas mundiales.',
    chant: '¡LA is Black and Gold / LA is Galaxy!',
    intensity: 5, ratingBonus: 0.35, salaryBonus: 1.30, moraleWinBonus: 6, moraleLossBonus: -5
  },
  {
    home: 'New York City FC', away: 'New York Red Bulls',
    name: 'Hudson River Derby',
    category: 'derby_local', country: 'Estados Unidos',
    desc: 'El choque entre la Gran Manzana y Nueva Jersey por el trono de Nueva York.',
    chant: '¡New York is Blue / New York is Red!',
    intensity: 4, ratingBonus: 0.30, salaryBonus: 1.25, moraleWinBonus: 5, moraleLossBonus: -5
  },
  {
    home: 'Seattle Sounders', away: 'Portland Timbers',
    name: 'Cascadia Cup Derby',
    category: 'superclasico', country: 'Estados Unidos',
    desc: 'La rivalidad más auténtica y ruidosa de Norteamérica en el Pacífico Noroeste.',
    chant: '¡Build a bonfire, build a bonfire, put the Timbers on the top!',
    intensity: 5, ratingBonus: 0.34, salaryBonus: 1.28, moraleWinBonus: 6, moraleLossBonus: -6
  },
  {
    home: 'Columbus Crew', away: 'FC Cincinnati',
    name: 'Hell is Real Derby',
    category: 'derby_local', country: 'Estados Unidos',
    desc: 'El derbi de Ohio que toma su nombre del famoso cartel de la Interestatal 71.',
    chant: '¡Hell is Real and Ohio is Yellow and Black / Orange and Blue!',
    intensity: 4, ratingBonus: 0.30, salaryBonus: 1.25, moraleWinBonus: 5, moraleLossBonus: -5
  },
  {
    home: 'Inter Miami', away: 'Atlanta United',
    name: 'Clásico del Sur Este / Duelo de Franquicias Top',
    category: 'historico', country: 'Estados Unidos',
    desc: 'Las Garzas de Miami contra The Five Stripes de Atlanta.',
    chant: '¡Duelo estelar de playoffs y figuras mundiales!',
    intensity: 4, ratingBonus: 0.30, salaryBonus: 1.25, moraleWinBonus: 5, moraleLossBonus: -4
  },

  // ═══════════════════════════════════════════════════════════════════
  // 🇪🇸 ESPAÑA (LaLiga & LaLiga Hypermotion)
  // ═══════════════════════════════════════════════════════════════════
  {
    home: 'Real Madrid', away: 'Barcelona',
    name: 'El Clásico Español',
    category: 'superclasico', country: 'Espana',
    desc: 'El mayor espectáculo deportivo del planeta: Merengues contra Blaugranas.',
    chant: '¡¡Hala Madrid!! vs ¡¡Visca el Barça!!',
    intensity: 5, ratingBonus: 0.40, salaryBonus: 1.45, moraleWinBonus: 8, moraleLossBonus: -8
  },
  {
    home: 'Real Madrid', away: 'Atletico de Madrid',
    name: 'Derbi Madrileño',
    category: 'superclasico', country: 'Espana',
    desc: 'El rey de Europa contra los Colchoneros del Metropolitano en la capital de España.',
    chant: '¡Madrid no duerme cuando rueda el balón en el Bernabéu o el Metropolitano!',
    intensity: 5, ratingBonus: 0.38, salaryBonus: 1.35, moraleWinBonus: 7, moraleLossBonus: -7
  },
  {
    home: 'Sevilla', away: 'Real Betis',
    name: 'El Gran Derbi Sevillano',
    category: 'superclasico', country: 'Espana',
    desc: 'Pasión desbordada en la ciudad de la Giralda: Nervión contra Heliópolis.',
    chant: '¡Sevilla tiene un color especial... pero en el derbi se divide el corazón!',
    intensity: 5, ratingBonus: 0.38, salaryBonus: 1.35, moraleWinBonus: 7, moraleLossBonus: -7
  },
  {
    home: 'Athletic Club', away: 'Real Sociedad',
    name: 'Derbi Vasco',
    category: 'superclasico', country: 'Espana',
    desc: 'Leones de San Mamés contra Txuri-urdines de Anoeta en una fiesta de hermandad y rivalidad.',
    chant: '¡Gora Athletic! ¡Gora Erreala! ¡El fútbol vasco en su máxima expresión!',
    intensity: 4, ratingBonus: 0.32, salaryBonus: 1.30, moraleWinBonus: 6, moraleLossBonus: -5
  },
  {
    home: 'Valencia', away: 'Villarreal',
    name: 'Derbi de la Comunitat Valenciana',
    category: 'derby_local', country: 'Espana',
    desc: 'Los Ches de Mestalla contra el Submarino Amarillo de La Cerámica.',
    chant: '¡La supremacía de la Comunitat en juego!',
    intensity: 4, ratingBonus: 0.30, salaryBonus: 1.25, moraleWinBonus: 5, moraleLossBonus: -5
  },
  {
    home: 'Valencia', away: 'Levante',
    name: 'Derbi del Turia / Ciudad de Valencia',
    category: 'derby_local', country: 'Espana',
    desc: 'Mestalla contra el Ciutat de València: los dos clubes de la capital del Turia.',
    chant: '¡La batalla por Valencia!',
    intensity: 4, ratingBonus: 0.28, salaryBonus: 1.22, moraleWinBonus: 5, moraleLossBonus: -4
  },
  {
    home: 'Barcelona', away: 'Espanyol',
    name: 'Derbi Barcelonés / Derbi Catalán',
    category: 'derby_local', country: 'Espana',
    desc: 'Culés contra Pericos en la ciudad condal.',
    chant: '¡Orgullo catalán y tensión en cada jugada!',
    intensity: 4, ratingBonus: 0.30, salaryBonus: 1.25, moraleWinBonus: 5, moraleLossBonus: -5
  },
  {
    home: 'Celta de Vigo', away: 'Deportivo de La Coruna',
    name: 'O Noso Derbi · Derbi Gallego',
    category: 'superclasico', country: 'Espana',
    desc: 'Celtistas de Balaídos contra Deportivistas de Riazor en toda Galicia.',
    chant: '¡Galicia enteira dividida entre Vigo e A Coruña!',
    intensity: 5, ratingBonus: 0.35, salaryBonus: 1.30, moraleWinBonus: 6, moraleLossBonus: -6
  },
  {
    home: 'Sporting de Gijon', away: 'Real Oviedo',
    name: 'Derbi Asturiano',
    category: 'superclasico', country: 'Espana',
    desc: 'Sportinguistas de El Molinón contra Oviedistas del Carlos Tartiere.',
    chant: '¡Asturias patria querida arde con el derbi!',
    intensity: 5, ratingBonus: 0.35, salaryBonus: 1.30, moraleWinBonus: 6, moraleLossBonus: -6
  },
  {
    home: 'Athletic Club', away: 'Osasuna',
    name: 'Duelo Euskal Herria - Navarra',
    category: 'regional', country: 'Espana',
    desc: 'San Mamés contra El Sadar de Pamplona.',
    chant: '¡Intensidad, balones aéreos y choque sin cuartel!',
    intensity: 4, ratingBonus: 0.28, salaryBonus: 1.22, moraleWinBonus: 5, moraleLossBonus: -4
  },
  {
    home: 'Real Zaragoza', away: 'Huesca',
    name: 'Derbi Aragonés',
    category: 'regional', country: 'Espana',
    desc: 'Blanquillos de La Romareda contra Oscenses de El Alcoraz en Aragón.',
    chant: '¡La corona de Aragón sobre el césped!',
    intensity: 3, ratingBonus: 0.24, salaryBonus: 1.20, moraleWinBonus: 4, moraleLossBonus: -4
  },
  {
    home: 'Getafe', away: 'Rayo Vallecano',
    name: 'Derbi del Sur de Madrid',
    category: 'derby_local', country: 'Espana',
    desc: 'Azulones del Coliseum contra la Franja de Vallecas.',
    chant: '¡Barrio contra municipio en la Comunidad de Madrid!',
    intensity: 3, ratingBonus: 0.24, salaryBonus: 1.20, moraleWinBonus: 4, moraleLossBonus: -3
  },
  {
    home: 'Almeria', away: 'Granada',
    name: 'Derbi de Andalucía Oriental',
    category: 'regional', country: 'Espana',
    desc: 'Indálicos contra Nazaríes en el oriente andaluz.',
    chant: '¡Pasión andaluza bajo el sol!',
    intensity: 3, ratingBonus: 0.24, salaryBonus: 1.20, moraleWinBonus: 4, moraleLossBonus: -3
  },
  {
    home: 'Cadiz', away: 'Malaga',
    name: 'Derbi Costero Andaluz',
    category: 'regional', country: 'Espana',
    desc: 'El submarino amarillo gaditano contra los boquerones de La Rosaleda.',
    chant: '¡Arte, guasa y pura rivalidad andaluza!',
    intensity: 3, ratingBonus: 0.24, salaryBonus: 1.20, moraleWinBonus: 4, moraleLossBonus: -3
  },

  // ═══════════════════════════════════════════════════════════════════
  // 🏴 INGLATERRA (Premier League & EFL Championship)
  // ═══════════════════════════════════════════════════════════════════
  {
    home: 'Manchester United', away: 'Manchester City',
    name: 'The Manchester Derby',
    category: 'superclasico', country: 'Inglaterra',
    desc: 'Old Trafford contra el Etihad Stadium por la supremacía de Manchester.',
    chant: '¡Manchester is Red / Manchester is Blue!',
    intensity: 5, ratingBonus: 0.38, salaryBonus: 1.40, moraleWinBonus: 7, moraleLossBonus: -7
  },
  {
    home: 'Liverpool', away: 'Manchester United',
    name: 'North West Derby',
    category: 'superclasico', country: 'Inglaterra',
    desc: 'Los dos gigantes más laureados de la historia del fútbol inglés frente a frente.',
    chant: '¡La batalla de los 39 títulos de liga!',
    intensity: 5, ratingBonus: 0.40, salaryBonus: 1.45, moraleWinBonus: 8, moraleLossBonus: -8
  },
  {
    home: 'Liverpool', away: 'Everton',
    name: 'Merseyside Derby · The Friendly Derby',
    category: 'superclasico', country: 'Inglaterra',
    desc: 'Anfield contra Goodison Park a orillas del río Mersey.',
    chant: '¡Rivalidad familiar donde no se regala ni un centímetro!',
    intensity: 5, ratingBonus: 0.35, salaryBonus: 1.32, moraleWinBonus: 6, moraleLossBonus: -6
  },
  {
    home: 'Arsenal', away: 'Tottenham Hotspur',
    name: 'North London Derby',
    category: 'superclasico', country: 'Inglaterra',
    desc: 'Gunners del Emirates contra Spurs del Tottenham Stadium.',
    chant: '¡North London is Red / North London is White!',
    intensity: 5, ratingBonus: 0.38, salaryBonus: 1.38, moraleWinBonus: 7, moraleLossBonus: -7
  },
  {
    home: 'Chelsea', away: 'Arsenal',
    name: 'London Derby · Chelsea vs Arsenal',
    category: 'superclasico', country: 'Inglaterra',
    desc: 'Blues de Stamford Bridge contra Gunners por el trono de la capital británica.',
    chant: '¡Choque de titanes en Londres!',
    intensity: 4, ratingBonus: 0.32, salaryBonus: 1.30, moraleWinBonus: 6, moraleLossBonus: -5
  },
  {
    home: 'Chelsea', away: 'Tottenham Hotspur',
    name: 'The Battle of the Bridge',
    category: 'superclasico', country: 'Inglaterra',
    desc: 'Rivalidad feroz que alcanzó su pico en la mítica batalla de 2016.',
    chant: '¡Tensión al límite en el oeste londinense!',
    intensity: 4, ratingBonus: 0.32, salaryBonus: 1.30, moraleWinBonus: 6, moraleLossBonus: -5
  },
  {
    home: 'Chelsea', away: 'Fulham',
    name: 'West London Derby',
    category: 'derby_local', country: 'Inglaterra',
    desc: 'Stamford Bridge contra Craven Cottage en el elegante barrio de Fulham.',
    chant: '¡Vecinos de barrio a orillas del Támesis!',
    intensity: 3, ratingBonus: 0.25, salaryBonus: 1.20, moraleWinBonus: 4, moraleLossBonus: -4
  },
  {
    home: 'West Ham', away: 'Chelsea',
    name: 'East vs West London Derby',
    category: 'derby_local', country: 'Inglaterra',
    desc: 'Los Hammers del East End contra los aristócratas del West End.',
    chant: '¡I\'m forever blowing bubbles en territorio hostil!',
    intensity: 4, ratingBonus: 0.30, salaryBonus: 1.25, moraleWinBonus: 5, moraleLossBonus: -5
  },
  {
    home: 'Crystal Palace', away: 'Brighton',
    name: 'M23 Derby',
    category: 'regional', country: 'Inglaterra',
    desc: 'Eagles del sur de Londres contra Seagulls de la costa sur a través de la autopista M23.',
    chant: '¡Una de las rivalidades más inesperadas y feroces de Inglaterra!',
    intensity: 4, ratingBonus: 0.30, salaryBonus: 1.25, moraleWinBonus: 5, moraleLossBonus: -5
  },
  {
    home: 'Aston Villa', away: 'Wolves',
    name: 'West Midlands Derby',
    category: 'derby_local', country: 'Inglaterra',
    desc: 'Villanos de Villa Park contra los Lobos de Molineux.',
    chant: '¡El corazón industrial de Inglaterra en juego!',
    intensity: 4, ratingBonus: 0.30, salaryBonus: 1.25, moraleWinBonus: 5, moraleLossBonus: -4
  },
  {
    home: 'Aston Villa', away: 'West Bromwich Albion',
    name: 'Derbi de Birmingham & The Black Country',
    category: 'derby_local', country: 'Inglaterra',
    desc: 'Villa contra los Baggies de The Hawthorns.',
    chant: '¡Rivalidad histórica en las West Midlands!',
    intensity: 4, ratingBonus: 0.28, salaryBonus: 1.22, moraleWinBonus: 5, moraleLossBonus: -4
  },
  {
    home: 'Newcastle United', away: 'Sunderland',
    name: 'Tyne-Wear Derby',
    category: 'superclasico', country: 'Inglaterra',
    desc: 'Magpies de St. James\' Park contra Black Cats del Stadium of Light.',
    chant: '¡El derbi más ruidoso y pasional del norte inglés!',
    intensity: 5, ratingBonus: 0.38, salaryBonus: 1.35, moraleWinBonus: 7, moraleLossBonus: -7
  },
  {
    home: 'Leeds United', away: 'Manchester United',
    name: 'Roses Rivalry · Guerra de las Rosas',
    category: 'historico', country: 'Inglaterra',
    desc: 'Yorkshire de rosa blanca contra Lancashire de rosa roja.',
    chant: '¡Rivalidad medieval llevada al campo de juego con odio deportivo puro!',
    intensity: 5, ratingBonus: 0.36, salaryBonus: 1.32, moraleWinBonus: 6, moraleLossBonus: -6
  },
  {
    home: 'Nottingham Forest', away: 'Leicester City',
    name: 'East Midlands Derby',
    category: 'regional', country: 'Inglaterra',
    desc: 'El City Ground de Nottingham contra el King Power Stadium de Leicester.',
    chant: '¡La corona de las East Midlands!',
    intensity: 4, ratingBonus: 0.28, salaryBonus: 1.25, moraleWinBonus: 5, moraleLossBonus: -4
  },
  {
    home: 'Norwich City', away: 'Ipswich Town',
    name: 'East Anglian Derby · The Old Farm Derby',
    category: 'regional', country: 'Inglaterra',
    desc: 'Canaries de Carrow Road contra Tractor Boys de Portman Road.',
    chant: '¡El orgullo del este de Inglaterra!',
    intensity: 4, ratingBonus: 0.28, salaryBonus: 1.22, moraleWinBonus: 5, moraleLossBonus: -5
  },
  {
    home: 'Sheffield United', away: 'Leeds United',
    name: 'Yorkshire Derby',
    category: 'regional', country: 'Inglaterra',
    desc: 'Blades de Bramall Lane contra Whites de Elland Road.',
    chant: '¡El acero y la gloria de Yorkshire!',
    intensity: 4, ratingBonus: 0.28, salaryBonus: 1.22, moraleWinBonus: 5, moraleLossBonus: -4
  },
  {
    home: 'Southampton', away: 'Bournemouth',
    name: 'South Coast Derby',
    category: 'regional', country: 'Inglaterra',
    desc: 'Saints de St Mary\'s contra Cherries de Vitality Stadium.',
    chant: '¡Batalla por la costa sur inglesa!',
    intensity: 3, ratingBonus: 0.24, salaryBonus: 1.20, moraleWinBonus: 4, moraleLossBonus: -3
  },

  // ═══════════════════════════════════════════════════════════════════
  // 🇮🇹 ITALIA (Serie A & Serie B)
  // ═══════════════════════════════════════════════════════════════════
  {
    home: 'Inter de Milan', away: 'AC Milan',
    name: 'Derby della Madonnina · Derby di Milano',
    category: 'superclasico', country: 'Italia',
    desc: 'Nerazzurri contra Rossoneri compartiendo el mítico templo de San Siro.',
    chant: '¡Milano siamo noi! ¡El derbi más glamuroso y táctico del mundo!',
    intensity: 5, ratingBonus: 0.40, salaryBonus: 1.40, moraleWinBonus: 7, moraleLossBonus: -7
  },
  {
    home: 'Juventus', away: 'Inter de Milan',
    name: 'Derby d\'Italia',
    category: 'superclasico', country: 'Italia',
    desc: 'La Vecchia Signora contra el Biscione: la rivalidad nacional más agria de Italia.',
    chant: '¡El derbi de Italia enciende todas las televisiones de la península!',
    intensity: 5, ratingBonus: 0.40, salaryBonus: 1.40, moraleWinBonus: 7, moraleLossBonus: -7
  },
  {
    home: 'Juventus', away: 'Torino',
    name: 'Derby della Mole',
    category: 'superclasico', country: 'Italia',
    desc: 'Bianconeri contra el Toro Granata bajo la sombra de la Mole Antonelliana en Turín.',
    chant: '¡Pasión proletaria contra poderío industrial en el Piamonte!',
    intensity: 4, ratingBonus: 0.32, salaryBonus: 1.30, moraleWinBonus: 6, moraleLossBonus: -5
  },
  {
    home: 'AS Roma', away: 'Lazio',
    name: 'Derby della Capitale',
    category: 'superclasico', country: 'Italia',
    desc: 'Giallorossi de la Curva Sud contra Biancocelesti de la Curva Nord en el Olímpico de Roma.',
    chant: '¡Roma caput mundi! ¡El derbi más volcánico e intenso de Italia!',
    intensity: 5, ratingBonus: 0.40, salaryBonus: 1.40, moraleWinBonus: 8, moraleLossBonus: -8
  },
  {
    home: 'AS Roma', away: 'Napoli',
    name: 'Derby del Sole / Derby del Sud',
    category: 'superclasico', country: 'Italia',
    desc: 'El Coliseo romano contra el Vesubio napolitano.',
    chant: '¡La pasión del centro y sur de Italia frente a frente!',
    intensity: 4, ratingBonus: 0.34, salaryBonus: 1.30, moraleWinBonus: 6, moraleLossBonus: -6
  },
  {
    home: 'Genoa', away: 'Sampdoria',
    name: 'Derby della Lanterna',
    category: 'superclasico', country: 'Italia',
    desc: 'Grifone contra Blucerchiati en el Estadio Luigi Ferraris de Génova.',
    chant: '¡Una de las coreografías y ambientes más bellos del planeta!',
    intensity: 5, ratingBonus: 0.35, salaryBonus: 1.30, moraleWinBonus: 6, moraleLossBonus: -6
  },
  {
    home: 'Fiorentina', away: 'Juventus',
    name: 'Rivalità Viola-Bianconera',
    category: 'historico', country: 'Italia',
    desc: 'Florencia contra Turín: odio futbolístico puro nacido en el polémico scudetto de 1982.',
    chant: '¡El Artemio Franchi es un infierno morado para la Juve!',
    intensity: 4, ratingBonus: 0.32, salaryBonus: 1.28, moraleWinBonus: 6, moraleLossBonus: -5
  },
  {
    home: 'Bologna', away: 'Fiorentina',
    name: 'Derby dell\'Appennino',
    category: 'regional', country: 'Italia',
    desc: 'Rossoblù de Emilia contra Viola de Toscana a través de los Apeninos.',
    chant: '¡Duelo regional histórico de gran categoría!',
    intensity: 3, ratingBonus: 0.25, salaryBonus: 1.20, moraleWinBonus: 4, moraleLossBonus: -4
  },
  {
    home: 'Atalanta', away: 'Brescia',
    name: 'Derby Lombardo Bergamo-Brescia',
    category: 'derby_local', country: 'Italia',
    desc: 'La Dea de Bérgamo contra las Golondrinas de Brescia.',
    chant: '¡Férreo antagonismo en el corazón de Lombardía!',
    intensity: 4, ratingBonus: 0.30, salaryBonus: 1.25, moraleWinBonus: 5, moraleLossBonus: -5
  },
  {
    home: 'Bologna', away: 'Parma',
    name: 'Derby dell\'Emilia',
    category: 'regional', country: 'Italia',
    desc: 'El Renato Dall\'Ara contra el Ennio Tardini en la región de Emilia-Romaña.',
    chant: '¡La joya culinaria y futbolera de Emilia!',
    intensity: 3, ratingBonus: 0.25, salaryBonus: 1.20, moraleWinBonus: 4, moraleLossBonus: -3
  },
  {
    home: 'Napoli', away: 'Juventus',
    name: 'Sfida Nord-Sud',
    category: 'historico', country: 'Italia',
    desc: 'Nápoles contra el norte industrial de Turín: la eterna lucha reivindicada por Maradona.',
    chant: '¡Un popolo, una maglia, una città contro il potere!',
    intensity: 5, ratingBonus: 0.36, salaryBonus: 1.35, moraleWinBonus: 7, moraleLossBonus: -6
  },
  {
    home: 'Palermo', away: 'Catania',
    name: 'Derby di Sicilia',
    category: 'regional', country: 'Italia',
    desc: 'Rosanero de Palermo contra Elefantes del Etna.',
    chant: '¡La isla de Sicilia en llamas de fervor!',
    intensity: 4, ratingBonus: 0.30, salaryBonus: 1.25, moraleWinBonus: 5, moraleLossBonus: -5
  },
  {
    home: 'Hellas Verona', away: 'Udinese',
    name: 'Derby del Nordest / Triveneto',
    category: 'regional', country: 'Italia',
    desc: 'Scaligeri de Verona contra Zebrette de Friuli.',
    chant: '¡Orgullo del noreste italiano!',
    intensity: 3, ratingBonus: 0.22, salaryBonus: 1.18, moraleWinBonus: 4, moraleLossBonus: -3
  },

  // ═══════════════════════════════════════════════════════════════════
  // 🇩🇪 ALEMANIA (Bundesliga & 2. Bundesliga)
  // ═══════════════════════════════════════════════════════════════════
  {
    home: 'Bayern Munich', away: 'Borussia Dortmund',
    name: 'Der Klassiker',
    category: 'superclasico', country: 'Alemania',
    desc: 'El gigante bávaro contra el Muro Amarillo del Signal Iduna Park.',
    chant: '¡Mia San Mia contra Die Schwarzgelben en la cima del fútbol alemán!',
    intensity: 5, ratingBonus: 0.38, salaryBonus: 1.40, moraleWinBonus: 7, moraleLossBonus: -7
  },
  {
    home: 'Borussia Dortmund', away: 'Schalke 04',
    name: 'Revierderby · Die Mutter aller Derbys',
    category: 'superclasico', country: 'Alemania',
    desc: 'Dortmund contra Gelsenkirchen en la cuenca del Ruhr: la madre de todos los derbis.',
    chant: '¡La pasión minera y el derbi más caliente de Alemania!',
    intensity: 5, ratingBonus: 0.40, salaryBonus: 1.38, moraleWinBonus: 8, moraleLossBonus: -8
  },
  {
    home: 'Werder Bremen', away: 'Hamburgo SV',
    name: 'Nordderby',
    category: 'superclasico', country: 'Alemania',
    desc: 'Verdiblancos del Weser contra Dinosaurios de Hamburgo por el norte germano.',
    chant: '¡El orgullo hanseático y el gran clásico del norte!',
    intensity: 5, ratingBonus: 0.34, salaryBonus: 1.30, moraleWinBonus: 6, moraleLossBonus: -6
  },
  {
    home: 'Colonia', away: 'Borussia Monchengladbach',
    name: 'Rheinderby',
    category: 'derby_local', country: 'Alemania',
    desc: 'Los Machos Cabríos de Colonia contra los Potros de Gladbach a orillas del Rin.',
    chant: '¡Fervor renano en cada balón dividido!',
    intensity: 4, ratingBonus: 0.32, salaryBonus: 1.25, moraleWinBonus: 5, moraleLossBonus: -5
  },
  {
    home: 'Colonia', away: 'Bayer Leverkusen',
    name: 'Derbi Vecinal del Rin',
    category: 'derby_local', country: 'Alemania',
    desc: 'Colonia contra los Obreros de Leverkusen separados por pocos kilómetros.',
    chant: '¡Tradición popular contra el poderío del BayArena!',
    intensity: 4, ratingBonus: 0.30, salaryBonus: 1.25, moraleWinBonus: 5, moraleLossBonus: -4
  },
  {
    home: 'Union Berlin', away: 'Hertha Berlin',
    name: 'Berliner Stadtderby',
    category: 'derby_local', country: 'Alemania',
    desc: 'La vieja historia del Muro: An der Alten Försterei del este contra el Olympiastadion del oeste.',
    chant: '¡Eisern Union contra Die Alte Dame en la capital alemana!',
    intensity: 5, ratingBonus: 0.35, salaryBonus: 1.30, moraleWinBonus: 6, moraleLossBonus: -6
  },
  {
    home: 'Hamburgo SV', away: 'St. Pauli',
    name: 'Hamburger Stadtderby',
    category: 'derby_local', country: 'Alemania',
    desc: 'El histórico HSV del Volkspark contra los Piratas de Millerntor.',
    chant: '¡Choque de identidades y fuego en el puerto de Hamburgo!',
    intensity: 5, ratingBonus: 0.35, salaryBonus: 1.30, moraleWinBonus: 6, moraleLossBonus: -6
  },
  {
    home: 'Bayern Munich', away: 'VfB Stuttgart',
    name: 'Südderby',
    category: 'regional', country: 'Alemania',
    desc: 'Baviera contra Baden-Wurtemberg en el clásico del sur de Alemania.',
    chant: '¡Duelo de reyes del sur germano!',
    intensity: 4, ratingBonus: 0.30, salaryBonus: 1.25, moraleWinBonus: 5, moraleLossBonus: -4
  },
  {
    home: 'Hannover 96', away: 'Wolfsburgo',
    name: 'Niedersachsenderby',
    category: 'regional', country: 'Alemania',
    desc: 'Rivalidad de la Baja Sajonia entre la capital Hannover y los Lobos.',
    chant: '¡El trono de Baja Sajonia!',
    intensity: 3, ratingBonus: 0.25, salaryBonus: 1.20, moraleWinBonus: 4, moraleLossBonus: -3
  },
  {
    home: 'Eintracht Frankfurt', away: 'Mainz 05',
    name: 'Rhein-Main-Derby',
    category: 'regional', country: 'Alemania',
    desc: 'Águilas de Frankfurt contra los Carnavaleros de Maguncia.',
    chant: '¡La batalla de la región Rin-Meno!',
    intensity: 3, ratingBonus: 0.25, salaryBonus: 1.20, moraleWinBonus: 4, moraleLossBonus: -3
  },
  {
    home: 'Kaiserslautern', away: 'Karlsruher SC',
    name: 'Südwestderby',
    category: 'regional', country: 'Alemania',
    desc: 'Diablos Rojos del Fritz-Walter-Stadion contra los Badenses de Karlsruhe.',
    chant: '¡Ambiente ensordecedor en el suroeste alemán!',
    intensity: 4, ratingBonus: 0.28, salaryBonus: 1.22, moraleWinBonus: 5, moraleLossBonus: -4
  },

  // ═══════════════════════════════════════════════════════════════════
  // 🇫🇷 FRANCIA (Ligue 1 & Ligue 2)
  // ═══════════════════════════════════════════════════════════════════
  {
    home: 'Paris Saint-Germain', away: 'Marsella',
    name: 'Le Classique · Choc des Capitales',
    category: 'superclasico', country: 'Francia',
    desc: 'Parc des Princes contra el Stade Vélodrome: la mayor rivalidad del fútbol francés.',
    chant: '¡Ici c\'est Paris! vs ¡Droit au But! Pasión mediterránea contra poderío parisino.',
    intensity: 5, ratingBonus: 0.40, salaryBonus: 1.40, moraleWinBonus: 8, moraleLossBonus: -8
  },
  {
    home: 'Lyon', away: 'Saint-Etienne',
    name: 'Derby du Rhône · Derby des Gones',
    category: 'superclasico', country: 'Francia',
    desc: 'Los Leones del Groupama Stadium contra Les Verts de Geoffroy-Guichard.',
    chant: '¡Odio deportivo histórico a solo 60 kilómetros de distancia!',
    intensity: 5, ratingBonus: 0.38, salaryBonus: 1.35, moraleWinBonus: 7, moraleLossBonus: -7
  },
  {
    home: 'Marsella', away: 'Lyon',
    name: 'Choc des Olympiques',
    category: 'superclasico', country: 'Francia',
    desc: 'OM contra OL en un choque titánico por los títulos del sur y centro de Francia.',
    chant: '¡Duelo electrizante de dos gigantes franceses!',
    intensity: 4, ratingBonus: 0.32, salaryBonus: 1.30, moraleWinBonus: 6, moraleLossBonus: -5
  },
  {
    home: 'Niza', away: 'Monaco',
    name: 'Derby de la Côte d\'Azur',
    category: 'derby_local', country: 'Francia',
    desc: 'Las Águilas de Niza contra los del Principado de Mónaco en la Costa Azul.',
    chant: '¡El derbi más glamuroso del Mediterráneo!',
    intensity: 4, ratingBonus: 0.30, salaryBonus: 1.25, moraleWinBonus: 5, moraleLossBonus: -4
  },
  {
    home: 'Lille', away: 'Lens',
    name: 'Derby du Nord',
    category: 'superclasico', country: 'Francia',
    desc: 'Mastines de Lille contra Sang et Or de Lens en el norte minero de Francia.',
    chant: '¡El Stade Bollaert ruge en el derbi minero por excelencia!',
    intensity: 5, ratingBonus: 0.35, salaryBonus: 1.30, moraleWinBonus: 6, moraleLossBonus: -6
  },
  {
    home: 'Rennes', away: 'Nantes',
    name: 'Derby Breton / Derby de l\'Ouest',
    category: 'regional', country: 'Francia',
    desc: 'Rojinegros de Bretaña contra Canarios del Loira Atlántico.',
    chant: '¡La bandera de Bretaña y el orgullo del oeste!',
    intensity: 4, ratingBonus: 0.30, salaryBonus: 1.25, moraleWinBonus: 5, moraleLossBonus: -5
  },
  {
    home: 'Paris Saint-Germain', away: 'Paris FC',
    name: 'Derby de Paris',
    category: 'derby_local', country: 'Francia',
    desc: 'El gigante del Parque de los Príncipes contra el histórico Paris FC de Charléty.',
    chant: '¡El derbi que divide a la ciudad de la luz!',
    intensity: 4, ratingBonus: 0.30, salaryBonus: 1.25, moraleWinBonus: 5, moraleLossBonus: -4
  },
  {
    home: 'Estrasburgo', away: 'Metz',
    name: 'Derby de l\'Est · Alsace-Lorraine',
    category: 'regional', country: 'Francia',
    desc: 'Alsacia contra Lorena en una de las rivalidades con mayor carga territorial.',
    chant: '¡El clásico más tenso del este de Francia!',
    intensity: 4, ratingBonus: 0.28, salaryBonus: 1.22, moraleWinBonus: 5, moraleLossBonus: -5
  },
  {
    home: 'Girondins de Burdeos', away: 'Toulouse',
    name: 'Derby de la Garonne',
    category: 'regional', country: 'Francia',
    desc: 'Burdeos contra los Violets de Toulouse a orillas del río Garona.',
    chant: '¡El sudoeste francés en pie de fiesta futbolera!',
    intensity: 3, ratingBonus: 0.25, salaryBonus: 1.20, moraleWinBonus: 4, moraleLossBonus: -3
  },

  // ═══════════════════════════════════════════════════════════════════
  // 🇵🇹 PORTUGAL
  // ═══════════════════════════════════════════════════════════════════
  {
    home: 'Benfica', away: 'Porto',
    name: 'O Clássico dos Clássicos Portugueses',
    category: 'superclasico', country: 'Portugal',
    desc: 'Águias de Lisboa contra Dragões do Norte no Estádio do Dragão e da Luz.',
    chant: '¡Lisboa contra o Porto: a rivalidade que move o país inteiro!',
    intensity: 5, ratingBonus: 0.38, salaryBonus: 1.38, moraleWinBonus: 7, moraleLossBonus: -7
  },
  {
    home: 'Benfica', away: 'Sporting CP',
    name: 'Derby de Lisboa · Derby da Capital',
    category: 'superclasico', country: 'Portugal',
    desc: 'Águias Vermelhas da Luz contra Leões Verdes de Alvalade na Segunda Circular.',
    chant: '¡O Derby Eterno de Lisboa!',
    intensity: 5, ratingBonus: 0.38, salaryBonus: 1.38, moraleWinBonus: 7, moraleLossBonus: -7
  },
  {
    home: 'Sporting CP', away: 'Porto',
    name: 'Duelo dos Grandes Verde e Azul',
    category: 'superclasico', country: 'Portugal',
    desc: 'Leões contra Dragões em disputas ferozes de títulos e taças.',
    chant: '¡Confronto de gigantes com faíscas dentro e fora de campo!',
    intensity: 4, ratingBonus: 0.34, salaryBonus: 1.30, moraleWinBonus: 6, moraleLossBonus: -6
  },
  {
    home: 'Porto', away: 'Boavista',
    name: 'Derby da Invicta · Derby Portuense',
    category: 'derby_local', country: 'Portugal',
    desc: 'Dragões contra As Panteras de xadrez na cidade do Porto.',
    chant: '¡A cidade Invicta dividida em azul e axadrezado!',
    intensity: 4, ratingBonus: 0.30, salaryBonus: 1.25, moraleWinBonus: 5, moraleLossBonus: -4
  },
  {
    home: 'Braga', away: 'Vitoria de Guimaraes',
    name: 'Derby do Minho',
    category: 'superclasico', country: 'Portugal',
    desc: 'Guerreiros do Minho contra Os Conquistadores do berço da nação.',
    chant: '¡O clássico mais apaixonado e fervoroso do norte!',
    intensity: 5, ratingBonus: 0.35, salaryBonus: 1.30, moraleWinBonus: 6, moraleLossBonus: -6
  },

  // ═══════════════════════════════════════════════════════════════════
  // 🇳🇱 PAÍSES BAJOS (Eredivisie)
  // ═══════════════════════════════════════════════════════════════════
  {
    home: 'Ajax', away: 'Feyenoord',
    name: 'De Klassieker',
    category: 'superclasico', country: 'Paises Bajos',
    desc: 'Ámsterdam contra Róterdam: la escuela de artistas frente a los trabajadores del puerto.',
    chant: '¡De Kuip y el Johan Cruijff ArenA hierven de tensión máxima!',
    intensity: 5, ratingBonus: 0.40, salaryBonus: 1.40, moraleWinBonus: 8, moraleLossBonus: -8
  },
  {
    home: 'Ajax', away: 'PSV Eindhoven',
    name: 'De Topper',
    category: 'superclasico', country: 'Paises Bajos',
    desc: 'Los dos clubes más ganadores y dominantes del fútbol neerlandés contemporáneo.',
    chant: '¡El choque directo por el trofeo de la Eredivisie!',
    intensity: 5, ratingBonus: 0.35, salaryBonus: 1.35, moraleWinBonus: 6, moraleLossBonus: -6
  },
  {
    home: 'Feyenoord', away: 'PSV Eindhoven',
    name: 'De Kraker',
    category: 'superclasico', country: 'Paises Bajos',
    desc: 'Róterdam contra Eindhoven en un duelo de enorme prestigio e intensidad.',
    chant: '¡Batalla táctica y física de alto calibre!',
    intensity: 4, ratingBonus: 0.32, salaryBonus: 1.28, moraleWinBonus: 6, moraleLossBonus: -5
  },
  {
    home: 'Feyenoord', away: 'Sparta Rotterdam',
    name: 'Rotterdamse Derby',
    category: 'derby_local', country: 'Paises Bajos',
    desc: 'De Kuip contra Het Kasteel en la ciudad de Róterdam.',
    chant: '¡El derbi más antiguo de la ciudad!',
    intensity: 3, ratingBonus: 0.25, salaryBonus: 1.20, moraleWinBonus: 4, moraleLossBonus: -3
  },
  {
    home: 'Twente', away: 'Heracles',
    name: 'Twentse Derby',
    category: 'derby_local', country: 'Paises Bajos',
    desc: 'Los Tukkers de Enschede contra Heracles Almelo en la región de Twente.',
    chant: '¡La corona de la región de Twente!',
    intensity: 4, ratingBonus: 0.28, salaryBonus: 1.22, moraleWinBonus: 5, moraleLossBonus: -4
  },
  {
    home: 'Ajax', away: 'AZ Alkmaar',
    name: 'Noord-Holland Derby',
    category: 'regional', country: 'Paises Bajos',
    desc: 'Los Hijos de los Dioses de Ámsterdam contra los Granjeros de Queso de Alkmaar.',
    chant: '¡Supremacía en Holanda Septentrional!',
    intensity: 4, ratingBonus: 0.28, salaryBonus: 1.25, moraleWinBonus: 5, moraleLossBonus: -4
  },

  // ═══════════════════════════════════════════════════════════════════
  // 🇹🇷 TURQUÍA & 🇧🇪 BÉLGICA & 🏴 ESCOCIA & 🇬🇷 GRECIA
  // ═══════════════════════════════════════════════════════════════════
  {
    home: 'Galatasaray', away: 'Fenerbahce',
    name: 'Kıtalararası Derbi · Clásico Intercontinental',
    category: 'superclasico', country: 'Turquia',
    desc: 'Europa contra Asia divididos por el Bósforo en Estambul. Bengalas, decibelios y hostilidad extrema.',
    chant: '¡Welcome to Hell! ¡Uno de los ambientes más calientes de la tierra!',
    intensity: 5, ratingBonus: 0.40, salaryBonus: 1.40, moraleWinBonus: 8, moraleLossBonus: -8
  },
  {
    home: 'Besiktas', away: 'Galatasaray',
    name: 'Derby de Estambul Besiktas-Galatasaray',
    category: 'superclasico', country: 'Turquia',
    desc: 'Las Águilas Negras del Vodafone Park contra los Leones del RAMS Park.',
    chant: '¡Récord mundial de decibelios en el Bósforo!',
    intensity: 5, ratingBonus: 0.35, salaryBonus: 1.35, moraleWinBonus: 7, moraleLossBonus: -6
  },
  {
    home: 'Besiktas', away: 'Fenerbahce',
    name: 'Derby de Estambul Besiktas-Fenerbahce',
    category: 'superclasico', country: 'Turquia',
    desc: 'Águilas Negras contra Canarios Amarillos en una caldera turca.',
    chant: '¡Pasión desbordada en Estambul!',
    intensity: 5, ratingBonus: 0.35, salaryBonus: 1.35, moraleWinBonus: 7, moraleLossBonus: -6
  },
  {
    home: 'Trabzonspor', away: 'Galatasaray',
    name: 'Duelo del Mar Negro vs Capital',
    category: 'superclasico', country: 'Turquia',
    desc: 'La tormenta del Mar Negro de Trabzon contra el gigante de Estambul.',
    chant: '¡La rebeldía de Anatolia contra los tres grandes de Estambul!',
    intensity: 4, ratingBonus: 0.32, salaryBonus: 1.28, moraleWinBonus: 6, moraleLossBonus: -5
  },
  {
    home: 'Anderlecht', away: 'Standard de Lieja',
    name: 'Le Classique Belge / De Topper',
    category: 'superclasico', country: 'Belgica',
    desc: 'Mauves de Bruselas contra Rouches de Lieja.',
    chant: '¡La mayor rivalidad histórica de Bélgica!',
    intensity: 5, ratingBonus: 0.35, salaryBonus: 1.30, moraleWinBonus: 6, moraleLossBonus: -6
  },
  {
    home: 'Club Brujas', away: 'Anderlecht',
    name: 'Batalla de Flandes y Bruselas',
    category: 'superclasico', country: 'Belgica',
    desc: 'Blauw-Zwart del Jan Breydel contra los Malvas de Bruselas.',
    chant: '¡Duelo contemporáneo por el trono de la Pro League!',
    intensity: 5, ratingBonus: 0.35, salaryBonus: 1.32, moraleWinBonus: 6, moraleLossBonus: -6
  },
  {
    home: 'Club Brujas', away: 'Cercle Brugge',
    name: 'Brugse Derby',
    category: 'derby_local', country: 'Belgica',
    desc: 'Los dos clubes de la hermosa ciudad de Brujas que comparten estadio.',
    chant: '¡Brujas teñida de azul y verde!',
    intensity: 4, ratingBonus: 0.28, salaryBonus: 1.22, moraleWinBonus: 5, moraleLossBonus: -4
  },
  {
    home: 'Anderlecht', away: 'Union Saint-Gilloise',
    name: 'Derby de Bruselas · Derby Bruxellois',
    category: 'derby_local', country: 'Belgica',
    desc: 'El gigante tradicional contra el resurgido histórico de Saint-Gilles.',
    chant: '¡La corona de la capital europea!',
    intensity: 4, ratingBonus: 0.30, salaryBonus: 1.25, moraleWinBonus: 5, moraleLossBonus: -5
  },
  {
    home: 'Celtic', away: 'Rangers',
    name: 'The Old Firm Derby',
    category: 'superclasico', country: 'Escocia',
    desc: 'Celtic Park contra Ibrox Stadium en Glasgow. Historia, religión y más de 400 duelos legendarios.',
    chant: '¡You\'ll Never Walk Alone vs Follow Follow! El derbi más legendario del planeta.',
    intensity: 5, ratingBonus: 0.40, salaryBonus: 1.45, moraleWinBonus: 8, moraleLossBonus: -8
  },
  {
    home: 'Hearts', away: 'Hibernian',
    name: 'Edinburgh Derby',
    category: 'superclasico', country: 'Escocia',
    desc: 'Jambos de Tynecastle contra Hibees de Easter Road en la capital escocesa de Edimburgo.',
    chant: '¡La capital de Escocia partida en dos mitades!',
    intensity: 4, ratingBonus: 0.32, salaryBonus: 1.25, moraleWinBonus: 6, moraleLossBonus: -5
  },
  {
    home: 'Olympiacos', away: 'Panathinaikos',
    name: 'Derby de los Eternos Rivales · Duelo de Atenas',
    category: 'superclasico', country: 'Grecia',
    desc: 'El Pireo obrero frente a los aristócratas del centro de Atenas. Bengaleo y fervor mítico.',
    chant: '¡La madre de todas las batallas en el estadio Georgios Karaiskakis y Leoforos!',
    intensity: 5, ratingBonus: 0.40, salaryBonus: 1.40, moraleWinBonus: 8, moraleLossBonus: -8
  },
  {
    home: 'PAOK', away: 'Aris',
    name: 'Derby de Salónica / Derby de Macedonia',
    category: 'superclasico', country: 'Grecia',
    desc: 'El Águila bicéfala del Toumba Stadium contra el Dios de la Guerra en Salónica.',
    chant: '¡Toumba es una caldera humeante en Salónica!',
    intensity: 5, ratingBonus: 0.36, salaryBonus: 1.32, moraleWinBonus: 7, moraleLossBonus: -7
  },
  {
    home: 'AEK Atenas', away: 'Panathinaikos',
    name: 'Derbi Ateniense AEK-Panathinaikos',
    category: 'derby_local', country: 'Grecia',
    desc: 'Doble Águila de Nea Filadelfeia contra el Trébol Verde en la capital helena.',
    chant: '¡Atenas vibra al compás de la Superliga!',
    intensity: 4, ratingBonus: 0.32, salaryBonus: 1.28, moraleWinBonus: 6, moraleLossBonus: -5
  },

  // ═══════════════════════════════════════════════════════════════════
  // 🇨🇭 SUIZA & 🇦🇹 AUSTRIA
  // ═══════════════════════════════════════════════════════════════════
  {
    home: 'FC Basel', away: 'FC Zurich',
    name: 'Klassiker der Schweiz',
    category: 'superclasico', country: 'Suiza',
    desc: 'La capital cultural Basilea contra la metrópolis financiera Zúrich.',
    chant: '¡El clásico más caliente y prestigioso de Suiza!',
    intensity: 5, ratingBonus: 0.35, salaryBonus: 1.30, moraleWinBonus: 6, moraleLossBonus: -6
  },
  {
    home: 'FC Zurich', away: 'Grasshopper',
    name: 'Zürcher Derby',
    category: 'derby_local', country: 'Suiza',
    desc: 'El FCZ de la clase trabajadora contra los Saltamontes más laureados en el Letzigrund.',
    chant: '¡Zúrich dividida por su derbi centenario!',
    intensity: 4, ratingBonus: 0.30, salaryBonus: 1.25, moraleWinBonus: 5, moraleLossBonus: -5
  },
  {
    home: 'BSC Young Boys', away: 'FC Basel',
    name: 'Duelo por la Corona Suiza',
    category: 'superclasico', country: 'Suiza',
    desc: 'Young Boys de Berna contra el gigante renano de Basilea.',
    chant: '¡Duelo directo por la Champions League!',
    intensity: 4, ratingBonus: 0.32, salaryBonus: 1.28, moraleWinBonus: 6, moraleLossBonus: -5
  },
  {
    home: 'Rapid Viena', away: 'Austria Viena',
    name: 'Wiener Derby · Derby de Viena',
    category: 'superclasico', country: 'Austria',
    desc: 'El segundo derbi más disputado de toda Europa después del Old Firm. Grün-Weiß contra Veilchen.',
    chant: '¡La capital imperial austríaca dividida en verde y violeta!',
    intensity: 5, ratingBonus: 0.38, salaryBonus: 1.35, moraleWinBonus: 7, moraleLossBonus: -7
  },
  {
    home: 'Red Bull Salzburg', away: 'Rapid Viena',
    name: 'Österreichischer Klassiker',
    category: 'superclasico', country: 'Austria',
    desc: 'La potencia moderna de Salzburgo contra la tradición histórica vienesa.',
    chant: '¡Duelo de estilos y trono austríaco!',
    intensity: 4, ratingBonus: 0.32, salaryBonus: 1.30, moraleWinBonus: 6, moraleLossBonus: -5
  },
  {
    home: 'Sturm Graz', away: 'Red Bull Salzburg',
    name: 'Duelo de Gigantes de la Bundesliga Austríaca',
    category: 'superclasico', country: 'Austria',
    desc: 'Los Blackies de Graz contra los Toros Rojos en duelos de máxima tensión por el título.',
    chant: '¡Graz desafiando al gigante de Salzburgo!',
    intensity: 4, ratingBonus: 0.32, salaryBonus: 1.30, moraleWinBonus: 6, moraleLossBonus: -5
  },

  // ═══════════════════════════════════════════════════════════════════
  // 🇸🇦 ARABIA SAUDITA & 🇯🇵 JAPÓN
  // ═══════════════════════════════════════════════════════════════════
  {
    home: 'Al-Hilal', away: 'Al-Nassr',
    name: 'Riyadh Derby · Clásico de la Capital Saudí',
    category: 'superclasico', country: 'Arabia Saudita',
    desc: 'Los dos gigantes de Riyadh con planteles repletos de estrellas mundiales frente a frente.',
    chant: '¡El Kingdom Arena y el Al-Awwal Park rugen con el derbi árabe más seguido!',
    intensity: 5, ratingBonus: 0.38, salaryBonus: 1.40, moraleWinBonus: 7, moraleLossBonus: -7
  },
  {
    home: 'Al-Ittihad', away: 'Al-Ahli',
    name: 'Jeddah Derby · Derbi de Yeda',
    category: 'superclasico', country: 'Arabia Saudita',
    desc: 'Los Tigres del Rey Abdullah Sports City contra Al-Ahli en la costa del Mar Rojo.',
    chant: '¡La fiesta de bengalas y mosaicos más impactante de Asia!',
    intensity: 5, ratingBonus: 0.36, salaryBonus: 1.35, moraleWinBonus: 7, moraleLossBonus: -6
  },
  {
    home: 'Al-Hilal', away: 'Al-Ittihad',
    name: 'Saudi El Clásico',
    category: 'superclasico', country: 'Arabia Saudita',
    desc: 'Riyadh contra Jeddah: el club más laureado contra el club más antiguo del país.',
    chant: '¡El choque histórico del fútbol árabe!',
    intensity: 5, ratingBonus: 0.36, salaryBonus: 1.35, moraleWinBonus: 6, moraleLossBonus: -6
  },
  {
    home: 'Gamba Osaka', away: 'Cerezo Osaka',
    name: 'Osaka Derby',
    category: 'superclasico', country: 'Japon',
    desc: 'El Panasonic Stadium Suita contra el Yodoko Sakura Stadium en Osaka.',
    chant: '¡Azul y negro contra Rosa cerezo en la ciudad de Osaka!',
    intensity: 5, ratingBonus: 0.35, salaryBonus: 1.30, moraleWinBonus: 6, moraleLossBonus: -6
  },
  {
    home: 'Yokohama F. Marinos', away: 'Kawasaki Frontale',
    name: 'Kanagawa Derby',
    category: 'superclasico', country: 'Japon',
    desc: 'El clásico de la prefectura de Kanagawa entre dos múltiples campeones de la J1 League.',
    chant: '¡Fútbol de toque y dinamismo en Kanagawa!',
    intensity: 4, ratingBonus: 0.32, salaryBonus: 1.25, moraleWinBonus: 5, moraleLossBonus: -5
  },
  {
    home: 'Urawa Red Diamonds', away: 'Gamba Osaka',
    name: 'Duelo Nacional Japonés Rojo vs Negro',
    category: 'superclasico', country: 'Japon',
    desc: 'La afición más multitudinaria y ruidosa de Asia en Saitama contra Gamba.',
    chant: '¡El Saitama Stadium 2002 canta con fervor inigualable!',
    intensity: 4, ratingBonus: 0.32, salaryBonus: 1.28, moraleWinBonus: 6, moraleLossBonus: -5
  },
  {
    home: 'FC Tokyo', away: 'Kawasaki Frontale',
    name: 'Tamagawa Clásico',
    category: 'derby_local', country: 'Japon',
    desc: 'El derbi del río Tama entre Tokio y Kawasaki.',
    chant: '¡La batalla del río Tama!',
    intensity: 4, ratingBonus: 0.30, salaryBonus: 1.22, moraleWinBonus: 5, moraleLossBonus: -4
  },
  {
    home: 'Vissel Kobe', away: 'Gamba Osaka',
    name: 'Kansai Derby',
    category: 'regional', country: 'Japon',
    desc: 'Kobe contra Osaka en la rica región de Kansai.',
    chant: '¡La supremacía futbolística de Kansai!',
    intensity: 4, ratingBonus: 0.30, salaryBonus: 1.25, moraleWinBonus: 5, moraleLossBonus: -4
  },

  // ═══════════════════════════════════════════════════════════════════
  // 🌍 SELECCIONES NACIONALES (Mundiales & Copas Continentales)
  // ═══════════════════════════════════════════════════════════════════
  {
    home: 'Argentina', away: 'Brasil',
    name: 'Superclásico Sudamericano · Clássico das Américas',
    category: 'internacional', country: 'CONMEBOL',
    desc: 'La mayor rivalidad de selecciones del planeta. 8 Copas del Mundo en la cancha.',
    chant: '¡Brasil, decime qué se siente vs Sou Brasileiro com muito orgulho!',
    intensity: 5, ratingBonus: 0.40, salaryBonus: 1.50, moraleWinBonus: 9, moraleLossBonus: -9
  },
  {
    home: 'Argentina', away: 'Uruguay',
    name: 'Clásico del Río de la Plata',
    category: 'internacional', country: 'CONMEBOL',
    desc: 'El partido internacional más disputado en la historia del fútbol (desde 1902).',
    chant: '¡Doble orilla rioplatense y garra charrúa pura!',
    intensity: 5, ratingBonus: 0.38, salaryBonus: 1.40, moraleWinBonus: 8, moraleLossBonus: -8
  },
  {
    home: 'Chile', away: 'Peru',
    name: 'Clásico del Pacífico',
    category: 'internacional', country: 'CONMEBOL',
    desc: 'Rivalidad histórica, deportiva y cultural de máxima temperatura en el Pacífico sur.',
    chant: '¡Por la razón o la fuerza vs ¡Arriba Perú carajo!',
    intensity: 5, ratingBonus: 0.38, salaryBonus: 1.40, moraleWinBonus: 8, moraleLossBonus: -8
  },
  {
    home: 'Chile', away: 'Argentina',
    name: 'Clásico Trasandino',
    category: 'internacional', country: 'CONMEBOL',
    desc: 'La Cordillera de los Andes como testigo de finales épicas de Copa América.',
    chant: '¡Chi-chi-chi, le-le-le contra la celeste y blanca!',
    intensity: 5, ratingBonus: 0.36, salaryBonus: 1.35, moraleWinBonus: 7, moraleLossBonus: -7
  },
  {
    home: 'Colombia', away: 'Venezuela',
    name: 'Clásico de la Frontera Andina',
    category: 'internacional', country: 'CONMEBOL',
    desc: 'Los Cafeteros contra la Vinotinto en partidos de alta fricción y orgullo patrio.',
    chant: '¡Hermanos en la historia, rivales en la cancha!',
    intensity: 4, ratingBonus: 0.32, salaryBonus: 1.30, moraleWinBonus: 6, moraleLossBonus: -6
  },
  {
    home: 'Colombia', away: 'Ecuador',
    name: 'Clásico del Café y la Mitad del Mundo',
    category: 'internacional', country: 'CONMEBOL',
    desc: 'Duelo vibrante entre dos potencias emergentes del norte de Sudamérica.',
    chant: '¡Velocidad, técnica y choque físico total!',
    intensity: 4, ratingBonus: 0.30, salaryBonus: 1.25, moraleWinBonus: 5, moraleLossBonus: -5
  },
  {
    home: 'Mexico', away: 'Estados Unidos',
    name: 'Clásico de la CONCACAF · Dos a Cero Rivalry',
    category: 'internacional', country: 'CONCACAF',
    desc: 'El Tri contra el Team USA por el dominio absoluto del fútbol norteamericano.',
    chant: '¡Cielito Lindo vs I believe that we will win!',
    intensity: 5, ratingBonus: 0.40, salaryBonus: 1.40, moraleWinBonus: 8, moraleLossBonus: -8
  },
  {
    home: 'Espana', away: 'Portugal',
    name: 'Clásico Ibérico',
    category: 'internacional', country: 'UEFA',
    desc: 'La Roja de España contra la Seleção das Quinas de Portugal por la península ibérica.',
    chant: '¡La batalla de los vecinos ibéricos!',
    intensity: 5, ratingBonus: 0.36, salaryBonus: 1.35, moraleWinBonus: 7, moraleLossBonus: -6
  },
  {
    home: 'Inglaterra', away: 'Alemania',
    name: 'Rivalidad Anglogermana · The Historic Duel',
    category: 'internacional', country: 'UEFA',
    desc: 'Final de 1966, tandas de penales de infarto y cuentas pendientes en Mundiales y Eurocopas.',
    chant: '¡Football is a simple game: 22 men chase a ball for 90 minutes and at the end, the Germans always win!',
    intensity: 5, ratingBonus: 0.40, salaryBonus: 1.45, moraleWinBonus: 8, moraleLossBonus: -8
  },
  {
    home: 'Inglaterra', away: 'Escocia',
    name: 'The Oldest International Rivalry',
    category: 'internacional', country: 'UEFA',
    desc: 'El primer partido internacional oficial de la historia (30 de noviembre de 1872).',
    chant: '¡Three Lions contra The Tartan Army!',
    intensity: 5, ratingBonus: 0.38, salaryBonus: 1.35, moraleWinBonus: 7, moraleLossBonus: -7
  },
  {
    home: 'Francia', away: 'Italia',
    name: 'Derbi Alpino · Duelo Mediterráneo',
    category: 'internacional', country: 'UEFA',
    desc: 'Les Bleus contra la Azzurra: finales de Eurocopa 2000, Mundial 2006 y tensión mítica.',
    chant: '¡Allez les Bleus vs Forza Azzurri!',
    intensity: 5, ratingBonus: 0.38, salaryBonus: 1.40, moraleWinBonus: 7, moraleLossBonus: -7
  },
  {
    home: 'Paises Bajos', away: 'Alemania',
    name: 'De Moeder aller Wedstrijden',
    category: 'internacional', country: 'UEFA',
    desc: 'La Naranja Mecánica contra Die Mannschaft desde la final de la Copa del Mundo 1974.',
    chant: '¡Oranje contra Schwarz-Rot-Gold!',
    intensity: 5, ratingBonus: 0.38, salaryBonus: 1.38, moraleWinBonus: 7, moraleLossBonus: -7
  },
  {
    home: 'Belgica', away: 'Paises Bajos',
    name: 'Derby der Lage Landen · Derby de los Países Bajos',
    category: 'internacional', country: 'UEFA',
    desc: 'Los Diablos Rojos contra los Oranje en el clásico flamenco-valón.',
    chant: '¡El orgullo de los Países Bajos!',
    intensity: 4, ratingBonus: 0.34, salaryBonus: 1.30, moraleWinBonus: 6, moraleLossBonus: -5
  },
  {
    home: 'Francia', away: 'Alemania',
    name: 'Choc des Titans Européens',
    category: 'internacional', country: 'UEFA',
    desc: 'El duelo del Rin: dos campeones del mundo con enorme jerarquía táctica.',
    chant: '¡La élite absoluta del fútbol europeo!',
    intensity: 5, ratingBonus: 0.36, salaryBonus: 1.35, moraleWinBonus: 7, moraleLossBonus: -6
  },
  {
    home: 'Espana', away: 'Italia',
    name: 'El Gran Clásico del Mediterráneo',
    category: 'internacional', country: 'UEFA',
    desc: 'Tiki-taka contra Catenaccio y finales memorables de la Eurocopa.',
    chant: '¡La pasión del sur de Europa!',
    intensity: 5, ratingBonus: 0.36, salaryBonus: 1.35, moraleWinBonus: 7, moraleLossBonus: -6
  },
  {
    home: 'Arabia Saudita', away: 'Japon',
    name: 'Clásico de las Potencias Asiáticas',
    category: 'internacional', country: 'AFC',
    desc: 'Los Halcones Verdes de Riyadh contra los Samuráis Azules de Tokio.',
    chant: '¡El trono supremo de la Copa Asiática y Eliminatorias!',
    intensity: 4, ratingBonus: 0.32, salaryBonus: 1.28, moraleWinBonus: 6, moraleLossBonus: -5
  }
];

module.exports = {
  EXPLICIT_CLASSICS
};
