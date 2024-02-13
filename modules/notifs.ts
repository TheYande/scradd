import { defineEvent } from "strife.js";
import { truncateText } from "../util/text.js";
import { stripMarkdown } from "../util/markdown.js";
import config from "../common/config.js";
import constants from "../common/constants.js";
import { nth } from "../util/numbers.js";
import { AuditLogEvent } from "discord.js";

defineEvent("messageCreate", async (message) => {
	if (message.channel.id === config.channels.updates?.id) {
		await message.startThread({
			name: truncateText(stripMarkdown(message.cleanContent) || "New update!", 50),

			reason: "New upcoming update",
		});
	}
});

defineEvent("guildMemberAdd", async (member) => {
	if (member.guild.id !== config.guild.id) return;

	const countString = config.guild.memberCount.toString();
	const jokes = /^[1-9]0+$/.test(countString)
		? ` (${"🥳".repeat(countString.length - 1)})`
		: countString.includes("69")
		? " (nice)"
		: countString.endsWith("87")
		? ` (WAS THAT THE BITE OF ’87${"⁉".repeat(Math.ceil(countString.length / 2))})`
		: "";
	const memberCount = nth(config.guild.memberCount) + jokes;

	const rawGreetings = [
		`Everybody please welcome ${member.toString()} to the server; they’re our **${memberCount}** member!`,
		`A big shoutout to ${member.toString()}, we’re glad you’ve joined us as our **${memberCount}** member!`,
		`Here we go again… ${member.toString()} is here, our **${memberCount}** member!`,
		`||Do I always have to let you know when there is a new member?|| ${member.toString()} is here (our **${memberCount}**)!`,
		`Is it a bird? Is it a plane? No, it’s ${member.toString()}, our **${memberCount}** member!`,
		`Welcome:tm: ${member.toString()}! You’re our **${memberCount}** member!`,
		`Places, everyone! ${member.toString()}, our **${memberCount}** member, is here!`,
		`${member.toString()}, our **${memberCount}** member, is here! (they didn’t bring pizza though)`,
		`${member.toString()}, the **${memberCount}** member, has joined the circus!`,
		`You have been warned… Welcome to our **${memberCount}** member, ${member.toString()}!`,
		`\`when [user v] joins:\` \`say [Hello, \`${member.toString()}\`!]\` \`set [MEMBER COUNT v] to (${config.guild.memberCount.toLocaleString()})\`${jokes}`,
		`A wild ${member.toString()} appeared (our **${memberCount}** member)`,
		`${member.toString()}, our **${memberCount}** member, just spawned in!`,
		`Act professional, ${member.toString()} is here, our **${memberCount}** member!`,
		`Watch out! ${member.toString()} is here! They’re our **${memberCount}**!`,
		`Rest here weary traveler, ${member.toString()}. You’re the **${memberCount}** member.`,
	] as const;
	const greetings = [
		...rawGreetings,
		...rawGreetings,
		...rawGreetings,
		`I hope ${member.toString()}, our **${memberCount}** member, doesn’t give us up or let us down…`,
	] as const;

	await config.channels.welcome?.send(
		`${constants.emojis.welcome.join} ${
			greetings[Math.floor(Math.random() * greetings.length)] ?? greetings[0]
		}`,
	);
});
defineEvent("guildMemberRemove", async (member) => {
	if (member.guild.id !== config.guild.id) return;

	const auditLogs = await config.guild
		.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberKick })
		.catch(() => void 0);
	const kicked = auditLogs?.entries.first()?.target?.id === member.id;
	const banned = await config.guild.bans.fetch(member).catch(() => void 0);

	const byes =
		banned || kicked
			? ([
					`Oof… **${member.user.displayName}** got booted…`,
					`We don’t talk about what **${member.user.displayName}** did…`,
					`I don’t think this was the best place for **${member.user.displayName}**…`,
					`Whoops, **${member.user.displayName}** angered the mods!`,
					`**${member.user.displayName}** broke the rules and took an 🇱`,
					`**${member.user.displayName}** failed the mods’ ${
						config.roles.staff?.members.size ?? "1"
					}v1`,
					`**${member.user.displayName}** did the no-no.`,
					`**${member.user.displayName}** was banished to the deep pits of hell.`,
					`Oop, the hammer met **${member.user.displayName}**!`,
					`**${member.user.displayName}** needs a life`,
					`**${member.user.displayName}** had a skill issue`,
					`*Somebody* sent **${member.user.displayName}** to a maximum security federal prison`,
					`**${member.user.displayName}** choked on a watermelon`,
					`Could someone help hide **${member.user.displayName}**’s body?`,
					`**${member.user.displayName}** took the candy from the mods’ white van`,
					`**${member.user.displayName}** went to the banlands`,
					`The mods canceled **${member.user.displayName}**`,
			  ] as const)
			: ([
					`Welp… **${member.user.displayName}** decided to leave… what a shame…`,
					`Ahh… **${member.user.displayName}** left us… hope they’ll have safe travels!`,
					`There goes another, bye **${member.user.displayName}**!`,
					`Oop, **${member.user.displayName}** left… will they ever come back?`,
					`Can we get an F in the chat for **${member.user.displayName}**? They left!`,
					`Ope, **${member.user.displayName}** got eaten by an evil kumquat and left!`,
					`**${member.user.displayName}** couldn’t handle it here.`,
					`**${member.user.displayName}** used quantum bogosort and disintegrated.`,
					`**${member.user.displayName}** has vanished into the abyss.`,
					`**${member.user.displayName}** got a life!`,
					`**${member.user.displayName}** decided enough is enough`,
					`**${member.user.displayName}** tried to swim in lava`,
					`**${member.user.displayName}** fell from a high place`,
					`**${member.user.displayName}** didn’t want to live in the same world as Blaze`,
					`**${member.user.displayName}** turned into a fish and suffocated`,
					`Raid Shadow Legends sponsored **${member.user.displayName}**`,
					`And another one’s gone, and another one’s gone, **${member.user.displayName}** bit the dust`,
					`**${member.user.displayName}** went to get some milk`,
			  ] as const);

	await config.channels.welcome?.send(
		`${constants.emojis.welcome[banned ? "ban" : "leave"]} ${
			byes[Math.floor(Math.random() * byes.length)] ?? byes[0]
		}`,
	);
});

defineEvent("guildMemberAdd", async (member) => {
	if (member.guild.id !== config.guild.id) return;
	await config.channels.info?.setName(
		`Info - ${(
			config.guild.memberCount - (config.guild.memberCount > 1005 ? 5 : 0)
		).toLocaleString([], {
			compactDisplay: "short",
			maximumFractionDigits: 1,
			minimumFractionDigits: config.guild.memberCount > 1000 ? 1 : 0,
			notation: "compact",
		})} members`,
		`${member.user.tag} joined the server`,
	);
});
