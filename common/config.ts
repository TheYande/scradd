/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
	ChannelType,
	type NonThreadGuildBasedChannel,
	type Channel,
	type ThreadManager,
	Collection,
} from "discord.js";
import { client } from "strife.js";
import { CUSTOM_ROLE_PREFIX } from "../modules/roles/misc.js";

const IS_TESTING = process.argv.some((file) => file.endsWith(".test.js"));

const guild = IS_TESTING ? undefined : await client.guilds.fetch(process.env.GUILD_ID);
if (guild && !guild.available) throw new ReferenceError("Main guild is unavailable!");
const guilds = guild && (await client.guilds.fetch());
if (guilds) guilds.delete(guild.id);

async function getConfig() {
	const channels = (await guild?.channels.fetch()) ?? new Collection();
	const roles =
		(await guild?.roles.fetch())?.filter(
			(role) => role.editable && !role.name.startsWith(CUSTOM_ROLE_PREFIX),
		) ?? new Collection();

	const mod = roles.find((role) => role.name.toLowerCase().startsWith("mod"));
	return {
		guild: guild!,
		otherGuildIds: guilds ? [...guilds.keys()] : [],
		testingGuild: IS_TESTING
			? undefined
			: await client.guilds.fetch("938438560925761619").catch(() => void 0),

		channels: {
			info: getChannel("Info", ChannelType.GuildCategory, "start"),
			announcements:
				guild?.systemChannel || getChannel("server", ChannelType.GuildText, "start"),
			board: getChannel(
				"board",
				[ChannelType.GuildText, ChannelType.GuildAnnouncement],
				"end",
			),
			tickets: getChannel("contact", ChannelType.GuildText, "start"),
			server: "1138116320249000077",
			welcome: getChannel("welcome", ChannelType.GuildText),

			mod: getChannel("mod-talk", ChannelType.GuildText),
			modlogs:
				guild?.publicUpdatesChannel || getChannel("logs", ChannelType.GuildText, "end"),
			exec: getChannel("exec", ChannelType.GuildText, "start"),
			admin: getChannel("admin", ChannelType.GuildText, "start"),

			general: getChannel("general", ChannelType.GuildText),

			support: "826250884279173162",
			updates: getChannel("updates", ChannelType.GuildText, "partial"),
			suggestions: getChannel("suggestions", ChannelType.GuildForum),
			bugs: getChannel("bug", ChannelType.GuildForum, "start"),
			devs: getChannel("devs", ChannelType.GuildText, "start"),

			advertise:
				getChannel("advertise", ChannelType.GuildText, "partial") ||
				getChannel("promo", ChannelType.GuildText, "partial"),
			bots: getChannel("bots", ChannelType.GuildText, "partial"),

			old_suggestions: getChannel("suggestions", ChannelType.GuildText, "partial"),
		},

		roles: {
			mod,
			exec: roles.find((role) => role.name.toLowerCase().includes("exec")),
			staff: roles.find((role) => role.name.toLowerCase().startsWith("staff")) || mod,
			weekly_winner: roles.find((role) => role.name.toLowerCase().includes("weekly")),
			dev: roles.find((role) => role.name.toLowerCase().startsWith("contributor")),
			epic: roles.find((role) => role.name.toLowerCase().includes("epic")),
			booster: roles.find((role) => role.name.toLowerCase().includes("booster")),
			active: roles.find((role) => role.name.toLowerCase().includes("active")),
		},
	};

	function getChannel<T extends ChannelType>(
		name: string,
		type: T | T[] = [],
		matchType: "end" | "full" | "partial" | "start" = "full",
	): Extract<NonThreadGuildBasedChannel, { type: T }> | undefined {
		const types = new Set<ChannelType>([type].flat());
		return channels.find(
			(channel): channel is Extract<NonThreadGuildBasedChannel, { type: T }> =>
				!!channel &&
				types.has(channel.type) &&
				{
					end: channel.name.endsWith(name),
					full: channel.name === name,
					partial: channel.name.includes(name),
					start: channel.name.startsWith(name),
				}[matchType],
		);
	}
}

const config = await getConfig();
export async function syncConfig() {
	const newConfig = await getConfig();
	config.roles = newConfig.roles;
	config.channels = newConfig.channels;
}
export default config;

const threads = (await guild?.channels.fetchActiveThreads())?.threads || new Collection();
export function getInitialChannelThreads(channel: Extract<Channel, { threads: ThreadManager }>) {
	return threads.filter(({ parent }) => parent?.id === channel.id);
}
