-- Drop the existing foreign key constraint
ALTER TABLE channels DROP FOREIGN KEY FKm04jqn111q29b19iq65dycjnb;

-- Ensure course_id is BIGINT to match the courses.id column
ALTER TABLE channels MODIFY COLUMN course_id BIGINT;

-- Recreate the foreign key constraint
ALTER TABLE channels 
ADD CONSTRAINT FKm04jqn111q29b19iq65dycjnb 
FOREIGN KEY (course_id) REFERENCES courses(id); 