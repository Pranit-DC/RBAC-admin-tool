import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../../../lib/prisma';
import { NextRequest } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

interface ParsedCommand {
  action: 'create_permission' | 'create_role' | 'assign_permission_to_role' | 'assign_role_to_user' | 'delete_permission' | 'delete_role' | 'unknown';
  entities: {
    permissionName?: string;
    permissionDescription?: string;
    roleName?: string;
    userEmail?: string;
    targetId?: string;
  };
}

async function parseCommand(command: string): Promise<ParsedCommand> {
  const prompt = `You are an RBAC (Role-Based Access Control) command parser. Parse the following natural language command into a structured JSON format.

Available actions:
- create_permission: Create a new permission
- create_role: Create a new role
- assign_permission_to_role: Assign a permission to a role
- assign_role_to_user: Assign a role to a user
- delete_permission: Delete a permission
- delete_role: Delete a role

IMPORTANT RULES:
1. Always generate a meaningful description for permissions based on the permission name if not explicitly provided
2. Extract entities like permissionName, permissionDescription, roleName, userEmail
3. For permission names, convert natural language to kebab-case (e.g., "publish content" → "publish.content")
4. Generate descriptions that explain what the permission allows

Command: "${command}"

Examples:
- "Create permission publish content" → permissionName: "publish.content", permissionDescription: "Allows publishing and managing content"
- "Give role Editor the permission to edit articles" → roleName: "Editor", permissionName: "edit.articles"
- "Create permission called users.delete with description Delete user accounts" → use the explicit description

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "action": "action_name",
  "entities": {
    "permissionName": "value",
    "roleName": "value",
    "userEmail": "value",
    "permissionDescription": "value"
  }
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  
  // Remove markdown code blocks if present
  const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  try {
    return JSON.parse(jsonText);
  } catch (err) {
    return { action: 'unknown', entities: {} };
  }
}

async function executeCommand(parsed: ParsedCommand): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    switch (parsed.action) {
      case 'create_permission': {
        const { permissionName, permissionDescription } = parsed.entities;
        if (!permissionName) {
          return { success: false, message: 'Permission name is required' };
        }

        const existing = await prisma.permission.findUnique({ where: { name: permissionName } });
        if (existing) {
          return { success: false, message: `Permission "${permissionName}" already exists` };
        }

        const permission = await prisma.permission.create({
          data: { name: permissionName, description: permissionDescription || null },
        });

        return { success: true, message: `Permission "${permissionName}" created successfully`, data: permission };
      }

      case 'create_role': {
        const { roleName } = parsed.entities;
        if (!roleName) {
          return { success: false, message: 'Role name is required' };
        }

        const existing = await prisma.role.findUnique({ where: { name: roleName } });
        if (existing) {
          return { success: false, message: `Role "${roleName}" already exists` };
        }

        const role = await prisma.role.create({
          data: { name: roleName },
        });

        return { success: true, message: `Role "${roleName}" created successfully`, data: role };
      }

      case 'assign_permission_to_role': {
        const { permissionName, roleName } = parsed.entities;
        if (!permissionName || !roleName) {
          return { success: false, message: 'Both permission and role names are required' };
        }

        const permission = await prisma.permission.findUnique({ where: { name: permissionName } });
        const role = await prisma.role.findUnique({ where: { name: roleName } });

        if (!permission) {
          return { success: false, message: `Permission "${permissionName}" not found` };
        }
        if (!role) {
          return { success: false, message: `Role "${roleName}" not found` };
        }

        const existing = await prisma.rolePermission.findUnique({
          where: {
            role_id_permission_id: {
              role_id: role.id,
              permission_id: permission.id,
            },
          },
        });

        if (existing) {
          return { success: false, message: `Permission "${permissionName}" is already assigned to role "${roleName}"` };
        }

        await prisma.rolePermission.create({
          data: {
            role_id: role.id,
            permission_id: permission.id,
          },
        });

        return { success: true, message: `Permission "${permissionName}" assigned to role "${roleName}" successfully` };
      }

      case 'assign_role_to_user': {
        const { roleName, userEmail } = parsed.entities;
        if (!roleName || !userEmail) {
          return { success: false, message: 'Both role name and user email are required' };
        }

        const role = await prisma.role.findUnique({ where: { name: roleName } });
        const user = await prisma.user.findUnique({ where: { email: userEmail } });

        if (!role) {
          return { success: false, message: `Role "${roleName}" not found` };
        }
        if (!user) {
          return { success: false, message: `User "${userEmail}" not found` };
        }

        const existing = await prisma.userRole.findUnique({
          where: {
            user_id_role_id: {
              user_id: user.id,
              role_id: role.id,
            },
          },
        });

        if (existing) {
          return { success: false, message: `Role "${roleName}" is already assigned to user "${userEmail}"` };
        }

        await prisma.userRole.create({
          data: {
            user_id: user.id,
            role_id: role.id,
          },
        });

        return { success: true, message: `Role "${roleName}" assigned to user "${userEmail}" successfully` };
      }

      case 'delete_permission': {
        const { permissionName } = parsed.entities;
        if (!permissionName) {
          return { success: false, message: 'Permission name is required' };
        }

        const permission = await prisma.permission.findUnique({ where: { name: permissionName } });
        if (!permission) {
          return { success: false, message: `Permission "${permissionName}" not found` };
        }

        await prisma.permission.delete({ where: { id: permission.id } });
        return { success: true, message: `Permission "${permissionName}" deleted successfully` };
      }

      case 'delete_role': {
        const { roleName } = parsed.entities;
        if (!roleName) {
          return { success: false, message: 'Role name is required' };
        }

        const role = await prisma.role.findUnique({ where: { name: roleName } });
        if (!role) {
          return { success: false, message: `Role "${roleName}" not found` };
        }

        await prisma.role.delete({ where: { id: role.id } });
        return { success: true, message: `Role "${roleName}" deleted successfully` };
      }

      default:
        return { success: false, message: 'Command not recognized. Please try rephrasing.' };
    }
  } catch (err: any) {
    return { success: false, message: `Error: ${err.message}` };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { command } = await req.json();

    if (!command || typeof command !== 'string') {
      return new Response(JSON.stringify({ error: 'Command is required' }), { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured. Please add GEMINI_API_KEY to .env file' }),
        { status: 500 }
      );
    }

    // Parse command using AI
    const parsed = await parseCommand(command);

    // Execute the parsed command
    const result = await executeCommand(parsed);

    return new Response(JSON.stringify(result), { status: result.success ? 200 : 400 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Failed to process command' }), { status: 500 });
  }
}
