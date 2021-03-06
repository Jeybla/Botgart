import convict from "convict";
import fs from 'fs';
import * as Util from "../Util";
import { isValidGuildWars2AccountHandle, isValidWorldId } from "./Validators";
import {Memoizer} from "memoizer-ts";

const configSchema = {
    prefix: {
        doc: 'Prefix to use in discord',
        format: val => {
            if (/.+$/.test(val) === false) {
                throw new Error(`Prefix '${val.first_name}' is not a valid discord prefix`);
            }
        },
        default: ',',
        arg: 'prefix',
        env: 'prefix'
    },
    home_id: {
        doc: 'HomeWorld ID',
        format: val => {
            if (!isValidWorldId(val)){
                throw new Error(`World id '${val}' is not a valid world id`);
            }
        },
        default: 2202, //Riverside FTW
        arg: 'home-id',
        env: 'HOME_ID'
    },
    world_assignments: {
        doc: 'World Role Mapping',
        format: function (values) {
            if (!Array.isArray(values)) {
                throw new Error('must be of type Array');
            }
            for (const value of values) {
                if (value.role !== null && isValidWorldId(value.world_id) == false) {
                    throw new Error('World id is not valid');
                }
                if (value.role === null && value.role === '') {
                    throw new Error('Role is not valid');
                }
            }
        },
        default: [{"world_id": 2202, "role": "rolename (must exist!)"}],
        arg: 'world-assignments',
        env: 'WORLD_ASSIGNMENTS'
    },
    owner_ids: {
        format: val => {
            if (!Array.isArray(val)) {
                throw new Error(`Owner ids should be an array`);
            }
            for (const singleOwnerId of val) {
                if (/\d+$/.test(singleOwnerId) === false) {
                    throw new Error(`Owner id '${singleOwnerId}' is not a valid discord snowflake`);
                }
            }
        },
        default: [],
        arg: 'owner-ids',
        env: 'OWNER_IDS'
    },
    token: {
        format: val => {
            if (/.+$/.test(val) === false) {
                throw new Error(`Token '${val.first_name}' is not a valid discord token`);
            }
        },
        default: '',
        arg: 'token',
        env: 'TOKEN'
    },
    ts_unregister_protection: {
        format: values => {
            if (!Array.isArray(values)) {
                throw new Error(`ts_unregister_protection should be an array`);
            }
            for (const value of values) {
                if (!isValidGuildWars2AccountHandle(value)) {
                    throw new Error(`'${value}' is not a valid GuildWars 2 Account Handle`);
                }
            }
        },
        default: [],
        arg: 'ts-unregister-protection',
        env: 'TS_UNREGISTER_PROTECTION'
    },
    ts_commander_check_interval: {
        format: 'nat',
        default: 300000,
        arg: 'ts-commander-check-interval',
        env: 'TS_COMMANDER_CHECK_INTERVAL'  
    },
    ts_listener: {
        ip: {
            format: String,
            default: 'localhost',
            arg: 'ts-listener-ip',
            env: 'TS_LISTENER_IP'
        },
        port: {
            format: 'port',
            default: '10137',
            arg: 'ts-listener-port',
            env: 'TS_LISTENER_PORT'
        },
        channel_delay: {
            format: 'nat',
            default: 300,
            arg: 'ts-listener-channel-delay',
            env: 'TS_LISTENER_CHANNEL_DELAY'
        },
        user_delay: {
            format: 'nat',
            default: 300,
            arg: 'ts-listener-user-delay',
            env: 'TS_LISTENER_USER_DELAY'
        },
        grace_period: {
            format: Number,
            default: 60,
            arg: 'ts-listener-grace-delay',
            env: 'TS_LISTENER_GRACE_DELAY'
        },
        broadcast_channel: {
            format: String,
            default: 'raid announcements',
            arg: 'ts-listener-broadcast_channel',
            env: 'TS_LISTENER_BROADCAST_CHANNEL'
        },
        ping_role: {
            format: String,
            default: 'Raiders',
            arg: 'ts-listener-ping-role',
            env: 'TS_LISTENER_PING_ROLE'
        },
        commander_role: {
            format: String,
            default: 'Commander',
            arg: 'ts-listener-commander-role',
            env: 'TS_LISTENER_COMMANDER_ROLE'
        },
    },
    http: {
        host: {
            format: String,
            default: 'localhost',
            arg: 'http-host',
            env: 'HTTP_HOST'
        },
        port: {
            format: 'port',
            default: '3000',
            arg: 'http-port',
            env: 'HTTP_PORT'
        },
    },
    achievements: {
        channel: {
            format: String,
            default: 'achievements',
            arg: 'achievements-channel',
            env: 'ACHIEVEMENTS_CHANNEL'
        },
        ignoring_roles: {
            format: Array,
            default: ['covert'],
            arg: 'achievements-ignoring_roles',
            env: 'ACHIEVEMENTS_IGNORING_ROLES'
        },
    },
    gw2api: {
        delays: {
            wvw_stats: {
                format: 'nat',
                default: 10000,
                arg: 'gw2api-delays-wvw-stats',
                env: 'GW2API_DELAYS_WVW_STATS'
            },
            wvw_matches: {
                format: 'nat',
                default: 10000,
                arg: 'gw2api-delays-wvw-matches',
                env: 'GW2API_DELAYS_WVW_MATCHES'
            },
        }
    },
    disabled: {
        listeners: {
            format: Array,
            default: [],
            arg: 'disabled-listeners',
            env: 'DISABLED_LISTENERS'
        },
        commands: {
            format: Array,
            default: [],
            arg: 'disabled-commands',
            env: 'DISABLED_COMMANDS'
        },
        inhibitors: {
            format: Array,
            default: [],
            arg: 'disabled-inhibitors',
            env: 'DISABLED_INHIBITORS'
        },
    }
};


const getConfigInternal = Memoizer.makeMemoized(loadConfiguration);
export function getConfig() {
    return getConfigInternal();
}

function loadConfiguration() {
    try {
        const config = convict(configSchema);

        if (fs.existsSync("./config.json")) {
            config.loadFile("./config.json");
        }

        logConfig(config);
        config.validate({allowed: 'strict'});// throws error if config does not conform to schema

        return config;
    } catch (e) {
        Util.log("error", "Could not load configuration: " + e)
        process.exit(1)
    }
}

function logConfig(config: convict.Config<any>) {
    let configJsonString = `${JSON.stringify(config.getProperties(), null, 2)}`;

    //probably we shouldn't log a token.
    configJsonString = configJsonString.replace(config.get("token"), "***REDACTED***")
    Util.log("debug", `Resolved Configuration:\n${configJsonString}`);
}

