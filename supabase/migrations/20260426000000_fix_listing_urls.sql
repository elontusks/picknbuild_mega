-- Fix listing URLs: change pickandbuild.example.com to picknbuild.example.com
UPDATE listings
SET source_url = REPLACE(source_url, 'pickandbuild.example.com', 'picknbuild.example.com')
WHERE source_url LIKE '%pickandbuild.example.com%';
