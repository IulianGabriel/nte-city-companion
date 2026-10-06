CREATE TABLE `awards` (
	`user_id` text NOT NULL,
	`task_id` text NOT NULL,
	`xp` integer NOT NULL,
	`count` integer NOT NULL,
	`period` text NOT NULL,
	`next` integer NOT NULL,
	`once` integer NOT NULL,
	PRIMARY KEY(`user_id`, `task_id`)
);

--> statement-breakpoint
CREATE TABLE `profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`avatar` text DEFAULT '' NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL
);

