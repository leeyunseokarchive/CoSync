(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,33525,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"warnOnce",{enumerable:!0,get:function(){return n}});let n=e=>{}},98183,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0});var n={assign:function(){return l},searchParamsToUrlQuery:function(){return a},urlQueryToSearchParams:function(){return c}};for(var i in n)Object.defineProperty(r,i,{enumerable:!0,get:n[i]});function a(e){let t={};for(let[r,n]of e.entries()){let e=t[r];void 0===e?t[r]=n:Array.isArray(e)?e.push(n):t[r]=[e,n]}return t}function s(e){return"string"==typeof e?e:("number"!=typeof e||isNaN(e))&&"boolean"!=typeof e?"":String(e)}function c(e){let t=new URLSearchParams;for(let[r,n]of Object.entries(e))if(Array.isArray(n))for(let e of n)t.append(r,s(e));else t.set(r,s(n));return t}function l(e,...t){for(let r of t){for(let t of r.keys())e.delete(t);for(let[t,n]of r.entries())e.append(t,n)}return e}},95057,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0});var n={formatUrl:function(){return c},formatWithValidation:function(){return o},urlObjectKeys:function(){return l}};for(var i in n)Object.defineProperty(r,i,{enumerable:!0,get:n[i]});let a=e.r(90809)._(e.r(98183)),s=/https?|ftp|gopher|file/;function c(e){let{auth:t,hostname:r}=e,n=e.protocol||"",i=e.pathname||"",c=e.hash||"",l=e.query||"",o=!1;t=t?encodeURIComponent(t).replace(/%3A/i,":")+"@":"",e.host?o=t+e.host:r&&(o=t+(~r.indexOf(":")?`[${r}]`:r),e.port&&(o+=":"+e.port)),l&&"object"==typeof l&&(l=String(a.urlQueryToSearchParams(l)));let d=e.search||l&&`?${l}`||"";return n&&!n.endsWith(":")&&(n+=":"),e.slashes||(!n||s.test(n))&&!1!==o?(o="//"+(o||""),i&&"/"!==i[0]&&(i="/"+i)):o||(o=""),c&&"#"!==c[0]&&(c="#"+c),d&&"?"!==d[0]&&(d="?"+d),i=i.replace(/[?#]/g,encodeURIComponent),d=d.replace("#","%23"),`${n}${o}${i}${d}${c}`}let l=["auth","hash","host","hostname","href","path","pathname","port","protocol","query","search","slashes"];function o(e){return c(e)}},18581,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"useMergedRef",{enumerable:!0,get:function(){return i}});let n=e.r(71645);function i(e,t){let r=(0,n.useRef)(null),i=(0,n.useRef)(null);return(0,n.useCallback)(n=>{if(null===n){let e=r.current;e&&(r.current=null,e());let t=i.current;t&&(i.current=null,t())}else e&&(r.current=a(e,n)),t&&(i.current=a(t,n))},[e,t])}function a(e,t){if("function"!=typeof e)return e.current=t,()=>{e.current=null};{let r=e(t);return"function"==typeof r?r:()=>e(null)}}("function"==typeof r.default||"object"==typeof r.default&&null!==r.default)&&void 0===r.default.__esModule&&(Object.defineProperty(r.default,"__esModule",{value:!0}),Object.assign(r.default,r),t.exports=r.default)},18967,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0});var n={DecodeError:function(){return x},MiddlewareNotFoundError:function(){return y},MissingStaticPage:function(){return v},NormalizeError:function(){return b},PageNotFoundError:function(){return j},SP:function(){return m},ST:function(){return h},WEB_VITALS:function(){return a},execOnce:function(){return s},getDisplayName:function(){return u},getLocationOrigin:function(){return o},getURL:function(){return d},isAbsoluteUrl:function(){return l},isResSent:function(){return p},loadGetInitialProps:function(){return g},normalizeRepeatedSlashes:function(){return f},stringifyError:function(){return N}};for(var i in n)Object.defineProperty(r,i,{enumerable:!0,get:n[i]});let a=["CLS","FCP","FID","INP","LCP","TTFB"];function s(e){let t,r=!1;return(...n)=>(r||(r=!0,t=e(...n)),t)}let c=/^[a-zA-Z][a-zA-Z\d+\-.]*?:/,l=e=>c.test(e);function o(){let{protocol:e,hostname:t,port:r}=window.location;return`${e}//${t}${r?":"+r:""}`}function d(){let{href:e}=window.location,t=o();return e.substring(t.length)}function u(e){return"string"==typeof e?e:e.displayName||e.name||"Unknown"}function p(e){return e.finished||e.headersSent}function f(e){let t=e.split("?");return t[0].replace(/\\/g,"/").replace(/\/\/+/g,"/")+(t[1]?`?${t.slice(1).join("?")}`:"")}async function g(e,t){let r=t.res||t.ctx&&t.ctx.res;if(!e.getInitialProps)return t.ctx&&t.Component?{pageProps:await g(t.Component,t.ctx)}:{};let n=await e.getInitialProps(t);if(r&&p(r))return n;if(!n)throw Object.defineProperty(Error(`"${u(e)}.getInitialProps()" should resolve to an object. But found "${n}" instead.`),"__NEXT_ERROR_CODE",{value:"E394",enumerable:!1,configurable:!0});return n}let m="u">typeof performance,h=m&&["mark","measure","getEntriesByName"].every(e=>"function"==typeof performance[e]);class x extends Error{}class b extends Error{}class j extends Error{constructor(e){super(),this.code="ENOENT",this.name="PageNotFoundError",this.message=`Cannot find module for page: ${e}`}}class v extends Error{constructor(e,t){super(),this.message=`Failed to load static file for page: ${e} ${t}`}}class y extends Error{constructor(){super(),this.code="ENOENT",this.message="Cannot find the middleware module"}}function N(e){return JSON.stringify({message:e.message,stack:e.stack})}},73668,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"isLocalURL",{enumerable:!0,get:function(){return a}});let n=e.r(18967),i=e.r(52817);function a(e){if(!(0,n.isAbsoluteUrl)(e))return!0;try{let t=(0,n.getLocationOrigin)(),r=new URL(e,t);return r.origin===t&&(0,i.hasBasePath)(r.pathname)}catch(e){return!1}}},84508,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"errorOnce",{enumerable:!0,get:function(){return n}});let n=e=>{}},22016,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0});var n={default:function(){return x},useLinkStatus:function(){return j}};for(var i in n)Object.defineProperty(r,i,{enumerable:!0,get:n[i]});let a=e.r(90809),s=e.r(43476),c=a._(e.r(71645)),l=e.r(95057),o=e.r(8372),d=e.r(18581),u=e.r(18967),p=e.r(5550);e.r(33525);let f=e.r(91949),g=e.r(73668),m=e.r(9396);function h(e){return"string"==typeof e?e:(0,l.formatUrl)(e)}function x(t){var r;let n,i,a,[l,x]=(0,c.useOptimistic)(f.IDLE_LINK_STATUS),j=(0,c.useRef)(null),{href:v,as:y,children:N,prefetch:w=null,passHref:P,replace:k,shallow:O,scroll:_,onClick:C,onMouseEnter:S,onTouchStart:E,legacyBehavior:z=!1,onNavigate:T,ref:R,unstable_dynamicOnHover:M,...I}=t;n=N,z&&("string"==typeof n||"number"==typeof n)&&(n=(0,s.jsx)("a",{children:n}));let A=c.default.useContext(o.AppRouterContext),L=!1!==w,U=!1!==w?null===(r=w)||"auto"===r?m.FetchStrategy.PPR:m.FetchStrategy.Full:m.FetchStrategy.PPR,{href:$,as:B}=c.default.useMemo(()=>{let e=h(v);return{href:e,as:y?h(y):e}},[v,y]);if(z){if(n?.$$typeof===Symbol.for("react.lazy"))throw Object.defineProperty(Error("`<Link legacyBehavior>` received a direct child that is either a Server Component, or JSX that was loaded with React.lazy(). This is not supported. Either remove legacyBehavior, or make the direct child a Client Component that renders the Link's `<a>` tag."),"__NEXT_ERROR_CODE",{value:"E863",enumerable:!1,configurable:!0});i=c.default.Children.only(n)}let F=z?i&&"object"==typeof i&&i.ref:R,D=c.default.useCallback(e=>(null!==A&&(j.current=(0,f.mountLinkInstance)(e,$,A,U,L,x)),()=>{j.current&&((0,f.unmountLinkForCurrentNavigation)(j.current),j.current=null),(0,f.unmountPrefetchableInstance)(e)}),[L,$,A,U,x]),K={ref:(0,d.useMergedRef)(D,F),onClick(t){z||"function"!=typeof C||C(t),z&&i.props&&"function"==typeof i.props.onClick&&i.props.onClick(t),!A||t.defaultPrevented||function(t,r,n,i,a,s,l){if("u">typeof window){let o,{nodeName:d}=t.currentTarget;if("A"===d.toUpperCase()&&((o=t.currentTarget.getAttribute("target"))&&"_self"!==o||t.metaKey||t.ctrlKey||t.shiftKey||t.altKey||t.nativeEvent&&2===t.nativeEvent.which)||t.currentTarget.hasAttribute("download"))return;if(!(0,g.isLocalURL)(r)){a&&(t.preventDefault(),location.replace(r));return}if(t.preventDefault(),l){let e=!1;if(l({preventDefault:()=>{e=!0}}),e)return}let{dispatchNavigateAction:u}=e.r(99781);c.default.startTransition(()=>{u(n||r,a?"replace":"push",s??!0,i.current)})}}(t,$,B,j,k,_,T)},onMouseEnter(e){z||"function"!=typeof S||S(e),z&&i.props&&"function"==typeof i.props.onMouseEnter&&i.props.onMouseEnter(e),A&&L&&(0,f.onNavigationIntent)(e.currentTarget,!0===M)},onTouchStart:function(e){z||"function"!=typeof E||E(e),z&&i.props&&"function"==typeof i.props.onTouchStart&&i.props.onTouchStart(e),A&&L&&(0,f.onNavigationIntent)(e.currentTarget,!0===M)}};return(0,u.isAbsoluteUrl)(B)?K.href=B:z&&!P&&("a"!==i.type||"href"in i.props)||(K.href=(0,p.addBasePath)(B)),a=z?c.default.cloneElement(i,K):(0,s.jsx)("a",{...I,...K,children:n}),(0,s.jsx)(b.Provider,{value:l,children:a})}e.r(84508);let b=(0,c.createContext)(f.IDLE_LINK_STATUS),j=()=>(0,c.useContext)(b);("function"==typeof r.default||"object"==typeof r.default&&null!==r.default)&&void 0===r.default.__esModule&&(Object.defineProperty(r.default,"__esModule",{value:!0}),Object.assign(r.default,r),t.exports=r.default)},56691,e=>{"use strict";var t=e.i(43476),r=e.i(22016);function n(){return(0,t.jsxs)("footer",{className:"footer container",children:[(0,t.jsx)("span",{children:"© 2025 CoSync"}),(0,t.jsx)(r.default,{href:"#",className:"footer-link",children:"개인정보처리방침"})]})}e.s(["Footer",()=>n])},18566,(e,t,r)=>{t.exports=e.r(76562)},1565,8355,e=>{"use strict";var t=e.i(43476),r=e.i(22016);function n({variant:e="primary"}){return(0,t.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:10},children:[(0,t.jsx)("span",{style:{width:30,height:30,borderRadius:9,background:"primary"===e?"linear-gradient(135deg, #5b5be7, #8a8ff5)":"#1f2430",display:"inline-flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:14},children:"C"}),(0,t.jsx)("strong",{style:{fontSize:16},children:"CoSync"})]})}function i({label:e,size:r=34}){return(0,t.jsx)("div",{style:{width:r,height:r,borderRadius:"50%",background:"#f2f3f8",display:"inline-flex",alignItems:"center",justifyContent:"center",color:"#7c8494",fontWeight:600,fontSize:Math.max(11,Math.round(.36*r))},children:e})}e.s(["BrandMark",()=>n,"CircleAvatar",()=>i],8355),e.i(51718);var a=e.i(41264),s=e.i(76009),c=e.i(80265);function l({links:e,active:l,rightLabel:o,rightName:d,showBell:u,hideAuthLinks:p}){let{user:f}=(0,c.useAuth)(),g=!!f,m=async()=>{await (0,a.signOut)(s.auth)};return(0,t.jsx)("header",{className:"topbar",children:(0,t.jsxs)("div",{className:"topbar-inner container",children:[(0,t.jsxs)("div",{className:"topbar-left",children:[(0,t.jsx)(r.default,{href:"/","aria-label":"CoSync Dashboard",children:(0,t.jsx)(n,{})}),(0,t.jsx)("div",{className:"nav-links",children:e.map(e=>(0,t.jsx)(r.default,{className:e.label===l?"active":void 0,href:e.href,children:e.label},e.label))})]}),(0,t.jsx)("div",{className:"topbar-right",children:g?(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)("div",{style:{fontSize:12,color:"#1f2430",fontWeight:600},children:f?.displayName||"김리더"}),(0,t.jsx)(i,{label:(f?.displayName||"김리더").slice(0,1)}),(0,t.jsx)("button",{className:"logout-link",type:"button",onClick:m,children:"로그아웃"})]}):p?null:(0,t.jsxs)("div",{className:"auth-links",children:[(0,t.jsx)(r.default,{href:"/login",children:"로그인"}),(0,t.jsx)(r.default,{className:"auth-primary",href:"/register",children:"회원가입"})]})})]})})}e.s(["TopNav",()=>l],1565)},80929,e=>{"use strict";var t=e.i(43476),r=e.i(18566),n=e.i(1565),i=e.i(56691);let a=[{icon:"🧭",title:"비전",desc:"왜 하는가",detail:"회사를 어디까지 키울 건지, 무엇을 위해 하는지"},{icon:"⚙️",title:"실행",desc:"어떻게 일하는가",detail:"업무 몰입 수준, 협업 리듬, 결정 속도"},{icon:"📌",title:"책임",desc:"누가 맡는가",detail:"역할 경계, 회색지대 업무, 성과 기준"}],s=[{icon:"⚖️",title:"권한",desc:"누가 결정하는가",detail:"담당 영역별 결정권, 공동 의사결정 기준"},{icon:"💰",title:"돈",desc:"무엇을 나누는가",detail:"지분 구조, 급여 기준, 투자 유치 방향"},{icon:"🚪",title:"종료",desc:"깨질 때 어떻게 하는가",detail:"이탈 시 인수인계, 지분 정리, 권한 차단"}],c=[{num:"01",title:"각자 독립 응답",desc:"상대방 답을 보지 않은 상태에서 각자 솔직하게 작성합니다."},{num:"02",title:"동시 공개",desc:"두 사람 모두 완료하면 서로의 응답이 공개됩니다."},{num:"03",title:"합의 문서 완성",desc:"응답을 바탕으로 팀 운영 규칙을 문서로 확정합니다."}];function l(){let e=(0,r.useRouter)();return(0,t.jsxs)("main",{className:"page",children:[(0,t.jsx)(n.TopNav,{links:[{label:"갭 리포트",href:"/gap-report"}],active:"합의안"}),(0,t.jsx)("section",{className:"agreement-preview-hero",children:(0,t.jsxs)("div",{className:"container",style:{textAlign:"center"},children:[(0,t.jsx)("div",{className:"agreement-badge",children:"PREMIUM"}),(0,t.jsx)("h1",{className:"agreement-hero-title",children:"합의안 만들기"}),(0,t.jsxs)("p",{className:"agreement-hero-sub",children:["공동창업자 간 운영 규칙을 문서로 만드는 과정입니다.",(0,t.jsx)("br",{}),"각자 독립적으로 작성한 뒤, 함께 확인하고 합의합니다."]})]})}),(0,t.jsxs)("section",{className:"container agreement-preview-body",children:[(0,t.jsxs)("div",{className:"agreement-trust-block",children:[(0,t.jsxs)("div",{className:"trust-legal-badge",children:[(0,t.jsx)("span",{children:"⚖️"})," 주주간계약 자문 변호사 MOU 체결 & 법률 검토 완료"]}),(0,t.jsxs)("div",{className:"trust-cards",children:[(0,t.jsxs)("div",{className:"trust-card",children:[(0,t.jsx)("div",{className:"trust-card-icon",children:"📋"}),(0,t.jsx)("div",{className:"trust-card-title",children:"주주간계약 필수 조항 기반"}),(0,t.jsx)("div",{className:"trust-card-desc",children:"실제 주주간계약서에서 분쟁이 가장 많이 발생하는 필수 조항을 바탕으로 설계되었습니다."})]}),(0,t.jsxs)("div",{className:"trust-card",children:[(0,t.jsx)("div",{className:"trust-card-icon",children:"🤝"}),(0,t.jsx)("div",{className:"trust-card-title",children:"변호사 협력 검증 템플릿"}),(0,t.jsx)("div",{className:"trust-card-desc",children:"스타트업 전문 변호사와 협력하여 합의 항목의 법적 유효성과 실효성을 검토했습니다."})]}),(0,t.jsxs)("div",{className:"trust-card",children:[(0,t.jsx)("div",{className:"trust-card-icon",children:"💬"}),(0,t.jsx)("div",{className:"trust-card-title",children:"팀 필수 대화 설계"}),(0,t.jsx)("div",{className:"trust-card-desc",children:"창업 초기 팀이 반드시 나눠야 하지만 꺼내기 어려운 대화를 구조화된 질문으로 담았습니다."})]})]})]}),(0,t.jsxs)("div",{className:"agreement-section",children:[(0,t.jsx)("div",{className:"agreement-section-label",children:"HOW IT WORKS"}),(0,t.jsx)("h2",{className:"agreement-section-title",children:"3단계로 완성됩니다"}),(0,t.jsx)("div",{className:"agreement-steps",children:c.map((e,r)=>(0,t.jsxs)("div",{className:"agreement-step",children:[(0,t.jsx)("div",{className:"step-num",children:e.num}),r<c.length-1&&(0,t.jsx)("div",{className:"step-connector"}),(0,t.jsxs)("div",{className:"step-content",children:[(0,t.jsx)("div",{className:"step-title",children:e.title}),(0,t.jsx)("div",{className:"step-desc",children:e.desc})]})]},e.num))})]}),(0,t.jsxs)("div",{className:"agreement-section",children:[(0,t.jsx)("div",{className:"agreement-section-label",children:"PRICING"}),(0,t.jsx)("h2",{className:"agreement-section-title",children:"플랜을 선택하세요"}),(0,t.jsx)("p",{className:"agreement-section-desc",children:"2인 기준 · 업그레이드 시 차액(₩200,000)만 추가"}),(0,t.jsxs)("div",{className:"pricing-grid",children:[(0,t.jsxs)("div",{className:"pricing-card",children:[(0,t.jsx)("div",{className:"pricing-plan-name",children:"Basic"}),(0,t.jsx)("div",{className:"pricing-amount",children:"₩129,000"}),(0,t.jsx)("div",{className:"pricing-per",children:"2인 기준 · 1인당 ₩64,500"}),(0,t.jsx)("div",{className:"pricing-divider"}),(0,t.jsx)("div",{className:"pricing-category-label",children:"포함 카테고리 (3개)"}),(0,t.jsx)("div",{className:"pricing-categories",children:a.map(e=>(0,t.jsxs)("div",{className:"pricing-cat-item",children:[(0,t.jsx)("span",{className:"pricing-cat-icon",children:e.icon}),(0,t.jsxs)("div",{children:[(0,t.jsxs)("div",{className:"pricing-cat-title",children:[e.title," ",(0,t.jsx)("span",{className:"pricing-cat-desc",children:e.desc})]}),(0,t.jsx)("div",{className:"pricing-cat-detail",children:e.detail})]})]},e.title))}),(0,t.jsx)("div",{className:"pricing-divider"}),(0,t.jsxs)("div",{className:"pricing-features",children:[(0,t.jsx)("div",{className:"pricing-feature",children:"✓ 팀 문화·운영 규칙 합의 문서"}),(0,t.jsx)("div",{className:"pricing-feature",children:"✓ 변호사 브리핑 자료로 활용 가능"}),(0,t.jsx)("div",{className:"pricing-feature",children:"✓ 버전 히스토리"}),(0,t.jsx)("div",{className:"pricing-feature",children:"✓ 양측 확인 서명"})]}),(0,t.jsx)("button",{type:"button",className:"btn btn-ghost pricing-cta-btn",onClick:()=>e.push("/agreement/start?plan=basic"),children:"Basic으로 시작하기"})]}),(0,t.jsxs)("div",{className:"pricing-card premium",children:[(0,t.jsx)("div",{className:"pricing-recommended",children:"추천"}),(0,t.jsx)("div",{className:"pricing-plan-name",children:"Premium"}),(0,t.jsx)("div",{className:"pricing-amount",children:"₩329,000"}),(0,t.jsx)("div",{className:"pricing-per",children:"2인 기준 · 1인당 ₩164,500"}),(0,t.jsx)("div",{className:"pricing-divider"}),(0,t.jsx)("div",{className:"pricing-category-label",children:"포함 카테고리 (6개 전체)"}),(0,t.jsx)("div",{className:"pricing-categories",children:[...a,...s].map(e=>(0,t.jsxs)("div",{className:"pricing-cat-item",children:[(0,t.jsx)("span",{className:"pricing-cat-icon",children:e.icon}),(0,t.jsxs)("div",{children:[(0,t.jsxs)("div",{className:"pricing-cat-title",children:[e.title," ",(0,t.jsx)("span",{className:"pricing-cat-desc",children:e.desc})]}),(0,t.jsx)("div",{className:"pricing-cat-detail",children:e.detail})]})]},e.title))}),(0,t.jsx)("div",{className:"pricing-divider"}),(0,t.jsxs)("div",{className:"pricing-features",children:[(0,t.jsx)("div",{className:"pricing-feature",children:"✓ Basic 전체 포함"}),(0,t.jsx)("div",{className:"pricing-feature",children:"✓ 권한·돈·종료 법적 핵심 영역 추가"}),(0,t.jsx)("div",{className:"pricing-feature",children:"✓ 빠짐없는 6개 카테고리 합의안"}),(0,t.jsx)("div",{className:"pricing-feature premium-feature",children:"✓ 스타트업 전문 변호사 컨택 가능"})]}),(0,t.jsx)("button",{type:"button",className:"btn btn-primary pricing-cta-btn",onClick:()=>e.push("/agreement/start?plan=premium"),children:"Premium으로 시작하기 →"}),(0,t.jsxs)("div",{className:"pricing-lawyer-note",children:["변호사 검토는 선택 사항이며 별도 비용이 발생합니다.",(0,t.jsx)("br",{}),"시중 주주간계약서 대비 합리적인 비용으로 연결됩니다."]})]})]})]}),(0,t.jsxs)("div",{className:"upgrade-note-block",children:[(0,t.jsx)("span",{className:"upgrade-note-icon",children:"💡"}),(0,t.jsxs)("p",{children:["Basic으로 시작하고 나중에 Premium으로 업그레이드할 수 있습니다. 업그레이드 시 차액 ",(0,t.jsx)("strong",{children:"₩200,000"}),"만 추가됩니다."]})]})]}),(0,t.jsx)(i.Footer,{}),(0,t.jsx)("style",{dangerouslySetInnerHTML:{__html:`
        .agreement-preview-hero {
          padding: 80px 0 48px;
          text-align: center;
        }
        .agreement-badge {
          display: inline-block;
          background: linear-gradient(120deg, #5858e2, #777ef0);
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
          background: linear-gradient(to right, rgba(139,92,246,0.1), rgba(139,92,246,0.05));
          border: 1px solid rgba(139,92,246,0.2);
          color: #7c3aed;
          padding: 10px 20px;
          border-radius: 999px;
          font-size: 0.85rem;
          font-weight: 600;
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
          border: 1px solid #e2e8f0;
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
          border: 1px solid #e2e8f0;
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
          border: 2px solid #e2e8f0;
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
      `}})]})}e.s(["default",()=>l])}]);