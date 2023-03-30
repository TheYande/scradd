import { ButtonStyle, ComponentType, ThreadAutoArchiveDuration } from "discord.js";

import { suggestionsDatabase, suggestionAnswers } from "../../commands/get-top-suggestions.js";
import CONSTANTS from "../../common/CONSTANTS.js";
import { DATABASE_THREAD } from "../../common/database.js";
import censor, { badWordsAllowed } from "../../common/language.js";
import log, { LOG_GROUPS, shouldLog } from "../../common/logging.js";
import warn from "../../common/punishments.js";

import type Event from "../../common/types/event";

const event: Event<"threadUpdate"> = async function event(oldThread, newThread) {
	if (newThread.guild.id !== CONSTANTS.guild.id) return;
	if (!shouldLog(newThread)) return;

	if (newThread.parent?.id === CONSTANTS.channels.suggestions?.id) {
		suggestionsDatabase.data = suggestionsDatabase.data.map((suggestion) =>
			suggestion.id === newThread.id
				? {
						...suggestion,

						answer:
							CONSTANTS.channels.suggestions?.availableTags.find(
								(
									tag,
								): tag is typeof tag & { name: typeof suggestionAnswers[number] } =>
									suggestionAnswers.includes(tag.name) &&
									newThread.appliedTags.includes(tag.id),
							)?.name ?? suggestionAnswers[0],

						title: newThread.name,
				  }
				: suggestion,
		);
	}

	const logs = [];
	if (oldThread.archived !== newThread.archived)
		logs.push(` ${newThread.archived ? "closed" : "opened"}`);
	if (oldThread.locked !== newThread.locked)
		logs.push(` ${newThread.locked ? "locked" : "unlocked"}`);

	if (oldThread.autoArchiveDuration !== newThread.autoArchiveDuration) {
		logs.push(
			`’s hide after inactivity set to ${
				{
					[ThreadAutoArchiveDuration.OneHour]: "1 Hour",
					[ThreadAutoArchiveDuration.OneDay]: "24 Hours",
					[ThreadAutoArchiveDuration.ThreeDays]: "3 Days",
					[ThreadAutoArchiveDuration.OneWeek]: "1 Week",
				}[newThread.autoArchiveDuration ?? ThreadAutoArchiveDuration.OneDay] // TODO: Is this the correct default?
			}`,
		);
	}
	if (oldThread.rateLimitPerUser !== newThread.rateLimitPerUser) {
		logs.push(
			`’s slowmode was set to ${newThread.rateLimitPerUser} second${
				newThread.rateLimitPerUser === 1 ? "" : "s"
			}`,
		);
	}
	// TODO // newThread.appliedTags;
	if (oldThread.flags.has("Pinned") !== newThread.flags.has("Pinned")) {
		await log(
			`📌 Post ${
				newThread.flags.has("Pinned") ? "" : "un"
			}pinned in ${newThread.parent?.toString()}!`,
			"messages",
			{
				components: [
					{
						components: [
							{
								label: "View Post",
								type: ComponentType.Button,
								style: ButtonStyle.Link,
								url: newThread.url,
							},
						],

						type: ComponentType.ActionRow,
					},
				],
			},
		);
	}
	if (
		newThread.archived &&
		(((newThread.name === DATABASE_THREAD || LOG_GROUPS.includes(newThread.name)) &&
			newThread.parent?.id === CONSTANTS.channels.modlogs?.id) ||
			newThread.id === "1029234332977602660")
	)
		await newThread.setArchived(false, "Modlog threads must stay open");

	await Promise.all(
		logs.map(
			async (edit) =>
				await log(
					`📃 Thread ${
						edit.startsWith(" closed") ? `#${newThread.name}` : newThread.toString()
					}${edit}!`,
					"channels",
					{
						components: [
							{
								components: [
									{
										label: "View Thread",
										type: ComponentType.Button,
										style: ButtonStyle.Link,
										url: newThread.url,
									},
								],

								type: ComponentType.ActionRow,
							},
						],
					},
				),
		),
	);
	const censored = censor(newThread.name);
	if (censored && !badWordsAllowed(newThread)) {
		await newThread.setName(oldThread.name, "Censored bad word");
		const owner = await newThread.fetchOwner();
		if (owner?.guildMember) {
			await warn(
				owner.guildMember,
				"Watch your language!",
				censored.strikes,
				`Renamed thread to:\n${newThread.name}`,
			);
		}
	}
};
export default event;
