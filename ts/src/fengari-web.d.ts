declare module 'fengari-web' {
  interface LuaApi {
    LUA_OK: number;
    LUA_TNIL: number;
    LUA_TBOOLEAN: number;
    LUA_TNUMBER: number;
    LUA_TSTRING: number;
    LUA_TTABLE: number;
    LUA_TFUNCTION: number;
    lua_type(L: unknown, idx: number): number;
    lua_gettop(L: unknown): number;
    lua_pop(L: unknown, n: number): void;
    lua_pushnil(L: unknown): void;
    lua_pushboolean(L: unknown, b: number): void;
    lua_pushnumber(L: unknown, n: number): void;
    lua_pushstring(L: unknown, s: string): void;
    lua_newtable(L: unknown): void;
    lua_settable(L: unknown, idx: number): void;
    lua_getglobal(L: unknown, name: string): void;
    lua_pcall(L: unknown, nargs: number, nresults: number, msgh: number): number;
    lua_next(L: unknown, idx: number): number;
    lua_toboolean(L: unknown, idx: number): number;
    lua_tonumber(L: unknown, idx: number): number;
    lua_tojsstring(L: unknown, idx: number): string;
  }
  interface LauxLib {
    luaL_newstate(): unknown;
    luaL_dostring(L: unknown, s: string): number;
  }
  interface LuaLib {
    luaL_openlibs(L: unknown): void;
  }
  interface FengariExports {
    lua: LuaApi;
    lauxlib: LauxLib;
    lualib: LuaLib;
  }
  export const lua: LuaApi;
  export const lauxlib: LauxLib;
  export const lualib: LuaLib;
  const fengari: FengariExports;
  export default fengari;
}
