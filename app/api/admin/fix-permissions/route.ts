import prisma from '../../../../lib/prisma';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    console.log('🔍 Checking Admin role permissions...');

    // Get all roles to check what exists
    const allRoles = await prisma.role.findMany();
    
    // Find admin role (case-insensitive) - NEVER CREATE
    const adminRoleBasic = allRoles.find(r => r.name.toLowerCase() === 'admin');
    
    if (!adminRoleBasic) {
      return new Response(
        JSON.stringify({ 
          error: 'Admin role not found. Please create it manually first.',
          hint: 'Go to Roles page and create a role named "Admin"'
        }), 
        { status: 404 }
      );
    }
    
    // Fetch with includes
    const adminRole = await prisma.role.findUnique({
      where: { id: adminRoleBasic.id },
      include: {
        role_permissions: {
          include: { permission: true }
        }
      }
    });

    if (!adminRole) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch Admin role details' }), 
        { status: 500 }
      );
    }

    // Get all permissions
    const allPermissions = await prisma.permission.findMany();

    const currentCount = adminRole.role_permissions.length;
    const totalCount = allPermissions.length;

    // Find missing permissions
    const assignedPermissionIds = new Set(
      adminRole.role_permissions.map(rp => rp.permission_id)
    );

    const missingPermissions = allPermissions.filter(
      p => !assignedPermissionIds.has(p.id)
    );

    if (missingPermissions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Admin already has all permissions assigned',
          stats: { current: currentCount, total: totalCount, fixed: 0 }
        }), 
        { status: 200 }
      );
    }

    // Assign missing permissions to Admin
    const fixed = [];
    for (const permission of missingPermissions) {
      await prisma.rolePermission.create({
        data: {
          role_id: adminRole.id,
          permission_id: permission.id,
        },
      });
      fixed.push(permission.name);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Successfully assigned ${fixed.length} missing permissions to Admin role`,
        fixed: fixed,
        stats: { 
          before: currentCount, 
          after: totalCount, 
          added: fixed.length 
        }
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
