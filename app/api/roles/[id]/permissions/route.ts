import prisma from '../../../../../lib/prisma';
import { NextRequest } from 'next/server';

// POST assign permissions to role
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: roleId } = await params;
    const { permissionIds } = await req.json();

    if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
      return new Response(JSON.stringify({ error: 'permissionIds array is required' }), { status: 400 });
    }

    // Delete existing permissions for this role
    await prisma.rolePermission.deleteMany({
      where: { role_id: roleId },
    });

    // Add new permissions
    const rolePermissions = await prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId: string) => ({
        role_id: roleId,
        permission_id: permissionId,
      })),
    });

    return new Response(JSON.stringify({ message: 'Permissions assigned', count: rolePermissions.count }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// GET permissions for role
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: roleId } = await params;

    const rolePermissions = await prisma.rolePermission.findMany({
      where: { role_id: roleId },
      include: { permission: true },
    });

    return new Response(JSON.stringify(rolePermissions), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
