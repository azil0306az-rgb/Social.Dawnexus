let appInstance: any = null;
let initError: any = null;

try {
  const mod = await import('../server/index.js');
  appInstance = mod.default || mod;
} catch (err: any) {
  initError = {
    message: err?.message,
    stack: err?.stack,
    name: err?.name,
  };
}

export default function handler(req: any, res: any) {
  if (initError) {
    return res.status(500).json({
      error: 'Backend Initialization Failure',
      details: initError,
      timestamp: new Date().toISOString()
    });
  }

  return appInstance(req, res);
}
