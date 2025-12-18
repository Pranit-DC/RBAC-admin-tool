import prisma from '../../../lib/prisma';
import { NextRequest } from 'next/server';

// GET all permissions
export async function GET() {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: { created_at: 'desc' },
    });
    return new Response(JSON.stringify(permissions), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// POST create permission
export async function POST(req: NextRequest) {
  try {
    const { name, description } = await req.json();
    
    if (!name) {
      return new Response(JSON.stringify({ error: 'Name is required' }), { status: 400 });
    }

    // 🔥 CONSTRAINT: Normalize to lowercase dot-notation (resource.action)
    // Replace underscores, spaces, and multiple separators with dots
    let normalizedName = name.trim().toLowerCase()
      .replace(/[_\s]+/g, '.')  // Replace underscores and spaces with dots
      .replace(/\.+/g, '.')      // Replace multiple dots with single dot
      .replace(/^\.+|\.+$/g, ''); // Remove leading/trailing dots
    
    // Validate format: must be resource.action (at least one dot)
    if (!normalizedName.includes('.')) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid permission format. Use dot-notation: resource.action',
          example: 'users.read, roles.manage, reports.import'
        }), 
        { status: 400 }
      );
    }
    
    // Validate characters: only lowercase letters, dots, and numbers
    if (!/^[a-z0-9.]+$/.test(normalizedName)) {
      return new Response(
        JSON.stringify({ 
          error: 'Permission name must contain only lowercase letters, numbers, and dots',
          received: normalizedName
        }), 
        { status: 400 }
      );
    }

    const existing = await prisma.permission.findUnique({ where: { name: normalizedName } });
    if (existing) {
      return new Response(JSON.stringify({ error: 'Permission already exists' }), { status: 409 });
    }

    const permission = await prisma.permission.create({
      data: { name: normalizedName, description },
    });

    // 🔥 INVARIANT: Auto-assign new permission to Admin role
    // Find Admin role (case-insensitive)
    const allRoles = await prisma.role.findMany();
    const adminRole = allRoles.find(r => r.name.toLowerCase() === 'admin');
    
    if (!adminRole) {
      // Rollback: delete the permission we just created
      await prisma.permission.delete({ where: { id: permission.id } });
      return new Response(
        JSON.stringify({ 
          error: 'System error: Admin role not found. Permission creation cancelled.',
          hint: 'Please ensure an Admin role exists before creating permissions'
        }), 
        { status: 500 }
      );
    }
    
    // Assign permission to Admin
    await prisma.rolePermission.create({
      data: {
        role_id: adminRole.id,
        permission_id: permission.id,
      },
    });
    
    // Return success with notification
    return new Response(
      JSON.stringify({ 
        ...permission, 
        autoAssigned: true,
        message: `Permission created and automatically assigned to Admin role` 
      }), 
      { status: 201 }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
