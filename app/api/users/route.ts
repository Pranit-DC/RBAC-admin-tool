import prisma from '../../../lib/prisma';

// GET all users
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        created_at: true,
        user_roles: {
          include: { role: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
    return new Response(JSON.stringify(users), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
