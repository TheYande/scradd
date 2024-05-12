import {
	ActivityType,
	Message,
	// ChannelType,
	MessageFlags,
	TimestampStyles,
	chatInputApplicationCommandMention,
	time,
	userMention,
} from "discord.js";
import { client } from "strife.js";
import config from "../../common/config.js";
// import constants from "../../common/constants.js";
import { backupDatabases, prepareExit } from "../../common/database.js";
import { statuses } from "../../common/strings.js";
import { convertBase } from "../../util/numbers.js";
// import { gracefulFetch } from "../../util/promises.js";
import { syncRandomBoard } from "../board/update.js";
import getWeekly, { getChatters } from "../xp/weekly.js";
import {
	BUMPING_THREAD,
	BUMP_COMMAND_ID,
	SpecialReminders,
	remindersDatabase,
	type Reminder,
} from "./misc.js";
import sendQuestion from "../qotd/send.js";
import updateTrivia from "../trivia.js";
import constants from "../../common/constants.js";
import { gracefulFetch } from "../../util/promises.js";

let nextReminder: NodeJS.Timeout | undefined;
export default async function queueReminders(): Promise<NodeJS.Timeout | undefined> {
	if (nextReminder) clearTimeout(nextReminder);

	const interval = getNextInterval();
	if (interval === undefined) return;

	if (interval < 100) {
		return await sendReminders();
	} else {
		nextReminder = setTimeout(sendReminders, interval);
		return nextReminder;
	}
}

async function sendReminders(): Promise<NodeJS.Timeout | undefined> {
	if (nextReminder) clearTimeout(nextReminder);

	const { toSend, toPostpone } = remindersDatabase.data.reduce<{
		toSend: Reminder[];
		toPostpone: Reminder[];
	}>(
		(accumulator, reminder) => {
			accumulator[reminder.date - Date.now() < 500 ? "toSend" : "toPostpone"].push(reminder);
			return accumulator;
		},
		{ toSend: [], toPostpone: [] },
	);
	remindersDatabase.data = toPostpone;

	for (const reminder of toSend) {
		const channel = await client.channels.fetch(reminder.channel).catch(() => void 0);
		if (reminder.user === client.user.id) {
			switch (reminder.id) {
				case SpecialReminders.Weekly: {
					if (!channel?.isTextBased()) continue;

					const nextWeeklyDate = new Date(reminder.date);
					nextWeeklyDate.setUTCDate(nextWeeklyDate.getUTCDate() + 7);

					const chatters = await getChatters();
					const message = await channel.send(await getWeekly(nextWeeklyDate));
					if (!chatters) continue;
					const thread = await message.startThread({
						name: `🏆 Weekly Winners week of ${new Date().toLocaleString([], {
							month: "long",
							day: "numeric",
						})}`,
						reason: "To send all chatters",
					});
					await thread.send(chatters);
					continue;
				}
				case SpecialReminders.UpdateVerificationStatus: {
					remindersDatabase.data = [
						...remindersDatabase.data,
						{
							channel: "0",
							date: Date.now() + 60000 * 5,
							id: SpecialReminders.UpdateVerificationStatus,
							user: client.user.id,
						},
					];

					const ScratchOauth = await gracefulFetch(
						"https://stats.uptimerobot.com/api/getMonitorList/K2V4js80Pk",
					);
					if (!ScratchOauth) return;
					let fields: any[] = [];

					for (const monitor of ScratchOauth.psp.monitors) {
						const re = await gracefulFetch(
							`https://stats.uptimerobot.com/api/getMonitor/K2V4js80Pk?m=${monitor.monitorId}`,
						);
						const statusEmoji =
							re.monitor.statusClass == "success" ?
								"<:green:1196987578881150976>"
							:	"<:icons_outage:1199113890584342628>";
						fields.push({
							name: `${statusEmoji} ${re.monitor.name}`,
							value:
								re.monitor.statusClass == "success" ? constants.zws
								: re.monitor.logs[0] ?
									`Down for ${re.monitor.logs[0]?.duration}(${re.monitor.logs[0]?.reason?.code})`
								:	`No logs.`,
						});
					}
					if (!config.channels.verify) return;
					let verifyMessages: any = await config.channels.verify?.messages.fetch({
						limit: 100,
					});
					if (!verifyMessages) return;
					let messgae: any = verifyMessages.find(
						(msg: Message) => msg.author.id == client.user.id,
					);
					if (!messgae) {
						messgae = await config.channels.verify?.send({ content: "..." });
					}
					const downCount: number = ScratchOauth.statistics.counts.down;
					fields.push({
						name: `Next update <t:${Math.floor(Date.now() / 1000) + 60 * 5}:R>.`,
						value: constants.zws,
					});
					messgae.edit({
						content: ``,
						embeds: [
							{
								fields: fields,

								author: {
									name: "Verification Status",
								},
								title:
									downCount != 0 ?
										`Uh oh! ${downCount} service${
											downCount == 1 ? " is" : "s are"
										} down! `
									:	"All good!",
								color: 16754688,
							},
						],
					});

					continue;
				}
				case SpecialReminders.Bump: {
					if (!channel?.isTextBased()) continue;

					remindersDatabase.data = [
						...remindersDatabase.data,
						{
							channel: BUMPING_THREAD,
							date: Date.now() + 1_800_000,
							reminder: undefined,
							id: SpecialReminders.Bump,
							user: client.user.id,
						},
					];

					await channel.send({
						content: `🔔 @here ${chatInputApplicationCommandMention(
							"bump",
							BUMP_COMMAND_ID,
						)} the server!`,
						allowedMentions: { parse: ["everyone"] },
					});
					continue;
				}
				case SpecialReminders.RebootBot: {
					await prepareExit();
					process.emitWarning(`${client.user.tag} is killing the bot`);
					process.exit(1);
					// Fake “fall-through” since ESLint doesn’t realize this is unreacahble
				}
				case SpecialReminders.CloseThread: {
					if (channel?.isThread()) await channel.setArchived(true, "Close requested");
					continue;
				}
				case SpecialReminders.LockThread: {
					if (channel?.isThread()) await channel.setLocked(true, "Lock requested");
					continue;
				}
				case SpecialReminders.Unban: {
					if (typeof reminder.reminder == "string")
						await config.guild.bans
							.remove(reminder.reminder, "Unbanned after set time period")
							.catch(() => void 0);
					continue;
				}
				case SpecialReminders.BackupDatabases: {
					if (!channel?.isTextBased()) continue;

					remindersDatabase.data = [
						...remindersDatabase.data,
						{
							channel: reminder.channel,
							date: Number(Date.now() + 86_400_000),
							reminder: undefined,
							id: SpecialReminders.BackupDatabases,
							user: client.user.id,
						},
					];

					await backupDatabases(channel);
					continue;
				}
				case SpecialReminders.SyncRandomBoard: {
					remindersDatabase.data = [
						...remindersDatabase.data,
						{
							channel: reminder.channel,
							date: Date.now() + ((Math.random() * 10) / 5 + 0.5) * 60 * 60 * 1000,
							id: SpecialReminders.SyncRandomBoard,
							user: client.user.id,
						},
					];

					await syncRandomBoard();
					continue;
				}
				case SpecialReminders.ChangeStatus: {
					const next = (Number(reminder.reminder) + 1) % statuses.length;

					remindersDatabase.data = [
						...remindersDatabase.data,
						{
							channel: "0",
							date: Date.now() + (Math.random() * 3 + 3) * 3_600_000,
							reminder: next,
							id: SpecialReminders.ChangeStatus,
							user: client.user.id,
						},
					];

					client.user.setActivity({
						type: ActivityType.Custom,
						name: "status",
						state: statuses[next],
					});
					continue;
				}
				case SpecialReminders.QOTD: {
					if (!channel?.isThreadOnly()) continue;
					remindersDatabase.data = [
						...remindersDatabase.data,
						{
							channel: channel.id,
							date: reminder.date + 86_400_000,
							reminder: undefined,
							id: SpecialReminders.QOTD,
							user: client.user.id,
						},
					];
					await sendQuestion(channel);
					continue;
				}
				case SpecialReminders.trivia: {
					await config.channels.trivia?.send("<@&1236545704093028392> new trivia");
					await updateTrivia();
				}
			}
		}
		if (!channel?.isTextBased() || typeof reminder.reminder !== "string") continue;
		const silent = reminder.reminder.startsWith("@silent");
		const content = silent ? reminder.reminder.replace("@silent", "") : reminder.reminder;
		await channel
			.send({
				content: `🔔 ${
					channel.isDMBased() ? "" : userMention(reminder.user) + " "
				}${content.trim()} (from ${time(
					new Date(+convertBase(reminder.id + "", convertBase.MAX_BASE, 10)),
					TimestampStyles.RelativeTime,
				)})`,
				allowedMentions: { users: [reminder.user] },
				flags: silent ? MessageFlags.SuppressNotifications : undefined,
			})
			.catch(() => void 0);
	}

	return await queueReminders();
}

function getNextInterval(): number | undefined {
	const [reminder] = remindersDatabase.data.toSorted((one, two) => one.date - two.date);
	if (!reminder) return;
	return reminder.date - Date.now();
}

await queueReminders();
