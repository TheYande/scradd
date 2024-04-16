import { ApplicationCommandOptionType, GuildMember, User } from "discord.js";
import type { CustomOperation } from "../util.js";
import badWords from "../../automod/bad-words.js";
import { caesar } from "../../../util/text.js";
import { decodeRegexp, regexpFlags } from "../../automod/misc.js";
import assert from "node:assert";
import constants from "../../../common/constants.js";
import config from "../../../common/config.js";

const data: CustomOperation = {
	name: "debug-bad-words",
	description: "Detect which regular expressions flag a string as inappropriate",
	censored: false,
	options: [
		{
			type: ApplicationCommandOptionType.String,
			name: "string",
			description: "The string to check",
			required: true,
		},
	],
	permissions: (user) =>
		!(user instanceof User) &&
		!!(user instanceof GuildMember ?
			user.roles.resolve(config.roles.staff.id)
		:	user.roles.includes(config.roles.staff.id)),

	async command(interaction, { string }) {
		assert(typeof string === "string");

		const matches = badWords
			.flat(2)
			.map((regex) => {
				if (new RegExp(caesar(regex.source), regexpFlags).test(string))
					return { regex: regex.source, raw: true };
				if (new RegExp(decodeRegexp(regex), regexpFlags).test(string))
					return { regex: regex.source, raw: false };
			})
			.filter(Boolean)
			.sort((a, b) => +b.raw - +a.raw || a.regex.localeCompare(b.regex));

		if (!matches.length) {
			await interaction.reply({
				content: `${constants.emojis.statuses.no} No regular expressions matched \`${string}\`.`,
				ephemeral: true,
			});
			return;
		}

		await interaction.reply({
			content: `${
				constants.emojis.statuses.yes
			} \`${string}\` matches the following regular expressions:\n${matches
				.map((match) =>
					match.raw ?
						`- [\`/${match.regex}/\`](<https://regex101.com/?${new URLSearchParams({
							flavor: "javascript",
							regex: match.regex,
							testString: string,
							delimiter: "/",
							flags: regexpFlags,
						}).toString()}>)`
					:	`- \`/${match.regex}/\`*`,
				)
				.join("\n")}${
				matches.some((match) => !match.raw) ?
					"\n\n*\\*Only matches after evasion restrictions are applied*"
				:	""
			}`,
			ephemeral: true,
		});
	},
};

export default data;
