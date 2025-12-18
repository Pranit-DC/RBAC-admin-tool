import prisma from '../../../../../lib/prisma';
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-in-env';

// POST: Assign roles to user
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const { roleIds } = await req.json();

    if (!Array.isArray(roleIds) || roleIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one role must be selected' }),
        { status: 400 }
      );
    }

    // Get current user from JWT
    const cookieHeader = req.headers.get('cookie') || '';
    const cookies = parse(cookieHeader);
    const token = cookies.token;

    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const payload: any = jwt.verify(token, JWT_SECRET);
    const currentUserId = payload.sub;

    // EDGE CASE: Prevent admin from removing their own admin role
    if (currentUserId === userId) {
      // Check if current user IS an admin (relation query, no includes)
      const hasAdminRole = await prisma.userRole.findFirst({
        where: {
          user_id: userId,
          role: {
            name: {
              equals: 'admin',
              mode: 'insensitive',
            },
          },
        },
      });

      if (hasAdminRole) {
        // Fetch roles being assigned
        const newRoles = await prisma.role.findMany({
          where: { id: { in: roleIds } },
        });

                const includesAdmin = newRoles.some(
        (role: { name: string }) => role.name.toLowerCase() === 'admin'
        );


        if (!includesAdmin) {
          return new Response(
            JSON.stringify({ error: 'You cannot remove your own Admin role' }),
            { status: 403 }
          );
        }
      }
    }

    // Remove existing roles
    await prisma.userRole.deleteMany({
      where: { user_id: userId },
    });

    // Assign new roles
    const result = await prisma.userRole.createMany({
      data: roleIds.map((roleId: string) => ({
        user_id: userId,
        role_id: roleId,
      })),
    });

    return new Response(
      JSON.stringify({
        message: 'Roles assigned successfully',
        count: result.count,
      }),
      { status: 200 }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}

// GET: Fetch roles for user
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    const userRoles = await prisma.userRole.findMany({
      where: { user_id: userId },
      include: {
        role: true,
      },
    });

    return new Response(JSON.stringify(userRoles), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
