import prisma from '../../../../../lib/prisma';
import { NextRequest } from 'next/server';

// POST assign roles to user
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await params;
    const { roleIds } = await req.json();

    if (!Array.isArray(roleIds) || roleIds.length === 0) {
      return new Response(JSON.stringify({ error: 'roleIds array is required' }), { status: 400 });
    }

    // Delete existing roles for this user
    await prisma.userRole.deleteMany({
      where: { user_id: userId },
    });

    // Add new roles
    const userRoles = await prisma.userRole.createMany({
      data: roleIds.map((roleId: string) => ({
        user_id: userId,
        role_id: roleId,
      })),
    });

    return new Response(JSON.stringify({ message: 'Roles assigned', count: userRoles.count }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// GET roles for user
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await params;

    const userRoles = await prisma.userRole.findMany({
      where: { user_id: userId },
      include: { role: true },
    });

    return new Response(JSON.stringify(userRoles), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
