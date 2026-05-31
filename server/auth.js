import jwt from "jsonwebtoken";
export function signToken(payload){ return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "8h" }); }
export function requireAuth(req,res,next){
  const h = req.headers.authorization || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  if(!m) return res.status(401).json({ error:"Missing bearer token" });
  try{ req.user = jwt.verify(m[1], process.env.JWT_SECRET); return next(); }
  catch{ return res.status(401).json({ error:"Invalid token" }); }
}
export function requireRole(roles){
  const allowed = Array.isArray(roles)?roles:[roles];
  return (req,res,next)=> allowed.includes(req.user?.role) ? next() : res.status(403).json({ error:"Forbidden" });
}
