import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * output: 'export' genera la carpeta frontend/out/ con HTML/CSS/JS puro.
   * Flask sirve esos archivos estáticos en la ruta /.
   * Esto elimina la necesidad de tener Node.js corriendo en el Arduino Uno Q.
   *
   * Para compilar:  cd frontend && npm run build
   * Los archivos quedan en:  frontend/out/
   */
  output: "export",

  /**
   * Las imágenes de Next.js requieren un servidor Node.js para optimizarse;
   * con output: 'export' deshabilitamos la optimización automática.
   */
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
