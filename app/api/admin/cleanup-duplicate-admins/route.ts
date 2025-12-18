import prisma from '../../../../lib/prisma';

export async function POST() {
  try {
    // Get all roles
    const allRoles = await prisma.role.findMany({
      include: {
        role_permissions: true,
        user_roles: true
      }
    });

    // Find Admin roles (case variations)
    const adminRoles = allRoles.filter((r: { name: string }) => r.name.toLowerCase() === 'admin');

    if (adminRoles.length <= 1) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No duplicate admin roles found',
          count: adminRoles.length
        }), 
        { status: 200 }
      );
    }

    // Sort by: most permissions, then by creation date (oldest first)
    const sortedAdminRoles = adminRoles.sort((a, b) => {
      // Primary: most permissions
      const permDiff = b.role_permissions.length - a.role_permissions.length;
      if (permDiff !== 0) return permDiff;
      
      // Secondary: oldest created_at
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    // Keep the first one (most permissions, oldest)
    const keepRole = sortedAdminRoles[0];
    const deleteRoles = sortedAdminRoles.slice(1);

    const deleted = [];
    
    for (const role of deleteRoles) {
      // Delete role_permissions first
      await prisma.rolePermission.deleteMany({
        where: { role_id: role.id }
      });
      
      // Delete user_roles
      await prisma.userRole.deleteMany({
        where: { role_id: role.id }
      });
      
      // Delete the role
      await prisma.role.delete({
        where: { id: role.id }
      });
      
      deleted.push({
        name: role.name,
        id: role.id,
        permissions: role.role_permissions.length,
        users: role.user_roles.length
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Deleted ${deleted.length} duplicate admin role(s)`,
        kept: {
          name: keepRole.name,
          id: keepRole.id,
          permissions: keepRole.role_permissions.length,
          users: keepRole.user_roles.length
        },
        deleted: deleted
      }), 
      { status: 200 }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500 }
    );
  }
}
