// Middleware to check user permissions
// 🔥 EDGE CASE 11: Backend permission validation

import prisma from './prisma';

export async function checkUserPermission(userId: string, requiredPermission: string): Promise<boolean> {
  try {
    // Get all roles for the user
    const userRoles = await prisma.userRole.findMany({
      where: { user_id: userId },
      include: {
        role: {
          include: {
            role_permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    // 🔥 EDGE CASE 8: Permission merge (union, not intersection)
    // If user has ANY role with the permission, allow access
    for (const userRole of userRoles) {
      const hasPermission = userRole.role.role_permissions.some(
        (rp) => rp.permission.name === requiredPermission
      );
      if (hasPermission) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
}

export async function getUserPermissions(userId: string): Promise<string[]> {
  try {
    const userRoles = await prisma.userRole.findMany({
      where: { user_id: userId },
      include: {
        role: {
          include: {
            role_permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    // 🔥 EDGE CASE 8: Merge permissions from all roles (union)
    const permissionSet = new Set<string>();
    
    for (const userRole of userRoles) {
      for (const rolePermission of userRole.role.role_permissions) {
        permissionSet.add(rolePermission.permission.name);
      }
    }

    return Array.from(permissionSet);
  } catch (error) {
    console.error('Get permissions error:', error);
    return [];
  }
}
