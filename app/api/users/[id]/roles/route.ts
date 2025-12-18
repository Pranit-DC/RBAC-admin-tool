import prisma from '../../../../../lib/prisma';
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-in-env';

// POST assign roles to user
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await params;
    const { roleIds } = await req.json();

    if (!Array.isArray(roleIds) || roleIds.length === 0) {
      return new Response(JSON.stringify({ error: 'At least one role must be selected' }), { status: 400 });
    }

    // Get current user from JWT
    const cookieHeader = req.headers.get('cookie') || '';
    const cookies = parse(cookieHeader);
    const token = cookies.token;
    
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const payload: any = jwt.verify(token, JWT_SECRET);
    const currentUserId = payload.sub;

    // EDGE CASE: Prevent admin from removing their own admin role
    if (currentUserId === userId) {
      // Get current user's roles
      const currentUserRoles = await prisma.userRole.findMany({
        where: { user_id: userId },
        include: { role: true },
      });

      // Check if user currently has admin role
      const hasAdminRole = currentUserRoles.some(
        (ur: { role: { name: string } }) => ur.role.name.toLowerCase() === 'admin'
      );

      if (hasAdminRole) {
        // Check if new role list includes admin
        const newRoles = await prisma.role.findMany({
          where: { id: { in: roleIds } },
        });

        const newRolesIncludeAdmin = newRoles.some(
          (role: { name: string }) => role.name.toLowerCase() === 'admin'
        );

        if (!newRolesIncludeAdmin) {
          return new Response(
            JSON.stringify({ error: 'You cannot remove your own Admin role' }),
            { status: 403 }
          );
        }
      }
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
