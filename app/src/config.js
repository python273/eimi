import DEFAULT_CONFIG from "./default_config.json";
import { merge } from "./utils";

export function refreshConfig() {
    try {
        CONFIG = merge(DEFAULT_CONFIG, JSON.parse(localStorage['cfg-config-user'] || "{}"));
    } catch {
        alert('User config is not valid');
        CONFIG = DEFAULT_CONFIG;
    }
}

export let CONFIG;
refreshConfig();
