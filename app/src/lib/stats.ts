import { daysInMonth, todayParts } from './dates';
import type { LifeData, MonthDoc } from './types';
export function elapsedDays(m: MonthDoc){const t=todayParts(),tot=daysInMonth(m.year,m.month);if(t.year===m.year&&t.month===m.month)return t.day;return(m.year>t.year||(m.year===t.year&&m.month>t.month))?0:tot;}
export function habitCount(m:MonthDoc,hid:string){return m.habitDays[hid]?.length??0;}
export function habitPercent(m:MonthDoc,hid:string){const e=elapsedDays(m);return e?Math.round((habitCount(m,hid)/e)*100):0;}
export function habitStreak(m:MonthDoc,hid:string){const t=todayParts();if(t.year!==m.year||t.month!==m.month)return 0;const mk=new Set(m.habitDays[hid]??[]);let d=mk.has(t.day)?t.day:t.day-1,s=0;while(d>=1&&mk.has(d)){s++;d--;}return s;}
export function documentedDays(m:MonthDoc){return Object.values(m.highlights).filter(t=>t.trim()).length;}
export function habitMarks(m:MonthDoc){return Object.values(m.habitDays).reduce((s,d)=>s+d.length,0);}
export function possibleMarks(m:MonthDoc){return m.habits.length*elapsedDays(m);}
export function monthCompletion(m:MonthDoc){const p=possibleMarks(m);return p?Math.round((habitMarks(m)/p)*100):0;}
export function challengeProgress(m:MonthDoc){if(!m.challenge)return{done:0,missed:0,open:0,pct:0};const ms=Object.values(m.challenge.marks);const done=ms.filter(x=>x==='done').length,missed=ms.filter(x=>x==='missed').length,el=elapsedDays(m);return{done,missed,open:Math.max(0,Math.min(m.challenge.days,el)-done-missed),pct:done+missed?Math.round((done/(done+missed))*100):0};}
export function goalsProgress(m:MonthDoc){return{done:m.goals.filter(g=>g.done).length,total:m.goals.length};}
export function goalPercent(g:{target?:number;current?:number;done:boolean}){if(g.done)return 100;if(g.target&&g.target>0&&typeof g.current==='number')return Math.max(0,Math.min(100,Math.round((g.current/g.target)*100)));return 0;}
export function latestMetricValue(m:MonthDoc,mid:string):{day:number;value:number}|null{const e=m.metricEntries[mid];if(!e)return null;const ds=Object.keys(e).map(Number).sort((a,b)=>a-b);if(!ds.length)return null;const d=ds[ds.length-1];return{day:d,value:e[String(d)]};}
export function sortedMonths(d:LifeData){return[...d.months].sort((a,b)=>a.id<b.id?1:-1);}
export function monthsOfYear(d:LifeData,y:number){return sortedMonths(d).filter(m=>m.year===y);}
export interface YearFigures{monthsDocumented:number;daysDocumented:number;habitMarks:number;goalsCompleted:number;challengesAttempted:number;challengesHeld:number;highlightsKept:number;totals:{name:string;unit:string;value:number}[];}
export function yearFigures(d:LifeData,y:number):YearFigures{const ms=monthsOfYear(d,y);const tallies=new Map<string,{unit:string;value:number}>();let hm=0,gc=0,ca=0,ch=0,dd=0,hk=0;for(const m of ms){hm+=habitMarks(m);gc+=m.goals.filter(g=>g.done).length;if(m.challenge){ca++;const cp=challengeProgress(m);if(cp.pct>=80)ch++;}dd+=documentedDays(m);hk+=Object.values(m.highlights).filter(t=>t.trim()).length;for(const met of m.metrics){const lat=latestMetricValue(m,met.id);if(!lat)continue;const ex=tallies.get(met.name);const add=['km','pages','₹','hours'].includes(met.unit);if(!ex)tallies.set(met.name,{unit:met.unit,value:lat.value});else if(add)tallies.set(met.name,{...ex,value:ex.value+lat.value});else tallies.set(met.name,{unit:met.unit,value:lat.value});}}return{monthsDocumented:ms.length,daysDocumented:dd,habitMarks:hm,goalsCompleted:gc,challengesAttempted:ca,challengesHeld:ch,highlightsKept:hk,totals:[...tallies.entries()].map(([n,v])=>({name:n,unit:v.unit,value:v.value})).slice(0,6)};}
