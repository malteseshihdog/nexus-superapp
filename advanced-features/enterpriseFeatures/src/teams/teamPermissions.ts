import type { TeamRole } from './teamManager';

export type ResourceType = 'project' | 'repository' | 'environment' | 'secret' | 'team' | 'organization' | 'billing';
export type Action = 'read' | 'write' | 'delete' | 'admin' | 'invite' | 'deploy';

export interface Permission {
  resourceType: ResourceType;
  resourceId?: string;
  actions: Action[];
}

export interface RolePermissions {
  role: TeamRole;
  permissions: Permission[];
}

const DEFAULT_ROLE_PERMISSIONS: RolePermissions[] = [
  {
    role: 'owner',
    permissions: [
      { resourceType: 'project', actions: ['read', 'write', 'delete', 'admin'] },
      { resourceType: 'team', actions: ['read', 'write', 'delete', 'admin', 'invite'] },
      { resourceType: 'billing', actions: ['read', 'write', 'admin'] },
      { resourceType: 'secret', actions: ['read', 'write', 'delete', 'admin'] },
    ],
  },
  {
    role: 'admin',
    permissions: [
      { resourceType: 'project', actions: ['read', 'write', 'delete'] },
      { resourceType: 'team', actions: ['read', 'write', 'invite'] },
      { resourceType: 'secret', actions: ['read', 'write'] },
    ],
  },
  {
    role: 'member',
    permissions: [
      { resourceType: 'project', actions: ['read', 'write'] },
      { resourceType: 'team', actions: ['read'] },
    ],
  },
  {
    role: 'viewer',
    permissions: [
      { resourceType: 'project', actions: ['read'] },
      { resourceType: 'team', actions: ['read'] },
    ],
  },
  {
    role: 'guest',
    permissions: [
      { resourceType: 'project', actions: ['read'] },
    ],
  },
];

export class TeamPermissions {
  private customPermissions: Map<string, RolePermissions[]> = new Map();

  can(role: TeamRole, resourceType: ResourceType, action: Action, teamId?: string): boolean {
    const permissions = teamId
      ? (this.customPermissions.get(teamId) ?? DEFAULT_ROLE_PERMISSIONS)
      : DEFAULT_ROLE_PERMISSIONS;
    const rolePermission = permissions.find(p => p.role === role);
    if (!rolePermission) return false;
    const resourcePermission = rolePermission.permissions.find(p => p.resourceType === resourceType);
    return resourcePermission?.actions.includes(action) ?? false;
  }

  setCustomPermissions(teamId: string, permissions: RolePermissions[]): void {
    this.customPermissions.set(teamId, permissions);
  }

  getPermissionsForRole(role: TeamRole, teamId?: string): Permission[] {
    const permissions = teamId
      ? (this.customPermissions.get(teamId) ?? DEFAULT_ROLE_PERMISSIONS)
      : DEFAULT_ROLE_PERMISSIONS;
    return permissions.find(p => p.role === role)?.permissions ?? [];
  }

  validatePermissions(permissions: Permission[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const validResourceTypes: ResourceType[] = ['project', 'repository', 'environment', 'secret', 'team', 'organization', 'billing'];
    const validActions: Action[] = ['read', 'write', 'delete', 'admin', 'invite', 'deploy'];
    for (const permission of permissions) {
      if (!validResourceTypes.includes(permission.resourceType)) {
        errors.push(`Invalid resource type: ${permission.resourceType}`);
      }
      for (const action of permission.actions) {
        if (!validActions.includes(action)) {
          errors.push(`Invalid action: ${action}`);
        }
      }
    }
    return { valid: errors.length === 0, errors };
  }
}
