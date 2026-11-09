const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export function monthId(y: number, m: number) { return `${y}-${String(m).padStart(2,'0')}`; }
export function daysInMonth(y: number, m: number) { return new Date(y, m, 0).getDate(); }
export function monthName(m: number) { return MONTHS[m-1]; }
export function monthLabel(y: number, m: number) { return `${monthName(m)} ${y}`; }
export function dayOfWeek(y: number, m: number, d: number) { return new Date(y, m-1, d).getDay(); }
export function monthGrid(y: number, m: number, w0: 0|1=1) { const t=daysInMonth(y,m), f=dayOfWeek(y,m,1), l=(f-w0+7)%7, c: (number|null)[] = Array.from({length:l},()=>null); for(let i=1;i<=t;i++) c.push(i); return c; }
export function todayParts() { const n=new Date(); return { year:n.getFullYear(), month:n.getMonth()+1, day:n.getDate() }; }
export function todayMonthId() { const {year,month}=todayParts(); return monthId(year,month); }
export function formatLongDate(y:number,m:number,d:number){return `${d} ${monthName(m)} ${y}`;}
export function formatShortDate(y:number,m:number,d:number){return `${d} ${SHORT[m-1]}`;}
export function isWeekend(y:number,m:number,d:number){const w=dayOfWeek(y,m,d);return w===0||w===6;}
export function nextMonth(y:number,m:number){return m===12?{year:y+1,month:1}:{year:y,month:m+1};}
export function prevMonth(y:number,m:number){return m===1?{year:y-1,month:12}:{year:y,month:m-1};}
export function formatTimestamp(iso:string){const d=new Date(iso);return `${d.getDate()} ${SHORT[d.getMonth()]} · ${d.toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit',hour12:false})}`;}
export function todayIsoDate(){const {year,month,day}=todayParts();return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;}
