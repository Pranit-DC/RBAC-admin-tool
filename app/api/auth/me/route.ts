import prisma from '../../../../lib/prisma';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-in-env';

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const cookies = parse(cookieHeader || '');
    const token = cookies.token;
    if (!token) return new Response(JSON.stringify({ user: null }), { status: 200 });

    const payload: any = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return new Response(JSON.stringify({ user: null }), { status: 200 });

    return new Response(JSON.stringify({ user: { id: user.id, email: user.email } }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
  }
}
