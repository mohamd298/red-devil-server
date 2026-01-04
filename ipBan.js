const bannedIPs = new Set();

export const banIP = (ip) => bannedIPs.add(ip);

export default function ipBan(req, res, next) {
  if (bannedIPs.has(req.ip)) {
    return res.sendStatus(403);
  }
  next();
}
