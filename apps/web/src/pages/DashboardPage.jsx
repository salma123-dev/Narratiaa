import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import { api } from "../services/appApi";
import "./DashboardPage.css";

export default function DashboardPage({user,onLogout,onNavigate}){
 const[books,setBooks]=useState([]),[stats,setStats]=useState(null);
 useEffect(()=>{Promise.all([api.books(),api.stats()]).then(([b,s])=>{setBooks(b.books);setStats(s.stats)})},[]);
 const current=books.find(b=>b.status==="reading")||books[0],upNext=books.filter(b=>b.status==="want_to_read").slice(0,3),first=user.fullName.split(" ")[0];
 const today=useMemo(()=>new Intl.DateTimeFormat("en",{weekday:"long",month:"long",day:"numeric"}).format(new Date()),[]);
 const dailyValue=stats?(stats.goal.dailyType==="pages"?stats.today.pages:stats.today.minutes):0,dailyPercent=stats?Math.min(100,Math.round(dailyValue/stats.goal.dailyTarget*100)):0;
 return <AppShell user={user} active="dashboard" onNavigate={onNavigate} onLogout={onLogout}>
  <header className="page-head dashboard-welcome"><div><p className="eyebrow">{today}</p><h1>Good evening, {first}.</h1><p>Every page is a new place to begin.</p></div><button className="gold-button" onClick={()=>onNavigate("/library")}>＋ Add a book</button></header>
  <section className="home-grid">
   <article className="panel home-current"><div className="home-title"><div><p className="eyebrow">CURRENTLY READING</p><h2>{current?"Continue your journey":"Begin your journey"}</h2></div></div>{current?<div className="home-book"><div className="home-cover">{current.coverUrl?<img src={current.coverUrl} alt=""/>:<div><small>{current.author}</small><strong>{current.title}</strong><span>◇</span></div>}</div><div className="home-book-copy"><span>{current.genre||"BOOK"}</span><h3>{current.title}</h3><p>{current.author}</p><div className="home-progress"><div><span>Page {current.currentPage} of {current.totalPages}</span><strong>{Math.round(current.currentPage/current.totalPages*100)}%</strong></div><div><span style={{width:`${current.currentPage/current.totalPages*100}%`}}/></div></div><button className="gold-button" onClick={()=>onNavigate(`/books/${current.id}`)}>Continue Reading →</button></div></div>:<div className="empty-home"><p>Your library is empty.</p><button className="gold-button" onClick={()=>onNavigate("/library")}>Add your first book</button></div>}</article>
   <aside className="panel home-goal"><p className="eyebrow">DAILY GOAL</p><h2>{dailyPercent>=100?"Goal achieved!":"Keep it going!"}</h2><div className="home-ring" style={{"--goal":`${dailyPercent*3.6}deg`}}><div><strong>{dailyValue}</strong><small>of {stats?.goal.dailyTarget||30} {stats?.goal.dailyType||"pages"}</small></div></div><p>{dailyPercent}% completed today</p><div className="home-streak">♨ <strong>{stats?.streak||0} day streak</strong></div></aside>
  </section>
  <section className="home-lower"><article className="panel home-next"><div className="home-title"><div><p className="eyebrow">YOUR LIBRARY</p><h2>Up next</h2></div><button onClick={()=>onNavigate("/library")}>View library →</button></div>{upNext.length?upNext.map(book=><button className="next-row" key={book.id} onClick={()=>onNavigate(`/books/${book.id}`)}><span className="next-cover">{book.coverUrl?<img src={book.coverUrl} alt=""/>:"◇"}</span><span><strong>{book.title}</strong><small>{book.author}</small></span><i>→</i></button>):<p className="muted-home">No books waiting. Add your next read.</p>}</article>
   <article className="panel home-stats"><div className="home-title"><div><p className="eyebrow">YOUR PROGRESS</p><h2>Reading at a glance</h2></div><button onClick={()=>onNavigate("/stats")}>Details →</button></div><div>{[[stats?.completedBooks||0,"Books finished"],[stats?.pagesRead||0,"Pages read"],[`${Math.round((stats?.minutesRead||0)/60)}h`,"Reading time"],[stats?.streak||0,"Day streak"]].map(([v,l])=><span key={l}><strong>{v}</strong><small>{l}</small></span>)}</div></article>
  </section>
 </AppShell>
}
