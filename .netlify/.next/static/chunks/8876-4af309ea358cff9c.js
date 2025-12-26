"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[8876],{1433:function(e,t,r){r.d(t,{Z:function(){return l}});var n=r(3827),a=r(4090),o=r(8670),s=r(8994),i=r(2457);function l(e){let{onLocationSelect:t,placeholder:r="Search for neighborhoods or buildings...",showIcon:l=!1,type:u="general"}=e,[c,d]=(0,a.useState)(!1),[h,p]=(0,a.useState)(""),[m,f]=(0,a.useState)([]),[y,g]=(0,a.useState)(!1),[b,x]=(0,a.useState)(!1),[k,w]=(0,a.useState)(-1),v=(0,a.useRef)(),j=(0,a.useRef)(null);(0,a.useEffect)(()=>{d(!0)},[]),(0,a.useEffect)(()=>{let e=e=>{j.current&&!j.current.contains(e.target)&&x(!1)};return document.addEventListener("mousedown",e),()=>document.removeEventListener("mousedown",e)},[]);let Z=async e=>{if(!e||e.length<2){f([]);return}g(!0);try{let t=await fetch("https://photon.komoot.io/api/?q=".concat(encodeURIComponent(e+" Canada"),"&limit=20&lang=en&lat=56.1304&lon=-106.3468"),{signal:AbortSignal.timeout(8e3),headers:{Accept:"application/json"}});if(!t.ok)throw Error("Search failed");let r=((await t.json()).features||[]).filter(e=>{let t=e.properties.country;return"Canada"===t||"CA"===t});"neighborhood"===u&&(r=r.filter(e=>{let t=e.properties;return!t.housenumber&&("place"===t.osm_key||!t.street)})),f(r.slice(0,8)),x(r.length>0)}catch(e){f([]),x(!1)}finally{g(!1)}},N=e=>{p(e),w(-1),v.current&&clearTimeout(v.current),v.current=setTimeout(()=>{Z(e)},300)},S=e=>{let r=e.properties,n=e.geometry.coordinates,a="";a=r.housenumber&&r.street?"".concat(r.housenumber," ").concat(r.street):r.street?r.street:r.name||"";let o=r.city||"",s=r.state||"",i=r.name||o||a,l="".concat(i).concat(o?", "+o:"").concat(s?", "+s:"");p(l),x(!1),t(l,{name:i,address:a||i,city:o,province:s,latitude:n[1],longitude:n[0]})};return c?(0,n.jsxs)("div",{ref:j,className:"relative w-full",children:[(0,n.jsx)("form",{onSubmit:e=>{e.preventDefault(),h.trim()&&(t(h),x(!1))},children:(0,n.jsxs)("div",{className:"relative",children:[l&&(0,n.jsx)(o.Z,{className:"absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10"}),(0,n.jsx)("input",{type:"text",value:h,onChange:e=>N(e.target.value),onKeyDown:e=>{"ArrowDown"===e.key?(e.preventDefault(),w(e=>e<m.length-1?e+1:e)):"ArrowUp"===e.key?(e.preventDefault(),w(e=>e>0?e-1:-1)):"Enter"===e.key&&k>=0?(e.preventDefault(),S(m[k])):"Escape"===e.key&&x(!1)},onFocus:()=>{m.length>0&&x(!0)},placeholder:r,className:"w-full ".concat(l?"pl-12":"pl-4"," pr-28 py-4 bg-white border-none rounded-xl focus:outline-none focus:ring-0 text-gray-900 placeholder-gray-400 text-base")}),y&&(0,n.jsx)("div",{className:"absolute right-24 top-1/2 -translate-y-1/2",children:(0,n.jsx)(s.Z,{className:"w-5 h-5 text-primary-500 animate-spin"})}),(0,n.jsx)("button",{type:"submit",className:"absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-primary-600 hover:to-primary-700 transition-all shadow-md",children:"Search"})]})}),b&&m.length>0&&(0,n.jsx)("div",{className:"absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 max-h-96 overflow-y-auto",children:m.map((e,t)=>{let r=e.properties,a=t===k,o=r.name||r.street||"Unknown",s=[r.city,r.state].filter(Boolean).join(", ");return r.housenumber&&r.street&&(o="".concat(r.housenumber," ").concat(r.street),s=[r.name,r.city,r.state].filter(Boolean).join(", ")),(0,n.jsx)("button",{type:"button",onClick:()=>S(e),className:"w-full px-4 py-3 text-left hover:bg-primary-50 transition-colors border-b border-gray-100 last:border-b-0 ".concat(a?"bg-primary-50":""),children:(0,n.jsxs)("div",{className:"flex items-start space-x-3",children:[(0,n.jsx)(i.Z,{className:"w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5"}),(0,n.jsxs)("div",{className:"flex-1 min-w-0",children:[(0,n.jsx)("p",{className:"font-semibold text-gray-900 truncate",children:o}),s&&(0,n.jsx)("p",{className:"text-sm text-gray-600 truncate",children:s})]})]})},t)})}),b&&!y&&h.length>=3&&0===m.length&&(0,n.jsx)("div",{className:"absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 z-50",children:(0,n.jsx)("p",{className:"text-gray-500 text-sm text-center",children:"No results found in Canada. Try a different search term."})})]}):(0,n.jsx)("div",{className:"relative w-full",children:(0,n.jsxs)("div",{className:"relative",children:[(0,n.jsx)("input",{type:"text",disabled:!0,placeholder:r,className:"w-full ".concat(l?"pl-12":"pl-4"," pr-28 py-4 bg-white border-none rounded-xl focus:outline-none focus:ring-0 text-gray-900 placeholder-gray-400 text-base")}),(0,n.jsx)("button",{type:"button",disabled:!0,className:"absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors",children:"Search"})]})})}},5922:function(e,t,r){r.d(t,{L:function(){return l},O:function(){return i}});var n=r(6238);let a="https://eehtzdpzbjsuendgwnwy.supabase.co",o="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlaHR6ZHB6YmpzdWVuZGd3bnd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNDQ5ODgsImV4cCI6MjA3NTgyMDk4OH0.4YjQFYHSPF2EVEqwk54ulaOkGYLvpogbSyfYKYbIOpQ",s=a&&o,i=(0,n.eI)(a,o,{auth:{persistSession:!0,autoRefreshToken:!0,detectSessionInUrl:!0}}),l=s},7461:function(e,t,r){r.d(t,{Z:function(){return s}});var n=r(4090),a={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let o=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase().trim(),s=(e,t)=>{let r=(0,n.forwardRef)((r,s)=>{let{color:i="currentColor",size:l=24,strokeWidth:u=2,absoluteStrokeWidth:c,className:d="",children:h,...p}=r;return(0,n.createElement)("svg",{ref:s,...a,width:l,height:l,stroke:i,strokeWidth:c?24*Number(u)/Number(l):u,className:["lucide","lucide-".concat(o(e)),d].join(" "),...p},[...t.map(e=>{let[t,r]=e;return(0,n.createElement)(t,r)}),...Array.isArray(h)?h:[h]])});return r.displayName="".concat(e),r}},8025:function(e,t,r){r.d(t,{Z:function(){return n}});/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let n=(0,r(7461).Z)("ArrowRight",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]])},7805:function(e,t,r){r.d(t,{Z:function(){return n}});/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let n=(0,r(7461).Z)("ChevronRight",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]])},8994:function(e,t,r){r.d(t,{Z:function(){return n}});/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let n=(0,r(7461).Z)("Loader2",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]])},2457:function(e,t,r){r.d(t,{Z:function(){return n}});/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let n=(0,r(7461).Z)("MapPin",[["path",{d:"M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z",key:"2oe9fu"}],["circle",{cx:"12",cy:"10",r:"3",key:"ilqhr7"}]])},8670:function(e,t,r){r.d(t,{Z:function(){return n}});/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let n=(0,r(7461).Z)("Search",[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["path",{d:"m21 21-4.3-4.3",key:"1qie3q"}]])},5879:function(e,t,r){r.d(t,{Z:function(){return n}});/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let n=(0,r(7461).Z)("Star",[["polygon",{points:"12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2",key:"8f66p6"}]])},632:function(e,t,r){r.d(t,{Z:function(){return n}});/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let n=(0,r(7461).Z)("Upload",[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"17 8 12 3 7 8",key:"t8dd8p"}],["line",{x1:"12",x2:"12",y1:"3",y2:"15",key:"widbto"}]])},4059:function(e,t,r){r.d(t,{Z:function(){return n}});/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let n=(0,r(7461).Z)("Users",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["path",{d:"M16 3.13a4 4 0 0 1 0 7.75",key:"1da9ce"}]])},9251:function(e,t,r){r.d(t,{Z:function(){return n}});/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let n=(0,r(7461).Z)("Volume2",[["polygon",{points:"11 5 6 9 2 9 2 15 6 15 11 19 11 5",key:"16drj5"}],["path",{d:"M15.54 8.46a5 5 0 0 1 0 7.07",key:"ltjumu"}],["path",{d:"M19.07 4.93a10 10 0 0 1 0 14.14",key:"1kegas"}]])},2235:function(e,t,r){r.d(t,{Z:function(){return n}});/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let n=(0,r(7461).Z)("X",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]])},7907:function(e,t,r){var n=r(5313);r.o(n,"notFound")&&r.d(t,{notFound:function(){return n.notFound}}),r.o(n,"useParams")&&r.d(t,{useParams:function(){return n.useParams}}),r.o(n,"usePathname")&&r.d(t,{usePathname:function(){return n.usePathname}}),r.o(n,"useRouter")&&r.d(t,{useRouter:function(){return n.useRouter}}),r.o(n,"useSearchParams")&&r.d(t,{useSearchParams:function(){return n.useSearchParams}})}}]);