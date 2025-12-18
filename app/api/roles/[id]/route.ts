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

    const role = await prisma.role.update({
      where: { id },
      data: { name },
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

    await prisma.role.delete({ where: { id } });

    return new Response(JSON.stringify({ message: 'Role deleted' }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
