(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/app/utils/authToken.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "AUTH_TOKEN_KEY": ()=>AUTH_TOKEN_KEY,
    "clearAuthToken": ()=>clearAuthToken,
    "getAuthToken": ()=>getAuthToken,
    "getAuthUser": ()=>getAuthUser,
    "setAuthToken": ()=>setAuthToken,
    "setAuthUser": ()=>setAuthUser
});
const AUTH_TOKEN_KEY = "authToken";
function getAuthToken() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    return localStorage.getItem(AUTH_TOKEN_KEY);
}
function setAuthToken(token) {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    localStorage.setItem(AUTH_TOKEN_KEY, token);
}
function clearAuthToken() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem("authUser");
}
function setAuthUser(user) {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    localStorage.setItem("authUser", JSON.stringify(user));
}
function getAuthUser() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    const val = localStorage.getItem("authUser");
    return val ? JSON.parse(val) : null;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/app/lib/axiosInstance.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "API_BASE_URL": ()=>API_BASE_URL,
    "axiosInstance": ()=>axiosInstance
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/axios/lib/axios.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$utils$2f$authToken$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/utils/authToken.ts [app-client] (ecmascript)");
;
;
const API_BASE_URL = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_API_BASE_URL || "https://backend.usuals.ai";
const axiosInstance = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].create({
    baseURL: API_BASE_URL,
    withCredentials: true
});
// Attach token on every request ------------------------------------------------
axiosInstance.interceptors.request.use((config)=>{
    const token = (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$utils$2f$authToken$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAuthToken"])();
    if (token) {
        config.headers.Authorization = "Bearer ".concat(token);
    }
    return config;
});
// Wipe credentials & force re-login on 401 -------------------------------------
axiosInstance.interceptors.response.use((res)=>res, (err)=>{
    var _err_response;
    if ((err === null || err === void 0 ? void 0 : (_err_response = err.response) === null || _err_response === void 0 ? void 0 : _err_response.status) === 401) {
        // Clear stored credentials so that AuthProvider shows the login screen
        if ("TURBOPACK compile-time truthy", 1) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$utils$2f$authToken$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clearAuthToken"])();
            window.location.href = "/";
        }
    }
    return Promise.reject(err);
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/app/lib/endpoints.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "ENDPOINTS": ()=>ENDPOINTS
});
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$axiosInstance$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/lib/axiosInstance.ts [app-client] (ecmascript)");
;
const ENDPOINTS = {
    GOOGLE_OAUTH: "".concat(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$axiosInstance$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["API_BASE_URL"], "/auth/google"),
    BACKEND_GOOGLE_REDIRECT: "".concat(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$axiosInstance$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["API_BASE_URL"], "/auth/google-redirect"),
    TOKEN_STATUS: "".concat(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$axiosInstance$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["API_BASE_URL"], "/auth/status")
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/app/context/AuthContext.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "AuthProvider": ()=>AuthProvider,
    "useAuth": ()=>useAuth
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$utils$2f$authToken$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/utils/authToken.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/lib/endpoints.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$axiosInstance$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/lib/axiosInstance.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
;
;
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function useAuth() {
    _s();
    const ctx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (!ctx) throw new Error("AuthContext not found");
    return ctx;
}
_s(useAuth, "/dMy7t63NXD4eYACoT93CePwGrg=");
function AuthProvider(param) {
    let { children } = param;
    _s1();
    const [token, setToken] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "AuthProvider.useState": ()=>{
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            try {
                const stored = localStorage.getItem("authUser");
                return stored ? JSON.parse(stored) : null;
            } catch (e) {
                return null;
            }
        }
    }["AuthProvider.useState"]);
    // Persist user whenever it changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthProvider.useEffect": ()=>{
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            if (user) {
                try {
                    localStorage.setItem("authUser", JSON.stringify(user));
                } catch (e) {}
            } else {
                localStorage.removeItem("authUser");
            }
        }
    }["AuthProvider.useEffect"], [
        user
    ]);
    // Axios instance is already configured globally with getAuthToken()
    const api = __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$axiosInstance$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["axiosInstance"];
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthProvider.useEffect": ()=>{
            // 1️⃣ Check URL for ?token & ?user delivered by backend (browser flow)
            if ("TURBOPACK compile-time truthy", 1) {
                const p = new URLSearchParams(window.location.search);
                const urlToken = p.get("token");
                if (urlToken) {
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$utils$2f$authToken$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setAuthToken"])(urlToken);
                    setToken(urlToken);
                    const userParam = p.get("user");
                    if (userParam) {
                        try {
                            const userObj = JSON.parse(decodeURIComponent(userParam));
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$utils$2f$authToken$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setAuthUser"])(userObj);
                            setUser(userObj);
                        } catch (e) {
                        // ignore parse errors
                        }
                    }
                    // clean query string
                    window.history.replaceState({}, "", window.location.pathname);
                    return;
                }
            }
            const existing = (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$utils$2f$authToken$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAuthToken"])();
            if (existing) {
                setToken(existing);
                return;
            }
            // 2️⃣ If no token in localStorage, check session cookie via status endpoint
            ({
                "AuthProvider.useEffect": async ()=>{
                    try {
                        const res = await fetch(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ENDPOINTS"].TOKEN_STATUS, {
                            credentials: "include"
                        });
                        if (res.ok) {
                            // backend says session valid; store placeholder token
                            setToken("session");
                        }
                    } catch (err) {
                        console.warn("Auth status check failed", err);
                    }
                }
            })["AuthProvider.useEffect"]();
        }
    }["AuthProvider.useEffect"], []);
    const login = ()=>{
        const redirectUri = "".concat(window.location.origin, "/oauth-cb");
        window.location.href = "".concat(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ENDPOINTS"].GOOGLE_OAUTH, "?redirect_uri=").concat(encodeURIComponent(redirectUri));
    };
    const logout = ()=>{
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$utils$2f$authToken$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clearAuthToken"])();
        setToken(null);
        setUser(null);
    };
    const value = {
        isAuthenticated: !!token && !!user,
        token,
        user,
        api,
        login,
        logout
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: value,
        children: !token ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-center min-h-screen bg-gray-100 p-4",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: login,
                className: "px-6 py-3 bg-emerald-600 text-white rounded",
                children: "Sign in with Google"
            }, void 0, false, {
                fileName: "[project]/app/context/AuthContext.tsx",
                lineNumber: 125,
                columnNumber: 11
            }, this)
        }, void 0, false, {
            fileName: "[project]/app/context/AuthContext.tsx",
            lineNumber: 124,
            columnNumber: 9
        }, this) : children
    }, void 0, false, {
        fileName: "[project]/app/context/AuthContext.tsx",
        lineNumber: 122,
        columnNumber: 5
    }, this);
}
_s1(AuthProvider, "kYDxzvJ63sHHece1im8YZP6D7Qg=");
_c = AuthProvider;
var _c;
__turbopack_context__.k.register(_c, "AuthProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=app_9abf2c92._.js.map