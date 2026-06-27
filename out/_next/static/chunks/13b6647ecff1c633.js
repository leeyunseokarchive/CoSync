(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,33525,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"warnOnce",{enumerable:!0,get:function(){return n}});let n=e=>{}},98183,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0});var n={assign:function(){return l},searchParamsToUrlQuery:function(){return i},urlQueryToSearchParams:function(){return o}};for(var a in n)Object.defineProperty(r,a,{enumerable:!0,get:n[a]});function i(e){let t={};for(let[r,n]of e.entries()){let e=t[r];void 0===e?t[r]=n:Array.isArray(e)?e.push(n):t[r]=[e,n]}return t}function s(e){return"string"==typeof e?e:("number"!=typeof e||isNaN(e))&&"boolean"!=typeof e?"":String(e)}function o(e){let t=new URLSearchParams;for(let[r,n]of Object.entries(e))if(Array.isArray(n))for(let e of n)t.append(r,s(e));else t.set(r,s(n));return t}function l(e,...t){for(let r of t){for(let t of r.keys())e.delete(t);for(let[t,n]of r.entries())e.append(t,n)}return e}},95057,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0});var n={formatUrl:function(){return o},formatWithValidation:function(){return c},urlObjectKeys:function(){return l}};for(var a in n)Object.defineProperty(r,a,{enumerable:!0,get:n[a]});let i=e.r(90809)._(e.r(98183)),s=/https?|ftp|gopher|file/;function o(e){let{auth:t,hostname:r}=e,n=e.protocol||"",a=e.pathname||"",o=e.hash||"",l=e.query||"",c=!1;t=t?encodeURIComponent(t).replace(/%3A/i,":")+"@":"",e.host?c=t+e.host:r&&(c=t+(~r.indexOf(":")?`[${r}]`:r),e.port&&(c+=":"+e.port)),l&&"object"==typeof l&&(l=String(i.urlQueryToSearchParams(l)));let u=e.search||l&&`?${l}`||"";return n&&!n.endsWith(":")&&(n+=":"),e.slashes||(!n||s.test(n))&&!1!==c?(c="//"+(c||""),a&&"/"!==a[0]&&(a="/"+a)):c||(c=""),o&&"#"!==o[0]&&(o="#"+o),u&&"?"!==u[0]&&(u="?"+u),a=a.replace(/[?#]/g,encodeURIComponent),u=u.replace("#","%23"),`${n}${c}${a}${u}${o}`}let l=["auth","hash","host","hostname","href","path","pathname","port","protocol","query","search","slashes"];function c(e){return o(e)}},18581,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"useMergedRef",{enumerable:!0,get:function(){return a}});let n=e.r(71645);function a(e,t){let r=(0,n.useRef)(null),a=(0,n.useRef)(null);return(0,n.useCallback)(n=>{if(null===n){let e=r.current;e&&(r.current=null,e());let t=a.current;t&&(a.current=null,t())}else e&&(r.current=i(e,n)),t&&(a.current=i(t,n))},[e,t])}function i(e,t){if("function"!=typeof e)return e.current=t,()=>{e.current=null};{let r=e(t);return"function"==typeof r?r:()=>e(null)}}("function"==typeof r.default||"object"==typeof r.default&&null!==r.default)&&void 0===r.default.__esModule&&(Object.defineProperty(r.default,"__esModule",{value:!0}),Object.assign(r.default,r),t.exports=r.default)},18967,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0});var n={DecodeError:function(){return x},MiddlewareNotFoundError:function(){return v},MissingStaticPage:function(){return j},NormalizeError:function(){return y},PageNotFoundError:function(){return b},SP:function(){return m},ST:function(){return g},WEB_VITALS:function(){return i},execOnce:function(){return s},getDisplayName:function(){return d},getLocationOrigin:function(){return c},getURL:function(){return u},isAbsoluteUrl:function(){return l},isResSent:function(){return f},loadGetInitialProps:function(){return h},normalizeRepeatedSlashes:function(){return p},stringifyError:function(){return N}};for(var a in n)Object.defineProperty(r,a,{enumerable:!0,get:n[a]});let i=["CLS","FCP","FID","INP","LCP","TTFB"];function s(e){let t,r=!1;return(...n)=>(r||(r=!0,t=e(...n)),t)}let o=/^[a-zA-Z][a-zA-Z\d+\-.]*?:/,l=e=>o.test(e);function c(){let{protocol:e,hostname:t,port:r}=window.location;return`${e}//${t}${r?":"+r:""}`}function u(){let{href:e}=window.location,t=c();return e.substring(t.length)}function d(e){return"string"==typeof e?e:e.displayName||e.name||"Unknown"}function f(e){return e.finished||e.headersSent}function p(e){let t=e.split("?");return t[0].replace(/\\/g,"/").replace(/\/\/+/g,"/")+(t[1]?`?${t.slice(1).join("?")}`:"")}async function h(e,t){let r=t.res||t.ctx&&t.ctx.res;if(!e.getInitialProps)return t.ctx&&t.Component?{pageProps:await h(t.Component,t.ctx)}:{};let n=await e.getInitialProps(t);if(r&&f(r))return n;if(!n)throw Object.defineProperty(Error(`"${d(e)}.getInitialProps()" should resolve to an object. But found "${n}" instead.`),"__NEXT_ERROR_CODE",{value:"E394",enumerable:!1,configurable:!0});return n}let m="u">typeof performance,g=m&&["mark","measure","getEntriesByName"].every(e=>"function"==typeof performance[e]);class x extends Error{}class y extends Error{}class b extends Error{constructor(e){super(),this.code="ENOENT",this.name="PageNotFoundError",this.message=`Cannot find module for page: ${e}`}}class j extends Error{constructor(e,t){super(),this.message=`Failed to load static file for page: ${e} ${t}`}}class v extends Error{constructor(){super(),this.code="ENOENT",this.message="Cannot find the middleware module"}}function N(e){return JSON.stringify({message:e.message,stack:e.stack})}},73668,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"isLocalURL",{enumerable:!0,get:function(){return i}});let n=e.r(18967),a=e.r(52817);function i(e){if(!(0,n.isAbsoluteUrl)(e))return!0;try{let t=(0,n.getLocationOrigin)(),r=new URL(e,t);return r.origin===t&&(0,a.hasBasePath)(r.pathname)}catch(e){return!1}}},84508,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"errorOnce",{enumerable:!0,get:function(){return n}});let n=e=>{}},22016,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0});var n={default:function(){return x},useLinkStatus:function(){return b}};for(var a in n)Object.defineProperty(r,a,{enumerable:!0,get:n[a]});let i=e.r(90809),s=e.r(43476),o=i._(e.r(71645)),l=e.r(95057),c=e.r(8372),u=e.r(18581),d=e.r(18967),f=e.r(5550);e.r(33525);let p=e.r(91949),h=e.r(73668),m=e.r(9396);function g(e){return"string"==typeof e?e:(0,l.formatUrl)(e)}function x(t){var r;let n,a,i,[l,x]=(0,o.useOptimistic)(p.IDLE_LINK_STATUS),b=(0,o.useRef)(null),{href:j,as:v,children:N,prefetch:k=null,passHref:w,replace:C,shallow:P,scroll:_,onClick:O,onMouseEnter:S,onTouchStart:E,legacyBehavior:M=!1,onNavigate:T,ref:R,unstable_dynamicOnHover:z,...A}=t;n=N,M&&("string"==typeof n||"number"==typeof n)&&(n=(0,s.jsx)("a",{children:n}));let L=o.default.useContext(c.AppRouterContext),I=!1!==k,U=!1!==k?null===(r=k)||"auto"===r?m.FetchStrategy.PPR:m.FetchStrategy.Full:m.FetchStrategy.PPR,{href:$,as:F}=o.default.useMemo(()=>{let e=g(j);return{href:e,as:v?g(v):e}},[j,v]);if(M){if(n?.$$typeof===Symbol.for("react.lazy"))throw Object.defineProperty(Error("`<Link legacyBehavior>` received a direct child that is either a Server Component, or JSX that was loaded with React.lazy(). This is not supported. Either remove legacyBehavior, or make the direct child a Client Component that renders the Link's `<a>` tag."),"__NEXT_ERROR_CODE",{value:"E863",enumerable:!1,configurable:!0});a=o.default.Children.only(n)}let W=M?a&&"object"==typeof a&&a.ref:R,B=o.default.useCallback(e=>(null!==L&&(b.current=(0,p.mountLinkInstance)(e,$,L,U,I,x)),()=>{b.current&&((0,p.unmountLinkForCurrentNavigation)(b.current),b.current=null),(0,p.unmountPrefetchableInstance)(e)}),[I,$,L,U,x]),D={ref:(0,u.useMergedRef)(B,W),onClick(t){M||"function"!=typeof O||O(t),M&&a.props&&"function"==typeof a.props.onClick&&a.props.onClick(t),!L||t.defaultPrevented||function(t,r,n,a,i,s,l){if("u">typeof window){let c,{nodeName:u}=t.currentTarget;if("A"===u.toUpperCase()&&((c=t.currentTarget.getAttribute("target"))&&"_self"!==c||t.metaKey||t.ctrlKey||t.shiftKey||t.altKey||t.nativeEvent&&2===t.nativeEvent.which)||t.currentTarget.hasAttribute("download"))return;if(!(0,h.isLocalURL)(r)){i&&(t.preventDefault(),location.replace(r));return}if(t.preventDefault(),l){let e=!1;if(l({preventDefault:()=>{e=!0}}),e)return}let{dispatchNavigateAction:d}=e.r(99781);o.default.startTransition(()=>{d(n||r,i?"replace":"push",s??!0,a.current)})}}(t,$,F,b,C,_,T)},onMouseEnter(e){M||"function"!=typeof S||S(e),M&&a.props&&"function"==typeof a.props.onMouseEnter&&a.props.onMouseEnter(e),L&&I&&(0,p.onNavigationIntent)(e.currentTarget,!0===z)},onTouchStart:function(e){M||"function"!=typeof E||E(e),M&&a.props&&"function"==typeof a.props.onTouchStart&&a.props.onTouchStart(e),L&&I&&(0,p.onNavigationIntent)(e.currentTarget,!0===z)}};return(0,d.isAbsoluteUrl)(F)?D.href=F:M&&!w&&("a"!==a.type||"href"in a.props)||(D.href=(0,f.addBasePath)(F)),i=M?o.default.cloneElement(a,D):(0,s.jsx)("a",{...A,...D,children:n}),(0,s.jsx)(y.Provider,{value:l,children:i})}e.r(84508);let y=(0,o.createContext)(p.IDLE_LINK_STATUS),b=()=>(0,o.useContext)(y);("function"==typeof r.default||"object"==typeof r.default&&null!==r.default)&&void 0===r.default.__esModule&&(Object.defineProperty(r.default,"__esModule",{value:!0}),Object.assign(r.default,r),t.exports=r.default)},56691,e=>{"use strict";var t=e.i(43476),r=e.i(22016);function n(){return(0,t.jsxs)("footer",{className:"footer container",children:[(0,t.jsx)("span",{children:"© 2025 CoSync"}),(0,t.jsx)(r.default,{href:"/privacy",className:"footer-link",children:"개인정보처리방침"})]})}e.s(["Footer",()=>n])},1565,8355,e=>{"use strict";var t=e.i(43476),r=e.i(22016);function n({variant:e="primary"}){return(0,t.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:10},children:[(0,t.jsx)("span",{style:{width:30,height:30,borderRadius:9,background:"primary"===e?"linear-gradient(135deg, #5b5be7, #8a8ff5)":"#1f2430",display:"inline-flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:14},children:"C"}),(0,t.jsx)("strong",{style:{fontSize:16},children:"CoSync"})]})}function a({label:e,size:r=34}){return(0,t.jsx)("div",{style:{width:r,height:r,borderRadius:"50%",background:"#f2f3f8",display:"inline-flex",alignItems:"center",justifyContent:"center",color:"#7c8494",fontWeight:600,fontSize:Math.max(11,Math.round(.36*r))},children:e})}e.s(["BrandMark",()=>n,"CircleAvatar",()=>a],8355),e.i(51718);var i=e.i(41264),s=e.i(76009),o=e.i(80265),l=e.i(74884);function c({links:e,active:c,rightLabel:u,rightName:d,showBell:f,hideAuthLinks:p}){let{user:h}=(0,o.useAuth)(),{resetState:m}=(0,l.useAppState)(),g=!!h,x=async()=>{await (0,i.signOut)(s.auth),m()};return(0,t.jsx)("header",{className:"topbar",children:(0,t.jsxs)("div",{className:"topbar-inner container",children:[(0,t.jsxs)("div",{className:"topbar-left",children:[(0,t.jsx)(r.default,{href:"/","aria-label":"CoSync Dashboard",children:(0,t.jsx)(n,{})}),(0,t.jsx)("div",{className:"nav-links",children:e.map(e=>(0,t.jsx)(r.default,{className:e.label===c?"active":void 0,href:e.href,children:e.label},e.label))})]}),(0,t.jsx)("div",{className:"topbar-right",children:g?(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)("div",{style:{fontSize:12,color:"#1f2430",fontWeight:600},children:h?.displayName||"김리더"}),(0,t.jsx)(a,{label:(h?.displayName||"김리더").slice(0,1)}),(0,t.jsx)("button",{className:"logout-link",type:"button",onClick:x,children:"로그아웃"})]}):p?null:(0,t.jsxs)("div",{className:"auth-links",children:[(0,t.jsx)(r.default,{href:"/login",children:"로그인"}),(0,t.jsx)(r.default,{className:"auth-primary",href:"/register",children:"회원가입"})]})})]})})}e.s(["TopNav",()=>c],1565)},56420,15227,e=>{"use strict";var t=e.i(71645);let r=(...e)=>e.filter((e,t,r)=>!!e&&""!==e.trim()&&r.indexOf(e)===t).join(" ").trim(),n=e=>{let t=e.replace(/^([A-Z])|[\s-_]+(\w)/g,(e,t,r)=>r?r.toUpperCase():t.toLowerCase());return t.charAt(0).toUpperCase()+t.slice(1)};var a={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};let i=(0,t.createContext)({}),s=(0,t.forwardRef)(({color:e,size:n,strokeWidth:s,absoluteStrokeWidth:o,className:l="",children:c,iconNode:u,...d},f)=>{let{size:p=24,strokeWidth:h=2,absoluteStrokeWidth:m=!1,color:g="currentColor",className:x=""}=(0,t.useContext)(i)??{},y=o??m?24*Number(s??h)/Number(n??p):s??h;return(0,t.createElement)("svg",{ref:f,...a,width:n??p??a.width,height:n??p??a.height,stroke:e??g,strokeWidth:y,className:r("lucide",x,l),...!c&&!(e=>{for(let t in e)if(t.startsWith("aria-")||"role"===t||"title"===t)return!0;return!1})(d)&&{"aria-hidden":"true"},...d},[...u.map(([e,r])=>(0,t.createElement)(e,r)),...Array.isArray(c)?c:[c]])}),o=(e,a)=>{let i=(0,t.forwardRef)(({className:i,...o},l)=>(0,t.createElement)(s,{ref:l,iconNode:a,className:r(`lucide-${n(e).replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase()}`,`lucide-${e}`,i),...o}));return i.displayName=n(e),i};e.s(["default",()=>o],56420);let l=o("message-circle",[["path",{d:"M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719",key:"1sd12s"}]]);e.s(["MessageCircle",()=>l],15227)},80929,e=>{"use strict";var t=e.i(43476),r=e.i(1565),n=e.i(56691),a=e.i(56420);let i=(0,a.default)("clipboard-list",[["rect",{width:"8",height:"4",x:"8",y:"2",rx:"1",ry:"1",key:"tgr4d6"}],["path",{d:"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",key:"116196"}],["path",{d:"M12 11h4",key:"1jrz19"}],["path",{d:"M12 16h4",key:"n85exb"}],["path",{d:"M8 11h.01",key:"1dfujw"}],["path",{d:"M8 16h.01",key:"18s6g9"}]]),s=(0,a.default)("handshake",[["path",{d:"m11 17 2 2a1 1 0 1 0 3-3",key:"efffak"}],["path",{d:"m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4",key:"9pr0kb"}],["path",{d:"m21 3 1 11h-2",key:"1tisrp"}],["path",{d:"M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3",key:"1uvwmv"}],["path",{d:"M3 4h8",key:"1ep09j"}]]);var o=e.i(15227);let l=[{num:"01",title:"각자 독립 응답",desc:"상대방 답을 보지 않은 상태에서 각자 솔직하게 작성합니다."},{num:"02",title:"동시 공개",desc:"두 사람 모두 완료하면 서로의 응답이 공개됩니다."},{num:"03",title:"합의 문서 완성",desc:"응답을 바탕으로 팀 운영 규칙을 문서로 확정합니다."}];function c(){return(0,t.jsxs)("main",{className:"page",children:[(0,t.jsx)(r.TopNav,{links:[{label:"갭 리포트",href:"/gap-report"}],active:"합의안"}),(0,t.jsx)("section",{className:"agreement-preview-hero",children:(0,t.jsxs)("div",{className:"container",style:{textAlign:"center"},children:[(0,t.jsx)("div",{className:"agreement-badge",children:"PREMIUM"}),(0,t.jsx)("h1",{className:"agreement-hero-title",children:"합의안 만들기"}),(0,t.jsxs)("p",{className:"agreement-hero-sub",children:["공동창업자 간 운영 규칙을 문서로 만드는 과정입니다.",(0,t.jsx)("br",{}),"각자 독립적으로 작성한 뒤, 함께 확인하고 합의합니다."]})]})}),(0,t.jsxs)("section",{className:"container agreement-preview-body",children:[(0,t.jsx)("div",{className:"agreement-trust-block",children:(0,t.jsxs)("div",{className:"trust-cards",children:[(0,t.jsxs)("div",{className:"trust-card",children:[(0,t.jsx)("div",{className:"trust-card-icon",children:(0,t.jsx)(i,{size:22})}),(0,t.jsx)("div",{className:"trust-card-title",children:"주주간계약 필수 조항 기반"}),(0,t.jsx)("div",{className:"trust-card-desc",children:"실제 주주간계약서에서 분쟁이 가장 많이 발생하는 필수 조항을 바탕으로 설계되었습니다."})]}),(0,t.jsxs)("div",{className:"trust-card",children:[(0,t.jsx)("div",{className:"trust-card-icon",children:(0,t.jsx)(s,{size:22})}),(0,t.jsx)("div",{className:"trust-card-title",children:"변호사 협력 검토 템플릿"}),(0,t.jsx)("div",{className:"trust-card-desc",children:"스타트업 전문 변호사와 협력하여 합의 항목의 법적 유효성과 실효성을 검토했습니다."})]}),(0,t.jsxs)("div",{className:"trust-card",children:[(0,t.jsx)("div",{className:"trust-card-icon",children:(0,t.jsx)(o.MessageCircle,{size:22})}),(0,t.jsx)("div",{className:"trust-card-title",children:"팀 필수 대화 설계"}),(0,t.jsx)("div",{className:"trust-card-desc",children:"창업 초기 팀이 반드시 나눠야 하지만 꺼내기 어려운 대화를 구조화된 질문으로 담았습니다."})]})]})}),(0,t.jsxs)("div",{className:"agreement-section",children:[(0,t.jsx)("div",{className:"agreement-section-label",children:"HOW IT WORKS"}),(0,t.jsx)("h2",{className:"agreement-section-title",children:"3단계로 완성됩니다"}),(0,t.jsx)("div",{className:"agreement-steps",children:l.map((e,r)=>(0,t.jsxs)("div",{className:"agreement-step",children:[(0,t.jsx)("div",{className:"step-num",children:e.num}),r<l.length-1&&(0,t.jsx)("div",{className:"step-connector"}),(0,t.jsxs)("div",{className:"step-content",children:[(0,t.jsx)("div",{className:"step-title",children:e.title}),(0,t.jsx)("div",{className:"step-desc",children:e.desc})]})]},e.num))})]}),(0,t.jsxs)("div",{className:"agreement-section",style:{textAlign:"center"},children:[(0,t.jsx)("h2",{className:"agreement-section-title",children:"데모 평가에 참여해주세요"}),(0,t.jsxs)("p",{className:"agreement-section-desc",children:["CoSync 서비스를 체험해 보신 소감을 알려주세요.",(0,t.jsx)("br",{}),"여러분의 피드백이 더 나은 서비스를 만듭니다."]}),(0,t.jsx)("a",{href:"https://forms.gle/h4Xyp7GD4jcicqpM8",target:"_blank",rel:"noopener noreferrer",className:"btn btn-primary",style:{display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",width:"100%",maxWidth:"480px",padding:"18px 28px",fontSize:"16px",margin:"16px auto 0"},children:"데모 평가 참여하기 →"})]})]}),(0,t.jsx)(n.Footer,{}),(0,t.jsx)("style",{dangerouslySetInnerHTML:{__html:`
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
      `}})]})}e.s(["default",()=>c],80929)}]);