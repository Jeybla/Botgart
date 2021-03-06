import * as discord from "discord.js";
import { BotgartCommand } from "../BotgartCommand";
import { DesignatedRole } from "../repositories/RegistrationRepository";
import { log } from "../Util";

/**
Testcases:
- run without any changes -> nothing happens (no output either)
- remove role from user manually after registration -> users should get their roles back (output on console)
- remove role from server -> error on console
*/
export class RepairRoles extends BotgartCommand {
    public constructor() {
        super("repairroles", {
                aliases: ["rolerepair"],
                userPermissions: ["ADMINISTRATOR"]
            },
            {
                availableAsDM: true,
                cronable: true
            }
        );
    }

    public command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: Object): void {
        const cl = this.getBotgartClient();
        const designations: DesignatedRole[] = cl.registrationRepository.getDesignatedRoles();
        let g: discord.Guild;
        let m: discord.GuildMember;
        let r: discord.Role;
        designations.forEach(async d => {
            if(!g || g.id != d.guild) {
                // designations come ordered by guild. This trick allows us to
                // find each guild only once.
                g = cl.guilds.cache.find(g => g.id == d.guild);
            }
            r = g.roles.cache.find(role => role.name === d.registration_role);
            m = await guild.members.fetch(d.user); // cache.find(member => member.user.id === d.user);
            if(!r) {
                log("error", "Was supposed to assign role '{0}' to user, but could not find it.".formatUnicorn(d.registration_role));
            } else {
                if(!m) {
                    log("error", "User {0} is not present in this guild.".formatUnicorn(d.user));
                } else {
                    if(!m.roles.cache.find(role => role.name === r.name)) {
                        m.roles.add(r)
                            .then(()   => log("info", "Gave role {0} to user {1}".formatUnicorn(r.name, m.displayName)))
                            .catch(err => log("error", "Could not give role {0} to user {1}: {2}.".formatUnicorn(r.name, m.displayName, err)));
                    }
                }
            }
        });
    }
}

module.exports = RepairRoles;