import prisma from '../../../../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-in-env';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return new Response(JSON.stringify({ error: 'Email and password required' }), { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });

    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    const cookie = serialize('token', token, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return new Response(JSON.stringify({ id: user.id, email: user.email }), { status: 200, headers: { 'Set-Cookie': cookie } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Server error' }), { status: 500 });
  }
}
