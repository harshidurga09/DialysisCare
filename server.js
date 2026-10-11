require('dotenv').config({ path: require('path').join(__dirname,'.env') });
const express = require('express');
const path = require('path');
const db = require("./db");
const app = express();
const PORT = Number(process.env.PORT) || 3000;
app.disable('x-powered-by');
app.use(express.json({limit:'50kb'}));
app.use(express.static(path.join(__dirname,'../frontend')));
app.get('/', (_,res)=>res.redirect('/home.html'));
app.get('/api/health', async (_,res)=>{
  try { await db.query('SELECT 1'); res.json({success:true,message:'Backend and MySQL connected successfully!'}); }
  catch(err){ console.error('MySQL:',err.code,err.message); res.status(503).json({success:false,message:'Database unavailable',errorCode:err.code||'UNKNOWN'}); }
});
function safeText(v,n){return typeof v==='string' && v.trim().length>0 && v.trim().length<=n ? v.trim():null;}
function validDate(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s||'')) return false; const d = new Date(s+'T00:00:00Z'); return !isNaN(d) && d.toISOString().slice(0,10)===s;}
function validTime(s){return /^([01]\d|2[0-3]):[0-5]\d$/.test(s||'');}
app.get('/api/schedules',async(req,res)=>{
  try{const [rows]=await db.query('SELECT id,DATE_FORMAT(session_date, "%Y-%m-%d") AS date,TIME_FORMAT(session_time, "%H:%i") AS time,center,notes FROM demo_schedules ORDER BY session_date,session_time');res.json({success:true,data:rows});}
  catch(err){console.error(err);res.status(500).json({success:false,message:'Could not retrieve schedules'});}
});
app.post('/api/schedules',async(req,res)=>{
 const {date,time,center,notes=''}=req.body||{};
 if(!validDate(date)||!validTime(time)||!safeText(center,120)||typeof notes!=='string'||notes.length>500) return res.status(400).json({success:false,message:'Enter a valid date, time, center (up to 120 characters) and notes (up to 500 characters).'});
 try{const [result]=await db.execute('INSERT INTO demo_schedules(session_date,session_time,center,notes) VALUES(?,?,?,?)',[date,time,center.trim(),notes.trim()]);res.status(201).json({success:true,id:result.insertId});}
 catch(err){console.error(err);res.status(500).json({success:false,message:'Could not save schedule'});}
});
app.delete('/api/schedules/:id',async(req,res)=>{
 if(!/^\d+$/.test(req.params.id))return res.status(400).json({success:false,message:'Invalid ID'});
 try{const [result]=await db.execute('DELETE FROM demo_schedules WHERE id=?',[req.params.id]);res.json({success:true,deleted:result.affectedRows});}
 catch(err){console.error(err);res.status(500).json({success:false,message:'Could not delete schedule'});}
});
app.get('/api/medications',async(req,res)=>{
 try{const [rows]=await db.query('SELECT id,name,instructions FROM demo_medications ORDER BY id DESC');res.json({success:true,data:rows});}
 catch(err){console.error(err);res.status(500).json({success:false,message:'Could not retrieve medications'});}
});
app.post('/api/medications',async(req,res)=>{
 const {name,instructions}=req.body||{};
 if(!safeText(name,150)||!safeText(instructions,500))return res.status(400).json({success:false,message:'Enter a medication name (up to 150 characters) and prescription instructions (up to 500 characters).'});
 try{const [result]=await db.execute('INSERT INTO demo_medications(name,instructions) VALUES(?,?)',[name.trim(),instructions.trim()]);res.status(201).json({success:true,id:result.insertId});}
 catch(err){console.error(err);res.status(500).json({success:false,message:'Could not save medication'});}
});
app.delete('/api/medications/:id',async(req,res)=>{
 if(!/^\d+$/.test(req.params.id))return res.status(400).json({success:false,message:'Invalid ID'});
 try{const [result]=await db.execute('DELETE FROM demo_medications WHERE id=?',[req.params.id]);res.json({success:true,deleted:result.affectedRows});}
 catch(err){console.error(err);res.status(500).json({success:false,message:'Could not delete medication'});}
});
async function start(){
 try{
  await db.query(`CREATE TABLE IF NOT EXISTS demo_schedules (id INT AUTO_INCREMENT PRIMARY KEY,session_date DATE NOT NULL,session_time TIME NOT NULL,center VARCHAR(120) NOT NULL,notes VARCHAR(500) NOT NULL DEFAULT '',created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
  await db.query(`CREATE TABLE IF NOT EXISTS demo_medications (id INT AUTO_INCREMENT PRIMARY KEY,name VARCHAR(150) NOT NULL,instructions VARCHAR(500) NOT NULL,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
  app.listen(PORT,'127.0.0.1',()=>console.log(`DialysisCare demo: http://localhost:${PORT} (localhost only)`));
 }catch(err){console.error('Database startup error:',err.code,err.message);process.exitCode=1;}
}
start();
