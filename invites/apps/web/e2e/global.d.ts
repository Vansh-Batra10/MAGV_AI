import type { Invite } from "@invites/renderer";
declare global { interface Window { __invite?: Invite; __inviteReady?: boolean } }
export {};
