import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { isAdminRequest } from "@/lib/admin-auth";

function unauthorized(){return NextResponse.json({error:"Sessão administrativa inválida ou expirada."},{status:401});}
function sample(points:any[],max=2500){if(!Array.isArray(points))return[];if(points.length<=max)return points.map((p)=>[p[0],p[1]]);const step=(points.length-1)/(max-1);return Array.from({length:max},(_,i)=>{const p=points[Math.round(i*step)];return[p[0],p[1]]});}
function distanceM(a:[number,number],b:[number,number]){const r=6371000,dLat=(b[0]-a[0])*Math.PI/180,dLon=(b[1]-a[1])*Math.PI/180,lat1=a[0]*Math.PI/180,lat2=b[0]*Math.PI/180;const v=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;return 2*r*Math.asin(Math.min(1,Math.sqrt(v)));}
function checkpointResult(checkpoint:any,points:any[]){let nearest=Number.POSITIVE_INFINITY;for(const p of points??[]){const value=distanceM([checkpoint.latitude,checkpoint.longitude],[p[0],p[1]]);if(value<nearest)nearest=value;if(nearest<5)break;}return{...checkpoint,hit:nearest<=checkpoint.radius_m,nearest_distance_m:Number.isFinite(nearest)?Math.round(nearest):0};}

export async function GET(request:NextRequest){
  if(!isAdminRequest(request))return unauthorized();
  try{
    const supabase=createSupabaseAdmin();
    const {data:validations,error}=await supabase.from("validation_results").select("id, activity_id, stage_id, status, coverage_percent, start_ok, finish_ok, direction_ok, checkpoints_passed, checkpoints_total, max_deviation_m, notes, validated_at, created_at, updated_at").order("updated_at",{ascending:false});
    if(error)throw error;
    const activityIds=[...new Set((validations??[]).map(v=>v.activity_id))];const stageIds=[...new Set((validations??[]).map(v=>v.stage_id))];
    const {data:activities,error:activityError}=activityIds.length?await supabase.from("activities").select("id, athlete_id, stage_id, source, source_activity_id, name, started_at, distance_km, elevation_m, moving_time_s, gps_points, created_at").in("id",activityIds):{data:[],error:null};if(activityError)throw activityError;
    const athleteIds=[...new Set((activities??[]).map(a=>a.athlete_id))];
    const {data:athletes,error:athleteError}=athleteIds.length?await supabase.from("athletes").select("id, full_name, strava_athlete_id, category, country_code").in("id",athleteIds):{data:[],error:null};if(athleteError)throw athleteError;
    const {data:stages,error:stageError}=stageIds.length?await supabase.from("stages").select("id, name, route_label, stage_date, distance_km, elevation_m").in("id",stageIds):{data:[],error:null};if(stageError)throw stageError;
    const {data:routes,error:routeError}=stageIds.length?await supabase.from("route_versions").select("id, stage_id, version, file_name, route_points, is_active").in("stage_id",stageIds).eq("is_active",true):{data:[],error:null};if(routeError)throw routeError;
    const {data:checkpoints,error:checkpointError}=stageIds.length?await supabase.from("checkpoints").select("id, stage_id, sequence, label, latitude, longitude, radius_m").in("stage_id",stageIds).order("sequence",{ascending:true}):{data:[],error:null};if(checkpointError)throw checkpointError;
    const activityMap=new Map((activities??[]).map(a=>[a.id,a]));const athleteMap=new Map((athletes??[]).map(a=>[a.id,a]));const stageMap=new Map((stages??[]).map(s=>[s.id,s]));const routeMap=new Map((routes??[]).map(r=>[r.stage_id,r]));
    const items=(validations??[]).map(v=>{const activity:any=activityMap.get(v.activity_id);const athlete=activity?athleteMap.get(activity.athlete_id):null;const stage=stageMap.get(v.stage_id);const route:any=routeMap.get(v.stage_id);const rawPoints=activity?.gps_points??[];const stageCheckpoints=(checkpoints??[]).filter(c=>c.stage_id===v.stage_id).map(c=>checkpointResult(c,rawPoints));return{...v,activity:activity?{...activity,gps_points:sample(rawPoints)}:null,athlete,stage,route:route?{...route,route_points:sample(route.route_points)}:null,checkpoints:stageCheckpoints};});
    const summary={total:items.length,validated:items.filter(i=>i.status==="validated").length,review:items.filter(i=>i.status==="review").length,rejected:items.filter(i=>i.status==="rejected").length,pending:items.filter(i=>i.status==="pending").length};
    return NextResponse.json({summary,items});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Falha ao carregar revisões."},{status:500});}
}

export async function PATCH(request:NextRequest){
  if(!isAdminRequest(request))return unauthorized();
  try{
    const body=await request.json() as {validationId?:string;decision?:"validated"|"rejected"|"review";note?:string};const validationId=String(body.validationId??"");const decision=body.decision;const note=String(body.note??"").trim();
    if(!validationId||!decision||!["validated","rejected","review"].includes(decision))return NextResponse.json({error:"Decisão inválida."},{status:400});
    const supabase=createSupabaseAdmin();const {data:current,error:currentError}=await supabase.from("validation_results").select("id, notes").eq("id",validationId).single();if(currentError||!current)return NextResponse.json({error:"Validação não encontrada."},{status:404});
    const label=decision==="validated"?"APROVADA":decision==="rejected"?"REJEITADA":"MANTIDA EM REVISÃO";const decisionText=`DECISÃO DA ORGANIZAÇÃO (${new Date().toLocaleString("pt-BR")}): ${label}${note?` — ${note}`:""}`;const notes=[current.notes,decisionText].filter(Boolean).join("\n\n");
    const {error}=await supabase.from("validation_results").update({status:decision,notes,validated_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",validationId);if(error)throw error;return NextResponse.json({updated:true,status:decision});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Falha ao registrar decisão."},{status:500});}
}
