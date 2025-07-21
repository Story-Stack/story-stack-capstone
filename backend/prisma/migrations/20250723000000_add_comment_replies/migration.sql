-- Add parentId column to Comment table
ALTER TABLE "Comment" ADD COLUMN "parentId" TEXT;

-- Add foreign key constraint for self-relation
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
