import prisma from '../../../lib/prisma';
import { NextRequest } from 'next/server';

// GET all permissions
export async function GET() {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: { created_at: 'desc' },
    });
    return new Response(JSON.stringify(permissions), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// POST create permission
export async function POST(req: NextRequest) {
  try {
    const { name, description } = await req.json();
    
    if (!name) {
      return new Response(JSON.stringify({ error: 'Name is required' }), { status: 400 });
    }

    const existing = await prisma.permission.findUnique({ where: { name } });
    if (existing) {
      return new Response(JSON.stringify({ error: 'Permission already exists' }), { status: 409 });
    }

    const permission = await prisma.permission.create({
      data: { name, description },
    });

    return new Response(JSON.stringify(permission), { status: 201 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
