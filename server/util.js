export function slugify(text=""){
  return text.toLowerCase().trim().replace(/["']/g,"").replace(/[^a-z0-9]+/g,"-").replace(/-+/g,"-").replace(/(^-|-$)/g,"");
}
export function nowIso(){ return new Date().toISOString(); }
