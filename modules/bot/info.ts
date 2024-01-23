import {
	time,
	type Snowflake,
	TimestampStyles,
	ChannelType,
	ComponentType,
	ButtonStyle,
	GuildMember,
	type User,
	type ChatInputCommandInteraction,
	type ButtonInteraction,
	inlineCode,
} from "discord.js";
import { client } from "strife.js";
import config, { syncConfig } from "../../common/config.js";
import pkg from "../../package.json" assert { type: "json" };
import lockFile from "../../package-lock.json" assert { type: "json" };
import { joinWithAnd } from "../../util/text.js";
import { mentionUser } from "../settings.js";
import log, { LogSeverity, LoggingEmojis } from "../logging/misc.js";
import constants from "../../common/constants.js";
import { gracefulFetch } from "../../util/promises.js";

const designers = "1021061241260740719",
	developers = "1021061241260740720",
	testers = "1021061241260740718";

export default async function info(
	interaction: ChatInputCommandInteraction,
	{ subcommand }: { subcommand: "config" | "credits" | "status" | "emojis" },
) {
	switch (subcommand) {
		case "status": {
			await status(interaction);
			break;
		}
		case "credits": {
			await credits(interaction);
			break;
		}
		case "emojis": {
			const emojis: Record<string, Record<string, string>> = constants.emojis;
			await interaction.reply({ content: "Getting Emojis...", fetchReply: true });
			let emojiString = "";

			for (const category in emojis) {
				if (emojis.hasOwnProperty(category)) {
					const emojiCategory = category;

					const categoryData = emojis[emojiCategory];

					if (categoryData) {
						for (const key in categoryData) {
							emojiString += `${key}-${categoryData[key]}\n`;
						}
					}
				}
			}

			await interaction.editReply({
				content: "",
				embeds: [
					{
						title: "Emojis",
						description: emojiString,
					},
				],
			});

			break;
		}
		case "config": {
			const isStaff =
				config.roles.staff &&
				(interaction.member instanceof GuildMember
					? interaction.member.roles.resolve(config.roles.staff.id)
					: interaction.member?.roles.includes(config.roles.staff.id));
			await interaction.reply({
				embeds: getConfig(),

				components: isStaff
					? [
							{
								type: ComponentType.ActionRow,
								components: [
									{
										style: ButtonStyle.Primary,
										type: ComponentType.Button,
										label: "Sync",
										customId: "_syncConfig",
									},
								],
							},
					  ]
					: [],
			});
			break;
		}
	}
}

async function status(interaction: ChatInputCommandInteraction) {
	const message = await interaction.reply({ content: "Pinging…", fetchReply: true });
	const ScratchOauth = await gracefulFetch(
		"https://stats.uptimerobot.com/api/getMonitorList/4Ggz4Fzo2O",
	);
	const Scrub = await gracefulFetch(
		"https://stats.uptimerobot.com/api/getMonitorList/K2V4js80Pk",
	);
	let fields = ScratchOauth.psp.monitors.map(({ statusClass, name }:{statusClass:string,name:string}) => ({ value: constants.zws, name: `${statusClass == "danger" ? "<:icons_outage:1199113890584342628>":"<:green:1196987578881150976>"}${name}` }));
fields.push({
name: `${Scrub.psp.monitors[0].statusClass == "danger" ? "<:icons_outage:1199113890584342628>":"<:green:1196987578881150976>"}${Scrub.psp.monitors[0].name}`,
value: constants.zws
})
const downCount:number = ScratchOauth.statistics.counts.down + Scrub.statistics.counts.down
	await interaction.editReply({
		content: "",

		embeds: [
			{
				title: "Status",
				thumbnail: { url: client.user.displayAvatarURL() },
				color: constants.themeColor,
				description:
					"I’m open-source! The source code is available [on GitHub](https://github.com/YandeMC/scradd/tree/Scrub).",

				fields: [
					{
						name: "⚙️ Mode",
						value: process.env.NODE_ENV === "production" ? "Production" : "Development",
						inline: true,
					},
					{ name: "🔢 Version", value: `v${pkg.version}`, inline: true },
					{
						name: "🔁 Last restarted",
						value: time(client.readyAt, TimestampStyles.RelativeTime),
						inline: true,
					},
					{
						name: "🏓 Ping",
						value: `${Math.abs(
							message.createdTimestamp - interaction.createdTimestamp,
						).toLocaleString()}ms`,
						inline: true,
					},
					{
						name: "↕️ WebSocket latency",
						value: `${Math.abs(client.ws.ping).toLocaleString()}ms`,
						inline: true,
					},
					{
						name: "💾 RAM usage",
						value:
							(process.memoryUsage.rss() / 1_000_000).toLocaleString([], {
								maximumFractionDigits: 2,
								minimumFractionDigits: 2,
							}) + " MB",
						inline: true,
					},
				],
			},
			{
						
				"fields": fields,
				"author": {
				  "name": "Verification Status"
				},
				"title": downCount != 0 ? `${downCount} services are down! `:"All good!",
				"color": constants.themeColor
			  }
		],
	});
}
async function credits(interaction: ChatInputCommandInteraction) {
	const dependencies = Object.keys(pkg.dependencies)
		.map((name) => {
			const { version } = lockFile.dependencies[name];

			if (version.startsWith("file:")) return [name] as const;

			if (/^https?:\/\//.test(version)) return [name, version] as const;

			if (version.startsWith("git+")) {
				const segments = version.split("+")[1]?.split("#");
				return segments
					? ([`${name}@${segments[1]}`, segments[0]] as const)
					: ([name] as const);
			}
			if (version.startsWith("npm:")) {
				const segments = version.split("@");
				const reference = `${segments.length > 2 ? "@" : ""}${segments.at(-2)}`;
				return [`${reference}@${segments.at(-1)}`, `https://npm.im/${reference}`] as const;
			}

			return [`${name}@${version}`, `https://npm.im/${name}`] as const;
		})
		.sort(([one], [two]) => one.localeCompare(two))
		.map(
			([specifier, link]) =>
				"- " + (link ? `[${inlineCode(specifier)}](${link})` : inlineCode(specifier)),
		);

	const columnLength = Math.ceil(dependencies.length / 2);
	await interaction.reply({
		embeds: [
			{
				title: "Credits",
				description: `Scrub is hosted on [Fly.io](https://fly.io/) using Node.JS ${process.version}.\nBot code "borrowd" from @cobaltt7 and is available [on GitHub](https://github.com/scratchaddons-community/scradd)`,

				fields: [
					{ name: "🧑‍💻 Devs", value: await getRole(developers), inline: true },

					{ name: "🖌️ Designers", value: await getRole(designers), inline: true },
					{
						name: "🧪 yTesters",
						value: await getRole(testers),
						inline: true,
					},
					{
						name: "🗄️ Third-party code libraries",
						value: dependencies.slice(0, columnLength).join("\n"),
						inline: true,
					},
					{
						name: constants.zws,
						value: dependencies.slice(columnLength).join("\n"),
						inline: true,
					},
				],

				color: constants.themeColor,
			},
		],
	});

	async function getRole(roleId: Snowflake): Promise<string> {
		const role = await config.testingGuild?.roles.fetch(roleId);
		const members: { user: User }[] = [...(role?.members.values() ?? [])];

		return joinWithAnd(
			await Promise.all(
				members
					.toSorted((one, two) =>
						one.user.displayName.localeCompare(two.user.displayName),
					)
					.map(({ user }) =>
						mentionUser(user, interaction.user, interaction.guild ?? config.guild),
					),
			),
		);
	}
}
function getConfig() {
	return [
		{
			color: constants.themeColor,
			description: `## Configuration`,
		},
		{
			title: "Channels",
			color: constants.themeColor,

			fields: Object.entries(config.channels)
				.filter(
					(channel): channel is [typeof channel[0], Exclude<typeof channel[1], string>] =>
						typeof channel[1] !== "string",
				)
				.map((channel) => ({
					name: `${channel[0]
						.split("_")
						.map((name) => (name[0] ?? "").toUpperCase() + name.slice(1))
						.join(" ")} ${
						channel[1]?.type === ChannelType.GuildCategory ? "category" : "channel"
					}`,

					value: channel[1]?.toString() ?? "*None*",
					inline: true,
				})),
		},
		{
			title: "Roles",
			color: constants.themeColor,

			fields: Object.entries(config.roles).map((role) => ({
				name: `${role[1]?.unicodeEmoji ? role[1].unicodeEmoji + " " : ""}${role[0]
					.split("_")
					.map((name) => (name[0] ?? "").toUpperCase() + name.slice(1))
					.join(" ")} role`,

				value: role[1]?.toString() ?? "*None*",
				inline: true,
			})),
		},
	];
}

export async function syncConfigButton(interaction: ButtonInteraction) {
	if (
		config.roles.staff &&
		(interaction.member instanceof GuildMember
			? interaction.member.roles.resolve(config.roles.staff.id)
			: interaction.member?.roles.includes(config.roles.staff.id))
	) {
		await syncConfig();
		await interaction.message.edit({ embeds: getConfig() });
		await interaction.reply({
			ephemeral: true,
			content: `${constants.emojis.statuses.yes} Synced configuration!`,
		});
		await log(
			`${
				LoggingEmojis.ServerUpdate
			} Configuration synced by ${interaction.member?.toString()}`,
			LogSeverity.ImportantUpdate,
		);
	} else
		await interaction.reply({
			ephemeral: true,
			content: `${constants.emojis.statuses.no} You don’t have permission to sync my configuration!`,
		});
}
