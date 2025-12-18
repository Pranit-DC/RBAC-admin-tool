import prisma from '../../../lib/prisma';
import { NextRequest } from 'next/server';

// GET all roles
export async function GET() {
  try {
    const roles = await prisma.role.findMany({
      include: {
        role_permissions: {
          include: { permission: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
    return new Response(JSON.stringify(roles), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// POST create role
export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    
    if (!name) {
      return new Response(JSON.stringify({ error: 'Name is required' }), { status: 400 });
    }

    const existing = await prisma.role.findUnique({ where: { name } });
    if (existing) {
      return new Response(JSON.stringify({ error: 'Role already exists' }), { status: 409 });
    }

    const role = await prisma.role.create({
      data: { name },
    });

    return new Response(JSON.stringify(role), { status: 201 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
