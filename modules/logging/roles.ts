import {
	Role,
	RoleFlagsBitField,
	roleMention,
	type AuditLogEvent,
	type Snowflake,
} from "discord.js";
import config from "../../common/config.js";
import { joinWithAnd } from "../../util/text.js";
import log, { LogSeverity, LoggingEmojis, extraAuditLogsInfo, type AuditLog } from "./misc.js";
import constants from "../../common/constants.js";

export async function memberRoleUpdate(
	entry: AuditLog<AuditLogEvent.MemberRoleUpdate, "$add" | "$remove">,
): Promise<void> {
	if (!entry.target) return;

	const { $add, $remove } = entry.changes.reduce<{
		$add?: { assignable: Snowflake[]; unassignable: Snowflake[] };
		$remove?: { assignable: Snowflake[]; unassignable: Snowflake[] };
	}>(
		(accumulator, change) =>
			change.key !== "id" && change.new ?
				{
					...accumulator,
					[change.key]: change.new.reduce(
						({ assignable, unassignable }, { flags, id }) => {
							const isAssignable = new RoleFlagsBitField(flags).has("InPrompt");
							(isAssignable ? assignable : unassignable).push(roleMention(id));
							return { assignable, unassignable };
						},
						accumulator[change.key] ?? { assignable: [], unassignable: [] },
					),
				}
			:	accumulator,
		{},
	);

	if ($add?.assignable.length)
		await logRoles(`gained ${joinWithAnd($add.assignable)}`, LogSeverity.Resource);
	if ($add?.unassignable.length)
		await logRoles(`gained ${joinWithAnd($add.unassignable)}`, LogSeverity.ServerChange);

	if ($remove?.assignable.length)
		await logRoles(`lost ${joinWithAnd($remove.assignable)}`, LogSeverity.Resource);
	if ($remove?.unassignable.length)
		await logRoles(`lost ${joinWithAnd($remove.unassignable)}`, LogSeverity.ServerChange);

	async function logRoles(message: string, severity: LogSeverity): Promise<void> {
		if (!entry.target) return;
		await log(
			`${LoggingEmojis.Role} ${entry.target.toString()} ${message}${entry.executor ? ` from ${entry.executor.toString()}` : ""}${extraAuditLogsInfo({ reason: entry.reason })}`,
			severity,
		);
	}
}

export async function roleCreate(entry: AuditLog<AuditLogEvent.RoleCreate>): Promise<void> {
	await log(
		`${LoggingEmojis.Role} ${roleMention(entry.target.id)} created${extraAuditLogsInfo(entry)}`,
		LogSeverity.ImportantUpdate,
	);
}

export async function roleUpdate(
	entry: AuditLog<AuditLogEvent.RoleUpdate, "icon_hash" | "unicode_emoji">,
): Promise<void> {
	let iconChanged = false;

	for (const change of entry.changes) {
		switch (change.key) {
			case "name": {
				await log(
					`${LoggingEmojis.Role} ${roleMention(entry.target.id)} ${
						change.old ? `(@${change.old}) ` : ""
					}renamed to @${
						change.new ||
						(entry.target instanceof Role && entry.target.name) ||
						"deleted-role"
					}${extraAuditLogsInfo(entry)}`,
					LogSeverity.ImportantUpdate,
				);
				break;
			}
			case "color": {
				await log(
					`${LoggingEmojis.Role} ${roleMention(entry.target.id)}’s role color ${
						typeof change.new === "number" && change.new ?
							`set to \`#${change.new.toString(16).padStart(6, "0")}\``
						:	"reset"
					}${extraAuditLogsInfo(entry)}`,
					LogSeverity.ImportantUpdate,
				);
				break;
			}
			case "hoist": {
				await log(
					`${LoggingEmojis.Role} ${roleMention(
						entry.target.id,
					)} set to display role members ${
						change.new ? "separately from" : "combined with"
					} online members${extraAuditLogsInfo(entry)}`,
					LogSeverity.ImportantUpdate,
				);
				break;
			}
			case "mentionable": {
				await log(
					`${LoggingEmojis.Role} ${roleMention(entry.target.id)} set to ${
						change.new ? "" : "dis"
					}allow anyone to @mention this role${extraAuditLogsInfo(entry)}`,
					LogSeverity.ImportantUpdate,
				);
				break;
			}
			case "permissions": {
				await log(
					`${LoggingEmojis.Role} ${roleMention(
						entry.target.id,
					)}’s permissions changed${extraAuditLogsInfo(entry)}`,
					LogSeverity.ImportantUpdate,
					change.new === undefined ?
						{}
					:	{
							buttons: [
								{
									label: "New Permissions",
									url: `${constants.urls.permissions}/${change.new.valueOf()}`,
								},
							],
						},
				);
				break;
			}
			case "icon_hash":
			case "unicode_emoji": {
				iconChanged ||= true;
				break;
			}
			default: {
				break;
			}
		}
	}

	if (!iconChanged || !(entry.target instanceof Role)) return;
	await log(
		`${LoggingEmojis.Role} ${roleMention(entry.target.id)}’s role icon ${
			entry.target.unicodeEmoji ? `set to ${entry.target.unicodeEmoji}`
			: entry.target.icon ? "changed"
			: "removed"
		}${extraAuditLogsInfo(entry)}`,
		LogSeverity.ImportantUpdate,
		{ files: entry.target.icon ? [entry.target.iconURL({ size: 64 }) ?? ""] : [] },
	);
}

export async function roleDelete(role: Role): Promise<void> {
	if (role.guild.id !== config.guild.id) return;
	await log(
		`${LoggingEmojis.Role} @${role.name} (ID: ${role.id}) deleted`,
		LogSeverity.ImportantUpdate,
	);
}
