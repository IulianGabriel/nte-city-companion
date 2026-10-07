import {sqliteTable,text,integer,primaryKey} from 'drizzle-orm/sqlite-core';
export const progress=sqliteTable('progress',{userId:text('user_id').notNull(),taskId:text('task_id').notNull(),done:integer('done').notNull(),period:text('period').notNull(),revision:integer('revision').notNull().default(1),updatedAt:integer('updated_at').notNull()},t=>[primaryKey({columns:[t.userId,t.taskId]})]);
export const preferences=sqliteTable('preferences',{userId:text('user_id').primaryKey(),settings:text('settings').notNull(),revision:integer('revision').notNull().default(1),updatedAt:integer('updated_at').notNull()});
export const catalog=sqliteTable('catalog',{id:text('id').primaryKey(),payload:text('payload').notNull(),updatedAt:integer('updated_at').notNull()});

export const profiles=sqliteTable('profiles',{userId:text('user_id').primaryKey(),name:text('name').notNull(),avatar:text('avatar').notNull().default(''),revision:integer('revision').notNull().default(1)});
export const awards=sqliteTable('awards',{userId:text('user_id').notNull(),taskId:text('task_id').notNull(),xp:integer('xp').notNull(),count:integer('count').notNull(),period:text('period').notNull(),next:integer('next').notNull(),once:integer('once').notNull()},t=>[primaryKey({columns:[t.userId,t.taskId]})]);

export const sessions=sqliteTable('sessions',{tokenHash:text('token_hash').primaryKey(),userId:text('user_id').notNull(),email:text('email').notNull(),expiresAt:integer('expires_at').notNull()});
export const oauthStates=sqliteTable('oauth_states',{stateHash:text('state_hash').primaryKey(),verifier:text('verifier').notNull(),nonce:text('nonce').notNull(),expiresAt:integer('expires_at').notNull()});
export const avatarImages=sqliteTable('avatar_images',{id:text('id').primaryKey(),payload:text('payload').notNull()});
