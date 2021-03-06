import * as discord from "discord.js";
import { BotgartClient } from "../BotgartClient";
import { BotgartCommand } from "../BotgartCommand";
import * as L from "../Locale";

/**
Testcases:

*/
export class Whois extends BotgartCommand {
    constructor() {
        super("whois", {
            aliases: ["whois"],
            args: [
                {
                    id: "name",
                    type: "string"
                }
            ],
        }
        );
    }

    checkArgs(args) {
        return !args || !args.name || args.name.length < 3 ? L.get("HELPTEXT_WHOIS") : undefined;
    }

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: any): void {
        const name = args.name.toLowerCase();
        const res = (<BotgartClient>this.client).registrationRepository.whois(name,
                                                          message.guild.members.cache
                                                                               .filter(m => m.displayName.toLowerCase().search(name) > -1)
                                                                               .map(m => m.user));
        if(res.length === 0) {
            this.reply(message, responsible, L.get("WHOIS_EMPTY_RESULT"));
        } else {
            this.reply(message, responsible, L.get("WHOIS_RESULTS"));
            res.forEach(r => 
                this.reply(message, responsible, "<@{0}> | `{1}`".formatUnicorn(r.discord_user, r.account_name))
            );
        }
    }
}

module.exports = Whois;