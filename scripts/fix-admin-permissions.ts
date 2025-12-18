import prisma from '../lib/prisma';

async function fixAdminPermissions() {
  try {
    console.log('🔍 Checking Admin role permissions...\n');

    // Get Admin role
    const adminRole = await prisma.role.findUnique({ 
      where: { name: 'admin' },
      include: {
        role_permissions: {
          include: { permission: true }
        }
      }
    });

    if (!adminRole) {
      console.error('❌ Admin role not found!');
      process.exit(1);
    }

    // Get all permissions
    const allPermissions = await prisma.permission.findMany();

    console.log(`📊 Total permissions in system: ${allPermissions.length}`);
    console.log(`📊 Admin currently has: ${adminRole.role_permissions.length} permissions\n`);

    // Find missing permissions
    const assignedPermissionIds = new Set(
      adminRole.role_permissions.map(rp => rp.permission_id)
    );

    const missingPermissions = allPermissions.filter(
      p => !assignedPermissionIds.has(p.id)
    );

    if (missingPermissions.length === 0) {
      console.log('✅ Admin already has all permissions assigned!');
      await prisma.$disconnect();
      process.exit(0);
    }

    console.log(`⚠️  Found ${missingPermissions.length} missing permissions:\n`);
    missingPermissions.forEach(p => {
      console.log(`   - ${p.name}`);
    });

    console.log('\n🔧 Auto-assigning missing permissions to Admin...\n');

    // Assign missing permissions to Admin
    for (const permission of missingPermissions) {
      await prisma.rolePermission.create({
        data: {
          role_id: adminRole.id,
          permission_id: permission.id,
        },
      });
      console.log(`   ✅ Assigned: ${permission.name}`);
    }

    console.log('\n✅ All permissions now assigned to Admin role!');
    console.log(`📊 Admin now has: ${allPermissions.length} permissions\n`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

fixAdminPermissions();
