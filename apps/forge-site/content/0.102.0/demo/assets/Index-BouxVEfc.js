import{aI as C,k as d,F as I,M as S}from"./index-CqnmMPAT.js";import{T as B}from"./TableMain.vue-DVcsMuy8.js";import{K as F,O as T,R as l,ap as E,M as L,S as t,ad as o,Q as n,ae as g,q as a,r as u}from"./vue-BtEJNpb6.js";import"./lodash-9CjMmqbV.js";import"./use-channel-viewport-height-DxIJsy8o.js";import"./use-data-view-field-map-DHJx5Cdw.js";import"./index-D-aFUjYu.js";import"./ActionBtnGroup.vue-lHsL6yQW.js";import"./AutoRefreshGroup.vue-DUt1E__D.js";import"./SlotLayoutTemplate.vue-6virBVsd.js";import"./use-grid-layout-DWgU1n_x.js";import"./index-B-Ju3JpJ.js";import"./index-2h6Tsm13.js";import"./index-BtpBouhU.js";const m="dc-family-anchor-demo",P=`
/* 表单族（FormMain）：每个 form-item 左侧主色强调轨 + 标签加重 */
.dc-form-main .el-form-item {
  padding-left: 10px;
  border-left: 3px solid var(--dc-core-primary-color, var(--el-color-primary));
}
.dc-form-main .el-form-item__label { font-weight: 600; }

/* 表格族（TableMain）：表头主色淡底 + 大写字距 + 加粗；行 hover 主色淡染 */
.dc-table-main .el-table th.el-table__cell {
  background: var(--el-color-primary-light-9);
  text-transform: uppercase;
  letter-spacing: .04em;
  font-weight: 700;
}
.dc-table-main .el-table .el-table__row:hover > td.el-table__cell {
  background: var(--el-color-primary-light-9);
}

/* 操作按钮族（ActionBtn）：胶囊形 + 字距（一眼区别于常规方角按钮）。
   .dc-action-btn.el-button 双类同元素提特异性(0,2,0)，确定性压过 EP/admin .el-button 半径(0,1,0)。 */
.dc-action-btn.el-button {
  border-radius: 999px;
  letter-spacing: .03em;
  font-weight: 600;
}

/* 弹窗族（ConfirmModal + DetailModal 经 .dc-confirm-modal 同时命中）：标题区主色顶栏 */
.dc-confirm-modal .el-dialog__header {
  border-top: 3px solid var(--dc-core-primary-color, var(--el-color-primary));
  background: var(--el-color-primary-light-9);
}
`;function v(){if(typeof document>"u"||document.getElementById(m))return;const r=document.createElement("style");r.id=m,r.textContent=P,document.head.appendChild(r)}function b(){var r;typeof document>"u"||(r=document.getElementById(m))==null||r.remove()}function x(){return typeof document>"u"?!1:!!document.getElementById(m)}const j={style:{padding:"16px","max-width":"980px"}},D={style:{margin:"12px 0"}},N={style:{"margin-left":"12px",color:"var(--el-text-color-secondary)"}},V={style:{height:"320px"}},Z=F({__name:"Index",setup(r){const s=u(!1),f=()=>{s.value=x()};C(i=>{i.isActivated?v():b(),f()});const w=()=>{x()?b():v(),f()},_=u({name:"张三",email:"zhangsan@example.com"}),M=[{key:"name",label:"姓名"},{key:"email",label:"邮箱"}],c=Array.from({length:6},(i,e)=>({id:e+1,name:`项目-${e+1}`,status:e%2===0?"active":"archived"})),h=()=>new Promise(i=>{i({items:c,page:{totalRecord:c.length}})}),k=[{type:"index",label:"序号"},{prop:"name",label:"名称"},{prop:"status",label:"状态"}],p=u(!1);return(i,e)=>{const A=E("AppPage");return L(),T(A,null,{default:l(()=>[t("div",j,[e[9]||(e[9]=t("h2",null,"dc- 逐族定向锚点示范（T8）",-1)),e[10]||(e[10]=t("p",{style:{color:"var(--el-text-color-secondary)","line-height":"1.7"}},[o(" 本页经 "),t("code",null,"useActivated"),o(" 在"),t("strong",null,"激活时注入"),o("逐族 "),t("code",null,"<style>"),o("（命中 "),t("code",null,".dc-form-main"),o(" / "),t("code",null,".dc-table-main"),o(" / "),t("code",null,".dc-action-btn"),o(" / "),t("code",null,".dc-confirm-modal"),o(" 锚点），"),t("strong",null,"失活/卸载时移除"),o("。 离开本页样式自动撤销（可卸载性），各族回原样。 ")],-1)),t("div",D,[n(a(d),{type:"primary",onClick:w},{default:l(()=>[o(g(s.value?"关闭逐族定制":"开启逐族定制"),1)]),_:1}),t("span",N,[e[2]||(e[2]=o(" 当前注入状态：",-1)),t("strong",null,g(s.value?"已注入（生效）":"未注入（原样）"),1)]),n(a(d),{style:{"margin-left":"12px"},onClick:e[0]||(e[0]=y=>p.value=!0)},{default:l(()=>[...e[3]||(e[3]=[o(" 打开弹窗族 ",-1)])]),_:1})]),e[11]||(e[11]=t("h3",null,"表单族 · FormMain（→ form-item 左主色轨）",-1)),n(a(I),{list:M,data:_.value},null,8,["data"]),e[12]||(e[12]=t("h3",null,"表格族 · TableMain（→ 表头主色淡底大写）",-1)),t("div",V,[n(a(B),{api:h,columns:k,rowKey:"id",showToolbar:!1,showPager:!1})]),e[13]||(e[13]=t("h3",null,"操作按钮族 · ActionBtn（→ 胶囊形）",-1)),t("div",null,[n(a(d),{type:"primary"},{default:l(()=>[...e[4]||(e[4]=[o("主操作",-1)])]),_:1}),n(a(d),{style:{"margin-left":"8px"}},{default:l(()=>[...e[5]||(e[5]=[o("次操作",-1)])]),_:1}),n(a(d),{type:"danger",style:{"margin-left":"8px"}},{default:l(()=>[...e[6]||(e[6]=[o("危险操作",-1)])]),_:1})]),n(a(S),{show:p.value,"onUpdate:show":e[1]||(e[1]=y=>p.value=y)},{title:l(()=>[...e[7]||(e[7]=[o("弹窗族 · dc-confirm-modal",-1)])]),default:l(()=>[e[8]||(e[8]=t("div",{style:{padding:"8px 0"}},[o(" 本弹窗标题区由 "),t("code",null,".dc-confirm-modal .el-dialog__header"),o(" 命中 → 主色顶栏。 ")],-1))]),_:1},8,["show"])])]),_:1})}}});export{Z as default};
