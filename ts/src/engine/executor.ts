import * as fengariNs from 'fengari-web';
import { LuaError } from './types';

const fengari = (fengariNs as unknown as { default: typeof fengariNs }).default ?? fengariNs;
const lua = fengari.lua;
const lauxlib = fengari.lauxlib;
const lualib = fengari.lualib;

type LuaState = ReturnType<typeof lauxlib.luaL_newstate>;

export class LuaExecutor {
  private L: LuaState;

  constructor(luaSource: string, seed: number = 42) {
    this.L = lauxlib.luaL_newstate();
    lualib.luaL_openlibs(this.L);
    this.seedRandom(seed);
    const status = lauxlib.luaL_dostring(this.L, luaSource);
    if (status !== lua.LUA_OK) {
      const err = lua.lua_tojsstring(this.L, -1);
      lua.lua_pop(this.L, 1);
      throw new LuaError(`Lua load error: ${err}`);
    }
  }

  call(fnName: string, ...args: unknown[]): unknown {
    lua.lua_getglobal(this.L, fnName);
    if (lua.lua_type(this.L, -1) !== lua.LUA_TFUNCTION) {
      lua.lua_pop(this.L, 1);
      throw new LuaError(`Lua function not found: ${fnName}`);
    }
    for (const arg of args) {
      this.pushValue(arg);
    }
    const status = lua.lua_pcall(this.L, args.length, 1, 0);
    if (status !== lua.LUA_OK) {
      const err = lua.lua_tojsstring(this.L, -1);
      lua.lua_pop(this.L, 1);
      throw new LuaError(`Lua error in ${fnName}: ${err}`);
    }
    const result = this.pullValue(-1);
    lua.lua_pop(this.L, 1);
    return result;
  }

  private seedRandom(seed: number): void {
    lauxlib.luaL_dostring(this.L, `math.randomseed(${seed})`);
  }

  private pushValue(val: unknown): void {
    if (val === null || val === undefined) {
      lua.lua_pushnil(this.L);
    } else if (typeof val === 'boolean') {
      lua.lua_pushboolean(this.L, val ? 1 : 0);
    } else if (typeof val === 'number') {
      lua.lua_pushnumber(this.L, val);
    } else if (typeof val === 'string') {
      lua.lua_pushstring(this.L, val);
    } else if (Array.isArray(val)) {
      lua.lua_newtable(this.L);
      val.forEach((item, i) => {
        lua.lua_pushnumber(this.L, i + 1);
        this.pushValue(item);
        lua.lua_settable(this.L, -3);
      });
    } else if (typeof val === 'object') {
      lua.lua_newtable(this.L);
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        lua.lua_pushstring(this.L, k);
        this.pushValue(v);
        lua.lua_settable(this.L, -3);
      }
    } else {
      throw new LuaError(`Cannot push value of type ${typeof val} to Lua`);
    }
  }

  private pullValue(idx: number): unknown {
    const t = lua.lua_type(this.L, idx);
    switch (t) {
      case lua.LUA_TNIL:
        return null;
      case lua.LUA_TBOOLEAN:
        return lua.lua_toboolean(this.L, idx) !== 0;
      case lua.LUA_TNUMBER:
        return lua.lua_tonumber(this.L, idx);
      case lua.LUA_TSTRING:
        return lua.lua_tojsstring(this.L, idx);
      case lua.LUA_TTABLE:
        return this.pullTable(idx);
      default:
        return null;
    }
  }

  private pullTable(idx: number): unknown {
    const absIdx = idx < 0 ? lua.lua_gettop(this.L) + idx + 1 : idx;
    const result: Record<string | number, unknown> = {};
    let isArray = true;
    let maxInt = 0;

    lua.lua_pushnil(this.L);
    while (lua.lua_next(this.L, absIdx) !== 0) {
      const keyType = lua.lua_type(this.L, -2);
      let key: string | number;
      if (keyType === lua.LUA_TNUMBER) {
        key = lua.lua_tonumber(this.L, -2) as number;
        if (!Number.isInteger(key) || key < 1) isArray = false;
        else maxInt = Math.max(maxInt, key as number);
      } else {
        key = lua.lua_tojsstring(this.L, -2);
        isArray = false;
      }
      result[key] = this.pullValue(-1);
      lua.lua_pop(this.L, 1);
    }

    if (isArray && maxInt === Object.keys(result).length) {
      const arr: unknown[] = [];
      for (let i = 1; i <= maxInt; i++) arr.push(result[i]);
      return arr;
    }
    return result;
  }
}
