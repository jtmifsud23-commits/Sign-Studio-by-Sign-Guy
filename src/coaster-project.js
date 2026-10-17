// Fixed production specification for the Custom Drink Coaster four-pack.
export function validateCoasterProject(project) {
  const config=project.config,c=config?.coaster,d=config?.dimensions;
  const hex=value=>typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value);
  if(!c||!d||d.diameterMm!==101.66||d.widthMm!==101.66||d.heightMm!==101.66||d.depthMm!==4||config.packSize!==4||config.construction!=='single-sided-flush')throw new Error('Invalid coaster dimensions or construction');
  if(!Number.isSafeInteger(c.packs)||c.packs<1||c.packs>99||config.totalCoasters!==c.packs*4)throw new Error('Invalid coaster pack quantity');
  if(!project.source?.dataUrl||!c.preparedDataUrl||!hex(c.backing)||!Array.isArray(c.palette)||!c.palette.length||c.palette.length>8||c.palette.some(p=>!hex(p.colour)||p.height!==0))throw new Error('Invalid coaster artwork or colours');
  const text=c.wizardEdit?.textBoxes||[];
  if(!Array.isArray(text)||text.some(box=>!hex(box.colour)))throw new Error('Invalid coaster text colours');
  if(new Set([c.backing,...c.palette.map(p=>p.colour),...text.map(box=>box.colour)].map(value=>value.toLowerCase())).size>8)throw new Error('Coasters are limited to eight total colours');
  if(!project.outputArtwork?.pngDataUrl||!project.outputArtwork?.svgText||project.outputArtwork.widthMm!==101.66||project.outputArtwork.heightMm!==101.66||project.outputArtwork.depthMm!==4)throw new Error('Finished coaster artwork is required');
}
