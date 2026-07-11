const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/App-Bnkwc3A3.js","assets/useLuaCall-SSNY0-3u.js","assets/GameShell-BJyjmHIS.js","assets/proxy-C7o6pgOO.js","assets/createLucideIcon-DKrEXTa-.js","assets/App-CWEhOl1U.css","assets/App-7fR4UAeZ.js","assets/shield-DR0kpivn.js","assets/Modal-BvXPVCCW.js","assets/App-B8LPoEUy.css","assets/App-CqfMCql3.js","assets/useGameState-DYE6D_cn.js","assets/App-DTWyOwS1.css","assets/App-6kgo7ZI8.js","assets/App-C_QE1ECA.css","assets/App-VBPPGOF0.js","assets/App-CteJsk9x.css","assets/App-Dl2kL4xm.js","assets/App-DHxkqi3v.css"])))=>i.map(i=>d[i]);
var Ed=Object.defineProperty;var Ld=(a,B,f)=>B in a?Ed(a,B,{enumerable:!0,configurable:!0,writable:!0,value:f}):a[B]=f;var dc=(a,B,f)=>Ld(a,typeof B!="symbol"?B+"":B,f);function bd(a,B){for(var f=0;f<B.length;f++){const w=B[f];if(typeof w!="string"&&!Array.isArray(w)){for(const v in w)if(v!=="default"&&!(v in a)){const D=Object.getOwnPropertyDescriptor(w,v);D&&Object.defineProperty(a,v,D.get?D:{enumerable:!0,get:()=>w[v]})}}}return Object.freeze(Object.defineProperty(a,Symbol.toStringTag,{value:"Module"}))}(function(){const B=document.createElement("link").relList;if(B&&B.supports&&B.supports("modulepreload"))return;for(const v of document.querySelectorAll('link[rel="modulepreload"]'))w(v);new MutationObserver(v=>{for(const D of v)if(D.type==="childList")for(const R of D.addedNodes)R.tagName==="LINK"&&R.rel==="modulepreload"&&w(R)}).observe(document,{childList:!0,subtree:!0});function f(v){const D={};return v.integrity&&(D.integrity=v.integrity),v.referrerPolicy&&(D.referrerPolicy=v.referrerPolicy),v.crossOrigin==="use-credentials"?D.credentials="include":v.crossOrigin==="anonymous"?D.credentials="omit":D.credentials="same-origin",D}function w(v){if(v.ep)return;v.ep=!0;const D=f(v);fetch(v.href,D)}})();function Zi(a){return a&&a.__esModule&&Object.prototype.hasOwnProperty.call(a,"default")?a.default:a}var ji={exports:{}},_l={},zi={exports:{}},ct={};/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var pc;function Sd(){if(pc)return ct;pc=1;var a=Symbol.for("react.element"),B=Symbol.for("react.portal"),f=Symbol.for("react.fragment"),w=Symbol.for("react.strict_mode"),v=Symbol.for("react.profiler"),D=Symbol.for("react.provider"),R=Symbol.for("react.context"),U=Symbol.for("react.forward_ref"),z=Symbol.for("react.suspense"),b=Symbol.for("react.memo"),K=Symbol.for("react.lazy"),A=Symbol.iterator;function F(g){return g===null||typeof g!="object"?null:(g=A&&g[A]||g["@@iterator"],typeof g=="function"?g:null)}var Q={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},ce=Object.assign,$={};function ve(g,S,xe){this.props=g,this.context=S,this.refs=$,this.updater=xe||Q}ve.prototype.isReactComponent={},ve.prototype.setState=function(g,S){if(typeof g!="object"&&typeof g!="function"&&g!=null)throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,g,S,"setState")},ve.prototype.forceUpdate=function(g){this.updater.enqueueForceUpdate(this,g,"forceUpdate")};function se(){}se.prototype=ve.prototype;function $e(g,S,xe){this.props=g,this.context=S,this.refs=$,this.updater=xe||Q}var nn=$e.prototype=new se;nn.constructor=$e,ce(nn,ve.prototype),nn.isPureReactComponent=!0;var He=Array.isArray,Xe=Object.prototype.hasOwnProperty,ln={current:null},P={key:!0,ref:!0,__self:!0,__source:!0};function re(g,S,xe){var Te,pn={},Ze=null,fn=null;if(S!=null)for(Te in S.ref!==void 0&&(fn=S.ref),S.key!==void 0&&(Ze=""+S.key),S)Xe.call(S,Te)&&!P.hasOwnProperty(Te)&&(pn[Te]=S[Te]);var mn=arguments.length-2;if(mn===1)pn.children=xe;else if(1<mn){for(var q=Array(mn),ee=0;ee<mn;ee++)q[ee]=arguments[ee+2];pn.children=q}if(g&&g.defaultProps)for(Te in mn=g.defaultProps,mn)pn[Te]===void 0&&(pn[Te]=mn[Te]);return{$$typeof:a,type:g,key:Ze,ref:fn,props:pn,_owner:ln.current}}function Ae(g,S){return{$$typeof:a,type:g.type,key:S,ref:g.ref,props:g.props,_owner:g._owner}}function ge(g){return typeof g=="object"&&g!==null&&g.$$typeof===a}function Oe(g){var S={"=":"=0",":":"=2"};return"$"+g.replace(/[=:]/g,function(xe){return S[xe]})}var tn=/\/+/g;function an(g,S){return typeof g=="object"&&g!==null&&g.key!=null?Oe(""+g.key):S.toString(36)}function sn(g,S,xe,Te,pn){var Ze=typeof g;(Ze==="undefined"||Ze==="boolean")&&(g=null);var fn=!1;if(g===null)fn=!0;else switch(Ze){case"string":case"number":fn=!0;break;case"object":switch(g.$$typeof){case a:case B:fn=!0}}if(fn)return fn=g,pn=pn(fn),g=Te===""?"."+an(fn,0):Te,He(pn)?(xe="",g!=null&&(xe=g.replace(tn,"$&/")+"/"),sn(pn,S,xe,"",function(ee){return ee})):pn!=null&&(ge(pn)&&(pn=Ae(pn,xe+(!pn.key||fn&&fn.key===pn.key?"":(""+pn.key).replace(tn,"$&/")+"/")+g)),S.push(pn)),1;if(fn=0,Te=Te===""?".":Te+":",He(g))for(var mn=0;mn<g.length;mn++){Ze=g[mn];var q=Te+an(Ze,mn);fn+=sn(Ze,S,xe,q,pn)}else if(q=F(g),typeof q=="function")for(g=q.call(g),mn=0;!(Ze=g.next()).done;)Ze=Ze.value,q=Te+an(Ze,mn++),fn+=sn(Ze,S,xe,q,pn);else if(Ze==="object")throw S=String(g),Error("Objects are not valid as a React child (found: "+(S==="[object Object]"?"object with keys {"+Object.keys(g).join(", ")+"}":S)+"). If you meant to render a collection of children, use an array instead.");return fn}function ae(g,S,xe){if(g==null)return g;var Te=[],pn=0;return sn(g,Te,"","",function(Ze){return S.call(xe,Ze,pn++)}),Te}function oe(g){if(g._status===-1){var S=g._result;S=S(),S.then(function(xe){(g._status===0||g._status===-1)&&(g._status=1,g._result=xe)},function(xe){(g._status===0||g._status===-1)&&(g._status=2,g._result=xe)}),g._status===-1&&(g._status=0,g._result=S)}if(g._status===1)return g._result.default;throw g._result}var ze={current:null},C={transition:null},Ce={ReactCurrentDispatcher:ze,ReactCurrentBatchConfig:C,ReactCurrentOwner:ln};function E(){throw Error("act(...) is not supported in production builds of React.")}return ct.Children={map:ae,forEach:function(g,S,xe){ae(g,function(){S.apply(this,arguments)},xe)},count:function(g){var S=0;return ae(g,function(){S++}),S},toArray:function(g){return ae(g,function(S){return S})||[]},only:function(g){if(!ge(g))throw Error("React.Children.only expected to receive a single React element child.");return g}},ct.Component=ve,ct.Fragment=f,ct.Profiler=v,ct.PureComponent=$e,ct.StrictMode=w,ct.Suspense=z,ct.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=Ce,ct.act=E,ct.cloneElement=function(g,S,xe){if(g==null)throw Error("React.cloneElement(...): The argument must be a React element, but you passed "+g+".");var Te=ce({},g.props),pn=g.key,Ze=g.ref,fn=g._owner;if(S!=null){if(S.ref!==void 0&&(Ze=S.ref,fn=ln.current),S.key!==void 0&&(pn=""+S.key),g.type&&g.type.defaultProps)var mn=g.type.defaultProps;for(q in S)Xe.call(S,q)&&!P.hasOwnProperty(q)&&(Te[q]=S[q]===void 0&&mn!==void 0?mn[q]:S[q])}var q=arguments.length-2;if(q===1)Te.children=xe;else if(1<q){mn=Array(q);for(var ee=0;ee<q;ee++)mn[ee]=arguments[ee+2];Te.children=mn}return{$$typeof:a,type:g.type,key:pn,ref:Ze,props:Te,_owner:fn}},ct.createContext=function(g){return g={$$typeof:R,_currentValue:g,_currentValue2:g,_threadCount:0,Provider:null,Consumer:null,_defaultValue:null,_globalName:null},g.Provider={$$typeof:D,_context:g},g.Consumer=g},ct.createElement=re,ct.createFactory=function(g){var S=re.bind(null,g);return S.type=g,S},ct.createRef=function(){return{current:null}},ct.forwardRef=function(g){return{$$typeof:U,render:g}},ct.isValidElement=ge,ct.lazy=function(g){return{$$typeof:K,_payload:{_status:-1,_result:g},_init:oe}},ct.memo=function(g,S){return{$$typeof:b,type:g,compare:S===void 0?null:S}},ct.startTransition=function(g){var S=C.transition;C.transition={};try{g()}finally{C.transition=S}},ct.unstable_act=E,ct.useCallback=function(g,S){return ze.current.useCallback(g,S)},ct.useContext=function(g){return ze.current.useContext(g)},ct.useDebugValue=function(){},ct.useDeferredValue=function(g){return ze.current.useDeferredValue(g)},ct.useEffect=function(g,S){return ze.current.useEffect(g,S)},ct.useId=function(){return ze.current.useId()},ct.useImperativeHandle=function(g,S,xe){return ze.current.useImperativeHandle(g,S,xe)},ct.useInsertionEffect=function(g,S){return ze.current.useInsertionEffect(g,S)},ct.useLayoutEffect=function(g,S){return ze.current.useLayoutEffect(g,S)},ct.useMemo=function(g,S){return ze.current.useMemo(g,S)},ct.useReducer=function(g,S,xe){return ze.current.useReducer(g,S,xe)},ct.useRef=function(g){return ze.current.useRef(g)},ct.useState=function(g){return ze.current.useState(g)},ct.useSyncExternalStore=function(g,S,xe){return ze.current.useSyncExternalStore(g,S,xe)},ct.useTransition=function(){return ze.current.useTransition()},ct.version="18.3.1",ct}var _c;function Ji(){return _c||(_c=1,zi.exports=Sd()),zi.exports}/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var hc;function Od(){if(hc)return _l;hc=1;var a=Ji(),B=Symbol.for("react.element"),f=Symbol.for("react.fragment"),w=Object.prototype.hasOwnProperty,v=a.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,D={key:!0,ref:!0,__self:!0,__source:!0};function R(U,z,b){var K,A={},F=null,Q=null;b!==void 0&&(F=""+b),z.key!==void 0&&(F=""+z.key),z.ref!==void 0&&(Q=z.ref);for(K in z)w.call(z,K)&&!D.hasOwnProperty(K)&&(A[K]=z[K]);if(U&&U.defaultProps)for(K in z=U.defaultProps,z)A[K]===void 0&&(A[K]=z[K]);return{$$typeof:B,type:U,key:F,ref:Q,props:A,_owner:v.current}}return _l.Fragment=f,_l.jsx=R,_l.jsxs=R,_l}var mc;function Rd(){return mc||(mc=1,ji.exports=Od()),ji.exports}var lt=Rd(),_o={},Ki={exports:{}},nr={},Hi={exports:{}},Xi={};/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var gc;function Nd(){return gc||(gc=1,(function(a){function B(C,Ce){var E=C.length;C.push(Ce);e:for(;0<E;){var g=E-1>>>1,S=C[g];if(0<v(S,Ce))C[g]=Ce,C[E]=S,E=g;else break e}}function f(C){return C.length===0?null:C[0]}function w(C){if(C.length===0)return null;var Ce=C[0],E=C.pop();if(E!==Ce){C[0]=E;e:for(var g=0,S=C.length,xe=S>>>1;g<xe;){var Te=2*(g+1)-1,pn=C[Te],Ze=Te+1,fn=C[Ze];if(0>v(pn,E))Ze<S&&0>v(fn,pn)?(C[g]=fn,C[Ze]=E,g=Ze):(C[g]=pn,C[Te]=E,g=Te);else if(Ze<S&&0>v(fn,E))C[g]=fn,C[Ze]=E,g=Ze;else break e}}return Ce}function v(C,Ce){var E=C.sortIndex-Ce.sortIndex;return E!==0?E:C.id-Ce.id}if(typeof performance=="object"&&typeof performance.now=="function"){var D=performance;a.unstable_now=function(){return D.now()}}else{var R=Date,U=R.now();a.unstable_now=function(){return R.now()-U}}var z=[],b=[],K=1,A=null,F=3,Q=!1,ce=!1,$=!1,ve=typeof setTimeout=="function"?setTimeout:null,se=typeof clearTimeout=="function"?clearTimeout:null,$e=typeof setImmediate<"u"?setImmediate:null;typeof navigator<"u"&&navigator.scheduling!==void 0&&navigator.scheduling.isInputPending!==void 0&&navigator.scheduling.isInputPending.bind(navigator.scheduling);function nn(C){for(var Ce=f(b);Ce!==null;){if(Ce.callback===null)w(b);else if(Ce.startTime<=C)w(b),Ce.sortIndex=Ce.expirationTime,B(z,Ce);else break;Ce=f(b)}}function He(C){if($=!1,nn(C),!ce)if(f(z)!==null)ce=!0,oe(Xe);else{var Ce=f(b);Ce!==null&&ze(He,Ce.startTime-C)}}function Xe(C,Ce){ce=!1,$&&($=!1,se(re),re=-1),Q=!0;var E=F;try{for(nn(Ce),A=f(z);A!==null&&(!(A.expirationTime>Ce)||C&&!Oe());){var g=A.callback;if(typeof g=="function"){A.callback=null,F=A.priorityLevel;var S=g(A.expirationTime<=Ce);Ce=a.unstable_now(),typeof S=="function"?A.callback=S:A===f(z)&&w(z),nn(Ce)}else w(z);A=f(z)}if(A!==null)var xe=!0;else{var Te=f(b);Te!==null&&ze(He,Te.startTime-Ce),xe=!1}return xe}finally{A=null,F=E,Q=!1}}var ln=!1,P=null,re=-1,Ae=5,ge=-1;function Oe(){return!(a.unstable_now()-ge<Ae)}function tn(){if(P!==null){var C=a.unstable_now();ge=C;var Ce=!0;try{Ce=P(!0,C)}finally{Ce?an():(ln=!1,P=null)}}else ln=!1}var an;if(typeof $e=="function")an=function(){$e(tn)};else if(typeof MessageChannel<"u"){var sn=new MessageChannel,ae=sn.port2;sn.port1.onmessage=tn,an=function(){ae.postMessage(null)}}else an=function(){ve(tn,0)};function oe(C){P=C,ln||(ln=!0,an())}function ze(C,Ce){re=ve(function(){C(a.unstable_now())},Ce)}a.unstable_IdlePriority=5,a.unstable_ImmediatePriority=1,a.unstable_LowPriority=4,a.unstable_NormalPriority=3,a.unstable_Profiling=null,a.unstable_UserBlockingPriority=2,a.unstable_cancelCallback=function(C){C.callback=null},a.unstable_continueExecution=function(){ce||Q||(ce=!0,oe(Xe))},a.unstable_forceFrameRate=function(C){0>C||125<C?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):Ae=0<C?Math.floor(1e3/C):5},a.unstable_getCurrentPriorityLevel=function(){return F},a.unstable_getFirstCallbackNode=function(){return f(z)},a.unstable_next=function(C){switch(F){case 1:case 2:case 3:var Ce=3;break;default:Ce=F}var E=F;F=Ce;try{return C()}finally{F=E}},a.unstable_pauseExecution=function(){},a.unstable_requestPaint=function(){},a.unstable_runWithPriority=function(C,Ce){switch(C){case 1:case 2:case 3:case 4:case 5:break;default:C=3}var E=F;F=C;try{return Ce()}finally{F=E}},a.unstable_scheduleCallback=function(C,Ce,E){var g=a.unstable_now();switch(typeof E=="object"&&E!==null?(E=E.delay,E=typeof E=="number"&&0<E?g+E:g):E=g,C){case 1:var S=-1;break;case 2:S=250;break;case 5:S=1073741823;break;case 4:S=1e4;break;default:S=5e3}return S=E+S,C={id:K++,callback:Ce,priorityLevel:C,startTime:E,expirationTime:S,sortIndex:-1},E>g?(C.sortIndex=E,B(b,C),f(z)===null&&C===f(b)&&($?(se(re),re=-1):$=!0,ze(He,E-g))):(C.sortIndex=S,B(z,C),ce||Q||(ce=!0,oe(Xe))),C},a.unstable_shouldYield=Oe,a.unstable_wrapCallback=function(C){var Ce=F;return function(){var E=F;F=Ce;try{return C.apply(this,arguments)}finally{F=E}}}})(Xi)),Xi}var yc;function Cd(){return yc||(yc=1,Hi.exports=Nd()),Hi.exports}/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var vc;function Md(){if(vc)return nr;vc=1;var a=Ji(),B=Cd();function f(e){for(var n="https://reactjs.org/docs/error-decoder.html?invariant="+e,t=1;t<arguments.length;t++)n+="&args[]="+encodeURIComponent(arguments[t]);return"Minified React error #"+e+"; visit "+n+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}var w=new Set,v={};function D(e,n){R(e,n),R(e+"Capture",n)}function R(e,n){for(v[e]=n,e=0;e<n.length;e++)w.add(n[e])}var U=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),z=Object.prototype.hasOwnProperty,b=/^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,K={},A={};function F(e){return z.call(A,e)?!0:z.call(K,e)?!1:b.test(e)?A[e]=!0:(K[e]=!0,!1)}function Q(e,n,t,r){if(t!==null&&t.type===0)return!1;switch(typeof n){case"function":case"symbol":return!0;case"boolean":return r?!1:t!==null?!t.acceptsBooleans:(e=e.toLowerCase().slice(0,5),e!=="data-"&&e!=="aria-");default:return!1}}function ce(e,n,t,r){if(n===null||typeof n>"u"||Q(e,n,t,r))return!0;if(r)return!1;if(t!==null)switch(t.type){case 3:return!n;case 4:return n===!1;case 5:return isNaN(n);case 6:return isNaN(n)||1>n}return!1}function $(e,n,t,r,i,u,x){this.acceptsBooleans=n===2||n===3||n===4,this.attributeName=r,this.attributeNamespace=i,this.mustUseProperty=t,this.propertyName=e,this.type=n,this.sanitizeURL=u,this.removeEmptyString=x}var ve={};"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(e){ve[e]=new $(e,0,!1,e,null,!1,!1)}),[["acceptCharset","accept-charset"],["className","class"],["htmlFor","for"],["httpEquiv","http-equiv"]].forEach(function(e){var n=e[0];ve[n]=new $(n,1,!1,e[1],null,!1,!1)}),["contentEditable","draggable","spellCheck","value"].forEach(function(e){ve[e]=new $(e,2,!1,e.toLowerCase(),null,!1,!1)}),["autoReverse","externalResourcesRequired","focusable","preserveAlpha"].forEach(function(e){ve[e]=new $(e,2,!1,e,null,!1,!1)}),"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(e){ve[e]=new $(e,3,!1,e.toLowerCase(),null,!1,!1)}),["checked","multiple","muted","selected"].forEach(function(e){ve[e]=new $(e,3,!0,e,null,!1,!1)}),["capture","download"].forEach(function(e){ve[e]=new $(e,4,!1,e,null,!1,!1)}),["cols","rows","size","span"].forEach(function(e){ve[e]=new $(e,6,!1,e,null,!1,!1)}),["rowSpan","start"].forEach(function(e){ve[e]=new $(e,5,!1,e.toLowerCase(),null,!1,!1)});var se=/[\-:]([a-z])/g;function $e(e){return e[1].toUpperCase()}"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(e){var n=e.replace(se,$e);ve[n]=new $(n,1,!1,e,null,!1,!1)}),"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(e){var n=e.replace(se,$e);ve[n]=new $(n,1,!1,e,"http://www.w3.org/1999/xlink",!1,!1)}),["xml:base","xml:lang","xml:space"].forEach(function(e){var n=e.replace(se,$e);ve[n]=new $(n,1,!1,e,"http://www.w3.org/XML/1998/namespace",!1,!1)}),["tabIndex","crossOrigin"].forEach(function(e){ve[e]=new $(e,1,!1,e.toLowerCase(),null,!1,!1)}),ve.xlinkHref=new $("xlinkHref",1,!1,"xlink:href","http://www.w3.org/1999/xlink",!0,!1),["src","href","action","formAction"].forEach(function(e){ve[e]=new $(e,1,!1,e.toLowerCase(),null,!0,!0)});function nn(e,n,t,r){var i=ve.hasOwnProperty(n)?ve[n]:null;(i!==null?i.type!==0:r||!(2<n.length)||n[0]!=="o"&&n[0]!=="O"||n[1]!=="n"&&n[1]!=="N")&&(ce(n,t,i,r)&&(t=null),r||i===null?F(n)&&(t===null?e.removeAttribute(n):e.setAttribute(n,""+t)):i.mustUseProperty?e[i.propertyName]=t===null?i.type===3?!1:"":t:(n=i.attributeName,r=i.attributeNamespace,t===null?e.removeAttribute(n):(i=i.type,t=i===3||i===4&&t===!0?"":""+t,r?e.setAttributeNS(r,n,t):e.setAttribute(n,t))))}var He=a.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,Xe=Symbol.for("react.element"),ln=Symbol.for("react.portal"),P=Symbol.for("react.fragment"),re=Symbol.for("react.strict_mode"),Ae=Symbol.for("react.profiler"),ge=Symbol.for("react.provider"),Oe=Symbol.for("react.context"),tn=Symbol.for("react.forward_ref"),an=Symbol.for("react.suspense"),sn=Symbol.for("react.suspense_list"),ae=Symbol.for("react.memo"),oe=Symbol.for("react.lazy"),ze=Symbol.for("react.offscreen"),C=Symbol.iterator;function Ce(e){return e===null||typeof e!="object"?null:(e=C&&e[C]||e["@@iterator"],typeof e=="function"?e:null)}var E=Object.assign,g;function S(e){if(g===void 0)try{throw Error()}catch(t){var n=t.stack.trim().match(/\n( *(at )?)/);g=n&&n[1]||""}return`
`+g+e}var xe=!1;function Te(e,n){if(!e||xe)return"";xe=!0;var t=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{if(n)if(n=function(){throw Error()},Object.defineProperty(n.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(n,[])}catch(qe){var r=qe}Reflect.construct(e,[],n)}else{try{n.call()}catch(qe){r=qe}e.call(n.prototype)}else{try{throw Error()}catch(qe){r=qe}e()}}catch(qe){if(qe&&r&&typeof qe.stack=="string"){for(var i=qe.stack.split(`
`),u=r.stack.split(`
`),x=i.length-1,W=u.length-1;1<=x&&0<=W&&i[x]!==u[W];)W--;for(;1<=x&&0<=W;x--,W--)if(i[x]!==u[W]){if(x!==1||W!==1)do if(x--,W--,0>W||i[x]!==u[W]){var ue=`
`+i[x].replace(" at new "," at ");return e.displayName&&ue.includes("<anonymous>")&&(ue=ue.replace("<anonymous>",e.displayName)),ue}while(1<=x&&0<=W);break}}}finally{xe=!1,Error.prepareStackTrace=t}return(e=e?e.displayName||e.name:"")?S(e):""}function pn(e){switch(e.tag){case 5:return S(e.type);case 16:return S("Lazy");case 13:return S("Suspense");case 19:return S("SuspenseList");case 0:case 2:case 15:return e=Te(e.type,!1),e;case 11:return e=Te(e.type.render,!1),e;case 1:return e=Te(e.type,!0),e;default:return""}}function Ze(e){if(e==null)return null;if(typeof e=="function")return e.displayName||e.name||null;if(typeof e=="string")return e;switch(e){case P:return"Fragment";case ln:return"Portal";case Ae:return"Profiler";case re:return"StrictMode";case an:return"Suspense";case sn:return"SuspenseList"}if(typeof e=="object")switch(e.$$typeof){case Oe:return(e.displayName||"Context")+".Consumer";case ge:return(e._context.displayName||"Context")+".Provider";case tn:var n=e.render;return e=e.displayName,e||(e=n.displayName||n.name||"",e=e!==""?"ForwardRef("+e+")":"ForwardRef"),e;case ae:return n=e.displayName||null,n!==null?n:Ze(e.type)||"Memo";case oe:n=e._payload,e=e._init;try{return Ze(e(n))}catch{}}return null}function fn(e){var n=e.type;switch(e.tag){case 24:return"Cache";case 9:return(n.displayName||"Context")+".Consumer";case 10:return(n._context.displayName||"Context")+".Provider";case 18:return"DehydratedFragment";case 11:return e=n.render,e=e.displayName||e.name||"",n.displayName||(e!==""?"ForwardRef("+e+")":"ForwardRef");case 7:return"Fragment";case 5:return n;case 4:return"Portal";case 3:return"Root";case 6:return"Text";case 16:return Ze(n);case 8:return n===re?"StrictMode":"Mode";case 22:return"Offscreen";case 12:return"Profiler";case 21:return"Scope";case 13:return"Suspense";case 19:return"SuspenseList";case 25:return"TracingMarker";case 1:case 0:case 17:case 2:case 14:case 15:if(typeof n=="function")return n.displayName||n.name||null;if(typeof n=="string")return n}return null}function mn(e){switch(typeof e){case"boolean":case"number":case"string":case"undefined":return e;case"object":return e;default:return""}}function q(e){var n=e.type;return(e=e.nodeName)&&e.toLowerCase()==="input"&&(n==="checkbox"||n==="radio")}function ee(e){var n=q(e)?"checked":"value",t=Object.getOwnPropertyDescriptor(e.constructor.prototype,n),r=""+e[n];if(!e.hasOwnProperty(n)&&typeof t<"u"&&typeof t.get=="function"&&typeof t.set=="function"){var i=t.get,u=t.set;return Object.defineProperty(e,n,{configurable:!0,get:function(){return i.call(this)},set:function(x){r=""+x,u.call(this,x)}}),Object.defineProperty(e,n,{enumerable:t.enumerable}),{getValue:function(){return r},setValue:function(x){r=""+x},stopTracking:function(){e._valueTracker=null,delete e[n]}}}}function Ue(e){e._valueTracker||(e._valueTracker=ee(e))}function Ee(e){if(!e)return!1;var n=e._valueTracker;if(!n)return!0;var t=n.getValue(),r="";return e&&(r=q(e)?e.checked?"true":"false":e.value),e=r,e!==t?(n.setValue(e),!0):!1}function rn(e){if(e=e||(typeof document<"u"?document:void 0),typeof e>"u")return null;try{return e.activeElement||e.body}catch{return e.body}}function On(e,n){var t=n.checked;return E({},n,{defaultChecked:void 0,defaultValue:void 0,value:void 0,checked:t??e._wrapperState.initialChecked})}function An(e,n){var t=n.defaultValue==null?"":n.defaultValue,r=n.checked!=null?n.checked:n.defaultChecked;t=mn(n.value!=null?n.value:t),e._wrapperState={initialChecked:r,initialValue:t,controlled:n.type==="checkbox"||n.type==="radio"?n.checked!=null:n.value!=null}}function Je(e,n){n=n.checked,n!=null&&nn(e,"checked",n,!1)}function le(e,n){Je(e,n);var t=mn(n.value),r=n.type;if(t!=null)r==="number"?(t===0&&e.value===""||e.value!=t)&&(e.value=""+t):e.value!==""+t&&(e.value=""+t);else if(r==="submit"||r==="reset"){e.removeAttribute("value");return}n.hasOwnProperty("value")?N(e,n.type,t):n.hasOwnProperty("defaultValue")&&N(e,n.type,mn(n.defaultValue)),n.checked==null&&n.defaultChecked!=null&&(e.defaultChecked=!!n.defaultChecked)}function Ie(e,n,t){if(n.hasOwnProperty("value")||n.hasOwnProperty("defaultValue")){var r=n.type;if(!(r!=="submit"&&r!=="reset"||n.value!==void 0&&n.value!==null))return;n=""+e._wrapperState.initialValue,t||n===e.value||(e.value=n),e.defaultValue=n}t=e.name,t!==""&&(e.name=""),e.defaultChecked=!!e._wrapperState.initialChecked,t!==""&&(e.name=t)}function N(e,n,t){(n!=="number"||rn(e.ownerDocument)!==e)&&(t==null?e.defaultValue=""+e._wrapperState.initialValue:e.defaultValue!==""+t&&(e.defaultValue=""+t))}var me=Array.isArray;function Ke(e,n,t,r){if(e=e.options,n){n={};for(var i=0;i<t.length;i++)n["$"+t[i]]=!0;for(t=0;t<e.length;t++)i=n.hasOwnProperty("$"+e[t].value),e[t].selected!==i&&(e[t].selected=i),i&&r&&(e[t].defaultSelected=!0)}else{for(t=""+mn(t),n=null,i=0;i<e.length;i++){if(e[i].value===t){e[i].selected=!0,r&&(e[i].defaultSelected=!0);return}n!==null||e[i].disabled||(n=e[i])}n!==null&&(n.selected=!0)}}function G(e,n){if(n.dangerouslySetInnerHTML!=null)throw Error(f(91));return E({},n,{value:void 0,defaultValue:void 0,children:""+e._wrapperState.initialValue})}function we(e,n){var t=n.value;if(t==null){if(t=n.children,n=n.defaultValue,t!=null){if(n!=null)throw Error(f(92));if(me(t)){if(1<t.length)throw Error(f(93));t=t[0]}n=t}n==null&&(n=""),t=n}e._wrapperState={initialValue:mn(t)}}function Pe(e,n){var t=mn(n.value),r=mn(n.defaultValue);t!=null&&(t=""+t,t!==e.value&&(e.value=t),n.defaultValue==null&&e.defaultValue!==t&&(e.defaultValue=t)),r!=null&&(e.defaultValue=""+r)}function Nn(e){var n=e.textContent;n===e._wrapperState.initialValue&&n!==""&&n!==null&&(e.value=n)}function In(e){switch(e){case"svg":return"http://www.w3.org/2000/svg";case"math":return"http://www.w3.org/1998/Math/MathML";default:return"http://www.w3.org/1999/xhtml"}}function Mn(e,n){return e==null||e==="http://www.w3.org/1999/xhtml"?In(n):e==="http://www.w3.org/2000/svg"&&n==="foreignObject"?"http://www.w3.org/1999/xhtml":e}var Zn,ot=(function(e){return typeof MSApp<"u"&&MSApp.execUnsafeLocalFunction?function(n,t,r,i){MSApp.execUnsafeLocalFunction(function(){return e(n,t,r,i)})}:e})(function(e,n){if(e.namespaceURI!=="http://www.w3.org/2000/svg"||"innerHTML"in e)e.innerHTML=n;else{for(Zn=Zn||document.createElement("div"),Zn.innerHTML="<svg>"+n.valueOf().toString()+"</svg>",n=Zn.firstChild;e.firstChild;)e.removeChild(e.firstChild);for(;n.firstChild;)e.appendChild(n.firstChild)}});function o(e,n){if(n){var t=e.firstChild;if(t&&t===e.lastChild&&t.nodeType===3){t.nodeValue=n;return}}e.textContent=n}var fe={animationIterationCount:!0,aspectRatio:!0,borderImageOutset:!0,borderImageSlice:!0,borderImageWidth:!0,boxFlex:!0,boxFlexGroup:!0,boxOrdinalGroup:!0,columnCount:!0,columns:!0,flex:!0,flexGrow:!0,flexPositive:!0,flexShrink:!0,flexNegative:!0,flexOrder:!0,gridArea:!0,gridRow:!0,gridRowEnd:!0,gridRowSpan:!0,gridRowStart:!0,gridColumn:!0,gridColumnEnd:!0,gridColumnSpan:!0,gridColumnStart:!0,fontWeight:!0,lineClamp:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,tabSize:!0,widows:!0,zIndex:!0,zoom:!0,fillOpacity:!0,floodOpacity:!0,stopOpacity:!0,strokeDasharray:!0,strokeDashoffset:!0,strokeMiterlimit:!0,strokeOpacity:!0,strokeWidth:!0},h=["Webkit","ms","Moz","O"];Object.keys(fe).forEach(function(e){h.forEach(function(n){n=n+e.charAt(0).toUpperCase()+e.substring(1),fe[n]=fe[e]})});function Y(e,n,t){return n==null||typeof n=="boolean"||n===""?"":t||typeof n!="number"||n===0||fe.hasOwnProperty(e)&&fe[e]?(""+n).trim():n+"px"}function V(e,n){e=e.style;for(var t in n)if(n.hasOwnProperty(t)){var r=t.indexOf("--")===0,i=Y(t,n[t],r);t==="float"&&(t="cssFloat"),r?e.setProperty(t,i):e[t]=i}}var J=E({menuitem:!0},{area:!0,base:!0,br:!0,col:!0,embed:!0,hr:!0,img:!0,input:!0,keygen:!0,link:!0,meta:!0,param:!0,source:!0,track:!0,wbr:!0});function d(e,n){if(n){if(J[e]&&(n.children!=null||n.dangerouslySetInnerHTML!=null))throw Error(f(137,e));if(n.dangerouslySetInnerHTML!=null){if(n.children!=null)throw Error(f(60));if(typeof n.dangerouslySetInnerHTML!="object"||!("__html"in n.dangerouslySetInnerHTML))throw Error(f(61))}if(n.style!=null&&typeof n.style!="object")throw Error(f(62))}}function M(e,n){if(e.indexOf("-")===-1)return typeof n.is=="string";switch(e){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var te=null;function Le(e){return e=e.target||e.srcElement||window,e.correspondingUseElement&&(e=e.correspondingUseElement),e.nodeType===3?e.parentNode:e}var be=null,De=null,Ye=null;function Fe(e){if(e=Ja(e)){if(typeof be!="function")throw Error(f(280));var n=e.stateNode;n&&(n=Sl(n),be(e.stateNode,e.type,n))}}function Ve(e){De?Ye?Ye.push(e):Ye=[e]:De=e}function vn(){if(De){var e=De,n=Ye;if(Ye=De=null,Fe(e),n)for(e=0;e<n.length;e++)Fe(n[e])}}function l(e,n){return e(n)}function s(){}var _=!1;function c(e,n,t){if(_)return e(n,t);_=!0;try{return l(e,n,t)}finally{_=!1,(De!==null||Ye!==null)&&(s(),vn())}}function m(e,n){var t=e.stateNode;if(t===null)return null;var r=Sl(t);if(r===null)return null;t=r[n];e:switch(n){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(r=!r.disabled)||(e=e.type,r=!(e==="button"||e==="input"||e==="select"||e==="textarea")),e=!r;break e;default:e=!1}if(e)return null;if(t&&typeof t!="function")throw Error(f(231,n,typeof t));return t}var O=!1;if(U)try{var y={};Object.defineProperty(y,"passive",{get:function(){O=!0}}),window.addEventListener("test",y,y),window.removeEventListener("test",y,y)}catch{O=!1}function ne(e,n,t,r,i,u,x,W,ue){var qe=Array.prototype.slice.call(arguments,3);try{n.apply(t,qe)}catch(Ln){this.onError(Ln)}}var en=!1,gn=null,Bn=!1,Hn=null,pe={onError:function(e){en=!0,gn=e}};function dn(e,n,t,r,i,u,x,W,ue){en=!1,gn=null,ne.apply(pe,arguments)}function I(e,n,t,r,i,u,x,W,ue){if(dn.apply(this,arguments),en){if(en){var qe=gn;en=!1,gn=null}else throw Error(f(198));Bn||(Bn=!0,Hn=qe)}}function Me(e){var n=e,t=e;if(e.alternate)for(;n.return;)n=n.return;else{e=n;do n=e,(n.flags&4098)!==0&&(t=n.return),e=n.return;while(e)}return n.tag===3?t:null}function de(e){if(e.tag===13){var n=e.memoizedState;if(n===null&&(e=e.alternate,e!==null&&(n=e.memoizedState)),n!==null)return n.dehydrated}return null}function yn(e){if(Me(e)!==e)throw Error(f(188))}function Dn(e){var n=e.alternate;if(!n){if(n=Me(e),n===null)throw Error(f(188));return n!==e?null:e}for(var t=e,r=n;;){var i=t.return;if(i===null)break;var u=i.alternate;if(u===null){if(r=i.return,r!==null){t=r;continue}break}if(i.child===u.child){for(u=i.child;u;){if(u===t)return yn(i),e;if(u===r)return yn(i),n;u=u.sibling}throw Error(f(188))}if(t.return!==r.return)t=i,r=u;else{for(var x=!1,W=i.child;W;){if(W===t){x=!0,t=i,r=u;break}if(W===r){x=!0,r=i,t=u;break}W=W.sibling}if(!x){for(W=u.child;W;){if(W===t){x=!0,t=u,r=i;break}if(W===r){x=!0,r=u,t=i;break}W=W.sibling}if(!x)throw Error(f(189))}}if(t.alternate!==r)throw Error(f(190))}if(t.tag!==3)throw Error(f(188));return t.stateNode.current===t?e:n}function Pn(e){return e=Dn(e),e!==null?Un(e):null}function Un(e){if(e.tag===5||e.tag===6)return e;for(e=e.child;e!==null;){var n=Un(e);if(n!==null)return n;e=e.sibling}return null}var $n=B.unstable_scheduleCallback,ht=B.unstable_cancelCallback,Fn=B.unstable_shouldYield,Jn=B.unstable_requestPaint,Vn=B.unstable_now,ut=B.unstable_getCurrentPriorityLevel,it=B.unstable_ImmediatePriority,Ct=B.unstable_UserBlockingPriority,pt=B.unstable_NormalPriority,Dt=B.unstable_LowPriority,wt=B.unstable_IdlePriority,L=null,ie=null;function cn(e){if(ie&&typeof ie.onCommitFiberRoot=="function")try{ie.onCommitFiberRoot(L,e,void 0,(e.current.flags&128)===128)}catch{}}var on=Math.clz32?Math.clz32:_n,Tn=Math.log,un=Math.LN2;function _n(e){return e>>>=0,e===0?32:31-(Tn(e)/un|0)|0}var We=64,xn=4194304;function Sn(e){switch(e&-e){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return e&4194240;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return e&130023424;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 1073741824;default:return e}}function p(e,n){var t=e.pendingLanes;if(t===0)return 0;var r=0,i=e.suspendedLanes,u=e.pingedLanes,x=t&268435455;if(x!==0){var W=x&~i;W!==0?r=Sn(W):(u&=x,u!==0&&(r=Sn(u)))}else x=t&~i,x!==0?r=Sn(x):u!==0&&(r=Sn(u));if(r===0)return 0;if(n!==0&&n!==r&&(n&i)===0&&(i=r&-r,u=n&-n,i>=u||i===16&&(u&4194240)!==0))return n;if((r&4)!==0&&(r|=t&16),n=e.entangledLanes,n!==0)for(e=e.entanglements,n&=r;0<n;)t=31-on(n),i=1<<t,r|=e[t],n&=~i;return r}function X(e,n){switch(e){case 1:case 2:case 4:return n+250;case 8:case 16:case 32:case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return n+5e3;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return-1;case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function H(e,n){for(var t=e.suspendedLanes,r=e.pingedLanes,i=e.expirationTimes,u=e.pendingLanes;0<u;){var x=31-on(u),W=1<<x,ue=i[x];ue===-1?((W&t)===0||(W&r)!==0)&&(i[x]=X(W,n)):ue<=n&&(e.expiredLanes|=W),u&=~W}}function ye(e){return e=e.pendingLanes&-1073741825,e!==0?e:e&1073741824?1073741824:0}function he(){var e=We;return We<<=1,(We&4194240)===0&&(We=64),e}function _e(e){for(var n=[],t=0;31>t;t++)n.push(e);return n}function bn(e,n,t){e.pendingLanes|=n,n!==536870912&&(e.suspendedLanes=0,e.pingedLanes=0),e=e.eventTimes,n=31-on(n),e[n]=t}function Gn(e,n){var t=e.pendingLanes&~n;e.pendingLanes=n,e.suspendedLanes=0,e.pingedLanes=0,e.expiredLanes&=n,e.mutableReadLanes&=n,e.entangledLanes&=n,n=e.entanglements;var r=e.eventTimes;for(e=e.expirationTimes;0<t;){var i=31-on(t),u=1<<i;n[i]=0,r[i]=-1,e[i]=-1,t&=~u}}function zn(e,n){var t=e.entangledLanes|=n;for(e=e.entanglements;t;){var r=31-on(t),i=1<<r;i&n|e[r]&n&&(e[r]|=n),t&=~i}}var jn=0;function k(e){return e&=-e,1<e?4<e?(e&268435455)!==0?16:536870912:4:1}var j,Ne,kn,Wn,st,Lt=!1,tr=[],Ft=null,Vt=null,Mt=null,mt=new Map,Xt=new Map,dr=[],Ba="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");function Fa(e,n){switch(e){case"focusin":case"focusout":Ft=null;break;case"dragenter":case"dragleave":Vt=null;break;case"mouseover":case"mouseout":Mt=null;break;case"pointerover":case"pointerout":mt.delete(n.pointerId);break;case"gotpointercapture":case"lostpointercapture":Xt.delete(n.pointerId)}}function Er(e,n,t,r,i,u){return e===null||e.nativeEvent!==u?(e={blockedOn:n,domEventName:t,eventSystemFlags:r,nativeEvent:u,targetContainers:[i]},n!==null&&(n=Ja(n),n!==null&&Ne(n)),e):(e.eventSystemFlags|=r,n=e.targetContainers,i!==null&&n.indexOf(i)===-1&&n.push(i),e)}function pr(e,n,t,r,i){switch(n){case"focusin":return Ft=Er(Ft,e,n,t,r,i),!0;case"dragenter":return Vt=Er(Vt,e,n,t,r,i),!0;case"mouseover":return Mt=Er(Mt,e,n,t,r,i),!0;case"pointerover":var u=i.pointerId;return mt.set(u,Er(mt.get(u)||null,e,n,t,r,i)),!0;case"gotpointercapture":return u=i.pointerId,Xt.set(u,Er(Xt.get(u)||null,e,n,t,r,i)),!0}return!1}function Jr(e){var n=ra(e.target);if(n!==null){var t=Me(n);if(t!==null){if(n=t.tag,n===13){if(n=de(t),n!==null){e.blockedOn=n,st(e.priority,function(){kn(t)});return}}else if(n===3&&t.stateNode.current.memoizedState.isDehydrated){e.blockedOn=t.tag===3?t.stateNode.containerInfo:null;return}}}e.blockedOn=null}function ea(e){if(e.blockedOn!==null)return!1;for(var n=e.targetContainers;0<n.length;){var t=T(e.domEventName,e.eventSystemFlags,n[0],e.nativeEvent);if(t===null){t=e.nativeEvent;var r=new t.constructor(t.type,t);te=r,t.target.dispatchEvent(r),te=null}else return n=Ja(t),n!==null&&Ne(n),e.blockedOn=t,!1;n.shift()}return!0}function Va(e,n,t){ea(e)&&t.delete(n)}function yl(){Lt=!1,Ft!==null&&ea(Ft)&&(Ft=null),Vt!==null&&ea(Vt)&&(Vt=null),Mt!==null&&ea(Mt)&&(Mt=null),mt.forEach(Va),Xt.forEach(Va)}function Ir(e,n){e.blockedOn===n&&(e.blockedOn=null,Lt||(Lt=!0,B.unstable_scheduleCallback(B.unstable_NormalPriority,yl)))}function na(e){function n(i){return Ir(i,e)}if(0<tr.length){Ir(tr[0],e);for(var t=1;t<tr.length;t++){var r=tr[t];r.blockedOn===e&&(r.blockedOn=null)}}for(Ft!==null&&Ir(Ft,e),Vt!==null&&Ir(Vt,e),Mt!==null&&Ir(Mt,e),mt.forEach(n),Xt.forEach(n),t=0;t<dr.length;t++)r=dr[t],r.blockedOn===e&&(r.blockedOn=null);for(;0<dr.length&&(t=dr[0],t.blockedOn===null);)Jr(t),t.blockedOn===null&&dr.shift()}var xr=He.ReactCurrentBatchConfig,ta=!0;function go(e,n,t,r){var i=jn,u=xr.transition;xr.transition=null;try{jn=1,ja(e,n,t,r)}finally{jn=i,xr.transition=u}}function vl(e,n,t,r){var i=jn,u=xr.transition;xr.transition=null;try{jn=4,ja(e,n,t,r)}finally{jn=i,xr.transition=u}}function ja(e,n,t,r){if(ta){var i=T(e,n,t,r);if(i===null)Co(e,n,r,Pr,t),Fa(e,r);else if(pr(i,e,n,t,r))r.stopPropagation();else if(Fa(e,r),n&4&&-1<Ba.indexOf(e)){for(;i!==null;){var u=Ja(i);if(u!==null&&j(u),u=T(e,n,t,r),u===null&&Co(e,n,r,Pr,t),u===i)break;i=u}i!==null&&r.stopPropagation()}else Co(e,n,r,null,t)}}var Pr=null;function T(e,n,t,r){if(Pr=null,e=Le(r),e=ra(e),e!==null)if(n=Me(e),n===null)e=null;else if(t=n.tag,t===13){if(e=de(n),e!==null)return e;e=null}else if(t===3){if(n.stateNode.current.memoizedState.isDehydrated)return n.tag===3?n.stateNode.containerInfo:null;e=null}else n!==e&&(e=null);return Pr=e,null}function Z(e){switch(e){case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"resize":case"seeked":case"submit":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 1;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"scroll":case"toggle":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 4;case"message":switch(ut()){case it:return 1;case Ct:return 4;case pt:case Dt:return 16;case wt:return 536870912;default:return 16}default:return 16}}var Re=null,Qe=null,Ge=null;function Se(){if(Ge)return Ge;var e,n=Qe,t=n.length,r,i="value"in Re?Re.value:Re.textContent,u=i.length;for(e=0;e<t&&n[e]===i[e];e++);var x=t-e;for(r=1;r<=x&&n[t-r]===i[u-r];r++);return Ge=i.slice(e,1<r?1-r:void 0)}function hn(e){var n=e.keyCode;return"charCode"in e?(e=e.charCode,e===0&&n===13&&(e=13)):e=n,e===10&&(e=13),32<=e||e===13?e:0}function En(){return!0}function tt(){return!1}function rt(e){function n(t,r,i,u,x){this._reactName=t,this._targetInst=i,this.type=r,this.nativeEvent=u,this.target=x,this.currentTarget=null;for(var W in e)e.hasOwnProperty(W)&&(t=e[W],this[W]=t?t(u):u[W]);return this.isDefaultPrevented=(u.defaultPrevented!=null?u.defaultPrevented:u.returnValue===!1)?En:tt,this.isPropagationStopped=tt,this}return E(n.prototype,{preventDefault:function(){this.defaultPrevented=!0;var t=this.nativeEvent;t&&(t.preventDefault?t.preventDefault():typeof t.returnValue!="unknown"&&(t.returnValue=!1),this.isDefaultPrevented=En)},stopPropagation:function(){var t=this.nativeEvent;t&&(t.stopPropagation?t.stopPropagation():typeof t.cancelBubble!="unknown"&&(t.cancelBubble=!0),this.isPropagationStopped=En)},persist:function(){},isPersistent:En}),n}var St={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(e){return e.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},Lr=rt(St),Dr=E({},St,{view:0,detail:0}),Qc=rt(Dr),yo,vo,za,xl=E({},Dr,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:Ao,button:0,buttons:0,relatedTarget:function(e){return e.relatedTarget===void 0?e.fromElement===e.srcElement?e.toElement:e.fromElement:e.relatedTarget},movementX:function(e){return"movementX"in e?e.movementX:(e!==za&&(za&&e.type==="mousemove"?(yo=e.screenX-za.screenX,vo=e.screenY-za.screenY):vo=yo=0,za=e),yo)},movementY:function(e){return"movementY"in e?e.movementY:vo}}),ns=rt(xl),Zc=E({},xl,{dataTransfer:0}),Jc=rt(Zc),ef=E({},Dr,{relatedTarget:0}),xo=rt(ef),nf=E({},St,{animationName:0,elapsedTime:0,pseudoElement:0}),tf=rt(nf),rf=E({},St,{clipboardData:function(e){return"clipboardData"in e?e.clipboardData:window.clipboardData}}),af=rt(rf),lf=E({},St,{data:0}),ts=rt(lf),of={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},sf={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},uf={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function cf(e){var n=this.nativeEvent;return n.getModifierState?n.getModifierState(e):(e=uf[e])?!!n[e]:!1}function Ao(){return cf}var ff=E({},Dr,{key:function(e){if(e.key){var n=of[e.key]||e.key;if(n!=="Unidentified")return n}return e.type==="keypress"?(e=hn(e),e===13?"Enter":String.fromCharCode(e)):e.type==="keydown"||e.type==="keyup"?sf[e.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:Ao,charCode:function(e){return e.type==="keypress"?hn(e):0},keyCode:function(e){return e.type==="keydown"||e.type==="keyup"?e.keyCode:0},which:function(e){return e.type==="keypress"?hn(e):e.type==="keydown"||e.type==="keyup"?e.keyCode:0}}),df=rt(ff),pf=E({},xl,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),rs=rt(pf),_f=E({},Dr,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:Ao}),hf=rt(_f),mf=E({},St,{propertyName:0,elapsedTime:0,pseudoElement:0}),gf=rt(mf),yf=E({},xl,{deltaX:function(e){return"deltaX"in e?e.deltaX:"wheelDeltaX"in e?-e.wheelDeltaX:0},deltaY:function(e){return"deltaY"in e?e.deltaY:"wheelDeltaY"in e?-e.wheelDeltaY:"wheelDelta"in e?-e.wheelDelta:0},deltaZ:0,deltaMode:0}),vf=rt(yf),xf=[9,13,27,32],ko=U&&"CompositionEvent"in window,Ka=null;U&&"documentMode"in document&&(Ka=document.documentMode);var Af=U&&"TextEvent"in window&&!Ka,as=U&&(!ko||Ka&&8<Ka&&11>=Ka),ls=" ",os=!1;function is(e,n){switch(e){case"keyup":return xf.indexOf(n.keyCode)!==-1;case"keydown":return n.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function ss(e){return e=e.detail,typeof e=="object"&&"data"in e?e.data:null}var ga=!1;function kf(e,n){switch(e){case"compositionend":return ss(n);case"keypress":return n.which!==32?null:(os=!0,ls);case"textInput":return e=n.data,e===ls&&os?null:e;default:return null}}function Tf(e,n){if(ga)return e==="compositionend"||!ko&&is(e,n)?(e=Se(),Ge=Qe=Re=null,ga=!1,e):null;switch(e){case"paste":return null;case"keypress":if(!(n.ctrlKey||n.altKey||n.metaKey)||n.ctrlKey&&n.altKey){if(n.char&&1<n.char.length)return n.char;if(n.which)return String.fromCharCode(n.which)}return null;case"compositionend":return as&&n.locale!=="ko"?null:n.data;default:return null}}var wf={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function us(e){var n=e&&e.nodeName&&e.nodeName.toLowerCase();return n==="input"?!!wf[e.type]:n==="textarea"}function cs(e,n,t,r){Ve(r),n=El(n,"onChange"),0<n.length&&(t=new Lr("onChange","change",null,t,r),e.push({event:t,listeners:n}))}var Ha=null,Xa=null;function Ef(e){Ss(e,0)}function Al(e){var n=ka(e);if(Ee(n))return e}function Lf(e,n){if(e==="change")return n}var fs=!1;if(U){var To;if(U){var wo="oninput"in document;if(!wo){var ds=document.createElement("div");ds.setAttribute("oninput","return;"),wo=typeof ds.oninput=="function"}To=wo}else To=!1;fs=To&&(!document.documentMode||9<document.documentMode)}function ps(){Ha&&(Ha.detachEvent("onpropertychange",_s),Xa=Ha=null)}function _s(e){if(e.propertyName==="value"&&Al(Xa)){var n=[];cs(n,Xa,e,Le(e)),c(Ef,n)}}function bf(e,n,t){e==="focusin"?(ps(),Ha=n,Xa=t,Ha.attachEvent("onpropertychange",_s)):e==="focusout"&&ps()}function Sf(e){if(e==="selectionchange"||e==="keyup"||e==="keydown")return Al(Xa)}function Of(e,n){if(e==="click")return Al(n)}function Rf(e,n){if(e==="input"||e==="change")return Al(n)}function Nf(e,n){return e===n&&(e!==0||1/e===1/n)||e!==e&&n!==n}var _r=typeof Object.is=="function"?Object.is:Nf;function Ya(e,n){if(_r(e,n))return!0;if(typeof e!="object"||e===null||typeof n!="object"||n===null)return!1;var t=Object.keys(e),r=Object.keys(n);if(t.length!==r.length)return!1;for(r=0;r<t.length;r++){var i=t[r];if(!z.call(n,i)||!_r(e[i],n[i]))return!1}return!0}function hs(e){for(;e&&e.firstChild;)e=e.firstChild;return e}function ms(e,n){var t=hs(e);e=0;for(var r;t;){if(t.nodeType===3){if(r=e+t.textContent.length,e<=n&&r>=n)return{node:t,offset:n-e};e=r}e:{for(;t;){if(t.nextSibling){t=t.nextSibling;break e}t=t.parentNode}t=void 0}t=hs(t)}}function gs(e,n){return e&&n?e===n?!0:e&&e.nodeType===3?!1:n&&n.nodeType===3?gs(e,n.parentNode):"contains"in e?e.contains(n):e.compareDocumentPosition?!!(e.compareDocumentPosition(n)&16):!1:!1}function ys(){for(var e=window,n=rn();n instanceof e.HTMLIFrameElement;){try{var t=typeof n.contentWindow.location.href=="string"}catch{t=!1}if(t)e=n.contentWindow;else break;n=rn(e.document)}return n}function Eo(e){var n=e&&e.nodeName&&e.nodeName.toLowerCase();return n&&(n==="input"&&(e.type==="text"||e.type==="search"||e.type==="tel"||e.type==="url"||e.type==="password")||n==="textarea"||e.contentEditable==="true")}function Cf(e){var n=ys(),t=e.focusedElem,r=e.selectionRange;if(n!==t&&t&&t.ownerDocument&&gs(t.ownerDocument.documentElement,t)){if(r!==null&&Eo(t)){if(n=r.start,e=r.end,e===void 0&&(e=n),"selectionStart"in t)t.selectionStart=n,t.selectionEnd=Math.min(e,t.value.length);else if(e=(n=t.ownerDocument||document)&&n.defaultView||window,e.getSelection){e=e.getSelection();var i=t.textContent.length,u=Math.min(r.start,i);r=r.end===void 0?u:Math.min(r.end,i),!e.extend&&u>r&&(i=r,r=u,u=i),i=ms(t,u);var x=ms(t,r);i&&x&&(e.rangeCount!==1||e.anchorNode!==i.node||e.anchorOffset!==i.offset||e.focusNode!==x.node||e.focusOffset!==x.offset)&&(n=n.createRange(),n.setStart(i.node,i.offset),e.removeAllRanges(),u>r?(e.addRange(n),e.extend(x.node,x.offset)):(n.setEnd(x.node,x.offset),e.addRange(n)))}}for(n=[],e=t;e=e.parentNode;)e.nodeType===1&&n.push({element:e,left:e.scrollLeft,top:e.scrollTop});for(typeof t.focus=="function"&&t.focus(),t=0;t<n.length;t++)e=n[t],e.element.scrollLeft=e.left,e.element.scrollTop=e.top}}var Mf=U&&"documentMode"in document&&11>=document.documentMode,ya=null,Lo=null,Wa=null,bo=!1;function vs(e,n,t){var r=t.window===t?t.document:t.nodeType===9?t:t.ownerDocument;bo||ya==null||ya!==rn(r)||(r=ya,"selectionStart"in r&&Eo(r)?r={start:r.selectionStart,end:r.selectionEnd}:(r=(r.ownerDocument&&r.ownerDocument.defaultView||window).getSelection(),r={anchorNode:r.anchorNode,anchorOffset:r.anchorOffset,focusNode:r.focusNode,focusOffset:r.focusOffset}),Wa&&Ya(Wa,r)||(Wa=r,r=El(Lo,"onSelect"),0<r.length&&(n=new Lr("onSelect","select",null,n,t),e.push({event:n,listeners:r}),n.target=ya)))}function kl(e,n){var t={};return t[e.toLowerCase()]=n.toLowerCase(),t["Webkit"+e]="webkit"+n,t["Moz"+e]="moz"+n,t}var va={animationend:kl("Animation","AnimationEnd"),animationiteration:kl("Animation","AnimationIteration"),animationstart:kl("Animation","AnimationStart"),transitionend:kl("Transition","TransitionEnd")},So={},xs={};U&&(xs=document.createElement("div").style,"AnimationEvent"in window||(delete va.animationend.animation,delete va.animationiteration.animation,delete va.animationstart.animation),"TransitionEvent"in window||delete va.transitionend.transition);function Tl(e){if(So[e])return So[e];if(!va[e])return e;var n=va[e],t;for(t in n)if(n.hasOwnProperty(t)&&t in xs)return So[e]=n[t];return e}var As=Tl("animationend"),ks=Tl("animationiteration"),Ts=Tl("animationstart"),ws=Tl("transitionend"),Es=new Map,Ls="abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");function Gr(e,n){Es.set(e,n),D(n,[e])}for(var Oo=0;Oo<Ls.length;Oo++){var Ro=Ls[Oo],Uf=Ro.toLowerCase(),If=Ro[0].toUpperCase()+Ro.slice(1);Gr(Uf,"on"+If)}Gr(As,"onAnimationEnd"),Gr(ks,"onAnimationIteration"),Gr(Ts,"onAnimationStart"),Gr("dblclick","onDoubleClick"),Gr("focusin","onFocus"),Gr("focusout","onBlur"),Gr(ws,"onTransitionEnd"),R("onMouseEnter",["mouseout","mouseover"]),R("onMouseLeave",["mouseout","mouseover"]),R("onPointerEnter",["pointerout","pointerover"]),R("onPointerLeave",["pointerout","pointerover"]),D("onChange","change click focusin focusout input keydown keyup selectionchange".split(" ")),D("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")),D("onBeforeInput",["compositionend","keypress","textInput","paste"]),D("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" ")),D("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" ")),D("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var qa="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),Pf=new Set("cancel close invalid load scroll toggle".split(" ").concat(qa));function bs(e,n,t){var r=e.type||"unknown-event";e.currentTarget=t,I(r,n,void 0,e),e.currentTarget=null}function Ss(e,n){n=(n&4)!==0;for(var t=0;t<e.length;t++){var r=e[t],i=r.event;r=r.listeners;e:{var u=void 0;if(n)for(var x=r.length-1;0<=x;x--){var W=r[x],ue=W.instance,qe=W.currentTarget;if(W=W.listener,ue!==u&&i.isPropagationStopped())break e;bs(i,W,qe),u=ue}else for(x=0;x<r.length;x++){if(W=r[x],ue=W.instance,qe=W.currentTarget,W=W.listener,ue!==u&&i.isPropagationStopped())break e;bs(i,W,qe),u=ue}}}if(Bn)throw e=Hn,Bn=!1,Hn=null,e}function yt(e,n){var t=n[Go];t===void 0&&(t=n[Go]=new Set);var r=e+"__bubble";t.has(r)||(Os(n,e,2,!1),t.add(r))}function No(e,n,t){var r=0;n&&(r|=4),Os(t,e,r,n)}var wl="_reactListening"+Math.random().toString(36).slice(2);function $a(e){if(!e[wl]){e[wl]=!0,w.forEach(function(t){t!=="selectionchange"&&(Pf.has(t)||No(t,!1,e),No(t,!0,e))});var n=e.nodeType===9?e:e.ownerDocument;n===null||n[wl]||(n[wl]=!0,No("selectionchange",!1,n))}}function Os(e,n,t,r){switch(Z(n)){case 1:var i=go;break;case 4:i=vl;break;default:i=ja}t=i.bind(null,n,t,e),i=void 0,!O||n!=="touchstart"&&n!=="touchmove"&&n!=="wheel"||(i=!0),r?i!==void 0?e.addEventListener(n,t,{capture:!0,passive:i}):e.addEventListener(n,t,!0):i!==void 0?e.addEventListener(n,t,{passive:i}):e.addEventListener(n,t,!1)}function Co(e,n,t,r,i){var u=r;if((n&1)===0&&(n&2)===0&&r!==null)e:for(;;){if(r===null)return;var x=r.tag;if(x===3||x===4){var W=r.stateNode.containerInfo;if(W===i||W.nodeType===8&&W.parentNode===i)break;if(x===4)for(x=r.return;x!==null;){var ue=x.tag;if((ue===3||ue===4)&&(ue=x.stateNode.containerInfo,ue===i||ue.nodeType===8&&ue.parentNode===i))return;x=x.return}for(;W!==null;){if(x=ra(W),x===null)return;if(ue=x.tag,ue===5||ue===6){r=u=x;continue e}W=W.parentNode}}r=r.return}c(function(){var qe=u,Ln=Le(t),Rn=[];e:{var wn=Es.get(e);if(wn!==void 0){var Kn=Lr,Yn=e;switch(e){case"keypress":if(hn(t)===0)break e;case"keydown":case"keyup":Kn=df;break;case"focusin":Yn="focus",Kn=xo;break;case"focusout":Yn="blur",Kn=xo;break;case"beforeblur":case"afterblur":Kn=xo;break;case"click":if(t.button===2)break e;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":Kn=ns;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":Kn=Jc;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":Kn=hf;break;case As:case ks:case Ts:Kn=tf;break;case ws:Kn=gf;break;case"scroll":Kn=Qc;break;case"wheel":Kn=vf;break;case"copy":case"cut":case"paste":Kn=af;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":Kn=rs}var qn=(n&4)!==0,bt=!qn&&e==="scroll",Be=qn?wn!==null?wn+"Capture":null:wn;qn=[];for(var ke=qe,je;ke!==null;){je=ke;var Cn=je.stateNode;if(je.tag===5&&Cn!==null&&(je=Cn,Be!==null&&(Cn=m(ke,Be),Cn!=null&&qn.push(Qa(ke,Cn,je)))),bt)break;ke=ke.return}0<qn.length&&(wn=new Kn(wn,Yn,null,t,Ln),Rn.push({event:wn,listeners:qn}))}}if((n&7)===0){e:{if(wn=e==="mouseover"||e==="pointerover",Kn=e==="mouseout"||e==="pointerout",wn&&t!==te&&(Yn=t.relatedTarget||t.fromElement)&&(ra(Yn)||Yn[br]))break e;if((Kn||wn)&&(wn=Ln.window===Ln?Ln:(wn=Ln.ownerDocument)?wn.defaultView||wn.parentWindow:window,Kn?(Yn=t.relatedTarget||t.toElement,Kn=qe,Yn=Yn?ra(Yn):null,Yn!==null&&(bt=Me(Yn),Yn!==bt||Yn.tag!==5&&Yn.tag!==6)&&(Yn=null)):(Kn=null,Yn=qe),Kn!==Yn)){if(qn=ns,Cn="onMouseLeave",Be="onMouseEnter",ke="mouse",(e==="pointerout"||e==="pointerover")&&(qn=rs,Cn="onPointerLeave",Be="onPointerEnter",ke="pointer"),bt=Kn==null?wn:ka(Kn),je=Yn==null?wn:ka(Yn),wn=new qn(Cn,ke+"leave",Kn,t,Ln),wn.target=bt,wn.relatedTarget=je,Cn=null,ra(Ln)===qe&&(qn=new qn(Be,ke+"enter",Yn,t,Ln),qn.target=je,qn.relatedTarget=bt,Cn=qn),bt=Cn,Kn&&Yn)n:{for(qn=Kn,Be=Yn,ke=0,je=qn;je;je=xa(je))ke++;for(je=0,Cn=Be;Cn;Cn=xa(Cn))je++;for(;0<ke-je;)qn=xa(qn),ke--;for(;0<je-ke;)Be=xa(Be),je--;for(;ke--;){if(qn===Be||Be!==null&&qn===Be.alternate)break n;qn=xa(qn),Be=xa(Be)}qn=null}else qn=null;Kn!==null&&Rs(Rn,wn,Kn,qn,!1),Yn!==null&&bt!==null&&Rs(Rn,bt,Yn,qn,!0)}}e:{if(wn=qe?ka(qe):window,Kn=wn.nodeName&&wn.nodeName.toLowerCase(),Kn==="select"||Kn==="input"&&wn.type==="file")var Qn=Lf;else if(us(wn))if(fs)Qn=Rf;else{Qn=Sf;var et=bf}else(Kn=wn.nodeName)&&Kn.toLowerCase()==="input"&&(wn.type==="checkbox"||wn.type==="radio")&&(Qn=Of);if(Qn&&(Qn=Qn(e,qe))){cs(Rn,Qn,t,Ln);break e}et&&et(e,wn,qe),e==="focusout"&&(et=wn._wrapperState)&&et.controlled&&wn.type==="number"&&N(wn,"number",wn.value)}switch(et=qe?ka(qe):window,e){case"focusin":(us(et)||et.contentEditable==="true")&&(ya=et,Lo=qe,Wa=null);break;case"focusout":Wa=Lo=ya=null;break;case"mousedown":bo=!0;break;case"contextmenu":case"mouseup":case"dragend":bo=!1,vs(Rn,t,Ln);break;case"selectionchange":if(Mf)break;case"keydown":case"keyup":vs(Rn,t,Ln)}var nt;if(ko)e:{switch(e){case"compositionstart":var at="onCompositionStart";break e;case"compositionend":at="onCompositionEnd";break e;case"compositionupdate":at="onCompositionUpdate";break e}at=void 0}else ga?is(e,t)&&(at="onCompositionEnd"):e==="keydown"&&t.keyCode===229&&(at="onCompositionStart");at&&(as&&t.locale!=="ko"&&(ga||at!=="onCompositionStart"?at==="onCompositionEnd"&&ga&&(nt=Se()):(Re=Ln,Qe="value"in Re?Re.value:Re.textContent,ga=!0)),et=El(qe,at),0<et.length&&(at=new ts(at,e,null,t,Ln),Rn.push({event:at,listeners:et}),nt?at.data=nt:(nt=ss(t),nt!==null&&(at.data=nt)))),(nt=Af?kf(e,t):Tf(e,t))&&(qe=El(qe,"onBeforeInput"),0<qe.length&&(Ln=new ts("onBeforeInput","beforeinput",null,t,Ln),Rn.push({event:Ln,listeners:qe}),Ln.data=nt))}Ss(Rn,n)})}function Qa(e,n,t){return{instance:e,listener:n,currentTarget:t}}function El(e,n){for(var t=n+"Capture",r=[];e!==null;){var i=e,u=i.stateNode;i.tag===5&&u!==null&&(i=u,u=m(e,t),u!=null&&r.unshift(Qa(e,u,i)),u=m(e,n),u!=null&&r.push(Qa(e,u,i))),e=e.return}return r}function xa(e){if(e===null)return null;do e=e.return;while(e&&e.tag!==5);return e||null}function Rs(e,n,t,r,i){for(var u=n._reactName,x=[];t!==null&&t!==r;){var W=t,ue=W.alternate,qe=W.stateNode;if(ue!==null&&ue===r)break;W.tag===5&&qe!==null&&(W=qe,i?(ue=m(t,u),ue!=null&&x.unshift(Qa(t,ue,W))):i||(ue=m(t,u),ue!=null&&x.push(Qa(t,ue,W)))),t=t.return}x.length!==0&&e.push({event:n,listeners:x})}var Df=/\r\n?/g,Gf=/\u0000|\uFFFD/g;function Ns(e){return(typeof e=="string"?e:""+e).replace(Df,`
`).replace(Gf,"")}function Ll(e,n,t){if(n=Ns(n),Ns(e)!==n&&t)throw Error(f(425))}function bl(){}var Mo=null,Uo=null;function Io(e,n){return e==="textarea"||e==="noscript"||typeof n.children=="string"||typeof n.children=="number"||typeof n.dangerouslySetInnerHTML=="object"&&n.dangerouslySetInnerHTML!==null&&n.dangerouslySetInnerHTML.__html!=null}var Po=typeof setTimeout=="function"?setTimeout:void 0,Bf=typeof clearTimeout=="function"?clearTimeout:void 0,Cs=typeof Promise=="function"?Promise:void 0,Ff=typeof queueMicrotask=="function"?queueMicrotask:typeof Cs<"u"?function(e){return Cs.resolve(null).then(e).catch(Vf)}:Po;function Vf(e){setTimeout(function(){throw e})}function Do(e,n){var t=n,r=0;do{var i=t.nextSibling;if(e.removeChild(t),i&&i.nodeType===8)if(t=i.data,t==="/$"){if(r===0){e.removeChild(i),na(n);return}r--}else t!=="$"&&t!=="$?"&&t!=="$!"||r++;t=i}while(t);na(n)}function Br(e){for(;e!=null;e=e.nextSibling){var n=e.nodeType;if(n===1||n===3)break;if(n===8){if(n=e.data,n==="$"||n==="$!"||n==="$?")break;if(n==="/$")return null}}return e}function Ms(e){e=e.previousSibling;for(var n=0;e;){if(e.nodeType===8){var t=e.data;if(t==="$"||t==="$!"||t==="$?"){if(n===0)return e;n--}else t==="/$"&&n++}e=e.previousSibling}return null}var Aa=Math.random().toString(36).slice(2),Ar="__reactFiber$"+Aa,Za="__reactProps$"+Aa,br="__reactContainer$"+Aa,Go="__reactEvents$"+Aa,jf="__reactListeners$"+Aa,zf="__reactHandles$"+Aa;function ra(e){var n=e[Ar];if(n)return n;for(var t=e.parentNode;t;){if(n=t[br]||t[Ar]){if(t=n.alternate,n.child!==null||t!==null&&t.child!==null)for(e=Ms(e);e!==null;){if(t=e[Ar])return t;e=Ms(e)}return n}e=t,t=e.parentNode}return null}function Ja(e){return e=e[Ar]||e[br],!e||e.tag!==5&&e.tag!==6&&e.tag!==13&&e.tag!==3?null:e}function ka(e){if(e.tag===5||e.tag===6)return e.stateNode;throw Error(f(33))}function Sl(e){return e[Za]||null}var Bo=[],Ta=-1;function Fr(e){return{current:e}}function vt(e){0>Ta||(e.current=Bo[Ta],Bo[Ta]=null,Ta--)}function gt(e,n){Ta++,Bo[Ta]=e.current,e.current=n}var Vr={},jt=Fr(Vr),$t=Fr(!1),aa=Vr;function wa(e,n){var t=e.type.contextTypes;if(!t)return Vr;var r=e.stateNode;if(r&&r.__reactInternalMemoizedUnmaskedChildContext===n)return r.__reactInternalMemoizedMaskedChildContext;var i={},u;for(u in t)i[u]=n[u];return r&&(e=e.stateNode,e.__reactInternalMemoizedUnmaskedChildContext=n,e.__reactInternalMemoizedMaskedChildContext=i),i}function Qt(e){return e=e.childContextTypes,e!=null}function Ol(){vt($t),vt(jt)}function Us(e,n,t){if(jt.current!==Vr)throw Error(f(168));gt(jt,n),gt($t,t)}function Is(e,n,t){var r=e.stateNode;if(n=n.childContextTypes,typeof r.getChildContext!="function")return t;r=r.getChildContext();for(var i in r)if(!(i in n))throw Error(f(108,fn(e)||"Unknown",i));return E({},t,r)}function Rl(e){return e=(e=e.stateNode)&&e.__reactInternalMemoizedMergedChildContext||Vr,aa=jt.current,gt(jt,e),gt($t,$t.current),!0}function Ps(e,n,t){var r=e.stateNode;if(!r)throw Error(f(169));t?(e=Is(e,n,aa),r.__reactInternalMemoizedMergedChildContext=e,vt($t),vt(jt),gt(jt,e)):vt($t),gt($t,t)}var Sr=null,Nl=!1,Fo=!1;function Ds(e){Sr===null?Sr=[e]:Sr.push(e)}function Kf(e){Nl=!0,Ds(e)}function jr(){if(!Fo&&Sr!==null){Fo=!0;var e=0,n=jn;try{var t=Sr;for(jn=1;e<t.length;e++){var r=t[e];do r=r(!0);while(r!==null)}Sr=null,Nl=!1}catch(i){throw Sr!==null&&(Sr=Sr.slice(e+1)),$n(it,jr),i}finally{jn=n,Fo=!1}}return null}var Ea=[],La=0,Cl=null,Ml=0,or=[],ir=0,la=null,Or=1,Rr="";function oa(e,n){Ea[La++]=Ml,Ea[La++]=Cl,Cl=e,Ml=n}function Gs(e,n,t){or[ir++]=Or,or[ir++]=Rr,or[ir++]=la,la=e;var r=Or;e=Rr;var i=32-on(r)-1;r&=~(1<<i),t+=1;var u=32-on(n)+i;if(30<u){var x=i-i%5;u=(r&(1<<x)-1).toString(32),r>>=x,i-=x,Or=1<<32-on(n)+i|t<<i|r,Rr=u+e}else Or=1<<u|t<<i|r,Rr=e}function Vo(e){e.return!==null&&(oa(e,1),Gs(e,1,0))}function jo(e){for(;e===Cl;)Cl=Ea[--La],Ea[La]=null,Ml=Ea[--La],Ea[La]=null;for(;e===la;)la=or[--ir],or[ir]=null,Rr=or[--ir],or[ir]=null,Or=or[--ir],or[ir]=null}var rr=null,ar=null,At=!1,hr=null;function Bs(e,n){var t=fr(5,null,null,0);t.elementType="DELETED",t.stateNode=n,t.return=e,n=e.deletions,n===null?(e.deletions=[t],e.flags|=16):n.push(t)}function Fs(e,n){switch(e.tag){case 5:var t=e.type;return n=n.nodeType!==1||t.toLowerCase()!==n.nodeName.toLowerCase()?null:n,n!==null?(e.stateNode=n,rr=e,ar=Br(n.firstChild),!0):!1;case 6:return n=e.pendingProps===""||n.nodeType!==3?null:n,n!==null?(e.stateNode=n,rr=e,ar=null,!0):!1;case 13:return n=n.nodeType!==8?null:n,n!==null?(t=la!==null?{id:Or,overflow:Rr}:null,e.memoizedState={dehydrated:n,treeContext:t,retryLane:1073741824},t=fr(18,null,null,0),t.stateNode=n,t.return=e,e.child=t,rr=e,ar=null,!0):!1;default:return!1}}function zo(e){return(e.mode&1)!==0&&(e.flags&128)===0}function Ko(e){if(At){var n=ar;if(n){var t=n;if(!Fs(e,n)){if(zo(e))throw Error(f(418));n=Br(t.nextSibling);var r=rr;n&&Fs(e,n)?Bs(r,t):(e.flags=e.flags&-4097|2,At=!1,rr=e)}}else{if(zo(e))throw Error(f(418));e.flags=e.flags&-4097|2,At=!1,rr=e}}}function Vs(e){for(e=e.return;e!==null&&e.tag!==5&&e.tag!==3&&e.tag!==13;)e=e.return;rr=e}function Ul(e){if(e!==rr)return!1;if(!At)return Vs(e),At=!0,!1;var n;if((n=e.tag!==3)&&!(n=e.tag!==5)&&(n=e.type,n=n!=="head"&&n!=="body"&&!Io(e.type,e.memoizedProps)),n&&(n=ar)){if(zo(e))throw js(),Error(f(418));for(;n;)Bs(e,n),n=Br(n.nextSibling)}if(Vs(e),e.tag===13){if(e=e.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(f(317));e:{for(e=e.nextSibling,n=0;e;){if(e.nodeType===8){var t=e.data;if(t==="/$"){if(n===0){ar=Br(e.nextSibling);break e}n--}else t!=="$"&&t!=="$!"&&t!=="$?"||n++}e=e.nextSibling}ar=null}}else ar=rr?Br(e.stateNode.nextSibling):null;return!0}function js(){for(var e=ar;e;)e=Br(e.nextSibling)}function ba(){ar=rr=null,At=!1}function Ho(e){hr===null?hr=[e]:hr.push(e)}var Hf=He.ReactCurrentBatchConfig;function el(e,n,t){if(e=t.ref,e!==null&&typeof e!="function"&&typeof e!="object"){if(t._owner){if(t=t._owner,t){if(t.tag!==1)throw Error(f(309));var r=t.stateNode}if(!r)throw Error(f(147,e));var i=r,u=""+e;return n!==null&&n.ref!==null&&typeof n.ref=="function"&&n.ref._stringRef===u?n.ref:(n=function(x){var W=i.refs;x===null?delete W[u]:W[u]=x},n._stringRef=u,n)}if(typeof e!="string")throw Error(f(284));if(!t._owner)throw Error(f(290,e))}return e}function Il(e,n){throw e=Object.prototype.toString.call(n),Error(f(31,e==="[object Object]"?"object with keys {"+Object.keys(n).join(", ")+"}":e))}function zs(e){var n=e._init;return n(e._payload)}function Ks(e){function n(Be,ke){if(e){var je=Be.deletions;je===null?(Be.deletions=[ke],Be.flags|=16):je.push(ke)}}function t(Be,ke){if(!e)return null;for(;ke!==null;)n(Be,ke),ke=ke.sibling;return null}function r(Be,ke){for(Be=new Map;ke!==null;)ke.key!==null?Be.set(ke.key,ke):Be.set(ke.index,ke),ke=ke.sibling;return Be}function i(Be,ke){return Be=$r(Be,ke),Be.index=0,Be.sibling=null,Be}function u(Be,ke,je){return Be.index=je,e?(je=Be.alternate,je!==null?(je=je.index,je<ke?(Be.flags|=2,ke):je):(Be.flags|=2,ke)):(Be.flags|=1048576,ke)}function x(Be){return e&&Be.alternate===null&&(Be.flags|=2),Be}function W(Be,ke,je,Cn){return ke===null||ke.tag!==6?(ke=Pi(je,Be.mode,Cn),ke.return=Be,ke):(ke=i(ke,je),ke.return=Be,ke)}function ue(Be,ke,je,Cn){var Qn=je.type;return Qn===P?Ln(Be,ke,je.props.children,Cn,je.key):ke!==null&&(ke.elementType===Qn||typeof Qn=="object"&&Qn!==null&&Qn.$$typeof===oe&&zs(Qn)===ke.type)?(Cn=i(ke,je.props),Cn.ref=el(Be,ke,je),Cn.return=Be,Cn):(Cn=lo(je.type,je.key,je.props,null,Be.mode,Cn),Cn.ref=el(Be,ke,je),Cn.return=Be,Cn)}function qe(Be,ke,je,Cn){return ke===null||ke.tag!==4||ke.stateNode.containerInfo!==je.containerInfo||ke.stateNode.implementation!==je.implementation?(ke=Di(je,Be.mode,Cn),ke.return=Be,ke):(ke=i(ke,je.children||[]),ke.return=Be,ke)}function Ln(Be,ke,je,Cn,Qn){return ke===null||ke.tag!==7?(ke=_a(je,Be.mode,Cn,Qn),ke.return=Be,ke):(ke=i(ke,je),ke.return=Be,ke)}function Rn(Be,ke,je){if(typeof ke=="string"&&ke!==""||typeof ke=="number")return ke=Pi(""+ke,Be.mode,je),ke.return=Be,ke;if(typeof ke=="object"&&ke!==null){switch(ke.$$typeof){case Xe:return je=lo(ke.type,ke.key,ke.props,null,Be.mode,je),je.ref=el(Be,null,ke),je.return=Be,je;case ln:return ke=Di(ke,Be.mode,je),ke.return=Be,ke;case oe:var Cn=ke._init;return Rn(Be,Cn(ke._payload),je)}if(me(ke)||Ce(ke))return ke=_a(ke,Be.mode,je,null),ke.return=Be,ke;Il(Be,ke)}return null}function wn(Be,ke,je,Cn){var Qn=ke!==null?ke.key:null;if(typeof je=="string"&&je!==""||typeof je=="number")return Qn!==null?null:W(Be,ke,""+je,Cn);if(typeof je=="object"&&je!==null){switch(je.$$typeof){case Xe:return je.key===Qn?ue(Be,ke,je,Cn):null;case ln:return je.key===Qn?qe(Be,ke,je,Cn):null;case oe:return Qn=je._init,wn(Be,ke,Qn(je._payload),Cn)}if(me(je)||Ce(je))return Qn!==null?null:Ln(Be,ke,je,Cn,null);Il(Be,je)}return null}function Kn(Be,ke,je,Cn,Qn){if(typeof Cn=="string"&&Cn!==""||typeof Cn=="number")return Be=Be.get(je)||null,W(ke,Be,""+Cn,Qn);if(typeof Cn=="object"&&Cn!==null){switch(Cn.$$typeof){case Xe:return Be=Be.get(Cn.key===null?je:Cn.key)||null,ue(ke,Be,Cn,Qn);case ln:return Be=Be.get(Cn.key===null?je:Cn.key)||null,qe(ke,Be,Cn,Qn);case oe:var et=Cn._init;return Kn(Be,ke,je,et(Cn._payload),Qn)}if(me(Cn)||Ce(Cn))return Be=Be.get(je)||null,Ln(ke,Be,Cn,Qn,null);Il(ke,Cn)}return null}function Yn(Be,ke,je,Cn){for(var Qn=null,et=null,nt=ke,at=ke=0,Pt=null;nt!==null&&at<je.length;at++){nt.index>at?(Pt=nt,nt=null):Pt=nt.sibling;var _t=wn(Be,nt,je[at],Cn);if(_t===null){nt===null&&(nt=Pt);break}e&&nt&&_t.alternate===null&&n(Be,nt),ke=u(_t,ke,at),et===null?Qn=_t:et.sibling=_t,et=_t,nt=Pt}if(at===je.length)return t(Be,nt),At&&oa(Be,at),Qn;if(nt===null){for(;at<je.length;at++)nt=Rn(Be,je[at],Cn),nt!==null&&(ke=u(nt,ke,at),et===null?Qn=nt:et.sibling=nt,et=nt);return At&&oa(Be,at),Qn}for(nt=r(Be,nt);at<je.length;at++)Pt=Kn(nt,Be,at,je[at],Cn),Pt!==null&&(e&&Pt.alternate!==null&&nt.delete(Pt.key===null?at:Pt.key),ke=u(Pt,ke,at),et===null?Qn=Pt:et.sibling=Pt,et=Pt);return e&&nt.forEach(function(Qr){return n(Be,Qr)}),At&&oa(Be,at),Qn}function qn(Be,ke,je,Cn){var Qn=Ce(je);if(typeof Qn!="function")throw Error(f(150));if(je=Qn.call(je),je==null)throw Error(f(151));for(var et=Qn=null,nt=ke,at=ke=0,Pt=null,_t=je.next();nt!==null&&!_t.done;at++,_t=je.next()){nt.index>at?(Pt=nt,nt=null):Pt=nt.sibling;var Qr=wn(Be,nt,_t.value,Cn);if(Qr===null){nt===null&&(nt=Pt);break}e&&nt&&Qr.alternate===null&&n(Be,nt),ke=u(Qr,ke,at),et===null?Qn=Qr:et.sibling=Qr,et=Qr,nt=Pt}if(_t.done)return t(Be,nt),At&&oa(Be,at),Qn;if(nt===null){for(;!_t.done;at++,_t=je.next())_t=Rn(Be,_t.value,Cn),_t!==null&&(ke=u(_t,ke,at),et===null?Qn=_t:et.sibling=_t,et=_t);return At&&oa(Be,at),Qn}for(nt=r(Be,nt);!_t.done;at++,_t=je.next())_t=Kn(nt,Be,at,_t.value,Cn),_t!==null&&(e&&_t.alternate!==null&&nt.delete(_t.key===null?at:_t.key),ke=u(_t,ke,at),et===null?Qn=_t:et.sibling=_t,et=_t);return e&&nt.forEach(function(wd){return n(Be,wd)}),At&&oa(Be,at),Qn}function bt(Be,ke,je,Cn){if(typeof je=="object"&&je!==null&&je.type===P&&je.key===null&&(je=je.props.children),typeof je=="object"&&je!==null){switch(je.$$typeof){case Xe:e:{for(var Qn=je.key,et=ke;et!==null;){if(et.key===Qn){if(Qn=je.type,Qn===P){if(et.tag===7){t(Be,et.sibling),ke=i(et,je.props.children),ke.return=Be,Be=ke;break e}}else if(et.elementType===Qn||typeof Qn=="object"&&Qn!==null&&Qn.$$typeof===oe&&zs(Qn)===et.type){t(Be,et.sibling),ke=i(et,je.props),ke.ref=el(Be,et,je),ke.return=Be,Be=ke;break e}t(Be,et);break}else n(Be,et);et=et.sibling}je.type===P?(ke=_a(je.props.children,Be.mode,Cn,je.key),ke.return=Be,Be=ke):(Cn=lo(je.type,je.key,je.props,null,Be.mode,Cn),Cn.ref=el(Be,ke,je),Cn.return=Be,Be=Cn)}return x(Be);case ln:e:{for(et=je.key;ke!==null;){if(ke.key===et)if(ke.tag===4&&ke.stateNode.containerInfo===je.containerInfo&&ke.stateNode.implementation===je.implementation){t(Be,ke.sibling),ke=i(ke,je.children||[]),ke.return=Be,Be=ke;break e}else{t(Be,ke);break}else n(Be,ke);ke=ke.sibling}ke=Di(je,Be.mode,Cn),ke.return=Be,Be=ke}return x(Be);case oe:return et=je._init,bt(Be,ke,et(je._payload),Cn)}if(me(je))return Yn(Be,ke,je,Cn);if(Ce(je))return qn(Be,ke,je,Cn);Il(Be,je)}return typeof je=="string"&&je!==""||typeof je=="number"?(je=""+je,ke!==null&&ke.tag===6?(t(Be,ke.sibling),ke=i(ke,je),ke.return=Be,Be=ke):(t(Be,ke),ke=Pi(je,Be.mode,Cn),ke.return=Be,Be=ke),x(Be)):t(Be,ke)}return bt}var Sa=Ks(!0),Hs=Ks(!1),Pl=Fr(null),Dl=null,Oa=null,Xo=null;function Yo(){Xo=Oa=Dl=null}function Wo(e){var n=Pl.current;vt(Pl),e._currentValue=n}function qo(e,n,t){for(;e!==null;){var r=e.alternate;if((e.childLanes&n)!==n?(e.childLanes|=n,r!==null&&(r.childLanes|=n)):r!==null&&(r.childLanes&n)!==n&&(r.childLanes|=n),e===t)break;e=e.return}}function Ra(e,n){Dl=e,Xo=Oa=null,e=e.dependencies,e!==null&&e.firstContext!==null&&((e.lanes&n)!==0&&(Zt=!0),e.firstContext=null)}function sr(e){var n=e._currentValue;if(Xo!==e)if(e={context:e,memoizedValue:n,next:null},Oa===null){if(Dl===null)throw Error(f(308));Oa=e,Dl.dependencies={lanes:0,firstContext:e}}else Oa=Oa.next=e;return n}var ia=null;function $o(e){ia===null?ia=[e]:ia.push(e)}function Xs(e,n,t,r){var i=n.interleaved;return i===null?(t.next=t,$o(n)):(t.next=i.next,i.next=t),n.interleaved=t,Nr(e,r)}function Nr(e,n){e.lanes|=n;var t=e.alternate;for(t!==null&&(t.lanes|=n),t=e,e=e.return;e!==null;)e.childLanes|=n,t=e.alternate,t!==null&&(t.childLanes|=n),t=e,e=e.return;return t.tag===3?t.stateNode:null}var zr=!1;function Qo(e){e.updateQueue={baseState:e.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,interleaved:null,lanes:0},effects:null}}function Ys(e,n){e=e.updateQueue,n.updateQueue===e&&(n.updateQueue={baseState:e.baseState,firstBaseUpdate:e.firstBaseUpdate,lastBaseUpdate:e.lastBaseUpdate,shared:e.shared,effects:e.effects})}function Cr(e,n){return{eventTime:e,lane:n,tag:0,payload:null,callback:null,next:null}}function Kr(e,n,t){var r=e.updateQueue;if(r===null)return null;if(r=r.shared,(dt&2)!==0){var i=r.pending;return i===null?n.next=n:(n.next=i.next,i.next=n),r.pending=n,Nr(e,t)}return i=r.interleaved,i===null?(n.next=n,$o(r)):(n.next=i.next,i.next=n),r.interleaved=n,Nr(e,t)}function Gl(e,n,t){if(n=n.updateQueue,n!==null&&(n=n.shared,(t&4194240)!==0)){var r=n.lanes;r&=e.pendingLanes,t|=r,n.lanes=t,zn(e,t)}}function Ws(e,n){var t=e.updateQueue,r=e.alternate;if(r!==null&&(r=r.updateQueue,t===r)){var i=null,u=null;if(t=t.firstBaseUpdate,t!==null){do{var x={eventTime:t.eventTime,lane:t.lane,tag:t.tag,payload:t.payload,callback:t.callback,next:null};u===null?i=u=x:u=u.next=x,t=t.next}while(t!==null);u===null?i=u=n:u=u.next=n}else i=u=n;t={baseState:r.baseState,firstBaseUpdate:i,lastBaseUpdate:u,shared:r.shared,effects:r.effects},e.updateQueue=t;return}e=t.lastBaseUpdate,e===null?t.firstBaseUpdate=n:e.next=n,t.lastBaseUpdate=n}function Bl(e,n,t,r){var i=e.updateQueue;zr=!1;var u=i.firstBaseUpdate,x=i.lastBaseUpdate,W=i.shared.pending;if(W!==null){i.shared.pending=null;var ue=W,qe=ue.next;ue.next=null,x===null?u=qe:x.next=qe,x=ue;var Ln=e.alternate;Ln!==null&&(Ln=Ln.updateQueue,W=Ln.lastBaseUpdate,W!==x&&(W===null?Ln.firstBaseUpdate=qe:W.next=qe,Ln.lastBaseUpdate=ue))}if(u!==null){var Rn=i.baseState;x=0,Ln=qe=ue=null,W=u;do{var wn=W.lane,Kn=W.eventTime;if((r&wn)===wn){Ln!==null&&(Ln=Ln.next={eventTime:Kn,lane:0,tag:W.tag,payload:W.payload,callback:W.callback,next:null});e:{var Yn=e,qn=W;switch(wn=n,Kn=t,qn.tag){case 1:if(Yn=qn.payload,typeof Yn=="function"){Rn=Yn.call(Kn,Rn,wn);break e}Rn=Yn;break e;case 3:Yn.flags=Yn.flags&-65537|128;case 0:if(Yn=qn.payload,wn=typeof Yn=="function"?Yn.call(Kn,Rn,wn):Yn,wn==null)break e;Rn=E({},Rn,wn);break e;case 2:zr=!0}}W.callback!==null&&W.lane!==0&&(e.flags|=64,wn=i.effects,wn===null?i.effects=[W]:wn.push(W))}else Kn={eventTime:Kn,lane:wn,tag:W.tag,payload:W.payload,callback:W.callback,next:null},Ln===null?(qe=Ln=Kn,ue=Rn):Ln=Ln.next=Kn,x|=wn;if(W=W.next,W===null){if(W=i.shared.pending,W===null)break;wn=W,W=wn.next,wn.next=null,i.lastBaseUpdate=wn,i.shared.pending=null}}while(!0);if(Ln===null&&(ue=Rn),i.baseState=ue,i.firstBaseUpdate=qe,i.lastBaseUpdate=Ln,n=i.shared.interleaved,n!==null){i=n;do x|=i.lane,i=i.next;while(i!==n)}else u===null&&(i.shared.lanes=0);ca|=x,e.lanes=x,e.memoizedState=Rn}}function qs(e,n,t){if(e=n.effects,n.effects=null,e!==null)for(n=0;n<e.length;n++){var r=e[n],i=r.callback;if(i!==null){if(r.callback=null,r=t,typeof i!="function")throw Error(f(191,i));i.call(r)}}}var nl={},kr=Fr(nl),tl=Fr(nl),rl=Fr(nl);function sa(e){if(e===nl)throw Error(f(174));return e}function Zo(e,n){switch(gt(rl,n),gt(tl,e),gt(kr,nl),e=n.nodeType,e){case 9:case 11:n=(n=n.documentElement)?n.namespaceURI:Mn(null,"");break;default:e=e===8?n.parentNode:n,n=e.namespaceURI||null,e=e.tagName,n=Mn(n,e)}vt(kr),gt(kr,n)}function Na(){vt(kr),vt(tl),vt(rl)}function $s(e){sa(rl.current);var n=sa(kr.current),t=Mn(n,e.type);n!==t&&(gt(tl,e),gt(kr,t))}function Jo(e){tl.current===e&&(vt(kr),vt(tl))}var kt=Fr(0);function Fl(e){for(var n=e;n!==null;){if(n.tag===13){var t=n.memoizedState;if(t!==null&&(t=t.dehydrated,t===null||t.data==="$?"||t.data==="$!"))return n}else if(n.tag===19&&n.memoizedProps.revealOrder!==void 0){if((n.flags&128)!==0)return n}else if(n.child!==null){n.child.return=n,n=n.child;continue}if(n===e)break;for(;n.sibling===null;){if(n.return===null||n.return===e)return null;n=n.return}n.sibling.return=n.return,n=n.sibling}return null}var ei=[];function ni(){for(var e=0;e<ei.length;e++)ei[e]._workInProgressVersionPrimary=null;ei.length=0}var Vl=He.ReactCurrentDispatcher,ti=He.ReactCurrentBatchConfig,ua=0,Tt=null,Rt=null,Ut=null,jl=!1,al=!1,ll=0,Xf=0;function zt(){throw Error(f(321))}function ri(e,n){if(n===null)return!1;for(var t=0;t<n.length&&t<e.length;t++)if(!_r(e[t],n[t]))return!1;return!0}function ai(e,n,t,r,i,u){if(ua=u,Tt=n,n.memoizedState=null,n.updateQueue=null,n.lanes=0,Vl.current=e===null||e.memoizedState===null?$f:Qf,e=t(r,i),al){u=0;do{if(al=!1,ll=0,25<=u)throw Error(f(301));u+=1,Ut=Rt=null,n.updateQueue=null,Vl.current=Zf,e=t(r,i)}while(al)}if(Vl.current=Hl,n=Rt!==null&&Rt.next!==null,ua=0,Ut=Rt=Tt=null,jl=!1,n)throw Error(f(300));return e}function li(){var e=ll!==0;return ll=0,e}function Tr(){var e={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return Ut===null?Tt.memoizedState=Ut=e:Ut=Ut.next=e,Ut}function ur(){if(Rt===null){var e=Tt.alternate;e=e!==null?e.memoizedState:null}else e=Rt.next;var n=Ut===null?Tt.memoizedState:Ut.next;if(n!==null)Ut=n,Rt=e;else{if(e===null)throw Error(f(310));Rt=e,e={memoizedState:Rt.memoizedState,baseState:Rt.baseState,baseQueue:Rt.baseQueue,queue:Rt.queue,next:null},Ut===null?Tt.memoizedState=Ut=e:Ut=Ut.next=e}return Ut}function ol(e,n){return typeof n=="function"?n(e):n}function oi(e){var n=ur(),t=n.queue;if(t===null)throw Error(f(311));t.lastRenderedReducer=e;var r=Rt,i=r.baseQueue,u=t.pending;if(u!==null){if(i!==null){var x=i.next;i.next=u.next,u.next=x}r.baseQueue=i=u,t.pending=null}if(i!==null){u=i.next,r=r.baseState;var W=x=null,ue=null,qe=u;do{var Ln=qe.lane;if((ua&Ln)===Ln)ue!==null&&(ue=ue.next={lane:0,action:qe.action,hasEagerState:qe.hasEagerState,eagerState:qe.eagerState,next:null}),r=qe.hasEagerState?qe.eagerState:e(r,qe.action);else{var Rn={lane:Ln,action:qe.action,hasEagerState:qe.hasEagerState,eagerState:qe.eagerState,next:null};ue===null?(W=ue=Rn,x=r):ue=ue.next=Rn,Tt.lanes|=Ln,ca|=Ln}qe=qe.next}while(qe!==null&&qe!==u);ue===null?x=r:ue.next=W,_r(r,n.memoizedState)||(Zt=!0),n.memoizedState=r,n.baseState=x,n.baseQueue=ue,t.lastRenderedState=r}if(e=t.interleaved,e!==null){i=e;do u=i.lane,Tt.lanes|=u,ca|=u,i=i.next;while(i!==e)}else i===null&&(t.lanes=0);return[n.memoizedState,t.dispatch]}function ii(e){var n=ur(),t=n.queue;if(t===null)throw Error(f(311));t.lastRenderedReducer=e;var r=t.dispatch,i=t.pending,u=n.memoizedState;if(i!==null){t.pending=null;var x=i=i.next;do u=e(u,x.action),x=x.next;while(x!==i);_r(u,n.memoizedState)||(Zt=!0),n.memoizedState=u,n.baseQueue===null&&(n.baseState=u),t.lastRenderedState=u}return[u,r]}function Qs(){}function Zs(e,n){var t=Tt,r=ur(),i=n(),u=!_r(r.memoizedState,i);if(u&&(r.memoizedState=i,Zt=!0),r=r.queue,si(nu.bind(null,t,r,e),[e]),r.getSnapshot!==n||u||Ut!==null&&Ut.memoizedState.tag&1){if(t.flags|=2048,il(9,eu.bind(null,t,r,i,n),void 0,null),It===null)throw Error(f(349));(ua&30)!==0||Js(t,n,i)}return i}function Js(e,n,t){e.flags|=16384,e={getSnapshot:n,value:t},n=Tt.updateQueue,n===null?(n={lastEffect:null,stores:null},Tt.updateQueue=n,n.stores=[e]):(t=n.stores,t===null?n.stores=[e]:t.push(e))}function eu(e,n,t,r){n.value=t,n.getSnapshot=r,tu(n)&&ru(e)}function nu(e,n,t){return t(function(){tu(n)&&ru(e)})}function tu(e){var n=e.getSnapshot;e=e.value;try{var t=n();return!_r(e,t)}catch{return!0}}function ru(e){var n=Nr(e,1);n!==null&&vr(n,e,1,-1)}function au(e){var n=Tr();return typeof e=="function"&&(e=e()),n.memoizedState=n.baseState=e,e={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:ol,lastRenderedState:e},n.queue=e,e=e.dispatch=qf.bind(null,Tt,e),[n.memoizedState,e]}function il(e,n,t,r){return e={tag:e,create:n,destroy:t,deps:r,next:null},n=Tt.updateQueue,n===null?(n={lastEffect:null,stores:null},Tt.updateQueue=n,n.lastEffect=e.next=e):(t=n.lastEffect,t===null?n.lastEffect=e.next=e:(r=t.next,t.next=e,e.next=r,n.lastEffect=e)),e}function lu(){return ur().memoizedState}function zl(e,n,t,r){var i=Tr();Tt.flags|=e,i.memoizedState=il(1|n,t,void 0,r===void 0?null:r)}function Kl(e,n,t,r){var i=ur();r=r===void 0?null:r;var u=void 0;if(Rt!==null){var x=Rt.memoizedState;if(u=x.destroy,r!==null&&ri(r,x.deps)){i.memoizedState=il(n,t,u,r);return}}Tt.flags|=e,i.memoizedState=il(1|n,t,u,r)}function ou(e,n){return zl(8390656,8,e,n)}function si(e,n){return Kl(2048,8,e,n)}function iu(e,n){return Kl(4,2,e,n)}function su(e,n){return Kl(4,4,e,n)}function uu(e,n){if(typeof n=="function")return e=e(),n(e),function(){n(null)};if(n!=null)return e=e(),n.current=e,function(){n.current=null}}function cu(e,n,t){return t=t!=null?t.concat([e]):null,Kl(4,4,uu.bind(null,n,e),t)}function ui(){}function fu(e,n){var t=ur();n=n===void 0?null:n;var r=t.memoizedState;return r!==null&&n!==null&&ri(n,r[1])?r[0]:(t.memoizedState=[e,n],e)}function du(e,n){var t=ur();n=n===void 0?null:n;var r=t.memoizedState;return r!==null&&n!==null&&ri(n,r[1])?r[0]:(e=e(),t.memoizedState=[e,n],e)}function pu(e,n,t){return(ua&21)===0?(e.baseState&&(e.baseState=!1,Zt=!0),e.memoizedState=t):(_r(t,n)||(t=he(),Tt.lanes|=t,ca|=t,e.baseState=!0),n)}function Yf(e,n){var t=jn;jn=t!==0&&4>t?t:4,e(!0);var r=ti.transition;ti.transition={};try{e(!1),n()}finally{jn=t,ti.transition=r}}function _u(){return ur().memoizedState}function Wf(e,n,t){var r=Wr(e);if(t={lane:r,action:t,hasEagerState:!1,eagerState:null,next:null},hu(e))mu(n,t);else if(t=Xs(e,n,t,r),t!==null){var i=Wt();vr(t,e,r,i),gu(t,n,r)}}function qf(e,n,t){var r=Wr(e),i={lane:r,action:t,hasEagerState:!1,eagerState:null,next:null};if(hu(e))mu(n,i);else{var u=e.alternate;if(e.lanes===0&&(u===null||u.lanes===0)&&(u=n.lastRenderedReducer,u!==null))try{var x=n.lastRenderedState,W=u(x,t);if(i.hasEagerState=!0,i.eagerState=W,_r(W,x)){var ue=n.interleaved;ue===null?(i.next=i,$o(n)):(i.next=ue.next,ue.next=i),n.interleaved=i;return}}catch{}finally{}t=Xs(e,n,i,r),t!==null&&(i=Wt(),vr(t,e,r,i),gu(t,n,r))}}function hu(e){var n=e.alternate;return e===Tt||n!==null&&n===Tt}function mu(e,n){al=jl=!0;var t=e.pending;t===null?n.next=n:(n.next=t.next,t.next=n),e.pending=n}function gu(e,n,t){if((t&4194240)!==0){var r=n.lanes;r&=e.pendingLanes,t|=r,n.lanes=t,zn(e,t)}}var Hl={readContext:sr,useCallback:zt,useContext:zt,useEffect:zt,useImperativeHandle:zt,useInsertionEffect:zt,useLayoutEffect:zt,useMemo:zt,useReducer:zt,useRef:zt,useState:zt,useDebugValue:zt,useDeferredValue:zt,useTransition:zt,useMutableSource:zt,useSyncExternalStore:zt,useId:zt,unstable_isNewReconciler:!1},$f={readContext:sr,useCallback:function(e,n){return Tr().memoizedState=[e,n===void 0?null:n],e},useContext:sr,useEffect:ou,useImperativeHandle:function(e,n,t){return t=t!=null?t.concat([e]):null,zl(4194308,4,uu.bind(null,n,e),t)},useLayoutEffect:function(e,n){return zl(4194308,4,e,n)},useInsertionEffect:function(e,n){return zl(4,2,e,n)},useMemo:function(e,n){var t=Tr();return n=n===void 0?null:n,e=e(),t.memoizedState=[e,n],e},useReducer:function(e,n,t){var r=Tr();return n=t!==void 0?t(n):n,r.memoizedState=r.baseState=n,e={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:e,lastRenderedState:n},r.queue=e,e=e.dispatch=Wf.bind(null,Tt,e),[r.memoizedState,e]},useRef:function(e){var n=Tr();return e={current:e},n.memoizedState=e},useState:au,useDebugValue:ui,useDeferredValue:function(e){return Tr().memoizedState=e},useTransition:function(){var e=au(!1),n=e[0];return e=Yf.bind(null,e[1]),Tr().memoizedState=e,[n,e]},useMutableSource:function(){},useSyncExternalStore:function(e,n,t){var r=Tt,i=Tr();if(At){if(t===void 0)throw Error(f(407));t=t()}else{if(t=n(),It===null)throw Error(f(349));(ua&30)!==0||Js(r,n,t)}i.memoizedState=t;var u={value:t,getSnapshot:n};return i.queue=u,ou(nu.bind(null,r,u,e),[e]),r.flags|=2048,il(9,eu.bind(null,r,u,t,n),void 0,null),t},useId:function(){var e=Tr(),n=It.identifierPrefix;if(At){var t=Rr,r=Or;t=(r&~(1<<32-on(r)-1)).toString(32)+t,n=":"+n+"R"+t,t=ll++,0<t&&(n+="H"+t.toString(32)),n+=":"}else t=Xf++,n=":"+n+"r"+t.toString(32)+":";return e.memoizedState=n},unstable_isNewReconciler:!1},Qf={readContext:sr,useCallback:fu,useContext:sr,useEffect:si,useImperativeHandle:cu,useInsertionEffect:iu,useLayoutEffect:su,useMemo:du,useReducer:oi,useRef:lu,useState:function(){return oi(ol)},useDebugValue:ui,useDeferredValue:function(e){var n=ur();return pu(n,Rt.memoizedState,e)},useTransition:function(){var e=oi(ol)[0],n=ur().memoizedState;return[e,n]},useMutableSource:Qs,useSyncExternalStore:Zs,useId:_u,unstable_isNewReconciler:!1},Zf={readContext:sr,useCallback:fu,useContext:sr,useEffect:si,useImperativeHandle:cu,useInsertionEffect:iu,useLayoutEffect:su,useMemo:du,useReducer:ii,useRef:lu,useState:function(){return ii(ol)},useDebugValue:ui,useDeferredValue:function(e){var n=ur();return Rt===null?n.memoizedState=e:pu(n,Rt.memoizedState,e)},useTransition:function(){var e=ii(ol)[0],n=ur().memoizedState;return[e,n]},useMutableSource:Qs,useSyncExternalStore:Zs,useId:_u,unstable_isNewReconciler:!1};function mr(e,n){if(e&&e.defaultProps){n=E({},n),e=e.defaultProps;for(var t in e)n[t]===void 0&&(n[t]=e[t]);return n}return n}function ci(e,n,t,r){n=e.memoizedState,t=t(r,n),t=t==null?n:E({},n,t),e.memoizedState=t,e.lanes===0&&(e.updateQueue.baseState=t)}var Xl={isMounted:function(e){return(e=e._reactInternals)?Me(e)===e:!1},enqueueSetState:function(e,n,t){e=e._reactInternals;var r=Wt(),i=Wr(e),u=Cr(r,i);u.payload=n,t!=null&&(u.callback=t),n=Kr(e,u,i),n!==null&&(vr(n,e,i,r),Gl(n,e,i))},enqueueReplaceState:function(e,n,t){e=e._reactInternals;var r=Wt(),i=Wr(e),u=Cr(r,i);u.tag=1,u.payload=n,t!=null&&(u.callback=t),n=Kr(e,u,i),n!==null&&(vr(n,e,i,r),Gl(n,e,i))},enqueueForceUpdate:function(e,n){e=e._reactInternals;var t=Wt(),r=Wr(e),i=Cr(t,r);i.tag=2,n!=null&&(i.callback=n),n=Kr(e,i,r),n!==null&&(vr(n,e,r,t),Gl(n,e,r))}};function yu(e,n,t,r,i,u,x){return e=e.stateNode,typeof e.shouldComponentUpdate=="function"?e.shouldComponentUpdate(r,u,x):n.prototype&&n.prototype.isPureReactComponent?!Ya(t,r)||!Ya(i,u):!0}function vu(e,n,t){var r=!1,i=Vr,u=n.contextType;return typeof u=="object"&&u!==null?u=sr(u):(i=Qt(n)?aa:jt.current,r=n.contextTypes,u=(r=r!=null)?wa(e,i):Vr),n=new n(t,u),e.memoizedState=n.state!==null&&n.state!==void 0?n.state:null,n.updater=Xl,e.stateNode=n,n._reactInternals=e,r&&(e=e.stateNode,e.__reactInternalMemoizedUnmaskedChildContext=i,e.__reactInternalMemoizedMaskedChildContext=u),n}function xu(e,n,t,r){e=n.state,typeof n.componentWillReceiveProps=="function"&&n.componentWillReceiveProps(t,r),typeof n.UNSAFE_componentWillReceiveProps=="function"&&n.UNSAFE_componentWillReceiveProps(t,r),n.state!==e&&Xl.enqueueReplaceState(n,n.state,null)}function fi(e,n,t,r){var i=e.stateNode;i.props=t,i.state=e.memoizedState,i.refs={},Qo(e);var u=n.contextType;typeof u=="object"&&u!==null?i.context=sr(u):(u=Qt(n)?aa:jt.current,i.context=wa(e,u)),i.state=e.memoizedState,u=n.getDerivedStateFromProps,typeof u=="function"&&(ci(e,n,u,t),i.state=e.memoizedState),typeof n.getDerivedStateFromProps=="function"||typeof i.getSnapshotBeforeUpdate=="function"||typeof i.UNSAFE_componentWillMount!="function"&&typeof i.componentWillMount!="function"||(n=i.state,typeof i.componentWillMount=="function"&&i.componentWillMount(),typeof i.UNSAFE_componentWillMount=="function"&&i.UNSAFE_componentWillMount(),n!==i.state&&Xl.enqueueReplaceState(i,i.state,null),Bl(e,t,i,r),i.state=e.memoizedState),typeof i.componentDidMount=="function"&&(e.flags|=4194308)}function Ca(e,n){try{var t="",r=n;do t+=pn(r),r=r.return;while(r);var i=t}catch(u){i=`
Error generating stack: `+u.message+`
`+u.stack}return{value:e,source:n,stack:i,digest:null}}function di(e,n,t){return{value:e,source:null,stack:t??null,digest:n??null}}function pi(e,n){try{console.error(n.value)}catch(t){setTimeout(function(){throw t})}}var Jf=typeof WeakMap=="function"?WeakMap:Map;function Au(e,n,t){t=Cr(-1,t),t.tag=3,t.payload={element:null};var r=n.value;return t.callback=function(){Jl||(Jl=!0,Si=r),pi(e,n)},t}function ku(e,n,t){t=Cr(-1,t),t.tag=3;var r=e.type.getDerivedStateFromError;if(typeof r=="function"){var i=n.value;t.payload=function(){return r(i)},t.callback=function(){pi(e,n)}}var u=e.stateNode;return u!==null&&typeof u.componentDidCatch=="function"&&(t.callback=function(){pi(e,n),typeof r!="function"&&(Xr===null?Xr=new Set([this]):Xr.add(this));var x=n.stack;this.componentDidCatch(n.value,{componentStack:x!==null?x:""})}),t}function Tu(e,n,t){var r=e.pingCache;if(r===null){r=e.pingCache=new Jf;var i=new Set;r.set(n,i)}else i=r.get(n),i===void 0&&(i=new Set,r.set(n,i));i.has(t)||(i.add(t),e=pd.bind(null,e,n,t),n.then(e,e))}function wu(e){do{var n;if((n=e.tag===13)&&(n=e.memoizedState,n=n!==null?n.dehydrated!==null:!0),n)return e;e=e.return}while(e!==null);return null}function Eu(e,n,t,r,i){return(e.mode&1)===0?(e===n?e.flags|=65536:(e.flags|=128,t.flags|=131072,t.flags&=-52805,t.tag===1&&(t.alternate===null?t.tag=17:(n=Cr(-1,1),n.tag=2,Kr(t,n,1))),t.lanes|=1),e):(e.flags|=65536,e.lanes=i,e)}var ed=He.ReactCurrentOwner,Zt=!1;function Yt(e,n,t,r){n.child=e===null?Hs(n,null,t,r):Sa(n,e.child,t,r)}function Lu(e,n,t,r,i){t=t.render;var u=n.ref;return Ra(n,i),r=ai(e,n,t,r,u,i),t=li(),e!==null&&!Zt?(n.updateQueue=e.updateQueue,n.flags&=-2053,e.lanes&=~i,Mr(e,n,i)):(At&&t&&Vo(n),n.flags|=1,Yt(e,n,r,i),n.child)}function bu(e,n,t,r,i){if(e===null){var u=t.type;return typeof u=="function"&&!Ii(u)&&u.defaultProps===void 0&&t.compare===null&&t.defaultProps===void 0?(n.tag=15,n.type=u,Su(e,n,u,r,i)):(e=lo(t.type,null,r,n,n.mode,i),e.ref=n.ref,e.return=n,n.child=e)}if(u=e.child,(e.lanes&i)===0){var x=u.memoizedProps;if(t=t.compare,t=t!==null?t:Ya,t(x,r)&&e.ref===n.ref)return Mr(e,n,i)}return n.flags|=1,e=$r(u,r),e.ref=n.ref,e.return=n,n.child=e}function Su(e,n,t,r,i){if(e!==null){var u=e.memoizedProps;if(Ya(u,r)&&e.ref===n.ref)if(Zt=!1,n.pendingProps=r=u,(e.lanes&i)!==0)(e.flags&131072)!==0&&(Zt=!0);else return n.lanes=e.lanes,Mr(e,n,i)}return _i(e,n,t,r,i)}function Ou(e,n,t){var r=n.pendingProps,i=r.children,u=e!==null?e.memoizedState:null;if(r.mode==="hidden")if((n.mode&1)===0)n.memoizedState={baseLanes:0,cachePool:null,transitions:null},gt(Ua,lr),lr|=t;else{if((t&1073741824)===0)return e=u!==null?u.baseLanes|t:t,n.lanes=n.childLanes=1073741824,n.memoizedState={baseLanes:e,cachePool:null,transitions:null},n.updateQueue=null,gt(Ua,lr),lr|=e,null;n.memoizedState={baseLanes:0,cachePool:null,transitions:null},r=u!==null?u.baseLanes:t,gt(Ua,lr),lr|=r}else u!==null?(r=u.baseLanes|t,n.memoizedState=null):r=t,gt(Ua,lr),lr|=r;return Yt(e,n,i,t),n.child}function Ru(e,n){var t=n.ref;(e===null&&t!==null||e!==null&&e.ref!==t)&&(n.flags|=512,n.flags|=2097152)}function _i(e,n,t,r,i){var u=Qt(t)?aa:jt.current;return u=wa(n,u),Ra(n,i),t=ai(e,n,t,r,u,i),r=li(),e!==null&&!Zt?(n.updateQueue=e.updateQueue,n.flags&=-2053,e.lanes&=~i,Mr(e,n,i)):(At&&r&&Vo(n),n.flags|=1,Yt(e,n,t,i),n.child)}function Nu(e,n,t,r,i){if(Qt(t)){var u=!0;Rl(n)}else u=!1;if(Ra(n,i),n.stateNode===null)Wl(e,n),vu(n,t,r),fi(n,t,r,i),r=!0;else if(e===null){var x=n.stateNode,W=n.memoizedProps;x.props=W;var ue=x.context,qe=t.contextType;typeof qe=="object"&&qe!==null?qe=sr(qe):(qe=Qt(t)?aa:jt.current,qe=wa(n,qe));var Ln=t.getDerivedStateFromProps,Rn=typeof Ln=="function"||typeof x.getSnapshotBeforeUpdate=="function";Rn||typeof x.UNSAFE_componentWillReceiveProps!="function"&&typeof x.componentWillReceiveProps!="function"||(W!==r||ue!==qe)&&xu(n,x,r,qe),zr=!1;var wn=n.memoizedState;x.state=wn,Bl(n,r,x,i),ue=n.memoizedState,W!==r||wn!==ue||$t.current||zr?(typeof Ln=="function"&&(ci(n,t,Ln,r),ue=n.memoizedState),(W=zr||yu(n,t,W,r,wn,ue,qe))?(Rn||typeof x.UNSAFE_componentWillMount!="function"&&typeof x.componentWillMount!="function"||(typeof x.componentWillMount=="function"&&x.componentWillMount(),typeof x.UNSAFE_componentWillMount=="function"&&x.UNSAFE_componentWillMount()),typeof x.componentDidMount=="function"&&(n.flags|=4194308)):(typeof x.componentDidMount=="function"&&(n.flags|=4194308),n.memoizedProps=r,n.memoizedState=ue),x.props=r,x.state=ue,x.context=qe,r=W):(typeof x.componentDidMount=="function"&&(n.flags|=4194308),r=!1)}else{x=n.stateNode,Ys(e,n),W=n.memoizedProps,qe=n.type===n.elementType?W:mr(n.type,W),x.props=qe,Rn=n.pendingProps,wn=x.context,ue=t.contextType,typeof ue=="object"&&ue!==null?ue=sr(ue):(ue=Qt(t)?aa:jt.current,ue=wa(n,ue));var Kn=t.getDerivedStateFromProps;(Ln=typeof Kn=="function"||typeof x.getSnapshotBeforeUpdate=="function")||typeof x.UNSAFE_componentWillReceiveProps!="function"&&typeof x.componentWillReceiveProps!="function"||(W!==Rn||wn!==ue)&&xu(n,x,r,ue),zr=!1,wn=n.memoizedState,x.state=wn,Bl(n,r,x,i);var Yn=n.memoizedState;W!==Rn||wn!==Yn||$t.current||zr?(typeof Kn=="function"&&(ci(n,t,Kn,r),Yn=n.memoizedState),(qe=zr||yu(n,t,qe,r,wn,Yn,ue)||!1)?(Ln||typeof x.UNSAFE_componentWillUpdate!="function"&&typeof x.componentWillUpdate!="function"||(typeof x.componentWillUpdate=="function"&&x.componentWillUpdate(r,Yn,ue),typeof x.UNSAFE_componentWillUpdate=="function"&&x.UNSAFE_componentWillUpdate(r,Yn,ue)),typeof x.componentDidUpdate=="function"&&(n.flags|=4),typeof x.getSnapshotBeforeUpdate=="function"&&(n.flags|=1024)):(typeof x.componentDidUpdate!="function"||W===e.memoizedProps&&wn===e.memoizedState||(n.flags|=4),typeof x.getSnapshotBeforeUpdate!="function"||W===e.memoizedProps&&wn===e.memoizedState||(n.flags|=1024),n.memoizedProps=r,n.memoizedState=Yn),x.props=r,x.state=Yn,x.context=ue,r=qe):(typeof x.componentDidUpdate!="function"||W===e.memoizedProps&&wn===e.memoizedState||(n.flags|=4),typeof x.getSnapshotBeforeUpdate!="function"||W===e.memoizedProps&&wn===e.memoizedState||(n.flags|=1024),r=!1)}return hi(e,n,t,r,u,i)}function hi(e,n,t,r,i,u){Ru(e,n);var x=(n.flags&128)!==0;if(!r&&!x)return i&&Ps(n,t,!1),Mr(e,n,u);r=n.stateNode,ed.current=n;var W=x&&typeof t.getDerivedStateFromError!="function"?null:r.render();return n.flags|=1,e!==null&&x?(n.child=Sa(n,e.child,null,u),n.child=Sa(n,null,W,u)):Yt(e,n,W,u),n.memoizedState=r.state,i&&Ps(n,t,!0),n.child}function Cu(e){var n=e.stateNode;n.pendingContext?Us(e,n.pendingContext,n.pendingContext!==n.context):n.context&&Us(e,n.context,!1),Zo(e,n.containerInfo)}function Mu(e,n,t,r,i){return ba(),Ho(i),n.flags|=256,Yt(e,n,t,r),n.child}var mi={dehydrated:null,treeContext:null,retryLane:0};function gi(e){return{baseLanes:e,cachePool:null,transitions:null}}function Uu(e,n,t){var r=n.pendingProps,i=kt.current,u=!1,x=(n.flags&128)!==0,W;if((W=x)||(W=e!==null&&e.memoizedState===null?!1:(i&2)!==0),W?(u=!0,n.flags&=-129):(e===null||e.memoizedState!==null)&&(i|=1),gt(kt,i&1),e===null)return Ko(n),e=n.memoizedState,e!==null&&(e=e.dehydrated,e!==null)?((n.mode&1)===0?n.lanes=1:e.data==="$!"?n.lanes=8:n.lanes=1073741824,null):(x=r.children,e=r.fallback,u?(r=n.mode,u=n.child,x={mode:"hidden",children:x},(r&1)===0&&u!==null?(u.childLanes=0,u.pendingProps=x):u=oo(x,r,0,null),e=_a(e,r,t,null),u.return=n,e.return=n,u.sibling=e,n.child=u,n.child.memoizedState=gi(t),n.memoizedState=mi,e):yi(n,x));if(i=e.memoizedState,i!==null&&(W=i.dehydrated,W!==null))return nd(e,n,x,r,W,i,t);if(u){u=r.fallback,x=n.mode,i=e.child,W=i.sibling;var ue={mode:"hidden",children:r.children};return(x&1)===0&&n.child!==i?(r=n.child,r.childLanes=0,r.pendingProps=ue,n.deletions=null):(r=$r(i,ue),r.subtreeFlags=i.subtreeFlags&14680064),W!==null?u=$r(W,u):(u=_a(u,x,t,null),u.flags|=2),u.return=n,r.return=n,r.sibling=u,n.child=r,r=u,u=n.child,x=e.child.memoizedState,x=x===null?gi(t):{baseLanes:x.baseLanes|t,cachePool:null,transitions:x.transitions},u.memoizedState=x,u.childLanes=e.childLanes&~t,n.memoizedState=mi,r}return u=e.child,e=u.sibling,r=$r(u,{mode:"visible",children:r.children}),(n.mode&1)===0&&(r.lanes=t),r.return=n,r.sibling=null,e!==null&&(t=n.deletions,t===null?(n.deletions=[e],n.flags|=16):t.push(e)),n.child=r,n.memoizedState=null,r}function yi(e,n){return n=oo({mode:"visible",children:n},e.mode,0,null),n.return=e,e.child=n}function Yl(e,n,t,r){return r!==null&&Ho(r),Sa(n,e.child,null,t),e=yi(n,n.pendingProps.children),e.flags|=2,n.memoizedState=null,e}function nd(e,n,t,r,i,u,x){if(t)return n.flags&256?(n.flags&=-257,r=di(Error(f(422))),Yl(e,n,x,r)):n.memoizedState!==null?(n.child=e.child,n.flags|=128,null):(u=r.fallback,i=n.mode,r=oo({mode:"visible",children:r.children},i,0,null),u=_a(u,i,x,null),u.flags|=2,r.return=n,u.return=n,r.sibling=u,n.child=r,(n.mode&1)!==0&&Sa(n,e.child,null,x),n.child.memoizedState=gi(x),n.memoizedState=mi,u);if((n.mode&1)===0)return Yl(e,n,x,null);if(i.data==="$!"){if(r=i.nextSibling&&i.nextSibling.dataset,r)var W=r.dgst;return r=W,u=Error(f(419)),r=di(u,r,void 0),Yl(e,n,x,r)}if(W=(x&e.childLanes)!==0,Zt||W){if(r=It,r!==null){switch(x&-x){case 4:i=2;break;case 16:i=8;break;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:i=32;break;case 536870912:i=268435456;break;default:i=0}i=(i&(r.suspendedLanes|x))!==0?0:i,i!==0&&i!==u.retryLane&&(u.retryLane=i,Nr(e,i),vr(r,e,i,-1))}return Ui(),r=di(Error(f(421))),Yl(e,n,x,r)}return i.data==="$?"?(n.flags|=128,n.child=e.child,n=_d.bind(null,e),i._reactRetry=n,null):(e=u.treeContext,ar=Br(i.nextSibling),rr=n,At=!0,hr=null,e!==null&&(or[ir++]=Or,or[ir++]=Rr,or[ir++]=la,Or=e.id,Rr=e.overflow,la=n),n=yi(n,r.children),n.flags|=4096,n)}function Iu(e,n,t){e.lanes|=n;var r=e.alternate;r!==null&&(r.lanes|=n),qo(e.return,n,t)}function vi(e,n,t,r,i){var u=e.memoizedState;u===null?e.memoizedState={isBackwards:n,rendering:null,renderingStartTime:0,last:r,tail:t,tailMode:i}:(u.isBackwards=n,u.rendering=null,u.renderingStartTime=0,u.last=r,u.tail=t,u.tailMode=i)}function Pu(e,n,t){var r=n.pendingProps,i=r.revealOrder,u=r.tail;if(Yt(e,n,r.children,t),r=kt.current,(r&2)!==0)r=r&1|2,n.flags|=128;else{if(e!==null&&(e.flags&128)!==0)e:for(e=n.child;e!==null;){if(e.tag===13)e.memoizedState!==null&&Iu(e,t,n);else if(e.tag===19)Iu(e,t,n);else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===n)break e;for(;e.sibling===null;){if(e.return===null||e.return===n)break e;e=e.return}e.sibling.return=e.return,e=e.sibling}r&=1}if(gt(kt,r),(n.mode&1)===0)n.memoizedState=null;else switch(i){case"forwards":for(t=n.child,i=null;t!==null;)e=t.alternate,e!==null&&Fl(e)===null&&(i=t),t=t.sibling;t=i,t===null?(i=n.child,n.child=null):(i=t.sibling,t.sibling=null),vi(n,!1,i,t,u);break;case"backwards":for(t=null,i=n.child,n.child=null;i!==null;){if(e=i.alternate,e!==null&&Fl(e)===null){n.child=i;break}e=i.sibling,i.sibling=t,t=i,i=e}vi(n,!0,t,null,u);break;case"together":vi(n,!1,null,null,void 0);break;default:n.memoizedState=null}return n.child}function Wl(e,n){(n.mode&1)===0&&e!==null&&(e.alternate=null,n.alternate=null,n.flags|=2)}function Mr(e,n,t){if(e!==null&&(n.dependencies=e.dependencies),ca|=n.lanes,(t&n.childLanes)===0)return null;if(e!==null&&n.child!==e.child)throw Error(f(153));if(n.child!==null){for(e=n.child,t=$r(e,e.pendingProps),n.child=t,t.return=n;e.sibling!==null;)e=e.sibling,t=t.sibling=$r(e,e.pendingProps),t.return=n;t.sibling=null}return n.child}function td(e,n,t){switch(n.tag){case 3:Cu(n),ba();break;case 5:$s(n);break;case 1:Qt(n.type)&&Rl(n);break;case 4:Zo(n,n.stateNode.containerInfo);break;case 10:var r=n.type._context,i=n.memoizedProps.value;gt(Pl,r._currentValue),r._currentValue=i;break;case 13:if(r=n.memoizedState,r!==null)return r.dehydrated!==null?(gt(kt,kt.current&1),n.flags|=128,null):(t&n.child.childLanes)!==0?Uu(e,n,t):(gt(kt,kt.current&1),e=Mr(e,n,t),e!==null?e.sibling:null);gt(kt,kt.current&1);break;case 19:if(r=(t&n.childLanes)!==0,(e.flags&128)!==0){if(r)return Pu(e,n,t);n.flags|=128}if(i=n.memoizedState,i!==null&&(i.rendering=null,i.tail=null,i.lastEffect=null),gt(kt,kt.current),r)break;return null;case 22:case 23:return n.lanes=0,Ou(e,n,t)}return Mr(e,n,t)}var Du,xi,Gu,Bu;Du=function(e,n){for(var t=n.child;t!==null;){if(t.tag===5||t.tag===6)e.appendChild(t.stateNode);else if(t.tag!==4&&t.child!==null){t.child.return=t,t=t.child;continue}if(t===n)break;for(;t.sibling===null;){if(t.return===null||t.return===n)return;t=t.return}t.sibling.return=t.return,t=t.sibling}},xi=function(){},Gu=function(e,n,t,r){var i=e.memoizedProps;if(i!==r){e=n.stateNode,sa(kr.current);var u=null;switch(t){case"input":i=On(e,i),r=On(e,r),u=[];break;case"select":i=E({},i,{value:void 0}),r=E({},r,{value:void 0}),u=[];break;case"textarea":i=G(e,i),r=G(e,r),u=[];break;default:typeof i.onClick!="function"&&typeof r.onClick=="function"&&(e.onclick=bl)}d(t,r);var x;t=null;for(qe in i)if(!r.hasOwnProperty(qe)&&i.hasOwnProperty(qe)&&i[qe]!=null)if(qe==="style"){var W=i[qe];for(x in W)W.hasOwnProperty(x)&&(t||(t={}),t[x]="")}else qe!=="dangerouslySetInnerHTML"&&qe!=="children"&&qe!=="suppressContentEditableWarning"&&qe!=="suppressHydrationWarning"&&qe!=="autoFocus"&&(v.hasOwnProperty(qe)?u||(u=[]):(u=u||[]).push(qe,null));for(qe in r){var ue=r[qe];if(W=i!=null?i[qe]:void 0,r.hasOwnProperty(qe)&&ue!==W&&(ue!=null||W!=null))if(qe==="style")if(W){for(x in W)!W.hasOwnProperty(x)||ue&&ue.hasOwnProperty(x)||(t||(t={}),t[x]="");for(x in ue)ue.hasOwnProperty(x)&&W[x]!==ue[x]&&(t||(t={}),t[x]=ue[x])}else t||(u||(u=[]),u.push(qe,t)),t=ue;else qe==="dangerouslySetInnerHTML"?(ue=ue?ue.__html:void 0,W=W?W.__html:void 0,ue!=null&&W!==ue&&(u=u||[]).push(qe,ue)):qe==="children"?typeof ue!="string"&&typeof ue!="number"||(u=u||[]).push(qe,""+ue):qe!=="suppressContentEditableWarning"&&qe!=="suppressHydrationWarning"&&(v.hasOwnProperty(qe)?(ue!=null&&qe==="onScroll"&&yt("scroll",e),u||W===ue||(u=[])):(u=u||[]).push(qe,ue))}t&&(u=u||[]).push("style",t);var qe=u;(n.updateQueue=qe)&&(n.flags|=4)}},Bu=function(e,n,t,r){t!==r&&(n.flags|=4)};function sl(e,n){if(!At)switch(e.tailMode){case"hidden":n=e.tail;for(var t=null;n!==null;)n.alternate!==null&&(t=n),n=n.sibling;t===null?e.tail=null:t.sibling=null;break;case"collapsed":t=e.tail;for(var r=null;t!==null;)t.alternate!==null&&(r=t),t=t.sibling;r===null?n||e.tail===null?e.tail=null:e.tail.sibling=null:r.sibling=null}}function Kt(e){var n=e.alternate!==null&&e.alternate.child===e.child,t=0,r=0;if(n)for(var i=e.child;i!==null;)t|=i.lanes|i.childLanes,r|=i.subtreeFlags&14680064,r|=i.flags&14680064,i.return=e,i=i.sibling;else for(i=e.child;i!==null;)t|=i.lanes|i.childLanes,r|=i.subtreeFlags,r|=i.flags,i.return=e,i=i.sibling;return e.subtreeFlags|=r,e.childLanes=t,n}function rd(e,n,t){var r=n.pendingProps;switch(jo(n),n.tag){case 2:case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return Kt(n),null;case 1:return Qt(n.type)&&Ol(),Kt(n),null;case 3:return r=n.stateNode,Na(),vt($t),vt(jt),ni(),r.pendingContext&&(r.context=r.pendingContext,r.pendingContext=null),(e===null||e.child===null)&&(Ul(n)?n.flags|=4:e===null||e.memoizedState.isDehydrated&&(n.flags&256)===0||(n.flags|=1024,hr!==null&&(Ni(hr),hr=null))),xi(e,n),Kt(n),null;case 5:Jo(n);var i=sa(rl.current);if(t=n.type,e!==null&&n.stateNode!=null)Gu(e,n,t,r,i),e.ref!==n.ref&&(n.flags|=512,n.flags|=2097152);else{if(!r){if(n.stateNode===null)throw Error(f(166));return Kt(n),null}if(e=sa(kr.current),Ul(n)){r=n.stateNode,t=n.type;var u=n.memoizedProps;switch(r[Ar]=n,r[Za]=u,e=(n.mode&1)!==0,t){case"dialog":yt("cancel",r),yt("close",r);break;case"iframe":case"object":case"embed":yt("load",r);break;case"video":case"audio":for(i=0;i<qa.length;i++)yt(qa[i],r);break;case"source":yt("error",r);break;case"img":case"image":case"link":yt("error",r),yt("load",r);break;case"details":yt("toggle",r);break;case"input":An(r,u),yt("invalid",r);break;case"select":r._wrapperState={wasMultiple:!!u.multiple},yt("invalid",r);break;case"textarea":we(r,u),yt("invalid",r)}d(t,u),i=null;for(var x in u)if(u.hasOwnProperty(x)){var W=u[x];x==="children"?typeof W=="string"?r.textContent!==W&&(u.suppressHydrationWarning!==!0&&Ll(r.textContent,W,e),i=["children",W]):typeof W=="number"&&r.textContent!==""+W&&(u.suppressHydrationWarning!==!0&&Ll(r.textContent,W,e),i=["children",""+W]):v.hasOwnProperty(x)&&W!=null&&x==="onScroll"&&yt("scroll",r)}switch(t){case"input":Ue(r),Ie(r,u,!0);break;case"textarea":Ue(r),Nn(r);break;case"select":case"option":break;default:typeof u.onClick=="function"&&(r.onclick=bl)}r=i,n.updateQueue=r,r!==null&&(n.flags|=4)}else{x=i.nodeType===9?i:i.ownerDocument,e==="http://www.w3.org/1999/xhtml"&&(e=In(t)),e==="http://www.w3.org/1999/xhtml"?t==="script"?(e=x.createElement("div"),e.innerHTML="<script><\/script>",e=e.removeChild(e.firstChild)):typeof r.is=="string"?e=x.createElement(t,{is:r.is}):(e=x.createElement(t),t==="select"&&(x=e,r.multiple?x.multiple=!0:r.size&&(x.size=r.size))):e=x.createElementNS(e,t),e[Ar]=n,e[Za]=r,Du(e,n,!1,!1),n.stateNode=e;e:{switch(x=M(t,r),t){case"dialog":yt("cancel",e),yt("close",e),i=r;break;case"iframe":case"object":case"embed":yt("load",e),i=r;break;case"video":case"audio":for(i=0;i<qa.length;i++)yt(qa[i],e);i=r;break;case"source":yt("error",e),i=r;break;case"img":case"image":case"link":yt("error",e),yt("load",e),i=r;break;case"details":yt("toggle",e),i=r;break;case"input":An(e,r),i=On(e,r),yt("invalid",e);break;case"option":i=r;break;case"select":e._wrapperState={wasMultiple:!!r.multiple},i=E({},r,{value:void 0}),yt("invalid",e);break;case"textarea":we(e,r),i=G(e,r),yt("invalid",e);break;default:i=r}d(t,i),W=i;for(u in W)if(W.hasOwnProperty(u)){var ue=W[u];u==="style"?V(e,ue):u==="dangerouslySetInnerHTML"?(ue=ue?ue.__html:void 0,ue!=null&&ot(e,ue)):u==="children"?typeof ue=="string"?(t!=="textarea"||ue!=="")&&o(e,ue):typeof ue=="number"&&o(e,""+ue):u!=="suppressContentEditableWarning"&&u!=="suppressHydrationWarning"&&u!=="autoFocus"&&(v.hasOwnProperty(u)?ue!=null&&u==="onScroll"&&yt("scroll",e):ue!=null&&nn(e,u,ue,x))}switch(t){case"input":Ue(e),Ie(e,r,!1);break;case"textarea":Ue(e),Nn(e);break;case"option":r.value!=null&&e.setAttribute("value",""+mn(r.value));break;case"select":e.multiple=!!r.multiple,u=r.value,u!=null?Ke(e,!!r.multiple,u,!1):r.defaultValue!=null&&Ke(e,!!r.multiple,r.defaultValue,!0);break;default:typeof i.onClick=="function"&&(e.onclick=bl)}switch(t){case"button":case"input":case"select":case"textarea":r=!!r.autoFocus;break e;case"img":r=!0;break e;default:r=!1}}r&&(n.flags|=4)}n.ref!==null&&(n.flags|=512,n.flags|=2097152)}return Kt(n),null;case 6:if(e&&n.stateNode!=null)Bu(e,n,e.memoizedProps,r);else{if(typeof r!="string"&&n.stateNode===null)throw Error(f(166));if(t=sa(rl.current),sa(kr.current),Ul(n)){if(r=n.stateNode,t=n.memoizedProps,r[Ar]=n,(u=r.nodeValue!==t)&&(e=rr,e!==null))switch(e.tag){case 3:Ll(r.nodeValue,t,(e.mode&1)!==0);break;case 5:e.memoizedProps.suppressHydrationWarning!==!0&&Ll(r.nodeValue,t,(e.mode&1)!==0)}u&&(n.flags|=4)}else r=(t.nodeType===9?t:t.ownerDocument).createTextNode(r),r[Ar]=n,n.stateNode=r}return Kt(n),null;case 13:if(vt(kt),r=n.memoizedState,e===null||e.memoizedState!==null&&e.memoizedState.dehydrated!==null){if(At&&ar!==null&&(n.mode&1)!==0&&(n.flags&128)===0)js(),ba(),n.flags|=98560,u=!1;else if(u=Ul(n),r!==null&&r.dehydrated!==null){if(e===null){if(!u)throw Error(f(318));if(u=n.memoizedState,u=u!==null?u.dehydrated:null,!u)throw Error(f(317));u[Ar]=n}else ba(),(n.flags&128)===0&&(n.memoizedState=null),n.flags|=4;Kt(n),u=!1}else hr!==null&&(Ni(hr),hr=null),u=!0;if(!u)return n.flags&65536?n:null}return(n.flags&128)!==0?(n.lanes=t,n):(r=r!==null,r!==(e!==null&&e.memoizedState!==null)&&r&&(n.child.flags|=8192,(n.mode&1)!==0&&(e===null||(kt.current&1)!==0?Nt===0&&(Nt=3):Ui())),n.updateQueue!==null&&(n.flags|=4),Kt(n),null);case 4:return Na(),xi(e,n),e===null&&$a(n.stateNode.containerInfo),Kt(n),null;case 10:return Wo(n.type._context),Kt(n),null;case 17:return Qt(n.type)&&Ol(),Kt(n),null;case 19:if(vt(kt),u=n.memoizedState,u===null)return Kt(n),null;if(r=(n.flags&128)!==0,x=u.rendering,x===null)if(r)sl(u,!1);else{if(Nt!==0||e!==null&&(e.flags&128)!==0)for(e=n.child;e!==null;){if(x=Fl(e),x!==null){for(n.flags|=128,sl(u,!1),r=x.updateQueue,r!==null&&(n.updateQueue=r,n.flags|=4),n.subtreeFlags=0,r=t,t=n.child;t!==null;)u=t,e=r,u.flags&=14680066,x=u.alternate,x===null?(u.childLanes=0,u.lanes=e,u.child=null,u.subtreeFlags=0,u.memoizedProps=null,u.memoizedState=null,u.updateQueue=null,u.dependencies=null,u.stateNode=null):(u.childLanes=x.childLanes,u.lanes=x.lanes,u.child=x.child,u.subtreeFlags=0,u.deletions=null,u.memoizedProps=x.memoizedProps,u.memoizedState=x.memoizedState,u.updateQueue=x.updateQueue,u.type=x.type,e=x.dependencies,u.dependencies=e===null?null:{lanes:e.lanes,firstContext:e.firstContext}),t=t.sibling;return gt(kt,kt.current&1|2),n.child}e=e.sibling}u.tail!==null&&Vn()>Ia&&(n.flags|=128,r=!0,sl(u,!1),n.lanes=4194304)}else{if(!r)if(e=Fl(x),e!==null){if(n.flags|=128,r=!0,t=e.updateQueue,t!==null&&(n.updateQueue=t,n.flags|=4),sl(u,!0),u.tail===null&&u.tailMode==="hidden"&&!x.alternate&&!At)return Kt(n),null}else 2*Vn()-u.renderingStartTime>Ia&&t!==1073741824&&(n.flags|=128,r=!0,sl(u,!1),n.lanes=4194304);u.isBackwards?(x.sibling=n.child,n.child=x):(t=u.last,t!==null?t.sibling=x:n.child=x,u.last=x)}return u.tail!==null?(n=u.tail,u.rendering=n,u.tail=n.sibling,u.renderingStartTime=Vn(),n.sibling=null,t=kt.current,gt(kt,r?t&1|2:t&1),n):(Kt(n),null);case 22:case 23:return Mi(),r=n.memoizedState!==null,e!==null&&e.memoizedState!==null!==r&&(n.flags|=8192),r&&(n.mode&1)!==0?(lr&1073741824)!==0&&(Kt(n),n.subtreeFlags&6&&(n.flags|=8192)):Kt(n),null;case 24:return null;case 25:return null}throw Error(f(156,n.tag))}function ad(e,n){switch(jo(n),n.tag){case 1:return Qt(n.type)&&Ol(),e=n.flags,e&65536?(n.flags=e&-65537|128,n):null;case 3:return Na(),vt($t),vt(jt),ni(),e=n.flags,(e&65536)!==0&&(e&128)===0?(n.flags=e&-65537|128,n):null;case 5:return Jo(n),null;case 13:if(vt(kt),e=n.memoizedState,e!==null&&e.dehydrated!==null){if(n.alternate===null)throw Error(f(340));ba()}return e=n.flags,e&65536?(n.flags=e&-65537|128,n):null;case 19:return vt(kt),null;case 4:return Na(),null;case 10:return Wo(n.type._context),null;case 22:case 23:return Mi(),null;case 24:return null;default:return null}}var ql=!1,Ht=!1,ld=typeof WeakSet=="function"?WeakSet:Set,Xn=null;function Ma(e,n){var t=e.ref;if(t!==null)if(typeof t=="function")try{t(null)}catch(r){Et(e,n,r)}else t.current=null}function Ai(e,n,t){try{t()}catch(r){Et(e,n,r)}}var Fu=!1;function od(e,n){if(Mo=ta,e=ys(),Eo(e)){if("selectionStart"in e)var t={start:e.selectionStart,end:e.selectionEnd};else e:{t=(t=e.ownerDocument)&&t.defaultView||window;var r=t.getSelection&&t.getSelection();if(r&&r.rangeCount!==0){t=r.anchorNode;var i=r.anchorOffset,u=r.focusNode;r=r.focusOffset;try{t.nodeType,u.nodeType}catch{t=null;break e}var x=0,W=-1,ue=-1,qe=0,Ln=0,Rn=e,wn=null;n:for(;;){for(var Kn;Rn!==t||i!==0&&Rn.nodeType!==3||(W=x+i),Rn!==u||r!==0&&Rn.nodeType!==3||(ue=x+r),Rn.nodeType===3&&(x+=Rn.nodeValue.length),(Kn=Rn.firstChild)!==null;)wn=Rn,Rn=Kn;for(;;){if(Rn===e)break n;if(wn===t&&++qe===i&&(W=x),wn===u&&++Ln===r&&(ue=x),(Kn=Rn.nextSibling)!==null)break;Rn=wn,wn=Rn.parentNode}Rn=Kn}t=W===-1||ue===-1?null:{start:W,end:ue}}else t=null}t=t||{start:0,end:0}}else t=null;for(Uo={focusedElem:e,selectionRange:t},ta=!1,Xn=n;Xn!==null;)if(n=Xn,e=n.child,(n.subtreeFlags&1028)!==0&&e!==null)e.return=n,Xn=e;else for(;Xn!==null;){n=Xn;try{var Yn=n.alternate;if((n.flags&1024)!==0)switch(n.tag){case 0:case 11:case 15:break;case 1:if(Yn!==null){var qn=Yn.memoizedProps,bt=Yn.memoizedState,Be=n.stateNode,ke=Be.getSnapshotBeforeUpdate(n.elementType===n.type?qn:mr(n.type,qn),bt);Be.__reactInternalSnapshotBeforeUpdate=ke}break;case 3:var je=n.stateNode.containerInfo;je.nodeType===1?je.textContent="":je.nodeType===9&&je.documentElement&&je.removeChild(je.documentElement);break;case 5:case 6:case 4:case 17:break;default:throw Error(f(163))}}catch(Cn){Et(n,n.return,Cn)}if(e=n.sibling,e!==null){e.return=n.return,Xn=e;break}Xn=n.return}return Yn=Fu,Fu=!1,Yn}function ul(e,n,t){var r=n.updateQueue;if(r=r!==null?r.lastEffect:null,r!==null){var i=r=r.next;do{if((i.tag&e)===e){var u=i.destroy;i.destroy=void 0,u!==void 0&&Ai(n,t,u)}i=i.next}while(i!==r)}}function $l(e,n){if(n=n.updateQueue,n=n!==null?n.lastEffect:null,n!==null){var t=n=n.next;do{if((t.tag&e)===e){var r=t.create;t.destroy=r()}t=t.next}while(t!==n)}}function ki(e){var n=e.ref;if(n!==null){var t=e.stateNode;switch(e.tag){case 5:e=t;break;default:e=t}typeof n=="function"?n(e):n.current=e}}function Vu(e){var n=e.alternate;n!==null&&(e.alternate=null,Vu(n)),e.child=null,e.deletions=null,e.sibling=null,e.tag===5&&(n=e.stateNode,n!==null&&(delete n[Ar],delete n[Za],delete n[Go],delete n[jf],delete n[zf])),e.stateNode=null,e.return=null,e.dependencies=null,e.memoizedProps=null,e.memoizedState=null,e.pendingProps=null,e.stateNode=null,e.updateQueue=null}function ju(e){return e.tag===5||e.tag===3||e.tag===4}function zu(e){e:for(;;){for(;e.sibling===null;){if(e.return===null||ju(e.return))return null;e=e.return}for(e.sibling.return=e.return,e=e.sibling;e.tag!==5&&e.tag!==6&&e.tag!==18;){if(e.flags&2||e.child===null||e.tag===4)continue e;e.child.return=e,e=e.child}if(!(e.flags&2))return e.stateNode}}function Ti(e,n,t){var r=e.tag;if(r===5||r===6)e=e.stateNode,n?t.nodeType===8?t.parentNode.insertBefore(e,n):t.insertBefore(e,n):(t.nodeType===8?(n=t.parentNode,n.insertBefore(e,t)):(n=t,n.appendChild(e)),t=t._reactRootContainer,t!=null||n.onclick!==null||(n.onclick=bl));else if(r!==4&&(e=e.child,e!==null))for(Ti(e,n,t),e=e.sibling;e!==null;)Ti(e,n,t),e=e.sibling}function wi(e,n,t){var r=e.tag;if(r===5||r===6)e=e.stateNode,n?t.insertBefore(e,n):t.appendChild(e);else if(r!==4&&(e=e.child,e!==null))for(wi(e,n,t),e=e.sibling;e!==null;)wi(e,n,t),e=e.sibling}var Gt=null,gr=!1;function Hr(e,n,t){for(t=t.child;t!==null;)Ku(e,n,t),t=t.sibling}function Ku(e,n,t){if(ie&&typeof ie.onCommitFiberUnmount=="function")try{ie.onCommitFiberUnmount(L,t)}catch{}switch(t.tag){case 5:Ht||Ma(t,n);case 6:var r=Gt,i=gr;Gt=null,Hr(e,n,t),Gt=r,gr=i,Gt!==null&&(gr?(e=Gt,t=t.stateNode,e.nodeType===8?e.parentNode.removeChild(t):e.removeChild(t)):Gt.removeChild(t.stateNode));break;case 18:Gt!==null&&(gr?(e=Gt,t=t.stateNode,e.nodeType===8?Do(e.parentNode,t):e.nodeType===1&&Do(e,t),na(e)):Do(Gt,t.stateNode));break;case 4:r=Gt,i=gr,Gt=t.stateNode.containerInfo,gr=!0,Hr(e,n,t),Gt=r,gr=i;break;case 0:case 11:case 14:case 15:if(!Ht&&(r=t.updateQueue,r!==null&&(r=r.lastEffect,r!==null))){i=r=r.next;do{var u=i,x=u.destroy;u=u.tag,x!==void 0&&((u&2)!==0||(u&4)!==0)&&Ai(t,n,x),i=i.next}while(i!==r)}Hr(e,n,t);break;case 1:if(!Ht&&(Ma(t,n),r=t.stateNode,typeof r.componentWillUnmount=="function"))try{r.props=t.memoizedProps,r.state=t.memoizedState,r.componentWillUnmount()}catch(W){Et(t,n,W)}Hr(e,n,t);break;case 21:Hr(e,n,t);break;case 22:t.mode&1?(Ht=(r=Ht)||t.memoizedState!==null,Hr(e,n,t),Ht=r):Hr(e,n,t);break;default:Hr(e,n,t)}}function Hu(e){var n=e.updateQueue;if(n!==null){e.updateQueue=null;var t=e.stateNode;t===null&&(t=e.stateNode=new ld),n.forEach(function(r){var i=hd.bind(null,e,r);t.has(r)||(t.add(r),r.then(i,i))})}}function yr(e,n){var t=n.deletions;if(t!==null)for(var r=0;r<t.length;r++){var i=t[r];try{var u=e,x=n,W=x;e:for(;W!==null;){switch(W.tag){case 5:Gt=W.stateNode,gr=!1;break e;case 3:Gt=W.stateNode.containerInfo,gr=!0;break e;case 4:Gt=W.stateNode.containerInfo,gr=!0;break e}W=W.return}if(Gt===null)throw Error(f(160));Ku(u,x,i),Gt=null,gr=!1;var ue=i.alternate;ue!==null&&(ue.return=null),i.return=null}catch(qe){Et(i,n,qe)}}if(n.subtreeFlags&12854)for(n=n.child;n!==null;)Xu(n,e),n=n.sibling}function Xu(e,n){var t=e.alternate,r=e.flags;switch(e.tag){case 0:case 11:case 14:case 15:if(yr(n,e),wr(e),r&4){try{ul(3,e,e.return),$l(3,e)}catch(qn){Et(e,e.return,qn)}try{ul(5,e,e.return)}catch(qn){Et(e,e.return,qn)}}break;case 1:yr(n,e),wr(e),r&512&&t!==null&&Ma(t,t.return);break;case 5:if(yr(n,e),wr(e),r&512&&t!==null&&Ma(t,t.return),e.flags&32){var i=e.stateNode;try{o(i,"")}catch(qn){Et(e,e.return,qn)}}if(r&4&&(i=e.stateNode,i!=null)){var u=e.memoizedProps,x=t!==null?t.memoizedProps:u,W=e.type,ue=e.updateQueue;if(e.updateQueue=null,ue!==null)try{W==="input"&&u.type==="radio"&&u.name!=null&&Je(i,u),M(W,x);var qe=M(W,u);for(x=0;x<ue.length;x+=2){var Ln=ue[x],Rn=ue[x+1];Ln==="style"?V(i,Rn):Ln==="dangerouslySetInnerHTML"?ot(i,Rn):Ln==="children"?o(i,Rn):nn(i,Ln,Rn,qe)}switch(W){case"input":le(i,u);break;case"textarea":Pe(i,u);break;case"select":var wn=i._wrapperState.wasMultiple;i._wrapperState.wasMultiple=!!u.multiple;var Kn=u.value;Kn!=null?Ke(i,!!u.multiple,Kn,!1):wn!==!!u.multiple&&(u.defaultValue!=null?Ke(i,!!u.multiple,u.defaultValue,!0):Ke(i,!!u.multiple,u.multiple?[]:"",!1))}i[Za]=u}catch(qn){Et(e,e.return,qn)}}break;case 6:if(yr(n,e),wr(e),r&4){if(e.stateNode===null)throw Error(f(162));i=e.stateNode,u=e.memoizedProps;try{i.nodeValue=u}catch(qn){Et(e,e.return,qn)}}break;case 3:if(yr(n,e),wr(e),r&4&&t!==null&&t.memoizedState.isDehydrated)try{na(n.containerInfo)}catch(qn){Et(e,e.return,qn)}break;case 4:yr(n,e),wr(e);break;case 13:yr(n,e),wr(e),i=e.child,i.flags&8192&&(u=i.memoizedState!==null,i.stateNode.isHidden=u,!u||i.alternate!==null&&i.alternate.memoizedState!==null||(bi=Vn())),r&4&&Hu(e);break;case 22:if(Ln=t!==null&&t.memoizedState!==null,e.mode&1?(Ht=(qe=Ht)||Ln,yr(n,e),Ht=qe):yr(n,e),wr(e),r&8192){if(qe=e.memoizedState!==null,(e.stateNode.isHidden=qe)&&!Ln&&(e.mode&1)!==0)for(Xn=e,Ln=e.child;Ln!==null;){for(Rn=Xn=Ln;Xn!==null;){switch(wn=Xn,Kn=wn.child,wn.tag){case 0:case 11:case 14:case 15:ul(4,wn,wn.return);break;case 1:Ma(wn,wn.return);var Yn=wn.stateNode;if(typeof Yn.componentWillUnmount=="function"){r=wn,t=wn.return;try{n=r,Yn.props=n.memoizedProps,Yn.state=n.memoizedState,Yn.componentWillUnmount()}catch(qn){Et(r,t,qn)}}break;case 5:Ma(wn,wn.return);break;case 22:if(wn.memoizedState!==null){qu(Rn);continue}}Kn!==null?(Kn.return=wn,Xn=Kn):qu(Rn)}Ln=Ln.sibling}e:for(Ln=null,Rn=e;;){if(Rn.tag===5){if(Ln===null){Ln=Rn;try{i=Rn.stateNode,qe?(u=i.style,typeof u.setProperty=="function"?u.setProperty("display","none","important"):u.display="none"):(W=Rn.stateNode,ue=Rn.memoizedProps.style,x=ue!=null&&ue.hasOwnProperty("display")?ue.display:null,W.style.display=Y("display",x))}catch(qn){Et(e,e.return,qn)}}}else if(Rn.tag===6){if(Ln===null)try{Rn.stateNode.nodeValue=qe?"":Rn.memoizedProps}catch(qn){Et(e,e.return,qn)}}else if((Rn.tag!==22&&Rn.tag!==23||Rn.memoizedState===null||Rn===e)&&Rn.child!==null){Rn.child.return=Rn,Rn=Rn.child;continue}if(Rn===e)break e;for(;Rn.sibling===null;){if(Rn.return===null||Rn.return===e)break e;Ln===Rn&&(Ln=null),Rn=Rn.return}Ln===Rn&&(Ln=null),Rn.sibling.return=Rn.return,Rn=Rn.sibling}}break;case 19:yr(n,e),wr(e),r&4&&Hu(e);break;case 21:break;default:yr(n,e),wr(e)}}function wr(e){var n=e.flags;if(n&2){try{e:{for(var t=e.return;t!==null;){if(ju(t)){var r=t;break e}t=t.return}throw Error(f(160))}switch(r.tag){case 5:var i=r.stateNode;r.flags&32&&(o(i,""),r.flags&=-33);var u=zu(e);wi(e,u,i);break;case 3:case 4:var x=r.stateNode.containerInfo,W=zu(e);Ti(e,W,x);break;default:throw Error(f(161))}}catch(ue){Et(e,e.return,ue)}e.flags&=-3}n&4096&&(e.flags&=-4097)}function id(e,n,t){Xn=e,Yu(e)}function Yu(e,n,t){for(var r=(e.mode&1)!==0;Xn!==null;){var i=Xn,u=i.child;if(i.tag===22&&r){var x=i.memoizedState!==null||ql;if(!x){var W=i.alternate,ue=W!==null&&W.memoizedState!==null||Ht;W=ql;var qe=Ht;if(ql=x,(Ht=ue)&&!qe)for(Xn=i;Xn!==null;)x=Xn,ue=x.child,x.tag===22&&x.memoizedState!==null?$u(i):ue!==null?(ue.return=x,Xn=ue):$u(i);for(;u!==null;)Xn=u,Yu(u),u=u.sibling;Xn=i,ql=W,Ht=qe}Wu(e)}else(i.subtreeFlags&8772)!==0&&u!==null?(u.return=i,Xn=u):Wu(e)}}function Wu(e){for(;Xn!==null;){var n=Xn;if((n.flags&8772)!==0){var t=n.alternate;try{if((n.flags&8772)!==0)switch(n.tag){case 0:case 11:case 15:Ht||$l(5,n);break;case 1:var r=n.stateNode;if(n.flags&4&&!Ht)if(t===null)r.componentDidMount();else{var i=n.elementType===n.type?t.memoizedProps:mr(n.type,t.memoizedProps);r.componentDidUpdate(i,t.memoizedState,r.__reactInternalSnapshotBeforeUpdate)}var u=n.updateQueue;u!==null&&qs(n,u,r);break;case 3:var x=n.updateQueue;if(x!==null){if(t=null,n.child!==null)switch(n.child.tag){case 5:t=n.child.stateNode;break;case 1:t=n.child.stateNode}qs(n,x,t)}break;case 5:var W=n.stateNode;if(t===null&&n.flags&4){t=W;var ue=n.memoizedProps;switch(n.type){case"button":case"input":case"select":case"textarea":ue.autoFocus&&t.focus();break;case"img":ue.src&&(t.src=ue.src)}}break;case 6:break;case 4:break;case 12:break;case 13:if(n.memoizedState===null){var qe=n.alternate;if(qe!==null){var Ln=qe.memoizedState;if(Ln!==null){var Rn=Ln.dehydrated;Rn!==null&&na(Rn)}}}break;case 19:case 17:case 21:case 22:case 23:case 25:break;default:throw Error(f(163))}Ht||n.flags&512&&ki(n)}catch(wn){Et(n,n.return,wn)}}if(n===e){Xn=null;break}if(t=n.sibling,t!==null){t.return=n.return,Xn=t;break}Xn=n.return}}function qu(e){for(;Xn!==null;){var n=Xn;if(n===e){Xn=null;break}var t=n.sibling;if(t!==null){t.return=n.return,Xn=t;break}Xn=n.return}}function $u(e){for(;Xn!==null;){var n=Xn;try{switch(n.tag){case 0:case 11:case 15:var t=n.return;try{$l(4,n)}catch(ue){Et(n,t,ue)}break;case 1:var r=n.stateNode;if(typeof r.componentDidMount=="function"){var i=n.return;try{r.componentDidMount()}catch(ue){Et(n,i,ue)}}var u=n.return;try{ki(n)}catch(ue){Et(n,u,ue)}break;case 5:var x=n.return;try{ki(n)}catch(ue){Et(n,x,ue)}}}catch(ue){Et(n,n.return,ue)}if(n===e){Xn=null;break}var W=n.sibling;if(W!==null){W.return=n.return,Xn=W;break}Xn=n.return}}var sd=Math.ceil,Ql=He.ReactCurrentDispatcher,Ei=He.ReactCurrentOwner,cr=He.ReactCurrentBatchConfig,dt=0,It=null,Ot=null,Bt=0,lr=0,Ua=Fr(0),Nt=0,cl=null,ca=0,Zl=0,Li=0,fl=null,Jt=null,bi=0,Ia=1/0,Ur=null,Jl=!1,Si=null,Xr=null,eo=!1,Yr=null,no=0,dl=0,Oi=null,to=-1,ro=0;function Wt(){return(dt&6)!==0?Vn():to!==-1?to:to=Vn()}function Wr(e){return(e.mode&1)===0?1:(dt&2)!==0&&Bt!==0?Bt&-Bt:Hf.transition!==null?(ro===0&&(ro=he()),ro):(e=jn,e!==0||(e=window.event,e=e===void 0?16:Z(e.type)),e)}function vr(e,n,t,r){if(50<dl)throw dl=0,Oi=null,Error(f(185));bn(e,t,r),((dt&2)===0||e!==It)&&(e===It&&((dt&2)===0&&(Zl|=t),Nt===4&&qr(e,Bt)),er(e,r),t===1&&dt===0&&(n.mode&1)===0&&(Ia=Vn()+500,Nl&&jr()))}function er(e,n){var t=e.callbackNode;H(e,n);var r=p(e,e===It?Bt:0);if(r===0)t!==null&&ht(t),e.callbackNode=null,e.callbackPriority=0;else if(n=r&-r,e.callbackPriority!==n){if(t!=null&&ht(t),n===1)e.tag===0?Kf(Zu.bind(null,e)):Ds(Zu.bind(null,e)),Ff(function(){(dt&6)===0&&jr()}),t=null;else{switch(k(r)){case 1:t=it;break;case 4:t=Ct;break;case 16:t=pt;break;case 536870912:t=wt;break;default:t=pt}t=oc(t,Qu.bind(null,e))}e.callbackPriority=n,e.callbackNode=t}}function Qu(e,n){if(to=-1,ro=0,(dt&6)!==0)throw Error(f(327));var t=e.callbackNode;if(Pa()&&e.callbackNode!==t)return null;var r=p(e,e===It?Bt:0);if(r===0)return null;if((r&30)!==0||(r&e.expiredLanes)!==0||n)n=ao(e,r);else{n=r;var i=dt;dt|=2;var u=ec();(It!==e||Bt!==n)&&(Ur=null,Ia=Vn()+500,da(e,n));do try{fd();break}catch(W){Ju(e,W)}while(!0);Yo(),Ql.current=u,dt=i,Ot!==null?n=0:(It=null,Bt=0,n=Nt)}if(n!==0){if(n===2&&(i=ye(e),i!==0&&(r=i,n=Ri(e,i))),n===1)throw t=cl,da(e,0),qr(e,r),er(e,Vn()),t;if(n===6)qr(e,r);else{if(i=e.current.alternate,(r&30)===0&&!ud(i)&&(n=ao(e,r),n===2&&(u=ye(e),u!==0&&(r=u,n=Ri(e,u))),n===1))throw t=cl,da(e,0),qr(e,r),er(e,Vn()),t;switch(e.finishedWork=i,e.finishedLanes=r,n){case 0:case 1:throw Error(f(345));case 2:pa(e,Jt,Ur);break;case 3:if(qr(e,r),(r&130023424)===r&&(n=bi+500-Vn(),10<n)){if(p(e,0)!==0)break;if(i=e.suspendedLanes,(i&r)!==r){Wt(),e.pingedLanes|=e.suspendedLanes&i;break}e.timeoutHandle=Po(pa.bind(null,e,Jt,Ur),n);break}pa(e,Jt,Ur);break;case 4:if(qr(e,r),(r&4194240)===r)break;for(n=e.eventTimes,i=-1;0<r;){var x=31-on(r);u=1<<x,x=n[x],x>i&&(i=x),r&=~u}if(r=i,r=Vn()-r,r=(120>r?120:480>r?480:1080>r?1080:1920>r?1920:3e3>r?3e3:4320>r?4320:1960*sd(r/1960))-r,10<r){e.timeoutHandle=Po(pa.bind(null,e,Jt,Ur),r);break}pa(e,Jt,Ur);break;case 5:pa(e,Jt,Ur);break;default:throw Error(f(329))}}}return er(e,Vn()),e.callbackNode===t?Qu.bind(null,e):null}function Ri(e,n){var t=fl;return e.current.memoizedState.isDehydrated&&(da(e,n).flags|=256),e=ao(e,n),e!==2&&(n=Jt,Jt=t,n!==null&&Ni(n)),e}function Ni(e){Jt===null?Jt=e:Jt.push.apply(Jt,e)}function ud(e){for(var n=e;;){if(n.flags&16384){var t=n.updateQueue;if(t!==null&&(t=t.stores,t!==null))for(var r=0;r<t.length;r++){var i=t[r],u=i.getSnapshot;i=i.value;try{if(!_r(u(),i))return!1}catch{return!1}}}if(t=n.child,n.subtreeFlags&16384&&t!==null)t.return=n,n=t;else{if(n===e)break;for(;n.sibling===null;){if(n.return===null||n.return===e)return!0;n=n.return}n.sibling.return=n.return,n=n.sibling}}return!0}function qr(e,n){for(n&=~Li,n&=~Zl,e.suspendedLanes|=n,e.pingedLanes&=~n,e=e.expirationTimes;0<n;){var t=31-on(n),r=1<<t;e[t]=-1,n&=~r}}function Zu(e){if((dt&6)!==0)throw Error(f(327));Pa();var n=p(e,0);if((n&1)===0)return er(e,Vn()),null;var t=ao(e,n);if(e.tag!==0&&t===2){var r=ye(e);r!==0&&(n=r,t=Ri(e,r))}if(t===1)throw t=cl,da(e,0),qr(e,n),er(e,Vn()),t;if(t===6)throw Error(f(345));return e.finishedWork=e.current.alternate,e.finishedLanes=n,pa(e,Jt,Ur),er(e,Vn()),null}function Ci(e,n){var t=dt;dt|=1;try{return e(n)}finally{dt=t,dt===0&&(Ia=Vn()+500,Nl&&jr())}}function fa(e){Yr!==null&&Yr.tag===0&&(dt&6)===0&&Pa();var n=dt;dt|=1;var t=cr.transition,r=jn;try{if(cr.transition=null,jn=1,e)return e()}finally{jn=r,cr.transition=t,dt=n,(dt&6)===0&&jr()}}function Mi(){lr=Ua.current,vt(Ua)}function da(e,n){e.finishedWork=null,e.finishedLanes=0;var t=e.timeoutHandle;if(t!==-1&&(e.timeoutHandle=-1,Bf(t)),Ot!==null)for(t=Ot.return;t!==null;){var r=t;switch(jo(r),r.tag){case 1:r=r.type.childContextTypes,r!=null&&Ol();break;case 3:Na(),vt($t),vt(jt),ni();break;case 5:Jo(r);break;case 4:Na();break;case 13:vt(kt);break;case 19:vt(kt);break;case 10:Wo(r.type._context);break;case 22:case 23:Mi()}t=t.return}if(It=e,Ot=e=$r(e.current,null),Bt=lr=n,Nt=0,cl=null,Li=Zl=ca=0,Jt=fl=null,ia!==null){for(n=0;n<ia.length;n++)if(t=ia[n],r=t.interleaved,r!==null){t.interleaved=null;var i=r.next,u=t.pending;if(u!==null){var x=u.next;u.next=i,r.next=x}t.pending=r}ia=null}return e}function Ju(e,n){do{var t=Ot;try{if(Yo(),Vl.current=Hl,jl){for(var r=Tt.memoizedState;r!==null;){var i=r.queue;i!==null&&(i.pending=null),r=r.next}jl=!1}if(ua=0,Ut=Rt=Tt=null,al=!1,ll=0,Ei.current=null,t===null||t.return===null){Nt=1,cl=n,Ot=null;break}e:{var u=e,x=t.return,W=t,ue=n;if(n=Bt,W.flags|=32768,ue!==null&&typeof ue=="object"&&typeof ue.then=="function"){var qe=ue,Ln=W,Rn=Ln.tag;if((Ln.mode&1)===0&&(Rn===0||Rn===11||Rn===15)){var wn=Ln.alternate;wn?(Ln.updateQueue=wn.updateQueue,Ln.memoizedState=wn.memoizedState,Ln.lanes=wn.lanes):(Ln.updateQueue=null,Ln.memoizedState=null)}var Kn=wu(x);if(Kn!==null){Kn.flags&=-257,Eu(Kn,x,W,u,n),Kn.mode&1&&Tu(u,qe,n),n=Kn,ue=qe;var Yn=n.updateQueue;if(Yn===null){var qn=new Set;qn.add(ue),n.updateQueue=qn}else Yn.add(ue);break e}else{if((n&1)===0){Tu(u,qe,n),Ui();break e}ue=Error(f(426))}}else if(At&&W.mode&1){var bt=wu(x);if(bt!==null){(bt.flags&65536)===0&&(bt.flags|=256),Eu(bt,x,W,u,n),Ho(Ca(ue,W));break e}}u=ue=Ca(ue,W),Nt!==4&&(Nt=2),fl===null?fl=[u]:fl.push(u),u=x;do{switch(u.tag){case 3:u.flags|=65536,n&=-n,u.lanes|=n;var Be=Au(u,ue,n);Ws(u,Be);break e;case 1:W=ue;var ke=u.type,je=u.stateNode;if((u.flags&128)===0&&(typeof ke.getDerivedStateFromError=="function"||je!==null&&typeof je.componentDidCatch=="function"&&(Xr===null||!Xr.has(je)))){u.flags|=65536,n&=-n,u.lanes|=n;var Cn=ku(u,W,n);Ws(u,Cn);break e}}u=u.return}while(u!==null)}tc(t)}catch(Qn){n=Qn,Ot===t&&t!==null&&(Ot=t=t.return);continue}break}while(!0)}function ec(){var e=Ql.current;return Ql.current=Hl,e===null?Hl:e}function Ui(){(Nt===0||Nt===3||Nt===2)&&(Nt=4),It===null||(ca&268435455)===0&&(Zl&268435455)===0||qr(It,Bt)}function ao(e,n){var t=dt;dt|=2;var r=ec();(It!==e||Bt!==n)&&(Ur=null,da(e,n));do try{cd();break}catch(i){Ju(e,i)}while(!0);if(Yo(),dt=t,Ql.current=r,Ot!==null)throw Error(f(261));return It=null,Bt=0,Nt}function cd(){for(;Ot!==null;)nc(Ot)}function fd(){for(;Ot!==null&&!Fn();)nc(Ot)}function nc(e){var n=lc(e.alternate,e,lr);e.memoizedProps=e.pendingProps,n===null?tc(e):Ot=n,Ei.current=null}function tc(e){var n=e;do{var t=n.alternate;if(e=n.return,(n.flags&32768)===0){if(t=rd(t,n,lr),t!==null){Ot=t;return}}else{if(t=ad(t,n),t!==null){t.flags&=32767,Ot=t;return}if(e!==null)e.flags|=32768,e.subtreeFlags=0,e.deletions=null;else{Nt=6,Ot=null;return}}if(n=n.sibling,n!==null){Ot=n;return}Ot=n=e}while(n!==null);Nt===0&&(Nt=5)}function pa(e,n,t){var r=jn,i=cr.transition;try{cr.transition=null,jn=1,dd(e,n,t,r)}finally{cr.transition=i,jn=r}return null}function dd(e,n,t,r){do Pa();while(Yr!==null);if((dt&6)!==0)throw Error(f(327));t=e.finishedWork;var i=e.finishedLanes;if(t===null)return null;if(e.finishedWork=null,e.finishedLanes=0,t===e.current)throw Error(f(177));e.callbackNode=null,e.callbackPriority=0;var u=t.lanes|t.childLanes;if(Gn(e,u),e===It&&(Ot=It=null,Bt=0),(t.subtreeFlags&2064)===0&&(t.flags&2064)===0||eo||(eo=!0,oc(pt,function(){return Pa(),null})),u=(t.flags&15990)!==0,(t.subtreeFlags&15990)!==0||u){u=cr.transition,cr.transition=null;var x=jn;jn=1;var W=dt;dt|=4,Ei.current=null,od(e,t),Xu(t,e),Cf(Uo),ta=!!Mo,Uo=Mo=null,e.current=t,id(t),Jn(),dt=W,jn=x,cr.transition=u}else e.current=t;if(eo&&(eo=!1,Yr=e,no=i),u=e.pendingLanes,u===0&&(Xr=null),cn(t.stateNode),er(e,Vn()),n!==null)for(r=e.onRecoverableError,t=0;t<n.length;t++)i=n[t],r(i.value,{componentStack:i.stack,digest:i.digest});if(Jl)throw Jl=!1,e=Si,Si=null,e;return(no&1)!==0&&e.tag!==0&&Pa(),u=e.pendingLanes,(u&1)!==0?e===Oi?dl++:(dl=0,Oi=e):dl=0,jr(),null}function Pa(){if(Yr!==null){var e=k(no),n=cr.transition,t=jn;try{if(cr.transition=null,jn=16>e?16:e,Yr===null)var r=!1;else{if(e=Yr,Yr=null,no=0,(dt&6)!==0)throw Error(f(331));var i=dt;for(dt|=4,Xn=e.current;Xn!==null;){var u=Xn,x=u.child;if((Xn.flags&16)!==0){var W=u.deletions;if(W!==null){for(var ue=0;ue<W.length;ue++){var qe=W[ue];for(Xn=qe;Xn!==null;){var Ln=Xn;switch(Ln.tag){case 0:case 11:case 15:ul(8,Ln,u)}var Rn=Ln.child;if(Rn!==null)Rn.return=Ln,Xn=Rn;else for(;Xn!==null;){Ln=Xn;var wn=Ln.sibling,Kn=Ln.return;if(Vu(Ln),Ln===qe){Xn=null;break}if(wn!==null){wn.return=Kn,Xn=wn;break}Xn=Kn}}}var Yn=u.alternate;if(Yn!==null){var qn=Yn.child;if(qn!==null){Yn.child=null;do{var bt=qn.sibling;qn.sibling=null,qn=bt}while(qn!==null)}}Xn=u}}if((u.subtreeFlags&2064)!==0&&x!==null)x.return=u,Xn=x;else e:for(;Xn!==null;){if(u=Xn,(u.flags&2048)!==0)switch(u.tag){case 0:case 11:case 15:ul(9,u,u.return)}var Be=u.sibling;if(Be!==null){Be.return=u.return,Xn=Be;break e}Xn=u.return}}var ke=e.current;for(Xn=ke;Xn!==null;){x=Xn;var je=x.child;if((x.subtreeFlags&2064)!==0&&je!==null)je.return=x,Xn=je;else e:for(x=ke;Xn!==null;){if(W=Xn,(W.flags&2048)!==0)try{switch(W.tag){case 0:case 11:case 15:$l(9,W)}}catch(Qn){Et(W,W.return,Qn)}if(W===x){Xn=null;break e}var Cn=W.sibling;if(Cn!==null){Cn.return=W.return,Xn=Cn;break e}Xn=W.return}}if(dt=i,jr(),ie&&typeof ie.onPostCommitFiberRoot=="function")try{ie.onPostCommitFiberRoot(L,e)}catch{}r=!0}return r}finally{jn=t,cr.transition=n}}return!1}function rc(e,n,t){n=Ca(t,n),n=Au(e,n,1),e=Kr(e,n,1),n=Wt(),e!==null&&(bn(e,1,n),er(e,n))}function Et(e,n,t){if(e.tag===3)rc(e,e,t);else for(;n!==null;){if(n.tag===3){rc(n,e,t);break}else if(n.tag===1){var r=n.stateNode;if(typeof n.type.getDerivedStateFromError=="function"||typeof r.componentDidCatch=="function"&&(Xr===null||!Xr.has(r))){e=Ca(t,e),e=ku(n,e,1),n=Kr(n,e,1),e=Wt(),n!==null&&(bn(n,1,e),er(n,e));break}}n=n.return}}function pd(e,n,t){var r=e.pingCache;r!==null&&r.delete(n),n=Wt(),e.pingedLanes|=e.suspendedLanes&t,It===e&&(Bt&t)===t&&(Nt===4||Nt===3&&(Bt&130023424)===Bt&&500>Vn()-bi?da(e,0):Li|=t),er(e,n)}function ac(e,n){n===0&&((e.mode&1)===0?n=1:(n=xn,xn<<=1,(xn&130023424)===0&&(xn=4194304)));var t=Wt();e=Nr(e,n),e!==null&&(bn(e,n,t),er(e,t))}function _d(e){var n=e.memoizedState,t=0;n!==null&&(t=n.retryLane),ac(e,t)}function hd(e,n){var t=0;switch(e.tag){case 13:var r=e.stateNode,i=e.memoizedState;i!==null&&(t=i.retryLane);break;case 19:r=e.stateNode;break;default:throw Error(f(314))}r!==null&&r.delete(n),ac(e,t)}var lc;lc=function(e,n,t){if(e!==null)if(e.memoizedProps!==n.pendingProps||$t.current)Zt=!0;else{if((e.lanes&t)===0&&(n.flags&128)===0)return Zt=!1,td(e,n,t);Zt=(e.flags&131072)!==0}else Zt=!1,At&&(n.flags&1048576)!==0&&Gs(n,Ml,n.index);switch(n.lanes=0,n.tag){case 2:var r=n.type;Wl(e,n),e=n.pendingProps;var i=wa(n,jt.current);Ra(n,t),i=ai(null,n,r,e,i,t);var u=li();return n.flags|=1,typeof i=="object"&&i!==null&&typeof i.render=="function"&&i.$$typeof===void 0?(n.tag=1,n.memoizedState=null,n.updateQueue=null,Qt(r)?(u=!0,Rl(n)):u=!1,n.memoizedState=i.state!==null&&i.state!==void 0?i.state:null,Qo(n),i.updater=Xl,n.stateNode=i,i._reactInternals=n,fi(n,r,e,t),n=hi(null,n,r,!0,u,t)):(n.tag=0,At&&u&&Vo(n),Yt(null,n,i,t),n=n.child),n;case 16:r=n.elementType;e:{switch(Wl(e,n),e=n.pendingProps,i=r._init,r=i(r._payload),n.type=r,i=n.tag=gd(r),e=mr(r,e),i){case 0:n=_i(null,n,r,e,t);break e;case 1:n=Nu(null,n,r,e,t);break e;case 11:n=Lu(null,n,r,e,t);break e;case 14:n=bu(null,n,r,mr(r.type,e),t);break e}throw Error(f(306,r,""))}return n;case 0:return r=n.type,i=n.pendingProps,i=n.elementType===r?i:mr(r,i),_i(e,n,r,i,t);case 1:return r=n.type,i=n.pendingProps,i=n.elementType===r?i:mr(r,i),Nu(e,n,r,i,t);case 3:e:{if(Cu(n),e===null)throw Error(f(387));r=n.pendingProps,u=n.memoizedState,i=u.element,Ys(e,n),Bl(n,r,null,t);var x=n.memoizedState;if(r=x.element,u.isDehydrated)if(u={element:r,isDehydrated:!1,cache:x.cache,pendingSuspenseBoundaries:x.pendingSuspenseBoundaries,transitions:x.transitions},n.updateQueue.baseState=u,n.memoizedState=u,n.flags&256){i=Ca(Error(f(423)),n),n=Mu(e,n,r,t,i);break e}else if(r!==i){i=Ca(Error(f(424)),n),n=Mu(e,n,r,t,i);break e}else for(ar=Br(n.stateNode.containerInfo.firstChild),rr=n,At=!0,hr=null,t=Hs(n,null,r,t),n.child=t;t;)t.flags=t.flags&-3|4096,t=t.sibling;else{if(ba(),r===i){n=Mr(e,n,t);break e}Yt(e,n,r,t)}n=n.child}return n;case 5:return $s(n),e===null&&Ko(n),r=n.type,i=n.pendingProps,u=e!==null?e.memoizedProps:null,x=i.children,Io(r,i)?x=null:u!==null&&Io(r,u)&&(n.flags|=32),Ru(e,n),Yt(e,n,x,t),n.child;case 6:return e===null&&Ko(n),null;case 13:return Uu(e,n,t);case 4:return Zo(n,n.stateNode.containerInfo),r=n.pendingProps,e===null?n.child=Sa(n,null,r,t):Yt(e,n,r,t),n.child;case 11:return r=n.type,i=n.pendingProps,i=n.elementType===r?i:mr(r,i),Lu(e,n,r,i,t);case 7:return Yt(e,n,n.pendingProps,t),n.child;case 8:return Yt(e,n,n.pendingProps.children,t),n.child;case 12:return Yt(e,n,n.pendingProps.children,t),n.child;case 10:e:{if(r=n.type._context,i=n.pendingProps,u=n.memoizedProps,x=i.value,gt(Pl,r._currentValue),r._currentValue=x,u!==null)if(_r(u.value,x)){if(u.children===i.children&&!$t.current){n=Mr(e,n,t);break e}}else for(u=n.child,u!==null&&(u.return=n);u!==null;){var W=u.dependencies;if(W!==null){x=u.child;for(var ue=W.firstContext;ue!==null;){if(ue.context===r){if(u.tag===1){ue=Cr(-1,t&-t),ue.tag=2;var qe=u.updateQueue;if(qe!==null){qe=qe.shared;var Ln=qe.pending;Ln===null?ue.next=ue:(ue.next=Ln.next,Ln.next=ue),qe.pending=ue}}u.lanes|=t,ue=u.alternate,ue!==null&&(ue.lanes|=t),qo(u.return,t,n),W.lanes|=t;break}ue=ue.next}}else if(u.tag===10)x=u.type===n.type?null:u.child;else if(u.tag===18){if(x=u.return,x===null)throw Error(f(341));x.lanes|=t,W=x.alternate,W!==null&&(W.lanes|=t),qo(x,t,n),x=u.sibling}else x=u.child;if(x!==null)x.return=u;else for(x=u;x!==null;){if(x===n){x=null;break}if(u=x.sibling,u!==null){u.return=x.return,x=u;break}x=x.return}u=x}Yt(e,n,i.children,t),n=n.child}return n;case 9:return i=n.type,r=n.pendingProps.children,Ra(n,t),i=sr(i),r=r(i),n.flags|=1,Yt(e,n,r,t),n.child;case 14:return r=n.type,i=mr(r,n.pendingProps),i=mr(r.type,i),bu(e,n,r,i,t);case 15:return Su(e,n,n.type,n.pendingProps,t);case 17:return r=n.type,i=n.pendingProps,i=n.elementType===r?i:mr(r,i),Wl(e,n),n.tag=1,Qt(r)?(e=!0,Rl(n)):e=!1,Ra(n,t),vu(n,r,i),fi(n,r,i,t),hi(null,n,r,!0,e,t);case 19:return Pu(e,n,t);case 22:return Ou(e,n,t)}throw Error(f(156,n.tag))};function oc(e,n){return $n(e,n)}function md(e,n,t,r){this.tag=e,this.key=t,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.ref=null,this.pendingProps=n,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=r,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function fr(e,n,t,r){return new md(e,n,t,r)}function Ii(e){return e=e.prototype,!(!e||!e.isReactComponent)}function gd(e){if(typeof e=="function")return Ii(e)?1:0;if(e!=null){if(e=e.$$typeof,e===tn)return 11;if(e===ae)return 14}return 2}function $r(e,n){var t=e.alternate;return t===null?(t=fr(e.tag,n,e.key,e.mode),t.elementType=e.elementType,t.type=e.type,t.stateNode=e.stateNode,t.alternate=e,e.alternate=t):(t.pendingProps=n,t.type=e.type,t.flags=0,t.subtreeFlags=0,t.deletions=null),t.flags=e.flags&14680064,t.childLanes=e.childLanes,t.lanes=e.lanes,t.child=e.child,t.memoizedProps=e.memoizedProps,t.memoizedState=e.memoizedState,t.updateQueue=e.updateQueue,n=e.dependencies,t.dependencies=n===null?null:{lanes:n.lanes,firstContext:n.firstContext},t.sibling=e.sibling,t.index=e.index,t.ref=e.ref,t}function lo(e,n,t,r,i,u){var x=2;if(r=e,typeof e=="function")Ii(e)&&(x=1);else if(typeof e=="string")x=5;else e:switch(e){case P:return _a(t.children,i,u,n);case re:x=8,i|=8;break;case Ae:return e=fr(12,t,n,i|2),e.elementType=Ae,e.lanes=u,e;case an:return e=fr(13,t,n,i),e.elementType=an,e.lanes=u,e;case sn:return e=fr(19,t,n,i),e.elementType=sn,e.lanes=u,e;case ze:return oo(t,i,u,n);default:if(typeof e=="object"&&e!==null)switch(e.$$typeof){case ge:x=10;break e;case Oe:x=9;break e;case tn:x=11;break e;case ae:x=14;break e;case oe:x=16,r=null;break e}throw Error(f(130,e==null?e:typeof e,""))}return n=fr(x,t,n,i),n.elementType=e,n.type=r,n.lanes=u,n}function _a(e,n,t,r){return e=fr(7,e,r,n),e.lanes=t,e}function oo(e,n,t,r){return e=fr(22,e,r,n),e.elementType=ze,e.lanes=t,e.stateNode={isHidden:!1},e}function Pi(e,n,t){return e=fr(6,e,null,n),e.lanes=t,e}function Di(e,n,t){return n=fr(4,e.children!==null?e.children:[],e.key,n),n.lanes=t,n.stateNode={containerInfo:e.containerInfo,pendingChildren:null,implementation:e.implementation},n}function yd(e,n,t,r,i){this.tag=n,this.containerInfo=e,this.finishedWork=this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.pendingContext=this.context=null,this.callbackPriority=0,this.eventTimes=_e(0),this.expirationTimes=_e(-1),this.entangledLanes=this.finishedLanes=this.mutableReadLanes=this.expiredLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=_e(0),this.identifierPrefix=r,this.onRecoverableError=i,this.mutableSourceEagerHydrationData=null}function Gi(e,n,t,r,i,u,x,W,ue){return e=new yd(e,n,t,W,ue),n===1?(n=1,u===!0&&(n|=8)):n=0,u=fr(3,null,null,n),e.current=u,u.stateNode=e,u.memoizedState={element:r,isDehydrated:t,cache:null,transitions:null,pendingSuspenseBoundaries:null},Qo(u),e}function vd(e,n,t){var r=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:ln,key:r==null?null:""+r,children:e,containerInfo:n,implementation:t}}function ic(e){if(!e)return Vr;e=e._reactInternals;e:{if(Me(e)!==e||e.tag!==1)throw Error(f(170));var n=e;do{switch(n.tag){case 3:n=n.stateNode.context;break e;case 1:if(Qt(n.type)){n=n.stateNode.__reactInternalMemoizedMergedChildContext;break e}}n=n.return}while(n!==null);throw Error(f(171))}if(e.tag===1){var t=e.type;if(Qt(t))return Is(e,t,n)}return n}function sc(e,n,t,r,i,u,x,W,ue){return e=Gi(t,r,!0,e,i,u,x,W,ue),e.context=ic(null),t=e.current,r=Wt(),i=Wr(t),u=Cr(r,i),u.callback=n??null,Kr(t,u,i),e.current.lanes=i,bn(e,i,r),er(e,r),e}function io(e,n,t,r){var i=n.current,u=Wt(),x=Wr(i);return t=ic(t),n.context===null?n.context=t:n.pendingContext=t,n=Cr(u,x),n.payload={element:e},r=r===void 0?null:r,r!==null&&(n.callback=r),e=Kr(i,n,x),e!==null&&(vr(e,i,x,u),Gl(e,i,x)),x}function so(e){if(e=e.current,!e.child)return null;switch(e.child.tag){case 5:return e.child.stateNode;default:return e.child.stateNode}}function uc(e,n){if(e=e.memoizedState,e!==null&&e.dehydrated!==null){var t=e.retryLane;e.retryLane=t!==0&&t<n?t:n}}function Bi(e,n){uc(e,n),(e=e.alternate)&&uc(e,n)}function xd(){return null}var cc=typeof reportError=="function"?reportError:function(e){console.error(e)};function Fi(e){this._internalRoot=e}uo.prototype.render=Fi.prototype.render=function(e){var n=this._internalRoot;if(n===null)throw Error(f(409));io(e,n,null,null)},uo.prototype.unmount=Fi.prototype.unmount=function(){var e=this._internalRoot;if(e!==null){this._internalRoot=null;var n=e.containerInfo;fa(function(){io(null,e,null,null)}),n[br]=null}};function uo(e){this._internalRoot=e}uo.prototype.unstable_scheduleHydration=function(e){if(e){var n=Wn();e={blockedOn:null,target:e,priority:n};for(var t=0;t<dr.length&&n!==0&&n<dr[t].priority;t++);dr.splice(t,0,e),t===0&&Jr(e)}};function Vi(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11)}function co(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11&&(e.nodeType!==8||e.nodeValue!==" react-mount-point-unstable "))}function fc(){}function Ad(e,n,t,r,i){if(i){if(typeof r=="function"){var u=r;r=function(){var qe=so(x);u.call(qe)}}var x=sc(n,r,e,0,null,!1,!1,"",fc);return e._reactRootContainer=x,e[br]=x.current,$a(e.nodeType===8?e.parentNode:e),fa(),x}for(;i=e.lastChild;)e.removeChild(i);if(typeof r=="function"){var W=r;r=function(){var qe=so(ue);W.call(qe)}}var ue=Gi(e,0,!1,null,null,!1,!1,"",fc);return e._reactRootContainer=ue,e[br]=ue.current,$a(e.nodeType===8?e.parentNode:e),fa(function(){io(n,ue,t,r)}),ue}function fo(e,n,t,r,i){var u=t._reactRootContainer;if(u){var x=u;if(typeof i=="function"){var W=i;i=function(){var ue=so(x);W.call(ue)}}io(n,x,e,i)}else x=Ad(t,n,e,i,r);return so(x)}j=function(e){switch(e.tag){case 3:var n=e.stateNode;if(n.current.memoizedState.isDehydrated){var t=Sn(n.pendingLanes);t!==0&&(zn(n,t|1),er(n,Vn()),(dt&6)===0&&(Ia=Vn()+500,jr()))}break;case 13:fa(function(){var r=Nr(e,1);if(r!==null){var i=Wt();vr(r,e,1,i)}}),Bi(e,1)}},Ne=function(e){if(e.tag===13){var n=Nr(e,134217728);if(n!==null){var t=Wt();vr(n,e,134217728,t)}Bi(e,134217728)}},kn=function(e){if(e.tag===13){var n=Wr(e),t=Nr(e,n);if(t!==null){var r=Wt();vr(t,e,n,r)}Bi(e,n)}},Wn=function(){return jn},st=function(e,n){var t=jn;try{return jn=e,n()}finally{jn=t}},be=function(e,n,t){switch(n){case"input":if(le(e,t),n=t.name,t.type==="radio"&&n!=null){for(t=e;t.parentNode;)t=t.parentNode;for(t=t.querySelectorAll("input[name="+JSON.stringify(""+n)+'][type="radio"]'),n=0;n<t.length;n++){var r=t[n];if(r!==e&&r.form===e.form){var i=Sl(r);if(!i)throw Error(f(90));Ee(r),le(r,i)}}}break;case"textarea":Pe(e,t);break;case"select":n=t.value,n!=null&&Ke(e,!!t.multiple,n,!1)}},l=Ci,s=fa;var kd={usingClientEntryPoint:!1,Events:[Ja,ka,Sl,Ve,vn,Ci]},pl={findFiberByHostInstance:ra,bundleType:0,version:"18.3.1",rendererPackageName:"react-dom"},Td={bundleType:pl.bundleType,version:pl.version,rendererPackageName:pl.rendererPackageName,rendererConfig:pl.rendererConfig,overrideHookState:null,overrideHookStateDeletePath:null,overrideHookStateRenamePath:null,overrideProps:null,overridePropsDeletePath:null,overridePropsRenamePath:null,setErrorHandler:null,setSuspenseHandler:null,scheduleUpdate:null,currentDispatcherRef:He.ReactCurrentDispatcher,findHostInstanceByFiber:function(e){return e=Pn(e),e===null?null:e.stateNode},findFiberByHostInstance:pl.findFiberByHostInstance||xd,findHostInstancesForRefresh:null,scheduleRefresh:null,scheduleRoot:null,setRefreshHandler:null,getCurrentFiber:null,reconcilerVersion:"18.3.1-next-f1338f8080-20240426"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"){var po=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!po.isDisabled&&po.supportsFiber)try{L=po.inject(Td),ie=po}catch{}}return nr.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=kd,nr.createPortal=function(e,n){var t=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!Vi(n))throw Error(f(200));return vd(e,n,null,t)},nr.createRoot=function(e,n){if(!Vi(e))throw Error(f(299));var t=!1,r="",i=cc;return n!=null&&(n.unstable_strictMode===!0&&(t=!0),n.identifierPrefix!==void 0&&(r=n.identifierPrefix),n.onRecoverableError!==void 0&&(i=n.onRecoverableError)),n=Gi(e,1,!1,null,null,t,!1,r,i),e[br]=n.current,$a(e.nodeType===8?e.parentNode:e),new Fi(n)},nr.findDOMNode=function(e){if(e==null)return null;if(e.nodeType===1)return e;var n=e._reactInternals;if(n===void 0)throw typeof e.render=="function"?Error(f(188)):(e=Object.keys(e).join(","),Error(f(268,e)));return e=Pn(n),e=e===null?null:e.stateNode,e},nr.flushSync=function(e){return fa(e)},nr.hydrate=function(e,n,t){if(!co(n))throw Error(f(200));return fo(null,e,n,!0,t)},nr.hydrateRoot=function(e,n,t){if(!Vi(e))throw Error(f(405));var r=t!=null&&t.hydratedSources||null,i=!1,u="",x=cc;if(t!=null&&(t.unstable_strictMode===!0&&(i=!0),t.identifierPrefix!==void 0&&(u=t.identifierPrefix),t.onRecoverableError!==void 0&&(x=t.onRecoverableError)),n=sc(n,null,e,1,t??null,i,!1,u,x),e[br]=n.current,$a(e),r)for(e=0;e<r.length;e++)t=r[e],i=t._getVersion,i=i(t._source),n.mutableSourceEagerHydrationData==null?n.mutableSourceEagerHydrationData=[t,i]:n.mutableSourceEagerHydrationData.push(t,i);return new uo(n)},nr.render=function(e,n,t){if(!co(n))throw Error(f(200));return fo(null,e,n,!1,t)},nr.unmountComponentAtNode=function(e){if(!co(e))throw Error(f(40));return e._reactRootContainer?(fa(function(){fo(null,null,e,!1,function(){e._reactRootContainer=null,e[br]=null})}),!0):!1},nr.unstable_batchedUpdates=Ci,nr.unstable_renderSubtreeIntoContainer=function(e,n,t,r){if(!co(t))throw Error(f(200));if(e==null||e._reactInternals===void 0)throw Error(f(38));return fo(e,n,t,!1,r)},nr.version="18.3.1-next-f1338f8080-20240426",nr}var xc;function Ud(){if(xc)return Ki.exports;xc=1;function a(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(a)}catch(B){console.error(B)}}return a(),Ki.exports=Md(),Ki.exports}var Ac;function Id(){if(Ac)return _o;Ac=1;var a=Ud();return _o.createRoot=a.createRoot,_o.hydrateRoot=a.hydrateRoot,_o}var Pd=Id();const Dd=Zi(Pd);var Da=Ji();const ma=Zi(Da),Gd="modulepreload",Bd=function(a){return"/arcade/rfdgamestudio/"+a},kc={},Ga=function(B,f,w){let v=Promise.resolve();if(f&&f.length>0){let R=function(b){return Promise.all(b.map(K=>Promise.resolve(K).then(A=>({status:"fulfilled",value:A}),A=>({status:"rejected",reason:A}))))};document.getElementsByTagName("link");const U=document.querySelector("meta[property=csp-nonce]"),z=(U==null?void 0:U.nonce)||(U==null?void 0:U.getAttribute("nonce"));v=R(f.map(b=>{if(b=Bd(b),b in kc)return;kc[b]=!0;const K=b.endsWith(".css"),A=K?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${b}"]${A}`))return;const F=document.createElement("link");if(F.rel=K?"stylesheet":Gd,K||(F.as="script"),F.crossOrigin="",F.href=b,z&&F.setAttribute("nonce",z),document.head.appendChild(F),K)return new Promise((Q,ce)=>{F.addEventListener("load",Q),F.addEventListener("error",()=>ce(new Error(`Unable to preload CSS for ${b}`)))})}))}function D(R){const U=new Event("vite:preloadError",{cancelable:!0});if(U.payload=R,window.dispatchEvent(U),!U.defaultPrevented)throw R}return v.then(R=>{for(const U of R||[])U.status==="rejected"&&D(U.reason);return B().catch(D)})},Fd={gameId:"horse_racing",label:"Derby Sim",description:"Race, breed, and bet on horses. Win/Place/Show betting, genetics system, career tracking.",color:"#f59e0b",status:"stable",component:ma.lazy(()=>Ga(()=>import("./App-Bnkwc3A3.js"),__vite__mapDeps([0,1,2,3,4,5])))},Vd={gameId:"slither_rogue",label:"Snake Roguelike",description:"Slither.io meets roguelike. Steal segments, collect evolution cards, dominate the arena.",color:"#34d399",status:"beta",component:ma.lazy(()=>Ga(()=>import("./App-7fR4UAeZ.js"),__vite__mapDeps([6,2,3,4,7,8,9])))},jd={gameId:"mutant_battle_ball",label:"Mutant Battle Ball",description:"Assemble mutants from parts. Field a 2v2 squad. Reach the end zone. Salvage the fallen.",color:"#f87171",status:"dev",component:ma.lazy(()=>Ga(()=>import("./App-CqfMCql3.js"),__vite__mapDeps([10,2,1,11,8,12])))},zd={gameId:"slime_coin",label:"SlimeCoin",description:"Real-time coin pusher with shooter, two-layer board, and chip synergies",color:"#a855f7",status:"dev",component:ma.lazy(()=>Ga(()=>import("./App-6kgo7ZI8.js"),__vite__mapDeps([13,2,1,8,11,14])))},Kd={gameId:"chimera_wilds",label:"Chimera Wilds",description:"Face a single randomly-assembled six-part enemy in a one-roll D20 encounter",color:"#14b8a6",status:"dev",component:ma.lazy(()=>Ga(()=>import("./App-VBPPGOF0.js"),__vite__mapDeps([15,2,1,11,16])))},Hd={gameId:"scrapcrawl",label:"ScrapCrawl",description:"Room navigation, scrap economy, craft, and D20 combat with win-only proficiency.",color:"#f59e0b",status:"dev",component:ma.lazy(()=>Ga(()=>import("./App-Dl2kL4xm.js"),__vite__mapDeps([17,2,1,11,7,4,18])))},Xd={gameId:"voiddrift",label:"VoidRift",description:"A mining simulation at the edge of a black hole — drones mine autonomously, ore refines into components, and unexplained signal-bottles arrive for you to collect. No win condition. No escape.",color:"#6366f1",status:"external",externalUrl:"https://rdug627.itch.io/voidrift",embedUrl:"https://itch.io/embed-upload/17482080?color=333333",embedWidth:960,embedHeight:1300},Yd={gameId:"brewfield",label:"Brewfield",description:"A turn-based potions-brewing roguelike — Element × Component combinations, a living Residue field, Wa-Tor-inspired trophic chemistry.",color:"#84cc16",status:"external",embedUrl:"/arcade/brewfield/"},Wd={gameId:"ledger",label:"Ledger",description:"A Dutch-auction trading and appraisal simulator — compounding debt, a volatile resale market, and soft lockout consequences for missed payments.",color:"#06b6d4",status:"external",embedUrl:"/arcade/ledger/"},qd={gameId:"shoal",label:"Shoal",description:"A Wa-Tor ecosystem simulation turned into a survival strategy game — balance predator/prey populations across a toroidal ocean grid.",color:"#3b82f6",status:"external",embedUrl:"/arcade/shoal/"},$d={gameId:"trinity_siege",label:"Trinity Siege",description:"Three-faction siege combat — deploy units, breach walls, resolve encounters. LEAST-VERIFIED: prior sessions found fabricated combat logic and misattributed bugs; playable but not vouched for correctness.",color:"#ef4444",status:"external",embedUrl:"/arcade/trinity_siege/"},Qd={gameId:"slimebreeder",label:"SlimeBreeder",description:"A multi-tank slime breeding and genetics sandbox — pulls from the SlimeGarden core loop, reimagined as a standalone TypeScript demo.",color:"#ec4899",status:"external",embedUrl:"/arcade/slimebreeder/"},$i=[Fd,Vd,jd,zd,Kd,Hd,Xd,Yd,Wd,qd,$d,Qd];function Tc(a){return $i.find(B=>B.gameId===a)}const Zd=`-- chimera_wilds/logic.lua — Phase 1 minimal encounter loop
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
`,Jd=`-- Horse Racing — Game-Specific Logic
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

`,ep=`-- Mutant Battle Ball — Match Simulation & Management
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
`,np=`-- scrapcrawl/logic.lua — Phase A core loop port
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
`,tp=`-- logic.lua — SlimeCoin game logic
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
`,rp=`-- Slither Rogue — Collision
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
`,ap=`-- Slither Rogue — Game Logic (entry point)
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
`,lp=`-- Slither Rogue — Physics
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
`,op=`-- Slither Rogue — Render State
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
`,ip=`-- Slither Rogue — State
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
`,sp=`-- Slither Rogue — Utilities
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
`,up=`-- engine/primitives/action.lua
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
`,cp=`-- engine/primitives/consequence.lua
-- Placeholder — consequence patterns are game-specific for now.
-- Will be populated when a shared consequence emerges across 2+ games.
-- Convention: apply_{outcome}(entity, result) -> updated_entity
`,fp=`-- engine/primitives/entity.lua
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
`,dp=`-- engine/primitives/lifecycle.lua
-- Standard lifecycle event names. Use as string keys in systems.yaml.

LIFECYCLE_CREATE    = "create"
LIFECYCLE_STEP      = "step"
LIFECYCLE_DRAW      = "draw"       -- TypeScript only, documented here for clarity
LIFECYCLE_COLLISION = "collision"
LIFECYCLE_DESTROY   = "destroy"
`,pp=`-- engine/primitives/movement.lua
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
`,_p=`-- engine/primitives/physics.lua
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
`,hp=`-- engine/primitives/resolution.lua
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
`,mp=`-- engine/systems/combat.lua
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
`,gp=`-- engine/systems/genetics.lua
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
`,yp=`-- engine/systems/market.lua
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
`,vp=`-- engine/systems/odds.lua
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
`,xp=`-- RFDGameStudio — Layout Resolver
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
`;/*! js-yaml 4.2.0 https://github.com/nodeca/js-yaml @license MIT */var Ap=Object.create,Sc=Object.defineProperty,kp=Object.getOwnPropertyDescriptor,Tp=Object.getOwnPropertyNames,wp=Object.getPrototypeOf,Ep=Object.prototype.hasOwnProperty,xt=(a,B)=>()=>(B||(a((B={exports:{}}).exports,B),a=null),B.exports),Lp=(a,B,f,w)=>{if(B&&typeof B=="object"||typeof B=="function")for(var v=Tp(B),D=0,R=v.length,U;D<R;D++)U=v[D],!Ep.call(a,U)&&U!==f&&Sc(a,U,{get:(z=>B[z]).bind(null,U),enumerable:!(w=kp(B,U))||w.enumerable});return a},bp=(a,B,f)=>(f=a!=null?Ap(wp(a)):{},Lp(Sc(f,"default",{value:a,enumerable:!0}),a)),ml=xt(((a,B)=>{function f(z){return typeof z>"u"||z===null}function w(z){return typeof z=="object"&&z!==null}function v(z){return Array.isArray(z)?z:f(z)?[]:[z]}function D(z,b){if(b){const K=Object.keys(b);for(let A=0,F=K.length;A<F;A+=1){const Q=K[A];z[Q]=b[Q]}}return z}function R(z,b){let K="";for(let A=0;A<b;A+=1)K+=z;return K}function U(z){return z===0&&Number.NEGATIVE_INFINITY===1/z}B.exports.isNothing=f,B.exports.isObject=w,B.exports.toArray=v,B.exports.repeat=R,B.exports.isNegativeZero=U,B.exports.extend=D})),gl=xt(((a,B)=>{function f(v,D){let R="";const U=v.reason||"(unknown reason)";return v.mark?(v.mark.name&&(R+='in "'+v.mark.name+'" '),R+="("+(v.mark.line+1)+":"+(v.mark.column+1)+")",!D&&v.mark.snippet&&(R+=`

`+v.mark.snippet),U+" "+R):U}function w(v,D){Error.call(this),this.name="YAMLException",this.reason=v,this.mark=D,this.message=f(this,!1),Error.captureStackTrace?Error.captureStackTrace(this,this.constructor):this.stack=new Error().stack||""}w.prototype=Object.create(Error.prototype),w.prototype.constructor=w,w.prototype.toString=function(D){return this.name+": "+f(this,D)},B.exports=w})),Sp=xt(((a,B)=>{var f=ml();function w(R,U,z,b,K){let A="",F="";const Q=Math.floor(K/2)-1;return b-U>Q&&(A=" ... ",U=b-Q+A.length),z-b>Q&&(F=" ...",z=b+Q-F.length),{str:A+R.slice(U,z).replace(/\t/g,"→")+F,pos:b-U+A.length}}function v(R,U){return f.repeat(" ",U-R.length)+R}function D(R,U){if(U=Object.create(U||null),!R.buffer)return null;U.maxLength||(U.maxLength=79),typeof U.indent!="number"&&(U.indent=1),typeof U.linesBefore!="number"&&(U.linesBefore=3),typeof U.linesAfter!="number"&&(U.linesAfter=2);const z=/\r?\n|\r|\0/g,b=[0],K=[];let A,F=-1;for(;A=z.exec(R.buffer);)K.push(A.index),b.push(A.index+A[0].length),R.position<=A.index&&F<0&&(F=b.length-2);F<0&&(F=b.length-1);let Q="";const ce=Math.min(R.line+U.linesAfter,K.length).toString().length,$=U.maxLength-(U.indent+ce+3);for(let se=1;se<=U.linesBefore&&!(F-se<0);se++){const $e=w(R.buffer,b[F-se],K[F-se],R.position-(b[F]-b[F-se]),$);Q=f.repeat(" ",U.indent)+v((R.line-se+1).toString(),ce)+" | "+$e.str+`
`+Q}const ve=w(R.buffer,b[F],K[F],R.position,$);Q+=f.repeat(" ",U.indent)+v((R.line+1).toString(),ce)+" | "+ve.str+`
`,Q+=f.repeat("-",U.indent+ce+3+ve.pos)+`^
`;for(let se=1;se<=U.linesAfter&&!(F+se>=K.length);se++){const $e=w(R.buffer,b[F+se],K[F+se],R.position-(b[F]-b[F+se]),$);Q+=f.repeat(" ",U.indent)+v((R.line+se+1).toString(),ce)+" | "+$e.str+`
`}return Q.replace(/\n$/,"")}B.exports=D})),qt=xt(((a,B)=>{var f=gl(),w=["kind","multi","resolve","construct","instanceOf","predicate","represent","representName","defaultStyle","styleAliases"],v=["scalar","sequence","mapping"];function D(U){const z={};return U!==null&&Object.keys(U).forEach(function(b){U[b].forEach(function(K){z[String(K)]=b})}),z}function R(U,z){if(z=z||{},Object.keys(z).forEach(function(b){if(w.indexOf(b)===-1)throw new f('Unknown option "'+b+'" is met in definition of "'+U+'" YAML type.')}),this.options=z,this.tag=U,this.kind=z.kind||null,this.resolve=z.resolve||function(){return!0},this.construct=z.construct||function(b){return b},this.instanceOf=z.instanceOf||null,this.predicate=z.predicate||null,this.represent=z.represent||null,this.representName=z.representName||null,this.defaultStyle=z.defaultStyle||null,this.multi=z.multi||!1,this.styleAliases=D(z.styleAliases||null),v.indexOf(this.kind)===-1)throw new f('Unknown kind "'+this.kind+'" is specified for "'+U+'" YAML type.')}B.exports=R})),Oc=xt(((a,B)=>{var f=gl(),w=qt();function v(U,z){const b=[];return U[z].forEach(function(K){let A=b.length;b.forEach(function(F,Q){F.tag===K.tag&&F.kind===K.kind&&F.multi===K.multi&&(A=Q)}),b[A]=K}),b}function D(){const U={scalar:{},sequence:{},mapping:{},fallback:{},multi:{scalar:[],sequence:[],mapping:[],fallback:[]}};function z(b){b.multi?(U.multi[b.kind].push(b),U.multi.fallback.push(b)):U[b.kind][b.tag]=U.fallback[b.tag]=b}for(let b=0,K=arguments.length;b<K;b+=1)arguments[b].forEach(z);return U}function R(U){return this.extend(U)}R.prototype.extend=function(z){let b=[],K=[];if(z instanceof w)K.push(z);else if(Array.isArray(z))K=K.concat(z);else if(z&&(Array.isArray(z.implicit)||Array.isArray(z.explicit)))z.implicit&&(b=b.concat(z.implicit)),z.explicit&&(K=K.concat(z.explicit));else throw new f("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");b.forEach(function(F){if(!(F instanceof w))throw new f("Specified list of YAML types (or a single Type object) contains a non-Type object.");if(F.loadKind&&F.loadKind!=="scalar")throw new f("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");if(F.multi)throw new f("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.")}),K.forEach(function(F){if(!(F instanceof w))throw new f("Specified list of YAML types (or a single Type object) contains a non-Type object.")});const A=Object.create(R.prototype);return A.implicit=(this.implicit||[]).concat(b),A.explicit=(this.explicit||[]).concat(K),A.compiledImplicit=v(A,"implicit"),A.compiledExplicit=v(A,"explicit"),A.compiledTypeMap=D(A.compiledImplicit,A.compiledExplicit),A},B.exports=R})),Rc=xt(((a,B)=>{B.exports=new(qt())("tag:yaml.org,2002:str",{kind:"scalar",construct:function(f){return f!==null?f:""}})})),Nc=xt(((a,B)=>{B.exports=new(qt())("tag:yaml.org,2002:seq",{kind:"sequence",construct:function(f){return f!==null?f:[]}})})),Cc=xt(((a,B)=>{B.exports=new(qt())("tag:yaml.org,2002:map",{kind:"mapping",construct:function(f){return f!==null?f:{}}})})),Mc=xt(((a,B)=>{B.exports=new(Oc())({explicit:[Rc(),Nc(),Cc()]})})),Uc=xt(((a,B)=>{var f=qt();function w(R){if(R===null)return!0;const U=R.length;return U===1&&R==="~"||U===4&&(R==="null"||R==="Null"||R==="NULL")}function v(){return null}function D(R){return R===null}B.exports=new f("tag:yaml.org,2002:null",{kind:"scalar",resolve:w,construct:v,predicate:D,represent:{canonical:function(){return"~"},lowercase:function(){return"null"},uppercase:function(){return"NULL"},camelcase:function(){return"Null"},empty:function(){return""}},defaultStyle:"lowercase"})})),Ic=xt(((a,B)=>{var f=qt();function w(R){if(R===null)return!1;const U=R.length;return U===4&&(R==="true"||R==="True"||R==="TRUE")||U===5&&(R==="false"||R==="False"||R==="FALSE")}function v(R){return R==="true"||R==="True"||R==="TRUE"}function D(R){return Object.prototype.toString.call(R)==="[object Boolean]"}B.exports=new f("tag:yaml.org,2002:bool",{kind:"scalar",resolve:w,construct:v,predicate:D,represent:{lowercase:function(R){return R?"true":"false"},uppercase:function(R){return R?"TRUE":"FALSE"},camelcase:function(R){return R?"True":"False"}},defaultStyle:"lowercase"})})),Pc=xt(((a,B)=>{var f=ml(),w=qt();function v(A){return A>=48&&A<=57||A>=65&&A<=70||A>=97&&A<=102}function D(A){return A>=48&&A<=55}function R(A){return A>=48&&A<=57}function U(A){if(A===null)return!1;const F=A.length;let Q=0,ce=!1;if(!F)return!1;let $=A[Q];if(($==="-"||$==="+")&&($=A[++Q]),$==="0"){if(Q+1===F)return!0;if($=A[++Q],$==="b"){for(Q++;Q<F;Q++){if($=A[Q],$!=="0"&&$!=="1")return!1;ce=!0}return ce&&Number.isFinite(z(A))}if($==="x"){for(Q++;Q<F;Q++){if(!v(A.charCodeAt(Q)))return!1;ce=!0}return ce&&Number.isFinite(z(A))}if($==="o"){for(Q++;Q<F;Q++){if(!D(A.charCodeAt(Q)))return!1;ce=!0}return ce&&Number.isFinite(z(A))}}for(;Q<F;Q++){if(!R(A.charCodeAt(Q)))return!1;ce=!0}return ce?Number.isFinite(z(A)):!1}function z(A){let F=A,Q=1,ce=F[0];if((ce==="-"||ce==="+")&&(ce==="-"&&(Q=-1),F=F.slice(1),ce=F[0]),F==="0")return 0;if(ce==="0"){if(F[1]==="b")return Q*parseInt(F.slice(2),2);if(F[1]==="x")return Q*parseInt(F.slice(2),16);if(F[1]==="o")return Q*parseInt(F.slice(2),8)}return Q*parseInt(F,10)}function b(A){return z(A)}function K(A){return Object.prototype.toString.call(A)==="[object Number]"&&A%1===0&&!f.isNegativeZero(A)}B.exports=new w("tag:yaml.org,2002:int",{kind:"scalar",resolve:U,construct:b,predicate:K,represent:{binary:function(A){return A>=0?"0b"+A.toString(2):"-0b"+A.toString(2).slice(1)},octal:function(A){return A>=0?"0o"+A.toString(8):"-0o"+A.toString(8).slice(1)},decimal:function(A){return A.toString(10)},hexadecimal:function(A){return A>=0?"0x"+A.toString(16).toUpperCase():"-0x"+A.toString(16).toUpperCase().slice(1)}},defaultStyle:"decimal",styleAliases:{binary:[2,"bin"],octal:[8,"oct"],decimal:[10,"dec"],hexadecimal:[16,"hex"]}})})),Dc=xt(((a,B)=>{var f=ml(),w=qt(),v=new RegExp("^(?:[-+]?(?:[0-9]+)(?:\\.[0-9]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"),D=new RegExp("^(?:[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");function R(A){return A===null||!v.test(A)?!1:Number.isFinite(parseFloat(A,10))?!0:D.test(A)}function U(A){let F=A.toLowerCase();const Q=F[0]==="-"?-1:1;return"+-".indexOf(F[0])>=0&&(F=F.slice(1)),F===".inf"?Q===1?Number.POSITIVE_INFINITY:Number.NEGATIVE_INFINITY:F===".nan"?NaN:Q*parseFloat(F,10)}var z=/^[-+]?[0-9]+e/;function b(A,F){if(isNaN(A))switch(F){case"lowercase":return".nan";case"uppercase":return".NAN";case"camelcase":return".NaN"}else if(Number.POSITIVE_INFINITY===A)switch(F){case"lowercase":return".inf";case"uppercase":return".INF";case"camelcase":return".Inf"}else if(Number.NEGATIVE_INFINITY===A)switch(F){case"lowercase":return"-.inf";case"uppercase":return"-.INF";case"camelcase":return"-.Inf"}else if(f.isNegativeZero(A))return"-0.0";const Q=A.toString(10);return z.test(Q)?Q.replace("e",".e"):Q}function K(A){return Object.prototype.toString.call(A)==="[object Number]"&&(A%1!==0||f.isNegativeZero(A))}B.exports=new w("tag:yaml.org,2002:float",{kind:"scalar",resolve:R,construct:U,predicate:K,represent:b,defaultStyle:"lowercase"})})),Gc=xt(((a,B)=>{B.exports=Mc().extend({implicit:[Uc(),Ic(),Pc(),Dc()]})})),Bc=xt(((a,B)=>{B.exports=Gc()})),Fc=xt(((a,B)=>{var f=qt(),w=new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"),v=new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$");function D(z){return z===null?!1:w.exec(z)!==null||v.exec(z)!==null}function R(z){let b=0,K=null,A=w.exec(z);if(A===null&&(A=v.exec(z)),A===null)throw new Error("Date resolve error");const F=+A[1],Q=+A[2]-1,ce=+A[3];if(!A[4])return new Date(Date.UTC(F,Q,ce));const $=+A[4],ve=+A[5],se=+A[6];if(A[7]){for(b=A[7].slice(0,3);b.length<3;)b+="0";b=+b}if(A[9]){const nn=+A[10],He=+(A[11]||0);K=(nn*60+He)*6e4,A[9]==="-"&&(K=-K)}const $e=new Date(Date.UTC(F,Q,ce,$,ve,se,b));return K&&$e.setTime($e.getTime()-K),$e}function U(z){return z.toISOString()}B.exports=new f("tag:yaml.org,2002:timestamp",{kind:"scalar",resolve:D,construct:R,instanceOf:Date,represent:U})})),Vc=xt(((a,B)=>{var f=qt();function w(v){return v==="<<"||v===null}B.exports=new f("tag:yaml.org,2002:merge",{kind:"scalar",resolve:w})})),jc=xt(((a,B)=>{var f=qt(),w=`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=
\r`;function v(z){if(z===null)return!1;let b=0;const K=z.length,A=w;for(let F=0;F<K;F++){const Q=A.indexOf(z.charAt(F));if(!(Q>64)){if(Q<0)return!1;b+=6}}return b%8===0}function D(z){const b=z.replace(/[\r\n=]/g,""),K=b.length,A=w;let F=0;const Q=[];for(let $=0;$<K;$++)$%4===0&&$&&(Q.push(F>>16&255),Q.push(F>>8&255),Q.push(F&255)),F=F<<6|A.indexOf(b.charAt($));const ce=K%4*6;return ce===0?(Q.push(F>>16&255),Q.push(F>>8&255),Q.push(F&255)):ce===18?(Q.push(F>>10&255),Q.push(F>>2&255)):ce===12&&Q.push(F>>4&255),new Uint8Array(Q)}function R(z){let b="",K=0;const A=z.length,F=w;for(let ce=0;ce<A;ce++)ce%3===0&&ce&&(b+=F[K>>18&63],b+=F[K>>12&63],b+=F[K>>6&63],b+=F[K&63]),K=(K<<8)+z[ce];const Q=A%3;return Q===0?(b+=F[K>>18&63],b+=F[K>>12&63],b+=F[K>>6&63],b+=F[K&63]):Q===2?(b+=F[K>>10&63],b+=F[K>>4&63],b+=F[K<<2&63],b+=F[64]):Q===1&&(b+=F[K>>2&63],b+=F[K<<4&63],b+=F[64],b+=F[64]),b}function U(z){return Object.prototype.toString.call(z)==="[object Uint8Array]"}B.exports=new f("tag:yaml.org,2002:binary",{kind:"scalar",resolve:v,construct:D,predicate:U,represent:R})})),zc=xt(((a,B)=>{var f=qt(),w=Object.prototype.hasOwnProperty,v=Object.prototype.toString;function D(U){if(U===null)return!0;const z=[],b=U;for(let K=0,A=b.length;K<A;K+=1){const F=b[K];let Q=!1;if(v.call(F)!=="[object Object]")return!1;let ce;for(ce in F)if(w.call(F,ce))if(!Q)Q=!0;else return!1;if(!Q)return!1;if(z.indexOf(ce)===-1)z.push(ce);else return!1}return!0}function R(U){return U!==null?U:[]}B.exports=new f("tag:yaml.org,2002:omap",{kind:"sequence",resolve:D,construct:R})})),Kc=xt(((a,B)=>{var f=qt(),w=Object.prototype.toString;function v(R){if(R===null)return!0;const U=R,z=new Array(U.length);for(let b=0,K=U.length;b<K;b+=1){const A=U[b];if(w.call(A)!=="[object Object]")return!1;const F=Object.keys(A);if(F.length!==1)return!1;z[b]=[F[0],A[F[0]]]}return!0}function D(R){if(R===null)return[];const U=R,z=new Array(U.length);for(let b=0,K=U.length;b<K;b+=1){const A=U[b],F=Object.keys(A);z[b]=[F[0],A[F[0]]]}return z}B.exports=new f("tag:yaml.org,2002:pairs",{kind:"sequence",resolve:v,construct:D})})),Hc=xt(((a,B)=>{var f=qt(),w=Object.prototype.hasOwnProperty;function v(R){if(R===null)return!0;const U=R;for(const z in U)if(w.call(U,z)&&U[z]!==null)return!1;return!0}function D(R){return R!==null?R:{}}B.exports=new f("tag:yaml.org,2002:set",{kind:"mapping",resolve:v,construct:D})})),es=xt(((a,B)=>{B.exports=Bc().extend({implicit:[Fc(),Vc()],explicit:[jc(),zc(),Kc(),Hc()]})})),Op=xt(((a,B)=>{var f=ml(),w=gl(),v=Sp(),D=es(),R=Object.prototype.hasOwnProperty,U=1,z=2,b=3,K=4,A=1,F=2,Q=3,ce=/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/,$=/[\x85\u2028\u2029]/,ve=/[,\[\]{}]/,se=/^(?:!|!!|![0-9A-Za-z-]+!)$/,$e=/^(?:!|[^,\[\]{}])(?:%[0-9a-f]{2}|[0-9a-z\-#;/?:@&=+$,_.!~*'()\[\]])*$/i;function nn(o){return Object.prototype.toString.call(o)}function He(o){return o===10||o===13}function Xe(o){return o===9||o===32}function ln(o){return o===9||o===32||o===10||o===13}function P(o){return o===44||o===91||o===93||o===123||o===125}function re(o){if(o>=48&&o<=57)return o-48;const fe=o|32;return fe>=97&&fe<=102?fe-97+10:-1}function Ae(o){return o===120?2:o===117?4:o===85?8:0}function ge(o){return o>=48&&o<=57?o-48:-1}function Oe(o){switch(o){case 48:return"\0";case 97:return"\x07";case 98:return"\b";case 116:return"	";case 9:return"	";case 110:return`
`;case 118:return"\v";case 102:return"\f";case 114:return"\r";case 101:return"\x1B";case 32:return" ";case 34:return'"';case 47:return"/";case 92:return"\\";case 78:return"";case 95:return" ";case 76:return"\u2028";case 80:return"\u2029";default:return""}}function tn(o){return o<=65535?String.fromCharCode(o):String.fromCharCode((o-65536>>10)+55296,(o-65536&1023)+56320)}function an(o,fe,h){fe==="__proto__"?Object.defineProperty(o,fe,{configurable:!0,enumerable:!0,writable:!0,value:h}):o[fe]=h}var sn=new Array(256),ae=new Array(256);for(let o=0;o<256;o++)sn[o]=Oe(o)?1:0,ae[o]=Oe(o);function oe(o,fe){this.input=o,this.filename=fe.filename||null,this.schema=fe.schema||D,this.onWarning=fe.onWarning||null,this.legacy=fe.legacy||!1,this.json=fe.json||!1,this.listener=fe.listener||null,this.maxDepth=typeof fe.maxDepth=="number"?fe.maxDepth:100,this.maxMergeSeqLength=typeof fe.maxMergeSeqLength=="number"?fe.maxMergeSeqLength:20,this.implicitTypes=this.schema.compiledImplicit,this.typeMap=this.schema.compiledTypeMap,this.length=o.length,this.position=0,this.line=0,this.lineStart=0,this.lineIndent=0,this.depth=0,this.firstTabInLine=-1,this.documents=[],this.anchorMapTransactions=[]}function ze(o,fe){const h={name:o.filename,buffer:o.input.slice(0,-1),position:o.position,line:o.line,column:o.position-o.lineStart};return h.snippet=v(h),new w(fe,h)}function C(o,fe){throw ze(o,fe)}function Ce(o,fe){o.onWarning&&o.onWarning.call(null,ze(o,fe))}function E(o,fe,h){const Y=o.anchorMapTransactions;if(Y.length!==0){const V=Y[Y.length-1];R.call(V,fe)||(V[fe]={existed:R.call(o.anchorMap,fe),value:o.anchorMap[fe]})}o.anchorMap[fe]=h}function g(o){o.anchorMapTransactions.push(Object.create(null))}function S(o){const fe=o.anchorMapTransactions.pop(),h=o.anchorMapTransactions;if(h.length===0)return;const Y=h[h.length-1],V=Object.keys(fe);for(let J=0,d=V.length;J<d;J+=1){const M=V[J];R.call(Y,M)||(Y[M]=fe[M])}}function xe(o){const fe=o.anchorMapTransactions.pop(),h=Object.keys(fe);for(let Y=h.length-1;Y>=0;Y-=1){const V=fe[h[Y]];V.existed?o.anchorMap[h[Y]]=V.value:delete o.anchorMap[h[Y]]}}function Te(o){return{position:o.position,line:o.line,lineStart:o.lineStart,lineIndent:o.lineIndent,firstTabInLine:o.firstTabInLine,tag:o.tag,anchor:o.anchor,kind:o.kind,result:o.result}}function pn(o,fe){o.position=fe.position,o.line=fe.line,o.lineStart=fe.lineStart,o.lineIndent=fe.lineIndent,o.firstTabInLine=fe.firstTabInLine,o.tag=fe.tag,o.anchor=fe.anchor,o.kind=fe.kind,o.result=fe.result}var Ze={YAML:function(fe,h,Y){fe.version!==null&&C(fe,"duplication of %YAML directive"),Y.length!==1&&C(fe,"YAML directive accepts exactly one argument");const V=/^([0-9]+)\.([0-9]+)$/.exec(Y[0]);V===null&&C(fe,"ill-formed argument of the YAML directive");const J=parseInt(V[1],10),d=parseInt(V[2],10);J!==1&&C(fe,"unacceptable YAML version of the document"),fe.version=Y[0],fe.checkLineBreaks=d<2,d!==1&&d!==2&&Ce(fe,"unsupported YAML version of the document")},TAG:function(fe,h,Y){let V;Y.length!==2&&C(fe,"TAG directive accepts exactly two arguments");const J=Y[0];V=Y[1],se.test(J)||C(fe,"ill-formed tag handle (first argument) of the TAG directive"),R.call(fe.tagMap,J)&&C(fe,'there is a previously declared suffix for "'+J+'" tag handle'),$e.test(V)||C(fe,"ill-formed tag prefix (second argument) of the TAG directive");try{V=decodeURIComponent(V)}catch{C(fe,"tag prefix is malformed: "+V)}fe.tagMap[J]=V}};function fn(o,fe,h,Y){if(fe<h){const V=o.input.slice(fe,h);if(Y)for(let J=0,d=V.length;J<d;J+=1){const M=V.charCodeAt(J);M===9||M>=32&&M<=1114111||C(o,"expected valid JSON character")}else ce.test(V)&&C(o,"the stream contains non-printable characters");o.result+=V}}function mn(o,fe,h,Y){f.isObject(h)||C(o,"cannot merge mappings; the provided source object is unacceptable");const V=Object.keys(h);for(let J=0,d=V.length;J<d;J+=1){const M=V[J];R.call(fe,M)||(an(fe,M,h[M]),Y[M]=!0)}}function q(o,fe,h,Y,V,J,d,M,te){if(Array.isArray(V)){V=Array.prototype.slice.call(V);for(let Le=0,be=V.length;Le<be;Le+=1)Array.isArray(V[Le])&&C(o,"nested arrays are not supported inside keys"),typeof V=="object"&&nn(V[Le])==="[object Object]"&&(V[Le]="[object Object]")}if(typeof V=="object"&&nn(V)==="[object Object]"&&(V="[object Object]"),V=String(V),fe===null&&(fe={}),Y==="tag:yaml.org,2002:merge")if(Array.isArray(J)){J.length>o.maxMergeSeqLength&&C(o,"merge sequence length exceeded maxMergeSeqLength ("+o.maxMergeSeqLength+")");const Le=new Set;for(let be=0,De=J.length;be<De;be+=1){const Ye=J[be];Le.has(Ye)||(Le.add(Ye),mn(o,fe,Ye,h))}}else mn(o,fe,J,h);else!o.json&&!R.call(h,V)&&R.call(fe,V)&&(o.line=d||o.line,o.lineStart=M||o.lineStart,o.position=te||o.position,C(o,"duplicated mapping key")),an(fe,V,J),delete h[V];return fe}function ee(o){const fe=o.input.charCodeAt(o.position);fe===10?o.position++:fe===13?(o.position++,o.input.charCodeAt(o.position)===10&&o.position++):C(o,"a line break is expected"),o.line+=1,o.lineStart=o.position,o.firstTabInLine=-1}function Ue(o,fe,h){let Y=0,V=o.input.charCodeAt(o.position);for(;V!==0;){for(;Xe(V);)V===9&&o.firstTabInLine===-1&&(o.firstTabInLine=o.position),V=o.input.charCodeAt(++o.position);if(fe&&V===35)do V=o.input.charCodeAt(++o.position);while(V!==10&&V!==13&&V!==0);if(He(V))for(ee(o),V=o.input.charCodeAt(o.position),Y++,o.lineIndent=0;V===32;)o.lineIndent++,V=o.input.charCodeAt(++o.position);else break}return h!==-1&&Y!==0&&o.lineIndent<h&&Ce(o,"deficient indentation"),Y}function Ee(o){let fe=o.position,h=o.input.charCodeAt(fe);return!!((h===45||h===46)&&h===o.input.charCodeAt(fe+1)&&h===o.input.charCodeAt(fe+2)&&(fe+=3,h=o.input.charCodeAt(fe),h===0||ln(h)))}function rn(o,fe){fe===1?o.result+=" ":fe>1&&(o.result+=f.repeat(`
`,fe-1))}function On(o,fe,h){let Y,V,J,d,M,te;const Le=o.kind,be=o.result;let De=o.input.charCodeAt(o.position);if(ln(De)||P(De)||De===35||De===38||De===42||De===33||De===124||De===62||De===39||De===34||De===37||De===64||De===96)return!1;if(De===63||De===45){const Ye=o.input.charCodeAt(o.position+1);if(ln(Ye)||h&&P(Ye))return!1}for(o.kind="scalar",o.result="",Y=V=o.position,J=!1;De!==0;){if(De===58){const Ye=o.input.charCodeAt(o.position+1);if(ln(Ye)||h&&P(Ye))break}else if(De===35){if(ln(o.input.charCodeAt(o.position-1)))break}else{if(o.position===o.lineStart&&Ee(o)||h&&P(De))break;if(He(De))if(d=o.line,M=o.lineStart,te=o.lineIndent,Ue(o,!1,-1),o.lineIndent>=fe){J=!0,De=o.input.charCodeAt(o.position);continue}else{o.position=V,o.line=d,o.lineStart=M,o.lineIndent=te;break}}J&&(fn(o,Y,V,!1),rn(o,o.line-d),Y=V=o.position,J=!1),Xe(De)||(V=o.position+1),De=o.input.charCodeAt(++o.position)}return fn(o,Y,V,!1),o.result?!0:(o.kind=Le,o.result=be,!1)}function An(o,fe){let h,Y,V=o.input.charCodeAt(o.position);if(V!==39)return!1;for(o.kind="scalar",o.result="",o.position++,h=Y=o.position;(V=o.input.charCodeAt(o.position))!==0;)if(V===39)if(fn(o,h,o.position,!0),V=o.input.charCodeAt(++o.position),V===39)h=o.position,o.position++,Y=o.position;else return!0;else He(V)?(fn(o,h,Y,!0),rn(o,Ue(o,!1,fe)),h=Y=o.position):o.position===o.lineStart&&Ee(o)?C(o,"unexpected end of the document within a single quoted scalar"):(o.position++,Xe(V)||(Y=o.position));C(o,"unexpected end of the stream within a single quoted scalar")}function Je(o,fe){let h,Y,V,J=o.input.charCodeAt(o.position);if(J!==34)return!1;for(o.kind="scalar",o.result="",o.position++,h=Y=o.position;(J=o.input.charCodeAt(o.position))!==0;){if(J===34)return fn(o,h,o.position,!0),o.position++,!0;if(J===92){if(fn(o,h,o.position,!0),J=o.input.charCodeAt(++o.position),He(J))Ue(o,!1,fe);else if(J<256&&sn[J])o.result+=ae[J],o.position++;else if((V=Ae(J))>0){let d=V,M=0;for(;d>0;d--)J=o.input.charCodeAt(++o.position),(V=re(J))>=0?M=(M<<4)+V:C(o,"expected hexadecimal character");o.result+=tn(M),o.position++}else C(o,"unknown escape sequence");h=Y=o.position}else He(J)?(fn(o,h,Y,!0),rn(o,Ue(o,!1,fe)),h=Y=o.position):o.position===o.lineStart&&Ee(o)?C(o,"unexpected end of the document within a double quoted scalar"):(o.position++,Xe(J)||(Y=o.position))}C(o,"unexpected end of the stream within a double quoted scalar")}function le(o,fe){let h=!0,Y,V,J;const d=o.tag;let M;const te=o.anchor;let Le,be,De,Ye;const Fe=Object.create(null);let Ve,vn,l,s=o.input.charCodeAt(o.position);if(s===91)Le=93,Ye=!1,M=[];else if(s===123)Le=125,Ye=!0,M={};else return!1;for(o.anchor!==null&&E(o,o.anchor,M),s=o.input.charCodeAt(++o.position);s!==0;){if(Ue(o,!0,fe),s=o.input.charCodeAt(o.position),s===Le)return o.position++,o.tag=d,o.anchor=te,o.kind=Ye?"mapping":"sequence",o.result=M,!0;h?s===44&&C(o,"expected the node content, but found ','"):C(o,"missed comma between flow collection entries"),vn=Ve=l=null,be=De=!1,s===63&&ln(o.input.charCodeAt(o.position+1))&&(be=De=!0,o.position++,Ue(o,!0,fe)),Y=o.line,V=o.lineStart,J=o.position,Nn(o,fe,U,!1,!0),vn=o.tag,Ve=o.result,Ue(o,!0,fe),s=o.input.charCodeAt(o.position),(De||o.line===Y)&&s===58&&(be=!0,s=o.input.charCodeAt(++o.position),Ue(o,!0,fe),Nn(o,fe,U,!1,!0),l=o.result),Ye?q(o,M,Fe,vn,Ve,l,Y,V,J):be?M.push(q(o,null,Fe,vn,Ve,l,Y,V,J)):M.push(Ve),Ue(o,!0,fe),s=o.input.charCodeAt(o.position),s===44?(h=!0,s=o.input.charCodeAt(++o.position)):h=!1}C(o,"unexpected end of the stream within a flow collection")}function Ie(o,fe){let h,Y=A,V=!1,J=!1,d=fe,M=0,te=!1,Le,be=o.input.charCodeAt(o.position);if(be===124)h=!1;else if(be===62)h=!0;else return!1;for(o.kind="scalar",o.result="";be!==0;)if(be=o.input.charCodeAt(++o.position),be===43||be===45)A===Y?Y=be===43?Q:F:C(o,"repeat of a chomping mode identifier");else if((Le=ge(be))>=0)Le===0?C(o,"bad explicit indentation width of a block scalar; it cannot be less than one"):J?C(o,"repeat of an indentation width identifier"):(d=fe+Le-1,J=!0);else break;if(Xe(be)){do be=o.input.charCodeAt(++o.position);while(Xe(be));if(be===35)do be=o.input.charCodeAt(++o.position);while(!He(be)&&be!==0)}for(;be!==0;){for(ee(o),o.lineIndent=0,be=o.input.charCodeAt(o.position);(!J||o.lineIndent<d)&&be===32;)o.lineIndent++,be=o.input.charCodeAt(++o.position);if(!J&&o.lineIndent>d&&(d=o.lineIndent),He(be)){M++;continue}if(!J&&d===0&&C(o,"missing indentation for block scalar"),o.lineIndent<d){Y===Q?o.result+=f.repeat(`
`,V?1+M:M):Y===A&&V&&(o.result+=`
`);break}h?Xe(be)?(te=!0,o.result+=f.repeat(`
`,V?1+M:M)):te?(te=!1,o.result+=f.repeat(`
`,M+1)):M===0?V&&(o.result+=" "):o.result+=f.repeat(`
`,M):o.result+=f.repeat(`
`,V?1+M:M),V=!0,J=!0,M=0;const De=o.position;for(;!He(be)&&be!==0;)be=o.input.charCodeAt(++o.position);fn(o,De,o.position,!1)}return!0}function N(o,fe){const h=o.tag,Y=o.anchor,V=[];let J=!1;if(o.firstTabInLine!==-1)return!1;o.anchor!==null&&E(o,o.anchor,V);let d=o.input.charCodeAt(o.position);for(;d!==0&&(o.firstTabInLine!==-1&&(o.position=o.firstTabInLine,C(o,"tab characters must not be used in indentation")),!(d!==45||!ln(o.input.charCodeAt(o.position+1))));){if(J=!0,o.position++,Ue(o,!0,-1)&&o.lineIndent<=fe){V.push(null),d=o.input.charCodeAt(o.position);continue}const M=o.line;if(Nn(o,fe,b,!1,!0),V.push(o.result),Ue(o,!0,-1),d=o.input.charCodeAt(o.position),(o.line===M||o.lineIndent>fe)&&d!==0)C(o,"bad indentation of a sequence entry");else if(o.lineIndent<fe)break}return J?(o.tag=h,o.anchor=Y,o.kind="sequence",o.result=V,!0):!1}function me(o,fe,h){let Y,V,J,d;const M=o.tag,te=o.anchor,Le={},be=Object.create(null);let De=null,Ye=null,Fe=null,Ve=!1,vn=!1;if(o.firstTabInLine!==-1)return!1;o.anchor!==null&&E(o,o.anchor,Le);let l=o.input.charCodeAt(o.position);for(;l!==0;){!Ve&&o.firstTabInLine!==-1&&(o.position=o.firstTabInLine,C(o,"tab characters must not be used in indentation"));const s=o.input.charCodeAt(o.position+1),_=o.line;if((l===63||l===58)&&ln(s))l===63?(Ve&&(q(o,Le,be,De,Ye,null,V,J,d),De=Ye=Fe=null),vn=!0,Ve=!0,Y=!0):Ve?(Ve=!1,Y=!0):C(o,"incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line"),o.position+=1,l=s;else{if(V=o.line,J=o.lineStart,d=o.position,!Nn(o,h,z,!1,!0))break;if(o.line===_){for(l=o.input.charCodeAt(o.position);Xe(l);)l=o.input.charCodeAt(++o.position);if(l===58)l=o.input.charCodeAt(++o.position),ln(l)||C(o,"a whitespace character is expected after the key-value separator within a block mapping"),Ve&&(q(o,Le,be,De,Ye,null,V,J,d),De=Ye=Fe=null),vn=!0,Ve=!1,Y=!1,De=o.tag,Ye=o.result;else if(vn)C(o,"can not read an implicit mapping pair; a colon is missed");else return o.tag=M,o.anchor=te,!0}else if(vn)C(o,"can not read a block mapping entry; a multiline key may not be an implicit key");else return o.tag=M,o.anchor=te,!0}if((o.line===_||o.lineIndent>fe)&&(Ve&&(V=o.line,J=o.lineStart,d=o.position),Nn(o,fe,K,!0,Y)&&(Ve?Ye=o.result:Fe=o.result),Ve||(q(o,Le,be,De,Ye,Fe,V,J,d),De=Ye=Fe=null),Ue(o,!0,-1),l=o.input.charCodeAt(o.position)),(o.line===_||o.lineIndent>fe)&&l!==0)C(o,"bad indentation of a mapping entry");else if(o.lineIndent<fe)break}return Ve&&q(o,Le,be,De,Ye,null,V,J,d),vn&&(o.tag=M,o.anchor=te,o.kind="mapping",o.result=Le),vn}function Ke(o){let fe=!1,h=!1,Y,V,J=o.input.charCodeAt(o.position);if(J!==33)return!1;o.tag!==null&&C(o,"duplication of a tag property"),J=o.input.charCodeAt(++o.position),J===60?(fe=!0,J=o.input.charCodeAt(++o.position)):J===33?(h=!0,Y="!!",J=o.input.charCodeAt(++o.position)):Y="!";let d=o.position;if(fe){do J=o.input.charCodeAt(++o.position);while(J!==0&&J!==62);o.position<o.length?(V=o.input.slice(d,o.position),J=o.input.charCodeAt(++o.position)):C(o,"unexpected end of the stream within a verbatim tag")}else{for(;J!==0&&!ln(J);)J===33&&(h?C(o,"tag suffix cannot contain exclamation marks"):(Y=o.input.slice(d-1,o.position+1),se.test(Y)||C(o,"named tag handle cannot contain such characters"),h=!0,d=o.position+1)),J=o.input.charCodeAt(++o.position);V=o.input.slice(d,o.position),ve.test(V)&&C(o,"tag suffix cannot contain flow indicator characters")}V&&!$e.test(V)&&C(o,"tag name cannot contain such characters: "+V);try{V=decodeURIComponent(V)}catch{C(o,"tag name is malformed: "+V)}return fe?o.tag=V:R.call(o.tagMap,Y)?o.tag=o.tagMap[Y]+V:Y==="!"?o.tag="!"+V:Y==="!!"?o.tag="tag:yaml.org,2002:"+V:C(o,'undeclared tag handle "'+Y+'"'),!0}function G(o){let fe=o.input.charCodeAt(o.position);if(fe!==38)return!1;o.anchor!==null&&C(o,"duplication of an anchor property"),fe=o.input.charCodeAt(++o.position);const h=o.position;for(;fe!==0&&!ln(fe)&&!P(fe);)fe=o.input.charCodeAt(++o.position);return o.position===h&&C(o,"name of an anchor node must contain at least one character"),o.anchor=o.input.slice(h,o.position),!0}function we(o){let fe=o.input.charCodeAt(o.position);if(fe!==42)return!1;fe=o.input.charCodeAt(++o.position);const h=o.position;for(;fe!==0&&!ln(fe)&&!P(fe);)fe=o.input.charCodeAt(++o.position);o.position===h&&C(o,"name of an alias node must contain at least one character");const Y=o.input.slice(h,o.position);return R.call(o.anchorMap,Y)||C(o,'unidentified alias "'+Y+'"'),o.result=o.anchorMap[Y],Ue(o,!0,-1),!0}function Pe(o,fe,h,Y){const V=Te(o);return g(o),pn(o,fe),o.tag=null,o.anchor=null,o.kind=null,o.result=null,me(o,h,Y)&&o.kind==="mapping"?(S(o),!0):(xe(o),pn(o,V),!1)}function Nn(o,fe,h,Y,V){let J,d,M=1,te=!1,Le=!1,be=null,De,Ye,Fe;o.depth>=o.maxDepth&&C(o,"nesting exceeded maxDepth ("+o.maxDepth+")"),o.depth+=1,o.listener!==null&&o.listener("open",o),o.tag=null,o.anchor=null,o.kind=null,o.result=null;const Ve=J=d=K===h||b===h;if(Y&&Ue(o,!0,-1)&&(te=!0,o.lineIndent>fe?M=1:o.lineIndent===fe?M=0:o.lineIndent<fe&&(M=-1)),M===1)for(;;){const vn=o.input.charCodeAt(o.position),l=Te(o);if(te&&(vn===33&&o.tag!==null||vn===38&&o.anchor!==null)||!Ke(o)&&!G(o))break;be===null&&(be=l),Ue(o,!0,-1)?(te=!0,d=Ve,o.lineIndent>fe?M=1:o.lineIndent===fe?M=0:o.lineIndent<fe&&(M=-1)):d=!1}if(d&&(d=te||V),M===1||K===h)if(U===h||z===h?Ye=fe:Ye=fe+1,Fe=o.position-o.lineStart,M===1)if(d&&(N(o,Fe)||me(o,Fe,Ye))||le(o,Ye))Le=!0;else{const vn=o.input.charCodeAt(o.position);be!==null&&Ve&&!d&&vn!==124&&vn!==62&&Pe(o,be,be.position-be.lineStart,Ye)||J&&Ie(o,Ye)||An(o,Ye)||Je(o,Ye)?Le=!0:we(o)?(Le=!0,(o.tag!==null||o.anchor!==null)&&C(o,"alias node should not have any properties")):On(o,Ye,U===h)&&(Le=!0,o.tag===null&&(o.tag="?")),o.anchor!==null&&E(o,o.anchor,o.result)}else M===0&&(Le=d&&N(o,Fe));if(o.tag===null)o.anchor!==null&&E(o,o.anchor,o.result);else if(o.tag==="?"){o.result!==null&&o.kind!=="scalar"&&C(o,'unacceptable node kind for !<?> tag; it should be "scalar", not "'+o.kind+'"');for(let vn=0,l=o.implicitTypes.length;vn<l;vn+=1)if(De=o.implicitTypes[vn],De.resolve(o.result)){o.result=De.construct(o.result),o.tag=De.tag,o.anchor!==null&&E(o,o.anchor,o.result);break}}else if(o.tag!=="!"){if(R.call(o.typeMap[o.kind||"fallback"],o.tag))De=o.typeMap[o.kind||"fallback"][o.tag];else{De=null;const vn=o.typeMap.multi[o.kind||"fallback"];for(let l=0,s=vn.length;l<s;l+=1)if(o.tag.slice(0,vn[l].tag.length)===vn[l].tag){De=vn[l];break}}De||C(o,"unknown tag !<"+o.tag+">"),o.result!==null&&De.kind!==o.kind&&C(o,"unacceptable node kind for !<"+o.tag+'> tag; it should be "'+De.kind+'", not "'+o.kind+'"'),De.resolve(o.result,o.tag)?(o.result=De.construct(o.result,o.tag),o.anchor!==null&&E(o,o.anchor,o.result)):C(o,"cannot resolve a node with !<"+o.tag+"> explicit tag")}return o.listener!==null&&o.listener("close",o),o.depth-=1,o.tag!==null||o.anchor!==null||Le}function In(o){const fe=o.position;let h=!1,Y;for(o.version=null,o.checkLineBreaks=o.legacy,o.tagMap=Object.create(null),o.anchorMap=Object.create(null);(Y=o.input.charCodeAt(o.position))!==0&&(Ue(o,!0,-1),Y=o.input.charCodeAt(o.position),!(o.lineIndent>0||Y!==37));){h=!0,Y=o.input.charCodeAt(++o.position);let V=o.position;for(;Y!==0&&!ln(Y);)Y=o.input.charCodeAt(++o.position);const J=o.input.slice(V,o.position),d=[];for(J.length<1&&C(o,"directive name must not be less than one character in length");Y!==0;){for(;Xe(Y);)Y=o.input.charCodeAt(++o.position);if(Y===35){do Y=o.input.charCodeAt(++o.position);while(Y!==0&&!He(Y));break}if(He(Y))break;for(V=o.position;Y!==0&&!ln(Y);)Y=o.input.charCodeAt(++o.position);d.push(o.input.slice(V,o.position))}Y!==0&&ee(o),R.call(Ze,J)?Ze[J](o,J,d):Ce(o,'unknown document directive "'+J+'"')}if(Ue(o,!0,-1),o.lineIndent===0&&o.input.charCodeAt(o.position)===45&&o.input.charCodeAt(o.position+1)===45&&o.input.charCodeAt(o.position+2)===45?(o.position+=3,Ue(o,!0,-1)):h&&C(o,"directives end mark is expected"),Nn(o,o.lineIndent-1,K,!1,!0),Ue(o,!0,-1),o.checkLineBreaks&&$.test(o.input.slice(fe,o.position))&&Ce(o,"non-ASCII line breaks are interpreted as content"),o.documents.push(o.result),o.position===o.lineStart&&Ee(o)){o.input.charCodeAt(o.position)===46&&(o.position+=3,Ue(o,!0,-1));return}o.position<o.length-1&&C(o,"end of the stream or a document separator is expected")}function Mn(o,fe){o=String(o),fe=fe||{},o.length!==0&&(o.charCodeAt(o.length-1)!==10&&o.charCodeAt(o.length-1)!==13&&(o+=`
`),o.charCodeAt(0)===65279&&(o=o.slice(1)));const h=new oe(o,fe),Y=o.indexOf("\0");for(Y!==-1&&(h.position=Y,C(h,"null byte is not allowed in input")),h.input+="\0";h.input.charCodeAt(h.position)===32;)h.lineIndent+=1,h.position+=1;for(;h.position<h.length-1;)In(h);return h.documents}function Zn(o,fe,h){fe!==null&&typeof fe=="object"&&typeof h>"u"&&(h=fe,fe=null);const Y=Mn(o,h);if(typeof fe!="function")return Y;for(let V=0,J=Y.length;V<J;V+=1)fe(Y[V])}function ot(o,fe){const h=Mn(o,fe);if(h.length!==0){if(h.length===1)return h[0];throw new w("expected a single document in the stream, but found more")}}B.exports.loadAll=Zn,B.exports.load=ot})),Rp=xt(((a,B)=>{var f=ml(),w=gl(),v=es(),D=Object.prototype.toString,R=Object.prototype.hasOwnProperty,U=65279,z=9,b=10,K=13,A=32,F=33,Q=34,ce=35,$=37,ve=38,se=39,$e=42,nn=44,He=45,Xe=58,ln=61,P=62,re=63,Ae=64,ge=91,Oe=93,tn=96,an=123,sn=124,ae=125,oe={};oe[0]="\\0",oe[7]="\\a",oe[8]="\\b",oe[9]="\\t",oe[10]="\\n",oe[11]="\\v",oe[12]="\\f",oe[13]="\\r",oe[27]="\\e",oe[34]='\\"',oe[92]="\\\\",oe[133]="\\N",oe[160]="\\_",oe[8232]="\\L",oe[8233]="\\P";var ze=["y","Y","yes","Yes","YES","on","On","ON","n","N","no","No","NO","off","Off","OFF"],C=/^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;function Ce(d,M){if(M===null)return{};const te={},Le=Object.keys(M);for(let be=0,De=Le.length;be<De;be+=1){let Ye=Le[be],Fe=String(M[Ye]);Ye.slice(0,2)==="!!"&&(Ye="tag:yaml.org,2002:"+Ye.slice(2));const Ve=d.compiledTypeMap.fallback[Ye];Ve&&R.call(Ve.styleAliases,Fe)&&(Fe=Ve.styleAliases[Fe]),te[Ye]=Fe}return te}function E(d){let M,te;const Le=d.toString(16).toUpperCase();if(d<=255)M="x",te=2;else if(d<=65535)M="u",te=4;else if(d<=4294967295)M="U",te=8;else throw new w("code point within a string may not be greater than 0xFFFFFFFF");return"\\"+M+f.repeat("0",te-Le.length)+Le}var g=1,S=2;function xe(d){this.schema=d.schema||v,this.indent=Math.max(1,d.indent||2),this.noArrayIndent=d.noArrayIndent||!1,this.skipInvalid=d.skipInvalid||!1,this.flowLevel=f.isNothing(d.flowLevel)?-1:d.flowLevel,this.styleMap=Ce(this.schema,d.styles||null),this.sortKeys=d.sortKeys||!1,this.lineWidth=d.lineWidth||80,this.noRefs=d.noRefs||!1,this.noCompatMode=d.noCompatMode||!1,this.condenseFlow=d.condenseFlow||!1,this.quotingType=d.quotingType==='"'?S:g,this.forceQuotes=d.forceQuotes||!1,this.replacer=typeof d.replacer=="function"?d.replacer:null,this.implicitTypes=this.schema.compiledImplicit,this.explicitTypes=this.schema.compiledExplicit,this.tag=null,this.result="",this.duplicates=[],this.usedDuplicates=null}function Te(d,M){const te=f.repeat(" ",M);let Le=0,be="";const De=d.length;for(;Le<De;){let Ye;const Fe=d.indexOf(`
`,Le);Fe===-1?(Ye=d.slice(Le),Le=De):(Ye=d.slice(Le,Fe+1),Le=Fe+1),Ye.length&&Ye!==`
`&&(be+=te),be+=Ye}return be}function pn(d,M){return`
`+f.repeat(" ",d.indent*M)}function Ze(d,M){for(let te=0,Le=d.implicitTypes.length;te<Le;te+=1)if(d.implicitTypes[te].resolve(M))return!0;return!1}function fn(d){return d===A||d===z}function mn(d){return d>=32&&d<=126||d>=161&&d<=55295&&d!==8232&&d!==8233||d>=57344&&d<=65533&&d!==U||d>=65536&&d<=1114111}function q(d){return mn(d)&&d!==U&&d!==K&&d!==b}function ee(d,M,te){const Le=q(d),be=Le&&!fn(d);return(te?Le:Le&&d!==nn&&d!==ge&&d!==Oe&&d!==an&&d!==ae)&&d!==ce&&!(M===Xe&&!be)||q(M)&&!fn(M)&&d===ce||M===Xe&&be}function Ue(d){return mn(d)&&d!==U&&!fn(d)&&d!==He&&d!==re&&d!==Xe&&d!==nn&&d!==ge&&d!==Oe&&d!==an&&d!==ae&&d!==ce&&d!==ve&&d!==$e&&d!==F&&d!==sn&&d!==ln&&d!==P&&d!==se&&d!==Q&&d!==$&&d!==Ae&&d!==tn}function Ee(d){return!fn(d)&&d!==Xe}function rn(d,M){const te=d.charCodeAt(M);let Le;return te>=55296&&te<=56319&&M+1<d.length&&(Le=d.charCodeAt(M+1),Le>=56320&&Le<=57343)?(te-55296)*1024+Le-56320+65536:te}function On(d){return/^\n* /.test(d)}var An=1,Je=2,le=3,Ie=4,N=5;function me(d,M,te,Le,be,De,Ye,Fe){let Ve,vn=0,l=null,s=!1,_=!1;const c=Le!==-1;let m=-1,O=Ue(rn(d,0))&&Ee(rn(d,d.length-1));if(M||Ye)for(Ve=0;Ve<d.length;vn>=65536?Ve+=2:Ve++){if(vn=rn(d,Ve),!mn(vn))return N;O=O&&ee(vn,l,Fe),l=vn}else{for(Ve=0;Ve<d.length;vn>=65536?Ve+=2:Ve++){if(vn=rn(d,Ve),vn===b)s=!0,c&&(_=_||Ve-m-1>Le&&d[m+1]!==" ",m=Ve);else if(!mn(vn))return N;O=O&&ee(vn,l,Fe),l=vn}_=_||c&&Ve-m-1>Le&&d[m+1]!==" "}return!s&&!_?O&&!Ye&&!be(d)?An:De===S?N:Je:te>9&&On(d)?N:Ye?De===S?N:Je:_?Ie:le}function Ke(d,M,te,Le,be){d.dump=(function(){if(M.length===0)return d.quotingType===S?'""':"''";if(!d.noCompatMode&&(ze.indexOf(M)!==-1||C.test(M)))return d.quotingType===S?'"'+M+'"':"'"+M+"'";const De=d.indent*Math.max(1,te),Ye=d.lineWidth===-1?-1:Math.max(Math.min(d.lineWidth,40),d.lineWidth-De),Fe=Le||d.flowLevel>-1&&te>=d.flowLevel;function Ve(vn){return Ze(d,vn)}switch(me(M,Fe,d.indent,Ye,Ve,d.quotingType,d.forceQuotes&&!Le,be)){case An:return M;case Je:return"'"+M.replace(/'/g,"''")+"'";case le:return"|"+G(M,d.indent)+we(Te(M,De));case Ie:return">"+G(M,d.indent)+we(Te(Pe(M,Ye),De));case N:return'"'+In(M)+'"';default:throw new w("impossible error: invalid scalar style")}})()}function G(d,M){const te=On(d)?String(M):"",Le=d[d.length-1]===`
`;return te+(Le&&(d[d.length-2]===`
`||d===`
`)?"+":Le?"":"-")+`
`}function we(d){return d[d.length-1]===`
`?d.slice(0,-1):d}function Pe(d,M){const te=/(\n+)([^\n]*)/g;let Le=(function(){let Fe=d.indexOf(`
`);return Fe=Fe!==-1?Fe:d.length,te.lastIndex=Fe,Nn(d.slice(0,Fe),M)})(),be=d[0]===`
`||d[0]===" ",De,Ye;for(;Ye=te.exec(d);){const Fe=Ye[1],Ve=Ye[2];De=Ve[0]===" ",Le+=Fe+(!be&&!De&&Ve!==""?`
`:"")+Nn(Ve,M),be=De}return Le}function Nn(d,M){if(d===""||d[0]===" ")return d;const te=/ [^ ]/g;let Le,be=0,De,Ye=0,Fe=0,Ve="";for(;Le=te.exec(d);)Fe=Le.index,Fe-be>M&&(De=Ye>be?Ye:Fe,Ve+=`
`+d.slice(be,De),be=De+1),Ye=Fe;return Ve+=`
`,d.length-be>M&&Ye>be?Ve+=d.slice(be,Ye)+`
`+d.slice(Ye+1):Ve+=d.slice(be),Ve.slice(1)}function In(d){let M="",te=0;for(let Le=0;Le<d.length;te>=65536?Le+=2:Le++){te=rn(d,Le);const be=oe[te];!be&&mn(te)?(M+=d[Le],te>=65536&&(M+=d[Le+1])):M+=be||E(te)}return M}function Mn(d,M,te){let Le="";const be=d.tag;for(let De=0,Ye=te.length;De<Ye;De+=1){let Fe=te[De];d.replacer&&(Fe=d.replacer.call(te,String(De),Fe)),(h(d,M,Fe,!1,!1)||typeof Fe>"u"&&h(d,M,null,!1,!1))&&(Le!==""&&(Le+=","+(d.condenseFlow?"":" ")),Le+=d.dump)}d.tag=be,d.dump="["+Le+"]"}function Zn(d,M,te,Le){let be="";const De=d.tag;for(let Ye=0,Fe=te.length;Ye<Fe;Ye+=1){let Ve=te[Ye];d.replacer&&(Ve=d.replacer.call(te,String(Ye),Ve)),(h(d,M+1,Ve,!0,!0,!1,!0)||typeof Ve>"u"&&h(d,M+1,null,!0,!0,!1,!0))&&((!Le||be!=="")&&(be+=pn(d,M)),d.dump&&b===d.dump.charCodeAt(0)?be+="-":be+="- ",be+=d.dump)}d.tag=De,d.dump=be||"[]"}function ot(d,M,te){let Le="";const be=d.tag,De=Object.keys(te);for(let Ye=0,Fe=De.length;Ye<Fe;Ye+=1){let Ve="";Le!==""&&(Ve+=", "),d.condenseFlow&&(Ve+='"');const vn=De[Ye];let l=te[vn];d.replacer&&(l=d.replacer.call(te,vn,l)),h(d,M,vn,!1,!1)&&(d.dump.length>1024&&(Ve+="? "),Ve+=d.dump+(d.condenseFlow?'"':"")+":"+(d.condenseFlow?"":" "),h(d,M,l,!1,!1)&&(Ve+=d.dump,Le+=Ve))}d.tag=be,d.dump="{"+Le+"}"}function o(d,M,te,Le){let be="";const De=d.tag,Ye=Object.keys(te);if(d.sortKeys===!0)Ye.sort();else if(typeof d.sortKeys=="function")Ye.sort(d.sortKeys);else if(d.sortKeys)throw new w("sortKeys must be a boolean or a function");for(let Fe=0,Ve=Ye.length;Fe<Ve;Fe+=1){let vn="";(!Le||be!=="")&&(vn+=pn(d,M));const l=Ye[Fe];let s=te[l];if(d.replacer&&(s=d.replacer.call(te,l,s)),!h(d,M+1,l,!0,!0,!0))continue;const _=d.tag!==null&&d.tag!=="?"||d.dump&&d.dump.length>1024;_&&(d.dump&&b===d.dump.charCodeAt(0)?vn+="?":vn+="? "),vn+=d.dump,_&&(vn+=pn(d,M)),h(d,M+1,s,!0,_)&&(d.dump&&b===d.dump.charCodeAt(0)?vn+=":":vn+=": ",vn+=d.dump,be+=vn)}d.tag=De,d.dump=be||"{}"}function fe(d,M,te){const Le=te?d.explicitTypes:d.implicitTypes;for(let be=0,De=Le.length;be<De;be+=1){const Ye=Le[be];if((Ye.instanceOf||Ye.predicate)&&(!Ye.instanceOf||typeof M=="object"&&M instanceof Ye.instanceOf)&&(!Ye.predicate||Ye.predicate(M))){if(te?Ye.multi&&Ye.representName?d.tag=Ye.representName(M):d.tag=Ye.tag:d.tag="?",Ye.represent){const Fe=d.styleMap[Ye.tag]||Ye.defaultStyle;let Ve;if(D.call(Ye.represent)==="[object Function]")Ve=Ye.represent(M,Fe);else if(R.call(Ye.represent,Fe))Ve=Ye.represent[Fe](M,Fe);else throw new w("!<"+Ye.tag+'> tag resolver accepts not "'+Fe+'" style');d.dump=Ve}return!0}}return!1}function h(d,M,te,Le,be,De,Ye){d.tag=null,d.dump=te,fe(d,te,!1)||fe(d,te,!0);const Fe=D.call(d.dump),Ve=Le;Le&&(Le=d.flowLevel<0||d.flowLevel>M);const vn=Fe==="[object Object]"||Fe==="[object Array]";let l,s;if(vn&&(l=d.duplicates.indexOf(te),s=l!==-1),(d.tag!==null&&d.tag!=="?"||s||d.indent!==2&&M>0)&&(be=!1),s&&d.usedDuplicates[l])d.dump="*ref_"+l;else{if(vn&&s&&!d.usedDuplicates[l]&&(d.usedDuplicates[l]=!0),Fe==="[object Object]")Le&&Object.keys(d.dump).length!==0?(o(d,M,d.dump,be),s&&(d.dump="&ref_"+l+d.dump)):(ot(d,M,d.dump),s&&(d.dump="&ref_"+l+" "+d.dump));else if(Fe==="[object Array]")Le&&d.dump.length!==0?(d.noArrayIndent&&!Ye&&M>0?Zn(d,M-1,d.dump,be):Zn(d,M,d.dump,be),s&&(d.dump="&ref_"+l+d.dump)):(Mn(d,M,d.dump),s&&(d.dump="&ref_"+l+" "+d.dump));else if(Fe==="[object String]")d.tag!=="?"&&Ke(d,d.dump,M,De,Ve);else{if(Fe==="[object Undefined]")return!1;if(d.skipInvalid)return!1;throw new w("unacceptable kind of an object to dump "+Fe)}if(d.tag!==null&&d.tag!=="?"){let _=encodeURI(d.tag[0]==="!"?d.tag.slice(1):d.tag).replace(/!/g,"%21");d.tag[0]==="!"?_="!"+_:_.slice(0,18)==="tag:yaml.org,2002:"?_="!!"+_.slice(18):_="!<"+_+">",d.dump=_+" "+d.dump}}return!0}function Y(d,M){const te=[],Le=[];V(d,te,Le);const be=Le.length;for(let De=0;De<be;De+=1)M.duplicates.push(te[Le[De]]);M.usedDuplicates=new Array(be)}function V(d,M,te){if(d!==null&&typeof d=="object"){const Le=M.indexOf(d);if(Le!==-1)te.indexOf(Le)===-1&&te.push(Le);else if(M.push(d),Array.isArray(d))for(let be=0,De=d.length;be<De;be+=1)V(d[be],M,te);else{const be=Object.keys(d);for(let De=0,Ye=be.length;De<Ye;De+=1)V(d[be[De]],M,te)}}}function J(d,M){M=M||{};const te=new xe(M);te.noRefs||Y(d,te);let Le=d;return te.replacer&&(Le=te.replacer.call({"":Le},"",Le)),h(te,0,Le,!0,!0)?te.dump+`
`:""}B.exports.dump=J})),Xc=bp(xt(((a,B)=>{var f=Op(),w=Rp();function v(D,R){return function(){throw new Error("Function yaml."+D+" is removed in js-yaml 4. Use yaml."+R+" instead, which is now safe by default.")}}B.exports.Type=qt(),B.exports.Schema=Oc(),B.exports.FAILSAFE_SCHEMA=Mc(),B.exports.JSON_SCHEMA=Gc(),B.exports.CORE_SCHEMA=Bc(),B.exports.DEFAULT_SCHEMA=es(),B.exports.load=f.load,B.exports.loadAll=f.loadAll,B.exports.dump=w.dump,B.exports.YAMLException=gl(),B.exports.types={binary:jc(),float:Dc(),map:Cc(),null:Uc(),pairs:Kc(),set:Hc(),timestamp:Fc(),bool:Ic(),int:Pc(),merge:Vc(),omap:zc(),seq:Nc(),str:Rc()},B.exports.safeLoad=v("safeLoad","load"),B.exports.safeLoadAll=v("safeLoadAll","loadAll"),B.exports.safeDump=v("safeDump","dump")}))()),{Type:__,Schema:h_,FAILSAFE_SCHEMA:m_,JSON_SCHEMA:g_,CORE_SCHEMA:y_,DEFAULT_SCHEMA:v_,load:x_,loadAll:A_,dump:k_,YAMLException:T_,types:w_,safeLoad:E_,safeLoadAll:L_,safeDump:b_}=Xc.default,Yi=Xc.default;class Np extends Error{constructor(B){super(B),this.name="RuntimeError"}}class ho extends Error{constructor(B){super(B),this.name="LuaError"}}class ha extends Error{constructor(B){super(B),this.name="ValidationError"}}const Cp=`# RFDGameStudio — Horse Racing & Breeding
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
`,Mp=`# RFDGameStudio — Horse Racing & Breeding
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
`,Up=`# systems.yaml — horse_racing
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
`,Ip=`game:
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
`,Pp=`layout:
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
`,Dp=`lua_files:
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
`,Gp=`game:
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
`,Bp=`layout_tree:
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
`,Fp=`game_id: mutant_battle_ball

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
`,Vp=`game:
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
`,jp=`layout_tree:
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
`,zp=`systems:
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
`,Kp=`game:
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
`,Hp=`layout_tree:
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
`,Xp=`engine_version: "1.0"
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
`,Yp=`game:
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
`,Wp=`layout_tree:
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
`,qp=`engine_version: "1.0"
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
`,$p={horse_racing:{data:Cp,ui:Mp,systems:Up},slither_rogue:{data:Ip,ui:Pp,systems:Dp},mutant_battle_ball:{data:Gp,ui:Bp,systems:Fp},slime_coin:{data:Vp,ui:jp,systems:zp},chimera_wilds:{data:Kp,ui:Hp,systems:Xp},scrapcrawl:{data:Yp,ui:Wp,systems:qp}},Qp=Object.assign({"../../../games/chimera_wilds/logic.lua":Zd,"../../../games/horse_racing/logic.lua":Jd,"../../../games/mutant_battle_ball/logic.lua":ep,"../../../games/scrapcrawl/logic.lua":np,"../../../games/slime_coin/logic.lua":tp,"../../../games/slither_rogue/collision.lua":rp,"../../../games/slither_rogue/logic.lua":ap,"../../../games/slither_rogue/physics.lua":lp,"../../../games/slither_rogue/render.lua":op,"../../../games/slither_rogue/state.lua":ip,"../../../games/slither_rogue/utils.lua":sp}),Zp=Object.assign({"../../../engine/primitives/action.lua":up,"../../../engine/primitives/consequence.lua":cp,"../../../engine/primitives/entity.lua":fp,"../../../engine/primitives/lifecycle.lua":dp,"../../../engine/primitives/movement.lua":pp,"../../../engine/primitives/physics.lua":_p,"../../../engine/primitives/resolution.lua":hp,"../../../engine/systems/combat.lua":mp,"../../../engine/systems/genetics.lua":gp,"../../../engine/systems/market.lua":yp,"../../../engine/systems/odds.lua":vp,"../../../engine/ui/resolver.lua":xp});function Jp(a=null,B=null){const f=a??Qp,w=B??Zp;function v(z,b){const K=`../../../games/${z}/${b}`,A=f[K];return A===void 0?(console.warn(`[loader] Lua file not found in bundle: ${K}`),""):A}function D(z,b){const K=`../../../engine/${z}/${b}`,A=w[K];return A===void 0?(console.warn(`[loader] Engine Lua file not found in bundle: ${K}`),""):A}const R=["action.lua","entity.lua","resolution.lua","consequence.lua","movement.lua","physics.lua","lifecycle.lua"];function U(z){const b=[];for(const K of R){const A=D("primitives",K);A&&b.push(A)}for(const K of z??[]){const A=D("systems",`${K}.lua`);A&&b.push(A)}return b.join(`

`)}return function(b){const K=$p[b];if(!K)throw new ha(`Unknown game: ${b}`);const A=Yi.load(K.data),F=Yi.load(K.ui);e_(A,b);const Q=Yi.load(K.systems)??{},ce=Q.lua_files,$=Q.engine_systems,ve=U($??[]);let se;return ce&&ce.length>0?se=ce.map($e=>v(b,$e)).join(`

`):se=v(b,"logic.lua"),{gameId:b,data:A,ui:F,logic:se,engineSource:ve}}}const Yc=Jp(null,null);function e_(a,B){const f=a.game;if(!f)throw new ha("Missing required key: game");if(!f.id)throw new ha("Missing required key: game.id");if(!f.name)throw new ha("Missing required key: game.name");if(!f.version)throw new ha("Missing required key: game.version");if(!f.studio)throw new ha("Missing required key: game.studio");if(f.id!==B)throw new ha(`game.id mismatch: expected "${B}", got "${String(f.id)}"`)}function n_(){return new URLSearchParams(window.location.search).get("game")}function wc(a){const B=window.location.href.split("?")[0];window.location.href=`${B}?game=${a}`}function t_(){window.location.href=window.location.href.split("?")[0]}const r_=new Set(["horse_racing","slither_rogue"]);function Zr(a,B){const f=a[B];return Array.isArray(f)?f.length:f&&typeof f=="object"?Object.keys(f).length:0}function a_(a,B){var w;const f=[];switch(r_.has(a)&&f.push("PyGame renderer"),a){case"horse_racing":f.push(`${Zr(B,"race_classes")} race classes`);break;case"slither_rogue":f.push(`${Zr(B,"evolution_cards")} evolution cards`);break;case"mutant_battle_ball":f.push(`${Zr(B,"parts")} mutant parts`,`${Zr(B,"opponents")} opponents`);break;case"slime_coin":{const v=((w=B.round_config)==null?void 0:w.total_rounds)??0;f.push(`${v} rounds`,`${Zr(B,"chip_cards")} chip cards`);break}case"chimera_wilds":f.push(`${Zr(B,"parts")} mutant parts`,`${Zr(B,"part_slots")} body slots`);break;case"scrapcrawl":{const v=B.catalog;f.push(`${Zr(B,"rooms")} rooms`,`${Object.keys(v??{}).length} craftables`);break}}return f.join(" · ")}function l_(){const a=Da.useMemo(()=>{const B={};for(const f of $i){if(f.externalUrl&&f.embedUrl){B[f.gameId]="Rust/Bevy · itch.io";continue}if(f.embedUrl){B[f.gameId]="React/Tailwind · Standalone";continue}if(f.externalUrl){B[f.gameId]="External link";continue}try{const w=Yc(f.gameId);B[f.gameId]=a_(f.gameId,w.data)}catch{B[f.gameId]="data unavailable"}}return B},[]);return lt.jsxs("div",{className:"arcade-index",children:[lt.jsx("header",{className:"arcade-header",children:lt.jsxs("div",{className:"arcade-marquee",children:[lt.jsx("h1",{className:"arcade-logo",children:"RFD GAME STUDIO"}),lt.jsx("p",{className:"arcade-subtitle",children:"Portable Game Definition Format · Multi-Renderer"})]})}),lt.jsxs("main",{className:"arcade-main",children:[lt.jsx("h2",{className:"arcade-section-title",children:"SELECT A GAME"}),lt.jsx("div",{className:"arcade-grid",children:$i.map(B=>lt.jsx("button",{className:"arcade-card",style:{"--card-color":B.color??"var(--accent)"},onClick:()=>{B.embedUrl?wc(B.gameId):B.externalUrl?window.open(B.externalUrl,"_blank","noopener,noreferrer"):wc(B.gameId)},children:lt.jsxs("div",{className:"arcade-card-frame",children:[lt.jsxs("div",{className:"arcade-card-header",children:[lt.jsx("span",{className:"arcade-card-title",children:B.label}),lt.jsx("span",{className:`arcade-status arcade-status--${B.status??"stable"}`,children:(B.status??"stable").toUpperCase()})]}),lt.jsx("p",{className:"arcade-card-desc",children:B.description??""}),lt.jsx("div",{className:"arcade-card-detail",children:a[B.gameId]}),lt.jsx("div",{className:"arcade-card-id",children:B.gameId})]})},B.gameId))})]}),lt.jsxs("footer",{className:"arcade-footer",children:[lt.jsx("span",{children:"© 2026 RFD IT Services Ltd."}),lt.jsx("span",{className:"arcade-footer-sep",children:"·"}),lt.jsx("span",{children:"Lua + Python + TypeScript"})]})]})}var Wi,Ec;function o_(){return Ec||(Ec=1,Wi=(function(a){var B={};function f(w){if(B[w])return B[w].exports;var v=B[w]={i:w,l:!1,exports:{}};return a[w].call(v.exports,v,v.exports,f),v.l=!0,v.exports}return f.m=a,f.c=B,f.d=function(w,v,D){f.o(w,v)||Object.defineProperty(w,v,{enumerable:!0,get:D})},f.r=function(w){typeof Symbol<"u"&&Symbol.toStringTag&&Object.defineProperty(w,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(w,"__esModule",{value:!0})},f.t=function(w,v){if(1&v&&(w=f(w)),8&v||4&v&&typeof w=="object"&&w&&w.__esModule)return w;var D=Object.create(null);if(f.r(D),Object.defineProperty(D,"default",{enumerable:!0,value:w}),2&v&&typeof w!="string")for(var R in w)f.d(D,R,(function(U){return w[U]}).bind(null,R));return D},f.n=function(w){var v=w&&w.__esModule?function(){return w.default}:function(){return w};return f.d(v,"a",v),v},f.o=function(w,v){return Object.prototype.hasOwnProperty.call(w,v)},f.p="",f(f.s=34)})([function(a,B,f){/**
	@license MIT

	Copyright © 2017-2018 Benoit Giannangeli
	Copyright © 2017-2018 Daurnimator
	Copyright © 1994–2017 Lua.org, PUC-Rio.
	*/const w=f(5);a.exports.FENGARI_AUTHORS=w.FENGARI_AUTHORS,a.exports.FENGARI_COPYRIGHT=w.FENGARI_COPYRIGHT,a.exports.FENGARI_RELEASE=w.FENGARI_RELEASE,a.exports.FENGARI_VERSION=w.FENGARI_VERSION,a.exports.FENGARI_VERSION_MAJOR=w.FENGARI_VERSION_MAJOR,a.exports.FENGARI_VERSION_MINOR=w.FENGARI_VERSION_MINOR,a.exports.FENGARI_VERSION_NUM=w.FENGARI_VERSION_NUM,a.exports.FENGARI_VERSION_RELEASE=w.FENGARI_VERSION_RELEASE,a.exports.luastring_eq=w.luastring_eq,a.exports.luastring_indexOf=w.luastring_indexOf,a.exports.luastring_of=w.luastring_of,a.exports.to_jsstring=w.to_jsstring,a.exports.to_luastring=w.to_luastring,a.exports.to_uristring=w.to_uristring;const v=f(3),D=f(2),R=f(7),U=f(17);a.exports.luaconf=v,a.exports.lua=D,a.exports.lauxlib=R,a.exports.lualib=U},function(a,B,f){let w,v,D;if(w=typeof Uint8Array.from=="function"?Uint8Array.from.bind(Uint8Array):function($){let ve=0,se=$.length,$e=new Uint8Array(se);for(;se>ve;)$e[ve]=$[ve++];return $e},typeof new Uint8Array().indexOf=="function")v=function($,ve,se){return $.indexOf(ve,se)};else{let $=[].indexOf;if($.call(new Uint8Array(1),0)!==0)throw Error("missing .indexOf");v=function(ve,se,$e){return $.call(ve,se,$e)}}D=typeof Uint8Array.of=="function"?Uint8Array.of.bind(Uint8Array):function(){return w(arguments)};const R=function($){return $ instanceof Uint8Array},U="cannot convert invalid utf8 to javascript string",z=";,/?:@&=+$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789,-_.!~*'()#".split("").reduce(function($,ve){return $[ve.charCodeAt(0)]=!0,$},{}),b={},K=function($,ve){if(typeof $!="string")throw new TypeError("to_luastring expects a javascript string");if(ve){let He=b[$];if(R(He))return He}let se=$.length,$e=Array(se),nn=0;for(let He=0;He<se;++He){let Xe=$.charCodeAt(He);if(Xe<=127)$e[nn++]=Xe;else if(Xe<=2047)$e[nn++]=192|Xe>>6,$e[nn++]=128|63&Xe;else{if(Xe>=55296&&Xe<=56319&&He+1<se){let ln=$.charCodeAt(He+1);ln>=56320&&ln<=57343&&(He++,Xe=1024*(Xe-55296)+ln+9216)}Xe<=65535?($e[nn++]=224|Xe>>12,$e[nn++]=128|Xe>>6&63,$e[nn++]=128|63&Xe):($e[nn++]=240|Xe>>18,$e[nn++]=128|Xe>>12&63,$e[nn++]=128|Xe>>6&63,$e[nn++]=128|63&Xe)}}return $e=w($e),ve&&(b[$]=$e),$e};a.exports.luastring_from=w,a.exports.luastring_indexOf=v,a.exports.luastring_of=D,a.exports.is_luastring=R,a.exports.luastring_eq=function($,ve){if($!==ve){let se=$.length;if(se!==ve.length)return!1;for(let $e=0;$e<se;$e++)if($[$e]!==ve[$e])return!1}return!0},a.exports.to_jsstring=function($,ve,se,$e){if(!R($))throw new TypeError("to_jsstring expects a Uint8Array");se=se===void 0?$.length:Math.min($.length,se);let nn="";for(let He=ve!==void 0?ve:0;He<se;){let Xe=$[He++];if(Xe<128)nn+=String.fromCharCode(Xe);else if(Xe<194||Xe>244){if(!$e)throw RangeError(U);nn+="�"}else if(Xe<=223){if(He>=se){if(!$e)throw RangeError(U);nn+="�";continue}let ln=$[He++];if((192&ln)!=128){if(!$e)throw RangeError(U);nn+="�";continue}nn+=String.fromCharCode(((31&Xe)<<6)+(63&ln))}else if(Xe<=239){if(He+1>=se){if(!$e)throw RangeError(U);nn+="�";continue}let ln=$[He++];if((192&ln)!=128){if(!$e)throw RangeError(U);nn+="�";continue}let P=$[He++];if((192&P)!=128){if(!$e)throw RangeError(U);nn+="�";continue}let re=((15&Xe)<<12)+((63&ln)<<6)+(63&P);if(re<=65535)nn+=String.fromCharCode(re);else{let Ae=55296+((re-=65536)>>10),ge=re%1024+56320;nn+=String.fromCharCode(Ae,ge)}}else{if(He+2>=se){if(!$e)throw RangeError(U);nn+="�";continue}let ln=$[He++];if((192&ln)!=128){if(!$e)throw RangeError(U);nn+="�";continue}let P=$[He++];if((192&P)!=128){if(!$e)throw RangeError(U);nn+="�";continue}let re=$[He++];if((192&re)!=128){if(!$e)throw RangeError(U);nn+="�";continue}let Ae=((7&Xe)<<18)+((63&ln)<<12)+((63&P)<<6)+(63&re),ge=55296+((Ae-=65536)>>10),Oe=Ae%1024+56320;nn+=String.fromCharCode(ge,Oe)}}return nn},a.exports.to_uristring=function($){if(!R($))throw new TypeError("to_uristring expects a Uint8Array");let ve="";for(let se=0;se<$.length;se++){let $e=$[se];z[$e]?ve+=String.fromCharCode($e):ve+="%"+($e<16?"0":"")+$e.toString(16)}return ve},a.exports.to_luastring=K,a.exports.from_userstring=function($){if(!R($)){if(typeof $!="string")throw new TypeError("expects an array of bytes or javascript string");$=K($)}return $};const A=K("\x1BLua");a.exports.LUA_SIGNATURE=A,a.exports.LUA_VERSION_MAJOR="5",a.exports.LUA_VERSION_MINOR="3",a.exports.LUA_VERSION_NUM=503,a.exports.LUA_VERSION_RELEASE="4",a.exports.LUA_VERSION="Lua 5.3",a.exports.LUA_RELEASE="Lua 5.3.4",a.exports.LUA_COPYRIGHT="Lua 5.3.4  Copyright (C) 1994-2017 Lua.org, PUC-Rio",a.exports.LUA_AUTHORS="R. Ierusalimschy, L. H. de Figueiredo, W. Celes";const F={LUA_TNONE:-1,LUA_TNIL:0,LUA_TBOOLEAN:1,LUA_TLIGHTUSERDATA:2,LUA_TNUMBER:3,LUA_TSTRING:4,LUA_TTABLE:5,LUA_TFUNCTION:6,LUA_TUSERDATA:7,LUA_TTHREAD:8,LUA_NUMTAGS:9};F.LUA_TSHRSTR=0|F.LUA_TSTRING,F.LUA_TLNGSTR=16|F.LUA_TSTRING,F.LUA_TNUMFLT=0|F.LUA_TNUMBER,F.LUA_TNUMINT=16|F.LUA_TNUMBER,F.LUA_TLCL=0|F.LUA_TFUNCTION,F.LUA_TLCF=16|F.LUA_TFUNCTION,F.LUA_TCCL=32|F.LUA_TFUNCTION;const{LUAI_MAXSTACK:Q}=f(3),ce=-Q-1e3;a.exports.LUA_HOOKCALL=0,a.exports.LUA_HOOKCOUNT=3,a.exports.LUA_HOOKLINE=2,a.exports.LUA_HOOKRET=1,a.exports.LUA_HOOKTAILCALL=4,a.exports.LUA_MASKCALL=1,a.exports.LUA_MASKCOUNT=8,a.exports.LUA_MASKLINE=4,a.exports.LUA_MASKRET=2,a.exports.LUA_MINSTACK=20,a.exports.LUA_MULTRET=-1,a.exports.LUA_OPADD=0,a.exports.LUA_OPBAND=7,a.exports.LUA_OPBNOT=13,a.exports.LUA_OPBOR=8,a.exports.LUA_OPBXOR=9,a.exports.LUA_OPDIV=5,a.exports.LUA_OPEQ=0,a.exports.LUA_OPIDIV=6,a.exports.LUA_OPLE=2,a.exports.LUA_OPLT=1,a.exports.LUA_OPMOD=3,a.exports.LUA_OPMUL=2,a.exports.LUA_OPPOW=4,a.exports.LUA_OPSHL=10,a.exports.LUA_OPSHR=11,a.exports.LUA_OPSUB=1,a.exports.LUA_OPUNM=12,a.exports.LUA_REGISTRYINDEX=ce,a.exports.LUA_RIDX_GLOBALS=2,a.exports.LUA_RIDX_LAST=2,a.exports.LUA_RIDX_MAINTHREAD=1,a.exports.constant_types=F,a.exports.lua_Debug=class{constructor(){this.event=NaN,this.name=null,this.namewhat=null,this.what=null,this.source=null,this.currentline=NaN,this.linedefined=NaN,this.lastlinedefined=NaN,this.nups=NaN,this.nparams=NaN,this.isvararg=NaN,this.istailcall=NaN,this.short_src=null,this.i_ci=null}},a.exports.lua_upvalueindex=function($){return ce-$},a.exports.thread_status={LUA_OK:0,LUA_YIELD:1,LUA_ERRRUN:2,LUA_ERRSYNTAX:3,LUA_ERRMEM:4,LUA_ERRGCMM:5,LUA_ERRERR:6}},function(a,B,f){const w=f(1),v=f(18),D=f(11),R=f(8),U=f(12);a.exports.LUA_AUTHORS=w.LUA_AUTHORS,a.exports.LUA_COPYRIGHT=w.LUA_COPYRIGHT,a.exports.LUA_ERRERR=w.thread_status.LUA_ERRERR,a.exports.LUA_ERRGCMM=w.thread_status.LUA_ERRGCMM,a.exports.LUA_ERRMEM=w.thread_status.LUA_ERRMEM,a.exports.LUA_ERRRUN=w.thread_status.LUA_ERRRUN,a.exports.LUA_ERRSYNTAX=w.thread_status.LUA_ERRSYNTAX,a.exports.LUA_HOOKCALL=w.LUA_HOOKCALL,a.exports.LUA_HOOKCOUNT=w.LUA_HOOKCOUNT,a.exports.LUA_HOOKLINE=w.LUA_HOOKLINE,a.exports.LUA_HOOKRET=w.LUA_HOOKRET,a.exports.LUA_HOOKTAILCALL=w.LUA_HOOKTAILCALL,a.exports.LUA_MASKCALL=w.LUA_MASKCALL,a.exports.LUA_MASKCOUNT=w.LUA_MASKCOUNT,a.exports.LUA_MASKLINE=w.LUA_MASKLINE,a.exports.LUA_MASKRET=w.LUA_MASKRET,a.exports.LUA_MINSTACK=w.LUA_MINSTACK,a.exports.LUA_MULTRET=w.LUA_MULTRET,a.exports.LUA_NUMTAGS=w.constant_types.LUA_NUMTAGS,a.exports.LUA_OK=w.thread_status.LUA_OK,a.exports.LUA_OPADD=w.LUA_OPADD,a.exports.LUA_OPBAND=w.LUA_OPBAND,a.exports.LUA_OPBNOT=w.LUA_OPBNOT,a.exports.LUA_OPBOR=w.LUA_OPBOR,a.exports.LUA_OPBXOR=w.LUA_OPBXOR,a.exports.LUA_OPDIV=w.LUA_OPDIV,a.exports.LUA_OPEQ=w.LUA_OPEQ,a.exports.LUA_OPIDIV=w.LUA_OPIDIV,a.exports.LUA_OPLE=w.LUA_OPLE,a.exports.LUA_OPLT=w.LUA_OPLT,a.exports.LUA_OPMOD=w.LUA_OPMOD,a.exports.LUA_OPMUL=w.LUA_OPMUL,a.exports.LUA_OPPOW=w.LUA_OPPOW,a.exports.LUA_OPSHL=w.LUA_OPSHL,a.exports.LUA_OPSHR=w.LUA_OPSHR,a.exports.LUA_OPSUB=w.LUA_OPSUB,a.exports.LUA_OPUNM=w.LUA_OPUNM,a.exports.LUA_REGISTRYINDEX=w.LUA_REGISTRYINDEX,a.exports.LUA_RELEASE=w.LUA_RELEASE,a.exports.LUA_RIDX_GLOBALS=w.LUA_RIDX_GLOBALS,a.exports.LUA_RIDX_LAST=w.LUA_RIDX_LAST,a.exports.LUA_RIDX_MAINTHREAD=w.LUA_RIDX_MAINTHREAD,a.exports.LUA_SIGNATURE=w.LUA_SIGNATURE,a.exports.LUA_TNONE=w.constant_types.LUA_TNONE,a.exports.LUA_TNIL=w.constant_types.LUA_TNIL,a.exports.LUA_TBOOLEAN=w.constant_types.LUA_TBOOLEAN,a.exports.LUA_TLIGHTUSERDATA=w.constant_types.LUA_TLIGHTUSERDATA,a.exports.LUA_TNUMBER=w.constant_types.LUA_TNUMBER,a.exports.LUA_TSTRING=w.constant_types.LUA_TSTRING,a.exports.LUA_TTABLE=w.constant_types.LUA_TTABLE,a.exports.LUA_TFUNCTION=w.constant_types.LUA_TFUNCTION,a.exports.LUA_TUSERDATA=w.constant_types.LUA_TUSERDATA,a.exports.LUA_TTHREAD=w.constant_types.LUA_TTHREAD,a.exports.LUA_VERSION=w.LUA_VERSION,a.exports.LUA_VERSION_MAJOR=w.LUA_VERSION_MAJOR,a.exports.LUA_VERSION_MINOR=w.LUA_VERSION_MINOR,a.exports.LUA_VERSION_NUM=w.LUA_VERSION_NUM,a.exports.LUA_VERSION_RELEASE=w.LUA_VERSION_RELEASE,a.exports.LUA_YIELD=w.thread_status.LUA_YIELD,a.exports.lua_Debug=w.lua_Debug,a.exports.lua_upvalueindex=w.lua_upvalueindex,a.exports.lua_absindex=v.lua_absindex,a.exports.lua_arith=v.lua_arith,a.exports.lua_atpanic=v.lua_atpanic,a.exports.lua_atnativeerror=v.lua_atnativeerror,a.exports.lua_call=v.lua_call,a.exports.lua_callk=v.lua_callk,a.exports.lua_checkstack=v.lua_checkstack,a.exports.lua_close=U.lua_close,a.exports.lua_compare=v.lua_compare,a.exports.lua_concat=v.lua_concat,a.exports.lua_copy=v.lua_copy,a.exports.lua_createtable=v.lua_createtable,a.exports.lua_dump=v.lua_dump,a.exports.lua_error=v.lua_error,a.exports.lua_gc=v.lua_gc,a.exports.lua_getallocf=v.lua_getallocf,a.exports.lua_getextraspace=v.lua_getextraspace,a.exports.lua_getfield=v.lua_getfield,a.exports.lua_getglobal=v.lua_getglobal,a.exports.lua_gethook=D.lua_gethook,a.exports.lua_gethookcount=D.lua_gethookcount,a.exports.lua_gethookmask=D.lua_gethookmask,a.exports.lua_geti=v.lua_geti,a.exports.lua_getinfo=D.lua_getinfo,a.exports.lua_getlocal=D.lua_getlocal,a.exports.lua_getmetatable=v.lua_getmetatable,a.exports.lua_getstack=D.lua_getstack,a.exports.lua_gettable=v.lua_gettable,a.exports.lua_gettop=v.lua_gettop,a.exports.lua_getupvalue=v.lua_getupvalue,a.exports.lua_getuservalue=v.lua_getuservalue,a.exports.lua_insert=v.lua_insert,a.exports.lua_isboolean=v.lua_isboolean,a.exports.lua_iscfunction=v.lua_iscfunction,a.exports.lua_isfunction=v.lua_isfunction,a.exports.lua_isinteger=v.lua_isinteger,a.exports.lua_islightuserdata=v.lua_islightuserdata,a.exports.lua_isnil=v.lua_isnil,a.exports.lua_isnone=v.lua_isnone,a.exports.lua_isnoneornil=v.lua_isnoneornil,a.exports.lua_isnumber=v.lua_isnumber,a.exports.lua_isproxy=v.lua_isproxy,a.exports.lua_isstring=v.lua_isstring,a.exports.lua_istable=v.lua_istable,a.exports.lua_isthread=v.lua_isthread,a.exports.lua_isuserdata=v.lua_isuserdata,a.exports.lua_isyieldable=R.lua_isyieldable,a.exports.lua_len=v.lua_len,a.exports.lua_load=v.lua_load,a.exports.lua_newstate=U.lua_newstate,a.exports.lua_newtable=v.lua_newtable,a.exports.lua_newthread=U.lua_newthread,a.exports.lua_newuserdata=v.lua_newuserdata,a.exports.lua_next=v.lua_next,a.exports.lua_pcall=v.lua_pcall,a.exports.lua_pcallk=v.lua_pcallk,a.exports.lua_pop=v.lua_pop,a.exports.lua_pushboolean=v.lua_pushboolean,a.exports.lua_pushcclosure=v.lua_pushcclosure,a.exports.lua_pushcfunction=v.lua_pushcfunction,a.exports.lua_pushfstring=v.lua_pushfstring,a.exports.lua_pushglobaltable=v.lua_pushglobaltable,a.exports.lua_pushinteger=v.lua_pushinteger,a.exports.lua_pushjsclosure=v.lua_pushjsclosure,a.exports.lua_pushjsfunction=v.lua_pushjsfunction,a.exports.lua_pushlightuserdata=v.lua_pushlightuserdata,a.exports.lua_pushliteral=v.lua_pushliteral,a.exports.lua_pushlstring=v.lua_pushlstring,a.exports.lua_pushnil=v.lua_pushnil,a.exports.lua_pushnumber=v.lua_pushnumber,a.exports.lua_pushstring=v.lua_pushstring,a.exports.lua_pushthread=v.lua_pushthread,a.exports.lua_pushvalue=v.lua_pushvalue,a.exports.lua_pushvfstring=v.lua_pushvfstring,a.exports.lua_rawequal=v.lua_rawequal,a.exports.lua_rawget=v.lua_rawget,a.exports.lua_rawgeti=v.lua_rawgeti,a.exports.lua_rawgetp=v.lua_rawgetp,a.exports.lua_rawlen=v.lua_rawlen,a.exports.lua_rawset=v.lua_rawset,a.exports.lua_rawseti=v.lua_rawseti,a.exports.lua_rawsetp=v.lua_rawsetp,a.exports.lua_register=v.lua_register,a.exports.lua_remove=v.lua_remove,a.exports.lua_replace=v.lua_replace,a.exports.lua_resume=R.lua_resume,a.exports.lua_rotate=v.lua_rotate,a.exports.lua_setallof=R.lua_setallof,a.exports.lua_setfield=v.lua_setfield,a.exports.lua_setglobal=v.lua_setglobal,a.exports.lua_sethook=D.lua_sethook,a.exports.lua_seti=v.lua_seti,a.exports.lua_setlocal=D.lua_setlocal,a.exports.lua_setmetatable=v.lua_setmetatable,a.exports.lua_settable=v.lua_settable,a.exports.lua_settop=v.lua_settop,a.exports.lua_setupvalue=v.lua_setupvalue,a.exports.lua_setuservalue=v.lua_setuservalue,a.exports.lua_status=v.lua_status,a.exports.lua_stringtonumber=v.lua_stringtonumber,a.exports.lua_toboolean=v.lua_toboolean,a.exports.lua_todataview=v.lua_todataview,a.exports.lua_tointeger=v.lua_tointeger,a.exports.lua_tointegerx=v.lua_tointegerx,a.exports.lua_tojsstring=v.lua_tojsstring,a.exports.lua_tolstring=v.lua_tolstring,a.exports.lua_tonumber=v.lua_tonumber,a.exports.lua_tonumberx=v.lua_tonumberx,a.exports.lua_topointer=v.lua_topointer,a.exports.lua_toproxy=v.lua_toproxy,a.exports.lua_tostring=v.lua_tostring,a.exports.lua_tothread=v.lua_tothread,a.exports.lua_touserdata=v.lua_touserdata,a.exports.lua_type=v.lua_type,a.exports.lua_typename=v.lua_typename,a.exports.lua_upvalueid=v.lua_upvalueid,a.exports.lua_upvaluejoin=v.lua_upvaluejoin,a.exports.lua_version=v.lua_version,a.exports.lua_xmove=v.lua_xmove,a.exports.lua_yield=R.lua_yield,a.exports.lua_yieldk=R.lua_yieldk,a.exports.lua_tocfunction=v.lua_tocfunction},function(a,B,f){const w={},{LUA_VERSION_MAJOR:v,LUA_VERSION_MINOR:D,to_luastring:R}=f(1);a.exports.LUA_PATH_SEP=";",a.exports.LUA_PATH_MARK="?",a.exports.LUA_EXEC_DIR="!";const U=v+"."+D;a.exports.LUA_VDIR=U;{a.exports.LUA_DIRSEP="/";const ce="./lua/"+U+"/";a.exports.LUA_LDIR=ce;const $=ce;a.exports.LUA_JSDIR=$;const ve=R(ce+"?.lua;"+ce+"?/init.lua;./?.lua;./?/init.lua");a.exports.LUA_PATH_DEFAULT=ve;const se=R($+"?.js;"+$+"loadall.js;./?.js");a.exports.LUA_JSPATH_DEFAULT=se}const z=w.LUA_COMPAT_FLOATSTRING||!1,b=w.LUAI_MAXSTACK||1e6,K=w.LUA_IDSIZE||59,A=w.LUAL_BUFFERSIZE||8192,F=function(Q,ce){for(var $=Math.min(3,Math.ceil(Math.abs(ce)/1023)),ve=Q,se=0;se<$;se++)ve*=Math.pow(2,Math.floor((ce+se)/$));return ve};a.exports.LUAI_MAXSTACK=b,a.exports.LUA_COMPAT_FLOATSTRING=z,a.exports.LUA_IDSIZE=K,a.exports.LUA_INTEGER_FMT="%d",a.exports.LUA_INTEGER_FRMLEN="",a.exports.LUA_MAXINTEGER=2147483647,a.exports.LUA_MININTEGER=-2147483648,a.exports.LUA_NUMBER_FMT="%.14g",a.exports.LUA_NUMBER_FRMLEN="",a.exports.LUAL_BUFFERSIZE=A,a.exports.frexp=function(Q){if(Q===0)return[Q,0];var ce=new DataView(new ArrayBuffer(8));ce.setFloat64(0,Q);var $=ce.getUint32(0)>>>20&2047;$===0&&(ce.setFloat64(0,Q*Math.pow(2,64)),$=(ce.getUint32(0)>>>20&2047)-64);var ve=$-1022;return[F(Q,-ve),ve]},a.exports.ldexp=F,a.exports.lua_getlocaledecpoint=function(){return 46},a.exports.lua_integer2str=function(Q){return String(Q)},a.exports.lua_number2str=function(Q){return String(Number(Q.toPrecision(14)))},a.exports.lua_numbertointeger=function(Q){return Q>=-2147483648&&Q<2147483648&&Q},a.exports.luai_apicheck=function(Q,ce){if(!ce)throw Error(ce)}},function(a,B,f){const{luai_apicheck:w}=f(3),v=function(D){if(!D)throw Error("assertion failed")};a.exports.lua_assert=v,a.exports.luai_apicheck=w||function(D,R){return v(R)},a.exports.api_check=function(D,R,U){return w(D,R&&U)},a.exports.LUAI_MAXCCALLS=200,a.exports.LUA_MINBUFFER=32,a.exports.luai_nummod=function(D,R,U){let z=R%U;return z*U<0&&(z+=U),z},a.exports.MAX_INT=2147483647,a.exports.MIN_INT=-2147483648},function(a,B,f){const w=f(1),v=`Fengari 0.1.4  Copyright (C) 2017-2018 B. Giannangeli, Daurnimator
Based on: `+w.LUA_COPYRIGHT;a.exports.FENGARI_AUTHORS="B. Giannangeli, Daurnimator",a.exports.FENGARI_COPYRIGHT=v,a.exports.FENGARI_RELEASE="Fengari 0.1.4",a.exports.FENGARI_VERSION="Fengari 0.1",a.exports.FENGARI_VERSION_MAJOR="0",a.exports.FENGARI_VERSION_MINOR="1",a.exports.FENGARI_VERSION_NUM=1,a.exports.FENGARI_VERSION_RELEASE="4",a.exports.is_luastring=w.is_luastring,a.exports.luastring_eq=w.luastring_eq,a.exports.luastring_from=w.luastring_from,a.exports.luastring_indexOf=w.luastring_indexOf,a.exports.luastring_of=w.luastring_of,a.exports.to_jsstring=w.to_jsstring,a.exports.to_luastring=w.to_luastring,a.exports.to_uristring=w.to_uristring,a.exports.from_userstring=w.from_userstring},function(a,B,f){const{LUA_OPADD:w,LUA_OPBAND:v,LUA_OPBNOT:D,LUA_OPBOR:R,LUA_OPBXOR:U,LUA_OPDIV:z,LUA_OPIDIV:b,LUA_OPMOD:K,LUA_OPMUL:A,LUA_OPPOW:F,LUA_OPSHL:Q,LUA_OPSHR:ce,LUA_OPSUB:$,LUA_OPUNM:ve,constant_types:{LUA_NUMTAGS:se,LUA_TBOOLEAN:$e,LUA_TCCL:nn,LUA_TFUNCTION:He,LUA_TLCF:Xe,LUA_TLCL:ln,LUA_TLIGHTUSERDATA:P,LUA_TLNGSTR:re,LUA_TNIL:Ae,LUA_TNUMBER:ge,LUA_TNUMFLT:Oe,LUA_TNUMINT:tn,LUA_TSHRSTR:an,LUA_TSTRING:sn,LUA_TTABLE:ae,LUA_TTHREAD:oe,LUA_TUSERDATA:ze},from_userstring:C,luastring_indexOf:Ce,luastring_of:E,to_jsstring:g,to_luastring:S}=f(1),{lisdigit:xe,lisprint:Te,lisspace:pn,lisxdigit:Ze}=f(22),fn=f(11),mn=f(8),q=f(12),{luaS_bless:ee,luaS_new:Ue}=f(10),Ee=f(9),{LUA_COMPAT_FLOATSTRING:rn,ldexp:On,lua_integer2str:An,lua_number2str:Je}=f(3),le=f(15),{MAX_INT:Ie,luai_nummod:N,lua_assert:me}=f(4),Ke=f(14),G=se,we=se+1;class Pe{constructor(s,_){this.type=s,this.value=_}ttype(){return 63&this.type}ttnov(){return 15&this.type}checktag(s){return this.type===s}checktype(s){return this.ttnov()===s}ttisnumber(){return this.checktype(ge)}ttisfloat(){return this.checktag(Oe)}ttisinteger(){return this.checktag(tn)}ttisnil(){return this.checktag(Ae)}ttisboolean(){return this.checktag($e)}ttislightuserdata(){return this.checktag(P)}ttisstring(){return this.checktype(sn)}ttisshrstring(){return this.checktag(an)}ttislngstring(){return this.checktag(re)}ttistable(){return this.checktag(ae)}ttisfunction(){return this.checktype(He)}ttisclosure(){return(31&this.type)===He}ttisCclosure(){return this.checktag(nn)}ttisLclosure(){return this.checktag(ln)}ttislcf(){return this.checktag(Xe)}ttisfulluserdata(){return this.checktag(ze)}ttisthread(){return this.checktag(oe)}ttisdeadkey(){return this.checktag(we)}l_isfalse(){return this.ttisnil()||this.ttisboolean()&&this.value===!1}setfltvalue(s){this.type=Oe,this.value=s}chgfltvalue(s){me(this.type==Oe),this.value=s}setivalue(s){this.type=tn,this.value=s}chgivalue(s){me(this.type==tn),this.value=s}setnilvalue(){this.type=Ae,this.value=null}setfvalue(s){this.type=Xe,this.value=s}setpvalue(s){this.type=P,this.value=s}setbvalue(s){this.type=$e,this.value=s}setsvalue(s){this.type=re,this.value=s}setuvalue(s){this.type=ze,this.value=s}setthvalue(s){this.type=oe,this.value=s}setclLvalue(s){this.type=ln,this.value=s}setclCvalue(s){this.type=nn,this.value=s}sethvalue(s){this.type=ae,this.value=s}setdeadvalue(){this.type=we,this.value=null}setfrom(s){this.type=s.type,this.value=s.value}tsvalue(){return me(this.ttisstring()),this.value}svalue(){return this.tsvalue().getstr()}vslen(){return this.tsvalue().tsslen()}jsstring(s,_){return g(this.svalue(),s,_,!0)}}const Nn=function(l,s,_){l.stack[s].setsvalue(_)},In=new Pe(Ae,null);Object.freeze(In),a.exports.luaO_nilobject=In;class Mn{constructor(s,_){this.id=s.l_G.id_counter++,this.p=null,this.nupvalues=_,this.upvals=new Array(_)}}class Zn{constructor(s,_,c){for(this.id=s.l_G.id_counter++,this.f=_,this.nupvalues=c,this.upvalue=new Array(c);c--;)this.upvalue[c]=new Pe(Ae,null)}}class ot{constructor(s,_){this.id=s.l_G.id_counter++,this.metatable=null,this.uservalue=new Pe(Ae,null),this.len=_,this.data=Object.create(null)}}const o=S("..."),fe=S('[string "'),h=S('"]'),Y=function(l){return xe(l)?l-48:(223&l)-55},V=function(l,s){let _=1;if(me(s<=1114111),s<128)l[7]=s;else{let c=63;do l[8-_++]=128|63&s,s>>=6,c>>=1;while(s>c);l[8-_]=~c<<1|s}return _},J=function(l,s){let _=s==="x"?(function(c){let m,O=0,y=0,ne=0,en=0,gn=0,Bn=!1;for(;pn(c[O]);)O++;if(((m=c[O]===45)||c[O]===43)&&O++,c[O]!==48||c[O+1]!==120&&c[O+1]!==88)return null;for(O+=2;;O++)if(c[O]===46){if(Bn)break;Bn=!0}else{if(!Ze(c[O]))break;ne===0&&c[O]===48?en++:++ne<=30?y=16*y+Y(c[O]):gn++,Bn&&gn--}if(en+ne===0)return null;if(gn*=4,c[O]===112||c[O]===80){let Hn,pe=0;if(((Hn=c[++O]===45)||c[O]===43)&&O++,!xe(c[O]))return null;for(;xe(c[O]);)pe=10*pe+c[O++]-48;Hn&&(pe=-pe),gn+=pe}return m&&(y=-y),{n:On(y,gn),i:O}})(l):(function(c){try{c=g(c)}catch{return null}let m=/^[\t\v\f \n\r]*[+-]?(?:[0-9]+\.?[0-9]*|\.[0-9]*)(?:[eE][+-]?[0-9]+)?/.exec(c);if(!m)return null;let O=parseFloat(m[0]);return isNaN(O)?null:{n:O,i:m[0].length}})(l);if(_===null)return null;for(;pn(l[_.i]);)_.i++;return _.i===l.length||l[_.i]===0?_:null},d=[46,120,88,110,78],M={46:".",120:"x",88:"x",110:"n",78:"n"},te=Math.floor(Ie/10),Le=Ie%10,be=function(l,s){let _;if(s.ttisinteger())_=S(An(s.value));else{let c=Je(s.value);!rn&&/^[-0123456789]+$/.test(c)&&(c+=".0"),_=S(c)}s.setsvalue(ee(l,_))},De=function(l,s){mn.luaD_inctop(l),Nn(l,l.top-1,Ue(l,s))},Ye=function(l,s,_){let c,m=0,O=0,y=0;for(;(c=Ce(s,37,O))!=-1;){switch(De(l,s.subarray(O,c)),s[c+1]){case 115:{let ne=_[y++];if(ne===null)ne=S("(null)",!0);else{ne=C(ne);let en=Ce(ne,0);en!==-1&&(ne=ne.subarray(0,en))}De(l,ne);break}case 99:{let ne=_[y++];Te(ne)?De(l,E(ne)):Fe(l,S("<\\%d>",!0),ne);break}case 100:case 73:mn.luaD_inctop(l),l.stack[l.top-1].setivalue(_[y++]),be(l,l.stack[l.top-1]);break;case 102:mn.luaD_inctop(l),l.stack[l.top-1].setfltvalue(_[y++]),be(l,l.stack[l.top-1]);break;case 112:{let ne=_[y++];if(ne instanceof q.lua_State||ne instanceof Ee.Table||ne instanceof ot||ne instanceof Mn||ne instanceof Zn)De(l,S("0x"+ne.id.toString(16)));else switch(typeof ne){case"undefined":De(l,S("undefined"));break;case"number":De(l,S("Number("+ne+")"));break;case"string":De(l,S("String("+JSON.stringify(ne)+")"));break;case"boolean":De(l,S(ne?"Boolean(true)":"Boolean(false)"));break;case"object":if(ne===null){De(l,S("null"));break}case"function":{let en=l.l_G.ids.get(ne);en||(en=l.l_G.id_counter++,l.l_G.ids.set(ne,en)),De(l,S("0x"+en.toString(16)));break}default:De(l,S("<id NYI>"))}break}case 85:{let ne=new Uint8Array(8),en=V(ne,_[y++]);De(l,ne.subarray(8-en));break}case 37:De(l,S("%",!0));break;default:fn.luaG_runerror(l,S("invalid option '%%%c' to 'lua_pushfstring'"),s[c+1])}m+=2,O=c+2}return mn.luaD_checkstack(l,1),De(l,s.subarray(O)),m>0&&le.luaV_concat(l,m+1),l.stack[l.top-1].svalue()},Fe=function(l,s,..._){return Ye(l,s,_)},Ve=function(l,s,_,c){switch(s){case w:return _+c|0;case $:return _-c|0;case A:return le.luaV_imul(_,c);case K:return le.luaV_mod(l,_,c);case b:return le.luaV_div(l,_,c);case v:return _&c;case R:return _|c;case U:return _^c;case Q:return le.luaV_shiftl(_,c);case ce:return le.luaV_shiftl(_,-c);case ve:return 0-_|0;case D:return-1^_;default:me(0)}},vn=function(l,s,_,c){switch(s){case w:return _+c;case $:return _-c;case A:return _*c;case z:return _/c;case F:return Math.pow(_,c);case b:return Math.floor(_/c);case ve:return-_;case K:return N(l,_,c);default:me(0)}};a.exports.CClosure=Zn,a.exports.LClosure=Mn,a.exports.LUA_TDEADKEY=we,a.exports.LUA_TPROTO=G,a.exports.LocVar=class{constructor(){this.varname=null,this.startpc=NaN,this.endpc=NaN}},a.exports.TValue=Pe,a.exports.Udata=ot,a.exports.UTF8BUFFSZ=8,a.exports.luaO_arith=function(l,s,_,c,m){let O=typeof m=="number"?l.stack[m]:m;switch(s){case v:case R:case U:case Q:case ce:case D:{let y,ne;if((y=le.tointeger(_))!==!1&&(ne=le.tointeger(c))!==!1)return void O.setivalue(Ve(l,s,y,ne));break}case z:case F:{let y,ne;if((y=le.tonumber(_))!==!1&&(ne=le.tonumber(c))!==!1)return void O.setfltvalue(vn(l,s,y,ne));break}default:{let y,ne;if(_.ttisinteger()&&c.ttisinteger())return void O.setivalue(Ve(l,s,_.value,c.value));if((y=le.tonumber(_))!==!1&&(ne=le.tonumber(c))!==!1)return void O.setfltvalue(vn(l,s,y,ne));break}}me(l!==null),Ke.luaT_trybinTM(l,_,c,m,s-w+Ke.TMS.TM_ADD)},a.exports.luaO_chunkid=function(l,s){let _,c=l.length;if(l[0]===61)c<s?(_=new Uint8Array(c-1)).set(l.subarray(1)):(_=new Uint8Array(s)).set(l.subarray(1,s+1));else if(l[0]===64)c<=s?(_=new Uint8Array(c-1)).set(l.subarray(1)):((_=new Uint8Array(s)).set(o),s-=o.length,_.set(l.subarray(c-s),o.length));else{_=new Uint8Array(s);let m=Ce(l,10);_.set(fe);let O=fe.length;c<(s-=fe.length+o.length+h.length)&&m===-1?(_.set(l,O),O+=l.length):(m!==-1&&(c=m),c>s&&(c=s),_.set(l.subarray(0,c),O),O+=c,_.set(o,O),O+=o.length),_.set(h,O),O+=h.length,_=_.subarray(0,O)}return _},a.exports.luaO_hexavalue=Y,a.exports.luaO_int2fb=function(l){let s=0;if(l<8)return l;for(;l>=128;)l=l+15>>4,s+=4;for(;l>=16;)l=l+1>>1,s++;return s+1<<3|l-8},a.exports.luaO_pushfstring=Fe,a.exports.luaO_pushvfstring=Ye,a.exports.luaO_str2num=function(l,s){let _=(function(c){let m,O=0,y=0,ne=!0;for(;pn(c[O]);)O++;if(((m=c[O]===45)||c[O]===43)&&O++,c[O]!==48||c[O+1]!==120&&c[O+1]!==88)for(;O<c.length&&xe(c[O]);O++){let en=c[O]-48;if(y>=te&&(y>te||en>Le+m))return null;y=10*y+en|0,ne=!1}else for(O+=2;O<c.length&&Ze(c[O]);O++)y=16*y+Y(c[O])|0,ne=!1;for(;O<c.length&&pn(c[O]);)O++;return ne||O!==c.length&&c[O]!==0?null:{n:0|(m?-y:y),i:O}})(l);return _!==null?(s.setivalue(_.n),_.i+1):(_=(function(c){let m=c.length,O=0;for(let ne=0;ne<m;ne++){let en=c[ne];if(d.indexOf(en)!==-1){O=en;break}}let y=M[O];return y==="n"?null:J(c,y)})(l))!==null?(s.setfltvalue(_.n),_.i+1):0},a.exports.luaO_tostring=be,a.exports.luaO_utf8esc=V,a.exports.numarith=vn,a.exports.pushobj2s=function(l,s){l.stack[l.top++]=new Pe(s.type,s.value)},a.exports.pushsvalue2s=function(l,s){l.stack[l.top++]=new Pe(re,s)},a.exports.setobjs2s=function(l,s,_){l.stack[s].setfrom(l.stack[_])},a.exports.setobj2s=function(l,s,_){l.stack[s].setfrom(_)},a.exports.setsvalue2s=Nn},function(a,B,f){const{LUAL_BUFFERSIZE:w}=f(3),{LUA_ERRERR:v,LUA_MULTRET:D,LUA_REGISTRYINDEX:R,LUA_SIGNATURE:U,LUA_TBOOLEAN:z,LUA_TLIGHTUSERDATA:b,LUA_TNIL:K,LUA_TNONE:A,LUA_TNUMBER:F,LUA_TSTRING:Q,LUA_TTABLE:ce,LUA_VERSION_NUM:$,lua_Debug:ve,lua_absindex:se,lua_atpanic:$e,lua_call:nn,lua_checkstack:He,lua_concat:Xe,lua_copy:ln,lua_createtable:P,lua_error:re,lua_getfield:Ae,lua_getinfo:ge,lua_getmetatable:Oe,lua_getstack:tn,lua_gettop:an,lua_insert:sn,lua_isinteger:ae,lua_isnil:oe,lua_isnumber:ze,lua_isstring:C,lua_istable:Ce,lua_len:E,lua_load:g,lua_newstate:S,lua_newtable:xe,lua_next:Te,lua_pcall:pn,lua_pop:Ze,lua_pushboolean:fn,lua_pushcclosure:mn,lua_pushcfunction:q,lua_pushfstring:ee,lua_pushinteger:Ue,lua_pushliteral:Ee,lua_pushlstring:rn,lua_pushnil:On,lua_pushstring:An,lua_pushvalue:Je,lua_pushvfstring:le,lua_rawequal:Ie,lua_rawget:N,lua_rawgeti:me,lua_rawlen:Ke,lua_rawseti:G,lua_remove:we,lua_setfield:Pe,lua_setglobal:Nn,lua_setmetatable:In,lua_settop:Mn,lua_toboolean:Zn,lua_tointeger:ot,lua_tointegerx:o,lua_tojsstring:fe,lua_tolstring:h,lua_tonumber:Y,lua_tonumberx:V,lua_topointer:J,lua_tostring:d,lua_touserdata:M,lua_type:te,lua_typename:Le,lua_version:be}=f(2),{from_userstring:De,luastring_eq:Ye,to_luastring:Fe,to_uristring:Ve}=f(5),vn=v+1,l=Fe("_LOADED"),s=Fe("_PRELOAD"),_=Fe("FILE*"),c=Fe("__name"),m=Fe("__tostring"),O=new Uint8Array(0);class y{constructor(){this.L=null,this.b=O,this.n=0}}const ne=function(k,j,Ne){if(Ne===0||!Ce(k,-1))return 0;for(On(k);Te(k,-2);){if(te(k,-2)===Q){if(Ie(k,j,-1))return Ze(k,1),1;if(ne(k,j,Ne-1))return we(k,-2),Ee(k,"."),sn(k,-2),Xe(k,3),1}Ze(k,1)}return 0},en=function(k,j){let Ne=an(k);if(ge(k,Fe("f"),j),Ae(k,R,l),ne(k,Ne+1,2)){let kn=d(k,-1);return kn[0]===95&&kn[1]===71&&kn[2]===46&&(An(k,kn.subarray(3)),we(k,-2)),ln(k,-1,Ne+1),Ze(k,2),1}return Mn(k,Ne),0},gn=function(k,j){en(k,j)?(ee(k,Fe("function '%s'"),d(k,-1)),we(k,-2)):j.namewhat.length!==0?ee(k,Fe("%s '%s'"),j.namewhat,j.name):j.what&&j.what[0]===109?Ee(k,"main chunk"):j.what&&j.what[0]===76?ee(k,Fe("function <%s:%d>"),j.short_src,j.linedefined):Ee(k,"?")},Bn=function(k){let j="PANIC: unprotected error in call to Lua API ("+fe(k,-1)+")";throw new Error(j)},Hn=function(k,j,Ne){let kn=new ve;return tn(k,0,kn)?(ge(k,Fe("n"),kn),Ye(kn.namewhat,Fe("method"))&&--j===0?I(k,Fe("calling '%s' on bad self (%s)"),kn.name,Ne):(kn.name===null&&(kn.name=en(k,kn)?d(k,-1):Fe("?")),I(k,Fe("bad argument #%d to '%s' (%s)"),j,kn.name,Ne))):I(k,Fe("bad argument #%d (%s)"),j,Ne)},pe=function(k,j,Ne){let kn;kn=un(k,j,c)===Q?d(k,-1):te(k,j)===b?Fe("light userdata",!0):Pn(k,j);let Wn=ee(k,Fe("%s expected, got %s"),Ne,kn);return Hn(k,j,Wn)},dn=function(k,j){let Ne=new ve;tn(k,j,Ne)&&(ge(k,Fe("Sl",!0),Ne),Ne.currentline>0)?ee(k,Fe("%s:%d: "),Ne.short_src,Ne.currentline):An(k,Fe(""))},I=function(k,j,...Ne){return dn(k,1),le(k,j,Ne),Xe(k,2),re(k)},Me=function(k,j,Ne,kn){if(j)return fn(k,1),1;{let Wn,st;return On(k),kn?(Wn=kn.message,st=-kn.errno):(Wn="Success",st=0),Ne?ee(k,Fe("%s: %s"),Ne,Fe(Wn)):An(k,Fe(Wn)),Ue(k,st),3}},de=function(k,j){return Ae(k,R,j)},yn=function(k,j,Ne){let kn=M(k,j);return kn!==null&&Oe(k,j)?(de(k,Ne),Ie(k,-1,-2)||(kn=null),Ze(k,2),kn):null},Dn=function(k,j,Ne){pe(k,j,Le(k,Ne))},Pn=function(k,j){return Le(k,te(k,j))},Un=function(k,j){let Ne=h(k,j);return Ne!=null||Dn(k,j,Q),Ne},$n=Un,ht=function(k,j,Ne){return te(k,j)<=0?Ne===null?null:De(Ne):Un(k,j)},Fn=ht,Jn=function(k,j){let Ne=V(k,j);return Ne===!1&&Dn(k,j,F),Ne},Vn=function(k,j){let Ne=o(k,j);return Ne===!1&&(function(kn,Wn){ze(kn,Wn)?Hn(kn,Wn,Fe("number has no integer representation",!0)):Dn(kn,Wn,F)})(k,j),Ne},ut=function(k,j){let Ne=k.n+j;if(k.b.length<Ne){let kn=Math.max(2*k.b.length,Ne),Wn=new Uint8Array(kn);Wn.set(k.b),k.b=Wn}return k.b.subarray(k.n,Ne)},it=function(k,j){j.L=k,j.b=O},Ct=function(k,j,Ne){Ne>0&&(j=De(j),ut(k,Ne).set(j.subarray(0,Ne)),wt(k,Ne))},pt=function(k,j){j=De(j),Ct(k,j,j.length)},Dt=function(k){rn(k.L,k.b,k.n),k.n=0,k.b=O},wt=function(k,j){k.n+=j},L=function(k,j,Ne,kn){return te(k,Ne)<=0?kn:j(k,Ne)},ie=function(k,j){let Ne=j.string;return j.string=null,Ne},cn=function(k,j,Ne,kn,Wn){return g(k,ie,{string:j},kn,Wn)},on=function(k,j,Ne,kn){return cn(k,j,0,kn,null)},Tn=function(k,j){return on(k,j,j.length,j)},un=function(k,j,Ne){if(Oe(k,j)){An(k,Ne);let kn=N(k,-2);return kn===K?Ze(k,2):we(k,-2),kn}return K},_n=function(k,j,Ne){return j=se(k,j),un(k,j,Ne)!==K&&(Je(k,j),nn(k,1,1),!0)},We=Fe("%I"),xn=Fe("%f"),Sn=function(k,j,Ne){var kn=Ne>>>0,Wn=j.length,st=k.length+1-Wn;e:for(;kn<st;kn++){for(let Lt=0;Lt<Wn;Lt++)if(k[kn+Lt]!==j[Lt])continue e;return kn}return-1},p=function(k,j,Ne){return Ae(k,j,Ne)===ce||(Ze(k,1),j=se(k,j),xe(k),Je(k,-1),Pe(k,j,Ne),!1)},X=function(k,j,Ne){H(k,Ne,Fe("too many upvalues",!0));for(let kn in j){for(let Wn=0;Wn<Ne;Wn++)Je(k,-Ne);mn(k,j[kn],Ne),Pe(k,-(Ne+2),Fe(kn))}Ze(k,Ne)},H=function(k,j,Ne){He(k,j)||(Ne?I(k,Fe("stack overflow (%s)"),Ne):I(k,Fe("stack overflow",!0)))},ye=function(k,j,Ne,kn){let Wn=kn.message,st=d(k,Ne).subarray(1);return ee(k,Fe("cannot %s %s: %s"),Fe(j),st,Fe(Wn)),we(k,Ne),vn};let he;const _e=[239,187,191],bn=function(k){let j=(function(Ne){let kn;Ne.n=0;let Wn=0;do{if((kn=he(Ne))===null||kn!==_e[Wn])return kn;Wn++,Ne.buff[Ne.n++]=kn}while(Wn<_e.length);return Ne.n=0,he(Ne)})(k);if(j===35){do j=he(k);while(j&&j!==10);return{skipped:!0,c:he(k)}}return{skipped:!1,c:j}};let Gn;{class k{constructor(){this.n=NaN,this.f=null,this.buff=new Uint8Array(1024),this.pos=0,this.err=void 0}}const j=function(Ne,kn){let Wn=kn;if(Wn.f!==null&&Wn.n>0){let Lt=Wn.n;return Wn.n=0,Wn.f=Wn.f.subarray(Wn.pos),Wn.buff.subarray(0,Lt)}let st=Wn.f;return Wn.f=null,st};he=function(Ne){return Ne.pos<Ne.f.length?Ne.f[Ne.pos++]:null},Gn=function(Ne,kn,Wn){let st=new k,Lt=an(Ne)+1;if(kn===null)throw new Error("Can't read stdin in the browser");{ee(Ne,Fe("@%s"),kn);let Mt=Ve(kn),mt=new XMLHttpRequest;if(mt.open("GET",Mt,!1),typeof window>"u"&&(mt.responseType="arraybuffer"),mt.send(),!(mt.status>=200&&mt.status<=299))return st.err=mt.status,ye(Ne,"open",Lt,{message:`${mt.status}: ${mt.statusText}`});typeof mt.response=="string"?st.f=Fe(mt.response):st.f=new Uint8Array(mt.response)}let tr=bn(st);tr.c===U[0]&&kn||tr.skipped&&(st.buff[st.n++]=10),tr.c!==null&&(st.buff[st.n++]=tr.c);let Ft=g(Ne,j,st,d(Ne,-1),Wn),Vt=st.err;return Vt?(Mn(Ne,Lt),ye(Ne,"read",Lt,Vt)):(we(Ne,Lt),Ft)}}const zn=function(k,j){return Gn(k,j,null)},jn=function(k,j,Ne){let kn=be(k);Ne!=72&&I(k,Fe("core and library have incompatible numeric types")),kn!=be(null)?I(k,Fe("multiple Lua VMs detected")):kn!==j&&I(k,Fe("version mismatch: app. needs %f, Lua core provides %f"),j,kn)};a.exports.LUA_ERRFILE=vn,a.exports.LUA_FILEHANDLE=_,a.exports.LUA_LOADED_TABLE=l,a.exports.LUA_NOREF=-2,a.exports.LUA_PRELOAD_TABLE=s,a.exports.LUA_REFNIL=-1,a.exports.luaL_Buffer=y,a.exports.luaL_addchar=function(k,j){ut(k,1),k.b[k.n++]=j},a.exports.luaL_addlstring=Ct,a.exports.luaL_addsize=wt,a.exports.luaL_addstring=pt,a.exports.luaL_addvalue=function(k){let j=k.L,Ne=d(j,-1);Ct(k,Ne,Ne.length),Ze(j,1)},a.exports.luaL_argcheck=function(k,j,Ne,kn){j||Hn(k,Ne,kn)},a.exports.luaL_argerror=Hn,a.exports.luaL_buffinit=it,a.exports.luaL_buffinitsize=function(k,j,Ne){return it(k,j),ut(j,Ne)},a.exports.luaL_callmeta=_n,a.exports.luaL_checkany=function(k,j){te(k,j)===A&&Hn(k,j,Fe("value expected",!0))},a.exports.luaL_checkinteger=Vn,a.exports.luaL_checklstring=Un,a.exports.luaL_checknumber=Jn,a.exports.luaL_checkoption=function(k,j,Ne,kn){let Wn=Ne!==null?Fn(k,j,Ne):$n(k,j);for(let st=0;kn[st];st++)if(Ye(kn[st],Wn))return st;return Hn(k,j,ee(k,Fe("invalid option '%s'"),Wn))},a.exports.luaL_checkstack=H,a.exports.luaL_checkstring=$n,a.exports.luaL_checktype=function(k,j,Ne){te(k,j)!==Ne&&Dn(k,j,Ne)},a.exports.luaL_checkudata=function(k,j,Ne){let kn=yn(k,j,Ne);return kn===null&&pe(k,j,Ne),kn},a.exports.luaL_checkversion=function(k){jn(k,$,72)},a.exports.luaL_checkversion_=jn,a.exports.luaL_dofile=function(k,j){return zn(k,j)||pn(k,0,D,0)},a.exports.luaL_dostring=function(k,j){return Tn(k,j)||pn(k,0,D,0)},a.exports.luaL_error=I,a.exports.luaL_execresult=function(k,j){let Ne,kn;if(j===null)return fn(k,1),Ee(k,"exit"),Ue(k,0),3;if(j.status)Ne="exit",kn=j.status;else{if(!j.signal)return Me(k,0,null,j);Ne="signal",kn=j.signal}return On(k),Ee(k,Ne),Ue(k,kn),3},a.exports.luaL_fileresult=Me,a.exports.luaL_getmetafield=un,a.exports.luaL_getmetatable=de,a.exports.luaL_getsubtable=p,a.exports.luaL_gsub=function(k,j,Ne,kn){let Wn,st=new y;for(it(k,st);(Wn=Sn(j,Ne))>=0;)Ct(st,j,Wn),pt(st,kn),j=j.subarray(Wn+Ne.length);return pt(st,j),Dt(st),d(k,-1)},a.exports.luaL_len=function(k,j){E(k,j);let Ne=o(k,-1);return Ne===!1&&I(k,Fe("object length is not an integer",!0)),Ze(k,1),Ne},a.exports.luaL_loadbuffer=on,a.exports.luaL_loadbufferx=cn,a.exports.luaL_loadfile=zn,a.exports.luaL_loadfilex=Gn,a.exports.luaL_loadstring=Tn,a.exports.luaL_newlib=function(k,j){P(k),X(k,j,0)},a.exports.luaL_newlibtable=function(k){P(k)},a.exports.luaL_newmetatable=function(k,j){return de(k,j)!==K?0:(Ze(k,1),P(k,0,2),An(k,j),Pe(k,-2,c),Je(k,-1),Pe(k,R,j),1)},a.exports.luaL_newstate=function(){let k=S();return k&&$e(k,Bn),k},a.exports.luaL_opt=L,a.exports.luaL_optinteger=function(k,j,Ne){return L(k,Vn,j,Ne)},a.exports.luaL_optlstring=ht,a.exports.luaL_optnumber=function(k,j,Ne){return L(k,Jn,j,Ne)},a.exports.luaL_optstring=Fn,a.exports.luaL_prepbuffer=function(k){return ut(k,w)},a.exports.luaL_prepbuffsize=ut,a.exports.luaL_pushresult=Dt,a.exports.luaL_pushresultsize=function(k,j){wt(k,j),Dt(k)},a.exports.luaL_ref=function(k,j){let Ne;return oe(k,-1)?(Ze(k,1),-1):(j=se(k,j),me(k,j,0),Ne=ot(k,-1),Ze(k,1),Ne!==0?(me(k,j,Ne),G(k,j,0)):Ne=Ke(k,j)+1,G(k,j,Ne),Ne)},a.exports.luaL_requiref=function(k,j,Ne,kn){p(k,R,l),Ae(k,-1,j),Zn(k,-1)||(Ze(k,1),q(k,Ne),An(k,j),nn(k,1,1),Je(k,-1),Pe(k,-3,j)),we(k,-2),kn&&(Je(k,-1),Nn(k,j))},a.exports.luaL_setfuncs=X,a.exports.luaL_setmetatable=function(k,j){de(k,j),In(k,-2)},a.exports.luaL_testudata=yn,a.exports.luaL_tolstring=function(k,j){if(_n(k,j,m))C(k,-1)||I(k,Fe("'__tostring' must return a string"));else switch(te(k,j)){case F:ae(k,j)?ee(k,We,ot(k,j)):ee(k,xn,Y(k,j));break;case Q:Je(k,j);break;case z:Ee(k,Zn(k,j)?"true":"false");break;case K:Ee(k,"nil");break;default:{let Ne=un(k,j,c),kn=Ne===Q?d(k,-1):Pn(k,j);ee(k,Fe("%s: %p"),kn,J(k,j)),Ne!==K&&we(k,-2);break}}return h(k,-1)},a.exports.luaL_traceback=function(k,j,Ne,kn){let Wn=new ve,st=an(k),Lt=(function(Ft){let Vt=new ve,Mt=1,mt=1;for(;tn(Ft,mt,Vt);)Mt=mt,mt*=2;for(;Mt<mt;){let Xt=Math.floor((Mt+mt)/2);tn(Ft,Xt,Vt)?Mt=Xt+1:mt=Xt}return mt-1})(j),tr=Lt-kn>21?10:-1;for(Ne&&ee(k,Fe(`%s
`),Ne),H(k,10,null),Ee(k,"stack traceback:");tn(j,kn++,Wn);)tr--==0?(Ee(k,`
	...`),kn=Lt-11+1):(ge(j,Fe("Slnt",!0),Wn),ee(k,Fe(`
	%s:`),Wn.short_src),Wn.currentline>0&&Ee(k,`${Wn.currentline}:`),Ee(k," in "),gn(k,Wn),Wn.istailcall&&Ee(k,`
	(...tail calls..)`),Xe(k,an(k)-st));Xe(k,an(k)-st)},a.exports.luaL_typename=Pn,a.exports.luaL_unref=function(k,j,Ne){Ne>=0&&(j=se(k,j),me(k,j,0),G(k,j,Ne),Ue(k,Ne),G(k,j,0))},a.exports.luaL_where=dn,a.exports.lua_writestringerror=function(){for(let k=0;k<arguments.length;k++){let j=arguments[k];do{let Ne=/([^\n]*)\n?([\d\D]*)/.exec(j);console.error(Ne[1]),j=Ne[2]}while(j!=="")}}},function(a,B,f){const{LUA_HOOKCALL:w,LUA_HOOKRET:v,LUA_HOOKTAILCALL:D,LUA_MASKCALL:R,LUA_MASKLINE:U,LUA_MASKRET:z,LUA_MINSTACK:b,LUA_MULTRET:K,LUA_SIGNATURE:A,constant_types:{LUA_TCCL:F,LUA_TLCF:Q,LUA_TLCL:ce,LUA_TNIL:$},thread_status:{LUA_ERRMEM:ve,LUA_ERRERR:se,LUA_ERRRUN:$e,LUA_ERRSYNTAX:nn,LUA_OK:He,LUA_YIELD:Xe},lua_Debug:ln,luastring_indexOf:P,to_luastring:re}=f(1),Ae=f(18),ge=f(11),Oe=f(13),{api_check:tn,lua_assert:an,LUAI_MAXCCALLS:sn}=f(4),ae=f(6),oe=f(16),ze=f(23),C=f(12),{luaS_newliteral:Ce}=f(10),E=f(14),{LUAI_MAXSTACK:g}=f(3),S=f(36),xe=f(15),{MBuffer:Te}=f(19),pn=function(h,Y){if(h.top<Y)for(;h.top<Y;)h.stack[h.top++]=new ae.TValue($,null);else for(;h.top>Y;)delete h.stack[--h.top]},Ze=function(h,Y,V){let J=h.top;for(;h.top<V+1;)h.stack[h.top++]=new ae.TValue($,null);switch(Y){case ve:ae.setsvalue2s(h,V,Ce(h,"not enough memory"));break;case se:ae.setsvalue2s(h,V,Ce(h,"error in error handling"));break;default:ae.setobjs2s(h,V,J-1)}for(;h.top>V+1;)delete h.stack[--h.top]},fn=g+200,mn=function(h,Y){an(Y<=g||Y==fn),an(h.stack_last==h.stack.length-C.EXTRA_STACK),h.stack.length=Y,h.stack_last=Y-C.EXTRA_STACK},q=function(h,Y){let V=h.stack.length;if(V>g)me(h,se);else{let J=h.top+Y+C.EXTRA_STACK,d=2*V;d>g&&(d=g),d<J&&(d=J),d>g?(mn(h,fn),ge.luaG_runerror(h,re("stack overflow",!0))):mn(h,d)}},ee=function(h,Y){h.stack_last-h.top<=Y&&q(h,Y)},Ue=function(h){let Y=(function(J){let d=J.top;for(let M=J.ci;M!==null;M=M.previous)d<M.top&&(d=M.top);return an(d<=J.stack_last),d+1})(h),V=Y+Math.floor(Y/8)+2*C.EXTRA_STACK;V>g&&(V=g),h.stack.length>g&&C.luaE_freeCI(h),Y<=g-C.EXTRA_STACK&&V<h.stack.length&&mn(h,V)},Ee=function(h,Y,V){let J=h.stack[Y];switch(J.type){case F:case Q:{let d=J.type===F?J.value.f:J.value;ee(h,b);let M=C.luaE_extendCI(h);M.funcOff=Y,M.nresults=V,M.func=J,M.top=h.top+b,an(M.top<=h.stack_last),M.callstatus=0,h.hookmask&R&&An(h,w,-1);let te=d(h);if(typeof te!="number"||te<0||(0|te)!==te)throw Error("invalid return value from JS function (expected integer)");return Ae.api_checknelems(h,te),rn(h,M,h.top-te,te),!0}case ce:{let d,M=J.value.p,te=h.top-Y-1,Le=M.maxstacksize;if(ee(h,Le),M.is_vararg)d=le(h,M,te);else{for(;te<M.numparams;te++)h.stack[h.top++]=new ae.TValue($,null);d=Y+1}let be=C.luaE_extendCI(h);return be.funcOff=Y,be.nresults=V,be.func=J,be.l_base=d,be.top=d+Le,pn(h,be.top),be.l_code=M.code,be.l_savedpc=0,be.callstatus=C.CIST_LUA,h.hookmask&R&&Je(h,be),!1}default:return ee(h,1),Ie(h,Y,J),Ee(h,Y,V)}},rn=function(h,Y,V,J){let d=Y.nresults;h.hookmask&(z|U)&&(h.hookmask&z&&An(h,v,-1),h.oldpc=Y.previous.l_savedpc);let M=Y.funcOff;return h.ci=Y.previous,h.ci.next=null,On(h,V,M,J,d)},On=function(h,Y,V,J,d){switch(d){case 0:break;case 1:J===0?h.stack[V].setnilvalue():ae.setobjs2s(h,V,Y);break;case K:for(let te=0;te<J;te++)ae.setobjs2s(h,V+te,Y+te);for(let te=h.top;te>=V+J;te--)delete h.stack[te];return h.top=V+J,!1;default:{let te;if(d<=J)for(te=0;te<d;te++)ae.setobjs2s(h,V+te,Y+te);else{for(te=0;te<J;te++)ae.setobjs2s(h,V+te,Y+te);for(;te<d;te++)V+te>=h.top?h.stack[V+te]=new ae.TValue($,null):h.stack[V+te].setnilvalue()}break}}let M=V+d;for(let te=h.top;te>=M;te--)delete h.stack[te];return h.top=M,!0},An=function(h,Y,V){let J=h.hook;if(J&&h.allowhook){let d=h.ci,M=h.top,te=d.top,Le=new ln;Le.event=Y,Le.currentline=V,Le.i_ci=d,ee(h,b),d.top=h.top+b,an(d.top<=h.stack_last),h.allowhook=0,d.callstatus|=C.CIST_HOOKED,J(h,Le),an(!h.allowhook),h.allowhook=1,d.top=te,pn(h,M),d.callstatus&=~C.CIST_HOOKED}},Je=function(h,Y){let V=w;Y.l_savedpc++,Y.previous.callstatus&C.CIST_LUA&&Y.previous.l_code[Y.previous.l_savedpc-1].opcode==oe.OpCodesI.OP_TAILCALL&&(Y.callstatus|=C.CIST_TAIL,V=D),An(h,V,-1),Y.l_savedpc--},le=function(h,Y,V){let J,d=Y.numparams,M=h.top-V,te=h.top;for(J=0;J<d&&J<V;J++)ae.pushobj2s(h,h.stack[M+J]),h.stack[M+J].setnilvalue();for(;J<d;J++)h.stack[h.top++]=new ae.TValue($,null);return te},Ie=function(h,Y,V){let J=E.luaT_gettmbyobj(h,V,E.TMS.TM_CALL);J.ttisfunction(J)||ge.luaG_typeerror(h,V,re("call",!0)),ae.pushobj2s(h,h.stack[h.top-1]);for(let d=h.top-2;d>Y;d--)ae.setobjs2s(h,d,d-1);ae.setobj2s(h,Y,J)},N=function(h,Y,V){++h.nCcalls>=sn&&(function(J){J.nCcalls===sn?ge.luaG_runerror(J,re("JS stack overflow",!0)):J.nCcalls>=sn+(sn>>3)&&me(J,se)})(h),Ee(h,Y,V)||xe.luaV_execute(h),h.nCcalls--},me=function(h,Y){if(h.errorJmp)throw h.errorJmp.status=Y,h.errorJmp;{let V=h.l_G;if(h.status=Y,!V.mainthread.errorJmp){let J=V.panic;throw J&&(Ze(h,Y,h.top),h.ci.top<h.top&&(h.ci.top=h.top),J(h)),new Error(`Aborted ${Y}`)}V.mainthread.stack[V.mainthread.top++]=h.stack[h.top-1],me(V.mainthread,Y)}},Ke=function(h,Y,V){let J=h.nCcalls,d={status:He,previous:h.errorJmp};h.errorJmp=d;try{Y(h,V)}catch(M){if(d.status===He){let te=h.l_G.atnativeerror;if(te)try{if(d.status=He,Ae.lua_pushcfunction(h,te),Ae.lua_pushlightuserdata(h,M),ot(h,h.top-2,1),h.errfunc!==0){let Le=h.errfunc;ae.pushobj2s(h,h.stack[h.top-1]),ae.setobjs2s(h,h.top-2,Le),ot(h,h.top-2,1)}d.status=$e}catch{d.status===He&&(d.status=-1)}else d.status=-1}}return h.errorJmp=d.previous,h.nCcalls=J,d.status},G=function(h,Y){let V=h.ci;an(V.c_k!==null&&h.nny===0),an(V.callstatus&C.CIST_YPCALL||Y===Xe),V.callstatus&C.CIST_YPCALL&&(V.callstatus&=~C.CIST_YPCALL,h.errfunc=V.c_old_errfunc),V.nresults===K&&h.ci.top<h.top&&(h.ci.top=h.top);let J=(0,V.c_k)(h,Y,V.c_ctx);Ae.api_checknelems(h,J),rn(h,V,h.top-J,J)},we=function(h,Y){for(Y!==null&&G(h,Y);h.ci!==h.base_ci;)h.ci.callstatus&C.CIST_LUA?(xe.luaV_finishOp(h),xe.luaV_execute(h)):G(h,Xe)},Pe=function(h,Y){let V=(function(d){for(let M=d.ci;M!==null;M=M.previous)if(M.callstatus&C.CIST_YPCALL)return M;return null})(h);if(V===null)return 0;let J=V.extra;return Oe.luaF_close(h,J),Ze(h,Y,J),h.ci=V,h.allowhook=V.callstatus&C.CIST_OAH,h.nny=0,Ue(h),h.errfunc=V.c_old_errfunc,1},Nn=function(h,Y,V){let J=Ce(h,Y);if(V===0)ae.pushsvalue2s(h,J),tn(h,h.top<=h.ci.top,"stack overflow");else{for(let d=1;d<V;d++)delete h.stack[--h.top];ae.setsvalue2s(h,h.top-1,J)}return $e},In=function(h,Y){let V=h.top-Y,J=h.ci;h.status===He?Ee(h,V-1,K)||xe.luaV_execute(h):(an(h.status===Xe),h.status=He,J.funcOff=J.extra,J.func=h.stack[J.funcOff],J.callstatus&C.CIST_LUA?xe.luaV_execute(h):(J.c_k!==null&&(Y=J.c_k(h,Xe,J.c_ctx),Ae.api_checknelems(h,Y),V=h.top-Y),rn(h,J,V,Y)),we(h,null))},Mn=function(h,Y,V,J){let d=h.ci;return Ae.api_checknelems(h,Y),h.nny>0&&(h!==h.l_G.mainthread?ge.luaG_runerror(h,re("attempt to yield across a JS-call boundary",!0)):ge.luaG_runerror(h,re("attempt to yield from outside a coroutine",!0))),h.status=Xe,d.extra=d.funcOff,d.callstatus&C.CIST_LUA?tn(h,J===null,"hooks cannot continue after yielding"):(d.c_k=J,J!==null&&(d.c_ctx=V),d.funcOff=h.top-Y-1,d.func=h.stack[d.funcOff],me(h,Xe)),an(d.callstatus&C.CIST_HOOKED),0},Zn=function(h,Y,V,J,d){let M=h.ci,te=h.allowhook,Le=h.nny,be=h.errfunc;h.errfunc=d;let De=Ke(h,Y,V);return De!==He&&(Oe.luaF_close(h,J),Ze(h,De,J),h.ci=M,h.allowhook=te,h.nny=Le,Ue(h)),h.errfunc=be,De},ot=function(h,Y,V){h.nny++,N(h,Y,V),h.nny--},o=function(h,Y,V){Y&&P(Y,V[0])===-1&&(ae.luaO_pushfstring(h,re("attempt to load a %s chunk (mode is '%s')"),V,Y),me(h,nn))},fe=function(h,Y){let V,J=Y.z.zgetc();J===A[0]?(o(h,Y.mode,re("binary",!0)),V=S.luaU_undump(h,Y.z,Y.name)):(o(h,Y.mode,re("text",!0)),V=ze.luaY_parser(h,Y.z,Y.buff,Y.dyd,Y.name,J)),an(V.nupvalues===V.p.upvalues.length),Oe.luaF_initupvals(h,V)};a.exports.adjust_top=pn,a.exports.luaD_call=N,a.exports.luaD_callnoyield=ot,a.exports.luaD_checkstack=ee,a.exports.luaD_growstack=q,a.exports.luaD_hook=An,a.exports.luaD_inctop=function(h){ee(h,1),h.stack[h.top++]=new ae.TValue($,null)},a.exports.luaD_pcall=Zn,a.exports.luaD_poscall=rn,a.exports.luaD_precall=Ee,a.exports.luaD_protectedparser=function(h,Y,V,J){let d=new class{constructor(te,Le,be){this.z=te,this.buff=new Te,this.dyd=new ze.Dyndata,this.mode=be,this.name=Le}}(Y,V,J);h.nny++;let M=Zn(h,fe,d,h.top,h.errfunc);return h.nny--,M},a.exports.luaD_rawrunprotected=Ke,a.exports.luaD_reallocstack=mn,a.exports.luaD_throw=me,a.exports.lua_isyieldable=function(h){return h.nny===0},a.exports.lua_resume=function(h,Y,V){let J=h.nny;if(h.status===He){if(h.ci!==h.base_ci)return Nn(h,"cannot resume non-suspended coroutine",V)}else if(h.status!==Xe)return Nn(h,"cannot resume dead coroutine",V);if(h.nCcalls=Y?Y.nCcalls+1:1,h.nCcalls>=sn)return Nn(h,"JS stack overflow",V);h.nny=0,Ae.api_checknelems(h,h.status===He?V+1:V);let d=Ke(h,In,V);if(d===-1)d=$e;else{for(;d>Xe&&Pe(h,d);)d=Ke(h,we,d);d>Xe?(h.status=d,Ze(h,d,h.top),h.ci.top=h.top):an(d===h.status)}return h.nny=J,h.nCcalls--,an(h.nCcalls===(Y?Y.nCcalls:0)),d},a.exports.lua_yield=function(h,Y){Mn(h,Y,0,null)},a.exports.lua_yieldk=Mn},function(a,B,f){const{constant_types:{LUA_TBOOLEAN:w,LUA_TCCL:v,LUA_TLCF:D,LUA_TLCL:R,LUA_TLIGHTUSERDATA:U,LUA_TLNGSTR:z,LUA_TNIL:b,LUA_TNUMFLT:K,LUA_TNUMINT:A,LUA_TSHRSTR:F,LUA_TTABLE:Q,LUA_TTHREAD:ce,LUA_TUSERDATA:$},to_luastring:ve}=f(1),{lua_assert:se}=f(4),$e=f(11),nn=f(6),{luaS_hashlongstr:He,TString:Xe}=f(10),ln=f(12);let P=new WeakMap;const re=function(ae){let oe=P.get(ae);return oe||(oe={},P.set(ae,oe)),oe},Ae=function(ae,oe){switch(oe.type){case b:return $e.luaG_runerror(ae,ve("table index is nil",!0));case K:if(isNaN(oe.value))return $e.luaG_runerror(ae,ve("table index is NaN",!0));case A:case w:case Q:case R:case D:case v:case $:case ce:return oe.value;case F:case z:return He(oe.tsvalue());case U:{let ze=oe.value;switch(typeof ze){case"string":return"*"+ze;case"number":return"#"+ze;case"boolean":return ze?"?true":"?false";case"function":return re(ze);case"object":if(ze instanceof ln.lua_State&&ze.l_G===ae.l_G||ze instanceof ge||ze instanceof nn.Udata||ze instanceof nn.LClosure||ze instanceof nn.CClosure)return re(ze);default:return ze}}default:throw new Error("unknown key type: "+oe.type)}};class ge{constructor(oe){this.id=oe.l_G.id_counter++,this.strong=new Map,this.dead_strong=new Map,this.dead_weak=void 0,this.f=void 0,this.l=void 0,this.metatable=null,this.flags=-1}}const Oe=function(ae,oe,ze,C){ae.dead_strong.clear(),ae.dead_weak=void 0;let Ce=null,E={key:ze,value:C,p:Ce=ae.l,n:void 0};ae.f||(ae.f=E),Ce&&(Ce.n=E),ae.strong.set(oe,E),ae.l=E},tn=function(ae,oe){let ze=ae.strong.get(oe);if(ze){ze.key.setdeadvalue(),ze.value=void 0;let C=ze.n,Ce=ze.p;ze.p=void 0,Ce&&(Ce.n=C),C&&(C.p=Ce),ae.f===ze&&(ae.f=C),ae.l===ze&&(ae.l=Ce),ae.strong.delete(oe),(function(E){return typeof E=="object"?E!==null:typeof E=="function"})(oe)?(ae.dead_weak||(ae.dead_weak=new WeakMap),ae.dead_weak.set(oe,ze)):ae.dead_strong.set(oe,ze)}},an=function(ae,oe){let ze=ae.strong.get(oe);return ze?ze.value:nn.luaO_nilobject},sn=function(ae,oe){return se(typeof oe=="number"&&(0|oe)===oe),an(ae,oe)};a.exports.invalidateTMcache=function(ae){ae.flags=0},a.exports.luaH_get=function(ae,oe,ze){return se(ze instanceof nn.TValue),ze.ttisnil()||ze.ttisfloat()&&isNaN(ze.value)?nn.luaO_nilobject:an(oe,Ae(ae,ze))},a.exports.luaH_getint=sn,a.exports.luaH_getn=function(ae){let oe=0,ze=ae.strong.size+1;for(;ze-oe>1;){let C=Math.floor((oe+ze)/2);sn(ae,C).ttisnil()?ze=C:oe=C}return oe},a.exports.luaH_getstr=function(ae,oe){return se(oe instanceof Xe),an(ae,He(oe))},a.exports.luaH_setfrom=function(ae,oe,ze,C){se(ze instanceof nn.TValue);let Ce=Ae(ae,ze);if(C.ttisnil())return void tn(oe,Ce);let E=oe.strong.get(Ce);if(E)E.value.setfrom(C);else{let g,S=ze.value;g=ze.ttisfloat()&&(0|S)===S?new nn.TValue(A,S):new nn.TValue(ze.type,S);let xe=new nn.TValue(C.type,C.value);Oe(oe,Ce,g,xe)}},a.exports.luaH_setint=function(ae,oe,ze){se(typeof oe=="number"&&(0|oe)===oe&&ze instanceof nn.TValue);let C=oe;if(ze.ttisnil())return void tn(ae,C);let Ce=ae.strong.get(C);if(Ce)Ce.value.setfrom(ze);else{let E=new nn.TValue(A,oe),g=new nn.TValue(ze.type,ze.value);Oe(ae,C,E,g)}},a.exports.luaH_new=function(ae){return new ge(ae)},a.exports.luaH_next=function(ae,oe,ze){let C,Ce=ae.stack[ze];if(Ce.type===b){if(!(C=oe.f))return!1}else{let E=Ae(ae,Ce);if(C=oe.strong.get(E)){if(!(C=C.n))return!1}else{if(!(C=oe.dead_weak&&oe.dead_weak.get(E)||oe.dead_strong.get(E)))return $e.luaG_runerror(ae,ve("invalid key to 'next'"));do if(!(C=C.n))return!1;while(C.key.ttisdeadkey())}}return nn.setobj2s(ae,ze,C.key),nn.setobj2s(ae,ze+1,C.value),!0},a.exports.Table=ge},function(a,B,f){const{is_luastring:w,luastring_eq:v,luastring_from:D,to_luastring:R}=f(1),{lua_assert:U}=f(4);class z{constructor(F,Q){this.hash=null,this.realstring=Q}getstr(){return this.realstring}tsslen(){return this.realstring.length}}const b=function(A){U(w(A));let F=A.length,Q="|";for(let ce=0;ce<F;ce++)Q+=A[ce].toString(16);return Q},K=function(A,F){return U(F instanceof Uint8Array),new z(A,F)};a.exports.luaS_eqlngstr=function(A,F){return U(A instanceof z),U(F instanceof z),A==F||v(A.realstring,F.realstring)},a.exports.luaS_hash=b,a.exports.luaS_hashlongstr=function(A){return U(A instanceof z),A.hash===null&&(A.hash=b(A.getstr())),A.hash},a.exports.luaS_bless=K,a.exports.luaS_new=function(A,F){return K(A,D(F))},a.exports.luaS_newliteral=function(A,F){return K(A,R(F))},a.exports.TString=z},function(a,B,f){const{LUA_HOOKCOUNT:w,LUA_HOOKLINE:v,LUA_MASKCOUNT:D,LUA_MASKLINE:R,constant_types:{LUA_TBOOLEAN:U,LUA_TNIL:z,LUA_TTABLE:b},thread_status:{LUA_ERRRUN:K,LUA_YIELD:A},from_userstring:F,luastring_eq:Q,luastring_indexOf:ce,to_luastring:$}=f(1),{api_check:ve,lua_assert:se}=f(4),{LUA_IDSIZE:$e}=f(3),nn=f(18),He=f(8),Xe=f(13),ln=f(20),P=f(6),re=f(16),Ae=f(12),ge=f(9),Oe=f(14),tn=f(15),an=function(q){return se(q.callstatus&Ae.CIST_LUA),q.l_savedpc-1},sn=function(q){return q.func.value.p.lineinfo.length!==0?q.func.value.p.lineinfo[an(q)]:-1},ae=function(q){if(q.status===A){let ee=q.ci,Ue=ee.funcOff;ee.func=q.stack[ee.extra],ee.funcOff=ee.extra,ee.extra=Ue}},oe=function(q,ee){se(ee<q.upvalues.length);let Ue=q.upvalues[ee].name;return Ue===null?$("?",!0):Ue.getstr()},ze=function(q,ee,Ue){let Ee,rn=null;if(ee.callstatus&Ae.CIST_LUA){if(Ue<0)return(function(On,An){let Je=On.func.value.p.numparams;return An>=On.l_base-On.funcOff-Je?null:{pos:On.funcOff+Je+An,name:$("(*vararg)",!0)}})(ee,-Ue);Ee=ee.l_base,rn=Xe.luaF_getlocalname(ee.func.value.p,Ue,an(ee))}else Ee=ee.funcOff+1;if(rn===null){if(!((ee===q.ci?q.top:ee.next.funcOff)-Ee>=Ue&&Ue>0))return null;rn=$("(*temporary)",!0)}return{pos:Ee+(Ue-1),name:rn}},C=function(q,ee){if(ee===null||ee instanceof P.CClosure)q.source=$("=[JS]",!0),q.linedefined=-1,q.lastlinedefined=-1,q.what=$("J",!0);else{let Ue=ee.p;q.source=Ue.source?Ue.source.getstr():$("=?",!0),q.linedefined=Ue.linedefined,q.lastlinedefined=Ue.lastlinedefined,q.what=q.linedefined===0?$("main",!0):$("Lua",!0)}q.short_src=P.luaO_chunkid(q.source,$e)},Ce=function(q,ee){let Ue={name:null,funcname:null};return ee===null?null:ee.callstatus&Ae.CIST_FIN?(Ue.name=$("__gc",!0),Ue.funcname=$("metamethod",!0),Ue):!(ee.callstatus&Ae.CIST_TAIL)&&ee.previous.callstatus&Ae.CIST_LUA?xe(q,ee.previous):null},E=function(q,ee,Ue){let Ee={name:null,funcname:null};if(re.ISK(Ue)){let rn=q.k[re.INDEXK(Ue)];if(rn.ttisstring())return Ee.name=rn.svalue(),Ee}else{let rn=S(q,ee,Ue);if(rn&&rn.funcname[0]===99)return rn}return Ee.name=$("?",!0),Ee},g=function(q,ee){return q<ee?-1:q},S=function(q,ee,Ue){let Ee={name:Xe.luaF_getlocalname(q,Ue+1,ee),funcname:null};if(Ee.name)return Ee.funcname=$("local",!0),Ee;let rn=(function(An,Je,le){let Ie=-1,N=0,me=re.OpCodesI;for(let Ke=0;Ke<Je;Ke++){let G=An.code[Ke],we=G.A;switch(G.opcode){case me.OP_LOADNIL:{let Pe=G.B;we<=le&&le<=we+Pe&&(Ie=g(Ke,N));break}case me.OP_TFORCALL:le>=we+2&&(Ie=g(Ke,N));break;case me.OP_CALL:case me.OP_TAILCALL:le>=we&&(Ie=g(Ke,N));break;case me.OP_JMP:{let Pe=Ke+1+G.sBx;Ke<Pe&&Pe<=Je&&Pe>N&&(N=Pe);break}default:re.testAMode(G.opcode)&&le===we&&(Ie=g(Ke,N))}}return Ie})(q,ee,Ue),On=re.OpCodesI;if(rn!==-1){let An=q.code[rn];switch(An.opcode){case On.OP_MOVE:{let Je=An.B;if(Je<An.A)return S(q,rn,Je);break}case On.OP_GETTABUP:case On.OP_GETTABLE:{let Je=An.C,le=An.B,Ie=An.opcode===On.OP_GETTABLE?Xe.luaF_getlocalname(q,le+1,rn):oe(q,le);return Ee.name=E(q,rn,Je).name,Ee.funcname=Ie&&Q(Ie,ln.LUA_ENV)?$("global",!0):$("field",!0),Ee}case On.OP_GETUPVAL:return Ee.name=oe(q,An.B),Ee.funcname=$("upvalue",!0),Ee;case On.OP_LOADK:case On.OP_LOADKX:{let Je=An.opcode===On.OP_LOADK?An.Bx:q.code[rn+1].Ax;if(q.k[Je].ttisstring())return Ee.name=q.k[Je].svalue(),Ee.funcname=$("constant",!0),Ee;break}case On.OP_SELF:{let Je=An.C;return Ee.name=E(q,rn,Je).name,Ee.funcname=$("method",!0),Ee}}}return null},xe=function(q,ee){let Ue={name:null,funcname:null},Ee=0,rn=ee.func.value.p,On=an(ee),An=rn.code[On],Je=re.OpCodesI;if(ee.callstatus&Ae.CIST_HOOKED)return Ue.name=$("?",!0),Ue.funcname=$("hook",!0),Ue;switch(An.opcode){case Je.OP_CALL:case Je.OP_TAILCALL:return S(rn,On,An.A);case Je.OP_TFORCALL:return Ue.name=$("for iterator",!0),Ue.funcname=$("for iterator",!0),Ue;case Je.OP_SELF:case Je.OP_GETTABUP:case Je.OP_GETTABLE:Ee=Oe.TMS.TM_INDEX;break;case Je.OP_SETTABUP:case Je.OP_SETTABLE:Ee=Oe.TMS.TM_NEWINDEX;break;case Je.OP_ADD:Ee=Oe.TMS.TM_ADD;break;case Je.OP_SUB:Ee=Oe.TMS.TM_SUB;break;case Je.OP_MUL:Ee=Oe.TMS.TM_MUL;break;case Je.OP_MOD:Ee=Oe.TMS.TM_MOD;break;case Je.OP_POW:Ee=Oe.TMS.TM_POW;break;case Je.OP_DIV:Ee=Oe.TMS.TM_DIV;break;case Je.OP_IDIV:Ee=Oe.TMS.TM_IDIV;break;case Je.OP_BAND:Ee=Oe.TMS.TM_BAND;break;case Je.OP_BOR:Ee=Oe.TMS.TM_BOR;break;case Je.OP_BXOR:Ee=Oe.TMS.TM_BXOR;break;case Je.OP_SHL:Ee=Oe.TMS.TM_SHL;break;case Je.OP_SHR:Ee=Oe.TMS.TM_SHR;break;case Je.OP_UNM:Ee=Oe.TMS.TM_UNM;break;case Je.OP_BNOT:Ee=Oe.TMS.TM_BNOT;break;case Je.OP_LEN:Ee=Oe.TMS.TM_LEN;break;case Je.OP_CONCAT:Ee=Oe.TMS.TM_CONCAT;break;case Je.OP_EQ:Ee=Oe.TMS.TM_EQ;break;case Je.OP_LT:Ee=Oe.TMS.TM_LT;break;case Je.OP_LE:Ee=Oe.TMS.TM_LE;break;default:return null}return Ue.name=q.l_G.tmname[Ee].getstr(),Ue.funcname=$("metamethod",!0),Ue},Te=function(q,ee){let Ue=q.ci,Ee=null;if(Ue.callstatus&Ae.CIST_LUA){Ee=(function(On,An,Je){let le=An.func.value;for(let Ie=0;Ie<le.nupvalues;Ie++)if(le.upvals[Ie]===Je)return{name:oe(le.p,Ie),funcname:$("upvalue",!0)};return null})(0,Ue,ee);let rn=(function(On,An,Je){for(let le=An.l_base;le<An.top;le++)if(On.stack[le]===Je)return le;return!1})(q,Ue,ee);!Ee&&rn&&(Ee=S(Ue.func.value.p,an(Ue),rn-Ue.l_base))}return Ee?P.luaO_pushfstring(q,$(" (%s '%s')",!0),Ee.funcname,Ee.name):$("",!0)},pn=function(q,ee,Ue){let Ee=Oe.luaT_objtypename(q,ee);fn(q,$("attempt to %s a %s value%s",!0),Ue,Ee,Te(q,ee))},Ze=function(q,ee,Ue,Ee){let rn;return rn=Ue?P.luaO_chunkid(Ue.getstr(),$e):$("?",!0),P.luaO_pushfstring(q,$("%s:%d: %s",!0),rn,Ee,ee)},fn=function(q,ee,...Ue){let Ee=q.ci,rn=P.luaO_pushvfstring(q,ee,Ue);Ee.callstatus&Ae.CIST_LUA&&Ze(q,rn,Ee.func.value.p.source,sn(Ee)),mn(q)},mn=function(q){if(q.errfunc!==0){let ee=q.errfunc;P.pushobj2s(q,q.stack[q.top-1]),P.setobjs2s(q,q.top-2,ee),He.luaD_callnoyield(q,q.top-2,1)}He.luaD_throw(q,K)};a.exports.luaG_addinfo=Ze,a.exports.luaG_concaterror=function(q,ee,Ue){(ee.ttisstring()||tn.cvt2str(ee))&&(ee=Ue),pn(q,ee,$("concatenate",!0))},a.exports.luaG_errormsg=mn,a.exports.luaG_opinterror=function(q,ee,Ue,Ee){tn.tonumber(ee)===!1&&(Ue=ee),pn(q,Ue,Ee)},a.exports.luaG_ordererror=function(q,ee,Ue){let Ee=Oe.luaT_objtypename(q,ee),rn=Oe.luaT_objtypename(q,Ue);Q(Ee,rn)?fn(q,$("attempt to compare two %s values",!0),Ee):fn(q,$("attempt to compare %s with %s",!0),Ee,rn)},a.exports.luaG_runerror=fn,a.exports.luaG_tointerror=function(q,ee,Ue){tn.tointeger(ee)===!1&&(Ue=ee),fn(q,$("number%s has no integer representation",!0),Te(q,Ue))},a.exports.luaG_traceexec=function(q){let ee=q.ci,Ue=q.hookmask,Ee=--q.hookcount==0&&Ue&D;if(Ee)q.hookcount=q.basehookcount;else if(!(Ue&R))return;if(ee.callstatus&Ae.CIST_HOOKYIELD)ee.callstatus&=~Ae.CIST_HOOKYIELD;else{if(Ee&&He.luaD_hook(q,w,-1),Ue&R){let rn=ee.func.value.p,On=ee.l_savedpc-1,An=rn.lineinfo.length!==0?rn.lineinfo[On]:-1;(On===0||ee.l_savedpc<=q.oldpc||An!==(rn.lineinfo.length!==0?rn.lineinfo[q.oldpc-1]:-1))&&He.luaD_hook(q,v,An)}q.oldpc=ee.l_savedpc,q.status===A&&(Ee&&(q.hookcount=1),ee.l_savedpc--,ee.callstatus|=Ae.CIST_HOOKYIELD,ee.funcOff=q.top-1,ee.func=q.stack[ee.funcOff],He.luaD_throw(q,A))}},a.exports.luaG_typeerror=pn,a.exports.lua_gethook=function(q){return q.hook},a.exports.lua_gethookcount=function(q){return q.basehookcount},a.exports.lua_gethookmask=function(q){return q.hookmask},a.exports.lua_getinfo=function(q,ee,Ue){let Ee,rn,On,An;return ee=F(ee),ae(q),ee[0]===62?(On=null,An=q.stack[q.top-1],ve(q,An.ttisfunction(),"function expected"),ee=ee.subarray(1),q.top--):(An=(On=Ue.i_ci).func,se(On.func.ttisfunction())),Ee=(function(Je,le,Ie,N,me){let Ke=1;for(;le.length>0;le=le.subarray(1))switch(le[0]){case 83:C(Ie,N);break;case 108:Ie.currentline=me&&me.callstatus&Ae.CIST_LUA?sn(me):-1;break;case 117:Ie.nups=N===null?0:N.nupvalues,N===null||N instanceof P.CClosure?(Ie.isvararg=!0,Ie.nparams=0):(Ie.isvararg=N.p.is_vararg,Ie.nparams=N.p.numparams);break;case 116:Ie.istailcall=me?me.callstatus&Ae.CIST_TAIL:0;break;case 110:{let G=Ce(Je,me);G===null?(Ie.namewhat=$("",!0),Ie.name=null):(Ie.namewhat=G.funcname,Ie.name=G.name);break}case 76:case 102:break;default:Ke=0}return Ke})(q,ee,Ue,rn=An.ttisclosure()?An.value:null,On),ce(ee,102)>=0&&(P.pushobj2s(q,An),ve(q,q.top<=q.ci.top,"stack overflow")),ae(q),ce(ee,76)>=0&&(function(Je,le){if(le===null||le instanceof P.CClosure)Je.stack[Je.top]=new P.TValue(z,null),nn.api_incr_top(Je);else{let Ie=le.p.lineinfo,N=ge.luaH_new(Je);Je.stack[Je.top]=new P.TValue(b,N),nn.api_incr_top(Je);let me=new P.TValue(U,!0);for(let Ke=0;Ke<Ie.length;Ke++)ge.luaH_setint(N,Ie[Ke],me)}})(q,rn),Ee},a.exports.lua_getlocal=function(q,ee,Ue){let Ee;if(ae(q),ee===null)Ee=q.stack[q.top-1].ttisLclosure()?Xe.luaF_getlocalname(q.stack[q.top-1].value.p,Ue,0):null;else{let rn=ze(q,ee.i_ci,Ue);rn?(Ee=rn.name,P.pushobj2s(q,q.stack[rn.pos]),ve(q,q.top<=q.ci.top,"stack overflow")):Ee=null}return ae(q),Ee},a.exports.lua_getstack=function(q,ee,Ue){let Ee,rn;if(ee<0)return 0;for(Ee=q.ci;ee>0&&Ee!==q.base_ci;Ee=Ee.previous)ee--;return ee===0&&Ee!==q.base_ci?(rn=1,Ue.i_ci=Ee):rn=0,rn},a.exports.lua_sethook=function(q,ee,Ue,Ee){ee!==null&&Ue!==0||(Ue=0,ee=null),q.ci.callstatus&Ae.CIST_LUA&&(q.oldpc=q.ci.l_savedpc),q.hook=ee,q.basehookcount=Ee,q.hookcount=q.basehookcount,q.hookmask=Ue},a.exports.lua_setlocal=function(q,ee,Ue){let Ee;ae(q);let rn=ze(q,ee.i_ci,Ue);return rn?(Ee=rn.name,P.setobjs2s(q,rn.pos,q.top-1),delete q.stack[--q.top]):Ee=null,ae(q),Ee}},function(a,B,f){const{LUA_MINSTACK:w,LUA_RIDX_GLOBALS:v,LUA_RIDX_MAINTHREAD:D,constant_types:{LUA_NUMTAGS:R,LUA_TNIL:U,LUA_TTABLE:z,LUA_TTHREAD:b},thread_status:{LUA_OK:K}}=f(1),A=f(6),F=f(8),Q=f(18),ce=f(9),$=f(14),ve=2*w;class se{constructor(){this.func=null,this.funcOff=NaN,this.top=NaN,this.previous=null,this.next=null,this.l_base=NaN,this.l_code=null,this.l_savedpc=NaN,this.c_k=null,this.c_old_errfunc=null,this.c_ctx=null,this.nresults=NaN,this.callstatus=NaN}}class $e{constructor(re){this.id=re.id_counter++,this.base_ci=new se,this.top=NaN,this.stack_last=NaN,this.oldpc=NaN,this.l_G=re,this.stack=null,this.ci=null,this.errorJmp=null,this.nCcalls=0,this.hook=null,this.hookmask=0,this.basehookcount=0,this.allowhook=1,this.hookcount=this.basehookcount,this.nny=1,this.status=K,this.errfunc=0}}const nn=function(P){P.ci.next=null},He=function(P,re){P.stack=new Array(ve),P.top=0,P.stack_last=ve-5;let Ae=P.base_ci;Ae.next=Ae.previous=null,Ae.callstatus=0,Ae.funcOff=P.top,Ae.func=P.stack[P.top],P.stack[P.top++]=new A.TValue(U,null),Ae.top=P.top+w,P.ci=Ae},Xe=function(P){P.ci=P.base_ci,nn(P),P.stack=null},ln=function(P){let re=P.l_G;He(P),(function(Ae,ge){let Oe=ce.luaH_new(Ae);ge.l_registry.sethvalue(Oe),ce.luaH_setint(Oe,D,new A.TValue(b,Ae)),ce.luaH_setint(Oe,v,new A.TValue(z,ce.luaH_new(Ae)))})(P,re),$.luaT_init(P),re.version=Q.lua_version(null)};a.exports.lua_State=$e,a.exports.CallInfo=se,a.exports.CIST_OAH=1,a.exports.CIST_LUA=2,a.exports.CIST_HOOKED=4,a.exports.CIST_FRESH=8,a.exports.CIST_YPCALL=16,a.exports.CIST_TAIL=32,a.exports.CIST_HOOKYIELD=64,a.exports.CIST_LEQ=128,a.exports.CIST_FIN=256,a.exports.EXTRA_STACK=5,a.exports.lua_close=function(P){(function(re){Xe(re)})(P=P.l_G.mainthread)},a.exports.lua_newstate=function(){let P=new class{constructor(){this.id_counter=1,this.ids=new WeakMap,this.mainthread=null,this.l_registry=new A.TValue(U,null),this.panic=null,this.atnativeerror=null,this.version=null,this.tmname=new Array($.TMS.TM_N),this.mt=new Array(R)}},re=new $e(P);return P.mainthread=re,F.luaD_rawrunprotected(re,ln,null)!==K&&(re=null),re},a.exports.lua_newthread=function(P){let re=P.l_G,Ae=new $e(re);return P.stack[P.top]=new A.TValue(b,Ae),Q.api_incr_top(P),Ae.hookmask=P.hookmask,Ae.basehookcount=P.basehookcount,Ae.hook=P.hook,Ae.hookcount=Ae.basehookcount,He(Ae),Ae},a.exports.luaE_extendCI=function(P){let re=new se;return P.ci.next=re,re.previous=P.ci,re.next=null,P.ci=re,re},a.exports.luaE_freeCI=nn,a.exports.luaE_freethread=function(P,re){Xe(re)}},function(a,B,f){const{constant_types:{LUA_TNIL:w}}=f(1),v=f(6);a.exports.MAXUPVAL=255,a.exports.Proto=class{constructor(D){this.id=D.l_G.id_counter++,this.k=[],this.p=[],this.code=[],this.cache=null,this.lineinfo=[],this.upvalues=[],this.numparams=0,this.is_vararg=!1,this.maxstacksize=0,this.locvars=[],this.linedefined=0,this.lastlinedefined=0,this.source=null}},a.exports.luaF_findupval=function(D,R){return D.stack[R]},a.exports.luaF_close=function(D,R){for(let U=R;U<D.top;U++){let z=D.stack[U];D.stack[U]=new v.TValue(z.type,z.value)}},a.exports.luaF_getlocalname=function(D,R,U){for(let z=0;z<D.locvars.length&&D.locvars[z].startpc<=U;z++)if(U<D.locvars[z].endpc&&--R==0)return D.locvars[z].varname.getstr();return null},a.exports.luaF_initupvals=function(D,R){for(let U=0;U<R.nupvalues;U++)R.upvals[U]=new v.TValue(w,null)},a.exports.luaF_newLclosure=function(D,R){return new v.LClosure(D,R)}},function(a,B,f){const{constant_types:{LUA_TTABLE:w,LUA_TUSERDATA:v},to_luastring:D}=f(1),{lua_assert:R}=f(4),U=f(6),z=f(8),b=f(12),{luaS_bless:K,luaS_new:A}=f(10),F=f(9),Q=f(11),ce=f(15),$=["no value","nil","boolean","userdata","number","string","table","function","userdata","thread","proto"].map(P=>D(P)),ve=function(P){return $[P+1]},se={TM_INDEX:0,TM_NEWINDEX:1,TM_GC:2,TM_MODE:3,TM_LEN:4,TM_EQ:5,TM_ADD:6,TM_SUB:7,TM_MUL:8,TM_MOD:9,TM_POW:10,TM_DIV:11,TM_IDIV:12,TM_BAND:13,TM_BOR:14,TM_BXOR:15,TM_SHL:16,TM_SHR:17,TM_UNM:18,TM_BNOT:19,TM_LT:20,TM_LE:21,TM_CONCAT:22,TM_CALL:23,TM_N:24},$e=D("__name",!0),nn=function(P,re,Ae,ge,Oe,tn){let an=P.top;if(U.pushobj2s(P,re),U.pushobj2s(P,Ae),U.pushobj2s(P,ge),tn||U.pushobj2s(P,Oe),P.ci.callstatus&b.CIST_LUA?z.luaD_call(P,an,tn):z.luaD_callnoyield(P,an,tn),tn){let sn=P.stack[P.top-1];delete P.stack[--P.top],Oe.setfrom(sn)}},He=function(P,re,Ae,ge,Oe){let tn=ln(P,re,Oe);return tn.ttisnil()&&(tn=ln(P,Ae,Oe)),!tn.ttisnil()&&(nn(P,tn,re,Ae,ge,1),!0)},Xe=function(P,re,Ae){const ge=F.luaH_getstr(P,Ae);return R(re<=se.TM_EQ),ge.ttisnil()?(P.flags|=1<<re,null):ge},ln=function(P,re,Ae){let ge;switch(re.ttnov()){case w:case v:ge=re.value.metatable;break;default:ge=P.l_G.mt[re.ttnov()]}return ge?F.luaH_getstr(ge,P.l_G.tmname[Ae]):U.luaO_nilobject};a.exports.fasttm=function(P,re,Ae){return re===null||re.flags&1<<Ae?null:Xe(re,Ae,P.l_G.tmname[Ae])},a.exports.TMS=se,a.exports.luaT_callTM=nn,a.exports.luaT_callbinTM=He,a.exports.luaT_trybinTM=function(P,re,Ae,ge,Oe){if(!He(P,re,Ae,ge,Oe))switch(Oe){case se.TM_CONCAT:return Q.luaG_concaterror(P,re,Ae);case se.TM_BAND:case se.TM_BOR:case se.TM_BXOR:case se.TM_SHL:case se.TM_SHR:case se.TM_BNOT:{let tn=ce.tonumber(re),an=ce.tonumber(Ae);return tn!==!1&&an!==!1?Q.luaG_tointerror(P,re,Ae):Q.luaG_opinterror(P,re,Ae,D("perform bitwise operation on",!0))}default:return Q.luaG_opinterror(P,re,Ae,D("perform arithmetic on",!0))}},a.exports.luaT_callorderTM=function(P,re,Ae,ge){let Oe=new U.TValue;return He(P,re,Ae,Oe,ge)?!Oe.l_isfalse():null},a.exports.luaT_gettm=Xe,a.exports.luaT_gettmbyobj=ln,a.exports.luaT_init=function(P){P.l_G.tmname[se.TM_INDEX]=new A(P,D("__index",!0)),P.l_G.tmname[se.TM_NEWINDEX]=new A(P,D("__newindex",!0)),P.l_G.tmname[se.TM_GC]=new A(P,D("__gc",!0)),P.l_G.tmname[se.TM_MODE]=new A(P,D("__mode",!0)),P.l_G.tmname[se.TM_LEN]=new A(P,D("__len",!0)),P.l_G.tmname[se.TM_EQ]=new A(P,D("__eq",!0)),P.l_G.tmname[se.TM_ADD]=new A(P,D("__add",!0)),P.l_G.tmname[se.TM_SUB]=new A(P,D("__sub",!0)),P.l_G.tmname[se.TM_MUL]=new A(P,D("__mul",!0)),P.l_G.tmname[se.TM_MOD]=new A(P,D("__mod",!0)),P.l_G.tmname[se.TM_POW]=new A(P,D("__pow",!0)),P.l_G.tmname[se.TM_DIV]=new A(P,D("__div",!0)),P.l_G.tmname[se.TM_IDIV]=new A(P,D("__idiv",!0)),P.l_G.tmname[se.TM_BAND]=new A(P,D("__band",!0)),P.l_G.tmname[se.TM_BOR]=new A(P,D("__bor",!0)),P.l_G.tmname[se.TM_BXOR]=new A(P,D("__bxor",!0)),P.l_G.tmname[se.TM_SHL]=new A(P,D("__shl",!0)),P.l_G.tmname[se.TM_SHR]=new A(P,D("__shr",!0)),P.l_G.tmname[se.TM_UNM]=new A(P,D("__unm",!0)),P.l_G.tmname[se.TM_BNOT]=new A(P,D("__bnot",!0)),P.l_G.tmname[se.TM_LT]=new A(P,D("__lt",!0)),P.l_G.tmname[se.TM_LE]=new A(P,D("__le",!0)),P.l_G.tmname[se.TM_CONCAT]=new A(P,D("__concat",!0)),P.l_G.tmname[se.TM_CALL]=new A(P,D("__call",!0))},a.exports.luaT_objtypename=function(P,re){let Ae;if(re.ttistable()&&(Ae=re.value.metatable)!==null||re.ttisfulluserdata()&&(Ae=re.value.metatable)!==null){let ge=F.luaH_getstr(Ae,K(P,$e));if(ge.ttisstring())return ge.svalue()}return ve(re.ttnov())},a.exports.ttypename=ve},function(a,B,f){const{LUA_MASKLINE:w,LUA_MASKCOUNT:v,LUA_MULTRET:D,constant_types:{LUA_TBOOLEAN:R,LUA_TLCF:U,LUA_TLIGHTUSERDATA:z,LUA_TLNGSTR:b,LUA_TNIL:K,LUA_TNUMBER:A,LUA_TNUMFLT:F,LUA_TNUMINT:Q,LUA_TSHRSTR:ce,LUA_TTABLE:$,LUA_TUSERDATA:ve},to_luastring:se}=f(1),{INDEXK:$e,ISK:nn,LFIELDS_PER_FLUSH:He,OpCodesI:{OP_ADD:Xe,OP_BAND:ln,OP_BNOT:P,OP_BOR:re,OP_BXOR:Ae,OP_CALL:ge,OP_CLOSURE:Oe,OP_CONCAT:tn,OP_DIV:an,OP_EQ:sn,OP_EXTRAARG:ae,OP_FORLOOP:oe,OP_FORPREP:ze,OP_GETTABLE:C,OP_GETTABUP:Ce,OP_GETUPVAL:E,OP_IDIV:g,OP_JMP:S,OP_LE:xe,OP_LEN:Te,OP_LOADBOOL:pn,OP_LOADK:Ze,OP_LOADKX:fn,OP_LOADNIL:mn,OP_LT:q,OP_MOD:ee,OP_MOVE:Ue,OP_MUL:Ee,OP_NEWTABLE:rn,OP_NOT:On,OP_POW:An,OP_RETURN:Je,OP_SELF:le,OP_SETLIST:Ie,OP_SETTABLE:N,OP_SETTABUP:me,OP_SETUPVAL:Ke,OP_SHL:G,OP_SHR:we,OP_SUB:Pe,OP_TAILCALL:Nn,OP_TEST:In,OP_TESTSET:Mn,OP_TFORCALL:Zn,OP_TFORLOOP:ot,OP_UNM:o,OP_VARARG:fe}}=f(16),{LUA_MAXINTEGER:h,LUA_MININTEGER:Y,lua_numbertointeger:V}=f(3),{lua_assert:J,luai_nummod:d}=f(4),M=f(6),te=f(13),Le=f(12),{luaS_bless:be,luaS_eqlngstr:De,luaS_hashlongstr:Ye}=f(10),Fe=f(8),Ve=f(14),vn=f(9),l=f(11),s=function(L,ie,cn){return ie+cn.A},_=function(L,ie,cn){return ie+cn.B},c=function(L,ie,cn,on){return nn(on.B)?cn[$e(on.B)]:L.stack[ie+on.B]},m=function(L,ie,cn,on){return nn(on.C)?cn[$e(on.C)]:L.stack[ie+on.C]},O=function(L,ie,cn,on){let Tn=cn.A;Tn!==0&&te.luaF_close(L,ie.l_base+Tn-1),ie.l_savedpc+=cn.sBx+on},y=function(L,ie){O(L,ie,ie.l_code[ie.l_savedpc],1)},ne=function(L,ie,cn){if(ie.ttisnumber()&&cn.ttisnumber())return I(ie,cn)?1:0;if(ie.ttisstring()&&cn.ttisstring())return de(ie.tsvalue(),cn.tsvalue())<0?1:0;{let on=Ve.luaT_callorderTM(L,ie,cn,Ve.TMS.TM_LT);return on===null&&l.luaG_ordererror(L,ie,cn),on?1:0}},en=function(L,ie,cn){let on;return ie.ttisnumber()&&cn.ttisnumber()?Me(ie,cn)?1:0:ie.ttisstring()&&cn.ttisstring()?de(ie.tsvalue(),cn.tsvalue())<=0?1:0:(on=Ve.luaT_callorderTM(L,ie,cn,Ve.TMS.TM_LE))!==null?on?1:0:(L.ci.callstatus|=Le.CIST_LEQ,on=Ve.luaT_callorderTM(L,cn,ie,Ve.TMS.TM_LT),L.ci.callstatus^=Le.CIST_LEQ,on===null&&l.luaG_ordererror(L,ie,cn),on?0:1)},gn=function(L,ie,cn){if(ie.ttype()!==cn.ttype())return ie.ttnov()!==cn.ttnov()||ie.ttnov()!==A?0:ie.value===cn.value?1:0;let on;switch(ie.ttype()){case K:return 1;case R:return ie.value==cn.value?1:0;case z:case Q:case F:case U:return ie.value===cn.value?1:0;case ce:case b:return De(ie.tsvalue(),cn.tsvalue())?1:0;case ve:case $:if(ie.value===cn.value)return 1;if(L===null)return 0;(on=Ve.fasttm(L,ie.value.metatable,Ve.TMS.TM_EQ))===null&&(on=Ve.fasttm(L,cn.value.metatable,Ve.TMS.TM_EQ));break;default:return ie.value===cn.value?1:0}if(on===null)return 0;let Tn=new M.TValue;return Ve.luaT_callTM(L,on,ie,cn,Tn,1),Tn.l_isfalse()?0:1},Bn=function(L,ie){let cn=!1,on=Hn(L,ie<0?2:1);if(on===!1){let Tn=dn(L);if(Tn===!1)return!1;0<Tn?(on=h,ie<0&&(cn=!0)):(on=Y,ie>=0&&(cn=!0))}return{stopnow:cn,ilimit:on}},Hn=function(L,ie){if(L.ttisfloat()){let cn=L.value,on=Math.floor(cn);if(cn!==on){if(ie===0)return!1;ie>1&&(on+=1)}return V(on)}if(L.ttisinteger())return L.value;if(Vn(L)){let cn=new M.TValue;if(M.luaO_str2num(L.svalue(),cn)===L.vslen()+1)return Hn(cn,ie)}return!1},pe=function(L){return L.ttisinteger()?L.value:Hn(L,0)},dn=function(L){if(L.ttnov()===A)return L.value;if(Vn(L)){let ie=new M.TValue;if(M.luaO_str2num(L.svalue(),ie)===L.vslen()+1)return ie.value}return!1},I=function(L,ie){return L.value<ie.value},Me=function(L,ie){return L.value<=ie.value},de=function(L,ie){let cn=Ye(L),on=Ye(ie);return cn===on?0:cn<on?-1:1},yn=function(L,ie,cn){let on;switch(cn.ttype()){case $:{let Tn=cn.value;if((on=Ve.fasttm(L,Tn.metatable,Ve.TMS.TM_LEN))!==null)break;return void ie.setivalue(vn.luaH_getn(Tn))}case ce:case b:return void ie.setivalue(cn.vslen());default:(on=Ve.luaT_gettmbyobj(L,cn,Ve.TMS.TM_LEN)).ttisnil()&&l.luaG_typeerror(L,cn,se("get length of",!0))}Ve.luaT_callTM(L,on,cn,cn,ie,1)},Dn=Math.imul||function(L,ie){let cn=65535&L,on=65535&ie;return cn*on+((L>>>16&65535)*on+cn*(ie>>>16&65535)<<16>>>0)|0},Pn=function(L,ie,cn){return cn===0&&l.luaG_runerror(L,se("attempt to divide by zero")),0|Math.floor(ie/cn)},Un=function(L,ie,cn){return cn===0&&l.luaG_runerror(L,se("attempt to perform 'n%%0'")),ie-Math.floor(ie/cn)*cn|0},$n=function(L,ie){return ie<0?ie<=-32?0:L>>>-ie:ie>=32?0:L<<ie},ht=function(L,ie,cn,on){let Tn=L.cache;if(Tn!==null){let un=L.upvalues,_n=un.length;for(let We=0;We<_n;We++){let xn=un[We].instack?cn[on+un[We].idx]:ie[un[We].idx];if(Tn.upvals[We]!==xn)return null}}return Tn},Fn=function(L,ie,cn,on,Tn){let un=ie.upvalues.length,_n=ie.upvalues,We=new M.LClosure(L,un);We.p=ie,L.stack[Tn].setclLvalue(We);for(let xn=0;xn<un;xn++)_n[xn].instack?We.upvals[xn]=te.luaF_findupval(L,on+_n[xn].idx):We.upvals[xn]=cn[_n[xn].idx];ie.cache=We},Jn=function(L){return L.ttisnumber()},Vn=function(L){return L.ttisstring()},ut=function(L,ie){let cn=L.stack[ie];return!!cn.ttisstring()||!!Jn(cn)&&(M.luaO_tostring(L,cn),!0)},it=function(L){return L.ttisstring()&&L.vslen()===0},Ct=function(L,ie,cn,on){let Tn=0;do{let un=L.stack[ie-cn],_n=un.vslen(),We=un.svalue();on.set(We,Tn),Tn+=_n}while(--cn>0)},pt=function(L,ie){J(ie>=2);do{let cn=L.top,on=2;if((L.stack[cn-2].ttisstring()||Jn(L.stack[cn-2]))&&ut(L,cn-1))if(it(L.stack[cn-1]))ut(L,cn-2);else if(it(L.stack[cn-2]))M.setobjs2s(L,cn-2,cn-1);else{let Tn=L.stack[cn-1].vslen();for(on=1;on<ie&&ut(L,cn-on-1);on++)Tn+=L.stack[cn-on-1].vslen();let un=new Uint8Array(Tn);Ct(L,cn,on,un);let _n=be(L,un);M.setsvalue2s(L,cn-on,_n)}else Ve.luaT_trybinTM(L,L.stack[cn-2],L.stack[cn-1],L.stack[cn-2],Ve.TMS.TM_CONCAT);for(ie-=on-1;L.top>cn-(on-1);)delete L.stack[--L.top]}while(ie>1)},Dt=function(L,ie,cn,on){for(let Tn=0;Tn<2e3;Tn++){let un;if(ie.ttistable()){let _n=vn.luaH_get(L,ie.value,cn);if(!_n.ttisnil())return void M.setobj2s(L,on,_n);if((un=Ve.fasttm(L,ie.value.metatable,Ve.TMS.TM_INDEX))===null)return void L.stack[on].setnilvalue()}else(un=Ve.luaT_gettmbyobj(L,ie,Ve.TMS.TM_INDEX)).ttisnil()&&l.luaG_typeerror(L,ie,se("index",!0));if(un.ttisfunction())return void Ve.luaT_callTM(L,un,ie,cn,L.stack[on],1);ie=un}l.luaG_runerror(L,se("'__index' chain too long; possible loop",!0))},wt=function(L,ie,cn,on){for(let Tn=0;Tn<2e3;Tn++){let un;if(ie.ttistable()){let _n=ie.value;if(!vn.luaH_get(L,_n,cn).ttisnil()||(un=Ve.fasttm(L,_n.metatable,Ve.TMS.TM_NEWINDEX))===null)return vn.luaH_setfrom(L,_n,cn,on),void vn.invalidateTMcache(_n)}else(un=Ve.luaT_gettmbyobj(L,ie,Ve.TMS.TM_NEWINDEX)).ttisnil()&&l.luaG_typeerror(L,ie,se("index",!0));if(un.ttisfunction())return void Ve.luaT_callTM(L,un,ie,cn,on,0);ie=un}l.luaG_runerror(L,se("'__newindex' chain too long; possible loop",!0))};a.exports.cvt2str=Jn,a.exports.cvt2num=Vn,a.exports.luaV_gettable=Dt,a.exports.luaV_concat=pt,a.exports.luaV_div=Pn,a.exports.luaV_equalobj=gn,a.exports.luaV_execute=function(L){let ie=L.ci;ie.callstatus|=Le.CIST_FRESH;e:for(;;){J(ie===L.ci);let cn=ie.func.value,on=cn.p.k,Tn=ie.l_base,un=ie.l_code[ie.l_savedpc++];L.hookmask&(w|v)&&l.luaG_traceexec(L);let _n=s(0,Tn,un);switch(un.opcode){case Ue:M.setobjs2s(L,_n,_(0,Tn,un));break;case Ze:{let We=on[un.Bx];M.setobj2s(L,_n,We);break}case fn:{J(ie.l_code[ie.l_savedpc].opcode===ae);let We=on[ie.l_code[ie.l_savedpc++].Ax];M.setobj2s(L,_n,We);break}case pn:L.stack[_n].setbvalue(un.B!==0),un.C!==0&&ie.l_savedpc++;break;case mn:for(let We=0;We<=un.B;We++)L.stack[_n+We].setnilvalue();break;case E:{let We=un.B;M.setobj2s(L,_n,cn.upvals[We]);break}case Ce:{let We=cn.upvals[un.B],xn=m(L,Tn,on,un);Dt(L,We,xn,_n);break}case C:{let We=L.stack[_(0,Tn,un)],xn=m(L,Tn,on,un);Dt(L,We,xn,_n);break}case me:{let We=cn.upvals[un.A],xn=c(L,Tn,on,un),Sn=m(L,Tn,on,un);wt(L,We,xn,Sn);break}case Ke:cn.upvals[un.B].setfrom(L.stack[_n]);break;case N:{let We=L.stack[_n],xn=c(L,Tn,on,un),Sn=m(L,Tn,on,un);wt(L,We,xn,Sn);break}case rn:L.stack[_n].sethvalue(vn.luaH_new(L));break;case le:{let We=_(0,Tn,un),xn=m(L,Tn,on,un);M.setobjs2s(L,_n+1,We),Dt(L,L.stack[We],xn,_n);break}case Xe:{let We,xn,Sn=c(L,Tn,on,un),p=m(L,Tn,on,un);Sn.ttisinteger()&&p.ttisinteger()?L.stack[_n].setivalue(Sn.value+p.value|0):(We=dn(Sn))!==!1&&(xn=dn(p))!==!1?L.stack[_n].setfltvalue(We+xn):Ve.luaT_trybinTM(L,Sn,p,L.stack[_n],Ve.TMS.TM_ADD);break}case Pe:{let We,xn,Sn=c(L,Tn,on,un),p=m(L,Tn,on,un);Sn.ttisinteger()&&p.ttisinteger()?L.stack[_n].setivalue(Sn.value-p.value|0):(We=dn(Sn))!==!1&&(xn=dn(p))!==!1?L.stack[_n].setfltvalue(We-xn):Ve.luaT_trybinTM(L,Sn,p,L.stack[_n],Ve.TMS.TM_SUB);break}case Ee:{let We,xn,Sn=c(L,Tn,on,un),p=m(L,Tn,on,un);Sn.ttisinteger()&&p.ttisinteger()?L.stack[_n].setivalue(Dn(Sn.value,p.value)):(We=dn(Sn))!==!1&&(xn=dn(p))!==!1?L.stack[_n].setfltvalue(We*xn):Ve.luaT_trybinTM(L,Sn,p,L.stack[_n],Ve.TMS.TM_MUL);break}case ee:{let We,xn,Sn=c(L,Tn,on,un),p=m(L,Tn,on,un);Sn.ttisinteger()&&p.ttisinteger()?L.stack[_n].setivalue(Un(L,Sn.value,p.value)):(We=dn(Sn))!==!1&&(xn=dn(p))!==!1?L.stack[_n].setfltvalue(d(L,We,xn)):Ve.luaT_trybinTM(L,Sn,p,L.stack[_n],Ve.TMS.TM_MOD);break}case An:{let We,xn,Sn=c(L,Tn,on,un),p=m(L,Tn,on,un);(We=dn(Sn))!==!1&&(xn=dn(p))!==!1?L.stack[_n].setfltvalue(Math.pow(We,xn)):Ve.luaT_trybinTM(L,Sn,p,L.stack[_n],Ve.TMS.TM_POW);break}case an:{let We,xn,Sn=c(L,Tn,on,un),p=m(L,Tn,on,un);(We=dn(Sn))!==!1&&(xn=dn(p))!==!1?L.stack[_n].setfltvalue(We/xn):Ve.luaT_trybinTM(L,Sn,p,L.stack[_n],Ve.TMS.TM_DIV);break}case g:{let We,xn,Sn=c(L,Tn,on,un),p=m(L,Tn,on,un);Sn.ttisinteger()&&p.ttisinteger()?L.stack[_n].setivalue(Pn(L,Sn.value,p.value)):(We=dn(Sn))!==!1&&(xn=dn(p))!==!1?L.stack[_n].setfltvalue(Math.floor(We/xn)):Ve.luaT_trybinTM(L,Sn,p,L.stack[_n],Ve.TMS.TM_IDIV);break}case ln:{let We,xn,Sn=c(L,Tn,on,un),p=m(L,Tn,on,un);(We=pe(Sn))!==!1&&(xn=pe(p))!==!1?L.stack[_n].setivalue(We&xn):Ve.luaT_trybinTM(L,Sn,p,L.stack[_n],Ve.TMS.TM_BAND);break}case re:{let We,xn,Sn=c(L,Tn,on,un),p=m(L,Tn,on,un);(We=pe(Sn))!==!1&&(xn=pe(p))!==!1?L.stack[_n].setivalue(We|xn):Ve.luaT_trybinTM(L,Sn,p,L.stack[_n],Ve.TMS.TM_BOR);break}case Ae:{let We,xn,Sn=c(L,Tn,on,un),p=m(L,Tn,on,un);(We=pe(Sn))!==!1&&(xn=pe(p))!==!1?L.stack[_n].setivalue(We^xn):Ve.luaT_trybinTM(L,Sn,p,L.stack[_n],Ve.TMS.TM_BXOR);break}case G:{let We,xn,Sn=c(L,Tn,on,un),p=m(L,Tn,on,un);(We=pe(Sn))!==!1&&(xn=pe(p))!==!1?L.stack[_n].setivalue($n(We,xn)):Ve.luaT_trybinTM(L,Sn,p,L.stack[_n],Ve.TMS.TM_SHL);break}case we:{let We,xn,Sn=c(L,Tn,on,un),p=m(L,Tn,on,un);(We=pe(Sn))!==!1&&(xn=pe(p))!==!1?L.stack[_n].setivalue($n(We,-xn)):Ve.luaT_trybinTM(L,Sn,p,L.stack[_n],Ve.TMS.TM_SHR);break}case o:{let We,xn=L.stack[_(0,Tn,un)];xn.ttisinteger()?L.stack[_n].setivalue(0|-xn.value):(We=dn(xn))!==!1?L.stack[_n].setfltvalue(-We):Ve.luaT_trybinTM(L,xn,xn,L.stack[_n],Ve.TMS.TM_UNM);break}case P:{let We=L.stack[_(0,Tn,un)];We.ttisinteger()?L.stack[_n].setivalue(~We.value):Ve.luaT_trybinTM(L,We,We,L.stack[_n],Ve.TMS.TM_BNOT);break}case On:{let We=L.stack[_(0,Tn,un)];L.stack[_n].setbvalue(We.l_isfalse());break}case Te:yn(L,L.stack[_n],L.stack[_(0,Tn,un)]);break;case tn:{let We=un.B,xn=un.C;L.top=Tn+xn+1,pt(L,xn-We+1);let Sn=Tn+We;M.setobjs2s(L,_n,Sn),Fe.adjust_top(L,ie.top);break}case S:O(L,ie,un,0);break;case sn:gn(L,c(L,Tn,on,un),m(L,Tn,on,un))!==un.A?ie.l_savedpc++:y(L,ie);break;case q:ne(L,c(L,Tn,on,un),m(L,Tn,on,un))!==un.A?ie.l_savedpc++:y(L,ie);break;case xe:en(L,c(L,Tn,on,un),m(L,Tn,on,un))!==un.A?ie.l_savedpc++:y(L,ie);break;case In:(un.C?L.stack[_n].l_isfalse():!L.stack[_n].l_isfalse())?ie.l_savedpc++:y(L,ie);break;case Mn:{let We=_(0,Tn,un),xn=L.stack[We];(un.C?xn.l_isfalse():!xn.l_isfalse())?ie.l_savedpc++:(M.setobjs2s(L,_n,We),y(L,ie));break}case ge:{let We=un.B,xn=un.C-1;if(We!==0&&Fe.adjust_top(L,_n+We),!Fe.luaD_precall(L,_n,xn)){ie=L.ci;continue e}xn>=0&&Fe.adjust_top(L,ie.top);break}case Nn:{let We=un.B;if(We!==0&&Fe.adjust_top(L,_n+We),!Fe.luaD_precall(L,_n,D)){let xn=L.ci,Sn=xn.previous,p=xn.func,X=xn.funcOff,H=Sn.funcOff,ye=xn.l_base+p.value.p.numparams;cn.p.p.length>0&&te.luaF_close(L,Sn.l_base);for(let he=0;X+he<ye;he++)M.setobjs2s(L,H+he,X+he);Sn.l_base=H+(xn.l_base-X),Sn.top=H+(L.top-X),Fe.adjust_top(L,Sn.top),Sn.l_code=xn.l_code,Sn.l_savedpc=xn.l_savedpc,Sn.callstatus|=Le.CIST_TAIL,Sn.next=null,ie=L.ci=Sn,J(L.top===Sn.l_base+L.stack[H].value.p.maxstacksize);continue e}break}case Je:{cn.p.p.length>0&&te.luaF_close(L,Tn);let We=Fe.luaD_poscall(L,ie,_n,un.B!==0?un.B-1:L.top-_n);if(ie.callstatus&Le.CIST_FRESH)return;ie=L.ci,We&&Fe.adjust_top(L,ie.top),J(ie.callstatus&Le.CIST_LUA),J(ie.l_code[ie.l_savedpc-1].opcode===ge);continue e}case oe:if(L.stack[_n].ttisinteger()){let We=L.stack[_n+2].value,xn=L.stack[_n].value+We|0,Sn=L.stack[_n+1].value;(0<We?xn<=Sn:Sn<=xn)&&(ie.l_savedpc+=un.sBx,L.stack[_n].chgivalue(xn),L.stack[_n+3].setivalue(xn))}else{let We=L.stack[_n+2].value,xn=L.stack[_n].value+We,Sn=L.stack[_n+1].value;(0<We?xn<=Sn:Sn<=xn)&&(ie.l_savedpc+=un.sBx,L.stack[_n].chgfltvalue(xn),L.stack[_n+3].setfltvalue(xn))}break;case ze:{let We,xn=L.stack[_n],Sn=L.stack[_n+1],p=L.stack[_n+2];if(xn.ttisinteger()&&p.ttisinteger()&&(We=Bn(Sn,p.value))){let X=We.stopnow?0:xn.value;Sn.value=We.ilimit,xn.value=X-p.value|0}else{let X,H,ye;(X=dn(Sn))===!1&&l.luaG_runerror(L,se("'for' limit must be a number",!0)),L.stack[_n+1].setfltvalue(X),(H=dn(p))===!1&&l.luaG_runerror(L,se("'for' step must be a number",!0)),L.stack[_n+2].setfltvalue(H),(ye=dn(xn))===!1&&l.luaG_runerror(L,se("'for' initial value must be a number",!0)),L.stack[_n].setfltvalue(ye-H)}ie.l_savedpc+=un.sBx;break}case Zn:{let We=_n+3;M.setobjs2s(L,We+2,_n+2),M.setobjs2s(L,We+1,_n+1),M.setobjs2s(L,We,_n),Fe.adjust_top(L,We+3),Fe.luaD_call(L,We,un.C),Fe.adjust_top(L,ie.top),un=ie.l_code[ie.l_savedpc++],_n=s(0,Tn,un),J(un.opcode===ot)}case ot:L.stack[_n+1].ttisnil()||(M.setobjs2s(L,_n,_n+1),ie.l_savedpc+=un.sBx);break;case Ie:{let We=un.B,xn=un.C;We===0&&(We=L.top-_n-1),xn===0&&(J(ie.l_code[ie.l_savedpc].opcode===ae),xn=ie.l_code[ie.l_savedpc++].Ax);let Sn=L.stack[_n].value,p=(xn-1)*He+We;for(;We>0;We--)vn.luaH_setint(Sn,p--,L.stack[_n+We]);Fe.adjust_top(L,ie.top);break}case Oe:{let We=cn.p.p[un.Bx],xn=ht(We,cn.upvals,L.stack,Tn);xn===null?Fn(L,We,cn.upvals,Tn,_n):L.stack[_n].setclLvalue(xn);break}case fe:{let We,xn=un.B-1,Sn=Tn-ie.funcOff-cn.p.numparams-1;for(Sn<0&&(Sn=0),xn<0&&(xn=Sn,Fe.luaD_checkstack(L,Sn),Fe.adjust_top(L,_n+Sn)),We=0;We<xn&&We<Sn;We++)M.setobjs2s(L,_n+We,Tn-Sn+We);for(;We<xn;We++)L.stack[_n+We].setnilvalue();break}case ae:throw Error("invalid opcode")}}},a.exports.luaV_finishOp=function(L){let ie=L.ci,cn=ie.l_base,on=ie.l_code[ie.l_savedpc-1],Tn=on.opcode;switch(Tn){case Xe:case Pe:case Ee:case an:case g:case ln:case re:case Ae:case G:case we:case ee:case An:case o:case P:case Te:case Ce:case C:case le:M.setobjs2s(L,cn+on.A,L.top-1),delete L.stack[--L.top];break;case xe:case q:case sn:{let un=!L.stack[L.top-1].l_isfalse();delete L.stack[--L.top],ie.callstatus&Le.CIST_LEQ&&(J(Tn===xe),ie.callstatus^=Le.CIST_LEQ,un=!un),J(ie.l_code[ie.l_savedpc].opcode===S),un!==!!on.A&&ie.l_savedpc++;break}case tn:{let un=L.top-1,_n=un-1-(cn+on.B);M.setobjs2s(L,un-2,un),_n>1&&(L.top=un-1,pt(L,_n)),M.setobjs2s(L,ie.l_base+on.A,L.top-1),Fe.adjust_top(L,ie.top);break}case Zn:J(ie.l_code[ie.l_savedpc].opcode===ot),Fe.adjust_top(L,ie.top);break;case ge:on.C-1>=0&&Fe.adjust_top(L,ie.top)}},a.exports.luaV_imul=Dn,a.exports.luaV_lessequal=en,a.exports.luaV_lessthan=ne,a.exports.luaV_mod=Un,a.exports.luaV_objlen=yn,a.exports.luaV_rawequalobj=function(L,ie){return gn(null,L,ie)},a.exports.luaV_shiftl=$n,a.exports.luaV_tointeger=Hn,a.exports.settable=wt,a.exports.tointeger=pe,a.exports.tonumber=dn},function(a,B,f){const w=[96,113,65,84,80,80,92,108,60,16,60,84,108,124,124,124,124,124,124,124,124,124,124,124,124,96,96,96,96,104,34,188,188,188,132,228,84,84,16,98,98,4,98,20,81,80,23],v=function(b,K){return~(-1<<b)<<K},D=function(b,K){return~v(b,K)},R=function(b,K,A,F){return b.code=b.code&D(F,A)|K<<A&v(F,A),z(b)},U=function(b,K){return R(b,K,14,18)},z=function(b){if(typeof b=="number")return{code:b,opcode:b>>0&v(6,0),A:b>>6&v(8,0),B:b>>23&v(9,0),C:b>>14&v(9,0),Bx:b>>14&v(18,0),Ax:b>>6&v(26,0),sBx:(b>>14&v(18,0))-131071};{let K=b.code;return b.opcode=K>>0&v(6,0),b.A=K>>6&v(8,0),b.B=K>>23&v(9,0),b.C=K>>14&v(9,0),b.Bx=K>>14&v(18,0),b.Ax=K>>6&v(26,0),b.sBx=(K>>14&v(18,0))-131071,b}};a.exports.BITRK=256,a.exports.CREATE_ABC=function(b,K,A,F){return z(b<<0|K<<6|A<<23|F<<14)},a.exports.CREATE_ABx=function(b,K,A){return z(b<<0|K<<6|A<<14)},a.exports.CREATE_Ax=function(b,K){return z(b<<0|K<<6)},a.exports.GET_OPCODE=function(b){return b.opcode},a.exports.GETARG_A=function(b){return b.A},a.exports.GETARG_B=function(b){return b.B},a.exports.GETARG_C=function(b){return b.C},a.exports.GETARG_Bx=function(b){return b.Bx},a.exports.GETARG_Ax=function(b){return b.Ax},a.exports.GETARG_sBx=function(b){return b.sBx},a.exports.INDEXK=function(b){return-257&b},a.exports.ISK=function(b){return 256&b},a.exports.LFIELDS_PER_FLUSH=50,a.exports.MAXARG_A=255,a.exports.MAXARG_Ax=67108863,a.exports.MAXARG_B=511,a.exports.MAXARG_Bx=262143,a.exports.MAXARG_C=511,a.exports.MAXARG_sBx=131071,a.exports.MAXINDEXRK=255,a.exports.NO_REG=255,a.exports.OpArgK=3,a.exports.OpArgN=0,a.exports.OpArgR=2,a.exports.OpArgU=1,a.exports.OpCodes=["MOVE","LOADK","LOADKX","LOADBOOL","LOADNIL","GETUPVAL","GETTABUP","GETTABLE","SETTABUP","SETUPVAL","SETTABLE","NEWTABLE","SELF","ADD","SUB","MUL","MOD","POW","DIV","IDIV","BAND","BOR","BXOR","SHL","SHR","UNM","BNOT","NOT","LEN","CONCAT","JMP","EQ","LT","LE","TEST","TESTSET","CALL","TAILCALL","RETURN","FORLOOP","FORPREP","TFORCALL","TFORLOOP","SETLIST","CLOSURE","VARARG","EXTRAARG"],a.exports.OpCodesI={OP_MOVE:0,OP_LOADK:1,OP_LOADKX:2,OP_LOADBOOL:3,OP_LOADNIL:4,OP_GETUPVAL:5,OP_GETTABUP:6,OP_GETTABLE:7,OP_SETTABUP:8,OP_SETUPVAL:9,OP_SETTABLE:10,OP_NEWTABLE:11,OP_SELF:12,OP_ADD:13,OP_SUB:14,OP_MUL:15,OP_MOD:16,OP_POW:17,OP_DIV:18,OP_IDIV:19,OP_BAND:20,OP_BOR:21,OP_BXOR:22,OP_SHL:23,OP_SHR:24,OP_UNM:25,OP_BNOT:26,OP_NOT:27,OP_LEN:28,OP_CONCAT:29,OP_JMP:30,OP_EQ:31,OP_LT:32,OP_LE:33,OP_TEST:34,OP_TESTSET:35,OP_CALL:36,OP_TAILCALL:37,OP_RETURN:38,OP_FORLOOP:39,OP_FORPREP:40,OP_TFORCALL:41,OP_TFORLOOP:42,OP_SETLIST:43,OP_CLOSURE:44,OP_VARARG:45,OP_EXTRAARG:46},a.exports.POS_A=6,a.exports.POS_Ax=6,a.exports.POS_B=23,a.exports.POS_Bx=14,a.exports.POS_C=14,a.exports.POS_OP=0,a.exports.RKASK=function(b){return 256|b},a.exports.SETARG_A=function(b,K){return R(b,K,6,8)},a.exports.SETARG_Ax=function(b,K){return R(b,K,6,26)},a.exports.SETARG_B=function(b,K){return R(b,K,23,9)},a.exports.SETARG_Bx=U,a.exports.SETARG_C=function(b,K){return R(b,K,14,9)},a.exports.SETARG_sBx=function(b,K){return U(b,K+131071)},a.exports.SET_OPCODE=function(b,K){return b.code=b.code&D(6,0)|K<<0&v(6,0),z(b)},a.exports.SIZE_A=8,a.exports.SIZE_Ax=26,a.exports.SIZE_B=9,a.exports.SIZE_Bx=18,a.exports.SIZE_C=9,a.exports.SIZE_OP=6,a.exports.fullins=z,a.exports.getBMode=function(b){return w[b]>>4&3},a.exports.getCMode=function(b){return w[b]>>2&3},a.exports.getOpMode=function(b){return 3&w[b]},a.exports.iABC=0,a.exports.iABx=1,a.exports.iAsBx=2,a.exports.iAx=3,a.exports.testAMode=function(b){return 64&w[b]},a.exports.testTMode=function(b){return 128&w[b]}},function(a,B,f){const{LUA_VERSION_MAJOR:w,LUA_VERSION_MINOR:v}=f(2),D="_"+w+"_"+v;a.exports.LUA_VERSUFFIX=D,a.exports.lua_assert=function(U){},a.exports.luaopen_base=f(24).luaopen_base,a.exports.LUA_COLIBNAME="coroutine",a.exports.luaopen_coroutine=f(25).luaopen_coroutine,a.exports.LUA_TABLIBNAME="table",a.exports.luaopen_table=f(26).luaopen_table,a.exports.LUA_OSLIBNAME="os",a.exports.luaopen_os=f(27).luaopen_os,a.exports.LUA_STRLIBNAME="string",a.exports.luaopen_string=f(28).luaopen_string,a.exports.LUA_UTF8LIBNAME="utf8",a.exports.luaopen_utf8=f(29).luaopen_utf8,a.exports.LUA_BITLIBNAME="bit32",a.exports.LUA_MATHLIBNAME="math",a.exports.luaopen_math=f(30).luaopen_math,a.exports.LUA_DBLIBNAME="debug",a.exports.luaopen_debug=f(31).luaopen_debug,a.exports.LUA_LOADLIBNAME="package",a.exports.luaopen_package=f(32).luaopen_package,a.exports.LUA_FENGARILIBNAME="fengari",a.exports.luaopen_fengari=f(33).luaopen_fengari;const R=f(39);a.exports.luaL_openlibs=R.luaL_openlibs},function(a,B,f){const{LUA_MULTRET:w,LUA_OPBNOT:v,LUA_OPEQ:D,LUA_OPLE:R,LUA_OPLT:U,LUA_OPUNM:z,LUA_REGISTRYINDEX:b,LUA_RIDX_GLOBALS:K,LUA_VERSION_NUM:A,constant_types:{LUA_NUMTAGS:F,LUA_TBOOLEAN:Q,LUA_TCCL:ce,LUA_TFUNCTION:$,LUA_TLCF:ve,LUA_TLCL:se,LUA_TLIGHTUSERDATA:$e,LUA_TLNGSTR:nn,LUA_TNIL:He,LUA_TNONE:Xe,LUA_TNUMFLT:ln,LUA_TNUMINT:P,LUA_TSHRSTR:re,LUA_TTABLE:Ae,LUA_TTHREAD:ge,LUA_TUSERDATA:Oe},thread_status:{LUA_OK:tn},from_userstring:an,to_luastring:sn}=f(1),{api_check:ae}=f(4),oe=f(11),ze=f(8),{luaU_dump:C}=f(37),Ce=f(13),E=f(6),g=f(12),{luaS_bless:S,luaS_new:xe,luaS_newliteral:Te}=f(10),pn=f(14),{LUAI_MAXSTACK:Ze}=f(3),fn=f(15),mn=f(9),{ZIO:q}=f(19),ee=E.TValue,Ue=E.CClosure,Ee=function(l){l.top++,ae(l,l.top<=l.ci.top,"stack overflow")},rn=function(l,s){ae(l,s<l.top-l.ci.funcOff,"not enough elements in the stack")},On=function(l){if(!l)throw TypeError("invalid argument")},An=function(l){On(typeof l=="number"&&(0|l)===l)},Je=function(l){return l!==E.luaO_nilobject},le=function(l,s){let _=l.ci;if(s>0){let c=_.funcOff+s;return ae(l,s<=_.top-(_.funcOff+1),"unacceptable index"),c>=l.top?E.luaO_nilobject:l.stack[c]}return s>b?(ae(l,s!==0&&-s<=l.top,"invalid index"),l.stack[l.top+s]):s===b?l.l_G.l_registry:(ae(l,(s=b-s)<=Ce.MAXUPVAL+1,"upvalue index too large"),_.func.ttislcf()?E.luaO_nilobject:s<=_.func.value.nupvalues?_.func.value.upvalue[s-1]:E.luaO_nilobject)},Ie=function(l,s){let _=l.ci;if(s>0){let c=_.funcOff+s;return ae(l,s<=_.top-(_.funcOff+1),"unacceptable index"),c>=l.top?null:c}if(s>b)return ae(l,s!==0&&-s<=l.top,"invalid index"),l.top+s;throw Error("attempt to use pseudo-index")},N=function(l,s){let _,c=l.ci.funcOff;s>=0?(ae(l,s<=l.stack_last-(c+1),"new top too large"),_=c+1+s):(ae(l,-(s+1)<=l.top-(c+1),"invalid new top"),_=l.top+s+1),ze.adjust_top(l,_)},me=function(l,s){N(l,-s-1)},Ke=function(l,s,_){for(;s<_;s++,_--){let c=l.stack[s],m=new ee(c.type,c.value);E.setobjs2s(l,s,_),E.setobj2s(l,_,m)}},G=function(l,s,_){let c=l.top-1,m=Ie(l,s),O=l.stack[m];ae(l,Je(O)&&s>b,"index not in the stack"),ae(l,(_>=0?_:-_)<=c-m+1,"invalid 'n'");let y=_>=0?c-_:m-_-1;Ke(l,m,y),Ke(l,y+1,l.top-1),Ke(l,m,l.top-1)},we=function(l,s,_){let c=le(l,s);le(l,_).setfrom(c)},Pe=function(l,s,_){if(On(typeof s=="function"),An(_),_===0)l.stack[l.top]=new ee(ve,s);else{rn(l,_),ae(l,_<=Ce.MAXUPVAL,"upvalue index too large");let c=new Ue(l,s,_);for(let m=0;m<_;m++)c.upvalue[m].setfrom(l.stack[l.top-_+m]);for(let m=1;m<_;m++)delete l.stack[--l.top];_>0&&--l.top,l.stack[l.top].setclCvalue(c)}Ee(l)},Nn=Pe,In=function(l,s){Pe(l,s,0)},Mn=In,Zn=function(l,s,_){let c=xe(l,an(_));rn(l,1),E.pushsvalue2s(l,c),ae(l,l.top<=l.ci.top,"stack overflow"),fn.settable(l,s,l.stack[l.top-1],l.stack[l.top-2]),delete l.stack[--l.top],delete l.stack[--l.top]},ot=function(l,s){Zn(l,mn.luaH_getint(l.l_G.l_registry.value,K),s)},o=function(l,s,_){let c=xe(l,an(_));return E.pushsvalue2s(l,c),ae(l,l.top<=l.ci.top,"stack overflow"),fn.luaV_gettable(l,s,l.stack[l.top-1],l.top-1),l.stack[l.top-1].ttnov()},fe=function(l,s,_){let c=le(l,s);return An(_),ae(l,c.ttistable(),"table expected"),E.pushobj2s(l,mn.luaH_getint(c.value,_)),ae(l,l.top<=l.ci.top,"stack overflow"),l.stack[l.top-1].ttnov()},h=function(l,s,_){let c=new E.TValue(Ae,mn.luaH_new(l));l.stack[l.top]=c,Ee(l)},Y=function(l,s,_){switch(An(_),s.ttype()){case ce:{let c=s.value;return 1<=_&&_<=c.nupvalues?{name:sn("",!0),val:c.upvalue[_-1]}:null}case se:{let c=s.value,m=c.p;if(!(1<=_&&_<=m.upvalues.length))return null;let O=m.upvalues[_-1].name;return{name:O?O.getstr():sn("(*no name)",!0),val:c.upvals[_-1]}}default:return null}},V=function(l,s){let _=le(l,s);if(!_.ttisstring()){if(!fn.cvt2str(_))return null;E.luaO_tostring(l,_)}return _.svalue()},J=V,d=function(l,s){return fn.tointeger(le(l,s))},M=function(l,s){return fn.tonumber(le(l,s))},te=new WeakMap,Le=function(l,s){ze.luaD_callnoyield(l,s.funcOff,s.nresults)},be=function(l,s){let _=le(l,s);return Je(_)?_.ttnov():Xe},De=sn("?"),Ye=function(l,s,_){ae(l,_===w||l.ci.top-l.top>=_-s,"results from function overflow current stack size")},Fe=function(l,s,_,c,m){ae(l,m===null||!(l.ci.callstatus&g.CIST_LUA),"cannot use continuations inside hooks"),rn(l,s+1),ae(l,l.status===tn,"cannot do calls on non-normal thread"),Ye(l,s,_);let O=l.top-(s+1);m!==null&&l.nny===0?(l.ci.c_k=m,l.ci.c_ctx=c,ze.luaD_call(l,O,_)):ze.luaD_callnoyield(l,O,_),_===w&&l.ci.top<l.top&&(l.ci.top=l.top)},Ve=function(l,s,_,c,m,O){let y,ne;ae(l,O===null||!(l.ci.callstatus&g.CIST_LUA),"cannot use continuations inside hooks"),rn(l,s+1),ae(l,l.status===tn,"cannot do calls on non-normal thread"),Ye(l,s,_),ne=c===0?0:Ie(l,c);let en=l.top-(s+1);if(O===null||l.nny>0){let gn={funcOff:en,nresults:_};y=ze.luaD_pcall(l,Le,gn,en,ne)}else{let gn=l.ci;gn.c_k=O,gn.c_ctx=m,gn.extra=en,gn.c_old_errfunc=l.errfunc,l.errfunc=ne,gn.callstatus&=~g.CIST_OAH|l.allowhook,gn.callstatus|=g.CIST_YPCALL,ze.luaD_call(l,en,_),gn.callstatus&=~g.CIST_YPCALL,l.errfunc=gn.c_old_errfunc,y=tn}return _===w&&l.ci.top<l.top&&(l.ci.top=l.top),y},vn=function(l,s,_){let c=le(l,s);ae(l,c.ttisLclosure(),"Lua function expected");let m=c.value;return An(_),ae(l,1<=_&&_<=m.p.upvalues.length,"invalid upvalue index"),{f:m,i:_-1}};a.exports.api_incr_top=Ee,a.exports.api_checknelems=rn,a.exports.lua_absindex=function(l,s){return s>0||s<=b?s:l.top-l.ci.funcOff+s},a.exports.lua_arith=function(l,s){s!==z&&s!==v?rn(l,2):(rn(l,1),E.pushobj2s(l,l.stack[l.top-1]),ae(l,l.top<=l.ci.top,"stack overflow")),E.luaO_arith(l,s,l.stack[l.top-2],l.stack[l.top-1],l.stack[l.top-2]),delete l.stack[--l.top]},a.exports.lua_atpanic=function(l,s){let _=l.l_G.panic;return l.l_G.panic=s,_},a.exports.lua_atnativeerror=function(l,s){let _=l.l_G.atnativeerror;return l.l_G.atnativeerror=s,_},a.exports.lua_call=function(l,s,_){Fe(l,s,_,0,null)},a.exports.lua_callk=Fe,a.exports.lua_checkstack=function(l,s){let _,c=l.ci;return ae(l,s>=0,"negative 'n'"),l.stack_last-l.top>s?_=!0:l.top+g.EXTRA_STACK>Ze-s?_=!1:(ze.luaD_growstack(l,s),_=!0),_&&c.top<l.top+s&&(c.top=l.top+s),_},a.exports.lua_compare=function(l,s,_,c){let m=le(l,s),O=le(l,_),y=0;if(Je(m)&&Je(O))switch(c){case D:y=fn.luaV_equalobj(l,m,O);break;case U:y=fn.luaV_lessthan(l,m,O);break;case R:y=fn.luaV_lessequal(l,m,O);break;default:ae(l,!1,"invalid option")}return y},a.exports.lua_concat=function(l,s){rn(l,s),s>=2?fn.luaV_concat(l,s):s===0&&(E.pushsvalue2s(l,S(l,sn("",!0))),ae(l,l.top<=l.ci.top,"stack overflow"))},a.exports.lua_copy=we,a.exports.lua_createtable=h,a.exports.lua_dump=function(l,s,_,c){rn(l,1);let m=l.stack[l.top-1];return m.ttisLclosure()?C(l,m.value.p,s,_,c):1},a.exports.lua_error=function(l){rn(l,1),oe.luaG_errormsg(l)},a.exports.lua_gc=function(){},a.exports.lua_getallocf=function(){return console.warn("lua_getallocf is not available"),0},a.exports.lua_getextraspace=function(){return console.warn("lua_getextraspace is not available"),0},a.exports.lua_getfield=function(l,s,_){return o(l,le(l,s),_)},a.exports.lua_getglobal=function(l,s){return o(l,mn.luaH_getint(l.l_G.l_registry.value,K),s)},a.exports.lua_geti=function(l,s,_){let c=le(l,s);return An(_),l.stack[l.top]=new ee(P,_),Ee(l),fn.luaV_gettable(l,c,l.stack[l.top-1],l.top-1),l.stack[l.top-1].ttnov()},a.exports.lua_getmetatable=function(l,s){let _,c=le(l,s),m=!1;switch(c.ttnov()){case Ae:case Oe:_=c.value.metatable;break;default:_=l.l_G.mt[c.ttnov()]}return _!=null&&(l.stack[l.top]=new ee(Ae,_),Ee(l),m=!0),m},a.exports.lua_gettable=function(l,s){let _=le(l,s);return fn.luaV_gettable(l,_,l.stack[l.top-1],l.top-1),l.stack[l.top-1].ttnov()},a.exports.lua_gettop=function(l){return l.top-(l.ci.funcOff+1)},a.exports.lua_getupvalue=function(l,s,_){let c=Y(0,le(l,s),_);if(c){let m=c.name,O=c.val;return E.pushobj2s(l,O),ae(l,l.top<=l.ci.top,"stack overflow"),m}return null},a.exports.lua_getuservalue=function(l,s){let _=le(l,s);ae(l,_.ttisfulluserdata(),"full userdata expected");let c=_.value.uservalue;return l.stack[l.top]=new ee(c.type,c.value),Ee(l),l.stack[l.top-1].ttnov()},a.exports.lua_insert=function(l,s){G(l,s,1)},a.exports.lua_isboolean=function(l,s){return be(l,s)===Q},a.exports.lua_iscfunction=function(l,s){let _=le(l,s);return _.ttislcf(_)||_.ttisCclosure()},a.exports.lua_isfunction=function(l,s){return be(l,s)===$},a.exports.lua_isinteger=function(l,s){return le(l,s).ttisinteger()},a.exports.lua_islightuserdata=function(l,s){return be(l,s)===$e},a.exports.lua_isnil=function(l,s){return be(l,s)===He},a.exports.lua_isnone=function(l,s){return be(l,s)===Xe},a.exports.lua_isnoneornil=function(l,s){return be(l,s)<=0},a.exports.lua_isnumber=function(l,s){return fn.tonumber(le(l,s))!==!1},a.exports.lua_isproxy=function(l,s){let _=te.get(l);return!!_&&(s===null||s.l_G===_)},a.exports.lua_isstring=function(l,s){let _=le(l,s);return _.ttisstring()||fn.cvt2str(_)},a.exports.lua_istable=function(l,s){return le(l,s).ttistable()},a.exports.lua_isthread=function(l,s){return be(l,s)===ge},a.exports.lua_isuserdata=function(l,s){let _=le(l,s);return _.ttisfulluserdata(_)||_.ttislightuserdata()},a.exports.lua_len=function(l,s){let _=le(l,s),c=new ee;fn.luaV_objlen(l,c,_),l.stack[l.top]=c,Ee(l)},a.exports.lua_load=function(l,s,_,c,m){c=c?an(c):De,m!==null&&(m=an(m));let O=new q(l,s,_),y=ze.luaD_protectedparser(l,O,c,m);if(y===tn){let ne=l.stack[l.top-1].value;if(ne.nupvalues>=1){let en=mn.luaH_getint(l.l_G.l_registry.value,K);ne.upvals[0].setfrom(en)}}return y},a.exports.lua_newtable=function(l){h(l)},a.exports.lua_newuserdata=function(l,s){let _=(function(c,m){return new E.Udata(c,m)})(l,s);return l.stack[l.top]=new E.TValue(Oe,_),Ee(l),_.data},a.exports.lua_next=function(l,s){let _=le(l,s);return ae(l,_.ttistable(),"table expected"),l.stack[l.top]=new ee,mn.luaH_next(l,_.value,l.top-1)?(Ee(l),1):(delete l.stack[l.top],delete l.stack[--l.top],0)},a.exports.lua_pcall=function(l,s,_,c){return Ve(l,s,_,c,0,null)},a.exports.lua_pcallk=Ve,a.exports.lua_pop=me,a.exports.lua_pushboolean=function(l,s){l.stack[l.top]=new ee(Q,!!s),Ee(l)},a.exports.lua_pushcclosure=Pe,a.exports.lua_pushcfunction=In,a.exports.lua_pushfstring=function(l,s,..._){return s=an(s),E.luaO_pushvfstring(l,s,_)},a.exports.lua_pushglobaltable=function(l){fe(l,b,K)},a.exports.lua_pushinteger=function(l,s){An(s),l.stack[l.top]=new ee(P,s),Ee(l)},a.exports.lua_pushjsclosure=Nn,a.exports.lua_pushjsfunction=Mn,a.exports.lua_pushlightuserdata=function(l,s){l.stack[l.top]=new ee($e,s),Ee(l)},a.exports.lua_pushliteral=function(l,s){if(s==null)l.stack[l.top]=new ee(He,null),l.top++;else{On(typeof s=="string");let _=Te(l,s);E.pushsvalue2s(l,_),s=_.getstr()}return ae(l,l.top<=l.ci.top,"stack overflow"),s},a.exports.lua_pushlstring=function(l,s,_){let c;return An(_),_===0?(s=sn("",!0),c=S(l,s)):(s=an(s),ae(l,s.length>=_,"invalid length to lua_pushlstring"),c=xe(l,s.subarray(0,_))),E.pushsvalue2s(l,c),ae(l,l.top<=l.ci.top,"stack overflow"),c.value},a.exports.lua_pushnil=function(l){l.stack[l.top]=new ee(He,null),Ee(l)},a.exports.lua_pushnumber=function(l,s){On(typeof s=="number"),l.stack[l.top]=new ee(ln,s),Ee(l)},a.exports.lua_pushstring=function(l,s){if(s==null)l.stack[l.top]=new ee(He,null),l.top++;else{let _=xe(l,an(s));E.pushsvalue2s(l,_),s=_.getstr()}return ae(l,l.top<=l.ci.top,"stack overflow"),s},a.exports.lua_pushthread=function(l){return l.stack[l.top]=new ee(ge,l),Ee(l),l.l_G.mainthread===l},a.exports.lua_pushvalue=function(l,s){E.pushobj2s(l,le(l,s)),ae(l,l.top<=l.ci.top,"stack overflow")},a.exports.lua_pushvfstring=function(l,s,_){return s=an(s),E.luaO_pushvfstring(l,s,_)},a.exports.lua_rawequal=function(l,s,_){let c=le(l,s),m=le(l,_);return Je(c)&&Je(m)?fn.luaV_equalobj(null,c,m):0},a.exports.lua_rawget=function(l,s){let _=le(l,s);return ae(l,_.ttistable(_),"table expected"),E.setobj2s(l,l.top-1,mn.luaH_get(l,_.value,l.stack[l.top-1])),l.stack[l.top-1].ttnov()},a.exports.lua_rawgeti=fe,a.exports.lua_rawgetp=function(l,s,_){let c=le(l,s);ae(l,c.ttistable(),"table expected");let m=new ee($e,_);return E.pushobj2s(l,mn.luaH_get(l,c.value,m)),ae(l,l.top<=l.ci.top,"stack overflow"),l.stack[l.top-1].ttnov()},a.exports.lua_rawlen=function(l,s){let _=le(l,s);switch(_.ttype()){case re:case nn:return _.vslen();case Oe:return _.value.len;case Ae:return mn.luaH_getn(_.value);default:return 0}},a.exports.lua_rawset=function(l,s){rn(l,2);let _=le(l,s);ae(l,_.ttistable(),"table expected");let c=l.stack[l.top-2],m=l.stack[l.top-1];mn.luaH_setfrom(l,_.value,c,m),mn.invalidateTMcache(_.value),delete l.stack[--l.top],delete l.stack[--l.top]},a.exports.lua_rawseti=function(l,s,_){An(_),rn(l,1);let c=le(l,s);ae(l,c.ttistable(),"table expected"),mn.luaH_setint(c.value,_,l.stack[l.top-1]),delete l.stack[--l.top]},a.exports.lua_rawsetp=function(l,s,_){rn(l,1);let c=le(l,s);ae(l,c.ttistable(),"table expected");let m=new ee($e,_),O=l.stack[l.top-1];mn.luaH_setfrom(l,c.value,m,O),delete l.stack[--l.top]},a.exports.lua_register=function(l,s,_){In(l,_),ot(l,s)},a.exports.lua_remove=function(l,s){G(l,s,-1),me(l,1)},a.exports.lua_replace=function(l,s){we(l,-1,s),me(l,1)},a.exports.lua_rotate=G,a.exports.lua_setallocf=function(){return console.warn("lua_setallocf is not available"),0},a.exports.lua_setfield=function(l,s,_){Zn(l,le(l,s),_)},a.exports.lua_setglobal=ot,a.exports.lua_seti=function(l,s,_){An(_),rn(l,1);let c=le(l,s);l.stack[l.top]=new ee(P,_),Ee(l),fn.settable(l,c,l.stack[l.top-1],l.stack[l.top-2]),delete l.stack[--l.top],delete l.stack[--l.top]},a.exports.lua_setmetatable=function(l,s){let _;rn(l,1);let c=le(l,s);switch(l.stack[l.top-1].ttisnil()?_=null:(ae(l,l.stack[l.top-1].ttistable(),"table expected"),_=l.stack[l.top-1].value),c.ttnov()){case Oe:case Ae:c.value.metatable=_;break;default:l.l_G.mt[c.ttnov()]=_}return delete l.stack[--l.top],!0},a.exports.lua_settable=function(l,s){rn(l,2);let _=le(l,s);fn.settable(l,_,l.stack[l.top-2],l.stack[l.top-1]),delete l.stack[--l.top],delete l.stack[--l.top]},a.exports.lua_settop=N,a.exports.lua_setupvalue=function(l,s,_){let c=le(l,s);rn(l,1);let m=Y(0,c,_);if(m){let O=m.name;return m.val.setfrom(l.stack[l.top-1]),delete l.stack[--l.top],O}return null},a.exports.lua_setuservalue=function(l,s){rn(l,1);let _=le(l,s);ae(l,_.ttisfulluserdata(),"full userdata expected"),_.value.uservalue.setfrom(l.stack[l.top-1]),delete l.stack[--l.top]},a.exports.lua_status=function(l){return l.status},a.exports.lua_stringtonumber=function(l,s){let _=new ee,c=E.luaO_str2num(s,_);return c!==0&&(l.stack[l.top]=_,Ee(l)),c},a.exports.lua_toboolean=function(l,s){return!le(l,s).l_isfalse()},a.exports.lua_tocfunction=function(l,s){let _=le(l,s);return _.ttislcf()||_.ttisCclosure()?_.value:null},a.exports.lua_todataview=function(l,s){let _=V(l,s);return new DataView(_.buffer,_.byteOffset,_.byteLength)},a.exports.lua_tointeger=function(l,s){let _=d(l,s);return _===!1?0:_},a.exports.lua_tointegerx=d,a.exports.lua_tojsstring=function(l,s){let _=le(l,s);if(!_.ttisstring()){if(!fn.cvt2str(_))return null;E.luaO_tostring(l,_)}return _.jsstring()},a.exports.lua_tolstring=V,a.exports.lua_tonumber=function(l,s){let _=M(l,s);return _===!1?0:_},a.exports.lua_tonumberx=M,a.exports.lua_topointer=function(l,s){let _=le(l,s);switch(_.ttype()){case Ae:case se:case ce:case ve:case ge:case Oe:case $e:return _.value;default:return null}},a.exports.lua_toproxy=function(l,s){let _=le(l,s);return(function(c,m,O){let y=function(ne){ae(ne,ne instanceof g.lua_State&&c===ne.l_G,"must be from same global state"),ne.stack[ne.top]=new ee(m,O),Ee(ne)};return te.set(y,c),y})(l.l_G,_.type,_.value)},a.exports.lua_tostring=J,a.exports.lua_tothread=function(l,s){let _=le(l,s);return _.ttisthread()?_.value:null},a.exports.lua_touserdata=function(l,s){let _=le(l,s);switch(_.ttnov()){case Oe:return _.value.data;case $e:return _.value;default:return null}},a.exports.lua_type=be,a.exports.lua_typename=function(l,s){return ae(l,Xe<=s&&s<F,"invalid tag"),pn.ttypename(s)},a.exports.lua_upvalueid=function(l,s,_){let c=le(l,s);switch(c.ttype()){case se:{let m=vn(l,s,_);return m.f.upvals[m.i]}case ce:{let m=c.value;return ae(l,(0|_)===_&&_>0&&_<=m.nupvalues,"invalid upvalue index"),m.upvalue[_-1]}default:return ae(l,!1,"closure expected"),null}},a.exports.lua_upvaluejoin=function(l,s,_,c,m){let O=vn(l,s,_),y=vn(l,c,m),ne=y.f.upvals[y.i];O.f.upvals[O.i]=ne},a.exports.lua_version=function(l){return l===null?A:l.l_G.version},a.exports.lua_xmove=function(l,s,_){if(l!==s){rn(l,_),ae(l,l.l_G===s.l_G,"moving among independent states"),ae(l,s.ci.top-s.top>=_,"stack overflow"),l.top-=_;for(let c=0;c<_;c++)s.stack[s.top]=new E.TValue,E.setobj2s(s,s.top,l.stack[l.top+c]),delete l.stack[l.top+c],s.top++}}},function(a,B,f){const{lua_assert:w}=f(4),v=function(D){let R=D.reader(D.L,D.data);if(R===null)return-1;w(R instanceof Uint8Array,"Should only load binary of array of bytes");let U=R.length;return U===0?-1:(D.buffer=R,D.off=0,D.n=U-1,D.buffer[D.off++])};a.exports.EOZ=-1,a.exports.luaZ_buffer=function(D){return D.buffer.subarray(0,D.n)},a.exports.luaZ_buffremove=function(D,R){D.n-=R},a.exports.luaZ_fill=v,a.exports.luaZ_read=function(D,R,U,z){for(;z;){if(D.n===0){if(v(D)===-1)return z;D.n++,D.off--}let b=z<=D.n?z:D.n;for(let K=0;K<b;K++)R[U++]=D.buffer[D.off++];D.n-=b,D.n===0&&(D.buffer=null),z-=b}return 0},a.exports.luaZ_resetbuffer=function(D){D.n=0},a.exports.luaZ_resizebuffer=function(D,R,U){let z=new Uint8Array(U);R.buffer&&z.set(R.buffer),R.buffer=z},a.exports.MBuffer=class{constructor(){this.buffer=null,this.n=0}},a.exports.ZIO=class{constructor(D,R,U){this.L=D,w(typeof R=="function","ZIO requires a reader"),this.reader=R,this.data=U,this.n=0,this.buffer=null,this.off=0}zgetc(){return this.n-- >0?this.buffer[this.off++]:v(this)}}},function(a,B,f){const{constant_types:{LUA_TBOOLEAN:w,LUA_TLNGSTR:v},thread_status:{LUA_ERRSYNTAX:D},to_luastring:R}=f(1),{LUA_MINBUFFER:U,MAX_INT:z,lua_assert:b}=f(4),K=f(11),A=f(8),{lisdigit:F,lislalnum:Q,lislalpha:ce,lisspace:$,lisxdigit:ve}=f(22),se=f(6),{luaS_bless:$e,luaS_hash:nn,luaS_hashlongstr:He,luaS_new:Xe}=f(10),ln=f(9),{EOZ:P,luaZ_buffer:re,luaZ_buffremove:Ae,luaZ_resetbuffer:ge,luaZ_resizebuffer:Oe}=f(19),tn=R("_ENV",!0),an={TK_AND:257,TK_BREAK:258,TK_DO:259,TK_ELSE:260,TK_ELSEIF:261,TK_END:262,TK_FALSE:263,TK_FOR:264,TK_FUNCTION:265,TK_GOTO:266,TK_IF:267,TK_IN:268,TK_LOCAL:269,TK_NIL:270,TK_NOT:271,TK_OR:272,TK_REPEAT:273,TK_RETURN:274,TK_THEN:275,TK_TRUE:276,TK_UNTIL:277,TK_WHILE:278,TK_IDIV:279,TK_CONCAT:280,TK_DOTS:281,TK_EQ:282,TK_GE:283,TK_LE:284,TK_NE:285,TK_SHL:286,TK_SHR:287,TK_DBCOLON:288,TK_EOS:289,TK_FLT:290,TK_INT:291,TK_NAME:292,TK_STRING:293},sn=["and","break","do","else","elseif","end","false","for","function","goto","if","in","local","nil","not","or","repeat","return","then","true","until","while","//","..","...","==",">=","<=","~=","<<",">>","::","<eof>","<number>","<integer>","<name>","<string>"].map((N,me)=>R(N));class ae{constructor(){this.r=NaN,this.i=NaN,this.ts=null}}class oe{constructor(){this.token=NaN,this.seminfo=new ae}}const ze=function(N,me){let Ke=N.buff;if(Ke.n+1>Ke.buffer.length){Ke.buffer.length>=z/2&&mn(N,R("lexical element too long",!0),0);let G=2*Ke.buffer.length;Oe(N.L,Ke,G)}Ke.buffer[Ke.n++]=me<0?255+me+1:me},C=function(N,me){if(me<257)return se.luaO_pushfstring(N.L,R("'%c'",!0),me);{let Ke=sn[me-257];return me<289?se.luaO_pushfstring(N.L,R("'%s'",!0),Ke):Ke}},Ce=function(N){return N.current===10||N.current===13},E=function(N){N.current=N.z.zgetc()},g=function(N){ze(N,N.current),E(N)},S=new se.TValue(w,!0),xe=function(N,me){let Ke=N.L,G=Xe(Ke,me),we=N.h.strong.get(He(G));if(we)G=we.key.tsvalue();else{let Pe=new se.TValue(v,G);ln.luaH_setfrom(Ke,N.h,Pe,S)}return G},Te=function(N){let me=N.current;b(Ce(N)),E(N),Ce(N)&&N.current!==me&&E(N),++N.linenumber>=z&&mn(N,R("chunk has too many lines",!0),0)},pn=function(N,me){return N.current===me&&(E(N),!0)},Ze=function(N,me){return(N.current===me[0].charCodeAt(0)||N.current===me[1].charCodeAt(0))&&(g(N),!0)},fn=function(N,me){let Ke="Ee",G=N.current;for(b(F(N.current)),g(N),G===48&&Ze(N,"xX")&&(Ke="Pp");;)if(Ze(N,Ke)&&Ze(N,"-+"),ve(N.current))g(N);else{if(N.current!==46)break;g(N)}let we=new se.TValue;return se.luaO_str2num(re(N.buff),we)===0&&mn(N,R("malformed number",!0),290),we.ttisinteger()?(me.i=we.value,291):(b(we.ttisfloat()),me.r=we.value,290)},mn=function(N,me,Ke){me=K.luaG_addinfo(N.L,me,N.source,N.linenumber),Ke&&se.luaO_pushfstring(N.L,R("%s near %s"),me,(function(G,we){switch(we){case 292:case 293:case 290:case 291:return se.luaO_pushfstring(G.L,R("'%s'",!0),re(G.buff));default:return C(G,we)}})(N,Ke)),A.luaD_throw(N.L,D)},q=function(N){let me=0,Ke=N.current;for(b(Ke===91||Ke===93),g(N);N.current===61;)g(N),me++;return N.current===Ke?me:-me-1},ee=function(N,me,Ke){let G=N.linenumber;g(N),Ce(N)&&Te(N);let we=!1;for(;!we;)switch(N.current){case P:mn(N,R(`unfinished long ${me?"string":"comment"} (starting at line ${G})`),289);break;case 93:q(N)===Ke&&(g(N),we=!0);break;case 10:case 13:ze(N,10),Te(N),me||ge(N.buff);break;default:me?g(N):E(N)}me&&(me.ts=xe(N,N.buff.buffer.subarray(2+Ke,N.buff.n-(2+Ke))))},Ue=function(N,me,Ke){me||(N.current!==P&&g(N),mn(N,Ke,293))},Ee=function(N){return g(N),Ue(N,ve(N.current),R("hexadecimal digit expected",!0)),se.luaO_hexavalue(N.current)},rn=function(N){let me=Ee(N);return me=(me<<4)+Ee(N),Ae(N.buff,2),me},On=function(N){let me=new Uint8Array(se.UTF8BUFFSZ),Ke=se.luaO_utf8esc(me,(function(G){let we=4;g(G),Ue(G,G.current===123,R("missing '{'",!0));let Pe=Ee(G);for(g(G);ve(G.current);)we++,Pe=(Pe<<4)+se.luaO_hexavalue(G.current),Ue(G,Pe<=1114111,R("UTF-8 value too large",!0)),g(G);return Ue(G,G.current===125,R("missing '}'",!0)),E(G),Ae(G.buff,we),Pe})(N));for(;Ke>0;Ke--)ze(N,me[se.UTF8BUFFSZ-Ke])},An=function(N){let me,Ke=0;for(me=0;me<3&&F(N.current);me++)Ke=10*Ke+N.current-48,g(N);return Ue(N,Ke<=255,R("decimal escape too large",!0)),Ae(N.buff,me),Ke},Je=function(N,me,Ke){for(g(N);N.current!==me;)switch(N.current){case P:mn(N,R("unfinished string",!0),289);break;case 10:case 13:mn(N,R("unfinished string",!0),293);break;case 92:{let G,we;switch(g(N),N.current){case 97:we=7,G="read_save";break;case 98:we=8,G="read_save";break;case 102:we=12,G="read_save";break;case 110:we=10,G="read_save";break;case 114:we=13,G="read_save";break;case 116:we=9,G="read_save";break;case 118:we=11,G="read_save";break;case 120:we=rn(N),G="read_save";break;case 117:On(N),G="no_save";break;case 10:case 13:Te(N),we=10,G="only_save";break;case 92:case 34:case 39:we=N.current,G="read_save";break;case P:G="no_save";break;case 122:for(Ae(N.buff,1),E(N);$(N.current);)Ce(N)?Te(N):E(N);G="no_save";break;default:Ue(N,F(N.current),R("invalid escape sequence",!0)),we=An(N),G="only_save"}G==="read_save"&&E(N),G!=="read_save"&&G!=="only_save"||(Ae(N.buff,1),ze(N,we));break}default:g(N)}g(N),Ke.ts=xe(N,N.buff.buffer.subarray(1,N.buff.n-1))},le=Object.create(null);sn.forEach((N,me)=>le[nn(N)]=me);const Ie=function(N,me){for(ge(N.buff);;)switch(b(typeof N.current=="number"),N.current){case 10:case 13:Te(N);break;case 32:case 12:case 9:case 11:E(N);break;case 45:if(E(N),N.current!==45)return 45;if(E(N),N.current===91){let Ke=q(N);if(ge(N.buff),Ke>=0){ee(N,null,Ke),ge(N.buff);break}}for(;!Ce(N)&&N.current!==P;)E(N);break;case 91:{let Ke=q(N);return Ke>=0?(ee(N,me,Ke),293):(Ke!==-1&&mn(N,R("invalid long string delimiter",!0),293),91)}case 61:return E(N),pn(N,61)?282:61;case 60:return E(N),pn(N,61)?284:pn(N,60)?286:60;case 62:return E(N),pn(N,61)?283:pn(N,62)?287:62;case 47:return E(N),pn(N,47)?279:47;case 126:return E(N),pn(N,61)?285:126;case 58:return E(N),pn(N,58)?288:58;case 34:case 39:return Je(N,N.current,me),293;case 46:return g(N),pn(N,46)?pn(N,46)?281:280:F(N.current)?fn(N,me):46;case 48:case 49:case 50:case 51:case 52:case 53:case 54:case 55:case 56:case 57:return fn(N,me);case P:return 289;default:if(ce(N.current)){do g(N);while(Q(N.current));let Ke=xe(N,re(N.buff));me.ts=Ke;let G=le[He(Ke)];return G!==void 0&&G<=22?G+257:292}{let Ke=N.current;return E(N),Ke}}};a.exports.FIRST_RESERVED=257,a.exports.LUA_ENV=tn,a.exports.LexState=class{constructor(){this.current=NaN,this.linenumber=NaN,this.lastline=NaN,this.t=new oe,this.lookahead=new oe,this.fs=null,this.L=null,this.z=null,this.buff=null,this.h=null,this.dyd=null,this.source=null,this.envn=null}},a.exports.RESERVED=an,a.exports.isreserved=function(N){let me=le[He(N)];return me!==void 0&&me<=22},a.exports.luaX_lookahead=function(N){return b(N.lookahead.token===289),N.lookahead.token=Ie(N,N.lookahead.seminfo),N.lookahead.token},a.exports.luaX_newstring=xe,a.exports.luaX_next=function(N){N.lastline=N.linenumber,N.lookahead.token!==289?(N.t.token=N.lookahead.token,N.t.seminfo.i=N.lookahead.seminfo.i,N.t.seminfo.r=N.lookahead.seminfo.r,N.t.seminfo.ts=N.lookahead.seminfo.ts,N.lookahead.token=289):N.t.token=Ie(N,N.t.seminfo)},a.exports.luaX_setinput=function(N,me,Ke,G,we){me.t={token:0,seminfo:new ae},me.L=N,me.current=we,me.lookahead={token:289,seminfo:new ae},me.z=Ke,me.fs=null,me.linenumber=1,me.lastline=1,me.source=G,me.envn=$e(N,tn),Oe(N,me.buff,U)},a.exports.luaX_syntaxerror=function(N,me){mn(N,me,N.t.token)},a.exports.luaX_token2str=C,a.exports.luaX_tokens=sn},function(a,B,f){const{lua:w,lauxlib:v,lualib:D,to_luastring:R}=f(0),{LUA_MULTRET:U,LUA_OK:z,LUA_REGISTRYINDEX:b,LUA_RIDX_MAINTHREAD:K,LUA_TBOOLEAN:A,LUA_TFUNCTION:F,LUA_TLIGHTUSERDATA:Q,LUA_TNIL:ce,LUA_TNONE:$,LUA_TNUMBER:ve,LUA_TSTRING:se,LUA_TTABLE:$e,LUA_TTHREAD:nn,LUA_TUSERDATA:He,lua_atnativeerror:Xe,lua_call:ln,lua_getfield:P,lua_gettable:re,lua_gettop:Ae,lua_isnil:ge,lua_isproxy:Oe,lua_newuserdata:tn,lua_pcall:an,lua_pop:sn,lua_pushboolean:ae,lua_pushcfunction:oe,lua_pushinteger:ze,lua_pushlightuserdata:C,lua_pushliteral:Ce,lua_pushnil:E,lua_pushnumber:g,lua_pushstring:S,lua_pushvalue:xe,lua_rawgeti:Te,lua_rawgetp:pn,lua_rawsetp:Ze,lua_rotate:fn,lua_setfield:mn,lua_settable:q,lua_settop:ee,lua_toboolean:Ue,lua_tojsstring:Ee,lua_tonumber:rn,lua_toproxy:On,lua_tothread:An,lua_touserdata:Je,lua_type:le}=w,{luaL_argerror:Ie,luaL_checkany:N,luaL_checkoption:me,luaL_checkstack:Ke,luaL_checkudata:G,luaL_error:we,luaL_getmetafield:Pe,luaL_newlib:Nn,luaL_newmetatable:In,luaL_requiref:Mn,luaL_setfuncs:Zn,luaL_setmetatable:ot,luaL_testudata:o,luaL_tolstring:fe}=v,{luaopen_base:h}=D,Y=typeof window<"u"?window:typeof WorkerGlobalScope<"u"&&self instanceof WorkerGlobalScope?self:(0,eval)("this");let V,J,d;if(typeof Reflect<"u")V=Reflect.apply,J=Reflect.construct,d=Reflect.deleteProperty;else{const I=Function.apply,Me=Function.bind;V=function(de,yn,Dn){return I.call(de,yn,Dn)},J=function(de,yn){switch(yn.length){case 0:return new de;case 1:return new de(yn[0]);case 2:return new de(yn[0],yn[1]);case 3:return new de(yn[0],yn[1],yn[2]);case 4:return new de(yn[0],yn[1],yn[2],yn[3])}let Dn=[null];return Dn.push.apply(Dn,yn),new(Me.apply(de,Dn))},d=Function("t","k","delete t[k]")}const M=String.prototype.concat.bind(""),te=function(I){return typeof I=="object"?I!==null:typeof I=="function"},Le=R("js object"),be=function(I,Me){let de=o(I,Me,Le);return de?de.data:void 0},De=function(I,Me){return G(I,Me,Le).data},Ye=function(I,Me){tn(I).data=Me,ot(I,Le)},Fe=function(I){Te(I,b,K);let Me=An(I,-1);return sn(I,1),Me},Ve=new WeakMap,vn=function(I,Me){switch(typeof Me){case"undefined":E(I);break;case"number":g(I,Me);break;case"string":S(I,R(Me));break;case"boolean":ae(I,Me);break;case"symbol":C(I,Me);break;case"function":if(Oe(Me,I)){Me(I);break}case"object":if(Me===null){if(pn(I,b,null)!==He)throw Error("js library not loaded into lua_State");break}default:{let de=Ve.get(Fe(I));if(!de)throw Error("js library not loaded into lua_State");let yn=de.get(Me);yn?yn(I):(Ye(I,Me),yn=On(I,-1),de.set(Me,yn))}}},l=function(I){let Me=Je(I,1);return vn(I,Me),1},s=function(I,Me){switch(le(I,Me)){case $:case ce:return;case A:return Ue(I,Me);case Q:return Je(I,Me);case ve:return rn(I,Me);case se:return Ee(I,Me);case He:{let de=be(I,Me);if(de!==void 0)return de}case $e:case F:case nn:default:return Hn(I,On(I,Me))}},_=function(I,Me){let de=an(I,Me,1,0),yn=s(I,-1);switch(sn(I,1),de){case z:return yn;default:throw yn}},c=function(I,Me,de,yn,Dn){if(!te(yn))throw new TypeError("`args` argument must be an object");let Pn=+yn.length;Pn>=0||(Pn=0),Ke(I,2+Pn,null);let Un=Ae(I);Me(I),vn(I,de);for(let $n=0;$n<Pn;$n++)vn(I,yn[$n]);switch(an(I,1+Pn,Dn,0)){case z:{let $n=Ae(I)-Un,ht=new Array($n);for(let Fn=0;Fn<$n;Fn++)ht[Fn]=s(I,Un+Fn+1);return ee(I,Un),ht}default:{let $n=s(I,-1);throw ee(I,Un),$n}}},m=function(I){return re(I,1),1},O=function(I,Me,de){return Ke(I,3,null),oe(I,m),Me(I),vn(I,de),_(I,2)},y=function(I,Me,de){switch(Ke(I,3,null),oe(I,m),Me(I),vn(I,de),an(I,2,1,0)){case z:{let yn=ge(I,-1);return sn(I,1),!yn}default:{let yn=s(I,-1);throw sn(I,1),yn}}},ne=function(I,Me,de,yn){switch(Ke(I,4,null),oe(I,function(Dn){return q(Dn,1),0}),Me(I),vn(I,de),vn(I,yn),an(I,3,0,0)){case z:return;default:{let Dn=s(I,-1);throw sn(I,1),Dn}}},en=function(I,Me,de){switch(Ke(I,4,null),oe(I,function(yn){return q(yn,1),0}),Me(I),vn(I,de),E(I),an(I,3,0,0)){case z:return;default:{let yn=s(I,-1);throw sn(I,1),yn}}},gn=function(I,Me){return Ke(I,2,null),oe(I,function(de){return fe(de,1),1}),Me(I),_(I,1)},Bn=function(){let I=this.L;Ke(I,3,null);let Me=Ae(I);switch(this.iter(I),this.state(I),this.last(I),an(I,2,U,0)){case z:{let de;if(this.last=On(I,Me+1),ge(I,-1))de={done:!0,value:void 0};else{let yn=Ae(I)-Me,Dn=new Array(yn);for(let Pn=0;Pn<yn;Pn++)Dn[Pn]=s(I,Me+Pn+1);de={done:!1,value:Dn}}return ee(I,Me),de}default:{let de=s(I,-1);throw sn(I,1),de}}},Hn=function(I,Me){const de=Fe(I);let yn=function(){return c(de,Me,this,arguments,1)[0]};yn.apply=function(Pn,Un){return c(de,Me,Pn,Un,1)[0]},yn.invoke=function(Pn,Un){return c(de,Me,Pn,Un,U)},yn.get=function(Pn){return O(de,Me,Pn)},yn.has=function(Pn){return y(de,Me,Pn)},yn.set=function(Pn,Un){return ne(de,Me,Pn,Un)},yn.delete=function(Pn){return en(de,Me,Pn)},yn.toString=function(){return gn(de,Me)},typeof Symbol=="function"&&(yn[Symbol.toStringTag]="Fengari object",yn[Symbol.iterator]=function(){return(function(Pn,Un){switch(Ke(Pn,1,null),oe(Pn,function($n){return Mn($n,R("_G"),h,0),P($n,-1,R("pairs")),Un($n),ln($n,1,3),3}),an(Pn,0,3,0)){case z:{let $n=On(Pn,-3),ht=On(Pn,-2),Fn=On(Pn,-1);return sn(Pn,3),{L:Pn,iter:$n,state:ht,last:Fn,next:Bn}}default:{let $n=s(Pn,-1);throw sn(Pn,1),$n}}})(de,Me)},Symbol.toPrimitive&&(yn[Symbol.toPrimitive]=function(Pn){if(Pn==="string")return gn(de,Me)}));let Dn=Ve.get(de);if(!Dn)throw Error("js library not loaded into lua_State");return Dn.set(yn,Me),yn},pe={new:function(I){let Me=s(I,1),de=Ae(I)-1,yn=new Array(de);for(let Dn=0;Dn<de;Dn++)yn[Dn]=s(I,Dn+2);return vn(I,J(Me,yn)),1},tonumber:function(I){let Me=s(I,1);return g(I,+Me),1},tostring:function(I){let Me=s(I,1);return Ce(I,M(Me)),1},instanceof:function(I){let Me=s(I,1),de=s(I,2);return ae(I,Me instanceof de),1},typeof:function(I){let Me=s(I,1);return Ce(I,typeof Me),1}};if(typeof Symbol=="function"&&Symbol.iterator){const I=function(de,yn){let Dn=De(de,yn),Pn=Dn[Symbol.iterator];Pn||Ie(de,yn,R("object not iterable"));let Un=V(Pn,Dn,[]);return te(Un)||Ie(de,yn,R("Result of the Symbol.iterator method is not an object")),Un},Me=function(de){let yn=s(de,1).next();return yn.done?0:(vn(de,yn.value),1)};pe.of=function(de){let yn=I(de,1);return oe(de,Me),vn(de,yn),2}}if(typeof Proxy=="function"&&typeof Symbol=="function"){const I=Symbol("lua_State"),Me=Symbol("fengari-proxy"),de={apply:function(Fn,Jn,Vn){return c(Fn[I],Fn[Me],Jn,Vn,1)[0]},construct:function(Fn,Jn){let Vn=Fn[I],ut=Fn[Me],it=Jn.length;Ke(Vn,2+it,null),ut(Vn);let Ct=Ae(Vn);if(Pe(Vn,Ct,R("construct"))===ce)throw sn(Vn,1),new TypeError("not a constructor");fn(Vn,Ct,1);for(let pt=0;pt<it;pt++)vn(Vn,Jn[pt]);return _(Vn,1+it)},defineProperty:function(Fn,Jn,Vn){let ut=Fn[I],it=Fn[Me];return Ke(ut,4,null),it(ut),Pe(ut,-1,R("defineProperty"))===ce?(sn(ut,1),!1):(fn(ut,-2,1),vn(ut,Jn),vn(ut,Vn),_(ut,3))},deleteProperty:function(Fn,Jn){return en(Fn[I],Fn[Me],Jn)},get:function(Fn,Jn){return O(Fn[I],Fn[Me],Jn)},getOwnPropertyDescriptor:function(Fn,Jn){let Vn=Fn[I],ut=Fn[Me];if(Ke(Vn,3,null),ut(Vn),Pe(Vn,-1,R("getOwnPropertyDescriptor"))!==ce)return fn(Vn,-2,1),vn(Vn,Jn),_(Vn,2);sn(Vn,1)},getPrototypeOf:function(Fn){let Jn=Fn[I],Vn=Fn[Me];return Ke(Jn,2,null),Vn(Jn),Pe(Jn,-1,R("getPrototypeOf"))===ce?(sn(Jn,1),null):(fn(Jn,-2,1),_(Jn,1))},has:function(Fn,Jn){return y(Fn[I],Fn[Me],Jn)},ownKeys:function(Fn){let Jn=Fn[I],Vn=Fn[Me];if(Ke(Jn,2,null),Vn(Jn),Pe(Jn,-1,R("ownKeys"))===ce)throw sn(Jn,1),Error("ownKeys unknown for fengari object");return fn(Jn,-2,1),_(Jn,1)},set:function(Fn,Jn,Vn){return ne(Fn[I],Fn[Me],Jn,Vn),!0},setPrototypeOf:function(Fn,Jn){let Vn=Fn[I],ut=Fn[Me];return Ke(Vn,3,null),ut(Vn),Pe(Vn,-1,R("setPrototypeOf"))===ce?(sn(Vn,1),!1):(fn(Vn,-2,1),vn(Vn,Jn),_(Vn,2))}},yn=function(){let Fn=(function(){}).bind();return delete Fn.length,delete Fn.name,Fn},Dn=Function("return ()=>void 0;"),Pn=function(){let Fn=Dn();return delete Fn.length,delete Fn.name,Fn},Un=function(Fn,Jn,Vn){const ut=Fe(Fn);let it;switch(Vn){case"function":it=yn();break;case"arrow_function":it=Pn();break;case"object":it={};break;default:throw TypeError("invalid type to createproxy")}return it[Me]=Jn,it[I]=ut,new Proxy(it,de)},$n=["function","arrow_function","object"],ht=$n.map(Fn=>R(Fn));pe.createproxy=function(Fn){N(Fn,1);let Jn=$n[me(Fn,2,ht[0],ht)],Vn=Un(Fn,On(Fn,1),Jn);return vn(Fn,Vn),1}}let dn={__index:function(I){let Me=De(I,1),de=s(I,2);return vn(I,Me[de]),1},__newindex:function(I){let Me=De(I,1),de=s(I,2),yn=s(I,3);return yn===void 0?d(Me,de):Me[de]=yn,0},__tostring:function(I){let Me=De(I,1),de=M(Me);return S(I,R(de)),1},__call:function(I){let Me,de=De(I,1),yn=Ae(I)-1,Dn=new Array(Math.max(0,yn-1));if(yn>0&&(Me=s(I,2),yn-- >0))for(let Pn=0;Pn<yn;Pn++)Dn[Pn]=s(I,Pn+3);return vn(I,V(de,Me,Dn)),1},__pairs:function(I){let Me,de,yn,Dn,Pn=De(I,1);if(typeof Symbol!="function"||(Me=Pn[Symbol.for("__pairs")])===void 0)de=function(Un){if(this.index>=this.keys.length)return;let $n=this.keys[this.index++];return[$n,this.object[$n]]},yn={object:Pn,keys:Object.keys(Pn),index:0};else{let Un=V(Me,Pn,[]);Un===void 0&&we(I,R("bad '__pairs' result (object with keys 'iter', 'state', 'first' expected)")),(de=Un.iter)===void 0&&we(I,R("bad '__pairs' result (object.iter is missing)")),yn=Un.state,Dn=Un.first}return oe(I,function(){let Un=s(I,1),$n=s(I,2),ht=V(de,Un,[$n]);if(ht===void 0)return 0;Array.isArray(ht)||we(I,R("bad iterator result (Array or undefined expected)")),Ke(I,ht.length,null);for(let Fn=0;Fn<ht.length;Fn++)vn(I,ht[Fn]);return ht.length}),vn(I,yn),vn(I,Dn),3},__len:function(I){let Me,de,yn=De(I,1);return de=typeof Symbol!="function"||(Me=yn[Symbol.for("__len")])===void 0?yn.length:V(Me,yn,[]),vn(I,de),1}};a.exports.FENGARI_INTEROP_VERSION="0.1",a.exports.FENGARI_INTEROP_VERSION_NUM=1,a.exports.FENGARI_INTEROP_RELEASE="0.1.2",a.exports.checkjs=De,a.exports.testjs=be,a.exports.pushjs=Ye,a.exports.push=vn,a.exports.tojs=s,a.exports.luaopen_js=function(I){return Ve.set(Fe(I),new WeakMap),Xe(I,l),Nn(I,pe),Ce(I,"0.1"),mn(I,-2,R("_VERSION")),ze(I,1),mn(I,-2,R("_VERSION_NUM")),Ce(I,"0.1.2"),mn(I,-2,R("_RELEASE")),In(I,Le),Zn(I,dn,0),sn(I,1),Ye(I,null),xe(I,-1),Ze(I,b,null),mn(I,-2,R("null")),vn(I,Y),mn(I,-2,R("global")),1}},function(a,B,f){const{luastring_of:w}=f(1),v=w(0,0,0,0,0,0,0,0,0,0,8,8,8,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,22,22,22,22,22,22,22,22,22,22,4,4,4,4,4,4,4,21,21,21,21,21,21,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,4,4,4,4,5,4,21,21,21,21,21,21,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);a.exports.lisdigit=function(D){return(2&v[D+1])!=0},a.exports.lislalnum=function(D){return(3&v[D+1])!=0},a.exports.lislalpha=function(D){return(1&v[D+1])!=0},a.exports.lisprint=function(D){return(4&v[D+1])!=0},a.exports.lisspace=function(D){return(8&v[D+1])!=0},a.exports.lisxdigit=function(D){return(16&v[D+1])!=0}},function(a,B,f){const{LUA_MULTRET:w,to_luastring:v}=f(1),{BinOpr:{OPR_ADD:D,OPR_AND:R,OPR_BAND:U,OPR_BOR:z,OPR_BXOR:b,OPR_CONCAT:K,OPR_DIV:A,OPR_EQ:F,OPR_GE:Q,OPR_GT:ce,OPR_IDIV:$,OPR_LE:ve,OPR_LT:se,OPR_MOD:$e,OPR_MUL:nn,OPR_NE:He,OPR_NOBINOPR:Xe,OPR_OR:ln,OPR_POW:P,OPR_SHL:re,OPR_SHR:Ae,OPR_SUB:ge},UnOpr:{OPR_BNOT:Oe,OPR_LEN:tn,OPR_MINUS:an,OPR_NOT:sn,OPR_NOUNOPR:ae},NO_JUMP:oe,getinstruction:ze,luaK_checkstack:C,luaK_codeABC:Ce,luaK_codeABx:E,luaK_codeAsBx:g,luaK_codek:S,luaK_concat:xe,luaK_dischargevars:Te,luaK_exp2RK:pn,luaK_exp2anyreg:Ze,luaK_exp2anyregup:fn,luaK_exp2nextreg:mn,luaK_exp2val:q,luaK_fixline:ee,luaK_getlabel:Ue,luaK_goiffalse:Ee,luaK_goiftrue:rn,luaK_indexed:On,luaK_infix:An,luaK_intK:Je,luaK_jump:le,luaK_jumpto:Ie,luaK_nil:N,luaK_patchclose:me,luaK_patchlist:Ke,luaK_patchtohere:G,luaK_posfix:we,luaK_prefix:Pe,luaK_reserveregs:Nn,luaK_ret:In,luaK_self:Mn,luaK_setlist:Zn,luaK_setmultret:ot,luaK_setoneret:o,luaK_setreturns:fe,luaK_storevar:h,luaK_stringK:Y}=f(35),V=f(8),J=f(13),d=f(20),{LUAI_MAXCCALLS:M,MAX_INT:te,lua_assert:Le}=f(4),be=f(6),{OpCodesI:{OP_CALL:De,OP_CLOSURE:Ye,OP_FORLOOP:Fe,OP_FORPREP:Ve,OP_GETUPVAL:vn,OP_MOVE:l,OP_NEWTABLE:s,OP_SETTABLE:_,OP_TAILCALL:c,OP_TFORCALL:m,OP_TFORLOOP:O,OP_VARARG:y},LFIELDS_PER_FLUSH:ne,SETARG_B:en,SETARG_C:gn,SET_OPCODE:Bn}=f(16),{luaS_eqlngstr:Hn,luaS_new:pe,luaS_newliteral:dn}=f(10),I=f(9),Me=J.Proto,de=d.RESERVED,yn=function(T){return T===Un.VCALL||T===Un.VVARARG},Dn=function(T,Z){return Hn(T,Z)};class Pn{constructor(){this.previous=null,this.firstlabel=NaN,this.firstgoto=NaN,this.nactvar=NaN,this.upval=NaN,this.isloop=NaN}}const Un={VVOID:0,VNIL:1,VTRUE:2,VFALSE:3,VK:4,VKFLT:5,VKINT:6,VNONRELOC:7,VLOCAL:8,VUPVAL:9,VINDEXED:10,VJMP:11,VRELOCABLE:12,VCALL:13,VVARARG:14};class $n{constructor(){this.k=NaN,this.u={ival:NaN,nval:NaN,info:NaN,ind:{idx:NaN,t:NaN,vt:NaN}},this.t=NaN,this.f=NaN}to(Z){this.k=Z.k,this.u=Z.u,this.t=Z.t,this.f=Z.f}}class ht{constructor(){this.f=null,this.prev=null,this.ls=null,this.bl=null,this.pc=NaN,this.lasttarget=NaN,this.jpc=NaN,this.nk=NaN,this.np=NaN,this.firstlocal=NaN,this.nlocvars=NaN,this.nactvar=NaN,this.nups=NaN,this.freereg=NaN}}class Fn{constructor(){this.arr=[],this.n=NaN,this.size=NaN}}const Jn=function(T,Z){T.t.token=0,d.luaX_syntaxerror(T,Z)},Vn=function(T,Z){d.luaX_syntaxerror(T,be.luaO_pushfstring(T.L,v("%s expected",!0),d.luaX_token2str(T,Z)))},ut=function(T,Z,Re,Qe){Z>Re&&(function(Ge,Se,hn){let En=Ge.ls.L,tt=Ge.f.linedefined,rt=tt===0?v("main function",!0):be.luaO_pushfstring(En,v("function at line %d",!0),tt),St=be.luaO_pushfstring(En,v("too many %s (limit is %d) in %s",!0),hn,Se,rt);d.luaX_syntaxerror(Ge.ls,St)})(T,Re,Qe)},it=function(T,Z){return T.t.token===Z&&(d.luaX_next(T),!0)},Ct=function(T,Z){T.t.token!==Z&&Vn(T,Z)},pt=function(T,Z){Ct(T,Z),d.luaX_next(T)},Dt=function(T,Z,Re){Z||d.luaX_syntaxerror(T,Re)},wt=function(T,Z,Re,Qe){it(T,Z)||(Qe===T.linenumber?Vn(T,Z):d.luaX_syntaxerror(T,be.luaO_pushfstring(T.L,v("%s expected (to close %s at line %d)"),d.luaX_token2str(T,Z),d.luaX_token2str(T,Re),Qe)))},L=function(T){Ct(T,de.TK_NAME);let Z=T.t.seminfo.ts;return d.luaX_next(T),Z},ie=function(T,Z,Re){T.f=T.t=oe,T.k=Z,T.u.info=Re},cn=function(T,Z,Re){ie(Z,Un.VK,Y(T.fs,Re))},on=function(T,Z){cn(T,Z,L(T))},Tn=function(T,Z){let Re=T.fs,Qe=T.dyd,Ge=(function(Se,hn){let En=Se.fs,tt=En.f;return tt.locvars[En.nlocvars]=new be.LocVar,tt.locvars[En.nlocvars].varname=hn,En.nlocvars++})(T,Z);ut(Re,Qe.actvar.n+1-Re.firstlocal,200,v("local variables",!0)),Qe.actvar.arr[Qe.actvar.n]=new class{constructor(){this.idx=NaN}},Qe.actvar.arr[Qe.actvar.n].idx=Ge,Qe.actvar.n++},un=function(T,Z){Tn(T,d.luaX_newstring(T,v(Z,!0)))},_n=function(T,Z){let Re=T.ls.dyd.actvar.arr[T.firstlocal+Z].idx;return Le(Re<T.nlocvars),T.f.locvars[Re]},We=function(T,Z){let Re=T.fs;for(Re.nactvar=Re.nactvar+Z;Z;Z--)_n(Re,Re.nactvar-Z).startpc=Re.pc},xn=function(T,Z,Re){let Qe=T.f;return ut(T,T.nups+1,J.MAXUPVAL,v("upvalues",!0)),Qe.upvalues[T.nups]={instack:Re.k===Un.VLOCAL,idx:Re.u.info,name:Z},T.nups++},Sn=function(T,Z,Re,Qe){if(T===null)ie(Re,Un.VVOID,0);else{let Ge=(function(Se,hn){for(let En=Se.nactvar-1;En>=0;En--)if(Dn(hn,_n(Se,En).varname))return En;return-1})(T,Z);if(Ge>=0)ie(Re,Un.VLOCAL,Ge),Qe||(function(Se,hn){let En=Se.bl;for(;En.nactvar>hn;)En=En.previous;En.upval=1})(T,Ge);else{let Se=(function(hn,En){let tt=hn.f.upvalues;for(let rt=0;rt<hn.nups;rt++)if(Dn(tt[rt].name,En))return rt;return-1})(T,Z);if(Se<0){if(Sn(T.prev,Z,Re,0),Re.k===Un.VVOID)return;Se=xn(T,Z,Re)}ie(Re,Un.VUPVAL,Se)}}},p=function(T,Z){let Re=L(T),Qe=T.fs;if(Sn(Qe,Re,Z,1),Z.k===Un.VVOID){let Ge=new $n;Sn(Qe,T.envn,Z,1),Le(Z.k!==Un.VVOID),cn(T,Ge,Re),On(Qe,Z,Ge)}},X=function(T,Z,Re,Qe){let Ge=T.fs,Se=Z-Re;if(yn(Qe.k))++Se<0&&(Se=0),fe(Ge,Qe,Se),Se>1&&Nn(Ge,Se-1);else if(Qe.k!==Un.VVOID&&mn(Ge,Qe),Se>0){let hn=Ge.freereg;Nn(Ge,Se),N(Ge,hn,Se)}Re>Z&&(T.fs.freereg-=Re-Z)},H=function(T){let Z=T.L;++Z.nCcalls,ut(T.fs,Z.nCcalls,M,v("JS levels",!0))},ye=function(T){return T.L.nCcalls--},he=function(T,Z,Re){let Qe=T.fs,Ge=T.dyd.gt,Se=Ge.arr[Z];if(Le(Dn(Se.name,Re.name)),Se.nactvar<Re.nactvar){let hn=_n(Qe,Se.nactvar).varname,En=be.luaO_pushfstring(T.L,v("<goto %s> at line %d jumps into the scope of local '%s'"),Se.name.getstr(),Se.line,hn.getstr());Jn(T,En)}Ke(Qe,Se.pc,Re.pc);for(let hn=Z;hn<Ge.n-1;hn++)Ge.arr[hn]=Ge.arr[hn+1];Ge.n--},_e=function(T,Z){let Re=T.fs.bl,Qe=T.dyd,Ge=Qe.gt.arr[Z];for(let Se=Re.firstlabel;Se<Qe.label.n;Se++){let hn=Qe.label.arr[Se];if(Dn(hn.name,Ge.name))return Ge.nactvar>hn.nactvar&&(Re.upval||Qe.label.n>Re.firstlabel)&&me(T.fs,Ge.pc,hn.nactvar),he(T,Z,hn),!0}return!1},bn=function(T,Z,Re,Qe,Ge){let Se=Z.n;return Z.arr[Se]=new class{constructor(){this.name=null,this.pc=NaN,this.line=NaN,this.nactvar=NaN}},Z.arr[Se].name=Re,Z.arr[Se].line=Qe,Z.arr[Se].nactvar=T.fs.nactvar,Z.arr[Se].pc=Ge,Z.n=Se+1,Se},Gn=function(T,Z){let Re=T.dyd.gt,Qe=T.fs.bl.firstgoto;for(;Qe<Re.n;)Dn(Re.arr[Qe].name,Z.name)?he(T,Qe,Z):Qe++},zn=function(T,Z,Re){Z.isloop=Re,Z.nactvar=T.nactvar,Z.firstlabel=T.ls.dyd.label.n,Z.firstgoto=T.ls.dyd.gt.n,Z.upval=0,Z.previous=T.bl,T.bl=Z,Le(T.freereg===T.nactvar)},jn=function(T,Z,Re){Z.prev=T.fs,Z.ls=T,T.fs=Z,Z.pc=0,Z.lasttarget=0,Z.jpc=oe,Z.freereg=0,Z.nk=0,Z.np=0,Z.nups=0,Z.nlocvars=0,Z.nactvar=0,Z.firstlocal=T.dyd.actvar.n,Z.bl=null;let Qe=Z.f;Qe.source=T.source,Qe.maxstacksize=2,zn(Z,Re,!1)},k=function(T){let Z=T.bl,Re=T.ls;if(Z.previous&&Z.upval){let Qe=le(T);me(T,Qe,Z.nactvar),G(T,Qe)}Z.isloop&&(function(Qe){let Ge=dn(Qe.L,"break"),Se=bn(Qe,Qe.dyd.label,Ge,0,Qe.fs.pc);Gn(Qe,Qe.dyd.label.arr[Se])})(Re),T.bl=Z.previous,(function(Qe,Ge){for(Qe.ls.dyd.actvar.n-=Qe.nactvar-Ge;Qe.nactvar>Ge;)_n(Qe,--Qe.nactvar).endpc=Qe.pc})(T,Z.nactvar),Le(Z.nactvar===T.nactvar),T.freereg=T.nactvar,Re.dyd.label.n=Z.firstlabel,Z.previous?(function(Qe,Ge){let Se=Ge.firstgoto,hn=Qe.ls.dyd.gt;for(;Se<hn.n;){let En=hn.arr[Se];En.nactvar>Ge.nactvar&&(Ge.upval&&me(Qe,En.pc,Ge.nactvar),En.nactvar=Ge.nactvar),_e(Qe.ls,Se)||Se++}})(T,Z):Z.firstgoto<Re.dyd.gt.n&&(function(Qe,Ge){let Se=d.isreserved(Ge.name)?"<%s> at line %d not inside a loop":"no visible label '%s' for <goto> at line %d";Se=be.luaO_pushfstring(Qe.L,v(Se),Ge.name.getstr(),Ge.line),Jn(Qe,Se)})(Re,Re.dyd.gt.arr[Z.firstgoto])},j=function(T){let Z=T.fs;In(Z,0,0),k(Z),Le(Z.bl===null),T.fs=Z.prev},Ne=function(T,Z){switch(T.t.token){case de.TK_ELSE:case de.TK_ELSEIF:case de.TK_END:case de.TK_EOS:return!0;case de.TK_UNTIL:return Z;default:return!1}},kn=function(T){for(;!Ne(T,1);){if(T.t.token===de.TK_RETURN)return void Pr(T);Pr(T)}},Wn=function(T,Z){let Re=T.fs,Qe=new $n;fn(Re,Z),d.luaX_next(T),on(T,Qe),On(Re,Z,Qe)},st=function(T,Z){d.luaX_next(T),pr(T,Z),q(T.fs,Z),pt(T,93)},Lt=function(T,Z){let Re=T.fs,Qe=T.fs.freereg,Ge=new $n,Se=new $n;T.t.token===de.TK_NAME?(ut(Re,Z.nh,te,v("items in a constructor",!0)),on(T,Ge)):st(T,Ge),Z.nh++,pt(T,61);let hn=pn(Re,Ge);pr(T,Se),Ce(Re,_,Z.t.u.info,hn,pn(Re,Se)),Re.freereg=Qe},tr=function(T,Z){Z.v.k!==Un.VVOID&&(mn(T,Z.v),Z.v.k=Un.VVOID,Z.tostore===ne&&(Zn(T,Z.t.u.info,Z.na,Z.tostore),Z.tostore=0))},Ft=function(T,Z){pr(T,Z.v),ut(T.fs,Z.na,te,v("items in a constructor",!0)),Z.na++,Z.tostore++},Vt=function(T,Z){switch(T.t.token){case de.TK_NAME:d.luaX_lookahead(T)!==61?Ft(T,Z):Lt(T,Z);break;case 91:Lt(T,Z);break;default:Ft(T,Z)}},Mt=function(T,Z){let Re=T.fs,Qe=T.linenumber,Ge=Ce(Re,s,0,0,0),Se=new class{constructor(){this.v=new $n,this.t=new $n,this.nh=NaN,this.na=NaN,this.tostore=NaN}};Se.na=Se.nh=Se.tostore=0,Se.t=Z,ie(Z,Un.VRELOCABLE,Ge),ie(Se.v,Un.VVOID,0),mn(T.fs,Z),pt(T,123);do{if(Le(Se.v.k===Un.VVOID||Se.tostore>0),T.t.token===125)break;tr(Re,Se),Vt(T,Se)}while(it(T,44)||it(T,59));wt(T,125,123,Qe),(function(hn,En){En.tostore!==0&&(yn(En.v.k)?(ot(hn,En.v),Zn(hn,En.t.u.info,En.na,w),En.na--):(En.v.k!==Un.VVOID&&mn(hn,En.v),Zn(hn,En.t.u.info,En.na,En.tostore)))})(Re,Se),en(Re.f.code[Ge],be.luaO_int2fb(Se.na)),gn(Re.f.code[Ge],be.luaO_int2fb(Se.nh))},mt=function(T,Z,Re,Qe){let Ge=new ht,Se=new Pn;Ge.f=(function(hn){let En=hn.L,tt=new Me(En),rt=hn.fs;return rt.f.p[rt.np++]=tt,tt})(T),Ge.f.linedefined=Qe,jn(T,Ge,Se),pt(T,40),Re&&(un(T,"self"),We(T,1)),(function(hn){let En=hn.fs,tt=En.f,rt=0;if(tt.is_vararg=!1,hn.t.token!==41)do switch(hn.t.token){case de.TK_NAME:Tn(hn,L(hn)),rt++;break;case de.TK_DOTS:d.luaX_next(hn),tt.is_vararg=!0;break;default:d.luaX_syntaxerror(hn,v("<name> or '...' expected",!0))}while(!tt.is_vararg&&it(hn,44));We(hn,rt),tt.numparams=En.nactvar,Nn(En,En.nactvar)})(T),pt(T,41),kn(T),Ge.f.lastlinedefined=T.linenumber,wt(T,de.TK_END,de.TK_FUNCTION,Qe),(function(hn,En){let tt=hn.fs.prev;ie(En,Un.VRELOCABLE,E(tt,Ye,0,tt.np-1)),mn(tt,En)})(T,Z),j(T)},Xt=function(T,Z){let Re=1;for(pr(T,Z);it(T,44);)mn(T.fs,Z),pr(T,Z),Re++;return Re},dr=function(T,Z,Re){let Qe,Ge=T.fs,Se=new $n;switch(T.t.token){case 40:d.luaX_next(T),T.t.token===41?Se.k=Un.VVOID:(Xt(T,Se),ot(Ge,Se)),wt(T,41,40,Re);break;case 123:Mt(T,Se);break;case de.TK_STRING:cn(T,Se,T.t.seminfo.ts),d.luaX_next(T);break;default:d.luaX_syntaxerror(T,v("function arguments expected",!0))}Le(Z.k===Un.VNONRELOC);let hn=Z.u.info;yn(Se.k)?Qe=w:(Se.k!==Un.VVOID&&mn(Ge,Se),Qe=Ge.freereg-(hn+1)),ie(Z,Un.VCALL,Ce(Ge,De,hn,Qe+1,2)),ee(Ge,Re),Ge.freereg=hn+1},Ba=function(T,Z){let Re=T.fs,Qe=T.linenumber;for(!(function(Ge,Se){switch(Ge.t.token){case 40:{let hn=Ge.linenumber;return d.luaX_next(Ge),pr(Ge,Se),wt(Ge,41,40,hn),void Te(Ge.fs,Se)}case de.TK_NAME:return void p(Ge,Se);default:d.luaX_syntaxerror(Ge,v("unexpected symbol",!0))}})(T,Z);;)switch(T.t.token){case 46:Wn(T,Z);break;case 91:{let Ge=new $n;fn(Re,Z),st(T,Ge),On(Re,Z,Ge);break}case 58:{let Ge=new $n;d.luaX_next(T),on(T,Ge),Mn(Re,Z,Ge),dr(T,Z,Qe);break}case 40:case de.TK_STRING:case 123:mn(Re,Z),dr(T,Z,Qe);break;default:return}},Fa=[{left:10,right:10},{left:10,right:10},{left:11,right:11},{left:11,right:11},{left:14,right:13},{left:11,right:11},{left:11,right:11},{left:6,right:6},{left:4,right:4},{left:5,right:5},{left:7,right:7},{left:7,right:7},{left:9,right:8},{left:3,right:3},{left:3,right:3},{left:3,right:3},{left:3,right:3},{left:3,right:3},{left:3,right:3},{left:2,right:2},{left:1,right:1}],Er=function(T,Z,Re){H(T);let Qe=(function(Se){switch(Se){case de.TK_NOT:return sn;case 45:return an;case 126:return Oe;case 35:return tn;default:return ae}})(T.t.token);if(Qe!==ae){let Se=T.linenumber;d.luaX_next(T),Er(T,Z,12),Pe(T.fs,Qe,Z,Se)}else(function(Se,hn){switch(Se.t.token){case de.TK_FLT:ie(hn,Un.VKFLT,0),hn.u.nval=Se.t.seminfo.r;break;case de.TK_INT:ie(hn,Un.VKINT,0),hn.u.ival=Se.t.seminfo.i;break;case de.TK_STRING:cn(Se,hn,Se.t.seminfo.ts);break;case de.TK_NIL:ie(hn,Un.VNIL,0);break;case de.TK_TRUE:ie(hn,Un.VTRUE,0);break;case de.TK_FALSE:ie(hn,Un.VFALSE,0);break;case de.TK_DOTS:{let En=Se.fs;Dt(Se,En.f.is_vararg,v("cannot use '...' outside a vararg function",!0)),ie(hn,Un.VVARARG,Ce(En,y,0,1,0));break}case 123:return void Mt(Se,hn);case de.TK_FUNCTION:return d.luaX_next(Se),void mt(Se,hn,0,Se.linenumber);default:return void Ba(Se,hn)}d.luaX_next(Se)})(T,Z);let Ge=(function(Se){switch(Se){case 43:return D;case 45:return ge;case 42:return nn;case 37:return $e;case 94:return P;case 47:return A;case de.TK_IDIV:return $;case 38:return U;case 124:return z;case 126:return b;case de.TK_SHL:return re;case de.TK_SHR:return Ae;case de.TK_CONCAT:return K;case de.TK_NE:return He;case de.TK_EQ:return F;case 60:return se;case de.TK_LE:return ve;case 62:return ce;case de.TK_GE:return Q;case de.TK_AND:return R;case de.TK_OR:return ln;default:return Xe}})(T.t.token);for(;Ge!==Xe&&Fa[Ge].left>Re;){let Se=new $n,hn=T.linenumber;d.luaX_next(T),An(T.fs,Ge,Z);let En=Er(T,Se,Fa[Ge].right);we(T.fs,Ge,Z,Se,hn),Ge=En}return ye(T),Ge},pr=function(T,Z){Er(T,Z,0)},Jr=function(T){let Z=T.fs,Re=new Pn;zn(Z,Re,0),kn(T),k(Z)};class ea{constructor(){this.prev=null,this.v=new $n}}const Va=function(T,Z,Re){let Qe=new $n;if(Dt(T,(function(Ge){return Un.VLOCAL<=Ge&&Ge<=Un.VINDEXED})(Z.v.k),v("syntax error",!0)),it(T,44)){let Ge=new ea;Ge.prev=Z,Ba(T,Ge.v),Ge.v.k!==Un.VINDEXED&&(function(Se,hn,En){let tt=Se.fs,rt=tt.freereg,St=!1;for(;hn;hn=hn.prev)hn.v.k===Un.VINDEXED&&(hn.v.u.ind.vt===En.k&&hn.v.u.ind.t===En.u.info&&(St=!0,hn.v.u.ind.vt=Un.VLOCAL,hn.v.u.ind.t=rt),En.k===Un.VLOCAL&&hn.v.u.ind.idx===En.u.info&&(St=!0,hn.v.u.ind.idx=rt));if(St){let Lr=En.k===Un.VLOCAL?l:vn;Ce(tt,Lr,rt,En.u.info,0),Nn(tt,1)}})(T,Z,Ge.v),ut(T.fs,Re+T.L.nCcalls,M,v("JS levels",!0)),Va(T,Ge,Re+1)}else{pt(T,61);let Ge=Xt(T,Qe);if(Ge===Re)return o(T.fs,Qe),void h(T.fs,Z.v,Qe);X(T,Re,Ge,Qe)}ie(Qe,Un.VNONRELOC,T.fs.freereg-1),h(T.fs,Z.v,Qe)},yl=function(T){let Z=new $n;return pr(T,Z),Z.k===Un.VNIL&&(Z.k=Un.VFALSE),rn(T.fs,Z),Z.f},Ir=function(T,Z){let Re,Qe=T.linenumber;it(T,de.TK_GOTO)?Re=L(T):(d.luaX_next(T),Re=dn(T.L,"break"));let Ge=bn(T,T.dyd.gt,Re,Qe,Z);_e(T,Ge)},na=function(T,Z,Re){let Qe,Ge=T.fs,Se=T.dyd.label;(function(hn,En,tt){for(let rt=hn.bl.firstlabel;rt<En.n;rt++)if(Dn(tt,En.arr[rt].name)){let St=be.luaO_pushfstring(hn.ls.L,v("label '%s' already defined on line %d",!0),tt.getstr(),En.arr[rt].line);Jn(hn.ls,St)}})(Ge,Se,Z),pt(T,de.TK_DBCOLON),Qe=bn(T,Se,Z,Re,Ue(Ge)),(function(hn){for(;hn.t.token===59||hn.t.token===de.TK_DBCOLON;)Pr(hn)})(T),Ne(T,0)&&(Se.arr[Qe].nactvar=Ge.bl.nactvar),Gn(T,Se.arr[Qe])},xr=function(T){let Z=new $n;return pr(T,Z),mn(T.fs,Z),Le(Z.k===Un.VNONRELOC),Z.u.info},ta=function(T,Z,Re,Qe,Ge){let Se,hn=new Pn,En=T.fs;We(T,3),pt(T,de.TK_DO);let tt=Ge?g(En,Ve,Z,oe):le(En);zn(En,hn,0),We(T,Qe),Nn(En,Qe),Jr(T),k(En),G(En,tt),Ge?Se=g(En,Fe,Z,oe):(Ce(En,m,Z,0,Qe),ee(En,Re),Se=g(En,O,Z+2,oe)),Ke(En,Se,tt+1),ee(En,Re)},go=function(T,Z){let Re=T.fs,Qe=new Pn;zn(Re,Qe,1),d.luaX_next(T);let Ge=L(T);switch(T.t.token){case 61:(function(Se,hn,En){let tt=Se.fs,rt=tt.freereg;un(Se,"(for index)"),un(Se,"(for limit)"),un(Se,"(for step)"),Tn(Se,hn),pt(Se,61),xr(Se),pt(Se,44),xr(Se),it(Se,44)?xr(Se):(S(tt,tt.freereg,Je(tt,1)),Nn(tt,1)),ta(Se,rt,En,1,1)})(T,Ge,Z);break;case 44:case de.TK_IN:(function(Se,hn){let En=Se.fs,tt=new $n,rt=4,St=En.freereg;for(un(Se,"(for generator)"),un(Se,"(for state)"),un(Se,"(for control)"),Tn(Se,hn);it(Se,44);)Tn(Se,L(Se)),rt++;pt(Se,de.TK_IN);let Lr=Se.linenumber;X(Se,3,Xt(Se,tt),tt),C(En,3),ta(Se,St,Lr,rt-3,0)})(T,Ge);break;default:d.luaX_syntaxerror(T,v("'=' or 'in' expected",!0))}wt(T,de.TK_END,de.TK_FOR,Z),k(Re)},vl=function(T,Z){let Re,Qe=new Pn,Ge=T.fs,Se=new $n;if(d.luaX_next(T),pr(T,Se),pt(T,de.TK_THEN),T.t.token===de.TK_GOTO||T.t.token===de.TK_BREAK){for(Ee(T.fs,Se),zn(Ge,Qe,!1),Ir(T,Se.t);it(T,59););if(Ne(T,0))return k(Ge),Z;Re=le(Ge)}else rn(T.fs,Se),zn(Ge,Qe,!1),Re=Se.f;return kn(T),k(Ge),T.t.token!==de.TK_ELSE&&T.t.token!==de.TK_ELSEIF||(Z=xe(Ge,Z,le(Ge))),G(Ge,Re),Z},ja=function(T,Z){let Re=new $n,Qe=new $n;d.luaX_next(T);let Ge=(function(Se,hn){let En=0;for(p(Se,hn);Se.t.token===46;)Wn(Se,hn);return Se.t.token===58&&(En=1,Wn(Se,hn)),En})(T,Re);mt(T,Qe,Ge,Z),h(T.fs,Re,Qe),ee(T.fs,Z)},Pr=function(T){let Z=T.linenumber;switch(H(T),T.t.token){case 59:d.luaX_next(T);break;case de.TK_IF:(function(Re,Qe){let Ge=Re.fs,Se=oe;for(Se=vl(Re,Se);Re.t.token===de.TK_ELSEIF;)Se=vl(Re,Se);it(Re,de.TK_ELSE)&&Jr(Re),wt(Re,de.TK_END,de.TK_IF,Qe),G(Ge,Se)})(T,Z);break;case de.TK_WHILE:(function(Re,Qe){let Ge=Re.fs,Se=new Pn;d.luaX_next(Re);let hn=Ue(Ge),En=yl(Re);zn(Ge,Se,1),pt(Re,de.TK_DO),Jr(Re),Ie(Ge,hn),wt(Re,de.TK_END,de.TK_WHILE,Qe),k(Ge),G(Ge,En)})(T,Z);break;case de.TK_DO:d.luaX_next(T),Jr(T),wt(T,de.TK_END,de.TK_DO,Z);break;case de.TK_FOR:go(T,Z);break;case de.TK_REPEAT:(function(Re,Qe){let Ge=Re.fs,Se=Ue(Ge),hn=new Pn,En=new Pn;zn(Ge,hn,1),zn(Ge,En,0),d.luaX_next(Re),kn(Re),wt(Re,de.TK_UNTIL,de.TK_REPEAT,Qe);let tt=yl(Re);En.upval&&me(Ge,tt,En.nactvar),k(Ge),Ke(Ge,tt,Se),k(Ge)})(T,Z);break;case de.TK_FUNCTION:ja(T,Z);break;case de.TK_LOCAL:d.luaX_next(T),it(T,de.TK_FUNCTION)?(function(Re){let Qe=new $n,Ge=Re.fs;Tn(Re,L(Re)),We(Re,1),mt(Re,Qe,0,Re.linenumber),_n(Ge,Qe.u.info).startpc=Ge.pc})(T):(function(Re){let Qe,Ge=0,Se=new $n;do Tn(Re,L(Re)),Ge++;while(it(Re,44));it(Re,61)?Qe=Xt(Re,Se):(Se.k=Un.VVOID,Qe=0),X(Re,Ge,Qe,Se),We(Re,Ge)})(T);break;case de.TK_DBCOLON:d.luaX_next(T),na(T,L(T),Z);break;case de.TK_RETURN:d.luaX_next(T),(function(Re){let Qe,Ge,Se=Re.fs,hn=new $n;Ne(Re,1)||Re.t.token===59?Qe=Ge=0:(Ge=Xt(Re,hn),yn(hn.k)?(ot(Se,hn),hn.k===Un.VCALL&&Ge===1&&(Bn(ze(Se,hn),c),Le(ze(Se,hn).A===Se.nactvar)),Qe=Se.nactvar,Ge=w):Ge===1?Qe=Ze(Se,hn):(mn(Se,hn),Qe=Se.nactvar,Le(Ge===Se.freereg-Qe))),In(Se,Qe,Ge),it(Re,59)})(T);break;case de.TK_BREAK:case de.TK_GOTO:Ir(T,le(T.fs));break;default:(function(Re){let Qe=Re.fs,Ge=new ea;Ba(Re,Ge.v),Re.t.token===61||Re.t.token===44?(Ge.prev=null,Va(Re,Ge,1)):(Dt(Re,Ge.v.k===Un.VCALL,v("syntax error",!0)),gn(ze(Qe,Ge.v),1))})(T)}Le(T.fs.f.maxstacksize>=T.fs.freereg&&T.fs.freereg>=T.fs.nactvar),T.fs.freereg=T.fs.nactvar,ye(T)};a.exports.Dyndata=class{constructor(){this.actvar={arr:[],n:NaN,size:NaN},this.gt=new Fn,this.label=new Fn}},a.exports.expkind=Un,a.exports.expdesc=$n,a.exports.luaY_parser=function(T,Z,Re,Qe,Ge,Se){let hn=new d.LexState,En=new ht,tt=J.luaF_newLclosure(T,1);return V.luaD_inctop(T),T.stack[T.top-1].setclLvalue(tt),hn.h=I.luaH_new(T),V.luaD_inctop(T),T.stack[T.top-1].sethvalue(hn.h),En.f=tt.p=new Me(T),En.f.source=pe(T,Ge),hn.buff=Re,hn.dyd=Qe,Qe.actvar.n=Qe.gt.n=Qe.label.n=0,d.luaX_setinput(T,hn,Z,En.f.source,Se),(function(rt,St){let Lr=new Pn,Dr=new $n;jn(rt,St,Lr),St.f.is_vararg=!0,ie(Dr,Un.VLOCAL,0),xn(St,rt.envn,Dr),d.luaX_next(rt),kn(rt),Ct(rt,de.TK_EOS),j(rt)})(hn,En),Le(!En.prev&&En.nups===1&&!hn.fs),Le(Qe.actvar.n===0&&Qe.gt.n===0&&Qe.label.n===0),delete T.stack[--T.top],tt},a.exports.vkisinreg=function(T){return T===Un.VNONRELOC||T===Un.VLOCAL}},function(a,B,f){const{LUA_MULTRET:w,LUA_OK:v,LUA_TFUNCTION:D,LUA_TNIL:R,LUA_TNONE:U,LUA_TNUMBER:z,LUA_TSTRING:b,LUA_TTABLE:K,LUA_VERSION:A,LUA_YIELD:F,lua_call:Q,lua_callk:ce,lua_concat:$,lua_error:ve,lua_getglobal:se,lua_geti:$e,lua_getmetatable:nn,lua_gettop:He,lua_insert:Xe,lua_isnil:ln,lua_isnone:P,lua_isstring:re,lua_load:Ae,lua_next:ge,lua_pcallk:Oe,lua_pop:tn,lua_pushboolean:an,lua_pushcfunction:sn,lua_pushglobaltable:ae,lua_pushinteger:oe,lua_pushliteral:ze,lua_pushnil:C,lua_pushstring:Ce,lua_pushvalue:E,lua_rawequal:g,lua_rawget:S,lua_rawlen:xe,lua_rawset:Te,lua_remove:pn,lua_replace:Ze,lua_rotate:fn,lua_setfield:mn,lua_setmetatable:q,lua_settop:ee,lua_setupvalue:Ue,lua_stringtonumber:Ee,lua_toboolean:rn,lua_tolstring:On,lua_tostring:An,lua_type:Je,lua_typename:le}=f(2),{luaL_argcheck:Ie,luaL_checkany:N,luaL_checkinteger:me,luaL_checkoption:Ke,luaL_checkstack:G,luaL_checktype:we,luaL_error:Pe,luaL_getmetafield:Nn,luaL_loadbufferx:In,luaL_loadfile:Mn,luaL_loadfilex:Zn,luaL_optinteger:ot,luaL_optstring:o,luaL_setfuncs:fe,luaL_tolstring:h,luaL_where:Y}=f(7),{to_jsstring:V,to_luastring:J}=f(5);let d,M;if(typeof TextDecoder=="function"){let s="",_=new TextDecoder("utf-8");d=function(m){s+=_.decode(m,{stream:!0})};let c=new Uint8Array(0);M=function(){s+=_.decode(c),console.log(s),s=""}}else{let s=[];d=function(_){try{_=V(_)}catch{let m=new Uint8Array(_.length);m.set(_),_=m}s.push(_)},M=function(){console.log.apply(console.log,s),s=[]}}const te=["stop","restart","collect","count","step","setpause","setstepmul","isrunning"].map(s=>J(s)),Le=function(s){return we(s,1,K),ee(s,2),ge(s,1)?2:(C(s),1)},be=function(s){let _=me(s,2)+1;return oe(s,_),$e(s,1,_)===R?1:2},De=function(s){let _=ot(s,2,1);return ee(s,1),Je(s,1)===b&&_>0&&(Y(s,_),E(s,1),$(s,2)),ve(s)},Ye=function(s,_,c){return _!==v&&_!==F?(an(s,0),E(s,-2),2):He(s)-c},Fe=function(s,_,c){return _===v?(c!==0&&(E(s,c),Ue(s,-2,1)||tn(s,1)),1):(C(s),Xe(s,-2),2)},Ve=function(s,_){return G(s,2,"too many nested functions"),E(s,1),Q(s,0,1),ln(s,-1)?(tn(s,1),null):(re(s,-1)||Pe(s,J("reader function must return a string")),Ze(s,5),An(s,5))},vn=function(s,_,c){return He(s)-1},l={assert:function(s){return rn(s,1)?He(s):(N(s,1),pn(s,1),ze(s,"assertion failed!"),ee(s,1),De(s))},collectgarbage:function(s){Ke(s,1,"collect",te),ot(s,2,0),Pe(s,J("lua_gc not implemented"))},dofile:function(s){let _=o(s,1,null);return ee(s,1),Mn(s,_)!==v?ve(s):(ce(s,0,w,0,vn),vn(s))},error:De,getmetatable:function(s){return N(s,1),nn(s,1)?(Nn(s,1,J("__metatable",!0)),1):(C(s),1)},ipairs:function(s){return N(s,1),sn(s,be),E(s,1),oe(s,0),3},load:function(s){let _,c=An(s,1),m=o(s,3,"bt"),O=P(s,4)?0:4;if(c!==null){let y=o(s,2,c);_=In(s,c,c.length,y,m)}else{let y=o(s,2,"=(load)");we(s,1,D),ee(s,5),_=Ae(s,Ve,null,y,m)}return Fe(s,_,O)},loadfile:function(s){let _=o(s,1,null),c=o(s,2,null),m=P(s,3)?0:3,O=Zn(s,_,c);return Fe(s,O,m)},next:Le,pairs:function(s){return(function(_,c,m,O){return N(_,1),Nn(_,1,c)===R?(sn(_,O),E(_,1),C(_)):(E(_,1),Q(_,1,3)),3})(s,J("__pairs",!0),0,Le)},pcall:function(s){N(s,1),an(s,1),Xe(s,1);let _=Oe(s,He(s)-2,w,0,0,Ye);return Ye(s,_,0)},print:function(s){let _=He(s);se(s,J("tostring",!0));for(let c=1;c<=_;c++){E(s,-1),E(s,c),Q(s,1,1);let m=On(s,-1);if(m===null)return Pe(s,J("'tostring' must return a string to 'print'"));c>1&&d(J("	")),d(m),tn(s,1)}return M(),0},rawequal:function(s){return N(s,1),N(s,2),an(s,g(s,1,2)),1},rawget:function(s){return we(s,1,K),N(s,2),ee(s,2),S(s,1),1},rawlen:function(s){let _=Je(s,1);return Ie(s,_===K||_===b,1,"table or string expected"),oe(s,xe(s,1)),1},rawset:function(s){return we(s,1,K),N(s,2),N(s,3),ee(s,3),Te(s,1),1},select:function(s){let _=He(s);if(Je(s,1)===b&&An(s,1)[0]===35)return oe(s,_-1),1;{let c=me(s,1);return c<0?c=_+c:c>_&&(c=_),Ie(s,1<=c,1,"index out of range"),_-c}},setmetatable:function(s){let _=Je(s,2);return we(s,1,K),Ie(s,_===R||_===K,2,"nil or table expected"),Nn(s,1,J("__metatable",!0))!==R?Pe(s,J("cannot change a protected metatable")):(ee(s,2),q(s,1),1)},tonumber:function(s){if(Je(s,2)<=0){if(N(s,1),Je(s,1)===z)return ee(s,1),1;{let _=An(s,1);if(_!==null&&Ee(s,_)===_.length+1)return 1}}else{let _=me(s,2);we(s,1,b);let c=An(s,1);Ie(s,2<=_&&_<=36,2,"base out of range");let m=(function(O,y){try{O=V(O)}catch{return null}let ne=/^[\t\v\f \n\r]*([+-]?)0*([0-9A-Za-z]+)[\t\v\f \n\r]*$/.exec(O);if(!ne)return null;let en=parseInt(ne[1]+ne[2],y);return isNaN(en)?null:0|en})(c,_);if(m!==null)return oe(s,m),1}return C(s),1},tostring:function(s){return N(s,1),h(s,1),1},type:function(s){let _=Je(s,1);return Ie(s,_!==U,1,"value expected"),Ce(s,le(s,_)),1},xpcall:function(s){let _=He(s);we(s,2,D),an(s,1),E(s,1),fn(s,3,2);let c=Oe(s,_-2,w,2,2,Ye);return Ye(s,c,2)}};a.exports.luaopen_base=function(s){return ae(s),fe(s,l,0),E(s,-1),mn(s,-2,J("_G")),ze(s,A),mn(s,-2,J("_VERSION")),1}},function(a,B,f){const{LUA_OK:w,LUA_TFUNCTION:v,LUA_TSTRING:D,LUA_YIELD:R,lua_Debug:U,lua_checkstack:z,lua_concat:b,lua_error:K,lua_getstack:A,lua_gettop:F,lua_insert:Q,lua_isyieldable:ce,lua_newthread:$,lua_pop:ve,lua_pushboolean:se,lua_pushcclosure:$e,lua_pushliteral:nn,lua_pushthread:He,lua_pushvalue:Xe,lua_resume:ln,lua_status:P,lua_tothread:re,lua_type:Ae,lua_upvalueindex:ge,lua_xmove:Oe,lua_yield:tn}=f(2),{luaL_argcheck:an,luaL_checktype:sn,luaL_newlib:ae,luaL_where:oe}=f(7),ze=function(S){let xe=re(S,1);return an(S,xe,1,"thread expected"),xe},C=function(S,xe,Te){if(!z(xe,Te))return nn(S,"too many arguments to resume"),-1;if(P(xe)===w&&F(xe)===0)return nn(S,"cannot resume dead coroutine"),-1;Oe(S,xe,Te);let pn=ln(xe,S,Te);if(pn===w||pn===R){let Ze=F(xe);return z(S,Ze+1)?(Oe(xe,S,Ze),Ze):(ve(xe,Ze),nn(S,"too many results to resume"),-1)}return Oe(xe,S,1),-1},Ce=function(S){let xe=re(S,ge(1)),Te=C(S,xe,F(S));return Te<0?(Ae(S,-1)===D&&(oe(S,1),Q(S,-2),b(S,2)),K(S)):Te},E=function(S){sn(S,1,v);let xe=$(S);return Xe(S,1),Oe(S,xe,1),1},g={create:E,isyieldable:function(S){return se(S,ce(S)),1},resume:function(S){let xe=ze(S),Te=C(S,xe,F(S)-1);return Te<0?(se(S,0),Q(S,-2),2):(se(S,1),Q(S,-(Te+1)),Te+1)},running:function(S){return se(S,He(S)),2},status:function(S){let xe=ze(S);if(S===xe)nn(S,"running");else switch(P(xe)){case R:nn(S,"suspended");break;case w:{let Te=new U;A(xe,0,Te)>0?nn(S,"normal"):F(xe)===0?nn(S,"dead"):nn(S,"suspended");break}default:nn(S,"dead")}return 1},wrap:function(S){return E(S),$e(S,Ce,1),1},yield:function(S){return tn(S,F(S))}};a.exports.luaopen_coroutine=function(S){return ae(S,g),1}},function(a,B,f){const{LUA_MAXINTEGER:w}=f(3),{LUA_OPEQ:v,LUA_OPLT:D,LUA_TFUNCTION:R,LUA_TNIL:U,LUA_TTABLE:z,lua_call:b,lua_checkstack:K,lua_compare:A,lua_createtable:F,lua_geti:Q,lua_getmetatable:ce,lua_gettop:$,lua_insert:ve,lua_isnil:se,lua_isnoneornil:$e,lua_isstring:nn,lua_pop:He,lua_pushinteger:Xe,lua_pushnil:ln,lua_pushstring:P,lua_pushvalue:re,lua_rawget:Ae,lua_setfield:ge,lua_seti:Oe,lua_settop:tn,lua_toboolean:an,lua_type:sn}=f(2),{luaL_Buffer:ae,luaL_addlstring:oe,luaL_addvalue:ze,luaL_argcheck:C,luaL_buffinit:Ce,luaL_checkinteger:E,luaL_checktype:g,luaL_error:S,luaL_len:xe,luaL_newlib:Te,luaL_opt:pn,luaL_optinteger:Ze,luaL_optlstring:fn,luaL_pushresult:mn,luaL_typename:q}=f(7),ee=f(17),{to_luastring:Ue}=f(5),Ee=function(G,we,Pe){return P(G,we),Ae(G,-Pe)!==U},rn=function(G,we,Pe){if(sn(G,we)!==z){let Nn=1;!ce(G,we)||1&Pe&&!Ee(G,Ue("__index",!0),++Nn)||2&Pe&&!Ee(G,Ue("__newindex",!0),++Nn)||4&Pe&&!Ee(G,Ue("__len",!0),++Nn)?g(G,we,z):He(G,Nn)}},On=function(G,we,Pe){return rn(G,we,4|Pe),xe(G,we)},An=function(G,we,Pe){Q(G,1,Pe),nn(G,-1)||S(G,Ue("invalid value (%s) at index %d in table for 'concat'"),q(G,-1),Pe),ze(we)},Je=function(G,we,Pe){Oe(G,1,we),Oe(G,1,Pe)},le=function(G,we,Pe){if(se(G,2))return A(G,we,Pe,D);{re(G,2),re(G,we-1),re(G,Pe-2),b(G,2,1);let Nn=an(G,-1);return He(G,1),Nn}},Ie=function(G,we,Pe){let Nn=we,In=Pe-1;for(;;){for(;Q(G,1,++Nn),le(G,-1,-2);)Nn==Pe-1&&S(G,Ue("invalid order function for sorting")),He(G,1);for(;Q(G,1,--In),le(G,-3,-1);)In<Nn&&S(G,Ue("invalid order function for sorting")),He(G,1);if(In<Nn)return He(G,1),Je(G,Pe-1,Nn),Nn;Je(G,Nn,In)}},N=function(G,we,Pe){let Nn=Math.floor((we-G)/4),In=Pe%(2*Nn)+(G+Nn);return ee.lua_assert(G+Nn<=In&&In<=we-Nn),In},me=function(G,we,Pe,Nn){for(;we<Pe;){if(Q(G,1,we),Q(G,1,Pe),le(G,-1,-2)?Je(G,we,Pe):He(G,2),Pe-we==1)return;let In,Mn;if(In=Pe-we<100||Nn===0?Math.floor((we+Pe)/2):N(we,Pe,Nn),Q(G,1,In),Q(G,1,we),le(G,-2,-1)?Je(G,In,we):(He(G,1),Q(G,1,Pe),le(G,-1,-2)?Je(G,In,Pe):He(G,2)),Pe-we==2)return;Q(G,1,In),re(G,-1),Q(G,1,Pe-1),Je(G,In,Pe-1),(In=Ie(G,we,Pe))-we<Pe-In?(me(G,we,In-1,Nn),Mn=In-we,we=In+1):(me(G,In+1,Pe,Nn),Mn=Pe-In,Pe=In-1),(Pe-we)/128>Mn&&(Nn=Math.floor(4294967296*Math.random()))}},Ke={concat:function(G){let we=On(G,1,1),Pe=fn(G,2,""),Nn=Pe.length,In=Ze(G,3,1);we=Ze(G,4,we);let Mn=new ae;for(Ce(G,Mn);In<we;In++)An(G,Mn,In),oe(Mn,Pe,Nn);return In===we&&An(G,Mn,In),mn(Mn),1},insert:function(G){let we,Pe=On(G,1,3)+1;switch($(G)){case 2:we=Pe;break;case 3:we=E(G,2),C(G,1<=we&&we<=Pe,2,"position out of bounds");for(let Nn=Pe;Nn>we;Nn--)Q(G,1,Nn-1),Oe(G,1,Nn);break;default:return S(G,"wrong number of arguments to 'insert'")}return Oe(G,1,we),0},move:function(G){let we=E(G,2),Pe=E(G,3),Nn=E(G,4),In=$e(G,5)?1:5;if(rn(G,1,1),rn(G,In,2),Pe>=we){C(G,we>0||Pe<w+we,3,"too many elements to move");let Mn=Pe-we+1;if(C(G,Nn<=w-Mn+1,4,"destination wrap around"),Nn>Pe||Nn<=we||In!==1&&A(G,1,In,v)!==1)for(let Zn=0;Zn<Mn;Zn++)Q(G,1,we+Zn),Oe(G,In,Nn+Zn);else for(let Zn=Mn-1;Zn>=0;Zn--)Q(G,1,we+Zn),Oe(G,In,Nn+Zn)}return re(G,In),1},pack:function(G){let we=$(G);F(G,we,1),ve(G,1);for(let Pe=we;Pe>=1;Pe--)Oe(G,1,Pe);return Xe(G,we),ge(G,1,Ue("n")),1},remove:function(G){let we=On(G,1,3),Pe=Ze(G,2,we);for(Pe!==we&&C(G,1<=Pe&&Pe<=we+1,1,"position out of bounds"),Q(G,1,Pe);Pe<we;Pe++)Q(G,1,Pe+1),Oe(G,1,Pe);return ln(G),Oe(G,1,Pe),1},sort:function(G){let we=On(G,1,3);return we>1&&(C(G,we<w,1,"array too big"),$e(G,2)||g(G,2,R),tn(G,2),me(G,1,we,0)),0},unpack:function(G){let we=Ze(G,2,1),Pe=pn(G,E,3,xe(G,1));if(we>Pe)return 0;let Nn=Pe-we;if(Nn>=Number.MAX_SAFE_INTEGER||!K(G,++Nn))return S(G,Ue("too many results to unpack"));for(;we<Pe;we++)Q(G,1,we);return Q(G,1,Pe),Nn}};a.exports.luaopen_table=function(G){return Te(G,Ke),1}},function(a,B,f){const{LUA_TNIL:w,LUA_TTABLE:v,lua_close:D,lua_createtable:R,lua_getfield:U,lua_isboolean:z,lua_isnoneornil:b,lua_pop:K,lua_pushboolean:A,lua_pushfstring:F,lua_pushinteger:Q,lua_pushliteral:ce,lua_pushnil:$,lua_pushnumber:ve,lua_pushstring:se,lua_setfield:$e,lua_settop:nn,lua_toboolean:He,lua_tointegerx:Xe}=f(2),{luaL_Buffer:ln,luaL_addchar:P,luaL_addstring:re,luaL_argerror:Ae,luaL_buffinit:ge,luaL_checkinteger:Oe,luaL_checkstring:tn,luaL_checktype:an,luaL_error:sn,luaL_execresult:ae,luaL_fileresult:oe,luaL_newlib:ze,luaL_optinteger:C,luaL_optlstring:Ce,luaL_optstring:E,luaL_pushresult:g}=f(7),{luastring_eq:S,to_jsstring:xe,to_luastring:Te}=f(5),pn=Te("aAbBcCdDeFhHIjklmMnpPrRStTuUwWxXyYzZ%"),Ze=function(le,Ie,N){Q(le,N),$e(le,-2,Te(Ie,!0))},fn=function(le,Ie,N){Ze(le,"sec",N?Ie.getUTCSeconds():Ie.getSeconds()),Ze(le,"min",N?Ie.getUTCMinutes():Ie.getMinutes()),Ze(le,"hour",N?Ie.getUTCHours():Ie.getHours()),Ze(le,"day",N?Ie.getUTCDate():Ie.getDate()),Ze(le,"month",(N?Ie.getUTCMonth():Ie.getMonth())+1),Ze(le,"year",N?Ie.getUTCFullYear():Ie.getFullYear()),Ze(le,"wday",(N?Ie.getUTCDay():Ie.getDay())+1),Ze(le,"yday",Math.floor((Ie-new Date(Ie.getFullYear(),0,0))/864e5))},mn=Number.MAX_SAFE_INTEGER/2,q=function(le,Ie,N,me){let Ke=U(le,-1,Te(Ie,!0)),G=Xe(le,-1);if(G===!1){if(Ke!==w)return sn(le,Te("field '%s' is not an integer"),Ie);if(N<0)return sn(le,Te("field '%s' missing in date table"),Ie);G=N}else{if(!(-mn<=G&&G<=mn))return sn(le,Te("field '%s' is out-of-bound"),Ie);G-=me}return K(le,1),G},ee={days:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map(le=>Te(le)),shortDays:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(le=>Te(le)),months:["January","February","March","April","May","June","July","August","September","October","November","December"].map(le=>Te(le)),shortMonths:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(le=>Te(le)),AM:Te("AM"),PM:Te("PM"),am:Te("am"),pm:Te("pm"),formats:{c:Te("%a %b %e %H:%M:%S %Y"),D:Te("%m/%d/%y"),F:Te("%Y-%m-%d"),R:Te("%H:%M"),r:Te("%I:%M:%S %p"),T:Te("%H:%M:%S"),X:Te("%T"),x:Te("%D")}},Ue=function(le,Ie){let N=le.getDay();Ie==="monday"&&(N===0?N=6:N--);let me=(le-new Date(le.getFullYear(),0,1))/864e5;return Math.floor((me+7-N)/7)},Ee=function(le,Ie,N){Ie<10&&P(le,N),re(le,Te(String(Ie)))},rn=function(le,Ie,N,me){let Ke=0;for(;Ke<N.length;)if(N[Ke]!==37)P(Ie,N[Ke++]);else{let G=On(le,N,++Ke);switch(N[Ke]){case 37:P(Ie,37);break;case 65:re(Ie,ee.days[me.getDay()]);break;case 66:re(Ie,ee.months[me.getMonth()]);break;case 67:Ee(Ie,Math.floor(me.getFullYear()/100),48);break;case 68:rn(le,Ie,ee.formats.D,me);break;case 70:rn(le,Ie,ee.formats.F,me);break;case 72:Ee(Ie,me.getHours(),48);break;case 73:Ee(Ie,(me.getHours()+11)%12+1,48);break;case 77:Ee(Ie,me.getMinutes(),48);break;case 80:re(Ie,me.getHours()<12?ee.am:ee.pm);break;case 82:rn(le,Ie,ee.formats.R,me);break;case 83:Ee(Ie,me.getSeconds(),48);break;case 84:rn(le,Ie,ee.formats.T,me);break;case 85:Ee(Ie,Ue(me,"sunday"),48);break;case 87:Ee(Ie,Ue(me,"monday"),48);break;case 88:rn(le,Ie,ee.formats.X,me);break;case 89:re(Ie,Te(String(me.getFullYear())));break;case 90:{let we=me.toString().match(/\(([\w\s]+)\)/);we&&re(Ie,Te(we[1]));break}case 97:re(Ie,ee.shortDays[me.getDay()]);break;case 98:case 104:re(Ie,ee.shortMonths[me.getMonth()]);break;case 99:rn(le,Ie,ee.formats.c,me);break;case 100:Ee(Ie,me.getDate(),48);break;case 101:Ee(Ie,me.getDate(),32);break;case 106:{let we=Math.floor((me-new Date(me.getFullYear(),0,1))/864e5);we<100&&(we<10&&P(Ie,48),P(Ie,48)),re(Ie,Te(String(we)));break}case 107:Ee(Ie,me.getHours(),32);break;case 108:Ee(Ie,(me.getHours()+11)%12+1,32);break;case 109:Ee(Ie,me.getMonth()+1,48);break;case 110:P(Ie,10);break;case 112:re(Ie,me.getHours()<12?ee.AM:ee.PM);break;case 114:rn(le,Ie,ee.formats.r,me);break;case 115:re(Ie,Te(String(Math.floor(me/1e3))));break;case 116:P(Ie,8);break;case 117:{let we=me.getDay();re(Ie,Te(String(we===0?7:we)));break}case 119:re(Ie,Te(String(me.getDay())));break;case 120:rn(le,Ie,ee.formats.x,me);break;case 121:Ee(Ie,me.getFullYear()%100,48);break;case 122:{let we=me.getTimezoneOffset();we>0?P(Ie,45):(we=-we,P(Ie,43)),Ee(Ie,Math.floor(we/60),48),Ee(Ie,we%60,48);break}}Ke+=G}},On=function(le,Ie,N){let me=pn,Ke=0,G=1;for(;Ke<me.length&&G<=Ie.length-N;Ke+=G)if(me[Ke]===124)G++;else if(S(Ie.subarray(N,N+G),me.subarray(Ke,Ke+G)))return G;Ae(le,1,F(le,Te("invalid conversion specifier '%%%s'"),Ie))},An=function(le,Ie){return Oe(le,Ie)},Je={date:function(le){let Ie=Ce(le,1,"%c"),N=b(le,2)?new Date:new Date(1e3*An(le,2)),me=!1,Ke=0;if(Ie[Ke]===33&&(me=!0,Ke++),Ie[Ke]===42&&Ie[Ke+1]===116)R(le,0,9),fn(le,N,me);else{new Uint8Array(4)[0]=37;let G=new ln;ge(le,G),rn(le,G,Ie,N),g(G)}return 1},difftime:function(le){let Ie=An(le,1),N=An(le,2);return ve(le,Ie-N),1},time:function(le){let Ie;return b(le,1)?Ie=new Date:(an(le,1,v),nn(le,1),Ie=new Date(q(le,"year",-1,0),q(le,"month",-1,1),q(le,"day",-1,0),q(le,"hour",12,0),q(le,"min",0,0),q(le,"sec",0,0)),fn(le,Ie)),Q(le,Math.floor(Ie/1e3)),1},clock:function(le){return ve(le,performance.now()/1e3),1}};a.exports.luaopen_os=function(le){return ze(le,Je),1}},function(a,B,f){const{sprintf:w}=f(38),{LUA_INTEGER_FMT:v,LUA_INTEGER_FRMLEN:D,LUA_MININTEGER:R,LUA_NUMBER_FMT:U,LUA_NUMBER_FRMLEN:z,frexp:b,lua_getlocaledecpoint:K}=f(3),{LUA_TBOOLEAN:A,LUA_TFUNCTION:F,LUA_TNIL:Q,LUA_TNUMBER:ce,LUA_TSTRING:$,LUA_TTABLE:ve,lua_call:se,lua_createtable:$e,lua_dump:nn,lua_gettable:He,lua_gettop:Xe,lua_isinteger:ln,lua_isstring:P,lua_pop:re,lua_pushcclosure:Ae,lua_pushinteger:ge,lua_pushlightuserdata:Oe,lua_pushliteral:tn,lua_pushlstring:an,lua_pushnil:sn,lua_pushnumber:ae,lua_pushstring:oe,lua_pushvalue:ze,lua_remove:C,lua_setfield:Ce,lua_setmetatable:E,lua_settop:g,lua_toboolean:S,lua_tointeger:xe,lua_tonumber:Te,lua_tostring:pn,lua_touserdata:Ze,lua_type:fn,lua_upvalueindex:mn}=f(2),{luaL_Buffer:q,luaL_addchar:ee,luaL_addlstring:Ue,luaL_addsize:Ee,luaL_addstring:rn,luaL_addvalue:On,luaL_argcheck:An,luaL_argerror:Je,luaL_buffinit:le,luaL_buffinitsize:Ie,luaL_checkinteger:N,luaL_checknumber:me,luaL_checkstack:Ke,luaL_checkstring:G,luaL_checktype:we,luaL_error:Pe,luaL_newlib:Nn,luaL_optinteger:In,luaL_optstring:Mn,luaL_prepbuffsize:Zn,luaL_pushresult:ot,luaL_pushresultsize:o,luaL_tolstring:fe,luaL_typename:h}=f(7),Y=f(17),{luastring_eq:V,luastring_indexOf:J,to_jsstring:d,to_luastring:M}=f(5),te=37,Le=function(p){let X=J(p,0);return X>-1?X:p.length},be=function(p,X){return p>=0?p:0-p>X?0:X+p+1},De=function(p,X,H,ye){return Ue(ye,X,H),0},Ye=z.length+1,Fe=function(p,X,H){let ye=(function(he){if(Object.is(he,1/0))return M("inf");if(Object.is(he,-1/0))return M("-inf");if(Number.isNaN(he))return M("nan");if(he===0){let _e=w(U+"x0p+0",he);return Object.is(he,-0)&&(_e="-"+_e),M(_e)}{let _e="",bn=b(he),Gn=bn[0],zn=bn[1];return Gn<0&&(_e+="-",Gn=-Gn),_e+="0x",_e+=(2*Gn).toString(16),_e+=w("p%+d",zn-=1),M(_e)}})(H);if(X[Ye]===65)for(let he=0;he<ye.length;he++){let _e=ye[he];_e>=97&&(ye[he]=223&_e)}else X[Ye]!==97&&Pe(p,M("modifiers for format '%%a'/'%%A' not implemented"));return ye},Ve=M("-+ #0"),vn=p=>97<=p&&p<=122||65<=p&&p<=90,l=p=>48<=p&&p<=57,s=p=>0<=p&&p<=31||p===127,_=p=>33<=p&&p<=126,c=p=>97<=p&&p<=122,m=p=>65<=p&&p<=90,O=p=>97<=p&&p<=122||65<=p&&p<=90||48<=p&&p<=57,y=p=>_(p)&&!O(p),ne=p=>p===32||p>=9&&p<=13,en=p=>48<=p&&p<=57||65<=p&&p<=70||97<=p&&p<=102,gn=function(p,X,H){switch(fn(p,H)){case $:{let ye=pn(p,H);(function(he,_e,bn){ee(he,34);let Gn=0;for(;bn--;){if(_e[Gn]===34||_e[Gn]===92||_e[Gn]===10)ee(he,92),ee(he,_e[Gn]);else if(s(_e[Gn])){let zn=""+_e[Gn];l(_e[Gn+1])&&(zn="0".repeat(3-zn.length)+zn),rn(he,M("\\"+zn))}else ee(he,_e[Gn]);Gn++}ee(he,34)})(X,ye,ye.length);break}case ce:{let ye;if(ln(p,H)){let he=xe(p,H);ye=M(w(he===R?"0x%"+D+"x":v,he))}else{let he=Te(p,H);(function(_e){if(J(_e,46)<0){let bn=K(),Gn=J(_e,bn);Gn&&(_e[Gn]=46)}})(ye=Fe(p,M(`%${D}a`),he))}rn(X,ye);break}case Q:case A:fe(p,H),On(X);break;default:Je(p,H,M("value has no literal form"))}},Bn=function(p,X,H,ye){let he=H;for(;X[he]!==0&&J(Ve,X[he])>=0;)he++;he-H>=Ve.length&&Pe(p,M("invalid format (repeated flags)")),l(X[he])&&he++,l(X[he])&&he++,X[he]===46&&(l(X[++he])&&he++,l(X[he])&&he++),l(X[he])&&Pe(p,M("invalid format (width or precision too long)")),ye[0]=37;for(let _e=0;_e<he-H+1;_e++)ye[_e+1]=X[H+_e];return he},Hn=function(p,X){let H=p.length,ye=X.length,he=p[H-1];for(let _e=0;_e<ye;_e++)p[_e+H-1]=X[_e];p[H+ye-1]=he};class pe{constructor(X){this.L=X,this.islittle=!0,this.maxalign=1}}const dn=l,I=function(p,X){if(p.off>=p.s.length||!dn(p.s[p.off]))return X;{let H=0;do H=10*H+(p.s[p.off++]-48);while(p.off<p.s.length&&dn(p.s[p.off])&&H<=2147483638e-1);return H}},Me=function(p,X,H){let ye=I(X,H);return(ye>16||ye<=0)&&Pe(p.L,M("integral size (%d) out of limits [1,%d]"),ye,16),ye},de=function(p,X){let H={opt:X.s[X.off++],size:0};switch(H.opt){case 98:return H.size=1,H.opt=0,H;case 66:return H.size=1,H.opt=1,H;case 104:return H.size=2,H.opt=0,H;case 72:return H.size=2,H.opt=1,H;case 108:return H.size=4,H.opt=0,H;case 76:return H.size=4,H.opt=1,H;case 106:return H.size=4,H.opt=0,H;case 74:case 84:return H.size=4,H.opt=1,H;case 102:return H.size=4,H.opt=2,H;case 100:case 110:return H.size=8,H.opt=2,H;case 105:return H.size=Me(p,X,4),H.opt=0,H;case 73:return H.size=Me(p,X,4),H.opt=1,H;case 115:return H.size=Me(p,X,4),H.opt=4,H;case 99:return H.size=I(X,-1),H.size===-1&&Pe(p.L,M("missing size for format option 'c'")),H.opt=3,H;case 122:return H.opt=5,H;case 120:return H.size=1,H.opt=6,H;case 88:return H.opt=7,H;case 32:break;case 60:p.islittle=!0;break;case 62:p.islittle=!1;break;case 61:p.islittle=!0;break;case 33:p.maxalign=Me(p,X,8);break;default:Pe(p.L,M("invalid format option '%c'"),H.opt)}return H.opt=8,H},yn=function(p,X,H){let ye={opt:NaN,size:NaN,ntoalign:NaN},he=de(p,H);ye.size=he.size,ye.opt=he.opt;let _e=ye.size;if(ye.opt===7)if(H.off>=H.s.length||H.s[H.off]===0)Je(p.L,1,M("invalid next option for option 'X'"));else{let bn=de(p,H);_e=bn.size,(bn=bn.opt)!==3&&_e!==0||Je(p.L,1,M("invalid next option for option 'X'"))}return _e<=1||ye.opt===3?ye.ntoalign=0:(_e>p.maxalign&&(_e=p.maxalign),(_e&_e-1)!=0&&Je(p.L,1,M("format asks for alignment not power of 2")),ye.ntoalign=_e-(X&_e-1)&_e-1),ye},Dn=function(p,X,H,ye,he){let _e=Zn(p,ye);_e[H?0:ye-1]=255&X;for(let bn=1;bn<ye;bn++)X>>=8,_e[H?bn:ye-1-bn]=255&X;if(he&&ye>4)for(let bn=4;bn<ye;bn++)_e[H?bn:ye-1-bn]=255;Ee(p,ye)},Pn=function(p,X,H,ye,he){let _e=0,bn=ye<=4?ye:4;for(let Gn=bn-1;Gn>=0;Gn--)_e<<=8,_e|=X[H?Gn:ye-1-Gn];if(ye<4){if(he){let Gn=1<<8*ye-1;_e=(_e^Gn)-Gn}}else if(ye>4){let Gn=!he||_e>=0?0:255;for(let zn=bn;zn<ye;zn++)X[H?zn:ye-1-zn]!==Gn&&Pe(p,M("%d-byte integer does not fit into Lua Integer"),ye)}return _e},Un=function(p,X,H,ye){Y.lua_assert(X.length>=ye);let he=new DataView(new ArrayBuffer(ye));for(let _e=0;_e<ye;_e++)he.setUint8(_e,X[_e],H);return ye==4?he.getFloat32(0,H):he.getFloat64(0,H)},$n=M("^$*+?.([%-");class ht{constructor(X){this.src=null,this.src_init=null,this.src_end=null,this.p=null,this.p_end=null,this.L=X,this.matchdepth=NaN,this.level=NaN,this.capture=[]}}const Fn=function(p,X){switch(p.p[X++]){case te:return X===p.p_end&&Pe(p.L,M("malformed pattern (ends with '%%')")),X+1;case 91:p.p[X]===94&&X++;do X===p.p_end&&Pe(p.L,M("malformed pattern (missing ']')")),p.p[X++]===te&&X<p.p_end&&X++;while(p.p[X]!==93);return X+1;default:return X}},Jn=function(p,X){switch(X){case 97:return vn(p);case 65:return!vn(p);case 99:return s(p);case 67:return!s(p);case 100:return l(p);case 68:return!l(p);case 103:return _(p);case 71:return!_(p);case 108:return c(p);case 76:return!c(p);case 112:return y(p);case 80:return!y(p);case 115:return ne(p);case 83:return!ne(p);case 117:return m(p);case 85:return!m(p);case 119:return O(p);case 87:return!O(p);case 120:return en(p);case 88:return!en(p);case 122:return p===0;case 90:return p!==0;default:return X===p}},Vn=function(p,X,H,ye){let he=!0;for(p.p[H+1]===94&&(he=!1,H++);++H<ye;)if(p.p[H]===te){if(H++,Jn(X,p.p[H]))return he}else if(p.p[H+1]===45&&H+2<ye){if(H+=2,p.p[H-2]<=X&&X<=p.p[H])return he}else if(p.p[H]===X)return he;return!he},ut=function(p,X,H,ye){if(X>=p.src_end)return!1;{let he=p.src[X];switch(p.p[H]){case 46:return!0;case te:return Jn(he,p.p[H+1]);case 91:return Vn(p,he,H,ye-1);default:return p.p[H]===he}}},it=function(p,X,H){if(H>=p.p_end-1&&Pe(p.L,M("malformed pattern (missing arguments to '%%b'")),p.src[X]!==p.p[H])return null;{let ye=p.p[H],he=p.p[H+1],_e=1;for(;++X<p.src_end;)if(p.src[X]===he){if(--_e==0)return X+1}else p.src[X]===ye&&_e++}return null},Ct=function(p,X,H,ye){let he=0;for(;ut(p,X+he,H,ye);)he++;for(;he>=0;){let _e=ie(p,X+he,ye+1);if(_e)return _e;he--}return null},pt=function(p,X,H,ye){for(;;){let he=ie(p,X,ye+1);if(he!==null)return he;if(!ut(p,X,H,ye))return null;X++}},Dt=function(p,X,H,ye){let he,_e=p.level;return _e>=32&&Pe(p.L,M("too many captures")),p.capture[_e]=p.capture[_e]?p.capture[_e]:{},p.capture[_e].init=X,p.capture[_e].len=ye,p.level=_e+1,(he=ie(p,X,H))===null&&p.level--,he},wt=function(p,X,H){let ye,he=(function(_e){let bn=_e.level;for(bn--;bn>=0;bn--)if(_e.capture[bn].len===-1)return bn;return Pe(_e.L,M("invalid pattern capture"))})(p);return p.capture[he].len=X-p.capture[he].init,(ye=ie(p,X,H))===null&&(p.capture[he].len=-1),ye},L=function(p,X,H){H=(function(he,_e){return(_e-=49)<0||_e>=he.level||he.capture[_e].len===-1?Pe(he.L,M("invalid capture index %%%d"),_e+1):_e})(p,H);let ye=p.capture[H].len;return p.src_end-X>=ye&&(function(he,_e,bn,Gn,zn){return V(he.subarray(_e,_e+zn),bn.subarray(Gn,Gn+zn))})(p.src,p.capture[H].init,p.src,X,ye)?X+ye:null},ie=function(p,X,H){let ye=!1,he=!0;for(p.matchdepth--==0&&Pe(p.L,M("pattern too complex"));he||ye;)if(he=!1,H!==p.p_end)switch(ye?void 0:p.p[H]){case 40:X=p.p[H+1]===41?Dt(p,X,H+2,-2):Dt(p,X,H+1,-1);break;case 41:X=wt(p,X,H+1);break;case 36:if(H+1!==p.p_end){ye=!0;break}X=p.src.length-X==0?X:null;break;case te:switch(p.p[H+1]){case 98:(X=it(p,X,H+2))!==null&&(H+=4,he=!0);break;case 102:{H+=2,p.p[H]!==91&&Pe(p.L,M("missing '[' after '%%f' in pattern"));let _e=Fn(p,H),bn=X===p.src_init?0:p.src[X-1];if(!Vn(p,bn,H,_e-1)&&Vn(p,X===p.src_end?0:p.src[X],H,_e-1)){H=_e,he=!0;break}X=null;break}case 48:case 49:case 50:case 51:case 52:case 53:case 54:case 55:case 56:case 57:(X=L(p,X,p.p[H+1]))!==null&&(H+=2,he=!0);break;default:ye=!0}break;default:{ye=!1;let _e=Fn(p,H);if(ut(p,X,H,_e))switch(p.p[_e]){case 63:{let bn;(bn=ie(p,X+1,_e+1))!==null?X=bn:(H=_e+1,he=!0);break}case 43:X++;case 42:X=Ct(p,X,H,_e);break;case 45:X=pt(p,X,H,_e);break;default:X++,H=_e,he=!0}else{if(p.p[_e]===42||p.p[_e]===63||p.p[_e]===45){H=_e+1,he=!0;break}X=null}break}}return p.matchdepth++,X},cn=function(p,X,H,ye){if(X>=p.level)X===0?an(p.L,p.src.subarray(H,ye),ye-H):Pe(p.L,M("invalid capture index %%%d"),X+1);else{let he=p.capture[X].len;he===-1&&Pe(p.L,M("unfinished capture")),he===-2?ge(p.L,p.capture[X].init-p.src_init+1):an(p.L,p.src.subarray(p.capture[X].init),he)}},on=function(p,X,H){let ye=p.level===0&&p.src.subarray(X)?1:p.level;Ke(p.L,ye,"too many captures");for(let he=0;he<ye;he++)cn(p,he,X,H);return ye},Tn=function(p,X,H,ye,he,_e){p.L=X,p.matchdepth=200,p.src=H,p.src_init=0,p.src_end=ye,p.p=he,p.p_end=_e},un=function(p){p.level=0,Y.lua_assert(p.matchdepth===200)},_n=function(p,X){let H=G(p,1),ye=G(p,2),he=H.length,_e=ye.length,bn=be(In(p,3,1),he);if(bn<1)bn=1;else if(bn>he+1)return sn(p),1;if(X&&(S(p,4)||(function(Gn,zn){for(let jn=0;jn<zn;jn++)if(J($n,Gn[jn])!==-1)return!1;return!0})(ye,_e))){let Gn=(function(zn,jn,k){var j=k>>>0,Ne=jn.length;if(Ne===0)return j;for(;(j=zn.indexOf(jn[0],j))!==-1;j++)if(V(zn.subarray(j,j+Ne),jn))return j;return-1})(H.subarray(bn-1),ye,0);if(Gn>-1)return ge(p,bn+Gn),ge(p,bn+Gn+_e-1),2}else{let Gn=new ht(p),zn=bn-1,jn=ye[0]===94;jn&&(ye=ye.subarray(1),_e--),Tn(Gn,p,H,he,ye,_e);do{let k;if(un(Gn),(k=ie(Gn,zn,0))!==null)return X?(ge(p,zn+1),ge(p,k),on(Gn,null,0)+2):on(Gn,zn,k)}while(zn++<Gn.src_end&&!jn)}return sn(p),1},We=function(p){let X=Ze(p,mn(3));X.ms.L=p;for(let H=X.src;H<=X.ms.src_end;H++){let ye;if(un(X.ms),(ye=ie(X.ms,H,X.p))!==null&&ye!==X.lastmatch)return X.src=X.lastmatch=ye,on(X.ms,H,ye)}return 0},xn=function(p,X,H,ye,he){let _e=p.L;switch(he){case F:{ze(_e,3);let bn=on(p,H,ye);se(_e,bn,1);break}case ve:cn(p,0,H,ye),He(_e,3);break;default:return void(function(bn,Gn,zn,jn){let k=bn.L,j=pn(k,3),Ne=j.length;for(let kn=0;kn<Ne;kn++)j[kn]!==te?ee(Gn,j[kn]):l(j[++kn])?j[kn]===48?Ue(Gn,bn.src.subarray(zn,jn),jn-zn):(cn(bn,j[kn]-49,zn,jn),fe(k,-1),C(k,-2),On(Gn)):(j[kn]!==te&&Pe(k,M("invalid use of '%c' in replacement string"),te),ee(Gn,j[kn]))})(p,X,H,ye)}S(_e,-1)?P(_e,-1)||Pe(_e,M("invalid replacement value (a %s)"),h(_e,-1)):(re(_e,1),an(_e,p.src.subarray(H,ye),ye-H)),On(X)},Sn={byte:function(p){let X=G(p,1),H=X.length,ye=be(In(p,2,1),H),he=be(In(p,3,ye),H);if(ye<1&&(ye=1),he>H&&(he=H),ye>he)return 0;if(he-ye>=Number.MAX_SAFE_INTEGER)return Pe(p,"string slice too long");let _e=he-ye+1;Ke(p,_e,"string slice too long");for(let bn=0;bn<_e;bn++)ge(p,X[ye+bn-1]);return _e},char:function(p){let X=Xe(p),H=new q,ye=Ie(p,H,X);for(let he=1;he<=X;he++){let _e=N(p,he);An(p,_e>=0&&_e<=255,"value out of range"),ye[he-1]=_e}return o(H,X),1},dump:function(p){let X=new q,H=S(p,2);return we(p,1,F),g(p,1),le(p,X),nn(p,De,X,H)!==0?Pe(p,M("unable to dump given function")):(ot(X),1)},find:function(p){return _n(p,1)},format:function(p){let X=Xe(p),H=1,ye=G(p,H),he=0,_e=new q;for(le(p,_e);he<ye.length;)if(ye[he]!==te)ee(_e,ye[he++]);else if(ye[++he]===te)ee(_e,ye[he++]);else{let bn=[];switch(++H>X&&Je(p,H,M("no value")),he=Bn(p,ye,he,bn),String.fromCharCode(ye[he++])){case"c":ee(_e,N(p,H));break;case"d":case"i":case"o":case"u":case"x":case"X":{let Gn=N(p,H);Hn(bn,M(D,!0)),rn(_e,M(w(String.fromCharCode(...bn),Gn)));break}case"a":case"A":Hn(bn,M(D,!0)),rn(_e,Fe(p,bn,me(p,H)));break;case"e":case"E":case"f":case"g":case"G":{let Gn=me(p,H);Hn(bn,M(D,!0)),rn(_e,M(w(String.fromCharCode(...bn),Gn)));break}case"q":gn(p,_e,H);break;case"s":{let Gn=fe(p,H);bn.length<=2||bn[2]===0?On(_e):(An(p,Gn.length===Le(Gn),H,"string contains zeros"),J(bn,46)<0&&Gn.length>=100?On(_e):(rn(_e,M(w(String.fromCharCode(...bn),d(Gn)))),re(p,1)));break}default:return Pe(p,M("invalid option '%%%c' to 'format'"),ye[he-1])}}return ot(_e),1},gmatch:function(p){let X=G(p,1),H=G(p,2),ye=X.length,he=H.length;g(p,2);let _e=new class{constructor(){this.src=NaN,this.p=NaN,this.lastmatch=NaN,this.ms=new ht}};return Oe(p,_e),Tn(_e.ms,p,X,ye,H,he),_e.src=0,_e.p=0,_e.lastmatch=null,Ae(p,We,3),1},gsub:function(p){let X=G(p,1),H=X.length,ye=G(p,2),he=ye.length,_e=null,bn=fn(p,3),Gn=In(p,4,H+1),zn=ye[0]===94,jn=0,k=new ht(p),j=new q;for(An(p,bn===ce||bn===$||bn===F||bn===ve,3,"string/function/table expected"),le(p,j),zn&&(ye=ye.subarray(1),he--),Tn(k,p,X,H,ye,he),X=0,ye=0;jn<Gn;){let Ne;if(un(k),(Ne=ie(k,X,ye))!==null&&Ne!==_e)jn++,xn(k,j,X,Ne,bn),X=_e=Ne;else{if(!(X<k.src_end))break;ee(j,k.src[X++])}if(zn)break}return Ue(j,k.src.subarray(X,k.src_end),k.src_end-X),ot(j),ge(p,jn),2},len:function(p){return ge(p,G(p,1).length),1},lower:function(p){let X=G(p,1),H=X.length,ye=new Uint8Array(H);for(let he=0;he<H;he++){let _e=X[he];m(_e)&&(_e|=32),ye[he]=_e}return oe(p,ye),1},match:function(p){return _n(p,0)},pack:function(p){let X=new q,H=new pe(p),ye={s:G(p,1),off:0},he=1,_e=0;for(sn(p),le(p,X);ye.off<ye.s.length;){let bn=yn(H,_e,ye),Gn=bn.opt,zn=bn.size,jn=bn.ntoalign;for(_e+=jn+zn;jn-- >0;)ee(X,0);switch(he++,Gn){case 0:{let k=N(p,he);if(zn<4){let j=1<<8*zn-1;An(p,-j<=k&&k<j,he,"integer overflow")}Dn(X,k,H.islittle,zn,k<0);break}case 1:{let k=N(p,he);zn<4&&An(p,k>>>0<1<<8*zn,he,"unsigned overflow"),Dn(X,k>>>0,H.islittle,zn,!1);break}case 2:{let k=Zn(X,zn),j=me(p,he),Ne=new DataView(k.buffer,k.byteOffset,k.byteLength);zn===4?Ne.setFloat32(0,j,H.islittle):Ne.setFloat64(0,j,H.islittle),Ee(X,zn);break}case 3:{let k=G(p,he),j=k.length;for(An(p,j<=zn,he,"string longer than given size"),Ue(X,k,j);j++<zn;)ee(X,0);break}case 4:{let k=G(p,he),j=k.length;An(p,zn>=4||j<1<<8*zn,he,"string length does not fit in given size"),Dn(X,j,H.islittle,zn,0),Ue(X,k,j),_e+=j;break}case 5:{let k=G(p,he),j=k.length;An(p,J(k,0)<0,he,"strings contains zeros"),Ue(X,k,j),ee(X,0),_e+=j+1;break}case 6:ee(X,0);case 7:case 8:he--}}return ot(X),1},packsize:function(p){let X=new pe(p),H={s:G(p,1),off:0},ye=0;for(;H.off<H.s.length;){let he=yn(X,ye,H),_e=he.opt,bn=he.size,Gn=he.ntoalign;switch(An(p,ye<=2147483647-(bn+=Gn),1,"format result too large"),ye+=bn,_e){case 4:case 5:Je(p,1,"variable-length format")}}return ge(p,ye),1},rep:function(p){let X=G(p,1),H=X.length,ye=N(p,2),he=Mn(p,3,""),_e=he.length;if(ye<=0)tn(p,"");else{if(H+_e<H||H+_e>2147483647/ye)return Pe(p,M("resulting string too large"));{let bn=ye*H+(ye-1)*_e,Gn=new q,zn=Ie(p,Gn,bn),jn=0;for(;ye-- >1;)zn.set(X,jn),jn+=H,_e>0&&(zn.set(he,jn),jn+=_e);zn.set(X,jn),o(Gn,bn)}}return 1},reverse:function(p){let X=G(p,1),H=X.length,ye=new Uint8Array(H);for(let he=0;he<H;he++)ye[he]=X[H-1-he];return oe(p,ye),1},sub:function(p){let X=G(p,1),H=X.length,ye=be(N(p,2),H),he=be(In(p,3,-1),H);return ye<1&&(ye=1),he>H&&(he=H),ye<=he?oe(p,X.subarray(ye-1,ye-1+(he-ye+1))):tn(p,""),1},unpack:function(p){let X=new pe(p),H={s:G(p,1),off:0},ye=G(p,2),he=ye.length,_e=be(In(p,3,1),he)-1,bn=0;for(An(p,_e<=he&&_e>=0,3,"initial position out of string");H.off<H.s.length;){let Gn=yn(X,_e,H),zn=Gn.opt,jn=Gn.size,k=Gn.ntoalign;switch(_e+k+jn>he&&Je(p,2,M("data string too short")),_e+=k,Ke(p,2,"too many results"),bn++,zn){case 0:case 1:{let j=Pn(p,ye.subarray(_e),X.islittle,jn,zn===0);ge(p,j);break}case 2:{let j=Un(0,ye.subarray(_e),X.islittle,jn);ae(p,j);break}case 3:oe(p,ye.subarray(_e,_e+jn));break;case 4:{let j=Pn(p,ye.subarray(_e),X.islittle,jn,0);An(p,_e+j+jn<=he,2,"data string too short"),oe(p,ye.subarray(_e+jn,_e+jn+j)),_e+=j;break}case 5:{let j=J(ye,0,_e);j===-1&&(j=ye.length-_e),oe(p,ye.subarray(_e,j)),_e=j+1;break}case 7:case 6:case 8:bn--}_e+=jn}return ge(p,_e+1),bn+1},upper:function(p){let X=G(p,1),H=X.length,ye=new Uint8Array(H);for(let he=0;he<H;he++){let _e=X[he];c(_e)&&(_e&=223),ye[he]=_e}return oe(p,ye),1}};a.exports.luaopen_string=function(p){return Nn(p,Sn),(function(X){$e(X,0,1),tn(X,""),ze(X,-2),E(X,-2),re(X,1),ze(X,-2),Ce(X,-2,M("__index",!0)),re(X,1)})(p),1}},function(a,B,f){const{lua_gettop:w,lua_pushcfunction:v,lua_pushfstring:D,lua_pushinteger:R,lua_pushnil:U,lua_pushstring:z,lua_pushvalue:b,lua_setfield:K,lua_tointeger:A}=f(2),{luaL_Buffer:F,luaL_addvalue:Q,luaL_argcheck:ce,luaL_buffinit:$,luaL_checkinteger:ve,luaL_checkstack:se,luaL_checkstring:$e,luaL_error:nn,luaL_newlib:He,luaL_optinteger:Xe,luaL_pushresult:ln}=f(7),{luastring_of:P,to_luastring:re}=f(5),Ae=function(C){return(192&C)===128},ge=function(C,Ce){return C>=0?C:0-C>Ce?0:Ce+C+1},Oe=[255,127,2047,65535],tn=function(C,Ce){let E=C[Ce],g=0;if(E<128)g=E;else{let S=0;for(;64&E;){let xe=C[Ce+ ++S];if((192&xe)!=128)return null;g=g<<6|63&xe,E<<=1}if(g|=(127&E)<<5*S,S>3||g>1114111||g<=Oe[S])return null;Ce+=S}return{code:g,pos:Ce+1}},an=re("%U"),sn=function(C,Ce){let E=ve(C,Ce);ce(C,0<=E&&E<=1114111,Ce,"value out of range"),D(C,an,E)},ae=function(C){let Ce=$e(C,1),E=Ce.length,g=A(C,2)-1;if(g<0)g=0;else if(g<E)for(g++;Ae(Ce[g]);)g++;if(g>=E)return 0;{let S=tn(Ce,g);return S===null||Ae(Ce[S.pos])?nn(C,re("invalid UTF-8 code")):(R(C,g+1),R(C,S.code),2)}},oe={char:function(C){let Ce=w(C);if(Ce===1)sn(C,1);else{let E=new F;$(C,E);for(let g=1;g<=Ce;g++)sn(C,g),Q(E);ln(E)}return 1},codepoint:function(C){let Ce=$e(C,1),E=ge(Xe(C,2,1),Ce.length),g=ge(Xe(C,3,E),Ce.length);if(ce(C,E>=1,2,"out of range"),ce(C,g<=Ce.length,3,"out of range"),E>g)return 0;if(g-E>=Number.MAX_SAFE_INTEGER)return nn(C,"string slice too long");let S=g-E+1;for(se(C,S,"string slice too long"),S=0,E-=1;E<g;){let xe=tn(Ce,E);if(xe===null)return nn(C,"invalid UTF-8 code");R(C,xe.code),E=xe.pos,S++}return S},codes:function(C){return $e(C,1),v(C,ae),b(C,1),R(C,0),3},len:function(C){let Ce=0,E=$e(C,1),g=E.length,S=ge(Xe(C,2,1),g),xe=ge(Xe(C,3,-1),g);for(ce(C,1<=S&&--S<=g,2,"initial position out of string"),ce(C,--xe<g,3,"final position out of string");S<=xe;){let Te=tn(E,S);if(Te===null)return U(C),R(C,S+1),2;S=Te.pos,Ce++}return R(C,Ce),1},offset:function(C){let Ce=$e(C,1),E=ve(C,2),g=E>=0?1:Ce.length+1;if(g=ge(Xe(C,3,g),Ce.length),ce(C,1<=g&&--g<=Ce.length,3,"position out of range"),E===0)for(;g>0&&Ae(Ce[g]);)g--;else if(Ae(Ce[g])&&nn(C,"initial position is a continuation byte"),E<0)for(;E<0&&g>0;){do g--;while(g>0&&Ae(Ce[g]));E++}else for(E--;E>0&&g<Ce.length;){do g++;while(Ae(Ce[g]));E--}return E===0?R(C,g+1):U(C),1}},ze=P(91,0,45,127,194,45,244,93,91,128,45,191,93,42);a.exports.luaopen_utf8=function(C){return He(C,oe),z(C,ze),K(C,-2,re("charpattern",!0)),1}},function(a,B,f){const{LUA_OPLT:w,LUA_TNUMBER:v,lua_compare:D,lua_gettop:R,lua_isinteger:U,lua_isnoneornil:z,lua_pushboolean:b,lua_pushinteger:K,lua_pushliteral:A,lua_pushnil:F,lua_pushnumber:Q,lua_pushvalue:ce,lua_setfield:$,lua_settop:ve,lua_tointeger:se,lua_tointegerx:$e,lua_type:nn}=f(2),{luaL_argcheck:He,luaL_argerror:Xe,luaL_checkany:ln,luaL_checkinteger:P,luaL_checknumber:re,luaL_error:Ae,luaL_newlib:ge,luaL_optnumber:Oe}=f(7),{LUA_MAXINTEGER:tn,LUA_MININTEGER:an,lua_numbertointeger:sn}=f(3),{to_luastring:ae}=f(5);let oe;const ze=function(){return oe=1103515245*oe+12345&2147483647},C=function(E,g){let S=sn(g);S!==!1?K(E,S):Q(E,g)},Ce={abs:function(E){if(U(E,1)){let g=se(E,1);g<0&&(g=0|-g),K(E,g)}else Q(E,Math.abs(re(E,1)));return 1},acos:function(E){return Q(E,Math.acos(re(E,1))),1},asin:function(E){return Q(E,Math.asin(re(E,1))),1},atan:function(E){let g=re(E,1),S=Oe(E,2,1);return Q(E,Math.atan2(g,S)),1},ceil:function(E){return U(E,1)?ve(E,1):C(E,Math.ceil(re(E,1))),1},cos:function(E){return Q(E,Math.cos(re(E,1))),1},deg:function(E){return Q(E,re(E,1)*(180/Math.PI)),1},exp:function(E){return Q(E,Math.exp(re(E,1))),1},floor:function(E){return U(E,1)?ve(E,1):C(E,Math.floor(re(E,1))),1},fmod:function(E){if(U(E,1)&&U(E,2)){let g=se(E,2);g===0?Xe(E,2,"zero"):K(E,se(E,1)%g|0)}else{let g=re(E,1),S=re(E,2);Q(E,g%S)}return 1},log:function(E){let g,S=re(E,1);if(z(E,2))g=Math.log(S);else{let xe=re(E,2);g=xe===2?Math.log2(S):xe===10?Math.log10(S):Math.log(S)/Math.log(xe)}return Q(E,g),1},max:function(E){let g=R(E),S=1;He(E,g>=1,1,"value expected");for(let xe=2;xe<=g;xe++)D(E,S,xe,w)&&(S=xe);return ce(E,S),1},min:function(E){let g=R(E),S=1;He(E,g>=1,1,"value expected");for(let xe=2;xe<=g;xe++)D(E,xe,S,w)&&(S=xe);return ce(E,S),1},modf:function(E){if(U(E,1))ve(E,1),Q(E,0);else{let g=re(E,1),S=g<0?Math.ceil(g):Math.floor(g);C(E,S),Q(E,g===S?0:g-S)}return 2},rad:function(E){return Q(E,re(E,1)*(Math.PI/180)),1},random:function(E){let g,S,xe=oe===void 0?Math.random():ze()/2147483648;switch(R(E)){case 0:return Q(E,xe),1;case 1:g=1,S=P(E,1);break;case 2:g=P(E,1),S=P(E,2);break;default:return Ae(E,"wrong number of arguments")}return He(E,g<=S,1,"interval is empty"),He(E,g>=0||S<=tn+g,1,"interval too large"),xe*=S-g+1,K(E,Math.floor(xe)+g),1},randomseed:function(E){return(function(g){(oe=0|g)==0&&(oe=1)})(re(E,1)),ze(),0},sin:function(E){return Q(E,Math.sin(re(E,1))),1},sqrt:function(E){return Q(E,Math.sqrt(re(E,1))),1},tan:function(E){return Q(E,Math.tan(re(E,1))),1},tointeger:function(E){let g=$e(E,1);return g!==!1?K(E,g):(ln(E,1),F(E)),1},type:function(E){return nn(E,1)===v?U(E,1)?A(E,"integer"):A(E,"float"):(ln(E,1),F(E)),1},ult:function(E){let g=P(E,1),S=P(E,2);return b(E,g>=0?S<0||g<S:S<0&&g<S),1}};a.exports.luaopen_math=function(E){return ge(E,Ce),Q(E,Math.PI),$(E,-2,ae("pi",!0)),Q(E,1/0),$(E,-2,ae("huge",!0)),K(E,tn),$(E,-2,ae("maxinteger",!0)),K(E,an),$(E,-2,ae("mininteger",!0)),1}},function(a,B,f){const{LUA_MASKCALL:w,LUA_MASKCOUNT:v,LUA_MASKLINE:D,LUA_MASKRET:R,LUA_REGISTRYINDEX:U,LUA_TFUNCTION:z,LUA_TNIL:b,LUA_TTABLE:K,LUA_TUSERDATA:A,lua_Debug:F,lua_call:Q,lua_checkstack:ce,lua_gethook:$,lua_gethookcount:ve,lua_gethookmask:se,lua_getinfo:$e,lua_getlocal:nn,lua_getmetatable:He,lua_getstack:Xe,lua_getupvalue:ln,lua_getuservalue:P,lua_insert:re,lua_iscfunction:Ae,lua_isfunction:ge,lua_isnoneornil:Oe,lua_isthread:tn,lua_newtable:an,lua_pcall:sn,lua_pop:ae,lua_pushboolean:oe,lua_pushfstring:ze,lua_pushinteger:C,lua_pushlightuserdata:Ce,lua_pushliteral:E,lua_pushnil:g,lua_pushstring:S,lua_pushvalue:xe,lua_rawgetp:Te,lua_rawsetp:pn,lua_rotate:Ze,lua_setfield:fn,lua_sethook:mn,lua_setlocal:q,lua_setmetatable:ee,lua_settop:Ue,lua_setupvalue:Ee,lua_setuservalue:rn,lua_tojsstring:On,lua_toproxy:An,lua_tostring:Je,lua_tothread:le,lua_touserdata:Ie,lua_type:N,lua_upvalueid:me,lua_upvaluejoin:Ke,lua_xmove:G}=f(2),{luaL_argcheck:we,luaL_argerror:Pe,luaL_checkany:Nn,luaL_checkinteger:In,luaL_checkstring:Mn,luaL_checktype:Zn,luaL_error:ot,luaL_loadbuffer:o,luaL_newlib:fe,luaL_optinteger:h,luaL_optstring:Y,luaL_traceback:V,lua_writestringerror:J}=f(7),d=f(17),{luastring_indexOf:M,to_luastring:te}=f(5),Le=function(y,ne,en){y===ne||ce(ne,en)||ot(y,te("stack overflow",!0))},be=function(y){return tn(y,1)?{arg:1,thread:le(y,1)}:{arg:0,thread:y}},De=function(y,ne,en){S(y,en),fn(y,-2,ne)},Ye=function(y,ne,en){C(y,en),fn(y,-2,ne)},Fe=function(y,ne,en){oe(y,en),fn(y,-2,ne)},Ve=function(y,ne,en){y==ne?Ze(y,-2,1):G(ne,y,1),fn(y,-2,en)},vn=function(y,ne){let en=In(y,2);Zn(y,1,z);let gn=ne?ln(y,1,en):Ee(y,1,en);return gn===null?0:(S(y,gn),re(y,-(ne+1)),ne+1)},l=function(y,ne,en){let gn=In(y,en);return Zn(y,ne,z),we(y,ln(y,ne,gn)!==null,en,"invalid upvalue index"),gn},s=te("__hooks__",!0),_=["call","return","line","count","tail call"].map(y=>te(y)),c=function(y,ne){Te(y,U,s);let en=Ie(y,-1).get(y);en&&(en(y),S(y,_[ne.event]),ne.currentline>=0?C(y,ne.currentline):g(y),d.lua_assert($e(y,te("lS"),ne)),Q(y,2,0))},m={gethook:function(y){let ne=be(y).thread,en=new Uint8Array(5),gn=se(ne),Bn=$(ne);return Bn===null?g(y):Bn!==c?E(y,"external hook"):(Te(y,U,s),Ie(y,-1).get(ne)(y)),S(y,(function(Hn,pe){let dn=0;return Hn&w&&(pe[dn++]=99),Hn&R&&(pe[dn++]=114),Hn&D&&(pe[dn++]=108),pe.subarray(0,dn)})(gn,en)),C(y,ve(ne)),3},getinfo:function(y){let ne=new F,en=be(y),gn=en.arg,Bn=en.thread,Hn=Y(y,gn+2,"flnStu");if(Le(y,Bn,3),ge(y,gn+1))Hn=ze(y,te(">%s"),Hn),xe(y,gn+1),G(y,Bn,1);else if(!Xe(Bn,In(y,gn+1),ne))return g(y),1;return $e(Bn,Hn,ne)||Pe(y,gn+2,"invalid option"),an(y),M(Hn,83)>-1&&(De(y,te("source",!0),ne.source),De(y,te("short_src",!0),ne.short_src),Ye(y,te("linedefined",!0),ne.linedefined),Ye(y,te("lastlinedefined",!0),ne.lastlinedefined),De(y,te("what",!0),ne.what)),M(Hn,108)>-1&&Ye(y,te("currentline",!0),ne.currentline),M(Hn,117)>-1&&(Ye(y,te("nups",!0),ne.nups),Ye(y,te("nparams",!0),ne.nparams),Fe(y,te("isvararg",!0),ne.isvararg)),M(Hn,110)>-1&&(De(y,te("name",!0),ne.name),De(y,te("namewhat",!0),ne.namewhat)),M(Hn,116)>-1&&Fe(y,te("istailcall",!0),ne.istailcall),M(Hn,76)>-1&&Ve(y,Bn,te("activelines",!0)),M(Hn,102)>-1&&Ve(y,Bn,te("func",!0)),1},getlocal:function(y){let ne=be(y),en=ne.thread,gn=ne.arg,Bn=new F,Hn=In(y,gn+2);if(ge(y,gn+1))return xe(y,gn+1),S(y,nn(y,null,Hn)),1;{let pe=In(y,gn+1);if(!Xe(en,pe,Bn))return Pe(y,gn+1,"level out of range");Le(y,en,1);let dn=nn(en,Bn,Hn);return dn?(G(en,y,1),S(y,dn),Ze(y,-2,1),2):(g(y),1)}},getmetatable:function(y){return Nn(y,1),He(y,1)||g(y),1},getregistry:function(y){return xe(y,U),1},getupvalue:function(y){return vn(y,1)},getuservalue:function(y){return N(y,1)!==A?g(y):P(y,1),1},sethook:function(y){let ne,en,gn,Bn,Hn=be(y),pe=Hn.thread,dn=Hn.arg;if(Oe(y,dn+1))Ue(y,dn+1),gn=null,ne=0,en=0;else{const Me=Mn(y,dn+2);Zn(y,dn+1,z),en=h(y,dn+3,0),gn=c,ne=(function(de,yn){let Dn=0;return M(de,99)>-1&&(Dn|=w),M(de,114)>-1&&(Dn|=R),M(de,108)>-1&&(Dn|=D),yn>0&&(Dn|=v),Dn})(Me,en)}Te(y,U,s)===b?(Bn=new WeakMap,Ce(y,Bn),pn(y,U,s)):Bn=Ie(y,-1);let I=An(y,dn+1);return Bn.set(pe,I),mn(pe,gn,ne,en),0},setlocal:function(y){let ne=be(y),en=ne.thread,gn=ne.arg,Bn=new F,Hn=In(y,gn+1),pe=In(y,gn+2);if(!Xe(en,Hn,Bn))return Pe(y,gn+1,"level out of range");Nn(y,gn+3),Ue(y,gn+3),Le(y,en,1),G(y,en,1);let dn=q(en,Bn,pe);return dn===null&&ae(en,1),S(y,dn),1},setmetatable:function(y){const ne=N(y,2);return we(y,ne==b||ne==K,2,"nil or table expected"),Ue(y,2),ee(y,1),1},setupvalue:function(y){return Nn(y,3),vn(y,0)},setuservalue:function(y){return Zn(y,1,A),Nn(y,2),Ue(y,2),rn(y,1),1},traceback:function(y){let ne=be(y),en=ne.thread,gn=ne.arg,Bn=Je(y,gn+1);if(Bn!==null||Oe(y,gn+1)){let Hn=h(y,gn+2,y===en?1:0);V(y,en,Bn,Hn)}else xe(y,gn+1);return 1},upvalueid:function(y){let ne=l(y,1,2);return Ce(y,me(y,1,ne)),1},upvaluejoin:function(y){let ne=l(y,1,2),en=l(y,3,4);return we(y,!Ae(y,1),1,"Lua function expected"),we(y,!Ae(y,3),3,"Lua function expected"),Ke(y,1,ne,3,en),0}};let O;typeof window<"u"&&(O=function(){let y=prompt("lua_debug>","");return y!==null?y:""}),O&&(m.debug=function(y){for(;;){let ne=O();if(ne==="cont")return 0;if(ne.length===0)continue;let en=te(ne);(o(y,en,en.length,te("=(debug command)",!0))||sn(y,0,0,0))&&J(On(y,-1),`
`),Ue(y,0)}}),a.exports.luaopen_debug=function(y){return fe(y,m),1}},function(a,B,f){const{LUA_DIRSEP:w,LUA_EXEC_DIR:v,LUA_JSPATH_DEFAULT:D,LUA_PATH_DEFAULT:R,LUA_PATH_MARK:U,LUA_PATH_SEP:z}=f(3),{LUA_OK:b,LUA_REGISTRYINDEX:K,LUA_TNIL:A,LUA_TTABLE:F,lua_callk:Q,lua_createtable:ce,lua_getfield:$,lua_insert:ve,lua_isfunction:se,lua_isnil:$e,lua_isstring:nn,lua_newtable:He,lua_pop:Xe,lua_pushboolean:ln,lua_pushcclosure:P,lua_pushcfunction:re,lua_pushfstring:Ae,lua_pushglobaltable:ge,lua_pushlightuserdata:Oe,lua_pushliteral:tn,lua_pushlstring:an,lua_pushnil:sn,lua_pushstring:ae,lua_pushvalue:oe,lua_rawgeti:ze,lua_rawgetp:C,lua_rawseti:Ce,lua_rawsetp:E,lua_remove:g,lua_setfield:S,lua_setmetatable:xe,lua_settop:Te,lua_toboolean:pn,lua_tostring:Ze,lua_touserdata:fn,lua_upvalueindex:mn}=f(2),{LUA_LOADED_TABLE:q,LUA_PRELOAD_TABLE:ee,luaL_Buffer:Ue,luaL_addvalue:Ee,luaL_buffinit:rn,luaL_checkstring:On,luaL_error:An,luaL_getsubtable:Je,luaL_gsub:le,luaL_len:Ie,luaL_loadfile:N,luaL_newlib:me,luaL_optstring:Ke,luaL_pushresult:G,luaL_setfuncs:we}=f(7),Pe=f(17),{luastring_indexOf:Nn,to_jsstring:In,to_luastring:Mn,to_uristring:Zn}=f(5),ot=f(0),o=typeof window<"u"?window:typeof WorkerGlobalScope<"u"&&self instanceof WorkerGlobalScope?self:(0,eval)("this"),fe=Mn("__JSLIBS__"),h=w,Y=w,V=Mn("luaopen_"),J=Mn("_"),d=Mn("");let M;M=function(pe,dn,I){dn=Zn(dn);let Me=new XMLHttpRequest;if(Me.open("GET",dn,!1),Me.send(),Me.status<200||Me.status>=300)return ae(pe,Mn(`${Me.status}: ${Me.statusText}`)),null;let de,yn=Me.response;/\/\/[#@] sourceURL=/.test(yn)||(yn+=" //# sourceURL="+dn);try{de=Function("fengari",yn)}catch(Pn){return ae(pe,Mn(`${Pn.name}: ${Pn.message}`)),null}let Dn=de(ot);return typeof Dn=="function"||typeof Dn=="object"&&Dn!==null?Dn:Dn===void 0?o:(ae(pe,Mn(`library returned unexpected type (${typeof Dn})`)),null)};let te;te=function(pe){pe=Zn(pe);let dn=new XMLHttpRequest;return dn.open("GET",pe,!1),dn.send(),dn.status>=200&&dn.status<=299};const Le=function(pe,dn,I){let Me=Ye(pe,dn);if(Me===null){if((Me=M(pe,dn,I[0]===42))===null)return 1;Fe(pe,dn,Me)}if(I[0]===42)return ln(pe,1),0;{let de=(function(yn,Dn,Pn){let Un=Dn[In(Pn)];return Un&&typeof Un=="function"?Un:(Ae(yn,Mn("undefined symbol: %s"),Pn),null)})(pe,Me,I);return de===null?2:(re(pe,de),0)}},be=o,De=function(pe,dn,I,Me){let de=`${I}${Pe.LUA_VERSUFFIX}`;ae(pe,Mn(de));let yn=be[de];yn===void 0&&(yn=be[I]),yn===void 0||(function(Dn){$(Dn,K,Mn("LUA_NOENV"));let Pn=pn(Dn,-1);return Xe(Dn,1),Pn})(pe)?ae(pe,Me):(yn=le(pe,Mn(yn),Mn(z+z,!0),Mn(z+In(d)+z,!0)),le(pe,yn,d,Me),g(pe,-2)),S(pe,-3,dn),Xe(pe,1)},Ye=function(pe,dn){C(pe,K,fe),$(pe,-1,dn);let I=fn(pe,-1);return Xe(pe,2),I},Fe=function(pe,dn,I){C(pe,K,fe),Oe(pe,I),oe(pe,-1),S(pe,-3,dn),Ce(pe,-2,Ie(pe,-2)+1),Xe(pe,1)},Ve=function(pe,dn){for(;dn[0]===z.charCodeAt(0);)dn=dn.subarray(1);if(dn.length===0)return null;let I=Nn(dn,z.charCodeAt(0));return I<0&&(I=dn.length),an(pe,dn,I),dn.subarray(I)},vn=function(pe,dn,I,Me,de){let yn=new Ue;for(rn(pe,yn),Me[0]!==0&&(dn=le(pe,dn,Me,de));(I=Ve(pe,I))!==null;){let Dn=le(pe,Ze(pe,-1),Mn(U,!0),dn);if(g(pe,-2),te(Dn))return Dn;Ae(pe,Mn(`
	no file '%s'`),Dn),g(pe,-2),Ee(yn)}return G(yn),null},l=function(pe,dn,I,Me){$(pe,mn(1),I);let de=Ze(pe,-1);return de===null&&An(pe,Mn("'package.%s' must be a string"),I),vn(pe,dn,de,Mn("."),Me)},s=function(pe,dn,I){return dn?(ae(pe,I),2):An(pe,Mn(`error loading module '%s' from file '%s':
	%s`),Ze(pe,1),I,Ze(pe,-1))},_=function(pe){let dn=On(pe,1),I=l(pe,dn,Mn("path",!0),Mn(Y,!0));return I===null?1:s(pe,N(pe,I)===b,I)},c=function(pe,dn,I){let Me;I=le(pe,I,Mn("."),J);let de=Nn(I,45);if(de>=0){Me=an(pe,I,de),Me=Ae(pe,Mn("%s%s"),V,Me);let yn=Le(pe,dn,Me);if(yn!==2)return yn;I=de+1}return Me=Ae(pe,Mn("%s%s"),V,I),Le(pe,dn,Me)},m=function(pe){let dn=On(pe,1),I=l(pe,dn,Mn("jspath",!0),Mn(h,!0));return I===null?1:s(pe,c(pe,I,dn)===0,I)},O=function(pe){let dn,I=On(pe,1),Me=Nn(I,46);if(Me<0)return 0;an(pe,I,Me);let de=l(pe,Ze(pe,-1),Mn("jspath",!0),Mn(h,!0));return de===null?1:(dn=c(pe,de,I))!==0?dn!=2?s(pe,0,de):(ae(pe,Mn(`
	no module '%s' in file '%s'`),I,de),1):(ae(pe,de),2)},y=function(pe){let dn=On(pe,1);return $(pe,K,ee),$(pe,-1,dn)===A&&Ae(pe,Mn(`
	no field package.preload['%s']`),dn),1},ne=function(pe,dn,I){for(;dn===b?(ze(pe,3,I.i)===A&&(Xe(pe,1),G(I.msg),An(pe,Mn("module '%s' not found:%s"),I.name,Ze(pe,-1))),ae(pe,I.name),Q(pe,1,2,I,ne)):dn=b,!se(pe,-2);I.i++)nn(pe,-2)?(Xe(pe,1),Ee(I.msg)):Xe(pe,2);return I.k(pe,b,I.ctx)},en=function(pe,dn,I){return ae(pe,I),ve(pe,-2),Q(pe,2,1,I,gn),gn(pe,b,I)},gn=function(pe,dn,I){let Me=I;return $e(pe,-1)||S(pe,2,Me),$(pe,2,Me)==A&&(ln(pe,1),oe(pe,-1),S(pe,2,Me)),1},Bn={loadlib:function(pe){let dn=On(pe,1),I=On(pe,2),Me=Le(pe,dn,I);return Me===0?1:(sn(pe),ve(pe,-2),tn(pe,Me===1?"open":"init"),3)},searchpath:function(pe){return vn(pe,On(pe,1),On(pe,2),Ke(pe,3,"."),Ke(pe,4,w))!==null?1:(sn(pe),ve(pe,-2),2)}},Hn={require:function(pe){let dn=On(pe,1);return Te(pe,1),$(pe,K,q),$(pe,2,dn),pn(pe,-1)?1:(Xe(pe,1),(function(I,Me,de,yn){let Dn=new Ue;return rn(I,Dn),$(I,mn(1),Mn("searchers",!0))!==F&&An(I,Mn("'package.searchers' must be a table")),ne(I,b,{name:Me,i:1,msg:Dn,ctx:de,k:yn})})(pe,dn,dn,en))}};a.exports.luaopen_package=function(pe){return(function(dn){He(dn),ce(dn,0,1),xe(dn,-2),E(dn,K,fe)})(pe),me(pe,Bn),(function(dn){let I=[y,_,m,O,null];ce(dn);for(let Me=0;I[Me];Me++)oe(dn,-2),P(dn,I[Me],1),Ce(dn,-2,Me+1);S(dn,-2,Mn("searchers",!0))})(pe),De(pe,Mn("path",!0),"LUA_PATH",R),De(pe,Mn("jspath",!0),"LUA_JSPATH",D),tn(pe,w+`
`+z+`
`+U+`
`+v+`
-
`),S(pe,-2,Mn("config",!0)),Je(pe,K,q),S(pe,-2,Mn("loaded",!0)),Je(pe,K,ee),S(pe,-2,Mn("preload",!0)),ge(pe),oe(pe,-2),we(pe,Hn,1),Xe(pe,1),1}},function(a,B,f){const{lua_pushinteger:w,lua_pushliteral:v,lua_setfield:D}=f(2),{luaL_newlib:R}=f(7),{FENGARI_AUTHORS:U,FENGARI_COPYRIGHT:z,FENGARI_RELEASE:b,FENGARI_VERSION:K,FENGARI_VERSION_MAJOR:A,FENGARI_VERSION_MINOR:F,FENGARI_VERSION_NUM:Q,FENGARI_VERSION_RELEASE:ce,to_luastring:$}=f(5);a.exports.luaopen_fengari=function(ve){return R(ve,{}),v(ve,U),D(ve,-2,$("AUTHORS")),v(ve,z),D(ve,-2,$("COPYRIGHT")),v(ve,b),D(ve,-2,$("RELEASE")),v(ve,K),D(ve,-2,$("VERSION")),v(ve,A),D(ve,-2,$("VERSION_MAJOR")),v(ve,F),D(ve,-2,$("VERSION_MINOR")),w(ve,Q),D(ve,-2,$("VERSION_NUM")),v(ve,ce),D(ve,-2,$("VERSION_RELEASE")),1}},function(a,B,f){f.r(B),f.d(B,"L",function(){return an}),f.d(B,"load",function(){return sn});var w=f(0);f.d(B,"FENGARI_AUTHORS",function(){return w.FENGARI_AUTHORS}),f.d(B,"FENGARI_COPYRIGHT",function(){return w.FENGARI_COPYRIGHT}),f.d(B,"FENGARI_RELEASE",function(){return w.FENGARI_RELEASE}),f.d(B,"FENGARI_VERSION",function(){return w.FENGARI_VERSION}),f.d(B,"FENGARI_VERSION_MAJOR",function(){return w.FENGARI_VERSION_MAJOR}),f.d(B,"FENGARI_VERSION_MINOR",function(){return w.FENGARI_VERSION_MINOR}),f.d(B,"FENGARI_VERSION_NUM",function(){return w.FENGARI_VERSION_NUM}),f.d(B,"FENGARI_VERSION_RELEASE",function(){return w.FENGARI_VERSION_RELEASE}),f.d(B,"luastring_eq",function(){return w.luastring_eq}),f.d(B,"luastring_indexOf",function(){return w.luastring_indexOf}),f.d(B,"luastring_of",function(){return w.luastring_of}),f.d(B,"to_jsstring",function(){return w.to_jsstring}),f.d(B,"to_luastring",function(){return w.to_luastring}),f.d(B,"to_uristring",function(){return w.to_uristring}),f.d(B,"lua",function(){return w.lua}),f.d(B,"lauxlib",function(){return w.lauxlib}),f.d(B,"lualib",function(){return w.lualib});var v=f(21);f.d(B,"interop",function(){return v});const{LUA_ERRRUN:D,LUA_ERRSYNTAX:R,LUA_OK:U,LUA_VERSION_MAJOR:z,LUA_VERSION_MINOR:b,lua_Debug:K,lua_getinfo:A,lua_getstack:F,lua_gettop:Q,lua_insert:ce,lua_pcall:$,lua_pop:ve,lua_pushcfunction:se,lua_pushstring:$e,lua_remove:nn,lua_setglobal:He,lua_tojsstring:Xe}=w.lua,{luaL_loadbuffer:ln,luaL_newstate:P,luaL_requiref:re}=w.lauxlib,{checkjs:Ae,luaopen_js:ge,push:Oe,tojs:tn}=v,an=P();function sn(ae,oe){if(typeof ae=="string")ae=Object(w.to_luastring)(ae);else if(!(ae instanceof Uint8Array))throw new TypeError("expects an array of bytes or javascript string");oe=oe?Object(w.to_luastring)(oe):null;let ze,C=ln(an,ae,null,oe);if(ze=C===R?new SyntaxError(Xe(an,-1)):tn(an,-1),ve(an,1),C!==U)throw ze;return ze}if(w.lualib.luaL_openlibs(an),re(an,Object(w.to_luastring)("js"),ge,1),ve(an,1),$e(an,Object(w.to_luastring)(w.FENGARI_COPYRIGHT)),He(an,Object(w.to_luastring)("_COPYRIGHT")),typeof document<"u"&&document instanceof HTMLDocument){const ae=function(Te){switch(Te){case"anonymous":return"omit";case"use-credentials":return"include";default:return"same-origin"}},oe=function(Te){let pn=new K;return F(Te,2,pn)&&A(Te,Object(w.to_luastring)("Sl"),pn),Oe(Te,new ErrorEvent("error",{bubbles:!0,cancelable:!0,message:Xe(Te,1),error:tn(Te,1),filename:pn.short_src?Object(w.to_jsstring)(pn.short_src):void 0,lineno:pn.currentline>0?pn.currentline:void 0})),1},ze=function(Te,pn,Ze){let fn,mn=ln(an,pn,null,Ze);if(mn===R){let q=Xe(an,-1),ee=Te.src?Te.src:document.location,Ue,Ee=new SyntaxError(q,ee,Ue);fn=new ErrorEvent("error",{message:q,error:Ee,filename:ee,lineno:Ue})}else if(mn===U){let q=Q(an);se(an,oe),ce(an,q),Object.defineProperty(document,"currentScript",{value:Te,configurable:!0}),mn=$(an,0,0,q),delete document.currentScript,nn(an,q),mn===D&&(fn=Ae(an,-1))}mn!==U&&(fn===void 0&&(fn=new ErrorEvent("error",{message:Xe(an,-1),error:tn(an,-1)})),ve(an,1),window.dispatchEvent(fn)&&console.error("uncaught exception",fn.error))},C=function(Te,pn,Ze){if(Te.status>=200&&Te.status<300){let fn=Te.response;fn=typeof fn=="string"?Object(w.to_luastring)(Te.response):new Uint8Array(fn),ze(pn,fn,Ze)}else pn.dispatchEvent(new Event("error"))},Ce=function(Te){if(Te.src){let pn=Object(w.to_luastring)("@"+Te.src);if(document.readyState==="complete"||Te.async)if(typeof fetch=="function")fetch(Te.src,{method:"GET",credentials:ae(Te.crossorigin),redirect:"follow",integrity:Te.integrity}).then(function(Ze){if(Ze.ok)return Ze.arrayBuffer();throw new Error("unable to fetch")}).then(function(Ze){let fn=new Uint8Array(Ze);ze(Te,fn,pn)}).catch(function(Ze){Te.dispatchEvent(new Event("error"))});else{let Ze=new XMLHttpRequest;Ze.open("GET",Te.src,!0),Ze.responseType="arraybuffer",Ze.onreadystatechange=function(){Ze.readyState===4&&C(Ze,Te,pn)},Ze.send()}else{let Ze=new XMLHttpRequest;Ze.open("GET",Te.src,!1),Ze.send(),C(Ze,Te,pn)}}else{let pn=Object(w.to_luastring)(Te.innerHTML),Ze=Te.id?Object(w.to_luastring)("="+Te.id):pn;ze(Te,pn,Ze)}},E=/^(.*?\/.*?)([\t ]*;.*)?$/,g=/^(\d+)\.(\d+)$/,S=function(Te){if(Te.tagName!=="SCRIPT")return;let pn=E.exec(Te.type);if(!pn)return;let Ze=pn[1];if(Ze==="application/lua"||Ze==="text/lua"){if(Te.hasAttribute("lua-version")){let fn=g.exec(Te.getAttribute("lua-version"));if(!fn||fn[1]!==z||fn[2]!==b)return}Ce(Te)}};typeof MutationObserver<"u"?new MutationObserver(function(Te,pn){for(let Ze=0;Ze<Te.length;Ze++){let fn=Te[Ze];for(let mn=0;mn<fn.addedNodes.length;mn++)S(fn.addedNodes[mn])}}).observe(document,{childList:!0,subtree:!0}):console.warn&&console.warn("fengari-web: MutationObserver not found; lua script tags will not be run when inserted"),Array.prototype.forEach.call(document.querySelectorAll('script[type^="application/lua"], script[type^="text/lua"]'),S)}},function(a,B,f){const{LUA_MULTRET:w,LUA_OPADD:v,LUA_OPBAND:D,LUA_OPBNOT:R,LUA_OPBOR:U,LUA_OPBXOR:z,LUA_OPDIV:b,LUA_OPIDIV:K,LUA_OPMOD:A,LUA_OPSHL:F,LUA_OPSHR:Q,LUA_OPUNM:ce,constant_types:{LUA_TBOOLEAN:$,LUA_TLIGHTUSERDATA:ve,LUA_TLNGSTR:se,LUA_TNIL:$e,LUA_TNUMFLT:nn,LUA_TNUMINT:He,LUA_TTABLE:Xe},to_luastring:ln}=f(1),{lua_assert:P}=f(4),re=f(20),Ae=f(6),ge=f(16),Oe=f(23),tn=f(9),an=f(15),sn=ge.OpCodesI,ae=Ae.TValue,oe={OPR_ADD:0,OPR_SUB:1,OPR_MUL:2,OPR_MOD:3,OPR_POW:4,OPR_DIV:5,OPR_IDIV:6,OPR_BAND:7,OPR_BOR:8,OPR_BXOR:9,OPR_SHL:10,OPR_SHR:11,OPR_CONCAT:12,OPR_EQ:13,OPR_LT:14,OPR_LE:15,OPR_NE:16,OPR_GT:17,OPR_GE:18,OPR_AND:19,OPR_OR:20,OPR_NOBINOPR:21},ze={OPR_MINUS:0,OPR_BNOT:1,OPR_NOT:2,OPR_LEN:3,OPR_NOUNOPR:4},C=function(c){return c.t!==c.f},Ce=function(c,m){let O=Oe.expkind;if(C(c))return!1;switch(c.k){case O.VKINT:return!m||new ae(He,c.u.ival);case O.VKFLT:return!m||new ae(nn,c.u.nval);default:return!1}},E=function(c,m,O){let y,ne=m+O-1;if(c.pc>c.lasttarget&&(y=c.f.code[c.pc-1]).opcode===sn.OP_LOADNIL){let en=y.A,gn=en+y.B;if(en<=m&&m<=gn+1||m<=en&&en<=ne+1)return en<m&&(m=en),gn>ne&&(ne=gn),ge.SETARG_A(y,m),void ge.SETARG_B(y,ne-m)}Je(c,sn.OP_LOADNIL,m,O-1,0)},g=function(c,m){return c.f.code[m.u.info]},S=function(c,m){let O=c.f.code[m].sBx;return O===-1?-1:m+1+O},xe=function(c,m,O){let y=c.f.code[m],ne=O-(m+1);P(O!==-1),Math.abs(ne)>ge.MAXARG_sBx&&re.luaX_syntaxerror(c.ls,ln("control structure too long",!0)),ge.SETARG_sBx(y,ne)},Te=function(c,m,O){if(O===-1)return m;if(m===-1)m=O;else{let y=m,ne=S(c,y);for(;ne!==-1;)ne=S(c,y=ne);xe(c,y,O)}return m},pn=function(c){let m=c.jpc;c.jpc=-1;let O=Ie(c,sn.OP_JMP,0,-1);return O=Te(c,O,m)},Ze=function(c,m,O,y,ne){return Je(c,m,O,y,ne),pn(c)},fn=function(c){return c.lasttarget=c.pc,c.pc},mn=function(c,m){return m>=1&&ge.testTMode(c.f.code[m-1].opcode)?m-1:m},q=function(c,m){return c.f.code[mn(c,m)]},ee=function(c,m,O){let y=mn(c,m),ne=c.f.code[y];return ne.opcode===sn.OP_TESTSET&&(O!==ge.NO_REG&&O!==ne.B?ge.SETARG_A(ne,O):c.f.code[y]=ge.CREATE_ABC(sn.OP_TEST,ne.B,0,ne.C),!0)},Ue=function(c,m){for(;m!==-1;m=S(c,m))ee(c,m,ge.NO_REG)},Ee=function(c,m,O,y,ne){for(;m!==-1;){let en=S(c,m);ee(c,m,y)?xe(c,m,O):xe(c,m,ne),m=en}},rn=function(c,m){fn(c),c.jpc=Te(c,c.jpc,m)},On=function(c,m,O){O===c.pc?rn(c,m):(P(O<c.pc),Ee(c,m,O,ge.NO_REG,O))},An=function(c,m){let O=c.f;return(function(y){Ee(y,y.jpc,y.pc,ge.NO_REG,y.pc),y.jpc=-1})(c),O.code[c.pc]=m,O.lineinfo[c.pc]=c.ls.lastline,c.pc++},Je=function(c,m,O,y,ne){return P(ge.getOpMode(m)===ge.iABC),P(ge.getBMode(m)!==ge.OpArgN||y===0),P(ge.getCMode(m)!==ge.OpArgN||ne===0),P(O<=ge.MAXARG_A&&y<=ge.MAXARG_B&&ne<=ge.MAXARG_C),An(c,ge.CREATE_ABC(m,O,y,ne))},le=function(c,m,O,y){return P(ge.getOpMode(m)===ge.iABx||ge.getOpMode(m)===ge.iAsBx),P(ge.getCMode(m)===ge.OpArgN),P(O<=ge.MAXARG_A&&y<=ge.MAXARG_Bx),An(c,ge.CREATE_ABx(m,O,y))},Ie=function(c,m,O,y){return le(c,m,O,y+ge.MAXARG_sBx)},N=function(c,m){return P(m<=ge.MAXARG_Ax),An(c,ge.CREATE_Ax(sn.OP_EXTRAARG,m))},me=function(c,m,O){if(O<=ge.MAXARG_Bx)return le(c,sn.OP_LOADK,m,O);{let y=le(c,sn.OP_LOADKX,m,0);return N(c,O),y}},Ke=function(c,m){let O=c.freereg+m;O>c.f.maxstacksize&&(O>=255&&re.luaX_syntaxerror(c.ls,ln("function or expression needs too many registers",!0)),c.f.maxstacksize=O)},G=function(c,m){Ke(c,m),c.freereg+=m},we=function(c,m){!ge.ISK(m)&&m>=c.nactvar&&(c.freereg--,P(m===c.freereg))},Pe=function(c,m){m.k===Oe.expkind.VNONRELOC&&we(c,m.u.info)},Nn=function(c,m,O){let y=m.k===Oe.expkind.VNONRELOC?m.u.info:-1,ne=O.k===Oe.expkind.VNONRELOC?O.u.info:-1;y>ne?(we(c,y),we(c,ne)):(we(c,ne),we(c,y))},In=function(c,m,O){let y=c.f,ne=tn.luaH_get(c.L,c.ls.h,m);if(ne.ttisinteger()){let gn=ne.value;if(gn<c.nk&&y.k[gn].ttype()===O.ttype()&&y.k[gn].value===O.value)return gn}let en=c.nk;return tn.luaH_setfrom(c.L,c.ls.h,m,new Ae.TValue(He,en)),y.k[en]=O,c.nk++,en},Mn=function(c,m){let O=new ae(ve,m),y=new ae(He,m);return In(c,O,y)},Zn=function(c,m){let O=new ae(nn,m);return In(c,O,O)},ot=function(c,m){let O=new ae($,m);return In(c,O,O)},o=function(c,m,O){let y=Oe.expkind;if(m.k===y.VCALL)ge.SETARG_C(g(c,m),O+1);else if(m.k===y.VVARARG){let ne=g(c,m);ge.SETARG_B(ne,O+1),ge.SETARG_A(ne,c.freereg),G(c,1)}else P(O===w)},fe=function(c,m){let O=Oe.expkind;m.k===O.VCALL?(P(g(c,m).C===2),m.k=O.VNONRELOC,m.u.info=g(c,m).A):m.k===O.VVARARG&&(ge.SETARG_B(g(c,m),2),m.k=O.VRELOCABLE)},h=function(c,m){let O=Oe.expkind;switch(m.k){case O.VLOCAL:m.k=O.VNONRELOC;break;case O.VUPVAL:m.u.info=Je(c,sn.OP_GETUPVAL,0,m.u.info,0),m.k=O.VRELOCABLE;break;case O.VINDEXED:{let y;we(c,m.u.ind.idx),m.u.ind.vt===O.VLOCAL?(we(c,m.u.ind.t),y=sn.OP_GETTABLE):(P(m.u.ind.vt===O.VUPVAL),y=sn.OP_GETTABUP),m.u.info=Je(c,y,0,m.u.ind.t,m.u.ind.idx),m.k=O.VRELOCABLE;break}case O.VVARARG:case O.VCALL:fe(c,m)}},Y=function(c,m,O,y){return fn(c),Je(c,sn.OP_LOADBOOL,m,O,y)},V=function(c,m,O){let y=Oe.expkind;switch(h(c,m),m.k){case y.VNIL:E(c,O,1);break;case y.VFALSE:case y.VTRUE:Je(c,sn.OP_LOADBOOL,O,m.k===y.VTRUE,0);break;case y.VK:me(c,O,m.u.info);break;case y.VKFLT:me(c,O,Zn(c,m.u.nval));break;case y.VKINT:me(c,O,Mn(c,m.u.ival));break;case y.VRELOCABLE:{let ne=g(c,m);ge.SETARG_A(ne,O);break}case y.VNONRELOC:O!==m.u.info&&Je(c,sn.OP_MOVE,O,m.u.info,0);break;default:return void P(m.k===y.VJMP)}m.u.info=O,m.k=y.VNONRELOC},J=function(c,m){m.k!==Oe.expkind.VNONRELOC&&(G(c,1),V(c,m,c.freereg-1))},d=function(c,m){for(;m!==-1;m=S(c,m))if(q(c,m).opcode!==sn.OP_TESTSET)return!0;return!1},M=function(c,m,O){let y=Oe.expkind;if(V(c,m,O),m.k===y.VJMP&&(m.t=Te(c,m.t,m.u.info)),C(m)){let ne,en=-1,gn=-1;if(d(c,m.t)||d(c,m.f)){let Bn=m.k===y.VJMP?-1:pn(c);en=Y(c,O,0,1),gn=Y(c,O,1,0),rn(c,Bn)}ne=fn(c),Ee(c,m.f,ne,O,en),Ee(c,m.t,ne,O,gn)}m.f=m.t=-1,m.u.info=O,m.k=y.VNONRELOC},te=function(c,m){h(c,m),Pe(c,m),G(c,1),M(c,m,c.freereg-1)},Le=function(c,m){if(h(c,m),m.k===Oe.expkind.VNONRELOC){if(!C(m))return m.u.info;if(m.u.info>=c.nactvar)return M(c,m,m.u.info),m.u.info}return te(c,m),m.u.info},be=function(c,m){C(m)?Le(c,m):h(c,m)},De=function(c,m){let O=Oe.expkind,y=!1;switch(be(c,m),m.k){case O.VTRUE:m.u.info=ot(c,!0),y=!0;break;case O.VFALSE:m.u.info=ot(c,!1),y=!0;break;case O.VNIL:m.u.info=(function(ne){let en=new ae($e,null),gn=new ae(Xe,ne.ls.h);return In(ne,gn,en)})(c),y=!0;break;case O.VKINT:m.u.info=Mn(c,m.u.ival),y=!0;break;case O.VKFLT:m.u.info=Zn(c,m.u.nval),y=!0;break;case O.VK:y=!0}return y&&(m.k=O.VK,m.u.info<=ge.MAXINDEXRK)?ge.RKASK(m.u.info):Le(c,m)},Ye=function(c,m){let O=q(c,m.u.info);P(ge.testTMode(O.opcode)&&O.opcode!==sn.OP_TESTSET&&O.opcode!==sn.OP_TEST),ge.SETARG_A(O,!O.A)},Fe=function(c,m,O){if(m.k===Oe.expkind.VRELOCABLE){let y=g(c,m);if(y.opcode===sn.OP_NOT)return c.pc--,Ze(c,sn.OP_TEST,y.B,0,!O)}return J(c,m),Pe(c,m),Ze(c,sn.OP_TESTSET,ge.NO_REG,m.u.info,O)},Ve=function(c,m){let O,y=Oe.expkind;switch(h(c,m),m.k){case y.VJMP:Ye(c,m),O=m.u.info;break;case y.VK:case y.VKFLT:case y.VKINT:case y.VTRUE:O=-1;break;default:O=Fe(c,m,0)}m.f=Te(c,m.f,O),rn(c,m.t),m.t=-1},vn=function(c,m){let O,y=Oe.expkind;switch(h(c,m),m.k){case y.VJMP:O=m.u.info;break;case y.VNIL:case y.VFALSE:O=-1;break;default:O=Fe(c,m,1)}m.t=Te(c,m.t,O),rn(c,m.f),m.f=-1},l=function(c,m,O){let y,ne,en=Oe.expkind;if(!(y=Ce(m,!0))||!(ne=Ce(O,!0))||!(function(Bn,Hn,pe){switch(Bn){case D:case U:case z:case F:case Q:case R:return an.tointeger(Hn)!==!1&&an.tointeger(pe)!==!1;case b:case K:case A:return pe.value!==0;default:return 1}})(c,y,ne))return 0;let gn=new ae;if(Ae.luaO_arith(null,c,y,ne,gn),gn.ttisinteger())m.k=en.VKINT,m.u.ival=gn.value;else{let Bn=gn.value;if(isNaN(Bn)||Bn===0)return!1;m.k=en.VKFLT,m.u.nval=Bn}return!0},s=function(c,m,O,y,ne){let en=De(c,y),gn=De(c,O);Nn(c,O,y),O.u.info=Je(c,m,0,gn,en),O.k=Oe.expkind.VRELOCABLE,_(c,ne)},_=function(c,m){c.f.lineinfo[c.pc-1]=m};a.exports.BinOpr=oe,a.exports.NO_JUMP=-1,a.exports.UnOpr=ze,a.exports.getinstruction=g,a.exports.luaK_checkstack=Ke,a.exports.luaK_code=An,a.exports.luaK_codeABC=Je,a.exports.luaK_codeABx=le,a.exports.luaK_codeAsBx=Ie,a.exports.luaK_codek=me,a.exports.luaK_concat=Te,a.exports.luaK_dischargevars=h,a.exports.luaK_exp2RK=De,a.exports.luaK_exp2anyreg=Le,a.exports.luaK_exp2anyregup=function(c,m){(m.k!==Oe.expkind.VUPVAL||C(m))&&Le(c,m)},a.exports.luaK_exp2nextreg=te,a.exports.luaK_exp2val=be,a.exports.luaK_fixline=_,a.exports.luaK_getlabel=fn,a.exports.luaK_goiffalse=vn,a.exports.luaK_goiftrue=Ve,a.exports.luaK_indexed=function(c,m,O){let y=Oe.expkind;P(!C(m)&&(Oe.vkisinreg(m.k)||m.k===y.VUPVAL)),m.u.ind.t=m.u.info,m.u.ind.idx=De(c,O),m.u.ind.vt=m.k===y.VUPVAL?y.VUPVAL:y.VLOCAL,m.k=y.VINDEXED},a.exports.luaK_infix=function(c,m,O){switch(m){case oe.OPR_AND:Ve(c,O);break;case oe.OPR_OR:vn(c,O);break;case oe.OPR_CONCAT:te(c,O);break;case oe.OPR_ADD:case oe.OPR_SUB:case oe.OPR_MUL:case oe.OPR_DIV:case oe.OPR_IDIV:case oe.OPR_MOD:case oe.OPR_POW:case oe.OPR_BAND:case oe.OPR_BOR:case oe.OPR_BXOR:case oe.OPR_SHL:case oe.OPR_SHR:Ce(O,!1)||De(c,O);break;default:De(c,O)}},a.exports.luaK_intK=Mn,a.exports.luaK_jump=pn,a.exports.luaK_jumpto=function(c,m){return On(c,pn(c),m)},a.exports.luaK_nil=E,a.exports.luaK_numberK=Zn,a.exports.luaK_patchclose=function(c,m,O){for(O++;m!==-1;m=S(c,m)){let y=c.f.code[m];P(y.opcode===sn.OP_JMP&&(y.A===0||y.A>=O)),ge.SETARG_A(y,O)}},a.exports.luaK_patchlist=On,a.exports.luaK_patchtohere=rn,a.exports.luaK_posfix=function(c,m,O,y,ne){let en=Oe.expkind;switch(m){case oe.OPR_AND:P(O.t===-1),h(c,y),y.f=Te(c,y.f,O.f),O.to(y);break;case oe.OPR_OR:P(O.f===-1),h(c,y),y.t=Te(c,y.t,O.t),O.to(y);break;case oe.OPR_CONCAT:{be(c,y);let gn=g(c,y);y.k===en.VRELOCABLE&&gn.opcode===sn.OP_CONCAT?(P(O.u.info===gn.B-1),Pe(c,O),ge.SETARG_B(gn,O.u.info),O.k=en.VRELOCABLE,O.u.info=y.u.info):(te(c,y),s(c,sn.OP_CONCAT,O,y,ne));break}case oe.OPR_ADD:case oe.OPR_SUB:case oe.OPR_MUL:case oe.OPR_DIV:case oe.OPR_IDIV:case oe.OPR_MOD:case oe.OPR_POW:case oe.OPR_BAND:case oe.OPR_BOR:case oe.OPR_BXOR:case oe.OPR_SHL:case oe.OPR_SHR:l(m+v,O,y)||s(c,m+sn.OP_ADD,O,y,ne);break;case oe.OPR_EQ:case oe.OPR_LT:case oe.OPR_LE:case oe.OPR_NE:case oe.OPR_GT:case oe.OPR_GE:(function(gn,Bn,Hn,pe){let dn,I=Oe.expkind;Hn.k===I.VK?dn=ge.RKASK(Hn.u.info):(P(Hn.k===I.VNONRELOC),dn=Hn.u.info);let Me=De(gn,pe);switch(Nn(gn,Hn,pe),Bn){case oe.OPR_NE:Hn.u.info=Ze(gn,sn.OP_EQ,0,dn,Me);break;case oe.OPR_GT:case oe.OPR_GE:{let de=Bn-oe.OPR_NE+sn.OP_EQ;Hn.u.info=Ze(gn,de,1,Me,dn);break}default:{let de=Bn-oe.OPR_EQ+sn.OP_EQ;Hn.u.info=Ze(gn,de,1,dn,Me);break}}Hn.k=I.VJMP})(c,m,O,y)}return O},a.exports.luaK_prefix=function(c,m,O,y){let ne=new Oe.expdesc;switch(ne.k=Oe.expkind.VKINT,ne.u.ival=ne.u.nval=ne.u.info=0,ne.t=-1,ne.f=-1,m){case ze.OPR_MINUS:case ze.OPR_BNOT:if(l(m+ce,O,ne))break;case ze.OPR_LEN:(function(en,gn,Bn,Hn){let pe=Le(en,Bn);Pe(en,Bn),Bn.u.info=Je(en,gn,0,pe,0),Bn.k=Oe.expkind.VRELOCABLE,_(en,Hn)})(c,m+sn.OP_UNM,O,y);break;case ze.OPR_NOT:(function(en,gn){let Bn=Oe.expkind;switch(h(en,gn),gn.k){case Bn.VNIL:case Bn.VFALSE:gn.k=Bn.VTRUE;break;case Bn.VK:case Bn.VKFLT:case Bn.VKINT:case Bn.VTRUE:gn.k=Bn.VFALSE;break;case Bn.VJMP:Ye(en,gn);break;case Bn.VRELOCABLE:case Bn.VNONRELOC:J(en,gn),Pe(en,gn),gn.u.info=Je(en,sn.OP_NOT,0,gn.u.info,0),gn.k=Bn.VRELOCABLE}{let Hn=gn.f;gn.f=gn.t,gn.t=Hn}Ue(en,gn.f),Ue(en,gn.t)})(c,O)}},a.exports.luaK_reserveregs=G,a.exports.luaK_ret=function(c,m,O){Je(c,sn.OP_RETURN,m,O+1,0)},a.exports.luaK_self=function(c,m,O){Le(c,m);let y=m.u.info;Pe(c,m),m.u.info=c.freereg,m.k=Oe.expkind.VNONRELOC,G(c,2),Je(c,sn.OP_SELF,m.u.info,y,De(c,O)),Pe(c,O)},a.exports.luaK_setlist=function(c,m,O,y){let ne=(O-1)/ge.LFIELDS_PER_FLUSH+1,en=y===w?0:y;P(y!==0&&y<=ge.LFIELDS_PER_FLUSH),ne<=ge.MAXARG_C?Je(c,sn.OP_SETLIST,m,en,ne):ne<=ge.MAXARG_Ax?(Je(c,sn.OP_SETLIST,m,en,0),N(c,ne)):re.luaX_syntaxerror(c.ls,ln("constructor too long",!0)),c.freereg=m+1},a.exports.luaK_setmultret=function(c,m){o(c,m,w)},a.exports.luaK_setoneret=fe,a.exports.luaK_setreturns=o,a.exports.luaK_storevar=function(c,m,O){let y=Oe.expkind;switch(m.k){case y.VLOCAL:return Pe(c,O),void M(c,O,m.u.info);case y.VUPVAL:{let ne=Le(c,O);Je(c,sn.OP_SETUPVAL,ne,m.u.info,0);break}case y.VINDEXED:{let ne=m.u.ind.vt===y.VLOCAL?sn.OP_SETTABLE:sn.OP_SETTABUP,en=De(c,O);Je(c,ne,m.u.ind.t,m.u.ind.idx,en);break}}Pe(c,O)},a.exports.luaK_stringK=function(c,m){let O=new ae(se,m);return In(c,O,O)}},function(a,B,f){const{LUA_SIGNATURE:w,constant_types:{LUA_TBOOLEAN:v,LUA_TLNGSTR:D,LUA_TNIL:R,LUA_TNUMFLT:U,LUA_TNUMINT:z,LUA_TSHRSTR:b},thread_status:{LUA_ERRSYNTAX:K},is_luastring:A,luastring_eq:F,to_luastring:Q}=f(1),ce=f(8),$=f(13),ve=f(6),{MAXARG_sBx:se,POS_A:$e,POS_Ax:nn,POS_B:He,POS_Bx:Xe,POS_C:ln,POS_OP:P,SIZE_A:re,SIZE_Ax:Ae,SIZE_B:ge,SIZE_Bx:Oe,SIZE_C:tn,SIZE_OP:an}=f(16),{lua_assert:sn}=f(4),{luaS_bless:ae}=f(10),{luaZ_read:oe,ZIO:ze}=f(19);let C=[25,147,13,10,26,10];class Ce{constructor(g,S,xe){this.intSize=4,this.size_tSize=4,this.instructionSize=4,this.integerSize=4,this.numberSize=8,sn(S instanceof ze,"BytecodeParser only operates on a ZIO"),sn(A(xe)),xe[0]===64||xe[0]===61?this.name=xe.subarray(1):xe[0]==w[0]?this.name=Q("binary string",!0):this.name=xe,this.L=g,this.Z=S,this.arraybuffer=new ArrayBuffer(Math.max(this.intSize,this.size_tSize,this.instructionSize,this.integerSize,this.numberSize)),this.dv=new DataView(this.arraybuffer),this.u8=new Uint8Array(this.arraybuffer)}read(g){let S=new Uint8Array(g);return oe(this.Z,S,0,g)!==0&&this.error("truncated"),S}LoadByte(){return oe(this.Z,this.u8,0,1)!==0&&this.error("truncated"),this.u8[0]}LoadInt(){return oe(this.Z,this.u8,0,this.intSize)!==0&&this.error("truncated"),this.dv.getInt32(0,!0)}LoadNumber(){return oe(this.Z,this.u8,0,this.numberSize)!==0&&this.error("truncated"),this.dv.getFloat64(0,!0)}LoadInteger(){return oe(this.Z,this.u8,0,this.integerSize)!==0&&this.error("truncated"),this.dv.getInt32(0,!0)}LoadSize_t(){return this.LoadInteger()}LoadString(){let g=this.LoadByte();return g===255&&(g=this.LoadSize_t()),g===0?null:ae(this.L,this.read(g-1))}static MASK1(g,S){return~(-1<<g)<<S}LoadCode(g){let S=this.LoadInt(),xe=Ce;for(let Te=0;Te<S;Te++){oe(this.Z,this.u8,0,this.instructionSize)!==0&&this.error("truncated");let pn=this.dv.getUint32(0,!0);g.code[Te]={code:pn,opcode:pn>>P&xe.MASK1(an,0),A:pn>>$e&xe.MASK1(re,0),B:pn>>He&xe.MASK1(ge,0),C:pn>>ln&xe.MASK1(tn,0),Bx:pn>>Xe&xe.MASK1(Oe,0),Ax:pn>>nn&xe.MASK1(Ae,0),sBx:(pn>>Xe&xe.MASK1(Oe,0))-se}}}LoadConstants(g){let S=this.LoadInt();for(let xe=0;xe<S;xe++){let Te=this.LoadByte();switch(Te){case R:g.k.push(new ve.TValue(R,null));break;case v:g.k.push(new ve.TValue(v,this.LoadByte()!==0));break;case U:g.k.push(new ve.TValue(U,this.LoadNumber()));break;case z:g.k.push(new ve.TValue(z,this.LoadInteger()));break;case b:case D:g.k.push(new ve.TValue(D,this.LoadString()));break;default:this.error(`unrecognized constant '${Te}'`)}}}LoadProtos(g){let S=this.LoadInt();for(let xe=0;xe<S;xe++)g.p[xe]=new $.Proto(this.L),this.LoadFunction(g.p[xe],g.source)}LoadUpvalues(g){let S=this.LoadInt();for(let xe=0;xe<S;xe++)g.upvalues[xe]={name:null,instack:this.LoadByte(),idx:this.LoadByte()}}LoadDebug(g){let S=this.LoadInt();for(let xe=0;xe<S;xe++)g.lineinfo[xe]=this.LoadInt();S=this.LoadInt();for(let xe=0;xe<S;xe++)g.locvars[xe]={varname:this.LoadString(),startpc:this.LoadInt(),endpc:this.LoadInt()};S=this.LoadInt();for(let xe=0;xe<S;xe++)g.upvalues[xe].name=this.LoadString()}LoadFunction(g,S){g.source=this.LoadString(),g.source===null&&(g.source=S),g.linedefined=this.LoadInt(),g.lastlinedefined=this.LoadInt(),g.numparams=this.LoadByte(),g.is_vararg=this.LoadByte()!==0,g.maxstacksize=this.LoadByte(),this.LoadCode(g),this.LoadConstants(g),this.LoadUpvalues(g),this.LoadProtos(g),this.LoadDebug(g)}checkliteral(g,S){let xe=this.read(g.length);F(xe,g)||this.error(S)}checkHeader(){this.checkliteral(w.subarray(1),"not a"),this.LoadByte()!==83&&this.error("version mismatch in"),this.LoadByte()!==0&&this.error("format mismatch in"),this.checkliteral(C,"corrupted"),this.intSize=this.LoadByte(),this.size_tSize=this.LoadByte(),this.instructionSize=this.LoadByte(),this.integerSize=this.LoadByte(),this.numberSize=this.LoadByte(),this.checksize(this.intSize,4,"int"),this.checksize(this.size_tSize,4,"size_t"),this.checksize(this.instructionSize,4,"instruction"),this.checksize(this.integerSize,4,"integer"),this.checksize(this.numberSize,8,"number"),this.LoadInteger()!==22136&&this.error("endianness mismatch in"),this.LoadNumber()!==370.5&&this.error("float format mismatch in")}error(g){ve.luaO_pushfstring(this.L,Q("%s: %s precompiled chunk"),this.name,Q(g)),ce.luaD_throw(this.L,K)}checksize(g,S,xe){g!==S&&this.error(`${xe} size mismatch in`)}}a.exports.luaU_undump=function(E,g,S){let xe=new Ce(E,g,S);xe.checkHeader();let Te=$.luaF_newLclosure(E,xe.LoadByte());return ce.luaD_inctop(E),E.stack[E.top-1].setclLvalue(Te),Te.p=new $.Proto(E),xe.LoadFunction(Te.p,null),sn(Te.nupvalues===Te.p.upvalues.length),Te}},function(a,B,f){const{LUA_SIGNATURE:w,LUA_VERSION_MAJOR:v,LUA_VERSION_MINOR:D,constant_types:{LUA_TBOOLEAN:R,LUA_TLNGSTR:U,LUA_TNIL:z,LUA_TNUMFLT:b,LUA_TNUMINT:K,LUA_TSHRSTR:A},luastring_of:F}=f(1),Q=F(25,147,13,10,26,10),ce=16*Number(v)+Number(D),$=function(ln,P,re){re.status===0&&P>0&&(re.status=re.writer(re.L,ln,P,re.data))},ve=function(ln,P){$(F(ln),1,P)},se=function(ln,P){let re=new ArrayBuffer(4);new DataView(re).setInt32(0,ln,!0);let Ae=new Uint8Array(re);$(Ae,4,P)},$e=function(ln,P){let re=new ArrayBuffer(4);new DataView(re).setInt32(0,ln,!0);let Ae=new Uint8Array(re);$(Ae,4,P)},nn=function(ln,P){let re=new ArrayBuffer(8);new DataView(re).setFloat64(0,ln,!0);let Ae=new Uint8Array(re);$(Ae,8,P)},He=function(ln,P){if(ln===null)ve(0,P);else{let re=ln.tsslen()+1,Ae=ln.getstr();re<255?ve(re,P):(ve(255,P),$e(re,P)),$(Ae,re-1,P)}},Xe=function(ln,P,re){re.strip||ln.source===P?He(null,re):He(ln.source,re),se(ln.linedefined,re),se(ln.lastlinedefined,re),ve(ln.numparams,re),ve(ln.is_vararg?1:0,re),ve(ln.maxstacksize,re),(function(Ae,ge){let Oe=Ae.code.map(tn=>tn.code);se(Oe.length,ge);for(let tn=0;tn<Oe.length;tn++)se(Oe[tn],ge)})(ln,re),(function(Ae,ge){let Oe=Ae.k.length;se(Oe,ge);for(let tn=0;tn<Oe;tn++){let an=Ae.k[tn];switch(ve(an.ttype(),ge),an.ttype()){case z:break;case R:ve(an.value?1:0,ge);break;case b:nn(an.value,ge);break;case K:$e(an.value,ge);break;case A:case U:He(an.tsvalue(),ge)}}})(ln,re),(function(Ae,ge){let Oe=Ae.upvalues.length;se(Oe,ge);for(let tn=0;tn<Oe;tn++)ve(Ae.upvalues[tn].instack?1:0,ge),ve(Ae.upvalues[tn].idx,ge)})(ln,re),(function(Ae,ge){let Oe=Ae.p.length;se(Oe,ge);for(let tn=0;tn<Oe;tn++)Xe(Ae.p[tn],Ae.source,ge)})(ln,re),(function(Ae,ge){let Oe=ge.strip?0:Ae.lineinfo.length;se(Oe,ge);for(let tn=0;tn<Oe;tn++)se(Ae.lineinfo[tn],ge);Oe=ge.strip?0:Ae.locvars.length,se(Oe,ge);for(let tn=0;tn<Oe;tn++)He(Ae.locvars[tn].varname,ge),se(Ae.locvars[tn].startpc,ge),se(Ae.locvars[tn].endpc,ge);Oe=ge.strip?0:Ae.upvalues.length,se(Oe,ge);for(let tn=0;tn<Oe;tn++)He(Ae.upvalues[tn].name,ge)})(ln,re)};a.exports.luaU_dump=function(ln,P,re,Ae,ge){let Oe=new class{constructor(){this.L=null,this.write=null,this.data=null,this.strip=NaN,this.status=NaN}};return Oe.L=ln,Oe.writer=re,Oe.data=Ae,Oe.strip=ge,Oe.status=0,(function(tn){$(w,w.length,tn),ve(ce,tn),ve(0,tn),$(Q,Q.length,tn),ve(4,tn),ve(4,tn),ve(4,tn),ve(4,tn),ve(8,tn),$e(22136,tn),nn(370.5,tn)})(Oe),ve(P.upvalues.length,Oe),Xe(P,null,Oe),Oe.status}},function(a,B,f){var w;(function(){var v={not_type:/[^T]/,not_primitive:/[^v]/,number:/[diefg]/,numeric_arg:/[bcdiefguxX]/,json:/[j]/,text:/^[^\x25]+/,modulo:/^\x25{2}/,placeholder:/^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-gijostTuvxX])/,key:/^([a-z_][a-z_\d]*)/i,key_access:/^\.([a-z_][a-z_\d]*)/i,index_access:/^\[(\d+)\]/,sign:/^[\+\-]/};function D(z){return(function(b,K){var A,F,Q,ce,$,ve,se,$e,nn,He=1,Xe=b.length,ln="";for(F=0;F<Xe;F++)if(typeof b[F]=="string")ln+=b[F];else if(Array.isArray(b[F])){if((ce=b[F])[2])for(A=K[He],Q=0;Q<ce[2].length;Q++){if(!A.hasOwnProperty(ce[2][Q]))throw new Error(D('[sprintf] property "%s" does not exist',ce[2][Q]));A=A[ce[2][Q]]}else A=ce[1]?K[ce[1]]:K[He++];if(v.not_type.test(ce[8])&&v.not_primitive.test(ce[8])&&A instanceof Function&&(A=A()),v.numeric_arg.test(ce[8])&&typeof A!="number"&&isNaN(A))throw new TypeError(D("[sprintf] expecting number but found %T",A));switch(v.number.test(ce[8])&&($e=A>=0),ce[8]){case"b":A=parseInt(A,10).toString(2);break;case"c":A=String.fromCharCode(parseInt(A,10));break;case"d":case"i":A=parseInt(A,10);break;case"j":A=JSON.stringify(A,null,ce[6]?parseInt(ce[6]):0);break;case"e":A=ce[7]?parseFloat(A).toExponential(ce[7]):parseFloat(A).toExponential();break;case"f":A=ce[7]?parseFloat(A).toFixed(ce[7]):parseFloat(A);break;case"g":A=ce[7]?String(Number(A.toPrecision(ce[7]))):parseFloat(A);break;case"o":A=(parseInt(A,10)>>>0).toString(8);break;case"s":A=String(A),A=ce[7]?A.substring(0,ce[7]):A;break;case"t":A=String(!!A),A=ce[7]?A.substring(0,ce[7]):A;break;case"T":A=Object.prototype.toString.call(A).slice(8,-1).toLowerCase(),A=ce[7]?A.substring(0,ce[7]):A;break;case"u":A=parseInt(A,10)>>>0;break;case"v":A=A.valueOf(),A=ce[7]?A.substring(0,ce[7]):A;break;case"x":A=(parseInt(A,10)>>>0).toString(16);break;case"X":A=(parseInt(A,10)>>>0).toString(16).toUpperCase()}v.json.test(ce[8])?ln+=A:(!v.number.test(ce[8])||$e&&!ce[3]?nn="":(nn=$e?"+":"-",A=A.toString().replace(v.sign,"")),ve=ce[4]?ce[4]==="0"?"0":ce[4].charAt(1):" ",se=ce[6]-(nn+A).length,$=ce[6]&&se>0?ve.repeat(se):"",ln+=ce[5]?nn+A+$:ve==="0"?nn+$+A:$+nn+A)}return ln})((function(b){if(U[b])return U[b];for(var K,A=b,F=[],Q=0;A;){if((K=v.text.exec(A))!==null)F.push(K[0]);else if((K=v.modulo.exec(A))!==null)F.push("%");else{if((K=v.placeholder.exec(A))===null)throw new SyntaxError("[sprintf] unexpected placeholder");if(K[2]){Q|=1;var ce=[],$=K[2],ve=[];if((ve=v.key.exec($))===null)throw new SyntaxError("[sprintf] failed to parse named argument key");for(ce.push(ve[1]);($=$.substring(ve[0].length))!=="";)if((ve=v.key_access.exec($))!==null)ce.push(ve[1]);else{if((ve=v.index_access.exec($))===null)throw new SyntaxError("[sprintf] failed to parse named argument key");ce.push(ve[1])}K[2]=ce}else Q|=2;if(Q===3)throw new Error("[sprintf] mixing positional and named placeholders is not (yet) supported");F.push(K)}A=A.substring(K[0].length)}return U[b]=F})(z),arguments)}function R(z,b){return D.apply(null,[z].concat(b||[]))}var U=Object.create(null);B.sprintf=D,B.vsprintf=R,typeof window<"u"&&(window.sprintf=D,window.vsprintf=R,(w=(function(){return{sprintf:D,vsprintf:R}}).call(B,f,B,a))===void 0||(a.exports=w))})()},function(a,B,f){const{lua_pop:w}=f(2),{luaL_requiref:v}=f(7),{to_luastring:D}=f(5),R={};a.exports.luaL_openlibs=function($e){for(let nn in R)v($e,D(nn),R[nn],1),w($e,1)};const U=f(17),{luaopen_base:z}=f(24),{luaopen_coroutine:b}=f(25),{luaopen_debug:K}=f(31),{luaopen_math:A}=f(30),{luaopen_package:F}=f(32),{luaopen_os:Q}=f(27),{luaopen_string:ce}=f(28),{luaopen_table:$}=f(26),{luaopen_utf8:ve}=f(29);R._G=z,R[U.LUA_LOADLIBNAME]=F,R[U.LUA_COLIBNAME]=b,R[U.LUA_TABLIBNAME]=$,R[U.LUA_OSLIBNAME]=Q,R[U.LUA_STRLIBNAME]=ce,R[U.LUA_MATHLIBNAME]=A,R[U.LUA_UTF8LIBNAME]=ve,R[U.LUA_DBLIBNAME]=K;const{luaopen_fengari:se}=f(33);R[U.LUA_FENGARILIBNAME]=se}])),Wi}var Wc=o_();const qc=Zi(Wc),i_=bd({__proto__:null,default:qc},[Wc]),mo=qc??i_,ft=mo.lua,qi=mo.lauxlib,s_=mo.lualib,$c=mo,hl=$c.to_luastring??(a=>a),Qi=$c.to_jsstring??(a=>String(a));function Lc(a){try{const B=ft.lua_tostring(a,-1);return B!=null?Qi(B):"unknown error"}catch{return"unknown error"}}class u_{constructor(B,f=42,w=""){dc(this,"L");this.L=qi.luaL_newstate(),s_.luaL_openlibs(this.L),this.seedRandom(f);const v=w?w+`

`+B:B;if(qi.luaL_dostring(this.L,hl(v))!==ft.LUA_OK){const R=Lc(this.L);throw ft.lua_pop(this.L,1),new ho(`Lua load error: ${R}`)}}call(B,...f){if(ft.lua_getglobal(this.L,hl(B)),ft.lua_type(this.L,-1)!==ft.LUA_TFUNCTION)throw ft.lua_pop(this.L,1),new ho(`Lua function not found: ${B}`);for(const D of f)this.pushValue(D);if(ft.lua_pcall(this.L,f.length,1,0)!==ft.LUA_OK){const D=Lc(this.L);throw ft.lua_pop(this.L,1),new ho(`Lua error in ${B}: ${D}`)}const v=this.pullValue(-1);return ft.lua_pop(this.L,1),v}seedRandom(B){qi.luaL_dostring(this.L,hl(`math.randomseed(${B})`))}pushValue(B){if(B==null)ft.lua_pushnil(this.L);else if(typeof B=="boolean")ft.lua_pushboolean(this.L,B?1:0);else if(typeof B=="number")ft.lua_pushnumber(this.L,B);else if(typeof B=="string")ft.lua_pushstring(this.L,hl(B));else if(Array.isArray(B))ft.lua_newtable(this.L),B.forEach((f,w)=>{ft.lua_pushnumber(this.L,w+1),this.pushValue(f),ft.lua_settable(this.L,-3)});else if(typeof B=="object"){ft.lua_newtable(this.L);for(const[f,w]of Object.entries(B))ft.lua_pushstring(this.L,hl(f)),this.pushValue(w),ft.lua_settable(this.L,-3)}else throw new ho(`Cannot push value of type ${typeof B} to Lua`)}pullValue(B){switch(ft.lua_type(this.L,B)){case ft.LUA_TNIL:return null;case ft.LUA_TBOOLEAN:return!!ft.lua_toboolean(this.L,B);case ft.LUA_TNUMBER:return ft.lua_tonumber(this.L,B);case ft.LUA_TSTRING:{const w=ft.lua_tostring(this.L,B);return w!=null?Qi(w):null}case ft.LUA_TTABLE:return this.pullTable(B);default:return null}}pullTable(B){const f=B<0?ft.lua_gettop(this.L)+B+1:B,w={};let v=!0,D=0;for(ft.lua_pushnil(this.L);ft.lua_next(this.L,f)!==0;){const R=ft.lua_type(this.L,-2);let U;if(R===ft.LUA_TNUMBER)U=ft.lua_tonumber(this.L,-2),!Number.isInteger(U)||U<1?v=!1:D=Math.max(D,U);else{const z=ft.lua_tostring(this.L,-2);U=z!=null?Qi(z):String(Math.random()),v=!1}w[U]=this.pullValue(-1),ft.lua_pop(this.L,1)}if(v&&D===Object.keys(w).length){const R=[];for(let U=1;U<=D;U++)R.push(w[U]);return R}return w}}function c_(a,B=42){const f=Yc(a),w=new u_(f.logic,B,f.engineSource);return{gameId:a,files:f,executor:w}}function S_(a,B,...f){return a.executor.call(B,...f)}function O_(a,B){const f=a.files.data[B];if(!f)throw new Np(`Schema not found: ${B}`);return f.fields??f}function f_({gameId:a}){const[B,f]=Da.useState(null),[w,v]=Da.useState(null),[D,R]=Da.useState(null);Da.useEffect(()=>{const b=Tc(a);if(b!=null&&b.embedUrl)return;if(b!=null&&b.externalUrl){window.open(b.externalUrl,"_blank","noopener,noreferrer"),t_();return}let K=!1;return(async()=>{try{const A=await c_(a,42);if(!b){R(`Game "${a}" loaded successfully but has no registered config in registry.ts — this is a studio configuration error, not a player-facing one. Check that the game is added to GAME_REGISTRY.`);return}K||(f(A),v(b))}catch(A){K||R(A instanceof Error?A.message:`Failed to load game: ${a}`)}})(),()=>{K=!0}},[a]);const U=Tc(a);if(U!=null&&U.embedUrl)if(U.embedWidth&&U.embedHeight){const b=U.embedHeight/U.embedWidth*100;return lt.jsx("div",{className:"arcade-game-wrap",children:lt.jsxs("div",{className:"arcade-game-content",style:{position:"relative",width:"100%",maxWidth:`${U.embedWidth}px`,margin:"0 auto"},children:[lt.jsx("div",{style:{position:"relative",width:"100%",paddingTop:`${b}%`},children:lt.jsx("iframe",{src:U.embedUrl,allowFullScreen:!0,style:{position:"absolute",top:0,left:0,width:"100%",height:"100%",border:0},title:`${U.label} — playable embed`})}),U.externalUrl&&lt.jsx("a",{href:U.externalUrl,target:"_blank",rel:"noopener noreferrer",style:{display:"block",textAlign:"center",marginTop:"8px",fontSize:"0.8rem"},children:"Open on itch.io ↗"})]})})}else return lt.jsx("div",{className:"arcade-game-wrap",children:lt.jsx("div",{style:{width:"100%",maxWidth:"1200px",height:"min(85vh, 900px)",margin:"0 auto"},children:lt.jsx("iframe",{src:U.embedUrl,style:{width:"100%",height:"100%",border:0},title:`${U.label} — playable embed`})})});if(D)return lt.jsx("div",{className:"arcade-error",children:lt.jsxs("div",{className:"arcade-error-box",children:[lt.jsx("strong",{children:"Studio Error"}),lt.jsx("p",{children:D}),lt.jsxs("small",{children:["Game ID: ",a]})]})});if(!B||!w)return lt.jsx("div",{className:"arcade-loading",children:lt.jsxs("span",{children:["Loading ",a,"…"]})});const z=w.component;return z?lt.jsx("div",{className:"arcade-game-wrap",children:lt.jsx("div",{className:"arcade-game-content",children:lt.jsx(ma.Suspense,{fallback:lt.jsx("div",{className:"arcade-loading",children:"Loading renderer…"}),children:lt.jsx(z,{session:B})})})}):lt.jsx("div",{className:"arcade-error",children:lt.jsxs("div",{className:"arcade-error-box",children:[lt.jsx("strong",{children:"No Renderer"}),lt.jsxs("p",{children:['Game "',a,'" has no in-app component. It may be an external game.']})]})})}function d_(){const a=n_();return a?lt.jsx(f_,{gameId:a}):lt.jsx(l_,{})}const bc=document.getElementById("root");bc&&Dd.createRoot(bc).render(lt.jsx(d_,{}));export{Np as R,S_ as c,O_ as g,lt as j,t_ as n,Da as r};
