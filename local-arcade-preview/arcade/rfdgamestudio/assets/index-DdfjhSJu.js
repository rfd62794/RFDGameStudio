const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/App-CKv-Cxrn.js","assets/useLuaCall-4XWyP9yI.js","assets/GameShell-Cc-3P8Tf.js","assets/proxy-gdqnzXtR.js","assets/createLucideIcon-OnorA957.js","assets/App-CWEhOl1U.css","assets/App-cBJYjrl_.js","assets/zap-B8Fg9A5t.js","assets/shield-BKvdPlS4.js","assets/useGameLoop-CF1OI3Xz.js","assets/Modal-CjYRM6Ci.js","assets/App-B8LPoEUy.css","assets/App-CrUMOjPl.js","assets/useGameState-CJ2YMcTp.js","assets/App-DTWyOwS1.css","assets/App-BaAxLQi8.js","assets/App-C_QE1ECA.css","assets/App-Cru0I2HW.js","assets/App-XH-6Q5_o.css","assets/App-CX30SLR5.js","assets/heart-BPwD1Fyc.js","assets/App-DHxkqi3v.css","assets/App-YDsDaH0k.js","assets/App-CrxoTqTl.js","assets/App-DpkbbMLd.css"])))=>i.map(i=>d[i]);
var Sf=Object.defineProperty;var Of=(a,z,d)=>z in a?Sf(a,z,{enumerable:!0,configurable:!0,writable:!0,value:d}):a[z]=d;var pc=(a,z,d)=>Of(a,typeof z!="symbol"?z+"":z,d);function Rf(a,z){for(var d=0;d<z.length;d++){const k=z[d];if(typeof k!="string"&&!Array.isArray(k)){for(const v in k)if(v!=="default"&&!(v in a)){const P=Object.getOwnPropertyDescriptor(k,v);P&&Object.defineProperty(a,v,P.get?P:{enumerable:!0,get:()=>k[v]})}}}return Object.freeze(Object.defineProperty(a,Symbol.toStringTag,{value:"Module"}))}(function(){const z=document.createElement("link").relList;if(z&&z.supports&&z.supports("modulepreload"))return;for(const v of document.querySelectorAll('link[rel="modulepreload"]'))k(v);new MutationObserver(v=>{for(const P of v)if(P.type==="childList")for(const R of P.addedNodes)R.tagName==="LINK"&&R.rel==="modulepreload"&&k(R)}).observe(document,{childList:!0,subtree:!0});function d(v){const P={};return v.integrity&&(P.integrity=v.integrity),v.referrerPolicy&&(P.referrerPolicy=v.referrerPolicy),v.crossOrigin==="use-credentials"?P.credentials="include":v.crossOrigin==="anonymous"?P.credentials="omit":P.credentials="same-origin",P}function k(v){if(v.ep)return;v.ep=!0;const P=d(v);fetch(v.href,P)}})();function Ji(a){return a&&a.__esModule&&Object.prototype.hasOwnProperty.call(a,"default")?a.default:a}var ji={exports:{}},_l={},zi={exports:{}},ct={};/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var _c;function Nf(){if(_c)return ct;_c=1;var a=Symbol.for("react.element"),z=Symbol.for("react.portal"),d=Symbol.for("react.fragment"),k=Symbol.for("react.strict_mode"),v=Symbol.for("react.profiler"),P=Symbol.for("react.provider"),R=Symbol.for("react.context"),C=Symbol.for("react.forward_ref"),j=Symbol.for("react.suspense"),L=Symbol.for("react.memo"),H=Symbol.for("react.lazy"),w=Symbol.iterator;function B(g){return g===null||typeof g!="object"?null:(g=w&&g[w]||g["@@iterator"],typeof g=="function"?g:null)}var Q={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},ce=Object.assign,$={};function ve(g,S,xe){this.props=g,this.context=S,this.refs=$,this.updater=xe||Q}ve.prototype.isReactComponent={},ve.prototype.setState=function(g,S){if(typeof g!="object"&&typeof g!="function"&&g!=null)throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,g,S,"setState")},ve.prototype.forceUpdate=function(g){this.updater.enqueueForceUpdate(this,g,"forceUpdate")};function se(){}se.prototype=ve.prototype;function $e(g,S,xe){this.props=g,this.context=S,this.refs=$,this.updater=xe||Q}var nn=$e.prototype=new se;nn.constructor=$e,ce(nn,ve.prototype),nn.isPureReactComponent=!0;var Ke=Array.isArray,Xe=Object.prototype.hasOwnProperty,ln={current:null},D={key:!0,ref:!0,__self:!0,__source:!0};function re(g,S,xe){var Ae,pn={},Ze=null,dn=null;if(S!=null)for(Ae in S.ref!==void 0&&(dn=S.ref),S.key!==void 0&&(Ze=""+S.key),S)Xe.call(S,Ae)&&!D.hasOwnProperty(Ae)&&(pn[Ae]=S[Ae]);var mn=arguments.length-2;if(mn===1)pn.children=xe;else if(1<mn){for(var Y=Array(mn),ee=0;ee<mn;ee++)Y[ee]=arguments[ee+2];pn.children=Y}if(g&&g.defaultProps)for(Ae in mn=g.defaultProps,mn)pn[Ae]===void 0&&(pn[Ae]=mn[Ae]);return{$$typeof:a,type:g,key:Ze,ref:dn,props:pn,_owner:ln.current}}function ke(g,S){return{$$typeof:a,type:g.type,key:S,ref:g.ref,props:g.props,_owner:g._owner}}function ge(g){return typeof g=="object"&&g!==null&&g.$$typeof===a}function Oe(g){var S={"=":"=0",":":"=2"};return"$"+g.replace(/[=:]/g,function(xe){return S[xe]})}var tn=/\/+/g;function an(g,S){return typeof g=="object"&&g!==null&&g.key!=null?Oe(""+g.key):S.toString(36)}function sn(g,S,xe,Ae,pn){var Ze=typeof g;(Ze==="undefined"||Ze==="boolean")&&(g=null);var dn=!1;if(g===null)dn=!0;else switch(Ze){case"string":case"number":dn=!0;break;case"object":switch(g.$$typeof){case a:case z:dn=!0}}if(dn)return dn=g,pn=pn(dn),g=Ae===""?"."+an(dn,0):Ae,Ke(pn)?(xe="",g!=null&&(xe=g.replace(tn,"$&/")+"/"),sn(pn,S,xe,"",function(ee){return ee})):pn!=null&&(ge(pn)&&(pn=ke(pn,xe+(!pn.key||dn&&dn.key===pn.key?"":(""+pn.key).replace(tn,"$&/")+"/")+g)),S.push(pn)),1;if(dn=0,Ae=Ae===""?".":Ae+":",Ke(g))for(var mn=0;mn<g.length;mn++){Ze=g[mn];var Y=Ae+an(Ze,mn);dn+=sn(Ze,S,xe,Y,pn)}else if(Y=B(g),typeof Y=="function")for(g=Y.call(g),mn=0;!(Ze=g.next()).done;)Ze=Ze.value,Y=Ae+an(Ze,mn++),dn+=sn(Ze,S,xe,Y,pn);else if(Ze==="object")throw S=String(g),Error("Objects are not valid as a React child (found: "+(S==="[object Object]"?"object with keys {"+Object.keys(g).join(", ")+"}":S)+"). If you meant to render a collection of children, use an array instead.");return dn}function ae(g,S,xe){if(g==null)return g;var Ae=[],pn=0;return sn(g,Ae,"","",function(Ze){return S.call(xe,Ze,pn++)}),Ae}function oe(g){if(g._status===-1){var S=g._result;S=S(),S.then(function(xe){(g._status===0||g._status===-1)&&(g._status=1,g._result=xe)},function(xe){(g._status===0||g._status===-1)&&(g._status=2,g._result=xe)}),g._status===-1&&(g._status=0,g._result=S)}if(g._status===1)return g._result.default;throw g._result}var ze={current:null},M={transition:null},Ce={ReactCurrentDispatcher:ze,ReactCurrentBatchConfig:M,ReactCurrentOwner:ln};function T(){throw Error("act(...) is not supported in production builds of React.")}return ct.Children={map:ae,forEach:function(g,S,xe){ae(g,function(){S.apply(this,arguments)},xe)},count:function(g){var S=0;return ae(g,function(){S++}),S},toArray:function(g){return ae(g,function(S){return S})||[]},only:function(g){if(!ge(g))throw Error("React.Children.only expected to receive a single React element child.");return g}},ct.Component=ve,ct.Fragment=d,ct.Profiler=v,ct.PureComponent=$e,ct.StrictMode=k,ct.Suspense=j,ct.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=Ce,ct.act=T,ct.cloneElement=function(g,S,xe){if(g==null)throw Error("React.cloneElement(...): The argument must be a React element, but you passed "+g+".");var Ae=ce({},g.props),pn=g.key,Ze=g.ref,dn=g._owner;if(S!=null){if(S.ref!==void 0&&(Ze=S.ref,dn=ln.current),S.key!==void 0&&(pn=""+S.key),g.type&&g.type.defaultProps)var mn=g.type.defaultProps;for(Y in S)Xe.call(S,Y)&&!D.hasOwnProperty(Y)&&(Ae[Y]=S[Y]===void 0&&mn!==void 0?mn[Y]:S[Y])}var Y=arguments.length-2;if(Y===1)Ae.children=xe;else if(1<Y){mn=Array(Y);for(var ee=0;ee<Y;ee++)mn[ee]=arguments[ee+2];Ae.children=mn}return{$$typeof:a,type:g.type,key:pn,ref:Ze,props:Ae,_owner:dn}},ct.createContext=function(g){return g={$$typeof:R,_currentValue:g,_currentValue2:g,_threadCount:0,Provider:null,Consumer:null,_defaultValue:null,_globalName:null},g.Provider={$$typeof:P,_context:g},g.Consumer=g},ct.createElement=re,ct.createFactory=function(g){var S=re.bind(null,g);return S.type=g,S},ct.createRef=function(){return{current:null}},ct.forwardRef=function(g){return{$$typeof:C,render:g}},ct.isValidElement=ge,ct.lazy=function(g){return{$$typeof:H,_payload:{_status:-1,_result:g},_init:oe}},ct.memo=function(g,S){return{$$typeof:L,type:g,compare:S===void 0?null:S}},ct.startTransition=function(g){var S=M.transition;M.transition={};try{g()}finally{M.transition=S}},ct.unstable_act=T,ct.useCallback=function(g,S){return ze.current.useCallback(g,S)},ct.useContext=function(g){return ze.current.useContext(g)},ct.useDebugValue=function(){},ct.useDeferredValue=function(g){return ze.current.useDeferredValue(g)},ct.useEffect=function(g,S){return ze.current.useEffect(g,S)},ct.useId=function(){return ze.current.useId()},ct.useImperativeHandle=function(g,S,xe){return ze.current.useImperativeHandle(g,S,xe)},ct.useInsertionEffect=function(g,S){return ze.current.useInsertionEffect(g,S)},ct.useLayoutEffect=function(g,S){return ze.current.useLayoutEffect(g,S)},ct.useMemo=function(g,S){return ze.current.useMemo(g,S)},ct.useReducer=function(g,S,xe){return ze.current.useReducer(g,S,xe)},ct.useRef=function(g){return ze.current.useRef(g)},ct.useState=function(g){return ze.current.useState(g)},ct.useSyncExternalStore=function(g,S,xe){return ze.current.useSyncExternalStore(g,S,xe)},ct.useTransition=function(){return ze.current.useTransition()},ct.version="18.3.1",ct}var hc;function es(){return hc||(hc=1,zi.exports=Nf()),zi.exports}/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var mc;function Cf(){if(mc)return _l;mc=1;var a=es(),z=Symbol.for("react.element"),d=Symbol.for("react.fragment"),k=Object.prototype.hasOwnProperty,v=a.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,P={key:!0,ref:!0,__self:!0,__source:!0};function R(C,j,L){var H,w={},B=null,Q=null;L!==void 0&&(B=""+L),j.key!==void 0&&(B=""+j.key),j.ref!==void 0&&(Q=j.ref);for(H in j)k.call(j,H)&&!P.hasOwnProperty(H)&&(w[H]=j[H]);if(C&&C.defaultProps)for(H in j=C.defaultProps,j)w[H]===void 0&&(w[H]=j[H]);return{$$typeof:z,type:C,key:B,ref:Q,props:w,_owner:v.current}}return _l.Fragment=d,_l.jsx=R,_l.jsxs=R,_l}var gc;function Mf(){return gc||(gc=1,ji.exports=Cf()),ji.exports}var tt=Mf(),_o={},Hi={exports:{}},nr={},Ki={exports:{}},Xi={};/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var yc;function If(){return yc||(yc=1,(function(a){function z(M,Ce){var T=M.length;M.push(Ce);e:for(;0<T;){var g=T-1>>>1,S=M[g];if(0<v(S,Ce))M[g]=Ce,M[T]=S,T=g;else break e}}function d(M){return M.length===0?null:M[0]}function k(M){if(M.length===0)return null;var Ce=M[0],T=M.pop();if(T!==Ce){M[0]=T;e:for(var g=0,S=M.length,xe=S>>>1;g<xe;){var Ae=2*(g+1)-1,pn=M[Ae],Ze=Ae+1,dn=M[Ze];if(0>v(pn,T))Ze<S&&0>v(dn,pn)?(M[g]=dn,M[Ze]=T,g=Ze):(M[g]=pn,M[Ae]=T,g=Ae);else if(Ze<S&&0>v(dn,T))M[g]=dn,M[Ze]=T,g=Ze;else break e}}return Ce}function v(M,Ce){var T=M.sortIndex-Ce.sortIndex;return T!==0?T:M.id-Ce.id}if(typeof performance=="object"&&typeof performance.now=="function"){var P=performance;a.unstable_now=function(){return P.now()}}else{var R=Date,C=R.now();a.unstable_now=function(){return R.now()-C}}var j=[],L=[],H=1,w=null,B=3,Q=!1,ce=!1,$=!1,ve=typeof setTimeout=="function"?setTimeout:null,se=typeof clearTimeout=="function"?clearTimeout:null,$e=typeof setImmediate<"u"?setImmediate:null;typeof navigator<"u"&&navigator.scheduling!==void 0&&navigator.scheduling.isInputPending!==void 0&&navigator.scheduling.isInputPending.bind(navigator.scheduling);function nn(M){for(var Ce=d(L);Ce!==null;){if(Ce.callback===null)k(L);else if(Ce.startTime<=M)k(L),Ce.sortIndex=Ce.expirationTime,z(j,Ce);else break;Ce=d(L)}}function Ke(M){if($=!1,nn(M),!ce)if(d(j)!==null)ce=!0,oe(Xe);else{var Ce=d(L);Ce!==null&&ze(Ke,Ce.startTime-M)}}function Xe(M,Ce){ce=!1,$&&($=!1,se(re),re=-1),Q=!0;var T=B;try{for(nn(Ce),w=d(j);w!==null&&(!(w.expirationTime>Ce)||M&&!Oe());){var g=w.callback;if(typeof g=="function"){w.callback=null,B=w.priorityLevel;var S=g(w.expirationTime<=Ce);Ce=a.unstable_now(),typeof S=="function"?w.callback=S:w===d(j)&&k(j),nn(Ce)}else k(j);w=d(j)}if(w!==null)var xe=!0;else{var Ae=d(L);Ae!==null&&ze(Ke,Ae.startTime-Ce),xe=!1}return xe}finally{w=null,B=T,Q=!1}}var ln=!1,D=null,re=-1,ke=5,ge=-1;function Oe(){return!(a.unstable_now()-ge<ke)}function tn(){if(D!==null){var M=a.unstable_now();ge=M;var Ce=!0;try{Ce=D(!0,M)}finally{Ce?an():(ln=!1,D=null)}}else ln=!1}var an;if(typeof $e=="function")an=function(){$e(tn)};else if(typeof MessageChannel<"u"){var sn=new MessageChannel,ae=sn.port2;sn.port1.onmessage=tn,an=function(){ae.postMessage(null)}}else an=function(){ve(tn,0)};function oe(M){D=M,ln||(ln=!0,an())}function ze(M,Ce){re=ve(function(){M(a.unstable_now())},Ce)}a.unstable_IdlePriority=5,a.unstable_ImmediatePriority=1,a.unstable_LowPriority=4,a.unstable_NormalPriority=3,a.unstable_Profiling=null,a.unstable_UserBlockingPriority=2,a.unstable_cancelCallback=function(M){M.callback=null},a.unstable_continueExecution=function(){ce||Q||(ce=!0,oe(Xe))},a.unstable_forceFrameRate=function(M){0>M||125<M?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):ke=0<M?Math.floor(1e3/M):5},a.unstable_getCurrentPriorityLevel=function(){return B},a.unstable_getFirstCallbackNode=function(){return d(j)},a.unstable_next=function(M){switch(B){case 1:case 2:case 3:var Ce=3;break;default:Ce=B}var T=B;B=Ce;try{return M()}finally{B=T}},a.unstable_pauseExecution=function(){},a.unstable_requestPaint=function(){},a.unstable_runWithPriority=function(M,Ce){switch(M){case 1:case 2:case 3:case 4:case 5:break;default:M=3}var T=B;B=M;try{return Ce()}finally{B=T}},a.unstable_scheduleCallback=function(M,Ce,T){var g=a.unstable_now();switch(typeof T=="object"&&T!==null?(T=T.delay,T=typeof T=="number"&&0<T?g+T:g):T=g,M){case 1:var S=-1;break;case 2:S=250;break;case 5:S=1073741823;break;case 4:S=1e4;break;default:S=5e3}return S=T+S,M={id:H++,callback:Ce,priorityLevel:M,startTime:T,expirationTime:S,sortIndex:-1},T>g?(M.sortIndex=T,z(L,M),d(j)===null&&M===d(L)&&($?(se(re),re=-1):$=!0,ze(Ke,T-g))):(M.sortIndex=S,z(j,M),ce||Q||(ce=!0,oe(Xe))),M},a.unstable_shouldYield=Oe,a.unstable_wrapCallback=function(M){var Ce=B;return function(){var T=B;B=Ce;try{return M.apply(this,arguments)}finally{B=T}}}})(Xi)),Xi}var vc;function Uf(){return vc||(vc=1,Ki.exports=If()),Ki.exports}/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var xc;function Pf(){if(xc)return nr;xc=1;var a=es(),z=Uf();function d(e){for(var n="https://reactjs.org/docs/error-decoder.html?invariant="+e,t=1;t<arguments.length;t++)n+="&args[]="+encodeURIComponent(arguments[t]);return"Minified React error #"+e+"; visit "+n+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}var k=new Set,v={};function P(e,n){R(e,n),R(e+"Capture",n)}function R(e,n){for(v[e]=n,e=0;e<n.length;e++)k.add(n[e])}var C=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),j=Object.prototype.hasOwnProperty,L=/^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,H={},w={};function B(e){return j.call(w,e)?!0:j.call(H,e)?!1:L.test(e)?w[e]=!0:(H[e]=!0,!1)}function Q(e,n,t,r){if(t!==null&&t.type===0)return!1;switch(typeof n){case"function":case"symbol":return!0;case"boolean":return r?!1:t!==null?!t.acceptsBooleans:(e=e.toLowerCase().slice(0,5),e!=="data-"&&e!=="aria-");default:return!1}}function ce(e,n,t,r){if(n===null||typeof n>"u"||Q(e,n,t,r))return!0;if(r)return!1;if(t!==null)switch(t.type){case 3:return!n;case 4:return n===!1;case 5:return isNaN(n);case 6:return isNaN(n)||1>n}return!1}function $(e,n,t,r,i,u,x){this.acceptsBooleans=n===2||n===3||n===4,this.attributeName=r,this.attributeNamespace=i,this.mustUseProperty=t,this.propertyName=e,this.type=n,this.sanitizeURL=u,this.removeEmptyString=x}var ve={};"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(e){ve[e]=new $(e,0,!1,e,null,!1,!1)}),[["acceptCharset","accept-charset"],["className","class"],["htmlFor","for"],["httpEquiv","http-equiv"]].forEach(function(e){var n=e[0];ve[n]=new $(n,1,!1,e[1],null,!1,!1)}),["contentEditable","draggable","spellCheck","value"].forEach(function(e){ve[e]=new $(e,2,!1,e.toLowerCase(),null,!1,!1)}),["autoReverse","externalResourcesRequired","focusable","preserveAlpha"].forEach(function(e){ve[e]=new $(e,2,!1,e,null,!1,!1)}),"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(e){ve[e]=new $(e,3,!1,e.toLowerCase(),null,!1,!1)}),["checked","multiple","muted","selected"].forEach(function(e){ve[e]=new $(e,3,!0,e,null,!1,!1)}),["capture","download"].forEach(function(e){ve[e]=new $(e,4,!1,e,null,!1,!1)}),["cols","rows","size","span"].forEach(function(e){ve[e]=new $(e,6,!1,e,null,!1,!1)}),["rowSpan","start"].forEach(function(e){ve[e]=new $(e,5,!1,e.toLowerCase(),null,!1,!1)});var se=/[\-:]([a-z])/g;function $e(e){return e[1].toUpperCase()}"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(e){var n=e.replace(se,$e);ve[n]=new $(n,1,!1,e,null,!1,!1)}),"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(e){var n=e.replace(se,$e);ve[n]=new $(n,1,!1,e,"http://www.w3.org/1999/xlink",!1,!1)}),["xml:base","xml:lang","xml:space"].forEach(function(e){var n=e.replace(se,$e);ve[n]=new $(n,1,!1,e,"http://www.w3.org/XML/1998/namespace",!1,!1)}),["tabIndex","crossOrigin"].forEach(function(e){ve[e]=new $(e,1,!1,e.toLowerCase(),null,!1,!1)}),ve.xlinkHref=new $("xlinkHref",1,!1,"xlink:href","http://www.w3.org/1999/xlink",!0,!1),["src","href","action","formAction"].forEach(function(e){ve[e]=new $(e,1,!1,e.toLowerCase(),null,!0,!0)});function nn(e,n,t,r){var i=ve.hasOwnProperty(n)?ve[n]:null;(i!==null?i.type!==0:r||!(2<n.length)||n[0]!=="o"&&n[0]!=="O"||n[1]!=="n"&&n[1]!=="N")&&(ce(n,t,i,r)&&(t=null),r||i===null?B(n)&&(t===null?e.removeAttribute(n):e.setAttribute(n,""+t)):i.mustUseProperty?e[i.propertyName]=t===null?i.type===3?!1:"":t:(n=i.attributeName,r=i.attributeNamespace,t===null?e.removeAttribute(n):(i=i.type,t=i===3||i===4&&t===!0?"":""+t,r?e.setAttributeNS(r,n,t):e.setAttribute(n,t))))}var Ke=a.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,Xe=Symbol.for("react.element"),ln=Symbol.for("react.portal"),D=Symbol.for("react.fragment"),re=Symbol.for("react.strict_mode"),ke=Symbol.for("react.profiler"),ge=Symbol.for("react.provider"),Oe=Symbol.for("react.context"),tn=Symbol.for("react.forward_ref"),an=Symbol.for("react.suspense"),sn=Symbol.for("react.suspense_list"),ae=Symbol.for("react.memo"),oe=Symbol.for("react.lazy"),ze=Symbol.for("react.offscreen"),M=Symbol.iterator;function Ce(e){return e===null||typeof e!="object"?null:(e=M&&e[M]||e["@@iterator"],typeof e=="function"?e:null)}var T=Object.assign,g;function S(e){if(g===void 0)try{throw Error()}catch(t){var n=t.stack.trim().match(/\n( *(at )?)/);g=n&&n[1]||""}return`
`+g+e}var xe=!1;function Ae(e,n){if(!e||xe)return"";xe=!0;var t=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{if(n)if(n=function(){throw Error()},Object.defineProperty(n.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(n,[])}catch(Ye){var r=Ye}Reflect.construct(e,[],n)}else{try{n.call()}catch(Ye){r=Ye}e.call(n.prototype)}else{try{throw Error()}catch(Ye){r=Ye}e()}}catch(Ye){if(Ye&&r&&typeof Ye.stack=="string"){for(var i=Ye.stack.split(`
`),u=r.stack.split(`
`),x=i.length-1,W=u.length-1;1<=x&&0<=W&&i[x]!==u[W];)W--;for(;1<=x&&0<=W;x--,W--)if(i[x]!==u[W]){if(x!==1||W!==1)do if(x--,W--,0>W||i[x]!==u[W]){var ue=`
`+i[x].replace(" at new "," at ");return e.displayName&&ue.includes("<anonymous>")&&(ue=ue.replace("<anonymous>",e.displayName)),ue}while(1<=x&&0<=W);break}}}finally{xe=!1,Error.prepareStackTrace=t}return(e=e?e.displayName||e.name:"")?S(e):""}function pn(e){switch(e.tag){case 5:return S(e.type);case 16:return S("Lazy");case 13:return S("Suspense");case 19:return S("SuspenseList");case 0:case 2:case 15:return e=Ae(e.type,!1),e;case 11:return e=Ae(e.type.render,!1),e;case 1:return e=Ae(e.type,!0),e;default:return""}}function Ze(e){if(e==null)return null;if(typeof e=="function")return e.displayName||e.name||null;if(typeof e=="string")return e;switch(e){case D:return"Fragment";case ln:return"Portal";case ke:return"Profiler";case re:return"StrictMode";case an:return"Suspense";case sn:return"SuspenseList"}if(typeof e=="object")switch(e.$$typeof){case Oe:return(e.displayName||"Context")+".Consumer";case ge:return(e._context.displayName||"Context")+".Provider";case tn:var n=e.render;return e=e.displayName,e||(e=n.displayName||n.name||"",e=e!==""?"ForwardRef("+e+")":"ForwardRef"),e;case ae:return n=e.displayName||null,n!==null?n:Ze(e.type)||"Memo";case oe:n=e._payload,e=e._init;try{return Ze(e(n))}catch{}}return null}function dn(e){var n=e.type;switch(e.tag){case 24:return"Cache";case 9:return(n.displayName||"Context")+".Consumer";case 10:return(n._context.displayName||"Context")+".Provider";case 18:return"DehydratedFragment";case 11:return e=n.render,e=e.displayName||e.name||"",n.displayName||(e!==""?"ForwardRef("+e+")":"ForwardRef");case 7:return"Fragment";case 5:return n;case 4:return"Portal";case 3:return"Root";case 6:return"Text";case 16:return Ze(n);case 8:return n===re?"StrictMode":"Mode";case 22:return"Offscreen";case 12:return"Profiler";case 21:return"Scope";case 13:return"Suspense";case 19:return"SuspenseList";case 25:return"TracingMarker";case 1:case 0:case 17:case 2:case 14:case 15:if(typeof n=="function")return n.displayName||n.name||null;if(typeof n=="string")return n}return null}function mn(e){switch(typeof e){case"boolean":case"number":case"string":case"undefined":return e;case"object":return e;default:return""}}function Y(e){var n=e.type;return(e=e.nodeName)&&e.toLowerCase()==="input"&&(n==="checkbox"||n==="radio")}function ee(e){var n=Y(e)?"checked":"value",t=Object.getOwnPropertyDescriptor(e.constructor.prototype,n),r=""+e[n];if(!e.hasOwnProperty(n)&&typeof t<"u"&&typeof t.get=="function"&&typeof t.set=="function"){var i=t.get,u=t.set;return Object.defineProperty(e,n,{configurable:!0,get:function(){return i.call(this)},set:function(x){r=""+x,u.call(this,x)}}),Object.defineProperty(e,n,{enumerable:t.enumerable}),{getValue:function(){return r},setValue:function(x){r=""+x},stopTracking:function(){e._valueTracker=null,delete e[n]}}}}function Ie(e){e._valueTracker||(e._valueTracker=ee(e))}function Te(e){if(!e)return!1;var n=e._valueTracker;if(!n)return!0;var t=n.getValue(),r="";return e&&(r=Y(e)?e.checked?"true":"false":e.value),e=r,e!==t?(n.setValue(e),!0):!1}function rn(e){if(e=e||(typeof document<"u"?document:void 0),typeof e>"u")return null;try{return e.activeElement||e.body}catch{return e.body}}function On(e,n){var t=n.checked;return T({},n,{defaultChecked:void 0,defaultValue:void 0,value:void 0,checked:t??e._wrapperState.initialChecked})}function kn(e,n){var t=n.defaultValue==null?"":n.defaultValue,r=n.checked!=null?n.checked:n.defaultChecked;t=mn(n.value!=null?n.value:t),e._wrapperState={initialChecked:r,initialValue:t,controlled:n.type==="checkbox"||n.type==="radio"?n.checked!=null:n.value!=null}}function Je(e,n){n=n.checked,n!=null&&nn(e,"checked",n,!1)}function le(e,n){Je(e,n);var t=mn(n.value),r=n.type;if(t!=null)r==="number"?(t===0&&e.value===""||e.value!=t)&&(e.value=""+t):e.value!==""+t&&(e.value=""+t);else if(r==="submit"||r==="reset"){e.removeAttribute("value");return}n.hasOwnProperty("value")?N(e,n.type,t):n.hasOwnProperty("defaultValue")&&N(e,n.type,mn(n.defaultValue)),n.checked==null&&n.defaultChecked!=null&&(e.defaultChecked=!!n.defaultChecked)}function Ue(e,n,t){if(n.hasOwnProperty("value")||n.hasOwnProperty("defaultValue")){var r=n.type;if(!(r!=="submit"&&r!=="reset"||n.value!==void 0&&n.value!==null))return;n=""+e._wrapperState.initialValue,t||n===e.value||(e.value=n),e.defaultValue=n}t=e.name,t!==""&&(e.name=""),e.defaultChecked=!!e._wrapperState.initialChecked,t!==""&&(e.name=t)}function N(e,n,t){(n!=="number"||rn(e.ownerDocument)!==e)&&(t==null?e.defaultValue=""+e._wrapperState.initialValue:e.defaultValue!==""+t&&(e.defaultValue=""+t))}var me=Array.isArray;function He(e,n,t,r){if(e=e.options,n){n={};for(var i=0;i<t.length;i++)n["$"+t[i]]=!0;for(t=0;t<e.length;t++)i=n.hasOwnProperty("$"+e[t].value),e[t].selected!==i&&(e[t].selected=i),i&&r&&(e[t].defaultSelected=!0)}else{for(t=""+mn(t),n=null,i=0;i<e.length;i++){if(e[i].value===t){e[i].selected=!0,r&&(e[i].defaultSelected=!0);return}n!==null||e[i].disabled||(n=e[i])}n!==null&&(n.selected=!0)}}function G(e,n){if(n.dangerouslySetInnerHTML!=null)throw Error(d(91));return T({},n,{value:void 0,defaultValue:void 0,children:""+e._wrapperState.initialValue})}function be(e,n){var t=n.value;if(t==null){if(t=n.children,n=n.defaultValue,t!=null){if(n!=null)throw Error(d(92));if(me(t)){if(1<t.length)throw Error(d(93));t=t[0]}n=t}n==null&&(n=""),t=n}e._wrapperState={initialValue:mn(t)}}function Pe(e,n){var t=mn(n.value),r=mn(n.defaultValue);t!=null&&(t=""+t,t!==e.value&&(e.value=t),n.defaultValue==null&&e.defaultValue!==t&&(e.defaultValue=t)),r!=null&&(e.defaultValue=""+r)}function Nn(e){var n=e.textContent;n===e._wrapperState.initialValue&&n!==""&&n!==null&&(e.value=n)}function Un(e){switch(e){case"svg":return"http://www.w3.org/2000/svg";case"math":return"http://www.w3.org/1998/Math/MathML";default:return"http://www.w3.org/1999/xhtml"}}function Mn(e,n){return e==null||e==="http://www.w3.org/1999/xhtml"?Un(n):e==="http://www.w3.org/2000/svg"&&n==="foreignObject"?"http://www.w3.org/1999/xhtml":e}var Zn,ot=(function(e){return typeof MSApp<"u"&&MSApp.execUnsafeLocalFunction?function(n,t,r,i){MSApp.execUnsafeLocalFunction(function(){return e(n,t,r,i)})}:e})(function(e,n){if(e.namespaceURI!=="http://www.w3.org/2000/svg"||"innerHTML"in e)e.innerHTML=n;else{for(Zn=Zn||document.createElement("div"),Zn.innerHTML="<svg>"+n.valueOf().toString()+"</svg>",n=Zn.firstChild;e.firstChild;)e.removeChild(e.firstChild);for(;n.firstChild;)e.appendChild(n.firstChild)}});function o(e,n){if(n){var t=e.firstChild;if(t&&t===e.lastChild&&t.nodeType===3){t.nodeValue=n;return}}e.textContent=n}var de={animationIterationCount:!0,aspectRatio:!0,borderImageOutset:!0,borderImageSlice:!0,borderImageWidth:!0,boxFlex:!0,boxFlexGroup:!0,boxOrdinalGroup:!0,columnCount:!0,columns:!0,flex:!0,flexGrow:!0,flexPositive:!0,flexShrink:!0,flexNegative:!0,flexOrder:!0,gridArea:!0,gridRow:!0,gridRowEnd:!0,gridRowSpan:!0,gridRowStart:!0,gridColumn:!0,gridColumnEnd:!0,gridColumnSpan:!0,gridColumnStart:!0,fontWeight:!0,lineClamp:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,tabSize:!0,widows:!0,zIndex:!0,zoom:!0,fillOpacity:!0,floodOpacity:!0,stopOpacity:!0,strokeDasharray:!0,strokeDashoffset:!0,strokeMiterlimit:!0,strokeOpacity:!0,strokeWidth:!0},h=["Webkit","ms","Moz","O"];Object.keys(de).forEach(function(e){h.forEach(function(n){n=n+e.charAt(0).toUpperCase()+e.substring(1),de[n]=de[e]})});function q(e,n,t){return n==null||typeof n=="boolean"||n===""?"":t||typeof n!="number"||n===0||de.hasOwnProperty(e)&&de[e]?(""+n).trim():n+"px"}function F(e,n){e=e.style;for(var t in n)if(n.hasOwnProperty(t)){var r=t.indexOf("--")===0,i=q(t,n[t],r);t==="float"&&(t="cssFloat"),r?e.setProperty(t,i):e[t]=i}}var J=T({menuitem:!0},{area:!0,base:!0,br:!0,col:!0,embed:!0,hr:!0,img:!0,input:!0,keygen:!0,link:!0,meta:!0,param:!0,source:!0,track:!0,wbr:!0});function f(e,n){if(n){if(J[e]&&(n.children!=null||n.dangerouslySetInnerHTML!=null))throw Error(d(137,e));if(n.dangerouslySetInnerHTML!=null){if(n.children!=null)throw Error(d(60));if(typeof n.dangerouslySetInnerHTML!="object"||!("__html"in n.dangerouslySetInnerHTML))throw Error(d(61))}if(n.style!=null&&typeof n.style!="object")throw Error(d(62))}}function I(e,n){if(e.indexOf("-")===-1)return typeof n.is=="string";switch(e){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var te=null;function Ee(e){return e=e.target||e.srcElement||window,e.correspondingUseElement&&(e=e.correspondingUseElement),e.nodeType===3?e.parentNode:e}var Le=null,De=null,qe=null;function Fe(e){if(e=Ja(e)){if(typeof Le!="function")throw Error(d(280));var n=e.stateNode;n&&(n=Sl(n),Le(e.stateNode,e.type,n))}}function Ve(e){De?qe?qe.push(e):qe=[e]:De=e}function vn(){if(De){var e=De,n=qe;if(qe=De=null,Fe(e),n)for(e=0;e<n.length;e++)Fe(n[e])}}function l(e,n){return e(n)}function s(){}var _=!1;function c(e,n,t){if(_)return e(n,t);_=!0;try{return l(e,n,t)}finally{_=!1,(De!==null||qe!==null)&&(s(),vn())}}function m(e,n){var t=e.stateNode;if(t===null)return null;var r=Sl(t);if(r===null)return null;t=r[n];e:switch(n){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(r=!r.disabled)||(e=e.type,r=!(e==="button"||e==="input"||e==="select"||e==="textarea")),e=!r;break e;default:e=!1}if(e)return null;if(t&&typeof t!="function")throw Error(d(231,n,typeof t));return t}var O=!1;if(C)try{var y={};Object.defineProperty(y,"passive",{get:function(){O=!0}}),window.addEventListener("test",y,y),window.removeEventListener("test",y,y)}catch{O=!1}function ne(e,n,t,r,i,u,x,W,ue){var Ye=Array.prototype.slice.call(arguments,3);try{n.apply(t,Ye)}catch(En){this.onError(En)}}var en=!1,gn=null,Bn=!1,Kn=null,pe={onError:function(e){en=!0,gn=e}};function fn(e,n,t,r,i,u,x,W,ue){en=!1,gn=null,ne.apply(pe,arguments)}function U(e,n,t,r,i,u,x,W,ue){if(fn.apply(this,arguments),en){if(en){var Ye=gn;en=!1,gn=null}else throw Error(d(198));Bn||(Bn=!0,Kn=Ye)}}function Me(e){var n=e,t=e;if(e.alternate)for(;n.return;)n=n.return;else{e=n;do n=e,(n.flags&4098)!==0&&(t=n.return),e=n.return;while(e)}return n.tag===3?t:null}function fe(e){if(e.tag===13){var n=e.memoizedState;if(n===null&&(e=e.alternate,e!==null&&(n=e.memoizedState)),n!==null)return n.dehydrated}return null}function yn(e){if(Me(e)!==e)throw Error(d(188))}function Dn(e){var n=e.alternate;if(!n){if(n=Me(e),n===null)throw Error(d(188));return n!==e?null:e}for(var t=e,r=n;;){var i=t.return;if(i===null)break;var u=i.alternate;if(u===null){if(r=i.return,r!==null){t=r;continue}break}if(i.child===u.child){for(u=i.child;u;){if(u===t)return yn(i),e;if(u===r)return yn(i),n;u=u.sibling}throw Error(d(188))}if(t.return!==r.return)t=i,r=u;else{for(var x=!1,W=i.child;W;){if(W===t){x=!0,t=i,r=u;break}if(W===r){x=!0,r=i,t=u;break}W=W.sibling}if(!x){for(W=u.child;W;){if(W===t){x=!0,t=u,r=i;break}if(W===r){x=!0,r=u,t=i;break}W=W.sibling}if(!x)throw Error(d(189))}}if(t.alternate!==r)throw Error(d(190))}if(t.tag!==3)throw Error(d(188));return t.stateNode.current===t?e:n}function Pn(e){return e=Dn(e),e!==null?In(e):null}function In(e){if(e.tag===5||e.tag===6)return e;for(e=e.child;e!==null;){var n=In(e);if(n!==null)return n;e=e.sibling}return null}var $n=z.unstable_scheduleCallback,ht=z.unstable_cancelCallback,Fn=z.unstable_shouldYield,Jn=z.unstable_requestPaint,Vn=z.unstable_now,ut=z.unstable_getCurrentPriorityLevel,it=z.unstable_ImmediatePriority,Ct=z.unstable_UserBlockingPriority,pt=z.unstable_NormalPriority,Dt=z.unstable_LowPriority,bt=z.unstable_IdlePriority,E=null,ie=null;function cn(e){if(ie&&typeof ie.onCommitFiberRoot=="function")try{ie.onCommitFiberRoot(E,e,void 0,(e.current.flags&128)===128)}catch{}}var on=Math.clz32?Math.clz32:_n,An=Math.log,un=Math.LN2;function _n(e){return e>>>=0,e===0?32:31-(An(e)/un|0)|0}var We=64,xn=4194304;function Sn(e){switch(e&-e){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return e&4194240;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return e&130023424;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 1073741824;default:return e}}function p(e,n){var t=e.pendingLanes;if(t===0)return 0;var r=0,i=e.suspendedLanes,u=e.pingedLanes,x=t&268435455;if(x!==0){var W=x&~i;W!==0?r=Sn(W):(u&=x,u!==0&&(r=Sn(u)))}else x=t&~i,x!==0?r=Sn(x):u!==0&&(r=Sn(u));if(r===0)return 0;if(n!==0&&n!==r&&(n&i)===0&&(i=r&-r,u=n&-n,i>=u||i===16&&(u&4194240)!==0))return n;if((r&4)!==0&&(r|=t&16),n=e.entangledLanes,n!==0)for(e=e.entanglements,n&=r;0<n;)t=31-on(n),i=1<<t,r|=e[t],n&=~i;return r}function X(e,n){switch(e){case 1:case 2:case 4:return n+250;case 8:case 16:case 32:case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return n+5e3;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return-1;case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function K(e,n){for(var t=e.suspendedLanes,r=e.pingedLanes,i=e.expirationTimes,u=e.pendingLanes;0<u;){var x=31-on(u),W=1<<x,ue=i[x];ue===-1?((W&t)===0||(W&r)!==0)&&(i[x]=X(W,n)):ue<=n&&(e.expiredLanes|=W),u&=~W}}function ye(e){return e=e.pendingLanes&-1073741825,e!==0?e:e&1073741824?1073741824:0}function he(){var e=We;return We<<=1,(We&4194240)===0&&(We=64),e}function _e(e){for(var n=[],t=0;31>t;t++)n.push(e);return n}function Ln(e,n,t){e.pendingLanes|=n,n!==536870912&&(e.suspendedLanes=0,e.pingedLanes=0),e=e.eventTimes,n=31-on(n),e[n]=t}function Gn(e,n){var t=e.pendingLanes&~n;e.pendingLanes=n,e.suspendedLanes=0,e.pingedLanes=0,e.expiredLanes&=n,e.mutableReadLanes&=n,e.entangledLanes&=n,n=e.entanglements;var r=e.eventTimes;for(e=e.expirationTimes;0<t;){var i=31-on(t),u=1<<i;n[i]=0,r[i]=-1,e[i]=-1,t&=~u}}function zn(e,n){var t=e.entangledLanes|=n;for(e=e.entanglements;t;){var r=31-on(t),i=1<<r;i&n|e[r]&n&&(e[r]|=n),t&=~i}}var jn=0;function A(e){return e&=-e,1<e?4<e?(e&268435455)!==0?16:536870912:4:1}var V,Ne,wn,Wn,st,Et=!1,tr=[],Ft=null,Vt=null,Mt=null,mt=new Map,Xt=new Map,fr=[],Ba="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");function Fa(e,n){switch(e){case"focusin":case"focusout":Ft=null;break;case"dragenter":case"dragleave":Vt=null;break;case"mouseover":case"mouseout":Mt=null;break;case"pointerover":case"pointerout":mt.delete(n.pointerId);break;case"gotpointercapture":case"lostpointercapture":Xt.delete(n.pointerId)}}function Tr(e,n,t,r,i,u){return e===null||e.nativeEvent!==u?(e={blockedOn:n,domEventName:t,eventSystemFlags:r,nativeEvent:u,targetContainers:[i]},n!==null&&(n=Ja(n),n!==null&&Ne(n)),e):(e.eventSystemFlags|=r,n=e.targetContainers,i!==null&&n.indexOf(i)===-1&&n.push(i),e)}function pr(e,n,t,r,i){switch(n){case"focusin":return Ft=Tr(Ft,e,n,t,r,i),!0;case"dragenter":return Vt=Tr(Vt,e,n,t,r,i),!0;case"mouseover":return Mt=Tr(Mt,e,n,t,r,i),!0;case"pointerover":var u=i.pointerId;return mt.set(u,Tr(mt.get(u)||null,e,n,t,r,i)),!0;case"gotpointercapture":return u=i.pointerId,Xt.set(u,Tr(Xt.get(u)||null,e,n,t,r,i)),!0}return!1}function na(e){var n=la(e.target);if(n!==null){var t=Me(n);if(t!==null){if(n=t.tag,n===13){if(n=fe(t),n!==null){e.blockedOn=n,st(e.priority,function(){wn(t)});return}}else if(n===3&&t.stateNode.current.memoizedState.isDehydrated){e.blockedOn=t.tag===3?t.stateNode.containerInfo:null;return}}}e.blockedOn=null}function ta(e){if(e.blockedOn!==null)return!1;for(var n=e.targetContainers;0<n.length;){var t=b(e.domEventName,e.eventSystemFlags,n[0],e.nativeEvent);if(t===null){t=e.nativeEvent;var r=new t.constructor(t.type,t);te=r,t.target.dispatchEvent(r),te=null}else return n=Ja(t),n!==null&&Ne(n),e.blockedOn=t,!1;n.shift()}return!0}function Va(e,n,t){ta(e)&&t.delete(n)}function yl(){Et=!1,Ft!==null&&ta(Ft)&&(Ft=null),Vt!==null&&ta(Vt)&&(Vt=null),Mt!==null&&ta(Mt)&&(Mt=null),mt.forEach(Va),Xt.forEach(Va)}function Pr(e,n){e.blockedOn===n&&(e.blockedOn=null,Et||(Et=!0,z.unstable_scheduleCallback(z.unstable_NormalPriority,yl)))}function ra(e){function n(i){return Pr(i,e)}if(0<tr.length){Pr(tr[0],e);for(var t=1;t<tr.length;t++){var r=tr[t];r.blockedOn===e&&(r.blockedOn=null)}}for(Ft!==null&&Pr(Ft,e),Vt!==null&&Pr(Vt,e),Mt!==null&&Pr(Mt,e),mt.forEach(n),Xt.forEach(n),t=0;t<fr.length;t++)r=fr[t],r.blockedOn===e&&(r.blockedOn=null);for(;0<fr.length&&(t=fr[0],t.blockedOn===null);)na(t),t.blockedOn===null&&fr.shift()}var xr=Ke.ReactCurrentBatchConfig,aa=!0;function go(e,n,t,r){var i=jn,u=xr.transition;xr.transition=null;try{jn=1,ja(e,n,t,r)}finally{jn=i,xr.transition=u}}function vl(e,n,t,r){var i=jn,u=xr.transition;xr.transition=null;try{jn=4,ja(e,n,t,r)}finally{jn=i,xr.transition=u}}function ja(e,n,t,r){if(aa){var i=b(e,n,t,r);if(i===null)Co(e,n,r,Dr,t),Fa(e,r);else if(pr(i,e,n,t,r))r.stopPropagation();else if(Fa(e,r),n&4&&-1<Ba.indexOf(e)){for(;i!==null;){var u=Ja(i);if(u!==null&&V(u),u=b(e,n,t,r),u===null&&Co(e,n,r,Dr,t),u===i)break;i=u}i!==null&&r.stopPropagation()}else Co(e,n,r,null,t)}}var Dr=null;function b(e,n,t,r){if(Dr=null,e=Ee(r),e=la(e),e!==null)if(n=Me(e),n===null)e=null;else if(t=n.tag,t===13){if(e=fe(n),e!==null)return e;e=null}else if(t===3){if(n.stateNode.current.memoizedState.isDehydrated)return n.tag===3?n.stateNode.containerInfo:null;e=null}else n!==e&&(e=null);return Dr=e,null}function Z(e){switch(e){case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"resize":case"seeked":case"submit":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 1;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"scroll":case"toggle":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 4;case"message":switch(ut()){case it:return 1;case Ct:return 4;case pt:case Dt:return 16;case bt:return 536870912;default:return 16}default:return 16}}var Re=null,Qe=null,Ge=null;function Se(){if(Ge)return Ge;var e,n=Qe,t=n.length,r,i="value"in Re?Re.value:Re.textContent,u=i.length;for(e=0;e<t&&n[e]===i[e];e++);var x=t-e;for(r=1;r<=x&&n[t-r]===i[u-r];r++);return Ge=i.slice(e,1<r?1-r:void 0)}function hn(e){var n=e.keyCode;return"charCode"in e?(e=e.charCode,e===0&&n===13&&(e=13)):e=n,e===10&&(e=13),32<=e||e===13?e:0}function Tn(){return!0}function rt(){return!1}function at(e){function n(t,r,i,u,x){this._reactName=t,this._targetInst=i,this.type=r,this.nativeEvent=u,this.target=x,this.currentTarget=null;for(var W in e)e.hasOwnProperty(W)&&(t=e[W],this[W]=t?t(u):u[W]);return this.isDefaultPrevented=(u.defaultPrevented!=null?u.defaultPrevented:u.returnValue===!1)?Tn:rt,this.isPropagationStopped=rt,this}return T(n.prototype,{preventDefault:function(){this.defaultPrevented=!0;var t=this.nativeEvent;t&&(t.preventDefault?t.preventDefault():typeof t.returnValue!="unknown"&&(t.returnValue=!1),this.isDefaultPrevented=Tn)},stopPropagation:function(){var t=this.nativeEvent;t&&(t.stopPropagation?t.stopPropagation():typeof t.cancelBubble!="unknown"&&(t.cancelBubble=!0),this.isPropagationStopped=Tn)},persist:function(){},isPersistent:Tn}),n}var St={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(e){return e.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},Er=at(St),Gr=T({},St,{view:0,detail:0}),ed=at(Gr),yo,vo,za,xl=T({},Gr,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:ko,button:0,buttons:0,relatedTarget:function(e){return e.relatedTarget===void 0?e.fromElement===e.srcElement?e.toElement:e.fromElement:e.relatedTarget},movementX:function(e){return"movementX"in e?e.movementX:(e!==za&&(za&&e.type==="mousemove"?(yo=e.screenX-za.screenX,vo=e.screenY-za.screenY):vo=yo=0,za=e),yo)},movementY:function(e){return"movementY"in e?e.movementY:vo}}),ts=at(xl),nd=T({},xl,{dataTransfer:0}),td=at(nd),rd=T({},Gr,{relatedTarget:0}),xo=at(rd),ad=T({},St,{animationName:0,elapsedTime:0,pseudoElement:0}),ld=at(ad),od=T({},St,{clipboardData:function(e){return"clipboardData"in e?e.clipboardData:window.clipboardData}}),id=at(od),sd=T({},St,{data:0}),rs=at(sd),ud={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},cd={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},dd={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function fd(e){var n=this.nativeEvent;return n.getModifierState?n.getModifierState(e):(e=dd[e])?!!n[e]:!1}function ko(){return fd}var pd=T({},Gr,{key:function(e){if(e.key){var n=ud[e.key]||e.key;if(n!=="Unidentified")return n}return e.type==="keypress"?(e=hn(e),e===13?"Enter":String.fromCharCode(e)):e.type==="keydown"||e.type==="keyup"?cd[e.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:ko,charCode:function(e){return e.type==="keypress"?hn(e):0},keyCode:function(e){return e.type==="keydown"||e.type==="keyup"?e.keyCode:0},which:function(e){return e.type==="keypress"?hn(e):e.type==="keydown"||e.type==="keyup"?e.keyCode:0}}),_d=at(pd),hd=T({},xl,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),as=at(hd),md=T({},Gr,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:ko}),gd=at(md),yd=T({},St,{propertyName:0,elapsedTime:0,pseudoElement:0}),vd=at(yd),xd=T({},xl,{deltaX:function(e){return"deltaX"in e?e.deltaX:"wheelDeltaX"in e?-e.wheelDeltaX:0},deltaY:function(e){return"deltaY"in e?e.deltaY:"wheelDeltaY"in e?-e.wheelDeltaY:"wheelDelta"in e?-e.wheelDelta:0},deltaZ:0,deltaMode:0}),kd=at(xd),wd=[9,13,27,32],wo=C&&"CompositionEvent"in window,Ha=null;C&&"documentMode"in document&&(Ha=document.documentMode);var Ad=C&&"TextEvent"in window&&!Ha,ls=C&&(!wo||Ha&&8<Ha&&11>=Ha),os=" ",is=!1;function ss(e,n){switch(e){case"keyup":return wd.indexOf(n.keyCode)!==-1;case"keydown":return n.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function us(e){return e=e.detail,typeof e=="object"&&"data"in e?e.data:null}var va=!1;function bd(e,n){switch(e){case"compositionend":return us(n);case"keypress":return n.which!==32?null:(is=!0,os);case"textInput":return e=n.data,e===os&&is?null:e;default:return null}}function Td(e,n){if(va)return e==="compositionend"||!wo&&ss(e,n)?(e=Se(),Ge=Qe=Re=null,va=!1,e):null;switch(e){case"paste":return null;case"keypress":if(!(n.ctrlKey||n.altKey||n.metaKey)||n.ctrlKey&&n.altKey){if(n.char&&1<n.char.length)return n.char;if(n.which)return String.fromCharCode(n.which)}return null;case"compositionend":return ls&&n.locale!=="ko"?null:n.data;default:return null}}var Ed={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function cs(e){var n=e&&e.nodeName&&e.nodeName.toLowerCase();return n==="input"?!!Ed[e.type]:n==="textarea"}function ds(e,n,t,r){Ve(r),n=Tl(n,"onChange"),0<n.length&&(t=new Er("onChange","change",null,t,r),e.push({event:t,listeners:n}))}var Ka=null,Xa=null;function Ld(e){Os(e,0)}function kl(e){var n=ba(e);if(Te(n))return e}function Sd(e,n){if(e==="change")return n}var fs=!1;if(C){var Ao;if(C){var bo="oninput"in document;if(!bo){var ps=document.createElement("div");ps.setAttribute("oninput","return;"),bo=typeof ps.oninput=="function"}Ao=bo}else Ao=!1;fs=Ao&&(!document.documentMode||9<document.documentMode)}function _s(){Ka&&(Ka.detachEvent("onpropertychange",hs),Xa=Ka=null)}function hs(e){if(e.propertyName==="value"&&kl(Xa)){var n=[];ds(n,Xa,e,Ee(e)),c(Ld,n)}}function Od(e,n,t){e==="focusin"?(_s(),Ka=n,Xa=t,Ka.attachEvent("onpropertychange",hs)):e==="focusout"&&_s()}function Rd(e){if(e==="selectionchange"||e==="keyup"||e==="keydown")return kl(Xa)}function Nd(e,n){if(e==="click")return kl(n)}function Cd(e,n){if(e==="input"||e==="change")return kl(n)}function Md(e,n){return e===n&&(e!==0||1/e===1/n)||e!==e&&n!==n}var _r=typeof Object.is=="function"?Object.is:Md;function qa(e,n){if(_r(e,n))return!0;if(typeof e!="object"||e===null||typeof n!="object"||n===null)return!1;var t=Object.keys(e),r=Object.keys(n);if(t.length!==r.length)return!1;for(r=0;r<t.length;r++){var i=t[r];if(!j.call(n,i)||!_r(e[i],n[i]))return!1}return!0}function ms(e){for(;e&&e.firstChild;)e=e.firstChild;return e}function gs(e,n){var t=ms(e);e=0;for(var r;t;){if(t.nodeType===3){if(r=e+t.textContent.length,e<=n&&r>=n)return{node:t,offset:n-e};e=r}e:{for(;t;){if(t.nextSibling){t=t.nextSibling;break e}t=t.parentNode}t=void 0}t=ms(t)}}function ys(e,n){return e&&n?e===n?!0:e&&e.nodeType===3?!1:n&&n.nodeType===3?ys(e,n.parentNode):"contains"in e?e.contains(n):e.compareDocumentPosition?!!(e.compareDocumentPosition(n)&16):!1:!1}function vs(){for(var e=window,n=rn();n instanceof e.HTMLIFrameElement;){try{var t=typeof n.contentWindow.location.href=="string"}catch{t=!1}if(t)e=n.contentWindow;else break;n=rn(e.document)}return n}function To(e){var n=e&&e.nodeName&&e.nodeName.toLowerCase();return n&&(n==="input"&&(e.type==="text"||e.type==="search"||e.type==="tel"||e.type==="url"||e.type==="password")||n==="textarea"||e.contentEditable==="true")}function Id(e){var n=vs(),t=e.focusedElem,r=e.selectionRange;if(n!==t&&t&&t.ownerDocument&&ys(t.ownerDocument.documentElement,t)){if(r!==null&&To(t)){if(n=r.start,e=r.end,e===void 0&&(e=n),"selectionStart"in t)t.selectionStart=n,t.selectionEnd=Math.min(e,t.value.length);else if(e=(n=t.ownerDocument||document)&&n.defaultView||window,e.getSelection){e=e.getSelection();var i=t.textContent.length,u=Math.min(r.start,i);r=r.end===void 0?u:Math.min(r.end,i),!e.extend&&u>r&&(i=r,r=u,u=i),i=gs(t,u);var x=gs(t,r);i&&x&&(e.rangeCount!==1||e.anchorNode!==i.node||e.anchorOffset!==i.offset||e.focusNode!==x.node||e.focusOffset!==x.offset)&&(n=n.createRange(),n.setStart(i.node,i.offset),e.removeAllRanges(),u>r?(e.addRange(n),e.extend(x.node,x.offset)):(n.setEnd(x.node,x.offset),e.addRange(n)))}}for(n=[],e=t;e=e.parentNode;)e.nodeType===1&&n.push({element:e,left:e.scrollLeft,top:e.scrollTop});for(typeof t.focus=="function"&&t.focus(),t=0;t<n.length;t++)e=n[t],e.element.scrollLeft=e.left,e.element.scrollTop=e.top}}var Ud=C&&"documentMode"in document&&11>=document.documentMode,xa=null,Eo=null,Wa=null,Lo=!1;function xs(e,n,t){var r=t.window===t?t.document:t.nodeType===9?t:t.ownerDocument;Lo||xa==null||xa!==rn(r)||(r=xa,"selectionStart"in r&&To(r)?r={start:r.selectionStart,end:r.selectionEnd}:(r=(r.ownerDocument&&r.ownerDocument.defaultView||window).getSelection(),r={anchorNode:r.anchorNode,anchorOffset:r.anchorOffset,focusNode:r.focusNode,focusOffset:r.focusOffset}),Wa&&qa(Wa,r)||(Wa=r,r=Tl(Eo,"onSelect"),0<r.length&&(n=new Er("onSelect","select",null,n,t),e.push({event:n,listeners:r}),n.target=xa)))}function wl(e,n){var t={};return t[e.toLowerCase()]=n.toLowerCase(),t["Webkit"+e]="webkit"+n,t["Moz"+e]="moz"+n,t}var ka={animationend:wl("Animation","AnimationEnd"),animationiteration:wl("Animation","AnimationIteration"),animationstart:wl("Animation","AnimationStart"),transitionend:wl("Transition","TransitionEnd")},So={},ks={};C&&(ks=document.createElement("div").style,"AnimationEvent"in window||(delete ka.animationend.animation,delete ka.animationiteration.animation,delete ka.animationstart.animation),"TransitionEvent"in window||delete ka.transitionend.transition);function Al(e){if(So[e])return So[e];if(!ka[e])return e;var n=ka[e],t;for(t in n)if(n.hasOwnProperty(t)&&t in ks)return So[e]=n[t];return e}var ws=Al("animationend"),As=Al("animationiteration"),bs=Al("animationstart"),Ts=Al("transitionend"),Es=new Map,Ls="abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");function Br(e,n){Es.set(e,n),P(n,[e])}for(var Oo=0;Oo<Ls.length;Oo++){var Ro=Ls[Oo],Pd=Ro.toLowerCase(),Dd=Ro[0].toUpperCase()+Ro.slice(1);Br(Pd,"on"+Dd)}Br(ws,"onAnimationEnd"),Br(As,"onAnimationIteration"),Br(bs,"onAnimationStart"),Br("dblclick","onDoubleClick"),Br("focusin","onFocus"),Br("focusout","onBlur"),Br(Ts,"onTransitionEnd"),R("onMouseEnter",["mouseout","mouseover"]),R("onMouseLeave",["mouseout","mouseover"]),R("onPointerEnter",["pointerout","pointerover"]),R("onPointerLeave",["pointerout","pointerover"]),P("onChange","change click focusin focusout input keydown keyup selectionchange".split(" ")),P("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")),P("onBeforeInput",["compositionend","keypress","textInput","paste"]),P("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" ")),P("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" ")),P("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var Ya="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),Gd=new Set("cancel close invalid load scroll toggle".split(" ").concat(Ya));function Ss(e,n,t){var r=e.type||"unknown-event";e.currentTarget=t,U(r,n,void 0,e),e.currentTarget=null}function Os(e,n){n=(n&4)!==0;for(var t=0;t<e.length;t++){var r=e[t],i=r.event;r=r.listeners;e:{var u=void 0;if(n)for(var x=r.length-1;0<=x;x--){var W=r[x],ue=W.instance,Ye=W.currentTarget;if(W=W.listener,ue!==u&&i.isPropagationStopped())break e;Ss(i,W,Ye),u=ue}else for(x=0;x<r.length;x++){if(W=r[x],ue=W.instance,Ye=W.currentTarget,W=W.listener,ue!==u&&i.isPropagationStopped())break e;Ss(i,W,Ye),u=ue}}}if(Bn)throw e=Kn,Bn=!1,Kn=null,e}function yt(e,n){var t=n[Go];t===void 0&&(t=n[Go]=new Set);var r=e+"__bubble";t.has(r)||(Rs(n,e,2,!1),t.add(r))}function No(e,n,t){var r=0;n&&(r|=4),Rs(t,e,r,n)}var bl="_reactListening"+Math.random().toString(36).slice(2);function $a(e){if(!e[bl]){e[bl]=!0,k.forEach(function(t){t!=="selectionchange"&&(Gd.has(t)||No(t,!1,e),No(t,!0,e))});var n=e.nodeType===9?e:e.ownerDocument;n===null||n[bl]||(n[bl]=!0,No("selectionchange",!1,n))}}function Rs(e,n,t,r){switch(Z(n)){case 1:var i=go;break;case 4:i=vl;break;default:i=ja}t=i.bind(null,n,t,e),i=void 0,!O||n!=="touchstart"&&n!=="touchmove"&&n!=="wheel"||(i=!0),r?i!==void 0?e.addEventListener(n,t,{capture:!0,passive:i}):e.addEventListener(n,t,!0):i!==void 0?e.addEventListener(n,t,{passive:i}):e.addEventListener(n,t,!1)}function Co(e,n,t,r,i){var u=r;if((n&1)===0&&(n&2)===0&&r!==null)e:for(;;){if(r===null)return;var x=r.tag;if(x===3||x===4){var W=r.stateNode.containerInfo;if(W===i||W.nodeType===8&&W.parentNode===i)break;if(x===4)for(x=r.return;x!==null;){var ue=x.tag;if((ue===3||ue===4)&&(ue=x.stateNode.containerInfo,ue===i||ue.nodeType===8&&ue.parentNode===i))return;x=x.return}for(;W!==null;){if(x=la(W),x===null)return;if(ue=x.tag,ue===5||ue===6){r=u=x;continue e}W=W.parentNode}}r=r.return}c(function(){var Ye=u,En=Ee(t),Rn=[];e:{var bn=Es.get(e);if(bn!==void 0){var Hn=Er,qn=e;switch(e){case"keypress":if(hn(t)===0)break e;case"keydown":case"keyup":Hn=_d;break;case"focusin":qn="focus",Hn=xo;break;case"focusout":qn="blur",Hn=xo;break;case"beforeblur":case"afterblur":Hn=xo;break;case"click":if(t.button===2)break e;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":Hn=ts;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":Hn=td;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":Hn=gd;break;case ws:case As:case bs:Hn=ld;break;case Ts:Hn=vd;break;case"scroll":Hn=ed;break;case"wheel":Hn=kd;break;case"copy":case"cut":case"paste":Hn=id;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":Hn=as}var Yn=(n&4)!==0,Lt=!Yn&&e==="scroll",Be=Yn?bn!==null?bn+"Capture":null:bn;Yn=[];for(var we=Ye,je;we!==null;){je=we;var Cn=je.stateNode;if(je.tag===5&&Cn!==null&&(je=Cn,Be!==null&&(Cn=m(we,Be),Cn!=null&&Yn.push(Qa(we,Cn,je)))),Lt)break;we=we.return}0<Yn.length&&(bn=new Hn(bn,qn,null,t,En),Rn.push({event:bn,listeners:Yn}))}}if((n&7)===0){e:{if(bn=e==="mouseover"||e==="pointerover",Hn=e==="mouseout"||e==="pointerout",bn&&t!==te&&(qn=t.relatedTarget||t.fromElement)&&(la(qn)||qn[Lr]))break e;if((Hn||bn)&&(bn=En.window===En?En:(bn=En.ownerDocument)?bn.defaultView||bn.parentWindow:window,Hn?(qn=t.relatedTarget||t.toElement,Hn=Ye,qn=qn?la(qn):null,qn!==null&&(Lt=Me(qn),qn!==Lt||qn.tag!==5&&qn.tag!==6)&&(qn=null)):(Hn=null,qn=Ye),Hn!==qn)){if(Yn=ts,Cn="onMouseLeave",Be="onMouseEnter",we="mouse",(e==="pointerout"||e==="pointerover")&&(Yn=as,Cn="onPointerLeave",Be="onPointerEnter",we="pointer"),Lt=Hn==null?bn:ba(Hn),je=qn==null?bn:ba(qn),bn=new Yn(Cn,we+"leave",Hn,t,En),bn.target=Lt,bn.relatedTarget=je,Cn=null,la(En)===Ye&&(Yn=new Yn(Be,we+"enter",qn,t,En),Yn.target=je,Yn.relatedTarget=Lt,Cn=Yn),Lt=Cn,Hn&&qn)n:{for(Yn=Hn,Be=qn,we=0,je=Yn;je;je=wa(je))we++;for(je=0,Cn=Be;Cn;Cn=wa(Cn))je++;for(;0<we-je;)Yn=wa(Yn),we--;for(;0<je-we;)Be=wa(Be),je--;for(;we--;){if(Yn===Be||Be!==null&&Yn===Be.alternate)break n;Yn=wa(Yn),Be=wa(Be)}Yn=null}else Yn=null;Hn!==null&&Ns(Rn,bn,Hn,Yn,!1),qn!==null&&Lt!==null&&Ns(Rn,Lt,qn,Yn,!0)}}e:{if(bn=Ye?ba(Ye):window,Hn=bn.nodeName&&bn.nodeName.toLowerCase(),Hn==="select"||Hn==="input"&&bn.type==="file")var Qn=Sd;else if(cs(bn))if(fs)Qn=Cd;else{Qn=Rd;var et=Od}else(Hn=bn.nodeName)&&Hn.toLowerCase()==="input"&&(bn.type==="checkbox"||bn.type==="radio")&&(Qn=Nd);if(Qn&&(Qn=Qn(e,Ye))){ds(Rn,Qn,t,En);break e}et&&et(e,bn,Ye),e==="focusout"&&(et=bn._wrapperState)&&et.controlled&&bn.type==="number"&&N(bn,"number",bn.value)}switch(et=Ye?ba(Ye):window,e){case"focusin":(cs(et)||et.contentEditable==="true")&&(xa=et,Eo=Ye,Wa=null);break;case"focusout":Wa=Eo=xa=null;break;case"mousedown":Lo=!0;break;case"contextmenu":case"mouseup":case"dragend":Lo=!1,xs(Rn,t,En);break;case"selectionchange":if(Ud)break;case"keydown":case"keyup":xs(Rn,t,En)}var nt;if(wo)e:{switch(e){case"compositionstart":var lt="onCompositionStart";break e;case"compositionend":lt="onCompositionEnd";break e;case"compositionupdate":lt="onCompositionUpdate";break e}lt=void 0}else va?ss(e,t)&&(lt="onCompositionEnd"):e==="keydown"&&t.keyCode===229&&(lt="onCompositionStart");lt&&(ls&&t.locale!=="ko"&&(va||lt!=="onCompositionStart"?lt==="onCompositionEnd"&&va&&(nt=Se()):(Re=En,Qe="value"in Re?Re.value:Re.textContent,va=!0)),et=Tl(Ye,lt),0<et.length&&(lt=new rs(lt,e,null,t,En),Rn.push({event:lt,listeners:et}),nt?lt.data=nt:(nt=us(t),nt!==null&&(lt.data=nt)))),(nt=Ad?bd(e,t):Td(e,t))&&(Ye=Tl(Ye,"onBeforeInput"),0<Ye.length&&(En=new rs("onBeforeInput","beforeinput",null,t,En),Rn.push({event:En,listeners:Ye}),En.data=nt))}Os(Rn,n)})}function Qa(e,n,t){return{instance:e,listener:n,currentTarget:t}}function Tl(e,n){for(var t=n+"Capture",r=[];e!==null;){var i=e,u=i.stateNode;i.tag===5&&u!==null&&(i=u,u=m(e,t),u!=null&&r.unshift(Qa(e,u,i)),u=m(e,n),u!=null&&r.push(Qa(e,u,i))),e=e.return}return r}function wa(e){if(e===null)return null;do e=e.return;while(e&&e.tag!==5);return e||null}function Ns(e,n,t,r,i){for(var u=n._reactName,x=[];t!==null&&t!==r;){var W=t,ue=W.alternate,Ye=W.stateNode;if(ue!==null&&ue===r)break;W.tag===5&&Ye!==null&&(W=Ye,i?(ue=m(t,u),ue!=null&&x.unshift(Qa(t,ue,W))):i||(ue=m(t,u),ue!=null&&x.push(Qa(t,ue,W)))),t=t.return}x.length!==0&&e.push({event:n,listeners:x})}var Bd=/\r\n?/g,Fd=/\u0000|\uFFFD/g;function Cs(e){return(typeof e=="string"?e:""+e).replace(Bd,`
`).replace(Fd,"")}function El(e,n,t){if(n=Cs(n),Cs(e)!==n&&t)throw Error(d(425))}function Ll(){}var Mo=null,Io=null;function Uo(e,n){return e==="textarea"||e==="noscript"||typeof n.children=="string"||typeof n.children=="number"||typeof n.dangerouslySetInnerHTML=="object"&&n.dangerouslySetInnerHTML!==null&&n.dangerouslySetInnerHTML.__html!=null}var Po=typeof setTimeout=="function"?setTimeout:void 0,Vd=typeof clearTimeout=="function"?clearTimeout:void 0,Ms=typeof Promise=="function"?Promise:void 0,jd=typeof queueMicrotask=="function"?queueMicrotask:typeof Ms<"u"?function(e){return Ms.resolve(null).then(e).catch(zd)}:Po;function zd(e){setTimeout(function(){throw e})}function Do(e,n){var t=n,r=0;do{var i=t.nextSibling;if(e.removeChild(t),i&&i.nodeType===8)if(t=i.data,t==="/$"){if(r===0){e.removeChild(i),ra(n);return}r--}else t!=="$"&&t!=="$?"&&t!=="$!"||r++;t=i}while(t);ra(n)}function Fr(e){for(;e!=null;e=e.nextSibling){var n=e.nodeType;if(n===1||n===3)break;if(n===8){if(n=e.data,n==="$"||n==="$!"||n==="$?")break;if(n==="/$")return null}}return e}function Is(e){e=e.previousSibling;for(var n=0;e;){if(e.nodeType===8){var t=e.data;if(t==="$"||t==="$!"||t==="$?"){if(n===0)return e;n--}else t==="/$"&&n++}e=e.previousSibling}return null}var Aa=Math.random().toString(36).slice(2),kr="__reactFiber$"+Aa,Za="__reactProps$"+Aa,Lr="__reactContainer$"+Aa,Go="__reactEvents$"+Aa,Hd="__reactListeners$"+Aa,Kd="__reactHandles$"+Aa;function la(e){var n=e[kr];if(n)return n;for(var t=e.parentNode;t;){if(n=t[Lr]||t[kr]){if(t=n.alternate,n.child!==null||t!==null&&t.child!==null)for(e=Is(e);e!==null;){if(t=e[kr])return t;e=Is(e)}return n}e=t,t=e.parentNode}return null}function Ja(e){return e=e[kr]||e[Lr],!e||e.tag!==5&&e.tag!==6&&e.tag!==13&&e.tag!==3?null:e}function ba(e){if(e.tag===5||e.tag===6)return e.stateNode;throw Error(d(33))}function Sl(e){return e[Za]||null}var Bo=[],Ta=-1;function Vr(e){return{current:e}}function vt(e){0>Ta||(e.current=Bo[Ta],Bo[Ta]=null,Ta--)}function gt(e,n){Ta++,Bo[Ta]=e.current,e.current=n}var jr={},jt=Vr(jr),$t=Vr(!1),oa=jr;function Ea(e,n){var t=e.type.contextTypes;if(!t)return jr;var r=e.stateNode;if(r&&r.__reactInternalMemoizedUnmaskedChildContext===n)return r.__reactInternalMemoizedMaskedChildContext;var i={},u;for(u in t)i[u]=n[u];return r&&(e=e.stateNode,e.__reactInternalMemoizedUnmaskedChildContext=n,e.__reactInternalMemoizedMaskedChildContext=i),i}function Qt(e){return e=e.childContextTypes,e!=null}function Ol(){vt($t),vt(jt)}function Us(e,n,t){if(jt.current!==jr)throw Error(d(168));gt(jt,n),gt($t,t)}function Ps(e,n,t){var r=e.stateNode;if(n=n.childContextTypes,typeof r.getChildContext!="function")return t;r=r.getChildContext();for(var i in r)if(!(i in n))throw Error(d(108,dn(e)||"Unknown",i));return T({},t,r)}function Rl(e){return e=(e=e.stateNode)&&e.__reactInternalMemoizedMergedChildContext||jr,oa=jt.current,gt(jt,e),gt($t,$t.current),!0}function Ds(e,n,t){var r=e.stateNode;if(!r)throw Error(d(169));t?(e=Ps(e,n,oa),r.__reactInternalMemoizedMergedChildContext=e,vt($t),vt(jt),gt(jt,e)):vt($t),gt($t,t)}var Sr=null,Nl=!1,Fo=!1;function Gs(e){Sr===null?Sr=[e]:Sr.push(e)}function Xd(e){Nl=!0,Gs(e)}function zr(){if(!Fo&&Sr!==null){Fo=!0;var e=0,n=jn;try{var t=Sr;for(jn=1;e<t.length;e++){var r=t[e];do r=r(!0);while(r!==null)}Sr=null,Nl=!1}catch(i){throw Sr!==null&&(Sr=Sr.slice(e+1)),$n(it,zr),i}finally{jn=n,Fo=!1}}return null}var La=[],Sa=0,Cl=null,Ml=0,or=[],ir=0,ia=null,Or=1,Rr="";function sa(e,n){La[Sa++]=Ml,La[Sa++]=Cl,Cl=e,Ml=n}function Bs(e,n,t){or[ir++]=Or,or[ir++]=Rr,or[ir++]=ia,ia=e;var r=Or;e=Rr;var i=32-on(r)-1;r&=~(1<<i),t+=1;var u=32-on(n)+i;if(30<u){var x=i-i%5;u=(r&(1<<x)-1).toString(32),r>>=x,i-=x,Or=1<<32-on(n)+i|t<<i|r,Rr=u+e}else Or=1<<u|t<<i|r,Rr=e}function Vo(e){e.return!==null&&(sa(e,1),Bs(e,1,0))}function jo(e){for(;e===Cl;)Cl=La[--Sa],La[Sa]=null,Ml=La[--Sa],La[Sa]=null;for(;e===ia;)ia=or[--ir],or[ir]=null,Rr=or[--ir],or[ir]=null,Or=or[--ir],or[ir]=null}var rr=null,ar=null,kt=!1,hr=null;function Fs(e,n){var t=dr(5,null,null,0);t.elementType="DELETED",t.stateNode=n,t.return=e,n=e.deletions,n===null?(e.deletions=[t],e.flags|=16):n.push(t)}function Vs(e,n){switch(e.tag){case 5:var t=e.type;return n=n.nodeType!==1||t.toLowerCase()!==n.nodeName.toLowerCase()?null:n,n!==null?(e.stateNode=n,rr=e,ar=Fr(n.firstChild),!0):!1;case 6:return n=e.pendingProps===""||n.nodeType!==3?null:n,n!==null?(e.stateNode=n,rr=e,ar=null,!0):!1;case 13:return n=n.nodeType!==8?null:n,n!==null?(t=ia!==null?{id:Or,overflow:Rr}:null,e.memoizedState={dehydrated:n,treeContext:t,retryLane:1073741824},t=dr(18,null,null,0),t.stateNode=n,t.return=e,e.child=t,rr=e,ar=null,!0):!1;default:return!1}}function zo(e){return(e.mode&1)!==0&&(e.flags&128)===0}function Ho(e){if(kt){var n=ar;if(n){var t=n;if(!Vs(e,n)){if(zo(e))throw Error(d(418));n=Fr(t.nextSibling);var r=rr;n&&Vs(e,n)?Fs(r,t):(e.flags=e.flags&-4097|2,kt=!1,rr=e)}}else{if(zo(e))throw Error(d(418));e.flags=e.flags&-4097|2,kt=!1,rr=e}}}function js(e){for(e=e.return;e!==null&&e.tag!==5&&e.tag!==3&&e.tag!==13;)e=e.return;rr=e}function Il(e){if(e!==rr)return!1;if(!kt)return js(e),kt=!0,!1;var n;if((n=e.tag!==3)&&!(n=e.tag!==5)&&(n=e.type,n=n!=="head"&&n!=="body"&&!Uo(e.type,e.memoizedProps)),n&&(n=ar)){if(zo(e))throw zs(),Error(d(418));for(;n;)Fs(e,n),n=Fr(n.nextSibling)}if(js(e),e.tag===13){if(e=e.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(d(317));e:{for(e=e.nextSibling,n=0;e;){if(e.nodeType===8){var t=e.data;if(t==="/$"){if(n===0){ar=Fr(e.nextSibling);break e}n--}else t!=="$"&&t!=="$!"&&t!=="$?"||n++}e=e.nextSibling}ar=null}}else ar=rr?Fr(e.stateNode.nextSibling):null;return!0}function zs(){for(var e=ar;e;)e=Fr(e.nextSibling)}function Oa(){ar=rr=null,kt=!1}function Ko(e){hr===null?hr=[e]:hr.push(e)}var qd=Ke.ReactCurrentBatchConfig;function el(e,n,t){if(e=t.ref,e!==null&&typeof e!="function"&&typeof e!="object"){if(t._owner){if(t=t._owner,t){if(t.tag!==1)throw Error(d(309));var r=t.stateNode}if(!r)throw Error(d(147,e));var i=r,u=""+e;return n!==null&&n.ref!==null&&typeof n.ref=="function"&&n.ref._stringRef===u?n.ref:(n=function(x){var W=i.refs;x===null?delete W[u]:W[u]=x},n._stringRef=u,n)}if(typeof e!="string")throw Error(d(284));if(!t._owner)throw Error(d(290,e))}return e}function Ul(e,n){throw e=Object.prototype.toString.call(n),Error(d(31,e==="[object Object]"?"object with keys {"+Object.keys(n).join(", ")+"}":e))}function Hs(e){var n=e._init;return n(e._payload)}function Ks(e){function n(Be,we){if(e){var je=Be.deletions;je===null?(Be.deletions=[we],Be.flags|=16):je.push(we)}}function t(Be,we){if(!e)return null;for(;we!==null;)n(Be,we),we=we.sibling;return null}function r(Be,we){for(Be=new Map;we!==null;)we.key!==null?Be.set(we.key,we):Be.set(we.index,we),we=we.sibling;return Be}function i(Be,we){return Be=Qr(Be,we),Be.index=0,Be.sibling=null,Be}function u(Be,we,je){return Be.index=je,e?(je=Be.alternate,je!==null?(je=je.index,je<we?(Be.flags|=2,we):je):(Be.flags|=2,we)):(Be.flags|=1048576,we)}function x(Be){return e&&Be.alternate===null&&(Be.flags|=2),Be}function W(Be,we,je,Cn){return we===null||we.tag!==6?(we=Pi(je,Be.mode,Cn),we.return=Be,we):(we=i(we,je),we.return=Be,we)}function ue(Be,we,je,Cn){var Qn=je.type;return Qn===D?En(Be,we,je.props.children,Cn,je.key):we!==null&&(we.elementType===Qn||typeof Qn=="object"&&Qn!==null&&Qn.$$typeof===oe&&Hs(Qn)===we.type)?(Cn=i(we,je.props),Cn.ref=el(Be,we,je),Cn.return=Be,Cn):(Cn=lo(je.type,je.key,je.props,null,Be.mode,Cn),Cn.ref=el(Be,we,je),Cn.return=Be,Cn)}function Ye(Be,we,je,Cn){return we===null||we.tag!==4||we.stateNode.containerInfo!==je.containerInfo||we.stateNode.implementation!==je.implementation?(we=Di(je,Be.mode,Cn),we.return=Be,we):(we=i(we,je.children||[]),we.return=Be,we)}function En(Be,we,je,Cn,Qn){return we===null||we.tag!==7?(we=ma(je,Be.mode,Cn,Qn),we.return=Be,we):(we=i(we,je),we.return=Be,we)}function Rn(Be,we,je){if(typeof we=="string"&&we!==""||typeof we=="number")return we=Pi(""+we,Be.mode,je),we.return=Be,we;if(typeof we=="object"&&we!==null){switch(we.$$typeof){case Xe:return je=lo(we.type,we.key,we.props,null,Be.mode,je),je.ref=el(Be,null,we),je.return=Be,je;case ln:return we=Di(we,Be.mode,je),we.return=Be,we;case oe:var Cn=we._init;return Rn(Be,Cn(we._payload),je)}if(me(we)||Ce(we))return we=ma(we,Be.mode,je,null),we.return=Be,we;Ul(Be,we)}return null}function bn(Be,we,je,Cn){var Qn=we!==null?we.key:null;if(typeof je=="string"&&je!==""||typeof je=="number")return Qn!==null?null:W(Be,we,""+je,Cn);if(typeof je=="object"&&je!==null){switch(je.$$typeof){case Xe:return je.key===Qn?ue(Be,we,je,Cn):null;case ln:return je.key===Qn?Ye(Be,we,je,Cn):null;case oe:return Qn=je._init,bn(Be,we,Qn(je._payload),Cn)}if(me(je)||Ce(je))return Qn!==null?null:En(Be,we,je,Cn,null);Ul(Be,je)}return null}function Hn(Be,we,je,Cn,Qn){if(typeof Cn=="string"&&Cn!==""||typeof Cn=="number")return Be=Be.get(je)||null,W(we,Be,""+Cn,Qn);if(typeof Cn=="object"&&Cn!==null){switch(Cn.$$typeof){case Xe:return Be=Be.get(Cn.key===null?je:Cn.key)||null,ue(we,Be,Cn,Qn);case ln:return Be=Be.get(Cn.key===null?je:Cn.key)||null,Ye(we,Be,Cn,Qn);case oe:var et=Cn._init;return Hn(Be,we,je,et(Cn._payload),Qn)}if(me(Cn)||Ce(Cn))return Be=Be.get(je)||null,En(we,Be,Cn,Qn,null);Ul(we,Cn)}return null}function qn(Be,we,je,Cn){for(var Qn=null,et=null,nt=we,lt=we=0,Pt=null;nt!==null&&lt<je.length;lt++){nt.index>lt?(Pt=nt,nt=null):Pt=nt.sibling;var _t=bn(Be,nt,je[lt],Cn);if(_t===null){nt===null&&(nt=Pt);break}e&&nt&&_t.alternate===null&&n(Be,nt),we=u(_t,we,lt),et===null?Qn=_t:et.sibling=_t,et=_t,nt=Pt}if(lt===je.length)return t(Be,nt),kt&&sa(Be,lt),Qn;if(nt===null){for(;lt<je.length;lt++)nt=Rn(Be,je[lt],Cn),nt!==null&&(we=u(nt,we,lt),et===null?Qn=nt:et.sibling=nt,et=nt);return kt&&sa(Be,lt),Qn}for(nt=r(Be,nt);lt<je.length;lt++)Pt=Hn(nt,Be,lt,je[lt],Cn),Pt!==null&&(e&&Pt.alternate!==null&&nt.delete(Pt.key===null?lt:Pt.key),we=u(Pt,we,lt),et===null?Qn=Pt:et.sibling=Pt,et=Pt);return e&&nt.forEach(function(Zr){return n(Be,Zr)}),kt&&sa(Be,lt),Qn}function Yn(Be,we,je,Cn){var Qn=Ce(je);if(typeof Qn!="function")throw Error(d(150));if(je=Qn.call(je),je==null)throw Error(d(151));for(var et=Qn=null,nt=we,lt=we=0,Pt=null,_t=je.next();nt!==null&&!_t.done;lt++,_t=je.next()){nt.index>lt?(Pt=nt,nt=null):Pt=nt.sibling;var Zr=bn(Be,nt,_t.value,Cn);if(Zr===null){nt===null&&(nt=Pt);break}e&&nt&&Zr.alternate===null&&n(Be,nt),we=u(Zr,we,lt),et===null?Qn=Zr:et.sibling=Zr,et=Zr,nt=Pt}if(_t.done)return t(Be,nt),kt&&sa(Be,lt),Qn;if(nt===null){for(;!_t.done;lt++,_t=je.next())_t=Rn(Be,_t.value,Cn),_t!==null&&(we=u(_t,we,lt),et===null?Qn=_t:et.sibling=_t,et=_t);return kt&&sa(Be,lt),Qn}for(nt=r(Be,nt);!_t.done;lt++,_t=je.next())_t=Hn(nt,Be,lt,_t.value,Cn),_t!==null&&(e&&_t.alternate!==null&&nt.delete(_t.key===null?lt:_t.key),we=u(_t,we,lt),et===null?Qn=_t:et.sibling=_t,et=_t);return e&&nt.forEach(function(Lf){return n(Be,Lf)}),kt&&sa(Be,lt),Qn}function Lt(Be,we,je,Cn){if(typeof je=="object"&&je!==null&&je.type===D&&je.key===null&&(je=je.props.children),typeof je=="object"&&je!==null){switch(je.$$typeof){case Xe:e:{for(var Qn=je.key,et=we;et!==null;){if(et.key===Qn){if(Qn=je.type,Qn===D){if(et.tag===7){t(Be,et.sibling),we=i(et,je.props.children),we.return=Be,Be=we;break e}}else if(et.elementType===Qn||typeof Qn=="object"&&Qn!==null&&Qn.$$typeof===oe&&Hs(Qn)===et.type){t(Be,et.sibling),we=i(et,je.props),we.ref=el(Be,et,je),we.return=Be,Be=we;break e}t(Be,et);break}else n(Be,et);et=et.sibling}je.type===D?(we=ma(je.props.children,Be.mode,Cn,je.key),we.return=Be,Be=we):(Cn=lo(je.type,je.key,je.props,null,Be.mode,Cn),Cn.ref=el(Be,we,je),Cn.return=Be,Be=Cn)}return x(Be);case ln:e:{for(et=je.key;we!==null;){if(we.key===et)if(we.tag===4&&we.stateNode.containerInfo===je.containerInfo&&we.stateNode.implementation===je.implementation){t(Be,we.sibling),we=i(we,je.children||[]),we.return=Be,Be=we;break e}else{t(Be,we);break}else n(Be,we);we=we.sibling}we=Di(je,Be.mode,Cn),we.return=Be,Be=we}return x(Be);case oe:return et=je._init,Lt(Be,we,et(je._payload),Cn)}if(me(je))return qn(Be,we,je,Cn);if(Ce(je))return Yn(Be,we,je,Cn);Ul(Be,je)}return typeof je=="string"&&je!==""||typeof je=="number"?(je=""+je,we!==null&&we.tag===6?(t(Be,we.sibling),we=i(we,je),we.return=Be,Be=we):(t(Be,we),we=Pi(je,Be.mode,Cn),we.return=Be,Be=we),x(Be)):t(Be,we)}return Lt}var Ra=Ks(!0),Xs=Ks(!1),Pl=Vr(null),Dl=null,Na=null,Xo=null;function qo(){Xo=Na=Dl=null}function Wo(e){var n=Pl.current;vt(Pl),e._currentValue=n}function Yo(e,n,t){for(;e!==null;){var r=e.alternate;if((e.childLanes&n)!==n?(e.childLanes|=n,r!==null&&(r.childLanes|=n)):r!==null&&(r.childLanes&n)!==n&&(r.childLanes|=n),e===t)break;e=e.return}}function Ca(e,n){Dl=e,Xo=Na=null,e=e.dependencies,e!==null&&e.firstContext!==null&&((e.lanes&n)!==0&&(Zt=!0),e.firstContext=null)}function sr(e){var n=e._currentValue;if(Xo!==e)if(e={context:e,memoizedValue:n,next:null},Na===null){if(Dl===null)throw Error(d(308));Na=e,Dl.dependencies={lanes:0,firstContext:e}}else Na=Na.next=e;return n}var ua=null;function $o(e){ua===null?ua=[e]:ua.push(e)}function qs(e,n,t,r){var i=n.interleaved;return i===null?(t.next=t,$o(n)):(t.next=i.next,i.next=t),n.interleaved=t,Nr(e,r)}function Nr(e,n){e.lanes|=n;var t=e.alternate;for(t!==null&&(t.lanes|=n),t=e,e=e.return;e!==null;)e.childLanes|=n,t=e.alternate,t!==null&&(t.childLanes|=n),t=e,e=e.return;return t.tag===3?t.stateNode:null}var Hr=!1;function Qo(e){e.updateQueue={baseState:e.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,interleaved:null,lanes:0},effects:null}}function Ws(e,n){e=e.updateQueue,n.updateQueue===e&&(n.updateQueue={baseState:e.baseState,firstBaseUpdate:e.firstBaseUpdate,lastBaseUpdate:e.lastBaseUpdate,shared:e.shared,effects:e.effects})}function Cr(e,n){return{eventTime:e,lane:n,tag:0,payload:null,callback:null,next:null}}function Kr(e,n,t){var r=e.updateQueue;if(r===null)return null;if(r=r.shared,(ft&2)!==0){var i=r.pending;return i===null?n.next=n:(n.next=i.next,i.next=n),r.pending=n,Nr(e,t)}return i=r.interleaved,i===null?(n.next=n,$o(r)):(n.next=i.next,i.next=n),r.interleaved=n,Nr(e,t)}function Gl(e,n,t){if(n=n.updateQueue,n!==null&&(n=n.shared,(t&4194240)!==0)){var r=n.lanes;r&=e.pendingLanes,t|=r,n.lanes=t,zn(e,t)}}function Ys(e,n){var t=e.updateQueue,r=e.alternate;if(r!==null&&(r=r.updateQueue,t===r)){var i=null,u=null;if(t=t.firstBaseUpdate,t!==null){do{var x={eventTime:t.eventTime,lane:t.lane,tag:t.tag,payload:t.payload,callback:t.callback,next:null};u===null?i=u=x:u=u.next=x,t=t.next}while(t!==null);u===null?i=u=n:u=u.next=n}else i=u=n;t={baseState:r.baseState,firstBaseUpdate:i,lastBaseUpdate:u,shared:r.shared,effects:r.effects},e.updateQueue=t;return}e=t.lastBaseUpdate,e===null?t.firstBaseUpdate=n:e.next=n,t.lastBaseUpdate=n}function Bl(e,n,t,r){var i=e.updateQueue;Hr=!1;var u=i.firstBaseUpdate,x=i.lastBaseUpdate,W=i.shared.pending;if(W!==null){i.shared.pending=null;var ue=W,Ye=ue.next;ue.next=null,x===null?u=Ye:x.next=Ye,x=ue;var En=e.alternate;En!==null&&(En=En.updateQueue,W=En.lastBaseUpdate,W!==x&&(W===null?En.firstBaseUpdate=Ye:W.next=Ye,En.lastBaseUpdate=ue))}if(u!==null){var Rn=i.baseState;x=0,En=Ye=ue=null,W=u;do{var bn=W.lane,Hn=W.eventTime;if((r&bn)===bn){En!==null&&(En=En.next={eventTime:Hn,lane:0,tag:W.tag,payload:W.payload,callback:W.callback,next:null});e:{var qn=e,Yn=W;switch(bn=n,Hn=t,Yn.tag){case 1:if(qn=Yn.payload,typeof qn=="function"){Rn=qn.call(Hn,Rn,bn);break e}Rn=qn;break e;case 3:qn.flags=qn.flags&-65537|128;case 0:if(qn=Yn.payload,bn=typeof qn=="function"?qn.call(Hn,Rn,bn):qn,bn==null)break e;Rn=T({},Rn,bn);break e;case 2:Hr=!0}}W.callback!==null&&W.lane!==0&&(e.flags|=64,bn=i.effects,bn===null?i.effects=[W]:bn.push(W))}else Hn={eventTime:Hn,lane:bn,tag:W.tag,payload:W.payload,callback:W.callback,next:null},En===null?(Ye=En=Hn,ue=Rn):En=En.next=Hn,x|=bn;if(W=W.next,W===null){if(W=i.shared.pending,W===null)break;bn=W,W=bn.next,bn.next=null,i.lastBaseUpdate=bn,i.shared.pending=null}}while(!0);if(En===null&&(ue=Rn),i.baseState=ue,i.firstBaseUpdate=Ye,i.lastBaseUpdate=En,n=i.shared.interleaved,n!==null){i=n;do x|=i.lane,i=i.next;while(i!==n)}else u===null&&(i.shared.lanes=0);fa|=x,e.lanes=x,e.memoizedState=Rn}}function $s(e,n,t){if(e=n.effects,n.effects=null,e!==null)for(n=0;n<e.length;n++){var r=e[n],i=r.callback;if(i!==null){if(r.callback=null,r=t,typeof i!="function")throw Error(d(191,i));i.call(r)}}}var nl={},wr=Vr(nl),tl=Vr(nl),rl=Vr(nl);function ca(e){if(e===nl)throw Error(d(174));return e}function Zo(e,n){switch(gt(rl,n),gt(tl,e),gt(wr,nl),e=n.nodeType,e){case 9:case 11:n=(n=n.documentElement)?n.namespaceURI:Mn(null,"");break;default:e=e===8?n.parentNode:n,n=e.namespaceURI||null,e=e.tagName,n=Mn(n,e)}vt(wr),gt(wr,n)}function Ma(){vt(wr),vt(tl),vt(rl)}function Qs(e){ca(rl.current);var n=ca(wr.current),t=Mn(n,e.type);n!==t&&(gt(tl,e),gt(wr,t))}function Jo(e){tl.current===e&&(vt(wr),vt(tl))}var wt=Vr(0);function Fl(e){for(var n=e;n!==null;){if(n.tag===13){var t=n.memoizedState;if(t!==null&&(t=t.dehydrated,t===null||t.data==="$?"||t.data==="$!"))return n}else if(n.tag===19&&n.memoizedProps.revealOrder!==void 0){if((n.flags&128)!==0)return n}else if(n.child!==null){n.child.return=n,n=n.child;continue}if(n===e)break;for(;n.sibling===null;){if(n.return===null||n.return===e)return null;n=n.return}n.sibling.return=n.return,n=n.sibling}return null}var ei=[];function ni(){for(var e=0;e<ei.length;e++)ei[e]._workInProgressVersionPrimary=null;ei.length=0}var Vl=Ke.ReactCurrentDispatcher,ti=Ke.ReactCurrentBatchConfig,da=0,At=null,Rt=null,It=null,jl=!1,al=!1,ll=0,Wd=0;function zt(){throw Error(d(321))}function ri(e,n){if(n===null)return!1;for(var t=0;t<n.length&&t<e.length;t++)if(!_r(e[t],n[t]))return!1;return!0}function ai(e,n,t,r,i,u){if(da=u,At=n,n.memoizedState=null,n.updateQueue=null,n.lanes=0,Vl.current=e===null||e.memoizedState===null?Zd:Jd,e=t(r,i),al){u=0;do{if(al=!1,ll=0,25<=u)throw Error(d(301));u+=1,It=Rt=null,n.updateQueue=null,Vl.current=ef,e=t(r,i)}while(al)}if(Vl.current=Kl,n=Rt!==null&&Rt.next!==null,da=0,It=Rt=At=null,jl=!1,n)throw Error(d(300));return e}function li(){var e=ll!==0;return ll=0,e}function Ar(){var e={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return It===null?At.memoizedState=It=e:It=It.next=e,It}function ur(){if(Rt===null){var e=At.alternate;e=e!==null?e.memoizedState:null}else e=Rt.next;var n=It===null?At.memoizedState:It.next;if(n!==null)It=n,Rt=e;else{if(e===null)throw Error(d(310));Rt=e,e={memoizedState:Rt.memoizedState,baseState:Rt.baseState,baseQueue:Rt.baseQueue,queue:Rt.queue,next:null},It===null?At.memoizedState=It=e:It=It.next=e}return It}function ol(e,n){return typeof n=="function"?n(e):n}function oi(e){var n=ur(),t=n.queue;if(t===null)throw Error(d(311));t.lastRenderedReducer=e;var r=Rt,i=r.baseQueue,u=t.pending;if(u!==null){if(i!==null){var x=i.next;i.next=u.next,u.next=x}r.baseQueue=i=u,t.pending=null}if(i!==null){u=i.next,r=r.baseState;var W=x=null,ue=null,Ye=u;do{var En=Ye.lane;if((da&En)===En)ue!==null&&(ue=ue.next={lane:0,action:Ye.action,hasEagerState:Ye.hasEagerState,eagerState:Ye.eagerState,next:null}),r=Ye.hasEagerState?Ye.eagerState:e(r,Ye.action);else{var Rn={lane:En,action:Ye.action,hasEagerState:Ye.hasEagerState,eagerState:Ye.eagerState,next:null};ue===null?(W=ue=Rn,x=r):ue=ue.next=Rn,At.lanes|=En,fa|=En}Ye=Ye.next}while(Ye!==null&&Ye!==u);ue===null?x=r:ue.next=W,_r(r,n.memoizedState)||(Zt=!0),n.memoizedState=r,n.baseState=x,n.baseQueue=ue,t.lastRenderedState=r}if(e=t.interleaved,e!==null){i=e;do u=i.lane,At.lanes|=u,fa|=u,i=i.next;while(i!==e)}else i===null&&(t.lanes=0);return[n.memoizedState,t.dispatch]}function ii(e){var n=ur(),t=n.queue;if(t===null)throw Error(d(311));t.lastRenderedReducer=e;var r=t.dispatch,i=t.pending,u=n.memoizedState;if(i!==null){t.pending=null;var x=i=i.next;do u=e(u,x.action),x=x.next;while(x!==i);_r(u,n.memoizedState)||(Zt=!0),n.memoizedState=u,n.baseQueue===null&&(n.baseState=u),t.lastRenderedState=u}return[u,r]}function Zs(){}function Js(e,n){var t=At,r=ur(),i=n(),u=!_r(r.memoizedState,i);if(u&&(r.memoizedState=i,Zt=!0),r=r.queue,si(tu.bind(null,t,r,e),[e]),r.getSnapshot!==n||u||It!==null&&It.memoizedState.tag&1){if(t.flags|=2048,il(9,nu.bind(null,t,r,i,n),void 0,null),Ut===null)throw Error(d(349));(da&30)!==0||eu(t,n,i)}return i}function eu(e,n,t){e.flags|=16384,e={getSnapshot:n,value:t},n=At.updateQueue,n===null?(n={lastEffect:null,stores:null},At.updateQueue=n,n.stores=[e]):(t=n.stores,t===null?n.stores=[e]:t.push(e))}function nu(e,n,t,r){n.value=t,n.getSnapshot=r,ru(n)&&au(e)}function tu(e,n,t){return t(function(){ru(n)&&au(e)})}function ru(e){var n=e.getSnapshot;e=e.value;try{var t=n();return!_r(e,t)}catch{return!0}}function au(e){var n=Nr(e,1);n!==null&&vr(n,e,1,-1)}function lu(e){var n=Ar();return typeof e=="function"&&(e=e()),n.memoizedState=n.baseState=e,e={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:ol,lastRenderedState:e},n.queue=e,e=e.dispatch=Qd.bind(null,At,e),[n.memoizedState,e]}function il(e,n,t,r){return e={tag:e,create:n,destroy:t,deps:r,next:null},n=At.updateQueue,n===null?(n={lastEffect:null,stores:null},At.updateQueue=n,n.lastEffect=e.next=e):(t=n.lastEffect,t===null?n.lastEffect=e.next=e:(r=t.next,t.next=e,e.next=r,n.lastEffect=e)),e}function ou(){return ur().memoizedState}function zl(e,n,t,r){var i=Ar();At.flags|=e,i.memoizedState=il(1|n,t,void 0,r===void 0?null:r)}function Hl(e,n,t,r){var i=ur();r=r===void 0?null:r;var u=void 0;if(Rt!==null){var x=Rt.memoizedState;if(u=x.destroy,r!==null&&ri(r,x.deps)){i.memoizedState=il(n,t,u,r);return}}At.flags|=e,i.memoizedState=il(1|n,t,u,r)}function iu(e,n){return zl(8390656,8,e,n)}function si(e,n){return Hl(2048,8,e,n)}function su(e,n){return Hl(4,2,e,n)}function uu(e,n){return Hl(4,4,e,n)}function cu(e,n){if(typeof n=="function")return e=e(),n(e),function(){n(null)};if(n!=null)return e=e(),n.current=e,function(){n.current=null}}function du(e,n,t){return t=t!=null?t.concat([e]):null,Hl(4,4,cu.bind(null,n,e),t)}function ui(){}function fu(e,n){var t=ur();n=n===void 0?null:n;var r=t.memoizedState;return r!==null&&n!==null&&ri(n,r[1])?r[0]:(t.memoizedState=[e,n],e)}function pu(e,n){var t=ur();n=n===void 0?null:n;var r=t.memoizedState;return r!==null&&n!==null&&ri(n,r[1])?r[0]:(e=e(),t.memoizedState=[e,n],e)}function _u(e,n,t){return(da&21)===0?(e.baseState&&(e.baseState=!1,Zt=!0),e.memoizedState=t):(_r(t,n)||(t=he(),At.lanes|=t,fa|=t,e.baseState=!0),n)}function Yd(e,n){var t=jn;jn=t!==0&&4>t?t:4,e(!0);var r=ti.transition;ti.transition={};try{e(!1),n()}finally{jn=t,ti.transition=r}}function hu(){return ur().memoizedState}function $d(e,n,t){var r=Yr(e);if(t={lane:r,action:t,hasEagerState:!1,eagerState:null,next:null},mu(e))gu(n,t);else if(t=qs(e,n,t,r),t!==null){var i=Wt();vr(t,e,r,i),yu(t,n,r)}}function Qd(e,n,t){var r=Yr(e),i={lane:r,action:t,hasEagerState:!1,eagerState:null,next:null};if(mu(e))gu(n,i);else{var u=e.alternate;if(e.lanes===0&&(u===null||u.lanes===0)&&(u=n.lastRenderedReducer,u!==null))try{var x=n.lastRenderedState,W=u(x,t);if(i.hasEagerState=!0,i.eagerState=W,_r(W,x)){var ue=n.interleaved;ue===null?(i.next=i,$o(n)):(i.next=ue.next,ue.next=i),n.interleaved=i;return}}catch{}finally{}t=qs(e,n,i,r),t!==null&&(i=Wt(),vr(t,e,r,i),yu(t,n,r))}}function mu(e){var n=e.alternate;return e===At||n!==null&&n===At}function gu(e,n){al=jl=!0;var t=e.pending;t===null?n.next=n:(n.next=t.next,t.next=n),e.pending=n}function yu(e,n,t){if((t&4194240)!==0){var r=n.lanes;r&=e.pendingLanes,t|=r,n.lanes=t,zn(e,t)}}var Kl={readContext:sr,useCallback:zt,useContext:zt,useEffect:zt,useImperativeHandle:zt,useInsertionEffect:zt,useLayoutEffect:zt,useMemo:zt,useReducer:zt,useRef:zt,useState:zt,useDebugValue:zt,useDeferredValue:zt,useTransition:zt,useMutableSource:zt,useSyncExternalStore:zt,useId:zt,unstable_isNewReconciler:!1},Zd={readContext:sr,useCallback:function(e,n){return Ar().memoizedState=[e,n===void 0?null:n],e},useContext:sr,useEffect:iu,useImperativeHandle:function(e,n,t){return t=t!=null?t.concat([e]):null,zl(4194308,4,cu.bind(null,n,e),t)},useLayoutEffect:function(e,n){return zl(4194308,4,e,n)},useInsertionEffect:function(e,n){return zl(4,2,e,n)},useMemo:function(e,n){var t=Ar();return n=n===void 0?null:n,e=e(),t.memoizedState=[e,n],e},useReducer:function(e,n,t){var r=Ar();return n=t!==void 0?t(n):n,r.memoizedState=r.baseState=n,e={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:e,lastRenderedState:n},r.queue=e,e=e.dispatch=$d.bind(null,At,e),[r.memoizedState,e]},useRef:function(e){var n=Ar();return e={current:e},n.memoizedState=e},useState:lu,useDebugValue:ui,useDeferredValue:function(e){return Ar().memoizedState=e},useTransition:function(){var e=lu(!1),n=e[0];return e=Yd.bind(null,e[1]),Ar().memoizedState=e,[n,e]},useMutableSource:function(){},useSyncExternalStore:function(e,n,t){var r=At,i=Ar();if(kt){if(t===void 0)throw Error(d(407));t=t()}else{if(t=n(),Ut===null)throw Error(d(349));(da&30)!==0||eu(r,n,t)}i.memoizedState=t;var u={value:t,getSnapshot:n};return i.queue=u,iu(tu.bind(null,r,u,e),[e]),r.flags|=2048,il(9,nu.bind(null,r,u,t,n),void 0,null),t},useId:function(){var e=Ar(),n=Ut.identifierPrefix;if(kt){var t=Rr,r=Or;t=(r&~(1<<32-on(r)-1)).toString(32)+t,n=":"+n+"R"+t,t=ll++,0<t&&(n+="H"+t.toString(32)),n+=":"}else t=Wd++,n=":"+n+"r"+t.toString(32)+":";return e.memoizedState=n},unstable_isNewReconciler:!1},Jd={readContext:sr,useCallback:fu,useContext:sr,useEffect:si,useImperativeHandle:du,useInsertionEffect:su,useLayoutEffect:uu,useMemo:pu,useReducer:oi,useRef:ou,useState:function(){return oi(ol)},useDebugValue:ui,useDeferredValue:function(e){var n=ur();return _u(n,Rt.memoizedState,e)},useTransition:function(){var e=oi(ol)[0],n=ur().memoizedState;return[e,n]},useMutableSource:Zs,useSyncExternalStore:Js,useId:hu,unstable_isNewReconciler:!1},ef={readContext:sr,useCallback:fu,useContext:sr,useEffect:si,useImperativeHandle:du,useInsertionEffect:su,useLayoutEffect:uu,useMemo:pu,useReducer:ii,useRef:ou,useState:function(){return ii(ol)},useDebugValue:ui,useDeferredValue:function(e){var n=ur();return Rt===null?n.memoizedState=e:_u(n,Rt.memoizedState,e)},useTransition:function(){var e=ii(ol)[0],n=ur().memoizedState;return[e,n]},useMutableSource:Zs,useSyncExternalStore:Js,useId:hu,unstable_isNewReconciler:!1};function mr(e,n){if(e&&e.defaultProps){n=T({},n),e=e.defaultProps;for(var t in e)n[t]===void 0&&(n[t]=e[t]);return n}return n}function ci(e,n,t,r){n=e.memoizedState,t=t(r,n),t=t==null?n:T({},n,t),e.memoizedState=t,e.lanes===0&&(e.updateQueue.baseState=t)}var Xl={isMounted:function(e){return(e=e._reactInternals)?Me(e)===e:!1},enqueueSetState:function(e,n,t){e=e._reactInternals;var r=Wt(),i=Yr(e),u=Cr(r,i);u.payload=n,t!=null&&(u.callback=t),n=Kr(e,u,i),n!==null&&(vr(n,e,i,r),Gl(n,e,i))},enqueueReplaceState:function(e,n,t){e=e._reactInternals;var r=Wt(),i=Yr(e),u=Cr(r,i);u.tag=1,u.payload=n,t!=null&&(u.callback=t),n=Kr(e,u,i),n!==null&&(vr(n,e,i,r),Gl(n,e,i))},enqueueForceUpdate:function(e,n){e=e._reactInternals;var t=Wt(),r=Yr(e),i=Cr(t,r);i.tag=2,n!=null&&(i.callback=n),n=Kr(e,i,r),n!==null&&(vr(n,e,r,t),Gl(n,e,r))}};function vu(e,n,t,r,i,u,x){return e=e.stateNode,typeof e.shouldComponentUpdate=="function"?e.shouldComponentUpdate(r,u,x):n.prototype&&n.prototype.isPureReactComponent?!qa(t,r)||!qa(i,u):!0}function xu(e,n,t){var r=!1,i=jr,u=n.contextType;return typeof u=="object"&&u!==null?u=sr(u):(i=Qt(n)?oa:jt.current,r=n.contextTypes,u=(r=r!=null)?Ea(e,i):jr),n=new n(t,u),e.memoizedState=n.state!==null&&n.state!==void 0?n.state:null,n.updater=Xl,e.stateNode=n,n._reactInternals=e,r&&(e=e.stateNode,e.__reactInternalMemoizedUnmaskedChildContext=i,e.__reactInternalMemoizedMaskedChildContext=u),n}function ku(e,n,t,r){e=n.state,typeof n.componentWillReceiveProps=="function"&&n.componentWillReceiveProps(t,r),typeof n.UNSAFE_componentWillReceiveProps=="function"&&n.UNSAFE_componentWillReceiveProps(t,r),n.state!==e&&Xl.enqueueReplaceState(n,n.state,null)}function di(e,n,t,r){var i=e.stateNode;i.props=t,i.state=e.memoizedState,i.refs={},Qo(e);var u=n.contextType;typeof u=="object"&&u!==null?i.context=sr(u):(u=Qt(n)?oa:jt.current,i.context=Ea(e,u)),i.state=e.memoizedState,u=n.getDerivedStateFromProps,typeof u=="function"&&(ci(e,n,u,t),i.state=e.memoizedState),typeof n.getDerivedStateFromProps=="function"||typeof i.getSnapshotBeforeUpdate=="function"||typeof i.UNSAFE_componentWillMount!="function"&&typeof i.componentWillMount!="function"||(n=i.state,typeof i.componentWillMount=="function"&&i.componentWillMount(),typeof i.UNSAFE_componentWillMount=="function"&&i.UNSAFE_componentWillMount(),n!==i.state&&Xl.enqueueReplaceState(i,i.state,null),Bl(e,t,i,r),i.state=e.memoizedState),typeof i.componentDidMount=="function"&&(e.flags|=4194308)}function Ia(e,n){try{var t="",r=n;do t+=pn(r),r=r.return;while(r);var i=t}catch(u){i=`
Error generating stack: `+u.message+`
`+u.stack}return{value:e,source:n,stack:i,digest:null}}function fi(e,n,t){return{value:e,source:null,stack:t??null,digest:n??null}}function pi(e,n){try{console.error(n.value)}catch(t){setTimeout(function(){throw t})}}var nf=typeof WeakMap=="function"?WeakMap:Map;function wu(e,n,t){t=Cr(-1,t),t.tag=3,t.payload={element:null};var r=n.value;return t.callback=function(){Jl||(Jl=!0,Si=r),pi(e,n)},t}function Au(e,n,t){t=Cr(-1,t),t.tag=3;var r=e.type.getDerivedStateFromError;if(typeof r=="function"){var i=n.value;t.payload=function(){return r(i)},t.callback=function(){pi(e,n)}}var u=e.stateNode;return u!==null&&typeof u.componentDidCatch=="function"&&(t.callback=function(){pi(e,n),typeof r!="function"&&(qr===null?qr=new Set([this]):qr.add(this));var x=n.stack;this.componentDidCatch(n.value,{componentStack:x!==null?x:""})}),t}function bu(e,n,t){var r=e.pingCache;if(r===null){r=e.pingCache=new nf;var i=new Set;r.set(n,i)}else i=r.get(n),i===void 0&&(i=new Set,r.set(n,i));i.has(t)||(i.add(t),e=mf.bind(null,e,n,t),n.then(e,e))}function Tu(e){do{var n;if((n=e.tag===13)&&(n=e.memoizedState,n=n!==null?n.dehydrated!==null:!0),n)return e;e=e.return}while(e!==null);return null}function Eu(e,n,t,r,i){return(e.mode&1)===0?(e===n?e.flags|=65536:(e.flags|=128,t.flags|=131072,t.flags&=-52805,t.tag===1&&(t.alternate===null?t.tag=17:(n=Cr(-1,1),n.tag=2,Kr(t,n,1))),t.lanes|=1),e):(e.flags|=65536,e.lanes=i,e)}var tf=Ke.ReactCurrentOwner,Zt=!1;function qt(e,n,t,r){n.child=e===null?Xs(n,null,t,r):Ra(n,e.child,t,r)}function Lu(e,n,t,r,i){t=t.render;var u=n.ref;return Ca(n,i),r=ai(e,n,t,r,u,i),t=li(),e!==null&&!Zt?(n.updateQueue=e.updateQueue,n.flags&=-2053,e.lanes&=~i,Mr(e,n,i)):(kt&&t&&Vo(n),n.flags|=1,qt(e,n,r,i),n.child)}function Su(e,n,t,r,i){if(e===null){var u=t.type;return typeof u=="function"&&!Ui(u)&&u.defaultProps===void 0&&t.compare===null&&t.defaultProps===void 0?(n.tag=15,n.type=u,Ou(e,n,u,r,i)):(e=lo(t.type,null,r,n,n.mode,i),e.ref=n.ref,e.return=n,n.child=e)}if(u=e.child,(e.lanes&i)===0){var x=u.memoizedProps;if(t=t.compare,t=t!==null?t:qa,t(x,r)&&e.ref===n.ref)return Mr(e,n,i)}return n.flags|=1,e=Qr(u,r),e.ref=n.ref,e.return=n,n.child=e}function Ou(e,n,t,r,i){if(e!==null){var u=e.memoizedProps;if(qa(u,r)&&e.ref===n.ref)if(Zt=!1,n.pendingProps=r=u,(e.lanes&i)!==0)(e.flags&131072)!==0&&(Zt=!0);else return n.lanes=e.lanes,Mr(e,n,i)}return _i(e,n,t,r,i)}function Ru(e,n,t){var r=n.pendingProps,i=r.children,u=e!==null?e.memoizedState:null;if(r.mode==="hidden")if((n.mode&1)===0)n.memoizedState={baseLanes:0,cachePool:null,transitions:null},gt(Pa,lr),lr|=t;else{if((t&1073741824)===0)return e=u!==null?u.baseLanes|t:t,n.lanes=n.childLanes=1073741824,n.memoizedState={baseLanes:e,cachePool:null,transitions:null},n.updateQueue=null,gt(Pa,lr),lr|=e,null;n.memoizedState={baseLanes:0,cachePool:null,transitions:null},r=u!==null?u.baseLanes:t,gt(Pa,lr),lr|=r}else u!==null?(r=u.baseLanes|t,n.memoizedState=null):r=t,gt(Pa,lr),lr|=r;return qt(e,n,i,t),n.child}function Nu(e,n){var t=n.ref;(e===null&&t!==null||e!==null&&e.ref!==t)&&(n.flags|=512,n.flags|=2097152)}function _i(e,n,t,r,i){var u=Qt(t)?oa:jt.current;return u=Ea(n,u),Ca(n,i),t=ai(e,n,t,r,u,i),r=li(),e!==null&&!Zt?(n.updateQueue=e.updateQueue,n.flags&=-2053,e.lanes&=~i,Mr(e,n,i)):(kt&&r&&Vo(n),n.flags|=1,qt(e,n,t,i),n.child)}function Cu(e,n,t,r,i){if(Qt(t)){var u=!0;Rl(n)}else u=!1;if(Ca(n,i),n.stateNode===null)Wl(e,n),xu(n,t,r),di(n,t,r,i),r=!0;else if(e===null){var x=n.stateNode,W=n.memoizedProps;x.props=W;var ue=x.context,Ye=t.contextType;typeof Ye=="object"&&Ye!==null?Ye=sr(Ye):(Ye=Qt(t)?oa:jt.current,Ye=Ea(n,Ye));var En=t.getDerivedStateFromProps,Rn=typeof En=="function"||typeof x.getSnapshotBeforeUpdate=="function";Rn||typeof x.UNSAFE_componentWillReceiveProps!="function"&&typeof x.componentWillReceiveProps!="function"||(W!==r||ue!==Ye)&&ku(n,x,r,Ye),Hr=!1;var bn=n.memoizedState;x.state=bn,Bl(n,r,x,i),ue=n.memoizedState,W!==r||bn!==ue||$t.current||Hr?(typeof En=="function"&&(ci(n,t,En,r),ue=n.memoizedState),(W=Hr||vu(n,t,W,r,bn,ue,Ye))?(Rn||typeof x.UNSAFE_componentWillMount!="function"&&typeof x.componentWillMount!="function"||(typeof x.componentWillMount=="function"&&x.componentWillMount(),typeof x.UNSAFE_componentWillMount=="function"&&x.UNSAFE_componentWillMount()),typeof x.componentDidMount=="function"&&(n.flags|=4194308)):(typeof x.componentDidMount=="function"&&(n.flags|=4194308),n.memoizedProps=r,n.memoizedState=ue),x.props=r,x.state=ue,x.context=Ye,r=W):(typeof x.componentDidMount=="function"&&(n.flags|=4194308),r=!1)}else{x=n.stateNode,Ws(e,n),W=n.memoizedProps,Ye=n.type===n.elementType?W:mr(n.type,W),x.props=Ye,Rn=n.pendingProps,bn=x.context,ue=t.contextType,typeof ue=="object"&&ue!==null?ue=sr(ue):(ue=Qt(t)?oa:jt.current,ue=Ea(n,ue));var Hn=t.getDerivedStateFromProps;(En=typeof Hn=="function"||typeof x.getSnapshotBeforeUpdate=="function")||typeof x.UNSAFE_componentWillReceiveProps!="function"&&typeof x.componentWillReceiveProps!="function"||(W!==Rn||bn!==ue)&&ku(n,x,r,ue),Hr=!1,bn=n.memoizedState,x.state=bn,Bl(n,r,x,i);var qn=n.memoizedState;W!==Rn||bn!==qn||$t.current||Hr?(typeof Hn=="function"&&(ci(n,t,Hn,r),qn=n.memoizedState),(Ye=Hr||vu(n,t,Ye,r,bn,qn,ue)||!1)?(En||typeof x.UNSAFE_componentWillUpdate!="function"&&typeof x.componentWillUpdate!="function"||(typeof x.componentWillUpdate=="function"&&x.componentWillUpdate(r,qn,ue),typeof x.UNSAFE_componentWillUpdate=="function"&&x.UNSAFE_componentWillUpdate(r,qn,ue)),typeof x.componentDidUpdate=="function"&&(n.flags|=4),typeof x.getSnapshotBeforeUpdate=="function"&&(n.flags|=1024)):(typeof x.componentDidUpdate!="function"||W===e.memoizedProps&&bn===e.memoizedState||(n.flags|=4),typeof x.getSnapshotBeforeUpdate!="function"||W===e.memoizedProps&&bn===e.memoizedState||(n.flags|=1024),n.memoizedProps=r,n.memoizedState=qn),x.props=r,x.state=qn,x.context=ue,r=Ye):(typeof x.componentDidUpdate!="function"||W===e.memoizedProps&&bn===e.memoizedState||(n.flags|=4),typeof x.getSnapshotBeforeUpdate!="function"||W===e.memoizedProps&&bn===e.memoizedState||(n.flags|=1024),r=!1)}return hi(e,n,t,r,u,i)}function hi(e,n,t,r,i,u){Nu(e,n);var x=(n.flags&128)!==0;if(!r&&!x)return i&&Ds(n,t,!1),Mr(e,n,u);r=n.stateNode,tf.current=n;var W=x&&typeof t.getDerivedStateFromError!="function"?null:r.render();return n.flags|=1,e!==null&&x?(n.child=Ra(n,e.child,null,u),n.child=Ra(n,null,W,u)):qt(e,n,W,u),n.memoizedState=r.state,i&&Ds(n,t,!0),n.child}function Mu(e){var n=e.stateNode;n.pendingContext?Us(e,n.pendingContext,n.pendingContext!==n.context):n.context&&Us(e,n.context,!1),Zo(e,n.containerInfo)}function Iu(e,n,t,r,i){return Oa(),Ko(i),n.flags|=256,qt(e,n,t,r),n.child}var mi={dehydrated:null,treeContext:null,retryLane:0};function gi(e){return{baseLanes:e,cachePool:null,transitions:null}}function Uu(e,n,t){var r=n.pendingProps,i=wt.current,u=!1,x=(n.flags&128)!==0,W;if((W=x)||(W=e!==null&&e.memoizedState===null?!1:(i&2)!==0),W?(u=!0,n.flags&=-129):(e===null||e.memoizedState!==null)&&(i|=1),gt(wt,i&1),e===null)return Ho(n),e=n.memoizedState,e!==null&&(e=e.dehydrated,e!==null)?((n.mode&1)===0?n.lanes=1:e.data==="$!"?n.lanes=8:n.lanes=1073741824,null):(x=r.children,e=r.fallback,u?(r=n.mode,u=n.child,x={mode:"hidden",children:x},(r&1)===0&&u!==null?(u.childLanes=0,u.pendingProps=x):u=oo(x,r,0,null),e=ma(e,r,t,null),u.return=n,e.return=n,u.sibling=e,n.child=u,n.child.memoizedState=gi(t),n.memoizedState=mi,e):yi(n,x));if(i=e.memoizedState,i!==null&&(W=i.dehydrated,W!==null))return rf(e,n,x,r,W,i,t);if(u){u=r.fallback,x=n.mode,i=e.child,W=i.sibling;var ue={mode:"hidden",children:r.children};return(x&1)===0&&n.child!==i?(r=n.child,r.childLanes=0,r.pendingProps=ue,n.deletions=null):(r=Qr(i,ue),r.subtreeFlags=i.subtreeFlags&14680064),W!==null?u=Qr(W,u):(u=ma(u,x,t,null),u.flags|=2),u.return=n,r.return=n,r.sibling=u,n.child=r,r=u,u=n.child,x=e.child.memoizedState,x=x===null?gi(t):{baseLanes:x.baseLanes|t,cachePool:null,transitions:x.transitions},u.memoizedState=x,u.childLanes=e.childLanes&~t,n.memoizedState=mi,r}return u=e.child,e=u.sibling,r=Qr(u,{mode:"visible",children:r.children}),(n.mode&1)===0&&(r.lanes=t),r.return=n,r.sibling=null,e!==null&&(t=n.deletions,t===null?(n.deletions=[e],n.flags|=16):t.push(e)),n.child=r,n.memoizedState=null,r}function yi(e,n){return n=oo({mode:"visible",children:n},e.mode,0,null),n.return=e,e.child=n}function ql(e,n,t,r){return r!==null&&Ko(r),Ra(n,e.child,null,t),e=yi(n,n.pendingProps.children),e.flags|=2,n.memoizedState=null,e}function rf(e,n,t,r,i,u,x){if(t)return n.flags&256?(n.flags&=-257,r=fi(Error(d(422))),ql(e,n,x,r)):n.memoizedState!==null?(n.child=e.child,n.flags|=128,null):(u=r.fallback,i=n.mode,r=oo({mode:"visible",children:r.children},i,0,null),u=ma(u,i,x,null),u.flags|=2,r.return=n,u.return=n,r.sibling=u,n.child=r,(n.mode&1)!==0&&Ra(n,e.child,null,x),n.child.memoizedState=gi(x),n.memoizedState=mi,u);if((n.mode&1)===0)return ql(e,n,x,null);if(i.data==="$!"){if(r=i.nextSibling&&i.nextSibling.dataset,r)var W=r.dgst;return r=W,u=Error(d(419)),r=fi(u,r,void 0),ql(e,n,x,r)}if(W=(x&e.childLanes)!==0,Zt||W){if(r=Ut,r!==null){switch(x&-x){case 4:i=2;break;case 16:i=8;break;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:i=32;break;case 536870912:i=268435456;break;default:i=0}i=(i&(r.suspendedLanes|x))!==0?0:i,i!==0&&i!==u.retryLane&&(u.retryLane=i,Nr(e,i),vr(r,e,i,-1))}return Ii(),r=fi(Error(d(421))),ql(e,n,x,r)}return i.data==="$?"?(n.flags|=128,n.child=e.child,n=gf.bind(null,e),i._reactRetry=n,null):(e=u.treeContext,ar=Fr(i.nextSibling),rr=n,kt=!0,hr=null,e!==null&&(or[ir++]=Or,or[ir++]=Rr,or[ir++]=ia,Or=e.id,Rr=e.overflow,ia=n),n=yi(n,r.children),n.flags|=4096,n)}function Pu(e,n,t){e.lanes|=n;var r=e.alternate;r!==null&&(r.lanes|=n),Yo(e.return,n,t)}function vi(e,n,t,r,i){var u=e.memoizedState;u===null?e.memoizedState={isBackwards:n,rendering:null,renderingStartTime:0,last:r,tail:t,tailMode:i}:(u.isBackwards=n,u.rendering=null,u.renderingStartTime=0,u.last=r,u.tail=t,u.tailMode=i)}function Du(e,n,t){var r=n.pendingProps,i=r.revealOrder,u=r.tail;if(qt(e,n,r.children,t),r=wt.current,(r&2)!==0)r=r&1|2,n.flags|=128;else{if(e!==null&&(e.flags&128)!==0)e:for(e=n.child;e!==null;){if(e.tag===13)e.memoizedState!==null&&Pu(e,t,n);else if(e.tag===19)Pu(e,t,n);else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===n)break e;for(;e.sibling===null;){if(e.return===null||e.return===n)break e;e=e.return}e.sibling.return=e.return,e=e.sibling}r&=1}if(gt(wt,r),(n.mode&1)===0)n.memoizedState=null;else switch(i){case"forwards":for(t=n.child,i=null;t!==null;)e=t.alternate,e!==null&&Fl(e)===null&&(i=t),t=t.sibling;t=i,t===null?(i=n.child,n.child=null):(i=t.sibling,t.sibling=null),vi(n,!1,i,t,u);break;case"backwards":for(t=null,i=n.child,n.child=null;i!==null;){if(e=i.alternate,e!==null&&Fl(e)===null){n.child=i;break}e=i.sibling,i.sibling=t,t=i,i=e}vi(n,!0,t,null,u);break;case"together":vi(n,!1,null,null,void 0);break;default:n.memoizedState=null}return n.child}function Wl(e,n){(n.mode&1)===0&&e!==null&&(e.alternate=null,n.alternate=null,n.flags|=2)}function Mr(e,n,t){if(e!==null&&(n.dependencies=e.dependencies),fa|=n.lanes,(t&n.childLanes)===0)return null;if(e!==null&&n.child!==e.child)throw Error(d(153));if(n.child!==null){for(e=n.child,t=Qr(e,e.pendingProps),n.child=t,t.return=n;e.sibling!==null;)e=e.sibling,t=t.sibling=Qr(e,e.pendingProps),t.return=n;t.sibling=null}return n.child}function af(e,n,t){switch(n.tag){case 3:Mu(n),Oa();break;case 5:Qs(n);break;case 1:Qt(n.type)&&Rl(n);break;case 4:Zo(n,n.stateNode.containerInfo);break;case 10:var r=n.type._context,i=n.memoizedProps.value;gt(Pl,r._currentValue),r._currentValue=i;break;case 13:if(r=n.memoizedState,r!==null)return r.dehydrated!==null?(gt(wt,wt.current&1),n.flags|=128,null):(t&n.child.childLanes)!==0?Uu(e,n,t):(gt(wt,wt.current&1),e=Mr(e,n,t),e!==null?e.sibling:null);gt(wt,wt.current&1);break;case 19:if(r=(t&n.childLanes)!==0,(e.flags&128)!==0){if(r)return Du(e,n,t);n.flags|=128}if(i=n.memoizedState,i!==null&&(i.rendering=null,i.tail=null,i.lastEffect=null),gt(wt,wt.current),r)break;return null;case 22:case 23:return n.lanes=0,Ru(e,n,t)}return Mr(e,n,t)}var Gu,xi,Bu,Fu;Gu=function(e,n){for(var t=n.child;t!==null;){if(t.tag===5||t.tag===6)e.appendChild(t.stateNode);else if(t.tag!==4&&t.child!==null){t.child.return=t,t=t.child;continue}if(t===n)break;for(;t.sibling===null;){if(t.return===null||t.return===n)return;t=t.return}t.sibling.return=t.return,t=t.sibling}},xi=function(){},Bu=function(e,n,t,r){var i=e.memoizedProps;if(i!==r){e=n.stateNode,ca(wr.current);var u=null;switch(t){case"input":i=On(e,i),r=On(e,r),u=[];break;case"select":i=T({},i,{value:void 0}),r=T({},r,{value:void 0}),u=[];break;case"textarea":i=G(e,i),r=G(e,r),u=[];break;default:typeof i.onClick!="function"&&typeof r.onClick=="function"&&(e.onclick=Ll)}f(t,r);var x;t=null;for(Ye in i)if(!r.hasOwnProperty(Ye)&&i.hasOwnProperty(Ye)&&i[Ye]!=null)if(Ye==="style"){var W=i[Ye];for(x in W)W.hasOwnProperty(x)&&(t||(t={}),t[x]="")}else Ye!=="dangerouslySetInnerHTML"&&Ye!=="children"&&Ye!=="suppressContentEditableWarning"&&Ye!=="suppressHydrationWarning"&&Ye!=="autoFocus"&&(v.hasOwnProperty(Ye)?u||(u=[]):(u=u||[]).push(Ye,null));for(Ye in r){var ue=r[Ye];if(W=i!=null?i[Ye]:void 0,r.hasOwnProperty(Ye)&&ue!==W&&(ue!=null||W!=null))if(Ye==="style")if(W){for(x in W)!W.hasOwnProperty(x)||ue&&ue.hasOwnProperty(x)||(t||(t={}),t[x]="");for(x in ue)ue.hasOwnProperty(x)&&W[x]!==ue[x]&&(t||(t={}),t[x]=ue[x])}else t||(u||(u=[]),u.push(Ye,t)),t=ue;else Ye==="dangerouslySetInnerHTML"?(ue=ue?ue.__html:void 0,W=W?W.__html:void 0,ue!=null&&W!==ue&&(u=u||[]).push(Ye,ue)):Ye==="children"?typeof ue!="string"&&typeof ue!="number"||(u=u||[]).push(Ye,""+ue):Ye!=="suppressContentEditableWarning"&&Ye!=="suppressHydrationWarning"&&(v.hasOwnProperty(Ye)?(ue!=null&&Ye==="onScroll"&&yt("scroll",e),u||W===ue||(u=[])):(u=u||[]).push(Ye,ue))}t&&(u=u||[]).push("style",t);var Ye=u;(n.updateQueue=Ye)&&(n.flags|=4)}},Fu=function(e,n,t,r){t!==r&&(n.flags|=4)};function sl(e,n){if(!kt)switch(e.tailMode){case"hidden":n=e.tail;for(var t=null;n!==null;)n.alternate!==null&&(t=n),n=n.sibling;t===null?e.tail=null:t.sibling=null;break;case"collapsed":t=e.tail;for(var r=null;t!==null;)t.alternate!==null&&(r=t),t=t.sibling;r===null?n||e.tail===null?e.tail=null:e.tail.sibling=null:r.sibling=null}}function Ht(e){var n=e.alternate!==null&&e.alternate.child===e.child,t=0,r=0;if(n)for(var i=e.child;i!==null;)t|=i.lanes|i.childLanes,r|=i.subtreeFlags&14680064,r|=i.flags&14680064,i.return=e,i=i.sibling;else for(i=e.child;i!==null;)t|=i.lanes|i.childLanes,r|=i.subtreeFlags,r|=i.flags,i.return=e,i=i.sibling;return e.subtreeFlags|=r,e.childLanes=t,n}function lf(e,n,t){var r=n.pendingProps;switch(jo(n),n.tag){case 2:case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return Ht(n),null;case 1:return Qt(n.type)&&Ol(),Ht(n),null;case 3:return r=n.stateNode,Ma(),vt($t),vt(jt),ni(),r.pendingContext&&(r.context=r.pendingContext,r.pendingContext=null),(e===null||e.child===null)&&(Il(n)?n.flags|=4:e===null||e.memoizedState.isDehydrated&&(n.flags&256)===0||(n.flags|=1024,hr!==null&&(Ni(hr),hr=null))),xi(e,n),Ht(n),null;case 5:Jo(n);var i=ca(rl.current);if(t=n.type,e!==null&&n.stateNode!=null)Bu(e,n,t,r,i),e.ref!==n.ref&&(n.flags|=512,n.flags|=2097152);else{if(!r){if(n.stateNode===null)throw Error(d(166));return Ht(n),null}if(e=ca(wr.current),Il(n)){r=n.stateNode,t=n.type;var u=n.memoizedProps;switch(r[kr]=n,r[Za]=u,e=(n.mode&1)!==0,t){case"dialog":yt("cancel",r),yt("close",r);break;case"iframe":case"object":case"embed":yt("load",r);break;case"video":case"audio":for(i=0;i<Ya.length;i++)yt(Ya[i],r);break;case"source":yt("error",r);break;case"img":case"image":case"link":yt("error",r),yt("load",r);break;case"details":yt("toggle",r);break;case"input":kn(r,u),yt("invalid",r);break;case"select":r._wrapperState={wasMultiple:!!u.multiple},yt("invalid",r);break;case"textarea":be(r,u),yt("invalid",r)}f(t,u),i=null;for(var x in u)if(u.hasOwnProperty(x)){var W=u[x];x==="children"?typeof W=="string"?r.textContent!==W&&(u.suppressHydrationWarning!==!0&&El(r.textContent,W,e),i=["children",W]):typeof W=="number"&&r.textContent!==""+W&&(u.suppressHydrationWarning!==!0&&El(r.textContent,W,e),i=["children",""+W]):v.hasOwnProperty(x)&&W!=null&&x==="onScroll"&&yt("scroll",r)}switch(t){case"input":Ie(r),Ue(r,u,!0);break;case"textarea":Ie(r),Nn(r);break;case"select":case"option":break;default:typeof u.onClick=="function"&&(r.onclick=Ll)}r=i,n.updateQueue=r,r!==null&&(n.flags|=4)}else{x=i.nodeType===9?i:i.ownerDocument,e==="http://www.w3.org/1999/xhtml"&&(e=Un(t)),e==="http://www.w3.org/1999/xhtml"?t==="script"?(e=x.createElement("div"),e.innerHTML="<script><\/script>",e=e.removeChild(e.firstChild)):typeof r.is=="string"?e=x.createElement(t,{is:r.is}):(e=x.createElement(t),t==="select"&&(x=e,r.multiple?x.multiple=!0:r.size&&(x.size=r.size))):e=x.createElementNS(e,t),e[kr]=n,e[Za]=r,Gu(e,n,!1,!1),n.stateNode=e;e:{switch(x=I(t,r),t){case"dialog":yt("cancel",e),yt("close",e),i=r;break;case"iframe":case"object":case"embed":yt("load",e),i=r;break;case"video":case"audio":for(i=0;i<Ya.length;i++)yt(Ya[i],e);i=r;break;case"source":yt("error",e),i=r;break;case"img":case"image":case"link":yt("error",e),yt("load",e),i=r;break;case"details":yt("toggle",e),i=r;break;case"input":kn(e,r),i=On(e,r),yt("invalid",e);break;case"option":i=r;break;case"select":e._wrapperState={wasMultiple:!!r.multiple},i=T({},r,{value:void 0}),yt("invalid",e);break;case"textarea":be(e,r),i=G(e,r),yt("invalid",e);break;default:i=r}f(t,i),W=i;for(u in W)if(W.hasOwnProperty(u)){var ue=W[u];u==="style"?F(e,ue):u==="dangerouslySetInnerHTML"?(ue=ue?ue.__html:void 0,ue!=null&&ot(e,ue)):u==="children"?typeof ue=="string"?(t!=="textarea"||ue!=="")&&o(e,ue):typeof ue=="number"&&o(e,""+ue):u!=="suppressContentEditableWarning"&&u!=="suppressHydrationWarning"&&u!=="autoFocus"&&(v.hasOwnProperty(u)?ue!=null&&u==="onScroll"&&yt("scroll",e):ue!=null&&nn(e,u,ue,x))}switch(t){case"input":Ie(e),Ue(e,r,!1);break;case"textarea":Ie(e),Nn(e);break;case"option":r.value!=null&&e.setAttribute("value",""+mn(r.value));break;case"select":e.multiple=!!r.multiple,u=r.value,u!=null?He(e,!!r.multiple,u,!1):r.defaultValue!=null&&He(e,!!r.multiple,r.defaultValue,!0);break;default:typeof i.onClick=="function"&&(e.onclick=Ll)}switch(t){case"button":case"input":case"select":case"textarea":r=!!r.autoFocus;break e;case"img":r=!0;break e;default:r=!1}}r&&(n.flags|=4)}n.ref!==null&&(n.flags|=512,n.flags|=2097152)}return Ht(n),null;case 6:if(e&&n.stateNode!=null)Fu(e,n,e.memoizedProps,r);else{if(typeof r!="string"&&n.stateNode===null)throw Error(d(166));if(t=ca(rl.current),ca(wr.current),Il(n)){if(r=n.stateNode,t=n.memoizedProps,r[kr]=n,(u=r.nodeValue!==t)&&(e=rr,e!==null))switch(e.tag){case 3:El(r.nodeValue,t,(e.mode&1)!==0);break;case 5:e.memoizedProps.suppressHydrationWarning!==!0&&El(r.nodeValue,t,(e.mode&1)!==0)}u&&(n.flags|=4)}else r=(t.nodeType===9?t:t.ownerDocument).createTextNode(r),r[kr]=n,n.stateNode=r}return Ht(n),null;case 13:if(vt(wt),r=n.memoizedState,e===null||e.memoizedState!==null&&e.memoizedState.dehydrated!==null){if(kt&&ar!==null&&(n.mode&1)!==0&&(n.flags&128)===0)zs(),Oa(),n.flags|=98560,u=!1;else if(u=Il(n),r!==null&&r.dehydrated!==null){if(e===null){if(!u)throw Error(d(318));if(u=n.memoizedState,u=u!==null?u.dehydrated:null,!u)throw Error(d(317));u[kr]=n}else Oa(),(n.flags&128)===0&&(n.memoizedState=null),n.flags|=4;Ht(n),u=!1}else hr!==null&&(Ni(hr),hr=null),u=!0;if(!u)return n.flags&65536?n:null}return(n.flags&128)!==0?(n.lanes=t,n):(r=r!==null,r!==(e!==null&&e.memoizedState!==null)&&r&&(n.child.flags|=8192,(n.mode&1)!==0&&(e===null||(wt.current&1)!==0?Nt===0&&(Nt=3):Ii())),n.updateQueue!==null&&(n.flags|=4),Ht(n),null);case 4:return Ma(),xi(e,n),e===null&&$a(n.stateNode.containerInfo),Ht(n),null;case 10:return Wo(n.type._context),Ht(n),null;case 17:return Qt(n.type)&&Ol(),Ht(n),null;case 19:if(vt(wt),u=n.memoizedState,u===null)return Ht(n),null;if(r=(n.flags&128)!==0,x=u.rendering,x===null)if(r)sl(u,!1);else{if(Nt!==0||e!==null&&(e.flags&128)!==0)for(e=n.child;e!==null;){if(x=Fl(e),x!==null){for(n.flags|=128,sl(u,!1),r=x.updateQueue,r!==null&&(n.updateQueue=r,n.flags|=4),n.subtreeFlags=0,r=t,t=n.child;t!==null;)u=t,e=r,u.flags&=14680066,x=u.alternate,x===null?(u.childLanes=0,u.lanes=e,u.child=null,u.subtreeFlags=0,u.memoizedProps=null,u.memoizedState=null,u.updateQueue=null,u.dependencies=null,u.stateNode=null):(u.childLanes=x.childLanes,u.lanes=x.lanes,u.child=x.child,u.subtreeFlags=0,u.deletions=null,u.memoizedProps=x.memoizedProps,u.memoizedState=x.memoizedState,u.updateQueue=x.updateQueue,u.type=x.type,e=x.dependencies,u.dependencies=e===null?null:{lanes:e.lanes,firstContext:e.firstContext}),t=t.sibling;return gt(wt,wt.current&1|2),n.child}e=e.sibling}u.tail!==null&&Vn()>Da&&(n.flags|=128,r=!0,sl(u,!1),n.lanes=4194304)}else{if(!r)if(e=Fl(x),e!==null){if(n.flags|=128,r=!0,t=e.updateQueue,t!==null&&(n.updateQueue=t,n.flags|=4),sl(u,!0),u.tail===null&&u.tailMode==="hidden"&&!x.alternate&&!kt)return Ht(n),null}else 2*Vn()-u.renderingStartTime>Da&&t!==1073741824&&(n.flags|=128,r=!0,sl(u,!1),n.lanes=4194304);u.isBackwards?(x.sibling=n.child,n.child=x):(t=u.last,t!==null?t.sibling=x:n.child=x,u.last=x)}return u.tail!==null?(n=u.tail,u.rendering=n,u.tail=n.sibling,u.renderingStartTime=Vn(),n.sibling=null,t=wt.current,gt(wt,r?t&1|2:t&1),n):(Ht(n),null);case 22:case 23:return Mi(),r=n.memoizedState!==null,e!==null&&e.memoizedState!==null!==r&&(n.flags|=8192),r&&(n.mode&1)!==0?(lr&1073741824)!==0&&(Ht(n),n.subtreeFlags&6&&(n.flags|=8192)):Ht(n),null;case 24:return null;case 25:return null}throw Error(d(156,n.tag))}function of(e,n){switch(jo(n),n.tag){case 1:return Qt(n.type)&&Ol(),e=n.flags,e&65536?(n.flags=e&-65537|128,n):null;case 3:return Ma(),vt($t),vt(jt),ni(),e=n.flags,(e&65536)!==0&&(e&128)===0?(n.flags=e&-65537|128,n):null;case 5:return Jo(n),null;case 13:if(vt(wt),e=n.memoizedState,e!==null&&e.dehydrated!==null){if(n.alternate===null)throw Error(d(340));Oa()}return e=n.flags,e&65536?(n.flags=e&-65537|128,n):null;case 19:return vt(wt),null;case 4:return Ma(),null;case 10:return Wo(n.type._context),null;case 22:case 23:return Mi(),null;case 24:return null;default:return null}}var Yl=!1,Kt=!1,sf=typeof WeakSet=="function"?WeakSet:Set,Xn=null;function Ua(e,n){var t=e.ref;if(t!==null)if(typeof t=="function")try{t(null)}catch(r){Tt(e,n,r)}else t.current=null}function ki(e,n,t){try{t()}catch(r){Tt(e,n,r)}}var Vu=!1;function uf(e,n){if(Mo=aa,e=vs(),To(e)){if("selectionStart"in e)var t={start:e.selectionStart,end:e.selectionEnd};else e:{t=(t=e.ownerDocument)&&t.defaultView||window;var r=t.getSelection&&t.getSelection();if(r&&r.rangeCount!==0){t=r.anchorNode;var i=r.anchorOffset,u=r.focusNode;r=r.focusOffset;try{t.nodeType,u.nodeType}catch{t=null;break e}var x=0,W=-1,ue=-1,Ye=0,En=0,Rn=e,bn=null;n:for(;;){for(var Hn;Rn!==t||i!==0&&Rn.nodeType!==3||(W=x+i),Rn!==u||r!==0&&Rn.nodeType!==3||(ue=x+r),Rn.nodeType===3&&(x+=Rn.nodeValue.length),(Hn=Rn.firstChild)!==null;)bn=Rn,Rn=Hn;for(;;){if(Rn===e)break n;if(bn===t&&++Ye===i&&(W=x),bn===u&&++En===r&&(ue=x),(Hn=Rn.nextSibling)!==null)break;Rn=bn,bn=Rn.parentNode}Rn=Hn}t=W===-1||ue===-1?null:{start:W,end:ue}}else t=null}t=t||{start:0,end:0}}else t=null;for(Io={focusedElem:e,selectionRange:t},aa=!1,Xn=n;Xn!==null;)if(n=Xn,e=n.child,(n.subtreeFlags&1028)!==0&&e!==null)e.return=n,Xn=e;else for(;Xn!==null;){n=Xn;try{var qn=n.alternate;if((n.flags&1024)!==0)switch(n.tag){case 0:case 11:case 15:break;case 1:if(qn!==null){var Yn=qn.memoizedProps,Lt=qn.memoizedState,Be=n.stateNode,we=Be.getSnapshotBeforeUpdate(n.elementType===n.type?Yn:mr(n.type,Yn),Lt);Be.__reactInternalSnapshotBeforeUpdate=we}break;case 3:var je=n.stateNode.containerInfo;je.nodeType===1?je.textContent="":je.nodeType===9&&je.documentElement&&je.removeChild(je.documentElement);break;case 5:case 6:case 4:case 17:break;default:throw Error(d(163))}}catch(Cn){Tt(n,n.return,Cn)}if(e=n.sibling,e!==null){e.return=n.return,Xn=e;break}Xn=n.return}return qn=Vu,Vu=!1,qn}function ul(e,n,t){var r=n.updateQueue;if(r=r!==null?r.lastEffect:null,r!==null){var i=r=r.next;do{if((i.tag&e)===e){var u=i.destroy;i.destroy=void 0,u!==void 0&&ki(n,t,u)}i=i.next}while(i!==r)}}function $l(e,n){if(n=n.updateQueue,n=n!==null?n.lastEffect:null,n!==null){var t=n=n.next;do{if((t.tag&e)===e){var r=t.create;t.destroy=r()}t=t.next}while(t!==n)}}function wi(e){var n=e.ref;if(n!==null){var t=e.stateNode;switch(e.tag){case 5:e=t;break;default:e=t}typeof n=="function"?n(e):n.current=e}}function ju(e){var n=e.alternate;n!==null&&(e.alternate=null,ju(n)),e.child=null,e.deletions=null,e.sibling=null,e.tag===5&&(n=e.stateNode,n!==null&&(delete n[kr],delete n[Za],delete n[Go],delete n[Hd],delete n[Kd])),e.stateNode=null,e.return=null,e.dependencies=null,e.memoizedProps=null,e.memoizedState=null,e.pendingProps=null,e.stateNode=null,e.updateQueue=null}function zu(e){return e.tag===5||e.tag===3||e.tag===4}function Hu(e){e:for(;;){for(;e.sibling===null;){if(e.return===null||zu(e.return))return null;e=e.return}for(e.sibling.return=e.return,e=e.sibling;e.tag!==5&&e.tag!==6&&e.tag!==18;){if(e.flags&2||e.child===null||e.tag===4)continue e;e.child.return=e,e=e.child}if(!(e.flags&2))return e.stateNode}}function Ai(e,n,t){var r=e.tag;if(r===5||r===6)e=e.stateNode,n?t.nodeType===8?t.parentNode.insertBefore(e,n):t.insertBefore(e,n):(t.nodeType===8?(n=t.parentNode,n.insertBefore(e,t)):(n=t,n.appendChild(e)),t=t._reactRootContainer,t!=null||n.onclick!==null||(n.onclick=Ll));else if(r!==4&&(e=e.child,e!==null))for(Ai(e,n,t),e=e.sibling;e!==null;)Ai(e,n,t),e=e.sibling}function bi(e,n,t){var r=e.tag;if(r===5||r===6)e=e.stateNode,n?t.insertBefore(e,n):t.appendChild(e);else if(r!==4&&(e=e.child,e!==null))for(bi(e,n,t),e=e.sibling;e!==null;)bi(e,n,t),e=e.sibling}var Gt=null,gr=!1;function Xr(e,n,t){for(t=t.child;t!==null;)Ku(e,n,t),t=t.sibling}function Ku(e,n,t){if(ie&&typeof ie.onCommitFiberUnmount=="function")try{ie.onCommitFiberUnmount(E,t)}catch{}switch(t.tag){case 5:Kt||Ua(t,n);case 6:var r=Gt,i=gr;Gt=null,Xr(e,n,t),Gt=r,gr=i,Gt!==null&&(gr?(e=Gt,t=t.stateNode,e.nodeType===8?e.parentNode.removeChild(t):e.removeChild(t)):Gt.removeChild(t.stateNode));break;case 18:Gt!==null&&(gr?(e=Gt,t=t.stateNode,e.nodeType===8?Do(e.parentNode,t):e.nodeType===1&&Do(e,t),ra(e)):Do(Gt,t.stateNode));break;case 4:r=Gt,i=gr,Gt=t.stateNode.containerInfo,gr=!0,Xr(e,n,t),Gt=r,gr=i;break;case 0:case 11:case 14:case 15:if(!Kt&&(r=t.updateQueue,r!==null&&(r=r.lastEffect,r!==null))){i=r=r.next;do{var u=i,x=u.destroy;u=u.tag,x!==void 0&&((u&2)!==0||(u&4)!==0)&&ki(t,n,x),i=i.next}while(i!==r)}Xr(e,n,t);break;case 1:if(!Kt&&(Ua(t,n),r=t.stateNode,typeof r.componentWillUnmount=="function"))try{r.props=t.memoizedProps,r.state=t.memoizedState,r.componentWillUnmount()}catch(W){Tt(t,n,W)}Xr(e,n,t);break;case 21:Xr(e,n,t);break;case 22:t.mode&1?(Kt=(r=Kt)||t.memoizedState!==null,Xr(e,n,t),Kt=r):Xr(e,n,t);break;default:Xr(e,n,t)}}function Xu(e){var n=e.updateQueue;if(n!==null){e.updateQueue=null;var t=e.stateNode;t===null&&(t=e.stateNode=new sf),n.forEach(function(r){var i=yf.bind(null,e,r);t.has(r)||(t.add(r),r.then(i,i))})}}function yr(e,n){var t=n.deletions;if(t!==null)for(var r=0;r<t.length;r++){var i=t[r];try{var u=e,x=n,W=x;e:for(;W!==null;){switch(W.tag){case 5:Gt=W.stateNode,gr=!1;break e;case 3:Gt=W.stateNode.containerInfo,gr=!0;break e;case 4:Gt=W.stateNode.containerInfo,gr=!0;break e}W=W.return}if(Gt===null)throw Error(d(160));Ku(u,x,i),Gt=null,gr=!1;var ue=i.alternate;ue!==null&&(ue.return=null),i.return=null}catch(Ye){Tt(i,n,Ye)}}if(n.subtreeFlags&12854)for(n=n.child;n!==null;)qu(n,e),n=n.sibling}function qu(e,n){var t=e.alternate,r=e.flags;switch(e.tag){case 0:case 11:case 14:case 15:if(yr(n,e),br(e),r&4){try{ul(3,e,e.return),$l(3,e)}catch(Yn){Tt(e,e.return,Yn)}try{ul(5,e,e.return)}catch(Yn){Tt(e,e.return,Yn)}}break;case 1:yr(n,e),br(e),r&512&&t!==null&&Ua(t,t.return);break;case 5:if(yr(n,e),br(e),r&512&&t!==null&&Ua(t,t.return),e.flags&32){var i=e.stateNode;try{o(i,"")}catch(Yn){Tt(e,e.return,Yn)}}if(r&4&&(i=e.stateNode,i!=null)){var u=e.memoizedProps,x=t!==null?t.memoizedProps:u,W=e.type,ue=e.updateQueue;if(e.updateQueue=null,ue!==null)try{W==="input"&&u.type==="radio"&&u.name!=null&&Je(i,u),I(W,x);var Ye=I(W,u);for(x=0;x<ue.length;x+=2){var En=ue[x],Rn=ue[x+1];En==="style"?F(i,Rn):En==="dangerouslySetInnerHTML"?ot(i,Rn):En==="children"?o(i,Rn):nn(i,En,Rn,Ye)}switch(W){case"input":le(i,u);break;case"textarea":Pe(i,u);break;case"select":var bn=i._wrapperState.wasMultiple;i._wrapperState.wasMultiple=!!u.multiple;var Hn=u.value;Hn!=null?He(i,!!u.multiple,Hn,!1):bn!==!!u.multiple&&(u.defaultValue!=null?He(i,!!u.multiple,u.defaultValue,!0):He(i,!!u.multiple,u.multiple?[]:"",!1))}i[Za]=u}catch(Yn){Tt(e,e.return,Yn)}}break;case 6:if(yr(n,e),br(e),r&4){if(e.stateNode===null)throw Error(d(162));i=e.stateNode,u=e.memoizedProps;try{i.nodeValue=u}catch(Yn){Tt(e,e.return,Yn)}}break;case 3:if(yr(n,e),br(e),r&4&&t!==null&&t.memoizedState.isDehydrated)try{ra(n.containerInfo)}catch(Yn){Tt(e,e.return,Yn)}break;case 4:yr(n,e),br(e);break;case 13:yr(n,e),br(e),i=e.child,i.flags&8192&&(u=i.memoizedState!==null,i.stateNode.isHidden=u,!u||i.alternate!==null&&i.alternate.memoizedState!==null||(Li=Vn())),r&4&&Xu(e);break;case 22:if(En=t!==null&&t.memoizedState!==null,e.mode&1?(Kt=(Ye=Kt)||En,yr(n,e),Kt=Ye):yr(n,e),br(e),r&8192){if(Ye=e.memoizedState!==null,(e.stateNode.isHidden=Ye)&&!En&&(e.mode&1)!==0)for(Xn=e,En=e.child;En!==null;){for(Rn=Xn=En;Xn!==null;){switch(bn=Xn,Hn=bn.child,bn.tag){case 0:case 11:case 14:case 15:ul(4,bn,bn.return);break;case 1:Ua(bn,bn.return);var qn=bn.stateNode;if(typeof qn.componentWillUnmount=="function"){r=bn,t=bn.return;try{n=r,qn.props=n.memoizedProps,qn.state=n.memoizedState,qn.componentWillUnmount()}catch(Yn){Tt(r,t,Yn)}}break;case 5:Ua(bn,bn.return);break;case 22:if(bn.memoizedState!==null){$u(Rn);continue}}Hn!==null?(Hn.return=bn,Xn=Hn):$u(Rn)}En=En.sibling}e:for(En=null,Rn=e;;){if(Rn.tag===5){if(En===null){En=Rn;try{i=Rn.stateNode,Ye?(u=i.style,typeof u.setProperty=="function"?u.setProperty("display","none","important"):u.display="none"):(W=Rn.stateNode,ue=Rn.memoizedProps.style,x=ue!=null&&ue.hasOwnProperty("display")?ue.display:null,W.style.display=q("display",x))}catch(Yn){Tt(e,e.return,Yn)}}}else if(Rn.tag===6){if(En===null)try{Rn.stateNode.nodeValue=Ye?"":Rn.memoizedProps}catch(Yn){Tt(e,e.return,Yn)}}else if((Rn.tag!==22&&Rn.tag!==23||Rn.memoizedState===null||Rn===e)&&Rn.child!==null){Rn.child.return=Rn,Rn=Rn.child;continue}if(Rn===e)break e;for(;Rn.sibling===null;){if(Rn.return===null||Rn.return===e)break e;En===Rn&&(En=null),Rn=Rn.return}En===Rn&&(En=null),Rn.sibling.return=Rn.return,Rn=Rn.sibling}}break;case 19:yr(n,e),br(e),r&4&&Xu(e);break;case 21:break;default:yr(n,e),br(e)}}function br(e){var n=e.flags;if(n&2){try{e:{for(var t=e.return;t!==null;){if(zu(t)){var r=t;break e}t=t.return}throw Error(d(160))}switch(r.tag){case 5:var i=r.stateNode;r.flags&32&&(o(i,""),r.flags&=-33);var u=Hu(e);bi(e,u,i);break;case 3:case 4:var x=r.stateNode.containerInfo,W=Hu(e);Ai(e,W,x);break;default:throw Error(d(161))}}catch(ue){Tt(e,e.return,ue)}e.flags&=-3}n&4096&&(e.flags&=-4097)}function cf(e,n,t){Xn=e,Wu(e)}function Wu(e,n,t){for(var r=(e.mode&1)!==0;Xn!==null;){var i=Xn,u=i.child;if(i.tag===22&&r){var x=i.memoizedState!==null||Yl;if(!x){var W=i.alternate,ue=W!==null&&W.memoizedState!==null||Kt;W=Yl;var Ye=Kt;if(Yl=x,(Kt=ue)&&!Ye)for(Xn=i;Xn!==null;)x=Xn,ue=x.child,x.tag===22&&x.memoizedState!==null?Qu(i):ue!==null?(ue.return=x,Xn=ue):Qu(i);for(;u!==null;)Xn=u,Wu(u),u=u.sibling;Xn=i,Yl=W,Kt=Ye}Yu(e)}else(i.subtreeFlags&8772)!==0&&u!==null?(u.return=i,Xn=u):Yu(e)}}function Yu(e){for(;Xn!==null;){var n=Xn;if((n.flags&8772)!==0){var t=n.alternate;try{if((n.flags&8772)!==0)switch(n.tag){case 0:case 11:case 15:Kt||$l(5,n);break;case 1:var r=n.stateNode;if(n.flags&4&&!Kt)if(t===null)r.componentDidMount();else{var i=n.elementType===n.type?t.memoizedProps:mr(n.type,t.memoizedProps);r.componentDidUpdate(i,t.memoizedState,r.__reactInternalSnapshotBeforeUpdate)}var u=n.updateQueue;u!==null&&$s(n,u,r);break;case 3:var x=n.updateQueue;if(x!==null){if(t=null,n.child!==null)switch(n.child.tag){case 5:t=n.child.stateNode;break;case 1:t=n.child.stateNode}$s(n,x,t)}break;case 5:var W=n.stateNode;if(t===null&&n.flags&4){t=W;var ue=n.memoizedProps;switch(n.type){case"button":case"input":case"select":case"textarea":ue.autoFocus&&t.focus();break;case"img":ue.src&&(t.src=ue.src)}}break;case 6:break;case 4:break;case 12:break;case 13:if(n.memoizedState===null){var Ye=n.alternate;if(Ye!==null){var En=Ye.memoizedState;if(En!==null){var Rn=En.dehydrated;Rn!==null&&ra(Rn)}}}break;case 19:case 17:case 21:case 22:case 23:case 25:break;default:throw Error(d(163))}Kt||n.flags&512&&wi(n)}catch(bn){Tt(n,n.return,bn)}}if(n===e){Xn=null;break}if(t=n.sibling,t!==null){t.return=n.return,Xn=t;break}Xn=n.return}}function $u(e){for(;Xn!==null;){var n=Xn;if(n===e){Xn=null;break}var t=n.sibling;if(t!==null){t.return=n.return,Xn=t;break}Xn=n.return}}function Qu(e){for(;Xn!==null;){var n=Xn;try{switch(n.tag){case 0:case 11:case 15:var t=n.return;try{$l(4,n)}catch(ue){Tt(n,t,ue)}break;case 1:var r=n.stateNode;if(typeof r.componentDidMount=="function"){var i=n.return;try{r.componentDidMount()}catch(ue){Tt(n,i,ue)}}var u=n.return;try{wi(n)}catch(ue){Tt(n,u,ue)}break;case 5:var x=n.return;try{wi(n)}catch(ue){Tt(n,x,ue)}}}catch(ue){Tt(n,n.return,ue)}if(n===e){Xn=null;break}var W=n.sibling;if(W!==null){W.return=n.return,Xn=W;break}Xn=n.return}}var df=Math.ceil,Ql=Ke.ReactCurrentDispatcher,Ti=Ke.ReactCurrentOwner,cr=Ke.ReactCurrentBatchConfig,ft=0,Ut=null,Ot=null,Bt=0,lr=0,Pa=Vr(0),Nt=0,cl=null,fa=0,Zl=0,Ei=0,dl=null,Jt=null,Li=0,Da=1/0,Ir=null,Jl=!1,Si=null,qr=null,eo=!1,Wr=null,no=0,fl=0,Oi=null,to=-1,ro=0;function Wt(){return(ft&6)!==0?Vn():to!==-1?to:to=Vn()}function Yr(e){return(e.mode&1)===0?1:(ft&2)!==0&&Bt!==0?Bt&-Bt:qd.transition!==null?(ro===0&&(ro=he()),ro):(e=jn,e!==0||(e=window.event,e=e===void 0?16:Z(e.type)),e)}function vr(e,n,t,r){if(50<fl)throw fl=0,Oi=null,Error(d(185));Ln(e,t,r),((ft&2)===0||e!==Ut)&&(e===Ut&&((ft&2)===0&&(Zl|=t),Nt===4&&$r(e,Bt)),er(e,r),t===1&&ft===0&&(n.mode&1)===0&&(Da=Vn()+500,Nl&&zr()))}function er(e,n){var t=e.callbackNode;K(e,n);var r=p(e,e===Ut?Bt:0);if(r===0)t!==null&&ht(t),e.callbackNode=null,e.callbackPriority=0;else if(n=r&-r,e.callbackPriority!==n){if(t!=null&&ht(t),n===1)e.tag===0?Xd(Ju.bind(null,e)):Gs(Ju.bind(null,e)),jd(function(){(ft&6)===0&&zr()}),t=null;else{switch(A(r)){case 1:t=it;break;case 4:t=Ct;break;case 16:t=pt;break;case 536870912:t=bt;break;default:t=pt}t=ic(t,Zu.bind(null,e))}e.callbackPriority=n,e.callbackNode=t}}function Zu(e,n){if(to=-1,ro=0,(ft&6)!==0)throw Error(d(327));var t=e.callbackNode;if(Ga()&&e.callbackNode!==t)return null;var r=p(e,e===Ut?Bt:0);if(r===0)return null;if((r&30)!==0||(r&e.expiredLanes)!==0||n)n=ao(e,r);else{n=r;var i=ft;ft|=2;var u=nc();(Ut!==e||Bt!==n)&&(Ir=null,Da=Vn()+500,_a(e,n));do try{_f();break}catch(W){ec(e,W)}while(!0);qo(),Ql.current=u,ft=i,Ot!==null?n=0:(Ut=null,Bt=0,n=Nt)}if(n!==0){if(n===2&&(i=ye(e),i!==0&&(r=i,n=Ri(e,i))),n===1)throw t=cl,_a(e,0),$r(e,r),er(e,Vn()),t;if(n===6)$r(e,r);else{if(i=e.current.alternate,(r&30)===0&&!ff(i)&&(n=ao(e,r),n===2&&(u=ye(e),u!==0&&(r=u,n=Ri(e,u))),n===1))throw t=cl,_a(e,0),$r(e,r),er(e,Vn()),t;switch(e.finishedWork=i,e.finishedLanes=r,n){case 0:case 1:throw Error(d(345));case 2:ha(e,Jt,Ir);break;case 3:if($r(e,r),(r&130023424)===r&&(n=Li+500-Vn(),10<n)){if(p(e,0)!==0)break;if(i=e.suspendedLanes,(i&r)!==r){Wt(),e.pingedLanes|=e.suspendedLanes&i;break}e.timeoutHandle=Po(ha.bind(null,e,Jt,Ir),n);break}ha(e,Jt,Ir);break;case 4:if($r(e,r),(r&4194240)===r)break;for(n=e.eventTimes,i=-1;0<r;){var x=31-on(r);u=1<<x,x=n[x],x>i&&(i=x),r&=~u}if(r=i,r=Vn()-r,r=(120>r?120:480>r?480:1080>r?1080:1920>r?1920:3e3>r?3e3:4320>r?4320:1960*df(r/1960))-r,10<r){e.timeoutHandle=Po(ha.bind(null,e,Jt,Ir),r);break}ha(e,Jt,Ir);break;case 5:ha(e,Jt,Ir);break;default:throw Error(d(329))}}}return er(e,Vn()),e.callbackNode===t?Zu.bind(null,e):null}function Ri(e,n){var t=dl;return e.current.memoizedState.isDehydrated&&(_a(e,n).flags|=256),e=ao(e,n),e!==2&&(n=Jt,Jt=t,n!==null&&Ni(n)),e}function Ni(e){Jt===null?Jt=e:Jt.push.apply(Jt,e)}function ff(e){for(var n=e;;){if(n.flags&16384){var t=n.updateQueue;if(t!==null&&(t=t.stores,t!==null))for(var r=0;r<t.length;r++){var i=t[r],u=i.getSnapshot;i=i.value;try{if(!_r(u(),i))return!1}catch{return!1}}}if(t=n.child,n.subtreeFlags&16384&&t!==null)t.return=n,n=t;else{if(n===e)break;for(;n.sibling===null;){if(n.return===null||n.return===e)return!0;n=n.return}n.sibling.return=n.return,n=n.sibling}}return!0}function $r(e,n){for(n&=~Ei,n&=~Zl,e.suspendedLanes|=n,e.pingedLanes&=~n,e=e.expirationTimes;0<n;){var t=31-on(n),r=1<<t;e[t]=-1,n&=~r}}function Ju(e){if((ft&6)!==0)throw Error(d(327));Ga();var n=p(e,0);if((n&1)===0)return er(e,Vn()),null;var t=ao(e,n);if(e.tag!==0&&t===2){var r=ye(e);r!==0&&(n=r,t=Ri(e,r))}if(t===1)throw t=cl,_a(e,0),$r(e,n),er(e,Vn()),t;if(t===6)throw Error(d(345));return e.finishedWork=e.current.alternate,e.finishedLanes=n,ha(e,Jt,Ir),er(e,Vn()),null}function Ci(e,n){var t=ft;ft|=1;try{return e(n)}finally{ft=t,ft===0&&(Da=Vn()+500,Nl&&zr())}}function pa(e){Wr!==null&&Wr.tag===0&&(ft&6)===0&&Ga();var n=ft;ft|=1;var t=cr.transition,r=jn;try{if(cr.transition=null,jn=1,e)return e()}finally{jn=r,cr.transition=t,ft=n,(ft&6)===0&&zr()}}function Mi(){lr=Pa.current,vt(Pa)}function _a(e,n){e.finishedWork=null,e.finishedLanes=0;var t=e.timeoutHandle;if(t!==-1&&(e.timeoutHandle=-1,Vd(t)),Ot!==null)for(t=Ot.return;t!==null;){var r=t;switch(jo(r),r.tag){case 1:r=r.type.childContextTypes,r!=null&&Ol();break;case 3:Ma(),vt($t),vt(jt),ni();break;case 5:Jo(r);break;case 4:Ma();break;case 13:vt(wt);break;case 19:vt(wt);break;case 10:Wo(r.type._context);break;case 22:case 23:Mi()}t=t.return}if(Ut=e,Ot=e=Qr(e.current,null),Bt=lr=n,Nt=0,cl=null,Ei=Zl=fa=0,Jt=dl=null,ua!==null){for(n=0;n<ua.length;n++)if(t=ua[n],r=t.interleaved,r!==null){t.interleaved=null;var i=r.next,u=t.pending;if(u!==null){var x=u.next;u.next=i,r.next=x}t.pending=r}ua=null}return e}function ec(e,n){do{var t=Ot;try{if(qo(),Vl.current=Kl,jl){for(var r=At.memoizedState;r!==null;){var i=r.queue;i!==null&&(i.pending=null),r=r.next}jl=!1}if(da=0,It=Rt=At=null,al=!1,ll=0,Ti.current=null,t===null||t.return===null){Nt=1,cl=n,Ot=null;break}e:{var u=e,x=t.return,W=t,ue=n;if(n=Bt,W.flags|=32768,ue!==null&&typeof ue=="object"&&typeof ue.then=="function"){var Ye=ue,En=W,Rn=En.tag;if((En.mode&1)===0&&(Rn===0||Rn===11||Rn===15)){var bn=En.alternate;bn?(En.updateQueue=bn.updateQueue,En.memoizedState=bn.memoizedState,En.lanes=bn.lanes):(En.updateQueue=null,En.memoizedState=null)}var Hn=Tu(x);if(Hn!==null){Hn.flags&=-257,Eu(Hn,x,W,u,n),Hn.mode&1&&bu(u,Ye,n),n=Hn,ue=Ye;var qn=n.updateQueue;if(qn===null){var Yn=new Set;Yn.add(ue),n.updateQueue=Yn}else qn.add(ue);break e}else{if((n&1)===0){bu(u,Ye,n),Ii();break e}ue=Error(d(426))}}else if(kt&&W.mode&1){var Lt=Tu(x);if(Lt!==null){(Lt.flags&65536)===0&&(Lt.flags|=256),Eu(Lt,x,W,u,n),Ko(Ia(ue,W));break e}}u=ue=Ia(ue,W),Nt!==4&&(Nt=2),dl===null?dl=[u]:dl.push(u),u=x;do{switch(u.tag){case 3:u.flags|=65536,n&=-n,u.lanes|=n;var Be=wu(u,ue,n);Ys(u,Be);break e;case 1:W=ue;var we=u.type,je=u.stateNode;if((u.flags&128)===0&&(typeof we.getDerivedStateFromError=="function"||je!==null&&typeof je.componentDidCatch=="function"&&(qr===null||!qr.has(je)))){u.flags|=65536,n&=-n,u.lanes|=n;var Cn=Au(u,W,n);Ys(u,Cn);break e}}u=u.return}while(u!==null)}rc(t)}catch(Qn){n=Qn,Ot===t&&t!==null&&(Ot=t=t.return);continue}break}while(!0)}function nc(){var e=Ql.current;return Ql.current=Kl,e===null?Kl:e}function Ii(){(Nt===0||Nt===3||Nt===2)&&(Nt=4),Ut===null||(fa&268435455)===0&&(Zl&268435455)===0||$r(Ut,Bt)}function ao(e,n){var t=ft;ft|=2;var r=nc();(Ut!==e||Bt!==n)&&(Ir=null,_a(e,n));do try{pf();break}catch(i){ec(e,i)}while(!0);if(qo(),ft=t,Ql.current=r,Ot!==null)throw Error(d(261));return Ut=null,Bt=0,Nt}function pf(){for(;Ot!==null;)tc(Ot)}function _f(){for(;Ot!==null&&!Fn();)tc(Ot)}function tc(e){var n=oc(e.alternate,e,lr);e.memoizedProps=e.pendingProps,n===null?rc(e):Ot=n,Ti.current=null}function rc(e){var n=e;do{var t=n.alternate;if(e=n.return,(n.flags&32768)===0){if(t=lf(t,n,lr),t!==null){Ot=t;return}}else{if(t=of(t,n),t!==null){t.flags&=32767,Ot=t;return}if(e!==null)e.flags|=32768,e.subtreeFlags=0,e.deletions=null;else{Nt=6,Ot=null;return}}if(n=n.sibling,n!==null){Ot=n;return}Ot=n=e}while(n!==null);Nt===0&&(Nt=5)}function ha(e,n,t){var r=jn,i=cr.transition;try{cr.transition=null,jn=1,hf(e,n,t,r)}finally{cr.transition=i,jn=r}return null}function hf(e,n,t,r){do Ga();while(Wr!==null);if((ft&6)!==0)throw Error(d(327));t=e.finishedWork;var i=e.finishedLanes;if(t===null)return null;if(e.finishedWork=null,e.finishedLanes=0,t===e.current)throw Error(d(177));e.callbackNode=null,e.callbackPriority=0;var u=t.lanes|t.childLanes;if(Gn(e,u),e===Ut&&(Ot=Ut=null,Bt=0),(t.subtreeFlags&2064)===0&&(t.flags&2064)===0||eo||(eo=!0,ic(pt,function(){return Ga(),null})),u=(t.flags&15990)!==0,(t.subtreeFlags&15990)!==0||u){u=cr.transition,cr.transition=null;var x=jn;jn=1;var W=ft;ft|=4,Ti.current=null,uf(e,t),qu(t,e),Id(Io),aa=!!Mo,Io=Mo=null,e.current=t,cf(t),Jn(),ft=W,jn=x,cr.transition=u}else e.current=t;if(eo&&(eo=!1,Wr=e,no=i),u=e.pendingLanes,u===0&&(qr=null),cn(t.stateNode),er(e,Vn()),n!==null)for(r=e.onRecoverableError,t=0;t<n.length;t++)i=n[t],r(i.value,{componentStack:i.stack,digest:i.digest});if(Jl)throw Jl=!1,e=Si,Si=null,e;return(no&1)!==0&&e.tag!==0&&Ga(),u=e.pendingLanes,(u&1)!==0?e===Oi?fl++:(fl=0,Oi=e):fl=0,zr(),null}function Ga(){if(Wr!==null){var e=A(no),n=cr.transition,t=jn;try{if(cr.transition=null,jn=16>e?16:e,Wr===null)var r=!1;else{if(e=Wr,Wr=null,no=0,(ft&6)!==0)throw Error(d(331));var i=ft;for(ft|=4,Xn=e.current;Xn!==null;){var u=Xn,x=u.child;if((Xn.flags&16)!==0){var W=u.deletions;if(W!==null){for(var ue=0;ue<W.length;ue++){var Ye=W[ue];for(Xn=Ye;Xn!==null;){var En=Xn;switch(En.tag){case 0:case 11:case 15:ul(8,En,u)}var Rn=En.child;if(Rn!==null)Rn.return=En,Xn=Rn;else for(;Xn!==null;){En=Xn;var bn=En.sibling,Hn=En.return;if(ju(En),En===Ye){Xn=null;break}if(bn!==null){bn.return=Hn,Xn=bn;break}Xn=Hn}}}var qn=u.alternate;if(qn!==null){var Yn=qn.child;if(Yn!==null){qn.child=null;do{var Lt=Yn.sibling;Yn.sibling=null,Yn=Lt}while(Yn!==null)}}Xn=u}}if((u.subtreeFlags&2064)!==0&&x!==null)x.return=u,Xn=x;else e:for(;Xn!==null;){if(u=Xn,(u.flags&2048)!==0)switch(u.tag){case 0:case 11:case 15:ul(9,u,u.return)}var Be=u.sibling;if(Be!==null){Be.return=u.return,Xn=Be;break e}Xn=u.return}}var we=e.current;for(Xn=we;Xn!==null;){x=Xn;var je=x.child;if((x.subtreeFlags&2064)!==0&&je!==null)je.return=x,Xn=je;else e:for(x=we;Xn!==null;){if(W=Xn,(W.flags&2048)!==0)try{switch(W.tag){case 0:case 11:case 15:$l(9,W)}}catch(Qn){Tt(W,W.return,Qn)}if(W===x){Xn=null;break e}var Cn=W.sibling;if(Cn!==null){Cn.return=W.return,Xn=Cn;break e}Xn=W.return}}if(ft=i,zr(),ie&&typeof ie.onPostCommitFiberRoot=="function")try{ie.onPostCommitFiberRoot(E,e)}catch{}r=!0}return r}finally{jn=t,cr.transition=n}}return!1}function ac(e,n,t){n=Ia(t,n),n=wu(e,n,1),e=Kr(e,n,1),n=Wt(),e!==null&&(Ln(e,1,n),er(e,n))}function Tt(e,n,t){if(e.tag===3)ac(e,e,t);else for(;n!==null;){if(n.tag===3){ac(n,e,t);break}else if(n.tag===1){var r=n.stateNode;if(typeof n.type.getDerivedStateFromError=="function"||typeof r.componentDidCatch=="function"&&(qr===null||!qr.has(r))){e=Ia(t,e),e=Au(n,e,1),n=Kr(n,e,1),e=Wt(),n!==null&&(Ln(n,1,e),er(n,e));break}}n=n.return}}function mf(e,n,t){var r=e.pingCache;r!==null&&r.delete(n),n=Wt(),e.pingedLanes|=e.suspendedLanes&t,Ut===e&&(Bt&t)===t&&(Nt===4||Nt===3&&(Bt&130023424)===Bt&&500>Vn()-Li?_a(e,0):Ei|=t),er(e,n)}function lc(e,n){n===0&&((e.mode&1)===0?n=1:(n=xn,xn<<=1,(xn&130023424)===0&&(xn=4194304)));var t=Wt();e=Nr(e,n),e!==null&&(Ln(e,n,t),er(e,t))}function gf(e){var n=e.memoizedState,t=0;n!==null&&(t=n.retryLane),lc(e,t)}function yf(e,n){var t=0;switch(e.tag){case 13:var r=e.stateNode,i=e.memoizedState;i!==null&&(t=i.retryLane);break;case 19:r=e.stateNode;break;default:throw Error(d(314))}r!==null&&r.delete(n),lc(e,t)}var oc;oc=function(e,n,t){if(e!==null)if(e.memoizedProps!==n.pendingProps||$t.current)Zt=!0;else{if((e.lanes&t)===0&&(n.flags&128)===0)return Zt=!1,af(e,n,t);Zt=(e.flags&131072)!==0}else Zt=!1,kt&&(n.flags&1048576)!==0&&Bs(n,Ml,n.index);switch(n.lanes=0,n.tag){case 2:var r=n.type;Wl(e,n),e=n.pendingProps;var i=Ea(n,jt.current);Ca(n,t),i=ai(null,n,r,e,i,t);var u=li();return n.flags|=1,typeof i=="object"&&i!==null&&typeof i.render=="function"&&i.$$typeof===void 0?(n.tag=1,n.memoizedState=null,n.updateQueue=null,Qt(r)?(u=!0,Rl(n)):u=!1,n.memoizedState=i.state!==null&&i.state!==void 0?i.state:null,Qo(n),i.updater=Xl,n.stateNode=i,i._reactInternals=n,di(n,r,e,t),n=hi(null,n,r,!0,u,t)):(n.tag=0,kt&&u&&Vo(n),qt(null,n,i,t),n=n.child),n;case 16:r=n.elementType;e:{switch(Wl(e,n),e=n.pendingProps,i=r._init,r=i(r._payload),n.type=r,i=n.tag=xf(r),e=mr(r,e),i){case 0:n=_i(null,n,r,e,t);break e;case 1:n=Cu(null,n,r,e,t);break e;case 11:n=Lu(null,n,r,e,t);break e;case 14:n=Su(null,n,r,mr(r.type,e),t);break e}throw Error(d(306,r,""))}return n;case 0:return r=n.type,i=n.pendingProps,i=n.elementType===r?i:mr(r,i),_i(e,n,r,i,t);case 1:return r=n.type,i=n.pendingProps,i=n.elementType===r?i:mr(r,i),Cu(e,n,r,i,t);case 3:e:{if(Mu(n),e===null)throw Error(d(387));r=n.pendingProps,u=n.memoizedState,i=u.element,Ws(e,n),Bl(n,r,null,t);var x=n.memoizedState;if(r=x.element,u.isDehydrated)if(u={element:r,isDehydrated:!1,cache:x.cache,pendingSuspenseBoundaries:x.pendingSuspenseBoundaries,transitions:x.transitions},n.updateQueue.baseState=u,n.memoizedState=u,n.flags&256){i=Ia(Error(d(423)),n),n=Iu(e,n,r,t,i);break e}else if(r!==i){i=Ia(Error(d(424)),n),n=Iu(e,n,r,t,i);break e}else for(ar=Fr(n.stateNode.containerInfo.firstChild),rr=n,kt=!0,hr=null,t=Xs(n,null,r,t),n.child=t;t;)t.flags=t.flags&-3|4096,t=t.sibling;else{if(Oa(),r===i){n=Mr(e,n,t);break e}qt(e,n,r,t)}n=n.child}return n;case 5:return Qs(n),e===null&&Ho(n),r=n.type,i=n.pendingProps,u=e!==null?e.memoizedProps:null,x=i.children,Uo(r,i)?x=null:u!==null&&Uo(r,u)&&(n.flags|=32),Nu(e,n),qt(e,n,x,t),n.child;case 6:return e===null&&Ho(n),null;case 13:return Uu(e,n,t);case 4:return Zo(n,n.stateNode.containerInfo),r=n.pendingProps,e===null?n.child=Ra(n,null,r,t):qt(e,n,r,t),n.child;case 11:return r=n.type,i=n.pendingProps,i=n.elementType===r?i:mr(r,i),Lu(e,n,r,i,t);case 7:return qt(e,n,n.pendingProps,t),n.child;case 8:return qt(e,n,n.pendingProps.children,t),n.child;case 12:return qt(e,n,n.pendingProps.children,t),n.child;case 10:e:{if(r=n.type._context,i=n.pendingProps,u=n.memoizedProps,x=i.value,gt(Pl,r._currentValue),r._currentValue=x,u!==null)if(_r(u.value,x)){if(u.children===i.children&&!$t.current){n=Mr(e,n,t);break e}}else for(u=n.child,u!==null&&(u.return=n);u!==null;){var W=u.dependencies;if(W!==null){x=u.child;for(var ue=W.firstContext;ue!==null;){if(ue.context===r){if(u.tag===1){ue=Cr(-1,t&-t),ue.tag=2;var Ye=u.updateQueue;if(Ye!==null){Ye=Ye.shared;var En=Ye.pending;En===null?ue.next=ue:(ue.next=En.next,En.next=ue),Ye.pending=ue}}u.lanes|=t,ue=u.alternate,ue!==null&&(ue.lanes|=t),Yo(u.return,t,n),W.lanes|=t;break}ue=ue.next}}else if(u.tag===10)x=u.type===n.type?null:u.child;else if(u.tag===18){if(x=u.return,x===null)throw Error(d(341));x.lanes|=t,W=x.alternate,W!==null&&(W.lanes|=t),Yo(x,t,n),x=u.sibling}else x=u.child;if(x!==null)x.return=u;else for(x=u;x!==null;){if(x===n){x=null;break}if(u=x.sibling,u!==null){u.return=x.return,x=u;break}x=x.return}u=x}qt(e,n,i.children,t),n=n.child}return n;case 9:return i=n.type,r=n.pendingProps.children,Ca(n,t),i=sr(i),r=r(i),n.flags|=1,qt(e,n,r,t),n.child;case 14:return r=n.type,i=mr(r,n.pendingProps),i=mr(r.type,i),Su(e,n,r,i,t);case 15:return Ou(e,n,n.type,n.pendingProps,t);case 17:return r=n.type,i=n.pendingProps,i=n.elementType===r?i:mr(r,i),Wl(e,n),n.tag=1,Qt(r)?(e=!0,Rl(n)):e=!1,Ca(n,t),xu(n,r,i),di(n,r,i,t),hi(null,n,r,!0,e,t);case 19:return Du(e,n,t);case 22:return Ru(e,n,t)}throw Error(d(156,n.tag))};function ic(e,n){return $n(e,n)}function vf(e,n,t,r){this.tag=e,this.key=t,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.ref=null,this.pendingProps=n,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=r,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function dr(e,n,t,r){return new vf(e,n,t,r)}function Ui(e){return e=e.prototype,!(!e||!e.isReactComponent)}function xf(e){if(typeof e=="function")return Ui(e)?1:0;if(e!=null){if(e=e.$$typeof,e===tn)return 11;if(e===ae)return 14}return 2}function Qr(e,n){var t=e.alternate;return t===null?(t=dr(e.tag,n,e.key,e.mode),t.elementType=e.elementType,t.type=e.type,t.stateNode=e.stateNode,t.alternate=e,e.alternate=t):(t.pendingProps=n,t.type=e.type,t.flags=0,t.subtreeFlags=0,t.deletions=null),t.flags=e.flags&14680064,t.childLanes=e.childLanes,t.lanes=e.lanes,t.child=e.child,t.memoizedProps=e.memoizedProps,t.memoizedState=e.memoizedState,t.updateQueue=e.updateQueue,n=e.dependencies,t.dependencies=n===null?null:{lanes:n.lanes,firstContext:n.firstContext},t.sibling=e.sibling,t.index=e.index,t.ref=e.ref,t}function lo(e,n,t,r,i,u){var x=2;if(r=e,typeof e=="function")Ui(e)&&(x=1);else if(typeof e=="string")x=5;else e:switch(e){case D:return ma(t.children,i,u,n);case re:x=8,i|=8;break;case ke:return e=dr(12,t,n,i|2),e.elementType=ke,e.lanes=u,e;case an:return e=dr(13,t,n,i),e.elementType=an,e.lanes=u,e;case sn:return e=dr(19,t,n,i),e.elementType=sn,e.lanes=u,e;case ze:return oo(t,i,u,n);default:if(typeof e=="object"&&e!==null)switch(e.$$typeof){case ge:x=10;break e;case Oe:x=9;break e;case tn:x=11;break e;case ae:x=14;break e;case oe:x=16,r=null;break e}throw Error(d(130,e==null?e:typeof e,""))}return n=dr(x,t,n,i),n.elementType=e,n.type=r,n.lanes=u,n}function ma(e,n,t,r){return e=dr(7,e,r,n),e.lanes=t,e}function oo(e,n,t,r){return e=dr(22,e,r,n),e.elementType=ze,e.lanes=t,e.stateNode={isHidden:!1},e}function Pi(e,n,t){return e=dr(6,e,null,n),e.lanes=t,e}function Di(e,n,t){return n=dr(4,e.children!==null?e.children:[],e.key,n),n.lanes=t,n.stateNode={containerInfo:e.containerInfo,pendingChildren:null,implementation:e.implementation},n}function kf(e,n,t,r,i){this.tag=n,this.containerInfo=e,this.finishedWork=this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.pendingContext=this.context=null,this.callbackPriority=0,this.eventTimes=_e(0),this.expirationTimes=_e(-1),this.entangledLanes=this.finishedLanes=this.mutableReadLanes=this.expiredLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=_e(0),this.identifierPrefix=r,this.onRecoverableError=i,this.mutableSourceEagerHydrationData=null}function Gi(e,n,t,r,i,u,x,W,ue){return e=new kf(e,n,t,W,ue),n===1?(n=1,u===!0&&(n|=8)):n=0,u=dr(3,null,null,n),e.current=u,u.stateNode=e,u.memoizedState={element:r,isDehydrated:t,cache:null,transitions:null,pendingSuspenseBoundaries:null},Qo(u),e}function wf(e,n,t){var r=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:ln,key:r==null?null:""+r,children:e,containerInfo:n,implementation:t}}function sc(e){if(!e)return jr;e=e._reactInternals;e:{if(Me(e)!==e||e.tag!==1)throw Error(d(170));var n=e;do{switch(n.tag){case 3:n=n.stateNode.context;break e;case 1:if(Qt(n.type)){n=n.stateNode.__reactInternalMemoizedMergedChildContext;break e}}n=n.return}while(n!==null);throw Error(d(171))}if(e.tag===1){var t=e.type;if(Qt(t))return Ps(e,t,n)}return n}function uc(e,n,t,r,i,u,x,W,ue){return e=Gi(t,r,!0,e,i,u,x,W,ue),e.context=sc(null),t=e.current,r=Wt(),i=Yr(t),u=Cr(r,i),u.callback=n??null,Kr(t,u,i),e.current.lanes=i,Ln(e,i,r),er(e,r),e}function io(e,n,t,r){var i=n.current,u=Wt(),x=Yr(i);return t=sc(t),n.context===null?n.context=t:n.pendingContext=t,n=Cr(u,x),n.payload={element:e},r=r===void 0?null:r,r!==null&&(n.callback=r),e=Kr(i,n,x),e!==null&&(vr(e,i,x,u),Gl(e,i,x)),x}function so(e){if(e=e.current,!e.child)return null;switch(e.child.tag){case 5:return e.child.stateNode;default:return e.child.stateNode}}function cc(e,n){if(e=e.memoizedState,e!==null&&e.dehydrated!==null){var t=e.retryLane;e.retryLane=t!==0&&t<n?t:n}}function Bi(e,n){cc(e,n),(e=e.alternate)&&cc(e,n)}function Af(){return null}var dc=typeof reportError=="function"?reportError:function(e){console.error(e)};function Fi(e){this._internalRoot=e}uo.prototype.render=Fi.prototype.render=function(e){var n=this._internalRoot;if(n===null)throw Error(d(409));io(e,n,null,null)},uo.prototype.unmount=Fi.prototype.unmount=function(){var e=this._internalRoot;if(e!==null){this._internalRoot=null;var n=e.containerInfo;pa(function(){io(null,e,null,null)}),n[Lr]=null}};function uo(e){this._internalRoot=e}uo.prototype.unstable_scheduleHydration=function(e){if(e){var n=Wn();e={blockedOn:null,target:e,priority:n};for(var t=0;t<fr.length&&n!==0&&n<fr[t].priority;t++);fr.splice(t,0,e),t===0&&na(e)}};function Vi(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11)}function co(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11&&(e.nodeType!==8||e.nodeValue!==" react-mount-point-unstable "))}function fc(){}function bf(e,n,t,r,i){if(i){if(typeof r=="function"){var u=r;r=function(){var Ye=so(x);u.call(Ye)}}var x=uc(n,r,e,0,null,!1,!1,"",fc);return e._reactRootContainer=x,e[Lr]=x.current,$a(e.nodeType===8?e.parentNode:e),pa(),x}for(;i=e.lastChild;)e.removeChild(i);if(typeof r=="function"){var W=r;r=function(){var Ye=so(ue);W.call(Ye)}}var ue=Gi(e,0,!1,null,null,!1,!1,"",fc);return e._reactRootContainer=ue,e[Lr]=ue.current,$a(e.nodeType===8?e.parentNode:e),pa(function(){io(n,ue,t,r)}),ue}function fo(e,n,t,r,i){var u=t._reactRootContainer;if(u){var x=u;if(typeof i=="function"){var W=i;i=function(){var ue=so(x);W.call(ue)}}io(n,x,e,i)}else x=bf(t,n,e,i,r);return so(x)}V=function(e){switch(e.tag){case 3:var n=e.stateNode;if(n.current.memoizedState.isDehydrated){var t=Sn(n.pendingLanes);t!==0&&(zn(n,t|1),er(n,Vn()),(ft&6)===0&&(Da=Vn()+500,zr()))}break;case 13:pa(function(){var r=Nr(e,1);if(r!==null){var i=Wt();vr(r,e,1,i)}}),Bi(e,1)}},Ne=function(e){if(e.tag===13){var n=Nr(e,134217728);if(n!==null){var t=Wt();vr(n,e,134217728,t)}Bi(e,134217728)}},wn=function(e){if(e.tag===13){var n=Yr(e),t=Nr(e,n);if(t!==null){var r=Wt();vr(t,e,n,r)}Bi(e,n)}},Wn=function(){return jn},st=function(e,n){var t=jn;try{return jn=e,n()}finally{jn=t}},Le=function(e,n,t){switch(n){case"input":if(le(e,t),n=t.name,t.type==="radio"&&n!=null){for(t=e;t.parentNode;)t=t.parentNode;for(t=t.querySelectorAll("input[name="+JSON.stringify(""+n)+'][type="radio"]'),n=0;n<t.length;n++){var r=t[n];if(r!==e&&r.form===e.form){var i=Sl(r);if(!i)throw Error(d(90));Te(r),le(r,i)}}}break;case"textarea":Pe(e,t);break;case"select":n=t.value,n!=null&&He(e,!!t.multiple,n,!1)}},l=Ci,s=pa;var Tf={usingClientEntryPoint:!1,Events:[Ja,ba,Sl,Ve,vn,Ci]},pl={findFiberByHostInstance:la,bundleType:0,version:"18.3.1",rendererPackageName:"react-dom"},Ef={bundleType:pl.bundleType,version:pl.version,rendererPackageName:pl.rendererPackageName,rendererConfig:pl.rendererConfig,overrideHookState:null,overrideHookStateDeletePath:null,overrideHookStateRenamePath:null,overrideProps:null,overridePropsDeletePath:null,overridePropsRenamePath:null,setErrorHandler:null,setSuspenseHandler:null,scheduleUpdate:null,currentDispatcherRef:Ke.ReactCurrentDispatcher,findHostInstanceByFiber:function(e){return e=Pn(e),e===null?null:e.stateNode},findFiberByHostInstance:pl.findFiberByHostInstance||Af,findHostInstancesForRefresh:null,scheduleRefresh:null,scheduleRoot:null,setRefreshHandler:null,getCurrentFiber:null,reconcilerVersion:"18.3.1-next-f1338f8080-20240426"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"){var po=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!po.isDisabled&&po.supportsFiber)try{E=po.inject(Ef),ie=po}catch{}}return nr.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=Tf,nr.createPortal=function(e,n){var t=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!Vi(n))throw Error(d(200));return wf(e,n,null,t)},nr.createRoot=function(e,n){if(!Vi(e))throw Error(d(299));var t=!1,r="",i=dc;return n!=null&&(n.unstable_strictMode===!0&&(t=!0),n.identifierPrefix!==void 0&&(r=n.identifierPrefix),n.onRecoverableError!==void 0&&(i=n.onRecoverableError)),n=Gi(e,1,!1,null,null,t,!1,r,i),e[Lr]=n.current,$a(e.nodeType===8?e.parentNode:e),new Fi(n)},nr.findDOMNode=function(e){if(e==null)return null;if(e.nodeType===1)return e;var n=e._reactInternals;if(n===void 0)throw typeof e.render=="function"?Error(d(188)):(e=Object.keys(e).join(","),Error(d(268,e)));return e=Pn(n),e=e===null?null:e.stateNode,e},nr.flushSync=function(e){return pa(e)},nr.hydrate=function(e,n,t){if(!co(n))throw Error(d(200));return fo(null,e,n,!0,t)},nr.hydrateRoot=function(e,n,t){if(!Vi(e))throw Error(d(405));var r=t!=null&&t.hydratedSources||null,i=!1,u="",x=dc;if(t!=null&&(t.unstable_strictMode===!0&&(i=!0),t.identifierPrefix!==void 0&&(u=t.identifierPrefix),t.onRecoverableError!==void 0&&(x=t.onRecoverableError)),n=uc(n,null,e,1,t??null,i,!1,u,x),e[Lr]=n.current,$a(e),r)for(e=0;e<r.length;e++)t=r[e],i=t._getVersion,i=i(t._source),n.mutableSourceEagerHydrationData==null?n.mutableSourceEagerHydrationData=[t,i]:n.mutableSourceEagerHydrationData.push(t,i);return new uo(n)},nr.render=function(e,n,t){if(!co(n))throw Error(d(200));return fo(null,e,n,!1,t)},nr.unmountComponentAtNode=function(e){if(!co(e))throw Error(d(40));return e._reactRootContainer?(pa(function(){fo(null,null,e,!1,function(){e._reactRootContainer=null,e[Lr]=null})}),!0):!1},nr.unstable_batchedUpdates=Ci,nr.unstable_renderSubtreeIntoContainer=function(e,n,t,r){if(!co(t))throw Error(d(200));if(e==null||e._reactInternals===void 0)throw Error(d(38));return fo(e,n,t,!1,r)},nr.version="18.3.1-next-f1338f8080-20240426",nr}var kc;function Df(){if(kc)return Hi.exports;kc=1;function a(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(a)}catch(z){console.error(z)}}return a(),Hi.exports=Pf(),Hi.exports}var wc;function Gf(){if(wc)return _o;wc=1;var a=Df();return _o.createRoot=a.createRoot,_o.hydrateRoot=a.hydrateRoot,_o}var Bf=Gf();const Ff=Ji(Bf);var ya=es();const Ur=Ji(ya),Vf="modulepreload",jf=function(a){return"/arcade/rfdgamestudio/"+a},Ac={},ea=function(z,d,k){let v=Promise.resolve();if(d&&d.length>0){let R=function(L){return Promise.all(L.map(H=>Promise.resolve(H).then(w=>({status:"fulfilled",value:w}),w=>({status:"rejected",reason:w}))))};document.getElementsByTagName("link");const C=document.querySelector("meta[property=csp-nonce]"),j=(C==null?void 0:C.nonce)||(C==null?void 0:C.getAttribute("nonce"));v=R(d.map(L=>{if(L=jf(L),L in Ac)return;Ac[L]=!0;const H=L.endsWith(".css"),w=H?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${L}"]${w}`))return;const B=document.createElement("link");if(B.rel=H?"stylesheet":Vf,H||(B.as="script"),B.crossOrigin="",B.href=L,j&&B.setAttribute("nonce",j),document.head.appendChild(B),H)return new Promise((Q,ce)=>{B.addEventListener("load",Q),B.addEventListener("error",()=>ce(new Error(`Unable to preload CSS for ${L}`)))})}))}function P(R){const C=new Event("vite:preloadError",{cancelable:!0});if(C.payload=R,window.dispatchEvent(C),!C.defaultPrevented)throw R}return v.then(R=>{for(const C of R||[])C.status==="rejected"&&P(C.reason);return z().catch(P)})},zf={gameId:"horse_racing",label:"Derby Sim",description:"Race, breed, and bet on horses. Win/Place/Show betting, genetics system, career tracking.",color:"#f59e0b",status:"stable",component:Ur.lazy(()=>ea(()=>import("./App-CKv-Cxrn.js"),__vite__mapDeps([0,1,2,3,4,5])))},Hf={gameId:"slither_rogue",label:"Snake Roguelike",description:"Slither.io meets roguelike. Steal segments, collect evolution cards, dominate the arena.",color:"#34d399",status:"beta",component:Ur.lazy(()=>ea(()=>import("./App-cBJYjrl_.js"),__vite__mapDeps([6,2,3,7,4,8,9,10,11])))},Kf={gameId:"mutant_battle_ball",label:"Mutant Battle Ball",description:"Assemble mutants from parts. Field a 2v2 squad. Reach the end zone. Salvage the fallen.",color:"#f87171",status:"dev",component:Ur.lazy(()=>ea(()=>import("./App-CrUMOjPl.js"),__vite__mapDeps([12,2,1,13,9,10,14])))},Xf={gameId:"slime_coin",label:"SlimeCoin",description:"Real-time coin pusher with shooter, two-layer board, and chip synergies",color:"#a855f7",status:"dev",component:Ur.lazy(()=>ea(()=>import("./App-BaAxLQi8.js"),__vite__mapDeps([15,2,1,9,13,10,16])))},qf={gameId:"chimera_wilds",label:"Chimera Wilds",description:"Face a single randomly-assembled six-part enemy in a one-roll D20 encounter",color:"#14b8a6",status:"dev",component:Ur.lazy(()=>ea(()=>import("./App-Cru0I2HW.js"),__vite__mapDeps([17,2,1,13,18])))},Wf={gameId:"scrapcrawl",label:"ScrapCrawl",description:"Room navigation, scrap economy, craft, and D20 combat with win-only proficiency.",color:"#f59e0b",status:"dev",component:Ur.lazy(()=>ea(()=>import("./App-CX30SLR5.js"),__vite__mapDeps([19,2,1,13,8,4,20,21])))},Yf={gameId:"voiddrift",label:"VoidRift",description:"A mining simulation at the edge of a black hole — drones mine autonomously, ore refines into components, and unexplained signal-bottles arrive for you to collect. No win condition. No escape.",color:"#6366f1",status:"external",externalUrl:"https://rdug627.itch.io/voidrift",embedUrl:"https://itch.io/embed-upload/17482080?color=333333",embedWidth:960,embedHeight:1300},$f={gameId:"brewfield",label:"Brewfield",description:"A turn-based potions-brewing roguelike — Element × Component combinations, a living Residue field, Wa-Tor-inspired trophic chemistry.",color:"#84cc16",status:"stable",component:Ur.lazy(()=>ea(()=>import("./App-YDsDaH0k.js"),__vite__mapDeps([22,2,1,13,3,7,4,8,20])))},Qf={gameId:"ledger",label:"Ledger",description:"A Dutch-auction trading and appraisal simulator — compounding debt, a volatile resale market, and soft lockout consequences for missed payments.",color:"#06b6d4",status:"external",embedUrl:"/arcade/ledger/"},Zf={gameId:"shoal",label:"Shoal",description:"A continuous steering-based reef ecosystem — fish graze, sharks hunt, and algae rises and sinks with the pressure of grazing.",color:"#3b82f6",status:"stable",component:Ur.lazy(()=>ea(()=>import("./App-CrxoTqTl.js"),__vite__mapDeps([23,9,2,24])))},Jf={gameId:"trinity_siege",label:"Trinity Siege",description:"Three-faction siege combat — deploy units, breach walls, resolve encounters. LEAST-VERIFIED: prior sessions found fabricated combat logic and misattributed bugs; playable but not vouched for correctness.",color:"#ef4444",status:"external",embedUrl:"/arcade/trinity_siege/"},ep={gameId:"slimebreeder",label:"SlimeBreeder",description:"A multi-tank slime breeding and genetics sandbox — pulls from the SlimeGarden core loop, reimagined as a standalone TypeScript demo.",color:"#ec4899",status:"external",embedUrl:"/arcade/slimebreeder/"},np={gameId:"corpworld",label:"CorpWorld",description:"A cold-corporate land-grab on a newly-discovered planet — Voronoi-tessellated territory, symmetric fog-of-war, deterministic Circle/Square/Triangle combat. v0.1.0R5: multi-action weekly orders (split a garrison across several deployments in one week) plus an independent Civic Directive per sector (production or defense focus). Real 4X mechanical foundation, still early on presentation.",color:"#f59e0b",status:"external",embedUrl:"/arcade/corpworld/"},tp={gameId:"slimegarden",label:"Slimegarden",description:"A multi-tank slime breeding and genetics sandbox — pulls from the SlimeGarden core loop, reimagined as a standalone TypeScript demo.",color:"#6c8ef7",status:"external",embedUrl:"/arcade/slimegarden/"},Qi=[zf,Hf,Kf,Xf,qf,Wf,Yf,$f,Qf,Zf,Jf,ep,np,tp];function bc(a){return Qi.find(z=>z.gameId===a)}const rp={created:"2026-06-23T20:59:34-04:00",last_updated:"2026-07-11T18:39:04-04:00",version:"1.0.0",tracked:!0},ap={created:"2026-06-26T22:19:51-04:00",last_updated:"2026-07-11T18:39:04-04:00",version:"1.0.0",tracked:!0},lp={created:"2026-06-27T18:22:35-04:00",last_updated:"2026-07-11T18:39:04-04:00",version:"1.0.0",tracked:!0},op={created:"2026-06-27T21:08:17-04:00",last_updated:"2026-07-11T18:39:04-04:00",version:"1.0.0",tracked:!0},ip={created:"2026-07-08T20:40:17-04:00",last_updated:"2026-07-11T18:39:04-04:00",version:"1.0.0",tracked:!0},sp={created:"2026-07-08T21:05:08-04:00",last_updated:"2026-07-11T18:39:04-04:00",version:"1.0.0",tracked:!0},up={created:"2026-07-10T23:02:49-04:00",last_updated:"2026-07-11T18:39:04-04:00",version:"1.1.0",tracked:!0},cp={created:"2026-07-10T20:25:49-04:00",last_updated:"2026-07-11T18:39:04-04:00",version:"1.0.0",tracked:!0},dp={created:"2026-07-11T18:42:41-04:00",last_updated:"2026-07-11T18:42:41-04:00",version:"1.0.0",tracked:!0},fp={created:"2026-07-10T23:02:49-04:00",last_updated:"2026-07-12T01:34:54-04:00",version:"2.24.0",tracked:!0},pp={created:"2026-07-11T18:42:41-04:00",last_updated:"2026-07-11T18:42:41-04:00",version:"1.0.0",tracked:!0},_p={created:"2026-04-10T21:08:42-04:00",last_updated:"2026-04-11T21:33:00-04:00",version:"1.0.0",tracked:!0},hp={horse_racing:rp,slither_rogue:ap,mutant_battle_ball:lp,slime_coin:op,chimera_wilds:ip,scrapcrawl:sp,brewfield:up,voiddrift:cp,ledger:dp,shoal:fp,trinity_siege:pp,slimebreeder:_p},mp=`-- brewfield/logic.lua — Phase A core loop port
-- Faithful port of the certified Brewfield TS implementation.
--
-- Source files (read-only reference):
--   examples/brewfield/src/gameLogic.ts
--   examples/brewfield/src/App.tsx
--   examples/brewfield/src/types.ts

local ELEMENT_ORDER = {'fire', 'air', 'water', 'earth'}

local function clamp(val, min, max)
  return math.max(min, math.min(max, val))
end

local function index_of(tbl, val)
  for i, v in ipairs(tbl) do
    if v == val then return i end
  end
  return nil
end

local function copy_table(t)
  if type(t) ~= 'table' then return t end
  local c = {}
  for k, v in pairs(t) do
    c[k] = copy_table(v)
  end
  return c
end

local function shallow_copy_list(t)
  local c = {}
  for i, v in ipairs(t) do c[i] = v end
  return c
end

local function get_residue_tag(element)
  if element == 'fire' then return 'burning' end
  if element == 'water' then return 'soaked' end
  if element == 'earth' then return 'fortified' end
  if element == 'air' then return 'windswept' end
  return nil
end

local function get_opposed_element(element)
  if element == 'fire' then return 'water' end
  if element == 'water' then return 'fire' end
  if element == 'air' then return 'earth' end
  return 'air'
end

local function get_element_color(element)
  if element == 'fire' then return '#ef4444' end
  if element == 'water' then return '#38bdf8' end
  if element == 'earth' then return '#10b981' end
  return '#c084fc'
end

-- ============================================================
-- ELEMENT RELATIONSHIPS
-- ============================================================

function get_relation(el1, el2)
  if el1 == el2 then return 'same' end
  local idx1 = index_of(ELEMENT_ORDER, el1)
  local idx2 = index_of(ELEMENT_ORDER, el2)
  if idx1 == nil or idx2 == nil then return 'single' end
  local diff = math.abs(idx1 - idx2)
  if diff == 2 then return 'opposed' end
  return 'adjacent'
end

-- ============================================================
-- BREW RESOLUTION
-- ============================================================

function solve_brew(data, el1, el2, component, seed)
  local primary = el1 or el2 or 'water'
  local secondary = nil
  if el1 and el2 and el1 ~= el2 then
    secondary = el2
  end

  local combination = 'single'
  if el1 and el2 then
    combination = get_relation(el1, el2)
  end

  local baseDamage = 0
  local baseShield = 0
  local baseHeal = 0
  local baseDotDamage = 0
  local baseDotDuration = 0

  local slowStrength = 0
  local slowTurns = 0
  local dodgeGranted = 0
  local retaliateDamage = 0
  local decayingShield = 0
  local cauterize = false
  local detonateNextTurn = false
  local stripBuffs = false
  local weaknessStacks = 0
  local ticksActiveDoTs = false

  if component == 'strike' then
    baseDamage = 6
    if primary == 'fire' then
      baseDamage = 8
    elseif primary == 'water' then
      baseDamage = 4
      slowStrength = 3
      slowTurns = 1
    elseif primary == 'earth' then
      baseDamage = 6
      baseShield = 3
    elseif primary == 'air' then
      baseDamage = 3
    end
  elseif component == 'ward' then
    baseShield = 5
    if primary == 'fire' then
      retaliateDamage = 3
    elseif primary == 'water' then
      baseShield = 7
      baseHeal = 2
    elseif primary == 'earth' then
      baseShield = 9
      decayingShield = 4
    elseif primary == 'air' then
      baseShield = 3
      dodgeGranted = 1
    end
  elseif component == 'mend' then
    baseHeal = 5
    if primary == 'fire' then
      baseHeal = 3
      cauterize = true
    elseif primary == 'water' then
      baseHeal = 8
    elseif primary == 'earth' then
      baseHeal = 5
      baseShield = 2
    elseif primary == 'air' then
      baseHeal = 5
      cauterize = true
    end
  elseif component == 'blight' then
    baseDotDamage = 3
    baseDotDuration = 3
    if primary == 'fire' then
      baseDotDamage = 0
      baseDotDuration = 0
      detonateNextTurn = true
    elseif primary == 'water' then
      baseDotDamage = 1
      baseDotDuration = 3
      stripBuffs = true
    elseif primary == 'earth' then
      baseDotDamage = 3
      baseDotDuration = 3
      weaknessStacks = 2
    elseif primary == 'air' then
      baseDotDamage = 3
      baseDotDuration = 3
      ticksActiveDoTs = true
    end
  end

  local multiplier = 1.0
  local flavorText = ''
  local reactionTitle = ''

  if combination == 'same' then
    multiplier = 1.5
    reactionTitle = 'AMPLIFIED ' .. string.upper(primary) .. ' ' .. string.upper(component)
    flavorText = 'Combining two of the same element charges the brew to 150% potency!'
  elseif combination == 'adjacent' and secondary then
    reactionTitle = 'HYBRIDIZED ' .. string.upper(primary) .. '-' .. string.upper(secondary) .. ' ' .. string.upper(component)
    flavorText = 'The adjacent elements harmonize. The dominant element (' .. primary .. ') is boosted by a minor aspect of ' .. secondary .. '!'

    if secondary == 'fire' then
      if component == 'strike' then
        baseDamage = baseDamage + 2
      elseif component == 'blight' then
        baseDotDamage = baseDotDamage + 1
      else
        retaliateDamage = retaliateDamage + 2
      end
    elseif secondary == 'water' then
      if component == 'mend' then
        baseHeal = baseHeal + 2
      else
        baseShield = baseShield + 1
      end
    elseif secondary == 'earth' then
      baseShield = baseShield + 2
      if decayingShield > 0 then
        decayingShield = decayingShield + 2
      end
    elseif secondary == 'air' then
      if component == 'strike' then
        baseDamage = baseDamage + 1
      end
      cauterize = true
    end
  elseif combination == 'opposed' and secondary then
    local rngVal = math.sin(seed) * 10000
    local isSuccess = (rngVal - math.floor(rngVal)) >= 0.5
    if isSuccess then
      multiplier = 1.5
      reactionTitle = 'VOLATILE SURGE! ' .. string.upper(primary) .. ' VS ' .. string.upper(secondary)
      flavorText = 'Opposed elements clash violently, sparking a powerful SURGE (+50% potency)! No residue tag is deposited.'
    else
      multiplier = 0.5
      reactionTitle = 'VOLATILE FIZZLE! ' .. string.upper(primary) .. ' VS ' .. string.upper(secondary)
      flavorText = 'Opposed elements clashed and canceled each other out, resulting in a FIZZLE (50% potency)! No residue tag is deposited.'
    end
  else
    reactionTitle = 'PURE ' .. string.upper(primary) .. ' ' .. string.upper(component)
    flavorText = 'A single-element brew focused entirely on ' .. primary .. '.'
  end

  local function apply_mult(v)
    if v == 0 then return 0 end
    return math.ceil(v * multiplier)
  end

  local finalDamage = apply_mult(baseDamage)
  local finalShield = apply_mult(baseShield)
  local finalHeal = apply_mult(baseHeal)
  local finalDotDamage = apply_mult(baseDotDamage)
  local finalDotDuration = baseDotDuration
  local finalRetaliate = apply_mult(retaliateDamage)
  local finalDecaying = apply_mult(decayingShield)
  local finalSlow = apply_mult(slowStrength)
  local finalWeakness = apply_mult(weaknessStacks)

  local effectDescParts = {}
  if finalDamage > 0 then
    if primary == 'air' and component == 'strike' then
      table.insert(effectDescParts, 'Deals ' .. math.ceil(finalDamage / 2) .. ' damage twice (Total: ' .. finalDamage .. ' DMG).')
    else
      table.insert(effectDescParts, 'Deals ' .. finalDamage .. ' Damage.')
    end
  end
  if finalShield > 0 then
    table.insert(effectDescParts, 'Grants ' .. finalShield .. ' Shield.')
  end
  if finalHeal > 0 then
    table.insert(effectDescParts, 'Restores ' .. finalHeal .. ' HP.')
  end
  if detonateNextTurn then
    table.insert(effectDescParts, 'Applies volatile fuse: deals 8 damage on next turn.')
  elseif finalDotDamage > 0 then
    table.insert(effectDescParts, 'Applies Blight DoT: deals ' .. finalDotDamage .. ' DMG/turn for ' .. finalDotDuration .. ' turns.')
  end
  if primary == 'fire' and component == 'strike' then
    table.insert(effectDescParts, 'Applies Burning residue.')
  end
  if finalSlow > 0 then
    table.insert(effectDescParts, 'Reduces enemy\\'s next intent by -' .. finalSlow .. ' DMG.')
  end
  if finalRetaliate > 0 then
    table.insert(effectDescParts, 'Grants Retaliation (deals ' .. finalRetaliate .. ' back on next hit).')
  end
  if finalDecaying > 0 then
    table.insert(effectDescParts, '' .. finalDecaying .. ' Shield persists to the next turn.')
  end
  if dodgeGranted > 0 then
    table.insert(effectDescParts, 'Grants Evasion (50% chance to dodge the next attack).')
  end
  if cauterize then
    table.insert(effectDescParts, 'Cleanses all negative debuffs (cauterize).')
  end
  if stripBuffs then
    table.insert(effectDescParts, 'Clears any active shields from the enemy.')
  end
  if finalWeakness > 0 then
    table.insert(effectDescParts, 'Applies Root: reduces enemy attack intents by -' .. finalWeakness .. ' DMG.')
  end
  if ticksActiveDoTs then
    table.insert(effectDescParts, 'Forces all currently active Residue DoTs to tick immediately.')
  end

  return {
    name = reactionTitle,
    combination = combination,
    primaryElement = primary,
    secondaryElement = secondary,
    component = component,
    damage = finalDamage,
    shield = finalShield,
    heal = finalHeal,
    dotDamage = finalDotDamage,
    dotDuration = finalDotDuration,
    slowStrength = finalSlow,
    slowTurns = slowTurns,
    dodgeGranted = dodgeGranted,
    retaliateDamage = finalRetaliate,
    decayingShield = finalDecaying,
    cauterize = cauterize,
    detonateNextTurn = detonateNextTurn,
    stripBuffs = stripBuffs,
    weaknessStacks = finalWeakness,
    ticksActiveDoTs = ticksActiveDoTs,
    description = flavorText .. ' Effect: ' .. table.concat(effectDescParts, ' '),
    color = get_element_color(primary)
  }
end

-- ============================================================
-- RESIDUE FIELD
-- ============================================================

function update_residue_field(currentResidues, resultantElement, isVolatile)
  if isVolatile or not resultantElement then
    local log = isVolatile
      and 'The clashing elements neutralized each other—no new residue could solidify in the cauldron.'
      or 'No element was infused—the residue field remains unchanged.'
    return { updated = copy_table(currentResidues), log = log }
  end

  local newTag = get_residue_tag(resultantElement)
  local opposedElement = get_opposed_element(resultantElement)
  local opposedTag = get_residue_tag(opposedElement)

  local updated = copy_table(currentResidues)
  local log = ''

  -- Same element: amplify existing tag
  local existingIdx = nil
  for i, r in ipairs(updated) do
    if r.tag == newTag then existingIdx = i; break end
  end
  if existingIdx then
    local currentLvl = updated[existingIdx].level
    local newLvl = math.min(3, currentLvl + 1)
    updated[existingIdx] = { tag = newTag, level = newLvl }
    log = 'Fused with existing elements: Amplified the cauldron\\'s [' .. string.upper(newTag) .. '] residue to Level ' .. newLvl .. '!'
    return { updated = updated, log = log }
  end

  -- Opposed element: clear opposed tag
  local opposedIdx = nil
  for i, r in ipairs(updated) do
    if r.tag == opposedTag then opposedIdx = i; break end
  end
  if opposedIdx then
    local filtered = {}
    for i, r in ipairs(updated) do
      if i ~= opposedIdx then table.insert(filtered, r) end
    end
    log = 'Chemical annihilation: The incoming [' .. string.upper(newTag) .. '] elements completely cleared the opposed [' .. string.upper(opposedTag) .. '] residue!'
    return { updated = filtered, log = log }
  end

  -- Unrelated element: add or replace
  if #updated < 2 then
    table.insert(updated, { tag = newTag, level = 1 })
    log = 'A new sediment settles: Deposited [' .. string.upper(newTag) .. '] residue (Level 1) into the cauldron field.'
  else
    local fortifiedIdx = nil
    for i, r in ipairs(updated) do
      if r.tag == 'fortified' then fortifiedIdx = i; break end
    end
    if fortifiedIdx then
      local otherIdx = fortifiedIdx == 1 and 2 or 1
      if updated[otherIdx].tag ~= 'fortified' then
        log = 'The enduring [FORTIFIED] residue resists decay! Overwrote the less-stable [' .. string.upper(updated[otherIdx].tag) .. '] tag with [' .. string.upper(newTag) .. '].'
        updated[otherIdx] = { tag = newTag, level = 1 }
      else
        if updated[1].level > 1 then
          updated[1].level = updated[1].level - 1
          log = 'The thick [FORTIFIED] shell absorbed the overwrite, diminishing to Level ' .. updated[1].level .. '.'
        else
          log = 'The thick [FORTIFIED] residue was finally worn down and replaced by [' .. string.upper(newTag) .. '].'
          updated[1] = { tag = newTag, level = 1 }
        end
      end
    else
      local replacedTag = updated[1].tag
      table.remove(updated, 1)
      table.insert(updated, { tag = newTag, level = 1 })
      log = 'Cauldron overflow: Replaced the oldest residue [' .. string.upper(replacedTag) .. '] with new [' .. string.upper(newTag) .. '] tag.'
    end
  end

  return { updated = updated, log = log }
end

-- ============================================================
-- ENEMIES
-- ============================================================

function instantiate_enemy(data, archetype, turn)
  local enemyData = data.enemies[archetype]
  if not enemyData then
    error('Unknown enemy archetype: ' .. tostring(archetype))
  end
  local idMap = {
    ashling = 'enemy_ashling',
    bulwark = 'enemy_bulwark',
    molten_ashling = 'enemy_molten',
    rootbound = 'enemy_rootbound'
  }
  return {
    id = idMap[archetype] or 'enemy_unknown',
    name = enemyData.name,
    archetype = archetype,
    hp = enemyData.hp,
    maxHp = enemyData.hp,
    shield = 0,
    intent = get_enemy_intent(data, archetype, turn or 1)
  }
end

function get_enemy_intent(data, archetype, turn)
  local enemyData = data.enemies[archetype]
  if not enemyData then
    error('Unknown enemy archetype: ' .. tostring(archetype))
  end
  local index = ((turn or 1) - 1) % 4 + 1
  local pattern = enemyData.intent_pattern[index]
  return {
    action = pattern.action,
    value = pattern.value,
    description = pattern.description
  }
end

-- ============================================================
-- STATE INITIALIZATION
-- ============================================================

function init_player()
  return {
    hp = 20,
    maxHp = 20,
    shield = 0,
    dodgeCharges = 0,
    retaliateCharges = 0,
    decayingShield = 0,
    burnDebuff = 0
  }
end

local function shuffle_list(list)
  local t = shallow_copy_list(list)
  for i = #t, 2, -1 do
    local j = math.random(i)
    t[i], t[j] = t[j], t[i]
  end
  return t
end

local function build_run_nodes(data)
  local nodes = {}
  for i, n in ipairs(data.run_nodes) do
    table.insert(nodes, {
      id = n.id,
      type = n.type,
      name = n.name,
      description = n.description,
      enemy = n.enemy,
      completed = false
    })
  end
  return nodes
end

function init_run(data)
  return {
    player = init_player(),
    enemy = nil,
    currentTurn = 1,
    residues = {},
    drawPile = {},
    hand = {},
    discardPile = {},
    deck = shallow_copy_list(data.starting_deck),
    nodes = build_run_nodes(data),
    currentNodeId = 1,
    gameLogs = {},
    stats = {
      enemiesDefeated = 0,
      totalDamageDealt = 0,
      totalShieldGained = 0,
      totalHealed = 0,
      brewsCreated = 0,
      volatileFails = 0,
      volatileSuccesses = 0
    },
    combatOutcome = nil,
    forageOptions = nil,
    screen = 'run',
    runWon = false
  }
end

function init_fight(data, state, node_id)
  local node = nil
  for i, n in ipairs(state.nodes) do
    if n.id == node_id then node = n; break end
  end
  if not node then
    error('Node ' .. tostring(node_id) .. ' not found')
  end
  if node.type ~= 'fight' or not node.enemy then
    error('Node ' .. tostring(node_id) .. ' is not a fight node')
  end

  local next = copy_table(state)
  next.player.shield = 0
  next.player.dodgeCharges = 0
  next.player.retaliateCharges = 0
  next.player.decayingShield = 0
  next.player.burnDebuff = 0

  next.enemy = instantiate_enemy(data, node.enemy, 1)
  next.currentTurn = 1
  next.residues = {}

  local shuffledDeck = shuffle_list(next.deck)
  next.hand = {}
  for i = 1, math.min(5, #shuffledDeck) do
    table.insert(next.hand, shuffledDeck[i])
  end
  next.drawPile = {}
  for i = 6, #shuffledDeck do
    table.insert(next.drawPile, shuffledDeck[i])
  end
  next.discardPile = {}

  next.gameLogs = {}
  next.combatOutcome = nil
  return next
end

-- ============================================================
-- TURN RESOLUTION
-- ============================================================

local function add_log(state, sender, message, turn)
  table.insert(state.gameLogs, {
    id = 'log_' .. tostring(#state.gameLogs + 1),
    turn = turn or state.currentTurn,
    sender = sender,
    message = message
  })
end

local function damage_shield_first(targetShield, targetHp, damage)
  if targetShield >= damage then
    return targetShield - damage, targetHp, 0
  else
    local remainder = damage - targetShield
    return 0, math.max(0, targetHp - remainder), remainder
  end
end

function resolve_brew(state, brew)
  local next = copy_table(state)
  local player = next.player
  local enemy = next.enemy

  -- Player stat updates
  player.hp = math.min(player.maxHp, player.hp + brew.heal)
  player.shield = player.shield + brew.shield
  player.dodgeCharges = player.dodgeCharges + brew.dodgeGranted
  player.retaliateCharges = player.retaliateCharges + brew.retaliateDamage
  player.decayingShield = player.decayingShield + brew.decayingShield
  if brew.cauterize then
    player.burnDebuff = 0
  end

  -- Enemy shield strip
  local nextEnemyShield = brew.stripBuffs and 0 or enemy.shield
  local nextEnemyHp = enemy.hp

  -- Damage enemy shield/HP
  local unused1, unused2
  nextEnemyShield, nextEnemyHp, unused1 = damage_shield_first(nextEnemyShield, nextEnemyHp, brew.damage)

  -- Air Blight: tick active residue DoTs immediately
  if brew.ticksActiveDoTs and #next.residues > 0 then
    local isWindswept = false
    for i, r in ipairs(next.residues) do
      if r.tag == 'windswept' then isWindswept = true; break end
    end
    local factor = isWindswept and 2 or 1
    for i, r in ipairs(next.residues) do
      if r.tag == 'burning' then
        local tickDmg = r.level * 2 * factor
        nextEnemyShield, nextEnemyHp, unused2 = damage_shield_first(nextEnemyShield, nextEnemyHp, tickDmg)
        add_log(next, 'field', 'Air draft spread! Burning residue flared immediately, dealing ' .. tickDmg .. ' DMG!', next.currentTurn)
      end
    end
  end

  enemy.shield = nextEnemyShield
  enemy.hp = nextEnemyHp

  -- Residue field update
  local isVolatile = brew.combination == 'opposed'
  local fieldResult = update_residue_field(next.residues, brew.primaryElement, isVolatile)
  next.residues = fieldResult.updated
  if fieldResult.log and fieldResult.log ~= '' then
    add_log(next, 'field', fieldResult.log, next.currentTurn)
  end

  add_log(next, 'player', 'Brewed: ' .. brew.name .. '. ' .. brew.description, next.currentTurn)

  return next
end

function resolve_enemy_turn(state, brew)
  local next = copy_table(state)
  local player = next.player
  local enemy = next.enemy

  local nextEnemyShield = enemy.shield
  local nextEnemyHp = enemy.hp

  local intent = enemy.intent
  local finalEnemyDmg = intent.value

  if intent.action == 'attack' or intent.action == 'special' then
    -- Dodge check
    local dodged = false
    if player.dodgeCharges > 0 then
      local coinFlip = math.random() < 0.5
      if coinFlip then
        dodged = true
        add_log(next, 'player', 'Evasion Success! Dodged the entire attack cleanly.', next.currentTurn)
      else
        add_log(next, 'player', 'Evasion FAILED! The attack lands through the fog.', next.currentTurn)
      end
      player.dodgeCharges = math.max(0, player.dodgeCharges - 1)
    end

    if not dodged and finalEnemyDmg > 0 then
      -- Damage player shield/HP
      local pShield, pHp, penetrativeDmg = damage_shield_first(player.shield, player.hp, finalEnemyDmg)
      player.shield = pShield
      player.hp = pHp
      if penetrativeDmg == 0 then
        add_log(next, 'enemy', enemy.name .. ' used ' .. intent.description .. ': Fully blocked by your Ward shield.', next.currentTurn)
      else
        add_log(next, 'enemy', enemy.name .. ' used ' .. intent.description .. ': Deals ' .. penetrativeDmg .. ' DMG directly to your vital pool.', next.currentTurn)
      end

      -- Retaliation
      if player.retaliateCharges > 0 then
        nextEnemyHp = math.max(0, nextEnemyHp - player.retaliateCharges)
        add_log(next, 'player', 'Retaliatory flames rebound, dealing ' .. player.retaliateCharges .. ' DMG back to ' .. enemy.name .. '!', next.currentTurn)
        player.retaliateCharges = math.max(0, player.retaliateCharges - 1)
      end

      -- Molten burn application
      if enemy.archetype == 'molten_ashling' and intent.description and string.find(intent.description, 'Burn') then
        player.burnDebuff = player.burnDebuff + 1
        add_log(next, 'enemy', 'Molten embers cling to you: Applied 1 Burn debuff stack.', next.currentTurn)
      end
    end
  elseif intent.action == 'defend' then
    nextEnemyShield = nextEnemyShield + intent.value
    add_log(next, 'enemy', enemy.name .. ' used ' .. intent.description .. ': Stacked defense shields.', next.currentTurn)
  elseif intent.action == 'heal' then
    nextEnemyHp = math.min(enemy.maxHp, nextEnemyHp + intent.value)
    add_log(next, 'enemy', enemy.name .. ' used ' .. intent.description .. ': Re-bonded shattered stone cores.', next.currentTurn)
  end

  enemy.shield = nextEnemyShield
  enemy.hp = nextEnemyHp

  return next
end

function apply_residue_tick(state)
  local next = copy_table(state)
  local player = next.player
  local enemy = next.enemy

  local isWindswept = false
  for i, r in ipairs(next.residues) do
    if r.tag == 'windswept' then isWindswept = true; break end
  end
  local factor = isWindswept and 2 or 1
  local soakAttackReduction = 0

  local nextEnemyShield = enemy.shield
  local nextEnemyHp = enemy.hp

  for i, r in ipairs(next.residues) do
    if r.tag == 'burning' then
      local burnDmg = r.level * 2 * factor
      nextEnemyShield, nextEnemyHp, unused1 = damage_shield_first(nextEnemyShield, nextEnemyHp, burnDmg)
      add_log(next, 'field', 'Residue Tick: Cauldron heat deals ' .. burnDmg .. ' Burn DMG to ' .. enemy.name .. '!', next.currentTurn)
    elseif r.tag == 'soaked' then
      soakAttackReduction = r.level * 1 * factor
      add_log(next, 'field', 'Residue Tick: Cold steam reduces ' .. enemy.name .. '\\'s next attack intents by -' .. soakAttackReduction .. ' DMG.', next.currentTurn)
    end
  end

  enemy.shield = nextEnemyShield
  enemy.hp = nextEnemyHp

  -- Player burn debuff tick
  if player.burnDebuff > 0 then
    player.hp = math.max(0, player.hp - player.burnDebuff)
    add_log(next, 'system', 'Toxic Burn: Taken ' .. player.burnDebuff .. ' DMG from clinging embers.', next.currentTurn)
  end

  next.soakAttackReduction = soakAttackReduction
  return next
end

function advance_hand(state)
  local next = copy_table(state)

  -- Entire hand goes to discard
  local newDiscard = shallow_copy_list(next.discardPile)
  for i, card in ipairs(next.hand) do
    table.insert(newDiscard, card)
  end

  local nextDrawPile = shallow_copy_list(next.drawPile)
  local nextDiscardPile = newDiscard

  if #nextDrawPile < 5 then
    local shuffledDiscard = shuffle_list(nextDiscardPile)
    for i, card in ipairs(shuffledDiscard) do
      table.insert(nextDrawPile, card)
    end
    nextDiscardPile = {}
    add_log(next, 'system', 'Shuffling discard pile back into the cauldron.', next.currentTurn)
  end

  local nextHand = {}
  for i = 1, math.min(5, #nextDrawPile) do
    table.insert(nextHand, nextDrawPile[i])
  end
  local finalDrawPile = {}
  for i = 6, #nextDrawPile do
    table.insert(finalDrawPile, nextDrawPile[i])
  end

  next.hand = nextHand
  next.drawPile = finalDrawPile
  next.discardPile = nextDiscardPile

  return next
end

function resolve_turn(data, state, el1, el2, component, seed)
  local next = copy_table(state)
  local enemy = next.enemy
  if not enemy then return next end
  if not component then return next end
  if not el1 and not el2 then return next end

  local brew = solve_brew(data, el1, el2, component, seed)

  -- Stats tracking
  local stats = next.stats
  stats.brewsCreated = stats.brewsCreated + 1
  stats.totalDamageDealt = stats.totalDamageDealt + brew.damage
  stats.totalShieldGained = stats.totalShieldGained + brew.shield
  stats.totalHealed = stats.totalHealed + brew.heal
  if brew.combination == 'opposed' then
    if brew.damage > 3 then
      stats.volatileSuccesses = stats.volatileSuccesses + 1
    else
      stats.volatileFails = stats.volatileFails + 1
    end
  end

  -- Apply brew effects
  next = resolve_brew(next, brew)

  -- Check victory after brew
  if next.enemy.hp <= 0 then
    next.enemy.hp = 0
    next.enemy.shield = 0
    next.enemy.intent = { action = 'special', value = 0, description = 'Purified' }
    next.combatOutcome = 'victory'
    add_log(next, 'system', 'Victory! Cleansed the ' .. enemy.name .. '.', next.currentTurn)
    next.stats.enemiesDefeated = next.stats.enemiesDefeated + 1
    return next
  end

  -- Enemy turn
  next = resolve_enemy_turn(next, brew)

  -- Check defeat after enemy turn
  if next.player.hp <= 0 then
    next.player.hp = 0
    next.combatOutcome = 'defeat'
    add_log(next, 'system', 'Your physical form dissolved... Run failed.', next.currentTurn)
    return next
  end

  -- Residue tick
  next = apply_residue_tick(next)

  -- Check player death from burn
  if next.player.hp <= 0 then
    next.player.hp = 0
    next.combatOutcome = 'defeat'
    return next
  end

  -- Check enemy death from residue tick
  if next.enemy.hp <= 0 then
    next.enemy.hp = 0
    next.enemy.shield = 0
    next.enemy.intent = { action = 'special', value = 0, description = 'Purified' }
    next.combatOutcome = 'victory'
    add_log(next, 'system', 'Victory! Residue fields dissolved the ' .. next.enemy.name .. '.', next.currentTurn)
    next.stats.enemiesDefeated = next.stats.enemiesDefeated + 1
    return next
  end

  local nextTurnNum = next.currentTurn + 1

  -- Decay standard shield, apply Earth decaying shield carryover
  next.player.shield = next.player.decayingShield
  if next.player.decayingShield > 0 then
    add_log(next, 'player', 'Earth core stability: carried over ' .. next.player.decayingShield .. ' shield to next turn.', next.currentTurn)
  end
  next.player.decayingShield = 0

  -- Decay active residues
  local decayedResidues = {}
  for i, res in ipairs(next.residues) do
    local newLevel = res.level
    if res.tag == 'fortified' then
      if nextTurnNum % 2 == 0 then
        newLevel = math.max(0, res.level - 1)
      end
    else
      newLevel = math.max(0, res.level - 1)
    end
    if newLevel > 0 then
      table.insert(decayedResidues, { tag = res.tag, level = newLevel })
    end
  end
  next.residues = decayedResidues

  -- Advance hand
  next = advance_hand(next)

  -- Compute next enemy intent with soak/weakness reductions
  local rawIntent = get_enemy_intent(data, next.enemy.archetype, nextTurnNum)
  local finalIntentValue = rawIntent.value
  if rawIntent.action == 'attack' or rawIntent.action == 'special' then
    local reduction = (next.soakAttackReduction or 0) + brew.weaknessStacks
    finalIntentValue = math.max(0, rawIntent.value - reduction)
  end
  local desc = rawIntent.description
  if rawIntent.action == 'attack' then
    local baseDesc = rawIntent.description:match('^(.-)%s*%(') or rawIntent.description
    desc = baseDesc .. ' (' .. finalIntentValue .. ' DMG)'
  end
  next.enemy.intent = {
    action = rawIntent.action,
    value = finalIntentValue,
    description = desc
  }

  next.currentTurn = nextTurnNum
  next.soakAttackReduction = nil

  add_log(next, 'system', 'Turn ' .. nextTurnNum .. ' Begins. Draw hand refilled.', next.currentTurn)

  return next
end

-- ============================================================
-- NON-COMBAT NODES
-- ============================================================

function generate_forage_options()
  local pool = {'fire', 'water', 'earth', 'air'}
  return {
    pool[math.random(#pool)],
    pool[math.random(#pool)],
    pool[math.random(#pool)]
  }
end

function choose_forage(state, element)
  local next = copy_table(state)
  table.insert(next.deck, element)
  next.forageOptions = nil
  return next
end

function rest_stoke_furnace(state)
  local next = copy_table(state)
  next.player.hp = math.min(next.player.maxHp, next.player.hp + 12)
  next.player.burnDebuff = 0
  return next
end

function rest_synthesize_element(state, element)
  local next = copy_table(state)
  table.insert(next.deck, element)
  return next
end

function advance_node(state)
  local next = copy_table(state)
  next.currentNodeId = next.currentNodeId + 1
  if next.currentNodeId > 9 then
    next.screen = 'game_over'
    next.runWon = true
  end
  return next
end

function init_node(data, state, node_id)
  local node = nil
  for i, n in ipairs(state.nodes) do
    if n.id == node_id then node = n; break end
  end
  if not node then
    error('Node ' .. tostring(node_id) .. ' not found')
  end

  if node.type == 'fight' then
    return init_fight(data, state, node_id)
  elseif node.type == 'forage' then
    local next = copy_table(state)
    next.forageOptions = generate_forage_options()
    next.combatOutcome = nil
    return next
  elseif node.type == 'rest' then
    local next = copy_table(state)
    next.combatOutcome = nil
    return next
  end
  return copy_table(state)
end
`,gp=`-- chimera_wilds/logic.lua — Phase 1 minimal encounter loop
-- All randomness is owned by the caller; Lua only assembles and resolves.

local PART_SLOTS = {
  "head",
  "chest",
  "left_arm",
  "right_arm",
  "left_leg",
  "right_leg",
}

-- Assemble a chimera from a caller-provided parts table.
-- parts_table: array of PartDefinitions; must contain at least one part per slot.
-- On success: returns { parts, part_ids, total_power, total_endurance }, nil
-- On failure: returns nil, "Missing slot: {slot}"
function generate_chimera(parts_table)
  local by_slot = {}
  for _, part in ipairs(parts_table or {}) do
    if part and part.slot then
      by_slot[part.slot] = by_slot[part.slot] or {}
      table.insert(by_slot[part.slot], part)
    end
  end

  local selected = {}
  for _, slot in ipairs(PART_SLOTS) do
    local opts = by_slot[slot]
    if not opts or #opts == 0 then
      return nil, "Missing slot: " .. tostring(slot)
    end
    -- Caller owns the random selection; Lua takes the first candidate per slot.
    selected[slot] = opts[1]
  end

  local chimera = {
    parts = {},
    part_ids = {},
    total_power = 0,
    total_endurance = 0,
  }

  for _, slot in ipairs(PART_SLOTS) do
    local part = selected[slot]
    chimera.parts[slot] = part
    chimera.part_ids[slot] = part.id
    chimera.total_power = chimera.total_power + (part.power or 0)
    chimera.total_endurance = chimera.total_endurance + (part.endurance or 0)
  end

  return chimera, nil
end

-- Resolve a single D20-style encounter.
-- player_power, player_endurance: baseline player stats
-- chimera: assembled chimera from generate_chimera
-- roll: integer 1-20, provided by the caller
-- Returns: { won = score >= chimera_score, score, chimera_score }
function resolve_encounter(player_power, player_endurance, chimera, roll)
  local player_score = player_power + player_endurance + roll
  local chimera_score = (chimera.total_power or 0) + (chimera.total_endurance or 0)
  return {
    won = player_score >= chimera_score,
    score = player_score,
    chimera_score = chimera_score,
  }
end
`,yp=`-- Horse Racing — Game-Specific Logic
-- Runs identically in TypeScript (fengari), Python (lupa), Rust (mlua)
-- Pure logic. No rendering. No I/O. Just math and rules.
--
-- Engine primitives loaded by runtime before this file:
--   engine/primitives/action.lua     (clamp, rand_int, rand_item)
--   engine/primitives/entity.lua     (generate_id, copy_entity, validate_entity)
--   engine/systems/genetics.lua      (generate_horse, breed_horses, ...)
--   engine/systems/odds.lua          (calculate_odds, calculate_place_odds, ...)
--   engine/systems/market.lua        (settle_bets, calculate_horse_price, ...)

-- ============================================================
-- RACE CREATION
-- ============================================================

-- Create a complete race from player horse + full data table.
-- Selects eligible race class, generates NPC field within class stat range,
-- picks distance and venue name, calculates odds for the full field.
--
-- player_horse: Horse table
-- data: full data.yaml parsed table
--
-- Returns: race_obj, nil       on success
-- Returns: nil, error_string   if horse is ineligible for all classes
function create_race(player_horse, data)
  local race_classes = collect(data.race_classes)
  local distances    = collect(data.race_distances)
  local venues       = collect(data.race_venues)
  local types        = collect(data.race_types)
  local coat_colors  = collect(data.coat_colors)
  local silk_colors  = data.silk_colors
  local prefixes     = data.name_prefixes
  local suffixes     = data.name_suffixes
  local field_size   = (data.race and data.race.field_size) or 6

  local avg_stat = (player_horse.speed + player_horse.stamina +
                    player_horse.acceleration + player_horse.temperament) / 4

  local eligible = {}
  for _, rc in ipairs(race_classes) do
    local min_s = rc.stat_min or 0
    local max_s = rc.stat_max or 100
    if avg_stat >= min_s and avg_stat <= max_s then
      table.insert(eligible, rc)
    end
  end

  if #eligible == 0 then
    return nil, "Horse avg stat " .. string.format("%.1f", avg_stat) ..
                " is not eligible for any race class"
  end

  local race_class = eligible[math.random(#eligible)]
  local dist_entry = distances[math.random(#distances)]
  local distance   = dist_entry.meters
  local venue      = venues[math.random(#venues)]
  local race_type  = types[math.random(#types)]
  local race_name  = venue .. " " .. race_type

  local participants = {}
  table.insert(participants, {
    horse            = player_horse,
    gate             = 1,
    odds             = 0,
    progress         = 0,
    current_distance = 0,
    current_speed    = 0,
    energy           = 100,
    is_finished      = false,
  })

  local npc_min  = race_class.stat_min or 10
  local npc_max  = race_class.stat_max or 100
  local npc_opts = { min_stat = npc_min, max_stat = npc_max,
                     generation = 1, player_owned = false }

  while #participants < field_size do
    local npc = generate_horse(npc_opts, coat_colors, silk_colors, prefixes, suffixes)
    table.insert(participants, {
      horse            = npc,
      gate             = #participants + 1,
      odds             = 0,
      progress         = 0,
      current_distance = 0,
      current_speed    = 0,
      energy           = 100,
      is_finished      = false,
    })
  end

  local horse_stats = {}
  for _, p in ipairs(participants) do
    table.insert(horse_stats, {
      speed        = p.horse.speed,
      stamina      = p.horse.stamina,
      acceleration = p.horse.acceleration,
      temperament  = p.horse.temperament,
    })
  end
  local odds_arr = calculate_odds(horse_stats, distance)
  for i, p in ipairs(participants) do
    p.odds = odds_arr[i] or 4.0
  end

  local prize_split = race_class.prize_split or {0.60, 0.25, 0.15}

  return {
    id           = "race_" .. tostring(math.random(100000, 999999)),
    name         = race_name,
    description  = (race_class.name or "Race") .. " \\xc2\\xb7 " .. tostring(distance) ..
                   "m \\xc2\\xb7 Prize $" .. tostring(race_class.prize_pool or 0),
    distance     = distance,
    race_class   = race_class.name or "Unknown",
    prize_pool   = race_class.prize_pool or 0,
    prize_split  = prize_split,
    entry_fee    = race_class.fee or 0,
    participants = participants,
    status       = "scheduled",
  }, nil
end

-- Validate whether the player can unlock a stable slot.
-- Returns: true, nil             if unlockable
-- Returns: false, reason_string  if not
function can_unlock_slot(current_slots, max_slots, funds, unlock_cost)
  if current_slots >= max_slots then
    return false, "Stable is already at maximum capacity"
  end
  if funds < unlock_cost then
    return false, "Insufficient funds (need $" .. tostring(unlock_cost) .. ")"
  end
  return true, nil
end

-- ============================================================
-- AI-ONLY RACE CREATION
-- ============================================================

-- Create a race with no player horse — full AI field.
-- Used when the player's horse is resting or ineligible.
-- Player can still bet on any participant.
-- Returns same format as create_race, with ai_only = true.
--
-- race_class: one entry from data.race_classes
-- data: full data.yaml parsed table
function create_ai_race(race_class, data)
  local distances  = collect(data.race_distances)
  local venues     = collect(data.race_venues)
  local types      = collect(data.race_types)
  local coat_colors = collect(data.coat_colors)
  local silk_colors = data.silk_colors
  local prefixes   = data.name_prefixes
  local suffixes   = data.name_suffixes
  local field_size = (data.race and data.race.field_size) or 6

  local dist_entry = distances[math.random(#distances)]
  local venue      = venues[math.random(#venues)]
  local race_type  = types[math.random(#types)]
  local race_name  = venue .. " " .. race_type

  local npc_min  = race_class.stat_min or 10
  local npc_max  = race_class.stat_max or 100
  local npc_opts = { min_stat=npc_min, max_stat=npc_max,
                     generation=1, player_owned=false }

  local participants = {}
  for i = 1, field_size do
    local npc = generate_horse(npc_opts, coat_colors, silk_colors,
                               prefixes, suffixes)
    table.insert(participants, {
      horse            = npc,
      gate             = i,
      odds             = 0,
      progress         = 0,
      current_distance = 0,
      current_speed    = 0,
      energy           = 100,
      is_finished      = false,
    })
  end

  -- Calculate odds for the full AI field
  local horse_stats = {}
  for _, p in ipairs(participants) do
    table.insert(horse_stats, {
      speed        = p.horse.speed,
      stamina      = p.horse.stamina,
      acceleration = p.horse.acceleration,
      temperament  = p.horse.temperament,
    })
  end
  local odds_arr = calculate_odds(horse_stats, dist_entry.meters)
  for i, p in ipairs(participants) do
    p.odds = odds_arr[i] or 4.0
  end

  local prize_split = race_class.prize_split or {0.60, 0.25, 0.15}

  return {
    id          = "race_" .. tostring(math.random(100000, 999999)),
    name        = race_name,
    description = (race_class.name or "Race") .. " \\xc2\\xb7 " ..
                  tostring(dist_entry.meters) .. "m \\xc2\\xb7 Prize $" ..
                  tostring(race_class.prize_pool or 0),
    distance    = dist_entry.meters,
    race_class  = race_class.name or "Unknown",
    prize_pool  = race_class.prize_pool or 0,
    prize_split = prize_split,
    entry_fee   = race_class.fee or 0,
    participants = participants,
    status      = "scheduled",
    ai_only     = true,
  }, nil
end

-- ============================================================
-- RACE SIMULATION (single tick)
-- ============================================================

-- Advance race simulation by one tick
-- Returns updated participants and whether the race is complete
function tick_race(participants, distance, delta_time)
  local all_finished = true

  for _, p in ipairs(participants) do
    if not p.is_finished then
      local h = p.horse

      -- Energy drain: stamina slows drain rate
      -- Base drain: 8% per second; high stamina reduces to ~3%
      local energy_drain = (8 - (h.stamina / 100) * 5) * delta_time
      p.energy = math.max(0, p.energy - energy_drain)

      -- Speed calculation: base from speed stat, modified by energy and temperament
      -- Temperament adds volatility: low temperament = wider random swings
      local volatility = (100 - h.temperament) / 100
      local random_factor = 1 + (math.random() - 0.5) * volatility * 0.3

      local base_speed = (h.speed / 100) * 12  -- max ~12 m/s
      local energy_factor = 0.4 + (p.energy / 100) * 0.6  -- never drops below 40%

      -- Acceleration curve: horses start slower and build up
      local accel_factor = 1.0
      if p.current_distance < 200 then
        accel_factor = 0.4 + (h.acceleration / 100) * 0.6 *
                       (p.current_distance / 200)
      end

      p.current_speed = base_speed * energy_factor * accel_factor * random_factor
      p.current_distance = p.current_distance + p.current_speed * delta_time
      p.progress = math.min(100, (p.current_distance / distance) * 100)

      if p.current_distance >= distance then
        p.is_finished = true
        p.finish_time = p.finish_time or (p.current_distance / p.current_speed)
      else
        all_finished = false
      end
    end
  end

  return participants, all_finished
end

-- ============================================================
-- FULL RACE SIMULATION (headless, returns ranked results)
-- ============================================================

-- Run the complete race in one call. No per-tick round-trips.
-- participants: array of { horse: {id, speed, stamina, acceleration, temperament},
--                          energy: 100, current_distance: 0, current_speed: 0,
--                          is_finished: false, progress: 0 }
-- config: { distance: number, delta_time: number (optional, default 0.2) }
-- Returns: array of { rank, horse_id, horse_name, finish_time }
--          ordered 1st to last
function simulate_race(participants, config)
  local distance   = config.distance or 1200
  local delta_time = config.delta_time or 0.2
  local MAX_TICKS  = 10000  -- safety ceiling (~33 minutes at 0.2s ticks)

  -- Deep-copy participants so we don't mutate the caller's table.
  -- Use pcall when reading finish_time because lupa-proxied Python dicts
  -- raise KeyError (not nil) for absent keys.
  local field = {}
  for i, p in ipairs(participants) do
    local h = p.horse or p
    local ok, ft = pcall(function() return p.finish_time end)
    field[i] = {
      horse            = h,
      energy           = p.energy           or 100,
      current_distance = p.current_distance or 0,
      current_speed    = p.current_speed    or 0,
      is_finished      = p.is_finished      or false,
      progress         = p.progress         or 0,
      finish_time      = (ok and ft) or nil,
    }
  end

  local ticks = 0
  local all_finished = false
  while not all_finished and ticks < MAX_TICKS do
    field, all_finished = tick_race(field, distance, delta_time)
    ticks = ticks + 1
  end

  -- Sort by finish_time ascending (finished horses first, then by distance desc as tiebreak)
  table.sort(field, function(a, b)
    if a.finish_time and b.finish_time then
      return a.finish_time < b.finish_time
    elseif a.finish_time then
      return true
    elseif b.finish_time then
      return false
    else
      return (a.current_distance or 0) > (b.current_distance or 0)
    end
  end)

  local results = {}
  for rank, p in ipairs(field) do
    results[rank] = {
      rank        = rank,
      horse_id    = p.horse.id,
      horse_name  = p.horse.name or ("Horse " .. tostring(rank)),
      finish_time = p.finish_time or 0,
    }
  end

  return results
end

-- ============================================================
-- HORSE CAREER UPDATE
-- ============================================================

-- Apply race result to a horse's career stats.
-- Does NOT mutate the input horse — returns a new table.
-- rank: 1 = win, 2 = place, 3 = show, >3 = unplaced
-- prize_earnings: integer amount this horse earned from the prize pool
function update_horse_after_race(horse, rank, prize_earnings)
  prize_earnings = prize_earnings or 0
  local updated = {}
  for k, v in pairs(horse) do updated[k] = v end
  updated.runs     = (horse.runs or 0) + 1
  updated.earnings = (horse.earnings or 0) + prize_earnings
  if rank == 1 then
    updated.wins   = (horse.wins or 0) + 1
  elseif rank == 2 then
    updated.places = (horse.places or 0) + 1
  elseif rank == 3 then
    updated.thirds = (horse.thirds or 0) + 1
  end
  return updated
end

-- ============================================================
-- BALANCE TEST HELPER (called by studio_balance_report MCP tool)
-- ============================================================

-- Run one race simulation using only scalar horse stats.
-- Builds all Lua-native data internally — no Python table conversion needed.
-- speed, stamina, acceleration, temperament: player horse stats (0-100)
-- Returns: player rank (1-6), or nil on failure
function run_balance_test(speed, stamina, acceleration, temperament)
  local player_horse = {
    id           = "balance_player",
    name         = "Test Horse",
    speed        = speed,
    stamina      = stamina,
    acceleration = acceleration,
    temperament  = temperament,
  }

  local field_size  = 6
  local player_avg  = (speed + stamina + acceleration + temperament) / 4

  local participants = {{
    horse            = player_horse,
    gate             = 1,
    energy           = 100,
    current_distance = 0,
    current_speed    = 0,
    is_finished      = false,
    progress         = 0,
  }}

  for i = 2, field_size do
    local base = player_avg + (math.random() - 0.5) * 20
    base = math.max(10, math.min(100, base))
    local npc = {
      id           = "npc_" .. i,
      name         = "NPC " .. i,
      speed        = math.max(10, math.min(100, base + (math.random()-0.5)*10)),
      stamina      = math.max(10, math.min(100, base + (math.random()-0.5)*10)),
      acceleration = math.max(10, math.min(100, base + (math.random()-0.5)*10)),
      temperament  = math.max(10, math.min(100, 60 + math.random()*20)),
    }
    table.insert(participants, {
      horse            = npc,
      gate             = i,
      energy           = 100,
      current_distance = 0,
      current_speed    = 0,
      is_finished      = false,
      progress         = 0,
    })
  end

  local config = { distance = 1200, delta_time = 0.2 }
  local results = simulate_race(participants, config)
  if not results then return nil end

  for _, r in ipairs(results) do
    if r.horse_id == "balance_player" then
      return r.rank
    end
  end
  return nil
end

`,vp=`-- Mutant Battle Ball — Match Simulation & Management
-- 2v2 arena sport with possession-based roles, part system, and infirmary

GAME_STATE = {}

-- Derive combat stats from a mutant's equipped parts.
-- mutant: { parts: { head: part, chest: part, ... } }
-- Returns: { accuracy, endurance, power, speed, max_health }
function calculate_stats(mutant)
  local acc, end_, pow, spd = 0, 0, 0, 0
  local part_ids = { 'head', 'chest', 'left_arm', 'right_arm', 'left_leg', 'right_leg' }
  for _, slot in ipairs(part_ids) do
    local part = mutant.parts and mutant.parts[slot]
    if part then
      acc  = acc  + (part.accuracy  or 0)
      end_ = end_ + (part.endurance or 0)
      pow  = pow  + (part.power     or 0)
      spd  = spd  + (part.speed     or 0)
    end
  end
  return {
    accuracy   = acc,
    endurance  = end_,
    power      = pow,
    speed      = spd,
    max_health = math.max(20, end_),
  }
end

-- Initialize GAME_STATE for a match.
-- player_mutants: array of 2 mutant tables (active squad)
-- opponent_mutants: array of 2 opponent tables
-- config: { match: {...}, scoring: {...} }
function init_match(player_mutants, opponent_mutants, config)
  local m = config.match or {}
  local court_w = m.court_width  or 100
  local court_h = m.court_height or 60

  -- Build agents from mutants
  local function make_agent(mutant, team, idx, has_ball)
    local stats
    if mutant.accuracy then
      -- Opponent format (flat stats)
      stats = { accuracy=mutant.accuracy, endurance=mutant.endurance,
                power=mutant.power, speed=mutant.speed,
                max_health=mutant.max_health or mutant.endurance }
    else
      stats = calculate_stats(mutant)
    end
    return {
      id             = mutant.id or (team .. "_" .. idx),
      name           = mutant.name or "Unknown",
      team           = team,
      color          = mutant.color or "#ffffff",
      x              = (team == "player") and 30 or 70,
      y              = court_h * (idx == 1 and 0.35 or 0.65),
      vx             = 0,
      vy             = 0,
      speed          = stats.speed,
      power          = stats.power,
      accuracy       = stats.accuracy,
      endurance      = stats.endurance,
      health         = stats.max_health,
      max_health     = stats.max_health,
      has_ball       = has_ball,
      role           = has_ball and "carrier" or "escort",
      status         = "active",
      stun_timer     = 0,
      mutant_id      = mutant.id,
    }
  end

  local agents = {}
  local pm = player_mutants
  local om = opponent_mutants

  -- Player team starts with possession → player_mutants[1] is Carrier
  agents[1] = make_agent(pm[1], "player",   1, true)
  agents[2] = make_agent(pm[2], "player",   2, false)
  agents[3] = make_agent(om[1], "opponent", 1, false)
  agents[4] = make_agent(om[2], "opponent", 2, false)

  GAME_STATE = {
    agents          = agents,
    ball_x          = 50,
    ball_y          = court_h / 2,
    possession      = "player",
    score_player    = 0,
    score_opponent  = 0,
    time_remaining  = m.duration or 180,
    timeouts_left   = m.timeouts or 3,
    state           = "playing",
    events          = {},
    config          = config,
  }
end

-- Reassign roles based on current possession.
-- Call after every possession change.
local function assign_roles(agents, possession)
  local carrier_set = false
  for _, ag in ipairs(agents) do
    if ag.status ~= "active" then
      ag.role = "inactive"
    elseif ag.team == possession then
      if not carrier_set and ag.has_ball then
        ag.role = "carrier"
        carrier_set = true
      else
        ag.role = "escort"
      end
    else
      ag.role = "tackler"
    end
  end
end

-- Move an agent toward a target point.
-- Returns dx, dy applied.
local function move_toward(agent, tx, ty, speed, dt)
  local dx = tx - agent.x
  local dy = ty - agent.y
  local d  = math.sqrt(dx*dx + dy*dy)
  if d < 0.5 then return end
  local nx = dx / d
  local ny = dy / d
  agent.x = agent.x + nx * speed * dt
  agent.y = agent.y + ny * speed * dt
end

-- Get the carrier agent (has ball).
local function get_carrier(agents)
  for _, ag in ipairs(agents) do
    if ag.has_ball and ag.status == "active" then return ag end
  end
  return nil
end

-- Get nearest enemy to an agent.
local function nearest_enemy(agent, agents)
  local best, best_d2 = nil, 999999
  for _, ag in ipairs(agents) do
    if ag.team ~= agent.team and ag.status == "active" then
      local dx = ag.x - agent.x
      local dy = ag.y - agent.y
      local d2 = dx*dx + dy*dy
      if d2 < best_d2 then best_d2 = d2; best = ag end
    end
  end
  return best, math.sqrt(best_d2)
end

-- Attempt tackle: tackler tries to take ball from carrier.
-- Returns: "possession_change", "wound_limb", "fail"
local function resolve_tackle(tackler, carrier, config)
  local m = config.match or {}
  -- Attack roll: tackler power vs carrier endurance * accuracy weight
  local atk = math.random() * tackler.power
  local def = math.random() * (carrier.endurance * 0.6 + carrier.accuracy * 0.4)

  if atk > def then
    -- Tackle succeeded
    -- Wound chance: power advantage over endurance
    local wound_roll = (tackler.power - carrier.endurance) / 100
    if math.random() < math.max(0, wound_roll) then
      return "wound"
    end
    return "possession_change"
  else
    return "fail"
  end
end

-- Attempt block: escort tries to intercept a tackler.
local function resolve_block(escort, tackler)
  local atk = math.random() * escort.power
  local def = math.random() * tackler.power
  return atk > def and "block_success" or "block_fail"
end

-- Apply a wound to an agent.
-- wound_type: "limb_loss" or "heavy"
function apply_wound(agent, wound_type)
  if wound_type == "limb_loss" then
    -- Randomly lose one arm or leg stat contribution
    agent.power = math.max(5, agent.power - math.random(8, 18))
    agent.speed = math.max(5, agent.speed - math.random(5, 12))
    table.insert(GAME_STATE.events, {
      type     = "limb_loss",
      agent_id = agent.id,
      team     = agent.team,
    })
  else
    agent.health = agent.health - math.random(15, 30)
  end
  if agent.health <= 0 then
    agent.status = "down"
    table.insert(GAME_STATE.events, {
      type     = "agent_down",
      agent_id = agent.id,
      team     = agent.team,
      fatal    = math.random() < 0.35,
    })
  end
end

function tick_match(dt)
  local st = GAME_STATE
  if not st or st.state ~= "playing" then
    return build_match_render_state()
  end

  st.events = {}
  st.time_remaining = st.time_remaining - dt
  if st.time_remaining <= 0 then
    st.state = "ended"
    table.insert(st.events, { type = "match_ended",
      score_player = st.score_player, score_opponent = st.score_opponent })
    return build_match_render_state()
  end

  local m = st.config.match or {}
  local court_w = m.court_width  or 100
  local court_h = m.court_height or 60
  local tackle_r = m.tackle_range or 6.0
  local block_r  = m.block_range  or 7.0
  local cs_mult  = m.carrier_speed_mult or 0.85
  local stun_t   = m.tackle_stun_time   or 1.2
  local ez_depth = m.end_zone_depth     or 10

  local carrier = get_carrier(st.agents)
  assign_roles(st.agents, st.possession)

  -- Agent AI movement
  for _, ag in ipairs(st.agents) do
    if ag.status == "stunned" then
      ag.stun_timer = ag.stun_timer - dt
      if ag.stun_timer <= 0 then ag.status = "active" end
    elseif ag.status == "active" then
      local base_spd = ag.speed * 0.5 * dt

      if ag.role == "carrier" then
        -- Move toward own end zone
        local target_x = (st.possession == "player") and (court_w - ez_depth/2) or ez_depth/2
        local target_y = court_h / 2
        -- Slight evasion: move away from nearest tackler
        local nearest, nd = nearest_enemy(ag, st.agents)
        if nearest and nd < 20 then
          local bx = ag.x - nearest.x
          local by = ag.y - nearest.y
          local bl = math.sqrt(bx*bx + by*by)
          if bl > 0 then
            target_x = target_x + (bx/bl) * 12
            target_y = target_y + (by/bl) * 8
          end
        end
        target_x = math.max(0, math.min(court_w, target_x))
        target_y = math.max(0, math.min(court_h, target_y))
        move_toward(ag, target_x, target_y, base_spd * cs_mult, 1)

        -- Update ball position
        st.ball_x = ag.x
        st.ball_y = ag.y

      elseif ag.role == "escort" then
        -- Position between carrier and nearest tackler
        if carrier then
          local nearest_tackler = nearest_enemy(ag, st.agents)
          if nearest_tackler then
            local tx = (carrier.x + nearest_tackler.x) / 2
            local ty = (carrier.y + nearest_tackler.y) / 2
            move_toward(ag, tx, ty, base_spd, 1)
          end
        end

      elseif ag.role == "tackler" then
        -- Chase the carrier
        if carrier then
          move_toward(ag, carrier.x, carrier.y, base_spd, 1)
        end
      end

      -- Clamp to court
      ag.x = math.max(0, math.min(court_w, ag.x))
      ag.y = math.max(0, math.min(court_h, ag.y))
    end
  end

  -- Scoring check
  if carrier then
    local scored = false
    if st.possession == "player" and carrier.x > court_w - ez_depth then
      st.score_player = st.score_player + 1
      scored = true
      table.insert(st.events, { type="scored", team="player",
        score_player=st.score_player, score_opponent=st.score_opponent })
    elseif st.possession == "opponent" and carrier.x < ez_depth then
      st.score_opponent = st.score_opponent + 1
      scored = true
      table.insert(st.events, { type="scored", team="opponent",
        score_player=st.score_player, score_opponent=st.score_opponent })
    end

    if scored then
      -- Reset positions, switch possession to conceding team
      st.possession = (st.possession == "player") and "opponent" or "player"
      local reset_carrier = nil
      for _, ag in ipairs(st.agents) do
        ag.has_ball = false
        if ag.team == st.possession and ag.status == "active" and not reset_carrier then
          ag.has_ball = true
          reset_carrier = ag
        end
        ag.x = (ag.team == "player") and 30 or 70
        ag.y = court_h * (math.random() * 0.4 + 0.3)
      end
      st.ball_x = 50
      st.ball_y = court_h / 2
      assign_roles(st.agents, st.possession)
    end
  end

  -- Collision detection: blocks and tackles
  if carrier then
    for _, ag in ipairs(st.agents) do
      if ag.status == "active" and ag.role == "tackler" then
        local dx = ag.x - carrier.x
        local dy = ag.y - carrier.y
        local d  = math.sqrt(dx*dx + dy*dy)

        -- Escort intercept: check if any escort is between tackler and carrier
        local intercepted = false
        for _, esc in ipairs(st.agents) do
          if esc.status == "active" and esc.role == "escort" then
            local edx = esc.x - ag.x
            local edy = esc.y - ag.y
            if math.sqrt(edx*edx + edy*edy) < block_r then
              local outcome = resolve_block(esc, ag)
              if outcome == "block_success" then
                ag.status  = "stunned"
                ag.stun_timer = stun_t
                table.insert(st.events, { type="block", blocker_id=esc.id, tackler_id=ag.id })
              else
                -- Block failed — escort takes damage
                apply_wound(esc, "heavy")
              end
              intercepted = true
              break
            end
          end
        end

        if not intercepted and d < tackle_r then
          local outcome = resolve_tackle(ag, carrier, st.config)
          if outcome == "possession_change" or outcome == "wound" then
            if outcome == "wound" then apply_wound(carrier, "limb_loss") end

            -- Only change possession if carrier is still active
            if carrier.status == "active" then
              carrier.has_ball = false
              ag.has_ball      = true
              st.possession    = ag.team
              assign_roles(st.agents, st.possession)
              table.insert(st.events, { type="tackle_success",
                tackler_id=ag.id, carrier_id=carrier.id, possession=st.possession })
            end
          else
            -- Failed tackle — stun tackler briefly
            ag.status     = "stunned"
            ag.stun_timer = stun_t * 0.5
            table.insert(st.events, { type="tackle_fail", tackler_id=ag.id })
          end
        end
      end
    end
  end

  -- Check if any agent went down — pause for substitution
  for _, ev in ipairs(st.events) do
    if ev.type == "agent_down" then
      st.state = "paused_sub"
      break
    end
  end

  return build_match_render_state()
end

function build_match_render_state()
  local st = GAME_STATE
  if not st then return nil end

  local agents_out = {}
  for _, ag in ipairs(st.agents) do
    agents_out[#agents_out+1] = {
      id        = ag.id,
      name      = ag.name,
      team      = ag.team,
      color     = ag.color,
      x         = ag.x,
      y         = ag.y,
      role      = ag.role,
      status    = ag.status,
      has_ball  = ag.has_ball,
      health    = ag.health,
      max_health = ag.max_health,
    }
  end

  return {
    agents         = agents_out,
    ball_x         = st.ball_x,
    ball_y         = st.ball_y,
    possession     = st.possession,
    score_player   = st.score_player,
    score_opponent = st.score_opponent,
    time_remaining = st.time_remaining,
    timeouts_left  = st.timeouts_left,
    state          = st.state,
    events         = st.events,
  }
end

-- Call timeout: pause match for strategic substitution.
function call_timeout()
  if not GAME_STATE or GAME_STATE.timeouts_left <= 0 then
    return false, "No timeouts remaining"
  end
  GAME_STATE.timeouts_left = GAME_STATE.timeouts_left - 1
  GAME_STATE.state = "timeout"
  return true, nil
end

-- Resume match after substitution or timeout.
function resume_match()
  if GAME_STATE then GAME_STATE.state = "playing" end
end

-- Make substitution: replace a downed agent with a bench mutant.
-- downed_agent_id: id of agent to replace
-- bench_mutant: mutant table from bench
function make_substitution(downed_agent_id, bench_mutant)
  if not GAME_STATE then return false end
  local stats = calculate_stats(bench_mutant)
  for i, ag in ipairs(GAME_STATE.agents) do
    if ag.id == downed_agent_id then
      local had_ball = ag.has_ball
      GAME_STATE.agents[i] = {
        id         = bench_mutant.id,
        name       = bench_mutant.name,
        team       = "player",
        color      = bench_mutant.color or "#3b82f6",
        x          = ag.x,
        y          = ag.y,
        vx         = 0, vy = 0,
        speed      = stats.speed,
        power      = stats.power,
        accuracy   = stats.accuracy,
        endurance  = stats.endurance,
        health     = stats.max_health,
        max_health = stats.max_health,
        has_ball   = had_ball,
        role       = ag.role,
        status     = "active",
        stun_timer = 0,
        mutant_id  = bench_mutant.id,
      }
      GAME_STATE.state = "playing"
      return true
    end
  end
  return false
end

-- Assemble a mutant from parts in inventory.
-- Returns: assembled mutant table or nil + error
function assemble_mutant(name, color, part_ids, parts_catalogue)
  local parts = {}
  local required = { "head", "chest", "left_arm", "right_arm", "left_leg", "right_leg" }
  local parts_map = {}
  for _, p in ipairs(parts_catalogue) do
    parts_map[p.id] = p
  end
  for _, slot in ipairs(required) do
    local part_id = part_ids[slot]
    if not part_id then
      return nil, "Missing part for slot: " .. slot
    end
    local part = parts_map[part_id]
    if not part then
      return nil, "Part not found: " .. part_id
    end
    parts[slot] = part
  end
  return {
    id     = "mutant_" .. tostring(math.random(100000, 999999)),
    name   = name,
    color  = color or "#6c8ef7",
    parts  = parts,
    status = "healthy",
    matches_played = 0,
  }, nil
end
`,xp=`-- scrapcrawl/logic.lua — Phase A core loop port
-- Faithful port of the certified ScrapCrawl TS implementation.
-- All randomness is caller-owned where determinism matters; otherwise math.random.

local function clamp(val, min, max)
  return math.max(min, math.min(max, val))
end

-- Cross-runtime helper: YAML numeric keys may arrive as integers (lupa), strings
-- (fengari object keys), or floats (fengari JS numbers). Try all reasonable forms.
local function lookup_tier(map, tier)
  if map == nil then return nil end
  local as_num = tonumber(tier)
  if as_num ~= nil then
    local as_int = math.floor(as_num + 0.5)
    return map[as_int] or map[tostring(as_int)] or map[tostring(as_num)]
  end
  return map[tier]
end

local function copy_table(t)
  if type(t) ~= "table" then return t end
  local c = {}
  for k, v in pairs(t) do
    c[k] = v
  end
  return c
end

local function shallow_copy_player(player)
  local next = copy_table(player)
  next.equipped = copy_table(player.equipped)
  next.proficiencyXp = copy_table(player.proficiencyXp)
  next.roster = copy_table(player.roster)
  next.sculptedCache = copy_table(player.sculptedCache)
  return next
end

-- ============================================================
-- ROOMS
-- ============================================================

function get_room(data, room_id)
  local room = data.rooms[room_id]
  if room == nil then
    error('Room with ID "' .. tostring(room_id) .. '" not found.')
  end
  return room
end

function can_move_to(data, from_room_id, to_room_id)
  local from_room = data.rooms[from_room_id]
  if from_room == nil then return false end
  for _, conn in ipairs(from_room.connections or {}) do
    if conn == to_room_id then return true end
  end
  return false
end

function move_player(data, player, to_room_id)
  if not can_move_to(data, player.currentRoomId, to_room_id) then
    return player
  end
  local next = shallow_copy_player(player)
  next.currentRoomId = to_room_id
  return next
end

-- ============================================================
-- PROFICIENCY / GROWTH
-- ============================================================

function growth_factor(data, xp)
  local ceiling = data.constants.proficiency_xp_ceiling
  local ratio = xp / ceiling
  return clamp(0.8 + ratio * 0.7, 0.8, 1.5)
end

-- ============================================================
-- ROOM INTERACTION HELPERS
-- ============================================================

local function room_has_interaction(room, interaction)
  local types = room.interaction_types or room.interactionTypes or {}
  for _, t in ipairs(types) do
    if t == interaction then return true end
  end
  return false
end

-- ============================================================
-- CRAFTING
-- ============================================================

function can_craft(data, player, room, catalog_id, tier)
  if not room_has_interaction(room, "craft") then
    return false
  end

  local entry = data.catalog[catalog_id]
  if entry == nil then return false end

  -- Tool is a one-time gate, not equippable.
  if catalog_id == "tool" then
    if player.tier2Unlocked then return false end
    local cost = lookup_tier(entry.tierCost, 1)
    return player.scrap >= cost
  end

  local resolved_tier = tier or (player.tier2Unlocked and 2 or 1)
  if resolved_tier == 2 and not player.tier2Unlocked then
    return false
  end

  local cost = lookup_tier(entry.tierCost, resolved_tier)
  return player.scrap >= cost
end

function craft(data, player, room, catalog_id, tier)
  if not room_has_interaction(room, "craft") then
    error('Crafting rejected: Room "' .. tostring(room.id) .. '" does not support crafting.')
  end

  local entry = data.catalog[catalog_id]
  if entry == nil then
    error('Crafting rejected: Catalog entry for "' .. tostring(catalog_id) .. '" does not exist.')
  end

  if catalog_id == "tool" and player.tier2Unlocked then
    error('Crafting rejected: Tool already crafted and Tier 2 unlocked.')
  end

  local resolved_tier = catalog_id == "tool" and 1 or (tier or (player.tier2Unlocked and 2 or 1))

  if resolved_tier == 2 and not player.tier2Unlocked then
    error('Crafting rejected: Attempted Tier 2 craft for "' .. tostring(catalog_id) .. '" but Tier 2 is locked (Tool required).')
  end

  local cost = lookup_tier(entry.tierCost, resolved_tier)
  if player.scrap < cost then
    error('Crafting rejected: Insufficient scrap to craft "' .. tostring(catalog_id) .. '" (Tier ' .. tostring(resolved_tier) .. '). Cost: ' .. tostring(cost) .. ', available: ' .. tostring(player.scrap) .. '.')
  end

  local next = shallow_copy_player(player)
  next.scrap = player.scrap - cost

  if catalog_id == "tool" then
    next.tier2Unlocked = true
    return next
  end

  local slot = entry.slot
  local max_life = lookup_tier(entry.maxLife, resolved_tier)
  local new_equipment = {
    id = catalog_id .. "_" .. tostring(math.random(100000, 999999)),
    slot = slot,
    catalogId = catalog_id,
    tier = resolved_tier,
    life = max_life,
    maxLife = max_life,
  }

  next.equipped[slot] = new_equipment
  return next
end

-- ============================================================
-- COMBAT
-- ============================================================

function resolve_fight(data, player, room, roll, scrap_reward)
  if not room_has_interaction(room, "fight") then
    error('Cannot fight in room "' .. tostring(room.id) .. '" — not a fight-capable room.')
  end

  local difficulty = room.difficulty or 0

  local weapon = player.equipped.weapon
  local has_active_weapon = weapon and weapon.life > 0
  local weapon_atk = data.constants.unarmed_baseline_atk
  if has_active_weapon then
    local base_stats = lookup_tier(data.catalog[weapon.catalogId].baseStats, weapon.tier)
    weapon_atk = (lookup_tier(base_stats, "atk") or 0)
  end

  local proficiency_xp = player.proficiencyXp.weapon or 0
  local contribution = weapon_atk * growth_factor(data, proficiency_xp)

  local used_roll = roll or math.random(1, 20)
  local score = used_roll + contribution
  local won = score >= difficulty

  local next = shallow_copy_player(player)

  -- Deplete weapon life on every fight, even if broken (stays at 0).
  if weapon then
    local updated_weapon = copy_table(weapon)
    updated_weapon.life = math.max(0, weapon.life - 1)
    next.equipped.weapon = updated_weapon
  end

  local scrap_gained = 0
  if won then
    scrap_gained = scrap_reward or math.random(data.constants.scrap_reward_min, data.constants.scrap_reward_max)
    next.scrap = next.scrap + scrap_gained

    next.proficiencyXp.weapon = (next.proficiencyXp.weapon or 0) + data.constants.proficiency_win_xp
  end

  return {
    won = won,
    scrap_gained = scrap_gained,
    roll = used_roll,
    score = score,
    difficulty = difficulty,
    player = next,
  }
end

-- ============================================================
-- LIFECYCLE
-- ============================================================

function init_player()
  return {
    currentRoomId = "home_base",
    scrap = 0,
    tier2Unlocked = false,
    equipped = {},
    proficiencyXp = {
      weapon = 0,
      shield = 0,
      armor = 0,
    },
    roster = {},
    activeCompanionId = nil,
    sculptedCache = {},
  }
end

function reset_position(player)
  local next = shallow_copy_player(player)
  next.currentRoomId = "home_base"
  return next
end
`,kp=`-- shoal/entities.lua — spawning, killing, lineage, and algae nodule helpers

local function collect_live_colors()
    local live_colors = {}
    local st = GAME_STATE
    for _, f in ipairs(st.fish) do
        if f.alive then live_colors[#live_colors + 1] = f.lineage_color end
    end
    for _, s in ipairs(st.sharks) do
        if s.alive then live_colors[#live_colors + 1] = s.lineage_color end
    end
    return live_colors
end

function new_fish(x, depth)
    local data = GAME_STATE.data
    local cfg = data.creatures.fish
    local id = uid("fish")
    return {
        id = id,
        type = "fish",
        x = x,
        depth = depth,
        vx = random_float(-1, 1),
        vd = random_float(-0.5, 0.5),
        age = 0,
        fed = 0,
        cold_exposure = 0,
        cold_damage = 0,
        radius = cfg.radius,
        max_speed = cfg.max_speed,
        max_force = cfg.max_force,
        lineage_color = generate_procedural_color(id, collect_live_colors()),
        mature = false,
        alive = true,
    }
end

function new_shark(x, depth)
    local data = GAME_STATE.data
    local cfg = data.creatures.shark
    local id = uid("shark")
    return {
        id = id,
        type = "shark",
        x = x,
        depth = depth,
        vx = random_float(-1, 1),
        vd = random_float(-0.5, 0.5),
        age = 0,
        fed = 0,
        hunger = 0,
        exposure = 0,
        last_meal_tick = 0,
        ticks_with_target = 0,
        ticks_total = 0,
        radius = cfg.radius,
        max_speed = cfg.max_speed,
        max_force = cfg.max_force,
        lineage_color = generate_procedural_color(id, collect_live_colors()),
        mature = false,
        alive = true,
        in_retreat = false,
    }
end

function new_algae_nodule(cx, cdepth, dir, dist)
    local dx, dy = 0, 0
    if dir == 0 then dy = -dist
    elseif dir == 1 then dy = dist
    elseif dir == 2 then dx = -dist
    elseif dir == 3 then dx = dist
    end
    return {
        id = uid("nodule"),
        x = cx + dx,
        depth = cdepth + dy,
        live = true,
        cooldown = 0,
        offset = { x = dx, y = dy },
    }
end

function spawn_algae_core(st, x, depth)
    local data = st.data
    local nodules = {}
    local distances = data.algae.spoke_distances
    for dir = 0, 3 do
        for _, dist in ipairs(distances) do
            nodules[#nodules + 1] = new_algae_nodule(x, depth, dir, dist)
        end
    end
    local core = {
        id = uid("algae"),
        x = x,
        depth = depth,
        target_depth = depth,
        nodules = nodules,
        max_nodules = #nodules,
    }
    st.algae[#st.algae + 1] = core
    return core
end

function spawn_fish(st, x, depth)
    local f = new_fish(x, depth)
    st.fish[#st.fish + 1] = f
    st.stats.fish_count = st.stats.fish_count + 1
    return f
end

function spawn_shark(st, x, depth)
    local s = new_shark(x, depth)
    s.spawn_tick = st.tick_count
    s.last_meal_tick = st.tick_count
    st.sharks[#st.sharks + 1] = s
    st.stats.shark_count = st.stats.shark_count + 1
    return s
end

function spawn_flesh_chunks(st, x, depth, count)
    local data = st.data
    for i = 1, count do
        local angle = random_float(0, math.pi * 2)
        local speed = random_float(20, 60)
        st.chunks[#st.chunks + 1] = {
            id = uid("chunk"),
            x = x + math.cos(angle) * random_float(0, 15),
            depth = depth + math.sin(angle) * random_float(0, 15),
            vx = math.cos(angle) * speed,
            vd = math.sin(angle) * speed,
            radius = data.flesh_chunk.radius,
        }
    end
    st.stats.chunk_count = #st.chunks
end

function kill_creature(st, creature)
    if not creature.alive then return end
    if creature.type == "shark" then
        st.diagnostics = st.diagnostics or { meals = {}, deaths = {} }
        local data = st.data
        table.insert(st.diagnostics.deaths, {
            shark_id = creature.id,
            tick = st.tick_count,
            ticks_since_spawn = st.tick_count - (creature.spawn_tick or 0),
            target_ratio = creature.ticks_total > 0 and (creature.ticks_with_target / creature.ticks_total) or 0,
            cause = creature.hunger >= data.creatures.shark.starve_limit and "starvation" or "exposure",
            hunger = creature.hunger,
            exposure = creature.exposure,
        })
    end
    creature.alive = false
    if creature.type == "fish" then
        st.stats.fish_count = st.stats.fish_count - 1
    elseif creature.type == "shark" then
        st.stats.shark_count = st.stats.shark_count - 1
    end
    local data = st.data
    spawn_flesh_chunks(st, creature.x, creature.depth, math.random(data.flesh_chunk.min_spawn, data.flesh_chunk.max_spawn))
end

function update_algae_core(core, st, dt)
    local data = st.data
    local live = 0
    for _, n in ipairs(core.nodules) do
        if n.live then
            live = live + 1
        else
            n.cooldown = n.cooldown - dt
            if n.cooldown <= 0 then
                n.live = true
            end
        end
    end

    local ratio = live / core.max_nodules
    local target = lerp(data.algae.max_sunk_depth, data.algae.min_surface_depth, ratio)
    local diff = target - core.depth
    local move = data.algae.depth_lerp_speed * dt
    if math.abs(diff) <= move then
        core.depth = target
    else
        core.depth = core.depth + (diff > 0 and move or -move)
    end

    -- Update nodule world positions relative to core.
    for _, n in ipairs(core.nodules) do
        n.x = wrap_x(core.x + n.offset.x, st.world)
        n.depth = clamp_depth(core.depth + n.offset.y, st.world)
    end
    core.x = wrap_x(core.x, st.world)
end

function graze_nodule(st, nodule, core)
    if not nodule.live then return false end
    nodule.live = false
    nodule.cooldown = st.data.algae.regrow_cooldown
    return true
end

function cull_at(st, x, depth, radius)
    local data = st.data
    -- Cull fish and sharks within radius
    for _, list in ipairs({ st.fish, st.sharks }) do
        for _, c in ipairs(list) do
            if c.alive and distance(c.x, c.depth, x, depth) <= radius + c.radius then
                kill_creature(st, c)
            end
        end
    end
    -- Cull nodules
    for _, core in ipairs(st.algae) do
        for _, n in ipairs(core.nodules) do
            if n.live and distance(n.x, n.depth, x, depth) <= radius + data.algae.nodule_radius then
                graze_nodule(st, n, core)
            end
        end
    end
end

function tag_lineage(st, x, depth, radius)
    -- Future hook: tap a creature to assign a specific lineage tint.
    -- For now, no-op.
    return nil
end
`,wp=`-- shoal/logic.lua — main loop and render state

function init_game(data)
    GAME_STATE = new_game_state(data)
    GAME_STATE.diagnostics = { meals = {}, deaths = {} }
    spawn_initial_entities(GAME_STATE, data)
    local st = GAME_STATE
    st.stats.fish_count = count_alive(st.fish)
    st.stats.shark_count = count_alive(st.sharks)
    st.stats.algae_count = count_algae_nodules(st)
    st.stats.chunk_count = #st.chunks
    return build_render_state(GAME_STATE)
end

function tick_game(dt, input)
    if not GAME_STATE then
        return { error = "call init_game first" }
    end
    if dt > 0.1 then dt = 0.1 end
    local st = GAME_STATE
    st.tick_count = st.tick_count + 1
    st.events = {}

    handle_input(st, input)

    rebuild_spatial_hash(st)
    update_creatures(st, dt)
    update_algae(st, dt)
    update_chunks(st, dt)
    update_discrete_events(st, dt)

    st.stats.fish_count = count_alive(st.fish)
    st.stats.shark_count = count_alive(st.sharks)
    st.stats.algae_count = count_algae_nodules(st)
    st.stats.chunk_count = #st.chunks

    return build_render_state(st)
end

function handle_input(st, input)
    if not input then return end
    local tool = input.tool
    if not tool or not input.clicked then return end
    if not input.x or not input.y then return end
    if tool == "cull" then
        cull_at(st, input.x, input.y, 40)
    elseif tool == "fish" then
        spawn_fish(st, input.x, input.y)
    elseif tool == "shark" then
        spawn_shark(st, input.x, input.y)
    elseif tool == "algae" then
        spawn_algae_core(st, input.x, input.y)
    end
end

function rebuild_spatial_hash(st)
    local data = st.data
    local hash = { fish = {}, shark = {} }
    local bw = data.spatial_hash.bucket_width
    local bd = data.spatial_hash.bucket_depth
    for _, f in ipairs(st.fish) do
        if f.alive then
            local bx = math.floor(f.x / bw) % math.ceil(st.world.width / bw)
            local by = math.floor(f.depth / bd) % math.ceil(st.world.height / bd)
            local key = bx .. "," .. by
            if not hash.fish[key] then hash.fish[key] = {} end
            table.insert(hash.fish[key], f)
        end
    end
    for _, s in ipairs(st.sharks) do
        if s.alive then
            local bx = math.floor(s.x / bw) % math.ceil(st.world.width / bw)
            local by = math.floor(s.depth / bd) % math.ceil(st.world.height / bd)
            local key = bx .. "," .. by
            if not hash.shark[key] then hash.shark[key] = {} end
            table.insert(hash.shark[key], s)
        end
    end
    st.spatial_hash = hash
end

function get_nearby(hash, bx, by, type)
    local list = {}
    for dx = -1, 1 do
        for dy = -1, 1 do
            local k = (bx + dx) .. "," .. (by + dy)
            if hash[type][k] then
                for _, ent in ipairs(hash[type][k]) do
                    table.insert(list, ent)
                end
            end
        end
    end
    return list
end

function update_creatures(st, dt)
    local data = st.data
    for _, f in ipairs(st.fish) do
        if f.alive then
            move_creature(f, dt)
        end
    end
    for _, s in ipairs(st.sharks) do
        if s.alive then
            move_creature(s, dt)
            s.hunger = s.hunger + dt
        end
    end
end

local function limit_turn(old_vx, old_vy, new_vx, new_vy, max_turn_rate, max_speed, dt)
    local old_angle = math.atan(old_vy, old_vx)
    local new_angle = math.atan(new_vy, new_vx)
    local speed = math.sqrt(new_vx * new_vx + new_vy * new_vy)

    if speed < 0.01 then
        return new_vx, new_vy
    end

    local speed_ratio = math.min(speed / max_speed, 1.0)
    local effective_turn_rate = max_turn_rate * (2.0 - speed_ratio)

    local diff = new_angle - old_angle
    while diff > math.pi do diff = diff - 2 * math.pi end
    while diff < -math.pi do diff = diff + 2 * math.pi end

    local max_delta = effective_turn_rate * dt
    if diff > max_delta then diff = max_delta
    elseif diff < -max_delta then diff = -max_delta end

    local clamped_angle = old_angle + diff
    return math.cos(clamped_angle) * speed, math.sin(clamped_angle) * speed
end

function get_shark_targets(s, st)
    local data = st.data
    local cfg = data.creatures.shark
    local nearest_fish, fish_dist2 = nil, cfg.perception.fish * cfg.perception.fish
    for _, f in ipairs(st.fish) do
        if f.alive then
            local d2 = dist2(s.x, s.depth, f.x, f.depth)
            if d2 < fish_dist2 then
                fish_dist2 = d2
                nearest_fish = f
            end
        end
    end

    local nearest_chunk, chunk_dist2 = nil, cfg.perception.flesh * cfg.perception.flesh
    for _, c in ipairs(st.chunks) do
        local d2 = dist2(s.x, s.depth, c.x, c.depth)
        if d2 < chunk_dist2 then
            chunk_dist2 = d2
            nearest_chunk = c
        end
    end

    return nearest_fish, nearest_chunk
end

function move_creature(c, dt)
    local st = GAME_STATE
    local data = st.data
    local fx, fy = 0, 0
    if c.type == "fish" then
        fx, fy = compute_fish_forces(c, st, st.spatial_hash)
    else
        fx, fy = compute_shark_forces(c, st, st.spatial_hash)
        local nearest_fish, nearest_chunk = get_shark_targets(c, st)
        c.ticks_total = c.ticks_total + 1
        if nearest_fish or nearest_chunk then
            c.ticks_with_target = c.ticks_with_target + 1
        end
    end

    local old_vx, old_vd = c.vx, c.vd
    fx, fy = limit_vector(fx, fy, c.max_force)
    c.vx = c.vx + fx * dt
    c.vd = c.vd + fy * dt

    local vx, vd = limit_vector(c.vx, c.vd, c.max_speed)
    c.vx, c.vd = limit_turn(old_vx, old_vd, vx, vd, data.creatures[c.type].max_turn_rate, c.max_speed, dt)

    local drag = 0.99 ^ (dt / 0.1)
    c.vx = c.vx * drag
    c.vd = c.vd * drag

    c.x = wrap_x(c.x + c.vx * dt, st.world)
    c.depth = clamp_depth(c.depth + c.vd * dt, st.world)

    if c.type == "shark" then
        local rate = compute_exposure_rate(c.depth, data)
        local decay = data.creatures.shark.exposure.decay_rate
        c.exposure = math.max(0, c.exposure + (rate - decay) * dt)
        if c.exposure >= data.creatures.shark.exposure.threshold then
            c.exposure = data.creatures.shark.exposure.threshold
            c.hunger = c.hunger + data.creatures.shark.exposure.damage_rate * dt
        end
    elseif c.type == "fish" then
        local rate = compute_fish_cold_rate(c.depth, data)
        local decay = data.creatures.fish.cold.decay_rate
        c.cold_exposure = math.max(0, c.cold_exposure + (rate - decay) * dt)
        if c.cold_exposure >= data.creatures.fish.cold.threshold then
            c.cold_exposure = data.creatures.fish.cold.threshold
            c.cold_damage = c.cold_damage + data.creatures.fish.cold.damage_rate * dt
            if c.cold_damage >= data.creatures.fish.cold.damage_limit then
                kill_creature(st, c)
            end
        end
    end

    return c
end

function compute_fish_cold_rate(depth, data)
    local bands = data.depth_bands
    for i = 1, #bands do
        if depth <= bands[i].bottom then
            if i == 1 then
                return bands[i].fish_cold_rate
            else
                local prev = bands[i - 1]
                local t = (depth - prev.bottom) / (bands[i].bottom - prev.bottom)
                return lerp(prev.fish_cold_rate, bands[i].fish_cold_rate, t)
            end
        end
    end
    return bands[#bands].fish_cold_rate
end

function update_algae(st, dt)
    for _, core in ipairs(st.algae) do
        update_algae_core(core, st, dt)
    end
end

function update_chunks(st, dt)
    local data = st.data
    local sink_rate = data.flesh_chunk.sink_rate
    local floor_depth = st.world.floor_depth
    local grace = data.flesh_chunk.floor_grace_time
    for i = #st.chunks, 1, -1 do
        local c = st.chunks[i]
        c.x = wrap_x(c.x + c.vx * dt, st.world)
        c.depth = clamp_depth(c.depth + c.vd * dt + sink_rate * dt, st.world)
        c.vx = c.vx * 0.95
        c.vd = c.vd * 0.95
        if c.depth >= floor_depth - 0.5 then
            c.floor_timer = (c.floor_timer or 0) + dt
            if c.floor_timer >= grace then
                table.remove(st.chunks, i)
                st.stats.chunk_count = #st.chunks
            end
        end
    end
end

function update_discrete_events(st, dt)
    st.discrete_accum = (st.discrete_accum or 0) + dt
    if st.discrete_accum < st.data.world.discrete_tick then return end
    st.discrete_accum = 0

    local data = st.data

    -- fish grazing
    for _, f in ipairs(st.fish) do
        if not f.alive then goto next_fish end
        for _, core in ipairs(st.algae) do
            for _, n in ipairs(core.nodules) do
                if n.live and distance(f.x, f.depth, n.x, n.depth) <= f.radius + data.algae.nodule_radius then
                    if graze_nodule(st, n, core) then
                        f.fed = f.fed + 1
                        if f.fed >= data.creatures.fish.breed_fed_threshold and f.age >= data.creatures.fish.breed_age then
                            local current_fish = count_alive(st.fish)
                            local capacity = data.creatures.fish.carrying_capacity
                            local breed_probability = math.max(0, 1 - (current_fish / capacity))
                            if math.random() < breed_probability then
                                spawn_fish(st, f.x, f.depth)
                                f.fed = 0
                                f.age = 0
                            end
                        end
                    end
                    break
                end
            end
        end
        ::next_fish::
    end

    -- shark hunting / chunk eating
    for _, s in ipairs(st.sharks) do
        if not s.alive then goto next_shark end
        local ate = false

        -- find nearest overlapping fish
        local nearest_fish, nearest_fish_d2 = nil, nil
        for _, f in ipairs(st.fish) do
            if f.alive then
                local d2 = dist2(s.x, s.depth, f.x, f.depth)
                local touch_radius = s.radius + f.radius
                if d2 <= touch_radius * touch_radius then
                    if not nearest_fish_d2 or d2 < nearest_fish_d2 then
                        nearest_fish, nearest_fish_d2 = f, d2
                    end
                end
            end
        end

        -- find nearest overlapping chunk
        local nearest_chunk, nearest_chunk_d2, chunk_index = nil, nil, nil
        local chunk_eat_range = data.flesh_chunk.shark_eat_range
        for i, c in ipairs(st.chunks) do
            local d2 = dist2(s.x, s.depth, c.x, c.depth)
            if d2 <= chunk_eat_range * chunk_eat_range then
                if not nearest_chunk_d2 or d2 < nearest_chunk_d2 then
                    nearest_chunk, nearest_chunk_d2, chunk_index = c, d2, i
                end
            end
        end

        if nearest_fish and (not nearest_chunk or nearest_fish_d2 <= nearest_chunk_d2) then
            local speed = math.sqrt(nearest_fish.vx * nearest_fish.vx + nearest_fish.vd * nearest_fish.vd)
            local speed_ratio = speed / nearest_fish.max_speed
            local escape_chance = data.creatures.fish.escape_chance
            if speed_ratio > 0.8 then
                escape_chance = escape_chance + data.creatures.fish.escape_speed_bonus
            end
            if math.random() < escape_chance then
                -- escaped: knock the fish away so it isn't re-caught next tick
                local dx, dy = nearest_fish.x - s.x, nearest_fish.depth - s.depth
                local dist = math.sqrt(dx * dx + dy * dy)
                if dist > 0 then
                    local kb = data.creatures.fish.escape_knockback
                    nearest_fish.x = wrap_x(nearest_fish.x + (dx / dist) * kb, st.world)
                    nearest_fish.depth = clamp_depth(nearest_fish.depth + (dy / dist) * kb, st.world)
                end
            else
                kill_creature(st, nearest_fish)
                st.diagnostics = st.diagnostics or { meals = {}, deaths = {} }
                table.insert(st.diagnostics.meals, {
                    shark_id = s.id,
                    tick = st.tick_count,
                    meal_type = "fish",
                    hunger_at_meal = s.hunger,
                    ticks_since_last_meal = st.tick_count - s.last_meal_tick,
                })
                s.last_meal_tick = st.tick_count
                s.hunger = math.max(0, s.hunger - data.creatures.shark.fish_hunger_refund)
                s.fed = (s.fed or 0) + 1
                ate = true
            end
        elseif nearest_chunk then
            table.remove(st.chunks, chunk_index)
            st.stats.chunk_count = #st.chunks
            st.diagnostics = st.diagnostics or { meals = {}, deaths = {} }
            table.insert(st.diagnostics.meals, {
                shark_id = s.id,
                tick = st.tick_count,
                meal_type = "chunk",
                hunger_at_meal = s.hunger,
                ticks_since_last_meal = st.tick_count - s.last_meal_tick,
            })
            s.last_meal_tick = st.tick_count
            s.hunger = math.max(0, s.hunger - data.flesh_chunk.hunger_refund)
            s.fed = (s.fed or 0) + 1
            ate = true
        end
        if s.hunger >= data.creatures.shark.starve_limit then
            kill_creature(st, s)
        end
        if s.age >= data.creatures.shark.breed_age and (s.fed or 0) >= data.creatures.shark.breed_fed_threshold then
            spawn_shark(st, s.x, s.depth)
            s.fed = 0
            s.age = 0
        end
        s.age = s.age + 1
        ::next_shark::
    end

    -- age fish
    for _, f in ipairs(st.fish) do
        if f.alive then
            f.age = f.age + data.world.discrete_tick
            f.mature = f.age >= data.creatures.fish.breed_age
        end
    end

    -- shark death from exposure already handled in move; here we just clean
    for _, s in ipairs(st.sharks) do
        if s.alive and s.hunger >= data.creatures.shark.starve_limit then
            kill_creature(st, s)
        end
    end
end

function count_alive(list)
    local n = 0
    for _, c in ipairs(list) do
        if c.alive then n = n + 1 end
    end
    return n
end

function count_algae_nodules(st)
    local n = 0
    for _, core in ipairs(st.algae) do
        for _, nod in ipairs(core.nodules) do
            if nod.live then n = n + 1 end
        end
    end
    return n
end

function count_algae_nodule_capacity(st)
    local total = 0
    for _, core in ipairs(st.algae) do
        total = total + (core.max_nodules or #core.nodules)
    end
    return total
end

function build_render_state(st)
    local out = {
        world = {
            width = st.world.width,
            height = st.world.height,
        },
        fish = {},
        sharks = {},
        algae = {},
        chunks = {},
        stats = st.stats,
        events = st.events,
        tick_count = st.tick_count,
    }

    for _, f in ipairs(st.fish) do
        if f.alive then
            table.insert(out.fish, {
                id = f.id,
                x = f.x,
                depth = f.depth,
                radius = f.radius,
                color = f.lineage_color,
                angle = math.atan(f.vd, f.vx),
                mature = f.mature,
                cold_exposure = f.cold_exposure,
                cold_damage = f.cold_damage,
            })
        end
    end

    for _, s in ipairs(st.sharks) do
        if s.alive then
            table.insert(out.sharks, {
                id = s.id,
                x = s.x,
                depth = s.depth,
                radius = s.radius,
                color = s.lineage_color,
                angle = math.atan(s.vd, s.vx),
                exposure = s.exposure,
                hunger = s.hunger,
                mature = s.mature,
            })
        end
    end

    for _, core in ipairs(st.algae) do
        local nodules = {}
        for _, n in ipairs(core.nodules) do
            if n.live then
                table.insert(nodules, { x = n.x, depth = n.depth, radius = GAME_STATE.data.algae.nodule_radius })
            end
        end
        table.insert(out.algae, {
            id = core.id,
            x = core.x,
            depth = core.depth,
            nodules = nodules,
        })
    end

    for _, c in ipairs(st.chunks) do
        table.insert(out.chunks, {
            x = c.x,
            depth = c.depth,
            radius = c.radius,
        })
    end

    return out
end

function get_state_summary()
    if not GAME_STATE then return nil end
    local st = GAME_STATE
    local live = st.stats.algae_count
    local total = count_algae_nodule_capacity(st)
    return {
        initialized = true,
        fish_count = st.stats.fish_count,
        shark_count = st.stats.shark_count,
        algae_count = live,
        algae_capacity = total,
        algae_available = total - live,
        chunk_count = st.stats.chunk_count,
        tick_count = st.tick_count,
    }
end

function get_diagnostics()
    if not GAME_STATE then return nil end
    local st = GAME_STATE
    st.diagnostics = st.diagnostics or { meals = {}, deaths = {} }
    return st.diagnostics
end
`,Ap=`-- shoal/state.lua — GAME_STATE shape and initialization helpers

function new_game_state(data)
    local world = data.world
    return {
        data = data,
        world = world,
        fish = {},
        sharks = {},
        algae = {},
        chunks = {},
        events = {},
        next_id = 0,
        tick_count = 0,
        discrete_accum = 0,
        stats = {
            fish_count = 0,
            shark_count = 0,
            algae_count = 0,
            chunk_count = 0,
        },
    }
end

function spawn_initial_entities(st, data)
    local world = data.world
    local hub_count = data.spawn.initial_algae_hubs
    local spacing = world.width / (hub_count + 1)
    for i = 1, hub_count do
        local x = spacing * i
        spawn_algae_core(st, x, data.spawn.algae_spawn_depth)
    end

    for i = 1, data.spawn.initial_fish do
        spawn_fish(st, random_float(0, world.width), random_float(50, 400))
    end

    for i = 1, data.spawn.initial_sharks do
        spawn_shark(st, random_float(0, world.width), random_float(300, 700))
    end
end
`,bp=`-- shoal/steering.lua — force accumulation for fish and sharks

local wander_targets = {}

function get_wander_target(id, x, y, cfg)
    if not wander_targets[id] then
        wander_targets[id] = { x = random_float(-1, 1), y = random_float(-1, 1) }
    end
    return wander_targets[id]
end

function set_wander_target(id, wx, wy)
    wander_targets[id] = { x = wx, y = wy }
end

function force_seek(x, y, tx, ty, weight, max_force)
    local dx, dy = tx - x, ty - y
    local dist = math.sqrt(dx * dx + dy * dy)
    if dist == 0 then return 0, 0 end
    return (dx / dist) * weight * max_force, (dy / dist) * weight * max_force
end

local function stopping_radius(max_speed, max_force, margin)
    return (max_speed * max_speed) / (2 * max_force) * margin
end

function force_arrive(x, y, vx, vy, tx, ty, weight, max_speed, max_force, slowing_radius, min_speed)
    min_speed = min_speed or 0
    local dx, dy = tx - x, ty - y
    local dist = math.sqrt(dx * dx + dy * dy)
    if dist == 0 then return 0, 0 end

    local desired_speed = max_speed
    if dist < slowing_radius then
        desired_speed = max_speed * (dist / slowing_radius)
        if desired_speed < min_speed then
            desired_speed = min_speed
        end
    end

    local desired_vx = (dx / dist) * desired_speed
    local desired_vy = (dy / dist) * desired_speed

    local steer_x = desired_vx - vx
    local steer_y = desired_vy - vy

    return steer_x * weight, steer_y * weight
end

function force_depth_arrive(depth, vd, target_depth, weight, max_speed, max_force, slowing_radius)
    local effective_max_force = math.min(max_force, weight * max_speed)
    local sr = stopping_radius(max_speed, effective_max_force, 1.3)
    local dy = target_depth - depth
    local dist = math.abs(dy)
    if dist < 2 then return 0 end

    local desired_speed = max_speed
    if dist < sr then
        desired_speed = max_speed * (dist / sr)
    end

    local desired_vd = (dy > 0 and 1 or -1) * desired_speed
    local steer_y = desired_vd - vd

    -- Clamp the weighted force, not the raw steer error, so the controller can
    -- still request full max_force authority when the velocity error is large.
    local force = steer_y * weight
    return math.max(-max_force, math.min(max_force, force))
end

function force_flee(x, y, tx, ty, weight, max_force, radius_sq)
    local dx, dy = x - tx, y - ty
    local dist2 = dx * dx + dy * dy
    if dist2 == 0 or dist2 > radius_sq then return 0, 0 end
    local dist = math.sqrt(dist2)
    return (dx / dist) * weight * max_force, (dy / dist) * weight * max_force
end

function force_wander(id, x, y, vx, vy, weight, max_force, cfg)
    local circle_dist = cfg.circle_distance
    local circle_radius = cfg.circle_radius
    local tx = x + vx * circle_dist
    local ty = y + vy * circle_dist
    local wt = get_wander_target(id, x, y, cfg)
    wt.x = wt.x + random_float(-1, 1) * cfg.change_interval
    wt.y = wt.y + random_float(-1, 1) * cfg.change_interval
    local wx, wy = normalize(wt.x, wt.y)
    wt.x = wx
    wt.y = wy
    local target_x = tx + wx * circle_radius
    local target_y = ty + wy * circle_radius
    return force_seek(x, y, target_x, target_y, weight, max_force)
end

function force_separate(x, y, neighbors, radius_sq, weight, max_force)
    local sx, sy = 0, 0
    for _, n in ipairs(neighbors) do
        if n.alive then
            local dx, dy = x - n.x, y - n.depth
            local dist2 = dx * dx + dy * dy
            if dist2 > 0 and dist2 < radius_sq then
                local dist = math.sqrt(dist2)
                sx = sx + (dx / dist) / dist
                sy = sy + (dy / dist) / dist
            end
        end
    end
    if sx == 0 and sy == 0 then return 0, 0 end
    local nx, ny = normalize(sx, sy)
    return nx * weight * max_force, ny * weight * max_force
end

function force_align(x, y, neighbors, radius_sq, weight, max_force)
    local avx, avy, count = 0, 0, 0
    for _, n in ipairs(neighbors) do
        if n.alive then
            local dx, dy = x - n.x, y - n.depth
            local dist2 = dx * dx + dy * dy
            if dist2 > 0 and dist2 < radius_sq then
                avx = avx + n.vx
                avy = avy + n.vd
                count = count + 1
            end
        end
    end
    if count == 0 then return 0, 0 end
    avx = avx / count
    avy = avy / count
    local nx, ny = normalize(avx, avy)
    return nx * weight * max_force, ny * weight * max_force
end

function force_cohere(x, y, neighbors, radius_sq, weight, max_force)
    local sx, sy, count = 0, 0, 0
    for _, n in ipairs(neighbors) do
        if n.alive then
            local dx, dy = x - n.x, y - n.depth
            local dist2 = dx * dx + dy * dy
            if dist2 > 0 and dist2 < radius_sq then
                sx = sx + n.x
                sy = sy + n.depth
                count = count + 1
            end
        end
    end
    if count == 0 then return 0, 0 end
    local centroid_x, centroid_y = sx / count, sy / count
    return force_seek(x, y, centroid_x, centroid_y, weight, max_force)
end

function compute_fish_forces(f, st, hash)
    local data = st.data
    local weights = data.steering_weights.fish
    local cfg = data.creatures.fish
    local fx, fy = 0, 0

    -- seek nearest live, safe algae nodule
    local max_safe_rate = cfg.max_safe_cold_rate
    local nearest_nodule, nearest_dist2 = nil, cfg.perception.algae * cfg.perception.algae
    for _, core in ipairs(st.algae) do
        for _, n in ipairs(core.nodules) do
            if n.live then
                local nodule_danger = compute_fish_cold_rate(n.depth, data)
                if nodule_danger <= max_safe_rate then
                    local d2 = dist2(f.x, f.depth, n.x, n.depth)
                    if d2 < nearest_dist2 then
                        nearest_dist2 = d2
                        nearest_nodule = n
                    end
                end
            end
        end
    end
    if nearest_nodule then
        local sr = stopping_radius(f.max_speed, f.max_force, 1.3)
        sr = math.min(sr, cfg.perception.algae)
        local sx, sy = force_arrive(f.x, f.depth, f.vx, f.vd, nearest_nodule.x, nearest_nodule.depth, weights.seek_algae, f.max_speed, f.max_force, sr, 0)
        fx, fy = fx + sx, fy + sy
    end

    -- flee nearest shark
    local nearest_shark, shark_dist2 = nil, cfg.perception.shark * cfg.perception.shark
    for _, s in ipairs(st.sharks) do
        if s.alive then
            local d2 = dist2(f.x, f.depth, s.x, s.depth)
            if d2 < shark_dist2 then
                shark_dist2 = d2
                nearest_shark = s
            end
        end
    end
    if nearest_shark then
        local flx, fly = force_flee(f.x, f.depth, nearest_shark.x, nearest_shark.depth, weights.flee_shark, f.max_force, shark_dist2)
        fx, fy = fx + flx, fy + fly
    end

    -- boids forces: separate, align, cohere share the same neighbor source and school radius
    local others
    if hash then
        local bw = data.spatial_hash.bucket_width
        local bd = data.spatial_hash.bucket_depth
        local bx = math.floor(f.x / bw) % math.ceil(st.world.width / bw)
        local by = math.floor(f.depth / bd) % math.ceil(st.world.height / bd)
        others = get_nearby(hash, bx, by, "fish")
    else
        others = st.fish
    end
    local school_radius_sq = cfg.perception.school * cfg.perception.school
    local sep_x, sep_y = force_separate(f.x, f.depth, others, school_radius_sq, weights.separate, f.max_force)
    fx, fy = fx + sep_x, fy + sep_y

    local align_x, align_y = force_align(f.x, f.depth, others, school_radius_sq, weights.align, f.max_force)
    fx, fy = fx + align_x, fy + align_y

    local cohere_x, cohere_y = force_cohere(f.x, f.depth, others, school_radius_sq, weights.cohere, f.max_force)
    fx, fy = fx + cohere_x, fy + cohere_y

    -- depth arrival: return to and settle at the fish's home depth
    local home_bias = force_depth_arrive(f.depth, f.vd, cfg.home_depth, weights.depth_bias, f.max_speed, f.max_force, 300)
    fy = fy + home_bias

    -- wander
    local wx, wy = force_wander(f.id, f.x, f.depth, f.vx, f.vd, weights.wander, f.max_force, data.wander)
    fx, fy = fx + wx, fy + wy

    return fx, fy
end

function compute_shark_forces(s, st, hash)
    local data = st.data
    local weights = data.steering_weights.shark
    local cfg = data.creatures.shark

    -- Hysteresis: enter retreat at exposure_retreat_threshold, only exit
    -- once exposure drops below exposure_retreat_resume_threshold. Between
    -- the two, the previous state persists (sticky).
    if s.exposure >= cfg.exposure_retreat_threshold then
        s.in_retreat = true
    elseif s.exposure < cfg.exposure_retreat_resume_threshold then
        s.in_retreat = false
    end

    if s.in_retreat then
        -- PRIORITY OVERRIDE: full commitment to retreat, no pursuit.
        local retreat_ratio = (s.exposure - cfg.exposure_retreat_resume_threshold)
            / (cfg.exposure.threshold - cfg.exposure_retreat_resume_threshold)
        retreat_ratio = math.max(math.min(retreat_ratio, 1.0), 0.3)
        local retreat_force = cfg.exposure_retreat_weight * s.max_force * retreat_ratio
        return 0, retreat_force
    end

    local fx, fy = 0, 0

    local nearest_fish, fish_dist2 = nil, cfg.perception.fish * cfg.perception.fish
    for _, f in ipairs(st.fish) do
        if f.alive then
            local d2 = dist2(s.x, s.depth, f.x, f.depth)
            if d2 < fish_dist2 then
                fish_dist2 = d2
                nearest_fish = f
            end
        end
    end

    local nearest_chunk, chunk_dist2 = nil, cfg.perception.flesh * cfg.perception.flesh
    for _, c in ipairs(st.chunks) do
        local d2 = dist2(s.x, s.depth, c.x, c.depth)
        if d2 < chunk_dist2 then
            chunk_dist2 = d2
            nearest_chunk = c
        end
    end

    if nearest_fish and (not nearest_chunk or fish_dist2 < chunk_dist2) then
        local sr = stopping_radius(s.max_speed, s.max_force, 1.3)
        sr = math.min(sr, cfg.perception.fish)
        local min_speed = s.max_speed
        local sx, sy = force_arrive(s.x, s.depth, s.vx, s.vd, nearest_fish.x, nearest_fish.depth, weights.seek_fish, s.max_speed, s.max_force, sr, min_speed)
        fx, fy = fx + sx, fy + sy
    elseif nearest_chunk then
        local sr = stopping_radius(s.max_speed, s.max_force, 1.3)
        sr = math.min(sr, cfg.perception.flesh)
        local min_speed = data.flesh_chunk.sink_rate
        if s.max_speed * 0.3 > min_speed then
            min_speed = s.max_speed * 0.3
        end
        local sx, sy = force_arrive(s.x, s.depth, s.vx, s.vd, nearest_chunk.x, nearest_chunk.depth, weights.seek_flesh, s.max_speed, s.max_force, sr, min_speed)
        fx, fy = fx + sx, fy + sy
    else
        local wx, wy = force_wander(s.id, s.x, s.depth, s.vx, s.vd, weights.wander, s.max_force, data.wander)
        fx, fy = fx + wx, fy + wy

        local home_bias = force_depth_arrive(s.depth, s.vd, cfg.home_depth, cfg.home_bias_weight, s.max_speed, s.max_force, 300)
        fy = fy + home_bias
    end

    return fx, fy
end

function compute_exposure_rate(depth, data)
    local bands = data.depth_bands
    for i = 1, #bands do
        if depth <= bands[i].bottom then
            if i == 1 then
                return bands[i].exposure_rate
            else
                local prev = bands[i - 1]
                local t = (depth - prev.bottom) / (bands[i].bottom - prev.bottom)
                return lerp(prev.exposure_rate, bands[i].exposure_rate, t)
            end
        end
    end
    return bands[#bands].exposure_rate
end
`,Tp=`-- shoal/utils.lua — shared math helpers

function clamp(val, min, max)
    return math.max(min, math.min(max, val))
end

function wrap(val, max)
    local w = val % max
    if w < 0 then w = w + max end
    return w
end

function wrap_x(x, world)
    return wrap(x, world.width)
end

function clamp_depth(d, world)
    return clamp(d, world.surface_depth, world.floor_depth)
end

function dist2(ax, ay, bx, by)
    local dx, dy = ax - bx, ay - by
    return dx * dx + dy * dy
end

function distance(ax, ay, bx, by)
    return math.sqrt(dist2(ax, ay, bx, by))
end

function normalize(vx, vy)
    local m = math.sqrt(vx * vx + vy * vy)
    if m == 0 then return 0, 0 end
    return vx / m, vy / m
end

function limit_vector(vx, vy, max)
    local m2 = vx * vx + vy * vy
    if m2 > max * max then
        local m = math.sqrt(m2)
        return vx / m * max, vy / m * max
    end
    return vx, vy
end

function lerp(a, b, t)
    return a + (b - a) * clamp(t, 0, 1)
end

function uid(prefix)
    GAME_STATE.next_id = (GAME_STATE.next_id or 1) + 1
    return prefix .. "_" .. GAME_STATE.next_id
end

function random_float(a, b)
    return a + math.random() * (b - a)
end

function random_choice(list)
    return list[math.random(1, #list)]
end

local function hue_to_rgb(p, q, t)
    if t < 0 then t = t + 1 end
    if t > 1 then t = t - 1 end
    if t < 1/6 then return p + (q - p) * 6 * t end
    if t < 1/2 then return q end
    if t < 2/3 then return p + (q - p) * (2/3 - t) * 6 end
    return p
end

local RESERVED_COLORS = {
    {234, 179, 8},    -- core yellow #eab308
    {16, 185, 129},   -- nodule green #10b981
    {244, 63, 94},    -- chunk red #f43f5e
    {125, 211, 252},  -- background stop #7dd3fc
    {56, 189, 248},   -- background stop #38bdf8
    {14, 165, 233},   -- background stop #0ea5e9
    {3, 105, 161},    -- background stop #0369a1
    {12, 74, 110},    -- background stop #0c4a6e
}
local MIN_COLOR_DISTANCE = 55
local LIVE_MIN_DISTANCE = 30

local function color_distance(r1, g1, b1, r2, g2, b2)
    local dr, dg, db = r1 - r2, g1 - g2, b1 - b2
    return math.sqrt(dr * dr + dg * dg + db * db)
end

local function is_too_close(r, g, b)
    for _, rc in ipairs(RESERVED_COLORS) do
        if color_distance(r, g, b, rc[1], rc[2], rc[3]) < MIN_COLOR_DISTANCE then
            return true
        end
    end
    return false
end

function hex_to_rgb(hex)
    local r = tonumber(hex:sub(2, 3), 16)
    local g = tonumber(hex:sub(4, 5), 16)
    local b = tonumber(hex:sub(6, 7), 16)
    return r, g, b
end

local function is_too_close_to_live(r, g, b, live_colors)
    if not live_colors then return false end
    for _, hex in ipairs(live_colors) do
        local lr, lg, lb = hex_to_rgb(hex)
        if color_distance(r, g, b, lr, lg, lb) < LIVE_MIN_DISTANCE then
            return true
        end
    end
    return false
end

function hsl_to_rgb(h, s, l)
    h = h / 360
    local r, g, b
    if s == 0 then
        r, g, b = l, l, l
    else
        local q = l < 0.5 and l * (1 + s) or l + s - l * s
        local p = 2 * l - q
        r = hue_to_rgb(p, q, h + 1/3)
        g = hue_to_rgb(p, q, h)
        b = hue_to_rgb(p, q, h - 1/3)
    end
    return math.floor(r * 255), math.floor(g * 255), math.floor(b * 255)
end

function rgb_to_hex(r, g, b)
    return string.format("#%02x%02x%02x", r, g, b)
end

function hsl_to_hex(h, s, l)
    return rgb_to_hex(hsl_to_rgb(h, s, l))
end

local function extract_numeric_id(id)
    local num = id:match("_(%d+)$")
    return num and tonumber(num) or 0
end

local function hash_numeric(n)
    -- Knuth multiplicative hash — scatters sequential integers hard,
    -- unlike a rolling character hash on a shared-prefix string.
    return (n * 2654435761) % 1000000007
end

function generate_procedural_color(id, live_colors)
    local numeric_id = extract_numeric_id(id)
    local hash = hash_numeric(numeric_id)

    local hue = (hash % 3600) / 10
    local jitter_hash = math.floor(hash / 3600) % 1000
    local jitter_t = jitter_hash / 1000
    local saturation = 0.5 + 0.3 * jitter_t
    local lightness = 0.45 + 0.25 * (1 - jitter_t)

    -- First try the coarse 40° nudges from the directive.
    for attempt = 0, 8 do
        local try_hue = (hue + attempt * 40) % 360
        local r, g, b = hsl_to_rgb(try_hue, saturation, lightness)
        if not is_too_close(r, g, b) and not is_too_close_to_live(r, g, b, live_colors) then
            return rgb_to_hex(r, g, b)
        end
    end

    -- If the coarse nudges are all blocked, do a fine sweep across the wheel
    -- before ever falling back — a reserved-color collision is unacceptable.
    for attempt = 1, 360 do
        local try_hue = (hue + attempt) % 360
        local r, g, b = hsl_to_rgb(try_hue, saturation, lightness)
        if not is_too_close(r, g, b) and not is_too_close_to_live(r, g, b, live_colors) then
            return rgb_to_hex(r, g, b)
        end
    end

    -- Extremely rare: even the whole wheel is blocked by live colors. Return a
    -- neutral gray that is guaranteed outside the reserved-color spheres.
    return rgb_to_hex(128, 128, 128)
end
`,Ep=`-- logic.lua — SlimeCoin game logic
-- Real-time coin pusher with shooter, two-layer board, and chip synergies

-- ── Global State ─────────────────────────────────────────────────────────────

GAME_STATE = {
  -- Round state
  round = 1,
  total_rounds = 15,
  score = 0,
  target_score = 100,
  score_rate = 1.0,
  hand_in = 10,
  max_hand_in = 10,
  
  -- Shooter state
  shooter_aim = 0.0,  -- -1.0 to 1.0 (left to right)
  pocket_coin_type = nil,
  
  -- Pusher state
  pusher_phase = 0.0,  -- sinusoidal phase
  pusher_speed = 1.0,
  
  -- Coins on shelf (upper layer)
  shelf_coins = {},  -- {id, type_id, x, y, vx, vy, mass, radius, value}
  
  -- Coins on floor (lower layer)
  floor_coins = {},  -- {id, type_id, x, y, vx, vy, mass, radius, value}

  -- v0.3: Vat layer (collection tray)
  vat_coins = {},  -- {id, type_id, x, y, value} for visual fill

  -- v0.3: Slime pool (weighted types for shot queue)
  slime_pool = {},  -- {type_id, weight}

  -- v0.3: Shot queue (next N slimes to fire)
  shot_queue = {},  -- ordered list of type_ids

  -- v0.3: Tokens (currency)
  tokens = 0,

  -- v0.3: Exchange tracking
  exchanges_used = 0,  -- resets per round

  -- v0.3: Active synergies (from owned cards)
  active_synergies = {},  -- {type_a, type_b, effect_id}

  -- Obstacles on shelf
  obstacles = {},  -- {id, type_id, x, y, hits_remaining}
  
  -- Chip cards owned this run
  owned_chips = {},  -- {card_id}
  
  -- Pocket coins available
  pocket_coins = {},  -- {type_id, count}
  
  -- Round modifiers
  active_modifiers = {},  -- {modifier_id}
  
  -- Combo tracking
  combo_count = 0,
  combo_timer = 0,
  last_score_time = 0,
  
  -- Game phase: 'playing', 'card_select', 'run_end'
  phase = 'playing',
  
  -- Card selection state
  offered_cards = {},  -- {card_id, name, rarity, description}
  selected_card = nil,
}

-- ── Constants ───────────────────────────────────────────────────────────────

local BOARD = {
  shelf_width = 400,
  shelf_height = 200,
  shelf_depth = 100,
  floor_width = 400,
  floor_height = 150,
  shooter_x = 200,
  shooter_y = 450,
  pusher_amplitude = 50,
  pusher_frequency = 1.0,
  shelf_gravity = 0.0,  -- No gravity on shelf - pusher provides all movement
  floor_gravity = 500.0,  -- Normal gravity on floor for landing
  friction = 0.96,
  restitution = 0.15,
}

local SLIME_TYPES = {
  basic = {mass = 1.0, radius = 14, value = 1},
  heavy = {mass = 2.2, radius = 16, value = 3},
  light = {mass = 0.8, radius = 13, value = 5},
  sticky = {mass = 1.5, radius = 15, value = 10},
  dense = {mass = 3.5, radius = 18, value = 15},
  rare = {mass = 1.8, radius = 17, value = 25},
  bad = {mass = 1.0, radius = 14, value = -5},
}

local POCKET_EFFECTS = {
  boom = {radius = 60, force = 300},
  pull = {radius = 100, force = 200},
  echo = {hand_bonus = 5},
  giga = {mass_mult = 10, size_mult = 3},
}

-- ── Helper Functions ─────────────────────────────────────────────────────────

local function distance(x1, y1, x2, y2)
  return math.sqrt((x2 - x1)^2 + (y2 - y1)^2)
end

local function next_id()
  GAME_STATE._next_id = (GAME_STATE._next_id or 0) + 1
  return GAME_STATE._next_id
end

-- v0.3: Weighted random draw from slime pool
local function draw_from_pool()
  local pool = GAME_STATE.slime_pool
  if #pool == 0 then
    return 'basic'  -- fallback
  end

  -- Calculate total weight
  local total_weight = 0
  for _, entry in pairs(pool) do
    total_weight = total_weight + entry.weight
  end

  -- Weighted random selection
  local roll = math.random() * total_weight
  local cumulative = 0
  for _, entry in pairs(pool) do
    cumulative = cumulative + entry.weight
    if roll <= cumulative then
      return entry.type_id
    end
  end

  return pool[1].type_id  -- fallback
end

-- ── Initialization ─────────────────────────────────────────────────────────

function init_game(config)
  config = config or {}
  
  -- Reset state
  GAME_STATE.round = 1
  GAME_STATE.score = 0
  GAME_STATE.score_rate = 1.0
  GAME_STATE.hand_in = 10
  GAME_STATE.max_hand_in = 10
  GAME_STATE.shelf_coins = {}
  GAME_STATE.floor_coins = {}
  GAME_STATE.obstacles = {}
  GAME_STATE.owned_chips = {}
  GAME_STATE.pocket_coins = {
    boom = 1,
    pull = 1,
    echo = 1,
    giga = 0,
  }
  GAME_STATE.active_modifiers = {}
  GAME_STATE.combo_count = 0
  GAME_STATE.combo_timer = 0
  GAME_STATE.last_score_time = 0
  GAME_STATE.phase = 'playing'
  GAME_STATE._next_id = 0

  -- v0.3: Initialize slime pool (starting pool from data.yaml)
  GAME_STATE.slime_pool = {
    {type_id = 'basic', weight = 5},
    {type_id = 'heavy', weight = 2},
    {type_id = 'light', weight = 2},
  }

  -- v0.3: Initialize shot queue (5 pre-drawn types)
  GAME_STATE.shot_queue = {}
  for i = 1, 5 do
    table.insert(GAME_STATE.shot_queue, draw_from_pool())
  end

  -- v0.3: Initialize tokens and vat
  GAME_STATE.tokens = 0
  GAME_STATE.vat_coins = {}
  GAME_STATE.exchanges_used = 0
  GAME_STATE.active_synergies = {}
  
  -- Set target score for round 1
  GAME_STATE.target_score = 100
  
  -- Add initial obstacles
  GAME_STATE.obstacles = {
    {id = next_id(), type_id = 'peg', x = 100, y = 100, hits_remaining = 999},
    {id = next_id(), type_id = 'peg', x = 300, y = 100, hits_remaining = 999},
  }

  -- Populate starting shelf (8 rows × 10 cols = 80 coins)
  local start_types = {'basic', 'basic', 'basic', 'heavy', 'light', 'sticky', 'dense', 'rare'}
  for row = 0, 7 do
    for col = 0, 9 do
      local idx = (row * 10 + col) % 8 + 1
      local type_id = start_types[idx]
      local slime = SLIME_TYPES[type_id]
      table.insert(GAME_STATE.shelf_coins, {
        id = next_id(),
        type_id = type_id,
        x = 15 + col * 38,
        y = 20 + row * 30,
        vx = 0,
        vy = 0,
        mass = slime.mass,
        radius = slime.radius,
        value = slime.value,
      })
    end
  end
  
  return {success = true}
end

-- ── Round Management ───────────────────────────────────────────────────────

function start_round(round_num)
  GAME_STATE.round = round_num
  GAME_STATE.score_rate = 1.0
  GAME_STATE.hand_in = GAME_STATE.max_hand_in
  GAME_STATE.combo_count = 0
  GAME_STATE.combo_timer = 0
  
  -- Calculate target score
  GAME_STATE.target_score = math.floor(100 * (1.5 ^ (round_num - 1)))
  
  -- Increase pusher speed
  GAME_STATE.pusher_speed = 1.0 + (round_num - 1) * 0.1

  -- v0.3: Clear shelf for new round, but floor persists
  GAME_STATE.shelf_coins = {}
  -- floor_coins NOT cleared - persists across rounds

  -- v0.3: Reset exchange counter for new round
  GAME_STATE.exchanges_used = 0

  -- Apply round modifiers
  GAME_STATE.active_modifiers = {}
  if round_num % 5 == 0 then
    table.insert(GAME_STATE.active_modifiers, 'bad_coins')
  end
  
  return {round = round_num, target = GAME_STATE.target_score}
end

function end_round()
  -- Check if target met
  local target_met = GAME_STATE.score >= GAME_STATE.target_score
  
  -- Offer chip cards
  GAME_STATE.phase = 'card_select'
  GAME_STATE.offered_cards = generate_card_offer(3)
  
  return {
    round = GAME_STATE.round,
    score = GAME_STATE.score,
    target = GAME_STATE.target_score,
    target_met = target_met,
    offered_cards = GAME_STATE.offered_cards,
  }
end

function select_card(card_id)
  table.insert(GAME_STATE.owned_chips, card_id)
  GAME_STATE.selected_card = card_id
  GAME_STATE.phase = 'playing'
  
  -- Advance to next round
  if GAME_STATE.round < GAME_STATE.total_rounds then
    start_round(GAME_STATE.round + 1)
  else
    GAME_STATE.phase = 'run_end'
  end
  
  return {card_id = card_id, next_round = GAME_STATE.round}
end

-- ── Card System ────────────────────────────────────────────────────────────

function generate_card_offer(count)
  -- Simplified: return random cards from pool
  local card_pool = {
    {id = 'zombie_slime', name = 'Zombie Slime', rarity = 'epic', description = 'Converts adjacent coins'},
    {id = 'crystal_burst', name = 'Crystal Burst', rarity = 'rare', description = 'Multiplies adjacent value'},
    {id = 'heavy_impact', name = 'Heavy Impact', rarity = 'common', description = 'Shockwave on landing'},
    {id = 'bubble_chain', name = 'Bubble Chain', rarity = 'rare', description = 'Chain pop bonus'},
    {id = 'tar_cluster', name = 'Tar Cluster', rarity = 'common', description = 'Cluster bonus'},
    {id = 'iron_path', name = 'Iron Path', rarity = 'rare', description = 'Wider path clear'},
  }

  local offer = {}
  for i = 1, count do
    local idx = math.random(1, #card_pool)
    table.insert(offer, card_pool[idx])
  end

  return offer
end

-- v0.3: Exchange function (mid-round token spend for more shots)
function exchange()
  -- Check limits
  if GAME_STATE.exchanges_used >= 3 then
    return {error = 'Max exchanges reached this round'}
  end

  local base_cost = 5
  local cost_growth = 1.5
  local cost = math.floor(base_cost * math.pow(cost_growth, GAME_STATE.exchanges_used))

  if GAME_STATE.tokens < cost then
    return {error = 'Insufficient tokens'}
  end

  -- Perform exchange
  GAME_STATE.tokens = GAME_STATE.tokens - cost
  GAME_STATE.hand_in = GAME_STATE.hand_in + 5
  GAME_STATE.exchanges_used = GAME_STATE.exchanges_used + 1

  return {
    success = true,
    cost = cost,
    shots_added = 5,
    hand_in = GAME_STATE.hand_in,
    tokens = GAME_STATE.tokens,
    exchanges_used = GAME_STATE.exchanges_used,
  }
end

-- v0.3: Shop function (end-of-round token spend)
function shop_purchase(item_type, item_id)
  local cost = 0

  if item_type == 'hand_upgrade' then
    cost = 20
    if GAME_STATE.tokens < cost then
      return {error = 'Insufficient tokens'}
    end
    GAME_STATE.tokens = GAME_STATE.tokens - cost
    GAME_STATE.max_hand_in = GAME_STATE.max_hand_in + 2
    return {success = true, cost = cost, max_hand_in = GAME_STATE.max_hand_in, tokens = GAME_STATE.tokens}
  elseif item_type == 'pocket_coin' then
    cost = 10
    if GAME_STATE.tokens < cost then
      return {error = 'Insufficient tokens'}
    end
    GAME_STATE.tokens = GAME_STATE.tokens - cost
    GAME_STATE.pocket_coins[item_id] = (GAME_STATE.pocket_coins[item_id] or 0) + 1
    return {success = true, cost = cost, pocket_coins = GAME_STATE.pocket_coins, tokens = GAME_STATE.tokens}
  elseif item_type == 'card' then
    cost = 15
    if GAME_STATE.tokens < cost then
      return {error = 'Insufficient tokens'}
    end
    GAME_STATE.tokens = GAME_STATE.tokens - cost
    table.insert(GAME_STATE.owned_chips, item_id)
    return {success = true, cost = cost, owned_chips = GAME_STATE.owned_chips, tokens = GAME_STATE.tokens}
  else
    return {error = 'Unknown item type'}
  end
end

-- ── Shooter Mechanics ───────────────────────────────────────────────────────

function fire_coin(type_id, side)
  if GAME_STATE.hand_in <= 0 then
    return {error = 'No hand in remaining'}
  end

  -- v0.3: Use shot queue for type_id if not provided (pocket coins override)
  if not type_id or type_id == '' then
    if #GAME_STATE.shot_queue > 0 then
      type_id = table.remove(GAME_STATE.shot_queue, 1)
    else
      type_id = 'basic'  -- fallback
    end
  end

  local slime = SLIME_TYPES[type_id] or SLIME_TYPES.basic

  local spawn_x, vx
  if side == 'left' then
    -- Left arrow → right-side shooter → coin travels LEFT
    spawn_x = BOARD.shelf_width - 20
    vx = -280
  else
    -- Right arrow → left-side shooter → coin travels RIGHT
    spawn_x = 20
    vx = 280
  end

  local coin = {
    id = next_id(),
    type_id = type_id,
    x = spawn_x,
    y = 15,
    vx = vx,
    vy = 80,
    mass = slime.mass,
    radius = slime.radius,
    value = slime.value,
  }

  table.insert(GAME_STATE.shelf_coins, coin)
  GAME_STATE.hand_in = GAME_STATE.hand_in - 1

  -- v0.3: Refill shot queue to maintain 5 pre-drawn types
  while #GAME_STATE.shot_queue < 5 do
    table.insert(GAME_STATE.shot_queue, draw_from_pool())
  end

  -- Pocket coin effects
  if type_id == 'echo' then
    GAME_STATE.hand_in = GAME_STATE.hand_in + 5
  elseif type_id == 'giga' then
    coin.mass = coin.mass * 10
    coin.radius = coin.radius * 3
  end

  return {coin_id = coin.id, hand_in = GAME_STATE.hand_in}
end

function trigger_pocket_boom(coin)
  local effect = POCKET_EFFECTS.boom
  local shelf_coins = copy_entity(GAME_STATE.shelf_coins)
  
  for _, other in pairs(shelf_coins) do
    if other.id ~= coin.id then
      local d = distance(coin.x, coin.y, other.x, other.y)
      if d < effect.radius then
        -- Launch forward
        other.vx = other.vx + effect.force
        other.vy = other.vy - 100
      end
    end
  end
end

-- ── Physics: Shelf Layer ───────────────────────────────────────────────────

function update_shelf_physics(dt)
  local shelf_coins = copy_entity(GAME_STATE.shelf_coins)
  local obstacles = copy_entity(GAME_STATE.obstacles)
  
  -- Update pusher phase
  GAME_STATE.pusher_phase = GAME_STATE.pusher_phase + dt * GAME_STATE.pusher_speed * BOARD.pusher_frequency
  local pusher_x = BOARD.shelf_width / 2 + math.sin(GAME_STATE.pusher_phase) * BOARD.pusher_amplitude
  
  -- Update coin positions
  for _, coin in pairs(shelf_coins) do
    -- Apply gravity (shelf has no gravity - pusher provides movement)
    coin.vy = coin.vy + BOARD.shelf_gravity * dt

    -- Apply friction
    coin.vx = coin.vx * BOARD.friction
    coin.vy = coin.vy * BOARD.friction
    
    -- Update position
    coin.x = coin.x + coin.vx * dt
    coin.y = coin.y + coin.vy * dt
    
    -- Wall collisions
    if coin.x < coin.radius then
      coin.x = coin.radius
      coin.vx = -coin.vx * BOARD.restitution
    elseif coin.x > BOARD.shelf_width - coin.radius then
      coin.x = BOARD.shelf_width - coin.radius
      coin.vx = -coin.vx * BOARD.restitution
    end
    
    if coin.y < coin.radius then
      coin.y = coin.radius
      coin.vy = -coin.vy * BOARD.restitution
    end
    
    -- Obstacle collisions
    for _, obs in pairs(obstacles) do
      local d = distance(coin.x, coin.y, obs.x, obs.y)
      if d < coin.radius + 10 then  -- 10 is obstacle radius
        -- Bounce
        local dx = coin.x - obs.x
        local dy = coin.y - obs.y
        local len = math.sqrt(dx*dx + dy*dy)
        if len > 0 then
          dx, dy = dx/len, dy/len
          coin.vx = coin.vx + dx * 100
          coin.vy = coin.vy + dy * 100
        end

        -- Check for slime tower collapse
        if obs.type_id == 'slime_tower' then
          obs.hits_remaining = (obs.hits_remaining or 3) - 1
          if obs.hits_remaining <= 0 then
            -- Remove obstacle and scatter coins
            obs.hits_remaining = 0
          end
        end
      end
    end

    -- Coin-to-coin collision on shelf (6 iterations for proper stacking)
    for iter = 1, 6 do
      for _, other in pairs(shelf_coins) do
        if other.id ~= coin.id then
          local d = distance(coin.x, coin.y, other.x, other.y)
          local min_dist = coin.radius + other.radius
          if d < min_dist and d > 0 then
            -- Position correction (separate overlapping coins)
            local overlap = min_dist - d
            local dx = (coin.x - other.x) / d
            local dy = (coin.y - other.y) / d

            -- Move coins apart proportional to inverse mass
            local total_mass = coin.mass + other.mass
            local coin_ratio = other.mass / total_mass
            local other_ratio = coin.mass / total_mass

            coin.x = coin.x + dx * overlap * coin_ratio
            coin.y = coin.y + dy * overlap * coin_ratio
            other.x = other.x - dx * overlap * other_ratio
            other.y = other.y - dy * overlap * other_ratio

            -- Elastic collision response
            local rel_vx = coin.vx - other.vx
            local rel_vy = coin.vy - other.vy
            local rel_v_dot_n = rel_vx * dx + rel_vy * dy

            if rel_v_dot_n < 0 then
              local impulse = 2 * rel_v_dot_n / total_mass
              local damping = 0.3
              coin.vx = coin.vx - impulse * other.mass * dx * damping
              coin.vy = coin.vy - impulse * other.mass * dy * damping
              other.vx = other.vx + impulse * coin.mass * dx * damping
              other.vy = other.vy + impulse * coin.mass * dy * damping
            end
          end
        end
      end
    end
    
    -- Pusher collision
    local pusher_y = 50  -- Pusher is at back of shelf
    if math.abs(coin.x - pusher_x) < 30 and math.abs(coin.y - pusher_y) < 20 then
      coin.vx = coin.vx + 50  -- Push forward
    end
    
    -- Check for fall off shelf edge
    if coin.y > BOARD.shelf_height then
      -- Transition to floor
      transition_to_floor(coin)
    end
  end
  
  -- Remove coins that fell
  GAME_STATE.shelf_coins = {}
  for _, coin in pairs(shelf_coins) do
    if coin.y <= BOARD.shelf_height then
      table.insert(GAME_STATE.shelf_coins, coin)
    end
  end
  
  -- Remove collapsed obstacles
  GAME_STATE.obstacles = {}
  for _, obs in pairs(obstacles) do
    if obs.hits_remaining > 0 then
      table.insert(GAME_STATE.obstacles, obs)
    end
  end
end

function transition_to_floor(coin)
  -- Coin falls from shelf to floor - create a copy to avoid shared reference
  local floor_coin = {
    id = coin.id,
    type_id = coin.type_id,
    x = coin.x,
    y = 0,  -- Start at top of floor
    vx = coin.vx,
    vy = 100,  -- Downward velocity
    mass = coin.mass,
    radius = coin.radius,
    value = coin.value,
  }
  table.insert(GAME_STATE.floor_coins, floor_coin)

  -- Trigger landing effects on the floor copy
  trigger_landing_effects(floor_coin)
end

function trigger_landing_effects(coin)
  -- Check for chip synergies
  local slime = SLIME_TYPES[coin.type_id] or SLIME_TYPES.basic
  
  -- Heavy slime: push adjacent coins
  if coin.type_id == 'heavy' then
    local floor_coins = copy_entity(GAME_STATE.floor_coins)
    for _, other in pairs(floor_coins) do
      if other.id ~= coin.id then
        local d = distance(coin.x, coin.y, other.x, other.y)
        if d < coin.radius + other.radius + 20 then
          other.vx = other.vx + 50
        end
      end
    end
  end
  
  -- Light slime: bounce
  if coin.type_id == 'light' then
    coin.vy = -200
  end
  
  -- Bad slime: reduce score rate
  if coin.type_id == 'bad' then
    GAME_STATE.score_rate = math.max(1.0, GAME_STATE.score_rate - 0.5)
  end
end

-- ── Physics: Floor Layer ───────────────────────────────────────────────────

function update_floor_physics(dt)
  local floor_coins = copy_entity(GAME_STATE.floor_coins)
  
  for _, coin in pairs(floor_coins) do
    -- Apply gravity (floor has normal gravity for landing)
    coin.vy = coin.vy + BOARD.floor_gravity * dt

    -- Apply friction (floor has more friction)
    coin.vx = coin.vx * 0.95
    coin.vy = coin.vy * 0.95

    -- Update position
    coin.x = coin.x + coin.vx * dt
    coin.y = coin.y + coin.vy * dt
    
    -- Wall collisions
    if coin.x < coin.radius then
      coin.x = coin.radius
      coin.vx = -coin.vx * 0.5
    elseif coin.x > BOARD.floor_width - coin.radius then
      coin.x = BOARD.floor_width - coin.radius
      coin.vx = -coin.vx * 0.5
    end
    
    if coin.y < coin.radius then
      coin.y = coin.radius
      coin.vy = -coin.vy * 0.5
    elseif coin.y > BOARD.floor_height - coin.radius then
      -- v0.3: Drop into vat (collection tray at front edge)
      -- Score event
      local val = math.floor(coin.value * GAME_STATE.score_rate)
      GAME_STATE.score = GAME_STATE.score + val
      GAME_STATE.combo_count = GAME_STATE.combo_count + 1
      GAME_STATE.combo_timer = 2.0
      if GAME_STATE.combo_count > 10 then
        GAME_STATE.score_rate = 1.0 + (GAME_STATE.combo_count / 20)
      end

      -- Token event (base 1 token, modified by slime type)
      local token_yield = 1
      if coin.type_id == 'rare' then
        token_yield = 8
      elseif coin.type_id == 'dense' then
        token_yield = 5
      elseif coin.type_id == 'sticky' then
        token_yield = 4
      elseif coin.type_id == 'light' then
        token_yield = 3
      elseif coin.type_id == 'heavy' then
        token_yield = 2
      end
      GAME_STATE.tokens = GAME_STATE.tokens + token_yield

      -- Add to vat for visual fill
      table.insert(GAME_STATE.vat_coins, {
        id = coin.id,
        type_id = coin.type_id,
        x = coin.x,
        y = coin.y,
        value = coin.value,
      })

      -- Mark for removal from floor
      coin._collected = true
    end
    
    -- Coin-to-coin collision
    for _, other in pairs(floor_coins) do
      if other.id ~= coin.id then
        local d = distance(coin.x, coin.y, other.x, other.y)
        local min_dist = coin.radius + other.radius
        if d < min_dist and d > 0 then
          -- Position correction (separate overlapping coins)
          local overlap = min_dist - d
          local dx = (coin.x - other.x) / d
          local dy = (coin.y - other.y) / d

          -- Move coins apart proportional to inverse mass
          local total_mass = coin.mass + other.mass
          local coin_ratio = other.mass / total_mass
          local other_ratio = coin.mass / total_mass

          coin.x = coin.x + dx * overlap * coin_ratio
          coin.y = coin.y + dy * overlap * coin_ratio
          other.x = other.x - dx * overlap * other_ratio
          other.y = other.y - dy * overlap * other_ratio

          -- Elastic collision response
          local rel_vx = coin.vx - other.vx
          local rel_vy = coin.vy - other.vy
          local rel_v_dot_n = rel_vx * dx + rel_vy * dy

          if rel_v_dot_n < 0 then
            local impulse = 2 * rel_v_dot_n / total_mass
            local damping = 0.3
            coin.vx = coin.vx - impulse * other.mass * dx * damping
            coin.vy = coin.vy - impulse * other.mass * dy * damping
            other.vx = other.vx + impulse * coin.mass * dx * damping
            other.vy = other.vy + impulse * coin.mass * dy * damping

            -- Trigger chip synergies on contact
            trigger_chip_synergy(coin, other)

            -- v0.3: Check pairwise synergies
            check_pairwise_synergy(coin, other)
          end
        end
      end
    end
  end

  -- Write back: remove collected coins
  GAME_STATE.floor_coins = {}
  for _, coin in pairs(floor_coins) do
    if not coin._collected then
      table.insert(GAME_STATE.floor_coins, coin)
    end
  end
end

function trigger_chip_synergy(coin1, coin2)
  -- Check for owned chip cards and trigger effects
  local owned = copy_entity(GAME_STATE.owned_chips)
  
  for _, card_id in pairs(owned) do
    if card_id == 'zombie_slime' and coin1.type_id == 'basic' then
      -- Convert adjacent to zombie (basic)
      coin2.type_id = 'basic'  -- Simplified: just mark as affected
    elseif card_id == 'crystal_burst' and coin1.type_id == 'rare' then
      -- Multiply adjacent value
      coin2.value = coin2.value * 2
    elseif card_id == 'bubble_chain' and coin1.type_id == 'light' then
      -- Check for chain
      local chain_count = count_adjacent_type(coin2, 'light')
      if chain_count >= 5 then
        -- Pop chain for bonus
        GAME_STATE.score = GAME_STATE.score + chain_count * 10
      end
    end
  end
end

-- v0.3: Check pairwise synergies between two slime types
function check_pairwise_synergy(coin1, coin2)
  local active = GAME_STATE.active_synergies

  for _, synergy in pairs(active) do
    -- Check if this pair matches the synergy (order-independent)
    local match = false
    if (coin1.type_id == synergy.type_a and coin2.type_id == synergy.type_b) or
       (coin1.type_id == synergy.type_b and coin2.type_id == synergy.type_a) then
      match = true
    end

    if match then
      -- Trigger the synergy effect
      trigger_synergy_effect(synergy.effect_id, coin1, coin2)
    end
  end
end

-- v0.3: Trigger specific synergy effects
function trigger_synergy_effect(effect_id, coin1, coin2)
  if effect_id == 'convert_basic_to_zombie' then
    -- Zombie + Basic: convert Basic to Zombie
    if coin1.type_id == 'basic' then
      coin1.type_id = 'zombie'
    elseif coin2.type_id == 'basic' then
      coin2.type_id = 'zombie'
    end
  elseif effect_id == 'double_crystal_tokens' then
    -- Mirror + Crystal: double token yield for both
    GAME_STATE.tokens = GAME_STATE.tokens + 2
  elseif effect_id == 'clear_area' then
    -- Void + Iron: clear 5-radius area
    local floor_coins = copy_entity(GAME_STATE.floor_coins)
    for _, other in pairs(floor_coins) do
      if other.id ~= coin1.id and other.id ~= coin2.id then
        local d = distance(coin1.x, coin1.y, other.x, other.y)
        if d < 5 then
          other._collected = true
        end
      end
    end
  elseif effect_id == 'launch_to_shelf' then
    -- Spark + Bubble: launch both back to shelf
    coin1.y = 50
    coin1.vy = -200
    coin2.y = 50
    coin2.vy = -200
  end
end

function count_adjacent_type(coin, type_id)
  local count = 0
  local floor_coins = copy_entity(GAME_STATE.floor_coins)
  
  for _, other in pairs(floor_coins) do
    if other.id ~= coin.id and other.type_id == type_id then
      local d = distance(coin.x, coin.y, other.x, other.y)
      if d < coin.radius + other.radius + 10 then
        count = count + 1
      end
    end
  end
  
  return count
end

-- ── Scoring ───────────────────────────────────────────────────────────────

function update_scoring(dt)
  local current_time = GAME_STATE._time or 0
  GAME_STATE._time = current_time + dt

  -- Decay combo timer and reset combo when expired
  if GAME_STATE.combo_timer > 0 then
    GAME_STATE.combo_timer = GAME_STATE.combo_timer - dt
    if GAME_STATE.combo_timer <= 0 then
      GAME_STATE.combo_count = 0
      GAME_STATE.score_rate = 1.0
    end
  end
end

-- ── Main Game Loop ─────────────────────────────────────────────────────────

function tick_game(dt, input)
  input = input or {}

  if GAME_STATE.phase ~= 'playing' then
    return {phase = GAME_STATE.phase}
  end

  -- Handle fire input — one coin per keypress (fire resets each tick in TS)
  if input.fire then
    local coin_type = input.pocket_coin_type or 'basic'
    local side = input.side or 'right'
    fire_coin(coin_type, side)
  end

  -- Update physics
  update_shelf_physics(dt)
  update_floor_physics(dt)

  -- Update scoring
  update_scoring(dt)

  -- Check round end
  if GAME_STATE.hand_in <= 0 and #GAME_STATE.shelf_coins == 0 then
    return end_round()
  end

  -- Return render state
  return {
    phase = GAME_STATE.phase,
    round = GAME_STATE.round,
    score = GAME_STATE.score,
    target_score = GAME_STATE.target_score,
    score_rate = GAME_STATE.score_rate,
    hand_in = GAME_STATE.hand_in,
    pusher_phase = GAME_STATE.pusher_phase,
    shelf_coins = copy_entity(GAME_STATE.shelf_coins),
    floor_coins = copy_entity(GAME_STATE.floor_coins),
    obstacles = copy_entity(GAME_STATE.obstacles),
    combo_count = GAME_STATE.combo_count,
    -- v0.3 fields
    shot_queue = copy_entity(GAME_STATE.shot_queue),
    tokens = GAME_STATE.tokens,
    vat_coins = copy_entity(GAME_STATE.vat_coins),
    exchanges_used = GAME_STATE.exchanges_used,
  }
end

-- ── Query Functions ───────────────────────────────────────────────────────

function get_state_summary()
  return {
    phase = GAME_STATE.phase,
    round = GAME_STATE.round,
    total_rounds = GAME_STATE.total_rounds,
    score = GAME_STATE.score,
    target_score = GAME_STATE.target_score,
    score_rate = GAME_STATE.score_rate,
    hand_in = GAME_STATE.hand_in,
    shelf_coin_count = #copy_entity(GAME_STATE.shelf_coins),
    floor_coin_count = #copy_entity(GAME_STATE.floor_coins),
    owned_chips = copy_entity(GAME_STATE.owned_chips),
    combo_count = GAME_STATE.combo_count,
  }
end
`,Lp=`-- Slither Rogue — Collision
-- Fruit eating, segment stealing, venom effects.
-- Depends on: utils.lua, state.lua, physics.lua (_follow)

function _collisions(st)
  local p  = st.player
  local ph = p.segments[1]
  if not ph then return end

  if (p.magnetism_radius or 0) > 0 then
    local pull = 160 + p.magnetism_radius*15
    local mr2  = p.magnetism_radius * p.magnetism_radius
    for _, f in ipairs(st.fruits) do
      if dist2(ph.x, ph.y, f.x, f.y) <= mr2 then
        local ang = atan2(ph.y-f.y, ph.x-f.x)
        f.x = f.x + math.cos(ang)*pull*0.016
        f.y = f.y + math.sin(ang)*pull*0.016
      end
    end
  end

  local new_fruits = {}
  for _, f in ipairs(st.fruits) do
    local eaten = false
    if dist2(ph.x, ph.y, f.x, f.y) < (p.radius+10)^2 then
      st.score = st.score + f.points
      for _ = 1, f.points do
        local last = p.segments[#p.segments]
        p.segments[#p.segments+1] = {
          x=last.x - math.cos(last.angle)*p.radius,
          y=last.y - math.sin(last.angle)*p.radius,
          angle=last.angle,
        }
      end
      st.peak_length = math.max(st.peak_length, #p.segments)
      table.insert(st.events, { type="fruit_eaten", is_golden=f.is_golden,
        score=st.score, current_length=#p.segments, peak_length=st.peak_length })
      eaten = true
    else
      for _, npc in ipairs(st.npcs) do
        local nh = npc.segments[1]
        if dist2(nh.x, nh.y, f.x, f.y) < (npc.radius+10)^2 then
          for _ = 1, f.points do
            local last = npc.segments[#npc.segments]
            npc.segments[#npc.segments+1] = {
              x=last.x - math.cos(last.angle)*npc.radius,
              y=last.y - math.sin(last.angle)*npc.radius,
              angle=last.angle,
            }
          end
          eaten = true; break
        end
      end
    end
    new_fruits[#new_fruits+1] = eaten and spawn_fruit_from_config(st.config) or f
  end
  st.fruits = new_fruits

  for _, npc in ipairs(st.npcs) do
    local nh = npc.segments[1]
    for _, d in ipairs(st.acid_drops) do
      if dist2(nh.x, nh.y, d.x, d.y) < (npc.radius+d.radius)^2 then
        npc.is_slowing = true
        npc.slow_timer = 4.0
      end
    end
  end

  for _, npc in ipairs(st.npcs) do
    local nh = npc.segments[1]
    for j = 2, #p.segments do
      local pj = p.segments[j]
      if dist2(nh.x, nh.y, pj.x, pj.y) < (npc.radius+p.radius)^2 then
        if (p.ghost_tail_count or 0) > 0 and j >= #p.segments - p.ghost_tail_count then
          break
        end
        if (p.shield_charges or 0) > 0 then
          p.shield_charges = p.shield_charges - 1
          p.shield_regen_timer = 0
          npc.angle = (npc.angle + math.pi) % (math.pi*2)
          npc.target_angle = npc.angle
          table.insert(st.events, { type="shield_consumed", charges=p.shield_charges })
          break
        end
        local stolen, new_p = {}, {}
        for k = 1, j-1         do new_p[#new_p+1]   = p.segments[k] end
        for k = j, #p.segments do stolen[#stolen+1]  = p.segments[k] end
        if #new_p < 2 then
          local h = new_p[1]
          new_p[2] = {x=h.x - math.cos(p.angle)*p.radius,
                      y=h.y - math.sin(p.angle)*p.radius, angle=p.angle}
        end
        p.segments = new_p
        for _, seg in ipairs(stolen) do
          local last = npc.segments[#npc.segments]
          npc.segments[#npc.segments+1] = {x=last.x, y=last.y, angle=seg.angle}
        end
        table.insert(st.events, { type="metrics_update",
          current_length=#p.segments, peak_length=st.peak_length, score=st.score })
        npc.angle = (npc.angle + math.pi/2) % (math.pi*2)
        npc.target_angle = npc.angle
        break
      end
    end
  end

  for _, npc in ipairs(st.npcs) do
    for j = 2, #npc.segments do
      local nj = npc.segments[j]
      if dist2(ph.x, ph.y, nj.x, nj.y) < (p.radius+npc.radius)^2 then
        local stolen, new_n = {}, {}
        for k = 1, j-1           do new_n[#new_n+1]  = npc.segments[k] end
        for k = j, #npc.segments do stolen[#stolen+1] = npc.segments[k] end
        if #new_n < 2 then
          local h = new_n[1]
          new_n[2] = {x=h.x - math.cos(npc.angle)*npc.radius,
                      y=h.y - math.sin(npc.angle)*npc.radius, angle=npc.angle}
        end
        npc.segments = new_n
        for _, seg in ipairs(stolen) do
          local last = p.segments[#p.segments]
          p.segments[#p.segments+1] = {x=last.x, y=last.y, angle=seg.angle}
        end
        st.peak_length = math.max(st.peak_length, #p.segments)
        table.insert(st.events, { type="metrics_update",
          current_length=#p.segments, peak_length=st.peak_length, score=st.score })
        p.angle = (p.angle + math.pi/4) % (math.pi*2)
        p.target_angle = p.angle
        break
      end
    end
  end

  for i = 1, #st.npcs do
    local thief = st.npcs[i]
    local th = thief.segments[1]
    for k = 1, #st.npcs do
      if i ~= k then
        local victim = st.npcs[k]
        for j = 2, #victim.segments do
          local vj = victim.segments[j]
          if dist2(th.x, th.y, vj.x, vj.y) < (thief.radius+victim.radius)^2 then
            local stolen, new_v = {}, {}
            for s = 1, j-1             do new_v[#new_v+1]   = victim.segments[s] end
            for s = j, #victim.segments do stolen[#stolen+1] = victim.segments[s] end
            if #new_v < 2 then
              local h = new_v[1]
              new_v[2] = {x=h.x - math.cos(victim.angle)*victim.radius,
                          y=h.y - math.sin(victim.angle)*victim.radius, angle=victim.angle}
            end
            victim.segments = new_v
            for _, seg in ipairs(stolen) do
              local last = thief.segments[#thief.segments]
              thief.segments[#thief.segments+1] = {x=last.x, y=last.y, angle=seg.angle}
            end
            thief.angle = (thief.angle + math.pi/2) % (math.pi*2)
            thief.target_angle = thief.angle
            break
          end
        end
      end
    end
  end
end
`,Sp=`-- Slither Rogue — Game Logic (entry point)
-- tick_game: main loop called once per frame by TypeScript.
-- Discrete helpers: called by TypeScript on specific game events.
-- Depends on: utils.lua, state.lua, physics.lua, collision.lua, render.lua

function tick_game(dt, input)
  if not GAME_STATE then
    return { events = {{ type="error", msg="call init_game first" }} }
  end
  local st = GAME_STATE
  if dt > 0.1 then dt = 0.1 end
  st.events = {}

  if st.time_left <= 0 then return build_render_state(st) end

  st.time_left = math.max(0, st.time_left - dt)
  if st.time_left <= 0 then
    table.insert(st.events, { type="game_over" })
  end

  _update_player(st, dt, input)
  _update_npcs(st, dt)
  _decay_acid_drops(st, dt)
  _collisions(st)

  return build_render_state(st)
end

-- ============================================================
-- DISCRETE HELPERS
-- ============================================================

function check_evolution_trigger(fruits_eaten_since, threshold)
  return (fruits_eaten_since + 1) >= threshold
end

function select_evolution_pool(all_cards, count)
  local pool = {}
  for _, c in ipairs(all_cards) do pool[#pool+1] = c end
  for i = #pool, 2, -1 do
    local j = math.random(1, i)
    pool[i], pool[j] = pool[j], pool[i]
  end
  local out = {}
  for i = 1, math.min(count, #pool) do out[#out+1] = pool[i] end
  return out
end

function calculate_grade(score, thresholds)
  for _, t in ipairs(thresholds) do
    if score >= t.min_score then
      return { title=t.title, description=t.description }
    end
  end
  local last = thresholds[#thresholds]
  return { title=last.title, description=last.description }
end

function spawn_fruit(fruit_config, arena)
  return spawn_fruit_from_config({ fruit=fruit_config, arena=arena })
end

function generate_npc(npc_profiles, npc_stats, arena, index)
  local p   = npc_profiles[(index % #npc_profiles) + 1]
  local r   = npc_stats.min_radius + math.random()*(npc_stats.max_radius-npc_stats.min_radius)
  local spd = npc_stats.min_speed  + math.random()*(npc_stats.max_speed -npc_stats.min_speed)
  local len = npc_stats.min_initial_length +
              math.floor(math.random()*(npc_stats.max_initial_length-npc_stats.min_initial_length+1))
  return {
    name=p.name.." "..(index+1), color=p.color, head_color=p.head_color,
    x=math.random()*(arena.map_width-200)+100,
    y=math.random()*(arena.map_height-200)+100,
    angle=math.random()*math.pi*2,
    speed=spd, radius=r, initial_length=len,
  }
end

function decide_npc_action(npc_head, npc_angle, nearby_fruits, arena)
  local wb = arena.wall_buffer or 120
  if     npc_head.x < wb                    then return 0
  elseif npc_head.x > arena.map_width  - wb then return math.pi
  elseif npc_head.y < wb                    then return math.pi/2
  elseif npc_head.y > arena.map_height - wb then return -math.pi/2
  end
  if nearby_fruits and #nearby_fruits > 0 then
    local nearest, min_d2 = nearby_fruits[1], math.huge
    for _, f in ipairs(nearby_fruits) do
      local d2 = dist2(f.x, f.y, npc_head.x, npc_head.y)
      if d2 < min_d2 then min_d2=d2; nearest=f end
    end
    return atan2(nearest.y-npc_head.y, nearest.x-npc_head.x)
  end
  return npc_angle + (math.random()*1.2 - 0.6)
end

-- Returns a safe summary of GAME_STATE for external inspection.
-- Called by studio_get_state MCP tool.
function get_state_summary()
  if not GAME_STATE then return nil end
  local p = GAME_STATE.player
  local seg_count = 0
  if p and p.segments then
    for _ in ipairs(p.segments) do seg_count = seg_count + 1 end
  end
  return {
    initialized     = true,
    time_left       = GAME_STATE.time_left or 0,
    score           = GAME_STATE.score or 0,
    peak_length     = GAME_STATE.peak_length or 0,
    player_segments = seg_count,
    player_x        = (p and p.segments and p.segments[1]) and p.segments[1].x or 0,
    player_y        = (p and p.segments and p.segments[1]) and p.segments[1].y or 0,
    npc_count       = GAME_STATE.npcs and #GAME_STATE.npcs or 0,
    fruit_count     = GAME_STATE.fruits and #GAME_STATE.fruits or 0,
    acid_drops      = GAME_STATE.acid_drops and #GAME_STATE.acid_drops or 0,
    speed_mult      = GAME_STATE.speed_mult or 1.0,
    events_pending  = GAME_STATE.events and #GAME_STATE.events or 0,
  }
end
`,Op=`-- Slither Rogue — Physics
-- Per-tick movement, segment following, NPC AI, acid decay.
-- Depends on: utils.lua, state.lua

function _update_player(st, dt, input)
  local p, a = st.player, st.config.arena
  local head  = p.segments[1]
  if not head then return end

  if (input.control_type or "mouse") == "mouse" then
    local mx, my = input.mouse_x or 0, input.mouse_y or 0
    if mx*mx + my*my > 225 then
      p.target_angle = atan2(my, mx)
    end
  else
    local k = input.keys or {}
    local dx, dy = 0, 0
    if k.w or k.arrowup    then dy = -1 end
    if k.s or k.arrowdown  then dy =  1 end
    if k.a or k.arrowleft  then dx = -1 end
    if k.d or k.arrowright then dx =  1 end
    if dx ~= 0 or dy ~= 0 then p.target_angle = atan2(dy, dx) end
  end

  local diff = normalize_angle(p.target_angle - p.angle)
  local step = math.min(math.abs(diff), 5.2*dt) * (diff < 0 and -1 or 1)
  p.angle = (p.angle + step) % (math.pi*2)

  local spd = (p.base_speed + st.score*0.8) * (st.speed_mult or 1.0)
  if p.is_slowing then spd = spd * 0.5 end
  if (p.ambush_burst_timer or 0) > 0 then
    spd = spd * (1.3 + (p.ambush_level or 1) * 0.1)  -- 40-50% burst
  end

  head.x = clamp(head.x + math.cos(p.angle)*spd*dt, p.radius, a.map_width  - p.radius)
  head.y = clamp(head.y + math.sin(p.angle)*spd*dt, p.radius, a.map_height - p.radius)
  _follow(p)

  -- Shield regeneration: restore 1 charge if no hit for 10 seconds
  if (p.shield_charges or 0) < (p.shield_max_charges or 0) then
    p.shield_regen_timer = (p.shield_regen_timer or 0) + dt
    if p.shield_regen_timer >= 10.0 then
      p.shield_regen_timer = 0
      p.shield_charges = math.min(p.shield_charges + 1, p.shield_max_charges)
      table.insert(st.events, {
        type = "shield_recharged",
        charges = p.shield_charges
      })
    end
  else
    p.shield_regen_timer = 0
  end

  if (p.regen_level or 0) > 0 then
    p.regen_timer = (p.regen_timer or 0) + dt
    local cd = 16 - p.regen_level * 3
    if p.regen_timer >= cd then
      p.regen_timer = 0
      local last = p.segments[#p.segments]
      p.segments[#p.segments+1] = {
        x=last.x - math.cos(last.angle)*p.radius,
        y=last.y - math.sin(last.angle)*p.radius,
        angle=last.angle,
      }
      st.peak_length = math.max(st.peak_length, #p.segments)
      table.insert(st.events, { type="metrics_update",
        current_length=#p.segments, peak_length=st.peak_length, score=st.score })
    end
  end

  if (p.venom_level or 0) > 0 then
    p.acid_timer = (p.acid_timer or 0) + dt
    -- Synergy: Venom + Speed → acid drops persist 50% longer
    local speed_levels = st.active_evolutions and (st.active_evolutions.speed or 0) or 0
    local duration_bonus = (speed_levels > 0) and 1.5 or 1.0
    if p.acid_timer >= 0.45 then
      p.acid_timer = 0
      local tail = p.segments[#p.segments]
      st.acid_drops[#st.acid_drops+1] = {
        x=tail.x, y=tail.y,
        timer  = (5 + p.venom_level*2) * duration_bonus,
        radius = 8 + p.venom_level*1.5,
      }
    end
  end

  -- Ambush: speed burst when near an NPC joint
  if (p.ambush_level or 0) > 0 and not p.ambush_cooldown then
    local ambush_range = 150
    local ambush_triggered = false
    for _, npc in ipairs(st.npcs) do
      for j = 2, math.min(6, #npc.segments) do  -- check first 5 joints
        local seg = npc.segments[j]
        if dist2(p.segments[1].x, p.segments[1].y, seg.x, seg.y)
           < ambush_range * ambush_range then
          ambush_triggered = true
          break
        end
      end
      if ambush_triggered then break end
    end

    if ambush_triggered then
      -- Apply burst: temporary speed multiplier stored on player
      p.ambush_burst_timer = 1.5   -- burst lasts 1.5 seconds
      p.ambush_cooldown = true
      p.ambush_cooldown_timer = 5.0  -- 5s cooldown between bursts
      table.insert(st.events, { type = "ambush_triggered" })
    end
  end

  -- Tick ambush burst and cooldown
  if p.ambush_burst_timer and p.ambush_burst_timer > 0 then
    p.ambush_burst_timer = p.ambush_burst_timer - dt
  end
  if p.ambush_cooldown then
    p.ambush_cooldown_timer = (p.ambush_cooldown_timer or 0) - dt
    if p.ambush_cooldown_timer <= 0 then
      p.ambush_cooldown = false
      p.ambush_cooldown_timer = 0
    end
  end
end

function _follow(snake)
  local sp = snake.radius * 1.5
  for i = 2, #snake.segments do
    local prev, curr = snake.segments[i-1], snake.segments[i]
    local dx, dy = prev.x-curr.x, prev.y-curr.y
    local d = math.sqrt(dx*dx + dy*dy)
    if d > sp then
      local ang = atan2(dy, dx)
      curr.x = prev.x - math.cos(ang)*sp
      curr.y = prev.y - math.sin(ang)*sp
      curr.angle = ang
    end
  end
end

function _update_npcs(st, dt)
  local a = st.config.arena
  for _, npc in ipairs(st.npcs) do
    if npc.is_slowing then
      npc.slow_timer = (npc.slow_timer or 0) - dt
      if npc.slow_timer <= 0 then npc.is_slowing = false end
    end

    npc.ai_timer = (npc.ai_timer or 0) - dt
    if npc.ai_timer <= 0 then
      npc.ai_timer = 0.4 + math.random()*0.4
      local nh = npc.segments[1]
      local wb = a.wall_buffer or 120

      -- Wall avoidance takes priority over everything
      if     nh.x < wb                then npc.target_angle = 0
      elseif nh.x > a.map_width  - wb then npc.target_angle = math.pi
      elseif nh.y < wb                then npc.target_angle = math.pi/2
      elseif nh.y > a.map_height - wb then npc.target_angle = -math.pi/2
      else
        -- Hunter vs Farmer decision
        local player = st.player
        local player_seg_count = player and #player.segments or 0
        local npc_seg_count = #npc.segments

        local hunt_player = npc_seg_count > player_seg_count + 2  -- must be meaningfully larger

        if hunt_player and player and player.segments and #player.segments > 1 then
          -- HUNTER MODE: target a player joint (not the head — too obvious)
          -- Aim for segment 3-6 range (easier to intercept, more segments to steal)
          local target_idx = math.min(math.floor(#player.segments * 0.3) + 1, #player.segments)
          local target_seg = player.segments[target_idx]
          if target_seg then
            npc.target_angle = atan2(
              target_seg.y - npc.segments[1].y,
              target_seg.x - npc.segments[1].x
            )
            npc.hunting = true
          end
        else
          -- FARMER MODE: existing fruit-hunt / wander logic (unchanged)
          npc.hunting = false
          local nearest, min_d2 = nil, 450*450
          for _, f in ipairs(st.fruits) do
            local d2 = dist2(nh.x, nh.y, f.x, f.y)
            if d2 < min_d2 then min_d2=d2; nearest=f end
          end
          if nearest then
            npc.target_angle = atan2(nearest.y-nh.y, nearest.x-nh.x)
          else
            npc.target_angle = npc.angle + (math.random()*1.2 - 0.6)
          end
        end
      end
    end

    local diff = normalize_angle(npc.target_angle - npc.angle)
    local step = math.min(math.abs(diff), 4.2*dt) * (diff < 0 and -1 or 1)
    npc.angle = (npc.angle + step) % (math.pi*2)

    local spd = npc.speed * (npc.is_slowing and 0.4 or 1.0)
    local head = npc.segments[1]
    head.x = clamp(head.x + math.cos(npc.angle)*spd*dt, npc.radius, a.map_width  - npc.radius)
    head.y = clamp(head.y + math.sin(npc.angle)*spd*dt, npc.radius, a.map_height - npc.radius)
    _follow(npc)
  end
end

function _decay_acid_drops(st, dt)
  local alive = {}
  for _, d in ipairs(st.acid_drops) do
    d.timer = d.timer - dt
    if d.timer > 0 then alive[#alive+1] = d end
  end
  st.acid_drops = alive
end
`,Rp=`-- Slither Rogue — Render State
-- Builds the compact flat-array render state returned to TypeScript.
-- Depends on: state.lua (GAME_STATE shape)

function build_render_state(st)
  local p = st.player
  local px, py, pa = {}, {}, {}
  for _, s in ipairs(p.segments) do
    px[#px+1]=s.x; py[#py+1]=s.y; pa[#pa+1]=s.angle
  end

  local npcs_out = {}
  for _, npc in ipairs(st.npcs) do
    local sx, sy, sa = {}, {}, {}
    for _, s in ipairs(npc.segments) do
      sx[#sx+1]=s.x; sy[#sy+1]=s.y; sa[#sa+1]=s.angle
    end
    npcs_out[#npcs_out+1] = {
      id=npc.id, name=npc.name, color=npc.color, head_color=npc.head_color,
      angle=npc.angle, radius=npc.radius, hunting=npc.hunting or false,
      segs_x=sx, segs_y=sy, segs_a=sa,
    }
  end

  local fruits_out = {}
  for _, f in ipairs(st.fruits) do
    fruits_out[#fruits_out+1] = {
      x=f.x, y=f.y, color=f.color, points=f.points,
      is_golden=f.is_golden, pulse_phase=f.pulse_phase,
    }
  end

  local acid_out = {}
  for _, d in ipairs(st.acid_drops) do
    acid_out[#acid_out+1] = {x=d.x, y=d.y, radius=d.radius, timer=d.timer}
  end

  return {
    player = {
      segs_x=px, segs_y=py, segs_a=pa,
      angle=p.angle, color=p.color, head_color=p.head_color,
      radius=p.radius, shield_charges=p.shield_charges,
      ghost_tail_count=p.ghost_tail_count or 0,
      magnetism_radius=p.magnetism_radius or 0,
      fruit_sense_range=p.fruit_sense_range or 0,
    },
    npcs        = npcs_out,
    fruits      = fruits_out,
    acid_drops  = acid_out,
    time_left   = st.time_left,
    score       = st.score,
    peak_length = st.peak_length,
    events      = st.events,
  }
end
`,Np=`-- Slither Rogue — State
-- GAME_STATE global and all functions that initialize or mutate it.
-- Depends on: utils.lua

GAME_STATE = nil

function _calc_effects(active, cards)
  local e = {
    speed_multiplier=1.0, magnetism_radius=0, shield_charges=0,
    wide_body_add=0, fruit_sense_range=0, ghost_tail_count=0,
    tail_growth_level=0, venom_trail_level=0, ambush_level=0,
  }
  for _, card in ipairs(cards) do
    local lvl = active[card.id] or 0
    if lvl > 0 then
      local k, ppl = card.effect_key, card.effect_per_level
      if     k == "speed_multiplier"  then e.speed_multiplier  = e.speed_multiplier + lvl*ppl
      elseif k == "magnetism_radius"  then e.magnetism_radius  = lvl*ppl
      elseif k == "shield_charges"    then e.shield_charges    = lvl*ppl
      elseif k == "wide_body_add"     then e.wide_body_add     = lvl*ppl
      elseif k == "fruit_sense_range" then e.fruit_sense_range = lvl*ppl
      elseif k == "ghost_tail_count"  then e.ghost_tail_count  = lvl*ppl
      elseif k == "tail_growth_level" then e.tail_growth_level = lvl*ppl
      elseif k == "venom_trail_level" then e.venom_trail_level = lvl*ppl
      elseif k == "ambush_level"      then e.ambush_level      = lvl*ppl
      end
    end
  end
  return e
end

function init_game(config)
  local a   = config.arena
  local ps  = config.player_stats
  local eff = _calc_effects(config.active_evolutions or {}, config.evolution_cards or {})

  local radius = (ps.initial_radius or 11) + (eff.wide_body_add or 0)
  local cx, cy = a.map_width/2, a.map_height/2

  local player = {
    is_npc            = false,
    color             = config.player_preset.color,
    head_color        = config.player_preset.head_color,
    segments          = build_segments(cx, cy, 0, ps.initial_length or 5, radius),
    angle             = 0,
    target_angle      = 0,
    base_speed        = ps.initial_speed or 160,
    radius            = radius,
    shield_charges    = eff.shield_charges or 0,
    shield_max_charges = eff.shield_charges or 0,
    shield_regen_timer = 0,
    last_hit_time     = 0,
    magnetism_radius  = eff.magnetism_radius or 0,
    fruit_sense_range = eff.fruit_sense_range or 0,
    ghost_tail_count  = eff.ghost_tail_count or 0,
    regen_level       = eff.tail_growth_level or 0,
    venom_level       = eff.venom_trail_level or 0,
    ambush_level      = eff.ambush_level or 0,
    regen_timer       = 0,
    acid_timer        = 0,
    is_slowing        = false,
    slow_timer        = 0,
  }

  local npcs = {}
  local ns   = config.npc_stats
  local prof = config.npc_profiles
  for i = 1, a.num_npcs do
    local p   = prof[((i-1) % #prof) + 1]
    local r   = ns.min_radius + math.random() * (ns.max_radius  - ns.min_radius)
    local spd = ns.min_speed  + math.random() * (ns.max_speed   - ns.min_speed)
    local len = ns.min_initial_length +
                math.floor(math.random() * (ns.max_initial_length - ns.min_initial_length + 1))
    local nx  = math.random() * (a.map_width  - 200) + 100
    local ny  = math.random() * (a.map_height - 200) + 100
    local na  = math.random() * math.pi * 2
    npcs[i] = {
      id           = "npc_" .. i,
      name         = p.name .. " " .. i,
      color        = p.color,
      head_color   = p.head_color,
      segments     = build_segments(nx, ny, na, len, r),
      angle        = na,
      target_angle = na,
      speed        = spd,
      radius       = r,
      is_slowing   = false,
      slow_timer   = 0,
      ai_timer     = math.random() * 0.4,
    }
  end

  local fruits = {}
  for i = 1, a.num_fruits do
    fruits[i] = spawn_fruit_from_config(config)
  end

  GAME_STATE = {
    config      = config,
    player      = player,
    npcs        = npcs,
    fruits      = fruits,
    acid_drops  = {},
    time_left   = config.game_duration or 300,
    score       = 0,
    peak_length = ps.initial_length or 5,
    speed_mult  = eff.speed_multiplier or 1.0,
    active_evolutions = config.active_evolutions or {},
    events      = {},
  }
end

-- Called after player selects an evolution card.
function update_evolution_effects(active_evolutions)
  if not GAME_STATE then return end
  local st  = GAME_STATE
  st.active_evolutions = active_evolutions
  local eff = _calc_effects(active_evolutions, st.config.evolution_cards or {})
  local p   = st.player
  local base_r = st.config.player_stats.initial_radius or 11
  p.radius            = base_r + (eff.wide_body_add or 0)
  p.shield_max_charges = eff.shield_charges
  p.shield_charges    = math.min(p.shield_charges or 0, eff.shield_charges)
  p.magnetism_radius  = eff.magnetism_radius
  p.fruit_sense_range = eff.fruit_sense_range
  p.ghost_tail_count  = eff.ghost_tail_count
  p.regen_level       = eff.tail_growth_level
  p.venom_level       = eff.venom_trail_level
  p.ambush_level      = eff.ambush_level
  st.speed_mult       = eff.speed_multiplier
end
`,Cp=`-- Slither Rogue — Utilities
-- Game-specific spawn and segment construction helpers.
-- Engine math (clamp, dist2, normalize_angle, atan2) available from engine primitives.
-- Loaded first in lua_files — other slither_rogue files may call these.

local function build_segments(x, y, angle, length, radius)
  local segs = {}
  for i = 1, length do
    segs[i] = {
      x     = x - math.cos(angle) * (i-1) * radius * 1.6,
      y     = y - math.sin(angle) * (i-1) * radius * 1.6,
      angle = angle,
    }
  end
  return segs
end

local function spawn_fruit_from_config(cfg)
  local a, f = cfg.arena, cfg.fruit
  local golden = math.random() < (f.golden_chance or 0.08)
  local color  = golden and (f.golden_color or "#fbbf24")
                 or f.colors[math.random(#f.colors)]
  return {
    id          = "f" .. tostring(math.random(1000000)),
    x           = math.random() * (a.map_width  - 120) + 60,
    y           = math.random() * (a.map_height - 120) + 60,
    color       = color,
    points      = golden and (f.golden_points or 3) or (f.standard_points or 1),
    is_golden   = golden,
    pulse_phase = math.random() * math.pi * 2,
  }
end
`,Mp=`-- engine/primitives/action.lua
-- Pure state transformation utilities.
-- Convention: functions return new state; never mutate inputs.

-- Clamp a value between min and max
function clamp(val, min_val, max_val)
  return math.max(min_val, math.min(max_val, val))
end

-- Random integer in range [min, max]
function rand_int(min_val, max_val)
  return math.floor(min_val + math.random() * (max_val - min_val))
end

-- Random item from a table (array)
function rand_item(arr)
  return arr[math.random(#arr)]
end

-- Collect a Python list proxy (or any Lua table) into a Lua-native sequence.
-- Required when receiving list arguments from lupa (Python→Lua bridge).
-- lupa proxies do not support the # operator — rawlen returns 0.
-- Always use collect() before iterating or measuring Python-origin lists.
--
-- t: any table or lupa list proxy
-- Returns: Lua-native sequence table
function collect(t)
  local out = {}
  for _, v in ipairs(t) do out[#out+1] = v end
  return out
end
`,Ip=`-- engine/primitives/consequence.lua
-- Placeholder — consequence patterns are game-specific for now.
-- Will be populated when a shared consequence emerges across 2+ games.
-- Convention: apply_{outcome}(entity, result) -> updated_entity
`,Up=`-- engine/primitives/entity.lua
-- Entity contracts: ID generation, schema validation, deep copy.

-- Generate a unique ID for a new entity.
-- prefix: string identifying the entity type (e.g. "horse", "bot", "segment")
-- Returns: string ID
function generate_id(prefix)
  return (prefix or "entity") .. "_" .. tostring(math.random(100000, 999999))
end

-- Deep-copy an entity table (prevents mutation of inputs in actions).
-- entity: table
-- Returns: new table with same values
function copy_entity(entity)
  local copy = {}
  for k, v in pairs(entity) do copy[k] = v end
  return copy
end

-- Validate that an entity table has all required fields.
-- entity: table
-- required_fields: array of field name strings
-- Returns: true, nil | false, "Missing field: {name}"
function validate_entity(entity, required_fields)
  for _, field in ipairs(required_fields) do
    if entity[field] == nil then
      return false, "Missing field: " .. tostring(field)
    end
  end
  return true, nil
end
`,Pp=`-- engine/primitives/lifecycle.lua
-- Standard lifecycle event names. Use as string keys in systems.yaml.

LIFECYCLE_CREATE    = "create"
LIFECYCLE_STEP      = "step"
LIFECYCLE_DRAW      = "draw"       -- TypeScript only, documented here for clarity
LIFECYCLE_COLLISION = "collision"
LIFECYCLE_DESTROY   = "destroy"
`,Dp=`-- engine/primitives/movement.lua
-- Position update patterns for continuous and grid-based movement.
-- Also provides universal math utilities: dist2, normalize_angle.

-- Advance a continuous position by speed * delta_time.
-- Returns: new_position (float)
function advance_position(position, speed, delta_time)
  return position + speed * delta_time
end

-- Move a grid entity one step in a direction.
-- direction: {dx: int, dy: int}
-- Returns: {x: int, y: int}
function move_grid(pos, direction)
  return { x = pos.x + direction.dx, y = pos.y + direction.dy }
end

-- Check if a position is within grid bounds [0, width) x [0, height).
-- Returns: true if in bounds
function in_bounds(pos, width, height)
  return pos.x >= 0 and pos.x < width and pos.y >= 0 and pos.y < height
end

-- Calculate squared distance between two points.
-- Returns: number (avoids sqrt for cheap proximity checks)
function dist2(x1, y1, x2, y2)
  local dx, dy = x1 - x2, y1 - y2
  return dx * dx + dy * dy
end

-- Normalize an angle in radians to the range [-π, π].
-- Returns: number
function normalize_angle(a)
  while a < -math.pi do a = a + math.pi * 2 end
  while a >  math.pi do a = a - math.pi * 2 end
  return a
end

-- Lua 5.2+ compatibility wrapper for atan2.
-- math.atan2(y, x) was removed in Lua 5.2; math.atan(y, x) is the replacement.
-- Use this wrapper in any game that needs arctangent of two arguments.
function atan2(y, x)
  return math.atan(y, x)
end
`,Gp=`-- engine/primitives/physics.lua
-- Collision detection and response patterns.

-- Check if two grid positions are the same cell.
-- Returns: true if collision
function grid_collision(pos_a, pos_b)
  return pos_a.x == pos_b.x and pos_a.y == pos_b.y
end

-- Check if a position matches any position in an array (self-collision).
-- body: array of {x, y} tables
-- head: {x, y}
-- Returns: true if head hits body
function self_collision(head, body)
  for _, segment in ipairs(body) do
    if grid_collision(head, segment) then return true end
  end
  return false
end
`,Bp=`-- engine/primitives/resolution.lua
-- RNG-seeded outcome determination patterns.

-- Convert raw scores to decimal odds with overround applied.
-- scores: array of numbers (higher = more likely to win)
-- overround: float (e.g. 1.12 = 12% house margin)
-- Returns: array of decimal odds parallel to scores
function scores_to_odds(scores, overround)
  overround = overround or 1.12
  local total = 0
  for _, s in ipairs(scores) do total = total + s end
  local odds = {}
  for _, s in ipairs(scores) do
    local prob = (s / total) * overround
    local decimal = math.floor((1 / math.max(0.01, prob)) * 10 + 0.5) / 10
    table.insert(odds, math.max(1.1, decimal))
  end
  return odds
end
`,Fp=`-- engine/systems/combat.lua
-- Combat resolution system for part-based arena fighters.
-- Used by: BattleBots (Phase 3+)
-- Not used by: horse_racing, slither_rogue
--
-- Function contracts follow ADR-007 naming conventions:
--   resolve_* → contested outcome determination
--   apply_*   → post-resolution state change
--   detect_*  → collision / contact detection

-- ============================================================
-- DAMAGE CALCULATION
-- ============================================================

-- Calculate raw damage from an attack.
-- attacker: { attack_power, weapon_type, reach }
-- defender: { armor, defense_rating }
-- Returns: { raw_damage, blocked, penetrated }
function calculate_damage(attacker, defender)
  -- Stub — implement when BattleBots is ported
  error("calculate_damage: not implemented for this game")
end

-- Apply damage to a bot part.
-- part: { id, name, health, max_health, armor, is_destroyed }
-- damage: number
-- Returns: updated_part (pure — does not mutate input)
function apply_damage(part, damage)
  -- Stub — implement when BattleBots is ported
  error("apply_damage: not implemented for this game")
end

-- ============================================================
-- HIT RESOLUTION
-- ============================================================

-- Determine if an attack connects, given speed and accuracy.
-- attacker: { accuracy, speed }
-- defender: { agility, speed }
-- seed: RNG seed (from runtime)
-- Returns: { hit=bool, glancing=bool }
function resolve_hit(attacker, defender, seed)
  -- Stub — implement when BattleBots is ported
  error("resolve_hit: not implemented for this game")
end

-- ============================================================
-- FIGHT SIMULATION
-- ============================================================

-- Simulate a complete fight between two bots.
-- bot_a, bot_b: full bot tables with parts and stats
-- config: fight config (arena type, time limit)
-- Returns: { winner_id, rounds, damage_log[], bot_a_final, bot_b_final }
-- This is the BattleBots equivalent of simulate_race.
-- TypeScript renders the damage_log as a cinematic sequence.
function simulate_fight(bot_a, bot_b, config)
  -- Stub — implement when BattleBots is ported
  error("simulate_fight: not implemented for this game")
end

-- ============================================================
-- PART DURABILITY
-- ============================================================

-- Check if a part is destroyed (health at or below zero).
-- part: { health }
-- Returns: bool
function is_part_destroyed(part)
  return (part.health or 0) <= 0
end

-- Calculate overall bot effectiveness from part states.
-- Parts that are destroyed reduce effectiveness proportionally.
-- bot: { parts: [] }
-- Returns: float 0.0 to 1.0
function calculate_bot_effectiveness(bot)
  if not bot.parts or #bot.parts == 0 then return 0.0 end
  local total, alive = 0, 0
  for _, part in ipairs(bot.parts) do
    total = total + 1
    if not is_part_destroyed(part) then alive = alive + 1 end
  end
  return alive / total
end
`,Vp=`-- engine/systems/genetics.lua
-- Genome generation, trait inheritance, color profiles, naming.
-- Depends on: engine/primitives/action.lua (clamp, rand_int, rand_item)

-- Generate a horse name from prefix + suffix pools
function generate_horse_name(prefixes, suffixes)
  return rand_item(prefixes) .. " " .. rand_item(suffixes)
end

-- Pick a coat color based on probability weights
function generate_color_profile(coat_colors)
  local total_weight = 0
  for _, c in ipairs(coat_colors) do
    total_weight = total_weight + c.weight
  end

  local roll = math.random() * total_weight
  for _, profile in ipairs(coat_colors) do
    if roll < profile.weight then
      return {
        body = profile.body,
        mane = profile.mane,
        socks = profile.socks,
        color_name = profile.name
      }
    end
    roll = roll - profile.weight
  end

  -- Fallback: Bay
  return { body = "#91532B", mane = "#1C1917", socks = "#1C1917", color_name = "Bay" }
end

-- Generate a random horse with configurable stat ranges
function generate_horse(options, coat_colors, silk_colors, prefixes, suffixes)
  local min_stat = options.min_stat or 25
  local max_stat = options.max_stat or 65
  local generation = options.generation or 1
  local player_owned = options.player_owned or false
  local gender = options.gender or (math.random() > 0.5 and "Stallion" or "Mare")

  local speed        = rand_int(min_stat, max_stat)
  local stamina      = rand_int(min_stat, max_stat)
  local acceleration = rand_int(min_stat, max_stat)
  local temperament  = rand_int(min_stat, max_stat)

  local avg_stat = (speed + stamina + acceleration + temperament) / 4
  local price = math.floor(avg_stat * avg_stat * 0.35 + (generation * 100) + math.random() * 50)

  local colors = generate_color_profile(coat_colors)

  return {
    id             = "horse_" .. tostring(math.random(100000, 999999)),
    name           = generate_horse_name(prefixes, suffixes),
    gender         = gender,
    generation     = generation,
    speed          = speed,
    stamina        = stamina,
    acceleration   = acceleration,
    temperament    = temperament,
    color_body     = colors.body,
    color_mane     = colors.mane,
    color_socks    = colors.socks,
    color_silk     = rand_item(silk_colors),
    runs           = 0,
    wins           = 0,
    places         = 0,
    thirds         = 0,
    earnings       = 0,
    cooldown_until = 0,
    player_owned   = player_owned,
    price          = price,
    parents        = nil
  }
end

-- Breed a single stat from two parents with mutation and generational boost
function breed_stat(stat_a, stat_b)
  local parent_avg = (stat_a + stat_b) / 2
  -- Approximate normal distribution: sum of 3 uniform randoms centered on 0
  -- Range: approximately -15 to +15, centered on 0
  local mutation = (math.random() + math.random() + math.random() - 1.5) * 10
  -- Generational boost: +2.0 average
  local final_stat = math.round and math.round(parent_avg + mutation + 2.0)
    or math.floor(parent_avg + mutation + 2.0 + 0.5)
  return clamp(final_stat, 10, 100)
end

-- Breed two horses, inheriting stats and colors
-- sire must be Stallion, dam must be Mare
function breed_horses(sire, dam, coat_colors, silk_colors, prefixes, suffixes)
  if sire.gender ~= "Stallion" then
    return nil, "Sire must be a Stallion"
  end
  if dam.gender ~= "Mare" then
    return nil, "Dam must be a Mare"
  end

  local next_gen = math.max(sire.generation, dam.generation) + 1
  local gender   = math.random() > 0.5 and "Stallion" or "Mare"

  local speed        = breed_stat(sire.speed, dam.speed)
  local stamina      = breed_stat(sire.stamina, dam.stamina)
  local acceleration = breed_stat(sire.acceleration, dam.acceleration)
  local temperament  = breed_stat(sire.temperament, dam.temperament)

  -- Color inheritance: 45% sire, 45% dam, 10% random mutation
  local color_roll = math.random()
  local color_body, color_mane, color_socks

  if color_roll <= 0.45 then
    color_body  = sire.color_body
    color_mane  = sire.color_mane
    color_socks = sire.color_socks
  elseif color_roll <= 0.90 then
    color_body  = dam.color_body
    color_mane  = dam.color_mane
    color_socks = dam.color_socks
  else
    local profile = generate_color_profile(coat_colors)
    color_body  = profile.body
    color_mane  = profile.mane
    color_socks = profile.socks
  end

  -- Jockey silk: random from parents
  local color_silk = math.random() > 0.5 and sire.color_silk or dam.color_silk

  -- Child name: sire prefix + dam suffix
  local sire_parts = {}
  for part in sire.name:gmatch("%S+") do table.insert(sire_parts, part) end
  local dam_parts = {}
  for part in dam.name:gmatch("%S+") do table.insert(dam_parts, part) end

  local child_name = (sire_parts[1] or "Unknown") .. " " ..
                     (dam_parts[2] or rand_item(suffixes))

  return {
    id             = "horse_" .. tostring(math.random(100000, 999999)),
    name           = child_name,
    gender         = gender,
    generation     = next_gen,
    speed          = speed,
    stamina        = stamina,
    acceleration   = acceleration,
    temperament    = temperament,
    color_body     = color_body,
    color_mane     = color_mane,
    color_socks    = color_socks,
    color_silk     = color_silk,
    runs           = 0,
    wins           = 0,
    places         = 0,
    thirds         = 0,
    earnings       = 0,
    cooldown_until = 0,
    player_owned   = true,
    parents        = {
      sire_id   = sire.id,
      sire_name = sire.name,
      dam_id    = dam.id,
      dam_name  = dam.name
    }
  }, nil
end
`,jp=`-- engine/systems/market.lua
-- Bet settlement, horse valuation, prize distribution.

-- DEPRECATED: Use settle_bets() instead.
-- settle_bets() returns horse_earnings alongside bet_payout in one call.
-- This function will be removed in Phase 4.
function calculate_payouts(results, prize_pool, prize_split)
  local payouts = {}
  for i, result in ipairs(results) do
    local fraction = prize_split[i] or 0
    payouts[result.horse_id] = math.floor(prize_pool * fraction)
  end
  return payouts
end

-- Recalculate a horse's market value based on current stats and career
function calculate_horse_price(horse)
  local avg_stat = (horse.speed + horse.stamina +
                    horse.acceleration + horse.temperament) / 4
  local base_price = math.floor(avg_stat * avg_stat * 0.35 +
                                (horse.generation * 100))
  -- Career premium: each win adds value
  local career_premium = horse.wins * 150 + horse.places * 60 + horse.thirds * 30
  return base_price + career_premium
end

-- Validate and execute a horse sale
-- Returns new_funds or nil + error
function sell_horse(horse, current_funds)
  if horse.runs == 0 then
    -- Unraced: sell at base price
    return current_funds + horse.price, nil
  end
  -- Raced: sell at current turf bid value
  local value = calculate_horse_price(horse)
  return current_funds + value, nil
end

-- Settle all bets for a completed race.
-- bets: array of { horse_id, amount, type, payout_odds }
--   type is "Win" (must finish 1st), "Place" (1st/2nd), or "Show" (1st/2nd/3rd)
-- standings: array of { horse_id, final_rank } sorted rank ascending
-- prize_pool: integer total purse
-- prize_splits: array of fractions e.g. {0.60, 0.25, 0.15}
--
-- Returns: {
--   bet_payout: integer (total won from bets),
--   horse_earnings: table { horse_id = prize_integer }
-- }
function settle_bets(bets, standings, prize_pool, prize_splits)
  -- Build rank lookup: horse_id -> rank
  local rank_of = {}
  for _, s in ipairs(standings) do
    rank_of[s.horse_id] = s.final_rank
  end

  -- Calculate bet winnings (only winning bets; losing bets were deducted on placement)
  local bet_payout = 0
  for _, bet in ipairs(bets) do
    local rank = rank_of[bet.horse_id]
    if rank then
      local is_winner = false
      if bet.type == "Win" and rank == 1 then
        is_winner = true
      elseif bet.type == "Place" and rank <= 2 then
        is_winner = true
      elseif bet.type == "Show" and rank <= 3 then
        is_winner = true
      end
      if is_winner then
        bet_payout = bet_payout + math.floor(bet.amount * bet.payout_odds)
      end
    end
  end

  -- Calculate prize pool earnings per horse
  local horse_earnings = {}
  for _, s in ipairs(standings) do
    local fraction = prize_splits[s.final_rank] or 0
    if fraction > 0 then
      horse_earnings[s.horse_id] = math.floor(prize_pool * fraction)
    else
      horse_earnings[s.horse_id] = 0
    end
  end

  return { bet_payout = bet_payout, horse_earnings = horse_earnings }
end
`,zp=`-- engine/systems/odds.lua
-- Probability weighting and payout calculation.
-- Depends on: engine/primitives/action.lua (clamp, rand_int, rand_item)

-- Calculate decimal betting odds for a field of horses at a given distance
-- Returns array of odds parallel to participants array
function calculate_odds(participants, distance, overround)
  overround = overround or 1.12

  -- Score each horse based on distance-weighted stats
  local scores = {}
  for _, p in ipairs(participants) do
    local h = p.horse or p  -- support both wrapped and unwrapped horse
    local score

    if distance <= 900 then
      -- Sprint: acceleration dominant
      score = h.acceleration * 0.45 + h.speed * 0.45 + h.stamina * 0.10
    elseif distance <= 1400 then
      -- Medium: speed dominant
      score = h.speed * 0.40 + h.stamina * 0.35 + h.acceleration * 0.25
    else
      -- Long: stamina dominant
      score = h.stamina * 0.55 + h.speed * 0.30 + h.acceleration * 0.15
    end

    -- Temperament bump: consistency of peak performance
    score = score + h.temperament * 0.05
    table.insert(scores, math.max(1, score))
  end

  local total_score = 0
  for _, s in ipairs(scores) do total_score = total_score + s end

  local odds = {}
  for _, s in ipairs(scores) do
    local prob = (s / total_score) * overround
    local decimal_odds = 1 / math.max(0.01, prob)
    -- Round to nearest tenth
    decimal_odds = math.floor(decimal_odds * 10 + 0.5) / 10
    table.insert(odds, math.max(1.1, decimal_odds))
  end

  return odds
end

-- Calculate place bet odds from win odds.
-- config: { place_odds_multiplier, place_odds_min }
-- Returns: float — max(min, win_odds * multiplier)
function calculate_place_odds(win_odds, config)
  local multiplier = config and config.place_odds_multiplier or 0.38
  local min_odds   = config and config.place_odds_min        or 1.15
  local place = win_odds * multiplier
  if place < min_odds then place = min_odds end
  return math.floor(place * 100 + 0.5) / 100
end

-- Calculate show bet odds (1st, 2nd, or 3rd).
function calculate_show_odds(win_odds, config)
  local multiplier = config and config.show_odds_multiplier or 0.20
  local min_odds   = config and config.show_odds_min        or 1.05
  local show = win_odds * multiplier
  if show < min_odds then show = min_odds end
  return math.floor(show * 100 + 0.5) / 100
end
`,Hp=`-- RFDGameStudio — Layout Resolver
-- Implements the Yoga/Flutter flex layout algorithm.
-- Input:  layout_tree node + parent bounds {x, y, w, h}
-- Output: flat array of {id, x, y, w, h} in absolute pixels
--
-- Algorithm: "constraints go down, sizes go up" (Flutter terminology)
--   1. Walk tree top-down
--   2. Fixed nodes: height/width as fraction of parent
--   3. Flex nodes: share remaining space proportionally
--   4. Position children sequentially along direction axis
--   5. Recurse into children with their computed bounds
--   6. Return flat list of all resolved nodes

-- Resolve a layout tree node given its parent's absolute pixel bounds.
-- node: table with id, direction?, height?, width?, flex?, children?
-- parent: {x, y, w, h} in pixels
-- results: flat array to accumulate into (pass {} at root call)
-- Returns: results (same reference, for convenience)
function resolve_layout(node, parent, results)
  results = results or {}
  parent  = parent or { x=0, y=0, w=800, h=600 }

  local direction = node.direction or "column"
  local is_column = (direction == "column")
  local children  = node.children or {}

  -- Step 1: Compute this node's own bounds from parent
  local x = parent.x
  local y = parent.y
  local w = node.width  and (node.width  * parent.w) or parent.w
  local h = node.height and (node.height * parent.h) or parent.h

  -- Root node: override with parent bounds
  if not node.width  then w = parent.w end
  if not node.height then h = parent.h end

  -- Record this node if it has an id
  if node.id then
    table.insert(results, { id=node.id, x=x, y=y, w=w, h=h })
  end

  if #children == 0 then
    return results
  end

  -- Step 2: Separate fixed children from flex children
  local fixed_total = 0   -- total fixed size along main axis
  local total_flex  = 0   -- sum of flex factors

  for _, child in ipairs(children) do
    if is_column then
      if child.height then
        fixed_total = fixed_total + child.height * h
      elseif child.flex then
        total_flex = total_flex + child.flex
      end
    else
      if child.width then
        fixed_total = fixed_total + child.width * w
      elseif child.flex then
        total_flex = total_flex + child.flex
      end
    end
  end

  -- Step 3: Remaining space for flex children
  local main_size    = is_column and h or w
  local remaining    = math.max(0, main_size - fixed_total)
  local flex_unit    = (total_flex > 0) and (remaining / total_flex) or 0

  -- Step 4: Position each child sequentially
  local cursor = 0  -- current offset along main axis

  for _, child in ipairs(children) do
    local child_main  -- size along main axis
    local child_cross -- size along cross axis

    if is_column then
      child_cross = w
      if child.height then
        child_main = child.height * h
      elseif child.flex then
        child_main = flex_unit * child.flex
      else
        child_main = 0
      end
    else
      child_cross = h
      if child.width then
        child_main = child.width * w
      elseif child.flex then
        child_main = flex_unit * child.flex
      else
        child_main = 0
      end
    end

    -- Build child bounds
    local child_bounds
    if is_column then
      child_bounds = { x=x, y=y+cursor, w=child_cross, h=child_main }
    else
      child_bounds = { x=x+cursor, y=y, w=child_main, h=child_cross }
    end

    -- Recurse
    resolve_layout(child, child_bounds, results)
    cursor = cursor + child_main
  end

  return results
end

-- Convenience: resolve from a viewport size directly.
-- tree: the layout_tree table from ui.yaml
-- viewport_w, viewport_h: canvas/window dimensions in pixels
-- Returns: flat array of {id, x, y, w, h}
function resolve_viewport(tree, viewport_w, viewport_h)
  return resolve_layout(tree, { x=0, y=0, w=viewport_w, h=viewport_h }, {})
end
`;/*! js-yaml 4.2.0 https://github.com/nodeca/js-yaml @license MIT */var Kp=Object.create,Nc=Object.defineProperty,Xp=Object.getOwnPropertyDescriptor,qp=Object.getOwnPropertyNames,Wp=Object.getPrototypeOf,Yp=Object.prototype.hasOwnProperty,xt=(a,z)=>()=>(z||(a((z={exports:{}}).exports,z),a=null),z.exports),$p=(a,z,d,k)=>{if(z&&typeof z=="object"||typeof z=="function")for(var v=qp(z),P=0,R=v.length,C;P<R;P++)C=v[P],!Yp.call(a,C)&&C!==d&&Nc(a,C,{get:(j=>z[j]).bind(null,C),enumerable:!(k=Xp(z,C))||k.enumerable});return a},Qp=(a,z,d)=>(d=a!=null?Kp(Wp(a)):{},$p(Nc(d,"default",{value:a,enumerable:!0}),a)),ml=xt(((a,z)=>{function d(j){return typeof j>"u"||j===null}function k(j){return typeof j=="object"&&j!==null}function v(j){return Array.isArray(j)?j:d(j)?[]:[j]}function P(j,L){if(L){const H=Object.keys(L);for(let w=0,B=H.length;w<B;w+=1){const Q=H[w];j[Q]=L[Q]}}return j}function R(j,L){let H="";for(let w=0;w<L;w+=1)H+=j;return H}function C(j){return j===0&&Number.NEGATIVE_INFINITY===1/j}z.exports.isNothing=d,z.exports.isObject=k,z.exports.toArray=v,z.exports.repeat=R,z.exports.isNegativeZero=C,z.exports.extend=P})),gl=xt(((a,z)=>{function d(v,P){let R="";const C=v.reason||"(unknown reason)";return v.mark?(v.mark.name&&(R+='in "'+v.mark.name+'" '),R+="("+(v.mark.line+1)+":"+(v.mark.column+1)+")",!P&&v.mark.snippet&&(R+=`

`+v.mark.snippet),C+" "+R):C}function k(v,P){Error.call(this),this.name="YAMLException",this.reason=v,this.mark=P,this.message=d(this,!1),Error.captureStackTrace?Error.captureStackTrace(this,this.constructor):this.stack=new Error().stack||""}k.prototype=Object.create(Error.prototype),k.prototype.constructor=k,k.prototype.toString=function(P){return this.name+": "+d(this,P)},z.exports=k})),Zp=xt(((a,z)=>{var d=ml();function k(R,C,j,L,H){let w="",B="";const Q=Math.floor(H/2)-1;return L-C>Q&&(w=" ... ",C=L-Q+w.length),j-L>Q&&(B=" ...",j=L+Q-B.length),{str:w+R.slice(C,j).replace(/\t/g,"→")+B,pos:L-C+w.length}}function v(R,C){return d.repeat(" ",C-R.length)+R}function P(R,C){if(C=Object.create(C||null),!R.buffer)return null;C.maxLength||(C.maxLength=79),typeof C.indent!="number"&&(C.indent=1),typeof C.linesBefore!="number"&&(C.linesBefore=3),typeof C.linesAfter!="number"&&(C.linesAfter=2);const j=/\r?\n|\r|\0/g,L=[0],H=[];let w,B=-1;for(;w=j.exec(R.buffer);)H.push(w.index),L.push(w.index+w[0].length),R.position<=w.index&&B<0&&(B=L.length-2);B<0&&(B=L.length-1);let Q="";const ce=Math.min(R.line+C.linesAfter,H.length).toString().length,$=C.maxLength-(C.indent+ce+3);for(let se=1;se<=C.linesBefore&&!(B-se<0);se++){const $e=k(R.buffer,L[B-se],H[B-se],R.position-(L[B]-L[B-se]),$);Q=d.repeat(" ",C.indent)+v((R.line-se+1).toString(),ce)+" | "+$e.str+`
`+Q}const ve=k(R.buffer,L[B],H[B],R.position,$);Q+=d.repeat(" ",C.indent)+v((R.line+1).toString(),ce)+" | "+ve.str+`
`,Q+=d.repeat("-",C.indent+ce+3+ve.pos)+`^
`;for(let se=1;se<=C.linesAfter&&!(B+se>=H.length);se++){const $e=k(R.buffer,L[B+se],H[B+se],R.position-(L[B]-L[B+se]),$);Q+=d.repeat(" ",C.indent)+v((R.line+se+1).toString(),ce)+" | "+$e.str+`
`}return Q.replace(/\n$/,"")}z.exports=P})),Yt=xt(((a,z)=>{var d=gl(),k=["kind","multi","resolve","construct","instanceOf","predicate","represent","representName","defaultStyle","styleAliases"],v=["scalar","sequence","mapping"];function P(C){const j={};return C!==null&&Object.keys(C).forEach(function(L){C[L].forEach(function(H){j[String(H)]=L})}),j}function R(C,j){if(j=j||{},Object.keys(j).forEach(function(L){if(k.indexOf(L)===-1)throw new d('Unknown option "'+L+'" is met in definition of "'+C+'" YAML type.')}),this.options=j,this.tag=C,this.kind=j.kind||null,this.resolve=j.resolve||function(){return!0},this.construct=j.construct||function(L){return L},this.instanceOf=j.instanceOf||null,this.predicate=j.predicate||null,this.represent=j.represent||null,this.representName=j.representName||null,this.defaultStyle=j.defaultStyle||null,this.multi=j.multi||!1,this.styleAliases=P(j.styleAliases||null),v.indexOf(this.kind)===-1)throw new d('Unknown kind "'+this.kind+'" is specified for "'+C+'" YAML type.')}z.exports=R})),Cc=xt(((a,z)=>{var d=gl(),k=Yt();function v(C,j){const L=[];return C[j].forEach(function(H){let w=L.length;L.forEach(function(B,Q){B.tag===H.tag&&B.kind===H.kind&&B.multi===H.multi&&(w=Q)}),L[w]=H}),L}function P(){const C={scalar:{},sequence:{},mapping:{},fallback:{},multi:{scalar:[],sequence:[],mapping:[],fallback:[]}};function j(L){L.multi?(C.multi[L.kind].push(L),C.multi.fallback.push(L)):C[L.kind][L.tag]=C.fallback[L.tag]=L}for(let L=0,H=arguments.length;L<H;L+=1)arguments[L].forEach(j);return C}function R(C){return this.extend(C)}R.prototype.extend=function(j){let L=[],H=[];if(j instanceof k)H.push(j);else if(Array.isArray(j))H=H.concat(j);else if(j&&(Array.isArray(j.implicit)||Array.isArray(j.explicit)))j.implicit&&(L=L.concat(j.implicit)),j.explicit&&(H=H.concat(j.explicit));else throw new d("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");L.forEach(function(B){if(!(B instanceof k))throw new d("Specified list of YAML types (or a single Type object) contains a non-Type object.");if(B.loadKind&&B.loadKind!=="scalar")throw new d("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");if(B.multi)throw new d("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.")}),H.forEach(function(B){if(!(B instanceof k))throw new d("Specified list of YAML types (or a single Type object) contains a non-Type object.")});const w=Object.create(R.prototype);return w.implicit=(this.implicit||[]).concat(L),w.explicit=(this.explicit||[]).concat(H),w.compiledImplicit=v(w,"implicit"),w.compiledExplicit=v(w,"explicit"),w.compiledTypeMap=P(w.compiledImplicit,w.compiledExplicit),w},z.exports=R})),Mc=xt(((a,z)=>{z.exports=new(Yt())("tag:yaml.org,2002:str",{kind:"scalar",construct:function(d){return d!==null?d:""}})})),Ic=xt(((a,z)=>{z.exports=new(Yt())("tag:yaml.org,2002:seq",{kind:"sequence",construct:function(d){return d!==null?d:[]}})})),Uc=xt(((a,z)=>{z.exports=new(Yt())("tag:yaml.org,2002:map",{kind:"mapping",construct:function(d){return d!==null?d:{}}})})),Pc=xt(((a,z)=>{z.exports=new(Cc())({explicit:[Mc(),Ic(),Uc()]})})),Dc=xt(((a,z)=>{var d=Yt();function k(R){if(R===null)return!0;const C=R.length;return C===1&&R==="~"||C===4&&(R==="null"||R==="Null"||R==="NULL")}function v(){return null}function P(R){return R===null}z.exports=new d("tag:yaml.org,2002:null",{kind:"scalar",resolve:k,construct:v,predicate:P,represent:{canonical:function(){return"~"},lowercase:function(){return"null"},uppercase:function(){return"NULL"},camelcase:function(){return"Null"},empty:function(){return""}},defaultStyle:"lowercase"})})),Gc=xt(((a,z)=>{var d=Yt();function k(R){if(R===null)return!1;const C=R.length;return C===4&&(R==="true"||R==="True"||R==="TRUE")||C===5&&(R==="false"||R==="False"||R==="FALSE")}function v(R){return R==="true"||R==="True"||R==="TRUE"}function P(R){return Object.prototype.toString.call(R)==="[object Boolean]"}z.exports=new d("tag:yaml.org,2002:bool",{kind:"scalar",resolve:k,construct:v,predicate:P,represent:{lowercase:function(R){return R?"true":"false"},uppercase:function(R){return R?"TRUE":"FALSE"},camelcase:function(R){return R?"True":"False"}},defaultStyle:"lowercase"})})),Bc=xt(((a,z)=>{var d=ml(),k=Yt();function v(w){return w>=48&&w<=57||w>=65&&w<=70||w>=97&&w<=102}function P(w){return w>=48&&w<=55}function R(w){return w>=48&&w<=57}function C(w){if(w===null)return!1;const B=w.length;let Q=0,ce=!1;if(!B)return!1;let $=w[Q];if(($==="-"||$==="+")&&($=w[++Q]),$==="0"){if(Q+1===B)return!0;if($=w[++Q],$==="b"){for(Q++;Q<B;Q++){if($=w[Q],$!=="0"&&$!=="1")return!1;ce=!0}return ce&&Number.isFinite(j(w))}if($==="x"){for(Q++;Q<B;Q++){if(!v(w.charCodeAt(Q)))return!1;ce=!0}return ce&&Number.isFinite(j(w))}if($==="o"){for(Q++;Q<B;Q++){if(!P(w.charCodeAt(Q)))return!1;ce=!0}return ce&&Number.isFinite(j(w))}}for(;Q<B;Q++){if(!R(w.charCodeAt(Q)))return!1;ce=!0}return ce?Number.isFinite(j(w)):!1}function j(w){let B=w,Q=1,ce=B[0];if((ce==="-"||ce==="+")&&(ce==="-"&&(Q=-1),B=B.slice(1),ce=B[0]),B==="0")return 0;if(ce==="0"){if(B[1]==="b")return Q*parseInt(B.slice(2),2);if(B[1]==="x")return Q*parseInt(B.slice(2),16);if(B[1]==="o")return Q*parseInt(B.slice(2),8)}return Q*parseInt(B,10)}function L(w){return j(w)}function H(w){return Object.prototype.toString.call(w)==="[object Number]"&&w%1===0&&!d.isNegativeZero(w)}z.exports=new k("tag:yaml.org,2002:int",{kind:"scalar",resolve:C,construct:L,predicate:H,represent:{binary:function(w){return w>=0?"0b"+w.toString(2):"-0b"+w.toString(2).slice(1)},octal:function(w){return w>=0?"0o"+w.toString(8):"-0o"+w.toString(8).slice(1)},decimal:function(w){return w.toString(10)},hexadecimal:function(w){return w>=0?"0x"+w.toString(16).toUpperCase():"-0x"+w.toString(16).toUpperCase().slice(1)}},defaultStyle:"decimal",styleAliases:{binary:[2,"bin"],octal:[8,"oct"],decimal:[10,"dec"],hexadecimal:[16,"hex"]}})})),Fc=xt(((a,z)=>{var d=ml(),k=Yt(),v=new RegExp("^(?:[-+]?(?:[0-9]+)(?:\\.[0-9]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"),P=new RegExp("^(?:[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");function R(w){return w===null||!v.test(w)?!1:Number.isFinite(parseFloat(w,10))?!0:P.test(w)}function C(w){let B=w.toLowerCase();const Q=B[0]==="-"?-1:1;return"+-".indexOf(B[0])>=0&&(B=B.slice(1)),B===".inf"?Q===1?Number.POSITIVE_INFINITY:Number.NEGATIVE_INFINITY:B===".nan"?NaN:Q*parseFloat(B,10)}var j=/^[-+]?[0-9]+e/;function L(w,B){if(isNaN(w))switch(B){case"lowercase":return".nan";case"uppercase":return".NAN";case"camelcase":return".NaN"}else if(Number.POSITIVE_INFINITY===w)switch(B){case"lowercase":return".inf";case"uppercase":return".INF";case"camelcase":return".Inf"}else if(Number.NEGATIVE_INFINITY===w)switch(B){case"lowercase":return"-.inf";case"uppercase":return"-.INF";case"camelcase":return"-.Inf"}else if(d.isNegativeZero(w))return"-0.0";const Q=w.toString(10);return j.test(Q)?Q.replace("e",".e"):Q}function H(w){return Object.prototype.toString.call(w)==="[object Number]"&&(w%1!==0||d.isNegativeZero(w))}z.exports=new k("tag:yaml.org,2002:float",{kind:"scalar",resolve:R,construct:C,predicate:H,represent:L,defaultStyle:"lowercase"})})),Vc=xt(((a,z)=>{z.exports=Pc().extend({implicit:[Dc(),Gc(),Bc(),Fc()]})})),jc=xt(((a,z)=>{z.exports=Vc()})),zc=xt(((a,z)=>{var d=Yt(),k=new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"),v=new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$");function P(j){return j===null?!1:k.exec(j)!==null||v.exec(j)!==null}function R(j){let L=0,H=null,w=k.exec(j);if(w===null&&(w=v.exec(j)),w===null)throw new Error("Date resolve error");const B=+w[1],Q=+w[2]-1,ce=+w[3];if(!w[4])return new Date(Date.UTC(B,Q,ce));const $=+w[4],ve=+w[5],se=+w[6];if(w[7]){for(L=w[7].slice(0,3);L.length<3;)L+="0";L=+L}if(w[9]){const nn=+w[10],Ke=+(w[11]||0);H=(nn*60+Ke)*6e4,w[9]==="-"&&(H=-H)}const $e=new Date(Date.UTC(B,Q,ce,$,ve,se,L));return H&&$e.setTime($e.getTime()-H),$e}function C(j){return j.toISOString()}z.exports=new d("tag:yaml.org,2002:timestamp",{kind:"scalar",resolve:P,construct:R,instanceOf:Date,represent:C})})),Hc=xt(((a,z)=>{var d=Yt();function k(v){return v==="<<"||v===null}z.exports=new d("tag:yaml.org,2002:merge",{kind:"scalar",resolve:k})})),Kc=xt(((a,z)=>{var d=Yt(),k=`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=
\r`;function v(j){if(j===null)return!1;let L=0;const H=j.length,w=k;for(let B=0;B<H;B++){const Q=w.indexOf(j.charAt(B));if(!(Q>64)){if(Q<0)return!1;L+=6}}return L%8===0}function P(j){const L=j.replace(/[\r\n=]/g,""),H=L.length,w=k;let B=0;const Q=[];for(let $=0;$<H;$++)$%4===0&&$&&(Q.push(B>>16&255),Q.push(B>>8&255),Q.push(B&255)),B=B<<6|w.indexOf(L.charAt($));const ce=H%4*6;return ce===0?(Q.push(B>>16&255),Q.push(B>>8&255),Q.push(B&255)):ce===18?(Q.push(B>>10&255),Q.push(B>>2&255)):ce===12&&Q.push(B>>4&255),new Uint8Array(Q)}function R(j){let L="",H=0;const w=j.length,B=k;for(let ce=0;ce<w;ce++)ce%3===0&&ce&&(L+=B[H>>18&63],L+=B[H>>12&63],L+=B[H>>6&63],L+=B[H&63]),H=(H<<8)+j[ce];const Q=w%3;return Q===0?(L+=B[H>>18&63],L+=B[H>>12&63],L+=B[H>>6&63],L+=B[H&63]):Q===2?(L+=B[H>>10&63],L+=B[H>>4&63],L+=B[H<<2&63],L+=B[64]):Q===1&&(L+=B[H>>2&63],L+=B[H<<4&63],L+=B[64],L+=B[64]),L}function C(j){return Object.prototype.toString.call(j)==="[object Uint8Array]"}z.exports=new d("tag:yaml.org,2002:binary",{kind:"scalar",resolve:v,construct:P,predicate:C,represent:R})})),Xc=xt(((a,z)=>{var d=Yt(),k=Object.prototype.hasOwnProperty,v=Object.prototype.toString;function P(C){if(C===null)return!0;const j=[],L=C;for(let H=0,w=L.length;H<w;H+=1){const B=L[H];let Q=!1;if(v.call(B)!=="[object Object]")return!1;let ce;for(ce in B)if(k.call(B,ce))if(!Q)Q=!0;else return!1;if(!Q)return!1;if(j.indexOf(ce)===-1)j.push(ce);else return!1}return!0}function R(C){return C!==null?C:[]}z.exports=new d("tag:yaml.org,2002:omap",{kind:"sequence",resolve:P,construct:R})})),qc=xt(((a,z)=>{var d=Yt(),k=Object.prototype.toString;function v(R){if(R===null)return!0;const C=R,j=new Array(C.length);for(let L=0,H=C.length;L<H;L+=1){const w=C[L];if(k.call(w)!=="[object Object]")return!1;const B=Object.keys(w);if(B.length!==1)return!1;j[L]=[B[0],w[B[0]]]}return!0}function P(R){if(R===null)return[];const C=R,j=new Array(C.length);for(let L=0,H=C.length;L<H;L+=1){const w=C[L],B=Object.keys(w);j[L]=[B[0],w[B[0]]]}return j}z.exports=new d("tag:yaml.org,2002:pairs",{kind:"sequence",resolve:v,construct:P})})),Wc=xt(((a,z)=>{var d=Yt(),k=Object.prototype.hasOwnProperty;function v(R){if(R===null)return!0;const C=R;for(const j in C)if(k.call(C,j)&&C[j]!==null)return!1;return!0}function P(R){return R!==null?R:{}}z.exports=new d("tag:yaml.org,2002:set",{kind:"mapping",resolve:v,construct:P})})),ns=xt(((a,z)=>{z.exports=jc().extend({implicit:[zc(),Hc()],explicit:[Kc(),Xc(),qc(),Wc()]})})),Jp=xt(((a,z)=>{var d=ml(),k=gl(),v=Zp(),P=ns(),R=Object.prototype.hasOwnProperty,C=1,j=2,L=3,H=4,w=1,B=2,Q=3,ce=/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/,$=/[\x85\u2028\u2029]/,ve=/[,\[\]{}]/,se=/^(?:!|!!|![0-9A-Za-z-]+!)$/,$e=/^(?:!|[^,\[\]{}])(?:%[0-9a-f]{2}|[0-9a-z\-#;/?:@&=+$,_.!~*'()\[\]])*$/i;function nn(o){return Object.prototype.toString.call(o)}function Ke(o){return o===10||o===13}function Xe(o){return o===9||o===32}function ln(o){return o===9||o===32||o===10||o===13}function D(o){return o===44||o===91||o===93||o===123||o===125}function re(o){if(o>=48&&o<=57)return o-48;const de=o|32;return de>=97&&de<=102?de-97+10:-1}function ke(o){return o===120?2:o===117?4:o===85?8:0}function ge(o){return o>=48&&o<=57?o-48:-1}function Oe(o){switch(o){case 48:return"\0";case 97:return"\x07";case 98:return"\b";case 116:return"	";case 9:return"	";case 110:return`
`;case 118:return"\v";case 102:return"\f";case 114:return"\r";case 101:return"\x1B";case 32:return" ";case 34:return'"';case 47:return"/";case 92:return"\\";case 78:return"";case 95:return" ";case 76:return"\u2028";case 80:return"\u2029";default:return""}}function tn(o){return o<=65535?String.fromCharCode(o):String.fromCharCode((o-65536>>10)+55296,(o-65536&1023)+56320)}function an(o,de,h){de==="__proto__"?Object.defineProperty(o,de,{configurable:!0,enumerable:!0,writable:!0,value:h}):o[de]=h}var sn=new Array(256),ae=new Array(256);for(let o=0;o<256;o++)sn[o]=Oe(o)?1:0,ae[o]=Oe(o);function oe(o,de){this.input=o,this.filename=de.filename||null,this.schema=de.schema||P,this.onWarning=de.onWarning||null,this.legacy=de.legacy||!1,this.json=de.json||!1,this.listener=de.listener||null,this.maxDepth=typeof de.maxDepth=="number"?de.maxDepth:100,this.maxMergeSeqLength=typeof de.maxMergeSeqLength=="number"?de.maxMergeSeqLength:20,this.implicitTypes=this.schema.compiledImplicit,this.typeMap=this.schema.compiledTypeMap,this.length=o.length,this.position=0,this.line=0,this.lineStart=0,this.lineIndent=0,this.depth=0,this.firstTabInLine=-1,this.documents=[],this.anchorMapTransactions=[]}function ze(o,de){const h={name:o.filename,buffer:o.input.slice(0,-1),position:o.position,line:o.line,column:o.position-o.lineStart};return h.snippet=v(h),new k(de,h)}function M(o,de){throw ze(o,de)}function Ce(o,de){o.onWarning&&o.onWarning.call(null,ze(o,de))}function T(o,de,h){const q=o.anchorMapTransactions;if(q.length!==0){const F=q[q.length-1];R.call(F,de)||(F[de]={existed:R.call(o.anchorMap,de),value:o.anchorMap[de]})}o.anchorMap[de]=h}function g(o){o.anchorMapTransactions.push(Object.create(null))}function S(o){const de=o.anchorMapTransactions.pop(),h=o.anchorMapTransactions;if(h.length===0)return;const q=h[h.length-1],F=Object.keys(de);for(let J=0,f=F.length;J<f;J+=1){const I=F[J];R.call(q,I)||(q[I]=de[I])}}function xe(o){const de=o.anchorMapTransactions.pop(),h=Object.keys(de);for(let q=h.length-1;q>=0;q-=1){const F=de[h[q]];F.existed?o.anchorMap[h[q]]=F.value:delete o.anchorMap[h[q]]}}function Ae(o){return{position:o.position,line:o.line,lineStart:o.lineStart,lineIndent:o.lineIndent,firstTabInLine:o.firstTabInLine,tag:o.tag,anchor:o.anchor,kind:o.kind,result:o.result}}function pn(o,de){o.position=de.position,o.line=de.line,o.lineStart=de.lineStart,o.lineIndent=de.lineIndent,o.firstTabInLine=de.firstTabInLine,o.tag=de.tag,o.anchor=de.anchor,o.kind=de.kind,o.result=de.result}var Ze={YAML:function(de,h,q){de.version!==null&&M(de,"duplication of %YAML directive"),q.length!==1&&M(de,"YAML directive accepts exactly one argument");const F=/^([0-9]+)\.([0-9]+)$/.exec(q[0]);F===null&&M(de,"ill-formed argument of the YAML directive");const J=parseInt(F[1],10),f=parseInt(F[2],10);J!==1&&M(de,"unacceptable YAML version of the document"),de.version=q[0],de.checkLineBreaks=f<2,f!==1&&f!==2&&Ce(de,"unsupported YAML version of the document")},TAG:function(de,h,q){let F;q.length!==2&&M(de,"TAG directive accepts exactly two arguments");const J=q[0];F=q[1],se.test(J)||M(de,"ill-formed tag handle (first argument) of the TAG directive"),R.call(de.tagMap,J)&&M(de,'there is a previously declared suffix for "'+J+'" tag handle'),$e.test(F)||M(de,"ill-formed tag prefix (second argument) of the TAG directive");try{F=decodeURIComponent(F)}catch{M(de,"tag prefix is malformed: "+F)}de.tagMap[J]=F}};function dn(o,de,h,q){if(de<h){const F=o.input.slice(de,h);if(q)for(let J=0,f=F.length;J<f;J+=1){const I=F.charCodeAt(J);I===9||I>=32&&I<=1114111||M(o,"expected valid JSON character")}else ce.test(F)&&M(o,"the stream contains non-printable characters");o.result+=F}}function mn(o,de,h,q){d.isObject(h)||M(o,"cannot merge mappings; the provided source object is unacceptable");const F=Object.keys(h);for(let J=0,f=F.length;J<f;J+=1){const I=F[J];R.call(de,I)||(an(de,I,h[I]),q[I]=!0)}}function Y(o,de,h,q,F,J,f,I,te){if(Array.isArray(F)){F=Array.prototype.slice.call(F);for(let Ee=0,Le=F.length;Ee<Le;Ee+=1)Array.isArray(F[Ee])&&M(o,"nested arrays are not supported inside keys"),typeof F=="object"&&nn(F[Ee])==="[object Object]"&&(F[Ee]="[object Object]")}if(typeof F=="object"&&nn(F)==="[object Object]"&&(F="[object Object]"),F=String(F),de===null&&(de={}),q==="tag:yaml.org,2002:merge")if(Array.isArray(J)){J.length>o.maxMergeSeqLength&&M(o,"merge sequence length exceeded maxMergeSeqLength ("+o.maxMergeSeqLength+")");const Ee=new Set;for(let Le=0,De=J.length;Le<De;Le+=1){const qe=J[Le];Ee.has(qe)||(Ee.add(qe),mn(o,de,qe,h))}}else mn(o,de,J,h);else!o.json&&!R.call(h,F)&&R.call(de,F)&&(o.line=f||o.line,o.lineStart=I||o.lineStart,o.position=te||o.position,M(o,"duplicated mapping key")),an(de,F,J),delete h[F];return de}function ee(o){const de=o.input.charCodeAt(o.position);de===10?o.position++:de===13?(o.position++,o.input.charCodeAt(o.position)===10&&o.position++):M(o,"a line break is expected"),o.line+=1,o.lineStart=o.position,o.firstTabInLine=-1}function Ie(o,de,h){let q=0,F=o.input.charCodeAt(o.position);for(;F!==0;){for(;Xe(F);)F===9&&o.firstTabInLine===-1&&(o.firstTabInLine=o.position),F=o.input.charCodeAt(++o.position);if(de&&F===35)do F=o.input.charCodeAt(++o.position);while(F!==10&&F!==13&&F!==0);if(Ke(F))for(ee(o),F=o.input.charCodeAt(o.position),q++,o.lineIndent=0;F===32;)o.lineIndent++,F=o.input.charCodeAt(++o.position);else break}return h!==-1&&q!==0&&o.lineIndent<h&&Ce(o,"deficient indentation"),q}function Te(o){let de=o.position,h=o.input.charCodeAt(de);return!!((h===45||h===46)&&h===o.input.charCodeAt(de+1)&&h===o.input.charCodeAt(de+2)&&(de+=3,h=o.input.charCodeAt(de),h===0||ln(h)))}function rn(o,de){de===1?o.result+=" ":de>1&&(o.result+=d.repeat(`
`,de-1))}function On(o,de,h){let q,F,J,f,I,te;const Ee=o.kind,Le=o.result;let De=o.input.charCodeAt(o.position);if(ln(De)||D(De)||De===35||De===38||De===42||De===33||De===124||De===62||De===39||De===34||De===37||De===64||De===96)return!1;if(De===63||De===45){const qe=o.input.charCodeAt(o.position+1);if(ln(qe)||h&&D(qe))return!1}for(o.kind="scalar",o.result="",q=F=o.position,J=!1;De!==0;){if(De===58){const qe=o.input.charCodeAt(o.position+1);if(ln(qe)||h&&D(qe))break}else if(De===35){if(ln(o.input.charCodeAt(o.position-1)))break}else{if(o.position===o.lineStart&&Te(o)||h&&D(De))break;if(Ke(De))if(f=o.line,I=o.lineStart,te=o.lineIndent,Ie(o,!1,-1),o.lineIndent>=de){J=!0,De=o.input.charCodeAt(o.position);continue}else{o.position=F,o.line=f,o.lineStart=I,o.lineIndent=te;break}}J&&(dn(o,q,F,!1),rn(o,o.line-f),q=F=o.position,J=!1),Xe(De)||(F=o.position+1),De=o.input.charCodeAt(++o.position)}return dn(o,q,F,!1),o.result?!0:(o.kind=Ee,o.result=Le,!1)}function kn(o,de){let h,q,F=o.input.charCodeAt(o.position);if(F!==39)return!1;for(o.kind="scalar",o.result="",o.position++,h=q=o.position;(F=o.input.charCodeAt(o.position))!==0;)if(F===39)if(dn(o,h,o.position,!0),F=o.input.charCodeAt(++o.position),F===39)h=o.position,o.position++,q=o.position;else return!0;else Ke(F)?(dn(o,h,q,!0),rn(o,Ie(o,!1,de)),h=q=o.position):o.position===o.lineStart&&Te(o)?M(o,"unexpected end of the document within a single quoted scalar"):(o.position++,Xe(F)||(q=o.position));M(o,"unexpected end of the stream within a single quoted scalar")}function Je(o,de){let h,q,F,J=o.input.charCodeAt(o.position);if(J!==34)return!1;for(o.kind="scalar",o.result="",o.position++,h=q=o.position;(J=o.input.charCodeAt(o.position))!==0;){if(J===34)return dn(o,h,o.position,!0),o.position++,!0;if(J===92){if(dn(o,h,o.position,!0),J=o.input.charCodeAt(++o.position),Ke(J))Ie(o,!1,de);else if(J<256&&sn[J])o.result+=ae[J],o.position++;else if((F=ke(J))>0){let f=F,I=0;for(;f>0;f--)J=o.input.charCodeAt(++o.position),(F=re(J))>=0?I=(I<<4)+F:M(o,"expected hexadecimal character");o.result+=tn(I),o.position++}else M(o,"unknown escape sequence");h=q=o.position}else Ke(J)?(dn(o,h,q,!0),rn(o,Ie(o,!1,de)),h=q=o.position):o.position===o.lineStart&&Te(o)?M(o,"unexpected end of the document within a double quoted scalar"):(o.position++,Xe(J)||(q=o.position))}M(o,"unexpected end of the stream within a double quoted scalar")}function le(o,de){let h=!0,q,F,J;const f=o.tag;let I;const te=o.anchor;let Ee,Le,De,qe;const Fe=Object.create(null);let Ve,vn,l,s=o.input.charCodeAt(o.position);if(s===91)Ee=93,qe=!1,I=[];else if(s===123)Ee=125,qe=!0,I={};else return!1;for(o.anchor!==null&&T(o,o.anchor,I),s=o.input.charCodeAt(++o.position);s!==0;){if(Ie(o,!0,de),s=o.input.charCodeAt(o.position),s===Ee)return o.position++,o.tag=f,o.anchor=te,o.kind=qe?"mapping":"sequence",o.result=I,!0;h?s===44&&M(o,"expected the node content, but found ','"):M(o,"missed comma between flow collection entries"),vn=Ve=l=null,Le=De=!1,s===63&&ln(o.input.charCodeAt(o.position+1))&&(Le=De=!0,o.position++,Ie(o,!0,de)),q=o.line,F=o.lineStart,J=o.position,Nn(o,de,C,!1,!0),vn=o.tag,Ve=o.result,Ie(o,!0,de),s=o.input.charCodeAt(o.position),(De||o.line===q)&&s===58&&(Le=!0,s=o.input.charCodeAt(++o.position),Ie(o,!0,de),Nn(o,de,C,!1,!0),l=o.result),qe?Y(o,I,Fe,vn,Ve,l,q,F,J):Le?I.push(Y(o,null,Fe,vn,Ve,l,q,F,J)):I.push(Ve),Ie(o,!0,de),s=o.input.charCodeAt(o.position),s===44?(h=!0,s=o.input.charCodeAt(++o.position)):h=!1}M(o,"unexpected end of the stream within a flow collection")}function Ue(o,de){let h,q=w,F=!1,J=!1,f=de,I=0,te=!1,Ee,Le=o.input.charCodeAt(o.position);if(Le===124)h=!1;else if(Le===62)h=!0;else return!1;for(o.kind="scalar",o.result="";Le!==0;)if(Le=o.input.charCodeAt(++o.position),Le===43||Le===45)w===q?q=Le===43?Q:B:M(o,"repeat of a chomping mode identifier");else if((Ee=ge(Le))>=0)Ee===0?M(o,"bad explicit indentation width of a block scalar; it cannot be less than one"):J?M(o,"repeat of an indentation width identifier"):(f=de+Ee-1,J=!0);else break;if(Xe(Le)){do Le=o.input.charCodeAt(++o.position);while(Xe(Le));if(Le===35)do Le=o.input.charCodeAt(++o.position);while(!Ke(Le)&&Le!==0)}for(;Le!==0;){for(ee(o),o.lineIndent=0,Le=o.input.charCodeAt(o.position);(!J||o.lineIndent<f)&&Le===32;)o.lineIndent++,Le=o.input.charCodeAt(++o.position);if(!J&&o.lineIndent>f&&(f=o.lineIndent),Ke(Le)){I++;continue}if(!J&&f===0&&M(o,"missing indentation for block scalar"),o.lineIndent<f){q===Q?o.result+=d.repeat(`
`,F?1+I:I):q===w&&F&&(o.result+=`
`);break}h?Xe(Le)?(te=!0,o.result+=d.repeat(`
`,F?1+I:I)):te?(te=!1,o.result+=d.repeat(`
`,I+1)):I===0?F&&(o.result+=" "):o.result+=d.repeat(`
`,I):o.result+=d.repeat(`
`,F?1+I:I),F=!0,J=!0,I=0;const De=o.position;for(;!Ke(Le)&&Le!==0;)Le=o.input.charCodeAt(++o.position);dn(o,De,o.position,!1)}return!0}function N(o,de){const h=o.tag,q=o.anchor,F=[];let J=!1;if(o.firstTabInLine!==-1)return!1;o.anchor!==null&&T(o,o.anchor,F);let f=o.input.charCodeAt(o.position);for(;f!==0&&(o.firstTabInLine!==-1&&(o.position=o.firstTabInLine,M(o,"tab characters must not be used in indentation")),!(f!==45||!ln(o.input.charCodeAt(o.position+1))));){if(J=!0,o.position++,Ie(o,!0,-1)&&o.lineIndent<=de){F.push(null),f=o.input.charCodeAt(o.position);continue}const I=o.line;if(Nn(o,de,L,!1,!0),F.push(o.result),Ie(o,!0,-1),f=o.input.charCodeAt(o.position),(o.line===I||o.lineIndent>de)&&f!==0)M(o,"bad indentation of a sequence entry");else if(o.lineIndent<de)break}return J?(o.tag=h,o.anchor=q,o.kind="sequence",o.result=F,!0):!1}function me(o,de,h){let q,F,J,f;const I=o.tag,te=o.anchor,Ee={},Le=Object.create(null);let De=null,qe=null,Fe=null,Ve=!1,vn=!1;if(o.firstTabInLine!==-1)return!1;o.anchor!==null&&T(o,o.anchor,Ee);let l=o.input.charCodeAt(o.position);for(;l!==0;){!Ve&&o.firstTabInLine!==-1&&(o.position=o.firstTabInLine,M(o,"tab characters must not be used in indentation"));const s=o.input.charCodeAt(o.position+1),_=o.line;if((l===63||l===58)&&ln(s))l===63?(Ve&&(Y(o,Ee,Le,De,qe,null,F,J,f),De=qe=Fe=null),vn=!0,Ve=!0,q=!0):Ve?(Ve=!1,q=!0):M(o,"incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line"),o.position+=1,l=s;else{if(F=o.line,J=o.lineStart,f=o.position,!Nn(o,h,j,!1,!0))break;if(o.line===_){for(l=o.input.charCodeAt(o.position);Xe(l);)l=o.input.charCodeAt(++o.position);if(l===58)l=o.input.charCodeAt(++o.position),ln(l)||M(o,"a whitespace character is expected after the key-value separator within a block mapping"),Ve&&(Y(o,Ee,Le,De,qe,null,F,J,f),De=qe=Fe=null),vn=!0,Ve=!1,q=!1,De=o.tag,qe=o.result;else if(vn)M(o,"can not read an implicit mapping pair; a colon is missed");else return o.tag=I,o.anchor=te,!0}else if(vn)M(o,"can not read a block mapping entry; a multiline key may not be an implicit key");else return o.tag=I,o.anchor=te,!0}if((o.line===_||o.lineIndent>de)&&(Ve&&(F=o.line,J=o.lineStart,f=o.position),Nn(o,de,H,!0,q)&&(Ve?qe=o.result:Fe=o.result),Ve||(Y(o,Ee,Le,De,qe,Fe,F,J,f),De=qe=Fe=null),Ie(o,!0,-1),l=o.input.charCodeAt(o.position)),(o.line===_||o.lineIndent>de)&&l!==0)M(o,"bad indentation of a mapping entry");else if(o.lineIndent<de)break}return Ve&&Y(o,Ee,Le,De,qe,null,F,J,f),vn&&(o.tag=I,o.anchor=te,o.kind="mapping",o.result=Ee),vn}function He(o){let de=!1,h=!1,q,F,J=o.input.charCodeAt(o.position);if(J!==33)return!1;o.tag!==null&&M(o,"duplication of a tag property"),J=o.input.charCodeAt(++o.position),J===60?(de=!0,J=o.input.charCodeAt(++o.position)):J===33?(h=!0,q="!!",J=o.input.charCodeAt(++o.position)):q="!";let f=o.position;if(de){do J=o.input.charCodeAt(++o.position);while(J!==0&&J!==62);o.position<o.length?(F=o.input.slice(f,o.position),J=o.input.charCodeAt(++o.position)):M(o,"unexpected end of the stream within a verbatim tag")}else{for(;J!==0&&!ln(J);)J===33&&(h?M(o,"tag suffix cannot contain exclamation marks"):(q=o.input.slice(f-1,o.position+1),se.test(q)||M(o,"named tag handle cannot contain such characters"),h=!0,f=o.position+1)),J=o.input.charCodeAt(++o.position);F=o.input.slice(f,o.position),ve.test(F)&&M(o,"tag suffix cannot contain flow indicator characters")}F&&!$e.test(F)&&M(o,"tag name cannot contain such characters: "+F);try{F=decodeURIComponent(F)}catch{M(o,"tag name is malformed: "+F)}return de?o.tag=F:R.call(o.tagMap,q)?o.tag=o.tagMap[q]+F:q==="!"?o.tag="!"+F:q==="!!"?o.tag="tag:yaml.org,2002:"+F:M(o,'undeclared tag handle "'+q+'"'),!0}function G(o){let de=o.input.charCodeAt(o.position);if(de!==38)return!1;o.anchor!==null&&M(o,"duplication of an anchor property"),de=o.input.charCodeAt(++o.position);const h=o.position;for(;de!==0&&!ln(de)&&!D(de);)de=o.input.charCodeAt(++o.position);return o.position===h&&M(o,"name of an anchor node must contain at least one character"),o.anchor=o.input.slice(h,o.position),!0}function be(o){let de=o.input.charCodeAt(o.position);if(de!==42)return!1;de=o.input.charCodeAt(++o.position);const h=o.position;for(;de!==0&&!ln(de)&&!D(de);)de=o.input.charCodeAt(++o.position);o.position===h&&M(o,"name of an alias node must contain at least one character");const q=o.input.slice(h,o.position);return R.call(o.anchorMap,q)||M(o,'unidentified alias "'+q+'"'),o.result=o.anchorMap[q],Ie(o,!0,-1),!0}function Pe(o,de,h,q){const F=Ae(o);return g(o),pn(o,de),o.tag=null,o.anchor=null,o.kind=null,o.result=null,me(o,h,q)&&o.kind==="mapping"?(S(o),!0):(xe(o),pn(o,F),!1)}function Nn(o,de,h,q,F){let J,f,I=1,te=!1,Ee=!1,Le=null,De,qe,Fe;o.depth>=o.maxDepth&&M(o,"nesting exceeded maxDepth ("+o.maxDepth+")"),o.depth+=1,o.listener!==null&&o.listener("open",o),o.tag=null,o.anchor=null,o.kind=null,o.result=null;const Ve=J=f=H===h||L===h;if(q&&Ie(o,!0,-1)&&(te=!0,o.lineIndent>de?I=1:o.lineIndent===de?I=0:o.lineIndent<de&&(I=-1)),I===1)for(;;){const vn=o.input.charCodeAt(o.position),l=Ae(o);if(te&&(vn===33&&o.tag!==null||vn===38&&o.anchor!==null)||!He(o)&&!G(o))break;Le===null&&(Le=l),Ie(o,!0,-1)?(te=!0,f=Ve,o.lineIndent>de?I=1:o.lineIndent===de?I=0:o.lineIndent<de&&(I=-1)):f=!1}if(f&&(f=te||F),I===1||H===h)if(C===h||j===h?qe=de:qe=de+1,Fe=o.position-o.lineStart,I===1)if(f&&(N(o,Fe)||me(o,Fe,qe))||le(o,qe))Ee=!0;else{const vn=o.input.charCodeAt(o.position);Le!==null&&Ve&&!f&&vn!==124&&vn!==62&&Pe(o,Le,Le.position-Le.lineStart,qe)||J&&Ue(o,qe)||kn(o,qe)||Je(o,qe)?Ee=!0:be(o)?(Ee=!0,(o.tag!==null||o.anchor!==null)&&M(o,"alias node should not have any properties")):On(o,qe,C===h)&&(Ee=!0,o.tag===null&&(o.tag="?")),o.anchor!==null&&T(o,o.anchor,o.result)}else I===0&&(Ee=f&&N(o,Fe));if(o.tag===null)o.anchor!==null&&T(o,o.anchor,o.result);else if(o.tag==="?"){o.result!==null&&o.kind!=="scalar"&&M(o,'unacceptable node kind for !<?> tag; it should be "scalar", not "'+o.kind+'"');for(let vn=0,l=o.implicitTypes.length;vn<l;vn+=1)if(De=o.implicitTypes[vn],De.resolve(o.result)){o.result=De.construct(o.result),o.tag=De.tag,o.anchor!==null&&T(o,o.anchor,o.result);break}}else if(o.tag!=="!"){if(R.call(o.typeMap[o.kind||"fallback"],o.tag))De=o.typeMap[o.kind||"fallback"][o.tag];else{De=null;const vn=o.typeMap.multi[o.kind||"fallback"];for(let l=0,s=vn.length;l<s;l+=1)if(o.tag.slice(0,vn[l].tag.length)===vn[l].tag){De=vn[l];break}}De||M(o,"unknown tag !<"+o.tag+">"),o.result!==null&&De.kind!==o.kind&&M(o,"unacceptable node kind for !<"+o.tag+'> tag; it should be "'+De.kind+'", not "'+o.kind+'"'),De.resolve(o.result,o.tag)?(o.result=De.construct(o.result,o.tag),o.anchor!==null&&T(o,o.anchor,o.result)):M(o,"cannot resolve a node with !<"+o.tag+"> explicit tag")}return o.listener!==null&&o.listener("close",o),o.depth-=1,o.tag!==null||o.anchor!==null||Ee}function Un(o){const de=o.position;let h=!1,q;for(o.version=null,o.checkLineBreaks=o.legacy,o.tagMap=Object.create(null),o.anchorMap=Object.create(null);(q=o.input.charCodeAt(o.position))!==0&&(Ie(o,!0,-1),q=o.input.charCodeAt(o.position),!(o.lineIndent>0||q!==37));){h=!0,q=o.input.charCodeAt(++o.position);let F=o.position;for(;q!==0&&!ln(q);)q=o.input.charCodeAt(++o.position);const J=o.input.slice(F,o.position),f=[];for(J.length<1&&M(o,"directive name must not be less than one character in length");q!==0;){for(;Xe(q);)q=o.input.charCodeAt(++o.position);if(q===35){do q=o.input.charCodeAt(++o.position);while(q!==0&&!Ke(q));break}if(Ke(q))break;for(F=o.position;q!==0&&!ln(q);)q=o.input.charCodeAt(++o.position);f.push(o.input.slice(F,o.position))}q!==0&&ee(o),R.call(Ze,J)?Ze[J](o,J,f):Ce(o,'unknown document directive "'+J+'"')}if(Ie(o,!0,-1),o.lineIndent===0&&o.input.charCodeAt(o.position)===45&&o.input.charCodeAt(o.position+1)===45&&o.input.charCodeAt(o.position+2)===45?(o.position+=3,Ie(o,!0,-1)):h&&M(o,"directives end mark is expected"),Nn(o,o.lineIndent-1,H,!1,!0),Ie(o,!0,-1),o.checkLineBreaks&&$.test(o.input.slice(de,o.position))&&Ce(o,"non-ASCII line breaks are interpreted as content"),o.documents.push(o.result),o.position===o.lineStart&&Te(o)){o.input.charCodeAt(o.position)===46&&(o.position+=3,Ie(o,!0,-1));return}o.position<o.length-1&&M(o,"end of the stream or a document separator is expected")}function Mn(o,de){o=String(o),de=de||{},o.length!==0&&(o.charCodeAt(o.length-1)!==10&&o.charCodeAt(o.length-1)!==13&&(o+=`
`),o.charCodeAt(0)===65279&&(o=o.slice(1)));const h=new oe(o,de),q=o.indexOf("\0");for(q!==-1&&(h.position=q,M(h,"null byte is not allowed in input")),h.input+="\0";h.input.charCodeAt(h.position)===32;)h.lineIndent+=1,h.position+=1;for(;h.position<h.length-1;)Un(h);return h.documents}function Zn(o,de,h){de!==null&&typeof de=="object"&&typeof h>"u"&&(h=de,de=null);const q=Mn(o,h);if(typeof de!="function")return q;for(let F=0,J=q.length;F<J;F+=1)de(q[F])}function ot(o,de){const h=Mn(o,de);if(h.length!==0){if(h.length===1)return h[0];throw new k("expected a single document in the stream, but found more")}}z.exports.loadAll=Zn,z.exports.load=ot})),e_=xt(((a,z)=>{var d=ml(),k=gl(),v=ns(),P=Object.prototype.toString,R=Object.prototype.hasOwnProperty,C=65279,j=9,L=10,H=13,w=32,B=33,Q=34,ce=35,$=37,ve=38,se=39,$e=42,nn=44,Ke=45,Xe=58,ln=61,D=62,re=63,ke=64,ge=91,Oe=93,tn=96,an=123,sn=124,ae=125,oe={};oe[0]="\\0",oe[7]="\\a",oe[8]="\\b",oe[9]="\\t",oe[10]="\\n",oe[11]="\\v",oe[12]="\\f",oe[13]="\\r",oe[27]="\\e",oe[34]='\\"',oe[92]="\\\\",oe[133]="\\N",oe[160]="\\_",oe[8232]="\\L",oe[8233]="\\P";var ze=["y","Y","yes","Yes","YES","on","On","ON","n","N","no","No","NO","off","Off","OFF"],M=/^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;function Ce(f,I){if(I===null)return{};const te={},Ee=Object.keys(I);for(let Le=0,De=Ee.length;Le<De;Le+=1){let qe=Ee[Le],Fe=String(I[qe]);qe.slice(0,2)==="!!"&&(qe="tag:yaml.org,2002:"+qe.slice(2));const Ve=f.compiledTypeMap.fallback[qe];Ve&&R.call(Ve.styleAliases,Fe)&&(Fe=Ve.styleAliases[Fe]),te[qe]=Fe}return te}function T(f){let I,te;const Ee=f.toString(16).toUpperCase();if(f<=255)I="x",te=2;else if(f<=65535)I="u",te=4;else if(f<=4294967295)I="U",te=8;else throw new k("code point within a string may not be greater than 0xFFFFFFFF");return"\\"+I+d.repeat("0",te-Ee.length)+Ee}var g=1,S=2;function xe(f){this.schema=f.schema||v,this.indent=Math.max(1,f.indent||2),this.noArrayIndent=f.noArrayIndent||!1,this.skipInvalid=f.skipInvalid||!1,this.flowLevel=d.isNothing(f.flowLevel)?-1:f.flowLevel,this.styleMap=Ce(this.schema,f.styles||null),this.sortKeys=f.sortKeys||!1,this.lineWidth=f.lineWidth||80,this.noRefs=f.noRefs||!1,this.noCompatMode=f.noCompatMode||!1,this.condenseFlow=f.condenseFlow||!1,this.quotingType=f.quotingType==='"'?S:g,this.forceQuotes=f.forceQuotes||!1,this.replacer=typeof f.replacer=="function"?f.replacer:null,this.implicitTypes=this.schema.compiledImplicit,this.explicitTypes=this.schema.compiledExplicit,this.tag=null,this.result="",this.duplicates=[],this.usedDuplicates=null}function Ae(f,I){const te=d.repeat(" ",I);let Ee=0,Le="";const De=f.length;for(;Ee<De;){let qe;const Fe=f.indexOf(`
`,Ee);Fe===-1?(qe=f.slice(Ee),Ee=De):(qe=f.slice(Ee,Fe+1),Ee=Fe+1),qe.length&&qe!==`
`&&(Le+=te),Le+=qe}return Le}function pn(f,I){return`
`+d.repeat(" ",f.indent*I)}function Ze(f,I){for(let te=0,Ee=f.implicitTypes.length;te<Ee;te+=1)if(f.implicitTypes[te].resolve(I))return!0;return!1}function dn(f){return f===w||f===j}function mn(f){return f>=32&&f<=126||f>=161&&f<=55295&&f!==8232&&f!==8233||f>=57344&&f<=65533&&f!==C||f>=65536&&f<=1114111}function Y(f){return mn(f)&&f!==C&&f!==H&&f!==L}function ee(f,I,te){const Ee=Y(f),Le=Ee&&!dn(f);return(te?Ee:Ee&&f!==nn&&f!==ge&&f!==Oe&&f!==an&&f!==ae)&&f!==ce&&!(I===Xe&&!Le)||Y(I)&&!dn(I)&&f===ce||I===Xe&&Le}function Ie(f){return mn(f)&&f!==C&&!dn(f)&&f!==Ke&&f!==re&&f!==Xe&&f!==nn&&f!==ge&&f!==Oe&&f!==an&&f!==ae&&f!==ce&&f!==ve&&f!==$e&&f!==B&&f!==sn&&f!==ln&&f!==D&&f!==se&&f!==Q&&f!==$&&f!==ke&&f!==tn}function Te(f){return!dn(f)&&f!==Xe}function rn(f,I){const te=f.charCodeAt(I);let Ee;return te>=55296&&te<=56319&&I+1<f.length&&(Ee=f.charCodeAt(I+1),Ee>=56320&&Ee<=57343)?(te-55296)*1024+Ee-56320+65536:te}function On(f){return/^\n* /.test(f)}var kn=1,Je=2,le=3,Ue=4,N=5;function me(f,I,te,Ee,Le,De,qe,Fe){let Ve,vn=0,l=null,s=!1,_=!1;const c=Ee!==-1;let m=-1,O=Ie(rn(f,0))&&Te(rn(f,f.length-1));if(I||qe)for(Ve=0;Ve<f.length;vn>=65536?Ve+=2:Ve++){if(vn=rn(f,Ve),!mn(vn))return N;O=O&&ee(vn,l,Fe),l=vn}else{for(Ve=0;Ve<f.length;vn>=65536?Ve+=2:Ve++){if(vn=rn(f,Ve),vn===L)s=!0,c&&(_=_||Ve-m-1>Ee&&f[m+1]!==" ",m=Ve);else if(!mn(vn))return N;O=O&&ee(vn,l,Fe),l=vn}_=_||c&&Ve-m-1>Ee&&f[m+1]!==" "}return!s&&!_?O&&!qe&&!Le(f)?kn:De===S?N:Je:te>9&&On(f)?N:qe?De===S?N:Je:_?Ue:le}function He(f,I,te,Ee,Le){f.dump=(function(){if(I.length===0)return f.quotingType===S?'""':"''";if(!f.noCompatMode&&(ze.indexOf(I)!==-1||M.test(I)))return f.quotingType===S?'"'+I+'"':"'"+I+"'";const De=f.indent*Math.max(1,te),qe=f.lineWidth===-1?-1:Math.max(Math.min(f.lineWidth,40),f.lineWidth-De),Fe=Ee||f.flowLevel>-1&&te>=f.flowLevel;function Ve(vn){return Ze(f,vn)}switch(me(I,Fe,f.indent,qe,Ve,f.quotingType,f.forceQuotes&&!Ee,Le)){case kn:return I;case Je:return"'"+I.replace(/'/g,"''")+"'";case le:return"|"+G(I,f.indent)+be(Ae(I,De));case Ue:return">"+G(I,f.indent)+be(Ae(Pe(I,qe),De));case N:return'"'+Un(I)+'"';default:throw new k("impossible error: invalid scalar style")}})()}function G(f,I){const te=On(f)?String(I):"",Ee=f[f.length-1]===`
`;return te+(Ee&&(f[f.length-2]===`
`||f===`
`)?"+":Ee?"":"-")+`
`}function be(f){return f[f.length-1]===`
`?f.slice(0,-1):f}function Pe(f,I){const te=/(\n+)([^\n]*)/g;let Ee=(function(){let Fe=f.indexOf(`
`);return Fe=Fe!==-1?Fe:f.length,te.lastIndex=Fe,Nn(f.slice(0,Fe),I)})(),Le=f[0]===`
`||f[0]===" ",De,qe;for(;qe=te.exec(f);){const Fe=qe[1],Ve=qe[2];De=Ve[0]===" ",Ee+=Fe+(!Le&&!De&&Ve!==""?`
`:"")+Nn(Ve,I),Le=De}return Ee}function Nn(f,I){if(f===""||f[0]===" ")return f;const te=/ [^ ]/g;let Ee,Le=0,De,qe=0,Fe=0,Ve="";for(;Ee=te.exec(f);)Fe=Ee.index,Fe-Le>I&&(De=qe>Le?qe:Fe,Ve+=`
`+f.slice(Le,De),Le=De+1),qe=Fe;return Ve+=`
`,f.length-Le>I&&qe>Le?Ve+=f.slice(Le,qe)+`
`+f.slice(qe+1):Ve+=f.slice(Le),Ve.slice(1)}function Un(f){let I="",te=0;for(let Ee=0;Ee<f.length;te>=65536?Ee+=2:Ee++){te=rn(f,Ee);const Le=oe[te];!Le&&mn(te)?(I+=f[Ee],te>=65536&&(I+=f[Ee+1])):I+=Le||T(te)}return I}function Mn(f,I,te){let Ee="";const Le=f.tag;for(let De=0,qe=te.length;De<qe;De+=1){let Fe=te[De];f.replacer&&(Fe=f.replacer.call(te,String(De),Fe)),(h(f,I,Fe,!1,!1)||typeof Fe>"u"&&h(f,I,null,!1,!1))&&(Ee!==""&&(Ee+=","+(f.condenseFlow?"":" ")),Ee+=f.dump)}f.tag=Le,f.dump="["+Ee+"]"}function Zn(f,I,te,Ee){let Le="";const De=f.tag;for(let qe=0,Fe=te.length;qe<Fe;qe+=1){let Ve=te[qe];f.replacer&&(Ve=f.replacer.call(te,String(qe),Ve)),(h(f,I+1,Ve,!0,!0,!1,!0)||typeof Ve>"u"&&h(f,I+1,null,!0,!0,!1,!0))&&((!Ee||Le!=="")&&(Le+=pn(f,I)),f.dump&&L===f.dump.charCodeAt(0)?Le+="-":Le+="- ",Le+=f.dump)}f.tag=De,f.dump=Le||"[]"}function ot(f,I,te){let Ee="";const Le=f.tag,De=Object.keys(te);for(let qe=0,Fe=De.length;qe<Fe;qe+=1){let Ve="";Ee!==""&&(Ve+=", "),f.condenseFlow&&(Ve+='"');const vn=De[qe];let l=te[vn];f.replacer&&(l=f.replacer.call(te,vn,l)),h(f,I,vn,!1,!1)&&(f.dump.length>1024&&(Ve+="? "),Ve+=f.dump+(f.condenseFlow?'"':"")+":"+(f.condenseFlow?"":" "),h(f,I,l,!1,!1)&&(Ve+=f.dump,Ee+=Ve))}f.tag=Le,f.dump="{"+Ee+"}"}function o(f,I,te,Ee){let Le="";const De=f.tag,qe=Object.keys(te);if(f.sortKeys===!0)qe.sort();else if(typeof f.sortKeys=="function")qe.sort(f.sortKeys);else if(f.sortKeys)throw new k("sortKeys must be a boolean or a function");for(let Fe=0,Ve=qe.length;Fe<Ve;Fe+=1){let vn="";(!Ee||Le!=="")&&(vn+=pn(f,I));const l=qe[Fe];let s=te[l];if(f.replacer&&(s=f.replacer.call(te,l,s)),!h(f,I+1,l,!0,!0,!0))continue;const _=f.tag!==null&&f.tag!=="?"||f.dump&&f.dump.length>1024;_&&(f.dump&&L===f.dump.charCodeAt(0)?vn+="?":vn+="? "),vn+=f.dump,_&&(vn+=pn(f,I)),h(f,I+1,s,!0,_)&&(f.dump&&L===f.dump.charCodeAt(0)?vn+=":":vn+=": ",vn+=f.dump,Le+=vn)}f.tag=De,f.dump=Le||"{}"}function de(f,I,te){const Ee=te?f.explicitTypes:f.implicitTypes;for(let Le=0,De=Ee.length;Le<De;Le+=1){const qe=Ee[Le];if((qe.instanceOf||qe.predicate)&&(!qe.instanceOf||typeof I=="object"&&I instanceof qe.instanceOf)&&(!qe.predicate||qe.predicate(I))){if(te?qe.multi&&qe.representName?f.tag=qe.representName(I):f.tag=qe.tag:f.tag="?",qe.represent){const Fe=f.styleMap[qe.tag]||qe.defaultStyle;let Ve;if(P.call(qe.represent)==="[object Function]")Ve=qe.represent(I,Fe);else if(R.call(qe.represent,Fe))Ve=qe.represent[Fe](I,Fe);else throw new k("!<"+qe.tag+'> tag resolver accepts not "'+Fe+'" style');f.dump=Ve}return!0}}return!1}function h(f,I,te,Ee,Le,De,qe){f.tag=null,f.dump=te,de(f,te,!1)||de(f,te,!0);const Fe=P.call(f.dump),Ve=Ee;Ee&&(Ee=f.flowLevel<0||f.flowLevel>I);const vn=Fe==="[object Object]"||Fe==="[object Array]";let l,s;if(vn&&(l=f.duplicates.indexOf(te),s=l!==-1),(f.tag!==null&&f.tag!=="?"||s||f.indent!==2&&I>0)&&(Le=!1),s&&f.usedDuplicates[l])f.dump="*ref_"+l;else{if(vn&&s&&!f.usedDuplicates[l]&&(f.usedDuplicates[l]=!0),Fe==="[object Object]")Ee&&Object.keys(f.dump).length!==0?(o(f,I,f.dump,Le),s&&(f.dump="&ref_"+l+f.dump)):(ot(f,I,f.dump),s&&(f.dump="&ref_"+l+" "+f.dump));else if(Fe==="[object Array]")Ee&&f.dump.length!==0?(f.noArrayIndent&&!qe&&I>0?Zn(f,I-1,f.dump,Le):Zn(f,I,f.dump,Le),s&&(f.dump="&ref_"+l+f.dump)):(Mn(f,I,f.dump),s&&(f.dump="&ref_"+l+" "+f.dump));else if(Fe==="[object String]")f.tag!=="?"&&He(f,f.dump,I,De,Ve);else{if(Fe==="[object Undefined]")return!1;if(f.skipInvalid)return!1;throw new k("unacceptable kind of an object to dump "+Fe)}if(f.tag!==null&&f.tag!=="?"){let _=encodeURI(f.tag[0]==="!"?f.tag.slice(1):f.tag).replace(/!/g,"%21");f.tag[0]==="!"?_="!"+_:_.slice(0,18)==="tag:yaml.org,2002:"?_="!!"+_.slice(18):_="!<"+_+">",f.dump=_+" "+f.dump}}return!0}function q(f,I){const te=[],Ee=[];F(f,te,Ee);const Le=Ee.length;for(let De=0;De<Le;De+=1)I.duplicates.push(te[Ee[De]]);I.usedDuplicates=new Array(Le)}function F(f,I,te){if(f!==null&&typeof f=="object"){const Ee=I.indexOf(f);if(Ee!==-1)te.indexOf(Ee)===-1&&te.push(Ee);else if(I.push(f),Array.isArray(f))for(let Le=0,De=f.length;Le<De;Le+=1)F(f[Le],I,te);else{const Le=Object.keys(f);for(let De=0,qe=Le.length;De<qe;De+=1)F(f[Le[De]],I,te)}}}function J(f,I){I=I||{};const te=new xe(I);te.noRefs||q(f,te);let Ee=f;return te.replacer&&(Ee=te.replacer.call({"":Ee},"",Ee)),h(te,0,Ee,!0,!0)?te.dump+`
`:""}z.exports.dump=J})),Yc=Qp(xt(((a,z)=>{var d=Jp(),k=e_();function v(P,R){return function(){throw new Error("Function yaml."+P+" is removed in js-yaml 4. Use yaml."+R+" instead, which is now safe by default.")}}z.exports.Type=Yt(),z.exports.Schema=Cc(),z.exports.FAILSAFE_SCHEMA=Pc(),z.exports.JSON_SCHEMA=Vc(),z.exports.CORE_SCHEMA=jc(),z.exports.DEFAULT_SCHEMA=ns(),z.exports.load=d.load,z.exports.loadAll=d.loadAll,z.exports.dump=k.dump,z.exports.YAMLException=gl(),z.exports.types={binary:Kc(),float:Fc(),map:Uc(),null:Dc(),pairs:qc(),set:Wc(),timestamp:zc(),bool:Gc(),int:Bc(),merge:Hc(),omap:Xc(),seq:Ic(),str:Mc()},z.exports.safeLoad=v("safeLoad","load"),z.exports.safeLoadAll=v("safeLoadAll","loadAll"),z.exports.safeDump=v("safeDump","dump")}))()),{Type:z_,Schema:H_,FAILSAFE_SCHEMA:K_,JSON_SCHEMA:X_,CORE_SCHEMA:q_,DEFAULT_SCHEMA:W_,load:Y_,loadAll:$_,dump:Q_,YAMLException:Z_,types:J_,safeLoad:eh,safeLoadAll:nh,safeDump:th}=Yc.default,qi=Yc.default;class n_ extends Error{constructor(z){super(z),this.name="RuntimeError"}}class ho extends Error{constructor(z){super(z),this.name="LuaError"}}class ga extends Error{constructor(z){super(z),this.name="ValidationError"}}const t_=`# RFDGameStudio — Horse Racing & Breeding
# Data Layer — extracted from types.ts
# Renderer-agnostic. TypeScript, Python, Rust all read this.

game:
  id: horse_racing
  name: Derby Sim
  version: "1.2"
  studio: RFDGameStudio

# --- STABLE ---
stable:
  starting_funds: 1000
  starting_slots: 3
  max_slots: 12
  unlock_cost_per_slot: 500
  starter_horse_cost: 400
  starter_min_stat: 35
  starter_max_stat: 55
  race_cooldown_ms: 90000
  breed_cooldown_ms: 180000

betting:
  place_odds_multiplier: 0.38
  place_odds_min: 1.15
  show_odds_multiplier: 0.20
  show_odds_min: 1.05

race:
  overround: 1.12
  field_size: 6
  npc_pool_size: 20
  prize_splits:
    first: 0.60
    second: 0.25
    third: 0.15

# --- HORSE SCHEMA ---
horse:
  fields:
    id: string
    name: string
    gender: [Stallion, Mare]
    generation: integer
    stats:
      speed: {min: 0, max: 100, description: Maximum speed}
      stamina: {min: 0, max: 100, description: Slower fatigue rate}
      acceleration: {min: 0, max: 100, description: Time to reach top speed}
      temperament: {min: 0, max: 100, description: Higher = more consistent, lower = volatile}
    colors:
      body: hex
      mane: hex
      socks: hex
      jockey_silk: hex
    career:
      runs: integer
      wins: integer
      places: integer
      thirds: integer
      earnings: integer
    cooldown_until: timestamp
    player_owned: boolean
    parents:
      sire_id: string
      sire_name: string
      dam_id: string
      dam_name: string
    price: integer

# --- COAT COLOR PROFILES ---
coat_colors:
  - name: Bay
    body: "#91532B"
    mane: "#1C1917"
    socks: "#1C1917"
    weight: 30
  - name: Chestnut
    body: "#A15C21"
    mane: "#B46E2A"
    socks: "#A15C21"
    weight: 25
  - name: Black
    body: "#292524"
    mane: "#1C1917"
    socks: "#1C1917"
    weight: 15
  - name: Gray
    body: "#D6D3D1"
    mane: "#F5F5F4"
    socks: "#A8A29E"
    weight: 15
  - name: Palomino
    body: "#EAB308"
    mane: "#FEF08A"
    socks: "#FEF08A"
    weight: 8
  - name: Buckskin
    body: "#EAB308"
    mane: "#1C1917"
    socks: "#1C1917"
    weight: 5
  - name: Albino
    body: "#FAFAF9"
    mane: "#FAFAF9"
    socks: "#E7E5E4"
    weight: 1
  - name: Emerald (Rare Mutation)
    body: "#059669"
    mane: "#34D399"
    socks: "#059669"
    weight: 0.4
    rare: true
  - name: Sapphire (Rare Mutation)
    body: "#2563EB"
    mane: "#60A5FA"
    socks: "#2563EB"
    weight: 0.3
    rare: true
  - name: Ruby (Rare Mutation)
    body: "#DC2626"
    mane: "#F87171"
    socks: "#DC2626"
    weight: 0.3
    rare: true

# --- JOCKEY SILK COLORS ---
silk_colors:
  - "#EF4444"  # Red
  - "#3B82F6"  # Blue
  - "#10B981"  # Green
  - "#F59E0B"  # Orange/Yellow
  - "#8B5CF6"  # Purple
  - "#EC4899"  # Pink
  - "#06B6D4"  # Cyan
  - "#14B8A6"  # Teal

# --- RACE CLASSES ---
race_classes:
  - name: Maiden
    stat_min: 10
    stat_max: 40
    entry_fee: 0
    fee: 0
    prize_pool: 300
    prize_split: [0.60, 0.25, 0.15]
  - name: Class III
    stat_min: 35
    stat_max: 55
    entry_fee: 30
    fee: 30
    prize_pool: 600
    prize_split: [0.60, 0.25, 0.15]
  - name: Class II
    stat_min: 50
    stat_max: 70
    entry_fee: 75
    fee: 75
    prize_pool: 1200
    prize_split: [0.60, 0.25, 0.15]
  - name: Class I
    stat_min: 65
    stat_max: 85
    entry_fee: 150
    fee: 150
    prize_pool: 2500
    prize_split: [0.60, 0.25, 0.15]
  - name: Grand Prix
    stat_min: 80
    stat_max: 100
    entry_fee: 300
    fee: 300
    prize_pool: 6000
    prize_split: [0.60, 0.25, 0.15]

# --- RACE DISTANCES ---
race_distances:
  - meters: 800
    label: Sprint
    stat_weights: {acceleration: 0.45, speed: 0.45, stamina: 0.10}
  - meters: 1200
    label: Medium
    stat_weights: {speed: 0.40, stamina: 0.35, acceleration: 0.25}
  - meters: 1600
    label: Long
    stat_weights: {stamina: 0.55, speed: 0.30, acceleration: 0.15}

# --- NAME POOLS ---
name_prefixes:
  [Midnight, Golden, Silver, Blazing, Starlight, Stormy, Crimson, Desert,
   Lunar, Solar, Gilded, Phantom, Velvet, Noble, Iron, Ocean, Rapid,
   Whispering, Royal, Sassy, Classic, Copper, Platinum, Sovereign, Misty,
   Zephyr, Slick, Voodoo, Dapper, Bold, Dusk, Dawn, Secret, Swift]

name_suffixes:
  [Rider, Storm, Dancer, Bullet, Runner, Streak, Star, Flame, Shadow,
   Whisper, Gallop, Dream, Spirit, Crown, Glory, Echo, Blitz, Breeze,
   Arrow, Pride, Chaser, Quest, Comet, Heart, Legacy, Symphony, Slayer,
   Crest, Tide, Monarch, Vanguard, Eclipse, Miracle, Spectre]

race_venues:
  [Kentucky, Royal Ascot, Melbourne, Epsom, Dubai, Tokyo, Saratoga, Chantilly, Belmont]

race_types:
  [Derby, Cup, Stakes, Grand Classic, Mile, Oaks, Sprint, Showdown, Championship]

# --- STARTER HORSES (foundation stock for new game) ---
starter_horses:
  - id: horse_starter_sire
    name: Vanguard Spirit
    gender: Stallion
    generation: 1
    speed: 48
    stamina: 52
    acceleration: 45
    temperament: 70
    color_body: "#A15C21"
    color_mane: "#1C1917"
    color_socks: "#A15C21"
    color_silk: "#EF4444"
    runs: 0
    wins: 0
    places: 0
    thirds: 0
    earnings: 0
    cooldown_until: 0
    player_owned: true
    price: 400

  - id: horse_starter_dam
    name: Starlight Dream
    gender: Mare
    generation: 1
    speed: 44
    stamina: 56
    acceleration: 50
    temperament: 78
    color_body: "#FAFAF9"
    color_mane: "#FAFAF9"
    color_socks: "#FAFAF9"
    color_silk: "#3B82F6"
    runs: 0
    wins: 0
    places: 0
    thirds: 0
    earnings: 0
    cooldown_until: 0
    player_owned: true
    price: 400

# --- PUBLIC STUDS (from Breeder) ---
public_studs:
  - id: stud_gold_sovereign
    name: Gold Sovereign
    gender: Stallion
    generation: 1
    speed: 78
    stamina: 66
    acceleration: 74
    temperament: 80
    color_body: "#EAB308"
    color_mane: "#FEF08A"
    color_socks: "#FEF08A"
    color_silk: "#EF4444"
    runs: 24
    wins: 12
    places: 6
    thirds: 3
    earnings: 15400
    cooldown_until: 0
    player_owned: false
    price: 550

  - id: stud_emerald_fury
    name: Emerald Fury
    gender: Stallion
    generation: 2
    speed: 86
    stamina: 84
    acceleration: 80
    temperament: 62
    color_body: "#059669"
    color_mane: "#34D399"
    color_socks: "#059669"
    color_silk: "#8B5CF6"
    runs: 40
    wins: 22
    places: 8
    thirds: 4
    earnings: 32000
    cooldown_until: 0
    player_owned: false
    price: 1100

  - id: stud_steel_breeze
    name: Steel Breeze
    gender: Stallion
    generation: 1
    speed: 52
    stamina: 60
    acceleration: 55
    temperament: 88
    color_body: "#D6D3D1"
    color_mane: "#FAFAF9"
    color_socks: "#A8A29E"
    color_silk: "#3B82F6"
    runs: 10
    wins: 3
    places: 2
    thirds: 1
    earnings: 1800
    cooldown_until: 0
    player_owned: false
    price: 180

  - id: mate_ruby_dream
    name: Ruby Dream
    gender: Mare
    generation: 2
    speed: 82
    stamina: 86
    acceleration: 82
    temperament: 72
    color_body: "#DC2626"
    color_mane: "#F87171"
    color_socks: "#DC2626"
    color_silk: "#10B981"
    runs: 35
    wins: 16
    places: 9
    thirds: 4
    earnings: 24500
    cooldown_until: 0
    player_owned: false
    price: 1050

  - id: mate_sassy_spark
    name: Sassy Spark
    gender: Mare
    generation: 1
    speed: 46
    stamina: 42
    acceleration: 50
    temperament: 90
    color_body: "#91532B"
    color_mane: "#1C1917"
    color_socks: "#1C1917"
    color_silk: "#EC4899"
    runs: 6
    wins: 1
    places: 1
    thirds: 0
    earnings: 450
    cooldown_until: 0
    player_owned: false
    price: 100
`,r_=`# RFDGameStudio — Horse Racing & Breeding
# UI Layer — intent extracted from component structure
# Describes WHAT the UI means, not HOW it looks.
# Each renderer interprets this in its own visual language.

game: horse_racing

# Dimensional layout for resolver
layout_tree:
  direction: column
  children:
    - id: header
      height: 0.10
    - id: tab_nav
      height: 0.06
    - id: content
      flex: 1
    - id: footer
      height: 0.05

# Component type mapping for interpreter
regions:
  header:
    component: app_header
    bindings:
      title: "DERBY SIM v1.2"
      bank: game_state.funds
  tab_nav:
    component: tab_bar
    tabs_from: layout.tabs
  content:
    component: tab_content   # rendered by game's existing tab system
  footer:
    component: app_footer
    text: "© 2026 DERBY SIMULATOR. ALL RIGHTS RESERVED."

layout:
  type: tabbed
  tabs:
    - id: stable
      label: Stable
      icon: home
      default: true
    - id: betting
      label: Betting
      icon: currency
    - id: breed
      label: Breed
      icon: genetics
    - id: history
      label: History
      icon: clock

header:
  components:
    - type: label
      text: "DERBY SIM v1.2"
      style: title
    - type: label
      text: "CHAMPIONSHIP SEASON • RACING & BREEDING"
      style: subtitle
    - type: stat_display
      label: "STABLE BANK"
      field: game_state.funds
      format: currency
      icon: dollar

# --- STABLE TAB ---
tabs:
  stable:
    header:
      - type: label
        text: "Your Private Stables"
        style: section_title
      - type: label
        text: "Inspect your breeding pedigree, stats distribution, and race metrics."
        style: description
      - type: stat_display
        label: "TOTAL CAPACITY"
        field: stable.occupied_slots
        format: "{value} / {max} slots"
    
    content:
      - type: horse_card_grid
        data_source: game_state.horses
        filter: player_owned
        card_template: horse_card
        empty_state: "No horses in stable. Visit the market."
    
    horse_card:
      components:
        - type: badge
          field: horse.status
          values: {ready: "Ready to Race", cooldown: "Resting"}
        - type: badge
          field: horse.generation
          format: "GEN {value}"
        - type: label
          field: horse.name
          style: card_title
        - type: label
          field: horse.gender
          style: subtitle
        - type: section
          label: "HERITAGE PEDIGREE"
          children:
            - type: label
              format: "SIRE: {horse.parents.sire_name}"
            - type: label
              format: "DAM: {horse.parents.dam_name}"
        - type: stat_bar
          label: "Top Speed"
          field: horse.stats.speed
          max: 100
        - type: stat_bar
          label: "Stamina Capacity"
          field: horse.stats.stamina
          max: 100
        - type: stat_bar
          label: "Launch Acceleration"
          field: horse.stats.acceleration
          max: 100
        - type: stat_bar
          label: "Temperament"
          field: horse.stats.temperament
          max: 100
          label_style: lowercase
        - type: stat_row
          stats:
            - {label: Runs, field: horse.career.runs}
            - {label: Wins, field: horse.career.wins}
            - {label: Place, field: horse.career.places}
            - {label: Show, field: horse.career.thirds}
        - type: stat_row
          stats:
            - {label: Earnings, field: horse.career.earnings, format: currency}
            - {label: Turf Bid Value, field: horse.price, format: currency}
        - type: action_button
          label: "Sell Stall"
          event: sell_horse
          data: horse.id
          style: danger

  # --- BETTING TAB ---
  betting:
    content:
      - type: race_info_card
        data_source: game_state.current_race
        components:
          - type: label
            field: race.name
            style: title
          - type: label
            field: race.description
          - type: label
            format: "Prize Pool: {race.prize_pool}"
            format_type: currency
      - type: race_track
        component: SVGRacer
        data_source: game_state.current_race.participants
      - type: betting_panel
        data_source: game_state.current_race.participants
        bet_types: [Win, Place]
        actions:
          - event: place_bet
          - event: start_race
          - event: new_race

  # --- BREED TAB ---
  breed:
    content:
      - type: breed_selector
        label: "Select Sire (Stallion)"
        data_source: game_state.horses
        filter: {gender: Stallion, status: ready}
        selection_event: select_sire
      - type: breed_selector
        label: "Select Dam (Mare)"
        data_source: game_state.horses
        filter: {gender: Mare, status: ready}
        selection_event: select_dam
      - type: breed_preview
        shows: [stat_projections, color_inheritance, generation]
      - type: action_button
        label: "Breed"
        event: breed_horses
        requires: [sire_selected, dam_selected, stable_slot_available]

  # --- HISTORY TAB ---
  history:
    content:
      - type: race_history_list
        data_source: game_state.race_history
        item_template: history_item
        empty_state: "No races completed yet."

    history_item:
        components:
          - type: label
            field: race.name
            style: title
          - type: label
            format: "{race.distance}m • Prize: {race.prize_pool}"
            format_type: currency
          - type: results_table
            data_source: race.results
            columns: [rank, horse_name, payout]
          - type: timestamp
            field: race.timestamp

footer:
  - type: label
    text: "© 2026 DERBY SIMULATOR. ALL RIGHTS RESERVED."
    style: footer
  - type: link
    label: "GAME RULES"
    event: show_rules
  - type: link
    label: "PEDIGREE GENETICS DATA"
    event: show_genetics
`,a_=`# systems.yaml — horse_racing
# ECS-style system manifest per ADR-006.
# Every function in logic.lua appears in exactly one system's functions list.
engine_version: "1.0"

engine_systems:
  - genetics
  - odds
  - market

systems:
  - id: genetics
    description: "Genome generation, trait inheritance, color profiles, naming"
    components: [genome, generation, traits, coat_color, silk_color]
    functions:
      - generate_horse
      - generate_horse_name
      - generate_color_profile
      - rand_int
      - rand_item
      - clamp

  - id: breeding
    description: "Pairing validation, stat inheritance, offspring generation"
    components: [genome, generation, parents, cooldown]
    functions:
      - breed_horses
      - breed_stat

  - id: odds
    description: "Race odds calculation from stat profiles"
    components: [speed, stamina, acceleration, temperament, distance]
    functions:
      - calculate_odds
      - calculate_place_odds
      - calculate_show_odds

  - id: simulation
    description: "Race physics — headless and per-tick"
    components: [position, velocity, energy, finish_time]
    functions:
      - simulate_race
      - tick_race
      - create_race

  - id: market
    description: "Bet settlement, horse valuation, prize distribution, career update"
    components: [bet, payout_odds, prize_pool, stake, career]
    functions:
      - settle_bets
      - calculate_payouts
      - calculate_horse_price
      - sell_horse
      - update_horse_after_race
      - can_unlock_slot

entities:
  horse:
    description: "A racing horse with stats, career, and lineage"
    systems: [genetics, breeding, odds, simulation, market]
    schema_ref: data.yaml#horse

  race:
    description: "A race event with participants, distance, and prize pool"
    systems: [simulation, odds, market]
    schema_ref: data.yaml#race_classes

  bet:
    description: "A wager on a race participant"
    systems: [market]
    schema_ref: data.yaml#betting
`,l_=`game:
  id: slither_rogue
  name: Snake Roguelike
  version: "1.0"
  studio: RFDGameStudio

arena:
  map_width: 2600
  map_height: 2600
  num_fruits: 45
  num_npcs: 12
  grid_size: 100
  wall_buffer: 120

fruit:
  golden_chance: 0.08
  golden_points: 3
  standard_points: 1
  colors:
    - "#ef4444"
    - "#10b981"
    - "#3b82f6"
    - "#ec4899"
    - "#f43f5e"
  golden_color: "#fbbf24"

evolution:
  fruits_per_level: 3
  cards_offered: 3

npc_profiles:
  - name: Gorgon
    color: "#ef4444"
    head_color: "#f87171"
  - name: Naga
    color: "#f97316"
    head_color: "#fb923c"
  - name: Adder
    color: "#eab308"
    head_color: "#facc15"
  - name: Sidewinder
    color: "#a855f7"
    head_color: "#c084fc"
  - name: Basilisk
    color: "#ec4899"
    head_color: "#f472b6"
  - name: Python
    color: "#3b82f6"
    head_color: "#60a5fa"
  - name: Anaconda
    color: "#06b6d4"
    head_color: "#22d3ee"

npc_stats:
  min_radius: 10
  max_radius: 13
  min_speed: 110
  max_speed: 140
  min_initial_length: 4
  max_initial_length: 9

player_stats:
  initial_radius: 11
  initial_speed: 160
  initial_length: 5
  turn_speed: 5.2

player_presets:
  - name: Electric Teal
    color: "#14b8a6"
    head_color: "#06b6d4"
  - name: Toxic Lime
    color: "#84cc16"
    head_color: "#a3e635"
  - name: Cyber Purple
    color: "#a855f7"
    head_color: "#c084fc"
  - name: Amber Fury
    color: "#f59e0b"
    head_color: "#fbbf24"
  - name: Rose Phantom
    color: "#f43f5e"
    head_color: "#f472b6"

run_durations:
  - label: "2 Mins"
    seconds: 120
    sub: Quickie
  - label: "5 Mins"
    seconds: 300
    sub: Standard
  - label: Endless
    seconds: 999999
    sub: Chill / Practice

evolution_cards:
  - id: speed
    title: Nitrous Slither
    description: "Permanent +15% boost to snake base speed."
    icon: speed
    rarity: common
    effect_key: speed_multiplier
    effect_per_level: 0.15

  - id: magnet
    title: Magnetic Glide
    description: "Nearby fruits pulled towards your head (+25px pull radius per level)."
    icon: magnet
    rarity: common
    effect_key: magnetism_radius
    effect_per_level: 25

  - id: shield
    title: Reinforced Joints
    description: "Grants +1 Node Armor shield charge. Charges regenerate if you avoid hits for 10 seconds."
    icon: shield
    rarity: rare
    effect_key: shield_charges
    effect_per_level: 1

  - id: wide
    title: Thick Scales
    description: "Increases segment radius by +3px."
    icon: wide
    rarity: common
    effect_key: wide_body_add
    effect_per_level: 3

  - id: sense
    title: Fruity Radar
    description: "Draws indicators pointing to off-screen fruits (+200px range)."
    icon: sense
    rarity: common
    effect_key: fruit_sense_range
    effect_per_level: 200

  - id: ghost
    title: Spectral End
    description: "Protects last +1 segment from being stolen."
    icon: ghost
    rarity: epic
    effect_key: ghost_tail_count
    effect_per_level: 1

  - id: regen
    title: Chrono Growth
    description: "Automatically spawns a new tail segment every few seconds."
    icon: regen
    rarity: rare
    effect_key: tail_growth_level
    effect_per_level: 1

  - id: venom
    title: Acidic Sprayer
    description: "Emits slow-inducing acid drops from tail."
    icon: venom
    rarity: epic
    effect_key: venom_trail_level
    effect_per_level: 1

  - id: ambush
    title: Ambush Protocol
    description: "Brief speed burst when your head gets within 150px of an NPC joint. Rewards aggressive play."
    icon: ambush
    rarity: rare
    effect_key: ambush_level
    effect_per_level: 1

grade_thresholds:
  - min_score: 100
    title: Apex Leviathan
    description: "A creature of legend. The entire world trembled in your slither."
  - min_score: 60
    title: Ancient Serpent
    description: "Highly evolved. Your DNA holds wisdom of a hundred mutations."
  - min_score: 30
    title: Venomous Viper
    description: "A formidable hunter. Quick, clever, and genetically advanced."
  - min_score: 15
    title: Nimble Adder
    description: "Decent adaptability. You managed to hold your ground."
  - min_score: 0
    title: Newborn Hatchling
    description: "Survival is tough. Gather more mutations next time to grow strong!"
`,o_=`layout:
  tabs: []   # No tabs — Slither Rogue uses screen-based routing (menu/game/gameover)

# Dimensional layout for resolver
layout_tree:
  direction: column
  children:
    - id: hud
      height: 0.14          # taller HUD for snake game stats
    - id: game_area
      flex: 1               # canvas fills all remaining

screens_layout:
  menu:
    direction: column
    children:
      - id: title
        height: 0.25
      - id: config
        flex: 1
      - id: start_btn
        height: 0.12

regions:
  hud:
    component: hud
    bindings:
      score: game_state.score
      time_left: game_state.time_left
      peak_length: game_state.peak_length
  game_area:
    component: canvas       # slot — game renders canvas here

screens:
  - id: menu
    title: Main Menu
    components:
      - type: panel
        id: config_panel
      - type: panel
        id: scores_panel
      - type: action_button
        id: start_btn
        label: Launch Run

  - id: game
    title: Arena
    components:
      - type: panel
        id: hud
      - type: canvas
        id: game_canvas
      - type: modal
        id: evolution_modal
        trigger: on_evolution

  - id: gameover
    title: Game Over
    components:
      - type: modal
        id: gameover_modal
`,i_=`lua_files:
  - utils.lua
  - state.lua
  - physics.lua
  - collision.lua
  - render.lua
  - logic.lua

engine_version: "1.0"
engine_systems: []   # All engine/primitives/ loaded unconditionally.
                     # engine/systems/ files declared here: (none for slither_rogue)
                     # slither_rogue uses: clamp (action), dist2/normalize_angle (movement)

systems:
  - id: evolution
    description: "Card selection, effect calculation, trigger logic"
    components: [evolution_card, effect_key, effect_per_level, active_evolutions]
    functions:
      - update_evolution_effects
      - check_evolution_trigger
      - select_evolution_pool

  - id: spawn
    description: "Fruit and NPC initialization"
    components: [fruit, npc, position, color, speed, radius]
    functions:
      - spawn_fruit
      - generate_npc

  - id: npc_ai
    description: "NPC decision-making (called every 400-800ms, not per frame)"
    components: [position, angle, speed, target_angle]
    functions:
      - decide_npc_action

  - id: scoring
    description: "Grade calculation and score evaluation"
    components: [score, grade]
    functions:
      - calculate_grade

entities:
  snake:
    description: "Player or NPC snake with segments and evolution state"
    systems: [spawn, npc_ai]

  fruit:
    description: "Collectible item on the arena map"
    systems: [spawn]

  evolution_card:
    description: "Single evolution card definition with effect"
    systems: [evolution]
`,s_=`game:
  id: mutant_battle_ball
  name: Mutant Battle Ball
  version: "1.0"
  studio: RFDGameStudio

match:
  court_width: 100
  court_height: 60
  end_zone_depth: 10
  duration: 180
  timeouts: 3
  tackle_range: 6.0
  block_range: 7.0
  carrier_speed_mult: 0.85
  tackle_stun_time: 1.2
  escort_intercept_dist: 15

scoring:
  iron_per_win: 60
  iron_per_loss: 25
  iron_per_score: 10
  salvage_choice_count: 1

infirmary:
  limb_loss_recovery_matches: 2
  heavy_wound_recovery_matches: 3

part_slots:
  - head
  - chest
  - left_arm
  - right_arm
  - left_leg
  - right_leg

parts:
  - id: head_basic
    name: Cracked Skull
    slot: head
    accuracy: 35
    endurance: 8
    power: 5
    speed: 5
    price: 40
    description: "A dented but functional head. Gets the job done."

  - id: head_tactical
    name: Tactical Visor
    slot: head
    accuracy: 55
    endurance: 10
    power: 5
    speed: 5
    price: 90
    description: "Enhanced optics for precision decision-making."

  - id: head_iron
    name: Iron Dome
    slot: head
    accuracy: 30
    endurance: 20
    power: 5
    speed: 5
    price: 70
    description: "Reinforced skull. Won't win on brains but won't lose one either."

  - id: chest_basic
    name: Ribcage Plating
    slot: chest
    accuracy: 5
    endurance: 40
    power: 8
    speed: 5
    price: 45

  - id: chest_heavy
    name: Blast Shield Torso
    slot: chest
    accuracy: 5
    endurance: 65
    power: 12
    speed: 0
    price: 110
    description: "Absorbs punishment. Slows you down."

  - id: chest_light
    name: Carbon Mesh
    slot: chest
    accuracy: 8
    endurance: 30
    power: 5
    speed: 8
    price: 75
    description: "Light. Doesn't absorb much. But you'll run."

  - id: arm_basic
    name: Scrap Arm
    slot: left_arm
    accuracy: 3
    endurance: 5
    power: 30
    speed: 3
    price: 35

  - id: arm_pile
    name: Pile Driver
    slot: right_arm
    accuracy: 3
    endurance: 5
    power: 50
    speed: 0
    price: 80
    description: "One hit. That's all you need."

  - id: arm_grab
    name: Grapple Claw
    slot: left_arm
    accuracy: 10
    endurance: 5
    power: 40
    speed: 3
    price: 70

  - id: leg_basic
    name: Salvage Leg
    slot: left_leg
    accuracy: 3
    endurance: 5
    power: 5
    speed: 30
    price: 35

  - id: leg_sprint
    name: Sprint Coil
    slot: right_leg
    accuracy: 3
    endurance: 5
    power: 3
    speed: 55
    price: 90
    description: "Built for pursuit. Falls apart under pressure."

  - id: leg_stomp
    name: Stomp Boot
    slot: left_leg
    accuracy: 3
    endurance: 8
    power: 12
    speed: 35
    price: 60

starter_mutants:
  - id: mutant_alpha
    name: Alpha
    color: "#3b82f6"
    parts:
      head:      head_basic
      chest:     chest_basic
      left_arm:  arm_basic
      right_arm: arm_basic
      left_leg:  leg_basic
      right_leg: leg_basic

  - id: mutant_beta
    name: Beta
    color: "#10b981"
    parts:
      head:      head_tactical
      chest:     chest_light
      left_arm:  arm_grab
      right_arm: arm_basic
      left_leg:  leg_sprint
      right_leg: leg_basic

starting_iron: 120
starting_parts:
  - arm_basic
  - leg_basic
  - head_basic
  - chest_basic

opponents:
  - name: The Scrappers
    difficulty: easy
    iron_reward: 25
    mutants:
      - { name: "Bolt", color: "#ef4444",
          accuracy: 32, endurance: 38, power: 28, speed: 32, max_health: 38 }
      - { name: "Ratch", color: "#f97316",
          accuracy: 28, endurance: 35, power: 35, speed: 30, max_health: 35 }

  - name: The Ironborn
    difficulty: medium
    iron_reward: 45
    mutants:
      - { name: "Gorge", color: "#8b5cf6",
          accuracy: 40, endurance: 55, power: 45, speed: 28, max_health: 55 }
      - { name: "Vex",   color: "#ec4899",
          accuracy: 45, endurance: 42, power: 38, speed: 42, max_health: 42 }

  - name: The Chrome Elite
    difficulty: hard
    iron_reward: 70
    mutants:
      - { name: "Titan", color: "#14b8a6",
          accuracy: 58, endurance: 70, power: 62, speed: 35, max_health: 70 }
      - { name: "Slick", color: "#fbbf24",
          accuracy: 62, endurance: 48, power: 45, speed: 65, max_health: 48 }
`,u_=`layout_tree:
  direction: column
  children:
    - id: header
      height: 0.10
    - id: tab_nav
      height: 0.06
    - id: content
      flex: 1
    - id: footer
      height: 0.05

regions:
  header:
    component: app_header
    bindings:
      title: "MUTANT BATTLE BALL"
      bank_label: IRON
  tab_nav:
    component: tab_bar
  content:
    component: tab_content
  footer:
    component: app_footer
    text: "© 2026 MUTANT BATTLE BALL — RFD IT Services Ltd."

tabs:
  - id: roster
    label: Roster
  - id: workshop
    label: Workshop
  - id: match
    label: Match
  - id: shop
    label: Shop
  - id: infirmary
    label: Infirmary
`,c_=`game_id: mutant_battle_ball

systems:
  - id: match
    description: "Real-time 2v2 match simulation"
    components: [agent, ball, possession, score, time]
    functions:
      - init_match
      - tick_match
      - call_timeout
      - resume_match
      - make_substitution

  - id: management
    description: "Roster, parts, assembly, infirmary"
    components: [mutant, part, roster, infirmary]
    functions:
      - calculate_stats
      - assemble_mutant
      - apply_wound

entities:
  mutant:
    fields: [id, name, color, parts, status, matches_played]
  part:
    fields: [id, name, slot, accuracy, endurance, power, speed, price]
  agent:
    fields: [id, name, team, x, y, role, status, has_ball, health, max_health]
`,d_=`game:
  id: slime_coin
  name: SlimeCoin
  version: 1.0.0
  studio: RFDGameStudio

# Slime coin types (6 variants)
slime_types:
  - id: basic
    name: Green Slime
    mass: 1.0
    radius: 14
    value: 1
    color: "#4ade80"
    description: Standard slime. No special behavior.

  - id: heavy
    name: Rock Slime
    mass: 2.2
    radius: 16
    value: 3
    color: "#78716c"
    description: High mass. Pushes adjacent coins on landing.

  - id: light
    name: Bubble Slime
    mass: 0.8
    radius: 13
    value: 5
    color: "#a5f3fc"
    description: Low mass. Bounces on landing.

  - id: sticky
    name: Tar Slime
    mass: 1.5
    radius: 15
    value: 10
    color: "#44403c"
    description: Clusters with adjacent slimes on floor contact.

  - id: dense
    name: Iron Slime
    mass: 3.5
    radius: 18
    value: 15
    color: "#94a3b8"
    description: Very heavy. Clears a path through the pile.

  - id: rare
    name: Crystal Slime
    mass: 1.8
    radius: 17
    value: 25
    color: "#e879f9"
    description: Triggers chip synergy bonuses. Glows.

# Pocket coin types (4 special launches)
pocket_coins:
  - id: boom
    name: Blast Slime
    effect: explode
    description: Explodes on shelf contact — launches adjacent coins forward off the edge
    color: "#f97316"

  - id: pull
    name: Magnet Slime
    effect: pull
    description: Pulls all floor coins toward a center point on landing
    color: "#3b82f6"

  - id: echo
    name: Echo Slime
    effect: echo
    description: Adds +5 to Hand In count (more shots this round)
    color: "#a855f7"

  - id: giga
    name: Giant Slime
    effect: giga
    description: 3× size, 10× mass — steamrolls everything in its path on the shelf
    color: "#ef4444"

# Board obstacles (4 types)
obstacles:
  - id: peg
    name: Peg
    bounce: 0.5
    description: Standard deflector. Slight bounce on contact.
    color: "#fbbf24"

  - id: bumper
    name: Bumper
    bounce: 1.2
    description: High-bounce peg. Unlocked via wheel reward.
    color: "#f59e0b"

  - id: multiplier_pad
    name: Multiplier Pad
    multiplier: 2.0
    description: Doubles score value of any coin that passes over it.
    color: "#10b981"

  - id: slime_tower
    name: Slime Tower
    hits_to_collapse: 3
    description: Collapses after 3 hits, scattering coins across the shelf.
    color: "#8b5cf6"

# Chip cards (12 cards minimum)
chip_cards:
  - id: zombie_slime
    name: Zombie Slime
    rarity: epic
    slime_type: basic
    effect: convert_adjacent
    max_triggers: 20
    description: Converts coins it touches into Zombie Slimes. Up to 20 times per round.
    color: "#22c55e"

  - id: crystal_burst
    name: Crystal Burst
    rarity: rare
    slime_type: rare
    effect: multiply_adjacent
    description: Crystal Slimes multiply the value of adjacent coins on contact.
    color: "#d946ef"

  - id: heavy_impact
    name: Heavy Impact
    rarity: common
    slime_type: heavy
    effect: shockwave
    radius: 3
    description: Rock Slimes trigger a shockwave on landing that moves 3 adjacent coins.
    color: "#6b7280"

  - id: bubble_chain
    name: Bubble Chain
    rarity: rare
    slime_type: light
    effect: chain_pop
    min_chain: 5
    description: Bubble Slimes link into chains — if 5+ are adjacent, all pop for bonus score.
    color: "#67e8f9"

  - id: tar_cluster
    name: Tar Cluster
    rarity: common
    slime_type: sticky
    effect: cluster_bonus
    description: Tar Slimes grant bonus score when 3+ are clustered together.
    color: "#57534e"

  - id: iron_path
    name: Iron Path
    rarity: rare
    slime_type: dense
    effect: path_clear
    description: Iron Slimes clear a wider path through the pile on landing.
    color: "#64748b"

  - id: crystal_echo
    name: Crystal Echo
    rarity: epic
    slime_type: rare
    effect: echo_multiplier
    description: Crystal Slimes echo their multiplier to all Crystal Slimes on the floor.
    color: "#c026d3"

  - id: zombie_horde
    name: Zombie Horde
    rarity: epic
    slime_type: basic
    effect: horde_convert
    max_triggers: 30
    description: Zombie Slimes convert up to 30 adjacent coins per round.
    color: "#16a34a"

  - id: bubble_float
    name: Bubble Float
    rarity: common
    slime_type: light
    effect: float_bonus
    description: Bubble Slimes float back to the shelf after falling (once per round).
    color: "#22d3ee"

  - id: tar_anchor
    name: Tar Anchor
    rarity: rare
    slime_type: sticky
    effect: anchor
    description: Tar Slimes anchor adjacent coins, preventing them from being pushed.
    color: "#44403c"

  - id: iron_crush
    name: Iron Crush
    rarity: epic
    slime_type: dense
    effect: crush
    description: Iron Slimes crush Bad Slimes on contact, removing them without penalty.
    color: "#475569"

  - id: crystal_prism
    name: Crystal Prism
    rarity: rare
    slime_type: rare
    effect: prism
    description: Crystal Slimes split their value evenly among adjacent coins.
    color: "#a21caf"

# Round configuration
round_config:
  total_rounds: 15
  base_hand_in: 10
  base_target_score: 100
  target_growth: 1.5
  pusher_base_speed: 1.0
  pusher_speed_growth: 0.1

# Round modifiers
round_modifiers:
  - id: no_bad_coins
    name: No Bad Coins
    description: Bad Slimes do not appear this round.
    positive: true

  - id: double_hand
    name: Double Hand
    description: Hand In count is doubled this round.
    positive: true

  - id: bonus_start
    name: Bonus Start
    description: Start with Score Rate +5.
    positive: true

  - id: bad_coins
    name: Bad Coins
    description: Bad Slimes appear in the Hand queue.
    positive: false

  - id: reduced_pusher
    name: Reduced Pusher
    description: Pusher speed is reduced by 50%.
    positive: false

# Spin wheel rewards
spin_wheel:
  - id: extra_hand
    name: Extra Hand
    description: +3 Hand In for next round
    weight: 30

  - id: bumper_unlock
    name: Bumper Unlock
    description: Unlock Bumper obstacle
    weight: 20

  - id: pocket_boom
    name: Pocket Boom
    description: Add Blast Slime to pocket
    weight: 15

  - id: pocket_pull
    name: Pocket Pull
    description: Add Magnet Slime to pocket
    weight: 15

  - id: score_boost
    name: Score Boost
    description: +500 bonus score
    weight: 10

  - id: rare_card
    name: Rare Card
    description: Next card offer is guaranteed Rare
    weight: 10

# Board dimensions
board:
  shelf_width: 400
  shelf_height: 200
  shelf_depth: 100
  floor_width: 400
  floor_height: 150
  shooter_x: 200
  shooter_y: 450
  pusher_amplitude: 50
  pusher_frequency: 1.0

# Bad slime configuration
bad_slime:
  id: bad
  name: Bad Slime
  mass: 1.0
  radius: 14
  value: -5
  color: "#ef4444"
  description: Reduces Score Rate on floor contact.

# v0.3: Slime pool configuration
slime_pool:
  starting_pool:
    - type_id: basic
      weight: 5
    - type_id: heavy
      weight: 2
    - type_id: light
      weight: 2
  queue_size: 5

# v0.3: Vat configuration
vat:
  width: 400
  height: 50
  fill_rate: 1.0  # visual fill speed

# v0.3: Exchange configuration
exchange:
  base_cost: 5
  base_shots: 5
  max_per_round: 3
  cost_growth: 1.5  # cost multiplier per exchange in same round

# v0.3: Shop configuration
shop:
  free_cards_per_round: 1
  cards_offered: 3
  hand_upgrade_cost: 20
  hand_upgrade_bonus: 2

# v0.3: Pairwise synergies (examples from GDD)
synergies:
  - id: zombie_conversion
    type_a: zombie
    type_b: basic
    effect: convert_basic_to_zombie
    description: Zombie + Basic contact converts Basic to Zombie

  - id: mirror_echo
    type_a: mirror
    type_b: rare
    effect: double_crystal_tokens
    description: Mirror + Crystal contact doubles token yield

  - id: void_clear
    type_a: void
    type_b: dense
    effect: clear_area
    radius: 5
    description: Void + Iron contact clears 5-radius area

  - id: spark_launch
    type_a: spark
    type_b: light
    effect: launch_to_shelf
    description: Spark + Bubble contact launches both back to shelf
`,f_=`layout_tree:
  - id: header
    type: row
    height: 60
    children:
      - id: round_info
        type: text
        flex: 1
        content: "Round {round}/15"
      - id: score_info
        type: text
        flex: 1
        content: "{score} / {target_score}"
      - id: score_rate
        type: text
        flex: 1
        content: "×{score_rate}"
  
  - id: main_content
    type: row
    flex: 1
    children:
      - id: left_panel
        type: column
        width: 120
        children:
          - id: spin_wheel
            type: custom
            height: 200
          - id: pocket_coins
            type: custom
            flex: 1
      
      - id: board_area
        type: custom
        flex: 1
      
      - id: right_panel
        type: column
        width: 120
        children:
          - id: hand_in
            type: text
            height: 40
            content: "Hand: {hand_in}"
          - id: modifiers
            type: custom
            flex: 1
  
  - id: footer
    type: row
    height: 40
    children:
      - id: shooter_controls
        type: text
        flex: 1
        content: "← → Aim | SPACE Fire"
      - id: pocket_hint
        type: text
        flex: 1
        content: "P: Pocket Coins"

modals:
  - id: card_select
    type: column
    children:
      - id: card_select_title
        type: text
        height: 40
        content: "Choose a Chip Card"
      - id: card_options
        type: row
        flex: 1
        children:
          - id: card_1
            type: custom
            flex: 1
          - id: card_2
            type: custom
            flex: 1
          - id: card_3
            type: custom
            flex: 1
  
  - id: pocket_picker
    type: column
    children:
      - id: pocket_title
        type: text
        height: 40
        content: "Select Pocket Coin"
      - id: pocket_options
        type: row
        flex: 1
        children:
          - id: pocket_boom
            type: custom
            flex: 1
          - id: pocket_pull
            type: custom
            flex: 1
          - id: pocket_echo
            type: custom
            flex: 1
          - id: pocket_giga
            type: custom
            flex: 1
  
  - id: run_end
    type: column
    children:
      - id: run_end_title
        type: text
        height: 40
        content: "Run Complete"
      - id: final_score
        type: text
        height: 40
        content: "Final Score: {score}"
      - id: run_summary
        type: custom
        flex: 1
      - id: restart_button
        type: button
        height: 40
        content: "New Run"
`,p_=`systems:
  - id: match
    name: Match System
    description: Real-time coin pusher simulation with shooter, physics, and scoring
    functions:
      - init_game
      - tick_game
      - start_round
      - end_round
      - fire_coin
  
  - id: cards
    name: Card System
    description: Chip card selection and synergy effects
    functions:
      - generate_card_offer
      - select_card
      - trigger_chip_synergy
  
  - id: pocket
    name: Pocket System
    description: Special pocket coin management
    functions:
      - trigger_pocket_boom

entities:
  slime_coin:
    description: Slime coin on shelf or floor
    fields:
      - id: string
      - type_id: string
      - x: number
      - y: number
      - vx: number
      - vy: number
      - mass: number
      - radius: number
      - value: number
  
  obstacle:
    description: Board obstacle on shelf
    fields:
      - id: string
      - type_id: string
      - x: number
      - y: number
      - hits_remaining: number
  
  chip_card:
    description: Chip card owned by player
    fields:
      - card_id: string
      - name: string
      - rarity: string
      - description: string

engine_systems: []
`,__=`game:
  id: chimera_wilds
  name: Chimera Wilds
  version: "1.0"
  studio: RFDGameStudio

part_slots:
  - head
  - chest
  - left_arm
  - right_arm
  - left_leg
  - right_leg

parts:
  - id: head_basic
    name: Cracked Skull
    slot: head
    accuracy: 35
    endurance: 8
    power: 5
    speed: 5
    price: 40
    description: "A dented but functional head. Gets the job done."

  - id: head_tactical
    name: Tactical Visor
    slot: head
    accuracy: 55
    endurance: 10
    power: 5
    speed: 5
    price: 90
    description: "Enhanced optics for precision decision-making."

  - id: head_iron
    name: Iron Dome
    slot: head
    accuracy: 30
    endurance: 20
    power: 5
    speed: 5
    price: 70
    description: "Reinforced skull. Won't win on brains but won't lose one either."

  - id: chest_basic
    name: Ribcage Plating
    slot: chest
    accuracy: 5
    endurance: 40
    power: 8
    speed: 5
    price: 45

  - id: chest_heavy
    name: Blast Shield Torso
    slot: chest
    accuracy: 5
    endurance: 65
    power: 12
    speed: 0
    price: 110
    description: "Absorbs punishment. Slows you down."

  - id: chest_light
    name: Carbon Mesh
    slot: chest
    accuracy: 8
    endurance: 30
    power: 5
    speed: 8
    price: 75
    description: "Light. Doesn't absorb much. But you'll run."

  - id: arm_basic
    name: Scrap Arm
    slot: left_arm
    accuracy: 3
    endurance: 5
    power: 30
    speed: 3
    price: 35

  - id: arm_pile
    name: Pile Driver
    slot: right_arm
    accuracy: 3
    endurance: 5
    power: 50
    speed: 0
    price: 80
    description: "One hit. That's all you need."

  - id: arm_grab
    name: Grapple Claw
    slot: left_arm
    accuracy: 10
    endurance: 5
    power: 40
    speed: 3
    price: 70

  - id: leg_basic
    name: Salvage Leg
    slot: left_leg
    accuracy: 3
    endurance: 5
    power: 5
    speed: 30
    price: 35

  - id: leg_sprint
    name: Sprint Coil
    slot: right_leg
    accuracy: 3
    endurance: 5
    power: 3
    speed: 55
    price: 90
    description: "Built for pursuit. Falls apart under pressure."

  - id: leg_stomp
    name: Stomp Boot
    slot: left_leg
    accuracy: 3
    endurance: 8
    power: 12
    speed: 35
    price: 60

baseline_player:
  power: 20
  endurance: 20
`,h_=`layout_tree:
  direction: column
  children:
    - id: header
      height: 0.10
    - id: main
      flex: 1
    - id: footer
      height: 0.05

regions:
  header:
    component: app_header
    bindings:
      title: "Chimera Wilds"
  main:
    component: hud
  footer:
    component: app_footer
    text: "© 2026 Chimera Wilds — RFD IT Services Ltd."
`,m_=`engine_version: "1.0"
engine_systems: []   # self-contained, matches slither_rogue/slime_coin precedent

systems:
  - id: encounter
    description: "Chimera assembly and single-roll combat resolution"
    functions:
      - generate_chimera
      - resolve_encounter

entities:
  chimera:
    description: "A randomly-assembled six-part enemy, disposed after one encounter"
    systems: [encounter]
    schema_ref: data.yaml#parts
`,g_=`game:
  id: scrapcrawl
  name: ScrapCrawl
  version: "Phase A"
  studio: RFDGameStudio
  description: >-
    Core loop port — room navigation, the Scrap→Craft→Equipment economy with
    durability, D20 combat, and win-only weapon Proficiency.

rooms:
  home_base:
    id: home_base
    name: Home Base
    interaction_types: [home, craft, rest]
    connections: [scrap_pit, furnace_core]
  scrap_pit:
    id: scrap_pit
    name: Scrap Pit
    interaction_types: [fight]
    connections: [home_base, vent_stack]
    difficulty: 8
  vent_stack:
    id: vent_stack
    name: Vent Stack
    interaction_types: [fight]
    connections: [scrap_pit, chemical_leak]
    difficulty: 12
  chemical_leak:
    id: chemical_leak
    name: Chemical Leak
    interaction_types: [fight]
    connections: [vent_stack, furnace_core]
    difficulty: 15
  furnace_core:
    id: furnace_core
    name: Furnace Core
    interaction_types: [fight]
    connections: [chemical_leak, home_base]
    difficulty: 18

catalog:
  beatStick:
    id: beatStick
    name: Beat Stick
    slot: weapon
    tierCost:
      1: 10
      2: 25
    baseStats:
      1:
        hp: 0
        atk: 5
        def: 0
      2:
        hp: 0
        atk: 10
        def: 0
    maxLife:
      1: 10
      2: 18
  shield:
    id: shield
    name: Shield
    slot: shield
    tierCost:
      1: 10
      2: 25
    baseStats:
      1:
        hp: 0
        atk: 0
        def: 3
      2:
        hp: 0
        atk: 0
        def: 7
    maxLife:
      1: 10
      2: 18
  bodyArmor:
    id: bodyArmor
    name: Body Armor
    slot: armor
    tierCost:
      1: 10
      2: 25
    baseStats:
      1:
        hp: 15
        atk: 0
        def: 2
      2:
        hp: 30
        atk: 0
        def: 5
    maxLife:
      1: 10
      2: 18
  tool:
    id: tool
    name: Tier-2 Tool
    tierCost:
      1: 20
      2: 20
    baseStats:
      1:
        hp: 0
        atk: 0
        def: 0
      2:
        hp: 0
        atk: 0
        def: 0
    maxLife:
      1: 999
      2: 999

constants:
  proficiency_xp_ceiling: 500
  scrap_reward_min: 3
  scrap_reward_max: 8
  unarmed_baseline_atk: 2
  proficiency_win_xp: 15
  tier2_cap: 2
`,y_=`layout_tree:
  - id: header
    type: row
    height: 60
    children:
      - id: title
        type: text
        content: SCRAPCRAWL

  - id: main_content
    type: row
    flex: 1
    children:
      - id: hud
        type: column
        flex: 1
        children:
          - id: room_badge
            type: text
            content: "Room: {currentRoomId}"
          - id: scrap_display
            type: stat_display
            label: Scrap
            value: "{scrap}"
          - id: equipment_table
            type: data_table
            source: equipped
          - id: action_panel
            type: panel
            children:
              - id: fight_button
                type: action_button
                label: Fight
              - id: craft_button
                type: action_button
                label: Craft
              - id: rest_button
                type: action_button
                label: Rest
          - id: history_list
            type: history_list
            source: combat_history

  - id: footer
    type: row
    height: 30
    children:
      - id: copyright
        type: text
        content: "© 2026 ScrapCrawl"
`,v_=`engine_version: "1.0"
engine_systems: []   # self-contained port — no shared engine system wiring

systems:
  - id: scrapcrawl_core
    description: "ScrapCrawl core loop: rooms, crafting, combat, and player state"
    functions:
      - get_room
      - can_move_to
      - move_player
      - growth_factor
      - can_craft
      - craft
      - resolve_fight
      - init_player
      - reset_position

entities:
  player:
    description: "ScrapCrawl player state: position, scrap, equipment, proficiency"
    systems: [scrapcrawl_core]
    schema_ref: data.yaml#constants
`,x_=`game:
  id: brewfield
  name: Brewfield
  version: "Phase A"
  studio: RFDGameStudio
  description: >-
    Turn-based potions-brewing roguelike. Element × Component combinations,
    a living Residue field, deck-based Element economy.

constants:
  player_starting_hp: 20
  hand_size: 5
  reshuffle_threshold: 5   # reshuffle discard into draw pile when draw pile < this
  rest_heal_amount: 12
  residue_field_max_slots: 2

elements: [fire, air, water, earth]   # order matters — defines the wheel cycle for adjacency/opposition
components: [strike, ward, mend, blight]

# Player deck at the start of every run.
starting_deck: [fire, fire, water, water, earth, earth, air, air]

# Enemy archetypes, ported directly from instantiateEnemy() + getEnemyIntent()
enemies:
  ashling:
    name: "Ashling (Cinder Beast)"
    hp: 16
    intent_pattern:   # 4-turn cycle, index = (turn - 1) % 4
      - {action: attack, value: 6, description: "Scorching Strike"}
      - {action: attack, value: 8, description: "Flame Burst"}
      - {action: defend, value: 4, description: "Embershield"}
      - {action: attack, value: 7, description: "Cinder Splash"}
  bulwark:
    name: "Bulwark (Stone Golem)"
    hp: 20
    intent_pattern:
      - {action: defend, value: 6, description: "Iron Defense"}
      - {action: attack, value: 5, description: "Shield Slam"}
      - {action: defend, value: 8, description: "Fortify Core"}
      - {action: attack, value: 7, description: "Crushing Blow"}
  molten_ashling:
    name: "Pyre Bulwark (Molten Golem)"
    hp: 26
    intent_pattern:
      - {action: defend, value: 5, description: "Molten Plating"}
      - {action: attack, value: 8, description: "Magma Slam"}
      - {action: special, value: 4, description: "Spit Fire", applies_burn: true}
      - {action: attack, value: 10, description: "Pyre Eruption"}
  rootbound:
    name: "Rootbound Guardian (Hall Boss)"
    hp: 40
    intent_pattern:
      - {action: attack, value: 6, description: "Vines of Restraint"}
      - {action: heal, value: 8, description: "Tidal Rejuvenation"}
      - {action: attack, value: 12, description: "Gale-Force Slam"}
      - {action: special, value: 5, description: "Siphon Sap", self_heal: 5}

# Run map, ported directly from generateRunNodes() — 9 nodes, node 9 is the boss
run_nodes:
  - {id: 1, type: fight, name: "Alchemical Chamber", description: "A cinder beast blocks the descent.", enemy: ashling}
  - {id: 2, type: forage, name: "Shattered Herbarium", description: "Ruined shelves hold raw elemental compounds."}
  - {id: 3, type: fight, name: "The Obsidian Hearth", description: "A stone golem guards the inner passages.", enemy: bulwark}
  - {id: 4, type: forage, name: "Overgrown Drainage", description: "Moist tunnels hide volatile reagents."}
  - {id: 5, type: rest, name: "The Purging Flame", description: "A furnace site where toxins can be burned away."}
  - {id: 6, type: fight, name: "Cinder Ruins", description: "Molten plating drips from a golem warden.", enemy: molten_ashling}
  - {id: 7, type: forage, name: "Antechamber Shelf", description: "A narrow storage room with salvageable elements."}
  - {id: 8, type: rest, name: "The Hall of Solace", description: "A quiet chamber to restore the matrix."}
  - {id: 9, type: fight, name: "The Cauldron Heart", description: "The rootbound guardian awaits at the core.", enemy: rootbound}
`,k_=`layout_tree:
  - id: header
    type: row
    height: 60
    children:
      - {id: title, type: text, content: BREWFIELD}
      - {id: map_progress, type: progress_track, source: run_nodes}

  - id: main_content
    type: row
    flex: 1
    children:
      - id: left_column
        type: column
        children:
          - {id: deck_display, type: data_table, source: deck}
          - {id: objective_readout, type: text, content: "{activeNode.type}"}

      - id: center_column
        type: column
        flex: 2
        children:
          - {id: enemy_panel, type: panel, source: enemy}
          - id: cauldron_section
            type: panel
            children:
              - {id: element_slot_1, type: selectable_slot}
              - {id: element_slot_2, type: selectable_slot}
              - {id: component_selector, type: selectable_row, source: components}
              - {id: residue_display, type: data_table, source: residues}
              - {id: brew_button, type: action_button, label: Brew}
          - id: player_panel
            type: panel
            children:
              - {id: hp_display, type: stat_display, label: HP}
              - {id: hand_display, type: card_row, source: hand}

      - id: right_column
        type: column
        children:
          - {id: logbook, type: history_list, source: gameLogs}

  - id: footer
    type: row
    height: 30
    children:
      - {id: copyright, type: text, content: "© 2026 Brewfield"}
`,w_=`engine_version: "1.0"
engine_systems: []   # self-contained port — no shared engine system wiring

systems:
  - id: brewfield_core
    description: "Brewfield core loop: brewing, combat resolution, residue field, deck management"
    functions:
      - get_relation
      - solve_brew
      - update_residue_field
      - instantiate_enemy
      - get_enemy_intent
      - resolve_brew
      - resolve_enemy_turn
      - apply_residue_tick
      - advance_hand
      - resolve_turn
      - init_run
      - init_fight
      - init_player

entities:
  player:
    description: "Brewfield player state: hp, shield, dodge/retaliate/decaying-shield charges, burn debuff, deck/hand/draw/discard"
    systems: [brewfield_core]
    schema_ref: data.yaml#constants
  enemy:
    description: "Brewfield enemy state: archetype, hp, shield, telegraphed intent"
    systems: [brewfield_core]
    schema_ref: data.yaml#enemies
`,A_=`game:\r
  id: shoal\r
  name: Shoal\r
  version: "2.0"\r
  studio: RFDGameStudio\r
\r
world:\r
  width: 1200\r
  height: 800\r
  surface_depth: 0\r
  floor_depth: 800\r
  discrete_tick: 0.25\r
\r
spawn:\r
  initial_fish: 60\r
  initial_sharks: 8\r
  initial_algae_hubs: 6\r
  algae_spawn_depth: 180\r
\r
creatures:\r
  fish:\r
    max_speed: 120\r
    max_force: 80\r
    radius: 5\r
    perception:\r
      algae: 250\r
      shark: 190\r
      separate: 24\r
      school: 70\r
    escape_chance: 0.28\r
    escape_speed_bonus: 0.15\r
    escape_knockback: 20\r
    breed_age: 4\r
    breed_fed_threshold: 2\r
    carrying_capacity: 100\r
    hunger_rate: 0.05\r
    graze_radius: 8\r
    max_safe_cold_rate: 8\r
    max_turn_rate: 4.0\r
    home_depth: 180\r
    cold:\r
      threshold: 100\r
      damage_rate: 15\r
      damage_limit: 30\r
      decay_rate: 10\r
  shark:\r
    max_speed: 150\r
    max_force: 90\r
    radius: 7\r
    perception:\r
      fish: 220\r
      flesh: 220\r
    breed_age: 18\r
    breed_fed_threshold: 3\r
    starve_limit: 20\r
    max_turn_rate: 6.0\r
    home_depth: 300\r
    home_bias_weight: 1.0\r
    fish_hunger_refund: 4\r
    exposure:\r
      threshold: 100\r
      damage_rate: 20\r
      decay_rate: 10\r
    exposure_retreat_threshold: 70\r
    exposure_retreat_resume_threshold: 40\r
    exposure_retreat_weight: 3.0\r
\r
steering_weights:\r
  fish:\r
    seek_algae: 1.0\r
    flee_shark: 2.5\r
    separate: 1.0\r
    align: 0.6\r
    cohere: 0.35\r
    wander: 0.4\r
    depth_bias: 0.8\r
  shark:\r
    seek_fish: 1.5\r
    seek_flesh: 1.5\r
    wander: 0.3\r
\r
wander:\r
  circle_distance: 40\r
  circle_radius: 15\r
  change_interval: 0.4\r
\r
algae:\r
  nodule_radius: 6\r
  spoke_distances: [24, 48]\r
  regrow_cooldown: 3.0\r
  max_sunk_depth: 600\r
  min_surface_depth: 80\r
  depth_lerp_speed: 20\r
\r
flesh_chunk:\r
  radius: 5\r
  min_spawn: 1\r
  max_spawn: 3\r
  sink_rate: 10\r
  shark_eat_range: 20\r
  hunger_refund: 3\r
  floor_grace_time: 2.5\r
\r
depth_bands:\r
  - id: sunlit_surface\r
    top: 0\r
    bottom: 40\r
    exposure_rate: 40\r
    fish_cold_rate: 0\r
    color: "#e0f7ff"\r
  - id: epipelagic\r
    top: 40\r
    bottom: 120\r
    exposure_rate: 8\r
    fish_cold_rate: 0\r
    color: "#7dd3fc"\r
  - id: mesopelagic\r
    top: 120\r
    bottom: 280\r
    exposure_rate: 2\r
    fish_cold_rate: 3\r
    color: "#38bdf8"\r
  - id: bathypelagic\r
    top: 280\r
    bottom: 480\r
    exposure_rate: 1\r
    fish_cold_rate: 8\r
    color: "#0ea5e9"\r
  - id: abyssopelagic\r
    top: 480\r
    bottom: 680\r
    exposure_rate: 0\r
    fish_cold_rate: 18\r
    color: "#0369a1"\r
  - id: hadopelagic\r
    top: 680\r
    bottom: 800\r
    exposure_rate: 0\r
    fish_cold_rate: 35\r
    color: "#0c4a6e"\r
\r
spatial_hash:\r
  bucket_width: 120\r
  bucket_depth: 80\r
\r
render:\r
  fish_radius: 4\r
  shark_radius: 7\r
  nodule_radius: 6\r
  chunk_radius: 5\r
  algae_color: "#10b981"\r
  algae_dim_color: "#064e3b"\r
  algae_core_color: "#eab308"\r
  chunk_color: "#f43f5e"\r
`,b_=`layout:
  tabs: []

layout_tree:
  direction: column
  children:
    - id: hud
      height: 0.12
    - id: game_area
      flex: 1

regions:
  hud:
    component: hud
    bindings:
      fish_count: game_state.fish_count
      shark_count: game_state.shark_count
      algae_count: game_state.algae_count
      chunk_count: game_state.chunk_count
      tick_count: game_state.tick_count
  game_area:
    component: canvas

screens:
  - id: game
    title: Reef
    components:
      - type: panel
        id: hud
      - type: canvas
        id: game_canvas
`,T_=`engine_version: "1.0"
engine_systems: []   # self-contained port — no shared engine system wiring

lua_files:
  - utils.lua
  - state.lua
  - entities.lua
  - steering.lua
  - logic.lua

systems:
  - id: shoal_core
    description: "Shoal 2.0 continuous steering simulation"
    components:
      - fish
      - shark
      - algae
      - flesh_chunk
    functions:
      - init_game
      - tick_game
      - handle_input
      - get_state_summary
      - build_render_state

entities:
  - id: fish
    description: "Prey creature driven by steering behaviors"
    systems: [shoal_core]
  - id: shark
    description: "Predator driven by hunting and flesh-seeking"
    systems: [shoal_core]
  - id: algae
    description: "Algae Core with nodules that fish graze"
    systems: [shoal_core]
  - id: flesh_chunk
    description: "Remains left by dead creatures, edible by sharks"
    systems: [shoal_core]
`,E_={horse_racing:{data:t_,ui:r_,systems:a_},slither_rogue:{data:l_,ui:o_,systems:i_},mutant_battle_ball:{data:s_,ui:u_,systems:c_},slime_coin:{data:d_,ui:f_,systems:p_},chimera_wilds:{data:__,ui:h_,systems:m_},scrapcrawl:{data:g_,ui:y_,systems:v_},brewfield:{data:x_,ui:k_,systems:w_},shoal:{data:A_,ui:b_,systems:T_}},L_=Object.assign({"../../../games/brewfield/logic.lua":mp,"../../../games/chimera_wilds/logic.lua":gp,"../../../games/horse_racing/logic.lua":yp,"../../../games/mutant_battle_ball/logic.lua":vp,"../../../games/scrapcrawl/logic.lua":xp,"../../../games/shoal/entities.lua":kp,"../../../games/shoal/logic.lua":wp,"../../../games/shoal/state.lua":Ap,"../../../games/shoal/steering.lua":bp,"../../../games/shoal/utils.lua":Tp,"../../../games/slime_coin/logic.lua":Ep,"../../../games/slither_rogue/collision.lua":Lp,"../../../games/slither_rogue/logic.lua":Sp,"../../../games/slither_rogue/physics.lua":Op,"../../../games/slither_rogue/render.lua":Rp,"../../../games/slither_rogue/state.lua":Np,"../../../games/slither_rogue/utils.lua":Cp}),S_=Object.assign({"../../../engine/primitives/action.lua":Mp,"../../../engine/primitives/consequence.lua":Ip,"../../../engine/primitives/entity.lua":Up,"../../../engine/primitives/lifecycle.lua":Pp,"../../../engine/primitives/movement.lua":Dp,"../../../engine/primitives/physics.lua":Gp,"../../../engine/primitives/resolution.lua":Bp,"../../../engine/systems/combat.lua":Fp,"../../../engine/systems/genetics.lua":Vp,"../../../engine/systems/market.lua":jp,"../../../engine/systems/odds.lua":zp,"../../../engine/ui/resolver.lua":Hp});function O_(a=null,z=null){const d=a??L_,k=z??S_;function v(j,L){const H=`../../../games/${j}/${L}`,w=d[H];return w===void 0?(console.warn(`[loader] Lua file not found in bundle: ${H}`),""):w}function P(j,L){const H=`../../../engine/${j}/${L}`,w=k[H];return w===void 0?(console.warn(`[loader] Engine Lua file not found in bundle: ${H}`),""):w}const R=["action.lua","entity.lua","resolution.lua","consequence.lua","movement.lua","physics.lua","lifecycle.lua"];function C(j){const L=[];for(const H of R){const w=P("primitives",H);w&&L.push(w)}for(const H of j??[]){const w=P("systems",`${H}.lua`);w&&L.push(w)}return L.join(`

`)}return function(L){const H=E_[L];if(!H)throw new ga(`Unknown game: ${L}`);const w=qi.load(H.data),B=qi.load(H.ui);R_(w,L);const Q=qi.load(H.systems)??{},ce=Q.lua_files,$=Q.engine_systems,ve=C($??[]);let se;return ce&&ce.length>0?se=ce.map($e=>v(L,$e)).join(`

`):se=v(L,"logic.lua"),{gameId:L,data:w,ui:B,logic:se,engineSource:ve}}}const $c=O_(null,null);function R_(a,z){const d=a.game;if(!d)throw new ga("Missing required key: game");if(!d.id)throw new ga("Missing required key: game.id");if(!d.name)throw new ga("Missing required key: game.name");if(!d.version)throw new ga("Missing required key: game.version");if(!d.studio)throw new ga("Missing required key: game.studio");if(d.id!==z)throw new ga(`game.id mismatch: expected "${z}", got "${String(d.id)}"`)}function N_(){return new URLSearchParams(window.location.search).get("game")}function Tc(a){const z=window.location.href.split("?")[0];window.location.href=`${z}?game=${a}`}function Wi(){window.location.href=window.location.href.split("?")[0]}const Ec=hp,C_=new Set(["horse_racing","slither_rogue"]),Lc={stable:0,beta:1,dev:2,external:3};function Jr(a,z){const d=a[z];return Array.isArray(d)?d.length:d&&typeof d=="object"?Object.keys(d).length:0}function M_(a,z){var k;const d=[];switch(C_.has(a)&&d.push("PyGame renderer"),a){case"horse_racing":d.push(`${Jr(z,"race_classes")} race classes`);break;case"slither_rogue":d.push(`${Jr(z,"evolution_cards")} evolution cards`);break;case"mutant_battle_ball":d.push(`${Jr(z,"parts")} mutant parts`,`${Jr(z,"opponents")} opponents`);break;case"slime_coin":{const v=((k=z.round_config)==null?void 0:k.total_rounds)??0;d.push(`${v} rounds`,`${Jr(z,"chip_cards")} chip cards`);break}case"chimera_wilds":d.push(`${Jr(z,"parts")} mutant parts`,`${Jr(z,"part_slots")} body slots`);break;case"scrapcrawl":{const v=z.catalog;d.push(`${Jr(z,"rooms")} rooms`,`${Object.keys(v??{}).length} craftables`);break}}return d.join(" · ")}function I_(){const a=ya.useMemo(()=>[...Qi].sort((d,k)=>{var L,H;const v=d.status??"dev",P=k.status??"dev",R=(Lc[v]??99)-(Lc[P]??99);if(R!==0)return R;const C=((L=Ec[d.gameId])==null?void 0:L.last_updated)??"",j=((H=Ec[k.gameId])==null?void 0:H.last_updated)??"";return C===""&&j===""?0:C===""?1:j===""?-1:j.localeCompare(C)}),[]),z=ya.useMemo(()=>{const d={};for(const k of Qi){if(k.externalUrl&&k.embedUrl){d[k.gameId]="Rust/Bevy · itch.io";continue}if(k.embedUrl){d[k.gameId]="React/Tailwind · Standalone";continue}if(k.externalUrl){d[k.gameId]="External link";continue}try{const v=$c(k.gameId);d[k.gameId]=M_(k.gameId,v.data)}catch{d[k.gameId]="data unavailable"}}return d},[]);return tt.jsxs("div",{className:"arcade-index",children:[tt.jsxs("header",{className:"arcade-header",children:[tt.jsx("a",{href:"https://rfditservices.com/games/",className:"arcade-back-to-site",children:"← rfditservices.com"}),tt.jsxs("div",{className:"arcade-marquee",children:[tt.jsx("h1",{className:"arcade-logo",children:"RFD GAME STUDIO"}),tt.jsx("p",{className:"arcade-subtitle",children:"Portable Game Definition Format · Multi-Renderer"})]})]}),tt.jsxs("main",{className:"arcade-main",children:[tt.jsx("h2",{className:"arcade-section-title",children:"SELECT A GAME"}),tt.jsx("div",{className:"arcade-grid",children:a.map(d=>tt.jsx("button",{className:"arcade-card",style:{"--card-color":d.color??"var(--accent)"},onClick:()=>{d.embedUrl?Tc(d.gameId):d.externalUrl?window.open(d.externalUrl,"_blank","noopener,noreferrer"):Tc(d.gameId)},children:tt.jsxs("div",{className:"arcade-card-frame",children:[tt.jsxs("div",{className:"arcade-card-header",children:[tt.jsx("span",{className:"arcade-card-title",children:d.label}),tt.jsx("span",{className:`arcade-status arcade-status--${d.status??"stable"}`,children:(d.status??"stable").toUpperCase()})]}),tt.jsx("p",{className:"arcade-card-desc",children:d.description??""}),tt.jsx("div",{className:"arcade-card-detail",children:z[d.gameId]}),tt.jsx("div",{className:"arcade-card-id",children:d.gameId})]})},d.gameId))})]}),tt.jsxs("footer",{className:"arcade-footer",children:[tt.jsx("span",{children:"© 2026 RFD IT Services Ltd."}),tt.jsx("span",{className:"arcade-footer-sep",children:"·"}),tt.jsx("span",{children:"Lua + Python + TypeScript"})]})]})}var Yi,Sc;function U_(){return Sc||(Sc=1,Yi=(function(a){var z={};function d(k){if(z[k])return z[k].exports;var v=z[k]={i:k,l:!1,exports:{}};return a[k].call(v.exports,v,v.exports,d),v.l=!0,v.exports}return d.m=a,d.c=z,d.d=function(k,v,P){d.o(k,v)||Object.defineProperty(k,v,{enumerable:!0,get:P})},d.r=function(k){typeof Symbol<"u"&&Symbol.toStringTag&&Object.defineProperty(k,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(k,"__esModule",{value:!0})},d.t=function(k,v){if(1&v&&(k=d(k)),8&v||4&v&&typeof k=="object"&&k&&k.__esModule)return k;var P=Object.create(null);if(d.r(P),Object.defineProperty(P,"default",{enumerable:!0,value:k}),2&v&&typeof k!="string")for(var R in k)d.d(P,R,(function(C){return k[C]}).bind(null,R));return P},d.n=function(k){var v=k&&k.__esModule?function(){return k.default}:function(){return k};return d.d(v,"a",v),v},d.o=function(k,v){return Object.prototype.hasOwnProperty.call(k,v)},d.p="",d(d.s=34)})([function(a,z,d){/**
	@license MIT

	Copyright © 2017-2018 Benoit Giannangeli
	Copyright © 2017-2018 Daurnimator
	Copyright © 1994–2017 Lua.org, PUC-Rio.
	*/const k=d(5);a.exports.FENGARI_AUTHORS=k.FENGARI_AUTHORS,a.exports.FENGARI_COPYRIGHT=k.FENGARI_COPYRIGHT,a.exports.FENGARI_RELEASE=k.FENGARI_RELEASE,a.exports.FENGARI_VERSION=k.FENGARI_VERSION,a.exports.FENGARI_VERSION_MAJOR=k.FENGARI_VERSION_MAJOR,a.exports.FENGARI_VERSION_MINOR=k.FENGARI_VERSION_MINOR,a.exports.FENGARI_VERSION_NUM=k.FENGARI_VERSION_NUM,a.exports.FENGARI_VERSION_RELEASE=k.FENGARI_VERSION_RELEASE,a.exports.luastring_eq=k.luastring_eq,a.exports.luastring_indexOf=k.luastring_indexOf,a.exports.luastring_of=k.luastring_of,a.exports.to_jsstring=k.to_jsstring,a.exports.to_luastring=k.to_luastring,a.exports.to_uristring=k.to_uristring;const v=d(3),P=d(2),R=d(7),C=d(17);a.exports.luaconf=v,a.exports.lua=P,a.exports.lauxlib=R,a.exports.lualib=C},function(a,z,d){let k,v,P;if(k=typeof Uint8Array.from=="function"?Uint8Array.from.bind(Uint8Array):function($){let ve=0,se=$.length,$e=new Uint8Array(se);for(;se>ve;)$e[ve]=$[ve++];return $e},typeof new Uint8Array().indexOf=="function")v=function($,ve,se){return $.indexOf(ve,se)};else{let $=[].indexOf;if($.call(new Uint8Array(1),0)!==0)throw Error("missing .indexOf");v=function(ve,se,$e){return $.call(ve,se,$e)}}P=typeof Uint8Array.of=="function"?Uint8Array.of.bind(Uint8Array):function(){return k(arguments)};const R=function($){return $ instanceof Uint8Array},C="cannot convert invalid utf8 to javascript string",j=";,/?:@&=+$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789,-_.!~*'()#".split("").reduce(function($,ve){return $[ve.charCodeAt(0)]=!0,$},{}),L={},H=function($,ve){if(typeof $!="string")throw new TypeError("to_luastring expects a javascript string");if(ve){let Ke=L[$];if(R(Ke))return Ke}let se=$.length,$e=Array(se),nn=0;for(let Ke=0;Ke<se;++Ke){let Xe=$.charCodeAt(Ke);if(Xe<=127)$e[nn++]=Xe;else if(Xe<=2047)$e[nn++]=192|Xe>>6,$e[nn++]=128|63&Xe;else{if(Xe>=55296&&Xe<=56319&&Ke+1<se){let ln=$.charCodeAt(Ke+1);ln>=56320&&ln<=57343&&(Ke++,Xe=1024*(Xe-55296)+ln+9216)}Xe<=65535?($e[nn++]=224|Xe>>12,$e[nn++]=128|Xe>>6&63,$e[nn++]=128|63&Xe):($e[nn++]=240|Xe>>18,$e[nn++]=128|Xe>>12&63,$e[nn++]=128|Xe>>6&63,$e[nn++]=128|63&Xe)}}return $e=k($e),ve&&(L[$]=$e),$e};a.exports.luastring_from=k,a.exports.luastring_indexOf=v,a.exports.luastring_of=P,a.exports.is_luastring=R,a.exports.luastring_eq=function($,ve){if($!==ve){let se=$.length;if(se!==ve.length)return!1;for(let $e=0;$e<se;$e++)if($[$e]!==ve[$e])return!1}return!0},a.exports.to_jsstring=function($,ve,se,$e){if(!R($))throw new TypeError("to_jsstring expects a Uint8Array");se=se===void 0?$.length:Math.min($.length,se);let nn="";for(let Ke=ve!==void 0?ve:0;Ke<se;){let Xe=$[Ke++];if(Xe<128)nn+=String.fromCharCode(Xe);else if(Xe<194||Xe>244){if(!$e)throw RangeError(C);nn+="�"}else if(Xe<=223){if(Ke>=se){if(!$e)throw RangeError(C);nn+="�";continue}let ln=$[Ke++];if((192&ln)!=128){if(!$e)throw RangeError(C);nn+="�";continue}nn+=String.fromCharCode(((31&Xe)<<6)+(63&ln))}else if(Xe<=239){if(Ke+1>=se){if(!$e)throw RangeError(C);nn+="�";continue}let ln=$[Ke++];if((192&ln)!=128){if(!$e)throw RangeError(C);nn+="�";continue}let D=$[Ke++];if((192&D)!=128){if(!$e)throw RangeError(C);nn+="�";continue}let re=((15&Xe)<<12)+((63&ln)<<6)+(63&D);if(re<=65535)nn+=String.fromCharCode(re);else{let ke=55296+((re-=65536)>>10),ge=re%1024+56320;nn+=String.fromCharCode(ke,ge)}}else{if(Ke+2>=se){if(!$e)throw RangeError(C);nn+="�";continue}let ln=$[Ke++];if((192&ln)!=128){if(!$e)throw RangeError(C);nn+="�";continue}let D=$[Ke++];if((192&D)!=128){if(!$e)throw RangeError(C);nn+="�";continue}let re=$[Ke++];if((192&re)!=128){if(!$e)throw RangeError(C);nn+="�";continue}let ke=((7&Xe)<<18)+((63&ln)<<12)+((63&D)<<6)+(63&re),ge=55296+((ke-=65536)>>10),Oe=ke%1024+56320;nn+=String.fromCharCode(ge,Oe)}}return nn},a.exports.to_uristring=function($){if(!R($))throw new TypeError("to_uristring expects a Uint8Array");let ve="";for(let se=0;se<$.length;se++){let $e=$[se];j[$e]?ve+=String.fromCharCode($e):ve+="%"+($e<16?"0":"")+$e.toString(16)}return ve},a.exports.to_luastring=H,a.exports.from_userstring=function($){if(!R($)){if(typeof $!="string")throw new TypeError("expects an array of bytes or javascript string");$=H($)}return $};const w=H("\x1BLua");a.exports.LUA_SIGNATURE=w,a.exports.LUA_VERSION_MAJOR="5",a.exports.LUA_VERSION_MINOR="3",a.exports.LUA_VERSION_NUM=503,a.exports.LUA_VERSION_RELEASE="4",a.exports.LUA_VERSION="Lua 5.3",a.exports.LUA_RELEASE="Lua 5.3.4",a.exports.LUA_COPYRIGHT="Lua 5.3.4  Copyright (C) 1994-2017 Lua.org, PUC-Rio",a.exports.LUA_AUTHORS="R. Ierusalimschy, L. H. de Figueiredo, W. Celes";const B={LUA_TNONE:-1,LUA_TNIL:0,LUA_TBOOLEAN:1,LUA_TLIGHTUSERDATA:2,LUA_TNUMBER:3,LUA_TSTRING:4,LUA_TTABLE:5,LUA_TFUNCTION:6,LUA_TUSERDATA:7,LUA_TTHREAD:8,LUA_NUMTAGS:9};B.LUA_TSHRSTR=0|B.LUA_TSTRING,B.LUA_TLNGSTR=16|B.LUA_TSTRING,B.LUA_TNUMFLT=0|B.LUA_TNUMBER,B.LUA_TNUMINT=16|B.LUA_TNUMBER,B.LUA_TLCL=0|B.LUA_TFUNCTION,B.LUA_TLCF=16|B.LUA_TFUNCTION,B.LUA_TCCL=32|B.LUA_TFUNCTION;const{LUAI_MAXSTACK:Q}=d(3),ce=-Q-1e3;a.exports.LUA_HOOKCALL=0,a.exports.LUA_HOOKCOUNT=3,a.exports.LUA_HOOKLINE=2,a.exports.LUA_HOOKRET=1,a.exports.LUA_HOOKTAILCALL=4,a.exports.LUA_MASKCALL=1,a.exports.LUA_MASKCOUNT=8,a.exports.LUA_MASKLINE=4,a.exports.LUA_MASKRET=2,a.exports.LUA_MINSTACK=20,a.exports.LUA_MULTRET=-1,a.exports.LUA_OPADD=0,a.exports.LUA_OPBAND=7,a.exports.LUA_OPBNOT=13,a.exports.LUA_OPBOR=8,a.exports.LUA_OPBXOR=9,a.exports.LUA_OPDIV=5,a.exports.LUA_OPEQ=0,a.exports.LUA_OPIDIV=6,a.exports.LUA_OPLE=2,a.exports.LUA_OPLT=1,a.exports.LUA_OPMOD=3,a.exports.LUA_OPMUL=2,a.exports.LUA_OPPOW=4,a.exports.LUA_OPSHL=10,a.exports.LUA_OPSHR=11,a.exports.LUA_OPSUB=1,a.exports.LUA_OPUNM=12,a.exports.LUA_REGISTRYINDEX=ce,a.exports.LUA_RIDX_GLOBALS=2,a.exports.LUA_RIDX_LAST=2,a.exports.LUA_RIDX_MAINTHREAD=1,a.exports.constant_types=B,a.exports.lua_Debug=class{constructor(){this.event=NaN,this.name=null,this.namewhat=null,this.what=null,this.source=null,this.currentline=NaN,this.linedefined=NaN,this.lastlinedefined=NaN,this.nups=NaN,this.nparams=NaN,this.isvararg=NaN,this.istailcall=NaN,this.short_src=null,this.i_ci=null}},a.exports.lua_upvalueindex=function($){return ce-$},a.exports.thread_status={LUA_OK:0,LUA_YIELD:1,LUA_ERRRUN:2,LUA_ERRSYNTAX:3,LUA_ERRMEM:4,LUA_ERRGCMM:5,LUA_ERRERR:6}},function(a,z,d){const k=d(1),v=d(18),P=d(11),R=d(8),C=d(12);a.exports.LUA_AUTHORS=k.LUA_AUTHORS,a.exports.LUA_COPYRIGHT=k.LUA_COPYRIGHT,a.exports.LUA_ERRERR=k.thread_status.LUA_ERRERR,a.exports.LUA_ERRGCMM=k.thread_status.LUA_ERRGCMM,a.exports.LUA_ERRMEM=k.thread_status.LUA_ERRMEM,a.exports.LUA_ERRRUN=k.thread_status.LUA_ERRRUN,a.exports.LUA_ERRSYNTAX=k.thread_status.LUA_ERRSYNTAX,a.exports.LUA_HOOKCALL=k.LUA_HOOKCALL,a.exports.LUA_HOOKCOUNT=k.LUA_HOOKCOUNT,a.exports.LUA_HOOKLINE=k.LUA_HOOKLINE,a.exports.LUA_HOOKRET=k.LUA_HOOKRET,a.exports.LUA_HOOKTAILCALL=k.LUA_HOOKTAILCALL,a.exports.LUA_MASKCALL=k.LUA_MASKCALL,a.exports.LUA_MASKCOUNT=k.LUA_MASKCOUNT,a.exports.LUA_MASKLINE=k.LUA_MASKLINE,a.exports.LUA_MASKRET=k.LUA_MASKRET,a.exports.LUA_MINSTACK=k.LUA_MINSTACK,a.exports.LUA_MULTRET=k.LUA_MULTRET,a.exports.LUA_NUMTAGS=k.constant_types.LUA_NUMTAGS,a.exports.LUA_OK=k.thread_status.LUA_OK,a.exports.LUA_OPADD=k.LUA_OPADD,a.exports.LUA_OPBAND=k.LUA_OPBAND,a.exports.LUA_OPBNOT=k.LUA_OPBNOT,a.exports.LUA_OPBOR=k.LUA_OPBOR,a.exports.LUA_OPBXOR=k.LUA_OPBXOR,a.exports.LUA_OPDIV=k.LUA_OPDIV,a.exports.LUA_OPEQ=k.LUA_OPEQ,a.exports.LUA_OPIDIV=k.LUA_OPIDIV,a.exports.LUA_OPLE=k.LUA_OPLE,a.exports.LUA_OPLT=k.LUA_OPLT,a.exports.LUA_OPMOD=k.LUA_OPMOD,a.exports.LUA_OPMUL=k.LUA_OPMUL,a.exports.LUA_OPPOW=k.LUA_OPPOW,a.exports.LUA_OPSHL=k.LUA_OPSHL,a.exports.LUA_OPSHR=k.LUA_OPSHR,a.exports.LUA_OPSUB=k.LUA_OPSUB,a.exports.LUA_OPUNM=k.LUA_OPUNM,a.exports.LUA_REGISTRYINDEX=k.LUA_REGISTRYINDEX,a.exports.LUA_RELEASE=k.LUA_RELEASE,a.exports.LUA_RIDX_GLOBALS=k.LUA_RIDX_GLOBALS,a.exports.LUA_RIDX_LAST=k.LUA_RIDX_LAST,a.exports.LUA_RIDX_MAINTHREAD=k.LUA_RIDX_MAINTHREAD,a.exports.LUA_SIGNATURE=k.LUA_SIGNATURE,a.exports.LUA_TNONE=k.constant_types.LUA_TNONE,a.exports.LUA_TNIL=k.constant_types.LUA_TNIL,a.exports.LUA_TBOOLEAN=k.constant_types.LUA_TBOOLEAN,a.exports.LUA_TLIGHTUSERDATA=k.constant_types.LUA_TLIGHTUSERDATA,a.exports.LUA_TNUMBER=k.constant_types.LUA_TNUMBER,a.exports.LUA_TSTRING=k.constant_types.LUA_TSTRING,a.exports.LUA_TTABLE=k.constant_types.LUA_TTABLE,a.exports.LUA_TFUNCTION=k.constant_types.LUA_TFUNCTION,a.exports.LUA_TUSERDATA=k.constant_types.LUA_TUSERDATA,a.exports.LUA_TTHREAD=k.constant_types.LUA_TTHREAD,a.exports.LUA_VERSION=k.LUA_VERSION,a.exports.LUA_VERSION_MAJOR=k.LUA_VERSION_MAJOR,a.exports.LUA_VERSION_MINOR=k.LUA_VERSION_MINOR,a.exports.LUA_VERSION_NUM=k.LUA_VERSION_NUM,a.exports.LUA_VERSION_RELEASE=k.LUA_VERSION_RELEASE,a.exports.LUA_YIELD=k.thread_status.LUA_YIELD,a.exports.lua_Debug=k.lua_Debug,a.exports.lua_upvalueindex=k.lua_upvalueindex,a.exports.lua_absindex=v.lua_absindex,a.exports.lua_arith=v.lua_arith,a.exports.lua_atpanic=v.lua_atpanic,a.exports.lua_atnativeerror=v.lua_atnativeerror,a.exports.lua_call=v.lua_call,a.exports.lua_callk=v.lua_callk,a.exports.lua_checkstack=v.lua_checkstack,a.exports.lua_close=C.lua_close,a.exports.lua_compare=v.lua_compare,a.exports.lua_concat=v.lua_concat,a.exports.lua_copy=v.lua_copy,a.exports.lua_createtable=v.lua_createtable,a.exports.lua_dump=v.lua_dump,a.exports.lua_error=v.lua_error,a.exports.lua_gc=v.lua_gc,a.exports.lua_getallocf=v.lua_getallocf,a.exports.lua_getextraspace=v.lua_getextraspace,a.exports.lua_getfield=v.lua_getfield,a.exports.lua_getglobal=v.lua_getglobal,a.exports.lua_gethook=P.lua_gethook,a.exports.lua_gethookcount=P.lua_gethookcount,a.exports.lua_gethookmask=P.lua_gethookmask,a.exports.lua_geti=v.lua_geti,a.exports.lua_getinfo=P.lua_getinfo,a.exports.lua_getlocal=P.lua_getlocal,a.exports.lua_getmetatable=v.lua_getmetatable,a.exports.lua_getstack=P.lua_getstack,a.exports.lua_gettable=v.lua_gettable,a.exports.lua_gettop=v.lua_gettop,a.exports.lua_getupvalue=v.lua_getupvalue,a.exports.lua_getuservalue=v.lua_getuservalue,a.exports.lua_insert=v.lua_insert,a.exports.lua_isboolean=v.lua_isboolean,a.exports.lua_iscfunction=v.lua_iscfunction,a.exports.lua_isfunction=v.lua_isfunction,a.exports.lua_isinteger=v.lua_isinteger,a.exports.lua_islightuserdata=v.lua_islightuserdata,a.exports.lua_isnil=v.lua_isnil,a.exports.lua_isnone=v.lua_isnone,a.exports.lua_isnoneornil=v.lua_isnoneornil,a.exports.lua_isnumber=v.lua_isnumber,a.exports.lua_isproxy=v.lua_isproxy,a.exports.lua_isstring=v.lua_isstring,a.exports.lua_istable=v.lua_istable,a.exports.lua_isthread=v.lua_isthread,a.exports.lua_isuserdata=v.lua_isuserdata,a.exports.lua_isyieldable=R.lua_isyieldable,a.exports.lua_len=v.lua_len,a.exports.lua_load=v.lua_load,a.exports.lua_newstate=C.lua_newstate,a.exports.lua_newtable=v.lua_newtable,a.exports.lua_newthread=C.lua_newthread,a.exports.lua_newuserdata=v.lua_newuserdata,a.exports.lua_next=v.lua_next,a.exports.lua_pcall=v.lua_pcall,a.exports.lua_pcallk=v.lua_pcallk,a.exports.lua_pop=v.lua_pop,a.exports.lua_pushboolean=v.lua_pushboolean,a.exports.lua_pushcclosure=v.lua_pushcclosure,a.exports.lua_pushcfunction=v.lua_pushcfunction,a.exports.lua_pushfstring=v.lua_pushfstring,a.exports.lua_pushglobaltable=v.lua_pushglobaltable,a.exports.lua_pushinteger=v.lua_pushinteger,a.exports.lua_pushjsclosure=v.lua_pushjsclosure,a.exports.lua_pushjsfunction=v.lua_pushjsfunction,a.exports.lua_pushlightuserdata=v.lua_pushlightuserdata,a.exports.lua_pushliteral=v.lua_pushliteral,a.exports.lua_pushlstring=v.lua_pushlstring,a.exports.lua_pushnil=v.lua_pushnil,a.exports.lua_pushnumber=v.lua_pushnumber,a.exports.lua_pushstring=v.lua_pushstring,a.exports.lua_pushthread=v.lua_pushthread,a.exports.lua_pushvalue=v.lua_pushvalue,a.exports.lua_pushvfstring=v.lua_pushvfstring,a.exports.lua_rawequal=v.lua_rawequal,a.exports.lua_rawget=v.lua_rawget,a.exports.lua_rawgeti=v.lua_rawgeti,a.exports.lua_rawgetp=v.lua_rawgetp,a.exports.lua_rawlen=v.lua_rawlen,a.exports.lua_rawset=v.lua_rawset,a.exports.lua_rawseti=v.lua_rawseti,a.exports.lua_rawsetp=v.lua_rawsetp,a.exports.lua_register=v.lua_register,a.exports.lua_remove=v.lua_remove,a.exports.lua_replace=v.lua_replace,a.exports.lua_resume=R.lua_resume,a.exports.lua_rotate=v.lua_rotate,a.exports.lua_setallof=R.lua_setallof,a.exports.lua_setfield=v.lua_setfield,a.exports.lua_setglobal=v.lua_setglobal,a.exports.lua_sethook=P.lua_sethook,a.exports.lua_seti=v.lua_seti,a.exports.lua_setlocal=P.lua_setlocal,a.exports.lua_setmetatable=v.lua_setmetatable,a.exports.lua_settable=v.lua_settable,a.exports.lua_settop=v.lua_settop,a.exports.lua_setupvalue=v.lua_setupvalue,a.exports.lua_setuservalue=v.lua_setuservalue,a.exports.lua_status=v.lua_status,a.exports.lua_stringtonumber=v.lua_stringtonumber,a.exports.lua_toboolean=v.lua_toboolean,a.exports.lua_todataview=v.lua_todataview,a.exports.lua_tointeger=v.lua_tointeger,a.exports.lua_tointegerx=v.lua_tointegerx,a.exports.lua_tojsstring=v.lua_tojsstring,a.exports.lua_tolstring=v.lua_tolstring,a.exports.lua_tonumber=v.lua_tonumber,a.exports.lua_tonumberx=v.lua_tonumberx,a.exports.lua_topointer=v.lua_topointer,a.exports.lua_toproxy=v.lua_toproxy,a.exports.lua_tostring=v.lua_tostring,a.exports.lua_tothread=v.lua_tothread,a.exports.lua_touserdata=v.lua_touserdata,a.exports.lua_type=v.lua_type,a.exports.lua_typename=v.lua_typename,a.exports.lua_upvalueid=v.lua_upvalueid,a.exports.lua_upvaluejoin=v.lua_upvaluejoin,a.exports.lua_version=v.lua_version,a.exports.lua_xmove=v.lua_xmove,a.exports.lua_yield=R.lua_yield,a.exports.lua_yieldk=R.lua_yieldk,a.exports.lua_tocfunction=v.lua_tocfunction},function(a,z,d){const k={},{LUA_VERSION_MAJOR:v,LUA_VERSION_MINOR:P,to_luastring:R}=d(1);a.exports.LUA_PATH_SEP=";",a.exports.LUA_PATH_MARK="?",a.exports.LUA_EXEC_DIR="!";const C=v+"."+P;a.exports.LUA_VDIR=C;{a.exports.LUA_DIRSEP="/";const ce="./lua/"+C+"/";a.exports.LUA_LDIR=ce;const $=ce;a.exports.LUA_JSDIR=$;const ve=R(ce+"?.lua;"+ce+"?/init.lua;./?.lua;./?/init.lua");a.exports.LUA_PATH_DEFAULT=ve;const se=R($+"?.js;"+$+"loadall.js;./?.js");a.exports.LUA_JSPATH_DEFAULT=se}const j=k.LUA_COMPAT_FLOATSTRING||!1,L=k.LUAI_MAXSTACK||1e6,H=k.LUA_IDSIZE||59,w=k.LUAL_BUFFERSIZE||8192,B=function(Q,ce){for(var $=Math.min(3,Math.ceil(Math.abs(ce)/1023)),ve=Q,se=0;se<$;se++)ve*=Math.pow(2,Math.floor((ce+se)/$));return ve};a.exports.LUAI_MAXSTACK=L,a.exports.LUA_COMPAT_FLOATSTRING=j,a.exports.LUA_IDSIZE=H,a.exports.LUA_INTEGER_FMT="%d",a.exports.LUA_INTEGER_FRMLEN="",a.exports.LUA_MAXINTEGER=2147483647,a.exports.LUA_MININTEGER=-2147483648,a.exports.LUA_NUMBER_FMT="%.14g",a.exports.LUA_NUMBER_FRMLEN="",a.exports.LUAL_BUFFERSIZE=w,a.exports.frexp=function(Q){if(Q===0)return[Q,0];var ce=new DataView(new ArrayBuffer(8));ce.setFloat64(0,Q);var $=ce.getUint32(0)>>>20&2047;$===0&&(ce.setFloat64(0,Q*Math.pow(2,64)),$=(ce.getUint32(0)>>>20&2047)-64);var ve=$-1022;return[B(Q,-ve),ve]},a.exports.ldexp=B,a.exports.lua_getlocaledecpoint=function(){return 46},a.exports.lua_integer2str=function(Q){return String(Q)},a.exports.lua_number2str=function(Q){return String(Number(Q.toPrecision(14)))},a.exports.lua_numbertointeger=function(Q){return Q>=-2147483648&&Q<2147483648&&Q},a.exports.luai_apicheck=function(Q,ce){if(!ce)throw Error(ce)}},function(a,z,d){const{luai_apicheck:k}=d(3),v=function(P){if(!P)throw Error("assertion failed")};a.exports.lua_assert=v,a.exports.luai_apicheck=k||function(P,R){return v(R)},a.exports.api_check=function(P,R,C){return k(P,R&&C)},a.exports.LUAI_MAXCCALLS=200,a.exports.LUA_MINBUFFER=32,a.exports.luai_nummod=function(P,R,C){let j=R%C;return j*C<0&&(j+=C),j},a.exports.MAX_INT=2147483647,a.exports.MIN_INT=-2147483648},function(a,z,d){const k=d(1),v=`Fengari 0.1.4  Copyright (C) 2017-2018 B. Giannangeli, Daurnimator
Based on: `+k.LUA_COPYRIGHT;a.exports.FENGARI_AUTHORS="B. Giannangeli, Daurnimator",a.exports.FENGARI_COPYRIGHT=v,a.exports.FENGARI_RELEASE="Fengari 0.1.4",a.exports.FENGARI_VERSION="Fengari 0.1",a.exports.FENGARI_VERSION_MAJOR="0",a.exports.FENGARI_VERSION_MINOR="1",a.exports.FENGARI_VERSION_NUM=1,a.exports.FENGARI_VERSION_RELEASE="4",a.exports.is_luastring=k.is_luastring,a.exports.luastring_eq=k.luastring_eq,a.exports.luastring_from=k.luastring_from,a.exports.luastring_indexOf=k.luastring_indexOf,a.exports.luastring_of=k.luastring_of,a.exports.to_jsstring=k.to_jsstring,a.exports.to_luastring=k.to_luastring,a.exports.to_uristring=k.to_uristring,a.exports.from_userstring=k.from_userstring},function(a,z,d){const{LUA_OPADD:k,LUA_OPBAND:v,LUA_OPBNOT:P,LUA_OPBOR:R,LUA_OPBXOR:C,LUA_OPDIV:j,LUA_OPIDIV:L,LUA_OPMOD:H,LUA_OPMUL:w,LUA_OPPOW:B,LUA_OPSHL:Q,LUA_OPSHR:ce,LUA_OPSUB:$,LUA_OPUNM:ve,constant_types:{LUA_NUMTAGS:se,LUA_TBOOLEAN:$e,LUA_TCCL:nn,LUA_TFUNCTION:Ke,LUA_TLCF:Xe,LUA_TLCL:ln,LUA_TLIGHTUSERDATA:D,LUA_TLNGSTR:re,LUA_TNIL:ke,LUA_TNUMBER:ge,LUA_TNUMFLT:Oe,LUA_TNUMINT:tn,LUA_TSHRSTR:an,LUA_TSTRING:sn,LUA_TTABLE:ae,LUA_TTHREAD:oe,LUA_TUSERDATA:ze},from_userstring:M,luastring_indexOf:Ce,luastring_of:T,to_jsstring:g,to_luastring:S}=d(1),{lisdigit:xe,lisprint:Ae,lisspace:pn,lisxdigit:Ze}=d(22),dn=d(11),mn=d(8),Y=d(12),{luaS_bless:ee,luaS_new:Ie}=d(10),Te=d(9),{LUA_COMPAT_FLOATSTRING:rn,ldexp:On,lua_integer2str:kn,lua_number2str:Je}=d(3),le=d(15),{MAX_INT:Ue,luai_nummod:N,lua_assert:me}=d(4),He=d(14),G=se,be=se+1;class Pe{constructor(s,_){this.type=s,this.value=_}ttype(){return 63&this.type}ttnov(){return 15&this.type}checktag(s){return this.type===s}checktype(s){return this.ttnov()===s}ttisnumber(){return this.checktype(ge)}ttisfloat(){return this.checktag(Oe)}ttisinteger(){return this.checktag(tn)}ttisnil(){return this.checktag(ke)}ttisboolean(){return this.checktag($e)}ttislightuserdata(){return this.checktag(D)}ttisstring(){return this.checktype(sn)}ttisshrstring(){return this.checktag(an)}ttislngstring(){return this.checktag(re)}ttistable(){return this.checktag(ae)}ttisfunction(){return this.checktype(Ke)}ttisclosure(){return(31&this.type)===Ke}ttisCclosure(){return this.checktag(nn)}ttisLclosure(){return this.checktag(ln)}ttislcf(){return this.checktag(Xe)}ttisfulluserdata(){return this.checktag(ze)}ttisthread(){return this.checktag(oe)}ttisdeadkey(){return this.checktag(be)}l_isfalse(){return this.ttisnil()||this.ttisboolean()&&this.value===!1}setfltvalue(s){this.type=Oe,this.value=s}chgfltvalue(s){me(this.type==Oe),this.value=s}setivalue(s){this.type=tn,this.value=s}chgivalue(s){me(this.type==tn),this.value=s}setnilvalue(){this.type=ke,this.value=null}setfvalue(s){this.type=Xe,this.value=s}setpvalue(s){this.type=D,this.value=s}setbvalue(s){this.type=$e,this.value=s}setsvalue(s){this.type=re,this.value=s}setuvalue(s){this.type=ze,this.value=s}setthvalue(s){this.type=oe,this.value=s}setclLvalue(s){this.type=ln,this.value=s}setclCvalue(s){this.type=nn,this.value=s}sethvalue(s){this.type=ae,this.value=s}setdeadvalue(){this.type=be,this.value=null}setfrom(s){this.type=s.type,this.value=s.value}tsvalue(){return me(this.ttisstring()),this.value}svalue(){return this.tsvalue().getstr()}vslen(){return this.tsvalue().tsslen()}jsstring(s,_){return g(this.svalue(),s,_,!0)}}const Nn=function(l,s,_){l.stack[s].setsvalue(_)},Un=new Pe(ke,null);Object.freeze(Un),a.exports.luaO_nilobject=Un;class Mn{constructor(s,_){this.id=s.l_G.id_counter++,this.p=null,this.nupvalues=_,this.upvals=new Array(_)}}class Zn{constructor(s,_,c){for(this.id=s.l_G.id_counter++,this.f=_,this.nupvalues=c,this.upvalue=new Array(c);c--;)this.upvalue[c]=new Pe(ke,null)}}class ot{constructor(s,_){this.id=s.l_G.id_counter++,this.metatable=null,this.uservalue=new Pe(ke,null),this.len=_,this.data=Object.create(null)}}const o=S("..."),de=S('[string "'),h=S('"]'),q=function(l){return xe(l)?l-48:(223&l)-55},F=function(l,s){let _=1;if(me(s<=1114111),s<128)l[7]=s;else{let c=63;do l[8-_++]=128|63&s,s>>=6,c>>=1;while(s>c);l[8-_]=~c<<1|s}return _},J=function(l,s){let _=s==="x"?(function(c){let m,O=0,y=0,ne=0,en=0,gn=0,Bn=!1;for(;pn(c[O]);)O++;if(((m=c[O]===45)||c[O]===43)&&O++,c[O]!==48||c[O+1]!==120&&c[O+1]!==88)return null;for(O+=2;;O++)if(c[O]===46){if(Bn)break;Bn=!0}else{if(!Ze(c[O]))break;ne===0&&c[O]===48?en++:++ne<=30?y=16*y+q(c[O]):gn++,Bn&&gn--}if(en+ne===0)return null;if(gn*=4,c[O]===112||c[O]===80){let Kn,pe=0;if(((Kn=c[++O]===45)||c[O]===43)&&O++,!xe(c[O]))return null;for(;xe(c[O]);)pe=10*pe+c[O++]-48;Kn&&(pe=-pe),gn+=pe}return m&&(y=-y),{n:On(y,gn),i:O}})(l):(function(c){try{c=g(c)}catch{return null}let m=/^[\t\v\f \n\r]*[+-]?(?:[0-9]+\.?[0-9]*|\.[0-9]*)(?:[eE][+-]?[0-9]+)?/.exec(c);if(!m)return null;let O=parseFloat(m[0]);return isNaN(O)?null:{n:O,i:m[0].length}})(l);if(_===null)return null;for(;pn(l[_.i]);)_.i++;return _.i===l.length||l[_.i]===0?_:null},f=[46,120,88,110,78],I={46:".",120:"x",88:"x",110:"n",78:"n"},te=Math.floor(Ue/10),Ee=Ue%10,Le=function(l,s){let _;if(s.ttisinteger())_=S(kn(s.value));else{let c=Je(s.value);!rn&&/^[-0123456789]+$/.test(c)&&(c+=".0"),_=S(c)}s.setsvalue(ee(l,_))},De=function(l,s){mn.luaD_inctop(l),Nn(l,l.top-1,Ie(l,s))},qe=function(l,s,_){let c,m=0,O=0,y=0;for(;(c=Ce(s,37,O))!=-1;){switch(De(l,s.subarray(O,c)),s[c+1]){case 115:{let ne=_[y++];if(ne===null)ne=S("(null)",!0);else{ne=M(ne);let en=Ce(ne,0);en!==-1&&(ne=ne.subarray(0,en))}De(l,ne);break}case 99:{let ne=_[y++];Ae(ne)?De(l,T(ne)):Fe(l,S("<\\%d>",!0),ne);break}case 100:case 73:mn.luaD_inctop(l),l.stack[l.top-1].setivalue(_[y++]),Le(l,l.stack[l.top-1]);break;case 102:mn.luaD_inctop(l),l.stack[l.top-1].setfltvalue(_[y++]),Le(l,l.stack[l.top-1]);break;case 112:{let ne=_[y++];if(ne instanceof Y.lua_State||ne instanceof Te.Table||ne instanceof ot||ne instanceof Mn||ne instanceof Zn)De(l,S("0x"+ne.id.toString(16)));else switch(typeof ne){case"undefined":De(l,S("undefined"));break;case"number":De(l,S("Number("+ne+")"));break;case"string":De(l,S("String("+JSON.stringify(ne)+")"));break;case"boolean":De(l,S(ne?"Boolean(true)":"Boolean(false)"));break;case"object":if(ne===null){De(l,S("null"));break}case"function":{let en=l.l_G.ids.get(ne);en||(en=l.l_G.id_counter++,l.l_G.ids.set(ne,en)),De(l,S("0x"+en.toString(16)));break}default:De(l,S("<id NYI>"))}break}case 85:{let ne=new Uint8Array(8),en=F(ne,_[y++]);De(l,ne.subarray(8-en));break}case 37:De(l,S("%",!0));break;default:dn.luaG_runerror(l,S("invalid option '%%%c' to 'lua_pushfstring'"),s[c+1])}m+=2,O=c+2}return mn.luaD_checkstack(l,1),De(l,s.subarray(O)),m>0&&le.luaV_concat(l,m+1),l.stack[l.top-1].svalue()},Fe=function(l,s,..._){return qe(l,s,_)},Ve=function(l,s,_,c){switch(s){case k:return _+c|0;case $:return _-c|0;case w:return le.luaV_imul(_,c);case H:return le.luaV_mod(l,_,c);case L:return le.luaV_div(l,_,c);case v:return _&c;case R:return _|c;case C:return _^c;case Q:return le.luaV_shiftl(_,c);case ce:return le.luaV_shiftl(_,-c);case ve:return 0-_|0;case P:return-1^_;default:me(0)}},vn=function(l,s,_,c){switch(s){case k:return _+c;case $:return _-c;case w:return _*c;case j:return _/c;case B:return Math.pow(_,c);case L:return Math.floor(_/c);case ve:return-_;case H:return N(l,_,c);default:me(0)}};a.exports.CClosure=Zn,a.exports.LClosure=Mn,a.exports.LUA_TDEADKEY=be,a.exports.LUA_TPROTO=G,a.exports.LocVar=class{constructor(){this.varname=null,this.startpc=NaN,this.endpc=NaN}},a.exports.TValue=Pe,a.exports.Udata=ot,a.exports.UTF8BUFFSZ=8,a.exports.luaO_arith=function(l,s,_,c,m){let O=typeof m=="number"?l.stack[m]:m;switch(s){case v:case R:case C:case Q:case ce:case P:{let y,ne;if((y=le.tointeger(_))!==!1&&(ne=le.tointeger(c))!==!1)return void O.setivalue(Ve(l,s,y,ne));break}case j:case B:{let y,ne;if((y=le.tonumber(_))!==!1&&(ne=le.tonumber(c))!==!1)return void O.setfltvalue(vn(l,s,y,ne));break}default:{let y,ne;if(_.ttisinteger()&&c.ttisinteger())return void O.setivalue(Ve(l,s,_.value,c.value));if((y=le.tonumber(_))!==!1&&(ne=le.tonumber(c))!==!1)return void O.setfltvalue(vn(l,s,y,ne));break}}me(l!==null),He.luaT_trybinTM(l,_,c,m,s-k+He.TMS.TM_ADD)},a.exports.luaO_chunkid=function(l,s){let _,c=l.length;if(l[0]===61)c<s?(_=new Uint8Array(c-1)).set(l.subarray(1)):(_=new Uint8Array(s)).set(l.subarray(1,s+1));else if(l[0]===64)c<=s?(_=new Uint8Array(c-1)).set(l.subarray(1)):((_=new Uint8Array(s)).set(o),s-=o.length,_.set(l.subarray(c-s),o.length));else{_=new Uint8Array(s);let m=Ce(l,10);_.set(de);let O=de.length;c<(s-=de.length+o.length+h.length)&&m===-1?(_.set(l,O),O+=l.length):(m!==-1&&(c=m),c>s&&(c=s),_.set(l.subarray(0,c),O),O+=c,_.set(o,O),O+=o.length),_.set(h,O),O+=h.length,_=_.subarray(0,O)}return _},a.exports.luaO_hexavalue=q,a.exports.luaO_int2fb=function(l){let s=0;if(l<8)return l;for(;l>=128;)l=l+15>>4,s+=4;for(;l>=16;)l=l+1>>1,s++;return s+1<<3|l-8},a.exports.luaO_pushfstring=Fe,a.exports.luaO_pushvfstring=qe,a.exports.luaO_str2num=function(l,s){let _=(function(c){let m,O=0,y=0,ne=!0;for(;pn(c[O]);)O++;if(((m=c[O]===45)||c[O]===43)&&O++,c[O]!==48||c[O+1]!==120&&c[O+1]!==88)for(;O<c.length&&xe(c[O]);O++){let en=c[O]-48;if(y>=te&&(y>te||en>Ee+m))return null;y=10*y+en|0,ne=!1}else for(O+=2;O<c.length&&Ze(c[O]);O++)y=16*y+q(c[O])|0,ne=!1;for(;O<c.length&&pn(c[O]);)O++;return ne||O!==c.length&&c[O]!==0?null:{n:0|(m?-y:y),i:O}})(l);return _!==null?(s.setivalue(_.n),_.i+1):(_=(function(c){let m=c.length,O=0;for(let ne=0;ne<m;ne++){let en=c[ne];if(f.indexOf(en)!==-1){O=en;break}}let y=I[O];return y==="n"?null:J(c,y)})(l))!==null?(s.setfltvalue(_.n),_.i+1):0},a.exports.luaO_tostring=Le,a.exports.luaO_utf8esc=F,a.exports.numarith=vn,a.exports.pushobj2s=function(l,s){l.stack[l.top++]=new Pe(s.type,s.value)},a.exports.pushsvalue2s=function(l,s){l.stack[l.top++]=new Pe(re,s)},a.exports.setobjs2s=function(l,s,_){l.stack[s].setfrom(l.stack[_])},a.exports.setobj2s=function(l,s,_){l.stack[s].setfrom(_)},a.exports.setsvalue2s=Nn},function(a,z,d){const{LUAL_BUFFERSIZE:k}=d(3),{LUA_ERRERR:v,LUA_MULTRET:P,LUA_REGISTRYINDEX:R,LUA_SIGNATURE:C,LUA_TBOOLEAN:j,LUA_TLIGHTUSERDATA:L,LUA_TNIL:H,LUA_TNONE:w,LUA_TNUMBER:B,LUA_TSTRING:Q,LUA_TTABLE:ce,LUA_VERSION_NUM:$,lua_Debug:ve,lua_absindex:se,lua_atpanic:$e,lua_call:nn,lua_checkstack:Ke,lua_concat:Xe,lua_copy:ln,lua_createtable:D,lua_error:re,lua_getfield:ke,lua_getinfo:ge,lua_getmetatable:Oe,lua_getstack:tn,lua_gettop:an,lua_insert:sn,lua_isinteger:ae,lua_isnil:oe,lua_isnumber:ze,lua_isstring:M,lua_istable:Ce,lua_len:T,lua_load:g,lua_newstate:S,lua_newtable:xe,lua_next:Ae,lua_pcall:pn,lua_pop:Ze,lua_pushboolean:dn,lua_pushcclosure:mn,lua_pushcfunction:Y,lua_pushfstring:ee,lua_pushinteger:Ie,lua_pushliteral:Te,lua_pushlstring:rn,lua_pushnil:On,lua_pushstring:kn,lua_pushvalue:Je,lua_pushvfstring:le,lua_rawequal:Ue,lua_rawget:N,lua_rawgeti:me,lua_rawlen:He,lua_rawseti:G,lua_remove:be,lua_setfield:Pe,lua_setglobal:Nn,lua_setmetatable:Un,lua_settop:Mn,lua_toboolean:Zn,lua_tointeger:ot,lua_tointegerx:o,lua_tojsstring:de,lua_tolstring:h,lua_tonumber:q,lua_tonumberx:F,lua_topointer:J,lua_tostring:f,lua_touserdata:I,lua_type:te,lua_typename:Ee,lua_version:Le}=d(2),{from_userstring:De,luastring_eq:qe,to_luastring:Fe,to_uristring:Ve}=d(5),vn=v+1,l=Fe("_LOADED"),s=Fe("_PRELOAD"),_=Fe("FILE*"),c=Fe("__name"),m=Fe("__tostring"),O=new Uint8Array(0);class y{constructor(){this.L=null,this.b=O,this.n=0}}const ne=function(A,V,Ne){if(Ne===0||!Ce(A,-1))return 0;for(On(A);Ae(A,-2);){if(te(A,-2)===Q){if(Ue(A,V,-1))return Ze(A,1),1;if(ne(A,V,Ne-1))return be(A,-2),Te(A,"."),sn(A,-2),Xe(A,3),1}Ze(A,1)}return 0},en=function(A,V){let Ne=an(A);if(ge(A,Fe("f"),V),ke(A,R,l),ne(A,Ne+1,2)){let wn=f(A,-1);return wn[0]===95&&wn[1]===71&&wn[2]===46&&(kn(A,wn.subarray(3)),be(A,-2)),ln(A,-1,Ne+1),Ze(A,2),1}return Mn(A,Ne),0},gn=function(A,V){en(A,V)?(ee(A,Fe("function '%s'"),f(A,-1)),be(A,-2)):V.namewhat.length!==0?ee(A,Fe("%s '%s'"),V.namewhat,V.name):V.what&&V.what[0]===109?Te(A,"main chunk"):V.what&&V.what[0]===76?ee(A,Fe("function <%s:%d>"),V.short_src,V.linedefined):Te(A,"?")},Bn=function(A){let V="PANIC: unprotected error in call to Lua API ("+de(A,-1)+")";throw new Error(V)},Kn=function(A,V,Ne){let wn=new ve;return tn(A,0,wn)?(ge(A,Fe("n"),wn),qe(wn.namewhat,Fe("method"))&&--V===0?U(A,Fe("calling '%s' on bad self (%s)"),wn.name,Ne):(wn.name===null&&(wn.name=en(A,wn)?f(A,-1):Fe("?")),U(A,Fe("bad argument #%d to '%s' (%s)"),V,wn.name,Ne))):U(A,Fe("bad argument #%d (%s)"),V,Ne)},pe=function(A,V,Ne){let wn;wn=un(A,V,c)===Q?f(A,-1):te(A,V)===L?Fe("light userdata",!0):Pn(A,V);let Wn=ee(A,Fe("%s expected, got %s"),Ne,wn);return Kn(A,V,Wn)},fn=function(A,V){let Ne=new ve;tn(A,V,Ne)&&(ge(A,Fe("Sl",!0),Ne),Ne.currentline>0)?ee(A,Fe("%s:%d: "),Ne.short_src,Ne.currentline):kn(A,Fe(""))},U=function(A,V,...Ne){return fn(A,1),le(A,V,Ne),Xe(A,2),re(A)},Me=function(A,V,Ne,wn){if(V)return dn(A,1),1;{let Wn,st;return On(A),wn?(Wn=wn.message,st=-wn.errno):(Wn="Success",st=0),Ne?ee(A,Fe("%s: %s"),Ne,Fe(Wn)):kn(A,Fe(Wn)),Ie(A,st),3}},fe=function(A,V){return ke(A,R,V)},yn=function(A,V,Ne){let wn=I(A,V);return wn!==null&&Oe(A,V)?(fe(A,Ne),Ue(A,-1,-2)||(wn=null),Ze(A,2),wn):null},Dn=function(A,V,Ne){pe(A,V,Ee(A,Ne))},Pn=function(A,V){return Ee(A,te(A,V))},In=function(A,V){let Ne=h(A,V);return Ne!=null||Dn(A,V,Q),Ne},$n=In,ht=function(A,V,Ne){return te(A,V)<=0?Ne===null?null:De(Ne):In(A,V)},Fn=ht,Jn=function(A,V){let Ne=F(A,V);return Ne===!1&&Dn(A,V,B),Ne},Vn=function(A,V){let Ne=o(A,V);return Ne===!1&&(function(wn,Wn){ze(wn,Wn)?Kn(wn,Wn,Fe("number has no integer representation",!0)):Dn(wn,Wn,B)})(A,V),Ne},ut=function(A,V){let Ne=A.n+V;if(A.b.length<Ne){let wn=Math.max(2*A.b.length,Ne),Wn=new Uint8Array(wn);Wn.set(A.b),A.b=Wn}return A.b.subarray(A.n,Ne)},it=function(A,V){V.L=A,V.b=O},Ct=function(A,V,Ne){Ne>0&&(V=De(V),ut(A,Ne).set(V.subarray(0,Ne)),bt(A,Ne))},pt=function(A,V){V=De(V),Ct(A,V,V.length)},Dt=function(A){rn(A.L,A.b,A.n),A.n=0,A.b=O},bt=function(A,V){A.n+=V},E=function(A,V,Ne,wn){return te(A,Ne)<=0?wn:V(A,Ne)},ie=function(A,V){let Ne=V.string;return V.string=null,Ne},cn=function(A,V,Ne,wn,Wn){return g(A,ie,{string:V},wn,Wn)},on=function(A,V,Ne,wn){return cn(A,V,0,wn,null)},An=function(A,V){return on(A,V,V.length,V)},un=function(A,V,Ne){if(Oe(A,V)){kn(A,Ne);let wn=N(A,-2);return wn===H?Ze(A,2):be(A,-2),wn}return H},_n=function(A,V,Ne){return V=se(A,V),un(A,V,Ne)!==H&&(Je(A,V),nn(A,1,1),!0)},We=Fe("%I"),xn=Fe("%f"),Sn=function(A,V,Ne){var wn=Ne>>>0,Wn=V.length,st=A.length+1-Wn;e:for(;wn<st;wn++){for(let Et=0;Et<Wn;Et++)if(A[wn+Et]!==V[Et])continue e;return wn}return-1},p=function(A,V,Ne){return ke(A,V,Ne)===ce||(Ze(A,1),V=se(A,V),xe(A),Je(A,-1),Pe(A,V,Ne),!1)},X=function(A,V,Ne){K(A,Ne,Fe("too many upvalues",!0));for(let wn in V){for(let Wn=0;Wn<Ne;Wn++)Je(A,-Ne);mn(A,V[wn],Ne),Pe(A,-(Ne+2),Fe(wn))}Ze(A,Ne)},K=function(A,V,Ne){Ke(A,V)||(Ne?U(A,Fe("stack overflow (%s)"),Ne):U(A,Fe("stack overflow",!0)))},ye=function(A,V,Ne,wn){let Wn=wn.message,st=f(A,Ne).subarray(1);return ee(A,Fe("cannot %s %s: %s"),Fe(V),st,Fe(Wn)),be(A,Ne),vn};let he;const _e=[239,187,191],Ln=function(A){let V=(function(Ne){let wn;Ne.n=0;let Wn=0;do{if((wn=he(Ne))===null||wn!==_e[Wn])return wn;Wn++,Ne.buff[Ne.n++]=wn}while(Wn<_e.length);return Ne.n=0,he(Ne)})(A);if(V===35){do V=he(A);while(V&&V!==10);return{skipped:!0,c:he(A)}}return{skipped:!1,c:V}};let Gn;{class A{constructor(){this.n=NaN,this.f=null,this.buff=new Uint8Array(1024),this.pos=0,this.err=void 0}}const V=function(Ne,wn){let Wn=wn;if(Wn.f!==null&&Wn.n>0){let Et=Wn.n;return Wn.n=0,Wn.f=Wn.f.subarray(Wn.pos),Wn.buff.subarray(0,Et)}let st=Wn.f;return Wn.f=null,st};he=function(Ne){return Ne.pos<Ne.f.length?Ne.f[Ne.pos++]:null},Gn=function(Ne,wn,Wn){let st=new A,Et=an(Ne)+1;if(wn===null)throw new Error("Can't read stdin in the browser");{ee(Ne,Fe("@%s"),wn);let Mt=Ve(wn),mt=new XMLHttpRequest;if(mt.open("GET",Mt,!1),typeof window>"u"&&(mt.responseType="arraybuffer"),mt.send(),!(mt.status>=200&&mt.status<=299))return st.err=mt.status,ye(Ne,"open",Et,{message:`${mt.status}: ${mt.statusText}`});typeof mt.response=="string"?st.f=Fe(mt.response):st.f=new Uint8Array(mt.response)}let tr=Ln(st);tr.c===C[0]&&wn||tr.skipped&&(st.buff[st.n++]=10),tr.c!==null&&(st.buff[st.n++]=tr.c);let Ft=g(Ne,V,st,f(Ne,-1),Wn),Vt=st.err;return Vt?(Mn(Ne,Et),ye(Ne,"read",Et,Vt)):(be(Ne,Et),Ft)}}const zn=function(A,V){return Gn(A,V,null)},jn=function(A,V,Ne){let wn=Le(A);Ne!=72&&U(A,Fe("core and library have incompatible numeric types")),wn!=Le(null)?U(A,Fe("multiple Lua VMs detected")):wn!==V&&U(A,Fe("version mismatch: app. needs %f, Lua core provides %f"),V,wn)};a.exports.LUA_ERRFILE=vn,a.exports.LUA_FILEHANDLE=_,a.exports.LUA_LOADED_TABLE=l,a.exports.LUA_NOREF=-2,a.exports.LUA_PRELOAD_TABLE=s,a.exports.LUA_REFNIL=-1,a.exports.luaL_Buffer=y,a.exports.luaL_addchar=function(A,V){ut(A,1),A.b[A.n++]=V},a.exports.luaL_addlstring=Ct,a.exports.luaL_addsize=bt,a.exports.luaL_addstring=pt,a.exports.luaL_addvalue=function(A){let V=A.L,Ne=f(V,-1);Ct(A,Ne,Ne.length),Ze(V,1)},a.exports.luaL_argcheck=function(A,V,Ne,wn){V||Kn(A,Ne,wn)},a.exports.luaL_argerror=Kn,a.exports.luaL_buffinit=it,a.exports.luaL_buffinitsize=function(A,V,Ne){return it(A,V),ut(V,Ne)},a.exports.luaL_callmeta=_n,a.exports.luaL_checkany=function(A,V){te(A,V)===w&&Kn(A,V,Fe("value expected",!0))},a.exports.luaL_checkinteger=Vn,a.exports.luaL_checklstring=In,a.exports.luaL_checknumber=Jn,a.exports.luaL_checkoption=function(A,V,Ne,wn){let Wn=Ne!==null?Fn(A,V,Ne):$n(A,V);for(let st=0;wn[st];st++)if(qe(wn[st],Wn))return st;return Kn(A,V,ee(A,Fe("invalid option '%s'"),Wn))},a.exports.luaL_checkstack=K,a.exports.luaL_checkstring=$n,a.exports.luaL_checktype=function(A,V,Ne){te(A,V)!==Ne&&Dn(A,V,Ne)},a.exports.luaL_checkudata=function(A,V,Ne){let wn=yn(A,V,Ne);return wn===null&&pe(A,V,Ne),wn},a.exports.luaL_checkversion=function(A){jn(A,$,72)},a.exports.luaL_checkversion_=jn,a.exports.luaL_dofile=function(A,V){return zn(A,V)||pn(A,0,P,0)},a.exports.luaL_dostring=function(A,V){return An(A,V)||pn(A,0,P,0)},a.exports.luaL_error=U,a.exports.luaL_execresult=function(A,V){let Ne,wn;if(V===null)return dn(A,1),Te(A,"exit"),Ie(A,0),3;if(V.status)Ne="exit",wn=V.status;else{if(!V.signal)return Me(A,0,null,V);Ne="signal",wn=V.signal}return On(A),Te(A,Ne),Ie(A,wn),3},a.exports.luaL_fileresult=Me,a.exports.luaL_getmetafield=un,a.exports.luaL_getmetatable=fe,a.exports.luaL_getsubtable=p,a.exports.luaL_gsub=function(A,V,Ne,wn){let Wn,st=new y;for(it(A,st);(Wn=Sn(V,Ne))>=0;)Ct(st,V,Wn),pt(st,wn),V=V.subarray(Wn+Ne.length);return pt(st,V),Dt(st),f(A,-1)},a.exports.luaL_len=function(A,V){T(A,V);let Ne=o(A,-1);return Ne===!1&&U(A,Fe("object length is not an integer",!0)),Ze(A,1),Ne},a.exports.luaL_loadbuffer=on,a.exports.luaL_loadbufferx=cn,a.exports.luaL_loadfile=zn,a.exports.luaL_loadfilex=Gn,a.exports.luaL_loadstring=An,a.exports.luaL_newlib=function(A,V){D(A),X(A,V,0)},a.exports.luaL_newlibtable=function(A){D(A)},a.exports.luaL_newmetatable=function(A,V){return fe(A,V)!==H?0:(Ze(A,1),D(A,0,2),kn(A,V),Pe(A,-2,c),Je(A,-1),Pe(A,R,V),1)},a.exports.luaL_newstate=function(){let A=S();return A&&$e(A,Bn),A},a.exports.luaL_opt=E,a.exports.luaL_optinteger=function(A,V,Ne){return E(A,Vn,V,Ne)},a.exports.luaL_optlstring=ht,a.exports.luaL_optnumber=function(A,V,Ne){return E(A,Jn,V,Ne)},a.exports.luaL_optstring=Fn,a.exports.luaL_prepbuffer=function(A){return ut(A,k)},a.exports.luaL_prepbuffsize=ut,a.exports.luaL_pushresult=Dt,a.exports.luaL_pushresultsize=function(A,V){bt(A,V),Dt(A)},a.exports.luaL_ref=function(A,V){let Ne;return oe(A,-1)?(Ze(A,1),-1):(V=se(A,V),me(A,V,0),Ne=ot(A,-1),Ze(A,1),Ne!==0?(me(A,V,Ne),G(A,V,0)):Ne=He(A,V)+1,G(A,V,Ne),Ne)},a.exports.luaL_requiref=function(A,V,Ne,wn){p(A,R,l),ke(A,-1,V),Zn(A,-1)||(Ze(A,1),Y(A,Ne),kn(A,V),nn(A,1,1),Je(A,-1),Pe(A,-3,V)),be(A,-2),wn&&(Je(A,-1),Nn(A,V))},a.exports.luaL_setfuncs=X,a.exports.luaL_setmetatable=function(A,V){fe(A,V),Un(A,-2)},a.exports.luaL_testudata=yn,a.exports.luaL_tolstring=function(A,V){if(_n(A,V,m))M(A,-1)||U(A,Fe("'__tostring' must return a string"));else switch(te(A,V)){case B:ae(A,V)?ee(A,We,ot(A,V)):ee(A,xn,q(A,V));break;case Q:Je(A,V);break;case j:Te(A,Zn(A,V)?"true":"false");break;case H:Te(A,"nil");break;default:{let Ne=un(A,V,c),wn=Ne===Q?f(A,-1):Pn(A,V);ee(A,Fe("%s: %p"),wn,J(A,V)),Ne!==H&&be(A,-2);break}}return h(A,-1)},a.exports.luaL_traceback=function(A,V,Ne,wn){let Wn=new ve,st=an(A),Et=(function(Ft){let Vt=new ve,Mt=1,mt=1;for(;tn(Ft,mt,Vt);)Mt=mt,mt*=2;for(;Mt<mt;){let Xt=Math.floor((Mt+mt)/2);tn(Ft,Xt,Vt)?Mt=Xt+1:mt=Xt}return mt-1})(V),tr=Et-wn>21?10:-1;for(Ne&&ee(A,Fe(`%s
`),Ne),K(A,10,null),Te(A,"stack traceback:");tn(V,wn++,Wn);)tr--==0?(Te(A,`
	...`),wn=Et-11+1):(ge(V,Fe("Slnt",!0),Wn),ee(A,Fe(`
	%s:`),Wn.short_src),Wn.currentline>0&&Te(A,`${Wn.currentline}:`),Te(A," in "),gn(A,Wn),Wn.istailcall&&Te(A,`
	(...tail calls..)`),Xe(A,an(A)-st));Xe(A,an(A)-st)},a.exports.luaL_typename=Pn,a.exports.luaL_unref=function(A,V,Ne){Ne>=0&&(V=se(A,V),me(A,V,0),G(A,V,Ne),Ie(A,Ne),G(A,V,0))},a.exports.luaL_where=fn,a.exports.lua_writestringerror=function(){for(let A=0;A<arguments.length;A++){let V=arguments[A];do{let Ne=/([^\n]*)\n?([\d\D]*)/.exec(V);console.error(Ne[1]),V=Ne[2]}while(V!=="")}}},function(a,z,d){const{LUA_HOOKCALL:k,LUA_HOOKRET:v,LUA_HOOKTAILCALL:P,LUA_MASKCALL:R,LUA_MASKLINE:C,LUA_MASKRET:j,LUA_MINSTACK:L,LUA_MULTRET:H,LUA_SIGNATURE:w,constant_types:{LUA_TCCL:B,LUA_TLCF:Q,LUA_TLCL:ce,LUA_TNIL:$},thread_status:{LUA_ERRMEM:ve,LUA_ERRERR:se,LUA_ERRRUN:$e,LUA_ERRSYNTAX:nn,LUA_OK:Ke,LUA_YIELD:Xe},lua_Debug:ln,luastring_indexOf:D,to_luastring:re}=d(1),ke=d(18),ge=d(11),Oe=d(13),{api_check:tn,lua_assert:an,LUAI_MAXCCALLS:sn}=d(4),ae=d(6),oe=d(16),ze=d(23),M=d(12),{luaS_newliteral:Ce}=d(10),T=d(14),{LUAI_MAXSTACK:g}=d(3),S=d(36),xe=d(15),{MBuffer:Ae}=d(19),pn=function(h,q){if(h.top<q)for(;h.top<q;)h.stack[h.top++]=new ae.TValue($,null);else for(;h.top>q;)delete h.stack[--h.top]},Ze=function(h,q,F){let J=h.top;for(;h.top<F+1;)h.stack[h.top++]=new ae.TValue($,null);switch(q){case ve:ae.setsvalue2s(h,F,Ce(h,"not enough memory"));break;case se:ae.setsvalue2s(h,F,Ce(h,"error in error handling"));break;default:ae.setobjs2s(h,F,J-1)}for(;h.top>F+1;)delete h.stack[--h.top]},dn=g+200,mn=function(h,q){an(q<=g||q==dn),an(h.stack_last==h.stack.length-M.EXTRA_STACK),h.stack.length=q,h.stack_last=q-M.EXTRA_STACK},Y=function(h,q){let F=h.stack.length;if(F>g)me(h,se);else{let J=h.top+q+M.EXTRA_STACK,f=2*F;f>g&&(f=g),f<J&&(f=J),f>g?(mn(h,dn),ge.luaG_runerror(h,re("stack overflow",!0))):mn(h,f)}},ee=function(h,q){h.stack_last-h.top<=q&&Y(h,q)},Ie=function(h){let q=(function(J){let f=J.top;for(let I=J.ci;I!==null;I=I.previous)f<I.top&&(f=I.top);return an(f<=J.stack_last),f+1})(h),F=q+Math.floor(q/8)+2*M.EXTRA_STACK;F>g&&(F=g),h.stack.length>g&&M.luaE_freeCI(h),q<=g-M.EXTRA_STACK&&F<h.stack.length&&mn(h,F)},Te=function(h,q,F){let J=h.stack[q];switch(J.type){case B:case Q:{let f=J.type===B?J.value.f:J.value;ee(h,L);let I=M.luaE_extendCI(h);I.funcOff=q,I.nresults=F,I.func=J,I.top=h.top+L,an(I.top<=h.stack_last),I.callstatus=0,h.hookmask&R&&kn(h,k,-1);let te=f(h);if(typeof te!="number"||te<0||(0|te)!==te)throw Error("invalid return value from JS function (expected integer)");return ke.api_checknelems(h,te),rn(h,I,h.top-te,te),!0}case ce:{let f,I=J.value.p,te=h.top-q-1,Ee=I.maxstacksize;if(ee(h,Ee),I.is_vararg)f=le(h,I,te);else{for(;te<I.numparams;te++)h.stack[h.top++]=new ae.TValue($,null);f=q+1}let Le=M.luaE_extendCI(h);return Le.funcOff=q,Le.nresults=F,Le.func=J,Le.l_base=f,Le.top=f+Ee,pn(h,Le.top),Le.l_code=I.code,Le.l_savedpc=0,Le.callstatus=M.CIST_LUA,h.hookmask&R&&Je(h,Le),!1}default:return ee(h,1),Ue(h,q,J),Te(h,q,F)}},rn=function(h,q,F,J){let f=q.nresults;h.hookmask&(j|C)&&(h.hookmask&j&&kn(h,v,-1),h.oldpc=q.previous.l_savedpc);let I=q.funcOff;return h.ci=q.previous,h.ci.next=null,On(h,F,I,J,f)},On=function(h,q,F,J,f){switch(f){case 0:break;case 1:J===0?h.stack[F].setnilvalue():ae.setobjs2s(h,F,q);break;case H:for(let te=0;te<J;te++)ae.setobjs2s(h,F+te,q+te);for(let te=h.top;te>=F+J;te--)delete h.stack[te];return h.top=F+J,!1;default:{let te;if(f<=J)for(te=0;te<f;te++)ae.setobjs2s(h,F+te,q+te);else{for(te=0;te<J;te++)ae.setobjs2s(h,F+te,q+te);for(;te<f;te++)F+te>=h.top?h.stack[F+te]=new ae.TValue($,null):h.stack[F+te].setnilvalue()}break}}let I=F+f;for(let te=h.top;te>=I;te--)delete h.stack[te];return h.top=I,!0},kn=function(h,q,F){let J=h.hook;if(J&&h.allowhook){let f=h.ci,I=h.top,te=f.top,Ee=new ln;Ee.event=q,Ee.currentline=F,Ee.i_ci=f,ee(h,L),f.top=h.top+L,an(f.top<=h.stack_last),h.allowhook=0,f.callstatus|=M.CIST_HOOKED,J(h,Ee),an(!h.allowhook),h.allowhook=1,f.top=te,pn(h,I),f.callstatus&=~M.CIST_HOOKED}},Je=function(h,q){let F=k;q.l_savedpc++,q.previous.callstatus&M.CIST_LUA&&q.previous.l_code[q.previous.l_savedpc-1].opcode==oe.OpCodesI.OP_TAILCALL&&(q.callstatus|=M.CIST_TAIL,F=P),kn(h,F,-1),q.l_savedpc--},le=function(h,q,F){let J,f=q.numparams,I=h.top-F,te=h.top;for(J=0;J<f&&J<F;J++)ae.pushobj2s(h,h.stack[I+J]),h.stack[I+J].setnilvalue();for(;J<f;J++)h.stack[h.top++]=new ae.TValue($,null);return te},Ue=function(h,q,F){let J=T.luaT_gettmbyobj(h,F,T.TMS.TM_CALL);J.ttisfunction(J)||ge.luaG_typeerror(h,F,re("call",!0)),ae.pushobj2s(h,h.stack[h.top-1]);for(let f=h.top-2;f>q;f--)ae.setobjs2s(h,f,f-1);ae.setobj2s(h,q,J)},N=function(h,q,F){++h.nCcalls>=sn&&(function(J){J.nCcalls===sn?ge.luaG_runerror(J,re("JS stack overflow",!0)):J.nCcalls>=sn+(sn>>3)&&me(J,se)})(h),Te(h,q,F)||xe.luaV_execute(h),h.nCcalls--},me=function(h,q){if(h.errorJmp)throw h.errorJmp.status=q,h.errorJmp;{let F=h.l_G;if(h.status=q,!F.mainthread.errorJmp){let J=F.panic;throw J&&(Ze(h,q,h.top),h.ci.top<h.top&&(h.ci.top=h.top),J(h)),new Error(`Aborted ${q}`)}F.mainthread.stack[F.mainthread.top++]=h.stack[h.top-1],me(F.mainthread,q)}},He=function(h,q,F){let J=h.nCcalls,f={status:Ke,previous:h.errorJmp};h.errorJmp=f;try{q(h,F)}catch(I){if(f.status===Ke){let te=h.l_G.atnativeerror;if(te)try{if(f.status=Ke,ke.lua_pushcfunction(h,te),ke.lua_pushlightuserdata(h,I),ot(h,h.top-2,1),h.errfunc!==0){let Ee=h.errfunc;ae.pushobj2s(h,h.stack[h.top-1]),ae.setobjs2s(h,h.top-2,Ee),ot(h,h.top-2,1)}f.status=$e}catch{f.status===Ke&&(f.status=-1)}else f.status=-1}}return h.errorJmp=f.previous,h.nCcalls=J,f.status},G=function(h,q){let F=h.ci;an(F.c_k!==null&&h.nny===0),an(F.callstatus&M.CIST_YPCALL||q===Xe),F.callstatus&M.CIST_YPCALL&&(F.callstatus&=~M.CIST_YPCALL,h.errfunc=F.c_old_errfunc),F.nresults===H&&h.ci.top<h.top&&(h.ci.top=h.top);let J=(0,F.c_k)(h,q,F.c_ctx);ke.api_checknelems(h,J),rn(h,F,h.top-J,J)},be=function(h,q){for(q!==null&&G(h,q);h.ci!==h.base_ci;)h.ci.callstatus&M.CIST_LUA?(xe.luaV_finishOp(h),xe.luaV_execute(h)):G(h,Xe)},Pe=function(h,q){let F=(function(f){for(let I=f.ci;I!==null;I=I.previous)if(I.callstatus&M.CIST_YPCALL)return I;return null})(h);if(F===null)return 0;let J=F.extra;return Oe.luaF_close(h,J),Ze(h,q,J),h.ci=F,h.allowhook=F.callstatus&M.CIST_OAH,h.nny=0,Ie(h),h.errfunc=F.c_old_errfunc,1},Nn=function(h,q,F){let J=Ce(h,q);if(F===0)ae.pushsvalue2s(h,J),tn(h,h.top<=h.ci.top,"stack overflow");else{for(let f=1;f<F;f++)delete h.stack[--h.top];ae.setsvalue2s(h,h.top-1,J)}return $e},Un=function(h,q){let F=h.top-q,J=h.ci;h.status===Ke?Te(h,F-1,H)||xe.luaV_execute(h):(an(h.status===Xe),h.status=Ke,J.funcOff=J.extra,J.func=h.stack[J.funcOff],J.callstatus&M.CIST_LUA?xe.luaV_execute(h):(J.c_k!==null&&(q=J.c_k(h,Xe,J.c_ctx),ke.api_checknelems(h,q),F=h.top-q),rn(h,J,F,q)),be(h,null))},Mn=function(h,q,F,J){let f=h.ci;return ke.api_checknelems(h,q),h.nny>0&&(h!==h.l_G.mainthread?ge.luaG_runerror(h,re("attempt to yield across a JS-call boundary",!0)):ge.luaG_runerror(h,re("attempt to yield from outside a coroutine",!0))),h.status=Xe,f.extra=f.funcOff,f.callstatus&M.CIST_LUA?tn(h,J===null,"hooks cannot continue after yielding"):(f.c_k=J,J!==null&&(f.c_ctx=F),f.funcOff=h.top-q-1,f.func=h.stack[f.funcOff],me(h,Xe)),an(f.callstatus&M.CIST_HOOKED),0},Zn=function(h,q,F,J,f){let I=h.ci,te=h.allowhook,Ee=h.nny,Le=h.errfunc;h.errfunc=f;let De=He(h,q,F);return De!==Ke&&(Oe.luaF_close(h,J),Ze(h,De,J),h.ci=I,h.allowhook=te,h.nny=Ee,Ie(h)),h.errfunc=Le,De},ot=function(h,q,F){h.nny++,N(h,q,F),h.nny--},o=function(h,q,F){q&&D(q,F[0])===-1&&(ae.luaO_pushfstring(h,re("attempt to load a %s chunk (mode is '%s')"),F,q),me(h,nn))},de=function(h,q){let F,J=q.z.zgetc();J===w[0]?(o(h,q.mode,re("binary",!0)),F=S.luaU_undump(h,q.z,q.name)):(o(h,q.mode,re("text",!0)),F=ze.luaY_parser(h,q.z,q.buff,q.dyd,q.name,J)),an(F.nupvalues===F.p.upvalues.length),Oe.luaF_initupvals(h,F)};a.exports.adjust_top=pn,a.exports.luaD_call=N,a.exports.luaD_callnoyield=ot,a.exports.luaD_checkstack=ee,a.exports.luaD_growstack=Y,a.exports.luaD_hook=kn,a.exports.luaD_inctop=function(h){ee(h,1),h.stack[h.top++]=new ae.TValue($,null)},a.exports.luaD_pcall=Zn,a.exports.luaD_poscall=rn,a.exports.luaD_precall=Te,a.exports.luaD_protectedparser=function(h,q,F,J){let f=new class{constructor(te,Ee,Le){this.z=te,this.buff=new Ae,this.dyd=new ze.Dyndata,this.mode=Le,this.name=Ee}}(q,F,J);h.nny++;let I=Zn(h,de,f,h.top,h.errfunc);return h.nny--,I},a.exports.luaD_rawrunprotected=He,a.exports.luaD_reallocstack=mn,a.exports.luaD_throw=me,a.exports.lua_isyieldable=function(h){return h.nny===0},a.exports.lua_resume=function(h,q,F){let J=h.nny;if(h.status===Ke){if(h.ci!==h.base_ci)return Nn(h,"cannot resume non-suspended coroutine",F)}else if(h.status!==Xe)return Nn(h,"cannot resume dead coroutine",F);if(h.nCcalls=q?q.nCcalls+1:1,h.nCcalls>=sn)return Nn(h,"JS stack overflow",F);h.nny=0,ke.api_checknelems(h,h.status===Ke?F+1:F);let f=He(h,Un,F);if(f===-1)f=$e;else{for(;f>Xe&&Pe(h,f);)f=He(h,be,f);f>Xe?(h.status=f,Ze(h,f,h.top),h.ci.top=h.top):an(f===h.status)}return h.nny=J,h.nCcalls--,an(h.nCcalls===(q?q.nCcalls:0)),f},a.exports.lua_yield=function(h,q){Mn(h,q,0,null)},a.exports.lua_yieldk=Mn},function(a,z,d){const{constant_types:{LUA_TBOOLEAN:k,LUA_TCCL:v,LUA_TLCF:P,LUA_TLCL:R,LUA_TLIGHTUSERDATA:C,LUA_TLNGSTR:j,LUA_TNIL:L,LUA_TNUMFLT:H,LUA_TNUMINT:w,LUA_TSHRSTR:B,LUA_TTABLE:Q,LUA_TTHREAD:ce,LUA_TUSERDATA:$},to_luastring:ve}=d(1),{lua_assert:se}=d(4),$e=d(11),nn=d(6),{luaS_hashlongstr:Ke,TString:Xe}=d(10),ln=d(12);let D=new WeakMap;const re=function(ae){let oe=D.get(ae);return oe||(oe={},D.set(ae,oe)),oe},ke=function(ae,oe){switch(oe.type){case L:return $e.luaG_runerror(ae,ve("table index is nil",!0));case H:if(isNaN(oe.value))return $e.luaG_runerror(ae,ve("table index is NaN",!0));case w:case k:case Q:case R:case P:case v:case $:case ce:return oe.value;case B:case j:return Ke(oe.tsvalue());case C:{let ze=oe.value;switch(typeof ze){case"string":return"*"+ze;case"number":return"#"+ze;case"boolean":return ze?"?true":"?false";case"function":return re(ze);case"object":if(ze instanceof ln.lua_State&&ze.l_G===ae.l_G||ze instanceof ge||ze instanceof nn.Udata||ze instanceof nn.LClosure||ze instanceof nn.CClosure)return re(ze);default:return ze}}default:throw new Error("unknown key type: "+oe.type)}};class ge{constructor(oe){this.id=oe.l_G.id_counter++,this.strong=new Map,this.dead_strong=new Map,this.dead_weak=void 0,this.f=void 0,this.l=void 0,this.metatable=null,this.flags=-1}}const Oe=function(ae,oe,ze,M){ae.dead_strong.clear(),ae.dead_weak=void 0;let Ce=null,T={key:ze,value:M,p:Ce=ae.l,n:void 0};ae.f||(ae.f=T),Ce&&(Ce.n=T),ae.strong.set(oe,T),ae.l=T},tn=function(ae,oe){let ze=ae.strong.get(oe);if(ze){ze.key.setdeadvalue(),ze.value=void 0;let M=ze.n,Ce=ze.p;ze.p=void 0,Ce&&(Ce.n=M),M&&(M.p=Ce),ae.f===ze&&(ae.f=M),ae.l===ze&&(ae.l=Ce),ae.strong.delete(oe),(function(T){return typeof T=="object"?T!==null:typeof T=="function"})(oe)?(ae.dead_weak||(ae.dead_weak=new WeakMap),ae.dead_weak.set(oe,ze)):ae.dead_strong.set(oe,ze)}},an=function(ae,oe){let ze=ae.strong.get(oe);return ze?ze.value:nn.luaO_nilobject},sn=function(ae,oe){return se(typeof oe=="number"&&(0|oe)===oe),an(ae,oe)};a.exports.invalidateTMcache=function(ae){ae.flags=0},a.exports.luaH_get=function(ae,oe,ze){return se(ze instanceof nn.TValue),ze.ttisnil()||ze.ttisfloat()&&isNaN(ze.value)?nn.luaO_nilobject:an(oe,ke(ae,ze))},a.exports.luaH_getint=sn,a.exports.luaH_getn=function(ae){let oe=0,ze=ae.strong.size+1;for(;ze-oe>1;){let M=Math.floor((oe+ze)/2);sn(ae,M).ttisnil()?ze=M:oe=M}return oe},a.exports.luaH_getstr=function(ae,oe){return se(oe instanceof Xe),an(ae,Ke(oe))},a.exports.luaH_setfrom=function(ae,oe,ze,M){se(ze instanceof nn.TValue);let Ce=ke(ae,ze);if(M.ttisnil())return void tn(oe,Ce);let T=oe.strong.get(Ce);if(T)T.value.setfrom(M);else{let g,S=ze.value;g=ze.ttisfloat()&&(0|S)===S?new nn.TValue(w,S):new nn.TValue(ze.type,S);let xe=new nn.TValue(M.type,M.value);Oe(oe,Ce,g,xe)}},a.exports.luaH_setint=function(ae,oe,ze){se(typeof oe=="number"&&(0|oe)===oe&&ze instanceof nn.TValue);let M=oe;if(ze.ttisnil())return void tn(ae,M);let Ce=ae.strong.get(M);if(Ce)Ce.value.setfrom(ze);else{let T=new nn.TValue(w,oe),g=new nn.TValue(ze.type,ze.value);Oe(ae,M,T,g)}},a.exports.luaH_new=function(ae){return new ge(ae)},a.exports.luaH_next=function(ae,oe,ze){let M,Ce=ae.stack[ze];if(Ce.type===L){if(!(M=oe.f))return!1}else{let T=ke(ae,Ce);if(M=oe.strong.get(T)){if(!(M=M.n))return!1}else{if(!(M=oe.dead_weak&&oe.dead_weak.get(T)||oe.dead_strong.get(T)))return $e.luaG_runerror(ae,ve("invalid key to 'next'"));do if(!(M=M.n))return!1;while(M.key.ttisdeadkey())}}return nn.setobj2s(ae,ze,M.key),nn.setobj2s(ae,ze+1,M.value),!0},a.exports.Table=ge},function(a,z,d){const{is_luastring:k,luastring_eq:v,luastring_from:P,to_luastring:R}=d(1),{lua_assert:C}=d(4);class j{constructor(B,Q){this.hash=null,this.realstring=Q}getstr(){return this.realstring}tsslen(){return this.realstring.length}}const L=function(w){C(k(w));let B=w.length,Q="|";for(let ce=0;ce<B;ce++)Q+=w[ce].toString(16);return Q},H=function(w,B){return C(B instanceof Uint8Array),new j(w,B)};a.exports.luaS_eqlngstr=function(w,B){return C(w instanceof j),C(B instanceof j),w==B||v(w.realstring,B.realstring)},a.exports.luaS_hash=L,a.exports.luaS_hashlongstr=function(w){return C(w instanceof j),w.hash===null&&(w.hash=L(w.getstr())),w.hash},a.exports.luaS_bless=H,a.exports.luaS_new=function(w,B){return H(w,P(B))},a.exports.luaS_newliteral=function(w,B){return H(w,R(B))},a.exports.TString=j},function(a,z,d){const{LUA_HOOKCOUNT:k,LUA_HOOKLINE:v,LUA_MASKCOUNT:P,LUA_MASKLINE:R,constant_types:{LUA_TBOOLEAN:C,LUA_TNIL:j,LUA_TTABLE:L},thread_status:{LUA_ERRRUN:H,LUA_YIELD:w},from_userstring:B,luastring_eq:Q,luastring_indexOf:ce,to_luastring:$}=d(1),{api_check:ve,lua_assert:se}=d(4),{LUA_IDSIZE:$e}=d(3),nn=d(18),Ke=d(8),Xe=d(13),ln=d(20),D=d(6),re=d(16),ke=d(12),ge=d(9),Oe=d(14),tn=d(15),an=function(Y){return se(Y.callstatus&ke.CIST_LUA),Y.l_savedpc-1},sn=function(Y){return Y.func.value.p.lineinfo.length!==0?Y.func.value.p.lineinfo[an(Y)]:-1},ae=function(Y){if(Y.status===w){let ee=Y.ci,Ie=ee.funcOff;ee.func=Y.stack[ee.extra],ee.funcOff=ee.extra,ee.extra=Ie}},oe=function(Y,ee){se(ee<Y.upvalues.length);let Ie=Y.upvalues[ee].name;return Ie===null?$("?",!0):Ie.getstr()},ze=function(Y,ee,Ie){let Te,rn=null;if(ee.callstatus&ke.CIST_LUA){if(Ie<0)return(function(On,kn){let Je=On.func.value.p.numparams;return kn>=On.l_base-On.funcOff-Je?null:{pos:On.funcOff+Je+kn,name:$("(*vararg)",!0)}})(ee,-Ie);Te=ee.l_base,rn=Xe.luaF_getlocalname(ee.func.value.p,Ie,an(ee))}else Te=ee.funcOff+1;if(rn===null){if(!((ee===Y.ci?Y.top:ee.next.funcOff)-Te>=Ie&&Ie>0))return null;rn=$("(*temporary)",!0)}return{pos:Te+(Ie-1),name:rn}},M=function(Y,ee){if(ee===null||ee instanceof D.CClosure)Y.source=$("=[JS]",!0),Y.linedefined=-1,Y.lastlinedefined=-1,Y.what=$("J",!0);else{let Ie=ee.p;Y.source=Ie.source?Ie.source.getstr():$("=?",!0),Y.linedefined=Ie.linedefined,Y.lastlinedefined=Ie.lastlinedefined,Y.what=Y.linedefined===0?$("main",!0):$("Lua",!0)}Y.short_src=D.luaO_chunkid(Y.source,$e)},Ce=function(Y,ee){let Ie={name:null,funcname:null};return ee===null?null:ee.callstatus&ke.CIST_FIN?(Ie.name=$("__gc",!0),Ie.funcname=$("metamethod",!0),Ie):!(ee.callstatus&ke.CIST_TAIL)&&ee.previous.callstatus&ke.CIST_LUA?xe(Y,ee.previous):null},T=function(Y,ee,Ie){let Te={name:null,funcname:null};if(re.ISK(Ie)){let rn=Y.k[re.INDEXK(Ie)];if(rn.ttisstring())return Te.name=rn.svalue(),Te}else{let rn=S(Y,ee,Ie);if(rn&&rn.funcname[0]===99)return rn}return Te.name=$("?",!0),Te},g=function(Y,ee){return Y<ee?-1:Y},S=function(Y,ee,Ie){let Te={name:Xe.luaF_getlocalname(Y,Ie+1,ee),funcname:null};if(Te.name)return Te.funcname=$("local",!0),Te;let rn=(function(kn,Je,le){let Ue=-1,N=0,me=re.OpCodesI;for(let He=0;He<Je;He++){let G=kn.code[He],be=G.A;switch(G.opcode){case me.OP_LOADNIL:{let Pe=G.B;be<=le&&le<=be+Pe&&(Ue=g(He,N));break}case me.OP_TFORCALL:le>=be+2&&(Ue=g(He,N));break;case me.OP_CALL:case me.OP_TAILCALL:le>=be&&(Ue=g(He,N));break;case me.OP_JMP:{let Pe=He+1+G.sBx;He<Pe&&Pe<=Je&&Pe>N&&(N=Pe);break}default:re.testAMode(G.opcode)&&le===be&&(Ue=g(He,N))}}return Ue})(Y,ee,Ie),On=re.OpCodesI;if(rn!==-1){let kn=Y.code[rn];switch(kn.opcode){case On.OP_MOVE:{let Je=kn.B;if(Je<kn.A)return S(Y,rn,Je);break}case On.OP_GETTABUP:case On.OP_GETTABLE:{let Je=kn.C,le=kn.B,Ue=kn.opcode===On.OP_GETTABLE?Xe.luaF_getlocalname(Y,le+1,rn):oe(Y,le);return Te.name=T(Y,rn,Je).name,Te.funcname=Ue&&Q(Ue,ln.LUA_ENV)?$("global",!0):$("field",!0),Te}case On.OP_GETUPVAL:return Te.name=oe(Y,kn.B),Te.funcname=$("upvalue",!0),Te;case On.OP_LOADK:case On.OP_LOADKX:{let Je=kn.opcode===On.OP_LOADK?kn.Bx:Y.code[rn+1].Ax;if(Y.k[Je].ttisstring())return Te.name=Y.k[Je].svalue(),Te.funcname=$("constant",!0),Te;break}case On.OP_SELF:{let Je=kn.C;return Te.name=T(Y,rn,Je).name,Te.funcname=$("method",!0),Te}}}return null},xe=function(Y,ee){let Ie={name:null,funcname:null},Te=0,rn=ee.func.value.p,On=an(ee),kn=rn.code[On],Je=re.OpCodesI;if(ee.callstatus&ke.CIST_HOOKED)return Ie.name=$("?",!0),Ie.funcname=$("hook",!0),Ie;switch(kn.opcode){case Je.OP_CALL:case Je.OP_TAILCALL:return S(rn,On,kn.A);case Je.OP_TFORCALL:return Ie.name=$("for iterator",!0),Ie.funcname=$("for iterator",!0),Ie;case Je.OP_SELF:case Je.OP_GETTABUP:case Je.OP_GETTABLE:Te=Oe.TMS.TM_INDEX;break;case Je.OP_SETTABUP:case Je.OP_SETTABLE:Te=Oe.TMS.TM_NEWINDEX;break;case Je.OP_ADD:Te=Oe.TMS.TM_ADD;break;case Je.OP_SUB:Te=Oe.TMS.TM_SUB;break;case Je.OP_MUL:Te=Oe.TMS.TM_MUL;break;case Je.OP_MOD:Te=Oe.TMS.TM_MOD;break;case Je.OP_POW:Te=Oe.TMS.TM_POW;break;case Je.OP_DIV:Te=Oe.TMS.TM_DIV;break;case Je.OP_IDIV:Te=Oe.TMS.TM_IDIV;break;case Je.OP_BAND:Te=Oe.TMS.TM_BAND;break;case Je.OP_BOR:Te=Oe.TMS.TM_BOR;break;case Je.OP_BXOR:Te=Oe.TMS.TM_BXOR;break;case Je.OP_SHL:Te=Oe.TMS.TM_SHL;break;case Je.OP_SHR:Te=Oe.TMS.TM_SHR;break;case Je.OP_UNM:Te=Oe.TMS.TM_UNM;break;case Je.OP_BNOT:Te=Oe.TMS.TM_BNOT;break;case Je.OP_LEN:Te=Oe.TMS.TM_LEN;break;case Je.OP_CONCAT:Te=Oe.TMS.TM_CONCAT;break;case Je.OP_EQ:Te=Oe.TMS.TM_EQ;break;case Je.OP_LT:Te=Oe.TMS.TM_LT;break;case Je.OP_LE:Te=Oe.TMS.TM_LE;break;default:return null}return Ie.name=Y.l_G.tmname[Te].getstr(),Ie.funcname=$("metamethod",!0),Ie},Ae=function(Y,ee){let Ie=Y.ci,Te=null;if(Ie.callstatus&ke.CIST_LUA){Te=(function(On,kn,Je){let le=kn.func.value;for(let Ue=0;Ue<le.nupvalues;Ue++)if(le.upvals[Ue]===Je)return{name:oe(le.p,Ue),funcname:$("upvalue",!0)};return null})(0,Ie,ee);let rn=(function(On,kn,Je){for(let le=kn.l_base;le<kn.top;le++)if(On.stack[le]===Je)return le;return!1})(Y,Ie,ee);!Te&&rn&&(Te=S(Ie.func.value.p,an(Ie),rn-Ie.l_base))}return Te?D.luaO_pushfstring(Y,$(" (%s '%s')",!0),Te.funcname,Te.name):$("",!0)},pn=function(Y,ee,Ie){let Te=Oe.luaT_objtypename(Y,ee);dn(Y,$("attempt to %s a %s value%s",!0),Ie,Te,Ae(Y,ee))},Ze=function(Y,ee,Ie,Te){let rn;return rn=Ie?D.luaO_chunkid(Ie.getstr(),$e):$("?",!0),D.luaO_pushfstring(Y,$("%s:%d: %s",!0),rn,Te,ee)},dn=function(Y,ee,...Ie){let Te=Y.ci,rn=D.luaO_pushvfstring(Y,ee,Ie);Te.callstatus&ke.CIST_LUA&&Ze(Y,rn,Te.func.value.p.source,sn(Te)),mn(Y)},mn=function(Y){if(Y.errfunc!==0){let ee=Y.errfunc;D.pushobj2s(Y,Y.stack[Y.top-1]),D.setobjs2s(Y,Y.top-2,ee),Ke.luaD_callnoyield(Y,Y.top-2,1)}Ke.luaD_throw(Y,H)};a.exports.luaG_addinfo=Ze,a.exports.luaG_concaterror=function(Y,ee,Ie){(ee.ttisstring()||tn.cvt2str(ee))&&(ee=Ie),pn(Y,ee,$("concatenate",!0))},a.exports.luaG_errormsg=mn,a.exports.luaG_opinterror=function(Y,ee,Ie,Te){tn.tonumber(ee)===!1&&(Ie=ee),pn(Y,Ie,Te)},a.exports.luaG_ordererror=function(Y,ee,Ie){let Te=Oe.luaT_objtypename(Y,ee),rn=Oe.luaT_objtypename(Y,Ie);Q(Te,rn)?dn(Y,$("attempt to compare two %s values",!0),Te):dn(Y,$("attempt to compare %s with %s",!0),Te,rn)},a.exports.luaG_runerror=dn,a.exports.luaG_tointerror=function(Y,ee,Ie){tn.tointeger(ee)===!1&&(Ie=ee),dn(Y,$("number%s has no integer representation",!0),Ae(Y,Ie))},a.exports.luaG_traceexec=function(Y){let ee=Y.ci,Ie=Y.hookmask,Te=--Y.hookcount==0&&Ie&P;if(Te)Y.hookcount=Y.basehookcount;else if(!(Ie&R))return;if(ee.callstatus&ke.CIST_HOOKYIELD)ee.callstatus&=~ke.CIST_HOOKYIELD;else{if(Te&&Ke.luaD_hook(Y,k,-1),Ie&R){let rn=ee.func.value.p,On=ee.l_savedpc-1,kn=rn.lineinfo.length!==0?rn.lineinfo[On]:-1;(On===0||ee.l_savedpc<=Y.oldpc||kn!==(rn.lineinfo.length!==0?rn.lineinfo[Y.oldpc-1]:-1))&&Ke.luaD_hook(Y,v,kn)}Y.oldpc=ee.l_savedpc,Y.status===w&&(Te&&(Y.hookcount=1),ee.l_savedpc--,ee.callstatus|=ke.CIST_HOOKYIELD,ee.funcOff=Y.top-1,ee.func=Y.stack[ee.funcOff],Ke.luaD_throw(Y,w))}},a.exports.luaG_typeerror=pn,a.exports.lua_gethook=function(Y){return Y.hook},a.exports.lua_gethookcount=function(Y){return Y.basehookcount},a.exports.lua_gethookmask=function(Y){return Y.hookmask},a.exports.lua_getinfo=function(Y,ee,Ie){let Te,rn,On,kn;return ee=B(ee),ae(Y),ee[0]===62?(On=null,kn=Y.stack[Y.top-1],ve(Y,kn.ttisfunction(),"function expected"),ee=ee.subarray(1),Y.top--):(kn=(On=Ie.i_ci).func,se(On.func.ttisfunction())),Te=(function(Je,le,Ue,N,me){let He=1;for(;le.length>0;le=le.subarray(1))switch(le[0]){case 83:M(Ue,N);break;case 108:Ue.currentline=me&&me.callstatus&ke.CIST_LUA?sn(me):-1;break;case 117:Ue.nups=N===null?0:N.nupvalues,N===null||N instanceof D.CClosure?(Ue.isvararg=!0,Ue.nparams=0):(Ue.isvararg=N.p.is_vararg,Ue.nparams=N.p.numparams);break;case 116:Ue.istailcall=me?me.callstatus&ke.CIST_TAIL:0;break;case 110:{let G=Ce(Je,me);G===null?(Ue.namewhat=$("",!0),Ue.name=null):(Ue.namewhat=G.funcname,Ue.name=G.name);break}case 76:case 102:break;default:He=0}return He})(Y,ee,Ie,rn=kn.ttisclosure()?kn.value:null,On),ce(ee,102)>=0&&(D.pushobj2s(Y,kn),ve(Y,Y.top<=Y.ci.top,"stack overflow")),ae(Y),ce(ee,76)>=0&&(function(Je,le){if(le===null||le instanceof D.CClosure)Je.stack[Je.top]=new D.TValue(j,null),nn.api_incr_top(Je);else{let Ue=le.p.lineinfo,N=ge.luaH_new(Je);Je.stack[Je.top]=new D.TValue(L,N),nn.api_incr_top(Je);let me=new D.TValue(C,!0);for(let He=0;He<Ue.length;He++)ge.luaH_setint(N,Ue[He],me)}})(Y,rn),Te},a.exports.lua_getlocal=function(Y,ee,Ie){let Te;if(ae(Y),ee===null)Te=Y.stack[Y.top-1].ttisLclosure()?Xe.luaF_getlocalname(Y.stack[Y.top-1].value.p,Ie,0):null;else{let rn=ze(Y,ee.i_ci,Ie);rn?(Te=rn.name,D.pushobj2s(Y,Y.stack[rn.pos]),ve(Y,Y.top<=Y.ci.top,"stack overflow")):Te=null}return ae(Y),Te},a.exports.lua_getstack=function(Y,ee,Ie){let Te,rn;if(ee<0)return 0;for(Te=Y.ci;ee>0&&Te!==Y.base_ci;Te=Te.previous)ee--;return ee===0&&Te!==Y.base_ci?(rn=1,Ie.i_ci=Te):rn=0,rn},a.exports.lua_sethook=function(Y,ee,Ie,Te){ee!==null&&Ie!==0||(Ie=0,ee=null),Y.ci.callstatus&ke.CIST_LUA&&(Y.oldpc=Y.ci.l_savedpc),Y.hook=ee,Y.basehookcount=Te,Y.hookcount=Y.basehookcount,Y.hookmask=Ie},a.exports.lua_setlocal=function(Y,ee,Ie){let Te;ae(Y);let rn=ze(Y,ee.i_ci,Ie);return rn?(Te=rn.name,D.setobjs2s(Y,rn.pos,Y.top-1),delete Y.stack[--Y.top]):Te=null,ae(Y),Te}},function(a,z,d){const{LUA_MINSTACK:k,LUA_RIDX_GLOBALS:v,LUA_RIDX_MAINTHREAD:P,constant_types:{LUA_NUMTAGS:R,LUA_TNIL:C,LUA_TTABLE:j,LUA_TTHREAD:L},thread_status:{LUA_OK:H}}=d(1),w=d(6),B=d(8),Q=d(18),ce=d(9),$=d(14),ve=2*k;class se{constructor(){this.func=null,this.funcOff=NaN,this.top=NaN,this.previous=null,this.next=null,this.l_base=NaN,this.l_code=null,this.l_savedpc=NaN,this.c_k=null,this.c_old_errfunc=null,this.c_ctx=null,this.nresults=NaN,this.callstatus=NaN}}class $e{constructor(re){this.id=re.id_counter++,this.base_ci=new se,this.top=NaN,this.stack_last=NaN,this.oldpc=NaN,this.l_G=re,this.stack=null,this.ci=null,this.errorJmp=null,this.nCcalls=0,this.hook=null,this.hookmask=0,this.basehookcount=0,this.allowhook=1,this.hookcount=this.basehookcount,this.nny=1,this.status=H,this.errfunc=0}}const nn=function(D){D.ci.next=null},Ke=function(D,re){D.stack=new Array(ve),D.top=0,D.stack_last=ve-5;let ke=D.base_ci;ke.next=ke.previous=null,ke.callstatus=0,ke.funcOff=D.top,ke.func=D.stack[D.top],D.stack[D.top++]=new w.TValue(C,null),ke.top=D.top+k,D.ci=ke},Xe=function(D){D.ci=D.base_ci,nn(D),D.stack=null},ln=function(D){let re=D.l_G;Ke(D),(function(ke,ge){let Oe=ce.luaH_new(ke);ge.l_registry.sethvalue(Oe),ce.luaH_setint(Oe,P,new w.TValue(L,ke)),ce.luaH_setint(Oe,v,new w.TValue(j,ce.luaH_new(ke)))})(D,re),$.luaT_init(D),re.version=Q.lua_version(null)};a.exports.lua_State=$e,a.exports.CallInfo=se,a.exports.CIST_OAH=1,a.exports.CIST_LUA=2,a.exports.CIST_HOOKED=4,a.exports.CIST_FRESH=8,a.exports.CIST_YPCALL=16,a.exports.CIST_TAIL=32,a.exports.CIST_HOOKYIELD=64,a.exports.CIST_LEQ=128,a.exports.CIST_FIN=256,a.exports.EXTRA_STACK=5,a.exports.lua_close=function(D){(function(re){Xe(re)})(D=D.l_G.mainthread)},a.exports.lua_newstate=function(){let D=new class{constructor(){this.id_counter=1,this.ids=new WeakMap,this.mainthread=null,this.l_registry=new w.TValue(C,null),this.panic=null,this.atnativeerror=null,this.version=null,this.tmname=new Array($.TMS.TM_N),this.mt=new Array(R)}},re=new $e(D);return D.mainthread=re,B.luaD_rawrunprotected(re,ln,null)!==H&&(re=null),re},a.exports.lua_newthread=function(D){let re=D.l_G,ke=new $e(re);return D.stack[D.top]=new w.TValue(L,ke),Q.api_incr_top(D),ke.hookmask=D.hookmask,ke.basehookcount=D.basehookcount,ke.hook=D.hook,ke.hookcount=ke.basehookcount,Ke(ke),ke},a.exports.luaE_extendCI=function(D){let re=new se;return D.ci.next=re,re.previous=D.ci,re.next=null,D.ci=re,re},a.exports.luaE_freeCI=nn,a.exports.luaE_freethread=function(D,re){Xe(re)}},function(a,z,d){const{constant_types:{LUA_TNIL:k}}=d(1),v=d(6);a.exports.MAXUPVAL=255,a.exports.Proto=class{constructor(P){this.id=P.l_G.id_counter++,this.k=[],this.p=[],this.code=[],this.cache=null,this.lineinfo=[],this.upvalues=[],this.numparams=0,this.is_vararg=!1,this.maxstacksize=0,this.locvars=[],this.linedefined=0,this.lastlinedefined=0,this.source=null}},a.exports.luaF_findupval=function(P,R){return P.stack[R]},a.exports.luaF_close=function(P,R){for(let C=R;C<P.top;C++){let j=P.stack[C];P.stack[C]=new v.TValue(j.type,j.value)}},a.exports.luaF_getlocalname=function(P,R,C){for(let j=0;j<P.locvars.length&&P.locvars[j].startpc<=C;j++)if(C<P.locvars[j].endpc&&--R==0)return P.locvars[j].varname.getstr();return null},a.exports.luaF_initupvals=function(P,R){for(let C=0;C<R.nupvalues;C++)R.upvals[C]=new v.TValue(k,null)},a.exports.luaF_newLclosure=function(P,R){return new v.LClosure(P,R)}},function(a,z,d){const{constant_types:{LUA_TTABLE:k,LUA_TUSERDATA:v},to_luastring:P}=d(1),{lua_assert:R}=d(4),C=d(6),j=d(8),L=d(12),{luaS_bless:H,luaS_new:w}=d(10),B=d(9),Q=d(11),ce=d(15),$=["no value","nil","boolean","userdata","number","string","table","function","userdata","thread","proto"].map(D=>P(D)),ve=function(D){return $[D+1]},se={TM_INDEX:0,TM_NEWINDEX:1,TM_GC:2,TM_MODE:3,TM_LEN:4,TM_EQ:5,TM_ADD:6,TM_SUB:7,TM_MUL:8,TM_MOD:9,TM_POW:10,TM_DIV:11,TM_IDIV:12,TM_BAND:13,TM_BOR:14,TM_BXOR:15,TM_SHL:16,TM_SHR:17,TM_UNM:18,TM_BNOT:19,TM_LT:20,TM_LE:21,TM_CONCAT:22,TM_CALL:23,TM_N:24},$e=P("__name",!0),nn=function(D,re,ke,ge,Oe,tn){let an=D.top;if(C.pushobj2s(D,re),C.pushobj2s(D,ke),C.pushobj2s(D,ge),tn||C.pushobj2s(D,Oe),D.ci.callstatus&L.CIST_LUA?j.luaD_call(D,an,tn):j.luaD_callnoyield(D,an,tn),tn){let sn=D.stack[D.top-1];delete D.stack[--D.top],Oe.setfrom(sn)}},Ke=function(D,re,ke,ge,Oe){let tn=ln(D,re,Oe);return tn.ttisnil()&&(tn=ln(D,ke,Oe)),!tn.ttisnil()&&(nn(D,tn,re,ke,ge,1),!0)},Xe=function(D,re,ke){const ge=B.luaH_getstr(D,ke);return R(re<=se.TM_EQ),ge.ttisnil()?(D.flags|=1<<re,null):ge},ln=function(D,re,ke){let ge;switch(re.ttnov()){case k:case v:ge=re.value.metatable;break;default:ge=D.l_G.mt[re.ttnov()]}return ge?B.luaH_getstr(ge,D.l_G.tmname[ke]):C.luaO_nilobject};a.exports.fasttm=function(D,re,ke){return re===null||re.flags&1<<ke?null:Xe(re,ke,D.l_G.tmname[ke])},a.exports.TMS=se,a.exports.luaT_callTM=nn,a.exports.luaT_callbinTM=Ke,a.exports.luaT_trybinTM=function(D,re,ke,ge,Oe){if(!Ke(D,re,ke,ge,Oe))switch(Oe){case se.TM_CONCAT:return Q.luaG_concaterror(D,re,ke);case se.TM_BAND:case se.TM_BOR:case se.TM_BXOR:case se.TM_SHL:case se.TM_SHR:case se.TM_BNOT:{let tn=ce.tonumber(re),an=ce.tonumber(ke);return tn!==!1&&an!==!1?Q.luaG_tointerror(D,re,ke):Q.luaG_opinterror(D,re,ke,P("perform bitwise operation on",!0))}default:return Q.luaG_opinterror(D,re,ke,P("perform arithmetic on",!0))}},a.exports.luaT_callorderTM=function(D,re,ke,ge){let Oe=new C.TValue;return Ke(D,re,ke,Oe,ge)?!Oe.l_isfalse():null},a.exports.luaT_gettm=Xe,a.exports.luaT_gettmbyobj=ln,a.exports.luaT_init=function(D){D.l_G.tmname[se.TM_INDEX]=new w(D,P("__index",!0)),D.l_G.tmname[se.TM_NEWINDEX]=new w(D,P("__newindex",!0)),D.l_G.tmname[se.TM_GC]=new w(D,P("__gc",!0)),D.l_G.tmname[se.TM_MODE]=new w(D,P("__mode",!0)),D.l_G.tmname[se.TM_LEN]=new w(D,P("__len",!0)),D.l_G.tmname[se.TM_EQ]=new w(D,P("__eq",!0)),D.l_G.tmname[se.TM_ADD]=new w(D,P("__add",!0)),D.l_G.tmname[se.TM_SUB]=new w(D,P("__sub",!0)),D.l_G.tmname[se.TM_MUL]=new w(D,P("__mul",!0)),D.l_G.tmname[se.TM_MOD]=new w(D,P("__mod",!0)),D.l_G.tmname[se.TM_POW]=new w(D,P("__pow",!0)),D.l_G.tmname[se.TM_DIV]=new w(D,P("__div",!0)),D.l_G.tmname[se.TM_IDIV]=new w(D,P("__idiv",!0)),D.l_G.tmname[se.TM_BAND]=new w(D,P("__band",!0)),D.l_G.tmname[se.TM_BOR]=new w(D,P("__bor",!0)),D.l_G.tmname[se.TM_BXOR]=new w(D,P("__bxor",!0)),D.l_G.tmname[se.TM_SHL]=new w(D,P("__shl",!0)),D.l_G.tmname[se.TM_SHR]=new w(D,P("__shr",!0)),D.l_G.tmname[se.TM_UNM]=new w(D,P("__unm",!0)),D.l_G.tmname[se.TM_BNOT]=new w(D,P("__bnot",!0)),D.l_G.tmname[se.TM_LT]=new w(D,P("__lt",!0)),D.l_G.tmname[se.TM_LE]=new w(D,P("__le",!0)),D.l_G.tmname[se.TM_CONCAT]=new w(D,P("__concat",!0)),D.l_G.tmname[se.TM_CALL]=new w(D,P("__call",!0))},a.exports.luaT_objtypename=function(D,re){let ke;if(re.ttistable()&&(ke=re.value.metatable)!==null||re.ttisfulluserdata()&&(ke=re.value.metatable)!==null){let ge=B.luaH_getstr(ke,H(D,$e));if(ge.ttisstring())return ge.svalue()}return ve(re.ttnov())},a.exports.ttypename=ve},function(a,z,d){const{LUA_MASKLINE:k,LUA_MASKCOUNT:v,LUA_MULTRET:P,constant_types:{LUA_TBOOLEAN:R,LUA_TLCF:C,LUA_TLIGHTUSERDATA:j,LUA_TLNGSTR:L,LUA_TNIL:H,LUA_TNUMBER:w,LUA_TNUMFLT:B,LUA_TNUMINT:Q,LUA_TSHRSTR:ce,LUA_TTABLE:$,LUA_TUSERDATA:ve},to_luastring:se}=d(1),{INDEXK:$e,ISK:nn,LFIELDS_PER_FLUSH:Ke,OpCodesI:{OP_ADD:Xe,OP_BAND:ln,OP_BNOT:D,OP_BOR:re,OP_BXOR:ke,OP_CALL:ge,OP_CLOSURE:Oe,OP_CONCAT:tn,OP_DIV:an,OP_EQ:sn,OP_EXTRAARG:ae,OP_FORLOOP:oe,OP_FORPREP:ze,OP_GETTABLE:M,OP_GETTABUP:Ce,OP_GETUPVAL:T,OP_IDIV:g,OP_JMP:S,OP_LE:xe,OP_LEN:Ae,OP_LOADBOOL:pn,OP_LOADK:Ze,OP_LOADKX:dn,OP_LOADNIL:mn,OP_LT:Y,OP_MOD:ee,OP_MOVE:Ie,OP_MUL:Te,OP_NEWTABLE:rn,OP_NOT:On,OP_POW:kn,OP_RETURN:Je,OP_SELF:le,OP_SETLIST:Ue,OP_SETTABLE:N,OP_SETTABUP:me,OP_SETUPVAL:He,OP_SHL:G,OP_SHR:be,OP_SUB:Pe,OP_TAILCALL:Nn,OP_TEST:Un,OP_TESTSET:Mn,OP_TFORCALL:Zn,OP_TFORLOOP:ot,OP_UNM:o,OP_VARARG:de}}=d(16),{LUA_MAXINTEGER:h,LUA_MININTEGER:q,lua_numbertointeger:F}=d(3),{lua_assert:J,luai_nummod:f}=d(4),I=d(6),te=d(13),Ee=d(12),{luaS_bless:Le,luaS_eqlngstr:De,luaS_hashlongstr:qe}=d(10),Fe=d(8),Ve=d(14),vn=d(9),l=d(11),s=function(E,ie,cn){return ie+cn.A},_=function(E,ie,cn){return ie+cn.B},c=function(E,ie,cn,on){return nn(on.B)?cn[$e(on.B)]:E.stack[ie+on.B]},m=function(E,ie,cn,on){return nn(on.C)?cn[$e(on.C)]:E.stack[ie+on.C]},O=function(E,ie,cn,on){let An=cn.A;An!==0&&te.luaF_close(E,ie.l_base+An-1),ie.l_savedpc+=cn.sBx+on},y=function(E,ie){O(E,ie,ie.l_code[ie.l_savedpc],1)},ne=function(E,ie,cn){if(ie.ttisnumber()&&cn.ttisnumber())return U(ie,cn)?1:0;if(ie.ttisstring()&&cn.ttisstring())return fe(ie.tsvalue(),cn.tsvalue())<0?1:0;{let on=Ve.luaT_callorderTM(E,ie,cn,Ve.TMS.TM_LT);return on===null&&l.luaG_ordererror(E,ie,cn),on?1:0}},en=function(E,ie,cn){let on;return ie.ttisnumber()&&cn.ttisnumber()?Me(ie,cn)?1:0:ie.ttisstring()&&cn.ttisstring()?fe(ie.tsvalue(),cn.tsvalue())<=0?1:0:(on=Ve.luaT_callorderTM(E,ie,cn,Ve.TMS.TM_LE))!==null?on?1:0:(E.ci.callstatus|=Ee.CIST_LEQ,on=Ve.luaT_callorderTM(E,cn,ie,Ve.TMS.TM_LT),E.ci.callstatus^=Ee.CIST_LEQ,on===null&&l.luaG_ordererror(E,ie,cn),on?0:1)},gn=function(E,ie,cn){if(ie.ttype()!==cn.ttype())return ie.ttnov()!==cn.ttnov()||ie.ttnov()!==w?0:ie.value===cn.value?1:0;let on;switch(ie.ttype()){case H:return 1;case R:return ie.value==cn.value?1:0;case j:case Q:case B:case C:return ie.value===cn.value?1:0;case ce:case L:return De(ie.tsvalue(),cn.tsvalue())?1:0;case ve:case $:if(ie.value===cn.value)return 1;if(E===null)return 0;(on=Ve.fasttm(E,ie.value.metatable,Ve.TMS.TM_EQ))===null&&(on=Ve.fasttm(E,cn.value.metatable,Ve.TMS.TM_EQ));break;default:return ie.value===cn.value?1:0}if(on===null)return 0;let An=new I.TValue;return Ve.luaT_callTM(E,on,ie,cn,An,1),An.l_isfalse()?0:1},Bn=function(E,ie){let cn=!1,on=Kn(E,ie<0?2:1);if(on===!1){let An=fn(E);if(An===!1)return!1;0<An?(on=h,ie<0&&(cn=!0)):(on=q,ie>=0&&(cn=!0))}return{stopnow:cn,ilimit:on}},Kn=function(E,ie){if(E.ttisfloat()){let cn=E.value,on=Math.floor(cn);if(cn!==on){if(ie===0)return!1;ie>1&&(on+=1)}return F(on)}if(E.ttisinteger())return E.value;if(Vn(E)){let cn=new I.TValue;if(I.luaO_str2num(E.svalue(),cn)===E.vslen()+1)return Kn(cn,ie)}return!1},pe=function(E){return E.ttisinteger()?E.value:Kn(E,0)},fn=function(E){if(E.ttnov()===w)return E.value;if(Vn(E)){let ie=new I.TValue;if(I.luaO_str2num(E.svalue(),ie)===E.vslen()+1)return ie.value}return!1},U=function(E,ie){return E.value<ie.value},Me=function(E,ie){return E.value<=ie.value},fe=function(E,ie){let cn=qe(E),on=qe(ie);return cn===on?0:cn<on?-1:1},yn=function(E,ie,cn){let on;switch(cn.ttype()){case $:{let An=cn.value;if((on=Ve.fasttm(E,An.metatable,Ve.TMS.TM_LEN))!==null)break;return void ie.setivalue(vn.luaH_getn(An))}case ce:case L:return void ie.setivalue(cn.vslen());default:(on=Ve.luaT_gettmbyobj(E,cn,Ve.TMS.TM_LEN)).ttisnil()&&l.luaG_typeerror(E,cn,se("get length of",!0))}Ve.luaT_callTM(E,on,cn,cn,ie,1)},Dn=Math.imul||function(E,ie){let cn=65535&E,on=65535&ie;return cn*on+((E>>>16&65535)*on+cn*(ie>>>16&65535)<<16>>>0)|0},Pn=function(E,ie,cn){return cn===0&&l.luaG_runerror(E,se("attempt to divide by zero")),0|Math.floor(ie/cn)},In=function(E,ie,cn){return cn===0&&l.luaG_runerror(E,se("attempt to perform 'n%%0'")),ie-Math.floor(ie/cn)*cn|0},$n=function(E,ie){return ie<0?ie<=-32?0:E>>>-ie:ie>=32?0:E<<ie},ht=function(E,ie,cn,on){let An=E.cache;if(An!==null){let un=E.upvalues,_n=un.length;for(let We=0;We<_n;We++){let xn=un[We].instack?cn[on+un[We].idx]:ie[un[We].idx];if(An.upvals[We]!==xn)return null}}return An},Fn=function(E,ie,cn,on,An){let un=ie.upvalues.length,_n=ie.upvalues,We=new I.LClosure(E,un);We.p=ie,E.stack[An].setclLvalue(We);for(let xn=0;xn<un;xn++)_n[xn].instack?We.upvals[xn]=te.luaF_findupval(E,on+_n[xn].idx):We.upvals[xn]=cn[_n[xn].idx];ie.cache=We},Jn=function(E){return E.ttisnumber()},Vn=function(E){return E.ttisstring()},ut=function(E,ie){let cn=E.stack[ie];return!!cn.ttisstring()||!!Jn(cn)&&(I.luaO_tostring(E,cn),!0)},it=function(E){return E.ttisstring()&&E.vslen()===0},Ct=function(E,ie,cn,on){let An=0;do{let un=E.stack[ie-cn],_n=un.vslen(),We=un.svalue();on.set(We,An),An+=_n}while(--cn>0)},pt=function(E,ie){J(ie>=2);do{let cn=E.top,on=2;if((E.stack[cn-2].ttisstring()||Jn(E.stack[cn-2]))&&ut(E,cn-1))if(it(E.stack[cn-1]))ut(E,cn-2);else if(it(E.stack[cn-2]))I.setobjs2s(E,cn-2,cn-1);else{let An=E.stack[cn-1].vslen();for(on=1;on<ie&&ut(E,cn-on-1);on++)An+=E.stack[cn-on-1].vslen();let un=new Uint8Array(An);Ct(E,cn,on,un);let _n=Le(E,un);I.setsvalue2s(E,cn-on,_n)}else Ve.luaT_trybinTM(E,E.stack[cn-2],E.stack[cn-1],E.stack[cn-2],Ve.TMS.TM_CONCAT);for(ie-=on-1;E.top>cn-(on-1);)delete E.stack[--E.top]}while(ie>1)},Dt=function(E,ie,cn,on){for(let An=0;An<2e3;An++){let un;if(ie.ttistable()){let _n=vn.luaH_get(E,ie.value,cn);if(!_n.ttisnil())return void I.setobj2s(E,on,_n);if((un=Ve.fasttm(E,ie.value.metatable,Ve.TMS.TM_INDEX))===null)return void E.stack[on].setnilvalue()}else(un=Ve.luaT_gettmbyobj(E,ie,Ve.TMS.TM_INDEX)).ttisnil()&&l.luaG_typeerror(E,ie,se("index",!0));if(un.ttisfunction())return void Ve.luaT_callTM(E,un,ie,cn,E.stack[on],1);ie=un}l.luaG_runerror(E,se("'__index' chain too long; possible loop",!0))},bt=function(E,ie,cn,on){for(let An=0;An<2e3;An++){let un;if(ie.ttistable()){let _n=ie.value;if(!vn.luaH_get(E,_n,cn).ttisnil()||(un=Ve.fasttm(E,_n.metatable,Ve.TMS.TM_NEWINDEX))===null)return vn.luaH_setfrom(E,_n,cn,on),void vn.invalidateTMcache(_n)}else(un=Ve.luaT_gettmbyobj(E,ie,Ve.TMS.TM_NEWINDEX)).ttisnil()&&l.luaG_typeerror(E,ie,se("index",!0));if(un.ttisfunction())return void Ve.luaT_callTM(E,un,ie,cn,on,0);ie=un}l.luaG_runerror(E,se("'__newindex' chain too long; possible loop",!0))};a.exports.cvt2str=Jn,a.exports.cvt2num=Vn,a.exports.luaV_gettable=Dt,a.exports.luaV_concat=pt,a.exports.luaV_div=Pn,a.exports.luaV_equalobj=gn,a.exports.luaV_execute=function(E){let ie=E.ci;ie.callstatus|=Ee.CIST_FRESH;e:for(;;){J(ie===E.ci);let cn=ie.func.value,on=cn.p.k,An=ie.l_base,un=ie.l_code[ie.l_savedpc++];E.hookmask&(k|v)&&l.luaG_traceexec(E);let _n=s(0,An,un);switch(un.opcode){case Ie:I.setobjs2s(E,_n,_(0,An,un));break;case Ze:{let We=on[un.Bx];I.setobj2s(E,_n,We);break}case dn:{J(ie.l_code[ie.l_savedpc].opcode===ae);let We=on[ie.l_code[ie.l_savedpc++].Ax];I.setobj2s(E,_n,We);break}case pn:E.stack[_n].setbvalue(un.B!==0),un.C!==0&&ie.l_savedpc++;break;case mn:for(let We=0;We<=un.B;We++)E.stack[_n+We].setnilvalue();break;case T:{let We=un.B;I.setobj2s(E,_n,cn.upvals[We]);break}case Ce:{let We=cn.upvals[un.B],xn=m(E,An,on,un);Dt(E,We,xn,_n);break}case M:{let We=E.stack[_(0,An,un)],xn=m(E,An,on,un);Dt(E,We,xn,_n);break}case me:{let We=cn.upvals[un.A],xn=c(E,An,on,un),Sn=m(E,An,on,un);bt(E,We,xn,Sn);break}case He:cn.upvals[un.B].setfrom(E.stack[_n]);break;case N:{let We=E.stack[_n],xn=c(E,An,on,un),Sn=m(E,An,on,un);bt(E,We,xn,Sn);break}case rn:E.stack[_n].sethvalue(vn.luaH_new(E));break;case le:{let We=_(0,An,un),xn=m(E,An,on,un);I.setobjs2s(E,_n+1,We),Dt(E,E.stack[We],xn,_n);break}case Xe:{let We,xn,Sn=c(E,An,on,un),p=m(E,An,on,un);Sn.ttisinteger()&&p.ttisinteger()?E.stack[_n].setivalue(Sn.value+p.value|0):(We=fn(Sn))!==!1&&(xn=fn(p))!==!1?E.stack[_n].setfltvalue(We+xn):Ve.luaT_trybinTM(E,Sn,p,E.stack[_n],Ve.TMS.TM_ADD);break}case Pe:{let We,xn,Sn=c(E,An,on,un),p=m(E,An,on,un);Sn.ttisinteger()&&p.ttisinteger()?E.stack[_n].setivalue(Sn.value-p.value|0):(We=fn(Sn))!==!1&&(xn=fn(p))!==!1?E.stack[_n].setfltvalue(We-xn):Ve.luaT_trybinTM(E,Sn,p,E.stack[_n],Ve.TMS.TM_SUB);break}case Te:{let We,xn,Sn=c(E,An,on,un),p=m(E,An,on,un);Sn.ttisinteger()&&p.ttisinteger()?E.stack[_n].setivalue(Dn(Sn.value,p.value)):(We=fn(Sn))!==!1&&(xn=fn(p))!==!1?E.stack[_n].setfltvalue(We*xn):Ve.luaT_trybinTM(E,Sn,p,E.stack[_n],Ve.TMS.TM_MUL);break}case ee:{let We,xn,Sn=c(E,An,on,un),p=m(E,An,on,un);Sn.ttisinteger()&&p.ttisinteger()?E.stack[_n].setivalue(In(E,Sn.value,p.value)):(We=fn(Sn))!==!1&&(xn=fn(p))!==!1?E.stack[_n].setfltvalue(f(E,We,xn)):Ve.luaT_trybinTM(E,Sn,p,E.stack[_n],Ve.TMS.TM_MOD);break}case kn:{let We,xn,Sn=c(E,An,on,un),p=m(E,An,on,un);(We=fn(Sn))!==!1&&(xn=fn(p))!==!1?E.stack[_n].setfltvalue(Math.pow(We,xn)):Ve.luaT_trybinTM(E,Sn,p,E.stack[_n],Ve.TMS.TM_POW);break}case an:{let We,xn,Sn=c(E,An,on,un),p=m(E,An,on,un);(We=fn(Sn))!==!1&&(xn=fn(p))!==!1?E.stack[_n].setfltvalue(We/xn):Ve.luaT_trybinTM(E,Sn,p,E.stack[_n],Ve.TMS.TM_DIV);break}case g:{let We,xn,Sn=c(E,An,on,un),p=m(E,An,on,un);Sn.ttisinteger()&&p.ttisinteger()?E.stack[_n].setivalue(Pn(E,Sn.value,p.value)):(We=fn(Sn))!==!1&&(xn=fn(p))!==!1?E.stack[_n].setfltvalue(Math.floor(We/xn)):Ve.luaT_trybinTM(E,Sn,p,E.stack[_n],Ve.TMS.TM_IDIV);break}case ln:{let We,xn,Sn=c(E,An,on,un),p=m(E,An,on,un);(We=pe(Sn))!==!1&&(xn=pe(p))!==!1?E.stack[_n].setivalue(We&xn):Ve.luaT_trybinTM(E,Sn,p,E.stack[_n],Ve.TMS.TM_BAND);break}case re:{let We,xn,Sn=c(E,An,on,un),p=m(E,An,on,un);(We=pe(Sn))!==!1&&(xn=pe(p))!==!1?E.stack[_n].setivalue(We|xn):Ve.luaT_trybinTM(E,Sn,p,E.stack[_n],Ve.TMS.TM_BOR);break}case ke:{let We,xn,Sn=c(E,An,on,un),p=m(E,An,on,un);(We=pe(Sn))!==!1&&(xn=pe(p))!==!1?E.stack[_n].setivalue(We^xn):Ve.luaT_trybinTM(E,Sn,p,E.stack[_n],Ve.TMS.TM_BXOR);break}case G:{let We,xn,Sn=c(E,An,on,un),p=m(E,An,on,un);(We=pe(Sn))!==!1&&(xn=pe(p))!==!1?E.stack[_n].setivalue($n(We,xn)):Ve.luaT_trybinTM(E,Sn,p,E.stack[_n],Ve.TMS.TM_SHL);break}case be:{let We,xn,Sn=c(E,An,on,un),p=m(E,An,on,un);(We=pe(Sn))!==!1&&(xn=pe(p))!==!1?E.stack[_n].setivalue($n(We,-xn)):Ve.luaT_trybinTM(E,Sn,p,E.stack[_n],Ve.TMS.TM_SHR);break}case o:{let We,xn=E.stack[_(0,An,un)];xn.ttisinteger()?E.stack[_n].setivalue(0|-xn.value):(We=fn(xn))!==!1?E.stack[_n].setfltvalue(-We):Ve.luaT_trybinTM(E,xn,xn,E.stack[_n],Ve.TMS.TM_UNM);break}case D:{let We=E.stack[_(0,An,un)];We.ttisinteger()?E.stack[_n].setivalue(~We.value):Ve.luaT_trybinTM(E,We,We,E.stack[_n],Ve.TMS.TM_BNOT);break}case On:{let We=E.stack[_(0,An,un)];E.stack[_n].setbvalue(We.l_isfalse());break}case Ae:yn(E,E.stack[_n],E.stack[_(0,An,un)]);break;case tn:{let We=un.B,xn=un.C;E.top=An+xn+1,pt(E,xn-We+1);let Sn=An+We;I.setobjs2s(E,_n,Sn),Fe.adjust_top(E,ie.top);break}case S:O(E,ie,un,0);break;case sn:gn(E,c(E,An,on,un),m(E,An,on,un))!==un.A?ie.l_savedpc++:y(E,ie);break;case Y:ne(E,c(E,An,on,un),m(E,An,on,un))!==un.A?ie.l_savedpc++:y(E,ie);break;case xe:en(E,c(E,An,on,un),m(E,An,on,un))!==un.A?ie.l_savedpc++:y(E,ie);break;case Un:(un.C?E.stack[_n].l_isfalse():!E.stack[_n].l_isfalse())?ie.l_savedpc++:y(E,ie);break;case Mn:{let We=_(0,An,un),xn=E.stack[We];(un.C?xn.l_isfalse():!xn.l_isfalse())?ie.l_savedpc++:(I.setobjs2s(E,_n,We),y(E,ie));break}case ge:{let We=un.B,xn=un.C-1;if(We!==0&&Fe.adjust_top(E,_n+We),!Fe.luaD_precall(E,_n,xn)){ie=E.ci;continue e}xn>=0&&Fe.adjust_top(E,ie.top);break}case Nn:{let We=un.B;if(We!==0&&Fe.adjust_top(E,_n+We),!Fe.luaD_precall(E,_n,P)){let xn=E.ci,Sn=xn.previous,p=xn.func,X=xn.funcOff,K=Sn.funcOff,ye=xn.l_base+p.value.p.numparams;cn.p.p.length>0&&te.luaF_close(E,Sn.l_base);for(let he=0;X+he<ye;he++)I.setobjs2s(E,K+he,X+he);Sn.l_base=K+(xn.l_base-X),Sn.top=K+(E.top-X),Fe.adjust_top(E,Sn.top),Sn.l_code=xn.l_code,Sn.l_savedpc=xn.l_savedpc,Sn.callstatus|=Ee.CIST_TAIL,Sn.next=null,ie=E.ci=Sn,J(E.top===Sn.l_base+E.stack[K].value.p.maxstacksize);continue e}break}case Je:{cn.p.p.length>0&&te.luaF_close(E,An);let We=Fe.luaD_poscall(E,ie,_n,un.B!==0?un.B-1:E.top-_n);if(ie.callstatus&Ee.CIST_FRESH)return;ie=E.ci,We&&Fe.adjust_top(E,ie.top),J(ie.callstatus&Ee.CIST_LUA),J(ie.l_code[ie.l_savedpc-1].opcode===ge);continue e}case oe:if(E.stack[_n].ttisinteger()){let We=E.stack[_n+2].value,xn=E.stack[_n].value+We|0,Sn=E.stack[_n+1].value;(0<We?xn<=Sn:Sn<=xn)&&(ie.l_savedpc+=un.sBx,E.stack[_n].chgivalue(xn),E.stack[_n+3].setivalue(xn))}else{let We=E.stack[_n+2].value,xn=E.stack[_n].value+We,Sn=E.stack[_n+1].value;(0<We?xn<=Sn:Sn<=xn)&&(ie.l_savedpc+=un.sBx,E.stack[_n].chgfltvalue(xn),E.stack[_n+3].setfltvalue(xn))}break;case ze:{let We,xn=E.stack[_n],Sn=E.stack[_n+1],p=E.stack[_n+2];if(xn.ttisinteger()&&p.ttisinteger()&&(We=Bn(Sn,p.value))){let X=We.stopnow?0:xn.value;Sn.value=We.ilimit,xn.value=X-p.value|0}else{let X,K,ye;(X=fn(Sn))===!1&&l.luaG_runerror(E,se("'for' limit must be a number",!0)),E.stack[_n+1].setfltvalue(X),(K=fn(p))===!1&&l.luaG_runerror(E,se("'for' step must be a number",!0)),E.stack[_n+2].setfltvalue(K),(ye=fn(xn))===!1&&l.luaG_runerror(E,se("'for' initial value must be a number",!0)),E.stack[_n].setfltvalue(ye-K)}ie.l_savedpc+=un.sBx;break}case Zn:{let We=_n+3;I.setobjs2s(E,We+2,_n+2),I.setobjs2s(E,We+1,_n+1),I.setobjs2s(E,We,_n),Fe.adjust_top(E,We+3),Fe.luaD_call(E,We,un.C),Fe.adjust_top(E,ie.top),un=ie.l_code[ie.l_savedpc++],_n=s(0,An,un),J(un.opcode===ot)}case ot:E.stack[_n+1].ttisnil()||(I.setobjs2s(E,_n,_n+1),ie.l_savedpc+=un.sBx);break;case Ue:{let We=un.B,xn=un.C;We===0&&(We=E.top-_n-1),xn===0&&(J(ie.l_code[ie.l_savedpc].opcode===ae),xn=ie.l_code[ie.l_savedpc++].Ax);let Sn=E.stack[_n].value,p=(xn-1)*Ke+We;for(;We>0;We--)vn.luaH_setint(Sn,p--,E.stack[_n+We]);Fe.adjust_top(E,ie.top);break}case Oe:{let We=cn.p.p[un.Bx],xn=ht(We,cn.upvals,E.stack,An);xn===null?Fn(E,We,cn.upvals,An,_n):E.stack[_n].setclLvalue(xn);break}case de:{let We,xn=un.B-1,Sn=An-ie.funcOff-cn.p.numparams-1;for(Sn<0&&(Sn=0),xn<0&&(xn=Sn,Fe.luaD_checkstack(E,Sn),Fe.adjust_top(E,_n+Sn)),We=0;We<xn&&We<Sn;We++)I.setobjs2s(E,_n+We,An-Sn+We);for(;We<xn;We++)E.stack[_n+We].setnilvalue();break}case ae:throw Error("invalid opcode")}}},a.exports.luaV_finishOp=function(E){let ie=E.ci,cn=ie.l_base,on=ie.l_code[ie.l_savedpc-1],An=on.opcode;switch(An){case Xe:case Pe:case Te:case an:case g:case ln:case re:case ke:case G:case be:case ee:case kn:case o:case D:case Ae:case Ce:case M:case le:I.setobjs2s(E,cn+on.A,E.top-1),delete E.stack[--E.top];break;case xe:case Y:case sn:{let un=!E.stack[E.top-1].l_isfalse();delete E.stack[--E.top],ie.callstatus&Ee.CIST_LEQ&&(J(An===xe),ie.callstatus^=Ee.CIST_LEQ,un=!un),J(ie.l_code[ie.l_savedpc].opcode===S),un!==!!on.A&&ie.l_savedpc++;break}case tn:{let un=E.top-1,_n=un-1-(cn+on.B);I.setobjs2s(E,un-2,un),_n>1&&(E.top=un-1,pt(E,_n)),I.setobjs2s(E,ie.l_base+on.A,E.top-1),Fe.adjust_top(E,ie.top);break}case Zn:J(ie.l_code[ie.l_savedpc].opcode===ot),Fe.adjust_top(E,ie.top);break;case ge:on.C-1>=0&&Fe.adjust_top(E,ie.top)}},a.exports.luaV_imul=Dn,a.exports.luaV_lessequal=en,a.exports.luaV_lessthan=ne,a.exports.luaV_mod=In,a.exports.luaV_objlen=yn,a.exports.luaV_rawequalobj=function(E,ie){return gn(null,E,ie)},a.exports.luaV_shiftl=$n,a.exports.luaV_tointeger=Kn,a.exports.settable=bt,a.exports.tointeger=pe,a.exports.tonumber=fn},function(a,z,d){const k=[96,113,65,84,80,80,92,108,60,16,60,84,108,124,124,124,124,124,124,124,124,124,124,124,124,96,96,96,96,104,34,188,188,188,132,228,84,84,16,98,98,4,98,20,81,80,23],v=function(L,H){return~(-1<<L)<<H},P=function(L,H){return~v(L,H)},R=function(L,H,w,B){return L.code=L.code&P(B,w)|H<<w&v(B,w),j(L)},C=function(L,H){return R(L,H,14,18)},j=function(L){if(typeof L=="number")return{code:L,opcode:L>>0&v(6,0),A:L>>6&v(8,0),B:L>>23&v(9,0),C:L>>14&v(9,0),Bx:L>>14&v(18,0),Ax:L>>6&v(26,0),sBx:(L>>14&v(18,0))-131071};{let H=L.code;return L.opcode=H>>0&v(6,0),L.A=H>>6&v(8,0),L.B=H>>23&v(9,0),L.C=H>>14&v(9,0),L.Bx=H>>14&v(18,0),L.Ax=H>>6&v(26,0),L.sBx=(H>>14&v(18,0))-131071,L}};a.exports.BITRK=256,a.exports.CREATE_ABC=function(L,H,w,B){return j(L<<0|H<<6|w<<23|B<<14)},a.exports.CREATE_ABx=function(L,H,w){return j(L<<0|H<<6|w<<14)},a.exports.CREATE_Ax=function(L,H){return j(L<<0|H<<6)},a.exports.GET_OPCODE=function(L){return L.opcode},a.exports.GETARG_A=function(L){return L.A},a.exports.GETARG_B=function(L){return L.B},a.exports.GETARG_C=function(L){return L.C},a.exports.GETARG_Bx=function(L){return L.Bx},a.exports.GETARG_Ax=function(L){return L.Ax},a.exports.GETARG_sBx=function(L){return L.sBx},a.exports.INDEXK=function(L){return-257&L},a.exports.ISK=function(L){return 256&L},a.exports.LFIELDS_PER_FLUSH=50,a.exports.MAXARG_A=255,a.exports.MAXARG_Ax=67108863,a.exports.MAXARG_B=511,a.exports.MAXARG_Bx=262143,a.exports.MAXARG_C=511,a.exports.MAXARG_sBx=131071,a.exports.MAXINDEXRK=255,a.exports.NO_REG=255,a.exports.OpArgK=3,a.exports.OpArgN=0,a.exports.OpArgR=2,a.exports.OpArgU=1,a.exports.OpCodes=["MOVE","LOADK","LOADKX","LOADBOOL","LOADNIL","GETUPVAL","GETTABUP","GETTABLE","SETTABUP","SETUPVAL","SETTABLE","NEWTABLE","SELF","ADD","SUB","MUL","MOD","POW","DIV","IDIV","BAND","BOR","BXOR","SHL","SHR","UNM","BNOT","NOT","LEN","CONCAT","JMP","EQ","LT","LE","TEST","TESTSET","CALL","TAILCALL","RETURN","FORLOOP","FORPREP","TFORCALL","TFORLOOP","SETLIST","CLOSURE","VARARG","EXTRAARG"],a.exports.OpCodesI={OP_MOVE:0,OP_LOADK:1,OP_LOADKX:2,OP_LOADBOOL:3,OP_LOADNIL:4,OP_GETUPVAL:5,OP_GETTABUP:6,OP_GETTABLE:7,OP_SETTABUP:8,OP_SETUPVAL:9,OP_SETTABLE:10,OP_NEWTABLE:11,OP_SELF:12,OP_ADD:13,OP_SUB:14,OP_MUL:15,OP_MOD:16,OP_POW:17,OP_DIV:18,OP_IDIV:19,OP_BAND:20,OP_BOR:21,OP_BXOR:22,OP_SHL:23,OP_SHR:24,OP_UNM:25,OP_BNOT:26,OP_NOT:27,OP_LEN:28,OP_CONCAT:29,OP_JMP:30,OP_EQ:31,OP_LT:32,OP_LE:33,OP_TEST:34,OP_TESTSET:35,OP_CALL:36,OP_TAILCALL:37,OP_RETURN:38,OP_FORLOOP:39,OP_FORPREP:40,OP_TFORCALL:41,OP_TFORLOOP:42,OP_SETLIST:43,OP_CLOSURE:44,OP_VARARG:45,OP_EXTRAARG:46},a.exports.POS_A=6,a.exports.POS_Ax=6,a.exports.POS_B=23,a.exports.POS_Bx=14,a.exports.POS_C=14,a.exports.POS_OP=0,a.exports.RKASK=function(L){return 256|L},a.exports.SETARG_A=function(L,H){return R(L,H,6,8)},a.exports.SETARG_Ax=function(L,H){return R(L,H,6,26)},a.exports.SETARG_B=function(L,H){return R(L,H,23,9)},a.exports.SETARG_Bx=C,a.exports.SETARG_C=function(L,H){return R(L,H,14,9)},a.exports.SETARG_sBx=function(L,H){return C(L,H+131071)},a.exports.SET_OPCODE=function(L,H){return L.code=L.code&P(6,0)|H<<0&v(6,0),j(L)},a.exports.SIZE_A=8,a.exports.SIZE_Ax=26,a.exports.SIZE_B=9,a.exports.SIZE_Bx=18,a.exports.SIZE_C=9,a.exports.SIZE_OP=6,a.exports.fullins=j,a.exports.getBMode=function(L){return k[L]>>4&3},a.exports.getCMode=function(L){return k[L]>>2&3},a.exports.getOpMode=function(L){return 3&k[L]},a.exports.iABC=0,a.exports.iABx=1,a.exports.iAsBx=2,a.exports.iAx=3,a.exports.testAMode=function(L){return 64&k[L]},a.exports.testTMode=function(L){return 128&k[L]}},function(a,z,d){const{LUA_VERSION_MAJOR:k,LUA_VERSION_MINOR:v}=d(2),P="_"+k+"_"+v;a.exports.LUA_VERSUFFIX=P,a.exports.lua_assert=function(C){},a.exports.luaopen_base=d(24).luaopen_base,a.exports.LUA_COLIBNAME="coroutine",a.exports.luaopen_coroutine=d(25).luaopen_coroutine,a.exports.LUA_TABLIBNAME="table",a.exports.luaopen_table=d(26).luaopen_table,a.exports.LUA_OSLIBNAME="os",a.exports.luaopen_os=d(27).luaopen_os,a.exports.LUA_STRLIBNAME="string",a.exports.luaopen_string=d(28).luaopen_string,a.exports.LUA_UTF8LIBNAME="utf8",a.exports.luaopen_utf8=d(29).luaopen_utf8,a.exports.LUA_BITLIBNAME="bit32",a.exports.LUA_MATHLIBNAME="math",a.exports.luaopen_math=d(30).luaopen_math,a.exports.LUA_DBLIBNAME="debug",a.exports.luaopen_debug=d(31).luaopen_debug,a.exports.LUA_LOADLIBNAME="package",a.exports.luaopen_package=d(32).luaopen_package,a.exports.LUA_FENGARILIBNAME="fengari",a.exports.luaopen_fengari=d(33).luaopen_fengari;const R=d(39);a.exports.luaL_openlibs=R.luaL_openlibs},function(a,z,d){const{LUA_MULTRET:k,LUA_OPBNOT:v,LUA_OPEQ:P,LUA_OPLE:R,LUA_OPLT:C,LUA_OPUNM:j,LUA_REGISTRYINDEX:L,LUA_RIDX_GLOBALS:H,LUA_VERSION_NUM:w,constant_types:{LUA_NUMTAGS:B,LUA_TBOOLEAN:Q,LUA_TCCL:ce,LUA_TFUNCTION:$,LUA_TLCF:ve,LUA_TLCL:se,LUA_TLIGHTUSERDATA:$e,LUA_TLNGSTR:nn,LUA_TNIL:Ke,LUA_TNONE:Xe,LUA_TNUMFLT:ln,LUA_TNUMINT:D,LUA_TSHRSTR:re,LUA_TTABLE:ke,LUA_TTHREAD:ge,LUA_TUSERDATA:Oe},thread_status:{LUA_OK:tn},from_userstring:an,to_luastring:sn}=d(1),{api_check:ae}=d(4),oe=d(11),ze=d(8),{luaU_dump:M}=d(37),Ce=d(13),T=d(6),g=d(12),{luaS_bless:S,luaS_new:xe,luaS_newliteral:Ae}=d(10),pn=d(14),{LUAI_MAXSTACK:Ze}=d(3),dn=d(15),mn=d(9),{ZIO:Y}=d(19),ee=T.TValue,Ie=T.CClosure,Te=function(l){l.top++,ae(l,l.top<=l.ci.top,"stack overflow")},rn=function(l,s){ae(l,s<l.top-l.ci.funcOff,"not enough elements in the stack")},On=function(l){if(!l)throw TypeError("invalid argument")},kn=function(l){On(typeof l=="number"&&(0|l)===l)},Je=function(l){return l!==T.luaO_nilobject},le=function(l,s){let _=l.ci;if(s>0){let c=_.funcOff+s;return ae(l,s<=_.top-(_.funcOff+1),"unacceptable index"),c>=l.top?T.luaO_nilobject:l.stack[c]}return s>L?(ae(l,s!==0&&-s<=l.top,"invalid index"),l.stack[l.top+s]):s===L?l.l_G.l_registry:(ae(l,(s=L-s)<=Ce.MAXUPVAL+1,"upvalue index too large"),_.func.ttislcf()?T.luaO_nilobject:s<=_.func.value.nupvalues?_.func.value.upvalue[s-1]:T.luaO_nilobject)},Ue=function(l,s){let _=l.ci;if(s>0){let c=_.funcOff+s;return ae(l,s<=_.top-(_.funcOff+1),"unacceptable index"),c>=l.top?null:c}if(s>L)return ae(l,s!==0&&-s<=l.top,"invalid index"),l.top+s;throw Error("attempt to use pseudo-index")},N=function(l,s){let _,c=l.ci.funcOff;s>=0?(ae(l,s<=l.stack_last-(c+1),"new top too large"),_=c+1+s):(ae(l,-(s+1)<=l.top-(c+1),"invalid new top"),_=l.top+s+1),ze.adjust_top(l,_)},me=function(l,s){N(l,-s-1)},He=function(l,s,_){for(;s<_;s++,_--){let c=l.stack[s],m=new ee(c.type,c.value);T.setobjs2s(l,s,_),T.setobj2s(l,_,m)}},G=function(l,s,_){let c=l.top-1,m=Ue(l,s),O=l.stack[m];ae(l,Je(O)&&s>L,"index not in the stack"),ae(l,(_>=0?_:-_)<=c-m+1,"invalid 'n'");let y=_>=0?c-_:m-_-1;He(l,m,y),He(l,y+1,l.top-1),He(l,m,l.top-1)},be=function(l,s,_){let c=le(l,s);le(l,_).setfrom(c)},Pe=function(l,s,_){if(On(typeof s=="function"),kn(_),_===0)l.stack[l.top]=new ee(ve,s);else{rn(l,_),ae(l,_<=Ce.MAXUPVAL,"upvalue index too large");let c=new Ie(l,s,_);for(let m=0;m<_;m++)c.upvalue[m].setfrom(l.stack[l.top-_+m]);for(let m=1;m<_;m++)delete l.stack[--l.top];_>0&&--l.top,l.stack[l.top].setclCvalue(c)}Te(l)},Nn=Pe,Un=function(l,s){Pe(l,s,0)},Mn=Un,Zn=function(l,s,_){let c=xe(l,an(_));rn(l,1),T.pushsvalue2s(l,c),ae(l,l.top<=l.ci.top,"stack overflow"),dn.settable(l,s,l.stack[l.top-1],l.stack[l.top-2]),delete l.stack[--l.top],delete l.stack[--l.top]},ot=function(l,s){Zn(l,mn.luaH_getint(l.l_G.l_registry.value,H),s)},o=function(l,s,_){let c=xe(l,an(_));return T.pushsvalue2s(l,c),ae(l,l.top<=l.ci.top,"stack overflow"),dn.luaV_gettable(l,s,l.stack[l.top-1],l.top-1),l.stack[l.top-1].ttnov()},de=function(l,s,_){let c=le(l,s);return kn(_),ae(l,c.ttistable(),"table expected"),T.pushobj2s(l,mn.luaH_getint(c.value,_)),ae(l,l.top<=l.ci.top,"stack overflow"),l.stack[l.top-1].ttnov()},h=function(l,s,_){let c=new T.TValue(ke,mn.luaH_new(l));l.stack[l.top]=c,Te(l)},q=function(l,s,_){switch(kn(_),s.ttype()){case ce:{let c=s.value;return 1<=_&&_<=c.nupvalues?{name:sn("",!0),val:c.upvalue[_-1]}:null}case se:{let c=s.value,m=c.p;if(!(1<=_&&_<=m.upvalues.length))return null;let O=m.upvalues[_-1].name;return{name:O?O.getstr():sn("(*no name)",!0),val:c.upvals[_-1]}}default:return null}},F=function(l,s){let _=le(l,s);if(!_.ttisstring()){if(!dn.cvt2str(_))return null;T.luaO_tostring(l,_)}return _.svalue()},J=F,f=function(l,s){return dn.tointeger(le(l,s))},I=function(l,s){return dn.tonumber(le(l,s))},te=new WeakMap,Ee=function(l,s){ze.luaD_callnoyield(l,s.funcOff,s.nresults)},Le=function(l,s){let _=le(l,s);return Je(_)?_.ttnov():Xe},De=sn("?"),qe=function(l,s,_){ae(l,_===k||l.ci.top-l.top>=_-s,"results from function overflow current stack size")},Fe=function(l,s,_,c,m){ae(l,m===null||!(l.ci.callstatus&g.CIST_LUA),"cannot use continuations inside hooks"),rn(l,s+1),ae(l,l.status===tn,"cannot do calls on non-normal thread"),qe(l,s,_);let O=l.top-(s+1);m!==null&&l.nny===0?(l.ci.c_k=m,l.ci.c_ctx=c,ze.luaD_call(l,O,_)):ze.luaD_callnoyield(l,O,_),_===k&&l.ci.top<l.top&&(l.ci.top=l.top)},Ve=function(l,s,_,c,m,O){let y,ne;ae(l,O===null||!(l.ci.callstatus&g.CIST_LUA),"cannot use continuations inside hooks"),rn(l,s+1),ae(l,l.status===tn,"cannot do calls on non-normal thread"),qe(l,s,_),ne=c===0?0:Ue(l,c);let en=l.top-(s+1);if(O===null||l.nny>0){let gn={funcOff:en,nresults:_};y=ze.luaD_pcall(l,Ee,gn,en,ne)}else{let gn=l.ci;gn.c_k=O,gn.c_ctx=m,gn.extra=en,gn.c_old_errfunc=l.errfunc,l.errfunc=ne,gn.callstatus&=~g.CIST_OAH|l.allowhook,gn.callstatus|=g.CIST_YPCALL,ze.luaD_call(l,en,_),gn.callstatus&=~g.CIST_YPCALL,l.errfunc=gn.c_old_errfunc,y=tn}return _===k&&l.ci.top<l.top&&(l.ci.top=l.top),y},vn=function(l,s,_){let c=le(l,s);ae(l,c.ttisLclosure(),"Lua function expected");let m=c.value;return kn(_),ae(l,1<=_&&_<=m.p.upvalues.length,"invalid upvalue index"),{f:m,i:_-1}};a.exports.api_incr_top=Te,a.exports.api_checknelems=rn,a.exports.lua_absindex=function(l,s){return s>0||s<=L?s:l.top-l.ci.funcOff+s},a.exports.lua_arith=function(l,s){s!==j&&s!==v?rn(l,2):(rn(l,1),T.pushobj2s(l,l.stack[l.top-1]),ae(l,l.top<=l.ci.top,"stack overflow")),T.luaO_arith(l,s,l.stack[l.top-2],l.stack[l.top-1],l.stack[l.top-2]),delete l.stack[--l.top]},a.exports.lua_atpanic=function(l,s){let _=l.l_G.panic;return l.l_G.panic=s,_},a.exports.lua_atnativeerror=function(l,s){let _=l.l_G.atnativeerror;return l.l_G.atnativeerror=s,_},a.exports.lua_call=function(l,s,_){Fe(l,s,_,0,null)},a.exports.lua_callk=Fe,a.exports.lua_checkstack=function(l,s){let _,c=l.ci;return ae(l,s>=0,"negative 'n'"),l.stack_last-l.top>s?_=!0:l.top+g.EXTRA_STACK>Ze-s?_=!1:(ze.luaD_growstack(l,s),_=!0),_&&c.top<l.top+s&&(c.top=l.top+s),_},a.exports.lua_compare=function(l,s,_,c){let m=le(l,s),O=le(l,_),y=0;if(Je(m)&&Je(O))switch(c){case P:y=dn.luaV_equalobj(l,m,O);break;case C:y=dn.luaV_lessthan(l,m,O);break;case R:y=dn.luaV_lessequal(l,m,O);break;default:ae(l,!1,"invalid option")}return y},a.exports.lua_concat=function(l,s){rn(l,s),s>=2?dn.luaV_concat(l,s):s===0&&(T.pushsvalue2s(l,S(l,sn("",!0))),ae(l,l.top<=l.ci.top,"stack overflow"))},a.exports.lua_copy=be,a.exports.lua_createtable=h,a.exports.lua_dump=function(l,s,_,c){rn(l,1);let m=l.stack[l.top-1];return m.ttisLclosure()?M(l,m.value.p,s,_,c):1},a.exports.lua_error=function(l){rn(l,1),oe.luaG_errormsg(l)},a.exports.lua_gc=function(){},a.exports.lua_getallocf=function(){return console.warn("lua_getallocf is not available"),0},a.exports.lua_getextraspace=function(){return console.warn("lua_getextraspace is not available"),0},a.exports.lua_getfield=function(l,s,_){return o(l,le(l,s),_)},a.exports.lua_getglobal=function(l,s){return o(l,mn.luaH_getint(l.l_G.l_registry.value,H),s)},a.exports.lua_geti=function(l,s,_){let c=le(l,s);return kn(_),l.stack[l.top]=new ee(D,_),Te(l),dn.luaV_gettable(l,c,l.stack[l.top-1],l.top-1),l.stack[l.top-1].ttnov()},a.exports.lua_getmetatable=function(l,s){let _,c=le(l,s),m=!1;switch(c.ttnov()){case ke:case Oe:_=c.value.metatable;break;default:_=l.l_G.mt[c.ttnov()]}return _!=null&&(l.stack[l.top]=new ee(ke,_),Te(l),m=!0),m},a.exports.lua_gettable=function(l,s){let _=le(l,s);return dn.luaV_gettable(l,_,l.stack[l.top-1],l.top-1),l.stack[l.top-1].ttnov()},a.exports.lua_gettop=function(l){return l.top-(l.ci.funcOff+1)},a.exports.lua_getupvalue=function(l,s,_){let c=q(0,le(l,s),_);if(c){let m=c.name,O=c.val;return T.pushobj2s(l,O),ae(l,l.top<=l.ci.top,"stack overflow"),m}return null},a.exports.lua_getuservalue=function(l,s){let _=le(l,s);ae(l,_.ttisfulluserdata(),"full userdata expected");let c=_.value.uservalue;return l.stack[l.top]=new ee(c.type,c.value),Te(l),l.stack[l.top-1].ttnov()},a.exports.lua_insert=function(l,s){G(l,s,1)},a.exports.lua_isboolean=function(l,s){return Le(l,s)===Q},a.exports.lua_iscfunction=function(l,s){let _=le(l,s);return _.ttislcf(_)||_.ttisCclosure()},a.exports.lua_isfunction=function(l,s){return Le(l,s)===$},a.exports.lua_isinteger=function(l,s){return le(l,s).ttisinteger()},a.exports.lua_islightuserdata=function(l,s){return Le(l,s)===$e},a.exports.lua_isnil=function(l,s){return Le(l,s)===Ke},a.exports.lua_isnone=function(l,s){return Le(l,s)===Xe},a.exports.lua_isnoneornil=function(l,s){return Le(l,s)<=0},a.exports.lua_isnumber=function(l,s){return dn.tonumber(le(l,s))!==!1},a.exports.lua_isproxy=function(l,s){let _=te.get(l);return!!_&&(s===null||s.l_G===_)},a.exports.lua_isstring=function(l,s){let _=le(l,s);return _.ttisstring()||dn.cvt2str(_)},a.exports.lua_istable=function(l,s){return le(l,s).ttistable()},a.exports.lua_isthread=function(l,s){return Le(l,s)===ge},a.exports.lua_isuserdata=function(l,s){let _=le(l,s);return _.ttisfulluserdata(_)||_.ttislightuserdata()},a.exports.lua_len=function(l,s){let _=le(l,s),c=new ee;dn.luaV_objlen(l,c,_),l.stack[l.top]=c,Te(l)},a.exports.lua_load=function(l,s,_,c,m){c=c?an(c):De,m!==null&&(m=an(m));let O=new Y(l,s,_),y=ze.luaD_protectedparser(l,O,c,m);if(y===tn){let ne=l.stack[l.top-1].value;if(ne.nupvalues>=1){let en=mn.luaH_getint(l.l_G.l_registry.value,H);ne.upvals[0].setfrom(en)}}return y},a.exports.lua_newtable=function(l){h(l)},a.exports.lua_newuserdata=function(l,s){let _=(function(c,m){return new T.Udata(c,m)})(l,s);return l.stack[l.top]=new T.TValue(Oe,_),Te(l),_.data},a.exports.lua_next=function(l,s){let _=le(l,s);return ae(l,_.ttistable(),"table expected"),l.stack[l.top]=new ee,mn.luaH_next(l,_.value,l.top-1)?(Te(l),1):(delete l.stack[l.top],delete l.stack[--l.top],0)},a.exports.lua_pcall=function(l,s,_,c){return Ve(l,s,_,c,0,null)},a.exports.lua_pcallk=Ve,a.exports.lua_pop=me,a.exports.lua_pushboolean=function(l,s){l.stack[l.top]=new ee(Q,!!s),Te(l)},a.exports.lua_pushcclosure=Pe,a.exports.lua_pushcfunction=Un,a.exports.lua_pushfstring=function(l,s,..._){return s=an(s),T.luaO_pushvfstring(l,s,_)},a.exports.lua_pushglobaltable=function(l){de(l,L,H)},a.exports.lua_pushinteger=function(l,s){kn(s),l.stack[l.top]=new ee(D,s),Te(l)},a.exports.lua_pushjsclosure=Nn,a.exports.lua_pushjsfunction=Mn,a.exports.lua_pushlightuserdata=function(l,s){l.stack[l.top]=new ee($e,s),Te(l)},a.exports.lua_pushliteral=function(l,s){if(s==null)l.stack[l.top]=new ee(Ke,null),l.top++;else{On(typeof s=="string");let _=Ae(l,s);T.pushsvalue2s(l,_),s=_.getstr()}return ae(l,l.top<=l.ci.top,"stack overflow"),s},a.exports.lua_pushlstring=function(l,s,_){let c;return kn(_),_===0?(s=sn("",!0),c=S(l,s)):(s=an(s),ae(l,s.length>=_,"invalid length to lua_pushlstring"),c=xe(l,s.subarray(0,_))),T.pushsvalue2s(l,c),ae(l,l.top<=l.ci.top,"stack overflow"),c.value},a.exports.lua_pushnil=function(l){l.stack[l.top]=new ee(Ke,null),Te(l)},a.exports.lua_pushnumber=function(l,s){On(typeof s=="number"),l.stack[l.top]=new ee(ln,s),Te(l)},a.exports.lua_pushstring=function(l,s){if(s==null)l.stack[l.top]=new ee(Ke,null),l.top++;else{let _=xe(l,an(s));T.pushsvalue2s(l,_),s=_.getstr()}return ae(l,l.top<=l.ci.top,"stack overflow"),s},a.exports.lua_pushthread=function(l){return l.stack[l.top]=new ee(ge,l),Te(l),l.l_G.mainthread===l},a.exports.lua_pushvalue=function(l,s){T.pushobj2s(l,le(l,s)),ae(l,l.top<=l.ci.top,"stack overflow")},a.exports.lua_pushvfstring=function(l,s,_){return s=an(s),T.luaO_pushvfstring(l,s,_)},a.exports.lua_rawequal=function(l,s,_){let c=le(l,s),m=le(l,_);return Je(c)&&Je(m)?dn.luaV_equalobj(null,c,m):0},a.exports.lua_rawget=function(l,s){let _=le(l,s);return ae(l,_.ttistable(_),"table expected"),T.setobj2s(l,l.top-1,mn.luaH_get(l,_.value,l.stack[l.top-1])),l.stack[l.top-1].ttnov()},a.exports.lua_rawgeti=de,a.exports.lua_rawgetp=function(l,s,_){let c=le(l,s);ae(l,c.ttistable(),"table expected");let m=new ee($e,_);return T.pushobj2s(l,mn.luaH_get(l,c.value,m)),ae(l,l.top<=l.ci.top,"stack overflow"),l.stack[l.top-1].ttnov()},a.exports.lua_rawlen=function(l,s){let _=le(l,s);switch(_.ttype()){case re:case nn:return _.vslen();case Oe:return _.value.len;case ke:return mn.luaH_getn(_.value);default:return 0}},a.exports.lua_rawset=function(l,s){rn(l,2);let _=le(l,s);ae(l,_.ttistable(),"table expected");let c=l.stack[l.top-2],m=l.stack[l.top-1];mn.luaH_setfrom(l,_.value,c,m),mn.invalidateTMcache(_.value),delete l.stack[--l.top],delete l.stack[--l.top]},a.exports.lua_rawseti=function(l,s,_){kn(_),rn(l,1);let c=le(l,s);ae(l,c.ttistable(),"table expected"),mn.luaH_setint(c.value,_,l.stack[l.top-1]),delete l.stack[--l.top]},a.exports.lua_rawsetp=function(l,s,_){rn(l,1);let c=le(l,s);ae(l,c.ttistable(),"table expected");let m=new ee($e,_),O=l.stack[l.top-1];mn.luaH_setfrom(l,c.value,m,O),delete l.stack[--l.top]},a.exports.lua_register=function(l,s,_){Un(l,_),ot(l,s)},a.exports.lua_remove=function(l,s){G(l,s,-1),me(l,1)},a.exports.lua_replace=function(l,s){be(l,-1,s),me(l,1)},a.exports.lua_rotate=G,a.exports.lua_setallocf=function(){return console.warn("lua_setallocf is not available"),0},a.exports.lua_setfield=function(l,s,_){Zn(l,le(l,s),_)},a.exports.lua_setglobal=ot,a.exports.lua_seti=function(l,s,_){kn(_),rn(l,1);let c=le(l,s);l.stack[l.top]=new ee(D,_),Te(l),dn.settable(l,c,l.stack[l.top-1],l.stack[l.top-2]),delete l.stack[--l.top],delete l.stack[--l.top]},a.exports.lua_setmetatable=function(l,s){let _;rn(l,1);let c=le(l,s);switch(l.stack[l.top-1].ttisnil()?_=null:(ae(l,l.stack[l.top-1].ttistable(),"table expected"),_=l.stack[l.top-1].value),c.ttnov()){case Oe:case ke:c.value.metatable=_;break;default:l.l_G.mt[c.ttnov()]=_}return delete l.stack[--l.top],!0},a.exports.lua_settable=function(l,s){rn(l,2);let _=le(l,s);dn.settable(l,_,l.stack[l.top-2],l.stack[l.top-1]),delete l.stack[--l.top],delete l.stack[--l.top]},a.exports.lua_settop=N,a.exports.lua_setupvalue=function(l,s,_){let c=le(l,s);rn(l,1);let m=q(0,c,_);if(m){let O=m.name;return m.val.setfrom(l.stack[l.top-1]),delete l.stack[--l.top],O}return null},a.exports.lua_setuservalue=function(l,s){rn(l,1);let _=le(l,s);ae(l,_.ttisfulluserdata(),"full userdata expected"),_.value.uservalue.setfrom(l.stack[l.top-1]),delete l.stack[--l.top]},a.exports.lua_status=function(l){return l.status},a.exports.lua_stringtonumber=function(l,s){let _=new ee,c=T.luaO_str2num(s,_);return c!==0&&(l.stack[l.top]=_,Te(l)),c},a.exports.lua_toboolean=function(l,s){return!le(l,s).l_isfalse()},a.exports.lua_tocfunction=function(l,s){let _=le(l,s);return _.ttislcf()||_.ttisCclosure()?_.value:null},a.exports.lua_todataview=function(l,s){let _=F(l,s);return new DataView(_.buffer,_.byteOffset,_.byteLength)},a.exports.lua_tointeger=function(l,s){let _=f(l,s);return _===!1?0:_},a.exports.lua_tointegerx=f,a.exports.lua_tojsstring=function(l,s){let _=le(l,s);if(!_.ttisstring()){if(!dn.cvt2str(_))return null;T.luaO_tostring(l,_)}return _.jsstring()},a.exports.lua_tolstring=F,a.exports.lua_tonumber=function(l,s){let _=I(l,s);return _===!1?0:_},a.exports.lua_tonumberx=I,a.exports.lua_topointer=function(l,s){let _=le(l,s);switch(_.ttype()){case ke:case se:case ce:case ve:case ge:case Oe:case $e:return _.value;default:return null}},a.exports.lua_toproxy=function(l,s){let _=le(l,s);return(function(c,m,O){let y=function(ne){ae(ne,ne instanceof g.lua_State&&c===ne.l_G,"must be from same global state"),ne.stack[ne.top]=new ee(m,O),Te(ne)};return te.set(y,c),y})(l.l_G,_.type,_.value)},a.exports.lua_tostring=J,a.exports.lua_tothread=function(l,s){let _=le(l,s);return _.ttisthread()?_.value:null},a.exports.lua_touserdata=function(l,s){let _=le(l,s);switch(_.ttnov()){case Oe:return _.value.data;case $e:return _.value;default:return null}},a.exports.lua_type=Le,a.exports.lua_typename=function(l,s){return ae(l,Xe<=s&&s<B,"invalid tag"),pn.ttypename(s)},a.exports.lua_upvalueid=function(l,s,_){let c=le(l,s);switch(c.ttype()){case se:{let m=vn(l,s,_);return m.f.upvals[m.i]}case ce:{let m=c.value;return ae(l,(0|_)===_&&_>0&&_<=m.nupvalues,"invalid upvalue index"),m.upvalue[_-1]}default:return ae(l,!1,"closure expected"),null}},a.exports.lua_upvaluejoin=function(l,s,_,c,m){let O=vn(l,s,_),y=vn(l,c,m),ne=y.f.upvals[y.i];O.f.upvals[O.i]=ne},a.exports.lua_version=function(l){return l===null?w:l.l_G.version},a.exports.lua_xmove=function(l,s,_){if(l!==s){rn(l,_),ae(l,l.l_G===s.l_G,"moving among independent states"),ae(l,s.ci.top-s.top>=_,"stack overflow"),l.top-=_;for(let c=0;c<_;c++)s.stack[s.top]=new T.TValue,T.setobj2s(s,s.top,l.stack[l.top+c]),delete l.stack[l.top+c],s.top++}}},function(a,z,d){const{lua_assert:k}=d(4),v=function(P){let R=P.reader(P.L,P.data);if(R===null)return-1;k(R instanceof Uint8Array,"Should only load binary of array of bytes");let C=R.length;return C===0?-1:(P.buffer=R,P.off=0,P.n=C-1,P.buffer[P.off++])};a.exports.EOZ=-1,a.exports.luaZ_buffer=function(P){return P.buffer.subarray(0,P.n)},a.exports.luaZ_buffremove=function(P,R){P.n-=R},a.exports.luaZ_fill=v,a.exports.luaZ_read=function(P,R,C,j){for(;j;){if(P.n===0){if(v(P)===-1)return j;P.n++,P.off--}let L=j<=P.n?j:P.n;for(let H=0;H<L;H++)R[C++]=P.buffer[P.off++];P.n-=L,P.n===0&&(P.buffer=null),j-=L}return 0},a.exports.luaZ_resetbuffer=function(P){P.n=0},a.exports.luaZ_resizebuffer=function(P,R,C){let j=new Uint8Array(C);R.buffer&&j.set(R.buffer),R.buffer=j},a.exports.MBuffer=class{constructor(){this.buffer=null,this.n=0}},a.exports.ZIO=class{constructor(P,R,C){this.L=P,k(typeof R=="function","ZIO requires a reader"),this.reader=R,this.data=C,this.n=0,this.buffer=null,this.off=0}zgetc(){return this.n-- >0?this.buffer[this.off++]:v(this)}}},function(a,z,d){const{constant_types:{LUA_TBOOLEAN:k,LUA_TLNGSTR:v},thread_status:{LUA_ERRSYNTAX:P},to_luastring:R}=d(1),{LUA_MINBUFFER:C,MAX_INT:j,lua_assert:L}=d(4),H=d(11),w=d(8),{lisdigit:B,lislalnum:Q,lislalpha:ce,lisspace:$,lisxdigit:ve}=d(22),se=d(6),{luaS_bless:$e,luaS_hash:nn,luaS_hashlongstr:Ke,luaS_new:Xe}=d(10),ln=d(9),{EOZ:D,luaZ_buffer:re,luaZ_buffremove:ke,luaZ_resetbuffer:ge,luaZ_resizebuffer:Oe}=d(19),tn=R("_ENV",!0),an={TK_AND:257,TK_BREAK:258,TK_DO:259,TK_ELSE:260,TK_ELSEIF:261,TK_END:262,TK_FALSE:263,TK_FOR:264,TK_FUNCTION:265,TK_GOTO:266,TK_IF:267,TK_IN:268,TK_LOCAL:269,TK_NIL:270,TK_NOT:271,TK_OR:272,TK_REPEAT:273,TK_RETURN:274,TK_THEN:275,TK_TRUE:276,TK_UNTIL:277,TK_WHILE:278,TK_IDIV:279,TK_CONCAT:280,TK_DOTS:281,TK_EQ:282,TK_GE:283,TK_LE:284,TK_NE:285,TK_SHL:286,TK_SHR:287,TK_DBCOLON:288,TK_EOS:289,TK_FLT:290,TK_INT:291,TK_NAME:292,TK_STRING:293},sn=["and","break","do","else","elseif","end","false","for","function","goto","if","in","local","nil","not","or","repeat","return","then","true","until","while","//","..","...","==",">=","<=","~=","<<",">>","::","<eof>","<number>","<integer>","<name>","<string>"].map((N,me)=>R(N));class ae{constructor(){this.r=NaN,this.i=NaN,this.ts=null}}class oe{constructor(){this.token=NaN,this.seminfo=new ae}}const ze=function(N,me){let He=N.buff;if(He.n+1>He.buffer.length){He.buffer.length>=j/2&&mn(N,R("lexical element too long",!0),0);let G=2*He.buffer.length;Oe(N.L,He,G)}He.buffer[He.n++]=me<0?255+me+1:me},M=function(N,me){if(me<257)return se.luaO_pushfstring(N.L,R("'%c'",!0),me);{let He=sn[me-257];return me<289?se.luaO_pushfstring(N.L,R("'%s'",!0),He):He}},Ce=function(N){return N.current===10||N.current===13},T=function(N){N.current=N.z.zgetc()},g=function(N){ze(N,N.current),T(N)},S=new se.TValue(k,!0),xe=function(N,me){let He=N.L,G=Xe(He,me),be=N.h.strong.get(Ke(G));if(be)G=be.key.tsvalue();else{let Pe=new se.TValue(v,G);ln.luaH_setfrom(He,N.h,Pe,S)}return G},Ae=function(N){let me=N.current;L(Ce(N)),T(N),Ce(N)&&N.current!==me&&T(N),++N.linenumber>=j&&mn(N,R("chunk has too many lines",!0),0)},pn=function(N,me){return N.current===me&&(T(N),!0)},Ze=function(N,me){return(N.current===me[0].charCodeAt(0)||N.current===me[1].charCodeAt(0))&&(g(N),!0)},dn=function(N,me){let He="Ee",G=N.current;for(L(B(N.current)),g(N),G===48&&Ze(N,"xX")&&(He="Pp");;)if(Ze(N,He)&&Ze(N,"-+"),ve(N.current))g(N);else{if(N.current!==46)break;g(N)}let be=new se.TValue;return se.luaO_str2num(re(N.buff),be)===0&&mn(N,R("malformed number",!0),290),be.ttisinteger()?(me.i=be.value,291):(L(be.ttisfloat()),me.r=be.value,290)},mn=function(N,me,He){me=H.luaG_addinfo(N.L,me,N.source,N.linenumber),He&&se.luaO_pushfstring(N.L,R("%s near %s"),me,(function(G,be){switch(be){case 292:case 293:case 290:case 291:return se.luaO_pushfstring(G.L,R("'%s'",!0),re(G.buff));default:return M(G,be)}})(N,He)),w.luaD_throw(N.L,P)},Y=function(N){let me=0,He=N.current;for(L(He===91||He===93),g(N);N.current===61;)g(N),me++;return N.current===He?me:-me-1},ee=function(N,me,He){let G=N.linenumber;g(N),Ce(N)&&Ae(N);let be=!1;for(;!be;)switch(N.current){case D:mn(N,R(`unfinished long ${me?"string":"comment"} (starting at line ${G})`),289);break;case 93:Y(N)===He&&(g(N),be=!0);break;case 10:case 13:ze(N,10),Ae(N),me||ge(N.buff);break;default:me?g(N):T(N)}me&&(me.ts=xe(N,N.buff.buffer.subarray(2+He,N.buff.n-(2+He))))},Ie=function(N,me,He){me||(N.current!==D&&g(N),mn(N,He,293))},Te=function(N){return g(N),Ie(N,ve(N.current),R("hexadecimal digit expected",!0)),se.luaO_hexavalue(N.current)},rn=function(N){let me=Te(N);return me=(me<<4)+Te(N),ke(N.buff,2),me},On=function(N){let me=new Uint8Array(se.UTF8BUFFSZ),He=se.luaO_utf8esc(me,(function(G){let be=4;g(G),Ie(G,G.current===123,R("missing '{'",!0));let Pe=Te(G);for(g(G);ve(G.current);)be++,Pe=(Pe<<4)+se.luaO_hexavalue(G.current),Ie(G,Pe<=1114111,R("UTF-8 value too large",!0)),g(G);return Ie(G,G.current===125,R("missing '}'",!0)),T(G),ke(G.buff,be),Pe})(N));for(;He>0;He--)ze(N,me[se.UTF8BUFFSZ-He])},kn=function(N){let me,He=0;for(me=0;me<3&&B(N.current);me++)He=10*He+N.current-48,g(N);return Ie(N,He<=255,R("decimal escape too large",!0)),ke(N.buff,me),He},Je=function(N,me,He){for(g(N);N.current!==me;)switch(N.current){case D:mn(N,R("unfinished string",!0),289);break;case 10:case 13:mn(N,R("unfinished string",!0),293);break;case 92:{let G,be;switch(g(N),N.current){case 97:be=7,G="read_save";break;case 98:be=8,G="read_save";break;case 102:be=12,G="read_save";break;case 110:be=10,G="read_save";break;case 114:be=13,G="read_save";break;case 116:be=9,G="read_save";break;case 118:be=11,G="read_save";break;case 120:be=rn(N),G="read_save";break;case 117:On(N),G="no_save";break;case 10:case 13:Ae(N),be=10,G="only_save";break;case 92:case 34:case 39:be=N.current,G="read_save";break;case D:G="no_save";break;case 122:for(ke(N.buff,1),T(N);$(N.current);)Ce(N)?Ae(N):T(N);G="no_save";break;default:Ie(N,B(N.current),R("invalid escape sequence",!0)),be=kn(N),G="only_save"}G==="read_save"&&T(N),G!=="read_save"&&G!=="only_save"||(ke(N.buff,1),ze(N,be));break}default:g(N)}g(N),He.ts=xe(N,N.buff.buffer.subarray(1,N.buff.n-1))},le=Object.create(null);sn.forEach((N,me)=>le[nn(N)]=me);const Ue=function(N,me){for(ge(N.buff);;)switch(L(typeof N.current=="number"),N.current){case 10:case 13:Ae(N);break;case 32:case 12:case 9:case 11:T(N);break;case 45:if(T(N),N.current!==45)return 45;if(T(N),N.current===91){let He=Y(N);if(ge(N.buff),He>=0){ee(N,null,He),ge(N.buff);break}}for(;!Ce(N)&&N.current!==D;)T(N);break;case 91:{let He=Y(N);return He>=0?(ee(N,me,He),293):(He!==-1&&mn(N,R("invalid long string delimiter",!0),293),91)}case 61:return T(N),pn(N,61)?282:61;case 60:return T(N),pn(N,61)?284:pn(N,60)?286:60;case 62:return T(N),pn(N,61)?283:pn(N,62)?287:62;case 47:return T(N),pn(N,47)?279:47;case 126:return T(N),pn(N,61)?285:126;case 58:return T(N),pn(N,58)?288:58;case 34:case 39:return Je(N,N.current,me),293;case 46:return g(N),pn(N,46)?pn(N,46)?281:280:B(N.current)?dn(N,me):46;case 48:case 49:case 50:case 51:case 52:case 53:case 54:case 55:case 56:case 57:return dn(N,me);case D:return 289;default:if(ce(N.current)){do g(N);while(Q(N.current));let He=xe(N,re(N.buff));me.ts=He;let G=le[Ke(He)];return G!==void 0&&G<=22?G+257:292}{let He=N.current;return T(N),He}}};a.exports.FIRST_RESERVED=257,a.exports.LUA_ENV=tn,a.exports.LexState=class{constructor(){this.current=NaN,this.linenumber=NaN,this.lastline=NaN,this.t=new oe,this.lookahead=new oe,this.fs=null,this.L=null,this.z=null,this.buff=null,this.h=null,this.dyd=null,this.source=null,this.envn=null}},a.exports.RESERVED=an,a.exports.isreserved=function(N){let me=le[Ke(N)];return me!==void 0&&me<=22},a.exports.luaX_lookahead=function(N){return L(N.lookahead.token===289),N.lookahead.token=Ue(N,N.lookahead.seminfo),N.lookahead.token},a.exports.luaX_newstring=xe,a.exports.luaX_next=function(N){N.lastline=N.linenumber,N.lookahead.token!==289?(N.t.token=N.lookahead.token,N.t.seminfo.i=N.lookahead.seminfo.i,N.t.seminfo.r=N.lookahead.seminfo.r,N.t.seminfo.ts=N.lookahead.seminfo.ts,N.lookahead.token=289):N.t.token=Ue(N,N.t.seminfo)},a.exports.luaX_setinput=function(N,me,He,G,be){me.t={token:0,seminfo:new ae},me.L=N,me.current=be,me.lookahead={token:289,seminfo:new ae},me.z=He,me.fs=null,me.linenumber=1,me.lastline=1,me.source=G,me.envn=$e(N,tn),Oe(N,me.buff,C)},a.exports.luaX_syntaxerror=function(N,me){mn(N,me,N.t.token)},a.exports.luaX_token2str=M,a.exports.luaX_tokens=sn},function(a,z,d){const{lua:k,lauxlib:v,lualib:P,to_luastring:R}=d(0),{LUA_MULTRET:C,LUA_OK:j,LUA_REGISTRYINDEX:L,LUA_RIDX_MAINTHREAD:H,LUA_TBOOLEAN:w,LUA_TFUNCTION:B,LUA_TLIGHTUSERDATA:Q,LUA_TNIL:ce,LUA_TNONE:$,LUA_TNUMBER:ve,LUA_TSTRING:se,LUA_TTABLE:$e,LUA_TTHREAD:nn,LUA_TUSERDATA:Ke,lua_atnativeerror:Xe,lua_call:ln,lua_getfield:D,lua_gettable:re,lua_gettop:ke,lua_isnil:ge,lua_isproxy:Oe,lua_newuserdata:tn,lua_pcall:an,lua_pop:sn,lua_pushboolean:ae,lua_pushcfunction:oe,lua_pushinteger:ze,lua_pushlightuserdata:M,lua_pushliteral:Ce,lua_pushnil:T,lua_pushnumber:g,lua_pushstring:S,lua_pushvalue:xe,lua_rawgeti:Ae,lua_rawgetp:pn,lua_rawsetp:Ze,lua_rotate:dn,lua_setfield:mn,lua_settable:Y,lua_settop:ee,lua_toboolean:Ie,lua_tojsstring:Te,lua_tonumber:rn,lua_toproxy:On,lua_tothread:kn,lua_touserdata:Je,lua_type:le}=k,{luaL_argerror:Ue,luaL_checkany:N,luaL_checkoption:me,luaL_checkstack:He,luaL_checkudata:G,luaL_error:be,luaL_getmetafield:Pe,luaL_newlib:Nn,luaL_newmetatable:Un,luaL_requiref:Mn,luaL_setfuncs:Zn,luaL_setmetatable:ot,luaL_testudata:o,luaL_tolstring:de}=v,{luaopen_base:h}=P,q=typeof window<"u"?window:typeof WorkerGlobalScope<"u"&&self instanceof WorkerGlobalScope?self:(0,eval)("this");let F,J,f;if(typeof Reflect<"u")F=Reflect.apply,J=Reflect.construct,f=Reflect.deleteProperty;else{const U=Function.apply,Me=Function.bind;F=function(fe,yn,Dn){return U.call(fe,yn,Dn)},J=function(fe,yn){switch(yn.length){case 0:return new fe;case 1:return new fe(yn[0]);case 2:return new fe(yn[0],yn[1]);case 3:return new fe(yn[0],yn[1],yn[2]);case 4:return new fe(yn[0],yn[1],yn[2],yn[3])}let Dn=[null];return Dn.push.apply(Dn,yn),new(Me.apply(fe,Dn))},f=Function("t","k","delete t[k]")}const I=String.prototype.concat.bind(""),te=function(U){return typeof U=="object"?U!==null:typeof U=="function"},Ee=R("js object"),Le=function(U,Me){let fe=o(U,Me,Ee);return fe?fe.data:void 0},De=function(U,Me){return G(U,Me,Ee).data},qe=function(U,Me){tn(U).data=Me,ot(U,Ee)},Fe=function(U){Ae(U,L,H);let Me=kn(U,-1);return sn(U,1),Me},Ve=new WeakMap,vn=function(U,Me){switch(typeof Me){case"undefined":T(U);break;case"number":g(U,Me);break;case"string":S(U,R(Me));break;case"boolean":ae(U,Me);break;case"symbol":M(U,Me);break;case"function":if(Oe(Me,U)){Me(U);break}case"object":if(Me===null){if(pn(U,L,null)!==Ke)throw Error("js library not loaded into lua_State");break}default:{let fe=Ve.get(Fe(U));if(!fe)throw Error("js library not loaded into lua_State");let yn=fe.get(Me);yn?yn(U):(qe(U,Me),yn=On(U,-1),fe.set(Me,yn))}}},l=function(U){let Me=Je(U,1);return vn(U,Me),1},s=function(U,Me){switch(le(U,Me)){case $:case ce:return;case w:return Ie(U,Me);case Q:return Je(U,Me);case ve:return rn(U,Me);case se:return Te(U,Me);case Ke:{let fe=Le(U,Me);if(fe!==void 0)return fe}case $e:case B:case nn:default:return Kn(U,On(U,Me))}},_=function(U,Me){let fe=an(U,Me,1,0),yn=s(U,-1);switch(sn(U,1),fe){case j:return yn;default:throw yn}},c=function(U,Me,fe,yn,Dn){if(!te(yn))throw new TypeError("`args` argument must be an object");let Pn=+yn.length;Pn>=0||(Pn=0),He(U,2+Pn,null);let In=ke(U);Me(U),vn(U,fe);for(let $n=0;$n<Pn;$n++)vn(U,yn[$n]);switch(an(U,1+Pn,Dn,0)){case j:{let $n=ke(U)-In,ht=new Array($n);for(let Fn=0;Fn<$n;Fn++)ht[Fn]=s(U,In+Fn+1);return ee(U,In),ht}default:{let $n=s(U,-1);throw ee(U,In),$n}}},m=function(U){return re(U,1),1},O=function(U,Me,fe){return He(U,3,null),oe(U,m),Me(U),vn(U,fe),_(U,2)},y=function(U,Me,fe){switch(He(U,3,null),oe(U,m),Me(U),vn(U,fe),an(U,2,1,0)){case j:{let yn=ge(U,-1);return sn(U,1),!yn}default:{let yn=s(U,-1);throw sn(U,1),yn}}},ne=function(U,Me,fe,yn){switch(He(U,4,null),oe(U,function(Dn){return Y(Dn,1),0}),Me(U),vn(U,fe),vn(U,yn),an(U,3,0,0)){case j:return;default:{let Dn=s(U,-1);throw sn(U,1),Dn}}},en=function(U,Me,fe){switch(He(U,4,null),oe(U,function(yn){return Y(yn,1),0}),Me(U),vn(U,fe),T(U),an(U,3,0,0)){case j:return;default:{let yn=s(U,-1);throw sn(U,1),yn}}},gn=function(U,Me){return He(U,2,null),oe(U,function(fe){return de(fe,1),1}),Me(U),_(U,1)},Bn=function(){let U=this.L;He(U,3,null);let Me=ke(U);switch(this.iter(U),this.state(U),this.last(U),an(U,2,C,0)){case j:{let fe;if(this.last=On(U,Me+1),ge(U,-1))fe={done:!0,value:void 0};else{let yn=ke(U)-Me,Dn=new Array(yn);for(let Pn=0;Pn<yn;Pn++)Dn[Pn]=s(U,Me+Pn+1);fe={done:!1,value:Dn}}return ee(U,Me),fe}default:{let fe=s(U,-1);throw sn(U,1),fe}}},Kn=function(U,Me){const fe=Fe(U);let yn=function(){return c(fe,Me,this,arguments,1)[0]};yn.apply=function(Pn,In){return c(fe,Me,Pn,In,1)[0]},yn.invoke=function(Pn,In){return c(fe,Me,Pn,In,C)},yn.get=function(Pn){return O(fe,Me,Pn)},yn.has=function(Pn){return y(fe,Me,Pn)},yn.set=function(Pn,In){return ne(fe,Me,Pn,In)},yn.delete=function(Pn){return en(fe,Me,Pn)},yn.toString=function(){return gn(fe,Me)},typeof Symbol=="function"&&(yn[Symbol.toStringTag]="Fengari object",yn[Symbol.iterator]=function(){return(function(Pn,In){switch(He(Pn,1,null),oe(Pn,function($n){return Mn($n,R("_G"),h,0),D($n,-1,R("pairs")),In($n),ln($n,1,3),3}),an(Pn,0,3,0)){case j:{let $n=On(Pn,-3),ht=On(Pn,-2),Fn=On(Pn,-1);return sn(Pn,3),{L:Pn,iter:$n,state:ht,last:Fn,next:Bn}}default:{let $n=s(Pn,-1);throw sn(Pn,1),$n}}})(fe,Me)},Symbol.toPrimitive&&(yn[Symbol.toPrimitive]=function(Pn){if(Pn==="string")return gn(fe,Me)}));let Dn=Ve.get(fe);if(!Dn)throw Error("js library not loaded into lua_State");return Dn.set(yn,Me),yn},pe={new:function(U){let Me=s(U,1),fe=ke(U)-1,yn=new Array(fe);for(let Dn=0;Dn<fe;Dn++)yn[Dn]=s(U,Dn+2);return vn(U,J(Me,yn)),1},tonumber:function(U){let Me=s(U,1);return g(U,+Me),1},tostring:function(U){let Me=s(U,1);return Ce(U,I(Me)),1},instanceof:function(U){let Me=s(U,1),fe=s(U,2);return ae(U,Me instanceof fe),1},typeof:function(U){let Me=s(U,1);return Ce(U,typeof Me),1}};if(typeof Symbol=="function"&&Symbol.iterator){const U=function(fe,yn){let Dn=De(fe,yn),Pn=Dn[Symbol.iterator];Pn||Ue(fe,yn,R("object not iterable"));let In=F(Pn,Dn,[]);return te(In)||Ue(fe,yn,R("Result of the Symbol.iterator method is not an object")),In},Me=function(fe){let yn=s(fe,1).next();return yn.done?0:(vn(fe,yn.value),1)};pe.of=function(fe){let yn=U(fe,1);return oe(fe,Me),vn(fe,yn),2}}if(typeof Proxy=="function"&&typeof Symbol=="function"){const U=Symbol("lua_State"),Me=Symbol("fengari-proxy"),fe={apply:function(Fn,Jn,Vn){return c(Fn[U],Fn[Me],Jn,Vn,1)[0]},construct:function(Fn,Jn){let Vn=Fn[U],ut=Fn[Me],it=Jn.length;He(Vn,2+it,null),ut(Vn);let Ct=ke(Vn);if(Pe(Vn,Ct,R("construct"))===ce)throw sn(Vn,1),new TypeError("not a constructor");dn(Vn,Ct,1);for(let pt=0;pt<it;pt++)vn(Vn,Jn[pt]);return _(Vn,1+it)},defineProperty:function(Fn,Jn,Vn){let ut=Fn[U],it=Fn[Me];return He(ut,4,null),it(ut),Pe(ut,-1,R("defineProperty"))===ce?(sn(ut,1),!1):(dn(ut,-2,1),vn(ut,Jn),vn(ut,Vn),_(ut,3))},deleteProperty:function(Fn,Jn){return en(Fn[U],Fn[Me],Jn)},get:function(Fn,Jn){return O(Fn[U],Fn[Me],Jn)},getOwnPropertyDescriptor:function(Fn,Jn){let Vn=Fn[U],ut=Fn[Me];if(He(Vn,3,null),ut(Vn),Pe(Vn,-1,R("getOwnPropertyDescriptor"))!==ce)return dn(Vn,-2,1),vn(Vn,Jn),_(Vn,2);sn(Vn,1)},getPrototypeOf:function(Fn){let Jn=Fn[U],Vn=Fn[Me];return He(Jn,2,null),Vn(Jn),Pe(Jn,-1,R("getPrototypeOf"))===ce?(sn(Jn,1),null):(dn(Jn,-2,1),_(Jn,1))},has:function(Fn,Jn){return y(Fn[U],Fn[Me],Jn)},ownKeys:function(Fn){let Jn=Fn[U],Vn=Fn[Me];if(He(Jn,2,null),Vn(Jn),Pe(Jn,-1,R("ownKeys"))===ce)throw sn(Jn,1),Error("ownKeys unknown for fengari object");return dn(Jn,-2,1),_(Jn,1)},set:function(Fn,Jn,Vn){return ne(Fn[U],Fn[Me],Jn,Vn),!0},setPrototypeOf:function(Fn,Jn){let Vn=Fn[U],ut=Fn[Me];return He(Vn,3,null),ut(Vn),Pe(Vn,-1,R("setPrototypeOf"))===ce?(sn(Vn,1),!1):(dn(Vn,-2,1),vn(Vn,Jn),_(Vn,2))}},yn=function(){let Fn=(function(){}).bind();return delete Fn.length,delete Fn.name,Fn},Dn=Function("return ()=>void 0;"),Pn=function(){let Fn=Dn();return delete Fn.length,delete Fn.name,Fn},In=function(Fn,Jn,Vn){const ut=Fe(Fn);let it;switch(Vn){case"function":it=yn();break;case"arrow_function":it=Pn();break;case"object":it={};break;default:throw TypeError("invalid type to createproxy")}return it[Me]=Jn,it[U]=ut,new Proxy(it,fe)},$n=["function","arrow_function","object"],ht=$n.map(Fn=>R(Fn));pe.createproxy=function(Fn){N(Fn,1);let Jn=$n[me(Fn,2,ht[0],ht)],Vn=In(Fn,On(Fn,1),Jn);return vn(Fn,Vn),1}}let fn={__index:function(U){let Me=De(U,1),fe=s(U,2);return vn(U,Me[fe]),1},__newindex:function(U){let Me=De(U,1),fe=s(U,2),yn=s(U,3);return yn===void 0?f(Me,fe):Me[fe]=yn,0},__tostring:function(U){let Me=De(U,1),fe=I(Me);return S(U,R(fe)),1},__call:function(U){let Me,fe=De(U,1),yn=ke(U)-1,Dn=new Array(Math.max(0,yn-1));if(yn>0&&(Me=s(U,2),yn-- >0))for(let Pn=0;Pn<yn;Pn++)Dn[Pn]=s(U,Pn+3);return vn(U,F(fe,Me,Dn)),1},__pairs:function(U){let Me,fe,yn,Dn,Pn=De(U,1);if(typeof Symbol!="function"||(Me=Pn[Symbol.for("__pairs")])===void 0)fe=function(In){if(this.index>=this.keys.length)return;let $n=this.keys[this.index++];return[$n,this.object[$n]]},yn={object:Pn,keys:Object.keys(Pn),index:0};else{let In=F(Me,Pn,[]);In===void 0&&be(U,R("bad '__pairs' result (object with keys 'iter', 'state', 'first' expected)")),(fe=In.iter)===void 0&&be(U,R("bad '__pairs' result (object.iter is missing)")),yn=In.state,Dn=In.first}return oe(U,function(){let In=s(U,1),$n=s(U,2),ht=F(fe,In,[$n]);if(ht===void 0)return 0;Array.isArray(ht)||be(U,R("bad iterator result (Array or undefined expected)")),He(U,ht.length,null);for(let Fn=0;Fn<ht.length;Fn++)vn(U,ht[Fn]);return ht.length}),vn(U,yn),vn(U,Dn),3},__len:function(U){let Me,fe,yn=De(U,1);return fe=typeof Symbol!="function"||(Me=yn[Symbol.for("__len")])===void 0?yn.length:F(Me,yn,[]),vn(U,fe),1}};a.exports.FENGARI_INTEROP_VERSION="0.1",a.exports.FENGARI_INTEROP_VERSION_NUM=1,a.exports.FENGARI_INTEROP_RELEASE="0.1.2",a.exports.checkjs=De,a.exports.testjs=Le,a.exports.pushjs=qe,a.exports.push=vn,a.exports.tojs=s,a.exports.luaopen_js=function(U){return Ve.set(Fe(U),new WeakMap),Xe(U,l),Nn(U,pe),Ce(U,"0.1"),mn(U,-2,R("_VERSION")),ze(U,1),mn(U,-2,R("_VERSION_NUM")),Ce(U,"0.1.2"),mn(U,-2,R("_RELEASE")),Un(U,Ee),Zn(U,fn,0),sn(U,1),qe(U,null),xe(U,-1),Ze(U,L,null),mn(U,-2,R("null")),vn(U,q),mn(U,-2,R("global")),1}},function(a,z,d){const{luastring_of:k}=d(1),v=k(0,0,0,0,0,0,0,0,0,0,8,8,8,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,22,22,22,22,22,22,22,22,22,22,4,4,4,4,4,4,4,21,21,21,21,21,21,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,4,4,4,4,5,4,21,21,21,21,21,21,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);a.exports.lisdigit=function(P){return(2&v[P+1])!=0},a.exports.lislalnum=function(P){return(3&v[P+1])!=0},a.exports.lislalpha=function(P){return(1&v[P+1])!=0},a.exports.lisprint=function(P){return(4&v[P+1])!=0},a.exports.lisspace=function(P){return(8&v[P+1])!=0},a.exports.lisxdigit=function(P){return(16&v[P+1])!=0}},function(a,z,d){const{LUA_MULTRET:k,to_luastring:v}=d(1),{BinOpr:{OPR_ADD:P,OPR_AND:R,OPR_BAND:C,OPR_BOR:j,OPR_BXOR:L,OPR_CONCAT:H,OPR_DIV:w,OPR_EQ:B,OPR_GE:Q,OPR_GT:ce,OPR_IDIV:$,OPR_LE:ve,OPR_LT:se,OPR_MOD:$e,OPR_MUL:nn,OPR_NE:Ke,OPR_NOBINOPR:Xe,OPR_OR:ln,OPR_POW:D,OPR_SHL:re,OPR_SHR:ke,OPR_SUB:ge},UnOpr:{OPR_BNOT:Oe,OPR_LEN:tn,OPR_MINUS:an,OPR_NOT:sn,OPR_NOUNOPR:ae},NO_JUMP:oe,getinstruction:ze,luaK_checkstack:M,luaK_codeABC:Ce,luaK_codeABx:T,luaK_codeAsBx:g,luaK_codek:S,luaK_concat:xe,luaK_dischargevars:Ae,luaK_exp2RK:pn,luaK_exp2anyreg:Ze,luaK_exp2anyregup:dn,luaK_exp2nextreg:mn,luaK_exp2val:Y,luaK_fixline:ee,luaK_getlabel:Ie,luaK_goiffalse:Te,luaK_goiftrue:rn,luaK_indexed:On,luaK_infix:kn,luaK_intK:Je,luaK_jump:le,luaK_jumpto:Ue,luaK_nil:N,luaK_patchclose:me,luaK_patchlist:He,luaK_patchtohere:G,luaK_posfix:be,luaK_prefix:Pe,luaK_reserveregs:Nn,luaK_ret:Un,luaK_self:Mn,luaK_setlist:Zn,luaK_setmultret:ot,luaK_setoneret:o,luaK_setreturns:de,luaK_storevar:h,luaK_stringK:q}=d(35),F=d(8),J=d(13),f=d(20),{LUAI_MAXCCALLS:I,MAX_INT:te,lua_assert:Ee}=d(4),Le=d(6),{OpCodesI:{OP_CALL:De,OP_CLOSURE:qe,OP_FORLOOP:Fe,OP_FORPREP:Ve,OP_GETUPVAL:vn,OP_MOVE:l,OP_NEWTABLE:s,OP_SETTABLE:_,OP_TAILCALL:c,OP_TFORCALL:m,OP_TFORLOOP:O,OP_VARARG:y},LFIELDS_PER_FLUSH:ne,SETARG_B:en,SETARG_C:gn,SET_OPCODE:Bn}=d(16),{luaS_eqlngstr:Kn,luaS_new:pe,luaS_newliteral:fn}=d(10),U=d(9),Me=J.Proto,fe=f.RESERVED,yn=function(b){return b===In.VCALL||b===In.VVARARG},Dn=function(b,Z){return Kn(b,Z)};class Pn{constructor(){this.previous=null,this.firstlabel=NaN,this.firstgoto=NaN,this.nactvar=NaN,this.upval=NaN,this.isloop=NaN}}const In={VVOID:0,VNIL:1,VTRUE:2,VFALSE:3,VK:4,VKFLT:5,VKINT:6,VNONRELOC:7,VLOCAL:8,VUPVAL:9,VINDEXED:10,VJMP:11,VRELOCABLE:12,VCALL:13,VVARARG:14};class $n{constructor(){this.k=NaN,this.u={ival:NaN,nval:NaN,info:NaN,ind:{idx:NaN,t:NaN,vt:NaN}},this.t=NaN,this.f=NaN}to(Z){this.k=Z.k,this.u=Z.u,this.t=Z.t,this.f=Z.f}}class ht{constructor(){this.f=null,this.prev=null,this.ls=null,this.bl=null,this.pc=NaN,this.lasttarget=NaN,this.jpc=NaN,this.nk=NaN,this.np=NaN,this.firstlocal=NaN,this.nlocvars=NaN,this.nactvar=NaN,this.nups=NaN,this.freereg=NaN}}class Fn{constructor(){this.arr=[],this.n=NaN,this.size=NaN}}const Jn=function(b,Z){b.t.token=0,f.luaX_syntaxerror(b,Z)},Vn=function(b,Z){f.luaX_syntaxerror(b,Le.luaO_pushfstring(b.L,v("%s expected",!0),f.luaX_token2str(b,Z)))},ut=function(b,Z,Re,Qe){Z>Re&&(function(Ge,Se,hn){let Tn=Ge.ls.L,rt=Ge.f.linedefined,at=rt===0?v("main function",!0):Le.luaO_pushfstring(Tn,v("function at line %d",!0),rt),St=Le.luaO_pushfstring(Tn,v("too many %s (limit is %d) in %s",!0),hn,Se,at);f.luaX_syntaxerror(Ge.ls,St)})(b,Re,Qe)},it=function(b,Z){return b.t.token===Z&&(f.luaX_next(b),!0)},Ct=function(b,Z){b.t.token!==Z&&Vn(b,Z)},pt=function(b,Z){Ct(b,Z),f.luaX_next(b)},Dt=function(b,Z,Re){Z||f.luaX_syntaxerror(b,Re)},bt=function(b,Z,Re,Qe){it(b,Z)||(Qe===b.linenumber?Vn(b,Z):f.luaX_syntaxerror(b,Le.luaO_pushfstring(b.L,v("%s expected (to close %s at line %d)"),f.luaX_token2str(b,Z),f.luaX_token2str(b,Re),Qe)))},E=function(b){Ct(b,fe.TK_NAME);let Z=b.t.seminfo.ts;return f.luaX_next(b),Z},ie=function(b,Z,Re){b.f=b.t=oe,b.k=Z,b.u.info=Re},cn=function(b,Z,Re){ie(Z,In.VK,q(b.fs,Re))},on=function(b,Z){cn(b,Z,E(b))},An=function(b,Z){let Re=b.fs,Qe=b.dyd,Ge=(function(Se,hn){let Tn=Se.fs,rt=Tn.f;return rt.locvars[Tn.nlocvars]=new Le.LocVar,rt.locvars[Tn.nlocvars].varname=hn,Tn.nlocvars++})(b,Z);ut(Re,Qe.actvar.n+1-Re.firstlocal,200,v("local variables",!0)),Qe.actvar.arr[Qe.actvar.n]=new class{constructor(){this.idx=NaN}},Qe.actvar.arr[Qe.actvar.n].idx=Ge,Qe.actvar.n++},un=function(b,Z){An(b,f.luaX_newstring(b,v(Z,!0)))},_n=function(b,Z){let Re=b.ls.dyd.actvar.arr[b.firstlocal+Z].idx;return Ee(Re<b.nlocvars),b.f.locvars[Re]},We=function(b,Z){let Re=b.fs;for(Re.nactvar=Re.nactvar+Z;Z;Z--)_n(Re,Re.nactvar-Z).startpc=Re.pc},xn=function(b,Z,Re){let Qe=b.f;return ut(b,b.nups+1,J.MAXUPVAL,v("upvalues",!0)),Qe.upvalues[b.nups]={instack:Re.k===In.VLOCAL,idx:Re.u.info,name:Z},b.nups++},Sn=function(b,Z,Re,Qe){if(b===null)ie(Re,In.VVOID,0);else{let Ge=(function(Se,hn){for(let Tn=Se.nactvar-1;Tn>=0;Tn--)if(Dn(hn,_n(Se,Tn).varname))return Tn;return-1})(b,Z);if(Ge>=0)ie(Re,In.VLOCAL,Ge),Qe||(function(Se,hn){let Tn=Se.bl;for(;Tn.nactvar>hn;)Tn=Tn.previous;Tn.upval=1})(b,Ge);else{let Se=(function(hn,Tn){let rt=hn.f.upvalues;for(let at=0;at<hn.nups;at++)if(Dn(rt[at].name,Tn))return at;return-1})(b,Z);if(Se<0){if(Sn(b.prev,Z,Re,0),Re.k===In.VVOID)return;Se=xn(b,Z,Re)}ie(Re,In.VUPVAL,Se)}}},p=function(b,Z){let Re=E(b),Qe=b.fs;if(Sn(Qe,Re,Z,1),Z.k===In.VVOID){let Ge=new $n;Sn(Qe,b.envn,Z,1),Ee(Z.k!==In.VVOID),cn(b,Ge,Re),On(Qe,Z,Ge)}},X=function(b,Z,Re,Qe){let Ge=b.fs,Se=Z-Re;if(yn(Qe.k))++Se<0&&(Se=0),de(Ge,Qe,Se),Se>1&&Nn(Ge,Se-1);else if(Qe.k!==In.VVOID&&mn(Ge,Qe),Se>0){let hn=Ge.freereg;Nn(Ge,Se),N(Ge,hn,Se)}Re>Z&&(b.fs.freereg-=Re-Z)},K=function(b){let Z=b.L;++Z.nCcalls,ut(b.fs,Z.nCcalls,I,v("JS levels",!0))},ye=function(b){return b.L.nCcalls--},he=function(b,Z,Re){let Qe=b.fs,Ge=b.dyd.gt,Se=Ge.arr[Z];if(Ee(Dn(Se.name,Re.name)),Se.nactvar<Re.nactvar){let hn=_n(Qe,Se.nactvar).varname,Tn=Le.luaO_pushfstring(b.L,v("<goto %s> at line %d jumps into the scope of local '%s'"),Se.name.getstr(),Se.line,hn.getstr());Jn(b,Tn)}He(Qe,Se.pc,Re.pc);for(let hn=Z;hn<Ge.n-1;hn++)Ge.arr[hn]=Ge.arr[hn+1];Ge.n--},_e=function(b,Z){let Re=b.fs.bl,Qe=b.dyd,Ge=Qe.gt.arr[Z];for(let Se=Re.firstlabel;Se<Qe.label.n;Se++){let hn=Qe.label.arr[Se];if(Dn(hn.name,Ge.name))return Ge.nactvar>hn.nactvar&&(Re.upval||Qe.label.n>Re.firstlabel)&&me(b.fs,Ge.pc,hn.nactvar),he(b,Z,hn),!0}return!1},Ln=function(b,Z,Re,Qe,Ge){let Se=Z.n;return Z.arr[Se]=new class{constructor(){this.name=null,this.pc=NaN,this.line=NaN,this.nactvar=NaN}},Z.arr[Se].name=Re,Z.arr[Se].line=Qe,Z.arr[Se].nactvar=b.fs.nactvar,Z.arr[Se].pc=Ge,Z.n=Se+1,Se},Gn=function(b,Z){let Re=b.dyd.gt,Qe=b.fs.bl.firstgoto;for(;Qe<Re.n;)Dn(Re.arr[Qe].name,Z.name)?he(b,Qe,Z):Qe++},zn=function(b,Z,Re){Z.isloop=Re,Z.nactvar=b.nactvar,Z.firstlabel=b.ls.dyd.label.n,Z.firstgoto=b.ls.dyd.gt.n,Z.upval=0,Z.previous=b.bl,b.bl=Z,Ee(b.freereg===b.nactvar)},jn=function(b,Z,Re){Z.prev=b.fs,Z.ls=b,b.fs=Z,Z.pc=0,Z.lasttarget=0,Z.jpc=oe,Z.freereg=0,Z.nk=0,Z.np=0,Z.nups=0,Z.nlocvars=0,Z.nactvar=0,Z.firstlocal=b.dyd.actvar.n,Z.bl=null;let Qe=Z.f;Qe.source=b.source,Qe.maxstacksize=2,zn(Z,Re,!1)},A=function(b){let Z=b.bl,Re=b.ls;if(Z.previous&&Z.upval){let Qe=le(b);me(b,Qe,Z.nactvar),G(b,Qe)}Z.isloop&&(function(Qe){let Ge=fn(Qe.L,"break"),Se=Ln(Qe,Qe.dyd.label,Ge,0,Qe.fs.pc);Gn(Qe,Qe.dyd.label.arr[Se])})(Re),b.bl=Z.previous,(function(Qe,Ge){for(Qe.ls.dyd.actvar.n-=Qe.nactvar-Ge;Qe.nactvar>Ge;)_n(Qe,--Qe.nactvar).endpc=Qe.pc})(b,Z.nactvar),Ee(Z.nactvar===b.nactvar),b.freereg=b.nactvar,Re.dyd.label.n=Z.firstlabel,Z.previous?(function(Qe,Ge){let Se=Ge.firstgoto,hn=Qe.ls.dyd.gt;for(;Se<hn.n;){let Tn=hn.arr[Se];Tn.nactvar>Ge.nactvar&&(Ge.upval&&me(Qe,Tn.pc,Ge.nactvar),Tn.nactvar=Ge.nactvar),_e(Qe.ls,Se)||Se++}})(b,Z):Z.firstgoto<Re.dyd.gt.n&&(function(Qe,Ge){let Se=f.isreserved(Ge.name)?"<%s> at line %d not inside a loop":"no visible label '%s' for <goto> at line %d";Se=Le.luaO_pushfstring(Qe.L,v(Se),Ge.name.getstr(),Ge.line),Jn(Qe,Se)})(Re,Re.dyd.gt.arr[Z.firstgoto])},V=function(b){let Z=b.fs;Un(Z,0,0),A(Z),Ee(Z.bl===null),b.fs=Z.prev},Ne=function(b,Z){switch(b.t.token){case fe.TK_ELSE:case fe.TK_ELSEIF:case fe.TK_END:case fe.TK_EOS:return!0;case fe.TK_UNTIL:return Z;default:return!1}},wn=function(b){for(;!Ne(b,1);){if(b.t.token===fe.TK_RETURN)return void Dr(b);Dr(b)}},Wn=function(b,Z){let Re=b.fs,Qe=new $n;dn(Re,Z),f.luaX_next(b),on(b,Qe),On(Re,Z,Qe)},st=function(b,Z){f.luaX_next(b),pr(b,Z),Y(b.fs,Z),pt(b,93)},Et=function(b,Z){let Re=b.fs,Qe=b.fs.freereg,Ge=new $n,Se=new $n;b.t.token===fe.TK_NAME?(ut(Re,Z.nh,te,v("items in a constructor",!0)),on(b,Ge)):st(b,Ge),Z.nh++,pt(b,61);let hn=pn(Re,Ge);pr(b,Se),Ce(Re,_,Z.t.u.info,hn,pn(Re,Se)),Re.freereg=Qe},tr=function(b,Z){Z.v.k!==In.VVOID&&(mn(b,Z.v),Z.v.k=In.VVOID,Z.tostore===ne&&(Zn(b,Z.t.u.info,Z.na,Z.tostore),Z.tostore=0))},Ft=function(b,Z){pr(b,Z.v),ut(b.fs,Z.na,te,v("items in a constructor",!0)),Z.na++,Z.tostore++},Vt=function(b,Z){switch(b.t.token){case fe.TK_NAME:f.luaX_lookahead(b)!==61?Ft(b,Z):Et(b,Z);break;case 91:Et(b,Z);break;default:Ft(b,Z)}},Mt=function(b,Z){let Re=b.fs,Qe=b.linenumber,Ge=Ce(Re,s,0,0,0),Se=new class{constructor(){this.v=new $n,this.t=new $n,this.nh=NaN,this.na=NaN,this.tostore=NaN}};Se.na=Se.nh=Se.tostore=0,Se.t=Z,ie(Z,In.VRELOCABLE,Ge),ie(Se.v,In.VVOID,0),mn(b.fs,Z),pt(b,123);do{if(Ee(Se.v.k===In.VVOID||Se.tostore>0),b.t.token===125)break;tr(Re,Se),Vt(b,Se)}while(it(b,44)||it(b,59));bt(b,125,123,Qe),(function(hn,Tn){Tn.tostore!==0&&(yn(Tn.v.k)?(ot(hn,Tn.v),Zn(hn,Tn.t.u.info,Tn.na,k),Tn.na--):(Tn.v.k!==In.VVOID&&mn(hn,Tn.v),Zn(hn,Tn.t.u.info,Tn.na,Tn.tostore)))})(Re,Se),en(Re.f.code[Ge],Le.luaO_int2fb(Se.na)),gn(Re.f.code[Ge],Le.luaO_int2fb(Se.nh))},mt=function(b,Z,Re,Qe){let Ge=new ht,Se=new Pn;Ge.f=(function(hn){let Tn=hn.L,rt=new Me(Tn),at=hn.fs;return at.f.p[at.np++]=rt,rt})(b),Ge.f.linedefined=Qe,jn(b,Ge,Se),pt(b,40),Re&&(un(b,"self"),We(b,1)),(function(hn){let Tn=hn.fs,rt=Tn.f,at=0;if(rt.is_vararg=!1,hn.t.token!==41)do switch(hn.t.token){case fe.TK_NAME:An(hn,E(hn)),at++;break;case fe.TK_DOTS:f.luaX_next(hn),rt.is_vararg=!0;break;default:f.luaX_syntaxerror(hn,v("<name> or '...' expected",!0))}while(!rt.is_vararg&&it(hn,44));We(hn,at),rt.numparams=Tn.nactvar,Nn(Tn,Tn.nactvar)})(b),pt(b,41),wn(b),Ge.f.lastlinedefined=b.linenumber,bt(b,fe.TK_END,fe.TK_FUNCTION,Qe),(function(hn,Tn){let rt=hn.fs.prev;ie(Tn,In.VRELOCABLE,T(rt,qe,0,rt.np-1)),mn(rt,Tn)})(b,Z),V(b)},Xt=function(b,Z){let Re=1;for(pr(b,Z);it(b,44);)mn(b.fs,Z),pr(b,Z),Re++;return Re},fr=function(b,Z,Re){let Qe,Ge=b.fs,Se=new $n;switch(b.t.token){case 40:f.luaX_next(b),b.t.token===41?Se.k=In.VVOID:(Xt(b,Se),ot(Ge,Se)),bt(b,41,40,Re);break;case 123:Mt(b,Se);break;case fe.TK_STRING:cn(b,Se,b.t.seminfo.ts),f.luaX_next(b);break;default:f.luaX_syntaxerror(b,v("function arguments expected",!0))}Ee(Z.k===In.VNONRELOC);let hn=Z.u.info;yn(Se.k)?Qe=k:(Se.k!==In.VVOID&&mn(Ge,Se),Qe=Ge.freereg-(hn+1)),ie(Z,In.VCALL,Ce(Ge,De,hn,Qe+1,2)),ee(Ge,Re),Ge.freereg=hn+1},Ba=function(b,Z){let Re=b.fs,Qe=b.linenumber;for(!(function(Ge,Se){switch(Ge.t.token){case 40:{let hn=Ge.linenumber;return f.luaX_next(Ge),pr(Ge,Se),bt(Ge,41,40,hn),void Ae(Ge.fs,Se)}case fe.TK_NAME:return void p(Ge,Se);default:f.luaX_syntaxerror(Ge,v("unexpected symbol",!0))}})(b,Z);;)switch(b.t.token){case 46:Wn(b,Z);break;case 91:{let Ge=new $n;dn(Re,Z),st(b,Ge),On(Re,Z,Ge);break}case 58:{let Ge=new $n;f.luaX_next(b),on(b,Ge),Mn(Re,Z,Ge),fr(b,Z,Qe);break}case 40:case fe.TK_STRING:case 123:mn(Re,Z),fr(b,Z,Qe);break;default:return}},Fa=[{left:10,right:10},{left:10,right:10},{left:11,right:11},{left:11,right:11},{left:14,right:13},{left:11,right:11},{left:11,right:11},{left:6,right:6},{left:4,right:4},{left:5,right:5},{left:7,right:7},{left:7,right:7},{left:9,right:8},{left:3,right:3},{left:3,right:3},{left:3,right:3},{left:3,right:3},{left:3,right:3},{left:3,right:3},{left:2,right:2},{left:1,right:1}],Tr=function(b,Z,Re){K(b);let Qe=(function(Se){switch(Se){case fe.TK_NOT:return sn;case 45:return an;case 126:return Oe;case 35:return tn;default:return ae}})(b.t.token);if(Qe!==ae){let Se=b.linenumber;f.luaX_next(b),Tr(b,Z,12),Pe(b.fs,Qe,Z,Se)}else(function(Se,hn){switch(Se.t.token){case fe.TK_FLT:ie(hn,In.VKFLT,0),hn.u.nval=Se.t.seminfo.r;break;case fe.TK_INT:ie(hn,In.VKINT,0),hn.u.ival=Se.t.seminfo.i;break;case fe.TK_STRING:cn(Se,hn,Se.t.seminfo.ts);break;case fe.TK_NIL:ie(hn,In.VNIL,0);break;case fe.TK_TRUE:ie(hn,In.VTRUE,0);break;case fe.TK_FALSE:ie(hn,In.VFALSE,0);break;case fe.TK_DOTS:{let Tn=Se.fs;Dt(Se,Tn.f.is_vararg,v("cannot use '...' outside a vararg function",!0)),ie(hn,In.VVARARG,Ce(Tn,y,0,1,0));break}case 123:return void Mt(Se,hn);case fe.TK_FUNCTION:return f.luaX_next(Se),void mt(Se,hn,0,Se.linenumber);default:return void Ba(Se,hn)}f.luaX_next(Se)})(b,Z);let Ge=(function(Se){switch(Se){case 43:return P;case 45:return ge;case 42:return nn;case 37:return $e;case 94:return D;case 47:return w;case fe.TK_IDIV:return $;case 38:return C;case 124:return j;case 126:return L;case fe.TK_SHL:return re;case fe.TK_SHR:return ke;case fe.TK_CONCAT:return H;case fe.TK_NE:return Ke;case fe.TK_EQ:return B;case 60:return se;case fe.TK_LE:return ve;case 62:return ce;case fe.TK_GE:return Q;case fe.TK_AND:return R;case fe.TK_OR:return ln;default:return Xe}})(b.t.token);for(;Ge!==Xe&&Fa[Ge].left>Re;){let Se=new $n,hn=b.linenumber;f.luaX_next(b),kn(b.fs,Ge,Z);let Tn=Tr(b,Se,Fa[Ge].right);be(b.fs,Ge,Z,Se,hn),Ge=Tn}return ye(b),Ge},pr=function(b,Z){Tr(b,Z,0)},na=function(b){let Z=b.fs,Re=new Pn;zn(Z,Re,0),wn(b),A(Z)};class ta{constructor(){this.prev=null,this.v=new $n}}const Va=function(b,Z,Re){let Qe=new $n;if(Dt(b,(function(Ge){return In.VLOCAL<=Ge&&Ge<=In.VINDEXED})(Z.v.k),v("syntax error",!0)),it(b,44)){let Ge=new ta;Ge.prev=Z,Ba(b,Ge.v),Ge.v.k!==In.VINDEXED&&(function(Se,hn,Tn){let rt=Se.fs,at=rt.freereg,St=!1;for(;hn;hn=hn.prev)hn.v.k===In.VINDEXED&&(hn.v.u.ind.vt===Tn.k&&hn.v.u.ind.t===Tn.u.info&&(St=!0,hn.v.u.ind.vt=In.VLOCAL,hn.v.u.ind.t=at),Tn.k===In.VLOCAL&&hn.v.u.ind.idx===Tn.u.info&&(St=!0,hn.v.u.ind.idx=at));if(St){let Er=Tn.k===In.VLOCAL?l:vn;Ce(rt,Er,at,Tn.u.info,0),Nn(rt,1)}})(b,Z,Ge.v),ut(b.fs,Re+b.L.nCcalls,I,v("JS levels",!0)),Va(b,Ge,Re+1)}else{pt(b,61);let Ge=Xt(b,Qe);if(Ge===Re)return o(b.fs,Qe),void h(b.fs,Z.v,Qe);X(b,Re,Ge,Qe)}ie(Qe,In.VNONRELOC,b.fs.freereg-1),h(b.fs,Z.v,Qe)},yl=function(b){let Z=new $n;return pr(b,Z),Z.k===In.VNIL&&(Z.k=In.VFALSE),rn(b.fs,Z),Z.f},Pr=function(b,Z){let Re,Qe=b.linenumber;it(b,fe.TK_GOTO)?Re=E(b):(f.luaX_next(b),Re=fn(b.L,"break"));let Ge=Ln(b,b.dyd.gt,Re,Qe,Z);_e(b,Ge)},ra=function(b,Z,Re){let Qe,Ge=b.fs,Se=b.dyd.label;(function(hn,Tn,rt){for(let at=hn.bl.firstlabel;at<Tn.n;at++)if(Dn(rt,Tn.arr[at].name)){let St=Le.luaO_pushfstring(hn.ls.L,v("label '%s' already defined on line %d",!0),rt.getstr(),Tn.arr[at].line);Jn(hn.ls,St)}})(Ge,Se,Z),pt(b,fe.TK_DBCOLON),Qe=Ln(b,Se,Z,Re,Ie(Ge)),(function(hn){for(;hn.t.token===59||hn.t.token===fe.TK_DBCOLON;)Dr(hn)})(b),Ne(b,0)&&(Se.arr[Qe].nactvar=Ge.bl.nactvar),Gn(b,Se.arr[Qe])},xr=function(b){let Z=new $n;return pr(b,Z),mn(b.fs,Z),Ee(Z.k===In.VNONRELOC),Z.u.info},aa=function(b,Z,Re,Qe,Ge){let Se,hn=new Pn,Tn=b.fs;We(b,3),pt(b,fe.TK_DO);let rt=Ge?g(Tn,Ve,Z,oe):le(Tn);zn(Tn,hn,0),We(b,Qe),Nn(Tn,Qe),na(b),A(Tn),G(Tn,rt),Ge?Se=g(Tn,Fe,Z,oe):(Ce(Tn,m,Z,0,Qe),ee(Tn,Re),Se=g(Tn,O,Z+2,oe)),He(Tn,Se,rt+1),ee(Tn,Re)},go=function(b,Z){let Re=b.fs,Qe=new Pn;zn(Re,Qe,1),f.luaX_next(b);let Ge=E(b);switch(b.t.token){case 61:(function(Se,hn,Tn){let rt=Se.fs,at=rt.freereg;un(Se,"(for index)"),un(Se,"(for limit)"),un(Se,"(for step)"),An(Se,hn),pt(Se,61),xr(Se),pt(Se,44),xr(Se),it(Se,44)?xr(Se):(S(rt,rt.freereg,Je(rt,1)),Nn(rt,1)),aa(Se,at,Tn,1,1)})(b,Ge,Z);break;case 44:case fe.TK_IN:(function(Se,hn){let Tn=Se.fs,rt=new $n,at=4,St=Tn.freereg;for(un(Se,"(for generator)"),un(Se,"(for state)"),un(Se,"(for control)"),An(Se,hn);it(Se,44);)An(Se,E(Se)),at++;pt(Se,fe.TK_IN);let Er=Se.linenumber;X(Se,3,Xt(Se,rt),rt),M(Tn,3),aa(Se,St,Er,at-3,0)})(b,Ge);break;default:f.luaX_syntaxerror(b,v("'=' or 'in' expected",!0))}bt(b,fe.TK_END,fe.TK_FOR,Z),A(Re)},vl=function(b,Z){let Re,Qe=new Pn,Ge=b.fs,Se=new $n;if(f.luaX_next(b),pr(b,Se),pt(b,fe.TK_THEN),b.t.token===fe.TK_GOTO||b.t.token===fe.TK_BREAK){for(Te(b.fs,Se),zn(Ge,Qe,!1),Pr(b,Se.t);it(b,59););if(Ne(b,0))return A(Ge),Z;Re=le(Ge)}else rn(b.fs,Se),zn(Ge,Qe,!1),Re=Se.f;return wn(b),A(Ge),b.t.token!==fe.TK_ELSE&&b.t.token!==fe.TK_ELSEIF||(Z=xe(Ge,Z,le(Ge))),G(Ge,Re),Z},ja=function(b,Z){let Re=new $n,Qe=new $n;f.luaX_next(b);let Ge=(function(Se,hn){let Tn=0;for(p(Se,hn);Se.t.token===46;)Wn(Se,hn);return Se.t.token===58&&(Tn=1,Wn(Se,hn)),Tn})(b,Re);mt(b,Qe,Ge,Z),h(b.fs,Re,Qe),ee(b.fs,Z)},Dr=function(b){let Z=b.linenumber;switch(K(b),b.t.token){case 59:f.luaX_next(b);break;case fe.TK_IF:(function(Re,Qe){let Ge=Re.fs,Se=oe;for(Se=vl(Re,Se);Re.t.token===fe.TK_ELSEIF;)Se=vl(Re,Se);it(Re,fe.TK_ELSE)&&na(Re),bt(Re,fe.TK_END,fe.TK_IF,Qe),G(Ge,Se)})(b,Z);break;case fe.TK_WHILE:(function(Re,Qe){let Ge=Re.fs,Se=new Pn;f.luaX_next(Re);let hn=Ie(Ge),Tn=yl(Re);zn(Ge,Se,1),pt(Re,fe.TK_DO),na(Re),Ue(Ge,hn),bt(Re,fe.TK_END,fe.TK_WHILE,Qe),A(Ge),G(Ge,Tn)})(b,Z);break;case fe.TK_DO:f.luaX_next(b),na(b),bt(b,fe.TK_END,fe.TK_DO,Z);break;case fe.TK_FOR:go(b,Z);break;case fe.TK_REPEAT:(function(Re,Qe){let Ge=Re.fs,Se=Ie(Ge),hn=new Pn,Tn=new Pn;zn(Ge,hn,1),zn(Ge,Tn,0),f.luaX_next(Re),wn(Re),bt(Re,fe.TK_UNTIL,fe.TK_REPEAT,Qe);let rt=yl(Re);Tn.upval&&me(Ge,rt,Tn.nactvar),A(Ge),He(Ge,rt,Se),A(Ge)})(b,Z);break;case fe.TK_FUNCTION:ja(b,Z);break;case fe.TK_LOCAL:f.luaX_next(b),it(b,fe.TK_FUNCTION)?(function(Re){let Qe=new $n,Ge=Re.fs;An(Re,E(Re)),We(Re,1),mt(Re,Qe,0,Re.linenumber),_n(Ge,Qe.u.info).startpc=Ge.pc})(b):(function(Re){let Qe,Ge=0,Se=new $n;do An(Re,E(Re)),Ge++;while(it(Re,44));it(Re,61)?Qe=Xt(Re,Se):(Se.k=In.VVOID,Qe=0),X(Re,Ge,Qe,Se),We(Re,Ge)})(b);break;case fe.TK_DBCOLON:f.luaX_next(b),ra(b,E(b),Z);break;case fe.TK_RETURN:f.luaX_next(b),(function(Re){let Qe,Ge,Se=Re.fs,hn=new $n;Ne(Re,1)||Re.t.token===59?Qe=Ge=0:(Ge=Xt(Re,hn),yn(hn.k)?(ot(Se,hn),hn.k===In.VCALL&&Ge===1&&(Bn(ze(Se,hn),c),Ee(ze(Se,hn).A===Se.nactvar)),Qe=Se.nactvar,Ge=k):Ge===1?Qe=Ze(Se,hn):(mn(Se,hn),Qe=Se.nactvar,Ee(Ge===Se.freereg-Qe))),Un(Se,Qe,Ge),it(Re,59)})(b);break;case fe.TK_BREAK:case fe.TK_GOTO:Pr(b,le(b.fs));break;default:(function(Re){let Qe=Re.fs,Ge=new ta;Ba(Re,Ge.v),Re.t.token===61||Re.t.token===44?(Ge.prev=null,Va(Re,Ge,1)):(Dt(Re,Ge.v.k===In.VCALL,v("syntax error",!0)),gn(ze(Qe,Ge.v),1))})(b)}Ee(b.fs.f.maxstacksize>=b.fs.freereg&&b.fs.freereg>=b.fs.nactvar),b.fs.freereg=b.fs.nactvar,ye(b)};a.exports.Dyndata=class{constructor(){this.actvar={arr:[],n:NaN,size:NaN},this.gt=new Fn,this.label=new Fn}},a.exports.expkind=In,a.exports.expdesc=$n,a.exports.luaY_parser=function(b,Z,Re,Qe,Ge,Se){let hn=new f.LexState,Tn=new ht,rt=J.luaF_newLclosure(b,1);return F.luaD_inctop(b),b.stack[b.top-1].setclLvalue(rt),hn.h=U.luaH_new(b),F.luaD_inctop(b),b.stack[b.top-1].sethvalue(hn.h),Tn.f=rt.p=new Me(b),Tn.f.source=pe(b,Ge),hn.buff=Re,hn.dyd=Qe,Qe.actvar.n=Qe.gt.n=Qe.label.n=0,f.luaX_setinput(b,hn,Z,Tn.f.source,Se),(function(at,St){let Er=new Pn,Gr=new $n;jn(at,St,Er),St.f.is_vararg=!0,ie(Gr,In.VLOCAL,0),xn(St,at.envn,Gr),f.luaX_next(at),wn(at),Ct(at,fe.TK_EOS),V(at)})(hn,Tn),Ee(!Tn.prev&&Tn.nups===1&&!hn.fs),Ee(Qe.actvar.n===0&&Qe.gt.n===0&&Qe.label.n===0),delete b.stack[--b.top],rt},a.exports.vkisinreg=function(b){return b===In.VNONRELOC||b===In.VLOCAL}},function(a,z,d){const{LUA_MULTRET:k,LUA_OK:v,LUA_TFUNCTION:P,LUA_TNIL:R,LUA_TNONE:C,LUA_TNUMBER:j,LUA_TSTRING:L,LUA_TTABLE:H,LUA_VERSION:w,LUA_YIELD:B,lua_call:Q,lua_callk:ce,lua_concat:$,lua_error:ve,lua_getglobal:se,lua_geti:$e,lua_getmetatable:nn,lua_gettop:Ke,lua_insert:Xe,lua_isnil:ln,lua_isnone:D,lua_isstring:re,lua_load:ke,lua_next:ge,lua_pcallk:Oe,lua_pop:tn,lua_pushboolean:an,lua_pushcfunction:sn,lua_pushglobaltable:ae,lua_pushinteger:oe,lua_pushliteral:ze,lua_pushnil:M,lua_pushstring:Ce,lua_pushvalue:T,lua_rawequal:g,lua_rawget:S,lua_rawlen:xe,lua_rawset:Ae,lua_remove:pn,lua_replace:Ze,lua_rotate:dn,lua_setfield:mn,lua_setmetatable:Y,lua_settop:ee,lua_setupvalue:Ie,lua_stringtonumber:Te,lua_toboolean:rn,lua_tolstring:On,lua_tostring:kn,lua_type:Je,lua_typename:le}=d(2),{luaL_argcheck:Ue,luaL_checkany:N,luaL_checkinteger:me,luaL_checkoption:He,luaL_checkstack:G,luaL_checktype:be,luaL_error:Pe,luaL_getmetafield:Nn,luaL_loadbufferx:Un,luaL_loadfile:Mn,luaL_loadfilex:Zn,luaL_optinteger:ot,luaL_optstring:o,luaL_setfuncs:de,luaL_tolstring:h,luaL_where:q}=d(7),{to_jsstring:F,to_luastring:J}=d(5);let f,I;if(typeof TextDecoder=="function"){let s="",_=new TextDecoder("utf-8");f=function(m){s+=_.decode(m,{stream:!0})};let c=new Uint8Array(0);I=function(){s+=_.decode(c),console.log(s),s=""}}else{let s=[];f=function(_){try{_=F(_)}catch{let m=new Uint8Array(_.length);m.set(_),_=m}s.push(_)},I=function(){console.log.apply(console.log,s),s=[]}}const te=["stop","restart","collect","count","step","setpause","setstepmul","isrunning"].map(s=>J(s)),Ee=function(s){return be(s,1,H),ee(s,2),ge(s,1)?2:(M(s),1)},Le=function(s){let _=me(s,2)+1;return oe(s,_),$e(s,1,_)===R?1:2},De=function(s){let _=ot(s,2,1);return ee(s,1),Je(s,1)===L&&_>0&&(q(s,_),T(s,1),$(s,2)),ve(s)},qe=function(s,_,c){return _!==v&&_!==B?(an(s,0),T(s,-2),2):Ke(s)-c},Fe=function(s,_,c){return _===v?(c!==0&&(T(s,c),Ie(s,-2,1)||tn(s,1)),1):(M(s),Xe(s,-2),2)},Ve=function(s,_){return G(s,2,"too many nested functions"),T(s,1),Q(s,0,1),ln(s,-1)?(tn(s,1),null):(re(s,-1)||Pe(s,J("reader function must return a string")),Ze(s,5),kn(s,5))},vn=function(s,_,c){return Ke(s)-1},l={assert:function(s){return rn(s,1)?Ke(s):(N(s,1),pn(s,1),ze(s,"assertion failed!"),ee(s,1),De(s))},collectgarbage:function(s){He(s,1,"collect",te),ot(s,2,0),Pe(s,J("lua_gc not implemented"))},dofile:function(s){let _=o(s,1,null);return ee(s,1),Mn(s,_)!==v?ve(s):(ce(s,0,k,0,vn),vn(s))},error:De,getmetatable:function(s){return N(s,1),nn(s,1)?(Nn(s,1,J("__metatable",!0)),1):(M(s),1)},ipairs:function(s){return N(s,1),sn(s,Le),T(s,1),oe(s,0),3},load:function(s){let _,c=kn(s,1),m=o(s,3,"bt"),O=D(s,4)?0:4;if(c!==null){let y=o(s,2,c);_=Un(s,c,c.length,y,m)}else{let y=o(s,2,"=(load)");be(s,1,P),ee(s,5),_=ke(s,Ve,null,y,m)}return Fe(s,_,O)},loadfile:function(s){let _=o(s,1,null),c=o(s,2,null),m=D(s,3)?0:3,O=Zn(s,_,c);return Fe(s,O,m)},next:Ee,pairs:function(s){return(function(_,c,m,O){return N(_,1),Nn(_,1,c)===R?(sn(_,O),T(_,1),M(_)):(T(_,1),Q(_,1,3)),3})(s,J("__pairs",!0),0,Ee)},pcall:function(s){N(s,1),an(s,1),Xe(s,1);let _=Oe(s,Ke(s)-2,k,0,0,qe);return qe(s,_,0)},print:function(s){let _=Ke(s);se(s,J("tostring",!0));for(let c=1;c<=_;c++){T(s,-1),T(s,c),Q(s,1,1);let m=On(s,-1);if(m===null)return Pe(s,J("'tostring' must return a string to 'print'"));c>1&&f(J("	")),f(m),tn(s,1)}return I(),0},rawequal:function(s){return N(s,1),N(s,2),an(s,g(s,1,2)),1},rawget:function(s){return be(s,1,H),N(s,2),ee(s,2),S(s,1),1},rawlen:function(s){let _=Je(s,1);return Ue(s,_===H||_===L,1,"table or string expected"),oe(s,xe(s,1)),1},rawset:function(s){return be(s,1,H),N(s,2),N(s,3),ee(s,3),Ae(s,1),1},select:function(s){let _=Ke(s);if(Je(s,1)===L&&kn(s,1)[0]===35)return oe(s,_-1),1;{let c=me(s,1);return c<0?c=_+c:c>_&&(c=_),Ue(s,1<=c,1,"index out of range"),_-c}},setmetatable:function(s){let _=Je(s,2);return be(s,1,H),Ue(s,_===R||_===H,2,"nil or table expected"),Nn(s,1,J("__metatable",!0))!==R?Pe(s,J("cannot change a protected metatable")):(ee(s,2),Y(s,1),1)},tonumber:function(s){if(Je(s,2)<=0){if(N(s,1),Je(s,1)===j)return ee(s,1),1;{let _=kn(s,1);if(_!==null&&Te(s,_)===_.length+1)return 1}}else{let _=me(s,2);be(s,1,L);let c=kn(s,1);Ue(s,2<=_&&_<=36,2,"base out of range");let m=(function(O,y){try{O=F(O)}catch{return null}let ne=/^[\t\v\f \n\r]*([+-]?)0*([0-9A-Za-z]+)[\t\v\f \n\r]*$/.exec(O);if(!ne)return null;let en=parseInt(ne[1]+ne[2],y);return isNaN(en)?null:0|en})(c,_);if(m!==null)return oe(s,m),1}return M(s),1},tostring:function(s){return N(s,1),h(s,1),1},type:function(s){let _=Je(s,1);return Ue(s,_!==C,1,"value expected"),Ce(s,le(s,_)),1},xpcall:function(s){let _=Ke(s);be(s,2,P),an(s,1),T(s,1),dn(s,3,2);let c=Oe(s,_-2,k,2,2,qe);return qe(s,c,2)}};a.exports.luaopen_base=function(s){return ae(s),de(s,l,0),T(s,-1),mn(s,-2,J("_G")),ze(s,w),mn(s,-2,J("_VERSION")),1}},function(a,z,d){const{LUA_OK:k,LUA_TFUNCTION:v,LUA_TSTRING:P,LUA_YIELD:R,lua_Debug:C,lua_checkstack:j,lua_concat:L,lua_error:H,lua_getstack:w,lua_gettop:B,lua_insert:Q,lua_isyieldable:ce,lua_newthread:$,lua_pop:ve,lua_pushboolean:se,lua_pushcclosure:$e,lua_pushliteral:nn,lua_pushthread:Ke,lua_pushvalue:Xe,lua_resume:ln,lua_status:D,lua_tothread:re,lua_type:ke,lua_upvalueindex:ge,lua_xmove:Oe,lua_yield:tn}=d(2),{luaL_argcheck:an,luaL_checktype:sn,luaL_newlib:ae,luaL_where:oe}=d(7),ze=function(S){let xe=re(S,1);return an(S,xe,1,"thread expected"),xe},M=function(S,xe,Ae){if(!j(xe,Ae))return nn(S,"too many arguments to resume"),-1;if(D(xe)===k&&B(xe)===0)return nn(S,"cannot resume dead coroutine"),-1;Oe(S,xe,Ae);let pn=ln(xe,S,Ae);if(pn===k||pn===R){let Ze=B(xe);return j(S,Ze+1)?(Oe(xe,S,Ze),Ze):(ve(xe,Ze),nn(S,"too many results to resume"),-1)}return Oe(xe,S,1),-1},Ce=function(S){let xe=re(S,ge(1)),Ae=M(S,xe,B(S));return Ae<0?(ke(S,-1)===P&&(oe(S,1),Q(S,-2),L(S,2)),H(S)):Ae},T=function(S){sn(S,1,v);let xe=$(S);return Xe(S,1),Oe(S,xe,1),1},g={create:T,isyieldable:function(S){return se(S,ce(S)),1},resume:function(S){let xe=ze(S),Ae=M(S,xe,B(S)-1);return Ae<0?(se(S,0),Q(S,-2),2):(se(S,1),Q(S,-(Ae+1)),Ae+1)},running:function(S){return se(S,Ke(S)),2},status:function(S){let xe=ze(S);if(S===xe)nn(S,"running");else switch(D(xe)){case R:nn(S,"suspended");break;case k:{let Ae=new C;w(xe,0,Ae)>0?nn(S,"normal"):B(xe)===0?nn(S,"dead"):nn(S,"suspended");break}default:nn(S,"dead")}return 1},wrap:function(S){return T(S),$e(S,Ce,1),1},yield:function(S){return tn(S,B(S))}};a.exports.luaopen_coroutine=function(S){return ae(S,g),1}},function(a,z,d){const{LUA_MAXINTEGER:k}=d(3),{LUA_OPEQ:v,LUA_OPLT:P,LUA_TFUNCTION:R,LUA_TNIL:C,LUA_TTABLE:j,lua_call:L,lua_checkstack:H,lua_compare:w,lua_createtable:B,lua_geti:Q,lua_getmetatable:ce,lua_gettop:$,lua_insert:ve,lua_isnil:se,lua_isnoneornil:$e,lua_isstring:nn,lua_pop:Ke,lua_pushinteger:Xe,lua_pushnil:ln,lua_pushstring:D,lua_pushvalue:re,lua_rawget:ke,lua_setfield:ge,lua_seti:Oe,lua_settop:tn,lua_toboolean:an,lua_type:sn}=d(2),{luaL_Buffer:ae,luaL_addlstring:oe,luaL_addvalue:ze,luaL_argcheck:M,luaL_buffinit:Ce,luaL_checkinteger:T,luaL_checktype:g,luaL_error:S,luaL_len:xe,luaL_newlib:Ae,luaL_opt:pn,luaL_optinteger:Ze,luaL_optlstring:dn,luaL_pushresult:mn,luaL_typename:Y}=d(7),ee=d(17),{to_luastring:Ie}=d(5),Te=function(G,be,Pe){return D(G,be),ke(G,-Pe)!==C},rn=function(G,be,Pe){if(sn(G,be)!==j){let Nn=1;!ce(G,be)||1&Pe&&!Te(G,Ie("__index",!0),++Nn)||2&Pe&&!Te(G,Ie("__newindex",!0),++Nn)||4&Pe&&!Te(G,Ie("__len",!0),++Nn)?g(G,be,j):Ke(G,Nn)}},On=function(G,be,Pe){return rn(G,be,4|Pe),xe(G,be)},kn=function(G,be,Pe){Q(G,1,Pe),nn(G,-1)||S(G,Ie("invalid value (%s) at index %d in table for 'concat'"),Y(G,-1),Pe),ze(be)},Je=function(G,be,Pe){Oe(G,1,be),Oe(G,1,Pe)},le=function(G,be,Pe){if(se(G,2))return w(G,be,Pe,P);{re(G,2),re(G,be-1),re(G,Pe-2),L(G,2,1);let Nn=an(G,-1);return Ke(G,1),Nn}},Ue=function(G,be,Pe){let Nn=be,Un=Pe-1;for(;;){for(;Q(G,1,++Nn),le(G,-1,-2);)Nn==Pe-1&&S(G,Ie("invalid order function for sorting")),Ke(G,1);for(;Q(G,1,--Un),le(G,-3,-1);)Un<Nn&&S(G,Ie("invalid order function for sorting")),Ke(G,1);if(Un<Nn)return Ke(G,1),Je(G,Pe-1,Nn),Nn;Je(G,Nn,Un)}},N=function(G,be,Pe){let Nn=Math.floor((be-G)/4),Un=Pe%(2*Nn)+(G+Nn);return ee.lua_assert(G+Nn<=Un&&Un<=be-Nn),Un},me=function(G,be,Pe,Nn){for(;be<Pe;){if(Q(G,1,be),Q(G,1,Pe),le(G,-1,-2)?Je(G,be,Pe):Ke(G,2),Pe-be==1)return;let Un,Mn;if(Un=Pe-be<100||Nn===0?Math.floor((be+Pe)/2):N(be,Pe,Nn),Q(G,1,Un),Q(G,1,be),le(G,-2,-1)?Je(G,Un,be):(Ke(G,1),Q(G,1,Pe),le(G,-1,-2)?Je(G,Un,Pe):Ke(G,2)),Pe-be==2)return;Q(G,1,Un),re(G,-1),Q(G,1,Pe-1),Je(G,Un,Pe-1),(Un=Ue(G,be,Pe))-be<Pe-Un?(me(G,be,Un-1,Nn),Mn=Un-be,be=Un+1):(me(G,Un+1,Pe,Nn),Mn=Pe-Un,Pe=Un-1),(Pe-be)/128>Mn&&(Nn=Math.floor(4294967296*Math.random()))}},He={concat:function(G){let be=On(G,1,1),Pe=dn(G,2,""),Nn=Pe.length,Un=Ze(G,3,1);be=Ze(G,4,be);let Mn=new ae;for(Ce(G,Mn);Un<be;Un++)kn(G,Mn,Un),oe(Mn,Pe,Nn);return Un===be&&kn(G,Mn,Un),mn(Mn),1},insert:function(G){let be,Pe=On(G,1,3)+1;switch($(G)){case 2:be=Pe;break;case 3:be=T(G,2),M(G,1<=be&&be<=Pe,2,"position out of bounds");for(let Nn=Pe;Nn>be;Nn--)Q(G,1,Nn-1),Oe(G,1,Nn);break;default:return S(G,"wrong number of arguments to 'insert'")}return Oe(G,1,be),0},move:function(G){let be=T(G,2),Pe=T(G,3),Nn=T(G,4),Un=$e(G,5)?1:5;if(rn(G,1,1),rn(G,Un,2),Pe>=be){M(G,be>0||Pe<k+be,3,"too many elements to move");let Mn=Pe-be+1;if(M(G,Nn<=k-Mn+1,4,"destination wrap around"),Nn>Pe||Nn<=be||Un!==1&&w(G,1,Un,v)!==1)for(let Zn=0;Zn<Mn;Zn++)Q(G,1,be+Zn),Oe(G,Un,Nn+Zn);else for(let Zn=Mn-1;Zn>=0;Zn--)Q(G,1,be+Zn),Oe(G,Un,Nn+Zn)}return re(G,Un),1},pack:function(G){let be=$(G);B(G,be,1),ve(G,1);for(let Pe=be;Pe>=1;Pe--)Oe(G,1,Pe);return Xe(G,be),ge(G,1,Ie("n")),1},remove:function(G){let be=On(G,1,3),Pe=Ze(G,2,be);for(Pe!==be&&M(G,1<=Pe&&Pe<=be+1,1,"position out of bounds"),Q(G,1,Pe);Pe<be;Pe++)Q(G,1,Pe+1),Oe(G,1,Pe);return ln(G),Oe(G,1,Pe),1},sort:function(G){let be=On(G,1,3);return be>1&&(M(G,be<k,1,"array too big"),$e(G,2)||g(G,2,R),tn(G,2),me(G,1,be,0)),0},unpack:function(G){let be=Ze(G,2,1),Pe=pn(G,T,3,xe(G,1));if(be>Pe)return 0;let Nn=Pe-be;if(Nn>=Number.MAX_SAFE_INTEGER||!H(G,++Nn))return S(G,Ie("too many results to unpack"));for(;be<Pe;be++)Q(G,1,be);return Q(G,1,Pe),Nn}};a.exports.luaopen_table=function(G){return Ae(G,He),1}},function(a,z,d){const{LUA_TNIL:k,LUA_TTABLE:v,lua_close:P,lua_createtable:R,lua_getfield:C,lua_isboolean:j,lua_isnoneornil:L,lua_pop:H,lua_pushboolean:w,lua_pushfstring:B,lua_pushinteger:Q,lua_pushliteral:ce,lua_pushnil:$,lua_pushnumber:ve,lua_pushstring:se,lua_setfield:$e,lua_settop:nn,lua_toboolean:Ke,lua_tointegerx:Xe}=d(2),{luaL_Buffer:ln,luaL_addchar:D,luaL_addstring:re,luaL_argerror:ke,luaL_buffinit:ge,luaL_checkinteger:Oe,luaL_checkstring:tn,luaL_checktype:an,luaL_error:sn,luaL_execresult:ae,luaL_fileresult:oe,luaL_newlib:ze,luaL_optinteger:M,luaL_optlstring:Ce,luaL_optstring:T,luaL_pushresult:g}=d(7),{luastring_eq:S,to_jsstring:xe,to_luastring:Ae}=d(5),pn=Ae("aAbBcCdDeFhHIjklmMnpPrRStTuUwWxXyYzZ%"),Ze=function(le,Ue,N){Q(le,N),$e(le,-2,Ae(Ue,!0))},dn=function(le,Ue,N){Ze(le,"sec",N?Ue.getUTCSeconds():Ue.getSeconds()),Ze(le,"min",N?Ue.getUTCMinutes():Ue.getMinutes()),Ze(le,"hour",N?Ue.getUTCHours():Ue.getHours()),Ze(le,"day",N?Ue.getUTCDate():Ue.getDate()),Ze(le,"month",(N?Ue.getUTCMonth():Ue.getMonth())+1),Ze(le,"year",N?Ue.getUTCFullYear():Ue.getFullYear()),Ze(le,"wday",(N?Ue.getUTCDay():Ue.getDay())+1),Ze(le,"yday",Math.floor((Ue-new Date(Ue.getFullYear(),0,0))/864e5))},mn=Number.MAX_SAFE_INTEGER/2,Y=function(le,Ue,N,me){let He=C(le,-1,Ae(Ue,!0)),G=Xe(le,-1);if(G===!1){if(He!==k)return sn(le,Ae("field '%s' is not an integer"),Ue);if(N<0)return sn(le,Ae("field '%s' missing in date table"),Ue);G=N}else{if(!(-mn<=G&&G<=mn))return sn(le,Ae("field '%s' is out-of-bound"),Ue);G-=me}return H(le,1),G},ee={days:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map(le=>Ae(le)),shortDays:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(le=>Ae(le)),months:["January","February","March","April","May","June","July","August","September","October","November","December"].map(le=>Ae(le)),shortMonths:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(le=>Ae(le)),AM:Ae("AM"),PM:Ae("PM"),am:Ae("am"),pm:Ae("pm"),formats:{c:Ae("%a %b %e %H:%M:%S %Y"),D:Ae("%m/%d/%y"),F:Ae("%Y-%m-%d"),R:Ae("%H:%M"),r:Ae("%I:%M:%S %p"),T:Ae("%H:%M:%S"),X:Ae("%T"),x:Ae("%D")}},Ie=function(le,Ue){let N=le.getDay();Ue==="monday"&&(N===0?N=6:N--);let me=(le-new Date(le.getFullYear(),0,1))/864e5;return Math.floor((me+7-N)/7)},Te=function(le,Ue,N){Ue<10&&D(le,N),re(le,Ae(String(Ue)))},rn=function(le,Ue,N,me){let He=0;for(;He<N.length;)if(N[He]!==37)D(Ue,N[He++]);else{let G=On(le,N,++He);switch(N[He]){case 37:D(Ue,37);break;case 65:re(Ue,ee.days[me.getDay()]);break;case 66:re(Ue,ee.months[me.getMonth()]);break;case 67:Te(Ue,Math.floor(me.getFullYear()/100),48);break;case 68:rn(le,Ue,ee.formats.D,me);break;case 70:rn(le,Ue,ee.formats.F,me);break;case 72:Te(Ue,me.getHours(),48);break;case 73:Te(Ue,(me.getHours()+11)%12+1,48);break;case 77:Te(Ue,me.getMinutes(),48);break;case 80:re(Ue,me.getHours()<12?ee.am:ee.pm);break;case 82:rn(le,Ue,ee.formats.R,me);break;case 83:Te(Ue,me.getSeconds(),48);break;case 84:rn(le,Ue,ee.formats.T,me);break;case 85:Te(Ue,Ie(me,"sunday"),48);break;case 87:Te(Ue,Ie(me,"monday"),48);break;case 88:rn(le,Ue,ee.formats.X,me);break;case 89:re(Ue,Ae(String(me.getFullYear())));break;case 90:{let be=me.toString().match(/\(([\w\s]+)\)/);be&&re(Ue,Ae(be[1]));break}case 97:re(Ue,ee.shortDays[me.getDay()]);break;case 98:case 104:re(Ue,ee.shortMonths[me.getMonth()]);break;case 99:rn(le,Ue,ee.formats.c,me);break;case 100:Te(Ue,me.getDate(),48);break;case 101:Te(Ue,me.getDate(),32);break;case 106:{let be=Math.floor((me-new Date(me.getFullYear(),0,1))/864e5);be<100&&(be<10&&D(Ue,48),D(Ue,48)),re(Ue,Ae(String(be)));break}case 107:Te(Ue,me.getHours(),32);break;case 108:Te(Ue,(me.getHours()+11)%12+1,32);break;case 109:Te(Ue,me.getMonth()+1,48);break;case 110:D(Ue,10);break;case 112:re(Ue,me.getHours()<12?ee.AM:ee.PM);break;case 114:rn(le,Ue,ee.formats.r,me);break;case 115:re(Ue,Ae(String(Math.floor(me/1e3))));break;case 116:D(Ue,8);break;case 117:{let be=me.getDay();re(Ue,Ae(String(be===0?7:be)));break}case 119:re(Ue,Ae(String(me.getDay())));break;case 120:rn(le,Ue,ee.formats.x,me);break;case 121:Te(Ue,me.getFullYear()%100,48);break;case 122:{let be=me.getTimezoneOffset();be>0?D(Ue,45):(be=-be,D(Ue,43)),Te(Ue,Math.floor(be/60),48),Te(Ue,be%60,48);break}}He+=G}},On=function(le,Ue,N){let me=pn,He=0,G=1;for(;He<me.length&&G<=Ue.length-N;He+=G)if(me[He]===124)G++;else if(S(Ue.subarray(N,N+G),me.subarray(He,He+G)))return G;ke(le,1,B(le,Ae("invalid conversion specifier '%%%s'"),Ue))},kn=function(le,Ue){return Oe(le,Ue)},Je={date:function(le){let Ue=Ce(le,1,"%c"),N=L(le,2)?new Date:new Date(1e3*kn(le,2)),me=!1,He=0;if(Ue[He]===33&&(me=!0,He++),Ue[He]===42&&Ue[He+1]===116)R(le,0,9),dn(le,N,me);else{new Uint8Array(4)[0]=37;let G=new ln;ge(le,G),rn(le,G,Ue,N),g(G)}return 1},difftime:function(le){let Ue=kn(le,1),N=kn(le,2);return ve(le,Ue-N),1},time:function(le){let Ue;return L(le,1)?Ue=new Date:(an(le,1,v),nn(le,1),Ue=new Date(Y(le,"year",-1,0),Y(le,"month",-1,1),Y(le,"day",-1,0),Y(le,"hour",12,0),Y(le,"min",0,0),Y(le,"sec",0,0)),dn(le,Ue)),Q(le,Math.floor(Ue/1e3)),1},clock:function(le){return ve(le,performance.now()/1e3),1}};a.exports.luaopen_os=function(le){return ze(le,Je),1}},function(a,z,d){const{sprintf:k}=d(38),{LUA_INTEGER_FMT:v,LUA_INTEGER_FRMLEN:P,LUA_MININTEGER:R,LUA_NUMBER_FMT:C,LUA_NUMBER_FRMLEN:j,frexp:L,lua_getlocaledecpoint:H}=d(3),{LUA_TBOOLEAN:w,LUA_TFUNCTION:B,LUA_TNIL:Q,LUA_TNUMBER:ce,LUA_TSTRING:$,LUA_TTABLE:ve,lua_call:se,lua_createtable:$e,lua_dump:nn,lua_gettable:Ke,lua_gettop:Xe,lua_isinteger:ln,lua_isstring:D,lua_pop:re,lua_pushcclosure:ke,lua_pushinteger:ge,lua_pushlightuserdata:Oe,lua_pushliteral:tn,lua_pushlstring:an,lua_pushnil:sn,lua_pushnumber:ae,lua_pushstring:oe,lua_pushvalue:ze,lua_remove:M,lua_setfield:Ce,lua_setmetatable:T,lua_settop:g,lua_toboolean:S,lua_tointeger:xe,lua_tonumber:Ae,lua_tostring:pn,lua_touserdata:Ze,lua_type:dn,lua_upvalueindex:mn}=d(2),{luaL_Buffer:Y,luaL_addchar:ee,luaL_addlstring:Ie,luaL_addsize:Te,luaL_addstring:rn,luaL_addvalue:On,luaL_argcheck:kn,luaL_argerror:Je,luaL_buffinit:le,luaL_buffinitsize:Ue,luaL_checkinteger:N,luaL_checknumber:me,luaL_checkstack:He,luaL_checkstring:G,luaL_checktype:be,luaL_error:Pe,luaL_newlib:Nn,luaL_optinteger:Un,luaL_optstring:Mn,luaL_prepbuffsize:Zn,luaL_pushresult:ot,luaL_pushresultsize:o,luaL_tolstring:de,luaL_typename:h}=d(7),q=d(17),{luastring_eq:F,luastring_indexOf:J,to_jsstring:f,to_luastring:I}=d(5),te=37,Ee=function(p){let X=J(p,0);return X>-1?X:p.length},Le=function(p,X){return p>=0?p:0-p>X?0:X+p+1},De=function(p,X,K,ye){return Ie(ye,X,K),0},qe=j.length+1,Fe=function(p,X,K){let ye=(function(he){if(Object.is(he,1/0))return I("inf");if(Object.is(he,-1/0))return I("-inf");if(Number.isNaN(he))return I("nan");if(he===0){let _e=k(C+"x0p+0",he);return Object.is(he,-0)&&(_e="-"+_e),I(_e)}{let _e="",Ln=L(he),Gn=Ln[0],zn=Ln[1];return Gn<0&&(_e+="-",Gn=-Gn),_e+="0x",_e+=(2*Gn).toString(16),_e+=k("p%+d",zn-=1),I(_e)}})(K);if(X[qe]===65)for(let he=0;he<ye.length;he++){let _e=ye[he];_e>=97&&(ye[he]=223&_e)}else X[qe]!==97&&Pe(p,I("modifiers for format '%%a'/'%%A' not implemented"));return ye},Ve=I("-+ #0"),vn=p=>97<=p&&p<=122||65<=p&&p<=90,l=p=>48<=p&&p<=57,s=p=>0<=p&&p<=31||p===127,_=p=>33<=p&&p<=126,c=p=>97<=p&&p<=122,m=p=>65<=p&&p<=90,O=p=>97<=p&&p<=122||65<=p&&p<=90||48<=p&&p<=57,y=p=>_(p)&&!O(p),ne=p=>p===32||p>=9&&p<=13,en=p=>48<=p&&p<=57||65<=p&&p<=70||97<=p&&p<=102,gn=function(p,X,K){switch(dn(p,K)){case $:{let ye=pn(p,K);(function(he,_e,Ln){ee(he,34);let Gn=0;for(;Ln--;){if(_e[Gn]===34||_e[Gn]===92||_e[Gn]===10)ee(he,92),ee(he,_e[Gn]);else if(s(_e[Gn])){let zn=""+_e[Gn];l(_e[Gn+1])&&(zn="0".repeat(3-zn.length)+zn),rn(he,I("\\"+zn))}else ee(he,_e[Gn]);Gn++}ee(he,34)})(X,ye,ye.length);break}case ce:{let ye;if(ln(p,K)){let he=xe(p,K);ye=I(k(he===R?"0x%"+P+"x":v,he))}else{let he=Ae(p,K);(function(_e){if(J(_e,46)<0){let Ln=H(),Gn=J(_e,Ln);Gn&&(_e[Gn]=46)}})(ye=Fe(p,I(`%${P}a`),he))}rn(X,ye);break}case Q:case w:de(p,K),On(X);break;default:Je(p,K,I("value has no literal form"))}},Bn=function(p,X,K,ye){let he=K;for(;X[he]!==0&&J(Ve,X[he])>=0;)he++;he-K>=Ve.length&&Pe(p,I("invalid format (repeated flags)")),l(X[he])&&he++,l(X[he])&&he++,X[he]===46&&(l(X[++he])&&he++,l(X[he])&&he++),l(X[he])&&Pe(p,I("invalid format (width or precision too long)")),ye[0]=37;for(let _e=0;_e<he-K+1;_e++)ye[_e+1]=X[K+_e];return he},Kn=function(p,X){let K=p.length,ye=X.length,he=p[K-1];for(let _e=0;_e<ye;_e++)p[_e+K-1]=X[_e];p[K+ye-1]=he};class pe{constructor(X){this.L=X,this.islittle=!0,this.maxalign=1}}const fn=l,U=function(p,X){if(p.off>=p.s.length||!fn(p.s[p.off]))return X;{let K=0;do K=10*K+(p.s[p.off++]-48);while(p.off<p.s.length&&fn(p.s[p.off])&&K<=2147483638e-1);return K}},Me=function(p,X,K){let ye=U(X,K);return(ye>16||ye<=0)&&Pe(p.L,I("integral size (%d) out of limits [1,%d]"),ye,16),ye},fe=function(p,X){let K={opt:X.s[X.off++],size:0};switch(K.opt){case 98:return K.size=1,K.opt=0,K;case 66:return K.size=1,K.opt=1,K;case 104:return K.size=2,K.opt=0,K;case 72:return K.size=2,K.opt=1,K;case 108:return K.size=4,K.opt=0,K;case 76:return K.size=4,K.opt=1,K;case 106:return K.size=4,K.opt=0,K;case 74:case 84:return K.size=4,K.opt=1,K;case 102:return K.size=4,K.opt=2,K;case 100:case 110:return K.size=8,K.opt=2,K;case 105:return K.size=Me(p,X,4),K.opt=0,K;case 73:return K.size=Me(p,X,4),K.opt=1,K;case 115:return K.size=Me(p,X,4),K.opt=4,K;case 99:return K.size=U(X,-1),K.size===-1&&Pe(p.L,I("missing size for format option 'c'")),K.opt=3,K;case 122:return K.opt=5,K;case 120:return K.size=1,K.opt=6,K;case 88:return K.opt=7,K;case 32:break;case 60:p.islittle=!0;break;case 62:p.islittle=!1;break;case 61:p.islittle=!0;break;case 33:p.maxalign=Me(p,X,8);break;default:Pe(p.L,I("invalid format option '%c'"),K.opt)}return K.opt=8,K},yn=function(p,X,K){let ye={opt:NaN,size:NaN,ntoalign:NaN},he=fe(p,K);ye.size=he.size,ye.opt=he.opt;let _e=ye.size;if(ye.opt===7)if(K.off>=K.s.length||K.s[K.off]===0)Je(p.L,1,I("invalid next option for option 'X'"));else{let Ln=fe(p,K);_e=Ln.size,(Ln=Ln.opt)!==3&&_e!==0||Je(p.L,1,I("invalid next option for option 'X'"))}return _e<=1||ye.opt===3?ye.ntoalign=0:(_e>p.maxalign&&(_e=p.maxalign),(_e&_e-1)!=0&&Je(p.L,1,I("format asks for alignment not power of 2")),ye.ntoalign=_e-(X&_e-1)&_e-1),ye},Dn=function(p,X,K,ye,he){let _e=Zn(p,ye);_e[K?0:ye-1]=255&X;for(let Ln=1;Ln<ye;Ln++)X>>=8,_e[K?Ln:ye-1-Ln]=255&X;if(he&&ye>4)for(let Ln=4;Ln<ye;Ln++)_e[K?Ln:ye-1-Ln]=255;Te(p,ye)},Pn=function(p,X,K,ye,he){let _e=0,Ln=ye<=4?ye:4;for(let Gn=Ln-1;Gn>=0;Gn--)_e<<=8,_e|=X[K?Gn:ye-1-Gn];if(ye<4){if(he){let Gn=1<<8*ye-1;_e=(_e^Gn)-Gn}}else if(ye>4){let Gn=!he||_e>=0?0:255;for(let zn=Ln;zn<ye;zn++)X[K?zn:ye-1-zn]!==Gn&&Pe(p,I("%d-byte integer does not fit into Lua Integer"),ye)}return _e},In=function(p,X,K,ye){q.lua_assert(X.length>=ye);let he=new DataView(new ArrayBuffer(ye));for(let _e=0;_e<ye;_e++)he.setUint8(_e,X[_e],K);return ye==4?he.getFloat32(0,K):he.getFloat64(0,K)},$n=I("^$*+?.([%-");class ht{constructor(X){this.src=null,this.src_init=null,this.src_end=null,this.p=null,this.p_end=null,this.L=X,this.matchdepth=NaN,this.level=NaN,this.capture=[]}}const Fn=function(p,X){switch(p.p[X++]){case te:return X===p.p_end&&Pe(p.L,I("malformed pattern (ends with '%%')")),X+1;case 91:p.p[X]===94&&X++;do X===p.p_end&&Pe(p.L,I("malformed pattern (missing ']')")),p.p[X++]===te&&X<p.p_end&&X++;while(p.p[X]!==93);return X+1;default:return X}},Jn=function(p,X){switch(X){case 97:return vn(p);case 65:return!vn(p);case 99:return s(p);case 67:return!s(p);case 100:return l(p);case 68:return!l(p);case 103:return _(p);case 71:return!_(p);case 108:return c(p);case 76:return!c(p);case 112:return y(p);case 80:return!y(p);case 115:return ne(p);case 83:return!ne(p);case 117:return m(p);case 85:return!m(p);case 119:return O(p);case 87:return!O(p);case 120:return en(p);case 88:return!en(p);case 122:return p===0;case 90:return p!==0;default:return X===p}},Vn=function(p,X,K,ye){let he=!0;for(p.p[K+1]===94&&(he=!1,K++);++K<ye;)if(p.p[K]===te){if(K++,Jn(X,p.p[K]))return he}else if(p.p[K+1]===45&&K+2<ye){if(K+=2,p.p[K-2]<=X&&X<=p.p[K])return he}else if(p.p[K]===X)return he;return!he},ut=function(p,X,K,ye){if(X>=p.src_end)return!1;{let he=p.src[X];switch(p.p[K]){case 46:return!0;case te:return Jn(he,p.p[K+1]);case 91:return Vn(p,he,K,ye-1);default:return p.p[K]===he}}},it=function(p,X,K){if(K>=p.p_end-1&&Pe(p.L,I("malformed pattern (missing arguments to '%%b'")),p.src[X]!==p.p[K])return null;{let ye=p.p[K],he=p.p[K+1],_e=1;for(;++X<p.src_end;)if(p.src[X]===he){if(--_e==0)return X+1}else p.src[X]===ye&&_e++}return null},Ct=function(p,X,K,ye){let he=0;for(;ut(p,X+he,K,ye);)he++;for(;he>=0;){let _e=ie(p,X+he,ye+1);if(_e)return _e;he--}return null},pt=function(p,X,K,ye){for(;;){let he=ie(p,X,ye+1);if(he!==null)return he;if(!ut(p,X,K,ye))return null;X++}},Dt=function(p,X,K,ye){let he,_e=p.level;return _e>=32&&Pe(p.L,I("too many captures")),p.capture[_e]=p.capture[_e]?p.capture[_e]:{},p.capture[_e].init=X,p.capture[_e].len=ye,p.level=_e+1,(he=ie(p,X,K))===null&&p.level--,he},bt=function(p,X,K){let ye,he=(function(_e){let Ln=_e.level;for(Ln--;Ln>=0;Ln--)if(_e.capture[Ln].len===-1)return Ln;return Pe(_e.L,I("invalid pattern capture"))})(p);return p.capture[he].len=X-p.capture[he].init,(ye=ie(p,X,K))===null&&(p.capture[he].len=-1),ye},E=function(p,X,K){K=(function(he,_e){return(_e-=49)<0||_e>=he.level||he.capture[_e].len===-1?Pe(he.L,I("invalid capture index %%%d"),_e+1):_e})(p,K);let ye=p.capture[K].len;return p.src_end-X>=ye&&(function(he,_e,Ln,Gn,zn){return F(he.subarray(_e,_e+zn),Ln.subarray(Gn,Gn+zn))})(p.src,p.capture[K].init,p.src,X,ye)?X+ye:null},ie=function(p,X,K){let ye=!1,he=!0;for(p.matchdepth--==0&&Pe(p.L,I("pattern too complex"));he||ye;)if(he=!1,K!==p.p_end)switch(ye?void 0:p.p[K]){case 40:X=p.p[K+1]===41?Dt(p,X,K+2,-2):Dt(p,X,K+1,-1);break;case 41:X=bt(p,X,K+1);break;case 36:if(K+1!==p.p_end){ye=!0;break}X=p.src.length-X==0?X:null;break;case te:switch(p.p[K+1]){case 98:(X=it(p,X,K+2))!==null&&(K+=4,he=!0);break;case 102:{K+=2,p.p[K]!==91&&Pe(p.L,I("missing '[' after '%%f' in pattern"));let _e=Fn(p,K),Ln=X===p.src_init?0:p.src[X-1];if(!Vn(p,Ln,K,_e-1)&&Vn(p,X===p.src_end?0:p.src[X],K,_e-1)){K=_e,he=!0;break}X=null;break}case 48:case 49:case 50:case 51:case 52:case 53:case 54:case 55:case 56:case 57:(X=E(p,X,p.p[K+1]))!==null&&(K+=2,he=!0);break;default:ye=!0}break;default:{ye=!1;let _e=Fn(p,K);if(ut(p,X,K,_e))switch(p.p[_e]){case 63:{let Ln;(Ln=ie(p,X+1,_e+1))!==null?X=Ln:(K=_e+1,he=!0);break}case 43:X++;case 42:X=Ct(p,X,K,_e);break;case 45:X=pt(p,X,K,_e);break;default:X++,K=_e,he=!0}else{if(p.p[_e]===42||p.p[_e]===63||p.p[_e]===45){K=_e+1,he=!0;break}X=null}break}}return p.matchdepth++,X},cn=function(p,X,K,ye){if(X>=p.level)X===0?an(p.L,p.src.subarray(K,ye),ye-K):Pe(p.L,I("invalid capture index %%%d"),X+1);else{let he=p.capture[X].len;he===-1&&Pe(p.L,I("unfinished capture")),he===-2?ge(p.L,p.capture[X].init-p.src_init+1):an(p.L,p.src.subarray(p.capture[X].init),he)}},on=function(p,X,K){let ye=p.level===0&&p.src.subarray(X)?1:p.level;He(p.L,ye,"too many captures");for(let he=0;he<ye;he++)cn(p,he,X,K);return ye},An=function(p,X,K,ye,he,_e){p.L=X,p.matchdepth=200,p.src=K,p.src_init=0,p.src_end=ye,p.p=he,p.p_end=_e},un=function(p){p.level=0,q.lua_assert(p.matchdepth===200)},_n=function(p,X){let K=G(p,1),ye=G(p,2),he=K.length,_e=ye.length,Ln=Le(Un(p,3,1),he);if(Ln<1)Ln=1;else if(Ln>he+1)return sn(p),1;if(X&&(S(p,4)||(function(Gn,zn){for(let jn=0;jn<zn;jn++)if(J($n,Gn[jn])!==-1)return!1;return!0})(ye,_e))){let Gn=(function(zn,jn,A){var V=A>>>0,Ne=jn.length;if(Ne===0)return V;for(;(V=zn.indexOf(jn[0],V))!==-1;V++)if(F(zn.subarray(V,V+Ne),jn))return V;return-1})(K.subarray(Ln-1),ye,0);if(Gn>-1)return ge(p,Ln+Gn),ge(p,Ln+Gn+_e-1),2}else{let Gn=new ht(p),zn=Ln-1,jn=ye[0]===94;jn&&(ye=ye.subarray(1),_e--),An(Gn,p,K,he,ye,_e);do{let A;if(un(Gn),(A=ie(Gn,zn,0))!==null)return X?(ge(p,zn+1),ge(p,A),on(Gn,null,0)+2):on(Gn,zn,A)}while(zn++<Gn.src_end&&!jn)}return sn(p),1},We=function(p){let X=Ze(p,mn(3));X.ms.L=p;for(let K=X.src;K<=X.ms.src_end;K++){let ye;if(un(X.ms),(ye=ie(X.ms,K,X.p))!==null&&ye!==X.lastmatch)return X.src=X.lastmatch=ye,on(X.ms,K,ye)}return 0},xn=function(p,X,K,ye,he){let _e=p.L;switch(he){case B:{ze(_e,3);let Ln=on(p,K,ye);se(_e,Ln,1);break}case ve:cn(p,0,K,ye),Ke(_e,3);break;default:return void(function(Ln,Gn,zn,jn){let A=Ln.L,V=pn(A,3),Ne=V.length;for(let wn=0;wn<Ne;wn++)V[wn]!==te?ee(Gn,V[wn]):l(V[++wn])?V[wn]===48?Ie(Gn,Ln.src.subarray(zn,jn),jn-zn):(cn(Ln,V[wn]-49,zn,jn),de(A,-1),M(A,-2),On(Gn)):(V[wn]!==te&&Pe(A,I("invalid use of '%c' in replacement string"),te),ee(Gn,V[wn]))})(p,X,K,ye)}S(_e,-1)?D(_e,-1)||Pe(_e,I("invalid replacement value (a %s)"),h(_e,-1)):(re(_e,1),an(_e,p.src.subarray(K,ye),ye-K)),On(X)},Sn={byte:function(p){let X=G(p,1),K=X.length,ye=Le(Un(p,2,1),K),he=Le(Un(p,3,ye),K);if(ye<1&&(ye=1),he>K&&(he=K),ye>he)return 0;if(he-ye>=Number.MAX_SAFE_INTEGER)return Pe(p,"string slice too long");let _e=he-ye+1;He(p,_e,"string slice too long");for(let Ln=0;Ln<_e;Ln++)ge(p,X[ye+Ln-1]);return _e},char:function(p){let X=Xe(p),K=new Y,ye=Ue(p,K,X);for(let he=1;he<=X;he++){let _e=N(p,he);kn(p,_e>=0&&_e<=255,"value out of range"),ye[he-1]=_e}return o(K,X),1},dump:function(p){let X=new Y,K=S(p,2);return be(p,1,B),g(p,1),le(p,X),nn(p,De,X,K)!==0?Pe(p,I("unable to dump given function")):(ot(X),1)},find:function(p){return _n(p,1)},format:function(p){let X=Xe(p),K=1,ye=G(p,K),he=0,_e=new Y;for(le(p,_e);he<ye.length;)if(ye[he]!==te)ee(_e,ye[he++]);else if(ye[++he]===te)ee(_e,ye[he++]);else{let Ln=[];switch(++K>X&&Je(p,K,I("no value")),he=Bn(p,ye,he,Ln),String.fromCharCode(ye[he++])){case"c":ee(_e,N(p,K));break;case"d":case"i":case"o":case"u":case"x":case"X":{let Gn=N(p,K);Kn(Ln,I(P,!0)),rn(_e,I(k(String.fromCharCode(...Ln),Gn)));break}case"a":case"A":Kn(Ln,I(P,!0)),rn(_e,Fe(p,Ln,me(p,K)));break;case"e":case"E":case"f":case"g":case"G":{let Gn=me(p,K);Kn(Ln,I(P,!0)),rn(_e,I(k(String.fromCharCode(...Ln),Gn)));break}case"q":gn(p,_e,K);break;case"s":{let Gn=de(p,K);Ln.length<=2||Ln[2]===0?On(_e):(kn(p,Gn.length===Ee(Gn),K,"string contains zeros"),J(Ln,46)<0&&Gn.length>=100?On(_e):(rn(_e,I(k(String.fromCharCode(...Ln),f(Gn)))),re(p,1)));break}default:return Pe(p,I("invalid option '%%%c' to 'format'"),ye[he-1])}}return ot(_e),1},gmatch:function(p){let X=G(p,1),K=G(p,2),ye=X.length,he=K.length;g(p,2);let _e=new class{constructor(){this.src=NaN,this.p=NaN,this.lastmatch=NaN,this.ms=new ht}};return Oe(p,_e),An(_e.ms,p,X,ye,K,he),_e.src=0,_e.p=0,_e.lastmatch=null,ke(p,We,3),1},gsub:function(p){let X=G(p,1),K=X.length,ye=G(p,2),he=ye.length,_e=null,Ln=dn(p,3),Gn=Un(p,4,K+1),zn=ye[0]===94,jn=0,A=new ht(p),V=new Y;for(kn(p,Ln===ce||Ln===$||Ln===B||Ln===ve,3,"string/function/table expected"),le(p,V),zn&&(ye=ye.subarray(1),he--),An(A,p,X,K,ye,he),X=0,ye=0;jn<Gn;){let Ne;if(un(A),(Ne=ie(A,X,ye))!==null&&Ne!==_e)jn++,xn(A,V,X,Ne,Ln),X=_e=Ne;else{if(!(X<A.src_end))break;ee(V,A.src[X++])}if(zn)break}return Ie(V,A.src.subarray(X,A.src_end),A.src_end-X),ot(V),ge(p,jn),2},len:function(p){return ge(p,G(p,1).length),1},lower:function(p){let X=G(p,1),K=X.length,ye=new Uint8Array(K);for(let he=0;he<K;he++){let _e=X[he];m(_e)&&(_e|=32),ye[he]=_e}return oe(p,ye),1},match:function(p){return _n(p,0)},pack:function(p){let X=new Y,K=new pe(p),ye={s:G(p,1),off:0},he=1,_e=0;for(sn(p),le(p,X);ye.off<ye.s.length;){let Ln=yn(K,_e,ye),Gn=Ln.opt,zn=Ln.size,jn=Ln.ntoalign;for(_e+=jn+zn;jn-- >0;)ee(X,0);switch(he++,Gn){case 0:{let A=N(p,he);if(zn<4){let V=1<<8*zn-1;kn(p,-V<=A&&A<V,he,"integer overflow")}Dn(X,A,K.islittle,zn,A<0);break}case 1:{let A=N(p,he);zn<4&&kn(p,A>>>0<1<<8*zn,he,"unsigned overflow"),Dn(X,A>>>0,K.islittle,zn,!1);break}case 2:{let A=Zn(X,zn),V=me(p,he),Ne=new DataView(A.buffer,A.byteOffset,A.byteLength);zn===4?Ne.setFloat32(0,V,K.islittle):Ne.setFloat64(0,V,K.islittle),Te(X,zn);break}case 3:{let A=G(p,he),V=A.length;for(kn(p,V<=zn,he,"string longer than given size"),Ie(X,A,V);V++<zn;)ee(X,0);break}case 4:{let A=G(p,he),V=A.length;kn(p,zn>=4||V<1<<8*zn,he,"string length does not fit in given size"),Dn(X,V,K.islittle,zn,0),Ie(X,A,V),_e+=V;break}case 5:{let A=G(p,he),V=A.length;kn(p,J(A,0)<0,he,"strings contains zeros"),Ie(X,A,V),ee(X,0),_e+=V+1;break}case 6:ee(X,0);case 7:case 8:he--}}return ot(X),1},packsize:function(p){let X=new pe(p),K={s:G(p,1),off:0},ye=0;for(;K.off<K.s.length;){let he=yn(X,ye,K),_e=he.opt,Ln=he.size,Gn=he.ntoalign;switch(kn(p,ye<=2147483647-(Ln+=Gn),1,"format result too large"),ye+=Ln,_e){case 4:case 5:Je(p,1,"variable-length format")}}return ge(p,ye),1},rep:function(p){let X=G(p,1),K=X.length,ye=N(p,2),he=Mn(p,3,""),_e=he.length;if(ye<=0)tn(p,"");else{if(K+_e<K||K+_e>2147483647/ye)return Pe(p,I("resulting string too large"));{let Ln=ye*K+(ye-1)*_e,Gn=new Y,zn=Ue(p,Gn,Ln),jn=0;for(;ye-- >1;)zn.set(X,jn),jn+=K,_e>0&&(zn.set(he,jn),jn+=_e);zn.set(X,jn),o(Gn,Ln)}}return 1},reverse:function(p){let X=G(p,1),K=X.length,ye=new Uint8Array(K);for(let he=0;he<K;he++)ye[he]=X[K-1-he];return oe(p,ye),1},sub:function(p){let X=G(p,1),K=X.length,ye=Le(N(p,2),K),he=Le(Un(p,3,-1),K);return ye<1&&(ye=1),he>K&&(he=K),ye<=he?oe(p,X.subarray(ye-1,ye-1+(he-ye+1))):tn(p,""),1},unpack:function(p){let X=new pe(p),K={s:G(p,1),off:0},ye=G(p,2),he=ye.length,_e=Le(Un(p,3,1),he)-1,Ln=0;for(kn(p,_e<=he&&_e>=0,3,"initial position out of string");K.off<K.s.length;){let Gn=yn(X,_e,K),zn=Gn.opt,jn=Gn.size,A=Gn.ntoalign;switch(_e+A+jn>he&&Je(p,2,I("data string too short")),_e+=A,He(p,2,"too many results"),Ln++,zn){case 0:case 1:{let V=Pn(p,ye.subarray(_e),X.islittle,jn,zn===0);ge(p,V);break}case 2:{let V=In(0,ye.subarray(_e),X.islittle,jn);ae(p,V);break}case 3:oe(p,ye.subarray(_e,_e+jn));break;case 4:{let V=Pn(p,ye.subarray(_e),X.islittle,jn,0);kn(p,_e+V+jn<=he,2,"data string too short"),oe(p,ye.subarray(_e+jn,_e+jn+V)),_e+=V;break}case 5:{let V=J(ye,0,_e);V===-1&&(V=ye.length-_e),oe(p,ye.subarray(_e,V)),_e=V+1;break}case 7:case 6:case 8:Ln--}_e+=jn}return ge(p,_e+1),Ln+1},upper:function(p){let X=G(p,1),K=X.length,ye=new Uint8Array(K);for(let he=0;he<K;he++){let _e=X[he];c(_e)&&(_e&=223),ye[he]=_e}return oe(p,ye),1}};a.exports.luaopen_string=function(p){return Nn(p,Sn),(function(X){$e(X,0,1),tn(X,""),ze(X,-2),T(X,-2),re(X,1),ze(X,-2),Ce(X,-2,I("__index",!0)),re(X,1)})(p),1}},function(a,z,d){const{lua_gettop:k,lua_pushcfunction:v,lua_pushfstring:P,lua_pushinteger:R,lua_pushnil:C,lua_pushstring:j,lua_pushvalue:L,lua_setfield:H,lua_tointeger:w}=d(2),{luaL_Buffer:B,luaL_addvalue:Q,luaL_argcheck:ce,luaL_buffinit:$,luaL_checkinteger:ve,luaL_checkstack:se,luaL_checkstring:$e,luaL_error:nn,luaL_newlib:Ke,luaL_optinteger:Xe,luaL_pushresult:ln}=d(7),{luastring_of:D,to_luastring:re}=d(5),ke=function(M){return(192&M)===128},ge=function(M,Ce){return M>=0?M:0-M>Ce?0:Ce+M+1},Oe=[255,127,2047,65535],tn=function(M,Ce){let T=M[Ce],g=0;if(T<128)g=T;else{let S=0;for(;64&T;){let xe=M[Ce+ ++S];if((192&xe)!=128)return null;g=g<<6|63&xe,T<<=1}if(g|=(127&T)<<5*S,S>3||g>1114111||g<=Oe[S])return null;Ce+=S}return{code:g,pos:Ce+1}},an=re("%U"),sn=function(M,Ce){let T=ve(M,Ce);ce(M,0<=T&&T<=1114111,Ce,"value out of range"),P(M,an,T)},ae=function(M){let Ce=$e(M,1),T=Ce.length,g=w(M,2)-1;if(g<0)g=0;else if(g<T)for(g++;ke(Ce[g]);)g++;if(g>=T)return 0;{let S=tn(Ce,g);return S===null||ke(Ce[S.pos])?nn(M,re("invalid UTF-8 code")):(R(M,g+1),R(M,S.code),2)}},oe={char:function(M){let Ce=k(M);if(Ce===1)sn(M,1);else{let T=new B;$(M,T);for(let g=1;g<=Ce;g++)sn(M,g),Q(T);ln(T)}return 1},codepoint:function(M){let Ce=$e(M,1),T=ge(Xe(M,2,1),Ce.length),g=ge(Xe(M,3,T),Ce.length);if(ce(M,T>=1,2,"out of range"),ce(M,g<=Ce.length,3,"out of range"),T>g)return 0;if(g-T>=Number.MAX_SAFE_INTEGER)return nn(M,"string slice too long");let S=g-T+1;for(se(M,S,"string slice too long"),S=0,T-=1;T<g;){let xe=tn(Ce,T);if(xe===null)return nn(M,"invalid UTF-8 code");R(M,xe.code),T=xe.pos,S++}return S},codes:function(M){return $e(M,1),v(M,ae),L(M,1),R(M,0),3},len:function(M){let Ce=0,T=$e(M,1),g=T.length,S=ge(Xe(M,2,1),g),xe=ge(Xe(M,3,-1),g);for(ce(M,1<=S&&--S<=g,2,"initial position out of string"),ce(M,--xe<g,3,"final position out of string");S<=xe;){let Ae=tn(T,S);if(Ae===null)return C(M),R(M,S+1),2;S=Ae.pos,Ce++}return R(M,Ce),1},offset:function(M){let Ce=$e(M,1),T=ve(M,2),g=T>=0?1:Ce.length+1;if(g=ge(Xe(M,3,g),Ce.length),ce(M,1<=g&&--g<=Ce.length,3,"position out of range"),T===0)for(;g>0&&ke(Ce[g]);)g--;else if(ke(Ce[g])&&nn(M,"initial position is a continuation byte"),T<0)for(;T<0&&g>0;){do g--;while(g>0&&ke(Ce[g]));T++}else for(T--;T>0&&g<Ce.length;){do g++;while(ke(Ce[g]));T--}return T===0?R(M,g+1):C(M),1}},ze=D(91,0,45,127,194,45,244,93,91,128,45,191,93,42);a.exports.luaopen_utf8=function(M){return Ke(M,oe),j(M,ze),H(M,-2,re("charpattern",!0)),1}},function(a,z,d){const{LUA_OPLT:k,LUA_TNUMBER:v,lua_compare:P,lua_gettop:R,lua_isinteger:C,lua_isnoneornil:j,lua_pushboolean:L,lua_pushinteger:H,lua_pushliteral:w,lua_pushnil:B,lua_pushnumber:Q,lua_pushvalue:ce,lua_setfield:$,lua_settop:ve,lua_tointeger:se,lua_tointegerx:$e,lua_type:nn}=d(2),{luaL_argcheck:Ke,luaL_argerror:Xe,luaL_checkany:ln,luaL_checkinteger:D,luaL_checknumber:re,luaL_error:ke,luaL_newlib:ge,luaL_optnumber:Oe}=d(7),{LUA_MAXINTEGER:tn,LUA_MININTEGER:an,lua_numbertointeger:sn}=d(3),{to_luastring:ae}=d(5);let oe;const ze=function(){return oe=1103515245*oe+12345&2147483647},M=function(T,g){let S=sn(g);S!==!1?H(T,S):Q(T,g)},Ce={abs:function(T){if(C(T,1)){let g=se(T,1);g<0&&(g=0|-g),H(T,g)}else Q(T,Math.abs(re(T,1)));return 1},acos:function(T){return Q(T,Math.acos(re(T,1))),1},asin:function(T){return Q(T,Math.asin(re(T,1))),1},atan:function(T){let g=re(T,1),S=Oe(T,2,1);return Q(T,Math.atan2(g,S)),1},ceil:function(T){return C(T,1)?ve(T,1):M(T,Math.ceil(re(T,1))),1},cos:function(T){return Q(T,Math.cos(re(T,1))),1},deg:function(T){return Q(T,re(T,1)*(180/Math.PI)),1},exp:function(T){return Q(T,Math.exp(re(T,1))),1},floor:function(T){return C(T,1)?ve(T,1):M(T,Math.floor(re(T,1))),1},fmod:function(T){if(C(T,1)&&C(T,2)){let g=se(T,2);g===0?Xe(T,2,"zero"):H(T,se(T,1)%g|0)}else{let g=re(T,1),S=re(T,2);Q(T,g%S)}return 1},log:function(T){let g,S=re(T,1);if(j(T,2))g=Math.log(S);else{let xe=re(T,2);g=xe===2?Math.log2(S):xe===10?Math.log10(S):Math.log(S)/Math.log(xe)}return Q(T,g),1},max:function(T){let g=R(T),S=1;Ke(T,g>=1,1,"value expected");for(let xe=2;xe<=g;xe++)P(T,S,xe,k)&&(S=xe);return ce(T,S),1},min:function(T){let g=R(T),S=1;Ke(T,g>=1,1,"value expected");for(let xe=2;xe<=g;xe++)P(T,xe,S,k)&&(S=xe);return ce(T,S),1},modf:function(T){if(C(T,1))ve(T,1),Q(T,0);else{let g=re(T,1),S=g<0?Math.ceil(g):Math.floor(g);M(T,S),Q(T,g===S?0:g-S)}return 2},rad:function(T){return Q(T,re(T,1)*(Math.PI/180)),1},random:function(T){let g,S,xe=oe===void 0?Math.random():ze()/2147483648;switch(R(T)){case 0:return Q(T,xe),1;case 1:g=1,S=D(T,1);break;case 2:g=D(T,1),S=D(T,2);break;default:return ke(T,"wrong number of arguments")}return Ke(T,g<=S,1,"interval is empty"),Ke(T,g>=0||S<=tn+g,1,"interval too large"),xe*=S-g+1,H(T,Math.floor(xe)+g),1},randomseed:function(T){return(function(g){(oe=0|g)==0&&(oe=1)})(re(T,1)),ze(),0},sin:function(T){return Q(T,Math.sin(re(T,1))),1},sqrt:function(T){return Q(T,Math.sqrt(re(T,1))),1},tan:function(T){return Q(T,Math.tan(re(T,1))),1},tointeger:function(T){let g=$e(T,1);return g!==!1?H(T,g):(ln(T,1),B(T)),1},type:function(T){return nn(T,1)===v?C(T,1)?w(T,"integer"):w(T,"float"):(ln(T,1),B(T)),1},ult:function(T){let g=D(T,1),S=D(T,2);return L(T,g>=0?S<0||g<S:S<0&&g<S),1}};a.exports.luaopen_math=function(T){return ge(T,Ce),Q(T,Math.PI),$(T,-2,ae("pi",!0)),Q(T,1/0),$(T,-2,ae("huge",!0)),H(T,tn),$(T,-2,ae("maxinteger",!0)),H(T,an),$(T,-2,ae("mininteger",!0)),1}},function(a,z,d){const{LUA_MASKCALL:k,LUA_MASKCOUNT:v,LUA_MASKLINE:P,LUA_MASKRET:R,LUA_REGISTRYINDEX:C,LUA_TFUNCTION:j,LUA_TNIL:L,LUA_TTABLE:H,LUA_TUSERDATA:w,lua_Debug:B,lua_call:Q,lua_checkstack:ce,lua_gethook:$,lua_gethookcount:ve,lua_gethookmask:se,lua_getinfo:$e,lua_getlocal:nn,lua_getmetatable:Ke,lua_getstack:Xe,lua_getupvalue:ln,lua_getuservalue:D,lua_insert:re,lua_iscfunction:ke,lua_isfunction:ge,lua_isnoneornil:Oe,lua_isthread:tn,lua_newtable:an,lua_pcall:sn,lua_pop:ae,lua_pushboolean:oe,lua_pushfstring:ze,lua_pushinteger:M,lua_pushlightuserdata:Ce,lua_pushliteral:T,lua_pushnil:g,lua_pushstring:S,lua_pushvalue:xe,lua_rawgetp:Ae,lua_rawsetp:pn,lua_rotate:Ze,lua_setfield:dn,lua_sethook:mn,lua_setlocal:Y,lua_setmetatable:ee,lua_settop:Ie,lua_setupvalue:Te,lua_setuservalue:rn,lua_tojsstring:On,lua_toproxy:kn,lua_tostring:Je,lua_tothread:le,lua_touserdata:Ue,lua_type:N,lua_upvalueid:me,lua_upvaluejoin:He,lua_xmove:G}=d(2),{luaL_argcheck:be,luaL_argerror:Pe,luaL_checkany:Nn,luaL_checkinteger:Un,luaL_checkstring:Mn,luaL_checktype:Zn,luaL_error:ot,luaL_loadbuffer:o,luaL_newlib:de,luaL_optinteger:h,luaL_optstring:q,luaL_traceback:F,lua_writestringerror:J}=d(7),f=d(17),{luastring_indexOf:I,to_luastring:te}=d(5),Ee=function(y,ne,en){y===ne||ce(ne,en)||ot(y,te("stack overflow",!0))},Le=function(y){return tn(y,1)?{arg:1,thread:le(y,1)}:{arg:0,thread:y}},De=function(y,ne,en){S(y,en),dn(y,-2,ne)},qe=function(y,ne,en){M(y,en),dn(y,-2,ne)},Fe=function(y,ne,en){oe(y,en),dn(y,-2,ne)},Ve=function(y,ne,en){y==ne?Ze(y,-2,1):G(ne,y,1),dn(y,-2,en)},vn=function(y,ne){let en=Un(y,2);Zn(y,1,j);let gn=ne?ln(y,1,en):Te(y,1,en);return gn===null?0:(S(y,gn),re(y,-(ne+1)),ne+1)},l=function(y,ne,en){let gn=Un(y,en);return Zn(y,ne,j),be(y,ln(y,ne,gn)!==null,en,"invalid upvalue index"),gn},s=te("__hooks__",!0),_=["call","return","line","count","tail call"].map(y=>te(y)),c=function(y,ne){Ae(y,C,s);let en=Ue(y,-1).get(y);en&&(en(y),S(y,_[ne.event]),ne.currentline>=0?M(y,ne.currentline):g(y),f.lua_assert($e(y,te("lS"),ne)),Q(y,2,0))},m={gethook:function(y){let ne=Le(y).thread,en=new Uint8Array(5),gn=se(ne),Bn=$(ne);return Bn===null?g(y):Bn!==c?T(y,"external hook"):(Ae(y,C,s),Ue(y,-1).get(ne)(y)),S(y,(function(Kn,pe){let fn=0;return Kn&k&&(pe[fn++]=99),Kn&R&&(pe[fn++]=114),Kn&P&&(pe[fn++]=108),pe.subarray(0,fn)})(gn,en)),M(y,ve(ne)),3},getinfo:function(y){let ne=new B,en=Le(y),gn=en.arg,Bn=en.thread,Kn=q(y,gn+2,"flnStu");if(Ee(y,Bn,3),ge(y,gn+1))Kn=ze(y,te(">%s"),Kn),xe(y,gn+1),G(y,Bn,1);else if(!Xe(Bn,Un(y,gn+1),ne))return g(y),1;return $e(Bn,Kn,ne)||Pe(y,gn+2,"invalid option"),an(y),I(Kn,83)>-1&&(De(y,te("source",!0),ne.source),De(y,te("short_src",!0),ne.short_src),qe(y,te("linedefined",!0),ne.linedefined),qe(y,te("lastlinedefined",!0),ne.lastlinedefined),De(y,te("what",!0),ne.what)),I(Kn,108)>-1&&qe(y,te("currentline",!0),ne.currentline),I(Kn,117)>-1&&(qe(y,te("nups",!0),ne.nups),qe(y,te("nparams",!0),ne.nparams),Fe(y,te("isvararg",!0),ne.isvararg)),I(Kn,110)>-1&&(De(y,te("name",!0),ne.name),De(y,te("namewhat",!0),ne.namewhat)),I(Kn,116)>-1&&Fe(y,te("istailcall",!0),ne.istailcall),I(Kn,76)>-1&&Ve(y,Bn,te("activelines",!0)),I(Kn,102)>-1&&Ve(y,Bn,te("func",!0)),1},getlocal:function(y){let ne=Le(y),en=ne.thread,gn=ne.arg,Bn=new B,Kn=Un(y,gn+2);if(ge(y,gn+1))return xe(y,gn+1),S(y,nn(y,null,Kn)),1;{let pe=Un(y,gn+1);if(!Xe(en,pe,Bn))return Pe(y,gn+1,"level out of range");Ee(y,en,1);let fn=nn(en,Bn,Kn);return fn?(G(en,y,1),S(y,fn),Ze(y,-2,1),2):(g(y),1)}},getmetatable:function(y){return Nn(y,1),Ke(y,1)||g(y),1},getregistry:function(y){return xe(y,C),1},getupvalue:function(y){return vn(y,1)},getuservalue:function(y){return N(y,1)!==w?g(y):D(y,1),1},sethook:function(y){let ne,en,gn,Bn,Kn=Le(y),pe=Kn.thread,fn=Kn.arg;if(Oe(y,fn+1))Ie(y,fn+1),gn=null,ne=0,en=0;else{const Me=Mn(y,fn+2);Zn(y,fn+1,j),en=h(y,fn+3,0),gn=c,ne=(function(fe,yn){let Dn=0;return I(fe,99)>-1&&(Dn|=k),I(fe,114)>-1&&(Dn|=R),I(fe,108)>-1&&(Dn|=P),yn>0&&(Dn|=v),Dn})(Me,en)}Ae(y,C,s)===L?(Bn=new WeakMap,Ce(y,Bn),pn(y,C,s)):Bn=Ue(y,-1);let U=kn(y,fn+1);return Bn.set(pe,U),mn(pe,gn,ne,en),0},setlocal:function(y){let ne=Le(y),en=ne.thread,gn=ne.arg,Bn=new B,Kn=Un(y,gn+1),pe=Un(y,gn+2);if(!Xe(en,Kn,Bn))return Pe(y,gn+1,"level out of range");Nn(y,gn+3),Ie(y,gn+3),Ee(y,en,1),G(y,en,1);let fn=Y(en,Bn,pe);return fn===null&&ae(en,1),S(y,fn),1},setmetatable:function(y){const ne=N(y,2);return be(y,ne==L||ne==H,2,"nil or table expected"),Ie(y,2),ee(y,1),1},setupvalue:function(y){return Nn(y,3),vn(y,0)},setuservalue:function(y){return Zn(y,1,w),Nn(y,2),Ie(y,2),rn(y,1),1},traceback:function(y){let ne=Le(y),en=ne.thread,gn=ne.arg,Bn=Je(y,gn+1);if(Bn!==null||Oe(y,gn+1)){let Kn=h(y,gn+2,y===en?1:0);F(y,en,Bn,Kn)}else xe(y,gn+1);return 1},upvalueid:function(y){let ne=l(y,1,2);return Ce(y,me(y,1,ne)),1},upvaluejoin:function(y){let ne=l(y,1,2),en=l(y,3,4);return be(y,!ke(y,1),1,"Lua function expected"),be(y,!ke(y,3),3,"Lua function expected"),He(y,1,ne,3,en),0}};let O;typeof window<"u"&&(O=function(){let y=prompt("lua_debug>","");return y!==null?y:""}),O&&(m.debug=function(y){for(;;){let ne=O();if(ne==="cont")return 0;if(ne.length===0)continue;let en=te(ne);(o(y,en,en.length,te("=(debug command)",!0))||sn(y,0,0,0))&&J(On(y,-1),`
`),Ie(y,0)}}),a.exports.luaopen_debug=function(y){return de(y,m),1}},function(a,z,d){const{LUA_DIRSEP:k,LUA_EXEC_DIR:v,LUA_JSPATH_DEFAULT:P,LUA_PATH_DEFAULT:R,LUA_PATH_MARK:C,LUA_PATH_SEP:j}=d(3),{LUA_OK:L,LUA_REGISTRYINDEX:H,LUA_TNIL:w,LUA_TTABLE:B,lua_callk:Q,lua_createtable:ce,lua_getfield:$,lua_insert:ve,lua_isfunction:se,lua_isnil:$e,lua_isstring:nn,lua_newtable:Ke,lua_pop:Xe,lua_pushboolean:ln,lua_pushcclosure:D,lua_pushcfunction:re,lua_pushfstring:ke,lua_pushglobaltable:ge,lua_pushlightuserdata:Oe,lua_pushliteral:tn,lua_pushlstring:an,lua_pushnil:sn,lua_pushstring:ae,lua_pushvalue:oe,lua_rawgeti:ze,lua_rawgetp:M,lua_rawseti:Ce,lua_rawsetp:T,lua_remove:g,lua_setfield:S,lua_setmetatable:xe,lua_settop:Ae,lua_toboolean:pn,lua_tostring:Ze,lua_touserdata:dn,lua_upvalueindex:mn}=d(2),{LUA_LOADED_TABLE:Y,LUA_PRELOAD_TABLE:ee,luaL_Buffer:Ie,luaL_addvalue:Te,luaL_buffinit:rn,luaL_checkstring:On,luaL_error:kn,luaL_getsubtable:Je,luaL_gsub:le,luaL_len:Ue,luaL_loadfile:N,luaL_newlib:me,luaL_optstring:He,luaL_pushresult:G,luaL_setfuncs:be}=d(7),Pe=d(17),{luastring_indexOf:Nn,to_jsstring:Un,to_luastring:Mn,to_uristring:Zn}=d(5),ot=d(0),o=typeof window<"u"?window:typeof WorkerGlobalScope<"u"&&self instanceof WorkerGlobalScope?self:(0,eval)("this"),de=Mn("__JSLIBS__"),h=k,q=k,F=Mn("luaopen_"),J=Mn("_"),f=Mn("");let I;I=function(pe,fn,U){fn=Zn(fn);let Me=new XMLHttpRequest;if(Me.open("GET",fn,!1),Me.send(),Me.status<200||Me.status>=300)return ae(pe,Mn(`${Me.status}: ${Me.statusText}`)),null;let fe,yn=Me.response;/\/\/[#@] sourceURL=/.test(yn)||(yn+=" //# sourceURL="+fn);try{fe=Function("fengari",yn)}catch(Pn){return ae(pe,Mn(`${Pn.name}: ${Pn.message}`)),null}let Dn=fe(ot);return typeof Dn=="function"||typeof Dn=="object"&&Dn!==null?Dn:Dn===void 0?o:(ae(pe,Mn(`library returned unexpected type (${typeof Dn})`)),null)};let te;te=function(pe){pe=Zn(pe);let fn=new XMLHttpRequest;return fn.open("GET",pe,!1),fn.send(),fn.status>=200&&fn.status<=299};const Ee=function(pe,fn,U){let Me=qe(pe,fn);if(Me===null){if((Me=I(pe,fn,U[0]===42))===null)return 1;Fe(pe,fn,Me)}if(U[0]===42)return ln(pe,1),0;{let fe=(function(yn,Dn,Pn){let In=Dn[Un(Pn)];return In&&typeof In=="function"?In:(ke(yn,Mn("undefined symbol: %s"),Pn),null)})(pe,Me,U);return fe===null?2:(re(pe,fe),0)}},Le=o,De=function(pe,fn,U,Me){let fe=`${U}${Pe.LUA_VERSUFFIX}`;ae(pe,Mn(fe));let yn=Le[fe];yn===void 0&&(yn=Le[U]),yn===void 0||(function(Dn){$(Dn,H,Mn("LUA_NOENV"));let Pn=pn(Dn,-1);return Xe(Dn,1),Pn})(pe)?ae(pe,Me):(yn=le(pe,Mn(yn),Mn(j+j,!0),Mn(j+Un(f)+j,!0)),le(pe,yn,f,Me),g(pe,-2)),S(pe,-3,fn),Xe(pe,1)},qe=function(pe,fn){M(pe,H,de),$(pe,-1,fn);let U=dn(pe,-1);return Xe(pe,2),U},Fe=function(pe,fn,U){M(pe,H,de),Oe(pe,U),oe(pe,-1),S(pe,-3,fn),Ce(pe,-2,Ue(pe,-2)+1),Xe(pe,1)},Ve=function(pe,fn){for(;fn[0]===j.charCodeAt(0);)fn=fn.subarray(1);if(fn.length===0)return null;let U=Nn(fn,j.charCodeAt(0));return U<0&&(U=fn.length),an(pe,fn,U),fn.subarray(U)},vn=function(pe,fn,U,Me,fe){let yn=new Ie;for(rn(pe,yn),Me[0]!==0&&(fn=le(pe,fn,Me,fe));(U=Ve(pe,U))!==null;){let Dn=le(pe,Ze(pe,-1),Mn(C,!0),fn);if(g(pe,-2),te(Dn))return Dn;ke(pe,Mn(`
	no file '%s'`),Dn),g(pe,-2),Te(yn)}return G(yn),null},l=function(pe,fn,U,Me){$(pe,mn(1),U);let fe=Ze(pe,-1);return fe===null&&kn(pe,Mn("'package.%s' must be a string"),U),vn(pe,fn,fe,Mn("."),Me)},s=function(pe,fn,U){return fn?(ae(pe,U),2):kn(pe,Mn(`error loading module '%s' from file '%s':
	%s`),Ze(pe,1),U,Ze(pe,-1))},_=function(pe){let fn=On(pe,1),U=l(pe,fn,Mn("path",!0),Mn(q,!0));return U===null?1:s(pe,N(pe,U)===L,U)},c=function(pe,fn,U){let Me;U=le(pe,U,Mn("."),J);let fe=Nn(U,45);if(fe>=0){Me=an(pe,U,fe),Me=ke(pe,Mn("%s%s"),F,Me);let yn=Ee(pe,fn,Me);if(yn!==2)return yn;U=fe+1}return Me=ke(pe,Mn("%s%s"),F,U),Ee(pe,fn,Me)},m=function(pe){let fn=On(pe,1),U=l(pe,fn,Mn("jspath",!0),Mn(h,!0));return U===null?1:s(pe,c(pe,U,fn)===0,U)},O=function(pe){let fn,U=On(pe,1),Me=Nn(U,46);if(Me<0)return 0;an(pe,U,Me);let fe=l(pe,Ze(pe,-1),Mn("jspath",!0),Mn(h,!0));return fe===null?1:(fn=c(pe,fe,U))!==0?fn!=2?s(pe,0,fe):(ae(pe,Mn(`
	no module '%s' in file '%s'`),U,fe),1):(ae(pe,fe),2)},y=function(pe){let fn=On(pe,1);return $(pe,H,ee),$(pe,-1,fn)===w&&ke(pe,Mn(`
	no field package.preload['%s']`),fn),1},ne=function(pe,fn,U){for(;fn===L?(ze(pe,3,U.i)===w&&(Xe(pe,1),G(U.msg),kn(pe,Mn("module '%s' not found:%s"),U.name,Ze(pe,-1))),ae(pe,U.name),Q(pe,1,2,U,ne)):fn=L,!se(pe,-2);U.i++)nn(pe,-2)?(Xe(pe,1),Te(U.msg)):Xe(pe,2);return U.k(pe,L,U.ctx)},en=function(pe,fn,U){return ae(pe,U),ve(pe,-2),Q(pe,2,1,U,gn),gn(pe,L,U)},gn=function(pe,fn,U){let Me=U;return $e(pe,-1)||S(pe,2,Me),$(pe,2,Me)==w&&(ln(pe,1),oe(pe,-1),S(pe,2,Me)),1},Bn={loadlib:function(pe){let fn=On(pe,1),U=On(pe,2),Me=Ee(pe,fn,U);return Me===0?1:(sn(pe),ve(pe,-2),tn(pe,Me===1?"open":"init"),3)},searchpath:function(pe){return vn(pe,On(pe,1),On(pe,2),He(pe,3,"."),He(pe,4,k))!==null?1:(sn(pe),ve(pe,-2),2)}},Kn={require:function(pe){let fn=On(pe,1);return Ae(pe,1),$(pe,H,Y),$(pe,2,fn),pn(pe,-1)?1:(Xe(pe,1),(function(U,Me,fe,yn){let Dn=new Ie;return rn(U,Dn),$(U,mn(1),Mn("searchers",!0))!==B&&kn(U,Mn("'package.searchers' must be a table")),ne(U,L,{name:Me,i:1,msg:Dn,ctx:fe,k:yn})})(pe,fn,fn,en))}};a.exports.luaopen_package=function(pe){return(function(fn){Ke(fn),ce(fn,0,1),xe(fn,-2),T(fn,H,de)})(pe),me(pe,Bn),(function(fn){let U=[y,_,m,O,null];ce(fn);for(let Me=0;U[Me];Me++)oe(fn,-2),D(fn,U[Me],1),Ce(fn,-2,Me+1);S(fn,-2,Mn("searchers",!0))})(pe),De(pe,Mn("path",!0),"LUA_PATH",R),De(pe,Mn("jspath",!0),"LUA_JSPATH",P),tn(pe,k+`
`+j+`
`+C+`
`+v+`
-
`),S(pe,-2,Mn("config",!0)),Je(pe,H,Y),S(pe,-2,Mn("loaded",!0)),Je(pe,H,ee),S(pe,-2,Mn("preload",!0)),ge(pe),oe(pe,-2),be(pe,Kn,1),Xe(pe,1),1}},function(a,z,d){const{lua_pushinteger:k,lua_pushliteral:v,lua_setfield:P}=d(2),{luaL_newlib:R}=d(7),{FENGARI_AUTHORS:C,FENGARI_COPYRIGHT:j,FENGARI_RELEASE:L,FENGARI_VERSION:H,FENGARI_VERSION_MAJOR:w,FENGARI_VERSION_MINOR:B,FENGARI_VERSION_NUM:Q,FENGARI_VERSION_RELEASE:ce,to_luastring:$}=d(5);a.exports.luaopen_fengari=function(ve){return R(ve,{}),v(ve,C),P(ve,-2,$("AUTHORS")),v(ve,j),P(ve,-2,$("COPYRIGHT")),v(ve,L),P(ve,-2,$("RELEASE")),v(ve,H),P(ve,-2,$("VERSION")),v(ve,w),P(ve,-2,$("VERSION_MAJOR")),v(ve,B),P(ve,-2,$("VERSION_MINOR")),k(ve,Q),P(ve,-2,$("VERSION_NUM")),v(ve,ce),P(ve,-2,$("VERSION_RELEASE")),1}},function(a,z,d){d.r(z),d.d(z,"L",function(){return an}),d.d(z,"load",function(){return sn});var k=d(0);d.d(z,"FENGARI_AUTHORS",function(){return k.FENGARI_AUTHORS}),d.d(z,"FENGARI_COPYRIGHT",function(){return k.FENGARI_COPYRIGHT}),d.d(z,"FENGARI_RELEASE",function(){return k.FENGARI_RELEASE}),d.d(z,"FENGARI_VERSION",function(){return k.FENGARI_VERSION}),d.d(z,"FENGARI_VERSION_MAJOR",function(){return k.FENGARI_VERSION_MAJOR}),d.d(z,"FENGARI_VERSION_MINOR",function(){return k.FENGARI_VERSION_MINOR}),d.d(z,"FENGARI_VERSION_NUM",function(){return k.FENGARI_VERSION_NUM}),d.d(z,"FENGARI_VERSION_RELEASE",function(){return k.FENGARI_VERSION_RELEASE}),d.d(z,"luastring_eq",function(){return k.luastring_eq}),d.d(z,"luastring_indexOf",function(){return k.luastring_indexOf}),d.d(z,"luastring_of",function(){return k.luastring_of}),d.d(z,"to_jsstring",function(){return k.to_jsstring}),d.d(z,"to_luastring",function(){return k.to_luastring}),d.d(z,"to_uristring",function(){return k.to_uristring}),d.d(z,"lua",function(){return k.lua}),d.d(z,"lauxlib",function(){return k.lauxlib}),d.d(z,"lualib",function(){return k.lualib});var v=d(21);d.d(z,"interop",function(){return v});const{LUA_ERRRUN:P,LUA_ERRSYNTAX:R,LUA_OK:C,LUA_VERSION_MAJOR:j,LUA_VERSION_MINOR:L,lua_Debug:H,lua_getinfo:w,lua_getstack:B,lua_gettop:Q,lua_insert:ce,lua_pcall:$,lua_pop:ve,lua_pushcfunction:se,lua_pushstring:$e,lua_remove:nn,lua_setglobal:Ke,lua_tojsstring:Xe}=k.lua,{luaL_loadbuffer:ln,luaL_newstate:D,luaL_requiref:re}=k.lauxlib,{checkjs:ke,luaopen_js:ge,push:Oe,tojs:tn}=v,an=D();function sn(ae,oe){if(typeof ae=="string")ae=Object(k.to_luastring)(ae);else if(!(ae instanceof Uint8Array))throw new TypeError("expects an array of bytes or javascript string");oe=oe?Object(k.to_luastring)(oe):null;let ze,M=ln(an,ae,null,oe);if(ze=M===R?new SyntaxError(Xe(an,-1)):tn(an,-1),ve(an,1),M!==C)throw ze;return ze}if(k.lualib.luaL_openlibs(an),re(an,Object(k.to_luastring)("js"),ge,1),ve(an,1),$e(an,Object(k.to_luastring)(k.FENGARI_COPYRIGHT)),Ke(an,Object(k.to_luastring)("_COPYRIGHT")),typeof document<"u"&&document instanceof HTMLDocument){const ae=function(Ae){switch(Ae){case"anonymous":return"omit";case"use-credentials":return"include";default:return"same-origin"}},oe=function(Ae){let pn=new H;return B(Ae,2,pn)&&w(Ae,Object(k.to_luastring)("Sl"),pn),Oe(Ae,new ErrorEvent("error",{bubbles:!0,cancelable:!0,message:Xe(Ae,1),error:tn(Ae,1),filename:pn.short_src?Object(k.to_jsstring)(pn.short_src):void 0,lineno:pn.currentline>0?pn.currentline:void 0})),1},ze=function(Ae,pn,Ze){let dn,mn=ln(an,pn,null,Ze);if(mn===R){let Y=Xe(an,-1),ee=Ae.src?Ae.src:document.location,Ie,Te=new SyntaxError(Y,ee,Ie);dn=new ErrorEvent("error",{message:Y,error:Te,filename:ee,lineno:Ie})}else if(mn===C){let Y=Q(an);se(an,oe),ce(an,Y),Object.defineProperty(document,"currentScript",{value:Ae,configurable:!0}),mn=$(an,0,0,Y),delete document.currentScript,nn(an,Y),mn===P&&(dn=ke(an,-1))}mn!==C&&(dn===void 0&&(dn=new ErrorEvent("error",{message:Xe(an,-1),error:tn(an,-1)})),ve(an,1),window.dispatchEvent(dn)&&console.error("uncaught exception",dn.error))},M=function(Ae,pn,Ze){if(Ae.status>=200&&Ae.status<300){let dn=Ae.response;dn=typeof dn=="string"?Object(k.to_luastring)(Ae.response):new Uint8Array(dn),ze(pn,dn,Ze)}else pn.dispatchEvent(new Event("error"))},Ce=function(Ae){if(Ae.src){let pn=Object(k.to_luastring)("@"+Ae.src);if(document.readyState==="complete"||Ae.async)if(typeof fetch=="function")fetch(Ae.src,{method:"GET",credentials:ae(Ae.crossorigin),redirect:"follow",integrity:Ae.integrity}).then(function(Ze){if(Ze.ok)return Ze.arrayBuffer();throw new Error("unable to fetch")}).then(function(Ze){let dn=new Uint8Array(Ze);ze(Ae,dn,pn)}).catch(function(Ze){Ae.dispatchEvent(new Event("error"))});else{let Ze=new XMLHttpRequest;Ze.open("GET",Ae.src,!0),Ze.responseType="arraybuffer",Ze.onreadystatechange=function(){Ze.readyState===4&&M(Ze,Ae,pn)},Ze.send()}else{let Ze=new XMLHttpRequest;Ze.open("GET",Ae.src,!1),Ze.send(),M(Ze,Ae,pn)}}else{let pn=Object(k.to_luastring)(Ae.innerHTML),Ze=Ae.id?Object(k.to_luastring)("="+Ae.id):pn;ze(Ae,pn,Ze)}},T=/^(.*?\/.*?)([\t ]*;.*)?$/,g=/^(\d+)\.(\d+)$/,S=function(Ae){if(Ae.tagName!=="SCRIPT")return;let pn=T.exec(Ae.type);if(!pn)return;let Ze=pn[1];if(Ze==="application/lua"||Ze==="text/lua"){if(Ae.hasAttribute("lua-version")){let dn=g.exec(Ae.getAttribute("lua-version"));if(!dn||dn[1]!==j||dn[2]!==L)return}Ce(Ae)}};typeof MutationObserver<"u"?new MutationObserver(function(Ae,pn){for(let Ze=0;Ze<Ae.length;Ze++){let dn=Ae[Ze];for(let mn=0;mn<dn.addedNodes.length;mn++)S(dn.addedNodes[mn])}}).observe(document,{childList:!0,subtree:!0}):console.warn&&console.warn("fengari-web: MutationObserver not found; lua script tags will not be run when inserted"),Array.prototype.forEach.call(document.querySelectorAll('script[type^="application/lua"], script[type^="text/lua"]'),S)}},function(a,z,d){const{LUA_MULTRET:k,LUA_OPADD:v,LUA_OPBAND:P,LUA_OPBNOT:R,LUA_OPBOR:C,LUA_OPBXOR:j,LUA_OPDIV:L,LUA_OPIDIV:H,LUA_OPMOD:w,LUA_OPSHL:B,LUA_OPSHR:Q,LUA_OPUNM:ce,constant_types:{LUA_TBOOLEAN:$,LUA_TLIGHTUSERDATA:ve,LUA_TLNGSTR:se,LUA_TNIL:$e,LUA_TNUMFLT:nn,LUA_TNUMINT:Ke,LUA_TTABLE:Xe},to_luastring:ln}=d(1),{lua_assert:D}=d(4),re=d(20),ke=d(6),ge=d(16),Oe=d(23),tn=d(9),an=d(15),sn=ge.OpCodesI,ae=ke.TValue,oe={OPR_ADD:0,OPR_SUB:1,OPR_MUL:2,OPR_MOD:3,OPR_POW:4,OPR_DIV:5,OPR_IDIV:6,OPR_BAND:7,OPR_BOR:8,OPR_BXOR:9,OPR_SHL:10,OPR_SHR:11,OPR_CONCAT:12,OPR_EQ:13,OPR_LT:14,OPR_LE:15,OPR_NE:16,OPR_GT:17,OPR_GE:18,OPR_AND:19,OPR_OR:20,OPR_NOBINOPR:21},ze={OPR_MINUS:0,OPR_BNOT:1,OPR_NOT:2,OPR_LEN:3,OPR_NOUNOPR:4},M=function(c){return c.t!==c.f},Ce=function(c,m){let O=Oe.expkind;if(M(c))return!1;switch(c.k){case O.VKINT:return!m||new ae(Ke,c.u.ival);case O.VKFLT:return!m||new ae(nn,c.u.nval);default:return!1}},T=function(c,m,O){let y,ne=m+O-1;if(c.pc>c.lasttarget&&(y=c.f.code[c.pc-1]).opcode===sn.OP_LOADNIL){let en=y.A,gn=en+y.B;if(en<=m&&m<=gn+1||m<=en&&en<=ne+1)return en<m&&(m=en),gn>ne&&(ne=gn),ge.SETARG_A(y,m),void ge.SETARG_B(y,ne-m)}Je(c,sn.OP_LOADNIL,m,O-1,0)},g=function(c,m){return c.f.code[m.u.info]},S=function(c,m){let O=c.f.code[m].sBx;return O===-1?-1:m+1+O},xe=function(c,m,O){let y=c.f.code[m],ne=O-(m+1);D(O!==-1),Math.abs(ne)>ge.MAXARG_sBx&&re.luaX_syntaxerror(c.ls,ln("control structure too long",!0)),ge.SETARG_sBx(y,ne)},Ae=function(c,m,O){if(O===-1)return m;if(m===-1)m=O;else{let y=m,ne=S(c,y);for(;ne!==-1;)ne=S(c,y=ne);xe(c,y,O)}return m},pn=function(c){let m=c.jpc;c.jpc=-1;let O=Ue(c,sn.OP_JMP,0,-1);return O=Ae(c,O,m)},Ze=function(c,m,O,y,ne){return Je(c,m,O,y,ne),pn(c)},dn=function(c){return c.lasttarget=c.pc,c.pc},mn=function(c,m){return m>=1&&ge.testTMode(c.f.code[m-1].opcode)?m-1:m},Y=function(c,m){return c.f.code[mn(c,m)]},ee=function(c,m,O){let y=mn(c,m),ne=c.f.code[y];return ne.opcode===sn.OP_TESTSET&&(O!==ge.NO_REG&&O!==ne.B?ge.SETARG_A(ne,O):c.f.code[y]=ge.CREATE_ABC(sn.OP_TEST,ne.B,0,ne.C),!0)},Ie=function(c,m){for(;m!==-1;m=S(c,m))ee(c,m,ge.NO_REG)},Te=function(c,m,O,y,ne){for(;m!==-1;){let en=S(c,m);ee(c,m,y)?xe(c,m,O):xe(c,m,ne),m=en}},rn=function(c,m){dn(c),c.jpc=Ae(c,c.jpc,m)},On=function(c,m,O){O===c.pc?rn(c,m):(D(O<c.pc),Te(c,m,O,ge.NO_REG,O))},kn=function(c,m){let O=c.f;return(function(y){Te(y,y.jpc,y.pc,ge.NO_REG,y.pc),y.jpc=-1})(c),O.code[c.pc]=m,O.lineinfo[c.pc]=c.ls.lastline,c.pc++},Je=function(c,m,O,y,ne){return D(ge.getOpMode(m)===ge.iABC),D(ge.getBMode(m)!==ge.OpArgN||y===0),D(ge.getCMode(m)!==ge.OpArgN||ne===0),D(O<=ge.MAXARG_A&&y<=ge.MAXARG_B&&ne<=ge.MAXARG_C),kn(c,ge.CREATE_ABC(m,O,y,ne))},le=function(c,m,O,y){return D(ge.getOpMode(m)===ge.iABx||ge.getOpMode(m)===ge.iAsBx),D(ge.getCMode(m)===ge.OpArgN),D(O<=ge.MAXARG_A&&y<=ge.MAXARG_Bx),kn(c,ge.CREATE_ABx(m,O,y))},Ue=function(c,m,O,y){return le(c,m,O,y+ge.MAXARG_sBx)},N=function(c,m){return D(m<=ge.MAXARG_Ax),kn(c,ge.CREATE_Ax(sn.OP_EXTRAARG,m))},me=function(c,m,O){if(O<=ge.MAXARG_Bx)return le(c,sn.OP_LOADK,m,O);{let y=le(c,sn.OP_LOADKX,m,0);return N(c,O),y}},He=function(c,m){let O=c.freereg+m;O>c.f.maxstacksize&&(O>=255&&re.luaX_syntaxerror(c.ls,ln("function or expression needs too many registers",!0)),c.f.maxstacksize=O)},G=function(c,m){He(c,m),c.freereg+=m},be=function(c,m){!ge.ISK(m)&&m>=c.nactvar&&(c.freereg--,D(m===c.freereg))},Pe=function(c,m){m.k===Oe.expkind.VNONRELOC&&be(c,m.u.info)},Nn=function(c,m,O){let y=m.k===Oe.expkind.VNONRELOC?m.u.info:-1,ne=O.k===Oe.expkind.VNONRELOC?O.u.info:-1;y>ne?(be(c,y),be(c,ne)):(be(c,ne),be(c,y))},Un=function(c,m,O){let y=c.f,ne=tn.luaH_get(c.L,c.ls.h,m);if(ne.ttisinteger()){let gn=ne.value;if(gn<c.nk&&y.k[gn].ttype()===O.ttype()&&y.k[gn].value===O.value)return gn}let en=c.nk;return tn.luaH_setfrom(c.L,c.ls.h,m,new ke.TValue(Ke,en)),y.k[en]=O,c.nk++,en},Mn=function(c,m){let O=new ae(ve,m),y=new ae(Ke,m);return Un(c,O,y)},Zn=function(c,m){let O=new ae(nn,m);return Un(c,O,O)},ot=function(c,m){let O=new ae($,m);return Un(c,O,O)},o=function(c,m,O){let y=Oe.expkind;if(m.k===y.VCALL)ge.SETARG_C(g(c,m),O+1);else if(m.k===y.VVARARG){let ne=g(c,m);ge.SETARG_B(ne,O+1),ge.SETARG_A(ne,c.freereg),G(c,1)}else D(O===k)},de=function(c,m){let O=Oe.expkind;m.k===O.VCALL?(D(g(c,m).C===2),m.k=O.VNONRELOC,m.u.info=g(c,m).A):m.k===O.VVARARG&&(ge.SETARG_B(g(c,m),2),m.k=O.VRELOCABLE)},h=function(c,m){let O=Oe.expkind;switch(m.k){case O.VLOCAL:m.k=O.VNONRELOC;break;case O.VUPVAL:m.u.info=Je(c,sn.OP_GETUPVAL,0,m.u.info,0),m.k=O.VRELOCABLE;break;case O.VINDEXED:{let y;be(c,m.u.ind.idx),m.u.ind.vt===O.VLOCAL?(be(c,m.u.ind.t),y=sn.OP_GETTABLE):(D(m.u.ind.vt===O.VUPVAL),y=sn.OP_GETTABUP),m.u.info=Je(c,y,0,m.u.ind.t,m.u.ind.idx),m.k=O.VRELOCABLE;break}case O.VVARARG:case O.VCALL:de(c,m)}},q=function(c,m,O,y){return dn(c),Je(c,sn.OP_LOADBOOL,m,O,y)},F=function(c,m,O){let y=Oe.expkind;switch(h(c,m),m.k){case y.VNIL:T(c,O,1);break;case y.VFALSE:case y.VTRUE:Je(c,sn.OP_LOADBOOL,O,m.k===y.VTRUE,0);break;case y.VK:me(c,O,m.u.info);break;case y.VKFLT:me(c,O,Zn(c,m.u.nval));break;case y.VKINT:me(c,O,Mn(c,m.u.ival));break;case y.VRELOCABLE:{let ne=g(c,m);ge.SETARG_A(ne,O);break}case y.VNONRELOC:O!==m.u.info&&Je(c,sn.OP_MOVE,O,m.u.info,0);break;default:return void D(m.k===y.VJMP)}m.u.info=O,m.k=y.VNONRELOC},J=function(c,m){m.k!==Oe.expkind.VNONRELOC&&(G(c,1),F(c,m,c.freereg-1))},f=function(c,m){for(;m!==-1;m=S(c,m))if(Y(c,m).opcode!==sn.OP_TESTSET)return!0;return!1},I=function(c,m,O){let y=Oe.expkind;if(F(c,m,O),m.k===y.VJMP&&(m.t=Ae(c,m.t,m.u.info)),M(m)){let ne,en=-1,gn=-1;if(f(c,m.t)||f(c,m.f)){let Bn=m.k===y.VJMP?-1:pn(c);en=q(c,O,0,1),gn=q(c,O,1,0),rn(c,Bn)}ne=dn(c),Te(c,m.f,ne,O,en),Te(c,m.t,ne,O,gn)}m.f=m.t=-1,m.u.info=O,m.k=y.VNONRELOC},te=function(c,m){h(c,m),Pe(c,m),G(c,1),I(c,m,c.freereg-1)},Ee=function(c,m){if(h(c,m),m.k===Oe.expkind.VNONRELOC){if(!M(m))return m.u.info;if(m.u.info>=c.nactvar)return I(c,m,m.u.info),m.u.info}return te(c,m),m.u.info},Le=function(c,m){M(m)?Ee(c,m):h(c,m)},De=function(c,m){let O=Oe.expkind,y=!1;switch(Le(c,m),m.k){case O.VTRUE:m.u.info=ot(c,!0),y=!0;break;case O.VFALSE:m.u.info=ot(c,!1),y=!0;break;case O.VNIL:m.u.info=(function(ne){let en=new ae($e,null),gn=new ae(Xe,ne.ls.h);return Un(ne,gn,en)})(c),y=!0;break;case O.VKINT:m.u.info=Mn(c,m.u.ival),y=!0;break;case O.VKFLT:m.u.info=Zn(c,m.u.nval),y=!0;break;case O.VK:y=!0}return y&&(m.k=O.VK,m.u.info<=ge.MAXINDEXRK)?ge.RKASK(m.u.info):Ee(c,m)},qe=function(c,m){let O=Y(c,m.u.info);D(ge.testTMode(O.opcode)&&O.opcode!==sn.OP_TESTSET&&O.opcode!==sn.OP_TEST),ge.SETARG_A(O,!O.A)},Fe=function(c,m,O){if(m.k===Oe.expkind.VRELOCABLE){let y=g(c,m);if(y.opcode===sn.OP_NOT)return c.pc--,Ze(c,sn.OP_TEST,y.B,0,!O)}return J(c,m),Pe(c,m),Ze(c,sn.OP_TESTSET,ge.NO_REG,m.u.info,O)},Ve=function(c,m){let O,y=Oe.expkind;switch(h(c,m),m.k){case y.VJMP:qe(c,m),O=m.u.info;break;case y.VK:case y.VKFLT:case y.VKINT:case y.VTRUE:O=-1;break;default:O=Fe(c,m,0)}m.f=Ae(c,m.f,O),rn(c,m.t),m.t=-1},vn=function(c,m){let O,y=Oe.expkind;switch(h(c,m),m.k){case y.VJMP:O=m.u.info;break;case y.VNIL:case y.VFALSE:O=-1;break;default:O=Fe(c,m,1)}m.t=Ae(c,m.t,O),rn(c,m.f),m.f=-1},l=function(c,m,O){let y,ne,en=Oe.expkind;if(!(y=Ce(m,!0))||!(ne=Ce(O,!0))||!(function(Bn,Kn,pe){switch(Bn){case P:case C:case j:case B:case Q:case R:return an.tointeger(Kn)!==!1&&an.tointeger(pe)!==!1;case L:case H:case w:return pe.value!==0;default:return 1}})(c,y,ne))return 0;let gn=new ae;if(ke.luaO_arith(null,c,y,ne,gn),gn.ttisinteger())m.k=en.VKINT,m.u.ival=gn.value;else{let Bn=gn.value;if(isNaN(Bn)||Bn===0)return!1;m.k=en.VKFLT,m.u.nval=Bn}return!0},s=function(c,m,O,y,ne){let en=De(c,y),gn=De(c,O);Nn(c,O,y),O.u.info=Je(c,m,0,gn,en),O.k=Oe.expkind.VRELOCABLE,_(c,ne)},_=function(c,m){c.f.lineinfo[c.pc-1]=m};a.exports.BinOpr=oe,a.exports.NO_JUMP=-1,a.exports.UnOpr=ze,a.exports.getinstruction=g,a.exports.luaK_checkstack=He,a.exports.luaK_code=kn,a.exports.luaK_codeABC=Je,a.exports.luaK_codeABx=le,a.exports.luaK_codeAsBx=Ue,a.exports.luaK_codek=me,a.exports.luaK_concat=Ae,a.exports.luaK_dischargevars=h,a.exports.luaK_exp2RK=De,a.exports.luaK_exp2anyreg=Ee,a.exports.luaK_exp2anyregup=function(c,m){(m.k!==Oe.expkind.VUPVAL||M(m))&&Ee(c,m)},a.exports.luaK_exp2nextreg=te,a.exports.luaK_exp2val=Le,a.exports.luaK_fixline=_,a.exports.luaK_getlabel=dn,a.exports.luaK_goiffalse=vn,a.exports.luaK_goiftrue=Ve,a.exports.luaK_indexed=function(c,m,O){let y=Oe.expkind;D(!M(m)&&(Oe.vkisinreg(m.k)||m.k===y.VUPVAL)),m.u.ind.t=m.u.info,m.u.ind.idx=De(c,O),m.u.ind.vt=m.k===y.VUPVAL?y.VUPVAL:y.VLOCAL,m.k=y.VINDEXED},a.exports.luaK_infix=function(c,m,O){switch(m){case oe.OPR_AND:Ve(c,O);break;case oe.OPR_OR:vn(c,O);break;case oe.OPR_CONCAT:te(c,O);break;case oe.OPR_ADD:case oe.OPR_SUB:case oe.OPR_MUL:case oe.OPR_DIV:case oe.OPR_IDIV:case oe.OPR_MOD:case oe.OPR_POW:case oe.OPR_BAND:case oe.OPR_BOR:case oe.OPR_BXOR:case oe.OPR_SHL:case oe.OPR_SHR:Ce(O,!1)||De(c,O);break;default:De(c,O)}},a.exports.luaK_intK=Mn,a.exports.luaK_jump=pn,a.exports.luaK_jumpto=function(c,m){return On(c,pn(c),m)},a.exports.luaK_nil=T,a.exports.luaK_numberK=Zn,a.exports.luaK_patchclose=function(c,m,O){for(O++;m!==-1;m=S(c,m)){let y=c.f.code[m];D(y.opcode===sn.OP_JMP&&(y.A===0||y.A>=O)),ge.SETARG_A(y,O)}},a.exports.luaK_patchlist=On,a.exports.luaK_patchtohere=rn,a.exports.luaK_posfix=function(c,m,O,y,ne){let en=Oe.expkind;switch(m){case oe.OPR_AND:D(O.t===-1),h(c,y),y.f=Ae(c,y.f,O.f),O.to(y);break;case oe.OPR_OR:D(O.f===-1),h(c,y),y.t=Ae(c,y.t,O.t),O.to(y);break;case oe.OPR_CONCAT:{Le(c,y);let gn=g(c,y);y.k===en.VRELOCABLE&&gn.opcode===sn.OP_CONCAT?(D(O.u.info===gn.B-1),Pe(c,O),ge.SETARG_B(gn,O.u.info),O.k=en.VRELOCABLE,O.u.info=y.u.info):(te(c,y),s(c,sn.OP_CONCAT,O,y,ne));break}case oe.OPR_ADD:case oe.OPR_SUB:case oe.OPR_MUL:case oe.OPR_DIV:case oe.OPR_IDIV:case oe.OPR_MOD:case oe.OPR_POW:case oe.OPR_BAND:case oe.OPR_BOR:case oe.OPR_BXOR:case oe.OPR_SHL:case oe.OPR_SHR:l(m+v,O,y)||s(c,m+sn.OP_ADD,O,y,ne);break;case oe.OPR_EQ:case oe.OPR_LT:case oe.OPR_LE:case oe.OPR_NE:case oe.OPR_GT:case oe.OPR_GE:(function(gn,Bn,Kn,pe){let fn,U=Oe.expkind;Kn.k===U.VK?fn=ge.RKASK(Kn.u.info):(D(Kn.k===U.VNONRELOC),fn=Kn.u.info);let Me=De(gn,pe);switch(Nn(gn,Kn,pe),Bn){case oe.OPR_NE:Kn.u.info=Ze(gn,sn.OP_EQ,0,fn,Me);break;case oe.OPR_GT:case oe.OPR_GE:{let fe=Bn-oe.OPR_NE+sn.OP_EQ;Kn.u.info=Ze(gn,fe,1,Me,fn);break}default:{let fe=Bn-oe.OPR_EQ+sn.OP_EQ;Kn.u.info=Ze(gn,fe,1,fn,Me);break}}Kn.k=U.VJMP})(c,m,O,y)}return O},a.exports.luaK_prefix=function(c,m,O,y){let ne=new Oe.expdesc;switch(ne.k=Oe.expkind.VKINT,ne.u.ival=ne.u.nval=ne.u.info=0,ne.t=-1,ne.f=-1,m){case ze.OPR_MINUS:case ze.OPR_BNOT:if(l(m+ce,O,ne))break;case ze.OPR_LEN:(function(en,gn,Bn,Kn){let pe=Ee(en,Bn);Pe(en,Bn),Bn.u.info=Je(en,gn,0,pe,0),Bn.k=Oe.expkind.VRELOCABLE,_(en,Kn)})(c,m+sn.OP_UNM,O,y);break;case ze.OPR_NOT:(function(en,gn){let Bn=Oe.expkind;switch(h(en,gn),gn.k){case Bn.VNIL:case Bn.VFALSE:gn.k=Bn.VTRUE;break;case Bn.VK:case Bn.VKFLT:case Bn.VKINT:case Bn.VTRUE:gn.k=Bn.VFALSE;break;case Bn.VJMP:qe(en,gn);break;case Bn.VRELOCABLE:case Bn.VNONRELOC:J(en,gn),Pe(en,gn),gn.u.info=Je(en,sn.OP_NOT,0,gn.u.info,0),gn.k=Bn.VRELOCABLE}{let Kn=gn.f;gn.f=gn.t,gn.t=Kn}Ie(en,gn.f),Ie(en,gn.t)})(c,O)}},a.exports.luaK_reserveregs=G,a.exports.luaK_ret=function(c,m,O){Je(c,sn.OP_RETURN,m,O+1,0)},a.exports.luaK_self=function(c,m,O){Ee(c,m);let y=m.u.info;Pe(c,m),m.u.info=c.freereg,m.k=Oe.expkind.VNONRELOC,G(c,2),Je(c,sn.OP_SELF,m.u.info,y,De(c,O)),Pe(c,O)},a.exports.luaK_setlist=function(c,m,O,y){let ne=(O-1)/ge.LFIELDS_PER_FLUSH+1,en=y===k?0:y;D(y!==0&&y<=ge.LFIELDS_PER_FLUSH),ne<=ge.MAXARG_C?Je(c,sn.OP_SETLIST,m,en,ne):ne<=ge.MAXARG_Ax?(Je(c,sn.OP_SETLIST,m,en,0),N(c,ne)):re.luaX_syntaxerror(c.ls,ln("constructor too long",!0)),c.freereg=m+1},a.exports.luaK_setmultret=function(c,m){o(c,m,k)},a.exports.luaK_setoneret=de,a.exports.luaK_setreturns=o,a.exports.luaK_storevar=function(c,m,O){let y=Oe.expkind;switch(m.k){case y.VLOCAL:return Pe(c,O),void I(c,O,m.u.info);case y.VUPVAL:{let ne=Ee(c,O);Je(c,sn.OP_SETUPVAL,ne,m.u.info,0);break}case y.VINDEXED:{let ne=m.u.ind.vt===y.VLOCAL?sn.OP_SETTABLE:sn.OP_SETTABUP,en=De(c,O);Je(c,ne,m.u.ind.t,m.u.ind.idx,en);break}}Pe(c,O)},a.exports.luaK_stringK=function(c,m){let O=new ae(se,m);return Un(c,O,O)}},function(a,z,d){const{LUA_SIGNATURE:k,constant_types:{LUA_TBOOLEAN:v,LUA_TLNGSTR:P,LUA_TNIL:R,LUA_TNUMFLT:C,LUA_TNUMINT:j,LUA_TSHRSTR:L},thread_status:{LUA_ERRSYNTAX:H},is_luastring:w,luastring_eq:B,to_luastring:Q}=d(1),ce=d(8),$=d(13),ve=d(6),{MAXARG_sBx:se,POS_A:$e,POS_Ax:nn,POS_B:Ke,POS_Bx:Xe,POS_C:ln,POS_OP:D,SIZE_A:re,SIZE_Ax:ke,SIZE_B:ge,SIZE_Bx:Oe,SIZE_C:tn,SIZE_OP:an}=d(16),{lua_assert:sn}=d(4),{luaS_bless:ae}=d(10),{luaZ_read:oe,ZIO:ze}=d(19);let M=[25,147,13,10,26,10];class Ce{constructor(g,S,xe){this.intSize=4,this.size_tSize=4,this.instructionSize=4,this.integerSize=4,this.numberSize=8,sn(S instanceof ze,"BytecodeParser only operates on a ZIO"),sn(w(xe)),xe[0]===64||xe[0]===61?this.name=xe.subarray(1):xe[0]==k[0]?this.name=Q("binary string",!0):this.name=xe,this.L=g,this.Z=S,this.arraybuffer=new ArrayBuffer(Math.max(this.intSize,this.size_tSize,this.instructionSize,this.integerSize,this.numberSize)),this.dv=new DataView(this.arraybuffer),this.u8=new Uint8Array(this.arraybuffer)}read(g){let S=new Uint8Array(g);return oe(this.Z,S,0,g)!==0&&this.error("truncated"),S}LoadByte(){return oe(this.Z,this.u8,0,1)!==0&&this.error("truncated"),this.u8[0]}LoadInt(){return oe(this.Z,this.u8,0,this.intSize)!==0&&this.error("truncated"),this.dv.getInt32(0,!0)}LoadNumber(){return oe(this.Z,this.u8,0,this.numberSize)!==0&&this.error("truncated"),this.dv.getFloat64(0,!0)}LoadInteger(){return oe(this.Z,this.u8,0,this.integerSize)!==0&&this.error("truncated"),this.dv.getInt32(0,!0)}LoadSize_t(){return this.LoadInteger()}LoadString(){let g=this.LoadByte();return g===255&&(g=this.LoadSize_t()),g===0?null:ae(this.L,this.read(g-1))}static MASK1(g,S){return~(-1<<g)<<S}LoadCode(g){let S=this.LoadInt(),xe=Ce;for(let Ae=0;Ae<S;Ae++){oe(this.Z,this.u8,0,this.instructionSize)!==0&&this.error("truncated");let pn=this.dv.getUint32(0,!0);g.code[Ae]={code:pn,opcode:pn>>D&xe.MASK1(an,0),A:pn>>$e&xe.MASK1(re,0),B:pn>>Ke&xe.MASK1(ge,0),C:pn>>ln&xe.MASK1(tn,0),Bx:pn>>Xe&xe.MASK1(Oe,0),Ax:pn>>nn&xe.MASK1(ke,0),sBx:(pn>>Xe&xe.MASK1(Oe,0))-se}}}LoadConstants(g){let S=this.LoadInt();for(let xe=0;xe<S;xe++){let Ae=this.LoadByte();switch(Ae){case R:g.k.push(new ve.TValue(R,null));break;case v:g.k.push(new ve.TValue(v,this.LoadByte()!==0));break;case C:g.k.push(new ve.TValue(C,this.LoadNumber()));break;case j:g.k.push(new ve.TValue(j,this.LoadInteger()));break;case L:case P:g.k.push(new ve.TValue(P,this.LoadString()));break;default:this.error(`unrecognized constant '${Ae}'`)}}}LoadProtos(g){let S=this.LoadInt();for(let xe=0;xe<S;xe++)g.p[xe]=new $.Proto(this.L),this.LoadFunction(g.p[xe],g.source)}LoadUpvalues(g){let S=this.LoadInt();for(let xe=0;xe<S;xe++)g.upvalues[xe]={name:null,instack:this.LoadByte(),idx:this.LoadByte()}}LoadDebug(g){let S=this.LoadInt();for(let xe=0;xe<S;xe++)g.lineinfo[xe]=this.LoadInt();S=this.LoadInt();for(let xe=0;xe<S;xe++)g.locvars[xe]={varname:this.LoadString(),startpc:this.LoadInt(),endpc:this.LoadInt()};S=this.LoadInt();for(let xe=0;xe<S;xe++)g.upvalues[xe].name=this.LoadString()}LoadFunction(g,S){g.source=this.LoadString(),g.source===null&&(g.source=S),g.linedefined=this.LoadInt(),g.lastlinedefined=this.LoadInt(),g.numparams=this.LoadByte(),g.is_vararg=this.LoadByte()!==0,g.maxstacksize=this.LoadByte(),this.LoadCode(g),this.LoadConstants(g),this.LoadUpvalues(g),this.LoadProtos(g),this.LoadDebug(g)}checkliteral(g,S){let xe=this.read(g.length);B(xe,g)||this.error(S)}checkHeader(){this.checkliteral(k.subarray(1),"not a"),this.LoadByte()!==83&&this.error("version mismatch in"),this.LoadByte()!==0&&this.error("format mismatch in"),this.checkliteral(M,"corrupted"),this.intSize=this.LoadByte(),this.size_tSize=this.LoadByte(),this.instructionSize=this.LoadByte(),this.integerSize=this.LoadByte(),this.numberSize=this.LoadByte(),this.checksize(this.intSize,4,"int"),this.checksize(this.size_tSize,4,"size_t"),this.checksize(this.instructionSize,4,"instruction"),this.checksize(this.integerSize,4,"integer"),this.checksize(this.numberSize,8,"number"),this.LoadInteger()!==22136&&this.error("endianness mismatch in"),this.LoadNumber()!==370.5&&this.error("float format mismatch in")}error(g){ve.luaO_pushfstring(this.L,Q("%s: %s precompiled chunk"),this.name,Q(g)),ce.luaD_throw(this.L,H)}checksize(g,S,xe){g!==S&&this.error(`${xe} size mismatch in`)}}a.exports.luaU_undump=function(T,g,S){let xe=new Ce(T,g,S);xe.checkHeader();let Ae=$.luaF_newLclosure(T,xe.LoadByte());return ce.luaD_inctop(T),T.stack[T.top-1].setclLvalue(Ae),Ae.p=new $.Proto(T),xe.LoadFunction(Ae.p,null),sn(Ae.nupvalues===Ae.p.upvalues.length),Ae}},function(a,z,d){const{LUA_SIGNATURE:k,LUA_VERSION_MAJOR:v,LUA_VERSION_MINOR:P,constant_types:{LUA_TBOOLEAN:R,LUA_TLNGSTR:C,LUA_TNIL:j,LUA_TNUMFLT:L,LUA_TNUMINT:H,LUA_TSHRSTR:w},luastring_of:B}=d(1),Q=B(25,147,13,10,26,10),ce=16*Number(v)+Number(P),$=function(ln,D,re){re.status===0&&D>0&&(re.status=re.writer(re.L,ln,D,re.data))},ve=function(ln,D){$(B(ln),1,D)},se=function(ln,D){let re=new ArrayBuffer(4);new DataView(re).setInt32(0,ln,!0);let ke=new Uint8Array(re);$(ke,4,D)},$e=function(ln,D){let re=new ArrayBuffer(4);new DataView(re).setInt32(0,ln,!0);let ke=new Uint8Array(re);$(ke,4,D)},nn=function(ln,D){let re=new ArrayBuffer(8);new DataView(re).setFloat64(0,ln,!0);let ke=new Uint8Array(re);$(ke,8,D)},Ke=function(ln,D){if(ln===null)ve(0,D);else{let re=ln.tsslen()+1,ke=ln.getstr();re<255?ve(re,D):(ve(255,D),$e(re,D)),$(ke,re-1,D)}},Xe=function(ln,D,re){re.strip||ln.source===D?Ke(null,re):Ke(ln.source,re),se(ln.linedefined,re),se(ln.lastlinedefined,re),ve(ln.numparams,re),ve(ln.is_vararg?1:0,re),ve(ln.maxstacksize,re),(function(ke,ge){let Oe=ke.code.map(tn=>tn.code);se(Oe.length,ge);for(let tn=0;tn<Oe.length;tn++)se(Oe[tn],ge)})(ln,re),(function(ke,ge){let Oe=ke.k.length;se(Oe,ge);for(let tn=0;tn<Oe;tn++){let an=ke.k[tn];switch(ve(an.ttype(),ge),an.ttype()){case j:break;case R:ve(an.value?1:0,ge);break;case L:nn(an.value,ge);break;case H:$e(an.value,ge);break;case w:case C:Ke(an.tsvalue(),ge)}}})(ln,re),(function(ke,ge){let Oe=ke.upvalues.length;se(Oe,ge);for(let tn=0;tn<Oe;tn++)ve(ke.upvalues[tn].instack?1:0,ge),ve(ke.upvalues[tn].idx,ge)})(ln,re),(function(ke,ge){let Oe=ke.p.length;se(Oe,ge);for(let tn=0;tn<Oe;tn++)Xe(ke.p[tn],ke.source,ge)})(ln,re),(function(ke,ge){let Oe=ge.strip?0:ke.lineinfo.length;se(Oe,ge);for(let tn=0;tn<Oe;tn++)se(ke.lineinfo[tn],ge);Oe=ge.strip?0:ke.locvars.length,se(Oe,ge);for(let tn=0;tn<Oe;tn++)Ke(ke.locvars[tn].varname,ge),se(ke.locvars[tn].startpc,ge),se(ke.locvars[tn].endpc,ge);Oe=ge.strip?0:ke.upvalues.length,se(Oe,ge);for(let tn=0;tn<Oe;tn++)Ke(ke.upvalues[tn].name,ge)})(ln,re)};a.exports.luaU_dump=function(ln,D,re,ke,ge){let Oe=new class{constructor(){this.L=null,this.write=null,this.data=null,this.strip=NaN,this.status=NaN}};return Oe.L=ln,Oe.writer=re,Oe.data=ke,Oe.strip=ge,Oe.status=0,(function(tn){$(k,k.length,tn),ve(ce,tn),ve(0,tn),$(Q,Q.length,tn),ve(4,tn),ve(4,tn),ve(4,tn),ve(4,tn),ve(8,tn),$e(22136,tn),nn(370.5,tn)})(Oe),ve(D.upvalues.length,Oe),Xe(D,null,Oe),Oe.status}},function(a,z,d){var k;(function(){var v={not_type:/[^T]/,not_primitive:/[^v]/,number:/[diefg]/,numeric_arg:/[bcdiefguxX]/,json:/[j]/,text:/^[^\x25]+/,modulo:/^\x25{2}/,placeholder:/^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-gijostTuvxX])/,key:/^([a-z_][a-z_\d]*)/i,key_access:/^\.([a-z_][a-z_\d]*)/i,index_access:/^\[(\d+)\]/,sign:/^[\+\-]/};function P(j){return(function(L,H){var w,B,Q,ce,$,ve,se,$e,nn,Ke=1,Xe=L.length,ln="";for(B=0;B<Xe;B++)if(typeof L[B]=="string")ln+=L[B];else if(Array.isArray(L[B])){if((ce=L[B])[2])for(w=H[Ke],Q=0;Q<ce[2].length;Q++){if(!w.hasOwnProperty(ce[2][Q]))throw new Error(P('[sprintf] property "%s" does not exist',ce[2][Q]));w=w[ce[2][Q]]}else w=ce[1]?H[ce[1]]:H[Ke++];if(v.not_type.test(ce[8])&&v.not_primitive.test(ce[8])&&w instanceof Function&&(w=w()),v.numeric_arg.test(ce[8])&&typeof w!="number"&&isNaN(w))throw new TypeError(P("[sprintf] expecting number but found %T",w));switch(v.number.test(ce[8])&&($e=w>=0),ce[8]){case"b":w=parseInt(w,10).toString(2);break;case"c":w=String.fromCharCode(parseInt(w,10));break;case"d":case"i":w=parseInt(w,10);break;case"j":w=JSON.stringify(w,null,ce[6]?parseInt(ce[6]):0);break;case"e":w=ce[7]?parseFloat(w).toExponential(ce[7]):parseFloat(w).toExponential();break;case"f":w=ce[7]?parseFloat(w).toFixed(ce[7]):parseFloat(w);break;case"g":w=ce[7]?String(Number(w.toPrecision(ce[7]))):parseFloat(w);break;case"o":w=(parseInt(w,10)>>>0).toString(8);break;case"s":w=String(w),w=ce[7]?w.substring(0,ce[7]):w;break;case"t":w=String(!!w),w=ce[7]?w.substring(0,ce[7]):w;break;case"T":w=Object.prototype.toString.call(w).slice(8,-1).toLowerCase(),w=ce[7]?w.substring(0,ce[7]):w;break;case"u":w=parseInt(w,10)>>>0;break;case"v":w=w.valueOf(),w=ce[7]?w.substring(0,ce[7]):w;break;case"x":w=(parseInt(w,10)>>>0).toString(16);break;case"X":w=(parseInt(w,10)>>>0).toString(16).toUpperCase()}v.json.test(ce[8])?ln+=w:(!v.number.test(ce[8])||$e&&!ce[3]?nn="":(nn=$e?"+":"-",w=w.toString().replace(v.sign,"")),ve=ce[4]?ce[4]==="0"?"0":ce[4].charAt(1):" ",se=ce[6]-(nn+w).length,$=ce[6]&&se>0?ve.repeat(se):"",ln+=ce[5]?nn+w+$:ve==="0"?nn+$+w:$+nn+w)}return ln})((function(L){if(C[L])return C[L];for(var H,w=L,B=[],Q=0;w;){if((H=v.text.exec(w))!==null)B.push(H[0]);else if((H=v.modulo.exec(w))!==null)B.push("%");else{if((H=v.placeholder.exec(w))===null)throw new SyntaxError("[sprintf] unexpected placeholder");if(H[2]){Q|=1;var ce=[],$=H[2],ve=[];if((ve=v.key.exec($))===null)throw new SyntaxError("[sprintf] failed to parse named argument key");for(ce.push(ve[1]);($=$.substring(ve[0].length))!=="";)if((ve=v.key_access.exec($))!==null)ce.push(ve[1]);else{if((ve=v.index_access.exec($))===null)throw new SyntaxError("[sprintf] failed to parse named argument key");ce.push(ve[1])}H[2]=ce}else Q|=2;if(Q===3)throw new Error("[sprintf] mixing positional and named placeholders is not (yet) supported");B.push(H)}w=w.substring(H[0].length)}return C[L]=B})(j),arguments)}function R(j,L){return P.apply(null,[j].concat(L||[]))}var C=Object.create(null);z.sprintf=P,z.vsprintf=R,typeof window<"u"&&(window.sprintf=P,window.vsprintf=R,(k=(function(){return{sprintf:P,vsprintf:R}}).call(z,d,z,a))===void 0||(a.exports=k))})()},function(a,z,d){const{lua_pop:k}=d(2),{luaL_requiref:v}=d(7),{to_luastring:P}=d(5),R={};a.exports.luaL_openlibs=function($e){for(let nn in R)v($e,P(nn),R[nn],1),k($e,1)};const C=d(17),{luaopen_base:j}=d(24),{luaopen_coroutine:L}=d(25),{luaopen_debug:H}=d(31),{luaopen_math:w}=d(30),{luaopen_package:B}=d(32),{luaopen_os:Q}=d(27),{luaopen_string:ce}=d(28),{luaopen_table:$}=d(26),{luaopen_utf8:ve}=d(29);R._G=j,R[C.LUA_LOADLIBNAME]=B,R[C.LUA_COLIBNAME]=L,R[C.LUA_TABLIBNAME]=$,R[C.LUA_OSLIBNAME]=Q,R[C.LUA_STRLIBNAME]=ce,R[C.LUA_MATHLIBNAME]=w,R[C.LUA_UTF8LIBNAME]=ve,R[C.LUA_DBLIBNAME]=H;const{luaopen_fengari:se}=d(33);R[C.LUA_FENGARILIBNAME]=se}])),Yi}var Qc=U_();const Zc=Ji(Qc),P_=Rf({__proto__:null,default:Zc},[Qc]),mo=Zc??P_,dt=mo.lua,$i=mo.lauxlib,D_=mo.lualib,Jc=mo,hl=Jc.to_luastring??(a=>a),Zi=Jc.to_jsstring??(a=>String(a));function Oc(a){try{const z=dt.lua_tostring(a,-1);return z!=null?Zi(z):"unknown error"}catch{return"unknown error"}}class G_{constructor(z,d=42,k=""){pc(this,"L");this.L=$i.luaL_newstate(),D_.luaL_openlibs(this.L),this.seedRandom(d);const v=k?k+`

`+z:z;if($i.luaL_dostring(this.L,hl(v))!==dt.LUA_OK){const R=Oc(this.L);throw dt.lua_pop(this.L,1),new ho(`Lua load error: ${R}`)}}call(z,...d){if(dt.lua_getglobal(this.L,hl(z)),dt.lua_type(this.L,-1)!==dt.LUA_TFUNCTION)throw dt.lua_pop(this.L,1),new ho(`Lua function not found: ${z}`);for(const P of d)this.pushValue(P);if(dt.lua_pcall(this.L,d.length,1,0)!==dt.LUA_OK){const P=Oc(this.L);throw dt.lua_pop(this.L,1),new ho(`Lua error in ${z}: ${P}`)}const v=this.pullValue(-1);return dt.lua_pop(this.L,1),v}seedRandom(z){$i.luaL_dostring(this.L,hl(`math.randomseed(${z})`))}pushValue(z){if(z==null)dt.lua_pushnil(this.L);else if(typeof z=="boolean")dt.lua_pushboolean(this.L,z?1:0);else if(typeof z=="number")dt.lua_pushnumber(this.L,z);else if(typeof z=="string")dt.lua_pushstring(this.L,hl(z));else if(Array.isArray(z))dt.lua_newtable(this.L),z.forEach((d,k)=>{dt.lua_pushnumber(this.L,k+1),this.pushValue(d),dt.lua_settable(this.L,-3)});else if(typeof z=="object"){dt.lua_newtable(this.L);for(const[d,k]of Object.entries(z))dt.lua_pushstring(this.L,hl(d)),this.pushValue(k),dt.lua_settable(this.L,-3)}else throw new ho(`Cannot push value of type ${typeof z} to Lua`)}pullValue(z){switch(dt.lua_type(this.L,z)){case dt.LUA_TNIL:return null;case dt.LUA_TBOOLEAN:return!!dt.lua_toboolean(this.L,z);case dt.LUA_TNUMBER:return dt.lua_tonumber(this.L,z);case dt.LUA_TSTRING:{const k=dt.lua_tostring(this.L,z);return k!=null?Zi(k):null}case dt.LUA_TTABLE:return this.pullTable(z);default:return null}}pullTable(z){const d=z<0?dt.lua_gettop(this.L)+z+1:z,k={};let v=!0,P=0;for(dt.lua_pushnil(this.L);dt.lua_next(this.L,d)!==0;){const R=dt.lua_type(this.L,-2);let C;if(R===dt.LUA_TNUMBER)C=dt.lua_tonumber(this.L,-2),!Number.isInteger(C)||C<1?v=!1:P=Math.max(P,C);else{const j=dt.lua_tostring(this.L,-2);C=j!=null?Zi(j):String(Math.random()),v=!1}k[C]=this.pullValue(-1),dt.lua_pop(this.L,1)}if(v&&P===Object.keys(k).length){const R=[];for(let C=1;C<=P;C++)R.push(k[C]);return R}return k}}function B_(a,z=42){const d=$c(a),k=new G_(d.logic,z,d.engineSource);return{gameId:a,files:d,executor:k}}function rh(a,z,...d){return a.executor.call(z,...d)}function ah(a,z){const d=a.files.data[z];if(!d)throw new n_(`Schema not found: ${z}`);return d.fields??d}function F_({gameId:a}){const[z,d]=ya.useState(null),[k,v]=ya.useState(null),[P,R]=ya.useState(null);ya.useEffect(()=>{const L=bc(a);if(L!=null&&L.embedUrl)return;if(L!=null&&L.externalUrl){window.open(L.externalUrl,"_blank","noopener,noreferrer"),Wi();return}let H=!1;return(async()=>{try{const w=await B_(a,42);if(!L){R(`Game "${a}" loaded successfully but has no registered config in registry.ts — this is a studio configuration error, not a player-facing one. Check that the game is added to GAME_REGISTRY.`);return}H||(d(w),v(L))}catch(w){H||R(w instanceof Error?w.message:`Failed to load game: ${a}`)}})(),()=>{H=!0}},[a]);const C=bc(a);if(C!=null&&C.embedUrl)if(C.embedWidth&&C.embedHeight){const L=C.embedHeight/C.embedWidth*100;return tt.jsxs("div",{className:"arcade-game-wrap",children:[tt.jsx("div",{className:"arcade-game-lobby-bar",children:tt.jsx("button",{onClick:Wi,className:"arcade-back-to-lobby",children:"← Back to Arcade"})}),tt.jsxs("div",{className:"arcade-game-content",style:{position:"relative",width:"100%",maxWidth:`${C.embedWidth}px`,margin:"0 auto"},children:[tt.jsx("div",{style:{position:"relative",width:"100%",paddingTop:`${L}%`},children:tt.jsx("iframe",{src:C.embedUrl,allowFullScreen:!0,style:{position:"absolute",top:0,left:0,width:"100%",height:"100%",border:0},title:`${C.label} — playable embed`})}),C.externalUrl&&tt.jsx("a",{href:C.externalUrl,target:"_blank",rel:"noopener noreferrer",style:{display:"block",textAlign:"center",marginTop:"8px",fontSize:"0.8rem"},children:"Open on itch.io ↗"})]})]})}else return tt.jsxs("div",{className:"arcade-game-wrap",children:[tt.jsx("div",{className:"arcade-game-lobby-bar",children:tt.jsx("button",{onClick:Wi,className:"arcade-back-to-lobby",children:"← Back to Arcade"})}),tt.jsx("div",{style:{width:"100%",maxWidth:"1200px",height:"min(85vh, 900px)",margin:"0 auto"},children:tt.jsx("iframe",{src:C.embedUrl,style:{width:"100%",height:"100%",border:0},title:`${C.label} — playable embed`})})]});if(P)return tt.jsx("div",{className:"arcade-error",children:tt.jsxs("div",{className:"arcade-error-box",children:[tt.jsx("strong",{children:"Studio Error"}),tt.jsx("p",{children:P}),tt.jsxs("small",{children:["Game ID: ",a]})]})});if(!z||!k)return tt.jsx("div",{className:"arcade-loading",children:tt.jsxs("span",{children:["Loading ",a,"…"]})});const j=k.component;return j?tt.jsx("div",{className:"arcade-game-wrap",children:tt.jsx("div",{className:"arcade-game-content",children:tt.jsx(Ur.Suspense,{fallback:tt.jsx("div",{className:"arcade-loading",children:"Loading renderer…"}),children:tt.jsx(j,{session:z})})})}):tt.jsx("div",{className:"arcade-error",children:tt.jsxs("div",{className:"arcade-error-box",children:[tt.jsx("strong",{children:"No Renderer"}),tt.jsxs("p",{children:['Game "',a,'" has no in-app component. It may be an external game.']})]})})}function V_(){const a=N_();return a?tt.jsx(F_,{gameId:a}):tt.jsx(I_,{})}const Rc=document.getElementById("root");Rc&&Ff.createRoot(Rc).render(tt.jsx(V_,{}));export{n_ as R,Ur as a,rh as c,ah as g,tt as j,Wi as n,ya as r};
