import prisma from '../../../../lib/prisma';
import { NextRequest } from 'next/server';

// GET single role
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        role_permissions: {
          include: { permission: true },
        },
        user_roles: {
          include: { user: true },
        },
      },
    });

    if (!role) {
      return new Response(JSON.stringify({ error: 'Role not found' }), { status: 404 });
    }

    return new Response(JSON.stringify(role), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// PUT update role
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { name } = await req.json();

    // 🔥 EDGE CASE 2 & 3: Protect Admin role from modification
    const existingRole = await prisma.role.findUnique({ where: { id } });
    if (existingRole?.name.toLowerCase() === 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin role cannot be modified' }), 
        { status: 403 }
      );
    }

    const role = await prisma.role.update({
      where: { id },
      data: { name: name.trim().toLowerCase() },
    });

    return new Response(JSON.stringify(role), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// DELETE role
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // 🔥 EDGE CASE 3: Prevent deletion of Admin role
    const role = await prisma.role.findUnique({ where: { id } });
    if (role?.name.toLowerCase() === 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin role cannot be deleted' }), 
        { status: 403 }
      );
    }

    // 🔥 EDGE CASE 9: Cascade delete handled by Prisma onDelete: Cascade
    await prisma.role.delete({ where: { id } });

    return new Response(JSON.stringify({ message: 'Role deleted' }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
