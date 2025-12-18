import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../../../lib/prisma';
import { NextRequest } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// STRICT ALLOWLIST
const ALLOWED_ACTIONS = [
  'CREATE_PERMISSION',
  'ASSIGN_PERMISSION_TO_ROLE',
  'ASSIGN_ROLE_TO_USER',
  'DELETE_PERMISSION',
  'DELETE_USER',
] as const;

type AllowedAction = typeof ALLOWED_ACTIONS[number];

interface ParsedCommand {
  action: AllowedAction | 'UNKNOWN';
  name?: string;
  roleName?: string;
  userEmail?: string;
}

/* ------------------ INTENT VALIDATION ------------------ */

function hasExplicitRBACIntent(command: string): boolean {
  const lower = command.toLowerCase().trim();

  const conversationalPatterns = [
    /^(hi|hello|hey|greetings)/,
    /^how are you/,
    /^what('s| is) up/,
    /^test$/,
    /^let('s| us) try/,
    /^can you help/,
    /^tell me about/,
  ];

  if (conversationalPatterns.some((p) => p.test(lower))) {
    return false;
  }

  const keywords = [
    'create',
    'add',
    'make',
    'delete',
    'remove',
    'assign',
    'give',
    'grant',
    'permission',
    'role',
    'user',
  ];

  return keywords.filter((k) => lower.includes(k)).length >= 2;
}

/* ------------------ AI PARSING ------------------ */

async function parseCommand(command: string): Promise<ParsedCommand> {
  if (!hasExplicitRBACIntent(command)) {
    return { action: 'UNKNOWN' };
  }

  const prompt = `
You manage RBAC.

Rules:
- Only RBAC actions
- Permission format: resource.action (lowercase, dot notation)
- Never create roles
- Never modify Admin
- If unclear, return { "action": "UNKNOWN" }

Allowed actions:
${ALLOWED_ACTIONS.join(', ')}

Command: "${command}"

Return ONLY valid JSON.
`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text().trim();
  const clean = raw.replace(/```json|```/g, '').trim();

  try {
    const parsed = JSON.parse(clean);

    if (!ALLOWED_ACTIONS.includes(parsed.action)) {
      return { action: 'UNKNOWN' };
    }

    return parsed;
  } catch {
    return { action: 'UNKNOWN' };
  }
}

/* ------------------ COMMAND EXECUTION ------------------ */

async function executeCommand(parsed: ParsedCommand) {
  switch (parsed.action) {
    case 'CREATE_PERMISSION': {
      if (!parsed.name) {
        return { success: false, message: 'Permission name required' };
      }

      const name = parsed.name.toLowerCase();

      const existing = await prisma.permission.findUnique({
        where: { name },
      });

      if (existing) {
        return { success: false, message: 'Permission already exists' };
      }

      const permission = await prisma.permission.create({
        data: {
          name,
          description: `Allows ${name}`,
        },
      });

      // 🔒 Auto-assign to Admin
      const allRoles = await prisma.role.findMany();

      const adminRole = allRoles.find(
        (role: typeof allRoles[number]) =>
          role.name.toLowerCase() === 'admin'
      );

      if (!adminRole) {
        await prisma.permission.delete({ where: { id: permission.id } });
        return {
          success: false,
          message: 'Admin role missing. Creation rolled back.',
        };
      }

      await prisma.rolePermission.create({
        data: {
          role_id: adminRole.id,
          permission_id: permission.id,
        },
      });

      return {
        success: true,
        message: `Permission "${name}" created and assigned to Admin`,
      };
    }

    case 'ASSIGN_PERMISSION_TO_ROLE': {
      if (!parsed.name || !parsed.roleName) {
        return { success: false, message: 'Permission and role required' };
      }

      const permission = await prisma.permission.findUnique({
        where: { name: parsed.name.toLowerCase() },
      });

      const role = await prisma.role.findUnique({
        where: { name: parsed.roleName.toLowerCase() },
      });

      if (!permission || !role) {
        return { success: false, message: 'Permission or role not found' };
      }

      if (role.name.toLowerCase() === 'admin') {
        return {
          success: false,
          message: 'Admin role cannot be modified via AI',
        };
      }

      await prisma.rolePermission.create({
        data: {
          role_id: role.id,
          permission_id: permission.id,
        },
      });

      return { success: true, message: 'Permission assigned successfully' };
    }

    case 'ASSIGN_ROLE_TO_USER': {
      if (!parsed.roleName || !parsed.userEmail) {
        return { success: false, message: 'Role and user required' };
      }

      const role = await prisma.role.findUnique({
        where: { name: parsed.roleName.toLowerCase() },
      });

      const user = await prisma.user.findUnique({
        where: { email: parsed.userEmail },
      });

      if (!role || !user) {
        return { success: false, message: 'User or role not found' };
      }

      await prisma.userRole.create({
        data: {
          user_id: user.id,
          role_id: role.id,
        },
      });

      return { success: true, message: 'Role assigned to user' };
    }

    case 'DELETE_PERMISSION': {
      if (!parsed.name) {
        return { success: false, message: 'Permission required' };
      }

      const permission = await prisma.permission.findUnique({
        where: { name: parsed.name.toLowerCase() },
      });

      if (!permission) {
        return { success: false, message: 'Permission not found' };
      }

      await prisma.permission.delete({ where: { id: permission.id } });

      return { success: true, message: 'Permission deleted' };
    }

    case 'DELETE_USER': {
      return {
        success: false,
        message: 'User deletion must be done manually from UI',
      };
    }

    default:
      return {
        success: false,
        message: 'Command not recognized. No action taken.',
      };
  }
}

/* ------------------ API HANDLER ------------------ */

export async function POST(req: NextRequest) {
  const { command } = await req.json();

  if (!command || typeof command !== 'string') {
    return new Response(
      JSON.stringify({ success: false, message: 'Command required' }),
      { status: 400 }
    );
  }

  if (!process.env.GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({ success: false, message: 'Gemini API not configured' }),
      { status: 500 }
    );
  }

  const parsed = await parseCommand(command);

  if (parsed.action === 'UNKNOWN') {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Command not recognized. No action taken.',
      }),
      { status: 200 }
    );
  }

  const result = await executeCommand(parsed);
  return new Response(JSON.stringify(result), {
    status: result.success ? 200 : 400,
  });
}
