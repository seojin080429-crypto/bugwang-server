<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>부광고 3-1 대시보드</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<style>
:root {
  --blue:#0066cc; --blue-focus:#0071e3; --blue-dark:#2997ff;
  --ink:#1d1d1f; --ink-80:#333; --ink-48:#7a7a7a;
  --canvas:#fff; --parchment:#f5f5f7; --pearl:#fafafc;
  --tile-1:#272729; --hairline:#e0e0e0; --divider:rgba(0,0,0,0.08);
  --on-dark:#fff; --muted-dark:#ccc;
  --sidebar-w:240px; --nav-h:44px;
  --radius-sm:8px; --radius-md:11px; --radius-lg:18px; --radius-pill:9999px;
  --t:.18s ease;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{font-size:17px;-webkit-font-smoothing:antialiased}
body{font-family:'Inter','Noto Sans KR',system-ui,sans-serif;font-weight:400;line-height:1.47;letter-spacing:-.022em;color:var(--ink);background:var(--parchment);min-height:100vh}
a{color:var(--blue);text-decoration:none}
button{cursor:pointer;border:none;background:none;font-family:inherit}
input,textarea,select{font-family:inherit;font-size:1rem;outline:none}

/* AUTH */
#auth-screen{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--parchment);padding:24px}
.auth-card{background:var(--canvas);border:1px solid var(--hairline);border-radius:var(--radius-lg);padding:48px 40px;width:100%;max-width:420px;box-shadow:0 4px 40px rgba(0,0,0,.08)}
.auth-logo{text-align:center;margin-bottom:28px}
.auth-logo-mark{display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;background:var(--ink);border-radius:14px;margin-bottom:12px}
.auth-logo-mark svg{width:28px;height:28px;fill:var(--canvas)}
.auth-title{font-size:22px;font-weight:600;letter-spacing:-.022em;color:var(--ink);margin-bottom:4px}
.auth-sub{font-size:14px;color:var(--ink-48);letter-spacing:-.013em}
.auth-field{margin-bottom:12px}
.auth-label{display:block;font-size:13px;font-weight:600;color:var(--ink-80);letter-spacing:-.013em;margin-bottom:5px}
.auth-input{width:100%;padding:10px 14px;border:1px solid var(--hairline);border-radius:var(--radius-md);font-size:.94rem;color:var(--ink);background:var(--canvas);transition:border-color var(--t)}
.auth-input:focus{border-color:var(--blue-focus);box-shadow:0 0 0 3px rgba(0,102,204,.12)}
.auth-input::placeholder{color:var(--ink-48)}
.auth-select{width:100%;padding:10px 14px;border:1px solid var(--hairline);border-radius:var(--radius-md);font-size:.94rem;color:var(--ink);background:var(--canvas);appearance:none;cursor:pointer}
.auth-select:focus{border-color:var(--blue-focus);box-shadow:0 0 0 3px rgba(0,102,204,.12)}
.auth-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.btn-primary{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:11px 22px;background:var(--blue);color:#fff;font-size:1rem;font-weight:400;border-radius:var(--radius-pill);transition:opacity var(--t),transform var(--t);letter-spacing:-.022em}
.btn-primary:hover{opacity:.88}
.btn-primary:active{transform:scale(.96)}
.btn-primary.full{width:100%}
.auth-error{margin-top:10px;padding:9px 13px;background:#fff2f2;border:1px solid #ffd0d0;border-radius:var(--radius-sm);font-size:13px;color:#c00;display:none}
.auth-hint{margin-top:14px;text-align:center;font-size:13px;color:var(--ink-48)}
.auth-divider{height:1px;background:var(--hairline);margin:16px 0}
.auth-section-title{font-size:13px;font-weight:600;color:var(--ink-48);letter-spacing:.03em;text-transform:uppercase;margin-bottom:10px}
.auth-optional{font-size:11px;color:var(--ink-48);margin-left:4px;font-weight:400}

/* NAME SETUP */
#name-setup-screen{min-height:100vh;display:none;flex-direction:column;align-items:center;justify-content:center;background:var(--parchment);padding:24px}
#name-setup-screen.visible{display:flex}
.name-setup-emoji{font-size:40px;margin-bottom:12px;text-align:center}

/* APP SHELL */
#app-shell{display:none;min-height:100vh}
#app-shell.visible{display:flex}

/* SIDEBAR */
.sidebar{width:var(--sidebar-w);min-height:100vh;background:var(--canvas);border-right:1px solid var(--hairline);display:flex;flex-direction:column;position:fixed;left:0;top:0;bottom:0;z-index:50;transition:transform var(--t)}
.sidebar-header{height:var(--nav-h);display:flex;align-items:center;padding:0 20px;border-bottom:1px solid var(--hairline);gap:10px;flex-shrink:0}
.sidebar-wordmark{font-size:15px;font-weight:600;letter-spacing:-.022em;color:var(--ink)}
.sidebar-wordmark span{color:var(--blue)}
.sidebar-nav{flex:1;padding:12px 0;overflow-y:auto}
.nav-group{margin-bottom:4px}
.nav-group-label{font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--ink-48);padding:8px 20px 4px}
.nav-item{display:flex;align-items:center;gap:10px;padding:8px 20px;font-size:14px;font-weight:400;color:var(--ink-80);cursor:pointer;border:none;width:100%;text-align:left;letter-spacing:-.013em;background:none;transition:background var(--t),color var(--t)}
.nav-item:hover{background:var(--parchment);color:var(--ink)}
.nav-item.active{color:var(--blue);background:rgba(0,102,204,.06);font-weight:600}
.nav-item svg{width:16px;height:16px;flex-shrink:0;stroke:currentColor;fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.sidebar-footer{border-top:1px solid var(--hairline);padding:12px 20px;flex-shrink:0}
.user-row{display:flex;align-items:center;gap:10px;cursor:pointer;padding:6px 8px;border-radius:var(--radius-sm);transition:background var(--t)}
.user-row:hover{background:var(--parchment)}
.user-avatar{width:30px;height:30px;border-radius:50%;background:var(--ink);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:#fff;flex-shrink:0}
.user-info{flex:1;min-width:0}
.user-name{font-size:13px;font-weight:600;color:var(--ink);letter-spacing:-.013em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.user-id{font-size:11px;color:var(--ink-48)}

/* TOPBAR */
.topbar{display:none;position:fixed;top:0;left:0;right:0;height:var(--nav-h);background:rgba(245,245,247,.85);backdrop-filter:saturate(180%) blur(20px);-webkit-backdrop-filter:saturate(180%) blur(20px);border-bottom:1px solid var(--hairline);align-items:center;justify-content:space-between;padding:0 20px;z-index:100}
.topbar-wordmark{font-size:15px;font-weight:600;letter-spacing:-.022em;color:var(--ink)}
.topbar-wordmark span{color:var(--blue)}
.hamburger-btn{display:flex;flex-direction:column;justify-content:center;gap:5px;width:28px;height:28px;padding:2px;background:none;border:none;cursor:pointer}
.hamburger-btn span{display:block;height:1.5px;background:var(--ink);border-radius:2px}
.sidebar-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:49}
.sidebar-overlay.visible{display:block}

/* MAIN */
.main-content{margin-left:var(--sidebar-w);flex:1;min-height:100vh;background:var(--parchment)}
.page{display:none;padding:32px 40px;max-width:1100px}
.page.active{display:block}
.page-title{font-size:28px;font-weight:600;letter-spacing:-.022em;color:var(--ink);margin-bottom:4px}
.page-sub{font-size:15px;color:var(--ink-48);letter-spacing:-.022em;margin-bottom:24px}

/* CARDS */
.card{background:var(--canvas);border:1px solid var(--hairline);border-radius:var(--radius-lg);padding:20px}
.card-title{font-size:15px;font-weight:600;letter-spacing:-.022em;color:var(--ink);margin-bottom:3px}
.card-sub{font-size:13px;color:var(--ink-48);letter-spacing:-.013em;margin-bottom:16px}

/* GRID */
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}
.grid-4{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:14px}

/* STAT TILES */
.stat-tile{background:var(--canvas);border:1px solid var(--hairline);border-radius:var(--radius-lg);padding:18px 20px}
.stat-label{font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--ink-48);margin-bottom:6px}
.stat-num{font-size:28px;font-weight:600;letter-spacing:-.022em;color:var(--ink);line-height:1.1}
.stat-num.blue{color:var(--blue)}
.stat-num.orange{color:#e87820}
.stat-detail{font-size:12px;color:var(--ink-48);margin-top:3px}

/* D-DAY */
.dday-tile{background:var(--tile-1);border-radius:var(--radius-lg);padding:36px;text-align:center;margin-bottom:14px}
.dday-label{font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--muted-dark);margin-bottom:10px}
.dday-num{font-size:72px;font-weight:600;letter-spacing:-.03em;color:var(--on-dark);line-height:1;margin-bottom:6px}
.dday-sub{font-size:15px;color:var(--muted-dark);letter-spacing:-.022em}

/* PERIOD */
.period-list{display:flex;flex-direction:column;gap:5px}
.period-row{display:flex;align-items:center;gap:14px;padding:10px 14px;background:var(--parchment);border-radius:var(--radius-sm);border:1px solid transparent;transition:border-color var(--t)}
.period-row.now{background:rgba(0,102,204,.05);border-color:rgba(0,102,204,.25)}
.period-num{font-size:11px;font-weight:600;color:var(--ink-48);width:18px;text-align:center;flex-shrink:0}
.period-row.now .period-num{color:var(--blue)}
.period-subject{flex:1;font-size:14px;color:var(--ink)}
.period-time{font-size:12px;color:var(--ink-48)}
.period-badge{font-size:10px;font-weight:600;padding:2px 7px;border-radius:var(--radius-pill);background:var(--blue);color:#fff}
.period-badge.move{background:var(--ink-48)}

/* MEAL */
.meal-cols{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:14px}
.meal-col{background:var(--parchment);border-radius:var(--radius-sm);padding:12px 14px}
.meal-col-label{font-size:10px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--ink-48);margin-bottom:7px}
.meal-col ul{list-style:none}
.meal-col li{font-size:12px;color:var(--ink);padding:2px 0;border-bottom:1px solid var(--hairline)}
.meal-col li:last-child{border-bottom:none}

/* NOTICE */
.notice-list{display:flex;flex-direction:column}
.notice-item{border-bottom:1px solid var(--hairline)}
.notice-item:last-child{border-bottom:none}
.notice-item-row{display:flex;align-items:center;gap:12px;padding:13px 0;cursor:pointer;transition:opacity var(--t)}
.notice-item-row:hover{opacity:.7}
.notice-icon{width:34px;height:34px;border-radius:var(--radius-sm);background:var(--parchment);display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;border:1px solid var(--hairline)}
.notice-title{flex:1;font-size:13px;color:var(--ink)}
.notice-date{font-size:11px;color:var(--ink-48)}
.badge-new{font-size:9px;font-weight:600;padding:2px 5px;background:var(--blue);color:#fff;border-radius:var(--radius-pill);margin-left:5px}
.notice-content{display:none;padding:0 0 16px 46px;font-size:13px;color:var(--ink-80);line-height:1.6;white-space:pre-wrap}
.notice-content.open{display:block}
.notice-meta-row{display:flex;align-items:center;gap:8px;margin-top:8px}
.notice-author{font-size:11px;color:var(--ink-48)}
.notice-del-btn{font-size:11px;color:var(--ink-48);background:none;border:none;cursor:pointer;margin-left:auto;transition:color var(--t)}
.notice-del-btn:hover{color:#c00}

/* NEWS */
.news-list{display:flex;flex-direction:column}
.news-item{display:flex;align-items:flex-start;gap:12px;padding:14px 0;border-bottom:1px solid var(--hairline);cursor:pointer}
.news-item:last-child{border-bottom:none}
.news-tag{font-size:10px;font-weight:600;padding:2px 8px;border-radius:var(--radius-pill);background:rgba(0,102,204,.1);color:var(--blue);white-space:nowrap;margin-top:1px;flex-shrink:0}
.news-title{font-size:13px;color:var(--ink);line-height:1.4;margin-bottom:2px}
.news-date{font-size:11px;color:var(--ink-48)}

/* SPACER */
.spacer{margin-bottom:20px}
.section-hd{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:12px}
.section-hd-title{font-size:18px;font-weight:600;letter-spacing:-.022em;color:var(--ink)}
.section-hd-link{font-size:13px;color:var(--blue);cursor:pointer}
.section-hd-link:hover{text-decoration:underline}

/* TOAST */
#toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(80px);background:var(--ink);color:#fff;font-size:13px;padding:10px 20px;border-radius:var(--radius-pill);box-shadow:0 4px 24px rgba(0,0,0,.2);z-index:999;transition:transform .3s ease,opacity .3s ease;opacity:0;pointer-events:none;white-space:nowrap}
#toast.show{transform:translateX(-50%) translateY(0);opacity:1}

/* MODAL */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);display:none;align-items:center;justify-content:center;z-index:200;padding:20px}
.modal-overlay.open{display:flex}
.modal{background:var(--canvas);border-radius:var(--radius-lg);padding:28px;width:100%;max-width:400px;box-shadow:0 8px 60px rgba(0,0,0,.15)}
.modal-title{font-size:18px;font-weight:600;letter-spacing:-.022em;margin-bottom:20px;color:var(--ink)}
.modal-close{float:right;color:var(--ink-48);font-size:20px;cursor:pointer;background:none;border:none;margin-top:-4px}
.modal-field{margin-bottom:12px}
.modal-label{display:block;font-size:12px;font-weight:600;color:var(--ink-80);margin-bottom:5px;letter-spacing:.01em;text-transform:uppercase}
.modal-input{width:100%;padding:9px 13px;border:1px solid var(--hairline);border-radius:var(--radius-md);font-size:.94rem;color:var(--ink);background:var(--canvas);transition:border-color var(--t)}
.modal-input:focus{border-color:var(--blue-focus);box-shadow:0 0 0 3px rgba(0,102,204,.12)}
.modal-actions{display:flex;gap:8px;margin-top:20px}
.btn-ghost{padding:9px 18px;background:var(--parchment);color:var(--ink-80);font-size:14px;border-radius:var(--radius-pill);border:1px solid var(--hairline);transition:background var(--t)}
.btn-ghost:hover{background:var(--hairline)}
.btn-danger{padding:9px 18px;background:rgba(200,0,0,.08);color:#c00;font-size:14px;border-radius:var(--radius-pill);border:1px solid rgba(200,0,0,.2)}
.btn-danger:hover{background:rgba(200,0,0,.14)}

/* ══════ PLANNER ══════ */
.planner-layout{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start}
.planner-left{}
.planner-right{}

/* stats bar */
.study-stats-bar{display:grid;grid-template-columns:repeat(5,1fr);gap:0;background:var(--canvas);border:1px solid var(--hairline);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:14px}
.study-stat-cell{padding:14px 12px;text-align:center;border-right:1px solid var(--hairline)}
.study-stat-cell:last-child{border-right:none}
.study-stat-label{font-size:10px;color:var(--ink-48);margin-bottom:4px;font-weight:500}
.study-stat-val{font-size:17px;font-weight:600;letter-spacing:-.022em;color:var(--ink)}
.study-stat-val.blue{color:var(--blue)}
.study-stat-val.orange{color:#e87820}

/* subject list */
.subject-list{display:flex;flex-direction:column;gap:8px}
.subject-block{background:var(--canvas);border:1px solid var(--hairline);border-radius:var(--radius-lg);overflow:hidden}
.subject-header{display:flex;align-items:center;gap:10px;padding:12px 16px;cursor:pointer;transition:background var(--t)}
.subject-header:hover{background:var(--parchment)}
.subject-dot{width:9px;height:9px;border-radius:50%;flex-shrink:0}
.subject-name-txt{flex:1;font-size:14px;font-weight:600;color:var(--ink)}
.subject-total-time{font-size:13px;font-weight:600;color:var(--ink-48);font-variant-numeric:tabular-nums}
.subject-total-time.running{color:var(--blue)}
.subject-add-btn{width:24px;height:24px;border-radius:50%;border:1px solid var(--hairline);display:flex;align-items:center;justify-content:center;color:var(--ink-48);font-size:16px;transition:background var(--t),color var(--t)}
.subject-add-btn:hover{background:var(--blue);color:#fff;border-color:var(--blue)}
.subject-tasks{border-top:1px solid var(--hairline)}
.task-row{display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--hairline);background:var(--canvas)}
.task-row:last-child{border-bottom:none}
.task-play-btn{width:30px;height:30px;border-radius:50%;border:1.5px solid var(--hairline);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all var(--t);background:var(--canvas)}
.task-play-btn:hover{border-color:var(--blue);color:var(--blue)}
.task-play-btn.running{background:var(--blue);border-color:var(--blue);color:#fff}
.task-play-btn svg{width:12px;height:12px;fill:currentColor;stroke:none;margin-left:2px}
.task-play-btn.running svg{margin-left:0}
.task-name{flex:1;font-size:13px;color:var(--ink)}
.task-time{font-size:12px;font-weight:600;color:var(--ink-48);font-variant-numeric:tabular-nums;min-width:52px;text-align:right}
.task-time.running{color:var(--blue)}
.task-done-check{width:16px;height:16px;border-radius:50%;border:1.5px solid var(--hairline);flex-shrink:0;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all var(--t)}
.task-done-check.checked{background:var(--blue);border-color:var(--blue)}
.task-done-check.checked::after{content:'';display:block;width:4px;height:7px;border:1.5px solid #fff;border-top:none;border-left:none;transform:rotate(42deg) translate(0,-1px)}
.task-del-btn{color:var(--ink-48);font-size:14px;padding:0 2px;background:none;border:none;cursor:pointer;opacity:0;transition:opacity var(--t),color var(--t)}
.task-row:hover .task-del-btn{opacity:1}
.task-del-btn:hover{color:#c00}
.task-edit-btn{color:var(--ink-48);padding:0 2px;background:none;border:none;cursor:pointer;opacity:0;transition:opacity var(--t),color var(--t);display:flex;align-items:center}
.task-row:hover .task-edit-btn{opacity:1}
.task-edit-btn:hover{color:var(--blue)}

/* FULLSCREEN TIMER */
#timer-fullscreen{position:fixed;inset:0;background:#0d0f1a;z-index:300;display:none;flex-direction:column;}
#timer-fullscreen.open{display:flex;}
.tf-topbar{display:flex;align-items:center;justify-content:space-between;padding:16px 28px;border-bottom:1px solid rgba(255,255,255,.08)}
.tf-top-left{font-size:17px;font-weight:600;color:#fff;letter-spacing:-.022em}
.tf-top-left span{color:#5b8df6;margin-right:8px}
.tf-top-right{display:flex;align-items:center;gap:16px}
.tf-date{font-size:13px;color:rgba(255,255,255,.5)}
.tf-close{display:flex;align-items:center;gap:6px;padding:7px 14px;background:rgba(255,255,255,.08);border:none;border-radius:var(--radius-pill);color:#fff;font-size:13px;cursor:pointer;transition:background var(--t)}
.tf-close:hover{background:rgba(255,255,255,.15)}
.tf-body{display:grid;grid-template-columns:420px 1fr;flex:1;overflow:hidden}
.tf-left{padding:28px;border-right:1px solid rgba(255,255,255,.08);overflow-y:auto;display:flex;flex-direction:column;gap:16px}
.tf-focus-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:var(--radius-lg);padding:20px}
.tf-focus-label{font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:rgba(255,255,255,.4);margin-bottom:10px}
.tf-focus-time{font-size:56px;font-weight:600;letter-spacing:-.04em;color:#fff;line-height:1;margin-bottom:16px;font-variant-numeric:tabular-nums}
.tf-task-progress{display:flex;flex-direction:column;gap:8px}
.tf-task-bar-row{display:flex;align-items:center;gap:10px}
.tf-task-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.tf-task-bar-label{font-size:12px;color:rgba(255,255,255,.7);flex:1}
.tf-task-bar-time{font-size:12px;font-weight:600;color:#fff;font-variant-numeric:tabular-nums}
.tf-task-bar-track{width:100%;height:3px;background:rgba(255,255,255,.1);border-radius:2px;margin-top:3px}
.tf-task-bar-fill{height:3px;border-radius:2px}
.tf-subject-section{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:var(--radius-lg);padding:16px}
.tf-subject-header{display:flex;align-items:center;gap:8px;margin-bottom:12px}
.tf-subject-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.tf-subject-name{font-size:14px;font-weight:600;color:#fff}
.tf-subject-time{margin-left:auto;font-size:13px;font-weight:600;color:rgba(255,255,255,.5);font-variant-numeric:tabular-nums}
.tf-tasks{display:flex;flex-direction:column;gap:6px}
.tf-task-row{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:var(--radius-sm);cursor:pointer;transition:background var(--t)}
.tf-task-row:hover{background:rgba(255,255,255,.05)}
.tf-task-row.active{background:rgba(91,141,246,.15);border:1px solid rgba(91,141,246,.3)}
.tf-task-play{width:26px;height:26px;border-radius:50%;border:1.5px solid rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all var(--t)}
.tf-task-play svg{width:10px;height:10px;fill:#fff;stroke:none;margin-left:2px}
.tf-task-play.running{background:#5b8df6;border-color:#5b8df6}
.tf-task-play.running svg{margin-left:0}
.tf-task-name{flex:1;font-size:13px;color:rgba(255,255,255,.8)}
.tf-task-time{font-size:12px;font-weight:600;color:rgba(255,255,255,.5);font-variant-numeric:tabular-nums}
.tf-task-time.running{color:#5b8df6}
.tf-right{padding:24px;overflow-y:auto}
.tf-rank-title{font-size:15px;font-weight:600;color:#fff;margin-bottom:6px}
.tf-rank-sub{font-size:12px;color:rgba(255,255,255,.4);margin-bottom:16px}
.tf-rank-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}
.tf-rank-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:var(--radius-lg);padding:14px 10px;text-align:center;cursor:pointer;transition:background var(--t)}
.tf-rank-card:hover{background:rgba(255,255,255,.09)}
.tf-rank-card.me{border-color:rgba(91,141,246,.5);background:rgba(91,141,246,.1)}
.tf-rank-avatar{width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:600;color:#fff;margin:0 auto 8px}
.tf-rank-name{font-size:12px;color:rgba(255,255,255,.7);margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tf-rank-time{font-size:13px;font-weight:600;color:#5b8df6;font-variant-numeric:tabular-nums}
.tf-controls{display:flex;gap:10px;margin-top:12px}
.tf-btn-pause{flex:1;padding:10px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.15);border-radius:var(--radius-pill);color:#fff;font-size:14px;transition:background var(--t)}
.tf-btn-pause:hover{background:rgba(255,255,255,.18)}
.tf-btn-stop{width:42px;height:42px;border-radius:50%;border:1.5px solid rgba(255,0,0,.4);background:rgba(255,0,0,.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background var(--t)}
.tf-btn-stop:hover{background:rgba(255,0,0,.2)}
.tf-btn-stop svg{width:12px;height:12px;fill:#ff6b6b;stroke:none}
@media(max-width:834px){
  .tf-body{grid-template-columns:1fr}
  .tf-right{display:none}
  .tf-rank-grid{grid-template-columns:repeat(3,1fr)}
}

/* add task form */
.task-add-form{display:flex;gap:6px;padding:10px 16px;border-top:1px solid var(--hairline);background:var(--parchment)}
.task-add-input{flex:1;padding:6px 10px;border:1px solid var(--hairline);border-radius:var(--radius-pill);font-size:12px;color:var(--ink);background:var(--canvas)}
.task-add-input:focus{border-color:var(--blue-focus)}
.task-add-submit{padding:6px 12px;background:var(--blue);color:#fff;font-size:12px;border-radius:var(--radius-pill)}

/* add subject button */
.add-subject-btn{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;padding:11px;border:1.5px dashed var(--hairline);border-radius:var(--radius-lg);font-size:13px;color:var(--ink-48);background:none;transition:all var(--t)}
.add-subject-btn:hover{border-color:var(--blue);color:var(--blue);background:rgba(0,102,204,.03)}

/* view toggle */
.view-toggle{display:flex;gap:6px;margin-bottom:12px}
.view-btn{padding:6px 14px;font-size:12px;border-radius:var(--radius-pill);border:1px solid var(--hairline);color:var(--ink-48);background:var(--canvas);transition:all var(--t)}
.view-btn.active{background:var(--blue);color:#fff;border-color:var(--blue)}

/* list view */
.list-view-rows{display:flex;flex-direction:column;gap:8px}
.list-session-row{background:var(--canvas);border:1px solid var(--hairline);border-radius:var(--radius-sm);padding:12px 16px;display:flex;align-items:center;gap:12px}
.list-session-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.list-session-info{flex:1}
.list-session-subject{font-size:13px;font-weight:600;color:var(--ink)}
.list-session-task{font-size:12px;color:var(--ink-48)}
.list-session-time{font-size:12px;color:var(--ink-48)}
.list-session-dur{font-size:13px;font-weight:600;color:var(--ink);font-variant-numeric:tabular-nums}

/* time block view */
.timeblock-wrap{position:relative;overflow-y:auto;max-height:500px}
.timeblock-grid{display:flex;flex-direction:column}
.timeblock-hour-row{display:flex;align-items:flex-start;min-height:48px;position:relative}
.timeblock-hour-label{font-size:11px;color:var(--ink-48);width:40px;flex-shrink:0;padding-top:4px;text-align:right;padding-right:8px}
.timeblock-hour-line{flex:1;border-top:1px solid var(--hairline);position:relative;min-height:48px}
.timeblock-block{position:absolute;left:4px;right:4px;border-radius:5px;padding:3px 7px;font-size:11px;font-weight:600;color:#fff;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}

/* REPORT */
.week-chart{display:flex;align-items:flex-end;gap:6px;height:64px;margin:12px 0 6px}
.week-bar-wrap{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px}
.week-bar{width:100%;border-radius:3px 3px 0 0;background:var(--hairline);min-height:2px;transition:background var(--t)}
.week-bar.has-data{background:rgba(0,102,204,.25)}
.week-bar.today{background:var(--blue)}
.week-day{font-size:10px;color:var(--ink-48)}
.progress-stack{display:flex;flex-direction:column;gap:12px}
.progress-item{}
.progress-meta{display:flex;justify-content:space-between;margin-bottom:5px}
.progress-label{font-size:13px;color:var(--ink)}
.progress-val{font-size:12px;font-weight:600;color:var(--ink-48)}
.progress-track{height:4px;background:var(--hairline);border-radius:2px;overflow:hidden}
.progress-fill{height:100%;border-radius:2px;transition:width .4s ease}
.rank-list{display:flex;flex-direction:column;gap:5px}
.rank-row{display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--parchment);border-radius:var(--radius-sm);border:1px solid transparent}
.rank-row.me{border-color:var(--blue);background:rgba(0,102,204,.04)}
.rank-pos{font-size:12px;font-weight:600;color:var(--ink-48);width:18px;text-align:center;flex-shrink:0}
.rank-row.me .rank-pos{color:var(--blue)}
.rank-name{flex:1;font-size:13px;color:var(--ink)}
.rank-row.me .rank-name{font-weight:600;color:var(--blue)}
.rank-bar-track{width:70px;height:3px;background:var(--hairline);border-radius:2px;overflow:hidden}
.rank-bar-fill{height:100%;background:var(--blue);border-radius:2px}
.rank-time{font-size:12px;font-weight:600;color:var(--ink-48);font-variant-numeric:tabular-nums;min-width:48px;text-align:right}
.rank-row.me .rank-time{color:var(--blue)}

/* QNA */
.qna-list{display:flex;flex-direction:column;gap:10px}
.qna-card{background:var(--canvas);border:1px solid var(--hairline);border-radius:var(--radius-lg);padding:16px 18px}
.qna-header{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.qna-avatar{width:26px;height:26px;border-radius:50%;background:var(--ink);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;color:#fff;flex-shrink:0}
.qna-author{font-size:12px;font-weight:600;color:var(--ink)}
.qna-time{font-size:11px;color:var(--ink-48)}
.qna-subject-pill{font-size:10px;font-weight:600;padding:2px 7px;border-radius:var(--radius-pill);background:rgba(0,102,204,.1);color:var(--blue);margin-left:auto}
.qna-content{font-size:13px;color:var(--ink);line-height:1.6;margin-bottom:8px}
.qna-reply-btn{font-size:12px;color:var(--blue);background:none;border:none;cursor:pointer;padding:0}
.qna-reply-btn:hover{text-decoration:underline}
.write-form{background:var(--canvas);border:1px solid var(--hairline);border-radius:var(--radius-lg);padding:18px;margin-bottom:16px}
.write-form-title{font-size:14px;font-weight:600;color:var(--ink);margin-bottom:10px}
.form-row{display:flex;gap:8px;margin-bottom:8px}
.form-select{padding:8px 12px;border:1px solid var(--hairline);border-radius:var(--radius-pill);font-size:13px;color:var(--ink);background:var(--parchment);flex-shrink:0}
.form-textarea{width:100%;padding:9px 12px;border:1px solid var(--hairline);border-radius:var(--radius-md);font-size:13px;color:var(--ink);background:var(--canvas);resize:vertical;min-height:72px;line-height:1.5;margin-bottom:8px;transition:border-color var(--t)}
.form-textarea:focus{border-color:var(--blue-focus);box-shadow:0 0 0 3px rgba(0,102,204,.12)}
.form-textarea::placeholder{color:var(--ink-48)}
.form-actions{display:flex;justify-content:flex-end}

/* CALC */
.calc-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px}
.calc-cell-input{width:100%;padding:6px 8px;border:1px solid var(--hairline);border-radius:var(--radius-sm);font-size:12.5px;color:var(--ink);background:var(--canvas);transition:border-color var(--t)}
.calc-cell-input:focus{border-color:var(--blue-focus);box-shadow:0 0 0 2px rgba(0,102,204,.1)}
.calc-cell-select{width:100%;padding:6px 8px;border:1px solid var(--hairline);border-radius:var(--radius-sm);font-size:12.5px;color:var(--ink);background:var(--parchment);cursor:pointer}
.calc-unit-input{width:64px}
.calc-grade-input{width:64px}
.calc-row-del{color:var(--ink-48);font-size:15px;background:none;border:none;cursor:pointer;padding:2px 6px;transition:color var(--t)}
.calc-row-del:hover{color:#c00}
.calc-cat-tile{text-align:center}
.calc-cat-tile .calc-cat-name{font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--ink-48);margin-bottom:6px}
.calc-cat-tile .calc-cat-val{font-size:22px;font-weight:600;color:var(--ink);letter-spacing:-.022em}
.calc-cat-tile .calc-cat-unit{font-size:11px;color:var(--ink-48);margin-top:2px}
.calc-field{display:flex;flex-direction:column;gap:5px}
.calc-field-label{font-size:11px;font-weight:600;letter-spacing:.02em;text-transform:uppercase;color:var(--ink-48)}
.calc-input{padding:9px 12px;border:1px solid var(--hairline);border-radius:var(--radius-md);font-size:16px;font-weight:600;color:var(--ink);background:var(--parchment);transition:border-color var(--t);width:100%;font-variant-numeric:tabular-nums}
.calc-input:focus{border-color:var(--blue-focus);box-shadow:0 0 0 3px rgba(0,102,204,.12);background:var(--canvas)}
.calc-result-tile{background:var(--tile-1);border-radius:var(--radius-lg);padding:24px;text-align:center;margin-bottom:16px}
.calc-result-label{font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--muted-dark);margin-bottom:6px}
.calc-result-num{font-size:48px;font-weight:600;letter-spacing:-.03em;color:var(--on-dark);line-height:1}
.uni-list{display:flex;flex-direction:column;gap:7px}
.uni-row{display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--parchment);border-radius:var(--radius-sm);border:1px solid transparent}
.uni-row.ok{border-color:rgba(0,102,204,.2);background:rgba(0,102,204,.04)}
.uni-row.close{border-color:rgba(245,166,35,.25);background:rgba(245,166,35,.04)}
.uni-name{flex:1;font-size:13px;color:var(--ink)}
.uni-score{font-size:13px;font-weight:600;font-variant-numeric:tabular-nums}
.uni-score.ok{color:var(--blue)}
.uni-score.close{color:#b37800}
.uni-score.no{color:#c00}
.uni-diff{font-size:11px;color:var(--ink-48)}

/* TIMER RUNNING BADGE */
.timer-badge{position:fixed;bottom:24px;right:24px;background:var(--canvas);border:1px solid var(--hairline);border-radius:var(--radius-lg);padding:12px 16px;box-shadow:0 4px 24px rgba(0,0,0,.12);display:none;align-items:center;gap:12px;z-index:150;min-width:220px}
.timer-badge.visible{display:flex}
.timer-badge-dot{width:8px;height:8px;border-radius:50%;background:var(--blue);animation:pulse 1.2s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.85)}}
.timer-badge-info{flex:1}
.timer-badge-subject{font-size:12px;font-weight:600;color:var(--ink)}
.timer-badge-task{font-size:11px;color:var(--ink-48)}
.timer-badge-time{font-size:17px;font-weight:600;color:var(--blue);font-variant-numeric:tabular-nums;letter-spacing:-.022em}
.timer-badge-stop{width:28px;height:28px;border-radius:50%;border:1.5px solid var(--hairline);display:flex;align-items:center;justify-content:center;color:var(--ink-48);transition:all var(--t)}
.timer-badge-stop:hover{border-color:#c00;color:#c00;background:rgba(200,0,0,.05)}
.timer-badge-stop svg{width:10px;height:10px;fill:currentColor;stroke:none}

@media(max-width:834px){
  .sidebar{transform:translateX(-100%)}
  .sidebar.open{transform:translateX(0);box-shadow:4px 0 40px rgba(0,0,0,.15)}
  .topbar{display:flex}
  .main-content{margin-left:0;padding-top:var(--nav-h)}
  .page{padding:20px 16px}
  .grid-2,.grid-3,.grid-4{grid-template-columns:1fr}
  .meal-cols{grid-template-columns:1fr}
  .calc-grid{grid-template-columns:1fr}
  .planner-layout{grid-template-columns:1fr}
  .study-stats-bar{grid-template-columns:repeat(3,1fr)}
  .dday-num{font-size:52px}
}

/* ADMIN */
.admin-role-badge{font-size:11px;font-weight:700;padding:3px 10px;border-radius:var(--radius-pill);letter-spacing:.02em}
.admin-role-badge.owner{background:rgba(236,72,189,.12);color:#c026a8}
.admin-role-badge.admin{background:rgba(0,102,204,.1);color:var(--blue)}
.admin-table-wrap{overflow-x:auto}
.admin-table{width:100%;border-collapse:collapse;font-size:13px}
.admin-table th{padding:9px 12px;text-align:left;font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--ink-48);border-bottom:1px solid var(--hairline);white-space:nowrap}
.admin-table td{padding:12px 12px;border-bottom:1px solid var(--hairline);color:var(--ink);vertical-align:middle}
.admin-table tr:last-child td{border-bottom:none}
.admin-table tr:hover td{background:var(--parchment)}
.role-pill{font-size:10px;font-weight:700;padding:2px 8px;border-radius:var(--radius-pill)}
.role-pill.owner{background:rgba(236,72,189,.12);color:#c026a8}
.role-pill.admin{background:rgba(0,102,204,.1);color:var(--blue)}
.role-pill.student{background:var(--parchment);color:var(--ink-48)}
.admin-btn{font-size:11px;font-weight:600;padding:4px 10px;border-radius:var(--radius-pill);border:1px solid;cursor:pointer;transition:opacity var(--t);white-space:nowrap}
.admin-btn:hover{opacity:.75}
.admin-btn.promote{background:rgba(0,102,204,.08);color:var(--blue);border-color:rgba(0,102,204,.2)}
.admin-btn.demote{background:rgba(200,0,0,.06);color:#c00;border-color:rgba(200,0,0,.18)}
.admin-btn.reset{background:rgba(245,166,35,.08);color:#b37800;border-color:rgba(245,166,35,.25)}
.admin-actions{display:flex;gap:5px;flex-wrap:wrap}

/* COMMENTS */
.comment-section{margin-top:10px;border-top:1px solid var(--hairline);padding-top:10px}
.comment-toggle-btn{font-size:12px;color:var(--blue);background:none;border:none;cursor:pointer;padding:0;margin-bottom:8px}
.comment-toggle-btn:hover{text-decoration:underline}
.comment-list{display:flex;flex-direction:column;gap:6px;margin-bottom:8px}
.comment-item{display:flex;gap:8px;align-items:flex-start;padding:8px 10px;background:var(--parchment);border-radius:var(--radius-sm)}
.comment-avatar{width:22px;height:22px;border-radius:50%;background:var(--ink);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:600;color:#fff;flex-shrink:0;margin-top:1px}
.comment-body{flex:1;min-width:0}
.comment-meta{display:flex;align-items:center;gap:6px;margin-bottom:2px}
.comment-author{font-size:12px;font-weight:600;color:var(--ink)}
.comment-time{font-size:11px;color:var(--ink-48)}
.comment-text{font-size:13px;color:var(--ink);line-height:1.5;word-break:break-word}
.comment-del{font-size:11px;color:var(--ink-48);background:none;border:none;cursor:pointer;margin-left:auto;flex-shrink:0;transition:color var(--t)}
.comment-del:hover{color:#c00}
.comment-input-row{display:flex;gap:6px}
.comment-input{flex:1;padding:7px 12px;border:1px solid var(--hairline);border-radius:var(--radius-pill);font-size:13px;color:var(--ink);background:var(--canvas);transition:border-color var(--t)}
.comment-input:focus{border-color:var(--blue-focus);box-shadow:0 0 0 2px rgba(0,102,204,.1)}
.comment-input::placeholder{color:var(--ink-48)}
.comment-submit{padding:7px 14px;background:var(--blue);color:#fff;font-size:12px;font-weight:600;border-radius:var(--radius-pill);border:none;cursor:pointer;transition:opacity var(--t)}
.comment-submit:hover{opacity:.85}

/* MYPAGE */
.mp-info-row{display:flex;justify-content:space-between;align-items:center;padding:11px 0;border-bottom:1px solid var(--hairline);font-size:14px}
.mp-info-row:last-child{border-bottom:none}
.mp-info-label{color:var(--ink-48);font-size:13px}
.mp-info-val{color:var(--ink);font-weight:500}

/* PHOTO UPLOAD */
.photo-upload-row{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.photo-upload-label{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border:1px solid var(--hairline);border-radius:var(--radius-pill);font-size:13px;color:var(--ink-48);cursor:pointer;transition:all var(--t);background:var(--parchment)}
.photo-upload-label:hover{border-color:var(--blue);color:var(--blue);background:rgba(0,102,204,.04)}
.photo-file-name{font-size:12px;color:var(--ink-48);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.photo-clear-btn{width:22px;height:22px;border-radius:50%;border:1px solid var(--hairline);color:var(--ink-48);font-size:14px;display:flex;align-items:center;justify-content:center;cursor:pointer;background:none;flex-shrink:0;transition:all var(--t)}
.photo-clear-btn:hover{border-color:#c00;color:#c00}
.photo-preview-wrap{margin-bottom:10px;border-radius:var(--radius-md);overflow:hidden;border:1px solid var(--hairline)}
.photo-preview-img{width:100%;max-height:240px;object-fit:contain;display:block;background:var(--parchment)}
.post-img{width:100%;max-height:320px;object-fit:contain;border-radius:var(--radius-sm);margin-top:10px;cursor:pointer;display:block}
.post-img:hover{opacity:.9}
/* 이미지 라이트박스 */
#img-lightbox{position:fixed;inset:0;background:rgba(0,0,0,.85);display:none;align-items:center;justify-content:center;z-index:400;cursor:pointer}
#img-lightbox.open{display:flex}
#img-lightbox img{max-width:90vw;max-height:90vh;object-fit:contain;border-radius:var(--radius-md)}
.post-delete-btn{font-size:12px;color:var(--ink-48);background:none;border:none;cursor:pointer;padding:0;margin-left:auto;transition:color var(--t)}
.post-delete-btn:hover{color:#c00}
</style>
</head>
<body>

<!-- AUTH -->
<div id="auth-screen">
  <div class="auth-card">
    <div class="auth-logo">
      <div class="auth-logo-mark"><svg viewBox="0 0 28 28"><path d="M14 2C8.477 2 4 6.477 4 12c0 3.9 2.2 7.3 5.4 9.1V24c0 1.1.9 2 2 2h5.2c1.1 0 2-.9 2-2v-2.9C21.8 19.3 24 15.9 24 12 24 6.477 19.523 2 14 2z"/></svg></div>
      <div class="auth-title">부광고 3-1</div>
      <div class="auth-sub">학번과 비밀번호로 로그인하세요</div>
    </div>
    <div class="auth-field">
      <label class="auth-label" for="login-id">학번</label>
      <input class="auth-input" id="login-id" type="text" placeholder="예: 30122" maxlength="5" autocomplete="username">
    </div>
    <div class="auth-field">
      <label class="auth-label" for="login-pw">비밀번호</label>
      <input class="auth-input" id="login-pw" type="password" placeholder="비밀번호 입력" autocomplete="current-password">
    </div>
    <button class="btn-primary full" id="login-btn" onclick="doLogin()">로그인</button>
    <div class="auth-error" id="auth-error"></div>
    <div class="auth-hint">초기 비밀번호는 1234입니다</div>
  </div>
</div>

<!-- NAME SETUP -->
<div id="name-setup-screen">
  <div class="auth-card">
    <div class="auth-logo">
      <div class="name-setup-emoji">👋</div>
      <div class="auth-title">처음 오셨군요!</div>
      <div class="auth-sub">기본 정보를 설정해주세요</div>
    </div>
    <div class="auth-field">
      <label class="auth-label" for="setup-name">이름</label>
      <input class="auth-input" id="setup-name" type="text" placeholder="예: 홍길동" maxlength="10">
    </div>
    <div class="auth-divider"></div>
    <div class="auth-section-title">수능 선택과목</div>
    <div class="auth-row">
      <div class="auth-field">
        <label class="auth-label">국어 선택</label>
        <select class="auth-select" id="setup-kor">
          <option value="화법과작문">화법과작문</option>
          <option value="언어와매체">언어와매체</option>
        </select>
      </div>
      <div class="auth-field">
        <label class="auth-label">수학 선택</label>
        <select class="auth-select" id="setup-math">
          <option value="확률과통계">확률과통계</option>
          <option value="미적분">미적분</option>
          <option value="기하">기하</option>
        </select>
      </div>
    </div>
    <div class="auth-field">
      <label class="auth-label">탐구 과목 1</label>
      <select class="auth-select" id="setup-exp1">
        <option value="생활과윤리">생활과윤리</option>
        <option value="윤리와사상">윤리와사상</option>
        <option value="한국지리">한국지리</option>
        <option value="세계지리">세계지리</option>
        <option value="동아시아사">동아시아사</option>
        <option value="세계사">세계사</option>
        <option value="경제">경제</option>
        <option value="정치와법">정치와법</option>
        <option value="사회문화">사회문화</option>
        <option value="물리학I">물리학I</option>
        <option value="화학I">화학I</option>
        <option value="생명과학I">생명과학I</option>
        <option value="지구과학I">지구과학I</option>
        <option value="물리학II">물리학II</option>
        <option value="화학II">화학II</option>
        <option value="생명과학II">생명과학II</option>
        <option value="지구과학II">지구과학II</option>
      </select>
    </div>
    <div class="auth-field">
      <label class="auth-label">탐구 과목 2</label>
      <select class="auth-select" id="setup-exp2">
        <option value="사회문화">사회문화</option>
        <option value="생활과윤리">생활과윤리</option>
        <option value="물리학I">물리학I</option>
        <option value="화학I">화학I</option>
        <option value="생명과학I">생명과학I</option>
        <option value="지구과학I">지구과학I</option>
        <option value="한국지리">한국지리</option>
        <option value="세계지리">세계지리</option>
        <option value="경제">경제</option>
        <option value="정치와법">정치와법</option>
      </select>
    </div>
    <button class="btn-primary full" id="setup-btn" onclick="saveName()">시작하기</button>
    <div class="auth-error" id="setup-error"></div>
  </div>
</div>

<!-- APP SHELL -->
<div id="app-shell">
  <div class="sidebar-overlay" id="sidebar-overlay" onclick="closeSidebar()"></div>
  <aside class="sidebar" id="sidebar">
    <div class="sidebar-header">
      <div class="sidebar-wordmark">부광<span>3-1</span></div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-group">
        <div class="nav-item active" data-page="dashboard" onclick="navigate('dashboard')">
          <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>대시보드
        </div>
      </div>
      <div class="nav-group">
        <div class="nav-group-label">학습</div>
        <div class="nav-item" data-page="planner" onclick="navigate('planner')">
          <svg viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>학습 플래너
        </div>
        <div class="nav-item" data-page="report" onclick="navigate('report')">
          <svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>학습 리포트
        </div>
      </div>
      <div class="nav-group">
        <div class="nav-group-label">게시판</div>
        <div class="nav-item" data-page="free-board" onclick="navigate('free-board')">
          <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>자유게시판
        </div>
        <div class="nav-item" data-page="qna-board" onclick="navigate('qna-board')">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>질문게시판
        </div>
      </div>
      <div class="nav-group">
        <div class="nav-group-label">입시</div>
        <div class="nav-item" data-page="score-calc" onclick="navigate('score-calc')">
          <svg viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>내신 산출 계산기
        </div>
        <div class="nav-item" data-page="news" onclick="navigate('news')">
          <svg viewBox="0 0 24 24"><path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v2"/><rect x="6" y="7" width="13" height="4" rx="1"/></svg>입시뉴스
        </div>
      </div>
      <div class="nav-group">
        <div class="nav-group-label">설정</div>
        <div class="nav-item" data-page="mypage" onclick="navigate('mypage')">
          <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>마이페이지
        </div>
        <div class="nav-item" data-page="admin" onclick="navigate('admin')" id="nav-admin" style="display:none">
          <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>관리자
        </div>
      </div>
    </nav>
    <div class="sidebar-footer">
      <div class="user-row" onclick="navigate('mypage')">
        <div class="user-avatar" id="user-avatar-txt">?</div>
        <div class="user-info">
          <div class="user-name" id="user-display-name">—</div>
          <div class="user-id" id="user-display-id">—</div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-48)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    </div>
  </aside>

  <div class="topbar" id="topbar">
    <button class="hamburger-btn" onclick="openSidebar()"><span></span><span></span><span></span></button>
    <div class="topbar-wordmark">부광<span>3-1</span></div>
    <div style="width:28px"></div>
  </div>

  <main class="main-content">

    <!-- DASHBOARD -->
    <div class="page active" id="page-dashboard">
      <div class="page-title">대시보드</div>
      <div class="page-sub" id="dash-greeting">안녕하세요!</div>
      <div class="dday-tile">
        <div class="dday-label">2027학년도 수능까지</div>
        <div class="dday-num" id="dash-dday">—</div>
        <div class="dday-sub">2026년 11월 19일 (목)</div>
      </div>
      <div class="grid-2 spacer" style="margin-bottom:16px">
        <div class="stat-tile"><div class="stat-label">오늘 공부</div><div class="stat-num blue" id="dash-today-time">0h 0m</div><div class="stat-detail" id="dash-rank-text">반 랭킹 —</div></div>
        <div class="stat-tile"><div class="stat-label">수능까지</div><div class="stat-num" id="dash-dday2">—</div><div class="stat-detail">일 남았습니다</div></div>
      </div>
      <div class="spacer">
        <div class="section-hd"><div class="section-hd-title">오늘 시간표</div><span class="section-hd-link" onclick="navigate('planner')">플래너 →</span></div>
        <div class="card"><div class="period-list" id="dash-timetable"></div></div>
      </div>
      <div class="spacer">
        <div class="section-hd"><div class="section-hd-title">오늘의 급식</div><span class="section-hd-link" id="meal-date-label" style="cursor:default;color:var(--ink-48)"></span></div>
        <div class="card">
          <div class="meal-cols" id="dash-meal"></div>
          <div style="font-size:11px;color:var(--ink-48);margin-top:10px">⚠️ 알레르기 번호: 1.난류 2.우유 3.메밀 4.땅콩 5.대두 6.밀 7.고등어 8.게 9.새우 10.돼지고기 11.복숭아 12.토마토 13.아황산류 14.호두 15.닭고기 16.쇠고기 17.오징어 18.조개류 19.잣</div>
        </div>
      </div>
      <div class="spacer">
        <div class="section-hd">
          <div class="section-hd-title">공지사항</div>
          <span class="section-hd-link" id="notice-write-btn" style="display:none" onclick="openNoticeModal()">+ 공지 작성</span>
        </div>
        <div class="card" style="padding:0 20px"><div class="notice-list" id="dash-notices"></div></div>
      </div>
    </div>

    <!-- PLANNER -->
    <div class="page" id="page-planner">
      <div class="page-title">학습 플래너</div>
      <div class="page-sub" id="planner-date-label">오늘의 학습 계획</div>

      <!-- 통계바 -->
      <div class="study-stats-bar">
        <div class="study-stat-cell"><div class="study-stat-label">총 공부 시간</div><div class="study-stat-val blue" id="stat-total-time">00:00:00</div></div>
        <div class="study-stat-cell"><div class="study-stat-label">오늘 참여자</div><div class="study-stat-val" id="stat-participants">—</div></div>
        <div class="study-stat-cell"><div class="study-stat-label">현재 공부 중</div><div class="study-stat-val" id="stat-active">—</div></div>
        <div class="study-stat-cell"><div class="study-stat-label">내 등수</div><div class="study-stat-val" id="stat-rank">—</div></div>
        <div class="study-stat-cell"><div class="study-stat-label">상위</div><div class="study-stat-val orange" id="stat-percent">—</div></div>
      </div>

      <div class="planner-layout">
        <!-- LEFT: 과목별 태스크 -->
        <div class="planner-left">
          <div class="subject-list" id="subject-list"></div>
        </div>

        <!-- RIGHT: 일지 뷰 -->
        <div class="planner-right">
          <div class="view-toggle">
            <button class="view-btn active" id="btn-list-view" onclick="switchView('list')">≡ 리스트</button>
            <button class="view-btn" id="btn-block-view" onclick="switchView('block')">⊞ 타임블록</button>
          </div>
          <div id="list-view">
            <div class="list-view-rows" id="session-log-list">
              <div style="text-align:center;padding:32px;color:var(--ink-48);font-size:13px">아직 기록된 공부가 없어요</div>
            </div>
          </div>
          <div id="block-view" style="display:none">
            <div class="timeblock-wrap">
              <div class="timeblock-grid" id="timeblock-grid"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- REPORT -->
    <div class="page" id="page-report">
      <div class="page-title">학습 리포트</div>
      <div class="page-sub">공부 시간 통계와 반 랭킹을 확인하세요</div>
      <div class="grid-3 spacer" style="margin-bottom:16px">
        <div class="stat-tile"><div class="stat-label">오늘</div><div class="stat-num blue" id="rep-today">0h 0m</div><div class="stat-detail">누적 공부 시간</div></div>
        <div class="stat-tile"><div class="stat-label">이번 주 평균</div><div class="stat-num" id="rep-week-avg">—</div></div>
        <div class="stat-tile"><div class="stat-label">연속 공부일</div><div class="stat-num" id="rep-streak">0</div><div class="stat-detail">일 연속 🔥</div></div>
      </div>
      <div class="spacer">
        <div class="section-hd"><div class="section-hd-title">이번 주 기록</div></div>
        <div class="card">
          <div class="week-chart" id="week-chart"></div>
          <div style="display:flex;justify-content:space-around;padding:0 4px">
            <span class="week-day">월</span><span class="week-day">화</span><span class="week-day">수</span><span class="week-day">목</span><span class="week-day">금</span><span class="week-day">토</span><span class="week-day">일</span>
          </div>
        </div>
      </div>
      <div class="spacer">
        <div class="section-hd"><div class="section-hd-title">과목별 비중</div></div>
        <div class="card"><div class="progress-stack" id="subject-progress"></div></div>
      </div>
      <div class="spacer">
        <div class="section-hd"><div class="section-hd-title">반 랭킹</div></div>
        <div class="card" style="padding:14px 20px"><div class="rank-list" id="rank-list"></div></div>
      </div>
    </div>

    <!-- FREE BOARD -->
    <div class="page" id="page-free-board">
      <div class="page-title">자유게시판</div>
      <div class="page-sub">반 친구들과 자유롭게 이야기하세요</div>
      <div class="write-form">
        <div class="write-form-title">글 작성</div>
        <textarea class="form-textarea" id="free-content" placeholder="내용을 입력하세요..."></textarea>
        <!-- 사진 업로드 -->
        <div class="photo-upload-row">
          <label class="photo-upload-label" for="free-photo">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            사진 첨부
          </label>
          <input type="file" id="free-photo" accept="image/*" style="display:none" onchange="previewPhoto('free')">
          <span class="photo-file-name" id="free-photo-name">파일 없음</span>
          <button class="photo-clear-btn" id="free-photo-clear" onclick="clearPhoto('free')" style="display:none">×</button>
        </div>
        <div class="photo-preview-wrap" id="free-photo-preview" style="display:none">
          <img id="free-photo-img" src="" alt="미리보기" class="photo-preview-img">
        </div>
        <div class="form-actions">
          <button class="btn-primary" id="free-submit-btn" onclick="submitPost('free')">게시하기</button>
        </div>
      </div>
      <div class="qna-list" id="free-list"></div>
    </div>

    <!-- QNA BOARD -->
    <div class="page" id="page-qna-board">
      <div class="page-title">질문게시판</div>
      <div class="page-sub">공부하다 막히는 부분을 올려 함께 해결해요</div>
      <div class="write-form">
        <div class="write-form-title">질문 올리기</div>
        <div class="form-row">
          <select class="form-select" id="qna-subject">
            <option>수학</option><option>국어</option><option>영어</option><option>사회탐구</option><option>과학탐구</option><option>기타</option>
          </select>
        </div>
        <textarea class="form-textarea" id="qna-content" placeholder="모르는 내용을 자세히 작성해주세요..."></textarea>
        <!-- 사진 업로드 -->
        <div class="photo-upload-row">
          <label class="photo-upload-label" for="qna-photo">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            사진 첨부
          </label>
          <input type="file" id="qna-photo" accept="image/*" style="display:none" onchange="previewPhoto('qna')">
          <span class="photo-file-name" id="qna-photo-name">파일 없음</span>
          <button class="photo-clear-btn" id="qna-photo-clear" onclick="clearPhoto('qna')" style="display:none">×</button>
        </div>
        <div class="photo-preview-wrap" id="qna-photo-preview" style="display:none">
          <img id="qna-photo-img" src="" alt="미리보기" class="photo-preview-img">
        </div>
        <div class="form-actions">
          <button class="btn-primary" id="qna-submit-btn" onclick="submitPost('qna')">질문 올리기</button>
        </div>
      </div>
      <div class="qna-list" id="qna-list"></div>
    </div>

    <!-- SCORE CALC -->
    <div class="page" id="page-score-calc">
      <div class="page-title">내신 산출 계산기</div>
      <div class="page-sub">학기별로 과목·단위수·석차등급을 입력하면 교과군별 평균 등급을 자동 계산합니다</div>

      <div class="card spacer">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:4px">
          <div class="card-title" style="margin-bottom:0">학기별 성적 입력</div>
          <div style="display:flex;gap:6px">
            <button class="btn-ghost" style="font-size:12px;padding:6px 12px" onclick="openImportModal()">📄 생기부로 자동 입력</button>
            <button class="btn-ghost" style="font-size:12px;padding:6px 12px" onclick="clearCalcSemester()">이 학기 비우기</button>
          </div>
        </div>
        <div class="card-sub">진로선택 과목은 석차등급이 없어 성취도(A/B/C/P)로 표시되고, 교과군·전체 평균 계산에서는 제외돼요.</div>

        <div class="view-toggle" id="calc-semester-tabs" style="flex-wrap:wrap"></div>

        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr><th style="min-width:140px">과목명</th><th>교과군</th><th>단위수</th><th>유형</th><th>등급 / 성취도</th><th></th></tr>
            </thead>
            <tbody id="calc-table-body"></tbody>
            <tfoot>
              <tr><td colspan="6" style="padding-top:10px;border-bottom:none">
                <div id="calc-semester-summary" style="font-size:12px;color:var(--ink-48);margin-bottom:8px"></div>
                <button class="add-subject-btn" onclick="addCalcSubject()">+ 과목 추가</button>
              </td></tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div class="card spacer">
        <div class="card-title">교과군별 평균 등급</div>
        <div class="card-sub">전체 학기 · 일반선택 과목 단위수 가중평균</div>
        <div class="grid-4" id="calc-category-tiles"></div>
        <div class="calc-result-tile" style="margin-top:14px"><div class="calc-result-label">전체 평균 등급</div><div class="calc-result-num" id="calc-avg">—</div></div>
      </div>
    </div>

    <!-- NEWS -->
    <div class="page" id="page-news">
      <div class="page-title">입시뉴스</div>
      <div class="page-sub">매일 오전 7시 최신 입시 뉴스를 자동으로 수집합니다</div>

      <!-- AI 요약 카드 -->
      <div class="card" style="margin-bottom:16px;background:var(--tile-1);border-color:transparent" id="news-summary-card">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
          <div style="width:28px;height:28px;border-radius:8px;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;font-size:14px">✨</div>
          <div style="font-size:14px;font-weight:600;color:var(--on-dark)">오늘의 입시 뉴스 요약</div>
          <div style="font-size:11px;color:var(--muted-dark);margin-left:auto" id="news-summary-date">—</div>
        </div>
        <div id="news-summary-text" style="font-size:14px;color:var(--muted-dark);line-height:1.7;white-space:pre-wrap">불러오는 중...</div>
      </div>

      <!-- 뉴스 목록 -->
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
          <div style="font-size:15px;font-weight:600;color:var(--ink)">전체 뉴스</div>
          <div style="display:flex;gap:6px" id="news-filter-btns">
            <button class="view-btn active" onclick="filterNews('')">전체</button>
            <button class="view-btn" onclick="filterNews('수능')">수능</button>
            <button class="view-btn" onclick="filterNews('수시')">수시</button>
            <button class="view-btn" onclick="filterNews('정시')">정시</button>
            <button class="view-btn" onclick="filterNews('모의고사')">모의고사</button>
            <button class="view-btn" onclick="filterNews('학종')">학종</button>
          </div>
        </div>
        <div class="news-list" id="news-list"></div>
      </div>
    </div>

    <!-- MYPAGE -->
    <div class="page" id="page-mypage">
      <div class="page-title">마이페이지</div>
      <div class="page-sub">내 프로필과 설정을 관리하세요</div>
      <div class="grid-2" style="align-items:start;gap:16px">

        <!-- 내 정보 -->
        <div>
          <div class="card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
              <div class="card-title">내 정보</div>
            </div>
            <!-- 아바타 + 이름 -->
            <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid var(--hairline)">
              <div style="width:56px;height:56px;border-radius:50%;background:var(--ink);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:600;color:#fff;flex-shrink:0" id="mp-avatar">?</div>
              <div>
                <div style="font-size:17px;font-weight:600;color:var(--ink)" id="mp-name">—</div>
                <div style="font-size:13px;color:var(--ink-48)" id="mp-id">—</div>
              </div>
            </div>
            <!-- 정보 리스트 -->
            <div style="display:flex;flex-direction:column;gap:0">
              <div class="mp-info-row"><span class="mp-info-label">학교</span><span class="mp-info-val">부광고등학교</span></div>
              <div class="mp-info-row"><span class="mp-info-label">학년</span><span class="mp-info-val">고3</span></div>
              <div class="mp-info-row"><span class="mp-info-label">반</span><span class="mp-info-val">1반</span></div>
              <div class="mp-info-row"><span class="mp-info-label">국어 선택</span><span class="mp-info-val" id="mp-kor">—</span></div>
              <div class="mp-info-row"><span class="mp-info-label">수학 선택</span><span class="mp-info-val" id="mp-math">—</span></div>
              <div class="mp-info-row"><span class="mp-info-label">탐구 1</span><span class="mp-info-val" id="mp-exp1">—</span></div>
              <div class="mp-info-row"><span class="mp-info-label">탐구 2</span><span class="mp-info-val" id="mp-exp2">—</span></div>
            </div>
          </div>

          <!-- 나의 다짐 -->
          <div class="card" style="margin-top:14px">
            <div class="card-title" style="margin-bottom:12px">나의 다짐 ✍️</div>
            <textarea class="form-textarea" id="mp-resolution" rows="4" placeholder="나의 다짐을 적어보세요...예) 수능 D-147, 매일 8시간 공부하자!"></textarea>
            <div style="display:flex;justify-content:flex-end">
              <button class="btn-primary" style="font-size:14px;padding:8px 18px" onclick="saveResolution()">저장</button>
            </div>
          </div>
        </div>

        <!-- 설정 -->
        <div>
          <!-- 비밀번호 변경 -->
          <div class="card">
            <div class="card-title" style="margin-bottom:4px">비밀번호 변경</div>
            <div class="card-sub">현재 비밀번호를 입력 후 새 비밀번호로 변경하세요</div>
            <div class="modal-field">
              <label class="modal-label">현재 비밀번호</label>
              <input class="modal-input" id="mp-cur-pw" type="password" placeholder="현재 비밀번호">
            </div>
            <div class="modal-field">
              <label class="modal-label">새 비밀번호</label>
              <input class="modal-input" id="mp-new-pw" type="password" placeholder="새 비밀번호 (6자 이상)">
            </div>
            <div class="modal-field">
              <label class="modal-label">새 비밀번호 확인</label>
              <input class="modal-input" id="mp-new-pw2" type="password" placeholder="새 비밀번호 재입력">
            </div>
            <div class="auth-error" id="mp-pw-error"></div>
            <div style="display:flex;justify-content:flex-end;margin-top:12px">
              <button class="btn-primary" style="font-size:14px;padding:8px 18px" onclick="changePw()">변경하기</button>
            </div>
          </div>

          <!-- 선택과목 변경 -->
          <div class="card" style="margin-top:14px">
            <div class="card-title" style="margin-bottom:4px">선택과목 변경</div>
            <div class="card-sub">변경하면 학습 플래너 과목 목록이 업데이트됩니다</div>
            <div class="auth-row" style="margin-bottom:10px">
              <div class="auth-field">
                <label class="auth-label">국어 선택</label>
                <select class="auth-select" id="mp-sel-kor">
                  <option value="화법과작문">화법과작문</option>
                  <option value="언어와매체">언어와매체</option>
                </select>
              </div>
              <div class="auth-field">
                <label class="auth-label">수학 선택</label>
                <select class="auth-select" id="mp-sel-math">
                  <option value="확률과통계">확률과통계</option>
                  <option value="미적분">미적분</option>
                  <option value="기하">기하</option>
                </select>
              </div>
            </div>
            <div class="auth-field" style="margin-bottom:10px">
              <label class="auth-label">탐구 과목 1</label>
              <select class="auth-select" id="mp-sel-exp1">
                <option value="생활과윤리">생활과윤리</option><option value="윤리와사상">윤리와사상</option>
                <option value="한국지리">한국지리</option><option value="세계지리">세계지리</option>
                <option value="동아시아사">동아시아사</option><option value="세계사">세계사</option>
                <option value="경제">경제</option><option value="정치와법">정치와법</option>
                <option value="사회문화">사회문화</option><option value="물리학I">물리학I</option>
                <option value="화학I">화학I</option><option value="생명과학I">생명과학I</option>
                <option value="지구과학I">지구과학I</option><option value="물리학II">물리학II</option>
                <option value="화학II">화학II</option><option value="생명과학II">생명과학II</option>
                <option value="지구과학II">지구과학II</option>
              </select>
            </div>
            <div class="auth-field" style="margin-bottom:12px">
              <label class="auth-label">탐구 과목 2</label>
              <select class="auth-select" id="mp-sel-exp2">
                <option value="사회문화">사회문화</option><option value="생활과윤리">생활과윤리</option>
                <option value="물리학I">물리학I</option><option value="화학I">화학I</option>
                <option value="생명과학I">생명과학I</option><option value="지구과학I">지구과학I</option>
                <option value="한국지리">한국지리</option><option value="세계지리">세계지리</option>
                <option value="경제">경제</option><option value="정치와법">정치와법</option>
              </select>
            </div>
            <div style="display:flex;justify-content:flex-end">
              <button class="btn-primary" style="font-size:14px;padding:8px 18px" onclick="saveSubjects()">저장</button>
            </div>
          </div>

          <!-- 로그아웃 -->
          <div style="margin-top:14px;text-align:right">
            <button class="btn-danger" onclick="doLogout()" style="padding:10px 20px;font-size:14px">로그아웃</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ADMIN -->
    <div class="page" id="page-admin">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
        <div class="page-title" style="margin-bottom:0">관리자</div>
        <span class="admin-role-badge" id="admin-role-badge">—</span>
      </div>
      <div class="page-sub">계정 관리 및 권한 설정</div>

      <!-- 계정 생성 (owner만) -->
      <div class="card" id="admin-create-card" style="display:none;margin-bottom:16px">
        <div class="card-title" style="margin-bottom:12px">계정 생성</div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <input class="modal-input" id="create-student-id" placeholder="학번 (5자리)" maxlength="5" style="width:130px;font-size:13px;padding:8px 12px">
          <input class="modal-input" id="create-password" placeholder="초기 비밀번호 (기본: 1234)" style="width:200px;font-size:13px;padding:8px 12px">
          <button class="btn-primary" style="font-size:13px;padding:8px 18px" onclick="createAccount()">계정 생성</button>
        </div>
      </div>

      <!-- 뉴스 수동 수집 (owner만) -->
      <div class="card" id="admin-news-card" style="display:none;margin-bottom:16px">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div>
            <div class="card-title">입시뉴스 수집</div>
            <div style="font-size:13px;color:var(--ink-48);margin-top:2px">매일 오전 7시 자동 수집 · 수동으로도 수집 가능</div>
          </div>
          <button class="btn-primary" style="font-size:13px;padding:8px 18px" onclick="fetchNewsNow()">지금 수집하기</button>
        </div>
      </div>

      <!-- 급식 수동 수집 (admin/owner) -->
      <div class="card" id="admin-meal-card" style="display:none;margin-bottom:16px">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div>
            <div class="card-title">급식 정보 수집 (NEIS)</div>
            <div style="font-size:13px;color:var(--ink-48);margin-top:2px">매일 오전 6시 이번 주 급식 자동 수집 · 수동으로도 수집 가능</div>
          </div>
          <button class="btn-primary" style="font-size:13px;padding:8px 18px" onclick="fetchMealNow()">지금 수집하기</button>
        </div>
      </div>

      <!-- 계정 목록 -->
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <div class="card-title">계정 목록</div>
          <div style="display:flex;gap:8px;align-items:center">
            <input class="modal-input" id="admin-search" placeholder="학번 또는 이름 검색" style="width:180px;font-size:13px;padding:7px 12px" oninput="filterAdminList()">
            <button class="btn-primary" style="font-size:13px;padding:8px 16px" onclick="loadAdminList()">↻ 새로고침</button>
          </div>
        </div>
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>학번</th>
                <th>이름</th>
                <th>선택과목</th>
                <th>역할</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody id="admin-table-body">
              <tr><td colspan="5" style="text-align:center;padding:24px;color:var(--ink-48);font-size:13px">로딩 중...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

  </main>
</div>

<!-- 타이머 실행 중 배지 -->
<div class="timer-badge" id="timer-badge">
  <div class="timer-badge-dot"></div>
  <div class="timer-badge-info">
    <div class="timer-badge-subject" id="badge-subject">—</div>
    <div class="timer-badge-task" id="badge-task">—</div>
  </div>
  <div class="timer-badge-time" id="badge-time">00:00:00</div>
  <button class="timer-badge-stop" onclick="stopCurrentTimer()">
    <svg viewBox="0 0 10 10"><rect x="1" y="1" width="8" height="8" rx="1"/></svg>
  </button>
</div>

<!-- 계정 설정 모달 -->
<div class="modal-overlay" id="account-modal">
  <div class="modal">
    <button class="modal-close" onclick="closeAccountModal()">×</button>
    <div class="modal-title">계정 설정</div>
    <div class="modal-field">
      <label class="modal-label">이름 변경</label>
      <input class="modal-input" id="acc-name" type="text" placeholder="새 이름">
    </div>
    <div class="modal-field">
      <label class="modal-label">새 비밀번호</label>
      <input class="modal-input" id="acc-pw" type="password" placeholder="변경할 비밀번호 (선택)">
    </div>
    <div class="modal-field">
      <label class="modal-label">비밀번호 확인</label>
      <input class="modal-input" id="acc-pw2" type="password" placeholder="비밀번호 재입력">
    </div>
    <div class="auth-error" id="acc-error"></div>
    <div class="modal-actions">
      <button class="btn-ghost" onclick="closeAccountModal()">취소</button>
      <button class="btn-primary" onclick="saveAccount()">저장</button>
      <button class="btn-danger" onclick="doLogout()">로그아웃</button>
    </div>
  </div>
</div>

<!-- 과목 추가 모달 -->
<div class="modal-overlay" id="add-subject-modal">
  <div class="modal">
    <button class="modal-close" onclick="document.getElementById('add-subject-modal').classList.remove('open')">×</button>
    <div class="modal-title">과목 추가</div>
    <div class="modal-field">
      <label class="modal-label">과목 이름</label>
      <input class="modal-input" id="new-subject-input" type="text" placeholder="예: 수학, 국어, 영어">
    </div>
    <div class="modal-actions">
      <button class="btn-ghost" onclick="document.getElementById('add-subject-modal').classList.remove('open')">취소</button>
      <button class="btn-primary" onclick="addSubject()">추가</button>
    </div>
  </div>
</div>

<!-- 공지 작성 모달 -->
<div class="modal-overlay" id="notice-modal">
  <div class="modal">
    <button class="modal-close" onclick="closeNoticeModal()">×</button>
    <div class="modal-title">공지 작성</div>
    <div class="modal-field">
      <label class="modal-label">제목</label>
      <input class="modal-input" id="notice-title-input" type="text" placeholder="공지 제목">
    </div>
    <div class="modal-field">
      <label class="modal-label">내용</label>
      <textarea class="form-textarea" id="notice-content-input" placeholder="공지 내용을 입력하세요" style="min-height:120px"></textarea>
    </div>
    <div class="auth-error" id="notice-error"></div>
    <div class="modal-actions">
      <button class="btn-ghost" onclick="closeNoticeModal()">취소</button>
      <button class="btn-primary" onclick="submitNotice()">게시하기</button>
    </div>
  </div>
</div>

<!-- 생기부 가져오기 모달 -->
<div class="modal-overlay" id="import-calc-modal">
  <div class="modal" style="max-width:560px">
    <button class="modal-close" onclick="closeImportModal()">×</button>
    <div class="modal-title">생기부로 성적 자동 입력</div>

    <div style="font-size:13px;color:var(--ink-80);line-height:1.6;margin-bottom:10px">
      <b>1단계.</b> Gemini(또는 다른 AI)에 생기부 PDF를 올리고 아래 프롬프트를 그대로 붙여넣으세요.
    </div>
    <div style="position:relative;margin-bottom:14px">
      <textarea class="form-textarea" id="gemini-prompt-text" readonly style="min-height:150px;font-size:11.5px;line-height:1.55;background:var(--parchment);color:var(--ink-80)"></textarea>
      <button class="btn-ghost" style="position:absolute;top:8px;right:8px;font-size:11px;padding:5px 10px" onclick="copyGeminiPrompt()">복사</button>
    </div>

    <div style="font-size:13px;color:var(--ink-80);line-height:1.6;margin-bottom:8px">
      <b>2단계.</b> Gemini가 출력한 JSON 결과를 그대로 복사해서 아래에 붙여넣으세요.
    </div>
    <textarea class="form-textarea" id="import-json-input" placeholder='{"1-1":[{"name":"국어","category":"국어","unit":4,"type":"general","grade":2}, ...], "1-2":[...], ...}' style="min-height:140px;font-size:12px"></textarea>
    <div class="auth-error" id="import-error"></div>

    <div class="modal-actions">
      <button class="btn-ghost" onclick="closeImportModal()">취소</button>
      <button class="btn-primary" onclick="importCalcJSON()">불러오기</button>
    </div>
  </div>
</div>

<div id="toast"></div>

<!-- 이미지 라이트박스 -->
<div id="img-lightbox" onclick="closeLightbox()">
  <img id="lightbox-img" src="" alt="">
</div>

<!-- 전체화면 타이머 -->
<div id="timer-fullscreen">
  <div class="tf-topbar">
    <div class="tf-top-left"><span id="tf-subject-label">국어</span><span id="tf-time-label">00:00:00</span></div>
    <div class="tf-top-right">
      <div class="tf-date" id="tf-date-label"></div>
      <button class="tf-close" onclick="closeTimerView()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        닫기
      </button>
    </div>
  </div>
  <div class="tf-body">
    <!-- 왼쪽: 현재 집중 + 과목별 -->
    <div class="tf-left">
      <!-- 현재 집중 시간 -->
      <div class="tf-focus-card">
        <div class="tf-focus-label">현재 집중 시간</div>
        <div class="tf-focus-time" id="tf-focus-time">00:00:00</div>
        <div class="tf-task-progress" id="tf-task-progress"></div>
        <div class="tf-controls">
          <button class="tf-btn-pause" id="tf-pause-btn" onclick="tfTogglePause()">⏸ 일시정지</button>
          <button class="tf-btn-stop" onclick="tfStop()">
            <svg viewBox="0 0 10 10"><rect x="1" y="1" width="8" height="8" rx="1"/></svg>
          </button>
        </div>
      </div>
      <!-- 과목별 학습 -->
      <div>
        <div style="font-size:13px;font-weight:600;color:rgba(255,255,255,.5);margin-bottom:10px;letter-spacing:.03em;text-transform:uppercase">과목별 학습</div>
        <div id="tf-subject-list" style="display:flex;flex-direction:column;gap:10px"></div>
      </div>
    </div>
    <!-- 오른쪽: 반 랭킹 -->
    <div class="tf-right">
      <div class="tf-rank-title">부광고 3-1 <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#4ade80;margin-left:4px;vertical-align:middle"></span></div>
      <div class="tf-rank-sub" id="tf-rank-sub">— 명 공부중</div>
      <div class="tf-rank-grid" id="tf-rank-grid"></div>
    </div>
  </div>
</div>

<script>
const SUPABASE_URL  = 'https://pvrgwvfjnebsxnlxaxhc.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2cmd3dmZqbmVic3hubHhheGhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NjU2ODUsImV4cCI6MjA5OTI0MTY4NX0.P_ppJzUgzHQDb1dfAuD1Erdq30AMUARwRa8Lp8ylPjo';
const SERVER_URL = 'https://bugwang-server-production.up.railway.app';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// ── STATE ──
let currentUser = null, currentStudentId = '', currentName = '', currentRole = 'student';
let subjects = []; // [{name, color, tasks:[{id,name,done,seconds,taskId}]}]
let activeTimer = null; // {subjectIdx, taskIdx, interval, startedAt, sessionId}
let todaySessions = []; // [{subject,task,seconds,startedAt,endedAt}]
let totalTodaySec = 0;
const SUBJECT_COLORS = ['#0066cc','#e040fb','#00c853','#ff8f00','#00acc1','#6d4c41','#78909c','#e53935','#43a047','#fb8c00'];

// ── HELPERS ──
function toast(msg,dur=2500){const e=document.getElementById('toast');e.textContent=msg;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),dur)}
function fmtSec(s){const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sc=s%60;return`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sc).padStart(2,'0')}`}
function fmtHM(s){return`${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m`}

// ── AUTH ──
async function doLogin(){
  const id=document.getElementById('login-id').value.trim();
  const pw=document.getElementById('login-pw').value;
  if(!id||!pw){showAuthErr('학번과 비밀번호를 모두 입력하세요.');return}
  if(!/^\d{5}$/.test(id)){showAuthErr('학번은 5자리 숫자입니다.');return}
  document.getElementById('login-btn').textContent='로그인 중...';
  const {data,error}=await sb.auth.signInWithPassword({email:`${id}@bugwang3-1.app`,password:pw});
  if(error){showAuthErr('학번 또는 비밀번호가 올바르지 않습니다.');document.getElementById('login-btn').textContent='로그인';return}
  document.getElementById('auth-error').style.display='none';
  const meta=data.user.user_metadata;
  if(!meta?.display_name){currentUser=data.user;currentStudentId=id;document.getElementById('auth-screen').style.display='none';document.getElementById('name-setup-screen').classList.add('visible');document.getElementById('setup-name').focus()}
  else initApp(data.user,id,meta.display_name);
}
function showAuthErr(msg){const e=document.getElementById('auth-error');e.textContent=msg;e.style.display='block'}

async function saveName(){
  const name=document.getElementById('setup-name').value.trim();
  if(!name){showSetupErr('이름을 입력해주세요.');return}
  document.getElementById('setup-btn').textContent='저장 중...';
  const meta={display_name:name,student_id:currentStudentId,
    suneung_kor:document.getElementById('setup-kor').value,
    suneung_math:document.getElementById('setup-math').value,
    suneung_exp1:document.getElementById('setup-exp1').value,
    suneung_exp2:document.getElementById('setup-exp2').value};
  const {error}=await sb.auth.updateUser({data:meta});
  if(error){showSetupErr(error.message);document.getElementById('setup-btn').textContent='시작하기';return}
  document.getElementById('name-setup-screen').classList.remove('visible');
  initApp(currentUser,currentStudentId,name);
}
function showSetupErr(msg){const e=document.getElementById('setup-error');e.textContent=msg;e.style.display='block'}

async function doLogout(){
  if(activeTimer)stopCurrentTimer();
  await sb.auth.signOut();
  currentUser=null;currentStudentId='';currentName='';subjects=[];todaySessions=[];totalTodaySec=0;
  document.getElementById('app-shell').classList.remove('visible');
  document.getElementById('name-setup-screen').classList.remove('visible');
  document.getElementById('auth-screen').style.display='flex';
  document.getElementById('login-pw').value='';
  document.getElementById('login-btn').textContent='로그인';
  document.getElementById('account-modal').classList.remove('open');
}

async function restoreSession(){
  const {data:{session}}=await sb.auth.getSession();
  if(session?.user){
    const meta=session.user.user_metadata;
    const sid=meta?.student_id||session.user.email.split('@')[0];
    if(!meta?.display_name){currentUser=session.user;currentStudentId=sid;document.getElementById('auth-screen').style.display='none';document.getElementById('name-setup-screen').classList.add('visible')}
    else initApp(session.user,sid,meta.display_name);
  }
}

async function initApp(user,sid,name){
  currentUser=user;currentStudentId=sid;currentName=name;
  const meta=user.user_metadata||{};
  document.getElementById('auth-screen').style.display='none';
  document.getElementById('name-setup-screen').classList.remove('visible');
  document.getElementById('app-shell').classList.add('visible');
  document.getElementById('user-avatar-txt').textContent=name?name[0]:sid.slice(-2);
  document.getElementById('user-display-name').textContent=name||`${sid}번`;
  document.getElementById('user-display-id').textContent=`${sid}번 · 3학년 1반`;
  const h=new Date().getHours();
  const g=h<12?'좋은 아침이에요':h<18?'안녕하세요':'수고하세요';
  document.getElementById('dash-greeting').textContent=`${g}, ${name||sid+'번'}!`;
  populateMypage(meta,name,sid);
  updateDday();renderTimetable();loadMeal();loadNotices();renderNews();initCalc();
  loadFreeBoard();loadQnaBoard();
  subjects=buildSubjectsFromMeta(meta);
  await loadTodaySessions();
  await loadSubjectsFromDB();
  updatePlannerDate();
  await refreshStats();
  renderReport();
  // 역할 로드
  await loadMyRole();
  loadMeal();loadNotices();
}

function populateMypage(meta,name,sid){
  document.getElementById('mp-avatar').textContent=name?name[0]:sid.slice(-2);
  document.getElementById('mp-name').textContent=name||sid+'번';
  document.getElementById('mp-id').textContent=sid+'번 · 3학년 1반';
  document.getElementById('mp-kor').textContent=meta.suneung_kor||'—';
  document.getElementById('mp-math').textContent=meta.suneung_math||'—';
  document.getElementById('mp-exp1').textContent=meta.suneung_exp1||'—';
  document.getElementById('mp-exp2').textContent=meta.suneung_exp2||'—';
  // set selects
  ['kor','math','exp1','exp2'].forEach(k=>{
    const el=document.getElementById(`mp-sel-${k}`);
    if(el&&meta[`suneung_${k}`])el.value=meta[`suneung_${k}`];
  });
  // resolution
  if(meta.resolution)document.getElementById('mp-resolution').value=meta.resolution;
}

// ── MYPAGE ──
async function changePw(){
  const cur=document.getElementById('mp-cur-pw').value;
  const nw=document.getElementById('mp-new-pw').value;
  const nw2=document.getElementById('mp-new-pw2').value;
  const errEl=document.getElementById('mp-pw-error');
  errEl.style.display='none';
  if(!cur||!nw){errEl.textContent='현재 비밀번호와 새 비밀번호를 입력하세요.';errEl.style.display='block';return}
  if(nw!==nw2){errEl.textContent='새 비밀번호가 일치하지 않습니다.';errEl.style.display='block';return}
  if(nw.length<6){errEl.textContent='비밀번호는 6자 이상이어야 합니다.';errEl.style.display='block';return}
  // re-auth then update
  const email=`${currentStudentId}@bugwang3-1.app`;
  const {error:loginErr}=await sb.auth.signInWithPassword({email,password:cur});
  if(loginErr){errEl.textContent='현재 비밀번호가 올바르지 않습니다.';errEl.style.display='block';return}
  const {error}=await sb.auth.updateUser({password:nw});
  if(error){errEl.textContent=error.message;errEl.style.display='block';return}
  document.getElementById('mp-cur-pw').value='';
  document.getElementById('mp-new-pw').value='';
  document.getElementById('mp-new-pw2').value='';
  toast('비밀번호가 변경되었습니다 ✓');
}

async function saveResolution(){
  const val=document.getElementById('mp-resolution').value.trim();
  const {error}=await sb.auth.updateUser({data:{...currentUser.user_metadata,resolution:val}});
  if(error){toast('저장 실패: '+error.message);return}
  currentUser.user_metadata.resolution=val;
  toast('다짐이 저장되었습니다 ✓');
}

async function saveSubjects(){
  const kor=document.getElementById('mp-sel-kor').value;
  const math=document.getElementById('mp-sel-math').value;
  const exp1=document.getElementById('mp-sel-exp1').value;
  const exp2=document.getElementById('mp-sel-exp2').value;
  const newMeta={...currentUser.user_metadata,suneung_kor:kor,suneung_math:math,suneung_exp1:exp1,suneung_exp2:exp2};
  const {data,error}=await sb.auth.updateUser({data:newMeta});
  if(error){toast('저장 실패: '+error.message);return}
  currentUser.user_metadata=newMeta;
  // 정보 업데이트
  document.getElementById('mp-kor').textContent=kor;
  document.getElementById('mp-math').textContent=math;
  document.getElementById('mp-exp1').textContent=exp1;
  document.getElementById('mp-exp2').textContent=exp2;
  // 과목 목록 재구성
  subjects=buildSubjectsFromMeta(newMeta);
  await loadSubjectsFromDB();
  toast('선택과목이 변경되었습니다 ✓');
}

// ── NAVIGATION ──
function navigate(page){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('page-'+page).classList.add('active');
  document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
  closeSidebar();window.scrollTo(0,0);
  if(page==='admin')loadAdminList();
}
function openSidebar(){document.getElementById('sidebar').classList.add('open');document.getElementById('sidebar-overlay').classList.add('visible')}
function closeSidebar(){document.getElementById('sidebar').classList.remove('open');document.getElementById('sidebar-overlay').classList.remove('visible')}

// ── D-DAY ──
function updateDday(){
  const target=new Date('2026-11-19');const now=new Date();now.setHours(0,0,0,0);
  const diff=Math.max(0,Math.ceil((target-now)/86400000));
  document.getElementById('dash-dday').textContent=`D-${diff}`;
  document.getElementById('dash-dday2').textContent=diff;
}

// ── TIMETABLE ──
const TT={1:[{s:'국어',t:'08:30–09:20'},{s:'영어',t:'09:30–10:20'},{s:'수학',t:'10:30–11:20',m:true},{s:'사회탐구',t:'11:30–12:20'},{s:'점심',t:'12:20–13:10',lunch:true},{s:'과학탐구',t:'13:10–14:00'},{s:'자율학습',t:'14:10–15:00'}],2:[{s:'수학',t:'08:30–09:20'},{s:'국어',t:'09:30–10:20'},{s:'영어',t:'10:30–11:20'},{s:'사회탐구',t:'11:30–12:20'},{s:'점심',t:'12:20–13:10',lunch:true},{s:'체육',t:'13:10–14:00',m:true},{s:'자율학습',t:'14:10–15:00'}],3:[{s:'국어',t:'08:30–09:20'},{s:'영어',t:'09:30–10:20'},{s:'수학',t:'10:30–11:20',m:true},{s:'사회탐구',t:'11:30–12:20'},{s:'점심',t:'12:20–13:10',lunch:true},{s:'과학탐구',t:'13:10–14:00'},{s:'체육',t:'14:10–15:00',m:true}],4:[{s:'수학',t:'08:30–09:20'},{s:'국어',t:'09:30–10:20'},{s:'영어',t:'10:30–11:20'},{s:'과학탐구',t:'11:30–12:20'},{s:'점심',t:'12:20–13:10',lunch:true},{s:'사회탐구',t:'13:10–14:00'},{s:'자율학습',t:'14:10–15:00'}],5:[{s:'영어',t:'08:30–09:20'},{s:'수학',t:'09:30–10:20'},{s:'국어',t:'10:30–11:20'},{s:'과학탐구',t:'11:30–12:20'},{s:'점심',t:'12:20–13:10',lunch:true},{s:'사회탐구',t:'13:10–14:00'},{s:'자율학습',t:'14:10–15:00'}],6:[{s:'자율학습',t:'10:00–16:00'}],0:[{s:'자율학습',t:'10:00–12:00'}]};
const PT=[[830,920],[930,1020],[1030,1120],[1130,1220],[1220,1310],[1310,1400],[1410,1500]];
function nowPeriod(){const hm=new Date().getHours()*100+new Date().getMinutes();for(let i=0;i<PT.length;i++)if(hm>=PT[i][0]&&hm<PT[i][1])return i;return -1}
function renderTimetable(){
  const dow=new Date().getDay();const periods=TT[dow]||[];const np=nowPeriod();
  const el=document.getElementById('dash-timetable');el.innerHTML='';
  if(!periods.length){el.innerHTML='<div style="text-align:center;padding:16px;color:var(--ink-48);font-size:13px">오늘은 시간표가 없습니다</div>';return}
  periods.forEach((p,i)=>{
    const isNow=i===np;const row=document.createElement('div');row.className='period-row'+(isNow?' now':'');
    row.innerHTML=`<span class="period-num">${p.lunch?'점':i+1}</span><span class="period-subject">${p.s}</span><span class="period-time">${p.t}</span>${isNow?'<span class="period-badge now">현재</span>':''}${p.m&&!p.lunch?'<span class="period-badge move">이동</span>':''}`;
    el.appendChild(row);
  });
}

// ── MEAL (NEIS 급식 API 연동) ──
async function loadMeal(){
  const el=document.getElementById('dash-meal');
  const today=new Date();
  const todayStr=today.toISOString().slice(0,10);
  document.getElementById('meal-date-label').textContent=`${today.getMonth()+1}/${today.getDate()}`;
  const {data,error}=await sb.from('meals').select('*').eq('date',todayStr);
  if(error||!data||!data.length){
    el.innerHTML=`<div style="grid-column:1/-1;text-align:center;padding:16px;color:var(--ink-48);font-size:13px">오늘 급식 정보가 아직 없어요.${(currentRole==='admin'||currentRole==='owner')?' 관리자 페이지에서 수집할 수 있어요.':''}</div>`;
    return;
  }
  const order=['조식','중식','석식'];
  const byType={};data.forEach(m=>byType[m.meal_type]=m);
  el.innerHTML=order.map(label=>{
    const m=byType[label];
    const items=m?(m.menu||[]):[];
    return`<div class="meal-col"><div class="meal-col-label">${label}</div><ul>${items.length?items.map(i=>`<li>${i}</li>`).join(''):'<li style="color:var(--ink-48)">정보 없음</li>'}</ul></div>`;
  }).join('');
}

// ── NOTICES (관리자/운영자 작성) ──
async function loadNotices(){
  const el=document.getElementById('dash-notices');
  const {data,error}=await sb.from('notices').select('*').order('created_at',{ascending:false}).limit(15);
  if(error){el.innerHTML='<div style="text-align:center;padding:24px;color:var(--ink-48);font-size:13px">공지사항을 불러올 수 없습니다</div>';return}
  if(!data||!data.length){el.innerHTML='<div style="text-align:center;padding:24px;color:var(--ink-48);font-size:13px">등록된 공지사항이 없습니다</div>';return}
  const canManage=currentRole==='admin'||currentRole==='owner';
  el.innerHTML=data.map(n=>{
    const created=new Date(n.created_at);
    const isNew=(Date.now()-created.getTime())<1000*60*60*24*3; // 3일 이내
    const dateStr=created.toLocaleDateString('ko-KR',{year:'2-digit',month:'2-digit',day:'2-digit'}).replace(/\. /g,'.');
    const delBtn=canManage?`<button class="notice-del-btn" onclick="deleteNotice(event,'${n.id}')">삭제</button>`:'';
    return`<div class="notice-item">
      <div class="notice-item-row" onclick="toggleNotice('${n.id}')">
        <div class="notice-icon">📋</div>
        <div class="notice-title">${n.title}${isNew?'<span class="badge-new">NEW</span>':''}</div>
        <div class="notice-date">${dateStr}</div>
      </div>
      <div class="notice-content" id="notice-content-${n.id}">
        ${n.content}
        <div class="notice-meta-row"><span class="notice-author">${n.author_name} 작성</span>${delBtn}</div>
      </div>
    </div>`;
  }).join('');
}

function toggleNotice(id){
  const el=document.getElementById(`notice-content-${id}`);
  el.classList.toggle('open');
}

function openNoticeModal(){
  document.getElementById('notice-title-input').value='';
  document.getElementById('notice-content-input').value='';
  document.getElementById('notice-error').style.display='none';
  document.getElementById('notice-modal').classList.add('open');
}
function closeNoticeModal(){document.getElementById('notice-modal').classList.remove('open')}

async function submitNotice(){
  if(currentRole!=='admin'&&currentRole!=='owner'){toast('권한이 없습니다');return}
  const title=document.getElementById('notice-title-input').value.trim();
  const content=document.getElementById('notice-content-input').value.trim();
  const errEl=document.getElementById('notice-error');
  if(!title||!content){errEl.textContent='제목과 내용을 모두 입력하세요.';errEl.style.display='block';return}
  const {error}=await sb.from('notices').insert({
    title,content,author_name:currentName||currentStudentId+'번',student_id:currentStudentId
  });
  if(error){errEl.textContent='게시 실패: '+error.message;errEl.style.display='block';return}
  closeNoticeModal();
  toast('공지가 게시되었습니다 ✓');
  await loadNotices();
}

async function deleteNotice(event,id){
  event.stopPropagation();
  if(currentRole!=='admin'&&currentRole!=='owner'){toast('권한이 없습니다');return}
  if(!confirm('이 공지를 삭제할까요?'))return;
  const {error}=await sb.from('notices').delete().eq('id',id);
  if(error){toast('삭제 실패: '+error.message);return}
  toast('삭제되었습니다');
  await loadNotices();
}

// ── PLANNER DATE ──
function updatePlannerDate(){
  const d=new Date();const days=['일','월','화','수','목','금','토'];
  document.getElementById('planner-date-label').textContent=`${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}

// ── LOAD SESSIONS FROM DB ──
async function loadTodaySessions(){
  const today=new Date().toISOString().slice(0,10);
  const {data}=await sb.from('study_sessions').select('*').eq('user_id',currentUser.id).eq('date',today).order('started_at');
  todaySessions=data||[];
  // 과목별 태스크 누적 시간 계산 (DB 기준)
  const taskTotals={}; // key: "subject::task_name" -> seconds
  todaySessions.forEach(s=>{
    const key=`${s.subject}::${s.task_name}`;
    taskTotals[key]=(taskTotals[key]||0)+s.duration_seconds;
  });
  // subjects에 반영 (메모리 값이 DB보다 크면 메모리 우선)
  subjects.forEach(sub=>{
    sub.tasks.forEach(task=>{
      const key=`${sub.name}::${task.name}`;
      const dbSec=taskTotals[key]||0;
      task.seconds=Math.max(task.seconds,dbSec);
    });
  });
  totalTodaySec=Object.values(taskTotals).reduce((a,b)=>a+b,0);
  document.getElementById('dash-today-time').textContent=fmtHM(totalTodaySec);
  document.getElementById('stat-total-time').textContent=fmtSec(totalTodaySec);
  document.getElementById('rep-today').textContent=fmtHM(totalTodaySec);
  renderSessionLog();renderTimeblock();
}

// ── BUILD SUBJECTS FROM SUNEUNG ──
function buildSubjectsFromMeta(meta) {
  const base = ['국어', '수학', '영어', '한국사'];
  const extras = [
    meta?.suneung_kor,
    meta?.suneung_math,
    meta?.suneung_exp1,
    meta?.suneung_exp2
  ].filter(Boolean);
  // deduplicate
  const all = [...new Set([...base, ...extras])];
  return all.map((name, i) => ({
    name,
    color: SUBJECT_COLORS[i % SUBJECT_COLORS.length],
    tasks: []
  }));
}

// ── LOAD TASKS FROM DB ──
async function loadSubjectsFromDB(){
  const today=new Date().toISOString().slice(0,10);
  const {data}=await sb.from('study_tasks').select('*').eq('user_id',currentUser.id).eq('date',today).order('created_at');
  // subjects는 이미 buildSubjectsFromMeta로 초기화됨 — 태스크만 채워넣기
  subjects.forEach(sub=>sub.tasks=[]);
  (data||[]).forEach(t=>{
    let sub=subjects.find(s=>s.name===t.subject);
    if(!sub){
      // DB에 있지만 목록에 없는 과목은 추가
      sub={name:t.subject,color:SUBJECT_COLORS[subjects.length%SUBJECT_COLORS.length],tasks:[]};
      subjects.push(sub);
    }
    sub.tasks.push({id:t.id,name:t.task_name,done:t.is_done,seconds:0,dbId:t.id});
  });
  // 세션 시간 병합
  todaySessions.forEach(s=>{
    const sub=subjects.find(su=>su.name===s.subject);
    if(!sub)return;
    const task=sub.tasks.find(t=>t.name===s.task_name);
    if(task)task.seconds+=s.duration_seconds;
  });
  renderSubjects();
}

// ── RENDER SUBJECTS ──
function renderSubjects(){
  const el=document.getElementById('subject-list');el.innerHTML='';
  subjects.forEach((sub,si)=>{
    const subSec=sub.tasks.reduce((s,t)=>s+t.seconds,0);
    const isRunning=activeTimer&&activeTimer.subjectIdx===si;
    const block=document.createElement('div');block.className='subject-block';block.id=`sub-${si}`;
    block.innerHTML=`
      <div class="subject-header" onclick="toggleSubject(${si})">
        <div class="subject-dot" style="background:${sub.color}"></div>
        <span class="subject-name-txt">${sub.name}</span>
        <span class="subject-total-time${isRunning?' running':''}">${fmtSec(subSec)}</span>
        <button class="subject-add-btn" onclick="event.stopPropagation();openAddTaskForm(${si})">+</button>
      </div>
      <div class="subject-tasks" id="tasks-${si}">
        ${sub.tasks.map((t,ti)=>renderTaskHTML(si,ti,t,sub.color)).join('')}
        <div class="task-add-form" id="add-task-form-${si}" style="display:none">
          <input class="task-add-input" id="task-input-${si}" placeholder="할 일 이름..." onkeydown="if(event.key==='Enter')addTask(${si})">
          <button class="task-add-submit" onclick="addTask(${si})">추가</button>
        </div>
      </div>`;
    el.appendChild(block);
  });
}

function renderTaskHTML(si,ti,t,color){
  const isRunning=activeTimer&&activeTimer.subjectIdx===si&&activeTimer.taskIdx===ti;
  const stopIcon=`<svg viewBox="0 0 10 10"><rect x="1" y="1" width="8" height="8" rx="1"/></svg>`;
  const playIcon=`<svg viewBox="0 0 10 10"><path d="M2 1l7 4-7 4V1z"/></svg>`;
  return`<div class="task-row" id="task-${si}-${ti}">
    <div class="task-done-check${t.done?' checked':''}" onclick="toggleTaskDone(${si},${ti})"></div>
    <span class="task-name">${t.name}</span>
    <span class="task-time${isRunning?' running':''}">${fmtSec(t.seconds)}</span>
    <button class="task-play-btn${isRunning?' running':''}" onclick="openTimerView(${si},${ti})" title="타이머 시작">
      ${isRunning?stopIcon:playIcon}
    </button>
    <button class="task-edit-btn" onclick="editTask(${si},${ti})" title="수정">
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M11.5 2.5l2 2-8 8H3.5v-2l8-8z"/></svg>
    </button>
    <button class="task-del-btn" onclick="deleteTask(${si},${ti})" title="삭제">×</button>
  </div>`;
}

function toggleSubject(si){
  const el=document.getElementById(`tasks-${si}`);
  el.style.display=el.style.display==='none'?'':'none';
}
function openAddTaskForm(si){
  const f=document.getElementById(`add-task-form-${si}`);
  f.style.display=f.style.display==='none'?'flex':'none';
  if(f.style.display==='flex')document.getElementById(`task-input-${si}`).focus();
}

async function addTask(si){
  const inp=document.getElementById(`task-input-${si}`);
  const name=inp.value.trim();if(!name)return;
  const today=new Date().toISOString().slice(0,10);
  const {data,error}=await sb.from('study_tasks').insert({user_id:currentUser.id,subject:subjects[si].name,task_name:name,is_done:false,date:today}).select().single();
  if(error){toast('추가 실패: '+error.message);return}
  subjects[si].tasks.push({id:data.id,name,done:false,seconds:0,dbId:data.id});
  inp.value='';renderSubjects();
}

async function toggleTaskDone(si,ti){
  const task=subjects[si].tasks[ti];task.done=!task.done;
  if(task.dbId)await sb.from('study_tasks').update({is_done:task.done}).eq('id',task.dbId);
  renderSubjects();
}

async function deleteTask(si,ti){
  const task=subjects[si].tasks[ti];
  if(task.dbId)await sb.from('study_tasks').delete().eq('id',task.dbId);
  subjects[si].tasks.splice(ti,1);
  renderSubjects();
}

async function editTask(si,ti){
  const task=subjects[si].tasks[ti];
  const newName=prompt('할 일 이름을 수정하세요:', task.name);
  if(!newName||newName.trim()===task.name)return;
  const trimmed=newName.trim();
  if(task.dbId)await sb.from('study_tasks').update({task_name:trimmed}).eq('id',task.dbId);
  subjects[si].tasks[ti].name=trimmed;
  renderSubjects();
  toast('수정되었습니다 ✓');
}

// ── FULLSCREEN TIMER ──
let tfInterval=null;let tfPaused=false;let tfCurrentSi=-1;let tfCurrentTi=-1;

function openTimerView(si,ti){
  tfCurrentSi=si;tfCurrentTi=ti;
  // 타이머가 다른 태스크에서 실행 중이면 먼저 멈춤
  if(activeTimer&&(activeTimer.subjectIdx!==si||activeTimer.taskIdx!==ti))stopCurrentTimer();
  // 타이머 시작
  if(!activeTimer)startTaskTimer(si,ti);
  // 전체화면 열기
  const fs=document.getElementById('timer-fullscreen');
  fs.classList.add('open');
  document.body.style.overflow='hidden';
  // 날짜
  const d=new Date();const days=['일','월','화','수','목','금','토'];
  document.getElementById('tf-date-label').textContent=`${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
  // 렌더
  renderTfSubjectList();
  renderTfRankGrid();
  // 1초 업데이트
  clearInterval(tfInterval);
  tfInterval=setInterval(()=>{
    updateTfDisplay();
    renderTfSubjectList();
  },1000);
}

function closeTimerView(){
  clearInterval(tfInterval);
  document.getElementById('timer-fullscreen').classList.remove('open');
  document.body.style.overflow='';
}

function updateTfDisplay(){
  if(tfCurrentSi<0||tfCurrentTi<0)return;
  const sub=subjects[tfCurrentSi];const task=sub?.tasks[tfCurrentTi];
  if(!sub||!task)return;
  const t=task.seconds;
  document.getElementById('tf-subject-label').textContent=sub.name+' ';
  document.getElementById('tf-time-label').textContent=fmtSec(t);
  document.getElementById('tf-focus-time').textContent=fmtSec(t);
}

function renderTfSubjectList(){
  const el=document.getElementById('tf-subject-list');
  const pfx=document.getElementById('tf-task-progress');
  pfx.innerHTML='';el.innerHTML='';
  const totalSec=subjects.reduce((s,sub)=>s+sub.tasks.reduce((a,t)=>a+t.seconds,0),0)||1;
  subjects.forEach((sub,si)=>{
    const subSec=sub.tasks.reduce((s,t)=>s+t.seconds,0);
    const section=document.createElement('div');section.className='tf-subject-section';
    const isActiveSub=si===tfCurrentSi;
    section.innerHTML=`
      <div class="tf-subject-header">
        <div class="tf-subject-dot" style="background:${sub.color}"></div>
        <span class="tf-subject-name">${sub.name}</span>
        <span class="tf-subject-time">${fmtSec(subSec)}</span>
      </div>
      <div class="tf-tasks">
        ${sub.tasks.map((t,ti)=>{
          const isRunning=activeTimer&&si===activeTimer.subjectIdx&&ti===activeTimer.taskIdx;
          const stopIcon=`<svg viewBox="0 0 10 10"><rect x="1" y="1" width="8" height="8" rx="1"/></svg>`;
          const playIcon=`<svg viewBox="0 0 10 10"><path d="M2 1l7 4-7 4V1z"/></svg>`;
          return`<div class="tf-task-row${isRunning?' active':''}" onclick="tfSwitchTask(${si},${ti})">
            <div class="tf-task-play${isRunning?' running':''}">
              ${isRunning?stopIcon:playIcon}
            </div>
            <span class="tf-task-name">${t.name}</span>
            <span class="tf-task-time${isRunning?' running':''}">${fmtSec(t.seconds)}</span>
          </div>`;
        }).join('')}
      </div>`;
    el.appendChild(section);
    // 상단 프로그레스바 (현재 집중 태스크)
    if(isActiveSub){
      sub.tasks.forEach((t,ti)=>{
        const pct=Math.round((t.seconds/totalSec)*100);
        pfx.innerHTML+=`<div class="tf-task-bar-row">
          <div class="tf-task-dot" style="background:${sub.color}"></div>
          <span class="tf-task-bar-label">${t.name}</span>
          <span class="tf-task-bar-time">${fmtSec(t.seconds)}</span>
        </div>
        <div class="tf-task-bar-track"><div class="tf-task-bar-fill" style="width:${pct}%;background:${sub.color}"></div></div>`;
      });
    }
  });
}

function tfSwitchTask(si,ti){
  if(activeTimer)stopCurrentTimer();
  tfCurrentSi=si;tfCurrentTi=ti;
  startTaskTimer(si,ti);
  renderTfSubjectList();
  updateTfDisplay();
}

function tfTogglePause(){
  const btn=document.getElementById('tf-pause-btn');
  if(!tfPaused){
    if(activeTimer){clearInterval(activeTimer.interval);tfPaused=true;}
    btn.textContent='▶ 계속하기';
  }else{
    if(activeTimer){
      const activeSub=subjects[activeTimer.subjectIdx].name;
      const prevElapsed=activeTimer.elapsed+(Math.floor((Date.now()-activeTimer.startedAt)/1000));
      activeTimer.startedAt=new Date();activeTimer.elapsed=prevElapsed;
      activeTimer.interval=setInterval(()=>{
        const elapsed=Math.floor((Date.now()-activeTimer.startedAt)/1000);
        subjects[activeTimer.subjectIdx].tasks[activeTimer.taskIdx].seconds=activeTimer.elapsed+elapsed;
        totalTodaySec=(todaySessions.reduce((s,r)=>s+r.duration_seconds,0))+activeTimer.elapsed+elapsed;
        updateTimerBadge(activeSub,subjects[activeTimer.subjectIdx].tasks[activeTimer.taskIdx].name,fmtSec(subjects[activeTimer.subjectIdx].tasks[activeTimer.taskIdx].seconds));
        document.getElementById('stat-total-time').textContent=fmtSec(totalTodaySec);
        document.getElementById('dash-today-time').textContent=fmtHM(totalTodaySec);
        document.getElementById('rep-today').textContent=fmtHM(totalTodaySec);
      },1000);
      tfPaused=false;
    }
    btn.textContent='⏸ 일시정지';
  }
}

async function tfStop(){
  clearInterval(tfInterval);
  await stopCurrentTimer();
  closeTimerView();
  renderSubjects();
}

async function renderTfRankGrid(){
  const today=new Date().toISOString().slice(0,10);
  const {data}=await sb.from('study_sessions').select('student_id,duration_seconds').eq('date',today);
  const byStudent={};
  (data||[]).forEach(r=>{byStudent[r.student_id]=(byStudent[r.student_id]||0)+r.duration_seconds});
  const sorted=Object.entries(byStudent).sort((a,b)=>b[1]-a[1]);
  document.getElementById('tf-rank-sub').textContent=`${sorted.length}명 공부중`;
  const el=document.getElementById('tf-rank-grid');
  el.innerHTML=sorted.map(([sid,sec],i)=>{
    const isMe=sid===currentStudentId;
    const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;
    const initial=isMe?(currentName?currentName[0]:sid.slice(-2)):sid.slice(-2);
    return`<div class="tf-rank-card${isMe?' me':''}">
      <div class="tf-rank-avatar">${initial}</div>
      <div class="tf-rank-name">${isMe?currentName||sid+'번':sid+'번'}</div>
      <div class="tf-rank-time">${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}</div>
    </div>`;
  }).join('')||'<div style="color:rgba(255,255,255,.3);font-size:13px;grid-column:1/-1;text-align:center;padding:20px">아직 공부 중인 친구가 없어요</div>';
}

// ── TIMER ──
function toggleTaskTimer(si,ti){
  if(activeTimer){
    if(activeTimer.subjectIdx===si&&activeTimer.taskIdx===ti){stopCurrentTimer();return}
    else stopCurrentTimer();
  }
  startTaskTimer(si,ti);
}

async function startTaskTimer(si,ti){
  const sub=subjects[si];const task=sub.tasks[ti];
  const startedAt=new Date();
  const prevSeconds=task.seconds; // 이전까지 쌓인 시간 보존
  // 새 세션 insert (이번 구간 기록용)
  const {data:sess}=await sb.from('study_sessions').insert({
    user_id:currentUser.id,student_id:currentStudentId,
    subject:sub.name,task_name:task.name,
    duration_seconds:0,started_at:startedAt.toISOString(),
    date:new Date().toISOString().slice(0,10)
  }).select().single();
  const sessionId=sess?.id;
  activeTimer={subjectIdx:si,taskIdx:ti,startedAt,sessionId,prevSeconds};
  activeTimer.interval=setInterval(()=>{
    const elapsed=Math.floor((Date.now()-startedAt)/1000);
    subjects[si].tasks[ti].seconds=prevSeconds+elapsed;
    // 오늘 총 시간 = DB에 저장된 완료 세션들 + 현재 진행 중 elapsed
    const dbTotal=todaySessions.reduce((s,r)=>s+r.duration_seconds,0);
    totalTodaySec=dbTotal+elapsed;
    // UI 업데이트
    updateTimerBadge(sub.name,task.name,fmtSec(subjects[si].tasks[ti].seconds));
    document.getElementById('stat-total-time').textContent=fmtSec(totalTodaySec);
    document.getElementById('dash-today-time').textContent=fmtHM(totalTodaySec);
    document.getElementById('rep-today').textContent=fmtHM(totalTodaySec);
    const taskEl=document.getElementById(`task-${si}-${ti}`);
    if(taskEl){const timeEl=taskEl.querySelector('.task-time');if(timeEl)timeEl.textContent=fmtSec(subjects[si].tasks[ti].seconds)}
    const subEl=document.getElementById(`sub-${si}`);
    if(subEl){const subTime=subEl.querySelector('.subject-total-time');if(subTime)subTime.textContent=fmtSec(subjects[si].tasks.reduce((s,t)=>s+t.seconds,0))}
    renderSessionLog();
  },1000);
  showTimerBadge(sub.name,task.name);
  renderSubjects();
}

async function stopCurrentTimer(){
  if(!activeTimer)return;
  clearInterval(activeTimer.interval);
  const elapsed=Math.floor((Date.now()-activeTimer.startedAt)/1000);
  const endedAt=new Date().toISOString();
  // 이번 구간만 DB에 저장
  if(activeTimer.sessionId){
    await sb.from('study_sessions').update({duration_seconds:elapsed,ended_at:endedAt}).eq('id',activeTimer.sessionId);
  }
  // 태스크 누적 시간 확정
  subjects[activeTimer.subjectIdx].tasks[activeTimer.taskIdx].seconds=activeTimer.prevSeconds+elapsed;
  const savedSeconds=subjects[activeTimer.subjectIdx].tasks[activeTimer.taskIdx].seconds;
  activeTimer=null;
  hideTimerBadge();
  // DB 세션 다시 로드 (리스트/타임블록 갱신) — 단, task.seconds는 위에서 이미 확정했으므로 덮어쓰지 않음
  await loadTodaySessionsOnly();
  // 확정된 시간 복원 (loadTodaySessionsOnly가 덮어쓸 수 있으므로)
  const si=subjects.findIndex(s=>s.tasks.some(t=>t.seconds===savedSeconds));
  renderSubjects();
  await refreshStats();
}

// DB 세션만 다시 불러오고 태스크 시간은 건드리지 않음
async function loadTodaySessionsOnly(){
  const today=new Date().toISOString().slice(0,10);
  const {data}=await sb.from('study_sessions').select('*').eq('user_id',currentUser.id).eq('date',today).order('started_at');
  todaySessions=data||[];
  renderSessionLog();renderTimeblock();
}

function showTimerBadge(sub,task){const b=document.getElementById('timer-badge');b.classList.add('visible');document.getElementById('badge-subject').textContent=sub;document.getElementById('badge-task').textContent=task}
function hideTimerBadge(){document.getElementById('timer-badge').classList.remove('visible')}
function updateTimerBadge(sub,task,time){document.getElementById('badge-subject').textContent=sub;document.getElementById('badge-task').textContent=task;document.getElementById('badge-time').textContent=time}

// ADD SUBJECT
function openAddSubjectModal(){document.getElementById('add-subject-modal').classList.add('open');document.getElementById('new-subject-input').focus()}
function addSubject(){
  const name=document.getElementById('new-subject-input').value.trim();if(!name){toast('과목 이름을 입력하세요');return}
  if(subjects.find(s=>s.name===name)){toast('이미 있는 과목입니다');return}
  subjects.push({name,color:SUBJECT_COLORS[subjects.length%SUBJECT_COLORS.length],tasks:[]});
  document.getElementById('add-subject-modal').classList.remove('open');
  document.getElementById('new-subject-input').value='';
  renderSubjects();
}

// SESSION LOG
function renderSessionLog(){
  const el=document.getElementById('session-log-list');
  // 진행 중인 타이머 포함한 전체 태스크 기준으로 합산
  const colors={};subjects.forEach(s=>colors[s.name]=s.color);

  // subjects 기준으로 태스크별 총 시간 집계
  const items=[];
  subjects.forEach(sub=>{
    sub.tasks.forEach(task=>{
      if(task.seconds>0){
        items.push({
          subject:sub.name,
          task:task.name,
          color:colors[sub.name]||'#7a7a7a',
          seconds:task.seconds,
          isRunning:activeTimer&&subjects[activeTimer.subjectIdx]?.name===sub.name&&sub.tasks[activeTimer.taskIdx]?.name===task.name
        });
      }
    });
  });

  if(!items.length){
    el.innerHTML='<div style="text-align:center;padding:32px;color:var(--ink-48);font-size:13px">아직 기록된 공부가 없어요</div>';
    return;
  }

  el.innerHTML=items.map(item=>`
    <div class="list-session-row">
      <div class="list-session-dot" style="background:${item.color}"></div>
      <div class="list-session-info">
        <div class="list-session-subject">${item.subject}${item.isRunning?'&nbsp;<span style="font-size:10px;font-weight:600;padding:1px 6px;background:var(--blue);color:#fff;border-radius:999px">기록 중</span>':''}</div>
        <div class="list-session-task">${item.task}</div>
      </div>
      <div style="text-align:right">
        <div class="list-session-dur" style="font-size:16px">${fmtSec(item.seconds)}</div>
      </div>
    </div>
  `).join('');
}

// TIMEBLOCK
function renderTimeblock(){
  const el=document.getElementById('timeblock-grid');el.innerHTML='';
  const colors={};subjects.forEach(s=>colors[s.name]=s.color);
  for(let h=6;h<=23;h++){
    const row=document.createElement('div');row.className='timeblock-hour-row';
    row.innerHTML=`<div class="timeblock-hour-label">${String(h).padStart(2,'0')}:00</div><div class="timeblock-hour-line" id="tbline-${h}" style="position:relative;flex:1;border-top:1px solid var(--hairline);min-height:48px"></div>`;
    el.appendChild(row);
  }
  todaySessions.forEach(s=>{
    if(!s.started_at)return;
    const start=new Date(s.started_at);const sh=start.getHours();const sm=start.getMinutes();
    if(sh<6||sh>23)return;
    const topPx=(sm/60)*48;const heightPx=Math.max((s.duration_seconds/3600)*48,18);
    const line=document.getElementById(`tbline-${sh}`);if(!line)return;
    const block=document.createElement('div');
    block.style.cssText=`position:absolute;top:${topPx}px;left:4px;right:4px;height:${heightPx}px;background:${colors[s.subject]||'#7a7a7a'};border-radius:5px;padding:3px 7px;font-size:11px;font-weight:600;color:#fff;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;`;
    block.textContent=`${s.subject} · ${s.task_name}`;
    line.appendChild(block);
  });
}

function switchView(v){
  document.getElementById('list-view').style.display=v==='list'?'block':'none';
  document.getElementById('block-view').style.display=v==='block'?'block':'none';
  document.getElementById('btn-list-view').classList.toggle('active',v==='list');
  document.getElementById('btn-block-view').classList.toggle('active',v==='block');
}

// STATS
async function refreshStats(){
  const today=new Date().toISOString().slice(0,10);
  const {data}=await sb.from('study_sessions').select('student_id,duration_seconds,ended_at').eq('date',today);
  if(!data)return;
  const byStudent={};
  data.forEach(r=>{byStudent[r.student_id]=(byStudent[r.student_id]||0)+r.duration_seconds});
  const myTotal=byStudent[currentStudentId]||0;
  const participants=Object.keys(byStudent).length;
  const sorted=Object.values(byStudent).sort((a,b)=>b-a);
  const rank=sorted.findIndex(v=>v<=myTotal)+1||participants+1;
  const pct=participants>1?Math.round((1-(rank-1)/participants)*100):100;
  document.getElementById('stat-participants').textContent=participants+'명';
  document.getElementById('stat-rank').textContent=`${rank}/${participants}등`;
  document.getElementById('stat-percent').textContent=pct+'%';
  document.getElementById('dash-rank-text').textContent=`반 ${rank}위 · ${fmtHM(myTotal)}`;
}

// REPORT
function renderReport(){
  const WEEK_MINS=[480,390,510,320,365,420,280];
  const max=Math.max(...WEEK_MINS);const today=new Date().getDay();
  const el=document.getElementById('week-chart');el.innerHTML=WEEK_MINS.map((m,i)=>{
    const h=Math.round((m/max)*56);const isToday=(i+1)%7===today||(today===0&&i===6);
    return`<div class="week-bar-wrap"><div class="week-bar${m>0?' has-data':''}${isToday?' today':''}" style="height:${h}px"></div></div>`;
  }).join('');
  const total=subjects.reduce((s,sub)=>s+sub.tasks.reduce((a,t)=>a+t.seconds,0),0)||1;
  document.getElementById('subject-progress').innerHTML=subjects.map(sub=>{
    const sec=sub.tasks.reduce((s,t)=>s+t.seconds,0);const pct=Math.round((sec/total)*100);
    return`<div class="progress-item"><div class="progress-meta"><span class="progress-label">${sub.name}</span><span class="progress-val">${fmtHM(sec)}</span></div><div class="progress-track"><div class="progress-fill" style="width:${pct}%;background:${sub.color}"></div></div></div>`;
  }).join('')||'<div style="text-align:center;padding:16px;color:var(--ink-48);font-size:13px">기록 없음</div>';
  const RANK=[{name:'김민준',min:522,me:false},{name:'이서연',min:441,me:false},{name:currentName,min:Math.floor(totalTodaySec/60),me:true},{name:'박지훈',min:323,me:false},{name:'최예린',min:281,me:false}];
  const maxR=RANK[0].min||1;const medals=['🥇','🥈','🥉'];
  document.getElementById('rank-list').innerHTML=RANK.map((r,i)=>{
    const pct=Math.round((r.min/maxR)*100);const h=Math.floor(r.min/60),m=r.min%60;
    return`<div class="rank-row${r.me?' me':''}"><span class="rank-pos">${medals[i]||i+1}</span><span class="rank-name">${r.name}</span><div class="rank-bar-track"><div class="rank-bar-fill" style="width:${pct}%"></div></div><span class="rank-time">${h}h ${String(m).padStart(2,'0')}m</span></div>`;
  }).join('');
}

// ── BOARDS ──
function previewPhoto(type){
  const input=document.getElementById(`${type}-photo`);
  const file=input.files[0];
  if(!file)return;
  if(file.size>10*1024*1024){toast('사진은 10MB 이하만 가능합니다');input.value='';return}
  document.getElementById(`${type}-photo-name`).textContent=file.name;
  document.getElementById(`${type}-photo-clear`).style.display='flex';
  const reader=new FileReader();
  reader.onload=e=>{
    document.getElementById(`${type}-photo-img`).src=e.target.result;
    document.getElementById(`${type}-photo-preview`).style.display='block';
  };
  reader.readAsDataURL(file);
}

function clearPhoto(type){
  document.getElementById(`${type}-photo`).value='';
  document.getElementById(`${type}-photo-name`).textContent='파일 없음';
  document.getElementById(`${type}-photo-clear`).style.display='none';
  document.getElementById(`${type}-photo-preview`).style.display='none';
  document.getElementById(`${type}-photo-img`).src='';
}

async function submitPost(type){
  const contentEl=document.getElementById(`${type}-content`);
  const content=contentEl.value.trim();
  if(!content){toast('내용을 입력해주세요');return}
  const submitBtn=document.getElementById(`${type}-submit-btn`);
  submitBtn.textContent='올리는 중...';submitBtn.disabled=true;
  const subject=type==='qna'?document.getElementById('qna-subject').value:null;
  let imageUrl=null;
  const photoInput=document.getElementById(`${type}-photo`);
  const file=photoInput.files[0];
  if(file){
    const ext=file.name.split('.').pop();
    const fileName=`${currentStudentId}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const {error:upErr}=await sb.storage.from('board-photos').upload(fileName,file);
    if(upErr){toast('사진 업로드 실패: '+upErr.message);submitBtn.textContent=type==='free'?'게시하기':'질문 올리기';submitBtn.disabled=false;return}
    const {data:urlData}=sb.storage.from('board-photos').getPublicUrl(fileName);
    imageUrl=urlData.publicUrl;
  }
  const {error}=await sb.from('posts').insert({
    user_id:currentUser.id,student_id:currentStudentId,
    author_name:currentName||currentStudentId+'번',
    category:type,subject,content,image_url:imageUrl
  });
  if(error){toast('게시 실패: '+error.message);submitBtn.textContent=type==='free'?'게시하기':'질문 올리기';submitBtn.disabled=false;return}
  contentEl.value='';clearPhoto(type);
  submitBtn.textContent=type==='free'?'게시하기':'질문 올리기';submitBtn.disabled=false;
  toast('게시되었습니다 ✓');
  if(type==='free')await loadFreeBoard();else await loadQnaBoard();
}

async function deletePost(id,imageUrl,type){
  if(!confirm('정말 삭제할까요?'))return;
  if(imageUrl){
    const parts=imageUrl.split('/board-photos/');
    if(parts[1])await sb.storage.from('board-photos').remove([parts[1]]);
  }
  await sb.from('posts').delete().eq('id',id);
  toast('삭제되었습니다');
  if(type==='free')await loadFreeBoard();else await loadQnaBoard();
}

function renderPost(p,type,comments=[]){
  const isMe=p.student_id===currentStudentId;
  const date=new Date(p.created_at).toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
  const imgHtml=p.image_url?`<img class="post-img" src="${p.image_url}" alt="첨부사진" onclick="openLightbox('${p.image_url}')">`:'' ;
  const subjectPill=p.subject?`<span class="qna-subject-pill">${p.subject}</span>`:'';
  const deleteBtn=isMe?`<button class="post-delete-btn" onclick="deletePost('${p.id}','${p.image_url||''}','${type}')">삭제</button>`:'';
  const commentsHtml=comments.map(c=>{
    const isMyComment=c.student_id===currentStudentId;
    const cDate=new Date(c.created_at).toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
    return`<div class="comment-item">
      <div class="comment-avatar">${c.author_name?c.author_name[0]:'?'}</div>
      <div class="comment-body">
        <div class="comment-meta">
          <span class="comment-author">${c.author_name}</span>
          <span class="comment-time">${cDate}</span>
          ${isMyComment?`<button class="comment-del" onclick="deleteComment('${c.id}','${p.id}','${type}')">삭제</button>`:''}
        </div>
        <div class="comment-text">${c.content}</div>
      </div>
    </div>`;
  }).join('');
  const commentCount=comments.length;
  return`<div class="qna-card" id="post-${p.id}">
    <div class="qna-header">
      <div class="qna-avatar">${p.author_name?p.author_name[0]:'?'}</div>
      <span class="qna-author">${p.author_name}</span>
      <span class="qna-time" style="margin-left:6px;font-size:11px;color:var(--ink-48)">${date}</span>
      ${subjectPill}${deleteBtn}
    </div>
    <div class="qna-content">${p.content}</div>
    ${imgHtml}
    <div class="comment-section">
      <button class="comment-toggle-btn" onclick="toggleComments('${p.id}')">
        💬 댓글 ${commentCount}개${commentCount?` 보기`:''}
      </button>
      <div id="comments-${p.id}" style="display:none">
        <div class="comment-list" id="comment-list-${p.id}">${commentsHtml}</div>
        <div class="comment-input-row">
          <input class="comment-input" id="comment-input-${p.id}" placeholder="댓글을 입력하세요..." onkeydown="if(event.key==='Enter')submitComment('${p.id}','${type}')">
          <button class="comment-submit" onclick="submitComment('${p.id}','${type}')">등록</button>
        </div>
      </div>
    </div>
  </div>`;
}

function toggleComments(postId){
  const el=document.getElementById(`comments-${postId}`);
  el.style.display=el.style.display==='none'?'block':'none';
  if(el.style.display==='block')document.getElementById(`comment-input-${postId}`)?.focus();
}

async function submitComment(postId,type){
  const inp=document.getElementById(`comment-input-${postId}`);
  const content=inp.value.trim();
  if(!content)return;
  const {data,error}=await sb.from('comments').insert({
    post_id:postId,user_id:currentUser.id,
    student_id:currentStudentId,
    author_name:currentName||currentStudentId+'번',
    content
  }).select().single();
  if(error){toast('댓글 등록 실패: '+error.message);return}
  inp.value='';
  // 댓글 목록에 바로 추가
  const list=document.getElementById(`comment-list-${postId}`);
  const cDate=new Date(data.created_at).toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
  const item=document.createElement('div');item.className='comment-item';
  item.innerHTML=`
    <div class="comment-avatar">${data.author_name[0]}</div>
    <div class="comment-body">
      <div class="comment-meta">
        <span class="comment-author">${data.author_name}</span>
        <span class="comment-time">${cDate}</span>
        <button class="comment-del" onclick="deleteComment('${data.id}','${postId}','${type}')">삭제</button>
      </div>
      <div class="comment-text">${data.content}</div>
    </div>`;
  list.appendChild(item);
  // 버튼 카운트 업데이트
  const card=document.getElementById(`post-${postId}`);
  if(card){
    const btn=card.querySelector('.comment-toggle-btn');
    if(btn){const cur=list.children.length;btn.textContent=`💬 댓글 ${cur}개 보기`;}
  }
}

async function deleteComment(commentId,postId,type){
  if(!confirm('댓글을 삭제할까요?'))return;
  await sb.from('comments').delete().eq('id',commentId);
  if(type==='free')await loadFreeBoard();else await loadQnaBoard();
}

async function loadFreeBoard(){
  const {data:posts}=await sb.from('posts').select('*').eq('category','free').order('created_at',{ascending:false}).limit(30);
  const el=document.getElementById('free-list');
  if(!posts||!posts.length){el.innerHTML='<div style="text-align:center;padding:32px;color:var(--ink-48);font-size:13px">아직 글이 없어요. 첫 글을 남겨보세요!</div>';return}
  const ids=posts.map(p=>p.id);
  const {data:comments}=await sb.from('comments').select('*').in('post_id',ids).order('created_at');
  const commentMap={};(comments||[]).forEach(c=>{if(!commentMap[c.post_id])commentMap[c.post_id]=[];commentMap[c.post_id].push(c)});
  el.innerHTML=posts.map(p=>renderPost(p,'free',commentMap[p.id]||[])).join('');
}

async function loadQnaBoard(){
  const {data:posts}=await sb.from('posts').select('*').eq('category','qna').order('created_at',{ascending:false}).limit(30);
  const el=document.getElementById('qna-list');
  if(!posts||!posts.length){el.innerHTML='<div style="text-align:center;padding:32px;color:var(--ink-48);font-size:13px">아직 질문이 없어요!</div>';return}
  const ids=posts.map(p=>p.id);
  const {data:comments}=await sb.from('comments').select('*').in('post_id',ids).order('created_at');
  const commentMap={};(comments||[]).forEach(c=>{if(!commentMap[c.post_id])commentMap[c.post_id]=[];commentMap[c.post_id].push(c)});
  el.innerHTML=posts.map(p=>renderPost(p,'qna',commentMap[p.id]||[])).join('');
}

function openLightbox(url){document.getElementById('lightbox-img').src=url;document.getElementById('img-lightbox').classList.add('open')}
function closeLightbox(){document.getElementById('img-lightbox').classList.remove('open')}

// ── ADMIN ──
async function loadMyRole(){
  const {data}=await sb.from('user_roles').select('role').eq('student_id',currentStudentId).single();
  currentRole=data?.role||'student';
  if(currentRole==='admin'||currentRole==='owner'){
    document.getElementById('nav-admin').style.display='flex';
    const noticeBtn=document.getElementById('notice-write-btn');
    if(noticeBtn)noticeBtn.style.display='inline';
    const mealCard=document.getElementById('admin-meal-card');
    if(mealCard)mealCard.style.display='block';
  }
  if(currentRole==='owner'){
    const card=document.getElementById('admin-create-card');
    if(card)card.style.display='block';
    const newsCard=document.getElementById('admin-news-card');
    if(newsCard)newsCard.style.display='block';
  }
  const badge=document.getElementById('admin-role-badge');
  if(badge){
    if(currentRole==='owner'){badge.textContent='운영자';badge.className='admin-role-badge owner';}
    else if(currentRole==='admin'){badge.textContent='관리자';badge.className='admin-role-badge admin';}
    else{badge.style.display='none';}
  }
}

let allAccounts=[];

async function loadAdminList(){
  if(currentRole!=='admin'&&currentRole!=='owner'){toast('권한이 없습니다');return}
  document.getElementById('admin-table-body').innerHTML='<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--ink-48);font-size:13px">로딩 중...</td></tr>';

  // 서버 API로 전체 계정 목록 가져오기 (이름 포함)
  const [usersRes, rolesRes] = await Promise.all([
    fetch(`${SERVER_URL}/api/users`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({student_id:currentStudentId})
    }),
    sb.from('user_roles').select('*')
  ]);

  const usersData = await usersRes.json();
  if(!usersRes.ok){toast('계정 목록 로드 실패: '+(usersData.error||''));return}

  const roleMap={};
  (rolesRes.data||[]).forEach(r=>roleMap[r.student_id]=r.role);

  // 서버에서 받은 유저 + 없는 학번은 기본값으로 채우기
  const serverMap={};
  (usersData.users||[]).forEach(u=>serverMap[u.student_id]=u);

  allAccounts=[];
  for(let i=30101;i<=30128;i++){
    const sid=String(i);
    const u=serverMap[sid];
    allAccounts.push({
      student_id:sid,
      name:u?.name||'—',
      suneung_kor:u?.suneung_kor||'—',
      suneung_math:u?.suneung_math||'—',
      suneung_exp1:u?.suneung_exp1||'—',
      suneung_exp2:u?.suneung_exp2||'—',
      role:roleMap[sid]||'student'
    });
  }
  renderAdminTable(allAccounts);
}

function filterAdminList(){
  const q=document.getElementById('admin-search').value.trim().toLowerCase();
  if(!q){renderAdminTable(allAccounts);return}
  renderAdminTable(allAccounts.filter(a=>
    a.student_id.includes(q)||(a.name&&a.name.includes(q))
  ));
}

function renderAdminTable(list){
  const isOwner=currentRole==='owner';
  const tbody=document.getElementById('admin-table-body');
  if(!list.length){tbody.innerHTML='<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--ink-48);font-size:13px">결과 없음</td></tr>';return}
  tbody.innerHTML=list.map(a=>{
    const isMe=a.student_id===currentStudentId;
    const rolePill=`<span class="role-pill ${a.role}">${a.role==='owner'?'운영자':a.role==='admin'?'관리자':'학생'}</span>`;
    const subjectInfo=a.suneung_kor!=='—'?`${a.suneung_kor} / ${a.suneung_math} / ${a.suneung_exp1} · ${a.suneung_exp2}`:'—';
    let actions='';
    if(!isMe){
      actions+=`<button class="admin-btn reset" onclick="resetPassword('${a.student_id}')">비번 초기화</button>`;
      if(isOwner){
        if(a.role==='student')actions+=`<button class="admin-btn promote" onclick="setRole('${a.student_id}','admin')">관리자 임명</button>`;
        if(a.role==='admin')actions+=`<button class="admin-btn demote" onclick="setRole('${a.student_id}','student')">관리자 박탈</button>`;
        actions+=`<button class="admin-btn demote" onclick="deleteAccount('${a.student_id}')">계정 삭제</button>`;
      }
    }else{
      actions=`<span style="font-size:11px;color:var(--ink-48)">본인</span>`;
    }
    return`<tr>
      <td style="font-weight:600">${a.student_id}</td>
      <td>${a.name}</td>
      <td style="font-size:12px;color:var(--ink-48)">${subjectInfo}</td>
      <td>${rolePill}</td>
      <td><div class="admin-actions">${actions}</div></td>
    </tr>`;
  }).join('');
}

async function fetchNewsNow(){
  const btn=event.target;btn.textContent='수집 중...';btn.disabled=true;
  const res=await fetch(`${SERVER_URL}/api/fetch-news`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({student_id:currentStudentId})
  });
  const data=await res.json();
  btn.textContent='지금 수집하기';btn.disabled=false;
  if(!res.ok){toast('수집 실패: '+(data.error||''));return}
  toast('뉴스 수집 완료! 입시뉴스 탭에서 확인하세요 ✓');
  renderNews();
}

async function fetchMealNow(){
  const btn=event.target;btn.textContent='수집 중...';btn.disabled=true;
  const res=await fetch(`${SERVER_URL}/api/fetch-meal`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({student_id:currentStudentId})
  });
  const data=await res.json();
  btn.textContent='지금 수집하기';btn.disabled=false;
  if(!res.ok){toast('수집 실패: '+(data.error||''));return}
  toast('급식 정보 수집 완료! 대시보드에서 확인하세요 ✓');
  loadMeal();
}

async function createAccount(){
  const sid=document.getElementById('create-student-id').value.trim();
  const pw=document.getElementById('create-password').value.trim()||'1234';
  if(!sid){toast('학번을 입력해주세요');return}
  if(!/^\d{5}$/.test(sid)){toast('학번은 5자리 숫자여야 합니다');return}
  if(!confirm(`${sid}번 계정을 생성할까요? (초기 비밀번호: ${pw})`))return;
  const res=await fetch(`${SERVER_URL}/api/create-user`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({student_id:currentStudentId,target_student_id:sid,password:pw})
  });
  const data=await res.json();
  if(!res.ok){toast('생성 실패: '+(data.error||''));return}
  document.getElementById('create-student-id').value='';
  document.getElementById('create-password').value='';
  toast(`${sid}번 계정이 생성되었습니다 ✓`);
  await loadAdminList();
}

async function deleteAccount(sid){
  if(currentRole!=='owner'){toast('운영자만 계정을 삭제할 수 있습니다');return}
  if(!confirm(`${sid}번 계정을 완전히 삭제할까요?\n이 작업은 되돌릴 수 없습니다.`))return;
  const res=await fetch(`${SERVER_URL}/api/delete-user`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({student_id:currentStudentId,target_student_id:sid})
  });
  const data=await res.json();
  if(!res.ok){toast('삭제 실패: '+(data.error||''));return}
  toast(`${sid}번 계정이 삭제되었습니다`);
  await loadAdminList();
}

async function setRole(sid,newRole){
  if(currentRole!=='owner'){toast('운영자만 권한을 변경할 수 있습니다');return}
  const label=newRole==='admin'?'관리자로 임명':'학생으로 변경';
  if(!confirm(`${sid}번을 ${label}할까요?`))return;
  const {error}=await sb.from('user_roles').upsert({
    student_id:sid,role:newRole,
    assigned_by:currentStudentId,
    assigned_at:new Date().toISOString()
  });
  if(error){toast('변경 실패: '+error.message);return}
  toast(`${sid}번 → ${label} 완료 ✓`);
  await loadAdminList();
}

async function resetPassword(sid){
  if(currentRole!=='admin'&&currentRole!=='owner'){toast('권한이 없습니다');return}
  if(!confirm(`${sid}번의 비밀번호를 1234로 초기화할까요?`))return;
  const res=await fetch(`${SERVER_URL}/api/reset-password`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({student_id:currentStudentId,target_student_id:sid})
  });
  const data=await res.json();
  if(!res.ok){toast('초기화 실패: '+(data.error||''));return}
  toast(`${sid}번 비밀번호가 1234로 초기화되었습니다 ✓`);
}
// ── 내신 산출 계산기 (학기별 과목/단위수/등급) ──
// TODO: 대학별 실제 입시 요강(반영비율·환산방식·등급컷) 데이터가 오면 대학별 환산 점수 기능을 다시 붙일 예정
const CALC_SEMESTERS=['1-1','1-2','2-1','2-2','3-1','3-2'];
const CALC_CATEGORIES=['국어','수학','영어','탐구','기타'];
let currentCalcSemester='1-1';
let calcData=null;

function escAttr(s){
  return String(s??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

const GEMINI_IMPORT_PROMPT=`첨부한 내 학교생활기록부(생기부) PDF에서 "7. 교과학습발달상황" 항목만 참고해서, 아래 JSON 형식으로만 출력해줘. 세부능력 및 특기사항(서술형 문구)은 무시하고 성적표 부분만 사용해.

출력 형식 (예시):
{
  "1-1": [
    {"name":"국어","category":"국어","unit":4,"type":"general","grade":2},
    {"name":"체육","category":"기타","unit":2,"type":"career","achievement":"A"}
  ],
  "1-2": [],
  "2-1": [],
  "2-2": [],
  "3-1": [],
  "3-2": []
}

규칙:
- 키는 "학년-학기" 형식 (1학년 1학기 → "1-1", 2학년 2학기 → "2-2" 등). 해당 학기 자료가 없으면 빈 배열 []
- name: 과목명 그대로
- category: 국어 계열(국어/문학/언어와매체 등)은 "국어", 수학 계열(수학/수학Ⅰ/수학Ⅱ/확률과통계/미적분/기하 등)은 "수학", 영어 계열(영어/영어Ⅰ/영어Ⅱ 등)은 "영어", 한국사·사회·과학 계열(통합사회/통합과학/물리학/화학/생명과학/지구과학 등)은 "탐구", 그 외(정보/제2외국어/한문/체육/예술/진로와직업 등)는 "기타"
- unit: 학점수(단위수) 숫자만
- type: 석차등급이 매겨진 일반선택 과목은 "general", 석차등급 없이 성취도(A/B/C 등)만 있는 진로선택·체육·예술·교양 과목은 "career"
- type이 "general"이면 grade에 석차등급 숫자(1~9)만 넣고 achievement는 넣지 마
- type이 "career"이면 achievement에 성취도(A/B/C/P 중 하나)를 넣고 grade는 넣지 마
- JSON 코드 외의 다른 설명, 인사말, 마크다운 코드블록 표시(\`\`\`)는 절대 출력하지 마. 순수 JSON 텍스트만 출력해`;

function openImportModal(){
  document.getElementById('gemini-prompt-text').value=GEMINI_IMPORT_PROMPT;
  document.getElementById('import-json-input').value='';
  document.getElementById('import-error').style.display='none';
  document.getElementById('import-calc-modal').classList.add('open');
}
function closeImportModal(){
  document.getElementById('import-calc-modal').classList.remove('open');
}
async function copyGeminiPrompt(){
  try{
    await navigator.clipboard.writeText(GEMINI_IMPORT_PROMPT);
    toast('프롬프트가 복사되었습니다 ✓');
  }catch(e){
    const ta=document.getElementById('gemini-prompt-text');
    ta.select();document.execCommand('copy');
    toast('프롬프트가 복사되었습니다 ✓');
  }
}

function sanitizeCalcRow(r){
  if(!r||typeof r!=='object')return null;
  const name=String(r.name||'').trim().slice(0,40);
  if(!name)return null;
  const category=CALC_CATEGORIES.includes(r.category)?r.category:'기타';
  let unit=Math.round((+r.unit||1)*2)/2;
  unit=Math.min(10,Math.max(0.5,unit));
  const type=r.type==='career'?'career':'general';
  if(type==='general'){
    let grade=Math.round(+r.grade);
    if(!(grade>=1&&grade<=9))grade=5;
    return{name,category,unit,type,grade};
  }else{
    let ach=String(r.achievement||'A').trim().toUpperCase();
    if(!['A','B','C','P'].includes(ach))ach='A';
    return{name,category,unit,type,achievement:ach};
  }
}

function importCalcJSON(){
  const errEl=document.getElementById('import-error');
  errEl.style.display='none';
  const raw=document.getElementById('import-json-input').value.trim();
  if(!raw){errEl.textContent='붙여넣은 내용이 없어요.';errEl.style.display='block';return}
  // Gemini가 코드블록(```json ... ```)을 붙여 출력하는 경우 제거
  const cleaned=raw.replace(/^```json\s*/i,'').replace(/^```\s*/,'').replace(/```\s*$/,'').trim();
  let parsed;
  try{
    parsed=JSON.parse(cleaned);
  }catch(e){
    errEl.textContent='JSON 형식이 올바르지 않아요. Gemini 답변에서 JSON 부분만 정확히 복사했는지 확인해주세요.';
    errEl.style.display='block';
    return;
  }
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed)){
    errEl.textContent='JSON 형식이 올바르지 않아요.';errEl.style.display='block';return;
  }
  let importedCount=0,importedSemesters=0;
  CALC_SEMESTERS.forEach(sem=>{
    if(Array.isArray(parsed[sem])){
      const rows=parsed[sem].map(sanitizeCalcRow).filter(Boolean);
      calcData[sem]=rows;
      importedCount+=rows.length;
      importedSemesters++;
    }
  });
  if(importedCount===0){
    errEl.textContent='JSON 안에서 유효한 과목 데이터를 찾지 못했어요.';errEl.style.display='block';return;
  }
  currentCalcSemester=CALC_SEMESTERS.find(sem=>(calcData[sem]||[]).length)||'1-1';
  renderCalcTabs();renderCalcTable();calcAll();
  closeImportModal();
  saveCalcData();
  toast(`${importedSemesters}개 학기 · 과목 ${importedCount}개를 불러왔습니다 ✓`);
}

function emptyCalcData(){
  const d={};
  CALC_SEMESTERS.forEach(sem=>d[sem]=[]);
  return d;
}

// ── 내신 성적 Supabase 저장/로드 ──
const CALC_DB_KEY='nae_shin_grades'; // user_metadata 키

async function saveCalcData(){
  if(!currentUser)return;
  const {error}=await sb.auth.updateUser({
    data:{...currentUser.user_metadata,[CALC_DB_KEY]:JSON.stringify(calcData)}
  });
  if(error)console.error('내신 성적 저장 실패:', error.message);
  else currentUser.user_metadata[CALC_DB_KEY]=JSON.stringify(calcData);
}

async function loadCalcData(){
  const raw=currentUser?.user_metadata?.[CALC_DB_KEY];
  if(!raw)return null;
  try{
    const parsed=JSON.parse(raw);
    if(!parsed||typeof parsed!=='object')return null;
    // 학기 키 검증 및 sanitize
    const d=emptyCalcData();
    CALC_SEMESTERS.forEach(sem=>{
      if(Array.isArray(parsed[sem])){
        d[sem]=parsed[sem].map(sanitizeCalcRow).filter(Boolean);
      }
    });
    return d;
  }catch(e){return null;}
}

async function initCalc(){
  const loaded=await loadCalcData();
  calcData=loaded||emptyCalcData();
  renderCalcTabs();
  renderCalcTable();
  calcAll();
}

function clearCalcSemester(){
  if(!confirm(`${currentCalcSemester} 학기 과목을 모두 비울까요?`))return;
  calcData[currentCalcSemester]=[];
  renderCalcTable();calcAll();saveCalcData();
}

function renderCalcTabs(){
  const el=document.getElementById('calc-semester-tabs');
  el.innerHTML=CALC_SEMESTERS.map(sem=>{
    const cnt=(calcData[sem]||[]).length;
    return`<button class="view-btn${sem===currentCalcSemester?' active':''}" onclick="switchCalcSemester('${sem}')">${sem}${cnt?` (${cnt})`:''}</button>`;
  }).join('');
}

function switchCalcSemester(sem){
  currentCalcSemester=sem;
  renderCalcTabs();renderCalcTable();
}

function catOptions(sel){
  return CALC_CATEGORIES.map(c=>`<option value="${c}"${c===sel?' selected':''}>${c}</option>`).join('');
}

function renderCalcTable(){
  const rows=calcData[currentCalcSemester]||[];
  const body=document.getElementById('calc-table-body');
  if(!rows.length){
    body.innerHTML='<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--ink-48);font-size:13px">이 학기에 입력된 과목이 없어요. 아래에서 과목을 추가하세요.</td></tr>';
  }else{
    body.innerHTML=rows.map((r,i)=>{
      const isGeneral=r.type==='general';
      const gradeCell=isGeneral
        ?`<input class="calc-cell-input calc-grade-input" type="number" min="1" max="9" value="${r.grade??''}" onchange="updateCalcField(${i},'grade',this.value)">`
        :`<select class="calc-cell-select" onchange="updateCalcField(${i},'achievement',this.value)">${['A','B','C','P'].map(a=>`<option value="${a}"${a===r.achievement?' selected':''}>${a}</option>`).join('')}</select>`;
      return`<tr>
        <td><input class="calc-cell-input" type="text" value="${escAttr(r.name)}" onchange="updateCalcField(${i},'name',this.value)"></td>
        <td><select class="calc-cell-select" onchange="updateCalcField(${i},'category',this.value)">${catOptions(r.category)}</select></td>
        <td><input class="calc-cell-input calc-unit-input" type="number" min="0.5" step="0.5" value="${r.unit}" onchange="updateCalcField(${i},'unit',this.value)"></td>
        <td><select class="calc-cell-select" onchange="updateCalcField(${i},'type',this.value)">
          <option value="general"${isGeneral?' selected':''}>일반선택</option>
          <option value="career"${!isGeneral?' selected':''}>진로선택</option>
        </select></td>
        <td>${gradeCell}</td>
        <td><button class="calc-row-del" onclick="removeCalcSubject(${i})" title="삭제">×</button></td>
      </tr>`;
    }).join('');
  }
  const totalUnit=rows.reduce((s,r)=>s+(+r.unit||0),0);
  const generalRows=rows.filter(r=>r.type==='general'&&r.grade);
  const gUnit=generalRows.reduce((s,r)=>s+(+r.unit||0),0);
  const semAvg=gUnit?(generalRows.reduce((s,r)=>s+r.grade*r.unit,0)/gUnit).toFixed(2):'—';
  document.getElementById('calc-semester-summary').textContent=`이 학기 이수학점 합계 ${totalUnit}단위 · 일반선택 평균 등급 ${semAvg}`;
}

function updateCalcField(idx,field,value){
  const row=calcData[currentCalcSemester][idx];
  if(field==='unit')row.unit=Math.max(0.5,+value||1);
  else if(field==='grade')row.grade=Math.min(9,Math.max(1,+value||1));
  else row[field]=value;
  if(field==='type'){
    if(value==='career'&&row.grade!=null){row.achievement=row.achievement||'A';}
    if(value==='general'&&row.grade==null)row.grade=3;
  }
  renderCalcTable();renderCalcTabs();calcAll();saveCalcData();
}

function addCalcSubject(){
  calcData[currentCalcSemester].push({name:'새 과목',category:'기타',unit:2,type:'general',grade:3});
  renderCalcTable();renderCalcTabs();calcAll();saveCalcData();
}

function removeCalcSubject(idx){
  calcData[currentCalcSemester].splice(idx,1);
  renderCalcTable();renderCalcTabs();calcAll();saveCalcData();
}

function calcAll(){
  // 전체 학기의 일반선택 과목만 모아 교과군별 단위수 가중평균 계산
  const all=CALC_SEMESTERS.flatMap(sem=>calcData[sem]||[]).filter(r=>r.type==='general'&&r.grade);
  const catAvg={};
  CALC_CATEGORIES.forEach(cat=>{
    const rows=all.filter(r=>r.category===cat);
    const u=rows.reduce((s,r)=>s+(+r.unit||0),0);
    catAvg[cat]=u?rows.reduce((s,r)=>s+r.grade*r.unit,0)/u:null;
    catAvg[cat+'_unit']=u;
  });
  document.getElementById('calc-category-tiles').innerHTML=CALC_CATEGORIES.map(cat=>{
    const v=catAvg[cat];
    return`<div class="stat-tile calc-cat-tile"><div class="calc-cat-name">${cat}</div><div class="calc-cat-val">${v!=null?v.toFixed(2):'—'}</div><div class="calc-cat-unit">${catAvg[cat+'_unit']}단위</div></div>`;
  }).join('');

  const totalUnit=all.reduce((s,r)=>s+(+r.unit||0),0);
  const overallAvg=totalUnit?(all.reduce((s,r)=>s+r.grade*r.unit,0)/totalUnit):null;
  document.getElementById('calc-avg').textContent=overallAvg!=null?overallAvg.toFixed(2):'—';
}

// NEWS
let allNewsData = [];

async function renderNews(){
  // 요약 로드
  const today = new Date().toISOString().slice(0,10);
  const {data:summaryData} = await sb.from('news_summary').select('*').eq('date', today).order('created_at',{ascending:false}).limit(1);
  const summaryEl = document.getElementById('news-summary-text');
  const summaryDate = document.getElementById('news-summary-date');
  if(summaryData&&summaryData.length){
    summaryEl.textContent = summaryData[0].summary;
    summaryDate.textContent = today;
  } else {
    summaryEl.textContent = '아직 오늘의 요약이 없습니다. 관리자가 수집하면 표시됩니다.';
  }

  // 뉴스 목록 로드
  const el = document.getElementById('news-list');
  el.innerHTML='<div style="text-align:center;padding:24px;color:var(--ink-48);font-size:13px">뉴스 불러오는 중...</div>';
  const {data,error} = await sb.from('news').select('*').order('published_at',{ascending:false}).limit(50);
  if(error||!data||!data.length){
    el.innerHTML='<div style="text-align:center;padding:24px;color:var(--ink-48);font-size:13px">뉴스를 불러올 수 없습니다.<br>관리자 페이지에서 수집해주세요.</div>';
    return;
  }
  allNewsData = data;
  renderNewsList(data);
}

function renderNewsList(data){
  const el = document.getElementById('news-list');
  if(!data.length){el.innerHTML='<div style="text-align:center;padding:24px;color:var(--ink-48);font-size:13px">해당 카테고리 뉴스가 없습니다</div>';return}
  const isAdmin = currentRole==='admin'||currentRole==='owner';
  el.innerHTML=data.map(n=>{
    const date=new Date(n.published_at).toLocaleDateString('ko-KR',{month:'numeric',day:'numeric'});
    const delBtn=isAdmin?`<button onclick="deleteNews('${n.id}',event)" style="margin-left:8px;font-size:11px;color:var(--ink-48);background:none;border:none;cursor:pointer;flex-shrink:0;padding:2px 6px;border-radius:4px;transition:all .15s" onmouseover="this.style.color='#c00'" onmouseout="this.style.color='var(--ink-48)'">✕</button>`:'';
    return`<div class="news-item" id="news-${n.id}">
      <span class="news-tag" style="cursor:default">${n.category}</span>
      <div style="flex:1;cursor:pointer" onclick="window.open('${n.url}','_blank')">
        <div class="news-title">${n.title}</div>
        <div class="news-date">${date}</div>
      </div>
      ${delBtn}
    </div>`;
  }).join('');
}

async function deleteNews(id, event){
  event.stopPropagation();
  if(!confirm('이 뉴스를 삭제할까요?'))return;
  const {error}=await sb.from('news').delete().eq('id',id);
  if(error){toast('삭제 실패: '+error.message);return}
  // 화면에서 바로 제거
  document.getElementById(`news-${id}`)?.remove();
  allNewsData=allNewsData.filter(n=>n.id!==id);
  toast('삭제되었습니다');
}

function filterNews(category){
  // 필터 버튼 활성화
  document.querySelectorAll('#news-filter-btns .view-btn').forEach(btn=>{
    btn.classList.toggle('active', btn.textContent===(category||'전체'));
  });
  const filtered = category ? allNewsData.filter(n=>n.category===category) : allNewsData;
  renderNewsList(filtered);
}

document.getElementById('login-pw').addEventListener('keydown',e=>{if(e.key==='Enter')doLogin()});
document.getElementById('login-id').addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('login-pw').focus()});
document.getElementById('setup-name').addEventListener('keydown',e=>{if(e.key==='Enter')saveName()});

restoreSession();
</script>
</body>
</html>
