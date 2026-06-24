(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,33525,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"warnOnce",{enumerable:!0,get:function(){return i}});let i=e=>{}},98183,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0});var i={assign:function(){return c},searchParamsToUrlQuery:function(){return a},urlQueryToSearchParams:function(){return l}};for(var n in i)Object.defineProperty(r,n,{enumerable:!0,get:i[n]});function a(e){let t={};for(let[r,i]of e.entries()){let e=t[r];void 0===e?t[r]=i:Array.isArray(e)?e.push(i):t[r]=[e,i]}return t}function s(e){return"string"==typeof e?e:("number"!=typeof e||isNaN(e))&&"boolean"!=typeof e?"":String(e)}function l(e){let t=new URLSearchParams;for(let[r,i]of Object.entries(e))if(Array.isArray(i))for(let e of i)t.append(r,s(e));else t.set(r,s(i));return t}function c(e,...t){for(let r of t){for(let t of r.keys())e.delete(t);for(let[t,i]of r.entries())e.append(t,i)}return e}},95057,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0});var i={formatUrl:function(){return l},formatWithValidation:function(){return o},urlObjectKeys:function(){return c}};for(var n in i)Object.defineProperty(r,n,{enumerable:!0,get:i[n]});let a=e.r(90809)._(e.r(98183)),s=/https?|ftp|gopher|file/;function l(e){let{auth:t,hostname:r}=e,i=e.protocol||"",n=e.pathname||"",l=e.hash||"",c=e.query||"",o=!1;t=t?encodeURIComponent(t).replace(/%3A/i,":")+"@":"",e.host?o=t+e.host:r&&(o=t+(~r.indexOf(":")?`[${r}]`:r),e.port&&(o+=":"+e.port)),c&&"object"==typeof c&&(c=String(a.urlQueryToSearchParams(c)));let d=e.search||c&&`?${c}`||"";return i&&!i.endsWith(":")&&(i+=":"),e.slashes||(!i||s.test(i))&&!1!==o?(o="//"+(o||""),n&&"/"!==n[0]&&(n="/"+n)):o||(o=""),l&&"#"!==l[0]&&(l="#"+l),d&&"?"!==d[0]&&(d="?"+d),n=n.replace(/[?#]/g,encodeURIComponent),d=d.replace("#","%23"),`${i}${o}${n}${d}${l}`}let c=["auth","hash","host","hostname","href","path","pathname","port","protocol","query","search","slashes"];function o(e){return l(e)}},18581,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"useMergedRef",{enumerable:!0,get:function(){return n}});let i=e.r(71645);function n(e,t){let r=(0,i.useRef)(null),n=(0,i.useRef)(null);return(0,i.useCallback)(i=>{if(null===i){let e=r.current;e&&(r.current=null,e());let t=n.current;t&&(n.current=null,t())}else e&&(r.current=a(e,i)),t&&(n.current=a(t,i))},[e,t])}function a(e,t){if("function"!=typeof e)return e.current=t,()=>{e.current=null};{let r=e(t);return"function"==typeof r?r:()=>e(null)}}("function"==typeof r.default||"object"==typeof r.default&&null!==r.default)&&void 0===r.default.__esModule&&(Object.defineProperty(r.default,"__esModule",{value:!0}),Object.assign(r.default,r),t.exports=r.default)},18967,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0});var i={DecodeError:function(){return x},MiddlewareNotFoundError:function(){return v},MissingStaticPage:function(){return j},NormalizeError:function(){return y},PageNotFoundError:function(){return b},SP:function(){return g},ST:function(){return m},WEB_VITALS:function(){return a},execOnce:function(){return s},getDisplayName:function(){return u},getLocationOrigin:function(){return o},getURL:function(){return d},isAbsoluteUrl:function(){return c},isResSent:function(){return p},loadGetInitialProps:function(){return h},normalizeRepeatedSlashes:function(){return f},stringifyError:function(){return N}};for(var n in i)Object.defineProperty(r,n,{enumerable:!0,get:i[n]});let a=["CLS","FCP","FID","INP","LCP","TTFB"];function s(e){let t,r=!1;return(...i)=>(r||(r=!0,t=e(...i)),t)}let l=/^[a-zA-Z][a-zA-Z\d+\-.]*?:/,c=e=>l.test(e);function o(){let{protocol:e,hostname:t,port:r}=window.location;return`${e}//${t}${r?":"+r:""}`}function d(){let{href:e}=window.location,t=o();return e.substring(t.length)}function u(e){return"string"==typeof e?e:e.displayName||e.name||"Unknown"}function p(e){return e.finished||e.headersSent}function f(e){let t=e.split("?");return t[0].replace(/\\/g,"/").replace(/\/\/+/g,"/")+(t[1]?`?${t.slice(1).join("?")}`:"")}async function h(e,t){let r=t.res||t.ctx&&t.ctx.res;if(!e.getInitialProps)return t.ctx&&t.Component?{pageProps:await h(t.Component,t.ctx)}:{};let i=await e.getInitialProps(t);if(r&&p(r))return i;if(!i)throw Object.defineProperty(Error(`"${u(e)}.getInitialProps()" should resolve to an object. But found "${i}" instead.`),"__NEXT_ERROR_CODE",{value:"E394",enumerable:!1,configurable:!0});return i}let g="u">typeof performance,m=g&&["mark","measure","getEntriesByName"].every(e=>"function"==typeof performance[e]);class x extends Error{}class y extends Error{}class b extends Error{constructor(e){super(),this.code="ENOENT",this.name="PageNotFoundError",this.message=`Cannot find module for page: ${e}`}}class j extends Error{constructor(e,t){super(),this.message=`Failed to load static file for page: ${e} ${t}`}}class v extends Error{constructor(){super(),this.code="ENOENT",this.message="Cannot find the middleware module"}}function N(e){return JSON.stringify({message:e.message,stack:e.stack})}},73668,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"isLocalURL",{enumerable:!0,get:function(){return a}});let i=e.r(18967),n=e.r(52817);function a(e){if(!(0,i.isAbsoluteUrl)(e))return!0;try{let t=(0,i.getLocationOrigin)(),r=new URL(e,t);return r.origin===t&&(0,n.hasBasePath)(r.pathname)}catch(e){return!1}}},84508,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"errorOnce",{enumerable:!0,get:function(){return i}});let i=e=>{}},22016,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0});var i={default:function(){return x},useLinkStatus:function(){return b}};for(var n in i)Object.defineProperty(r,n,{enumerable:!0,get:i[n]});let a=e.r(90809),s=e.r(43476),l=a._(e.r(71645)),c=e.r(95057),o=e.r(8372),d=e.r(18581),u=e.r(18967),p=e.r(5550);e.r(33525);let f=e.r(91949),h=e.r(73668),g=e.r(9396);function m(e){return"string"==typeof e?e:(0,c.formatUrl)(e)}function x(t){var r;let i,n,a,[c,x]=(0,l.useOptimistic)(f.IDLE_LINK_STATUS),b=(0,l.useRef)(null),{href:j,as:v,children:N,prefetch:k=null,passHref:w,replace:z,shallow:M,scroll:P,onClick:C,onMouseEnter:O,onTouchStart:S,legacyBehavior:_=!1,onNavigate:E,ref:R,unstable_dynamicOnHover:A,...T}=t;i=N,_&&("string"==typeof i||"number"==typeof i)&&(i=(0,s.jsx)("a",{children:i}));let L=l.default.useContext(o.AppRouterContext),I=!1!==k,U=!1!==k?null===(r=k)||"auto"===r?g.FetchStrategy.PPR:g.FetchStrategy.Full:g.FetchStrategy.PPR,{href:$,as:B}=l.default.useMemo(()=>{let e=m(j);return{href:e,as:v?m(v):e}},[j,v]);if(_){if(i?.$$typeof===Symbol.for("react.lazy"))throw Object.defineProperty(Error("`<Link legacyBehavior>` received a direct child that is either a Server Component, or JSX that was loaded with React.lazy(). This is not supported. Either remove legacyBehavior, or make the direct child a Client Component that renders the Link's `<a>` tag."),"__NEXT_ERROR_CODE",{value:"E863",enumerable:!1,configurable:!0});n=l.default.Children.only(i)}let F=_?n&&"object"==typeof n&&n.ref:R,W=l.default.useCallback(e=>(null!==L&&(b.current=(0,f.mountLinkInstance)(e,$,L,U,I,x)),()=>{b.current&&((0,f.unmountLinkForCurrentNavigation)(b.current),b.current=null),(0,f.unmountPrefetchableInstance)(e)}),[I,$,L,U,x]),D={ref:(0,d.useMergedRef)(W,F),onClick(t){_||"function"!=typeof C||C(t),_&&n.props&&"function"==typeof n.props.onClick&&n.props.onClick(t),!L||t.defaultPrevented||function(t,r,i,n,a,s,c){if("u">typeof window){let o,{nodeName:d}=t.currentTarget;if("A"===d.toUpperCase()&&((o=t.currentTarget.getAttribute("target"))&&"_self"!==o||t.metaKey||t.ctrlKey||t.shiftKey||t.altKey||t.nativeEvent&&2===t.nativeEvent.which)||t.currentTarget.hasAttribute("download"))return;if(!(0,h.isLocalURL)(r)){a&&(t.preventDefault(),location.replace(r));return}if(t.preventDefault(),c){let e=!1;if(c({preventDefault:()=>{e=!0}}),e)return}let{dispatchNavigateAction:u}=e.r(99781);l.default.startTransition(()=>{u(i||r,a?"replace":"push",s??!0,n.current)})}}(t,$,B,b,z,P,E)},onMouseEnter(e){_||"function"!=typeof O||O(e),_&&n.props&&"function"==typeof n.props.onMouseEnter&&n.props.onMouseEnter(e),L&&I&&(0,f.onNavigationIntent)(e.currentTarget,!0===A)},onTouchStart:function(e){_||"function"!=typeof S||S(e),_&&n.props&&"function"==typeof n.props.onTouchStart&&n.props.onTouchStart(e),L&&I&&(0,f.onNavigationIntent)(e.currentTarget,!0===A)}};return(0,u.isAbsoluteUrl)(B)?D.href=B:_&&!w&&("a"!==n.type||"href"in n.props)||(D.href=(0,p.addBasePath)(B)),a=_?l.default.cloneElement(n,D):(0,s.jsx)("a",{...T,...D,children:i}),(0,s.jsx)(y.Provider,{value:c,children:a})}e.r(84508);let y=(0,l.createContext)(f.IDLE_LINK_STATUS),b=()=>(0,l.useContext)(y);("function"==typeof r.default||"object"==typeof r.default&&null!==r.default)&&void 0===r.default.__esModule&&(Object.defineProperty(r.default,"__esModule",{value:!0}),Object.assign(r.default,r),t.exports=r.default)},56691,e=>{"use strict";var t=e.i(43476),r=e.i(22016);function i(){return(0,t.jsxs)("footer",{className:"footer container",children:[(0,t.jsx)("span",{children:"© 2025 CoSync"}),(0,t.jsx)(r.default,{href:"#",className:"footer-link",children:"개인정보처리방침"})]})}e.s(["Footer",()=>i])},18566,(e,t,r)=>{t.exports=e.r(76562)},1565,8355,e=>{"use strict";var t=e.i(43476),r=e.i(22016);function i({variant:e="primary"}){return(0,t.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:10},children:[(0,t.jsx)("span",{style:{width:30,height:30,borderRadius:9,background:"primary"===e?"linear-gradient(135deg, #5b5be7, #8a8ff5)":"#1f2430",display:"inline-flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:14},children:"C"}),(0,t.jsx)("strong",{style:{fontSize:16},children:"CoSync"})]})}function n({label:e,size:r=34}){return(0,t.jsx)("div",{style:{width:r,height:r,borderRadius:"50%",background:"#f2f3f8",display:"inline-flex",alignItems:"center",justifyContent:"center",color:"#7c8494",fontWeight:600,fontSize:Math.max(11,Math.round(.36*r))},children:e})}e.s(["BrandMark",()=>i,"CircleAvatar",()=>n],8355),e.i(51718);var a=e.i(41264),s=e.i(76009),l=e.i(80265),c=e.i(74884);function o({links:e,active:o,rightLabel:d,rightName:u,showBell:p,hideAuthLinks:f}){let{user:h}=(0,l.useAuth)(),{resetState:g}=(0,c.useAppState)(),m=!!h,x=async()=>{await (0,a.signOut)(s.auth),g()};return(0,t.jsx)("header",{className:"topbar",children:(0,t.jsxs)("div",{className:"topbar-inner container",children:[(0,t.jsxs)("div",{className:"topbar-left",children:[(0,t.jsx)(r.default,{href:"/","aria-label":"CoSync Dashboard",children:(0,t.jsx)(i,{})}),(0,t.jsx)("div",{className:"nav-links",children:e.map(e=>(0,t.jsx)(r.default,{className:e.label===o?"active":void 0,href:e.href,children:e.label},e.label))})]}),(0,t.jsx)("div",{className:"topbar-right",children:m?(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)("div",{style:{fontSize:12,color:"#1f2430",fontWeight:600},children:h?.displayName||"김리더"}),(0,t.jsx)(n,{label:(h?.displayName||"김리더").slice(0,1)}),(0,t.jsx)("button",{className:"logout-link",type:"button",onClick:x,children:"로그아웃"})]}):f?null:(0,t.jsxs)("div",{className:"auth-links",children:[(0,t.jsx)(r.default,{href:"/login",children:"로그인"}),(0,t.jsx)(r.default,{className:"auth-primary",href:"/register",children:"회원가입"})]})})]})})}e.s(["TopNav",()=>o],1565)},56420,e=>{"use strict";var t=e.i(71645);let r=(...e)=>e.filter((e,t,r)=>!!e&&""!==e.trim()&&r.indexOf(e)===t).join(" ").trim(),i=e=>{let t=e.replace(/^([A-Z])|[\s-_]+(\w)/g,(e,t,r)=>r?r.toUpperCase():t.toLowerCase());return t.charAt(0).toUpperCase()+t.slice(1)};var n={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};let a=(0,t.createContext)({}),s=(0,t.forwardRef)(({color:e,size:i,strokeWidth:s,absoluteStrokeWidth:l,className:c="",children:o,iconNode:d,...u},p)=>{let{size:f=24,strokeWidth:h=2,absoluteStrokeWidth:g=!1,color:m="currentColor",className:x=""}=(0,t.useContext)(a)??{},y=l??g?24*Number(s??h)/Number(i??f):s??h;return(0,t.createElement)("svg",{ref:p,...n,width:i??f??n.width,height:i??f??n.height,stroke:e??m,strokeWidth:y,className:r("lucide",x,c),...!o&&!(e=>{for(let t in e)if(t.startsWith("aria-")||"role"===t||"title"===t)return!0;return!1})(u)&&{"aria-hidden":"true"},...u},[...d.map(([e,r])=>(0,t.createElement)(e,r)),...Array.isArray(o)?o:[o]])}),l=(e,n)=>{let a=(0,t.forwardRef)(({className:a,...l},c)=>(0,t.createElement)(s,{ref:c,iconNode:n,className:r(`lucide-${i(e).replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase()}`,`lucide-${e}`,a),...l}));return a.displayName=i(e),a};e.s(["default",()=>l],56420)},28276,62382,e=>{"use strict";var t=e.i(56420);let r=(0,t.default)("compass",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z",key:"9ktpf1"}]]);e.s(["Compass",()=>r],28276);let i=(0,t.default)("scale",[["path",{d:"M12 3v18",key:"108xh3"}],["path",{d:"m19 8 3 8a5 5 0 0 1-6 0zV7",key:"zcdpyk"}],["path",{d:"M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1",key:"1yorad"}],["path",{d:"m5 8 3 8a5 5 0 0 1-6 0zV7",key:"eua70x"}],["path",{d:"M7 21h10",key:"1b0cd5"}]]);e.s(["Scale",()=>i],62382)},15227,e=>{"use strict";let t=(0,e.i(56420).default)("message-circle",[["path",{d:"M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719",key:"1sd12s"}]]);e.s(["MessageCircle",()=>t],15227)},12010,e=>{"use strict";let t=(0,e.i(56420).default)("lightbulb",[["path",{d:"M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5",key:"1gvzjb"}],["path",{d:"M9 18h6",key:"x1upvd"}],["path",{d:"M10 22h4",key:"ceow96"}]]);e.s(["Lightbulb",()=>t],12010)},80929,e=>{"use strict";var t=e.i(43476),r=e.i(18566),i=e.i(1565),n=e.i(56691),a=e.i(28276),s=e.i(56420);let l=(0,s.default)("settings",[["path",{d:"M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915",key:"1i5ecw"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]),c=(0,s.default)("pin",[["path",{d:"M12 17v5",key:"bb1du9"}],["path",{d:"M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z",key:"1nkz8b"}]]);var o=e.i(62382);let d=(0,s.default)("banknote",[["rect",{width:"20",height:"12",x:"2",y:"6",rx:"2",key:"9lu3g6"}],["circle",{cx:"12",cy:"12",r:"2",key:"1c9p78"}],["path",{d:"M6 12h.01M18 12h.01",key:"113zkx"}]]),u=(0,s.default)("door-open",[["path",{d:"M11 20H2",key:"nlcfvz"}],["path",{d:"M11 4.562v16.157a1 1 0 0 0 1.242.97L19 20V5.562a2 2 0 0 0-1.515-1.94l-4-1A2 2 0 0 0 11 4.561z",key:"au4z13"}],["path",{d:"M11 4H8a2 2 0 0 0-2 2v14",key:"74r1mk"}],["path",{d:"M14 12h.01",key:"1jfl7z"}],["path",{d:"M22 20h-3",key:"vhrsz"}]]),p=(0,s.default)("clipboard-list",[["rect",{width:"8",height:"4",x:"8",y:"2",rx:"1",ry:"1",key:"tgr4d6"}],["path",{d:"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",key:"116196"}],["path",{d:"M12 11h4",key:"1jrz19"}],["path",{d:"M12 16h4",key:"n85exb"}],["path",{d:"M8 11h.01",key:"1dfujw"}],["path",{d:"M8 16h.01",key:"18s6g9"}]]),f=(0,s.default)("handshake",[["path",{d:"m11 17 2 2a1 1 0 1 0 3-3",key:"efffak"}],["path",{d:"m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4",key:"9pr0kb"}],["path",{d:"m21 3 1 11h-2",key:"1tisrp"}],["path",{d:"M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3",key:"1uvwmv"}],["path",{d:"M3 4h8",key:"1ep09j"}]]);var h=e.i(15227),g=e.i(12010);let m=[{icon:(0,t.jsx)(a.Compass,{size:18}),title:"비전",desc:"왜 하는가",detail:"회사를 어디까지 키울 건지, 무엇을 위해 하는지"},{icon:(0,t.jsx)(l,{size:18}),title:"실행",desc:"어떻게 일하는가",detail:"업무 몰입 수준, 협업 리듬, 결정 속도"},{icon:(0,t.jsx)(c,{size:18}),title:"책임",desc:"누가 맡는가",detail:"역할 경계, 회색지대 업무, 성과 기준"}],x=[{icon:(0,t.jsx)(o.Scale,{size:18}),title:"권한",desc:"누가 결정하는가",detail:"담당 영역별 결정권, 공동 의사결정 기준"},{icon:(0,t.jsx)(d,{size:18}),title:"돈",desc:"무엇을 나누는가",detail:"지분 구조, 급여 기준, 투자 유치 방향"},{icon:(0,t.jsx)(u,{size:18}),title:"종료",desc:"깨질 때 어떻게 하는가",detail:"이탈 시 인수인계, 지분 정리, 권한 차단"}],y=[{num:"01",title:"각자 독립 응답",desc:"상대방 답을 보지 않은 상태에서 각자 솔직하게 작성합니다."},{num:"02",title:"동시 공개",desc:"두 사람 모두 완료하면 서로의 응답이 공개됩니다."},{num:"03",title:"합의 문서 완성",desc:"응답을 바탕으로 팀 운영 규칙을 문서로 확정합니다."}];function b(){let e=(0,r.useRouter)();return(0,t.jsxs)("main",{className:"page",children:[(0,t.jsx)(i.TopNav,{links:[{label:"갭 리포트",href:"/gap-report"}],active:"합의안"}),(0,t.jsx)("section",{className:"agreement-preview-hero",children:(0,t.jsxs)("div",{className:"container",style:{textAlign:"center"},children:[(0,t.jsx)("div",{className:"agreement-badge",children:"PREMIUM"}),(0,t.jsx)("h1",{className:"agreement-hero-title",children:"합의안 만들기"}),(0,t.jsxs)("p",{className:"agreement-hero-sub",children:["공동창업자 간 운영 규칙을 문서로 만드는 과정입니다.",(0,t.jsx)("br",{}),"각자 독립적으로 작성한 뒤, 함께 확인하고 합의합니다."]})]})}),(0,t.jsxs)("section",{className:"container agreement-preview-body",children:[(0,t.jsxs)("div",{className:"agreement-trust-block",children:[(0,t.jsxs)("div",{className:"trust-legal-badge",children:[(0,t.jsx)(o.Scale,{size:14,style:{display:"inline",verticalAlign:"middle",marginRight:"6px"}})," 변호사 감수 · 실제 분쟁 판례 반영"]}),(0,t.jsxs)("div",{className:"trust-cards",children:[(0,t.jsxs)("div",{className:"trust-card",children:[(0,t.jsx)("div",{className:"trust-card-icon",children:(0,t.jsx)(p,{size:22})}),(0,t.jsx)("div",{className:"trust-card-title",children:"주주간계약 필수 조항 기반"}),(0,t.jsx)("div",{className:"trust-card-desc",children:"실제 주주간계약서에서 분쟁이 가장 많이 발생하는 필수 조항을 바탕으로 설계되었습니다."})]}),(0,t.jsxs)("div",{className:"trust-card",children:[(0,t.jsx)("div",{className:"trust-card-icon",children:(0,t.jsx)(f,{size:22})}),(0,t.jsx)("div",{className:"trust-card-title",children:"변호사 협력 검증 템플릿"}),(0,t.jsx)("div",{className:"trust-card-desc",children:"스타트업 전문 변호사와 협력하여 합의 항목의 법적 유효성과 실효성을 검토했습니다."})]}),(0,t.jsxs)("div",{className:"trust-card",children:[(0,t.jsx)("div",{className:"trust-card-icon",children:(0,t.jsx)(h.MessageCircle,{size:22})}),(0,t.jsx)("div",{className:"trust-card-title",children:"팀 필수 대화 설계"}),(0,t.jsx)("div",{className:"trust-card-desc",children:"창업 초기 팀이 반드시 나눠야 하지만 꺼내기 어려운 대화를 구조화된 질문으로 담았습니다."})]})]})]}),(0,t.jsxs)("div",{className:"agreement-section",children:[(0,t.jsx)("div",{className:"agreement-section-label",children:"HOW IT WORKS"}),(0,t.jsx)("h2",{className:"agreement-section-title",children:"3단계로 완성됩니다"}),(0,t.jsx)("div",{className:"agreement-steps",children:y.map((e,r)=>(0,t.jsxs)("div",{className:"agreement-step",children:[(0,t.jsx)("div",{className:"step-num",children:e.num}),r<y.length-1&&(0,t.jsx)("div",{className:"step-connector"}),(0,t.jsxs)("div",{className:"step-content",children:[(0,t.jsx)("div",{className:"step-title",children:e.title}),(0,t.jsx)("div",{className:"step-desc",children:e.desc})]})]},e.num))})]}),(0,t.jsxs)("div",{className:"agreement-section",children:[(0,t.jsx)("div",{className:"agreement-section-label",children:"PRICING"}),(0,t.jsx)("h2",{className:"agreement-section-title",children:"플랜을 선택하세요"}),(0,t.jsx)("p",{className:"agreement-section-desc",children:"2인 기준 · 업그레이드 시 차액(₩200,000)만 추가"}),(0,t.jsxs)("div",{className:"pricing-grid",children:[(0,t.jsxs)("div",{className:"pricing-card",children:[(0,t.jsx)("div",{className:"pricing-plan-name",children:"Basic"}),(0,t.jsx)("div",{className:"pricing-amount",children:"₩129,000"}),(0,t.jsx)("div",{className:"pricing-per",children:"2인 기준 · 1인당 ₩64,500"}),(0,t.jsx)("div",{className:"pricing-divider"}),(0,t.jsx)("div",{className:"pricing-category-label",children:"포함 카테고리 (3개)"}),(0,t.jsx)("div",{className:"pricing-categories",children:m.map(e=>(0,t.jsxs)("div",{className:"pricing-cat-item",children:[(0,t.jsx)("span",{className:"pricing-cat-icon",children:e.icon}),(0,t.jsxs)("div",{children:[(0,t.jsxs)("div",{className:"pricing-cat-title",children:[e.title," ",(0,t.jsx)("span",{className:"pricing-cat-desc",children:e.desc})]}),(0,t.jsx)("div",{className:"pricing-cat-detail",children:e.detail})]})]},e.title))}),(0,t.jsx)("div",{className:"pricing-divider"}),(0,t.jsxs)("div",{className:"pricing-features",children:[(0,t.jsx)("div",{className:"pricing-feature",children:"✓ 팀 문화·운영 규칙 합의 문서"}),(0,t.jsx)("div",{className:"pricing-feature",children:"✓ 변호사 브리핑 자료로 활용 가능"}),(0,t.jsx)("div",{className:"pricing-feature",children:"✓ 버전 히스토리"}),(0,t.jsx)("div",{className:"pricing-feature",children:"✓ 양측 확인 서명"})]}),(0,t.jsx)("button",{type:"button",className:"btn btn-ghost pricing-cta-btn",onClick:()=>e.push("/agreement/start?plan=basic"),children:"Basic으로 시작하기"})]}),(0,t.jsxs)("div",{className:"pricing-card premium",children:[(0,t.jsx)("div",{className:"pricing-recommended",children:"추천"}),(0,t.jsx)("div",{className:"pricing-plan-name",children:"Premium"}),(0,t.jsx)("div",{className:"pricing-amount",children:"₩329,000"}),(0,t.jsx)("div",{className:"pricing-per",children:"2인 기준 · 1인당 ₩164,500"}),(0,t.jsx)("div",{className:"pricing-divider"}),(0,t.jsx)("div",{className:"pricing-category-label",children:"포함 카테고리 (6개 전체)"}),(0,t.jsx)("div",{className:"pricing-categories",children:[...m,...x].map(e=>(0,t.jsxs)("div",{className:"pricing-cat-item",children:[(0,t.jsx)("span",{className:"pricing-cat-icon",children:e.icon}),(0,t.jsxs)("div",{children:[(0,t.jsxs)("div",{className:"pricing-cat-title",children:[e.title," ",(0,t.jsx)("span",{className:"pricing-cat-desc",children:e.desc})]}),(0,t.jsx)("div",{className:"pricing-cat-detail",children:e.detail})]})]},e.title))}),(0,t.jsx)("div",{className:"pricing-divider"}),(0,t.jsxs)("div",{className:"pricing-features",children:[(0,t.jsx)("div",{className:"pricing-feature",children:"✓ Basic 전체 포함"}),(0,t.jsx)("div",{className:"pricing-feature",children:"✓ 권한·돈·종료 법적 핵심 영역 추가"}),(0,t.jsx)("div",{className:"pricing-feature",children:"✓ 빠짐없는 6개 카테고리 합의안"}),(0,t.jsx)("div",{className:"pricing-feature premium-feature",children:"✓ 스타트업 전문 변호사 컨택 가능"})]}),(0,t.jsx)("button",{type:"button",className:"btn btn-primary pricing-cta-btn",onClick:()=>e.push("/agreement/start?plan=premium"),children:"Premium으로 시작하기 →"}),(0,t.jsxs)("div",{className:"pricing-lawyer-note",children:["변호사 검토는 선택 사항이며 별도 비용이 발생합니다.",(0,t.jsx)("br",{}),"시중 주주간계약서 대비 합리적인 비용으로 연결됩니다."]})]})]})]}),(0,t.jsxs)("div",{className:"upgrade-note-block",children:[(0,t.jsx)(g.Lightbulb,{size:18,className:"upgrade-note-icon"}),(0,t.jsxs)("p",{children:["Basic으로 시작하고 나중에 Premium으로 업그레이드할 수 있습니다. 업그레이드 시 차액 ",(0,t.jsx)("strong",{children:"₩200,000"}),"만 추가됩니다."]})]})]}),(0,t.jsx)(n.Footer,{}),(0,t.jsx)("style",{dangerouslySetInnerHTML:{__html:`
        .agreement-preview-hero {
          padding: 80px 0 48px;
          text-align: center;
        }
        .agreement-badge {
          display: inline-block;
          background: linear-gradient(135deg, #5858e2, #8b5cf6);
          color: #fff;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 2px;
          padding: 6px 16px;
          border-radius: 999px;
          margin-bottom: 20px;
        }
        .agreement-hero-title {
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 16px;
          letter-spacing: -1px;
        }
        .agreement-hero-sub {
          font-size: 1.05rem;
          color: #475569;
          line-height: 1.7;
        }
        .agreement-preview-body {
          padding-bottom: 80px;
          display: flex;
          flex-direction: column;
          gap: 64px;
        }
        .agreement-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .agreement-section-label {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 2px;
          color: #5858e2;
        }
        .agreement-section-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #0f172a;
        }
        .agreement-section-desc {
          font-size: 0.95rem;
          color: #64748b;
          margin-top: -4px;
        }
        .agreement-trust-block {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .trust-legal-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(99, 102, 241, 0.1);
          border: 1.5px solid rgba(99, 102, 241, 0.45);
          color: #4338ca;
          padding: 8px 18px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: -0.01em;
          width: fit-content;
        }
        .trust-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        @media (max-width: 700px) {
          .trust-cards { grid-template-columns: 1fr; }
        }
        .trust-card {
          background: #fff;
          border-radius: 16px;
          padding: 24px 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .trust-card-icon { font-size: 1.4rem; margin-bottom: 4px; }
        .trust-card-title { font-size: 0.95rem; font-weight: 700; color: #0f172a; }
        .trust-card-desc { font-size: 0.85rem; color: #64748b; line-height: 1.6; }
        .agreement-steps {
          display: flex;
          flex-direction: column;
          padding: 32px;
          background: #f8fafc;
          border-radius: 20px;
        }
        .agreement-step { display: flex; gap: 20px; align-items: flex-start; position: relative; }
        .step-num {
          font-size: 0.75rem;
          font-weight: 800;
          color: #5858e2;
          background: rgba(88,88,226,0.1);
          width: 40px; height: 40px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; letter-spacing: 1px;
        }
        .step-connector {
          position: absolute; left: 19px; top: 40px;
          width: 2px; height: 32px; background: #e2e8f0;
        }
        .step-content { padding: 8px 0 32px; }
        .step-content:last-child { padding-bottom: 0; }
        .step-title { font-size: 1rem; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
        .step-desc { font-size: 0.9rem; color: #64748b; line-height: 1.6; }
        .pricing-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          align-items: stretch;
        }
        @media (max-width: 700px) {
          .pricing-grid { grid-template-columns: 1fr; }
        }
        .pricing-card {
          background: #fff;
          border-radius: 24px;
          padding: 32px 28px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          position: relative;
        }
        .pricing-card.premium {
          border-color: #5858e2;
          box-shadow: 0 12px 40px rgba(88,88,226,0.12);
        }
        .pricing-recommended {
          position: absolute;
          top: -14px; left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(120deg, #5858e2, #777ef0);
          color: #fff;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 4px 16px;
          border-radius: 999px;
          letter-spacing: 1px;
          white-space: nowrap;
        }
        .pricing-plan-name { font-size: 0.9rem; font-weight: 700; color: #64748b; letter-spacing: 1px; }
        .pricing-amount { font-size: 2rem; font-weight: 800; color: #0f172a; letter-spacing: -1px; }
        .pricing-per { font-size: 0.82rem; color: #94a3b8; margin-top: -6px; }
        .pricing-divider { height: 1px; background: #f1f5f9; margin: 4px 0; }
        .pricing-category-label { font-size: 0.8rem; font-weight: 700; color: #5858e2; letter-spacing: 1px; }
        .pricing-categories { display: flex; flex-direction: column; gap: 10px; }
        .pricing-cat-item { display: flex; gap: 10px; align-items: flex-start; }
        .pricing-cat-icon { font-size: 1.1rem; flex-shrink: 0; margin-top: 1px; }
        .pricing-cat-title { font-size: 0.88rem; font-weight: 700; color: #0f172a; }
        .pricing-cat-desc { font-size: 0.8rem; font-weight: 500; color: #5858e2; }
        .pricing-cat-detail { font-size: 0.78rem; color: #94a3b8; line-height: 1.4; margin-top: 2px; }
        .pricing-features { display: flex; flex-direction: column; gap: 8px; }
        .pricing-feature { font-size: 0.88rem; color: #475569; }
        .premium-feature { color: #5858e2; font-weight: 600; }
        .pricing-cta-btn { width: 100%; margin-top: auto; padding-top: 8px; }
        .pricing-lawyer-note {
          font-size: 0.78rem;
          color: #94a3b8;
          line-height: 1.6;
          text-align: center;
          margin-top: -4px;
        }
        .upgrade-note-block {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background: rgba(88,88,226,0.05);
          border: 1px solid rgba(88,88,226,0.12);
          border-radius: 16px;
          padding: 20px 24px;
          font-size: 0.9rem;
          color: #475569;
          line-height: 1.6;
        }
        .upgrade-note-icon { font-size: 1.1rem; flex-shrink: 0; margin-top: 2px; }
      `}})]})}e.s(["default",()=>b],80929)}]);