import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log('🧹 Cleaning dummy data from database...');

  try {
    // Delete in reverse dependency order to satisfy foreign key constraints
    const deletedGithubCache = await prisma.githubCache.deleteMany();
    console.log(`- Deleted ${deletedGithubCache.count} GithubCache records`);

    const deletedResources = await prisma.projectResource.deleteMany();
    console.log(`- Deleted ${deletedResources.count} ProjectResource records`);

    const deletedNotifications = await prisma.notification.deleteMany();
    console.log(`- Deleted ${deletedNotifications.count} Notification records`);

    const deletedLogs = await prisma.activityLog.deleteMany();
    console.log(`- Deleted ${deletedLogs.count} ActivityLog records`);

    const deletedApprovals = await prisma.approvalHistory.deleteMany();
    console.log(`- Deleted ${deletedApprovals.count} ApprovalHistory records`);

    const deletedReviews = await prisma.projectReview.deleteMany();
    console.log(`- Deleted ${deletedReviews.count} ProjectReview records`);

    const deletedComments = await prisma.comment.deleteMany();
    console.log(`- Deleted ${deletedComments.count} Comment records`);

    const deletedProjectTech = await prisma.projectTechnology.deleteMany();
    console.log(`- Deleted ${deletedProjectTech.count} ProjectTechnology records`);

    const deletedProjects = await prisma.project.deleteMany();
    console.log(`- Deleted ${deletedProjects.count} Project records`);

    const deletedUsers = await prisma.user.deleteMany();
    console.log(`- Deleted ${deletedUsers.count} User records`);

    const deletedTeams = await prisma.team.deleteMany();
    console.log(`- Deleted ${deletedTeams.count} Team records`);

    const deletedTechnologies = await prisma.technology.deleteMany();
    console.log(`- Deleted ${deletedTechnologies.count} Technology records`);

    console.log('✨ Database clean completed successfully! All tables are now empty.');
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDatabase();
