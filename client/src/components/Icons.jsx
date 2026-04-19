const Icon = ({ d, size = 16, stroke = "currentColor", fill = "none", sw = 1.6, children, vb = "0 0 24 24", style, className }) => (
  <svg width={size} height={size} viewBox={vb} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    {d ? <path d={d} /> : children}
  </svg>
);

export const Chat = (p) => <Icon {...p} d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8z" />;
export const Map = (p) => <Icon {...p}><circle cx="6" cy="7" r="2.5"/><circle cx="18" cy="7" r="2.5"/><circle cx="12" cy="17" r="2.5"/><path d="M8 8.5l3 7M16 8.5l-3 7"/></Icon>;
export const Files = (p) => <Icon {...p}><path d="M4 6a2 2 0 0 1 2-2h5l2 2h5a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z"/></Icon>;
export const Insights = (p) => <Icon {...p} d="M4 19V9M10 19V4M16 19v-8M22 19H2" />;
export const Search = (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></Icon>;
export const Chevron = (p) => <Icon {...p} d="M6 9l6 6 6-6" />;
export const ChevronRight = (p) => <Icon {...p} d="M9 6l6 6-6 6" />;
export const Plus = (p) => <Icon {...p} d="M12 5v14M5 12h14" />;
export const Send = (p) => <Icon {...p}><path d="M5 12l15-7-7 15-2-6-6-2z"/></Icon>;
export const Attach = (p) => <Icon {...p} d="M21 11.5l-8.5 8.5a5 5 0 0 1-7-7l9-9a3.5 3.5 0 1 1 5 5l-9 9a2 2 0 1 1-3-3l8-8" />;
export const Copy = (p) => <Icon {...p}><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></Icon>;
export const Check = (p) => <Icon {...p} d="M4 12l5 5L20 6" />;
export const Close = (p) => <Icon {...p} d="M6 6l12 12M18 6L6 18" />;
export const Collapse = (p) => <Icon {...p}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/></Icon>;
export const GitBranch = (p) => <Icon {...p}><circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="11" r="2"/><path d="M6 7v10M6 13a6 6 0 0 0 6-6h4"/></Icon>;
export const Sparkle = (p) => <Icon {...p} d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 16l.9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9L19 16z" />;
export const User = (p) => <Icon {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></Icon>;
export const Bot = (p) => <Icon {...p}><rect x="4" y="8" width="16" height="12" rx="3"/><circle cx="9" cy="14" r="1" fill="currentColor"/><circle cx="15" cy="14" r="1" fill="currentColor"/><path d="M12 4v4M8 4h8"/></Icon>;
export const Terminal = (p) => <Icon {...p}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 10l3 2-3 2M13 14h4"/></Icon>;
export const Function = (p) => <Icon {...p} d="M15 4h-2a3 3 0 0 0-3 3v2H7v2h3v4a3 3 0 0 1-3 3H5M14 9h3M11 14h5" />;
export const Issue = (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16v.5"/></Icon>;
export const Entry = (p) => <Icon {...p} d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />;
export const Layers = (p) => <Icon {...p}><path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 18l9 5 9-5"/></Icon>;
export const Zap = (p) => <Icon {...p} d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />;
export const Settings = (p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 1 1 4.1 16.9l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1A2 2 0 1 1 7.1 4.1l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1z"/></Icon>;
export const Tweaks = (p) => <Icon {...p} d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h14M20 18h0M14 4v4M8 10v4M18 16v4" />;
