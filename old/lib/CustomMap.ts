import { HighlightSpanKind } from "typescript";

interface HashMapEntry {
    getHash: () => string;
}

export class HashMap<T extends HashMapEntry, U> {
    _map = new Map<string, {key:T, value:U}>();

    set(key:T, value:U) {
        this._map.set(key.getHash(), {key, value})
    }

    get(key:T):U|undefined {
        return this._map.get(key.getHash())?.value;
    }

    realKeys():T[] {
        return [...this._map.values()].map((tuple)=>tuple.key)
    }
    realValues():U[]{
        return [...this._map.values()].map((tuple)=>tuple.value)
    }
}