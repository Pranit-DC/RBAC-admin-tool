import prisma from '../../../../lib/prisma';
import { NextRequest } from 'next/server';

// GET single permission
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const permission = await prisma.permission.findUnique({
      where: { id },
      include: {
        role_permissions: {
          include: { role: true },
        },
      },
    });

    if (!permission) {
      return new Response(JSON.stringify({ error: 'Permission not found' }), { status: 404 });
    }

    return new Response(JSON.stringify(permission), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// PUT update permission
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { name, description } = await req.json();

    const permission = await prisma.permission.update({
      where: { id },
      data: { name, description },
    });

    return new Response(JSON.stringify(permission), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// DELETE permission
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // First, delete all role_permission assignments for this permission
    await prisma.rolePermission.deleteMany({
      where: { permission_id: id },
    });

    // Then delete the permission itself
    await prisma.permission.delete({ where: { id } });

    return new Response(JSON.stringify({ message: 'Permission deleted successfully' }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
