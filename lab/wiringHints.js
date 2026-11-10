// Prefer the S/V/G column used by the current GPIO21 firmware.
// With the DIGITAL V rail at 5V, use the dedicated 3V3 supply instead.
export function dhtHintSocket(pin, digitalVoltage) {
  if(pin==='DATA')return 'GPIO21';
  if(pin==='GND')return 'GND@DIGITAL21';
  if(pin==='VCC')return digitalVoltage==='3V3'?'3V3@DIGITAL21':'3V3';
  return null;
}
