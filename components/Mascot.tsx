import React from 'react';
import { motion } from 'framer-motion';

const mascotVariants = {
    float: {
        y: [-3, 3, -3],
        transition: { duration: 4, ease: "easeInOut" as const, repeat: Infinity }
    },
    shadowFloat: {
        scaleX: [1, 0.95, 1],
        y: [0, 1, 0],
        opacity: [0.7, 0.5, 0.7],
        transition: { duration: 4, ease: "easeInOut" as const, repeat: Infinity }
    },
    eyeBlink: {
        scaleY: [1, 1, 0.1, 1, 1],
        transition: { duration: 5, repeat: Infinity, ease: "easeInOut" as const, times: [0, 0.9, 0.95, 1, 1] }
    },
    plugWiggle: {
        rotate: [0, 5, -5, 0],
        transition: { duration: 6, ease: "easeInOut" as const, repeat: Infinity }
    }
};

export const Mascot = () => (
    <motion.div className="flex-shrink-0 relative w-[150px] h-[150px]">
        <svg width="100%" height="100%" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            {/* Shadow */}
            <motion.ellipse
                cx="100"
                cy="175"
                rx="50"
                ry="6"
                className="fill-black/10 dark:fill-black/20"
                style={{ filter: 'blur(1px)' }}
                animate={mascotVariants.shadowFloat}
            />

            <motion.g animate={mascotVariants.float}>
                <defs>
                    <linearGradient id="bodyGradientModern" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#8ec5fc" />
                        <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                    <radialGradient id="bodyHighlight" cx="0.3" cy="0.1" r="0.8">
                        <stop offset="0%" stopColor="white" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="white" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id="cableGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="50%" stopColor="#2563eb" />
                        <stop offset="100%" stopColor="#1e40af" />
                    </linearGradient>
                    <radialGradient id="eyeIrisGradient" cx="50%" cy="50%" r="50%" fx="60%" fy="40%">
                        <stop offset="0%" stopColor="#38bdf8" />
                        <stop offset="100%" stopColor="#0ea5e9" />
                    </radialGradient>
                    <linearGradient id="plugProngGradient" x1="0.5" y1="0" x2="0.5" y2="1">
                        <stop offset="0%" stopColor="#e5e7eb" />
                        <stop offset="50%" stopColor="#d1d5db" />
                        <stop offset="100%" stopColor="#9ca3af" />
                    </linearGradient>
                    <linearGradient id="buttonGradient" x1="0.5" y1="0" x2="0.5" y2="1">
                        <stop offset="0%" stopColor="#4ade80" />
                        <stop offset="100%" stopColor="#16a34a" />
                    </linearGradient>
                    <filter id="buttonInsetShadow">
                        <feComponentTransfer in="SourceAlpha">
                            <feFuncA type="table" tableValues="1 0" />
                        </feComponentTransfer>
                        <feGaussianBlur stdDeviation="1" />
                        <feOffset dx="0.5" dy="0.5" result="offsetblur" />
                        <feFlood floodColor="black" floodOpacity="0.3" />
                        <feComposite in2="offsetblur" operator="in" />
                        <feComposite in2="SourceAlpha" operator="in" />
                        <feMerge>
                            <feMergeNode in="SourceGraphic" />
                            <feMergeNode />
                        </feMerge>
                    </filter>
                </defs>

                {/* Cable Arm Left */}
                <path d="M 90 155 C 40 165, 20 110, 55 90" stroke="url(#cableGradient)" strokeWidth="9" fill="none" strokeLinecap="round" />
                
                {/* Body */}
                <g>
                    {/* Main Body Shape */}
                    <path d="M 80 30 C 70 15, 145 20, 148 40 L 155 130 C 160 155, 70 165, 65 140 Z" fill="url(#bodyGradientModern)" />
                    {/* Highlight */}
                    <path d="M 80 30 C 70 15, 145 20, 148 40 L 155 130 C 160 155, 70 165, 65 140 Z" fill="url(#bodyHighlight)" />

                    {/* Face Section */}
                    <path d="M 74 35 C 75 25, 142 28, 144 42 L 150 80 L 70 85 Z" fill="#f0f9ff" />
                    {/* Face highlight */}
                    <path d="M 78 40 C 90 35, 120 40, 140 50 L 145 70 L 73 75 Z" fill="white" opacity="0.3" />

                    {/* Separator */}
                    <path d="M 70 85 L 150 80" stroke="#dbeafe" strokeWidth="2" />
                </g>

                {/* Cable Arm Right to Plug */}
                <path d="M 118 150 C 180 160, 220 80, 165 60" stroke="url(#cableGradient)" strokeWidth="9" fill="none" strokeLinecap="round" />

                {/* Plug */}
                <motion.g transform="translate(150 20)" animate={mascotVariants.plugWiggle} style={{ transformOrigin: '25px 50px' }}>
                    <path d="M 10 30 C 10 20, 20 20, 20 30 L 20 50 L 0 50 L 0 30 C 0 20, 10 20, 10 30" fill="#1e40af" />
                    <rect x="-5" y="50" width="30" height="10" rx="2" fill="#94a3b8" />
                    <rect x="-2" y="60" width="8" height="12" rx="1" fill="url(#plugProngGradient)" />
                    <rect x="14" y="60" width="8" height="12" rx="1" fill="url(#plugProngGradient)" />
                </motion.g>

                {/* Power Symbol */}
                <g>
                   <circle cx="115" cy="125" r="16" fill="url(#buttonGradient)" filter="url(#buttonInsetShadow)" />
                   <path d="M 110 118 L 120 118 L 115 127 L 122 127 L 108 135 L 115 129 L 110 129 Z" fill="white" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.2))' }} />
                </g>

                {/* Face */}
                <g>
                    {/* Open Eye */}
                    <motion.g transform="translate(80 60)" animate={mascotVariants.eyeBlink} style={{ transformOrigin: '12px 12px' }}>
                        <ellipse cx="12" cy="12" rx="12" ry="14" fill="white" />
                        <ellipse cx="12" cy="12" rx="9" ry="11" fill="url(#eyeIrisGradient)" />
                        <circle cx="12" cy="12" r="4" fill="#0c4a6e" />
                        <circle cx="14" cy="9" r="2.5" fill="white" opacity="0.9" />
                        <circle cx="11" cy="14" r="1" fill="white" opacity="0.5" />
                    </motion.g>
                    {/* Eyebrow Open Eye */}
                    <path d="M 85 52 Q 92 48 102 52" stroke="#1e40af" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                    
                    {/* Winking Eye */}
                    <path d="M 125 65 Q 135 72 145 65" stroke="#1e40af" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                    
                    {/* Mouth */}
                     <g>
                        <path d="M 95 90 C 105 110, 125 110, 135 90" stroke="#1e40af" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                        <path d="M 96 92 C 105 108, 125 108, 134 92" fill="#be123c" />
                        <path d="M 98 90 C 105 98, 125 98, 132 90 L 132 95 C 125 103, 105 103, 98 95 Z" fill="white" />
                        <path d="M 108 100 C 112 105, 118 105, 122 100 Q 115 104 108 100 Z" fill="#fda4af" />
                    </g>
                </g>
            </motion.g>
        </svg>
    </motion.div>
);
