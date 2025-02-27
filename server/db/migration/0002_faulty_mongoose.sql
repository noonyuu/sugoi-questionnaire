CREATE TABLE `options` (
	`id` integer PRIMARY KEY NOT NULL,
	`question_id` integer NOT NULL,
	`option_text` text NOT NULL,
	`position` integer NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` integer PRIMARY KEY NOT NULL,
	`form_id` integer NOT NULL,
	`question_text` text NOT NULL,
	`question_type` text NOT NULL,
	`position` integer NOT NULL,
	`required` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`form_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE cascade
);
