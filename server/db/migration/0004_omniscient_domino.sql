PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_forms` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`url` text NOT NULL,
	`form_id` text NOT NULL,
	`provider` text NOT NULL,
	`create_at` text DEFAULT (datetime('now', 'localtime')) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_forms`("id", "url", "form_id", "provider", "create_at") SELECT "id", "url", "form_id", "provider", "create_at" FROM `forms`;--> statement-breakpoint
DROP TABLE `forms`;--> statement-breakpoint
ALTER TABLE `__new_forms` RENAME TO `forms`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `forms_form_id_unique` ON `forms` (`form_id`);--> statement-breakpoint
CREATE INDEX `form_id_index` ON `forms` (`form_id`);