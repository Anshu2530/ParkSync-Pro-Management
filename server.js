import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient } from 'mongodb';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PREFERRED_PORT = Number(process.env.PORT) || 3000;
const MAX_PORT_TRIES = 20;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/parking-system';

let db;
let client;
let clientPromise;

async function connectDb() {
  if (!clientPromise) {
    client = new MongoClient(MONGODB_URI);
    clientPromise = client.connect().then(async () => {
      db = client.db();
      await initDb();
      return db;
    });
  }
  await clientPromise;
  return db;
}

async function getNextSequence(name) {
  const coll = db.collection('counters');
  const result = await coll.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true }
  );
  return result ? result.seq : 1;
}

async function initDb() {
  const zonesCol = db.collection('parking_zones');
  
  // Ensure default admin exists
  const usersCol = db.collection('users');
  const userCount = await usersCol.countDocuments();
  if (userCount === 0) {
    await usersCol.insertOne({ username: 'admin', password: 'admin123', role: 'Admin', created_at: new Date() });
  }

  const count = await zonesCol.countDocuments();
  if (count === 0) {
    console.log('Database empty: Seeding default zones and spots...');
    const zoneId1 = await getNextSequence('zoneId');
    const zoneId2 = await getNextSequence('zoneId');
    await zonesCol.insertMany([
      { _id: zoneId1, name: 'Main Floor', description: 'General access ground floor parking', hourly_rate: 50, created_at: new Date() },
      { _id: zoneId2, name: 'VIP Deck', description: 'Reserved secure parking area', hourly_rate: 200, created_at: new Date() }
    ]);

    const spotsCol = db.collection('parking_spots');
    let spots = [];
    for(let i=1; i<=40; i++) {
        spots.push({
            _id: await getNextSequence('spotId'),
            zone_id: zoneId1,
            spot_number: `A-${String(i).padStart(2, '0')}`,
            type: i <= 5 ? 'motorcycle' : (i <= 35 ? 'standard' : 'compact'),
            status: 'available'
        });
    }
    for(let i=1; i<=20; i++) {
        spots.push({
            _id: await getNextSequence('spotId'),
            zone_id: zoneId2,
            spot_number: `VIP-${String(i).padStart(2, '0')}`,
            type: 'standard',
            status: 'available'
        });
    }
    await spotsCol.insertMany(spots);
    console.log('Database seeded.');
  }
}

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); } catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

function sendJSON(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(data));
}

function sendError(res, msg, status = 500) {
  sendJSON(res, { error: msg }, status);
}

function serveStatic(req, res, urlPath) {
  let filePath = path.join(__dirname, 'public', urlPath === '/' ? 'index.html' : urlPath);
  if (!filePath.startsWith(path.join(__dirname, 'public'))) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(__dirname, 'public', 'index.html');
  }
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'text/plain';
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
}

const api = {};

api['POST /api/login'] = async (req, res) => {
  await connectDb();
  const body = await parseBody(req);
  const usersCol = db.collection('users');
  const user = await usersCol.findOne({ username: body.username, password: body.password });
  
  if (user) {
    sendJSON(res, { token: 'parksync-token-' + user._id, username: user.username, role: user.role });
  } else {
    sendError(res, 'Invalid credentials. Please check your username and password.', 401);
  }
};

api['POST /api/register'] = async (req, res) => {
  await connectDb();
  const body = await parseBody(req);
  if (!body.username || !body.password) {
    return sendError(res, 'Username and password are required', 400);
  }

  const usersCol = db.collection('users');
  const existing = await usersCol.findOne({ username: body.username });
  if (existing) {
    return sendError(res, 'Username already exists! Please choose another one or login.', 400);
  }

  const newUser = {
    username: body.username,
    password: body.password,
    role: 'Admin',
    created_at: new Date()
  };

  await usersCol.insertOne(newUser);
  sendJSON(res, { success: true, message: 'Account created successfully!' });
};

api['GET /api/dashboard/stats'] = async (_req, res) => {
  await connectDb();
  const spotsCol = db.collection('parking_spots');
  const sessionsCol = db.collection('parking_sessions');

  const spots = await spotsCol.find().toArray();
  const total = spots.length;
  const available = spots.filter(s => s.status === 'available').length;
  const occupied = spots.filter(s => s.status === 'occupied').length;
  const reserved = spots.filter(s => s.status === 'reserved').length;
  const maintenance = spots.filter(s => s.status === 'maintenance').length;
  
  const activeSessions = await sessionsCol.countDocuments({ status: 'active' });
  
  const today = new Date();
  today.setHours(0,0,0,0);
  const todaySessions = await sessionsCol.find({ entry_time: { $gte: today } }).toArray();
  
  const todayRevenue = todaySessions.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);
  const todayVehicles = todaySessions.length;

  sendJSON(res, {
    totalSpots: total,
    availableSpots: available,
    occupiedSpots: occupied,
    reservedSpots: reserved,
    maintenanceSpots: maintenance,
    activeSessions: activeSessions,
    todayRevenue: todayRevenue,
    todayVehicles: todayVehicles,
    occupancyRate: total > 0 ? Math.round((occupied / total) * 100) : 0,
  });
};

api['GET /api/parking-zones'] = async (_req, res) => {
  await connectDb();
  const zonesCol = db.collection('parking_zones');
  const spotsCol = db.collection('parking_spots');

  const zones = await zonesCol.find().sort({ _id: 1 }).toArray();
  const result = await Promise.all(zones.map(async z => {
    const spots = await spotsCol.find({ zone_id: z._id }).toArray();
    const available = spots.filter(s => s.status === 'available').length;
    const occupied = spots.filter(s => s.status === 'occupied').length;
    return {
      id: z._id, name: z.name, description: z.description,
      totalSpots: spots.length, availableSpots: available,
      occupiedSpots: occupied, hourlyRate: parseFloat(z.hourly_rate),
      createdAt: z.created_at,
    };
  }));
  sendJSON(res, result);
};

api['POST /api/parking-zones'] = async (req, res) => {
  await connectDb();
  const body = await parseBody(req);
  if (!body.name || !body.hourlyRate) return sendError(res, 'name and hourlyRate required', 400);
  
  const zonesCol = db.collection('parking_zones');
  const newZone = {
    _id: await getNextSequence('zoneId'),
    name: body.name,
    description: body.description || null,
    hourly_rate: Number(body.hourlyRate),
    created_at: new Date()
  };
  await zonesCol.insertOne(newZone);

  sendJSON(res, {
    id: newZone._id, name: newZone.name, description: newZone.description,
    totalSpots: 0, availableSpots: 0, occupiedSpots: 0,
    hourlyRate: parseFloat(newZone.hourly_rate), createdAt: newZone.created_at,
  }, 201);
};

api['GET /api/parking-spots'] = async (_req, res, urlObj) => {
  await connectDb();
  const spotsCol = db.collection('parking_spots');
  const zonesCol = db.collection('parking_zones');
  const sessionsCol = db.collection('parking_sessions');

  const zoneId = urlObj.searchParams.get('zoneId');
  const status = urlObj.searchParams.get('status');
  
  const query = {};
  if (zoneId) query.zone_id = Number(zoneId);
  if (status) query.status = status;

  const spots = await spotsCol.find(query).sort({ zone_id: 1, spot_number: 1 }).toArray();
  const zones = await zonesCol.find().toArray();
  const zoneMap = Object.fromEntries(zones.map(z => [z._id, z.name]));

  const result = await Promise.all(spots.map(async s => {
    let vehiclePlate = null;
    if (s.status === 'occupied') {
        const session = await sessionsCol.findOne({ spot_id: s._id, status: 'active' });
        if (session) vehiclePlate = session.vehicle_plate;
    }
    return {
      id: s._id, zoneId: s.zone_id, zoneName: zoneMap[s.zone_id] || '',
      spotNumber: s.spot_number, type: s.type, status: s.status,
      vehiclePlate,
    };
  }));

  sendJSON(res, result);
};

api['GET /api/parking-sessions'] = async (_req, res, urlObj) => {
  await connectDb();
  const sessionsCol = db.collection('parking_sessions');
  const spotsCol = db.collection('parking_spots');
  const zonesCol = db.collection('parking_zones');

  const status = urlObj.searchParams.get('status');
  const limit = urlObj.searchParams.get('limit');
  
  const query = {};
  if (status) query.status = status;

  let cursor = sessionsCol.find(query).sort({ entry_time: -1 });
  if (limit) cursor = cursor.limit(Number(limit));
  
  const sessions = await cursor.toArray();
  
  const result = await Promise.all(sessions.map(async s => {
    const spot = await spotsCol.findOne({ _id: s.spot_id });
    const zoneName = spot ? (await zonesCol.findOne({ _id: spot.zone_id }))?.name : '';

    let dur = s.duration_minutes;
    let amt = s.total_amount ? parseFloat(s.total_amount) : null;
    if (s.exit_time && !dur) {
      dur = Math.round((new Date(s.exit_time) - new Date(s.entry_time)) / 60000);
      amt = Math.round(((dur / 60) * parseFloat(s.hourly_rate)) * 100) / 100;
    }

    return {
      id: s._id, spotId: s.spot_id, spotNumber: spot ? spot.spot_number : '', zoneName: zoneName || '',
      vehiclePlate: s.vehicle_plate, vehicleType: s.vehicle_type, driverName: s.driver_name,
      entryTime: s.entry_time, exitTime: s.exit_time,
      durationMinutes: dur, hourlyRate: parseFloat(s.hourly_rate), totalAmount: amt, status: s.status,
    };
  }));

  sendJSON(res, result);
};

api['POST /api/parking-sessions'] = async (req, res) => {
  await connectDb();
  const body = await parseBody(req);
  if (!body.spotId || !body.vehiclePlate || !body.vehicleType)
    return sendError(res, 'spotId, vehiclePlate, vehicleType required', 400);
  
  const spotsCol = db.collection('parking_spots');
  const zonesCol = db.collection('parking_zones');
  const sessionsCol = db.collection('parking_sessions');

  const spotId = Number(body.spotId);
  const spot = await spotsCol.findOne({ _id: spotId });
  if (!spot) return sendError(res, 'Spot not found', 404);
  if (spot.status !== 'available') return sendError(res, 'Spot is not available', 400);
  
  const zone = await zonesCol.findOne({ _id: spot.zone_id });
  
  const newSession = {
    _id: await getNextSequence('sessionId'),
    spot_id: spotId,
    vehicle_plate: body.vehiclePlate.toUpperCase(),
    vehicle_type: body.vehicleType,
    driver_name: body.driverName || null,
    hourly_rate: zone.hourly_rate,
    status: 'active',
    entry_time: new Date(),
    exit_time: null,
    duration_minutes: null,
    total_amount: null
  };

  await sessionsCol.insertOne(newSession);
  await spotsCol.updateOne({ _id: spotId }, { $set: { status: 'occupied' } });

  sendJSON(res, {
    id: newSession._id, spotId: newSession.spot_id, spotNumber: spot.spot_number, zoneName: zone.name,
    vehiclePlate: newSession.vehicle_plate, vehicleType: newSession.vehicle_type, driverName: newSession.driver_name,
    entryTime: newSession.entry_time, exitTime: null, durationMinutes: null,
    hourlyRate: parseFloat(newSession.hourly_rate), totalAmount: null, status: 'active',
  }, 201);
};

const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://localhost`);
  const pathname = urlObj.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (pathname.startsWith('/api/')) {
    const checkoutMatch = pathname.match(/^\/api\/parking-sessions\/(\d+)\/checkout$/);
    if (checkoutMatch && req.method === 'POST') {
      await connectDb();
      const sessionsCol = db.collection('parking_sessions');
      const spotsCol = db.collection('parking_spots');
      const zonesCol = db.collection('parking_zones');

      const sessionId = parseInt(checkoutMatch[1]);
      try {
        const session = await sessionsCol.findOne({ _id: sessionId });
        if (!session) return sendError(res, 'Session not found', 404);
        if (session.status === 'completed') return sendError(res, 'Already completed', 400);
        
        const exitTime = new Date();
        const dur = Math.round((exitTime - new Date(session.entry_time)) / 60000);
        const amt = Math.round(((dur / 60) * parseFloat(session.hourly_rate)) * 100) / 100;
        
        const updatedDoc = await sessionsCol.findOneAndUpdate(
          { _id: sessionId },
          { $set: { exit_time: exitTime, duration_minutes: dur, total_amount: amt, status: 'completed' } },
          { returnDocument: 'after' }
        );
        const updated = updatedDoc;

        await spotsCol.updateOne({ _id: session.spot_id }, { $set: { status: 'available' } });
        
        const spot = await spotsCol.findOne({ _id: session.spot_id });
        const zone = spot ? await zonesCol.findOne({ _id: spot.zone_id }) : null;

        sendJSON(res, {
          id: updated._id, spotId: updated.spot_id,
          spotNumber: spot?.spot_number || '', zoneName: zone?.name || '',
          vehiclePlate: updated.vehicle_plate, vehicleType: updated.vehicle_type,
          driverName: updated.driver_name, entryTime: updated.entry_time,
          exitTime: updated.exit_time, durationMinutes: updated.duration_minutes,
          hourlyRate: parseFloat(updated.hourly_rate), totalAmount: parseFloat(updated.total_amount),
          status: 'completed',
        });
      } catch (e) { console.error(e); sendError(res, 'Internal server error'); }
      return;
    }

    const key = `${req.method} ${pathname}`;
    const handler = api[key];
    if (handler) {
      try { await handler(req, res, urlObj); }
      catch (e) { console.error(e); sendError(res, 'Internal server error'); }
    } else {
      sendError(res, 'Not found', 404);
    }
    return;
  }

  serveStatic(req, res, pathname);
});

function startServer(initialPort) {
  let currentPort = initialPort;
  let attempts = 0;

  const tryListen = () => {
    attempts += 1;

    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE' && attempts < MAX_PORT_TRIES) {
        currentPort += 1;
        console.warn(`Port ${currentPort - 1} is in use, trying ${currentPort}...`);
        tryListen();
        return;
      }

      console.error('Failed to start server:', err);
      process.exit(1);
    });

    server.listen(currentPort, '0.0.0.0', () => {
      console.log(`ParkSync Pro server running on port ${currentPort}`);
    });
  };

  tryListen();
}

startServer(PREFERRED_PORT);
