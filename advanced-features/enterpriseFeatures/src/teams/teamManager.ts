export interface Team {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  ownerId: string;
  members: TeamMember[];
  createdAt: Date;
  updatedAt: Date;
  settings: TeamSettings;
}

export interface TeamMember {
  userId: string;
  email: string;
  displayName: string;
  role: TeamRole;
  joinedAt: Date;
  invitedBy?: string;
}

export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer' | 'guest';

export interface TeamSettings {
  defaultRole: TeamRole;
  allowGuestAccess: boolean;
  requireApprovalToJoin: boolean;
  maxMembers?: number;
  features: string[];
}

export class TeamManager {
  private teams: Map<string, Team> = new Map();

  async create(name: string, organizationId: string, ownerId: string, options?: {
    description?: string;
    settings?: Partial<TeamSettings>;
  }): Promise<Team> {
    const team: Team = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      organizationId,
      ownerId,
      description: options?.description,
      members: [{
        userId: ownerId,
        email: '',
        displayName: 'Owner',
        role: 'owner',
        joinedAt: new Date(),
      }],
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: {
        defaultRole: 'member',
        allowGuestAccess: false,
        requireApprovalToJoin: true,
        features: [],
        ...options?.settings,
      },
    };
    this.teams.set(team.id, team);
    return team;
  }

  async get(teamId: string): Promise<Team | null> {
    return this.teams.get(teamId) ?? null;
  }

  async update(teamId: string, updates: Partial<Pick<Team, 'name' | 'description' | 'settings'>>): Promise<Team | null> {
    const team = this.teams.get(teamId);
    if (!team) return null;
    Object.assign(team, updates, { updatedAt: new Date() });
    return team;
  }

  async delete(teamId: string): Promise<boolean> {
    return this.teams.delete(teamId);
  }

  async addMember(teamId: string, member: Omit<TeamMember, 'joinedAt'>): Promise<void> {
    const team = this.teams.get(teamId);
    if (!team) throw new Error(`Team not found: ${teamId}`);
    if (team.settings.maxMembers && team.members.length >= team.settings.maxMembers) {
      throw new Error('Team has reached maximum member limit');
    }
    team.members.push({ ...member, joinedAt: new Date() });
    team.updatedAt = new Date();
  }

  async removeMember(teamId: string, userId: string): Promise<void> {
    const team = this.teams.get(teamId);
    if (!team) throw new Error(`Team not found: ${teamId}`);
    team.members = team.members.filter(m => m.userId !== userId);
    team.updatedAt = new Date();
  }

  async updateMemberRole(teamId: string, userId: string, role: TeamRole): Promise<void> {
    const team = this.teams.get(teamId);
    if (!team) throw new Error(`Team not found: ${teamId}`);
    const member = team.members.find(m => m.userId === userId);
    if (member) {
      member.role = role;
      team.updatedAt = new Date();
    }
  }

  async listByOrganization(organizationId: string): Promise<Team[]> {
    return Array.from(this.teams.values()).filter(t => t.organizationId === organizationId);
  }

  async getMembers(teamId: string): Promise<TeamMember[]> {
    return this.teams.get(teamId)?.members ?? [];
  }
}
