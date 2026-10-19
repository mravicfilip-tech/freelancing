// Mock data for Send to agent. The platform list is from the brief. Agents, limits, load times and
// the send history are made up in the shape a real agent API returns.

export type PlatformId =
  | 'juwa-city'
  | 'game-vault'
  | 'orion-stars'
  | 'milkyway'
  | 'firekirin'
  | 'ultra-panda'
  | 'vblink'
  | 'cash-machine'
  | 'gameroom'
  | 'mr-all-in-one'
  | 'vegas-sweeps';

export type Platform = {
  id: PlatformId;
  name: string;
  /** Smallest and largest single send, in USDT. */
  min: number;
  max: number;
  /** What the player calls their login on that platform. */
  accountLabel: string;
};

export const PLATFORMS: Platform[] = [
  { id: 'juwa-city', name: 'Juwa City', min: 10, max: 5000, accountLabel: 'Juwa City username' },
  { id: 'game-vault', name: 'Game Vault', min: 10, max: 5000, accountLabel: 'Game Vault username' },
  { id: 'orion-stars', name: 'Orion Stars', min: 20, max: 3000, accountLabel: 'Orion Stars username' },
  { id: 'milkyway', name: 'Milkyway', min: 10, max: 2500, accountLabel: 'Milkyway username' },
  { id: 'firekirin', name: 'Firekirin', min: 10, max: 5000, accountLabel: 'Firekirin username' },
  { id: 'ultra-panda', name: 'Ultra Panda', min: 20, max: 4000, accountLabel: 'Ultra Panda username' },
  { id: 'vblink', name: 'VBlink', min: 10, max: 3000, accountLabel: 'VBlink username' },
  { id: 'cash-machine', name: 'Cash Machine', min: 25, max: 2000, accountLabel: 'Cash Machine username' },
  { id: 'gameroom', name: 'Gameroom', min: 10, max: 2500, accountLabel: 'Gameroom username' },
  { id: 'mr-all-in-one', name: 'Mr All In One', min: 20, max: 3500, accountLabel: 'Mr All In One username' },
  { id: 'vegas-sweeps', name: 'Vegas Sweeps', min: 10, max: 5000, accountLabel: 'Vegas Sweeps username' },
];

export const platformById = (id: PlatformId) => PLATFORMS.find((p) => p.id === id)!;

export type AgentStatus = 'online' | 'busy' | 'offline';

export type Agent = {
  id: string;
  name: string;
  handle: string;
  platforms: PlatformId[];
  status: AgentStatus;
  /** How long this agent usually takes to load credit. */
  loads: string;
  sends: number;
};

const ALL = PLATFORMS.map((p) => p.id);

export const AGENTS: Agent[] = [
  { id: 'a1', name: 'Marcus Tolliver', handle: 'marcus.t', platforms: ['juwa-city', 'game-vault', 'orion-stars', 'milkyway'], status: 'online', loads: 'About 5 minutes', sends: 4821 },
  { id: 'a2', name: 'Lena Okafor', handle: 'lena.okafor', platforms: ['juwa-city', 'firekirin', 'ultra-panda', 'vblink', 'gameroom'], status: 'online', loads: 'About 8 minutes', sends: 3107 },
  { id: 'a3', name: 'Dario Vukovic', handle: 'dario.v', platforms: ALL, status: 'busy', loads: 'About 20 minutes', sends: 9264 },
  { id: 'a4', name: 'Priya Raman', handle: 'priya.r', platforms: ['game-vault', 'cash-machine', 'mr-all-in-one', 'vegas-sweeps'], status: 'online', loads: 'About 6 minutes', sends: 1893 },
  { id: 'a5', name: 'Tomas Eriksen', handle: 'tomas.e', platforms: ['orion-stars', 'milkyway', 'firekirin', 'vegas-sweeps'], status: 'offline', loads: 'Back at 09:00', sends: 612 },
  { id: 'a6', name: 'Alexandra Konstantinopoulou-Vasquez', handle: 'alexandra.kv.official.agent', platforms: ['ultra-panda', 'vblink', 'gameroom', 'cash-machine', 'mr-all-in-one'], status: 'online', loads: 'About 12 minutes', sends: 2540 },
  { id: 'a7', name: 'Jamal Whitfield', handle: 'jamal.w', platforms: ['juwa-city', 'game-vault', 'vblink', 'vegas-sweeps'], status: 'busy', loads: 'About 25 minutes', sends: 1276 },
  { id: 'a8', name: 'Sofia Brandt', handle: 'sofia.b', platforms: ['milkyway', 'firekirin', 'gameroom', 'cash-machine'], status: 'online', loads: 'About 4 minutes', sends: 730 },
];

const FIRST = ['Ravi', 'Mei', 'Oskar', 'Nadia', 'Ben', 'Ines', 'Karl', 'Yusuf', 'Lucia', 'Anton'];
const LAST = ['Hale', 'Brandt', 'Mora', 'Quinn', 'Sato', 'Ivanov', 'Cole', 'Duarte'];
const STATUS: AgentStatus[] = ['online', 'online', 'busy', 'online', 'offline'];

// 60 agents, for the large list state.
export function largeAgents(): Agent[] {
  const out: Agent[] = [...AGENTS];
  for (let i = 0; i < 52; i++) {
    const first = FIRST[i % FIRST.length];
    const last = LAST[(i * 3) % LAST.length];
    out.push({
      id: `big${i}`,
      name: `${first} ${last}`,
      handle: `${first}.${last}${i}`.toLowerCase(),
      platforms: ALL.filter((_, j) => (i + j) % 3 !== 0),
      status: STATUS[i % STATUS.length],
      loads: `About ${5 + (i % 6) * 4} minutes`,
      sends: 120 + i * 37,
    });
  }
  return out;
}

export const STATUS_ORDER: Record<AgentStatus, number> = { online: 0, busy: 1, offline: 2 };
export const STATUS_WORD: Record<AgentStatus, string> = { online: 'Online', busy: 'Busy', offline: 'Offline' };

export type AgentSendStatus = 'pending' | 'completed' | 'declined';

export type AgentSend = {
  id: string;
  platformId: PlatformId;
  agentId: string;
  agentName: string;
  amount: number;
  status: AgentSendStatus;
  date: string;
  reference: string;
};

// Reads like "Juwa City via Marcus Tolliver", so a row says where the credit went and who loaded it.
export const sendLabel = (s: Pick<AgentSend, 'platformId' | 'agentName'>) => `${platformById(s.platformId).name} via ${s.agentName}`;

export const SEEDED_SENDS: AgentSend[] = [
  { id: 'AG-48213802', platformId: 'game-vault', agentId: 'a1', agentName: 'Marcus Tolliver', amount: 150, status: 'completed', date: '2026-10-18T19:12:00', reference: 'GV-1018-7731' },
  { id: 'AG-48213640', platformId: 'juwa-city', agentId: 'a2', agentName: 'Lena Okafor', amount: 75, status: 'completed', date: '2026-10-16T21:40:00', reference: 'JC-1016-2204' },
  { id: 'AG-48213511', platformId: 'vblink', agentId: 'a7', agentName: 'Jamal Whitfield', amount: 40, status: 'declined', date: '2026-10-14T13:05:00', reference: 'VB-1014-9018' },
  { id: 'AG-48213377', platformId: 'orion-stars', agentId: 'a1', agentName: 'Marcus Tolliver', amount: 300, status: 'completed', date: '2026-10-11T17:30:00', reference: 'OS-1011-5560' },
];
