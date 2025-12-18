import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../../../lib/prisma';
import { NextRequest } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// STRICT ALLOWLIST: Only these actions are permitted
const ALLOWED_ACTIONS = [
  'CREATE_PERMISSION',
  'ASSIGN_PERMISSION_TO_ROLE',
  'ASSIGN_ROLE_TO_USER',
  'DELETE_PERMISSION',
  'DELETE_USER'
] as const;

type AllowedAction = typeof ALLOWED_ACTIONS[number];

interface ParsedCommand {
  action: AllowedAction | 'UNKNOWN';
  name?: string;
  roleName?: string;
  userEmail?: string;
}

// INTENT VALIDATION: Check if command contains explicit RBAC intent
function hasExplicitRBACIntent(command: string): boolean {
  const lowerCommand = command.toLowerCase().trim();
  
  // Reject conversational/greeting inputs
  const conversationalPatterns = [
    /^(hi|hello|hey|greetings)/,
    /^how are you/,
    /^what('s| is) up/,
    /^test$/,
    /^let('s| us) try/,
    /^can you help/,
    /^tell me about/,
  ];
  
  if (conversationalPatterns.some(pattern => pattern.test(lowerCommand))) {
    return false;
  }
  
  // Require explicit RBAC action keywords
  const rbacKeywords = [
    'create', 'add', 'make',
    'delete', 'remove',
    'assign', 'give', 'grant',
    'permission', 'role', 'user'
  ];
  
  // Command must contain at least 2 RBAC keywords
  const keywordCount = rbacKeywords.filter(keyword => 
    lowerCommand.includes(keyword)
  ).length;
  
  return keywordCount >= 2;
}

async function parseCommand(command: string): Promise<ParsedCommand> {
  // RULE 1: Explicit Intent Requirement - Check before calling AI
  if (!hasExplicitRBACIntent(command)) {
    console.log('Command rejected: No explicit RBAC intent detected');
    return { action: 'UNKNOWN' };
  }

  const prompt = `You are an assistant that helps administrators manage Role-Based Access Control (RBAC) settings.

CRITICAL: You must ONLY respond if the command contains an explicit RBAC action intent.

Strict rules you must follow:

Permission Naming Convention

All permission identifiers must use lowercase dot-notation in the format:
resource.action

Examples of valid permissions:
- users.read
- users.write
- roles.manage
- reports.import

Do NOT use underscores (_), spaces, camelCase, or uppercase letters.

Normalization Requirement

If a user provides a permission name using underscores, spaces, or other separators (e.g., users_test, import reports), you must normalize it to dot-notation (users.test, reports.import) before returning the result.

Allowed Actions Only

You may only return one of the following actions:
- CREATE_PERMISSION
- ASSIGN_PERMISSION_TO_ROLE
- ASSIGN_ROLE_TO_USER
- DELETE_PERMISSION
- DELETE_USER

If the command is conversational, a greeting, or does not contain explicit RBAC intent, you MUST return:
{
  "action": "UNKNOWN"
}

Examples of INVALID commands that must return UNKNOWN:
- "Hello AI"
- "Test"
- "How are you?"
- "Let's try something"
- "Can you help me?"

You must NEVER create roles implicitly.
You must NEVER create or modify protected roles such as Admin.
You must NEVER infer actions from ambiguous input.

Output Format (MANDATORY)

Respond with valid JSON only.
Do NOT include explanations, text, or comments.

Example Output:
{
  "action": "CREATE_PERMISSION",
  "name": "users.test"
}

Command: "${command}"

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "action": "CREATE_PERMISSION" | "ASSIGN_PERMISSION_TO_ROLE" | "ASSIGN_ROLE_TO_USER" | "DELETE_PERMISSION" | "DELETE_USER",
  "name": "resource.action",
  "roleName": "RoleName",
  "userEmail": "user@example.com"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  
  // EDGE CASE 15: Validate AI response - remove markdown, validate JSON
  const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  try {
    const parsed = JSON.parse(jsonText);
    
    // RULE 3: AI Output Allowlisting - Strict validation
    if (!parsed.action) {
      console.error('AI response missing action field');
      return { action: 'UNKNOWN' };
    }
    
    // Validate action is in allowlist
    if (!ALLOWED_ACTIONS.includes(parsed.action as AllowedAction)) {
      console.error(`AI returned disallowed action: ${parsed.action}`);
      return { action: 'UNKNOWN' };
    }
    
    return parsed;
  } catch (err) {
    console.error('AI parsing error:', err, 'Raw text:', text);
    return { action: 'UNKNOWN' };
  }
}

async function executeCommand(parsed: ParsedCommand): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    switch (parsed.action) {
      case 'CREATE_PERMISSION': {
        const { name } = parsed;
        if (!name) {
          return { success: false, message: 'Permission name is required' };
        }

        // EDGE CASE 14: Normalize to lowercase for case-insensitive uniqueness
        const normalizedName = name.toLowerCase();

        const existing = await prisma.permission.findUnique({ where: { name: normalizedName } });
        if (existing) {
          return { success: false, message: `Permission "${normalizedName}" already exists` };
        }

        const permission = await prisma.permission.create({
          data: { 
            name: normalizedName, 
            description: `Allows ${normalizedName} operations`
          },
        });

        // INVARIANT: Auto-assign to Admin role (case-insensitive)
        const allRoles = await prisma.role.findMany();
        const adminRole = allRoles.find(
          (r: { name: string }) => r.name.toLowerCase() === 'admin'
        );

        if (!adminRole) {
          // Rollback: delete the permission we just created
          await prisma.permission.delete({ where: { id: permission.id } });
          return {
            success: false,
            message: 'System error: Admin role not found. Permission creation cancelled.',
          };
        }
        
        // Assign permission to Admin
        await prisma.rolePermission.create({
          data: {
            role_id: adminRole.id,
            permission_id: permission.id,
          },
        });
        
        return { 
          success: true, 
          message: `Permission "${normalizedName}" created and automatically assigned to Admin role.`,
          data: permission 
        };
      }

      case 'ASSIGN_PERMISSION_TO_ROLE': {
        const { name, roleName } = parsed;
        if (!name || !roleName) {
          return { success: false, message: 'Both permission and role names are required' };
        }

        // EDGE CASE 14: Use lowercase for lookups
        const permission = await prisma.permission.findUnique({ where: { name: name.toLowerCase() } });
        const role = await prisma.role.findUnique({ where: { name: roleName.toLowerCase() } });

        if (!permission) {
          return { success: false, message: `Permission "${name}" not found` };
        }
        if (!role) {
          return { success: false, message: `Role "${roleName}" not found` };
        }

        // EDGE CASE 2: Prevent modifying Admin role permissions
        if (role.name.toLowerCase() === 'admin') {
          return { success: false, message: 'Admin role permissions cannot be modified via AI commands' };
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
          return { success: false, message: `Permission "${name}" is already assigned to role "${roleName}"` };
        }

        await prisma.rolePermission.create({
          data: {
            role_id: role.id,
            permission_id: permission.id,
          },
        });

        return { success: true, message: `Permission "${name}" assigned to role "${roleName}" successfully` };
      }

      case 'ASSIGN_ROLE_TO_USER': {
        const { roleName, userEmail } = parsed;
        if (!roleName || !userEmail) {
          return { success: false, message: 'Both role name and user email are required' };
        }

        // EDGE CASE 14: Use lowercase for role lookup
        const role = await prisma.role.findUnique({ where: { name: roleName.toLowerCase() } });
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

      case 'DELETE_PERMISSION': {
        const { name } = parsed;
        if (!name) {
          return { success: false, message: 'Permission name is required' };
        }

        // EDGE CASE 14: Use lowercase for lookup
        const permission = await prisma.permission.findUnique({ where: { name: name.toLowerCase() } });
        if (!permission) {
          return { success: false, message: `Permission "${name}" not found` };
        }

        // EDGE CASE 4: Cascade delete handled by Prisma schema (onDelete: Cascade)
        await prisma.permission.delete({ where: { id: permission.id } });
        return { success: true, message: `Permission "${name}" deleted successfully. All role assignments removed.` };
      }

      case 'DELETE_USER': {
        const { userEmail } = parsed;
        if (!userEmail) {
          return { success: false, message: 'User email is required for deletion' };
        }

        // Find the user by email
        const user = await prisma.user.findUnique({ 
          where: { email: userEmail },
          include: {
            user_roles: {
              include: { role: true },
            },
          },
        });

        if (!user) {
          return { success: false, message: `User "${userEmail}" not found` };
        }

        // SAFETY: Check if target is Admin
        const isTargetAdmin = user.user_roles.some(
          (ur: { role: { name: string } }) => ur.role.name.toLowerCase() === 'admin'
        );

        if (isTargetAdmin) {
          // Count total admins
          const adminRole = await prisma.role.findFirst({
            where: { name: { equals: 'admin', mode: 'insensitive' } },
          });

          if (adminRole) {
            const adminCount = await prisma.userRole.count({
              where: { role_id: adminRole.id },
            });

            if (adminCount <= 1) {
              return { 
                success: false, 
                message: `Cannot delete ${userEmail}: This is the last Admin user. The system must always have at least one administrator.` 
              };
            }
          }
        }

        // Use the DELETE endpoint (which has full authorization checks)
        // Note: AI commands should go through the same endpoint for consistency
        return { 
          success: false, 
          message: `User deletion via AI requires explicit user action. Please use the Users page to delete ${userEmail}.` 
        };
      }

      default:
        // RULE 4: Safe Failure Behavior - No mutations, clear message
        return { 
          success: false, 
          message: 'Command not recognized. No action was taken. Please use explicit RBAC commands like "create permission users.test" or "assign permission users.read to role Editor".' 
        };
    }
  } catch (err: any) {
    // RULE 4: Safe Failure - Log error but return safe message
    console.error('Command execution error:', err);
    return { 
      success: false, 
      message: 'An error occurred while processing your command. No changes were made to the system.' 
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { command } = await req.json();

    if (!command || typeof command !== 'string') {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Command is required' 
        }), 
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'AI service not configured. Please add GEMINI_API_KEY to .env file' 
        }),
        { status: 500 }
      );
    }

    // RULE 5: Backend Enforcement - Intent validation happens server-side
    // Parse command using AI (with built-in intent validation)
    const parsed = await parseCommand(command);

    // RULE 2 & 4: No Guessing, Safe Failure
    // If AI couldn't determine explicit intent, reject immediately
    if (parsed.action === 'UNKNOWN') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Command not recognized. No action was taken. Please provide an explicit RBAC command like "create permission users.test" or "assign role Editor to user@example.com".' 
        }), 
        { status: 200 } // Return 200 with failure message (not a server error)
      );
    }

    // Execute the parsed command (all validations happen here)
    const result = await executeCommand(parsed);

    return new Response(JSON.stringify(result), { status: result.success ? 200 : 400 });
  } catch (err: any) {
    console.error('AI command handler error:', err);
    return new Response(
      JSON.stringify({ 
        success: false,
        message: 'An unexpected error occurred. No changes were made to the system.' 
      }), 
      { status: 500 }
    );
  }
}
