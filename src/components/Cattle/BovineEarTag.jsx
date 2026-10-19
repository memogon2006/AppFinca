import React from 'react';

/**
 * BovineEarTag: Representación visual zootécnica de una chapeta / arete ganadero oficial.
 * Dibuja la silueta exacta de un arete (cuello superior con ojal de inserción, hombros angulados
 * y paleta ancha inferior donde va troquelado el número de identificación).
 * 
 * @param {string} tagNumber - Número de chapeta / arete (ej: '01-6', '45', 'TEMP-02')
 * @param {string} size - 'xs' | 'sm' | 'md' | 'lg'
 * @param {string} color - 'auto' | 'yellow' | 'green' | 'blue' | 'orange' | 'white' | 'red'
 * @param {boolean} isTemporary - Si es arete provisional / cría sin marcar
 * @param {boolean} isBornInFarm - Si nació en la finca
 * @param {boolean} isCompany - Si es ganado en compañía
 * @param {string} status - 'Activo' | 'Vendido' | 'Muerto'
 * @param {string} className - Clases CSS adicionales
 */
export function BovineEarTag({
  tagNumber = '---',
  size = 'md',
  color = 'auto',
  isTemporary = false,
  isBornInFarm = false,
  isCompany = false,
  status = 'Activo',
  className = ''
}) {
  // Paletas de color según tipo de arete
  const PALETTES = {
    yellow: {
      from: '#fef08a',
      to: '#eab308',
      stroke: '#ca8a04',
      text: '#0f172a',
      hole: '#a16207'
    },
    green: {
      from: '#86efac',
      to: '#22c55e',
      stroke: '#16a34a',
      text: '#022c22',
      hole: '#15803d'
    },
    blue: {
      from: '#7dd3fc',
      to: '#0284c7',
      stroke: '#0369a1',
      text: '#082f49',
      hole: '#075985'
    },
    orange: {
      from: '#fed7aa',
      to: '#f97316',
      stroke: '#ea580c',
      text: '#431407',
      hole: '#c2410c'
    },
    white: {
      from: '#ffffff',
      to: '#e2e8f0',
      stroke: '#94a3b8',
      text: '#0f172a',
      hole: '#64748b'
    },
    red: {
      from: '#fecdd3',
      to: '#f43f5e',
      stroke: '#e11d48',
      text: '#4c0519',
      hole: '#be123c'
    },
    dead: {
      from: '#f1f5f9',
      to: '#cbd5e1',
      stroke: '#94a3b8',
      text: '#475569',
      hole: '#64748b'
    },
    sold: {
      from: '#fef3c7',
      to: '#fde68a',
      stroke: '#d97706',
      text: '#78350f',
      hole: '#b45309'
    }
  };

  // Determinar paleta activa
  let activePalette = PALETTES.yellow;

  if (color && color !== 'auto' && PALETTES[color]) {
    activePalette = PALETTES[color];
  } else if (status === 'Muerto') {
    activePalette = PALETTES.dead;
  } else if (status === 'Vendido') {
    activePalette = PALETTES.sold;
  } else if (isTemporary) {
    activePalette = PALETTES.yellow;
  } else if (isBornInFarm) {
    activePalette = PALETTES.green;
  } else if (isCompany) {
    activePalette = PALETTES.blue;
  }

  // Dimensiones del SVG según tamaño solicitado
  const SIZES = {
    xs: { width: 28, height: 34 },
    sm: { width: 36, height: 44 },
    md: { width: 48, height: 58 },
    lg: { width: 66, height: 80 }
  };

  const dim = SIZES[size] || SIZES.md;
  const tagStr = String(tagNumber ?? '---').trim();
  const len = tagStr.length;

  // Cálculo dinámico de tamaño de tipografía para evitar desbordamientos
  let fontSize = 28;
  if (len <= 2) fontSize = 32;
  else if (len <= 4) fontSize = 27;
  else if (len <= 6) fontSize = 22;
  else if (len <= 8) fontSize = 18;
  else fontSize = 14;

  // Trazo de la silueta real de la chapeta:
  // Cuello superior redondeado (x: 36 a 64, y: 2 a 20),
  // hombros que descienden en curva (hasta x: 98, y: 60),
  // cuerpo ancho (y: 60 a 108), esquinas redondeadas inferiores y base recta.
  const pathData = 'M 36 6 C 36 3 40 2 50 2 C 60 2 64 3 64 6 L 64 20 C 64 26 86 36 94 44 C 97 48 98 54 98 60 L 98 108 C 98 116 92 120 84 120 L 16 120 C 8 120 2 116 2 108 L 2 60 C 2 54 3 48 6 44 C 14 36 36 26 36 20 Z';

  const gradId = `ear-tag-grad-${activePalette.stroke.replace('#', '')}`;

  return (
    <div 
      className={`inline-flex shrink-0 items-center justify-center select-none transition-transform group-hover:scale-105 ${className}`}
      title={`Chapeta Ganadera Oficial: #${tagStr}`}
      style={{ width: `${dim.width}px`, height: `${dim.height}px` }}
    >
      <svg 
        viewBox="0 0 100 120" 
        width={dim.width} 
        height={dim.height} 
        className="overflow-visible drop-shadow-xs"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={activePalette.from} />
            <stop offset="100%" stopColor={activePalette.to} />
          </linearGradient>
        </defs>

        {/* Silueta del Arete Ganadero */}
        <path
          d={pathData}
          fill={`url(#${gradId})`}
          stroke={activePalette.stroke}
          strokeWidth="2.5"
          strokeDasharray={isTemporary ? '5 3' : undefined}
          strokeLinejoin="round"
        />

        {/* Ojal / Agujero de fijación superior con remache */}
        <circle 
          cx="50" 
          cy="11" 
          r="4.2" 
          fill={activePalette.hole} 
          opacity="0.35" 
        />
        <circle 
          cx="50" 
          cy="11" 
          r="2.2" 
          fill="#ffffff" 
          opacity="0.6" 
        />

        {/* Indicador superior si es temporal */}
        {isTemporary && (
          <text
            x="50"
            y="36"
            textAnchor="middle"
            fontSize="8"
            fontWeight="900"
            fill={activePalette.text}
            opacity="0.75"
            letterSpacing="0.5"
          >
            TEMP
          </text>
        )}

        {/* Número troquelado de la chapeta */}
        <text
          x="50"
          y={isTemporary ? 86 : 82}
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
          fontWeight="900"
          fontSize={fontSize}
          fill={activePalette.text}
          letterSpacing="-0.5"
          {...(len > 5 ? { textLength: '80', lengthAdjust: 'spacingAndGlyphs' } : {})}
        >
          {tagStr}
        </text>
      </svg>
    </div>
  );
}
