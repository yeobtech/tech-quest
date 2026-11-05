import type {Sample} from '../observatory/sensor';
export interface TimedSample extends Sample {at:number}
export interface MeasurementEvidence {source:'serial';samples:TimedSample[];recordedAt:string}
export const validSample=(s:Sample|null):s is Sample=>!!s&&Number.isFinite(s.temperature)&&s.temperature>=0&&s.temperature<=50&&Number.isFinite(s.humidity)&&s.humidity>=0&&s.humidity<=100;
// Host receive cadence: 2 s firmware interval with 0.5 s tolerance. This is not sensor authenticity attestation.
export class MeasurementRun {
 private samples:TimedSample[]=[];private connected=false;
 open(){this.samples=[];this.connected=true}
 close(){this.samples=[];this.connected=false}
 get count(){return this.samples.length}
 receive(source:'serial'|'mock',sample:Sample|null,at=Date.now()){
  if(!this.connected||source!=='serial'||!validSample(sample)||!Number.isFinite(at)){this.samples=[];return}
  const last=this.samples.at(-1);if(last&&(at-last.at<1500||at-last.at>2500))this.samples=[];
  this.samples.push({...sample,at});this.samples=this.samples.slice(-3);
 }
 expire(at=Date.now()){if(this.samples.length&&at-this.samples.at(-1)!.at>5500)this.samples=[]}
 evidence():MeasurementEvidence|null{return this.connected&&this.samples.length===3?{source:'serial',samples:structuredClone(this.samples),recordedAt:new Date(this.samples[2].at).toISOString()}:null}
}
export function readMeasurement(raw:unknown):MeasurementEvidence|null{
 const r=raw as MeasurementEvidence|null;if(r?.source!=='serial'||!Array.isArray(r.samples)||r.samples.length!==3)return null;
 const run=new MeasurementRun();run.open();for(const s of r.samples){if(!s||!Number.isFinite(s.at)||s.at<0||s.at>8640000000000000)return null;run.receive('serial',s,s.at)}return run.evidence();
}
