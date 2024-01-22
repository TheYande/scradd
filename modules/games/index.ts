import { ApplicationCommandOptionType, ApplicationCommandType } from "discord.js";
import memoryMatch, { messageDelete, showMemoryInstructions } from "./memoryMatch.js";
import { defineButton, defineChatCommand, defineEvent, defineMenuCommand } from "strife.js";
import { CURRENTLY_PLAYING } from "./misc.js";
import constants from "../../common/constants.js";
import { disableComponents } from "../../util/discord.js";
import hangman from "./hangman.js";
import rps from "./rps.js";

defineChatCommand(
	{ name: "hangman", description: "Try to guess who from the server I’m thinking of" },
	hangman,
);
defineChatCommand(
	{
		name: "rps",
		description: "Play Rock Paper Scissors against someone(or the bot)",
		options: {
			opponent: {
				description: "Opponent (leave blank for solo)",
				type: ApplicationCommandOptionType.User,
			},
			rounds: {
				description: "Number of rounds",
				type: ApplicationCommandOptionType.Integer,
				minValue: 1,
				maxValue: 31,
			},
		},
	},
	rps,
);
defineChatCommand(
	{
		name: "memory-match",
		description: "Play a memory matching game against someone else",
		options: {
			"opponent": {
				description: "A user to challenge",
				type: ApplicationCommandOptionType.User,
				required: true,
			},
			"easy-mode": {
				description: "Show 2 matches per emoji (defaults to false)",
				type: ApplicationCommandOptionType.Boolean,
			},
			"thread": {
				description: "Whether to create a thread for chatting alongside the game",
				type: ApplicationCommandOptionType.Boolean,
			},
			"bonus-turns": {
				description: "Give players another turn when they get a match (defaults to true)",
				type: ApplicationCommandOptionType.Boolean,
			},
		},
		access: false,
	},
	memoryMatch,
);
defineMenuCommand(
	{ name: "Play Memory Match", type: ApplicationCommandType.User, access: true },
	async (interaction) => {
		await memoryMatch(interaction, { opponent: interaction.targetMember ?? undefined });
	},
);
defineEvent.pre("messageDelete", messageDelete);
defineButton("showMemoryInstructions", showMemoryInstructions);

defineButton("endGame", async (interaction, users) => {
	if (!users.split("-").includes(interaction.user.id))
		return await interaction.reply({
			ephemeral: true,
			content: `${constants.emojis.statuses.no} You can’t end someone else’s game!`,
		});

	if (!interaction.message.flags.has("Ephemeral"))
		await interaction.message.edit({
			components: disableComponents(interaction.message.components),
		});

	const current = CURRENTLY_PLAYING.get(interaction.user.id);
	if (!current)
		return await interaction.reply({
			ephemeral: true,
			content: `${constants.emojis.statuses.no} You aren’t playing any games currently!`,
		});

	if (!current.end)
		return await interaction.reply({
			ephemeral: true,
			content: `${constants.emojis.statuses.no} You can’t end this game!`,
		});

	await interaction.deferUpdate();
	return current.end();
});
