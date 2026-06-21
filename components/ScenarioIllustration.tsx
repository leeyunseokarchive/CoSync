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
          <Person cx="320" cy="180" color={primary} />
          {/* Clean Thought Bubble */}
          <ellipse cx="280" cy="80" rx="30" ry="25" fill="white" stroke={primary} strokeWidth="3" />
          <circle cx="300" cy="120" r="6" fill="white" stroke={primary} strokeWidth="2.5" />
          <circle cx="312" cy="138" r="3.5" fill="white" stroke={primary} strokeWidth="2" />
          <text x="280" y="88" fontSize="24" fill={primary} fontWeight="bold" textAnchor="middle">?</text>
        </svg>
      );
    case "decisionFailure":
      return (
        <svg {...svgProps}>
          <Person cx="120" cy="180" color={primary} />
          <Person cx="280" cy="180" color={neutral} flip={true} />
          <g transform="translate(200, 100)">
            <rect x="-35" y="-40" width="70" height="75" rx="6" fill="white" stroke={danger} strokeWidth="3" />
            <text x="0" y="5" fontSize="36" fill={danger} fontWeight="bold" textAnchor="middle">0</text>
            <rect x="-20" y="15" width="40" height="4" rx="2" fill={neutral} opacity="0.5" />
            <rect x="-20" y="25" width="25" height="4" rx="2" fill={neutral} opacity="0.5" />
          </g>
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
          <Person cx="120" cy="180" color={primary} />
          
          {/* Inquiry 1 */}
          <g transform="translate(260, 70)">
            <path d="M -20 -15 h 40 a 8 8 0 0 1 8 8 v 20 a 8 8 0 0 1 -8 8 h -10 l -10 10 l 0 -10 h -20 a 8 8 0 0 1 -8 -8 v -20 a 8 8 0 0 1 8 -8 z" fill="white" stroke={neutral} strokeWidth="3" strokeLinejoin="round" />
            <text x="0" y="7" fontSize="16" fill={neutral} fontWeight="bold" textAnchor="middle">?</text>
          </g>
          
          {/* Inquiry 2 (Urgent/Highlighted) */}
          <g transform="translate(200, 110)">
            <path d="M -20 -15 h 40 a 8 8 0 0 1 8 8 v 20 a 8 8 0 0 1 -8 8 h -10 l -10 10 l 0 -10 h -20 a 8 8 0 0 1 -8 -8 v -20 a 8 8 0 0 1 8 -8 z" fill="white" stroke={highlight} strokeWidth="3" strokeLinejoin="round" />
            <text x="0" y="7" fontSize="16" fill={highlight} fontWeight="bold" textAnchor="middle">?</text>
          </g>
          
          {/* Inquiry 3 */}
          <g transform="translate(280, 150)">
            <path d="M -20 -15 h 40 a 8 8 0 0 1 8 8 v 20 a 8 8 0 0 1 -8 8 h -10 l -10 10 l 0 -10 h -20 a 8 8 0 0 1 -8 -8 v -20 a 8 8 0 0 1 8 -8 z" fill="white" stroke={neutral} strokeWidth="3" strokeLinejoin="round" />
            <text x="0" y="7" fontSize="16" fill={neutral} fontWeight="bold" textAnchor="middle">?</text>
          </g>
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
          <Person cx="280" cy="180" color={neutral} flip={true} />
          
          <g transform="translate(200, 100)">
            {/* Calendar Base */}
            <rect x="-50" y="-50" width="100" height="100" rx="6" fill="white" />
            {/* Red Header */}
            <path d="M -50 -20 v -24 a 6 6 0 0 1 6 -6 h 88 a 6 6 0 0 1 6 6 v 24 z" fill={danger} />
            {/* Rings */}
            <circle cx="-25" cy="-42" r="4" fill="white" />
            <circle cx="25" cy="-42" r="4" fill="white" />
            {/* Calendar Stroke */}
            <rect x="-50" y="-50" width="100" height="100" rx="6" fill="none" stroke={neutral} strokeWidth="3" />
            
            {/* DELAY boxes */}
            <rect x="-40" y="-5" width="36" height="16" rx="4" fill="#FEE2E2" />
            <text x="-22" y="6" fontSize="8" fill={danger} fontWeight="bold" textAnchor="middle">DELAY</text>
            
            <rect x="4" y="15" width="36" height="16" rx="4" fill="#FEE2E2" />
            <text x="22" y="26" fontSize="8" fill={danger} fontWeight="bold" textAnchor="middle">DELAY</text>
          </g>
        </svg>
      );
    // 3. Exit
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
             <rect x="-30" y="-30" width="60" height="60" rx="8" fill="white" stroke={neutral} strokeWidth="3" />
             <path d="M 0 -15 L 10 5 L 0 0 L -10 5 Z" fill={highlight} />
             <path d="M -5 5 L 0 15 L 5 5 Z" fill={highlight} opacity="0.6" />
          </g>
        </svg>
      );

    // 6. Funding
    case "fundingRunway":
      return (
        <svg {...svgProps}>
          <Person cx="120" cy="180" color={primary} />
          <Person cx="280" cy="180" color={neutral} flip={true} />
          <g transform="translate(200, 100)">
            {/* Hourglass */}
            <path d="M -12 -20 L 12 -20 L 2 0 L 12 20 L -12 20 L -2 0 Z" fill="none" stroke={danger} strokeWidth="3" strokeLinejoin="round" />
            <path d="M -15 -20 h 30 M -15 20 h 30" stroke={danger} strokeWidth="4" strokeLinecap="round" />
            {/* Sand at bottom */}
            <path d="M -8 20 L 8 20 L 0 8 Z" fill={danger} opacity="0.8" />
            {/* Dollar sign at top */}
            <text x="0" y="-4" fontSize="12" fill={danger} fontWeight="bold" textAnchor="middle">$</text>
          </g>
        </svg>
      );
    case "spendingApproval":
      return (
        <svg {...svgProps}>
          <Person cx="120" cy="180" color={primary} />
          <Person cx="280" cy="180" color={neutral} flip={true} />
          
          <g transform="translate(140, 100)">
            {/* Left Speech Bubble (Declaration) */}
            <path d="M -25 -30 h 50 a 10 10 0 0 1 10 10 v 35 a 10 10 0 0 1 -10 10 h -25 l -15 15 l 5 -15 h -15 a 10 10 0 0 1 -10 -10 v -35 a 10 10 0 0 1 10 -10 z" fill="white" stroke={primary} strokeWidth="3" strokeLinejoin="round" />
            
            {/* Receipt */}
            <g transform="translate(0, -4)">
              <path d="M -12 -15 h 24 v 25 l -4 -2 l -4 2 l -4 -2 l -4 2 l -4 -2 l -4 2 z" fill="none" stroke={primary} strokeWidth="2.5" strokeLinejoin="round" />
              <text x="0" y="0" fontSize="12" fill={primary} fontWeight="bold" textAnchor="middle">$</text>
              <path d="M -6 6 h 12" fill="none" stroke={primary} strokeWidth="2" strokeLinecap="round" />
            </g>
            
            {/* DONE Stamp (Unilateral Action) */}
            <g transform="translate(12, 6) rotate(-15)">
              <circle cx="0" cy="0" r="9" fill={danger} />
              <path d="M -4 0 L -1 3 L 4 -3" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </g>
          
          <g transform="translate(260, 95)">
            {/* Right Speech Bubble (Shock) */}
            <path d="M -20 -25 h 40 a 10 10 0 0 1 10 10 v 30 a 10 10 0 0 1 -10 10 h -10 l 5 15 l -15 -15 h -20 a 10 10 0 0 1 -10 -10 v -30 a 10 10 0 0 1 10 -10 z" fill="white" stroke={danger} strokeWidth="3" strokeLinejoin="round" />
            <text x="0" y="5" fontSize="24" fill={danger} fontWeight="bold" textAnchor="middle">?!</text>
          </g>
        </svg>
      );
    case "investmentCriteria":
      return (
        <svg {...svgProps}>
          <Person cx="120" cy="180" color={primary} />
          <Person cx="280" cy="180" color={neutral} flip={true} />
          <g transform="translate(150, 100)">
            {/* Left Speech Bubble */}
            <path d="M -20 -25 h 40 a 10 10 0 0 1 10 10 v 30 a 10 10 0 0 1 -10 10 h -20 l -15 15 l 5 -15 h -10 a 10 10 0 0 1 -10 -10 v -30 a 10 10 0 0 1 10 -10 z" fill="white" stroke={primary} strokeWidth="3" strokeLinejoin="round" />
            <circle cx="0" cy="0" r="16" fill="none" stroke={highlight} strokeWidth="3" />
            <text x="0" y="6" fontSize="18" fill={highlight} fontWeight="bold" textAnchor="middle">$</text>
          </g>
          <g transform="translate(250, 100)">
            {/* Right Speech Bubble */}
            <path d="M -20 -25 h 40 a 10 10 0 0 1 10 10 v 30 a 10 10 0 0 1 -10 10 h -10 l 5 15 l -15 -15 h -20 a 10 10 0 0 1 -10 -10 v -30 a 10 10 0 0 1 10 -10 z" fill="white" stroke={primary} strokeWidth="3" strokeLinejoin="round" />
            <g transform="scale(1.4) translate(0, -1)">
              {/* Center Person */}
              <circle cx="0" cy="-5" r="4.5" fill={primary} />
              <path d="M -7 5 c 0 -5 14 -5 14 0" fill="none" stroke={primary} strokeWidth="2.5" strokeLinecap="round" />
              {/* Left Person */}
              <circle cx="-10" cy="3" r="3.5" fill={neutral} />
              <path d="M -15 11 c 0 -4 10 -4 10 0" fill="none" stroke={neutral} strokeWidth="2" strokeLinecap="round" />
              {/* Right Person */}
              <circle cx="10" cy="3" r="3.5" fill={neutral} />
              <path d="M 5 11 c 0 -4 10 -4 10 0" fill="none" stroke={neutral} strokeWidth="2" strokeLinecap="round" />
            </g>
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
