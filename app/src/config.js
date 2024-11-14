import { DEFAULT_CONFIG } from "./default_config";
import { merge } from "./utils";

export function refreshConfig() {
    CONFIG = merge(DEFAULT_CONFIG, JSON.parse(localStorage['cfg-config-user'] || "{}"));
}

export let CONFIG;
refreshConfig();
