import prisma from '../../../../lib/prisma';
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

interface JWTPayload {
  userId: string;
  email: string;
}

// DELETE user with comprehensive safeguards
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;

    // RULE 1: Authorization - Only Admin can delete users
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Authentication required' }),
        { status: 401 }
      );
    }

    let currentUserId: string;
    try {
      const decoded = jwt.verify(token.value, JWT_SECRET) as JWTPayload;
      currentUserId = decoded.userId;
    } catch {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { status: 401 }
      );
    }

    // Verify current user has Admin role
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      include: {
        user_roles: {
          include: { role: true },
        },
      },
    });

    if (!currentUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: User not found' }),
        { status: 401 }
      );
    }

    const isAdmin = currentUser.user_roles.some(
      (ur) => ur.role.name.toLowerCase() === 'admin'
    );

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Only Admin users can delete users' }),
        { status: 403 }
      );
    }

    // RULE 2: Self-Deletion Protection
    if (currentUserId === targetUserId) {
      return new Response(
        JSON.stringify({ 
          error: 'Self-deletion not allowed',
          message: 'You cannot delete your own account. Please contact another administrator.' 
        }),
        { status: 403 }
      );
    }

    // RULE 3: Last-Admin Protection
    // Check if target user has Admin role
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        user_roles: {
          include: { role: true },
        },
      },
    });

    if (!targetUser) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404 }
      );
    }

    const targetIsAdmin = targetUser.user_roles.some(
      (ur) => ur.role.name.toLowerCase() === 'admin'
    );

    if (targetIsAdmin) {
      // Count total admin users
      const adminRole = await prisma.role.findFirst({
        where: { name: { equals: 'admin', mode: 'insensitive' } },
      });

      if (adminRole) {
        const adminCount = await prisma.userRole.count({
          where: { role_id: adminRole.id },
        });

        // Reject deletion if this is the last admin
        if (adminCount <= 1) {
          return new Response(
            JSON.stringify({ 
              error: 'Last admin deletion blocked',
              message: 'Cannot delete the last Admin user. The system must always have at least one administrator.' 
            }),
            { status: 403 }
          );
        }
      }
    }

    // RULE 8: Data Integrity - Transactional deletion with cascade
    await prisma.$transaction(async (tx) => {
      // Delete user_roles first
      await tx.userRole.deleteMany({
        where: { user_id: targetUserId },
      });

      // Delete the user
      await tx.user.delete({
        where: { id: targetUserId },
      });
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `User ${targetUser.email} deleted successfully` 
      }),
      { status: 200 }
    );

  } catch (err: any) {
    console.error('User deletion error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Failed to delete user' }),
      { status: 500 }
    );
  }
}
