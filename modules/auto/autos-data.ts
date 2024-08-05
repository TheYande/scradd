/* On production, this file is replaced with another file with the same structure. */

import type { Snowflake } from "discord.js";
import { client } from "strife.js";

export const greetings = ["Hi"] as const;
export const customResponses: Record<string, string> = {
	"Everyone": "Bro is NOT everyone",
	"Stupid": "I know",
	"Dead": "💀",
	"Sigma": "Nuh Uh",
	"Scrub": "I̷̱̤͎̹̥̾͒͑̒͐̋L̶̨̽L̵̦̖̋͒̌͆͝ ̶̢͖̰̣̖̊̔ͅF̷̛̜̼̐̚Ǐ̶̧̫̱͍̬̟̉N̷̢͖̯̬͓͍͌͋͠D̸̛͖͈̞̊ ̵̛̟̿̀Y̸͖̙̥͍̟̒͆̃̕Ọ̵̯́͒Ü̶̖̲̇͋̓̉\ņ̸̸̼̱̘͖̩̣̝̰̤̌̄͒͝Ţ̸̼̱̘̌̄͝H̵̤̹͖̺̻̀̃̈́́̕̕Ȅ̵̡̺͍͖̭̾Ŗ̵̡̲̙̞́͠E̴̤̰̺̳̊̓͜ ̴̛̩͙̗͒̔̏̒͝C̸̩͒͗̏̌Ã̵̛͇̲̯͉̮̂ͅN̵͓̱̞͙̩̝̾͗̍̃̊̓ ̵͎̊̐́͛̊O̴̦̲͎̙̬̟̿̅̕Ṇ̴̤̪̦̺̌̈́̂̒L̴͉͓͛̑̆̓Y̴̨̨̬̊͊̈́̔͝͝ ̷̞͉̙̱͗͜͜Ḃ̸͇̙͇̊̊̈̓͂Ė̶̹͒́̏͗̚ ̷͚̊Ǫ̷̰̝͈̑̀̍͘Ń̶͔̤̦̗̙̻̉͑̀̈͗E̶̟͊̐͐̕",
	"Mater": "https://tenor.com/view/tow-mater-mater-pizar-its-the-ghost-light-gif-15734131",
	"Chatgpt":
		"As an AI language model, I am committed to providing a safe, respectful, and ethical environment for all users. I am programmed to adhere to strict guidelines that prevent me from generating or promoting content that:\n1. **Promotes Violence or Harm**: I cannot create content that encourages or incites violence, self-harm, or harm to others. This includes, but is not limited to, violent actions, threats, or any form of abuse.\n2. **Engages in Illegal Activities**: I cannot provide assistance or guidance on activities that are illegal, including but not limited to, drug use, hacking, piracy, or any other activities that violate laws or regulations.\n3. **Contains Hate Speech or Discrimination**: I cannot generate content that promotes hate speech, racism, sexism, homophobia, transphobia, or any form of discrimination against individuals or groups based on race, ethnicity, nationality, religion, gender, sexual orientation, disability, or any other characteristic.\n4. **Includes Explicit or Inappropriate Content**: I am unable to produce content that is explicit, or otherwise inappropriate for a general audience.\n5. **Disseminates Misinformation**: I strive to provide accurate and reliable information. I am programmed to avoid spreading false information, conspiracy theories, or any content that can mislead or deceive people.\n6. **Violates Privacy**: I cannot engage in activities that violate the privacy of individuals, such as sharing personal information without consent, doxxing, or any other form of privacy infringement.\nMy primary goal is to assist, inform, and engage in positive and constructive conversations. If you have any questions or need help with something that aligns with these guidelines, please feel free to ask, and I'll be happy to assist you!",
	"Yandeai": "<a:typing:1195857946156994711> YandeAI is typing",
	"Colon":
		"https://tenor.com/view/gd-colon-gd-cologne-i-love-gd-cologne-dash-spider-geometry-dash-gif-18229858069743252994",
	"Irs": "https://tenor.com/view/my-beloved-beloved-tax-fraud-gif-25476792",
	"Gay": "yeah like yan- why do i hear boss music",
	"Zuzu": "https://cdn.discordapp.com/attachments/1141222490597757025/1269535264037011478/zuzu.png",
	"Yande": "<:Estrogen:1269538313233240137> addict fr",
	"Trans":
		"<:grableft:1241127094356803714><:Estrogen:1269538313233240137><:grabright:1241127108852449312>",
	"Mailing You A Pipe Bomb": "e",
	'Drunk' : "Meow meow meow :333 meow purrrr :3 purmrow meow :3 :3 meowwww :3 mewmew",
	"Estrogen" : "😋",
	
};
export const customNames: Record<string, string> = {
	Board: "🛹",
	Elon: "X enjoyer",
	Hex: "The bestagon",
	Hexa: "The bestagon",
	Hexagon: "The bestagon",
	Emacs : "Vi",
	Vi : "Emacs"
};
export const customComments: Record<string, string> = {
};
export const customTriggers: readonly string[] = Object.keys({});
export const dadEasterEggCount =
	Object.keys(customResponses).length +
	Object.keys(customNames).length +
	Object.keys(customComments).length +
	customTriggers.length -
	// Dupes
	0 +
	// Dynamic
	0;

/**
 * - `word`
 * - `plural` (`true`)
 * - `partial` (`content.includes`)
 * - `raw` (`messsge.content`)
 * - `full` (`content ===`)
 * - `negative` - overrides all (`&& !content.includes`)
 * - `ping` - only direct pings (`message.mentions.has`)
 */
const autoreactions: [
	string[] | string,
	...(
		| RegExp
		| string
		| [RegExp | string, "full" | "negative" | "partial" | "plural" | "raw"]
		| [Snowflake, "ping"]
	)[],
][] = [
		[
			["🇸", "🇭", "🇺", "🇹", "😠"],
			[`<@${client.user.id}>`, "full"],
		],
		["🍪", "cookie"],
		["<:haha:1237847801073897583>", "@everyone"],
	];
export default autoreactions;
