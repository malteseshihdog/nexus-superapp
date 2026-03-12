import type { TeamRole } from './teamManager';

export interface Invitation {
  id: string;
  teamId: string;
  email: string;
  role: TeamRole;
  invitedBy: string;
  token: string;
  expiresAt: Date;
  acceptedAt?: Date;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: Date;
}

export class TeamInvitation {
  private invitations: Map<string, Invitation> = new Map();

  async create(teamId: string, email: string, role: TeamRole, invitedBy: string, expiryHours = 48): Promise<Invitation> {
    const invitation: Invitation = {
      id: Math.random().toString(36).substring(2, 9),
      teamId,
      email,
      role,
      invitedBy,
      token: Math.random().toString(36).substring(2, 18) + Math.random().toString(36).substring(2, 18),
      expiresAt: new Date(Date.now() + expiryHours * 3_600_000),
      status: 'pending',
      createdAt: new Date(),
    };
    this.invitations.set(invitation.id, invitation);
    console.log(`Invitation created for ${email} to join team ${teamId}`);
    return invitation;
  }

  async accept(token: string, userId: string): Promise<Invitation | null> {
    const invitation = Array.from(this.invitations.values()).find(i => i.token === token);
    if (!invitation) return null;
    if (invitation.status !== 'pending') return null;
    if (new Date() > invitation.expiresAt) {
      invitation.status = 'expired';
      return null;
    }
    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    console.log(`Invitation accepted by user ${userId}`);
    return invitation;
  }

  async decline(token: string): Promise<void> {
    const invitation = Array.from(this.invitations.values()).find(i => i.token === token);
    if (invitation && invitation.status === 'pending') {
      invitation.status = 'declined';
    }
  }

  async resend(invitationId: string, expiryHours = 48): Promise<Invitation | null> {
    const invitation = this.invitations.get(invitationId);
    if (!invitation || invitation.status !== 'pending') return null;
    invitation.expiresAt = new Date(Date.now() + expiryHours * 3_600_000);
    invitation.token = Math.random().toString(36).substring(2, 18) + Math.random().toString(36).substring(2, 18);
    console.log(`Invitation resent to ${invitation.email}`);
    return invitation;
  }

  async revoke(invitationId: string): Promise<boolean> {
    return this.invitations.delete(invitationId);
  }

  async getPending(teamId: string): Promise<Invitation[]> {
    return Array.from(this.invitations.values()).filter(i =>
      i.teamId === teamId && i.status === 'pending' && new Date() < i.expiresAt
    );
  }

  async getByToken(token: string): Promise<Invitation | null> {
    return Array.from(this.invitations.values()).find(i => i.token === token) ?? null;
  }
}
