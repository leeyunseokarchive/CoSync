import React from 'react';

interface ScenarioIllustrationProps {
  questionId: string;
  className?: string;
}

export function ScenarioIllustration({ questionId, className = "" }: ScenarioIllustrationProps) {
  // Theme colors
  const primary = "#4F46E5";
  const secondary = "#E0E7FF";
  const highlight = "#F59E0B";
  const danger = "#EF4444";
  const success = "#10B981";
  const neutral = "#9CA3AF";
  const textDark = "#1F2937";
  const bg = "#F9FAFB";
  
  const baseClass = `scenario-illustration ${className}`;
  const svgProps = {
    viewBox: "0 0 400 240",
    className: "w-full h-auto",
    style: { width: '100%', height: 'auto' },
    xmlns: "http://www.w3.org/2000/svg"
  };

  const Person = ({ cx, cy, color, flip = false }: { cx: number | string, cy: number | string, color: string, flip?: boolean }) => (
    <g transform={`translate(${cx}, ${cy}) scale(${flip ? -1 : 1}, 1)`}>
      <circle cx="0" cy="-25" r="18" fill={color} />
      <path d="M -22,10 C -22,-18 22,-18 22,10 L 30,60 H -30 Z" fill={color} />
    </g>
  );

  switch (questionId) {
    // 1. Decision
    case "decisionStructure":
      return (
        <svg {...svgProps}>
          <rect x="80" y="50" width="160" height="110" rx="8" fill="white" stroke={neutral} strokeWidth="3" />
          <path d="M140 160 v30 m-30 0 h60" stroke={neutral} strokeWidth="4" strokeLinecap="round" />
          <path d="M100 130 l30 -20 l20 10 l40 -40 l20 50" fill="none" stroke={danger} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <Person cx="300" cy="180" color={primary} />
          <circle cx="270" cy="120" r="8" fill={primary} />
          <path d="M 300 80 Q 280 40 320 40 Q 360 40 340 80 Q 350 110 320 110 Q 300 110 300 80 Z" fill={secondary} />
          <text x="320" y="85" fontSize="24" fill={primary} fontWeight="bold" textAnchor="middle">?</text>
        </svg>
      );
    case "decisionFailure":
      return (
        <svg {...svgProps}>
          <rect x="140" y="10" width="120" height="150" rx="6" fill="white" stroke={danger} strokeWidth="3" />
          <text x="200" y="80" fontSize="60" fill={danger} fontWeight="bold" textAnchor="middle">0</text>
          <rect x="160" y="100" width="80" height="6" rx="3" fill={neutral} />
          <rect x="160" y="120" width="50" height="6" rx="3" fill={neutral} />
          <Person cx="200" cy="180" color={primary} />
          <circle cx="160" cy="140" r="10" fill={primary} />
          <circle cx="240" cy="140" r="10" fill={primary} />
        </svg>
      );
    case "actionVsConsensus":
      return (
        <svg {...svgProps}>
          <Person cx="200" cy="180" color={primary} />
          <circle cx="130" cy="110" r="30" fill={secondary} />
          <path d="M 120 100 l 20 -10 v 40 l -20 -10 h -10 v -20 z" fill={primary} />
          <path d="M 145 105 q 5 5 0 10" fill="none" stroke={primary} strokeWidth="2" strokeLinecap="round" />
          <path d="M 150 100 q 10 10 0 20" fill="none" stroke={primary} strokeWidth="2" strokeLinecap="round" />
          <circle cx="270" cy="110" r="30" fill="#FEE2E2" />
          <path d="M 260 100 l 20 20 m 0 -20 l -20 20" fill="none" stroke={danger} strokeWidth="6" strokeLinecap="round" />
        </svg>
      );
    case "deadlockTolerance":
      return (
        <svg {...svgProps}>
          <path d="M 200 240 v -80 l -80 -60 m 80 60 l 80 -60" fill="none" stroke="#E5E7EB" strokeWidth="30" strokeLinecap="round" />
          <circle cx="120" cy="80" r="25" fill="#FEF3C7" />
          <path d="M 120 65 v 15 l 10 10" fill="none" stroke={highlight} strokeWidth="4" strokeLinecap="round" />
          <circle cx="280" cy="80" r="25" fill="#D1FAE5" />
          <path d="M 270 80 l 5 5 l 15 -15" fill="none" stroke={success} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <Person cx="200" cy="180" color={primary} />
          <text x="200" y="120" fontSize="24" fill={textDark} fontWeight="bold" textAnchor="middle">?</text>
        </svg>
      );

    // 2. Role
    case "extraWorkPriority":
      return (
        <svg {...svgProps}>
          <Person cx="200" cy="180" color={primary} />
          <path d="M 170 130 q 30 -20 60 0" fill="none" stroke="#9CA3AF" strokeWidth="2" />
          <circle cx="170" cy="120" r="4" fill="#60A5FA" />
          <g fill="white" stroke={neutral} strokeWidth="2">
            <path d="M 60 80 h 50 v 40 h -20 l -10 10 v -10 h -20 z" />
            <path d="M 150 40 h 50 v 40 h -20 l -10 10 v -10 h -20 z" />
            <path d="M 240 50 h 50 v 40 h -20 l -10 10 v -10 h -20 z" />
            <path d="M 310 110 h 50 v 40 h -20 l -10 10 v -10 h -20 z" />
          </g>
          <text x="85" y="105" fontSize="16" fill={danger} fontWeight="bold" textAnchor="middle">?</text>
          <text x="175" y="65" fontSize="16" fill={danger} fontWeight="bold" textAnchor="middle">?</text>
          <text x="265" y="75" fontSize="16" fill={danger} fontWeight="bold" textAnchor="middle">?</text>
          <text x="335" y="135" fontSize="16" fill={danger} fontWeight="bold" textAnchor="middle">?</text>
        </svg>
      );
    case "extraWorkPrinciple":
      return (
        <svg {...svgProps}>
          <rect x="0" y="0" width="400" height="240" fill="#1E1B4B" rx="12" />
          <circle cx="320" cy="40" r="25" fill="#FDE047" />
          <circle cx="310" cy="30" r="25" fill="#1E1B4B" />
          <Person cx="160" cy="180" color="#818CF8" />
          <rect x="200" y="60" width="120" height="80" rx="8" fill="white" />
          <rect x="210" y="70" width="20" height="20" rx="4" fill={primary} />
          <rect x="240" y="75" width="60" height="4" rx="2" fill={neutral} />
          <rect x="240" y="85" width="40" height="4" rx="2" fill={neutral} />
          <text x="220" y="85" fontSize="14" fill="white" fontWeight="bold" textAnchor="middle">!</text>
          <rect x="210" y="105" width="100" height="6" rx="3" fill="#D1D5DB" />
          <rect x="210" y="115" width="80" height="6" rx="3" fill="#D1D5DB" />
        </svg>
      );
    case "underperformanceAction":
      return (
        <svg {...svgProps}>
          <Person cx="120" cy="180" color={primary} />
          <circle cx="160" cy="130" r="8" fill={primary} />
          <path d="M 160 130 l 30 -20" fill="none" stroke={primary} strokeWidth="4" strokeLinecap="round" />
          <rect x="200" y="40" width="140" height="140" rx="8" fill="white" stroke={neutral} strokeWidth="3" />
          <rect x="200" y="40" width="140" height="35" fill={danger} />
          <circle cx="230" cy="40" r="4" fill="white" />
          <circle cx="310" cy="40" r="4" fill="white" />
          <rect x="220" y="90" width="40" height="20" rx="4" fill="#FEE2E2" />
          <text x="240" y="105" fontSize="10" fill={danger} fontWeight="bold" textAnchor="middle">DELAY</text>
          <rect x="270" y="120" width="40" height="20" rx="4" fill="#FEE2E2" />
          <text x="290" y="135" fontSize="10" fill={danger} fontWeight="bold" textAnchor="middle">DELAY</text>
          <rect x="220" y="150" width="40" height="20" rx="4" fill="#FEE2E2" />
          <text x="240" y="165" fontSize="10" fill={danger} fontWeight="bold" textAnchor="middle">DELAY</text>
        </svg>
      );
    case "workstyleConstraint":
      return (
        <svg {...svgProps}>
          <Person cx="140" cy="180" color={primary} />
          <circle cx="140" cy="70" r="30" fill="white" stroke={neutral} strokeWidth="4" />
          <path d="M 140 50 v 20 l 15 10" fill="none" stroke={danger} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 140 40 A 30 30 0 0 1 170 70" fill="none" stroke={danger} strokeWidth="4" />
          <Person cx="280" cy="180" color={neutral} flip={true} />
          <g opacity="0.8">
            <path d="M 250 120 l 60 60 m 0 -60 l -60 60" stroke="white" strokeWidth="12" strokeLinecap="round" />
            <path d="M 250 120 l 60 60 m 0 -60 l -60 60" stroke={danger} strokeWidth="6" strokeLinecap="round" />
          </g>
          <text x="280" y="80" fontSize="24" fill={danger} fontWeight="bold" textAnchor="middle">부재중</text>
        </svg>
      );

    // 3. Exit
    case "handoverMethod":
      return (
        <svg {...svgProps}>
          <Person cx="100" cy="180" color={primary} />
          <Person cx="300" cy="180" color={neutral} flip={true} />
          <g fill="white" stroke={neutral} strokeWidth="2">
            <rect x="150" y="80" width="40" height="50" rx="2" transform="rotate(-15 170 105)" />
            <rect x="170" y="60" width="40" height="50" rx="2" transform="rotate(10 190 85)" />
            <rect x="190" y="90" width="40" height="50" rx="2" transform="rotate(-5 210 115)" />
            <rect x="210" y="70" width="40" height="50" rx="2" transform="rotate(20 230 95)" />
          </g>
          <path d="M 80 120 q 10 -15 20 0 q 0 10 -10 10 q -10 0 -10 -10 z" fill="#60A5FA" />
        </svg>
      );
    case "exitRecoveryPriority":
      return (
        <svg {...svgProps}>
          <rect x="220" y="60" width="100" height="120" rx="8" fill="white" stroke={neutral} strokeWidth="4" />
          <rect x="240" y="80" width="60" height="10" rx="2" fill={secondary} />
          <rect x="240" y="110" width="60" height="10" rx="2" fill={secondary} />
          <rect x="240" y="140" width="60" height="10" rx="2" fill={secondary} />
          <Person cx="140" cy="180" color={primary} />
          <g transform="translate(120, 190) rotate(-15)">
            <path d="M 30 0 h 50 v 10 h -10 v 10 h -10 v -10 h -30 z" fill={highlight} />
            <circle cx="20" cy="5" r="15" fill="none" stroke={highlight} strokeWidth="8" />
          </g>
        </svg>
      );
    case "exitCleanupTiming":
      return (
        <svg {...svgProps}>
          <Person cx="320" cy="180" color={neutral} flip={true} />
          <g transform="translate(290, 185)">
            <rect x="0" y="0" width="40" height="30" fill="#D1D5DB" />
            <path d="M 0 0 l 8 -8 h 40 l -8 8 z" fill="#E5E7EB" />
            <path d="M 40 0 l 8 -8 v 30 l -8 8 z" fill="#9CA3AF" />
          </g>
          <Person cx="120" cy="180" color={primary} />
          <g transform="translate(130, 180)">
            <rect x="0" y="0" width="30" height="20" rx="4" fill={danger} />
            <path d="M 6 0 v -6 a 9 9 0 0 1 18 0 v 6" fill="none" stroke={danger} strokeWidth="4" />
            <circle cx="15" cy="10" r="3" fill="white" />
          </g>
        </svg>
      );
    case "exitDisputeResolution":
      // 20% slice = 72 degrees. cx=200, cy=120, r=50.
      return (
        <svg {...svgProps}>
          <Person cx="100" cy="180" color={primary} />
          <Person cx="300" cy="180" color={highlight} flip={true} />
          <g clipPath="url(#pieClipDispute)">
            <circle cx="200" cy="120" r="50" fill={primary} />
            <path d="M 200 120 L 200 70 A 50 50 0 0 1 247.55 104.55 Z" fill={highlight} />
            <path d="M 200 70 L 200 120 L 247.55 104.55" fill="none" stroke={bg} strokeWidth="6" strokeLinejoin="round" />
          </g>
          <defs>
            <clipPath id="pieClipDispute">
              <circle cx="200" cy="120" r="50" />
            </clipPath>
          </defs>
          <path d="M 120 80 l 10 10 m 0 -10 l -10 10" stroke={danger} strokeWidth="3" strokeLinecap="round" />
          <path d="M 280 80 l -10 10 m 0 -10 l 10 10" stroke={danger} strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    // 4. Vision
    case "exitVision":
      return (
        <svg {...svgProps}>
          <Person cx="200" cy="180" color={primary} />
          <g transform="translate(130, 80)">
             <rect x="-30" y="-20" width="60" height="40" rx="6" fill="white" stroke={neutral} strokeWidth="2" />
             <text x="0" y="5" fontSize="14" fill={textDark} fontWeight="bold" textAnchor="middle">IPO</text>
          </g>
          <g transform="translate(200, 60)">
             <rect x="-30" y="-20" width="60" height="40" rx="6" fill={primary} />
             <text x="0" y="5" fontSize="14" fill="white" fontWeight="bold" textAnchor="middle">M&A</text>
          </g>
          <g transform="translate(270, 80)">
             <rect x="-30" y="-20" width="60" height="40" rx="6" fill="white" stroke={neutral} strokeWidth="2" />
             <text x="0" y="5" fontSize="14" fill={textDark} fontWeight="bold" textAnchor="middle">독립</text>
          </g>
        </svg>
      );
    case "pivotCriteria":
      return (
        <svg {...svgProps}>
          <Person cx="140" cy="180" color={primary} />
          <g transform="translate(230, 120)">
            <path d="M 0 40 L 0 -20 A 30 30 0 0 1 60 -20 L 60 20" fill="none" stroke={danger} strokeWidth="12" strokeLinecap="round" />
            <path d="M 45 5 l 15 15 l 15 -15" fill="none" stroke={danger} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </svg>
      );
    case "conflictResolution":
      return (
        <svg {...svgProps}>
          <Person cx="120" cy="180" color={primary} />
          <Person cx="280" cy="180" color={highlight} flip={true} />
          <g transform="translate(200, 100)">
            <circle cx="0" cy="0" r="35" fill={danger} opacity="0.1" />
            <path d="M 5 -15 L -5 2 L 6 2 L -5 18" fill="none" stroke={danger} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M -40 0 L -15 0 M -25 -10 L -15 0 L -25 10" fill="none" stroke={primary} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 40 0 L 15 0 M 25 -10 L 15 0 L 25 10" fill="none" stroke={highlight} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </svg>
      );
    case "dealbreaker":
      return (
        <svg {...svgProps}>
          <Person cx="140" cy="180" color={primary} />
          <g transform="translate(240, 120)">
            <circle cx="0" cy="0" r="30" fill={danger} opacity="0.2" />
            <path d="M -10 -10 L 10 10 M 10 -10 L -10 10" fill="none" stroke={danger} strokeWidth="6" strokeLinecap="round" />
          </g>
        </svg>
      );

    // 5. Money
    case "salaryStructure":
      return (
        <svg {...svgProps}>
          <Person cx="120" cy="180" color={primary} />
          <Person cx="280" cy="180" color={neutral} flip={true} />
          <g transform="translate(200, 100)">
            {/* Document Base with Folded Corner */}
            <path d="M -25 -40 h 35 l 15 15 v 55 h -50 z" fill="white" stroke={primary} strokeWidth="3" strokeLinejoin="round" />
            <path d="M 10 -40 v 15 h 15" fill="none" stroke={primary} strokeWidth="3" strokeLinejoin="round" />
            
            {/* Stock Market/Trend Icon (📈) representing Stock Options */}
            <path d="M -12 10 l 8 -8 l 6 5 l 10 -12" fill="none" stroke={highlight} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 12 -5 v -5 h -5" fill="none" stroke={highlight} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </svg>
      );
    case "equityStructure":
      // 40% slice = 144 degrees. cx=200, cy=150, r=40.
      return (
        <svg {...svgProps}>
          <Person cx="100" cy="180" color={primary} />
          <Person cx="300" cy="180" color={neutral} flip={true} />
          <g clipPath="url(#pieClipEquity)">
            <circle cx="200" cy="150" r="40" fill={primary} />
            <path d="M 200 150 L 200 110 A 40 40 0 0 1 223.51 182.36 Z" fill={neutral} />
            <path d="M 200 110 L 200 150 L 223.51 182.36" fill="none" stroke={bg} strokeWidth="4" strokeLinejoin="round" />
          </g>
          <defs>
            <clipPath id="pieClipEquity">
              <circle cx="200" cy="150" r="40" />
            </clipPath>
          </defs>
        </svg>
      );
    case "profitDistribution":
      return (
        <svg {...svgProps}>
          <Person cx="200" cy="180" color={primary} />
          <g transform="translate(120, 100)">
            <rect x="-30" y="-30" width="60" height="60" rx="8" fill="white" stroke={neutral} strokeWidth="3" />
            <path d="M -15 15 L -5 0 L 5 5 L 15 -10" fill="none" stroke={primary} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 5 -10 L 15 -10 L 15 0" fill="none" stroke={primary} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <g transform="translate(280, 100)">
            <rect x="-30" y="-30" width="60" height="60" rx="8" fill="white" stroke={neutral} strokeWidth="3" />
            <circle cx="0" cy="0" r="15" fill="none" stroke={highlight} strokeWidth="4" />
            <text x="0" y="5" fontSize="14" fill={highlight} fontWeight="bold" textAnchor="middle">$</text>
          </g>
        </svg>
      );
    case "growthStrategy":
      return (
        <svg {...svgProps}>
          <Person cx="200" cy="180" color={primary} />
          <g transform="translate(120, 100)">
             <rect x="-30" y="-30" width="60" height="60" rx="8" fill="white" stroke={neutral} strokeWidth="3" />
             <rect x="-15" y="5" width="8" height="10" rx="2" fill={success} />
             <rect x="-4" y="-5" width="8" height="20" rx="2" fill={success} />
             <rect x="7" y="-15" width="8" height="30" rx="2" fill={success} />
          </g>
          <g transform="translate(280, 100)">
             <rect x="-30" y="-30" width="60" height="60" rx="8" fill={highlight} />
             <path d="M 0 -15 L 10 5 L 0 0 L -10 5 Z" fill="white" />
             <path d="M -5 5 L 0 15 L 5 5 Z" fill="white" opacity="0.6" />
          </g>
        </svg>
      );

    default:
      return (
        <svg {...svgProps}>
          <rect x="150" y="70" width="100" height="100" rx="12" fill={secondary} />
          <Person cx="200" cy="180" color={primary} />
        </svg>
      );
  }
}
