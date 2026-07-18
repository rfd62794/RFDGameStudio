const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/App-BOwfuWSn.js","assets/useLuaCall-DyJMH3-R.js","assets/TabBar-D7O7KfTn.js","assets/createLucideIcon-B5sz3hFs.js","assets/GameShell-BzVijcn7.js","assets/proxy-CPjvzwHH.js","assets/App-CWEhOl1U.css","assets/App-D2te7jIs.js","assets/sparkles-dICutrF0.js","assets/shield-alert-D7_LtLeX.js","assets/zap-D6zixmHx.js","assets/compass-C-8C5YOv.js","assets/shield-CmowknKu.js","assets/useGameLoop-C2k6XxOn.js","assets/Modal-D5HN6efj.js","assets/App-B8LPoEUy.css","assets/App-keQbBdau.js","assets/useGameState-pi1hxZrE.js","assets/App-DTWyOwS1.css","assets/App-B1hvT4Yk.js","assets/App-C_QE1ECA.css","assets/App-CXow-vKy.js","assets/App-L63g84V7.css","assets/App-BY6ST3j9.js","assets/lock-AYHOPKpu.js","assets/heart-BPSeFI7j.js","assets/App-DHxkqi3v.css","assets/App-IqF20-rn.js","assets/triangle-alert-ZlsFpaoo.js","assets/App-5TwLr-tw.js","assets/App-DpkbbMLd.css","assets/App--FK28qgl.js","assets/App-DUK3DKKn.css"])))=>i.map(i=>d[i]);
var Ef=Object.defineProperty;var Sf=(a,B,d)=>B in a?Ef(a,B,{enumerable:!0,configurable:!0,writable:!0,value:d}):a[B]=d;var pc=(a,B,d)=>Sf(a,typeof B!="symbol"?B+"":B,d);function Lf(a,B){for(var d=0;d<B.length;d++){const A=B[d];if(typeof A!="string"&&!Array.isArray(A)){for(const v in A)if(v!=="default"&&!(v in a)){const D=Object.getOwnPropertyDescriptor(A,v);D&&Object.defineProperty(a,v,D.get?D:{enumerable:!0,get:()=>A[v]})}}}return Object.freeze(Object.defineProperty(a,Symbol.toStringTag,{value:"Module"}))}(function(){const B=document.createElement("link").relList;if(B&&B.supports&&B.supports("modulepreload"))return;for(const v of document.querySelectorAll('link[rel="modulepreload"]'))A(v);new MutationObserver(v=>{for(const D of v)if(D.type==="childList")for(const R of D.addedNodes)R.tagName==="LINK"&&R.rel==="modulepreload"&&A(R)}).observe(document,{childList:!0,subtree:!0});function d(v){const D={};return v.integrity&&(D.integrity=v.integrity),v.referrerPolicy&&(D.referrerPolicy=v.referrerPolicy),v.crossOrigin==="use-credentials"?D.credentials="include":v.crossOrigin==="anonymous"?D.credentials="omit":D.credentials="same-origin",D}function A(v){if(v.ep)return;v.ep=!0;const D=d(v);fetch(v.href,D)}})();function Jl(a){return a&&a.__esModule&&Object.prototype.hasOwnProperty.call(a,"default")?a.default:a}var jl={exports:{}},_i={},zl={exports:{}},ct={};/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var _c;function Of(){if(_c)return ct;_c=1;var a=Symbol.for("react.element"),B=Symbol.for("react.portal"),d=Symbol.for("react.fragment"),A=Symbol.for("react.strict_mode"),v=Symbol.for("react.profiler"),D=Symbol.for("react.provider"),R=Symbol.for("react.context"),I=Symbol.for("react.forward_ref"),z=Symbol.for("react.suspense"),S=Symbol.for("react.memo"),H=Symbol.for("react.lazy"),b=Symbol.iterator;function F(g){return g===null||typeof g!="object"?null:(g=b&&g[b]||g["@@iterator"],typeof g=="function"?g:null)}var Q={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},ce=Object.assign,$={};function ve(g,L,xe){this.props=g,this.context=L,this.refs=$,this.updater=xe||Q}ve.prototype.isReactComponent={},ve.prototype.setState=function(g,L){if(typeof g!="object"&&typeof g!="function"&&g!=null)throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,g,L,"setState")},ve.prototype.forceUpdate=function(g){this.updater.enqueueForceUpdate(this,g,"forceUpdate")};function se(){}se.prototype=ve.prototype;function $e(g,L,xe){this.props=g,this.context=L,this.refs=$,this.updater=xe||Q}var nn=$e.prototype=new se;nn.constructor=$e,ce(nn,ve.prototype),nn.isPureReactComponent=!0;var Ke=Array.isArray,qe=Object.prototype.hasOwnProperty,on={current:null},P={key:!0,ref:!0,__self:!0,__source:!0};function re(g,L,xe){var we,pn={},Ze=null,dn=null;if(L!=null)for(we in L.ref!==void 0&&(dn=L.ref),L.key!==void 0&&(Ze=""+L.key),L)qe.call(L,we)&&!P.hasOwnProperty(we)&&(pn[we]=L[we]);var mn=arguments.length-2;if(mn===1)pn.children=xe;else if(1<mn){for(var Y=Array(mn),ee=0;ee<mn;ee++)Y[ee]=arguments[ee+2];pn.children=Y}if(g&&g.defaultProps)for(we in mn=g.defaultProps,mn)pn[we]===void 0&&(pn[we]=mn[we]);return{$$typeof:a,type:g,key:Ze,ref:dn,props:pn,_owner:on.current}}function be(g,L){return{$$typeof:a,type:g.type,key:L,ref:g.ref,props:g.props,_owner:g._owner}}function ge(g){return typeof g=="object"&&g!==null&&g.$$typeof===a}function Oe(g){var L={"=":"=0",":":"=2"};return"$"+g.replace(/[=:]/g,function(xe){return L[xe]})}var tn=/\/+/g;function an(g,L){return typeof g=="object"&&g!==null&&g.key!=null?Oe(""+g.key):L.toString(36)}function sn(g,L,xe,we,pn){var Ze=typeof g;(Ze==="undefined"||Ze==="boolean")&&(g=null);var dn=!1;if(g===null)dn=!0;else switch(Ze){case"string":case"number":dn=!0;break;case"object":switch(g.$$typeof){case a:case B:dn=!0}}if(dn)return dn=g,pn=pn(dn),g=we===""?"."+an(dn,0):we,Ke(pn)?(xe="",g!=null&&(xe=g.replace(tn,"$&/")+"/"),sn(pn,L,xe,"",function(ee){return ee})):pn!=null&&(ge(pn)&&(pn=be(pn,xe+(!pn.key||dn&&dn.key===pn.key?"":(""+pn.key).replace(tn,"$&/")+"/")+g)),L.push(pn)),1;if(dn=0,we=we===""?".":we+":",Ke(g))for(var mn=0;mn<g.length;mn++){Ze=g[mn];var Y=we+an(Ze,mn);dn+=sn(Ze,L,xe,Y,pn)}else if(Y=F(g),typeof Y=="function")for(g=Y.call(g),mn=0;!(Ze=g.next()).done;)Ze=Ze.value,Y=we+an(Ze,mn++),dn+=sn(Ze,L,xe,Y,pn);else if(Ze==="object")throw L=String(g),Error("Objects are not valid as a React child (found: "+(L==="[object Object]"?"object with keys {"+Object.keys(g).join(", ")+"}":L)+"). If you meant to render a collection of children, use an array instead.");return dn}function ae(g,L,xe){if(g==null)return g;var we=[],pn=0;return sn(g,we,"","",function(Ze){return L.call(xe,Ze,pn++)}),we}function oe(g){if(g._status===-1){var L=g._result;L=L(),L.then(function(xe){(g._status===0||g._status===-1)&&(g._status=1,g._result=xe)},function(xe){(g._status===0||g._status===-1)&&(g._status=2,g._result=xe)}),g._status===-1&&(g._status=0,g._result=L)}if(g._status===1)return g._result.default;throw g._result}var ze={current:null},C={transition:null},Ce={ReactCurrentDispatcher:ze,ReactCurrentBatchConfig:C,ReactCurrentOwner:on};function T(){throw Error("act(...) is not supported in production builds of React.")}return ct.Children={map:ae,forEach:function(g,L,xe){ae(g,function(){L.apply(this,arguments)},xe)},count:function(g){var L=0;return ae(g,function(){L++}),L},toArray:function(g){return ae(g,function(L){return L})||[]},only:function(g){if(!ge(g))throw Error("React.Children.only expected to receive a single React element child.");return g}},ct.Component=ve,ct.Fragment=d,ct.Profiler=v,ct.PureComponent=$e,ct.StrictMode=A,ct.Suspense=z,ct.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=Ce,ct.act=T,ct.cloneElement=function(g,L,xe){if(g==null)throw Error("React.cloneElement(...): The argument must be a React element, but you passed "+g+".");var we=ce({},g.props),pn=g.key,Ze=g.ref,dn=g._owner;if(L!=null){if(L.ref!==void 0&&(Ze=L.ref,dn=on.current),L.key!==void 0&&(pn=""+L.key),g.type&&g.type.defaultProps)var mn=g.type.defaultProps;for(Y in L)qe.call(L,Y)&&!P.hasOwnProperty(Y)&&(we[Y]=L[Y]===void 0&&mn!==void 0?mn[Y]:L[Y])}var Y=arguments.length-2;if(Y===1)we.children=xe;else if(1<Y){mn=Array(Y);for(var ee=0;ee<Y;ee++)mn[ee]=arguments[ee+2];we.children=mn}return{$$typeof:a,type:g.type,key:pn,ref:Ze,props:we,_owner:dn}},ct.createContext=function(g){return g={$$typeof:R,_currentValue:g,_currentValue2:g,_threadCount:0,Provider:null,Consumer:null,_defaultValue:null,_globalName:null},g.Provider={$$typeof:D,_context:g},g.Consumer=g},ct.createElement=re,ct.createFactory=function(g){var L=re.bind(null,g);return L.type=g,L},ct.createRef=function(){return{current:null}},ct.forwardRef=function(g){return{$$typeof:I,render:g}},ct.isValidElement=ge,ct.lazy=function(g){return{$$typeof:H,_payload:{_status:-1,_result:g},_init:oe}},ct.memo=function(g,L){return{$$typeof:S,type:g,compare:L===void 0?null:L}},ct.startTransition=function(g){var L=C.transition;C.transition={};try{g()}finally{C.transition=L}},ct.unstable_act=T,ct.useCallback=function(g,L){return ze.current.useCallback(g,L)},ct.useContext=function(g){return ze.current.useContext(g)},ct.useDebugValue=function(){},ct.useDeferredValue=function(g){return ze.current.useDeferredValue(g)},ct.useEffect=function(g,L){return ze.current.useEffect(g,L)},ct.useId=function(){return ze.current.useId()},ct.useImperativeHandle=function(g,L,xe){return ze.current.useImperativeHandle(g,L,xe)},ct.useInsertionEffect=function(g,L){return ze.current.useInsertionEffect(g,L)},ct.useLayoutEffect=function(g,L){return ze.current.useLayoutEffect(g,L)},ct.useMemo=function(g,L){return ze.current.useMemo(g,L)},ct.useReducer=function(g,L,xe){return ze.current.useReducer(g,L,xe)},ct.useRef=function(g){return ze.current.useRef(g)},ct.useState=function(g){return ze.current.useState(g)},ct.useSyncExternalStore=function(g,L,xe){return ze.current.useSyncExternalStore(g,L,xe)},ct.useTransition=function(){return ze.current.useTransition()},ct.version="18.3.1",ct}var hc;function es(){return hc||(hc=1,zl.exports=Of()),zl.exports}/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var mc;function Rf(){if(mc)return _i;mc=1;var a=es(),B=Symbol.for("react.element"),d=Symbol.for("react.fragment"),A=Object.prototype.hasOwnProperty,v=a.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,D={key:!0,ref:!0,__self:!0,__source:!0};function R(I,z,S){var H,b={},F=null,Q=null;S!==void 0&&(F=""+S),z.key!==void 0&&(F=""+z.key),z.ref!==void 0&&(Q=z.ref);for(H in z)A.call(z,H)&&!D.hasOwnProperty(H)&&(b[H]=z[H]);if(I&&I.defaultProps)for(H in z=I.defaultProps,z)b[H]===void 0&&(b[H]=z[H]);return{$$typeof:B,type:I,key:F,ref:Q,props:b,_owner:v.current}}return _i.Fragment=d,_i.jsx=R,_i.jsxs=R,_i}var gc;function Nf(){return gc||(gc=1,jl.exports=Rf()),jl.exports}var tt=Nf(),_o={},Hl={exports:{}},nr={},Kl={exports:{}},ql={};/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var yc;function Cf(){return yc||(yc=1,(function(a){function B(C,Ce){var T=C.length;C.push(Ce);e:for(;0<T;){var g=T-1>>>1,L=C[g];if(0<v(L,Ce))C[g]=Ce,C[T]=L,T=g;else break e}}function d(C){return C.length===0?null:C[0]}function A(C){if(C.length===0)return null;var Ce=C[0],T=C.pop();if(T!==Ce){C[0]=T;e:for(var g=0,L=C.length,xe=L>>>1;g<xe;){var we=2*(g+1)-1,pn=C[we],Ze=we+1,dn=C[Ze];if(0>v(pn,T))Ze<L&&0>v(dn,pn)?(C[g]=dn,C[Ze]=T,g=Ze):(C[g]=pn,C[we]=T,g=we);else if(Ze<L&&0>v(dn,T))C[g]=dn,C[Ze]=T,g=Ze;else break e}}return Ce}function v(C,Ce){var T=C.sortIndex-Ce.sortIndex;return T!==0?T:C.id-Ce.id}if(typeof performance=="object"&&typeof performance.now=="function"){var D=performance;a.unstable_now=function(){return D.now()}}else{var R=Date,I=R.now();a.unstable_now=function(){return R.now()-I}}var z=[],S=[],H=1,b=null,F=3,Q=!1,ce=!1,$=!1,ve=typeof setTimeout=="function"?setTimeout:null,se=typeof clearTimeout=="function"?clearTimeout:null,$e=typeof setImmediate<"u"?setImmediate:null;typeof navigator<"u"&&navigator.scheduling!==void 0&&navigator.scheduling.isInputPending!==void 0&&navigator.scheduling.isInputPending.bind(navigator.scheduling);function nn(C){for(var Ce=d(S);Ce!==null;){if(Ce.callback===null)A(S);else if(Ce.startTime<=C)A(S),Ce.sortIndex=Ce.expirationTime,B(z,Ce);else break;Ce=d(S)}}function Ke(C){if($=!1,nn(C),!ce)if(d(z)!==null)ce=!0,oe(qe);else{var Ce=d(S);Ce!==null&&ze(Ke,Ce.startTime-C)}}function qe(C,Ce){ce=!1,$&&($=!1,se(re),re=-1),Q=!0;var T=F;try{for(nn(Ce),b=d(z);b!==null&&(!(b.expirationTime>Ce)||C&&!Oe());){var g=b.callback;if(typeof g=="function"){b.callback=null,F=b.priorityLevel;var L=g(b.expirationTime<=Ce);Ce=a.unstable_now(),typeof L=="function"?b.callback=L:b===d(z)&&A(z),nn(Ce)}else A(z);b=d(z)}if(b!==null)var xe=!0;else{var we=d(S);we!==null&&ze(Ke,we.startTime-Ce),xe=!1}return xe}finally{b=null,F=T,Q=!1}}var on=!1,P=null,re=-1,be=5,ge=-1;function Oe(){return!(a.unstable_now()-ge<be)}function tn(){if(P!==null){var C=a.unstable_now();ge=C;var Ce=!0;try{Ce=P(!0,C)}finally{Ce?an():(on=!1,P=null)}}else on=!1}var an;if(typeof $e=="function")an=function(){$e(tn)};else if(typeof MessageChannel<"u"){var sn=new MessageChannel,ae=sn.port2;sn.port1.onmessage=tn,an=function(){ae.postMessage(null)}}else an=function(){ve(tn,0)};function oe(C){P=C,on||(on=!0,an())}function ze(C,Ce){re=ve(function(){C(a.unstable_now())},Ce)}a.unstable_IdlePriority=5,a.unstable_ImmediatePriority=1,a.unstable_LowPriority=4,a.unstable_NormalPriority=3,a.unstable_Profiling=null,a.unstable_UserBlockingPriority=2,a.unstable_cancelCallback=function(C){C.callback=null},a.unstable_continueExecution=function(){ce||Q||(ce=!0,oe(qe))},a.unstable_forceFrameRate=function(C){0>C||125<C?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):be=0<C?Math.floor(1e3/C):5},a.unstable_getCurrentPriorityLevel=function(){return F},a.unstable_getFirstCallbackNode=function(){return d(z)},a.unstable_next=function(C){switch(F){case 1:case 2:case 3:var Ce=3;break;default:Ce=F}var T=F;F=Ce;try{return C()}finally{F=T}},a.unstable_pauseExecution=function(){},a.unstable_requestPaint=function(){},a.unstable_runWithPriority=function(C,Ce){switch(C){case 1:case 2:case 3:case 4:case 5:break;default:C=3}var T=F;F=C;try{return Ce()}finally{F=T}},a.unstable_scheduleCallback=function(C,Ce,T){var g=a.unstable_now();switch(typeof T=="object"&&T!==null?(T=T.delay,T=typeof T=="number"&&0<T?g+T:g):T=g,C){case 1:var L=-1;break;case 2:L=250;break;case 5:L=1073741823;break;case 4:L=1e4;break;default:L=5e3}return L=T+L,C={id:H++,callback:Ce,priorityLevel:C,startTime:T,expirationTime:L,sortIndex:-1},T>g?(C.sortIndex=T,B(S,C),d(z)===null&&C===d(S)&&($?(se(re),re=-1):$=!0,ze(Ke,T-g))):(C.sortIndex=L,B(z,C),ce||Q||(ce=!0,oe(qe))),C},a.unstable_shouldYield=Oe,a.unstable_wrapCallback=function(C){var Ce=F;return function(){var T=F;F=Ce;try{return C.apply(this,arguments)}finally{F=T}}}})(ql)),ql}var vc;function Mf(){return vc||(vc=1,Kl.exports=Cf()),Kl.exports}/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var xc;function If(){if(xc)return nr;xc=1;var a=es(),B=Mf();function d(e){for(var n="https://reactjs.org/docs/error-decoder.html?invariant="+e,t=1;t<arguments.length;t++)n+="&args[]="+encodeURIComponent(arguments[t]);return"Minified React error #"+e+"; visit "+n+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}var A=new Set,v={};function D(e,n){R(e,n),R(e+"Capture",n)}function R(e,n){for(v[e]=n,e=0;e<n.length;e++)A.add(n[e])}var I=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),z=Object.prototype.hasOwnProperty,S=/^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,H={},b={};function F(e){return z.call(b,e)?!0:z.call(H,e)?!1:S.test(e)?b[e]=!0:(H[e]=!0,!1)}function Q(e,n,t,r){if(t!==null&&t.type===0)return!1;switch(typeof n){case"function":case"symbol":return!0;case"boolean":return r?!1:t!==null?!t.acceptsBooleans:(e=e.toLowerCase().slice(0,5),e!=="data-"&&e!=="aria-");default:return!1}}function ce(e,n,t,r){if(n===null||typeof n>"u"||Q(e,n,t,r))return!0;if(r)return!1;if(t!==null)switch(t.type){case 3:return!n;case 4:return n===!1;case 5:return isNaN(n);case 6:return isNaN(n)||1>n}return!1}function $(e,n,t,r,l,u,x){this.acceptsBooleans=n===2||n===3||n===4,this.attributeName=r,this.attributeNamespace=l,this.mustUseProperty=t,this.propertyName=e,this.type=n,this.sanitizeURL=u,this.removeEmptyString=x}var ve={};"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(e){ve[e]=new $(e,0,!1,e,null,!1,!1)}),[["acceptCharset","accept-charset"],["className","class"],["htmlFor","for"],["httpEquiv","http-equiv"]].forEach(function(e){var n=e[0];ve[n]=new $(n,1,!1,e[1],null,!1,!1)}),["contentEditable","draggable","spellCheck","value"].forEach(function(e){ve[e]=new $(e,2,!1,e.toLowerCase(),null,!1,!1)}),["autoReverse","externalResourcesRequired","focusable","preserveAlpha"].forEach(function(e){ve[e]=new $(e,2,!1,e,null,!1,!1)}),"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(e){ve[e]=new $(e,3,!1,e.toLowerCase(),null,!1,!1)}),["checked","multiple","muted","selected"].forEach(function(e){ve[e]=new $(e,3,!0,e,null,!1,!1)}),["capture","download"].forEach(function(e){ve[e]=new $(e,4,!1,e,null,!1,!1)}),["cols","rows","size","span"].forEach(function(e){ve[e]=new $(e,6,!1,e,null,!1,!1)}),["rowSpan","start"].forEach(function(e){ve[e]=new $(e,5,!1,e.toLowerCase(),null,!1,!1)});var se=/[\-:]([a-z])/g;function $e(e){return e[1].toUpperCase()}"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(e){var n=e.replace(se,$e);ve[n]=new $(n,1,!1,e,null,!1,!1)}),"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(e){var n=e.replace(se,$e);ve[n]=new $(n,1,!1,e,"http://www.w3.org/1999/xlink",!1,!1)}),["xml:base","xml:lang","xml:space"].forEach(function(e){var n=e.replace(se,$e);ve[n]=new $(n,1,!1,e,"http://www.w3.org/XML/1998/namespace",!1,!1)}),["tabIndex","crossOrigin"].forEach(function(e){ve[e]=new $(e,1,!1,e.toLowerCase(),null,!1,!1)}),ve.xlinkHref=new $("xlinkHref",1,!1,"xlink:href","http://www.w3.org/1999/xlink",!0,!1),["src","href","action","formAction"].forEach(function(e){ve[e]=new $(e,1,!1,e.toLowerCase(),null,!0,!0)});function nn(e,n,t,r){var l=ve.hasOwnProperty(n)?ve[n]:null;(l!==null?l.type!==0:r||!(2<n.length)||n[0]!=="o"&&n[0]!=="O"||n[1]!=="n"&&n[1]!=="N")&&(ce(n,t,l,r)&&(t=null),r||l===null?F(n)&&(t===null?e.removeAttribute(n):e.setAttribute(n,""+t)):l.mustUseProperty?e[l.propertyName]=t===null?l.type===3?!1:"":t:(n=l.attributeName,r=l.attributeNamespace,t===null?e.removeAttribute(n):(l=l.type,t=l===3||l===4&&t===!0?"":""+t,r?e.setAttributeNS(r,n,t):e.setAttribute(n,t))))}var Ke=a.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,qe=Symbol.for("react.element"),on=Symbol.for("react.portal"),P=Symbol.for("react.fragment"),re=Symbol.for("react.strict_mode"),be=Symbol.for("react.profiler"),ge=Symbol.for("react.provider"),Oe=Symbol.for("react.context"),tn=Symbol.for("react.forward_ref"),an=Symbol.for("react.suspense"),sn=Symbol.for("react.suspense_list"),ae=Symbol.for("react.memo"),oe=Symbol.for("react.lazy"),ze=Symbol.for("react.offscreen"),C=Symbol.iterator;function Ce(e){return e===null||typeof e!="object"?null:(e=C&&e[C]||e["@@iterator"],typeof e=="function"?e:null)}var T=Object.assign,g;function L(e){if(g===void 0)try{throw Error()}catch(t){var n=t.stack.trim().match(/\n( *(at )?)/);g=n&&n[1]||""}return`
`+g+e}var xe=!1;function we(e,n){if(!e||xe)return"";xe=!0;var t=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{if(n)if(n=function(){throw Error()},Object.defineProperty(n.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(n,[])}catch(Ye){var r=Ye}Reflect.construct(e,[],n)}else{try{n.call()}catch(Ye){r=Ye}e.call(n.prototype)}else{try{throw Error()}catch(Ye){r=Ye}e()}}catch(Ye){if(Ye&&r&&typeof Ye.stack=="string"){for(var l=Ye.stack.split(`
`),u=r.stack.split(`
`),x=l.length-1,W=u.length-1;1<=x&&0<=W&&l[x]!==u[W];)W--;for(;1<=x&&0<=W;x--,W--)if(l[x]!==u[W]){if(x!==1||W!==1)do if(x--,W--,0>W||l[x]!==u[W]){var ue=`
`+l[x].replace(" at new "," at ");return e.displayName&&ue.includes("<anonymous>")&&(ue=ue.replace("<anonymous>",e.displayName)),ue}while(1<=x&&0<=W);break}}}finally{xe=!1,Error.prepareStackTrace=t}return(e=e?e.displayName||e.name:"")?L(e):""}function pn(e){switch(e.tag){case 5:return L(e.type);case 16:return L("Lazy");case 13:return L("Suspense");case 19:return L("SuspenseList");case 0:case 2:case 15:return e=we(e.type,!1),e;case 11:return e=we(e.type.render,!1),e;case 1:return e=we(e.type,!0),e;default:return""}}function Ze(e){if(e==null)return null;if(typeof e=="function")return e.displayName||e.name||null;if(typeof e=="string")return e;switch(e){case P:return"Fragment";case on:return"Portal";case be:return"Profiler";case re:return"StrictMode";case an:return"Suspense";case sn:return"SuspenseList"}if(typeof e=="object")switch(e.$$typeof){case Oe:return(e.displayName||"Context")+".Consumer";case ge:return(e._context.displayName||"Context")+".Provider";case tn:var n=e.render;return e=e.displayName,e||(e=n.displayName||n.name||"",e=e!==""?"ForwardRef("+e+")":"ForwardRef"),e;case ae:return n=e.displayName||null,n!==null?n:Ze(e.type)||"Memo";case oe:n=e._payload,e=e._init;try{return Ze(e(n))}catch{}}return null}function dn(e){var n=e.type;switch(e.tag){case 24:return"Cache";case 9:return(n.displayName||"Context")+".Consumer";case 10:return(n._context.displayName||"Context")+".Provider";case 18:return"DehydratedFragment";case 11:return e=n.render,e=e.displayName||e.name||"",n.displayName||(e!==""?"ForwardRef("+e+")":"ForwardRef");case 7:return"Fragment";case 5:return n;case 4:return"Portal";case 3:return"Root";case 6:return"Text";case 16:return Ze(n);case 8:return n===re?"StrictMode":"Mode";case 22:return"Offscreen";case 12:return"Profiler";case 21:return"Scope";case 13:return"Suspense";case 19:return"SuspenseList";case 25:return"TracingMarker";case 1:case 0:case 17:case 2:case 14:case 15:if(typeof n=="function")return n.displayName||n.name||null;if(typeof n=="string")return n}return null}function mn(e){switch(typeof e){case"boolean":case"number":case"string":case"undefined":return e;case"object":return e;default:return""}}function Y(e){var n=e.type;return(e=e.nodeName)&&e.toLowerCase()==="input"&&(n==="checkbox"||n==="radio")}function ee(e){var n=Y(e)?"checked":"value",t=Object.getOwnPropertyDescriptor(e.constructor.prototype,n),r=""+e[n];if(!e.hasOwnProperty(n)&&typeof t<"u"&&typeof t.get=="function"&&typeof t.set=="function"){var l=t.get,u=t.set;return Object.defineProperty(e,n,{configurable:!0,get:function(){return l.call(this)},set:function(x){r=""+x,u.call(this,x)}}),Object.defineProperty(e,n,{enumerable:t.enumerable}),{getValue:function(){return r},setValue:function(x){r=""+x},stopTracking:function(){e._valueTracker=null,delete e[n]}}}}function Ie(e){e._valueTracker||(e._valueTracker=ee(e))}function Te(e){if(!e)return!1;var n=e._valueTracker;if(!n)return!0;var t=n.getValue(),r="";return e&&(r=Y(e)?e.checked?"true":"false":e.value),e=r,e!==t?(n.setValue(e),!0):!1}function rn(e){if(e=e||(typeof document<"u"?document:void 0),typeof e>"u")return null;try{return e.activeElement||e.body}catch{return e.body}}function On(e,n){var t=n.checked;return T({},n,{defaultChecked:void 0,defaultValue:void 0,value:void 0,checked:t??e._wrapperState.initialChecked})}function bn(e,n){var t=n.defaultValue==null?"":n.defaultValue,r=n.checked!=null?n.checked:n.defaultChecked;t=mn(n.value!=null?n.value:t),e._wrapperState={initialChecked:r,initialValue:t,controlled:n.type==="checkbox"||n.type==="radio"?n.checked!=null:n.value!=null}}function Je(e,n){n=n.checked,n!=null&&nn(e,"checked",n,!1)}function ie(e,n){Je(e,n);var t=mn(n.value),r=n.type;if(t!=null)r==="number"?(t===0&&e.value===""||e.value!=t)&&(e.value=""+t):e.value!==""+t&&(e.value=""+t);else if(r==="submit"||r==="reset"){e.removeAttribute("value");return}n.hasOwnProperty("value")?N(e,n.type,t):n.hasOwnProperty("defaultValue")&&N(e,n.type,mn(n.defaultValue)),n.checked==null&&n.defaultChecked!=null&&(e.defaultChecked=!!n.defaultChecked)}function Ue(e,n,t){if(n.hasOwnProperty("value")||n.hasOwnProperty("defaultValue")){var r=n.type;if(!(r!=="submit"&&r!=="reset"||n.value!==void 0&&n.value!==null))return;n=""+e._wrapperState.initialValue,t||n===e.value||(e.value=n),e.defaultValue=n}t=e.name,t!==""&&(e.name=""),e.defaultChecked=!!e._wrapperState.initialChecked,t!==""&&(e.name=t)}function N(e,n,t){(n!=="number"||rn(e.ownerDocument)!==e)&&(t==null?e.defaultValue=""+e._wrapperState.initialValue:e.defaultValue!==""+t&&(e.defaultValue=""+t))}var me=Array.isArray;function He(e,n,t,r){if(e=e.options,n){n={};for(var l=0;l<t.length;l++)n["$"+t[l]]=!0;for(t=0;t<e.length;t++)l=n.hasOwnProperty("$"+e[t].value),e[t].selected!==l&&(e[t].selected=l),l&&r&&(e[t].defaultSelected=!0)}else{for(t=""+mn(t),n=null,l=0;l<e.length;l++){if(e[l].value===t){e[l].selected=!0,r&&(e[l].defaultSelected=!0);return}n!==null||e[l].disabled||(n=e[l])}n!==null&&(n.selected=!0)}}function G(e,n){if(n.dangerouslySetInnerHTML!=null)throw Error(d(91));return T({},n,{value:void 0,defaultValue:void 0,children:""+e._wrapperState.initialValue})}function Ae(e,n){var t=n.value;if(t==null){if(t=n.children,n=n.defaultValue,t!=null){if(n!=null)throw Error(d(92));if(me(t)){if(1<t.length)throw Error(d(93));t=t[0]}n=t}n==null&&(n=""),t=n}e._wrapperState={initialValue:mn(t)}}function Pe(e,n){var t=mn(n.value),r=mn(n.defaultValue);t!=null&&(t=""+t,t!==e.value&&(e.value=t),n.defaultValue==null&&e.defaultValue!==t&&(e.defaultValue=t)),r!=null&&(e.defaultValue=""+r)}function Nn(e){var n=e.textContent;n===e._wrapperState.initialValue&&n!==""&&n!==null&&(e.value=n)}function Un(e){switch(e){case"svg":return"http://www.w3.org/2000/svg";case"math":return"http://www.w3.org/1998/Math/MathML";default:return"http://www.w3.org/1999/xhtml"}}function Mn(e,n){return e==null||e==="http://www.w3.org/1999/xhtml"?Un(n):e==="http://www.w3.org/2000/svg"&&n==="foreignObject"?"http://www.w3.org/1999/xhtml":e}var Zn,ot=(function(e){return typeof MSApp<"u"&&MSApp.execUnsafeLocalFunction?function(n,t,r,l){MSApp.execUnsafeLocalFunction(function(){return e(n,t,r,l)})}:e})(function(e,n){if(e.namespaceURI!=="http://www.w3.org/2000/svg"||"innerHTML"in e)e.innerHTML=n;else{for(Zn=Zn||document.createElement("div"),Zn.innerHTML="<svg>"+n.valueOf().toString()+"</svg>",n=Zn.firstChild;e.firstChild;)e.removeChild(e.firstChild);for(;n.firstChild;)e.appendChild(n.firstChild)}});function o(e,n){if(n){var t=e.firstChild;if(t&&t===e.lastChild&&t.nodeType===3){t.nodeValue=n;return}}e.textContent=n}var de={animationIterationCount:!0,aspectRatio:!0,borderImageOutset:!0,borderImageSlice:!0,borderImageWidth:!0,boxFlex:!0,boxFlexGroup:!0,boxOrdinalGroup:!0,columnCount:!0,columns:!0,flex:!0,flexGrow:!0,flexPositive:!0,flexShrink:!0,flexNegative:!0,flexOrder:!0,gridArea:!0,gridRow:!0,gridRowEnd:!0,gridRowSpan:!0,gridRowStart:!0,gridColumn:!0,gridColumnEnd:!0,gridColumnSpan:!0,gridColumnStart:!0,fontWeight:!0,lineClamp:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,tabSize:!0,widows:!0,zIndex:!0,zoom:!0,fillOpacity:!0,floodOpacity:!0,stopOpacity:!0,strokeDasharray:!0,strokeDashoffset:!0,strokeMiterlimit:!0,strokeOpacity:!0,strokeWidth:!0},h=["Webkit","ms","Moz","O"];Object.keys(de).forEach(function(e){h.forEach(function(n){n=n+e.charAt(0).toUpperCase()+e.substring(1),de[n]=de[e]})});function X(e,n,t){return n==null||typeof n=="boolean"||n===""?"":t||typeof n!="number"||n===0||de.hasOwnProperty(e)&&de[e]?(""+n).trim():n+"px"}function V(e,n){e=e.style;for(var t in n)if(n.hasOwnProperty(t)){var r=t.indexOf("--")===0,l=X(t,n[t],r);t==="float"&&(t="cssFloat"),r?e.setProperty(t,l):e[t]=l}}var J=T({menuitem:!0},{area:!0,base:!0,br:!0,col:!0,embed:!0,hr:!0,img:!0,input:!0,keygen:!0,link:!0,meta:!0,param:!0,source:!0,track:!0,wbr:!0});function f(e,n){if(n){if(J[e]&&(n.children!=null||n.dangerouslySetInnerHTML!=null))throw Error(d(137,e));if(n.dangerouslySetInnerHTML!=null){if(n.children!=null)throw Error(d(60));if(typeof n.dangerouslySetInnerHTML!="object"||!("__html"in n.dangerouslySetInnerHTML))throw Error(d(61))}if(n.style!=null&&typeof n.style!="object")throw Error(d(62))}}function M(e,n){if(e.indexOf("-")===-1)return typeof n.is=="string";switch(e){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var te=null;function Ee(e){return e=e.target||e.srcElement||window,e.correspondingUseElement&&(e=e.correspondingUseElement),e.nodeType===3?e.parentNode:e}var Se=null,De=null,Xe=null;function Fe(e){if(e=Ja(e)){if(typeof Se!="function")throw Error(d(280));var n=e.stateNode;n&&(n=Li(n),Se(e.stateNode,e.type,n))}}function Ve(e){De?Xe?Xe.push(e):Xe=[e]:De=e}function vn(){if(De){var e=De,n=Xe;if(Xe=De=null,Fe(e),n)for(e=0;e<n.length;e++)Fe(n[e])}}function i(e,n){return e(n)}function s(){}var _=!1;function c(e,n,t){if(_)return e(n,t);_=!0;try{return i(e,n,t)}finally{_=!1,(De!==null||Xe!==null)&&(s(),vn())}}function m(e,n){var t=e.stateNode;if(t===null)return null;var r=Li(t);if(r===null)return null;t=r[n];e:switch(n){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(r=!r.disabled)||(e=e.type,r=!(e==="button"||e==="input"||e==="select"||e==="textarea")),e=!r;break e;default:e=!1}if(e)return null;if(t&&typeof t!="function")throw Error(d(231,n,typeof t));return t}var O=!1;if(I)try{var y={};Object.defineProperty(y,"passive",{get:function(){O=!0}}),window.addEventListener("test",y,y),window.removeEventListener("test",y,y)}catch{O=!1}function ne(e,n,t,r,l,u,x,W,ue){var Ye=Array.prototype.slice.call(arguments,3);try{n.apply(t,Ye)}catch(En){this.onError(En)}}var en=!1,gn=null,Bn=!1,Kn=null,pe={onError:function(e){en=!0,gn=e}};function fn(e,n,t,r,l,u,x,W,ue){en=!1,gn=null,ne.apply(pe,arguments)}function U(e,n,t,r,l,u,x,W,ue){if(fn.apply(this,arguments),en){if(en){var Ye=gn;en=!1,gn=null}else throw Error(d(198));Bn||(Bn=!0,Kn=Ye)}}function Me(e){var n=e,t=e;if(e.alternate)for(;n.return;)n=n.return;else{e=n;do n=e,(n.flags&4098)!==0&&(t=n.return),e=n.return;while(e)}return n.tag===3?t:null}function fe(e){if(e.tag===13){var n=e.memoizedState;if(n===null&&(e=e.alternate,e!==null&&(n=e.memoizedState)),n!==null)return n.dehydrated}return null}function yn(e){if(Me(e)!==e)throw Error(d(188))}function Dn(e){var n=e.alternate;if(!n){if(n=Me(e),n===null)throw Error(d(188));return n!==e?null:e}for(var t=e,r=n;;){var l=t.return;if(l===null)break;var u=l.alternate;if(u===null){if(r=l.return,r!==null){t=r;continue}break}if(l.child===u.child){for(u=l.child;u;){if(u===t)return yn(l),e;if(u===r)return yn(l),n;u=u.sibling}throw Error(d(188))}if(t.return!==r.return)t=l,r=u;else{for(var x=!1,W=l.child;W;){if(W===t){x=!0,t=l,r=u;break}if(W===r){x=!0,r=l,t=u;break}W=W.sibling}if(!x){for(W=u.child;W;){if(W===t){x=!0,t=u,r=l;break}if(W===r){x=!0,r=u,t=l;break}W=W.sibling}if(!x)throw Error(d(189))}}if(t.alternate!==r)throw Error(d(190))}if(t.tag!==3)throw Error(d(188));return t.stateNode.current===t?e:n}function Pn(e){return e=Dn(e),e!==null?In(e):null}function In(e){if(e.tag===5||e.tag===6)return e;for(e=e.child;e!==null;){var n=In(e);if(n!==null)return n;e=e.sibling}return null}var $n=B.unstable_scheduleCallback,ht=B.unstable_cancelCallback,Fn=B.unstable_shouldYield,Jn=B.unstable_requestPaint,Vn=B.unstable_now,ut=B.unstable_getCurrentPriorityLevel,lt=B.unstable_ImmediatePriority,Ct=B.unstable_UserBlockingPriority,pt=B.unstable_NormalPriority,Dt=B.unstable_LowPriority,At=B.unstable_IdlePriority,E=null,le=null;function cn(e){if(le&&typeof le.onCommitFiberRoot=="function")try{le.onCommitFiberRoot(E,e,void 0,(e.current.flags&128)===128)}catch{}}var ln=Math.clz32?Math.clz32:_n,wn=Math.log,un=Math.LN2;function _n(e){return e>>>=0,e===0?32:31-(wn(e)/un|0)|0}var We=64,xn=4194304;function Ln(e){switch(e&-e){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return e&4194240;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return e&130023424;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 1073741824;default:return e}}function p(e,n){var t=e.pendingLanes;if(t===0)return 0;var r=0,l=e.suspendedLanes,u=e.pingedLanes,x=t&268435455;if(x!==0){var W=x&~l;W!==0?r=Ln(W):(u&=x,u!==0&&(r=Ln(u)))}else x=t&~l,x!==0?r=Ln(x):u!==0&&(r=Ln(u));if(r===0)return 0;if(n!==0&&n!==r&&(n&l)===0&&(l=r&-r,u=n&-n,l>=u||l===16&&(u&4194240)!==0))return n;if((r&4)!==0&&(r|=t&16),n=e.entangledLanes,n!==0)for(e=e.entanglements,n&=r;0<n;)t=31-ln(n),l=1<<t,r|=e[t],n&=~l;return r}function q(e,n){switch(e){case 1:case 2:case 4:return n+250;case 8:case 16:case 32:case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return n+5e3;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return-1;case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function K(e,n){for(var t=e.suspendedLanes,r=e.pingedLanes,l=e.expirationTimes,u=e.pendingLanes;0<u;){var x=31-ln(u),W=1<<x,ue=l[x];ue===-1?((W&t)===0||(W&r)!==0)&&(l[x]=q(W,n)):ue<=n&&(e.expiredLanes|=W),u&=~W}}function ye(e){return e=e.pendingLanes&-1073741825,e!==0?e:e&1073741824?1073741824:0}function he(){var e=We;return We<<=1,(We&4194240)===0&&(We=64),e}function _e(e){for(var n=[],t=0;31>t;t++)n.push(e);return n}function Sn(e,n,t){e.pendingLanes|=n,n!==536870912&&(e.suspendedLanes=0,e.pingedLanes=0),e=e.eventTimes,n=31-ln(n),e[n]=t}function Gn(e,n){var t=e.pendingLanes&~n;e.pendingLanes=n,e.suspendedLanes=0,e.pingedLanes=0,e.expiredLanes&=n,e.mutableReadLanes&=n,e.entangledLanes&=n,n=e.entanglements;var r=e.eventTimes;for(e=e.expirationTimes;0<t;){var l=31-ln(t),u=1<<l;n[l]=0,r[l]=-1,e[l]=-1,t&=~u}}function zn(e,n){var t=e.entangledLanes|=n;for(e=e.entanglements;t;){var r=31-ln(t),l=1<<r;l&n|e[r]&n&&(e[r]|=n),t&=~l}}var jn=0;function k(e){return e&=-e,1<e?4<e?(e&268435455)!==0?16:536870912:4:1}var j,Ne,kn,Wn,st,Et=!1,tr=[],Ft=null,Vt=null,Mt=null,mt=new Map,qt=new Map,fr=[],Ba="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");function Fa(e,n){switch(e){case"focusin":case"focusout":Ft=null;break;case"dragenter":case"dragleave":Vt=null;break;case"mouseover":case"mouseout":Mt=null;break;case"pointerover":case"pointerout":mt.delete(n.pointerId);break;case"gotpointercapture":case"lostpointercapture":qt.delete(n.pointerId)}}function Er(e,n,t,r,l,u){return e===null||e.nativeEvent!==u?(e={blockedOn:n,domEventName:t,eventSystemFlags:r,nativeEvent:u,targetContainers:[l]},n!==null&&(n=Ja(n),n!==null&&Ne(n)),e):(e.eventSystemFlags|=r,n=e.targetContainers,l!==null&&n.indexOf(l)===-1&&n.push(l),e)}function pr(e,n,t,r,l){switch(n){case"focusin":return Ft=Er(Ft,e,n,t,r,l),!0;case"dragenter":return Vt=Er(Vt,e,n,t,r,l),!0;case"mouseover":return Mt=Er(Mt,e,n,t,r,l),!0;case"pointerover":var u=l.pointerId;return mt.set(u,Er(mt.get(u)||null,e,n,t,r,l)),!0;case"gotpointercapture":return u=l.pointerId,qt.set(u,Er(qt.get(u)||null,e,n,t,r,l)),!0}return!1}function na(e){var n=ia(e.target);if(n!==null){var t=Me(n);if(t!==null){if(n=t.tag,n===13){if(n=fe(t),n!==null){e.blockedOn=n,st(e.priority,function(){kn(t)});return}}else if(n===3&&t.stateNode.current.memoizedState.isDehydrated){e.blockedOn=t.tag===3?t.stateNode.containerInfo:null;return}}}e.blockedOn=null}function ta(e){if(e.blockedOn!==null)return!1;for(var n=e.targetContainers;0<n.length;){var t=w(e.domEventName,e.eventSystemFlags,n[0],e.nativeEvent);if(t===null){t=e.nativeEvent;var r=new t.constructor(t.type,t);te=r,t.target.dispatchEvent(r),te=null}else return n=Ja(t),n!==null&&Ne(n),e.blockedOn=t,!1;n.shift()}return!0}function Va(e,n,t){ta(e)&&t.delete(n)}function yi(){Et=!1,Ft!==null&&ta(Ft)&&(Ft=null),Vt!==null&&ta(Vt)&&(Vt=null),Mt!==null&&ta(Mt)&&(Mt=null),mt.forEach(Va),qt.forEach(Va)}function Dr(e,n){e.blockedOn===n&&(e.blockedOn=null,Et||(Et=!0,B.unstable_scheduleCallback(B.unstable_NormalPriority,yi)))}function ra(e){function n(l){return Dr(l,e)}if(0<tr.length){Dr(tr[0],e);for(var t=1;t<tr.length;t++){var r=tr[t];r.blockedOn===e&&(r.blockedOn=null)}}for(Ft!==null&&Dr(Ft,e),Vt!==null&&Dr(Vt,e),Mt!==null&&Dr(Mt,e),mt.forEach(n),qt.forEach(n),t=0;t<fr.length;t++)r=fr[t],r.blockedOn===e&&(r.blockedOn=null);for(;0<fr.length&&(t=fr[0],t.blockedOn===null);)na(t),t.blockedOn===null&&fr.shift()}var xr=Ke.ReactCurrentBatchConfig,aa=!0;function go(e,n,t,r){var l=jn,u=xr.transition;xr.transition=null;try{jn=1,ja(e,n,t,r)}finally{jn=l,xr.transition=u}}function vi(e,n,t,r){var l=jn,u=xr.transition;xr.transition=null;try{jn=4,ja(e,n,t,r)}finally{jn=l,xr.transition=u}}function ja(e,n,t,r){if(aa){var l=w(e,n,t,r);if(l===null)Co(e,n,r,Gr,t),Fa(e,r);else if(pr(l,e,n,t,r))r.stopPropagation();else if(Fa(e,r),n&4&&-1<Ba.indexOf(e)){for(;l!==null;){var u=Ja(l);if(u!==null&&j(u),u=w(e,n,t,r),u===null&&Co(e,n,r,Gr,t),u===l)break;l=u}l!==null&&r.stopPropagation()}else Co(e,n,r,null,t)}}var Gr=null;function w(e,n,t,r){if(Gr=null,e=Ee(r),e=ia(e),e!==null)if(n=Me(e),n===null)e=null;else if(t=n.tag,t===13){if(e=fe(n),e!==null)return e;e=null}else if(t===3){if(n.stateNode.current.memoizedState.isDehydrated)return n.tag===3?n.stateNode.containerInfo:null;e=null}else n!==e&&(e=null);return Gr=e,null}function Z(e){switch(e){case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"resize":case"seeked":case"submit":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 1;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"scroll":case"toggle":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 4;case"message":switch(ut()){case lt:return 1;case Ct:return 4;case pt:case Dt:return 16;case At:return 536870912;default:return 16}default:return 16}}var Re=null,Qe=null,Ge=null;function Le(){if(Ge)return Ge;var e,n=Qe,t=n.length,r,l="value"in Re?Re.value:Re.textContent,u=l.length;for(e=0;e<t&&n[e]===l[e];e++);var x=t-e;for(r=1;r<=x&&n[t-r]===l[u-r];r++);return Ge=l.slice(e,1<r?1-r:void 0)}function hn(e){var n=e.keyCode;return"charCode"in e?(e=e.charCode,e===0&&n===13&&(e=13)):e=n,e===10&&(e=13),32<=e||e===13?e:0}function Tn(){return!0}function rt(){return!1}function at(e){function n(t,r,l,u,x){this._reactName=t,this._targetInst=l,this.type=r,this.nativeEvent=u,this.target=x,this.currentTarget=null;for(var W in e)e.hasOwnProperty(W)&&(t=e[W],this[W]=t?t(u):u[W]);return this.isDefaultPrevented=(u.defaultPrevented!=null?u.defaultPrevented:u.returnValue===!1)?Tn:rt,this.isPropagationStopped=rt,this}return T(n.prototype,{preventDefault:function(){this.defaultPrevented=!0;var t=this.nativeEvent;t&&(t.preventDefault?t.preventDefault():typeof t.returnValue!="unknown"&&(t.returnValue=!1),this.isDefaultPrevented=Tn)},stopPropagation:function(){var t=this.nativeEvent;t&&(t.stopPropagation?t.stopPropagation():typeof t.cancelBubble!="unknown"&&(t.cancelBubble=!0),this.isPropagationStopped=Tn)},persist:function(){},isPersistent:Tn}),n}var Lt={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(e){return e.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},Sr=at(Lt),Br=T({},Lt,{view:0,detail:0}),Zc=at(Br),yo,vo,za,xi=T({},Br,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:bo,button:0,buttons:0,relatedTarget:function(e){return e.relatedTarget===void 0?e.fromElement===e.srcElement?e.toElement:e.fromElement:e.relatedTarget},movementX:function(e){return"movementX"in e?e.movementX:(e!==za&&(za&&e.type==="mousemove"?(yo=e.screenX-za.screenX,vo=e.screenY-za.screenY):vo=yo=0,za=e),yo)},movementY:function(e){return"movementY"in e?e.movementY:vo}}),ts=at(xi),Jc=T({},xi,{dataTransfer:0}),ed=at(Jc),nd=T({},Br,{relatedTarget:0}),xo=at(nd),td=T({},Lt,{animationName:0,elapsedTime:0,pseudoElement:0}),rd=at(td),ad=T({},Lt,{clipboardData:function(e){return"clipboardData"in e?e.clipboardData:window.clipboardData}}),id=at(ad),od=T({},Lt,{data:0}),rs=at(od),ld={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},sd={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},ud={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function cd(e){var n=this.nativeEvent;return n.getModifierState?n.getModifierState(e):(e=ud[e])?!!n[e]:!1}function bo(){return cd}var dd=T({},Br,{key:function(e){if(e.key){var n=ld[e.key]||e.key;if(n!=="Unidentified")return n}return e.type==="keypress"?(e=hn(e),e===13?"Enter":String.fromCharCode(e)):e.type==="keydown"||e.type==="keyup"?sd[e.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:bo,charCode:function(e){return e.type==="keypress"?hn(e):0},keyCode:function(e){return e.type==="keydown"||e.type==="keyup"?e.keyCode:0},which:function(e){return e.type==="keypress"?hn(e):e.type==="keydown"||e.type==="keyup"?e.keyCode:0}}),fd=at(dd),pd=T({},xi,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),as=at(pd),_d=T({},Br,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:bo}),hd=at(_d),md=T({},Lt,{propertyName:0,elapsedTime:0,pseudoElement:0}),gd=at(md),yd=T({},xi,{deltaX:function(e){return"deltaX"in e?e.deltaX:"wheelDeltaX"in e?-e.wheelDeltaX:0},deltaY:function(e){return"deltaY"in e?e.deltaY:"wheelDeltaY"in e?-e.wheelDeltaY:"wheelDelta"in e?-e.wheelDelta:0},deltaZ:0,deltaMode:0}),vd=at(yd),xd=[9,13,27,32],ko=I&&"CompositionEvent"in window,Ha=null;I&&"documentMode"in document&&(Ha=document.documentMode);var bd=I&&"TextEvent"in window&&!Ha,is=I&&(!ko||Ha&&8<Ha&&11>=Ha),os=" ",ls=!1;function ss(e,n){switch(e){case"keyup":return xd.indexOf(n.keyCode)!==-1;case"keydown":return n.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function us(e){return e=e.detail,typeof e=="object"&&"data"in e?e.data:null}var ya=!1;function kd(e,n){switch(e){case"compositionend":return us(n);case"keypress":return n.which!==32?null:(ls=!0,os);case"textInput":return e=n.data,e===os&&ls?null:e;default:return null}}function wd(e,n){if(ya)return e==="compositionend"||!ko&&ss(e,n)?(e=Le(),Ge=Qe=Re=null,ya=!1,e):null;switch(e){case"paste":return null;case"keypress":if(!(n.ctrlKey||n.altKey||n.metaKey)||n.ctrlKey&&n.altKey){if(n.char&&1<n.char.length)return n.char;if(n.which)return String.fromCharCode(n.which)}return null;case"compositionend":return is&&n.locale!=="ko"?null:n.data;default:return null}}var Ad={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function cs(e){var n=e&&e.nodeName&&e.nodeName.toLowerCase();return n==="input"?!!Ad[e.type]:n==="textarea"}function ds(e,n,t,r){Ve(r),n=Ti(n,"onChange"),0<n.length&&(t=new Sr("onChange","change",null,t,r),e.push({event:t,listeners:n}))}var Ka=null,qa=null;function Td(e){Os(e,0)}function bi(e){var n=wa(e);if(Te(n))return e}function Ed(e,n){if(e==="change")return n}var fs=!1;if(I){var wo;if(I){var Ao="oninput"in document;if(!Ao){var ps=document.createElement("div");ps.setAttribute("oninput","return;"),Ao=typeof ps.oninput=="function"}wo=Ao}else wo=!1;fs=wo&&(!document.documentMode||9<document.documentMode)}function _s(){Ka&&(Ka.detachEvent("onpropertychange",hs),qa=Ka=null)}function hs(e){if(e.propertyName==="value"&&bi(qa)){var n=[];ds(n,qa,e,Ee(e)),c(Td,n)}}function Sd(e,n,t){e==="focusin"?(_s(),Ka=n,qa=t,Ka.attachEvent("onpropertychange",hs)):e==="focusout"&&_s()}function Ld(e){if(e==="selectionchange"||e==="keyup"||e==="keydown")return bi(qa)}function Od(e,n){if(e==="click")return bi(n)}function Rd(e,n){if(e==="input"||e==="change")return bi(n)}function Nd(e,n){return e===n&&(e!==0||1/e===1/n)||e!==e&&n!==n}var _r=typeof Object.is=="function"?Object.is:Nd;function Xa(e,n){if(_r(e,n))return!0;if(typeof e!="object"||e===null||typeof n!="object"||n===null)return!1;var t=Object.keys(e),r=Object.keys(n);if(t.length!==r.length)return!1;for(r=0;r<t.length;r++){var l=t[r];if(!z.call(n,l)||!_r(e[l],n[l]))return!1}return!0}function ms(e){for(;e&&e.firstChild;)e=e.firstChild;return e}function gs(e,n){var t=ms(e);e=0;for(var r;t;){if(t.nodeType===3){if(r=e+t.textContent.length,e<=n&&r>=n)return{node:t,offset:n-e};e=r}e:{for(;t;){if(t.nextSibling){t=t.nextSibling;break e}t=t.parentNode}t=void 0}t=ms(t)}}function ys(e,n){return e&&n?e===n?!0:e&&e.nodeType===3?!1:n&&n.nodeType===3?ys(e,n.parentNode):"contains"in e?e.contains(n):e.compareDocumentPosition?!!(e.compareDocumentPosition(n)&16):!1:!1}function vs(){for(var e=window,n=rn();n instanceof e.HTMLIFrameElement;){try{var t=typeof n.contentWindow.location.href=="string"}catch{t=!1}if(t)e=n.contentWindow;else break;n=rn(e.document)}return n}function To(e){var n=e&&e.nodeName&&e.nodeName.toLowerCase();return n&&(n==="input"&&(e.type==="text"||e.type==="search"||e.type==="tel"||e.type==="url"||e.type==="password")||n==="textarea"||e.contentEditable==="true")}function Cd(e){var n=vs(),t=e.focusedElem,r=e.selectionRange;if(n!==t&&t&&t.ownerDocument&&ys(t.ownerDocument.documentElement,t)){if(r!==null&&To(t)){if(n=r.start,e=r.end,e===void 0&&(e=n),"selectionStart"in t)t.selectionStart=n,t.selectionEnd=Math.min(e,t.value.length);else if(e=(n=t.ownerDocument||document)&&n.defaultView||window,e.getSelection){e=e.getSelection();var l=t.textContent.length,u=Math.min(r.start,l);r=r.end===void 0?u:Math.min(r.end,l),!e.extend&&u>r&&(l=r,r=u,u=l),l=gs(t,u);var x=gs(t,r);l&&x&&(e.rangeCount!==1||e.anchorNode!==l.node||e.anchorOffset!==l.offset||e.focusNode!==x.node||e.focusOffset!==x.offset)&&(n=n.createRange(),n.setStart(l.node,l.offset),e.removeAllRanges(),u>r?(e.addRange(n),e.extend(x.node,x.offset)):(n.setEnd(x.node,x.offset),e.addRange(n)))}}for(n=[],e=t;e=e.parentNode;)e.nodeType===1&&n.push({element:e,left:e.scrollLeft,top:e.scrollTop});for(typeof t.focus=="function"&&t.focus(),t=0;t<n.length;t++)e=n[t],e.element.scrollLeft=e.left,e.element.scrollTop=e.top}}var Md=I&&"documentMode"in document&&11>=document.documentMode,va=null,Eo=null,Wa=null,So=!1;function xs(e,n,t){var r=t.window===t?t.document:t.nodeType===9?t:t.ownerDocument;So||va==null||va!==rn(r)||(r=va,"selectionStart"in r&&To(r)?r={start:r.selectionStart,end:r.selectionEnd}:(r=(r.ownerDocument&&r.ownerDocument.defaultView||window).getSelection(),r={anchorNode:r.anchorNode,anchorOffset:r.anchorOffset,focusNode:r.focusNode,focusOffset:r.focusOffset}),Wa&&Xa(Wa,r)||(Wa=r,r=Ti(Eo,"onSelect"),0<r.length&&(n=new Sr("onSelect","select",null,n,t),e.push({event:n,listeners:r}),n.target=va)))}function ki(e,n){var t={};return t[e.toLowerCase()]=n.toLowerCase(),t["Webkit"+e]="webkit"+n,t["Moz"+e]="moz"+n,t}var xa={animationend:ki("Animation","AnimationEnd"),animationiteration:ki("Animation","AnimationIteration"),animationstart:ki("Animation","AnimationStart"),transitionend:ki("Transition","TransitionEnd")},Lo={},bs={};I&&(bs=document.createElement("div").style,"AnimationEvent"in window||(delete xa.animationend.animation,delete xa.animationiteration.animation,delete xa.animationstart.animation),"TransitionEvent"in window||delete xa.transitionend.transition);function wi(e){if(Lo[e])return Lo[e];if(!xa[e])return e;var n=xa[e],t;for(t in n)if(n.hasOwnProperty(t)&&t in bs)return Lo[e]=n[t];return e}var ks=wi("animationend"),ws=wi("animationiteration"),As=wi("animationstart"),Ts=wi("transitionend"),Es=new Map,Ss="abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");function Fr(e,n){Es.set(e,n),D(n,[e])}for(var Oo=0;Oo<Ss.length;Oo++){var Ro=Ss[Oo],Id=Ro.toLowerCase(),Ud=Ro[0].toUpperCase()+Ro.slice(1);Fr(Id,"on"+Ud)}Fr(ks,"onAnimationEnd"),Fr(ws,"onAnimationIteration"),Fr(As,"onAnimationStart"),Fr("dblclick","onDoubleClick"),Fr("focusin","onFocus"),Fr("focusout","onBlur"),Fr(Ts,"onTransitionEnd"),R("onMouseEnter",["mouseout","mouseover"]),R("onMouseLeave",["mouseout","mouseover"]),R("onPointerEnter",["pointerout","pointerover"]),R("onPointerLeave",["pointerout","pointerover"]),D("onChange","change click focusin focusout input keydown keyup selectionchange".split(" ")),D("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")),D("onBeforeInput",["compositionend","keypress","textInput","paste"]),D("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" ")),D("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" ")),D("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var Ya="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),Pd=new Set("cancel close invalid load scroll toggle".split(" ").concat(Ya));function Ls(e,n,t){var r=e.type||"unknown-event";e.currentTarget=t,U(r,n,void 0,e),e.currentTarget=null}function Os(e,n){n=(n&4)!==0;for(var t=0;t<e.length;t++){var r=e[t],l=r.event;r=r.listeners;e:{var u=void 0;if(n)for(var x=r.length-1;0<=x;x--){var W=r[x],ue=W.instance,Ye=W.currentTarget;if(W=W.listener,ue!==u&&l.isPropagationStopped())break e;Ls(l,W,Ye),u=ue}else for(x=0;x<r.length;x++){if(W=r[x],ue=W.instance,Ye=W.currentTarget,W=W.listener,ue!==u&&l.isPropagationStopped())break e;Ls(l,W,Ye),u=ue}}}if(Bn)throw e=Kn,Bn=!1,Kn=null,e}function yt(e,n){var t=n[Go];t===void 0&&(t=n[Go]=new Set);var r=e+"__bubble";t.has(r)||(Rs(n,e,2,!1),t.add(r))}function No(e,n,t){var r=0;n&&(r|=4),Rs(t,e,r,n)}var Ai="_reactListening"+Math.random().toString(36).slice(2);function $a(e){if(!e[Ai]){e[Ai]=!0,A.forEach(function(t){t!=="selectionchange"&&(Pd.has(t)||No(t,!1,e),No(t,!0,e))});var n=e.nodeType===9?e:e.ownerDocument;n===null||n[Ai]||(n[Ai]=!0,No("selectionchange",!1,n))}}function Rs(e,n,t,r){switch(Z(n)){case 1:var l=go;break;case 4:l=vi;break;default:l=ja}t=l.bind(null,n,t,e),l=void 0,!O||n!=="touchstart"&&n!=="touchmove"&&n!=="wheel"||(l=!0),r?l!==void 0?e.addEventListener(n,t,{capture:!0,passive:l}):e.addEventListener(n,t,!0):l!==void 0?e.addEventListener(n,t,{passive:l}):e.addEventListener(n,t,!1)}function Co(e,n,t,r,l){var u=r;if((n&1)===0&&(n&2)===0&&r!==null)e:for(;;){if(r===null)return;var x=r.tag;if(x===3||x===4){var W=r.stateNode.containerInfo;if(W===l||W.nodeType===8&&W.parentNode===l)break;if(x===4)for(x=r.return;x!==null;){var ue=x.tag;if((ue===3||ue===4)&&(ue=x.stateNode.containerInfo,ue===l||ue.nodeType===8&&ue.parentNode===l))return;x=x.return}for(;W!==null;){if(x=ia(W),x===null)return;if(ue=x.tag,ue===5||ue===6){r=u=x;continue e}W=W.parentNode}}r=r.return}c(function(){var Ye=u,En=Ee(t),Rn=[];e:{var An=Es.get(e);if(An!==void 0){var Hn=Sr,Xn=e;switch(e){case"keypress":if(hn(t)===0)break e;case"keydown":case"keyup":Hn=fd;break;case"focusin":Xn="focus",Hn=xo;break;case"focusout":Xn="blur",Hn=xo;break;case"beforeblur":case"afterblur":Hn=xo;break;case"click":if(t.button===2)break e;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":Hn=ts;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":Hn=ed;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":Hn=hd;break;case ks:case ws:case As:Hn=rd;break;case Ts:Hn=gd;break;case"scroll":Hn=Zc;break;case"wheel":Hn=vd;break;case"copy":case"cut":case"paste":Hn=id;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":Hn=as}var Yn=(n&4)!==0,St=!Yn&&e==="scroll",Be=Yn?An!==null?An+"Capture":null:An;Yn=[];for(var ke=Ye,je;ke!==null;){je=ke;var Cn=je.stateNode;if(je.tag===5&&Cn!==null&&(je=Cn,Be!==null&&(Cn=m(ke,Be),Cn!=null&&Yn.push(Qa(ke,Cn,je)))),St)break;ke=ke.return}0<Yn.length&&(An=new Hn(An,Xn,null,t,En),Rn.push({event:An,listeners:Yn}))}}if((n&7)===0){e:{if(An=e==="mouseover"||e==="pointerover",Hn=e==="mouseout"||e==="pointerout",An&&t!==te&&(Xn=t.relatedTarget||t.fromElement)&&(ia(Xn)||Xn[Lr]))break e;if((Hn||An)&&(An=En.window===En?En:(An=En.ownerDocument)?An.defaultView||An.parentWindow:window,Hn?(Xn=t.relatedTarget||t.toElement,Hn=Ye,Xn=Xn?ia(Xn):null,Xn!==null&&(St=Me(Xn),Xn!==St||Xn.tag!==5&&Xn.tag!==6)&&(Xn=null)):(Hn=null,Xn=Ye),Hn!==Xn)){if(Yn=ts,Cn="onMouseLeave",Be="onMouseEnter",ke="mouse",(e==="pointerout"||e==="pointerover")&&(Yn=as,Cn="onPointerLeave",Be="onPointerEnter",ke="pointer"),St=Hn==null?An:wa(Hn),je=Xn==null?An:wa(Xn),An=new Yn(Cn,ke+"leave",Hn,t,En),An.target=St,An.relatedTarget=je,Cn=null,ia(En)===Ye&&(Yn=new Yn(Be,ke+"enter",Xn,t,En),Yn.target=je,Yn.relatedTarget=St,Cn=Yn),St=Cn,Hn&&Xn)n:{for(Yn=Hn,Be=Xn,ke=0,je=Yn;je;je=ba(je))ke++;for(je=0,Cn=Be;Cn;Cn=ba(Cn))je++;for(;0<ke-je;)Yn=ba(Yn),ke--;for(;0<je-ke;)Be=ba(Be),je--;for(;ke--;){if(Yn===Be||Be!==null&&Yn===Be.alternate)break n;Yn=ba(Yn),Be=ba(Be)}Yn=null}else Yn=null;Hn!==null&&Ns(Rn,An,Hn,Yn,!1),Xn!==null&&St!==null&&Ns(Rn,St,Xn,Yn,!0)}}e:{if(An=Ye?wa(Ye):window,Hn=An.nodeName&&An.nodeName.toLowerCase(),Hn==="select"||Hn==="input"&&An.type==="file")var Qn=Ed;else if(cs(An))if(fs)Qn=Rd;else{Qn=Ld;var et=Sd}else(Hn=An.nodeName)&&Hn.toLowerCase()==="input"&&(An.type==="checkbox"||An.type==="radio")&&(Qn=Od);if(Qn&&(Qn=Qn(e,Ye))){ds(Rn,Qn,t,En);break e}et&&et(e,An,Ye),e==="focusout"&&(et=An._wrapperState)&&et.controlled&&An.type==="number"&&N(An,"number",An.value)}switch(et=Ye?wa(Ye):window,e){case"focusin":(cs(et)||et.contentEditable==="true")&&(va=et,Eo=Ye,Wa=null);break;case"focusout":Wa=Eo=va=null;break;case"mousedown":So=!0;break;case"contextmenu":case"mouseup":case"dragend":So=!1,xs(Rn,t,En);break;case"selectionchange":if(Md)break;case"keydown":case"keyup":xs(Rn,t,En)}var nt;if(ko)e:{switch(e){case"compositionstart":var it="onCompositionStart";break e;case"compositionend":it="onCompositionEnd";break e;case"compositionupdate":it="onCompositionUpdate";break e}it=void 0}else ya?ss(e,t)&&(it="onCompositionEnd"):e==="keydown"&&t.keyCode===229&&(it="onCompositionStart");it&&(is&&t.locale!=="ko"&&(ya||it!=="onCompositionStart"?it==="onCompositionEnd"&&ya&&(nt=Le()):(Re=En,Qe="value"in Re?Re.value:Re.textContent,ya=!0)),et=Ti(Ye,it),0<et.length&&(it=new rs(it,e,null,t,En),Rn.push({event:it,listeners:et}),nt?it.data=nt:(nt=us(t),nt!==null&&(it.data=nt)))),(nt=bd?kd(e,t):wd(e,t))&&(Ye=Ti(Ye,"onBeforeInput"),0<Ye.length&&(En=new rs("onBeforeInput","beforeinput",null,t,En),Rn.push({event:En,listeners:Ye}),En.data=nt))}Os(Rn,n)})}function Qa(e,n,t){return{instance:e,listener:n,currentTarget:t}}function Ti(e,n){for(var t=n+"Capture",r=[];e!==null;){var l=e,u=l.stateNode;l.tag===5&&u!==null&&(l=u,u=m(e,t),u!=null&&r.unshift(Qa(e,u,l)),u=m(e,n),u!=null&&r.push(Qa(e,u,l))),e=e.return}return r}function ba(e){if(e===null)return null;do e=e.return;while(e&&e.tag!==5);return e||null}function Ns(e,n,t,r,l){for(var u=n._reactName,x=[];t!==null&&t!==r;){var W=t,ue=W.alternate,Ye=W.stateNode;if(ue!==null&&ue===r)break;W.tag===5&&Ye!==null&&(W=Ye,l?(ue=m(t,u),ue!=null&&x.unshift(Qa(t,ue,W))):l||(ue=m(t,u),ue!=null&&x.push(Qa(t,ue,W)))),t=t.return}x.length!==0&&e.push({event:n,listeners:x})}var Dd=/\r\n?/g,Gd=/\u0000|\uFFFD/g;function Cs(e){return(typeof e=="string"?e:""+e).replace(Dd,`
`).replace(Gd,"")}function Ei(e,n,t){if(n=Cs(n),Cs(e)!==n&&t)throw Error(d(425))}function Si(){}var Mo=null,Io=null;function Uo(e,n){return e==="textarea"||e==="noscript"||typeof n.children=="string"||typeof n.children=="number"||typeof n.dangerouslySetInnerHTML=="object"&&n.dangerouslySetInnerHTML!==null&&n.dangerouslySetInnerHTML.__html!=null}var Po=typeof setTimeout=="function"?setTimeout:void 0,Bd=typeof clearTimeout=="function"?clearTimeout:void 0,Ms=typeof Promise=="function"?Promise:void 0,Fd=typeof queueMicrotask=="function"?queueMicrotask:typeof Ms<"u"?function(e){return Ms.resolve(null).then(e).catch(Vd)}:Po;function Vd(e){setTimeout(function(){throw e})}function Do(e,n){var t=n,r=0;do{var l=t.nextSibling;if(e.removeChild(t),l&&l.nodeType===8)if(t=l.data,t==="/$"){if(r===0){e.removeChild(l),ra(n);return}r--}else t!=="$"&&t!=="$?"&&t!=="$!"||r++;t=l}while(t);ra(n)}function Vr(e){for(;e!=null;e=e.nextSibling){var n=e.nodeType;if(n===1||n===3)break;if(n===8){if(n=e.data,n==="$"||n==="$!"||n==="$?")break;if(n==="/$")return null}}return e}function Is(e){e=e.previousSibling;for(var n=0;e;){if(e.nodeType===8){var t=e.data;if(t==="$"||t==="$!"||t==="$?"){if(n===0)return e;n--}else t==="/$"&&n++}e=e.previousSibling}return null}var ka=Math.random().toString(36).slice(2),br="__reactFiber$"+ka,Za="__reactProps$"+ka,Lr="__reactContainer$"+ka,Go="__reactEvents$"+ka,jd="__reactListeners$"+ka,zd="__reactHandles$"+ka;function ia(e){var n=e[br];if(n)return n;for(var t=e.parentNode;t;){if(n=t[Lr]||t[br]){if(t=n.alternate,n.child!==null||t!==null&&t.child!==null)for(e=Is(e);e!==null;){if(t=e[br])return t;e=Is(e)}return n}e=t,t=e.parentNode}return null}function Ja(e){return e=e[br]||e[Lr],!e||e.tag!==5&&e.tag!==6&&e.tag!==13&&e.tag!==3?null:e}function wa(e){if(e.tag===5||e.tag===6)return e.stateNode;throw Error(d(33))}function Li(e){return e[Za]||null}var Bo=[],Aa=-1;function jr(e){return{current:e}}function vt(e){0>Aa||(e.current=Bo[Aa],Bo[Aa]=null,Aa--)}function gt(e,n){Aa++,Bo[Aa]=e.current,e.current=n}var zr={},jt=jr(zr),$t=jr(!1),oa=zr;function Ta(e,n){var t=e.type.contextTypes;if(!t)return zr;var r=e.stateNode;if(r&&r.__reactInternalMemoizedUnmaskedChildContext===n)return r.__reactInternalMemoizedMaskedChildContext;var l={},u;for(u in t)l[u]=n[u];return r&&(e=e.stateNode,e.__reactInternalMemoizedUnmaskedChildContext=n,e.__reactInternalMemoizedMaskedChildContext=l),l}function Qt(e){return e=e.childContextTypes,e!=null}function Oi(){vt($t),vt(jt)}function Us(e,n,t){if(jt.current!==zr)throw Error(d(168));gt(jt,n),gt($t,t)}function Ps(e,n,t){var r=e.stateNode;if(n=n.childContextTypes,typeof r.getChildContext!="function")return t;r=r.getChildContext();for(var l in r)if(!(l in n))throw Error(d(108,dn(e)||"Unknown",l));return T({},t,r)}function Ri(e){return e=(e=e.stateNode)&&e.__reactInternalMemoizedMergedChildContext||zr,oa=jt.current,gt(jt,e),gt($t,$t.current),!0}function Ds(e,n,t){var r=e.stateNode;if(!r)throw Error(d(169));t?(e=Ps(e,n,oa),r.__reactInternalMemoizedMergedChildContext=e,vt($t),vt(jt),gt(jt,e)):vt($t),gt($t,t)}var Or=null,Ni=!1,Fo=!1;function Gs(e){Or===null?Or=[e]:Or.push(e)}function Hd(e){Ni=!0,Gs(e)}function Hr(){if(!Fo&&Or!==null){Fo=!0;var e=0,n=jn;try{var t=Or;for(jn=1;e<t.length;e++){var r=t[e];do r=r(!0);while(r!==null)}Or=null,Ni=!1}catch(l){throw Or!==null&&(Or=Or.slice(e+1)),$n(lt,Hr),l}finally{jn=n,Fo=!1}}return null}var Ea=[],Sa=0,Ci=null,Mi=0,or=[],lr=0,la=null,Rr=1,Nr="";function sa(e,n){Ea[Sa++]=Mi,Ea[Sa++]=Ci,Ci=e,Mi=n}function Bs(e,n,t){or[lr++]=Rr,or[lr++]=Nr,or[lr++]=la,la=e;var r=Rr;e=Nr;var l=32-ln(r)-1;r&=~(1<<l),t+=1;var u=32-ln(n)+l;if(30<u){var x=l-l%5;u=(r&(1<<x)-1).toString(32),r>>=x,l-=x,Rr=1<<32-ln(n)+l|t<<l|r,Nr=u+e}else Rr=1<<u|t<<l|r,Nr=e}function Vo(e){e.return!==null&&(sa(e,1),Bs(e,1,0))}function jo(e){for(;e===Ci;)Ci=Ea[--Sa],Ea[Sa]=null,Mi=Ea[--Sa],Ea[Sa]=null;for(;e===la;)la=or[--lr],or[lr]=null,Nr=or[--lr],or[lr]=null,Rr=or[--lr],or[lr]=null}var rr=null,ar=null,bt=!1,hr=null;function Fs(e,n){var t=dr(5,null,null,0);t.elementType="DELETED",t.stateNode=n,t.return=e,n=e.deletions,n===null?(e.deletions=[t],e.flags|=16):n.push(t)}function Vs(e,n){switch(e.tag){case 5:var t=e.type;return n=n.nodeType!==1||t.toLowerCase()!==n.nodeName.toLowerCase()?null:n,n!==null?(e.stateNode=n,rr=e,ar=Vr(n.firstChild),!0):!1;case 6:return n=e.pendingProps===""||n.nodeType!==3?null:n,n!==null?(e.stateNode=n,rr=e,ar=null,!0):!1;case 13:return n=n.nodeType!==8?null:n,n!==null?(t=la!==null?{id:Rr,overflow:Nr}:null,e.memoizedState={dehydrated:n,treeContext:t,retryLane:1073741824},t=dr(18,null,null,0),t.stateNode=n,t.return=e,e.child=t,rr=e,ar=null,!0):!1;default:return!1}}function zo(e){return(e.mode&1)!==0&&(e.flags&128)===0}function Ho(e){if(bt){var n=ar;if(n){var t=n;if(!Vs(e,n)){if(zo(e))throw Error(d(418));n=Vr(t.nextSibling);var r=rr;n&&Vs(e,n)?Fs(r,t):(e.flags=e.flags&-4097|2,bt=!1,rr=e)}}else{if(zo(e))throw Error(d(418));e.flags=e.flags&-4097|2,bt=!1,rr=e}}}function js(e){for(e=e.return;e!==null&&e.tag!==5&&e.tag!==3&&e.tag!==13;)e=e.return;rr=e}function Ii(e){if(e!==rr)return!1;if(!bt)return js(e),bt=!0,!1;var n;if((n=e.tag!==3)&&!(n=e.tag!==5)&&(n=e.type,n=n!=="head"&&n!=="body"&&!Uo(e.type,e.memoizedProps)),n&&(n=ar)){if(zo(e))throw zs(),Error(d(418));for(;n;)Fs(e,n),n=Vr(n.nextSibling)}if(js(e),e.tag===13){if(e=e.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(d(317));e:{for(e=e.nextSibling,n=0;e;){if(e.nodeType===8){var t=e.data;if(t==="/$"){if(n===0){ar=Vr(e.nextSibling);break e}n--}else t!=="$"&&t!=="$!"&&t!=="$?"||n++}e=e.nextSibling}ar=null}}else ar=rr?Vr(e.stateNode.nextSibling):null;return!0}function zs(){for(var e=ar;e;)e=Vr(e.nextSibling)}function La(){ar=rr=null,bt=!1}function Ko(e){hr===null?hr=[e]:hr.push(e)}var Kd=Ke.ReactCurrentBatchConfig;function ei(e,n,t){if(e=t.ref,e!==null&&typeof e!="function"&&typeof e!="object"){if(t._owner){if(t=t._owner,t){if(t.tag!==1)throw Error(d(309));var r=t.stateNode}if(!r)throw Error(d(147,e));var l=r,u=""+e;return n!==null&&n.ref!==null&&typeof n.ref=="function"&&n.ref._stringRef===u?n.ref:(n=function(x){var W=l.refs;x===null?delete W[u]:W[u]=x},n._stringRef=u,n)}if(typeof e!="string")throw Error(d(284));if(!t._owner)throw Error(d(290,e))}return e}function Ui(e,n){throw e=Object.prototype.toString.call(n),Error(d(31,e==="[object Object]"?"object with keys {"+Object.keys(n).join(", ")+"}":e))}function Hs(e){var n=e._init;return n(e._payload)}function Ks(e){function n(Be,ke){if(e){var je=Be.deletions;je===null?(Be.deletions=[ke],Be.flags|=16):je.push(ke)}}function t(Be,ke){if(!e)return null;for(;ke!==null;)n(Be,ke),ke=ke.sibling;return null}function r(Be,ke){for(Be=new Map;ke!==null;)ke.key!==null?Be.set(ke.key,ke):Be.set(ke.index,ke),ke=ke.sibling;return Be}function l(Be,ke){return Be=Zr(Be,ke),Be.index=0,Be.sibling=null,Be}function u(Be,ke,je){return Be.index=je,e?(je=Be.alternate,je!==null?(je=je.index,je<ke?(Be.flags|=2,ke):je):(Be.flags|=2,ke)):(Be.flags|=1048576,ke)}function x(Be){return e&&Be.alternate===null&&(Be.flags|=2),Be}function W(Be,ke,je,Cn){return ke===null||ke.tag!==6?(ke=Pl(je,Be.mode,Cn),ke.return=Be,ke):(ke=l(ke,je),ke.return=Be,ke)}function ue(Be,ke,je,Cn){var Qn=je.type;return Qn===P?En(Be,ke,je.props.children,Cn,je.key):ke!==null&&(ke.elementType===Qn||typeof Qn=="object"&&Qn!==null&&Qn.$$typeof===oe&&Hs(Qn)===ke.type)?(Cn=l(ke,je.props),Cn.ref=ei(Be,ke,je),Cn.return=Be,Cn):(Cn=io(je.type,je.key,je.props,null,Be.mode,Cn),Cn.ref=ei(Be,ke,je),Cn.return=Be,Cn)}function Ye(Be,ke,je,Cn){return ke===null||ke.tag!==4||ke.stateNode.containerInfo!==je.containerInfo||ke.stateNode.implementation!==je.implementation?(ke=Dl(je,Be.mode,Cn),ke.return=Be,ke):(ke=l(ke,je.children||[]),ke.return=Be,ke)}function En(Be,ke,je,Cn,Qn){return ke===null||ke.tag!==7?(ke=ma(je,Be.mode,Cn,Qn),ke.return=Be,ke):(ke=l(ke,je),ke.return=Be,ke)}function Rn(Be,ke,je){if(typeof ke=="string"&&ke!==""||typeof ke=="number")return ke=Pl(""+ke,Be.mode,je),ke.return=Be,ke;if(typeof ke=="object"&&ke!==null){switch(ke.$$typeof){case qe:return je=io(ke.type,ke.key,ke.props,null,Be.mode,je),je.ref=ei(Be,null,ke),je.return=Be,je;case on:return ke=Dl(ke,Be.mode,je),ke.return=Be,ke;case oe:var Cn=ke._init;return Rn(Be,Cn(ke._payload),je)}if(me(ke)||Ce(ke))return ke=ma(ke,Be.mode,je,null),ke.return=Be,ke;Ui(Be,ke)}return null}function An(Be,ke,je,Cn){var Qn=ke!==null?ke.key:null;if(typeof je=="string"&&je!==""||typeof je=="number")return Qn!==null?null:W(Be,ke,""+je,Cn);if(typeof je=="object"&&je!==null){switch(je.$$typeof){case qe:return je.key===Qn?ue(Be,ke,je,Cn):null;case on:return je.key===Qn?Ye(Be,ke,je,Cn):null;case oe:return Qn=je._init,An(Be,ke,Qn(je._payload),Cn)}if(me(je)||Ce(je))return Qn!==null?null:En(Be,ke,je,Cn,null);Ui(Be,je)}return null}function Hn(Be,ke,je,Cn,Qn){if(typeof Cn=="string"&&Cn!==""||typeof Cn=="number")return Be=Be.get(je)||null,W(ke,Be,""+Cn,Qn);if(typeof Cn=="object"&&Cn!==null){switch(Cn.$$typeof){case qe:return Be=Be.get(Cn.key===null?je:Cn.key)||null,ue(ke,Be,Cn,Qn);case on:return Be=Be.get(Cn.key===null?je:Cn.key)||null,Ye(ke,Be,Cn,Qn);case oe:var et=Cn._init;return Hn(Be,ke,je,et(Cn._payload),Qn)}if(me(Cn)||Ce(Cn))return Be=Be.get(je)||null,En(ke,Be,Cn,Qn,null);Ui(ke,Cn)}return null}function Xn(Be,ke,je,Cn){for(var Qn=null,et=null,nt=ke,it=ke=0,Pt=null;nt!==null&&it<je.length;it++){nt.index>it?(Pt=nt,nt=null):Pt=nt.sibling;var _t=An(Be,nt,je[it],Cn);if(_t===null){nt===null&&(nt=Pt);break}e&&nt&&_t.alternate===null&&n(Be,nt),ke=u(_t,ke,it),et===null?Qn=_t:et.sibling=_t,et=_t,nt=Pt}if(it===je.length)return t(Be,nt),bt&&sa(Be,it),Qn;if(nt===null){for(;it<je.length;it++)nt=Rn(Be,je[it],Cn),nt!==null&&(ke=u(nt,ke,it),et===null?Qn=nt:et.sibling=nt,et=nt);return bt&&sa(Be,it),Qn}for(nt=r(Be,nt);it<je.length;it++)Pt=Hn(nt,Be,it,je[it],Cn),Pt!==null&&(e&&Pt.alternate!==null&&nt.delete(Pt.key===null?it:Pt.key),ke=u(Pt,ke,it),et===null?Qn=Pt:et.sibling=Pt,et=Pt);return e&&nt.forEach(function(Jr){return n(Be,Jr)}),bt&&sa(Be,it),Qn}function Yn(Be,ke,je,Cn){var Qn=Ce(je);if(typeof Qn!="function")throw Error(d(150));if(je=Qn.call(je),je==null)throw Error(d(151));for(var et=Qn=null,nt=ke,it=ke=0,Pt=null,_t=je.next();nt!==null&&!_t.done;it++,_t=je.next()){nt.index>it?(Pt=nt,nt=null):Pt=nt.sibling;var Jr=An(Be,nt,_t.value,Cn);if(Jr===null){nt===null&&(nt=Pt);break}e&&nt&&Jr.alternate===null&&n(Be,nt),ke=u(Jr,ke,it),et===null?Qn=Jr:et.sibling=Jr,et=Jr,nt=Pt}if(_t.done)return t(Be,nt),bt&&sa(Be,it),Qn;if(nt===null){for(;!_t.done;it++,_t=je.next())_t=Rn(Be,_t.value,Cn),_t!==null&&(ke=u(_t,ke,it),et===null?Qn=_t:et.sibling=_t,et=_t);return bt&&sa(Be,it),Qn}for(nt=r(Be,nt);!_t.done;it++,_t=je.next())_t=Hn(nt,Be,it,_t.value,Cn),_t!==null&&(e&&_t.alternate!==null&&nt.delete(_t.key===null?it:_t.key),ke=u(_t,ke,it),et===null?Qn=_t:et.sibling=_t,et=_t);return e&&nt.forEach(function(Tf){return n(Be,Tf)}),bt&&sa(Be,it),Qn}function St(Be,ke,je,Cn){if(typeof je=="object"&&je!==null&&je.type===P&&je.key===null&&(je=je.props.children),typeof je=="object"&&je!==null){switch(je.$$typeof){case qe:e:{for(var Qn=je.key,et=ke;et!==null;){if(et.key===Qn){if(Qn=je.type,Qn===P){if(et.tag===7){t(Be,et.sibling),ke=l(et,je.props.children),ke.return=Be,Be=ke;break e}}else if(et.elementType===Qn||typeof Qn=="object"&&Qn!==null&&Qn.$$typeof===oe&&Hs(Qn)===et.type){t(Be,et.sibling),ke=l(et,je.props),ke.ref=ei(Be,et,je),ke.return=Be,Be=ke;break e}t(Be,et);break}else n(Be,et);et=et.sibling}je.type===P?(ke=ma(je.props.children,Be.mode,Cn,je.key),ke.return=Be,Be=ke):(Cn=io(je.type,je.key,je.props,null,Be.mode,Cn),Cn.ref=ei(Be,ke,je),Cn.return=Be,Be=Cn)}return x(Be);case on:e:{for(et=je.key;ke!==null;){if(ke.key===et)if(ke.tag===4&&ke.stateNode.containerInfo===je.containerInfo&&ke.stateNode.implementation===je.implementation){t(Be,ke.sibling),ke=l(ke,je.children||[]),ke.return=Be,Be=ke;break e}else{t(Be,ke);break}else n(Be,ke);ke=ke.sibling}ke=Dl(je,Be.mode,Cn),ke.return=Be,Be=ke}return x(Be);case oe:return et=je._init,St(Be,ke,et(je._payload),Cn)}if(me(je))return Xn(Be,ke,je,Cn);if(Ce(je))return Yn(Be,ke,je,Cn);Ui(Be,je)}return typeof je=="string"&&je!==""||typeof je=="number"?(je=""+je,ke!==null&&ke.tag===6?(t(Be,ke.sibling),ke=l(ke,je),ke.return=Be,Be=ke):(t(Be,ke),ke=Pl(je,Be.mode,Cn),ke.return=Be,Be=ke),x(Be)):t(Be,ke)}return St}var Oa=Ks(!0),qs=Ks(!1),Pi=jr(null),Di=null,Ra=null,qo=null;function Xo(){qo=Ra=Di=null}function Wo(e){var n=Pi.current;vt(Pi),e._currentValue=n}function Yo(e,n,t){for(;e!==null;){var r=e.alternate;if((e.childLanes&n)!==n?(e.childLanes|=n,r!==null&&(r.childLanes|=n)):r!==null&&(r.childLanes&n)!==n&&(r.childLanes|=n),e===t)break;e=e.return}}function Na(e,n){Di=e,qo=Ra=null,e=e.dependencies,e!==null&&e.firstContext!==null&&((e.lanes&n)!==0&&(Zt=!0),e.firstContext=null)}function sr(e){var n=e._currentValue;if(qo!==e)if(e={context:e,memoizedValue:n,next:null},Ra===null){if(Di===null)throw Error(d(308));Ra=e,Di.dependencies={lanes:0,firstContext:e}}else Ra=Ra.next=e;return n}var ua=null;function $o(e){ua===null?ua=[e]:ua.push(e)}function Xs(e,n,t,r){var l=n.interleaved;return l===null?(t.next=t,$o(n)):(t.next=l.next,l.next=t),n.interleaved=t,Cr(e,r)}function Cr(e,n){e.lanes|=n;var t=e.alternate;for(t!==null&&(t.lanes|=n),t=e,e=e.return;e!==null;)e.childLanes|=n,t=e.alternate,t!==null&&(t.childLanes|=n),t=e,e=e.return;return t.tag===3?t.stateNode:null}var Kr=!1;function Qo(e){e.updateQueue={baseState:e.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,interleaved:null,lanes:0},effects:null}}function Ws(e,n){e=e.updateQueue,n.updateQueue===e&&(n.updateQueue={baseState:e.baseState,firstBaseUpdate:e.firstBaseUpdate,lastBaseUpdate:e.lastBaseUpdate,shared:e.shared,effects:e.effects})}function Mr(e,n){return{eventTime:e,lane:n,tag:0,payload:null,callback:null,next:null}}function qr(e,n,t){var r=e.updateQueue;if(r===null)return null;if(r=r.shared,(ft&2)!==0){var l=r.pending;return l===null?n.next=n:(n.next=l.next,l.next=n),r.pending=n,Cr(e,t)}return l=r.interleaved,l===null?(n.next=n,$o(r)):(n.next=l.next,l.next=n),r.interleaved=n,Cr(e,t)}function Gi(e,n,t){if(n=n.updateQueue,n!==null&&(n=n.shared,(t&4194240)!==0)){var r=n.lanes;r&=e.pendingLanes,t|=r,n.lanes=t,zn(e,t)}}function Ys(e,n){var t=e.updateQueue,r=e.alternate;if(r!==null&&(r=r.updateQueue,t===r)){var l=null,u=null;if(t=t.firstBaseUpdate,t!==null){do{var x={eventTime:t.eventTime,lane:t.lane,tag:t.tag,payload:t.payload,callback:t.callback,next:null};u===null?l=u=x:u=u.next=x,t=t.next}while(t!==null);u===null?l=u=n:u=u.next=n}else l=u=n;t={baseState:r.baseState,firstBaseUpdate:l,lastBaseUpdate:u,shared:r.shared,effects:r.effects},e.updateQueue=t;return}e=t.lastBaseUpdate,e===null?t.firstBaseUpdate=n:e.next=n,t.lastBaseUpdate=n}function Bi(e,n,t,r){var l=e.updateQueue;Kr=!1;var u=l.firstBaseUpdate,x=l.lastBaseUpdate,W=l.shared.pending;if(W!==null){l.shared.pending=null;var ue=W,Ye=ue.next;ue.next=null,x===null?u=Ye:x.next=Ye,x=ue;var En=e.alternate;En!==null&&(En=En.updateQueue,W=En.lastBaseUpdate,W!==x&&(W===null?En.firstBaseUpdate=Ye:W.next=Ye,En.lastBaseUpdate=ue))}if(u!==null){var Rn=l.baseState;x=0,En=Ye=ue=null,W=u;do{var An=W.lane,Hn=W.eventTime;if((r&An)===An){En!==null&&(En=En.next={eventTime:Hn,lane:0,tag:W.tag,payload:W.payload,callback:W.callback,next:null});e:{var Xn=e,Yn=W;switch(An=n,Hn=t,Yn.tag){case 1:if(Xn=Yn.payload,typeof Xn=="function"){Rn=Xn.call(Hn,Rn,An);break e}Rn=Xn;break e;case 3:Xn.flags=Xn.flags&-65537|128;case 0:if(Xn=Yn.payload,An=typeof Xn=="function"?Xn.call(Hn,Rn,An):Xn,An==null)break e;Rn=T({},Rn,An);break e;case 2:Kr=!0}}W.callback!==null&&W.lane!==0&&(e.flags|=64,An=l.effects,An===null?l.effects=[W]:An.push(W))}else Hn={eventTime:Hn,lane:An,tag:W.tag,payload:W.payload,callback:W.callback,next:null},En===null?(Ye=En=Hn,ue=Rn):En=En.next=Hn,x|=An;if(W=W.next,W===null){if(W=l.shared.pending,W===null)break;An=W,W=An.next,An.next=null,l.lastBaseUpdate=An,l.shared.pending=null}}while(!0);if(En===null&&(ue=Rn),l.baseState=ue,l.firstBaseUpdate=Ye,l.lastBaseUpdate=En,n=l.shared.interleaved,n!==null){l=n;do x|=l.lane,l=l.next;while(l!==n)}else u===null&&(l.shared.lanes=0);fa|=x,e.lanes=x,e.memoizedState=Rn}}function $s(e,n,t){if(e=n.effects,n.effects=null,e!==null)for(n=0;n<e.length;n++){var r=e[n],l=r.callback;if(l!==null){if(r.callback=null,r=t,typeof l!="function")throw Error(d(191,l));l.call(r)}}}var ni={},kr=jr(ni),ti=jr(ni),ri=jr(ni);function ca(e){if(e===ni)throw Error(d(174));return e}function Zo(e,n){switch(gt(ri,n),gt(ti,e),gt(kr,ni),e=n.nodeType,e){case 9:case 11:n=(n=n.documentElement)?n.namespaceURI:Mn(null,"");break;default:e=e===8?n.parentNode:n,n=e.namespaceURI||null,e=e.tagName,n=Mn(n,e)}vt(kr),gt(kr,n)}function Ca(){vt(kr),vt(ti),vt(ri)}function Qs(e){ca(ri.current);var n=ca(kr.current),t=Mn(n,e.type);n!==t&&(gt(ti,e),gt(kr,t))}function Jo(e){ti.current===e&&(vt(kr),vt(ti))}var kt=jr(0);function Fi(e){for(var n=e;n!==null;){if(n.tag===13){var t=n.memoizedState;if(t!==null&&(t=t.dehydrated,t===null||t.data==="$?"||t.data==="$!"))return n}else if(n.tag===19&&n.memoizedProps.revealOrder!==void 0){if((n.flags&128)!==0)return n}else if(n.child!==null){n.child.return=n,n=n.child;continue}if(n===e)break;for(;n.sibling===null;){if(n.return===null||n.return===e)return null;n=n.return}n.sibling.return=n.return,n=n.sibling}return null}var el=[];function nl(){for(var e=0;e<el.length;e++)el[e]._workInProgressVersionPrimary=null;el.length=0}var Vi=Ke.ReactCurrentDispatcher,tl=Ke.ReactCurrentBatchConfig,da=0,wt=null,Rt=null,It=null,ji=!1,ai=!1,ii=0,qd=0;function zt(){throw Error(d(321))}function rl(e,n){if(n===null)return!1;for(var t=0;t<n.length&&t<e.length;t++)if(!_r(e[t],n[t]))return!1;return!0}function al(e,n,t,r,l,u){if(da=u,wt=n,n.memoizedState=null,n.updateQueue=null,n.lanes=0,Vi.current=e===null||e.memoizedState===null?$d:Qd,e=t(r,l),ai){u=0;do{if(ai=!1,ii=0,25<=u)throw Error(d(301));u+=1,It=Rt=null,n.updateQueue=null,Vi.current=Zd,e=t(r,l)}while(ai)}if(Vi.current=Ki,n=Rt!==null&&Rt.next!==null,da=0,It=Rt=wt=null,ji=!1,n)throw Error(d(300));return e}function il(){var e=ii!==0;return ii=0,e}function wr(){var e={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return It===null?wt.memoizedState=It=e:It=It.next=e,It}function ur(){if(Rt===null){var e=wt.alternate;e=e!==null?e.memoizedState:null}else e=Rt.next;var n=It===null?wt.memoizedState:It.next;if(n!==null)It=n,Rt=e;else{if(e===null)throw Error(d(310));Rt=e,e={memoizedState:Rt.memoizedState,baseState:Rt.baseState,baseQueue:Rt.baseQueue,queue:Rt.queue,next:null},It===null?wt.memoizedState=It=e:It=It.next=e}return It}function oi(e,n){return typeof n=="function"?n(e):n}function ol(e){var n=ur(),t=n.queue;if(t===null)throw Error(d(311));t.lastRenderedReducer=e;var r=Rt,l=r.baseQueue,u=t.pending;if(u!==null){if(l!==null){var x=l.next;l.next=u.next,u.next=x}r.baseQueue=l=u,t.pending=null}if(l!==null){u=l.next,r=r.baseState;var W=x=null,ue=null,Ye=u;do{var En=Ye.lane;if((da&En)===En)ue!==null&&(ue=ue.next={lane:0,action:Ye.action,hasEagerState:Ye.hasEagerState,eagerState:Ye.eagerState,next:null}),r=Ye.hasEagerState?Ye.eagerState:e(r,Ye.action);else{var Rn={lane:En,action:Ye.action,hasEagerState:Ye.hasEagerState,eagerState:Ye.eagerState,next:null};ue===null?(W=ue=Rn,x=r):ue=ue.next=Rn,wt.lanes|=En,fa|=En}Ye=Ye.next}while(Ye!==null&&Ye!==u);ue===null?x=r:ue.next=W,_r(r,n.memoizedState)||(Zt=!0),n.memoizedState=r,n.baseState=x,n.baseQueue=ue,t.lastRenderedState=r}if(e=t.interleaved,e!==null){l=e;do u=l.lane,wt.lanes|=u,fa|=u,l=l.next;while(l!==e)}else l===null&&(t.lanes=0);return[n.memoizedState,t.dispatch]}function ll(e){var n=ur(),t=n.queue;if(t===null)throw Error(d(311));t.lastRenderedReducer=e;var r=t.dispatch,l=t.pending,u=n.memoizedState;if(l!==null){t.pending=null;var x=l=l.next;do u=e(u,x.action),x=x.next;while(x!==l);_r(u,n.memoizedState)||(Zt=!0),n.memoizedState=u,n.baseQueue===null&&(n.baseState=u),t.lastRenderedState=u}return[u,r]}function Zs(){}function Js(e,n){var t=wt,r=ur(),l=n(),u=!_r(r.memoizedState,l);if(u&&(r.memoizedState=l,Zt=!0),r=r.queue,sl(tu.bind(null,t,r,e),[e]),r.getSnapshot!==n||u||It!==null&&It.memoizedState.tag&1){if(t.flags|=2048,li(9,nu.bind(null,t,r,l,n),void 0,null),Ut===null)throw Error(d(349));(da&30)!==0||eu(t,n,l)}return l}function eu(e,n,t){e.flags|=16384,e={getSnapshot:n,value:t},n=wt.updateQueue,n===null?(n={lastEffect:null,stores:null},wt.updateQueue=n,n.stores=[e]):(t=n.stores,t===null?n.stores=[e]:t.push(e))}function nu(e,n,t,r){n.value=t,n.getSnapshot=r,ru(n)&&au(e)}function tu(e,n,t){return t(function(){ru(n)&&au(e)})}function ru(e){var n=e.getSnapshot;e=e.value;try{var t=n();return!_r(e,t)}catch{return!0}}function au(e){var n=Cr(e,1);n!==null&&vr(n,e,1,-1)}function iu(e){var n=wr();return typeof e=="function"&&(e=e()),n.memoizedState=n.baseState=e,e={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:oi,lastRenderedState:e},n.queue=e,e=e.dispatch=Yd.bind(null,wt,e),[n.memoizedState,e]}function li(e,n,t,r){return e={tag:e,create:n,destroy:t,deps:r,next:null},n=wt.updateQueue,n===null?(n={lastEffect:null,stores:null},wt.updateQueue=n,n.lastEffect=e.next=e):(t=n.lastEffect,t===null?n.lastEffect=e.next=e:(r=t.next,t.next=e,e.next=r,n.lastEffect=e)),e}function ou(){return ur().memoizedState}function zi(e,n,t,r){var l=wr();wt.flags|=e,l.memoizedState=li(1|n,t,void 0,r===void 0?null:r)}function Hi(e,n,t,r){var l=ur();r=r===void 0?null:r;var u=void 0;if(Rt!==null){var x=Rt.memoizedState;if(u=x.destroy,r!==null&&rl(r,x.deps)){l.memoizedState=li(n,t,u,r);return}}wt.flags|=e,l.memoizedState=li(1|n,t,u,r)}function lu(e,n){return zi(8390656,8,e,n)}function sl(e,n){return Hi(2048,8,e,n)}function su(e,n){return Hi(4,2,e,n)}function uu(e,n){return Hi(4,4,e,n)}function cu(e,n){if(typeof n=="function")return e=e(),n(e),function(){n(null)};if(n!=null)return e=e(),n.current=e,function(){n.current=null}}function du(e,n,t){return t=t!=null?t.concat([e]):null,Hi(4,4,cu.bind(null,n,e),t)}function ul(){}function fu(e,n){var t=ur();n=n===void 0?null:n;var r=t.memoizedState;return r!==null&&n!==null&&rl(n,r[1])?r[0]:(t.memoizedState=[e,n],e)}function pu(e,n){var t=ur();n=n===void 0?null:n;var r=t.memoizedState;return r!==null&&n!==null&&rl(n,r[1])?r[0]:(e=e(),t.memoizedState=[e,n],e)}function _u(e,n,t){return(da&21)===0?(e.baseState&&(e.baseState=!1,Zt=!0),e.memoizedState=t):(_r(t,n)||(t=he(),wt.lanes|=t,fa|=t,e.baseState=!0),n)}function Xd(e,n){var t=jn;jn=t!==0&&4>t?t:4,e(!0);var r=tl.transition;tl.transition={};try{e(!1),n()}finally{jn=t,tl.transition=r}}function hu(){return ur().memoizedState}function Wd(e,n,t){var r=$r(e);if(t={lane:r,action:t,hasEagerState:!1,eagerState:null,next:null},mu(e))gu(n,t);else if(t=Xs(e,n,t,r),t!==null){var l=Wt();vr(t,e,r,l),yu(t,n,r)}}function Yd(e,n,t){var r=$r(e),l={lane:r,action:t,hasEagerState:!1,eagerState:null,next:null};if(mu(e))gu(n,l);else{var u=e.alternate;if(e.lanes===0&&(u===null||u.lanes===0)&&(u=n.lastRenderedReducer,u!==null))try{var x=n.lastRenderedState,W=u(x,t);if(l.hasEagerState=!0,l.eagerState=W,_r(W,x)){var ue=n.interleaved;ue===null?(l.next=l,$o(n)):(l.next=ue.next,ue.next=l),n.interleaved=l;return}}catch{}finally{}t=Xs(e,n,l,r),t!==null&&(l=Wt(),vr(t,e,r,l),yu(t,n,r))}}function mu(e){var n=e.alternate;return e===wt||n!==null&&n===wt}function gu(e,n){ai=ji=!0;var t=e.pending;t===null?n.next=n:(n.next=t.next,t.next=n),e.pending=n}function yu(e,n,t){if((t&4194240)!==0){var r=n.lanes;r&=e.pendingLanes,t|=r,n.lanes=t,zn(e,t)}}var Ki={readContext:sr,useCallback:zt,useContext:zt,useEffect:zt,useImperativeHandle:zt,useInsertionEffect:zt,useLayoutEffect:zt,useMemo:zt,useReducer:zt,useRef:zt,useState:zt,useDebugValue:zt,useDeferredValue:zt,useTransition:zt,useMutableSource:zt,useSyncExternalStore:zt,useId:zt,unstable_isNewReconciler:!1},$d={readContext:sr,useCallback:function(e,n){return wr().memoizedState=[e,n===void 0?null:n],e},useContext:sr,useEffect:lu,useImperativeHandle:function(e,n,t){return t=t!=null?t.concat([e]):null,zi(4194308,4,cu.bind(null,n,e),t)},useLayoutEffect:function(e,n){return zi(4194308,4,e,n)},useInsertionEffect:function(e,n){return zi(4,2,e,n)},useMemo:function(e,n){var t=wr();return n=n===void 0?null:n,e=e(),t.memoizedState=[e,n],e},useReducer:function(e,n,t){var r=wr();return n=t!==void 0?t(n):n,r.memoizedState=r.baseState=n,e={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:e,lastRenderedState:n},r.queue=e,e=e.dispatch=Wd.bind(null,wt,e),[r.memoizedState,e]},useRef:function(e){var n=wr();return e={current:e},n.memoizedState=e},useState:iu,useDebugValue:ul,useDeferredValue:function(e){return wr().memoizedState=e},useTransition:function(){var e=iu(!1),n=e[0];return e=Xd.bind(null,e[1]),wr().memoizedState=e,[n,e]},useMutableSource:function(){},useSyncExternalStore:function(e,n,t){var r=wt,l=wr();if(bt){if(t===void 0)throw Error(d(407));t=t()}else{if(t=n(),Ut===null)throw Error(d(349));(da&30)!==0||eu(r,n,t)}l.memoizedState=t;var u={value:t,getSnapshot:n};return l.queue=u,lu(tu.bind(null,r,u,e),[e]),r.flags|=2048,li(9,nu.bind(null,r,u,t,n),void 0,null),t},useId:function(){var e=wr(),n=Ut.identifierPrefix;if(bt){var t=Nr,r=Rr;t=(r&~(1<<32-ln(r)-1)).toString(32)+t,n=":"+n+"R"+t,t=ii++,0<t&&(n+="H"+t.toString(32)),n+=":"}else t=qd++,n=":"+n+"r"+t.toString(32)+":";return e.memoizedState=n},unstable_isNewReconciler:!1},Qd={readContext:sr,useCallback:fu,useContext:sr,useEffect:sl,useImperativeHandle:du,useInsertionEffect:su,useLayoutEffect:uu,useMemo:pu,useReducer:ol,useRef:ou,useState:function(){return ol(oi)},useDebugValue:ul,useDeferredValue:function(e){var n=ur();return _u(n,Rt.memoizedState,e)},useTransition:function(){var e=ol(oi)[0],n=ur().memoizedState;return[e,n]},useMutableSource:Zs,useSyncExternalStore:Js,useId:hu,unstable_isNewReconciler:!1},Zd={readContext:sr,useCallback:fu,useContext:sr,useEffect:sl,useImperativeHandle:du,useInsertionEffect:su,useLayoutEffect:uu,useMemo:pu,useReducer:ll,useRef:ou,useState:function(){return ll(oi)},useDebugValue:ul,useDeferredValue:function(e){var n=ur();return Rt===null?n.memoizedState=e:_u(n,Rt.memoizedState,e)},useTransition:function(){var e=ll(oi)[0],n=ur().memoizedState;return[e,n]},useMutableSource:Zs,useSyncExternalStore:Js,useId:hu,unstable_isNewReconciler:!1};function mr(e,n){if(e&&e.defaultProps){n=T({},n),e=e.defaultProps;for(var t in e)n[t]===void 0&&(n[t]=e[t]);return n}return n}function cl(e,n,t,r){n=e.memoizedState,t=t(r,n),t=t==null?n:T({},n,t),e.memoizedState=t,e.lanes===0&&(e.updateQueue.baseState=t)}var qi={isMounted:function(e){return(e=e._reactInternals)?Me(e)===e:!1},enqueueSetState:function(e,n,t){e=e._reactInternals;var r=Wt(),l=$r(e),u=Mr(r,l);u.payload=n,t!=null&&(u.callback=t),n=qr(e,u,l),n!==null&&(vr(n,e,l,r),Gi(n,e,l))},enqueueReplaceState:function(e,n,t){e=e._reactInternals;var r=Wt(),l=$r(e),u=Mr(r,l);u.tag=1,u.payload=n,t!=null&&(u.callback=t),n=qr(e,u,l),n!==null&&(vr(n,e,l,r),Gi(n,e,l))},enqueueForceUpdate:function(e,n){e=e._reactInternals;var t=Wt(),r=$r(e),l=Mr(t,r);l.tag=2,n!=null&&(l.callback=n),n=qr(e,l,r),n!==null&&(vr(n,e,r,t),Gi(n,e,r))}};function vu(e,n,t,r,l,u,x){return e=e.stateNode,typeof e.shouldComponentUpdate=="function"?e.shouldComponentUpdate(r,u,x):n.prototype&&n.prototype.isPureReactComponent?!Xa(t,r)||!Xa(l,u):!0}function xu(e,n,t){var r=!1,l=zr,u=n.contextType;return typeof u=="object"&&u!==null?u=sr(u):(l=Qt(n)?oa:jt.current,r=n.contextTypes,u=(r=r!=null)?Ta(e,l):zr),n=new n(t,u),e.memoizedState=n.state!==null&&n.state!==void 0?n.state:null,n.updater=qi,e.stateNode=n,n._reactInternals=e,r&&(e=e.stateNode,e.__reactInternalMemoizedUnmaskedChildContext=l,e.__reactInternalMemoizedMaskedChildContext=u),n}function bu(e,n,t,r){e=n.state,typeof n.componentWillReceiveProps=="function"&&n.componentWillReceiveProps(t,r),typeof n.UNSAFE_componentWillReceiveProps=="function"&&n.UNSAFE_componentWillReceiveProps(t,r),n.state!==e&&qi.enqueueReplaceState(n,n.state,null)}function dl(e,n,t,r){var l=e.stateNode;l.props=t,l.state=e.memoizedState,l.refs={},Qo(e);var u=n.contextType;typeof u=="object"&&u!==null?l.context=sr(u):(u=Qt(n)?oa:jt.current,l.context=Ta(e,u)),l.state=e.memoizedState,u=n.getDerivedStateFromProps,typeof u=="function"&&(cl(e,n,u,t),l.state=e.memoizedState),typeof n.getDerivedStateFromProps=="function"||typeof l.getSnapshotBeforeUpdate=="function"||typeof l.UNSAFE_componentWillMount!="function"&&typeof l.componentWillMount!="function"||(n=l.state,typeof l.componentWillMount=="function"&&l.componentWillMount(),typeof l.UNSAFE_componentWillMount=="function"&&l.UNSAFE_componentWillMount(),n!==l.state&&qi.enqueueReplaceState(l,l.state,null),Bi(e,t,l,r),l.state=e.memoizedState),typeof l.componentDidMount=="function"&&(e.flags|=4194308)}function Ma(e,n){try{var t="",r=n;do t+=pn(r),r=r.return;while(r);var l=t}catch(u){l=`
Error generating stack: `+u.message+`
`+u.stack}return{value:e,source:n,stack:l,digest:null}}function fl(e,n,t){return{value:e,source:null,stack:t??null,digest:n??null}}function pl(e,n){try{console.error(n.value)}catch(t){setTimeout(function(){throw t})}}var Jd=typeof WeakMap=="function"?WeakMap:Map;function ku(e,n,t){t=Mr(-1,t),t.tag=3,t.payload={element:null};var r=n.value;return t.callback=function(){Ji||(Ji=!0,Ll=r),pl(e,n)},t}function wu(e,n,t){t=Mr(-1,t),t.tag=3;var r=e.type.getDerivedStateFromError;if(typeof r=="function"){var l=n.value;t.payload=function(){return r(l)},t.callback=function(){pl(e,n)}}var u=e.stateNode;return u!==null&&typeof u.componentDidCatch=="function"&&(t.callback=function(){pl(e,n),typeof r!="function"&&(Wr===null?Wr=new Set([this]):Wr.add(this));var x=n.stack;this.componentDidCatch(n.value,{componentStack:x!==null?x:""})}),t}function Au(e,n,t){var r=e.pingCache;if(r===null){r=e.pingCache=new Jd;var l=new Set;r.set(n,l)}else l=r.get(n),l===void 0&&(l=new Set,r.set(n,l));l.has(t)||(l.add(t),e=_f.bind(null,e,n,t),n.then(e,e))}function Tu(e){do{var n;if((n=e.tag===13)&&(n=e.memoizedState,n=n!==null?n.dehydrated!==null:!0),n)return e;e=e.return}while(e!==null);return null}function Eu(e,n,t,r,l){return(e.mode&1)===0?(e===n?e.flags|=65536:(e.flags|=128,t.flags|=131072,t.flags&=-52805,t.tag===1&&(t.alternate===null?t.tag=17:(n=Mr(-1,1),n.tag=2,qr(t,n,1))),t.lanes|=1),e):(e.flags|=65536,e.lanes=l,e)}var ef=Ke.ReactCurrentOwner,Zt=!1;function Xt(e,n,t,r){n.child=e===null?qs(n,null,t,r):Oa(n,e.child,t,r)}function Su(e,n,t,r,l){t=t.render;var u=n.ref;return Na(n,l),r=al(e,n,t,r,u,l),t=il(),e!==null&&!Zt?(n.updateQueue=e.updateQueue,n.flags&=-2053,e.lanes&=~l,Ir(e,n,l)):(bt&&t&&Vo(n),n.flags|=1,Xt(e,n,r,l),n.child)}function Lu(e,n,t,r,l){if(e===null){var u=t.type;return typeof u=="function"&&!Ul(u)&&u.defaultProps===void 0&&t.compare===null&&t.defaultProps===void 0?(n.tag=15,n.type=u,Ou(e,n,u,r,l)):(e=io(t.type,null,r,n,n.mode,l),e.ref=n.ref,e.return=n,n.child=e)}if(u=e.child,(e.lanes&l)===0){var x=u.memoizedProps;if(t=t.compare,t=t!==null?t:Xa,t(x,r)&&e.ref===n.ref)return Ir(e,n,l)}return n.flags|=1,e=Zr(u,r),e.ref=n.ref,e.return=n,n.child=e}function Ou(e,n,t,r,l){if(e!==null){var u=e.memoizedProps;if(Xa(u,r)&&e.ref===n.ref)if(Zt=!1,n.pendingProps=r=u,(e.lanes&l)!==0)(e.flags&131072)!==0&&(Zt=!0);else return n.lanes=e.lanes,Ir(e,n,l)}return _l(e,n,t,r,l)}function Ru(e,n,t){var r=n.pendingProps,l=r.children,u=e!==null?e.memoizedState:null;if(r.mode==="hidden")if((n.mode&1)===0)n.memoizedState={baseLanes:0,cachePool:null,transitions:null},gt(Ua,ir),ir|=t;else{if((t&1073741824)===0)return e=u!==null?u.baseLanes|t:t,n.lanes=n.childLanes=1073741824,n.memoizedState={baseLanes:e,cachePool:null,transitions:null},n.updateQueue=null,gt(Ua,ir),ir|=e,null;n.memoizedState={baseLanes:0,cachePool:null,transitions:null},r=u!==null?u.baseLanes:t,gt(Ua,ir),ir|=r}else u!==null?(r=u.baseLanes|t,n.memoizedState=null):r=t,gt(Ua,ir),ir|=r;return Xt(e,n,l,t),n.child}function Nu(e,n){var t=n.ref;(e===null&&t!==null||e!==null&&e.ref!==t)&&(n.flags|=512,n.flags|=2097152)}function _l(e,n,t,r,l){var u=Qt(t)?oa:jt.current;return u=Ta(n,u),Na(n,l),t=al(e,n,t,r,u,l),r=il(),e!==null&&!Zt?(n.updateQueue=e.updateQueue,n.flags&=-2053,e.lanes&=~l,Ir(e,n,l)):(bt&&r&&Vo(n),n.flags|=1,Xt(e,n,t,l),n.child)}function Cu(e,n,t,r,l){if(Qt(t)){var u=!0;Ri(n)}else u=!1;if(Na(n,l),n.stateNode===null)Wi(e,n),xu(n,t,r),dl(n,t,r,l),r=!0;else if(e===null){var x=n.stateNode,W=n.memoizedProps;x.props=W;var ue=x.context,Ye=t.contextType;typeof Ye=="object"&&Ye!==null?Ye=sr(Ye):(Ye=Qt(t)?oa:jt.current,Ye=Ta(n,Ye));var En=t.getDerivedStateFromProps,Rn=typeof En=="function"||typeof x.getSnapshotBeforeUpdate=="function";Rn||typeof x.UNSAFE_componentWillReceiveProps!="function"&&typeof x.componentWillReceiveProps!="function"||(W!==r||ue!==Ye)&&bu(n,x,r,Ye),Kr=!1;var An=n.memoizedState;x.state=An,Bi(n,r,x,l),ue=n.memoizedState,W!==r||An!==ue||$t.current||Kr?(typeof En=="function"&&(cl(n,t,En,r),ue=n.memoizedState),(W=Kr||vu(n,t,W,r,An,ue,Ye))?(Rn||typeof x.UNSAFE_componentWillMount!="function"&&typeof x.componentWillMount!="function"||(typeof x.componentWillMount=="function"&&x.componentWillMount(),typeof x.UNSAFE_componentWillMount=="function"&&x.UNSAFE_componentWillMount()),typeof x.componentDidMount=="function"&&(n.flags|=4194308)):(typeof x.componentDidMount=="function"&&(n.flags|=4194308),n.memoizedProps=r,n.memoizedState=ue),x.props=r,x.state=ue,x.context=Ye,r=W):(typeof x.componentDidMount=="function"&&(n.flags|=4194308),r=!1)}else{x=n.stateNode,Ws(e,n),W=n.memoizedProps,Ye=n.type===n.elementType?W:mr(n.type,W),x.props=Ye,Rn=n.pendingProps,An=x.context,ue=t.contextType,typeof ue=="object"&&ue!==null?ue=sr(ue):(ue=Qt(t)?oa:jt.current,ue=Ta(n,ue));var Hn=t.getDerivedStateFromProps;(En=typeof Hn=="function"||typeof x.getSnapshotBeforeUpdate=="function")||typeof x.UNSAFE_componentWillReceiveProps!="function"&&typeof x.componentWillReceiveProps!="function"||(W!==Rn||An!==ue)&&bu(n,x,r,ue),Kr=!1,An=n.memoizedState,x.state=An,Bi(n,r,x,l);var Xn=n.memoizedState;W!==Rn||An!==Xn||$t.current||Kr?(typeof Hn=="function"&&(cl(n,t,Hn,r),Xn=n.memoizedState),(Ye=Kr||vu(n,t,Ye,r,An,Xn,ue)||!1)?(En||typeof x.UNSAFE_componentWillUpdate!="function"&&typeof x.componentWillUpdate!="function"||(typeof x.componentWillUpdate=="function"&&x.componentWillUpdate(r,Xn,ue),typeof x.UNSAFE_componentWillUpdate=="function"&&x.UNSAFE_componentWillUpdate(r,Xn,ue)),typeof x.componentDidUpdate=="function"&&(n.flags|=4),typeof x.getSnapshotBeforeUpdate=="function"&&(n.flags|=1024)):(typeof x.componentDidUpdate!="function"||W===e.memoizedProps&&An===e.memoizedState||(n.flags|=4),typeof x.getSnapshotBeforeUpdate!="function"||W===e.memoizedProps&&An===e.memoizedState||(n.flags|=1024),n.memoizedProps=r,n.memoizedState=Xn),x.props=r,x.state=Xn,x.context=ue,r=Ye):(typeof x.componentDidUpdate!="function"||W===e.memoizedProps&&An===e.memoizedState||(n.flags|=4),typeof x.getSnapshotBeforeUpdate!="function"||W===e.memoizedProps&&An===e.memoizedState||(n.flags|=1024),r=!1)}return hl(e,n,t,r,u,l)}function hl(e,n,t,r,l,u){Nu(e,n);var x=(n.flags&128)!==0;if(!r&&!x)return l&&Ds(n,t,!1),Ir(e,n,u);r=n.stateNode,ef.current=n;var W=x&&typeof t.getDerivedStateFromError!="function"?null:r.render();return n.flags|=1,e!==null&&x?(n.child=Oa(n,e.child,null,u),n.child=Oa(n,null,W,u)):Xt(e,n,W,u),n.memoizedState=r.state,l&&Ds(n,t,!0),n.child}function Mu(e){var n=e.stateNode;n.pendingContext?Us(e,n.pendingContext,n.pendingContext!==n.context):n.context&&Us(e,n.context,!1),Zo(e,n.containerInfo)}function Iu(e,n,t,r,l){return La(),Ko(l),n.flags|=256,Xt(e,n,t,r),n.child}var ml={dehydrated:null,treeContext:null,retryLane:0};function gl(e){return{baseLanes:e,cachePool:null,transitions:null}}function Uu(e,n,t){var r=n.pendingProps,l=kt.current,u=!1,x=(n.flags&128)!==0,W;if((W=x)||(W=e!==null&&e.memoizedState===null?!1:(l&2)!==0),W?(u=!0,n.flags&=-129):(e===null||e.memoizedState!==null)&&(l|=1),gt(kt,l&1),e===null)return Ho(n),e=n.memoizedState,e!==null&&(e=e.dehydrated,e!==null)?((n.mode&1)===0?n.lanes=1:e.data==="$!"?n.lanes=8:n.lanes=1073741824,null):(x=r.children,e=r.fallback,u?(r=n.mode,u=n.child,x={mode:"hidden",children:x},(r&1)===0&&u!==null?(u.childLanes=0,u.pendingProps=x):u=oo(x,r,0,null),e=ma(e,r,t,null),u.return=n,e.return=n,u.sibling=e,n.child=u,n.child.memoizedState=gl(t),n.memoizedState=ml,e):yl(n,x));if(l=e.memoizedState,l!==null&&(W=l.dehydrated,W!==null))return nf(e,n,x,r,W,l,t);if(u){u=r.fallback,x=n.mode,l=e.child,W=l.sibling;var ue={mode:"hidden",children:r.children};return(x&1)===0&&n.child!==l?(r=n.child,r.childLanes=0,r.pendingProps=ue,n.deletions=null):(r=Zr(l,ue),r.subtreeFlags=l.subtreeFlags&14680064),W!==null?u=Zr(W,u):(u=ma(u,x,t,null),u.flags|=2),u.return=n,r.return=n,r.sibling=u,n.child=r,r=u,u=n.child,x=e.child.memoizedState,x=x===null?gl(t):{baseLanes:x.baseLanes|t,cachePool:null,transitions:x.transitions},u.memoizedState=x,u.childLanes=e.childLanes&~t,n.memoizedState=ml,r}return u=e.child,e=u.sibling,r=Zr(u,{mode:"visible",children:r.children}),(n.mode&1)===0&&(r.lanes=t),r.return=n,r.sibling=null,e!==null&&(t=n.deletions,t===null?(n.deletions=[e],n.flags|=16):t.push(e)),n.child=r,n.memoizedState=null,r}function yl(e,n){return n=oo({mode:"visible",children:n},e.mode,0,null),n.return=e,e.child=n}function Xi(e,n,t,r){return r!==null&&Ko(r),Oa(n,e.child,null,t),e=yl(n,n.pendingProps.children),e.flags|=2,n.memoizedState=null,e}function nf(e,n,t,r,l,u,x){if(t)return n.flags&256?(n.flags&=-257,r=fl(Error(d(422))),Xi(e,n,x,r)):n.memoizedState!==null?(n.child=e.child,n.flags|=128,null):(u=r.fallback,l=n.mode,r=oo({mode:"visible",children:r.children},l,0,null),u=ma(u,l,x,null),u.flags|=2,r.return=n,u.return=n,r.sibling=u,n.child=r,(n.mode&1)!==0&&Oa(n,e.child,null,x),n.child.memoizedState=gl(x),n.memoizedState=ml,u);if((n.mode&1)===0)return Xi(e,n,x,null);if(l.data==="$!"){if(r=l.nextSibling&&l.nextSibling.dataset,r)var W=r.dgst;return r=W,u=Error(d(419)),r=fl(u,r,void 0),Xi(e,n,x,r)}if(W=(x&e.childLanes)!==0,Zt||W){if(r=Ut,r!==null){switch(x&-x){case 4:l=2;break;case 16:l=8;break;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:l=32;break;case 536870912:l=268435456;break;default:l=0}l=(l&(r.suspendedLanes|x))!==0?0:l,l!==0&&l!==u.retryLane&&(u.retryLane=l,Cr(e,l),vr(r,e,l,-1))}return Il(),r=fl(Error(d(421))),Xi(e,n,x,r)}return l.data==="$?"?(n.flags|=128,n.child=e.child,n=hf.bind(null,e),l._reactRetry=n,null):(e=u.treeContext,ar=Vr(l.nextSibling),rr=n,bt=!0,hr=null,e!==null&&(or[lr++]=Rr,or[lr++]=Nr,or[lr++]=la,Rr=e.id,Nr=e.overflow,la=n),n=yl(n,r.children),n.flags|=4096,n)}function Pu(e,n,t){e.lanes|=n;var r=e.alternate;r!==null&&(r.lanes|=n),Yo(e.return,n,t)}function vl(e,n,t,r,l){var u=e.memoizedState;u===null?e.memoizedState={isBackwards:n,rendering:null,renderingStartTime:0,last:r,tail:t,tailMode:l}:(u.isBackwards=n,u.rendering=null,u.renderingStartTime=0,u.last=r,u.tail=t,u.tailMode=l)}function Du(e,n,t){var r=n.pendingProps,l=r.revealOrder,u=r.tail;if(Xt(e,n,r.children,t),r=kt.current,(r&2)!==0)r=r&1|2,n.flags|=128;else{if(e!==null&&(e.flags&128)!==0)e:for(e=n.child;e!==null;){if(e.tag===13)e.memoizedState!==null&&Pu(e,t,n);else if(e.tag===19)Pu(e,t,n);else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===n)break e;for(;e.sibling===null;){if(e.return===null||e.return===n)break e;e=e.return}e.sibling.return=e.return,e=e.sibling}r&=1}if(gt(kt,r),(n.mode&1)===0)n.memoizedState=null;else switch(l){case"forwards":for(t=n.child,l=null;t!==null;)e=t.alternate,e!==null&&Fi(e)===null&&(l=t),t=t.sibling;t=l,t===null?(l=n.child,n.child=null):(l=t.sibling,t.sibling=null),vl(n,!1,l,t,u);break;case"backwards":for(t=null,l=n.child,n.child=null;l!==null;){if(e=l.alternate,e!==null&&Fi(e)===null){n.child=l;break}e=l.sibling,l.sibling=t,t=l,l=e}vl(n,!0,t,null,u);break;case"together":vl(n,!1,null,null,void 0);break;default:n.memoizedState=null}return n.child}function Wi(e,n){(n.mode&1)===0&&e!==null&&(e.alternate=null,n.alternate=null,n.flags|=2)}function Ir(e,n,t){if(e!==null&&(n.dependencies=e.dependencies),fa|=n.lanes,(t&n.childLanes)===0)return null;if(e!==null&&n.child!==e.child)throw Error(d(153));if(n.child!==null){for(e=n.child,t=Zr(e,e.pendingProps),n.child=t,t.return=n;e.sibling!==null;)e=e.sibling,t=t.sibling=Zr(e,e.pendingProps),t.return=n;t.sibling=null}return n.child}function tf(e,n,t){switch(n.tag){case 3:Mu(n),La();break;case 5:Qs(n);break;case 1:Qt(n.type)&&Ri(n);break;case 4:Zo(n,n.stateNode.containerInfo);break;case 10:var r=n.type._context,l=n.memoizedProps.value;gt(Pi,r._currentValue),r._currentValue=l;break;case 13:if(r=n.memoizedState,r!==null)return r.dehydrated!==null?(gt(kt,kt.current&1),n.flags|=128,null):(t&n.child.childLanes)!==0?Uu(e,n,t):(gt(kt,kt.current&1),e=Ir(e,n,t),e!==null?e.sibling:null);gt(kt,kt.current&1);break;case 19:if(r=(t&n.childLanes)!==0,(e.flags&128)!==0){if(r)return Du(e,n,t);n.flags|=128}if(l=n.memoizedState,l!==null&&(l.rendering=null,l.tail=null,l.lastEffect=null),gt(kt,kt.current),r)break;return null;case 22:case 23:return n.lanes=0,Ru(e,n,t)}return Ir(e,n,t)}var Gu,xl,Bu,Fu;Gu=function(e,n){for(var t=n.child;t!==null;){if(t.tag===5||t.tag===6)e.appendChild(t.stateNode);else if(t.tag!==4&&t.child!==null){t.child.return=t,t=t.child;continue}if(t===n)break;for(;t.sibling===null;){if(t.return===null||t.return===n)return;t=t.return}t.sibling.return=t.return,t=t.sibling}},xl=function(){},Bu=function(e,n,t,r){var l=e.memoizedProps;if(l!==r){e=n.stateNode,ca(kr.current);var u=null;switch(t){case"input":l=On(e,l),r=On(e,r),u=[];break;case"select":l=T({},l,{value:void 0}),r=T({},r,{value:void 0}),u=[];break;case"textarea":l=G(e,l),r=G(e,r),u=[];break;default:typeof l.onClick!="function"&&typeof r.onClick=="function"&&(e.onclick=Si)}f(t,r);var x;t=null;for(Ye in l)if(!r.hasOwnProperty(Ye)&&l.hasOwnProperty(Ye)&&l[Ye]!=null)if(Ye==="style"){var W=l[Ye];for(x in W)W.hasOwnProperty(x)&&(t||(t={}),t[x]="")}else Ye!=="dangerouslySetInnerHTML"&&Ye!=="children"&&Ye!=="suppressContentEditableWarning"&&Ye!=="suppressHydrationWarning"&&Ye!=="autoFocus"&&(v.hasOwnProperty(Ye)?u||(u=[]):(u=u||[]).push(Ye,null));for(Ye in r){var ue=r[Ye];if(W=l!=null?l[Ye]:void 0,r.hasOwnProperty(Ye)&&ue!==W&&(ue!=null||W!=null))if(Ye==="style")if(W){for(x in W)!W.hasOwnProperty(x)||ue&&ue.hasOwnProperty(x)||(t||(t={}),t[x]="");for(x in ue)ue.hasOwnProperty(x)&&W[x]!==ue[x]&&(t||(t={}),t[x]=ue[x])}else t||(u||(u=[]),u.push(Ye,t)),t=ue;else Ye==="dangerouslySetInnerHTML"?(ue=ue?ue.__html:void 0,W=W?W.__html:void 0,ue!=null&&W!==ue&&(u=u||[]).push(Ye,ue)):Ye==="children"?typeof ue!="string"&&typeof ue!="number"||(u=u||[]).push(Ye,""+ue):Ye!=="suppressContentEditableWarning"&&Ye!=="suppressHydrationWarning"&&(v.hasOwnProperty(Ye)?(ue!=null&&Ye==="onScroll"&&yt("scroll",e),u||W===ue||(u=[])):(u=u||[]).push(Ye,ue))}t&&(u=u||[]).push("style",t);var Ye=u;(n.updateQueue=Ye)&&(n.flags|=4)}},Fu=function(e,n,t,r){t!==r&&(n.flags|=4)};function si(e,n){if(!bt)switch(e.tailMode){case"hidden":n=e.tail;for(var t=null;n!==null;)n.alternate!==null&&(t=n),n=n.sibling;t===null?e.tail=null:t.sibling=null;break;case"collapsed":t=e.tail;for(var r=null;t!==null;)t.alternate!==null&&(r=t),t=t.sibling;r===null?n||e.tail===null?e.tail=null:e.tail.sibling=null:r.sibling=null}}function Ht(e){var n=e.alternate!==null&&e.alternate.child===e.child,t=0,r=0;if(n)for(var l=e.child;l!==null;)t|=l.lanes|l.childLanes,r|=l.subtreeFlags&14680064,r|=l.flags&14680064,l.return=e,l=l.sibling;else for(l=e.child;l!==null;)t|=l.lanes|l.childLanes,r|=l.subtreeFlags,r|=l.flags,l.return=e,l=l.sibling;return e.subtreeFlags|=r,e.childLanes=t,n}function rf(e,n,t){var r=n.pendingProps;switch(jo(n),n.tag){case 2:case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return Ht(n),null;case 1:return Qt(n.type)&&Oi(),Ht(n),null;case 3:return r=n.stateNode,Ca(),vt($t),vt(jt),nl(),r.pendingContext&&(r.context=r.pendingContext,r.pendingContext=null),(e===null||e.child===null)&&(Ii(n)?n.flags|=4:e===null||e.memoizedState.isDehydrated&&(n.flags&256)===0||(n.flags|=1024,hr!==null&&(Nl(hr),hr=null))),xl(e,n),Ht(n),null;case 5:Jo(n);var l=ca(ri.current);if(t=n.type,e!==null&&n.stateNode!=null)Bu(e,n,t,r,l),e.ref!==n.ref&&(n.flags|=512,n.flags|=2097152);else{if(!r){if(n.stateNode===null)throw Error(d(166));return Ht(n),null}if(e=ca(kr.current),Ii(n)){r=n.stateNode,t=n.type;var u=n.memoizedProps;switch(r[br]=n,r[Za]=u,e=(n.mode&1)!==0,t){case"dialog":yt("cancel",r),yt("close",r);break;case"iframe":case"object":case"embed":yt("load",r);break;case"video":case"audio":for(l=0;l<Ya.length;l++)yt(Ya[l],r);break;case"source":yt("error",r);break;case"img":case"image":case"link":yt("error",r),yt("load",r);break;case"details":yt("toggle",r);break;case"input":bn(r,u),yt("invalid",r);break;case"select":r._wrapperState={wasMultiple:!!u.multiple},yt("invalid",r);break;case"textarea":Ae(r,u),yt("invalid",r)}f(t,u),l=null;for(var x in u)if(u.hasOwnProperty(x)){var W=u[x];x==="children"?typeof W=="string"?r.textContent!==W&&(u.suppressHydrationWarning!==!0&&Ei(r.textContent,W,e),l=["children",W]):typeof W=="number"&&r.textContent!==""+W&&(u.suppressHydrationWarning!==!0&&Ei(r.textContent,W,e),l=["children",""+W]):v.hasOwnProperty(x)&&W!=null&&x==="onScroll"&&yt("scroll",r)}switch(t){case"input":Ie(r),Ue(r,u,!0);break;case"textarea":Ie(r),Nn(r);break;case"select":case"option":break;default:typeof u.onClick=="function"&&(r.onclick=Si)}r=l,n.updateQueue=r,r!==null&&(n.flags|=4)}else{x=l.nodeType===9?l:l.ownerDocument,e==="http://www.w3.org/1999/xhtml"&&(e=Un(t)),e==="http://www.w3.org/1999/xhtml"?t==="script"?(e=x.createElement("div"),e.innerHTML="<script><\/script>",e=e.removeChild(e.firstChild)):typeof r.is=="string"?e=x.createElement(t,{is:r.is}):(e=x.createElement(t),t==="select"&&(x=e,r.multiple?x.multiple=!0:r.size&&(x.size=r.size))):e=x.createElementNS(e,t),e[br]=n,e[Za]=r,Gu(e,n,!1,!1),n.stateNode=e;e:{switch(x=M(t,r),t){case"dialog":yt("cancel",e),yt("close",e),l=r;break;case"iframe":case"object":case"embed":yt("load",e),l=r;break;case"video":case"audio":for(l=0;l<Ya.length;l++)yt(Ya[l],e);l=r;break;case"source":yt("error",e),l=r;break;case"img":case"image":case"link":yt("error",e),yt("load",e),l=r;break;case"details":yt("toggle",e),l=r;break;case"input":bn(e,r),l=On(e,r),yt("invalid",e);break;case"option":l=r;break;case"select":e._wrapperState={wasMultiple:!!r.multiple},l=T({},r,{value:void 0}),yt("invalid",e);break;case"textarea":Ae(e,r),l=G(e,r),yt("invalid",e);break;default:l=r}f(t,l),W=l;for(u in W)if(W.hasOwnProperty(u)){var ue=W[u];u==="style"?V(e,ue):u==="dangerouslySetInnerHTML"?(ue=ue?ue.__html:void 0,ue!=null&&ot(e,ue)):u==="children"?typeof ue=="string"?(t!=="textarea"||ue!=="")&&o(e,ue):typeof ue=="number"&&o(e,""+ue):u!=="suppressContentEditableWarning"&&u!=="suppressHydrationWarning"&&u!=="autoFocus"&&(v.hasOwnProperty(u)?ue!=null&&u==="onScroll"&&yt("scroll",e):ue!=null&&nn(e,u,ue,x))}switch(t){case"input":Ie(e),Ue(e,r,!1);break;case"textarea":Ie(e),Nn(e);break;case"option":r.value!=null&&e.setAttribute("value",""+mn(r.value));break;case"select":e.multiple=!!r.multiple,u=r.value,u!=null?He(e,!!r.multiple,u,!1):r.defaultValue!=null&&He(e,!!r.multiple,r.defaultValue,!0);break;default:typeof l.onClick=="function"&&(e.onclick=Si)}switch(t){case"button":case"input":case"select":case"textarea":r=!!r.autoFocus;break e;case"img":r=!0;break e;default:r=!1}}r&&(n.flags|=4)}n.ref!==null&&(n.flags|=512,n.flags|=2097152)}return Ht(n),null;case 6:if(e&&n.stateNode!=null)Fu(e,n,e.memoizedProps,r);else{if(typeof r!="string"&&n.stateNode===null)throw Error(d(166));if(t=ca(ri.current),ca(kr.current),Ii(n)){if(r=n.stateNode,t=n.memoizedProps,r[br]=n,(u=r.nodeValue!==t)&&(e=rr,e!==null))switch(e.tag){case 3:Ei(r.nodeValue,t,(e.mode&1)!==0);break;case 5:e.memoizedProps.suppressHydrationWarning!==!0&&Ei(r.nodeValue,t,(e.mode&1)!==0)}u&&(n.flags|=4)}else r=(t.nodeType===9?t:t.ownerDocument).createTextNode(r),r[br]=n,n.stateNode=r}return Ht(n),null;case 13:if(vt(kt),r=n.memoizedState,e===null||e.memoizedState!==null&&e.memoizedState.dehydrated!==null){if(bt&&ar!==null&&(n.mode&1)!==0&&(n.flags&128)===0)zs(),La(),n.flags|=98560,u=!1;else if(u=Ii(n),r!==null&&r.dehydrated!==null){if(e===null){if(!u)throw Error(d(318));if(u=n.memoizedState,u=u!==null?u.dehydrated:null,!u)throw Error(d(317));u[br]=n}else La(),(n.flags&128)===0&&(n.memoizedState=null),n.flags|=4;Ht(n),u=!1}else hr!==null&&(Nl(hr),hr=null),u=!0;if(!u)return n.flags&65536?n:null}return(n.flags&128)!==0?(n.lanes=t,n):(r=r!==null,r!==(e!==null&&e.memoizedState!==null)&&r&&(n.child.flags|=8192,(n.mode&1)!==0&&(e===null||(kt.current&1)!==0?Nt===0&&(Nt=3):Il())),n.updateQueue!==null&&(n.flags|=4),Ht(n),null);case 4:return Ca(),xl(e,n),e===null&&$a(n.stateNode.containerInfo),Ht(n),null;case 10:return Wo(n.type._context),Ht(n),null;case 17:return Qt(n.type)&&Oi(),Ht(n),null;case 19:if(vt(kt),u=n.memoizedState,u===null)return Ht(n),null;if(r=(n.flags&128)!==0,x=u.rendering,x===null)if(r)si(u,!1);else{if(Nt!==0||e!==null&&(e.flags&128)!==0)for(e=n.child;e!==null;){if(x=Fi(e),x!==null){for(n.flags|=128,si(u,!1),r=x.updateQueue,r!==null&&(n.updateQueue=r,n.flags|=4),n.subtreeFlags=0,r=t,t=n.child;t!==null;)u=t,e=r,u.flags&=14680066,x=u.alternate,x===null?(u.childLanes=0,u.lanes=e,u.child=null,u.subtreeFlags=0,u.memoizedProps=null,u.memoizedState=null,u.updateQueue=null,u.dependencies=null,u.stateNode=null):(u.childLanes=x.childLanes,u.lanes=x.lanes,u.child=x.child,u.subtreeFlags=0,u.deletions=null,u.memoizedProps=x.memoizedProps,u.memoizedState=x.memoizedState,u.updateQueue=x.updateQueue,u.type=x.type,e=x.dependencies,u.dependencies=e===null?null:{lanes:e.lanes,firstContext:e.firstContext}),t=t.sibling;return gt(kt,kt.current&1|2),n.child}e=e.sibling}u.tail!==null&&Vn()>Pa&&(n.flags|=128,r=!0,si(u,!1),n.lanes=4194304)}else{if(!r)if(e=Fi(x),e!==null){if(n.flags|=128,r=!0,t=e.updateQueue,t!==null&&(n.updateQueue=t,n.flags|=4),si(u,!0),u.tail===null&&u.tailMode==="hidden"&&!x.alternate&&!bt)return Ht(n),null}else 2*Vn()-u.renderingStartTime>Pa&&t!==1073741824&&(n.flags|=128,r=!0,si(u,!1),n.lanes=4194304);u.isBackwards?(x.sibling=n.child,n.child=x):(t=u.last,t!==null?t.sibling=x:n.child=x,u.last=x)}return u.tail!==null?(n=u.tail,u.rendering=n,u.tail=n.sibling,u.renderingStartTime=Vn(),n.sibling=null,t=kt.current,gt(kt,r?t&1|2:t&1),n):(Ht(n),null);case 22:case 23:return Ml(),r=n.memoizedState!==null,e!==null&&e.memoizedState!==null!==r&&(n.flags|=8192),r&&(n.mode&1)!==0?(ir&1073741824)!==0&&(Ht(n),n.subtreeFlags&6&&(n.flags|=8192)):Ht(n),null;case 24:return null;case 25:return null}throw Error(d(156,n.tag))}function af(e,n){switch(jo(n),n.tag){case 1:return Qt(n.type)&&Oi(),e=n.flags,e&65536?(n.flags=e&-65537|128,n):null;case 3:return Ca(),vt($t),vt(jt),nl(),e=n.flags,(e&65536)!==0&&(e&128)===0?(n.flags=e&-65537|128,n):null;case 5:return Jo(n),null;case 13:if(vt(kt),e=n.memoizedState,e!==null&&e.dehydrated!==null){if(n.alternate===null)throw Error(d(340));La()}return e=n.flags,e&65536?(n.flags=e&-65537|128,n):null;case 19:return vt(kt),null;case 4:return Ca(),null;case 10:return Wo(n.type._context),null;case 22:case 23:return Ml(),null;case 24:return null;default:return null}}var Yi=!1,Kt=!1,of=typeof WeakSet=="function"?WeakSet:Set,qn=null;function Ia(e,n){var t=e.ref;if(t!==null)if(typeof t=="function")try{t(null)}catch(r){Tt(e,n,r)}else t.current=null}function bl(e,n,t){try{t()}catch(r){Tt(e,n,r)}}var Vu=!1;function lf(e,n){if(Mo=aa,e=vs(),To(e)){if("selectionStart"in e)var t={start:e.selectionStart,end:e.selectionEnd};else e:{t=(t=e.ownerDocument)&&t.defaultView||window;var r=t.getSelection&&t.getSelection();if(r&&r.rangeCount!==0){t=r.anchorNode;var l=r.anchorOffset,u=r.focusNode;r=r.focusOffset;try{t.nodeType,u.nodeType}catch{t=null;break e}var x=0,W=-1,ue=-1,Ye=0,En=0,Rn=e,An=null;n:for(;;){for(var Hn;Rn!==t||l!==0&&Rn.nodeType!==3||(W=x+l),Rn!==u||r!==0&&Rn.nodeType!==3||(ue=x+r),Rn.nodeType===3&&(x+=Rn.nodeValue.length),(Hn=Rn.firstChild)!==null;)An=Rn,Rn=Hn;for(;;){if(Rn===e)break n;if(An===t&&++Ye===l&&(W=x),An===u&&++En===r&&(ue=x),(Hn=Rn.nextSibling)!==null)break;Rn=An,An=Rn.parentNode}Rn=Hn}t=W===-1||ue===-1?null:{start:W,end:ue}}else t=null}t=t||{start:0,end:0}}else t=null;for(Io={focusedElem:e,selectionRange:t},aa=!1,qn=n;qn!==null;)if(n=qn,e=n.child,(n.subtreeFlags&1028)!==0&&e!==null)e.return=n,qn=e;else for(;qn!==null;){n=qn;try{var Xn=n.alternate;if((n.flags&1024)!==0)switch(n.tag){case 0:case 11:case 15:break;case 1:if(Xn!==null){var Yn=Xn.memoizedProps,St=Xn.memoizedState,Be=n.stateNode,ke=Be.getSnapshotBeforeUpdate(n.elementType===n.type?Yn:mr(n.type,Yn),St);Be.__reactInternalSnapshotBeforeUpdate=ke}break;case 3:var je=n.stateNode.containerInfo;je.nodeType===1?je.textContent="":je.nodeType===9&&je.documentElement&&je.removeChild(je.documentElement);break;case 5:case 6:case 4:case 17:break;default:throw Error(d(163))}}catch(Cn){Tt(n,n.return,Cn)}if(e=n.sibling,e!==null){e.return=n.return,qn=e;break}qn=n.return}return Xn=Vu,Vu=!1,Xn}function ui(e,n,t){var r=n.updateQueue;if(r=r!==null?r.lastEffect:null,r!==null){var l=r=r.next;do{if((l.tag&e)===e){var u=l.destroy;l.destroy=void 0,u!==void 0&&bl(n,t,u)}l=l.next}while(l!==r)}}function $i(e,n){if(n=n.updateQueue,n=n!==null?n.lastEffect:null,n!==null){var t=n=n.next;do{if((t.tag&e)===e){var r=t.create;t.destroy=r()}t=t.next}while(t!==n)}}function kl(e){var n=e.ref;if(n!==null){var t=e.stateNode;switch(e.tag){case 5:e=t;break;default:e=t}typeof n=="function"?n(e):n.current=e}}function ju(e){var n=e.alternate;n!==null&&(e.alternate=null,ju(n)),e.child=null,e.deletions=null,e.sibling=null,e.tag===5&&(n=e.stateNode,n!==null&&(delete n[br],delete n[Za],delete n[Go],delete n[jd],delete n[zd])),e.stateNode=null,e.return=null,e.dependencies=null,e.memoizedProps=null,e.memoizedState=null,e.pendingProps=null,e.stateNode=null,e.updateQueue=null}function zu(e){return e.tag===5||e.tag===3||e.tag===4}function Hu(e){e:for(;;){for(;e.sibling===null;){if(e.return===null||zu(e.return))return null;e=e.return}for(e.sibling.return=e.return,e=e.sibling;e.tag!==5&&e.tag!==6&&e.tag!==18;){if(e.flags&2||e.child===null||e.tag===4)continue e;e.child.return=e,e=e.child}if(!(e.flags&2))return e.stateNode}}function wl(e,n,t){var r=e.tag;if(r===5||r===6)e=e.stateNode,n?t.nodeType===8?t.parentNode.insertBefore(e,n):t.insertBefore(e,n):(t.nodeType===8?(n=t.parentNode,n.insertBefore(e,t)):(n=t,n.appendChild(e)),t=t._reactRootContainer,t!=null||n.onclick!==null||(n.onclick=Si));else if(r!==4&&(e=e.child,e!==null))for(wl(e,n,t),e=e.sibling;e!==null;)wl(e,n,t),e=e.sibling}function Al(e,n,t){var r=e.tag;if(r===5||r===6)e=e.stateNode,n?t.insertBefore(e,n):t.appendChild(e);else if(r!==4&&(e=e.child,e!==null))for(Al(e,n,t),e=e.sibling;e!==null;)Al(e,n,t),e=e.sibling}var Gt=null,gr=!1;function Xr(e,n,t){for(t=t.child;t!==null;)Ku(e,n,t),t=t.sibling}function Ku(e,n,t){if(le&&typeof le.onCommitFiberUnmount=="function")try{le.onCommitFiberUnmount(E,t)}catch{}switch(t.tag){case 5:Kt||Ia(t,n);case 6:var r=Gt,l=gr;Gt=null,Xr(e,n,t),Gt=r,gr=l,Gt!==null&&(gr?(e=Gt,t=t.stateNode,e.nodeType===8?e.parentNode.removeChild(t):e.removeChild(t)):Gt.removeChild(t.stateNode));break;case 18:Gt!==null&&(gr?(e=Gt,t=t.stateNode,e.nodeType===8?Do(e.parentNode,t):e.nodeType===1&&Do(e,t),ra(e)):Do(Gt,t.stateNode));break;case 4:r=Gt,l=gr,Gt=t.stateNode.containerInfo,gr=!0,Xr(e,n,t),Gt=r,gr=l;break;case 0:case 11:case 14:case 15:if(!Kt&&(r=t.updateQueue,r!==null&&(r=r.lastEffect,r!==null))){l=r=r.next;do{var u=l,x=u.destroy;u=u.tag,x!==void 0&&((u&2)!==0||(u&4)!==0)&&bl(t,n,x),l=l.next}while(l!==r)}Xr(e,n,t);break;case 1:if(!Kt&&(Ia(t,n),r=t.stateNode,typeof r.componentWillUnmount=="function"))try{r.props=t.memoizedProps,r.state=t.memoizedState,r.componentWillUnmount()}catch(W){Tt(t,n,W)}Xr(e,n,t);break;case 21:Xr(e,n,t);break;case 22:t.mode&1?(Kt=(r=Kt)||t.memoizedState!==null,Xr(e,n,t),Kt=r):Xr(e,n,t);break;default:Xr(e,n,t)}}function qu(e){var n=e.updateQueue;if(n!==null){e.updateQueue=null;var t=e.stateNode;t===null&&(t=e.stateNode=new of),n.forEach(function(r){var l=mf.bind(null,e,r);t.has(r)||(t.add(r),r.then(l,l))})}}function yr(e,n){var t=n.deletions;if(t!==null)for(var r=0;r<t.length;r++){var l=t[r];try{var u=e,x=n,W=x;e:for(;W!==null;){switch(W.tag){case 5:Gt=W.stateNode,gr=!1;break e;case 3:Gt=W.stateNode.containerInfo,gr=!0;break e;case 4:Gt=W.stateNode.containerInfo,gr=!0;break e}W=W.return}if(Gt===null)throw Error(d(160));Ku(u,x,l),Gt=null,gr=!1;var ue=l.alternate;ue!==null&&(ue.return=null),l.return=null}catch(Ye){Tt(l,n,Ye)}}if(n.subtreeFlags&12854)for(n=n.child;n!==null;)Xu(n,e),n=n.sibling}function Xu(e,n){var t=e.alternate,r=e.flags;switch(e.tag){case 0:case 11:case 14:case 15:if(yr(n,e),Ar(e),r&4){try{ui(3,e,e.return),$i(3,e)}catch(Yn){Tt(e,e.return,Yn)}try{ui(5,e,e.return)}catch(Yn){Tt(e,e.return,Yn)}}break;case 1:yr(n,e),Ar(e),r&512&&t!==null&&Ia(t,t.return);break;case 5:if(yr(n,e),Ar(e),r&512&&t!==null&&Ia(t,t.return),e.flags&32){var l=e.stateNode;try{o(l,"")}catch(Yn){Tt(e,e.return,Yn)}}if(r&4&&(l=e.stateNode,l!=null)){var u=e.memoizedProps,x=t!==null?t.memoizedProps:u,W=e.type,ue=e.updateQueue;if(e.updateQueue=null,ue!==null)try{W==="input"&&u.type==="radio"&&u.name!=null&&Je(l,u),M(W,x);var Ye=M(W,u);for(x=0;x<ue.length;x+=2){var En=ue[x],Rn=ue[x+1];En==="style"?V(l,Rn):En==="dangerouslySetInnerHTML"?ot(l,Rn):En==="children"?o(l,Rn):nn(l,En,Rn,Ye)}switch(W){case"input":ie(l,u);break;case"textarea":Pe(l,u);break;case"select":var An=l._wrapperState.wasMultiple;l._wrapperState.wasMultiple=!!u.multiple;var Hn=u.value;Hn!=null?He(l,!!u.multiple,Hn,!1):An!==!!u.multiple&&(u.defaultValue!=null?He(l,!!u.multiple,u.defaultValue,!0):He(l,!!u.multiple,u.multiple?[]:"",!1))}l[Za]=u}catch(Yn){Tt(e,e.return,Yn)}}break;case 6:if(yr(n,e),Ar(e),r&4){if(e.stateNode===null)throw Error(d(162));l=e.stateNode,u=e.memoizedProps;try{l.nodeValue=u}catch(Yn){Tt(e,e.return,Yn)}}break;case 3:if(yr(n,e),Ar(e),r&4&&t!==null&&t.memoizedState.isDehydrated)try{ra(n.containerInfo)}catch(Yn){Tt(e,e.return,Yn)}break;case 4:yr(n,e),Ar(e);break;case 13:yr(n,e),Ar(e),l=e.child,l.flags&8192&&(u=l.memoizedState!==null,l.stateNode.isHidden=u,!u||l.alternate!==null&&l.alternate.memoizedState!==null||(Sl=Vn())),r&4&&qu(e);break;case 22:if(En=t!==null&&t.memoizedState!==null,e.mode&1?(Kt=(Ye=Kt)||En,yr(n,e),Kt=Ye):yr(n,e),Ar(e),r&8192){if(Ye=e.memoizedState!==null,(e.stateNode.isHidden=Ye)&&!En&&(e.mode&1)!==0)for(qn=e,En=e.child;En!==null;){for(Rn=qn=En;qn!==null;){switch(An=qn,Hn=An.child,An.tag){case 0:case 11:case 14:case 15:ui(4,An,An.return);break;case 1:Ia(An,An.return);var Xn=An.stateNode;if(typeof Xn.componentWillUnmount=="function"){r=An,t=An.return;try{n=r,Xn.props=n.memoizedProps,Xn.state=n.memoizedState,Xn.componentWillUnmount()}catch(Yn){Tt(r,t,Yn)}}break;case 5:Ia(An,An.return);break;case 22:if(An.memoizedState!==null){$u(Rn);continue}}Hn!==null?(Hn.return=An,qn=Hn):$u(Rn)}En=En.sibling}e:for(En=null,Rn=e;;){if(Rn.tag===5){if(En===null){En=Rn;try{l=Rn.stateNode,Ye?(u=l.style,typeof u.setProperty=="function"?u.setProperty("display","none","important"):u.display="none"):(W=Rn.stateNode,ue=Rn.memoizedProps.style,x=ue!=null&&ue.hasOwnProperty("display")?ue.display:null,W.style.display=X("display",x))}catch(Yn){Tt(e,e.return,Yn)}}}else if(Rn.tag===6){if(En===null)try{Rn.stateNode.nodeValue=Ye?"":Rn.memoizedProps}catch(Yn){Tt(e,e.return,Yn)}}else if((Rn.tag!==22&&Rn.tag!==23||Rn.memoizedState===null||Rn===e)&&Rn.child!==null){Rn.child.return=Rn,Rn=Rn.child;continue}if(Rn===e)break e;for(;Rn.sibling===null;){if(Rn.return===null||Rn.return===e)break e;En===Rn&&(En=null),Rn=Rn.return}En===Rn&&(En=null),Rn.sibling.return=Rn.return,Rn=Rn.sibling}}break;case 19:yr(n,e),Ar(e),r&4&&qu(e);break;case 21:break;default:yr(n,e),Ar(e)}}function Ar(e){var n=e.flags;if(n&2){try{e:{for(var t=e.return;t!==null;){if(zu(t)){var r=t;break e}t=t.return}throw Error(d(160))}switch(r.tag){case 5:var l=r.stateNode;r.flags&32&&(o(l,""),r.flags&=-33);var u=Hu(e);Al(e,u,l);break;case 3:case 4:var x=r.stateNode.containerInfo,W=Hu(e);wl(e,W,x);break;default:throw Error(d(161))}}catch(ue){Tt(e,e.return,ue)}e.flags&=-3}n&4096&&(e.flags&=-4097)}function sf(e,n,t){qn=e,Wu(e)}function Wu(e,n,t){for(var r=(e.mode&1)!==0;qn!==null;){var l=qn,u=l.child;if(l.tag===22&&r){var x=l.memoizedState!==null||Yi;if(!x){var W=l.alternate,ue=W!==null&&W.memoizedState!==null||Kt;W=Yi;var Ye=Kt;if(Yi=x,(Kt=ue)&&!Ye)for(qn=l;qn!==null;)x=qn,ue=x.child,x.tag===22&&x.memoizedState!==null?Qu(l):ue!==null?(ue.return=x,qn=ue):Qu(l);for(;u!==null;)qn=u,Wu(u),u=u.sibling;qn=l,Yi=W,Kt=Ye}Yu(e)}else(l.subtreeFlags&8772)!==0&&u!==null?(u.return=l,qn=u):Yu(e)}}function Yu(e){for(;qn!==null;){var n=qn;if((n.flags&8772)!==0){var t=n.alternate;try{if((n.flags&8772)!==0)switch(n.tag){case 0:case 11:case 15:Kt||$i(5,n);break;case 1:var r=n.stateNode;if(n.flags&4&&!Kt)if(t===null)r.componentDidMount();else{var l=n.elementType===n.type?t.memoizedProps:mr(n.type,t.memoizedProps);r.componentDidUpdate(l,t.memoizedState,r.__reactInternalSnapshotBeforeUpdate)}var u=n.updateQueue;u!==null&&$s(n,u,r);break;case 3:var x=n.updateQueue;if(x!==null){if(t=null,n.child!==null)switch(n.child.tag){case 5:t=n.child.stateNode;break;case 1:t=n.child.stateNode}$s(n,x,t)}break;case 5:var W=n.stateNode;if(t===null&&n.flags&4){t=W;var ue=n.memoizedProps;switch(n.type){case"button":case"input":case"select":case"textarea":ue.autoFocus&&t.focus();break;case"img":ue.src&&(t.src=ue.src)}}break;case 6:break;case 4:break;case 12:break;case 13:if(n.memoizedState===null){var Ye=n.alternate;if(Ye!==null){var En=Ye.memoizedState;if(En!==null){var Rn=En.dehydrated;Rn!==null&&ra(Rn)}}}break;case 19:case 17:case 21:case 22:case 23:case 25:break;default:throw Error(d(163))}Kt||n.flags&512&&kl(n)}catch(An){Tt(n,n.return,An)}}if(n===e){qn=null;break}if(t=n.sibling,t!==null){t.return=n.return,qn=t;break}qn=n.return}}function $u(e){for(;qn!==null;){var n=qn;if(n===e){qn=null;break}var t=n.sibling;if(t!==null){t.return=n.return,qn=t;break}qn=n.return}}function Qu(e){for(;qn!==null;){var n=qn;try{switch(n.tag){case 0:case 11:case 15:var t=n.return;try{$i(4,n)}catch(ue){Tt(n,t,ue)}break;case 1:var r=n.stateNode;if(typeof r.componentDidMount=="function"){var l=n.return;try{r.componentDidMount()}catch(ue){Tt(n,l,ue)}}var u=n.return;try{kl(n)}catch(ue){Tt(n,u,ue)}break;case 5:var x=n.return;try{kl(n)}catch(ue){Tt(n,x,ue)}}}catch(ue){Tt(n,n.return,ue)}if(n===e){qn=null;break}var W=n.sibling;if(W!==null){W.return=n.return,qn=W;break}qn=n.return}}var uf=Math.ceil,Qi=Ke.ReactCurrentDispatcher,Tl=Ke.ReactCurrentOwner,cr=Ke.ReactCurrentBatchConfig,ft=0,Ut=null,Ot=null,Bt=0,ir=0,Ua=jr(0),Nt=0,ci=null,fa=0,Zi=0,El=0,di=null,Jt=null,Sl=0,Pa=1/0,Ur=null,Ji=!1,Ll=null,Wr=null,eo=!1,Yr=null,no=0,fi=0,Ol=null,to=-1,ro=0;function Wt(){return(ft&6)!==0?Vn():to!==-1?to:to=Vn()}function $r(e){return(e.mode&1)===0?1:(ft&2)!==0&&Bt!==0?Bt&-Bt:Kd.transition!==null?(ro===0&&(ro=he()),ro):(e=jn,e!==0||(e=window.event,e=e===void 0?16:Z(e.type)),e)}function vr(e,n,t,r){if(50<fi)throw fi=0,Ol=null,Error(d(185));Sn(e,t,r),((ft&2)===0||e!==Ut)&&(e===Ut&&((ft&2)===0&&(Zi|=t),Nt===4&&Qr(e,Bt)),er(e,r),t===1&&ft===0&&(n.mode&1)===0&&(Pa=Vn()+500,Ni&&Hr()))}function er(e,n){var t=e.callbackNode;K(e,n);var r=p(e,e===Ut?Bt:0);if(r===0)t!==null&&ht(t),e.callbackNode=null,e.callbackPriority=0;else if(n=r&-r,e.callbackPriority!==n){if(t!=null&&ht(t),n===1)e.tag===0?Hd(Ju.bind(null,e)):Gs(Ju.bind(null,e)),Fd(function(){(ft&6)===0&&Hr()}),t=null;else{switch(k(r)){case 1:t=lt;break;case 4:t=Ct;break;case 16:t=pt;break;case 536870912:t=At;break;default:t=pt}t=lc(t,Zu.bind(null,e))}e.callbackPriority=n,e.callbackNode=t}}function Zu(e,n){if(to=-1,ro=0,(ft&6)!==0)throw Error(d(327));var t=e.callbackNode;if(Da()&&e.callbackNode!==t)return null;var r=p(e,e===Ut?Bt:0);if(r===0)return null;if((r&30)!==0||(r&e.expiredLanes)!==0||n)n=ao(e,r);else{n=r;var l=ft;ft|=2;var u=nc();(Ut!==e||Bt!==n)&&(Ur=null,Pa=Vn()+500,_a(e,n));do try{ff();break}catch(W){ec(e,W)}while(!0);Xo(),Qi.current=u,ft=l,Ot!==null?n=0:(Ut=null,Bt=0,n=Nt)}if(n!==0){if(n===2&&(l=ye(e),l!==0&&(r=l,n=Rl(e,l))),n===1)throw t=ci,_a(e,0),Qr(e,r),er(e,Vn()),t;if(n===6)Qr(e,r);else{if(l=e.current.alternate,(r&30)===0&&!cf(l)&&(n=ao(e,r),n===2&&(u=ye(e),u!==0&&(r=u,n=Rl(e,u))),n===1))throw t=ci,_a(e,0),Qr(e,r),er(e,Vn()),t;switch(e.finishedWork=l,e.finishedLanes=r,n){case 0:case 1:throw Error(d(345));case 2:ha(e,Jt,Ur);break;case 3:if(Qr(e,r),(r&130023424)===r&&(n=Sl+500-Vn(),10<n)){if(p(e,0)!==0)break;if(l=e.suspendedLanes,(l&r)!==r){Wt(),e.pingedLanes|=e.suspendedLanes&l;break}e.timeoutHandle=Po(ha.bind(null,e,Jt,Ur),n);break}ha(e,Jt,Ur);break;case 4:if(Qr(e,r),(r&4194240)===r)break;for(n=e.eventTimes,l=-1;0<r;){var x=31-ln(r);u=1<<x,x=n[x],x>l&&(l=x),r&=~u}if(r=l,r=Vn()-r,r=(120>r?120:480>r?480:1080>r?1080:1920>r?1920:3e3>r?3e3:4320>r?4320:1960*uf(r/1960))-r,10<r){e.timeoutHandle=Po(ha.bind(null,e,Jt,Ur),r);break}ha(e,Jt,Ur);break;case 5:ha(e,Jt,Ur);break;default:throw Error(d(329))}}}return er(e,Vn()),e.callbackNode===t?Zu.bind(null,e):null}function Rl(e,n){var t=di;return e.current.memoizedState.isDehydrated&&(_a(e,n).flags|=256),e=ao(e,n),e!==2&&(n=Jt,Jt=t,n!==null&&Nl(n)),e}function Nl(e){Jt===null?Jt=e:Jt.push.apply(Jt,e)}function cf(e){for(var n=e;;){if(n.flags&16384){var t=n.updateQueue;if(t!==null&&(t=t.stores,t!==null))for(var r=0;r<t.length;r++){var l=t[r],u=l.getSnapshot;l=l.value;try{if(!_r(u(),l))return!1}catch{return!1}}}if(t=n.child,n.subtreeFlags&16384&&t!==null)t.return=n,n=t;else{if(n===e)break;for(;n.sibling===null;){if(n.return===null||n.return===e)return!0;n=n.return}n.sibling.return=n.return,n=n.sibling}}return!0}function Qr(e,n){for(n&=~El,n&=~Zi,e.suspendedLanes|=n,e.pingedLanes&=~n,e=e.expirationTimes;0<n;){var t=31-ln(n),r=1<<t;e[t]=-1,n&=~r}}function Ju(e){if((ft&6)!==0)throw Error(d(327));Da();var n=p(e,0);if((n&1)===0)return er(e,Vn()),null;var t=ao(e,n);if(e.tag!==0&&t===2){var r=ye(e);r!==0&&(n=r,t=Rl(e,r))}if(t===1)throw t=ci,_a(e,0),Qr(e,n),er(e,Vn()),t;if(t===6)throw Error(d(345));return e.finishedWork=e.current.alternate,e.finishedLanes=n,ha(e,Jt,Ur),er(e,Vn()),null}function Cl(e,n){var t=ft;ft|=1;try{return e(n)}finally{ft=t,ft===0&&(Pa=Vn()+500,Ni&&Hr())}}function pa(e){Yr!==null&&Yr.tag===0&&(ft&6)===0&&Da();var n=ft;ft|=1;var t=cr.transition,r=jn;try{if(cr.transition=null,jn=1,e)return e()}finally{jn=r,cr.transition=t,ft=n,(ft&6)===0&&Hr()}}function Ml(){ir=Ua.current,vt(Ua)}function _a(e,n){e.finishedWork=null,e.finishedLanes=0;var t=e.timeoutHandle;if(t!==-1&&(e.timeoutHandle=-1,Bd(t)),Ot!==null)for(t=Ot.return;t!==null;){var r=t;switch(jo(r),r.tag){case 1:r=r.type.childContextTypes,r!=null&&Oi();break;case 3:Ca(),vt($t),vt(jt),nl();break;case 5:Jo(r);break;case 4:Ca();break;case 13:vt(kt);break;case 19:vt(kt);break;case 10:Wo(r.type._context);break;case 22:case 23:Ml()}t=t.return}if(Ut=e,Ot=e=Zr(e.current,null),Bt=ir=n,Nt=0,ci=null,El=Zi=fa=0,Jt=di=null,ua!==null){for(n=0;n<ua.length;n++)if(t=ua[n],r=t.interleaved,r!==null){t.interleaved=null;var l=r.next,u=t.pending;if(u!==null){var x=u.next;u.next=l,r.next=x}t.pending=r}ua=null}return e}function ec(e,n){do{var t=Ot;try{if(Xo(),Vi.current=Ki,ji){for(var r=wt.memoizedState;r!==null;){var l=r.queue;l!==null&&(l.pending=null),r=r.next}ji=!1}if(da=0,It=Rt=wt=null,ai=!1,ii=0,Tl.current=null,t===null||t.return===null){Nt=1,ci=n,Ot=null;break}e:{var u=e,x=t.return,W=t,ue=n;if(n=Bt,W.flags|=32768,ue!==null&&typeof ue=="object"&&typeof ue.then=="function"){var Ye=ue,En=W,Rn=En.tag;if((En.mode&1)===0&&(Rn===0||Rn===11||Rn===15)){var An=En.alternate;An?(En.updateQueue=An.updateQueue,En.memoizedState=An.memoizedState,En.lanes=An.lanes):(En.updateQueue=null,En.memoizedState=null)}var Hn=Tu(x);if(Hn!==null){Hn.flags&=-257,Eu(Hn,x,W,u,n),Hn.mode&1&&Au(u,Ye,n),n=Hn,ue=Ye;var Xn=n.updateQueue;if(Xn===null){var Yn=new Set;Yn.add(ue),n.updateQueue=Yn}else Xn.add(ue);break e}else{if((n&1)===0){Au(u,Ye,n),Il();break e}ue=Error(d(426))}}else if(bt&&W.mode&1){var St=Tu(x);if(St!==null){(St.flags&65536)===0&&(St.flags|=256),Eu(St,x,W,u,n),Ko(Ma(ue,W));break e}}u=ue=Ma(ue,W),Nt!==4&&(Nt=2),di===null?di=[u]:di.push(u),u=x;do{switch(u.tag){case 3:u.flags|=65536,n&=-n,u.lanes|=n;var Be=ku(u,ue,n);Ys(u,Be);break e;case 1:W=ue;var ke=u.type,je=u.stateNode;if((u.flags&128)===0&&(typeof ke.getDerivedStateFromError=="function"||je!==null&&typeof je.componentDidCatch=="function"&&(Wr===null||!Wr.has(je)))){u.flags|=65536,n&=-n,u.lanes|=n;var Cn=wu(u,W,n);Ys(u,Cn);break e}}u=u.return}while(u!==null)}rc(t)}catch(Qn){n=Qn,Ot===t&&t!==null&&(Ot=t=t.return);continue}break}while(!0)}function nc(){var e=Qi.current;return Qi.current=Ki,e===null?Ki:e}function Il(){(Nt===0||Nt===3||Nt===2)&&(Nt=4),Ut===null||(fa&268435455)===0&&(Zi&268435455)===0||Qr(Ut,Bt)}function ao(e,n){var t=ft;ft|=2;var r=nc();(Ut!==e||Bt!==n)&&(Ur=null,_a(e,n));do try{df();break}catch(l){ec(e,l)}while(!0);if(Xo(),ft=t,Qi.current=r,Ot!==null)throw Error(d(261));return Ut=null,Bt=0,Nt}function df(){for(;Ot!==null;)tc(Ot)}function ff(){for(;Ot!==null&&!Fn();)tc(Ot)}function tc(e){var n=oc(e.alternate,e,ir);e.memoizedProps=e.pendingProps,n===null?rc(e):Ot=n,Tl.current=null}function rc(e){var n=e;do{var t=n.alternate;if(e=n.return,(n.flags&32768)===0){if(t=rf(t,n,ir),t!==null){Ot=t;return}}else{if(t=af(t,n),t!==null){t.flags&=32767,Ot=t;return}if(e!==null)e.flags|=32768,e.subtreeFlags=0,e.deletions=null;else{Nt=6,Ot=null;return}}if(n=n.sibling,n!==null){Ot=n;return}Ot=n=e}while(n!==null);Nt===0&&(Nt=5)}function ha(e,n,t){var r=jn,l=cr.transition;try{cr.transition=null,jn=1,pf(e,n,t,r)}finally{cr.transition=l,jn=r}return null}function pf(e,n,t,r){do Da();while(Yr!==null);if((ft&6)!==0)throw Error(d(327));t=e.finishedWork;var l=e.finishedLanes;if(t===null)return null;if(e.finishedWork=null,e.finishedLanes=0,t===e.current)throw Error(d(177));e.callbackNode=null,e.callbackPriority=0;var u=t.lanes|t.childLanes;if(Gn(e,u),e===Ut&&(Ot=Ut=null,Bt=0),(t.subtreeFlags&2064)===0&&(t.flags&2064)===0||eo||(eo=!0,lc(pt,function(){return Da(),null})),u=(t.flags&15990)!==0,(t.subtreeFlags&15990)!==0||u){u=cr.transition,cr.transition=null;var x=jn;jn=1;var W=ft;ft|=4,Tl.current=null,lf(e,t),Xu(t,e),Cd(Io),aa=!!Mo,Io=Mo=null,e.current=t,sf(t),Jn(),ft=W,jn=x,cr.transition=u}else e.current=t;if(eo&&(eo=!1,Yr=e,no=l),u=e.pendingLanes,u===0&&(Wr=null),cn(t.stateNode),er(e,Vn()),n!==null)for(r=e.onRecoverableError,t=0;t<n.length;t++)l=n[t],r(l.value,{componentStack:l.stack,digest:l.digest});if(Ji)throw Ji=!1,e=Ll,Ll=null,e;return(no&1)!==0&&e.tag!==0&&Da(),u=e.pendingLanes,(u&1)!==0?e===Ol?fi++:(fi=0,Ol=e):fi=0,Hr(),null}function Da(){if(Yr!==null){var e=k(no),n=cr.transition,t=jn;try{if(cr.transition=null,jn=16>e?16:e,Yr===null)var r=!1;else{if(e=Yr,Yr=null,no=0,(ft&6)!==0)throw Error(d(331));var l=ft;for(ft|=4,qn=e.current;qn!==null;){var u=qn,x=u.child;if((qn.flags&16)!==0){var W=u.deletions;if(W!==null){for(var ue=0;ue<W.length;ue++){var Ye=W[ue];for(qn=Ye;qn!==null;){var En=qn;switch(En.tag){case 0:case 11:case 15:ui(8,En,u)}var Rn=En.child;if(Rn!==null)Rn.return=En,qn=Rn;else for(;qn!==null;){En=qn;var An=En.sibling,Hn=En.return;if(ju(En),En===Ye){qn=null;break}if(An!==null){An.return=Hn,qn=An;break}qn=Hn}}}var Xn=u.alternate;if(Xn!==null){var Yn=Xn.child;if(Yn!==null){Xn.child=null;do{var St=Yn.sibling;Yn.sibling=null,Yn=St}while(Yn!==null)}}qn=u}}if((u.subtreeFlags&2064)!==0&&x!==null)x.return=u,qn=x;else e:for(;qn!==null;){if(u=qn,(u.flags&2048)!==0)switch(u.tag){case 0:case 11:case 15:ui(9,u,u.return)}var Be=u.sibling;if(Be!==null){Be.return=u.return,qn=Be;break e}qn=u.return}}var ke=e.current;for(qn=ke;qn!==null;){x=qn;var je=x.child;if((x.subtreeFlags&2064)!==0&&je!==null)je.return=x,qn=je;else e:for(x=ke;qn!==null;){if(W=qn,(W.flags&2048)!==0)try{switch(W.tag){case 0:case 11:case 15:$i(9,W)}}catch(Qn){Tt(W,W.return,Qn)}if(W===x){qn=null;break e}var Cn=W.sibling;if(Cn!==null){Cn.return=W.return,qn=Cn;break e}qn=W.return}}if(ft=l,Hr(),le&&typeof le.onPostCommitFiberRoot=="function")try{le.onPostCommitFiberRoot(E,e)}catch{}r=!0}return r}finally{jn=t,cr.transition=n}}return!1}function ac(e,n,t){n=Ma(t,n),n=ku(e,n,1),e=qr(e,n,1),n=Wt(),e!==null&&(Sn(e,1,n),er(e,n))}function Tt(e,n,t){if(e.tag===3)ac(e,e,t);else for(;n!==null;){if(n.tag===3){ac(n,e,t);break}else if(n.tag===1){var r=n.stateNode;if(typeof n.type.getDerivedStateFromError=="function"||typeof r.componentDidCatch=="function"&&(Wr===null||!Wr.has(r))){e=Ma(t,e),e=wu(n,e,1),n=qr(n,e,1),e=Wt(),n!==null&&(Sn(n,1,e),er(n,e));break}}n=n.return}}function _f(e,n,t){var r=e.pingCache;r!==null&&r.delete(n),n=Wt(),e.pingedLanes|=e.suspendedLanes&t,Ut===e&&(Bt&t)===t&&(Nt===4||Nt===3&&(Bt&130023424)===Bt&&500>Vn()-Sl?_a(e,0):El|=t),er(e,n)}function ic(e,n){n===0&&((e.mode&1)===0?n=1:(n=xn,xn<<=1,(xn&130023424)===0&&(xn=4194304)));var t=Wt();e=Cr(e,n),e!==null&&(Sn(e,n,t),er(e,t))}function hf(e){var n=e.memoizedState,t=0;n!==null&&(t=n.retryLane),ic(e,t)}function mf(e,n){var t=0;switch(e.tag){case 13:var r=e.stateNode,l=e.memoizedState;l!==null&&(t=l.retryLane);break;case 19:r=e.stateNode;break;default:throw Error(d(314))}r!==null&&r.delete(n),ic(e,t)}var oc;oc=function(e,n,t){if(e!==null)if(e.memoizedProps!==n.pendingProps||$t.current)Zt=!0;else{if((e.lanes&t)===0&&(n.flags&128)===0)return Zt=!1,tf(e,n,t);Zt=(e.flags&131072)!==0}else Zt=!1,bt&&(n.flags&1048576)!==0&&Bs(n,Mi,n.index);switch(n.lanes=0,n.tag){case 2:var r=n.type;Wi(e,n),e=n.pendingProps;var l=Ta(n,jt.current);Na(n,t),l=al(null,n,r,e,l,t);var u=il();return n.flags|=1,typeof l=="object"&&l!==null&&typeof l.render=="function"&&l.$$typeof===void 0?(n.tag=1,n.memoizedState=null,n.updateQueue=null,Qt(r)?(u=!0,Ri(n)):u=!1,n.memoizedState=l.state!==null&&l.state!==void 0?l.state:null,Qo(n),l.updater=qi,n.stateNode=l,l._reactInternals=n,dl(n,r,e,t),n=hl(null,n,r,!0,u,t)):(n.tag=0,bt&&u&&Vo(n),Xt(null,n,l,t),n=n.child),n;case 16:r=n.elementType;e:{switch(Wi(e,n),e=n.pendingProps,l=r._init,r=l(r._payload),n.type=r,l=n.tag=yf(r),e=mr(r,e),l){case 0:n=_l(null,n,r,e,t);break e;case 1:n=Cu(null,n,r,e,t);break e;case 11:n=Su(null,n,r,e,t);break e;case 14:n=Lu(null,n,r,mr(r.type,e),t);break e}throw Error(d(306,r,""))}return n;case 0:return r=n.type,l=n.pendingProps,l=n.elementType===r?l:mr(r,l),_l(e,n,r,l,t);case 1:return r=n.type,l=n.pendingProps,l=n.elementType===r?l:mr(r,l),Cu(e,n,r,l,t);case 3:e:{if(Mu(n),e===null)throw Error(d(387));r=n.pendingProps,u=n.memoizedState,l=u.element,Ws(e,n),Bi(n,r,null,t);var x=n.memoizedState;if(r=x.element,u.isDehydrated)if(u={element:r,isDehydrated:!1,cache:x.cache,pendingSuspenseBoundaries:x.pendingSuspenseBoundaries,transitions:x.transitions},n.updateQueue.baseState=u,n.memoizedState=u,n.flags&256){l=Ma(Error(d(423)),n),n=Iu(e,n,r,t,l);break e}else if(r!==l){l=Ma(Error(d(424)),n),n=Iu(e,n,r,t,l);break e}else for(ar=Vr(n.stateNode.containerInfo.firstChild),rr=n,bt=!0,hr=null,t=qs(n,null,r,t),n.child=t;t;)t.flags=t.flags&-3|4096,t=t.sibling;else{if(La(),r===l){n=Ir(e,n,t);break e}Xt(e,n,r,t)}n=n.child}return n;case 5:return Qs(n),e===null&&Ho(n),r=n.type,l=n.pendingProps,u=e!==null?e.memoizedProps:null,x=l.children,Uo(r,l)?x=null:u!==null&&Uo(r,u)&&(n.flags|=32),Nu(e,n),Xt(e,n,x,t),n.child;case 6:return e===null&&Ho(n),null;case 13:return Uu(e,n,t);case 4:return Zo(n,n.stateNode.containerInfo),r=n.pendingProps,e===null?n.child=Oa(n,null,r,t):Xt(e,n,r,t),n.child;case 11:return r=n.type,l=n.pendingProps,l=n.elementType===r?l:mr(r,l),Su(e,n,r,l,t);case 7:return Xt(e,n,n.pendingProps,t),n.child;case 8:return Xt(e,n,n.pendingProps.children,t),n.child;case 12:return Xt(e,n,n.pendingProps.children,t),n.child;case 10:e:{if(r=n.type._context,l=n.pendingProps,u=n.memoizedProps,x=l.value,gt(Pi,r._currentValue),r._currentValue=x,u!==null)if(_r(u.value,x)){if(u.children===l.children&&!$t.current){n=Ir(e,n,t);break e}}else for(u=n.child,u!==null&&(u.return=n);u!==null;){var W=u.dependencies;if(W!==null){x=u.child;for(var ue=W.firstContext;ue!==null;){if(ue.context===r){if(u.tag===1){ue=Mr(-1,t&-t),ue.tag=2;var Ye=u.updateQueue;if(Ye!==null){Ye=Ye.shared;var En=Ye.pending;En===null?ue.next=ue:(ue.next=En.next,En.next=ue),Ye.pending=ue}}u.lanes|=t,ue=u.alternate,ue!==null&&(ue.lanes|=t),Yo(u.return,t,n),W.lanes|=t;break}ue=ue.next}}else if(u.tag===10)x=u.type===n.type?null:u.child;else if(u.tag===18){if(x=u.return,x===null)throw Error(d(341));x.lanes|=t,W=x.alternate,W!==null&&(W.lanes|=t),Yo(x,t,n),x=u.sibling}else x=u.child;if(x!==null)x.return=u;else for(x=u;x!==null;){if(x===n){x=null;break}if(u=x.sibling,u!==null){u.return=x.return,x=u;break}x=x.return}u=x}Xt(e,n,l.children,t),n=n.child}return n;case 9:return l=n.type,r=n.pendingProps.children,Na(n,t),l=sr(l),r=r(l),n.flags|=1,Xt(e,n,r,t),n.child;case 14:return r=n.type,l=mr(r,n.pendingProps),l=mr(r.type,l),Lu(e,n,r,l,t);case 15:return Ou(e,n,n.type,n.pendingProps,t);case 17:return r=n.type,l=n.pendingProps,l=n.elementType===r?l:mr(r,l),Wi(e,n),n.tag=1,Qt(r)?(e=!0,Ri(n)):e=!1,Na(n,t),xu(n,r,l),dl(n,r,l,t),hl(null,n,r,!0,e,t);case 19:return Du(e,n,t);case 22:return Ru(e,n,t)}throw Error(d(156,n.tag))};function lc(e,n){return $n(e,n)}function gf(e,n,t,r){this.tag=e,this.key=t,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.ref=null,this.pendingProps=n,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=r,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function dr(e,n,t,r){return new gf(e,n,t,r)}function Ul(e){return e=e.prototype,!(!e||!e.isReactComponent)}function yf(e){if(typeof e=="function")return Ul(e)?1:0;if(e!=null){if(e=e.$$typeof,e===tn)return 11;if(e===ae)return 14}return 2}function Zr(e,n){var t=e.alternate;return t===null?(t=dr(e.tag,n,e.key,e.mode),t.elementType=e.elementType,t.type=e.type,t.stateNode=e.stateNode,t.alternate=e,e.alternate=t):(t.pendingProps=n,t.type=e.type,t.flags=0,t.subtreeFlags=0,t.deletions=null),t.flags=e.flags&14680064,t.childLanes=e.childLanes,t.lanes=e.lanes,t.child=e.child,t.memoizedProps=e.memoizedProps,t.memoizedState=e.memoizedState,t.updateQueue=e.updateQueue,n=e.dependencies,t.dependencies=n===null?null:{lanes:n.lanes,firstContext:n.firstContext},t.sibling=e.sibling,t.index=e.index,t.ref=e.ref,t}function io(e,n,t,r,l,u){var x=2;if(r=e,typeof e=="function")Ul(e)&&(x=1);else if(typeof e=="string")x=5;else e:switch(e){case P:return ma(t.children,l,u,n);case re:x=8,l|=8;break;case be:return e=dr(12,t,n,l|2),e.elementType=be,e.lanes=u,e;case an:return e=dr(13,t,n,l),e.elementType=an,e.lanes=u,e;case sn:return e=dr(19,t,n,l),e.elementType=sn,e.lanes=u,e;case ze:return oo(t,l,u,n);default:if(typeof e=="object"&&e!==null)switch(e.$$typeof){case ge:x=10;break e;case Oe:x=9;break e;case tn:x=11;break e;case ae:x=14;break e;case oe:x=16,r=null;break e}throw Error(d(130,e==null?e:typeof e,""))}return n=dr(x,t,n,l),n.elementType=e,n.type=r,n.lanes=u,n}function ma(e,n,t,r){return e=dr(7,e,r,n),e.lanes=t,e}function oo(e,n,t,r){return e=dr(22,e,r,n),e.elementType=ze,e.lanes=t,e.stateNode={isHidden:!1},e}function Pl(e,n,t){return e=dr(6,e,null,n),e.lanes=t,e}function Dl(e,n,t){return n=dr(4,e.children!==null?e.children:[],e.key,n),n.lanes=t,n.stateNode={containerInfo:e.containerInfo,pendingChildren:null,implementation:e.implementation},n}function vf(e,n,t,r,l){this.tag=n,this.containerInfo=e,this.finishedWork=this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.pendingContext=this.context=null,this.callbackPriority=0,this.eventTimes=_e(0),this.expirationTimes=_e(-1),this.entangledLanes=this.finishedLanes=this.mutableReadLanes=this.expiredLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=_e(0),this.identifierPrefix=r,this.onRecoverableError=l,this.mutableSourceEagerHydrationData=null}function Gl(e,n,t,r,l,u,x,W,ue){return e=new vf(e,n,t,W,ue),n===1?(n=1,u===!0&&(n|=8)):n=0,u=dr(3,null,null,n),e.current=u,u.stateNode=e,u.memoizedState={element:r,isDehydrated:t,cache:null,transitions:null,pendingSuspenseBoundaries:null},Qo(u),e}function xf(e,n,t){var r=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:on,key:r==null?null:""+r,children:e,containerInfo:n,implementation:t}}function sc(e){if(!e)return zr;e=e._reactInternals;e:{if(Me(e)!==e||e.tag!==1)throw Error(d(170));var n=e;do{switch(n.tag){case 3:n=n.stateNode.context;break e;case 1:if(Qt(n.type)){n=n.stateNode.__reactInternalMemoizedMergedChildContext;break e}}n=n.return}while(n!==null);throw Error(d(171))}if(e.tag===1){var t=e.type;if(Qt(t))return Ps(e,t,n)}return n}function uc(e,n,t,r,l,u,x,W,ue){return e=Gl(t,r,!0,e,l,u,x,W,ue),e.context=sc(null),t=e.current,r=Wt(),l=$r(t),u=Mr(r,l),u.callback=n??null,qr(t,u,l),e.current.lanes=l,Sn(e,l,r),er(e,r),e}function lo(e,n,t,r){var l=n.current,u=Wt(),x=$r(l);return t=sc(t),n.context===null?n.context=t:n.pendingContext=t,n=Mr(u,x),n.payload={element:e},r=r===void 0?null:r,r!==null&&(n.callback=r),e=qr(l,n,x),e!==null&&(vr(e,l,x,u),Gi(e,l,x)),x}function so(e){if(e=e.current,!e.child)return null;switch(e.child.tag){case 5:return e.child.stateNode;default:return e.child.stateNode}}function cc(e,n){if(e=e.memoizedState,e!==null&&e.dehydrated!==null){var t=e.retryLane;e.retryLane=t!==0&&t<n?t:n}}function Bl(e,n){cc(e,n),(e=e.alternate)&&cc(e,n)}function bf(){return null}var dc=typeof reportError=="function"?reportError:function(e){console.error(e)};function Fl(e){this._internalRoot=e}uo.prototype.render=Fl.prototype.render=function(e){var n=this._internalRoot;if(n===null)throw Error(d(409));lo(e,n,null,null)},uo.prototype.unmount=Fl.prototype.unmount=function(){var e=this._internalRoot;if(e!==null){this._internalRoot=null;var n=e.containerInfo;pa(function(){lo(null,e,null,null)}),n[Lr]=null}};function uo(e){this._internalRoot=e}uo.prototype.unstable_scheduleHydration=function(e){if(e){var n=Wn();e={blockedOn:null,target:e,priority:n};for(var t=0;t<fr.length&&n!==0&&n<fr[t].priority;t++);fr.splice(t,0,e),t===0&&na(e)}};function Vl(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11)}function co(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11&&(e.nodeType!==8||e.nodeValue!==" react-mount-point-unstable "))}function fc(){}function kf(e,n,t,r,l){if(l){if(typeof r=="function"){var u=r;r=function(){var Ye=so(x);u.call(Ye)}}var x=uc(n,r,e,0,null,!1,!1,"",fc);return e._reactRootContainer=x,e[Lr]=x.current,$a(e.nodeType===8?e.parentNode:e),pa(),x}for(;l=e.lastChild;)e.removeChild(l);if(typeof r=="function"){var W=r;r=function(){var Ye=so(ue);W.call(Ye)}}var ue=Gl(e,0,!1,null,null,!1,!1,"",fc);return e._reactRootContainer=ue,e[Lr]=ue.current,$a(e.nodeType===8?e.parentNode:e),pa(function(){lo(n,ue,t,r)}),ue}function fo(e,n,t,r,l){var u=t._reactRootContainer;if(u){var x=u;if(typeof l=="function"){var W=l;l=function(){var ue=so(x);W.call(ue)}}lo(n,x,e,l)}else x=kf(t,n,e,l,r);return so(x)}j=function(e){switch(e.tag){case 3:var n=e.stateNode;if(n.current.memoizedState.isDehydrated){var t=Ln(n.pendingLanes);t!==0&&(zn(n,t|1),er(n,Vn()),(ft&6)===0&&(Pa=Vn()+500,Hr()))}break;case 13:pa(function(){var r=Cr(e,1);if(r!==null){var l=Wt();vr(r,e,1,l)}}),Bl(e,1)}},Ne=function(e){if(e.tag===13){var n=Cr(e,134217728);if(n!==null){var t=Wt();vr(n,e,134217728,t)}Bl(e,134217728)}},kn=function(e){if(e.tag===13){var n=$r(e),t=Cr(e,n);if(t!==null){var r=Wt();vr(t,e,n,r)}Bl(e,n)}},Wn=function(){return jn},st=function(e,n){var t=jn;try{return jn=e,n()}finally{jn=t}},Se=function(e,n,t){switch(n){case"input":if(ie(e,t),n=t.name,t.type==="radio"&&n!=null){for(t=e;t.parentNode;)t=t.parentNode;for(t=t.querySelectorAll("input[name="+JSON.stringify(""+n)+'][type="radio"]'),n=0;n<t.length;n++){var r=t[n];if(r!==e&&r.form===e.form){var l=Li(r);if(!l)throw Error(d(90));Te(r),ie(r,l)}}}break;case"textarea":Pe(e,t);break;case"select":n=t.value,n!=null&&He(e,!!t.multiple,n,!1)}},i=Cl,s=pa;var wf={usingClientEntryPoint:!1,Events:[Ja,wa,Li,Ve,vn,Cl]},pi={findFiberByHostInstance:ia,bundleType:0,version:"18.3.1",rendererPackageName:"react-dom"},Af={bundleType:pi.bundleType,version:pi.version,rendererPackageName:pi.rendererPackageName,rendererConfig:pi.rendererConfig,overrideHookState:null,overrideHookStateDeletePath:null,overrideHookStateRenamePath:null,overrideProps:null,overridePropsDeletePath:null,overridePropsRenamePath:null,setErrorHandler:null,setSuspenseHandler:null,scheduleUpdate:null,currentDispatcherRef:Ke.ReactCurrentDispatcher,findHostInstanceByFiber:function(e){return e=Pn(e),e===null?null:e.stateNode},findFiberByHostInstance:pi.findFiberByHostInstance||bf,findHostInstancesForRefresh:null,scheduleRefresh:null,scheduleRoot:null,setRefreshHandler:null,getCurrentFiber:null,reconcilerVersion:"18.3.1-next-f1338f8080-20240426"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"){var po=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!po.isDisabled&&po.supportsFiber)try{E=po.inject(Af),le=po}catch{}}return nr.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=wf,nr.createPortal=function(e,n){var t=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!Vl(n))throw Error(d(200));return xf(e,n,null,t)},nr.createRoot=function(e,n){if(!Vl(e))throw Error(d(299));var t=!1,r="",l=dc;return n!=null&&(n.unstable_strictMode===!0&&(t=!0),n.identifierPrefix!==void 0&&(r=n.identifierPrefix),n.onRecoverableError!==void 0&&(l=n.onRecoverableError)),n=Gl(e,1,!1,null,null,t,!1,r,l),e[Lr]=n.current,$a(e.nodeType===8?e.parentNode:e),new Fl(n)},nr.findDOMNode=function(e){if(e==null)return null;if(e.nodeType===1)return e;var n=e._reactInternals;if(n===void 0)throw typeof e.render=="function"?Error(d(188)):(e=Object.keys(e).join(","),Error(d(268,e)));return e=Pn(n),e=e===null?null:e.stateNode,e},nr.flushSync=function(e){return pa(e)},nr.hydrate=function(e,n,t){if(!co(n))throw Error(d(200));return fo(null,e,n,!0,t)},nr.hydrateRoot=function(e,n,t){if(!Vl(e))throw Error(d(405));var r=t!=null&&t.hydratedSources||null,l=!1,u="",x=dc;if(t!=null&&(t.unstable_strictMode===!0&&(l=!0),t.identifierPrefix!==void 0&&(u=t.identifierPrefix),t.onRecoverableError!==void 0&&(x=t.onRecoverableError)),n=uc(n,null,e,1,t??null,l,!1,u,x),e[Lr]=n.current,$a(e),r)for(e=0;e<r.length;e++)t=r[e],l=t._getVersion,l=l(t._source),n.mutableSourceEagerHydrationData==null?n.mutableSourceEagerHydrationData=[t,l]:n.mutableSourceEagerHydrationData.push(t,l);return new uo(n)},nr.render=function(e,n,t){if(!co(n))throw Error(d(200));return fo(null,e,n,!1,t)},nr.unmountComponentAtNode=function(e){if(!co(e))throw Error(d(40));return e._reactRootContainer?(pa(function(){fo(null,null,e,!1,function(){e._reactRootContainer=null,e[Lr]=null})}),!0):!1},nr.unstable_batchedUpdates=Cl,nr.unstable_renderSubtreeIntoContainer=function(e,n,t,r){if(!co(t))throw Error(d(200));if(e==null||e._reactInternals===void 0)throw Error(d(38));return fo(e,n,t,!1,r)},nr.version="18.3.1-next-f1338f8080-20240426",nr}var bc;function Uf(){if(bc)return Hl.exports;bc=1;function a(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(a)}catch(B){console.error(B)}}return a(),Hl.exports=If(),Hl.exports}var kc;function Pf(){if(kc)return _o;kc=1;var a=Uf();return _o.createRoot=a.createRoot,_o.hydrateRoot=a.hydrateRoot,_o}var Df=Pf();const Gf=Jl(Df);var Ga=es();const Tr=Jl(Ga),Bf="modulepreload",Ff=function(a){return"/arcade/rfdgamestudio/"+a},wc={},Pr=function(B,d,A){let v=Promise.resolve();if(d&&d.length>0){let R=function(S){return Promise.all(S.map(H=>Promise.resolve(H).then(b=>({status:"fulfilled",value:b}),b=>({status:"rejected",reason:b}))))};document.getElementsByTagName("link");const I=document.querySelector("meta[property=csp-nonce]"),z=(I==null?void 0:I.nonce)||(I==null?void 0:I.getAttribute("nonce"));v=R(d.map(S=>{if(S=Ff(S),S in wc)return;wc[S]=!0;const H=S.endsWith(".css"),b=H?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${S}"]${b}`))return;const F=document.createElement("link");if(F.rel=H?"stylesheet":Bf,H||(F.as="script"),F.crossOrigin="",F.href=S,z&&F.setAttribute("nonce",z),document.head.appendChild(F),H)return new Promise((Q,ce)=>{F.addEventListener("load",Q),F.addEventListener("error",()=>ce(new Error(`Unable to preload CSS for ${S}`)))})}))}function D(R){const I=new Event("vite:preloadError",{cancelable:!0});if(I.payload=R,window.dispatchEvent(I),!I.defaultPrevented)throw R}return v.then(R=>{for(const I of R||[])I.status==="rejected"&&D(I.reason);return B().catch(D)})},Vf={gameId:"horse_racing",label:"Derby Sim",description:"Race, breed, and bet on horses. Win/Place/Show betting, genetics system, career tracking.",color:"#f59e0b",status:"stable",component:Tr.lazy(()=>Pr(()=>import("./App-BOwfuWSn.js"),__vite__mapDeps([0,1,2,3,4,5,6])))},jf={gameId:"slither_rogue",label:"Snake Roguelike",description:"Slither.io meets roguelike. Steal segments, collect evolution cards, dominate the arena.",color:"#34d399",status:"beta",component:Tr.lazy(()=>Pr(()=>import("./App-D2te7jIs.js"),__vite__mapDeps([7,4,5,8,3,9,10,11,12,13,14,15])))},zf={gameId:"mutant_battle_ball",label:"Mutant Battle Ball",description:"Assemble mutants from parts. Field a 2v2 squad. Reach the end zone. Salvage the fallen.",color:"#f87171",status:"dev",component:Tr.lazy(()=>Pr(()=>import("./App-keQbBdau.js"),__vite__mapDeps([16,4,1,17,13,14,18])))},Hf={gameId:"slime_coin",label:"SlimeCoin",description:"Real-time coin pusher with shooter, two-layer board, and chip synergies",color:"#a855f7",status:"dev",component:Tr.lazy(()=>Pr(()=>import("./App-B1hvT4Yk.js"),__vite__mapDeps([19,4,1,13,17,14,20])))},Kf={gameId:"chimera_wilds",label:"Chimera Wilds",description:"Face a single randomly-assembled six-part enemy in a one-roll D20 encounter",color:"#14b8a6",status:"dev",component:Tr.lazy(()=>Pr(()=>import("./App-CXow-vKy.js"),__vite__mapDeps([21,4,1,17,22])))},qf={gameId:"scrapcrawl",label:"ScrapCrawl",description:"Room navigation, scrap economy, craft, and D20 combat with win-only proficiency.",color:"#f59e0b",status:"dev",component:Tr.lazy(()=>Pr(()=>import("./App-BY6ST3j9.js"),__vite__mapDeps([23,4,1,17,11,3,24,12,25,26])))},Xf={gameId:"voiddrift",label:"VoidRift",description:"A mining simulation at the edge of a black hole — drones mine autonomously, ore refines into components, and unexplained signal-bottles arrive for you to collect. No win condition. No escape.",color:"#6366f1",status:"external",externalUrl:"https://rdug627.itch.io/voidrift",embedUrl:"https://itch.io/embed-upload/17482080?color=333333",embedWidth:960,embedHeight:1300},Wf={gameId:"brewfield",label:"Brewfield",description:"A turn-based potions-brewing roguelike — Element × Component combinations, a living Residue field, Wa-Tor-inspired trophic chemistry.",color:"#84cc16",status:"stable",component:Tr.lazy(()=>Pr(()=>import("./App-IqF20-rn.js"),__vite__mapDeps([27,4,1,17,5,8,3,10,11,12,28,25])))},Yf={gameId:"ledger",label:"Ledger",description:"A Dutch-auction trading and appraisal simulator — compounding debt, a volatile resale market, and soft lockout consequences for missed payments.",color:"#06b6d4",status:"external",embedUrl:"/arcade/ledger/"},$f={gameId:"shoal",label:"Shoal",description:"A continuous steering-based reef ecosystem — fish graze, sharks hunt, and algae rises and sinks with the pressure of grazing.",color:"#3b82f6",status:"stable",component:Tr.lazy(()=>Pr(()=>import("./App-5TwLr-tw.js"),__vite__mapDeps([29,13,4,30])))},Qf={gameId:"trinity_siege",label:"Trinity Siege",description:"Three-faction siege combat — deploy units, breach walls, resolve encounters. LEAST-VERIFIED: prior sessions found fabricated combat logic and misattributed bugs; playable but not vouched for correctness.",color:"#ef4444",status:"external",embedUrl:"/arcade/trinity_siege/"},Zf={gameId:"slimebreeder",label:"SlimeBreeder",description:"A multi-tank slime breeding and genetics sandbox — pulls from the SlimeGarden core loop, reimagined as a standalone TypeScript demo.",color:"#ec4899",status:"external",embedUrl:"/arcade/slimebreeder/"},Jf={gameId:"corpworld",label:"CorpWorld",description:"A cold-corporate land-grab on a newly-discovered planet — Voronoi-tessellated territory, symmetric fog-of-war, deterministic Circle/Square/Triangle combat. v0.1.0R5: multi-action weekly orders (split a garrison across several deployments in one week) plus an independent Civic Directive per sector (production or defense focus). Real 4X mechanical foundation, still early on presentation.",color:"#f59e0b",status:"external",embedUrl:"/arcade/corpworld/"},ep={gameId:"slimegarden",label:"Slimegarden",description:"A multi-tank slime breeding and genetics sandbox — pulls from the SlimeGarden core loop, reimagined as a standalone TypeScript demo.",color:"#6c8ef7",status:"external",embedUrl:"/arcade/slimegarden/"},np={gameId:"slimeworld",label:"SlimeWorld",description:"Breed, dispatch, and conquer planet nodes with slime specimens. Color/shape/accent genetics, territory claims, garrison mechanics.",color:"#22c55e",status:"stable",component:Tr.lazy(()=>Pr(()=>import("./App--FK28qgl.js"),__vite__mapDeps([31,4,2,3,5,28,24,8,9,12,32])))},Ql=[Vf,jf,zf,Hf,Kf,qf,Xf,Wf,Yf,$f,Qf,Zf,Jf,ep,np];function Ac(a){return Ql.find(B=>B.gameId===a)}const tp=`-- brewfield/logic.lua — Phase A core loop port
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
`,rp=`-- chimera_wilds/logic.lua — Phase 1 minimal encounter loop
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
`,ap=`-- Horse Racing — Game-Specific Logic
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

`,ip=`-- Mutant Battle Ball — Match Simulation & Management
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
`,op=`-- scrapcrawl/logic.lua — Phase A core loop port
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
`,lp=`-- shoal/entities.lua — spawning, killing, lineage, and algae nodule helpers

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
`,sp=`-- shoal/logic.lua — main loop and render state

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
`,up=`-- shoal/state.lua — GAME_STATE shape and initialization helpers

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
`,cp=`-- shoal/steering.lua — force accumulation for fish and sharks

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
`,dp=`-- shoal/utils.lua — shared math helpers

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
`,fp=`-- logic.lua — SlimeCoin game logic
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
`,pp=`function clamp(value, minimum, maximum)
  if value < minimum then return minimum end
  if value > maximum then return maximum end
  return value
end

function circular_distance(hue_a, hue_b)
  local difference = math.abs(hue_a - hue_b) % 360
  return math.min(difference, 360 - difference)
end

function circular_hue_midpoint(hue_a, hue_b)
  local difference = ((hue_b - hue_a + 540) % 360) - 180
  return (hue_a + difference / 2 + 360) % 360
end

function snap_to_faction(hue)
  local anchors = {
    { color = "Red", value = 0 },
    { color = "Orange", value = 60 },
    { color = "Yellow", value = 120 },
    { color = "Green", value = 180 },
    { color = "Purple", value = 240 },
    { color = "Blue", value = 300 },
  }
  local closest = anchors[1].color
  local minimum_distance = 360
  for _, anchor in ipairs(anchors) do
    local distance = circular_distance(hue, anchor.value)
    if distance < minimum_distance then
      closest = anchor.color
      minimum_distance = distance
    end
  end
  return closest
end

function snap_to_shape_name(vertex_count, irregularity)
  local anchors = {
    { shape = "Triangle", vertex = 3, irregularity = 5 },
    { shape = "Square", vertex = 4, irregularity = 5 },
    { shape = "Circle", vertex = 12, irregularity = 0 },
    { shape = "Star", vertex = 5, irregularity = 60 },
    { shape = "Diamond", vertex = 4, irregularity = 40 },
    { shape = "Teardrop", vertex = 6, irregularity = 50 },
    { shape = "Pentagon", vertex = 5, irregularity = 10 },
    { shape = "Crescent", vertex = 7, irregularity = 70 },
    { shape = "Hexa", vertex = 6, irregularity = 15 },
    { shape = "Crown", vertex = 8, irregularity = 85 },
  }
  local closest = anchors[1].shape
  local minimum_distance = math.huge
  for _, anchor in ipairs(anchors) do
    local vertex_distance = vertex_count - anchor.vertex
    local irregularity_distance = irregularity - anchor.irregularity
    local distance = vertex_distance * vertex_distance + irregularity_distance * irregularity_distance
    if distance < minimum_distance then
      closest = anchor.shape
      minimum_distance = distance
    end
  end
  return closest
end

local COLOR_TIERS = { Red = 1, Yellow = 1, Blue = 1, Orange = 2, Green = 2, Purple = 2, Gray = 1 }
local SHAPE_TIERS = { Triangle = 1, Square = 1, Circle = 1, Star = 2, Diamond = 2, Teardrop = 2, Pentagon = 3, Crescent = 3, Hexa = 3, Crown = 4 }
local TIER_VALUE = { [1] = 5, [2] = 22, [3] = 95, [4] = 300 }

function get_color_tier(color_name)
  return COLOR_TIERS[color_name] or 1
end

function get_shape_tier(shape_name)
  return SHAPE_TIERS[shape_name] or 1
end

function calculate_tier_value(color_name, shape_name, variance)
  variance = variance or 0
  local color_value = TIER_VALUE[get_color_tier(color_name)] or 5
  local shape_value = TIER_VALUE[get_shape_tier(shape_name)] or 5
  return math.max(1, math.floor((color_value + shape_value) * (1 + variance) + 0.5))
end

function find_color_target(color_targets, target_id)
  if color_targets == nil or target_id == nil then return nil end
  for _, target in ipairs(color_targets) do
    if target.id == target_id then return target end
  end
  return nil
end

function find_shape_target(shape_targets, target_id)
  if shape_targets == nil or target_id == nil then return nil end
  for _, target in ipairs(shape_targets) do
    if target.id == target_id then return target end
  end
  return nil
end

function breed_shape(parent_a, parent_b, shape_targets, active_shape_target)
  local vertex_a = parent_a.vertex_count or 4
  local vertex_b = parent_b.vertex_count or 4
  local irregularity_a = parent_a.irregularity or 10
  local irregularity_b = parent_b.irregularity or 10
  local offspring_vertex = (vertex_a + vertex_b) / 2
  local normalized_distance = math.abs(vertex_a - vertex_b) / 19
  local average_irregularity = (irregularity_a + irregularity_b) / 2
  local spiked_irregularity = clamp(average_irregularity + normalized_distance * 0.5 * 100, 0, 100)
  local final_vertex = offspring_vertex
  local final_irregularity = spiked_irregularity
  local target = find_shape_target(shape_targets, active_shape_target)
  if target ~= nil then
    final_vertex = offspring_vertex + (target.vertex_count - offspring_vertex) * 0.6
    local target_irregularity_midpoint = ((target.irregularity_min or 0) + target.irregularity_max) / 2
    final_irregularity = clamp(spiked_irregularity + (target_irregularity_midpoint - spiked_irregularity) * 0.6, 0, 100)
  end
  return { vertex_count = final_vertex, irregularity = final_irregularity }
end

function find_accent_type(accent_targets, diffusion_ratio)
  for _, target in ipairs(accent_targets or {}) do
    if target.id ~= "accent_metallic" and target.diffusion_min ~= nil and diffusion_ratio >= target.diffusion_min and diffusion_ratio <= target.diffusion_max then
      return target
    end
  end
  return nil
end

function find_accent_intensity(accent_targets, amplitude)
  for _, target in ipairs(accent_targets or {}) do
    if target.id ~= "accent_metallic" and target.amplitude_min ~= nil and amplitude >= target.amplitude_min and amplitude <= target.amplitude_max then
      return target
    end
  end
  return nil
end

function find_metallic_accent(accent_targets, diffusion_ratio, amplitude)
  for _, target in ipairs(accent_targets or {}) do
    if target.id == "accent_metallic" and diffusion_ratio >= target.diffusion_min and diffusion_ratio <= target.diffusion_max and amplitude >= target.amplitude_min and amplitude <= target.amplitude_max then
      return target
    end
  end
  return nil
end

function breed_accent(parent_a, parent_b, offspring_vertex_count, offspring_irregularity, offspring_hue)
  local diffusion_a = parent_a.diffusion_ratio or 20
  local diffusion_b = parent_b.diffusion_ratio or 20
  local amplitude_a = parent_a.amplitude or 40
  local amplitude_b = parent_b.amplitude or 40
  local offspring_diffusion = (diffusion_a + diffusion_b) / 2
  local offspring_amplitude = (amplitude_a + amplitude_b) / 2
  local shape_complexity = ((offspring_vertex_count - 3) / 19) * 0.5 + (offspring_irregularity / 100) * 0.5
  offspring_diffusion = clamp(offspring_diffusion + (shape_complexity * 100 - offspring_diffusion) * 0.3, 0, 100)
  local diffusion_distance = math.abs(diffusion_a - diffusion_b) / 100
  offspring_amplitude = clamp(offspring_amplitude - diffusion_distance * 0.4 * 100, 0, 100)
  local accent_hue = (offspring_hue + 180 * (offspring_amplitude / 100)) % 360
  return { diffusion_ratio = offspring_diffusion, amplitude = offspring_amplitude, accent_hue = accent_hue }
end

function breed_slimes(parent_a, parent_b, generation, same_pair_streak, color_targets, active_target_regent)
  local hue_a = parent_a.hue or 0
  local hue_b = parent_b.hue or 0
  local saturation_a = parent_a.saturation
  local saturation_b = parent_b.saturation
  if saturation_a == nil then saturation_a = parent_a.color == "Gray" and 0 or 100 end
  if saturation_b == nil then saturation_b = parent_b.color == "Gray" and 0 or 100 end
  same_pair_streak = same_pair_streak or 0

  local offspring_hue = circular_hue_midpoint(hue_a, hue_b)
  local normalized_distance = circular_distance(hue_a, hue_b) / 180
  local repetition_penalty = math.max(0.15, 1 - same_pair_streak * 0.12)
  local effective_k = 0.12 * repetition_penalty
  local average_saturation = (saturation_a + saturation_b) / 2
  local offspring_saturation = clamp(average_saturation * (1 - effective_k * normalized_distance), 0, 100)
  local final_hue = offspring_hue
  local final_saturation = offspring_saturation

  local target = find_color_target(color_targets, active_target_regent)
  if target ~= nil then
    local closest_center = target.center_hues[1]
    local minimum_distance = 360
    for _, center in ipairs(target.center_hues) do
      local distance = circular_distance(offspring_hue, center)
      if distance < minimum_distance then
        closest_center = center
        minimum_distance = distance
      end
    end
    local difference = ((closest_center - offspring_hue + 540) % 360) - 180
    final_hue = (offspring_hue + difference * 0.6 + 360) % 360
    local target_saturation_midpoint = (target.saturation_min + target.saturation_max) / 2
    final_saturation = clamp(offspring_saturation + (target_saturation_midpoint - offspring_saturation) * 0.6, 0, 100)
  end

  local color = final_saturation < 15 and "Gray" or snap_to_faction(final_hue)
  return {
    id = "slime_offspring",
    color = color,
    hue = final_hue,
    saturation = final_saturation,
    color_saturation = final_saturation,
    pattern = parent_a.pattern,
    level = 1,
    xp = 0,
    generation = generation,
    role = "idle",
    parent_a = parent_a.id,
    parent_b = parent_b.id,
  }
end

function find_by_id(items, id)
  for _, item in ipairs(items or {}) do
    if item.id == id then return item end
  end
  return nil
end

function select_slimes(slimes, slime_ids)
  local selected = {}
  local wanted = {}
  for _, id in ipairs(slime_ids or {}) do wanted[id] = true end
  for _, slime in ipairs(slimes or {}) do
    if wanted[slime.id] then table.insert(selected, slime) end
  end
  return selected
end

function dominant_color(party)
  local counts = {}
  local highest_count = 0
  local result = party[1] and party[1].color or "Gray"
  for _, slime in ipairs(party or {}) do
    counts[slime.color] = (counts[slime.color] or 0) + 1
    if counts[slime.color] > highest_count then
      highest_count = counts[slime.color]
      result = slime.color
    end
  end
  return result
end

function claim_success_chance(power, target_power)
  local chance = power / target_power
  if chance > 1 then
    chance = 0.85 + (chance - 1) * 0.1
  else
    chance = 0.2 + chance * 0.6
  end
  return clamp(chance, 0.15, 0.98)
end

function claim_grudge_color(node, excluded_color)
  if node.owner_color ~= nil and node.owner_color ~= "Gray" then return node.owner_color end
  local result = nil
  local maximum_pressure = -1
  for color, value in pairs(node.pressure or {}) do
    if color ~= "Gray" and color ~= excluded_color and value > maximum_pressure then
      result = color
      maximum_pressure = value
    end
  end
  return result
end

function copy_pressure(pressure)
  local copied = {}
  for color, value in pairs(pressure or {}) do copied[color] = value end
  return copied
end

function resolve_force_claim(node, party, is_discovered, roll)
  if #party == 0 then return { success = false, updated_node = node } end
  local force = 0
  for _, slime in ipairs(party) do
    force = force + slime.level * 10 + slime.stats.atk + slime.stats.def
  end
  local strength = is_discovered and node.strength or 0.8
  local chance = claim_success_chance(force, 50 + math.floor(strength * 100 + 0.5))
  roll = roll or math.random()
  if roll > chance then return { success = false, updated_node = node, chance = chance } end
  local pressure = copy_pressure(node.pressure)
  local grudge = claim_grudge_color(node, dominant_color(party))
  if grudge ~= nil then pressure[grudge] = 85 end
  return { success = true, chance = chance, updated_node = { id = node.id, name = node.name, owner_color = "Gray", strength = 0.4, pressure = pressure, discovered = true } }
end

function resolve_bribe_claim(node, credits_spent, is_discovered, roll)
  local strength = is_discovered and node.strength or 0.8
  local target_power = 50 + math.floor(strength * 100 + 0.5)
  local chance = claim_success_chance(credits_spent, math.floor(target_power * 2 + 0.5))
  roll = roll or math.random()
  if roll > chance then return { success = false, updated_node = node, chance = chance } end
  local pressure = copy_pressure(node.pressure)
  local grudge = claim_grudge_color(node, nil)
  if grudge ~= nil then pressure[grudge] = 45 end
  return { success = true, chance = chance, updated_node = { id = node.id, name = node.name, owner_color = "Gray", strength = 0.5, pressure = pressure, discovered = true } }
end

function resolve_convert_claim(node, party, culture_relationship, is_discovered, roll)
  if #party == 0 then return { success = false, updated_node = node } end
  culture_relationship = culture_relationship or 50
  local charm = 0
  for _, slime in ipairs(party) do charm = charm + slime.stats.chm end
  local adjusted_charm = math.floor(charm * (1 + (culture_relationship - 50) / 100) + 0.5)
  local strength = is_discovered and node.strength or 0.8
  local chance = claim_success_chance(adjusted_charm, 40 + math.floor(strength * 80 + 0.5))
  roll = roll or math.random()
  if roll > chance then return { success = false, updated_node = node, chance = chance } end
  local pressure = copy_pressure(node.pressure)
  local grudge = claim_grudge_color(node, dominant_color(party))
  if grudge ~= nil then pressure[grudge] = 5 end
  return { success = true, chance = chance, updated_node = { id = node.id, name = node.name, owner_color = "Gray", strength = 0.6, pressure = pressure, discovered = true } }
end

function initiate_breeding(state, parent_a_id, parent_b_id, same_pair_streak, color_targets, active_target_regent, shape_targets, active_shape_target)
  if parent_a_id == parent_b_id then return nil, "Parents must differ" end
  if #(state.slimes or {}) >= state.roster_cap then return nil, "Roster capacity reached" end
  local parent_a = find_by_id(state.slimes, parent_a_id)
  local parent_b = find_by_id(state.slimes, parent_b_id)
  if parent_a == nil or parent_b == nil then return nil, "Parent not found" end
  local generation = math.max(parent_a.generation or 0, parent_b.generation or 0) + 1
  local child = breed_slimes(parent_a, parent_b, generation, same_pair_streak, color_targets, active_target_regent)
  local shape = breed_shape(parent_a, parent_b, shape_targets, active_shape_target)
  child.vertex_count = shape.vertex_count
  child.irregularity = shape.irregularity
  local accent = breed_accent(parent_a, parent_b, child.vertex_count, child.irregularity, child.hue)
  child.diffusion_ratio = accent.diffusion_ratio
  child.amplitude = accent.amplitude
  child.accent_hue = accent.accent_hue
  table.insert(state.slimes, child)
  for index, slime in ipairs(state.slimes) do
    if slime.id == parent_b_id then
      table.remove(state.slimes, index)
      break
    end
  end
  child.consumed_slime_id = parent_b_id
  state.credits = math.max(0, (state.credits or 0) - 10)
  return child, nil
end

function force_claim_action(state, node_id, slime_ids, roll)
  local node = find_by_id(state.planet_region and state.planet_region.nodes, node_id)
  if node == nil then return nil, "Node not found" end
  local result = resolve_force_claim(node, select_slimes(state.slimes, slime_ids), node.discovered, roll)
  if result.success then
    for index, current in ipairs(state.planet_region.nodes) do
      if current.id == node_id then state.planet_region.nodes[index] = result.updated_node end
    end
  end
  return result, nil
end

function bribe_claim_action(state, node_id, credits_spent, roll)
  local node = find_by_id(state.planet_region and state.planet_region.nodes, node_id)
  if node == nil or (state.credits or 0) < credits_spent then return nil, "Claim unavailable" end
  local result = resolve_bribe_claim(node, credits_spent, node.discovered, roll)
  state.credits = state.credits - credits_spent
  if result.success then
    for index, current in ipairs(state.planet_region.nodes) do
      if current.id == node_id then state.planet_region.nodes[index] = result.updated_node end
    end
  end
  return result, nil
end

function convert_target_color(node)
  if node.owner_color ~= nil then return node.owner_color end
  local target_color = "Gray"
  local maximum_pressure = -1
  for color, pressure in pairs(node.pressure or {}) do
    if pressure > maximum_pressure then
      target_color = color
      maximum_pressure = pressure
    end
  end
  return target_color
end

function convert_claim_action(state, node_id, slime_ids, culture_relationship, roll)
  local node = find_by_id(state.planet_region and state.planet_region.nodes, node_id)
  if node == nil then return nil, "Node not found" end
  if culture_relationship == nil then
    local relationships = state.culture_relationships or {}
    culture_relationship = relationships[convert_target_color(node)] or 50
  end
  local result = resolve_convert_claim(node, select_slimes(state.slimes, slime_ids), culture_relationship, node.discovered, roll)
  if result.success then
    for index, current in ipairs(state.planet_region.nodes) do
      if current.id == node_id then state.planet_region.nodes[index] = result.updated_node end
    end
  end
  return result, nil
end

function launch_dispatch(state, zone_id, slime_ids)
  state.active_dispatch = { id = "dispatch", zone_id = zone_id, slime_ids = slime_ids, cycles_remaining = 1, status = "active" }
  return state.active_dispatch
end

function retrieve_completed_dispatch(state)
  local dispatch = state.active_dispatch
  if dispatch == nil or dispatch.status ~= "completed" then return nil, "No completed dispatch" end
  state.active_dispatch = nil
  return dispatch, nil
end

function launch_exploration(state, node_id, slime_ids)
  state.active_exploration = { id = "exploration", target_node_id = node_id, slime_ids = slime_ids, cycles_remaining = 1, status = "active" }
  return state.active_exploration
end

function launch_mediation(state, node_id, slime_ids)
  state.active_mediation = { id = "mediation", target_node_id = node_id, slime_ids = slime_ids, cycles_remaining = 1, status = "active" }
  return state.active_mediation
end

function assign_garrison(state, node_id, slime_id)
  local node = find_by_id(state.planet_region and state.planet_region.nodes, node_id)
  local slime = find_by_id(state.slimes, slime_id)
  if node == nil or slime == nil or node.owner_color == nil then return nil, "Garrison unavailable" end
  node.garrison_slime_id = slime_id
  slime.locked_role = "garrison"
  slime.garrisoned_at = node_id
  return node, nil
end

function recall_garrison(state, slime_id)
  local slime = find_by_id(state.slimes, slime_id)
  if slime == nil or slime.locked_role ~= "garrison" then return nil, "Slime is not garrisoned" end
  local node = find_by_id(state.planet_region and state.planet_region.nodes, slime.garrisoned_at)
  if node ~= nil then node.garrison_slime_id = nil end
  slime.locked_role = nil
  slime.garrisoned_at = nil
  return slime, nil
end

function deliver_contract(state, contract_id, slime_id)
  local contract = find_by_id(state.contracts, contract_id)
  local slime = find_by_id(state.slimes, slime_id)
  if contract == nil or slime == nil then return nil, "Contract or slime not found" end
  state.credits = (state.credits or 0) + contract.credits_reward
  for index, current in ipairs(state.contracts) do if current.id == contract_id then table.remove(state.contracts, index) break end end
  for index, current in ipairs(state.slimes) do if current.id == slime_id then table.remove(state.slimes, index) break end end
  return contract.credits_reward, nil
end

function sell_on_market(state, slime_id, price)
  local slime = find_by_id(state.slimes, slime_id)
  if slime == nil then return nil, "Slime not found" end
  state.credits = (state.credits or 0) + price
  state.recent_market_sales = state.recent_market_sales or {}
  table.insert(state.recent_market_sales, { color = slime.color, cycle = state.cycle })
  for index, current in ipairs(state.slimes) do if current.id == slime_id then table.remove(state.slimes, index) break end end
  return price, nil
end

function buy_upgrade(state, upgrade_type)
  local costs = { capacity = 150, stabilizer = 200, autofeeder = 250 }
  local cost = costs[upgrade_type]
  if cost == nil or (state.credits or 0) < cost then return false end
  if upgrade_type == "autofeeder" and state.has_auto_feeder then return false end
  state.credits = state.credits - cost
  if upgrade_type == "capacity" then state.roster_cap = state.roster_cap + 5 end
  if upgrade_type == "stabilizer" then state.breeding_success_rate_modifier = (state.breeding_success_rate_modifier or 0) + 0.1 end
  if upgrade_type == "autofeeder" then state.has_auto_feeder = true end
  return true
end

function toggle_worker_role(state, slime_id)
  local slime = find_by_id(state.slimes, slime_id)
  if slime == nil then return false end
  if slime.locked_role == "worker" then
    slime.locked_role = nil
  elseif slime.locked_role == nil then
    slime.locked_role = "worker"
  else
    return false
  end
  return true
end

function recycle_slime(state, slime_id)
  if #(state.slimes or {}) <= 1 then return nil, "Cannot recycle final slime" end
  for index, slime in ipairs(state.slimes or {}) do
    if slime.id == slime_id then
      table.remove(state.slimes, index)
      state.credits = (state.credits or 0) + 15
      return 15, nil
    end
  end
  return nil, "Slime not found"
end

function rename_slime(state, slime_id, new_name)
  if new_name == nil then return nil, "Name required" end
  local trimmed_name = string.match(new_name, "^%s*(.-)%s*$")
  if trimmed_name == "" then return nil, "Name required" end
  local slime = find_by_id(state.slimes, slime_id)
  if slime == nil then return nil, "Slime not found" end
  slime.name = trimmed_name
  return slime, nil
end

function is_slime_in_matching_culture_environment(slime, nodes)
  for _, node in ipairs(nodes or {}) do
    if node.owner_color == slime.color then return true end
  end
  return false
end

function calculate_worker_income(slime, has_auto_feeder, nodes)
  local income = 5
  if has_auto_feeder then income = income * 2 end
  if is_slime_in_matching_culture_environment(slime, nodes) then income = income * 2 end
  return income
end

function is_capitol_hardened(node, nodes)
  if not node.is_capitol or node.owner_color == nil then return false end
  for _, neighbor_id in ipairs(node.neighbors or {}) do
    local neighbor = find_by_id(nodes, neighbor_id)
    if neighbor == nil or neighbor.owner_color ~= node.owner_color then return false end
  end
  return true
end

function has_secure_capitol_garrison(state, node)
  if not node.is_capitol or node.owner_color == nil or node.strength < 1 then return false end
  for color, pressure in pairs(node.pressure or {}) do
    if color ~= node.owner_color and pressure > 0 then return false end
  end
  for _, slime in ipairs(state.slimes or {}) do
    if slime.locked_role == "garrison" and slime.garrisoned_at == node.id then return true end
  end
  return false
end

local CONTRACT_FLAVORS = {
  "Requesting high-density organic insulation cores. Do not ask for details regarding the thermal payload.",
  "Specimen requested to act as immediate chemical neutralizer in standard waste tanks.",
  "Urgent laboratory trial requirement for sub-cellular membrane shearing. Specimen will be disassembled.",
  "Corporate compliance requires bio-mass buffer reserves to meet annual asteroid operations quotas.",
  "Requested specimen matches target criteria for experimental neuro-network mapping. Energy discharge expected.",
  "A private investor demands a specimen of pristine coloration to decorate their terminal reservoir.",
  "Sub-orbital testing requires low-gravity biological payloads. High probability of orbital separation.",
}

local ASTRONAUT_THOUGHTS = {
  "LOG: Day 312. I watched the black hole devour a communication node today. The static lasted three minutes. Standard corporate response received immediately after: \\"Keep breeding.\\"",
  "LOG: Day 445. The slimes are the only warm things on this rock. They hum when I rest my hand on the glass. I wonder if they know we are both just debris.",
  "LOG: Day 519. The Corporation paid my monthly credits, but there is nothing to buy here except nutrient pellets and gene splicing regulators. They are literally paying me to feed their food.",
  "LOG: Day 608. One of the slimes was looking at the star charts today. Or maybe it was just reacting to the screen flicker. I choose to believe it wanted to see Earth.",
  "LOG: Day 722. It is quiet. So quiet that I can hear the refrigeration unit on the containment cells clicking. Cycle after cycle. We make slimes, we send them to the dark, and we repeat.",
  "LOG: Day 803. I called the corporate hotline. The automated voice informed me that my soul was a valuable regional asset. Then it played elevator music for three hours.",
}

function generate_contract(cycle)
  local colors = { "Red", "Blue", "Yellow", "Purple", "Orange", "Green" }
  local patterns = { "Solid", "Stripe", "Polka", "Glow", "Crown", "Ringed" }
  local color = colors[math.random(#colors)]
  local pattern = patterns[math.random(#patterns)]
  local reward_multiplier = 1
  if color == "Purple" or color == "Orange" or color == "Green" then reward_multiplier = reward_multiplier + 0.5 end
  if pattern ~= "Solid" then reward_multiplier = reward_multiplier + 0.5 end
  if pattern == "Glow" or pattern == "Crown" or pattern == "Ringed" then reward_multiplier = reward_multiplier + 0.8 end
  local base_credits = 100
  local credits_reward = math.floor(base_credits * reward_multiplier + math.random() * 30)
  local total_cycles = math.random(5, 8)
  local title_code = "RQ-" .. math.random(1000, 8999)
  return {
    id = "contract_" .. os.time() .. "_" .. math.random(100),
    title = "CONTRACT " .. title_code,
    required_color = color,
    required_pattern = pattern,
    credits_reward = credits_reward,
    cycles_remaining = total_cycles,
    total_cycles = total_cycles,
    flavor_text = CONTRACT_FLAVORS[math.random(#CONTRACT_FLAVORS)],
  }
end

local WANDERER_REQUEST_MAX = 3
local WANDERER_PREMIUM_MULTI = 3.0

function create_wanderer_petition(cycle, active_petitions)
  if #(active_petitions or {}) >= WANDERER_REQUEST_MAX then return nil, "Wanderer petition capacity reached" end
  local colors = { "Red", "Blue", "Yellow", "Purple", "Orange", "Green", "Gray" }
  local shapes = { "Triangle", "Square", "Circle", "Star", "Diamond", "Teardrop", "Pentagon", "Crescent", "Hexa", "Crown" }
  local require_color = math.random() > 0.3
  local require_shape = math.random() > 0.3
  local has_color = require_color or not require_shape
  local has_shape = require_shape or not require_color
  local target_color = has_color and colors[math.random(#colors)] or nil
  local target_shape = has_shape and shapes[math.random(#shapes)] or nil
  local color_tier = target_color and get_color_tier(target_color) or 1.5
  local shape_tier = target_shape and get_shape_tier(target_shape) or 1.5
  local reward = math.floor(color_tier * shape_tier * 10 * WANDERER_PREMIUM_MULTI)
  local total_cycles = math.random(5, 8)
  return {
    id = "petition_wanderer_" .. os.time() .. "_" .. math.random(1000),
    source = "wanderer",
    requested_color = target_color,
    requested_shape = target_shape,
    payout_multiplier = WANDERER_PREMIUM_MULTI,
    reward = reward,
    expires_cycle = cycle + total_cycles,
  }, nil
end

function fulfill_petition(state, petition_id, slime_id)
  local petition = find_by_id(state.petitions, petition_id)
  local slime = find_by_id(state.slimes, slime_id)
  if petition == nil or slime == nil then return nil, "Petition or slime not found" end
  if (state.cycle or 0) > petition.expires_cycle then return nil, "Petition expired" end
  if petition.requested_color ~= nil and slime.color ~= petition.requested_color then return nil, "Slime does not match petition color" end
  if petition.requested_shape ~= nil and snap_to_shape_name(slime.vertex_count or 4, slime.irregularity or 10) ~= petition.requested_shape then return nil, "Slime does not match petition shape" end
  local payout = petition.reward or math.floor(100 * petition.payout_multiplier)
  state.credits = (state.credits or 0) + payout
  for index, current in ipairs(state.petitions) do
    if current.id == petition_id then
      table.remove(state.petitions, index)
      break
    end
  end
  return { payout = payout, fulfilled_slime_id = slime_id }, nil
end

function get_random_melancholic_log(cycle)
  return {
    id = "log_mel_" .. os.time(),
    cycle = cycle,
    text = ASTRONAUT_THOUGHTS[math.random(#ASTRONAUT_THOUGHTS)],
    type = "melancholy",
  }
end

local SLIME_NAME_PREFIXES = {
  "Specimen", "Subject", "Orbital", "Cinder", "Dusty", "Rusty", "Void",
  "Gloop", "Solder", "Glitch", "Slick", "Vapor", "Anode", "Cathode",
  "Zero", "Ion", "Debris", "Vector", "Echo", "Drift"
}
local SLIME_NAME_SUFFIXES = {
  "A-01", "B-12", "X", "Beta", "Omega", "Prime", "Zero", "09", "402",
  "77", "Core", "V", "Dampener", "Isotope", "Sol", "Flux", "Drifter", "Echo"
}

function generate_slime_name()
  local p = SLIME_NAME_PREFIXES[math.random(#SLIME_NAME_PREFIXES)]
  local s = SLIME_NAME_SUFFIXES[math.random(#SLIME_NAME_SUFFIXES)]
  return p .. "-" .. s
end

local HUE_MAP = { Red = 0, Orange = 60, Yellow = 120, Green = 180, Purple = 240, Blue = 300, Gray = 0 }

function create_seed_slime(color, pattern)
  color = color or "Red"
  pattern = pattern or "Solid"
  local hue = HUE_MAP[color] or 0
  local saturation = color == "Gray" and 0 or 100
  return {
    id = "slime_" .. os.time() .. "_" .. math.random(1000),
    name = generate_slime_name(),
    color = color,
    pattern = pattern,
    level = 1,
    xp = 0,
    stats = { hp = 100, atk = 10, def = 10, agi = 10, int = 10, chm = 10 },
    role = "idle",
    generation = 0,
    hue = hue,
    saturation = saturation,
    color_saturation = saturation,
    locked_role = nil,
  }
end

local BASE_REVOLT_FACTOR = 0.002
local GARRISON_RISK_REDUCTION_MULTIPLIER = 0.5

function update_planet_supply_and_pressure(nodes)
  if nodes == nil then return {}, {} end
  local logs = {}

  -- 1. Accumulate pressure
  local pressure_changes = {}
  for _, node in ipairs(nodes) do
    if node.owner_color and node.is_supplied then
      local pressure_amount = math.floor(5 + (node.strength or 0) * 10)
      for _, neighbor_id in ipairs(node.neighbors or {}) do
        local neighbor = find_by_id(nodes, neighbor_id)
        if neighbor and neighbor.owner_color ~= node.owner_color then
          if pressure_changes[neighbor_id] == nil then pressure_changes[neighbor_id] = {} end
          local current = pressure_changes[neighbor_id][node.owner_color] or 0
          pressure_changes[neighbor_id][node.owner_color] = current + pressure_amount
        end
      end
    end
  end

  -- Apply pressure changes & decay
  for _, node in ipairs(nodes) do
    local deltas = pressure_changes[node.id]
    if deltas then
      for color, amount in pairs(deltas) do
        node.pressure = node.pressure or {}
        node.pressure[color] = (node.pressure[color] or 0) + amount
      end
    end
    if node.pressure then
      for color, val in pairs(node.pressure) do
        if val > 0 then node.pressure[color] = math.max(0, val - 2) end
      end
    end
  end

  -- 2. Check for ownership flips and revolts
  local threshold = 100
  for _, node in ipairs(nodes) do
    local highest_foreign_color = nil
    local highest_foreign_pressure = 0
    if node.pressure then
      for color, val in pairs(node.pressure) do
        if color ~= node.owner_color and val > highest_foreign_pressure then
          highest_foreign_pressure = val
          highest_foreign_color = color
        end
      end
    end
    local defense = node.owner_color and math.floor((node.strength or 0) * 100) or 0
    if highest_foreign_pressure >= threshold and highest_foreign_pressure > defense then
      local old_owner = node.owner_color or "Unclaimed"
      table.insert(logs, "TERRITORY FLIP: Node [" .. (node.name or node.id) .. "] has collapsed under external pressure. Control transferred from " .. old_owner .. " to " .. (highest_foreign_color or "?") .. ".")
      node.owner_color = highest_foreign_color
      node.strength = 0.3
      node.pressure = {}
      node.is_capitol = false
      node.garrison_slime_id = nil
    else
      -- Revolt risk
      if node.owner_color then
        local is_garrisoned = node.garrison_slime_id ~= nil
        local total_foreign_pressure = 0
        if node.pressure then
          for color, val in pairs(node.pressure) do
            if color ~= node.owner_color then total_foreign_pressure = total_foreign_pressure + val end
          end
        end
        if total_foreign_pressure > 0 then
          local base_revolt_prob = total_foreign_pressure * BASE_REVOLT_FACTOR
          local final_revolt_prob = is_garrisoned and base_revolt_prob * GARRISON_RISK_REDUCTION_MULTIPLIER or base_revolt_prob
          local capped_revolt_prob = math.min(0.9, final_revolt_prob)
          if math.random() < capped_revolt_prob then
            table.insert(logs, "REVOLT: Node [" .. (node.name or node.id) .. "] has revolted due to unmitigated cultural pressure! Control reverted to Unclaimed.")
            node.owner_color = nil
            node.strength = 0
            node.pressure = {}
            node.is_capitol = false
            node.garrison_slime_id = nil
          end
        end
      end
      -- Steady stabilization or decay
      if node.owner_color then
        if node.is_supplied then
          node.strength = math.min(1.0, (node.strength or 0) + 0.02)
        else
          node.strength = math.max(0.1, (node.strength or 0) - 0.08)
        end
        node.strength = math.floor(node.strength * 1000) / 1000
      end
    end
  end

  -- 3. BFS Supply Chain from Capitols
  for _, n in ipairs(nodes) do n.is_supplied = false end
  for _, capitol in ipairs(nodes) do
    if capitol.is_capitol and capitol.owner_color then
      capitol.is_supplied = true
      local color = capitol.owner_color
      local queue = { capitol }
      local visited = { [capitol.id] = true }
      while #queue > 0 do
        local current = table.remove(queue, 1)
        for _, neighbor_id in ipairs(current.neighbors or {}) do
          local neighbor = find_by_id(nodes, neighbor_id)
          if neighbor and neighbor.owner_color == color and not visited[neighbor.id] then
            neighbor.is_supplied = true
            visited[neighbor.id] = true
            table.insert(queue, neighbor)
          end
        end
      end
    end
  end

  -- 4. Cascade collapse: unsupplied owned non-capitol nodes revert to Unclaimed
  for _, node in ipairs(nodes) do
    if node.owner_color and not node.is_supplied and not node.is_capitol then
      table.insert(logs, "SUPPLY COLLAPSE: Node [" .. (node.name or node.id) .. "] lost same-color supply line connection to its Capitol. Node reverted to Unclaimed.")
      node.owner_color = nil
      node.strength = 0
      node.pressure = {}
    end
  end

  return nodes, logs
end

function check_wilds_unlock_condition(slimes)
  for _, slime in ipairs(slimes or {}) do
    if slime.color == "Purple" or slime.color == "Orange" or slime.color == "Green" then
      return true
    end
  end
  return false
end

function advance_cycle(state)
  state.cycle = (state.cycle or 0) + 1

  -- Expire contracts
  for _, contract in ipairs(state.contracts or {}) do
    contract.cycles_remaining = contract.cycles_remaining - 1
  end
  for index = #(state.contracts or {}), 1, -1 do
    if state.contracts[index].cycles_remaining <= 0 then table.remove(state.contracts, index) end
  end

  -- Spawn new contracts (65% chance, cap 4, minimum 2)
  local contracts = state.contracts or {}
  if #contracts < 4 and (math.random() < 0.65 or #contracts < 2) then
    table.insert(contracts, generate_contract(state.cycle))
  end
  state.contracts = contracts

  for index = #(state.petitions or {}), 1, -1 do
    if state.petitions[index].expires_cycle < state.cycle then table.remove(state.petitions, index) end
  end

  -- Dual logging: deterministic cycle log + 45% chance flavor log
  if state.logs == nil then state.logs = {} end
  table.insert(state.logs, {
    id = "log_cycle_" .. os.time(),
    cycle = state.cycle,
    text = "CYCLE ADVANCED: Lab cycle " .. state.cycle .. " initiated. All energy cells replenished.",
    type = "system",
  })
  if math.random() < 0.45 then
    table.insert(state.logs, get_random_melancholic_log(state.cycle))
  end

  -- Worker income
  local nodes = state.planet_region and state.planet_region.nodes or {}
  for _, slime in ipairs(state.slimes or {}) do
    if slime.locked_role == "worker" then
      state.credits = (state.credits or 0) + calculate_worker_income(slime, state.has_auto_feeder == true, nodes)
    end
  end

  -- Capitol hardening bonus
  for _, node in ipairs(nodes) do
    if has_secure_capitol_garrison(state, node) and is_capitol_hardened(node, nodes) then
      state.credits = (state.credits or 0) + 15
    end
  end

  -- Planet territory simulation: supply/pressure, flips, revolts, cascade collapse
  local region = state.planet_region
  if region and region.nodes and #region.nodes > 0 then
    local sim_nodes, sim_logs = update_planet_supply_and_pressure(region.nodes)
    region.nodes = sim_nodes
    for _, sim_log in ipairs(sim_logs) do
      table.insert(state.logs, {
        id = "log_sim_" .. os.time() .. "_" .. math.random(1000),
        cycle = state.cycle,
        text = sim_log,
        type = "system",
      })
    end

    -- Stray generation on node flips (detect owner_color change)
    -- We detect flips by checking if a node has strength 0.3 and no garrison (post-flip state)
    -- and generate a stray matching the new owner color
    local slimes = state.slimes or {}
    for _, node in ipairs(region.nodes) do
      -- Check for recently flipped nodes (strength == 0.3, owner_color set, pressure cleared)
      -- This is a heuristic since we don't have prior state to compare
      -- We use the sim_logs to detect flips instead
    end
    -- Parse sim_logs for TERRITORY FLIP entries to generate strays
    for _, sim_log in ipairs(sim_logs) do
      if string.find(sim_log, "TERRITORY FLIP:") then
        -- Extract the new owner color from the log
        local new_color = string.match(sim_log, "to (%a+)%.")
        if new_color and #slimes < (state.roster_cap or 8) then
          local stray = create_seed_slime(new_color, "Solid")
          stray.id = "stray_flip_" .. os.time() .. "_" .. math.random(1000)
          stray.locked_role = "worker"
          stray.name = "Refugee " .. stray.name
          table.insert(slimes, stray)
          table.insert(state.logs, {
            id = "log_stray_flip_" .. os.time() .. "_" .. math.random(1000),
            cycle = state.cycle,
            text = "STRAY DETECTION: A stray " .. new_color .. " refugee fled the conflict zone and arrived at containment. lockedRole assigned to WORKER.",
            type = "combat",
          })
        end
      end
    end
    state.slimes = slimes
  end

  -- Wilds unlock check
  if not state.wilds_unlocked and check_wilds_unlock_condition(state.slimes) then
    state.wilds_unlocked = true
    table.insert(state.logs, {
      id = "log_wilds_unlock_" .. os.time(),
      cycle = state.cycle,
      text = "PLANETARY TELEMETRY: Secondary color genetic signature detected in containment cells. Ring-2 [The Wilds] region orbital connection established!",
      type = "system",
    })
  end

  -- Prune recent_market_sales to 5-cycle window
  local kept_sales = {}
  for _, record in ipairs(state.recent_market_sales or {}) do
    if record.cycle >= state.cycle - 4 then table.insert(kept_sales, record) end
  end
  state.recent_market_sales = kept_sales

  return state
end
`,_p=`-- Slither Rogue — Collision
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
`,hp=`-- Slither Rogue — Game Logic (entry point)
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
`,mp=`-- Slither Rogue — Physics
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
`,gp=`-- Slither Rogue — Render State
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
`,yp=`-- Slither Rogue — State
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
`,vp=`-- Slither Rogue — Utilities
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
`,xp=`-- engine/primitives/action.lua
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
`,bp=`-- engine/primitives/consequence.lua
-- Placeholder — consequence patterns are game-specific for now.
-- Will be populated when a shared consequence emerges across 2+ games.
-- Convention: apply_{outcome}(entity, result) -> updated_entity
`,kp=`-- engine/primitives/entity.lua
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
`,wp=`-- engine/primitives/lifecycle.lua
-- Standard lifecycle event names. Use as string keys in systems.yaml.

LIFECYCLE_CREATE    = "create"
LIFECYCLE_STEP      = "step"
LIFECYCLE_DRAW      = "draw"       -- TypeScript only, documented here for clarity
LIFECYCLE_COLLISION = "collision"
LIFECYCLE_DESTROY   = "destroy"
`,Ap=`-- engine/primitives/movement.lua
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
`,Tp=`-- engine/primitives/physics.lua
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
`,Ep=`-- engine/primitives/resolution.lua
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
`,Sp=`-- engine/systems/combat.lua
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
`,Lp=`-- engine/systems/genetics.lua
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
`,Op=`-- engine/systems/market.lua
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
`,Rp=`-- engine/systems/odds.lua
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
`,Np=`-- RFDGameStudio — Layout Resolver
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
`;/*! js-yaml 4.2.0 https://github.com/nodeca/js-yaml @license MIT */var Cp=Object.create,Oc=Object.defineProperty,Mp=Object.getOwnPropertyDescriptor,Ip=Object.getOwnPropertyNames,Up=Object.getPrototypeOf,Pp=Object.prototype.hasOwnProperty,xt=(a,B)=>()=>(B||(a((B={exports:{}}).exports,B),a=null),B.exports),Dp=(a,B,d,A)=>{if(B&&typeof B=="object"||typeof B=="function")for(var v=Ip(B),D=0,R=v.length,I;D<R;D++)I=v[D],!Pp.call(a,I)&&I!==d&&Oc(a,I,{get:(z=>B[z]).bind(null,I),enumerable:!(A=Mp(B,I))||A.enumerable});return a},Gp=(a,B,d)=>(d=a!=null?Cp(Up(a)):{},Dp(Oc(d,"default",{value:a,enumerable:!0}),a)),mi=xt(((a,B)=>{function d(z){return typeof z>"u"||z===null}function A(z){return typeof z=="object"&&z!==null}function v(z){return Array.isArray(z)?z:d(z)?[]:[z]}function D(z,S){if(S){const H=Object.keys(S);for(let b=0,F=H.length;b<F;b+=1){const Q=H[b];z[Q]=S[Q]}}return z}function R(z,S){let H="";for(let b=0;b<S;b+=1)H+=z;return H}function I(z){return z===0&&Number.NEGATIVE_INFINITY===1/z}B.exports.isNothing=d,B.exports.isObject=A,B.exports.toArray=v,B.exports.repeat=R,B.exports.isNegativeZero=I,B.exports.extend=D})),gi=xt(((a,B)=>{function d(v,D){let R="";const I=v.reason||"(unknown reason)";return v.mark?(v.mark.name&&(R+='in "'+v.mark.name+'" '),R+="("+(v.mark.line+1)+":"+(v.mark.column+1)+")",!D&&v.mark.snippet&&(R+=`

`+v.mark.snippet),I+" "+R):I}function A(v,D){Error.call(this),this.name="YAMLException",this.reason=v,this.mark=D,this.message=d(this,!1),Error.captureStackTrace?Error.captureStackTrace(this,this.constructor):this.stack=new Error().stack||""}A.prototype=Object.create(Error.prototype),A.prototype.constructor=A,A.prototype.toString=function(D){return this.name+": "+d(this,D)},B.exports=A})),Bp=xt(((a,B)=>{var d=mi();function A(R,I,z,S,H){let b="",F="";const Q=Math.floor(H/2)-1;return S-I>Q&&(b=" ... ",I=S-Q+b.length),z-S>Q&&(F=" ...",z=S+Q-F.length),{str:b+R.slice(I,z).replace(/\t/g,"→")+F,pos:S-I+b.length}}function v(R,I){return d.repeat(" ",I-R.length)+R}function D(R,I){if(I=Object.create(I||null),!R.buffer)return null;I.maxLength||(I.maxLength=79),typeof I.indent!="number"&&(I.indent=1),typeof I.linesBefore!="number"&&(I.linesBefore=3),typeof I.linesAfter!="number"&&(I.linesAfter=2);const z=/\r?\n|\r|\0/g,S=[0],H=[];let b,F=-1;for(;b=z.exec(R.buffer);)H.push(b.index),S.push(b.index+b[0].length),R.position<=b.index&&F<0&&(F=S.length-2);F<0&&(F=S.length-1);let Q="";const ce=Math.min(R.line+I.linesAfter,H.length).toString().length,$=I.maxLength-(I.indent+ce+3);for(let se=1;se<=I.linesBefore&&!(F-se<0);se++){const $e=A(R.buffer,S[F-se],H[F-se],R.position-(S[F]-S[F-se]),$);Q=d.repeat(" ",I.indent)+v((R.line-se+1).toString(),ce)+" | "+$e.str+`
`+Q}const ve=A(R.buffer,S[F],H[F],R.position,$);Q+=d.repeat(" ",I.indent)+v((R.line+1).toString(),ce)+" | "+ve.str+`
`,Q+=d.repeat("-",I.indent+ce+3+ve.pos)+`^
`;for(let se=1;se<=I.linesAfter&&!(F+se>=H.length);se++){const $e=A(R.buffer,S[F+se],H[F+se],R.position-(S[F]-S[F+se]),$);Q+=d.repeat(" ",I.indent)+v((R.line+se+1).toString(),ce)+" | "+$e.str+`
`}return Q.replace(/\n$/,"")}B.exports=D})),Yt=xt(((a,B)=>{var d=gi(),A=["kind","multi","resolve","construct","instanceOf","predicate","represent","representName","defaultStyle","styleAliases"],v=["scalar","sequence","mapping"];function D(I){const z={};return I!==null&&Object.keys(I).forEach(function(S){I[S].forEach(function(H){z[String(H)]=S})}),z}function R(I,z){if(z=z||{},Object.keys(z).forEach(function(S){if(A.indexOf(S)===-1)throw new d('Unknown option "'+S+'" is met in definition of "'+I+'" YAML type.')}),this.options=z,this.tag=I,this.kind=z.kind||null,this.resolve=z.resolve||function(){return!0},this.construct=z.construct||function(S){return S},this.instanceOf=z.instanceOf||null,this.predicate=z.predicate||null,this.represent=z.represent||null,this.representName=z.representName||null,this.defaultStyle=z.defaultStyle||null,this.multi=z.multi||!1,this.styleAliases=D(z.styleAliases||null),v.indexOf(this.kind)===-1)throw new d('Unknown kind "'+this.kind+'" is specified for "'+I+'" YAML type.')}B.exports=R})),Rc=xt(((a,B)=>{var d=gi(),A=Yt();function v(I,z){const S=[];return I[z].forEach(function(H){let b=S.length;S.forEach(function(F,Q){F.tag===H.tag&&F.kind===H.kind&&F.multi===H.multi&&(b=Q)}),S[b]=H}),S}function D(){const I={scalar:{},sequence:{},mapping:{},fallback:{},multi:{scalar:[],sequence:[],mapping:[],fallback:[]}};function z(S){S.multi?(I.multi[S.kind].push(S),I.multi.fallback.push(S)):I[S.kind][S.tag]=I.fallback[S.tag]=S}for(let S=0,H=arguments.length;S<H;S+=1)arguments[S].forEach(z);return I}function R(I){return this.extend(I)}R.prototype.extend=function(z){let S=[],H=[];if(z instanceof A)H.push(z);else if(Array.isArray(z))H=H.concat(z);else if(z&&(Array.isArray(z.implicit)||Array.isArray(z.explicit)))z.implicit&&(S=S.concat(z.implicit)),z.explicit&&(H=H.concat(z.explicit));else throw new d("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");S.forEach(function(F){if(!(F instanceof A))throw new d("Specified list of YAML types (or a single Type object) contains a non-Type object.");if(F.loadKind&&F.loadKind!=="scalar")throw new d("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");if(F.multi)throw new d("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.")}),H.forEach(function(F){if(!(F instanceof A))throw new d("Specified list of YAML types (or a single Type object) contains a non-Type object.")});const b=Object.create(R.prototype);return b.implicit=(this.implicit||[]).concat(S),b.explicit=(this.explicit||[]).concat(H),b.compiledImplicit=v(b,"implicit"),b.compiledExplicit=v(b,"explicit"),b.compiledTypeMap=D(b.compiledImplicit,b.compiledExplicit),b},B.exports=R})),Nc=xt(((a,B)=>{B.exports=new(Yt())("tag:yaml.org,2002:str",{kind:"scalar",construct:function(d){return d!==null?d:""}})})),Cc=xt(((a,B)=>{B.exports=new(Yt())("tag:yaml.org,2002:seq",{kind:"sequence",construct:function(d){return d!==null?d:[]}})})),Mc=xt(((a,B)=>{B.exports=new(Yt())("tag:yaml.org,2002:map",{kind:"mapping",construct:function(d){return d!==null?d:{}}})})),Ic=xt(((a,B)=>{B.exports=new(Rc())({explicit:[Nc(),Cc(),Mc()]})})),Uc=xt(((a,B)=>{var d=Yt();function A(R){if(R===null)return!0;const I=R.length;return I===1&&R==="~"||I===4&&(R==="null"||R==="Null"||R==="NULL")}function v(){return null}function D(R){return R===null}B.exports=new d("tag:yaml.org,2002:null",{kind:"scalar",resolve:A,construct:v,predicate:D,represent:{canonical:function(){return"~"},lowercase:function(){return"null"},uppercase:function(){return"NULL"},camelcase:function(){return"Null"},empty:function(){return""}},defaultStyle:"lowercase"})})),Pc=xt(((a,B)=>{var d=Yt();function A(R){if(R===null)return!1;const I=R.length;return I===4&&(R==="true"||R==="True"||R==="TRUE")||I===5&&(R==="false"||R==="False"||R==="FALSE")}function v(R){return R==="true"||R==="True"||R==="TRUE"}function D(R){return Object.prototype.toString.call(R)==="[object Boolean]"}B.exports=new d("tag:yaml.org,2002:bool",{kind:"scalar",resolve:A,construct:v,predicate:D,represent:{lowercase:function(R){return R?"true":"false"},uppercase:function(R){return R?"TRUE":"FALSE"},camelcase:function(R){return R?"True":"False"}},defaultStyle:"lowercase"})})),Dc=xt(((a,B)=>{var d=mi(),A=Yt();function v(b){return b>=48&&b<=57||b>=65&&b<=70||b>=97&&b<=102}function D(b){return b>=48&&b<=55}function R(b){return b>=48&&b<=57}function I(b){if(b===null)return!1;const F=b.length;let Q=0,ce=!1;if(!F)return!1;let $=b[Q];if(($==="-"||$==="+")&&($=b[++Q]),$==="0"){if(Q+1===F)return!0;if($=b[++Q],$==="b"){for(Q++;Q<F;Q++){if($=b[Q],$!=="0"&&$!=="1")return!1;ce=!0}return ce&&Number.isFinite(z(b))}if($==="x"){for(Q++;Q<F;Q++){if(!v(b.charCodeAt(Q)))return!1;ce=!0}return ce&&Number.isFinite(z(b))}if($==="o"){for(Q++;Q<F;Q++){if(!D(b.charCodeAt(Q)))return!1;ce=!0}return ce&&Number.isFinite(z(b))}}for(;Q<F;Q++){if(!R(b.charCodeAt(Q)))return!1;ce=!0}return ce?Number.isFinite(z(b)):!1}function z(b){let F=b,Q=1,ce=F[0];if((ce==="-"||ce==="+")&&(ce==="-"&&(Q=-1),F=F.slice(1),ce=F[0]),F==="0")return 0;if(ce==="0"){if(F[1]==="b")return Q*parseInt(F.slice(2),2);if(F[1]==="x")return Q*parseInt(F.slice(2),16);if(F[1]==="o")return Q*parseInt(F.slice(2),8)}return Q*parseInt(F,10)}function S(b){return z(b)}function H(b){return Object.prototype.toString.call(b)==="[object Number]"&&b%1===0&&!d.isNegativeZero(b)}B.exports=new A("tag:yaml.org,2002:int",{kind:"scalar",resolve:I,construct:S,predicate:H,represent:{binary:function(b){return b>=0?"0b"+b.toString(2):"-0b"+b.toString(2).slice(1)},octal:function(b){return b>=0?"0o"+b.toString(8):"-0o"+b.toString(8).slice(1)},decimal:function(b){return b.toString(10)},hexadecimal:function(b){return b>=0?"0x"+b.toString(16).toUpperCase():"-0x"+b.toString(16).toUpperCase().slice(1)}},defaultStyle:"decimal",styleAliases:{binary:[2,"bin"],octal:[8,"oct"],decimal:[10,"dec"],hexadecimal:[16,"hex"]}})})),Gc=xt(((a,B)=>{var d=mi(),A=Yt(),v=new RegExp("^(?:[-+]?(?:[0-9]+)(?:\\.[0-9]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"),D=new RegExp("^(?:[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");function R(b){return b===null||!v.test(b)?!1:Number.isFinite(parseFloat(b,10))?!0:D.test(b)}function I(b){let F=b.toLowerCase();const Q=F[0]==="-"?-1:1;return"+-".indexOf(F[0])>=0&&(F=F.slice(1)),F===".inf"?Q===1?Number.POSITIVE_INFINITY:Number.NEGATIVE_INFINITY:F===".nan"?NaN:Q*parseFloat(F,10)}var z=/^[-+]?[0-9]+e/;function S(b,F){if(isNaN(b))switch(F){case"lowercase":return".nan";case"uppercase":return".NAN";case"camelcase":return".NaN"}else if(Number.POSITIVE_INFINITY===b)switch(F){case"lowercase":return".inf";case"uppercase":return".INF";case"camelcase":return".Inf"}else if(Number.NEGATIVE_INFINITY===b)switch(F){case"lowercase":return"-.inf";case"uppercase":return"-.INF";case"camelcase":return"-.Inf"}else if(d.isNegativeZero(b))return"-0.0";const Q=b.toString(10);return z.test(Q)?Q.replace("e",".e"):Q}function H(b){return Object.prototype.toString.call(b)==="[object Number]"&&(b%1!==0||d.isNegativeZero(b))}B.exports=new A("tag:yaml.org,2002:float",{kind:"scalar",resolve:R,construct:I,predicate:H,represent:S,defaultStyle:"lowercase"})})),Bc=xt(((a,B)=>{B.exports=Ic().extend({implicit:[Uc(),Pc(),Dc(),Gc()]})})),Fc=xt(((a,B)=>{B.exports=Bc()})),Vc=xt(((a,B)=>{var d=Yt(),A=new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"),v=new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$");function D(z){return z===null?!1:A.exec(z)!==null||v.exec(z)!==null}function R(z){let S=0,H=null,b=A.exec(z);if(b===null&&(b=v.exec(z)),b===null)throw new Error("Date resolve error");const F=+b[1],Q=+b[2]-1,ce=+b[3];if(!b[4])return new Date(Date.UTC(F,Q,ce));const $=+b[4],ve=+b[5],se=+b[6];if(b[7]){for(S=b[7].slice(0,3);S.length<3;)S+="0";S=+S}if(b[9]){const nn=+b[10],Ke=+(b[11]||0);H=(nn*60+Ke)*6e4,b[9]==="-"&&(H=-H)}const $e=new Date(Date.UTC(F,Q,ce,$,ve,se,S));return H&&$e.setTime($e.getTime()-H),$e}function I(z){return z.toISOString()}B.exports=new d("tag:yaml.org,2002:timestamp",{kind:"scalar",resolve:D,construct:R,instanceOf:Date,represent:I})})),jc=xt(((a,B)=>{var d=Yt();function A(v){return v==="<<"||v===null}B.exports=new d("tag:yaml.org,2002:merge",{kind:"scalar",resolve:A})})),zc=xt(((a,B)=>{var d=Yt(),A=`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=
\r`;function v(z){if(z===null)return!1;let S=0;const H=z.length,b=A;for(let F=0;F<H;F++){const Q=b.indexOf(z.charAt(F));if(!(Q>64)){if(Q<0)return!1;S+=6}}return S%8===0}function D(z){const S=z.replace(/[\r\n=]/g,""),H=S.length,b=A;let F=0;const Q=[];for(let $=0;$<H;$++)$%4===0&&$&&(Q.push(F>>16&255),Q.push(F>>8&255),Q.push(F&255)),F=F<<6|b.indexOf(S.charAt($));const ce=H%4*6;return ce===0?(Q.push(F>>16&255),Q.push(F>>8&255),Q.push(F&255)):ce===18?(Q.push(F>>10&255),Q.push(F>>2&255)):ce===12&&Q.push(F>>4&255),new Uint8Array(Q)}function R(z){let S="",H=0;const b=z.length,F=A;for(let ce=0;ce<b;ce++)ce%3===0&&ce&&(S+=F[H>>18&63],S+=F[H>>12&63],S+=F[H>>6&63],S+=F[H&63]),H=(H<<8)+z[ce];const Q=b%3;return Q===0?(S+=F[H>>18&63],S+=F[H>>12&63],S+=F[H>>6&63],S+=F[H&63]):Q===2?(S+=F[H>>10&63],S+=F[H>>4&63],S+=F[H<<2&63],S+=F[64]):Q===1&&(S+=F[H>>2&63],S+=F[H<<4&63],S+=F[64],S+=F[64]),S}function I(z){return Object.prototype.toString.call(z)==="[object Uint8Array]"}B.exports=new d("tag:yaml.org,2002:binary",{kind:"scalar",resolve:v,construct:D,predicate:I,represent:R})})),Hc=xt(((a,B)=>{var d=Yt(),A=Object.prototype.hasOwnProperty,v=Object.prototype.toString;function D(I){if(I===null)return!0;const z=[],S=I;for(let H=0,b=S.length;H<b;H+=1){const F=S[H];let Q=!1;if(v.call(F)!=="[object Object]")return!1;let ce;for(ce in F)if(A.call(F,ce))if(!Q)Q=!0;else return!1;if(!Q)return!1;if(z.indexOf(ce)===-1)z.push(ce);else return!1}return!0}function R(I){return I!==null?I:[]}B.exports=new d("tag:yaml.org,2002:omap",{kind:"sequence",resolve:D,construct:R})})),Kc=xt(((a,B)=>{var d=Yt(),A=Object.prototype.toString;function v(R){if(R===null)return!0;const I=R,z=new Array(I.length);for(let S=0,H=I.length;S<H;S+=1){const b=I[S];if(A.call(b)!=="[object Object]")return!1;const F=Object.keys(b);if(F.length!==1)return!1;z[S]=[F[0],b[F[0]]]}return!0}function D(R){if(R===null)return[];const I=R,z=new Array(I.length);for(let S=0,H=I.length;S<H;S+=1){const b=I[S],F=Object.keys(b);z[S]=[F[0],b[F[0]]]}return z}B.exports=new d("tag:yaml.org,2002:pairs",{kind:"sequence",resolve:v,construct:D})})),qc=xt(((a,B)=>{var d=Yt(),A=Object.prototype.hasOwnProperty;function v(R){if(R===null)return!0;const I=R;for(const z in I)if(A.call(I,z)&&I[z]!==null)return!1;return!0}function D(R){return R!==null?R:{}}B.exports=new d("tag:yaml.org,2002:set",{kind:"mapping",resolve:v,construct:D})})),ns=xt(((a,B)=>{B.exports=Fc().extend({implicit:[Vc(),jc()],explicit:[zc(),Hc(),Kc(),qc()]})})),Fp=xt(((a,B)=>{var d=mi(),A=gi(),v=Bp(),D=ns(),R=Object.prototype.hasOwnProperty,I=1,z=2,S=3,H=4,b=1,F=2,Q=3,ce=/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/,$=/[\x85\u2028\u2029]/,ve=/[,\[\]{}]/,se=/^(?:!|!!|![0-9A-Za-z-]+!)$/,$e=/^(?:!|[^,\[\]{}])(?:%[0-9a-f]{2}|[0-9a-z\-#;/?:@&=+$,_.!~*'()\[\]])*$/i;function nn(o){return Object.prototype.toString.call(o)}function Ke(o){return o===10||o===13}function qe(o){return o===9||o===32}function on(o){return o===9||o===32||o===10||o===13}function P(o){return o===44||o===91||o===93||o===123||o===125}function re(o){if(o>=48&&o<=57)return o-48;const de=o|32;return de>=97&&de<=102?de-97+10:-1}function be(o){return o===120?2:o===117?4:o===85?8:0}function ge(o){return o>=48&&o<=57?o-48:-1}function Oe(o){switch(o){case 48:return"\0";case 97:return"\x07";case 98:return"\b";case 116:return"	";case 9:return"	";case 110:return`
`;case 118:return"\v";case 102:return"\f";case 114:return"\r";case 101:return"\x1B";case 32:return" ";case 34:return'"';case 47:return"/";case 92:return"\\";case 78:return"";case 95:return" ";case 76:return"\u2028";case 80:return"\u2029";default:return""}}function tn(o){return o<=65535?String.fromCharCode(o):String.fromCharCode((o-65536>>10)+55296,(o-65536&1023)+56320)}function an(o,de,h){de==="__proto__"?Object.defineProperty(o,de,{configurable:!0,enumerable:!0,writable:!0,value:h}):o[de]=h}var sn=new Array(256),ae=new Array(256);for(let o=0;o<256;o++)sn[o]=Oe(o)?1:0,ae[o]=Oe(o);function oe(o,de){this.input=o,this.filename=de.filename||null,this.schema=de.schema||D,this.onWarning=de.onWarning||null,this.legacy=de.legacy||!1,this.json=de.json||!1,this.listener=de.listener||null,this.maxDepth=typeof de.maxDepth=="number"?de.maxDepth:100,this.maxMergeSeqLength=typeof de.maxMergeSeqLength=="number"?de.maxMergeSeqLength:20,this.implicitTypes=this.schema.compiledImplicit,this.typeMap=this.schema.compiledTypeMap,this.length=o.length,this.position=0,this.line=0,this.lineStart=0,this.lineIndent=0,this.depth=0,this.firstTabInLine=-1,this.documents=[],this.anchorMapTransactions=[]}function ze(o,de){const h={name:o.filename,buffer:o.input.slice(0,-1),position:o.position,line:o.line,column:o.position-o.lineStart};return h.snippet=v(h),new A(de,h)}function C(o,de){throw ze(o,de)}function Ce(o,de){o.onWarning&&o.onWarning.call(null,ze(o,de))}function T(o,de,h){const X=o.anchorMapTransactions;if(X.length!==0){const V=X[X.length-1];R.call(V,de)||(V[de]={existed:R.call(o.anchorMap,de),value:o.anchorMap[de]})}o.anchorMap[de]=h}function g(o){o.anchorMapTransactions.push(Object.create(null))}function L(o){const de=o.anchorMapTransactions.pop(),h=o.anchorMapTransactions;if(h.length===0)return;const X=h[h.length-1],V=Object.keys(de);for(let J=0,f=V.length;J<f;J+=1){const M=V[J];R.call(X,M)||(X[M]=de[M])}}function xe(o){const de=o.anchorMapTransactions.pop(),h=Object.keys(de);for(let X=h.length-1;X>=0;X-=1){const V=de[h[X]];V.existed?o.anchorMap[h[X]]=V.value:delete o.anchorMap[h[X]]}}function we(o){return{position:o.position,line:o.line,lineStart:o.lineStart,lineIndent:o.lineIndent,firstTabInLine:o.firstTabInLine,tag:o.tag,anchor:o.anchor,kind:o.kind,result:o.result}}function pn(o,de){o.position=de.position,o.line=de.line,o.lineStart=de.lineStart,o.lineIndent=de.lineIndent,o.firstTabInLine=de.firstTabInLine,o.tag=de.tag,o.anchor=de.anchor,o.kind=de.kind,o.result=de.result}var Ze={YAML:function(de,h,X){de.version!==null&&C(de,"duplication of %YAML directive"),X.length!==1&&C(de,"YAML directive accepts exactly one argument");const V=/^([0-9]+)\.([0-9]+)$/.exec(X[0]);V===null&&C(de,"ill-formed argument of the YAML directive");const J=parseInt(V[1],10),f=parseInt(V[2],10);J!==1&&C(de,"unacceptable YAML version of the document"),de.version=X[0],de.checkLineBreaks=f<2,f!==1&&f!==2&&Ce(de,"unsupported YAML version of the document")},TAG:function(de,h,X){let V;X.length!==2&&C(de,"TAG directive accepts exactly two arguments");const J=X[0];V=X[1],se.test(J)||C(de,"ill-formed tag handle (first argument) of the TAG directive"),R.call(de.tagMap,J)&&C(de,'there is a previously declared suffix for "'+J+'" tag handle'),$e.test(V)||C(de,"ill-formed tag prefix (second argument) of the TAG directive");try{V=decodeURIComponent(V)}catch{C(de,"tag prefix is malformed: "+V)}de.tagMap[J]=V}};function dn(o,de,h,X){if(de<h){const V=o.input.slice(de,h);if(X)for(let J=0,f=V.length;J<f;J+=1){const M=V.charCodeAt(J);M===9||M>=32&&M<=1114111||C(o,"expected valid JSON character")}else ce.test(V)&&C(o,"the stream contains non-printable characters");o.result+=V}}function mn(o,de,h,X){d.isObject(h)||C(o,"cannot merge mappings; the provided source object is unacceptable");const V=Object.keys(h);for(let J=0,f=V.length;J<f;J+=1){const M=V[J];R.call(de,M)||(an(de,M,h[M]),X[M]=!0)}}function Y(o,de,h,X,V,J,f,M,te){if(Array.isArray(V)){V=Array.prototype.slice.call(V);for(let Ee=0,Se=V.length;Ee<Se;Ee+=1)Array.isArray(V[Ee])&&C(o,"nested arrays are not supported inside keys"),typeof V=="object"&&nn(V[Ee])==="[object Object]"&&(V[Ee]="[object Object]")}if(typeof V=="object"&&nn(V)==="[object Object]"&&(V="[object Object]"),V=String(V),de===null&&(de={}),X==="tag:yaml.org,2002:merge")if(Array.isArray(J)){J.length>o.maxMergeSeqLength&&C(o,"merge sequence length exceeded maxMergeSeqLength ("+o.maxMergeSeqLength+")");const Ee=new Set;for(let Se=0,De=J.length;Se<De;Se+=1){const Xe=J[Se];Ee.has(Xe)||(Ee.add(Xe),mn(o,de,Xe,h))}}else mn(o,de,J,h);else!o.json&&!R.call(h,V)&&R.call(de,V)&&(o.line=f||o.line,o.lineStart=M||o.lineStart,o.position=te||o.position,C(o,"duplicated mapping key")),an(de,V,J),delete h[V];return de}function ee(o){const de=o.input.charCodeAt(o.position);de===10?o.position++:de===13?(o.position++,o.input.charCodeAt(o.position)===10&&o.position++):C(o,"a line break is expected"),o.line+=1,o.lineStart=o.position,o.firstTabInLine=-1}function Ie(o,de,h){let X=0,V=o.input.charCodeAt(o.position);for(;V!==0;){for(;qe(V);)V===9&&o.firstTabInLine===-1&&(o.firstTabInLine=o.position),V=o.input.charCodeAt(++o.position);if(de&&V===35)do V=o.input.charCodeAt(++o.position);while(V!==10&&V!==13&&V!==0);if(Ke(V))for(ee(o),V=o.input.charCodeAt(o.position),X++,o.lineIndent=0;V===32;)o.lineIndent++,V=o.input.charCodeAt(++o.position);else break}return h!==-1&&X!==0&&o.lineIndent<h&&Ce(o,"deficient indentation"),X}function Te(o){let de=o.position,h=o.input.charCodeAt(de);return!!((h===45||h===46)&&h===o.input.charCodeAt(de+1)&&h===o.input.charCodeAt(de+2)&&(de+=3,h=o.input.charCodeAt(de),h===0||on(h)))}function rn(o,de){de===1?o.result+=" ":de>1&&(o.result+=d.repeat(`
`,de-1))}function On(o,de,h){let X,V,J,f,M,te;const Ee=o.kind,Se=o.result;let De=o.input.charCodeAt(o.position);if(on(De)||P(De)||De===35||De===38||De===42||De===33||De===124||De===62||De===39||De===34||De===37||De===64||De===96)return!1;if(De===63||De===45){const Xe=o.input.charCodeAt(o.position+1);if(on(Xe)||h&&P(Xe))return!1}for(o.kind="scalar",o.result="",X=V=o.position,J=!1;De!==0;){if(De===58){const Xe=o.input.charCodeAt(o.position+1);if(on(Xe)||h&&P(Xe))break}else if(De===35){if(on(o.input.charCodeAt(o.position-1)))break}else{if(o.position===o.lineStart&&Te(o)||h&&P(De))break;if(Ke(De))if(f=o.line,M=o.lineStart,te=o.lineIndent,Ie(o,!1,-1),o.lineIndent>=de){J=!0,De=o.input.charCodeAt(o.position);continue}else{o.position=V,o.line=f,o.lineStart=M,o.lineIndent=te;break}}J&&(dn(o,X,V,!1),rn(o,o.line-f),X=V=o.position,J=!1),qe(De)||(V=o.position+1),De=o.input.charCodeAt(++o.position)}return dn(o,X,V,!1),o.result?!0:(o.kind=Ee,o.result=Se,!1)}function bn(o,de){let h,X,V=o.input.charCodeAt(o.position);if(V!==39)return!1;for(o.kind="scalar",o.result="",o.position++,h=X=o.position;(V=o.input.charCodeAt(o.position))!==0;)if(V===39)if(dn(o,h,o.position,!0),V=o.input.charCodeAt(++o.position),V===39)h=o.position,o.position++,X=o.position;else return!0;else Ke(V)?(dn(o,h,X,!0),rn(o,Ie(o,!1,de)),h=X=o.position):o.position===o.lineStart&&Te(o)?C(o,"unexpected end of the document within a single quoted scalar"):(o.position++,qe(V)||(X=o.position));C(o,"unexpected end of the stream within a single quoted scalar")}function Je(o,de){let h,X,V,J=o.input.charCodeAt(o.position);if(J!==34)return!1;for(o.kind="scalar",o.result="",o.position++,h=X=o.position;(J=o.input.charCodeAt(o.position))!==0;){if(J===34)return dn(o,h,o.position,!0),o.position++,!0;if(J===92){if(dn(o,h,o.position,!0),J=o.input.charCodeAt(++o.position),Ke(J))Ie(o,!1,de);else if(J<256&&sn[J])o.result+=ae[J],o.position++;else if((V=be(J))>0){let f=V,M=0;for(;f>0;f--)J=o.input.charCodeAt(++o.position),(V=re(J))>=0?M=(M<<4)+V:C(o,"expected hexadecimal character");o.result+=tn(M),o.position++}else C(o,"unknown escape sequence");h=X=o.position}else Ke(J)?(dn(o,h,X,!0),rn(o,Ie(o,!1,de)),h=X=o.position):o.position===o.lineStart&&Te(o)?C(o,"unexpected end of the document within a double quoted scalar"):(o.position++,qe(J)||(X=o.position))}C(o,"unexpected end of the stream within a double quoted scalar")}function ie(o,de){let h=!0,X,V,J;const f=o.tag;let M;const te=o.anchor;let Ee,Se,De,Xe;const Fe=Object.create(null);let Ve,vn,i,s=o.input.charCodeAt(o.position);if(s===91)Ee=93,Xe=!1,M=[];else if(s===123)Ee=125,Xe=!0,M={};else return!1;for(o.anchor!==null&&T(o,o.anchor,M),s=o.input.charCodeAt(++o.position);s!==0;){if(Ie(o,!0,de),s=o.input.charCodeAt(o.position),s===Ee)return o.position++,o.tag=f,o.anchor=te,o.kind=Xe?"mapping":"sequence",o.result=M,!0;h?s===44&&C(o,"expected the node content, but found ','"):C(o,"missed comma between flow collection entries"),vn=Ve=i=null,Se=De=!1,s===63&&on(o.input.charCodeAt(o.position+1))&&(Se=De=!0,o.position++,Ie(o,!0,de)),X=o.line,V=o.lineStart,J=o.position,Nn(o,de,I,!1,!0),vn=o.tag,Ve=o.result,Ie(o,!0,de),s=o.input.charCodeAt(o.position),(De||o.line===X)&&s===58&&(Se=!0,s=o.input.charCodeAt(++o.position),Ie(o,!0,de),Nn(o,de,I,!1,!0),i=o.result),Xe?Y(o,M,Fe,vn,Ve,i,X,V,J):Se?M.push(Y(o,null,Fe,vn,Ve,i,X,V,J)):M.push(Ve),Ie(o,!0,de),s=o.input.charCodeAt(o.position),s===44?(h=!0,s=o.input.charCodeAt(++o.position)):h=!1}C(o,"unexpected end of the stream within a flow collection")}function Ue(o,de){let h,X=b,V=!1,J=!1,f=de,M=0,te=!1,Ee,Se=o.input.charCodeAt(o.position);if(Se===124)h=!1;else if(Se===62)h=!0;else return!1;for(o.kind="scalar",o.result="";Se!==0;)if(Se=o.input.charCodeAt(++o.position),Se===43||Se===45)b===X?X=Se===43?Q:F:C(o,"repeat of a chomping mode identifier");else if((Ee=ge(Se))>=0)Ee===0?C(o,"bad explicit indentation width of a block scalar; it cannot be less than one"):J?C(o,"repeat of an indentation width identifier"):(f=de+Ee-1,J=!0);else break;if(qe(Se)){do Se=o.input.charCodeAt(++o.position);while(qe(Se));if(Se===35)do Se=o.input.charCodeAt(++o.position);while(!Ke(Se)&&Se!==0)}for(;Se!==0;){for(ee(o),o.lineIndent=0,Se=o.input.charCodeAt(o.position);(!J||o.lineIndent<f)&&Se===32;)o.lineIndent++,Se=o.input.charCodeAt(++o.position);if(!J&&o.lineIndent>f&&(f=o.lineIndent),Ke(Se)){M++;continue}if(!J&&f===0&&C(o,"missing indentation for block scalar"),o.lineIndent<f){X===Q?o.result+=d.repeat(`
`,V?1+M:M):X===b&&V&&(o.result+=`
`);break}h?qe(Se)?(te=!0,o.result+=d.repeat(`
`,V?1+M:M)):te?(te=!1,o.result+=d.repeat(`
`,M+1)):M===0?V&&(o.result+=" "):o.result+=d.repeat(`
`,M):o.result+=d.repeat(`
`,V?1+M:M),V=!0,J=!0,M=0;const De=o.position;for(;!Ke(Se)&&Se!==0;)Se=o.input.charCodeAt(++o.position);dn(o,De,o.position,!1)}return!0}function N(o,de){const h=o.tag,X=o.anchor,V=[];let J=!1;if(o.firstTabInLine!==-1)return!1;o.anchor!==null&&T(o,o.anchor,V);let f=o.input.charCodeAt(o.position);for(;f!==0&&(o.firstTabInLine!==-1&&(o.position=o.firstTabInLine,C(o,"tab characters must not be used in indentation")),!(f!==45||!on(o.input.charCodeAt(o.position+1))));){if(J=!0,o.position++,Ie(o,!0,-1)&&o.lineIndent<=de){V.push(null),f=o.input.charCodeAt(o.position);continue}const M=o.line;if(Nn(o,de,S,!1,!0),V.push(o.result),Ie(o,!0,-1),f=o.input.charCodeAt(o.position),(o.line===M||o.lineIndent>de)&&f!==0)C(o,"bad indentation of a sequence entry");else if(o.lineIndent<de)break}return J?(o.tag=h,o.anchor=X,o.kind="sequence",o.result=V,!0):!1}function me(o,de,h){let X,V,J,f;const M=o.tag,te=o.anchor,Ee={},Se=Object.create(null);let De=null,Xe=null,Fe=null,Ve=!1,vn=!1;if(o.firstTabInLine!==-1)return!1;o.anchor!==null&&T(o,o.anchor,Ee);let i=o.input.charCodeAt(o.position);for(;i!==0;){!Ve&&o.firstTabInLine!==-1&&(o.position=o.firstTabInLine,C(o,"tab characters must not be used in indentation"));const s=o.input.charCodeAt(o.position+1),_=o.line;if((i===63||i===58)&&on(s))i===63?(Ve&&(Y(o,Ee,Se,De,Xe,null,V,J,f),De=Xe=Fe=null),vn=!0,Ve=!0,X=!0):Ve?(Ve=!1,X=!0):C(o,"incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line"),o.position+=1,i=s;else{if(V=o.line,J=o.lineStart,f=o.position,!Nn(o,h,z,!1,!0))break;if(o.line===_){for(i=o.input.charCodeAt(o.position);qe(i);)i=o.input.charCodeAt(++o.position);if(i===58)i=o.input.charCodeAt(++o.position),on(i)||C(o,"a whitespace character is expected after the key-value separator within a block mapping"),Ve&&(Y(o,Ee,Se,De,Xe,null,V,J,f),De=Xe=Fe=null),vn=!0,Ve=!1,X=!1,De=o.tag,Xe=o.result;else if(vn)C(o,"can not read an implicit mapping pair; a colon is missed");else return o.tag=M,o.anchor=te,!0}else if(vn)C(o,"can not read a block mapping entry; a multiline key may not be an implicit key");else return o.tag=M,o.anchor=te,!0}if((o.line===_||o.lineIndent>de)&&(Ve&&(V=o.line,J=o.lineStart,f=o.position),Nn(o,de,H,!0,X)&&(Ve?Xe=o.result:Fe=o.result),Ve||(Y(o,Ee,Se,De,Xe,Fe,V,J,f),De=Xe=Fe=null),Ie(o,!0,-1),i=o.input.charCodeAt(o.position)),(o.line===_||o.lineIndent>de)&&i!==0)C(o,"bad indentation of a mapping entry");else if(o.lineIndent<de)break}return Ve&&Y(o,Ee,Se,De,Xe,null,V,J,f),vn&&(o.tag=M,o.anchor=te,o.kind="mapping",o.result=Ee),vn}function He(o){let de=!1,h=!1,X,V,J=o.input.charCodeAt(o.position);if(J!==33)return!1;o.tag!==null&&C(o,"duplication of a tag property"),J=o.input.charCodeAt(++o.position),J===60?(de=!0,J=o.input.charCodeAt(++o.position)):J===33?(h=!0,X="!!",J=o.input.charCodeAt(++o.position)):X="!";let f=o.position;if(de){do J=o.input.charCodeAt(++o.position);while(J!==0&&J!==62);o.position<o.length?(V=o.input.slice(f,o.position),J=o.input.charCodeAt(++o.position)):C(o,"unexpected end of the stream within a verbatim tag")}else{for(;J!==0&&!on(J);)J===33&&(h?C(o,"tag suffix cannot contain exclamation marks"):(X=o.input.slice(f-1,o.position+1),se.test(X)||C(o,"named tag handle cannot contain such characters"),h=!0,f=o.position+1)),J=o.input.charCodeAt(++o.position);V=o.input.slice(f,o.position),ve.test(V)&&C(o,"tag suffix cannot contain flow indicator characters")}V&&!$e.test(V)&&C(o,"tag name cannot contain such characters: "+V);try{V=decodeURIComponent(V)}catch{C(o,"tag name is malformed: "+V)}return de?o.tag=V:R.call(o.tagMap,X)?o.tag=o.tagMap[X]+V:X==="!"?o.tag="!"+V:X==="!!"?o.tag="tag:yaml.org,2002:"+V:C(o,'undeclared tag handle "'+X+'"'),!0}function G(o){let de=o.input.charCodeAt(o.position);if(de!==38)return!1;o.anchor!==null&&C(o,"duplication of an anchor property"),de=o.input.charCodeAt(++o.position);const h=o.position;for(;de!==0&&!on(de)&&!P(de);)de=o.input.charCodeAt(++o.position);return o.position===h&&C(o,"name of an anchor node must contain at least one character"),o.anchor=o.input.slice(h,o.position),!0}function Ae(o){let de=o.input.charCodeAt(o.position);if(de!==42)return!1;de=o.input.charCodeAt(++o.position);const h=o.position;for(;de!==0&&!on(de)&&!P(de);)de=o.input.charCodeAt(++o.position);o.position===h&&C(o,"name of an alias node must contain at least one character");const X=o.input.slice(h,o.position);return R.call(o.anchorMap,X)||C(o,'unidentified alias "'+X+'"'),o.result=o.anchorMap[X],Ie(o,!0,-1),!0}function Pe(o,de,h,X){const V=we(o);return g(o),pn(o,de),o.tag=null,o.anchor=null,o.kind=null,o.result=null,me(o,h,X)&&o.kind==="mapping"?(L(o),!0):(xe(o),pn(o,V),!1)}function Nn(o,de,h,X,V){let J,f,M=1,te=!1,Ee=!1,Se=null,De,Xe,Fe;o.depth>=o.maxDepth&&C(o,"nesting exceeded maxDepth ("+o.maxDepth+")"),o.depth+=1,o.listener!==null&&o.listener("open",o),o.tag=null,o.anchor=null,o.kind=null,o.result=null;const Ve=J=f=H===h||S===h;if(X&&Ie(o,!0,-1)&&(te=!0,o.lineIndent>de?M=1:o.lineIndent===de?M=0:o.lineIndent<de&&(M=-1)),M===1)for(;;){const vn=o.input.charCodeAt(o.position),i=we(o);if(te&&(vn===33&&o.tag!==null||vn===38&&o.anchor!==null)||!He(o)&&!G(o))break;Se===null&&(Se=i),Ie(o,!0,-1)?(te=!0,f=Ve,o.lineIndent>de?M=1:o.lineIndent===de?M=0:o.lineIndent<de&&(M=-1)):f=!1}if(f&&(f=te||V),M===1||H===h)if(I===h||z===h?Xe=de:Xe=de+1,Fe=o.position-o.lineStart,M===1)if(f&&(N(o,Fe)||me(o,Fe,Xe))||ie(o,Xe))Ee=!0;else{const vn=o.input.charCodeAt(o.position);Se!==null&&Ve&&!f&&vn!==124&&vn!==62&&Pe(o,Se,Se.position-Se.lineStart,Xe)||J&&Ue(o,Xe)||bn(o,Xe)||Je(o,Xe)?Ee=!0:Ae(o)?(Ee=!0,(o.tag!==null||o.anchor!==null)&&C(o,"alias node should not have any properties")):On(o,Xe,I===h)&&(Ee=!0,o.tag===null&&(o.tag="?")),o.anchor!==null&&T(o,o.anchor,o.result)}else M===0&&(Ee=f&&N(o,Fe));if(o.tag===null)o.anchor!==null&&T(o,o.anchor,o.result);else if(o.tag==="?"){o.result!==null&&o.kind!=="scalar"&&C(o,'unacceptable node kind for !<?> tag; it should be "scalar", not "'+o.kind+'"');for(let vn=0,i=o.implicitTypes.length;vn<i;vn+=1)if(De=o.implicitTypes[vn],De.resolve(o.result)){o.result=De.construct(o.result),o.tag=De.tag,o.anchor!==null&&T(o,o.anchor,o.result);break}}else if(o.tag!=="!"){if(R.call(o.typeMap[o.kind||"fallback"],o.tag))De=o.typeMap[o.kind||"fallback"][o.tag];else{De=null;const vn=o.typeMap.multi[o.kind||"fallback"];for(let i=0,s=vn.length;i<s;i+=1)if(o.tag.slice(0,vn[i].tag.length)===vn[i].tag){De=vn[i];break}}De||C(o,"unknown tag !<"+o.tag+">"),o.result!==null&&De.kind!==o.kind&&C(o,"unacceptable node kind for !<"+o.tag+'> tag; it should be "'+De.kind+'", not "'+o.kind+'"'),De.resolve(o.result,o.tag)?(o.result=De.construct(o.result,o.tag),o.anchor!==null&&T(o,o.anchor,o.result)):C(o,"cannot resolve a node with !<"+o.tag+"> explicit tag")}return o.listener!==null&&o.listener("close",o),o.depth-=1,o.tag!==null||o.anchor!==null||Ee}function Un(o){const de=o.position;let h=!1,X;for(o.version=null,o.checkLineBreaks=o.legacy,o.tagMap=Object.create(null),o.anchorMap=Object.create(null);(X=o.input.charCodeAt(o.position))!==0&&(Ie(o,!0,-1),X=o.input.charCodeAt(o.position),!(o.lineIndent>0||X!==37));){h=!0,X=o.input.charCodeAt(++o.position);let V=o.position;for(;X!==0&&!on(X);)X=o.input.charCodeAt(++o.position);const J=o.input.slice(V,o.position),f=[];for(J.length<1&&C(o,"directive name must not be less than one character in length");X!==0;){for(;qe(X);)X=o.input.charCodeAt(++o.position);if(X===35){do X=o.input.charCodeAt(++o.position);while(X!==0&&!Ke(X));break}if(Ke(X))break;for(V=o.position;X!==0&&!on(X);)X=o.input.charCodeAt(++o.position);f.push(o.input.slice(V,o.position))}X!==0&&ee(o),R.call(Ze,J)?Ze[J](o,J,f):Ce(o,'unknown document directive "'+J+'"')}if(Ie(o,!0,-1),o.lineIndent===0&&o.input.charCodeAt(o.position)===45&&o.input.charCodeAt(o.position+1)===45&&o.input.charCodeAt(o.position+2)===45?(o.position+=3,Ie(o,!0,-1)):h&&C(o,"directives end mark is expected"),Nn(o,o.lineIndent-1,H,!1,!0),Ie(o,!0,-1),o.checkLineBreaks&&$.test(o.input.slice(de,o.position))&&Ce(o,"non-ASCII line breaks are interpreted as content"),o.documents.push(o.result),o.position===o.lineStart&&Te(o)){o.input.charCodeAt(o.position)===46&&(o.position+=3,Ie(o,!0,-1));return}o.position<o.length-1&&C(o,"end of the stream or a document separator is expected")}function Mn(o,de){o=String(o),de=de||{},o.length!==0&&(o.charCodeAt(o.length-1)!==10&&o.charCodeAt(o.length-1)!==13&&(o+=`
`),o.charCodeAt(0)===65279&&(o=o.slice(1)));const h=new oe(o,de),X=o.indexOf("\0");for(X!==-1&&(h.position=X,C(h,"null byte is not allowed in input")),h.input+="\0";h.input.charCodeAt(h.position)===32;)h.lineIndent+=1,h.position+=1;for(;h.position<h.length-1;)Un(h);return h.documents}function Zn(o,de,h){de!==null&&typeof de=="object"&&typeof h>"u"&&(h=de,de=null);const X=Mn(o,h);if(typeof de!="function")return X;for(let V=0,J=X.length;V<J;V+=1)de(X[V])}function ot(o,de){const h=Mn(o,de);if(h.length!==0){if(h.length===1)return h[0];throw new A("expected a single document in the stream, but found more")}}B.exports.loadAll=Zn,B.exports.load=ot})),Vp=xt(((a,B)=>{var d=mi(),A=gi(),v=ns(),D=Object.prototype.toString,R=Object.prototype.hasOwnProperty,I=65279,z=9,S=10,H=13,b=32,F=33,Q=34,ce=35,$=37,ve=38,se=39,$e=42,nn=44,Ke=45,qe=58,on=61,P=62,re=63,be=64,ge=91,Oe=93,tn=96,an=123,sn=124,ae=125,oe={};oe[0]="\\0",oe[7]="\\a",oe[8]="\\b",oe[9]="\\t",oe[10]="\\n",oe[11]="\\v",oe[12]="\\f",oe[13]="\\r",oe[27]="\\e",oe[34]='\\"',oe[92]="\\\\",oe[133]="\\N",oe[160]="\\_",oe[8232]="\\L",oe[8233]="\\P";var ze=["y","Y","yes","Yes","YES","on","On","ON","n","N","no","No","NO","off","Off","OFF"],C=/^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;function Ce(f,M){if(M===null)return{};const te={},Ee=Object.keys(M);for(let Se=0,De=Ee.length;Se<De;Se+=1){let Xe=Ee[Se],Fe=String(M[Xe]);Xe.slice(0,2)==="!!"&&(Xe="tag:yaml.org,2002:"+Xe.slice(2));const Ve=f.compiledTypeMap.fallback[Xe];Ve&&R.call(Ve.styleAliases,Fe)&&(Fe=Ve.styleAliases[Fe]),te[Xe]=Fe}return te}function T(f){let M,te;const Ee=f.toString(16).toUpperCase();if(f<=255)M="x",te=2;else if(f<=65535)M="u",te=4;else if(f<=4294967295)M="U",te=8;else throw new A("code point within a string may not be greater than 0xFFFFFFFF");return"\\"+M+d.repeat("0",te-Ee.length)+Ee}var g=1,L=2;function xe(f){this.schema=f.schema||v,this.indent=Math.max(1,f.indent||2),this.noArrayIndent=f.noArrayIndent||!1,this.skipInvalid=f.skipInvalid||!1,this.flowLevel=d.isNothing(f.flowLevel)?-1:f.flowLevel,this.styleMap=Ce(this.schema,f.styles||null),this.sortKeys=f.sortKeys||!1,this.lineWidth=f.lineWidth||80,this.noRefs=f.noRefs||!1,this.noCompatMode=f.noCompatMode||!1,this.condenseFlow=f.condenseFlow||!1,this.quotingType=f.quotingType==='"'?L:g,this.forceQuotes=f.forceQuotes||!1,this.replacer=typeof f.replacer=="function"?f.replacer:null,this.implicitTypes=this.schema.compiledImplicit,this.explicitTypes=this.schema.compiledExplicit,this.tag=null,this.result="",this.duplicates=[],this.usedDuplicates=null}function we(f,M){const te=d.repeat(" ",M);let Ee=0,Se="";const De=f.length;for(;Ee<De;){let Xe;const Fe=f.indexOf(`
`,Ee);Fe===-1?(Xe=f.slice(Ee),Ee=De):(Xe=f.slice(Ee,Fe+1),Ee=Fe+1),Xe.length&&Xe!==`
`&&(Se+=te),Se+=Xe}return Se}function pn(f,M){return`
`+d.repeat(" ",f.indent*M)}function Ze(f,M){for(let te=0,Ee=f.implicitTypes.length;te<Ee;te+=1)if(f.implicitTypes[te].resolve(M))return!0;return!1}function dn(f){return f===b||f===z}function mn(f){return f>=32&&f<=126||f>=161&&f<=55295&&f!==8232&&f!==8233||f>=57344&&f<=65533&&f!==I||f>=65536&&f<=1114111}function Y(f){return mn(f)&&f!==I&&f!==H&&f!==S}function ee(f,M,te){const Ee=Y(f),Se=Ee&&!dn(f);return(te?Ee:Ee&&f!==nn&&f!==ge&&f!==Oe&&f!==an&&f!==ae)&&f!==ce&&!(M===qe&&!Se)||Y(M)&&!dn(M)&&f===ce||M===qe&&Se}function Ie(f){return mn(f)&&f!==I&&!dn(f)&&f!==Ke&&f!==re&&f!==qe&&f!==nn&&f!==ge&&f!==Oe&&f!==an&&f!==ae&&f!==ce&&f!==ve&&f!==$e&&f!==F&&f!==sn&&f!==on&&f!==P&&f!==se&&f!==Q&&f!==$&&f!==be&&f!==tn}function Te(f){return!dn(f)&&f!==qe}function rn(f,M){const te=f.charCodeAt(M);let Ee;return te>=55296&&te<=56319&&M+1<f.length&&(Ee=f.charCodeAt(M+1),Ee>=56320&&Ee<=57343)?(te-55296)*1024+Ee-56320+65536:te}function On(f){return/^\n* /.test(f)}var bn=1,Je=2,ie=3,Ue=4,N=5;function me(f,M,te,Ee,Se,De,Xe,Fe){let Ve,vn=0,i=null,s=!1,_=!1;const c=Ee!==-1;let m=-1,O=Ie(rn(f,0))&&Te(rn(f,f.length-1));if(M||Xe)for(Ve=0;Ve<f.length;vn>=65536?Ve+=2:Ve++){if(vn=rn(f,Ve),!mn(vn))return N;O=O&&ee(vn,i,Fe),i=vn}else{for(Ve=0;Ve<f.length;vn>=65536?Ve+=2:Ve++){if(vn=rn(f,Ve),vn===S)s=!0,c&&(_=_||Ve-m-1>Ee&&f[m+1]!==" ",m=Ve);else if(!mn(vn))return N;O=O&&ee(vn,i,Fe),i=vn}_=_||c&&Ve-m-1>Ee&&f[m+1]!==" "}return!s&&!_?O&&!Xe&&!Se(f)?bn:De===L?N:Je:te>9&&On(f)?N:Xe?De===L?N:Je:_?Ue:ie}function He(f,M,te,Ee,Se){f.dump=(function(){if(M.length===0)return f.quotingType===L?'""':"''";if(!f.noCompatMode&&(ze.indexOf(M)!==-1||C.test(M)))return f.quotingType===L?'"'+M+'"':"'"+M+"'";const De=f.indent*Math.max(1,te),Xe=f.lineWidth===-1?-1:Math.max(Math.min(f.lineWidth,40),f.lineWidth-De),Fe=Ee||f.flowLevel>-1&&te>=f.flowLevel;function Ve(vn){return Ze(f,vn)}switch(me(M,Fe,f.indent,Xe,Ve,f.quotingType,f.forceQuotes&&!Ee,Se)){case bn:return M;case Je:return"'"+M.replace(/'/g,"''")+"'";case ie:return"|"+G(M,f.indent)+Ae(we(M,De));case Ue:return">"+G(M,f.indent)+Ae(we(Pe(M,Xe),De));case N:return'"'+Un(M)+'"';default:throw new A("impossible error: invalid scalar style")}})()}function G(f,M){const te=On(f)?String(M):"",Ee=f[f.length-1]===`
`;return te+(Ee&&(f[f.length-2]===`
`||f===`
`)?"+":Ee?"":"-")+`
`}function Ae(f){return f[f.length-1]===`
`?f.slice(0,-1):f}function Pe(f,M){const te=/(\n+)([^\n]*)/g;let Ee=(function(){let Fe=f.indexOf(`
`);return Fe=Fe!==-1?Fe:f.length,te.lastIndex=Fe,Nn(f.slice(0,Fe),M)})(),Se=f[0]===`
`||f[0]===" ",De,Xe;for(;Xe=te.exec(f);){const Fe=Xe[1],Ve=Xe[2];De=Ve[0]===" ",Ee+=Fe+(!Se&&!De&&Ve!==""?`
`:"")+Nn(Ve,M),Se=De}return Ee}function Nn(f,M){if(f===""||f[0]===" ")return f;const te=/ [^ ]/g;let Ee,Se=0,De,Xe=0,Fe=0,Ve="";for(;Ee=te.exec(f);)Fe=Ee.index,Fe-Se>M&&(De=Xe>Se?Xe:Fe,Ve+=`
`+f.slice(Se,De),Se=De+1),Xe=Fe;return Ve+=`
`,f.length-Se>M&&Xe>Se?Ve+=f.slice(Se,Xe)+`
`+f.slice(Xe+1):Ve+=f.slice(Se),Ve.slice(1)}function Un(f){let M="",te=0;for(let Ee=0;Ee<f.length;te>=65536?Ee+=2:Ee++){te=rn(f,Ee);const Se=oe[te];!Se&&mn(te)?(M+=f[Ee],te>=65536&&(M+=f[Ee+1])):M+=Se||T(te)}return M}function Mn(f,M,te){let Ee="";const Se=f.tag;for(let De=0,Xe=te.length;De<Xe;De+=1){let Fe=te[De];f.replacer&&(Fe=f.replacer.call(te,String(De),Fe)),(h(f,M,Fe,!1,!1)||typeof Fe>"u"&&h(f,M,null,!1,!1))&&(Ee!==""&&(Ee+=","+(f.condenseFlow?"":" ")),Ee+=f.dump)}f.tag=Se,f.dump="["+Ee+"]"}function Zn(f,M,te,Ee){let Se="";const De=f.tag;for(let Xe=0,Fe=te.length;Xe<Fe;Xe+=1){let Ve=te[Xe];f.replacer&&(Ve=f.replacer.call(te,String(Xe),Ve)),(h(f,M+1,Ve,!0,!0,!1,!0)||typeof Ve>"u"&&h(f,M+1,null,!0,!0,!1,!0))&&((!Ee||Se!=="")&&(Se+=pn(f,M)),f.dump&&S===f.dump.charCodeAt(0)?Se+="-":Se+="- ",Se+=f.dump)}f.tag=De,f.dump=Se||"[]"}function ot(f,M,te){let Ee="";const Se=f.tag,De=Object.keys(te);for(let Xe=0,Fe=De.length;Xe<Fe;Xe+=1){let Ve="";Ee!==""&&(Ve+=", "),f.condenseFlow&&(Ve+='"');const vn=De[Xe];let i=te[vn];f.replacer&&(i=f.replacer.call(te,vn,i)),h(f,M,vn,!1,!1)&&(f.dump.length>1024&&(Ve+="? "),Ve+=f.dump+(f.condenseFlow?'"':"")+":"+(f.condenseFlow?"":" "),h(f,M,i,!1,!1)&&(Ve+=f.dump,Ee+=Ve))}f.tag=Se,f.dump="{"+Ee+"}"}function o(f,M,te,Ee){let Se="";const De=f.tag,Xe=Object.keys(te);if(f.sortKeys===!0)Xe.sort();else if(typeof f.sortKeys=="function")Xe.sort(f.sortKeys);else if(f.sortKeys)throw new A("sortKeys must be a boolean or a function");for(let Fe=0,Ve=Xe.length;Fe<Ve;Fe+=1){let vn="";(!Ee||Se!=="")&&(vn+=pn(f,M));const i=Xe[Fe];let s=te[i];if(f.replacer&&(s=f.replacer.call(te,i,s)),!h(f,M+1,i,!0,!0,!0))continue;const _=f.tag!==null&&f.tag!=="?"||f.dump&&f.dump.length>1024;_&&(f.dump&&S===f.dump.charCodeAt(0)?vn+="?":vn+="? "),vn+=f.dump,_&&(vn+=pn(f,M)),h(f,M+1,s,!0,_)&&(f.dump&&S===f.dump.charCodeAt(0)?vn+=":":vn+=": ",vn+=f.dump,Se+=vn)}f.tag=De,f.dump=Se||"{}"}function de(f,M,te){const Ee=te?f.explicitTypes:f.implicitTypes;for(let Se=0,De=Ee.length;Se<De;Se+=1){const Xe=Ee[Se];if((Xe.instanceOf||Xe.predicate)&&(!Xe.instanceOf||typeof M=="object"&&M instanceof Xe.instanceOf)&&(!Xe.predicate||Xe.predicate(M))){if(te?Xe.multi&&Xe.representName?f.tag=Xe.representName(M):f.tag=Xe.tag:f.tag="?",Xe.represent){const Fe=f.styleMap[Xe.tag]||Xe.defaultStyle;let Ve;if(D.call(Xe.represent)==="[object Function]")Ve=Xe.represent(M,Fe);else if(R.call(Xe.represent,Fe))Ve=Xe.represent[Fe](M,Fe);else throw new A("!<"+Xe.tag+'> tag resolver accepts not "'+Fe+'" style');f.dump=Ve}return!0}}return!1}function h(f,M,te,Ee,Se,De,Xe){f.tag=null,f.dump=te,de(f,te,!1)||de(f,te,!0);const Fe=D.call(f.dump),Ve=Ee;Ee&&(Ee=f.flowLevel<0||f.flowLevel>M);const vn=Fe==="[object Object]"||Fe==="[object Array]";let i,s;if(vn&&(i=f.duplicates.indexOf(te),s=i!==-1),(f.tag!==null&&f.tag!=="?"||s||f.indent!==2&&M>0)&&(Se=!1),s&&f.usedDuplicates[i])f.dump="*ref_"+i;else{if(vn&&s&&!f.usedDuplicates[i]&&(f.usedDuplicates[i]=!0),Fe==="[object Object]")Ee&&Object.keys(f.dump).length!==0?(o(f,M,f.dump,Se),s&&(f.dump="&ref_"+i+f.dump)):(ot(f,M,f.dump),s&&(f.dump="&ref_"+i+" "+f.dump));else if(Fe==="[object Array]")Ee&&f.dump.length!==0?(f.noArrayIndent&&!Xe&&M>0?Zn(f,M-1,f.dump,Se):Zn(f,M,f.dump,Se),s&&(f.dump="&ref_"+i+f.dump)):(Mn(f,M,f.dump),s&&(f.dump="&ref_"+i+" "+f.dump));else if(Fe==="[object String]")f.tag!=="?"&&He(f,f.dump,M,De,Ve);else{if(Fe==="[object Undefined]")return!1;if(f.skipInvalid)return!1;throw new A("unacceptable kind of an object to dump "+Fe)}if(f.tag!==null&&f.tag!=="?"){let _=encodeURI(f.tag[0]==="!"?f.tag.slice(1):f.tag).replace(/!/g,"%21");f.tag[0]==="!"?_="!"+_:_.slice(0,18)==="tag:yaml.org,2002:"?_="!!"+_.slice(18):_="!<"+_+">",f.dump=_+" "+f.dump}}return!0}function X(f,M){const te=[],Ee=[];V(f,te,Ee);const Se=Ee.length;for(let De=0;De<Se;De+=1)M.duplicates.push(te[Ee[De]]);M.usedDuplicates=new Array(Se)}function V(f,M,te){if(f!==null&&typeof f=="object"){const Ee=M.indexOf(f);if(Ee!==-1)te.indexOf(Ee)===-1&&te.push(Ee);else if(M.push(f),Array.isArray(f))for(let Se=0,De=f.length;Se<De;Se+=1)V(f[Se],M,te);else{const Se=Object.keys(f);for(let De=0,Xe=Se.length;De<Xe;De+=1)V(f[Se[De]],M,te)}}}function J(f,M){M=M||{};const te=new xe(M);te.noRefs||X(f,te);let Ee=f;return te.replacer&&(Ee=te.replacer.call({"":Ee},"",Ee)),h(te,0,Ee,!0,!0)?te.dump+`
`:""}B.exports.dump=J})),Xc=Gp(xt(((a,B)=>{var d=Fp(),A=Vp();function v(D,R){return function(){throw new Error("Function yaml."+D+" is removed in js-yaml 4. Use yaml."+R+" instead, which is now safe by default.")}}B.exports.Type=Yt(),B.exports.Schema=Rc(),B.exports.FAILSAFE_SCHEMA=Ic(),B.exports.JSON_SCHEMA=Bc(),B.exports.CORE_SCHEMA=Fc(),B.exports.DEFAULT_SCHEMA=ns(),B.exports.load=d.load,B.exports.loadAll=d.loadAll,B.exports.dump=A.dump,B.exports.YAMLException=gi(),B.exports.types={binary:zc(),float:Gc(),map:Mc(),null:Uc(),pairs:Kc(),set:qc(),timestamp:Vc(),bool:Pc(),int:Dc(),merge:jc(),omap:Hc(),seq:Cc(),str:Nc()},B.exports.safeLoad=v("safeLoad","load"),B.exports.safeLoadAll=v("safeLoadAll","loadAll"),B.exports.safeDump=v("safeDump","dump")}))()),{Type:M_,Schema:I_,FAILSAFE_SCHEMA:U_,JSON_SCHEMA:P_,CORE_SCHEMA:D_,DEFAULT_SCHEMA:G_,load:B_,loadAll:F_,dump:V_,YAMLException:j_,types:z_,safeLoad:H_,safeLoadAll:K_,safeDump:q_}=Xc.default,Xl=Xc.default;class jp extends Error{constructor(B){super(B),this.name="RuntimeError"}}class ho extends Error{constructor(B){super(B),this.name="LuaError"}}class ga extends Error{constructor(B){super(B),this.name="ValidationError"}}const zp=`# RFDGameStudio — Horse Racing & Breeding
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
`,Hp=`# RFDGameStudio — Horse Racing & Breeding
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
`,Kp=`# systems.yaml — horse_racing
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
`,qp=`game:
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
`,Xp=`layout:
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
`,Wp=`lua_files:
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
`,Yp=`game:
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
`,$p=`layout_tree:
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
`,Qp=`game_id: mutant_battle_ball

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
`,Zp=`game:
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
`,Jp=`layout_tree:
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
`,e_=`systems:
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
`,n_=`game:
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
`,t_=`layout_tree:
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
`,r_=`engine_version: "1.0"
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
`,a_=`game:
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
`,i_=`layout_tree:
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
`,o_=`engine_version: "1.0"
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
`,l_=`game:
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
`,s_=`layout_tree:
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
`,u_=`engine_version: "1.0"
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
`,c_=`game:\r
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
`,d_=`layout:
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
`,f_=`engine_version: "1.0"
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
`,p_=`# RFDGameStudio — SlimeWorld
# Data Layer — extracted from SlimeGarden's types.ts and gameLogic.ts
# Renderer-agnostic. TypeScript, Python, Rust all read this.

game:
  id: slimeworld
  name: SlimeWorld
  version: "0.1"
  studio: RFDGameStudio

# --- LAB / ROSTER ---
lab:
  starting_cycle: 1
  starting_credits: 100
  starting_roster_count: 3
  starting_roster_cap: 10
  starting_breeding_success_rate_modifier: 0
  culture_relationships:
    Red: 50
    Blue: 50
    Yellow: 50
    Purple: 50
    Orange: 50
    Green: 50
    Gray: 50
  starter_slimes:
    - name: Specimen-Cinder-Alpha
      color: Red
      pattern: Solid
    - name: Specimen-Sulphur-Beta
      color: Yellow
      pattern: Solid
    - name: Specimen-Abyssal-Gamma
      color: Blue
      pattern: Solid

constants:
  WORKER_BASE_INCOME: 5
  RECYCLE_CREDIT_VALUE: 15
  CAPITOL_HARDENED_BONUS: 15

# --- SLIME SCHEMA ---
slime:
  fields:
    id: string
    name: string
    color: [Red, Blue, Yellow, Purple, Orange, Green, Gray]
    pattern: [Solid, Stripe, Polka, Glow, Crown, Ringed, Nebula, Obsidian]
    level: integer
    xp: integer
    stats:
      hp: number
      atk: number
      def: number
      agi: number
      int: number
      chm: number
    role: [idle, dispatch, corporate]
    generation: integer
    color_saturation: {min: 0, max: 100, optional: true, description: Legacy saturation field retained by the source state}
    hue: {min: 0, max: 360, optional: true, description: Continuous genetic hue angle}
    saturation: {min: 0, max: 100, optional: true, description: Genetic color purity}
    diffusion_ratio: {min: 0, max: 100, optional: true, description: Continuous Accent type coordinate}
    amplitude: {min: 0, max: 100, optional: true, description: Continuous Accent visibility coordinate}
    accent_hue: {min: 0, max: 360, optional: true, description: Accent display hue derived from Color output and amplitude}
    vertex_count: {min: 3, max: 22, optional: true, description: Shape genetics schema; source has no shape-inheritance breeding implementation}
    irregularity: {min: 0, max: 100, optional: true, description: Shape genetics schema; source has no shape-inheritance breeding implementation}
    parent_a: {type: string, optional: true}
    parent_b: {type: string, optional: true}
    created_at: timestamp
    locked_role: {values: [dispatch, mediation, worker, exploration, garrison, null], optional: true}
    garrisoned_at: {type: timestamp, optional: true}
    stage: {values: [Hatchling, Juvenile, Young, Prime, Veteran, Elder], optional: true, description: Computed dynamically in the source}

petition:
  fields:
    id: string
    source: [wanderer]
    requested_color: {type: string, optional: true}
    requested_shape: {type: string, optional: true}
    payout_multiplier: number
    expires_cycle: integer

# --- COLOR GENETICS ---
color_genetics:
  wheel_order: [Red, Orange, Yellow, Green, Purple, Blue]
  faction_anchors:
    Red: 0
    Orange: 60
    Yellow: 120
    Green: 180
    Purple: 240
    Blue: 300
    Gray: 0
  base_saturation_loss_coefficient: 0.12
  repetition_penalty_floor: 0.15
  repetition_penalty_per_streak: 0.12
  gray_saturation_threshold: 15
  target_nudge_strength: 0.6

shape_genetics:
  vertex_count_min: 3
  vertex_count_max: 22
  distance_spike_coefficient: 0.5
  target_nudge_strength: 0.6

# --- ACCENT GENETICS ---
# Real grounding: Turing reaction-diffusion morphogenesis (1952).
# Diffusion Ratio determines pattern TYPE (real ordered regime sequence).
# Amplitude determines pattern INTENSITY (real, independent parameter).
# Shape (vertex_count/irregularity) biases Diffusion Ratio — real
# surface-geometry effect on pattern formation. Color determines the
# rendered accent hue via true complementary-color contrast.
accent_genetics:
  diffusion_ratio_min: 0
  diffusion_ratio_max: 100
  amplitude_min: 0
  amplitude_max: 100
  shape_bias_strength: 0.3
  distance_spike_coefficient: 0.4
  target_nudge_strength: 0.6

accent_targets:
  - {id: accent_solid, name: Solid, diffusion_min: 0, diffusion_max: 10}
  - {id: accent_polka, name: Polka, diffusion_min: 10, diffusion_max: 30}
  - {id: accent_stripe, name: Stripe, diffusion_min: 45, diffusion_max: 65}
  - {id: accent_nebula, name: Nebula, diffusion_min: 65, diffusion_max: 85}
  - {id: accent_ringed, name: Ringed, diffusion_min: 85, diffusion_max: 100}
  - {id: accent_glow, name: Glow, amplitude_min: 0, amplitude_max: 35}
  - {id: accent_obsidian, name: Obsidian, amplitude_min: 70, amplitude_max: 100}
  - {id: accent_metallic, name: Metallic, diffusion_min: 43, diffusion_max: 47, amplitude_min: 68, amplitude_max: 72}

# --- SIX CULTURES ---
cultures:
  ember:
    color: Red
    hue: 0
    specialty: High HP & ATK (Cinder Strain)
    rgb: "rgb(239, 68, 68)"
    base_stats: {hp: 120, atk: 18, def: 8, agi: 6, int: 5, chm: 6}
    growth: {hp: 15, atk: 3, def: 1, agi: 0.8, int: 0.5, chm: 0.6}
  marsh:
    color: Orange
    hue: 60
    specialty: Extreme ATK & AGI (Solar Strain)
    rgb: "rgb(249, 115, 22)"
    base_stats: {hp: 110, atk: 22, def: 5, agi: 14, int: 6, chm: 8}
    growth: {hp: 12, atk: 3.5, def: 0.5, agi: 1.8, int: 0.6, chm: 0.8}
  gale:
    color: Yellow
    hue: 120
    specialty: High AGI & ATK (Sulphur Strain)
    rgb: "rgb(234, 179, 8)"
    base_stats: {hp: 80, atk: 15, def: 6, agi: 18, int: 8, chm: 10}
    growth: {hp: 9, atk: 2.2, def: 0.8, agi: 2.4, int: 1, chm: 1}
  tundra:
    color: Green
    hue: 180
    specialty: Extreme HP & DEF (Jungle Strain)
    rgb: "rgb(34, 197, 94)"
    base_stats: {hp: 160, atk: 8, def: 16, agi: 4, int: 7, chm: 14}
    growth: {hp: 22, atk: 1, def: 2.5, agi: 0.5, int: 0.8, chm: 1.6}
  crystal:
    color: Purple
    hue: 240
    specialty: Ultra-High INT & Balanced (Nebula Strain)
    rgb: "rgb(168, 85, 247)"
    base_stats: {hp: 100, atk: 12, def: 10, agi: 10, int: 20, chm: 15}
    growth: {hp: 11, atk: 1.5, def: 1.2, agi: 1.2, int: 3, chm: 2}
  tide:
    color: Blue
    hue: 300
    specialty: High DEF & INT (Abyssal Strain)
    rgb: "rgb(59, 130, 246)"
    base_stats: {hp: 90, atk: 10, def: 14, agi: 5, int: 15, chm: 12}
    growth: {hp: 10, atk: 1.2, def: 2, agi: 0.6, int: 2.5, chm: 1.5}

# Gray is a non-culture neutral trait used for saturation interpolation.
neutral_traits:
  gray:
    hue: 0
    specialty: Balanced Mysterious Trait (Void Strain)
    rgb: "rgb(107, 114, 128)"
    base_stats: {hp: 110, atk: 14, def: 11, agi: 11, int: 14, chm: 11}
    growth: {hp: 13, atk: 2, def: 1.5, agi: 1.5, int: 2, chm: 1.2}

# --- SEED SHAPE DEFAULTS ---
seed_shape_defaults:
  Red: {vertex_count: 3, irregularity: 10}
  Orange: {vertex_count: 3, irregularity: 15}
  Yellow: {vertex_count: 6, irregularity: 10}
  Green: {vertex_count: 6, irregularity: 15}
  Purple: {vertex_count: 4, irregularity: 15}
  Blue: {vertex_count: 4, irregularity: 10}
  Gray: {vertex_count: 4, irregularity: 20}

# --- COLOR CODEX TARGETS ---
color_targets:
  - {id: guild_ember_marsh, tier: guild, name: Thornward, center_hues: [30], tolerance: 15, saturation_min: 65, saturation_max: 100}
  - {id: guild_marsh_gale, tier: guild, name: "Guild: Amberglow", center_hues: [90], tolerance: 15, saturation_min: 65, saturation_max: 100}
  - {id: guild_gale_tundra, tier: guild, name: Frostwind, center_hues: [150], tolerance: 15, saturation_min: 65, saturation_max: 100}
  - {id: guild_tundra_crystal, tier: guild, name: "Guild: Mossy Crystal", center_hues: [210], tolerance: 15, saturation_min: 65, saturation_max: 100}
  - {id: guild_crystal_tide, tier: guild, name: Tidereign, center_hues: [270], tolerance: 15, saturation_min: 65, saturation_max: 100}
  - {id: guild_tide_ember, tier: guild, name: "Guild: Abyssal Ember", center_hues: [330], tolerance: 15, saturation_min: 65, saturation_max: 100}
  - {id: rival_ember_tundra, tier: rival, name: The Fault Line, center_hues: [90, 270], tolerance: 10, saturation_min: 35, saturation_max: 65}
  - {id: rival_marsh_crystal, tier: rival, name: "Rival: Eclipse Void", center_hues: [150, 330], tolerance: 10, saturation_min: 35, saturation_max: 65}
  - {id: rival_gale_tide, tier: rival, name: "Rival: Stormsurge", center_hues: [210, 30], tolerance: 10, saturation_min: 35, saturation_max: 65}
  - {id: arc_ember_marsh_gale, tier: arc_triad, name: "Arc: Ember-Marsh-Gale", center_hues: [60], tolerance: 15, saturation_min: 20, saturation_max: 35}
  - {id: arc_marsh_gale_tundra, tier: arc_triad, name: "Arc: Marsh-Gale-Tundra", center_hues: [120], tolerance: 15, saturation_min: 20, saturation_max: 35}
  - {id: arc_gale_tundra_crystal, tier: arc_triad, name: "Arc: Gale-Tundra-Crystal", center_hues: [180], tolerance: 15, saturation_min: 20, saturation_max: 35}
  - {id: arc_tundra_crystal_tide, tier: arc_triad, name: "Arc: Tundra-Crystal-Tide", center_hues: [240], tolerance: 15, saturation_min: 20, saturation_max: 35}
  - {id: arc_crystal_tide_ember, tier: arc_triad, name: "Arc: Crystal-Tide-Ember", center_hues: [300], tolerance: 15, saturation_min: 20, saturation_max: 35}
  - {id: arc_tide_ember_marsh, tier: arc_triad, name: "Arc: Tide-Ember-Marsh", center_hues: [0], tolerance: 15, saturation_min: 20, saturation_max: 35}
  - {id: skip_ember_gale_crystal, tier: skip_triad, name: "Skip: Ember-Gale-Crystal", center_hues: [0, 120, 240], tolerance: 10, saturation_min: 15, saturation_max: 20}
  - {id: skip_marsh_tundra_tide, tier: skip_triad, name: "Skip: Marsh-Tundra-Tide", center_hues: [60, 180, 300], tolerance: 10, saturation_min: 15, saturation_max: 20}

# --- SHAPE TARGETS ---
# Real grounding: polygon constructibility complexity tiers, and for
# Tier 3/5, the Schläfli {n/k} star-polygon notation — a single vertex
# count can have multiple real, distinct star forms depending on step.
# "Base" (lower step) vs "Great" (higher step) is real, attested
# terminology (Heptagram/Great Heptagram, Enneagram/Great Enneagram).
# Full research trail: RFDGameStudio_SlimeWorld_ShapeTaxonomy_Full_Directive.md
shape_targets:
  - {id: shape_triangle, tier: 1, name: Triangle, vertex_count: 3, irregularity_max: 15}
  - {id: shape_square, tier: 1, name: Square, vertex_count: 4, irregularity_max: 15}
  - {id: shape_diamond, tier: 1, name: Diamond, vertex_count: 4, irregularity_min: 40, irregularity_max: 100}
  - {id: shape_pentagon, tier: 2, name: Pentagon, vertex_count: 5, irregularity_max: 15}
  - {id: shape_hexagon, tier: 1, name: Hexagon, vertex_count: 6, irregularity_max: 15}
  - {id: shape_octagon, tier: 2, name: Octagon, vertex_count: 8, irregularity_max: 15}
  - {id: shape_star, tier: 3, name: Star, vertex_count: 7, step: 2, irregularity_min: 40, irregularity_max: 70}
  - {id: shape_spiked, tier: 3, name: Spiked, vertex_count: 7, step: 3, irregularity_min: 70, irregularity_max: 100}
  - {id: shape_crescent, tier: 3, name: Crescent, vertex_count: 9, step: 2, irregularity_min: 40, irregularity_max: 70}
  - {id: shape_crown, tier: 3, name: Crown, vertex_count: 9, step: 4, irregularity_min: 70, irregularity_max: 100}
  - {id: shape_prism, tier: 3, name: Prism, vertex_count: 14, step: 3, irregularity_min: 40, irregularity_max: 70}
  - {id: shape_arrow, tier: 3, name: Arrow, vertex_count: 14, step: 5, irregularity_min: 70, irregularity_max: 100}
  - {id: shape_teardrop, tier: 3, name: Teardrop, vertex_count: 18, step: 5, irregularity_min: 40, irregularity_max: 70}
  - {id: shape_crystal, tier: 3, name: Crystal, vertex_count: 18, step: 7, irregularity_min: 70, irregularity_max: 100}
  - {id: shape_void_form, tier: 5, name: Void-Form, vertex_count: 11, step: 2, irregularity_min: 40, irregularity_max: 70}
  - {id: shape_celestial, tier: 5, name: Celestial, vertex_count: 11, step: 5, irregularity_min: 70, irregularity_max: 100}
  - {id: shape_prismatic, tier: 5, name: Prismatic, vertex_count: 22, step: 9, irregularity_min: 70, irregularity_max: 100}

# --- PLANET NODE SCHEMA ---
planet_node:
  fields:
    id: string
    name: string
    cell_shape: string
    label_x: number
    label_y: number
    neighbors: [string]
    owner_color: [Red, Blue, Yellow, Purple, Orange, Green, Gray, null]
    pressure: {type: map, keys: [Red, Blue, Yellow, Purple, Orange, Green, Gray], values: number}
    strength: {min: 0, max: 1}
    is_capitol: boolean
    is_supplied: boolean
    distance_from_center: number
    discovered: boolean
    garrison_slime_id: {type: string, optional: true}

# --- PLANET REGION SCHEMA ---
planet_region:
  fields:
    nodes: [planet_node]
    generated_at: timestamp
    geometry_version: {type: integer, optional: true}
`,__=`game: slimeworld

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

regions:
  header:
    component: app_header
    bindings:
      title: "SLIMEWORLD"
      bank: game_state.credits
  tab_nav:
    component: tab_bar
    tabs_from: layout.tabs
  content:
    component: tab_content
  footer:
    component: app_footer
    text: "RFDGAMESTUDIO • SLIMEWORLD"

layout:
  type: tabbed
  tabs:
    - id: lab
      label: Lab
      icon: home
      default: true
    - id: planet
      label: Planet
      icon: globe

header:
  components:
    - type: label
      text: "SLIMEWORLD"
      style: title
    - type: label
      text: "CONTINUOUS COLOR, SHAPE, AND ACCENT GENETICS"
      style: subtitle
    - type: stat_display
      label: "TREASURY"
      field: game_state.credits
      format: currency

tabs:
  lab:
    tabs: [collection, breeding, slimedex, upgrades, requisitions]
    collection:
      content:
        - type: stat_display
          label: "Roster"
          field: game_state.slimes
          format: "{game_state.slimes.length} / {game_state.roster_cap}"
        - type: card_grid
          data_source: game_state.slimes
          card_template: slime_card
          empty_state: "No slimes in roster."
      slime_card:
        components:
          - type: label
            field: slime.name
            style: card_title
          - type: badge
            field: slime.color
          - type: badge
            format: "GEN {slime.generation}"
          - type: label
            format: "Lv. {slime.level}"
          - type: stat_bar
            label: HP
            field: slime.stats.hp
            max: 200
          - type: stat_bar
            label: ATK
            field: slime.stats.atk
            max: 50
          - type: stat_bar
            label: DEF
            field: slime.stats.def
            max: 50
          - type: stat_bar
            label: AGI
            field: slime.stats.agi
            max: 50
          - type: stat_bar
            label: INT
            field: slime.stats.int
            max: 50
          - type: stat_bar
            label: CHM
            field: slime.stats.chm
            max: 50
          - type: stat_bar
            label: Hue
            field: slime.hue
            max: 360
          - type: stat_bar
            label: Saturation
            field: slime.saturation
            max: 100
          - type: stat_bar
            label: "Vertex Count"
            field: slime.vertex_count
            max: 22
          - type: stat_bar
            label: Irregularity
            field: slime.irregularity
            max: 100
          - type: stat_bar
            label: "Diffusion Ratio"
            field: slime.diffusion_ratio
            max: 100
          - type: stat_bar
            label: Amplitude
            field: slime.amplitude
            max: 100
          - type: action_button
            label: "Recycle (+15 Biomass)"
            event: recycle_slime
            data: slime.id
            style: danger
          - type: action_button
            label: "Toggle Worker Role"
            event: toggle_worker_role
            data: slime.id
    breeding:
      content:
        - type: breed_selector
          label: "Select Parent A"
          data_source: game_state.slimes
          selection_event: select_parent_a
        - type: breed_selector
          label: "Select Parent B"
          data_source: game_state.slimes
          selection_event: select_parent_b
        - type: label
          text: "Breeding command adapter required for genetics targets and Regent selection."
          style: description
    slimedex:
      content:
        - type: label
          text: "SlimeDex wheel deferred to Phase 5."
          style: section_title
        - type: list
          data_source: game_state.discovered_color_targets
          item_template: codex_entry
        - type: list
          data_source: game_state.discovered_shape_targets
          item_template: codex_entry
        - type: list
          data_source: game_state.discovered_accent_targets
          item_template: codex_entry
      codex_entry:
        components:
          - type: label
            field: target.name
          - type: label
            field: target.tier
    upgrades:
      content:
        - type: stat_display
          label: Biomass
          field: game_state.credits
          format: currency
        - type: action_button
          label: "Grid Expansion (150)"
          event: buy_upgrade
          data: "capacity"
        - type: action_button
          label: "Stabilizer (200)"
          event: buy_upgrade
          data: "stabilizer"
        - type: action_button
          label: "Auto-Feeder (250)"
          event: buy_upgrade
          data: "autofeeder"
          requires: [not_already_owned]
        - type: label
          text: "Seed specimen purchase requires a Lua action and is deferred."
          style: description
    requisitions:
      tabs: [contracts, market]
      contracts:
        content:
          - type: list
            data_source: game_state.contracts
            item_template: contract_item
            empty_state: "No active contracts."
        contract_item:
          components:
            - type: label
              field: contract.name
            - type: label
              format: "Reward: {contract.credits_reward} Biomass"
            - type: label
              format: "{contract.cycles_remaining} cycles remaining"
            - type: label
              text: "Delivery requires a matching-specimen selector."
              style: description
      market:
        content:
          - type: list
            data_source: game_state.slimes
            filter: {role: idle}
            item_template: market_item
        market_item:
          components:
            - type: label
              field: slime.name
            - type: label
              field: slime.color
            - type: label
              text: "Market price calculation and sale command adapter are deferred."
              style: description

  planet:
    tabs: [regions, mediation, exploration, active, zones]
    regions:
      content:
        - type: card_grid
          component: PlanetMap
          data_source: game_state.planet_region.nodes
          empty_state: "No planetary sectors discovered."
    mediation:
      content:
        - type: list
          data_source: game_state.planet_region.nodes
          item_template: mediation_node
        - type: label
          text: "Mediation requires a delegation selector."
          style: description
      mediation_node:
        components:
          - type: label
            field: node.name
          - type: badge
            field: node.owner_color
            values: {null: "Unclaimed"}
    exploration:
      content:
        - type: list
          data_source: game_state.planet_region.nodes
          item_template: exploration_node
        - type: label
          text: "Exploration requires a scout-party selector."
          style: description
      exploration_node:
        components:
          - type: label
            field: node.name
          - type: badge
            field: node.owner_color
            values: {null: "Unclaimed"}
    active:
      content:
        - type: list
          data_source: game_state.active_dispatch
          item_template: dispatch_item
          empty_state: "No active dispatch."
        - type: action_button
          label: "Retrieve Completed Dispatch"
          event: retrieve_completed_dispatch
        - type: label
          text: "Mission launch and completion flow require renderer command adapters."
          style: description
      dispatch_item:
        components:
          - type: label
            field: dispatch.id
          - type: label
            format: "Status: {dispatch.status}"
          - type: label
            format: "Cycles remaining: {dispatch.cycles_remaining}"
    zones:
      content:
        - type: card_grid
          data_source: game_state.zones
          card_template: zone_card
          empty_state: "No combat zones available."
        - type: label
          text: "Dispatch requires a zone and party selector."
          style: description
      zone_card:
        components:
          - type: label
            field: zone.name
            style: card_title
          - type: label
            field: zone.description

footer:
  - type: label
    text: "RFDGAMESTUDIO • SLIMEWORLD"
    style: footer
`,h_=`# systems.yaml — slimeworld
# ECS-style system manifest per ADR-006.
# Every function in logic.lua appears in exactly one system's functions list.
engine_version: "1.0"

engine_systems: []

systems:
  - id: genetics
    description: "Continuous color genetics and color-target steering"
    components: [hue, saturation, color, generation, parents]
    functions:
      - clamp
      - circular_distance
      - circular_hue_midpoint
      - snap_to_faction
      - find_color_target
      - find_shape_target
      - breed_shape
      - find_accent_type
      - find_accent_intensity
      - find_metallic_accent
      - breed_accent
      - breed_slimes

  - id: state_queries
    description: "Shared collection and party selection helpers"
    components: [id, slimes, color]
    functions:
      - find_by_id
      - select_slimes
      - dominant_color

  - id: claims
    description: "Force, corporate, and conversion claims under Gray ownership"
    components: [planet_node, pressure, strength, owner_color, credits]
    functions:
      - claim_success_chance
      - claim_grudge_color
      - copy_pressure
      - resolve_force_claim
      - resolve_bribe_claim
      - resolve_convert_claim
      - convert_target_color
      - force_claim_action
      - bribe_claim_action
      - convert_claim_action

  - id: breeding
    description: "Roster capacity and offspring creation actions"
    components: [slimes, roster_cap, credits, generation]
    functions:
      - initiate_breeding

  - id: dispatch
    description: "Combat-dispatch lifecycle actions"
    components: [active_dispatch, zones, slimes]
    functions:
      - launch_dispatch
      - retrieve_completed_dispatch

  - id: exploration
    description: "Exploration mission launch actions"
    components: [active_exploration, planet_node, slimes]
    functions:
      - launch_exploration

  - id: mediation
    description: "Mediation mission launch actions"
    components: [active_mediation, planet_node, slimes]
    functions:
      - launch_mediation

  - id: garrison
    description: "Planetary garrison assignment and recall"
    components: [garrison_slime_id, locked_role, garrisoned_at]
    functions:
      - assign_garrison
      - recall_garrison

  - id: economy
    description: "Contract delivery and market liquidation"
    components: [credits, contracts, recent_market_sales, slimes]
    functions:
      - deliver_contract
      - sell_on_market
      - recycle_slime
      - rename_slime

  - id: upgrades
    description: "Facility upgrades and worker role specialization"
    components: [credits, roster_cap, breeding_success_rate_modifier, has_auto_feeder, locked_role]
    functions:
      - buy_upgrade
      - toggle_worker_role

  - id: cycles
    description: "Manual cycle advancement, contract spawning, dual logging, planet simulation, stray generation, and wilds unlock"
    components: [cycle, contracts, logs, planet_region, slimes]
    functions:
      - is_slime_in_matching_culture_environment
      - calculate_worker_income
      - is_capitol_hardened
      - has_secure_capitol_garrison
      - generate_contract
      - get_random_melancholic_log
      - generate_slime_name
      - create_seed_slime
      - update_planet_supply_and_pressure
      - check_wilds_unlock_condition
      - advance_cycle

entities:
  slime:
    description: "A continuously colored specimen with combat and assignment state"
    systems: [genetics, state_queries, claims, breeding, dispatch, exploration, mediation, garrison, economy, upgrades]
    schema_ref: data.yaml#slime
  planet_node:
    description: "A claimable planetary sector"
    systems: [claims, exploration, mediation, garrison]
    schema_ref: data.yaml#planet_node
  lab:
    description: "Roster, credits, contracts, and progression state"
    systems: [breeding, dispatch, economy, upgrades, cycles]
    schema_ref: data.yaml#lab
`,m_={horse_racing:{data:zp,ui:Hp,systems:Kp},slither_rogue:{data:qp,ui:Xp,systems:Wp},mutant_battle_ball:{data:Yp,ui:$p,systems:Qp},slime_coin:{data:Zp,ui:Jp,systems:e_},chimera_wilds:{data:n_,ui:t_,systems:r_},scrapcrawl:{data:a_,ui:i_,systems:o_},brewfield:{data:l_,ui:s_,systems:u_},shoal:{data:c_,ui:d_,systems:f_},slimeworld:{data:p_,ui:__,systems:h_}},g_=Object.assign({"../../../games/brewfield/logic.lua":tp,"../../../games/chimera_wilds/logic.lua":rp,"../../../games/horse_racing/logic.lua":ap,"../../../games/mutant_battle_ball/logic.lua":ip,"../../../games/scrapcrawl/logic.lua":op,"../../../games/shoal/entities.lua":lp,"../../../games/shoal/logic.lua":sp,"../../../games/shoal/state.lua":up,"../../../games/shoal/steering.lua":cp,"../../../games/shoal/utils.lua":dp,"../../../games/slime_coin/logic.lua":fp,"../../../games/slimeworld/logic.lua":pp,"../../../games/slither_rogue/collision.lua":_p,"../../../games/slither_rogue/logic.lua":hp,"../../../games/slither_rogue/physics.lua":mp,"../../../games/slither_rogue/render.lua":gp,"../../../games/slither_rogue/state.lua":yp,"../../../games/slither_rogue/utils.lua":vp}),y_=Object.assign({"../../../engine/primitives/action.lua":xp,"../../../engine/primitives/consequence.lua":bp,"../../../engine/primitives/entity.lua":kp,"../../../engine/primitives/lifecycle.lua":wp,"../../../engine/primitives/movement.lua":Ap,"../../../engine/primitives/physics.lua":Tp,"../../../engine/primitives/resolution.lua":Ep,"../../../engine/systems/combat.lua":Sp,"../../../engine/systems/genetics.lua":Lp,"../../../engine/systems/market.lua":Op,"../../../engine/systems/odds.lua":Rp,"../../../engine/ui/resolver.lua":Np});function v_(a=null,B=null){const d=a??g_,A=B??y_;function v(z,S){const H=`../../../games/${z}/${S}`,b=d[H];return b===void 0?(console.warn(`[loader] Lua file not found in bundle: ${H}`),""):b}function D(z,S){const H=`../../../engine/${z}/${S}`,b=A[H];return b===void 0?(console.warn(`[loader] Engine Lua file not found in bundle: ${H}`),""):b}const R=["action.lua","entity.lua","resolution.lua","consequence.lua","movement.lua","physics.lua","lifecycle.lua"];function I(z){const S=[];for(const H of R){const b=D("primitives",H);b&&S.push(b)}for(const H of z??[]){const b=D("systems",`${H}.lua`);b&&S.push(b)}return S.join(`

`)}return function(S){const H=m_[S];if(!H)throw new ga(`Unknown game: ${S}`);const b=Xl.load(H.data),F=Xl.load(H.ui);x_(b,S);const Q=Xl.load(H.systems)??{},ce=Q.lua_files,$=Q.engine_systems,ve=I($??[]);let se;return ce&&ce.length>0?se=ce.map($e=>v(S,$e)).join(`

`):se=v(S,"logic.lua"),{gameId:S,data:b,ui:F,logic:se,engineSource:ve}}}const Wc=v_(null,null);function x_(a,B){const d=a.game;if(!d)throw new ga("Missing required key: game");if(!d.id)throw new ga("Missing required key: game.id");if(!d.name)throw new ga("Missing required key: game.name");if(!d.version)throw new ga("Missing required key: game.version");if(!d.studio)throw new ga("Missing required key: game.studio");if(d.id!==B)throw new ga(`game.id mismatch: expected "${B}", got "${String(d.id)}"`)}function b_(){return new URLSearchParams(window.location.search).get("game")}function Tc(a){const B=window.location.href.split("?")[0];window.location.href=`${B}?game=${a}`}function Wl(){window.location.href=window.location.href.split("?")[0]}const k_=new Set(["horse_racing","slither_rogue"]);function ea(a,B){const d=a[B];return Array.isArray(d)?d.length:d&&typeof d=="object"?Object.keys(d).length:0}function w_(a,B){var A;const d=[];switch(k_.has(a)&&d.push("PyGame renderer"),a){case"horse_racing":d.push(`${ea(B,"race_classes")} race classes`);break;case"slither_rogue":d.push(`${ea(B,"evolution_cards")} evolution cards`);break;case"mutant_battle_ball":d.push(`${ea(B,"parts")} mutant parts`,`${ea(B,"opponents")} opponents`);break;case"slime_coin":{const v=((A=B.round_config)==null?void 0:A.total_rounds)??0;d.push(`${v} rounds`,`${ea(B,"chip_cards")} chip cards`);break}case"chimera_wilds":d.push(`${ea(B,"parts")} mutant parts`,`${ea(B,"part_slots")} body slots`);break;case"scrapcrawl":{const v=B.catalog;d.push(`${ea(B,"rooms")} rooms`,`${Object.keys(v??{}).length} craftables`);break}}return d.join(" · ")}function A_(){const a=Ga.useMemo(()=>{const B={};for(const d of Ql){if(d.externalUrl&&d.embedUrl){B[d.gameId]="Rust/Bevy · itch.io";continue}if(d.embedUrl){B[d.gameId]="React/Tailwind · Standalone";continue}if(d.externalUrl){B[d.gameId]="External link";continue}try{const A=Wc(d.gameId);B[d.gameId]=w_(d.gameId,A.data)}catch{B[d.gameId]="data unavailable"}}return B},[]);return tt.jsxs("div",{className:"arcade-index",children:[tt.jsxs("header",{className:"arcade-header",children:[tt.jsx("a",{href:"https://rfditservices.com/games/",className:"arcade-back-to-site",children:"← rfditservices.com"}),tt.jsxs("div",{className:"arcade-marquee",children:[tt.jsx("h1",{className:"arcade-logo",children:"RFD GAME STUDIO"}),tt.jsx("p",{className:"arcade-subtitle",children:"Portable Game Definition Format · Multi-Renderer"})]})]}),tt.jsxs("main",{className:"arcade-main",children:[tt.jsx("h2",{className:"arcade-section-title",children:"SELECT A GAME"}),tt.jsx("div",{className:"arcade-grid",children:Ql.map(B=>tt.jsx("button",{className:"arcade-card",style:{"--card-color":B.color??"var(--accent)"},onClick:()=>{B.embedUrl?Tc(B.gameId):B.externalUrl?window.open(B.externalUrl,"_blank","noopener,noreferrer"):Tc(B.gameId)},children:tt.jsxs("div",{className:"arcade-card-frame",children:[tt.jsxs("div",{className:"arcade-card-header",children:[tt.jsx("span",{className:"arcade-card-title",children:B.label}),tt.jsx("span",{className:`arcade-status arcade-status--${B.status??"stable"}`,children:(B.status??"stable").toUpperCase()})]}),tt.jsx("p",{className:"arcade-card-desc",children:B.description??""}),tt.jsx("div",{className:"arcade-card-detail",children:a[B.gameId]}),tt.jsx("div",{className:"arcade-card-id",children:B.gameId})]})},B.gameId))})]}),tt.jsxs("footer",{className:"arcade-footer",children:[tt.jsx("span",{children:"© 2026 RFD IT Services Ltd."}),tt.jsx("span",{className:"arcade-footer-sep",children:"·"}),tt.jsx("span",{children:"Lua + Python + TypeScript"})]})]})}var Yl,Ec;function T_(){return Ec||(Ec=1,Yl=(function(a){var B={};function d(A){if(B[A])return B[A].exports;var v=B[A]={i:A,l:!1,exports:{}};return a[A].call(v.exports,v,v.exports,d),v.l=!0,v.exports}return d.m=a,d.c=B,d.d=function(A,v,D){d.o(A,v)||Object.defineProperty(A,v,{enumerable:!0,get:D})},d.r=function(A){typeof Symbol<"u"&&Symbol.toStringTag&&Object.defineProperty(A,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(A,"__esModule",{value:!0})},d.t=function(A,v){if(1&v&&(A=d(A)),8&v||4&v&&typeof A=="object"&&A&&A.__esModule)return A;var D=Object.create(null);if(d.r(D),Object.defineProperty(D,"default",{enumerable:!0,value:A}),2&v&&typeof A!="string")for(var R in A)d.d(D,R,(function(I){return A[I]}).bind(null,R));return D},d.n=function(A){var v=A&&A.__esModule?function(){return A.default}:function(){return A};return d.d(v,"a",v),v},d.o=function(A,v){return Object.prototype.hasOwnProperty.call(A,v)},d.p="",d(d.s=34)})([function(a,B,d){/**
	@license MIT

	Copyright © 2017-2018 Benoit Giannangeli
	Copyright © 2017-2018 Daurnimator
	Copyright © 1994–2017 Lua.org, PUC-Rio.
	*/const A=d(5);a.exports.FENGARI_AUTHORS=A.FENGARI_AUTHORS,a.exports.FENGARI_COPYRIGHT=A.FENGARI_COPYRIGHT,a.exports.FENGARI_RELEASE=A.FENGARI_RELEASE,a.exports.FENGARI_VERSION=A.FENGARI_VERSION,a.exports.FENGARI_VERSION_MAJOR=A.FENGARI_VERSION_MAJOR,a.exports.FENGARI_VERSION_MINOR=A.FENGARI_VERSION_MINOR,a.exports.FENGARI_VERSION_NUM=A.FENGARI_VERSION_NUM,a.exports.FENGARI_VERSION_RELEASE=A.FENGARI_VERSION_RELEASE,a.exports.luastring_eq=A.luastring_eq,a.exports.luastring_indexOf=A.luastring_indexOf,a.exports.luastring_of=A.luastring_of,a.exports.to_jsstring=A.to_jsstring,a.exports.to_luastring=A.to_luastring,a.exports.to_uristring=A.to_uristring;const v=d(3),D=d(2),R=d(7),I=d(17);a.exports.luaconf=v,a.exports.lua=D,a.exports.lauxlib=R,a.exports.lualib=I},function(a,B,d){let A,v,D;if(A=typeof Uint8Array.from=="function"?Uint8Array.from.bind(Uint8Array):function($){let ve=0,se=$.length,$e=new Uint8Array(se);for(;se>ve;)$e[ve]=$[ve++];return $e},typeof new Uint8Array().indexOf=="function")v=function($,ve,se){return $.indexOf(ve,se)};else{let $=[].indexOf;if($.call(new Uint8Array(1),0)!==0)throw Error("missing .indexOf");v=function(ve,se,$e){return $.call(ve,se,$e)}}D=typeof Uint8Array.of=="function"?Uint8Array.of.bind(Uint8Array):function(){return A(arguments)};const R=function($){return $ instanceof Uint8Array},I="cannot convert invalid utf8 to javascript string",z=";,/?:@&=+$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789,-_.!~*'()#".split("").reduce(function($,ve){return $[ve.charCodeAt(0)]=!0,$},{}),S={},H=function($,ve){if(typeof $!="string")throw new TypeError("to_luastring expects a javascript string");if(ve){let Ke=S[$];if(R(Ke))return Ke}let se=$.length,$e=Array(se),nn=0;for(let Ke=0;Ke<se;++Ke){let qe=$.charCodeAt(Ke);if(qe<=127)$e[nn++]=qe;else if(qe<=2047)$e[nn++]=192|qe>>6,$e[nn++]=128|63&qe;else{if(qe>=55296&&qe<=56319&&Ke+1<se){let on=$.charCodeAt(Ke+1);on>=56320&&on<=57343&&(Ke++,qe=1024*(qe-55296)+on+9216)}qe<=65535?($e[nn++]=224|qe>>12,$e[nn++]=128|qe>>6&63,$e[nn++]=128|63&qe):($e[nn++]=240|qe>>18,$e[nn++]=128|qe>>12&63,$e[nn++]=128|qe>>6&63,$e[nn++]=128|63&qe)}}return $e=A($e),ve&&(S[$]=$e),$e};a.exports.luastring_from=A,a.exports.luastring_indexOf=v,a.exports.luastring_of=D,a.exports.is_luastring=R,a.exports.luastring_eq=function($,ve){if($!==ve){let se=$.length;if(se!==ve.length)return!1;for(let $e=0;$e<se;$e++)if($[$e]!==ve[$e])return!1}return!0},a.exports.to_jsstring=function($,ve,se,$e){if(!R($))throw new TypeError("to_jsstring expects a Uint8Array");se=se===void 0?$.length:Math.min($.length,se);let nn="";for(let Ke=ve!==void 0?ve:0;Ke<se;){let qe=$[Ke++];if(qe<128)nn+=String.fromCharCode(qe);else if(qe<194||qe>244){if(!$e)throw RangeError(I);nn+="�"}else if(qe<=223){if(Ke>=se){if(!$e)throw RangeError(I);nn+="�";continue}let on=$[Ke++];if((192&on)!=128){if(!$e)throw RangeError(I);nn+="�";continue}nn+=String.fromCharCode(((31&qe)<<6)+(63&on))}else if(qe<=239){if(Ke+1>=se){if(!$e)throw RangeError(I);nn+="�";continue}let on=$[Ke++];if((192&on)!=128){if(!$e)throw RangeError(I);nn+="�";continue}let P=$[Ke++];if((192&P)!=128){if(!$e)throw RangeError(I);nn+="�";continue}let re=((15&qe)<<12)+((63&on)<<6)+(63&P);if(re<=65535)nn+=String.fromCharCode(re);else{let be=55296+((re-=65536)>>10),ge=re%1024+56320;nn+=String.fromCharCode(be,ge)}}else{if(Ke+2>=se){if(!$e)throw RangeError(I);nn+="�";continue}let on=$[Ke++];if((192&on)!=128){if(!$e)throw RangeError(I);nn+="�";continue}let P=$[Ke++];if((192&P)!=128){if(!$e)throw RangeError(I);nn+="�";continue}let re=$[Ke++];if((192&re)!=128){if(!$e)throw RangeError(I);nn+="�";continue}let be=((7&qe)<<18)+((63&on)<<12)+((63&P)<<6)+(63&re),ge=55296+((be-=65536)>>10),Oe=be%1024+56320;nn+=String.fromCharCode(ge,Oe)}}return nn},a.exports.to_uristring=function($){if(!R($))throw new TypeError("to_uristring expects a Uint8Array");let ve="";for(let se=0;se<$.length;se++){let $e=$[se];z[$e]?ve+=String.fromCharCode($e):ve+="%"+($e<16?"0":"")+$e.toString(16)}return ve},a.exports.to_luastring=H,a.exports.from_userstring=function($){if(!R($)){if(typeof $!="string")throw new TypeError("expects an array of bytes or javascript string");$=H($)}return $};const b=H("\x1BLua");a.exports.LUA_SIGNATURE=b,a.exports.LUA_VERSION_MAJOR="5",a.exports.LUA_VERSION_MINOR="3",a.exports.LUA_VERSION_NUM=503,a.exports.LUA_VERSION_RELEASE="4",a.exports.LUA_VERSION="Lua 5.3",a.exports.LUA_RELEASE="Lua 5.3.4",a.exports.LUA_COPYRIGHT="Lua 5.3.4  Copyright (C) 1994-2017 Lua.org, PUC-Rio",a.exports.LUA_AUTHORS="R. Ierusalimschy, L. H. de Figueiredo, W. Celes";const F={LUA_TNONE:-1,LUA_TNIL:0,LUA_TBOOLEAN:1,LUA_TLIGHTUSERDATA:2,LUA_TNUMBER:3,LUA_TSTRING:4,LUA_TTABLE:5,LUA_TFUNCTION:6,LUA_TUSERDATA:7,LUA_TTHREAD:8,LUA_NUMTAGS:9};F.LUA_TSHRSTR=0|F.LUA_TSTRING,F.LUA_TLNGSTR=16|F.LUA_TSTRING,F.LUA_TNUMFLT=0|F.LUA_TNUMBER,F.LUA_TNUMINT=16|F.LUA_TNUMBER,F.LUA_TLCL=0|F.LUA_TFUNCTION,F.LUA_TLCF=16|F.LUA_TFUNCTION,F.LUA_TCCL=32|F.LUA_TFUNCTION;const{LUAI_MAXSTACK:Q}=d(3),ce=-Q-1e3;a.exports.LUA_HOOKCALL=0,a.exports.LUA_HOOKCOUNT=3,a.exports.LUA_HOOKLINE=2,a.exports.LUA_HOOKRET=1,a.exports.LUA_HOOKTAILCALL=4,a.exports.LUA_MASKCALL=1,a.exports.LUA_MASKCOUNT=8,a.exports.LUA_MASKLINE=4,a.exports.LUA_MASKRET=2,a.exports.LUA_MINSTACK=20,a.exports.LUA_MULTRET=-1,a.exports.LUA_OPADD=0,a.exports.LUA_OPBAND=7,a.exports.LUA_OPBNOT=13,a.exports.LUA_OPBOR=8,a.exports.LUA_OPBXOR=9,a.exports.LUA_OPDIV=5,a.exports.LUA_OPEQ=0,a.exports.LUA_OPIDIV=6,a.exports.LUA_OPLE=2,a.exports.LUA_OPLT=1,a.exports.LUA_OPMOD=3,a.exports.LUA_OPMUL=2,a.exports.LUA_OPPOW=4,a.exports.LUA_OPSHL=10,a.exports.LUA_OPSHR=11,a.exports.LUA_OPSUB=1,a.exports.LUA_OPUNM=12,a.exports.LUA_REGISTRYINDEX=ce,a.exports.LUA_RIDX_GLOBALS=2,a.exports.LUA_RIDX_LAST=2,a.exports.LUA_RIDX_MAINTHREAD=1,a.exports.constant_types=F,a.exports.lua_Debug=class{constructor(){this.event=NaN,this.name=null,this.namewhat=null,this.what=null,this.source=null,this.currentline=NaN,this.linedefined=NaN,this.lastlinedefined=NaN,this.nups=NaN,this.nparams=NaN,this.isvararg=NaN,this.istailcall=NaN,this.short_src=null,this.i_ci=null}},a.exports.lua_upvalueindex=function($){return ce-$},a.exports.thread_status={LUA_OK:0,LUA_YIELD:1,LUA_ERRRUN:2,LUA_ERRSYNTAX:3,LUA_ERRMEM:4,LUA_ERRGCMM:5,LUA_ERRERR:6}},function(a,B,d){const A=d(1),v=d(18),D=d(11),R=d(8),I=d(12);a.exports.LUA_AUTHORS=A.LUA_AUTHORS,a.exports.LUA_COPYRIGHT=A.LUA_COPYRIGHT,a.exports.LUA_ERRERR=A.thread_status.LUA_ERRERR,a.exports.LUA_ERRGCMM=A.thread_status.LUA_ERRGCMM,a.exports.LUA_ERRMEM=A.thread_status.LUA_ERRMEM,a.exports.LUA_ERRRUN=A.thread_status.LUA_ERRRUN,a.exports.LUA_ERRSYNTAX=A.thread_status.LUA_ERRSYNTAX,a.exports.LUA_HOOKCALL=A.LUA_HOOKCALL,a.exports.LUA_HOOKCOUNT=A.LUA_HOOKCOUNT,a.exports.LUA_HOOKLINE=A.LUA_HOOKLINE,a.exports.LUA_HOOKRET=A.LUA_HOOKRET,a.exports.LUA_HOOKTAILCALL=A.LUA_HOOKTAILCALL,a.exports.LUA_MASKCALL=A.LUA_MASKCALL,a.exports.LUA_MASKCOUNT=A.LUA_MASKCOUNT,a.exports.LUA_MASKLINE=A.LUA_MASKLINE,a.exports.LUA_MASKRET=A.LUA_MASKRET,a.exports.LUA_MINSTACK=A.LUA_MINSTACK,a.exports.LUA_MULTRET=A.LUA_MULTRET,a.exports.LUA_NUMTAGS=A.constant_types.LUA_NUMTAGS,a.exports.LUA_OK=A.thread_status.LUA_OK,a.exports.LUA_OPADD=A.LUA_OPADD,a.exports.LUA_OPBAND=A.LUA_OPBAND,a.exports.LUA_OPBNOT=A.LUA_OPBNOT,a.exports.LUA_OPBOR=A.LUA_OPBOR,a.exports.LUA_OPBXOR=A.LUA_OPBXOR,a.exports.LUA_OPDIV=A.LUA_OPDIV,a.exports.LUA_OPEQ=A.LUA_OPEQ,a.exports.LUA_OPIDIV=A.LUA_OPIDIV,a.exports.LUA_OPLE=A.LUA_OPLE,a.exports.LUA_OPLT=A.LUA_OPLT,a.exports.LUA_OPMOD=A.LUA_OPMOD,a.exports.LUA_OPMUL=A.LUA_OPMUL,a.exports.LUA_OPPOW=A.LUA_OPPOW,a.exports.LUA_OPSHL=A.LUA_OPSHL,a.exports.LUA_OPSHR=A.LUA_OPSHR,a.exports.LUA_OPSUB=A.LUA_OPSUB,a.exports.LUA_OPUNM=A.LUA_OPUNM,a.exports.LUA_REGISTRYINDEX=A.LUA_REGISTRYINDEX,a.exports.LUA_RELEASE=A.LUA_RELEASE,a.exports.LUA_RIDX_GLOBALS=A.LUA_RIDX_GLOBALS,a.exports.LUA_RIDX_LAST=A.LUA_RIDX_LAST,a.exports.LUA_RIDX_MAINTHREAD=A.LUA_RIDX_MAINTHREAD,a.exports.LUA_SIGNATURE=A.LUA_SIGNATURE,a.exports.LUA_TNONE=A.constant_types.LUA_TNONE,a.exports.LUA_TNIL=A.constant_types.LUA_TNIL,a.exports.LUA_TBOOLEAN=A.constant_types.LUA_TBOOLEAN,a.exports.LUA_TLIGHTUSERDATA=A.constant_types.LUA_TLIGHTUSERDATA,a.exports.LUA_TNUMBER=A.constant_types.LUA_TNUMBER,a.exports.LUA_TSTRING=A.constant_types.LUA_TSTRING,a.exports.LUA_TTABLE=A.constant_types.LUA_TTABLE,a.exports.LUA_TFUNCTION=A.constant_types.LUA_TFUNCTION,a.exports.LUA_TUSERDATA=A.constant_types.LUA_TUSERDATA,a.exports.LUA_TTHREAD=A.constant_types.LUA_TTHREAD,a.exports.LUA_VERSION=A.LUA_VERSION,a.exports.LUA_VERSION_MAJOR=A.LUA_VERSION_MAJOR,a.exports.LUA_VERSION_MINOR=A.LUA_VERSION_MINOR,a.exports.LUA_VERSION_NUM=A.LUA_VERSION_NUM,a.exports.LUA_VERSION_RELEASE=A.LUA_VERSION_RELEASE,a.exports.LUA_YIELD=A.thread_status.LUA_YIELD,a.exports.lua_Debug=A.lua_Debug,a.exports.lua_upvalueindex=A.lua_upvalueindex,a.exports.lua_absindex=v.lua_absindex,a.exports.lua_arith=v.lua_arith,a.exports.lua_atpanic=v.lua_atpanic,a.exports.lua_atnativeerror=v.lua_atnativeerror,a.exports.lua_call=v.lua_call,a.exports.lua_callk=v.lua_callk,a.exports.lua_checkstack=v.lua_checkstack,a.exports.lua_close=I.lua_close,a.exports.lua_compare=v.lua_compare,a.exports.lua_concat=v.lua_concat,a.exports.lua_copy=v.lua_copy,a.exports.lua_createtable=v.lua_createtable,a.exports.lua_dump=v.lua_dump,a.exports.lua_error=v.lua_error,a.exports.lua_gc=v.lua_gc,a.exports.lua_getallocf=v.lua_getallocf,a.exports.lua_getextraspace=v.lua_getextraspace,a.exports.lua_getfield=v.lua_getfield,a.exports.lua_getglobal=v.lua_getglobal,a.exports.lua_gethook=D.lua_gethook,a.exports.lua_gethookcount=D.lua_gethookcount,a.exports.lua_gethookmask=D.lua_gethookmask,a.exports.lua_geti=v.lua_geti,a.exports.lua_getinfo=D.lua_getinfo,a.exports.lua_getlocal=D.lua_getlocal,a.exports.lua_getmetatable=v.lua_getmetatable,a.exports.lua_getstack=D.lua_getstack,a.exports.lua_gettable=v.lua_gettable,a.exports.lua_gettop=v.lua_gettop,a.exports.lua_getupvalue=v.lua_getupvalue,a.exports.lua_getuservalue=v.lua_getuservalue,a.exports.lua_insert=v.lua_insert,a.exports.lua_isboolean=v.lua_isboolean,a.exports.lua_iscfunction=v.lua_iscfunction,a.exports.lua_isfunction=v.lua_isfunction,a.exports.lua_isinteger=v.lua_isinteger,a.exports.lua_islightuserdata=v.lua_islightuserdata,a.exports.lua_isnil=v.lua_isnil,a.exports.lua_isnone=v.lua_isnone,a.exports.lua_isnoneornil=v.lua_isnoneornil,a.exports.lua_isnumber=v.lua_isnumber,a.exports.lua_isproxy=v.lua_isproxy,a.exports.lua_isstring=v.lua_isstring,a.exports.lua_istable=v.lua_istable,a.exports.lua_isthread=v.lua_isthread,a.exports.lua_isuserdata=v.lua_isuserdata,a.exports.lua_isyieldable=R.lua_isyieldable,a.exports.lua_len=v.lua_len,a.exports.lua_load=v.lua_load,a.exports.lua_newstate=I.lua_newstate,a.exports.lua_newtable=v.lua_newtable,a.exports.lua_newthread=I.lua_newthread,a.exports.lua_newuserdata=v.lua_newuserdata,a.exports.lua_next=v.lua_next,a.exports.lua_pcall=v.lua_pcall,a.exports.lua_pcallk=v.lua_pcallk,a.exports.lua_pop=v.lua_pop,a.exports.lua_pushboolean=v.lua_pushboolean,a.exports.lua_pushcclosure=v.lua_pushcclosure,a.exports.lua_pushcfunction=v.lua_pushcfunction,a.exports.lua_pushfstring=v.lua_pushfstring,a.exports.lua_pushglobaltable=v.lua_pushglobaltable,a.exports.lua_pushinteger=v.lua_pushinteger,a.exports.lua_pushjsclosure=v.lua_pushjsclosure,a.exports.lua_pushjsfunction=v.lua_pushjsfunction,a.exports.lua_pushlightuserdata=v.lua_pushlightuserdata,a.exports.lua_pushliteral=v.lua_pushliteral,a.exports.lua_pushlstring=v.lua_pushlstring,a.exports.lua_pushnil=v.lua_pushnil,a.exports.lua_pushnumber=v.lua_pushnumber,a.exports.lua_pushstring=v.lua_pushstring,a.exports.lua_pushthread=v.lua_pushthread,a.exports.lua_pushvalue=v.lua_pushvalue,a.exports.lua_pushvfstring=v.lua_pushvfstring,a.exports.lua_rawequal=v.lua_rawequal,a.exports.lua_rawget=v.lua_rawget,a.exports.lua_rawgeti=v.lua_rawgeti,a.exports.lua_rawgetp=v.lua_rawgetp,a.exports.lua_rawlen=v.lua_rawlen,a.exports.lua_rawset=v.lua_rawset,a.exports.lua_rawseti=v.lua_rawseti,a.exports.lua_rawsetp=v.lua_rawsetp,a.exports.lua_register=v.lua_register,a.exports.lua_remove=v.lua_remove,a.exports.lua_replace=v.lua_replace,a.exports.lua_resume=R.lua_resume,a.exports.lua_rotate=v.lua_rotate,a.exports.lua_setallof=R.lua_setallof,a.exports.lua_setfield=v.lua_setfield,a.exports.lua_setglobal=v.lua_setglobal,a.exports.lua_sethook=D.lua_sethook,a.exports.lua_seti=v.lua_seti,a.exports.lua_setlocal=D.lua_setlocal,a.exports.lua_setmetatable=v.lua_setmetatable,a.exports.lua_settable=v.lua_settable,a.exports.lua_settop=v.lua_settop,a.exports.lua_setupvalue=v.lua_setupvalue,a.exports.lua_setuservalue=v.lua_setuservalue,a.exports.lua_status=v.lua_status,a.exports.lua_stringtonumber=v.lua_stringtonumber,a.exports.lua_toboolean=v.lua_toboolean,a.exports.lua_todataview=v.lua_todataview,a.exports.lua_tointeger=v.lua_tointeger,a.exports.lua_tointegerx=v.lua_tointegerx,a.exports.lua_tojsstring=v.lua_tojsstring,a.exports.lua_tolstring=v.lua_tolstring,a.exports.lua_tonumber=v.lua_tonumber,a.exports.lua_tonumberx=v.lua_tonumberx,a.exports.lua_topointer=v.lua_topointer,a.exports.lua_toproxy=v.lua_toproxy,a.exports.lua_tostring=v.lua_tostring,a.exports.lua_tothread=v.lua_tothread,a.exports.lua_touserdata=v.lua_touserdata,a.exports.lua_type=v.lua_type,a.exports.lua_typename=v.lua_typename,a.exports.lua_upvalueid=v.lua_upvalueid,a.exports.lua_upvaluejoin=v.lua_upvaluejoin,a.exports.lua_version=v.lua_version,a.exports.lua_xmove=v.lua_xmove,a.exports.lua_yield=R.lua_yield,a.exports.lua_yieldk=R.lua_yieldk,a.exports.lua_tocfunction=v.lua_tocfunction},function(a,B,d){const A={},{LUA_VERSION_MAJOR:v,LUA_VERSION_MINOR:D,to_luastring:R}=d(1);a.exports.LUA_PATH_SEP=";",a.exports.LUA_PATH_MARK="?",a.exports.LUA_EXEC_DIR="!";const I=v+"."+D;a.exports.LUA_VDIR=I;{a.exports.LUA_DIRSEP="/";const ce="./lua/"+I+"/";a.exports.LUA_LDIR=ce;const $=ce;a.exports.LUA_JSDIR=$;const ve=R(ce+"?.lua;"+ce+"?/init.lua;./?.lua;./?/init.lua");a.exports.LUA_PATH_DEFAULT=ve;const se=R($+"?.js;"+$+"loadall.js;./?.js");a.exports.LUA_JSPATH_DEFAULT=se}const z=A.LUA_COMPAT_FLOATSTRING||!1,S=A.LUAI_MAXSTACK||1e6,H=A.LUA_IDSIZE||59,b=A.LUAL_BUFFERSIZE||8192,F=function(Q,ce){for(var $=Math.min(3,Math.ceil(Math.abs(ce)/1023)),ve=Q,se=0;se<$;se++)ve*=Math.pow(2,Math.floor((ce+se)/$));return ve};a.exports.LUAI_MAXSTACK=S,a.exports.LUA_COMPAT_FLOATSTRING=z,a.exports.LUA_IDSIZE=H,a.exports.LUA_INTEGER_FMT="%d",a.exports.LUA_INTEGER_FRMLEN="",a.exports.LUA_MAXINTEGER=2147483647,a.exports.LUA_MININTEGER=-2147483648,a.exports.LUA_NUMBER_FMT="%.14g",a.exports.LUA_NUMBER_FRMLEN="",a.exports.LUAL_BUFFERSIZE=b,a.exports.frexp=function(Q){if(Q===0)return[Q,0];var ce=new DataView(new ArrayBuffer(8));ce.setFloat64(0,Q);var $=ce.getUint32(0)>>>20&2047;$===0&&(ce.setFloat64(0,Q*Math.pow(2,64)),$=(ce.getUint32(0)>>>20&2047)-64);var ve=$-1022;return[F(Q,-ve),ve]},a.exports.ldexp=F,a.exports.lua_getlocaledecpoint=function(){return 46},a.exports.lua_integer2str=function(Q){return String(Q)},a.exports.lua_number2str=function(Q){return String(Number(Q.toPrecision(14)))},a.exports.lua_numbertointeger=function(Q){return Q>=-2147483648&&Q<2147483648&&Q},a.exports.luai_apicheck=function(Q,ce){if(!ce)throw Error(ce)}},function(a,B,d){const{luai_apicheck:A}=d(3),v=function(D){if(!D)throw Error("assertion failed")};a.exports.lua_assert=v,a.exports.luai_apicheck=A||function(D,R){return v(R)},a.exports.api_check=function(D,R,I){return A(D,R&&I)},a.exports.LUAI_MAXCCALLS=200,a.exports.LUA_MINBUFFER=32,a.exports.luai_nummod=function(D,R,I){let z=R%I;return z*I<0&&(z+=I),z},a.exports.MAX_INT=2147483647,a.exports.MIN_INT=-2147483648},function(a,B,d){const A=d(1),v=`Fengari 0.1.4  Copyright (C) 2017-2018 B. Giannangeli, Daurnimator
Based on: `+A.LUA_COPYRIGHT;a.exports.FENGARI_AUTHORS="B. Giannangeli, Daurnimator",a.exports.FENGARI_COPYRIGHT=v,a.exports.FENGARI_RELEASE="Fengari 0.1.4",a.exports.FENGARI_VERSION="Fengari 0.1",a.exports.FENGARI_VERSION_MAJOR="0",a.exports.FENGARI_VERSION_MINOR="1",a.exports.FENGARI_VERSION_NUM=1,a.exports.FENGARI_VERSION_RELEASE="4",a.exports.is_luastring=A.is_luastring,a.exports.luastring_eq=A.luastring_eq,a.exports.luastring_from=A.luastring_from,a.exports.luastring_indexOf=A.luastring_indexOf,a.exports.luastring_of=A.luastring_of,a.exports.to_jsstring=A.to_jsstring,a.exports.to_luastring=A.to_luastring,a.exports.to_uristring=A.to_uristring,a.exports.from_userstring=A.from_userstring},function(a,B,d){const{LUA_OPADD:A,LUA_OPBAND:v,LUA_OPBNOT:D,LUA_OPBOR:R,LUA_OPBXOR:I,LUA_OPDIV:z,LUA_OPIDIV:S,LUA_OPMOD:H,LUA_OPMUL:b,LUA_OPPOW:F,LUA_OPSHL:Q,LUA_OPSHR:ce,LUA_OPSUB:$,LUA_OPUNM:ve,constant_types:{LUA_NUMTAGS:se,LUA_TBOOLEAN:$e,LUA_TCCL:nn,LUA_TFUNCTION:Ke,LUA_TLCF:qe,LUA_TLCL:on,LUA_TLIGHTUSERDATA:P,LUA_TLNGSTR:re,LUA_TNIL:be,LUA_TNUMBER:ge,LUA_TNUMFLT:Oe,LUA_TNUMINT:tn,LUA_TSHRSTR:an,LUA_TSTRING:sn,LUA_TTABLE:ae,LUA_TTHREAD:oe,LUA_TUSERDATA:ze},from_userstring:C,luastring_indexOf:Ce,luastring_of:T,to_jsstring:g,to_luastring:L}=d(1),{lisdigit:xe,lisprint:we,lisspace:pn,lisxdigit:Ze}=d(22),dn=d(11),mn=d(8),Y=d(12),{luaS_bless:ee,luaS_new:Ie}=d(10),Te=d(9),{LUA_COMPAT_FLOATSTRING:rn,ldexp:On,lua_integer2str:bn,lua_number2str:Je}=d(3),ie=d(15),{MAX_INT:Ue,luai_nummod:N,lua_assert:me}=d(4),He=d(14),G=se,Ae=se+1;class Pe{constructor(s,_){this.type=s,this.value=_}ttype(){return 63&this.type}ttnov(){return 15&this.type}checktag(s){return this.type===s}checktype(s){return this.ttnov()===s}ttisnumber(){return this.checktype(ge)}ttisfloat(){return this.checktag(Oe)}ttisinteger(){return this.checktag(tn)}ttisnil(){return this.checktag(be)}ttisboolean(){return this.checktag($e)}ttislightuserdata(){return this.checktag(P)}ttisstring(){return this.checktype(sn)}ttisshrstring(){return this.checktag(an)}ttislngstring(){return this.checktag(re)}ttistable(){return this.checktag(ae)}ttisfunction(){return this.checktype(Ke)}ttisclosure(){return(31&this.type)===Ke}ttisCclosure(){return this.checktag(nn)}ttisLclosure(){return this.checktag(on)}ttislcf(){return this.checktag(qe)}ttisfulluserdata(){return this.checktag(ze)}ttisthread(){return this.checktag(oe)}ttisdeadkey(){return this.checktag(Ae)}l_isfalse(){return this.ttisnil()||this.ttisboolean()&&this.value===!1}setfltvalue(s){this.type=Oe,this.value=s}chgfltvalue(s){me(this.type==Oe),this.value=s}setivalue(s){this.type=tn,this.value=s}chgivalue(s){me(this.type==tn),this.value=s}setnilvalue(){this.type=be,this.value=null}setfvalue(s){this.type=qe,this.value=s}setpvalue(s){this.type=P,this.value=s}setbvalue(s){this.type=$e,this.value=s}setsvalue(s){this.type=re,this.value=s}setuvalue(s){this.type=ze,this.value=s}setthvalue(s){this.type=oe,this.value=s}setclLvalue(s){this.type=on,this.value=s}setclCvalue(s){this.type=nn,this.value=s}sethvalue(s){this.type=ae,this.value=s}setdeadvalue(){this.type=Ae,this.value=null}setfrom(s){this.type=s.type,this.value=s.value}tsvalue(){return me(this.ttisstring()),this.value}svalue(){return this.tsvalue().getstr()}vslen(){return this.tsvalue().tsslen()}jsstring(s,_){return g(this.svalue(),s,_,!0)}}const Nn=function(i,s,_){i.stack[s].setsvalue(_)},Un=new Pe(be,null);Object.freeze(Un),a.exports.luaO_nilobject=Un;class Mn{constructor(s,_){this.id=s.l_G.id_counter++,this.p=null,this.nupvalues=_,this.upvals=new Array(_)}}class Zn{constructor(s,_,c){for(this.id=s.l_G.id_counter++,this.f=_,this.nupvalues=c,this.upvalue=new Array(c);c--;)this.upvalue[c]=new Pe(be,null)}}class ot{constructor(s,_){this.id=s.l_G.id_counter++,this.metatable=null,this.uservalue=new Pe(be,null),this.len=_,this.data=Object.create(null)}}const o=L("..."),de=L('[string "'),h=L('"]'),X=function(i){return xe(i)?i-48:(223&i)-55},V=function(i,s){let _=1;if(me(s<=1114111),s<128)i[7]=s;else{let c=63;do i[8-_++]=128|63&s,s>>=6,c>>=1;while(s>c);i[8-_]=~c<<1|s}return _},J=function(i,s){let _=s==="x"?(function(c){let m,O=0,y=0,ne=0,en=0,gn=0,Bn=!1;for(;pn(c[O]);)O++;if(((m=c[O]===45)||c[O]===43)&&O++,c[O]!==48||c[O+1]!==120&&c[O+1]!==88)return null;for(O+=2;;O++)if(c[O]===46){if(Bn)break;Bn=!0}else{if(!Ze(c[O]))break;ne===0&&c[O]===48?en++:++ne<=30?y=16*y+X(c[O]):gn++,Bn&&gn--}if(en+ne===0)return null;if(gn*=4,c[O]===112||c[O]===80){let Kn,pe=0;if(((Kn=c[++O]===45)||c[O]===43)&&O++,!xe(c[O]))return null;for(;xe(c[O]);)pe=10*pe+c[O++]-48;Kn&&(pe=-pe),gn+=pe}return m&&(y=-y),{n:On(y,gn),i:O}})(i):(function(c){try{c=g(c)}catch{return null}let m=/^[\t\v\f \n\r]*[+-]?(?:[0-9]+\.?[0-9]*|\.[0-9]*)(?:[eE][+-]?[0-9]+)?/.exec(c);if(!m)return null;let O=parseFloat(m[0]);return isNaN(O)?null:{n:O,i:m[0].length}})(i);if(_===null)return null;for(;pn(i[_.i]);)_.i++;return _.i===i.length||i[_.i]===0?_:null},f=[46,120,88,110,78],M={46:".",120:"x",88:"x",110:"n",78:"n"},te=Math.floor(Ue/10),Ee=Ue%10,Se=function(i,s){let _;if(s.ttisinteger())_=L(bn(s.value));else{let c=Je(s.value);!rn&&/^[-0123456789]+$/.test(c)&&(c+=".0"),_=L(c)}s.setsvalue(ee(i,_))},De=function(i,s){mn.luaD_inctop(i),Nn(i,i.top-1,Ie(i,s))},Xe=function(i,s,_){let c,m=0,O=0,y=0;for(;(c=Ce(s,37,O))!=-1;){switch(De(i,s.subarray(O,c)),s[c+1]){case 115:{let ne=_[y++];if(ne===null)ne=L("(null)",!0);else{ne=C(ne);let en=Ce(ne,0);en!==-1&&(ne=ne.subarray(0,en))}De(i,ne);break}case 99:{let ne=_[y++];we(ne)?De(i,T(ne)):Fe(i,L("<\\%d>",!0),ne);break}case 100:case 73:mn.luaD_inctop(i),i.stack[i.top-1].setivalue(_[y++]),Se(i,i.stack[i.top-1]);break;case 102:mn.luaD_inctop(i),i.stack[i.top-1].setfltvalue(_[y++]),Se(i,i.stack[i.top-1]);break;case 112:{let ne=_[y++];if(ne instanceof Y.lua_State||ne instanceof Te.Table||ne instanceof ot||ne instanceof Mn||ne instanceof Zn)De(i,L("0x"+ne.id.toString(16)));else switch(typeof ne){case"undefined":De(i,L("undefined"));break;case"number":De(i,L("Number("+ne+")"));break;case"string":De(i,L("String("+JSON.stringify(ne)+")"));break;case"boolean":De(i,L(ne?"Boolean(true)":"Boolean(false)"));break;case"object":if(ne===null){De(i,L("null"));break}case"function":{let en=i.l_G.ids.get(ne);en||(en=i.l_G.id_counter++,i.l_G.ids.set(ne,en)),De(i,L("0x"+en.toString(16)));break}default:De(i,L("<id NYI>"))}break}case 85:{let ne=new Uint8Array(8),en=V(ne,_[y++]);De(i,ne.subarray(8-en));break}case 37:De(i,L("%",!0));break;default:dn.luaG_runerror(i,L("invalid option '%%%c' to 'lua_pushfstring'"),s[c+1])}m+=2,O=c+2}return mn.luaD_checkstack(i,1),De(i,s.subarray(O)),m>0&&ie.luaV_concat(i,m+1),i.stack[i.top-1].svalue()},Fe=function(i,s,..._){return Xe(i,s,_)},Ve=function(i,s,_,c){switch(s){case A:return _+c|0;case $:return _-c|0;case b:return ie.luaV_imul(_,c);case H:return ie.luaV_mod(i,_,c);case S:return ie.luaV_div(i,_,c);case v:return _&c;case R:return _|c;case I:return _^c;case Q:return ie.luaV_shiftl(_,c);case ce:return ie.luaV_shiftl(_,-c);case ve:return 0-_|0;case D:return-1^_;default:me(0)}},vn=function(i,s,_,c){switch(s){case A:return _+c;case $:return _-c;case b:return _*c;case z:return _/c;case F:return Math.pow(_,c);case S:return Math.floor(_/c);case ve:return-_;case H:return N(i,_,c);default:me(0)}};a.exports.CClosure=Zn,a.exports.LClosure=Mn,a.exports.LUA_TDEADKEY=Ae,a.exports.LUA_TPROTO=G,a.exports.LocVar=class{constructor(){this.varname=null,this.startpc=NaN,this.endpc=NaN}},a.exports.TValue=Pe,a.exports.Udata=ot,a.exports.UTF8BUFFSZ=8,a.exports.luaO_arith=function(i,s,_,c,m){let O=typeof m=="number"?i.stack[m]:m;switch(s){case v:case R:case I:case Q:case ce:case D:{let y,ne;if((y=ie.tointeger(_))!==!1&&(ne=ie.tointeger(c))!==!1)return void O.setivalue(Ve(i,s,y,ne));break}case z:case F:{let y,ne;if((y=ie.tonumber(_))!==!1&&(ne=ie.tonumber(c))!==!1)return void O.setfltvalue(vn(i,s,y,ne));break}default:{let y,ne;if(_.ttisinteger()&&c.ttisinteger())return void O.setivalue(Ve(i,s,_.value,c.value));if((y=ie.tonumber(_))!==!1&&(ne=ie.tonumber(c))!==!1)return void O.setfltvalue(vn(i,s,y,ne));break}}me(i!==null),He.luaT_trybinTM(i,_,c,m,s-A+He.TMS.TM_ADD)},a.exports.luaO_chunkid=function(i,s){let _,c=i.length;if(i[0]===61)c<s?(_=new Uint8Array(c-1)).set(i.subarray(1)):(_=new Uint8Array(s)).set(i.subarray(1,s+1));else if(i[0]===64)c<=s?(_=new Uint8Array(c-1)).set(i.subarray(1)):((_=new Uint8Array(s)).set(o),s-=o.length,_.set(i.subarray(c-s),o.length));else{_=new Uint8Array(s);let m=Ce(i,10);_.set(de);let O=de.length;c<(s-=de.length+o.length+h.length)&&m===-1?(_.set(i,O),O+=i.length):(m!==-1&&(c=m),c>s&&(c=s),_.set(i.subarray(0,c),O),O+=c,_.set(o,O),O+=o.length),_.set(h,O),O+=h.length,_=_.subarray(0,O)}return _},a.exports.luaO_hexavalue=X,a.exports.luaO_int2fb=function(i){let s=0;if(i<8)return i;for(;i>=128;)i=i+15>>4,s+=4;for(;i>=16;)i=i+1>>1,s++;return s+1<<3|i-8},a.exports.luaO_pushfstring=Fe,a.exports.luaO_pushvfstring=Xe,a.exports.luaO_str2num=function(i,s){let _=(function(c){let m,O=0,y=0,ne=!0;for(;pn(c[O]);)O++;if(((m=c[O]===45)||c[O]===43)&&O++,c[O]!==48||c[O+1]!==120&&c[O+1]!==88)for(;O<c.length&&xe(c[O]);O++){let en=c[O]-48;if(y>=te&&(y>te||en>Ee+m))return null;y=10*y+en|0,ne=!1}else for(O+=2;O<c.length&&Ze(c[O]);O++)y=16*y+X(c[O])|0,ne=!1;for(;O<c.length&&pn(c[O]);)O++;return ne||O!==c.length&&c[O]!==0?null:{n:0|(m?-y:y),i:O}})(i);return _!==null?(s.setivalue(_.n),_.i+1):(_=(function(c){let m=c.length,O=0;for(let ne=0;ne<m;ne++){let en=c[ne];if(f.indexOf(en)!==-1){O=en;break}}let y=M[O];return y==="n"?null:J(c,y)})(i))!==null?(s.setfltvalue(_.n),_.i+1):0},a.exports.luaO_tostring=Se,a.exports.luaO_utf8esc=V,a.exports.numarith=vn,a.exports.pushobj2s=function(i,s){i.stack[i.top++]=new Pe(s.type,s.value)},a.exports.pushsvalue2s=function(i,s){i.stack[i.top++]=new Pe(re,s)},a.exports.setobjs2s=function(i,s,_){i.stack[s].setfrom(i.stack[_])},a.exports.setobj2s=function(i,s,_){i.stack[s].setfrom(_)},a.exports.setsvalue2s=Nn},function(a,B,d){const{LUAL_BUFFERSIZE:A}=d(3),{LUA_ERRERR:v,LUA_MULTRET:D,LUA_REGISTRYINDEX:R,LUA_SIGNATURE:I,LUA_TBOOLEAN:z,LUA_TLIGHTUSERDATA:S,LUA_TNIL:H,LUA_TNONE:b,LUA_TNUMBER:F,LUA_TSTRING:Q,LUA_TTABLE:ce,LUA_VERSION_NUM:$,lua_Debug:ve,lua_absindex:se,lua_atpanic:$e,lua_call:nn,lua_checkstack:Ke,lua_concat:qe,lua_copy:on,lua_createtable:P,lua_error:re,lua_getfield:be,lua_getinfo:ge,lua_getmetatable:Oe,lua_getstack:tn,lua_gettop:an,lua_insert:sn,lua_isinteger:ae,lua_isnil:oe,lua_isnumber:ze,lua_isstring:C,lua_istable:Ce,lua_len:T,lua_load:g,lua_newstate:L,lua_newtable:xe,lua_next:we,lua_pcall:pn,lua_pop:Ze,lua_pushboolean:dn,lua_pushcclosure:mn,lua_pushcfunction:Y,lua_pushfstring:ee,lua_pushinteger:Ie,lua_pushliteral:Te,lua_pushlstring:rn,lua_pushnil:On,lua_pushstring:bn,lua_pushvalue:Je,lua_pushvfstring:ie,lua_rawequal:Ue,lua_rawget:N,lua_rawgeti:me,lua_rawlen:He,lua_rawseti:G,lua_remove:Ae,lua_setfield:Pe,lua_setglobal:Nn,lua_setmetatable:Un,lua_settop:Mn,lua_toboolean:Zn,lua_tointeger:ot,lua_tointegerx:o,lua_tojsstring:de,lua_tolstring:h,lua_tonumber:X,lua_tonumberx:V,lua_topointer:J,lua_tostring:f,lua_touserdata:M,lua_type:te,lua_typename:Ee,lua_version:Se}=d(2),{from_userstring:De,luastring_eq:Xe,to_luastring:Fe,to_uristring:Ve}=d(5),vn=v+1,i=Fe("_LOADED"),s=Fe("_PRELOAD"),_=Fe("FILE*"),c=Fe("__name"),m=Fe("__tostring"),O=new Uint8Array(0);class y{constructor(){this.L=null,this.b=O,this.n=0}}const ne=function(k,j,Ne){if(Ne===0||!Ce(k,-1))return 0;for(On(k);we(k,-2);){if(te(k,-2)===Q){if(Ue(k,j,-1))return Ze(k,1),1;if(ne(k,j,Ne-1))return Ae(k,-2),Te(k,"."),sn(k,-2),qe(k,3),1}Ze(k,1)}return 0},en=function(k,j){let Ne=an(k);if(ge(k,Fe("f"),j),be(k,R,i),ne(k,Ne+1,2)){let kn=f(k,-1);return kn[0]===95&&kn[1]===71&&kn[2]===46&&(bn(k,kn.subarray(3)),Ae(k,-2)),on(k,-1,Ne+1),Ze(k,2),1}return Mn(k,Ne),0},gn=function(k,j){en(k,j)?(ee(k,Fe("function '%s'"),f(k,-1)),Ae(k,-2)):j.namewhat.length!==0?ee(k,Fe("%s '%s'"),j.namewhat,j.name):j.what&&j.what[0]===109?Te(k,"main chunk"):j.what&&j.what[0]===76?ee(k,Fe("function <%s:%d>"),j.short_src,j.linedefined):Te(k,"?")},Bn=function(k){let j="PANIC: unprotected error in call to Lua API ("+de(k,-1)+")";throw new Error(j)},Kn=function(k,j,Ne){let kn=new ve;return tn(k,0,kn)?(ge(k,Fe("n"),kn),Xe(kn.namewhat,Fe("method"))&&--j===0?U(k,Fe("calling '%s' on bad self (%s)"),kn.name,Ne):(kn.name===null&&(kn.name=en(k,kn)?f(k,-1):Fe("?")),U(k,Fe("bad argument #%d to '%s' (%s)"),j,kn.name,Ne))):U(k,Fe("bad argument #%d (%s)"),j,Ne)},pe=function(k,j,Ne){let kn;kn=un(k,j,c)===Q?f(k,-1):te(k,j)===S?Fe("light userdata",!0):Pn(k,j);let Wn=ee(k,Fe("%s expected, got %s"),Ne,kn);return Kn(k,j,Wn)},fn=function(k,j){let Ne=new ve;tn(k,j,Ne)&&(ge(k,Fe("Sl",!0),Ne),Ne.currentline>0)?ee(k,Fe("%s:%d: "),Ne.short_src,Ne.currentline):bn(k,Fe(""))},U=function(k,j,...Ne){return fn(k,1),ie(k,j,Ne),qe(k,2),re(k)},Me=function(k,j,Ne,kn){if(j)return dn(k,1),1;{let Wn,st;return On(k),kn?(Wn=kn.message,st=-kn.errno):(Wn="Success",st=0),Ne?ee(k,Fe("%s: %s"),Ne,Fe(Wn)):bn(k,Fe(Wn)),Ie(k,st),3}},fe=function(k,j){return be(k,R,j)},yn=function(k,j,Ne){let kn=M(k,j);return kn!==null&&Oe(k,j)?(fe(k,Ne),Ue(k,-1,-2)||(kn=null),Ze(k,2),kn):null},Dn=function(k,j,Ne){pe(k,j,Ee(k,Ne))},Pn=function(k,j){return Ee(k,te(k,j))},In=function(k,j){let Ne=h(k,j);return Ne!=null||Dn(k,j,Q),Ne},$n=In,ht=function(k,j,Ne){return te(k,j)<=0?Ne===null?null:De(Ne):In(k,j)},Fn=ht,Jn=function(k,j){let Ne=V(k,j);return Ne===!1&&Dn(k,j,F),Ne},Vn=function(k,j){let Ne=o(k,j);return Ne===!1&&(function(kn,Wn){ze(kn,Wn)?Kn(kn,Wn,Fe("number has no integer representation",!0)):Dn(kn,Wn,F)})(k,j),Ne},ut=function(k,j){let Ne=k.n+j;if(k.b.length<Ne){let kn=Math.max(2*k.b.length,Ne),Wn=new Uint8Array(kn);Wn.set(k.b),k.b=Wn}return k.b.subarray(k.n,Ne)},lt=function(k,j){j.L=k,j.b=O},Ct=function(k,j,Ne){Ne>0&&(j=De(j),ut(k,Ne).set(j.subarray(0,Ne)),At(k,Ne))},pt=function(k,j){j=De(j),Ct(k,j,j.length)},Dt=function(k){rn(k.L,k.b,k.n),k.n=0,k.b=O},At=function(k,j){k.n+=j},E=function(k,j,Ne,kn){return te(k,Ne)<=0?kn:j(k,Ne)},le=function(k,j){let Ne=j.string;return j.string=null,Ne},cn=function(k,j,Ne,kn,Wn){return g(k,le,{string:j},kn,Wn)},ln=function(k,j,Ne,kn){return cn(k,j,0,kn,null)},wn=function(k,j){return ln(k,j,j.length,j)},un=function(k,j,Ne){if(Oe(k,j)){bn(k,Ne);let kn=N(k,-2);return kn===H?Ze(k,2):Ae(k,-2),kn}return H},_n=function(k,j,Ne){return j=se(k,j),un(k,j,Ne)!==H&&(Je(k,j),nn(k,1,1),!0)},We=Fe("%I"),xn=Fe("%f"),Ln=function(k,j,Ne){var kn=Ne>>>0,Wn=j.length,st=k.length+1-Wn;e:for(;kn<st;kn++){for(let Et=0;Et<Wn;Et++)if(k[kn+Et]!==j[Et])continue e;return kn}return-1},p=function(k,j,Ne){return be(k,j,Ne)===ce||(Ze(k,1),j=se(k,j),xe(k),Je(k,-1),Pe(k,j,Ne),!1)},q=function(k,j,Ne){K(k,Ne,Fe("too many upvalues",!0));for(let kn in j){for(let Wn=0;Wn<Ne;Wn++)Je(k,-Ne);mn(k,j[kn],Ne),Pe(k,-(Ne+2),Fe(kn))}Ze(k,Ne)},K=function(k,j,Ne){Ke(k,j)||(Ne?U(k,Fe("stack overflow (%s)"),Ne):U(k,Fe("stack overflow",!0)))},ye=function(k,j,Ne,kn){let Wn=kn.message,st=f(k,Ne).subarray(1);return ee(k,Fe("cannot %s %s: %s"),Fe(j),st,Fe(Wn)),Ae(k,Ne),vn};let he;const _e=[239,187,191],Sn=function(k){let j=(function(Ne){let kn;Ne.n=0;let Wn=0;do{if((kn=he(Ne))===null||kn!==_e[Wn])return kn;Wn++,Ne.buff[Ne.n++]=kn}while(Wn<_e.length);return Ne.n=0,he(Ne)})(k);if(j===35){do j=he(k);while(j&&j!==10);return{skipped:!0,c:he(k)}}return{skipped:!1,c:j}};let Gn;{class k{constructor(){this.n=NaN,this.f=null,this.buff=new Uint8Array(1024),this.pos=0,this.err=void 0}}const j=function(Ne,kn){let Wn=kn;if(Wn.f!==null&&Wn.n>0){let Et=Wn.n;return Wn.n=0,Wn.f=Wn.f.subarray(Wn.pos),Wn.buff.subarray(0,Et)}let st=Wn.f;return Wn.f=null,st};he=function(Ne){return Ne.pos<Ne.f.length?Ne.f[Ne.pos++]:null},Gn=function(Ne,kn,Wn){let st=new k,Et=an(Ne)+1;if(kn===null)throw new Error("Can't read stdin in the browser");{ee(Ne,Fe("@%s"),kn);let Mt=Ve(kn),mt=new XMLHttpRequest;if(mt.open("GET",Mt,!1),typeof window>"u"&&(mt.responseType="arraybuffer"),mt.send(),!(mt.status>=200&&mt.status<=299))return st.err=mt.status,ye(Ne,"open",Et,{message:`${mt.status}: ${mt.statusText}`});typeof mt.response=="string"?st.f=Fe(mt.response):st.f=new Uint8Array(mt.response)}let tr=Sn(st);tr.c===I[0]&&kn||tr.skipped&&(st.buff[st.n++]=10),tr.c!==null&&(st.buff[st.n++]=tr.c);let Ft=g(Ne,j,st,f(Ne,-1),Wn),Vt=st.err;return Vt?(Mn(Ne,Et),ye(Ne,"read",Et,Vt)):(Ae(Ne,Et),Ft)}}const zn=function(k,j){return Gn(k,j,null)},jn=function(k,j,Ne){let kn=Se(k);Ne!=72&&U(k,Fe("core and library have incompatible numeric types")),kn!=Se(null)?U(k,Fe("multiple Lua VMs detected")):kn!==j&&U(k,Fe("version mismatch: app. needs %f, Lua core provides %f"),j,kn)};a.exports.LUA_ERRFILE=vn,a.exports.LUA_FILEHANDLE=_,a.exports.LUA_LOADED_TABLE=i,a.exports.LUA_NOREF=-2,a.exports.LUA_PRELOAD_TABLE=s,a.exports.LUA_REFNIL=-1,a.exports.luaL_Buffer=y,a.exports.luaL_addchar=function(k,j){ut(k,1),k.b[k.n++]=j},a.exports.luaL_addlstring=Ct,a.exports.luaL_addsize=At,a.exports.luaL_addstring=pt,a.exports.luaL_addvalue=function(k){let j=k.L,Ne=f(j,-1);Ct(k,Ne,Ne.length),Ze(j,1)},a.exports.luaL_argcheck=function(k,j,Ne,kn){j||Kn(k,Ne,kn)},a.exports.luaL_argerror=Kn,a.exports.luaL_buffinit=lt,a.exports.luaL_buffinitsize=function(k,j,Ne){return lt(k,j),ut(j,Ne)},a.exports.luaL_callmeta=_n,a.exports.luaL_checkany=function(k,j){te(k,j)===b&&Kn(k,j,Fe("value expected",!0))},a.exports.luaL_checkinteger=Vn,a.exports.luaL_checklstring=In,a.exports.luaL_checknumber=Jn,a.exports.luaL_checkoption=function(k,j,Ne,kn){let Wn=Ne!==null?Fn(k,j,Ne):$n(k,j);for(let st=0;kn[st];st++)if(Xe(kn[st],Wn))return st;return Kn(k,j,ee(k,Fe("invalid option '%s'"),Wn))},a.exports.luaL_checkstack=K,a.exports.luaL_checkstring=$n,a.exports.luaL_checktype=function(k,j,Ne){te(k,j)!==Ne&&Dn(k,j,Ne)},a.exports.luaL_checkudata=function(k,j,Ne){let kn=yn(k,j,Ne);return kn===null&&pe(k,j,Ne),kn},a.exports.luaL_checkversion=function(k){jn(k,$,72)},a.exports.luaL_checkversion_=jn,a.exports.luaL_dofile=function(k,j){return zn(k,j)||pn(k,0,D,0)},a.exports.luaL_dostring=function(k,j){return wn(k,j)||pn(k,0,D,0)},a.exports.luaL_error=U,a.exports.luaL_execresult=function(k,j){let Ne,kn;if(j===null)return dn(k,1),Te(k,"exit"),Ie(k,0),3;if(j.status)Ne="exit",kn=j.status;else{if(!j.signal)return Me(k,0,null,j);Ne="signal",kn=j.signal}return On(k),Te(k,Ne),Ie(k,kn),3},a.exports.luaL_fileresult=Me,a.exports.luaL_getmetafield=un,a.exports.luaL_getmetatable=fe,a.exports.luaL_getsubtable=p,a.exports.luaL_gsub=function(k,j,Ne,kn){let Wn,st=new y;for(lt(k,st);(Wn=Ln(j,Ne))>=0;)Ct(st,j,Wn),pt(st,kn),j=j.subarray(Wn+Ne.length);return pt(st,j),Dt(st),f(k,-1)},a.exports.luaL_len=function(k,j){T(k,j);let Ne=o(k,-1);return Ne===!1&&U(k,Fe("object length is not an integer",!0)),Ze(k,1),Ne},a.exports.luaL_loadbuffer=ln,a.exports.luaL_loadbufferx=cn,a.exports.luaL_loadfile=zn,a.exports.luaL_loadfilex=Gn,a.exports.luaL_loadstring=wn,a.exports.luaL_newlib=function(k,j){P(k),q(k,j,0)},a.exports.luaL_newlibtable=function(k){P(k)},a.exports.luaL_newmetatable=function(k,j){return fe(k,j)!==H?0:(Ze(k,1),P(k,0,2),bn(k,j),Pe(k,-2,c),Je(k,-1),Pe(k,R,j),1)},a.exports.luaL_newstate=function(){let k=L();return k&&$e(k,Bn),k},a.exports.luaL_opt=E,a.exports.luaL_optinteger=function(k,j,Ne){return E(k,Vn,j,Ne)},a.exports.luaL_optlstring=ht,a.exports.luaL_optnumber=function(k,j,Ne){return E(k,Jn,j,Ne)},a.exports.luaL_optstring=Fn,a.exports.luaL_prepbuffer=function(k){return ut(k,A)},a.exports.luaL_prepbuffsize=ut,a.exports.luaL_pushresult=Dt,a.exports.luaL_pushresultsize=function(k,j){At(k,j),Dt(k)},a.exports.luaL_ref=function(k,j){let Ne;return oe(k,-1)?(Ze(k,1),-1):(j=se(k,j),me(k,j,0),Ne=ot(k,-1),Ze(k,1),Ne!==0?(me(k,j,Ne),G(k,j,0)):Ne=He(k,j)+1,G(k,j,Ne),Ne)},a.exports.luaL_requiref=function(k,j,Ne,kn){p(k,R,i),be(k,-1,j),Zn(k,-1)||(Ze(k,1),Y(k,Ne),bn(k,j),nn(k,1,1),Je(k,-1),Pe(k,-3,j)),Ae(k,-2),kn&&(Je(k,-1),Nn(k,j))},a.exports.luaL_setfuncs=q,a.exports.luaL_setmetatable=function(k,j){fe(k,j),Un(k,-2)},a.exports.luaL_testudata=yn,a.exports.luaL_tolstring=function(k,j){if(_n(k,j,m))C(k,-1)||U(k,Fe("'__tostring' must return a string"));else switch(te(k,j)){case F:ae(k,j)?ee(k,We,ot(k,j)):ee(k,xn,X(k,j));break;case Q:Je(k,j);break;case z:Te(k,Zn(k,j)?"true":"false");break;case H:Te(k,"nil");break;default:{let Ne=un(k,j,c),kn=Ne===Q?f(k,-1):Pn(k,j);ee(k,Fe("%s: %p"),kn,J(k,j)),Ne!==H&&Ae(k,-2);break}}return h(k,-1)},a.exports.luaL_traceback=function(k,j,Ne,kn){let Wn=new ve,st=an(k),Et=(function(Ft){let Vt=new ve,Mt=1,mt=1;for(;tn(Ft,mt,Vt);)Mt=mt,mt*=2;for(;Mt<mt;){let qt=Math.floor((Mt+mt)/2);tn(Ft,qt,Vt)?Mt=qt+1:mt=qt}return mt-1})(j),tr=Et-kn>21?10:-1;for(Ne&&ee(k,Fe(`%s
`),Ne),K(k,10,null),Te(k,"stack traceback:");tn(j,kn++,Wn);)tr--==0?(Te(k,`
	...`),kn=Et-11+1):(ge(j,Fe("Slnt",!0),Wn),ee(k,Fe(`
	%s:`),Wn.short_src),Wn.currentline>0&&Te(k,`${Wn.currentline}:`),Te(k," in "),gn(k,Wn),Wn.istailcall&&Te(k,`
	(...tail calls..)`),qe(k,an(k)-st));qe(k,an(k)-st)},a.exports.luaL_typename=Pn,a.exports.luaL_unref=function(k,j,Ne){Ne>=0&&(j=se(k,j),me(k,j,0),G(k,j,Ne),Ie(k,Ne),G(k,j,0))},a.exports.luaL_where=fn,a.exports.lua_writestringerror=function(){for(let k=0;k<arguments.length;k++){let j=arguments[k];do{let Ne=/([^\n]*)\n?([\d\D]*)/.exec(j);console.error(Ne[1]),j=Ne[2]}while(j!=="")}}},function(a,B,d){const{LUA_HOOKCALL:A,LUA_HOOKRET:v,LUA_HOOKTAILCALL:D,LUA_MASKCALL:R,LUA_MASKLINE:I,LUA_MASKRET:z,LUA_MINSTACK:S,LUA_MULTRET:H,LUA_SIGNATURE:b,constant_types:{LUA_TCCL:F,LUA_TLCF:Q,LUA_TLCL:ce,LUA_TNIL:$},thread_status:{LUA_ERRMEM:ve,LUA_ERRERR:se,LUA_ERRRUN:$e,LUA_ERRSYNTAX:nn,LUA_OK:Ke,LUA_YIELD:qe},lua_Debug:on,luastring_indexOf:P,to_luastring:re}=d(1),be=d(18),ge=d(11),Oe=d(13),{api_check:tn,lua_assert:an,LUAI_MAXCCALLS:sn}=d(4),ae=d(6),oe=d(16),ze=d(23),C=d(12),{luaS_newliteral:Ce}=d(10),T=d(14),{LUAI_MAXSTACK:g}=d(3),L=d(36),xe=d(15),{MBuffer:we}=d(19),pn=function(h,X){if(h.top<X)for(;h.top<X;)h.stack[h.top++]=new ae.TValue($,null);else for(;h.top>X;)delete h.stack[--h.top]},Ze=function(h,X,V){let J=h.top;for(;h.top<V+1;)h.stack[h.top++]=new ae.TValue($,null);switch(X){case ve:ae.setsvalue2s(h,V,Ce(h,"not enough memory"));break;case se:ae.setsvalue2s(h,V,Ce(h,"error in error handling"));break;default:ae.setobjs2s(h,V,J-1)}for(;h.top>V+1;)delete h.stack[--h.top]},dn=g+200,mn=function(h,X){an(X<=g||X==dn),an(h.stack_last==h.stack.length-C.EXTRA_STACK),h.stack.length=X,h.stack_last=X-C.EXTRA_STACK},Y=function(h,X){let V=h.stack.length;if(V>g)me(h,se);else{let J=h.top+X+C.EXTRA_STACK,f=2*V;f>g&&(f=g),f<J&&(f=J),f>g?(mn(h,dn),ge.luaG_runerror(h,re("stack overflow",!0))):mn(h,f)}},ee=function(h,X){h.stack_last-h.top<=X&&Y(h,X)},Ie=function(h){let X=(function(J){let f=J.top;for(let M=J.ci;M!==null;M=M.previous)f<M.top&&(f=M.top);return an(f<=J.stack_last),f+1})(h),V=X+Math.floor(X/8)+2*C.EXTRA_STACK;V>g&&(V=g),h.stack.length>g&&C.luaE_freeCI(h),X<=g-C.EXTRA_STACK&&V<h.stack.length&&mn(h,V)},Te=function(h,X,V){let J=h.stack[X];switch(J.type){case F:case Q:{let f=J.type===F?J.value.f:J.value;ee(h,S);let M=C.luaE_extendCI(h);M.funcOff=X,M.nresults=V,M.func=J,M.top=h.top+S,an(M.top<=h.stack_last),M.callstatus=0,h.hookmask&R&&bn(h,A,-1);let te=f(h);if(typeof te!="number"||te<0||(0|te)!==te)throw Error("invalid return value from JS function (expected integer)");return be.api_checknelems(h,te),rn(h,M,h.top-te,te),!0}case ce:{let f,M=J.value.p,te=h.top-X-1,Ee=M.maxstacksize;if(ee(h,Ee),M.is_vararg)f=ie(h,M,te);else{for(;te<M.numparams;te++)h.stack[h.top++]=new ae.TValue($,null);f=X+1}let Se=C.luaE_extendCI(h);return Se.funcOff=X,Se.nresults=V,Se.func=J,Se.l_base=f,Se.top=f+Ee,pn(h,Se.top),Se.l_code=M.code,Se.l_savedpc=0,Se.callstatus=C.CIST_LUA,h.hookmask&R&&Je(h,Se),!1}default:return ee(h,1),Ue(h,X,J),Te(h,X,V)}},rn=function(h,X,V,J){let f=X.nresults;h.hookmask&(z|I)&&(h.hookmask&z&&bn(h,v,-1),h.oldpc=X.previous.l_savedpc);let M=X.funcOff;return h.ci=X.previous,h.ci.next=null,On(h,V,M,J,f)},On=function(h,X,V,J,f){switch(f){case 0:break;case 1:J===0?h.stack[V].setnilvalue():ae.setobjs2s(h,V,X);break;case H:for(let te=0;te<J;te++)ae.setobjs2s(h,V+te,X+te);for(let te=h.top;te>=V+J;te--)delete h.stack[te];return h.top=V+J,!1;default:{let te;if(f<=J)for(te=0;te<f;te++)ae.setobjs2s(h,V+te,X+te);else{for(te=0;te<J;te++)ae.setobjs2s(h,V+te,X+te);for(;te<f;te++)V+te>=h.top?h.stack[V+te]=new ae.TValue($,null):h.stack[V+te].setnilvalue()}break}}let M=V+f;for(let te=h.top;te>=M;te--)delete h.stack[te];return h.top=M,!0},bn=function(h,X,V){let J=h.hook;if(J&&h.allowhook){let f=h.ci,M=h.top,te=f.top,Ee=new on;Ee.event=X,Ee.currentline=V,Ee.i_ci=f,ee(h,S),f.top=h.top+S,an(f.top<=h.stack_last),h.allowhook=0,f.callstatus|=C.CIST_HOOKED,J(h,Ee),an(!h.allowhook),h.allowhook=1,f.top=te,pn(h,M),f.callstatus&=~C.CIST_HOOKED}},Je=function(h,X){let V=A;X.l_savedpc++,X.previous.callstatus&C.CIST_LUA&&X.previous.l_code[X.previous.l_savedpc-1].opcode==oe.OpCodesI.OP_TAILCALL&&(X.callstatus|=C.CIST_TAIL,V=D),bn(h,V,-1),X.l_savedpc--},ie=function(h,X,V){let J,f=X.numparams,M=h.top-V,te=h.top;for(J=0;J<f&&J<V;J++)ae.pushobj2s(h,h.stack[M+J]),h.stack[M+J].setnilvalue();for(;J<f;J++)h.stack[h.top++]=new ae.TValue($,null);return te},Ue=function(h,X,V){let J=T.luaT_gettmbyobj(h,V,T.TMS.TM_CALL);J.ttisfunction(J)||ge.luaG_typeerror(h,V,re("call",!0)),ae.pushobj2s(h,h.stack[h.top-1]);for(let f=h.top-2;f>X;f--)ae.setobjs2s(h,f,f-1);ae.setobj2s(h,X,J)},N=function(h,X,V){++h.nCcalls>=sn&&(function(J){J.nCcalls===sn?ge.luaG_runerror(J,re("JS stack overflow",!0)):J.nCcalls>=sn+(sn>>3)&&me(J,se)})(h),Te(h,X,V)||xe.luaV_execute(h),h.nCcalls--},me=function(h,X){if(h.errorJmp)throw h.errorJmp.status=X,h.errorJmp;{let V=h.l_G;if(h.status=X,!V.mainthread.errorJmp){let J=V.panic;throw J&&(Ze(h,X,h.top),h.ci.top<h.top&&(h.ci.top=h.top),J(h)),new Error(`Aborted ${X}`)}V.mainthread.stack[V.mainthread.top++]=h.stack[h.top-1],me(V.mainthread,X)}},He=function(h,X,V){let J=h.nCcalls,f={status:Ke,previous:h.errorJmp};h.errorJmp=f;try{X(h,V)}catch(M){if(f.status===Ke){let te=h.l_G.atnativeerror;if(te)try{if(f.status=Ke,be.lua_pushcfunction(h,te),be.lua_pushlightuserdata(h,M),ot(h,h.top-2,1),h.errfunc!==0){let Ee=h.errfunc;ae.pushobj2s(h,h.stack[h.top-1]),ae.setobjs2s(h,h.top-2,Ee),ot(h,h.top-2,1)}f.status=$e}catch{f.status===Ke&&(f.status=-1)}else f.status=-1}}return h.errorJmp=f.previous,h.nCcalls=J,f.status},G=function(h,X){let V=h.ci;an(V.c_k!==null&&h.nny===0),an(V.callstatus&C.CIST_YPCALL||X===qe),V.callstatus&C.CIST_YPCALL&&(V.callstatus&=~C.CIST_YPCALL,h.errfunc=V.c_old_errfunc),V.nresults===H&&h.ci.top<h.top&&(h.ci.top=h.top);let J=(0,V.c_k)(h,X,V.c_ctx);be.api_checknelems(h,J),rn(h,V,h.top-J,J)},Ae=function(h,X){for(X!==null&&G(h,X);h.ci!==h.base_ci;)h.ci.callstatus&C.CIST_LUA?(xe.luaV_finishOp(h),xe.luaV_execute(h)):G(h,qe)},Pe=function(h,X){let V=(function(f){for(let M=f.ci;M!==null;M=M.previous)if(M.callstatus&C.CIST_YPCALL)return M;return null})(h);if(V===null)return 0;let J=V.extra;return Oe.luaF_close(h,J),Ze(h,X,J),h.ci=V,h.allowhook=V.callstatus&C.CIST_OAH,h.nny=0,Ie(h),h.errfunc=V.c_old_errfunc,1},Nn=function(h,X,V){let J=Ce(h,X);if(V===0)ae.pushsvalue2s(h,J),tn(h,h.top<=h.ci.top,"stack overflow");else{for(let f=1;f<V;f++)delete h.stack[--h.top];ae.setsvalue2s(h,h.top-1,J)}return $e},Un=function(h,X){let V=h.top-X,J=h.ci;h.status===Ke?Te(h,V-1,H)||xe.luaV_execute(h):(an(h.status===qe),h.status=Ke,J.funcOff=J.extra,J.func=h.stack[J.funcOff],J.callstatus&C.CIST_LUA?xe.luaV_execute(h):(J.c_k!==null&&(X=J.c_k(h,qe,J.c_ctx),be.api_checknelems(h,X),V=h.top-X),rn(h,J,V,X)),Ae(h,null))},Mn=function(h,X,V,J){let f=h.ci;return be.api_checknelems(h,X),h.nny>0&&(h!==h.l_G.mainthread?ge.luaG_runerror(h,re("attempt to yield across a JS-call boundary",!0)):ge.luaG_runerror(h,re("attempt to yield from outside a coroutine",!0))),h.status=qe,f.extra=f.funcOff,f.callstatus&C.CIST_LUA?tn(h,J===null,"hooks cannot continue after yielding"):(f.c_k=J,J!==null&&(f.c_ctx=V),f.funcOff=h.top-X-1,f.func=h.stack[f.funcOff],me(h,qe)),an(f.callstatus&C.CIST_HOOKED),0},Zn=function(h,X,V,J,f){let M=h.ci,te=h.allowhook,Ee=h.nny,Se=h.errfunc;h.errfunc=f;let De=He(h,X,V);return De!==Ke&&(Oe.luaF_close(h,J),Ze(h,De,J),h.ci=M,h.allowhook=te,h.nny=Ee,Ie(h)),h.errfunc=Se,De},ot=function(h,X,V){h.nny++,N(h,X,V),h.nny--},o=function(h,X,V){X&&P(X,V[0])===-1&&(ae.luaO_pushfstring(h,re("attempt to load a %s chunk (mode is '%s')"),V,X),me(h,nn))},de=function(h,X){let V,J=X.z.zgetc();J===b[0]?(o(h,X.mode,re("binary",!0)),V=L.luaU_undump(h,X.z,X.name)):(o(h,X.mode,re("text",!0)),V=ze.luaY_parser(h,X.z,X.buff,X.dyd,X.name,J)),an(V.nupvalues===V.p.upvalues.length),Oe.luaF_initupvals(h,V)};a.exports.adjust_top=pn,a.exports.luaD_call=N,a.exports.luaD_callnoyield=ot,a.exports.luaD_checkstack=ee,a.exports.luaD_growstack=Y,a.exports.luaD_hook=bn,a.exports.luaD_inctop=function(h){ee(h,1),h.stack[h.top++]=new ae.TValue($,null)},a.exports.luaD_pcall=Zn,a.exports.luaD_poscall=rn,a.exports.luaD_precall=Te,a.exports.luaD_protectedparser=function(h,X,V,J){let f=new class{constructor(te,Ee,Se){this.z=te,this.buff=new we,this.dyd=new ze.Dyndata,this.mode=Se,this.name=Ee}}(X,V,J);h.nny++;let M=Zn(h,de,f,h.top,h.errfunc);return h.nny--,M},a.exports.luaD_rawrunprotected=He,a.exports.luaD_reallocstack=mn,a.exports.luaD_throw=me,a.exports.lua_isyieldable=function(h){return h.nny===0},a.exports.lua_resume=function(h,X,V){let J=h.nny;if(h.status===Ke){if(h.ci!==h.base_ci)return Nn(h,"cannot resume non-suspended coroutine",V)}else if(h.status!==qe)return Nn(h,"cannot resume dead coroutine",V);if(h.nCcalls=X?X.nCcalls+1:1,h.nCcalls>=sn)return Nn(h,"JS stack overflow",V);h.nny=0,be.api_checknelems(h,h.status===Ke?V+1:V);let f=He(h,Un,V);if(f===-1)f=$e;else{for(;f>qe&&Pe(h,f);)f=He(h,Ae,f);f>qe?(h.status=f,Ze(h,f,h.top),h.ci.top=h.top):an(f===h.status)}return h.nny=J,h.nCcalls--,an(h.nCcalls===(X?X.nCcalls:0)),f},a.exports.lua_yield=function(h,X){Mn(h,X,0,null)},a.exports.lua_yieldk=Mn},function(a,B,d){const{constant_types:{LUA_TBOOLEAN:A,LUA_TCCL:v,LUA_TLCF:D,LUA_TLCL:R,LUA_TLIGHTUSERDATA:I,LUA_TLNGSTR:z,LUA_TNIL:S,LUA_TNUMFLT:H,LUA_TNUMINT:b,LUA_TSHRSTR:F,LUA_TTABLE:Q,LUA_TTHREAD:ce,LUA_TUSERDATA:$},to_luastring:ve}=d(1),{lua_assert:se}=d(4),$e=d(11),nn=d(6),{luaS_hashlongstr:Ke,TString:qe}=d(10),on=d(12);let P=new WeakMap;const re=function(ae){let oe=P.get(ae);return oe||(oe={},P.set(ae,oe)),oe},be=function(ae,oe){switch(oe.type){case S:return $e.luaG_runerror(ae,ve("table index is nil",!0));case H:if(isNaN(oe.value))return $e.luaG_runerror(ae,ve("table index is NaN",!0));case b:case A:case Q:case R:case D:case v:case $:case ce:return oe.value;case F:case z:return Ke(oe.tsvalue());case I:{let ze=oe.value;switch(typeof ze){case"string":return"*"+ze;case"number":return"#"+ze;case"boolean":return ze?"?true":"?false";case"function":return re(ze);case"object":if(ze instanceof on.lua_State&&ze.l_G===ae.l_G||ze instanceof ge||ze instanceof nn.Udata||ze instanceof nn.LClosure||ze instanceof nn.CClosure)return re(ze);default:return ze}}default:throw new Error("unknown key type: "+oe.type)}};class ge{constructor(oe){this.id=oe.l_G.id_counter++,this.strong=new Map,this.dead_strong=new Map,this.dead_weak=void 0,this.f=void 0,this.l=void 0,this.metatable=null,this.flags=-1}}const Oe=function(ae,oe,ze,C){ae.dead_strong.clear(),ae.dead_weak=void 0;let Ce=null,T={key:ze,value:C,p:Ce=ae.l,n:void 0};ae.f||(ae.f=T),Ce&&(Ce.n=T),ae.strong.set(oe,T),ae.l=T},tn=function(ae,oe){let ze=ae.strong.get(oe);if(ze){ze.key.setdeadvalue(),ze.value=void 0;let C=ze.n,Ce=ze.p;ze.p=void 0,Ce&&(Ce.n=C),C&&(C.p=Ce),ae.f===ze&&(ae.f=C),ae.l===ze&&(ae.l=Ce),ae.strong.delete(oe),(function(T){return typeof T=="object"?T!==null:typeof T=="function"})(oe)?(ae.dead_weak||(ae.dead_weak=new WeakMap),ae.dead_weak.set(oe,ze)):ae.dead_strong.set(oe,ze)}},an=function(ae,oe){let ze=ae.strong.get(oe);return ze?ze.value:nn.luaO_nilobject},sn=function(ae,oe){return se(typeof oe=="number"&&(0|oe)===oe),an(ae,oe)};a.exports.invalidateTMcache=function(ae){ae.flags=0},a.exports.luaH_get=function(ae,oe,ze){return se(ze instanceof nn.TValue),ze.ttisnil()||ze.ttisfloat()&&isNaN(ze.value)?nn.luaO_nilobject:an(oe,be(ae,ze))},a.exports.luaH_getint=sn,a.exports.luaH_getn=function(ae){let oe=0,ze=ae.strong.size+1;for(;ze-oe>1;){let C=Math.floor((oe+ze)/2);sn(ae,C).ttisnil()?ze=C:oe=C}return oe},a.exports.luaH_getstr=function(ae,oe){return se(oe instanceof qe),an(ae,Ke(oe))},a.exports.luaH_setfrom=function(ae,oe,ze,C){se(ze instanceof nn.TValue);let Ce=be(ae,ze);if(C.ttisnil())return void tn(oe,Ce);let T=oe.strong.get(Ce);if(T)T.value.setfrom(C);else{let g,L=ze.value;g=ze.ttisfloat()&&(0|L)===L?new nn.TValue(b,L):new nn.TValue(ze.type,L);let xe=new nn.TValue(C.type,C.value);Oe(oe,Ce,g,xe)}},a.exports.luaH_setint=function(ae,oe,ze){se(typeof oe=="number"&&(0|oe)===oe&&ze instanceof nn.TValue);let C=oe;if(ze.ttisnil())return void tn(ae,C);let Ce=ae.strong.get(C);if(Ce)Ce.value.setfrom(ze);else{let T=new nn.TValue(b,oe),g=new nn.TValue(ze.type,ze.value);Oe(ae,C,T,g)}},a.exports.luaH_new=function(ae){return new ge(ae)},a.exports.luaH_next=function(ae,oe,ze){let C,Ce=ae.stack[ze];if(Ce.type===S){if(!(C=oe.f))return!1}else{let T=be(ae,Ce);if(C=oe.strong.get(T)){if(!(C=C.n))return!1}else{if(!(C=oe.dead_weak&&oe.dead_weak.get(T)||oe.dead_strong.get(T)))return $e.luaG_runerror(ae,ve("invalid key to 'next'"));do if(!(C=C.n))return!1;while(C.key.ttisdeadkey())}}return nn.setobj2s(ae,ze,C.key),nn.setobj2s(ae,ze+1,C.value),!0},a.exports.Table=ge},function(a,B,d){const{is_luastring:A,luastring_eq:v,luastring_from:D,to_luastring:R}=d(1),{lua_assert:I}=d(4);class z{constructor(F,Q){this.hash=null,this.realstring=Q}getstr(){return this.realstring}tsslen(){return this.realstring.length}}const S=function(b){I(A(b));let F=b.length,Q="|";for(let ce=0;ce<F;ce++)Q+=b[ce].toString(16);return Q},H=function(b,F){return I(F instanceof Uint8Array),new z(b,F)};a.exports.luaS_eqlngstr=function(b,F){return I(b instanceof z),I(F instanceof z),b==F||v(b.realstring,F.realstring)},a.exports.luaS_hash=S,a.exports.luaS_hashlongstr=function(b){return I(b instanceof z),b.hash===null&&(b.hash=S(b.getstr())),b.hash},a.exports.luaS_bless=H,a.exports.luaS_new=function(b,F){return H(b,D(F))},a.exports.luaS_newliteral=function(b,F){return H(b,R(F))},a.exports.TString=z},function(a,B,d){const{LUA_HOOKCOUNT:A,LUA_HOOKLINE:v,LUA_MASKCOUNT:D,LUA_MASKLINE:R,constant_types:{LUA_TBOOLEAN:I,LUA_TNIL:z,LUA_TTABLE:S},thread_status:{LUA_ERRRUN:H,LUA_YIELD:b},from_userstring:F,luastring_eq:Q,luastring_indexOf:ce,to_luastring:$}=d(1),{api_check:ve,lua_assert:se}=d(4),{LUA_IDSIZE:$e}=d(3),nn=d(18),Ke=d(8),qe=d(13),on=d(20),P=d(6),re=d(16),be=d(12),ge=d(9),Oe=d(14),tn=d(15),an=function(Y){return se(Y.callstatus&be.CIST_LUA),Y.l_savedpc-1},sn=function(Y){return Y.func.value.p.lineinfo.length!==0?Y.func.value.p.lineinfo[an(Y)]:-1},ae=function(Y){if(Y.status===b){let ee=Y.ci,Ie=ee.funcOff;ee.func=Y.stack[ee.extra],ee.funcOff=ee.extra,ee.extra=Ie}},oe=function(Y,ee){se(ee<Y.upvalues.length);let Ie=Y.upvalues[ee].name;return Ie===null?$("?",!0):Ie.getstr()},ze=function(Y,ee,Ie){let Te,rn=null;if(ee.callstatus&be.CIST_LUA){if(Ie<0)return(function(On,bn){let Je=On.func.value.p.numparams;return bn>=On.l_base-On.funcOff-Je?null:{pos:On.funcOff+Je+bn,name:$("(*vararg)",!0)}})(ee,-Ie);Te=ee.l_base,rn=qe.luaF_getlocalname(ee.func.value.p,Ie,an(ee))}else Te=ee.funcOff+1;if(rn===null){if(!((ee===Y.ci?Y.top:ee.next.funcOff)-Te>=Ie&&Ie>0))return null;rn=$("(*temporary)",!0)}return{pos:Te+(Ie-1),name:rn}},C=function(Y,ee){if(ee===null||ee instanceof P.CClosure)Y.source=$("=[JS]",!0),Y.linedefined=-1,Y.lastlinedefined=-1,Y.what=$("J",!0);else{let Ie=ee.p;Y.source=Ie.source?Ie.source.getstr():$("=?",!0),Y.linedefined=Ie.linedefined,Y.lastlinedefined=Ie.lastlinedefined,Y.what=Y.linedefined===0?$("main",!0):$("Lua",!0)}Y.short_src=P.luaO_chunkid(Y.source,$e)},Ce=function(Y,ee){let Ie={name:null,funcname:null};return ee===null?null:ee.callstatus&be.CIST_FIN?(Ie.name=$("__gc",!0),Ie.funcname=$("metamethod",!0),Ie):!(ee.callstatus&be.CIST_TAIL)&&ee.previous.callstatus&be.CIST_LUA?xe(Y,ee.previous):null},T=function(Y,ee,Ie){let Te={name:null,funcname:null};if(re.ISK(Ie)){let rn=Y.k[re.INDEXK(Ie)];if(rn.ttisstring())return Te.name=rn.svalue(),Te}else{let rn=L(Y,ee,Ie);if(rn&&rn.funcname[0]===99)return rn}return Te.name=$("?",!0),Te},g=function(Y,ee){return Y<ee?-1:Y},L=function(Y,ee,Ie){let Te={name:qe.luaF_getlocalname(Y,Ie+1,ee),funcname:null};if(Te.name)return Te.funcname=$("local",!0),Te;let rn=(function(bn,Je,ie){let Ue=-1,N=0,me=re.OpCodesI;for(let He=0;He<Je;He++){let G=bn.code[He],Ae=G.A;switch(G.opcode){case me.OP_LOADNIL:{let Pe=G.B;Ae<=ie&&ie<=Ae+Pe&&(Ue=g(He,N));break}case me.OP_TFORCALL:ie>=Ae+2&&(Ue=g(He,N));break;case me.OP_CALL:case me.OP_TAILCALL:ie>=Ae&&(Ue=g(He,N));break;case me.OP_JMP:{let Pe=He+1+G.sBx;He<Pe&&Pe<=Je&&Pe>N&&(N=Pe);break}default:re.testAMode(G.opcode)&&ie===Ae&&(Ue=g(He,N))}}return Ue})(Y,ee,Ie),On=re.OpCodesI;if(rn!==-1){let bn=Y.code[rn];switch(bn.opcode){case On.OP_MOVE:{let Je=bn.B;if(Je<bn.A)return L(Y,rn,Je);break}case On.OP_GETTABUP:case On.OP_GETTABLE:{let Je=bn.C,ie=bn.B,Ue=bn.opcode===On.OP_GETTABLE?qe.luaF_getlocalname(Y,ie+1,rn):oe(Y,ie);return Te.name=T(Y,rn,Je).name,Te.funcname=Ue&&Q(Ue,on.LUA_ENV)?$("global",!0):$("field",!0),Te}case On.OP_GETUPVAL:return Te.name=oe(Y,bn.B),Te.funcname=$("upvalue",!0),Te;case On.OP_LOADK:case On.OP_LOADKX:{let Je=bn.opcode===On.OP_LOADK?bn.Bx:Y.code[rn+1].Ax;if(Y.k[Je].ttisstring())return Te.name=Y.k[Je].svalue(),Te.funcname=$("constant",!0),Te;break}case On.OP_SELF:{let Je=bn.C;return Te.name=T(Y,rn,Je).name,Te.funcname=$("method",!0),Te}}}return null},xe=function(Y,ee){let Ie={name:null,funcname:null},Te=0,rn=ee.func.value.p,On=an(ee),bn=rn.code[On],Je=re.OpCodesI;if(ee.callstatus&be.CIST_HOOKED)return Ie.name=$("?",!0),Ie.funcname=$("hook",!0),Ie;switch(bn.opcode){case Je.OP_CALL:case Je.OP_TAILCALL:return L(rn,On,bn.A);case Je.OP_TFORCALL:return Ie.name=$("for iterator",!0),Ie.funcname=$("for iterator",!0),Ie;case Je.OP_SELF:case Je.OP_GETTABUP:case Je.OP_GETTABLE:Te=Oe.TMS.TM_INDEX;break;case Je.OP_SETTABUP:case Je.OP_SETTABLE:Te=Oe.TMS.TM_NEWINDEX;break;case Je.OP_ADD:Te=Oe.TMS.TM_ADD;break;case Je.OP_SUB:Te=Oe.TMS.TM_SUB;break;case Je.OP_MUL:Te=Oe.TMS.TM_MUL;break;case Je.OP_MOD:Te=Oe.TMS.TM_MOD;break;case Je.OP_POW:Te=Oe.TMS.TM_POW;break;case Je.OP_DIV:Te=Oe.TMS.TM_DIV;break;case Je.OP_IDIV:Te=Oe.TMS.TM_IDIV;break;case Je.OP_BAND:Te=Oe.TMS.TM_BAND;break;case Je.OP_BOR:Te=Oe.TMS.TM_BOR;break;case Je.OP_BXOR:Te=Oe.TMS.TM_BXOR;break;case Je.OP_SHL:Te=Oe.TMS.TM_SHL;break;case Je.OP_SHR:Te=Oe.TMS.TM_SHR;break;case Je.OP_UNM:Te=Oe.TMS.TM_UNM;break;case Je.OP_BNOT:Te=Oe.TMS.TM_BNOT;break;case Je.OP_LEN:Te=Oe.TMS.TM_LEN;break;case Je.OP_CONCAT:Te=Oe.TMS.TM_CONCAT;break;case Je.OP_EQ:Te=Oe.TMS.TM_EQ;break;case Je.OP_LT:Te=Oe.TMS.TM_LT;break;case Je.OP_LE:Te=Oe.TMS.TM_LE;break;default:return null}return Ie.name=Y.l_G.tmname[Te].getstr(),Ie.funcname=$("metamethod",!0),Ie},we=function(Y,ee){let Ie=Y.ci,Te=null;if(Ie.callstatus&be.CIST_LUA){Te=(function(On,bn,Je){let ie=bn.func.value;for(let Ue=0;Ue<ie.nupvalues;Ue++)if(ie.upvals[Ue]===Je)return{name:oe(ie.p,Ue),funcname:$("upvalue",!0)};return null})(0,Ie,ee);let rn=(function(On,bn,Je){for(let ie=bn.l_base;ie<bn.top;ie++)if(On.stack[ie]===Je)return ie;return!1})(Y,Ie,ee);!Te&&rn&&(Te=L(Ie.func.value.p,an(Ie),rn-Ie.l_base))}return Te?P.luaO_pushfstring(Y,$(" (%s '%s')",!0),Te.funcname,Te.name):$("",!0)},pn=function(Y,ee,Ie){let Te=Oe.luaT_objtypename(Y,ee);dn(Y,$("attempt to %s a %s value%s",!0),Ie,Te,we(Y,ee))},Ze=function(Y,ee,Ie,Te){let rn;return rn=Ie?P.luaO_chunkid(Ie.getstr(),$e):$("?",!0),P.luaO_pushfstring(Y,$("%s:%d: %s",!0),rn,Te,ee)},dn=function(Y,ee,...Ie){let Te=Y.ci,rn=P.luaO_pushvfstring(Y,ee,Ie);Te.callstatus&be.CIST_LUA&&Ze(Y,rn,Te.func.value.p.source,sn(Te)),mn(Y)},mn=function(Y){if(Y.errfunc!==0){let ee=Y.errfunc;P.pushobj2s(Y,Y.stack[Y.top-1]),P.setobjs2s(Y,Y.top-2,ee),Ke.luaD_callnoyield(Y,Y.top-2,1)}Ke.luaD_throw(Y,H)};a.exports.luaG_addinfo=Ze,a.exports.luaG_concaterror=function(Y,ee,Ie){(ee.ttisstring()||tn.cvt2str(ee))&&(ee=Ie),pn(Y,ee,$("concatenate",!0))},a.exports.luaG_errormsg=mn,a.exports.luaG_opinterror=function(Y,ee,Ie,Te){tn.tonumber(ee)===!1&&(Ie=ee),pn(Y,Ie,Te)},a.exports.luaG_ordererror=function(Y,ee,Ie){let Te=Oe.luaT_objtypename(Y,ee),rn=Oe.luaT_objtypename(Y,Ie);Q(Te,rn)?dn(Y,$("attempt to compare two %s values",!0),Te):dn(Y,$("attempt to compare %s with %s",!0),Te,rn)},a.exports.luaG_runerror=dn,a.exports.luaG_tointerror=function(Y,ee,Ie){tn.tointeger(ee)===!1&&(Ie=ee),dn(Y,$("number%s has no integer representation",!0),we(Y,Ie))},a.exports.luaG_traceexec=function(Y){let ee=Y.ci,Ie=Y.hookmask,Te=--Y.hookcount==0&&Ie&D;if(Te)Y.hookcount=Y.basehookcount;else if(!(Ie&R))return;if(ee.callstatus&be.CIST_HOOKYIELD)ee.callstatus&=~be.CIST_HOOKYIELD;else{if(Te&&Ke.luaD_hook(Y,A,-1),Ie&R){let rn=ee.func.value.p,On=ee.l_savedpc-1,bn=rn.lineinfo.length!==0?rn.lineinfo[On]:-1;(On===0||ee.l_savedpc<=Y.oldpc||bn!==(rn.lineinfo.length!==0?rn.lineinfo[Y.oldpc-1]:-1))&&Ke.luaD_hook(Y,v,bn)}Y.oldpc=ee.l_savedpc,Y.status===b&&(Te&&(Y.hookcount=1),ee.l_savedpc--,ee.callstatus|=be.CIST_HOOKYIELD,ee.funcOff=Y.top-1,ee.func=Y.stack[ee.funcOff],Ke.luaD_throw(Y,b))}},a.exports.luaG_typeerror=pn,a.exports.lua_gethook=function(Y){return Y.hook},a.exports.lua_gethookcount=function(Y){return Y.basehookcount},a.exports.lua_gethookmask=function(Y){return Y.hookmask},a.exports.lua_getinfo=function(Y,ee,Ie){let Te,rn,On,bn;return ee=F(ee),ae(Y),ee[0]===62?(On=null,bn=Y.stack[Y.top-1],ve(Y,bn.ttisfunction(),"function expected"),ee=ee.subarray(1),Y.top--):(bn=(On=Ie.i_ci).func,se(On.func.ttisfunction())),Te=(function(Je,ie,Ue,N,me){let He=1;for(;ie.length>0;ie=ie.subarray(1))switch(ie[0]){case 83:C(Ue,N);break;case 108:Ue.currentline=me&&me.callstatus&be.CIST_LUA?sn(me):-1;break;case 117:Ue.nups=N===null?0:N.nupvalues,N===null||N instanceof P.CClosure?(Ue.isvararg=!0,Ue.nparams=0):(Ue.isvararg=N.p.is_vararg,Ue.nparams=N.p.numparams);break;case 116:Ue.istailcall=me?me.callstatus&be.CIST_TAIL:0;break;case 110:{let G=Ce(Je,me);G===null?(Ue.namewhat=$("",!0),Ue.name=null):(Ue.namewhat=G.funcname,Ue.name=G.name);break}case 76:case 102:break;default:He=0}return He})(Y,ee,Ie,rn=bn.ttisclosure()?bn.value:null,On),ce(ee,102)>=0&&(P.pushobj2s(Y,bn),ve(Y,Y.top<=Y.ci.top,"stack overflow")),ae(Y),ce(ee,76)>=0&&(function(Je,ie){if(ie===null||ie instanceof P.CClosure)Je.stack[Je.top]=new P.TValue(z,null),nn.api_incr_top(Je);else{let Ue=ie.p.lineinfo,N=ge.luaH_new(Je);Je.stack[Je.top]=new P.TValue(S,N),nn.api_incr_top(Je);let me=new P.TValue(I,!0);for(let He=0;He<Ue.length;He++)ge.luaH_setint(N,Ue[He],me)}})(Y,rn),Te},a.exports.lua_getlocal=function(Y,ee,Ie){let Te;if(ae(Y),ee===null)Te=Y.stack[Y.top-1].ttisLclosure()?qe.luaF_getlocalname(Y.stack[Y.top-1].value.p,Ie,0):null;else{let rn=ze(Y,ee.i_ci,Ie);rn?(Te=rn.name,P.pushobj2s(Y,Y.stack[rn.pos]),ve(Y,Y.top<=Y.ci.top,"stack overflow")):Te=null}return ae(Y),Te},a.exports.lua_getstack=function(Y,ee,Ie){let Te,rn;if(ee<0)return 0;for(Te=Y.ci;ee>0&&Te!==Y.base_ci;Te=Te.previous)ee--;return ee===0&&Te!==Y.base_ci?(rn=1,Ie.i_ci=Te):rn=0,rn},a.exports.lua_sethook=function(Y,ee,Ie,Te){ee!==null&&Ie!==0||(Ie=0,ee=null),Y.ci.callstatus&be.CIST_LUA&&(Y.oldpc=Y.ci.l_savedpc),Y.hook=ee,Y.basehookcount=Te,Y.hookcount=Y.basehookcount,Y.hookmask=Ie},a.exports.lua_setlocal=function(Y,ee,Ie){let Te;ae(Y);let rn=ze(Y,ee.i_ci,Ie);return rn?(Te=rn.name,P.setobjs2s(Y,rn.pos,Y.top-1),delete Y.stack[--Y.top]):Te=null,ae(Y),Te}},function(a,B,d){const{LUA_MINSTACK:A,LUA_RIDX_GLOBALS:v,LUA_RIDX_MAINTHREAD:D,constant_types:{LUA_NUMTAGS:R,LUA_TNIL:I,LUA_TTABLE:z,LUA_TTHREAD:S},thread_status:{LUA_OK:H}}=d(1),b=d(6),F=d(8),Q=d(18),ce=d(9),$=d(14),ve=2*A;class se{constructor(){this.func=null,this.funcOff=NaN,this.top=NaN,this.previous=null,this.next=null,this.l_base=NaN,this.l_code=null,this.l_savedpc=NaN,this.c_k=null,this.c_old_errfunc=null,this.c_ctx=null,this.nresults=NaN,this.callstatus=NaN}}class $e{constructor(re){this.id=re.id_counter++,this.base_ci=new se,this.top=NaN,this.stack_last=NaN,this.oldpc=NaN,this.l_G=re,this.stack=null,this.ci=null,this.errorJmp=null,this.nCcalls=0,this.hook=null,this.hookmask=0,this.basehookcount=0,this.allowhook=1,this.hookcount=this.basehookcount,this.nny=1,this.status=H,this.errfunc=0}}const nn=function(P){P.ci.next=null},Ke=function(P,re){P.stack=new Array(ve),P.top=0,P.stack_last=ve-5;let be=P.base_ci;be.next=be.previous=null,be.callstatus=0,be.funcOff=P.top,be.func=P.stack[P.top],P.stack[P.top++]=new b.TValue(I,null),be.top=P.top+A,P.ci=be},qe=function(P){P.ci=P.base_ci,nn(P),P.stack=null},on=function(P){let re=P.l_G;Ke(P),(function(be,ge){let Oe=ce.luaH_new(be);ge.l_registry.sethvalue(Oe),ce.luaH_setint(Oe,D,new b.TValue(S,be)),ce.luaH_setint(Oe,v,new b.TValue(z,ce.luaH_new(be)))})(P,re),$.luaT_init(P),re.version=Q.lua_version(null)};a.exports.lua_State=$e,a.exports.CallInfo=se,a.exports.CIST_OAH=1,a.exports.CIST_LUA=2,a.exports.CIST_HOOKED=4,a.exports.CIST_FRESH=8,a.exports.CIST_YPCALL=16,a.exports.CIST_TAIL=32,a.exports.CIST_HOOKYIELD=64,a.exports.CIST_LEQ=128,a.exports.CIST_FIN=256,a.exports.EXTRA_STACK=5,a.exports.lua_close=function(P){(function(re){qe(re)})(P=P.l_G.mainthread)},a.exports.lua_newstate=function(){let P=new class{constructor(){this.id_counter=1,this.ids=new WeakMap,this.mainthread=null,this.l_registry=new b.TValue(I,null),this.panic=null,this.atnativeerror=null,this.version=null,this.tmname=new Array($.TMS.TM_N),this.mt=new Array(R)}},re=new $e(P);return P.mainthread=re,F.luaD_rawrunprotected(re,on,null)!==H&&(re=null),re},a.exports.lua_newthread=function(P){let re=P.l_G,be=new $e(re);return P.stack[P.top]=new b.TValue(S,be),Q.api_incr_top(P),be.hookmask=P.hookmask,be.basehookcount=P.basehookcount,be.hook=P.hook,be.hookcount=be.basehookcount,Ke(be),be},a.exports.luaE_extendCI=function(P){let re=new se;return P.ci.next=re,re.previous=P.ci,re.next=null,P.ci=re,re},a.exports.luaE_freeCI=nn,a.exports.luaE_freethread=function(P,re){qe(re)}},function(a,B,d){const{constant_types:{LUA_TNIL:A}}=d(1),v=d(6);a.exports.MAXUPVAL=255,a.exports.Proto=class{constructor(D){this.id=D.l_G.id_counter++,this.k=[],this.p=[],this.code=[],this.cache=null,this.lineinfo=[],this.upvalues=[],this.numparams=0,this.is_vararg=!1,this.maxstacksize=0,this.locvars=[],this.linedefined=0,this.lastlinedefined=0,this.source=null}},a.exports.luaF_findupval=function(D,R){return D.stack[R]},a.exports.luaF_close=function(D,R){for(let I=R;I<D.top;I++){let z=D.stack[I];D.stack[I]=new v.TValue(z.type,z.value)}},a.exports.luaF_getlocalname=function(D,R,I){for(let z=0;z<D.locvars.length&&D.locvars[z].startpc<=I;z++)if(I<D.locvars[z].endpc&&--R==0)return D.locvars[z].varname.getstr();return null},a.exports.luaF_initupvals=function(D,R){for(let I=0;I<R.nupvalues;I++)R.upvals[I]=new v.TValue(A,null)},a.exports.luaF_newLclosure=function(D,R){return new v.LClosure(D,R)}},function(a,B,d){const{constant_types:{LUA_TTABLE:A,LUA_TUSERDATA:v},to_luastring:D}=d(1),{lua_assert:R}=d(4),I=d(6),z=d(8),S=d(12),{luaS_bless:H,luaS_new:b}=d(10),F=d(9),Q=d(11),ce=d(15),$=["no value","nil","boolean","userdata","number","string","table","function","userdata","thread","proto"].map(P=>D(P)),ve=function(P){return $[P+1]},se={TM_INDEX:0,TM_NEWINDEX:1,TM_GC:2,TM_MODE:3,TM_LEN:4,TM_EQ:5,TM_ADD:6,TM_SUB:7,TM_MUL:8,TM_MOD:9,TM_POW:10,TM_DIV:11,TM_IDIV:12,TM_BAND:13,TM_BOR:14,TM_BXOR:15,TM_SHL:16,TM_SHR:17,TM_UNM:18,TM_BNOT:19,TM_LT:20,TM_LE:21,TM_CONCAT:22,TM_CALL:23,TM_N:24},$e=D("__name",!0),nn=function(P,re,be,ge,Oe,tn){let an=P.top;if(I.pushobj2s(P,re),I.pushobj2s(P,be),I.pushobj2s(P,ge),tn||I.pushobj2s(P,Oe),P.ci.callstatus&S.CIST_LUA?z.luaD_call(P,an,tn):z.luaD_callnoyield(P,an,tn),tn){let sn=P.stack[P.top-1];delete P.stack[--P.top],Oe.setfrom(sn)}},Ke=function(P,re,be,ge,Oe){let tn=on(P,re,Oe);return tn.ttisnil()&&(tn=on(P,be,Oe)),!tn.ttisnil()&&(nn(P,tn,re,be,ge,1),!0)},qe=function(P,re,be){const ge=F.luaH_getstr(P,be);return R(re<=se.TM_EQ),ge.ttisnil()?(P.flags|=1<<re,null):ge},on=function(P,re,be){let ge;switch(re.ttnov()){case A:case v:ge=re.value.metatable;break;default:ge=P.l_G.mt[re.ttnov()]}return ge?F.luaH_getstr(ge,P.l_G.tmname[be]):I.luaO_nilobject};a.exports.fasttm=function(P,re,be){return re===null||re.flags&1<<be?null:qe(re,be,P.l_G.tmname[be])},a.exports.TMS=se,a.exports.luaT_callTM=nn,a.exports.luaT_callbinTM=Ke,a.exports.luaT_trybinTM=function(P,re,be,ge,Oe){if(!Ke(P,re,be,ge,Oe))switch(Oe){case se.TM_CONCAT:return Q.luaG_concaterror(P,re,be);case se.TM_BAND:case se.TM_BOR:case se.TM_BXOR:case se.TM_SHL:case se.TM_SHR:case se.TM_BNOT:{let tn=ce.tonumber(re),an=ce.tonumber(be);return tn!==!1&&an!==!1?Q.luaG_tointerror(P,re,be):Q.luaG_opinterror(P,re,be,D("perform bitwise operation on",!0))}default:return Q.luaG_opinterror(P,re,be,D("perform arithmetic on",!0))}},a.exports.luaT_callorderTM=function(P,re,be,ge){let Oe=new I.TValue;return Ke(P,re,be,Oe,ge)?!Oe.l_isfalse():null},a.exports.luaT_gettm=qe,a.exports.luaT_gettmbyobj=on,a.exports.luaT_init=function(P){P.l_G.tmname[se.TM_INDEX]=new b(P,D("__index",!0)),P.l_G.tmname[se.TM_NEWINDEX]=new b(P,D("__newindex",!0)),P.l_G.tmname[se.TM_GC]=new b(P,D("__gc",!0)),P.l_G.tmname[se.TM_MODE]=new b(P,D("__mode",!0)),P.l_G.tmname[se.TM_LEN]=new b(P,D("__len",!0)),P.l_G.tmname[se.TM_EQ]=new b(P,D("__eq",!0)),P.l_G.tmname[se.TM_ADD]=new b(P,D("__add",!0)),P.l_G.tmname[se.TM_SUB]=new b(P,D("__sub",!0)),P.l_G.tmname[se.TM_MUL]=new b(P,D("__mul",!0)),P.l_G.tmname[se.TM_MOD]=new b(P,D("__mod",!0)),P.l_G.tmname[se.TM_POW]=new b(P,D("__pow",!0)),P.l_G.tmname[se.TM_DIV]=new b(P,D("__div",!0)),P.l_G.tmname[se.TM_IDIV]=new b(P,D("__idiv",!0)),P.l_G.tmname[se.TM_BAND]=new b(P,D("__band",!0)),P.l_G.tmname[se.TM_BOR]=new b(P,D("__bor",!0)),P.l_G.tmname[se.TM_BXOR]=new b(P,D("__bxor",!0)),P.l_G.tmname[se.TM_SHL]=new b(P,D("__shl",!0)),P.l_G.tmname[se.TM_SHR]=new b(P,D("__shr",!0)),P.l_G.tmname[se.TM_UNM]=new b(P,D("__unm",!0)),P.l_G.tmname[se.TM_BNOT]=new b(P,D("__bnot",!0)),P.l_G.tmname[se.TM_LT]=new b(P,D("__lt",!0)),P.l_G.tmname[se.TM_LE]=new b(P,D("__le",!0)),P.l_G.tmname[se.TM_CONCAT]=new b(P,D("__concat",!0)),P.l_G.tmname[se.TM_CALL]=new b(P,D("__call",!0))},a.exports.luaT_objtypename=function(P,re){let be;if(re.ttistable()&&(be=re.value.metatable)!==null||re.ttisfulluserdata()&&(be=re.value.metatable)!==null){let ge=F.luaH_getstr(be,H(P,$e));if(ge.ttisstring())return ge.svalue()}return ve(re.ttnov())},a.exports.ttypename=ve},function(a,B,d){const{LUA_MASKLINE:A,LUA_MASKCOUNT:v,LUA_MULTRET:D,constant_types:{LUA_TBOOLEAN:R,LUA_TLCF:I,LUA_TLIGHTUSERDATA:z,LUA_TLNGSTR:S,LUA_TNIL:H,LUA_TNUMBER:b,LUA_TNUMFLT:F,LUA_TNUMINT:Q,LUA_TSHRSTR:ce,LUA_TTABLE:$,LUA_TUSERDATA:ve},to_luastring:se}=d(1),{INDEXK:$e,ISK:nn,LFIELDS_PER_FLUSH:Ke,OpCodesI:{OP_ADD:qe,OP_BAND:on,OP_BNOT:P,OP_BOR:re,OP_BXOR:be,OP_CALL:ge,OP_CLOSURE:Oe,OP_CONCAT:tn,OP_DIV:an,OP_EQ:sn,OP_EXTRAARG:ae,OP_FORLOOP:oe,OP_FORPREP:ze,OP_GETTABLE:C,OP_GETTABUP:Ce,OP_GETUPVAL:T,OP_IDIV:g,OP_JMP:L,OP_LE:xe,OP_LEN:we,OP_LOADBOOL:pn,OP_LOADK:Ze,OP_LOADKX:dn,OP_LOADNIL:mn,OP_LT:Y,OP_MOD:ee,OP_MOVE:Ie,OP_MUL:Te,OP_NEWTABLE:rn,OP_NOT:On,OP_POW:bn,OP_RETURN:Je,OP_SELF:ie,OP_SETLIST:Ue,OP_SETTABLE:N,OP_SETTABUP:me,OP_SETUPVAL:He,OP_SHL:G,OP_SHR:Ae,OP_SUB:Pe,OP_TAILCALL:Nn,OP_TEST:Un,OP_TESTSET:Mn,OP_TFORCALL:Zn,OP_TFORLOOP:ot,OP_UNM:o,OP_VARARG:de}}=d(16),{LUA_MAXINTEGER:h,LUA_MININTEGER:X,lua_numbertointeger:V}=d(3),{lua_assert:J,luai_nummod:f}=d(4),M=d(6),te=d(13),Ee=d(12),{luaS_bless:Se,luaS_eqlngstr:De,luaS_hashlongstr:Xe}=d(10),Fe=d(8),Ve=d(14),vn=d(9),i=d(11),s=function(E,le,cn){return le+cn.A},_=function(E,le,cn){return le+cn.B},c=function(E,le,cn,ln){return nn(ln.B)?cn[$e(ln.B)]:E.stack[le+ln.B]},m=function(E,le,cn,ln){return nn(ln.C)?cn[$e(ln.C)]:E.stack[le+ln.C]},O=function(E,le,cn,ln){let wn=cn.A;wn!==0&&te.luaF_close(E,le.l_base+wn-1),le.l_savedpc+=cn.sBx+ln},y=function(E,le){O(E,le,le.l_code[le.l_savedpc],1)},ne=function(E,le,cn){if(le.ttisnumber()&&cn.ttisnumber())return U(le,cn)?1:0;if(le.ttisstring()&&cn.ttisstring())return fe(le.tsvalue(),cn.tsvalue())<0?1:0;{let ln=Ve.luaT_callorderTM(E,le,cn,Ve.TMS.TM_LT);return ln===null&&i.luaG_ordererror(E,le,cn),ln?1:0}},en=function(E,le,cn){let ln;return le.ttisnumber()&&cn.ttisnumber()?Me(le,cn)?1:0:le.ttisstring()&&cn.ttisstring()?fe(le.tsvalue(),cn.tsvalue())<=0?1:0:(ln=Ve.luaT_callorderTM(E,le,cn,Ve.TMS.TM_LE))!==null?ln?1:0:(E.ci.callstatus|=Ee.CIST_LEQ,ln=Ve.luaT_callorderTM(E,cn,le,Ve.TMS.TM_LT),E.ci.callstatus^=Ee.CIST_LEQ,ln===null&&i.luaG_ordererror(E,le,cn),ln?0:1)},gn=function(E,le,cn){if(le.ttype()!==cn.ttype())return le.ttnov()!==cn.ttnov()||le.ttnov()!==b?0:le.value===cn.value?1:0;let ln;switch(le.ttype()){case H:return 1;case R:return le.value==cn.value?1:0;case z:case Q:case F:case I:return le.value===cn.value?1:0;case ce:case S:return De(le.tsvalue(),cn.tsvalue())?1:0;case ve:case $:if(le.value===cn.value)return 1;if(E===null)return 0;(ln=Ve.fasttm(E,le.value.metatable,Ve.TMS.TM_EQ))===null&&(ln=Ve.fasttm(E,cn.value.metatable,Ve.TMS.TM_EQ));break;default:return le.value===cn.value?1:0}if(ln===null)return 0;let wn=new M.TValue;return Ve.luaT_callTM(E,ln,le,cn,wn,1),wn.l_isfalse()?0:1},Bn=function(E,le){let cn=!1,ln=Kn(E,le<0?2:1);if(ln===!1){let wn=fn(E);if(wn===!1)return!1;0<wn?(ln=h,le<0&&(cn=!0)):(ln=X,le>=0&&(cn=!0))}return{stopnow:cn,ilimit:ln}},Kn=function(E,le){if(E.ttisfloat()){let cn=E.value,ln=Math.floor(cn);if(cn!==ln){if(le===0)return!1;le>1&&(ln+=1)}return V(ln)}if(E.ttisinteger())return E.value;if(Vn(E)){let cn=new M.TValue;if(M.luaO_str2num(E.svalue(),cn)===E.vslen()+1)return Kn(cn,le)}return!1},pe=function(E){return E.ttisinteger()?E.value:Kn(E,0)},fn=function(E){if(E.ttnov()===b)return E.value;if(Vn(E)){let le=new M.TValue;if(M.luaO_str2num(E.svalue(),le)===E.vslen()+1)return le.value}return!1},U=function(E,le){return E.value<le.value},Me=function(E,le){return E.value<=le.value},fe=function(E,le){let cn=Xe(E),ln=Xe(le);return cn===ln?0:cn<ln?-1:1},yn=function(E,le,cn){let ln;switch(cn.ttype()){case $:{let wn=cn.value;if((ln=Ve.fasttm(E,wn.metatable,Ve.TMS.TM_LEN))!==null)break;return void le.setivalue(vn.luaH_getn(wn))}case ce:case S:return void le.setivalue(cn.vslen());default:(ln=Ve.luaT_gettmbyobj(E,cn,Ve.TMS.TM_LEN)).ttisnil()&&i.luaG_typeerror(E,cn,se("get length of",!0))}Ve.luaT_callTM(E,ln,cn,cn,le,1)},Dn=Math.imul||function(E,le){let cn=65535&E,ln=65535&le;return cn*ln+((E>>>16&65535)*ln+cn*(le>>>16&65535)<<16>>>0)|0},Pn=function(E,le,cn){return cn===0&&i.luaG_runerror(E,se("attempt to divide by zero")),0|Math.floor(le/cn)},In=function(E,le,cn){return cn===0&&i.luaG_runerror(E,se("attempt to perform 'n%%0'")),le-Math.floor(le/cn)*cn|0},$n=function(E,le){return le<0?le<=-32?0:E>>>-le:le>=32?0:E<<le},ht=function(E,le,cn,ln){let wn=E.cache;if(wn!==null){let un=E.upvalues,_n=un.length;for(let We=0;We<_n;We++){let xn=un[We].instack?cn[ln+un[We].idx]:le[un[We].idx];if(wn.upvals[We]!==xn)return null}}return wn},Fn=function(E,le,cn,ln,wn){let un=le.upvalues.length,_n=le.upvalues,We=new M.LClosure(E,un);We.p=le,E.stack[wn].setclLvalue(We);for(let xn=0;xn<un;xn++)_n[xn].instack?We.upvals[xn]=te.luaF_findupval(E,ln+_n[xn].idx):We.upvals[xn]=cn[_n[xn].idx];le.cache=We},Jn=function(E){return E.ttisnumber()},Vn=function(E){return E.ttisstring()},ut=function(E,le){let cn=E.stack[le];return!!cn.ttisstring()||!!Jn(cn)&&(M.luaO_tostring(E,cn),!0)},lt=function(E){return E.ttisstring()&&E.vslen()===0},Ct=function(E,le,cn,ln){let wn=0;do{let un=E.stack[le-cn],_n=un.vslen(),We=un.svalue();ln.set(We,wn),wn+=_n}while(--cn>0)},pt=function(E,le){J(le>=2);do{let cn=E.top,ln=2;if((E.stack[cn-2].ttisstring()||Jn(E.stack[cn-2]))&&ut(E,cn-1))if(lt(E.stack[cn-1]))ut(E,cn-2);else if(lt(E.stack[cn-2]))M.setobjs2s(E,cn-2,cn-1);else{let wn=E.stack[cn-1].vslen();for(ln=1;ln<le&&ut(E,cn-ln-1);ln++)wn+=E.stack[cn-ln-1].vslen();let un=new Uint8Array(wn);Ct(E,cn,ln,un);let _n=Se(E,un);M.setsvalue2s(E,cn-ln,_n)}else Ve.luaT_trybinTM(E,E.stack[cn-2],E.stack[cn-1],E.stack[cn-2],Ve.TMS.TM_CONCAT);for(le-=ln-1;E.top>cn-(ln-1);)delete E.stack[--E.top]}while(le>1)},Dt=function(E,le,cn,ln){for(let wn=0;wn<2e3;wn++){let un;if(le.ttistable()){let _n=vn.luaH_get(E,le.value,cn);if(!_n.ttisnil())return void M.setobj2s(E,ln,_n);if((un=Ve.fasttm(E,le.value.metatable,Ve.TMS.TM_INDEX))===null)return void E.stack[ln].setnilvalue()}else(un=Ve.luaT_gettmbyobj(E,le,Ve.TMS.TM_INDEX)).ttisnil()&&i.luaG_typeerror(E,le,se("index",!0));if(un.ttisfunction())return void Ve.luaT_callTM(E,un,le,cn,E.stack[ln],1);le=un}i.luaG_runerror(E,se("'__index' chain too long; possible loop",!0))},At=function(E,le,cn,ln){for(let wn=0;wn<2e3;wn++){let un;if(le.ttistable()){let _n=le.value;if(!vn.luaH_get(E,_n,cn).ttisnil()||(un=Ve.fasttm(E,_n.metatable,Ve.TMS.TM_NEWINDEX))===null)return vn.luaH_setfrom(E,_n,cn,ln),void vn.invalidateTMcache(_n)}else(un=Ve.luaT_gettmbyobj(E,le,Ve.TMS.TM_NEWINDEX)).ttisnil()&&i.luaG_typeerror(E,le,se("index",!0));if(un.ttisfunction())return void Ve.luaT_callTM(E,un,le,cn,ln,0);le=un}i.luaG_runerror(E,se("'__newindex' chain too long; possible loop",!0))};a.exports.cvt2str=Jn,a.exports.cvt2num=Vn,a.exports.luaV_gettable=Dt,a.exports.luaV_concat=pt,a.exports.luaV_div=Pn,a.exports.luaV_equalobj=gn,a.exports.luaV_execute=function(E){let le=E.ci;le.callstatus|=Ee.CIST_FRESH;e:for(;;){J(le===E.ci);let cn=le.func.value,ln=cn.p.k,wn=le.l_base,un=le.l_code[le.l_savedpc++];E.hookmask&(A|v)&&i.luaG_traceexec(E);let _n=s(0,wn,un);switch(un.opcode){case Ie:M.setobjs2s(E,_n,_(0,wn,un));break;case Ze:{let We=ln[un.Bx];M.setobj2s(E,_n,We);break}case dn:{J(le.l_code[le.l_savedpc].opcode===ae);let We=ln[le.l_code[le.l_savedpc++].Ax];M.setobj2s(E,_n,We);break}case pn:E.stack[_n].setbvalue(un.B!==0),un.C!==0&&le.l_savedpc++;break;case mn:for(let We=0;We<=un.B;We++)E.stack[_n+We].setnilvalue();break;case T:{let We=un.B;M.setobj2s(E,_n,cn.upvals[We]);break}case Ce:{let We=cn.upvals[un.B],xn=m(E,wn,ln,un);Dt(E,We,xn,_n);break}case C:{let We=E.stack[_(0,wn,un)],xn=m(E,wn,ln,un);Dt(E,We,xn,_n);break}case me:{let We=cn.upvals[un.A],xn=c(E,wn,ln,un),Ln=m(E,wn,ln,un);At(E,We,xn,Ln);break}case He:cn.upvals[un.B].setfrom(E.stack[_n]);break;case N:{let We=E.stack[_n],xn=c(E,wn,ln,un),Ln=m(E,wn,ln,un);At(E,We,xn,Ln);break}case rn:E.stack[_n].sethvalue(vn.luaH_new(E));break;case ie:{let We=_(0,wn,un),xn=m(E,wn,ln,un);M.setobjs2s(E,_n+1,We),Dt(E,E.stack[We],xn,_n);break}case qe:{let We,xn,Ln=c(E,wn,ln,un),p=m(E,wn,ln,un);Ln.ttisinteger()&&p.ttisinteger()?E.stack[_n].setivalue(Ln.value+p.value|0):(We=fn(Ln))!==!1&&(xn=fn(p))!==!1?E.stack[_n].setfltvalue(We+xn):Ve.luaT_trybinTM(E,Ln,p,E.stack[_n],Ve.TMS.TM_ADD);break}case Pe:{let We,xn,Ln=c(E,wn,ln,un),p=m(E,wn,ln,un);Ln.ttisinteger()&&p.ttisinteger()?E.stack[_n].setivalue(Ln.value-p.value|0):(We=fn(Ln))!==!1&&(xn=fn(p))!==!1?E.stack[_n].setfltvalue(We-xn):Ve.luaT_trybinTM(E,Ln,p,E.stack[_n],Ve.TMS.TM_SUB);break}case Te:{let We,xn,Ln=c(E,wn,ln,un),p=m(E,wn,ln,un);Ln.ttisinteger()&&p.ttisinteger()?E.stack[_n].setivalue(Dn(Ln.value,p.value)):(We=fn(Ln))!==!1&&(xn=fn(p))!==!1?E.stack[_n].setfltvalue(We*xn):Ve.luaT_trybinTM(E,Ln,p,E.stack[_n],Ve.TMS.TM_MUL);break}case ee:{let We,xn,Ln=c(E,wn,ln,un),p=m(E,wn,ln,un);Ln.ttisinteger()&&p.ttisinteger()?E.stack[_n].setivalue(In(E,Ln.value,p.value)):(We=fn(Ln))!==!1&&(xn=fn(p))!==!1?E.stack[_n].setfltvalue(f(E,We,xn)):Ve.luaT_trybinTM(E,Ln,p,E.stack[_n],Ve.TMS.TM_MOD);break}case bn:{let We,xn,Ln=c(E,wn,ln,un),p=m(E,wn,ln,un);(We=fn(Ln))!==!1&&(xn=fn(p))!==!1?E.stack[_n].setfltvalue(Math.pow(We,xn)):Ve.luaT_trybinTM(E,Ln,p,E.stack[_n],Ve.TMS.TM_POW);break}case an:{let We,xn,Ln=c(E,wn,ln,un),p=m(E,wn,ln,un);(We=fn(Ln))!==!1&&(xn=fn(p))!==!1?E.stack[_n].setfltvalue(We/xn):Ve.luaT_trybinTM(E,Ln,p,E.stack[_n],Ve.TMS.TM_DIV);break}case g:{let We,xn,Ln=c(E,wn,ln,un),p=m(E,wn,ln,un);Ln.ttisinteger()&&p.ttisinteger()?E.stack[_n].setivalue(Pn(E,Ln.value,p.value)):(We=fn(Ln))!==!1&&(xn=fn(p))!==!1?E.stack[_n].setfltvalue(Math.floor(We/xn)):Ve.luaT_trybinTM(E,Ln,p,E.stack[_n],Ve.TMS.TM_IDIV);break}case on:{let We,xn,Ln=c(E,wn,ln,un),p=m(E,wn,ln,un);(We=pe(Ln))!==!1&&(xn=pe(p))!==!1?E.stack[_n].setivalue(We&xn):Ve.luaT_trybinTM(E,Ln,p,E.stack[_n],Ve.TMS.TM_BAND);break}case re:{let We,xn,Ln=c(E,wn,ln,un),p=m(E,wn,ln,un);(We=pe(Ln))!==!1&&(xn=pe(p))!==!1?E.stack[_n].setivalue(We|xn):Ve.luaT_trybinTM(E,Ln,p,E.stack[_n],Ve.TMS.TM_BOR);break}case be:{let We,xn,Ln=c(E,wn,ln,un),p=m(E,wn,ln,un);(We=pe(Ln))!==!1&&(xn=pe(p))!==!1?E.stack[_n].setivalue(We^xn):Ve.luaT_trybinTM(E,Ln,p,E.stack[_n],Ve.TMS.TM_BXOR);break}case G:{let We,xn,Ln=c(E,wn,ln,un),p=m(E,wn,ln,un);(We=pe(Ln))!==!1&&(xn=pe(p))!==!1?E.stack[_n].setivalue($n(We,xn)):Ve.luaT_trybinTM(E,Ln,p,E.stack[_n],Ve.TMS.TM_SHL);break}case Ae:{let We,xn,Ln=c(E,wn,ln,un),p=m(E,wn,ln,un);(We=pe(Ln))!==!1&&(xn=pe(p))!==!1?E.stack[_n].setivalue($n(We,-xn)):Ve.luaT_trybinTM(E,Ln,p,E.stack[_n],Ve.TMS.TM_SHR);break}case o:{let We,xn=E.stack[_(0,wn,un)];xn.ttisinteger()?E.stack[_n].setivalue(0|-xn.value):(We=fn(xn))!==!1?E.stack[_n].setfltvalue(-We):Ve.luaT_trybinTM(E,xn,xn,E.stack[_n],Ve.TMS.TM_UNM);break}case P:{let We=E.stack[_(0,wn,un)];We.ttisinteger()?E.stack[_n].setivalue(~We.value):Ve.luaT_trybinTM(E,We,We,E.stack[_n],Ve.TMS.TM_BNOT);break}case On:{let We=E.stack[_(0,wn,un)];E.stack[_n].setbvalue(We.l_isfalse());break}case we:yn(E,E.stack[_n],E.stack[_(0,wn,un)]);break;case tn:{let We=un.B,xn=un.C;E.top=wn+xn+1,pt(E,xn-We+1);let Ln=wn+We;M.setobjs2s(E,_n,Ln),Fe.adjust_top(E,le.top);break}case L:O(E,le,un,0);break;case sn:gn(E,c(E,wn,ln,un),m(E,wn,ln,un))!==un.A?le.l_savedpc++:y(E,le);break;case Y:ne(E,c(E,wn,ln,un),m(E,wn,ln,un))!==un.A?le.l_savedpc++:y(E,le);break;case xe:en(E,c(E,wn,ln,un),m(E,wn,ln,un))!==un.A?le.l_savedpc++:y(E,le);break;case Un:(un.C?E.stack[_n].l_isfalse():!E.stack[_n].l_isfalse())?le.l_savedpc++:y(E,le);break;case Mn:{let We=_(0,wn,un),xn=E.stack[We];(un.C?xn.l_isfalse():!xn.l_isfalse())?le.l_savedpc++:(M.setobjs2s(E,_n,We),y(E,le));break}case ge:{let We=un.B,xn=un.C-1;if(We!==0&&Fe.adjust_top(E,_n+We),!Fe.luaD_precall(E,_n,xn)){le=E.ci;continue e}xn>=0&&Fe.adjust_top(E,le.top);break}case Nn:{let We=un.B;if(We!==0&&Fe.adjust_top(E,_n+We),!Fe.luaD_precall(E,_n,D)){let xn=E.ci,Ln=xn.previous,p=xn.func,q=xn.funcOff,K=Ln.funcOff,ye=xn.l_base+p.value.p.numparams;cn.p.p.length>0&&te.luaF_close(E,Ln.l_base);for(let he=0;q+he<ye;he++)M.setobjs2s(E,K+he,q+he);Ln.l_base=K+(xn.l_base-q),Ln.top=K+(E.top-q),Fe.adjust_top(E,Ln.top),Ln.l_code=xn.l_code,Ln.l_savedpc=xn.l_savedpc,Ln.callstatus|=Ee.CIST_TAIL,Ln.next=null,le=E.ci=Ln,J(E.top===Ln.l_base+E.stack[K].value.p.maxstacksize);continue e}break}case Je:{cn.p.p.length>0&&te.luaF_close(E,wn);let We=Fe.luaD_poscall(E,le,_n,un.B!==0?un.B-1:E.top-_n);if(le.callstatus&Ee.CIST_FRESH)return;le=E.ci,We&&Fe.adjust_top(E,le.top),J(le.callstatus&Ee.CIST_LUA),J(le.l_code[le.l_savedpc-1].opcode===ge);continue e}case oe:if(E.stack[_n].ttisinteger()){let We=E.stack[_n+2].value,xn=E.stack[_n].value+We|0,Ln=E.stack[_n+1].value;(0<We?xn<=Ln:Ln<=xn)&&(le.l_savedpc+=un.sBx,E.stack[_n].chgivalue(xn),E.stack[_n+3].setivalue(xn))}else{let We=E.stack[_n+2].value,xn=E.stack[_n].value+We,Ln=E.stack[_n+1].value;(0<We?xn<=Ln:Ln<=xn)&&(le.l_savedpc+=un.sBx,E.stack[_n].chgfltvalue(xn),E.stack[_n+3].setfltvalue(xn))}break;case ze:{let We,xn=E.stack[_n],Ln=E.stack[_n+1],p=E.stack[_n+2];if(xn.ttisinteger()&&p.ttisinteger()&&(We=Bn(Ln,p.value))){let q=We.stopnow?0:xn.value;Ln.value=We.ilimit,xn.value=q-p.value|0}else{let q,K,ye;(q=fn(Ln))===!1&&i.luaG_runerror(E,se("'for' limit must be a number",!0)),E.stack[_n+1].setfltvalue(q),(K=fn(p))===!1&&i.luaG_runerror(E,se("'for' step must be a number",!0)),E.stack[_n+2].setfltvalue(K),(ye=fn(xn))===!1&&i.luaG_runerror(E,se("'for' initial value must be a number",!0)),E.stack[_n].setfltvalue(ye-K)}le.l_savedpc+=un.sBx;break}case Zn:{let We=_n+3;M.setobjs2s(E,We+2,_n+2),M.setobjs2s(E,We+1,_n+1),M.setobjs2s(E,We,_n),Fe.adjust_top(E,We+3),Fe.luaD_call(E,We,un.C),Fe.adjust_top(E,le.top),un=le.l_code[le.l_savedpc++],_n=s(0,wn,un),J(un.opcode===ot)}case ot:E.stack[_n+1].ttisnil()||(M.setobjs2s(E,_n,_n+1),le.l_savedpc+=un.sBx);break;case Ue:{let We=un.B,xn=un.C;We===0&&(We=E.top-_n-1),xn===0&&(J(le.l_code[le.l_savedpc].opcode===ae),xn=le.l_code[le.l_savedpc++].Ax);let Ln=E.stack[_n].value,p=(xn-1)*Ke+We;for(;We>0;We--)vn.luaH_setint(Ln,p--,E.stack[_n+We]);Fe.adjust_top(E,le.top);break}case Oe:{let We=cn.p.p[un.Bx],xn=ht(We,cn.upvals,E.stack,wn);xn===null?Fn(E,We,cn.upvals,wn,_n):E.stack[_n].setclLvalue(xn);break}case de:{let We,xn=un.B-1,Ln=wn-le.funcOff-cn.p.numparams-1;for(Ln<0&&(Ln=0),xn<0&&(xn=Ln,Fe.luaD_checkstack(E,Ln),Fe.adjust_top(E,_n+Ln)),We=0;We<xn&&We<Ln;We++)M.setobjs2s(E,_n+We,wn-Ln+We);for(;We<xn;We++)E.stack[_n+We].setnilvalue();break}case ae:throw Error("invalid opcode")}}},a.exports.luaV_finishOp=function(E){let le=E.ci,cn=le.l_base,ln=le.l_code[le.l_savedpc-1],wn=ln.opcode;switch(wn){case qe:case Pe:case Te:case an:case g:case on:case re:case be:case G:case Ae:case ee:case bn:case o:case P:case we:case Ce:case C:case ie:M.setobjs2s(E,cn+ln.A,E.top-1),delete E.stack[--E.top];break;case xe:case Y:case sn:{let un=!E.stack[E.top-1].l_isfalse();delete E.stack[--E.top],le.callstatus&Ee.CIST_LEQ&&(J(wn===xe),le.callstatus^=Ee.CIST_LEQ,un=!un),J(le.l_code[le.l_savedpc].opcode===L),un!==!!ln.A&&le.l_savedpc++;break}case tn:{let un=E.top-1,_n=un-1-(cn+ln.B);M.setobjs2s(E,un-2,un),_n>1&&(E.top=un-1,pt(E,_n)),M.setobjs2s(E,le.l_base+ln.A,E.top-1),Fe.adjust_top(E,le.top);break}case Zn:J(le.l_code[le.l_savedpc].opcode===ot),Fe.adjust_top(E,le.top);break;case ge:ln.C-1>=0&&Fe.adjust_top(E,le.top)}},a.exports.luaV_imul=Dn,a.exports.luaV_lessequal=en,a.exports.luaV_lessthan=ne,a.exports.luaV_mod=In,a.exports.luaV_objlen=yn,a.exports.luaV_rawequalobj=function(E,le){return gn(null,E,le)},a.exports.luaV_shiftl=$n,a.exports.luaV_tointeger=Kn,a.exports.settable=At,a.exports.tointeger=pe,a.exports.tonumber=fn},function(a,B,d){const A=[96,113,65,84,80,80,92,108,60,16,60,84,108,124,124,124,124,124,124,124,124,124,124,124,124,96,96,96,96,104,34,188,188,188,132,228,84,84,16,98,98,4,98,20,81,80,23],v=function(S,H){return~(-1<<S)<<H},D=function(S,H){return~v(S,H)},R=function(S,H,b,F){return S.code=S.code&D(F,b)|H<<b&v(F,b),z(S)},I=function(S,H){return R(S,H,14,18)},z=function(S){if(typeof S=="number")return{code:S,opcode:S>>0&v(6,0),A:S>>6&v(8,0),B:S>>23&v(9,0),C:S>>14&v(9,0),Bx:S>>14&v(18,0),Ax:S>>6&v(26,0),sBx:(S>>14&v(18,0))-131071};{let H=S.code;return S.opcode=H>>0&v(6,0),S.A=H>>6&v(8,0),S.B=H>>23&v(9,0),S.C=H>>14&v(9,0),S.Bx=H>>14&v(18,0),S.Ax=H>>6&v(26,0),S.sBx=(H>>14&v(18,0))-131071,S}};a.exports.BITRK=256,a.exports.CREATE_ABC=function(S,H,b,F){return z(S<<0|H<<6|b<<23|F<<14)},a.exports.CREATE_ABx=function(S,H,b){return z(S<<0|H<<6|b<<14)},a.exports.CREATE_Ax=function(S,H){return z(S<<0|H<<6)},a.exports.GET_OPCODE=function(S){return S.opcode},a.exports.GETARG_A=function(S){return S.A},a.exports.GETARG_B=function(S){return S.B},a.exports.GETARG_C=function(S){return S.C},a.exports.GETARG_Bx=function(S){return S.Bx},a.exports.GETARG_Ax=function(S){return S.Ax},a.exports.GETARG_sBx=function(S){return S.sBx},a.exports.INDEXK=function(S){return-257&S},a.exports.ISK=function(S){return 256&S},a.exports.LFIELDS_PER_FLUSH=50,a.exports.MAXARG_A=255,a.exports.MAXARG_Ax=67108863,a.exports.MAXARG_B=511,a.exports.MAXARG_Bx=262143,a.exports.MAXARG_C=511,a.exports.MAXARG_sBx=131071,a.exports.MAXINDEXRK=255,a.exports.NO_REG=255,a.exports.OpArgK=3,a.exports.OpArgN=0,a.exports.OpArgR=2,a.exports.OpArgU=1,a.exports.OpCodes=["MOVE","LOADK","LOADKX","LOADBOOL","LOADNIL","GETUPVAL","GETTABUP","GETTABLE","SETTABUP","SETUPVAL","SETTABLE","NEWTABLE","SELF","ADD","SUB","MUL","MOD","POW","DIV","IDIV","BAND","BOR","BXOR","SHL","SHR","UNM","BNOT","NOT","LEN","CONCAT","JMP","EQ","LT","LE","TEST","TESTSET","CALL","TAILCALL","RETURN","FORLOOP","FORPREP","TFORCALL","TFORLOOP","SETLIST","CLOSURE","VARARG","EXTRAARG"],a.exports.OpCodesI={OP_MOVE:0,OP_LOADK:1,OP_LOADKX:2,OP_LOADBOOL:3,OP_LOADNIL:4,OP_GETUPVAL:5,OP_GETTABUP:6,OP_GETTABLE:7,OP_SETTABUP:8,OP_SETUPVAL:9,OP_SETTABLE:10,OP_NEWTABLE:11,OP_SELF:12,OP_ADD:13,OP_SUB:14,OP_MUL:15,OP_MOD:16,OP_POW:17,OP_DIV:18,OP_IDIV:19,OP_BAND:20,OP_BOR:21,OP_BXOR:22,OP_SHL:23,OP_SHR:24,OP_UNM:25,OP_BNOT:26,OP_NOT:27,OP_LEN:28,OP_CONCAT:29,OP_JMP:30,OP_EQ:31,OP_LT:32,OP_LE:33,OP_TEST:34,OP_TESTSET:35,OP_CALL:36,OP_TAILCALL:37,OP_RETURN:38,OP_FORLOOP:39,OP_FORPREP:40,OP_TFORCALL:41,OP_TFORLOOP:42,OP_SETLIST:43,OP_CLOSURE:44,OP_VARARG:45,OP_EXTRAARG:46},a.exports.POS_A=6,a.exports.POS_Ax=6,a.exports.POS_B=23,a.exports.POS_Bx=14,a.exports.POS_C=14,a.exports.POS_OP=0,a.exports.RKASK=function(S){return 256|S},a.exports.SETARG_A=function(S,H){return R(S,H,6,8)},a.exports.SETARG_Ax=function(S,H){return R(S,H,6,26)},a.exports.SETARG_B=function(S,H){return R(S,H,23,9)},a.exports.SETARG_Bx=I,a.exports.SETARG_C=function(S,H){return R(S,H,14,9)},a.exports.SETARG_sBx=function(S,H){return I(S,H+131071)},a.exports.SET_OPCODE=function(S,H){return S.code=S.code&D(6,0)|H<<0&v(6,0),z(S)},a.exports.SIZE_A=8,a.exports.SIZE_Ax=26,a.exports.SIZE_B=9,a.exports.SIZE_Bx=18,a.exports.SIZE_C=9,a.exports.SIZE_OP=6,a.exports.fullins=z,a.exports.getBMode=function(S){return A[S]>>4&3},a.exports.getCMode=function(S){return A[S]>>2&3},a.exports.getOpMode=function(S){return 3&A[S]},a.exports.iABC=0,a.exports.iABx=1,a.exports.iAsBx=2,a.exports.iAx=3,a.exports.testAMode=function(S){return 64&A[S]},a.exports.testTMode=function(S){return 128&A[S]}},function(a,B,d){const{LUA_VERSION_MAJOR:A,LUA_VERSION_MINOR:v}=d(2),D="_"+A+"_"+v;a.exports.LUA_VERSUFFIX=D,a.exports.lua_assert=function(I){},a.exports.luaopen_base=d(24).luaopen_base,a.exports.LUA_COLIBNAME="coroutine",a.exports.luaopen_coroutine=d(25).luaopen_coroutine,a.exports.LUA_TABLIBNAME="table",a.exports.luaopen_table=d(26).luaopen_table,a.exports.LUA_OSLIBNAME="os",a.exports.luaopen_os=d(27).luaopen_os,a.exports.LUA_STRLIBNAME="string",a.exports.luaopen_string=d(28).luaopen_string,a.exports.LUA_UTF8LIBNAME="utf8",a.exports.luaopen_utf8=d(29).luaopen_utf8,a.exports.LUA_BITLIBNAME="bit32",a.exports.LUA_MATHLIBNAME="math",a.exports.luaopen_math=d(30).luaopen_math,a.exports.LUA_DBLIBNAME="debug",a.exports.luaopen_debug=d(31).luaopen_debug,a.exports.LUA_LOADLIBNAME="package",a.exports.luaopen_package=d(32).luaopen_package,a.exports.LUA_FENGARILIBNAME="fengari",a.exports.luaopen_fengari=d(33).luaopen_fengari;const R=d(39);a.exports.luaL_openlibs=R.luaL_openlibs},function(a,B,d){const{LUA_MULTRET:A,LUA_OPBNOT:v,LUA_OPEQ:D,LUA_OPLE:R,LUA_OPLT:I,LUA_OPUNM:z,LUA_REGISTRYINDEX:S,LUA_RIDX_GLOBALS:H,LUA_VERSION_NUM:b,constant_types:{LUA_NUMTAGS:F,LUA_TBOOLEAN:Q,LUA_TCCL:ce,LUA_TFUNCTION:$,LUA_TLCF:ve,LUA_TLCL:se,LUA_TLIGHTUSERDATA:$e,LUA_TLNGSTR:nn,LUA_TNIL:Ke,LUA_TNONE:qe,LUA_TNUMFLT:on,LUA_TNUMINT:P,LUA_TSHRSTR:re,LUA_TTABLE:be,LUA_TTHREAD:ge,LUA_TUSERDATA:Oe},thread_status:{LUA_OK:tn},from_userstring:an,to_luastring:sn}=d(1),{api_check:ae}=d(4),oe=d(11),ze=d(8),{luaU_dump:C}=d(37),Ce=d(13),T=d(6),g=d(12),{luaS_bless:L,luaS_new:xe,luaS_newliteral:we}=d(10),pn=d(14),{LUAI_MAXSTACK:Ze}=d(3),dn=d(15),mn=d(9),{ZIO:Y}=d(19),ee=T.TValue,Ie=T.CClosure,Te=function(i){i.top++,ae(i,i.top<=i.ci.top,"stack overflow")},rn=function(i,s){ae(i,s<i.top-i.ci.funcOff,"not enough elements in the stack")},On=function(i){if(!i)throw TypeError("invalid argument")},bn=function(i){On(typeof i=="number"&&(0|i)===i)},Je=function(i){return i!==T.luaO_nilobject},ie=function(i,s){let _=i.ci;if(s>0){let c=_.funcOff+s;return ae(i,s<=_.top-(_.funcOff+1),"unacceptable index"),c>=i.top?T.luaO_nilobject:i.stack[c]}return s>S?(ae(i,s!==0&&-s<=i.top,"invalid index"),i.stack[i.top+s]):s===S?i.l_G.l_registry:(ae(i,(s=S-s)<=Ce.MAXUPVAL+1,"upvalue index too large"),_.func.ttislcf()?T.luaO_nilobject:s<=_.func.value.nupvalues?_.func.value.upvalue[s-1]:T.luaO_nilobject)},Ue=function(i,s){let _=i.ci;if(s>0){let c=_.funcOff+s;return ae(i,s<=_.top-(_.funcOff+1),"unacceptable index"),c>=i.top?null:c}if(s>S)return ae(i,s!==0&&-s<=i.top,"invalid index"),i.top+s;throw Error("attempt to use pseudo-index")},N=function(i,s){let _,c=i.ci.funcOff;s>=0?(ae(i,s<=i.stack_last-(c+1),"new top too large"),_=c+1+s):(ae(i,-(s+1)<=i.top-(c+1),"invalid new top"),_=i.top+s+1),ze.adjust_top(i,_)},me=function(i,s){N(i,-s-1)},He=function(i,s,_){for(;s<_;s++,_--){let c=i.stack[s],m=new ee(c.type,c.value);T.setobjs2s(i,s,_),T.setobj2s(i,_,m)}},G=function(i,s,_){let c=i.top-1,m=Ue(i,s),O=i.stack[m];ae(i,Je(O)&&s>S,"index not in the stack"),ae(i,(_>=0?_:-_)<=c-m+1,"invalid 'n'");let y=_>=0?c-_:m-_-1;He(i,m,y),He(i,y+1,i.top-1),He(i,m,i.top-1)},Ae=function(i,s,_){let c=ie(i,s);ie(i,_).setfrom(c)},Pe=function(i,s,_){if(On(typeof s=="function"),bn(_),_===0)i.stack[i.top]=new ee(ve,s);else{rn(i,_),ae(i,_<=Ce.MAXUPVAL,"upvalue index too large");let c=new Ie(i,s,_);for(let m=0;m<_;m++)c.upvalue[m].setfrom(i.stack[i.top-_+m]);for(let m=1;m<_;m++)delete i.stack[--i.top];_>0&&--i.top,i.stack[i.top].setclCvalue(c)}Te(i)},Nn=Pe,Un=function(i,s){Pe(i,s,0)},Mn=Un,Zn=function(i,s,_){let c=xe(i,an(_));rn(i,1),T.pushsvalue2s(i,c),ae(i,i.top<=i.ci.top,"stack overflow"),dn.settable(i,s,i.stack[i.top-1],i.stack[i.top-2]),delete i.stack[--i.top],delete i.stack[--i.top]},ot=function(i,s){Zn(i,mn.luaH_getint(i.l_G.l_registry.value,H),s)},o=function(i,s,_){let c=xe(i,an(_));return T.pushsvalue2s(i,c),ae(i,i.top<=i.ci.top,"stack overflow"),dn.luaV_gettable(i,s,i.stack[i.top-1],i.top-1),i.stack[i.top-1].ttnov()},de=function(i,s,_){let c=ie(i,s);return bn(_),ae(i,c.ttistable(),"table expected"),T.pushobj2s(i,mn.luaH_getint(c.value,_)),ae(i,i.top<=i.ci.top,"stack overflow"),i.stack[i.top-1].ttnov()},h=function(i,s,_){let c=new T.TValue(be,mn.luaH_new(i));i.stack[i.top]=c,Te(i)},X=function(i,s,_){switch(bn(_),s.ttype()){case ce:{let c=s.value;return 1<=_&&_<=c.nupvalues?{name:sn("",!0),val:c.upvalue[_-1]}:null}case se:{let c=s.value,m=c.p;if(!(1<=_&&_<=m.upvalues.length))return null;let O=m.upvalues[_-1].name;return{name:O?O.getstr():sn("(*no name)",!0),val:c.upvals[_-1]}}default:return null}},V=function(i,s){let _=ie(i,s);if(!_.ttisstring()){if(!dn.cvt2str(_))return null;T.luaO_tostring(i,_)}return _.svalue()},J=V,f=function(i,s){return dn.tointeger(ie(i,s))},M=function(i,s){return dn.tonumber(ie(i,s))},te=new WeakMap,Ee=function(i,s){ze.luaD_callnoyield(i,s.funcOff,s.nresults)},Se=function(i,s){let _=ie(i,s);return Je(_)?_.ttnov():qe},De=sn("?"),Xe=function(i,s,_){ae(i,_===A||i.ci.top-i.top>=_-s,"results from function overflow current stack size")},Fe=function(i,s,_,c,m){ae(i,m===null||!(i.ci.callstatus&g.CIST_LUA),"cannot use continuations inside hooks"),rn(i,s+1),ae(i,i.status===tn,"cannot do calls on non-normal thread"),Xe(i,s,_);let O=i.top-(s+1);m!==null&&i.nny===0?(i.ci.c_k=m,i.ci.c_ctx=c,ze.luaD_call(i,O,_)):ze.luaD_callnoyield(i,O,_),_===A&&i.ci.top<i.top&&(i.ci.top=i.top)},Ve=function(i,s,_,c,m,O){let y,ne;ae(i,O===null||!(i.ci.callstatus&g.CIST_LUA),"cannot use continuations inside hooks"),rn(i,s+1),ae(i,i.status===tn,"cannot do calls on non-normal thread"),Xe(i,s,_),ne=c===0?0:Ue(i,c);let en=i.top-(s+1);if(O===null||i.nny>0){let gn={funcOff:en,nresults:_};y=ze.luaD_pcall(i,Ee,gn,en,ne)}else{let gn=i.ci;gn.c_k=O,gn.c_ctx=m,gn.extra=en,gn.c_old_errfunc=i.errfunc,i.errfunc=ne,gn.callstatus&=~g.CIST_OAH|i.allowhook,gn.callstatus|=g.CIST_YPCALL,ze.luaD_call(i,en,_),gn.callstatus&=~g.CIST_YPCALL,i.errfunc=gn.c_old_errfunc,y=tn}return _===A&&i.ci.top<i.top&&(i.ci.top=i.top),y},vn=function(i,s,_){let c=ie(i,s);ae(i,c.ttisLclosure(),"Lua function expected");let m=c.value;return bn(_),ae(i,1<=_&&_<=m.p.upvalues.length,"invalid upvalue index"),{f:m,i:_-1}};a.exports.api_incr_top=Te,a.exports.api_checknelems=rn,a.exports.lua_absindex=function(i,s){return s>0||s<=S?s:i.top-i.ci.funcOff+s},a.exports.lua_arith=function(i,s){s!==z&&s!==v?rn(i,2):(rn(i,1),T.pushobj2s(i,i.stack[i.top-1]),ae(i,i.top<=i.ci.top,"stack overflow")),T.luaO_arith(i,s,i.stack[i.top-2],i.stack[i.top-1],i.stack[i.top-2]),delete i.stack[--i.top]},a.exports.lua_atpanic=function(i,s){let _=i.l_G.panic;return i.l_G.panic=s,_},a.exports.lua_atnativeerror=function(i,s){let _=i.l_G.atnativeerror;return i.l_G.atnativeerror=s,_},a.exports.lua_call=function(i,s,_){Fe(i,s,_,0,null)},a.exports.lua_callk=Fe,a.exports.lua_checkstack=function(i,s){let _,c=i.ci;return ae(i,s>=0,"negative 'n'"),i.stack_last-i.top>s?_=!0:i.top+g.EXTRA_STACK>Ze-s?_=!1:(ze.luaD_growstack(i,s),_=!0),_&&c.top<i.top+s&&(c.top=i.top+s),_},a.exports.lua_compare=function(i,s,_,c){let m=ie(i,s),O=ie(i,_),y=0;if(Je(m)&&Je(O))switch(c){case D:y=dn.luaV_equalobj(i,m,O);break;case I:y=dn.luaV_lessthan(i,m,O);break;case R:y=dn.luaV_lessequal(i,m,O);break;default:ae(i,!1,"invalid option")}return y},a.exports.lua_concat=function(i,s){rn(i,s),s>=2?dn.luaV_concat(i,s):s===0&&(T.pushsvalue2s(i,L(i,sn("",!0))),ae(i,i.top<=i.ci.top,"stack overflow"))},a.exports.lua_copy=Ae,a.exports.lua_createtable=h,a.exports.lua_dump=function(i,s,_,c){rn(i,1);let m=i.stack[i.top-1];return m.ttisLclosure()?C(i,m.value.p,s,_,c):1},a.exports.lua_error=function(i){rn(i,1),oe.luaG_errormsg(i)},a.exports.lua_gc=function(){},a.exports.lua_getallocf=function(){return console.warn("lua_getallocf is not available"),0},a.exports.lua_getextraspace=function(){return console.warn("lua_getextraspace is not available"),0},a.exports.lua_getfield=function(i,s,_){return o(i,ie(i,s),_)},a.exports.lua_getglobal=function(i,s){return o(i,mn.luaH_getint(i.l_G.l_registry.value,H),s)},a.exports.lua_geti=function(i,s,_){let c=ie(i,s);return bn(_),i.stack[i.top]=new ee(P,_),Te(i),dn.luaV_gettable(i,c,i.stack[i.top-1],i.top-1),i.stack[i.top-1].ttnov()},a.exports.lua_getmetatable=function(i,s){let _,c=ie(i,s),m=!1;switch(c.ttnov()){case be:case Oe:_=c.value.metatable;break;default:_=i.l_G.mt[c.ttnov()]}return _!=null&&(i.stack[i.top]=new ee(be,_),Te(i),m=!0),m},a.exports.lua_gettable=function(i,s){let _=ie(i,s);return dn.luaV_gettable(i,_,i.stack[i.top-1],i.top-1),i.stack[i.top-1].ttnov()},a.exports.lua_gettop=function(i){return i.top-(i.ci.funcOff+1)},a.exports.lua_getupvalue=function(i,s,_){let c=X(0,ie(i,s),_);if(c){let m=c.name,O=c.val;return T.pushobj2s(i,O),ae(i,i.top<=i.ci.top,"stack overflow"),m}return null},a.exports.lua_getuservalue=function(i,s){let _=ie(i,s);ae(i,_.ttisfulluserdata(),"full userdata expected");let c=_.value.uservalue;return i.stack[i.top]=new ee(c.type,c.value),Te(i),i.stack[i.top-1].ttnov()},a.exports.lua_insert=function(i,s){G(i,s,1)},a.exports.lua_isboolean=function(i,s){return Se(i,s)===Q},a.exports.lua_iscfunction=function(i,s){let _=ie(i,s);return _.ttislcf(_)||_.ttisCclosure()},a.exports.lua_isfunction=function(i,s){return Se(i,s)===$},a.exports.lua_isinteger=function(i,s){return ie(i,s).ttisinteger()},a.exports.lua_islightuserdata=function(i,s){return Se(i,s)===$e},a.exports.lua_isnil=function(i,s){return Se(i,s)===Ke},a.exports.lua_isnone=function(i,s){return Se(i,s)===qe},a.exports.lua_isnoneornil=function(i,s){return Se(i,s)<=0},a.exports.lua_isnumber=function(i,s){return dn.tonumber(ie(i,s))!==!1},a.exports.lua_isproxy=function(i,s){let _=te.get(i);return!!_&&(s===null||s.l_G===_)},a.exports.lua_isstring=function(i,s){let _=ie(i,s);return _.ttisstring()||dn.cvt2str(_)},a.exports.lua_istable=function(i,s){return ie(i,s).ttistable()},a.exports.lua_isthread=function(i,s){return Se(i,s)===ge},a.exports.lua_isuserdata=function(i,s){let _=ie(i,s);return _.ttisfulluserdata(_)||_.ttislightuserdata()},a.exports.lua_len=function(i,s){let _=ie(i,s),c=new ee;dn.luaV_objlen(i,c,_),i.stack[i.top]=c,Te(i)},a.exports.lua_load=function(i,s,_,c,m){c=c?an(c):De,m!==null&&(m=an(m));let O=new Y(i,s,_),y=ze.luaD_protectedparser(i,O,c,m);if(y===tn){let ne=i.stack[i.top-1].value;if(ne.nupvalues>=1){let en=mn.luaH_getint(i.l_G.l_registry.value,H);ne.upvals[0].setfrom(en)}}return y},a.exports.lua_newtable=function(i){h(i)},a.exports.lua_newuserdata=function(i,s){let _=(function(c,m){return new T.Udata(c,m)})(i,s);return i.stack[i.top]=new T.TValue(Oe,_),Te(i),_.data},a.exports.lua_next=function(i,s){let _=ie(i,s);return ae(i,_.ttistable(),"table expected"),i.stack[i.top]=new ee,mn.luaH_next(i,_.value,i.top-1)?(Te(i),1):(delete i.stack[i.top],delete i.stack[--i.top],0)},a.exports.lua_pcall=function(i,s,_,c){return Ve(i,s,_,c,0,null)},a.exports.lua_pcallk=Ve,a.exports.lua_pop=me,a.exports.lua_pushboolean=function(i,s){i.stack[i.top]=new ee(Q,!!s),Te(i)},a.exports.lua_pushcclosure=Pe,a.exports.lua_pushcfunction=Un,a.exports.lua_pushfstring=function(i,s,..._){return s=an(s),T.luaO_pushvfstring(i,s,_)},a.exports.lua_pushglobaltable=function(i){de(i,S,H)},a.exports.lua_pushinteger=function(i,s){bn(s),i.stack[i.top]=new ee(P,s),Te(i)},a.exports.lua_pushjsclosure=Nn,a.exports.lua_pushjsfunction=Mn,a.exports.lua_pushlightuserdata=function(i,s){i.stack[i.top]=new ee($e,s),Te(i)},a.exports.lua_pushliteral=function(i,s){if(s==null)i.stack[i.top]=new ee(Ke,null),i.top++;else{On(typeof s=="string");let _=we(i,s);T.pushsvalue2s(i,_),s=_.getstr()}return ae(i,i.top<=i.ci.top,"stack overflow"),s},a.exports.lua_pushlstring=function(i,s,_){let c;return bn(_),_===0?(s=sn("",!0),c=L(i,s)):(s=an(s),ae(i,s.length>=_,"invalid length to lua_pushlstring"),c=xe(i,s.subarray(0,_))),T.pushsvalue2s(i,c),ae(i,i.top<=i.ci.top,"stack overflow"),c.value},a.exports.lua_pushnil=function(i){i.stack[i.top]=new ee(Ke,null),Te(i)},a.exports.lua_pushnumber=function(i,s){On(typeof s=="number"),i.stack[i.top]=new ee(on,s),Te(i)},a.exports.lua_pushstring=function(i,s){if(s==null)i.stack[i.top]=new ee(Ke,null),i.top++;else{let _=xe(i,an(s));T.pushsvalue2s(i,_),s=_.getstr()}return ae(i,i.top<=i.ci.top,"stack overflow"),s},a.exports.lua_pushthread=function(i){return i.stack[i.top]=new ee(ge,i),Te(i),i.l_G.mainthread===i},a.exports.lua_pushvalue=function(i,s){T.pushobj2s(i,ie(i,s)),ae(i,i.top<=i.ci.top,"stack overflow")},a.exports.lua_pushvfstring=function(i,s,_){return s=an(s),T.luaO_pushvfstring(i,s,_)},a.exports.lua_rawequal=function(i,s,_){let c=ie(i,s),m=ie(i,_);return Je(c)&&Je(m)?dn.luaV_equalobj(null,c,m):0},a.exports.lua_rawget=function(i,s){let _=ie(i,s);return ae(i,_.ttistable(_),"table expected"),T.setobj2s(i,i.top-1,mn.luaH_get(i,_.value,i.stack[i.top-1])),i.stack[i.top-1].ttnov()},a.exports.lua_rawgeti=de,a.exports.lua_rawgetp=function(i,s,_){let c=ie(i,s);ae(i,c.ttistable(),"table expected");let m=new ee($e,_);return T.pushobj2s(i,mn.luaH_get(i,c.value,m)),ae(i,i.top<=i.ci.top,"stack overflow"),i.stack[i.top-1].ttnov()},a.exports.lua_rawlen=function(i,s){let _=ie(i,s);switch(_.ttype()){case re:case nn:return _.vslen();case Oe:return _.value.len;case be:return mn.luaH_getn(_.value);default:return 0}},a.exports.lua_rawset=function(i,s){rn(i,2);let _=ie(i,s);ae(i,_.ttistable(),"table expected");let c=i.stack[i.top-2],m=i.stack[i.top-1];mn.luaH_setfrom(i,_.value,c,m),mn.invalidateTMcache(_.value),delete i.stack[--i.top],delete i.stack[--i.top]},a.exports.lua_rawseti=function(i,s,_){bn(_),rn(i,1);let c=ie(i,s);ae(i,c.ttistable(),"table expected"),mn.luaH_setint(c.value,_,i.stack[i.top-1]),delete i.stack[--i.top]},a.exports.lua_rawsetp=function(i,s,_){rn(i,1);let c=ie(i,s);ae(i,c.ttistable(),"table expected");let m=new ee($e,_),O=i.stack[i.top-1];mn.luaH_setfrom(i,c.value,m,O),delete i.stack[--i.top]},a.exports.lua_register=function(i,s,_){Un(i,_),ot(i,s)},a.exports.lua_remove=function(i,s){G(i,s,-1),me(i,1)},a.exports.lua_replace=function(i,s){Ae(i,-1,s),me(i,1)},a.exports.lua_rotate=G,a.exports.lua_setallocf=function(){return console.warn("lua_setallocf is not available"),0},a.exports.lua_setfield=function(i,s,_){Zn(i,ie(i,s),_)},a.exports.lua_setglobal=ot,a.exports.lua_seti=function(i,s,_){bn(_),rn(i,1);let c=ie(i,s);i.stack[i.top]=new ee(P,_),Te(i),dn.settable(i,c,i.stack[i.top-1],i.stack[i.top-2]),delete i.stack[--i.top],delete i.stack[--i.top]},a.exports.lua_setmetatable=function(i,s){let _;rn(i,1);let c=ie(i,s);switch(i.stack[i.top-1].ttisnil()?_=null:(ae(i,i.stack[i.top-1].ttistable(),"table expected"),_=i.stack[i.top-1].value),c.ttnov()){case Oe:case be:c.value.metatable=_;break;default:i.l_G.mt[c.ttnov()]=_}return delete i.stack[--i.top],!0},a.exports.lua_settable=function(i,s){rn(i,2);let _=ie(i,s);dn.settable(i,_,i.stack[i.top-2],i.stack[i.top-1]),delete i.stack[--i.top],delete i.stack[--i.top]},a.exports.lua_settop=N,a.exports.lua_setupvalue=function(i,s,_){let c=ie(i,s);rn(i,1);let m=X(0,c,_);if(m){let O=m.name;return m.val.setfrom(i.stack[i.top-1]),delete i.stack[--i.top],O}return null},a.exports.lua_setuservalue=function(i,s){rn(i,1);let _=ie(i,s);ae(i,_.ttisfulluserdata(),"full userdata expected"),_.value.uservalue.setfrom(i.stack[i.top-1]),delete i.stack[--i.top]},a.exports.lua_status=function(i){return i.status},a.exports.lua_stringtonumber=function(i,s){let _=new ee,c=T.luaO_str2num(s,_);return c!==0&&(i.stack[i.top]=_,Te(i)),c},a.exports.lua_toboolean=function(i,s){return!ie(i,s).l_isfalse()},a.exports.lua_tocfunction=function(i,s){let _=ie(i,s);return _.ttislcf()||_.ttisCclosure()?_.value:null},a.exports.lua_todataview=function(i,s){let _=V(i,s);return new DataView(_.buffer,_.byteOffset,_.byteLength)},a.exports.lua_tointeger=function(i,s){let _=f(i,s);return _===!1?0:_},a.exports.lua_tointegerx=f,a.exports.lua_tojsstring=function(i,s){let _=ie(i,s);if(!_.ttisstring()){if(!dn.cvt2str(_))return null;T.luaO_tostring(i,_)}return _.jsstring()},a.exports.lua_tolstring=V,a.exports.lua_tonumber=function(i,s){let _=M(i,s);return _===!1?0:_},a.exports.lua_tonumberx=M,a.exports.lua_topointer=function(i,s){let _=ie(i,s);switch(_.ttype()){case be:case se:case ce:case ve:case ge:case Oe:case $e:return _.value;default:return null}},a.exports.lua_toproxy=function(i,s){let _=ie(i,s);return(function(c,m,O){let y=function(ne){ae(ne,ne instanceof g.lua_State&&c===ne.l_G,"must be from same global state"),ne.stack[ne.top]=new ee(m,O),Te(ne)};return te.set(y,c),y})(i.l_G,_.type,_.value)},a.exports.lua_tostring=J,a.exports.lua_tothread=function(i,s){let _=ie(i,s);return _.ttisthread()?_.value:null},a.exports.lua_touserdata=function(i,s){let _=ie(i,s);switch(_.ttnov()){case Oe:return _.value.data;case $e:return _.value;default:return null}},a.exports.lua_type=Se,a.exports.lua_typename=function(i,s){return ae(i,qe<=s&&s<F,"invalid tag"),pn.ttypename(s)},a.exports.lua_upvalueid=function(i,s,_){let c=ie(i,s);switch(c.ttype()){case se:{let m=vn(i,s,_);return m.f.upvals[m.i]}case ce:{let m=c.value;return ae(i,(0|_)===_&&_>0&&_<=m.nupvalues,"invalid upvalue index"),m.upvalue[_-1]}default:return ae(i,!1,"closure expected"),null}},a.exports.lua_upvaluejoin=function(i,s,_,c,m){let O=vn(i,s,_),y=vn(i,c,m),ne=y.f.upvals[y.i];O.f.upvals[O.i]=ne},a.exports.lua_version=function(i){return i===null?b:i.l_G.version},a.exports.lua_xmove=function(i,s,_){if(i!==s){rn(i,_),ae(i,i.l_G===s.l_G,"moving among independent states"),ae(i,s.ci.top-s.top>=_,"stack overflow"),i.top-=_;for(let c=0;c<_;c++)s.stack[s.top]=new T.TValue,T.setobj2s(s,s.top,i.stack[i.top+c]),delete i.stack[i.top+c],s.top++}}},function(a,B,d){const{lua_assert:A}=d(4),v=function(D){let R=D.reader(D.L,D.data);if(R===null)return-1;A(R instanceof Uint8Array,"Should only load binary of array of bytes");let I=R.length;return I===0?-1:(D.buffer=R,D.off=0,D.n=I-1,D.buffer[D.off++])};a.exports.EOZ=-1,a.exports.luaZ_buffer=function(D){return D.buffer.subarray(0,D.n)},a.exports.luaZ_buffremove=function(D,R){D.n-=R},a.exports.luaZ_fill=v,a.exports.luaZ_read=function(D,R,I,z){for(;z;){if(D.n===0){if(v(D)===-1)return z;D.n++,D.off--}let S=z<=D.n?z:D.n;for(let H=0;H<S;H++)R[I++]=D.buffer[D.off++];D.n-=S,D.n===0&&(D.buffer=null),z-=S}return 0},a.exports.luaZ_resetbuffer=function(D){D.n=0},a.exports.luaZ_resizebuffer=function(D,R,I){let z=new Uint8Array(I);R.buffer&&z.set(R.buffer),R.buffer=z},a.exports.MBuffer=class{constructor(){this.buffer=null,this.n=0}},a.exports.ZIO=class{constructor(D,R,I){this.L=D,A(typeof R=="function","ZIO requires a reader"),this.reader=R,this.data=I,this.n=0,this.buffer=null,this.off=0}zgetc(){return this.n-- >0?this.buffer[this.off++]:v(this)}}},function(a,B,d){const{constant_types:{LUA_TBOOLEAN:A,LUA_TLNGSTR:v},thread_status:{LUA_ERRSYNTAX:D},to_luastring:R}=d(1),{LUA_MINBUFFER:I,MAX_INT:z,lua_assert:S}=d(4),H=d(11),b=d(8),{lisdigit:F,lislalnum:Q,lislalpha:ce,lisspace:$,lisxdigit:ve}=d(22),se=d(6),{luaS_bless:$e,luaS_hash:nn,luaS_hashlongstr:Ke,luaS_new:qe}=d(10),on=d(9),{EOZ:P,luaZ_buffer:re,luaZ_buffremove:be,luaZ_resetbuffer:ge,luaZ_resizebuffer:Oe}=d(19),tn=R("_ENV",!0),an={TK_AND:257,TK_BREAK:258,TK_DO:259,TK_ELSE:260,TK_ELSEIF:261,TK_END:262,TK_FALSE:263,TK_FOR:264,TK_FUNCTION:265,TK_GOTO:266,TK_IF:267,TK_IN:268,TK_LOCAL:269,TK_NIL:270,TK_NOT:271,TK_OR:272,TK_REPEAT:273,TK_RETURN:274,TK_THEN:275,TK_TRUE:276,TK_UNTIL:277,TK_WHILE:278,TK_IDIV:279,TK_CONCAT:280,TK_DOTS:281,TK_EQ:282,TK_GE:283,TK_LE:284,TK_NE:285,TK_SHL:286,TK_SHR:287,TK_DBCOLON:288,TK_EOS:289,TK_FLT:290,TK_INT:291,TK_NAME:292,TK_STRING:293},sn=["and","break","do","else","elseif","end","false","for","function","goto","if","in","local","nil","not","or","repeat","return","then","true","until","while","//","..","...","==",">=","<=","~=","<<",">>","::","<eof>","<number>","<integer>","<name>","<string>"].map((N,me)=>R(N));class ae{constructor(){this.r=NaN,this.i=NaN,this.ts=null}}class oe{constructor(){this.token=NaN,this.seminfo=new ae}}const ze=function(N,me){let He=N.buff;if(He.n+1>He.buffer.length){He.buffer.length>=z/2&&mn(N,R("lexical element too long",!0),0);let G=2*He.buffer.length;Oe(N.L,He,G)}He.buffer[He.n++]=me<0?255+me+1:me},C=function(N,me){if(me<257)return se.luaO_pushfstring(N.L,R("'%c'",!0),me);{let He=sn[me-257];return me<289?se.luaO_pushfstring(N.L,R("'%s'",!0),He):He}},Ce=function(N){return N.current===10||N.current===13},T=function(N){N.current=N.z.zgetc()},g=function(N){ze(N,N.current),T(N)},L=new se.TValue(A,!0),xe=function(N,me){let He=N.L,G=qe(He,me),Ae=N.h.strong.get(Ke(G));if(Ae)G=Ae.key.tsvalue();else{let Pe=new se.TValue(v,G);on.luaH_setfrom(He,N.h,Pe,L)}return G},we=function(N){let me=N.current;S(Ce(N)),T(N),Ce(N)&&N.current!==me&&T(N),++N.linenumber>=z&&mn(N,R("chunk has too many lines",!0),0)},pn=function(N,me){return N.current===me&&(T(N),!0)},Ze=function(N,me){return(N.current===me[0].charCodeAt(0)||N.current===me[1].charCodeAt(0))&&(g(N),!0)},dn=function(N,me){let He="Ee",G=N.current;for(S(F(N.current)),g(N),G===48&&Ze(N,"xX")&&(He="Pp");;)if(Ze(N,He)&&Ze(N,"-+"),ve(N.current))g(N);else{if(N.current!==46)break;g(N)}let Ae=new se.TValue;return se.luaO_str2num(re(N.buff),Ae)===0&&mn(N,R("malformed number",!0),290),Ae.ttisinteger()?(me.i=Ae.value,291):(S(Ae.ttisfloat()),me.r=Ae.value,290)},mn=function(N,me,He){me=H.luaG_addinfo(N.L,me,N.source,N.linenumber),He&&se.luaO_pushfstring(N.L,R("%s near %s"),me,(function(G,Ae){switch(Ae){case 292:case 293:case 290:case 291:return se.luaO_pushfstring(G.L,R("'%s'",!0),re(G.buff));default:return C(G,Ae)}})(N,He)),b.luaD_throw(N.L,D)},Y=function(N){let me=0,He=N.current;for(S(He===91||He===93),g(N);N.current===61;)g(N),me++;return N.current===He?me:-me-1},ee=function(N,me,He){let G=N.linenumber;g(N),Ce(N)&&we(N);let Ae=!1;for(;!Ae;)switch(N.current){case P:mn(N,R(`unfinished long ${me?"string":"comment"} (starting at line ${G})`),289);break;case 93:Y(N)===He&&(g(N),Ae=!0);break;case 10:case 13:ze(N,10),we(N),me||ge(N.buff);break;default:me?g(N):T(N)}me&&(me.ts=xe(N,N.buff.buffer.subarray(2+He,N.buff.n-(2+He))))},Ie=function(N,me,He){me||(N.current!==P&&g(N),mn(N,He,293))},Te=function(N){return g(N),Ie(N,ve(N.current),R("hexadecimal digit expected",!0)),se.luaO_hexavalue(N.current)},rn=function(N){let me=Te(N);return me=(me<<4)+Te(N),be(N.buff,2),me},On=function(N){let me=new Uint8Array(se.UTF8BUFFSZ),He=se.luaO_utf8esc(me,(function(G){let Ae=4;g(G),Ie(G,G.current===123,R("missing '{'",!0));let Pe=Te(G);for(g(G);ve(G.current);)Ae++,Pe=(Pe<<4)+se.luaO_hexavalue(G.current),Ie(G,Pe<=1114111,R("UTF-8 value too large",!0)),g(G);return Ie(G,G.current===125,R("missing '}'",!0)),T(G),be(G.buff,Ae),Pe})(N));for(;He>0;He--)ze(N,me[se.UTF8BUFFSZ-He])},bn=function(N){let me,He=0;for(me=0;me<3&&F(N.current);me++)He=10*He+N.current-48,g(N);return Ie(N,He<=255,R("decimal escape too large",!0)),be(N.buff,me),He},Je=function(N,me,He){for(g(N);N.current!==me;)switch(N.current){case P:mn(N,R("unfinished string",!0),289);break;case 10:case 13:mn(N,R("unfinished string",!0),293);break;case 92:{let G,Ae;switch(g(N),N.current){case 97:Ae=7,G="read_save";break;case 98:Ae=8,G="read_save";break;case 102:Ae=12,G="read_save";break;case 110:Ae=10,G="read_save";break;case 114:Ae=13,G="read_save";break;case 116:Ae=9,G="read_save";break;case 118:Ae=11,G="read_save";break;case 120:Ae=rn(N),G="read_save";break;case 117:On(N),G="no_save";break;case 10:case 13:we(N),Ae=10,G="only_save";break;case 92:case 34:case 39:Ae=N.current,G="read_save";break;case P:G="no_save";break;case 122:for(be(N.buff,1),T(N);$(N.current);)Ce(N)?we(N):T(N);G="no_save";break;default:Ie(N,F(N.current),R("invalid escape sequence",!0)),Ae=bn(N),G="only_save"}G==="read_save"&&T(N),G!=="read_save"&&G!=="only_save"||(be(N.buff,1),ze(N,Ae));break}default:g(N)}g(N),He.ts=xe(N,N.buff.buffer.subarray(1,N.buff.n-1))},ie=Object.create(null);sn.forEach((N,me)=>ie[nn(N)]=me);const Ue=function(N,me){for(ge(N.buff);;)switch(S(typeof N.current=="number"),N.current){case 10:case 13:we(N);break;case 32:case 12:case 9:case 11:T(N);break;case 45:if(T(N),N.current!==45)return 45;if(T(N),N.current===91){let He=Y(N);if(ge(N.buff),He>=0){ee(N,null,He),ge(N.buff);break}}for(;!Ce(N)&&N.current!==P;)T(N);break;case 91:{let He=Y(N);return He>=0?(ee(N,me,He),293):(He!==-1&&mn(N,R("invalid long string delimiter",!0),293),91)}case 61:return T(N),pn(N,61)?282:61;case 60:return T(N),pn(N,61)?284:pn(N,60)?286:60;case 62:return T(N),pn(N,61)?283:pn(N,62)?287:62;case 47:return T(N),pn(N,47)?279:47;case 126:return T(N),pn(N,61)?285:126;case 58:return T(N),pn(N,58)?288:58;case 34:case 39:return Je(N,N.current,me),293;case 46:return g(N),pn(N,46)?pn(N,46)?281:280:F(N.current)?dn(N,me):46;case 48:case 49:case 50:case 51:case 52:case 53:case 54:case 55:case 56:case 57:return dn(N,me);case P:return 289;default:if(ce(N.current)){do g(N);while(Q(N.current));let He=xe(N,re(N.buff));me.ts=He;let G=ie[Ke(He)];return G!==void 0&&G<=22?G+257:292}{let He=N.current;return T(N),He}}};a.exports.FIRST_RESERVED=257,a.exports.LUA_ENV=tn,a.exports.LexState=class{constructor(){this.current=NaN,this.linenumber=NaN,this.lastline=NaN,this.t=new oe,this.lookahead=new oe,this.fs=null,this.L=null,this.z=null,this.buff=null,this.h=null,this.dyd=null,this.source=null,this.envn=null}},a.exports.RESERVED=an,a.exports.isreserved=function(N){let me=ie[Ke(N)];return me!==void 0&&me<=22},a.exports.luaX_lookahead=function(N){return S(N.lookahead.token===289),N.lookahead.token=Ue(N,N.lookahead.seminfo),N.lookahead.token},a.exports.luaX_newstring=xe,a.exports.luaX_next=function(N){N.lastline=N.linenumber,N.lookahead.token!==289?(N.t.token=N.lookahead.token,N.t.seminfo.i=N.lookahead.seminfo.i,N.t.seminfo.r=N.lookahead.seminfo.r,N.t.seminfo.ts=N.lookahead.seminfo.ts,N.lookahead.token=289):N.t.token=Ue(N,N.t.seminfo)},a.exports.luaX_setinput=function(N,me,He,G,Ae){me.t={token:0,seminfo:new ae},me.L=N,me.current=Ae,me.lookahead={token:289,seminfo:new ae},me.z=He,me.fs=null,me.linenumber=1,me.lastline=1,me.source=G,me.envn=$e(N,tn),Oe(N,me.buff,I)},a.exports.luaX_syntaxerror=function(N,me){mn(N,me,N.t.token)},a.exports.luaX_token2str=C,a.exports.luaX_tokens=sn},function(a,B,d){const{lua:A,lauxlib:v,lualib:D,to_luastring:R}=d(0),{LUA_MULTRET:I,LUA_OK:z,LUA_REGISTRYINDEX:S,LUA_RIDX_MAINTHREAD:H,LUA_TBOOLEAN:b,LUA_TFUNCTION:F,LUA_TLIGHTUSERDATA:Q,LUA_TNIL:ce,LUA_TNONE:$,LUA_TNUMBER:ve,LUA_TSTRING:se,LUA_TTABLE:$e,LUA_TTHREAD:nn,LUA_TUSERDATA:Ke,lua_atnativeerror:qe,lua_call:on,lua_getfield:P,lua_gettable:re,lua_gettop:be,lua_isnil:ge,lua_isproxy:Oe,lua_newuserdata:tn,lua_pcall:an,lua_pop:sn,lua_pushboolean:ae,lua_pushcfunction:oe,lua_pushinteger:ze,lua_pushlightuserdata:C,lua_pushliteral:Ce,lua_pushnil:T,lua_pushnumber:g,lua_pushstring:L,lua_pushvalue:xe,lua_rawgeti:we,lua_rawgetp:pn,lua_rawsetp:Ze,lua_rotate:dn,lua_setfield:mn,lua_settable:Y,lua_settop:ee,lua_toboolean:Ie,lua_tojsstring:Te,lua_tonumber:rn,lua_toproxy:On,lua_tothread:bn,lua_touserdata:Je,lua_type:ie}=A,{luaL_argerror:Ue,luaL_checkany:N,luaL_checkoption:me,luaL_checkstack:He,luaL_checkudata:G,luaL_error:Ae,luaL_getmetafield:Pe,luaL_newlib:Nn,luaL_newmetatable:Un,luaL_requiref:Mn,luaL_setfuncs:Zn,luaL_setmetatable:ot,luaL_testudata:o,luaL_tolstring:de}=v,{luaopen_base:h}=D,X=typeof window<"u"?window:typeof WorkerGlobalScope<"u"&&self instanceof WorkerGlobalScope?self:(0,eval)("this");let V,J,f;if(typeof Reflect<"u")V=Reflect.apply,J=Reflect.construct,f=Reflect.deleteProperty;else{const U=Function.apply,Me=Function.bind;V=function(fe,yn,Dn){return U.call(fe,yn,Dn)},J=function(fe,yn){switch(yn.length){case 0:return new fe;case 1:return new fe(yn[0]);case 2:return new fe(yn[0],yn[1]);case 3:return new fe(yn[0],yn[1],yn[2]);case 4:return new fe(yn[0],yn[1],yn[2],yn[3])}let Dn=[null];return Dn.push.apply(Dn,yn),new(Me.apply(fe,Dn))},f=Function("t","k","delete t[k]")}const M=String.prototype.concat.bind(""),te=function(U){return typeof U=="object"?U!==null:typeof U=="function"},Ee=R("js object"),Se=function(U,Me){let fe=o(U,Me,Ee);return fe?fe.data:void 0},De=function(U,Me){return G(U,Me,Ee).data},Xe=function(U,Me){tn(U).data=Me,ot(U,Ee)},Fe=function(U){we(U,S,H);let Me=bn(U,-1);return sn(U,1),Me},Ve=new WeakMap,vn=function(U,Me){switch(typeof Me){case"undefined":T(U);break;case"number":g(U,Me);break;case"string":L(U,R(Me));break;case"boolean":ae(U,Me);break;case"symbol":C(U,Me);break;case"function":if(Oe(Me,U)){Me(U);break}case"object":if(Me===null){if(pn(U,S,null)!==Ke)throw Error("js library not loaded into lua_State");break}default:{let fe=Ve.get(Fe(U));if(!fe)throw Error("js library not loaded into lua_State");let yn=fe.get(Me);yn?yn(U):(Xe(U,Me),yn=On(U,-1),fe.set(Me,yn))}}},i=function(U){let Me=Je(U,1);return vn(U,Me),1},s=function(U,Me){switch(ie(U,Me)){case $:case ce:return;case b:return Ie(U,Me);case Q:return Je(U,Me);case ve:return rn(U,Me);case se:return Te(U,Me);case Ke:{let fe=Se(U,Me);if(fe!==void 0)return fe}case $e:case F:case nn:default:return Kn(U,On(U,Me))}},_=function(U,Me){let fe=an(U,Me,1,0),yn=s(U,-1);switch(sn(U,1),fe){case z:return yn;default:throw yn}},c=function(U,Me,fe,yn,Dn){if(!te(yn))throw new TypeError("`args` argument must be an object");let Pn=+yn.length;Pn>=0||(Pn=0),He(U,2+Pn,null);let In=be(U);Me(U),vn(U,fe);for(let $n=0;$n<Pn;$n++)vn(U,yn[$n]);switch(an(U,1+Pn,Dn,0)){case z:{let $n=be(U)-In,ht=new Array($n);for(let Fn=0;Fn<$n;Fn++)ht[Fn]=s(U,In+Fn+1);return ee(U,In),ht}default:{let $n=s(U,-1);throw ee(U,In),$n}}},m=function(U){return re(U,1),1},O=function(U,Me,fe){return He(U,3,null),oe(U,m),Me(U),vn(U,fe),_(U,2)},y=function(U,Me,fe){switch(He(U,3,null),oe(U,m),Me(U),vn(U,fe),an(U,2,1,0)){case z:{let yn=ge(U,-1);return sn(U,1),!yn}default:{let yn=s(U,-1);throw sn(U,1),yn}}},ne=function(U,Me,fe,yn){switch(He(U,4,null),oe(U,function(Dn){return Y(Dn,1),0}),Me(U),vn(U,fe),vn(U,yn),an(U,3,0,0)){case z:return;default:{let Dn=s(U,-1);throw sn(U,1),Dn}}},en=function(U,Me,fe){switch(He(U,4,null),oe(U,function(yn){return Y(yn,1),0}),Me(U),vn(U,fe),T(U),an(U,3,0,0)){case z:return;default:{let yn=s(U,-1);throw sn(U,1),yn}}},gn=function(U,Me){return He(U,2,null),oe(U,function(fe){return de(fe,1),1}),Me(U),_(U,1)},Bn=function(){let U=this.L;He(U,3,null);let Me=be(U);switch(this.iter(U),this.state(U),this.last(U),an(U,2,I,0)){case z:{let fe;if(this.last=On(U,Me+1),ge(U,-1))fe={done:!0,value:void 0};else{let yn=be(U)-Me,Dn=new Array(yn);for(let Pn=0;Pn<yn;Pn++)Dn[Pn]=s(U,Me+Pn+1);fe={done:!1,value:Dn}}return ee(U,Me),fe}default:{let fe=s(U,-1);throw sn(U,1),fe}}},Kn=function(U,Me){const fe=Fe(U);let yn=function(){return c(fe,Me,this,arguments,1)[0]};yn.apply=function(Pn,In){return c(fe,Me,Pn,In,1)[0]},yn.invoke=function(Pn,In){return c(fe,Me,Pn,In,I)},yn.get=function(Pn){return O(fe,Me,Pn)},yn.has=function(Pn){return y(fe,Me,Pn)},yn.set=function(Pn,In){return ne(fe,Me,Pn,In)},yn.delete=function(Pn){return en(fe,Me,Pn)},yn.toString=function(){return gn(fe,Me)},typeof Symbol=="function"&&(yn[Symbol.toStringTag]="Fengari object",yn[Symbol.iterator]=function(){return(function(Pn,In){switch(He(Pn,1,null),oe(Pn,function($n){return Mn($n,R("_G"),h,0),P($n,-1,R("pairs")),In($n),on($n,1,3),3}),an(Pn,0,3,0)){case z:{let $n=On(Pn,-3),ht=On(Pn,-2),Fn=On(Pn,-1);return sn(Pn,3),{L:Pn,iter:$n,state:ht,last:Fn,next:Bn}}default:{let $n=s(Pn,-1);throw sn(Pn,1),$n}}})(fe,Me)},Symbol.toPrimitive&&(yn[Symbol.toPrimitive]=function(Pn){if(Pn==="string")return gn(fe,Me)}));let Dn=Ve.get(fe);if(!Dn)throw Error("js library not loaded into lua_State");return Dn.set(yn,Me),yn},pe={new:function(U){let Me=s(U,1),fe=be(U)-1,yn=new Array(fe);for(let Dn=0;Dn<fe;Dn++)yn[Dn]=s(U,Dn+2);return vn(U,J(Me,yn)),1},tonumber:function(U){let Me=s(U,1);return g(U,+Me),1},tostring:function(U){let Me=s(U,1);return Ce(U,M(Me)),1},instanceof:function(U){let Me=s(U,1),fe=s(U,2);return ae(U,Me instanceof fe),1},typeof:function(U){let Me=s(U,1);return Ce(U,typeof Me),1}};if(typeof Symbol=="function"&&Symbol.iterator){const U=function(fe,yn){let Dn=De(fe,yn),Pn=Dn[Symbol.iterator];Pn||Ue(fe,yn,R("object not iterable"));let In=V(Pn,Dn,[]);return te(In)||Ue(fe,yn,R("Result of the Symbol.iterator method is not an object")),In},Me=function(fe){let yn=s(fe,1).next();return yn.done?0:(vn(fe,yn.value),1)};pe.of=function(fe){let yn=U(fe,1);return oe(fe,Me),vn(fe,yn),2}}if(typeof Proxy=="function"&&typeof Symbol=="function"){const U=Symbol("lua_State"),Me=Symbol("fengari-proxy"),fe={apply:function(Fn,Jn,Vn){return c(Fn[U],Fn[Me],Jn,Vn,1)[0]},construct:function(Fn,Jn){let Vn=Fn[U],ut=Fn[Me],lt=Jn.length;He(Vn,2+lt,null),ut(Vn);let Ct=be(Vn);if(Pe(Vn,Ct,R("construct"))===ce)throw sn(Vn,1),new TypeError("not a constructor");dn(Vn,Ct,1);for(let pt=0;pt<lt;pt++)vn(Vn,Jn[pt]);return _(Vn,1+lt)},defineProperty:function(Fn,Jn,Vn){let ut=Fn[U],lt=Fn[Me];return He(ut,4,null),lt(ut),Pe(ut,-1,R("defineProperty"))===ce?(sn(ut,1),!1):(dn(ut,-2,1),vn(ut,Jn),vn(ut,Vn),_(ut,3))},deleteProperty:function(Fn,Jn){return en(Fn[U],Fn[Me],Jn)},get:function(Fn,Jn){return O(Fn[U],Fn[Me],Jn)},getOwnPropertyDescriptor:function(Fn,Jn){let Vn=Fn[U],ut=Fn[Me];if(He(Vn,3,null),ut(Vn),Pe(Vn,-1,R("getOwnPropertyDescriptor"))!==ce)return dn(Vn,-2,1),vn(Vn,Jn),_(Vn,2);sn(Vn,1)},getPrototypeOf:function(Fn){let Jn=Fn[U],Vn=Fn[Me];return He(Jn,2,null),Vn(Jn),Pe(Jn,-1,R("getPrototypeOf"))===ce?(sn(Jn,1),null):(dn(Jn,-2,1),_(Jn,1))},has:function(Fn,Jn){return y(Fn[U],Fn[Me],Jn)},ownKeys:function(Fn){let Jn=Fn[U],Vn=Fn[Me];if(He(Jn,2,null),Vn(Jn),Pe(Jn,-1,R("ownKeys"))===ce)throw sn(Jn,1),Error("ownKeys unknown for fengari object");return dn(Jn,-2,1),_(Jn,1)},set:function(Fn,Jn,Vn){return ne(Fn[U],Fn[Me],Jn,Vn),!0},setPrototypeOf:function(Fn,Jn){let Vn=Fn[U],ut=Fn[Me];return He(Vn,3,null),ut(Vn),Pe(Vn,-1,R("setPrototypeOf"))===ce?(sn(Vn,1),!1):(dn(Vn,-2,1),vn(Vn,Jn),_(Vn,2))}},yn=function(){let Fn=(function(){}).bind();return delete Fn.length,delete Fn.name,Fn},Dn=Function("return ()=>void 0;"),Pn=function(){let Fn=Dn();return delete Fn.length,delete Fn.name,Fn},In=function(Fn,Jn,Vn){const ut=Fe(Fn);let lt;switch(Vn){case"function":lt=yn();break;case"arrow_function":lt=Pn();break;case"object":lt={};break;default:throw TypeError("invalid type to createproxy")}return lt[Me]=Jn,lt[U]=ut,new Proxy(lt,fe)},$n=["function","arrow_function","object"],ht=$n.map(Fn=>R(Fn));pe.createproxy=function(Fn){N(Fn,1);let Jn=$n[me(Fn,2,ht[0],ht)],Vn=In(Fn,On(Fn,1),Jn);return vn(Fn,Vn),1}}let fn={__index:function(U){let Me=De(U,1),fe=s(U,2);return vn(U,Me[fe]),1},__newindex:function(U){let Me=De(U,1),fe=s(U,2),yn=s(U,3);return yn===void 0?f(Me,fe):Me[fe]=yn,0},__tostring:function(U){let Me=De(U,1),fe=M(Me);return L(U,R(fe)),1},__call:function(U){let Me,fe=De(U,1),yn=be(U)-1,Dn=new Array(Math.max(0,yn-1));if(yn>0&&(Me=s(U,2),yn-- >0))for(let Pn=0;Pn<yn;Pn++)Dn[Pn]=s(U,Pn+3);return vn(U,V(fe,Me,Dn)),1},__pairs:function(U){let Me,fe,yn,Dn,Pn=De(U,1);if(typeof Symbol!="function"||(Me=Pn[Symbol.for("__pairs")])===void 0)fe=function(In){if(this.index>=this.keys.length)return;let $n=this.keys[this.index++];return[$n,this.object[$n]]},yn={object:Pn,keys:Object.keys(Pn),index:0};else{let In=V(Me,Pn,[]);In===void 0&&Ae(U,R("bad '__pairs' result (object with keys 'iter', 'state', 'first' expected)")),(fe=In.iter)===void 0&&Ae(U,R("bad '__pairs' result (object.iter is missing)")),yn=In.state,Dn=In.first}return oe(U,function(){let In=s(U,1),$n=s(U,2),ht=V(fe,In,[$n]);if(ht===void 0)return 0;Array.isArray(ht)||Ae(U,R("bad iterator result (Array or undefined expected)")),He(U,ht.length,null);for(let Fn=0;Fn<ht.length;Fn++)vn(U,ht[Fn]);return ht.length}),vn(U,yn),vn(U,Dn),3},__len:function(U){let Me,fe,yn=De(U,1);return fe=typeof Symbol!="function"||(Me=yn[Symbol.for("__len")])===void 0?yn.length:V(Me,yn,[]),vn(U,fe),1}};a.exports.FENGARI_INTEROP_VERSION="0.1",a.exports.FENGARI_INTEROP_VERSION_NUM=1,a.exports.FENGARI_INTEROP_RELEASE="0.1.2",a.exports.checkjs=De,a.exports.testjs=Se,a.exports.pushjs=Xe,a.exports.push=vn,a.exports.tojs=s,a.exports.luaopen_js=function(U){return Ve.set(Fe(U),new WeakMap),qe(U,i),Nn(U,pe),Ce(U,"0.1"),mn(U,-2,R("_VERSION")),ze(U,1),mn(U,-2,R("_VERSION_NUM")),Ce(U,"0.1.2"),mn(U,-2,R("_RELEASE")),Un(U,Ee),Zn(U,fn,0),sn(U,1),Xe(U,null),xe(U,-1),Ze(U,S,null),mn(U,-2,R("null")),vn(U,X),mn(U,-2,R("global")),1}},function(a,B,d){const{luastring_of:A}=d(1),v=A(0,0,0,0,0,0,0,0,0,0,8,8,8,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,22,22,22,22,22,22,22,22,22,22,4,4,4,4,4,4,4,21,21,21,21,21,21,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,4,4,4,4,5,4,21,21,21,21,21,21,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);a.exports.lisdigit=function(D){return(2&v[D+1])!=0},a.exports.lislalnum=function(D){return(3&v[D+1])!=0},a.exports.lislalpha=function(D){return(1&v[D+1])!=0},a.exports.lisprint=function(D){return(4&v[D+1])!=0},a.exports.lisspace=function(D){return(8&v[D+1])!=0},a.exports.lisxdigit=function(D){return(16&v[D+1])!=0}},function(a,B,d){const{LUA_MULTRET:A,to_luastring:v}=d(1),{BinOpr:{OPR_ADD:D,OPR_AND:R,OPR_BAND:I,OPR_BOR:z,OPR_BXOR:S,OPR_CONCAT:H,OPR_DIV:b,OPR_EQ:F,OPR_GE:Q,OPR_GT:ce,OPR_IDIV:$,OPR_LE:ve,OPR_LT:se,OPR_MOD:$e,OPR_MUL:nn,OPR_NE:Ke,OPR_NOBINOPR:qe,OPR_OR:on,OPR_POW:P,OPR_SHL:re,OPR_SHR:be,OPR_SUB:ge},UnOpr:{OPR_BNOT:Oe,OPR_LEN:tn,OPR_MINUS:an,OPR_NOT:sn,OPR_NOUNOPR:ae},NO_JUMP:oe,getinstruction:ze,luaK_checkstack:C,luaK_codeABC:Ce,luaK_codeABx:T,luaK_codeAsBx:g,luaK_codek:L,luaK_concat:xe,luaK_dischargevars:we,luaK_exp2RK:pn,luaK_exp2anyreg:Ze,luaK_exp2anyregup:dn,luaK_exp2nextreg:mn,luaK_exp2val:Y,luaK_fixline:ee,luaK_getlabel:Ie,luaK_goiffalse:Te,luaK_goiftrue:rn,luaK_indexed:On,luaK_infix:bn,luaK_intK:Je,luaK_jump:ie,luaK_jumpto:Ue,luaK_nil:N,luaK_patchclose:me,luaK_patchlist:He,luaK_patchtohere:G,luaK_posfix:Ae,luaK_prefix:Pe,luaK_reserveregs:Nn,luaK_ret:Un,luaK_self:Mn,luaK_setlist:Zn,luaK_setmultret:ot,luaK_setoneret:o,luaK_setreturns:de,luaK_storevar:h,luaK_stringK:X}=d(35),V=d(8),J=d(13),f=d(20),{LUAI_MAXCCALLS:M,MAX_INT:te,lua_assert:Ee}=d(4),Se=d(6),{OpCodesI:{OP_CALL:De,OP_CLOSURE:Xe,OP_FORLOOP:Fe,OP_FORPREP:Ve,OP_GETUPVAL:vn,OP_MOVE:i,OP_NEWTABLE:s,OP_SETTABLE:_,OP_TAILCALL:c,OP_TFORCALL:m,OP_TFORLOOP:O,OP_VARARG:y},LFIELDS_PER_FLUSH:ne,SETARG_B:en,SETARG_C:gn,SET_OPCODE:Bn}=d(16),{luaS_eqlngstr:Kn,luaS_new:pe,luaS_newliteral:fn}=d(10),U=d(9),Me=J.Proto,fe=f.RESERVED,yn=function(w){return w===In.VCALL||w===In.VVARARG},Dn=function(w,Z){return Kn(w,Z)};class Pn{constructor(){this.previous=null,this.firstlabel=NaN,this.firstgoto=NaN,this.nactvar=NaN,this.upval=NaN,this.isloop=NaN}}const In={VVOID:0,VNIL:1,VTRUE:2,VFALSE:3,VK:4,VKFLT:5,VKINT:6,VNONRELOC:7,VLOCAL:8,VUPVAL:9,VINDEXED:10,VJMP:11,VRELOCABLE:12,VCALL:13,VVARARG:14};class $n{constructor(){this.k=NaN,this.u={ival:NaN,nval:NaN,info:NaN,ind:{idx:NaN,t:NaN,vt:NaN}},this.t=NaN,this.f=NaN}to(Z){this.k=Z.k,this.u=Z.u,this.t=Z.t,this.f=Z.f}}class ht{constructor(){this.f=null,this.prev=null,this.ls=null,this.bl=null,this.pc=NaN,this.lasttarget=NaN,this.jpc=NaN,this.nk=NaN,this.np=NaN,this.firstlocal=NaN,this.nlocvars=NaN,this.nactvar=NaN,this.nups=NaN,this.freereg=NaN}}class Fn{constructor(){this.arr=[],this.n=NaN,this.size=NaN}}const Jn=function(w,Z){w.t.token=0,f.luaX_syntaxerror(w,Z)},Vn=function(w,Z){f.luaX_syntaxerror(w,Se.luaO_pushfstring(w.L,v("%s expected",!0),f.luaX_token2str(w,Z)))},ut=function(w,Z,Re,Qe){Z>Re&&(function(Ge,Le,hn){let Tn=Ge.ls.L,rt=Ge.f.linedefined,at=rt===0?v("main function",!0):Se.luaO_pushfstring(Tn,v("function at line %d",!0),rt),Lt=Se.luaO_pushfstring(Tn,v("too many %s (limit is %d) in %s",!0),hn,Le,at);f.luaX_syntaxerror(Ge.ls,Lt)})(w,Re,Qe)},lt=function(w,Z){return w.t.token===Z&&(f.luaX_next(w),!0)},Ct=function(w,Z){w.t.token!==Z&&Vn(w,Z)},pt=function(w,Z){Ct(w,Z),f.luaX_next(w)},Dt=function(w,Z,Re){Z||f.luaX_syntaxerror(w,Re)},At=function(w,Z,Re,Qe){lt(w,Z)||(Qe===w.linenumber?Vn(w,Z):f.luaX_syntaxerror(w,Se.luaO_pushfstring(w.L,v("%s expected (to close %s at line %d)"),f.luaX_token2str(w,Z),f.luaX_token2str(w,Re),Qe)))},E=function(w){Ct(w,fe.TK_NAME);let Z=w.t.seminfo.ts;return f.luaX_next(w),Z},le=function(w,Z,Re){w.f=w.t=oe,w.k=Z,w.u.info=Re},cn=function(w,Z,Re){le(Z,In.VK,X(w.fs,Re))},ln=function(w,Z){cn(w,Z,E(w))},wn=function(w,Z){let Re=w.fs,Qe=w.dyd,Ge=(function(Le,hn){let Tn=Le.fs,rt=Tn.f;return rt.locvars[Tn.nlocvars]=new Se.LocVar,rt.locvars[Tn.nlocvars].varname=hn,Tn.nlocvars++})(w,Z);ut(Re,Qe.actvar.n+1-Re.firstlocal,200,v("local variables",!0)),Qe.actvar.arr[Qe.actvar.n]=new class{constructor(){this.idx=NaN}},Qe.actvar.arr[Qe.actvar.n].idx=Ge,Qe.actvar.n++},un=function(w,Z){wn(w,f.luaX_newstring(w,v(Z,!0)))},_n=function(w,Z){let Re=w.ls.dyd.actvar.arr[w.firstlocal+Z].idx;return Ee(Re<w.nlocvars),w.f.locvars[Re]},We=function(w,Z){let Re=w.fs;for(Re.nactvar=Re.nactvar+Z;Z;Z--)_n(Re,Re.nactvar-Z).startpc=Re.pc},xn=function(w,Z,Re){let Qe=w.f;return ut(w,w.nups+1,J.MAXUPVAL,v("upvalues",!0)),Qe.upvalues[w.nups]={instack:Re.k===In.VLOCAL,idx:Re.u.info,name:Z},w.nups++},Ln=function(w,Z,Re,Qe){if(w===null)le(Re,In.VVOID,0);else{let Ge=(function(Le,hn){for(let Tn=Le.nactvar-1;Tn>=0;Tn--)if(Dn(hn,_n(Le,Tn).varname))return Tn;return-1})(w,Z);if(Ge>=0)le(Re,In.VLOCAL,Ge),Qe||(function(Le,hn){let Tn=Le.bl;for(;Tn.nactvar>hn;)Tn=Tn.previous;Tn.upval=1})(w,Ge);else{let Le=(function(hn,Tn){let rt=hn.f.upvalues;for(let at=0;at<hn.nups;at++)if(Dn(rt[at].name,Tn))return at;return-1})(w,Z);if(Le<0){if(Ln(w.prev,Z,Re,0),Re.k===In.VVOID)return;Le=xn(w,Z,Re)}le(Re,In.VUPVAL,Le)}}},p=function(w,Z){let Re=E(w),Qe=w.fs;if(Ln(Qe,Re,Z,1),Z.k===In.VVOID){let Ge=new $n;Ln(Qe,w.envn,Z,1),Ee(Z.k!==In.VVOID),cn(w,Ge,Re),On(Qe,Z,Ge)}},q=function(w,Z,Re,Qe){let Ge=w.fs,Le=Z-Re;if(yn(Qe.k))++Le<0&&(Le=0),de(Ge,Qe,Le),Le>1&&Nn(Ge,Le-1);else if(Qe.k!==In.VVOID&&mn(Ge,Qe),Le>0){let hn=Ge.freereg;Nn(Ge,Le),N(Ge,hn,Le)}Re>Z&&(w.fs.freereg-=Re-Z)},K=function(w){let Z=w.L;++Z.nCcalls,ut(w.fs,Z.nCcalls,M,v("JS levels",!0))},ye=function(w){return w.L.nCcalls--},he=function(w,Z,Re){let Qe=w.fs,Ge=w.dyd.gt,Le=Ge.arr[Z];if(Ee(Dn(Le.name,Re.name)),Le.nactvar<Re.nactvar){let hn=_n(Qe,Le.nactvar).varname,Tn=Se.luaO_pushfstring(w.L,v("<goto %s> at line %d jumps into the scope of local '%s'"),Le.name.getstr(),Le.line,hn.getstr());Jn(w,Tn)}He(Qe,Le.pc,Re.pc);for(let hn=Z;hn<Ge.n-1;hn++)Ge.arr[hn]=Ge.arr[hn+1];Ge.n--},_e=function(w,Z){let Re=w.fs.bl,Qe=w.dyd,Ge=Qe.gt.arr[Z];for(let Le=Re.firstlabel;Le<Qe.label.n;Le++){let hn=Qe.label.arr[Le];if(Dn(hn.name,Ge.name))return Ge.nactvar>hn.nactvar&&(Re.upval||Qe.label.n>Re.firstlabel)&&me(w.fs,Ge.pc,hn.nactvar),he(w,Z,hn),!0}return!1},Sn=function(w,Z,Re,Qe,Ge){let Le=Z.n;return Z.arr[Le]=new class{constructor(){this.name=null,this.pc=NaN,this.line=NaN,this.nactvar=NaN}},Z.arr[Le].name=Re,Z.arr[Le].line=Qe,Z.arr[Le].nactvar=w.fs.nactvar,Z.arr[Le].pc=Ge,Z.n=Le+1,Le},Gn=function(w,Z){let Re=w.dyd.gt,Qe=w.fs.bl.firstgoto;for(;Qe<Re.n;)Dn(Re.arr[Qe].name,Z.name)?he(w,Qe,Z):Qe++},zn=function(w,Z,Re){Z.isloop=Re,Z.nactvar=w.nactvar,Z.firstlabel=w.ls.dyd.label.n,Z.firstgoto=w.ls.dyd.gt.n,Z.upval=0,Z.previous=w.bl,w.bl=Z,Ee(w.freereg===w.nactvar)},jn=function(w,Z,Re){Z.prev=w.fs,Z.ls=w,w.fs=Z,Z.pc=0,Z.lasttarget=0,Z.jpc=oe,Z.freereg=0,Z.nk=0,Z.np=0,Z.nups=0,Z.nlocvars=0,Z.nactvar=0,Z.firstlocal=w.dyd.actvar.n,Z.bl=null;let Qe=Z.f;Qe.source=w.source,Qe.maxstacksize=2,zn(Z,Re,!1)},k=function(w){let Z=w.bl,Re=w.ls;if(Z.previous&&Z.upval){let Qe=ie(w);me(w,Qe,Z.nactvar),G(w,Qe)}Z.isloop&&(function(Qe){let Ge=fn(Qe.L,"break"),Le=Sn(Qe,Qe.dyd.label,Ge,0,Qe.fs.pc);Gn(Qe,Qe.dyd.label.arr[Le])})(Re),w.bl=Z.previous,(function(Qe,Ge){for(Qe.ls.dyd.actvar.n-=Qe.nactvar-Ge;Qe.nactvar>Ge;)_n(Qe,--Qe.nactvar).endpc=Qe.pc})(w,Z.nactvar),Ee(Z.nactvar===w.nactvar),w.freereg=w.nactvar,Re.dyd.label.n=Z.firstlabel,Z.previous?(function(Qe,Ge){let Le=Ge.firstgoto,hn=Qe.ls.dyd.gt;for(;Le<hn.n;){let Tn=hn.arr[Le];Tn.nactvar>Ge.nactvar&&(Ge.upval&&me(Qe,Tn.pc,Ge.nactvar),Tn.nactvar=Ge.nactvar),_e(Qe.ls,Le)||Le++}})(w,Z):Z.firstgoto<Re.dyd.gt.n&&(function(Qe,Ge){let Le=f.isreserved(Ge.name)?"<%s> at line %d not inside a loop":"no visible label '%s' for <goto> at line %d";Le=Se.luaO_pushfstring(Qe.L,v(Le),Ge.name.getstr(),Ge.line),Jn(Qe,Le)})(Re,Re.dyd.gt.arr[Z.firstgoto])},j=function(w){let Z=w.fs;Un(Z,0,0),k(Z),Ee(Z.bl===null),w.fs=Z.prev},Ne=function(w,Z){switch(w.t.token){case fe.TK_ELSE:case fe.TK_ELSEIF:case fe.TK_END:case fe.TK_EOS:return!0;case fe.TK_UNTIL:return Z;default:return!1}},kn=function(w){for(;!Ne(w,1);){if(w.t.token===fe.TK_RETURN)return void Gr(w);Gr(w)}},Wn=function(w,Z){let Re=w.fs,Qe=new $n;dn(Re,Z),f.luaX_next(w),ln(w,Qe),On(Re,Z,Qe)},st=function(w,Z){f.luaX_next(w),pr(w,Z),Y(w.fs,Z),pt(w,93)},Et=function(w,Z){let Re=w.fs,Qe=w.fs.freereg,Ge=new $n,Le=new $n;w.t.token===fe.TK_NAME?(ut(Re,Z.nh,te,v("items in a constructor",!0)),ln(w,Ge)):st(w,Ge),Z.nh++,pt(w,61);let hn=pn(Re,Ge);pr(w,Le),Ce(Re,_,Z.t.u.info,hn,pn(Re,Le)),Re.freereg=Qe},tr=function(w,Z){Z.v.k!==In.VVOID&&(mn(w,Z.v),Z.v.k=In.VVOID,Z.tostore===ne&&(Zn(w,Z.t.u.info,Z.na,Z.tostore),Z.tostore=0))},Ft=function(w,Z){pr(w,Z.v),ut(w.fs,Z.na,te,v("items in a constructor",!0)),Z.na++,Z.tostore++},Vt=function(w,Z){switch(w.t.token){case fe.TK_NAME:f.luaX_lookahead(w)!==61?Ft(w,Z):Et(w,Z);break;case 91:Et(w,Z);break;default:Ft(w,Z)}},Mt=function(w,Z){let Re=w.fs,Qe=w.linenumber,Ge=Ce(Re,s,0,0,0),Le=new class{constructor(){this.v=new $n,this.t=new $n,this.nh=NaN,this.na=NaN,this.tostore=NaN}};Le.na=Le.nh=Le.tostore=0,Le.t=Z,le(Z,In.VRELOCABLE,Ge),le(Le.v,In.VVOID,0),mn(w.fs,Z),pt(w,123);do{if(Ee(Le.v.k===In.VVOID||Le.tostore>0),w.t.token===125)break;tr(Re,Le),Vt(w,Le)}while(lt(w,44)||lt(w,59));At(w,125,123,Qe),(function(hn,Tn){Tn.tostore!==0&&(yn(Tn.v.k)?(ot(hn,Tn.v),Zn(hn,Tn.t.u.info,Tn.na,A),Tn.na--):(Tn.v.k!==In.VVOID&&mn(hn,Tn.v),Zn(hn,Tn.t.u.info,Tn.na,Tn.tostore)))})(Re,Le),en(Re.f.code[Ge],Se.luaO_int2fb(Le.na)),gn(Re.f.code[Ge],Se.luaO_int2fb(Le.nh))},mt=function(w,Z,Re,Qe){let Ge=new ht,Le=new Pn;Ge.f=(function(hn){let Tn=hn.L,rt=new Me(Tn),at=hn.fs;return at.f.p[at.np++]=rt,rt})(w),Ge.f.linedefined=Qe,jn(w,Ge,Le),pt(w,40),Re&&(un(w,"self"),We(w,1)),(function(hn){let Tn=hn.fs,rt=Tn.f,at=0;if(rt.is_vararg=!1,hn.t.token!==41)do switch(hn.t.token){case fe.TK_NAME:wn(hn,E(hn)),at++;break;case fe.TK_DOTS:f.luaX_next(hn),rt.is_vararg=!0;break;default:f.luaX_syntaxerror(hn,v("<name> or '...' expected",!0))}while(!rt.is_vararg&&lt(hn,44));We(hn,at),rt.numparams=Tn.nactvar,Nn(Tn,Tn.nactvar)})(w),pt(w,41),kn(w),Ge.f.lastlinedefined=w.linenumber,At(w,fe.TK_END,fe.TK_FUNCTION,Qe),(function(hn,Tn){let rt=hn.fs.prev;le(Tn,In.VRELOCABLE,T(rt,Xe,0,rt.np-1)),mn(rt,Tn)})(w,Z),j(w)},qt=function(w,Z){let Re=1;for(pr(w,Z);lt(w,44);)mn(w.fs,Z),pr(w,Z),Re++;return Re},fr=function(w,Z,Re){let Qe,Ge=w.fs,Le=new $n;switch(w.t.token){case 40:f.luaX_next(w),w.t.token===41?Le.k=In.VVOID:(qt(w,Le),ot(Ge,Le)),At(w,41,40,Re);break;case 123:Mt(w,Le);break;case fe.TK_STRING:cn(w,Le,w.t.seminfo.ts),f.luaX_next(w);break;default:f.luaX_syntaxerror(w,v("function arguments expected",!0))}Ee(Z.k===In.VNONRELOC);let hn=Z.u.info;yn(Le.k)?Qe=A:(Le.k!==In.VVOID&&mn(Ge,Le),Qe=Ge.freereg-(hn+1)),le(Z,In.VCALL,Ce(Ge,De,hn,Qe+1,2)),ee(Ge,Re),Ge.freereg=hn+1},Ba=function(w,Z){let Re=w.fs,Qe=w.linenumber;for(!(function(Ge,Le){switch(Ge.t.token){case 40:{let hn=Ge.linenumber;return f.luaX_next(Ge),pr(Ge,Le),At(Ge,41,40,hn),void we(Ge.fs,Le)}case fe.TK_NAME:return void p(Ge,Le);default:f.luaX_syntaxerror(Ge,v("unexpected symbol",!0))}})(w,Z);;)switch(w.t.token){case 46:Wn(w,Z);break;case 91:{let Ge=new $n;dn(Re,Z),st(w,Ge),On(Re,Z,Ge);break}case 58:{let Ge=new $n;f.luaX_next(w),ln(w,Ge),Mn(Re,Z,Ge),fr(w,Z,Qe);break}case 40:case fe.TK_STRING:case 123:mn(Re,Z),fr(w,Z,Qe);break;default:return}},Fa=[{left:10,right:10},{left:10,right:10},{left:11,right:11},{left:11,right:11},{left:14,right:13},{left:11,right:11},{left:11,right:11},{left:6,right:6},{left:4,right:4},{left:5,right:5},{left:7,right:7},{left:7,right:7},{left:9,right:8},{left:3,right:3},{left:3,right:3},{left:3,right:3},{left:3,right:3},{left:3,right:3},{left:3,right:3},{left:2,right:2},{left:1,right:1}],Er=function(w,Z,Re){K(w);let Qe=(function(Le){switch(Le){case fe.TK_NOT:return sn;case 45:return an;case 126:return Oe;case 35:return tn;default:return ae}})(w.t.token);if(Qe!==ae){let Le=w.linenumber;f.luaX_next(w),Er(w,Z,12),Pe(w.fs,Qe,Z,Le)}else(function(Le,hn){switch(Le.t.token){case fe.TK_FLT:le(hn,In.VKFLT,0),hn.u.nval=Le.t.seminfo.r;break;case fe.TK_INT:le(hn,In.VKINT,0),hn.u.ival=Le.t.seminfo.i;break;case fe.TK_STRING:cn(Le,hn,Le.t.seminfo.ts);break;case fe.TK_NIL:le(hn,In.VNIL,0);break;case fe.TK_TRUE:le(hn,In.VTRUE,0);break;case fe.TK_FALSE:le(hn,In.VFALSE,0);break;case fe.TK_DOTS:{let Tn=Le.fs;Dt(Le,Tn.f.is_vararg,v("cannot use '...' outside a vararg function",!0)),le(hn,In.VVARARG,Ce(Tn,y,0,1,0));break}case 123:return void Mt(Le,hn);case fe.TK_FUNCTION:return f.luaX_next(Le),void mt(Le,hn,0,Le.linenumber);default:return void Ba(Le,hn)}f.luaX_next(Le)})(w,Z);let Ge=(function(Le){switch(Le){case 43:return D;case 45:return ge;case 42:return nn;case 37:return $e;case 94:return P;case 47:return b;case fe.TK_IDIV:return $;case 38:return I;case 124:return z;case 126:return S;case fe.TK_SHL:return re;case fe.TK_SHR:return be;case fe.TK_CONCAT:return H;case fe.TK_NE:return Ke;case fe.TK_EQ:return F;case 60:return se;case fe.TK_LE:return ve;case 62:return ce;case fe.TK_GE:return Q;case fe.TK_AND:return R;case fe.TK_OR:return on;default:return qe}})(w.t.token);for(;Ge!==qe&&Fa[Ge].left>Re;){let Le=new $n,hn=w.linenumber;f.luaX_next(w),bn(w.fs,Ge,Z);let Tn=Er(w,Le,Fa[Ge].right);Ae(w.fs,Ge,Z,Le,hn),Ge=Tn}return ye(w),Ge},pr=function(w,Z){Er(w,Z,0)},na=function(w){let Z=w.fs,Re=new Pn;zn(Z,Re,0),kn(w),k(Z)};class ta{constructor(){this.prev=null,this.v=new $n}}const Va=function(w,Z,Re){let Qe=new $n;if(Dt(w,(function(Ge){return In.VLOCAL<=Ge&&Ge<=In.VINDEXED})(Z.v.k),v("syntax error",!0)),lt(w,44)){let Ge=new ta;Ge.prev=Z,Ba(w,Ge.v),Ge.v.k!==In.VINDEXED&&(function(Le,hn,Tn){let rt=Le.fs,at=rt.freereg,Lt=!1;for(;hn;hn=hn.prev)hn.v.k===In.VINDEXED&&(hn.v.u.ind.vt===Tn.k&&hn.v.u.ind.t===Tn.u.info&&(Lt=!0,hn.v.u.ind.vt=In.VLOCAL,hn.v.u.ind.t=at),Tn.k===In.VLOCAL&&hn.v.u.ind.idx===Tn.u.info&&(Lt=!0,hn.v.u.ind.idx=at));if(Lt){let Sr=Tn.k===In.VLOCAL?i:vn;Ce(rt,Sr,at,Tn.u.info,0),Nn(rt,1)}})(w,Z,Ge.v),ut(w.fs,Re+w.L.nCcalls,M,v("JS levels",!0)),Va(w,Ge,Re+1)}else{pt(w,61);let Ge=qt(w,Qe);if(Ge===Re)return o(w.fs,Qe),void h(w.fs,Z.v,Qe);q(w,Re,Ge,Qe)}le(Qe,In.VNONRELOC,w.fs.freereg-1),h(w.fs,Z.v,Qe)},yi=function(w){let Z=new $n;return pr(w,Z),Z.k===In.VNIL&&(Z.k=In.VFALSE),rn(w.fs,Z),Z.f},Dr=function(w,Z){let Re,Qe=w.linenumber;lt(w,fe.TK_GOTO)?Re=E(w):(f.luaX_next(w),Re=fn(w.L,"break"));let Ge=Sn(w,w.dyd.gt,Re,Qe,Z);_e(w,Ge)},ra=function(w,Z,Re){let Qe,Ge=w.fs,Le=w.dyd.label;(function(hn,Tn,rt){for(let at=hn.bl.firstlabel;at<Tn.n;at++)if(Dn(rt,Tn.arr[at].name)){let Lt=Se.luaO_pushfstring(hn.ls.L,v("label '%s' already defined on line %d",!0),rt.getstr(),Tn.arr[at].line);Jn(hn.ls,Lt)}})(Ge,Le,Z),pt(w,fe.TK_DBCOLON),Qe=Sn(w,Le,Z,Re,Ie(Ge)),(function(hn){for(;hn.t.token===59||hn.t.token===fe.TK_DBCOLON;)Gr(hn)})(w),Ne(w,0)&&(Le.arr[Qe].nactvar=Ge.bl.nactvar),Gn(w,Le.arr[Qe])},xr=function(w){let Z=new $n;return pr(w,Z),mn(w.fs,Z),Ee(Z.k===In.VNONRELOC),Z.u.info},aa=function(w,Z,Re,Qe,Ge){let Le,hn=new Pn,Tn=w.fs;We(w,3),pt(w,fe.TK_DO);let rt=Ge?g(Tn,Ve,Z,oe):ie(Tn);zn(Tn,hn,0),We(w,Qe),Nn(Tn,Qe),na(w),k(Tn),G(Tn,rt),Ge?Le=g(Tn,Fe,Z,oe):(Ce(Tn,m,Z,0,Qe),ee(Tn,Re),Le=g(Tn,O,Z+2,oe)),He(Tn,Le,rt+1),ee(Tn,Re)},go=function(w,Z){let Re=w.fs,Qe=new Pn;zn(Re,Qe,1),f.luaX_next(w);let Ge=E(w);switch(w.t.token){case 61:(function(Le,hn,Tn){let rt=Le.fs,at=rt.freereg;un(Le,"(for index)"),un(Le,"(for limit)"),un(Le,"(for step)"),wn(Le,hn),pt(Le,61),xr(Le),pt(Le,44),xr(Le),lt(Le,44)?xr(Le):(L(rt,rt.freereg,Je(rt,1)),Nn(rt,1)),aa(Le,at,Tn,1,1)})(w,Ge,Z);break;case 44:case fe.TK_IN:(function(Le,hn){let Tn=Le.fs,rt=new $n,at=4,Lt=Tn.freereg;for(un(Le,"(for generator)"),un(Le,"(for state)"),un(Le,"(for control)"),wn(Le,hn);lt(Le,44);)wn(Le,E(Le)),at++;pt(Le,fe.TK_IN);let Sr=Le.linenumber;q(Le,3,qt(Le,rt),rt),C(Tn,3),aa(Le,Lt,Sr,at-3,0)})(w,Ge);break;default:f.luaX_syntaxerror(w,v("'=' or 'in' expected",!0))}At(w,fe.TK_END,fe.TK_FOR,Z),k(Re)},vi=function(w,Z){let Re,Qe=new Pn,Ge=w.fs,Le=new $n;if(f.luaX_next(w),pr(w,Le),pt(w,fe.TK_THEN),w.t.token===fe.TK_GOTO||w.t.token===fe.TK_BREAK){for(Te(w.fs,Le),zn(Ge,Qe,!1),Dr(w,Le.t);lt(w,59););if(Ne(w,0))return k(Ge),Z;Re=ie(Ge)}else rn(w.fs,Le),zn(Ge,Qe,!1),Re=Le.f;return kn(w),k(Ge),w.t.token!==fe.TK_ELSE&&w.t.token!==fe.TK_ELSEIF||(Z=xe(Ge,Z,ie(Ge))),G(Ge,Re),Z},ja=function(w,Z){let Re=new $n,Qe=new $n;f.luaX_next(w);let Ge=(function(Le,hn){let Tn=0;for(p(Le,hn);Le.t.token===46;)Wn(Le,hn);return Le.t.token===58&&(Tn=1,Wn(Le,hn)),Tn})(w,Re);mt(w,Qe,Ge,Z),h(w.fs,Re,Qe),ee(w.fs,Z)},Gr=function(w){let Z=w.linenumber;switch(K(w),w.t.token){case 59:f.luaX_next(w);break;case fe.TK_IF:(function(Re,Qe){let Ge=Re.fs,Le=oe;for(Le=vi(Re,Le);Re.t.token===fe.TK_ELSEIF;)Le=vi(Re,Le);lt(Re,fe.TK_ELSE)&&na(Re),At(Re,fe.TK_END,fe.TK_IF,Qe),G(Ge,Le)})(w,Z);break;case fe.TK_WHILE:(function(Re,Qe){let Ge=Re.fs,Le=new Pn;f.luaX_next(Re);let hn=Ie(Ge),Tn=yi(Re);zn(Ge,Le,1),pt(Re,fe.TK_DO),na(Re),Ue(Ge,hn),At(Re,fe.TK_END,fe.TK_WHILE,Qe),k(Ge),G(Ge,Tn)})(w,Z);break;case fe.TK_DO:f.luaX_next(w),na(w),At(w,fe.TK_END,fe.TK_DO,Z);break;case fe.TK_FOR:go(w,Z);break;case fe.TK_REPEAT:(function(Re,Qe){let Ge=Re.fs,Le=Ie(Ge),hn=new Pn,Tn=new Pn;zn(Ge,hn,1),zn(Ge,Tn,0),f.luaX_next(Re),kn(Re),At(Re,fe.TK_UNTIL,fe.TK_REPEAT,Qe);let rt=yi(Re);Tn.upval&&me(Ge,rt,Tn.nactvar),k(Ge),He(Ge,rt,Le),k(Ge)})(w,Z);break;case fe.TK_FUNCTION:ja(w,Z);break;case fe.TK_LOCAL:f.luaX_next(w),lt(w,fe.TK_FUNCTION)?(function(Re){let Qe=new $n,Ge=Re.fs;wn(Re,E(Re)),We(Re,1),mt(Re,Qe,0,Re.linenumber),_n(Ge,Qe.u.info).startpc=Ge.pc})(w):(function(Re){let Qe,Ge=0,Le=new $n;do wn(Re,E(Re)),Ge++;while(lt(Re,44));lt(Re,61)?Qe=qt(Re,Le):(Le.k=In.VVOID,Qe=0),q(Re,Ge,Qe,Le),We(Re,Ge)})(w);break;case fe.TK_DBCOLON:f.luaX_next(w),ra(w,E(w),Z);break;case fe.TK_RETURN:f.luaX_next(w),(function(Re){let Qe,Ge,Le=Re.fs,hn=new $n;Ne(Re,1)||Re.t.token===59?Qe=Ge=0:(Ge=qt(Re,hn),yn(hn.k)?(ot(Le,hn),hn.k===In.VCALL&&Ge===1&&(Bn(ze(Le,hn),c),Ee(ze(Le,hn).A===Le.nactvar)),Qe=Le.nactvar,Ge=A):Ge===1?Qe=Ze(Le,hn):(mn(Le,hn),Qe=Le.nactvar,Ee(Ge===Le.freereg-Qe))),Un(Le,Qe,Ge),lt(Re,59)})(w);break;case fe.TK_BREAK:case fe.TK_GOTO:Dr(w,ie(w.fs));break;default:(function(Re){let Qe=Re.fs,Ge=new ta;Ba(Re,Ge.v),Re.t.token===61||Re.t.token===44?(Ge.prev=null,Va(Re,Ge,1)):(Dt(Re,Ge.v.k===In.VCALL,v("syntax error",!0)),gn(ze(Qe,Ge.v),1))})(w)}Ee(w.fs.f.maxstacksize>=w.fs.freereg&&w.fs.freereg>=w.fs.nactvar),w.fs.freereg=w.fs.nactvar,ye(w)};a.exports.Dyndata=class{constructor(){this.actvar={arr:[],n:NaN,size:NaN},this.gt=new Fn,this.label=new Fn}},a.exports.expkind=In,a.exports.expdesc=$n,a.exports.luaY_parser=function(w,Z,Re,Qe,Ge,Le){let hn=new f.LexState,Tn=new ht,rt=J.luaF_newLclosure(w,1);return V.luaD_inctop(w),w.stack[w.top-1].setclLvalue(rt),hn.h=U.luaH_new(w),V.luaD_inctop(w),w.stack[w.top-1].sethvalue(hn.h),Tn.f=rt.p=new Me(w),Tn.f.source=pe(w,Ge),hn.buff=Re,hn.dyd=Qe,Qe.actvar.n=Qe.gt.n=Qe.label.n=0,f.luaX_setinput(w,hn,Z,Tn.f.source,Le),(function(at,Lt){let Sr=new Pn,Br=new $n;jn(at,Lt,Sr),Lt.f.is_vararg=!0,le(Br,In.VLOCAL,0),xn(Lt,at.envn,Br),f.luaX_next(at),kn(at),Ct(at,fe.TK_EOS),j(at)})(hn,Tn),Ee(!Tn.prev&&Tn.nups===1&&!hn.fs),Ee(Qe.actvar.n===0&&Qe.gt.n===0&&Qe.label.n===0),delete w.stack[--w.top],rt},a.exports.vkisinreg=function(w){return w===In.VNONRELOC||w===In.VLOCAL}},function(a,B,d){const{LUA_MULTRET:A,LUA_OK:v,LUA_TFUNCTION:D,LUA_TNIL:R,LUA_TNONE:I,LUA_TNUMBER:z,LUA_TSTRING:S,LUA_TTABLE:H,LUA_VERSION:b,LUA_YIELD:F,lua_call:Q,lua_callk:ce,lua_concat:$,lua_error:ve,lua_getglobal:se,lua_geti:$e,lua_getmetatable:nn,lua_gettop:Ke,lua_insert:qe,lua_isnil:on,lua_isnone:P,lua_isstring:re,lua_load:be,lua_next:ge,lua_pcallk:Oe,lua_pop:tn,lua_pushboolean:an,lua_pushcfunction:sn,lua_pushglobaltable:ae,lua_pushinteger:oe,lua_pushliteral:ze,lua_pushnil:C,lua_pushstring:Ce,lua_pushvalue:T,lua_rawequal:g,lua_rawget:L,lua_rawlen:xe,lua_rawset:we,lua_remove:pn,lua_replace:Ze,lua_rotate:dn,lua_setfield:mn,lua_setmetatable:Y,lua_settop:ee,lua_setupvalue:Ie,lua_stringtonumber:Te,lua_toboolean:rn,lua_tolstring:On,lua_tostring:bn,lua_type:Je,lua_typename:ie}=d(2),{luaL_argcheck:Ue,luaL_checkany:N,luaL_checkinteger:me,luaL_checkoption:He,luaL_checkstack:G,luaL_checktype:Ae,luaL_error:Pe,luaL_getmetafield:Nn,luaL_loadbufferx:Un,luaL_loadfile:Mn,luaL_loadfilex:Zn,luaL_optinteger:ot,luaL_optstring:o,luaL_setfuncs:de,luaL_tolstring:h,luaL_where:X}=d(7),{to_jsstring:V,to_luastring:J}=d(5);let f,M;if(typeof TextDecoder=="function"){let s="",_=new TextDecoder("utf-8");f=function(m){s+=_.decode(m,{stream:!0})};let c=new Uint8Array(0);M=function(){s+=_.decode(c),console.log(s),s=""}}else{let s=[];f=function(_){try{_=V(_)}catch{let m=new Uint8Array(_.length);m.set(_),_=m}s.push(_)},M=function(){console.log.apply(console.log,s),s=[]}}const te=["stop","restart","collect","count","step","setpause","setstepmul","isrunning"].map(s=>J(s)),Ee=function(s){return Ae(s,1,H),ee(s,2),ge(s,1)?2:(C(s),1)},Se=function(s){let _=me(s,2)+1;return oe(s,_),$e(s,1,_)===R?1:2},De=function(s){let _=ot(s,2,1);return ee(s,1),Je(s,1)===S&&_>0&&(X(s,_),T(s,1),$(s,2)),ve(s)},Xe=function(s,_,c){return _!==v&&_!==F?(an(s,0),T(s,-2),2):Ke(s)-c},Fe=function(s,_,c){return _===v?(c!==0&&(T(s,c),Ie(s,-2,1)||tn(s,1)),1):(C(s),qe(s,-2),2)},Ve=function(s,_){return G(s,2,"too many nested functions"),T(s,1),Q(s,0,1),on(s,-1)?(tn(s,1),null):(re(s,-1)||Pe(s,J("reader function must return a string")),Ze(s,5),bn(s,5))},vn=function(s,_,c){return Ke(s)-1},i={assert:function(s){return rn(s,1)?Ke(s):(N(s,1),pn(s,1),ze(s,"assertion failed!"),ee(s,1),De(s))},collectgarbage:function(s){He(s,1,"collect",te),ot(s,2,0),Pe(s,J("lua_gc not implemented"))},dofile:function(s){let _=o(s,1,null);return ee(s,1),Mn(s,_)!==v?ve(s):(ce(s,0,A,0,vn),vn(s))},error:De,getmetatable:function(s){return N(s,1),nn(s,1)?(Nn(s,1,J("__metatable",!0)),1):(C(s),1)},ipairs:function(s){return N(s,1),sn(s,Se),T(s,1),oe(s,0),3},load:function(s){let _,c=bn(s,1),m=o(s,3,"bt"),O=P(s,4)?0:4;if(c!==null){let y=o(s,2,c);_=Un(s,c,c.length,y,m)}else{let y=o(s,2,"=(load)");Ae(s,1,D),ee(s,5),_=be(s,Ve,null,y,m)}return Fe(s,_,O)},loadfile:function(s){let _=o(s,1,null),c=o(s,2,null),m=P(s,3)?0:3,O=Zn(s,_,c);return Fe(s,O,m)},next:Ee,pairs:function(s){return(function(_,c,m,O){return N(_,1),Nn(_,1,c)===R?(sn(_,O),T(_,1),C(_)):(T(_,1),Q(_,1,3)),3})(s,J("__pairs",!0),0,Ee)},pcall:function(s){N(s,1),an(s,1),qe(s,1);let _=Oe(s,Ke(s)-2,A,0,0,Xe);return Xe(s,_,0)},print:function(s){let _=Ke(s);se(s,J("tostring",!0));for(let c=1;c<=_;c++){T(s,-1),T(s,c),Q(s,1,1);let m=On(s,-1);if(m===null)return Pe(s,J("'tostring' must return a string to 'print'"));c>1&&f(J("	")),f(m),tn(s,1)}return M(),0},rawequal:function(s){return N(s,1),N(s,2),an(s,g(s,1,2)),1},rawget:function(s){return Ae(s,1,H),N(s,2),ee(s,2),L(s,1),1},rawlen:function(s){let _=Je(s,1);return Ue(s,_===H||_===S,1,"table or string expected"),oe(s,xe(s,1)),1},rawset:function(s){return Ae(s,1,H),N(s,2),N(s,3),ee(s,3),we(s,1),1},select:function(s){let _=Ke(s);if(Je(s,1)===S&&bn(s,1)[0]===35)return oe(s,_-1),1;{let c=me(s,1);return c<0?c=_+c:c>_&&(c=_),Ue(s,1<=c,1,"index out of range"),_-c}},setmetatable:function(s){let _=Je(s,2);return Ae(s,1,H),Ue(s,_===R||_===H,2,"nil or table expected"),Nn(s,1,J("__metatable",!0))!==R?Pe(s,J("cannot change a protected metatable")):(ee(s,2),Y(s,1),1)},tonumber:function(s){if(Je(s,2)<=0){if(N(s,1),Je(s,1)===z)return ee(s,1),1;{let _=bn(s,1);if(_!==null&&Te(s,_)===_.length+1)return 1}}else{let _=me(s,2);Ae(s,1,S);let c=bn(s,1);Ue(s,2<=_&&_<=36,2,"base out of range");let m=(function(O,y){try{O=V(O)}catch{return null}let ne=/^[\t\v\f \n\r]*([+-]?)0*([0-9A-Za-z]+)[\t\v\f \n\r]*$/.exec(O);if(!ne)return null;let en=parseInt(ne[1]+ne[2],y);return isNaN(en)?null:0|en})(c,_);if(m!==null)return oe(s,m),1}return C(s),1},tostring:function(s){return N(s,1),h(s,1),1},type:function(s){let _=Je(s,1);return Ue(s,_!==I,1,"value expected"),Ce(s,ie(s,_)),1},xpcall:function(s){let _=Ke(s);Ae(s,2,D),an(s,1),T(s,1),dn(s,3,2);let c=Oe(s,_-2,A,2,2,Xe);return Xe(s,c,2)}};a.exports.luaopen_base=function(s){return ae(s),de(s,i,0),T(s,-1),mn(s,-2,J("_G")),ze(s,b),mn(s,-2,J("_VERSION")),1}},function(a,B,d){const{LUA_OK:A,LUA_TFUNCTION:v,LUA_TSTRING:D,LUA_YIELD:R,lua_Debug:I,lua_checkstack:z,lua_concat:S,lua_error:H,lua_getstack:b,lua_gettop:F,lua_insert:Q,lua_isyieldable:ce,lua_newthread:$,lua_pop:ve,lua_pushboolean:se,lua_pushcclosure:$e,lua_pushliteral:nn,lua_pushthread:Ke,lua_pushvalue:qe,lua_resume:on,lua_status:P,lua_tothread:re,lua_type:be,lua_upvalueindex:ge,lua_xmove:Oe,lua_yield:tn}=d(2),{luaL_argcheck:an,luaL_checktype:sn,luaL_newlib:ae,luaL_where:oe}=d(7),ze=function(L){let xe=re(L,1);return an(L,xe,1,"thread expected"),xe},C=function(L,xe,we){if(!z(xe,we))return nn(L,"too many arguments to resume"),-1;if(P(xe)===A&&F(xe)===0)return nn(L,"cannot resume dead coroutine"),-1;Oe(L,xe,we);let pn=on(xe,L,we);if(pn===A||pn===R){let Ze=F(xe);return z(L,Ze+1)?(Oe(xe,L,Ze),Ze):(ve(xe,Ze),nn(L,"too many results to resume"),-1)}return Oe(xe,L,1),-1},Ce=function(L){let xe=re(L,ge(1)),we=C(L,xe,F(L));return we<0?(be(L,-1)===D&&(oe(L,1),Q(L,-2),S(L,2)),H(L)):we},T=function(L){sn(L,1,v);let xe=$(L);return qe(L,1),Oe(L,xe,1),1},g={create:T,isyieldable:function(L){return se(L,ce(L)),1},resume:function(L){let xe=ze(L),we=C(L,xe,F(L)-1);return we<0?(se(L,0),Q(L,-2),2):(se(L,1),Q(L,-(we+1)),we+1)},running:function(L){return se(L,Ke(L)),2},status:function(L){let xe=ze(L);if(L===xe)nn(L,"running");else switch(P(xe)){case R:nn(L,"suspended");break;case A:{let we=new I;b(xe,0,we)>0?nn(L,"normal"):F(xe)===0?nn(L,"dead"):nn(L,"suspended");break}default:nn(L,"dead")}return 1},wrap:function(L){return T(L),$e(L,Ce,1),1},yield:function(L){return tn(L,F(L))}};a.exports.luaopen_coroutine=function(L){return ae(L,g),1}},function(a,B,d){const{LUA_MAXINTEGER:A}=d(3),{LUA_OPEQ:v,LUA_OPLT:D,LUA_TFUNCTION:R,LUA_TNIL:I,LUA_TTABLE:z,lua_call:S,lua_checkstack:H,lua_compare:b,lua_createtable:F,lua_geti:Q,lua_getmetatable:ce,lua_gettop:$,lua_insert:ve,lua_isnil:se,lua_isnoneornil:$e,lua_isstring:nn,lua_pop:Ke,lua_pushinteger:qe,lua_pushnil:on,lua_pushstring:P,lua_pushvalue:re,lua_rawget:be,lua_setfield:ge,lua_seti:Oe,lua_settop:tn,lua_toboolean:an,lua_type:sn}=d(2),{luaL_Buffer:ae,luaL_addlstring:oe,luaL_addvalue:ze,luaL_argcheck:C,luaL_buffinit:Ce,luaL_checkinteger:T,luaL_checktype:g,luaL_error:L,luaL_len:xe,luaL_newlib:we,luaL_opt:pn,luaL_optinteger:Ze,luaL_optlstring:dn,luaL_pushresult:mn,luaL_typename:Y}=d(7),ee=d(17),{to_luastring:Ie}=d(5),Te=function(G,Ae,Pe){return P(G,Ae),be(G,-Pe)!==I},rn=function(G,Ae,Pe){if(sn(G,Ae)!==z){let Nn=1;!ce(G,Ae)||1&Pe&&!Te(G,Ie("__index",!0),++Nn)||2&Pe&&!Te(G,Ie("__newindex",!0),++Nn)||4&Pe&&!Te(G,Ie("__len",!0),++Nn)?g(G,Ae,z):Ke(G,Nn)}},On=function(G,Ae,Pe){return rn(G,Ae,4|Pe),xe(G,Ae)},bn=function(G,Ae,Pe){Q(G,1,Pe),nn(G,-1)||L(G,Ie("invalid value (%s) at index %d in table for 'concat'"),Y(G,-1),Pe),ze(Ae)},Je=function(G,Ae,Pe){Oe(G,1,Ae),Oe(G,1,Pe)},ie=function(G,Ae,Pe){if(se(G,2))return b(G,Ae,Pe,D);{re(G,2),re(G,Ae-1),re(G,Pe-2),S(G,2,1);let Nn=an(G,-1);return Ke(G,1),Nn}},Ue=function(G,Ae,Pe){let Nn=Ae,Un=Pe-1;for(;;){for(;Q(G,1,++Nn),ie(G,-1,-2);)Nn==Pe-1&&L(G,Ie("invalid order function for sorting")),Ke(G,1);for(;Q(G,1,--Un),ie(G,-3,-1);)Un<Nn&&L(G,Ie("invalid order function for sorting")),Ke(G,1);if(Un<Nn)return Ke(G,1),Je(G,Pe-1,Nn),Nn;Je(G,Nn,Un)}},N=function(G,Ae,Pe){let Nn=Math.floor((Ae-G)/4),Un=Pe%(2*Nn)+(G+Nn);return ee.lua_assert(G+Nn<=Un&&Un<=Ae-Nn),Un},me=function(G,Ae,Pe,Nn){for(;Ae<Pe;){if(Q(G,1,Ae),Q(G,1,Pe),ie(G,-1,-2)?Je(G,Ae,Pe):Ke(G,2),Pe-Ae==1)return;let Un,Mn;if(Un=Pe-Ae<100||Nn===0?Math.floor((Ae+Pe)/2):N(Ae,Pe,Nn),Q(G,1,Un),Q(G,1,Ae),ie(G,-2,-1)?Je(G,Un,Ae):(Ke(G,1),Q(G,1,Pe),ie(G,-1,-2)?Je(G,Un,Pe):Ke(G,2)),Pe-Ae==2)return;Q(G,1,Un),re(G,-1),Q(G,1,Pe-1),Je(G,Un,Pe-1),(Un=Ue(G,Ae,Pe))-Ae<Pe-Un?(me(G,Ae,Un-1,Nn),Mn=Un-Ae,Ae=Un+1):(me(G,Un+1,Pe,Nn),Mn=Pe-Un,Pe=Un-1),(Pe-Ae)/128>Mn&&(Nn=Math.floor(4294967296*Math.random()))}},He={concat:function(G){let Ae=On(G,1,1),Pe=dn(G,2,""),Nn=Pe.length,Un=Ze(G,3,1);Ae=Ze(G,4,Ae);let Mn=new ae;for(Ce(G,Mn);Un<Ae;Un++)bn(G,Mn,Un),oe(Mn,Pe,Nn);return Un===Ae&&bn(G,Mn,Un),mn(Mn),1},insert:function(G){let Ae,Pe=On(G,1,3)+1;switch($(G)){case 2:Ae=Pe;break;case 3:Ae=T(G,2),C(G,1<=Ae&&Ae<=Pe,2,"position out of bounds");for(let Nn=Pe;Nn>Ae;Nn--)Q(G,1,Nn-1),Oe(G,1,Nn);break;default:return L(G,"wrong number of arguments to 'insert'")}return Oe(G,1,Ae),0},move:function(G){let Ae=T(G,2),Pe=T(G,3),Nn=T(G,4),Un=$e(G,5)?1:5;if(rn(G,1,1),rn(G,Un,2),Pe>=Ae){C(G,Ae>0||Pe<A+Ae,3,"too many elements to move");let Mn=Pe-Ae+1;if(C(G,Nn<=A-Mn+1,4,"destination wrap around"),Nn>Pe||Nn<=Ae||Un!==1&&b(G,1,Un,v)!==1)for(let Zn=0;Zn<Mn;Zn++)Q(G,1,Ae+Zn),Oe(G,Un,Nn+Zn);else for(let Zn=Mn-1;Zn>=0;Zn--)Q(G,1,Ae+Zn),Oe(G,Un,Nn+Zn)}return re(G,Un),1},pack:function(G){let Ae=$(G);F(G,Ae,1),ve(G,1);for(let Pe=Ae;Pe>=1;Pe--)Oe(G,1,Pe);return qe(G,Ae),ge(G,1,Ie("n")),1},remove:function(G){let Ae=On(G,1,3),Pe=Ze(G,2,Ae);for(Pe!==Ae&&C(G,1<=Pe&&Pe<=Ae+1,1,"position out of bounds"),Q(G,1,Pe);Pe<Ae;Pe++)Q(G,1,Pe+1),Oe(G,1,Pe);return on(G),Oe(G,1,Pe),1},sort:function(G){let Ae=On(G,1,3);return Ae>1&&(C(G,Ae<A,1,"array too big"),$e(G,2)||g(G,2,R),tn(G,2),me(G,1,Ae,0)),0},unpack:function(G){let Ae=Ze(G,2,1),Pe=pn(G,T,3,xe(G,1));if(Ae>Pe)return 0;let Nn=Pe-Ae;if(Nn>=Number.MAX_SAFE_INTEGER||!H(G,++Nn))return L(G,Ie("too many results to unpack"));for(;Ae<Pe;Ae++)Q(G,1,Ae);return Q(G,1,Pe),Nn}};a.exports.luaopen_table=function(G){return we(G,He),1}},function(a,B,d){const{LUA_TNIL:A,LUA_TTABLE:v,lua_close:D,lua_createtable:R,lua_getfield:I,lua_isboolean:z,lua_isnoneornil:S,lua_pop:H,lua_pushboolean:b,lua_pushfstring:F,lua_pushinteger:Q,lua_pushliteral:ce,lua_pushnil:$,lua_pushnumber:ve,lua_pushstring:se,lua_setfield:$e,lua_settop:nn,lua_toboolean:Ke,lua_tointegerx:qe}=d(2),{luaL_Buffer:on,luaL_addchar:P,luaL_addstring:re,luaL_argerror:be,luaL_buffinit:ge,luaL_checkinteger:Oe,luaL_checkstring:tn,luaL_checktype:an,luaL_error:sn,luaL_execresult:ae,luaL_fileresult:oe,luaL_newlib:ze,luaL_optinteger:C,luaL_optlstring:Ce,luaL_optstring:T,luaL_pushresult:g}=d(7),{luastring_eq:L,to_jsstring:xe,to_luastring:we}=d(5),pn=we("aAbBcCdDeFhHIjklmMnpPrRStTuUwWxXyYzZ%"),Ze=function(ie,Ue,N){Q(ie,N),$e(ie,-2,we(Ue,!0))},dn=function(ie,Ue,N){Ze(ie,"sec",N?Ue.getUTCSeconds():Ue.getSeconds()),Ze(ie,"min",N?Ue.getUTCMinutes():Ue.getMinutes()),Ze(ie,"hour",N?Ue.getUTCHours():Ue.getHours()),Ze(ie,"day",N?Ue.getUTCDate():Ue.getDate()),Ze(ie,"month",(N?Ue.getUTCMonth():Ue.getMonth())+1),Ze(ie,"year",N?Ue.getUTCFullYear():Ue.getFullYear()),Ze(ie,"wday",(N?Ue.getUTCDay():Ue.getDay())+1),Ze(ie,"yday",Math.floor((Ue-new Date(Ue.getFullYear(),0,0))/864e5))},mn=Number.MAX_SAFE_INTEGER/2,Y=function(ie,Ue,N,me){let He=I(ie,-1,we(Ue,!0)),G=qe(ie,-1);if(G===!1){if(He!==A)return sn(ie,we("field '%s' is not an integer"),Ue);if(N<0)return sn(ie,we("field '%s' missing in date table"),Ue);G=N}else{if(!(-mn<=G&&G<=mn))return sn(ie,we("field '%s' is out-of-bound"),Ue);G-=me}return H(ie,1),G},ee={days:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map(ie=>we(ie)),shortDays:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(ie=>we(ie)),months:["January","February","March","April","May","June","July","August","September","October","November","December"].map(ie=>we(ie)),shortMonths:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(ie=>we(ie)),AM:we("AM"),PM:we("PM"),am:we("am"),pm:we("pm"),formats:{c:we("%a %b %e %H:%M:%S %Y"),D:we("%m/%d/%y"),F:we("%Y-%m-%d"),R:we("%H:%M"),r:we("%I:%M:%S %p"),T:we("%H:%M:%S"),X:we("%T"),x:we("%D")}},Ie=function(ie,Ue){let N=ie.getDay();Ue==="monday"&&(N===0?N=6:N--);let me=(ie-new Date(ie.getFullYear(),0,1))/864e5;return Math.floor((me+7-N)/7)},Te=function(ie,Ue,N){Ue<10&&P(ie,N),re(ie,we(String(Ue)))},rn=function(ie,Ue,N,me){let He=0;for(;He<N.length;)if(N[He]!==37)P(Ue,N[He++]);else{let G=On(ie,N,++He);switch(N[He]){case 37:P(Ue,37);break;case 65:re(Ue,ee.days[me.getDay()]);break;case 66:re(Ue,ee.months[me.getMonth()]);break;case 67:Te(Ue,Math.floor(me.getFullYear()/100),48);break;case 68:rn(ie,Ue,ee.formats.D,me);break;case 70:rn(ie,Ue,ee.formats.F,me);break;case 72:Te(Ue,me.getHours(),48);break;case 73:Te(Ue,(me.getHours()+11)%12+1,48);break;case 77:Te(Ue,me.getMinutes(),48);break;case 80:re(Ue,me.getHours()<12?ee.am:ee.pm);break;case 82:rn(ie,Ue,ee.formats.R,me);break;case 83:Te(Ue,me.getSeconds(),48);break;case 84:rn(ie,Ue,ee.formats.T,me);break;case 85:Te(Ue,Ie(me,"sunday"),48);break;case 87:Te(Ue,Ie(me,"monday"),48);break;case 88:rn(ie,Ue,ee.formats.X,me);break;case 89:re(Ue,we(String(me.getFullYear())));break;case 90:{let Ae=me.toString().match(/\(([\w\s]+)\)/);Ae&&re(Ue,we(Ae[1]));break}case 97:re(Ue,ee.shortDays[me.getDay()]);break;case 98:case 104:re(Ue,ee.shortMonths[me.getMonth()]);break;case 99:rn(ie,Ue,ee.formats.c,me);break;case 100:Te(Ue,me.getDate(),48);break;case 101:Te(Ue,me.getDate(),32);break;case 106:{let Ae=Math.floor((me-new Date(me.getFullYear(),0,1))/864e5);Ae<100&&(Ae<10&&P(Ue,48),P(Ue,48)),re(Ue,we(String(Ae)));break}case 107:Te(Ue,me.getHours(),32);break;case 108:Te(Ue,(me.getHours()+11)%12+1,32);break;case 109:Te(Ue,me.getMonth()+1,48);break;case 110:P(Ue,10);break;case 112:re(Ue,me.getHours()<12?ee.AM:ee.PM);break;case 114:rn(ie,Ue,ee.formats.r,me);break;case 115:re(Ue,we(String(Math.floor(me/1e3))));break;case 116:P(Ue,8);break;case 117:{let Ae=me.getDay();re(Ue,we(String(Ae===0?7:Ae)));break}case 119:re(Ue,we(String(me.getDay())));break;case 120:rn(ie,Ue,ee.formats.x,me);break;case 121:Te(Ue,me.getFullYear()%100,48);break;case 122:{let Ae=me.getTimezoneOffset();Ae>0?P(Ue,45):(Ae=-Ae,P(Ue,43)),Te(Ue,Math.floor(Ae/60),48),Te(Ue,Ae%60,48);break}}He+=G}},On=function(ie,Ue,N){let me=pn,He=0,G=1;for(;He<me.length&&G<=Ue.length-N;He+=G)if(me[He]===124)G++;else if(L(Ue.subarray(N,N+G),me.subarray(He,He+G)))return G;be(ie,1,F(ie,we("invalid conversion specifier '%%%s'"),Ue))},bn=function(ie,Ue){return Oe(ie,Ue)},Je={date:function(ie){let Ue=Ce(ie,1,"%c"),N=S(ie,2)?new Date:new Date(1e3*bn(ie,2)),me=!1,He=0;if(Ue[He]===33&&(me=!0,He++),Ue[He]===42&&Ue[He+1]===116)R(ie,0,9),dn(ie,N,me);else{new Uint8Array(4)[0]=37;let G=new on;ge(ie,G),rn(ie,G,Ue,N),g(G)}return 1},difftime:function(ie){let Ue=bn(ie,1),N=bn(ie,2);return ve(ie,Ue-N),1},time:function(ie){let Ue;return S(ie,1)?Ue=new Date:(an(ie,1,v),nn(ie,1),Ue=new Date(Y(ie,"year",-1,0),Y(ie,"month",-1,1),Y(ie,"day",-1,0),Y(ie,"hour",12,0),Y(ie,"min",0,0),Y(ie,"sec",0,0)),dn(ie,Ue)),Q(ie,Math.floor(Ue/1e3)),1},clock:function(ie){return ve(ie,performance.now()/1e3),1}};a.exports.luaopen_os=function(ie){return ze(ie,Je),1}},function(a,B,d){const{sprintf:A}=d(38),{LUA_INTEGER_FMT:v,LUA_INTEGER_FRMLEN:D,LUA_MININTEGER:R,LUA_NUMBER_FMT:I,LUA_NUMBER_FRMLEN:z,frexp:S,lua_getlocaledecpoint:H}=d(3),{LUA_TBOOLEAN:b,LUA_TFUNCTION:F,LUA_TNIL:Q,LUA_TNUMBER:ce,LUA_TSTRING:$,LUA_TTABLE:ve,lua_call:se,lua_createtable:$e,lua_dump:nn,lua_gettable:Ke,lua_gettop:qe,lua_isinteger:on,lua_isstring:P,lua_pop:re,lua_pushcclosure:be,lua_pushinteger:ge,lua_pushlightuserdata:Oe,lua_pushliteral:tn,lua_pushlstring:an,lua_pushnil:sn,lua_pushnumber:ae,lua_pushstring:oe,lua_pushvalue:ze,lua_remove:C,lua_setfield:Ce,lua_setmetatable:T,lua_settop:g,lua_toboolean:L,lua_tointeger:xe,lua_tonumber:we,lua_tostring:pn,lua_touserdata:Ze,lua_type:dn,lua_upvalueindex:mn}=d(2),{luaL_Buffer:Y,luaL_addchar:ee,luaL_addlstring:Ie,luaL_addsize:Te,luaL_addstring:rn,luaL_addvalue:On,luaL_argcheck:bn,luaL_argerror:Je,luaL_buffinit:ie,luaL_buffinitsize:Ue,luaL_checkinteger:N,luaL_checknumber:me,luaL_checkstack:He,luaL_checkstring:G,luaL_checktype:Ae,luaL_error:Pe,luaL_newlib:Nn,luaL_optinteger:Un,luaL_optstring:Mn,luaL_prepbuffsize:Zn,luaL_pushresult:ot,luaL_pushresultsize:o,luaL_tolstring:de,luaL_typename:h}=d(7),X=d(17),{luastring_eq:V,luastring_indexOf:J,to_jsstring:f,to_luastring:M}=d(5),te=37,Ee=function(p){let q=J(p,0);return q>-1?q:p.length},Se=function(p,q){return p>=0?p:0-p>q?0:q+p+1},De=function(p,q,K,ye){return Ie(ye,q,K),0},Xe=z.length+1,Fe=function(p,q,K){let ye=(function(he){if(Object.is(he,1/0))return M("inf");if(Object.is(he,-1/0))return M("-inf");if(Number.isNaN(he))return M("nan");if(he===0){let _e=A(I+"x0p+0",he);return Object.is(he,-0)&&(_e="-"+_e),M(_e)}{let _e="",Sn=S(he),Gn=Sn[0],zn=Sn[1];return Gn<0&&(_e+="-",Gn=-Gn),_e+="0x",_e+=(2*Gn).toString(16),_e+=A("p%+d",zn-=1),M(_e)}})(K);if(q[Xe]===65)for(let he=0;he<ye.length;he++){let _e=ye[he];_e>=97&&(ye[he]=223&_e)}else q[Xe]!==97&&Pe(p,M("modifiers for format '%%a'/'%%A' not implemented"));return ye},Ve=M("-+ #0"),vn=p=>97<=p&&p<=122||65<=p&&p<=90,i=p=>48<=p&&p<=57,s=p=>0<=p&&p<=31||p===127,_=p=>33<=p&&p<=126,c=p=>97<=p&&p<=122,m=p=>65<=p&&p<=90,O=p=>97<=p&&p<=122||65<=p&&p<=90||48<=p&&p<=57,y=p=>_(p)&&!O(p),ne=p=>p===32||p>=9&&p<=13,en=p=>48<=p&&p<=57||65<=p&&p<=70||97<=p&&p<=102,gn=function(p,q,K){switch(dn(p,K)){case $:{let ye=pn(p,K);(function(he,_e,Sn){ee(he,34);let Gn=0;for(;Sn--;){if(_e[Gn]===34||_e[Gn]===92||_e[Gn]===10)ee(he,92),ee(he,_e[Gn]);else if(s(_e[Gn])){let zn=""+_e[Gn];i(_e[Gn+1])&&(zn="0".repeat(3-zn.length)+zn),rn(he,M("\\"+zn))}else ee(he,_e[Gn]);Gn++}ee(he,34)})(q,ye,ye.length);break}case ce:{let ye;if(on(p,K)){let he=xe(p,K);ye=M(A(he===R?"0x%"+D+"x":v,he))}else{let he=we(p,K);(function(_e){if(J(_e,46)<0){let Sn=H(),Gn=J(_e,Sn);Gn&&(_e[Gn]=46)}})(ye=Fe(p,M(`%${D}a`),he))}rn(q,ye);break}case Q:case b:de(p,K),On(q);break;default:Je(p,K,M("value has no literal form"))}},Bn=function(p,q,K,ye){let he=K;for(;q[he]!==0&&J(Ve,q[he])>=0;)he++;he-K>=Ve.length&&Pe(p,M("invalid format (repeated flags)")),i(q[he])&&he++,i(q[he])&&he++,q[he]===46&&(i(q[++he])&&he++,i(q[he])&&he++),i(q[he])&&Pe(p,M("invalid format (width or precision too long)")),ye[0]=37;for(let _e=0;_e<he-K+1;_e++)ye[_e+1]=q[K+_e];return he},Kn=function(p,q){let K=p.length,ye=q.length,he=p[K-1];for(let _e=0;_e<ye;_e++)p[_e+K-1]=q[_e];p[K+ye-1]=he};class pe{constructor(q){this.L=q,this.islittle=!0,this.maxalign=1}}const fn=i,U=function(p,q){if(p.off>=p.s.length||!fn(p.s[p.off]))return q;{let K=0;do K=10*K+(p.s[p.off++]-48);while(p.off<p.s.length&&fn(p.s[p.off])&&K<=2147483638e-1);return K}},Me=function(p,q,K){let ye=U(q,K);return(ye>16||ye<=0)&&Pe(p.L,M("integral size (%d) out of limits [1,%d]"),ye,16),ye},fe=function(p,q){let K={opt:q.s[q.off++],size:0};switch(K.opt){case 98:return K.size=1,K.opt=0,K;case 66:return K.size=1,K.opt=1,K;case 104:return K.size=2,K.opt=0,K;case 72:return K.size=2,K.opt=1,K;case 108:return K.size=4,K.opt=0,K;case 76:return K.size=4,K.opt=1,K;case 106:return K.size=4,K.opt=0,K;case 74:case 84:return K.size=4,K.opt=1,K;case 102:return K.size=4,K.opt=2,K;case 100:case 110:return K.size=8,K.opt=2,K;case 105:return K.size=Me(p,q,4),K.opt=0,K;case 73:return K.size=Me(p,q,4),K.opt=1,K;case 115:return K.size=Me(p,q,4),K.opt=4,K;case 99:return K.size=U(q,-1),K.size===-1&&Pe(p.L,M("missing size for format option 'c'")),K.opt=3,K;case 122:return K.opt=5,K;case 120:return K.size=1,K.opt=6,K;case 88:return K.opt=7,K;case 32:break;case 60:p.islittle=!0;break;case 62:p.islittle=!1;break;case 61:p.islittle=!0;break;case 33:p.maxalign=Me(p,q,8);break;default:Pe(p.L,M("invalid format option '%c'"),K.opt)}return K.opt=8,K},yn=function(p,q,K){let ye={opt:NaN,size:NaN,ntoalign:NaN},he=fe(p,K);ye.size=he.size,ye.opt=he.opt;let _e=ye.size;if(ye.opt===7)if(K.off>=K.s.length||K.s[K.off]===0)Je(p.L,1,M("invalid next option for option 'X'"));else{let Sn=fe(p,K);_e=Sn.size,(Sn=Sn.opt)!==3&&_e!==0||Je(p.L,1,M("invalid next option for option 'X'"))}return _e<=1||ye.opt===3?ye.ntoalign=0:(_e>p.maxalign&&(_e=p.maxalign),(_e&_e-1)!=0&&Je(p.L,1,M("format asks for alignment not power of 2")),ye.ntoalign=_e-(q&_e-1)&_e-1),ye},Dn=function(p,q,K,ye,he){let _e=Zn(p,ye);_e[K?0:ye-1]=255&q;for(let Sn=1;Sn<ye;Sn++)q>>=8,_e[K?Sn:ye-1-Sn]=255&q;if(he&&ye>4)for(let Sn=4;Sn<ye;Sn++)_e[K?Sn:ye-1-Sn]=255;Te(p,ye)},Pn=function(p,q,K,ye,he){let _e=0,Sn=ye<=4?ye:4;for(let Gn=Sn-1;Gn>=0;Gn--)_e<<=8,_e|=q[K?Gn:ye-1-Gn];if(ye<4){if(he){let Gn=1<<8*ye-1;_e=(_e^Gn)-Gn}}else if(ye>4){let Gn=!he||_e>=0?0:255;for(let zn=Sn;zn<ye;zn++)q[K?zn:ye-1-zn]!==Gn&&Pe(p,M("%d-byte integer does not fit into Lua Integer"),ye)}return _e},In=function(p,q,K,ye){X.lua_assert(q.length>=ye);let he=new DataView(new ArrayBuffer(ye));for(let _e=0;_e<ye;_e++)he.setUint8(_e,q[_e],K);return ye==4?he.getFloat32(0,K):he.getFloat64(0,K)},$n=M("^$*+?.([%-");class ht{constructor(q){this.src=null,this.src_init=null,this.src_end=null,this.p=null,this.p_end=null,this.L=q,this.matchdepth=NaN,this.level=NaN,this.capture=[]}}const Fn=function(p,q){switch(p.p[q++]){case te:return q===p.p_end&&Pe(p.L,M("malformed pattern (ends with '%%')")),q+1;case 91:p.p[q]===94&&q++;do q===p.p_end&&Pe(p.L,M("malformed pattern (missing ']')")),p.p[q++]===te&&q<p.p_end&&q++;while(p.p[q]!==93);return q+1;default:return q}},Jn=function(p,q){switch(q){case 97:return vn(p);case 65:return!vn(p);case 99:return s(p);case 67:return!s(p);case 100:return i(p);case 68:return!i(p);case 103:return _(p);case 71:return!_(p);case 108:return c(p);case 76:return!c(p);case 112:return y(p);case 80:return!y(p);case 115:return ne(p);case 83:return!ne(p);case 117:return m(p);case 85:return!m(p);case 119:return O(p);case 87:return!O(p);case 120:return en(p);case 88:return!en(p);case 122:return p===0;case 90:return p!==0;default:return q===p}},Vn=function(p,q,K,ye){let he=!0;for(p.p[K+1]===94&&(he=!1,K++);++K<ye;)if(p.p[K]===te){if(K++,Jn(q,p.p[K]))return he}else if(p.p[K+1]===45&&K+2<ye){if(K+=2,p.p[K-2]<=q&&q<=p.p[K])return he}else if(p.p[K]===q)return he;return!he},ut=function(p,q,K,ye){if(q>=p.src_end)return!1;{let he=p.src[q];switch(p.p[K]){case 46:return!0;case te:return Jn(he,p.p[K+1]);case 91:return Vn(p,he,K,ye-1);default:return p.p[K]===he}}},lt=function(p,q,K){if(K>=p.p_end-1&&Pe(p.L,M("malformed pattern (missing arguments to '%%b'")),p.src[q]!==p.p[K])return null;{let ye=p.p[K],he=p.p[K+1],_e=1;for(;++q<p.src_end;)if(p.src[q]===he){if(--_e==0)return q+1}else p.src[q]===ye&&_e++}return null},Ct=function(p,q,K,ye){let he=0;for(;ut(p,q+he,K,ye);)he++;for(;he>=0;){let _e=le(p,q+he,ye+1);if(_e)return _e;he--}return null},pt=function(p,q,K,ye){for(;;){let he=le(p,q,ye+1);if(he!==null)return he;if(!ut(p,q,K,ye))return null;q++}},Dt=function(p,q,K,ye){let he,_e=p.level;return _e>=32&&Pe(p.L,M("too many captures")),p.capture[_e]=p.capture[_e]?p.capture[_e]:{},p.capture[_e].init=q,p.capture[_e].len=ye,p.level=_e+1,(he=le(p,q,K))===null&&p.level--,he},At=function(p,q,K){let ye,he=(function(_e){let Sn=_e.level;for(Sn--;Sn>=0;Sn--)if(_e.capture[Sn].len===-1)return Sn;return Pe(_e.L,M("invalid pattern capture"))})(p);return p.capture[he].len=q-p.capture[he].init,(ye=le(p,q,K))===null&&(p.capture[he].len=-1),ye},E=function(p,q,K){K=(function(he,_e){return(_e-=49)<0||_e>=he.level||he.capture[_e].len===-1?Pe(he.L,M("invalid capture index %%%d"),_e+1):_e})(p,K);let ye=p.capture[K].len;return p.src_end-q>=ye&&(function(he,_e,Sn,Gn,zn){return V(he.subarray(_e,_e+zn),Sn.subarray(Gn,Gn+zn))})(p.src,p.capture[K].init,p.src,q,ye)?q+ye:null},le=function(p,q,K){let ye=!1,he=!0;for(p.matchdepth--==0&&Pe(p.L,M("pattern too complex"));he||ye;)if(he=!1,K!==p.p_end)switch(ye?void 0:p.p[K]){case 40:q=p.p[K+1]===41?Dt(p,q,K+2,-2):Dt(p,q,K+1,-1);break;case 41:q=At(p,q,K+1);break;case 36:if(K+1!==p.p_end){ye=!0;break}q=p.src.length-q==0?q:null;break;case te:switch(p.p[K+1]){case 98:(q=lt(p,q,K+2))!==null&&(K+=4,he=!0);break;case 102:{K+=2,p.p[K]!==91&&Pe(p.L,M("missing '[' after '%%f' in pattern"));let _e=Fn(p,K),Sn=q===p.src_init?0:p.src[q-1];if(!Vn(p,Sn,K,_e-1)&&Vn(p,q===p.src_end?0:p.src[q],K,_e-1)){K=_e,he=!0;break}q=null;break}case 48:case 49:case 50:case 51:case 52:case 53:case 54:case 55:case 56:case 57:(q=E(p,q,p.p[K+1]))!==null&&(K+=2,he=!0);break;default:ye=!0}break;default:{ye=!1;let _e=Fn(p,K);if(ut(p,q,K,_e))switch(p.p[_e]){case 63:{let Sn;(Sn=le(p,q+1,_e+1))!==null?q=Sn:(K=_e+1,he=!0);break}case 43:q++;case 42:q=Ct(p,q,K,_e);break;case 45:q=pt(p,q,K,_e);break;default:q++,K=_e,he=!0}else{if(p.p[_e]===42||p.p[_e]===63||p.p[_e]===45){K=_e+1,he=!0;break}q=null}break}}return p.matchdepth++,q},cn=function(p,q,K,ye){if(q>=p.level)q===0?an(p.L,p.src.subarray(K,ye),ye-K):Pe(p.L,M("invalid capture index %%%d"),q+1);else{let he=p.capture[q].len;he===-1&&Pe(p.L,M("unfinished capture")),he===-2?ge(p.L,p.capture[q].init-p.src_init+1):an(p.L,p.src.subarray(p.capture[q].init),he)}},ln=function(p,q,K){let ye=p.level===0&&p.src.subarray(q)?1:p.level;He(p.L,ye,"too many captures");for(let he=0;he<ye;he++)cn(p,he,q,K);return ye},wn=function(p,q,K,ye,he,_e){p.L=q,p.matchdepth=200,p.src=K,p.src_init=0,p.src_end=ye,p.p=he,p.p_end=_e},un=function(p){p.level=0,X.lua_assert(p.matchdepth===200)},_n=function(p,q){let K=G(p,1),ye=G(p,2),he=K.length,_e=ye.length,Sn=Se(Un(p,3,1),he);if(Sn<1)Sn=1;else if(Sn>he+1)return sn(p),1;if(q&&(L(p,4)||(function(Gn,zn){for(let jn=0;jn<zn;jn++)if(J($n,Gn[jn])!==-1)return!1;return!0})(ye,_e))){let Gn=(function(zn,jn,k){var j=k>>>0,Ne=jn.length;if(Ne===0)return j;for(;(j=zn.indexOf(jn[0],j))!==-1;j++)if(V(zn.subarray(j,j+Ne),jn))return j;return-1})(K.subarray(Sn-1),ye,0);if(Gn>-1)return ge(p,Sn+Gn),ge(p,Sn+Gn+_e-1),2}else{let Gn=new ht(p),zn=Sn-1,jn=ye[0]===94;jn&&(ye=ye.subarray(1),_e--),wn(Gn,p,K,he,ye,_e);do{let k;if(un(Gn),(k=le(Gn,zn,0))!==null)return q?(ge(p,zn+1),ge(p,k),ln(Gn,null,0)+2):ln(Gn,zn,k)}while(zn++<Gn.src_end&&!jn)}return sn(p),1},We=function(p){let q=Ze(p,mn(3));q.ms.L=p;for(let K=q.src;K<=q.ms.src_end;K++){let ye;if(un(q.ms),(ye=le(q.ms,K,q.p))!==null&&ye!==q.lastmatch)return q.src=q.lastmatch=ye,ln(q.ms,K,ye)}return 0},xn=function(p,q,K,ye,he){let _e=p.L;switch(he){case F:{ze(_e,3);let Sn=ln(p,K,ye);se(_e,Sn,1);break}case ve:cn(p,0,K,ye),Ke(_e,3);break;default:return void(function(Sn,Gn,zn,jn){let k=Sn.L,j=pn(k,3),Ne=j.length;for(let kn=0;kn<Ne;kn++)j[kn]!==te?ee(Gn,j[kn]):i(j[++kn])?j[kn]===48?Ie(Gn,Sn.src.subarray(zn,jn),jn-zn):(cn(Sn,j[kn]-49,zn,jn),de(k,-1),C(k,-2),On(Gn)):(j[kn]!==te&&Pe(k,M("invalid use of '%c' in replacement string"),te),ee(Gn,j[kn]))})(p,q,K,ye)}L(_e,-1)?P(_e,-1)||Pe(_e,M("invalid replacement value (a %s)"),h(_e,-1)):(re(_e,1),an(_e,p.src.subarray(K,ye),ye-K)),On(q)},Ln={byte:function(p){let q=G(p,1),K=q.length,ye=Se(Un(p,2,1),K),he=Se(Un(p,3,ye),K);if(ye<1&&(ye=1),he>K&&(he=K),ye>he)return 0;if(he-ye>=Number.MAX_SAFE_INTEGER)return Pe(p,"string slice too long");let _e=he-ye+1;He(p,_e,"string slice too long");for(let Sn=0;Sn<_e;Sn++)ge(p,q[ye+Sn-1]);return _e},char:function(p){let q=qe(p),K=new Y,ye=Ue(p,K,q);for(let he=1;he<=q;he++){let _e=N(p,he);bn(p,_e>=0&&_e<=255,"value out of range"),ye[he-1]=_e}return o(K,q),1},dump:function(p){let q=new Y,K=L(p,2);return Ae(p,1,F),g(p,1),ie(p,q),nn(p,De,q,K)!==0?Pe(p,M("unable to dump given function")):(ot(q),1)},find:function(p){return _n(p,1)},format:function(p){let q=qe(p),K=1,ye=G(p,K),he=0,_e=new Y;for(ie(p,_e);he<ye.length;)if(ye[he]!==te)ee(_e,ye[he++]);else if(ye[++he]===te)ee(_e,ye[he++]);else{let Sn=[];switch(++K>q&&Je(p,K,M("no value")),he=Bn(p,ye,he,Sn),String.fromCharCode(ye[he++])){case"c":ee(_e,N(p,K));break;case"d":case"i":case"o":case"u":case"x":case"X":{let Gn=N(p,K);Kn(Sn,M(D,!0)),rn(_e,M(A(String.fromCharCode(...Sn),Gn)));break}case"a":case"A":Kn(Sn,M(D,!0)),rn(_e,Fe(p,Sn,me(p,K)));break;case"e":case"E":case"f":case"g":case"G":{let Gn=me(p,K);Kn(Sn,M(D,!0)),rn(_e,M(A(String.fromCharCode(...Sn),Gn)));break}case"q":gn(p,_e,K);break;case"s":{let Gn=de(p,K);Sn.length<=2||Sn[2]===0?On(_e):(bn(p,Gn.length===Ee(Gn),K,"string contains zeros"),J(Sn,46)<0&&Gn.length>=100?On(_e):(rn(_e,M(A(String.fromCharCode(...Sn),f(Gn)))),re(p,1)));break}default:return Pe(p,M("invalid option '%%%c' to 'format'"),ye[he-1])}}return ot(_e),1},gmatch:function(p){let q=G(p,1),K=G(p,2),ye=q.length,he=K.length;g(p,2);let _e=new class{constructor(){this.src=NaN,this.p=NaN,this.lastmatch=NaN,this.ms=new ht}};return Oe(p,_e),wn(_e.ms,p,q,ye,K,he),_e.src=0,_e.p=0,_e.lastmatch=null,be(p,We,3),1},gsub:function(p){let q=G(p,1),K=q.length,ye=G(p,2),he=ye.length,_e=null,Sn=dn(p,3),Gn=Un(p,4,K+1),zn=ye[0]===94,jn=0,k=new ht(p),j=new Y;for(bn(p,Sn===ce||Sn===$||Sn===F||Sn===ve,3,"string/function/table expected"),ie(p,j),zn&&(ye=ye.subarray(1),he--),wn(k,p,q,K,ye,he),q=0,ye=0;jn<Gn;){let Ne;if(un(k),(Ne=le(k,q,ye))!==null&&Ne!==_e)jn++,xn(k,j,q,Ne,Sn),q=_e=Ne;else{if(!(q<k.src_end))break;ee(j,k.src[q++])}if(zn)break}return Ie(j,k.src.subarray(q,k.src_end),k.src_end-q),ot(j),ge(p,jn),2},len:function(p){return ge(p,G(p,1).length),1},lower:function(p){let q=G(p,1),K=q.length,ye=new Uint8Array(K);for(let he=0;he<K;he++){let _e=q[he];m(_e)&&(_e|=32),ye[he]=_e}return oe(p,ye),1},match:function(p){return _n(p,0)},pack:function(p){let q=new Y,K=new pe(p),ye={s:G(p,1),off:0},he=1,_e=0;for(sn(p),ie(p,q);ye.off<ye.s.length;){let Sn=yn(K,_e,ye),Gn=Sn.opt,zn=Sn.size,jn=Sn.ntoalign;for(_e+=jn+zn;jn-- >0;)ee(q,0);switch(he++,Gn){case 0:{let k=N(p,he);if(zn<4){let j=1<<8*zn-1;bn(p,-j<=k&&k<j,he,"integer overflow")}Dn(q,k,K.islittle,zn,k<0);break}case 1:{let k=N(p,he);zn<4&&bn(p,k>>>0<1<<8*zn,he,"unsigned overflow"),Dn(q,k>>>0,K.islittle,zn,!1);break}case 2:{let k=Zn(q,zn),j=me(p,he),Ne=new DataView(k.buffer,k.byteOffset,k.byteLength);zn===4?Ne.setFloat32(0,j,K.islittle):Ne.setFloat64(0,j,K.islittle),Te(q,zn);break}case 3:{let k=G(p,he),j=k.length;for(bn(p,j<=zn,he,"string longer than given size"),Ie(q,k,j);j++<zn;)ee(q,0);break}case 4:{let k=G(p,he),j=k.length;bn(p,zn>=4||j<1<<8*zn,he,"string length does not fit in given size"),Dn(q,j,K.islittle,zn,0),Ie(q,k,j),_e+=j;break}case 5:{let k=G(p,he),j=k.length;bn(p,J(k,0)<0,he,"strings contains zeros"),Ie(q,k,j),ee(q,0),_e+=j+1;break}case 6:ee(q,0);case 7:case 8:he--}}return ot(q),1},packsize:function(p){let q=new pe(p),K={s:G(p,1),off:0},ye=0;for(;K.off<K.s.length;){let he=yn(q,ye,K),_e=he.opt,Sn=he.size,Gn=he.ntoalign;switch(bn(p,ye<=2147483647-(Sn+=Gn),1,"format result too large"),ye+=Sn,_e){case 4:case 5:Je(p,1,"variable-length format")}}return ge(p,ye),1},rep:function(p){let q=G(p,1),K=q.length,ye=N(p,2),he=Mn(p,3,""),_e=he.length;if(ye<=0)tn(p,"");else{if(K+_e<K||K+_e>2147483647/ye)return Pe(p,M("resulting string too large"));{let Sn=ye*K+(ye-1)*_e,Gn=new Y,zn=Ue(p,Gn,Sn),jn=0;for(;ye-- >1;)zn.set(q,jn),jn+=K,_e>0&&(zn.set(he,jn),jn+=_e);zn.set(q,jn),o(Gn,Sn)}}return 1},reverse:function(p){let q=G(p,1),K=q.length,ye=new Uint8Array(K);for(let he=0;he<K;he++)ye[he]=q[K-1-he];return oe(p,ye),1},sub:function(p){let q=G(p,1),K=q.length,ye=Se(N(p,2),K),he=Se(Un(p,3,-1),K);return ye<1&&(ye=1),he>K&&(he=K),ye<=he?oe(p,q.subarray(ye-1,ye-1+(he-ye+1))):tn(p,""),1},unpack:function(p){let q=new pe(p),K={s:G(p,1),off:0},ye=G(p,2),he=ye.length,_e=Se(Un(p,3,1),he)-1,Sn=0;for(bn(p,_e<=he&&_e>=0,3,"initial position out of string");K.off<K.s.length;){let Gn=yn(q,_e,K),zn=Gn.opt,jn=Gn.size,k=Gn.ntoalign;switch(_e+k+jn>he&&Je(p,2,M("data string too short")),_e+=k,He(p,2,"too many results"),Sn++,zn){case 0:case 1:{let j=Pn(p,ye.subarray(_e),q.islittle,jn,zn===0);ge(p,j);break}case 2:{let j=In(0,ye.subarray(_e),q.islittle,jn);ae(p,j);break}case 3:oe(p,ye.subarray(_e,_e+jn));break;case 4:{let j=Pn(p,ye.subarray(_e),q.islittle,jn,0);bn(p,_e+j+jn<=he,2,"data string too short"),oe(p,ye.subarray(_e+jn,_e+jn+j)),_e+=j;break}case 5:{let j=J(ye,0,_e);j===-1&&(j=ye.length-_e),oe(p,ye.subarray(_e,j)),_e=j+1;break}case 7:case 6:case 8:Sn--}_e+=jn}return ge(p,_e+1),Sn+1},upper:function(p){let q=G(p,1),K=q.length,ye=new Uint8Array(K);for(let he=0;he<K;he++){let _e=q[he];c(_e)&&(_e&=223),ye[he]=_e}return oe(p,ye),1}};a.exports.luaopen_string=function(p){return Nn(p,Ln),(function(q){$e(q,0,1),tn(q,""),ze(q,-2),T(q,-2),re(q,1),ze(q,-2),Ce(q,-2,M("__index",!0)),re(q,1)})(p),1}},function(a,B,d){const{lua_gettop:A,lua_pushcfunction:v,lua_pushfstring:D,lua_pushinteger:R,lua_pushnil:I,lua_pushstring:z,lua_pushvalue:S,lua_setfield:H,lua_tointeger:b}=d(2),{luaL_Buffer:F,luaL_addvalue:Q,luaL_argcheck:ce,luaL_buffinit:$,luaL_checkinteger:ve,luaL_checkstack:se,luaL_checkstring:$e,luaL_error:nn,luaL_newlib:Ke,luaL_optinteger:qe,luaL_pushresult:on}=d(7),{luastring_of:P,to_luastring:re}=d(5),be=function(C){return(192&C)===128},ge=function(C,Ce){return C>=0?C:0-C>Ce?0:Ce+C+1},Oe=[255,127,2047,65535],tn=function(C,Ce){let T=C[Ce],g=0;if(T<128)g=T;else{let L=0;for(;64&T;){let xe=C[Ce+ ++L];if((192&xe)!=128)return null;g=g<<6|63&xe,T<<=1}if(g|=(127&T)<<5*L,L>3||g>1114111||g<=Oe[L])return null;Ce+=L}return{code:g,pos:Ce+1}},an=re("%U"),sn=function(C,Ce){let T=ve(C,Ce);ce(C,0<=T&&T<=1114111,Ce,"value out of range"),D(C,an,T)},ae=function(C){let Ce=$e(C,1),T=Ce.length,g=b(C,2)-1;if(g<0)g=0;else if(g<T)for(g++;be(Ce[g]);)g++;if(g>=T)return 0;{let L=tn(Ce,g);return L===null||be(Ce[L.pos])?nn(C,re("invalid UTF-8 code")):(R(C,g+1),R(C,L.code),2)}},oe={char:function(C){let Ce=A(C);if(Ce===1)sn(C,1);else{let T=new F;$(C,T);for(let g=1;g<=Ce;g++)sn(C,g),Q(T);on(T)}return 1},codepoint:function(C){let Ce=$e(C,1),T=ge(qe(C,2,1),Ce.length),g=ge(qe(C,3,T),Ce.length);if(ce(C,T>=1,2,"out of range"),ce(C,g<=Ce.length,3,"out of range"),T>g)return 0;if(g-T>=Number.MAX_SAFE_INTEGER)return nn(C,"string slice too long");let L=g-T+1;for(se(C,L,"string slice too long"),L=0,T-=1;T<g;){let xe=tn(Ce,T);if(xe===null)return nn(C,"invalid UTF-8 code");R(C,xe.code),T=xe.pos,L++}return L},codes:function(C){return $e(C,1),v(C,ae),S(C,1),R(C,0),3},len:function(C){let Ce=0,T=$e(C,1),g=T.length,L=ge(qe(C,2,1),g),xe=ge(qe(C,3,-1),g);for(ce(C,1<=L&&--L<=g,2,"initial position out of string"),ce(C,--xe<g,3,"final position out of string");L<=xe;){let we=tn(T,L);if(we===null)return I(C),R(C,L+1),2;L=we.pos,Ce++}return R(C,Ce),1},offset:function(C){let Ce=$e(C,1),T=ve(C,2),g=T>=0?1:Ce.length+1;if(g=ge(qe(C,3,g),Ce.length),ce(C,1<=g&&--g<=Ce.length,3,"position out of range"),T===0)for(;g>0&&be(Ce[g]);)g--;else if(be(Ce[g])&&nn(C,"initial position is a continuation byte"),T<0)for(;T<0&&g>0;){do g--;while(g>0&&be(Ce[g]));T++}else for(T--;T>0&&g<Ce.length;){do g++;while(be(Ce[g]));T--}return T===0?R(C,g+1):I(C),1}},ze=P(91,0,45,127,194,45,244,93,91,128,45,191,93,42);a.exports.luaopen_utf8=function(C){return Ke(C,oe),z(C,ze),H(C,-2,re("charpattern",!0)),1}},function(a,B,d){const{LUA_OPLT:A,LUA_TNUMBER:v,lua_compare:D,lua_gettop:R,lua_isinteger:I,lua_isnoneornil:z,lua_pushboolean:S,lua_pushinteger:H,lua_pushliteral:b,lua_pushnil:F,lua_pushnumber:Q,lua_pushvalue:ce,lua_setfield:$,lua_settop:ve,lua_tointeger:se,lua_tointegerx:$e,lua_type:nn}=d(2),{luaL_argcheck:Ke,luaL_argerror:qe,luaL_checkany:on,luaL_checkinteger:P,luaL_checknumber:re,luaL_error:be,luaL_newlib:ge,luaL_optnumber:Oe}=d(7),{LUA_MAXINTEGER:tn,LUA_MININTEGER:an,lua_numbertointeger:sn}=d(3),{to_luastring:ae}=d(5);let oe;const ze=function(){return oe=1103515245*oe+12345&2147483647},C=function(T,g){let L=sn(g);L!==!1?H(T,L):Q(T,g)},Ce={abs:function(T){if(I(T,1)){let g=se(T,1);g<0&&(g=0|-g),H(T,g)}else Q(T,Math.abs(re(T,1)));return 1},acos:function(T){return Q(T,Math.acos(re(T,1))),1},asin:function(T){return Q(T,Math.asin(re(T,1))),1},atan:function(T){let g=re(T,1),L=Oe(T,2,1);return Q(T,Math.atan2(g,L)),1},ceil:function(T){return I(T,1)?ve(T,1):C(T,Math.ceil(re(T,1))),1},cos:function(T){return Q(T,Math.cos(re(T,1))),1},deg:function(T){return Q(T,re(T,1)*(180/Math.PI)),1},exp:function(T){return Q(T,Math.exp(re(T,1))),1},floor:function(T){return I(T,1)?ve(T,1):C(T,Math.floor(re(T,1))),1},fmod:function(T){if(I(T,1)&&I(T,2)){let g=se(T,2);g===0?qe(T,2,"zero"):H(T,se(T,1)%g|0)}else{let g=re(T,1),L=re(T,2);Q(T,g%L)}return 1},log:function(T){let g,L=re(T,1);if(z(T,2))g=Math.log(L);else{let xe=re(T,2);g=xe===2?Math.log2(L):xe===10?Math.log10(L):Math.log(L)/Math.log(xe)}return Q(T,g),1},max:function(T){let g=R(T),L=1;Ke(T,g>=1,1,"value expected");for(let xe=2;xe<=g;xe++)D(T,L,xe,A)&&(L=xe);return ce(T,L),1},min:function(T){let g=R(T),L=1;Ke(T,g>=1,1,"value expected");for(let xe=2;xe<=g;xe++)D(T,xe,L,A)&&(L=xe);return ce(T,L),1},modf:function(T){if(I(T,1))ve(T,1),Q(T,0);else{let g=re(T,1),L=g<0?Math.ceil(g):Math.floor(g);C(T,L),Q(T,g===L?0:g-L)}return 2},rad:function(T){return Q(T,re(T,1)*(Math.PI/180)),1},random:function(T){let g,L,xe=oe===void 0?Math.random():ze()/2147483648;switch(R(T)){case 0:return Q(T,xe),1;case 1:g=1,L=P(T,1);break;case 2:g=P(T,1),L=P(T,2);break;default:return be(T,"wrong number of arguments")}return Ke(T,g<=L,1,"interval is empty"),Ke(T,g>=0||L<=tn+g,1,"interval too large"),xe*=L-g+1,H(T,Math.floor(xe)+g),1},randomseed:function(T){return(function(g){(oe=0|g)==0&&(oe=1)})(re(T,1)),ze(),0},sin:function(T){return Q(T,Math.sin(re(T,1))),1},sqrt:function(T){return Q(T,Math.sqrt(re(T,1))),1},tan:function(T){return Q(T,Math.tan(re(T,1))),1},tointeger:function(T){let g=$e(T,1);return g!==!1?H(T,g):(on(T,1),F(T)),1},type:function(T){return nn(T,1)===v?I(T,1)?b(T,"integer"):b(T,"float"):(on(T,1),F(T)),1},ult:function(T){let g=P(T,1),L=P(T,2);return S(T,g>=0?L<0||g<L:L<0&&g<L),1}};a.exports.luaopen_math=function(T){return ge(T,Ce),Q(T,Math.PI),$(T,-2,ae("pi",!0)),Q(T,1/0),$(T,-2,ae("huge",!0)),H(T,tn),$(T,-2,ae("maxinteger",!0)),H(T,an),$(T,-2,ae("mininteger",!0)),1}},function(a,B,d){const{LUA_MASKCALL:A,LUA_MASKCOUNT:v,LUA_MASKLINE:D,LUA_MASKRET:R,LUA_REGISTRYINDEX:I,LUA_TFUNCTION:z,LUA_TNIL:S,LUA_TTABLE:H,LUA_TUSERDATA:b,lua_Debug:F,lua_call:Q,lua_checkstack:ce,lua_gethook:$,lua_gethookcount:ve,lua_gethookmask:se,lua_getinfo:$e,lua_getlocal:nn,lua_getmetatable:Ke,lua_getstack:qe,lua_getupvalue:on,lua_getuservalue:P,lua_insert:re,lua_iscfunction:be,lua_isfunction:ge,lua_isnoneornil:Oe,lua_isthread:tn,lua_newtable:an,lua_pcall:sn,lua_pop:ae,lua_pushboolean:oe,lua_pushfstring:ze,lua_pushinteger:C,lua_pushlightuserdata:Ce,lua_pushliteral:T,lua_pushnil:g,lua_pushstring:L,lua_pushvalue:xe,lua_rawgetp:we,lua_rawsetp:pn,lua_rotate:Ze,lua_setfield:dn,lua_sethook:mn,lua_setlocal:Y,lua_setmetatable:ee,lua_settop:Ie,lua_setupvalue:Te,lua_setuservalue:rn,lua_tojsstring:On,lua_toproxy:bn,lua_tostring:Je,lua_tothread:ie,lua_touserdata:Ue,lua_type:N,lua_upvalueid:me,lua_upvaluejoin:He,lua_xmove:G}=d(2),{luaL_argcheck:Ae,luaL_argerror:Pe,luaL_checkany:Nn,luaL_checkinteger:Un,luaL_checkstring:Mn,luaL_checktype:Zn,luaL_error:ot,luaL_loadbuffer:o,luaL_newlib:de,luaL_optinteger:h,luaL_optstring:X,luaL_traceback:V,lua_writestringerror:J}=d(7),f=d(17),{luastring_indexOf:M,to_luastring:te}=d(5),Ee=function(y,ne,en){y===ne||ce(ne,en)||ot(y,te("stack overflow",!0))},Se=function(y){return tn(y,1)?{arg:1,thread:ie(y,1)}:{arg:0,thread:y}},De=function(y,ne,en){L(y,en),dn(y,-2,ne)},Xe=function(y,ne,en){C(y,en),dn(y,-2,ne)},Fe=function(y,ne,en){oe(y,en),dn(y,-2,ne)},Ve=function(y,ne,en){y==ne?Ze(y,-2,1):G(ne,y,1),dn(y,-2,en)},vn=function(y,ne){let en=Un(y,2);Zn(y,1,z);let gn=ne?on(y,1,en):Te(y,1,en);return gn===null?0:(L(y,gn),re(y,-(ne+1)),ne+1)},i=function(y,ne,en){let gn=Un(y,en);return Zn(y,ne,z),Ae(y,on(y,ne,gn)!==null,en,"invalid upvalue index"),gn},s=te("__hooks__",!0),_=["call","return","line","count","tail call"].map(y=>te(y)),c=function(y,ne){we(y,I,s);let en=Ue(y,-1).get(y);en&&(en(y),L(y,_[ne.event]),ne.currentline>=0?C(y,ne.currentline):g(y),f.lua_assert($e(y,te("lS"),ne)),Q(y,2,0))},m={gethook:function(y){let ne=Se(y).thread,en=new Uint8Array(5),gn=se(ne),Bn=$(ne);return Bn===null?g(y):Bn!==c?T(y,"external hook"):(we(y,I,s),Ue(y,-1).get(ne)(y)),L(y,(function(Kn,pe){let fn=0;return Kn&A&&(pe[fn++]=99),Kn&R&&(pe[fn++]=114),Kn&D&&(pe[fn++]=108),pe.subarray(0,fn)})(gn,en)),C(y,ve(ne)),3},getinfo:function(y){let ne=new F,en=Se(y),gn=en.arg,Bn=en.thread,Kn=X(y,gn+2,"flnStu");if(Ee(y,Bn,3),ge(y,gn+1))Kn=ze(y,te(">%s"),Kn),xe(y,gn+1),G(y,Bn,1);else if(!qe(Bn,Un(y,gn+1),ne))return g(y),1;return $e(Bn,Kn,ne)||Pe(y,gn+2,"invalid option"),an(y),M(Kn,83)>-1&&(De(y,te("source",!0),ne.source),De(y,te("short_src",!0),ne.short_src),Xe(y,te("linedefined",!0),ne.linedefined),Xe(y,te("lastlinedefined",!0),ne.lastlinedefined),De(y,te("what",!0),ne.what)),M(Kn,108)>-1&&Xe(y,te("currentline",!0),ne.currentline),M(Kn,117)>-1&&(Xe(y,te("nups",!0),ne.nups),Xe(y,te("nparams",!0),ne.nparams),Fe(y,te("isvararg",!0),ne.isvararg)),M(Kn,110)>-1&&(De(y,te("name",!0),ne.name),De(y,te("namewhat",!0),ne.namewhat)),M(Kn,116)>-1&&Fe(y,te("istailcall",!0),ne.istailcall),M(Kn,76)>-1&&Ve(y,Bn,te("activelines",!0)),M(Kn,102)>-1&&Ve(y,Bn,te("func",!0)),1},getlocal:function(y){let ne=Se(y),en=ne.thread,gn=ne.arg,Bn=new F,Kn=Un(y,gn+2);if(ge(y,gn+1))return xe(y,gn+1),L(y,nn(y,null,Kn)),1;{let pe=Un(y,gn+1);if(!qe(en,pe,Bn))return Pe(y,gn+1,"level out of range");Ee(y,en,1);let fn=nn(en,Bn,Kn);return fn?(G(en,y,1),L(y,fn),Ze(y,-2,1),2):(g(y),1)}},getmetatable:function(y){return Nn(y,1),Ke(y,1)||g(y),1},getregistry:function(y){return xe(y,I),1},getupvalue:function(y){return vn(y,1)},getuservalue:function(y){return N(y,1)!==b?g(y):P(y,1),1},sethook:function(y){let ne,en,gn,Bn,Kn=Se(y),pe=Kn.thread,fn=Kn.arg;if(Oe(y,fn+1))Ie(y,fn+1),gn=null,ne=0,en=0;else{const Me=Mn(y,fn+2);Zn(y,fn+1,z),en=h(y,fn+3,0),gn=c,ne=(function(fe,yn){let Dn=0;return M(fe,99)>-1&&(Dn|=A),M(fe,114)>-1&&(Dn|=R),M(fe,108)>-1&&(Dn|=D),yn>0&&(Dn|=v),Dn})(Me,en)}we(y,I,s)===S?(Bn=new WeakMap,Ce(y,Bn),pn(y,I,s)):Bn=Ue(y,-1);let U=bn(y,fn+1);return Bn.set(pe,U),mn(pe,gn,ne,en),0},setlocal:function(y){let ne=Se(y),en=ne.thread,gn=ne.arg,Bn=new F,Kn=Un(y,gn+1),pe=Un(y,gn+2);if(!qe(en,Kn,Bn))return Pe(y,gn+1,"level out of range");Nn(y,gn+3),Ie(y,gn+3),Ee(y,en,1),G(y,en,1);let fn=Y(en,Bn,pe);return fn===null&&ae(en,1),L(y,fn),1},setmetatable:function(y){const ne=N(y,2);return Ae(y,ne==S||ne==H,2,"nil or table expected"),Ie(y,2),ee(y,1),1},setupvalue:function(y){return Nn(y,3),vn(y,0)},setuservalue:function(y){return Zn(y,1,b),Nn(y,2),Ie(y,2),rn(y,1),1},traceback:function(y){let ne=Se(y),en=ne.thread,gn=ne.arg,Bn=Je(y,gn+1);if(Bn!==null||Oe(y,gn+1)){let Kn=h(y,gn+2,y===en?1:0);V(y,en,Bn,Kn)}else xe(y,gn+1);return 1},upvalueid:function(y){let ne=i(y,1,2);return Ce(y,me(y,1,ne)),1},upvaluejoin:function(y){let ne=i(y,1,2),en=i(y,3,4);return Ae(y,!be(y,1),1,"Lua function expected"),Ae(y,!be(y,3),3,"Lua function expected"),He(y,1,ne,3,en),0}};let O;typeof window<"u"&&(O=function(){let y=prompt("lua_debug>","");return y!==null?y:""}),O&&(m.debug=function(y){for(;;){let ne=O();if(ne==="cont")return 0;if(ne.length===0)continue;let en=te(ne);(o(y,en,en.length,te("=(debug command)",!0))||sn(y,0,0,0))&&J(On(y,-1),`
`),Ie(y,0)}}),a.exports.luaopen_debug=function(y){return de(y,m),1}},function(a,B,d){const{LUA_DIRSEP:A,LUA_EXEC_DIR:v,LUA_JSPATH_DEFAULT:D,LUA_PATH_DEFAULT:R,LUA_PATH_MARK:I,LUA_PATH_SEP:z}=d(3),{LUA_OK:S,LUA_REGISTRYINDEX:H,LUA_TNIL:b,LUA_TTABLE:F,lua_callk:Q,lua_createtable:ce,lua_getfield:$,lua_insert:ve,lua_isfunction:se,lua_isnil:$e,lua_isstring:nn,lua_newtable:Ke,lua_pop:qe,lua_pushboolean:on,lua_pushcclosure:P,lua_pushcfunction:re,lua_pushfstring:be,lua_pushglobaltable:ge,lua_pushlightuserdata:Oe,lua_pushliteral:tn,lua_pushlstring:an,lua_pushnil:sn,lua_pushstring:ae,lua_pushvalue:oe,lua_rawgeti:ze,lua_rawgetp:C,lua_rawseti:Ce,lua_rawsetp:T,lua_remove:g,lua_setfield:L,lua_setmetatable:xe,lua_settop:we,lua_toboolean:pn,lua_tostring:Ze,lua_touserdata:dn,lua_upvalueindex:mn}=d(2),{LUA_LOADED_TABLE:Y,LUA_PRELOAD_TABLE:ee,luaL_Buffer:Ie,luaL_addvalue:Te,luaL_buffinit:rn,luaL_checkstring:On,luaL_error:bn,luaL_getsubtable:Je,luaL_gsub:ie,luaL_len:Ue,luaL_loadfile:N,luaL_newlib:me,luaL_optstring:He,luaL_pushresult:G,luaL_setfuncs:Ae}=d(7),Pe=d(17),{luastring_indexOf:Nn,to_jsstring:Un,to_luastring:Mn,to_uristring:Zn}=d(5),ot=d(0),o=typeof window<"u"?window:typeof WorkerGlobalScope<"u"&&self instanceof WorkerGlobalScope?self:(0,eval)("this"),de=Mn("__JSLIBS__"),h=A,X=A,V=Mn("luaopen_"),J=Mn("_"),f=Mn("");let M;M=function(pe,fn,U){fn=Zn(fn);let Me=new XMLHttpRequest;if(Me.open("GET",fn,!1),Me.send(),Me.status<200||Me.status>=300)return ae(pe,Mn(`${Me.status}: ${Me.statusText}`)),null;let fe,yn=Me.response;/\/\/[#@] sourceURL=/.test(yn)||(yn+=" //# sourceURL="+fn);try{fe=Function("fengari",yn)}catch(Pn){return ae(pe,Mn(`${Pn.name}: ${Pn.message}`)),null}let Dn=fe(ot);return typeof Dn=="function"||typeof Dn=="object"&&Dn!==null?Dn:Dn===void 0?o:(ae(pe,Mn(`library returned unexpected type (${typeof Dn})`)),null)};let te;te=function(pe){pe=Zn(pe);let fn=new XMLHttpRequest;return fn.open("GET",pe,!1),fn.send(),fn.status>=200&&fn.status<=299};const Ee=function(pe,fn,U){let Me=Xe(pe,fn);if(Me===null){if((Me=M(pe,fn,U[0]===42))===null)return 1;Fe(pe,fn,Me)}if(U[0]===42)return on(pe,1),0;{let fe=(function(yn,Dn,Pn){let In=Dn[Un(Pn)];return In&&typeof In=="function"?In:(be(yn,Mn("undefined symbol: %s"),Pn),null)})(pe,Me,U);return fe===null?2:(re(pe,fe),0)}},Se=o,De=function(pe,fn,U,Me){let fe=`${U}${Pe.LUA_VERSUFFIX}`;ae(pe,Mn(fe));let yn=Se[fe];yn===void 0&&(yn=Se[U]),yn===void 0||(function(Dn){$(Dn,H,Mn("LUA_NOENV"));let Pn=pn(Dn,-1);return qe(Dn,1),Pn})(pe)?ae(pe,Me):(yn=ie(pe,Mn(yn),Mn(z+z,!0),Mn(z+Un(f)+z,!0)),ie(pe,yn,f,Me),g(pe,-2)),L(pe,-3,fn),qe(pe,1)},Xe=function(pe,fn){C(pe,H,de),$(pe,-1,fn);let U=dn(pe,-1);return qe(pe,2),U},Fe=function(pe,fn,U){C(pe,H,de),Oe(pe,U),oe(pe,-1),L(pe,-3,fn),Ce(pe,-2,Ue(pe,-2)+1),qe(pe,1)},Ve=function(pe,fn){for(;fn[0]===z.charCodeAt(0);)fn=fn.subarray(1);if(fn.length===0)return null;let U=Nn(fn,z.charCodeAt(0));return U<0&&(U=fn.length),an(pe,fn,U),fn.subarray(U)},vn=function(pe,fn,U,Me,fe){let yn=new Ie;for(rn(pe,yn),Me[0]!==0&&(fn=ie(pe,fn,Me,fe));(U=Ve(pe,U))!==null;){let Dn=ie(pe,Ze(pe,-1),Mn(I,!0),fn);if(g(pe,-2),te(Dn))return Dn;be(pe,Mn(`
	no file '%s'`),Dn),g(pe,-2),Te(yn)}return G(yn),null},i=function(pe,fn,U,Me){$(pe,mn(1),U);let fe=Ze(pe,-1);return fe===null&&bn(pe,Mn("'package.%s' must be a string"),U),vn(pe,fn,fe,Mn("."),Me)},s=function(pe,fn,U){return fn?(ae(pe,U),2):bn(pe,Mn(`error loading module '%s' from file '%s':
	%s`),Ze(pe,1),U,Ze(pe,-1))},_=function(pe){let fn=On(pe,1),U=i(pe,fn,Mn("path",!0),Mn(X,!0));return U===null?1:s(pe,N(pe,U)===S,U)},c=function(pe,fn,U){let Me;U=ie(pe,U,Mn("."),J);let fe=Nn(U,45);if(fe>=0){Me=an(pe,U,fe),Me=be(pe,Mn("%s%s"),V,Me);let yn=Ee(pe,fn,Me);if(yn!==2)return yn;U=fe+1}return Me=be(pe,Mn("%s%s"),V,U),Ee(pe,fn,Me)},m=function(pe){let fn=On(pe,1),U=i(pe,fn,Mn("jspath",!0),Mn(h,!0));return U===null?1:s(pe,c(pe,U,fn)===0,U)},O=function(pe){let fn,U=On(pe,1),Me=Nn(U,46);if(Me<0)return 0;an(pe,U,Me);let fe=i(pe,Ze(pe,-1),Mn("jspath",!0),Mn(h,!0));return fe===null?1:(fn=c(pe,fe,U))!==0?fn!=2?s(pe,0,fe):(ae(pe,Mn(`
	no module '%s' in file '%s'`),U,fe),1):(ae(pe,fe),2)},y=function(pe){let fn=On(pe,1);return $(pe,H,ee),$(pe,-1,fn)===b&&be(pe,Mn(`
	no field package.preload['%s']`),fn),1},ne=function(pe,fn,U){for(;fn===S?(ze(pe,3,U.i)===b&&(qe(pe,1),G(U.msg),bn(pe,Mn("module '%s' not found:%s"),U.name,Ze(pe,-1))),ae(pe,U.name),Q(pe,1,2,U,ne)):fn=S,!se(pe,-2);U.i++)nn(pe,-2)?(qe(pe,1),Te(U.msg)):qe(pe,2);return U.k(pe,S,U.ctx)},en=function(pe,fn,U){return ae(pe,U),ve(pe,-2),Q(pe,2,1,U,gn),gn(pe,S,U)},gn=function(pe,fn,U){let Me=U;return $e(pe,-1)||L(pe,2,Me),$(pe,2,Me)==b&&(on(pe,1),oe(pe,-1),L(pe,2,Me)),1},Bn={loadlib:function(pe){let fn=On(pe,1),U=On(pe,2),Me=Ee(pe,fn,U);return Me===0?1:(sn(pe),ve(pe,-2),tn(pe,Me===1?"open":"init"),3)},searchpath:function(pe){return vn(pe,On(pe,1),On(pe,2),He(pe,3,"."),He(pe,4,A))!==null?1:(sn(pe),ve(pe,-2),2)}},Kn={require:function(pe){let fn=On(pe,1);return we(pe,1),$(pe,H,Y),$(pe,2,fn),pn(pe,-1)?1:(qe(pe,1),(function(U,Me,fe,yn){let Dn=new Ie;return rn(U,Dn),$(U,mn(1),Mn("searchers",!0))!==F&&bn(U,Mn("'package.searchers' must be a table")),ne(U,S,{name:Me,i:1,msg:Dn,ctx:fe,k:yn})})(pe,fn,fn,en))}};a.exports.luaopen_package=function(pe){return(function(fn){Ke(fn),ce(fn,0,1),xe(fn,-2),T(fn,H,de)})(pe),me(pe,Bn),(function(fn){let U=[y,_,m,O,null];ce(fn);for(let Me=0;U[Me];Me++)oe(fn,-2),P(fn,U[Me],1),Ce(fn,-2,Me+1);L(fn,-2,Mn("searchers",!0))})(pe),De(pe,Mn("path",!0),"LUA_PATH",R),De(pe,Mn("jspath",!0),"LUA_JSPATH",D),tn(pe,A+`
`+z+`
`+I+`
`+v+`
-
`),L(pe,-2,Mn("config",!0)),Je(pe,H,Y),L(pe,-2,Mn("loaded",!0)),Je(pe,H,ee),L(pe,-2,Mn("preload",!0)),ge(pe),oe(pe,-2),Ae(pe,Kn,1),qe(pe,1),1}},function(a,B,d){const{lua_pushinteger:A,lua_pushliteral:v,lua_setfield:D}=d(2),{luaL_newlib:R}=d(7),{FENGARI_AUTHORS:I,FENGARI_COPYRIGHT:z,FENGARI_RELEASE:S,FENGARI_VERSION:H,FENGARI_VERSION_MAJOR:b,FENGARI_VERSION_MINOR:F,FENGARI_VERSION_NUM:Q,FENGARI_VERSION_RELEASE:ce,to_luastring:$}=d(5);a.exports.luaopen_fengari=function(ve){return R(ve,{}),v(ve,I),D(ve,-2,$("AUTHORS")),v(ve,z),D(ve,-2,$("COPYRIGHT")),v(ve,S),D(ve,-2,$("RELEASE")),v(ve,H),D(ve,-2,$("VERSION")),v(ve,b),D(ve,-2,$("VERSION_MAJOR")),v(ve,F),D(ve,-2,$("VERSION_MINOR")),A(ve,Q),D(ve,-2,$("VERSION_NUM")),v(ve,ce),D(ve,-2,$("VERSION_RELEASE")),1}},function(a,B,d){d.r(B),d.d(B,"L",function(){return an}),d.d(B,"load",function(){return sn});var A=d(0);d.d(B,"FENGARI_AUTHORS",function(){return A.FENGARI_AUTHORS}),d.d(B,"FENGARI_COPYRIGHT",function(){return A.FENGARI_COPYRIGHT}),d.d(B,"FENGARI_RELEASE",function(){return A.FENGARI_RELEASE}),d.d(B,"FENGARI_VERSION",function(){return A.FENGARI_VERSION}),d.d(B,"FENGARI_VERSION_MAJOR",function(){return A.FENGARI_VERSION_MAJOR}),d.d(B,"FENGARI_VERSION_MINOR",function(){return A.FENGARI_VERSION_MINOR}),d.d(B,"FENGARI_VERSION_NUM",function(){return A.FENGARI_VERSION_NUM}),d.d(B,"FENGARI_VERSION_RELEASE",function(){return A.FENGARI_VERSION_RELEASE}),d.d(B,"luastring_eq",function(){return A.luastring_eq}),d.d(B,"luastring_indexOf",function(){return A.luastring_indexOf}),d.d(B,"luastring_of",function(){return A.luastring_of}),d.d(B,"to_jsstring",function(){return A.to_jsstring}),d.d(B,"to_luastring",function(){return A.to_luastring}),d.d(B,"to_uristring",function(){return A.to_uristring}),d.d(B,"lua",function(){return A.lua}),d.d(B,"lauxlib",function(){return A.lauxlib}),d.d(B,"lualib",function(){return A.lualib});var v=d(21);d.d(B,"interop",function(){return v});const{LUA_ERRRUN:D,LUA_ERRSYNTAX:R,LUA_OK:I,LUA_VERSION_MAJOR:z,LUA_VERSION_MINOR:S,lua_Debug:H,lua_getinfo:b,lua_getstack:F,lua_gettop:Q,lua_insert:ce,lua_pcall:$,lua_pop:ve,lua_pushcfunction:se,lua_pushstring:$e,lua_remove:nn,lua_setglobal:Ke,lua_tojsstring:qe}=A.lua,{luaL_loadbuffer:on,luaL_newstate:P,luaL_requiref:re}=A.lauxlib,{checkjs:be,luaopen_js:ge,push:Oe,tojs:tn}=v,an=P();function sn(ae,oe){if(typeof ae=="string")ae=Object(A.to_luastring)(ae);else if(!(ae instanceof Uint8Array))throw new TypeError("expects an array of bytes or javascript string");oe=oe?Object(A.to_luastring)(oe):null;let ze,C=on(an,ae,null,oe);if(ze=C===R?new SyntaxError(qe(an,-1)):tn(an,-1),ve(an,1),C!==I)throw ze;return ze}if(A.lualib.luaL_openlibs(an),re(an,Object(A.to_luastring)("js"),ge,1),ve(an,1),$e(an,Object(A.to_luastring)(A.FENGARI_COPYRIGHT)),Ke(an,Object(A.to_luastring)("_COPYRIGHT")),typeof document<"u"&&document instanceof HTMLDocument){const ae=function(we){switch(we){case"anonymous":return"omit";case"use-credentials":return"include";default:return"same-origin"}},oe=function(we){let pn=new H;return F(we,2,pn)&&b(we,Object(A.to_luastring)("Sl"),pn),Oe(we,new ErrorEvent("error",{bubbles:!0,cancelable:!0,message:qe(we,1),error:tn(we,1),filename:pn.short_src?Object(A.to_jsstring)(pn.short_src):void 0,lineno:pn.currentline>0?pn.currentline:void 0})),1},ze=function(we,pn,Ze){let dn,mn=on(an,pn,null,Ze);if(mn===R){let Y=qe(an,-1),ee=we.src?we.src:document.location,Ie,Te=new SyntaxError(Y,ee,Ie);dn=new ErrorEvent("error",{message:Y,error:Te,filename:ee,lineno:Ie})}else if(mn===I){let Y=Q(an);se(an,oe),ce(an,Y),Object.defineProperty(document,"currentScript",{value:we,configurable:!0}),mn=$(an,0,0,Y),delete document.currentScript,nn(an,Y),mn===D&&(dn=be(an,-1))}mn!==I&&(dn===void 0&&(dn=new ErrorEvent("error",{message:qe(an,-1),error:tn(an,-1)})),ve(an,1),window.dispatchEvent(dn)&&console.error("uncaught exception",dn.error))},C=function(we,pn,Ze){if(we.status>=200&&we.status<300){let dn=we.response;dn=typeof dn=="string"?Object(A.to_luastring)(we.response):new Uint8Array(dn),ze(pn,dn,Ze)}else pn.dispatchEvent(new Event("error"))},Ce=function(we){if(we.src){let pn=Object(A.to_luastring)("@"+we.src);if(document.readyState==="complete"||we.async)if(typeof fetch=="function")fetch(we.src,{method:"GET",credentials:ae(we.crossorigin),redirect:"follow",integrity:we.integrity}).then(function(Ze){if(Ze.ok)return Ze.arrayBuffer();throw new Error("unable to fetch")}).then(function(Ze){let dn=new Uint8Array(Ze);ze(we,dn,pn)}).catch(function(Ze){we.dispatchEvent(new Event("error"))});else{let Ze=new XMLHttpRequest;Ze.open("GET",we.src,!0),Ze.responseType="arraybuffer",Ze.onreadystatechange=function(){Ze.readyState===4&&C(Ze,we,pn)},Ze.send()}else{let Ze=new XMLHttpRequest;Ze.open("GET",we.src,!1),Ze.send(),C(Ze,we,pn)}}else{let pn=Object(A.to_luastring)(we.innerHTML),Ze=we.id?Object(A.to_luastring)("="+we.id):pn;ze(we,pn,Ze)}},T=/^(.*?\/.*?)([\t ]*;.*)?$/,g=/^(\d+)\.(\d+)$/,L=function(we){if(we.tagName!=="SCRIPT")return;let pn=T.exec(we.type);if(!pn)return;let Ze=pn[1];if(Ze==="application/lua"||Ze==="text/lua"){if(we.hasAttribute("lua-version")){let dn=g.exec(we.getAttribute("lua-version"));if(!dn||dn[1]!==z||dn[2]!==S)return}Ce(we)}};typeof MutationObserver<"u"?new MutationObserver(function(we,pn){for(let Ze=0;Ze<we.length;Ze++){let dn=we[Ze];for(let mn=0;mn<dn.addedNodes.length;mn++)L(dn.addedNodes[mn])}}).observe(document,{childList:!0,subtree:!0}):console.warn&&console.warn("fengari-web: MutationObserver not found; lua script tags will not be run when inserted"),Array.prototype.forEach.call(document.querySelectorAll('script[type^="application/lua"], script[type^="text/lua"]'),L)}},function(a,B,d){const{LUA_MULTRET:A,LUA_OPADD:v,LUA_OPBAND:D,LUA_OPBNOT:R,LUA_OPBOR:I,LUA_OPBXOR:z,LUA_OPDIV:S,LUA_OPIDIV:H,LUA_OPMOD:b,LUA_OPSHL:F,LUA_OPSHR:Q,LUA_OPUNM:ce,constant_types:{LUA_TBOOLEAN:$,LUA_TLIGHTUSERDATA:ve,LUA_TLNGSTR:se,LUA_TNIL:$e,LUA_TNUMFLT:nn,LUA_TNUMINT:Ke,LUA_TTABLE:qe},to_luastring:on}=d(1),{lua_assert:P}=d(4),re=d(20),be=d(6),ge=d(16),Oe=d(23),tn=d(9),an=d(15),sn=ge.OpCodesI,ae=be.TValue,oe={OPR_ADD:0,OPR_SUB:1,OPR_MUL:2,OPR_MOD:3,OPR_POW:4,OPR_DIV:5,OPR_IDIV:6,OPR_BAND:7,OPR_BOR:8,OPR_BXOR:9,OPR_SHL:10,OPR_SHR:11,OPR_CONCAT:12,OPR_EQ:13,OPR_LT:14,OPR_LE:15,OPR_NE:16,OPR_GT:17,OPR_GE:18,OPR_AND:19,OPR_OR:20,OPR_NOBINOPR:21},ze={OPR_MINUS:0,OPR_BNOT:1,OPR_NOT:2,OPR_LEN:3,OPR_NOUNOPR:4},C=function(c){return c.t!==c.f},Ce=function(c,m){let O=Oe.expkind;if(C(c))return!1;switch(c.k){case O.VKINT:return!m||new ae(Ke,c.u.ival);case O.VKFLT:return!m||new ae(nn,c.u.nval);default:return!1}},T=function(c,m,O){let y,ne=m+O-1;if(c.pc>c.lasttarget&&(y=c.f.code[c.pc-1]).opcode===sn.OP_LOADNIL){let en=y.A,gn=en+y.B;if(en<=m&&m<=gn+1||m<=en&&en<=ne+1)return en<m&&(m=en),gn>ne&&(ne=gn),ge.SETARG_A(y,m),void ge.SETARG_B(y,ne-m)}Je(c,sn.OP_LOADNIL,m,O-1,0)},g=function(c,m){return c.f.code[m.u.info]},L=function(c,m){let O=c.f.code[m].sBx;return O===-1?-1:m+1+O},xe=function(c,m,O){let y=c.f.code[m],ne=O-(m+1);P(O!==-1),Math.abs(ne)>ge.MAXARG_sBx&&re.luaX_syntaxerror(c.ls,on("control structure too long",!0)),ge.SETARG_sBx(y,ne)},we=function(c,m,O){if(O===-1)return m;if(m===-1)m=O;else{let y=m,ne=L(c,y);for(;ne!==-1;)ne=L(c,y=ne);xe(c,y,O)}return m},pn=function(c){let m=c.jpc;c.jpc=-1;let O=Ue(c,sn.OP_JMP,0,-1);return O=we(c,O,m)},Ze=function(c,m,O,y,ne){return Je(c,m,O,y,ne),pn(c)},dn=function(c){return c.lasttarget=c.pc,c.pc},mn=function(c,m){return m>=1&&ge.testTMode(c.f.code[m-1].opcode)?m-1:m},Y=function(c,m){return c.f.code[mn(c,m)]},ee=function(c,m,O){let y=mn(c,m),ne=c.f.code[y];return ne.opcode===sn.OP_TESTSET&&(O!==ge.NO_REG&&O!==ne.B?ge.SETARG_A(ne,O):c.f.code[y]=ge.CREATE_ABC(sn.OP_TEST,ne.B,0,ne.C),!0)},Ie=function(c,m){for(;m!==-1;m=L(c,m))ee(c,m,ge.NO_REG)},Te=function(c,m,O,y,ne){for(;m!==-1;){let en=L(c,m);ee(c,m,y)?xe(c,m,O):xe(c,m,ne),m=en}},rn=function(c,m){dn(c),c.jpc=we(c,c.jpc,m)},On=function(c,m,O){O===c.pc?rn(c,m):(P(O<c.pc),Te(c,m,O,ge.NO_REG,O))},bn=function(c,m){let O=c.f;return(function(y){Te(y,y.jpc,y.pc,ge.NO_REG,y.pc),y.jpc=-1})(c),O.code[c.pc]=m,O.lineinfo[c.pc]=c.ls.lastline,c.pc++},Je=function(c,m,O,y,ne){return P(ge.getOpMode(m)===ge.iABC),P(ge.getBMode(m)!==ge.OpArgN||y===0),P(ge.getCMode(m)!==ge.OpArgN||ne===0),P(O<=ge.MAXARG_A&&y<=ge.MAXARG_B&&ne<=ge.MAXARG_C),bn(c,ge.CREATE_ABC(m,O,y,ne))},ie=function(c,m,O,y){return P(ge.getOpMode(m)===ge.iABx||ge.getOpMode(m)===ge.iAsBx),P(ge.getCMode(m)===ge.OpArgN),P(O<=ge.MAXARG_A&&y<=ge.MAXARG_Bx),bn(c,ge.CREATE_ABx(m,O,y))},Ue=function(c,m,O,y){return ie(c,m,O,y+ge.MAXARG_sBx)},N=function(c,m){return P(m<=ge.MAXARG_Ax),bn(c,ge.CREATE_Ax(sn.OP_EXTRAARG,m))},me=function(c,m,O){if(O<=ge.MAXARG_Bx)return ie(c,sn.OP_LOADK,m,O);{let y=ie(c,sn.OP_LOADKX,m,0);return N(c,O),y}},He=function(c,m){let O=c.freereg+m;O>c.f.maxstacksize&&(O>=255&&re.luaX_syntaxerror(c.ls,on("function or expression needs too many registers",!0)),c.f.maxstacksize=O)},G=function(c,m){He(c,m),c.freereg+=m},Ae=function(c,m){!ge.ISK(m)&&m>=c.nactvar&&(c.freereg--,P(m===c.freereg))},Pe=function(c,m){m.k===Oe.expkind.VNONRELOC&&Ae(c,m.u.info)},Nn=function(c,m,O){let y=m.k===Oe.expkind.VNONRELOC?m.u.info:-1,ne=O.k===Oe.expkind.VNONRELOC?O.u.info:-1;y>ne?(Ae(c,y),Ae(c,ne)):(Ae(c,ne),Ae(c,y))},Un=function(c,m,O){let y=c.f,ne=tn.luaH_get(c.L,c.ls.h,m);if(ne.ttisinteger()){let gn=ne.value;if(gn<c.nk&&y.k[gn].ttype()===O.ttype()&&y.k[gn].value===O.value)return gn}let en=c.nk;return tn.luaH_setfrom(c.L,c.ls.h,m,new be.TValue(Ke,en)),y.k[en]=O,c.nk++,en},Mn=function(c,m){let O=new ae(ve,m),y=new ae(Ke,m);return Un(c,O,y)},Zn=function(c,m){let O=new ae(nn,m);return Un(c,O,O)},ot=function(c,m){let O=new ae($,m);return Un(c,O,O)},o=function(c,m,O){let y=Oe.expkind;if(m.k===y.VCALL)ge.SETARG_C(g(c,m),O+1);else if(m.k===y.VVARARG){let ne=g(c,m);ge.SETARG_B(ne,O+1),ge.SETARG_A(ne,c.freereg),G(c,1)}else P(O===A)},de=function(c,m){let O=Oe.expkind;m.k===O.VCALL?(P(g(c,m).C===2),m.k=O.VNONRELOC,m.u.info=g(c,m).A):m.k===O.VVARARG&&(ge.SETARG_B(g(c,m),2),m.k=O.VRELOCABLE)},h=function(c,m){let O=Oe.expkind;switch(m.k){case O.VLOCAL:m.k=O.VNONRELOC;break;case O.VUPVAL:m.u.info=Je(c,sn.OP_GETUPVAL,0,m.u.info,0),m.k=O.VRELOCABLE;break;case O.VINDEXED:{let y;Ae(c,m.u.ind.idx),m.u.ind.vt===O.VLOCAL?(Ae(c,m.u.ind.t),y=sn.OP_GETTABLE):(P(m.u.ind.vt===O.VUPVAL),y=sn.OP_GETTABUP),m.u.info=Je(c,y,0,m.u.ind.t,m.u.ind.idx),m.k=O.VRELOCABLE;break}case O.VVARARG:case O.VCALL:de(c,m)}},X=function(c,m,O,y){return dn(c),Je(c,sn.OP_LOADBOOL,m,O,y)},V=function(c,m,O){let y=Oe.expkind;switch(h(c,m),m.k){case y.VNIL:T(c,O,1);break;case y.VFALSE:case y.VTRUE:Je(c,sn.OP_LOADBOOL,O,m.k===y.VTRUE,0);break;case y.VK:me(c,O,m.u.info);break;case y.VKFLT:me(c,O,Zn(c,m.u.nval));break;case y.VKINT:me(c,O,Mn(c,m.u.ival));break;case y.VRELOCABLE:{let ne=g(c,m);ge.SETARG_A(ne,O);break}case y.VNONRELOC:O!==m.u.info&&Je(c,sn.OP_MOVE,O,m.u.info,0);break;default:return void P(m.k===y.VJMP)}m.u.info=O,m.k=y.VNONRELOC},J=function(c,m){m.k!==Oe.expkind.VNONRELOC&&(G(c,1),V(c,m,c.freereg-1))},f=function(c,m){for(;m!==-1;m=L(c,m))if(Y(c,m).opcode!==sn.OP_TESTSET)return!0;return!1},M=function(c,m,O){let y=Oe.expkind;if(V(c,m,O),m.k===y.VJMP&&(m.t=we(c,m.t,m.u.info)),C(m)){let ne,en=-1,gn=-1;if(f(c,m.t)||f(c,m.f)){let Bn=m.k===y.VJMP?-1:pn(c);en=X(c,O,0,1),gn=X(c,O,1,0),rn(c,Bn)}ne=dn(c),Te(c,m.f,ne,O,en),Te(c,m.t,ne,O,gn)}m.f=m.t=-1,m.u.info=O,m.k=y.VNONRELOC},te=function(c,m){h(c,m),Pe(c,m),G(c,1),M(c,m,c.freereg-1)},Ee=function(c,m){if(h(c,m),m.k===Oe.expkind.VNONRELOC){if(!C(m))return m.u.info;if(m.u.info>=c.nactvar)return M(c,m,m.u.info),m.u.info}return te(c,m),m.u.info},Se=function(c,m){C(m)?Ee(c,m):h(c,m)},De=function(c,m){let O=Oe.expkind,y=!1;switch(Se(c,m),m.k){case O.VTRUE:m.u.info=ot(c,!0),y=!0;break;case O.VFALSE:m.u.info=ot(c,!1),y=!0;break;case O.VNIL:m.u.info=(function(ne){let en=new ae($e,null),gn=new ae(qe,ne.ls.h);return Un(ne,gn,en)})(c),y=!0;break;case O.VKINT:m.u.info=Mn(c,m.u.ival),y=!0;break;case O.VKFLT:m.u.info=Zn(c,m.u.nval),y=!0;break;case O.VK:y=!0}return y&&(m.k=O.VK,m.u.info<=ge.MAXINDEXRK)?ge.RKASK(m.u.info):Ee(c,m)},Xe=function(c,m){let O=Y(c,m.u.info);P(ge.testTMode(O.opcode)&&O.opcode!==sn.OP_TESTSET&&O.opcode!==sn.OP_TEST),ge.SETARG_A(O,!O.A)},Fe=function(c,m,O){if(m.k===Oe.expkind.VRELOCABLE){let y=g(c,m);if(y.opcode===sn.OP_NOT)return c.pc--,Ze(c,sn.OP_TEST,y.B,0,!O)}return J(c,m),Pe(c,m),Ze(c,sn.OP_TESTSET,ge.NO_REG,m.u.info,O)},Ve=function(c,m){let O,y=Oe.expkind;switch(h(c,m),m.k){case y.VJMP:Xe(c,m),O=m.u.info;break;case y.VK:case y.VKFLT:case y.VKINT:case y.VTRUE:O=-1;break;default:O=Fe(c,m,0)}m.f=we(c,m.f,O),rn(c,m.t),m.t=-1},vn=function(c,m){let O,y=Oe.expkind;switch(h(c,m),m.k){case y.VJMP:O=m.u.info;break;case y.VNIL:case y.VFALSE:O=-1;break;default:O=Fe(c,m,1)}m.t=we(c,m.t,O),rn(c,m.f),m.f=-1},i=function(c,m,O){let y,ne,en=Oe.expkind;if(!(y=Ce(m,!0))||!(ne=Ce(O,!0))||!(function(Bn,Kn,pe){switch(Bn){case D:case I:case z:case F:case Q:case R:return an.tointeger(Kn)!==!1&&an.tointeger(pe)!==!1;case S:case H:case b:return pe.value!==0;default:return 1}})(c,y,ne))return 0;let gn=new ae;if(be.luaO_arith(null,c,y,ne,gn),gn.ttisinteger())m.k=en.VKINT,m.u.ival=gn.value;else{let Bn=gn.value;if(isNaN(Bn)||Bn===0)return!1;m.k=en.VKFLT,m.u.nval=Bn}return!0},s=function(c,m,O,y,ne){let en=De(c,y),gn=De(c,O);Nn(c,O,y),O.u.info=Je(c,m,0,gn,en),O.k=Oe.expkind.VRELOCABLE,_(c,ne)},_=function(c,m){c.f.lineinfo[c.pc-1]=m};a.exports.BinOpr=oe,a.exports.NO_JUMP=-1,a.exports.UnOpr=ze,a.exports.getinstruction=g,a.exports.luaK_checkstack=He,a.exports.luaK_code=bn,a.exports.luaK_codeABC=Je,a.exports.luaK_codeABx=ie,a.exports.luaK_codeAsBx=Ue,a.exports.luaK_codek=me,a.exports.luaK_concat=we,a.exports.luaK_dischargevars=h,a.exports.luaK_exp2RK=De,a.exports.luaK_exp2anyreg=Ee,a.exports.luaK_exp2anyregup=function(c,m){(m.k!==Oe.expkind.VUPVAL||C(m))&&Ee(c,m)},a.exports.luaK_exp2nextreg=te,a.exports.luaK_exp2val=Se,a.exports.luaK_fixline=_,a.exports.luaK_getlabel=dn,a.exports.luaK_goiffalse=vn,a.exports.luaK_goiftrue=Ve,a.exports.luaK_indexed=function(c,m,O){let y=Oe.expkind;P(!C(m)&&(Oe.vkisinreg(m.k)||m.k===y.VUPVAL)),m.u.ind.t=m.u.info,m.u.ind.idx=De(c,O),m.u.ind.vt=m.k===y.VUPVAL?y.VUPVAL:y.VLOCAL,m.k=y.VINDEXED},a.exports.luaK_infix=function(c,m,O){switch(m){case oe.OPR_AND:Ve(c,O);break;case oe.OPR_OR:vn(c,O);break;case oe.OPR_CONCAT:te(c,O);break;case oe.OPR_ADD:case oe.OPR_SUB:case oe.OPR_MUL:case oe.OPR_DIV:case oe.OPR_IDIV:case oe.OPR_MOD:case oe.OPR_POW:case oe.OPR_BAND:case oe.OPR_BOR:case oe.OPR_BXOR:case oe.OPR_SHL:case oe.OPR_SHR:Ce(O,!1)||De(c,O);break;default:De(c,O)}},a.exports.luaK_intK=Mn,a.exports.luaK_jump=pn,a.exports.luaK_jumpto=function(c,m){return On(c,pn(c),m)},a.exports.luaK_nil=T,a.exports.luaK_numberK=Zn,a.exports.luaK_patchclose=function(c,m,O){for(O++;m!==-1;m=L(c,m)){let y=c.f.code[m];P(y.opcode===sn.OP_JMP&&(y.A===0||y.A>=O)),ge.SETARG_A(y,O)}},a.exports.luaK_patchlist=On,a.exports.luaK_patchtohere=rn,a.exports.luaK_posfix=function(c,m,O,y,ne){let en=Oe.expkind;switch(m){case oe.OPR_AND:P(O.t===-1),h(c,y),y.f=we(c,y.f,O.f),O.to(y);break;case oe.OPR_OR:P(O.f===-1),h(c,y),y.t=we(c,y.t,O.t),O.to(y);break;case oe.OPR_CONCAT:{Se(c,y);let gn=g(c,y);y.k===en.VRELOCABLE&&gn.opcode===sn.OP_CONCAT?(P(O.u.info===gn.B-1),Pe(c,O),ge.SETARG_B(gn,O.u.info),O.k=en.VRELOCABLE,O.u.info=y.u.info):(te(c,y),s(c,sn.OP_CONCAT,O,y,ne));break}case oe.OPR_ADD:case oe.OPR_SUB:case oe.OPR_MUL:case oe.OPR_DIV:case oe.OPR_IDIV:case oe.OPR_MOD:case oe.OPR_POW:case oe.OPR_BAND:case oe.OPR_BOR:case oe.OPR_BXOR:case oe.OPR_SHL:case oe.OPR_SHR:i(m+v,O,y)||s(c,m+sn.OP_ADD,O,y,ne);break;case oe.OPR_EQ:case oe.OPR_LT:case oe.OPR_LE:case oe.OPR_NE:case oe.OPR_GT:case oe.OPR_GE:(function(gn,Bn,Kn,pe){let fn,U=Oe.expkind;Kn.k===U.VK?fn=ge.RKASK(Kn.u.info):(P(Kn.k===U.VNONRELOC),fn=Kn.u.info);let Me=De(gn,pe);switch(Nn(gn,Kn,pe),Bn){case oe.OPR_NE:Kn.u.info=Ze(gn,sn.OP_EQ,0,fn,Me);break;case oe.OPR_GT:case oe.OPR_GE:{let fe=Bn-oe.OPR_NE+sn.OP_EQ;Kn.u.info=Ze(gn,fe,1,Me,fn);break}default:{let fe=Bn-oe.OPR_EQ+sn.OP_EQ;Kn.u.info=Ze(gn,fe,1,fn,Me);break}}Kn.k=U.VJMP})(c,m,O,y)}return O},a.exports.luaK_prefix=function(c,m,O,y){let ne=new Oe.expdesc;switch(ne.k=Oe.expkind.VKINT,ne.u.ival=ne.u.nval=ne.u.info=0,ne.t=-1,ne.f=-1,m){case ze.OPR_MINUS:case ze.OPR_BNOT:if(i(m+ce,O,ne))break;case ze.OPR_LEN:(function(en,gn,Bn,Kn){let pe=Ee(en,Bn);Pe(en,Bn),Bn.u.info=Je(en,gn,0,pe,0),Bn.k=Oe.expkind.VRELOCABLE,_(en,Kn)})(c,m+sn.OP_UNM,O,y);break;case ze.OPR_NOT:(function(en,gn){let Bn=Oe.expkind;switch(h(en,gn),gn.k){case Bn.VNIL:case Bn.VFALSE:gn.k=Bn.VTRUE;break;case Bn.VK:case Bn.VKFLT:case Bn.VKINT:case Bn.VTRUE:gn.k=Bn.VFALSE;break;case Bn.VJMP:Xe(en,gn);break;case Bn.VRELOCABLE:case Bn.VNONRELOC:J(en,gn),Pe(en,gn),gn.u.info=Je(en,sn.OP_NOT,0,gn.u.info,0),gn.k=Bn.VRELOCABLE}{let Kn=gn.f;gn.f=gn.t,gn.t=Kn}Ie(en,gn.f),Ie(en,gn.t)})(c,O)}},a.exports.luaK_reserveregs=G,a.exports.luaK_ret=function(c,m,O){Je(c,sn.OP_RETURN,m,O+1,0)},a.exports.luaK_self=function(c,m,O){Ee(c,m);let y=m.u.info;Pe(c,m),m.u.info=c.freereg,m.k=Oe.expkind.VNONRELOC,G(c,2),Je(c,sn.OP_SELF,m.u.info,y,De(c,O)),Pe(c,O)},a.exports.luaK_setlist=function(c,m,O,y){let ne=(O-1)/ge.LFIELDS_PER_FLUSH+1,en=y===A?0:y;P(y!==0&&y<=ge.LFIELDS_PER_FLUSH),ne<=ge.MAXARG_C?Je(c,sn.OP_SETLIST,m,en,ne):ne<=ge.MAXARG_Ax?(Je(c,sn.OP_SETLIST,m,en,0),N(c,ne)):re.luaX_syntaxerror(c.ls,on("constructor too long",!0)),c.freereg=m+1},a.exports.luaK_setmultret=function(c,m){o(c,m,A)},a.exports.luaK_setoneret=de,a.exports.luaK_setreturns=o,a.exports.luaK_storevar=function(c,m,O){let y=Oe.expkind;switch(m.k){case y.VLOCAL:return Pe(c,O),void M(c,O,m.u.info);case y.VUPVAL:{let ne=Ee(c,O);Je(c,sn.OP_SETUPVAL,ne,m.u.info,0);break}case y.VINDEXED:{let ne=m.u.ind.vt===y.VLOCAL?sn.OP_SETTABLE:sn.OP_SETTABUP,en=De(c,O);Je(c,ne,m.u.ind.t,m.u.ind.idx,en);break}}Pe(c,O)},a.exports.luaK_stringK=function(c,m){let O=new ae(se,m);return Un(c,O,O)}},function(a,B,d){const{LUA_SIGNATURE:A,constant_types:{LUA_TBOOLEAN:v,LUA_TLNGSTR:D,LUA_TNIL:R,LUA_TNUMFLT:I,LUA_TNUMINT:z,LUA_TSHRSTR:S},thread_status:{LUA_ERRSYNTAX:H},is_luastring:b,luastring_eq:F,to_luastring:Q}=d(1),ce=d(8),$=d(13),ve=d(6),{MAXARG_sBx:se,POS_A:$e,POS_Ax:nn,POS_B:Ke,POS_Bx:qe,POS_C:on,POS_OP:P,SIZE_A:re,SIZE_Ax:be,SIZE_B:ge,SIZE_Bx:Oe,SIZE_C:tn,SIZE_OP:an}=d(16),{lua_assert:sn}=d(4),{luaS_bless:ae}=d(10),{luaZ_read:oe,ZIO:ze}=d(19);let C=[25,147,13,10,26,10];class Ce{constructor(g,L,xe){this.intSize=4,this.size_tSize=4,this.instructionSize=4,this.integerSize=4,this.numberSize=8,sn(L instanceof ze,"BytecodeParser only operates on a ZIO"),sn(b(xe)),xe[0]===64||xe[0]===61?this.name=xe.subarray(1):xe[0]==A[0]?this.name=Q("binary string",!0):this.name=xe,this.L=g,this.Z=L,this.arraybuffer=new ArrayBuffer(Math.max(this.intSize,this.size_tSize,this.instructionSize,this.integerSize,this.numberSize)),this.dv=new DataView(this.arraybuffer),this.u8=new Uint8Array(this.arraybuffer)}read(g){let L=new Uint8Array(g);return oe(this.Z,L,0,g)!==0&&this.error("truncated"),L}LoadByte(){return oe(this.Z,this.u8,0,1)!==0&&this.error("truncated"),this.u8[0]}LoadInt(){return oe(this.Z,this.u8,0,this.intSize)!==0&&this.error("truncated"),this.dv.getInt32(0,!0)}LoadNumber(){return oe(this.Z,this.u8,0,this.numberSize)!==0&&this.error("truncated"),this.dv.getFloat64(0,!0)}LoadInteger(){return oe(this.Z,this.u8,0,this.integerSize)!==0&&this.error("truncated"),this.dv.getInt32(0,!0)}LoadSize_t(){return this.LoadInteger()}LoadString(){let g=this.LoadByte();return g===255&&(g=this.LoadSize_t()),g===0?null:ae(this.L,this.read(g-1))}static MASK1(g,L){return~(-1<<g)<<L}LoadCode(g){let L=this.LoadInt(),xe=Ce;for(let we=0;we<L;we++){oe(this.Z,this.u8,0,this.instructionSize)!==0&&this.error("truncated");let pn=this.dv.getUint32(0,!0);g.code[we]={code:pn,opcode:pn>>P&xe.MASK1(an,0),A:pn>>$e&xe.MASK1(re,0),B:pn>>Ke&xe.MASK1(ge,0),C:pn>>on&xe.MASK1(tn,0),Bx:pn>>qe&xe.MASK1(Oe,0),Ax:pn>>nn&xe.MASK1(be,0),sBx:(pn>>qe&xe.MASK1(Oe,0))-se}}}LoadConstants(g){let L=this.LoadInt();for(let xe=0;xe<L;xe++){let we=this.LoadByte();switch(we){case R:g.k.push(new ve.TValue(R,null));break;case v:g.k.push(new ve.TValue(v,this.LoadByte()!==0));break;case I:g.k.push(new ve.TValue(I,this.LoadNumber()));break;case z:g.k.push(new ve.TValue(z,this.LoadInteger()));break;case S:case D:g.k.push(new ve.TValue(D,this.LoadString()));break;default:this.error(`unrecognized constant '${we}'`)}}}LoadProtos(g){let L=this.LoadInt();for(let xe=0;xe<L;xe++)g.p[xe]=new $.Proto(this.L),this.LoadFunction(g.p[xe],g.source)}LoadUpvalues(g){let L=this.LoadInt();for(let xe=0;xe<L;xe++)g.upvalues[xe]={name:null,instack:this.LoadByte(),idx:this.LoadByte()}}LoadDebug(g){let L=this.LoadInt();for(let xe=0;xe<L;xe++)g.lineinfo[xe]=this.LoadInt();L=this.LoadInt();for(let xe=0;xe<L;xe++)g.locvars[xe]={varname:this.LoadString(),startpc:this.LoadInt(),endpc:this.LoadInt()};L=this.LoadInt();for(let xe=0;xe<L;xe++)g.upvalues[xe].name=this.LoadString()}LoadFunction(g,L){g.source=this.LoadString(),g.source===null&&(g.source=L),g.linedefined=this.LoadInt(),g.lastlinedefined=this.LoadInt(),g.numparams=this.LoadByte(),g.is_vararg=this.LoadByte()!==0,g.maxstacksize=this.LoadByte(),this.LoadCode(g),this.LoadConstants(g),this.LoadUpvalues(g),this.LoadProtos(g),this.LoadDebug(g)}checkliteral(g,L){let xe=this.read(g.length);F(xe,g)||this.error(L)}checkHeader(){this.checkliteral(A.subarray(1),"not a"),this.LoadByte()!==83&&this.error("version mismatch in"),this.LoadByte()!==0&&this.error("format mismatch in"),this.checkliteral(C,"corrupted"),this.intSize=this.LoadByte(),this.size_tSize=this.LoadByte(),this.instructionSize=this.LoadByte(),this.integerSize=this.LoadByte(),this.numberSize=this.LoadByte(),this.checksize(this.intSize,4,"int"),this.checksize(this.size_tSize,4,"size_t"),this.checksize(this.instructionSize,4,"instruction"),this.checksize(this.integerSize,4,"integer"),this.checksize(this.numberSize,8,"number"),this.LoadInteger()!==22136&&this.error("endianness mismatch in"),this.LoadNumber()!==370.5&&this.error("float format mismatch in")}error(g){ve.luaO_pushfstring(this.L,Q("%s: %s precompiled chunk"),this.name,Q(g)),ce.luaD_throw(this.L,H)}checksize(g,L,xe){g!==L&&this.error(`${xe} size mismatch in`)}}a.exports.luaU_undump=function(T,g,L){let xe=new Ce(T,g,L);xe.checkHeader();let we=$.luaF_newLclosure(T,xe.LoadByte());return ce.luaD_inctop(T),T.stack[T.top-1].setclLvalue(we),we.p=new $.Proto(T),xe.LoadFunction(we.p,null),sn(we.nupvalues===we.p.upvalues.length),we}},function(a,B,d){const{LUA_SIGNATURE:A,LUA_VERSION_MAJOR:v,LUA_VERSION_MINOR:D,constant_types:{LUA_TBOOLEAN:R,LUA_TLNGSTR:I,LUA_TNIL:z,LUA_TNUMFLT:S,LUA_TNUMINT:H,LUA_TSHRSTR:b},luastring_of:F}=d(1),Q=F(25,147,13,10,26,10),ce=16*Number(v)+Number(D),$=function(on,P,re){re.status===0&&P>0&&(re.status=re.writer(re.L,on,P,re.data))},ve=function(on,P){$(F(on),1,P)},se=function(on,P){let re=new ArrayBuffer(4);new DataView(re).setInt32(0,on,!0);let be=new Uint8Array(re);$(be,4,P)},$e=function(on,P){let re=new ArrayBuffer(4);new DataView(re).setInt32(0,on,!0);let be=new Uint8Array(re);$(be,4,P)},nn=function(on,P){let re=new ArrayBuffer(8);new DataView(re).setFloat64(0,on,!0);let be=new Uint8Array(re);$(be,8,P)},Ke=function(on,P){if(on===null)ve(0,P);else{let re=on.tsslen()+1,be=on.getstr();re<255?ve(re,P):(ve(255,P),$e(re,P)),$(be,re-1,P)}},qe=function(on,P,re){re.strip||on.source===P?Ke(null,re):Ke(on.source,re),se(on.linedefined,re),se(on.lastlinedefined,re),ve(on.numparams,re),ve(on.is_vararg?1:0,re),ve(on.maxstacksize,re),(function(be,ge){let Oe=be.code.map(tn=>tn.code);se(Oe.length,ge);for(let tn=0;tn<Oe.length;tn++)se(Oe[tn],ge)})(on,re),(function(be,ge){let Oe=be.k.length;se(Oe,ge);for(let tn=0;tn<Oe;tn++){let an=be.k[tn];switch(ve(an.ttype(),ge),an.ttype()){case z:break;case R:ve(an.value?1:0,ge);break;case S:nn(an.value,ge);break;case H:$e(an.value,ge);break;case b:case I:Ke(an.tsvalue(),ge)}}})(on,re),(function(be,ge){let Oe=be.upvalues.length;se(Oe,ge);for(let tn=0;tn<Oe;tn++)ve(be.upvalues[tn].instack?1:0,ge),ve(be.upvalues[tn].idx,ge)})(on,re),(function(be,ge){let Oe=be.p.length;se(Oe,ge);for(let tn=0;tn<Oe;tn++)qe(be.p[tn],be.source,ge)})(on,re),(function(be,ge){let Oe=ge.strip?0:be.lineinfo.length;se(Oe,ge);for(let tn=0;tn<Oe;tn++)se(be.lineinfo[tn],ge);Oe=ge.strip?0:be.locvars.length,se(Oe,ge);for(let tn=0;tn<Oe;tn++)Ke(be.locvars[tn].varname,ge),se(be.locvars[tn].startpc,ge),se(be.locvars[tn].endpc,ge);Oe=ge.strip?0:be.upvalues.length,se(Oe,ge);for(let tn=0;tn<Oe;tn++)Ke(be.upvalues[tn].name,ge)})(on,re)};a.exports.luaU_dump=function(on,P,re,be,ge){let Oe=new class{constructor(){this.L=null,this.write=null,this.data=null,this.strip=NaN,this.status=NaN}};return Oe.L=on,Oe.writer=re,Oe.data=be,Oe.strip=ge,Oe.status=0,(function(tn){$(A,A.length,tn),ve(ce,tn),ve(0,tn),$(Q,Q.length,tn),ve(4,tn),ve(4,tn),ve(4,tn),ve(4,tn),ve(8,tn),$e(22136,tn),nn(370.5,tn)})(Oe),ve(P.upvalues.length,Oe),qe(P,null,Oe),Oe.status}},function(a,B,d){var A;(function(){var v={not_type:/[^T]/,not_primitive:/[^v]/,number:/[diefg]/,numeric_arg:/[bcdiefguxX]/,json:/[j]/,text:/^[^\x25]+/,modulo:/^\x25{2}/,placeholder:/^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-gijostTuvxX])/,key:/^([a-z_][a-z_\d]*)/i,key_access:/^\.([a-z_][a-z_\d]*)/i,index_access:/^\[(\d+)\]/,sign:/^[\+\-]/};function D(z){return(function(S,H){var b,F,Q,ce,$,ve,se,$e,nn,Ke=1,qe=S.length,on="";for(F=0;F<qe;F++)if(typeof S[F]=="string")on+=S[F];else if(Array.isArray(S[F])){if((ce=S[F])[2])for(b=H[Ke],Q=0;Q<ce[2].length;Q++){if(!b.hasOwnProperty(ce[2][Q]))throw new Error(D('[sprintf] property "%s" does not exist',ce[2][Q]));b=b[ce[2][Q]]}else b=ce[1]?H[ce[1]]:H[Ke++];if(v.not_type.test(ce[8])&&v.not_primitive.test(ce[8])&&b instanceof Function&&(b=b()),v.numeric_arg.test(ce[8])&&typeof b!="number"&&isNaN(b))throw new TypeError(D("[sprintf] expecting number but found %T",b));switch(v.number.test(ce[8])&&($e=b>=0),ce[8]){case"b":b=parseInt(b,10).toString(2);break;case"c":b=String.fromCharCode(parseInt(b,10));break;case"d":case"i":b=parseInt(b,10);break;case"j":b=JSON.stringify(b,null,ce[6]?parseInt(ce[6]):0);break;case"e":b=ce[7]?parseFloat(b).toExponential(ce[7]):parseFloat(b).toExponential();break;case"f":b=ce[7]?parseFloat(b).toFixed(ce[7]):parseFloat(b);break;case"g":b=ce[7]?String(Number(b.toPrecision(ce[7]))):parseFloat(b);break;case"o":b=(parseInt(b,10)>>>0).toString(8);break;case"s":b=String(b),b=ce[7]?b.substring(0,ce[7]):b;break;case"t":b=String(!!b),b=ce[7]?b.substring(0,ce[7]):b;break;case"T":b=Object.prototype.toString.call(b).slice(8,-1).toLowerCase(),b=ce[7]?b.substring(0,ce[7]):b;break;case"u":b=parseInt(b,10)>>>0;break;case"v":b=b.valueOf(),b=ce[7]?b.substring(0,ce[7]):b;break;case"x":b=(parseInt(b,10)>>>0).toString(16);break;case"X":b=(parseInt(b,10)>>>0).toString(16).toUpperCase()}v.json.test(ce[8])?on+=b:(!v.number.test(ce[8])||$e&&!ce[3]?nn="":(nn=$e?"+":"-",b=b.toString().replace(v.sign,"")),ve=ce[4]?ce[4]==="0"?"0":ce[4].charAt(1):" ",se=ce[6]-(nn+b).length,$=ce[6]&&se>0?ve.repeat(se):"",on+=ce[5]?nn+b+$:ve==="0"?nn+$+b:$+nn+b)}return on})((function(S){if(I[S])return I[S];for(var H,b=S,F=[],Q=0;b;){if((H=v.text.exec(b))!==null)F.push(H[0]);else if((H=v.modulo.exec(b))!==null)F.push("%");else{if((H=v.placeholder.exec(b))===null)throw new SyntaxError("[sprintf] unexpected placeholder");if(H[2]){Q|=1;var ce=[],$=H[2],ve=[];if((ve=v.key.exec($))===null)throw new SyntaxError("[sprintf] failed to parse named argument key");for(ce.push(ve[1]);($=$.substring(ve[0].length))!=="";)if((ve=v.key_access.exec($))!==null)ce.push(ve[1]);else{if((ve=v.index_access.exec($))===null)throw new SyntaxError("[sprintf] failed to parse named argument key");ce.push(ve[1])}H[2]=ce}else Q|=2;if(Q===3)throw new Error("[sprintf] mixing positional and named placeholders is not (yet) supported");F.push(H)}b=b.substring(H[0].length)}return I[S]=F})(z),arguments)}function R(z,S){return D.apply(null,[z].concat(S||[]))}var I=Object.create(null);B.sprintf=D,B.vsprintf=R,typeof window<"u"&&(window.sprintf=D,window.vsprintf=R,(A=(function(){return{sprintf:D,vsprintf:R}}).call(B,d,B,a))===void 0||(a.exports=A))})()},function(a,B,d){const{lua_pop:A}=d(2),{luaL_requiref:v}=d(7),{to_luastring:D}=d(5),R={};a.exports.luaL_openlibs=function($e){for(let nn in R)v($e,D(nn),R[nn],1),A($e,1)};const I=d(17),{luaopen_base:z}=d(24),{luaopen_coroutine:S}=d(25),{luaopen_debug:H}=d(31),{luaopen_math:b}=d(30),{luaopen_package:F}=d(32),{luaopen_os:Q}=d(27),{luaopen_string:ce}=d(28),{luaopen_table:$}=d(26),{luaopen_utf8:ve}=d(29);R._G=z,R[I.LUA_LOADLIBNAME]=F,R[I.LUA_COLIBNAME]=S,R[I.LUA_TABLIBNAME]=$,R[I.LUA_OSLIBNAME]=Q,R[I.LUA_STRLIBNAME]=ce,R[I.LUA_MATHLIBNAME]=b,R[I.LUA_UTF8LIBNAME]=ve,R[I.LUA_DBLIBNAME]=H;const{luaopen_fengari:se}=d(33);R[I.LUA_FENGARILIBNAME]=se}])),Yl}var Yc=T_();const $c=Jl(Yc),E_=Lf({__proto__:null,default:$c},[Yc]),mo=$c??E_,dt=mo.lua,$l=mo.lauxlib,S_=mo.lualib,Qc=mo,hi=Qc.to_luastring??(a=>a),Zl=Qc.to_jsstring??(a=>String(a));function Sc(a){try{const B=dt.lua_tostring(a,-1);return B!=null?Zl(B):"unknown error"}catch{return"unknown error"}}class L_{constructor(B,d=42,A=""){pc(this,"L");this.L=$l.luaL_newstate(),S_.luaL_openlibs(this.L),this.seedRandom(d);const v=A?A+`

`+B:B;if($l.luaL_dostring(this.L,hi(v))!==dt.LUA_OK){const R=Sc(this.L);throw dt.lua_pop(this.L,1),new ho(`Lua load error: ${R}`)}}call(B,...d){if(dt.lua_getglobal(this.L,hi(B)),dt.lua_type(this.L,-1)!==dt.LUA_TFUNCTION)throw dt.lua_pop(this.L,1),new ho(`Lua function not found: ${B}`);for(const D of d)this.pushValue(D);if(dt.lua_pcall(this.L,d.length,1,0)!==dt.LUA_OK){const D=Sc(this.L);throw dt.lua_pop(this.L,1),new ho(`Lua error in ${B}: ${D}`)}const v=this.pullValue(-1);return dt.lua_pop(this.L,1),v}seedRandom(B){$l.luaL_dostring(this.L,hi(`math.randomseed(${B})`))}pushValue(B){if(B==null)dt.lua_pushnil(this.L);else if(typeof B=="boolean")dt.lua_pushboolean(this.L,B?1:0);else if(typeof B=="number")dt.lua_pushnumber(this.L,B);else if(typeof B=="string")dt.lua_pushstring(this.L,hi(B));else if(Array.isArray(B))dt.lua_newtable(this.L),B.forEach((d,A)=>{dt.lua_pushnumber(this.L,A+1),this.pushValue(d),dt.lua_settable(this.L,-3)});else if(typeof B=="object"){dt.lua_newtable(this.L);for(const[d,A]of Object.entries(B))dt.lua_pushstring(this.L,hi(d)),this.pushValue(A),dt.lua_settable(this.L,-3)}else throw new ho(`Cannot push value of type ${typeof B} to Lua`)}pullValue(B){switch(dt.lua_type(this.L,B)){case dt.LUA_TNIL:return null;case dt.LUA_TBOOLEAN:return!!dt.lua_toboolean(this.L,B);case dt.LUA_TNUMBER:return dt.lua_tonumber(this.L,B);case dt.LUA_TSTRING:{const A=dt.lua_tostring(this.L,B);return A!=null?Zl(A):null}case dt.LUA_TTABLE:return this.pullTable(B);default:return null}}pullTable(B){const d=B<0?dt.lua_gettop(this.L)+B+1:B,A={};let v=!0,D=0;for(dt.lua_pushnil(this.L);dt.lua_next(this.L,d)!==0;){const R=dt.lua_type(this.L,-2);let I;if(R===dt.LUA_TNUMBER)I=dt.lua_tonumber(this.L,-2),!Number.isInteger(I)||I<1?v=!1:D=Math.max(D,I);else{const z=dt.lua_tostring(this.L,-2);I=z!=null?Zl(z):String(Math.random()),v=!1}A[I]=this.pullValue(-1),dt.lua_pop(this.L,1)}if(v&&D===Object.keys(A).length){const R=[];for(let I=1;I<=D;I++)R.push(A[I]);return R}return A}}function O_(a,B=42){const d=Wc(a),A=new L_(d.logic,B,d.engineSource);return{gameId:a,files:d,executor:A}}function X_(a,B,...d){return a.executor.call(B,...d)}function W_(a,B){const d=a.files.data[B];if(!d)throw new jp(`Schema not found: ${B}`);return d.fields??d}function R_({gameId:a}){const[B,d]=Ga.useState(null),[A,v]=Ga.useState(null),[D,R]=Ga.useState(null);Ga.useEffect(()=>{const S=Ac(a);if(S!=null&&S.embedUrl)return;if(S!=null&&S.externalUrl){window.open(S.externalUrl,"_blank","noopener,noreferrer"),Wl();return}let H=!1;return(async()=>{try{const b=await O_(a,42);if(!S){R(`Game "${a}" loaded successfully but has no registered config in registry.ts — this is a studio configuration error, not a player-facing one. Check that the game is added to GAME_REGISTRY.`);return}H||(d(b),v(S))}catch(b){H||R(b instanceof Error?b.message:`Failed to load game: ${a}`)}})(),()=>{H=!0}},[a]);const I=Ac(a);if(I!=null&&I.embedUrl)if(I.embedWidth&&I.embedHeight){const S=I.embedHeight/I.embedWidth*100;return tt.jsxs("div",{className:"arcade-game-wrap",children:[tt.jsx("div",{className:"arcade-game-lobby-bar",children:tt.jsx("button",{onClick:Wl,className:"arcade-back-to-lobby",children:"← Back to Arcade"})}),tt.jsxs("div",{className:"arcade-game-content",style:{position:"relative",width:"100%",maxWidth:`${I.embedWidth}px`,margin:"0 auto"},children:[tt.jsx("div",{style:{position:"relative",width:"100%",paddingTop:`${S}%`},children:tt.jsx("iframe",{src:I.embedUrl,allowFullScreen:!0,style:{position:"absolute",top:0,left:0,width:"100%",height:"100%",border:0},title:`${I.label} — playable embed`})}),I.externalUrl&&tt.jsx("a",{href:I.externalUrl,target:"_blank",rel:"noopener noreferrer",style:{display:"block",textAlign:"center",marginTop:"8px",fontSize:"0.8rem"},children:"Open on itch.io ↗"})]})]})}else return tt.jsxs("div",{className:"arcade-game-wrap",children:[tt.jsx("div",{className:"arcade-game-lobby-bar",children:tt.jsx("button",{onClick:Wl,className:"arcade-back-to-lobby",children:"← Back to Arcade"})}),tt.jsx("div",{style:{width:"100%",maxWidth:"1200px",height:"min(85vh, 900px)",margin:"0 auto"},children:tt.jsx("iframe",{src:I.embedUrl,style:{width:"100%",height:"100%",border:0},title:`${I.label} — playable embed`})})]});if(D)return tt.jsx("div",{className:"arcade-error",children:tt.jsxs("div",{className:"arcade-error-box",children:[tt.jsx("strong",{children:"Studio Error"}),tt.jsx("p",{children:D}),tt.jsxs("small",{children:["Game ID: ",a]})]})});if(!B||!A)return tt.jsx("div",{className:"arcade-loading",children:tt.jsxs("span",{children:["Loading ",a,"…"]})});const z=A.component;return z?tt.jsx("div",{className:"arcade-game-wrap",children:tt.jsx("div",{className:"arcade-game-content",children:tt.jsx(Tr.Suspense,{fallback:tt.jsx("div",{className:"arcade-loading",children:"Loading renderer…"}),children:tt.jsx(z,{session:B})})})}):tt.jsx("div",{className:"arcade-error",children:tt.jsxs("div",{className:"arcade-error-box",children:[tt.jsx("strong",{children:"No Renderer"}),tt.jsxs("p",{children:['Game "',a,'" has no in-app component. It may be an external game.']})]})})}function N_(){const a=b_();return a?tt.jsx(R_,{gameId:a}):tt.jsx(A_,{})}const Lc=document.getElementById("root");Lc&&Gf.createRoot(Lc).render(tt.jsx(N_,{}));export{jp as R,Tr as a,X_ as c,W_ as g,tt as j,Wl as n,Ga as r};
