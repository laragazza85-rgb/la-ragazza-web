export function methodNotAllowed(allowedMethods) {
  const allowValue = allowedMethods.join(", ");

  return (_req, res) => {
    res.setHeader("Allow", allowValue);
    res.status(405).json({ error: `Metodo no permitido. Use: ${allowValue}` });
  };
}

