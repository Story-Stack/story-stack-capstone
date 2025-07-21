-- Add parentId column to Message table
ALTER TABLE "Message" ADD COLUMN "parentId" TEXT;

-- Add foreign key constraint for self-relation
ALTER TABLE "Message" ADD CONSTRAINT "Message_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
