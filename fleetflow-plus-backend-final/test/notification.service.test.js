const test=require("node:test");
const assert=require("node:assert/strict");
const Module=require("node:module");
const records=[];const signals=[];let writes=0;
const matches=(r,q)=>Object.entries(q).every(([k,v])=>r[k]===v);
const Notification={
  init:async()=>{},
  exists:async q=>records.some(r=>matches(r,q)),
  updateOne:async(q,update,opts)=>{writes++;const r=records.find(x=>matches(x,q));if(r){if(update.$set)Object.assign(r,update.$set);return {modifiedCount:update.$set?1:0};}if(opts?.upsert){records.push({_id:String(records.length+1),readAt:null,createdAt:new Date(),...update.$setOnInsert});return {upsertedCount:1};}return {modifiedCount:0};},
  updateMany:async(q,u)=>{const found=records.filter(x=>matches(x,q));for(const r of found)Object.assign(r,u.$set);return {modifiedCount:found.length};},
  find:q=>({sort:()=>({limit:()=>({lean:async()=>records.filter(r=>matches(r,q))})})}),
  countDocuments:async q=>records.filter(r=>matches(r,q)).length,
};
const User={find:()=>({select:()=>({lean:async()=>[{_id:"admin"}]})})};
const oldLoad=Module._load;Module._load=function(name,...args){if(name==="../model/notification.model")return Notification;if(name==="../model/auth.model")return User;if(name==="../config/socket")return {notify:id=>signals.push(id)};return oldLoad.call(this,name,...args);};
let service;try{service=require("../src/services/notification.service");}finally{Module._load=oldLoad;}
const user={id:"customer",name:"Customer One",role:"customer",isEmailVerified:true};
test("verification creates one welcome record per account and an admin activity record",async()=>{await service.verified(user);await service.verified(user);assert.equal(records.filter(r=>r.recipient===user.id).length,1);assert.equal(records.filter(r=>r.recipient==="admin").length,1);assert.ok(signals.includes(user.id));assert.ok(signals.includes("admin"));});
test("listing and marking notifications read is scoped to recipient",async()=>{const mine=await service.list(user);assert.equal(mine.unreadCount,1);const admin=await service.list({id:"admin",role:"admin",isEmailVerified:true});assert.equal(admin.unreadCount,1);await service.markOne(user.id,admin.items[0].id);assert.equal((await service.list({id:"admin",role:"admin",isEmailVerified:true})).unreadCount,1);await service.markAll(user.id);assert.equal((await service.list(user)).unreadCount,0);assert.equal((await service.list({id:"admin",role:"admin",isEmailVerified:true})).unreadCount,1);});
test("a missing welcome record is restored on authenticated list",async()=>{const other={id:"driver",name:"Driver One",role:"driver",isEmailVerified:true};const list=await service.list(other);assert.equal(list.items.length,1);assert.equal(list.items[0].kind,"welcome");});

test("subsequent list requests never rewrite existing welcome events",async()=>{const before=writes;await service.list(user);await service.list(user);assert.equal(writes,before);});
test("customer, driver and dispatcher events are mirrored to admin but isolated from one another",async()=>{const dispatcher={id:"dispatch",name:"Dispatcher",role:"dispatcher",isEmailVerified:true};const driver={id:"driver",name:"Driver One",role:"driver",isEmailVerified:true};await service.security(user,"Customer event","Signed in");await service.security(driver,"Driver event","Signed in");await service.verified(dispatcher);await service.security(dispatcher,"Dispatcher event","Signed in");const admin=await service.list({id:"admin",role:"admin"});for(const title of ["Customer event","Driver event","Dispatcher event"])assert.ok(admin.items.some(n=>n.title===title));assert.ok(!(await service.list(user)).items.some(n=>n.title==="Driver event"||n.title==="Dispatcher event"));assert.ok(!(await service.list(driver)).items.some(n=>n.title==="Customer event"||n.title==="Dispatcher event"));const before=admin.unreadCount;await service.markAll(dispatcher.id);assert.equal((await service.list(dispatcher)).unreadCount,0);assert.equal((await service.list({id:"admin",role:"admin"})).unreadCount,before);});
